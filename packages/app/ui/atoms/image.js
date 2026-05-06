import { SolitoImage } from 'solito/image'
import { Platform, StyleSheet, PixelRatio, Dimensions } from 'react-native';
import { appSetting, cn, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { useMemo } from 'react';
import { UNA_URL, APP_URL, MULTITENANT_IMAGES_PROXY } from 'app/config';
//import SvgFile from 'app/ui/molecules/svg-file';
//import { Image as ImageRN } from 'react-native';

export const SolitoImageStyled = SolitoImage

const SIZES_BY_BREAKPOINT = {
    [LAYOUT_BREAKPOINTS.lg]: "(max-width:1024px) 100vw, 1024px",
    [LAYOUT_BREAKPOINTS.xl]: "(max-width:1280px) 100vw, 1280px",
    [LAYOUT_BREAKPOINTS.md]: "(max-width:768px) 100vw, 500px",
};

function getHostname(src) {
    try {
        return new URL(src).hostname;
    } catch {
        return '';
    }
}

const passthroughLoader = ({ src }) => src;
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
    parts.push(`${Math.floor(100 / last.count)}vw`);

    return parts.join(', ');
}

export default function ElementImage(props) {
    let { width, height, alt = "", src = '', style, source, nobg, sizes = LAYOUT_BREAKPOINTS.lg, ...rest } = props; // remove width & height
    if (!src) return null;

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

    style = useMemo(() => {
        if (nobg) return {};

        if (Platform.OS !== 'web') {
            return { ...style, backgroundColor: appSetting('layout', 'background_image_color') };
        } 
    }, [nobg, style]);

    const nativeImagesUrl = appSetting('config', 'native_app_images_url') || APP_URL;

    src = useMemo(() => {
        let updatedSrc = src;

        if (Platform.OS !== 'web' && !src.includes('.svg')) {
            
            if (nativeImagesUrl) {
                const screenWidth = Dimensions.get('screen').width;
                const imageWidth = extractStyleWidth(style) || width || screenWidth;
                const w = normalizeWidth(imageWidth);
                updatedSrc = nativeImagesUrl + "/_next/image?url=" + encodeURIComponent(src) + "&w=" + w + "&q=75";
            }
        }

        return updatedSrc;
    }, [src, style, width]);

    const optimize = Platform.OS === 'web' && (
        src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:') ||
        appSetting('config', 'image_allowlist_hostnames').includes(getHostname(src))
    );

    rest = useMemo(() => {
        const updatedRest = { ...rest };

        if (rest.view === "cover") {
            updatedRest.fill = 'fill';
            //if (Platform.OS !== 'web') {
            updatedRest.contentFit = "cover";
            //}
        } else {
            updatedRest.height = rest.pref_height || height;
            updatedRest.width = rest.pref_width || width;
        }

        return updatedRest;
    }, [rest.view, height, width, rest.pref_height, rest.pref_width, rest]);

    return useMemo(() => {
        const imageProps = {
            onError: (e) => console.log('!!!!Image loading error:', e, src),
            ...rest,
            src,
            alt,
            sizes,
            ...(!optimize ? { unoptimized: true, loader: passthroughLoader } : {}),
        };

        if (Platform.OS === 'web' && rest.fill === 'fill') {
            const { className, ...fillImageProps } = imageProps;
            const wrapperSizeClass = hasSizeClass(className) ? '' : 'w-full h-full';

            return (
                <span className={cn('relative block overflow-hidden', wrapperSizeClass, className)} style={style}>
                    <SolitoImageStyled
                        {...fillImageProps}
                        className={className}
                    />
                </span>
            );
        }

        return (
            <SolitoImageStyled
                {...imageProps}
                style={style}
            />
        );
    }, [rest, src, alt, style, sizes, optimize]);
}