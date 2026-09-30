<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Forum Forum
 * @ingroup     UnaModules
 *
 * @{
 */

class BxForumConfig extends BxBaseModTextConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'subscribe-discussion' => 'checkAllowedSubscribe',
            'unsubscribe-discussion' => 'checkAllowedUnsubscribe',
            'stick-discussion' => 'checkAllowedStickAnyEntry',
            'unstick-discussion' => 'checkAllowedUnstickAnyEntry',
            'resolve-discussion' => 'checkAllowedResolveAnyEntry',
            'unresolve-discussion' => 'checkAllowedUnresolveAnyEntry',
            'lock-discussion' => 'checkAllowedLockAnyEntry',
            'unlock-discussion' => 'checkAllowedUnlockAnyEntry',
            'hide-discussion' => 'checkAllowedHideAnyEntry',
            'unhide-discussion' => 'checkAllowedUnhideAnyEntry',
            'approve' => 'checkAllowedApprove',
            'edit-discussion' => 'checkAllowedEdit',
            'delete-discussion' => 'checkAllowedDelete'
        );

        $this->CNF = array_merge($this->CNF, array (

            // module icon
            'ICON' => 'far comments',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'discussions',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'discussion-text',
            'FIELD_TEXT_COMMENTS' => 'text_comments',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_MULTICAT' => 'multicat',
            'FIELD_LR_AUTHOR' => 'lr_profile_id',
            'FIELD_LR_ADDED' => 'lr_timestamp',
            'FIELD_LR_COMMENT_ID' => 'lr_comment_id',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_COVER' => 'covers',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_VIDEO' => 'videos',
            'FIELD_FILE' => 'files',
            'FIELD_POLL' => 'polls',
            'FIELD_THUMB' => 'thumb',
            'FIELD_THUMB_POSITION' => 'thumb_data',
            'FIELD_ATTACHMENTS' => 'attachments',
            'FIELD_LINK' => 'link',
            'FIELD_VIEWS' => 'views',
            'FIELD_VOTES' => 'votes',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_SCORE' => 'score',
            'FIELD_STICK' => 'stick',
            'FIELD_LOCK' => 'lock',
            'FIELD_RESOLVE' => 'resolved',
            'FIELD_RESOLVABLE' => 'resolvable',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LABELS' => 'labels',
            'FIELD_ANONYMOUS' => 'anonymous',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

             // some params
            'PARAM_MULTICAT_ENABLED' => true,
            'PARAM_MULTICAT_AUTO_ACTIVATION_FOR_CATEGORIES' => 'bx_forum_auto_activation_for_categories',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_forum_per_page_for_favorites_lists',


            // page URIs
            'URI_VIEW_ENTRY' => 'view-discussion',
            'URI_AUTHOR_ENTRIES' => 'discussions-author',
            'URI_ENTRIES_BY_CONTEXT' => 'discussions-context',
            'URI_CATEGORY_ENTRIES' => 'discussions-category',
            'URI_KEYWORD_ENTRIES' => 'discussions-keyword',
            'URI_ADD_ENTRY' => 'create-discussion',
            'URI_EDIT_ENTRY' => 'edit-discussion',
            'URI_MANAGE_COMMON' => 'discussions-manage',
            'URI_FAVORITES_LIST' => 'discussions-favorites',

            'URL_HOME' => 'page.php?i=discussions-home',
            'URL_UPDATED' => 'page.php?i=discussions-updated',
            'URL_NEW' => 'page.php?i=discussions-new',
            'URL_TOP' => 'page.php?i=discussions-top',
            'URL_POPULAR' => 'page.php?i=discussions-popular',
            'URL_PARTAKEN' => 'page.php?i=discussions-partaken',
            'URL_MANAGE_COMMON' => 'page.php?i=discussions-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=discussions-administration',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_forum_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_forum_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_forum_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_forum_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_forum_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_forum_per_page_browse_showcase',
            'PARAM_VISIBLE_CATEGORIES' => 'bx_forum_visible_categories',
            'PARAM_AUTOSUBSCRIBE_CREATED' => 'bx_forum_autosubscribe_created',
            'PARAM_AUTOSUBSCRIBE_REPLIED' => 'bx_forum_autosubscribe_replied', 
            'PARAM_LINKS_ENABLED' => true,

            // objects
            'OBJECT_GRID' => 'bx_forum',
            'OBJECT_GRID_FAVORITE' => 'bx_forum_favorite',
            'OBJECT_GRID_FEATURE' => 'bx_forum_feature',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_forum_administration',
            'OBJECT_GRID' => 'bx_forum',
            'OBJECT_GRID_COMMON' => 'bx_forum_common',
            'OBJECT_GRID_CATEGORIES' => 'bx_forum_categories',
            'OBJECT_STORAGE' => 'bx_forum_covers',
            'OBJECT_STORAGE_FILES' => 'bx_forum_files',
            'OBJECT_STORAGE_PHOTOS' => 'bx_forum_photos',
            'OBJECT_STORAGE_VIDEOS' => 'bx_forum_videos',
            'OBJECT_STORAGE_CMTS' => 'bx_forum_files_cmts', // for comments
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_forum_preview',
            'OBJECT_IMAGES_TRANSCODER_MINIATURE' => 'bx_forum_miniature',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_forum_gallery',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_forum_cover',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES' => 'bx_forum_preview_files',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_FILES' => 'bx_forum_gallery_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS' => 'bx_forum_preview_photos',
            'OBJECT_IMAGES_TRANSCODER_MINIATURE_PHOTOS' => 'bx_forum_miniature_photos',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS' => 'bx_forum_gallery_photos',
            'OBJECT_IMAGES_TRANSCODER_VIEW_PHOTOS' => 'bx_forum_view_photos',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_CMTS' => 'bx_forum_preview_cmts', // for comments
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                'poster' => 'bx_forum_videos_poster', 
            	'poster_preview' => 'bx_forum_videos_poster_preview',
            	'mp4' => 'bx_forum_videos_mp4', 
            	'mp4_hd' => 'bx_forum_videos_mp4_hd'
            ),
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_REPORTS' => 'bx_forum',
            'OBJECT_VIEWS' => 'bx_forum',
            'OBJECT_VOTES' => 'bx_forum',
            'OBJECT_REACTIONS' => 'bx_forum_reactions',
            'OBJECT_SCORES' => 'bx_forum',
            'OBJECT_FAVORITES' => 'bx_forum',
            'OBJECT_FEATURED' => 'bx_forum',
            'OBJECT_CATEGORY' => 'bx_forum_cats',
            'OBJECT_COMMENTS' => 'bx_forum',
            'OBJECT_NOTES' => 'bx_forum_notes',
            'OBJECT_METATAGS' => 'bx_forum',
            'OBJECT_PRIVACY_VIEW' => 'bx_forum_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_forum_allow_view_favorite_list',
            'OBJECT_FORM_ENTRY' => 'bx_forum',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_forum_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_forum_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_forum_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_forum_entry_delete',
            'OBJECT_FORM_POLL' => 'bx_forum_poll',
            'OBJECT_FORM_POLL_DISPLAY_ADD' => 'bx_forum_poll_add',
            'OBJECT_FORM_SEARCH' => 'bx_forum_search',
            'OBJECT_FORM_SEARCH_DISPLAY_FULL' => 'bx_forum_search_full',
            'OBJECT_MENU_ENTRY_ATTACHMENTS' => 'bx_forum_entry_attachments', // attachments menu in create/edit forms
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_forum_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_forum_view_more', // more actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_forum_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_forum_my', // actions menu on my entries page
            'OBJECT_MENU_SNIPPET_META' => 'bx_forum_snippet_meta_main', // menu for 'main' snippet meta info
            'OBJECT_MENU_SNIPPET_META_MAIN' => 'bx_forum_snippet_meta_main', // menu for 'main' snippet meta info
            'OBJECT_MENU_SNIPPET_META_COUNTERS' => 'bx_forum_snippet_meta_counters', // menu for 'counters' snippet meta info
            'OBJECT_MENU_SNIPPET_META_REPLY' => 'bx_forum_snippet_meta_reply', // menu for 'reply' snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_forum_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_MENU_SUBMENU' => 'bx_forum_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => '', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'forum', // first item in view entry submenu from main module submenu
            'OBJECT_UPLOADERS' => array('sys_html5'),
            'OBJECT_CONNECTION_SUBSCRIBERS' => 'bx_forum_subscribers',

            'BADGES_AVALIABLE' => true,

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_forum_view' => $aMenuItems2Methods,
                'bx_forum_view_more' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-forum-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_forum_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_forum_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_forum_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_forum_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_forum_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_forum_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_forum_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_forum_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_forum_txt_sample_score_down_single',
            	'form_field_author' => '_bx_forum_form_entry_input_author',
                'form_field_covers_uploader_simple' => '_bx_forum_form_entry_input_covers_uploader_simple_title',
                'form_field_covers_uploader_html5' => '_bx_forum_form_entry_input_covers_uploader_html5_title',
            	'grid_action_err_delete' => '_bx_forum_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_forum_grid_txt_account_manager',
            	'filter_item_active' => '_bx_forum_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_forum_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_forum_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_forum_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_forum_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_forum_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_forum_menu_item_title_manage_all',
                'txt_all_entries_in' => '_bx_forum_txt_all_entries_in',
            	'txt_all_entries_by_author' => '_bx_forum_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_forum_page_title_browse_by_context',
                'txt_all_categories' => '_bx_forum_txt_all_categories',
            	'txt_pict_use_as_thumb' => '_bx_forum_form_entry_input_picture_use_as_thumb',
                'txt_poll_form_answers_add' => '_bx_forum_form_poll_input_answers_add',
                'txt_poll_menu_view_answers' => '_bx_forum_txt_poll_view_answers',
                'txt_poll_menu_view_results' => '_bx_forum_txt_poll_view_results',
                'txt_poll_menu_view_' => '_bx_forum_txt_poll_view_',
                'txt_poll_answer_vote_do_by' => '_bx_forum_txt_poll_answer_vote_do_by',
                'txt_poll_answer_vote_counter' => '_bx_forum_txt_poll_answer_vote_counter',
                'txt_poll_answer_vote_percent' => '_bx_forum_txt_poll_answer_vote_percent'
            ),
        ));

        $this->_aPrefixes = array(
            'style' => 'bx-forum',
        );
        
        $this->_aJsClasses = array_merge($this->_aJsClasses, array(
            'main' => 'BxForumMain',
            'entry' => 'BxForumEntry',
            'manage_tools' => 'BxForumManageTools',
            'studio' => 'BxForumStudio',
            'categories' => 'BxDolCategories'
        ));

        $this->_aJsObjects = array_merge($this->_aJsObjects, array(
            'main' => 'oBxForumMain',
            'entry' => 'oBxForumEntry',
            'manage_tools' => 'oBxForumManageTools',
            'studio' => 'oBxForumStudio',
            'categories' => 'oBxDolCategories'
        ));

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
            'main' => $this->CNF['OBJECT_GRID'],
        );

        $this->_bAttachmentsInTimeline = true;
    }
}

/** @} */
