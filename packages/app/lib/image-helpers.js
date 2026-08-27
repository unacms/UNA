import { useCallback, useEffect, useState } from 'react';
import { Dimensions, PixelRatio, Platform, StyleSheet } from 'react-native';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { UNA_URL, APP_URL, MULTITENANT_IMAGES_PROXY } from 'app/config';

/** Keep in sync with `apps/next/next.config.js` → `images`. */
export const IMAGE_DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920];
export const IMAGE_INLINE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];
export const IMAGE_SIZE_TABLE = [...IMAGE_INLINE_SIZES, ...IMAGE_DEVICE_SIZES];

/** Post detail / modal hero — max-w-3xl (768px) column; 1280w covers 2x DPR. */
export const POST_ENTRY_COVER_SIZES = '(max-width: 768px) 100vw, 768px';
export const POST_ENTRY_COVER_WIDTH_CAP = 1280;

const DEFAULT_SIZES = '(max-width:768px) 100vw, 500px';
const DEFAULT_NATIVE_THUMB_WIDTH = 128;
const TAILWIND_SPACING = 4;

const SIZES_BY_BREAKPOINT = {
    [LAYOUT_BREAKPOINTS.lg]: '(max-width:1024px) 100vw, 1024px',
    [LAYOUT_BREAKPOINTS.xl]: '(max-width:1280px) 100vw, 1280px',
    [LAYOUT_BREAKPOINTS.md]: '(max-width:768px) 100vw, 500px',
};

const sizeClassPattern = /^(?:web:)?(?:w-|h-|size-|aspect-|min-h-|min-w-|max-h-|max-w-|inset-|flex-1$|flex-auto$)/;

