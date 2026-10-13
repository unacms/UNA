import { getHealthPageUrl, getOwnOrigin, isClientAvailable } from './client';
import { cleanMessage, cleanStack, cleanText, isExtensionUrl } from './privacy';
import type { AnalyticsHit, ErrorKind, VitalsMetrics, VitalsNav } from './analytics.types';

/**
 * Errors and performance (vitals) for UNA's analytics, the Health section. This module only
 * collects: the tracker (`tracker.ts`) sends what it collects with its own hits, applies the
 * site's settings and stops everything when tracking is off. It has no dependencies on the
 * tracker or `fetcher`, so it can load before the app (web: `instrumentation-client.ts`).
 *
 * Errors: the same error (kind, message, source, line) once per page view or screen, with a
 * count of repeats; at most 10 different ones; a new one goes out within 2 seconds, its later
 * repeats with the page's leave hit.
 *
 * Vitals, one hit per page view or screen: on web the page load's TTFB, FCP, LCP, CLS and INP
 * (sent when the page is first hidden) and `screen_load` of each later navigation; in the apps
 * `app_start` of a cold start and `screen_load` of each screen.
 *
 * Nothing here throws, and nothing is collected while rendering on the server.
 */

/** BxAnalyticsCollector keeps 10 error hits per request. */
const MAX_ERRORS_PER_VIEW = 10;
const MAX_REPEATS = 100;
const FLUSH_DELAY_MS = 2000;
/** BxAnalyticsErrors MAX_MESSAGE_INPUT */
const MAX_MESSAGE = 500;
const MAX_SOURCE = 512;
/** The same thrown object reported twice this soon (a window listener and a boundary) counts once. */
const SAME_ERROR_MS = 1000;
/** A navigation that hasn't rendered within this long isn't measured. */
const MAX_SCREEN_LOAD_MS = 30000;
/** BxAnalyticsVitals MAX_MS and MAX_CLS */
const MAX_VITAL_MS = 120000;
const MAX_CLS = 10;
const MAX_READY_VITALS = 5;
const MAX_HELD_HITS = 20;

export type HealthSettings = {
    errors: boolean;
    ignore: string[];
    vitals: boolean;
    /** Percent of app starts or page loads that send vitals. */
    vitalsSample: number;
};

export type ErrorInput = {
    /** What was thrown or rejected: name, message and stack are read from it. */
    error?: unknown;
    /** Instead of the error's own message. */
    message?: string;
    source?: string;
    line?: number;
    col?: number;
    stack?: string;
    componentStack?: string;
    /** HTTP status (`http` errors). */
    status?: number;
    fatal?: boolean;
    /** Put before the text of a thrown value that isn't an Error. */
    nonErrorPrefix?: string;
};

type Sink = (hits: AnalyticsHit[], keepalive?: boolean) => void;
type ErrorItem = { hit: AnalyticsHit; pending: number; time: number; sent: boolean };
type LoadView = { url: string; nav: VitalsNav; metrics: VitalsMetrics; sent: boolean };

/** null until the tracker knows the site's settings: collect meanwhile, the tracker filters. */
let errorsOn: boolean | null = null;
let vitalsOn: boolean | null = null;
let ignorePatterns: RegExp[] = [];

let sink: Sink | null = null;
/** Hits for the sink before it is connected (errors kept from the last app run). */
let held: AnalyticsHit[] = [];

let viewUrl = '';
let errors = new Map<string, ErrorItem>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const recentThrows = new WeakMap<object, number>();

/** Web: the page load's vitals, sent once when the page is first hidden. */
let loadView: LoadView | null = null;
/** Vitals hits waiting for a batch; a collect request takes one. */
let readyVitals: AnalyticsHit[] = [];
let screenLoadStart = 0;

function perfNow(): number {
    return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

function toPattern(pattern: unknown): RegExp | null {
    const text = typeof pattern === 'string' ? pattern.trim() : '';
    if (!text) return null;
    const source = text.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]*');
    try {
        return new RegExp(`^${source}$`, 'i');
    } catch {
        return null;
    }
}

