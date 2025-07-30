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
    return (
        <Button
            startDecorator={icon}
            title={title}
            variant={pressed ? 'primary' : 'secondary' }
            pressed={pressed}
            rounded
            disabled={item?.item?.disabled}
            ring
            size="sm"
            addon={addon}
            onPress={onPress}
        />
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
                <Text className={`${addonClasses} rounded-full px-2 py-0.5 mx-1 text-center items-center text-white text-xs font-semibold`}>
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
        rounded 
        size='sm' 
        title={a.title} />
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
                    button_rounded: false,
                    button_full_width: true,
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
    let bMenuItemsMoreShow = true;

    if (data?.meta) {
        let sPrimary = "";
        let sSecondary = "";

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
                case "browse_friend_requests":
                    sPrimary = "befriend";
                    sSecondary = unitType === "browse_friend_requests" ? "unfriend" : "ignore-befriend";
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
    }

    return {
        oMenuItemPrimary,
        oMenuItemSecondary,
    };
}

export function noContentByUrl(endpoint){
    return appStatic('components_content_empty')
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
    /*
    return (
        <Row className={appSetting('layout', 'max_width') + " mx-auto w-full p-3 sm:p-4 pb-1 sm:pb-0 w-full gap-x-4 items-center "}>

            {Object.keys(inputs).map((key, index) => {
                if (inputs[key].type == 'radio_set') {
                    let values = [];
                    if (Array.isArray(inputs[key].values)) {
                        values = inputs[key].values.map(function (key) {
                            return key.value && key.key != "date_range" ? { label: key.value, value: key.key } : null;
                        });
                        values = values.filter(Boolean);
                    }
                    return (
                        <Row key={index} className="items-center">
                            <Dropdown
                                labelField="label"
                                valueField="value"
                                value={route?.endpoint?.params?.filters?.[inputs[key].name]}
                                onChange={(value) => setFilterValue([{ name: inputs[key].name, value: value }])}
                                data={values}
                            />
                        </Row>
                    );
                } else if (inputs[key].type == 'text') {
                    return (
                        <Row key={index} className="items-center">
                            <Input
                                name="search"
                                placeholder={inputs[key].caption}
                                value={route?.endpoint?.params?.filters?.[inputs[key].name]}

                                onChangeText={(value) => setFilterValue(inputs[key].name, value)}
                            />
                        </Row>
                    );
                } else if (inputs[key].type == 'location') {
                    return (
                        <Row key={index} className="items-center">
                            <Location
                                name="search"
                                value={{ location_string: route?.endpoint?.params?.filters?.[inputs[key].name] }}
                                onChange={(value) => { setFilterValue([{ name: inputs[key].name, value: value.location_string }, { name: inputs[key].name + '_country', value: value.country }, { name: inputs[key].name + '_state', value: value.state }, { name: inputs[key].name + '_city', value: value.city }]) }}
                            />
                        </Row>
                    );
                }
                return null; // Return null if none of the conditions are met
            })}
        </Row>
    );*/
}