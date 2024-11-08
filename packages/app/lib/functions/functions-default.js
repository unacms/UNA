import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import React from 'react'
import { appSetting, updateRouteDataForConnection } from 'app/lib/util'
import { Platform } from 'react-native'
import { componentsMap } from 'app/ui/molecules/_map'
import { appStatic } from 'app/lib/app-static';

export function getBadgeForTab(currentUser, url) {
    if (
        url == appSetting('layout', 'notifications') &&
        currentUser?.notifications
    )
        return (
            <Text className={Platform.OS === 'ios' ? 'text-xs' : 'text-sm'}>
                {currentUser?.notifications}
            </Text>
        )
        if (
            url == appSetting('layout', 'messenger') &&
            currentUser?.counters?.bx_messenger_new_messages
        )
            return (
                <Text className={Platform.OS === 'ios' ? 'text-xs' : 'text-sm'}>
                    {currentUser?.counters?.bx_messenger_new_messages}
                </Text>
            )
   /* if (url == '/friends-all' && currentUser?.counters)
        return (
            <Text className={Platform.OS === 'ios' ? 'text-xs' : 'text-sm'}>
                {currentUser.counters.respects + currentUser.counters.trust}
            </Text>
        )
*/
    return null
}

export function getButtonForConductor(a, index, currentUser) {

    let settings = appSetting('layouts', a.key)
    let icon = !a.ident
        ? settings?.icon
            ? settings?.icon
            : a?.icon.replace('*', '')
        : a.icon.replace('*', '')

    let addon = a.addon ? a.addon : null
    if (!appSetting('layout', 'show_nav_counters')) addon = null
    if (
        appSetting('layout', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null

    return (
        <Button
            variant='text'
            size={!a.ident ? 'lg' : 'sm'}
            pressed={a.index == index ? true : false}
            fullWidth
            title={a.title}
            align="start"
            startDecorator={icon}
            addon={addon}
        />
    )
}

export function getButtonForConductorSmall(a, index, currentUser) {
    let settings = appSetting('layouts', a.key)
    let icon = !a.ident
        ? settings?.icon
            ? settings?.icon
            : a?.icon.replace('*', '')
        : a.icon.replace('*', '')

    let addon = a.addon ? a.addon : null
    if (!appSetting('layout', 'show_nav_counters')) addon = null
    if (
        appSetting('layout', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null

    return (
        <Button
            variant={a.index == index ? 'secondary' : "text"}
            size={"sm"}
            pressed={a.index == index ? true : false}
            fullWidth
            title={(a.title)}
            align="start"
            addon={addon}
        />
    )
}

export function getAddonForConductor(a, index, currentUser) {
    let addonContent = null;
    let settings = appSetting('layouts', a.key)
    let icon = !a.ident
        ? settings?.icon
            ? settings?.icon
            : a?.icon.replace('*', '')
        : a.icon.replace('*', '')

    let addon = a.addon ? a.addon : null
    if (!appSetting('layout', 'show_nav_counters')) addon = null
    if (
        appSetting('layout', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null

    if (addon) {
        const addonClasses = addon.variant === 'primary' ? "bg-contrast dark:bg-contrast-d" : "bg-neutral-500 dark:bg-neutral-500";
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

    let settings = appSetting('layouts', a.key)
    let icon = !a.ident
        ? settings?.icon
            ? settings?.icon
            : a?.icon.replace('*', '')
        : a.icon.replace('*', '')

    let addon = a.addon ? a.addon : null
    if (!appSetting('layout', 'show_nav_counters')) addon = null
    if (
        appSetting('layout', 'show_nav_counters') == 'primary' &&
        a?.addon?.variant != 'primary'
    )
        addon = null

    return (
        <Button onPress={() => {
            setIndex(a.index)
            if (onChangeRoute) {
                onChangeRoute(a);
            }
        }} addon={addon} fullWidth={false} variant={index === a.index ? 'primary' : "text"} rounded size='sm' title={a.title} />
    )
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
        const Element = componentsMap[menuItem.data.type];
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
                        icon: "ChatTeardropDots",
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