function isIgnored(message: string): boolean {
    const text = message.trim();
    return ignorePatterns.some((pattern) => pattern.test(text));
}

/**
 * What a thrown object that is no Error was, without its values (a form or an API payload
 * would carry what someone typed): `Object{password,otp}`, `Array(3)`.
 */
function describeObject(value: object): string {
    if (Array.isArray(value)) return `Array(${value.length})`;
    let name = 'Object';
    let keys: string[] = [];
    try {
        const constructorName = (value as { constructor?: { name?: unknown } }).constructor?.name;
        if (typeof constructorName === 'string' && constructorName) name = constructorName;
        keys = Object.keys(value);
    } catch {
        return Object.prototype.toString.call(value);
    }
    return `${name}{${keys.slice(0, 10).join(',')}${keys.length > 10 ? ',…' : ''}}`;
}

/** Message and stack of whatever was thrown. */
function describe(value: unknown, nonErrorPrefix = ''): { message: string; stack: string } {
    if (value && typeof value === 'object' && typeof (value as Error).message === 'string') {
        const error = value as Error;
        const name = typeof error.name === 'string' && error.name ? `${error.name}: ` : '';
        return { message: name + error.message, stack: typeof error.stack === 'string' ? error.stack : '' };
    }
    const text = typeof value === 'object' && value !== null ? describeObject(value) : String(value);
    return { message: nonErrorPrefix + text.slice(0, 200), stack: '' };
}

function positive(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

/**
 * An error hit, cleaned (no query strings, tokens or emails), or null for noise: an empty
 * message, a cross-origin "Script error." without a stack, a browser extension's error, a
 * message on the site's ignore list.
 */
export function buildErrorHit(kind: ErrorKind, input: ErrorInput): AnalyticsHit | null {
    const origin = getOwnOrigin();
    const described = input.error !== undefined ? describe(input.error, input.nonErrorPrefix) : { message: '', stack: '' };
    const rawStack = typeof input.stack === 'string' && input.stack ? input.stack : described.stack;
    const message = cleanMessage(input.message || described.message, origin, MAX_MESSAGE);
    const stack = cleanStack(rawStack, origin);
    if (!message || (/^(?:Uncaught )?Script error\.?$/i.test(message) && !stack)) return null;
    if (isExtensionUrl(input.source) || (rawStack && !stack && isExtensionUrl(rawStack))) return null;
    if (isIgnored(message)) return null;

    const hit: AnalyticsHit = { type: 'error', url: getHealthPageUrl(viewUrl), kind, message };
    const source = cleanText(input.source, origin).slice(0, MAX_SOURCE);
    if (source) hit.source = source;
    const line = positive(input.line);
    if (line) hit.line = line;
    const col = positive(input.col);
    if (col) hit.col = col;
    if (stack) hit.stack = stack;
    const componentStack = cleanStack(input.componentStack, origin);
    if (componentStack) hit.component_stack = componentStack;
    const status = positive(input.status);
    if (kind === 'http' && status) hit.status = status;
    if (input.fatal) hit.fatal = 1;
    return hit;
}

function scheduleFlush(): void {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
        flushTimer = null;
        if (!sink) return;
        const hits = takeErrorHits(false);
        if (hits.length) sink(hits);
    }, FLUSH_DELAY_MS);
}

/**
 * Collect an error. Safe anywhere: does nothing on the server or when the site doesn't track
 * errors, and never throws.
 */
