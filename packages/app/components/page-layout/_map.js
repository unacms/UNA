import PageLayoutDefault from 'app/components/page-layout/default';
import PageCustomPost from 'app/components/page-layout/post';
import PageCustomPostWithoutComments from 'app/components/page-layout/post-without-comments';
import PageCustomHome from 'app/components/page-layout/home';
import PageCustomCreateAccount from 'app/components/page-layout/create-account';
import PageCustomLogin from 'app/components/page-layout/login';
import PageUniversal from 'app/components/page-layout/universal';

export { layoutLazyLoaders } from './_map.lazy';

/** Sync layouts — home, auth, post, and universal CMS layouts stay on the critical path. */
export const componentsMapDefault = {
    'default': PageLayoutDefault,
    'post': PageCustomPost,
    'discussion': PageCustomPost,
    'post-without-comments': PageCustomPostWithoutComments,
    'home': PageCustomHome,
    'create-account': PageCustomCreateAccount,
    'login': PageCustomLogin,
    'layout_top_area_bar_right': PageUniversal,
    'layout_topbottom_area_bar_left': PageUniversal,
    'layout_topbottom_area_bar_right': PageUniversal,
    'layout_topbottom_area_col2_col5_col3': PageUniversal,
    'layout_top_area_bar_left': PageUniversal,
    'layout_top_area_3_columns': PageUniversal,
    'layout_top_area_2_columns': PageUniversal,
    'layout_topbottom_area_2_columns': PageUniversal,
    'layout_1_column_thin': PageCustomLogin
};
