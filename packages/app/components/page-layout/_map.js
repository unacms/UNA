import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each page layout is its own chunk: fetched when a page uses it, and preloaded
// in the HTML when it was rendered during SSR (see lib/dynamic-fallback.js).
const PageLayoutDefault = dynamic(() => import('app/components/page-layout/default'), { loading: DynamicFallback });
const PageCustomPost = dynamic(() => import('app/components/page-layout/post'), { loading: DynamicFallback });
const PageCustomTask = dynamic(() => import('app/components/page-layout/task'), { loading: DynamicFallback });
const PageCustomPostWithoutComments = dynamic(() => import('app/components/page-layout/post-without-comments'), { loading: DynamicFallback });
const PageCustomNavigator = dynamic(() => import('app/components/page-layout/navigator'), { loading: DynamicFallback });
const PageCustomNavigatorSearch = dynamic(() => import('app/components/page-layout/navigator-search'), { loading: DynamicFallback });
const PageCustomProfile = dynamic(() => import('app/components/page-layout/profile'), { loading: DynamicFallback });
const PageCustomHome = dynamic(() => import('app/components/page-layout/home'), { loading: DynamicFallback });
const PageCustomNotif = dynamic(() => import('app/components/page-layout/notif'), { loading: DynamicFallback });
const PageCustomCreateAccount = dynamic(() => import('app/components/page-layout/create-account'), { loading: DynamicFallback });
const PageCustomLogin = dynamic(() => import('app/components/page-layout/login'), { loading: DynamicFallback });
const PageUniversal = dynamic(() => import('app/components/page-layout/universal'), { loading: DynamicFallback });
const PageLayoutPlay = dynamic(() => import('./play'), { loading: DynamicFallback });
const PageCustomChat = dynamic(() => import('app/components/page-layout/chat'), { loading: DynamicFallback });
const PageWiki = dynamic(() => import('app/components/page-layout/wiki'), { loading: DynamicFallback });
// Dev-only playgrounds.
const PagePlayground = dynamic(() => import('app/components/page-layout/_playground/playground'), { loading: DynamicFallback });
const PagePlaygroundForm = dynamic(() => import('app/components/page-layout/_playground/playground-form-layout'), { loading: DynamicFallback });

// Page layouts by name: UNA `layout`, or a page's `layout` setting (see getLayoutName).
// Layouts mapped to PageLayoutDefault also get the `components_<uri>` page override slot
// (page-layout/default.js). Forks extend this map in customization/page-layout/_map.js.
export const componentsMapDefault = {
    'default': PageLayoutDefault,
    'post': PageCustomPost,
    'task': PageCustomTask,
    'playground': PagePlayground,
    'play': PageLayoutPlay,
    'playground-form': PagePlaygroundForm,
    'discussion': PageCustomPost,
    'post-without-comments': PageCustomPostWithoutComments,
    'navigator': PageCustomNavigator,
    'navigator_search': PageCustomNavigatorSearch,
    'chat': PageCustomChat,
    'messenger': PageCustomChat, // alias of `chat`
    'profile': PageCustomProfile,
    'profile-alt': PageCustomProfile,
    'home': PageCustomHome,
    'notif': PageCustomNotif,
    'create-account': PageCustomCreateAccount,
    'login': PageCustomLogin,
    'layout_1_column': PageLayoutDefault,
    'layout_1_column_wiki': PageWiki,
    'layout_1_column_thin': PageLayoutDefault,
    'layout_1_column_half': PageLayoutDefault,

    'layout_bar_left': PageUniversal,
    'layout_bar_right': PageUniversal,
    'layout_2_columns': PageUniversal,
    'layout_3_columns': PageUniversal,
    'layout_bar_content_bar': PageUniversal,
    'layout_top_area_bar_left': PageUniversal,
    'layout_top_area_bar_right': PageUniversal,
    'layout_top_area_2_columns': PageUniversal,
    'layout_top_area_3_columns': PageUniversal,
    'layout_top_area_bar_content_bar': PageUniversal,
    'layout_topbottom_area_2_columns': PageUniversal,
    'layout_topbottom_area_bar_left': PageUniversal,
    'layout_topbottom_area_bar_right': PageUniversal,
    'layout_topbottom_area_col1_col3_col2': PageUniversal,
    'layout_topbottom_area_col2_col5_col3': PageUniversal,
};
