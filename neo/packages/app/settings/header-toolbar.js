

export const settingsHeaderToolbar = {
    header_toolbar: {
        /**
         * Default NeoButton style/size for header toolbar items (per platform).
         * Desktop is `lg:` and up (`layout.tablet_mode_from`).
         * `style` = secondary; `primaryStyle` = primary (item `props.primary: true`).
         * Per-item `props.style` / `props.controlSize` override these.
         */
        neoButton: {
            desktop: { style: 'bordered', primaryStyle: 'borderedProminent', controlSize: 'regular' },
            mobile: { style: 'glass', primaryStyle: 'glassProminent', controlSize: 'regular' },
        },
        hor: {
            loggedIn: [
                { component: 'search', className: '' },
                // Heading tabs + More (`header.content_center`) start at `lg`. Apps is the
                // same inventory, so hide the launcher there; keep it on native / below `lg`.
                { component: 'launcher', className: 'hidden sm:block web:lg:hidden' },
                { component: 'add', className: '' },
                { component: 'notifications', className: 'hidden sm:block' },
                { component: 'link', href: "{messenger}", className: 'hidden sm:block', title: 'Messages', props: { variant: "secondary", rounded: true, size: "base", startDecorator: "MessageSquare" } },
                { component: 'account', className: 'hidden lg:block' },
            ],
            loggedOut: [
                { component: 'search', className: '' },
                { component: 'link', className: 'items-center hidden sm:block', href: "/login", title: 'Log In', props: { neoButton: true, borderShape: "capsule", title: 'Log In' } },
                { component: 'link', className: 'items-center hidden sm:block', href: "/create-account", title: 'Sign Up', props: { neoButton: true, primary: true, borderShape: "capsule", title: 'Sign Up' } },
                // Web and native (iOS: a SwiftUI pull-down menu). Below `sm` it starts with Log In and Sign Up
                // as buttons (UNA's site menu marks them `button`), so phones show no Log In circle here.
                // `auth: true` adds the two when the menu has none (a `menu_items.menu_navigation` override
                // without them, or an older UNA), so guests on phones always have a way to sign in.
                { component: 'menu_navigation', className: 'items-center lg:hidden', props: { borderShape: 'circle', image: 'Menu', accessibilityLabel: 'Main menu', auth: true } },
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
    }
}