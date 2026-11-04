import { useEffect, useLayoutEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useCurrentUserStore } from 'app/context/user';
import { getScreenPath } from 'app/lib/navigation/screen-page-path';
import { installGlobalErrorCapture, sendStoredErrors } from './global-errors';
import { setHealthView, startScreenLoad } from './health';
import { setTrackerVisible, startTracker, trackPageview } from './tracker';

/** A screen shown for less than this isn't a screen view (web waits as long for the title). */
const SETTLE_MS = 400;

/**
 * Sends screen views, engaged time, errors and vitals to UNA's analytics. Mounted once, in the
 * tabs layout. A screen's `screen_load` starts when its path changes and ends when its page is
 * laid out (`ScreenReadyMarker` in the page layout).
 */
export function AnalyticsTracker() {
    const pathname = usePathname();
    const params = useGlobalSearchParams<{ url?: string | string[] }>();
    const url = Array.isArray(params.url) ? params.url[0] : params.url;
    const user = useCurrentUserStore((store) => store.currentUser);
    const screenPath = getScreenPath(pathname, url, user);
    const firstScreen = useRef(true);

    // A layout effect: it runs before the new screen's marker can report its layout.
    useLayoutEffect(() => {
        if (!screenPath) return;
        setHealthView(screenPath);
        if (firstScreen.current) firstScreen.current = false;
        else startScreenLoad();
    }, [screenPath]);

    useEffect(() => {
        // already installed in apps/expo/index.js; here in case that didn't run
        installGlobalErrorCapture();
        void sendStoredErrors();
        startTracker(AppState.currentState === 'active');
        // `inactive` (iOS app switcher, Control Center) passes quickly: only background counts as hidden
        const subscription = AppState.addEventListener('change', (appState) => {
            if (appState === 'active') setTrackerVisible(true);
            else if (appState === 'background') setTrackerVisible(false);
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (!screenPath) return undefined;
        // A screen left before this fires isn't counted, as on web: the tab root a deep
        // link lands on just before its page is pushed.
        const timer = setTimeout(() => trackPageview(screenPath), SETTLE_MS);
        return () => clearTimeout(timer);
    }, [screenPath]);

    return null;
}
