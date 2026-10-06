import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher'
import { updateRouteDataForConnection, appSetting } from 'app/lib/util'
import { normalizeTiers, responsiveClasses } from 'app/lib/responsive-classes'
import { FLUSH_LIST_MODULES } from 'app/components/units/flush-list'
import { components } from 'app/components/registry';
import { settingsLayout } from 'app/settings/layout'
import i18n from 'i18next'

export function ProfileDisplayName(title) {
    return title;
}

export function CaptionForFileInput(props) {
    return 'Drag & Drop or browse files...';
}

export function ParseHtmlClasses(className, tag) {
    return className;
}

export function getFriendsCounter(currentUser) {
    return currentUser?.counters?.bx_persons_friend_requests
}

export function getModalPostTitle(authorData, t) {
    
    return !!authorData?.content?.[0]?.data?.author_data?.display_name ? `${authorData?.content?.[0]?.data?.author_data?.display_name}'s ${t('item_' + authorData?.module)}` : ' '
}

export function layoutForList(endpoint, unitMode = '') {
    const moduleName = typeof endpoint === 'string' ? endpoint : endpoint?.module;
    const requestUrl = typeof endpoint === 'string' ? endpoint : endpoint?.request_url;
    const paramsRequestUrl = endpoint?.params?.request_url;
    const unitName = typeof endpoint === 'string' ? '' : endpoint?.unit;

    if (unitMode == 'search'){
        if (moduleName == 'bx_timeline' || requestUrl?.includes('_cmts')){
             return 'w-full @list-lg/list:w-1/2 ';
        }
    }
    if (!endpoint || requestUrl?.includes('bx_timeline') || paramsRequestUrl?.includes('bx_timeline') || unitName == "notifications")
        return 'w-full';

    if (moduleName == 'bx_forum' || requestUrl?.includes('r=bx_forum'))
         return 'w-full mb-0.5 sm:mb-0 @list-sm/list:p-2 @list-sm/list:m-0';

    if (moduleName == 'bx_groups' || requestUrl?.includes('r=bx_groups'))
        return 'w-full @list-sm/list:w-1/2 @list-md/list:w-1/3 @list-lg/list:w-1/4 p-1.5';

    if (moduleName == 'bx_videos')
        return 'w-full @list-sm/list:w-1/2 @list-lg/list:w-1/3 @list-xl/list:w-1/4 px-3 pt-3 @list-sm/list:p-2  ';
    
    if (moduleName == 'bx_posts')
        return ' w-full px-3 pt-3  @list-sm/list:w-1/2 @list-md/list:w-1/3 @list-lg/list:w-1/4  @list-xl/list:w-1/5 @list-sm/list:p-2 @list-sm/list:m-0 ';

    if (moduleName == 'bx_persons')
        return 'w-full @list-sm/list:w-1/2 @list-md/list:w-1/3 @list-lg/list:w-1/4  @list-xl/list:w-1/5 @list-sm/list:p-2 @list-md/list:p-2 @list-sm/list:m-0 ';

   
    return 'w-full @list-sm/list:w-1/2 @list-md/list:w-1/3 @list-lg/list:w-1/4 @list-xl/list:w-1/4 @list-sm/list:p-2 @list-md/list:p-2 ';
}

/**
 * Card chrome for a browse list, from its block's App config in UNA, e.g.
 * {"designbox": {"bg": ["tablet", "desktop"]}}: the theme's block background,
 * radius (`rounded` tiers) and space around the card, on the tiers listed.
 * Web only: a native list scrolls under the overlaid page header and pads for
 * it inside, so a card on its content would reach up under the header.
 */
function listCardClasses(designbox) {
    if (Platform.OS !== 'web') return '';
    const bg = normalizeTiers(designbox?.bg);
    if (!bg) return '';
    const rounded = responsiveClasses('rounded', designbox?.rounded);
    if (bg === true) return [appSetting('theme', 'blocks', 'u-block-bg'), rounded, 'my-4'].join(' ');
    return [responsiveClasses('bg', bg), rounded, responsiveClasses('card-my', bg)].join(' ');
}

