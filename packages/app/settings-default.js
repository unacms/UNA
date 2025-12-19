import { env } from 'app/lib/env'

export const settingsDefault = {
    config: {
        una_url: env('UNA_URL'),
        app_url: env('APP_URL'),
        una_api_key: env('UNA_API_KEY'),
        app_origin: env('APP_ORIGIN'),

        native_app_images_url:
            env('APP_URL') == 'http://localhost:3000'
                ? 'https://neo.so'
                : 'https://neo.so',
        noprefetch: false,
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
        show_ui: true,

        app_version: '15.0.0',
        min_server_version: '15.0.0',
        stable_server_version: '15.x.x'
    },
    app: {
        title: 'UNA',
    },
    layout: {
        body: ' bg-background ',
        defaults: {
            name: 'hor',
            density: 'default',
            theme: 'auto',
            lang: 'en',
            feed_unit: 'default',
        },
        avaliable_layouts: ['hor', 'ver', 'mixed'],
        avaliable_feed_units: ['default', 'small'],
        avaliable_density: [
            { id: 'compact', title: 'Compact', icon: 'Minus' },
            { id: 'default', title: 'Default', icon: 'Circle' },
            { id: 'relaxed', title: 'Relaxed', icon: 'Plus' },
        ],
        avaliable_langs: ['auto', 'en', 'ru'],
        screen: ' w-full  ',
        ui_density_switcher: true,
        max_width: ' w-full ',
        max_width_content: ' w-full max-w-7xl ',
        home_container: ' w-full 2xl:max-w-screen-2xl web:duration-500 web:border-x-0 web:border-guide/20 web:border-dashed', 
        feed_container: ' w-full max-w-3xl sm:p-3 mx-auto ',
        post_container: ' max-w-3xl w-full flex-1 bg-card shadow-sm text-card-foreground rounded-2xl py-3 sm:py-4 lg:my-4 mx-auto ', // for hor = max-w-screen-xl, for ver = max-w-screen-lg

        search: true,
        sidebar_search: true,
        extended_search: true,
        apps: true,
        add_menu: true,
        show_profile_info: true,
        tooltips: true,
        hide_header_for_non_logged: false,
        hide_header_for_all: false,
        card_animation_duration: 100,
        user_remote_config: true,
        background_image_color: '', //OLD appSetting('layout', 'background_cover_color')
        background_image: '', //`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_image_dark: '', //`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,

        show_login_modal: 0,
        redirect_on_forbidden: '/home',
        lock_unconfirmed: true,
        lock_no_profile: true,
        allow_create_new_profile: true,

        button_style_for_actions: 'secondary',

        share_text: '',
        default_icon_stroke_width: 2,
        tablet_mode_from: 'lg',
        show_tabbar_on_mobile_non_logged: false,

        header: {
            content: ' w-full mx-auto',
            content_center: ' hidden flex-auto xl:flex gap-1 items-center justify-center max-w-3xl xl:px-3 ',
        },
        vertical: {
            blocks: [
                /*  {
                      name: 'system/profile_menu/TemplServiceProfiles',
                      showTitle: false,
                      showBg: false,
                  },*/
            ],
        },
    },
    auth: {
        enabled: true,
        google: {
            web_client_id:
                '398453829790-egj0o9mm2mq9rua8umq6jcvedtl9cgfu.apps.googleusercontent.com',
            ios_client_id: '',
            android_client_id: '',
        },
        github: false,
        linkedin: false,
        x: false,
        passkey: false,
        saml: false,
    },
    native: {
        enable_screens: true, //OLD appSetting('layout', 'native_enable_screens')
        lazy_tabs: false, // OLD appSetting('layout', 'native_lazy_tabs')
        disable_screenshots: false, // OLD appSetting('layout', 'disable_screenshots')
        show_tabs_non_logged: true, // OLD appSetting('layout', 'show_nav_non_logged_native')
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
        logo: true,
        logo_mode: 'full',
        show_always: false,
        root_url: 'home'
    },
    cover: {
        use_background: true, //appSetting('layout', 'use_background')
        aspect_ratio: 'aspect-4/1', //appSetting('layout', 'cover_aspect')
        allow_edit: true, //appSetting('layout', 'allow_edit_covers')
        fixed: false, //appSetting('layout', 'fixed_cover')
        scroll: false,
        hide_cover_for_context: false,
       // split_action_menu: true, //OLD appSetting('layout', 'split_action_menu')
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
        },
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
        sidebar_container: '  h-full mx-3 ',
        sidebar_inner_container: ' py-2 px-3 shadow-sm overflow-y-auto flex flex-col bg-card/60 rounded-2xl border border-border/60  ',
        sidebar_title: 'sticky z-10 justify-between items-center h-12 ps-2 py-1.5 mb-1.5 z-10',
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
        form_container: 'w-full gap-3 sm:gap-4 max-w-2xl mx-auto ',
        field_padding: ' gap-1 ',
        caption_classes:
            'font-semibold text-sm text-card-foreground',
        without_captions: [
            // OLD appSetting('forms', 'form_without_captions')
            'sys_login',
            'sys_account_create',
            'sys_forgot_password',
            'bx_invites_request_send',
        ],
        visibility_control_names: [
            // appSetting('layout', 'form_' + name + '_control_names')
            '*_allow_view_to',
            '*_object_privacy_view',
        ],
        selector_control_names: ['*_cat', '*_space_cat'],

        password_eye_button: {
            size: 'sm',
            variant: 'text',
            startDecorator: {
                visible: 'Eye',
                hidden: 'EyeClosed',
            },
            rounded: false,
        },

        sys_login: { hide_errors: true, button_full_width: true },

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
            },
        },
        css:'A.bx-mention-link, A.bx-tag{ color: rgba(37, 99, 235, 1)}',
        css_dark:'A.bx-mention-link, A.bx-tag{ color: rgba(59, 130, 246, 1)}}',
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
        feed_container: 'relative flex-auto mx-auto w-full max-w-3xl  ',
        post_trigger: 'active:bg-muted rounded-full flex-auto lg:bg-muted/80 lg:hover:bg-muted justify-center px-1 lg:px-4',
        post_trigger_text: 'font-medium text-muted-foreground web:hover:text-foreground',
        show_html: false,
        default_feed: 'foryou',
        list: [
            { name: 'foryou', icon: 'Sparkle', title: 'For you', showTitle: true },
             { name: 'account', icon: 'Binoculars', title: 'Following', showTitle: true },
            // { name: 'hot', icon: 'Flame', title: 'Hot', showTitle: true },
            // { name: 'public', icon: 'Egg', title: 'Public', showTitle: true },
            // { name: 'channels', icon: 'Hash', title: 'News', showTitle: true },
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
            button_full_width: false,
            button_size: 'sm',
            button_variant: 'text',
            menu_width: ' w-min ',
            pressed_classes: {
                pressed_container: ' bg-accent active:bg-accent web:hover:bg-accent ',
                pressed_text: ' text-accent-foreground font-medium ',
            },
            button_rounded: false,
            justify_items: 'start',
            no_gap_between_buttons: false, // is false no gap between buttons + right margin, is true  gap between buttons + no margin
        },
        counters_menu: {
            show_action: false,
            show_counter: true,
            show_combined: true,
            menu_width: 'w-full',
            button_variant: 'ghost',
            rounded: true,
            button_size: 'xs',
            button_rounded: true,
            justify_items: 'between',
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
        stale_time: 30000,
        per_line: [/* only for images for now*/ 
            { width: 1280, count: 4 },
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
        ],
        unit_by_source: {
            'system/browse_friends': 'person_friends',
            'system/browse_recommendations_friends': 'person_friends_recommendations',
            'system/browse_invitations': 'invitations_in_context',
            'system/browse_friend_requested': 'person_friend_requested',
            'system/browse_friend_requests': 'browse_friend_requests',
            'system/browse_recommendations_subscriptions': 'person_following_recommendations',
            'system/browse_subscribed_me': 'person_followers',
            'browse_subscriptions': 'person_following',
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
            icon_type_web: 'svg', //'svg' or 'emoji'
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
                    joy: { svg: 'Laugh', emoji: '😂' },
                    surprise: { svg: 'Smile', emoji: '😮' }, // Using Smile as fallback for surprise
                    sadness: { svg: 'Frown', emoji: '😔' },
                    anger: { svg: 'Angry', emoji: '😠' },
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
                icons: { add: 'UserRoundPlus', remove: 'UserRoundMinus' },
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
                badge: 'friends'
            },
            {
                key: '/tab2',
                title: 'Messages',
                url: '/posts-home',
                icon: 'MessageCircleMore',
                badge: 'messenger'
            },
            {
                key: '/tab3',
                title: 'Notifications',
                url: '/notifications-view',
                icon: 'Bell',
                badge: 'notifications'
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
                { component: 'link', href: "{messenger}", className: 'hidden sm:block', title: 'Messages', props: { variant: "secondary", rounded: true, size: "base", startDecorator: "MessageSquare" } },
                { component: 'account', className: 'hidden lg:block' },
            ],
            loggedOut: [
                { component: 'search', className: 'items-center' },
                { component: 'launcher', className: 'items-center' },
                { component: 'link', className: 'items-center', href: "/login", title: 'Login', props: { variant: "secondary", rounded: true, size: "base", startDecorator: "UserRound" } },
            ],
        },
        mixed: {
            loggedIn: [
                { component: 'search', className: 'lg:hidden' },
                { component: 'launcher', className: 'hidden' },
                { component: 'add', className: '' },
                { component: 'notifications', className: 'hidden sm:block' },
                { component: 'link', href: "{messenger}", className: 'hidden sm:block', title: 'Messages', props: { variant: "secondary", rounded: true, size: "base", startDecorator: "MessageSquare" } },
                { component: 'account', className: 'hidden sm:block' },
            ],
            loggedOut: [
                { component: 'search', className: '' },
                { component: 'launcher', className: '' },
                { component: 'link', className: '', href: "/login", title: 'Login', props: { variant: "secondary", rounded: true, size: "base", startDecorator: "UserRound" } },
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
        '/': {
            // For the splash screen (home page when not logged in)
            max_width: '',
        },
        '/login': {
            max_width: '',
        },
        '/create-account': {
            max_width: '',
        },
        home: {
            adjustable: true,
            sizable: false,
            cells: {
                left: {
                    defaultSize: 25, 
                    minSize: 25, 
                    maxSize: 25,
                    breakpoint: 'xl',
                    responsive: {
                       
                        '2xl':{
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                            
                        }
                    }
                },
                center: { 
                    defaultSize: 65, 
                    minSize: 65, 
                    maxSize: 65,
                    responsive: {
                        'xl':{
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                        },
                        '2xl':{
                            defaultSize: 50,
                            minSize: 50,
                            maxSize: 50,
                            
                        }
                    }
                },
                right: {
                    defaultSize: 35,
                    minSize: 35,
                    maxSize: 35,
                    breakpoint: 'lg',
                    responsive: {
                        'xl':{
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                            
                        },
                        '2xl':{
                            defaultSize: 25,
                            minSize: 25,
                            maxSize: 25,
                            
                        }
                    }
                },
            },
        },
        messenger: {
            adjustable: true,
            sizable: true,
            cells: {
                left: {
                    defaultSize: 30,
                    minSize: 20,
                    maxSize: 40,
                    breakpoint: 'lg',
                },
                center: { defaultSize: 70, minSize: 40, maxSize: 80 },
            },
        },
        'cols-c': {
            adjustable: true,
            sizable: true,
            cells: {

                center: { defaultSize: 100, minSize: 50, maxSize: 100 },
            },
        },
        'cols-l-c-r': {
            adjustable: true,
            sizable: true,
            cells: {
                left: {
                    defaultSize: 25,
                    minSize: 20,
                    maxSize: 30,
                    breakpoint: 'xl',
                },
                center: { defaultSize: 50, minSize: 40, maxSize: 60 },
                right: {
                    defaultSize: 25,
                    minSize: 20,
                    maxSize: 30,
                    breakpoint: 'xl',
                },
            },
        },
        'cols-l-c': {
            adjustable: true,
            sizable: true,
            cells: {
                left: {
                    defaultSize: 30,
                    minSize: 15,
                    maxSize: 30,
                    breakpoint: 'xl',
                    responsive: {
                        '2xl':{
                            defaultSize: 20,
                            minSize: 15,
                            maxSize: 30,
                            
                        }
                    }
                   
                },
                center: { 
                    defaultSize: 70, minSize: 70, maxSize: 80,
                    responsive: {
                        '2xl':{
                                defaultSize: 80,
                                minSize: 70,
                                maxSize: 85,
                                
                            }
                        }
                },
            },
        },
        'cols-c-r': {
            adjustable: true,
            sizable: true,
            cells: {
                center: { 
                    defaultSize: 60, 
                    minSize: 50, 
                    maxSize: 70,
                    responsive: {
                        '2xl':{
                            defaultSize: 70,
                            minSize: 65,
                            maxSize: 75,
                            breakpoint: 'xl',
                        }
                    }
                },
                right: {
                    defaultSize: 40,
                    minSize: 30,
                    maxSize: 50,
                    breakpoint: 'lg',
                    responsive: {
                        '2xl':{
                            defaultSize: 30,
                            minSize: 25,
                            maxSize: 35,
                            breakpoint: 'xl',
                        }
                    }
                },
            },
        },
    },
    // Behavior settings for block rendering (deprecated; use showPadding: false or list prop)
    theme: {
        corner_smoothing: {
            enabled: true,
            factor: 2,
            full_factor: 1.3,
        },
        profile_sizes: {
            default_size: 'base',
            '3xs': {
                container: 'w-4 h-4',
                width: 16,
                height: 16,
                font: 'text-[10px] leading-4',
                letter_font: 'text-[8px] font-semibold',
            },
            '2xs': {
                container: 'w-5 h-5',
                width: 20,
                height: 20,
                font: 'text-xs leading-5',
                letter_font: 'text-[10px] font-semibold',
            },
            xs: {
                container: 'w-6 h-6',
                width: 24,
                height: 24,
                font: 'text-xs leading-5',
                letter_font: 'text-xs font-semibold',
            },
            sm: {
                container: 'w-8 h-8',
                width: 32,
                height: 32,
                font: 'text-sm leading-4 tracking-tight font-semibold',
                letter_font: 'text-sm font-semibold',
            },
            md: {
                container: 'w-9 h-9',
                width: 36,
                height: 36,
                font: 'text-sm leading-5 tracking-tight font-semibold',
                letter_font: 'text-base font-semibold',
            },
            base: {
                container: 'w-10 h-10',
                width: 40,
                height: 40,
                font: 'text-base',
                letter_font: 'text-lg font-semibold',
            },
            lg: {
                container: 'w-12 h-12',
                width: 48,
                height: 48,
                font: 'text-lg leading-6 tracking-tight font-semibold',
                letter_font: 'text-xl font-semibold',
            },
            xl: {
                container: 'w-14 h-14',
                width: 56,
                height: 56,
                font: 'text-xl',
                letter_font: 'text-2xl font-semibold',
            },
            '2xl': {
                container: 'w-20 h-20',
                width: 80,
                height: 80,
                font: 'text-xl',
                letter_font: 'text-3xl font-semibold',
            },
            '3xl': {
                container: 'w-40 h-40',
                width: 160,
                height: 160,
                font: 'text-2xl',
                letter_font: 'text-5xl font-semibold',
            },
            '4xl': {
                container: 'w-80 h-80',
                width: 320,
                height: 320,
                font: 'text-4xl',
                letter_font: 'text-8xl font-semibold',
            },
        },
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
                height: 48,
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
            headerBackground: 'rgba(24,24,27,1)',
            barsBackground: 'rgba(24 24 27,1)', //header background in native
            bottomSheetBackground: 'rgba(24,24,27,1)',
            barsColor: 'rgba(161,161,170,1)', //tabbar icons color in native
            safeAreaBackground: 'rgba(24,24,27,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
        },
        dropdown: {
            cnt: ' rounded-2xl overflow-hidden shadow-xl border border-border p-2 bg-popover web:bg-popover/90 backdrop-blur-xl z-50  ',
        },
        conductor: {
            menu: ' w-full items-left justify-center ',
            menu_max_width: ' w-full max-w-7xl ',
            content_max_width: ' w-full max-w-7xl ',
            content_max_width_nav: ' w-full max-w-screen-2xl xl:border-x-0 xl:border-guide/20 border-dashed  ',
            menu_is_dynamic: false,
            menu_cnt: ' flex-row flex-none gap-1 px-2 h-14 items-center overflow-x-auto ',
            menu_categ_indent: ' pl-12 ',
         
          

            topmenu_cnt:
                'w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex p',
            topmenu_button_variant: 'secondary',
            topmenu_button_variant_active: 'secondary',
            topmenu_button_align: 'start',
            topmenu_button_fullWidth: false,
            topmenu_button_size: 'base',
            topmenu_button_pressed: true,
            left_menu_cnt: '  ',
            cover_base: 'w-full bg-card/95 backdrop-blur-xl',
            cover_content:
                'items-center h-full w-full overflow-hidden justify-between',
            cover_small: 'max-w-7xl mx-auto flex-row w-full px-3 items-center '
        },
       
        checkbox_set: {
            container: ' gap-x-2',
        },
        
        doublerange: {
            container: 'w-full items-center justify-between mt-2',
            value_container:
                'w-36 bg-input border border-border/60 py-2 px-4 text-center rounded-lg justify-between',
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
            content_shadow: ' shadow-lg ',
            content_ver: '',
            content_hor: 'flex-row  ',
            item_ver:
                ' px-2 py-1.5 group flex h-12 flex-row items-center rounded-lg font-medium web:hover:bg-muted/60 text-card-foreground web:hover:text-foreground web:hover:cursor-pointer',
            item_hor:
                'flex block web:dark:hover:text-white rounded-full web:hover:cursor-pointer text-neutral-700    web:duration-200 dark:text-neutral-300 outline-none ',
            item_np:
                'flex flex-row web:focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium web:hover:bg-bgritem web:dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-300 web:dark:hover:text-white web:hover:cursor-pointer',
            item_cnt: 'items-center w-full flex-row',
            item_text: ' text-sm font-medium text-card-foreground px-2',
            item_icon:
                'flex items-center w-9 h-9 bg-secondary/80 web:group-hover:bg-secondary rounded-full justify-center',
            icon_size: 20, // Default icon size for dropdown menu icons
        },
        modal: {
            fog: 'bg-background/80  ',
            container:
            ' h-full sm:h-auto shadow-xl bg-card/80 backdrop-blur border border-border sm:rounded-2xl overflow-hidden ',
            content: ' h-auto ',
            header: ' p-3 items-start justify-start border-b border-border/60',
        },

        inputs: {
            default: ' file:text-foreground text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input/60 border border-input focus-visible:bg-card leading-5 focus-visible:border-ring focus-visible:outline-accent rounded-xl px-3 min-h-12 flex-auto text-base placeholder-muted-foreground text-foreground  web:duration-200 overflow-hidden',
           
            multi: 'file:text-foreground text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input/60 border border-input focus-visible:bg-card leading-5 focus-visible:border-ring focus-visible:outline-accent rounded-xl px-3 py-2 min-h-12 flex-auto text-base placeholder-muted-foreground text-foreground  web:duration-200 overflow-hidden ',
            rounded:
                ' border border-border/60 focus:border-border web:border-0 web:ring-1 web:ring-inset web:ring-border/80 rounded-full web:focus:bg-card px-3 min-h-12 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
            roundedsmall:
                ' rounded-full border/50 focus:border-border web:border-0 web:ring-1 web:ring-inset web:ring-border/80 px-2 min-h-10 flex-auto  text-base leading-5 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
            small: ' border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 rounded-lg web:focus:bg-card px-2 min-h-10 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
            select: ' pr-10 border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 rounded-xl bg-input web:focus:bg-card px-3 min-h-12 flex-auto  text-base leading-6 overflow-hidden placeholder:text-muted-foreground text-card-foreground web:duration-300 ',
        },

        button_sizes: {
            default_size: 'base',
            default_variant: 'default',
            pressed_container: ' bg-accent web:hover:bg-accent web:active:bg-accent  ',
            pressed_text: ' text-accent-foreground font-medium ',
         
            xs: {
                rounded: ' rounded-md ',
                padding: ' ',
                padding_icon_only: ' px-1',
                padding_with_title: ' px-1.5 gap-1 ',
                icon_container:
                    ' h-6 text-sm flex items-center justify-center',
                title_container: ' text-xs leading-6 text-xs',
                icon_size: 16,
                icon_margin: '  ', // conditional margin for icon container when title is present
                title_margin: ' ', //
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-xs ',
                hitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
            },
            sm: {
                rounded: ' rounded-lg ',
                padding: ' min-h-9 ',
                padding_icon_only: ' h-9 w-9 ',
                padding_with_title: ' px-2.5 h-9 gap-1.5 ',
                icon_container:
                    ' text-base flex items-center justify-center',
                title_container: ' rounded text-sm inline-flex items-center  ',
                icon_size: 20,
                icon_margin: ' ', // conditional margin for icon container when title is present
                title_margin: '  ', // conditional margin for text container when icon is present
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-sm ',
                hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
            },
            
            base: {
                rounded: ' rounded-lg ',
                padding: '  ',
                padding_icon_only: ' h-10 w-10 ',
                padding_with_title: ' px-3 gap-2 h-10 items-center ',
                icon_container: ' text-base flex items-center ',
                title_container: ' leading-10 text-base items-center flex   ',
                icon_size: 24,
                icon_margin: ' ', // conditional margin for icon container when title is present
                title_margin: ' ', // conditional margin for text container when icon is present
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-base ',
                hitSlop: { top: 4, right: 4, bottom: 4, left: 4 },
            },
            lg: {
                rounded: ' rounded-xl ',
                padding: '  ',
                padding_icon_only: ' h-12 w-12 ',
                padding_with_title: ' px-4 gap-2 h-12 items-center ',
                icon_container: '  text-lg flex items-center ',
                title_container: ' leading-12 text-base items-center flex',
                icon_size: 24,
                icon_margin: '', // conditional margin for icon container when title is present
                title_margin: '', // conditional margin for text container when icon is present
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-lg ',
                hitSlop: { top: 14, right: 14, bottom: 14, left: 14 },
            },
            // icon-only sizes
            'icon-sm': {
                rounded: ' rounded-lg ',
                padding: '  ',
                padding_icon_only: ' h-8 w-8 ',
                padding_with_title: ' px-2 gap-1 h-8 items-center ',
                icon_container: ' text-base h-8 flex items-center justify-center',
                title_container: ' text-sm leading-8 inline-flex items-cente px-0.5  ',
                icon_size: 20,
                icon_margin: ' ',
                title_margin: '  ',
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-sm ',
                hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
            },
            'icon': {
                rounded: ' rounded-lg ',
                padding: '  ',
                padding_icon_only: ' h-9 w-9 ',
                padding_with_title: ' px-2 gap-1 h-9 items-center ',
                icon_container: ' text-base h-9 flex items-center justify-center',
                title_container: ' text-sm leading-9 inline-flex items-cente px-0.5  ',
                icon_size: 24,
                icon_margin: ' ',
                title_margin: '  ',
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-sm ',
                hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
            },
            'icon-lg': {
                rounded: ' rounded-xl ',
                padding: '  ',
                padding_icon_only: ' h-10 w-10 ',
                padding_with_title: ' px-3 gap-2 h-10 items-center ',
                icon_container: ' text-base h-10 flex items-center justify-center ',
                title_container: ' leading-10 text-base items-center flex   ',
                icon_size: 24,
                icon_margin: ' ',
                title_margin: ' ',
                hitarea_class: ' relative u-action-hitarea u-action-hitarea-base ',
                hitSlop: { top: 4, right: 4, bottom: 4, left: 4 },
            },
        },
        // Button group sizes (separate from individual button sizes)
        buttons_group_sizes: {
            default_size: 'base',
         
            xs: {
                rounded: ' rounded-md ',
                container: ' h-7 gap-[1px] ',
            },
            sm: {
                rounded: ' rounded-lg ',
                container: ' h-9 gap-0.5 ',
            },
            base: {
                rounded: ' rounded-xl ',
                container: ' h-11 group ',
                divider: ' w-0.5 h-full  ',
            },
            lg: {
                rounded: ' rounded-xl ',
                container: ' h-12 group ',
                divider: ' w-0.5 h-full  ',
            },
        },
        // Button group item container sizes for inner wrappers inside a ButtonsGroup
        buttons_group_items_sizes: {
            default_size: 'base',
            xs: {
                container: ' h-full ',
                rounded: ' rounded-md ',
            },
            sm: {
                container: ' h-full ',
                rounded: ' rounded-lg ',
            },
            base: {
                container: ' h-full rounded',
                rounded: ' rounded-xl ',
            },
            lg: {
                container: ' h-full rounded',
                rounded: ' rounded-xl ',
            },
        },
        // Badge sizes aligned with profile_sizes for visual consistency
        badge_sizes: {
            default_size: 'sm',
            '3xs': {
                // Matches profile_sizes['3xs']: h-4 (16px)
                padding: ' ',
                wide_padding: ' px-0.5 ',
                container: ' min-w-4 h-4 overflow-hidden justify-center items-center  ',
                image_container: ' items-center justify-center rounded overflow-hidden ',
                icon_size: 12,
                text: ' text-[10px] leading-4 px-0.5  ',
                rounded: ' rounded ',
            },
            '2xs': {
                // Matches profile_sizes['2xs']: h-5 (20px)
                padding: ' ',
                wide_padding: ' px-1 ',
                container: ' min-w-5 h-5 overflow-hidden justify-center items-center  ',
                image_container: ' items-center justify-center rounded overflow-hidden ',
                icon_size: 14,
                text: ' text-xs leading-5 px-0.5  ',
                rounded: ' rounded-[5px] ',
            },
            xs: {
                // Matches profile_sizes['xs']: h-6 (24px)
                padding: ' ',
                wide_padding: ' px-1 ',
                container: ' min-w-6 h-6 overflow-hidden justify-center items-center ',
                image_container: ' items-center justify-center rounded overflow-hidden ',
                icon_size: 16,
                text: ' text-xs leading-6 px-1  ',
                rounded: ' rounded-md ',
            },
            sm: {
                // Matches profile_sizes['sm']: h-8 (32px)
                padding: ' px-1 ',
                wide_padding: ' px-2 ',
                container: ' min-w-8 h-8 gap-1 justify-center items-center  ',
                image_container: ' items-center justify-center ',
                icon_size: 20,
                text: ' text-sm leading-8  ',
                rounded: ' rounded-lg ',
            },
            md: {
                // Matches profile_sizes['md']: h-9 (36px)
                padding: ' px-1.5 ',
                wide_padding: ' px-2.5 ',
                container: ' min-w-9 h-9 gap-1 justify-center items-center  ',
                image_container: ' items-center justify-center ',
                icon_size: 22,
                text: ' text-base leading-9  ',
                rounded: ' rounded-lg ',
            },
            base: {
                // Matches profile_sizes['base']: h-10 (40px)
                padding: ' px-2 ',
                wide_padding: ' px-3 ',
                container: ' min-w-10 h-10 gap-1.5 justify-center items-center  ',
                image_container: ' items-center justify-center ',
                icon_size: 24,
                text: ' text-base leading-10  ',
                rounded: ' rounded-xl ',
            },
            lg: {
                // Matches profile_sizes['lg']: h-12 (48px)
                padding: ' px-2 ',
                wide_padding: ' px-3 ',
                container: ' min-w-12 h-12 gap-1.5 justify-center items-center  ',
                image_container: ' items-center justify-center ',
                icon_size: 28,
                text: ' text-lg leading-[48px]  ',
                rounded: ' rounded-xl ',
            },
            xl: {
                // Matches profile_sizes['xl']: h-14 (56px)
                padding: ' px-2.5 ',
                wide_padding: ' px-4 ',
                container: ' min-w-14 h-14 gap-2 justify-center items-center e ',
                image_container: ' items-center justify-center ',
                icon_size: 32,
                text: ' text-xl leading-[56px]  ',
                rounded: ' rounded-2xl ',
            },
            '2xl': {
                // Matches profile_sizes['2xl']: h-20 (80px)
                padding: ' px-3 ',
                wide_padding: ' px-5 ',
                container: ' min-w-20 h-20 gap-2 justify-center items-center ',
                image_container: ' items-center justify-center ',
                icon_size: 48,
                text: ' text-2xl leading-[80px]  ',
                rounded: ' rounded-3xl ',
            },
        },
        // Link styling (variants and sizes) to allow restyling without component changes
        link_sizes: {
            default_size: 'md',
            default_variant: 'default',

            
            xs: {
                padding: '  ',
                hitarea_class: ' relative u-link-hitarea u-link-hitarea-xs ',
                hitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
                text: ' text-xs leading-4 min-h-4 items-center justify-center flex',
                rounded: ' rounded ',
                focus: '  ',
            },
            sm: {
                padding: ' ',
                hitarea_class: ' relative u-link-hitarea u-link-hitarea-sm ',
                hitSlop: { top: 6, right: 6, bottom: 6, left: 6 },
                text: ' text-sm ',
                rounded: '  rounded-md ',
                focus: '  web:focus-visible:outline-offset-2  ',
            },
            md: {
                padding: ' px-1 py-0.5 ',
                hitarea_class: ' relative u-link-hitarea u-link-hitarea-md ',
                hitSlop: { top: 4, right: 4, bottom: 4, left: 4 },
                text: ' underline-offset-2  text-base  ',
                rounded: ' rounded-md ',
                focus: ' web:focus-visible:outline-offset-2   ',
            },
            lg: {
                padding: ' px-2 py-1 ',
                hitarea_class: ' relative u-link-hitarea u-link-hitarea-md ',
                hitSlop: { top: 2, right: 2, bottom: 2, left: 2 },
                text: ' underline-offset-2  text-lg  ',
                rounded: ' rounded-lg ',
                focus: ' web:focus-visible:outline-offset-2   ', },
        },

        link_styles: {
            // inherit color and decoration
            'u-link-default-cnt': '   ',
            'u-link-default-text': '   ',
            'u-link-default-trans': ' web:duration-200 ',

            // neutral color link, no background
            'u-link-plain-cnt': ' active:bg-muted/60  ',
            'u-link-plain-text': ' text-foreground web:hover:text-accent-foreground web:hover:underline ',
            'u-link-plain-trans': ' web:duration-200 ',

            // branded color link, no background
            'u-link-accent-cnt': ' active:bg-accent/60  ',
            'u-link-accent-text': ' text-accent-foreground web:hover:underline ',
            'u-link-accent-trans': ' web:duration-200 ',

            // neutral color link, no background, hover background
            'u-link-ghost-cnt':  ' u-link-ghost    ',
            'u-link-ghost-text':  ' text-secondary-foreground web:hover:text-foreground ',
            'u-link-ghost-trans': ' web:duration-100 ',

            // branded color link, no background, hover background
            'u-link-plainghost-cnt':  ' u-link-ghost   ',
            'u-link-plainghost-text':  ' text-muted-foreground web:hover:text-foreground ',
            'u-link-plainghost-trans': ' web:duration-100 ',

            // branded color link, no background, hover background
            'u-link-accentghost-cnt':  ' u-link-ghost   ',
            'u-link-accentghost-text':  ' text-accent-foreground ',
            'u-link-accentghost-trans': ' web:duration-100 ',

          
        },
        offsets: {
            'gap-lg': 'gap-4',
            'gap-md': 'gap-3',
            'gap-sm': 'gap-2',
            'gap-xs': 'gap-1',
            'm-lg': 'm-4',
            'm-md': 'm-3',
            'm-sm': 'm-2',
            'm-xs': 'm-1',
            'mb-lg': 'mb-4',
            'mb-md': 'mb-3',
            'mb-sm': 'mb-2',
            'mb-xs': 'mb-1',
            'mt-lg': 'mt-4 ',
            'mt-md': 'mt-3 ',
            'mt-sm': 'mt-2 ',
            'mt-xs': 'mt-1',
            'p-lg': 'p-4',
            'p-md': 'p-3',
            'p-sm': 'p-2',
            'p-xs': 'p-1',
            'pb-lg': 'pb-4',
            'pb-md': 'pb-3',
            'pb-sm': 'pb-2',
            'pt-lg': 'pt-4',
            'pt-md': 'pt-3',
            'pt-sm': 'pt-2',
            'pt-xs': 'pt-1',
            'px-lg': 'px-4',
            'px-md': 'px-3',
            'px-sm': 'px-2',
            'px-xs': 'px-1',
            'py-lg': 'py-4',
            'py-md': 'py-3',
            'py-sm': 'py-2',
            'py-xs': 'py-1',
            'w-lg': 'w-4',
            'w-md': 'w-3',
            'w-sm': 'w-2',
        },
        cards: {
            'u-card-list':
                ' u-card-list bg-card/60 sm:shadow-sm  sm:border border-border/60 text-card-foreground overflow-hidden sm:rounded-2xl ',
            'u-card-list-padding': ' p-3 lg:p-4 ',
            'u-card-base':
                ' u-card-base bg-card/60 shadow-sm border border-border/60 text-card-foreground overflow-hidden rounded-2xl',
            'u-card-padding': ' p-4 ',
            'u-card-header': 'flex gap-1',
            'u-card-icon': 'text-card-foreground px-4 gap-2',
            'u-card-title':
                ' text-foreground leading-none text-xl font-semibold leading-none tracking-tight',
            'u-card-description': ' text-secondary-foreground text-sm lg:text-base text-balance',
            'u-card-content': 'text-card-foreground ',
            'u-card-footer': 'bg-muted/20 border-t border-border/40 p-4 flex text-base text-card-foreground gap-2',
        },
        panels: {
            'u-panel-base': ' h-full flex-col ',
            'u-panel-handler': 'relative w-0 web:before:absolute web:before:inset-y-0 web:before:-left-0.5 web:before:-right-0.5 web:before:bg-transparent web:before:hover:bg-accent web:before:active:bg-accent/50 web:before:duration-200 ',
            'u-panel-line':
                'absolute w-px h-full bg-border/0 web:group-hover:bg-primary/50 active:bg-primary/50 rounded-full left-1/2 top-0 -translate-x-1/2',
            'u-panel-group': ' h-full flex',
        },
        blocks: {
            'u-block-base':
                'u-max-width-block sm:rounded-2xl gap-3 ',
            'u-block-bg':
                'bg-card/80 shadow-sm text-card-foreground border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/60',
            'u-block-pad':
                'px-4 py-2 @xl/block:p-6',
            'u-block-header':
                ' flex-row items-center gap-2 pt-2',
            'u-block-icon': 'text-card-foreground',
            'u-block-name': 'flex flex-col flex-auto gap-y-2 gap-x-4',
            'u-block-title':
                'text-foreground leading-none text-xl font-semibold leading-none tracking-tight',
            'u-block-description': 'text-muted-foreground text-sm font-medium leading-6',
            'u-block-content': 'text-card-foreground ',  
            'u-block-footer':
                'flex text-card-foreground gap-4 ',
            'u-block-actions':
                'flex flex-row text-card-foreground mb-auto gap-2 ',
        },
        badges: {
            'u-badge-default': ' bg-transparent   ',
            'u-badge-destructive': ' bg-destructive ',
            'u-badge-outline': ' bg-transparent border border-border  ',
            'u-badge-accent': ' bg-accent ',
            'u-badge-secondary': ' bg-secondary ',
            'u-badge-text': ' whitespace-nowrap tracking-tight font-medium ',
            'u-badge-default-text': ' text-primary ',
            'u-badge-destructive-text': ' text-destructive-foreground ',
            'u-badge-outline-text': ' text-card-foreground ',
            'u-badge-accent-text': ' text-accent-foreground ',
            'u-badge-secondary-text': ' text-secondary-foreground ',
        },
        tables: {
            // Base
            'u-table-base':
                'w-full border border-border bg-transparent border-collapse overflow-hidden rounded-lg',
            'u-table-header': 'border-border',
            'u-table-body': 'border-border',
            'u-table-footer': 'bg-muted/60 font-medium',
            'u-table-row':
                'flex overflow-hidden flex-row border-border border-b web:transition-colors web:hover:bg-muted/60 web:data-[state=selected]:bg-muted',
            'u-table-head':
                'text-muted-foreground text-left justify-center font-medium flex-1 h-12 px-4 text-sm',
            'u-table-cell':
                ' flex-row items-center text-foreground px-3 text-sm py-2',
            'u-table-head-text':
                'text-muted-foreground font-semibold tracking-tight leading-tight text-sm',
            'u-table-cell-text': 'text-foreground text-sm',
        },
        tabs: {
            // Container
            'u-controls-tabs-container': 'w-full flex-col ',

            // Header (use with inline styles or Tailwind plugin for scroll)
            'u-controls-tabs-header':
                'relative flex flex-1 flex-row flex-nowrap overflow-x-auto bg-muted/40 border border-border/60 rounded-xl overflow-y-hidden  web:scrollbar-none ',
            'u-controls-tabs-header-full-width':
                'relative w-full flex flex-1 flex-row flex-nowrap overflow-x-auto overflow-hidden bg-muted/40 border border-muted rounded-xl web:scrollbar-none ',

            // Header item base (shared styles without hover)
            'u-controls-tabs-header-item':
                'inline-flex flex-auto justify-center items-center whitespace-nowrap font-medium truncate disabled:pointer-events-none disabled:opacity-50 ',

            // Inactive tab (with hover effect)
            'u-controls-tabs-header-item-inactive': ' group web:hover:bg-muted web:duration-500',

            // Active tab (no hover effect)
            'u-controls-tabs-header-item-active':
                ' bg-popover shadow-sm web:duration-300 ',

            // Header item text
            'u-controls-tabs-header-item-text':
                'text-muted-foreground web:group-hover:text-card-foreground font-medium ',
            'u-controls-tabs-header-item-text-active':
                'text-card-foreground font-medium ',

            // Tab content
            'u-controls-tabs-tab-content': 'w-full',
            'u-controls-tabs-tab-content-animated':
                'web:animate-[tabContentFadeIn_0.2s_ease-out]',

            // Active indicator (absolute element matching active header item width)
            'u-controls-tabs-header-item-active-indicator':
                'absolute pointer-events-none web:transition-[left,width] web:duration-200 web:ease-out ',
            
            'u-controls-tabs-header-item-active-indicator-inner':
                ' h-px -bottom-px bg-ring/50 rounded-full  ',
        },
        
        tabs_sizes: {
            default_size: 'md',
            sm: {
                header: 'p-1 gap-1',
                item: ' h-8 px-2.5 text-sm rounded-lg web:focus-visible:outline-2  ',
                indicator: ' h-0.5 bottom-0 px-2 ',
                indicator_inner: ' rounded-full ',
                text: ' text-sm whitespace-nowrap  ',
                text_active: ' text-sm whitespace-nowrap  ',
            },
            md: {
                header: ' p-1 gap-1',
                item: ' h-10 px-4 lg:px-6 text-base rounded-lg web:focus-visible:outline-2 ',
                indicator: ' h-0.5 bottom-0  px-3',
                text: ' text-base ',
                text_active: ' text-base ',
            },
            lg: {
                header: ' p-1 gap-1.5 ',
                item: ' h-12 px-4 text-lg rounded-lg  web:focus-visible:outline-2',
                indicator: ' h-0.5 bottom-0  px-4 ',
                text: ' text-lg ',
                text_active: ' text-lg ',
            },
        },

        // Tooltip component styles and configuration
        tooltip: {            
            // Content container (no overflow-hidden to allow arrow to show)
            'tooltip-content': [
                'z-50 rounded-lg px-3 py-2',
                'bg-foreground shadow-lg',
            ].join(' '),
            
            // Text inside tooltip
            'tooltip-text': 'text-background text-sm font-medium',
            
            // Arrow base (rotated square approach - works with NativeWind)
            'tooltip-arrow': 'absolute w-3 h-3 bg-foreground rotate-45',
            
            // Arrow positions per placement
            'tooltip-arrow-bottom': '-top-1.5 left-1/2 -translate-x-1/2',   // tooltip below trigger
            'tooltip-arrow-top': '-bottom-1.5 left-1/2 -translate-x-1/2',   // tooltip above trigger
            'tooltip-arrow-left': '-right-1.5 top-1/2 -translate-y-1/2',    // tooltip left of trigger
            'tooltip-arrow-right': '-left-1.5 top-1/2 -translate-y-1/2',    // tooltip right of trigger
        },

        switcher: {
            // Container
            'u-controls-switcher-container':
                'items-center flex-row-reverse justify-between gap-x-2 min-w-12 rounded-xl flex-auto p-1.5 bg-input border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 ',

            // Text
            'u-controls-switcher-text': 'text-card-foreground text-base px-1.5',

            // Track
            'u-controls-switcher-track': 'rounded-full',
            'u-controls-switcher-track-base': 'w-14 h-8 p-1',
            'u-controls-switcher-track-sm': 'w-10 h-4 p-0.5',

            // Thumb
            'u-controls-switcher-thumb':
                'rounded-full  bg-white web:transition-transform web:duration-200',
            'u-controls-switcher-thumb-base': 'h-6 w-6',
            'u-controls-switcher-thumb-sm': 'h-3 w-3',

            // Active Thumb Position
            'u-controls-switcher-thumb-active-base': 'translate-x-6',
            'u-controls-switcher-thumb-active-sm': 'translate-x-6',

            // Track Colors
            'u-controls-switcher-track-col':
                'bg-neutral-400 dark:bg-neutral-600',
            'u-controls-switcher-track-active-col': 'bg-primary',
        },
        checkbox: {
            // Container
            'u-controls-checkbox-container':
                'items-center py-2 px-3 rounded-lg w-full',

            // Hover & Active backgrounds (optional — Web-only)
            'u-controls-checkbox-container-bg':
                'web:active:bg-neutral-200 web:dark:active:bg-neutral-700 web:hover:bg-neutral-100 web:dark:hover:bg-neutral-800',

            // Text labels
            'u-controls-checkbox-text':
                'text-neutral-800 dark:text-neutral-200 text-base leading-5 font-semibold',
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
                'h-2.5 w-2.5 rounded-full bg-primary m-1 items-center justify-center',
        },

        button_styles: {
            // Default button (neutral/popover)
            'u-btn-default-cnt': [
                ' bg-card web:hover:bg-muted/40 overflow-hidden web:active:bg-card/50 active:bg-card/50 ',
                ' border border-border/80 web:hover:border-border web:focus-visible:border-border  ',
                ' web:focus-visible:outline-offset-2 active:outline active:outline-accent active:outline-offset-1 active:outline-4  ',
                ' shadow-xs web:hover:shadow-md web:active:shadow-none active:shadow-none',    
            ].join(' '),
            'u-btn-default-text': 'font-medium text-secondary-foreground web:group-hover:text-foreground web:active:text-foreground active:text-foreground',
            'u-btn-default-trans': 'web:duration-200',

          
            // Primary button (primary/accent)
            'u-btn-primary-cnt': [
                // Background and main color
                ' bg-primary web:hover:bg-primary/90 overflow-hidden overflow-hidden web:active:bg-primary/80 active:bg-primary/80 ',
                ' web:focus-visible:outline-offset-2 active:outline active:outline-accent active:outline-offset-1 active:outline-4  ',
                ' shadow-xs web:hover:shadow-md web:active:shadow-none active:shadow-none  ',
                ' ',
            ].join(' '),
            'u-btn-primary-text': ' font-medium text-primary-foreground ',
            'u-btn-primary-trans': ' web:duration-200',


            'u-btn-accent-cnt':
                ' bg-accent overflow-hidden web:active:ring-2 web:active:ring-accent web:active:ring-offset-2 web:active:outline-none ',
            'u-btn-accent-text': ' font-medium text-white ',
            'u-btn-accent-trans': '  web:duration-200',
            'u-btn-accent-hover': 'web:group-hover:bg-white/10 web:duration-200',
            

            'u-btn-secondary-cnt': 'overflow-hidden web:group bg-secondary/80 web:hover:bg-secondary web:focus-visible:bg-secondary ',
            'u-btn-secondary-text':
                ' web:duration-200 font-medium text-secondary-foreground web:group-hover:text-foreground ',
            'u-btn-secondary-trans': ' web:duration-200 ',
            

            'u-btn-danger-cnt':
                '  dark:border-transparent bg-red-600 web:hover:bg-red-500 web:hover:shadow web:active:opacity-50 web:active:shadow-none',
            'u-btn-danger-text': 'font-medium text-danger-foreground',
            'u-btn-danger-trans': ' web:duration-200',
            

            'u-btn-text-cnt': ' web:group active:bg-muted web:focus-visible:bg-muted/60 web:hover:bg-muted/60 overflow-hidden ',
            'u-btn-text-text':
                ' font-medium text-secondary-foreground web:group-hover:text-foreground web:focus:text-foreground',
            'u-btn-text-trans': ' web:duration-200',
         

            'u-btn-link-cnt': '  group  ',
            'u-btn-link-text':
                ' font-medium text-label-link web:group-hover:text-label-linkhover web:group-hover:underline web:active:text-label-linkhover ',
            'u-btn-link-trans': ' web:duration-200  ',
            

            'u-btn-outline-cnt':
                ' bg-transparent border border-border/60 web:border-0 web:ring-1 backdrop-blur-xl web:ring-inset web:ring-border/80 ',
            'u-btn-outline-text':
                ' font-medium text-card-foreground web:group-hover:text-foreground ',
            'u-btn-outline-trans': '  web:duration-200',

            'u-btn-group-item-cnt': '   ',
            'u-btn-group-item-text':
                ' font-medium text-card-foreground web:group-hover:text-foreground ',
            'u-btn-group-item-icon':
                ' text-card-foreground web:group-hover:text-foreground ',

            'u-btn-group-item-default-cnt':
                'border-4 border-red-500 dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-default-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-default-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-primary-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-primary-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-primary-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-secondary-cnt':
                ' web:hover:bg-secondary h-full w-full overflow-hidden',
            'u-btn-group-item-secondary-text':
                'font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white',
            'u-btn-group-item-secondary-icon':
                'text-red-500 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-text-cnt':
                '  web:lg:hover:bg-secondary/80 web:active:bg-secondary web:duration-200 ',
            'u-btn-group-item-text-text':
                ' font-medium text-muted-foreground web:group-hover:text-foreground ',
            'u-btn-group-item-text-icon':
                ' text-muted-foreground web:group-hover:text-foreground ',

            'u-btn-group-item-link-cnt': '',
            'u-btn-group-item-link-text':
                'font-medium text-muted-foreground web:hover:text-foreground web:active:text-foreground  ',
            'u-btn-group-item-link-icon':
                'text-primary dark:text-primary web:dark:group-hover:text-primary',
            'u-btn-group-item-link-pressed-cnt': 'bg-accent ',
            'u-btn-group-item-link-pressed-text': 'text-primary',
            'u-btn-group-item-link-pressed-icon': 'text-primary',

            'u-btn-group-item-outline-cnt':
                'border border-bdritem dark:border-bdritem-d web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-outline-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-outline-icon':
                'text-neutral-700 dark:text-neutral-300 web:dark:group-hover:text-neutral-50',

            'u-btn-group-item-accent-cnt':
                'border border-transparent dark:border-transparent web:hover:bg-bgritem-h dark:web:hover:bg-bgritem-dh web:active:opacity-50',
            'u-btn-group-item-accent-text':
                'font-medium text-neutral-800 dark:text-neutral-200 web:dark:group-hover:text-neutral-50',
            'u-btn-group-item-accent-icon':
                'text-neutral-700 dark:text-neutral-300 web:web:dark:group-hover:text-neutral-50',

            'u-btn-label-cnt':
                'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 web:hover:bg-neutral-100 dark:web:hover:bg-neutral-800 web:active:opacity-70',
            'u-btn-label-text':
                'font-medium text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 dark:web:hover:text-neutral-200',
            'u-btn-label-trans': '  web:duration-200',

            'u-btn-group-divider-text-cnt':
                ' bg-transparent ',
        },
        buttons_group_styles: {
            'u-btn-default-cnt':
                ' flex-row bg-popover/80 web:hover:bg-popover shadow-xs border-[0.5px] border-border/60 web:border-0 web:ring-[0.5px] web:ring-inset web:ring-border/60 web:hover:ring-border web:active:opacity-50 ',
            'u-btn-accent-cnt':
                'border border-emerald-600 dark:border-emerald-500 bg-emerald-100 dark:bg-emerald-900 flex flex-row',
            'u-btn-outline-cnt':
                'border border-bdrbutton dark:border-bdrbutton-d flex flex-row',

            'u-btn-text-cnt':
                ' flex-row items-center  web:duration-200 ',

            'u-btn-secondary-cnt':
                '  flex-row bg-secondary/80  ',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 web:hover:text-neutral-950 dark:text-neutral-200 web:dark:group-hover:text-white ',
            'u-btn-secondary-trans': '   web:duration-300 ',

            'u-btn-link-cnt':
                ' border border-transparent dark:border-transparent flex flex-row web:active:opacity-50 items-center ',
            'u-btn-link-text':
                ' font-medium web:group-hover:underline text-card-foreground  web:hover:text-neutral-950 web:dark:hover:text-neutral-50 web:active:opacity-50 ',
            'u-btn-link-trans': '   web:duration-300 ',

            'u-btn-label-cnt':
                'border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex flex-row web:active:opacity-70',
            'u-btn-label-text':
                ' font-medium text-sm text-neutral-600 dark:text-neutral-400 web:hover:text-neutral-800 web:dark:hover:text-neutral-200 ',
            'u-btn-label-trans': '   web:duration-200 ',
        },
    },
}
