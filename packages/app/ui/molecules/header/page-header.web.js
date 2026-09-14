import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'app/design/view';
import {
    useScrollValue,
    useSetScrollValue,
} from 'app/context/jotai/layout';
import {
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
            <View
                className={flowHeaderContainerClassName}
                role={usesFixedOverlayHeader && shouldRenderFixedLayer ? undefined : 'banner'}
                aria-hidden={usesFixedOverlayHeader && shouldRenderFixedLayer ? 'true' : undefined}
                style={flowHeaderStyle}
                onLayout={onHeaderLayout}
            >
                <HeaderFade headerHeight={headerHeight} isScrolled={isScrolled} />
                <View className="relative z-10">
                    <PageHeaderBody
                        {...headerState}
                        contentClassName={flowHeaderContentClassName}
                        pageData={pageData}
                    />
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
                        <PageHeaderBody
                            {...headerState}
                            contentClassName={fixedOverlayContentClassName}
                            pageData={pageData}
                        />
                    </View>
                </View>
            )}
        </>
    );
};
