import { fetcher } from 'app/lib/fetcher'
import { updateRouteDataForConnection } from 'app/lib/util'
import { getComponent } from 'app/components/registry';
import { View } from 'app/design/view'

export function ProfileDisplayName(title) {
    return title;
}

export function ParseHtmlClasses(className, tag) {
    return className;
}

export function getFriendsCounter(currentUser) {
    return currentUser?.counters?.bx_persons_friend_requests
}

export function layoutForList(endpoint, unitMode = '') {
    if (unitMode == 'search'){
        if (endpoint =='bx_timeline' || endpoint.includes('_cmts')){
             return 'w-full @lg/list:w-1/2 ';
        }
    }
    if (!endpoint || endpoint?.request_url?.includes('bx_timeline') || endpoint?.params?.request_url?.includes('bx_timeline') || endpoint.unit == "notifications")
        return 'w-full';

    if (endpoint?.module == 'bx_groups' || endpoint?.request_url?.includes('r=bx_groups'))
        return 'w-full @sm/list:w-1/2 @md/list:w-1/3 @lg/list:w-1/4 p-1.5';

    if (endpoint?.module == 'bx_videos')
        return 'w-full @sm/list:w-1/2 @lg/list:w-1/3 @xl/list:w-1/4 px-3 pt-3 @sm/list:p-2  ';

    if (endpoint?.module == 'bx_persons')
        return 'w-full @sm/list:w-1/3 @md/list:w-1/4 @lg/list:w-1/5 @xl/list:w-1/6 @sm/list:p-2 @md/list:p-2 mt-px @sm/list:m-0 ';

   
    return 'w-full @sm/list:w-1/2 @md/list:w-1/3 @lg/list:w-1/4 @xl/list:w-1/5 @sm/list:p-2 mt-px @sm/list:m-0 ';
}

export function paddingForList(endpoint) {

    if (endpoint?.unit == "notifications")
        return ' bg-card sm:rounded-xl my-4';
    // Timeline and notifications use no padding (full width items)
    if (!endpoint || endpoint?.request_url?.includes('bx_timeline') || endpoint?.params?.request_url?.includes('bx_timeline'))
        return '';
    // Groups and grid layouts get padding for better spacing
    if (endpoint?.module == 'bx_groups' || endpoint?.request_url?.includes('r=bx_groups'))
        return 'm-1.5 @md/list:m-1.5';

    // Default padding for grid-based content lists
    return ' @sm/list:m-1 @lg/list:m-2';
}


export function getSkeletonByEndPoint(currentRoute) {
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

export function getUnitMenuItems(unitType, data, handleClick, t, moduleName) {

    let oMenuItemPrimary = null;
    let oMenuItemSecondary = null;
    let oMenuItemDelete = null;

    const MenuItem = getComponent('menu-item', 'unit')

    if (data?.meta) {
        let sPrimary = "";
        let sSecondary = "";
        let sDelete = "";
        if (moduleName == 'bx_persons' || moduleName == 'bx_organizations' || moduleName == 'system') {
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
        else {
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

        if (!oMenuItemPrimary && oMenuItemSecondary) {
            oMenuItemPrimary = oMenuItemSecondary;
            oMenuItemSecondary = null;
        }

        if (!oMenuItemPrimary) {
            oMenuItemPrimary = {
                title: "View",
                onPress: (event) => handleClick(event, data.url),
            };
        }

        if (oMenuItemPrimary) {
            oMenuItemPrimary = <MenuItem menuItem={oMenuItemPrimary} isPrimary={true}/>;
        }
        oMenuItemSecondary = oMenuItemSecondary
            ? <MenuItem menuItem={oMenuItemSecondary} isPrimary={false}/>
            : null;
        if (oMenuItemDelete) {
            oMenuItemDelete = {
                ...oMenuItemDelete,

                data: { ...oMenuItemDelete.data, title: '', params: { ...oMenuItemDelete.data.params, button_full_width: false, button_rounded: true, only_icon: true } }
            };
            oMenuItemDelete = <MenuItem menuItem={oMenuItemDelete} isPrimary={false}/>
        }
    }

    return {
        oMenuItemPrimary,
        oMenuItemSecondary,
        oMenuItemDelete
    };
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
