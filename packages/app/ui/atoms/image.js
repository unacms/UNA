'use client';

import { SolitoImage } from 'solito/image'
import { Platform, StyleSheet, PixelRatio, Dimensions } from 'react-native';
import { appSetting, cn, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { UNA_URL, APP_URL, MULTITENANT_IMAGES_PROXY } from 'app/config';
//import SvgFile from 'app/ui/molecules/svg-file';
//import { Image as ImageRN } from 'react-native';

export const SolitoImageStyled = SolitoImage

const SIZES_BY_BREAKPOINT = {
    [LAYOUT_BREAKPOINTS.lg]: "(max-width:1024px) 100vw, 1024px",
    [LAYOUT_BREAKPOINTS.xl]: "(max-width:1280px) 100vw, 1280px",
    [LAYOUT_BREAKPOINTS.md]: "(max-width:768px) 100vw, 500px",
};

/** Post detail / modal hero — max-w-3xl (768px) column; 1280w covers 2x DPR. */
export const POST_ENTRY_COVER_SIZES = '(max-width: 768px) 100vw, 768px';
export const POST_ENTRY_COVER_WIDTH_CAP = 1280;

function getHostname(src) {
    try {
        return new URL(src).hostname;
    } catch {
        return '';
    }
}

/** Next.js remotePatterns hostname syntax: * = one label, ** = any subdomain prefix. */
function matchHostnamePattern(pattern, hostname) {
    if (!pattern || !hostname) return false;
    if (pattern === hostname) return true;
    if (!pattern.includes('*')) return false;

    const regexSource = pattern
        .split('.')
        .map((segment) => {
            if (segment === '**') return '([^.]+\\.)*';
            if (segment === '*') return '[^.]+';
            return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('\\.');

    return new RegExp(`^${regexSource}$`).test(hostname);
}

function isHostnameInImageAllowlist(hostname) {
    const patterns = appSetting('config', 'image_allowlist_hostnames') || [];
    return patterns.some((pattern) => matchHostnamePattern(pattern, hostname));
}

const passthroughLoader = ({ src }) => src;

function createOptimizedLoader(maxWidth) {
    return ({ src, width, quality }) => {
        const w = maxWidth ? Math.min(width, maxWidth) : width;
        return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality ?? 75}`;
    };
}
const sizeClassPattern = /^(?:web:)?(?:w-|h-|size-|aspect-)/

function extractStyleWidth(style) {
    if (style) {
        const { width } = StyleSheet.flatten(style);

        if (typeof width === 'number') {
            return width;
        }
    }
}

function hasSizeClass(className) {
    return typeof className === 'string'
        && className.split(/\s+/).some((token) => sizeClassPattern.test(token));
}

const config = {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
};

const SIZES = [...config.imageSizes, ...config.deviceSizes];

function normalizeWidth(width) {
    const calculatedSize = PixelRatio.getPixelSizeForLayoutSize(width);
    const matchingIndex = SIZES.findIndex((size) => size >= calculatedSize);

    if (matchingIndex === -1) {
        return SIZES[SIZES.length - 1];
    } else if (matchingIndex === 0) {
        return SIZES[0];
    } else {
        const left = SIZES[matchingIndex - 1];
        const right = SIZES[matchingIndex];

        if ((left + right) / 2 > width) {
            return left;
        }

        return right;
    }
}

function getImageSizes() {
    const perLine = [
        { width: 1280, count: 4 },
        { width: 1024, count: 4 },
        { width: 768, count: 3 },
        { width: 640, count: 2 },
    ];

    const sorted = perLine
        .filter(x => x?.width && x?.count > 0)
        .sort((a, b) => a.width - b.width);

    if (!sorted.length) return '100vw';

    const parts = sorted.map(({ width, count }) => {
        const vw = Math.floor(100 / count);
        return `(max-width: ${width}px) ${vw}vw`;
    });

    const last = sorted[sorted.length - 1];
    // Pixel cap for desktop grid slots (~4 cols). Stops lazy cards from requesting 3840w variants.
    parts.push(`${Math.max(256, Math.floor(1280 / last.count))}px`);

    return parts.join(', ');
}

function ElementImageResolved(props) {
    let {
        width,
        height,
        alt = "",
        src = '',
        style,
        source,
        nobg,
        sizes = LAYOUT_BREAKPOINTS.lg,
        optimizedWidthCap,
        key: _ignoredKey,
        ...rest
    } = props; // remove width & height

    const isAbsoluteHttp = /^https?:\/\//i.test(src);
    const isBlob = src.startsWith("blob:");
    const isDataImage = src.startsWith("data:image");
    const isStatic = src.startsWith("/static/");

    if (!isAbsoluteHttp && !isBlob && !isDataImage && !isStatic) {
        const absoluteSrc = UNA_URL + src;
        if (MULTITENANT_IMAGES_PROXY && Platform.OS === 'web') {
            src = MULTITENANT_IMAGES_PROXY + '/api/image?u=' + encodeURIComponent(absoluteSrc);
        } else {
            src = absoluteSrc;
        }
    } else if (isAbsoluteHttp && !isBlob && !isDataImage && !isStatic && MULTITENANT_IMAGES_PROXY && Platform.OS === 'web') {
        src = MULTITENANT_IMAGES_PROXY + '/api/image?u=' + encodeURIComponent(src);
    }

    if (sizes === "auto") {
        sizes = getImageSizes();
    }

    sizes = SIZES_BY_BREAKPOINT[sizes] ?? sizes ?? "(max-width:768px) 100vw, 500px";

    const styleWidth = useMemo(() => extractStyleWidth(style), [
        style == null ? null : StyleSheet.flatten(style)?.width,
    ]);

    const resolvedStyle = useMemo(() => {
        if (nobg) return {};

        if (Platform.OS !== 'web') {
            return { ...style, backgroundColor: appSetting('layout', 'background_image_color') };
        }

        return style;
    }, [nobg, style]);

    const nativeImagesUrl = appSetting('config', 'native_app_images_url') || APP_URL;

    const nativeOptimizedSrc = useMemo(() => {
        if (Platform.OS === 'web' || !src || src.includes('.svg') || !nativeImagesUrl) {
            return null;
        }

        const layoutWidth =
            (typeof width === 'number' && width > 0 ? width : null) ??
            styleWidth ??
            Dimensions.get('screen').width;
        const w = normalizeWidth(layoutWidth);
        return `${nativeImagesUrl}/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
    }, [src, width, styleWidth, nativeImagesUrl]);

    const [nativeSrcMode, setNativeSrcMode] = useState('optimized');

    useEffect(() => {
        setNativeSrcMode('optimized');
    }, [src, nativeOptimizedSrc]);

    const resolvedSrc = useMemo(() => {
        if (Platform.OS !== 'web') {
            if (nativeSrcMode === 'direct' || !nativeOptimizedSrc) {
                return src;
            }
            return nativeOptimizedSrc;
        }
        return src;
    }, [src, nativeSrcMode, nativeOptimizedSrc]);

    const canOptimize = Platform.OS === 'web' && (
        resolvedSrc.startsWith('/') || resolvedSrc.startsWith('data:') || resolvedSrc.startsWith('blob:') ||
        isHostnameInImageAllowlist(getHostname(resolvedSrc))
    );

    const [failedAttempts, setFailedAttempts] = useState(0);

    useEffect(() => {
        setFailedAttempts(0);
    }, [resolvedSrc]);

    const handleError = useCallback(() => {
        if (Platform.OS !== 'web') {
            setNativeSrcMode((mode) => (mode === 'optimized' ? 'direct' : mode));
            return;
        }
        setFailedAttempts((attempts) => (attempts < 1 ? attempts + 1 : attempts));
    }, []);

    const useOptimized = canOptimize && failedAttempts === 0;

    const loader = useMemo(
        () => (useOptimized ? createOptimizedLoader(optimizedWidthCap ?? 1920) : passthroughLoader),
        [useOptimized, optimizedWidthCap]
    );

    const imageRest = useMemo(() => {
        const updatedRest = { ...rest };

        if (rest.view === "cover") {
            updatedRest.fill = 'fill';
            updatedRest.contentFit = "cover";
        } else {
            updatedRest.height = rest.pref_height || height;
            updatedRest.width = rest.pref_width || width;
        }

        if (Platform.OS !== 'web') {
            updatedRest.cachePolicy = rest.cachePolicy ?? 'memory-disk';
            updatedRest.recyclingKey = rest.recyclingKey ?? src;
        }

        return updatedRest;
    }, [rest.view, height, width, rest.pref_height, rest.pref_width, rest.cachePolicy, rest.recyclingKey, src]);

    const imageProps = {
        onError: handleError,
        ...imageRest,
        src: resolvedSrc,
        alt,
        sizes,
        ...(useOptimized ? { loader } : { unoptimized: true, loader: passthroughLoader }),
    };
    const imageKey = Platform.OS === 'web'
        ? `${resolvedSrc}-${failedAttempts}`
        : `${src}-${nativeSrcMode}`;

    if (Platform.OS === 'web' && imageRest.fill === 'fill') {
        const { className, ...fillImageProps } = imageProps;
        const wrapperSizeClass = hasSizeClass(className) ? '' : 'w-full h-full';

        return (
            <span className={cn('relative block overflow-hidden', wrapperSizeClass, className)} style={resolvedStyle}>
                <SolitoImageStyled
                    key={imageKey}
                    {...fillImageProps}
                    className={className}
                />
            </span>
        );
    }

    return (
        <SolitoImageStyled
            key={imageKey}
            {...imageProps}
            style={resolvedStyle}
        />
    );
}

export default function ElementImage(props) {
    if (!props.src) return null;

    return <ElementImageResolved {...props} />;
}