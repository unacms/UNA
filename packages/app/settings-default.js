import { env } from 'app/lib/env'

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
        avaliable_layouts: ['hor', 'ver', 'mixed'], // OLD appSetting('layout', 'format_list')
        default_layout: 'hor', //hor, ver, mixed// OLD appSetting('layout', 'format')
        max_width: ' full ', // consider for hor = max-w-screen-2xl, for ver = max-w-screen-xl
        max_width_block: 'max-w-screen-xl', // for hor = max-w-screen-xl, for ver = max-w-screen-lg
        search: true,
        extended_search: true,
        apps: true,
        show_profile_info: true,
        tooltips: true,
        hide_header_for_non_logged: false,
        hide_header_for_all: false,
        card_animation_duration: 0,
        user_remote_config: true,
        
        background_image_color: '', //OLD appSetting('layout', 'background_cover_color')
        background_image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_image_dark: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239C92AC' fill-opacity='0.08' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        
        splash_block: 'login', //OLD appSetting('layout', 'block')
        show_login_modal: 5000,
        redirect_on_forbidden: '/home',
        lock_unconfirmed: true,
        allow_create_new_profile: true,

        button_style_for_actions: 'secondary',
       
        share_text: '',
        default_icon_stroke_width: 1.5
    },

    native:{
        default_theme: 'auto',
        enable_screens: true, //OLD appSetting('layout', 'native_enable_screens')
        lazy_tabs: false, // OLD appSetting('layout', 'native_lazy_tabs')
        disable_screenshots: false, // OLD appSetting('layout', 'disable_screenshots')
        show_tabs_non_logged: true, // OLD appSetting('layout', 'show_nav_non_logged_native')
        use_custom_font: false, //'font-main' //OLD appSetting('layout', 'use_custom_font')
        bluetooth: false, //OLD appSetting('layout', 'bluetooth')
        bluetooth_device_name_prefix: 'NEO', //OLD appSetting('layout', 'bluetooth_device_name_prefix')
        onesignal_request_on_load: true
    },
    async_workers: {
        list: ['CounterChecker'], //['EventChecker'],//NotifChecker OLD appSetting('layout', 'async_workers')
        interval: 10, //OLD appSetting('layout', 'async_workers_interval')
    },
    cover:{
        use_background: false, //appSetting('layout', 'use_background')
        aspect_ratio: 'aspect-3/1', //appSetting('layout', 'cover_aspect')
        allow_edit: true, //appSetting('layout', 'allow_edit_covers')
        fixed: false, //appSetting('layout', 'fixed_cover')
        scroll: false, 
        split_action_menu: false, //OLD appSetting('layout', 'split_action_menu')
        back_button_url_for_profile: '/friends',  //OLD appSetting('layout', 'back_for_profile') 
        view_by_module: { //appSetting('layout', 'cover_mode'
            bx_courses: 'min',
            bx_jobs: 'min',
        },
    },
    comments:{
        hide_sort: false, //OLD appSetting('layout', 'hide_comments_sort')
        show_modal_in_feed: true, //OLD appSetting('layout', 'comments_in_modal')
        count_in_feed: 3, //OLD appSetting('layout', 'comments_count_in_feed')
        mentions: true, //OLD appSetting('layout', 'comments_mentions')
        in_reply: true, //OLD appSetting('layout', 'show_in_reply_comments')
    },
    dashboard:{
        url: '/dashboard',  //OLD appSetting('layout', 'dashboard')
        langs: ['ru', 'en'], //OLD appSetting('layout', 'switch_lang')
        switch_theme: true, //OLD appSetting('layout', 'switch_theme')
        modules_list: ['friends', 'followers', 'bx_ads', 'bx_forum', 'bx_posts', 'bx_events', 'bx_groups', 'bx_organizations', 'bx_spaces']
    },
    notifications:{
        url: '/notifications-view', //OLD appSetting('layout', 'notifications') 
        count_in_title: true, //OLD appSetting('layout', 'add_notifications_count_in_title')
    },
    carousel:{
        image_width: '', //appSetting('layout', 'carousel_image_width')
        image_aspect_ratio: ' aspect-square ',//appSetting('layout', 'carousel_image_aspect')
    },
    conductor:{
        show_nav_counters: 'primary', // OLD appSetting('layout', 'show_nav_counters')
        show_nav_titles: true, // OLD appSetting('layout', 'show_nav_titles')
        hide_browse_filter: true, // OLD appSetting('layout', 'hide_browse_filter')
        sidebar: '',
        sidebar_position: 'fixed'
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
        optional_text: '',// OLD appSetting('layout', 'form_fields_optional_text')
        mandatory_icon: 'Asterisk',// OLD appSetting('layout', 'form_fields_mandatory_icon')
        auto_ghosts_in_files: true, 
        without_captions: [ // OLD appSetting('forms', 'form_without_captions')
            'sys_login',
            'sys_account_create',
            'sys_forgot_password',
            'bx_invites_request_send',
        ],
        visibility_control_names: [ // appSetting('layout', 'form_' + name + '_control_names')
            '*_allow_view_to',
            '*_object_privacy_view',
        ],
        selector_control_names: ['*_cat'],

       /* sys_login: { hide_errors: true, button_full_width: true },
        
        sys_forgot_password: {
            hide_errors: true,
            button_full_width: true,
            button_hide_on_small: true,
        },
        bx_invites_request_send: {
            hide_errors: true,
            button_full_width: true,
            button_hide_on_small: true,
        },*/
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
        units:{
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
            pressed_classes: {
                pressed_container: ' sm:hover:bg-primary/20 sm:dark:hover:bg-primary-d/20 ',
                pressed_text: ' text-primary dark:text-primary-d group-hover:text-primary-700 dark:group-hover:text-primary-500 ',
            },
            button_rounded: false,
            align_items: 'between',
            no_gap_between_buttons: false, // is false no gap between buttons + right margin, is true  gap between buttons + no margin
        },
        counters_menu: {
            show_action: false,
            show_counter: true,
            show_combined: true,
            button_variant: 'link',
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
        unit_by_source: {
            'system/browse_friends': 'person_friends',
            'system/browse_recommendations_friends': 'person_friends_recommendations',
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
            default: 'Base'
        },
        unit_by_mode_bx_posts: {
            small: 'Small',
            context: 'Small',
            search: 'Search',
            default: 'Base'
        },
        unit_by_mode_bx_forum: {
            small: 'Small',
            context: 'Small',
            default: 'Base'
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
        transpile_urls: [// URLS for tabs in native app index = tab index
            {"index": 1, "url": "/friend-suggestions"},
            {"index": 1, "url": "/friend-requests"},
            {"index": 1, "url": "/sent-friend-requests"},
        ],
        iconset: {
            'profile-check-in': 'Check',
            'edit-event-questionnaire': 'List',
            'edit-event-sessions': 'Calendar',
            'item-comment': 'MessageCircleMore',
            'item-share': 'Share2',
            'edit': 'Pencil',
            'delete': 'Trash',
            'messenger': 'MessageCircleMore',
            'profile-confirm': 'Check',
            'profile-set-acl-level': 'Award',
            'profile-set-badges': 'BadgeCheck',
            'job-questionnaire': 'List',
            'invite-to-job': 'UserPlus',
            'users': 'UsersRound',
            'camera-retro': 'Video',
            'file-alt': 'File',
            'info-circle': 'Info',
            'user': 'User',
            'building': 'Building2',
            'image': 'Image',
            'farx': 'MessagesSquare',
            'comments': 'MessagesSquare',
            'comments': 'MessagesSquare',
            'calendar': 'Calendar',
            'fa-book': 'LibraryBig',
            'ad': 'File',
            'object-group':'SquareStack',
            'film':'Video',
            'hashtag': 'Hash',
            'shopping-cart': 'Store',
            'book-reader': 'LibraryBig',
            'briefcase': 'Calendar',
            'tasks': 'ListChecks',
            'tachometer-alt': 'LayoutDashboard',
            'wrench': 'Wand',
            'cart-plus': 'Wallet',
            'cog': 'Cog',
            'sign-out-alt': 'LogOut',
            'clock': 'Clock',

          
           
          
         
            /*
            
            'MagnifyingGlass': 'Search', 
               'Chats': 'MessageSquare',
              'ChatCircleText': 'MessageCircleMore',
             'CaretLeft': 'ChevronLeft',
             'ArrowFatUp': 'ArrowBigUp',
              'ArrowFatDown': 'ArrowBigDown',
               'ArrowBendLeftUp': 'Reply',
            'CirclesThree': 'Building2',
              'ChatCenteredText': 'MessageSquareText',
              'ChatTeardropDots': 'MessageCircleMore',
              'AddressBook': 'BookUser',
              'Layout': 'PanelsTopLeft',
               'DotsThreeOutline': 'Ellipsis',
              'Fire': 'Flame',
             'UsersThree': 'Group',
            'Question': 'HelpCircle',
              'SignIn': 'LogIn',
             'UserSwitch': 'UserCheck',
            'ShareFat': 'Share2',
             'Smiley': 'Smile',
              'CirclesFour': 'LayoutGrid',
               'Storefront':'Store',
            'UserList': 'UsersRound',
            'UserCircleGear': 'UserCog',
            'UserFocus': 'CircleUser',
            'UsersFour': 'UserCheck',
             'Users': 'UsersRound',
           'UserCirclePlus': 'UserRoundPlus',
            'ImageSquare': 'Image',
             'SignOut': 'LogOut',
           'PaperPlane': 'SendHorizontal',
            'BookmarkSimple': 'Bookmark',
            'ArrowsClockwise': 'RefreshCcw',
            'WarningCircle': 'AlertCircle',
             'ChatCircle': 'MessageCircle',
           'UserCircleMinus': 'UserMinus',
            
             'SealCheck': 'ShieldCheck',
           'IdentificationBadge': 'Badge',
             'LinkSimple': 'Link',
            
               'IntersectThree': 'Intersect',
              'Intersect': 'CircleDashed',
           'Translate': 'Languages',
             'MagicWand': 'Wand',
            'Student': 'GraduationCap',
          'DotsThreeVertical': 'EllipsisVertical'*/

        },
        menu_navbar: [
            { name: 'home', title: 'Home', link: '/', icon: 'House' },
            { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false },
            { name: 'explore', title: 'Explore', link: '/explore', icon: 'Compass', logged: false },
            { name: 'videos-home', title: 'Video', link: '/videos-home', icon: 'Video' },
            { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Store' },
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'Group' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }
        ],
        menu_tabbar_logged: [
            { key: '/tab0', title: 'Home', url: '/home', icon: 'House' },
            { key: '/tab1', title: 'Friends', url: '/friends', icon: 'Users' },
            { key: '/tab2', title: 'Messages', url: '/messenger', icon: 'MessageCircleMore' },
            { key: '/tab3', title: 'Notifications', url: '/notifications-view', icon: 'Bell' },
            { key: '/tab4', title: 'Dashboard', url: '/dashboard', icon: 'Award' }
        ],
        
        menu_tabbar_non_logged: [
            { key: '/tab0', title: 'Home', url: '/home', icon: 'House' },
            { key: '/tab1', title: 'Explore', url: '/explore', icon: 'Compass' },
            { key: '/tab2', title: 'About', url: '/about', icon: 'Info' },
            { key: '/tab3', title: 'Contact', url: '/contact', icon: 'Contact' },
            { key: '/tab4', title: 'Terms', url: '/terms', icon: 'Info' }
        ],
    },
    layouts: {},
    theme: {
        profile_colors: [//OLD appSetting('layout', 'profile_colors')
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
        native_tabs:{
            tabBarItemStyle:{
                marginBottom: 0,
                height: 48,
                marginTop: 4,
                paddingBottom: 0,
                borderRadius: 12,
                marginLeft: 0,
                marginRight: 0,
                overflow: 'hidden',
            }
        },
        light: {
            primary: 'rgba(37,99,235,1)',
            headerBackground: 'rgba(255,255,255,1)',
            barsBackground: 'rgba(255,255,255,1)', //header and tabbar background in native light mode
            bottomSheetBackground: 'rgba(255,255,255,1)',
            barsColor: '#4B5563',
            selectBorder: 'rgba(156, 163, 175, 0.3)',
            fieldBackground: 'rgba(249, 240, 251, 1)',
            blockBorder: '#E5E7EB',
            tabsBackground: 'rgba(255,0,0,1)',
            activeTabBackground: '#DBEAFE',
            tabText: 'rgba(75,85,99,1)',
            activeTabText: 'rgba(3,7,18,1)',
            screenBackground: 'rgba(229,231,235,1)',
            bgrmodal: 'rgba(255,255,255,1)',
            bdrModal: 'rgba(107,114,128,0.15)',
            checkbox: '#2563eb',
            safeAreaBackground: 'rgba(255,255,255,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
            fgTertiary: 'rgba(75,85,99,1)'
        },
        dark: {
            default: 'rgba(209,213,219,1)', //fix for icons color in iOS
            headerBackground: 'rgba(17,24,39,1)',
            primary: 'rgba(37,99,235,1)',
            barsBackground: 'rgba(17,24,39,1)', //header background in native
            bottomSheetBackground: 'rgba(17,24,39,1)',
            barsColor: 'rgba(209,213,219,1)', //tabbar icons color in native
            selectBorder: 'rgba(55, 65, 81, 0.3)', 
            fieldBackground: '#030712',
            blockBorder: '#030712',
            tabText: 'rgba(156,163,175,1)',
            activeTabText: 'rgba(249,250,251,1)',
            screenBackground: 'rgba(17,24,39,1)',
            bgrmodal: 'rgba(31,41,55,1)',
            bdrModal: 'rgba(107,114,128,0.15)',
            checkbox: '#0ea5e9',
            safeAreaBackground: 'rgba(17,24,39,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
            fgTertiary: 'rgba(156,163,175,1)'
        },
        conductor: {
            menu: ' w-full items-left justify-center border-b border-bdrtabbar dark:border-bdrtabbar-d bg-bgrtabbar dark:bg-bgrtabbar-d  ',
            menu_max_width: ' max-w-6xl ',
            content_max_width: ' max-w-6xl ',
            menu_is_dynamic: true,
            menu_cnt: ' ml-3 sm:ml-4 gap-x-1 flex-row ',
            right_column_cnt: 'fixed-process p-4 max-w-md',
            topmenu_cnt: 'w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex p',
            topmenu_button_variant: 'text',
            topmenu_button_variant_active: 'secondary',
            topmenu_button_align: 'start',
            topmenu_button_fullWidth: false,
            topmenu_button_size: 'base',
            topmenu_button_pressed: true
        },
        checkbox : {
            container: ' h-[20px] w-[20px] m-[4px] rounded-[4px] border-[2px] border-neutral-500 bg-transparent justify-center items-center   ',
            container_selected: ' m-[4px] h-[20px] w-[20px] rounded-[4px] border-[2px] border-neutral-500 bg-transparent justify-center items-center ',
            selected: ' h-[10px] w-[10px] rounded-[2px] bg-primary m-[4px]',  
            text: '  text-neutral-800 dark:text-neutral-200 text-[16px] leading-[20px] font-medium ',
            selected_icon: false,
        },  
        checkbox_set : {
            container:  '  gap-x-2 items-center',
        },
        switcher: {
            container:  'gap-x-2 items-center',
            text:  'text-neutral-800 dark:text-neutral-200 text-sm',
            track: '#cccccc',
            active_track: '#0ea5e9',
            thumb: '#ffffff',
            active_thumb: '#ffffff'
        },
        doublerange: {
            container:  'w-full items-center justify-between mt-2',
            value_container:  'w-36 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput py-2 px-4 text-center rounded-lg justify-between',
            text_value: 'text-neutral-700 dark:text-neutral-300',
            text_info: '',
            track_height: 4,
            thumb_size: 15,
            outbound_color:{
                light: 'rgb(242, 242, 242)',
                dark: 'rgb(242, 242, 242)',
            },
            inbound_color:{
                light: 'rgb(242, 242, 242)',
                dark: 'rgb(242, 242, 242)',
            }, 
            thumb_tint_color:{
                light: '#2563eb',
                dark: '#2563eb',
            } 
        },
        dropdown_menu: {
            content_shadow: ' shadow-xl  ',
            content_ver:
                ' z-10 min-w-[200px] backdrop-blur-xl border border-bdrmodal dark:border-bdrmodal-d bg-bgrmodal dark:bg-bgrmodal-d mt-1 p-1 text-sm rounded-xl shadow-xl shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(0,0,0,1)] overflow-hidden gap-y-1 ',
            content_hor:
                ' flex flex-row z-10 p-1 bg-bgrmodal border border-bdr dark:border-bdr-d m-2 backdrop-blur-xl dark:bg-bgrmodal-d text-sm text-neutral-800 dark:text-neutral-200 rounded-full ',
            item_ver:
                'flex flex-row focus:outline-none items-center px-3 py-2 gap-x-3 text-sm rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-neutral-700 dark:text-neutral-300 dark:hover:text-white hover:cursor-pointer',
            item_hor:
                'flex block px-3 py-2 hover:-translate-y-1 active:-translate-y-1 dark:hover:text-white rounded-full hover:cursor-pointer text-neutral-700  hover:scale-125 active:scale-95 duration-200 dark:text-neutral-300 outline-none ',
            item_np:
                'flex flex-row focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-300 dark:hover:text-white hover:cursor-pointer',
            item_cnt: 'items-center gap-x-3',
            item_text:
                'text-sm font-medium text-neutral-800 dark:text-neutral-200',
            item_icon: 'text-2xl text-neutral-700 dark:text-neutral-300',
        },
        modal: {
            fog: 'bg-white/50 dark:bg-black/80 backdrop-blur ',
            container: 'max-w-2xl h-full sm:h-auto  shadow-modal dark:shadow-modal-d bg-bgrmodal dark:bg-bgrmodal-d {ls}:rounded-2xl sm:border border-bdrmodal dark:border-bdrmodal-d overflow-hidden',
            content:
                ' h-auto ',
            header: ' p-[12px] items-start justify-start border-b border-bdr dark:border-bdr-d',
        },
        card: {
            default: ' overflow-hidden bg-bgrcard dark:bg-bgrcard-d ',
            border: '  border-bdrcard dark:border-bdrcard-d ',
            rounded: 'rounded-2xl',
            margin: ''
        },
        inputs: {
            default:
                ' bg-bgrinput dark:bg-bgrinput-d focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-bdrinput dark:border-bdrinput-d focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-primary dark:focus-outline-primary-d duration-100 placeholder-neutral-500 duration-100 text-neutral-900 rounded-lg h-12 flex-auto p-3 leading-6 dark:text-neutral-100 text-base ',
            multi: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto p-2 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 ',
            rounded:
                ' placeholder-neutral-500 pl-10 bg-bgrinput dark:bg-bgrinput-d hover:bg-bgrinput-h dark:hover:bg-bgrinput-dh focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-transparent focus:border-bdrinput-f dark:focus:border-bdrinput-f focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-primary dark:focus-outline-primary-d duration-100 text-neutral-900 rounded-full flex-auto px-3 dark:text-neutral-100 text-base leading-5 h-11  ',
            roundedsmall:
                ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[34px] ',
            small: ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[36px] ',
        },

        button_sizes: {
            default_size: 'base',
            default_variant: 'default',
            pressed_container:
                ' bg-primary-100 dark:bg-primary-950',
            pressed_text:
                ' text-primary-700 dark:text-primary-300 group-hover:text-primary-800 dark:group-hover:text-primary-200 ',
            xs: {
                rounded: ' rounded-[6px] overflow-hidden ',
                padding: ' h-[28px] min-w-[28px] p-[4px] ',
                icon_sizes:
                ' h-[20px] w-[20px] ', //icon container size
                icon_size: ' 20px ', //icon size
                icon_margin: ' mx-[0px] ', //conditional margin for icon container when title is present
                min_height: ' ',
                margin: ' px-[4px] leading-[20px] native:text-[14px] web:text-sm ',
            },
            sm: {
                rounded: ' rounded-[8px] overflow-hidden ',
                padding: ' h-[36px] min-w-[36px] px-[6px] ',
                icon_sizes: ' h-[24px] w-[24px] ',
                icon_size: ' 24px ',
                icon_margin: ' ',
                min_height: ' ',
                margin: ' mx-[4px] my-auto native:text-[14px]  web:text-sm ', // margin around text
            },
            base: {
                rounded: ' rounded-[10px] overflow-hidden ',
                padding: ' h-[44px] min-w-[44px] px-[8px] ',
                icon_sizes: ' h-[24px] w-[24px]',
                icon_size: '24px',
                icon_margin: ' mx-[4px] ',
                min_height: '  ',
                margin: ' mx-[6px] my-auto native:text-[16px] ',
            },
            lg: {
                rounded: ' rounded-[12px] overflow-hidden ',
                padding: ' min-w-[48px] h-[48px] px-[6px] ',
                icon_sizes: ' p-[10px] h-[48px] w-[48px] ',
                icon_size: 28,
                icon_margin: '  ',
                min_height: ' leading-[40px] sm:text-[16px] ',
                margin: ' mx-[10px] my-auto native:text-[16px] ',
            },
        },

        button_styles: {
            'u-btn-default-cnt':
                ' bg-bgrbutton dark:bg-bgrbutton-d border-bdrbutton dark:border-bdrbutton-d hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-default-text':
                ' font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-default-trans': 'web:duration-200',
            /*'u-btn-default-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-default-color-icon-dark': 'rgb(243, 244, 246)',*/

            'u-btn-primary-cnt':
            ' group bg-primary-500 dark:bg-primary-600 border border-transparent sm:hover:border-transparent dark:border-primary-500 sm:hover:bg-primary-600 dark:sm:hover:bg-primary-700 sm:dark:hover:border-primary-600 ',
            'u-btn-primary-text': '  font-medium text-white ',
            'u-btn-primary-trans': ' web:duration-200 ',
            'u-btn-primary-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-primary-color-icon-dark': 'rgb(243, 244, 246)',

            'u-btn-secondary-cnt':
                ' bg-neutral-200 dark:bg-neutral-800 sm:hover:bg-neutral-300 sm:dark:hover:bg-neutral-700  ',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-secondary-trans': ' web:duration-200',
            /*'u-btn-secondary-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-secondary-color-icon-dark': 'rgb(243, 244, 246)',*/

            'u-btn-danger-cnt':
                ' bg-red-600 hover:bg-red-500 hover:shadow active:opacity-50 active:shadow-none  ',
            'u-btn-danger-text':
                ' font-medium text-neutral-100 group-hover:text-white ',
            'u-btn-danger-trans': ' web:duration-200 ',
            /*'u-btn-danger-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-danger-color-icon-dark': 'rgb(243, 244, 246)',*/

            'u-btn-text-cnt':
                '  hover:bg-bgrbutton dark:hover:bg-bgrbutton-d bg-transparent active:bg-bgrbutton-h dark:active:bg-bgrbutton-dh text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50 ',
            'u-btn-text-text':
                ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
            'u-btn-text-trans': ' web:duration-200 ',
            /*'u-btn-text-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-text-color-icon-dark': 'rgb(243, 244, 246)',*/

            'u-btn-link-cnt': ' bg-transparent px-0 ',
            'u-btn-link-text':
                ' font-semibold group-hover:underline text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-neutral-50 ',
            'u-btn-link-trans': ' web:duration-200 ',
            'u-btn-link-color-icon-light': 'rgba(37,99,235,1)',
            'u-btn-link-color-icon-dark': 'rgba(37,99,235,1)',

            'u-btn-outline-cnt':
                ' shadow-outline bg-bgrcard dark:shadow-outline-d native:border border-bdrbutton dark:border-bdrbutton-d dark:bg-bgrcard-d hover:bg-bgrbutton dark:hover:bg-bgrbutton-dh ',
            'u-btn-outline-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',
            'u-btn-outline-trans': ' web:duration-200',
            /*'u-btn-outline-color-icon-light': 'rgb(243, 244, 246)',
            'u-btn-outline-color-icon-dark': 'rgb(243, 244, 246)',*/

            'u-btn-group-item-cnt':
                ' hover:bg-bgritem-h dark:hover:bg-bgritem-dh active:opacity-50  ',
            'u-btn-group-item-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',

            'u-btn-group-item-default-cnt':
                ' hover:bg-bgritem-h dark:hover:bg-bgritem-dh active:opacity-50  ',
            'u-btn-group-item-default-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',

            'u-btn-group-item-primary-cnt':
                ' hover:bg-bgritem-h dark:hover:bg-bgritem-dh active:opacity-50  ',
            'u-btn-group-item-primary-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',

            'u-btn-group-item-secondary-cnt':
                ' hover:bg-bgritem-h dark:hover:bg-bgritem-dh active:opacity-50  ',
            'u-btn-group-item-secondary-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',

            'u-btn-group-item-text-cnt':
                ' hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-group-item-text-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',

            'u-btn-group-item-link-cnt':
                ' ',
            'u-btn-group-item-link-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',
            'u-btn-group-item-link-pressed-cnt':
                ' bg-transparent ',
            'u-btn-group-item-link-pressed-text':
                'text-primary-700 dark:text-neutral-600 group-hover:text-primary-800 dark:group-hover:text-primary-500 ',

            'u-btn-group-item-outline-cnt':
                ' hover:bg-bgritem-h dark:hover:bg-bgritem-dh active:opacity-50  ',
            'u-btn-group-item-outline-text':
                ' font-medium text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-neutral-50 ',
        },
        buttons_group_styles: {
            'u-btn-default-cnt':
                ' border border-bdrbutton dark:border-bdrbutton-d bg-bgrbutton dark:bg-bgrbutton-d flex flex-row  overflow-hidden ',
            'u-btn-outline-cnt':
                ' border border-bdrbutton dark:border-bdrbutton-d overflow-hidden flex flex-row ',

            'u-btn-text-cnt': 'flex flex-row active:opacity-50 items-center ',

            'u-btn-secondary-cnt':
                ' bg-bgritem dark:bg-bgritem-d hover:bg-none dark:hover:bg-none active:opacity-50 overflow-hidden flex flex-row',
            'u-btn-secondary-text':
                ' font-medium text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 dark:group-hover:text-white ',
            'u-btn-secondary-trans': ' duration-200 ',

            'u-btn-link-cnt': ' flex flex-row active:opacity-50 items-center ',
            'u-btn-link-text':
                ' font-medium group-hover:underline text-neutral-700 dark:text-neutral-300  hover:text-neutral-950 dark:hover:text-neutral-50 active:opacity-50 ',
            'u-btn-link-trans': ' duration-200 ',
        },
    },
}
