import PageLayoutDefault from './default';

import PageCustomPost from './post';
import PageCustomPostWithoutComments from './post-without-comments';
import PageCustomMessenger from './messenger';
import PageCustomDashboard from './dashboard';
import PageCustomBlackBox from './blackbox';
import PageCustomNavigator from './navigator';
import PageCustomBlackBoxSearch from './blackbox_search';
import PageCustomProfile from './profile';
import PageCustomHome from './home';
import PageCustomNotif from './notif';

import PageLayout1 from './layout_top_area_bar_right';
import PageLayout2 from './layout_topbottom_area_bar_left';
import PageLayout3 from './layout_topbottom_area_bar_right';


export const componentsMapDefault = {
    'default': PageLayoutDefault,
    'post': PageCustomPost,
    'post-without-comments': PageCustomPostWithoutComments,
    'blackbox': PageCustomBlackBox,
    'navigator': PageCustomNavigator,
    'blackbox_search': PageCustomBlackBoxSearch,
    'messenger': PageCustomMessenger,
    'dashboard': PageCustomDashboard,
    'profile': PageCustomProfile,
    'home': PageCustomHome,
    'notif': PageCustomNotif,

    'layout_top_area_bar_right': PageLayout1,
    'layout_topbottom_area_bar_left': PageLayout2,
    'layout_topbottom_area_bar_right': PageLayout3
};
