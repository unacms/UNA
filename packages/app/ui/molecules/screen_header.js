import { View, Row, Pressable } from 'app/design/view';
import { createElement, useMemo, useEffect, useLayoutEffect, useState, memo, isValidElement, useRef } from 'react';
import { Text } from 'app/design/typography'
import { Platform, Animated } from 'react-native'
import { FeedbackHaptics, getPageSettings } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting, getMenuSettings } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'
import { useLayoutData } from 'app/context/layout';
import { useTranslation } from 'react-i18next';
import { useIsDesktop } from 'app/context/measure';
import { Button } from 'app/design/controls'
import { getComponent } from 'app/components/registry';
import {
    CoverMenu,
} from 'app/components/nav/menu-cover'
import { useAtomValue, useSetAtom } from 'jotai';
import { subheaderAtom, scrollDirectionAtom, headerHeightAtom } from 'app/context/jotai/layout';
import MenuTop from 'app/components/nav/menu-top'

// On web (SSR), useLayoutEffect would warn. On native, useLayoutEffect prevents a visible flicker.
const useIsomorphicLayoutEffect = Platform.OS === 'web' ? useEffect : useLayoutEffect;

export const TextHeader = memo(({ text }) => {
    const { t } = useTranslation();
    return <Text className="font-bold leading-12 lg:px-2 text-card-foreground text-2xl tracking-tight">
        {t(text)}
    </Text>
})

function getRightHeader(items, currentUser) {
    items = menuItemsFilter(items, currentUser);

    // Keep behavior minimal for now: if nothing to render, bail.
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
        <Row className='gap-x-1 items-center'>
            {items?.map((button) => {
                let btn = null;
                if (button.section || button.link == 'search') {
                    // TODO: implement section/search in header actions
                    btn = null;
                } else {
                    btn = (
                        <Button
                            rounded
                            title={button.title}
                            variant='secondary'
                            startDecorator={button.icon}
                            size="base"
                            addon={
                                button.link == appSetting('messenger', 'url')
                                    ? {
                                        variant: 'primary',
                                        text: currentUser?.counters?.bx_messenger_new_messages,
                                        hideZero: true
                                    }
                                    : undefined
                            }
                        />
                    );
                    btn = button.link ? <Link href={button.link}>{btn}</Link> : btn;
                }

                if (!btn) return null;
                return (
                    <View className="" key={`add-${button.icon || button.link || button.title}`}>
                        {btn}
                    </View>
                );
            })}
        </Row>
    );
}

