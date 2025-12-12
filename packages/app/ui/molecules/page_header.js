import { View, Row, Pressable } from 'app/design/view';
import { useMemo, useEffect, useState, memo, isValidElement, useRef } from 'react';
import { Text } from 'app/design/typography'
import { Platform, Animated } from 'react-native'
import { FeedbackHaptics, getPageSettings } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import { appSetting, getMenuSettings } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'
import { useTranslation } from 'react-i18next';
import { useIsDesktop } from 'app/context/measure';
import { Button } from 'app/design/controls'
import { getComponent } from 'app/components/registry';
import {
    CoverMenu,
} from 'app/components/nav/menu-cover'
import { useSetHeaderHeight, useScrollDirection, useHeader, useHeaderHeight } from 'app/context/jotai/layout';
import MenuTop from 'app/components/nav/menu-top'

export const TextHeader = memo(({ text }) => {
    return <Text className="font-bold truncate leading-12 lg:px-2 text-card-foreground text-2xl tracking-tight">
        {text}
    </Text>
})

export const PageHeader = ({
    layoutName,
    pageLayoutName,
    pageData,
}
) => {
    const { currentUser } = useCurrentUser();
    const router = useRouter();
    const header = useHeader();
    const scrollDirection = useScrollDirection();
    const setHeaderHeightAtom = useSetHeaderHeight();
    const headerHeight =useHeaderHeight();

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

    
    /* set Page title */
    let pageTitle = pageData?.name;
    
    if (menuSettings.name) {
        pageTitle = menuSettings.name;
    }
    if (header.title) {
        pageTitle = header.title
    }
    pageTitle = pageTitle.replace('__notification__', '');
    /* set Page title */

    /* animations for hide header */
    const headerTranslateY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!isWeb && isCollapsibleHeader && headerHeight > 0) {
            Animated.timing(headerTranslateY, {
                toValue: scrollDirection === 1 ? -headerHeight : 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [scrollDirection, isCollapsibleHeader, headerHeight, isWeb, headerTranslateY]);
    const cssClass = isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full' : 'web:translate-y-0';

    const HeaderContainer = !isWeb && isCollapsibleHeader ? Animated.View : View;
    const nativeStyle = !isWeb && isCollapsibleHeader ? {
        transform: [{ translateY: headerTranslateY }],
        pointerEvents: scrollDirection === 1 ? 'none' : 'auto'
    } : {};
    /* animations for hide header */

    /* left element, can be logo, context selecor or title */
    const leftElement = isFullContextSelector ? <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} /> :( isShowLogo ? (
        <Link href="/home" size="lg" aria-label="Home">
            <Pressable className="items-center">
                {appStatic('logo')}
            </Pressable>
        </Link>
    ) : (
        <TextHeader text={pageTitle} />
    ));
    /* left element, can be logo, context selecor or title */

    const contextSelectorElement = isContextSelector && !isFullContextSelector ? <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} mode="min" />: null;

    return (
        <>
            {isWeb && <View style={{ height: headerHeight }} />}
            <HeaderContainer
                className={`w-full z-50 bg-card backdrop-blur-xl border-b border-border/60 web:fixed native:absolute web:top-0 web:transition-transform web:duration-300 web:ease-in-out ${cssClass}`}
                style={nativeStyle}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    if (height !== headerHeight) {
                        setHeaderHeightAtom(height);
                    }
                }}
            >
                {header.header ? header.header : (<>
                    <Row className="items-center justify-between web:h-16 px-3">
                        <Row className="items-center justify-start flex-1 lg:flex-none overflow-hidden gap-x-2">
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
                        <Row className=" items-end">
                            <HeaderElement mode="small" url={pageData?.url} uri={pageData?.uri} />
                            {(pageData?.context && pageData?.cover_block?.actions_menu) && <CoverMenu
                                {...pageData.cover_block.actions_menu}
                                uri={pageData.uri}
                                isSplitMenu={false}
                            />}
                        </Row>
                    </Row>
                    {header.subHeader}
                </>)}
            </HeaderContainer>
        </>
    );
};
