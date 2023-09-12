export const settingsDefault = {
    debug: {
        log_fetch:false
    },
    sockets: {
        host: 'ci.una.io',
        port: '443',
        key: 'app-key',
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
    layout: {
        max_width: 'max-w-screen-2xl',
        cell_gap: 4,
        cell_style: '',
        show_user_icon: true,
    },
    comments: {
        show_header: false,
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
    static_pages: {
        home: 'Home',
        about: 'About'
    },
    menu_items: {
        menu_top: [
            { name: 'home', title: 'Home', link: '/home', icon: 'home'},
            { name: 'friends', title: 'Connections', link: '/friends', icon: 'Users', nonlogged: false }, 
            { name: 'posts-home', title: 'Posts', link: '/posts-home', icon: 'ChatCenteredText' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
        ],
        menu_top_more: [
            { name: 'persons-home', title: 'People', link: '/persons-home', icon: 'UsersFour' }, 
            { name: 'groups-home', title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
            { name: 'events-home', title: 'Events', link: '/events-home', icon: 'Calendar' }, 
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
            items: ['posts-home', 'posts-popular'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-post' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_posts'},
            ],
        },
        bx_posts_view_actions: [
            'edit-post', 
            'delete-post'
        ],
        bx_persons_submenu: {
            name: 'People',
            icon: 'UsersFour',
            items: ['persons-home', 'persons-active'],
            add: [
                {icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_persons'},
            ],
        },
        bx_events_submenu: {
            name: 'Events',
            icon: 'Calendar',
            items: ['events-home', 'events-top'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-event-profile' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_events' },
            ],
        },
        sys_con_submenu: {
            name: 'Connections',
            icon: 'Users',
            items: ['friends', 'friend-suggestions', 'friend-requests', 'sent-friend-requests', 'follow-suggestions', 'followers', 'following'],
            add: [
                {icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_persons'},
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
            items: ['groups-home', 'groups-joined'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-group-profile' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_groups'},
            ],
        },
        bx_forum_submenu: {
            name: 'Discussions',
            icon: 'comments',
            items: ['discussions-home', 'discussions-search'],
            add: [
                { icon: 'plus', name: 'Add', link: '/create-discussion' },
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_forum'},
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
                { icon: 'search', name: 'Search', link: '/search-keyword?keyword=&section=bx_channels' },
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
        dashboard: {
            layout: 'dashboard',
            top:true,
            blocks: {
                profile_switcher: { name: 'system:account_profile_switcher', showTitle: false, showBg: true },
                stat_block: { name: 'system:get_stat_block', showTitle: false, showBg: true },
            },
            headerSettings: { header: true, backButton: false, menu: false, title: true },
        },
        'search-keyword': {
            layout: 'blackbox_search',
            blocks: {
                browse: { name: 'system:search_keyword_result', showTitle: false, showBg: false },
            },
            icon: 'Search',
            headerSettings: { backButton: false, header: true }
        },
        home: {
            layout: 'home',
            top:true,
            blocks: {
                public_feed_form: {name: 'bx_timeline:get_block_post_home', showTitle: false, showBg: false },
                public_feed: {name: 'bx_timeline:get_block_view_home', showTitle: false, showBg: false },
                account_feed_form: {name: 'bx_timeline:get_block_post_account', showTitle: false, showBg: false },
                account_feed: {name: 'bx_timeline:get_block_view_account', showTitle: false, showBg: false },
                hot_feed: {name: 'bx_timeline:get_block_view_hot', showTitle: false, showBg: false },

                profile_switcher: { name: 'system:account_profile_switcher', showTitle: false, showBg: true },
                home2: { name: 'static:home2', showTitle: false, showBg: false },
                home: { name: 'static:home', showTitle: false, showBg: false },
                footer: { name: 'static:footer', showTitle: false, showBg: false },
                menu: { name: 'system:profile_menu', showTitle: false, showBg: false },
                friends: { name: 'system:browse_recommendations_friends', showTitle: true, showBg: false, },
                subscriptions: { name: 'system:browse_recommendations_subscriptions', showTitle: true, showBg: false },
            },
            header: [
                { icon: 'plus', name: 'Add', link: '/create-post' },
                { icon: 'search', name: 'Search', link: '?keyword=' },
            ],
            headerSettings: {header: true, backButton: false, menu: true, title: false },
        },
        login:{
            max_width: 'max-w-xl',
        },
        //############ EVENTS PAGES ############
        'events-home': {
            layout: 'blackbox',
            blocks: {
                browse: {name: 'bx_events:browse_recent_profiles', showTitle: false, showBg: false },
            },
            icon: 'Calendar',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'events-top': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_events:browse_top_profiles', showTitle: false, showBg: false },
            },
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
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_posts:browse_public', showTitle: false, showBg: false },
            },
            icon: 'File',
            headerSettings: { offset: false, header: false }
        },
        'posts-popular': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_posts:browse_popular', showTitle: false, showBg: false },
            },
            icon: 'File',
            headerSettings: { backButton: false, header: false }
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
            headerSettings: { header: false, footer: false },
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
            headerSettings: { header: false },
        },
        //############ POSTS PAGES ############
        'friend-suggestions': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_recommendations_friends', showTitle: false, showBg: false },
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'friends': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_friends', showTitle: false, showBg: false },
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'follow-suggestions': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_recommendations_subscriptions', showTitle: false, showBg: false },
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'followers': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_subscribed_me', showTitle: false, showBg: false },
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'following': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_subscriptions', showTitle: false, showBg: false },
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'friend-requests': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_friend_requests', showTitle: false, showBg: false}
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        'sent-friend-requests': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'system:browse_friend_requested', showTitle: false, showBg: false },
            },
            icon: '',
            headerSettings: { backButton: false, header: false, offset: false }
        },
        
        //############ DISCUSSION PAGES ############
        'discussions-home': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_forum:browse_new', showTitle: false, showBg: false },
            },
            icon: 'Comments',
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
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_groups:browse_recent_profiles', showTitle: false, showBg: false },
            },
            headerSettings: { backButton: false, header: false, offset: false },
            icon: 'UsersThree',
        },
        'groups-joined': {
            layout: 'blackbox',
            blocks: {
                browse: {
                    name: 'bx_groups:browse_joined_entries',
                    showTitle: false,
                    showBg: false,
                },
            },
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
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_channels:browse_recent_profiles', showTitle: false, showBg: false },
            },
        },
        'channels-top': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_channels:browse_top_profiles', showTitle: false, showBg: false },
            },
        },
        'view-channel-profile': {
            layout: 'profile',
            blocks: {
                col2: { name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1 },
            },
        },
        //############ PERSONS PAGES ############
        'persons-home': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_persons:browse_recent_profiles', showTitle: false, showBg: false },
            },
            headerSettings: { backButton: false, header: false, offset: false },
            icon: 'Users',
        },
        'persons-active': {
            layout: 'blackbox',
            blocks: {
                browse: { name: 'bx_persons:browse_active_profiles', showTitle: false, showBg: false},
            },
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
            headerSettings: { header:true, backButton: false },
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

            'u-btn-primary-cnt': ' bg-primary hover:opacity-90 border border-primary  shadow-sm hover:shadow active:opacity-50 active:shadow-none',
            'u-btn-primary-text': ' font-medium text-neutral-100 group-hover:text-white ',
            'u-btn-primary-trans': 'duration-200 ',

            'u-btn-danger-cnt': ' bg-red-600 hover:bg-red-500 border border-bg-red-700 shadow-sm hover:shadow active:opacity-50 active:shadow-none ',
            'u-btn-danger-text': 'font-medium text-neutral-100 group-hover:text-white ',
            'u-btn-danger-trans': 'duration-200',

            'u-btn-text-cnt': ' border border-transparent hover:bg-bgrbutton-h dark:hover:bg-bgrbutton-dh active:opacity-50 ',
            'u-btn-text-text': ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-neutral-300 dark:group-hover:text-neutral-50',
            'u-btn-text-trans': ' duration-200 ',

            'u-btn-link-cnt': ' border border-transparent ',
            'u-btn-link-text': ' font-semibold text-primary dark:text-primary-d group-hover:opacity-90 active:opacity-50 ',
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
            { title: 'Connections', link: '/connections', icon: 'Link' },
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
            {key: '/tab3', title: 'About', url: '/about',icon: 'Info'},
            {key: '/tab4', title: 'Sign-up', url: '/create-account',icon: 'app-usermenu'},
            {key: '/tab5', title: 'Login', url: '/login',icon: 'SignIn'},
        ],
    },
}
