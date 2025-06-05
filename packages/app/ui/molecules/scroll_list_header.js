import { View, Row, Pressable } from 'app/design/view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import React, { useMemo, useEffect, memo, isValidElement } from 'react';
import { getPageSettings } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting, getMenuSettings } from 'app/lib/util'
import Search from 'app/ui/molecules/search';
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'
import ContextSelector from 'app/ui/molecules/context-selector'
import { useLayoutData } from 'app/context/layout';
import { useTranslation } from 'react-i18next';
import HeaderElement from 'app/ui/molecules/header_element'
import MenuLauncher from 'app/components/nav/menu-launcher'
import { Button, ButtonRef } from 'app/design/controls'


export const TextHeader = memo(({ text }) => {
    const { t } = useTranslation();
    return <Text className="font-bold text-neutral-800 dark:text-neutral-200 flex-auto leading-[36px] text-2xl tracking-tight">
        {t(text)}
    </Text>
})

function RightNonLogged(props) {
    const bSearch = appSetting('layout', 'search') == true
    return (
        <Row className=' gap-x-2'>
            {bSearch && <Search
                params={{ trigger: { icon: 'Search', size: 'base', variant: 'secondary', onPress: () => FeedbackHaptics('Medium') } }} />
            }
            <MenuLauncher />
            <Link href="/login">
                <ButtonRef
                    variant="secondary"
                    tooltip="Account"
                    rounded
                    size="base"
                    hitSlop={4}
                    aria-label="Account"

                    startDecorator="UserRound"
                />
            </Link>
        </Row>
    )
}

export const Header = memo(({
    backButtonPresented,
    headerComponent,
    pageData,
    scrollToTop,
    rightHeaderComponent,
    isMenuNameAsTitle,
    isNoContainer = false,
}) => {
    const { currentUser } = useCurrentUser();
    const { layoutData, setLayoutData } = useLayoutData()
    const pagePath = pageData?.uri;
    const settings = getPageSettings(pageData?.config, pagePath);
    const { t } = useTranslation();
    const router = useRouter();
    const isWeb = Platform.OS === 'web';

    let textName = pageData?.name;

    if (isMenuNameAsTitle) {
        const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
        textName = menuSettings.name;
    }
    const headerContent = headerComponent ? headerComponent : textName;

    let rightComponents = settings?.header
    if (!rightComponents) {
        const menu_name = pageData?.menu?.object;
        if (menu_name) {
            const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
            const addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
            rightComponents = menuItemsFilter(addButtonsSet, currentUser);
        }
    }

    if (!currentUser) {
        rightComponents = <RightNonLogged />;
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

    useEffect(() => {
        if (layoutData && layoutData?.type == 'list:move_to_top') {
            setLayoutData(null);
            scrollToTop();
        }
    }
    , [layoutData]);

    if (isNoContainer)
        return headerContent;

    const isCustomHeaderElement = appSetting('layout', 'custom_header_element')

    return (
        <Row className={` px-[12px] sm:px-[16px] items-center h-[64px] justify-between duration-300`}>
            {(!currentUser && !pageData?.context) && 
                <Link href="/home" aria-label="Home">
                    <Pressable className="items-center flex-row hover:scale-105 rounded-[14px] active:scale-95 active:opacity-50 gap-x-3 text-neutral-800 dark:text-neutral-200 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 duration-300 ">
                        <View className="w-[44px] h-[44px]">
                            {appStatic('logo_mark')}
                        </View>
                        <View className="w-[72px] h-[36px] flex-row items-center">
                            {appStatic('logo_text')}
                        </View>
                    </Pressable>
                </Link>
            }
            {(pageData?.context) && <ContextSelector url={pageData?.url} data={pageData?.context} />}
            {(backButtonPresented && (!isWeb || history.length > 2)) && (
                <View className=""><Button variant="text" rounded onPress={() => {
                    FeedbackHaptics('Medium');
                    router ? router?.back() : history.back();
                }} startDecorator="ArrowLeft" size="base" /></View>
            )}
            {!!text && (
                <TextHeader text={text}></TextHeader>
            )}

            {type !== 'string' && <View className="flex-auto">{headerContent}</View>}
            {(memoizedRightComponents || rightHeaderComponent || isCustomHeaderElement) && <Row className=" items-end ">
                {rightHeaderComponent ? rightHeaderComponent : memoizedRightComponents}
                {isCustomHeaderElement && <HeaderElement />}
            </Row>}
        </Row>
    );
});

function getRightHeader(items, currentUser, pagePath) {
    items = menuItemsFilter(items, currentUser);
    let addMenu = null;
    if (pagePath == '/home' && currentUser) {
        const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);
        if (menu_add_items.length) {
            addMenu = <MenuAdd key='menu-add' buttonProps={{ variant: "base", rounded: 'rounded', startDecorator: "Plus", id: "m3", size: 'sm' }} />;
        }
    }
    if (items?.length == 0 && !addMenu)
        return null;

    return (
        <Row className='gap-x-[8px] items-center'>
            {
                items?.map((button) => {
                    let btn = undefined;
                    if (button.section || button.link == 'search')
                        btn = <Search section={button.section} params={{ trigger: { title: button.title, icon: button.icon ? button.icon : 'Search', size: 'base', variant: 'text', onPress: () => FeedbackHaptics('Medium') } }} />
                    else {
                        btn = <Button
                            rounded title={button.title}
                            variant='secondary'
                            startDecorator={button.icon}
                            size="base"
                            addon={button.link == appSetting('messenger', 'url') ? { variant: 'primary', text: currentUser?.counters?.bx_messenger_new_messages, hideZero: true } : undefined}
                        />;
                        btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
                    }

                    return (
                        <View className="" key={`add-${button.icon}`} >{btn}</View>
                    )
                })

            }
            {!!addMenu && <View className=' '>{addMenu}</View>}
        </Row>
    );
};
