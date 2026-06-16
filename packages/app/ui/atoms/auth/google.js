
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { useAutoDiscovery } from 'expo-auth-session';  // <-- here
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { NeoButton } from 'app/design/controls'
import { useRef, useEffect, useState } from 'react';
import { appSetting } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect'
import { FormError } from 'app/components/form-fields/_field';
import { View } from 'app/design/view'
import { useRouter, redirectTo } from 'app/lib/hooks/router'

WebBrowser.maybeCompleteAuthSession();

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

function AuthGoogleButton({ googleSettings }) {
    const { t } = useTranslation()
    const redirectRef = useRef();
    const [error, setError] = useState(false);
    const router = useRouter();

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

    const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    const redirectUri = makeRedirectUri({
        useProxy: true,
    });

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: googleSettings.web_client_id,
            iosClientId: googleSettings.ios_client_id,
            androidClientId: googleSettings.android_client_id,
            redirectUri,
            responseType: ResponseType.Token,
            scopes: ['profile', 'email'],
        },
        discovery
    );

    useEffect(() => {
        const fetchData = async (user) => {
            const result = await fetcher('/api.php?r=bx_googlecon/handle/&params[]=' + JSON.stringify(user));
            if (result?.data[0]?.data?.uri)
                redirectTo(router, result.data[0].data.uri);

            if (result?.data[0]?.type == 'msg')
                setError(result.data[0].data);

        };
        if (response?.type === 'success') {
            const accessToken = response.authentication.accessToken
            fetchUserInfo(accessToken).then(user => {

                fetchData(user)
            });


        }

    }, [response]);


    return (

        <View className="w-full">
            <Redirect ref={redirectRef} />
            <NeoButton
                disabled={!request}
                label={t("Continue with Google")}
                onPress={() => promptAsync({ useProxy: true })}
                width="fill"
                controlSize="regular"
                style="glass"
                image="Google"
            />
            {error && <FormError errorText={error} />}
        </View>

    );
}