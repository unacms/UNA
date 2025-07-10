import PageLayoutDefault from './default';

import PageCustomPost from './post';

import PageCustomPostWithoutComments from './post-without-comments';
import PageCustomMessenger from './messenger';

import PageCustomNavigator from './navigator';
import PageCustomNavigatorSearch from './navigator_search';
import PageCustomProfile from './profile';
import PageCustomHome from './home';
import PageCustomNotif from './notif';
import PageCustomCreateAccount from './create-account';
import PageCustomLogin from './login';
import PageUniversal from './universal';

export const componentsMapDefault = {
    'default': PageLayoutDefault,
    'post': PageCustomPost,
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

    'layout_top_area_bar_right': PageUniversal,
    'layout_topbottom_area_bar_left': PageUniversal,
    'layout_topbottom_area_bar_right': PageUniversal,
    'layout_topbottom_area_col2_col5_col3': PageUniversal
};
