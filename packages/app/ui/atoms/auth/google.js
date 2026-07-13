
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { NeoButton } from 'app/design/controls'
import { useRef, useEffect, useState } from 'react';
import { appSetting, storageClear, getPageData } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect'
import { FormError } from 'app/components/form-fields/_field';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useRouter, redirectTo } from 'app/lib/hooks/router'

WebBrowser.maybeCompleteAuthSession();

/** Google Web OAuth only allows localhost/127.0.0.1 or public TLDs — not *.localhost (Portless). */
function isGoogleOAuthWebOriginAllowed() {
    if (typeof window === 'undefined') return true
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return true
    if (host.endsWith('.localhost') || host.endsWith('.local')) return false
    return true
}

export default function AuthGoogle({ }) {
    const googleSettings = appSetting('auth', 'google') || {}

    // The platform-specific client id must be configured (e.g. via the
    // GOOGLE_WEB_CLIENT_ID env var on web), otherwise expo-auth-session's
    // invariantClientId throws during render and crashes the whole page.
    // Bail out before any hooks run when it isn't set so the button is simply
    // hidden instead of breaking the auth panel.
    const platformClientId = Platform.select({
        ios: googleSettings.ios_client_id,
        android: googleSettings.android_client_id,
        default: googleSettings.web_client_id,
    });
    if (!platformClientId) {
        return null;
    }

    return <AuthGoogleButton googleSettings={googleSettings} />;
}

function redirectUriFromApiResult(result) {
    const items = Array.isArray(result?.data) ? result.data : [];
    const redirectItem = items.find((item) => item?.type === 'redirect');
    return redirectItem?.data?.uri ?? result?.data?.[0]?.data?.uri;
}

function errorMessageFromApiResult(result) {
    const items = Array.isArray(result?.data) ? result.data : [];
    const msgItem = items.find((item) => item?.type === 'msg');
    return msgItem?.data;
}

function AuthGoogleButton({ googleSettings }) {
    const { t } = useTranslation()
    const redirectRef = useRef();
    const [error, setError] = useState('');
    const router = useRouter();
    const { setCurrentUser } = useCurrentUser();
    const isWeb = Platform.OS === 'web';
    // Defer hostname check until after mount — SSR has no window, so reading it during render causes hydration mismatch.
    const [portlessBlocked, setPortlessBlocked] = useState(false);

    useEffect(() => {
        if (isWeb) {
            setPortlessBlocked(!isGoogleOAuthWebOriginAllowed());
        }
    }, [isWeb]);

    async function fetchUserInfo(accessToken) {
        try {
            const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const user = await res.json();
            return user;
        } catch (err) {
            console.error('Error:', err);
        }
    }

    // Must match Authorized JavaScript origins + redirect URIs in Google Cloud (public TLD or localhost only).
    const redirectUri = makeRedirectUri();

    const [request, response, promptAsync] = useAuthRequest({
        clientId: googleSettings.web_client_id,
        iosClientId: googleSettings.ios_client_id,
        androidClientId: googleSettings.android_client_id,
        redirectUri,
        // Implicit token flow in the browser — Google Web clients cannot exchange codes
        // without client_secret, which must never ship to the client bundle.
        responseType: ResponseType.Token,
        usePKCE: false,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        const completeSignIn = async (user) => {
            const result = await fetcher('/api.php?r=bx_googlecon/handle/&params[]=' + JSON.stringify(user));
            const uri = redirectUriFromApiResult(result);
            const errorMsg = errorMessageFromApiResult(result);

            if (errorMsg && !uri) {
                setError(String(errorMsg));
                return;
            }

            storageClear();

            const pagePath = uri
                ? (uri.startsWith('/') ? uri.slice(1) : uri)
                : 'home';
            const target = uri || '/home';

            if (isWeb) {
                // Full navigation reloads page JSON and seeds currentUser from the server.
                redirectTo(router, target);
                return;
            }

            try {
                const page = await getPageData(pagePath);
                if (page?.data?.user) {
                    setCurrentUser(page.data.user);
                }
            } catch (err) {
                console.error('Google auth: failed to refresh session', err);
            }

            redirectRef.current?.redirect?.(target);
        };

        if (response?.type === 'success') {
            const accessToken =
                response.authentication?.accessToken ??
                response.params?.access_token;
            if (!accessToken) return;
            fetchUserInfo(accessToken).then((user) => {
                if (user) completeSignIn(user);
            });
        } else if (response?.type === 'error') {
            setError(
                String(
                    response.error?.message ||
                    response.params?.error_description ||
                    response.errorCode ||
                    ''
                )
            );
        }

    }, [response, router, setCurrentUser, isWeb]);


    return (

        <View className="w-full">
            <Redirect ref={redirectRef} />
            {portlessBlocked ? (
                <Text className="text-xs text-center text-muted-foreground text-pretty">
                    {t('google_auth_portless_hint')}
                </Text>
            ) : (
                <NeoButton
                    disabled={!request}
                    label={t("Continue with Google")}
                    onPress={() => promptAsync()}
                    width="fill"
                    controlSize="large"
                    style="bordered"
                    image="Google"
                />
            )}
            {error && <FormError errorText={error} />}
        </View>

    );
}
