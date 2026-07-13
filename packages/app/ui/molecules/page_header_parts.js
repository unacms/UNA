import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { FeedbackHaptics, appSetting, getMenuSettings } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { usePathname, useRouter } from 'app/lib/hooks/router';
import { getComponent } from 'app/components/registry';
import { useIsDesktop } from 'app/context/measure';
import { NeoButton } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import { canGoBackInTab, getTabKeyFromPathname, navigateBackInTab } from 'app/lib/tab-history';
import {
    defaultHeader,
    useHeader,
    useHeaderHeight,
    useScrollDirection,
    useSetHeader,
    useSetHeaderHeight,
    useSetScrollDirection,
} from 'app/context/jotai/layout';
import MenuTop from 'app/components/nav/menu-top';

export const TextHeader = memo(({ text }) => {
    return (
        <Text className="font-bold truncate leading-12 text-card-foreground text-2xl tracking-tight">
            {text}
        </Text>
    );
});

export const PageHeaderSmall = ({ pageData }) => {
    const HeaderElement = getComponent('molecule', 'header_element');
    return (
        <Row className="w-full justify-between gap-2">
            <Link href="/home" alt="Home" className="items-center">
                {appStatic('logo')}
            </Link>
            <HeaderElement url={pageData?.url} uri={pageData?.uri} />
        </Row>
    );
};

export function usePageHeaderBase(pageData, { resetHeaderOnRoute = false } = {}) {
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const header = useHeader();
    const setHeader = useSetHeader();
    const scrollDirection = useScrollDirection();
    const setScrollDirection = useSetScrollDirection();
    const setHeaderHeightAtom = useSetHeaderHeight();
    const headerHeight = useHeaderHeight();

    const isWeb = Platform.OS === 'web';
    const isDesktop = useIsDesktop();
    const isHome = pageData?.uri === 'home';
    const isCollapsibleHeader =
        appSetting('native', 'collapsible_header') && !isDesktop;
    const isContextSelector = !!pageData?.context && (appSetting('context_selector', 'show_always') || pageData?.context?.current?.id);
    const isFullContextSelector = appSetting('context_selector', 'show_always');
    const isShowLogo = isDesktop || (!isWeb && !currentUser) || isHome;
    const isBackButton = header.backButton;

    const menuSettings = getMenuSettings(
        pageData?.menu?.object,
        pageData?.menu?.config,
        pageData?.menu
    );

    useEffect(() => {
        setScrollDirection(0);
        if (resetHeaderOnRoute && isWeb) {
            setHeader(defaultHeader);
        }
    }, [
        isDesktop,
        isWeb,
        pageData?.uri,
        pageData?.url,
        resetHeaderOnRoute,
        setHeader,
        setScrollDirection,
    ]);

    const pageTitle = useMemo(() => {
        let nextTitle = pageData?.name;

        if (menuSettings.name) {
            nextTitle = menuSettings.name;
        }
        if (header.title) {
            nextTitle = header.title;
        }

        return (nextTitle || '').replace('__notification__', '');
    }, [header.title, menuSettings.name, pageData?.name]);

    const onHeaderLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        setHeaderHeightAtom((prev) => (prev === height ? prev : height));
    }, [setHeaderHeightAtom]);

    const mainHeaderHeightRef = useRef(0);
    const subHeaderHeightRef = useRef(0);

    const syncHeaderHeight = useCallback(() => {
        if (header.header === false) {
            setHeaderHeightAtom(0);
            return;
        }
        const total = mainHeaderHeightRef.current + (header.subHeader ? subHeaderHeightRef.current : 0);
        setHeaderHeightAtom((prev) => (prev === total ? prev : total));
    }, [header.header, header.subHeader, setHeaderHeightAtom]);

    const onMainHeaderLayout = useCallback((event) => {
        mainHeaderHeightRef.current = event.nativeEvent.layout.height;
        syncHeaderHeight();
    }, [syncHeaderHeight]);

    const onSubHeaderLayout = useCallback((event) => {
        subHeaderHeightRef.current = event.nativeEvent.layout.height;
        syncHeaderHeight();
    }, [syncHeaderHeight]);

    useEffect(() => {
        if (header.header === false) {
            setHeaderHeightAtom(0);
            return;
        }
        if (!header.subHeader) {
            subHeaderHeightRef.current = 0;
        }
        syncHeaderHeight();
    }, [header.header, header.subHeader, setHeaderHeightAtom, syncHeaderHeight]);

    return {
        currentUser,
        header,
        headerHeight,
        isBackButton,
        isCollapsibleHeader,
        isContextSelector,
        isFullContextSelector,
        isShowLogo,
        isWeb,
        onHeaderLayout,
        onMainHeaderLayout,
        onSubHeaderLayout,
        pageTitle,
        router,
        scrollDirection,
    };
}

