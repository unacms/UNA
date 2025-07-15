import { env } from 'app/lib/env'

export  const settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        app_origin: env('APP_ORIGIN'),

        native_app_images_url: env('APP_URL')== 'http://localhost:3000' ? 'https://neo.so' : "https://neo.so",

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
            mapbox: 'pk.eyJ1Ijoicm9tYW5sZXMiLCJhIjoiY204Zm9kY3ByMGE4bzJrc2R6Zzg4NW0zMCJ9.Jme_Zudsug5mmqcbjII9cQ',
        },
        show_ui: false,
    },
    app: {
        title: "NEO",
    },
    layout: {
        body: ' bg-bgrbody dark:bg-bgrbody-d ',
        avaliable_layouts: ['hor', 'ver', 'mixed'], // OLD appSetting('layout', 'format_list')
        default_layout: 'hor', //hor, ver, mixed// OLD appSetting('layout', 'format')
        screen: ' w-full ',
        background: ' TODO ',

        sidebar: ' fixed-process fixed w-80 2xl:w-96 p-3 web:duration-200 ',
        sidebar_container: ' hidden relative xl:flex w-80 2xl:w-96 ',
      
        aside_container: 'hidden lg:flex w-80 2xl:w-96 h-full', 
        max_width: ' w-full ', 
        max_width_block: '  max-w-7xl ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg
        max_width_content: ' w-full max-w-7xl ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg
       

        search: true,
        sidebar_search: true,
        extended_search: true,
        apps: true,
        show_profile_info: true,
        tooltips: true,
        hide_header_for_non_logged: false,
        hide_header_for_all: false,
        card_animation_duration: 0,
        user_remote_config: true,
        background_image_color: '', //OLD appSetting('layout', 'background_cover_color')
        background_image: '', //`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_image_dark: '', //`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,

        splash_block: 'login', //OLD appSetting('layout', 'block')
        show_login_modal: 5000,
        redirect_on_forbidden: '/home',
        lock_unconfirmed: true,
        allow_create_new_profile: true,

        button_style_for_actions: 'secondary',

        share_text: '',
        default_icon_stroke_width: 2,
        tablet_mode_from: 'lg',
        custom_header_element: false,
        show_tabbar_on_mobile_non_logged: false, 
        
        header:{
            offset: ' h-16 w-full ',
            container: ' hidden lg:flex fixed w-full mx-auto h-16 left-[50%] translate-x-[-50%]  ',
            initial: '  my-auto w-full items-center transition-all web:duration-300 ease-in-out will-change-transform    ',
            scrolled: '  backdrop-blur-xl my-auto w-full  mx-auto bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_2px_4px_0_rgba(0,0,0,0.05)] ',
            content: ' h-16 mx-auto justify-between ',
            content_left: ' flex-row w-80 2xl:w-96 px-2 xl:px-3 ',
            content_right: ' w-80 2xl:w-96 items-center justify-end h-full px-3 ',
            content_center: ' hidden xl:flex flex-auto w-full mx-auto max-w-4xl gap-x-0.5 justify-between items-center align-middle px-3',
            special: {
                profile: 'hidden lg:flex',
                messenger: 'hidden lg:flex',
                post: 'hidden lg:flex',
                default: ' flex '
            },
        },
        vertical: {
            blocks:[
              /*  {
                    name: 'system/profile_menu/TemplServiceProfiles',
                    showTitle: false,
                    showBg: false,
                },*/
            ]
        }
    },
    auth:{
        enabled: true,
        google:{
            web_client_id: '398453829790-egj0o9mm2mq9rua8umq6jcvedtl9cgfu.apps.googleusercontent.com',
            ios_client_id: '',
            android_client_id: '',
        },
        github: true,
        linkedin: true,
        x: true,
        passkey: false,
        saml: false,
    },
    native: {
        default_theme: 'auto',
        enable_screens: true, //OLD appSetting('layout', 'native_enable_screens')
        lazy_tabs: false, // OLD appSetting('layout', 'native_lazy_tabs')
        disable_screenshots: false, // OLD appSetting('layout', 'disable_screenshots')
        show_tabs_non_logged: true, // OLD appSetting('layout', 'show_nav_non_logged_native')
        use_custom_font: false, //'font-main' //OLD appSetting('layout', 'use_custom_font')
        bluetooth: false, //OLD appSetting('layout', 'bluetooth')
        bluetooth_device_name_prefix: 'NEO', //OLD appSetting('layout', 'bluetooth_device_name_prefix')
        onesignal_request_on_load: true,
        check_version: 'optional', // variants: [no, required, optional]
        collapsible_header: true,
        scroll_to_top_button: true,
    },
    async_workers: {
        list: ['CounterChecker'], //['EventChecker'],//NotifChecker OLD appSetting('layout', 'async_workers')
        interval: 10, //OLD appSetting('layout', 'async_workers_interval')
    },
    
    context_selector:{
        default_item: ''
    },
    cover: {
        use_background: true, //appSetting('layout', 'use_background')
        aspect_ratio: 'aspect-4/1', //appSetting('layout', 'cover_aspect')
        allow_edit: true, //appSetting('layout', 'allow_edit_covers')
        fixed: false, //appSetting('layout', 'fixed_cover')
        scroll: false,
        split_action_menu: true, //OLD appSetting('layout', 'split_action_menu')
        back_button_url_for_profile: '/friends', //OLD appSetting('layout', 'back_for_profile')
        view_by_module: {
            //appSetting('layout', 'cover_mode'
            bx_courses: 'min',
            bx_spaces: 'min',
            bx_jobs: 'max',
        },
        show_pic_by_module:{
            bx_spaces:true,
        },
        more_menu_in_cnd:false
    },
    comments: {
        hide_sort: false, //OLD appSetting('layout', 'hide_comments_sort')
        show_modal_in_feed: true, //OLD appSetting('layout', 'comments_in_modal')
        count_in_feed: 3, //OLD appSetting('layout', 'comments_count_in_feed')
        mentions: true, //OLD appSetting('layout', 'comments_mentions')
        in_reply: true, //OLD appSetting('layout', 'show_in_reply_comments')
        submit_comment_on_enter: false,
    },
    dashboard: {
        url: '/dashboard', //OLD appSetting('layout', 'dashboard')
        langs: ['system', 'en', 'ru'], //OLD appSetting('layout', 'switch_lang')
        switch_theme: true, //OLD appSetting('layout', 'switch_theme')
        modules_list: [
            'friends',
            'followers',
            'bx_ads',
            'bx_forum',
            'bx_posts',
            'bx_events',
            'bx_groups',
            'bx_organizations',
            'bx_spaces',
        ],
    },
    notifications: {
        url: '/notifications-view', //OLD appSetting('layout', 'notifications')
        count_in_title: true, //OLD appSetting('layout', 'add_notifications_count_in_title')
    },
    carousel: {
        image_width: '', //appSetting('layout', 'carousel_image_width')
        image_aspect_ratio: ' aspect-square ', //appSetting('layout', 'carousel_image_aspect')
    },
    conductor: {
        show_nav_counters: 'primary', // OLD appSetting('layout', 'show_nav_counters')
        show_nav_titles: false, // OLD appSetting('layout', 'show_nav_titles')
        hide_browse_filter: true, // OLD appSetting('layout', 'hide_browse_filter')
        sidebar_container: ' relative p-2 ',
        sidebar_width: ' w-80 hidden lg:block',
        sidebar_position: ' z-50 fixed fixed-process ',
        bgrDecorator: true, // Enable/disable decorator background globally for conductor buttons
    },
    entry: {
        default_view: '',
        default_info_icon: 'Info', //appSetting('layout', 'entity_info_icon')
    },
    messenger: {
        url: '/messenger', //OLD appSetting('layout', 'messenger')
        back_button: false, //OLD appSetting('layout', 'show_back_button_in_messenger')
    },
    forms: {
        single_editor: true,
        optional_text: '', // OLD appSetting('layout', 'form_fields_optional_text')
        mandatory_icon: 'Asterisk', // OLD appSetting('layout', 'form_fields_mandatory_icon')
        auto_ghosts_in_files: true,
        field_gap: '4',
        caption_classes:
            'font-semibold text-sm sm: text-base text-neutral-700 dark:text-neutral-300',
        without_captions: [
            // OLD appSetting('forms', 'form_without_captions')
            'sys_login',
            'sys_account_create',
            
            'bx_invites_request_send',
        ],
        visibility_control_names: [
            // appSetting('layout', 'form_' + name + '_control_names')
            '*_allow_view_to',
            '*_object_privacy_view',
        ],
        selector_control_names: ['*_cat'],

        /* sys_login: { hide_errors: true, button_full_width: true },*/

        sys_forgot_password: {
            hide_errors: true,
            button_full_width: true,
        },
        /* bx_invites_request_send: {
            hide_errors: true,
            button_full_width: true,

        },
        sys_account_create: {
            hide_errors: true,
            button_full_width: true,

        },*/
    },
    editor: {
        toolbar: {
            padding: 1, // Padding for toolbar buttons in pixels
            colors: {
                background: 'rgba(255, 255, 255, 0)',
                backgroundDark: 'rgba(0, 0, 0, 0)',
                icon: 'rgba(210, 215, 220, 1)',
                iconDark: 'rgba(55, 65, 80, 1)',

            }
        }
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
        feed_container: 'relative flex-auto mx-auto w-full max-w-4xl sm:p-3 ',
        show_selector_view: true,
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
            {
                name: 'account',
                icon: 'Binoculars',
                title: 'Following',
                showTitle: true,
            },
            { name: 'hot', icon: 'Flame', title: 'Hot', showTitle: true },
            { name: 'public', icon: 'Egg', title: 'Public', showTitle: true },
            { name: 'channels', icon: 'Hash', title: 'News', showTitle: true },
        ],
        units: {
            bx_market: 'MarketView',
            bx_ads: 'AdView',
            bx_groups: 'GroupView',
            bx_events: 'GroupView',
            bx_courses: 'GroupView',
            bx_spaces: 'GroupView',
            bx_polls: 'PollView',
        },
        actions_menu: {
            show_action: true, // show action part or not
            show_counter: false, // show counter part or not
            show_combined: true, // leave true
            button_show_title_from_size: '',
            button_full_width: true,
            button_size: 'sm',
            button_variant: 'text',
            button_ring: 'p-1',
            pressed_classes: {
                pressed_container:
                    ' bg-primary-100 dark:bg-primary-900 ',
                pressed_text:
                    ' text-primary-600 dark:text-primary-500 group-hover:text-primary-700 dark:group-hover:text-primary-400 ',
            },
            button_rounded: false,
            align_items: 'between',
            no_gap_between_buttons: false, // is false no gap between buttons + right margin, is true  gap between buttons + no margin
        },
        counters_menu: {
            show_action: false,
            show_counter: true,
            show_combined: true,
            button_variant: 'text',
            button_size: 'xs',
            align_items: 'between',
            no_gap_between_buttons: false,
        },
        /*
        FOR COMBINED BUTTONS SHOULD BE SET IN THE FOLLOWING WAY:
        , actions_menu : {
            show_action: true,
            show_counter: true,
            show_combined: true,
            }

        */
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
           
            { width: 1280, count: 5 },
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
        ],
        per_line_profile: [
           
            { width: 1280, count: 5 },
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
        ],
        per_line_left_side_bar: [
            
            { width: 1536, count: 5 },
            { width: 1280, count: 4 },
            { width: 1024, count: 3 },
            { width: 768, count: 2 },
        ],
        per_line_bx_courses: [
            
            { width: 1536, count: 5 },
            { width: 1280, count: 4 },
            { width: 1024, count: 3 },
            { width: 768, count: 2 },
        ],
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
        unit_by_mode_default: {
            context: 'Base',
            search: 'Search',
            default: 'Base',
        },
        unit_by_mode_bx_posts: {
            small: 'Small',
            context: 'Small',
            search: 'Search',
            default: 'Base',
        },
        unit_by_mode_bx_forum: {
            small: 'Small',
            context: 'Small',
            default: 'Base',
        },
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
            iconset: {
                web: {
                    default: { svg: 'Smile', emoji: '🙂' },
                    like: { svg: 'ThumbsUp', emoji: '👍' },
                    love: { svg: 'Heart', emoji: '🥰' },
                    joy: { svg: 'Smile', emoji: '😂' },
                    surprise: { svg: 'SmileyXEyes', emoji: '😮' },
                    sadness: { svg: 'SmileySad', emoji: '😔' },
                    anger: { svg: 'SmileyAngry', emoji: '😠' },
                },
                native: {
                    default: { svg: 'Smile', emoji: '🙂' },
                    like: { svg: '', emoji: '👍' },
                    love: { svg: '', emoji: '🥰' },
                    joy: { svg: '', emoji: '😂' },
                    surprise: { svg: '', emoji: '😮' },
                    sadness: { svg: '', emoji: '😔' },
                    anger: { svg: '', emoji: '😠' },
                },
            },
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
                icons: { add: 'UserPlus', remove: 'UserMinus' },
            },
            bx_events_fans: {
                icons: { add: 'LogIn', remove: 'LogOut' },
            },
            bx_groups_fans: {
                icons: { add: 'LogIn', remove: 'LogOut' },
            },
        },
        recommendation: {
            show_action_as_button: true,
        },
        feature: {
            show_action_as_button: true,
            haptics_type: 'Medium',
        },
        favorite: {
            show_action: true,
            show_action_as_button: true,
            show_action_label: true,
            show_counter: true,
            show_counter_as_button: false,
            haptics_type: 'Medium',
        },
    },
    menu_items: {
        transpile_urls: [
            // URLS for tabs in native app index = tab index
            // { index: 1, url: '/friend-suggestions' },
            { index: 1, url: '/friend-requests' },
            { index: 1, url: '/sent-friend-requests' },
        ],
        objects: {
            account: 'sys_account_notifications',
            add: 'sys_add_content',
            launcher: 'sys_homepage',
            footer: 'sys_footer',
        },
        iconset: {
            'profile-check-in': 'Check',
            'edit-event-questionnaire': 'List',
            'edit-event-sessions': 'Calendar',
            'item-comment': 'MessageCircleMore',
            'item-share': 'Share2',
            edit: 'Pencil',
            delete: 'Trash',
            messenger: 'MessageCircleMore',
            'profile-confirm': 'Check',
            'profile-set-acl-level': 'Award',
            'profile-set-badges': 'BadgeCheck',
            'job-questionnaire': 'List',
            'invite-to-job': 'UserPlus',
            users: 'UsersRound',
            'camera-retro': 'Video',
            'file-alt': 'File',
            'info-circle': 'Info',
            user: 'UserRound',
            building: 'Building2',
            image: 'Image',
            farx: 'MessagesSquare',
            comments: 'MessagesSquare',
            calendar: 'Calendar',
            'fa-book': 'LibraryBig',
            ad: 'File',
            'object-group': 'SquareStack',
            film: 'Video',
            hashtag: 'Hash',
            'shopping-cart': 'Store',
            'book-reader': 'LibraryBig',
            briefcase: 'Calendar',
            tasks: 'ListChecks',
            'tachometer-alt': 'LayoutDashboard',
            wrench: 'Wand',
            'cart-plus': 'Wallet',
            cog: 'Cog',
            'sign-out-alt': 'LogOut',
            clock: 'Clock',
            'item-share': 'Share2',
            'item-copy': 'Clipboard',
            'item-repost': 'RotateCw',
        },
        menu_navbar: [
            { name: 'home', title: 'Home', link: '/', icon: 'House' },
            {
                name: 'friends',
                title: 'Friends',
                link: '/friends',
                icon: 'UsersRound',
                nonlogged: false,
            },
            {
                name: 'explore',
                title: 'Explore',
                link: '/explore',
                icon: 'Compass',
                logged: false,
            },
            {
                name: 'videos-home',
                title: 'Video',
                link: '/videos-home',
                icon: 'TvMinimalPlay',
            },
            {
                name: 'products-home',
                title: 'Market',
                link: '/products-home',
                icon: 'Store',
            },
            {
                name: 'groups-home',
                title: 'Groups',
                link: '/groups-home',
                icon: 'Shapes',
            },
            {
                name: 'events-home',
                title: 'Events',
                link: '/events-home',
                icon: 'Calendar',
            },
        ],
        menu_tabbar_logged: [
            { key: '/tab0', title: 'Home', url: '/home', icon: 'House' },
            {
                key: '/tab1',
                title: 'Friends',
                url: '/posts-home',
                icon: 'UsersRound',
            },
            {
                key: '/tab2',
                title: 'Messages',
                url: '/messenger',
                icon: 'MessageCircleMore',
            },
            {
                key: '/tab3',
                title: 'Notifications',
                url: '/notifications-view',
                icon: 'Bell',
            },
            {
                key: '/tab4',
                title: 'Dashboard',
                url: '/dashboard',
                icon: 'Award',
            },
        ],

        menu_tabbar_non_logged: [
            { key: '/tab0', title: 'Home', url: '/home', icon: 'House' },
            {
                key: '/tab1',
                title: 'Explore',
                url: '/explore',
                icon: 'Compass',
            },
            { key: '/tab2', title: 'About', url: '/about', icon: 'Info' },
            {
                key: '/tab3',
                title: 'Contact',
                url: '/contact',
                icon: 'Contact',
            },
            { key: '/tab4', title: 'Terms', url: '/terms', icon: 'Info' },
        ],
        /* for vertical layout*/
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
                icon: 'MessageCircleMore',
                nonlogged: false,
            },
            {
                title: 'Friends',
                link: '/friends',
                icon: 'Link',
                nonlogged: false,
            },
            { title: 'Groups', link: '/groups-home', icon: 'Group' },
            { title: 'Spaces', link: '/spaces-home', icon: 'SquareStack' },
            { title: 'Events', link: '/events-home', icon: 'CalendarCheck' },
            { title: 'Posts', link: '/posts-home', icon: 'MessageSquareText' },
            {
                title: 'Discussions',
                link: '/discussions-home',
                icon: 'MessageSquare',
            },
            { title: 'Courses', link: '/courses-home', icon: 'LibraryBig' },
            { title: 'People', link: '/persons-home', icon: 'Users' },
            { title: 'Jobs', link: '/jobs-home', icon: 'BriefcaseBusiness' },
            { title: 'About', link: '/about', icon: 'Info' },
            { title: 'Terms', link: '/terms', icon: 'HelpCircle' },
            { title: 'Contact', link: '/contact', icon: 'Mail' },
        ],
    },
    header_toolbar: {
        hor: {
            loggedIn: [
                { component: 'search', className: '' },
                { component: 'custom_header_element', className: '' },
                { component: 'launcher', className: 'hidden sm:block' },
                { component: 'add', className: '' },
                { component: 'notifications', className: 'hidden sm:block' },
                { component: 'messenger', className: 'hidden sm:block' },
                { component: 'account', className: 'hidden sm:block' },
            ],
            loggedOut: [
                { component: 'search', className: 'items-center' },
                { component: 'launcher', className: 'items-center' },
                { component: 'login', className: 'items-center' },
            ],
        },
        mixed: {
            loggedIn: [
                { component: 'search', className: 'lg:hidden' },
                { component: 'launcher', className: 'hidden' },
                { component: 'add', className: '' },
                { component: 'notifications', className: 'hidden sm:block' },
                { component: 'messenger', className: 'hidden sm:block' },
                { component: 'account', className: 'hidden sm:block' },
            ],
            loggedOut: [
                { component: 'search', className: '' },
                { component: 'launcher', className: '' },
                { component: 'login', className: '' },
            ],
        },
        ver: {
            loggedIn: {
                top: [
                    { component: 'search', className: 'lg:hidden' },
                    { component: 'add', className: 'lg:hidden' },
                ],
                sidebar: [
                    { component: 'post_button', className: 'flex-auto' },
                    { component: 'account', className: 'flex-auto' },
                    { component: 'add', className: 'ml-2' },
                ],
            },
            loggedOut: {
                top: [],
            },
        },
    },
    layouts: {
        '/': { // For the splash screen (home page when not logged in)
            max_width: ''
        },
        '/login': {
            max_width: ''
        },
        '/create-account': {
            max_width: ''
        }
    },
    theme: {
        profile_colors: [
            //OLD appSetting('layout', 'profile_colors')
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
        native_tabs: {
            tabBarItemStyle: {
                marginBottom: 0,
                height: 50,
                marginTop: 4,
                paddingBottom: 0,
                borderRadius: 12,
                marginLeft: 0,
                marginRight: 0,
                overflow: 'hidden',
            },
            badgeBackground: 'rgba(239,68,68,1)', // Red color by default
            badgeTextSize: 'text-xs leading-4 font-semibold', // Customizable text size for badge
        },
        light: {
            default: 'rgba(3,7,18,1)',
            primary: 'rgba(37, 99, 235, 1)',
            outline: 'rgba(37, 99, 235, 0.5)',
            headerBackground: 'rgba(255,255,255,1)',
            barsBackground: 'rgba(255,255,255,1)', //header and tabbar background in native light mode
            bottomSheetBackground: 'rgba(255,255,255,1)',
            barsColor: '#4B5563',
            selectBorder: 'rgba(156, 163, 175, 0.3)',
            fieldBackground: 'rgba(245,250,255,1)',
            blockBorder: '#E5E7EB',
            tabsBackground: 'rgba(255,0,0,1)',
            activeTabBackground: '#DBEAFE',
            tabText: 'rgba(75,85,99,1)',
            activeTabText: 'rgba(3,7,18,1)',
            screenBackground: 'rgba(235,240,245,1)',
            bgrmodal: 'rgba(255,255,255,1)',
            bdrModal: 'rgba(110,115,130,0.15)',
            checkbox: '#2563eb',
            safeAreaBackground: 'rgba(255,255,255,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
            fgTertiary: 'rgba(75,85,99,1)',
            bgreditortoolbar: 'rgba(255, 255, 255, 1)',
            iconeditortoolbar: 'rgba(210, 215, 220, 1)',
            bgrtoolbarbutton: 'rgba(248, 249, 250, 0)',
        },
        dark: {
            default: 'rgba(209,213,219,1)', //fix for icons color in iOS
            headerBackground: 'rgba(17,24,39,1)',
            primary: 'rgba(59, 130, 246, 1)',
            outline: 'rgba(59, 130, 246, 0.5)',
            barsBackground: 'rgba(17,24,39,1)', //header background in native
            bottomSheetBackground: 'rgba(17,24,39,1)',
            barsColor: 'rgba(209,213,219,1)', //tabbar icons color in native
            selectBorder: 'rgba(55, 65, 81, 0.3)',
            fieldBackground: '#030712',
            blockBorder: '#030712',
            tabText: 'rgba(156,163,175,1)',
            activeTabText: 'rgba(249,250,251,1)',
            screenBackground: 'rgba(3,7,18,1)',
            bgrmodal: 'rgba(31,41,55,1)',
            bdrModal: 'rgba(110,115,130,0.15)',
            checkbox: '#0ea5e9',
            safeAreaBackground: 'rgba(17,24,39,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
            fgTertiary: 'rgba(156,163,175,1)',
            bgreditortoolbar: 'rgba(55, 65, 82, 1)',
            iconeditortoolbar: 'rgba(75, 85, 99, 1)',
            bgrtoolbarbutton: 'rgba(33, 37, 41, 0)',
        },
        dropdown: {
            cnt: ' rounded-2xl web:backdrop-blur overflow-hidden p-1 bg-bgrmodal dark:bg-bgrmodal-d z-50 shadow-[0_10px_10px_rgba(0,0,0,0.15)] ',
        },
        conductor: {
            menu: '   w-full items-left justify-center  ',
            menu_max_width: ' w-full max-w-7xl ',
            content_max_width: ' w-full max-w-7xl ',
            menu_is_dynamic: true,
            menu_cnt: ' flex-row flex-none  ',
            menu_categ_ident: 'pl-12',
            right_column_cnt: 'fixed-process pr-4 py-4',
            topmenu_cnt:
                'w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex p',
            topmenu_button_variant: 'secondary',
            topmenu_button_variant_active: 'secondary',
            topmenu_button_align: 'start',
            topmenu_button_fullWidth: false,
            topmenu_button_size: 'base',
            topmenu_button_pressed: true,
            left_menu_cnt: '  ',
            action_menu_in_tabs: true,
            cover_cnt: 'w-full border-b border-bdrnavbar dark:border-bdrnavbar-d bg-gradient-to-b from-transparent to-white dark:from-transparent dark:to-neutral-900',
            cover_cnt2: " w-full overflow-hidden   "
        },
        checkbox: {
            container:
                ' h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center   ',
            container_selected:
                ' m-1 h-5 w-5 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center ',
            selected: ' h-2.5 w-2.5 rounded-xs bg-primary m-1',
            text: '  text-neutral-800 dark:text-neutral-200 text-base leading-5 font-medium ',
            selected_icon: false,
        },
        checkbox_set: {
            container: '  gap-x-2 items-center',
        },
        switcher: {
            container: 'items-center flex flex-row-reverse justify-between gap-x-2 items-center h-14 min-w-14 rounded-xl flex-auto  p-3  bg-neutral-50 border border-neutral-200  hover:border-neutral-300 focus:border-primary dark:bg-neutral-900 overflow-hidden  dark:border-neutral-800 dark:hover:border-neutral-700  dark:focus:border-primary-d  focus:bg-bgrinput-f dark:focus:bg-neutral-950    web:duration-300  placeholder-neutral-500   ',
            text: ' text-neutral-800 dark:text-neutral-200  text-base ',
            track: 'item-center rounded-full ',
            thumb: ' rounded-full aspect-square bg-white',
            track_color: 'bg-red-500 dark:bg-red-500 ',
            active_track_color: 'bg-green-500 dark:bg-green-500',
            size_base: ['w-20 h-8 p-1 ', 'h-6 w-6'],
            size_sm: ['w-10 h-4 p-0.5 ', 'h-3 w-3'],
        },
        doublerange: {
            container: 'w-full items-center justify-between mt-2',
            value_container:
                'w-36 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput py-2 px-4 text-center rounded-lg justify-between',
            text_value: 'text-neutral-700 dark:text-neutral-300',
            text_info: '',
            track_height: 4,
            thumb_size: 15,
            outbound_color: {
                light: 'rgb(242, 242, 242)',
                dark: 'rgb(242, 242, 242)',
            },
            inbound_color: {
                light: 'rgb(242, 242, 242)',
                dark: 'rgb(242, 242, 242)',
            },
            thumb_tint_color: {
                light: '#2563eb',
                dark: '#2563eb',
            },
        },
        dropdown_menu: {
            content_shadow: ' shadow-xl  ',
            content_ver: '',
            content_hor: 'flex-row   ',
            item_ver:
                ' group flex flex-row h-12 items-center p-1.5 text-sm rounded-xl font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:cursor-pointer',
            item_hor:
                'flex block p-1.5 hover:-translate-y-1  dark:hover:text-white rounded-full hover:cursor-pointer text-neutral-700  hover:scale-125 active:scale-95   web:duration-200 dark:text-neutral-300 outline-none ',
            item_np:
                'flex flex-row focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-300 dark:hover:text-white hover:cursor-pointer',
            item_cnt: 'items-center w-full',
            item_text:
                ' text-base web:text-sm leading-8 px-3 font-medium text-neutral-800 dark:text-neutral-200',
            item_icon:
                'flex items-center w-9 h-9 bg-bgritem dark:bg-bgritem-d group-hover:bg-bgritem-h dark:group-hover:bg-bgritem-dh rounded-full justify-center',
            icon_size: 20, // Default icon size for dropdown menu icons
        },
        modal: {
            fog: 'bg-white/50 dark:bg-black/80 backdrop-blur ',
            container:
                ' h-full sm:h-auto shadow-modal dark:shadow-modal-d bg-bgrmodal dark:bg-bgrmodal-d sm:rounded-2xl sm:border border-bdrmodal dark:border-bdrmodal-d overflow-hidden ',
            content: ' h-auto ',
            header: ' p-3 items-start justify-start border-b border-bdrmodal dark:border-bdrmodal-d',
        },
        // Default styling for Card components.
        // - `default`: Base classes like background and shadow. These are always applied.
        // - `margin`: Default margin/padding classes. Can be overridden by the Card component's `margin` prop.
        // - `rounded`: Default corner rounding classes. Can be overridden by the Card component's `rounded` prop.
        // - `border`: Default border classes. Can be overridden by the Card component's `rounded` prop (as it often handles border too).
        card: {
            default: 'bg-bgrcard dark:bg-bgrcard-d backdrop-blur-xl ', // Base styles (e.g., background)
            margin: 'p-3 sm:p-4',                               // Default margin/padding
            rounded: 'rounded-2xl',                       // Default corner rounding
            border: ' border border-bdrcard dark:border-bdrcard-d overflow-hidden shadow-sm ',  // Default border and shadow styles
        },
        inputs: {
            default:
                'h-14 min-w-14 rounded-xl flex-auto ' +
                'px-3 py-3 text-base ' +
                'bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d ' +
                'hover:border-bdrinput-h dark:hover:border-bdrinput-dh ' +
                'focus:border-bdrinput-f dark:focus:border-bdrinput-df ' +
                'focus:bg-bgrinput-f dark:focus:bg-bgrinput-df ' +
                'overflow-hidden   web:duration-300 ' +
                'placeholder-neutral-500 ' +
                'text-neutral-800 dark:text-neutral-200 ' +
                'focus:text-neutral-900 dark:focus:text-neutral-100',
            multi: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-xl flex-auto px-3 py-3 dark:focus:bg-bgrinput-df dark:text-neutral-100 text-base leading-5 ',
            rounded:
                ' h-12 rounded-full flex-auto px-3 py-[11px] text-base bg-bgrinput dark:bg-bgrinput-d hover:border-bdrinput-h focus:border-bdrinput-f overflow-hidden border border-bdrinput focus:bg-bgrinput-f dark:border-bdrinput-d dark:focus:border-bdrinput-d dark:focus:bg-bgrinput-df focus:border-bdrinput-f dark:focus:border-bdrinput-df   web:duration-300 placeholder-neutral-500 text-neutral-800 dark:text-neutral-200 ',
            roundedsmall:
                ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[34px] ',
            small: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-9 ',   
            select: 'appearance-none pr-10 bg-bgrinput h-14 border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-xl  flex-auto p-3 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus dark:text-neutral-100 text-base',
        },

        button_sizes: {
            default_size: 'base',
            default_variant: 'default',
            default_ring: 'p-1 ',
            pressed_container: 'bg-primary dark:bg-primary-d',
            pressed_text: 'text-primary-700 dark:text-primary-300 group-hover:text-primary-800 dark:group-hover:text-primary-200',
            xs: {
                rounded: 'rounded-md',
                padding: 'h-8 min-w-8 px-1.5',
                padding_icon_only: 'h-8 w-8 px-1.5',
                padding_with_title: 'h-8 px-1.5',
                icon_container: 'h-5 w-5 flex items-center justify-center',
                title_container: 'px-1 text-xs',
                icon_size: 20,
                icon_margin: 'mx-0.5', // conditional margin for icon container when title is present
                title_margin: '',
            },
            sm: {
                rounded: 'rounded-lg',
                padding: 'h-9 min-w-9 px-2',
                padding_icon_only: 'h-9 w-9 px-2',
                padding_with_title: 'h-9 px-2',
                icon_container: ' h-5 w-5 flex items-center justify-center',
                title_container: 'px-1 text-sm',
                icon_size: 20,
                icon_margin: 'mx-1', // conditional margin for icon container when title is present
                title_margin: '', // conditional margin for text container when icon is present
            },
            base: {
                rounded: 'rounded-xl',
                padding: 'h-10 min-w-10 px-2.5',
                padding_icon_only: 'h-10 w-10 px-2.5',
                padding_with_title: 'h-10 px-2.5',
                icon_container: ' h-5 w-5 flex items-center justify-center',
                title_container: 'px-1.5 text-sm',
                icon_size: 20,
                icon_margin: 'mx-1', // conditional margin for icon container when title is present
                title_margin: '', // conditional margin for text container when icon is present
            },
            lg: {
                rounded: 'rounded-xl',
                padding: 'h-14 min-w-[56px] px-3.5',
                padding_icon_only: 'h-14 w-14 px-3.5',
                padding_with_title: 'h-14 px-3.5',
                icon_container: ' h-7 w-7 flex items-center justify-center',
                title_container: 'px-3 text-lg leading-7',
                icon_size: 28,
                icon_margin: 'mx-1', // conditional margin for icon container when title is present
                title_margin: '', // conditional margin for text container when icon is present
            },
        },
        button_styles: {
            'u-btn-default-cnt':
                ' border border-bdrbutton hover:border-bdrbutton-h dark:border-bdrbutton-d dark:hover:border-bdrbutton-dh bg-bgrbutton dark:bg-bgrbutton-d web:hover:bg-bgrbutton-h dark:web:hover:bg-bgrbutton-dh overflow-hidden hover:shadow-md active:shadow-none active:opacity-60 ',
            'u-btn-default-text':
                'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-default-trans': '  web:duration-200',

            'u-btn-primary-cnt': '  bg-bgrbuttonprimary dark:bg-bgrbuttonprimary-d web:hover:bg-bgrbuttonprimary-h dark:web:hover:bg-bgrbuttonprimary-dh active:ring-2 active:ring-primary active:ring-offset-2 active:outline-none ',
            'u-btn-primary-text': 'font-medium text-white',
            'u-btn-primary-trans': '  web:duration-200',
            'u-btn-primary-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-primary-color-icon-dark': 'rgb(243, 244, 246)',

            'u-btn-accent-cnt':
                ' bg-accent-600 dark:bg-accent-600 web:hover:bg-accent-700 dark:web:hover:bg-accent-700 active:ring-2 active:ring-accent active:ring-offset-2 active:outline-none ',
            'u-btn-accent-text':
                'font-medium text-white',
            'u-btn-accent-trans': '  web:duration-300',
            'u-btn-accent-color-icon-light': 'rgb(255, 255, 255)',
            'u-btn-accent-color-icon-dark': 'rgb(255, 255, 255)',

            'u-btn-secondary-cnt':
                ' touch-manipulation bg-bgritem dark:bg-bgritem-d web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh ',
            'u-btn-secondary-text':
                'font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-secondary-trans': ' web:duration-100 ',
            'u-btn-secondary-color-icon-light': 'rgba(31,41,55,1)',
            'u-btn-secondary-color-icon-dark': 'rgba(229,231,235,1)',

            'u-btn-danger-cnt':
                'border border-transparent dark:border-transparent bg-red-600 web:hover:bg-red-500 web:hover:shadow active:opacity-50 active:shadow-none',
            'u-btn-danger-text':
                'font-medium text-neutral-100 group-hover:text-white',
            'u-btn-danger-trans': '  web:duration-300',

            'u-btn-text-cnt': 'border border-transparent dark:border-transparent bg-transparent active:opacity-50 active:bg-bgritem dark:active:bg-bgritem-d web:hover:bg-bgritem dark:web:hover:bg-bgritem-d',
            'u-btn-text-text': 'font-medium text-neutral-800 dark:text-neutral-200',
            'u-btn-text-trans': '  web:duration-300',

            'u-btn-link-cnt': 'web:hover:bg-bgritemprimary dark:web:hover:bg-bgritemprimary active:opacity-50',
            'u-btn-link-text':
                'font-semibold text-primary dark:text-primary-d',
            'u-btn-link-trans': '  web:duration-300',
            'u-btn-link-color-icon-light': 'rgba(37,99,235,1)',
            'u-btn-link-color-icon-dark': 'rgba(37,99,235,1)',

            'u-btn-outline-cnt':
                'bg-transparent border border-bdrbutton dark:border-bdrbutton-d web:hover:border-bdrbutton-h dark:web:hover:border-bdrbutton-dh active:opacity-50',
            'u-btn-outline-text':
                'font-medium text-neutral-800 dark:text-neutral-200',
            'u-btn-outline-trans': '  web:duration-300',

            'u-btn-group-item-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh active:opacity-50',
            'u-btn-group-item-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',

            'u-btn-group-item-default-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh active:opacity-50',
            'u-btn-group-item-default-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-default-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',

            'u-btn-group-item-primary-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh active:opacity-50',
            'u-btn-group-item-primary-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-primary-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',

            'u-btn-group-item-secondary-cnt':
                'border border-transparent dark:border-transparent bg-bgritem dark:bg-bgritem-d active:opacity-50 flex flex-row overflow-hidden',
            'u-btn-group-item-secondary-text':
                'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white',
            'u-btn-group-item-secondary-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',

            'u-btn-group-item-text-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgrbutton-h dark:web:hover:bg-bgrbutton-dh active:opacity-50',
            'u-btn-group-item-text-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-text-icon':
                'text-neutral-600 dark:text-neutral-400 dark:group-hover:text-neutral-50',

            'u-btn-group-item-link-cnt': '',
            'u-btn-group-item-link-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-link-icon':
                'text-primary-600 dark:text-primary-500 dark:group-hover:text-primary-400',
            'u-btn-group-item-link-pressed-cnt': 'bg-transparent',
            'u-btn-group-item-link-pressed-text':
                'text-primary-700 dark:text-neutral-600 dark:group-hover:text-primary-500',
            'u-btn-group-item-link-pressed-icon':
                'text-primary-700 dark:text-primary-600 dark:group-hover:text-primary-500',

            'u-btn-group-item-outline-cnt':
                'border border-bdritem dark:border-bdritem-d web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh active:opacity-50',
            'u-btn-group-item-outline-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-outline-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',

            'u-btn-group-item-accent-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh active:opacity-50',
            'u-btn-group-item-accent-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-accent-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',
        },
        buttons_group_styles: {
            'u-btn-default-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d bg-bgrbutton dark:bg-bgrbutton-d flex flex-row',
            'u-btn-accent-cnt':
                'border border-emerald-600 dark:border-emerald-500 bg-emerald-100 dark:bg-emerald-900 flex flex-row',
            'u-btn-outline-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d flex flex-row',

            'u-btn-text-cnt': 'flex flex-row items-center active:opacity-50',

            'u-btn-secondary-cnt':
                'border border-transparent dark:border-transparent bg-bgritem dark:bg-bgritem-d active:opacity-50 flex flex-row',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-secondary-trans': '   web:duration-300 ',

            'u-btn-link-cnt': ' border border-transparent dark:border-transparent flex flex-row active:opacity-50 items-center ',
            'u-btn-link-text':
                ' font-medium group-hover:underline text-neutral-800 dark:text-neutral-200  hover:text-neutral-950 dark:hover:text-neutral-50 active:opacity-50 ',
            'u-btn-link-trans': '   web:duration-300 ',
        },
    },
}