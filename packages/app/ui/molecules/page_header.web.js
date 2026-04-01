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

/** Matches `web:duration-300` (must be a static class for Tailwind JIT). Dismiss unmount waits for transition end. */
const FIXED_BAR_MOTION_MS = 300;
const FIXED_BAR_DISMISS_MS = FIXED_BAR_MOTION_MS + 80;
/** Flow row (in-flow placeholder) transition when not using overlay. */
const FIXED_BAR_TRANSITION_CLASS = 'web:duration-300 web:ease-in-out ';

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
    const headerContainerBaseClass = appSetting('layout', 'header', 'container')
        .replace('header-fixed', '')
        .replace('web:fixed', '')
        .replace('web:top-0', '')
        .replace('web:transition-transform', '')
        .replace('web:duration-300', '')
        .replace('web:ease-in-out', '');
    const fixedHeaderClass =
        ' header-fixed web:fixed web:top-0 web:left-0 web:right-0 web:z-50 -mt-[env(safe-area-inset-top)] pt-[env(safe-area-inset-top)] ';
    const flowTransitionClass =
        ` web:transition-[transform,opacity,background-color,border-color] ${FIXED_BAR_TRANSITION_CLASS} `;
    const flowHeaderContainerClassName = usesFixedOverlayHeader
        ? `${headerContainerBaseClass} web:relative web:top-auto web:translate-y-0 ${flowTransitionClass}`
        : `${headerContainerBaseClass} ${fixedHeaderClass} ${isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full' : 'web:translate-y-0'} ${flowTransitionClass}`;
    const fixedHeaderMotionClass =
        isClosing || isEntering
            ? 'web:-translate-y-full web:opacity-0'
            : 'web:translate-y-0 web:opacity-100';
    const fixedHeaderMotionTransition =
        'web:transition-[transform,opacity] web:duration-300 web:ease-in-out';
    const fixedHeaderContainerClassName = `${headerContainerBaseClass} ${fixedHeaderClass} ${fixedHeaderMotionClass} ${fixedHeaderMotionTransition}`;
    const flowHeaderContentClassName = usesFixedOverlayHeader
        ? `${appSetting('layout', 'header', 'content')} `
        : appSetting('layout', 'header', 'content');
    const fixedHeaderContentClassName = appSetting('layout', 'header', 'content_pinned_fixed')
        || ' bg-card border-b border-border/60 backdrop-blur-xl shadow-sm ';
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
                aria-hidden={usesFixedOverlayHeader && shouldRenderFixedLayer ? 'true' : undefined}
                style={flowHeaderStyle}
                onLayout={onHeaderLayout}
            >
                <PageHeaderBody
                    {...headerState}
                    contentClassName={flowHeaderContentClassName}
                    pageData={pageData}
                />
            </View>
            {usesFixedOverlayHeader && shouldRenderFixedLayer && (
                <View
                    className={fixedHeaderContainerClassName}
                    pointerEvents={headerPointerEvents}
                >
                    <PageHeaderBody
                        {...headerState}
                        contentClassName={`${appSetting('layout', 'header', 'content')} ${fixedHeaderContentClassName}`}
                        pageData={pageData}
                    />
                </View>
            )}
        </>
    );
};