export function captureError(kind: ErrorKind, input: ErrorInput): void {
    try {
        if (errorsOn === false || !isClientAvailable()) return;

        const thrown = input.error;
        if (thrown && typeof thrown === 'object') {
            const now = Date.now();
            const at = recentThrows.get(thrown);
            if (at && now - at < SAME_ERROR_MS) return;
            recentThrows.set(thrown, now);
        }

        const hit = buildErrorHit(kind, input);
        if (!hit) return;

        const key = [kind, hit.message, hit.source ?? '', hit.line ?? 0].join('|');
        let item = errors.get(key);
        if (!item) {
            if (errors.size >= MAX_ERRORS_PER_VIEW) return;
            item = { hit, pending: 0, time: 0, sent: false };
            errors.set(key, item);
        } else if (hit.fatal) {
            item.hit.fatal = 1;
        }
        item.pending = Math.min(MAX_REPEATS, item.pending + 1);
        item.time = Date.now();
        if (!item.sent) scheduleFlush();
    } catch {
        // reporting an error must never cause one
    }
}

/**
 * Error hits to send: new errors, and when the page or screen is left also the repeats of
 * errors already sent.
 */
export function takeErrorHits(leaving: boolean): AnalyticsHit[] {
    if (errorsOn === false) return [];
    const now = Date.now();
    const hits: AnalyticsHit[] = [];
    errors.forEach((item) => {
        if (!item.pending || (item.sent && !leaving)) return;
        hits.push({ ...item.hit, repeats: item.pending, age: Math.max(0, now - item.time) });
        item.pending = 0;
        item.sent = true;
    });
    return hits;
}

/** Hits built elsewhere (errors kept from the last app run): sent as soon as possible. */
export function submitHealthHits(hits: AnalyticsHit[]): void {
    if (!hits.length) return;
    if (sink) {
        sink(hits);
        return;
    }
    held = held.concat(hits).slice(-MAX_HELD_HITS);
}

/** Connects the tracker: hits collected so far go out. */
export function setHealthSink(next: Sink): void {
    sink = next;
    if (held.length) {
        const hits = held;
        held = [];
        next(hits);
    }
    errors.forEach((item) => {
        if (item.pending && !item.sent) scheduleFlush();
    });
}

/** A roll in [0, 100) from the platform CSPRNG; 100 (never sampled) without one. */
function sampleRoll(): number {
    const cryptoApi = (globalThis as { crypto?: Crypto }).crypto;
    if (!cryptoApi?.getRandomValues) return 100;
    const values = cryptoApi.getRandomValues(new Uint32Array(1));
    return ((values[0] ?? 0) / 4294967296) * 100;
}

/**
 * The site's settings, from the tracker's config; null when tracking is off. Vitals are
 * sampled here, once per app start or page load.
 */
export function configureHealth(settings: HealthSettings | null): void {
    errorsOn = !!settings?.errors;
    ignorePatterns = errorsOn ? (settings?.ignore ?? []).flatMap((pattern) => toPattern(pattern) ?? []) : [];
    vitalsOn = !!settings?.vitals && sampleRoll() < (settings?.vitalsSample ?? 0);

    if (errorsOn) {
        errors.forEach((item, key) => {
            if (isIgnored(item.hit.message ?? '')) errors.delete(key);
        });
    } else {
        errors = new Map();
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = null;
    }
    held = held.filter(acceptHealthHit);
    if (!vitalsOn) {
        loadView = null;
        readyVitals = [];
        screenLoadStart = 0;
    }
}

/** Whether a hit collected before the settings were known may be sent. */
export function acceptHealthHit(hit: AnalyticsHit): boolean {
    if (hit.type === 'error') return errorsOn !== false && !isIgnored(hit.message ?? '');
    if (hit.type === 'vitals') return vitalsOn !== false;
    return true;
}

/** Whether errors are known to be off (the apps then don't keep a fatal error for later). */
export function isErrorCaptureOff(): boolean {
    return errorsOn === false;
}

/** The page or screen shown now: errors and vitals from here on belong to it. */
export function setHealthView(url: string): void {
    viewUrl = url;
}

/** A new page view: its errors are counted afresh (call after taking the last page's). */
export function resetViewErrors(): void {
    errors = new Map();
}

/*
 * Vitals
 */