export const ScreenHeader = ({ 
    layoutName, 
    pageLayoutName, 
    pageData, 
    isMenuNameAsTitle = true, 
    headerComponent, 
    backButtonPresented, 
    isNoContainer = false, 
    rightHeaderComponent 
}
) => {
    const isDesktop = useIsDesktop();
    // Start with a reasonable default (h-16) to avoid initial content overlap/jump.
    const [headerHeight, setHeaderHeight] = useState(64);

    const subheader = useAtomValue(subheaderAtom);
    const scrollDirection = useAtomValue(scrollDirectionAtom);
    const setHeaderHeightAtom = useSetAtom(headerHeightAtom);
    const setScrollDirectionAtom = useSetAtom(scrollDirectionAtom);

    // Animated value для уплывания хедера вверх на нативе
    const headerTranslateY = useRef(new Animated.Value(0)).current;

    const { currentUser } = useCurrentUser();
    // TODO: integrate layout actions (scroll-to-top etc) as we propagate beyond home.
    const pagePath = pageData?.uri;
    const settings = getPageSettings(pageData?.config, pagePath);
    const router = useRouter();
    const isWeb = Platform.OS === 'web';

    let textName = pageData?.name;

    if (isMenuNameAsTitle) {
        const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config, pageData?.menu);
        textName = menuSettings.name;
    }
    // Support passing either:
    // - a React element: headerComponent={<MyHeader />}
    // - a component type: headerComponent={MyHeader}
    const resolvedHeaderComponent = useMemo(() => {
        if (!headerComponent) return null;
        if (isValidElement(headerComponent)) return headerComponent;

        if (typeof headerComponent === 'function' || (typeof headerComponent === 'object' && headerComponent !== null)) {
            try {
                return createElement(headerComponent);
            } catch {
                return headerComponent;
            }
        }
        return headerComponent;
    }, [headerComponent]);

    const headerContent = resolvedHeaderComponent ?? textName;

    let rightComponents = settings?.header
    if (!rightComponents || Object.entries(rightComponents).length === 0) {
        const menu_name = pageData?.menu?.object;
        if (menu_name) {
            const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
            const addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
            rightComponents = menuItemsFilter(addButtonsSet, currentUser);
        }
    }

    if (!currentUser) {
        rightComponents = <></>;
    }

    const memoizedRightComponents = useMemo(() => {
        if (Array.isArray(rightComponents) && !isValidElement(rightComponents[0])) {
            return getRightHeader(rightComponents, currentUser, pagePath);
        }
        return rightComponents;
    }, [rightComponents, currentUser, pagePath]);

    const type = typeof headerContent;
    let text = type === 'string' ? headerContent : '';

    const isHome = pagePath === 'home';
    if (isHome || (!currentUser && isWeb)) {
        text = '';
    }
    text = text.replace('__notification__', '');



    if (isNoContainer)
        return headerContent;


    const ContextSelector = getComponent('molecule', 'context_selector')
    const HeaderElement = getComponent('molecule', 'header_element');
    const isCollapsibleHeader = appSetting('native', 'collapsible_header') && !isDesktop;

    // Reset shared header height when leaving this screen to avoid leaking padding to other screens.
    useIsomorphicLayoutEffect(() => {
        // Ensure a sane non-zero starting value for lists before first measurement,
        // and force "not scrolled" state so the header starts visible.
        setHeaderHeightAtom(64);
        setScrollDirectionAtom(0);
        return () => {
            setHeaderHeightAtom(0);
            setScrollDirectionAtom(0);
        };
    }, [setHeaderHeightAtom, setScrollDirectionAtom]);

    // Анимация уплывания хедера на нативе
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
    
    // Динамический компонент и стили для нативы
    const HeaderContainer = !isWeb && isCollapsibleHeader ? Animated.View : View;
    const nativeStyle = !isWeb && isCollapsibleHeader ? {
        transform: [{ translateY: headerTranslateY }],
    } : {};
    const pointerEvents = (!isWeb && isCollapsibleHeader && scrollDirection === 1) ? 'none' : 'auto';
    // react-native-web warns about pointerEvents prop; prefer style on web.
    const containerStyle = {
        ...nativeStyle,
        ...(isWeb ? { pointerEvents } : {}),
    };

    return (
        <>
            {isWeb && <View style={{ height: headerHeight }} />}
            <HeaderContainer
                className={`w-full z-50 bg-card backdrop-blur-xl border-b border-border/60 web:fixed native:absolute web:top-0 web:transition-transform web:duration-300 web:ease-in-out ${cssClass}`}
                style={containerStyle}
                pointerEvents={!isWeb ? pointerEvents : undefined}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    if (height !== headerHeight) {
                        setHeaderHeight(height);
                        setHeaderHeightAtom(height);
                    }
                }}
            >
                <Row className="items-center justify-between h-16">
                    <Row className="items-center justify-start">
                        {((!currentUser || !pageData?.context) && !text && (!settings?.headerSettings || settings?.headerSettings?.header) || (!isWeb && !currentUser)) &&
                            <Link href="/home" size="lg" aria-label="Home">
                                <Pressable className="items-center">
                                    {appStatic('logo')}
                                </Pressable>
                            </Link>

                        }
                        {(backButtonPresented && (!isWeb || history.length > 2)) && (
                            <View className="px-2 items-center"><Button variant="text" rounded onPress={() => {
                                FeedbackHaptics('Medium');
                                router ? router?.back() : history.back();
                            }} startDecorator="ArrowLeft" size="base" /></View>
                        )}
                        {(pageData?.context?.current?.url || isHome) && <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />}
                        {(!appSetting('context_selector', 'show_always') && ((!!text && !pageData?.context?.current?.url) || (pageData?.context && !pageData?.context?.current?.url && !isHome))) && <Row className='items-center px-3'><>
                            {(!!text && !pageData?.context?.current?.url) && (
                                <TextHeader text={text}></TextHeader>
                            )}
                            {(pageData?.context && !pageData?.context?.current?.url && !isHome) && <ContextSelector mode="min" url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />}
                        </></Row>}
                        {(appSetting('context_selector', 'show_always')) && <Row className='items-center'><>
                            {(pageData?.context && !pageData?.context?.current?.url && !isHome) && <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />}
                        </></Row>}
                        {(type !== 'string' && headerContent) && <View className="flex-auto">{headerContent}</View>}

                    </Row>
                    {isWeb && <MenuTop url={pageData.url} uri={pageData.uri} />}
                    <Row className=" items-end">
                        {rightHeaderComponent ? rightHeaderComponent : memoizedRightComponents}
                        <HeaderElement mode="small" url={pageData?.url} uri={pageData?.uri} />
                        {(pageData?.context && pageData?.cover_block?.actions_menu) && <CoverMenu
                            {...pageData.cover_block.actions_menu}
                            uri={pageData.uri}
                            isSplitMenu={false}
                        />}
                    </Row>
                </Row>
                {subheader}
            </HeaderContainer></>
    );
};
