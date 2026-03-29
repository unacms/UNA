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

const FIXED_BAR_FADE_MS = 320;
const FIXED_BAR_TOP_MERGE_FADE_RANGE = 32;

export { PageHeaderSmall, TextHeader };

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
    const flowMobileHeader = isCollapsibleHeader;
    const pinned = flowMobileHeader && headerHeight > 0 && scrollY >= headerHeight;

    const [fixedBarOpen, setFixedBarOpen] = useState(false);
    const [fadeOutActive, setFadeOutActive] = useState(false);
    const [fixedBarEnter, setFixedBarEnter] = useState(false);
    const dismissingFixedBarRef = useRef(false);

    useLayoutEffect(() => {
        setScrollValue(window.scrollY ?? 0);
    }, [pageData?.url, setScrollValue]);

    useEffect(() => {
        setFixedBarOpen(false);
        setFadeOutActive(false);
        setFixedBarEnter(false);
        dismissingFixedBarRef.current = false;
    }, [pageData?.uri, pageData?.url]);

    useEffect(() => {
        return () => {
            dismissingFixedBarRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!flowMobileHeader || !pinned || scrollDirection !== -1 || fixedBarOpen) {
            return;
        }

        setFixedBarOpen(true);
        setFadeOutActive(false);
        dismissingFixedBarRef.current = false;
        setFixedBarEnter(true);
    }, [fixedBarOpen, flowMobileHeader, pinned, scrollDirection]);

    useEffect(() => {
        if (!fixedBarEnter) {
            return;
        }

        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setFixedBarEnter(false));
        });

        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) {
                cancelAnimationFrame(raf2);
            }
        };
    }, [fixedBarEnter]);

    useEffect(() => {
        if (!flowMobileHeader) {
            setFixedBarOpen(false);
            setFadeOutActive(false);
            setFixedBarEnter(false);
            dismissingFixedBarRef.current = false;
            return;
        }
        if (scrollY > 0) {
            return;
        }

        setFixedBarOpen(false);
        setFadeOutActive(false);
        setFixedBarEnter(false);
        dismissingFixedBarRef.current = false;
    }, [flowMobileHeader, scrollY]);

    useEffect(() => {
        if (!flowMobileHeader || !fixedBarOpen) {
            return;
        }
        if (scrollDirection !== 1) {
            return;
        }
        if (dismissingFixedBarRef.current) {
            return;
        }

        dismissingFixedBarRef.current = true;
        setFadeOutActive(true);
        const timeoutId = setTimeout(() => {
            setFixedBarOpen(false);
            setFadeOutActive(false);
            dismissingFixedBarRef.current = false;
        }, FIXED_BAR_FADE_MS);

        return () => clearTimeout(timeoutId);
    }, [fixedBarOpen, flowMobileHeader, scrollDirection]);

    useEffect(() => {
        if (!flowMobileHeader || !fadeOutActive) {
            return;
        }
        if (scrollDirection === 1) {
            return;
        }

        setFadeOutActive(false);
        dismissingFixedBarRef.current = false;
    }, [fadeOutActive, flowMobileHeader, scrollDirection]);

    if (header.header === false) {
        return null;
    }

    const showFixedSolid = fixedBarOpen && !fadeOutActive;
    const showFixedLayer = flowMobileHeader && (fixedBarOpen || fadeOutActive);
    const topMergeFadeOpacity =
        showFixedSolid
            ? Math.max(
                0,
                Math.min(
                    1,
                    scrollY / FIXED_BAR_TOP_MERGE_FADE_RANGE
                )
            )
            : 1;
    const headerOpacity = fadeOutActive ? 0 : (fixedBarEnter ? 0 : topMergeFadeOpacity);
    const allowPointerEvents = showFixedSolid && headerOpacity > 0.98;
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
        ' web:transition-[transform,opacity,background-color,border-color] web:duration-300 web:ease-in-out ';
    const flowHeaderContainerClassName = flowMobileHeader
        ? `${headerContainerBaseClass} web:relative web:top-auto web:translate-y-0 ${flowTransitionClass}`
        : `${headerContainerBaseClass} ${fixedHeaderClass} ${isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full' : 'web:translate-y-0'} ${flowTransitionClass}`;
    const fixedHeaderContainerClassName = `${headerContainerBaseClass} ${fixedHeaderClass} web:translate-y-0 ${flowTransitionClass}`;
    const flowHeaderContentClassName = flowMobileHeader
        ? `${appSetting('layout', 'header', 'content')} max-lg:bg-transparent max-lg:border-transparent max-lg:shadow-none max-lg:backdrop-blur-none`
        : appSetting('layout', 'header', 'content');
    const fixedHeaderContentClassName = appSetting('layout', 'header', 'content_pinned_fixed')
        || ' max-lg:bg-card max-lg:border-b max-lg:border-border/60 max-lg:backdrop-blur-xl max-lg:shadow-sm ';
    const fixedHeaderSafeAreaFill =
        appSetting('layout', 'header', 'safe_area_fill') || 'rgb(var(--card))';
    const fixedHeaderSafeAreaBorder =
        appSetting('layout', 'header', 'safe_area_border') || 'rgb(var(--border) / 0.6)';
    const headerContainerStyle = showFixedLayer ? { opacity: headerOpacity } : undefined;
    const headerPointerEvents = flowMobileHeader && showFixedLayer && !allowPointerEvents
        ? 'none'
        : 'auto';
    const showFixedDesktopSpacer = !flowMobileHeader;

    useLayoutEffect(() => {
        const body = document.body;
        const root = document.documentElement;
        if (!body || !root) {
            return;
        }

        body.style.setProperty('--fixed-header-safe-area-bg', fixedHeaderSafeAreaFill);
        body.style.setProperty('--fixed-header-safe-area-border', fixedHeaderSafeAreaBorder);
        root.style.setProperty('--fixed-header-safe-area-bg', fixedHeaderSafeAreaFill);
        root.style.setProperty('--fixed-header-safe-area-border', fixedHeaderSafeAreaBorder);

        if (flowMobileHeader && showFixedLayer) {
            body.dataset.fixedHeaderSafeArea = 'true';
            root.dataset.fixedHeaderSafeArea = 'true';
        } else {
            delete body.dataset.fixedHeaderSafeArea;
            delete root.dataset.fixedHeaderSafeArea;
        }

        return () => {
            delete body.dataset.fixedHeaderSafeArea;
            delete root.dataset.fixedHeaderSafeArea;
        };
    }, [
        fixedHeaderSafeAreaBorder,
        fixedHeaderSafeAreaFill,
        flowMobileHeader,
        showFixedLayer,
    ]);

    return (
        <>
            {showFixedDesktopSpacer && (
                <View aria-hidden="true" style={{ height: headerHeight }} />
            )}
            <View
                className={flowHeaderContainerClassName}
                aria-hidden={flowMobileHeader && showFixedLayer ? 'true' : undefined}
                onLayout={onHeaderLayout}
            >
                <PageHeaderBody
                    {...headerState}
                    contentClassName={flowHeaderContentClassName}
                    mode="flow"
                    pageData={pageData}
                />
            </View>
            {flowMobileHeader && showFixedLayer && (
                <View
                    className={fixedHeaderContainerClassName}
                    style={headerContainerStyle}
                    pointerEvents={headerPointerEvents}
                >
                    <PageHeaderBody
                        {...headerState}
                        contentClassName={`${appSetting('layout', 'header', 'content')} ${fixedHeaderContentClassName}`}
                        mode="fixed"
                        pageData={pageData}
                    />
                </View>
            )}
        </>
    );
};
