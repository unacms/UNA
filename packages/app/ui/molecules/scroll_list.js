import { View, Row, Pressable } from 'app/design/view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
} from 'react-native-reanimated';
import { useRef } from "react";
import { BlurView } from 'expo-blur';
import React, { useMemo, memo, isValidElement } from 'react';
import { getPageSettings } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { useRouter } from "expo-router";
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting, getMenuSettings } from 'app/lib/util'
import Search from 'app/ui/molecules/search';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'

// TODO OPTIMIZATION
export default function ScrollList({ content, pageData, headerHeight, isBackButton = false, contentType, ref, headerComponent, subHeaderComponent }) {

    const isCollapsibleHeader = appSetting('native', 'collapsible_header');
    const isShowScrollToTopButton = appSetting('native', 'scroll_to_top_button');
    const transparencyOffset = 200
    const { colors } = Theme();

    /* ANIMATION */
    const scrollRef = useRef();
    const scrollY = useSharedValue(0);
    const scrollDirection = useSharedValue('none');

    const headerStyle = useAnimatedStyle(() => {
        const isShow = scrollDirection.value == 'up' || scrollY.value < transparencyOffset || scrollY.value == 0;
        return {
            opacity: isShow ? withTiming(1) : withTiming(0),
           // backgroundColor: colors.headerBackground
        };
    });

    const buttonStyle = useAnimatedStyle(() => {
        return {
            opacity: scrollY.value > transparencyOffset ? withTiming(1) : withTiming(0),
        };
    });

    const onScroll = useAnimatedScrollHandler((event) => {
        const currentY = Math.round(event.contentOffset.y / 10) * 10;

        if (currentY === scrollY.value) return;

        scrollDirection.value = currentY > scrollY.value ? 'down' : 'up';
        scrollY.value = currentY;
    });

    const scrollToTop = () => {
        const targetRef = ref ?? scrollRef;
        const scrollFn = contentType === 'FlatList' ? 'scrollToOffset' : 'scrollTo';

        targetRef?.current?.[scrollFn]?.({ y: 0, x: 0, animated: true });
    };


    /* ANIMATION */

    const baseProps = {
        ref: ref ?? scrollRef,
        ...(contentType !== 'FlatList' && { paddingTop: headerHeight }),
        ...(isCollapsibleHeader && { onScroll }),
        style: {backgroundColor: colors.headerBackground}
    };

    const enhanced = React.cloneElement(content, baseProps);


    return (
        <View className="flex-1 bg-red-500">
            <Animated.View className="absolute top-0 w-full z-50" style={[headerStyle]}>
                <BlurView tint="default"
                    intensity={100}
                    experimentalBlurMethod="none" className={`w-full h-[${headerHeight}px]`} >
                    <View className="w-full" style={{backgroundColor: colors.headerBackground}} >
                        <Header
                            backButtonPresented={isBackButton}
                            header={headerComponent ? headerComponent : pageData.name}
                            pageData={pageData}
                        />
                        {subHeaderComponent}
                    </View>
                </BlurView>

            </Animated.View>
            {enhanced}
            {isShowScrollToTopButton && <Animated.View className="absolute bottom-[10px] right-[10px]" style={[buttonStyle]}>
                <Button
                    onPress={scrollToTop}
                    startDecorator="ChevronUp"
                    size="lg"
                    variant="primary"
                    rounded
                ></Button>
            </Animated.View>
            }
        </View>
    )
}

const Header = memo(({ backButtonPresented, header, pageData }) => {
    const { currentUser } = useCurrentUser();
    const settings = getPageSettings(pageData.config, pageData.uri);
    const pagePath = pageData.uri;

    let rightComponents = settings?.header
    if (!rightComponents) {
        const menu_name = pageData.menu?.object;
        if (menu_name) {
            const menuSettings = getMenuSettings(pageData?.menu?.object, pageData.menu?.config);
            const addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
            rightComponents = menuItemsFilter(addButtonsSet, currentUser);
        }
    }

    const memoizedRightComponents = useMemo(() => {
        if (Array.isArray(rightComponents) && !isValidElement(rightComponents[0])) {
            return getRightHeader(rightComponents, currentUser, pagePath);
        }
        return rightComponents;
    }, [rightComponents, currentUser, pagePath]);

    const type = typeof header;
    let text = type === 'string' ? header : '';

    const routerExpo = useRouter();
    const { colors } = Theme();

    const isHome = pagePath === 'home';
    if (isHome) {
        text = '';
    }

    text = text.replace('__notification__', '');

    return (
        <Row className={`justify-between items-center h-[64px] `}>
            <Row>
                {(isHome) && <View className="ml-[12px]">{appStatic('logo_native')}</View>}
                <View className="mr-[12px]">{backButtonPresented && (
                    <Button variant="text" onPress={() => {
                        FeedbackHaptics('Medium');
                        routerExpo.back();
                    }} startDecorator="ChevronLeft" />


                )}</View>

                {text && (
                    <View>
                        <Text className="font-bold text-neutral-800 dark:text-neutral-200 text-3xl tracking-tighter">
                            {text}
                        </Text>
                    </View>
                )}
            </Row>
            {type !== 'string' && <View className="flex-auto">{header}</View>}
            {memoizedRightComponents && <Row className="mr-[12px]">{memoizedRightComponents}</Row>}
        </Row>
    );
});


function getRightHeader(items, currentUser, pagePath) {
    items = menuItemsFilter(items, currentUser);
    let addMenu = null;
    if (pagePath == '/home' && currentUser) {
        const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);
        if (menu_add_items.length) {
            addMenu = <MenuAdd key='menu-add' buttonProps={{ variant: "secondary", rounded: 'rounded', startDecorator: "Plus", id: "m3" }} />;
        }
    }
    if (items?.length == 0 && !addMenu)
        return null;

    return <Row className='gap-x-[8px] items-center'>{
        items?.map((button) => {
            let btn = undefined;
            if (button.section || button.link == 'search')
                btn = <Search section={button.section} params={{ trigger: { title: button.title, icon: button.icon ? button.icon : 'Search', size: 'base', variant: 'secondary' } }} />
            else {
                btn = <Button rounded title={button.title} variant='secondary' startDecorator={button.icon} size="base" />;
                btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
            }

            return (
                <View className="" key={`add-${button.icon}`} >{btn}</View>
            )
        })

    }
        {!!addMenu && <View className=' '>{addMenu}</View>}
    </Row>;
};
