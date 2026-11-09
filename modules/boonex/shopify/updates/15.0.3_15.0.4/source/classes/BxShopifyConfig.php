<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Shopify Shopify
 * @ingroup     UnaModules
 *
 * @{
 */

class BxShopifyConfig extends BxBaseModTextConfig
{
    protected $_aHtmlIds;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',
            'edit-shopify-entry' => 'checkAllowedEdit',
            'delete-shopify-entry' => 'checkAllowedDelete',
        );

        $this->CNF = array (

            // module icon
            'ICON' => 'shopping-bag',

            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'entries',
            'TABLE_SETTINGS' => $aModule['db_prefix'] . 'settings',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_CODE' => 'code',
            'FIELD_TITLE' => 'title',
            'FIELD_TEXT' => '',
            'FIELD_TEXT_ID' => 'shopify-entry-text',
            'FIELD_CATEGORY' => 'cat',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_PHOTO' => '',
            'FIELD_THUMB' => '',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified

            // page URIs
            'URI_VIEW_ENTRY' => 'view-shopify-entry',
            'URI_AUTHOR_ENTRIES' => 'shopify-author',
            'URI_ENTRIES_BY_CONTEXT' => 'shopify-context',
            'URI_ADD_ENTRY' => 'create-shopify-entry',
            'URI_EDIT_ENTRY' => 'edit-shopify-entry',
            'URI_MANAGE_COMMON' => 'shopify-manage',

            'URL_HOME' => 'page.php?i=shopify-home',
            'URL_POPULAR' => 'page.php?i=shopify-popular',
            'URL_UPDATED' => 'page.php?i=shopify-updated',
            'URL_MANAGE_COMMON' => 'page.php?i=shopify-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=shopify-administration',
            'URL_SETTINGS' => 'page.php?i=shopify-settings',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_shopify_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_shopify_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_shopify_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_shopify_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_shopify_searchable_fields',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_shopify_per_page_browse_showcase',

            // objects
            'OBJECT_STORAGE' => 'bx_shopify_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_shopify_preview',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_shopify_gallery',
            'OBJECT_VIDEOS_TRANSCODERS' => array(),
            'OBJECT_REPORTS' => 'bx_shopify',
            'OBJECT_VIEWS' => 'bx_shopify',
            'OBJECT_VOTES' => 'bx_shopify',
            'OBJECT_REACTIONS' => 'bx_shopify_reactions',
            'OBJECT_SCORES' => 'bx_shopify',
            'OBJECT_FAVORITES' => 'bx_shopify',
            'OBJECT_FEATURED' => 'bx_shopify',
            'OBJECT_METATAGS' => 'bx_shopify',
            'OBJECT_COMMENTS' => 'bx_shopify',
            'OBJECT_NOTES' => 'bx_shopify_notes',
            'OBJECT_CATEGORY' => 'bx_shopify_cats',
            'OBJECT_PRIVACY_VIEW' => 'bx_shopify_allow_view_to',
            'OBJECT_FORM_ENTRY' => 'bx_shopify',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => 'bx_shopify_entry_view',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_shopify_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => 'bx_shopify_entry_edit',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_shopify_entry_delete',
            'OBJECT_FORM_SETTINGS' => 'bx_shopify_settings',
            'OBJECT_FORM_SETTINGS_DISPLAY_EDIT' => 'bx_shopify_settings_edit',
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_shopify_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_shopify_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_shopify_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU' => 'bx_shopify_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_shopify_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'shopify-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_shopify_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_shopify_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_GRID_ADMINISTRATION' => 'bx_shopify_administration',
            'OBJECT_GRID_COMMON' => 'bx_shopify_common',
            'OBJECT_UPLOADERS' => array('sys_html5'),

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_shopify_my' => array (
                    'create-shopify-entry' => 'checkAllowedAdd',
                ),
                'bx_shopify_view' => $aMenuItems2Methods,
            ),
            
            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-shopify-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_shopify_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_shopify_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
            ),

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_shopify_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_shopify_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_shopify_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_shopify_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_shopify_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_shopify_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_shopify_txt_sample_score_down_single',
            	'form_field_author' => '_bx_shopify_form_entry_input_author',
            	'grid_action_err_delete' => '_bx_shopify_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_shopify_grid_txt_account_manager',
                'filter_item_active' => '_bx_shopify_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_shopify_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_shopify_grid_filter_item_title_adm_pending',
            	'filter_item_select_one_filter1' => '_bx_shopify_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_shopify_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_shopify_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_shopify_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_shopify_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_shopify_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_shopify_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_shopify_page_title_browse_by_context',
            	'txt_pict_use_as_thumb' => '_bx_shopify_form_entry_input_picture_use_as_thumb'
            ),
        );

        $this->_aJsClasses = array(
            'shop' => 'BxShopifyShop', 
            'manage_tools' => 'BxShopifyManageTools'
        );

        $this->_aJsObjects = array(
            'shop' => 'oBxShopifyShop{profile_id}',
            'manage_tools' => 'oBxShopifyManageTools'
        );

        $this->_aGridObjects = array(
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        );

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array(
        	'entry_buy' => $sHtmlPrefix . '-entry-buy',
        	'entry_content' => $sHtmlPrefix . '-entry-content',
        	'entry_attachments' => $sHtmlPrefix . '-entry-attachments',
            'entry_attachment_sample' => $sHtmlPrefix . '-entry-attachment-sample',

            'unit' => $sHtmlPrefix . '-unit-',
        );
    }

    public function getHtmlIds($sKey = '')
    {
        if(empty($sKey))
            return $this->_aHtmlIds;

        return isset($this->_aHtmlIds[$sKey]) ? $this->_aHtmlIds[$sKey] : '';
    }

    public function getJsObjectShop($iProfileId)
    {
        return bx_replace_markers($this->getJsObject('shop'), array(
            'profile_id' => $iProfileId
        ));
    }
}

/** @} */
