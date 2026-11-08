import { headers } from 'next/headers';
import { UNA_URL, UNA_API_KEY, MULTITENANT, PREVIEW_DOMAIN, appSetting, joinUnaUrl } from 'app/config';
import { pageCookiesForCache } from './una-page-cache';
import { resolveRequestTenant } from './request-tenant';
import { createSharedCache } from './shared-cache';

/**
 * UNA data the client would otherwise ask for on every first page load, fetched by the root
 * layout and handed to `Providers`:
 *
 * - guests' menus (`menu_items.objects`): the same for every guest of a site and language;
 * - the analytics settings (`bx_analytics/get_tracker_config`): the same for every viewer.
 *
 * Both are kept in memory for `cache.una_shared_ttl` seconds per UNA backend and language, so
 * a visitor's page costs UNA no menu or settings request. Members' menus are left to the
 * client: they carry the viewer's own items.
 */

/** The menus a guest's first page asks for (see `settings/menus.js`). */
const GUEST_MENU_KEYS = ['launcher', 'site', 'tabbar', 'toolbar', 'footer'];
/** The analytics client the web app reports as (`lib/analytics/client.web.ts`). */
const TRACKER_PLATFORM = 'next-web';
const DEFAULT_TTL_SECONDS = 60;
/** How long a page waits for UNA when nothing is cached yet; the client asks itself after that. */
const WAIT_MS = 1500;
const FETCH_TIMEOUT_MS = 10_000;

export type InitialMenus = Record<string, unknown>;
export type UnaSharedData = {
    menus: InitialMenus | null;
    trackerConfig: Record<string, unknown> | null;
};

function ttlSeconds(): number {
    if (appSetting('cache', 'enable_web') === false) return 0;
    const raw = appSetting('cache', 'una_shared_ttl');
    if (raw === '' || raw === false || raw == null) return DEFAULT_TTL_SECONDS;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_SECONDS;
}

const ttlMs = ttlSeconds() * 1000;
const cache = createSharedCache<unknown>({
    ttlMs,
    // A stale copy is served while one refresh runs, for up to ten times the time-to-live.
    staleMs: ttlMs * 10,
    waitMs: WAIT_MS,
    maxEntries: 200,
});

/** UNA's `data` for a GET, or undefined when the request fails or UNA answers with an error. */
async function fetchUnaData(base: string, apiKey: string, query: string): Promise<unknown> {
    const res = await fetch(joinUnaUrl('/api.php', base) + query, {
        headers: {
            authorization: 'Bearer ' + apiKey,
            'x-neo-platform': 'web',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return undefined;
    const json = await res.json().catch(() => null);
    return json && json.status === 200 && json.data != null ? json.data : undefined;
}

export function guestMenuObjects(): string[] {
    const objects = appSetting('menu_items', 'objects') || {};
    const names = GUEST_MENU_KEYS.map((key) => objects[key]).filter((name): name is string => typeof name === 'string' && !!name);
    return [...new Set(names)];
}

/** Whether the request carries no cookie that can change UNA's answer (the page cache's guest). */
function isGuestRequest(cookieString: string, langCode: string): boolean {
    return pageCookiesForCache(cookieString, '?lang=' + encodeURIComponent(langCode)) === '';
}

export async function loadUnaSharedData(langCode: string): Promise<UnaSharedData> {
    const hdrs = await headers();
    const tenant = MULTITENANT || PREVIEW_DOMAIN ? await resolveRequestTenant(hdrs.get('host')) : null;
    if (MULTITENANT && !tenant) return { menus: null, trackerConfig: null };
    const base: string = tenant?.unaUrl ?? UNA_URL;
    const apiKey: string = tenant?.unaApiKey ?? UNA_API_KEY;
    if (!base || !apiKey) return { menus: null, trackerConfig: null };

    const lang = encodeURIComponent(langCode || 'en');
    const guest = isGuestRequest(hdrs.get('cookie') || '', langCode);
    const objects = guest ? guestMenuObjects() : [];

    const [trackerConfig, ...menus] = await Promise.all([
        cache.get(`${base}|tracker`, () => fetchUnaData(
            base, apiKey, `?r=bx_analytics/get_tracker_config&params[]=${TRACKER_PLATFORM}&lang=${lang}`,
        )),
        ...objects.map((object) => cache.get(`${base}|${lang}|menu|${object}`, () => fetchUnaData(
            base, apiKey,
            '?r=system/get_menu/TemplServices&params[]=' + encodeURIComponent(JSON.stringify({ object, params: null })) + `&lang=${lang}`,
        ))),
    ]);

    const seeded: InitialMenus = {};
    objects.forEach((object, i) => {
        const data = menus[i];
        if (data && typeof data === 'object') seeded[object] = data;
    });

    return {
        menus: Object.keys(seeded).length ? seeded : null,
        trackerConfig: trackerConfig && typeof trackerConfig === 'object' ? trackerConfig as Record<string, unknown> : null,
    };
}
