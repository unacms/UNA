

export const settingsHeaderToolbar = {
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
                { component: 'link', className: 'items-center sm:hidden', href: "/login", title: 'Log In', props: { variant: "default", rounded: true, size: "base", startDecorator: "UserRound"} },
                { component: 'link', className: 'items-center hidden sm:block', href: "/login", title: 'Log In', props: { variant: "default", rounded: false, size: "base", title: 'Log In' } },
                { component: 'link', className: 'items-center hidden sm:block', href: "/create-account", title: 'Sign Up', props: { variant: "primary", rounded: false, size: "base", title: 'Sign Up' } },
                { component: 'menu_navigation', className: 'items-center sm:hidden', native: false, props: { variant: 'default', rounded: true, size: 'base', startDecorator: 'Menu', alt: 'Menu' } },
                { component: 'menu_navigation', className: 'items-center hidden sm:block lg:hidden', native: false, props: { variant: 'secondary', rounded: false, size: 'base', startDecorator: 'Menu', alt: 'Menu' } },
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