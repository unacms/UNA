
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session/providers/google';
import { useAutoDiscovery } from 'expo-auth-session';  // <-- вот здесь
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { Button, Modal } from 'app/design/controls'
import { useRef, useEffect, useState } from 'react';
import { appSetting } from 'app/lib/util'
import { useTranslation } from 'react-i18next'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect'
import { Pressable } from 'app/design/view';
import { Text } from 'app/design/typography'
import { FormError } from 'app/components/form-fields/_field.js';
import { View } from 'app/design/view'
import { useRouter, redirectTo } from 'app/lib/hooks/router'

WebBrowser.maybeCompleteAuthSession();

export default function AuthGoogle({ button }) {
    const { t } = useTranslation()
    const googleSettings = appSetting('auth', 'google')
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
            console.log("result", result?.data[0]?.data)
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

        <View>
            <Redirect ref={redirectRef} />
            {button ? <Pressable onPress={() => promptAsync({ useProxy: true })}>{button}</Pressable> : <Button
                disabled={!request}
                title={t("Login with Google")}
                onPress={() => promptAsync({ useProxy: true })}
            />}
            {error && <FormError errorText={error} />}
        </View>

    );
}