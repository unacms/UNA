import { memo, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { FeedbackHaptics, appSetting, getMenuSettings } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import Link from 'app/ui/atoms/link';
import { usePathname, useRouter } from 'app/lib/hooks/router';
import { useIsDesktop } from 'app/context/measure';
import { Button } from 'app/design/controls';
import { getComponent } from 'app/components/registry';
import { canGoBackInTab, navigateBackInTab } from 'app/lib/tab-history';
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
            <Link href="/home" size="lg" aria-label="Home">
                {appStatic('logo')}
            </Link>
            <HeaderElement mode="small" url={pageData?.url} uri={pageData?.uri} />
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
    const isContextSelector = !!pageData?.context;
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
        if (height !== headerHeight) {
            setHeaderHeightAtom(height);
        }
    }, [headerHeight, setHeaderHeightAtom]);

    useEffect(() => {
        if (!isWeb || isDesktop) return;

        const nextHeaderHeight = isDesktop ? 64 : 56;
        if (headerHeight !== nextHeaderHeight) {
            setHeaderHeightAtom(nextHeaderHeight);
        }
    }, [headerHeight, isDesktop, isWeb, setHeaderHeightAtom]);

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
    pageData,
    pageTitle,
    router,
}) => {
    const ContextSelector = getComponent('molecule', 'context_selector');
    const HeaderElement = getComponent('molecule', 'header_element');
    const pathname = usePathname();
    const currentTab = '/' + (pathname?.split('/')[1] || 'tab0');
    const canShowBackButton = isWeb
        ? (isBackButton &&
            (typeof isBackButton === 'function' || (typeof history !== 'undefined' && history.length > 2)))
        : ((typeof isBackButton === 'function' || canGoBackInTab(currentTab))) && appSetting('native', 'backbutton_in_header');
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
            <Button
                variant="text"
                rounded
                onPress={onBackPress}
                startDecorator="ArrowLeft"
                size="base"
            />
        </View>
    );

    const Logo = (
        <Link href="/home" aria-label="Home" size="md" className="items-center">
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
                <Row className={contentClassName}>
                    <BackButtonElement className="items-center mr-2" />
                    <View className="flex-1">{header.header}</View>
                </Row>
            );
        }
        return header.header;
    }

    return (
        <>
            <Row className={contentClassName}>
                <Row className={appSetting('layout', 'header', 'content_left')}>
                    {canShowBackButton && (
                        <BackButtonElement />
                    )}
                    <View>{leftElement}</View>
                    {contextSelectorElement}
                </Row>
                {isWeb && <MenuTop url={pageData?.url} uri={pageData?.uri} />}
                <Row className={appSetting('layout', 'header', 'content_right')}>
                    {header.headerActions ?? <HeaderElement mode="small" url={pageData?.url} uri={pageData?.uri} />}
                </Row>
            </Row>
            {header.subHeader}
        </>
    );
});