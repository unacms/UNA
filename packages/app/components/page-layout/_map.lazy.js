/**
 * Page layouts that are not needed for the initial guest/login/home shell.
 */
export const layoutLazyLoaders = {
    messenger: () => import('./messenger'),
    navigator: () => import('./navigator'),
    navigator_search: () => import('./navigator_search'),
    profile: () => import('./profile'),
    'profile-alt': () => import('./profile'),
    notif: () => import('./notif'),
    layout_1_column_wiki: () => import('./wiki'),
};

// Dev-only layout; `import()` + NODE_ENV lets webpack/Metro drop this in production.
if (process.env.NODE_ENV === 'development') {
    layoutLazyLoaders.playground = () => import('./playground');
}
