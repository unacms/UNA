/**
 * Heavy or rare element blocks — loaded on first use via registry lazy wrappers.
 * Platform files (.web.js / .native.js) resolve automatically in each bundler.
 */
export const elementLazyLoaders = {
    browse: () => import('./browse'),
    browse_simple: () => import('./browse_simple'),
    browse_list: () => import('./browse_list'),
    bento_grid: () => import('./smart_grid'),
    map: () => import('./map'),
    chart: () => import('./chart'),
    grid: () => import('./grid'),
    pricing: () => import('./pricing'),
    messenger_main_page: () => import('./messenger'),
    calendar: () => import('./calendar'),
    deploy: () => import('./deploy'),
    get_create_post_form: () => import('./multi_post_form'),
    course_structure: () => import('./course_structure'),
    module_structure: () => import('./module_structure'),
    edit_course_content: () => import('./edit_course_content'),
    stripe_connect: () => import('./stripe_connect'),
    bundles: () => import('./bundles'),
    comments: () => import('./comments'),
    invite: () => import('./invite'),
    search_sections: () => import('./search_sections'),
    profiles_list: () => import('./profiles_list'),
    reputation_summary: () => import('./reputation').then((m) => ({ default: m.ReputationSummary })),
    reputation_leaderboard: () => import('./reputation').then((m) => ({ default: m.ReputationLeaderboard })),
    reputation_levels: () => import('./reputation').then((m) => ({ default: m.ReputationLevels })),
    reputation_history: () => import('./reputation').then((m) => ({ default: m.ReputationHistory })),
    reputation_actions: () => import('./reputation').then((m) => ({ default: m.ReputationActions })),
    reputation_widget: () => import('./reputation').then((m) => ({ default: m.ReputationWidget })),
};
