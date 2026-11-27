<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reviews Reviews
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReviewsConfig extends BxBaseModTextConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',
            'edit-review' => 'checkAllowedEdit',
            'delete-review' => 'checkAllowedDelete',
        );

        $this->CNF = array_merge($this->CNF, array (

            // module icon
            'ICON' => 'address-card',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'reviews',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_TITLE' => 'title',
            'FIELD_PRODUCT' => 'product',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'review-text',
            'FIELD_VOTING_OPTIONS' => 'voting_options',
            'FIELD_VOTING_AVG' => 'voting_avg',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_MULTICAT' => 'multicat',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_REVIEWED_PROFILE' => 'reviewed_profile',
            'FIELD_COVER' => 'covers',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_VIDEO' => 'videos',
            'FIELD_FILE' => 'files',
            'FIELD_POLL' => 'polls',
            'FIELD_THUMB' => 'thumb',
            'FIELD_ATTACHMENTS' => 'attachments',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELD_ANONYMOUS' => 'anonymous',
            'FIELD_ALLOW_COMMENTS' => 'allow_comments',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELDS_DELAYED_PROCESSING' => 'videos', // can be array of fields or comma separated string of field names

             // some params
            'PARAM_MULTICAT_ENABLED' => true,
            'PARAM_MULTICAT_AUTO_ACTIVATION_FOR_CATEGORIES' => 'bx_reviews_auto_activation_for_categories',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_reviews_per_page_for_favorites_lists',
            
            // page URIs
            'URI_VIEW_ENTRY' => 'view-review',
            'URI_AUTHOR_ENTRIES' => 'reviews-author',
            'URI_ENTRIES_BY_CONTEXT' => 'reviews-context',
            'URI_ADD_ENTRY' => 'create-review',
            'URI_EDIT_ENTRY' => 'edit-review',
            'URI_MANAGE_COMMON' => 'reviews-manage',

            'URL_HOME' => 'page.php?i=reviews-home',
            'URL_POPULAR' => 'page.php?i=reviews-popular',
            'URL_TOP' => 'page.php?i=reviews-top',
            'URL_UPDATED' => 'page.php?i=reviews-updated',
            'URL_MANAGE_COMMON' => 'page.php?i=reviews-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=reviews-administration',
            'URI_FAVORITES_LIST' => 'reviews-favorites',

            'URI_SEARCH_PRODUCT' => 'searchKeyword.php?section=bx_reviews_products',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_reviews_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_reviews_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_reviews_plain_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN_SHORT' => 'bx_reviews_plain_summary_chars_with_thumb',
            'PARAM_NUM_RSS' => 'bx_reviews_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_reviews_searchable_fields',
            'PARAM_USE_GALERY_AS_COVER' => 'bx_reviews_use_galery_as_cover',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_reviews_per_page_browse_showcase',
            'PARAM_PER_PAGE_BROWSE' => 'bx_reviews_per_page_browse',
            'PARAM_MAX_STARS' => 'bx_reviews_voting_max_stars',
            'PARAM_CONTEXT_CONTROL_ENABLE' => 'bx_reviews_custom_context_chooser',
            'PARAM_CONTEXT_MODULES_AVAILABLE' => 'bx_reviews_custom_context_chooser_options',

            // objects
            'OBJECT_STORAGE' => 'bx_reviews_covers',
            'OBJECT_STORAGE_FILES' => 'bx_reviews_files',
            'OBJECT_STORAGE_PHOTOS' => 'bx_reviews_photos',
            'OBJECT_STORAGE_VIDEOS' => 'bx_reviews_videos',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_reviews_preview',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_reviews_gallery',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_reviews_cover',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES' => 'bx_reviews_preview_files',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_FILES' => 'bx_reviews_gallery_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS' => 'bx_reviews_preview_photos',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS' => 'bx_reviews_gallery_photos',
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                'poster' => 'bx_reviews_videos_poster', 
            	'poster_preview' => 'bx_reviews_videos_poster_preview',
            	'mp4' => 'bx_reviews_videos_mp4', 
            	'mp4_hd' => 'bx_reviews_videos_mp4_hd'
            ),
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_REPORTS' => 'bx_reviews',
            'OBJECT_VIEWS' => 'bx_reviews',
            'OBJECT_VOTES' => 'bx_reviews',
            'OBJECT_VOTES_STARS' => 'bx_reviews_stars',
            'OBJECT_REACTIONS' => 'bx_reviews_reactions',
            'OBJECT_SCORES' => 'bx_reviews',
            'OBJECT_FAVORITES' => 'bx_reviews',
            'OBJECT_FEATURED' => 'bx_reviews',
            'OBJECT_METATAGS' => 'bx_reviews',
            'OBJECT_COMMENTS' => 'bx_reviews',
            'OBJECT_NOTES' => 'bx_reviews_notes',
            'OBJECT_CATEGORY' => 'bx_reviews_cats',
            'OBJECT_PRIVACY_VIEW' => 'bx_reviews_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_reviews_allow_view_favorite_list',
            'OBJECT_FORM_ENTRY' => 'bx_reviews',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_reviews_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_reviews_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_reviews_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_reviews_entry_delete',
            'OBJECT_FORM_POLL' => 'bx_reviews_poll',
            'OBJECT_FORM_POLL_DISPLAY_ADD' => 'bx_reviews_poll_add',
            'OBJECT_MENU_ENTRY_ATTACHMENTS' => 'bx_reviews_entry_attachments', // attachments menu in create/edit forms
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_reviews_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_reviews_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_reviews_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU' => 'bx_reviews_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_reviews_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'reviews-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_reviews_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_reviews_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_GRID_ADMINISTRATION' => 'bx_reviews_administration',
            'OBJECT_GRID_COMMON' => 'bx_reviews_common',
            'OBJECT_GRID_CATEGORIES' => 'bx_reviews_categories',
            'OBJECT_UPLOADERS' => array('bx_reviews_simple', 'bx_reviews_html5'),
            'OBJECT_CONTENT_INFO' => 'bx_reviews',
            'OBJECT_CMTS_CONTENT_INFO' => 'bx_reviews_cmts',
            
            'BADGES_AVALIABLE' => true,

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_reviews_my' => array (
                    'create-review' => 'checkAllowedAdd',
                ),
                'bx_reviews_view' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-reviews-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_reviews_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_reviews_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'processing' => array (
                    'name' => 'bx-reviews-processing',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_reviews_txt_processing_awaiting', 'type' => BX_INFORMER_ALERT),
                        'failed' => array('msg' => '_bx_reviews_txt_processing_failed', 'type' => BX_INFORMER_ERROR)
                    ),
                ),
                'scheduled' => array (
                    'name' => 'bx-reviews-scheduled',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_reviews_txt_scheduled_awaiting', 'type' => BX_INFORMER_ALERT),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_reviews_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_reviews_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_reviews_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_reviews_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_reviews_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_reviews_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_reviews_txt_sample_score_down_single',
                'form_field_author' => '_bx_reviews_form_entry_input_author',
                'form_field_covers_uploader_simple' => '_bx_reviews_form_entry_input_covers_uploader_simple_title',
                'form_field_covers_uploader_html5' => '_bx_reviews_form_entry_input_covers_uploader_html5_title',
            	'grid_action_err_delete' => '_bx_reviews_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_reviews_grid_txt_account_manager',
                'filter_item_active' => '_bx_reviews_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_reviews_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_reviews_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_reviews_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_reviews_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_reviews_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_reviews_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_reviews_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_reviews_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_reviews_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_reviews_page_title_browse_by_context',
                'txt_err_cannot_perform_action' => '_bx_reviews_txt_err_cannot_perform_action',
                'txt_poll_form_answers_add' => '_bx_reviews_form_poll_input_answers_add',
                'txt_poll_menu_view_answers' => '_bx_reviews_txt_poll_view_answers',
                'txt_poll_menu_view_results' => '_bx_reviews_txt_poll_view_results',
                'txt_poll_menu_view_' => '_bx_reviews_txt_poll_view_',
                'txt_poll_answer_vote_do_by' => '_bx_reviews_txt_poll_answer_vote_do_by',
                'txt_poll_answer_vote_counter' => '_bx_reviews_txt_poll_answer_vote_counter',
                'txt_poll_answer_vote_percent' => '_bx_reviews_txt_poll_answer_vote_percent'
            ),
        ));
        
        $this->_aJsClasses = array_merge($this->_aJsClasses, array(
            'manage_tools' => 'BxReviewsManageTools',
            'categories' => 'BxDolCategories',
            'multi_voting' => 'BxReviewsVoteStars',
        ));

        $this->_aJsObjects = array_merge($this->_aJsObjects, array(
            'manage_tools' => 'oBxReviewsManageTools',
            'categories' => 'oBxDolCategories',
            'multi_voting' => 'oBxReviewsVoteStars',
        ));

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        );

        $this->_bAttachmentsInTimeline = true;
    }

    public function getJsClass($mixedType)
    {
        if (is_array($mixedType)) {
            return parent::getJsClass($mixedType['type']);
        } else {
            return parent::getJsClass($mixedType);
        }
    }

    public function getJsObject($mixedType)
    {
        if (is_array($mixedType)) {
            return parent::getJsObject($mixedType['type']).$mixedType['id'];
        } else {
            return parent::getJsObject($mixedType);
        }
    }
}

/** @} */
