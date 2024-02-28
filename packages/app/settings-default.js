import { env } from 'app/lib/env';

let settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        native_app_images_url: 'https://neo.so',
        debug:  true,
        use_proxy_web: true,
        use_proxy_native: false,
        sockets: {
            host: 'ci.una.io',
            port: '443',
            key: 'app-key',
        },
        api_keys: {
            google_maps: 'AIzaSyAhrci201-9xXIRAy0kLOHFGppeTk8AHmo',
            open_ai: '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'
        },
    },
    layout: {
        format_list:['hor', 'ver', 'mixed'],
        format:'mixed', //hor, ver, mixed
        format_guest:'hor', //hor, ver, mixed
        max_width: 'max-w-screen-2xl',  // for hor = max-w-screen-2xl, for ver = max-w-screen-xl
        max_width_block: 'max-w-screen-xl', // for hor = max-w-screen-xl, for ver = max-w-screen-lg
        use_background: false,
        cover_aspect: 'aspect-5/1',
        cell_gap: 4,
        cell_style: '',
        show_user_icon: false,
        search: true,
        messenger: '/chat',
        notifications: '/notifications-view',
        apps: true,
        block: 'login',
        show_profile_info: true,
        allow_switch_profile: true,
        switch_lang: ['ru', 'en'],
        switch_theme: true,
        background_image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239ca3af' fill-opacity='0.1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_image_dark: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239ca3af' fill-opacity='0.1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_cover_color: 'rgba(107, 114, 128, 0.5)',
        background_native:false,
        profile_colors: ['orange', 'yellow', 'green', 'teal', 'sky', 'indigo', 'purple', 'pink', 'rose', 'red'],
        async_workers: [],//['EventChecker'],
        async_workers_interval: 10,
        bluetooth: false,
        bluetooth_device_name_prefix: "NEO",
        use_custom_font: false,
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
        form_fields_optional_text: 'Optional',
        form_fields_mandatory_icon: 'Asterisk',
        form_without_captions: ['sys_account_create', 'sys_login']
    },
    jitsi: {
        prefix: 'prefix_',
        domain: 'https://meet.jit.si/',
    },
    urls: {
        embeds: 'oembed.php?html=1&a=get_link&l=',
    },
    cache: {
        list: true,
        compress: true
    },
    feed: {
        show_selector_view: true,
        default_view: '',
        show_html: false,
        default_feed: 'foryou',
        list: [
            { name: 'foryou', icon: 'Sparkle', title: 'For you' },
            { name: 'account', icon: 'Binoculars', title: 'Account' },
            { name: 'hot', icon: 'Fire', title: 'Hot' },
            { name: 'public', icon: 'Egg', title: 'Public' },
           /* { name: 'channels', icon: 'Hash' }*/
        ]
    },
    entry: {
        default_view: '',
    },
    suggestion: {
        list: [
            {name: 'friends', request_url: '/api.php?r=system/browse_recommendations_friends/TemplServiceProfiles&params[]={user_id}&params[]=', title: 'Recommended friends', unitType:'person_friends_suggestion', perLine:3},
            {name: 'groups', request_url: '/api.php?r=bx_groups/browse_recommendations_fans&params[]={user_id}', title: 'Recommended groups', unitType:'person_friends_recommendations', perLine:3}
        ],
    },
    browse: {
        per_line: [
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
        ],
        per_line_profile: [
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 3 },
        ],
        per_line_left_side_bar: [
            { width: 1280, count: 4 },
            { width: 1024, count: 3 },
            { width: 768, count: 4 },
            { width: 640, count: 3 },
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
        reaction: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: false,
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
        },
        report: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
        connection: {
            show_action_as_button: true,
            sys_profiles_friends: {
                icons: {add: 'UserCirclePlus', remove: 'UserCircleMinus'}
            },
            bx_events_fans: {
                icons: {add: 'SignIn', remove: 'SignOut'}
            },
            bx_groups_fans: {
                icons: {add: 'SignIn', remove: 'SignOut'}
            }
        },
        recommendation: {
            show_action_as_button: true,
        },
    },
    menu_meta:{
        unit_by_source: {
            'system/browse_friends' : 'person_friends',
            'system/browse_recommendations_friends' : 'person_friends_recommendations',
            'system/browse_friend_requested' : 'person_friend_requested',
            'system/browse_friend_requests' : 'browse_friend_requests',
            'system/browse_recommendations_subscriptions' : 'person_following_recommendations',
            'system/browse_subscribed_me' : 'person_followers',
            'browse_subscriptions' : 'person_following',
            'r=bx_events' : 'event',
            'r=bx_groups' : 'group',
        }
    },
    menu_items: {
        iconset: {
            'profile-check-in': 'Check',
            'edit-event-questionnaire': 'List',
            'edit-event-sessions': 'Calendar',
            'item-comment': 'ChatTeardropDots',
            'item-share': 'ShareFat',
            'edit': 'Pencil',
            'delete': 'Trash',
            'messenger': 'ChatTeardropDots', 
        },
        menu_top: [
            { name: 'home', title: 'Home', link: '/', icon: 'House'},
            { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
            { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront' }, 
        ],
        menu_drawer: [
            { name: 'home', title: 'Home', link: '/', icon: 'House'},
            { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
            { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront' }, 
            { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour' }, 
            { name: 'discussion-home', title: 'Discussions', link: '/discussions-home', icon: 'Chats' }, 
            { name: 'Logout',title: 'Sign out', link: '/logout', icon: 'SignOut', nonlogged: false},
        ],
        menu_top_more: [
            { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'discussion-home', title: 'Discussions', link: '/discussions-home', icon: 'Chats' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
            { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront' }, 
            { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour' }, 
            { name: 'organizations-home', title: 'Organizations', link: '/organizations-home', icon: 'CirclesThree' }, 
            { name: 'ads-home', title: 'Ads', link: '/ads-home', icon: 'Megaphone' }, 
            { name: 'channels-home', title: 'Channels', link: '/channels-home', icon: 'Hash' },  
        ],
        menu_add: [
            { name: 'create-post',title: 'Add post', link: '/create-post', icon: 'ChatCenteredText'},
            { name: 'create-group-profile',title: 'Add group', link: '/create-group-profile', icon: 'UsersThree'},
            { name: 'create-event-profile',title: 'Add event', link: '/create-event-profile', icon: 'Calendar'},
            { name: 'create-discussion',title: 'Add discussion', link: '/create-discussion', icon: 'Chats'},
            { name: 'create-ad',title: 'Add ad', link: '/create-ad', icon: 'Megaphone'},
        ],
        menu_account: [
            { name: 'dashboard', title: 'Dashboard', link: '/dashboard', icon: 'SquaresFour'},
            { title: 'Studio', link: '{studio}', icon: 'MagicWand', nonoperator: false },
            { name: 'payment-carts', title: 'Shopping Cart', link: '/payment-carts', icon: 'Wallet' }, 
            { name: 'settings',title: 'Settings', link: '/account-settings-email', icon: 'Gear'},
            { name: 'Logout',title: 'Sign out', link: '/logout', icon: 'SignOut'},
        ],
        menu_left: [
            { title: 'Profile', link: '{profile}', icon: 'User' },
            { title: 'Notifications', link: '/notifications-view', icon: 'Bell' },
            { title: 'Messages', link: '/messenger', icon: 'ChatTeardropDots' },
            { title: 'Friends', link: '/friends', icon: 'Link' },
            { title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { title: 'Events', link: '/events-home', icon: 'CalendarCheck' },
            { title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' },
            { title: 'Discussions', link: '/discussions-home', icon: 'Chats' },
            { title: 'People', link: '/persons-home', icon: 'UsersFour' },
            { title: 'About', link: '/about', icon: 'Info' },
            { title: 'Terms', link: '/terms', icon: 'Question' },
            { title: 'Contact', link: '/contact', icon: 'AddressBook' },
        ],
        menu_dashboard: [
            { key: 'friends', title: 'Friends',icon: 'UsersFour' , link: '/friends' },
            { key: 'followers', title: 'Followers', icon: 'UsersFour', link: '/followers' },
            { key: 'bx_posts', title: 'Posts', icon: 'ChatCenteredText', link: '/posts-home', link2: '/create-post', action: 'score', action_icon: 'ThumbsUp' },
            { key: 'bx_forum', title: 'Discussions', icon: 'Chats', link: '/discussions-home', link2: '/create-discussion', action: 'views', action_icon: 'ChartBar' },
            { key: 'bx_groups', title: 'Groups', icon: 'UsersThree', link: '/groups-home', link2: '/create-group-profile', action: 'members', action_icon: 'UsersFour' },
            { key: 'bx_events', title: 'Events', icon: 'CalendarCheck', link: '/events-home', link2: '/create-event-profile', action: 'members', action_icon: 'UsersFour' },
        ],
        menu_dashboard_manage: [
            { key: 'bx_events', title: 'Events', icon: 'CalendarCheck', link: '/events-administration' },
            { key: 'bx_timeline', title: 'Timeline', icon: 'CalendarCheck', link: '/timeline-administration' },
            { key: 'bx_posts', title: 'Posts', icon: 'ChatCenteredText', link: '/posts-administration' },
            { key: 'bx_groups', title: 'Groups', icon: 'UsersThree', link: '/groups-administration' },
            { key: 'bx_persons', title: 'Persons', icon: 'Users', link: '/persons-administration' },
            { key: 'bx_ads', title: 'Ads', icon: 'Megaphone', link: '/ads-administration' },
        ],
        menu_bottom_tabs_logged: [
            {key: '/tab0', title: 'Home', url: '/home',icon: 'House'},
            {key: '/tab1', title: 'Messages', url: '/messenger',icon: 'ChatTeardropDots'},
            {key: '/tab2', title: 'Friends', url: '/friends', icon: 'Users'},
            {key: '/tab3', title: 'Notifications', url: '/notifications-view', icon: 'Bell'},
            {key: '/tab4', title: 'Menu', url: '/dashboard',icon: 'UserList'},
        ],
        menu_bottom_tabs_non_logged: [
            {key: '/tab0', title: 'Home', url: '/home',icon: 'House'},
            {key: '/tab1', title: 'News', url: '/posts-home',icon: 'ChatCenteredText'},
            {key: '/tab2', title: 'About', url: '/about',icon: 'Info'},
            {key: '/tab3', title: 'Sign-up', url: '/create-account',icon: 'UserCircle'},
            {key: '/tab4', title: 'Login', url: '/login',icon: 'SignIn'},
        ],
        profile_menu: [
            'view-persons-profile',
            'persons-profile-friends',
            'posts-author',
            'posts-home',
        ],
        comments_manage_menu: [
            'item-edit', 
            'item-delete'
        ],
        bx_posts_submenu: {
            name: 'Posts',
            icon: 'File',
            items: [
                { name:'posts-home', icon:'ChatCenteredText'},
                { name:'posts-popular', icon:'Fire'}],
            add: [
                { icon: 'Plus', name: 'Add', link: '/create-post', nonlogged: false },
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_posts'},
            ],
        },
        bx_ads_submenu: {
            name: 'Ads',
            icon: 'File',
            items: [
                { name:'ads-home', icon:'Storefront' },
                { name:'ads-popular', icon:'Fire' }, 
                { name:'ads-manage', icon:'Fire' },
                { name:'ads-administration', icon:'Fire' },
                { name:'ads-sources', icon:'Fire' },
            ],
            add: [
                { icon: 'Plus', name: 'Add', link: '/create-ad', nonlogged: false },
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_ads'},
            ],
        },
        bx_market_submenu: {
            name: 'Market',
            icon: 'Storefront',
            items: [
                { name:'products-home', icon:'Storefront' },
                { name:'products-popular', icon:'Fire' }, 
                { name:'products-categories', icon:'Folders' },
                { name:'products-category', icon:'Folders' },
            ],
            add: [
                { icon: 'Plus', name: 'Add', link: '/create-product', nonlogged: false },
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_market'},
            ],
        },
        bx_persons_submenu: {
            name: 'People',
            icon: 'UsersFour',
            items: [
                { name:'persons-home', icon:'UsersFour'},
                { name:'persons-active', icon:'UsersFour'}
            ],
            add: [
                {icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_persons'},
            ],
        },
        bx_payment_menu_cart_submenu: {
            name: 'Shopping Carts',
            icon: 'Wallet',
            items: ['payment-carts', 'payment-history'],
            add: []
        },
        bx_organizations_submenu: {
            name: 'Organizations',
            icon: 'CirclesThree',
            items: [
                { name:'organizations-home', icon:'CirclesThree'},
                { name:'organizations-active', icon:'CirclesThree'}
            ],
            add: [
                {icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_organizations'},
            ],
        },
        bx_events_submenu: {
            name: 'Events',
            icon: 'Calendar',
            items: [
                { name:'events-home', icon:'Calendar' },
                { name:'events-top', icon:'CalendarCheck' },
                { name:'events-joined', icon:'LinkSimple' },
                { name:'events-search', icon:'MagnifyingGlass' },
                { name:'events-upcoming', icon:'LinkSimple' },
                { name:'events-followed', icon:'Binoculars' },
            ],
            add: [
                { icon: 'Plus', name: 'Add', link: '/create-event-profile', nonlogged: false },
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_events' },
            ],
        },
        sys_con_submenu: {
            name: 'Connections',
            icon: 'UsersFour',
            items: [
                { name: 'friends', icon:'UserList'},
                { name: 'friend-suggestions', icon:'UserCircle'}, 
                { name: 'friend-requests', icon:'UserCirclePlus'}, 
                { name: 'sent-friend-requests', icon:'UserCircleGear'}, 
                { name: 'follow-suggestions', icon:'UserFocus'}, 
                { name: 'followers', icon:'UsersFour'}, 
                { name: 'following', icon:'UserSquare'}, 
            ],
            add: [
                {icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_persons'},
            ],
        },
        sys_account_settings_submenu: {
            name: 'Settings',
            icon: 'Gear',
            items: [
                {name:'account-settings-password', icon:'Gear'},
                {name:'account-settings-email', icon:'Gear'},
                {name:'account-settings-info', icon:'Gear'},
                {name:'account-settings-delete', icon:'Gear'}
            ],
        },
        bx_groups_submenu: {
            name: 'Groups',
            icon: 'UsersThree',
            add: [
                { icon: 'Plus', name: 'Add', link: '/create-group-profile', nonlogged: false },
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_groups'},
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
                { name:'discussions-home', icon:'Chats'},
                { name:'discussions-popular', icon:'Fire'},
                { name:'discussions-categories', icon:'Folders'},
                { name:'discussions-category', icon:'Folders'}
            ],
            add: [
                { icon: 'Plus', name: 'Add', link: '/create-discussion', nonlogged: false },
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_forum'},
            ],
        },
        bx_channels_submenu: {
            name: 'Channels',
            icon: 'Hash',
            items: ['channels-home', 'channels-top'],
            add: [
                { icon: 'MagnifyingGlass', name: 'Search', link: '', section:'bx_channels' },
                { icon: 'DotsThreeOutlineVertical', name: 'More' },
            ],
        },
    },
    layouts: {
        messenger: {
            layout: 'messenger',
            blocks: {
                main: { name: 'bx_messenger:get_main_messenger_page', showTitle: false },
            },
            /*headerSettings: { offset: false, header: false }*/
         
        },
        login: {
            layout: 'login',
            blocks: {
                form: { name: 'system:login_form', showTitle: false },
            },
            headerSettings: { header: true, backButton: false, menu: true, title: true },
        },
        'create-account': {
            layout: 'create-account',
            blocks: {
                form_join: { name: 'system:create_account_form', showTitle: false },
                form_invitation: { name: 'bx_invites:get_block_form_request', showTitle: false },
            },
            headerSettings: { header: true, backButton: false, menu: true, title: true },
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
                browse: { name: 'system:search_keyword_result', showTitle: false, showBg: false },
            },
            icon: 'MagnifyingGlass',
            headerSettings: { backButton: false, header: true, menu: true }
        },
        home: {
            layout: 'home',
            top:true,
            blocks: {
                public_feed_form: { name: 'bx_timeline:get_block_post_home', showTitle: false, showBg: false },
                public_feed: {name: 'bx_timeline:get_block_view_home', showTitle: false, showBg: false },

                foryou_feed_form: {name: 'bx_timeline:get_block_post_account', showTitle: false, showBg: false },
                foryou_feed: {name: 'bx_timeline:get_block_view_custom', showTitle: false, showBg: false },

                account_feed_form: {name: 'bx_timeline:get_block_post_account', showTitle: false, showBg: false },
                account_feed: {name: 'bx_timeline:get_block_view_account', showTitle: false, showBg: false },
                
                hot_feed: {name: 'bx_timeline:get_block_view_hot', showTitle: false, showBg: false },

                channels_feed: {name: 'bx_timeline:get_block_view_channels', showTitle: false, showBg: false },

                login: {name: 'system:login_form', showTitle: false, showBg: false },
                signup: {name: 'system:create_account_form', showTitle: false, showBg: false },
                
                home_intro: { name: 'static:home_intro', showTitle: false, showBg: false },
                home_footer: { name: 'static:home_footer', showTitle: false, showBg: false },
               
                menu: { name: 'system:profile_menu', showTitle: false, showBg: false, leftbar: true },
                
                intro: { name: 'static:intro', showTitle: false, showBg: false, sidebar: true },
                friends: { name: 'system:browse_recommendations_friends', showTitle: false, showBg: false, sidebar: true, props: {no_scroll:true, skeleton: "one_column_browse", showTitleInside: true} },
                messenger_contacts: { name: 'bx_messenger:get_block_contacts_messenger', showTitle: false, showBg: false, sidebar: true, props: {no_scroll:true, skeleton: "one_column_browse", showTitleInside: true} },
                subscriptions: { name: 'system:browse_recommendations_subscriptions', showTitle: false, showBg: false, sidebar: true, props: {no_scroll:true, skeleton: "one_column_browse", showTitleInside: true} },
                footer: { name: 'static:footer', showTitle: false, showBg: false, sidebar: true },
            },
            header: [
                { icon: 'Plus', name: 'Add', link: '/create-post', nonlogged: false, section:'' },
                { icon: 'MagnifyingGlass', name: 'Search', link: 'search' },
            ],
            headerSettings: {header: true, backButton: false, menu: true, title: false },
        },
        
        //############ EVENTS PAGES ############
        'events-home': {
            layout: 'navigator',
            blocks: {
                browse: {name: 'bx_events:browse_recent_profiles', showTitle: false, showBg: false },
            }
        },
        'events-top': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:browse_top_profiles', showTitle: false, showBg: false },
            }
        },
        'events-joined': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:calendar', showTitle: false, showBg: false, perLine: 1 },
            }
        },
        'events-upcoming': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:calendar', showTitle: false, showBg: false, perLine: 1 },
            }
        },
        'events-calendar': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:calendar', showTitle: false, showBg: false, perLine: 1 },
            }
        },
        'events-followed': {
            layout: 'navigator',
            blocks: {

                browse: { name: 'bx_events:calendar', showTitle: false, showBg: false, perLine: 1 },
            }
        },
        'view-event-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col5: { name: 'bx_events:sessions', showTitle: true, showBg: true, perLine: 1, sidebar: true, showPad: true },
                col2: { name: 'bx_events:entity_info', showTitle: true, showBg: true, perLine: 1, sidebar: true, showPad: true },
                col3: { name: 'bx_events:entity_text_block', showTitle: false, showBg: true, perLine: 1, sidebar: true, showPad: true },
                col4: { name: 'system:locations_map', showTitle: true, showBg: true, perLine: 1, sidebar: true, showPad: true },
               
            },
            headerSettings: { offset: false, header: false }
        },
        
        //############ POSTS PAGES ############
        'view-post': {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'bx_posts:entity_author', showTitle: false, showBg: false, forList: true, forHeader: true },
                text: { name: 'bx_posts:entity_text_block', showTitle: false, showBg: false, forList: true },
                attachments: { name: 'bx_posts:entity_attachments', showTitle: false, showBg: false, forList: true },
                actions: { name: 'bx_posts:entity_all_actions', showTitle: false, showBg: false, forList: true },
                'comments-empty': { name: 'static:comments_empty', showTitle: false, showBg: false,forList: true },
                comments: { name: 'bx_posts:entity_comments', showTitle: false, showBg: false },
            },
            headerSettings: { header: false, footer: false, offset: false, backButton: true },
        },
        item: {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'bx_timeline:get_block_item_info', showTitle: false, showBg: false, forList: true, forHeader: true },
                text: { name: 'bx_timeline:get_block_item', showTitle: false, showBg: false, forList: true },
                'comments-empty': { name: 'static:comments_empty', showTitle: false, showBg: false,forList: true },
                comments: {name: 'bx_timeline:get_block_item_comments', showTitle: false, showBg: false },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },
        ['cmts-view']: {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'system:get_author_block', showTitle: false, showBg: false, forList: true, forHeader: true },
                comments: {name: 'system:get_block_view', showTitle: false, showBg: false, showHeader: false },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },

        //############ MARKET PAGES ############
        'products-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_market:browse_public', showTitle: false, showBg: false},
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            }
        },
        'products-category': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_market:browse_category', showTitle: false, showBg: false },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            }
        },
        'products-categories': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:categories_list', showTitle: false, showBg: false },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
               // col3: { name: 'system:keywords_cloud', showTitle: false, showBg: true, sidebar: true },
            }
        },
        'products-popular': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_market:browse_popular', showTitle: false, showBg: false },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            }
        },
        'view-product': {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'bx_market:entity_author', showTitle: false, showBg: false, forList: true, forHeader: true },
                text: { name: 'bx_market:entity_text_block', showTitle: false, showBg: false, forList: true },
                attachments: { name: 'bx_market:entity_attachments', showTitle: false, showBg: false, forList: true },
                actions: { name: 'bx_market:entity_all_actions', showTitle: false, showBg: false, forList: true },
                'comments-empty': { name: 'static:comments_empty', showTitle: false, showBg: false,forList: true },
                comments: { name: 'bx_market:entity_comments', showTitle: false, showBg: false },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },
        //############ ADS PAGES ############
        'view-ad': {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'bx_ads:entity_author', showTitle: false, showBg: false, forList: true, forHeader: true },
                text: { name: 'bx_ads:entity_text_block', showTitle: false, showBg: false, forList: true },
                attachments: { name: 'bx_ads:entity_attachments', showTitle: false, showBg: false, forList: true },
                actions: { name: 'bx_ads:entity_all_actions', showTitle: false, showBg: false, forList: true },
                'comments-empty': { name: 'static:comments_empty', showTitle: false, showBg: false,forList: true },
                comments: { name: 'bx_ads:entity_reviews', showTitle: false, showBg: false },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },
        
        //############ POSTS PAGES ############
        'posts-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_posts:browse_public', showTitle: false, showBg: false, perLine: 1 },
                browse_sidebar: { name: 'bx_posts:browse_featured', showTitle: true, showBg: false, sidebar: true, unitType:'small' },
            },
        },

        'posts-popular': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_posts:browse_popular', showTitle: false, showBg: false,  },
            },
        },

        //############ DISCUSSIONS PAGES ############
        'discussions-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_forum:browse_new', showTitle: false, showBg: false, perLine: 1 },
                browse_sidebar: { name: 'bx_forum:browse_popular', showTitle: true, showBg: false, sidebar: true, unitType:'small' },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
        },
        'discussions-popular': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_forum:browse_popular', showTitle: false, showBg: false, perLine: 1 },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
        },
        'discussions-category': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_forum:browse_category', showTitle: false, showBg: false, perLine: 1, skeleton:'notifications' },
                browse_sidebar: { name: 'bx_forum:browse_popular', showTitle: true, showBg: false, sidebar: true },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
        },
        'discussions-categories': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:categories_list', showTitle: false, showBg: false  },
                browse_sidebar: { name: 'bx_forum:browse_popular', showTitle: true, showBg: false, sidebar: true },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
        },
        'view-discussion': {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'bx_forum:entity_author', showTitle: false, showBg: false, forList: true, forHeader: true },
                text: { name: 'bx_forum:entity_text_block', showTitle: false, showBg: false, forList: true },
                attachments: { name: 'bx_forum:entity_attachments', showTitle: false, showBg: false, forList: true },
                actions: { name: 'bx_forum:entity_all_actions', showTitle: false, showBg: false, forList: true },
                'comments-empty': { name: 'static:comments_empty', showTitle: false, showBg: false,forList: true },
                comments: { name: 'bx_forum:entity_comments', showTitle: false, showBg: false },
            },
            headerSettings: { header: false, footer: false, offset: false },
        },
        //############ GROUPS PAGES ############
        'view-group-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col3: { name: 'bx_posts:browse_public', showTitle: false, showBg: false,showPad: true, sidebar: true  },
                col2: { name: 'bx_groups:entity_info', showTitle: false, showBg: true,showPad: true, sidebar: true },
                col4: { name: 'bx_groups:entity_text_block', showTitle: false, showBg: true,showPad: true, sidebar: true },
                col5: { name: 'bx_invites:get_block_invite', showTitle: false, showBg: true, showPad: true, sidebar: true },
            },
            headerSettings: { offset: false, header: false, cover: 'group'}
        },
        //############ CHANNELS PAGES ############
        'view-channel-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
            },
            headerSettings: { offset: false, header: false, cover:'min' }
        },
        //############ PERSONS PAGES ############
        'view-persons-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col2: { name: 'bx_persons:entity_info', showTitle: false, showBg: true, sidebar: true },
                col4: { name: 'bx_persons:entity_text_block', showTitle: false, showBg: true, sidebar: true },
            },
            headerSettings: { offset: false, header: false, cover: 'profile', columns:'reverse' }
        },
        //############ ORGS PAGES ############
        'view-organization-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col2: { name: 'bx_organizations:entity_info', showTitle: false, showBg: true, sidebar: true },
                col4: { name: 'bx_organizations:entity_text_block', showTitle: false, showBg: true, sidebar: true },
            },
            headerSettings: { offset: false, header: false }
        },
        'notifications-view': {
            layout: 'notif',
            top:true,
            blocks: {
                browse: { name: 'bx_notifications:get_block_view', showTitle: false,showBg: false, perLine: 1 },
            },
            header: [{ icon: 'MagnifyingGlass', name: 'Search' }],
            headerSettings: { header:true, backButton: false, menu:true },
            icon: 'Bell',
        },
    },
    theme: {
        light: {
            primary: '#0284c7',
            barsBackground: 'rgba(255,255,255,1)',
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
            checkbox: '#0284c7',
        },
        dark: {
            default: '#D1D5DB', //fix for icons color in iOS
            primary: '#0ea5e9',
            background: '#000000',
            barsBackground: 'rgba(31,41,55,1)',
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
        button_styles: {
            'u-btn-default-cnt': ' bg-bgrbutton dark:bg-bgrbutton-d hover:bg-bgrbutton-h dark:sm:hover:bg-bgrbutton-dh border border-bdrbutton dark:border-bdrbutton-d sm:hover:border-bdrbutton-h dark:hover:border-bdrbutton-dh active:opacity-50 shadow-sm sm:hover:shadow-md active:shadow-none ',
            'u-btn-default-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50 ',
            'u-btn-default-trans': ' duration-200 ',

            'u-btn-primary-cnt': ' bg-primary dark:bg-primary-d sm:hover:bg-primary-600 dark:sm:hover:bg-primary-700 border border-transparent  shadow-sm sm:hover:shadow-md active:opacity-50 active:shadow-none  ',
            'u-btn-primary-text': '  font-medium text-primary-50 sm:group-hover:text-white ',
            'u-btn-primary-trans': ' duration-200 ',

            'u-btn-danger-cnt': ' bg-red-600 hover:bg-red-500 border border-bg-red-700 shadow-sm hover:shadow active:opacity-50 active:shadow-none  ',
            'u-btn-danger-text': ' font-medium text-neutral-100 group-hover:text-white ',
            'u-btn-danger-trans': ' duration-200',

            'u-btn-text-cnt': ' border border-transparent hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-text-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
            'u-btn-text-trans': ' duration-200 ',

            'u-btn-link-cnt': ' border border-transparent ',
            'u-btn-link-text': ' font-medium group-hover:underline text-primary dark:text-primary group-hover:opacity-90 active:opacity-50 ',
            'u-btn-link-trans': ' duration-200 ',

            'u-btn-outline-cnt': ' border border-bdrbutton dark:border-bdrbutton-d hover:border-bdrbutton-h dark:hover:border-bdrbutton-dh hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:shadow-none  active:opacity-50 hover:shadow-sm ',
            'u-btn-outline-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
            'u-btn-outline-trans': ' duration-200 ',

            'u-btn-group-item-cnt': ' hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 hover:shadow-sm active:shadow-none ',
            'u-btn-group-item-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
        },
        buttons_group_styles: {
            'u-btn-default-cnt': ' border border-bdrbutton dark:border-bdrbutton-d bg-bgrbutton dark:bg-bgrbutton-d shadow-sm overflow-hidden ',
            'u-btn-outline-cnt': ' border border-bdrbutton dark:border-bdrbutton-d overflow-hidden ',
        },
    },
}

