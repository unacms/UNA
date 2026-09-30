<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Market Market
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMarketConfig extends BxBaseModTextConfig
{
    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'hide-product' => 'checkAllowedHide',
            'unhide-product' => 'checkAllowedUnhide',
            'approve' => 'checkAllowedApprove',
            'edit-product' => 'checkAllowedEdit',
            'delete-product' => 'checkAllowedDelete',
            'product-more' => 'checkAllowedViewMoreMenu'
        );

        $this->CNF = array (

            // module icon
            'ICON' => 'shopping-cart',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'products',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',
            'TABLE_PHOTOS2ENTRIES' => $aModule['db_prefix'] . 'photos2products',
            'TABLE_FILES2ENTRIES' => $aModule['db_prefix'] . 'files2products',
            'TABLE_FILES' => $aModule['db_prefix'] . 'files',
            'TABLE_DOWNLOADS' => $aModule['db_prefix'] . 'downloads_track',
            'TABLE_LICENSES' => $aModule['db_prefix'] . 'licenses',
            'TABLE_LICENSES_DELETED' => $aModule['db_prefix'] . 'licenses_deleted',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_NAME' => 'name',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'product-text',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_HEADER_BEG_SINGLE' => 'header_beg_single',
            'FIELD_WARNING_SINGLE' => 'warning_single',
            'FIELD_PRICE_SINGLE' => 'price_single',
            'FIELD_HEADER_END_SINGLE' => 'header_end_single',
            'FIELD_HEADER_BEG_RECURRING' => 'header_beg_recurring',
            'FIELD_WARNING_RECURRING' => 'warning_recurring',
            'FIELD_PRICE_RECURRING' => 'price_recurring',
            'FIELD_DURATION_RECURRING' => 'duration_recurring',
            'FIELD_TRIAL_RECURRING' => 'trial_recurring',
            'FIELD_HEADER_END_RECURRING' => 'header_end_recurring',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_ALLOW_PURCHASE_TO' => 'allow_purchase_to',
            'FIELD_ALLOW_COMMENT_TO' => 'allow_comment_to',
            'FIELD_ALLOW_VOTE_TO' => 'allow_vote_to',
            'FIELD_CF' => 'cf',
            'FIELD_SUBENTRIES' => 'subentries',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_THUMB' => 'thumb',
            'FIELD_COVER_RAW' => 'cover_raw',
            'FIELD_COVER' => 'cover',
            'FIELD_COVER_POSITION' => 'cover_data',
            'FIELD_FILE' => 'files',
            'FIELD_PACKAGE' => 'package',
            'FIELD_NOTES_PURCHASED' => 'notes_purchased',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_FEATURED' => 'featured',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELDS_QUICK_SEARCH' => array('title'),
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            
            // page URIs
            'URI_VIEW_ENTRY' => 'view-product',
            'URI_AUTHOR_ENTRIES' => 'products-author',
            'URI_ENTRIES_BY_CONTEXT' => 'products-context',
            'URI_ADD_ENTRY' => 'create-product',
            'URI_EDIT_ENTRY' => 'edit-product',
            'URI_DOWNLOAD_ENTRY' => 'download-product',
            'URI_MANAGE_COMMON' => 'products-manage',
            'URI_FAVORITES_LIST' => 'products-favorites',

            'URL_HOME' => 'page.php?i=products-home',
            'URL_LATEST' => 'page.php?i=products-latest',
            'URL_FEATURED' => 'page.php?i=products-featured',
            'URL_POPULAR' => 'page.php?i=products-popular',
            'URL_TOP' => 'page.php?i=products-top',
            'URL_UPDATED' => 'page.php?i=products-updated',
            'URL_MANAGE_COMMON' => 'page.php?i=products-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=products-administration',
            'URL_LICENSES_COMMON' => 'page.php?i=products-licenses',
            'URL_LICENSES_ADMINISTRATION' => 'page.php?i=products-licenses-administration',
            'URL_VIEW_ENTRY' => 'page.php?i=view-product&id=',
            'URL_CATEGORY' => 'page.php?i=products-category',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_market_enable_auto_approve',
            'PARAM_NO_PAYMENTS' => 'bx_market_enable_no_payments',
            'PARAM_USE_ICON' => 'bx_market_enable_icon',
            'PARAM_CHARS_SUMMARY' => 'bx_market_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_market_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_market_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_market_searchable_fields',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_market_per_page_for_favorites_lists',
            'PARAM_VISIBLE_CATEGORIES' => 'bx_market_visible_categories',

            // objects            
            'OBJECT_STORAGE' => 'bx_market_photos',
            'OBJECT_STORAGE_FILES' => 'bx_market_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_market_preview',
            'OBJECT_IMAGES_TRANSCODER_ICON' => 'bx_market_icon',
            'OBJECT_IMAGES_TRANSCODER_THUMB' => 'bx_market_thumb',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_market_cover',
            'OBJECT_IMAGES_TRANSCODER_SCREENSHOT' => 'bx_market_screenshot',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_market_gallery',
            'OBJECT_VIDEOS_TRANSCODERS' => array(),
            'OBJECT_REPORTS' => 'bx_market',
            'OBJECT_VIEWS' => 'bx_market',
            'OBJECT_VOTES' => 'bx_market',
            'OBJECT_REACTIONS' => 'bx_market_reactions',
            'OBJECT_SCORES' => 'bx_market',
            'OBJECT_FAVORITES' => 'bx_market',
            'OBJECT_FEATURED' => 'bx_market',
            'OBJECT_METATAGS' => 'bx_market',
            'OBJECT_COMMENTS' => 'bx_market',
            'OBJECT_NOTES' => 'bx_market_notes',
            'OBJECT_CATEGORY' => 'bx_market_cats',
            'OBJECT_PRIVACY_VIEW' => 'bx_market_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_market_allow_view_favorite_list',
            'OBJECT_PRIVACY_PURCHASE' => 'bx_market_allow_purchase_to',
            'OBJECT_PRIVACY_COMMENT' => 'bx_market_allow_comment_to',
            'OBJECT_PRIVACY_VOTE' => 'bx_market_allow_vote_to',
            'OBJECT_FORM_ENTRY' => 'bx_market',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_market_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW_FULL' => 'bx_market_entry_view_full',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_market_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_market_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_market_entry_delete',
            'OBJECT_FORM_LICENSE' => 'bx_market_license',
            'OBJECT_FORM_LICENSE_DISPLAY_EDIT' => 'bx_market_license_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_market_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE' => 'bx_market_view_more', 
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_market_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_market_my', // actions menu on my entries page
            'OBJECT_MENU_ACTIONS_SNIPPET' => 'bx_market_snippet', // actions menu for entry snippet
            'OBJECT_MENU_ACTIONS_SNIPPET_MORE' => 'bx_market_snippet_more', // actions menu (short) from view entry page but created for snippet actions menu
            'OBJECT_MENU_SUBMENU' => 'bx_market_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_market_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'products-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_market_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_market_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_MENU_LICENSES' => 'bx_market_licenses_submenu',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_market_administration',
            'OBJECT_GRID_COMMON' => 'bx_market_common',
            'OBJECT_GRID_LICENSES_ADMINISTRATION' => 'bx_market_licenses_administration',
            'OBJECT_GRID_LICENSES' => 'bx_market_licenses',
            'OBJECT_UPLOADERS' => ['bx_market_html5'],
            'OBJECT_CONNECTION_SUBENTRIES' => 'bx_market_subentries',
            
            'BADGES_AVALIABLE' => true,

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_market_my' => array (
                    'create-product' => 'checkAllowedAdd',
                ),
                'bx_market_view' => $aMenuItems2Methods,
                'bx_market_view_more' => $aMenuItems2Methods,
                'bx_market_snippet_more' => $aMenuItems2Methods,
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-market-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_market_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_market_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
            ),

            // global settings
            'OPTION_ENABLE_RECURRING' => 'bx_market_enable_recurring',
            'OPTION_RECURRING_RESERVE' => 'bx_market_recurring_reserve',

            // email templates
            'ETEMPLATE_PURCHASED' => 'bx_market_purchased',

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_market_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_market_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_market_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_market_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_market_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_market_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_market_txt_sample_score_down_single',
            	'form_field_author' => '_bx_market_form_entry_input_author',
            	'grid_action_err_delete' => '_bx_market_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_market_grid_txt_account_manager',
                'filter_item_active' => '_bx_market_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_market_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_market_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_market_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_market_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_market_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_market_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_market_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_market_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_market_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_market_page_title_browse_by_context',
                'txt_all_categories' => '_bx_market_txt_all_categories',
                'txt_per_day' => '_bx_market_txt_per_day',
                'txt_per_day_short' => '_bx_market_txt_per_day_short',
                'txt_per_week' => '_bx_market_txt_per_week',
                'txt_per_week_short' => '_bx_market_txt_per_week_short',
                'txt_per_month' => '_bx_market_txt_per_month',
                'txt_per_month_short' => '_bx_market_txt_per_month_short',
            	'txt_per_year' => '_bx_market_txt_per_year',
                'txt_per_year_short' => '_bx_market_txt_per_year_short',
                
            ),
        );

        $this->_aJsClasses = array(
            'form' => 'BxMarketForm',
            'entry' => 'BxMarketEntry',
            'manage_tools' => 'BxMarketManageTools',
            'licenses' => 'BxMarketLicenses'
        );

        $this->_aJsObjects = array(
            'form' => 'oBxMarketForm',
            'entry' => 'oBxMarketEntry',
            'manage_tools' => 'oBxMarketManageTools',
            'licenses' => 'oBxMarketLicenses'
        );

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
            'licenses_administration' => $this->CNF['OBJECT_GRID_LICENSES_ADMINISTRATION'],
            'licenses' => $this->CNF['OBJECT_GRID_LICENSES'],
        );
    }

    public function getEntryName($sName)
    {
        return uriGenerate($sName, $this->CNF['TABLE_ENTRIES'], $this->CNF['FIELD_NAME'], ['lowercase' => false]);
    }
}

/** @} */
