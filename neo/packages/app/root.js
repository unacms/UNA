"use client"
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useCurrentUser, seedCurrentUserFromPageData, isWebAuthReady } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { clearClientSessionState } from 'app/lib/platform/session-cleanup';
import { useRouter, redirectTo } from 'app/lib/hooks/router'
import Layouts from 'app/components/layouts';
import { useSetScrollDirection, useSetScrollValue } from 'app/context/jotai/layout';
import emitter, { EVENTS } from 'app/context/emitter';
import { Platform } from 'react-native'
import { useWindowScrollNavigationSync } from 'app/lib/navigation/use-window-scroll-navigation-sync';
import { useIsTabSlideCopy } from 'app/context/tab-route-override';

export function Root(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();

    const prevUserIdRef = useRef(currentUser?.id);
    const router = useRouter();
    useWindowScrollNavigationSync();
    // The copy of a page that slides with the native tabs (components/nav/tab-slide.js) only draws: the page itself
    // keeps the viewer, scroll and redirects in sync. A copy held from another moment (a guest page kept over sign-in)
    // would otherwise sign the viewer out until the real page signs them back in.
    const isSlideCopy = useIsTabSlideCopy();

    const data = props?.data;
    const redirectUrl = data?.redirect;

    // Seed Zustand before paint; must not run setState during render (Subscriber et al. subscribe to the store).
    useLayoutEffect(() => {
        if (isSlideCopy) return;
        seedCurrentUserFromPageData(data);
    }, [data, isSlideCopy]);
    // ################## CODE FOR NATIVE VERSION

    useEffect(() => {
        if (isSlideCopy) return;
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
            emitter.emit(EVENTS.page, { action: 'reload' });
        }
    }, [currentUser?.id, isSlideCopy]);


    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();

    useEffect(() => {
        if (isSlideCopy) return;
        // Reset scroll state when page data changes
        setScrollDirection(0);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            setScrollValue(window.scrollY || document.documentElement.scrollTop || 0);
        } else {
            setScrollValue(0);
        }
    }, [props?.path, props?.data?.url, setScrollDirection, setScrollValue, isSlideCopy]);

    useEffect(() => {
        if (isSlideCopy) return;
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
            // Each page brings the viewer's informers, whether the site requires a profile (UNA's "Require a
            // profile", with the add-profile menu its lock leads to) and the toolbar's items: an admin can change
            // them between two pages.
            if (currentUser && (
                currentUser?.informer != data.user.informer
                || currentUser?.profile_required !== data.user.profile_required
                || String(currentUser?.toolbar) !== String(data.user.toolbar)
            )) {
                setCurrentUser({
                    informer: data.user.informer,
                    profile_required: data.user.profile_required,
                    menu: data.user.menu,
                    toolbar: data.user.toolbar,
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

    }, [data?.user, isSlideCopy]);

    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }

    useEffect(() => {
        if (redirectUrl && !isSlideCopy) {
            redirectTo(router, redirectUrl);
        }
    }, [redirectUrl, isSlideCopy]);


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
