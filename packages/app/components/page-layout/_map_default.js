import PageLayoutDefault from './default';

import PageCustomPost from './post';
import PageCustomDiscussion from './discussion';
import PageCustomPostWithoutComments from './post-without-comments';
import PageCustomMessenger from './messenger';
import PageCustomDashboard from './dashboard';
import PageCustomNavigator from './navigator';
import PageCustomNavigatorSearch from './navigator_search';
import PageCustomProfile from './profile';
import PageCustomHome from './home';
import PageCustomNotif from './notif';
import PageCustomCreateAccount from './create-account';
import PageCustomLogin from './login';
import PageLayout1 from './layout_top_area_bar_right';
import PageLayout2 from './layout_topbottom_area_bar_left';
import PageLayout3 from './layout_topbottom_area_bar_right';


export const componentsMapDefault = {
    'default': PageLayoutDefault,
    'post': PageCustomPost,
    'discussion': PageCustomDiscussion,
    'post-without-comments': PageCustomPostWithoutComments,
    'navigator': PageCustomNavigator,
    'navigator_search': PageCustomNavigatorSearch,
    'messenger': PageCustomMessenger,
    'dashboard': PageCustomDashboard,
    'profile': PageCustomProfile,
    'profile-alt': PageCustomProfile,
    'home': PageCustomHome,
    'notif': PageCustomNotif,
    'create-account': PageCustomCreateAccount,
    'login': PageCustomLogin,

    'layout_top_area_bar_right': PageLayout1,
    'layout_topbottom_area_bar_left': PageLayout2,
    'layout_topbottom_area_bar_right': PageLayout3
};
