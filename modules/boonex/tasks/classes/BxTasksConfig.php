<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolInformer');

class BxTasksConfig extends BxBaseModTextConfig
{
    protected $_oDb;

    protected $_aProperties;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',
            'edit-task' => 'checkAllowedEdit',
            'edit-task-state' => 'checkAllowedManage',
            'delete-task' => 'checkAllowedDelete',
        );

        $this->CNF = array_merge($this->CNF, array (

            // module icon
            'ICON' => 'tasks',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'tasks',
            'TABLE_LISTS' => $aModule['db_prefix'] . 'lists',
            'TABLE_CONTEXTS' => $aModule['db_prefix'] . 'contexts',
            'TABLE_ASSIGNMENTS' => $aModule['db_prefix'] . 'assignments',
            'TABLE_FILTERS' => $aModule['db_prefix'] . 'filters',
            'TABLE_TIME' => $aModule['db_prefix'] . 'time',
            'TABLE_TIME_TRACK' => $aModule['db_prefix'] . 'time_track',
            'TABLE_TIMERS' => $aModule['db_prefix'] . 'timers',
            'TABLE_PRE_LISTS' => $aModule['db_prefix'] . 'pre_lists',
            'TABLE_PRE_VALUES' => $aModule['db_prefix'] . 'pre_values',
            'TABLE_POLLS' => '',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_PUBLISHED' => 'published',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'post-text',
            'FIELD_STICKERS' => 'stickers',
            'FIELD_TYPE' => 'type',
            'FIELD_PRIORITY' => 'priority',
            'FIELD_ESTIMATE' => 'estimate',
            'FIELD_STATE' => 'state',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_MULTICAT' => 'multicat',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_COVER' => 'covers',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_VIDEO' => 'videos',
            'FIELD_FILE' => 'files',
            'FIELD_THUMB' => 'thumb',
            'FIELD_ATTACHMENTS' => 'attachments',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LABELS' => 'labels',
            'FIELD_TASKLIST' => 'tasks_list',
            'FIELD_TASKS_LIST' => 'tasks_list',
            'FIELD_GH_ISSUE' => 'gh_issue',
            'FIELD_GH_ISSUE_URL' => 'gh_issue_url',
            'FIELD_INITIAL_MEMBERS' => 'initial_members',
            'FIELD_DUE_DATE' => 'due_date',
            'FIELD_EXPIRED' => 'expired',
            'FIELD_COMPLETED' => 'completed',
            'FIELD_ANONYMOUS' => 'anonymous',
            'FIELD_ALLOW_COMMENTS' => 'allow_comments',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELDS_DELAYED_PROCESSING' => 'videos', // can be array of fields or comma separated string of field names

            'FIELD_LIST_ID' => 'id',
            'FIELD_LIST_CONTEXT_ID' => 'context_id',
            'FIELD_LIST_TITLE' => 'title',

             // some params
            'PARAM_MULTICAT_ENABLED' => true,
            'PARAM_MULTICAT_AUTO_ACTIVATION_FOR_CATEGORIES' => 'bx_tasks_auto_activation_for_categories',
            'PARAM_POLL_ENABLED' => false,

            // page URIs
            'URI_VIEW_ENTRY' => 'view-task',
            'URI_ENTRIES_BY_CONTEXT' => 'tasks-context',
            'URI_ADD_ENTRY' => 'create-task',
            'URI_EDIT_ENTRY' => 'edit-task',
            'URI_MANAGE_COMMON' => 'tasks-manage',

            'URL_HOME' => 'page.php?i=tasks-home',
            'URL_POPULAR' => 'page.php?i=tasks-popular',
            'URL_TOP' => 'page.php?i=tasks-top',
            'URL_UPDATED' => 'page.php?i=tasks-updated',
            'URL_MANAGE_COMMON' => 'page.php?i=tasks-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=tasks-administration',
            'URL_CONTEXT_ENTRIES' => 'page.php?i=tasks-context',
            'URL_CONTEXT_VALUES' => 'page.php?i=tasks-context-values',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_tasks_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_tasks_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_tasks_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_tasks_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_tasks_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_tasks_per_page_browse_showcase',

            // objects
            'OBJECT_STORAGE' => 'bx_tasks_covers',
            'OBJECT_STORAGE_FILES' => 'bx_tasks_files',
            'OBJECT_STORAGE_PHOTOS' => 'bx_tasks_photos',
            'OBJECT_STORAGE_VIDEOS' => 'bx_tasks_videos',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_tasks_preview',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_tasks_gallery',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_tasks_cover',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES' => 'bx_tasks_preview_files',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_FILES' => 'bx_tasks_gallery_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS' => 'bx_tasks_preview_photos',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS' => 'bx_tasks_gallery_photos',
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                'poster' => 'bx_tasks_videos_poster', 
            	'poster_preview' => 'bx_tasks_videos_poster_preview',
            	'mp4' => 'bx_tasks_videos_mp4', 
            	'mp4_hd' => 'bx_tasks_videos_mp4_hd'
            ),
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_REPORTS' => 'bx_tasks',
            'OBJECT_REPORTS_TIME' => 'bx_tasks_time',
            'OBJECT_VIEWS' => 'bx_tasks',
            'OBJECT_VOTES' => 'bx_tasks',
            'OBJECT_REACTIONS' => 'bx_tasks_reactions',
            'OBJECT_SCORES' => 'bx_tasks',
            'OBJECT_FAVORITES' => 'bx_tasks',
            'OBJECT_FEATURED' => 'bx_tasks',
            'OBJECT_COMMENTS' => 'bx_tasks',
            'OBJECT_NOTES' => 'bx_tasks_notes',
            'OBJECT_CATEGORY' => 'bx_tasks_cats',
            'OBJECT_CONNECTION' => 'bx_tasks_assignments',
            'OBJECT_PRIVACY_VIEW' => 'bx_tasks_allow_view_to',
            'OBJECT_FORM_ENTRY' => 'bx_tasks',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_tasks_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_tasks_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_tasks_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_BODY' => 'bx_tasks_entry_edit_body',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_TASKS_LIST' => 'bx_tasks_entry_edit_tasks_list',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_TYPE' => 'bx_tasks_entry_edit_type',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_PRIORITY' => 'bx_tasks_entry_edit_priority',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_ESTIMATE' => 'bx_tasks_entry_edit_estimate',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_DUE_DATE' => 'bx_tasks_entry_edit_due_date',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_STATE' => 'bx_tasks_entry_edit_state',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_tasks_entry_delete',
            'OBJECT_FORM_LIST_ENTRY' => 'bx_tasks_list',
            'OBJECT_FORM_LIST_ENTRY_DISPLAY_ADD' => 'bx_tasks_list_entry_add',
            'OBJECT_FORM_LIST_ENTRY_DISPLAY_EDIT' => 'bx_tasks_list_entry_edit',
            'OBJECT_FORM_CONTEXT' => 'bx_tasks_context',
            'OBJECT_FORM_CONTEXT_DISPLAY_EDIT' => 'bx_tasks_context_edit',
            'OBJECT_FORM_TIME' => 'bx_tasks_time',
            'OBJECT_FORM_TIME_DISPLAY_ADD' => 'bx_tasks_time_add',
            'OBJECT_FORM_TIME_DISPLAY_EDIT' => 'bx_tasks_time_edit',
            'OBJECT_MENU_ENTRY_ATTACHMENTS' => 'bx_tasks_entry_attachments', // attachments menu in create/edit forms
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_tasks_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_tasks_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_tasks_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU' => 'bx_tasks_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_tasks_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'tasks-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_tasks_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_tasks_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_MENU_SUBMENU_VIEW_CONTEXT' => 'bx_tasks_view_context_submenu',
            'OBJECT_MENU_USE_TOOLS_SUBMENU' => 'bx_tasks_use_tools_submenu',
            'OBJECT_MENU_MANAGE_TOOLS_SUBMENU' => 'bx_tasks_manage_tools_submenu',
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_tasks_menu_manage_tools', //manage item menu in content administration tools
            'OBJECT_MENU_BROWSE' => 'bx_tasks_browse',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_tasks_administration',
            'OBJECT_GRID_COMMON' => 'bx_tasks_common',
            'OBJECT_GRID_TIME_ADMINISTRATION' => 'bx_tasks_time_administration',
            'OBJECT_GRID_TIME_COMMON' => 'bx_tasks_time_common',
            'OBJECT_GRID_TIME_CONTEXT_ADMINISTRATION' => 'bx_tasks_time_context_administration',
            'OBJECT_GRID_TIME_CONTEXT_COMMON' => 'bx_tasks_time_context_common',
            'OBJECT_GRID_PRE_VALUES' => 'bx_tasks_pre_values',
            'OBJECT_UPLOADERS' => array('bx_tasks_simple', 'bx_tasks_html5'),
            'OBJECT_CONTENT_INFO' => 'bx_tasks',
            'OBJECT_CMTS_CONTENT_INFO' => 'bx_tasks_cmts',
            'OBJECT_PRE_LIST_TYPES' => 'bx_tasks_types',
            'OBJECT_PRE_LIST_STICKERS' => 'bx_tasks_stickers',
            'OBJECT_PRE_LIST_PRIORITIES' => 'bx_tasks_priorities',
            'OBJECT_PRE_LIST_ESTIMATES' => 'bx_tasks_estimates',
            'OBJECT_PRE_LIST_STATES' => 'bx_tasks_states',
            
            'BADGES_AVALIABLE' => true,
            'COOKIE_SETTING_KEY' => 'bx_tasks_filters',

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_tasks_my' => array (
                    'create-task' => 'checkAllowedAdd',
                ),
                'bx_tasks_view' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-tasks-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_tasks_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_tasks_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'processing' => array (
                    'name' => 'bx-tasks-processing',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_tasks_txt_processing_awaiting', 'type' => BX_INFORMER_ALERT),
                        'failed' => array('msg' => '_bx_tasks_txt_processing_failed', 'type' => BX_INFORMER_ERROR)
                    ),
                ),
                'scheduled' => array (
                    'name' => 'bx-tasks-scheduled',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_tasks_txt_scheduled_awaiting', 'type' => BX_INFORMER_ALERT),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_tasks_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_tasks_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_tasks_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_tasks_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_tasks_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_tasks_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_tasks_txt_sample_score_down_single',
                'form_field_author' => '_bx_tasks_form_entry_input_author',
                'form_field_covers_uploader_simple' => '_bx_tasks_form_entry_input_covers_uploader_simple_title',
                'form_field_covers_uploader_html5' => '_bx_tasks_form_entry_input_covers_uploader_html5_title',
                'grid_action_err_delete' => '_bx_tasks_grid_action_err_delete',
                'grid_txt_account_manager' => '_bx_tasks_grid_txt_account_manager',
                'filter_item_active' => '_bx_tasks_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_tasks_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_tasks_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_tasks_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_tasks_grid_filter_item_title_adm_select_one_filter2',
                'filter_item_select_one_filter3' => '_bx_tasks_grid_filter_item_title_adm_select_one_filter3',
            	'menu_item_manage_my' => '_bx_tasks_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_tasks_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_tasks_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_tasks_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_tasks_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_tasks_page_title_browse_by_context',
                'txt_err_cannot_perform_action' => '_bx_tasks_txt_err_cannot_perform_action',
            ),
        ));

        $this->_aJsClasses = array_merge($this->_aJsClasses, [
            'manage_tools' => 'BxTasksManageTools',
            'categories' => 'BxDolCategories',
            'tasks' => 'BxTasksView',
            'time' => 'BxTasksTime',
            'timer' => 'BxTasksTimer',
            'pre_values' => 'BxTasksPreValues',
        ]);

        $this->_aJsObjects = array_merge($this->_aJsObjects, [
            'manage_tools' => 'oBxTasksManageTools',
            'categories' => 'oBxDolCategories',
            'tasks' => 'oBxTasksView',
            'time' => 'oBxTasksTime',
            'timer' => 'oBxTasksTimer',
            'pre_values' => 'oBxTasksPreValues',
        ]);

        $this->_aGridObjects = [
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
            'time_common' => $this->CNF['OBJECT_GRID_TIME_COMMON'],
            'time_administration' => $this->CNF['OBJECT_GRID_TIME_ADMINISTRATION'],
            'time_context_common' => $this->CNF['OBJECT_GRID_TIME_CONTEXT_COMMON'],
            'time_context_administration' => $this->CNF['OBJECT_GRID_TIME_CONTEXT_ADMINISTRATION'],
            'pre_values' => $this->CNF['OBJECT_GRID_PRE_VALUES'],
        ];

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'tasks' => $sPrefix . '-tasks',
            'time_popup' => $sPrefix . '-time-popup',
            'total_popup' => $sPrefix . '-total-popup',
            'filter_popup' => $sPrefix . '-filter-popup',
            'timer' => $sPrefix . '-timer-',
            'timer_actions' => $sPrefix . '-timer-actions',
            'timers_actions' => $sPrefix . '-timers-actions',
            'pre_values_popup' => $sPrefix . '-pv-popup-',
        ]);

        $this->_bAttachmentsInTimeline = true;

        $this->_aProperties = [
            $this->CNF['FIELD_TASKLIST'],
            $this->CNF['FIELD_TYPE'], 
            $this->CNF['FIELD_PRIORITY'], 
            $this->CNF['FIELD_ESTIMATE'], 
            $this->CNF['FIELD_DUE_DATE'], 
            $this->CNF['FIELD_STATE']
        ];
    }

    public function init(&$oDb)
    {
        $this->_oDb = &$oDb;
    }

    public function isCompleted($iState)
    {
        return in_array($iState, [BX_TASKS_STATE_CANCELLED, BX_TASKS_STATE_DUPLICATE, BX_TASKS_STATE_DONE]);
    }

    public function getProperties()
    {
        return $this->_aProperties;
    }

    public function getTasksListTitle($iValue)
    {
        if(!$iValue)
            return _t('_bx_tasks_txt_list_inbox');

        $aList = $this->_oDb->getList($iValue);
        return $aList['title'] ?? _t('_undefined');
    }

    public function getTypeTitle($iValue)
    {
        $aItems = BxDolFormQuery::getDataItems($this->CNF['OBJECT_PRE_LIST_TYPES'], false, BX_DATA_VALUES_ALL);
        return $aItems[$iValue]['LKey'] ?? '';
    }

    public function getPriorityTitle($iValue)
    {
        $aItems = BxDolFormQuery::getDataItems($this->CNF['OBJECT_PRE_LIST_PRIORITIES'], false, BX_DATA_VALUES_ALL);
        return $aItems[$iValue]['LKey'] ?? '';
    }

    public function getEstimateTitle($iValue)
    {
        return $this->timeI2S($iValue);
    }

    public function getDueDateTitle($iValue)
    {
        return bx_process_output($iValue, BX_DATA_DATE_TS);
    }

    public function getStateTitle($iValue)
    {
        $aItems = BxDolFormQuery::getDataItems($this->CNF['OBJECT_PRE_LIST_STATES'], false, BX_DATA_VALUES_ALL);
        return $aItems[$iValue]['LKey'] ?? '';
    }

    public function timeA2I($a)
    {
        if(!$a || !is_array($a) || count($a) != 2)
            return 0;

        $iH = (int)($a[0] ?? 0);
        if($iH < 0)
            $iH = 0;

        $iM = (int)($a[1] ?? 0);
        if($iM < 0)
            $iM = 0;
        else if($iM > 59)
            $iM = 59;

        return 60 * $iH + $iM;
    }

    public function timeS2I($s)
    {
        if(strpos($s, ':') === false)
            return 0;

        return $this->timeA2I(explode(':', $s));
    }

    public function timeI2A($i, $bUseSeconds = false)
    {
        if(!$bUseSeconds) {
            $iH = intdiv($i, 60);

            return [$iH, $i - 60 * $iH];
        }

        $iH = intdiv($i, 3600);
        $iM = intdiv($i - 3600 * $iH, 60);
        return [$iH, $iM, $i - 3600 * $iH - 60 * $iM];
    }

    public function timeI2S($i)
    {
        list($iH, $iM) = $this->timeI2A($i);
        return sprintf("%02d", $iH) . ':' . sprintf("%02d", $iM);
    }
}

/** @} */
