import { useEffect, useLayoutEffect, useRef } from 'react';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';
import { Animated, View } from 'react-native';
import { nativeDriver } from 'app/lib/platform/animation';
import { appSetting } from 'app/lib/util';
import { isNativeTabsEnabled } from 'app/lib/util';
import { EdgeBlur, edgeBlurConfig } from 'app/ui/atoms/edge-blur';
import { useIsScrolled } from 'app/context/jotai/layout';
import { getWindowSafeAreaInsets, useIsFocused } from 'app/lib/hooks/router';
import {
    PageHeaderBody,
    PageHeaderSmall,
    TextHeader,
    getHeaderFadeClass,
    getHeaderFadeExtend,
    getHeaderRestingBackgroundClass,
    resolveHeaderContainerClassName,
    resolveHeaderContentClassNames,
    stripHeaderSurfaceClasses,
    usePageHeaderBase,
} from 'app/ui/molecules/header/page-header-parts';

export { PageHeaderSmall, TextHeader };

/** Matches web `duration-300` for the resting fill / fade. */
const HEADER_BG_FADE_MS = 300;

export const PageHeader = ({ pageData }) => {

    const headerState = usePageHeaderBase(pageData);
    const {
        header,
        headerHeight,
        isCollapsibleHeader,
        onHeaderLayout,
        scrollDirection,
    } = headerState;
    const edgeToEdgeTop = isNativeTabsEnabled() ? (getWindowSafeAreaInsets().top || 0) : 0;

    const isScrolled = useIsScrolled();
    const headerTranslateY = useAnimatedValue(0);
    const headerBgOpacity = useAnimatedValue(isScrolled ? 0 : 1);
    const headerFadeOpacity = useAnimatedValue(isScrolled ? 1 : 0);
    const restingBackgroundClass = getHeaderRestingBackgroundClass();
    // iOS: native progressive blur (EdgeBlur) replaces the wash when configured.
    const fadeBlur = edgeBlurConfig('header');
    // Elsewhere (Android): the native wash, solid through the header.
    const nativeWash = fadeBlur ? null : appSetting('layout', 'header', 'fade_native');
    const fadeClass = nativeWash?.className || getHeaderFadeClass();
    const fadeExtend = fadeBlur?.extend ?? nativeWash?.extend ?? getHeaderFadeExtend();
    const fadeHeight = headerHeight > 0 ? headerHeight + fadeExtend : 0;

    // Lists pad by the published height, and onLayout alone can miss a bar
    // swap (messenger: default bar → list bar with the inbox/direct row), which
    // leaves rows under the header for good. Re-read the committed layout after
    // the bar changes and when the tab regains focus.
    const layoutRef = useRef(null);
    const isFocused = useIsFocused();
    const hasBar = header.header !== false;
    useLayoutEffect(() => {
        if (!hasBar || !isFocused) return;
        layoutRef.current?.measure((_x, _y, width, height) => {
            onHeaderLayout({ nativeEvent: { layout: { width, height } } });
        });
    }, [hasBar, header.header, header.subHeader, isFocused, onHeaderLayout]);

    useEffect(() => {
        if (!isCollapsibleHeader || headerHeight <= 0) {
            return;
        }

        Animated.timing(headerTranslateY, {
            toValue: scrollDirection === 1 ? -2 * headerHeight : 0,
            duration: HEADER_BG_FADE_MS,
            useNativeDriver: nativeDriver,
        }).start();
    }, [headerHeight, headerTranslateY, isCollapsibleHeader, scrollDirection]);

    useEffect(() => {
        Animated.timing(headerBgOpacity, {
            toValue: isScrolled ? 0 : 1,
            duration: HEADER_BG_FADE_MS,
            useNativeDriver: nativeDriver,
        }).start();
        Animated.timing(headerFadeOpacity, {
            toValue: isScrolled ? 1 : 0,
            duration: HEADER_BG_FADE_MS,
            useNativeDriver: nativeDriver,
        }).start();
    }, [headerBgOpacity, headerFadeOpacity, isScrolled]);

    if (header.header === false) {
        return null;
    }

    const HeaderContainer = isCollapsibleHeader ? Animated.View : View;
    const headerContainerStyle = [
        isCollapsibleHeader ? { transform: [{ translateY: headerTranslateY }] } : null,
        edgeToEdgeTop > 0 ? { top: 0, left: 0, right: 0 } : null,
    ];
    const { flowHeaderContentClassName } = resolveHeaderContentClassNames({
        usesFixedOverlayHeader: false,
        isScrolled,
    });

    const showFade = (!!fadeClass || !!fadeBlur) && fadeHeight > 0;
    const headerPointerEvents = isCollapsibleHeader && scrollDirection === 1
        ? 'none'
        : (showFade ? 'box-none' : 'auto');

    return (
        <HeaderContainer
            className={stripHeaderSurfaceClasses(resolveHeaderContainerClassName(isScrolled))}
            role="banner"
            style={[
                headerContainerStyle,
                showFade ? { minHeight: fadeHeight, overflow: 'visible' } : null,
            ]}
            pointerEvents={headerPointerEvents}
        >
            {restingBackgroundClass ? (
                <Animated.View
                    pointerEvents="none"
                    className={`absolute inset-0 ${restingBackgroundClass}`}
                    style={{ opacity: headerBgOpacity }}
                />
            ) : null}
            {showFade ? (
                <Animated.View
                    pointerEvents="none"
                    className="absolute left-0 right-0 top-0"
                    style={{ height: fadeHeight, opacity: headerFadeOpacity }}
                >
                    <EdgeBlur edge="top" config={fadeBlur} fallbackClassName={fadeClass} />
                </Animated.View>
            ) : null}
            <View
                ref={layoutRef}
                pointerEvents="auto"
                onLayout={onHeaderLayout}
                style={edgeToEdgeTop > 0 ? { paddingTop: edgeToEdgeTop } : undefined}
            >
                <PageHeaderBody
                    {...headerState}
                    contentClassName={`${appSetting('layout', 'page_content_width_default')} ${flowHeaderContentClassName}`}
                    pageData={pageData}
                />
            </View>
        </HeaderContainer>
    );
};
