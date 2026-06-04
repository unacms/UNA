import PageLayoutDefault from 'app/components/page-layout/default';
import PageCustomPost from 'app/components/page-layout/post';
import PageCustomPostWithoutComments from 'app/components/page-layout/post-without-comments';
import PageCustomMessenger from 'app/components/page-layout/messenger';
import PageCustomNavigator from 'app/components/page-layout/navigator';
import PageCustomNavigatorSearch from 'app/components/page-layout/navigator_search';
import PageCustomProfile from 'app/components/page-layout/profile';
import PageCustomHome from 'app/components/page-layout/home';
import PageCustomNotif from 'app/components/page-layout/notif';
import PageCustomCreateAccount from 'app/components/page-layout/create-account';
import PageCustomLogin from 'app/components/page-layout/login';
import PageUniversal from 'app/components/page-layout/universal';
import PagePlayground from 'app/components/page-layout/playground';
import PageWiki from 'app/components/page-layout/wiki';

export const componentsMapDefault = {
    'default': PageLayoutDefault,
    'post': PageCustomPost,
    'playground': PagePlayground,
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
    'layout_1_column_wiki': PageWiki,
    'layout_top_area_bar_right': PageUniversal,
    'layout_topbottom_area_bar_left': PageUniversal,
    'layout_topbottom_area_bar_right': PageUniversal,
    'layout_topbottom_area_col2_col5_col3': PageUniversal,
    'layout_top_area_bar_left': PageUniversal,
    'layout_top_area_3_columns': PageUniversal,
    'layout_top_area_2_columns': PageUniversal,
    'layout_topbottom_area_2_columns': PageUniversal,
    'layout_1_column_thin': PageLayoutDefault,
    'layout_1_column_half': PageLayoutDefault,
};
