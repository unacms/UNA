import type { AnalyticsClient } from './analytics.types';

type PrivacyNavigator = Navigator & { globalPrivacyControl?: boolean };

/** False while rendering on the server: nothing is tracked there. */
export function isClientAvailable(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function getClient(): AnalyticsClient {
    const screen = window.screen;
    return {
        platform: 'next-web',
        language: window.navigator.language || '',
        screen: screen ? `${screen.width}x${screen.height}` : '',
    };
}

/** The URL events are sent with before the first pageview. */
export function getFallbackUrl(): string {
    return window.location.href;
}

/**
 * The referrer of the first page, only when it is another site: NEO's own host isn't one
 * of UNA's internal hosts, so a NEO page as referrer would count as a referral.
 */
export function getInitialReferrer(): string {
    const referrer = document.referrer;
    if (!referrer) return '';
    try {
        return new URL(referrer).host !== window.location.host ? referrer : '';
    } catch {
        return '';
    }
}

/**
 * Don't track automated browsers, visitors who ask not to be tracked (Do Not Track, Global
 * Privacy Control) when the site honours it, and a browser excluded by hand with
 * `localStorage.setItem('bx_analytics_ignore', '1')`, as the classic tracker does.
 */
export function isTrackingBlocked(respectDnt: boolean): boolean {
    const nav = window.navigator as PrivacyNavigator;
    if (nav.webdriver) return true;
    const windowDnt = (window as Window & { doNotTrack?: string }).doNotTrack;
    if (respectDnt && (nav.doNotTrack === '1' || windowDnt === '1' || nav.globalPrivacyControl === true)) return true;
    try {
        return window.localStorage.getItem('bx_analytics_ignore') === '1';
    } catch {
        return false;
    }
}
