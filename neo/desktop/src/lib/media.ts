/**
 * Where a picture's `src` comes from: the only place it is decided (avatars, covers, post and
 * message media, the lightbox). The page's CSP (tauri.conf.json `img-src`, `media-src`) allows
 * https, data:, blob: and the app's `una-media` scheme; a local development site's plain-http
 * pictures (the hosts auth.rs `is_local_host` lets sign in over http) go through that scheme.
 * This function refuses anything else, so a component shows its fallback instead of a broken
 * image.
 */
import { useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';

import { AppContext } from './context';
import { inApp } from './native';

/** localhost, 127.0.0.1 and *.localhost: auth.rs `is_local_host`. */
export function isLocalHost(host: string): boolean {
    const h = host.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost');
}

function originOf(url: string): string | null {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

/**
 * Where the app's `una-media` scheme answers (src-tauri/src/media.rs): WebKit blocks plain-http
 * pictures on the bundled page (a secure context) as mixed content, local hosts included, so
 * the app fetches a local site's pictures itself. Windows' WebView2 serves custom schemes as
 * `http://<scheme>.localhost`.
 */
export const MEDIA_SCHEME_BASE =
    typeof navigator !== 'undefined' && /Windows/.test(navigator.userAgent) ? 'http://una-media.localhost/' : 'una-media://localhost/';

/** In the app, local http pictures go through the scheme; in a plain browser tab, as they are. */
const defaultProxy: string | null = inApp ? MEDIA_SCHEME_BASE : null;

/**
 * The `src` to use for a picture of `site` (the signed-in site, or on the sign-in screen the
 * site being looked up), or null: then the caller shows its fallback.
 * - https: as it is
 * - data:image/… (an inline mark): as it is; any other data: is refused
 * - blob: (a local preview the page made itself): as it is
 * - http: only on the site's own origin, and only when that host is local; in the app through
 *   `proxy` (the una-media scheme, which checks the same again in Rust)
 */
export function mediaSrc(url: string | null | undefined, site: string | null | undefined, proxy: string | null = defaultProxy): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^data:/i.test(trimmed)) return /^data:image\/[a-z0-9.+-]+[;,]/i.test(trimmed) ? trimmed : null;
    if (/^blob:/i.test(trimmed)) return trimmed;
    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }
    if (parsed.username || parsed.password) return null;
    if (parsed.protocol === 'https:') return parsed.href;
    if (parsed.protocol !== 'http:' || !site || !isLocalHost(parsed.hostname)) return null;
    if (originOf(site) !== parsed.origin) return null;
    return proxy ? `${proxy}?u=${encodeURIComponent(parsed.href)}` : parsed.href;
}

/** mediaSrc for the signed-in site (no site outside the signed-in app: https and data: only). */
export function useMediaSrc(): (url: string | null | undefined) => string | null {
    const site = useContext(AppContext)?.siteUrl ?? null;
    return (url) => mediaSrc(url, site);
}

/**
 * Pictures that failed to load twice in this session: shown as their fallback from then on.
 * An `<img>` error says nothing of why, and the una-media scheme also fails for states that
 * pass (503: the sign-in not read yet, a switch under way, the site slow while it makes a
 * resized copy), so a first failure is tried once more after `RETRY_DELAY_MS`, and everything
 * is forgotten when the session changes (`forgetFailures`, from app.tsx).
 */
const failed = new Set<string>();
const retried = new Set<string>();
const listeners = new Set<() => void>();
/** Bumped when the failures change (a picture failed for good, or they were forgotten). */
let version = 0;

export const RETRY_DELAY_MS = 1500;

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const readVersion = () => version;

function notify(): void {
    version++;
    listeners.forEach((l) => l());
}

/** A new session (sign-in, switch, sign-out): every picture gets its chances again. */
export function forgetFailures(): void {
    failed.clear();
    retried.clear();
    notify();
}

/**
 * Whether a picture failed to load twice in this session, for a caller that decides what to
 * draw before any `<img>` of it is tried; the caller renders again when a picture fails for good.
 */
export function usePictureFailed(): (src: string | null) => boolean {
    useSyncExternalStore(subscribe, readVersion, readVersion);
    return (src) => !!src && failed.has(src);
}

/**
 * What an `<img>` of `src` draws: `src` with its onError and onLoad, or null while it waits to
 * try again (`waiting`, for a caller that keeps the picture's place) and once it failed twice
 * (then the caller shows its fallback).
 */
export function usePicture(src: string | null): { src: string | null; waiting: boolean; onError: () => void; onLoad: () => void } {
    useSyncExternalStore(subscribe, readVersion, readVersion);
    const [waiting, setWaiting] = useState<string | null>(null);
    useEffect(() => {
        if (!waiting) return;
        const t = window.setTimeout(() => setWaiting(null), RETRY_DELAY_MS);
        return () => window.clearTimeout(t);
    }, [waiting]);
    const onError = useCallback(() => {
        if (!src) return;
        if (retried.has(src)) {
            failed.add(src);
            // this caller and any that counted on the picture (usePictureFailed) draw again
            notify();
        } else {
            retried.add(src);
            setWaiting(src);
        }
    }, [src]);
    const onLoad = useCallback(() => {
        if (src) retried.delete(src);
    }, [src]);
    const gone = !src || failed.has(src);
    return { src: !gone && waiting !== src ? src : null, waiting: !gone && waiting === src, onError, onLoad };
}

