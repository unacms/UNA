import { View, Row, Pressable } from 'app/design/view';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import React, { useMemo, memo, isValidElement } from 'react';
import { getPageSettings } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { Platform } from 'react-native'
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';
import { menuItemsFilter } from 'app/lib/util';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting, getMenuSettings } from 'app/lib/util'
import Search from 'app/ui/molecules/search';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useRouter } from 'app/lib/hooks/router'

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
    const pagePath = pageData?.uri;
    const settings = getPageSettings(pageData?.config, pagePath);
   
    const router = useRouter();

    let textName = pageData?.name;
    
    if (isMenuNameAsTitle) {
        //console.log("pageData3", pageData?.menu?.object, pageData?.menu?.config)
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

    const memoizedRightComponents = useMemo(() => {
        if (Array.isArray(rightComponents) && !isValidElement(rightComponents[0])) {
            return getRightHeader(rightComponents, currentUser, pagePath);
        }
        return rightComponents;
    }, [rightComponents, currentUser, pagePath]);

    const type = typeof headerContent;
    let text = type === 'string' ? headerContent : '';

    const isHome = pagePath === 'home';
    if (isHome) {
        text = '';
    }

    text = text.replace('__notification__', '');

    const isWeb = Platform.OS === 'web';

   
    if (isNoContainer)
        return headerContent;

    return (
        <Row className={`justify-between items-center h-[64px] `}>
            <Row>
                {(isHome) && <Pressable onPress={scrollToTop} className="ml-[12px]">{appStatic('logo_native')}</Pressable>}
                <View className="mr-[12px]">{(backButtonPresented && (!isWeb || history.length > 2)) && (
                    <Button variant="text"  rounded size="lg" bgrDecorator onPress={() => {
                        FeedbackHaptics('Medium');
                        router? router?.back() : history.back();
                    }} startDecorator="ChevronLeft" />
                )}</View>
                {!!text && (
                    <View>
                        <Text className="font-bold text-neutral-800 dark:text-neutral-200 text-3xl tracking-tighter">
                            {text}
                        </Text>
                    </View>
                )}
            </Row>
            {type !== 'string' && <View className="flex-auto">{headerContent}</View>}
            {(memoizedRightComponents || rightHeaderComponent) && <Row className="mr-[12px]">{rightHeaderComponent ? rightHeaderComponent : memoizedRightComponents}</Row>}
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
                btn = <Button 
                    rounded title={button.title} 
                    variant='secondary' 
                    startDecorator={button.icon} 
                    size="base" 
                    addon={button.link == appSetting('messenger', 'url') ? {variant:'primary', text: currentUser?.counters?.bx_messenger_new_messages, hideZero: true} : undefined}
                />;
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
