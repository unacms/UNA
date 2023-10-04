export const settingsDefault = {
    layout: {
        max_width: 'full',
        cell_gap: 4,
        cell_style: '',
        show_user_icon: true,
        search: true,
        messenger: true,
        apps: true,
        block: 'login',
        allow_switch_profile: true,
        dots_background_image: `url("data:image/svg+xml,%3Csvg width='36' height='36' viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 0H0v36h36V0zM15.126 2H2v13.126c.367.094.714.24 1.032.428L15.554 3.032c-.188-.318-.334-.665-.428-1.032zM18 4.874V18H4.874c-.094-.367-.24-.714-.428-1.032L16.968 4.446c.318.188.665.334 1.032.428zM22.874 2h11.712L20 16.586V4.874c1.406-.362 2.512-1.468 2.874-2.874zm10.252 18H20v13.126c.367.094.714.24 1.032.428l12.522-12.522c-.188-.318-.334-.665-.428-1.032zM36 22.874V36H22.874c-.094-.367-.24-.714-.428-1.032l12.522-12.522c.318.188.665.334 1.032.428zm0-7.748V3.414L21.414 18h11.712c.362-1.406 1.468-2.512 2.874-2.874zm-18 18V21.414L3.414 36h11.712c.362-1.406 1.468-2.512 2.874-2.874zM4.874 20h11.712L2 34.586V22.874c1.406-.362 2.512-1.468 2.874-2.874z' fill='%239ca3af' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,        
        shapes_background_image: ` url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%239ca3af' fill-opacity='0.1'%3E%3Cpath fill-rule='evenodd' d='M11 0l5 20H6l5-20zm42 31a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM0 72h40v4H0v-4zm0-8h31v4H0v-4zm20-16h20v4H20v-4zM0 56h40v4H0v-4zm63-25a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM53 41a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-30 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-28-8a5 5 0 0 0-10 0h10zm10 0a5 5 0 0 1-10 0h10zM56 5a5 5 0 0 0-10 0h10zm10 0a5 5 0 0 1-10 0h10zm-3 46a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 0l5 20H16l5-20zm43 64v-4h-4v4h-4v4h4v4h4v-4h4v-4h-4zM36 13h4v4h-4v-4zm4 4h4v4h-4v-4zm-4 4h4v4h-4v-4zm8-8h4v4h-4v-4z'/%3E%3C/g%3E%3C/svg%3E")`, 
        bamboo_background_image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='32' viewBox='0 0 16 32'%3E%3Cg fill='%239ca3af' fill-opacity='0.1'%3E%3Cpath fill-rule='evenodd' d='M0 24h4v2H0v-2zm0 4h6v2H0v-2zm0-8h2v2H0v-2zM0 0h4v2H0V0zm0 4h2v2H0V4zm16 20h-6v2h6v-2zm0 4H8v2h8v-2zm0-8h-4v2h4v-2zm0-20h-6v2h6V0zm0 4h-4v2h4V4zm-2 12h2v2h-2v-2zm0-8h2v2h-2V8zM2 8h10v2H2V8zm0 8h10v2H2v-2zm-2-4h14v2H0v-2zm4-8h6v2H4V4zm0 16h6v2H4v-2zM6 0h2v2H6V0zm0 24h2v2H6v-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        
        background_image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239ca3af' fill-opacity='0.1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        background_image_dark: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%239ca3af' fill-opacity='0.1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
 
    },
    sockets: {
        host: 'ci.una.io',
        port: '443',
        key: 'app-key',
    },
    jitsi: {
        prefix: 'prefix_',
        domain: 'https://meet.jit.si/',
    },
    urls: {
        embeds: 'https://ci.una.io/test3/oembed.php?html=1&a=get_link&l=',
        images: 'https://ci.una.io/test3/image_transcoder.php?o=sys_custom_images&u=',
        notifs: 'https://ci.una.io/test3/api.php?r=bx_notifications/get_unread_notifications_num_ex&params[]=',
    },
    lang_keys: {
        comment_list_title: 'Comments',
        comment_sorting_asc: 'Oldest first',
        comment_sorting_desc: 'Newest first',
        vote_performed_by_popup_title: 'Likes',
        rvote_performed_by_popup_title: 'Reactions',
        rvote_like_title: 'Like',
        rvote_love_title: 'Love',
        rvote_joy_title: 'Joy',
        rvote_surprise_title: 'Surprise',
        rvote_sadness_title: 'Sadness',
        rvote_anger_title: 'Anger',
        score_performed_by_popup_title: 'Upvotes',
        ntfs_popup_title: 'Notifications',
        ntfs_popup_view_all: 'View all',
        search_popup_title: 'Search',
        search_popup_view_extended: 'Extended',
        feed_type_bx_posts: 'published a Post',
        feed_type_bx_groups: 'created a Group',
        feed_type_bx_events: 'created an Event',
        feed_action_added: '',
    },
    cache: {
        list: true,
        compress: true
    },
    feed: {
        show_selector_view: true,
        default_view: '',
        show_html: false,
        show_multi: true,
        default_feed: 'account',
    },
    entry: {
        default_view: '',
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
            { width: 1280, count: 5 },
            { width: 1024, count: 4 },
            { width: 768, count: 3 },
            { width: 640, count: 2 },
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
        connection: {
            show_action_as_button: true,
        },
        recommendation: {
            show_action_as_button: true,
        },
    },
    menu_items: {
        menu_top: [
            { name: 'home', title: 'Home', link: '/', icon: 'home'},
            { name: 'friends', title: 'Friends', link: '/friends', icon: 'Users', nonlogged: false }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
        ],
        menu_top_more: [
            { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour' }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'discussion-home', title: 'Discussions', link: '/discussions-home', icon: 'comments' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
            { name: 'products-home', title: 'Market', link: '/products-home', icon: 'Storefront' }, 
        ],
        menu_add: [
            { name: 'create-post',title: 'Create post', link: '/create-post', icon: 'ChatCenteredText'},
            { name: 'create-group-profile',title: 'Create group', link: '/create-group-profile', icon: 'UsersThree'},
            { name: 'create-event-profile',title: 'Create event', link: '/create-event-profile', icon: 'Calendar'},
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
            items: ['posts-home', 'posts-popular',],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-post' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_posts'},
            ],
        },
        bx_market_submenu: {
            name: 'Market',
            icon: 'Storefront',
            items: ['products-home', 'products-popular', 'products-categories', 'products-category'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-product' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_market'},
            ],
        },
        bx_posts_view_actions: [
            'edit-post', 
            'delete-post'
        ],
        bx_market_view_actions: [
            'edit-product', 
            'delete-product'
        ],
        bx_persons_submenu: {
            name: 'People',
            icon: 'UsersFour',
            items: ['persons-home', 'persons-active'],
            add: [
                {icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_persons'},
            ],
        },
        bx_events_submenu: {
            name: 'Events',
            icon: 'Calendar',
            items: ['events-home', 'events-top', 'events-joined', 'events-followed'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-event-profile' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_events' },
            ],
        },
        sys_con_submenu: {
            name: 'Connections',
            icon: 'Users',
            items: ['friends', 'friend-suggestions', 'friend-requests', 'sent-friend-requests', 'follow-suggestions', 'followers', 'following'],
            add: [
                {icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_persons'},
            ],
        },
        bx_persons_view_submenu: [
            'view-persons-profile',
            'persons-profile-info',
            'persons-profile-friends',
            'persons-profile-subscriptions',
        ],
        bx_persons_view_meta: {
            iconset: {
                friends: 'Users',
                subscribers: 'Users',
            },
            items: [ 'friends', 'subscribers'],
        },
        bx_persons_view_actions_all: [
            'profile-friend-add',
            'profile-friend-remove',
            'profile-subscribe-add',
            'profile-subscribe-remove',
            'edit-persons-profile',
            'messenger',
        ],
        bx_groups_submenu: {
            name: 'Groups',
            icon: 'UsersThree',
            items: ['groups-home', 'groups-joined', 'groups-followed'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-group-profile' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_groups'},
            ],
        },
        bx_forum_submenu: {
            name: 'Discussions',
            icon: 'comments',
            items: ['discussions-home', 'discussions-categories', 'discussions-category'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-discussion' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_forum'},
            ],
        },
        bx_groups_view_submenu: [
            'view-group-profile', 
            'group-fans'
        ],
        bx_groups_view_meta: {
          iconset: {
              members: 'Users',
              friends: 'Users',
              subscribers: 'Users',
          },
          items: ['members', 'friends', 'subscribers'],
        },
        bx_groups_view_actions_all: [
          'profile-fan-add',
          'profile-fan-remove',
          'profile-subscribe-add',
          'profile-subscribe-remove',
          'edit-group-profile',
          'delete-group-profile',
        ],
        bx_events_view_submenu: [
            'view-event-profile', 
            'event-fans'
        ],
        bx_events_view_meta: {
          iconset: {
              members: 'Users',
              friends: 'Users',
              subscribers: 'Users',
          },
          items: ['members', 'friends', 'subscribers'],
        },
        bx_events_view_actions_all: [
          'profile-fan-add',
          'profile-fan-remove',
          'profile-subscribe-add',
          'profile-subscribe-remove',
          'edit-event-profile',
          'delete-event-profile',
        ],
        bx_channels_submenu: {
            name: 'Channels',
            icon: 'Hash',
            items: ['channels-home', 'channels-top'],
            add: [
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=keyword&section=bx_channels' },
                { icon: 'DotsThreeOutlineVertical', name: 'More' },
            ],
        },
        bx_channels_view_submenu: [
            'view-channel-profile'
        ],
        bx_timeline_menu_item_manage: [
            'item-edit', 
            'item-delete'
        ],
    },

    layouts: {
        messenger: {
            layout: 'messenger',
            blocks: {
                main: { name: 'bx_messenger:get_main_messenger_page', showTitle: false },
            },
            headerSettings: { offset: false, header: false }
        },
        login: {
            layout: 'login',
            blocks: {
                form: { name: 'system:login_form', showTitle: false },
            },
            max_width: 'max-w-2xl',
        },
        'create-account': {
            layout: 'create-account',
            blocks: {
                form: { name: 'system:create_account_form', showTitle: false },
            },
        },
        dashboard: {
            layout: 'dashboard',
            top:true,
            blocks: {
                profile_switcher: { name: 'system:account_profile_switcher', showTitle: false, showBg: true },
                stat_block: { name: 'system:get_stat_block', showTitle: false, showBg: true },
            },
            headerSettings: { header: true, backButton: false, menu: true, title: true },
        },
        'search-keyword': {
            layout: 'navigator_search',
            blocks: {
                browse: { name: 'system:search_keyword_result', showTitle: false, showBg: false },
            },
            icon: 'Search',
            headerSettings: { backButton: false, header: true, menu: true }
        },
        home: {
            layout: 'home',
            top:true,
            blocks: {
                public_feed_form: { name: 'bx_timeline:get_block_post_home', showTitle: false, showBg: false },
                messenger_contacts: { name: 'bx_messenger:get_block_contacts_messenger', showTitle: true, showBg: false },
                public_feed: {name: 'bx_timeline:get_block_view_home', showTitle: false, showBg: false },
                account_feed_form: {name: 'bx_timeline:get_block_post_account', showTitle: false, showBg: false },
                account_feed: {name: 'bx_timeline:get_block_view_account', showTitle: false, showBg: false },
                hot_feed: {name: 'bx_timeline:get_block_view_hot', showTitle: false, showBg: false },

                login: {name: 'system:login_form', showTitle: false, showBg: false },
                signup: {name: 'system:create_account_form', showTitle: false, showBg: false },

                profile_switcher: { name: 'system:account_profile_switcher', showTitle: false, showBg: true },
                intro: { name: 'static:intro', showTitle: false, showBg: false },
                home_intro: { name: 'static:home_intro', showTitle: false, showBg: false },
                home_footer: { name: 'static:home_footer', showTitle: false, showBg: false },
                footer: { name: 'static:footer', showTitle: false, showBg: false },
                menu: { name: 'system:profile_menu', showTitle: false, showBg: false },
                friends: { name: 'system:browse_recommendations_friends', showTitle: false, showBg: false },
                subscriptions: { name: 'system:browse_recommendations_subscriptions', showTitle: false, showBg: false },
            },
            header: [
                { icon: 'plus', name: 'Add', link: '/create-post' },
                { icon: 'search', name: 'Search', link: '?keyword=' },
            ],
            headerSettings: {header: true, backButton: false, menu: true, title: false },
        },
        //############ EVENTS PAGES ############
        'events-home': {
            layout: 'navigator',
            blocks: {
                browse: {name: 'bx_events:browse_recent_profiles', showTitle: false, showBg: false },
            },
            icon: 'Egg',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'events-top': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:browse_top_profiles', showTitle: false, showBg: false },
            },
            icon: 'ChatCircle',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'events-joined': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:browse_joined_entries', showTitle: false, showBg: false },
            },
            icon: 'LinkSimple',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'events-followed': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_events:browse_followed_entries', showTitle: false, showBg: false },
            },
            icon: 'Binoculars',
            headerSettings: { backButton: false, header: false, offset: false, menu: true }
        },
        'view-event-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col2: { name: 'bx_events:entity_info', showTitle: false, showBg: false, perLine: 1, sidebar: true },
                col3: { name: 'bx_events:get_block_view_profile', showTitle: false, showBg: false, perLine: 1, sidebar: true },
            },
            headerSettings: { offset: false, header: false }
        },
        'event-fans': {
            layout: 'profile',
            blocks: {
                col1: { name: 'bx_events:fans_table', showTitle: false, showBg: false },
            },
        },
        //############ POSTS PAGES ############
        'posts-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_posts:browse_public', showTitle: false, showBg: false, menu: true },
            },
            icon: 'Egg',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'posts-popular': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_posts:browse_popular', showTitle: false, showBg: false },
            },
            icon: 'ChatCircle',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
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
            headerSettings: { header: false, footer: false, offset: false },
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

        //############ MARKET PAGES ############
        'products-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_market:browse_public', showTitle: false, showBg: false},
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
            icon: 'HouseSimple',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'products-category': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_market:browse_category', showTitle: false, showBg: false },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
            icon: 'CirclesFour',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'products-categories': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:categories_list', showTitle: false, showBg: false },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
               // col3: { name: 'system:keywords_cloud', showTitle: false, showBg: true, sidebar: true },
            },
            icon: 'Folders',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'products-popular': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_market:browse_popular', showTitle: false, showBg: false },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
            icon: 'FireSimple',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
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
        //############ CONNECTION PAGES ############
        'friend-suggestions': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_recommendations_friends', showTitle: false, showBg: false },
            },
            icon: 'UserCircle',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'friends': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_friends', showTitle: false, showBg: false },
            },
            icon: 'UserList',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'follow-suggestions': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_recommendations_subscriptions', showTitle: false, showBg: false },
            },
            icon: 'UserFocus',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'followers': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_subscribed_me', showTitle: false, showBg: false },
            },
            icon: 'UsersFour',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'following': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_subscriptions', showTitle: false, showBg: false },
            },
            icon: 'UserSquare',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'friend-requests': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_friend_requests', showTitle: false, showBg: false}
            },
            icon: 'UserCirclePlus',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'sent-friend-requests': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:browse_friend_requested', showTitle: false, showBg: false },
            },
            icon: 'UserCircleGear',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        
        //############ DISCUSSION PAGES ############
        'discussions-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_forum:browse_new', showTitle: false, showBg: false, perLine: 1 },
                browse_sidebar: { name: 'bx_forum:browse_popular', showTitle: true, showBg: false, sidebar: true },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
                
            },
            icon: 'Egg',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'discussions-category': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_forum:browse_category', showTitle: false, showBg: false, perLine: 1, skeleton:'notifications' },
                browse_sidebar: { name: 'bx_forum:browse_popular', showTitle: true, showBg: false, sidebar: true },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
            icon: 'Folders',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'discussions-categories': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'system:categories_list', showTitle: false, showBg: false  },
                browse_sidebar: { name: 'bx_forum:browse_popular', showTitle: true, showBg: false, sidebar: true },
                categories: { name: 'system:categories_list', showTitle: false, showBg: true, sidebar: false, hidden:true },
            },
            icon: 'Folders',
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'view-discussion': {
            layout: 'post',
            top:true,
            blocks: {
                author: { name: 'bx_forum:entity_author', showTitle: false, showBg: false, forList: true, forHeader: true },
                text: { name: 'bx_forum:entity_text_block', showTitle: false, showBg: false, forList: true },
                attachments: { name: 'bx_forum:entity_attachments', showTitle: false, showBg: false, forList: true },
                actions: { name: 'bx_forum:entity_all_actions', showTitle: false, showBg: false, forList: true },
                comments: { name: 'bx_forum:entity_comments', showTitle: false, showBg: false },
            },
            headerSettings: { header: false },
        },
        //############ GROUPS PAGES ############
        'groups-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_groups:browse_recent_profiles', showTitle: false, showBg: false },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true },
            icon: 'Egg',
        },
        'groups-joined': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_groups:browse_joined_entries',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true },
            icon: 'Egg',
        },
        'groups-followed': {
            layout: 'navigator',
            blocks: {
                browse: {
                    name: 'bx_groups:browse_followed_entries',
                    showTitle: false,
                    showBg: false,
                },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true },
            icon: 'Binoculars',
        },
        'view-group-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col3: { name: 'bx_posts:browse_public', showTitle: false, showBg: false, sidebar: true  },
                col2: { name: 'bx_groups:entity_info', showTitle: false, showBg: true, sidebar: true },
                col4: { name: 'bx_groups:entity_text_block', showTitle: false, showBg: true, sidebar: true },
            },
            headerSettings: { offset: false, header: false }
        },
        'group-fans': {
            layout: 'profile',
            blocks: {
                col1: { name: 'bx_groups:fans_table', showTitle: false, showBg: false },
            },
        },
        //############ CHANNELS PAGES ############
        'channels-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_channels:browse_recent_profiles', showTitle: false, showBg: false },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'channels-top': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_channels:browse_top_profiles', showTitle: false, showBg: false },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        'view-channel-profile': {
            layout: 'profile',
            blocks: {
                col2: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true }
        },
        //############ PERSONS PAGES ############
        'persons-home': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_persons:browse_recent_profiles', showTitle: false, showBg: false },
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true },
            icon: 'Users',
        },
        'persons-active': {
            layout: 'navigator',
            blocks: {
                browse: { name: 'bx_persons:browse_active_profiles', showTitle: false, showBg: false},
            },
            headerSettings: { offset: false, header: true, backButton: false, menu: true },
            icon: 'Users',
        },
        'view-persons-profile': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_timeline:get_block_post_profile', showTitle: false, showBg: false },
                col1: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
                col2: { name: 'bx_persons:entity_info', showTitle: false, showBg: true, sidebar: true },
                col4: { name: 'bx_persons:entity_text_block', showTitle: false, showBg: true, sidebar: true },
            },
            headerSettings: { offset: false, header: false }
        },
        'persons-profile-friends': {
            layout: 'profile',
            blocks: {
                col1: { name: 'system:connections_table', showTitle: false, showBg: false }, 
            },
            headerSettings: { offset: false, header: false }
        },
        'persons-profile-subscriptions': {
            layout: 'profile',
            blocks: {
                col1: { name: 'system:subscriptions_table', showTitle: false, showBg: false },
            },
            headerSettings: { offset: false, header: false }
        },
        'persons-profile-info': {
            layout: 'profile',
            blocks: {
                col0: { name: 'bx_persons:entity_text_block', showTitle: false, showBg: false, perLine: 1 },
                col1: { name: 'bx_persons:entity_info_full', showTitle: false, showBg: false },
            },
            headerSettings: { offset: false, header: false }
        },
        'notifications-view': {
            layout: 'notif',
            top:true,
            blocks: {
                browse: { name: 'bx_notifications:get_block_view', showTitle: false,showBg: false, perLine: 1 },
            },
            header: [{ icon: 'search', name: 'Search' }],
            headerSettings: { header:true, backButton: false, menu:true },
            icon: 'Bell',
        },
    },
    theme: {
        light: {
            primary: '#0284c7',
            barsBackground: 'rgba(255,255,255,0.9)',
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
        },
        dark: {
            default: '#D1D5DB', //fix for icons color in iOS
            primary: '#0ea5e9',
            background: '#000000',
            barsBackground: 'rgba(31,41,55,0.9)',
            barsColor: '#D1D5DB',
            selectBorder: 'rgba(55, 65, 81, 0.3)',
            fieldBackground: '#030712',
            blockBorder: '#030712',
            tabText: 'rgba(156,163,175,1)',
            activeTabText: 'rgba(249,250,251,1)',
            screenBackground: '#030407',
            bgrmodal: 'rgba(31,41,55,1)',
            bdrModal: 'rgba(55,65,81,0.4)',
        },
        button_styles: {
            'u-btn-default-cnt': ' bg-bgrbutton dark:bg-bgrbutton-d hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh border border-bdrbutton dark:border-bdrbutton-d hover:border-bdrbutton-h dark:hover:border-bdrbutton-dh active:opacity-50 shadow-sm hover:shadow active:shadow-none ',
            'u-btn-default-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50 ',
            'u-btn-default-trans': 'duration-200 ',

            'u-btn-primary-cnt': ' bg-primary/90 hover:bg-primary border border-primary/50  shadow-sm hover:shadow active:opacity-50 active:shadow-none',
            'u-btn-primary-text': ' font-medium text-primary-50 group-hover:text-white ',
            'u-btn-primary-trans': 'duration-200 ',

            'u-btn-danger-cnt': ' bg-red-600 hover:bg-red-500 border border-bg-red-700 shadow-sm hover:shadow active:opacity-50 active:shadow-none ',
            'u-btn-danger-text': 'font-medium text-neutral-100 group-hover:text-white ',
            'u-btn-danger-trans': 'duration-200',

            'u-btn-text-cnt': ' border border-transparent hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-text-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
            'u-btn-text-trans': ' duration-200 ',

            'u-btn-link-cnt': ' border border-transparent ',
            'u-btn-link-text': ' font-medium group-hover:underline text-primary dark:text-primary-d group-hover:opacity-90 active:opacity-50 ',
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

        icons: {
            'info-circle': 'WarningCircle',
            home: 'House',
            'app-menu': 'List',
            'app-home': 'House',
            'app-explore': 'MagnifyingGlass',
            'app-messages': 'ChatCircleText',
            'app-usermenu': 'UserCircle',
            'app-notifications': 'Bell',
            'app-plus': 'Plus',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            notifications: 'Bell',
            messages: 'ChatCircleText',
            search: 'MagnifyingGlass',
            account: 'UserCircle',
            comments: 'ChatsCircle',
            'file-alt': 'NoteBlank',
            contact: 'PaperPlaneRight',
            reply: 'ArrowBenDownRight',
            hashtag: 'Hash',
            Posts:'NoteBlank',
            Events:'CalendarCheck',
            Groups:'UsersThree',
        },
    },
    menu: {
        left: [
            { title: 'Profile', link: '/view-persons-profile/dr-andrey-yasko-phd', icon: 'User' },
            { title: 'Explore', link: '/explore', icon: 'Compass' },
            { title: 'Notifs', link: '/notifications-view', icon: 'Bell' },
            { title: 'Messages', link: '/messages', icon: 'ChatTeardropDots' },
            { title: 'Bookmarks', link: '/bookmarks', icon: 'Bookmarks' },
            { title: 'Friends', link: '/connections', icon: 'Link' },
            { title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { title: 'Events', link: '/events-home', icon: 'CalendarCheck' },
            { title: 'Posts', link: '/posts-home', icon: 'NoteBlank' },
            { title: 'Discussions', link: '/discussions-home', icon: 'Chats' },
            { title: 'People', link: '/persons-home', icon: 'UsersFour' },
            { title: 'About', link: '/about', icon: 'Info' },
            { title: 'Terms', link: '/terms', icon: 'Question' },
            { title: 'Contact', link: '/contact', icon: 'AddressBook' },
        ],
        dashboard: [
            { key: 'friends', title: 'Friends',icon: 'Users' , link: '/friends' },
            { key: 'followers', title: 'Followers', icon: 'Users', link: '/followers' },
            { key: 'bx_posts', title: 'Posts', icon: 'NoteBlank', link: '/posts-home', link2: '/create-post', action: 'score', action_icon: 'ThumbsUp' },
            { key: 'bx_forum', title: 'Discussions', icon: 'Chats', link: '/discussions-home', link2: '/create-discussion', action: 'views', action_icon: 'ChartBar' },
            { key: 'bx_groups', title: 'Groups', icon: 'UsersThree', link: '/groups-home', link2: '/create-group-profile', action: 'members', action_icon: 'Users' },
            { key: 'bx_events', title: 'Events', icon: 'CalendarCheck', link: '/events-home', link2: '/create-event-profile', action: 'members', action_icon: 'Users' },
        ],
        bottom_tabs_logged: [
            {key: '/tab0', title: 'Home', url: '/home',icon: 'app-home'},
            {key: '/tab1', title: 'Friends', url: '/friends', icon: 'Users'},
            {key: '/tab2', title: 'Posts', url: '/posts-home',icon: 'ChatCenteredText'},
            {key: '/tab3', title: 'Messages', url: '/messenger',icon: 'ChatsCircle'},
            {key: '/tab4', title: 'Notif*s', url: '/notifications-view', icon: 'app-notifications'},
            {key: '/tab5', title: 'Menu', url: '/dashboard',icon: 'UserList'},
        ],
        bottom_tabs_non_logged: [
            {key: '/tab0', title: 'Home', url: '/home',icon: 'app-home'},
            {key: '/tab1', title: 'Posts', url: '/posts-home',icon: 'NoteBlank'},
            {key: '/tab2', title: 'People', url: '/persons-home',icon: 'users'},
            {key: '/tab3', title: 'About', url: '/products-home',icon: 'Info'},
            {key: '/tab4', title: 'Sign-up', url: '/create-account',icon: 'app-usermenu'},
            {key: '/tab5', title: 'Login', url: '/login',icon: 'SignIn'},
        ],
    },
}
