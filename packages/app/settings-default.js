import { env } from 'app/lib/env'

export const settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        app_origin: env('APP_ORIGIN'),

        native_app_images_url: env('APP_URL') == 'http://localhost:3000' ? 'https://neo.so' : "https://neo.so",

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
        body: ' bg-background ',
        defaults: {
            name: 'hor',
            density: 'default',
            theme: 'auto',
            lang: 'en'
        },
        avaliable_layouts: ['hor', 'ver', 'mixed'],
        avaliable_density: [
            { id: 'compact', title: 'Compact', icon: 'Minus' },
            { id: 'default', title: 'Default', icon: 'Circle' },
            { id: 'relaxed', title: 'Relaxed', icon: 'Plus' }
        ],
        avaliable_langs: ['auto', 'en', 'ru'],
        screen: ' w-full ',
        ui_density_switcher: true,
        max_width: ' w-full ',
        max_width_content: ' w-full max-w-7xl ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg
        feed_container: ' sm:p-3 mx-auto w-full max-w-4xl ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg

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

        show_login_modal: 0,
        redirect_on_forbidden: '/home',
        lock_unconfirmed: true,
        allow_create_new_profile: true,

        button_style_for_actions: 'secondary',

        share_text: '',
        default_icon_stroke_width: 2,
        tablet_mode_from: 'lg',
        show_tabbar_on_mobile_non_logged: false,

        header: {
            offset: ' h-16 w-full ',
            container: ' hidden lg:flex fixed w-full mx-auto h-16 left-[50%] translate-x-[-50%]  ',
            initial: '  my-auto w-full items-center transition-all web:duration-300 web:ease-in-out web:will-change-transform shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(31,41,55,0.5),0_2px_4px_0_rgba(0,0,0,0.05)]    ',
            scrolled: ' backdrop-blur-xl my-auto w-full mx-auto bg-card/90 backdrop-blur-xl shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(31,41,55,1),0_0_0_2px_rgba(0,0,0,0.8)] ',
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
            blocks: [
                /*  {
                      name: 'system/profile_menu/TemplServiceProfiles',
                      showTitle: false,
                      showBg: false,
                  },*/
            ]
        }
    },
    auth: {
        enabled: true,
        google: {
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

    context_selector: {
        default_item: '',
        logo: true
    },
    cover: {
        use_background: true, //appSetting('layout', 'use_background')
        aspect_ratio: 'aspect-4/1', //appSetting('layout', 'cover_aspect')
        allow_edit: true, //appSetting('layout', 'allow_edit_covers')
        fixed: false, //appSetting('layout', 'fixed_cover')
        scroll: false,
        hide_cover_for_context: false,
        split_action_menu: true, //OLD appSetting('layout', 'split_action_menu')
        back_button_url_for_profile: '/friends', //OLD appSetting('layout', 'back_for_profile')
        view_by_module: {
            //appSetting('layout', 'cover_mode'
            bx_courses: 'min',
            bx_spaces: 'max',
            bx_jobs: 'max',
        },
        show_pic_by_module: {
            bx_spaces: true,
        },
        more_menu_in_navbar: {
            bx_spaces: true,
        }
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
        sidebar_container: '',
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
        selector_control_names: ['*_cat', '*_space_cat'],

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
                pressed_container: 'bg-secondary ',
                pressed_text:
                    ' text-secondary-foreground web:group-hover:text-secondary-foreground ',
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
            { width: 768, count: 3 },
            { width: 640, count: 2 },

            /*{ width: 1280, count: 4 },
            { width: 1024, count: 3 },
            { width: 768, count: 2 },*/
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
                url: '/friends',
                icon: 'UsersRound',
            },
            {
                key: '/tab2',
                title: 'Messages',
                url: '/posts-home',
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
        },
        /* 'audit-administration':{
             gap: 4,
             sizable: true,
             cells:[
                 { key: 'cell_2', defaultSize: 50, minSize: 50, maxSize:50 },
                 { key: 'cell_3', defaultSize: 25.33, minSize: 10, breakpoint: 'md' },
                 { key: 'cell_4', defaultSize: 25.33, minSize: 10, breakpoint: 'lg' },
             ]
         }*/
        'home': {
            adjustable: true,
            sizable: true,
            cells: {
                left: { defaultSize: 25, minSize: 20, maxSize: 30, breakpoint: 'xl' },
                center: { defaultSize: 50, minSize: 40, maxSize: 60 },
                right: { defaultSize: 25, minSize: 20, maxSize: 30, breakpoint: 'lg' },
            }
        },
        'navigator': {
            adjustable: true,
            sizable: true,
            cells: {
                left: { defaultSize: 25, minSize: 20, maxSize: 30, breakpoint: 'lg' },
                center: { defaultSize: 75, minSize: 70, maxSize: 80 },
            }
        },
        'view-persons-profile': {
            adjustable: true,
            sizable: true,
            cells: {
                left: { defaultSize: 25, minSize: 20, maxSize: 30, breakpoint: 'md' },
                center: { defaultSize: 50, minSize: 40, maxSize: 60 },
                right: { defaultSize: 25, minSize: 20, maxSize: 30, breakpoint: 'lg' },
            }
        },
        'view-group-profile': {
            adjustable: true,
            sizable: true,
            cells: {
                center: { defaultSize: 60, minSize: 50, maxSize: 70 },
                right: { defaultSize: 40, minSize: 30, maxSize: 50, breakpoint: 'lg' },
            }
        }
    },
    theme: {
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
            safeAreaBackground: 'rgba(255,255,255,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
           
        },
        dark: {
            default: 'rgba(209,213,219,1)', //fix for icons color in iOS
            primary: 'rgba(59, 130, 246, 1)',
            outline: 'rgba(59, 130, 246, 0.5)',
            headerBackground: 'rgba(17,24,39,1)',
            barsBackground: 'rgba(17,24,39,1)', //header background in native
            bottomSheetBackground: 'rgba(17,24,39,1)',
            barsColor: 'rgba(209,213,219,1)', //tabbar icons color in native
            safeAreaBackground: 'rgba(17,24,39,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
            
        },
        dropdown: {
            cnt: ' rounded-2xl overflow-hidden p-1 bg-card z-50 border border-border ',
        },
        conductor: {
            menu: '   w-full items-left justify-center  ',
            menu_max_width: ' w-full max-w-7xl ',
            content_max_width: ' w-full max-w-7xl ',
            menu_is_dynamic: true,
            menu_cnt: ' flex-row flex-none  ',
            menu_categ_ident: 'pl-12',
            right_column_cnt: 'fixed-process px-1.5 sm:px-2 py-4',
            right_column_cnt2: 'hidden xl:flex flex-auto max-w-sm',

            left_column_cnt: 'fixed-process px-1.5 sm:px-2 py-4',
            left_column_cnt2: 'hidden xl:flex flex-auto max-w-sm',

            topmenu_cnt:
                'w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex p',
            topmenu_button_variant: 'secondary',
            topmenu_button_variant_active: 'secondary',
            topmenu_button_align: 'start',
            topmenu_button_fullWidth: false,
            topmenu_button_size: 'base',
            topmenu_button_pressed: true,
            left_menu_cnt: '  ',
            cover_base: 'w-full shadow-sm bg-gradient-to-b from-background to-card',
            cover_content: "items-center h-full w-full overflow-hidden justify-between"
        },
       /* checkbox: {
            container:
                ' h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center   ',
            selected: ' h-2.5 w-2.5 rounded-xs bg-primary m-1 items-center justify-center',
            text: '  text-neutral-800 dark:text-neutral-200 text-base leading-5 font-medium pl-2 ',
        },*/
        checkbox_set: {
            container: ' gap-x-2 items-center',
        },
        /*switcher: {
            container: 'items-center flex flex-row-reverse justify-between gap-x-2 items-center h-14 min-w-14 rounded-xl flex-auto  p-3  bg-neutral-50 border border-neutral-200  hover:border-neutral-300 focus:border-primary dark:bg-neutral-900 overflow-hidden  dark:border-neutral-800 dark:hover:border-neutral-700  focus:bg-bgrinput-f dark:focus:bg-neutral-950    web:duration-300  placeholder-neutral-500   ',
            text: ' text-neutral-800 dark:text-neutral-200  text-base ',
            track: 'item-center rounded-full ',
            thumb: ' rounded-full aspect-square bg-white',
            track_color: 'bg-neutral-400 dark:bg-neutral-600 ',
            active_track_color: 'bg-primary',
            size_base: ['w-20 h-8 p-1 ', 'h-6 w-6'],
            size_sm: ['w-10 h-4 p-0.5 ', 'h-3 w-3'],
        },*/
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
                ' web:group flex flex-row h-12 items-center p-1.5 text-sm rounded-xl font-medium web:hover:bg-bgritem web:dark:hover:bg-bgritem-d text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 web:hover:cursor-pointer',
            item_hor:
                'flex block p-1.5 web:hover:-translate-y-1  web:dark:hover:text-white rounded-full web:hover:cursor-pointer text-neutral-700  web:hover:scale-125 active:scale-95   web:duration-200 dark:text-neutral-300 outline-none ',
            item_np:
                'flex flex-row web:focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium web:hover:bg-bgritem web:dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-300 web:dark:hover:text-white web:hover:cursor-pointer',
            item_cnt: 'items-center w-full',
            item_text:
                ' text-base web:text-sm leading-8 px-3 font-medium text-neutral-800 dark:text-neutral-200',
            item_icon:
                'flex items-center w-9 h-9 bg-bgritem dark:bg-bgritem-d web:group-hover:bg-bgritem-h web:dark:group-hover:bg-bgritem-dh rounded-full justify-center',
            icon_size: 20, // Default icon size for dropdown menu icons
        },
        modal: {
            fog: 'bg-background/50 backdrop-blur-xl ',
            container:
                ' h-full sm:h-auto shadow-lg bg-card sm:rounded-2xl sm:border border-border overflow-hidden ',
            content: ' h-auto ',
            header: ' p-3 items-start justify-start border-b border-border',
        },

        inputs: {
            default:
                'h-14 min-w-14 rounded-xl flex-auto ' +
                'px-3 py-3 text-base ' +
                'bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d ' +
                'web:hover:border-bdrinput-h web:dark:hover:border-bdrinput-dh ' +
                'web:focus:border-bdrinput-f web:dark:focus:border-bdrinput-df ' +
                'web:focus:bg-bgrinput-f web:dark:focus:bg-bgrinput-df ' +
                'overflow-hidden   web:duration-300 ' +
                'placeholder-neutral-500 ' +
                'text-neutral-800 dark:text-neutral-200 ' +
                'web:focus:text-neutral-900 web:dark:focus:text-neutral-100',
            multi: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d web:focus:bg-bgrinput-f web:focus:outline-none  web:focus:border-bdrinput-f web:dark:focus:border-bdrinput-df  text-neutral-900 rounded-xl flex-auto px-3 py-3 web:dark:focus:bg-bgrinput-df dark:text-neutral-100 text-base leading-5 ',
            rounded:
                ' h-12 rounded-full flex-auto px-3 py-[11px] text-base bg-bgrinput dark:bg-bgrinput-d hover:border-bdrinput-h focus:border-bdrinput-f overflow-hidden border border-bdrinput web:focus:bg-bgrinput-f dark:border-bdrinput-d web:dark:focus:border-bdrinput-d web:dark:focus:bg-bgrinput-df web:focus:border-bdrinput-f web:dark:focus:border-bdrinput-df   web:duration-300 placeholder-neutral-500 text-neutral-800 dark:text-neutral-200 ',
            roundedsmall:
                ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[34px] ',
            small: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-9 ',
            select: 'appearance-none pr-10 bg-bgrinput h-14 border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-xl  flex-auto p-3 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus dark:text-neutral-100 text-base',
        },

        button_sizes: {
            default_size: 'base',
            default_variant: 'default',
            default_ring: 'p-1 ',
            pressed_container: 'bg-primary/10 border-primary/20',
            pressed_text: 'text-primary font-medium',
            xs: {
                rounded: 'rounded-md',
                padding: 'h-6 min-w-6 px-2',
                padding_icon_only: 'h-6 w-6 px-1',
                padding_with_title: 'h-6 px-1.5',
                icon_container: ' h-5 w-5 flex items-center justify-center',
                title_container: 'px-1 text-xs ',
                icon_size: 16,
                icon_margin: 'mx-0', // conditional margin for icon container when title is present
                title_margin: '',
            },
            sm: {
                rounded: 'rounded-lg',
                padding: 'h-9 min-w-9 px-2',
                padding_icon_only: 'h-9 w-9 px-2',
                padding_with_title: 'h-9 px-3',
                icon_container: ' h-5 w-5 flex items-center justify-center',
                title_container: 'px-1.5 text-sm',
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
                padding: 'h-14 min-w-[56px] px-3',
                padding_icon_only: 'h-14 w-14 px-3.5',
                padding_with_title: 'h-14 px-3.5',
                icon_container: ' h-7 w-7 flex items-center justify-center',
                title_container: 'px-3 text-lg leading-7',
                icon_size: 28,
                icon_margin: 'mx-1', // conditional margin for icon container when title is present
                title_margin: '', // conditional margin for text container when icon is present
            },
        },
        offsets: {
            'gap-lg': 'gap-4 sm:gap-6',
            'gap-md': 'gap-2 sm:gap-3 lg:gap-4',
            'gap-sm': 'gap-1.5 sm:gap-2 lg:gap-3',
            'gap-xs': 'gap-1 sm:gap-1.5',
            'm-lg': 'm-3 sm:m-4 lg:m-6',
            'mb-lg': 'mb-6 sm:mb-8',
            'mb-md': 'mb-3 sm:mb-4',
            'mb-sm': 'mb-2 sm:mb-3',
            'p-lg': 'p-4 lg:p-6',
            'p-md': 'p-3 lg:p-4',
            'p-sm': 'p-2',
            'p-xs': 'p-1',
            'pb-lg': 'pb-4',
            'pb-md': 'pb-3',
            'pb-sm': 'pb-2',
            'pt-lg': 'pt-4',
            'pt-md': 'pt-3',
            'pt-sm': 'pt-2',
            'px-lg': 'px-4',
            'px-md': 'px-3',
            'px-sm': 'px-2',
            'py-lg': 'py-3 sm:py-4 lg:py-6',
            'py-md': 'py-3 sm:py-4',
            'py-sm': 'py-2 sm:py-3',
            'w-lg': 'w-4 lg:w-6 xl:w-8',
            'w-md': 'w-3 lg:w-4 xl:w-6',
            'w-sm': 'w-2 lg:w-3 xl:w-4',
        },
        cards: {
            'u-card-list': 'u-card-list bg-card shadow-sm text-card-foreground sm:border border-input sm:shadow-sm sm:rounded-2xl mb-[1px] sm:mb-3 ',
            'u-card-list-padding': 'p-3 lg:p-4',
            'u-card-base': ' u-card-base bg-card shadow-sm text-card-foreground border border-input shadow-sm gap-y-3 sm:gap-y-4 lg:gap-y-6 gap-x-3 sm:gap-x-4 lg:gap-x-6 rounded-2xl',            
            'u-card-padding': 'py-3 sm:py-4 lg:py-6 ',
            'u-card-header': 'flex px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-card-icon': 'text-card-foreground px-4 gap-y-2 gap-x-3',
            'u-card-title': 'text-card-foreground text-xl lg:text-2xl font-bold leading-none lg:leading-none tracking-tight',
            'u-card-description': 'text-muted-foreground text-sm lg:text-base',
            'u-card-content': 'text-card-foreground px-4 gap-y-3',
            'u-card-footer': 'flex text-card-foreground px-4 gap-y-2 gap-x-3',
        },
        panels: {
            'u-panel-base': 'm-0 gap-y-4',
            'u-panel-handler': '',
            'u-panel-line': 'w-1 mx-1.5 group-active:w-1 web:group-hover:w-1 web:group-active:w-sm h-full web:transition-all web:duration-300 web:ease-in-out web:group-hover:bg-muted web:group-active:bg-muted ',
            'u-panel-group': 'flex',
        },
        blocks: {
            'u-block-base': 'bg-card u-max-width-block border border-input text-card-foreground py-3 sm:py-4 lg:py-6 gap-3 lg:gap-4  rounded-2xl',
            'u-block-header': 'flex flex-row items-center px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-icon': 'text-card-foreground',
            'u-block-name': 'flex flex-col flex-auto gap-y-2 gap-x-4',
            'u-block-title': 'text-card-foreground text-xl lg:text-2xl font-bold leading-none lg:leading-none tracking-tight',
            'u-block-description': 'text-muted-foreground text-sm lg:text-base',
            'u-block-content': 'text-card-foreground px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-footer': 'flex text-card-foreground px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-actions': 'flex flex-row text-card-foreground mb-auto gap-x-2 sm:gap-x-3 lg:gap-x-4',
        },
        badges: {
            
            'u-badge-base': 'flex items-center border transition-colors web:focus:outline-none web:focus:ring-ring px-2 py-1 rounded-full',
            'u-badge-default': 'border-transparent bg-primary text-primary-foreground shadow web:hover:bg-primary/80',
            'u-badge-destructive': 'border-transparent bg-destructive text-destructive-foreground shadow web:hover:bg-destructive/80',
            'u-badge-outline': 'border-border',
            'u-badge-accent': 'border-transparent bg-accent text-accent-foreground shadow web:hover:bg-accent/80',
            'u-badge-secondary': 'border-transparent bg-secondary text-secondary-foreground web:hover:bg-secondary/80',
            'u-badge-text': 'text-sm inline-flex gap-1.5 sm:gap-2 lg:gap-3 font-semibold',
            'u-badge-text-default': 'text-primary-foreground',
            'u-badge-text-accent': 'text-accent-foreground',
            'u-badge-text-destructive': 'text-destructive-foreground',
            'u-badge-text-outline': 'text-muted-foreground',
            'u-badge-text-secondary': 'text-secondary-foreground',
        },
        tables: {
            // Base
            'u-table-base': 'w-full border border-border bg-transparent border-collapse overflow-hidden rounded-lg',
            'u-table-header': 'border-border',
            'u-table-body': 'border-border',
            'u-table-footer': 'bg-muted/50 font-medium',
            'u-table-row': 'flex overflow-hidden flex-row border-border border-b web:transition-colors web:hover:bg-muted/50 web:data-[state=selected]:bg-muted',
            'u-table-head': 'text-muted-foreground text-left justify-center font-medium flex-1 h-12 px-4 text-sm',
            'u-table-cell': ' flex-row items-center text-foreground px-3 text-sm py-2',
            'u-table-head-text': 'text-muted-foreground font-semibold tracking-tight leading-tight text-sm',
            'u-table-cell-text': 'text-foreground text-sm',
        },
        tabs: {
            // Container
            'u-controls-tabs-container': 'w-full flex-col overflow-scroll',

            // Header (use with inline styles or Tailwind plugin for scroll)
            'u-controls-tabs-header': 'flex flex-1 flex-row flex-nowrap overflow-x-auto overflow-y-hidden gap-1 bg-muted p-0.5 mb-3 sm:mb-4 lg:mb-6 rounded-full web:scrollbar-none ',
            
            // Header item base (shared styles without hover)
            'u-controls-tabs-header-item': 'flex rounded-full px-3 py-2 text-sm flex-1 justify-center max-w-[100px]  items-center whitespace-nowrap font-medium ring-offset-muted  truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring  disabled:pointer-events-none disabled:opacity-50 ',

            // Inactive tab (with hover effect)
            'u-controls-tabs-header-item-inactive': ' web:hover:bg-muted',

            // Active tab (no hover effect)
            'u-controls-tabs-header-item-active': 'bg-card shadow-sm text-accent-foreground ',

            // Header item text
            'u-controls-tabs-header-item-text': 'text-muted-foreground font-medium whitespace-nowrap truncate',
            'u-controls-tabs-header-item-text-active': 'text-card-foreground font-medium whitespace-nowrap truncate',

            // Tab content
            'u-controls-tabs-tab-content': 'w-full',
            'u-controls-tabs-tab-content-animated': 'web:animate-[tabContentFadeIn_0.2s_ease-out]'
        },
        switcher: {
            // Container
            'u-controls-switcher-container': 'items-center flex-row-reverse justify-between gap-x-2 h-14 min-w-14 rounded-xl flex-auto p-3 bg-input border border-border flex',

            // Text
            'u-controls-switcher-text': 'text-neutral-800 dark:text-neutral-200 text-base',

            // Track
            'u-controls-switcher-track': 'rounded-full',
            'u-controls-switcher-track-base': 'w-20 h-8 p-1',
            'u-controls-switcher-track-sm': 'w-10 h-4 p-0.5',

            // Thumb
            'u-controls-switcher-thumb': 'rounded-full aspect-square bg-white web:transition-transform web:duration-200',
            'u-controls-switcher-thumb-base': 'h-6 w-6',
            'u-controls-switcher-thumb-sm': 'h-3 w-3',

            // Active Thumb Position
            'u-controls-switcher-thumb-active-base': 'translate-x-12',
            'u-controls-switcher-thumb-active-sm': 'translate-x-6',

            // Track Colors
            'u-controls-switcher-track-col': 'bg-neutral-400 dark:bg-neutral-600',
            'u-controls-switcher-track-active-col': 'bg-primary'
        },
        checkbox: {
            // Container
            'u-controls-checkbox-container': 'items-center py-2 px-3 rounded-lg w-full',

            // Hover & Active backgrounds (optional — Web-only)
            'u-controls-checkbox-container-bg': 'web:active:bg-neutral-200 web:dark:active:bg-neutral-700 web:hover:bg-neutral-100 web:dark:hover:bg-neutral-800',

            // Text labels
            'u-controls-checkbox-text': 'text-neutral-800 dark:text-neutral-200 text-base leading-5 font-medium pl-2',
            'u-controls-checkbox-text2': 'text-neutral-600 dark:text-neutral-400 text-sm leading-5',

            // Icon (e.g. if checkbox is custom-rendered)
            'u-controls-checkbox-icon': 'text-neutral-600 dark:text-neutral-400 my-auto h-6 w-6',

            // Checkbox square indicator
            'u-controls-checkbox-indicator': 'h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

            // Radiobutton circular indicator
            'u-controls-radiobutton-indicator': 'h-5 w-5 m-1 rounded-full border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

            // Active mark inside checkbox (filled square)
            'u-controls-checkbox-indicator-active': 'h-2.5 w-2.5 bg-primary m-1 items-center justify-center',

            // Active mark inside radiobutton (filled circle)
            'u-controls-radiobutton-indicator-active': 'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center'
        },

        button_styles: {
            'u-btn-default-cnt':
                ' border border-input bg-card web:hover:bg-accent shadow-sm web:active:shadow-none web:active:opacity-60 ',
            'u-btn-default-text':
                'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-default-trans': '  web:duration-200',


            'u-btn-primary-cnt': '  bg-bgrbuttonprimary dark:bg-bgrbuttonprimary-d web:hover:bg-bgrbuttonprimary-h dark:web:hover:bg-bgrbuttonprimary-dh web:active:ring-2 web:active:ring-primary web:active:ring-offset-2 web:active:outline-none ',
            'u-btn-primary-text': 'font-medium text-white',
            'u-btn-primary-trans': '  web:duration-200',

            'u-btn-accent-cnt':
                ' bg-accent-600 dark:bg-accent-600 web:hover:bg-accent-700 dark:web:hover:bg-accent-700 web:active:ring-2 web:active:ring-accent web:active:ring-offset-2 web:active:outline-none ',
            'u-btn-accent-text':
                'font-medium text-white',
            'u-btn-accent-trans': '  web:duration-300',

            'u-btn-secondary-cnt':
                ' border border-transparent bg-secondary web:hover:bg-accent web:active:bg-muted  ',
            'u-btn-secondary-text':
                'font-medium text-muted-foreground web:hover:text-foreground  ',
            'u-btn-secondary-trans': ' web:duration-100 ',
            
            'u-btn-danger-cnt':
                'border border-transparent dark:border-transparent bg-red-600 web:hover:bg-red-500 web:hover:shadow web:active:opacity-50 web:active:shadow-none',
            'u-btn-danger-text':
                'font-medium text-neutral-100 group-hover:text-white',
            'u-btn-danger-trans': '  web:duration-300',

            'u-btn-text-cnt': ' border border-transparent dark:border-transparent bg-transparent web:active:opacity-50 web:active:bg-bgritem web:dark:active:bg-bgritem-d web:hover:bg-bgritem dark:web:hover:bg-bgritem-d',
            'u-btn-text-text': 'font-medium text-neutral-800 dark:text-neutral-200',
            'u-btn-text-trans': '  web:duration-300',


            'u-btn-link-cnt': 'web:hover:bg-bgritemprimary dark:web:hover:bg-bgritemprimary web:active:opacity-50',
            'u-btn-link-text': 'font-semibold text-primary',
            'u-btn-link-trans': '  web:duration-300',

            'u-btn-outline-cnt': 'bg-transparent border border-bdrbutton dark:border-bdrbutton-d web:hover:border-bdrbutton-h dark:web:hover:border-bdrbutton-dh web:active:opacity-50',
            'u-btn-outline-text':'font-medium text-neutral-800 dark:text-neutral-200',
            'u-btn-outline-trans': '  web:duration-300',

            'u-btn-group-item-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-default-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-default-text': 'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-default-icon': 'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-primary-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-primary-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-primary-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-secondary-cnt':
                'border border-transparent dark:border-transparent bg-bgritem dark:bg-bgritem-d web:ctive:opacity-50 flex flex-row overflow-hidden',
            'u-btn-group-item-secondary-text':
                'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white',
            'u-btn-group-item-secondary-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-text-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgrbutton-h dark:web:hover:bg-bgrbutton-dh web:active:opacity-50',
            'u-btn-group-item-text-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-text-icon':
                'text-neutral-600 dark:text-neutral-400 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-link-cnt': '',
            'u-btn-group-item-link-text':
                'font-medium text-muted-foreground web:hover:text-foreground web:active:text-foreground  ',
            'u-btn-group-item-link-icon':
                'text-primary dark:text-primary web:dark:group-hover:text-primary',
            'u-btn-group-item-link-pressed-cnt': 'bg-primary/10 ',
            'u-btn-group-item-link-pressed-text':
                'text-primary',
            'u-btn-group-item-link-pressed-icon':
                'text-primary',

            'u-btn-group-item-outline-cnt':
                'border border-bdritem dark:border-bdritem-d web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-outline-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-outline-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-accent-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-accent-text':
                'font-medium text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-50',
            'u-btn-group-item-accent-icon':
                'text-neutral-700 dark:text-neutral-300 dark:group-hover:text-neutral-50',

            'u-btn-badge-cnt':
                ' bg-primary/20 ',
            'u-btn-badge-text':
                'font-medium text-primary dark:text-primary',
            'u-btn-badge-trans': '  web:duration-200',

            'u-btn-label-cnt':
                'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 web:hover:bg-neutral-100 dark:web:hover:bg-neutral-800 web:active:opacity-70',
            'u-btn-label-text':
                'font-normal text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 dark:web:hover:text-neutral-200',
            'u-btn-label-trans': '  web:duration-200',
        },
        buttons_group_styles: {
            'u-btn-default-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d bg-bgrbutton dark:bg-bgrbutton-d flex flex-row',
            'u-btn-accent-cnt':
                'border border-emerald-600 dark:border-emerald-500 bg-emerald-100 dark:bg-emerald-900 flex flex-row',
            'u-btn-outline-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d flex flex-row',

            'u-btn-text-cnt': 'flex flex-row items-center web:active:opacity-50',

            'u-btn-secondary-cnt':
                'border border-transparent dark:border-transparent bg-bgritem dark:bg-bgritem-d web:active:opacity-50 flex flex-row',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white ',
            'u-btn-secondary-trans': '   web:duration-300 ',

            'u-btn-link-cnt': ' border border-transparent dark:border-transparent flex flex-row active:opacity-50 items-center ',
            'u-btn-link-text':
                ' font-medium web:group-hover:underline text-neutral-800 dark:text-neutral-200  web:hover:text-neutral-950 web:dark:hover:text-neutral-50 web:active:opacity-50 ',
            'u-btn-link-trans': '   web:duration-300 ',

            'u-btn-badge-cnt': 'border border-transparent dark:border-transparent bg-neutral-100 dark:bg-neutral-800 flex flex-row web:active:opacity-60',
            'u-btn-badge-text':
                ' font-medium text-xs text-neutral-700 dark:text-neutral-300 ',
            'u-btn-badge-trans': '   web:duration-200 ',

            'u-btn-label-cnt': 'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex flex-row web:active:opacity-70',
            'u-btn-label-text':
                ' font-normal text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 ',
            'u-btn-label-trans': '   web:duration-200 ',
        },
    },
}