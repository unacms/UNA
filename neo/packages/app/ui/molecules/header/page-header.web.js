import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';
import {
    NeoButtonColorSchemeContext,
    colorSchemeForBackground,
    isVisibleColor,
} from 'app/design/controls/neo-button/color-scheme-context';
import {
    useScrollValue,
    useSetScrollValue,
} from 'app/context/jotai/layout';
import {
    getPageHeaderBandClass,
    PageHeaderBody,
    PageHeaderSmall,
    TextHeader,
    getHeaderFadeClass,
    getHeaderFadeExtend,
    resolveHeaderContainerClassName,
    resolveHeaderContentClassNames,
    usePageHeaderBase,
} from 'app/ui/molecules/header/page-header-parts';

/** Matches `web:duration-300` (must be a static class for Tailwind JIT). Dismiss unmount waits for transition end. */
const FIXED_BAR_MOTION_MS = 300;
const FIXED_BAR_DISMISS_MS = FIXED_BAR_MOTION_MS + 80;

export { PageHeaderSmall, TextHeader };

function clearTimer(timerRef) {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
}

function clearEnterFrame(frameRef) {
    if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
    }
}

let colorCanvas = null;

/**
 * Any CSS colour as `rgba()`, or null. Computed styles can report `oklab()` or `color()`
 * (Tailwind's `/80` opacity modifier is a `color-mix()`), which processColor doesn't parse.
 */
function cssColorToRgba(color) {
    if (!color || !CSS.supports('color', color)) return null;
    colorCanvas ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!colorCanvas) return null;
    colorCanvas.clearRect(0, 0, 1, 1);
    colorCanvas.fillStyle = color;
    colorCanvas.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorCanvas.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
}

/** `layout.header.band_scheme` for the band's current fill (see settings/layout.js). */
function readBandScheme(band, setting) {
    const fill = cssColorToRgba(getComputedStyle(band).backgroundColor);
    if (!isVisibleColor(fill)) return null;
    if (setting === 'light' || setting === 'dark') return setting;
    if (setting !== 'auto') return null;
    const page = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
    return colorSchemeForBackground(fill, page ? cssColorToRgba(`rgb(${page})`) : undefined);
}

/**
 * The band's scheme as an external store: read from its computed fill, so `sm:` / `lg:` /
 * `dark:` classes count, and read again only after a resize or a theme change on <html>
 * (the header re-renders on every scroll frame).
 */
function createBandSchemeStore(band, setting) {
    let value = null;
    let stale = true;
    return {
        getSnapshot() {
            if (stale) {
                value = band && setting ? readBandScheme(band, setting) : null;
                stale = false;
            }
            return value;
        },
        subscribe(onChange) {
            if (!band || !setting) return () => {};
            const update = () => {
                stale = true;
                onChange();
            };
            window.addEventListener('resize', update);
            const themeObserver = new MutationObserver(update);
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['theme', 'data-theme', 'class'] });
            return () => {
                window.removeEventListener('resize', update);
                themeObserver.disconnect();
            };
        },
    };
}

const getServerBandScheme = () => null;

/**
 * Colour scheme for the header's buttons while they rest on the band (collapsible layout
 * only; the band isn't rendered otherwise). The flow header scrolls away together with the
 * band, so it always has it; the fixed layer has it at the top of the page, where it covers
 * the band, and keeps the app's scheme once it floats over content.
 */
function useBandScheme(band, enabled) {
    const setting = enabled ? appSetting('layout', 'header', 'band_scheme') : null;
    const store = useMemo(() => createBandSchemeStore(band, setting), [band, setting]);
    return useSyncExternalStore(store.subscribe, store.getSnapshot, getServerBandScheme);
}

function HeaderFade({ headerHeight, isScrolled }) {
    const fadeClass = getHeaderFadeClass();
    const fadeExtend = getHeaderFadeExtend();
    if (!fadeClass || headerHeight <= 0) {
        return null;
    }

    return (
        <div
            aria-hidden
            className={`pointer-events-none absolute left-0 right-0 top-0 z-0 lg:hidden ${fadeClass}`}
            style={{
                height: headerHeight + fadeExtend,
                opacity: isScrolled ? 1 : 0,
                transition: 'opacity 300ms ease-in-out',
            }}
        />
    );
}

