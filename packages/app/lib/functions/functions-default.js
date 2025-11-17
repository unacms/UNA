import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import { appSetting, updateRouteDataForConnection, getPageSettings } from 'app/lib/util'
import { getComponent } from 'app/components/registry';
import { appStatic } from 'app/lib/app-static';
import { View, Row } from 'app/design/view'
import { MenuItemSidebar } from 'app/components/nav/menu-item-sidebar'
import { 
    SvgBackgroundSplash, 
    SvgBackgroundSplashDark,
    SvgBackgroundCreateAccount,
    SvgBackgroundCreateAccountDark,
    SvgBackgroundLogin,
    SvgBackgroundLoginDark,
} from 'app/ui/atoms/backgrounds';
import { useIsDesktop } from 'app/context/measure';

export function getFriendsCounter(currentUser) {
    return currentUser?.counters?.bx_persons_friend_requests
}

export function getBadgeForTab(currentUser, url) {
    const badgeTextSize = appSetting('theme', 'native_tabs', 'badgeTextSize') || 'text-xs';
    
    if (
        url == appSetting('notifications', 'url') &&
        currentUser?.notifications
    ){
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {currentUser?.notifications}
            </Text>
        )
    }

    if (
        url == appSetting('messenger', 'url') &&
        currentUser?.counters?.bx_messenger_new_messages
    ){
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {currentUser?.counters?.bx_messenger_new_messages}
            </Text>
        )
    }
    return null
}

export function getButtonForConductor(a, index, currentUser) {
    
    const settings = getPageSettings(a?.config, a.key);
    const icon = !a.ident
        ? settings?.icon
            ? settings?.icon
            : a?.icon.replace('*', '')
        : a.icon.replace('*', '')

    let addon = a.addon ? a.addon : null
    if (!appSetting('conductor', 'show_nav_counters')) addon = null
    if ( appSetting('conductor', 'show_nav_counters') == 'primary' && a?.addon?.variant != 'primary')
        addon = null
    return <MenuItemSidebar addon={addon} title={a.title} icon={icon || 'Circle'} isActive={a.index == index ? true : false} />
       
}

