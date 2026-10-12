'use client';
import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { installGlobalErrorCapture } from './global-errors';
import { finishScreenLoad, recordWebVital, setHealthView } from './health';
import { setTrackerVisible, startTracker, trackPageview } from './tracker';

/** Next sets the new page's title shortly after the route changes. */
const TITLE_DELAY_MS = 400;

type WebVitalMetric = { name: string; value: number; navigationType?: string };

/** One function for the page's life: next/web-vitals reports everything again to a new one. */
function reportWebVital(metric: WebVitalMetric): void {
    recordWebVital(metric.name, metric.value, metric.navigationType);
}

/** Runs `callback` once the browser has painted (at once in a hidden tab, which doesn't paint). */
function afterNextPaint(callback: () => void): () => void {
    if (document.visibilityState === 'hidden' || typeof requestAnimationFrame !== 'function') {
        callback();
        return () => {};
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const frame = requestAnimationFrame(() => {
        timer = setTimeout(callback, 0);
    });
    return () => {
        cancelAnimationFrame(frame);
        if (timer) clearTimeout(timer);
    };
}

/**
 * A pageview on the first page and after every client-side navigation (including History API
 * URL changes). A router navigation's page, once painted, ends its `screen_load` (started in
 * instrumentation-client.ts).
 */
function RouteTracker() {
    const pathname = usePathname();
    const search = useSearchParams()?.toString() ?? '';
    const route = `${pathname}?${search}`;
    const firstRoute = useRef(true);

    useEffect(() => {
        if (!route) return undefined;
        setHealthView(window.location.href);
        const cancelPaint = firstRoute.current ? null : afterNextPaint(finishScreenLoad);
        firstRoute.current = false;
        // A page left before this fires (a redirect) isn't counted.
        const timer = setTimeout(() => trackPageview(window.location.href, document.title), TITLE_DELAY_MS);
        return () => {
            clearTimeout(timer);
            cancelPaint?.();
        };
    }, [route]);

    return null;
}

/**
 * Sends pageviews, engaged time, errors and web vitals to UNA's analytics. Mounted once, in
 * the app providers.
 */
export function AnalyticsTracker() {
    useReportWebVitals(reportWebVital);

    useEffect(() => {
        // already installed by instrumentation-client.ts; here in case that didn't run
        installGlobalErrorCapture();
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
