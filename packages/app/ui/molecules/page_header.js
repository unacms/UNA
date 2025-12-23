import { View, Row, Pressable } from 'app/design/view';
import { useEffect, memo, useRef } from 'react';
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
import { useSetHeaderHeight, useScrollDirection, useHeader, useHeaderHeight, useSetScrollDirection, useSetHeader, defaultHeader } from 'app/context/jotai/layout';
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
    const setHeader = useSetHeader();
    const scrollDirection = useScrollDirection();
    const setScrollDirection = useSetScrollDirection();
    const setHeaderHeightAtom = useSetHeaderHeight();
    const headerHeight = useHeaderHeight();

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

    useEffect(() => {
        setScrollDirection(0);
        if (isWeb)
            setHeader(defaultHeader);
    }, [pageData?.url, pageData?.uri, setScrollDirection, isDesktop]);
    

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
    const cssClass = isCollapsibleHeader && scrollDirection === 1 ? 'web:-translate-y-full ' : 'web:translate-y-0 ';

    const HeaderContainer = !isWeb && isCollapsibleHeader ? Animated.View : View;
    const nativeStyle = !isWeb && isCollapsibleHeader ? {
        transform: [{ translateY: headerTranslateY }],
        pointerEvents: scrollDirection === 1 ? 'none' : 'auto'
    } : {};
    /* animations for hide header */

    const Logo = <Link href="/home" size="lg" aria-label="Home">
            <Pressable className="items-center">
                {appStatic('logo')}
            </Pressable>
        </Link>
    /* left element, can be logo, context selecor or title */
    const leftElement = !currentUser ? Logo : (isFullContextSelector ? <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} /> :( isShowLogo ? Logo : (
        <TextHeader text={pageTitle} />
    )));
    /* left element, can be logo, context selecor or title */

    const contextSelectorElement = isContextSelector && !isFullContextSelector ? <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} mode="min" />: null;

    if (header.header === false){
        return 
    }
    return (
        <>
            {isWeb && <View style={{ height: headerHeight }} />}
            <HeaderContainer
                className={`w-full z-50 bg-card/70 shadow-border  backdrop-blur-xl web:fixed native:absolute web:top-0 web:transition-transform web:duration-300 web:ease-in-out ${cssClass}`}
                style={nativeStyle}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    if (height !== headerHeight) {
                        setHeaderHeightAtom(height);
                    }
                }}
            >
                {header.header ? header.header : (<>
                    <Row className={`items-center justify-between web:h-16 px-3 ${appSetting('layout', 'header', 'content')}`}>
                        <Row className="items-center justify-start flex-1 lg:flex-none gap-x-2">
                            <Row className="items-center justify-start lg:w-80 gap-x-2">
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
                            
                        </Row>
                        {isWeb && <MenuTop url={pageData.url} uri={pageData.uri} />}
                        <Row className=" items-center justify-end lg:w-80">
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
