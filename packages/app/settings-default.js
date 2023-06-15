export const settingsDefault = {
  urls: {
    embeds: 'https://ci.una.io/test3/oembed.php?html=1&a=get_link&l=',
    images: 'https://ci.una.io/test3/image_transcoder.php?o=sys_custom_images&u=',
    notifs:
      'https://ci.una.io/test3/api.php?r=bx_notifications/get_unread_notifications_num_ex&params[]=',
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
  },
  cache: {
    page: true,
    list: true,
    compress: false
  },
  feed: {
    show_selector_view: false,
    default_view: '',
    show_html: false,
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
      { width: 1280, count: 4 },
      { width: 1024, count: 3 },
      { width: 640, count: 2 },
    ],
    per_line_profile: [
        { width: 1440, count: 6 },
      { width: 1024, count: 4 },
      { width: 640, count: 3 },
      { width: 340, count: 2 },
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
  },
  static_pages: {
    home: 'Home',
    about: 'About'
  },
  menu_items: {
    menu_top: [
      {
        name: 'home',
        title: 'Home',
        link: 'home',
        icon: 'home',
      },
      {
        name: 'about',
        title: 'About',
        link: 'about',
        icon: 'info-circle',
      },
      {
        name: 'persons-home',
        title: 'People',
        link: 'persons-home',
        icon: 'user',
      },
      {
        name: 'posts-home',
        title: 'Posts',
        link: 'posts-home',
        icon: 'file-alt',
      },
      {
        name: 'groups-home',
        title: 'Groups',
        link: 'groups-home',
        icon: 'users',
      },
      {
        name: 'discussions-home',
        title: 'Discussions',
        link: 'discussions-home',
        icon: 'comments',
      },
    ],

    add_menu: ['create-post', 'create-group-profile'],
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
      items: ['posts-home', 'posts-popular'],
      add: [
        { icon: 'plus', name: 'Add', link: '/create-post' },
        {
          icon: 'search',
          name: 'Search',
          link: '/search-keyword?keyword=&section=bx_posts',
        },
        { icon: 'DotsThreeOutlineVertical', name: 'More' },
      ],
    },
    bx_posts_view_actions: ['edit-post', 'delete-post'],

    bx_persons_submenu: {
      name: 'People',
      icon: 'Users',
      items: ['persons-home', 'persons-active'],
      add: [
        {
          icon: 'search',
          name: 'Search',
          link: '/search-keyword?keyword=&section=bx_persons',
        },
        { icon: 'DotsThreeOutlineVertical', name: 'More' },
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
        membership: 'UserCircle',
        friends: 'Users',
        subscribers: 'Users',
      },
      items: ['membership', 'friends', 'subscribers'],
    },
    bx_persons_view_actions_all: [
      'profile-friend-add',
      'profile-friend-remove',
      'profile-subscribe-add',
      'profile-subscribe-remove',
      'messenger',
    ],

    bx_groups_submenu: {
      name: 'Groups',
      icon: 'UsersThree',
      items: ['groups-home', 'groups-joined'],
      add: [
        { icon: 'plus', name: 'Add', link: '/create-group-profile' },
        {
          icon: 'search',
          name: 'Search',
          link: '/search-keyword?keyword=&section=bx_groups',
        },
        { icon: 'DotsThreeOutlineVertical', name: 'More' },
      ],
    },
    bx_forum_submenu: {
      name: 'Discussion',
      icon: 'comments',
      items: ['discussions-home', 'discussions-search'],
      add: [
        { icon: 'plus', name: 'Add', link: '/create-discussion' },
        {
          icon: 'search',
          name: 'Search',
          link: '/search-keyword?keyword=&section=bx_forum',
        },
        { icon: 'DotsThreeOutlineVertical', name: 'More' },
      ],
    },
    bx_groups_view_submenu: ['view-group-profile', 'group-fans'],

    bx_channels_submenu: {
      name: 'Channels',
      icon: 'Hash',
      items: ['channels-home', 'channels-top'],
      add: [
        {
          icon: 'search',
          name: 'Search',
          link: '/search-keyword?keyword=&section=bx_channels',
        },
        { icon: 'DotsThreeOutlineVertical', name: 'More' },
      ],
    },
    bx_channels_view_submenu: ['view-channel-profile'],

    bx_timeline_menu_item_manage: ['item-edit', 'item-delete'],
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
    },
    dashboard: {
      layout: 'dashboard',
      top:true,
      blocks: {},
    },
    'search-keyword': {
      layout: 'blackbox_search',
      blocks: {
        browse: {
          name: 'system:search_keyword_result',
          showTitle: false,
          showBg: false,
        },
      },
    },
    home: {
      layout: 'home',
      top:true,
      blocks: {
        home: { name: 'static:home', showTitle: false, showBg: false },
        posts2: {
          name: 'bx_timeline:get_block_post_home',
          showTitle: false,
          showBg: false,
        },
        menu: { name: 'system:profile_menu', showTitle: false, showBg: false },
        feed: {
          name: 'bx_timeline:get_block_view_home',
          showTitle: false,
          showBg: false,
        },
        posts: {
          name: 'bx_posts:browse_public',
          showTitle: false,
          showBg: false,
        },
        
      },
      header: [
        { icon: 'plus', name: 'Add', link: '/create-post' },
        { icon: 'search', name: 'Search', link: '?keyword=' },
      ],
    },
    //############ POSTS PAGES ############
    'posts-home': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_posts:browse_public',
          showTitle: false,
          showBg: false,
        },
      },
      icon: 'File',
    },
    'posts-popular': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_posts:browse_popular',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'view-post': {
      layout: 'post',
      top:true,
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
        comments: {
          name: 'bx_posts:entity_comments',
          showTitle: false,
          showBg: false,
        },
      },
    },
    item: {
      layout: 'post',
      top:true,
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
        comments: {
          name: 'bx_timeline:get_block_item_comments',
          showTitle: false,
          showBg: false,
        },
      },
    },
    //############ POSTS PAGES ############
    'discussions-home': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_forum:browse_new',
          showTitle: false,
          showBg: false,
        },
      },
      icon: 'Comments',
    },
    'view-discussion': {
      layout: 'post',
      top:true,
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
        comments: {
          name: 'bx_forum:entity_comments',
          showTitle: false,
          showBg: false,
        },
      },
    },
    //############ GROUPS PAGES ############
    'groups-home': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_groups:browse_recent_profiles',
          showTitle: false,
          showBg: false,
        },
      },
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
        col1: {
          name: 'bx_groups:entity_info',
          showTitle: false,
          showBg: false,
          perLine: 1,
        },
        col2: {
          name: 'bx_timeline:get_block_view_profile',
          showTitle: false,
          showBg: false,
          perLine: 1,
        },
      },
    },
    'group-fans': {
      layout: 'profile',
      blocks: {
        col1: {
          name: 'bx_groups:fans_table',
          showTitle: false,
          showBg: false,
          perLine: 3,
        },
      },
    },
    //############ CHANNELS PAGES ############
    'channels-home': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_channels:browse_recent_profiles',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'channels-top': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_channels:browse_top_profiles',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'view-channel-profile': {
      layout: 'profile',
      blocks: {
        col2: {
          name: 'bx_timeline:get_block_view_profile',
          showTitle: false,
          showBg: false,
          perLine: 1,
        },
      },
    },
    //############ PERSONS PAGES ############
    'persons-home': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_persons:browse_recent_profiles',
          showTitle: false,
          showBg: false,
        },
      },
      icon: 'Users',
    },
    'persons-active': {
      layout: 'blackbox',
      blocks: {
        browse: {
          name: 'bx_persons:browse_active_profiles',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'view-persons-profile': {
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
          name: 'bx_persons:entity_info',
          showTitle: true,
          showBg: true,
          sidebar: true,
        },
        col3: {
          name: 'bx_posts:browse_public',
          showTitle: false,
          showBg: false,
          sidebar: true,
        },
      },
    },
    'persons-profile-friends': {
      layout: 'profile',
      blocks: {
        col1: {
          name: 'system:connections_table',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'persons-profile-subscriptions': {
      layout: 'profile',
      blocks: {
        col1: {
          name: 'system:subscriptions_table',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'persons-profile-info': {
      layout: 'profile',
      blocks: {
        col0: {
          name: 'bx_persons:entity_text_block',
          showTitle: false,
          showBg: false,
          perLine: 1,
        },
        col1: {
          name: 'bx_persons:entity_info_full',
          showTitle: false,
          showBg: false,
        },
      },
    },
    'notifications-view': {
      layout: 'notif',
      top:true,
      blocks: {
        browse: {
          name: 'bx_notifications:get_block_view',
          showTitle: false,
          showBg: false,
          perLine: 1,
        },
      },
      header: [{ icon: 'search', name: 'Search' }],
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
      backgroundModal: 'rgba(255,255,255,1)',
      bordercolorModal: 'rgba(229,231,235,1)',
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
      backgroundModal: 'rgba(31,41,55,1)',
      bordercolorModal: 'rgba(55,65,81,0.4)',
    },
    button_styles: {
      'u-btn-default-cnt':
        ' bg-neutral-500/20 hover:bg-neutral-500/10  border border-neutral-500/20 active:shadow-none  active:opacity-50 shadow-sm  hover:shadow  ',
      'u-btn-default-text':
        ' font-medium text-neutral-700 group-hover:text-neutral-950 dark:text-gray-300 dark:group-hover:text-gray-50',
      'u-btn-default-trans': 'duration-200 ',

      'u-btn-primary-cnt':
        ' border active:shadow-none border-transparent  shadow-sm hover:shadow bg-primary-700 hover:bg-primary-800 active:bg-primary-900 dark:bg-primary-800 dark:hover:bg-primary-700 dark:active:bg-primary-900',
      'u-btn-primary-text':
        ' font-medium text-neutral-50 group-hover:text-white ',
      'u-btn-primary-trans': 'duration-200 ',

      'u-btn-danger-cnt':
        ' border active:shadow-none border-black/10 dark:border-white/10 shadow bg-red-600 hover:bg-red-500 active:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:active:bg-red-900',
      'u-btn-danger-text': 'font-medium text-gray-100 group-hover:text-white ',
      'u-btn-danger-trans': 'duration-200',

      'u-btn-text-cnt':
        ' border border-transparent hover:bg-neutral-500/10 active:opacity-50  ',
      'u-btn-text-text':
        ' font-medium text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-50',
      'u-btn-text-trans': ' duration-200 ',

      'u-btn-link-cnt': ' border border-transparent ',
      'u-btn-link-text':
        ' group-active:text-primary-700 dark:group-active:text-primary-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 font-semibold text-primary-600 dark:text-primary-500 ',
      'u-btn-link-trans': ' duration-200 ',

      'u-btn-outline-cnt':
        ' border border-neutral-500/20  active:shadow-none   active:opacity-50  hover:bg-neutral-500/10 hover:shadow-sm  ',
      'u-btn-outline-text':
        ' font-medium text-neutral-700 group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-neutral-50',
      'u-btn-outline-trans': ' duration-200 ',

      'u-btn-group-item-cnt':
        ' hover:bg-neutral-500/10 active:opacity-50 hover:shadow-lg ',
      'u-btn-group-item-text':
        ' font-medium text-neutral-700 group-hover:text-neutral-900 dark:text-neutral-300 dark:group-hover:text-neutral-50',
    },
    buttons_group_styles: {
      'u-btn-default-cnt':
        ' border border-bordercolorbutton dark:border-bordercolorbutton-dark bg-backgroundbutton dark:bg-backgroundbutton-dark shadow-sm overflow-hidden ',
      'u-btn-outline-cnt':
        ' border border-bordercolorbutton dark:border-bordercolorbutton-dark overflow-hidden ',
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
    },
  },
  menu: {
    left: [
      {
        title: 'Profile',
        link: '/view-persons-profile/dr-andrey-yasko-phd',
        icon: 'user',
      },
      { title: 'Explore', link: '/explore', icon: 'Compass' },
      { title: 'Notifs', link: '/notifications-view', icon: 'Bell' },
      { title: 'Messages', link: '/messages', icon: 'ChatTeardropDots' },
      { title: 'Bookmarks', link: '/bookmarks', icon: 'Bookmarks' },
      { title: 'Connections', link: '/connections', icon: 'Link' },
      { title: 'Groups', link: '/groups-home', icon: 'UsersThree' },
      { title: 'Events', link: '/events-home', icon: 'CalendarCheck' },
      { title: 'Posts', link: '/posts-home', icon: 'NoteBlank' },
      { title: 'Discussions', link: '/discussions-home', icon: 'Chats' },
      { title: 'People', link: '/persons-home', icon: 'Users' },
      { title: 'About', link: '/about', icon: 'Info' },
      { title: 'Terms', link: '/terms', icon: 'Question' },
      { title: 'Contact', link: '/contact', icon: 'AddressBook' },
    ],
    bottom_tabs_logged: [
      {
        key: '/tab0',
        title: 'Home',
        url: '/home',
        icon: 'app-home',
      },
      {
        key: '/tab1',
        title: 'Posts',
        url: '/posts-home',
        icon: 'NoteBlank',
      },
      {
        key: '/tab2',
        title: 'People',
        url: '/persons-home',
        icon: 'users',
      },
      {
        key: '/tab3',
        title: 'Messenger',
        url: '/messenger', //'/view-persons-profile/dr-andrey-yasko-phd',
        icon: 'UsersThree',
      },
      {
        key: '/tab4',
        title: 'Notifications',
        url: '/notifications-view', //'/view-persons-profile/dr-andrey-yasko-phd',
        icon: 'app-notifications',
      },
      {
        key: '/tab5',
        title: 'Menu',
        url: '/dashboard',
        icon: 'UserList',
      },
    ],
    bottom_tabs_non_logged: [
      {
        key: '/tab0',
        title: 'Home',
        url: '/home',
        icon: 'app-home',
      },
      {
        key: '/tab1',
        title: 'Posts',
        url: '/posts-home',
        icon: 'NoteBlank',
      },
      {
        key: '/tab2',
        title: 'People',
        url: '/persons-home',
        icon: 'users',
      },
      {
        key: '/tab3',
        title: 'About',
        url: '/about', //'/view-persons-profile/dr-andrey-yasko-phd',
        icon: 'Info',
      },
      {
        key: '/tab4',
        title: 'Sign-up',
        url: '/create-account',
        icon: 'app-usermenu',
      },
      {
        key: '/tab5',
        title: 'Login',
        url: '/login',
        icon: 'SignIn',
      },
    ],
  },
}