if (settingsDefault.layout.format == 'ver' ) {
    // Override settings for vertical layout
    settingsDefault.menu_items.menu_top = [
      
        { name: 'profile', title: 'Profile', link: '{profile}', icon: 'User', nonlogged: false }, 
        { name: 'payment-carts', title: 'Shopping Cart', link: '/payment-carts', icon: 'Wallet', nonlogged: false }, 
        { name: 'dashboard', title: 'Dashboard', link: '/dashboard', icon: 'SquaresFour', nonlogged: false }, 
        { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
        { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText', nonlogged: false  }, 
        { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree', nonlogged: false },
        { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar', nonlogged: false }, 
        { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour', nonlogged: false }, 
        { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront', nonlogged: false }, 
        { name: 'discussion-home', title: 'Discussions', link: '/discussions-home', icon: 'Chats', nonlogged: false }, 
       
        
        { name: 'messenger', title: 'Messenger', link: '/messenger', icon: 'ChatTeardropDots', nonlogged: false }, 
    ];
    delete settingsDefault.layouts.home.blocks.menu
}


if (settingsDefault.layout.format == 'mixed') {
    // Override settings for vertical layout
    settingsDefault.menu_items.menu_left = [
        { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
        { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText'  }, 
        { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
        { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
        { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour' }, 
        { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront' }, 
        { name: 'discussion-home', title: 'Discussions', link: '/discussions-home', icon: 'Chats'}, 
        { name: 'About', title: 'About', link: '/about', icon: 'Info'}, 
        { name: 'Contact', title: 'Contact', link: '/contact', icon: 'Info' }, 
        { name: 'Privacy', title: 'Privacy', link: '/privacy', icon: 'Info' }, 
        { name: 'Terms', title: 'Terms', link: '/terms', icon: 'Info' }, 
    ];
    settingsDefault.menu_items.menu_top = [];
    settingsDefault.layouts.home.headerSettings.menu = false;
    delete settingsDefault.layouts.home.blocks.menu;
}

export { settingsDefault };