/** True when the URL looks like an SVG (optimizer rejects that type). */
export function isSvgImageSrc(value) {
    return /\.svg(?:$|[?#])/i.test(String(value || ''));
}

/** `src`, or RN `source.uri` / string `source`. Empty string if none. */
export function getImageSrc(props) {
    if (props?.src) return props.src;
    const source = props?.source;
    if (typeof source === 'string') return source;
    if (source?.uri) return source.uri;
    return '';
}

/** blob, data URI, and packaged /static — never prefix UNA_URL or proxy. */
function isInlineOrStaticSrc(src) {
    return src.startsWith('blob:') || src.startsWith('data:image') || src.startsWith('/static/');
}

function isHttpSrc(src) {
    return /^https?:\/\//i.test(src);
}

/** Relative UNA paths → absolute URL. http(s), blob, data:, /static/ stay as-is. */
export function toAbsoluteImageSrc(src) {
    if (!src) return '';
    if (isHttpSrc(src) || isInlineOrStaticSrc(src)) return src;
    return UNA_URL + src;
}

/**
 * Absolute (and optionally proxied) URL the Image atom actually loads.
 * Web can wrap http(s) through MULTITENANT_IMAGES_PROXY; native does not.
 */
export function toNormalizedSrc(src, { useProxy = false } = {}) {
    if (!src) return '';
    if (isInlineOrStaticSrc(src)) return src;

    const absoluteSrc = isHttpSrc(src) ? src : toAbsoluteImageSrc(src);
    if (useProxy && MULTITENANT_IMAGES_PROXY) {
        return `${MULTITENANT_IMAGES_PROXY}/api/image?u=${encodeURIComponent(absoluteSrc)}`;
    }
    return absoluteSrc;
}

/** Cover / fill — image stretches to the parent instead of using width/height. */
export function isCoverView(view, fill) {
    return view === 'cover' || fill === true || fill === 'fill';
}

/** Src, normalized URL, and cover flag used by both Image atoms. Proxy is web-only. */
export function getImageProps(props, { useProxy = Platform.OS === 'web' } = {}) {
    const src = getImageSrc(props);
    return {
        src,
        normalizedSrc: toNormalizedSrc(src, { useProxy }),
        isCover: isCoverView(props.view, props.fill),
    };
}

/** Hostname from an absolute URL; empty string if `src` is not parseable. */
function getHostname(src) {
    try {
        return new URL(src).hostname;
    } catch {
        return '';
    }
}

/**
 * Match a hostname against one Next `remotePatterns.hostname` value
 * (`example.com`, `*.example.com`, `**.example.com`).
 */
function matchHostnamePattern(pattern, hostname) {
    if (!pattern || !hostname) return false;
    if (pattern === hostname) return true;

    if (pattern.startsWith('**.')) {
        const suffix = pattern.slice(3);
        return hostname.endsWith('.' + suffix);
    }

    if (!pattern.includes('*')) return false;

    const patternLabels = pattern.split('.');
    const hostLabels = hostname.split('.');
    if (hostLabels.length !== patternLabels.length) return false;

    return patternLabels.every((label, index) => label === '*' || label === hostLabels[index]);
}

/** True if hostname is in `config.image_allowlist_hostnames` (same list as next.config). */
function isHostnameInImageAllowlist(hostname) {
    const patterns = appSetting('config', 'image_allowlist_hostnames') || [];
    return patterns.some((pattern) => matchHostnamePattern(pattern, hostname));
}

/**
 * Whether next/image may run the optimizer on this URL.
 * SVG, `unoptimized`, and hosts outside the allowlist must skip it.
 */
export function canOptimizeSrc(src, { forceUnoptimized = false } = {}) {
    if (forceUnoptimized || !src || isSvgImageSrc(src)) return false;
    return (
        src.startsWith('/') ||
        src.startsWith('data:') ||
        src.startsWith('blob:') ||
        isHostnameInImageAllowlist(getHostname(src))
    );
}

/**
 * If the optimizer URL fails, retry the original src once, then forward `onError`.
 * `retryKey` resets the retry when the image identity changes.
 */
export function useImageOptimizerRetry({ retryKey, canRetry, onError }) {
    const [useOriginalImage, setUseOriginalImage] = useState(false);

    useEffect(() => {
        setUseOriginalImage(false);
    }, [retryKey]);

    const handleError = useCallback((event) => {
        if (canRetry && !useOriginalImage) {
            setUseOriginalImage(true);
            return;
        }
        onError?.(event);
    }, [canRetry, useOriginalImage, onError]);

    return { useOriginalImage, handleError };
}

/**
 * next/image loader that hits `/_next/image`.
 * `maxWidth` caps `w=` so grid cards do not request 1920w+ variants.
 */
export function createOptimizedLoader(maxWidth) {
    return ({ src, width, quality }) => {
        const w = maxWidth ? Math.min(width, maxWidth) : width;
        return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality ?? 75}`;
    };
}

/** Numeric `width` from a RN `style` object, if any. */
export function extractStyleWidth(style) {
    if (!style) return;
    const { width } = StyleSheet.flatten(style);
    if (typeof width === 'number') return width;
}

/**
 * Layout width in px from Tailwind tokens (`w-8` → 32, `w-[40px]`, `w-full` → screen).
 * Used on native when no numeric `width` prop is passed.
 */
export function extractClassNameWidth(className) {
    if (typeof className !== 'string') return;

    for (const raw of className.split(/\s+/)) {
        const token = raw.replace(/^(?:web:|native:|ios:|android:)/, '');
        if (token === 'w-full' || token === 'w-screen' || token === 'size-full') {
            return Dimensions.get('screen').width;
        }
        let match = token.match(/^w-\[(\d+(?:\.\d+)?)px\]$/);
        if (match) return Number(match[1]);
        match = token.match(/^size-\[(\d+(?:\.\d+)?)px\]$/);
        if (match) return Number(match[1]);
        match = token.match(/^w-(\d+)$/);
        if (match) return Number(match[1]) * TAILWIND_SPACING;
        match = token.match(/^size-(\d+)$/);
        if (match) return Number(match[1]) * TAILWIND_SPACING;
    }
}

/** True if className already sets box size (fill wrapper should not add w-full h-full). */
export function hasSizeClass(className) {
    return typeof className === 'string'
        && className.split(/\s+/).some((token) => sizeClassPattern.test(token));
}

/**
 * Snap layout px (× DPR) to the nearest Next `images.deviceSizes` / `imageSizes` value.
 * That `w=` must exist in next.config or the optimizer 400s.
 */
export function normalizeWidth(width) {
    const layout = typeof width === 'number' && width > 0 ? width : DEFAULT_NATIVE_THUMB_WIDTH;
    const calculatedSize = PixelRatio.getPixelSizeForLayoutSize(layout);
    const matchingIndex = IMAGE_SIZE_TABLE.findIndex((size) => size >= calculatedSize);

    if (matchingIndex === -1) return IMAGE_SIZE_TABLE[IMAGE_SIZE_TABLE.length - 1];
    if (matchingIndex === 0) return IMAGE_SIZE_TABLE[0];

    const left = IMAGE_SIZE_TABLE[matchingIndex - 1];
    const right = IMAGE_SIZE_TABLE[matchingIndex];
    return (left + right) / 2 > calculatedSize ? left : right;
}

/**
 * Layout width for the native optimizer URL.
 * Prefer numeric width, then style, then className; cover falls back to screen,
 * thumbs without size fall back to 128 (not full screen).
 * Cover skips numeric/style width — UNA `{...image}` spreads file px, not layout pt.
 */
export function getNativeLayoutWidth({ width, style, className, isCover } = {}) {
    if (!isCover && typeof width === 'number' && width > 0) return width;
    if (!isCover) {
        const styleWidth = extractStyleWidth(style);
        if (styleWidth) return styleWidth;
    }
    const classWidth = extractClassNameWidth(className);
    if (classWidth) return classWidth;
    if (isCover) return Dimensions.get('screen').width;
    return DEFAULT_NATIVE_THUMB_WIDTH;
}

/** Default `sizes` for browse grids: 2 / 3 / 4 columns, then a 320px desktop cap. */
function getImageSizes() {
    const perLine = [
        { width: 1280, count: 4 },
        { width: 1024, count: 4 },
        { width: 768, count: 3 },
        { width: 640, count: 2 },
    ];

    const sorted = perLine
        .filter((x) => x?.width && x?.count > 0)
        .sort((a, b) => a.width - b.width);

    if (!sorted.length) return '100vw';

    const parts = sorted.map(({ width, count }) => {
        const vw = Math.floor(100 / count);
        return `(max-width: ${width}px) ${vw}vw`;
    });

    const last = sorted[sorted.length - 1];
    parts.push(`${Math.max(256, Math.floor(1280 / last.count))}px`);
    return parts.join(', ');
}

/**
 * next/image `sizes` string.
 * Accepts `'auto'`, a LAYOUT_BREAKPOINTS value, or a raw sizes attribute.
 */
export function getSizesAttr(sizes = LAYOUT_BREAKPOINTS.lg) {
    const sizesValue = sizes === 'auto' ? getImageSizes() : sizes;
    return SIZES_BY_BREAKPOINT[sizesValue] ?? sizesValue ?? DEFAULT_SIZES;
}

/**
 * Next optimizer URL for native (`expo-image`).
 * `layoutWidth` is CSS/layout px — `w=` is snapped to IMAGE_SIZE_TABLE.
 * Returns null on web, SVG, or when native_app_images_url is missing.
 */
export function getNativeOptimizedImageUrl(src, layoutWidth) {
    if (Platform.OS === 'web' || !src || isSvgImageSrc(src)) return null;
    const nativeImagesUrl = String(appSetting('config', 'native_app_images_url') || APP_URL || '').replace(/\/+$/, '');
    if (!nativeImagesUrl) return null;
    const absoluteSrc = toAbsoluteImageSrc(src);
    if (!absoluteSrc || absoluteSrc.includes('/_next/image?')) return absoluteSrc || null;
    const w = normalizeWidth(layoutWidth);
    return `${nativeImagesUrl}/_next/image?url=${encodeURIComponent(absoluteSrc)}&w=${w}&q=75`;
}
