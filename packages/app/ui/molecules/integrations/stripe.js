import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { fetcher } from 'app/lib/fetcher';
import { APP_URL } from 'app/config';
import { View } from 'app/design/view'
import { NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function NativeStripe({ seller_id, items, payment_type }) {
    const { t } = useTranslation();
    const [publishableKey, setPublishableKey] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    async function performAction(action, params) {
        let qs = '';
        if (Array.isArray(params)) {
            qs = params.map(p => `params[]=${encodeURIComponent(p)}`).join('&');
        } else {
            qs = `params[]=${encodeURIComponent(JSON.stringify(params))}`;
        }
        const res = await fetcher(`/api.php?r=bx_payment/${action}&${qs}`);
        return res?.data;
    }

    useEffect(() => {
        (async () => {
            const data = await performAction('get_provider_options', [seller_id, 'stripe_v3']);
            if (data?.name !== 'stripe_v3' || !data.options) return;

            const mode = parseInt(data.options.strp_v3_mode.value, 10);
            const key = mode === 1
                ? data.options.strp_v3_live_pub_key.value
                : data.options.strp_v3_test_pub_key.value;

            if (key) setPublishableKey(key);
        })();
    }, [seller_id]);

    useEffect(() => {
        if (!publishableKey) return;
        initStripe({
            publishableKey,
            merchantIdentifier: 'merchant.your.id', // if needed
            urlScheme: 'your-url-scheme',           // for 3DS/bank redirects
        });
    }, [publishableKey]);

    // 3) Create session and get clientSecret
    useEffect(() => {
        (async () => {
            const session = await performAction('stripe_v3_create_session_api', {
                type: payment_type,
                seller_id,
                items: items.join('&'),
                return_url: APP_URL,
            });
            if (session?.clientSecret) {
                setClientSecret(session.clientSecret);
            }
        })();
    }, [seller_id, items]);

    // 4) Initialize PaymentSheet
    useEffect(() => {
        if (!clientSecret) return;
        (async () => {
            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                merchantDisplayName: 'Example, Inc.',
            });
            if (error) {
                console.error(t('payment_init_error'), error);
            }
        })();
    }, [clientSecret]);
    const onPayPress = async () => {
        const { error } = await presentPaymentSheet();
        if (error) {
            console.error(t('payment_error'), error);
            Alert.alert(t('Error'), error.message);
        } else {
            Alert.alert(t('Success'), t('payment_success_message'));
        }
    };

    return (
        <View className='p-4'>
            <NeoButton
                label={t('Pay')}
                onPress={onPayPress}
                disabled={!clientSecret}
            />
        </View>
    );
}
