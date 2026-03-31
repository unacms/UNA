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

/** Delay before the fixed mobile-web header fades in on scroll-up. */
const FIXED_BAR_ENTER_DELAY_MS = 500;
/** Tailwind transition utilities for the fixed mobile-web header fade/transform. */
const FIXED_BAR_TRANSITION_CLASS = 'web:duration-300 web:ease-in-out ';
/** Keep this close to the transition duration above so unmount waits for fade-out. */
const FIXED_BAR_FADE_MS = 320;

export { PageHeaderSmall, TextHeader };

function clearTimer(timerRef) {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
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
    const enterTimerRef = useRef(null);
    const closeTimerRef = useRef(null);

    useLayoutEffect(() => {
        const currentScrollY = window.scrollY ?? 0;
        setScrollValue(currentScrollY);
        clearTimer(enterTimerRef);
        clearTimer(closeTimerRef);
        setIsFixedMounted(usesFixedOverlayHeader && currentScrollY <= 0);
        setIsEntering(false);
        setIsClosing(false);
    }, [usesFixedOverlayHeader, pageData?.uri, pageData?.url, setScrollValue]);

    useEffect(() => () => {
        clearTimer(enterTimerRef);
        clearTimer(closeTimerRef);
    }, []);

    useEffect(() => {
        if (!usesFixedOverlayHeader || !pastRevealThreshold || scrollDirection !== -1 || isFixedMounted) {
            return;
        }

        clearTimer(closeTimerRef);
        clearTimer(enterTimerRef);
        setIsFixedMounted(true);
        setIsClosing(false);
        setIsEntering(true);
        enterTimerRef.current = setTimeout(() => {
            enterTimerRef.current = null;
            setIsEntering(false);
        }, FIXED_BAR_ENTER_DELAY_MS);
    }, [isFixedMounted, pastRevealThreshold, scrollDirection, usesFixedOverlayHeader]);

    useEffect(() => {
        if (!usesFixedOverlayHeader || !isFixedMounted || isClosing || scrollDirection !== 1) {
            return;
        }

        clearTimer(enterTimerRef);
        clearTimer(closeTimerRef);
        setIsEntering(false);
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            setIsClosing(false);
            setIsFixedMounted(false);
        }, FIXED_BAR_FADE_MS);
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
    const fixedHeaderOpacity = isClosing ? 0 : (isEntering ? 0 : 1);
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
    const fixedHeaderContainerClassName = `${headerContainerBaseClass} ${fixedHeaderClass} web:translate-y-0 ${flowTransitionClass}`;
    const flowHeaderContentClassName = usesFixedOverlayHeader
        ? `${appSetting('layout', 'header', 'content')} `
        : appSetting('layout', 'header', 'content');
    const fixedHeaderContentClassName = appSetting('layout', 'header', 'content_pinned_fixed')
        || ' bg-card border-b border-border/60 backdrop-blur-xl shadow-sm ';
    const headerContainerStyle = shouldRenderFixedLayer ? { opacity: fixedHeaderOpacity } : undefined;
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
                    style={headerContainerStyle}
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
