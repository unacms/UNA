'use client';

import { useCallback, useEffect, useState, useRef } from 'react';

import NetInfo from '@react-native-community/netinfo';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import * as SplashScreen from 'expo-splash-screen';

function isOnline(state) {
    if (!state || state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
}

export function NetworkStatus({ children }) {
    /** null = ещё не было первого ответа NetInfo (не показываем ни табы, ни ложный офлайн) */
    const [blocked, setBlocked] = useState(null);

    const splashHidden = useRef(false);

    const hideSplashOnce = useCallback(() => {
        if (!splashHidden.current) {
            splashHidden.current = true;
            void SplashScreen.hideAsync().catch(() => {});
        }
    }, []);

    const sync = useCallback((state) => {
        setBlocked(!isOnline(state));
        hideSplashOnce();
    }, [hideSplashOnce]);

    useEffect(() => {
        NetInfo.fetch().then(sync);
        const unsub = NetInfo.addEventListener(sync);
        return () => unsub();
    }, [sync]);

    const recheck = useCallback(() => {
        NetInfo.fetch().then(sync);
    }, [sync]);

    if (blocked === null) {
        return <View className="flex-1 bg-background" />;
    }

    if (blocked) {
        return (
            <View className="flex-1 items-center justify-center bg-background p-6 gap-4 ">
                <Text className="text-center text-base text-foreground">
                    No internet connection
                </Text>
                <View><Button title="Check connection" onPress={recheck} /></View>

            </View>
        );
    }

    return children;
}