export function paddingForList(endpoint) {
    const card = listCardClasses(endpoint?.designbox);

    // Timeline uses no padding (full width items)
    if (!endpoint || endpoint?.request_url?.includes('bx_timeline') || endpoint?.params?.request_url?.includes('bx_timeline'))
        return card;
    // Notification rows: on phones edge-to-edge card rows, each 1px below the
    // one above (the first below the header band). From sm they inset themselves 8px on the sides and sit 2px apart:
    // 6px more at the top and bottom puts the first and last rows 8px from the
    // list's edges too (below the subtabs, and inside the card where it shows).
    if (endpoint?.unit == "notifications")
        return ['sm:py-1.5', card].join(' ').trim();
    // Groups and grid layouts get padding for better spacing
    if (endpoint?.module == 'bx_groups' || endpoint?.request_url?.includes('r=bx_groups'))
        return ['m-1.5 @list-md/list:m-1.5', card].join(' ').trim();
    // Profile lists run flush rows on mobile: edge-to-edge card rows, each 1px
    // below the one above, like the Notifications and Messages rows. The
    // sm+ grid spaces its cards (`padding_content`: container queries from
    // list-sm, 40rem, so never on a phone).
    if (FLUSH_LIST_MODULES.has(endpoint?.module))
        return [settingsLayout.layout.padding_content, card].join(' ').trim();

    // Default padding for grid-based content lists
    return [settingsLayout.layout.padding_content, card].join(' ').trim();
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

export function checkActionsOnConnectionsChanged(oData) {
    return {update_user:true, reload_page:true};
}

export function getUnitMenuItems(unitType, data, handleClick, t, moduleName) {

    let primaryMenuItem = null;
    let secondaryMenuItem = null;
    let deleteMenuItem = null;

    const MenuItem = components['menu-item']['unit']

    if (data?.meta) {
        let sPrimary = "";
        let sSecondary = "";
        let sDelete = "";
        if (moduleName == 'bx_persons' || moduleName == 'bx_organizations' || moduleName == 'system') {
            switch (unitType) {
                case "person_friends":
                    primaryMenuItem = {
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

        if (!primaryMenuItem) {
            primaryMenuItem = data.meta.items.find(item => item.name === sPrimary);
        }

        if (!secondaryMenuItem) {
            secondaryMenuItem = data.meta.items.find(item => item.name === sSecondary);
        }

        if (!deleteMenuItem) {
            deleteMenuItem = data.meta.items.find(item => item.name === sDelete);
        }

        if (!primaryMenuItem && secondaryMenuItem) {
            primaryMenuItem = secondaryMenuItem;
            secondaryMenuItem = null;
        }

        if (!primaryMenuItem) {
            primaryMenuItem = {
                title: i18n.t('View'),
                onPress: (event) => handleClick(event, data.url),
            };
        }

        if (primaryMenuItem) {
            primaryMenuItem = <MenuItem menuItem={primaryMenuItem} isPrimary={true}/>;
        }
        secondaryMenuItem = secondaryMenuItem
            ? <MenuItem menuItem={secondaryMenuItem} isPrimary={false}/>
            : null;
        if (deleteMenuItem) {
            deleteMenuItem = {
                ...deleteMenuItem,

                data: {
                    ...deleteMenuItem.data,
                    title: '',
                    params: {
                        ...deleteMenuItem.data.params,
                        button_full_width: false,
                        button_rounded: true,
                        only_icon: true,
                        button_style: 'glass',
                        button_border_shape: 'circle',
                        button_size: 'small',
                    },
                },
            };
            deleteMenuItem = <MenuItem menuItem={deleteMenuItem} isPrimary={false}/>
        }
    }

    return {
        primaryMenuItem,
        secondaryMenuItem,
        deleteMenuItem
    };
}

