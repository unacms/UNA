<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Courses Courses
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCoursesConfig extends BxBaseModGroupsConfig
{
    protected $_aPerPageDefault;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-course-profile' => 'checkAllowedView',
            'edit-course-profile' => 'checkAllowedEdit',
            'hide-course-profile' => 'checkAllowedHide',
            'unhide-course-profile' => 'checkAllowedUnhide',
            'edit-course-cover' => 'checkAllowedChangeCover',
            'invite-to-course' => 'checkAllowedInvite',
            'delete-course-profile' => 'checkAllowedDelete',
            'approve-course-profile' => 'checkAllowedApprove',
            'add-course-content' => 'checkAllowedAddContent',
        ));

        $this->CNF = array (

            // module icon
            'ICON' => 'book-reader',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'data',
            'TABLE_ENTRIES_FULLTEXT' => 'search_fields',
            'TABLE_ADMINS' => $aModule['db_prefix'] . 'admins',
            'TABLE_INVITES' => $aModule['db_prefix'] . 'invites',
            'TABLE_PRICES' => $aModule['db_prefix'] . 'prices',
            'TABLE_CNT_STRUCTURE' => $aModule['db_prefix'] . 'content_structure',
            'TABLE_CNT_NODES' => $aModule['db_prefix'] . 'content_nodes',
            'TABLE_CNT_NODES2USERS' => $aModule['db_prefix'] . 'content_nodes2users',
            'TABLE_CNT_DATA' => $aModule['db_prefix'] . 'content_data',
            'TABLE_CNT_DATA2USERS' => $aModule['db_prefix'] . 'content_data2users',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_NAME' => 'name',
            'FIELD_TITLE' => 'name',
            'FIELD_TEXT' => 'desc',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_PICTURE' => 'picture',
            'FIELD_COVER' => 'cover',
            'FIELD_COVER_POSITION' => 'cover_data',
            'FIELD_JOIN_CONFIRMATION' => 'join_confirmation',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_ALLOW_POST_TO' => 'allow_post_to',
            'FIELD_CF' => 'cf',
            'FIELD_VIEWS' => 'views',
            'FIELD_VOTES' => 'votes',
            'FIELD_REACTIONS' => 'rvotes',
            'FIELD_SCORE' => 'score',
            'FIELD_SCORE_UP' => 'sc_up',
            'FIELD_SCORE_DOWN' => 'sc_down',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_REPORTS' => 'reports',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELDS_QUICK_SEARCH' => array('name'),
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

            'FIELD_PRICE_ROLE_ID' => 'role_id',
            'FIELD_PRICE_NAME' => 'name',

            // page URIs
            'URI_VIEW_ENTRY' => 'view-course-profile',
            'URI_VIEW_ENTRY_NODE' => 'view-course-profile-node',
            'URI_ADD_ENTRY' => 'create-course-profile',
            'URI_EDIT_ENTRY' => 'edit-course-profile',
            'URI_EDIT_ENTRY_CONTENT' => 'edit-course-content',
            'URI_ENTRIES_BY_CONTEXT' => 'courses-context',
            'URI_JOIN_ENTRY' => 'join-course-profile',
            'URI_JOINED_ENTRIES' => 'joined-courses',
            'URI_MANAGE_COMMON' => 'courses-manage',
            'URI_FAVORITES_LIST' => 'courses-favorites',

            'URL_HOME' => 'page.php?i=courses-home',
            'URL_ENTRY_FANS' => 'page.php?i=course-fans',
            'URL_MANAGE_STRUCTURE' => 'page.php?i=edit-course-content',
            'URL_MANAGE_COMMON' => 'page.php?i=courses-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=courses-administration',

            'PARAM_AUTO_APPROVE' => 'bx_courses_enable_auto_approve',
            'PARAM_USE_COVER_AS_THUMB' => 'bx_courses_use_cover_as_thumb',
            'PARAM_NUM_RSS' => 'bx_courses_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_courses_num_connections_quick',

            'PARAM_SEARCHABLE_FIELDS' => 'bx_courses_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_courses_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_courses_per_page_browse_recommended',

            'PARAM_MMODE' => 'bx_courses_members_mode',
            'PARAM_PAID_JOIN_ENABLED' => true,
            'PARAM_RECURRING_RESERVE' => 3, // 3 days for recurring payment to be registered
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_courses_per_page_for_favorites_lists',
            'PARAM_USE_IN' => 'bx_courses_internal_notifications',

            'PARAM_CONTENT' => 'bx_courses_enable_content',
            'PARAM_CONTENT_LEVEL_MAX' => 'bx_courses_content_level_max',
            'PARAM_CONTENT_MODULES_ST' => 'bx_courses_content_modules_st',
            'PARAM_CONTENT_MODULES_AT' => 'bx_courses_content_modules_at',

            // objects
            'OBJECT_STORAGE' => 'bx_courses_pics',
            'OBJECT_STORAGE_COVER' => 'bx_courses_pics',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_courses_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_courses_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_courses_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_courses_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_courses_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_courses_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_courses_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_courses_gallery',
            'OBJECT_VIEWS' => 'bx_courses',
            'OBJECT_VOTES' => 'bx_courses',
            'OBJECT_REACTIONS' => 'bx_courses_reactions',
            'OBJECT_SCORES' => 'bx_courses',
            'OBJECT_FAVORITES' => 'bx_courses',
            'OBJECT_FEATURED' => 'bx_courses',
            'OBJECT_COMMENTS' => 'bx_courses',
            'OBJECT_NOTES' => 'bx_courses_notes',
            'OBJECT_REPORTS' => 'bx_courses',
            'OBJECT_METATAGS' => 'bx_courses',
            'OBJECT_CATEGORY' => 'bx_courses_cats',
            'OBJECT_FORM_ENTRY' => 'bx_course',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_course_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_course_view_full', // for "info" tab on view course page
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_course_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_course_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_course_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_course_delete',
            'OBJECT_FORM_ENTRY_DISPLAY_INVITE' => 'bx_course_invite',
            'OBJECT_FORM_PRICE' => 'bx_courses_price',
            'OBJECT_FORM_PRICE_DISPLAY_ADD' => 'bx_courses_price_add',
            'OBJECT_FORM_PRICE_DISPLAY_EDIT' => 'bx_courses_price_edit',
            'OBJECT_FORM_CNT_NODE' => 'bx_courses_content_node',
            'OBJECT_FORM_CNT_NODE_DISPLAY_ADD' => 'bx_courses_content_node_add',
            'OBJECT_FORM_CNT_NODE_DISPLAY_EDIT' => 'bx_courses_content_node_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_courses_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_courses_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_courses_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_courses_my', // actions menu on profile entries page
            'OBJECT_MENU_SUBMENU' => 'bx_courses_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_courses_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'courses-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_courses_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_courses_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_courses_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_MENU_CONTENT_ADD' => 'bx_courses_content_add',
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_courses_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_courses_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_courses_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_courses_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_courses_allow_view_favorite_list',
            'OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT' => 'bx_courses_allow_view_notification_to',
            'OBJECT_PRIVACY_POST' => 'bx_courses_allow_post_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_courses_administration',
            'OBJECT_GRID_COMMON' => 'bx_courses_common',
            'OBJECT_GRID_CONNECTIONS' => 'bx_courses_fans',
            'OBJECT_GRID_INVITES' => 'bx_courses_invites',
            'OBJECT_GRID_PRICES_MANAGE' => 'bx_courses_prices_manage',
            'OBJECT_GRID_PRICES_VIEW' => 'bx_courses_prices_view',
            'OBJECT_GRID_CNT_STRUCTURE_MANAGE' => 'bx_courses_cnt_structure_manage',
            'OBJECT_GRID_CNT_DATA_MANAGE' => 'bx_courses_cnt_data_manage',
            'OBJECT_CONNECTIONS' => 'bx_courses_fans',
            'OBJECT_UPLOADERS_COVER' => array('bx_courses_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_courses_picture_crop'),
            'OBJECT_PRE_LIST_ROLES' => 'bx_courses_roles',
            'OBJECT_PRE_LIST_PERIOD_UNITS' => 'bx_courses_period_units',

            'BADGES_AVALIABLE' => true,
            'INVITES_KEYS_LIFETIME' => 86400,
            'ENABLE_FOR_CONTEXT_IN_MODULES' => ['bx_spaces'],

            'EMAIL_INVITATION' => 'bx_courses_invitation',
            'EMAIL_JOIN_REQUEST' => 'bx_courses_join_request',
            'EMAIL_JOIN_CONFIRM' => 'bx_courses_join_confirm',
            'EMAIL_FAN_BECOME_ADMIN' => 'bx_courses_fan_become_admin',
            'EMAIL_ADMIN_BECOME_FAN' => 'bx_courses_admin_become_fan',
            'EMAIL_FAN_REMOVE' => 'bx_courses_fan_remove',
            'EMAIL_FAN_SET_ROLE' => 'bx_courses_set_role',
            'EMAIL_JOIN_REJECT' => 'bx_courses_join_reject',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_group_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_group_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_group_view_actions',
            'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_group_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_courses_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_courses_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_courses_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-courses-status-not-active',
                    'map' => array (
                        'hidden' => '_bx_courses_txt_status_hidden',
                        BX_PROFILE_STATUS_PENDING => '_bx_courses_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_courses_txt_account_suspended',
                    ),
                ),
                'approving' => array (
                    'name' => 'bx-groups-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_courses_txt_account_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_courses_txt_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_unit_view' => '_bx_courses_txt_unit_view',
                'txt_sample_single' => '_bx_courses_txt_sample_single',
                'txt_sample_single_with_article' => '_bx_courses_txt_sample_single_with_article',
                'txt_sample_comment_single' => '_bx_courses_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_courses_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_courses_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_courses_txt_sample_score_down_single',
                'txt_private_group' => '_bx_courses_txt_private_entry',
                'txt_N_fans' => '_bx_courses_txt_N_fans',
                'txt_ntfs_join_invitation' => '_bx_courses_txt_ntfs_join_invitation',
                'txt_ntfs_join_request' => '_bx_courses_txt_ntfs_join_request',
                'txt_ntfs_fan_added' => '_bx_courses_txt_ntfs_fan_added',
                'txt_ntfs_timeline_post_common' => '_bx_courses_txt_ntfs_timeline_post_common',
                'option_members_mode_multi_roles' => '_bx_courses_option_members_mode_multi_roles',
                'form_field_author' => '_bx_courses_form_entry_input_author',
                'menu_item_title_pay_and_join' => '_bx_courses_menu_item_title_pay_and_join',
                'menu_item_title_befriend_sent' => '_bx_courses_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_courses_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_courses_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_courses_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_courses_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_courses_menu_item_title_unfriend',
                'menu_item_title_hide' => '_bx_courses_menu_item_title_hide_profile',
                'menu_item_title_unhide' => '_bx_courses_menu_item_title_unhide_profile',
                'grid_action_err_delete' => '_bx_courses_grid_action_err_delete',
                'grid_txt_account_manager' => '_bx_courses_grid_txt_account_manager',
                'filter_item_active' => '_bx_courses_grid_filter_item_title_adm_active',
                'filter_item_hidden' => '_bx_courses_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_courses_grid_filter_item_title_adm_pending',
                'filter_item_suspended' => '_bx_courses_grid_filter_item_title_adm_suspended',
                'filter_item_select_one_filter1' => '_bx_courses_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_courses_grid_filter_item_title_adm_select_one_filter2',
                'menu_item_manage_my' => '_bx_courses_menu_item_title_manage_my',
                'menu_item_manage_all' => '_bx_courses_menu_item_title_manage_all',
                'menu_item_title_sm_fans' => '_bx_courses_menu_item_title_fans',
                'menu_item_title_sm_join' => '_bx_courses_menu_item_title_sm_join',
                'menu_item_title_sm_join_paid' => '_bx_courses_menu_item_title_sm_join_paid',
                'menu_item_title_sm_join_requested' => '_bx_courses_menu_item_title_become_fan_sent',
                'menu_item_title_sm_join_confirm' => '_bx_courses_menu_item_title_sm_join_confirm',
                'menu_item_title_sm_leave' => '_bx_courses_menu_item_title_sm_leave',
                'menu_item_title_sm_leave_cancel' => '_bx_courses_menu_item_title_sm_leave_cancel',
                'menu_item_title_sm_leave_reject' => '_bx_courses_menu_item_title_sm_leave_reject',
                'txt_all_entries_by_author' => '_bx_courses_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_courses_page_title_browse_by_context',
                'txt_all_entries_in' => '_bx_courses_txt_all_entries_in',
                'txt_invitation_popup_title' => '_bx_courses_txt_invite_popup_title',
                'txt_invitation_popup_text' => '_bx_courses_txt_invite_popup_text',
                'txt_invitation_popup_accept_button' => '_bx_courses_txt_invite_popup_button_accept',
                'txt_invitation_popup_decline_button' => '_bx_courses_txt_invite_popup_button_decline',
                'txt_invitation_popup_error_invitation_absent' => '_bx_courses_txt_invite_popup_error_invitation_absent',
                'txt_invitation_popup_error_wrong_user' => '_bx_courses_txt_invite_popup_error_invitation_wrong_user',
                'txt_n_unit' => '_bx_courses_txt_n_unit',
                'txt_buy_title' => '_bx_courses_grid_action_title_buy_title',
                'txt_cart_item_title' => '_bx_courses_txt_cart_item_title',
                'txt_cart_item_title_lifetime' => '_bx_courses_txt_cart_item_title_lifetime',
                'txt_subscribe_title' => '_bx_courses_grid_action_title_subscribe_title',
                'msg_performed' => '_bx_courses_msg_performed',
                'popup_title_price_add' => '_bx_courses_popup_title_price_add',
                'popup_title_price_edit' => '_bx_courses_popup_title_price_edit',
                'popup_title_content_node_add' => '_bx_courses_popup_title_cnt_add',
                'popup_title_content_node_edit' => '_bx_courses_popup_title_cnt_edit',
                'err_period_unit' => '_bx_courses_form_price_input_err_period_unit',
                'err_price_duplicate' => '_bx_courses_err_price_duplicate',
                'err_cannot_perform' => '_bx_courses_err_cannot_perform',
            ),

        );

        $this->_aJsClasses = [
            'main' => 'BxCoursesMain',
            'entry' => 'BxCoursesEntry',
            'manage_tools' => 'BxCoursesManageTools',
            'invite_popup' => 'BxCoursesInvitePopup',
            'prices' => 'BxCoursesPrices'
        ];

        $this->_aJsObjects = [
            'main' => 'oBxCoursesMain',
            'entry' => 'oBxCoursesEntry',
            'manage_tools' => 'oBxCoursesManageTools',
            'invite_popup' => 'oBxCoursesInvitePopup',
            'prices' => 'oBxCoursesPrices'
        ];

        $this->_aGridObjects = [
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        ];

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = [
            'popup_content_node' => $sHtmlPrefix . '-popup-content-node',
            'popup_content_data' => $sHtmlPrefix . '-popup-content-data',
        ];

        $this->_aPerPageDefault = [
            'default' => 12,
            'structure_l1' => !$this->_bIsApi ? 2 : 9999
        ];
    }

    public function getPerPageDefault($sType)
    {
        if(!isset($this->_aPerPageDefault[$sType]))
            $sType = 'default';

        return (int)$this->_aPerPageDefault[$sType];
    }

    public function isContent()
    {
        return getParam($this->CNF['PARAM_CONTENT']) == 'on';
    }

    public function getContentModules($iUsage)
    {
        return explode(',', getParam($this->CNF['PARAM_CONTENT_MODULES_' . $this->getUsageI2S($iUsage, false)]));
    }

    public function getContentLevelMax()
    {
        return (int)getParam($this->CNF['PARAM_CONTENT_LEVEL_MAX']);
    }

    public function getContentLevel2Node($bSingle = true)
    {
        $aResult = [];

        $sPostfix = $bSingle ? 'single' : 'plural';
        switch($this->getContentLevelMax()) {
            case 1:
                $aResult = [
                    1 => _t('_bx_courses_txt_sample_l3_' . $sPostfix)
                ];
                break;
            
            case 2:
                $aResult = [
                    1 => _t('_bx_courses_txt_sample_l1_' . $sPostfix),
                    2 => _t('_bx_courses_txt_sample_l3_' . $sPostfix)
                ];
                break;
            
            case 3:
                $aResult = [
                    1 => _t('_bx_courses_txt_sample_l1_' . $sPostfix),
                    2 => _t('_bx_courses_txt_sample_l2_' . $sPostfix),
                    3 => _t('_bx_courses_txt_sample_l3_' . $sPostfix)
                ];
                break;
        }
        
        return $aResult;
    }
    
    public function getContentNodeTitle($iLevel, $bSingle = true)
    {
        $aLevelToNode = $this->getContentLevel2Node($bSingle);
        return isset($aLevelToNode[$iLevel]) ? $aLevelToNode[$iLevel] : _t('_undefined');
    }

    public function getUsageI2S($iUsage, $bLowerCase = true)
    {
        $a = [
            BX_COURSES_CND_USAGE_ST => 'st',
            BX_COURSES_CND_USAGE_AT => 'at'
        ];

        if(!isset($a[$iUsage]))
            $iUsage = BX_COURSES_CND_USAGE_ST;        

        return $bLowerCase ? $a[$iUsage] : strtoupper($a[$iUsage]);
    }
}

/** @} */
