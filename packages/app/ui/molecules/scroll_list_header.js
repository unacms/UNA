import { View, Row, Pressable } from 'app/design/view';
import { useMemo, useEffect, memo, isValidElement } from 'react';
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import { FeedbackHaptics, getPageSettings } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting, getMenuSettings } from 'app/lib/util'
import Search from 'app/ui/molecules/search';
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'

import { useLayoutData } from 'app/context/layout';
import { useTranslation } from 'react-i18next';
import MenuLauncher from 'app/components/nav/menu-launcher'
import { Button, ButtonRef } from 'app/design/controls'
import { getComponent } from 'app/components/registry';

export const TextHeader = memo(({ text }) => {
    const { t } = useTranslation();
    return <Text className="font-bold text-neutral-800 dark:text-neutral-200 flex-auto leading-11 text-2xl sm:text-3xl p-1.5 sm:p-2 tracking-tight">
        {t(text)}
    </Text>
})

function RightNonLogged(props) {
    const bSearch = appSetting('layout', 'search') == true
    return (
        <Row className=' '>
            {bSearch && <Search
                params={{ trigger: { icon: 'Search', size: 'base', variant: 'secondary', onPress: () => FeedbackHaptics('Medium') } }} />
            }
            <MenuLauncher />
            <Link href="/login" onPress={() => FeedbackHaptics('Medium')}>
                <ButtonRef
                    variant="secondary"
                    tooltip="Account"
                    rounded
                    size="base"
                    hitSlop={4}
                    aria-label="Account"
                    ring="p-1"
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
    const router = useRouter();
    const isWeb = Platform.OS === 'web';

    let textName = pageData?.name;

    if (isMenuNameAsTitle) {
        const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config);
        textName = menuSettings.name;
    }
    const headerContent = headerComponent ? headerComponent : textName;

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
    const ContextSelector = getComponent('molecule', 'context_selector')
    const HeaderElement = getComponent('molecule', 'header_element')

    return (

        <Row className={` px-1.5 sm:px-2 items-center h-16 justify-between web:duration-300`}>
            {((!currentUser || !pageData?.context) && !text && (!settings?.headerSettings || settings?.headerSettings?.header)) && 
                <Link href="/home" aria-label="Home">
                    <Pressable className="items-center p-1.5 sm:p-2 flex-row web:hover:scale-105 web:active:scale-95 rounded-xl  text-neutral-800 dark:text-neutral-200 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 duration-300 ">
                        {appStatic('logo')}
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
            {(!!text) && (
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
            addMenu = <MenuAdd key='menu-add' buttonProps={{ variant: "default", rounded: 'rounded', startDecorator: "Plus", id: "m3", size: 'sm' }} />;
        }
    }
    if (items?.length == 0 && !addMenu)
        return null;

    return (
        <Row className='gap-x-1 items-center'>
            {
                items?.map((button) => {
                    let btn = undefined;
                    if (button.section || button.link == 'search')
                        btn = <Search section={button.section} params={{ trigger: { title: button.title, icon: button.icon ? button.icon : 'Search', size: 'base', variant: 'secondary', onPress: () => FeedbackHaptics('Medium') } }} />
                    else {
                        btn = <Button
                            rounded title={button.title}
                            variant='secondary'
                            startDecorator={button.icon}
                            size="base"
                            ring="p-1"
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