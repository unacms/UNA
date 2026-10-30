

// Pinned menus (navbar, tab bars, add, launcher, account, footer, sidebar) and their
// UNA counterparts: commented examples in menus.example.js.
export const settingsMenus = {
    menu_items: {
        transpile_urls: [
            // URLS for tabs in native app index = tab index
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
    },
}