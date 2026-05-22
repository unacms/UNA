'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import * as SplashScreen from 'expo-splash-screen';

/** Не блокируем UI по первому offline-сигналу (iOS часто шлёт ложный offline при resume). */
const OFFLINE_DEBOUNCE_MS = 1500;
/** Повторная проверка сразу после возврата из фона. */
const RESUME_RECHECK_MS = 500;

function isOnline(state) {
    if (!state || state.isConnected === false) return false;
    // iOS: isInternetReachable ненадёжен при background → foreground (null/false на живой сети).
    if (Platform.OS !== 'ios' && state.isInternetReachable === false) return false;
    return true;
}

export function NetworkStatus({ children }) {
    /** null = ещё не было первого ответа NetInfo (не показываем ни табы, ни ложный офлайн) */
    const [blocked, setBlocked] = useState(null);

    const splashHidden = useRef(false);
    const offlineTimerRef = useRef(null);
    const resumeTimerRef = useRef(null);

    const clearOfflineTimer = useCallback(() => {
        if (offlineTimerRef.current) {
            clearTimeout(offlineTimerRef.current);
            offlineTimerRef.current = null;
        }
    }, []);

    const hideSplashOnce = useCallback(() => {
        if (!splashHidden.current) {
            splashHidden.current = true;
            void SplashScreen.hideAsync().catch(() => {});
        }
    }, []);

    const applyOnline = useCallback(() => {
        clearOfflineTimer();
        setBlocked(false);
        hideSplashOnce();
    }, [clearOfflineTimer, hideSplashOnce]);

    const applyOfflineNow = useCallback((state) => {
        clearOfflineTimer();
        setBlocked(!isOnline(state));
        hideSplashOnce();
    }, [clearOfflineTimer, hideSplashOnce]);

    const sync = useCallback((state) => {
        hideSplashOnce();

        if (isOnline(state)) {
            applyOnline();
            return;
        }

        clearOfflineTimer();
        offlineTimerRef.current = setTimeout(() => {
            offlineTimerRef.current = null;
            NetInfo.fetch().then((fresh) => {
                if (isOnline(fresh)) {
                    applyOnline();
                    return;
                }
                applyOfflineNow(fresh);
            });
        }, OFFLINE_DEBOUNCE_MS);
    }, [applyOnline, applyOfflineNow, clearOfflineTimer, hideSplashOnce]);

    useEffect(() => {
        NetInfo.fetch().then(sync);
        const unsub = NetInfo.addEventListener(sync);
        return () => {
            unsub();
            clearOfflineTimer();
        };
    }, [sync, clearOfflineTimer]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (nextState !== 'active') return;

            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current);
            }
            resumeTimerRef.current = setTimeout(() => {
                resumeTimerRef.current = null;
                NetInfo.fetch().then(sync);
            }, RESUME_RECHECK_MS);
        });

        return () => {
            sub.remove();
            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current);
            }
        };
    }, [sync]);

    const recheck = useCallback(() => {
        clearOfflineTimer();
        NetInfo.fetch().then(applyOfflineNow);
    }, [applyOfflineNow, clearOfflineTimer]);

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
