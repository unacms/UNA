<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    Channels Channels
 * @indroup     UnaModules
 *
 * @{
 */

class BxCnlConfig extends BxBaseModGroupsConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_aMenuItems2MethodsActions = array_merge($this->_aMenuItems2MethodsActions, array(
            'view-channel-profile' => 'checkAllowedView',
            'edit-channel-profile' => 'checkAllowedEdit',
            'edit-channel-cover' => 'checkAllowedChangeCover',
            'invite-to-channel' => 'checkAllowedInvite',
            'delete-channel-profile' => 'checkAllowedDelete',
        ));

        $this->CNF = array (

            // module icon
            'ICON' => 'hashtag',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'data',
            'TABLE_ENTRIES_FULLTEXT' => 'search_fields',
            'TABLE_CONTENT' => $aModule['db_prefix'] . 'content',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_NAME' => 'channel_name',
            'FIELD_TITLE' => 'channel_name',
            'FIELD_PICTURE' => 'picture',
            'FIELD_COVER' => 'cover',
            'FIELD_COVER_POSITION' => 'cover_data',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
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
            'FIELDS_QUICK_SEARCH' => array('channel_name'),
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

            // page URIs
            'URI_VIEW_ENTRY' => 'view-channel-profile',
            'URI_ADD_ENTRY' => 'create-channel-profile',
            'URI_EDIT_ENTRY' => 'edit-channel-profile',
            'URI_JOINED_ENTRIES' => 'channels-author',

            'URL_HOME' => 'page.php?i=channels-home',
            'URL_MANAGE_COMMON' => 'page.php?i=channels-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=channels-administration',

            // some params
            'PARAM_USE_COVER_AS_THUMB' => 'bx_channels_use_cover_as_thumb',
            'PARAM_DEFAULT_AUTHOR' => 'bx_channels_default_author',
            'PARAM_NUM_RSS' => 'bx_channels_num_rss',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_channels_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_channels_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE_RECOMMENDED' => 'bx_channels_per_page_browse_recommended',
            'PARAM_BROWSE_ACTIVE_N_POSTS' => 'bx_channels_browse_active_n_posts',
            'PARAM_BROWSE_ACTIVE_X_HOURS' => 'bx_channels_browse_active_x_hours',
            'PARAM_BROWSE_TRENDING_X_HOURS' => 'bx_channels_browse_trending_x_hours',

            // objects
            'OBJECT_STORAGE' => 'bx_channels_pics',
            'OBJECT_STORAGE_COVER' => 'bx_channels_pics',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_channels_thumb',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_channels_icon',
            'OBJECT_IMAGES_TRANSCODER_AVATAR' => 'bx_channels_avatar',
            'OBJECT_IMAGES_TRANSCODER_AVATAR_BIG' => 'bx_channels_avatar_big',
            'OBJECT_IMAGES_TRANSCODER_PICTURE' => 'bx_channels_picture',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_channels_cover',
            'OBJECT_IMAGES_TRANSCODER_COVER_THUMB' => 'bx_channels_cover_thumb',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_channels_gallery',
            'OBJECT_VIEWS' => 'bx_channels',
            'OBJECT_VOTES' => 'bx_channels',
            'OBJECT_REACTIONS' => 'bx_channels_reactions',
            'OBJECT_SCORES' => 'bx_channels',
            'OBJECT_FAVORITES' => 'bx_channels',
            'OBJECT_FEATURED' => 'bx_channels',
            'OBJECT_COMMENTS' => 'bx_channels',
            'OBJECT_REPORTS' => 'bx_channels',
            'OBJECT_METATAGS' => 'bx_channels',
            'OBJECT_NOTES' => 'bx_cnl_notes',
            'OBJECT_FORM_ENTRY' => 'bx_channel',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_channel_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_channel_view_full', // for "info" tab on view channel page
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_channel_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_channel_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_COVER' => 'bx_channel_edit_cover',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_channel_delete',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_channels_view_actions', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_channels_view_actions_more', // actions menu on view entry page for "more" popup
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_channels_view_actions_all', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_channels_my', // actions menu on profile entries page
            'OBJECT_MENU_SUBMENU' => 'bx_channels_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => '',  // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'channels-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_MANAGE_VIEW_ENTRY' => '',
            'OBJECT_MENU_VIEW_ENTRY_META' => 'bx_channels_view_meta', // meta menu on view entry page
            'OBJECT_MENU_SNIPPET_META' => 'bx_channels_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_channels_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_PAGE_VIEW_ENTRY' => 'bx_channels_view_profile',
            'OBJECT_PAGE_VIEW_ENTRY_CLOSED' => 'bx_channels_view_profile_closed',
            'OBJECT_PAGE_JOINED_ENTRY' => 'bx_channels_join_profile',
            'OBJECT_PRIVACY_VIEW' => 'bx_channels_allow_view_to',
            'OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT' => 'bx_channels_allow_view_notification_to',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_channels_administration',
            'OBJECT_UPLOADERS_COVER' => array('bx_channels_cover_crop'),
            'OBJECT_UPLOADERS_PICTURE' => array('bx_channels_picture_crop'),
      

            'TRIGGER_MENU_PROFILE_VIEW_SUBMENU' => 'trigger_group_view_submenu',
            'TRIGGER_MENU_PROFILE_SNIPPET_META' => 'trigger_group_snippet_meta',
            'TRIGGER_MENU_PROFILE_VIEW_ACTIONS' => 'trigger_group_view_actions',
            'TRIGGER_PAGE_VIEW_ENTRY' => 'trigger_page_group_view_entry',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_channels_view_actions' => $this->_aMenuItems2MethodsActions,
                'bx_channels_view_actions_more' => $this->_aMenuItems2MethodsActions,
            ),

            // informer messages
            'INFORMERS' => array (
                'status' => array (
                    'name' => 'bx-channels-status-not-active',
                    'map' => array (
                        BX_PROFILE_STATUS_PENDING => '_bx_channels_txt_account_pending',
                        BX_PROFILE_STATUS_SUSPENDED => '_bx_channels_txt_account_suspended',
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_unit_view' => '_bx_channels_txt_unit_view',
                'txt_sample_single' => '_bx_channels_txt_sample_single',
                'txt_sample_single_with_article' => '_bx_channels_txt_sample_single_with_article',
                'txt_sample_comment_single' => '_bx_channels_txt_sample_comment_single',
                'txt_sample_vote_single' => '_bx_channels_txt_sample_vote_single',
                'txt_sample_score_up_single' => '_bx_channels_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_channels_txt_sample_score_down_single',
                'txt_private_group' => '_bx_channels_txt_private_channel',
                'txt_ntfs_timeline_post_common' => '_bx_channels_txt_ntfs_timeline_post_common',
                'form_field_author' => '_bx_channels_form_entry_input_author',
                'menu_item_title_befriend_sent' => '_bx_channels_menu_item_title_befriend_sent',
                'menu_item_title_unfriend_cancel_request' => '_bx_channels_menu_item_title_unfriend_cancel_request',
                'menu_item_title_befriend_confirm' => '_bx_channels_menu_item_title_befriend_confirm',
                'menu_item_title_unfriend_reject_request' => '_bx_channels_menu_item_title_unfriend_reject_request',
                'menu_item_title_befriend' => '_bx_channels_menu_item_title_befriend',
                'menu_item_title_unfriend' => '_bx_channels_menu_item_title_unfriend',
                'grid_action_err_delete' => '_bx_channels_grid_action_err_delete',
                'grid_txt_account_manager' => '_bx_channels_grid_txt_account_manager',
                'filter_item_active' => '_bx_channels_grid_filter_item_title_adm_active',
                'filter_item_hidden' => '_bx_channels_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_channels_grid_filter_item_title_adm_pending',
                'filter_item_suspended' => '_bx_channels_grid_filter_item_title_adm_suspended',
                'filter_item_select_one_filter1' => '_bx_channels_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_channels_grid_filter_item_title_adm_select_one_filter2',
                'menu_item_manage_my' => '_bx_channels_menu_item_title_manage_my',
                'menu_item_manage_all' => '_bx_channels_menu_item_title_manage_all',
                'txt_all_entries_by_author' => '_bx_channels_page_title_browse_by_author'
            ),

        );

        $this->_aJsClasses = array(
            'manage_tools' => 'BxCnlManageTools'
        );

        $this->_aJsObjects = array(
            'manage_tools' => 'oBxCnlManageTools'
        );

        $this->_aGridObjects = array(
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION']
        );
    }

    public function isFans()
    {
        return false;
    }
}

/** @} */
