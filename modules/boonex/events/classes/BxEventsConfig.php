<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Events Events
 * @ingroup     UnaModules
 *
 * @{
 */

class BxEventsConfig extends BxBaseModGroupsConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-event-profile' => 'checkAllowedView',
            'edit-event-profile' => 'checkAllowedEdit',
            'event-manage' => 'checkAllowedEdit',
            'event-questionnaire' => 'checkAllowedEdit',
            'event-sessions' => 'checkAllowedEdit',
            'event-cover' => 'checkAllowedChangeCover',
            'invite-to-event' => 'checkAllowedInvite',
            'delete-event-profile' => 'checkAllowedDelete',
            'approve-event-profile' => 'checkAllowedApprove',
            'add-event-content' => 'checkAllowedAddContent',
            'profile-check-in' =>  'checkAllowedCheckIn',
            'ical-export' => 'checkAllowedIcalExport',
        ));

        $this->CNF = array (

            // module icon
            'ICON' => 'calendar',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'data',
            'TABLE_ENTRIES_FULLTEXT' => 'search_fields',
            'TABLE_ADMINS' => $aModule['db_prefix'] . 'admins',
            'TABLE_CHECK_IN' => $aModule['db_prefix'] . 'check_in',
            'TABLE_INVITES' => $aModule['db_prefix'] . 'invites',
            'TABLE_PRICES' => $aModule['db_prefix'] . 'prices',
            'TABLE_QUESTIONS' => $aModule['db_prefix'] . 'qnr_questions',
            'TABLE_ANSWERS' => $aModule['db_prefix'] . 'qnr_answers',
            'TABLE_SESSIONS' => $aModule['db_prefix'] . 'sessions',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_PUBLISHED' => 'published',
            'FIELD_NAME' => 'event_name',
            'FIELD_TITLE' => 'event_name',
            'FIELD_TEXT' => 'event_desc',
            'FIELD_CATEGORY' => 'event_cat',
            'FIELD_PICTURE' => 'picture',
            'FIELD_COVER' => 'cover',
            'FIELD_COVER_POSITION' => 'cover_data',
            'FIELD_DATE_START' => 'date_start',
            'FIELD_DATE_END' => 'date_end',
            'FIELD_TIMEZONE' => 'timezone',
            'FIELD_JOIN_CONFIRMATION' => 'join_confirmation',
            'FIELD_REMINDER' => 'reminder',
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
            'FIELDS_QUICK_SEARCH' => array('event_name'),
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELD_LABELS' => 'labels',

            'FIELD_PRICE_ROLE_ID' => 'role_id',
            'FIELD_PRICE_NAME' => 'name',

            // page URIs
            'URI_VIEW_ENTRY' => 'view-event-profile',
            'URI_VIEW_MEMBERS' => 'event-fans',
            'URI_ADD_ENTRY' => 'create-event-profile',
            'URI_EDIT_ENTRY' => 'edit-event-profile',
            'URI_ENTRIES_BY_CONTEXT' => 'events-context',
            'URI_JOIN_ENTRY' => 'join-event-profile',
            'URI_JOINED_ENTRIES' => 'joined-events',
            'URI_FOLLOWED_ENTRIES' => 'followed-events',
            'URI_MANAGE_COMMON' => 'events-manage',
            'URI_FAVORITES_LIST' => 'events-favorites',

            'URL_HOME' => 'page.php?i=events-home',
            'URL_ENTRY_FANS' => 'page.php?i=event-fans',
            'URL_ENTRY_MANAGE' => 'page.php?i=event-manage',
            'URL_MANAGE_COMMON' => 'page.php?i=events-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=events-administration',

            'PARAM_AUTO_APPROVE' => 'bx_events_enable_auto_approve',
            'PARAM_USE_COVER_AS_THUMB' => 'bx_events_use_cover_as_thumb',
            'PARAM_CHARS_SUMMARY' => 'bx_events_summary_chars',
            'PARAM_NUM_RSS' => 'bx_events_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_events_num_connections_quick',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_events_searchable_fields',
            'PARAM_PUBLIC_SBSD' => 'bx_events_public_subscribed_me',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_events_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_events_per_page_browse_recommended',
            'PARAM_FORMAT_TIME' => 'bx_events_time_format',
            'PARAM_FORMAT_DATE' => 'bx_events_short_date_format',
            'PARAM_FORMAT_DATETIME' => 'bx_events_datetime_format',
            'PARAM_MMODE' => 'bx_events_members_mode',
            'PARAM_PAID_JOIN_ENABLED' => true,
            'PARAM_RECURRING_RESERVE' => 3, // 3 days for recurring payment to be registered
            'PARAM_SBS_WO_JOIN' => 'bx_events_enable_subscribe_wo_join',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_events_per_page_for_favorites_lists',
            'PARAM_USE_IN' => 'bx_events_internal_notifications',
            'PARAM_DELETE_FROM_TIMELINE_AFTER' => 'bx_events_rm_from_timeline_after',

            // objects
            'OBJECT_STORAGE' => 'bx_events_pics',
            'OBJECT_STORAGE_COVER' => 'bx_events_pics',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_events_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_events_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_events_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_events_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_events_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_events_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_events_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_events_gallery',
            'OBJECT_VIEWS' => 'bx_events',
            'OBJECT_VOTES' => 'bx_events',
            'OBJECT_REACTIONS' => 'bx_events_reactions',
            'OBJECT_SCORES' => 'bx_events',
            'OBJECT_FAVORITES' => 'bx_events',
            'OBJECT_FEATURED' => 'bx_events',
            'OBJECT_COMMENTS' => 'bx_events',
            'OBJECT_NOTES' => 'bx_events_notes',
            'OBJECT_REPORTS' => 'bx_events',
            'OBJECT_METATAGS' => 'bx_events',
            'OBJECT_CATEGORY' => 'bx_events_cats',
            'OBJECT_FORM_ENTRY' => 'bx_event',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_event_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_event_view_full', // for "info" tab on view group page
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_event_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_event_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_event_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_event_delete',
            'OBJECT_FORM_ENTRY_DISPLAY_INVITE' => 'bx_event_invite',
            'OBJECT_FORM_QUESTION' => 'bx_events_question',
            'OBJECT_FORM_QUESTION_DISPLAY_ADD' => 'bx_events_question_add',
            'OBJECT_FORM_QUESTION_DISPLAY_EDIT' => 'bx_events_question_edit',
            'OBJECT_FORM_SESSION' => 'bx_events_session',
            'OBJECT_FORM_SESSION_DISPLAY_ADD' => 'bx_events_session_add',
            'OBJECT_FORM_SESSION_DISPLAY_EDIT' => 'bx_events_session_edit',
            'OBJECT_FORM_PRICE' => 'bx_events_price',
            'OBJECT_FORM_PRICE_DISPLAY_ADD' => 'bx_events_price_add',
            'OBJECT_FORM_PRICE_DISPLAY_EDIT' => 'bx_events_price_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_events_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_events_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_events_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_events_my', // actions menu on profile entries page
            'OBJECT_MENU_SUBMENU' => 'bx_events_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_events_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'events-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_events_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_events_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_events_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_events_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_events_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_events_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_events_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_events_allow_view_favorite_list',
            'OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT' => 'bx_events_allow_view_notification_to',
            'OBJECT_PRIVACY_POST' => 'bx_events_allow_post_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_events_administration',
            'OBJECT_GRID_COMMON' => 'bx_events_common',
            'OBJECT_GRID_CONNECTIONS' => 'bx_events_fans',
            'OBJECT_GRID_INVITES' => 'bx_events_invites',
            'OBJECT_GRID_QUESTIONS_MANAGE' => 'bx_events_questions_manage',
            'OBJECT_GRID_SESSIONS_MANAGE' => 'bx_events_sessions_manage',
            'OBJECT_GRID_PRICES_MANAGE' => 'bx_events_prices_manage',
            'OBJECT_GRID_PRICES_VIEW' => 'bx_events_prices_view',
            'OBJECT_CONNECTIONS' => 'bx_events_fans',
            'OBJECT_UPLOADERS_COVER' => array('bx_events_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_events_picture_crop'),
            'OBJECT_PRE_LIST_ROLES' => 'bx_events_roles',
            'OBJECT_PRE_LIST_PERIOD_UNITS' => 'bx_events_period_units',
            
            'BADGES_AVALIABLE' => true,
            'INVITES_KEYS_LIFETIME' => 86400,
            'ENABLE_FOR_CONTEXT_IN_MODULES' => array('bx_groups', 'bx_spaces'),

            'EMAIL_INVITATION' => 'bx_events_invitation',
            'EMAIL_JOIN_REQUEST' => 'bx_events_join_request',
            'EMAIL_JOIN_CONFIRM' => 'bx_events_join_confirm',
            'EMAIL_FAN_BECOME_ADMIN' => 'bx_events_fan_become_admin',
            'EMAIL_ADMIN_BECOME_FAN' => 'bx_events_admin_become_fan',
            'EMAIL_FAN_REMOVE' => 'bx_events_fan_remove',
            'EMAIL_FAN_SET_ROLE' => 'bx_events_set_role',
            'EMAIL_JOIN_REJECT' => 'bx_events_join_reject',
            'EMAIL_REMINDER' => 'bx_events_reminder',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_group_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_group_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_group_view_actions',
        	'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_group_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_events_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_events_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_events_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-events-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_events_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_events_txt_account_suspended',
                    ),
                ),
                'approving' => array (
                    'name' => 'bx-groups-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_events_txt_account_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_events_txt_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'scheduled' => array (
                    'name' => 'bx-events-scheduled',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_events_txt_scheduled_awaiting', 'type' => BX_INFORMER_ALERT),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_events_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_events_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_events_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_events_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_events_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_events_txt_sample_score_down_single',
                'txt_private_group' => '_bx_events_txt_private_group',
                'txt_N_fans' => '_bx_events_txt_N_fans',
                'txt_ntfs_join_invitation' => '_bx_events_txt_ntfs_join_invitation',
                'txt_ntfs_join_request' => '_bx_events_txt_ntfs_join_request',
                'txt_ntfs_fan_added' => '_bx_events_txt_ntfs_fan_added',
            	'txt_ntfs_timeline_post_common' => '_bx_events_txt_ntfs_timeline_post_common',
                'option_members_mode_multi_roles' => '_bx_events_option_members_mode_multi_roles',
                'txt_all_entries_in' => '_bx_events_txt_all_entries_in',
            	'form_field_author' => '_bx_events_form_profile_input_author',
                'menu_item_title_pay_and_join' => '_bx_events_menu_item_title_pay_and_join',
                'menu_item_title_befriend_sent' => '_bx_events_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_events_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_events_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_events_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_events_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_events_menu_item_title_unfriend',
                'menu_item_title_subscribe' => '_bx_events_menu_item_title_subscribe',
                'menu_item_title_unsubscribe' => '_bx_events_menu_item_title_unsubscribe',
            	'grid_action_err_delete' => '_bx_events_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_events_grid_txt_account_manager',
                'filter_item_active' => '_bx_events_grid_filter_item_title_adm_active',
                'filter_item_hidden' => '_bx_events_grid_filter_item_title_adm_hidden',
            	'filter_item_pending' => '_bx_events_grid_filter_item_title_adm_pending',
            	'filter_item_suspended' => '_bx_events_grid_filter_item_title_adm_suspended',
            	'filter_item_select_one_filter1' => '_bx_events_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_events_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_events_menu_item_title_manage_my',
                'menu_item_manage_all' => '_bx_events_menu_item_title_manage_all',
                'menu_item_title_sm_fans' => '_bx_events_menu_item_title_fans',
                'txt_unit_view' => '_bx_events_txt_unit_view',
                'menu_item_title_sm_join' => '_bx_events_menu_item_title_become_fan',
                'menu_item_title_sm_join_short' => '_bx_events_menu_item_title_sm_join_short',
                'menu_item_title_sm_joined' => '_bx_events_menu_item_title_sm_joined',
                'menu_item_title_sm_join_requested' => '_bx_events_menu_item_title_become_fan_sent',
                'menu_item_title_sm_leave' => '_bx_events_menu_item_title_leave_group',
                'menu_item_title_sm_leave_cancel' => '_bx_events_menu_item_title_leave_group_cancel_request',
                'menu_item_title_sm_members' => '_bx_events_menu_item_title_sm_members',
                'menu_item_title_sm_subscribers' => '_bx_events_menu_item_title_sm_subscribers',
            	'txt_all_entries_by_author' => '_bx_events_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_events_page_title_browse_by_context',
                'txt_invitation_popup_title' => '_bx_events_txt_invite_popup_title',
                'txt_invitation_popup_text' => '_bx_events_txt_invite_popup_text',
                'txt_invitation_popup_accept_button' => '_bx_events_txt_invite_popup_button_accept',
                'txt_invitation_popup_decline_button' => '_bx_events_txt_invite_popup_button_decline',
                'txt_invitation_popup_error_invitation_absent' => '_bx_events_txt_invite_popup_error_invitation_absent',
                'txt_invitation_popup_error_wrong_user' => '_bx_events_txt_invite_popup_error_invitation_wrong_user',
                'txt_n_unit' => '_bx_events_txt_n_unit',
                'txt_buy_title' => '_bx_events_grid_action_title_buy_title',
                'txt_cart_item_title' => '_bx_events_txt_cart_item_title',
                'txt_cart_item_title_lifetime' => '_bx_events_txt_cart_item_title_lifetime',
                'txt_subscribe_title' => '_bx_events_grid_action_title_subscribe_title',
                'form_qnr_field_qn_err' => '_bx_events_form_questionnaire_input_question_err',
                'popup_title_questionnaire' => '_bx_events_popup_title_questionnaire',
                'popup_title_question_add' => '_bx_events_popup_title_qn_add',
                'popup_title_question_edit' => '_bx_events_popup_title_qn_edit',
                'popup_title_price_add' => '_bx_events_popup_title_price_add',
                'popup_title_price_edit' => '_bx_events_popup_title_price_edit',
                'msg_performed' => '_bx_events_msg_performed',
                'err_period_unit' => '_bx_events_form_price_input_err_period_unit',
                'err_price_duplicate' => '_bx_events_err_price_duplicate',
                'err_cannot_perform' => '_bx_events_err_cannot_perform',
            ),

        );

        $this->_aJsClasses = array(
            'main' => 'BxEventsMain',
            'entry' => 'BxEventsEntry',
            'manage_tools' => 'BxEventsManageTools',
            'invite_popup' => 'BxEventsInvitePopup',
            'prices' => 'BxEventsPrices'
        );

        $this->_aJsObjects = array(
            'main' => 'oBxEventsMain',
            'entry' => 'oBxEventsEntry',
            'manage_tools' => 'oBxEventsManageTools',
            'invite_popup' => 'oBxEventsInvitePopup',
            'prices' => 'oBxEventsPrices'
        );

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION']
        );

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'popup_bfilters_recent' => $sHtmlPrefix . '-popup-bfilters-recent',
            'popup_question' => $sHtmlPrefix . '-popup-question',
            'popup_questionnaire' => $sHtmlPrefix . '-popup-questionnaire',
            'popup_session' => $sHtmlPrefix . '-popup-session'
        ]);
    }

}

/** @} */
