

// Example only, not loaded: menus.js with the pinned menus to copy from. Each
// commented list, uncommented in menus.js (or a fork's customization/settings.js),
// replaces the UNA menu named next to it.
export const settingsMenus = {
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
            // Navbar when `menu_navbar` is empty.
            site: 'sys_site',
            // Tab bar (web bottom bar, native tabs) when `menu_tabbar_*` are empty.
            tabbar: 'sys_tabbar',
        },
        // Tabs after Home in a navbar built from `objects.site`; the rest go under More.
        menu_navbar_site_tabs: 5,
        // Columns in the navbar's dropdowns (More); an item's own `columns` wins.
        menu_navbar_more_columns: 2,
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
            // Videos: the icon the site menu draws for them (menu_navbar videos-home).
            film: 'TvMinimalPlay',
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
            'video-camera': 'Video',
            'address-card': 'Contact',
            'file-word': 'FileText',
            'ellipsis-v': 'EllipsisVertical',
            'ellipsis-h': 'Ellipsis',
        },
        // Static navbar. Unset, the navbar comes from UNA's site menu (`objects.site`):
        // Home, `menu_navbar_site_tabs` tabs, the rest under More. Uncomment to pin it.
        // menu_navbar: [
        //     {
        //         name: 'home',
        //         title: 'Home',
        //         link: '/',
        //         icon: 'House',
        //         animated: true,
        //     },
        //     {
        //         name: 'friends',
        //         title: 'Friends',
        //         link: '/friends',
        //         icon: 'UsersRound',
        //         animated: true,
        //         nonlogged: false,
        //     },
        //     {
        //         name: 'explore',
        //         title: 'Explore',
        //         link: '/explore',
        //         icon: 'Compass',
        //         logged: false,
        //         animated: true,
        //     },
        //     {
        //         name: 'videos-home',
        //         title: 'Video',
        //         link: '/videos-home',
        //         icon: 'TvMinimalPlay',
        //         animated: true,
        //     },
        //     {
        //         name: 'products-home',
        //         title: 'Market',
        //         link: '/products-home',
        //         icon: 'Store',
        //         animated: true,
        //     },
        //     {
        //         name: 'groups-home',
        //         title: 'Groups',
        //         link: '/groups-home',
        //         icon: 'Shapes',
        //         animated: true,
        //     },
        //     {
        //         name: 'events-home',
        //         title: 'Events',
        //         link: '/events-home',
        //         icon: 'Calendar',
        //         animated: true,
        //     }, 
        //     {
        //         name: 'more',
        //         title: 'More',
        //         link: '',
        //         icon: 'Menu',
        //         showTitle: false,
        //         chevron: '',
        //         animated: true,
        //         items: [
        //             {
        //                 name: 'connect',
        //                 title: 'Connect',
        //                 items: [
        //                     {
        //                         name: 'persons-home',
        //                         title: 'People',
        //                         description: 'Find friends, connect and collaborate.',
        //                         link: '/persons-home',
        //                         icon: 'UserRound',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'organizations-home',
        //                         title: 'Orgs',
        //                         description: 'Work together as an organization.',
        //                         link: '/organizations-home',
        //                         icon: 'Building2',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'events-home',
        //                         title: 'Events',
        //                         description: 'Find what\'s happening.',
        //                         link: '/events-home',
        //                         icon: 'Calendar',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'groups-home',
        //                         title: 'Groups',
        //                         description: 'Get together with others.',
        //                         link: '/groups-home',
        //                         icon: 'Shapes',
        //                         animated: true,
        //                     },
        //                 ],
        //             },
        //             {
        //                 name: 'browse',
        //                 title: 'Browse',
        //                 items: [
        //                     {
        //                         name: 'videos-home',
        //                         title: 'Video',
        //                         description: 'Watch and learn.',
        //                         link: '/videos-home',
        //                         icon: 'TvMinimalPlay',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'photos-home',
        //                         title: 'Photos',
        //                         description: 'Share photos and albums.',
        //                         link: '/photos-home',
        //                         icon: 'Camera',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'polls-home',
        //                         title: 'Polls',
        //                         description: 'Ask the community and vote.',
        //                         link: '/polls-home',
        //                         icon: 'SquareCheck',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'spaces-home',
        //                         title: 'Spaces',
        //                         description: 'Join spaces around a topic.',
        //                         link: '/spaces-home',
        //                         icon: 'SquareStack',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'ads-home',
        //                         title: 'Ads',
        //                         description: 'Browse classifieds and listings.',
        //                         link: '/ads-home',
        //                         icon: 'CircleStar',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'jobs-home',
        //                         title: 'Jobs',
        //                         description: 'Find work or hire talent.',
        //                         link: '/jobs-home',
        //                         icon: 'BriefcaseBusiness',
        //                         animated: true,
        //                     },
        //                 ],
        //             },
        //             {
        //                 name: 'learn',
        //                 title: 'Learn',
        //                 items: [
        //                     {
        //                         name: 'posts-home',
        //                         title: 'Posts',
        //                         description: 'Read stories from the community.',
        //                         link: '/posts-home',
        //                         icon: 'FileText',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'courses-home',
        //                         title: 'Courses',
        //                         description: 'Take courses and grow your skills.',
        //                         link: '/courses-home',
        //                         icon: 'LibraryBig',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'wiki',
        //                         title: 'Documentation',
        //                         description: 'How to use our product.',
        //                         link: '/docs',
        //                         icon: 'BookOpenText',
        //                         animated: true,
        //                     },
        //                     {
        //                         name: 'discussions-home',
        //                         title: 'Discussions',
        //                         description: 'Talk about your interests.',
        //                         link: '/discussions-home',
        //                         icon: 'MessagesSquare',
        //                         animated: true,
        //                     },
        //                 ],
        //             },
        //         ]
        //     },
        // ],
        /**
         * Header toolbar (mobile web): popup links, same row pattern as navbar dropdown.
         * Guests only, so like the guest tabs it links only to system pages.
         */
        // Unset, the links come from UNA's footer menu (`objects.footer`). Uncomment to pin them.
        // menu_navigation: [
        //     {
        //         name: 'about',
        //         title: 'About Us',
        //         link: '/about',
        //         icon: 'Info',
        //         animated: true,
        //     },
        //     {
        //         name: 'terms',
        //         title: 'Terms of Service',
        //         link: '/terms',
        //         icon: 'Handshake',
        //     },
        //     {
        //         name: 'privacy',
        //         title: 'Privacy Policy',
        //         link: '/privacy',
        //         icon: 'ShieldCheck',
        //     },
        // ],
        // Pinned menus: each one, when set, replaces the UNA menu named in `objects`.
        // Add content (+), instead of `objects.add`:
        // menu_add: [
        //     { title: 'Post', link: '/create-post', icon: 'FileText' },
        //     { title: 'Event', link: '/create-event-profile', icon: 'Calendar' },
        // ],
        // Apps launcher, instead of `objects.launcher`:
        // menu_launcher: [
        //     { title: 'Groups', link: '/groups-home', icon: 'Shapes' },
        //     { title: 'Events', link: '/events-home', icon: 'Calendar' },
        // ],
        // Account menu, instead of `objects.account`:
        // menu_account: [
        //     { title: 'Dashboard', link: '/dashboard', icon: 'CircleGauge' },
        //     { title: 'Settings', link: '/account-settings-info', icon: 'Settings' },
        // ],
        // Footer links (footer and account menu), instead of `objects.footer`:
        // menu_footer: [
        //     { title: 'About', link: '/about' },
        //     { title: 'Terms', link: '/terms' },
        // ],
        // Tab bar for members. Unset, it comes from UNA's tab bar menu (`objects.tabbar`). Uncomment to pin it.
        // menu_tabbar_logged: [
        //     {
        //         key: '/tab0',
        //         title: 'Home',
        //         url: '/home',
        //         icon: 'House',
        //         animated: true,
        //     },
        //     {
        //         key: '/tab1',
        //         title: 'Friends',
        //         url: '/friends',
        //         icon: 'UsersRound',
        //         badge: 'friends',
        //         animated: true,
        //     },
        //     {
        //         key: '/tab2',
        //         title: 'Messages',
        //         url: '/messenger',
        //         icon: 'MessageCircleMore',
        //         badge: 'messenger',
        //         animated: true,
        //     },
        //     {
        //         key: '/tab3',
        //         title: 'Activity',
        //         url: '/notifications-view',
        //         icon: 'Bell',
        //         badge: 'notifications',
        //         animated: true,
        //     },
        //     // Fifth slot: own profile, shown as the avatar (iOS). With five items
        //     // it is a plain tab; with more it is the More trigger and the menu's
        //     // header, and the items below it fill the menu.
        //     { key: '/tab4', title: 'Profile', url: '{profile}', icon: 'User' },
        //     {
        //         key: '/tab5',
        //         title: 'Dashboard',
        //         url: '/dashboard',
        //         icon: 'CircleGauge',
        //     },
        //     { key: '/tab6', title: 'Groups', url: '/groups-home', icon: 'UsersRound' },
        //     { key: '/tab7', title: 'Events', url: '/events-home', icon: 'CalendarCheck' },
        //     { key: '/tab8', title: 'Market', url: '/products-home', icon: 'Store' },
        //     { key: '/tab9', title: 'Tasks', url: '/tasks-home', icon: 'ListChecks' },
        //     { key: '/tab10', title: 'Docs', url: '/docs', icon: 'Book' },
        //     { key: '/tab11', title: 'Blog', url: '/posts-home', icon: 'PencilLine' },
        //     { key: '/tab12', title: 'Pricing', url: '/pricing', icon: 'Tag' },
        //     { key: '/tab13', title: 'Sign out', url: '/logout', icon: 'LogOut' },
        // ],

        // Guest tabs link only to system pages, which every install has.
        // A page from a module (Contact Us is bx_contact) is a 404 until
        // that module is installed, so forks add those tabs themselves.
        // Tab bar for guests. Unset, it comes from UNA's tab bar menu (`objects.tabbar`). Uncomment to pin it.
        // menu_tabbar_non_logged: [
        //     {
        //         key: '/tab0',
        //         title: 'Home',
        //         url: '/home',
        //         icon: 'House',
        //         animated: true,
        //     },
        //     {
        //         key: '/tab1',
        //         title: 'Explore',
        //         url: '/explore',
        //         icon: 'Compass',
        //         animated: true,
        //     },
        //     {
        //         key: '/tab2',
        //         title: 'About',
        //         url: '/about',
        //         icon: 'Info',
        //         animated: true,
        //     },
        //     { key: '/tab3', title: 'Terms', url: '/terms', icon: 'Handshake' },
        //     { key: '/tab4', title: 'Privacy', url: '/privacy', icon: 'ShieldCheck' },
        // ],
        // Profile menu block (vertical layout). Unset, the block's menu from UNA. Uncomment to pin it.
        // menu_sidebar: [
        //     {
        //         title: 'Profile',
        //         link: '{profile}',
        //         icon: 'User',
        //         nonlogged: false,
        //     },
        //     {
        //         title: 'Notifications',
        //         link: '/notifications-view',
        //         icon: 'Bell',
        //         nonlogged: false,
        //     },
        //     {
        //         title: 'Messages',
        //         link: '/messenger',
        //         icon: 'MessageCircleMore',
        //         nonlogged: false,
        //     },
        //     {
        //         title: 'Friends',
        //         link: '/friends',
        //         icon: 'Link',
        //         nonlogged: false,
        //     },
        //     { title: 'Groups', link: '/groups-home', icon: 'Group' },
        //     { title: 'Spaces', link: '/spaces-home', icon: 'SquareStack' },
        //     { title: 'Events', link: '/events-home', icon: 'CalendarCheck' },
        //     { title: 'Posts', link: '/posts-home', icon: 'MessageSquareText' },
        //     {
        //         title: 'Discussions',
        //         link: '/discussions-home',
        //         icon: 'MessageSquare',
        //     },
        //     { title: 'Courses', link: '/courses-home', icon: 'LibraryBig' },
        //     { title: 'People', link: '/persons-home', icon: 'Users' },
        //     { title: 'Jobs', link: '/jobs-home', icon: 'BriefcaseBusiness' },
        //     { title: 'About', link: '/about', icon: 'Info' },
        //     { title: 'Terms', link: '/terms', icon: 'HelpCircle' },
        //     { title: 'Contact', link: '/contact', icon: 'Mail' },
        // ],
        
    },
}