export function getButtonForConductorSmall(a, index, onPress) {

    let addon = a.addon ? a.addon : null
    if (!appSetting('conductor', 'show_nav_counters')) addon = null
    if (
        appSetting('conductor', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null
    
    return getButtonForConductorHor(null, a.title, a.index == index, addon, onPress, a);
}

export function getButtonForConductorHor(icon, title, pressed, addon, onPress, item) {
    function ConductorButtonResponsive({ icon, title, pressed, addon, onPress, item }) {
        const isDesktop = useIsDesktop();
        const size = isDesktop ? 'base' : 'sm';
        const rounded = !isDesktop;
        return (
            <Button
                startDecorator={icon}
                title={title}
                variant={'text'}
                rounded={rounded}
                pressed={pressed}
                disabled={item?.item?.disabled}
                size={size}
                haptics="Medium"
                addon={addon}
                onPress={onPress}
            />
        );
    }
    return (
        <ConductorButtonResponsive icon={icon} title={title} pressed={pressed} addon={addon} onPress={onPress} item={item} />
    )
}

export function getAddonForConductor(a, index, currentUser) {
    let addonContent = null;
    //let settings = appSetting('l-+ayouts', a.key)
    const settings = getPageSettings(a?.config, a.key);
    let icon = !a.ident
        ? settings?.icon
            ? settings?.icon
            : a?.icon.replace('*', '')
        : a.icon.replace('*', '')

    let addon = a.addon ? a.addon : null
    if (!appSetting('conductor', 'show_nav_counters')) addon = null
    if (
        appSetting('conductor', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null

    if (addon) {
        const addonClasses = addon.variant === 'primary' ? "bg-pop dark:bg-pop-d" : "bg-neutral-500 dark:bg-neutral-500";
        const addonText = addon.variant === 'primary' ? addon.text : addon;
        if (addonText) {
            addonContent = (
                <Text className={`${addonClasses} rounded-full px-2 py-0.5  text-center items-center text-white text-xs font-semibold`}>
                    {addonText}
                </Text>
            );
        }
    }
    return addonContent;
}

export function getButtonForConductorNative(a, index, currentUser, setIndex, onChangeRoute) {
    const settings = getPageSettings(a?.config, a.key);
    let iconName = null; 
    if (a.ident && a.icon) { 
        iconName = typeof a.icon === 'string' ? a.icon.replace('*', '') : null;
    } else if (settings?.icon) { 
        iconName = settings.icon;
    } else if (a?.icon) { 
        iconName = typeof a.icon === 'string' ? a.icon.replace('*', '') : null;
    }

    let addon = a.addon ? a.addon : null
    if (!appSetting('conductor', 'show_nav_counters')) addon = null
    if (
        appSetting('conductor', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null

    function NativeConductorButtonResponsive({ a, index, onChangeRoute, setIndex, iconName, addon }) {
        const isDesktop = useIsDesktop();
        const size = isDesktop ? 'base' : 'sm';
        const rounded = !isDesktop;
        return (
            <Button onPress={() => {
                setIndex(a.index)
                if (onChangeRoute) {
                    onChangeRoute(a);
                }
            }} 
            startDecorator={iconName}
            addon={addon} 
            fullWidth={false} 
            variant={index === a.index ? 'primary' : "text"} 
            rounded={rounded}
            size={size} 
            title={a.title} />
        );
    }
    return (
        <NativeConductorButtonResponsive a={a} index={index} onChangeRoute={onChangeRoute} setIndex={setIndex} iconName={iconName} addon={addon} />
    );
}

export function getSkeletonByEndPoint(currentRoute)
{
    return null;
}


export function updateRouteDataForConnections(
    currentRoute,
    layoutData,
    routes,
    index,
    setRoutes
) {
    updateRouteDataForConnection(
        'system/browse_subscriptions',
        ['remove'],
        'sys_profiles_subscriptions',
        currentRoute,
        layoutData,
        routes,
        index,
        setRoutes
    )
    updateRouteDataForConnection(
        'system/browse_friends',
        ['remove'],
        'sys_profiles_friends',
        currentRoute,
        layoutData,
        routes,
        index,
        setRoutes
    )
    updateRouteDataForConnection(
        'system/browse_friend_requested',
        ['remove'],
        'sys_profiles_friends',
        currentRoute,
        layoutData,
        routes,
        index,
        setRoutes
    )
    updateRouteDataForConnection(
        'system/browse_friend_requests',
        ['add'],
        'sys_profiles_friends',
        currentRoute,
        layoutData,
        routes,
        index,
        setRoutes
    )
    updateRouteDataForConnection(
        'system/browse_recommendations_subscriptions',
        ['add', 'ignore'],
        'sys_subscriptions',
        currentRoute,
        layoutData,
        routes,
        index,
        setRoutes
    )
    updateRouteDataForConnection(
        'system/browse_recommendations_friends',
        ['add', 'ignore'],
        'sys_friends',
        currentRoute,
        layoutData,
        routes,
        index,
        setRoutes
    )
}

const createMenuItem = (menuItem, isPrimary) => {

    if (!menuItem) return null;
    if (menuItem.data?.type) {
        const Element =  getComponent('molecule', String(menuItem.data.type))
        if (Element) {
            const oElementParams = {
                ...menuItem.data,
                primary: isPrimary,
                params: {
                    button_rounded: menuItem.data?.params?.button_rounded || false,
                    button_full_width: menuItem.data?.params?.button_full_width || true,
                    only_icon: menuItem.data?.params?.only_icon || false,
                    on_done: (sAction, oData) => {
                        // Handle action completion
                    },
                },
            };
            return <Element key={menuItem.id || menuItem.name} {...oElementParams} />;
        }
    } else {
        return (
            <Button
                variant={isPrimary ? "primary" : "secondary"}
                size="sm"
                fullWidth
                title={menuItem.title}
                className="my-auto"
                startDecorator={menuItem.icon || false}
                onPress={menuItem.onPress}
            />
        );
    }
    return null;
};

export function getUnitMenuItems(unitType, data, handleClick, t, moduleName) {

    let oMenuItemPrimary = null;
    let oMenuItemSecondary = null;
    let oMenuItemDelete = null;

    if (data?.meta) {
        let sPrimary = "";
        let sSecondary = "";
        let sDelete = "";
        if (moduleName == 'bx_persons' || moduleName == 'bx_organizations' || moduleName == 'system'){
            switch (unitType) {
                case "person_friends":
                    oMenuItemPrimary = {
                        title: t("Message"),
                        icon: "MessageCircleMore",
                        onPress: async (event) => {
                            event.preventDefault();
                            const request_url = `/api.php?r=bx_messenger/get_convo_url/Services&params[]=${JSON.stringify({ recipient: data.author_data.id })}`;
                            const sResponse = await fetcher(request_url);
                            handleClick(event, sResponse.data);
                        },
                    };
                    break;
                case "person_friends_recommendations":
                    sPrimary = "befriend";
                    sDelete = "ignore-befriend";
                    break;
                case "browse_friend_requests":
                    sPrimary = "befriend";
                    sSecondary = "unfriend";
                    break;
                case "person_friends_suggestion":
                    sPrimary = "befriend";
                    bMenuItemsMoreShow = false;
                    break;
                case "person_friend_requested":
                    sPrimary = "unfriend";
                    break;
                case "person_following_recommendations":
                    sPrimary = "subscribe";
                    sDelete = "ignore-subscribe";
                    break;
                case "person_followers":
                    sPrimary = "subscribe";
                    sSecondary = "unsubscribe";
                    break;
                case "person_following":
                    sPrimary = "unsubscribe";
                    break;
            }
        }
        else{
            sPrimary = "join";
            sSecondary = "leave";
            if (unitType == 'context_recommendations')
                sDelete = "ignore-join";
            if (moduleName == "bx_channels") {
                sPrimary = "subscribe";
                sSecondary = "unsubscribe";
            }
        }

        if (!oMenuItemPrimary) {
            oMenuItemPrimary = data.meta.items.find(item => item.name === sPrimary);
        }
        

        if (!oMenuItemSecondary) {
            oMenuItemSecondary = data.meta.items.find(item => item.name === sSecondary);
        }

        if (!oMenuItemDelete) {
            oMenuItemDelete = data.meta.items.find(item => item.name === sDelete);
           
        }

        if (!oMenuItemPrimary && oMenuItemSecondary){
            oMenuItemPrimary=oMenuItemSecondary;
            oMenuItemSecondary=null;
        }

        if (!oMenuItemPrimary){
            oMenuItemPrimary = {
                title: "View",
                onPress: (event) => handleClick(event, data.url),
            };
        }

        oMenuItemPrimary = createMenuItem(oMenuItemPrimary, true);
        oMenuItemSecondary = createMenuItem(oMenuItemSecondary, false);
        if (oMenuItemDelete) {
            oMenuItemDelete = {
                ...oMenuItemDelete, 
 
                data: {...oMenuItemDelete.data, title:'', params: {...oMenuItemDelete.data.params, button_full_width: false, button_rounded: true, only_icon:true}}
            };
            oMenuItemDelete = createMenuItem(oMenuItemDelete, false);
        }
    }

    return {
        oMenuItemPrimary,
        oMenuItemSecondary,
        oMenuItemDelete
    };
}

export function noContentByUrl(endpoint){
    return appStatic('components_content_empty')
}

export function layoutForList(endpoint){
     if (!endpoint && endpoint?.request_url.includes('bx_timeline'))
        return 'w-full';

    if (endpoint?.module == 'bx_groups')
        return 'w-full @xl/list:w-1/2 @3xl/list:w-1/3 @6xl/list:w-1/4 p-2';
    
    return 'w-full @md/list:w-1/2 @xl/list:w-1/3 @5xl/list:w-1/4 @6xl/list:w-1/5 p-2';
}

export function getNumColsForConductor(width, currentRoute, leftSideBar) {
    return 0;
}

export function getBackground(pathname, currentUser)
{
    if (currentUser === false){
        if(pathname === '/' || pathname === '/home')
            return 'splash';

        if(pathname === '/login')
            return 'login';

        if(pathname === '/create-account')
            return 'create-account';
    }
    return 'default';
}

export function getBackgrounds() {
     return {
        splash: {
            light: <SvgBackgroundSplash />,
            dark: <SvgBackgroundSplashDark />,
        },
        'create-account': {
            light: <SvgBackgroundCreateAccount />,
            dark: <SvgBackgroundCreateAccountDark />,
        },
        login: {
            light: <SvgBackgroundLogin />,
            dark: <SvgBackgroundLoginDark />,
        },
        default: {
            light: <View className="w-full h-full bg-background" />,
            dark: <View className="w-full h-full bg-background" />,
        }
    }
}

export function getFiltersForConductor(filters, setFilterValue, filterValues) {
    const inputs = filters?.inputs;
    if (!inputs)
        return null;

    return null;
    
}