export const PageHeader = ({ pageData }) => {
    const headerState = usePageHeaderBase(pageData);
    const {
        header,
        headerHeight,
        isCollapsibleHeader,
        onHeaderLayout,
        scrollDirection,
    } = headerState;

    const scrollY = useScrollValue();
    const setScrollValue = useSetScrollValue();
    const usesFixedOverlayHeader = isCollapsibleHeader;
    const [band, setBand] = useState(null);
    const bandScheme = useBandScheme(band, usesFixedOverlayHeader);
    const pastRevealThreshold =
        usesFixedOverlayHeader && headerHeight > 0 && scrollY >= headerHeight;

    const [isFixedMounted, setIsFixedMounted] = useState(false);
    const [isEntering, setIsEntering] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const enterFrameRef = useRef(null);
    const closeTimerRef = useRef(null);

    useLayoutEffect(() => {
        const currentScrollY = window.scrollY ?? 0;
        setScrollValue(currentScrollY);
        clearEnterFrame(enterFrameRef);
        clearTimer(closeTimerRef);
        setIsFixedMounted(usesFixedOverlayHeader && currentScrollY <= 0);
        setIsEntering(false);
        setIsClosing(false);
    }, [usesFixedOverlayHeader, pageData?.uri, pageData?.url, setScrollValue]);

    useEffect(() => () => {
        clearEnterFrame(enterFrameRef);
        clearTimer(closeTimerRef);
    }, []);

    useEffect(() => {
        if (!usesFixedOverlayHeader || !pastRevealThreshold || scrollDirection !== -1 || isFixedMounted) {
            return;
        }

        clearTimer(closeTimerRef);
        clearEnterFrame(enterFrameRef);
        setIsFixedMounted(true);
        setIsClosing(false);
        setIsEntering(true);
        enterFrameRef.current = requestAnimationFrame(() => {
            enterFrameRef.current = requestAnimationFrame(() => {
                enterFrameRef.current = null;
                setIsEntering(false);
            });
        });
    }, [isFixedMounted, pastRevealThreshold, scrollDirection, usesFixedOverlayHeader]);

    useEffect(() => {
        if (!usesFixedOverlayHeader || !isFixedMounted || isClosing || scrollDirection !== 1) {
            return;
        }

        clearEnterFrame(enterFrameRef);
        clearTimer(closeTimerRef);
        setIsEntering(false);
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setIsClosing(false);
            setIsFixedMounted(false);
        }, FIXED_BAR_DISMISS_MS);
        return () => clearTimer(closeTimerRef);
    }, [isClosing, isFixedMounted, scrollDirection, usesFixedOverlayHeader]);

    useEffect(() => {
        if (!usesFixedOverlayHeader || !isClosing || scrollDirection === 1) {
            return;
        }

        clearTimer(closeTimerRef);
        setIsClosing(false);
    }, [isClosing, scrollDirection, usesFixedOverlayHeader]);

    if (header.header === false) {
        return null;
    }

    const showFixedHeader = isFixedMounted && !isClosing;
    const shouldRenderFixedLayer = usesFixedOverlayHeader && (isFixedMounted || isClosing);
    const allowPointerEvents = showFixedHeader && !isEntering;
    const isScrolled = scrollY > 0;
    const headerContainerBaseClass = resolveHeaderContainerClassName(isScrolled);
    const fixedHeaderClass =
        ' ns--header-wrapper-fixed-- header-fixed web:fixed web:top-0 web:left-0 web:right-0 web:z-50 ne--';
    const flowTransitionClass =
        ` ns--header-wrapper--transition-- web:transition-[transform,opacity,background-color,border-color] web:duration-300 web:ease-in-out ne-- `;
    const flowHeaderContainerClassName = usesFixedOverlayHeader
        ? `${headerContainerBaseClass} web:relative web:top-auto web:translate-y-0 overflow-visible ${flowTransitionClass}`
        : `${headerContainerBaseClass} ${fixedHeaderClass} ${isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full' : ' ns--header-position-start-- web:translate-y-0 ne--' } overflow-visible ${flowTransitionClass}`;
    const fixedHeaderMotionClass =
        isClosing || isEntering
            ? 'web:-translate-y-full web:opacity-0'
            : 'web:translate-y-0 web:opacity-100';
    const fixedHeaderMotionTransition =
        'web:transition-[transform,opacity] web:duration-300 web:ease-in-out';
    const fixedHeaderContainerClassName = `${headerContainerBaseClass} ${fixedHeaderClass} ${fixedHeaderMotionClass} ${fixedHeaderMotionTransition} overflow-visible`;
    const { flowHeaderContentClassName, fixedOverlayContentClassName } =
        resolveHeaderContentClassNames({ usesFixedOverlayHeader, isScrolled });
    const headerPointerEvents = usesFixedOverlayHeader && shouldRenderFixedLayer && !allowPointerEvents
        ? 'none'
        : 'auto';
    const flowHeaderStyle = usesFixedOverlayHeader && shouldRenderFixedLayer
        ? { visibility: 'hidden' }
        : undefined;
    const showFixedDesktopSpacer = !usesFixedOverlayHeader;

    return (
        <>
            {showFixedDesktopSpacer && (
                <View aria-hidden="true" style={{ height: headerHeight }} />
            )}
            {/* The card band behind the header at rest: part of the page (top of
                the flow header's slot), so it scrolls away; the fixed header
                layer that shows at the top keeps its gradient chrome. */}
            {usesFixedOverlayHeader && headerHeight > 0 ? (
                <div
                    ref={setBand}
                    aria-hidden
                    className={`pointer-events-none absolute left-0 right-0 top-0 ${getPageHeaderBandClass()}`}
                    style={{ height: headerHeight }}
                />
            ) : null}
            <View
                className={flowHeaderContainerClassName}
                role={usesFixedOverlayHeader && shouldRenderFixedLayer ? undefined : 'banner'}
                aria-hidden={usesFixedOverlayHeader && shouldRenderFixedLayer ? 'true' : undefined}
                style={flowHeaderStyle}
                onLayout={onHeaderLayout}
            >
                <HeaderFade headerHeight={headerHeight} isScrolled={isScrolled} />
                <View className="relative z-10">
                    <NeoButtonColorSchemeContext.Provider value={bandScheme}>
                        <PageHeaderBody
                            {...headerState}
                            contentClassName={flowHeaderContentClassName}
                            pageData={pageData}
                        />
                    </NeoButtonColorSchemeContext.Provider>
                </View>
            </View>
            {usesFixedOverlayHeader && shouldRenderFixedLayer && (
                <View
                    className={fixedHeaderContainerClassName}
                    role="banner"
                    pointerEvents={headerPointerEvents}
                >
                    <HeaderFade headerHeight={headerHeight} isScrolled={isScrolled} />
                    <View className="relative z-10">
                        <NeoButtonColorSchemeContext.Provider value={isScrolled ? null : bandScheme}>
                            <PageHeaderBody
                                {...headerState}
                                contentClassName={fixedOverlayContentClassName}
                                pageData={pageData}
                            />
                        </NeoButtonColorSchemeContext.Provider>
                    </View>
                </View>
            )}
        </>
    );
};
