/**
 * What the app calls the open network and how it draws it (design spec 8.3). The site's
 * discovery document (`GET /api/v2`, public) carries `branding`: its names, its mark (with a
 * dark variant), its home screen icon and its theme colour, which becomes the app's accent
 * (lib/accent.ts). It is asked once per launch and again on focus at most once a day; the last
 * answer is kept per site for the first paint. The name is the one the sign-in stored (auth.rs),
 * else the site's, else the address.
 */
import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';

import { discover, type Schema } from 'una-api';

import { applyAccent, deriveAccent } from './accent';
import { useApp } from './context';
import { locale } from './i18n';
import { fetchOf } from './api';
import { inApp } from './native';
import { readStoredJson, writeStoredJson } from './storage';

export type SiteInfo = {
    /** "UNA Makers", or the host when the site's name is not known. */
    name: string;
    /** The site's own name is known (not only its address). */
    named: boolean;
    host: string;
    /** Who is signed in to it, when the app knows. */
    account?: string;
    /** The square mark, its dark variant and the home screen icon: URLs the site gave, for mediaSrc. */
    mark: string | null;
    markDark: string | null;
    icon: string | null;
    /** The theme colour, #RRGGBB, or null. */
    accent: string | null;
};

type Branding = Schema<'Branding'>;
type Kept = Pick<Schema<'ApiInfo'>, 'name'> & { branding?: Branding | null };

const DAY_MS = 24 * 60 * 60 * 1000;

/** When each site was last asked in this window, whatever came of it (a failed answer counts too). */
const lastAsked = new Map<string, number>();

/** Ask again on focus only a day after the last time it was asked (pure, for tests). */
export function dueForRecheck(siteUrl: string, now = Date.now()): boolean {
    const at = lastAsked.get(siteUrl);
    return at === undefined || now - at > DAY_MS;
}

/** Note that a site is being asked now. */
export function noteAsked(siteUrl: string, at = Date.now()): void {
    lastAsked.set(siteUrl, at);
}

/** For tests: forget when the sites were asked. */
export function resetAsked(): void {
    lastAsked.clear();
}

const keyOf = (siteUrl: string) => `una.siteInfo:${siteUrl.replace(/\/+$/, '')}`;

export function hostOf(siteUrl: string): string {
    try {
        return new URL(siteUrl).host;
    } catch {
        return siteUrl;
    }
}

/** The first letter of a name, for the monogram tile (a grapheme: an emoji or an accented letter stays whole). */
export function monogram(name: string): string {
    const text = name.trim();
    if (!text) return '?';
    const Seg = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
    const first = Seg ? new Seg(locale(), { granularity: 'grapheme' }).segment(text)[Symbol.iterator]().next().value?.segment : undefined;
    return (first ?? Array.from(text)[0] ?? '?').toLocaleUpperCase(locale());
}

/** The last discovery answer kept for a site (localStorage, which may be unavailable). */
export function readKept(siteUrl: string): Kept | undefined {
    const kept = readStoredJson(keyOf(siteUrl));
    return kept && typeof kept === 'object' && typeof (kept as Kept).name === 'string' ? (kept as Kept) : undefined;
}

function keep(siteUrl: string, info: Schema<'ApiInfo'>): void {
    // a site may answer anything: what is no object has nothing to keep
    if (!info || typeof info !== 'object') return;
    // with nothing to keep it in, the next launch asks before it shows the mark
    const kept: Kept = { name: info.name, branding: info.branding ?? null };
    writeStoredJson(keyOf(siteUrl), kept);
}

/** A string field of the branding block, or null (an older site sends none). */
function field(branding: Branding | null | undefined, key: keyof Branding): string | null {
    const v = branding?.[key];
    return typeof v === 'string' && v.trim() ? v : null;
}

/** SiteInfo from what the sign-in stored and what the site said (pure, for tests). */
export function siteInfoOf(siteUrl: string, stored: string | undefined, info: Kept | undefined, account?: string): SiteInfo {
    const host = hostOf(siteUrl);
    const branding = info?.branding;
    const name = stored?.trim() || field(branding, 'name')?.trim() || info?.name?.trim() || '';
    return {
        name: name || host,
        named: !!name,
        host,
        account: account || undefined,
        mark: field(branding, 'mark'),
        markDark: field(branding, 'mark_dark'),
        icon: field(branding, 'icon'),
        accent: field(branding, 'accent'),
    };
}

export function useSiteInfo(): SiteInfo {
    const { siteUrl, api, sessions = [], sessionKey } = useApp();
    const here = sessions.find((s) => s.key === sessionKey);
    const info = useQuery({
        queryKey: ['site-info', siteUrl],
        queryFn: async () => {
            noteAsked(siteUrl);
            const found = await discover(siteUrl, fetchOf(api));
            keep(siteUrl, found);
            return found as Kept;
        },
        // the site's API through Rust: only in the app
        enabled: inApp,
        // the kept answer paints first; the query still asks once per launch
        placeholderData: () => readKept(siteUrl),
        staleTime: Infinity,
        // back to the app: asked again at most once a day, counted from the last time it was
        // asked (not from the last answer: while only the kept one exists, as after a failure
        // or offline, that would be 0 and every focus would ask)
        refetchOnWindowFocus: () => (dueForRecheck(siteUrl) ? 'always' : false),
        retry: false,
    });
    return siteInfoOf(siteUrl, here?.siteName, info.data, here?.accountName);
}

/**
 * The site's accent on <html> while this window shows it (tokens.css reads the shades, NEO's
 * blue where there are none); taken off again when the window leaves the site. A layout effect,
 * so the kept answer's colour is on before the first paint and no frame shows NEO's blue.
 */
export function useSiteAccent(): void {
    const { accent } = useSiteInfo();
    useLayoutEffect(() => {
        applyAccent(deriveAccent(accent));
        return () => applyAccent(null);
    }, [accent]);
}
