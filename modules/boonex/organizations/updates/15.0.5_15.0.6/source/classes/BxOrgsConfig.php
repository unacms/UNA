<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Organizations Organizations
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOrgsConfig extends BxBaseModGroupsConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsSubmenu = array_merge($this->_aMenuItems2MethodsSubmenu, array(
            'organization-profile-friends' => 'checkAllowedFriendsView',
            'organization-profile-relations' => 'checkAllowedRelationsView',
            'organization-profile-subscriptions' => 'checkAllowedSubscriptionsView'
        ));

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-organization-profile' => 'checkAllowedView',
            'edit-organization-profile' => 'checkAllowedEdit',
            'organization-manage' => 'checkAllowedEdit',
            'edit-organization-cover' => 'checkAllowedChangeCover',
            'edit-organization-badge' => 'checkAllowedChangeBadge',
            'invite-to-organization' => 'checkAllowedInvite',
            'delete-organization-profile' => 'checkAllowedDelete',
            'profile-friends' => 'checkAllowedFriends',
            'profile-friend-add' => 'checkAllowedFriendAdd',
            'profile-friend-remove' => 'checkAllowedFriendRemove',
            'profile-relations' => 'checkAllowedRelations',
            'profile-relation-add' => 'checkAllowedRelationAdd',
            'profile-relation-remove' => 'checkAllowedRelationRemove',
            'profile-set-acl-level' => 'checkAllowedSetMembership',
            'messenger' => 'checkAllowedCompose',
        ));

        $this->CNF = array_merge($this->CNF, array (

            // module icon
            'ICON' => 'building',

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
            'FIELD_NAME' => 'org_name',
            'FIELD_TITLE' => 'org_name',
            'FIELD_TEXT' => 'org_desc',
            'FIELD_CATEGORY' => 'org_cat',
            'FIELD_PICTURE' => 'picture',
            'FIELD_COVER' => 'cover',
            'FIELD_COVER_POSITION' => 'cover_data',
            'FIELD_BADGE' => 'badge',
            'FIELD_BADGE_LINK' => 'badge_link',
            'FIELD_BADGE_LINK_SELECT' => 'badge_link_select',
            'FIELD_BADGE_LINK_CUSTOM' => 'badge_link_custom',
            'FIELD_JOIN_CONFIRMATION' => 'join_confirmation',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_ALLOW_POST_TO' => 'allow_post_to',
            'FIELD_ALLOW_CONTACT_TO' => 'allow_contact_to',
            'FIELD_VIEWS' => 'views',
            'FIELD_VOTES' => 'votes',
            'FIELD_REACTIONS' => 'rvotes',
            'FIELD_SCORE' => 'score',
            'FIELD_SCORE_UP' => 'sc_up',
            'FIELD_SCORE_DOWN' => 'sc_down',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELDS_QUICK_SEARCH' => array('org_name'),
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELD_MULTICAT' => 'multicat',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

            'FIELD_PRICE_ROLE_ID' => 'role_id',
            'FIELD_PRICE_NAME' => 'name',

            // page URIs
            'URI_VIEW_ENTRY' => 'view-organization-profile',
            'URI_VIEW_FRIENDS' => 'organization-profile-friends',
            'URI_VIEW_FRIEND_REQUESTS' => 'organization-friend-requests',
            'URI_VIEW_RELATIONS' => 'organization-profile-relations',
            'URI_VIEW_FAVORITES' => 'organization-profile-favorites',
            'URI_ADD_ENTRY' => 'create-organization-profile',
            'URI_EDIT_ENTRY' => 'edit-organization-profile',
            'URI_JOIN_ENTRY' => 'join-organization-profile',
            'URI_JOINED_ENTRIES' => 'joined-organizations',
            'URI_MANAGE_COMMON' => 'organizations-manage',
            'URI_VIEW_SUBSCRIPTIONS' => 'organization-profile-subscriptions',
            'URI_FAVORITES_LIST' => 'organizations-favorites',
            
            'URL_HOME' => 'page.php?i=organizations-home',
            'URL_CREATE' => 'page.php?i=create-organization-profile',
            'URL_ENTRY_FANS' => 'page.php?i=organization-profile-fans',
            'URL_ENTRY_MANAGE' => 'page.php?i=organization-manage',
            'URL_MANAGE_COMMON' => 'page.php?i=organizations-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=organizations-administration',

            // some params
            'ALLOW_AS_CONTEXT' => true,

            'PARAM_AUTOAPPROVAL' => 'bx_organizations_autoapproval',
            'PARAM_ENABLE_ACTIVATION_LETTER' => 'bx_organizations_enable_profile_activation_letter',
            'PARAM_DEFAULT_ACL_LEVEL' => 'bx_organizations_default_acl_level',
            'PARAM_NUM_RSS' => 'bx_organizations_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_organizations_num_connections_quick',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_organizations_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_organizations_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_organizations_per_page_browse_recommended',
            'PARAM_MMODE' => 'bx_organizations_members_mode',
            'PARAM_PAID_JOIN_ENABLED' => true,
            'PARAM_RECURRING_RESERVE' => 3, // 3 days for recurring payment to be registered
            'PARAM_FRIENDS' => 'bx_organizations_friends',
            'PARAM_PUBLIC_SBSN' => 'bx_organizations_public_subscriptions',
            'PARAM_PUBLIC_SBSD' => 'bx_organizations_public_subscribed_me',
            'PARAM_SBS_WO_JOIN' => 'bx_organizations_enable_subscribe_wo_join',
            'PARAM_REDIRECT_AADD' => 'bx_organizations_redirect_aadd',
            'PARAM_REDIRECT_AADD_CUSTOM_URL' => 'bx_organizations_redirect_aadd_custom_url',
            
            'PARAM_MULTICAT_ENABLED' => true,
            'PARAM_MULTICAT_AUTO_ACTIVATION_FOR_CATEGORIES' => 'bx_organizations_auto_activation_for_categories',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_organizations_per_page_for_favorites_lists',
            'PARAM_USE_IN' => 'bx_organizations_internal_notifications',

            // objects
            'OBJECT_STORAGE' => 'bx_organizations_pics',
            'OBJECT_STORAGE_COVER' => 'bx_organizations_pics',
            'OBJECT_STORAGE_BADGE' => 'bx_organizations_pics',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_organizations_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_organizations_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_organizations_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_organizations_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_organizations_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_organizations_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_organizations_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_organizations_gallery',
            'OBJECT_IMAGES_TRANSCODER_BADGE' => 'bx_organizations_badge',
            'OBJECT_VIEWS' => 'bx_organizations',
            'OBJECT_VOTES' => 'bx_organizations',
            'OBJECT_REACTIONS' => 'bx_organizations_reactions',
            'OBJECT_SCORES' => 'bx_organizations',
            'OBJECT_FAVORITES' => 'bx_organizations',
            'OBJECT_FEATURED' => 'bx_organizations',
            'OBJECT_COMMENTS' => 'bx_organizations',
            'OBJECT_NOTES' => 'bx_organizations_notes',
            'OBJECT_REPORTS' => 'bx_organizations',
            'OBJECT_METATAGS' => 'bx_organizations',
            'OBJECT_CATEGORY' => 'bx_organizations_cats',
            'OBJECT_FORM_ENTRY' => 'bx_organization',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_organization_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_organization_view_full', // for "info" tab on view profile page
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_organization_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_organization_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_organization_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_BADGE' => 'bx_organization_edit_badge',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_PRIVACY' => 'bx_organization_edit_privacy',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_organization_delete',
            'OBJECT_FORM_ENTRY_DISPLAY_INVITE' => 'bx_organization_invite',
            'OBJECT_FORM_PRICE' => 'bx_organizations_price',
            'OBJECT_FORM_PRICE_DISPLAY_ADD' => 'bx_organizations_price_add',
            'OBJECT_FORM_PRICE_DISPLAY_EDIT' => 'bx_organizations_price_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_organizations_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_organizations_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_organizations_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_organizations_my', // actions menu on profile entries page
            'OBJECT_MENU_SUBMENU' => 'bx_organizations_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_organizations_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'organizations-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_organizations_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_organizations_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_organizations_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_organizations_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_organizations_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_organizations_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_organizations_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_organizations_allow_view_favorite_list',
            'OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT' => 'bx_organizations_allow_view_notification_to',
            'OBJECT_PRIVACY_POST' => 'bx_organizations_allow_post_to',
            'OBJECT_PRIVACY_CONTACT' => 'bx_organizations_allow_contact_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_organizations_administration',
            'OBJECT_GRID_COMMON' => 'bx_organizations_common',
            'OBJECT_GRID_CONNECTIONS' => 'bx_organizations_fans',
            'OBJECT_GRID_INVITES' => 'bx_organizations_invites',
            'OBJECT_GRID_PRICES_MANAGE' => 'bx_organizations_prices_manage',
            'OBJECT_GRID_PRICES_VIEW' => 'bx_organizations_prices_view',
            'OBJECT_CONNECTIONS' => 'bx_organizations_fans',
            'OBJECT_UPLOADERS_COVER' => array('bx_organizations_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_organizations_picture_crop'),
            'OBJECT_UPLOADERS_BADGE' => array('bx_organizations_badge_crop'),
            'OBJECT_PRE_LIST_ROLES' => 'bx_organizations_roles',
            'OBJECT_PRE_LIST_PERIOD_UNITS' => 'bx_organizations_period_units',
            
            'BADGES_AVALIABLE' => true,
            'INVITES_KEYS_LIFETIME' => 86400,

            'EMAIL_FRIEND_REQUEST' => 'bx_organizations_friend_request',
            'EMAIL_INVITATION' => 'bx_organizations_invitation',
            'EMAIL_JOIN_REQUEST' => 'bx_organizations_join_request',
            'EMAIL_JOIN_CONFIRM' => 'bx_organizations_join_confirm',
            'EMAIL_FAN_BECOME_ADMIN' => 'bx_organizations_fan_become_admin',
            'EMAIL_ADMIN_BECOME_FAN' => 'bx_organizations_admin_become_fan',
            'EMAIL_FAN_SET_ROLE' => 'bx_organizations_set_role',
            'EMAIL_FAN_REMOVE' => 'bx_organizations_fan_remove',
            'EMAIL_JOIN_REJECT' => 'bx_organizations_join_reject',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_profile_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_profile_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_profile_view_actions',
            'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_profile_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_organizations_view_submenu' => $this->_aMenuItems2MethodsSubmenu,
                'bx_organizations_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_organizations_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_organizations_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-organizations-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_orgs_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_orgs_txt_account_suspended',
                    ),
                ),
                'status_moderation' => array (
                    'name' => 'bx-organizations-status-not-active-moderation',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_orgs_txt_account_pending_moderation',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_orgs_txt_account_suspended_moderation',
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_orgs_txt_sample_single',
            	'txt_sample_comment_single' => '_bx_orgs_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_orgs_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_orgs_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_orgs_txt_sample_score_down_single',
            	'txt_sample_pp_single' => '_bx_orgs_txt_sample_pp_single',
            	'txt_sample_pp_single_with_article' => '_bx_orgs_txt_sample_pp_single_with_article',
                'txt_sample_pc_single' => '_bx_orgs_txt_sample_pc_single',
            	'txt_sample_pc_single_with_article' => '_bx_orgs_txt_sample_pc_single_with_article',
            	'txt_sample_pi_action' => '_bx_orgs_txt_sample_pi_action',
            	'txt_sample_pi_action_user' => '_bx_orgs_txt_sample_pi_action_user',
            	'txt_private_group' => '_bx_orgs_txt_private_organization',
                'txt_group_participants' => '_bx_orgs_ps_group_title_participants',
                'txt_N_fans' => '_bx_orgs_txt_N_friends',
                'txt_ntfs_join_invitation' => '_bx_orgs_txt_ntfs_join_invitation',
            	'txt_ntfs_join_request' => '_bx_orgs_txt_ntfs_join_request',
                'txt_ntfs_join_request_for_owner' => '_bx_orgs_txt_ntfs_join_request_for_owner',
                'txt_ntfs_accept_request' => '_bx_orgs_txt_ntfs_accept_request',
                'txt_ntfs_accept_request_for_owner' => '_bx_orgs_txt_ntfs_accept_request_for_owner',
                'txt_ntfs_fan_added' => '_bx_orgs_txt_ntfs_fan_added',
            	'txt_ntfs_timeline_post_common' => '_bx_orgs_txt_ntfs_timeline_post_common',
                'option_members_mode_multi_roles' => '_bx_orgs_option_members_mode_multi_roles',
            	'txt_all_entries_by_author' => '_bx_orgs_page_title_browse_by_author',
            	'form_field_picture' => '_bx_orgs_form_profile_input_picture_search',
                'form_field_online' => '_bx_orgs_form_profile_input_online_search',
                'menu_item_title_pay_and_join' => '_bx_orgs_menu_item_title_pay_and_join',
                'menu_item_title_befriend_sent' => '_bx_orgs_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_orgs_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_orgs_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_orgs_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_orgs_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_orgs_menu_item_title_unfriend',
                'menu_item_title_sm_fans' => '_bx_orgs_menu_item_title_fans',
                'menu_item_title_sm_join' => '_bx_orgs_menu_item_title_become_fan',
                'menu_item_title_sm_join_requested' => '_bx_orgs_menu_item_title_become_fan_sent',
                'menu_item_title_sm_leave' => '_bx_orgs_menu_item_title_leave_organization',
                'menu_item_title_sm_leave_cancel' => '_bx_orgs_menu_item_title_leave_organization_cancel_request',
            	'menu_item_manage_my' => '_bx_orgs_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_orgs_menu_item_title_manage_all',
            	'grid_action_err_delete' => '_bx_orgs_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_orgs_grid_txt_account_manager',
                'filter_item_active' => '_bx_orgs_grid_filter_item_title_adm_active',
            	'filter_item_pending' => '_bx_orgs_grid_filter_item_title_adm_pending',
            	'filter_item_suspended' => '_bx_orgs_grid_filter_item_title_adm_suspended',
                'filter_item_unconfirmed' => '_bx_orgs_grid_filter_item_title_adm_unconfirmed',
            	'filter_item_select_one_filter1' => '_bx_orgs_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_orgs_grid_filter_item_title_adm_select_one_filter2',
            	'txt_browse_favorites' => '_bx_orgs_page_title_browse_favorites',
            	'option_redirect_aadd_profile' => '_bx_orgs_option_redirect_aadd_profile',
            	'option_redirect_aadd_last' => '_bx_orgs_option_redirect_aadd_last',
            	'option_redirect_aadd_custom' => '_bx_orgs_option_redirect_aadd_custom',
                'option_redirect_aadd_homepage' => '_bx_orgs_option_redirect_aadd_homepage',
                'option_activation_on' => '_bx_orgs_option_activation_on',
            	'option_activation_off' => '_bx_orgs_option_activation_off',
            	'option_activation_add' => '_bx_orgs_option_activation_add',
                'option_activation_edit' => '_bx_orgs_option_activation_edit',
                'txt_invitation_popup_title' => '_bx_orgs_txt_invite_popup_title',
                'txt_invitation_popup_text' => '_bx_orgs_txt_invite_popup_text',
                'txt_invitation_popup_accept_button' => '_bx_orgs_txt_invite_popup_button_accept',
                'txt_invitation_popup_decline_button' => '_bx_orgs_txt_invite_popup_button_decline',
                'txt_invitation_popup_error_invitation_absent' => '_bx_orgs_txt_invite_popup_error_invitation_absent',
                'txt_invitation_popup_error_wrong_user' => '_bx_orgs_txt_invite_popup_error_invitation_wrong_user',
                'txt_n_unit' => '_bx_orgs_txt_n_unit',
                'txt_buy_title' => '_bx_orgs_grid_action_title_buy_title',
                'txt_cart_item_title' => '_bx_orgs_txt_cart_item_title',
                'txt_cart_item_title_lifetime' => '_bx_orgs_txt_cart_item_title_lifetime',
                'txt_subscribe_title' => '_bx_orgs_grid_action_title_subscribe_title',
                'popup_title_price_add' => '_bx_orgs_popup_title_price_add',
                'popup_title_price_edit' => '_bx_orgs_popup_title_price_edit',
                'msg_performed' => '_bx_orgs_msg_performed',
                'err_period_unit' => '_bx_orgs_form_price_input_err_period_unit',
                'err_price_duplicate' => '_bx_orgs_err_price_duplicate',
                'err_cannot_perform' => '_bx_orgs_err_cannot_perform',
            ),
        ));

        $this->_aJsClasses = array(
            'main' => 'BxOrgsMain',
            'manage_tools' => 'BxOrgsManageTools',
            'categories' => 'BxDolCategories',
            'invite_popup' => 'BxOrgsInvitePopup',
            'prices' => 'BxOrgsPrices'
        );

        $this->_aJsObjects = array(
            'main' => 'oBxOrgsMain',
            'manage_tools' => 'oBxOrgsManageTools',
            'categories' => 'oBxDolCategories',
            'invite_popup' => 'oBxOrgsInvitePopup',
            'prices' => 'oBxOrgsPrices'
        );

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        );
    }

    protected function _initUseCoverAsThumb()
    {
        return false;
    }
}

/** @} */
