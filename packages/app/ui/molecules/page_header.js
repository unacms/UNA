import { View, Row } from 'app/design/view';
import { useEffect, useLayoutEffect, useState, memo, useRef } from 'react';
import { Text } from 'app/design/typography'
import { Platform, Animated } from 'react-native'
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { appSetting, getMenuSettings } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'
import { useIsDesktop } from 'app/context/measure';
import { Button } from 'app/design/controls'
import { getComponent } from 'app/components/registry';
import { useSetHeaderHeight, useScrollDirection, useHeader, useHeaderHeight, useSetScrollDirection, useSetHeader, useScrollValue, useSetScrollValue, defaultHeader } from 'app/context/jotai/layout';
import MenuTop from 'app/components/nav/menu-top'

/** Mobile web pinned bar: fade duration before unmounting fixed solid header on scroll-down */
const FIXED_BAR_FADE_MS = 200;

export const TextHeader = memo(({ text }) => {
    return <Text className="font-bold truncate leading-12 lg:px-2 text-card-foreground text-2xl tracking-tight">
        {text}
    </Text>
})

export const PageHeaderSmall = ({ pageData }) => {
    const HeaderElement = getComponent('molecule', 'header_element');
    return <Row className="w-full justify-between">
        <Link href="/home" size="lg" aria-label="Home">
            {appStatic('logo')}
        </Link>
        <HeaderElement mode="small" url={pageData?.url} uri={pageData?.uri} />
    </Row>
}

