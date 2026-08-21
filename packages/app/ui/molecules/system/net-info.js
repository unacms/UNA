'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import * as SplashScreen from 'expo-splash-screen';
import { useTranslation } from 'react-i18next';

/** Don't block UI on the first offline signal (iOS often sends a false offline on resume). */
const OFFLINE_DEBOUNCE_MS = 1500;
/** Re-check immediately after returning from background. */
const RESUME_RECHECK_MS = 500;
/** If NetInfo never resolves, don't keep the native splash forever. */
const NETINFO_FALLBACK_MS = 2500;
const SPLASH_HIDE_RETRY_MS = 200;
const SPLASH_HIDE_MAX_ATTEMPTS = 10;
/** hideAsync can hang on Android — never wait forever. */
const SPLASH_HIDE_ATTEMPT_MS = 800;

function isOnline(state) {
    if (!state || state.isConnected === false) return false;
    // iOS: isInternetReachable is unreliable on background → foreground (null/false on a live network).
    if (Platform.OS !== 'ios' && state.isInternetReachable === false) return false;
    return true;
}

function hideSplashWithTimeout() {
    return Promise.race([
        SplashScreen.hideAsync(),
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Splash hide timeout')), SPLASH_HIDE_ATTEMPT_MS);
        }),
    ]);
}

export function NetworkStatus({ children }) {
    const { t } = useTranslation();
    /** null = no first NetInfo response yet (show neither tabs nor false offline) */
    const [blocked, setBlocked] = useState(null);

    const splashHidden = useRef(false);
    const splashHideInFlight = useRef(false);
    const offlineTimerRef = useRef(null);
    const offlinePendingRef = useRef(false);
    const resumeTimerRef = useRef(null);

    const clearOfflineTimer = useCallback(() => {
        if (offlineTimerRef.current) {
            clearTimeout(offlineTimerRef.current);
            offlineTimerRef.current = null;
        }
        offlinePendingRef.current = false;
    }, []);

    const hideSplashOnce = useCallback(() => {
        if (splashHidden.current || splashHideInFlight.current) return;
        splashHideInFlight.current = true;

        const attempt = (n = 0) => {
            hideSplashWithTimeout()
                .then(() => {
                    splashHidden.current = true;
                    splashHideInFlight.current = false;
                })
                .catch(() => {
                    if (n < SPLASH_HIDE_MAX_ATTEMPTS) {
                        setTimeout(() => attempt(n + 1), SPLASH_HIDE_RETRY_MS);
                        return;
                    }
                    // Mark done so we don't block forever; native splash may already be gone.
                    splashHidden.current = true;
                    splashHideInFlight.current = false;
                });
        };
        attempt();
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

        // Don't restart debounce on every Android NetInfo offline pulse — that can
        // keep blocked === null forever and look like a stuck splash.
        if (offlinePendingRef.current) return;

        offlinePendingRef.current = true;
        offlineTimerRef.current = setTimeout(() => {
            offlineTimerRef.current = null;
            offlinePendingRef.current = false;
            NetInfo.fetch().then((fresh) => {
                if (isOnline(fresh)) {
                    applyOnline();
                    return;
                }
                applyOfflineNow(fresh);
            });
        }, OFFLINE_DEBOUNCE_MS);
    }, [applyOnline, applyOfflineNow, hideSplashOnce]);

    useEffect(() => {
        NetInfo.fetch().then(sync);
        const unsub = NetInfo.addEventListener(sync);
        return () => {
            unsub();
            clearOfflineTimer();
        };
    }, [sync, clearOfflineTimer]);

    // Safety: if NetInfo hangs or debounce never settles, unblock UI and hide splash.
    useEffect(() => {
        const timer = setTimeout(() => {
            setBlocked((prev) => (prev === null ? false : prev));
            hideSplashOnce();
        }, NETINFO_FALLBACK_MS);
        return () => clearTimeout(timer);
    }, [hideSplashOnce]);

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
        setBlocked(null);
        NetInfo.fetch().then(applyOfflineNow);
    }, [applyOfflineNow, clearOfflineTimer]);

    if (blocked === null) {
        // Keep the real tree mounted so the native-tab shell can apply the
        // iOS edge offset immediately. A blank placeholder left the home-
        // indicator slab visible until tabs finished bootstrapping.
        return children;
    }

    if (blocked) {
        return (
            <View className="flex-1 items-center justify-center bg-background p-6 gap-4 ">
                <Text className="text-center text-base text-foreground">
                    {t('No internet connection')}
                </Text>
                <View><Button title={t('Check connection')} onPress={recheck} /></View>

            </View>
        );
    }

    return children;
}
