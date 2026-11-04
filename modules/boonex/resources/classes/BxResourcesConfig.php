<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolInformer');

class BxResourcesConfig extends BxBaseModTextConfig
{
    protected $_aProperties;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',
            'edit-resource' => 'checkAllowedEdit',
            'edit-resource-state' => 'checkAllowedManage',
            'delete-resource' => 'checkAllowedDelete',
        );

        $this->CNF = array_merge($this->CNF, array (

            // module icon
            'ICON' => 'warehouse',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'entries',
            'TABLE_LISTS' => $aModule['db_prefix'] . 'lists',
            'TABLE_POLLS' => '',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',

            // database fields
            'FIELD_LIST_ID' => 'id',
            'FIELD_LIST_CONTEXT_ID' => 'context_id',
            'FIELD_LIST_TITLE' => 'title',

            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_PUBLISHED' => 'published',
            'FIELD_LINK' => 'link',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'post-text',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => '',
            'FIELD_COVER' => 'covers',
            'FIELD_PHOTO' => '',
            'FIELD_VIDEO' => '',
            'FIELD_FILE' => '',
            'FIELD_THUMB' => 'thumb',
            'FIELD_ATTACHMENTS' => '',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LABELS' => 'labels',
            'FIELD_LIST' => 'list',
            'FIELD_ANONYMOUS' => 'anonymous',
            'FIELD_ALLOW_COMMENTS' => 'allow_comments',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELDS_DELAYED_PROCESSING' => 'videos', // can be array of fields or comma separated string of field names

             // some params
            'PARAM_MULTICAT_ENABLED' => false,
            'PARAM_MULTICAT_AUTO_ACTIVATION_FOR_CATEGORIES' => 'bx_resources_auto_activation_for_categories',
            'PARAM_POLL_ENABLED' => false,

            // page URIs
            'URI_VIEW_ENTRY' => 'view-resource',
            'URI_AUTHOR_ENTRIES' => 'resources-author',
            'URI_ENTRIES_BY_CONTEXT' => 'resources-context',
            'URI_ADD_ENTRY' => 'create-resource',
            'URI_EDIT_ENTRY' => 'edit-resource',
            'URI_MANAGE_COMMON' => 'resources-manage',

            'URL_HOME' => '',
            'URL_POPULAR' => '',
            'URL_TOP' => '',
            'URL_UPDATED' => '',
            'URL_MANAGE_COMMON' => 'page.php?i=resources-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=resources-administration',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_resources_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_resources_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_resources_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_resources_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_resources_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_resources_per_page_browse_showcase',

            // objects
            'OBJECT_STORAGE' => 'bx_resources_covers',
            'OBJECT_STORAGE_FILES' => '',
            'OBJECT_STORAGE_PHOTOS' => '',
            'OBJECT_STORAGE_VIDEOS' => '',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_resources_preview',
            'OBJECT_IMAGES_TRANSCODER_MINIATURE' => 'bx_resources_miniature',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_resources_gallery',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_resources_cover',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES' => '',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_FILES' => '',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS' => '',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS' => '',
            'OBJECT_VIDEOS_TRANSCODERS' => [],
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_REPORTS' => 'bx_resources',
            'OBJECT_VIEWS' => 'bx_resources',
            'OBJECT_VOTES' => 'bx_resources',
            'OBJECT_REACTIONS' => 'bx_resources_reactions',
            'OBJECT_SCORES' => 'bx_resources',
            'OBJECT_FAVORITES' => '',
            'OBJECT_FEATURED' => '',
            'OBJECT_COMMENTS' => 'bx_resources',
            'OBJECT_NOTES' => '',
            'OBJECT_CATEGORY' => 'bx_resources_cats',
            'OBJECT_PRIVACY_VIEW' => 'bx_resources_allow_view_to',
            'OBJECT_FORM_ENTRY' => 'bx_resources',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_resources_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_resources_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_resources_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_resources_entry_delete',
            'OBJECT_FORM_LIST_ENTRY' => 'bx_resources_list',
            'OBJECT_FORM_LIST_ENTRY_DISPLAY_ADD' => 'bx_resources_list_entry_add',
            'OBJECT_FORM_LIST_ENTRY_DISPLAY_EDIT' => 'bx_resources_list_entry_edit',
            'OBJECT_MENU_ENTRY_ATTACHMENTS' => '', // attachments menu in create/edit forms
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_resources_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_resources_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_resources_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_resources_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'resources-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => '', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_resources_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_GRID_ADMINISTRATION' => 'bx_resources_administration',
            'OBJECT_GRID_COMMON' => 'bx_resources_common',
            'OBJECT_UPLOADERS' => array('bx_resources_html5'),
            'OBJECT_CONTENT_INFO' => 'bx_resources',
            'OBJECT_CMTS_CONTENT_INFO' => 'bx_resources_cmts',

            'BADGES_AVALIABLE' => false,

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_resources_view' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-resources-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_resources_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_resources_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'processing' => array (
                    'name' => 'bx-resources-processing',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_resources_txt_processing_awaiting', 'type' => BX_INFORMER_ALERT),
                        'failed' => array('msg' => '_bx_resources_txt_processing_failed', 'type' => BX_INFORMER_ERROR)
                    ),
                ),
                'scheduled' => array (
                    'name' => 'bx-resources-scheduled',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_resources_txt_scheduled_awaiting', 'type' => BX_INFORMER_ALERT),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_resources_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_resources_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_resources_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_resources_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_resources_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_resources_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_resources_txt_sample_score_down_single',
                'form_field_author' => '_bx_resources_form_entry_input_author',
                'form_field_covers_uploader_simple' => '_bx_resources_form_entry_input_covers_uploader_simple_title',
                'form_field_covers_uploader_html5' => '_bx_resources_form_entry_input_covers_uploader_html5_title',
                'grid_action_err_delete' => '_bx_resources_grid_action_err_delete',
                'grid_txt_account_manager' => '_bx_resources_grid_txt_account_manager',
                'filter_item_active' => '_bx_resources_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_resources_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_resources_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_resources_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_resources_grid_filter_item_title_adm_select_one_filter2',
                'filter_item_select_one_filter3' => '_bx_resources_grid_filter_item_title_adm_select_one_filter3',
            	'menu_item_manage_my' => '_bx_resources_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_resources_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_resources_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_resources_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_resources_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_resources_page_title_browse_by_context',
                'txt_err_cannot_perform_action' => '_bx_resources_txt_err_cannot_perform_action',
            ),
        ));

        $this->_aJsClasses = array_merge($this->_aJsClasses, [
            'main' => 'BxResourcesMain',
            'manage_tools' => 'BxResourcesManageTools',
        ]);

        $this->_aJsObjects = array_merge($this->_aJsObjects, [
            'main' => 'oBxResourcesMain',
            'manage_tools' => 'oBxResourcesManageTools',
        ]);

        $this->_aGridObjects = [
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        ];

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'lists' => $sPrefix . '-lists',
            'list' =>  $sPrefix . '-list-',
            'entry_popup_add' => $sPrefix . '-add-entry-popup',
            'entry_popup_edit' => $sPrefix . '-add-entry-popup',
        ]);

        $this->_bAttachmentsInTimeline = false;
    }
}

/** @} */
