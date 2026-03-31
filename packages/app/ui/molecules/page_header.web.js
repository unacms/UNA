import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util';
import {
    useScrollValue,
    useSetScrollValue,
} from 'app/context/jotai/layout';
import {
    PageHeaderBody,
    PageHeaderSmall,
    TextHeader,
    usePageHeaderBase,
} from 'app/ui/molecules/page_header-shared';

const DEFAULT_ENTER_TRANSITION = 'web:duration-300 web:ease-out';
const DEFAULT_ENTER_TRANSLATE = 'web:-translate-y-full';
const DEFAULT_DISMISS_TRANSITION = 'web:duration-300 web:ease-in-out';
const DEFAULT_DISMISS_TRANSLATE = '';
const DEFAULT_DISMISS_MS = 500;

export { PageHeaderSmall, TextHeader };

function clearTimer(ref) {
    if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
    }
}

function cancelFrame(ref) {
    if (ref.current) {
        cancelAnimationFrame(ref.current);
        ref.current = null;
    }
}

function s(key) {
    return appSetting('layout', 'header', key) || '';
}

export const PageHeader = ({ pageData }) => {
    const headerState = usePageHeaderBase(pageData, { resetHeaderOnRoute: true });
    const {
        header,
        headerHeight,
        isCollapsibleHeader,
        onHeaderLayout,
        scrollDirection,
    } = headerState;

    const scrollY = useScrollValue();
    const setScrollValue = useSetScrollValue();
    const isMobileCollapsible = isCollapsibleHeader;

    const enterTransition = s('fixed_enter_transition') || DEFAULT_ENTER_TRANSITION;
    const enterTranslate = typeof appSetting('layout', 'header', 'fixed_enter_translate') === 'string'
        ? appSetting('layout', 'header', 'fixed_enter_translate')
        : DEFAULT_ENTER_TRANSLATE;
    const dismissTransition = s('fixed_dismiss_transition') || DEFAULT_DISMISS_TRANSITION;
    const dismissTranslate = typeof appSetting('layout', 'header', 'fixed_dismiss_translate') === 'string'
        ? appSetting('layout', 'header', 'fixed_dismiss_translate')
        : DEFAULT_DISMISS_TRANSLATE;
    const dismissMs = Number.isFinite(Number(appSetting('layout', 'header', 'fixed_dismiss_ms')))
        ? Number(appSetting('layout', 'header', 'fixed_dismiss_ms'))
        : DEFAULT_DISMISS_MS;

    const floatingSurface = s('floating_surface');
    const floatingSurfaceDown = s('floating_surface_scroll_down');
    const floatingSurfaceUp = s('floating_surface_scroll_up');
    const floatingContentInitial = s('floating_content_initial') || ' opacity-100 ';
    const floatingContentDown = s('floating_content_scroll_down');
    const floatingContentUp = s('floating_content_scroll_up');

    const hasScrolledPastHeader =
        isMobileCollapsible && headerHeight > 0 && scrollY >= headerHeight;

    const [isSurfaceMounted, setIsSurfaceMounted] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const closeTimerRef = useRef(null);
    const openFrameRef = useRef(null);

    useLayoutEffect(() => {
        const currentScrollY = window.scrollY ?? 0;
        setScrollValue(currentScrollY);
        clearTimer(closeTimerRef);
        cancelFrame(openFrameRef);
        setIsSurfaceMounted(false);
        setIsOpening(false);
        setIsClosing(false);
    }, [isMobileCollapsible, pageData?.uri, pageData?.url, setScrollValue]);

    useEffect(() => () => {
        clearTimer(closeTimerRef);
        cancelFrame(openFrameRef);
    }, []);

    useEffect(() => {
        if (!isMobileCollapsible || !hasScrolledPastHeader || scrollDirection !== -1 || isSurfaceMounted) {
            return;
        }

        clearTimer(closeTimerRef);
        setIsSurfaceMounted(true);
        setIsOpening(true);
        setIsClosing(false);
        openFrameRef.current = requestAnimationFrame(() => {
            openFrameRef.current = null;
            setIsOpening(false);
        });
    }, [hasScrolledPastHeader, isMobileCollapsible, isSurfaceMounted, scrollDirection]);

    useEffect(() => {
        if (!isMobileCollapsible || !isSurfaceMounted || isClosing || scrollDirection !== 1) {
            return;
        }

        clearTimer(closeTimerRef);
        cancelFrame(openFrameRef);
        setIsOpening(false);
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setIsClosing(false);
            setIsSurfaceMounted(false);
        }, dismissMs);
    }, [dismissMs, isClosing, isMobileCollapsible, isSurfaceMounted, scrollDirection]);

    useEffect(() => {
        if (!isMobileCollapsible || !isClosing || scrollDirection === 1) {
            return;
        }

        clearTimer(closeTimerRef);
        setIsClosing(false);
    }, [isClosing, isMobileCollapsible, scrollDirection]);

    useEffect(() => {
        if (!isMobileCollapsible || !isSurfaceMounted || isClosing || scrollY > 0) {
            return;
        }

        setIsSurfaceMounted(false);
        setIsOpening(false);
    }, [isClosing, isMobileCollapsible, isSurfaceMounted, scrollY]);

    if (header.header === false) {
        return null;
    }

    const shouldRenderSurface = isMobileCollapsible && (isSurfaceMounted || isClosing);
    const flowHeaderEnteringViewport =
        isMobileCollapsible && isSurfaceMounted && headerHeight > 0 && scrollY < headerHeight;
    const surfaceOpacity = isClosing
        ? 0
        : flowHeaderEnteringViewport
            ? Math.max(0, Math.min(1, scrollY / headerHeight))
            : 1;

    const containerBase = (s('container') || '')
        .replace('header-fixed', '')
        .replace('web:fixed', '')
        .replace('web:top-0', '')
        .replace('web:transition-transform', '')
        .replace('web:duration-300', '')
        .replace('web:ease-in-out', '');
    const fixedShell =
        ' header-fixed web:fixed web:top-0 web:left-0 web:right-0 web:z-50 -mt-[env(safe-area-inset-top)] pt-[env(safe-area-inset-top)] ';
    const contentClass = s('content') || '';
    const initialSurfaceClass = s('initial_surface') || '';

    const scrollContentClass = scrollDirection === 1
        ? floatingContentDown
        : scrollDirection === -1
            ? floatingContentUp
            : floatingContentInitial;
    const scrollSurfaceClass = scrollDirection === 1
        ? floatingSurfaceDown
        : scrollDirection === -1
            ? floatingSurfaceUp
            : '';

    if (!isMobileCollapsible) {
        const desktopSpacer = true;
        const desktopTranslate = isCollapsibleHeader && scrollDirection === 1
            ? 'web:-translate-y-full'
            : 'web:translate-y-0';
        return (
            <>
                {desktopSpacer && (
                    <View aria-hidden="true" style={{ height: headerHeight }} />
                )}
                <View
                    className={`${containerBase} ${fixedShell} ${desktopTranslate}`}
                    onLayout={onHeaderLayout}
                >
                    <PageHeaderBody
                        {...headerState}
                        contentClassName={contentClass}
                        pageData={pageData}
                    />
                </View>
            </>
        );
    }

    const surfaceTranslateClass = isClosing
        ? dismissTranslate
        : isOpening
            ? enterTranslate
            : 'web:translate-y-0';
    const surfaceTransitionClass = isClosing
        ? `web:transition-[transform,opacity] ${dismissTransition}`
        : isOpening
            ? `web:transition-transform ${enterTransition}`
            : '';

    return (
        <>
            {/* Initial surface: relative, in-flow, surface-only (no interactive content) */}
            <View
                className={`${containerBase} web:relative web:top-auto web:translate-y-0 ${contentClass} ${initialSurfaceClass}`}
                onLayout={onHeaderLayout}
                aria-hidden="true"
            />

            {/* Floating surface: fixed bg/border/blur, mounted on scroll */}
            {shouldRenderSurface && (
                <View
                    className={`${containerBase} ${fixedShell} ${surfaceTranslateClass} ${surfaceTransitionClass} ${contentClass} ${floatingSurface} ${scrollSurfaceClass}`}
                    style={{ opacity: surfaceOpacity }}
                    pointerEvents="none"
                    aria-hidden="true"
                />
            )}

            {/* Content layer: always mounted, fixed, on top of both surfaces */}
            <View
                className={`${containerBase} ${fixedShell} web:translate-y-0 web:transition-opacity web:duration-300 web:ease-in-out ${scrollContentClass}`}
                pointerEvents={scrollDirection === 1 ? 'none' : 'auto'}
            >
                <PageHeaderBody
                    {...headerState}
                    contentClassName={contentClass}
                    pageData={pageData}
                />
            </View>
        </>
    );
};
