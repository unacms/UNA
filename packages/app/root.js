"use client"
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useCurrentUser, seedCurrentUserFromPageData, isWebAuthReady } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { clearClientSessionState } from 'app/lib/session-cleanup';
import { useRouter, redirectTo } from 'app/lib/hooks/router'
import Layouts from 'app/components/layouts';
import { useSetScrollDirection, useSetScrollValue } from 'app/context/jotai/layout';
import { Loading } from 'app/customization/loading';
import emitter from 'app/context/emitter';
import { Platform } from 'react-native'
import { useWindowScrollNavigationSync } from 'app/lib/hooks/use-window-scroll-navigation-sync';

export function Root(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();

    const prevUserIdRef = useRef(currentUser?.id);
    const router = useRouter();
    useWindowScrollNavigationSync();

    const data = props?.data;
    const redirectUrl = data?.redirect;

    // Seed Zustand before paint; must not run setState during render (Subscriber et al. subscribe to the store).
    useLayoutEffect(() => {
        seedCurrentUserFromPageData(data);
    }, [data]);
    // ################## CODE FOR NATIVE VERSION

    useEffect(() => {
        // Skip: first render (prevUserIdRef not set yet)
        if (prevUserIdRef.current === undefined) {
            prevUserIdRef.current = currentUser?.id;
            return;
        }
        // Skip: value unchanged
        if (prevUserIdRef.current === currentUser?.id) return;

        prevUserIdRef.current = currentUser?.id;

        // Reload only on user change, not on initial load
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.reload();
        } else {
            emitter.emit('page', { action: 'reload' });
        }
    }, [currentUser?.id]);


    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();

    useEffect(() => {
        // Reset scroll state when page data changes
        setScrollDirection(0);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            setScrollValue(window.scrollY || document.documentElement.scrollTop || 0);
        } else {
            setScrollValue(0);
        }
    }, [props?.path, props?.data?.url, setScrollDirection, setScrollValue]);

    useEffect(() => {
        if (data?.user) {
            if (currentUser?.id != data.user.id) {
                // Login or switch account: never reuse previous session's client caches.
                clearClientSessionState();
                setCurrentUser(data.user);
                storageClear();
            }
            if (currentUser?.current_context && currentUser?.current_context != data.user.current_context) {
                setCurrentUser(data.user);
                storageClear();
            }
            if (currentUser && currentUser?.informer != data.user.informer) {
                setCurrentUser({
                    informer: data.user.informer,
                });
            }
        }
        else {
            // Session ended (logout / expired): only full-clear when leaving a logged-in user.
            if (currentUser?.id) {
                clearClientSessionState();
            }
            setCurrentUser(false);
            storageClear();
        }

    }, [data?.user]);

    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }

    useEffect(() => {
        if (redirectUrl) {
            redirectTo(router, redirectUrl);
        }
    }, [redirectUrl]);


    if (!isWebAuthReady(data, currentUser)) {
        return null;
    }

    if (data.redirect) {
        return null; 
    }

    return (
        <Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} />
    );
}
