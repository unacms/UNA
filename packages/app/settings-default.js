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
            initial: '  my-auto w-full items-center transition-all web:duration-300 ease-in-out will-change-transform shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(31,41,55,0.5),0_2px_4px_0_rgba(0,0,0,0.05)]    ',
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
                pressed_container: 'bg-primary/20 ',
                pressed_text:
                    ' text-primary group-hover:text-primary ',
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
                url: '/friends',
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
        checkbox: {
            container:
                ' h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center   ',
            selected: ' h-2.5 w-2.5 rounded-xs bg-primary m-1 items-center justify-center',
            text: '  text-neutral-800 dark:text-neutral-200 text-base leading-5 font-medium pl-2 ',
        },
        checkbox_set: {
            container: '  gap-x-2 items-center',
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
            fog: 'bg-background/50 backdrop-blur-xl ',
            container:
                ' h-full sm:h-auto shadow-xl bg-card sm:rounded-2xl sm:border border-border overflow-hidden ',
            content: ' h-auto ',
            header: ' p-3 items-start justify-start border-b border-border',
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
            pressed_container: 'bg-primary/20',
            pressed_text: 'text-primary dark:text-primary font-medium group-hover:text-primary dark:group-hover:text-primary',
            xs: {
                rounded: 'rounded-md',
                padding: 'h-8 min-w-8 px-2',
                padding_icon_only: 'h-8 w-8 px-2',
                padding_with_title: 'h-8 px-2',
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
            'gap-lg-compact': 'gap-3 sm:gap-4',
            'gap-lg-default': 'gap-4 sm:gap-6',
            'gap-lg-relaxed': 'gap-6 sm:gap-8',
            'gap-md-compact': 'gap-1 sm:gap-2 lg:gap-3',
            'gap-md-default': 'gap-2 sm:gap-3 lg:gap-4',
            'gap-md-relaxed': 'gap-3 sm:gap-4 lg:gap-6',
            'gap-sm-compact': 'gap-1 sm:gap-1.5 lg:gap-2',
            'gap-sm-default': 'gap-1.5 sm:gap-2 lg:gap-3',
            'gap-sm-relaxed': 'gap-2 sm:gap-3 lg:gap-4',
            'gap-xs-compact': 'gap-0.5 sm:gap-1',
            'gap-xs-default': 'gap-1 sm:gap-1.5',
            'gap-xs-relaxed': 'gap-1.5 sm:gap-2',
            'm-lg-compact': 'm-2 sm:m-3 lg:m-4',
            'm-lg-default': 'm-3 sm:m-4 lg:m-6',
            'm-lg-relaxed': 'm-4 sm:m-6 lg:m-8',
            'mb-lg-compact': 'mb-3 sm:mb-4',
            'mb-lg-default': 'mb-6 sm:mb-8',
            'mb-lg-relaxed': 'mb-6 sm:mb-8',
            'mb-md-compact': 'mb-2 sm:mb-3',
            'mb-md-default': 'mb-3 sm:mb-4',
            'mb-md-relaxed': 'mb-4 sm:mb-6',
            'mb-sm-compact': 'mb-1 sm:mb-2',
            'mb-sm-default': 'mb-2 sm:mb-3',
            'mb-sm-relaxed': 'mb-3 sm:mb-4',
            'p-lg-compact': 'p-3 lg:p-4',
            'p-lg-default': 'p-4 lg:p-6',
            'p-lg-relaxed': 'p-6 lg:p-8',
            'p-md-compact': 'p-2 lg:p-3',
            'p-md-default': 'p-3 lg:p-4',
            'p-md-relaxed': 'p-4 lg:p-6',
            'p-sm-compact': 'p-1',
            'p-sm-default': 'p-2',
            'p-sm-relaxed': 'p-3',
            'p-xs-default': 'p-1',
            'pb-lg-compact': 'pb-2',
            'pb-lg-default': 'pb-4',
            'pb-lg-relaxed': 'pb-6',
            'pb-md-compact': 'pb-2',
            'pb-md-default': 'pb-3',
            'pb-md-relaxed': 'pb-4',
            'pb-sm-compact': 'pb-1',
            'pb-sm-default': 'pb-2',
            'pb-sm-relaxed': 'pb-3',
            'pt-lg-compact': 'pt-2',
            'pt-lg-default': 'pt-4',
            'pt-lg-relaxed': 'pt-6',
            'pt-md-compact': 'pt-2',
            'pt-md-default': 'pt-3',
            'pt-md-relaxed': 'pt-4',
            'pt-sm-compact': 'pt-1',
            'pt-sm-default': 'pt-2',
            'pt-sm-relaxed': 'pt-3',
            'px-lg-compact': 'px-2',
            'px-lg-default': 'px-4',
            'px-lg-relaxed': 'px-6',
            'px-md-compact': 'px-2',
            'px-md-default': 'px-3',
            'px-md-relaxed': 'px-4',
            'px-sm-compact': 'px-1',
            'px-sm-default': 'px-2',
            'px-sm-relaxed': 'px-3',
            'py-lg-compact': 'py-2 sm:py-3 lg:py-4',
            'py-lg-default': 'py-3 sm:py-4 lg:py-6',
            'py-lg-relaxed': 'py-4 sm:py-6 lg:py-8',
            'py-md-compact': 'py-2',
            'py-md-default': 'py-3',
            'py-md-relaxed': 'py-4',
            'py-sm-compact': 'py-1',
            'py-sm-default': 'py-2',
            'py-sm-relaxed': 'py-3',
            'w-lg-compact': 'w-3 lg:w-4 xl:w-6',
            'w-lg-default': 'w-4 lg:w-6 xl:w-8',
            'w-lg-relaxed': 'w-6 lg:w-8 xl:w-10',
            'w-md-compact': 'w-2 lg:w-3 xl:w-4',
            'w-md-default': 'w-3 lg:w-4 xl:w-6',
            'w-md-relaxed': 'w-4 lg:w-6 xl:w-8',
            'w-sm-compact': 'w-1 lg:w-2 xl:w-3',
            'w-sm-default': 'w-2 lg:w-3 xl:w-4',
            'w-sm-relaxed': 'w-3 lg:w-4 xl:w-6'
        },
        cards: {
            'u-card-base': 'bg-card shadow-sm text-card-foreground border border-border shadow-sm ',

            // Base Variants
            'u-card-base-compact':
                'gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4 rounded-xl',
            'u-card-base-default':
                'gap-y-3 sm:gap-y-4 lg:gap-y-6 gap-x-3 sm:gap-x-4 lg:gap-x-6 rounded-2xl',
            'u-card-base-relaxed':
                'gap-y-5 sm:gap-y-6 lg:gap-y-8 gap-x-5 sm:gap-x-6 lg:gap-x-8 rounded-3xl',

            // Paddings Variants
            'u-card-padding-compact':
                'py-2 sm:py-3 lg:py-4 ',
            'u-card-padding-default':
                'py-3 sm:py-4 lg:py-6 ',
            'u-card-padding-relaxed':
                'py-5 sm:py-6 lg:py-8 ',

            // Header
            'u-card-header': 'flex',
            'u-card-header-compact':
                'px-2 sm:px-3 lg:px-4 gap-y-1 sm:gap-y-2 lg:gap-y-3 gap-x-1 sm:gap-x-2 lg:gap-x-3',
            'u-card-header-default':
                'px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-card-header-relaxed':
                'px-4 sm:px-6 lg:px-8 gap-y-3 sm:gap-y-4 lg:gap-y-6 gap-x-3 sm:gap-x-4 lg:gap-x-6',

            // Icon
            'u-card-icon': 'text-card-foreground',
            'u-card-icon-compact': 'px-3 gap-y-1 gap-x-2',
            'u-card-icon-default': 'px-4 gap-y-2 gap-x-3',
            'u-card-icon-relaxed': 'px-6 gap-y-3 gap-x-4',

            // Title
            'u-card-title': 'text-card-foreground',
            'u-card-title-compact':
                'text-lg lg:text-xl font-bold leading-none lg:leading-none tracking-tight',
            'u-card-title-default':
                'text-xl lg:text-2xl font-bold leading-none lg:leading-none tracking-tight',
            'u-card-title-relaxed':
                'text-2xl lg:text-3xl font-bold leading-none lg:leading-none tracking-tight',

            // Description
            'u-card-description': 'text-muted-foreground ',
            'u-card-description-compact': 'text-xs lg:text-sm ',
            'u-card-description-default': 'text-sm lg:text-base ',
            'u-card-description-relaxed': 'text-base lg:text-lg leading-none',

            // Content
            'u-card-content': 'text-card-foreground ',
            'u-card-content-compact': 'px-3 gap-y-2',
            'u-card-content-default': 'px-4 gap-y-3',
            'u-card-content-relaxed': 'px-6 gap-y-4',

            // Footer
            'u-card-footer': 'flex text-card-foreground',
            'u-card-footer-compact': 'px-3 gap-y-1.5 gap-x-2',
            'u-card-footer-default': 'px-4 gap-y-2 gap-x-3',
            'u-card-footer-relaxed': 'px-6 gap-y-3 gap-x-4'
        },
        panels: {
            // Panel Base
            'u-panel-base': 'mx-0',
            'u-panel-base-compact': 'm-0 gap-y-3',
            'u-panel-base-default': 'm-0 gap-y-4',
            'u-panel-base-relaxed': 'm-0 lg:m-6 gap-y-6',

            // Panel Handler
            'u-panel-handler': 'w-1 h-full',

            // Handler Variants (same as base)
            'u-panel-handler-compact': '',
            'u-panel-handler-default': '',
            'u-panel-handler-relaxed': '',

            // Panel Line
            'u-panel-line':
                'w-1 mx-1.5 group-active:w-1 group-hover:w-1 group-active:w-sm h-full transition-all duration-300 ease-in-out group-hover:bg-muted group-active:bg-muted ',

            // Panel Group
            'u-panel-group': 'flex',

            // Group Variants (same as base)
            'u-panel-group-compact': '',
            'u-panel-group-default': '',
            'u-panel-group-relaxed': ''
        },
        blocks: {
            'u-block-base-compact': 'bg-card u-max-width-block  text-card-foreground py-2 sm:py-3 lg:py-4 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4 rounded-xl',
            'u-block-base-default': 'bg-card u-max-width-block  text-card-foreground py-3 sm:py-4 lg:py-6 gap-2 sm:gap-3 lg:gap-4 rounded-2xl',
            'u-block-base-relaxed': 'bg-card u-max-width-block  text-card-foreground py-5 sm:py-6 lg:py-8 gap-y-5 sm:gap-y-6 lg:gap-y-8 gap-x-5 sm:gap-x-6 lg:gap-x-8 rounded-3xl',

            'u-block-header': 'flex flex-row items-center',
            'u-block-header-compact': 'flex flex-row items-center px-2 sm:px-3 lg:px-4 gap-y-1 sm:gap-y-2 lg:gap-y-3 gap-x-1 sm:gap-x-2 lg:gap-x-3',
            'u-block-header-default': 'flex flex-row items-center px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-header-relaxed': 'flex flex-row items-center px-4 sm:px-6 lg:px-8 gap-y-3 sm:gap-y-4 lg:gap-y-6 gap-x-3 sm:gap-x-4 lg:gap-x-6',

            'u-block-icon': 'text-card-foreground',
            'u-block-icon-compact': 'text-card-foreground',
            'u-block-icon-default': 'text-card-foreground',
            'u-block-icon-relaxed': 'text-card-foreground',

            'u-block-name': 'flex flex-col flex-auto',
            'u-block-name-compact': 'flex flex-col flex-auto gap-y-1 gap-x-3',
            'u-block-name-default': 'flex flex-col flex-auto gap-y-2 gap-x-4',
            'u-block-name-relaxed': 'flex flex-col flex-auto gap-y-3 gap-x-6',

            'u-block-title': 'text-card-foreground',
            'u-block-title-compact': 'text-card-foreground text-lg lg:text-xl font-bold leading-none lg:leading-none tracking-tight',
            'u-block-title-default': 'text-card-foreground text-xl lg:text-2xl font-bold leading-none lg:leading-none tracking-tight',
            'u-block-title-relaxed': 'text-card-foreground text-2xl lg:text-3xl font-bold leading-none lg:leading-none tracking-tight',

            'u-block-description': 'text-muted-foreground',
            'u-block-description-compact': 'text-muted-foreground text-xs lg:text-sm',
            'u-block-description-default': 'text-muted-foreground text-sm lg:text-base',
            'u-block-description-relaxed': 'text-muted-foreground text-base lg:text-lg',

            'u-block-content': 'text-card-foreground',
            'u-block-content-compact': 'text-card-foreground px-2 sm:px-3 lg:px-4 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-1 sm:gap-x-2 lg:gap-x-3',
            'u-block-content-default': 'text-card-foreground px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-content-relaxed': 'text-card-foreground px-4 sm:px-6 lg:px-8 gap-y-3 sm:gap-y-4 lg:gap-y-6 gap-x-3 sm:gap-x-4 lg:gap-x-6',

            'u-block-footer': 'flex text-card-foreground',
            'u-block-footer-compact': 'flex text-card-foreground px-2 sm:px-3 lg:px-4 gap-y-1 sm:gap-y-2 lg:gap-y-3 gap-x-1 sm:gap-x-2 lg:gap-x-3',
            'u-block-footer-default': 'flex text-card-foreground px-3 sm:px-4 lg:px-6 gap-y-2 sm:gap-y-3 lg:gap-y-4 gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-footer-relaxed': 'flex text-card-foreground px-4 sm:px-6 lg:px-8 gap-y-3 sm:gap-y-4 lg:gap-y-6 gap-x-3 sm:gap-x-4 lg:gap-x-6',

            'u-block-actions': 'flex flex-row text-card-foreground mb-auto',
            'u-block-actions-compact': 'flex flex-row text-card-foreground mb-auto gap-x-1 sm:gap-x-2 lg:gap-x-3',
            'u-block-actions-default': 'flex flex-row text-card-foreground mb-auto gap-x-2 sm:gap-x-3 lg:gap-x-4',
            'u-block-actions-relaxed': 'flex flex-row text-card-foreground mb-auto gap-x-3 sm:gap-x-4 lg:gap-x-6'
        },
        badges: {
            'u-badge-accent-compact': 'border-transparent bg-accent text-accent-foreground shadow hover:bg-accent/80',
            'u-badge-accent-default': 'border-transparent bg-accent text-accent-foreground shadow hover:bg-accent/80',
            'u-badge-accent-relaxed': 'border-transparent bg-accent text-accent-foreground shadow hover:bg-accent/80',

            'u-badge-base': 'flex items-center border transition-colors focus:outline-none focus:ring-ring',
            'u-badge-base-compact': 'px-1 py-0.5 rounded-md',
            'u-badge-base-default': 'px-2 py-1 rounded-lg',
            'u-badge-base-relaxed': 'px-3 py-1.5 rounded-xl',

            'u-badge-default-compact': 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
            'u-badge-default-default': 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
            'u-badge-default-relaxed': 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',

            'u-badge-destructive-compact': 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
            'u-badge-destructive-default': 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
            'u-badge-destructive-relaxed': 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',

            'u-badge-outline-compact': 'border-border',
            'u-badge-outline-default': 'border-border',
            'u-badge-outline-relaxed': 'border-border',

            'u-badge-secondary-compact': 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            'u-badge-secondary-default': 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
            'u-badge-secondary-relaxed': 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',

            'u-badge-text-accent-compact': 'text-accent-foreground',
            'u-badge-text-accent-default': 'text-accent-foreground',
            'u-badge-text-accent-relaxed': 'text-accent-foreground',

            'u-badge-text-compact': 'text-xs inline-flex gap-1 sm:gap-1.5 lg:gap-2 font-semibold',
            'u-badge-text-default': 'text-sm inline-flex gap-1.5 sm:gap-2 lg:gap-3 font-semibold',
            'u-badge-text-relaxed': 'text-base inline-flex gap-2 sm:gap-3 lg:gap-4 font-semibold',

            'u-badge-text-default-compact': 'text-primary-foreground',
            'u-badge-text-default-default': 'text-primary-foreground',
            'u-badge-text-default-relaxed': 'text-primary-foreground',

            'u-badge-text-destructive-compact': 'text-destructive-foreground',
            'u-badge-text-destructive-default': 'text-destructive-foreground',
            'u-badge-text-destructive-relaxed': 'text-destructive-foreground',

            'u-badge-text-outline-compact': 'text-muted-foreground',
            'u-badge-text-outline-default': 'text-muted-foreground',
            'u-badge-text-outline-relaxed': 'text-muted-foreground',

            'u-badge-text-secondary-compact': 'text-secondary-foreground',
            'u-badge-text-secondary-default': 'text-secondary-foreground',
            'u-badge-text-secondary-relaxed': 'text-secondary-foreground'
        },
        tables: {
            // Base
            'u-table-base': 'w-full border border-border bg-transparent border-collapse overflow-hidden',
            'u-table-base-compact': 'rounded-md',
            'u-table-base-default': 'rounded-lg',
            'u-table-base-relaxed': 'rounded-xl',

            // Header
            'u-table-header': 'border-border',
            'u-table-header-compact': '',
            'u-table-header-default': '',
            'u-table-header-relaxed': '',

            // Body
            'u-table-body': 'border-border',
            'u-table-body-compact': '',
            'u-table-body-default': '',
            'u-table-body-relaxed': '',

            // Footer
            'u-table-footer': 'bg-muted/50 font-medium',
            'u-table-footer-compact': '',
            'u-table-footer-default': '',
            'u-table-footer-relaxed': '',

            // Row
            'u-table-row':
                'flex overflow-hidden flex-row border-border border-b web:transition-colors web:hover:bg-muted/50 web:data-[state=selected]:bg-muted',
            'u-table-row-compact': '',
            'u-table-row-default': '',
            'u-table-row-relaxed': '',

            // Head
            'u-table-head':
                'text-muted-foreground text-left justify-center font-medium flex-1',
            'u-table-head-compact': 'h-8 px-2 text-xs',
            'u-table-head-default': 'h-12 px-4 text-sm',
            'u-table-head-relaxed': 'h-16 px-6 text-base',

            // Cell
            'u-table-cell':
                'flex-auto flex-row items-center text-foreground px-3',
            'u-table-cell-compact': 'text-xs py-1',
            'u-table-cell-default': 'text-sm py-2',
            'u-table-cell-relaxed': 'text-base py-3',

            // Head Text
            'u-table-head-text': 'text-muted-foreground font-semibold tracking-tight leading-tight',
            'u-table-head-text-compact': 'text-xs',
            'u-table-head-text-default': 'text-sm',
            'u-table-head-text-relaxed': 'text-base',

            // Cell Text
            'u-table-cell-text': 'text-foreground',
            'u-table-cell-text-compact': 'text-sm',
            'u-table-cell-text-default': 'text-sm',
            'u-table-cell-text-relaxed': 'text-base'
        },
        tabs: {
            // Container
            'u-controls-tabs-container': 'w-full flex-col',

            // Header (использовать с inline-стилями или Tailwind plugin'ом для scroll)
            'u-controls-tabs-header': 'flex-row w-full bg-muted rounded-full p-xs mb-3 sm:mb-4',

            // Header item
            'u-controls-tabs-header-item':
                ' flex-1 shrink-0 rounded-full px-3 py-2 text-sm inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 flex-shrink-0',

            'u-controls-tabs-header-item-active':
                'bg-card text-card-foreground shadow-sm',

            // Header item text
            'u-controls-tabs-header-item-text': 'text-muted-foreground font-medium whitespace-nowrap',
            'u-controls-tabs-header-item-text-active': 'text-card-foreground font-medium whitespace-nowrap',

            // Tab content
            'u-controls-tabs-tab-content': 'w-full',
            'u-controls-tabs-tab-content-animated': 'animate-[tabContentFadeIn_0.2s_ease-out]'
        },
        switcher: {
            // Container
            'u-controls-switcher-container':
                'items-center flex-row-reverse justify-between gap-x-2 h-14 min-w-14 rounded-xl flex-auto p-3 bg-input border border-border flex',

            // Text
            'u-controls-switcher-text': 'text-neutral-800 dark:text-neutral-200 text-base',

            // Track
            'u-controls-switcher-track': 'rounded-full',
            'u-controls-switcher-track-base': 'w-20 h-8 p-1',
            'u-controls-switcher-track-sm': 'w-10 h-4 p-0.5',

            // Thumb
            'u-controls-switcher-thumb': 'rounded-full aspect-square bg-white transition-transform duration-200',
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
            'u-controls-checkbox-container-bg':
                'web:active:bg-neutral-200 web:dark:active:bg-neutral-700 web:hover:bg-neutral-100 web:dark:hover:bg-neutral-800',

            // Text labels
            'u-controls-checkbox-text':
                'text-neutral-800 dark:text-neutral-200 text-base leading-5 font-medium pl-2',
            'u-controls-checkbox-text2':
                'text-neutral-600 dark:text-neutral-400 text-sm leading-5',

            // Icon (e.g. if checkbox is custom-rendered)
            'u-controls-checkbox-icon':
                'text-neutral-600 dark:text-neutral-400 my-auto h-6 w-6',

            // Checkbox square indicator
            'u-controls-checkbox-indicator':
                'h-5 w-5 m-1 rounded-sm border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

            // Radiobutton circular indicator
            'u-controls-radiobutton-indicator':
                'h-5 w-5 m-1 rounded-full border-2 border-neutral-500 bg-transparent justify-center items-center mr-2',

            // Active mark inside checkbox (filled square)
            'u-controls-checkbox-indicator-active':
                'h-2.5 w-2.5 bg-primary m-1 items-center justify-center',

            // Active mark inside radiobutton (filled circle)
            'u-controls-radiobutton-indicator-active':
                'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center'
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
                'font-semibold text-primary',
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
                'text-primary dark:text-primary dark:group-hover:text-primary',
            'u-btn-group-item-link-pressed-cnt': 'bg-transparent',
            'u-btn-group-item-link-pressed-text':
                'text-primary dark:text-neutral-600 dark:group-hover:text-primary',
            'u-btn-group-item-link-pressed-icon':
                'text-primary dark:text-primary dark:group-hover:text-primary',

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

            'u-btn-badge-cnt':
                ' bg-primary/20 ',
            'u-btn-badge-text':
                'font-medium text-primary dark:text-primary',
            'u-btn-badge-trans': '  web:duration-200',
            'u-btn-badge-color-icon-light': ' ',
            'u-btn-badge-color-icon-dark': ' ',

            'u-btn-label-cnt':
                'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 web:hover:bg-neutral-100 dark:web:hover:bg-neutral-800 active:opacity-70',
            'u-btn-label-text':
                'font-normal text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 dark:web:hover:text-neutral-200',
            'u-btn-label-trans': '  web:duration-200',
            'u-btn-label-color-icon-light': 'rgba(75,85,99,1)',
            'u-btn-label-color-icon-dark': 'rgba(156,163,175,1)',
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

            'u-btn-badge-cnt': 'border border-transparent dark:border-transparent bg-neutral-100 dark:bg-neutral-800 flex flex-row active:opacity-60',
            'u-btn-badge-text':
                ' font-medium text-xs text-neutral-700 dark:text-neutral-300 ',
            'u-btn-badge-trans': '   web:duration-200 ',

            'u-btn-label-cnt': 'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex flex-row active:opacity-70',
            'u-btn-label-text':
                ' font-normal text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 ',
            'u-btn-label-trans': '   web:duration-200 ',
        },
    },
}