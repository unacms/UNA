import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
const DEFAULT_DISMISS_MS = 500;
const DEFAULT_ENTER_MS = 500;
const DEFAULT_FIXED_LAYER =
    'header-fixed web:fixed web:left-0 web:right-0 web:top-0 web:z-50 -mt-[env(safe-area-inset-top)] pt-[env(safe-area-inset-top)]';
/** After enter, scroll-driven show/hide still animates opacity; transform included so settle matches slide-in. */
const DEFAULT_CONTENT_TRANSITION =
    'web:transition-[transform,opacity] web:duration-300 web:ease-in-out';

export { PageHeaderSmall, TextHeader };

function s(key) {
    return appSetting('layout', 'header', key) || '';
}

function num(key, fallback) {
    const v = appSetting('layout', 'header', key);
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function clearTimer(ref) {
    if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
    }
}

/** `container` mixes in-flow and fixed tokens; strip fixed/transition bits for the in-flow strip base. */
function stripContainerForInFlow(container) {
    if (!container) return '';
    return container
        .replace(/\bheader-fixed\b/g, '')
        .replace(/\bweb:fixed\b/g, '')
        .replace(/\bweb:top-0\b/g, '')
        .replace(/\bweb:transition-transform\b/g, '')
        .replace(/\bweb:duration-300\b/g, '')
        .replace(/\bweb:ease-in-out\b/g, '');
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

    const revealOnScrollDown = appSetting('layout', 'header', 'fixed_reveal_on') === 'scroll_down';
    const revealDirection = revealOnScrollDown ? 1 : -1;
    const dismissDirection = -revealDirection;

    const enterTransition = s('fixed_enter_transition') || DEFAULT_ENTER_TRANSITION;
    const enterTranslate =
        typeof appSetting('layout', 'header', 'fixed_enter_translate') === 'string'
            ? appSetting('layout', 'header', 'fixed_enter_translate')
            : DEFAULT_ENTER_TRANSLATE;
    const dismissTransition = s('fixed_dismiss_transition') || DEFAULT_DISMISS_TRANSITION;
    const dismissTranslate =
        typeof appSetting('layout', 'header', 'fixed_dismiss_translate') === 'string'
            ? appSetting('layout', 'header', 'fixed_dismiss_translate')
            : '';
    const dismissMs = num('fixed_dismiss_ms', DEFAULT_DISMISS_MS);
    const enterMs = num('fixed_enter_ms', DEFAULT_ENTER_MS);

    const floatingSurface = s('floating_surface');
    const floatingContentInitial = s('floating_content_initial') || ' opacity-100 ';
    const contentWhenVisible = s('floating_content_visible') || s('floating_content_scroll_up') || ' opacity-100 ';
    const contentWhenHidden = s('floating_content_hidden') || s('floating_content_scroll_down') || ' hidden ';

    const fixedLayer = (s('fixed_layer') || '').trim() || DEFAULT_FIXED_LAYER;
    const contentTransition = s('fixed_content_transition') || DEFAULT_CONTENT_TRANSITION;

    const hasScrolledPastHeader =
        isMobileCollapsible && headerHeight > 0 && scrollY >= headerHeight;

    const [isSurfaceMounted, setIsSurfaceMounted] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const closeTimerRef = useRef(null);
    const enterTimerRef = useRef(null);
    /** scroll_up mode only: upward scroll accumulated while scrollDirection matches reveal (resets on other directions). */
    const scrollRevealAccumRef = useRef(0);
    const prevScrollYForRevealRef = useRef(0);
    /** Synchronous guard so `beginSurfaceMount` is idempotent (Strict Mode / rapid scroll edge cases). */
    const surfaceMountCommittedRef = useRef(false);

    const revealScrollThresholdPx = num('fixed_reveal_scroll_threshold_px', 100);

    /** Interactive row is fixed + scroll-driven visibility only when floating chrome is active, or always when configured for scroll-down reveal. */
    const useFixedInteractiveChrome =
        isMobileCollapsible &&
        (revealOnScrollDown || isSurfaceMounted || isClosing);

    useLayoutEffect(() => {
        const currentScrollY = window.scrollY ?? 0;
        setScrollValue(currentScrollY);
        clearTimer(closeTimerRef);
        clearTimer(enterTimerRef);
        setIsSurfaceMounted(false);
        setIsOpening(false);
        setIsClosing(false);
        surfaceMountCommittedRef.current = false;
        scrollRevealAccumRef.current = 0;
        prevScrollYForRevealRef.current = typeof window !== 'undefined' ? window.scrollY ?? 0 : 0;
    }, [isMobileCollapsible, pageData?.uri, pageData?.url, setScrollValue]);

    useEffect(
        () => () => {
            clearTimer(closeTimerRef);
            clearTimer(enterTimerRef);
        },
        []
    );

    const beginSurfaceMount = useCallback(() => {
        if (surfaceMountCommittedRef.current) {
            return;
        }
        surfaceMountCommittedRef.current = true;
        clearTimer(closeTimerRef);
        setIsSurfaceMounted(true);
        setIsOpening(true);
        setIsClosing(false);
        scrollRevealAccumRef.current = 0;
        clearTimer(enterTimerRef);
        enterTimerRef.current = setTimeout(() => {
            enterTimerRef.current = null;
            setIsOpening(false);
        }, enterMs);
    }, [enterMs]);

    /** scroll_down mode: mount fixed chrome as soon as reveal direction + past header (no scroll-distance threshold). */
    useEffect(() => {
        if (
            !isMobileCollapsible ||
            !revealOnScrollDown ||
            !hasScrolledPastHeader ||
            scrollDirection !== revealDirection ||
            isSurfaceMounted
        ) {
            return;
        }

        beginSurfaceMount();
    }, [
        beginSurfaceMount,
        hasScrolledPastHeader,
        isMobileCollapsible,
        isSurfaceMounted,
        revealDirection,
        revealOnScrollDown,
        scrollDirection,
    ]);

    /**
     * scroll_up mode: require `fixed_reveal_scroll_threshold_px` of upward movement while scrollDirection
     * stays on reveal (avoids mount flicker from rubber-band / tiny bounce).
     */
    useEffect(() => {
        if (!isMobileCollapsible || revealOnScrollDown || isSurfaceMounted || isClosing) {
            return;
        }
        if (!hasScrolledPastHeader) {
            scrollRevealAccumRef.current = 0;
            prevScrollYForRevealRef.current = scrollY;
            return;
        }

        if (scrollDirection !== revealDirection) {
            scrollRevealAccumRef.current = 0;
            prevScrollYForRevealRef.current = scrollY;
            return;
        }

        const prev = prevScrollYForRevealRef.current;
        const deltaUp = prev - scrollY;
        if (deltaUp > 0) {
            scrollRevealAccumRef.current += deltaUp;
        }
        prevScrollYForRevealRef.current = scrollY;

        if (scrollRevealAccumRef.current < revealScrollThresholdPx) {
            return;
        }

        beginSurfaceMount();
    }, [
        beginSurfaceMount,
        hasScrolledPastHeader,
        isClosing,
        isMobileCollapsible,
        isSurfaceMounted,
        revealDirection,
        revealOnScrollDown,
        revealScrollThresholdPx,
        scrollDirection,
        scrollY,
    ]);

    useEffect(() => {
        if (
            !isMobileCollapsible ||
            !isSurfaceMounted ||
            isClosing ||
            scrollDirection !== dismissDirection
        ) {
            return;
        }

        clearTimer(enterTimerRef);
        clearTimer(closeTimerRef);
        setIsOpening(false);
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setIsClosing(false);
            surfaceMountCommittedRef.current = false;
            setIsSurfaceMounted(false);
        }, dismissMs);
    }, [dismissDirection, dismissMs, isClosing, isMobileCollapsible, isSurfaceMounted, scrollDirection]);

    useEffect(() => {
        if (!isMobileCollapsible || !isClosing || scrollDirection === dismissDirection) {
            return;
        }

        clearTimer(closeTimerRef);
        setIsClosing(false);
    }, [dismissDirection, isClosing, isMobileCollapsible, scrollDirection]);

    useEffect(() => {
        if (!isMobileCollapsible || !isSurfaceMounted || isClosing || scrollY > 0) {
            return;
        }

        clearTimer(enterTimerRef);
        surfaceMountCommittedRef.current = false;
        setIsSurfaceMounted(false);
        setIsOpening(false);
    }, [isClosing, isMobileCollapsible, isSurfaceMounted, scrollY]);

    if (header.header === false) {
        return null;
    }

    const shouldRenderSurface = isMobileCollapsible && (isSurfaceMounted || isClosing);
    const flowHeaderEnteringViewport =
        isMobileCollapsible && isSurfaceMounted && headerHeight > 0 && scrollY < headerHeight;
    /** Inline opacity must match interactive layer: during `isOpening` both start at 0 (otherwise bg shows full-strength first). */
    const surfaceOpacity = isClosing
        ? 0
        : isOpening
          ? 0
          : flowHeaderEnteringViewport
            ? Math.max(0, Math.min(1, scrollY / headerHeight))
            : 1;

    const containerBase = stripContainerForInFlow(s('container'));
    const contentClass = s('content') || '';
    const initialSurfaceClass = s('initial_surface') || '';

    const scrollContentClassForScroll =
        useFixedInteractiveChrome && !isOpening && !isClosing
            ? scrollDirection === 0
                ? floatingContentInitial
                : scrollDirection === revealDirection
                  ? contentWhenVisible
                  : contentWhenHidden
            : '';

    const blockContentPointerEvents =
        useFixedInteractiveChrome &&
        !isOpening &&
        scrollDirection !== 0 &&
        scrollDirection === dismissDirection;

    if (!isMobileCollapsible) {
        return (
            <>
                <View aria-hidden="true" style={{ height: headerHeight }} />
                <View className={`${containerBase} ${fixedLayer}`} onLayout={onHeaderLayout}>
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
        : `web:transition-[transform,opacity] ${enterTransition}`;

    // Row layout (`content`) lives only on PageHeaderBody's inner Row — do not repeat on this wrapper (double h-/px- and iOS layout quirks).
    const inFlowInteractiveClassName = `${containerBase} web:relative web:top-auto web:translate-y-0 ${initialSurfaceClass}`;
    const fixedInteractiveMotion = isOpening
        ? `${enterTranslate} opacity-0 web:transition-[transform,opacity] ${enterTransition}`
        : isClosing
          ? `${dismissTranslate || 'web:translate-y-0'} opacity-0 web:transition-[transform,opacity] ${dismissTransition}`
          : `web:translate-y-0 ${contentTransition} ${scrollContentClassForScroll}`;
    const fixedInteractiveClassName = `${containerBase} ${fixedLayer} ${fixedInteractiveMotion}`;

    const floatingSurfaceStyle = {
        opacity: surfaceOpacity,
        ...(headerHeight > 0 ? { height: headerHeight } : { minHeight: 56 }),
    };

    return (
        <>
            {useFixedInteractiveChrome && (
                <View aria-hidden="true" style={{ height: headerHeight }} />
            )}

            {shouldRenderSurface && (
                <View
                    className={`${containerBase} ${fixedLayer} ${surfaceTranslateClass} ${surfaceTransitionClass} ${floatingSurface}`}
                    style={floatingSurfaceStyle}
                    pointerEvents="none"
                    aria-hidden="true"
                />
            )}

            <View
                key={useFixedInteractiveChrome ? 'header-fixed' : 'header-in-flow'}
                className={useFixedInteractiveChrome ? fixedInteractiveClassName : inFlowInteractiveClassName}
                onLayout={onHeaderLayout}
                pointerEvents={
                    useFixedInteractiveChrome &&
                    (isOpening || isClosing || blockContentPointerEvents)
                        ? 'none'
                        : 'auto'
                }
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
