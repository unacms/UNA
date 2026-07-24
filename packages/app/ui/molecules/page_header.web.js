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
} from 'app/ui/molecules/page_header_parts';

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

const DEFAULT_CONTENT_PINNED_FIXED =
    ' bg-card backdrop-blur-xl shadow-sm ';

/**
 * Resolves flow + fixed-overlay content classNames.
 * When `layout.header.content_scrolled` is unset/blank, output matches the legacy paths exactly.
 */
function resolveHeaderContentClassNames({ usesFixedOverlayHeader, isScrolled }) {
    const content = ` ${appSetting('layout', 'header', 'content')}`;
    const contentScrolledRaw = appSetting('layout', 'header', 'content_scrolled');
    const contentScrolled =
        typeof contentScrolledRaw === 'string' ? contentScrolledRaw.trim() : '';
    const usesScrollContentStyles = contentScrolled.length > 0;

    if (!usesScrollContentStyles) {
        const flowHeaderContentClassName = usesFixedOverlayHeader
            ? `${content} `
            : content;
        const fixedHeaderContentClassName =
            appSetting('layout', 'header', 'content_pinned_fixed') ||
            DEFAULT_CONTENT_PINNED_FIXED;
        const fixedOverlayContentClassName = `${content} ${fixedHeaderContentClassName}`;
        return { flowHeaderContentClassName, fixedOverlayContentClassName };
    }

    const scrolledSuffix = isScrolled ? ` ${contentScrolled}` : '';
    const flowHeaderContentClassName = usesFixedOverlayHeader
        ? `${content}${scrolledSuffix} `
        : `${content}${scrolledSuffix}`;

    const pinnedRaw = appSetting('layout', 'header', 'content_pinned_fixed');
    const pinnedExtra = typeof pinnedRaw === 'string' ? pinnedRaw.trim() : '';
    const pinnedSuffix = isScrolled && pinnedExtra.length > 0 ? ` ${pinnedExtra}` : '';
    const fixedOverlayContentClassName = `${content}${scrolledSuffix}${pinnedSuffix}`;

    return { flowHeaderContentClassName, fixedOverlayContentClassName };
}

/** Optional `layout.header.container_scrolled` suffix; blank/undefined leaves container classes unchanged. */
function getContainerScrolledSuffix(isScrolled) {
    if (!isScrolled) {
        return '';
    }
    const containerScrolledRaw = appSetting('layout', 'header', 'container_scrolled');
    const containerScrolled =
        typeof containerScrolledRaw === 'string' ? containerScrolledRaw.trim() : '';
    return containerScrolled.length > 0 ? ` ${containerScrolled}` : '';
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
    const headerContainerBaseClass =
        appSetting('layout', 'header', 'container') + getContainerScrolledSuffix(isScrolled);
    const fixedHeaderClass =
        ' ns--header-wrapper-fixed-- header-fixed web:fixed web:top-0 web:left-0 web:right-0 web:z-50 ne--';
    const flowTransitionClass =
        ` ns--header-wrapper--transition-- web:transition-[transform,opacity,background-color,border-color] web:duration-300 web:ease-in-out ne-- `;
    const flowHeaderContainerClassName = usesFixedOverlayHeader
        ? `${headerContainerBaseClass} web:relative web:top-auto web:translate-y-0 ${flowTransitionClass}`
        : `${headerContainerBaseClass} ${fixedHeaderClass} ${isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full' : ' ns--header-position-start-- web:translate-y-0 ne--' } ${flowTransitionClass}`;
    const fixedHeaderMotionClass =
        isClosing || isEntering
            ? 'web:-translate-y-full web:opacity-0'
            : 'web:translate-y-0 web:opacity-100';
    const fixedHeaderMotionTransition =
        'web:transition-[transform,opacity] web:duration-300 web:ease-in-out';
    const fixedHeaderContainerClassName = `${headerContainerBaseClass} ${fixedHeaderClass} ${fixedHeaderMotionClass} ${fixedHeaderMotionTransition}`;
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
                        contentClassName={fixedOverlayContentClassName}
                        pageData={pageData}
                    />
                </View>
            )}
        </>
    );
};
