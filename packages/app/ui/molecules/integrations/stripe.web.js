import * as React from 'react';
import { loadStripe } from '@stripe/stripe-js/pure';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { APP_URL } from 'app/config';
import { useRouter, redirectTo } from 'app/lib/hooks/router';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useTranslation } from 'react-i18next';

const PROVIDER = 'stripe_v3';

/** UNA `urlEncode` for checkout redirect param (base64). */
function unaUrlEncode(value) {
    if (typeof btoa !== 'function') return '';
    try {
        return btoa(unescape(encodeURIComponent(String(value ?? ''))));
    } catch {
        return btoa(String(value ?? ''));
    }
}

/** Session id from Checkout `client_secret` (`cs_…_secret_…`). */
function sessionIdFromClientSecret(clientSecret) {
    if (!clientSecret || typeof clientSecret !== 'string') return '';
    const idx = clientSecret.indexOf('_secret_');
    return idx > 0 ? clientSecret.slice(0, idx) : '';
}

function itemsToParam(items) {
    if (Array.isArray(items)) return items.join('&');
    return items == null ? '' : String(items);
}

/**
 * Fallback redirect for initialize_checkout_api 5th param (UNA URL_SUBSCRIPTIONS / URL_HISTORY).
 * Navigation always uses `data.url` from the finalize response.
 */
function defaultRedirectPath(paymentType) {
    return paymentType === 'recurring' ? '/payment-sbs-list-my' : '/payment-cart-history';
}

async function paymentAction(action, params) {
    let qs;
    if (Array.isArray(params)) {
        qs = params.map((p) => `params[]=${encodeURIComponent(p ?? '')}`).join('&');
    } else {
        qs = `params[]=${encodeURIComponent(JSON.stringify(params))}`;
    }
    return fetcher(`/api.php?r=bx_payment/${action}&${qs}`);
}

export default function ElementStripe({ seller_id, items, payment_type }) {
    const { t } = useTranslation();
    const router = useRouter();
    const itemsParam = itemsToParam(items);
    const [publicKey, setPublicKey] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [stripePromise, setStripePromise] = useState(null);
    const [phase, setPhase] = useState('loading'); // loading | checkout | finalizing | error
    const [errorMessage, setErrorMessage] = useState('');
    const completingRef = useRef(false);
    const checkoutRef = useRef({
        seller_id,
        items: itemsParam,
        payment_type,
        redirectEncoded: unaUrlEncode(defaultRedirectPath(payment_type)),
    });

    useEffect(() => {
        checkoutRef.current = {
            ...checkoutRef.current,
            seller_id,
            items: itemsParam,
            payment_type,
            redirectEncoded:
                checkoutRef.current.redirectEncoded ||
                unaUrlEncode(defaultRedirectPath(payment_type)),
        };
    }, [seller_id, itemsParam, payment_type]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await paymentAction('get_provider_options', [seller_id, PROVIDER]);
            const oData = res?.data;
            if (cancelled || !oData?.name || oData.name !== PROVIDER || !oData?.options) return;

            const mode = parseInt(oData.options.strp_v3_mode?.value, 10);
            const key =
                mode === 1
                    ? oData.options.strp_v3_live_pub_key?.value
                    : oData.options.strp_v3_test_pub_key?.value;
            if (!key) return;
            setPublicKey(key);
        })();
        return () => {
            cancelled = true;
        };
    }, [seller_id]);

    useEffect(() => {
        if (!publicKey) return;
        setStripePromise(loadStripe(publicKey));
    }, [publicKey]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await paymentAction('stripe_v3_create_session_api', {
                type: payment_type,
                seller_id,
                items: itemsParam,
                return_url: APP_URL,
                // UNA must forward this into the Checkout Session (see
                // packages/app/customization/resources/stripe-v3-una.md).
                redirect_on_completion: 'if_required',
            });
            if (cancelled) return;

            const secret = res?.data?.clientSecret;
            if (res?.data?.redirect_encoded) {
                checkoutRef.current.redirectEncoded = res.data.redirect_encoded;
            } else if (res?.data?.redirect) {
                checkoutRef.current.redirectEncoded = unaUrlEncode(res.data.redirect);
            } else {
                checkoutRef.current.redirectEncoded = unaUrlEncode(
                    defaultRedirectPath(payment_type)
                );
            }

            if (secret) {
                setClientSecret(secret);
                setPhase('checkout');
            } else {
                setPhase('error');
                setErrorMessage(t('payment_init_error'));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [seller_id, itemsParam, payment_type, t]);

    const finalizeAndRedirect = useCallback(async () => {
        if (completingRef.current) return;
        completingRef.current = true;
        setPhase('finalizing');

        const { seller_id: sid, items: itemsParam, payment_type: pType, redirectEncoded } =
            checkoutRef.current;
        const sessionId = sessionIdFromClientSecret(clientSecret);
        if (!sessionId) {
            setPhase('error');
            setErrorMessage(t('payment_error'));
            completingRef.current = false;
            return;
        }

        try {
            const qs = [pType, sid, PROVIDER, itemsParam, redirectEncoded]
                .map((p) => `params[]=${encodeURIComponent(p ?? '')}`)
                .join('&');
            const res = await fetcher(
                `/api.php?r=bx_payment/initialize_checkout_api&${qs}&session_id=${encodeURIComponent(sessionId)}`
            );
            const url = res?.data?.url;
            if (url) {
                redirectTo(router, url);
                return;
            }
            setPhase('error');
            setErrorMessage(
                typeof res?.data === 'string'
                    ? res.data
                    : res?.data?.message || t('payment_error')
            );
        } catch {
            setPhase('error');
            setErrorMessage(t('payment_error'));
        } finally {
            completingRef.current = false;
        }
    }, [clientSecret, router, t]);

    const onComplete = useCallback(() => {
        void finalizeAndRedirect();
    }, [finalizeAndRedirect]);

    if (phase === 'error') {
        return (
            <View className="p-4">
                <Text className="text-destructive">{errorMessage}</Text>
            </View>
        );
    }

    if (phase === 'finalizing') {
        return (
            <View className="p-4">
                <Text className="text-muted-foreground">{t('Loading...')}</Text>
            </View>
        );
    }

    if (!clientSecret || !stripePromise) {
        return (
            <View className="p-4">
                <Text className="text-muted-foreground">{t('Loading...')}</Text>
            </View>
        );
    }

    return (
        <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret, onComplete }}
        >
            <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
    );
}
