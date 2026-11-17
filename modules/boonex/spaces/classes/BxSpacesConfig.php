<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    Spaces Spaces
 * @indroup     UnaModules
 *
 * @{
 */

class BxSpacesConfig extends BxBaseModGroupsConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-space-profile' => 'checkAllowedView',
            'edit-space-profile' => 'checkAllowedEdit',
            'space-manage' => 'checkAllowedEdit',
            'edit-space-cover' => 'checkAllowedChangeCover',
            'edit-space-settings' => 'checkAllowedChangeSettings',
            'invite-to-space' => 'checkAllowedInvite',
            'delete-space-profile' => 'checkAllowedDelete',
            'approve-space-profile' => 'checkAllowedApprove',
            'add-space-content' => 'checkAllowedAddContent',
        ));

        $this->CNF = array (

            // module icon
            'ICON' => 'object-group',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'data',
            'TABLE_ENTRIES_FULLTEXT' => 'search_fields',
            'TABLE_ADMINS' => $aModule['db_prefix'] . 'admins',
            'TABLE_INVITES' => $aModule['db_prefix'] . 'invites',
            'TABLE_PRICES' => $aModule['db_prefix'] . 'prices',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_NAME' => 'space_name',
            'FIELD_PARENT' => 'parent_space',
            'FIELD_LEVEL' => 'level',
            'FIELD_TITLE' => 'space_name',
            'FIELD_TEXT' => 'space_desc',
            'FIELD_CATEGORY' => 'space_cat',
            'FIELD_MULTICAT' => 'multicat',
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
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELDS_QUICK_SEARCH' => array('space_name'),
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELD_LABELS' => 'labels',
            'FIELD_STG_TABS' => 'stg_tabs',

            'FIELD_PRICE_ROLE_ID' => 'role_id',
            'FIELD_PRICE_NAME' => 'name',

            // page URIs
            'URI_VIEW_ENTRY' => 'view-space-profile',
            'URI_ADD_ENTRY' => 'create-space-profile',
            'URI_EDIT_ENTRY' => 'edit-space-profile',
            'URI_JOIN_ENTRY' => 'join-space-profile',
            'URI_JOINED_ENTRIES' => 'joined-spaces',
            'URI_MANAGE_COMMON' => 'spaces-manage',

            'URL_HOME' => 'page.php?i=spaces-home',
            'URL_ENTRY_FANS' => 'page.php?i=space-fans',
            'URL_MANAGE_COMMON' => 'page.php?i=spaces-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=spaces-administration',
            'URL_CATEGORY' => 'page.php?i=spaces-category',
            'URL_MULTI_CATEGORY' => 'page.php?i=spaces-mcategory',

            'PARAM_AUTO_APPROVE' => 'bx_spaces_enable_auto_approve',
            'PARAM_MULTILEVEL_HIERARCHY' => 'bx_spaces_enable_multilevel_hierarchy',
            'PARAM_USE_COVER_AS_THUMB' => 'bx_spaces_use_cover_as_thumb',
            'PARAM_NUM_RSS' => 'bx_spaces_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_spaces_num_connections_quick',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_spaces_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_spaces_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_spaces_per_page_browse_recommended',

            'PARAM_MMODE' => 'bx_spaces_members_mode',
            'PARAM_PAID_JOIN_ENABLED' => true,
            'PARAM_RECURRING_RESERVE' => 3, // 3 days for recurring payment to be registered
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_spaces_per_page_for_favorites_lists',
            'PARAM_USE_IN' => 'bx_spaces_internal_notifications',
            'PARAM_MULTICAT_ENABLED' => true,
            'PARAM_MULTICAT_AUTO_ACTIVATION_FOR_CATEGORIES' => 'bx_spaces_auto_activation_for_categories',

            // objects
            'OBJECT_STORAGE' => 'bx_spaces_pics',
            'OBJECT_STORAGE_COVER' => 'bx_spaces_pics',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_spaces_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_spaces_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_spaces_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_spaces_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_spaces_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_spaces_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_spaces_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_spaces_gallery',
            'OBJECT_VIEWS' => 'bx_spaces',
            'OBJECT_VOTES' => 'bx_spaces',
            'OBJECT_VOTES_STARS' => 'bx_spaces_stars',
            'OBJECT_REACTIONS' => 'bx_spaces_reactions',
            'OBJECT_SCORES' => 'bx_spaces',
            'OBJECT_FAVORITES' => 'bx_spaces',
            'OBJECT_FEATURED' => 'bx_spaces',
            'OBJECT_COMMENTS' => 'bx_spaces',
            'OBJECT_NOTES' => 'bx_spaces_notes',
            'OBJECT_REPORTS' => 'bx_spaces',
            'OBJECT_METATAGS' => 'bx_spaces',
            'OBJECT_CATEGORY' => 'bx_spaces_cats',
            'OBJECT_FORM_ENTRY' => 'bx_space',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_space_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_space_view_full', // for "info" tab on view space page
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_space_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_space_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_space_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_SETTINGS' => 'bx_space_edit_settings',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_space_delete',
            'OBJECT_FORM_ENTRY_DISPLAY_INVITE' => 'bx_space_invite',
            'OBJECT_FORM_PRICE' => 'bx_spaces_price',
            'OBJECT_FORM_PRICE_DISPLAY_ADD' => 'bx_spaces_price_add',
            'OBJECT_FORM_PRICE_DISPLAY_EDIT' => 'bx_spaces_price_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_spaces_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_spaces_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_spaces_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_spaces_my', // actions menu on profile entries page
            'OBJECT_MENU_SUBMENU' => 'bx_spaces_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_spaces_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'spaces-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_spaces_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_spaces_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_spaces_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_spaces_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_spaces_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_spaces_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_spaces_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_spaces_allow_view_favorite_list',
            'OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT' => 'bx_spaces_allow_view_notification_to',
            'OBJECT_PRIVACY_POST' => 'bx_spaces_allow_post_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_spaces_administration',
            'OBJECT_GRID_COMMON' => 'bx_spaces_common',
            'OBJECT_GRID_CONNECTIONS' => 'bx_spaces_fans',
            'OBJECT_GRID_INVITES' => 'bx_spaces_invites',
            'OBJECT_GRID_PRICES_MANAGE' => 'bx_spaces_prices_manage',
            'OBJECT_GRID_PRICES_VIEW' => 'bx_spaces_prices_view',
            'OBJECT_CONNECTIONS' => 'bx_spaces_fans',
            'OBJECT_RECOMMENDATIONS_FANS' => 'bx_spaces_fans',
            'OBJECT_UPLOADERS_COVER' => array('bx_spaces_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_spaces_picture_crop'),
            'OBJECT_PRE_LIST_ROLES' => 'bx_spaces_roles',
            'OBJECT_PRE_LIST_PERIOD_UNITS' => 'bx_spaces_period_units',

            'BADGES_AVALIABLE' => true,
            'INVITES_KEYS_LIFETIME' => 86400,

            'EMAIL_INVITATION' => 'bx_spaces_invitation',
            'EMAIL_JOIN_REQUEST' => 'bx_spaces_join_request',
            'EMAIL_JOIN_CONFIRM' => 'bx_spaces_join_confirm',
            'EMAIL_FAN_BECOME_ADMIN' => 'bx_spaces_fan_become_admin',
            'EMAIL_ADMIN_BECOME_FAN' => 'bx_spaces_admin_become_fan',
            'EMAIL_FAN_SET_ROLE' => 'bx_spaces_set_role',
            'EMAIL_FAN_REMOVE' => 'bx_spaces_fan_remove',
            'EMAIL_JOIN_REJECT' => 'bx_spaces_join_reject',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_group_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_group_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_group_view_actions',
            'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_group_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_spaces_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_spaces_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_spaces_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-spaces-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_spaces_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_spaces_txt_account_suspended',
                    ),
                ),
                'approving' => array (
                    'name' => 'bx-groups-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_spaces_txt_account_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_spaces_txt_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_spaces_txt_sample_single',
                'txt_sample_single_with_article' => '_bx_spaces_txt_sample_single_with_article',
                'txt_sample_comment_single' => '_bx_spaces_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_spaces_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_spaces_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_spaces_txt_sample_score_down_single',
                'txt_private_group' => '_bx_spaces_txt_private_space',
                'txt_N_fans' => '_bx_spaces_txt_N_fans',
                'txt_ntfs_join_invitation' => '_bx_spaces_txt_ntfs_join_invitation',
                'txt_ntfs_join_request' => '_bx_spaces_txt_ntfs_join_request',
                'txt_ntfs_fan_added' => '_bx_spaces_txt_ntfs_fan_added',
                'txt_ntfs_timeline_post_common' => '_bx_spaces_txt_ntfs_timeline_post_common',
                'option_members_mode_multi_roles' => '_bx_spaces_option_members_mode_multi_roles',
                'form_field_author' => '_bx_spaces_form_entry_input_author',
                'menu_item_title_pay_and_join' => '_bx_spaces_menu_item_title_pay_and_join',
                'menu_item_title_befriend_sent' => '_bx_spaces_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_spaces_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_spaces_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_spaces_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_spaces_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_spaces_menu_item_title_unfriend',
                'grid_action_err_delete' => '_bx_spaces_grid_action_err_delete',
                'grid_txt_account_manager' => '_bx_spaces_grid_txt_account_manager',
                'filter_item_active' => '_bx_spaces_grid_filter_item_title_adm_active',
                'filter_item_hidden' => '_bx_spaces_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_spaces_grid_filter_item_title_adm_pending',
                'filter_item_suspended' => '_bx_spaces_grid_filter_item_title_adm_suspended',
                'filter_item_select_one_filter1' => '_bx_spaces_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_spaces_grid_filter_item_title_adm_select_one_filter2',
                'menu_item_manage_my' => '_bx_spaces_menu_item_title_manage_my',
                'menu_item_manage_all' => '_bx_spaces_menu_item_title_manage_all',
                'menu_item_title_sm_fans' => '_bx_spaces_menu_item_title_fans',
                'txt_unit_view' => '_bx_spaces_txt_unit_view',
                'menu_item_title_sm_join' => '_bx_spaces_menu_item_title_become_fan',
                'menu_item_title_sm_join_requested' => '_bx_spaces_menu_item_title_become_fan_sent',
                'menu_item_title_sm_leave' => '_bx_spaces_menu_item_title_leave_group',
                'menu_item_title_sm_leave_cancel' => '_bx_spaces_menu_item_title_leave_group_cancel_request',
                'txt_all_entries_by_author' => '_bx_spaces_page_title_browse_by_author',
                'txt_invitation_popup_title' => '_bx_spaces_txt_invite_popup_title',
                'txt_invitation_popup_text' => '_bx_spaces_txt_invite_popup_text',
                'txt_invitation_popup_accept_button' => '_bx_spaces_txt_invite_popup_button_accept',
                'txt_invitation_popup_decline_button' => '_bx_spaces_txt_invite_popup_button_decline',
                'txt_invitation_popup_error_invitation_absent' => '_bx_spaces_txt_invite_popup_error_invitation_absent',
                'txt_invitation_popup_error_wrong_user' => '_bx_spaces_txt_invite_popup_error_invitation_wrong_user',
                'txt_n_unit' => '_bx_spaces_txt_n_unit',
                'txt_buy_title' => '_bx_spaces_grid_action_title_buy_title',
                'txt_cart_item_title' => '_bx_spaces_txt_cart_item_title',
                'txt_cart_item_title_lifetime' => '_bx_spaces_txt_cart_item_title_lifetime',
                'txt_subscribe_title' => '_bx_spaces_grid_action_title_subscribe_title',
                'popup_title_price_add' => '_bx_spaces_popup_title_price_add',
                'popup_title_price_edit' => '_bx_spaces_popup_title_price_edit',
                'msg_performed' => '_bx_spaces_msg_performed',
                'err_period_unit' => '_bx_spaces_form_price_input_err_period_unit',
                'err_price_duplicate' => '_bx_spaces_err_price_duplicate',
                'err_cannot_perform' => '_bx_spaces_err_cannot_perform',
            ),
        );

        $this->_aJsClasses = [
            'categories' => 'BxDolCategories',
            'main' => 'BxSpacesMain',
            'manage_tools' => 'BxSpacesManageTools',
            'invite_popup' => 'BxSpacesInvitePopup',
            'prices' => 'BxSpacesPrices'
        ];

        $this->_aJsObjects = [
            'categories' => 'oBxDolCategories',
            'main' => 'oBxSpacesMain',
            'manage_tools' => 'oBxSpacesManageTools',
            'invite_popup' => 'oBxSpacesInvitePopup',
            'prices' => 'oBxSpacesPrices'
        ];

        $this->_aGridObjects = [
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        ];
    }

}

/** @} */
