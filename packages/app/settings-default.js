import { env } from 'app/lib/env'
import Tooltip from './ui/atoms/tooltip.web'

export const settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        app_origin: env('APP_ORIGIN'),

        native_app_images_url: 'https://neo.so',

        debug: true,
        use_proxy_web: true,
        use_proxy_native: false,
        sockets: {
            host: 'ci.una.io',
            port: '443',
            key: 'app-key',
        },
        api_keys: {
            google_maps: 'AIzaSyAhrci201-9xXIRAy0kLOHFGppeTk8AHmo',
            open_ai: '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',
            onesignal: 'a36d17c1-693e-40e1-98e9-41a62a9b5e7d',
        },
    },
    layout: {
        native_enable_screens: true,
        native_lazy_tabs: false,
        format_list: ['hor', 'ver', 'mixed'],
        format: 'hor', //hor, ver, mixed
        format_guest: 'hor', //hor, ver, mixed
        max_width: ' full ', // consider for hor = max-w-screen-2xl, for ver = max-w-screen-xl
        max_width_block: 'max-w-screen-xl', // for hor = max-w-screen-xl, for ver = max-w-screen-lg
        use_background: false,
        cover_aspect: 'aspect-3/1',
        cell_gap: 4,
        cell_style: '',
        show_user_icon: false,
        search: true,
        messenger: '/messenger',
        notifications: '/notifications-view',
        dashboard: '/dashboard',
        apps: true,
        block: 'login',
        show_profile_info: true,
        allow_switch_profile: true,
        switch_lang: ['ru', 'en'],
        switch_theme: true,
        background_image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_image_dark: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_cover_color: '',
        background_native: false,
        hide_header_for_non_logged: false,
        hide_header_for_all: false,
        profile_colors: [
            'orange',
            'yellow',
            'green',
            'teal',
            'sky',
            'indigo',
            'purple',
            'pink',
            'rose',
            'red',
        ],
        async_workers: ['CounterChecker'], //['EventChecker'],//NotifChecker
        async_workers_interval: 10,
        bluetooth: false,
        bluetooth_device_name_prefix: 'NEO',
        use_custom_font: false,//'font-main'
        lock_unconfirmed: true,
        entity_info_icon: 'Info',
        disable_screenshots: false,
        redirect_on_forbidden: '/home',
        split_action_menu: false,
        show_login_modal: 5000,
        extended_search: true,
        show_in_reply_comments: true,
        show_nav_counters: true,
        allow_edit_covers: true,
        allow_create_new_profile: true,
        form_fields_optional_text1: '',
        form_fields_mandatory_icon: 'Asterisk',
        form_without_captions: [
            'sys_login',
            'sys_account_create',
            'sys_forgot_password',
            'bx_invites_request_send',
        ],
        form_visibility_control_names: [
            '*_allow_view_to',
            '*_object_privacy_view',
        ],
        form_selector_control_names: ['*_cat'],
        card_animation_duration: 0,
        comments_mentions: true,
        carousel_image_width: '',
        carousel_image_aspect: 'aspect-square',
        show_navigation_non_logged_native: false,
        hide_comments_sort: false,
        comments_in_modal: true,
        comments_count_in_feed: 3,
        add_notifications_count_in_title: true,
        show_nav_non_logged_native: true,
        show_back_button_in_messenger: false,
        button_style_for_actions: 'secondary',
        cover_mode: {
            bx_courses: 'min'
        },
        hide_browse_filter: true,
        use_youtube_player: true,
        hide_edit_covers: false,
        share_text: '',
        fixed_cover: false,
        tooltips: true
    },
    forms: {
        sys_login: { hide_errors: true, button_full_width: true },
        sys_account_create: {
            hide_errors: true,
            button_full_width: true,
            button_hide_on_small: true,
        },
        sys_forgot_password: {
            hide_errors: true,
            button_full_width: true,
            button_hide_on_small: true,
        },
        bx_invites_request_send: {
            hide_errors: true,
            button_full_width: true,
            button_hide_on_small: true,
        },
    },
    jitsi: {
        prefix: 'prefix_',
        domain: 'https://meet.jit.si/',
    },
    urls: {
        embeds: '/oembed.php?html=1&a=get_link&l=',
        embeds_new: 'system/get_url_info/TemplServicePages&params[]=',
        cmts: 'system/get_data_api/TemplCmtsServices',
        feed_item: 'bx_timeline/get/&params[]=',
    },
    cache: {
        list: true,
        compress: true,
        items_lifetime: 30,
    },
    feed: {
        show_selector_view: false,
        default_view: '',
        show_html: false,
        default_feed: 'foryou',
        list: [
            {
                name: 'foryou',
                icon: 'Sparkle',
                title: 'For you',
                showTitle: true,
            },
         /*   {
                name: 'account',
                icon: 'Binoculars',
                title: 'Following',
                showTitle: true,
            },
            { name: 'hot', icon: 'Fire', title: 'Hot', showTitle: true },
            { name: 'public', icon: 'Egg', title: 'Public', showTitle: true },
            { name: 'channels', icon: 'Hash', title: 'News', showTitle: true },*/
        ],
        actions_menu: {
            show_action: true,// show action part or not
            show_counter: false,// show counter part or not
            show_combined: true, // leave true
            button_show_title_from_size: 'sm',
            button_full_width: true, 
            button_size: 'sm',
            button_variant: 'text',
            button_rounded: false,
            no_gap_between_buttons: false,// is false no gap between buttons + right margin, is true  gap between buttons + no margin
        },
        counters_menu: {
            show_action: false,
            show_counter: true,
            show_combined: true,
            button_variant: 'link',
            button_size: 'xs',
            no_gap_between_buttons: false,
         
        }
        /*
        FOR COMBINED BUTTONS SHOULD BE SET IN THE FOLLOWING WAY:
        , actions_menu : {
            show_action: true,
            show_counter: true,
            show_combined: true,
            }

        */
    },
    entry: {
        default_view: '',
    },
    suggestion: {
        list: [
            /*  {
                name: 'friends',
                request_url:
                    '/api.php?r=system/browse_recommendations_friends/TemplServiceProfiles&params[]={user_id}&params[]=',
                title: 'Recommended friends',
                unitType: 'person_friends_suggestion',
                perLine: 3,
            },
            {
                name: 'groups',
                request_url:
                    '/api.php?r=bx_groups/browse_recommendations_fans&params[]={user_id}',
                title: 'Recommended groups',
                unitType: 'person_friends_recommendations',
                perLine: 3,
            },*/
        ],
    },
    browse: {
        per_line: [
            { width: 1280, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
        ],
        per_line_profile: [
            { width: 1440, count: 5 },
            { width: 768, count: 4 },
            { width: 640, count: 3 },
        ],
        per_line_left_side_bar: [
            { width: 1280, count: 4 },
            { width: 1024, count: 3 },
            { width: 768, count: 4 },
            { width: 640, count: 3 },
        ],
        per_line_bx_courses: [
            { width: 1280, count: 3 },
            { width: 1024, count: 2 },
            { width: 768, count: 1 },
            { width: 640, count: 1 },
        ],
    },
    social_actions: {
        like: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        star: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: false,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        reaction: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_style: 'compound', //'compound' or 'divided'
            show_counter_as_button: false,
            haptics_type: 'Medium',
            icon_type_web: 'emoji', //'svg' or 'emoji'
            icon_type_native: 'emoji', //'emoji' only
            items: [
                { id: 1, name: 'like' },
                { id: 2, name: 'love' },
                { id: 3, name: 'joy' },
                { id: 4, name: 'surprise' },
                { id: 5, name: 'sadness' },
                { id: 6, name: 'anger' },
            ],
            haptics_type: 'Medium',
        },
        score: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: false,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        comment: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        report: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        repost: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: false,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        share: {
            show_action: true,
            show_action_as_button: false,
            show_action_label: true,
            haptics_type: 'Medium',
        },
        connection: {
            show_action_as_button: true,
            sys_profiles_friends: {
                icons: { add: 'UserCirclePlus', remove: 'UserCircleMinus' },
            },
            bx_events_fans: {
                icons: { add: 'SignIn', remove: 'SignOut' },
            },
            bx_groups_fans: {
                icons: { add: 'SignIn', remove: 'SignOut' },
            },
        },
        recommendation: {
            show_action_as_button: true,
        },
        feature: {
            show_action_as_button: true,
        },
    },
    menu_meta: {
        unit_by_source: {
            'system/browse_friends': 'person_friends',
            'system/browse_recommendations_friends':
                'person_friends_recommendations',
            'system/browse_friend_requested': 'person_friend_requested',
            'system/browse_friend_requests': 'browse_friend_requests',
            'system/browse_recommendations_subscriptions':
                'person_following_recommendations',
            'system/browse_subscribed_me': 'person_followers',
            browse_subscriptions: 'person_following',
            'r=bx_events': 'event',
            'r=bx_groups': 'group',
            'r=bx_timeline': 'feed',
        },
    },
    menu_items: {
        iconset: {
            'profile-check-in': 'Check',
            'edit-event-questionnaire': 'List',
            'edit-event-sessions': 'Calendar',
            'item-comment': 'ChatTeardropDots',
            'item-share': 'ShareFat',
            edit: 'Pencil',
            delete: 'Trash',
            messenger: 'ChatTeardropDots',
            'profile-confirm': 'Check',
            'profile-set-acl-level': 'UserList',
            'profile-set-badges': 'SealCheck',
        },
        menu_navbar: [
            { name: 'home', title: 'Home', link: '/', icon: 'House' },
            {
                name: 'friends',
                title: 'Friends',
                link: '/friends',
                icon: 'Users',
                nonlogged: false,
            },
            {
                name: 'posts-home',
                title: 'Posts',
                link: '/posts-home',
                icon: 'ChatCenteredText',
            },
            {
                name: 'groups-home',
                title: 'Groups',
                link: '/groups-home',
                icon: 'UsersThree',
            },
            {
                name: 'spaces-home',
                title: 'Spaces',
                link: '/spaces-home',
                icon: 'IntersectSquare',
            },
            {
                name: 'events-home',
                title: 'Events',
                link: '/events-home',
                icon: 'Calendar',
            },
            {
                name: 'products-home',
                title: 'Market',
                link: '/products-home',
                icon: 'Storefront',
            },
        ],
        menu_drawer: [
            /* { name: 'home', title: 'Home', link: '/', icon: 'House'},
            { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
            { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront' }, 
            { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour' }, 
            { name: 'discussion-home', title: 'Discussions', link: '/discussions-home', icon: 'Chats' }, 
            { name: 'Logout',title: 'Sign out', link: '/logout', icon: 'SignOut', nonlogged: false},*/
        ],
        menu_launcher: [
            {
                name: 'friends',
                title: 'Friends',
                link: '/friends',
                icon: 'Users',
                nonlogged: false,
            },
            {
                name: 'posts-home',
                title: 'Posts',
                link: '/posts-home',
                icon: 'ChatCenteredText',
            },
            {
                name: 'discussion-home',
                title: 'Discussions',
                link: '/discussions-home',
                icon: 'Chats',
            },
            {
                name: 'groups-home',
                title: 'Groups',
                link: '/groups-home',
                icon: 'UsersThree',
            },
            {
                name: 'spaces-home',
                title: 'Spaces',
                link: '/spaces-home',
                icon: 'IntersectSquare',
            },
            {
                name: 'events-home',
                title: 'Events',
                link: '/events-home',
                icon: 'Calendar',
            },
            {
                name: 'products-home',
                title: 'Market',
                link: '/products-home',
                icon: 'Storefront',
            },
            {
                name: 'persons-home',
                title: 'People',
                link: '/persons-home',
                icon: 'UsersFour',
            },
            {
                name: 'organizations-home',
                title: 'Organizations',
                link: '/organizations-home',
                icon: 'CirclesThree',
            },
            {
                name: 'ads-home',
                title: 'Ads',
                link: '/ads-home',
                icon: 'Megaphone',
            },
            {
                name: 'channels-home',
                title: 'Channels',
                link: '/channels-home',
                icon: 'Hash',
            },
        ],
        menu_add: [
            {
                name: 'create-post',
                title: 'Add post',
                link: '/create-post',
                icon: 'ChatCenteredText',
                nonoperator: false,
            },
            {
                name: 'create-group-profile',
                title: 'Add group',
                link: '/create-group-profile',
                icon: 'UsersThree',
                membership_level: 8,
            },
            {
                name: 'create-space-profile',
                title: 'Add space',
                link: '/create-space-profile',
                icon: 'IntersectSquare',
            },
            {
                name: 'create-event-profile',
                title: 'Add event',
                link: '/create-event-profile',
                icon: 'Calendar',
            },
            {
                name: 'create-discussion',
                title: 'Add discussion',
                link: '/create-discussion',
                icon: 'Chats',
            },
            {
                name: 'create-ad',
                title: 'Add ad',
                link: '/create-ad',
                icon: 'Megaphone',
            },
            {
                name: 'create-course-profile',
                title: 'Add course',
                link: '/create-course-profile',
                icon: 'Books',
            },
        ],
        menu_account: [
            {
                name: 'dashboard',
                title: 'Dashboard',
                link: '/dashboard',
                icon: 'SquaresFour',
            },
            {
                title: 'Studio',
                link: '{studio}',
                icon: 'MagicWand',
                nonoperator: false,
            },
            {
                name: 'payment-carts',
                title: 'Shopping Cart',
                link: '/payment-carts',
                icon: 'Wallet',
            },
            {
                name: 'settings',
                title: 'Settings',
                link: '/account-settings-email',
                icon: 'Gear',
            },
            {
                name: 'Logout',
                title: 'Sign out',
                link: '/logout',
                icon: 'SignOut',
            },
        ],
        menu_sidebar: [
            {
                title: 'Profile',
                link: '{profile}',
                icon: 'User',
                nonlogged: false,
            },
            {
                title: 'Notifications',
                link: '/notifications-view',
                icon: 'Bell',
                nonlogged: false,
            },
            {
                title: 'Messages',
                link: '/messenger',
                icon: 'ChatTeardropDots',
                nonlogged: false,
            },
            {
                title: 'Friends',
                link: '/friends',
                icon: 'Link',
                nonlogged: false,
            },
            { title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { title: 'Spaces', link: '/spaces-home', icon: 'IntersectSquare' },
            { title: 'Events', link: '/events-home', icon: 'CalendarCheck' },
            { title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' },
            { title: 'Discussions', link: '/discussions-home', icon: 'Chats' },
            { title: 'Courses', link: '/courses-home', icon: 'Books' },
            { title: 'People', link: '/persons-home', icon: 'UsersFour' },
            { title: 'About', link: '/about', icon: 'Info' },
            { title: 'Terms', link: '/terms', icon: 'Question' },
            { title: 'Contact', link: '/contact', icon: 'AddressBook' },
        ],
        menu_dashboard: [
            {
                key: 'friends',
                title: 'Friends',
                icon: 'UsersFour',
                link: '/friends',
            },
            {
                key: 'followers',
                title: 'Followers',
                icon: 'UsersFour',
                link: '/followers',
            },
            {
                key: 'bx_posts',
                title: 'Posts',
                icon: 'ChatCenteredText',
                link: '/posts-home',
                link2: '/create-post',
                action: 'score',
                action_icon: 'ThumbsUp',
            },
            {
                key: 'bx_forum',
                title: 'Discussions',
                icon: 'Chats',
                link: '/discussions-home',
                link2: '/create-discussion',
                action: 'views',
                action_icon: 'ChartBar',
            },
            {
                key: 'bx_groups',
                title: 'Groups',
                icon: 'UsersThree',
                link: '/groups-home',
                link2: '/create-group-profile',
                action: 'members',
                action_icon: 'UsersFour',
            },
            {
                key: 'bx_spaces',
                title: 'Spaces',
                icon: 'IntersectSquare',
                link: '/spaces-home',
                link2: '/create-space-profile',
                action: 'members',
                action_icon: 'UsersFour',
            },
            {
                key: 'bx_events',
                title: 'Events',
                icon: 'CalendarCheck',
                link: '/events-home',
                link2: '/create-event-profile',
                action: 'members',
                action_icon: 'UsersFour',
            },
        ],
        menu_dashboard_manage: [
            {
                key: 'bx_events',
                title: 'Events',
                icon: 'CalendarCheck',
                link: '/events-administration',
            },
            {
                key: 'bx_timeline',
                title: 'Timeline',
                icon: 'CalendarCheck',
                link: '/timeline-administration',
            },
            {
                key: 'bx_posts',
                title: 'Posts',
                icon: 'ChatCenteredText',
                link: '/posts-administration',
            },
            {
                key: 'bx_groups',
                title: 'Groups',
                icon: 'UsersThree',
                link: '/groups-administration',
            },
            {
                key: 'bx_spaces',
                title: 'Spaces',
                icon: 'IntersectSquare',
                link: '/spaces-administration',
            },
            {
                key: 'bx_persons',
                title: 'Persons',
                icon: 'Users',
                link: '/persons-administration',
            },
            {
                key: 'bx_ads',
                title: 'Ads',
                icon: 'Megaphone',
                link: '/ads-administration',
            },
        ],
        menu_tabbar_logged: [
            {
                key: '/tab0',
                title: 'Home',
                url: '/home',
                icon: 'House',
            },
            {
                key: '/tab1',
                title: 'Messages',
                url: '/messenger',
                icon: 'ChatTeardropDots',
            },
            {
                key: '/tab2',
                title: 'Friends',
                url: '/friends',
                icon: 'Users',
            },
            {
                key: '/tab3',
                title: 'Notifications',
                url: '/notifications-view',
                icon: 'Bell',
            },
            {
                key: '/tab4',
                title: 'Menu',
                url: '/dashboard',
                icon: 'UserList',
            },
        ],
        menu_tabbar_non_logged: [
            {
                key: '/tab0',
                title: 'Home',
                url: '/home',
                icon: 'House',
            },
            {
                key: '/tab1',
                title: 'Posts',
                url: '/posts-home',
                icon: 'ChatCenteredText',
            },
            {
                key: '/tab2',
                title: 'About',
                url: '/about',
                icon: 'Info',
            },
            {
                key: '/tab3',
                title: 'Terms',
                url: '/terms',
                icon: 'List',
            },
            {
                key: '/tab4',
                title: 'Privacy',
                url: '/privacy',
                icon: 'EyeSlash',
            },
        ],
        profile_menu: [
            'view-persons-profile',
            'persons-profile-friends',
            'posts-author',
            'posts-home',
        ],
        comments_manage_menu: ['item-edit', 'item-delete'],
        bx_posts_submenu: {
            name: 'Posts',
            icon: 'File',
            items: [
                { name: 'posts-home', icon: 'ChatCenteredText' },
                { name: 'posts-popular', icon: 'Fire' },
            ],
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-post',
                    nonlogged: false,
                },
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_posts',
                },
            ],
        },
        bx_ads_submenu: {
            name: 'Ads',
            icon: 'File',
            items: [
                { name: 'ads-home', icon: 'Storefront' },
                { name: 'ads-popular', icon: 'Fire' },
                { name: 'ads-manage', icon: 'Fire' },
                { name: 'ads-administration', icon: 'Fire' },
                { name: 'ads-sources', icon: 'Fire' },
            ],
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-ad',
                    nonlogged: false,
                },
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_ads',
                },
            ],
        },
        bx_market_submenu: {
            name: 'Market',
            icon: 'Storefront',
            items: [
                { name: 'products-home', icon: 'Storefront' },
                { name: 'products-popular', icon: 'Fire' },
                { name: 'products-categories', icon: 'Folders' },
                { name: 'products-category', icon: 'Folders' },
            ],
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-product',
                    nonlogged: false,
                },
            ],
        },
        bx_persons_submenu: {
            name: 'People',
            icon: 'UsersFour',
            items: [
                { name: 'persons-home', icon: 'UsersFour' },
                { name: 'persons-active', icon: 'UsersFour' },
            ],
            add: [
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_persons',
                },
            ],
        },
        bx_payment_menu_cart_submenu: {
            name: 'Shopping Carts',
            icon: 'Wallet',
            items: ['payment-carts', 'payment-history'],
            add: [],
        },
        bx_organizations_submenu: {
            name: 'Organizations',
            icon: 'CirclesThree',
            items: [
                { name: 'organizations-home', icon: 'CirclesThree' },
                { name: 'organizations-active', icon: 'CirclesThree' },
            ],
            add: [
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_organizations',
                },
            ],
        },
        bx_events_submenu: {
            name: 'Events',
            icon: 'Calendar',
            items: [
                { name: 'events-home', icon: 'Calendar' },
                { name: 'events-top', icon: 'CalendarCheck' },
                { name: 'events-joined', icon: 'LinkSimple' },
                { name: 'events-search', icon: 'MagnifyingGlass' },
                { name: 'events-upcoming', icon: 'LinkSimple' },
                { name: 'events-followed', icon: 'Binoculars' },
            ],
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-event-profile',
                    nonlogged: false,
                },
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_events',
                },
            ],
        },
        sys_con_submenu: {
            name: 'Connections',
            icon: 'UsersFour',
            items: [
                { name: 'friends', icon: 'UserList' },
                { name: 'friend-suggestions', icon: 'UserCircle' },
                { name: 'friend-requests', icon: 'UserCirclePlus' },
                { name: 'sent-friend-requests', icon: 'UserCircleGear' },
                { name: 'follow-suggestions', icon: 'UserFocus' },
                { name: 'followers', icon: 'UsersFour' },
                { name: 'following', icon: 'UserSquare' },
            ],
            add: [
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_persons',
                },
            ],
        },
        sys_account_settings_submenu: {
            name: 'Settings',
            icon: 'Gear',
            items: [
                { name: 'account-settings-password', icon: 'Gear' },
                { name: 'account-settings-email', icon: 'Gear' },
                { name: 'account-settings-info', icon: 'Gear' },
                { name: 'account-settings-delete', icon: 'Gear' },
                { name: 'notifications-settings', icon: 'Gear' },
            ],
        },
        bx_groups_submenu: {
            name: 'Groups',
            icon: 'UsersThree',
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-group-profile',
                    nonlogged: false,
                },
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_groups',
                },
            ],
        },
        bx_spaces_submenu: {
            name: 'Spaces',
            icon: 'IntersectSquare',
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-space-profile',
                    nonlogged: false,
                },
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_spaces',
                },
            ],
        },
        sys_account_dashboard: {
            name: 'Dashboard',
            icon: 'UsersThree',
        },
        bx_forum_submenu: {
            name: 'Discussions',
            icon: 'comments',
            items: [
                { name: 'discussions-home', icon: 'Chats' },
                { name: 'discussions-popular', icon: 'Fire' },
                { name: 'discussions-categories', icon: 'Folders' },
                { name: 'discussions-category', icon: 'Folders' },
            ],
            add: [
                {
                    icon: 'Plus',
                    name: 'Add',
                    link: '/create-discussion',
                    nonlogged: false,
                },
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_forum',
                },
            ],
        },
        bx_channels_submenu: {
            name: 'Channels',
            icon: 'Hash',
            items: ['channels-home', 'channels-top'],
            add: [
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: '',
                    section: 'bx_channels',
                },
                { icon: 'DotsThreeOutline', name: 'More' },
            ],
        },
    },
    layouts: {
        messenger: {
            layout: 'messenger',
            blocks: {
                main: {
                    name: 'bx_messenger:get_main_messenger_page',
                    showTitle: false,
                },
            },
            headerSettings: { backButton: false, offset: false },
        },
        login: {
            layout: 'login',
            blocks: {
                form: {
                    name: 'system:login_form',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: true,
                backButton: false,
                menu: true,
                title: true,
            },
        },
        'create-account': {
            layout: 'create-account',
            blocks: {
                form_join: {
                    name: 'system:create_account_form',
                    showTitle: false,
                    showBg: false,
                },
                form_invitation: {
                    name: 'bx_invites:get_block_form_request',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: true,
                backButton: false,
                menu: true,
                title: true,
            },
        },
        /*  dashboard: {
            layout: 'navigator',
            top:true,
            blocks: {
                stat_block: { name: 'system:get_stat_block', showTitle: false, showBg: false },
            },
            headerSettings: { header: true, backButton: false, menu: true, title: true },
        },*/
        'search-keyword': {
            layout: 'navigator_search',
            blocks: {
                browse: {
                    name: 'system:search_keyword_result',
                    showTitle: false,
                    perLine: 4,
                    showBg: false,
                },
            },
            icon: 'MagnifyingGlass',
            headerSettings: { backButton: false, header: true, menu: true },
        },
        home: {
            layout: 'home',
            top: true,
            blocks: {
                public_feed_form: {
                    name: 'bx_timeline:get_block_post_home',
                    showTitle: false,
                    showBg: false,
                },
                public_feed: {
                    name: 'bx_timeline:get_block_view_home',
                    showTitle: false,
                    showBg: false,
                },

                foryou_feed_form: {
                    name: 'bx_timeline:get_block_post_account',
                    showTitle: false,
                    showBg: false,
                },
                foryou_feed: {
                    name: 'bx_timeline:get_block_view_feed_and_hot',
                    showTitle: false,
                    showBg: false,
                },

                account_feed_form: {
                    name: 'bx_timeline:get_block_post_account',
                    showTitle: false,
                    showBg: false,
                },
                account_feed: {
                    name: 'bx_timeline:get_block_view_account',
                    showTitle: false,
                    showBg: false,
                },

                hot_feed: {
                    name: 'bx_timeline:get_block_view_hot',
                    showTitle: false,
                    showBg: false,
                },

                channels_feed: {
                    name: 'bx_timeline:get_block_view_channels',
                    showTitle: false,
                    showBg: false,
                },

                login: {
                    name: 'system:login_form',
                    showTitle: false,
                    showBg: false,
                },
                signup: {
                    name: 'system:create_account_form',
                    showTitle: false,
                    showBg: false,
                },

                home_intro: {
                    name: 'static:home_intro',
                    showTitle: false,
                    showBg: false,
                },
                home_footer: {
                    name: 'static:home_footer',
                    showTitle: false,
                    showBg: false,
                },

                menu: {
                    name: 'system:profile_menu',
                    showTitle: false,
                    showBg: false,
                    leftbar: true,
                },

                intro: {
                    name: 'static:intro',
                    showTitle: false,
                    showBg: false,
                    sidebar: true,
                },
                friends: {
                    name: 'system:browse_recommendations_friends',
                    showTitle: false,
                    showBg: false,
                    sidebar: true,
                    props: {
                        no_scroll: true,
                        skeleton: 'one_column_browse',
                        perLine: 1,
                        showTitleInside: true,
                    },
                },
                messenger_contacts: {
                    name: 'bx_messenger:get_block_contacts_messenger',
                    showTitle: false,
                    showBg: false,
                    sidebar: true,
                    props: {
                        no_scroll: true,
                        only_one_page: true,
                        skeleton: 'one_column_browse',
                        perLine: 1,
                        showTitleInside: true,
                    },
                },
                subscriptions: {
                    name: 'system:browse_recommendations_subscriptions',
                    showTitle: false,
                    showBg: false,
                    sidebar: true,
                    props: {
                        no_scroll: true,
                        skeleton: 'one_column_browse',
                        perLine: 1,
                        showTitleInside: true,
                    },
                },
                footer: {
                    name: 'static:footer',
                    showTitle: false,
                    showBg: false,
                    sidebar: true,
                },
            },
            header: [
                {
                    icon: 'MagnifyingGlass',
                    name: 'Search',
                    link: 'search',
                    nonlogged: false,
                },
            ],
            headerSettings: {
                header: true,
                backButton: false,
                menu: true,
                title: false,
            },
        },

        //############ EVENTS PAGES ############
        'events-home': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_events:browse_recent_profiles',
                    showTitle: false,
                    showBg: false,
                },
            },
        },
        'events-top': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_events:browse_top_profiles',
                    showTitle: false,
                    showBg: false,
                },
            },
        },
        'events-joined': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_events:calendar',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
            },
        },
        'events-upcoming': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_events:calendar',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
            },
        },
        'events-calendar': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_events:calendar',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
            },
        },
        'events-followed': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_events:calendar',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
            },
        },
        'view-event-profile': {
            layout: 'profile',
            blocks: {
                col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                col5: {
                    name: 'bx_events:sessions',
                    showTitle: true,
                    showBg: true,
                    perLine: 1,
                    sidebar: true,
                    showPad: true,
                },
                col2: {
                    name: 'bx_events:entity_info',
                    showTitle: true,
                    showBg: true,
                    perLine: 1,
                    sidebar: true,
                    showPad: true,
                },
                col3: {
                    name: 'bx_events:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    perLine: 1,
                    sidebar: true,
                    showPad: true,
                },
                col4: {
                    name: 'system:locations_map',
                    showTitle: true,
                    showBg: true,
                    perLine: 1,
                    sidebar: true,
                    showPad: true,
                },
            },
            headerSettings: { offset: false, header: false },
        },

        //############ POSTS PAGES ############
        'view-post': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_posts:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_posts:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_posts:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_posts:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_posts:entity_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                backButton: true,
                title: false,
            },
        },
        item: {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_timeline:get_block_item_info',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_timeline:get_block_item',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_timeline:get_block_item_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },
        ['cmts-view']: {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'system:get_block_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'system:get_block_content',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'system:get_block_view',
                    showTitle: false,
                    showBg: false,
                    showHeader: false,
                },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },

        //############ COURCES PAGES ############
        'view-course-profile': {
            layout: 'profile', //profile-alt, profile
            blocks: {
               
                /*col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },*/
                col5: {
                    name: 'bx_courses:entity_structure_l1_block',
                    showTitle: false,
                    showBg: false,
                },
                col6: {
                    name: 'bx_courses:entity_structure_l2_block',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
               /* col2: {
                    name: 'bx_courses:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    sidebar: true,
                },
                col3: {
                    name: 'bx_courses:entity_info',
                    showTitle: false,
                    showBg: true,
                    sidebar: true,
                },
                col4: {
                    name: 'bx_courses:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },*/
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'course-profile-info': {
            layout: 'profile',
            blocks: {
                col1: {
                    name: 'bx_courses:entity_info_full',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    perLine: 1,
                },
                col2: {
                    name: 'bx_courses:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_persons:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'course-profile-friends': {
            layout: 'profile',
            blocks: {
                col2: {
                    name: 'system:connections_table',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_courses:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'course-profile-subscriptions': {
            layout: 'profile',
            blocks: {
                col2: {
                    name: 'system:subscribed_me_table',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_courses:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        //############ PHOTOS PAGES ############
        'view-photo': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_photos:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_photos:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_photos:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_photos:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_photos:entity_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                backButton: true,
                title: false,
            },
        },
        //############ PHOTOS PAGES ############
        'view-video': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_videos:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_videos:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_videos:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_videos:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_videos:entity_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                backButton: true,
                title: false,
            },
        },

        //############ PHOTOS PAGES ############
        'view-file': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_files:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_files:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_files:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_files:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_files:entity_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                backButton: true,
                title: false,
            },
        },

        //############ MARKET PAGES ############
        'products-home': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'system:get_results',
                    showTitle: false,
                    showBg: false,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
                col4: {
                    name: 'system:get_form',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: { hideLeftmenu: true },
        },
        'products-category': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_market:browse_category',
                    showTitle: false,
                    showBg: false,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
            },
        },
        'products-categories': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: false,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
                // col3: { name: 'system:keywords_cloud', showTitle: false, showBg: true, sidebar: true },
            },
        },
        'products-popular': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_market:browse_popular',
                    showTitle: false,
                    showBg: false,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
            },
        },
        'view-product': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_market:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_market:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_market:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_market:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_market:entity_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                title: false,
            },
        },
        //############ ADS PAGES ############
        'view-ad': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_ads:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_ads:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_ads:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_ads:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_ads:entity_reviews',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                title: false,
            },
        },

        //############ POSTS PAGES ############
        'posts-home': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_posts:browse_public',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                browse_sidebar: {
                    name: 'bx_posts:browse_featured',
                    showTitle: true,
                    showBg: false,
                    sidebar: true,
                    unitType: 'small',
                },
            },
        },

        'posts-popular': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_posts:browse_popular',
                    showTitle: false,
                    showBg: false,
                    unitType: 'small',
                },
            },
        },

        //############ DISCUSSIONS PAGES ############
        'discussions-home': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_forum:browse_new',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                browse_sidebar: {
                    name: 'bx_forum:browse_popular',
                    showTitle: true,
                    showBg: false,
                    sidebar: true,
                    unitType: 'small',
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
            },
        },
        'discussions-popular': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_forum:browse_popular',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
            },
        },
        'discussions-category': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_forum:browse_category',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                    skeleton: 'notifications',
                },
                browse_sidebar: {
                    name: 'bx_forum:browse_popular',
                    showTitle: true,
                    showBg: false,
                    sidebar: true,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
            },
        },
        'discussions-categories': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: false,
                },
                browse_sidebar: {
                    name: 'bx_forum:browse_popular',
                    showTitle: true,
                    showBg: false,
                    sidebar: true,
                },
                categories: {
                    name: 'system:categories_list',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                    hidden: true,
                },
            },
        },
        'view-discussion': {
            layout: 'post',
            top: true,
            blocks: {
                author: {
                    name: 'bx_forum:entity_author',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                    forHeader: true,
                },
                text: {
                    name: 'bx_forum:entity_text_block',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                attachments: {
                    name: 'bx_forum:entity_attachments',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                actions: {
                    name: 'bx_forum:entity_all_actions',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                'comments-empty': {
                    name: 'static:comments_empty',
                    showTitle: false,
                    showBg: false,
                    forList: true,
                },
                comments: {
                    name: 'bx_forum:entity_comments',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: {
                header: false,
                footer: false,
                offset: false,
                title: false,
            },
        },
        //############ GROUPS PAGES ############
        'view-group-profile': {
            layout: 'profile',
            blocks: {
                col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                col3: {
                    name: 'bx_posts:browse_public',
                    showTitle: false,
                    showBg: false,
                    showPad: true,
                    sidebar: true,
                },
                col2: {
                    name: 'bx_groups:entity_info',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    sidebar: true,
                },
                col4: {
                    name: 'bx_groups:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    sidebar: true,
                },
                col5: {
                    name: 'bx_invites:get_block_invite',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    sidebar: true,
                },
            },
            headerSettings: { offset: false, header: false, cover: 'group' },
        },
        //############ SPACES PAGES ############
        'view-space-profile': {
            layout: 'profile',
            blocks: {
                col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                col2: {
                    name: 'bx_spaces:entity_info',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    sidebar: true,
                },
                col4: {
                    name: 'bx_spaces:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    sidebar: true,
                },
                
            },
            headerSettings: { offset: false, header: false, cover: 'group' },
        },
        //############ CHANNELS PAGES ############
        'view-channel-profile': {
            layout: 'profile',
            blocks: {
                col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
            },
            headerSettings: { offset: false, header: false, cover: 'min' },
        },
        //############ PERSONS PAGES ############
        'view-persons-profile': {
            layout: 'profile', //profile-alt, profile
            blocks: {
                col5: {
                    name: 'system:block_1572',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: false,
                },
                col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                col2: {
                    name: 'bx_persons:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    sidebar: true,
                },
                col3: {
                    name: 'bx_persons:entity_info',
                    showTitle: false,
                    showBg: true,
                    sidebar: true,
                },
                col4: {
                    name: 'bx_persons:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'persons-profile-info': {
            layout: 'profile',
            blocks: {
                col1: {
                    name: 'bx_persons:entity_info_full',
                    showTitle: false,
                    showBg: true,
                    showPad: true,
                    perLine: 1,
                },
                col2: {
                    name: 'bx_persons:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_persons:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'persons-profile-friends': {
            layout: 'profile',
            blocks: {
                col2: {
                    name: 'system:connections_table',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_persons:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'persons-profile-subscriptions': {
            layout: 'profile',
            blocks: {
                col2: {
                    name: 'system:subscribed_me_table',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_persons:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        'persons-profile-subscriptions1': {
            layout: 'profile',
            blocks: {
                col2: {
                    name: 'system:subscriptions_table',
                    showTitle: false,
                    showBg: true,
                    sidebar: false,
                },
                col4: {
                    name: 'bx_persons:entity_cover',
                    showTitle: false,
                    showBg: false,
                    sidebar: false,
                    leftbar: true,
                },
            },
            headerSettings: {
                offset: false,
                header: false,
                cover: 'profile',
                hideLeftmenu: true,
                showAltTopMenu: true,
            },
        },
        //############ ORGS PAGES ############
        'view-organization-profile': {
            layout: 'profile',
            blocks: {
                col0: {
                    name: 'bx_timeline:get_block_post_profile',
                    showTitle: false,
                    showBg: false,
                },
                col1: {
                    name: 'bx_timeline:get_block_view_profile',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
                col2: {
                    name: 'bx_organizations:entity_info',
                    showTitle: false,
                    showBg: true,
                    sidebar: true,
                },
                col4: {
                    name: 'bx_organizations:entity_text_block',
                    showTitle: false,
                    showBg: true,
                    sidebar: true,
                },
            },
            headerSettings: { offset: false, header: false },
        },
        'notifications-view': {
            layout: 'notif',
            top: true,
            blocks: {
                browse: {
                    name: 'bx_notifications:get_block_view',
                    showTitle: false,
                    showBg: false,
                    perLine: 1,
                },
            },
            header: [{ icon: 'MagnifyingGlass', name: 'Search' }],
            headerSettings: { header: true, backButton: false, menu: true },
            icon: 'Bell',
        },
    },
    theme: {
        light: {
            primary: '#2563eb',
            barsBackground: 'rgba(255,255,255,1)',
            bottomSheetBackground: 'rgba(255,255,255,1)',
            barsColor: '#4B5563',
            selectBorder: 'rgba(156, 163, 175, 0.3)',
            fieldBackground: 'rgba(249, 240, 251, 1)',
            blockBorder: '#E5E7EB',
            tabsBackground: '#F3F4F6',
            activeTabBackground: '#DBEAFE',
            tabText: 'rgba(75,85,99,1)',
            activeTabText: 'rgba(3,7,18,1)',
            screenBackground: '#E5E7EB',
            bgrmodal: 'rgba(255,255,255,1)',
            bdrModal: 'rgba(229,231,235,1)',
            checkbox: '#2563eb',
        },
        dark: {
            default: '#D1D5DB', //fix for icons color in iOS
            primary: '#0ea5e9',
            barsBackground: 'rgba(0,0,0,1)',
            bottomSheetBackground: 'rgba(31,41,55,1)',
            barsColor: '#D1D5DB',
            selectBorder: 'rgba(55, 65, 81, 0.3)',
            fieldBackground: '#030712',
            blockBorder: '#030712',
            tabText: 'rgba(156,163,175,1)',
            activeTabText: 'rgba(249,250,251,1)',
            screenBackground: '#030407',
            bgrmodal: 'rgba(31,41,55,1)',
            bdrModal: 'rgba(55,65,81,0.4)',
            checkbox: '#0ea5e9',
        },
        conductor: {
            menu: ' w-full items-left justify-center border-b border-bdr dark:border-bdr-d',
            menu_max_width: ' max-w-6xl ',
            menu_is_dynamic: true,
            menu_cnt: ' ml-3 sm:ml-4 gap-x-1 flex-row '
        },
        dropdown_menu: {
            content_ver: ' z-10 min-w-[200px] shadow-xl backdrop-blur-xl bg-bgrmodal dark:bg-bgrmodal-d mt-1 p-1 text-sm rounded-xl shadow-xl overflow-hidden gap-y-1 ',
            content_hor: ' flex flex-row z-10 p-1 bg-bgrmodal border border-bdr dark:border-bdr-d m-2 backdrop-blur-xl dark:bg-bgrmodal-d text-sm text-neutral-800 dark:text-neutral-200 rounded-full shadow-sm',
            item_ver: 'flex flex-row focus:outline-none items-center px-3 py-2 gap-x-3 text-sm rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-neutral-700 dark:text-neutral-300 dark:hover:text-white hover:cursor-pointer',
            item_hor: 'flex block px-3 py-2 hover:-translate-y-1 active:-translate-y-1 dark:hover:text-white rounded-full hover:cursor-pointer text-neutral-700 active:opacity-50 hover:scale-125 active:scale-95 duration-200 dark:text-neutral-300',
            item_np: 'flex flex-row focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-300 dark:hover:text-white hover:cursor-pointer',
            item_cnt: 'items-center gap-x-3',
            item_text: 'text-sm font-medium text-neutral-700 dark:text-neutral-200',
            item_icon: 'text-2xl text-neutral-700 dark:text-neutral-300',

        },
        modal: {
            fog: 'bg-white/80 dark:bg-black/80 backdrop-blur',
            container: 'max-w-3xl {ls}:h-auto',
            content: 'bg-bgrmodal dark:bg-bgrmodal-d {ls}:h-auto  {ls}:border {ls}:border-bdrmodal {ls}:dark:border-bdrmodal-d {ls}:rounded-xl {ls}:shadow-sm',
            header: 'border-b border-bdr dark:border-bdr-d px-3 py-2.5',
        },

        inputs: {
            default: 'bg-bgrinput dark:bg-bgrinput-d focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-bdrinput dark:border-bdrinput-d focus:outline-none focus:outline-primary dark:focus-outline-primary-d placeholder-neutral-500 duration-100 text-neutral-900 rounded-lg flex-auto px-3  dark:text-neutral-100 text-base leading-5 h-11 ',
            multi: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto p-2 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 ',
            rounded: ' placeholder-neutral-500 bg-bgritem dark:bg-bgritem-d focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-transparent focus:border-bdrinput dark:focus:border-bdrinput-d focus:outline-none focus:outline-primary dark:focus-outline-primary-d duration-100 text-neutral-900 rounded-full flex-auto px-3 dark:text-neutral-100 text-base leading-5 h-11  ',
            roundedsmall: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[34px] ',
            small: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[36px] '
        },

        button_sizes: {
            default_size: 'base',
            default_variant: 'default',
            pressed_container: 'bg-primary/10 dark:bg-primary-d/10 hover:bg-primary/20 dark:hover:bg-primary-d/20 ',
            pressed_text: 'text-primary-700 dark:text-primary-600 group-hover:text-primary-800 dark:group-hover:text-primary-500 ',
            'xs': {
                rounded: 'rounded-lg',
                padding: 'p-1',
                icon_sizes: ' content-center text-center align-middle justify-center ',
                icon_size: 20,
                icon_margin: 'mx-0.5',
                margin: 'mx-2'
            },
            'sm': {
                rounded: 'rounded-lg',
                padding: 'p-1.5',
                icon_sizes: 'h-6 w-6 content-center text-center align-middle justify-center ',
                icon_size: 24,
                icon_margin: '',
                margin: 'mx-2'
            },
            'base': {
                rounded: 'rounded-lg',
                padding: 'p-2',
                icon_sizes: 'h-6 w-6',
                icon_size: 24,
                icon_margin: 'mx-1',
                margin: 'mx-2'
            },
            'lg': {
                rounded: 'rounded-xl',
                padding: 'p-2.5',
                icon_sizes: 'h-8 w-8',
                icon_size: 32,
                icon_margin: 'mx-0.5',
                margin: 'mx-3'
            }
        },

        button_styles: {
            'u-btn-default-cnt':
            ' bg-bgrbutton dark:bg-bgrbutton-d hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 border border-bdrbutton dark:border-bdrbutton-d',
            'u-btn-default-text':
                ' font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-default-trans': 'duration-200',

            'u-btn-primary-cnt':
                ' bg-primary dark:bg-primary-d sm:hover:bg-primary-600 dark:sm:hover:bg-primary-700  ',
            'u-btn-primary-text': '  font-medium text-white ',
            'u-btn-primary-trans': ' duration-200 ',

            'u-btn-secondary-cnt':
                ' bg-bgrbutton dark:bg-bgrbutton-d hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-secondary-text':
                ' font-medium text-neutral-700 hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-white ',
            'u-btn-secondary-trans': ' duration-200',

            'u-btn-danger-cnt':
                ' bg-red-600 hover:bg-red-500 border border-bg-red-700 shadow-sm hover:shadow active:opacity-50 active:shadow-none  ',
            'u-btn-danger-text':
                ' font-medium text-neutral-100 group-hover:text-white ',
            'u-btn-danger-trans': ' duration-200 ',

            'u-btn-text-cnt':
                '  hover:bg-neutral-200 dark:hover:bg-neutral-800 active:opacity-50 ',
            'u-btn-text-text':
                ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
            'u-btn-text-trans': ' duration-200 ',

            'u-btn-link-cnt': ' px-0 ',
            'u-btn-link-text':
                ' font-medium group-hover:underline text-neutral-700 dark:text-neutral-300  hover:text-neutral-950 dark:hover:text-neutral-50 active:opacity-50 ',
            'u-btn-link-trans': ' duration-200 ',

            'u-btn-outline-cnt':
                ' border border-bdrbutton dark:border-bdrbutton-d  hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:shadow-none  active:opacity-50 hover:shadow-sm ',
            'u-btn-outline-text':
                ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50 ',
            'u-btn-outline-trans': ' duration-200 ',

            'u-btn-group-item-cnt':
                ' hover:bg-bgritem-h dark:hover:bg-bgritem-dh active:opacity-50  ',
            'u-btn-group-item-text':
                ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50 ',

            'u-btn-group-item-text-cnt':
                ' hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-group-item-text-text':
                ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50 ',
        },
        buttons_group_styles: {
            'u-btn-default-cnt':
                ' border border-bdrbutton dark:border-bdrbutton-d bg-bgrbutton dark:bg-bgrbutton-d flex flex-row shadow-sm overflow-hidden ',
            'u-btn-outline-cnt':
                ' border border-bdrbutton dark:border-bdrbutton-d overflow-hidden flex flex-row ',
            'u-btn-text-cnt': 'flex flex-row active:opacity-50 ',

            'u-btn-secondary-cnt':
                ' bg-bgritem dark:bg-bgritem-d hover:bg-none dark:hover:bg-none active:opacity-50 overflow-hidden flex flex-row',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-secondary-trans': ' duration-200 ',
        },
    },
}
