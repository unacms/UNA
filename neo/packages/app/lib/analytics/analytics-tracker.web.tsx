'use client';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { setTrackerVisible, startTracker, trackPageview } from './tracker';

/** Next sets the new page's title shortly after the route changes. */
const TITLE_DELAY_MS = 400;

/** A pageview on the first page and after every client-side navigation (including History API URL changes). */
function RouteTracker() {
    const pathname = usePathname();
    const search = useSearchParams()?.toString() ?? '';
    const route = `${pathname}?${search}`;

    useEffect(() => {
        if (!route) return undefined;
        // A page left before this fires (a redirect) isn't counted.
        const timer = setTimeout(() => trackPageview(window.location.href, document.title), TITLE_DELAY_MS);
        return () => clearTimeout(timer);
    }, [route]);

    return null;
}

/** Sends pageviews and engaged time to UNA's analytics. Mounted once, in the app providers. */
export function AnalyticsTracker() {
    useEffect(() => {
        startTracker(document.visibilityState === 'visible');
        const onVisibilityChange = () => setTrackerVisible(document.visibilityState === 'visible');
        const onPageHide = () => setTrackerVisible(false);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('pagehide', onPageHide);
        };
    }, []);

    // useSearchParams needs its own Suspense boundary, or prerendered routes bail out to client rendering.
    return (
        <Suspense fallback={null}>
            <RouteTracker />
        </Suspense>
    );
}