function vitalValue(metric: keyof VitalsMetrics, value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    if (metric === 'cls') return value <= MAX_CLS ? Math.round(value * 10000) / 10000 : null;
    return value <= MAX_VITAL_MS ? Math.round(value) : null;
}

function pushReady(hit: AnalyticsHit): void {
    readyVitals = readyVitals.concat(hit).slice(-MAX_READY_VITALS);
}

/** The page load's vitals, once, when it has any. */
function queueLoadView(): void {
    if (!loadView || loadView.sent) return;
    loadView.sent = true;
    if (Object.keys(loadView.metrics).length) {
        pushReady({ type: 'vitals', url: loadView.url, nav: loadView.nav, metrics: { ...loadView.metrics } });
    }
}

const WEB_VITALS: Record<string, keyof VitalsMetrics> = { TTFB: 'ttfb', FCP: 'fcp', LCP: 'lcp', CLS: 'cls', INP: 'inp' };
const NAV_TYPES: Record<string, VitalsNav> = {
    navigate: 'navigate',
    reload: 'reload',
    prerender: 'prerender',
    'back-forward': 'back_forward',
    back_forward: 'back_forward',
    'back-forward-cache': 'restore',
    restore: 'restore',
};

/**
 * A web vital of the page load, as `next/web-vitals` reports it (the latest value counts).
 * A page restored from the back/forward cache is a new load. Soft navigations are measured
 * with `startScreenLoad` / `finishScreenLoad` instead.
 */
export function recordWebVital(name: string, value: number, navigationType?: string): void {
    try {
        if (vitalsOn === false || !isClientAvailable()) return;
        const metric = WEB_VITALS[name];
        if (!metric || navigationType === 'soft-navigation') return;
        const nav = NAV_TYPES[navigationType ?? ''] ?? 'navigate';

        const restored = nav === 'restore' && (!loadView || loadView.nav !== 'restore' || loadView.sent);
        if (restored) queueLoadView();
        if (!loadView || restored) loadView = { url: getHealthPageUrl(viewUrl), nav, metrics: {}, sent: false };
        if (loadView.sent) return;

        const measured = vitalValue(metric, value);
        if (measured !== null) loadView.metrics[metric] = measured;
    } catch {
        // never throw
    }
}

/** A navigation to another page or screen starts (web: the router; apps: the screen path changes). */
export function startScreenLoad(): void {
    if (vitalsOn === false) return;
    screenLoadStart = perfNow();
}

/** The page or screen of the navigation started last has rendered its content: `screen_load`. */
export function finishScreenLoad(): void {
    if (!screenLoadStart) return;
    const ms = perfNow() - screenLoadStart;
    screenLoadStart = 0;
    if (vitalsOn === false || ms < 0 || ms > MAX_SCREEN_LOAD_MS) return;
    pushReady({ type: 'vitals', url: viewUrl ? getHealthPageUrl(viewUrl) : '', nav: 'soft', metrics: { screen_load: Math.round(ms) } });
}

/** Apps: from process start to the first page rendered, once per cold start. */
export function recordAppStart(ms: number): void {
    if (vitalsOn === false) return;
    const value = vitalValue('app_start', ms);
    if (!value) return;
    // the first screen's path may not be known yet: filled in when the hit is taken
    pushReady({ type: 'vitals', url: viewUrl ? getHealthPageUrl(viewUrl) : '', nav: 'navigate', metrics: { app_start: value } });
}

/**
 * A vitals hit to send (UNA takes one per request), or null. Leaving the page also closes
 * the page load's measurement.
 */
export function takeVitalsHit(leaving: boolean): AnalyticsHit | null {
    if (vitalsOn === false) return null;
    if (leaving) queueLoadView();
    const hit = readyVitals[0];
    if (!hit) return null;
    readyVitals = readyVitals.slice(1);
    return hit.url ? hit : { ...hit, url: getHealthPageUrl(viewUrl) };
}
