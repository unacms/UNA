import { fetcher } from 'app/lib/fetcher';
import { persistedGet, persistedSet } from 'app/lib/util/storage';
import { getClient, getFallbackUrl, getInitialReferrer, isClientAvailable, isTrackingBlocked } from './client';
import type { AnalyticsHit, AnalyticsPayload, AnalyticsProps, TrackerConfig, TrackEventOptions } from './analytics.types';

/**
 * Pageviews (screen views), engaged time and custom events for UNA's analytics module
 * (bx_analytics). The same model as the classic UI's tracker (modules/boonex/analytics/js/
 * tracker.js): a pageview on every page, a `leave` hit with the visible time when the page
 * is left or hidden, events on demand.
 *
 * Settings come once per app start from `bx_analytics/get_tracker_config`. When the module
 * is missing, tracking is off for this client, or UNA answers a hit with an error, nothing
 * more is sent until the app (page) reloads. Failures are silent and nothing here throws.
 */

const CONFIG_URL = '/api.php?r=bx_analytics/get_tracker_config';
const COLLECT_URL = '/api.php?r=bx_analytics/collect';
/** BxAnalyticsConfig MAX_HITS_PER_REQUEST */
const MAX_HITS = 20;
/** UNA ignores `age` from an hour on. */
const MAX_AGE_MS = 3600 * 1000;
/** After a network failure, wait this long before asking for the settings again. */
const CONFIG_RETRY_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 10 * 1000;
const VISITOR_ID_KEY = 'analytics_vid';

type State = 'idle' | 'loading' | 'on' | 'off';
type QueuedHit = { hit: AnalyticsHit; at: number };

let state: State = 'idle';
let config: TrackerConfig | null = null;
let configRetryAt = 0;
let pending: QueuedHit[] = [];
let visitorId = '';
let referrer: string | null = null;

let started = false;
let currentUrl = '';
let currentTitle = '';
/** When the page became visible (0 while hidden), and visible time collected before that. */
let visibleSince = 0;
let engagedMs = 0;
let hiddenAt = 0;

