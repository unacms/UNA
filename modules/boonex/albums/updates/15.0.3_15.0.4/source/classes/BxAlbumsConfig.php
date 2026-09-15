<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAlbumsConfig extends BxBaseModTextConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',
            'add-images-to-album' => 'checkAllowedEdit',
            'edit-album' => 'checkAllowedEdit',
            'edit-image' => 'checkAllowedEdit',
            'move-image' => 'checkAllowedEdit',
            'delete-album' => 'checkAllowedDelete',
            'delete-image' => 'checkAllowedDelete',
        );

        $this->CNF = array (

            // module icon
            'ICON' => 'far image',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'albums',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',
            'TABLE_FILES2ENTRIES' => $aModule['db_prefix'] . 'files2albums',
            'TABLE_FILES' => $aModule['db_prefix'] . 'files',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'album-desc',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_THUMB' => 'thumb',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELDS_DELAYED_PROCESSING' => 'pictures', // can be array of fields or comma separated string of field names

            // page URIs
            'URI_VIEW_ENTRY' => 'view-album',
            'URI_VIEW_MEDIA' => 'view-album-media',
            'URI_AUTHOR_ENTRIES' => 'albums-author',
            'URI_ENTRIES_BY_CONTEXT' => 'albums-context',
            'URI_ADD_ENTRY' => 'create-album',
            'URI_EDIT_ENTRY' => 'edit-album',
            'URI_MANAGE_COMMON' => 'albums-manage',
            'URI_FAVORITES_LIST' => 'albums-favorites',
            'URI_EDIT_MEDIA' => 'edit-media',
            'URI_MOVE_MEDIA' => 'move-media',
            'URI_DELETE_MEDIA' => 'delete-media',

            'URL_HOME' => 'page.php?i=albums-home',
            'URL_POPULAR' => 'page.php?i=albums-popular',
            'URL_TOP' => 'page.php?i=albums-top',
            'URL_UPDATED' => 'page.php?i=albums-home',
            'URL_POPULAR_MEDIA' => 'page.php?i=albums-popular-media',
            'URL_TOP_MEDIA' => 'page.php?i=albums-top-media',
            'URL_RECENT_MEDIA' => 'page.php?i=albums-recent-media', // TODO: add page
            'URL_MANAGE_COMMON' => 'page.php?i=albums-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=albums-administration',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_albums_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_albums_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_albums_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_albums_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_albums_searchable_fields',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_albums_per_page_for_favorites_lists',
            'PARAM_ORDER_BY_GHOSTS' => true,

            // objects
            'OBJECT_STORAGE' => 'bx_albums_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_albums_proxy_preview',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => '',
            'OBJECT_IMAGES_TRANSCODER_BIG' => 'bx_albums_big',
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                'poster' => 'bx_albums_video_poster_big', 
                'poster_preview' => 'bx_albums_video_poster_preview', 
                'mp4' => 'bx_albums_video_mp4', 
                'mp4_hd' => 'bx_albums_video_mp4_hd'
            ),
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_TRANSCODER_BROWSE' => 'bx_albums_proxy_browse',
            'OBJECT_TRANSCODER_COVER' => 'bx_albums_proxy_cover',
            'OBJECT_REPORTS' => 'bx_albums',
            'OBJECT_REPORTS_MEDIA' => 'bx_albums_media',
            'OBJECT_VIEWS' => 'bx_albums',
            'OBJECT_VIEWS_MEDIA' => 'bx_albums_media',
            'OBJECT_VOTES' => 'bx_albums',
            'OBJECT_VOTES_MEDIA' => 'bx_albums_media',
            'OBJECT_REACTIONS' => 'bx_albums_reactions',
            'OBJECT_SCORES' => 'bx_albums',
            'OBJECT_SCORES_MEDIA' => 'bx_albums_media',
            'OBJECT_FAVORITES' => 'bx_albums',
            'OBJECT_FAVORITES_MEDIA' => 'bx_albums_media',
            'OBJECT_FEATURED' => 'bx_albums',
            'OBJECT_FEATURED_MEDIA' => 'bx_albums_media',
            'OBJECT_METATAGS' => 'bx_albums',
            'OBJECT_METATAGS_MEDIA' => 'bx_albums_media',
            'OBJECT_METATAGS_MEDIA_CAMERA' => 'bx_albums_media_camera',
            'OBJECT_COMMENTS' => 'bx_albums',
            'OBJECT_NOTES' => 'bx_albums_notes',
            'OBJECT_COMMENTS_MEDIA' => 'bx_albums_media',
            'OBJECT_PRIVACY_VIEW' => 'bx_albums_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_albums_allow_view_favorite_list',
            'OBJECT_FORM_ENTRY' => 'bx_albums',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_albums_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_albums_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_albums_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_albums_entry_delete',
            'OBJECT_FORM_MEDIA' => 'bx_albums_media',
            'OBJECT_FORM_MEDIA_DISPLAY_EDIT' => 'bx_albums_media_edit',
            'OBJECT_FORM_MEDIA_DISPLAY_MOVE' => 'bx_albums_media_move',
            'OBJECT_FORM_MEDIA_DISPLAY_DELETE' => 'bx_albums_media_delete',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_albums_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_albums_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_MEDIA' => 'bx_albums_view_media', // actions menu on view media page
            'OBJECT_MENU_ACTIONS_VIEW_MEDIA_ALL' => 'bx_albums_view_actions_media', // all actions menu on view media page
            'OBJECT_MENU_ACTIONS_VIEW_MEDIA_UNIT' => 'bx_albums_view_actions_media_unit', // actions menu on media unit
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_albums_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU' => 'bx_albums_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_albums_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'albums-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_albums_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_albums_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_GRID_ADMINISTRATION' => 'bx_albums_administration',
            'OBJECT_GRID_COMMON' => 'bx_albums_common',
            'OBJECT_UPLOADERS' => array('bx_albums_html5', 'bx_albums_crop'),

            'FUNCTION_FOR_GET_ITEM_INFO' => 'getMediaInfoById',

            'BADGES_AVALIABLE' => true,

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_albums_my' => array (
                    'create-album' => 'checkAllowedAdd',
                ),
                'bx_albums_view' => $aMenuItems2Methods,
                'bx_albums_view_media' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-albums-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_albums_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_albums_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'processing' => array (
                    'name' => 'bx_albums-processing',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_albums_txt_processing_awaiting', 'type' => BX_INFORMER_ALERT),
                        'failed' => array('msg' => '_bx_albums_txt_processing_failed', 'type' => BX_INFORMER_ERROR)
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_albums_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_albums_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_albums_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_albums_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_albums_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_albums_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_albums_txt_sample_score_down_single',
                'txt_sample_action_changed' => '_bx_albums_txt_sample_action_changed',
                'txt_media_single' => '_bx_albums_txt_media_single',
                'txt_media_comment_single' => '_bx_albums_txt_media_comment_single',
            	'txt_media_vote_single' => '_bx_albums_txt_media_vote_single',
                'txt_media_score_up_single' => '_bx_albums_txt_media_score_up_single',
                'txt_media_score_down_single' => '_bx_albums_txt_media_score_down_single',
            	'form_field_author' => '_bx_albums_form_entry_input_author',
            	'grid_action_err_delete' => '_bx_albums_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_albums_grid_txt_account_manager',
                'filter_item_active' => '_bx_albums_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_albums_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_albums_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_albums_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_albums_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_albums_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_albums_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_albums_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_albums_txt_all_entries_in',
            	'txt_all_entries_by_author' => '_bx_albums_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_albums_page_title_browse_by_context',
                'txt_media_exif_camera' => '_bx_albums_txt_media_album_camera',
                'txt_media_exif_focal_length' => '_bx_albums_txt_media_album_focal_length',
                'txt_media_exif_focal_length_value' => '_bx_albums_txt_media_album_focal_length_value',
                'txt_media_exif_aperture' => '_bx_albums_txt_media_album_aperture',
                'txt_media_exif_shutter_speed' => '_bx_albums_txt_media_album_shutter_speed',
                'txt_media_exif_shutter_speed_value' => '_bx_albums_txt_media_album_shutter_speed_value',
                'txt_media_exif_iso' => '_bx_albums_txt_media_album_iso',
            ),
        );

        $this->_aJsClasses = array(
        	'main' => 'BxAlbumsMain',
        	'manage_tools' => 'BxAlbumsManageTools'
        );

        $this->_aJsObjects = array(
        	'main' => 'oBxAlbumsMain',
        	'manage_tools' => 'oBxAlbumsManageTools'
        );

        $this->_aGridObjects = array(
        	'common' => $this->CNF['OBJECT_GRID_COMMON'],
        	'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        	
        );
    }

    public function getAlbumUrl($iId)
    {
        $sUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->CNF['URI_VIEW_ENTRY'] . '&id=' . $iId);

        return bx_absolute_url($sUrl);
    }

    public function getMediaUrl($iId, $sContext = '')
    {
        $sUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->CNF['URI_VIEW_MEDIA'] . '&id=' . $iId);
        if($sContext)
            $sUrl = bx_append_url_params($sUrl, [
                'context' => $sContext
            ]);

        return bx_absolute_url($sUrl);
    }
}

/** @} */
