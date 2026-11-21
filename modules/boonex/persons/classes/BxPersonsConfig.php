<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Persons Persons
 * @ingroup     UnaModules
 *
 * @{
 */

class BxPersonsConfig extends BxBaseModProfileConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsSubmenu = array_merge($this->_aMenuItems2MethodsSubmenu, array(
            'persons-profile-friends' => 'checkAllowedFriendsView',
            'persons-profile-relations' => 'checkAllowedRelationsView',
            'persons-profile-subscriptions' => 'checkAllowedSubscriptionsView'
        ));

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-persons-profile' => 'checkAllowedView',
            'edit-persons-profile' => 'checkAllowedEdit',
            'edit-persons-cover' => 'checkAllowedChangeCover',
            'edit-persons-badge' => 'checkAllowedChangeBadge',
            'delete-persons-profile' => 'checkAllowedDelete',
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
            'FIELD_NAME' => 'fullname',
            'FIELD_LAST_NAME' => 'last_name',
            'FIELD_TITLE' => 'fullname',
            'FIELD_TEXT' => 'description',
            'FIELD_PICTURE' => 'picture',
            'FIELD_COVER' => 'cover',
            'FIELD_COVER_POSITION' => 'cover_data',
            'FIELD_BADGE' => 'badge',
            'FIELD_BADGE_LINK' => 'badge_link',
            'FIELD_BADGE_LINK_SELECT' => 'badge_link_select',
            'FIELD_BADGE_LINK_CUSTOM' => 'badge_link_custom',
            'FIELD_BIRTHDAY' => 'birthday',
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
            'FIELDS_QUICK_SEARCH' => array('fullname', 'last_name'),
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

            // page URIs
            'URI_VIEW_ENTRY' => 'view-persons-profile',
            'URI_VIEW_FRIENDS' => 'persons-profile-friends',
            'URI_VIEW_FRIEND_REQUESTS' => 'persons-friend-requests',
            'URI_VIEW_RELATIONS' => 'persons-profile-relations',
            'URI_VIEW_FAVORITES' => 'persons-profile-favorites',
            'URI_ADD_ENTRY' => 'create-persons-profile',
            'URI_EDIT_ENTRY' => 'edit-persons-profile',
            'URI_MANAGE_COMMON' => 'persons-manage',
            'URI_VIEW_SUBSCRIPTIONS' => 'persons-profile-subscriptions',

            'URL_HOME' => 'page.php?i=persons-home',
            'URL_CREATE' => 'page.php?i=create-persons-profile',
            'URL_MANAGE_COMMON' => 'page.php?i=persons-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=persons-administration',

            // some params
            'ALLOW_AS_CONTEXT' => defined('BX_PERSONS_AS_CONTEXT'),

            'PARAM_AUTOAPPROVAL' => 'bx_persons_autoapproval',
            'PARAM_ENABLE_ACTIVATION_LETTER' => 'bx_persons_enable_profile_activation_letter',
            'PARAM_DEFAULT_ACL_LEVEL' => 'bx_persons_default_acl_level',
            'PARAM_NUM_RSS' => 'bx_persons_num_rss',
            'PARAM_NUM_CONNECTIONS_QUICK' => 'bx_persons_num_connections_quick',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_persons_searchable_fields',
            'PARAM_FRIENDS' => 'bx_persons_friends',
            'PARAM_PUBLIC_SBSN' => 'bx_persons_public_subscriptions',
            'PARAM_PUBLIC_SBSD' => 'bx_persons_public_subscribed_me',
            'PARAM_REDIRECT_AADD' => 'bx_persons_redirect_aadd',
            'PARAM_REDIRECT_AADD_CUSTOM_URL' => 'bx_persons_redirect_aadd_custom_url',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_persons_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_persons_per_page_browse_recommended',

            // objects
            'OBJECT_STORAGE' => 'bx_persons_pictures',
            'OBJECT_STORAGE_COVER' => 'bx_persons_pictures',
            'OBJECT_STORAGE_BADGE' => 'bx_persons_pictures',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_persons_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_persons_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_persons_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_persons_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_persons_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_persons_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_persons_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_persons_gallery',
            'OBJECT_IMAGES_TRANSCODER_BADGE' => 'bx_persons_badge',
            'OBJECT_VIEWS' => 'bx_persons',
            'OBJECT_VOTES' => 'bx_persons',
            'OBJECT_REACTIONS' => 'bx_persons_reactions',
            'OBJECT_SCORES' => 'bx_persons',
            'OBJECT_FAVORITES' => 'bx_persons',
            'OBJECT_FEATURED' => 'bx_persons',
            'OBJECT_COMMENTS' => 'bx_persons',
            'OBJECT_NOTES' => 'bx_persons_notes',
            'OBJECT_REPORTS' => 'bx_persons',
            'OBJECT_METATAGS' => 'bx_persons',
            'OBJECT_FORM_ENTRY' => 'bx_person',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_person_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_person_view_full', // for "info" tab on view profile page 
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_person_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_person_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_person_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_BADGE' => 'bx_person_edit_badge',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_PRIVACY' => 'bx_person_edit_privacy',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_person_delete',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_persons_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_persons_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_persons_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_SUBMENU' => 'bx_persons_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_persons_view_submenu',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'persons-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_persons_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_persons_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_persons_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_persons_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_persons_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_persons_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_persons_allow_view_to',
            'OBJECT_PRIVACY_POST' => 'bx_persons_allow_post_to',
            'OBJECT_PRIVACY_CONTACT' => 'bx_persons_allow_contact_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_persons_administration',
            'OBJECT_GRID_COMMON' => 'bx_persons_common',
            'OBJECT_UPLOADERS_COVER' => array('bx_persons_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_persons_picture_crop'),
            'OBJECT_UPLOADERS_BADGE' => array('bx_persons_badge_crop'),
            
            'BADGES_AVALIABLE' => true,

            'EMAIL_FRIEND_REQUEST' => 'bx_persons_friend_request',

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_profile_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_profile_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_profile_view_actions',
        	'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_profile_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_persons_view_submenu' => $this->_aMenuItems2MethodsSubmenu,
                'bx_persons_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_persons_view_actions_more' => $this->_aMenuItems2MethodsActions,
                'bx_persons_view_actions_all' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-persons-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_persons_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_persons_txt_account_suspended',
                    ),
                ),
                'status_moderation' => array (
                    'name' => 'bx-persons-status-not-active-moderation',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_persons_txt_account_pending_moderation',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_persons_txt_account_suspended_moderation',
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_persons_txt_sample_single',
            	'txt_sample_comment_single' => '_bx_persons_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_persons_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_persons_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_persons_txt_sample_score_down_single',
            	'txt_sample_pp_single' => '_bx_persons_txt_sample_pp_single',
            	'txt_sample_pp_single_with_article' => '_bx_persons_txt_sample_pp_single_with_article',
                'txt_sample_pc_single' => '_bx_persons_txt_sample_pc_single',
            	'txt_sample_pc_single_with_article' => '_bx_persons_txt_sample_pc_single_with_article',
            	'txt_sample_pi_action' => '_bx_persons_txt_sample_pi_action',
            	'txt_sample_pi_action_user' => '_bx_persons_txt_sample_pi_action_user',
                'txt_N_fans' => '_bx_persons_txt_N_friends',
            	'txt_ntfs_timeline_post_common' => '_bx_persons_txt_ntfs_timeline_post_common',
            	'form_field_picture' => '_bx_persons_form_profile_input_picture_search',
                'form_field_online' => '_bx_persons_form_profile_input_online_search',
                'menu_item_title_befriend_sent' => '_bx_persons_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_persons_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_persons_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_persons_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_persons_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_persons_menu_item_title_unfriend',
            	'grid_action_err_delete' => '_bx_persons_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_persons_grid_txt_account_manager',
            	'filter_item_active' => '_bx_persons_grid_filter_item_title_adm_active',
            	'filter_item_pending' => '_bx_persons_grid_filter_item_title_adm_pending',
            	'filter_item_suspended' => '_bx_persons_grid_filter_item_title_adm_suspended',
                'filter_item_unconfirmed' => '_bx_persons_grid_filter_item_title_adm_unconfirmed',
            	'filter_item_select_one_filter1' => '_bx_persons_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_persons_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_persons_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_persons_menu_item_title_manage_all',
            	'txt_browse_favorites' => '_bx_persons_page_title_browse_favorites',
                'option_redirect_aadd_profile' => '_bx_persons_option_redirect_aadd_profile',
            	'option_redirect_aadd_last' => '_bx_persons_option_redirect_aadd_last',
            	'option_redirect_aadd_custom' => '_bx_persons_option_redirect_aadd_custom',
                'option_redirect_aadd_homepage' => '_bx_persons_option_redirect_aadd_homepage',
                'option_activation_on' => '_bx_persons_option_activation_on',
            	'option_activation_off' => '_bx_persons_option_activation_off',
            	'option_activation_add' => '_bx_persons_option_activation_add',
                'option_activation_edit' => '_bx_persons_option_activation_edit'
            ),

        );

        $this->_aJsClasses = array(
        	'manage_tools' => 'BxPersonsManageTools'
        );

        $this->_aJsObjects = array(
        	'manage_tools' => 'oBxPersonsManageTools'
        );

        $this->_aGridObjects = array(
        	'common' => $this->CNF['OBJECT_GRID_COMMON'],
        	'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        	
        );
    }
}

/** @} */