function randomId(): string {
    const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
    if (!cryptoApi?.getRandomValues) return '';
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The visitor id kept on this device, for sites in persistent identity mode. */
async function getVisitorId(): Promise<string> {
    const stored = await persistedGet(VISITOR_ID_KEY);
    if (typeof stored === 'string' && /^[a-f0-9]{32}$/.test(stored)) return stored;
    const id = randomId();
    if (id) await persistedSet(VISITOR_ID_KEY, id);
    return id;
}

function turnOff(): void {
    state = 'off';
    pending = [];
}

async function loadConfig(): Promise<void> {
    state = 'loading';
    try {
        const response = await fetcher(
            `${CONFIG_URL}&params[]=${encodeURIComponent(getClient().platform)}`,
            false,
            { silent: true, maxAttempts: 1, timeoutMs: REQUEST_TIMEOUT_MS },
        );
        const data = response?.status === 200 ? response.data : null;
        if (!data || !data.enabled || isTrackingBlocked(!!data.respect_dnt)) {
            turnOff();
            return;
        }
        config = {
            enabled: true,
            persistent: !!data.persistent,
            respect_dnt: !!data.respect_dnt,
            session_timeout: Number(data.session_timeout) > 0 ? Number(data.session_timeout) : 1800,
        };
        try {
            visitorId = config.persistent ? await getVisitorId() : '';
        } catch {
            // storage blocked (web throws SecurityError): track without a visitor id
            visitorId = '';
        }
        state = 'on';
    } catch {
        // offline or timed out: keep the queued hits and try again later
        state = 'idle';
        configRetryAt = Date.now() + CONFIG_RETRY_MS;
        return;
    }

    const now = Date.now();
    const queued = pending
        .filter((item) => now - item.at < MAX_AGE_MS)
        .map(({ hit, at }) => (now - at > 0 ? { ...hit, age: now - at } : hit));
    pending = [];
    if (queued.length) void post(queued, false);
}

async function post(hits: AnalyticsHit[], keepalive: boolean): Promise<void> {
    const payload: AnalyticsPayload = { ...getClient(), hits: hits.slice(-MAX_HITS) };
    if (referrer) payload.referrer = referrer;
    if (visitorId) payload.vid = visitorId;
    // UNA reads the referrer for a new visit only: the first pageview's is enough
    if (hits.some((hit) => hit.type === 'pageview')) referrer = '';

    try {
        const response = await fetcher(
            [COLLECT_URL, null, JSON.stringify(payload)],
            false,
            { silent: true, maxAttempts: 1, timeoutMs: REQUEST_TIMEOUT_MS, keepalive },
        );
        if (response?.status !== 200) turnOff();
    } catch {
        // a lost hit: not worth a retry
    }
}

function submit(hits: AnalyticsHit[], keepalive = false): void {
    if (!hits.length || state === 'off' || !isClientAvailable()) return;

    if (state === 'on') {
        void post(hits, keepalive);
        return;
    }

    const now = Date.now();
    pending = pending.concat(hits.map((hit) => ({ hit, at: now }))).slice(-MAX_HITS);
    if (state === 'idle' && now >= configRetryAt) void loadConfig();
}

/** The visible time on the current page since the last leave hit, as a hit, or null. */
function takeLeaveHit(): AnalyticsHit | null {
    const now = Date.now();
    const ms = engagedMs + (visibleSince ? now - visibleSince : 0);
    engagedMs = 0;
    visibleSince = visibleSince ? now : 0;
    return ms > 0 && currentUrl ? { type: 'leave', url: currentUrl, engaged: ms } : null;
}

/**
 * Start tracking: load the settings and start counting visible time. Called once by
 * `AnalyticsTracker` at the app root; later calls do nothing.
 */
export function startTracker(visible: boolean): void {
    if (started || !isClientAvailable()) return;
    started = true;
    referrer = getInitialReferrer();
    visibleSince = visible ? Date.now() : 0;
    if (state === 'idle') void loadConfig();
}

/**
 * A page (web) or screen (apps) is shown. The visible time on the previous one is sent
 * with it. The same URL twice in a row counts once.
 */
export function trackPageview(url: string, title = '', force = false): void {
    if (!url || (url === currentUrl && !force)) return;

    const hits: AnalyticsHit[] = [];
    const leave = takeLeaveHit();
    if (leave) hits.push(leave);

    currentUrl = url;
    currentTitle = title;
    hits.push(title ? { type: 'pageview', url, title } : { type: 'pageview', url });
    submit(hits);
}

/**
 * The page or app became visible or hidden (web: tab switch, page hide; apps: background).
 * Hiding sends the visible time. Coming back after a pause longer than UNA's visit timeout
 * shows the current page again, so the new visit has an entry page.
 */
export function setTrackerVisible(visible: boolean): void {
    if (!started) return;
    const now = Date.now();

    if (!visible) {
        if (!visibleSince) return;
        const leave = takeLeaveHit();
        visibleSince = 0;
        hiddenAt = now;
        if (leave) submit([leave], true);
        return;
    }

    if (visibleSince) return;
    visibleSince = now;
    const away = hiddenAt ? now - hiddenAt : 0;
    hiddenAt = 0;
    if (currentUrl && config && away > config.session_timeout * 1000) {
        engagedMs = 0;
        trackPageview(currentUrl, currentTitle, true);
    }
}

/**
 * Send a custom event to UNA's analytics, e.g. `trackEvent('signup_click', { plan: 'pro' })`.
 * Safe anywhere: does nothing while rendering on the server, when analytics is off, or
 * before the settings are known (then the event waits for them).
 *
 * @param name letters, digits, spaces and `_ . : / -`, up to 64 characters
 * @param props short scalar values (up to 30 keys)
 */
export function trackEvent(name: string, props?: AnalyticsProps, options?: TrackEventOptions): void {
    if (!isClientAvailable()) return;
    const eventName = String(name ?? '').trim().slice(0, 64);
    if (!eventName) return;

    const hit: AnalyticsHit = { type: 'event', name: eventName, url: currentUrl || getFallbackUrl() };
    if (props && typeof props === 'object') {
        const scalars: AnalyticsProps = {};
        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') scalars[key] = value;
        }
        if (Object.keys(scalars).length) hit.props = scalars;
    }
    if (typeof options?.value === 'number' && Number.isFinite(options.value)) hit.value = options.value;
    if (options?.nonInteractive) hit.non_interactive = 1;
    submit([hit]);
}