export const PageHeader = ({
    layoutName,
    pageLayoutName,
    pageData,
}
) => {
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const header = useHeader();
    const setHeader = useSetHeader();
    const scrollDirection = useScrollDirection();
    const setScrollDirection = useSetScrollDirection();
    const setHeaderHeightAtom = useSetHeaderHeight();
    const headerHeight = useHeaderHeight();
    const scrollY = useScrollValue();
    const setScrollValue = useSetScrollValue();

    const isWeb = Platform.OS === 'web'
    const isDesktop = useIsDesktop();
    const isHome = pageData?.uri === 'home';

    const isCollapsibleHeader = appSetting('native', 'collapsible_header') && !isDesktop;
    const isContextSelector = !!pageData?.context;
    const isFullContextSelector = appSetting('context_selector', 'show_always')
    const isShowLogo = isDesktop || (!isWeb && !currentUser) || isHome;
    const isBackButton = header.backButton;

    const ContextSelector = getComponent('molecule', 'context_selector')
    const HeaderElement = getComponent('molecule', 'header_element');
    const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config, pageData?.menu);

    /** Mobile web: `PageHeader` mounts before `Page` (where `useScroll` runs). Sync scroll offset for pinned/in-flow logic. */
    const flowMobileHeader = isWeb && isCollapsibleHeader;

    const [fixedBarOpen, setFixedBarOpen] = useState(false);
    const [fadeOutActive, setFadeOutActive] = useState(false);
    const dismissingFixedBarRef = useRef(false);

    useEffect(() => {
        setScrollDirection(0);
        setFixedBarOpen(false);
        setFadeOutActive(false);
        dismissingFixedBarRef.current = false;
        if (isWeb)
            setHeader(defaultHeader);
    }, [pageData?.url, pageData?.uri, setScrollDirection, isDesktop]);
    useLayoutEffect(() => {
        if (typeof window === 'undefined' || !flowMobileHeader) return;
        setScrollValue(window.scrollY ?? 0);
    }, [pageData?.url, flowMobileHeader, setScrollValue]);


    /* set Page title */
    let pageTitle = pageData?.name;

    if (menuSettings.name) {
        pageTitle = menuSettings.name;
    }
    if (header.title) {
        pageTitle = header.title
    }
    pageTitle = (pageTitle || '').replace('__notification__', '');
    /* set Page title */

    /* animations for hide header */
    const headerTranslateY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!isWeb && isCollapsibleHeader && headerHeight > 0) {
            Animated.timing(headerTranslateY, {
                toValue: scrollDirection === 1 ? -2*headerHeight : 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [scrollDirection, isCollapsibleHeader, headerHeight, isWeb, headerTranslateY]);

    const pinned =
        flowMobileHeader && headerHeight > 0 && scrollY >= headerHeight;

    /** Open solid fixed bar only after an explicit scroll-up; not when first crossing pin while scrolling down. */
    useEffect(() => {
        if (!flowMobileHeader || !pinned) {
            setFixedBarOpen(false);
            setFadeOutActive(false);
            dismissingFixedBarRef.current = false;
            return;
        }
        if (scrollDirection === -1) {
            setFixedBarOpen(true);
            setFadeOutActive(false);
            dismissingFixedBarRef.current = false;
        }
    }, [scrollDirection, pinned, flowMobileHeader]);

    /** Scroll down while fixed bar is open: fade out first, then dismiss (avoids clipped slide into safe area). */
    useEffect(() => {
        if (!flowMobileHeader || !pinned || !fixedBarOpen) return;
        if (scrollDirection !== 1) return;
        if (dismissingFixedBarRef.current) return;

        dismissingFixedBarRef.current = true;
        setFadeOutActive(true);
        const t = setTimeout(() => {
            setFixedBarOpen(false);
            setFadeOutActive(false);
            dismissingFixedBarRef.current = false;
        }, FIXED_BAR_FADE_MS);
        return () => clearTimeout(t);
    }, [scrollDirection, pinned, fixedBarOpen, flowMobileHeader]);

    /** If dismiss was interrupted (e.g. direction → 0), cancel fade so the bar is not stuck at opacity 0. */
    useEffect(() => {
        if (!flowMobileHeader || !pinned) return;
        if (scrollDirection === 1 || scrollDirection === -1) return;
        if (!fadeOutActive) return;
        setFadeOutActive(false);
        dismissingFixedBarRef.current = false;
    }, [scrollDirection, pinned, flowMobileHeader, fadeOutActive]);

    const showFixedSolid = pinned && fixedBarOpen && !fadeOutActive;

    const legacyWebTransform = !flowMobileHeader
        ? (isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full ' : 'web:translate-y-0 ')
        : '';

    let flowContainerExtra = '';
    if (flowMobileHeader) {
        if (!pinned) {
            flowContainerExtra =
                ' web:relative web:top-auto web:translate-y-0 web:opacity-100 web:transition-[transform,opacity,background-color,border-color] web:duration-300 ';
        } else if (showFixedSolid) {
            flowContainerExtra =
                ' web:fixed web:top-0 web:left-0 web:right-0 web:z-50 web:translate-y-0 web:opacity-100 web:transition-[transform,opacity,background-color,border-color] web:duration-300 ';
        } else if (pinned && fixedBarOpen && fadeOutActive) {
            flowContainerExtra =
                ' web:fixed web:top-0 web:left-0 web:right-0 web:z-50 web:translate-y-0 web:opacity-0 web:transition-opacity web:duration-200 web:ease-out ';
        } else {
            /* pinned && !fixedBarOpen: off-screen, no solid chrome — avoids flash when crossing pin threshold on scroll-down */
            flowContainerExtra =
                ' web:fixed web:top-0 web:left-0 web:right-0 web:z-50 web:-translate-y-full web:opacity-0 web:pointer-events-none web:transition-none ';
        }
    }

    const headerContainerClassName = `${appSetting('layout', 'header', 'container')} ${flowMobileHeader ? flowContainerExtra : legacyWebTransform}`;

    const contentBase = appSetting('layout', 'header', 'content');
    const contentFlowStyle =
        flowMobileHeader && !pinned
            ? ' max-lg:bg-transparent max-lg:border-transparent max-lg:shadow-none max-lg:backdrop-blur-none '
            : '';
    const contentPinnedSolidStyle =
        flowMobileHeader && pinned && (showFixedSolid || fadeOutActive)
            ? ' max-lg:bg-card max-lg:border-b max-lg:border-border/60 max-lg:backdrop-blur-xl max-lg:shadow-sm '
            : '';
    const contentPinnedHiddenStyle =
        flowMobileHeader && pinned && !showFixedSolid && !fadeOutActive
            ? ' max-lg:bg-transparent max-lg:border-transparent max-lg:shadow-none max-lg:backdrop-blur-none '
            : '';
    const headerContentClassName = `${contentBase}${contentFlowStyle}${contentPinnedSolidStyle}${contentPinnedHiddenStyle}`;

    const HeaderContainer = !isWeb && isCollapsibleHeader ? Animated.View : View;
    const nativeStyle = !isWeb && isCollapsibleHeader ? {
        transform: [{ translateY: headerTranslateY }],
        pointerEvents: scrollDirection === 1 ? 'none' : 'auto'
    } : {};
    /* animations for hide header */

    const Logo = <Link href='/home' aria-label="Home" variant='ghost' size='lg' className='items-center'>
        {appStatic('logo')}
    </Link>
    /* left element, can be logo, context selecor or title */
    const leftElement = !currentUser ? Logo : (isFullContextSelector ? <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} /> : (isShowLogo ? Logo : (
        <TextHeader text={pageTitle} />
    )));
    /* left element, can be logo, context selecor or title */

    const contextSelectorElement = isContextSelector && !isFullContextSelector ? <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} mode="min" /> : null;

    if (header.header === false) {
        setHeaderHeightAtom(0);
        return null
    }
    const showWebHeaderSpacer = isWeb && (flowMobileHeader ? pinned : true);

    return (
        <>
            {showWebHeaderSpacer && <View style={{ height: headerHeight }} />}
            <HeaderContainer
                className={headerContainerClassName}
                style={nativeStyle}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    if (height !== headerHeight) {
                        setHeaderHeightAtom(height);
                    }
                }}
            >
                {header.header ? header.header : (<>
                    <Row className={headerContentClassName}>
                        <Row className={appSetting('layout', 'header', 'content_left')}>
                                {(isBackButton && (!isWeb || history.length > 2)) && (
                                    <View className="items-center">
                                        <Button
                                            variant="text"
                                            rounded
                                            onPress={() => {
                                                FeedbackHaptics('Medium');
                                                router ? router?.back() : history.back();
                                            }}
                                            startDecorator="ArrowLeft"
                                            size="base" />
                                    </View>
                                )}
                                {leftElement}
                                {contextSelectorElement}

                        </Row>
                        {isWeb && <MenuTop url={pageData.url} uri={pageData.uri} />}
                        <Row className={appSetting('layout', 'header', 'content_right')}>
                            <HeaderElement mode="small" url={pageData?.url} uri={pageData?.uri} />
                            {/*(pageData?.context && pageData?.cover_block?.actions_menu) && <CoverMenu
                                {...pageData.cover_block.actions_menu}
                                uri={pageData.uri}
                                isSplitMenu={false}
                            />*/}
                        </Row>
                    </Row>
                    {header.subHeader}
                </>)}
            </HeaderContainer>
        </>
    );
};