export const PageHeaderBody = memo(({
    contentClassName,
    currentUser,
    header,
    isBackButton,
    isContextSelector,
    isFullContextSelector,
    isShowLogo,
    isWeb,
    onMainHeaderLayout,
    onSubHeaderLayout,
    pageData,
    pageTitle,
    router,
}) => {
    const ContextSelector = getComponent('molecule', 'context_selector');
    const HeaderElement = getComponent('molecule', 'header_element');
    const pathname = usePathname();
    const isDesktop = useIsDesktop();
    const currentTab = getTabKeyFromPathname(pathname);
    const canShowBackButton = isWeb
        ? (isBackButton &&
            (typeof isBackButton === 'function' || (typeof history !== 'undefined' && history.length > 2)))
        : ((typeof isBackButton === 'function' || canGoBackInTab(currentTab))) && (appSetting('native', 'backbutton_in_header') ||  appSetting('native', 'backbutton_in_header_path')?.includes(pageData.uri));
    const onBackPress = () => {
        FeedbackHaptics('Medium');
        if (typeof isBackButton === 'function') {
            isBackButton();
        } else {
            if (!isWeb && router) {
                navigateBackInTab(router, currentTab, currentUser);
            } else {
                router ? router.back() : history.back();
            }
        }
    };
    const BackButtonElement = ({ className = 'items-center' }) => (
        <View className={className}>
            <NeoButton
                image="ArrowLeft"
                style={isDesktop ? 'bordered' : 'glass'}
                controlSize="regular"
                accessibilityLabel="Back"
                onPress={onBackPress}
            />
        </View>
    );

    const Logo = (
        <Link href="/home" alt="Home">
            {appStatic('logo')}
        </Link>
    );

    const leftElement = (!currentUser || (appSetting('layout', 'lock_unconfirmed') && !currentUser?.confirmed)) ? (
        Logo
    ) : isFullContextSelector ? (
        <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />
    ) : isShowLogo ? (
        Logo
    ) : (
        <TextHeader text={pageTitle} />
    );

    const contextSelectorElement =
        isContextSelector && !isFullContextSelector ? (
            <ContextSelector
                url={pageData?.url}
                uri={pageData?.uri}
                data={pageData?.context}
                mode="min"
            />
        ) : null;

    if (header.header) {
        if (!isWeb && canShowBackButton) {
            return (
                <View onLayout={onMainHeaderLayout}>
                    <Row className={contentClassName}>
                        <BackButtonElement className="items-center mr-2" />
                        <View className="flex-1">{header.header}</View>
                    </Row>
                </View>
            );
        }
        return (
            <View onLayout={onMainHeaderLayout}>
                {header.header}
            </View>
        );
    }

    return (
        <>
            <Row className={' ' + contentClassName} onLayout={onMainHeaderLayout}>
                <View className={' ' + appSetting('layout', 'header', 'content_left')}>
                    <Row className='flex-none '>
                        {canShowBackButton && (
                            <BackButtonElement />
                        )}
                        
                        <View className=" min-w-0 ">{leftElement}</View>
                        {contextSelectorElement}
                    </Row>
                </View>
                {isWeb && <MenuTop url={pageData?.url} uri={pageData?.uri} />}
                <View className={' ' + appSetting('layout', 'header', 'content_right')}>
                
                    {header.headerActions ?? <HeaderElement url={pageData?.url} uri={pageData?.uri} />}
                
                </View>
            </Row>
            {header.subHeader ? (
                <View onLayout={onSubHeaderLayout}>
                    {header.subHeader}
                </View>
            ) : null}
        </>
    );
});