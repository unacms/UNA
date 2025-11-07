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
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'
import { useLayoutData } from 'app/context/layout';
import { useTranslation } from 'react-i18next';

import { Button } from 'app/design/controls'
import { getComponent } from 'app/components/registry';
import {
    CoverMenu,
} from 'app/components/nav/menu-cover'

export const TextHeader = memo(({ text }) => {
    const { t } = useTranslation();
    return <Text className="font-bold leading-12 lg:px-2 text-card-foreground text-2xl tracking-tight">
        {t(text)}
    </Text>
})

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
        const menuSettings = getMenuSettings(pageData?.menu?.object, pageData?.menu?.config, pageData?.menu);
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

    useEffect(() => {
        if (layoutData && layoutData?.type == 'list:move_to_top') {
            setLayoutData(null);
            scrollToTop();
        }
    }
        , [layoutData]);

    if (isNoContainer)
        return headerContent;


    const ContextSelector = getComponent('molecule', 'context_selector')
    const HeaderElement = getComponent('molecule', 'header_element');

    return (
        <Row className="items-center justify-between h-14 px-2">
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
                 {(appSetting('context_selector', 'show_always') ) && <Row className='items-center'><>
                    {(pageData?.context && !pageData?.context?.current?.url && !isHome) && <ContextSelector url={pageData?.url} uri={pageData?.uri} data={pageData?.context} />}
                </></Row>}
                {(type !== 'string' && headerContent) && <View className="flex-auto">{headerContent}</View>}

            </Row>
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
    );
});

function getRightHeader(items, currentUser, pagePath) {
    items = menuItemsFilter(items, currentUser);
    let addMenu = null;
    if (pagePath == '/home' && currentUser) {
        const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);
        if (menu_add_items.length) {
            addMenu = <MenuAdd key='menu-add' buttonProps={{ variant: "default", ring: 'p-0', rounded: 'rounded', startDecorator: "Plus", id: "m3", size: 'sm' }} />;
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
                        btn = <></>//btn = <Search section={button.section} params={{ trigger: { title: button.title, icon: button.icon ? button.icon : 'Search', size: 'base', variant: 'secondary', onPress: () => FeedbackHaptics('Medium') } }} />
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

                    return (<View className="" key={`add-${button.icon}`} ></View>)/*{btn}*/;
                })

            }
            {!!addMenu && <View className=' '>{addMenu}</View>}
        </Row>
    );
};