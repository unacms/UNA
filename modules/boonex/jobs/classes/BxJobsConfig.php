<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

class BxJobsConfig extends BxBaseModGroupsConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-job-profile' => 'checkAllowedView',
            'edit-job-profile' => 'checkAllowedEdit',
            'job-manage' => 'checkAllowedEdit',
            'job-questionnaire' => 'checkAllowedEdit',
            'edit-job-cover' => 'checkAllowedChangeCover',
            'invite-to-job' => 'checkAllowedInvite',
            'delete-job-profile' => 'checkAllowedDelete',
            'approve-job-profile' => 'checkAllowedApprove',
            'add-job-content' => 'checkAllowedAddContent',
        ));

        $this->CNF = array (

            // module icon
            'ICON' => 'briefcase',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'data',
            'TABLE_ENTRIES_FULLTEXT' => 'search_fields',
            'TABLE_ADMINS' => $aModule['db_prefix'] . 'admins',
            'TABLE_INVITES' => $aModule['db_prefix'] . 'invites',
            'TABLE_PRICES' => $aModule['db_prefix'] . 'prices',
            'TABLE_QUESTIONS' => $aModule['db_prefix'] . 'qnr_questions',
            'TABLE_ANSWERS' => $aModule['db_prefix'] . 'qnr_answers',

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
            'FIELD_DATE_START' => 'date_start',
            'FIELD_DATE_END' => 'date_end',
            'FIELD_TIMEZONE' => 'timezone',
            'FIELD_PAY_TOTAL' => 'pay_total',
            'FIELD_PAY_HOURLY' => 'pay_hourly',
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
            'URI_VIEW_ENTRY' => 'view-job-profile',
            'URI_VIEW_MEMBERS' => 'job-fans',
            'URI_ADD_ENTRY' => 'create-job-profile',
            'URI_EDIT_ENTRY' => 'edit-job-profile',
            'URI_JOIN_ENTRY' => 'join-job-profile',
            'URI_JOINED_ENTRIES' => 'joined-jobs',
            'URI_FOLLOWED_ENTRIES' => 'followed-jobs',
            'URI_ENTRIES_BY_CONTEXT' => 'jobs-context',
            'URI_MANAGE_COMMON' => 'jobs-manage',
            'URI_FAVORITES_LIST' => 'jobs-favorites',

            'URL_HOME' => 'page.php?i=jobs-home',
            'URL_ENTRY_FANS' => 'page.php?i=job-fans',
            'URL_ENTRY_MANAGE' => 'page.php?i=job-manage',
            'URL_MANAGE_COMMON' => 'page.php?i=jobs-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=jobs-administration',

            'PARAM_AUTO_APPROVE' => 'bx_jobs_enable_auto_approve',
            'PARAM_USE_COVER_AS_THUMB' => 'bx_jobs_use_cover_as_thumb',
            'PARAM_NUM_RSS' => 'bx_jobs_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_jobs_num_connections_quick',

            'PARAM_SEARCHABLE_FIELDS' => 'bx_jobs_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_jobs_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_jobs_per_page_browse_recommended',

            'PARAM_MMODE' => 'bx_jobs_members_mode',
            'PARAM_PAID_JOIN_ENABLED' => true,
            'PARAM_RECURRING_RESERVE' => 3, // 3 days for recurring payment to be registered
            'PARAM_SBS_WO_JOIN' => 'bx_jobs_enable_subscribe_wo_join',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_jobs_per_page_for_favorites_lists',
            'PARAM_USE_IN' => 'bx_jobs_internal_notifications',
            
            // objects
            'OBJECT_STORAGE' => 'bx_jobs_pics',
            'OBJECT_STORAGE_COVER' => 'bx_jobs_pics',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_jobs_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_jobs_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_jobs_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_jobs_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_jobs_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_jobs_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_jobs_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_jobs_gallery',
            'OBJECT_VIEWS' => 'bx_jobs',
            'OBJECT_VOTES' => 'bx_jobs',
            'OBJECT_REACTIONS' => 'bx_jobs_reactions',
            'OBJECT_SCORES' => 'bx_jobs',
            'OBJECT_FAVORITES' => 'bx_jobs',
            'OBJECT_FEATURED' => 'bx_jobs',
            'OBJECT_COMMENTS' => 'bx_jobs',
            'OBJECT_NOTES' => 'bx_jobs_notes',
            'OBJECT_REPORTS' => 'bx_jobs',
            'OBJECT_METATAGS' => 'bx_jobs',
            'OBJECT_CATEGORY' => 'bx_jobs_cats',
            'OBJECT_FORM_ENTRY' => 'bx_job',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_job_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_job_view_full', // for "info" tab on view job page
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_job_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_job_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_job_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_job_delete',
            'OBJECT_FORM_ENTRY_DISPLAY_INVITE' => 'bx_job_invite',
            'OBJECT_FORM_QUESTION' => 'bx_jobs_question',
            'OBJECT_FORM_QUESTION_DISPLAY_ADD' => 'bx_jobs_question_add',
            'OBJECT_FORM_QUESTION_DISPLAY_EDIT' => 'bx_jobs_question_edit',
            'OBJECT_FORM_PRICE' => 'bx_jobs_price',
            'OBJECT_FORM_PRICE_DISPLAY_ADD' => 'bx_jobs_price_add',
            'OBJECT_FORM_PRICE_DISPLAY_EDIT' => 'bx_jobs_price_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_jobs_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_jobs_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_jobs_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_jobs_my', // actions menu on profile entries page
            'OBJECT_MENU_SUBMENU' => 'bx_jobs_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_jobs_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'jobs-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_jobs_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_jobs_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_jobs_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_jobs_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_jobs_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_jobs_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_jobs_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_jobs_allow_view_favorite_list',
            'OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT' => 'bx_jobs_allow_view_notification_to',
            'OBJECT_PRIVACY_POST' => 'bx_jobs_allow_post_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_jobs_administration',
            'OBJECT_GRID_COMMON' => 'bx_jobs_common',
            'OBJECT_GRID_CONNECTIONS' => 'bx_jobs_fans',
            'OBJECT_GRID_INVITES' => 'bx_jobs_invites',
            'OBJECT_GRID_BANS' => 'bx_jobs_bans',
            'OBJECT_GRID_QUESTIONS_MANAGE' => 'bx_jobs_questions_manage',
            'OBJECT_GRID_PRICES_MANAGE' => 'bx_jobs_prices_manage',
            'OBJECT_GRID_PRICES_VIEW' => 'bx_jobs_prices_view',
            'OBJECT_CONNECTIONS' => 'bx_jobs_fans',
            'OBJECT_RECOMMENDATIONS_FANS' => 'bx_jobs_fans',
            'OBJECT_UPLOADERS_COVER' => array('bx_jobs_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_jobs_picture_crop'),
            'OBJECT_PRE_LIST_ROLES' => 'bx_jobs_roles',
            'OBJECT_PRE_LIST_PERIOD_UNITS' => 'bx_jobs_period_units',
            
            'BADGES_AVALIABLE' => true,
            'INVITES_KEYS_LIFETIME' => 86400,
            'ENABLE_FOR_CONTEXT_IN_MODULES' => array('bx_events', 'bx_groups', 'bx_spaces'),

            'EMAIL_INVITATION' => 'bx_jobs_invitation',
            'EMAIL_JOIN_REQUEST' => 'bx_jobs_join_request',
            'EMAIL_JOIN_CONFIRM' => 'bx_jobs_join_confirm',
            'EMAIL_FAN_BECOME_ADMIN' => 'bx_jobs_fan_become_admin',
            'EMAIL_ADMIN_BECOME_FAN' => 'bx_jobs_admin_become_fan',
            'EMAIL_FAN_SET_ROLE' => 'bx_jobs_set_role',
            'EMAIL_FAN_REMOVE' => 'bx_jobs_fan_remove',
            'EMAIL_JOIN_REJECT' => 'bx_jobs_join_reject',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_group_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_group_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_group_view_actions',
        	'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_group_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_jobs_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_jobs_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_jobs_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-jobs-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_jobs_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_jobs_txt_account_suspended',
                    ),
                ),
                'approving' => array (
                    'name' => 'bx-jobs-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_jobs_txt_account_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_jobs_txt_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_unit_view' => '_bx_jobs_txt_unit_view',
                'txt_sample_single' => '_bx_jobs_txt_sample_single',
                'txt_sample_single_with_article' => '_bx_jobs_txt_sample_single_with_article',
                'txt_sample_comment_single' => '_bx_jobs_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_jobs_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_jobs_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_jobs_txt_sample_score_down_single',
                'txt_private_group' => '_bx_jobs_txt_private_job',
                'txt_N_fans' => '_bx_jobs_txt_N_fans',
                'txt_ntfs_join_invitation' => '_bx_jobs_txt_ntfs_join_invitation',
                'txt_ntfs_join_request' => '_bx_jobs_txt_ntfs_join_request',
                'txt_ntfs_fan_added' => '_bx_jobs_txt_ntfs_fan_added',
                'txt_ntfs_timeline_post_common' => '_bx_jobs_txt_ntfs_timeline_post_common',
                'option_members_mode_multi_roles' => '_bx_jobs_option_members_mode_multi_roles',
                'form_field_author' => '_bx_jobs_form_entry_input_author',
                'menu_item_title_pay_and_join' => '_bx_jobs_menu_item_title_pay_and_join',
                'menu_item_title_befriend_sent' => '_bx_jobs_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_jobs_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_jobs_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_jobs_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_jobs_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_jobs_menu_item_title_unfriend',
                'grid_action_err_delete' => '_bx_jobs_grid_action_err_delete',
                'grid_txt_account_manager' => '_bx_jobs_grid_txt_account_manager',
                'filter_item_active' => '_bx_jobs_grid_filter_item_title_adm_active',
                'filter_item_hidden' => '_bx_jobs_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_jobs_grid_filter_item_title_adm_pending',
                'filter_item_suspended' => '_bx_jobs_grid_filter_item_title_adm_suspended',
                'filter_item_select_one_filter1' => '_bx_jobs_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_jobs_grid_filter_item_title_adm_select_one_filter2',
                'menu_item_manage_my' => '_bx_jobs_menu_item_title_manage_my',
                'menu_item_manage_all' => '_bx_jobs_menu_item_title_manage_all',
                'menu_item_title_sm_fans' => '_bx_jobs_menu_item_title_fans',
                'menu_item_title_sm_join' => '_bx_jobs_menu_item_title_become_fan',
                'menu_item_title_sm_join_requested' => '_bx_jobs_menu_item_title_become_fan_sent',
                'menu_item_title_sm_leave' => '_bx_jobs_menu_item_title_leave_job',
                'menu_item_title_sm_leave_cancel' => '_bx_jobs_menu_item_title_leave_job_cancel_request',
                'menu_item_title_sm_members' => '_bx_jobs_menu_item_title_sm_members',
                'txt_all_entries_in' => '_bx_jobs_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_jobs_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_jobs_page_title_browse_by_context',
                'txt_invitation_popup_title' => '_bx_jobs_txt_invite_popup_title',
                'txt_invitation_popup_text' => '_bx_jobs_txt_invite_popup_text',
                'txt_invitation_popup_accept_button' => '_bx_jobs_txt_invite_popup_button_accept',
                'txt_invitation_popup_decline_button' => '_bx_jobs_txt_invite_popup_button_decline',
                'txt_invitation_popup_error_invitation_absent' => '_bx_jobs_txt_invite_popup_error_invitation_absent',
                'txt_invitation_popup_error_wrong_user' => '_bx_jobs_txt_invite_popup_error_invitation_wrong_user',
                'txt_n_unit' => '_bx_jobs_txt_n_unit',
                'txt_buy_title' => '_bx_jobs_grid_action_title_buy_title',
                'txt_cart_item_title' => '_bx_jobs_txt_cart_item_title',
                'txt_cart_item_title_lifetime' => '_bx_jobs_txt_cart_item_title_lifetime',
                'txt_subscribe_title' => '_bx_jobs_grid_action_title_subscribe_title',
                'form_qnr_field_qn_err' => '_bx_jobs_form_questionnaire_input_question_err',
                'popup_title_questionnaire' => '_bx_jobs_popup_title_questionnaire',
                'popup_title_question_add' => '_bx_jobs_popup_title_qn_add',
                'popup_title_question_edit' => '_bx_jobs_popup_title_qn_edit',
                'popup_title_price_add' => '_bx_jobs_popup_title_price_add',
                'popup_title_price_edit' => '_bx_jobs_popup_title_price_edit',
                'msg_performed' => '_bx_jobs_msg_performed',
                'err_period_unit' => '_bx_jobs_form_price_input_err_period_unit',
                'err_price_duplicate' => '_bx_jobs_err_price_duplicate',
                'err_cannot_perform' => '_bx_jobs_err_cannot_perform',
            ),

        );

        $this->_aJsClasses = array(
            'main' => 'BxJobsMain',
            'entry' => 'BxJobsEntry',
            'manage_tools' => 'BxJobsManageTools',
            'invite_popup' => 'BxJobsInvitePopup',
            'prices' => 'BxJobsPrices'
        );

        $this->_aJsObjects = array(
            'main' => 'oBxJobsMain',
            'entry' => 'oBxJobsEntry',
            'manage_tools' => 'oBxJobsManageTools',
            'invite_popup' => 'oBxJobsInvitePopup',
            'prices' => 'oBxJobsPrices'
        );

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        );

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'popup_question' => $sHtmlPrefix . '-popup-question',
            'popup_questionnaire' => $sHtmlPrefix . '-popup-questionnaire'
        ]);
    }

}

/** @} */
