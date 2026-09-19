import PageLayoutDefault from 'app/components/page-layout/default';
import PageCustomPost from 'app/components/page-layout/post';
import PageCustomTask from 'app/components/page-layout/task';
import PageCustomPostWithoutComments from 'app/components/page-layout/post-without-comments';
import PageCustomNavigator from 'app/components/page-layout/navigator';
import PageCustomNavigatorSearch from 'app/components/page-layout/navigator-search';
import PageCustomProfile from 'app/components/page-layout/profile';
import PageCustomHome from 'app/components/page-layout/home';
import PageCustomNotif from 'app/components/page-layout/notif';
import PageCustomCreateAccount from 'app/components/page-layout/create-account';
import PageCustomLogin from 'app/components/page-layout/login';
import PageUniversal from 'app/components/page-layout/universal';
import PageLayoutPlay from './play';
import { lazyComponent } from 'app/lib/lazy-component';

// Messenger (chat stack) and wiki (yaml frontmatter, TOC, side panels) are
// whole-page layouts used on a few routes only — code-split them.
const PageCustomMessenger = lazyComponent(() => import('app/components/page-layout/messenger'), { name: 'PageCustomMessenger' });
const PageWiki = lazyComponent(() => import('app/components/page-layout/wiki'), { name: 'PageWiki' });
// Dev-only playgrounds — keep them out of
// the main chunk.
const PagePlayground = lazyComponent(() => import('app/components/page-layout/_playground/playground'), { name: 'PagePlayground' });
const PagePlaygroundForm = lazyComponent(() => import('app/components/page-layout/_playground/playground-form-layout'), { name: 'PagePlaygroundForm' });

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
    'messenger': PageCustomMessenger,
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
