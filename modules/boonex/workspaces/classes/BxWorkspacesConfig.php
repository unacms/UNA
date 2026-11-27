<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWorkspacesConfig extends BxBaseModProfileConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsSubmenu = array_merge($this->_aMenuItems2MethodsSubmenu, array(
            'workspaces-profile-friends' => 'checkAllowedFriendsView',
            'workspaces-profile-relations' => 'checkAllowedRelationsView',
            'workspaces-profile-subscriptions' => 'checkAllowedSubscriptionsView'
        ));

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-workspaces-profile' => 'checkAllowedView',
            'edit-workspaces-profile' => 'checkAllowedEdit',
            'edit-workspaces-cover' => 'checkAllowedChangeCover',
            'delete-workspaces-profile' => 'checkAllowedDelete',
        ));

        $this->CNF = array (

            // module icon
            'ICON' => 'user',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'data',
            'TABLE_ENTRIES_FULLTEXT' => 'search_fields',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_NAME' => '',
            'FIELD_TITLE' => '',
            'FIELD_TEXT' => '',
            'FIELD_PICTURE' => '',
            'FIELD_COVER' => '',
            //'FIELD_COVER_POSITION' => '',
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
            'FIELDS_QUICK_SEARCH' => array(),
            'FIELD_LOCATION' => '',
            'FIELD_LOCATION_PREFIX' => '',
            'FIELD_LABELS' => 'labels',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

            // page URIs
            'URI_VIEW_ENTRY' => 'view-workspaces-profile',
            'URI_VIEW_FRIENDS' => 'workspaces-profile-friends',
            'URI_VIEW_FRIEND_REQUESTS' => 'workspaces-friend-requests',
            'URI_VIEW_FAVORITES' => 'workspaces-profile-favorites',
            'URI_ADD_ENTRY' => 'create-workspaces-profile',
            'URI_EDIT_ENTRY' => 'edit-workspaces-profile',
            'URI_MANAGE_COMMON' => 'workspaces-manage',
            'URI_VIEW_SUBSCRIPTIONS' => 'workspaces-profile-subscriptions',

            'URL_HOME' => 'page.php?i=workspaces-home',
            'URL_CREATE' => 'page.php?i=create-workspaces-profile',
            'URL_MANAGE_COMMON' => 'page.php?i=workspaces-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=workspaces-administration',

            // some params
            'ALLOW_AS_CONTEXT' => defined('BX_WORKSPACES_AS_CONTEXT'),

            'PARAM_AUTOAPPROVAL' => 'bx_workspaces_autoapproval',
            'PARAM_ENABLE_ACTIVATION_LETTER' => 'bx_workspaces_enable_profile_activation_letter',
            'PARAM_DEFAULT_ACL_LEVEL' => 'bx_workspaces_default_acl_level',
            'PARAM_NUM_RSS' => 'bx_workspaces_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_workspaces_num_connections_quick',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_workspaces_searchable_fields',
            'PARAM_FRIENDS' => 'bx_workspaces_friends',
            'PARAM_PUBLIC_SBSN' => 'bx_workspaces_public_subscriptions',
            'PARAM_PUBLIC_SBSD' => 'bx_workspaces_public_subscribed_me',
            'PARAM_REDIRECT_AADD' => 'bx_workspaces_redirect_aadd',
            'PARAM_REDIRECT_AADD_CUSTOM_URL' => 'bx_workspaces_redirect_aadd_custom_url',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_workspaces_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_workspaces_per_page_browse_recommended',

            // objects
            'OBJECT_STORAGE' => '',
            'OBJECT_STORAGE_COVER' => '',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => '',
            'OBJECT_IMAGES_TRANSCODER_ICON' => '',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => '',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => '',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => '',
            'OBJECT_IMAGES_TRANSCODER_COVER' => '',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => '',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => '',
            'OBJECT_VIEWS' => 'bx_workspaces',
            'OBJECT_VOTES' => 'bx_workspaces',
            'OBJECT_REACTIONS' => 'bx_workspaces_reactions',
            'OBJECT_SCORES' => 'bx_workspaces',
            'OBJECT_FAVORITES' => 'bx_workspaces',
            'OBJECT_FEATURED' => 'bx_workspaces',
            'OBJECT_COMMENTS' => 'bx_workspaces',
            'OBJECT_NOTES' => 'bx_workspaces_notes',
            'OBJECT_REPORTS' => 'bx_workspaces',
            'OBJECT_METATAGS' => '',
            'OBJECT_FORM_ENTRY' => 'bx_workspace',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_workspace_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_workspace_view_full', // for "info" tab on view profile page 
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_workspace_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_workspace_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => '',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_workspace_delete',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_workspaces_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_workspaces_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_workspaces_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_SUBMENU' => 'bx_workspaces_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_workspaces_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'workspaces-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_workspaces_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_workspaces_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_workspaces_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_workspaces_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_workspaces_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_workspaces_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_workspaces_allow_view_to',
            'OBJECT_PRIVACY_POST' => 'bx_workspaces_allow_post_to',
            'OBJECT_PRIVACY_CONTACT' => 'bx_workspaces_allow_contact_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_workspaces_administration',
            'OBJECT_GRID_COMMON' => 'bx_workspaces_common',
            'OBJECT_UPLOADERS_COVER' => array(''),
            'OBJECT_UPLOADERS_PICTURE' => array(''),
            
            'BADGES_AVALIABLE' => true,

            'EMAIL_FRIEND_REQUEST' => 'bx_workspaces_friend_request',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_profile_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_profile_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_profile_view_actions',
        	'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_profile_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_workspaces_view_submenu' => $this->_aMenuItems2MethodsSubmenu,
                'bx_workspaces_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_workspaces_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_workspaces_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-workspaces-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_workspaces_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_workspaces_txt_account_suspended',
                    ),
                ),
                'status_moderation' => array (
                    'name' => 'bx-workspaces-status-not-active-moderation',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_workspaces_txt_account_pending_moderation',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_workspaces_txt_account_suspended_moderation',
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_workspaces_txt_sample_single',
            	'txt_sample_comment_single' => '_bx_workspaces_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_workspaces_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_workspaces_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_workspaces_txt_sample_score_down_single',
            	'txt_sample_pp_single' => '_bx_workspaces_txt_sample_pp_single',
            	'txt_sample_pp_single_with_article' => '_bx_workspaces_txt_sample_pp_single_with_article',
                'txt_sample_pc_single' => '_bx_workspaces_txt_sample_pc_single',
            	'txt_sample_pc_single_with_article' => '_bx_workspaces_txt_sample_pc_single_with_article',
            	'txt_sample_pi_action' => '_bx_workspaces_txt_sample_pi_action',
            	'txt_sample_pi_action_user' => '_bx_workspaces_txt_sample_pi_action_user',
                'txt_N_fans' => '_bx_workspaces_txt_N_friends',
            	'txt_ntfs_timeline_post_common' => '_bx_workspaces_txt_ntfs_timeline_post_common',
            	'form_field_picture' => '_bx_workspaces_form_profile_input_picture_search',
                'form_field_online' => '_bx_workspaces_form_profile_input_online_search',
                'menu_item_title_befriend_sent' => '_bx_workspaces_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_workspaces_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_workspaces_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_workspaces_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_workspaces_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_workspaces_menu_item_title_unfriend',
            	'grid_action_err_delete' => '_bx_workspaces_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_workspaces_grid_txt_account_manager',
            	'filter_item_active' => '_bx_workspaces_grid_filter_item_title_adm_active',
            	'filter_item_pending' => '_bx_workspaces_grid_filter_item_title_adm_pending',
            	'filter_item_suspended' => '_bx_workspaces_grid_filter_item_title_adm_suspended',
                'filter_item_unconfirmed' => '_bx_workspaces_grid_filter_item_title_adm_unconfirmed',
            	'filter_item_select_one_filter1' => '_bx_workspaces_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_workspaces_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_workspaces_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_workspaces_menu_item_title_manage_all',
            	'txt_browse_favorites' => '_bx_workspaces_page_title_browse_favorites',
                'option_redirect_aadd_profile' => '_bx_workspaces_option_redirect_aadd_profile',
            	'option_redirect_aadd_last' => '_bx_workspaces_option_redirect_aadd_last',
            	'option_redirect_aadd_custom' => '_bx_workspaces_option_redirect_aadd_custom',
                'option_redirect_aadd_homepage' => '_bx_workspaces_option_redirect_aadd_homepage',
                'option_activation_on' => '_bx_workspaces_option_activation_on',
            	'option_activation_off' => '_bx_workspaces_option_activation_off',
            	'option_activation_add' => '_bx_workspaces_option_activation_add',
                'option_activation_edit' => '_bx_workspaces_option_activation_edit'
            ),

        );

        $this->_aJsClasses = array(
        	'manage_tools' => 'BxWorkspacesManageTools'
        );

        $this->_aJsObjects = array(
        	'manage_tools' => 'oBxWorkspacesManageTools'
        );

        $this->_aGridObjects = array(
        	'common' => $this->CNF['OBJECT_GRID_COMMON'],
        	'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        	
        );
    }
}

/** @} */
