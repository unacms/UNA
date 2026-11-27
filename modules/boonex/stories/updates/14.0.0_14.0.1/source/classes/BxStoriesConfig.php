<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

class BxStoriesConfig extends BxBaseModTextConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',
            'add-media-to-story' => 'checkAllowedEdit',
            'edit-story' => 'checkAllowedEdit',
            'edit-image' => 'checkAllowedEdit',
            'move-image' => 'checkAllowedEdit',
            'delete-story' => 'checkAllowedDelete',
            'delete-image' => 'checkAllowedDelete',
        );

        $this->CNF = array (

            // module icon
            'ICON' => 'far image',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'entries',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',
            'TABLE_ENTRIES_MEDIA' => $aModule['db_prefix'] . 'entries_media',
            'TABLE_FILES' => $aModule['db_prefix'] . 'files',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_EXPIRED' => 'expired',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'story-desc',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_THUMB' => 'thumb',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LABELS' => 'labels',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELDS_DELAYED_PROCESSING' => 'pictures', // can be array of fields or comma separated string of field names

            'FIELD_MEDIA_CONTENT_ID' => 'content_id',
            
            // page URIs
            'URI_VIEW_ENTRY' => 'view-story',
            'URI_AUTHOR_ENTRIES' => 'stories-author',
            'URI_ENTRIES_BY_CONTEXT' => 'stories-context',
            'URI_ADD_ENTRY' => 'create-story',
            'URI_EDIT_ENTRY' => 'edit-story',
            'URI_MANAGE_COMMON' => 'stories-manage',

            'URL_HOME' => 'page.php?i=stories-home',
            'URL_POPULAR' => 'page.php?i=stories-popular',
            'URL_TOP' => 'page.php?i=stories-top',
            'URL_UPDATED' => 'page.php?i=stories-home',
            'URL_MANAGE_COMMON' => 'page.php?i=stories-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=stories-administration',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_stories_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_stories_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_stories_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_stories_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_stories_searchable_fields',
            'PARAM_CARD_MEDIA_NUM' => 'bx_stories_card_media_num',
            'PARAM_EXPIRATION_PERIOD' => 'bx_stories_expiration_period',
            'PARAM_DURATION' => 'bx_stories_duration',
            'PARAM_ORDER_BY_GHOSTS' => true,

            // objects
            'OBJECT_STORAGE' => 'bx_stories_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_stories_proxy_preview',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => '',
            'OBJECT_IMAGES_TRANSCODER_BIG' => 'bx_stories_big',
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                'poster' => 'bx_stories_video_poster_big', 
                'poster_preview' => 'bx_stories_video_poster_preview', 
                'mp4' => 'bx_stories_video_mp4', 
                'mp4_hd' => 'bx_stories_video_mp4_hd'
            ),
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_TRANSCODER_BROWSE' => 'bx_stories_proxy_browse',
            'OBJECT_TRANSCODER_COVER' => 'bx_stories_proxy_cover',
            'OBJECT_REPORTS' => 'bx_stories',
            'OBJECT_REPORTS_MEDIA' => 'bx_stories_media',
            'OBJECT_VIEWS' => 'bx_stories',
            'OBJECT_VIEWS_MEDIA' => 'bx_stories_media',
            'OBJECT_VOTES' => 'bx_stories',
            'OBJECT_VOTES_MEDIA' => 'bx_stories_media',
            'OBJECT_REACTIONS' => 'bx_stories_reactions',
            'OBJECT_SCORES' => 'bx_stories',
            'OBJECT_SCORES_MEDIA' => 'bx_stories_media',
            'OBJECT_FAVORITES' => 'bx_stories',
            'OBJECT_FAVORITES_MEDIA' => 'bx_stories_media',
            'OBJECT_FEATURED' => 'bx_stories',
            'OBJECT_FEATURED_MEDIA' => 'bx_stories_media',
            'OBJECT_METATAGS' => 'bx_stories',
            'OBJECT_COMMENTS' => 'bx_stories',
            'OBJECT_NOTES' => 'bx_stories_notes',
            'OBJECT_COMMENTS_MEDIA' => 'bx_stories_media',
            'OBJECT_PRIVACY_VIEW' => 'bx_stories_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_stories_allow_view_favorite_list',
            'OBJECT_FORM_ENTRY' => 'bx_stories',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_stories_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_stories_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_stories_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_stories_entry_delete',
            'OBJECT_FORM_MEDIA' => 'bx_stories_media',
            'OBJECT_FORM_MEDIA_DISPLAY_EDIT' => 'bx_stories_media_edit',
            'OBJECT_FORM_MEDIA_DISPLAY_MOVE' => 'bx_stories_media_move',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_stories_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_stories_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_MEDIA' => 'bx_stories_view_actions_media', // actions menu on view media page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_stories_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU' => 'bx_stories_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_stories_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'stories-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_stories_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_stories_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_GRID_ADMINISTRATION' => 'bx_stories_administration',
            'OBJECT_GRID_COMMON' => 'bx_stories_common',
            'OBJECT_UPLOADERS' => array('bx_stories_html5', 'bx_stories_crop'),
            
            'FUNCTION_FOR_GET_ITEM_INFO' => 'getMediaInfoById',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_stories_my' => array (
                    'create-story' => 'checkAllowedAdd',
                ),
                'bx_stories_view' => $aMenuItems2Methods,
                'bx_stories_view_media' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-stories-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_stories_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_stories_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'processing' => array (
                    'name' => 'bx_stories-processing',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_stories_txt_processing_awaiting', 'type' => BX_INFORMER_ALERT),
                        'failed' => array('msg' => '_bx_stories_txt_processing_failed', 'type' => BX_INFORMER_ERROR)
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_stories_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_stories_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_stories_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_stories_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_stories_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_stories_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_stories_txt_sample_score_down_single',
                'txt_sample_action_changed' => '_bx_stories_txt_sample_action_changed',
                'txt_media_single' => '_bx_stories_txt_media_single',
                'txt_media_comment_single' => '_bx_stories_txt_media_comment_single',
            	'txt_media_vote_single' => '_bx_stories_txt_media_vote_single',
                'txt_media_score_up_single' => '_bx_stories_txt_media_score_up_single',
                'txt_media_score_down_single' => '_bx_stories_txt_media_score_down_single',
            	'form_field_author' => '_bx_stories_form_entry_input_author',
            	'grid_action_err_delete' => '_bx_stories_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_stories_grid_txt_account_manager',
                'filter_item_active' => '_bx_stories_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_stories_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_stories_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_stories_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_stories_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_stories_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_stories_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_stories_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_stories_txt_all_entries_in',
            	'txt_all_entries_by_author' => '_bx_stories_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_stories_page_title_browse_by_context',
            ),
        );

        $this->_aJsClasses = [
            'main' => 'BxStoriesMain',
            'manage_tools' => 'BxStoriesManageTools'
        ];

        $this->_aJsObjects = [
            'main' => 'oBxStoriesMain',
            'manage_tools' => 'oBxStoriesManageTools'
        ];

        $this->_aGridObjects = [
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        ];

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = [
            'play_popup' =>  $sPrefix . '-play-popup',
        ];
    }

    public function getDuration()
    {
        return (int)getParam($this->CNF['PARAM_DURATION']);
    }
}

/** @} */
