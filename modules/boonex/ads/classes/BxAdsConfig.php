<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Ads Ads
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolInformer');

class BxAdsConfig extends BxBaseModTextConfig
{
    protected $_oDb;

    protected $_bAuction;

    protected $_bSources;

    protected $_bPromotion;
    protected $_fPromotionCpm;

    protected $_sCacheEngineShopify;
    protected $_iCacheLifetimeShopify;

    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $aMenuItems2Methods = array (
            'approve' => 'checkAllowedApprove',

            'view-ad-promotion' => 'checkAllowedEdit',
            'edit-ad' => 'checkAllowedEdit',
            'edit-ad-budget' => 'checkAllowedEdit',

            'delete-ad' => 'checkAllowedDelete',
        );

        $this->CNF = array_merge($this->CNF, array (

            // module icon
            'ICON' => 'ad',

            // database tables
            'TABLE_SOURCES' => $aModule['db_prefix'] . 'sources',
            'TABLE_SOURCES_OPTIONS' => $aModule['db_prefix'] . 'sources_options',
            'TABLE_SOURCES_OPTIONS_VALUES' => $aModule['db_prefix'] . 'sources_options_values',
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'entries',
            'TABLE_ENTRIES_FULLTEXT' => 'title_text',
            'TABLE_CATEGORIES' => $aModule['db_prefix'] . 'categories',
            'TABLE_CATEGORIES_TYPES' => $aModule['db_prefix'] . 'categories_types',
            'TABLE_INTERESTED_TRACK' => $aModule['db_prefix'] . 'interested_track',
            'TABLE_COMMODITIES' => $aModule['db_prefix'] . 'commodities',
            'TABLE_LICENSES' => $aModule['db_prefix'] . 'licenses',
            'TABLE_LICENSES_DELETED' => $aModule['db_prefix'] . 'licenses_deleted',
            'TABLE_PROMO_LICENSES' => $aModule['db_prefix'] . 'promo_licenses',
            'TABLE_PROMO_LICENSES_DELETED' => $aModule['db_prefix'] . 'promo_licenses_deleted',
            'TABLE_PROMO_TRACKER' => $aModule['db_prefix'] . 'promo_tracker',
            'TABLE_OFFERS' => $aModule['db_prefix'] . 'offers',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_SOLD' => 'sold',
            'FIELD_SHIPPED' => 'shipped',
            'FIELD_RECEIVED' => 'received',
            'FIELD_SOURCE_TYPE' => 'source_type',
            'FIELD_SOURCE' => 'source',
            'FIELD_TITLE' => 'title',
            'FIELD_URL' => 'url',
            'FIELD_NAME' => 'name',
            'FIELD_TEXT' => 'text',
            'FIELD_TEXT_ID' => 'ad-text',
            'FIELD_CATEGORY' => 'category',
            'FIELD_CATEGORY_VIEW' => 'category_view',
            'FIELD_CATEGORY_SELECT' => 'category_select',
            'FIELD_TAGS' => 'tags',
            'FIELD_PRICE' => 'price',
            'FIELD_PRICE_SINGLE' => 'price',
            'FIELD_AUCTION' => 'auction',
            'FIELD_QUANTITY' => 'quantity',
            'FIELD_SINGLE' => 'single',
            'FIELD_YEAR' => 'year',
            'FIELD_NOTES_PURCHASED' => 'notes_purchased',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
            'FIELD_CF' => 'cf',
            'FIELD_COVER' => 'covers',
            'FIELD_PHOTO' => 'pictures',
            'FIELD_VIDEO' => 'videos',
            'FIELD_FILE' => 'files',
            'FIELD_POLL' => 'polls',
            'FIELD_THUMB' => 'thumb',
            'FIELD_LINK' => 'link',
            'FIELD_ATTACHMENTS' => 'attachments',
            'FIELD_BUDGET_TOTAL' => 'budget_total',
            'FIELD_BUDGET_DAILY' => 'budget_daily',
            'FIELD_VIEWS' => 'views',
            'FIELD_COMMENTS' => 'comments',
            'FIELD_SEG' => 'seg',
            'FIELD_SEG_GENDER' => 'seg_gender',
            'FIELD_SEG_AGE' => 'seg_age',
            'FIELD_SEG_AGE_MIN' => 'seg_age_min',
            'FIELD_SEG_AGE_MAX' => 'seg_age_max',
            'FIELD_SEG_COUNTRY' => 'seg_country',
            'FIELD_STATUS' => 'status',
            'FIELD_STATUS_ADMIN' => 'status_admin',
            'FIELD_LOCATION' => 'location',
            'FIELD_LOCATION_PREFIX' => 'location',
            'FIELD_LABELS' => 'labels',
            'FIELD_ANONYMOUS' => 'anonymous',
            'FIELDS_WITH_KEYWORDS' => 'auto', // can be 'auto', array of fields or comma separated string of field names, works only when OBJECT_METATAGS is specified
            'FIELDS_DELAYED_PROCESSING' => 'videos', // can be array of fields or comma separated string of field names

            'FIELD_OFR_ID' => 'id',
            'FIELD_OFR_CONTENT' => 'content_id',
            'FIELD_OFR_AUTHOR' => 'author_id',
            'FIELD_OFR_ADDED' => 'added',
            'FIELD_OFR_CHANGED' => 'changed',
            'FIELD_OFR_AMOUNT' => 'amount',
            'FIELD_OFR_QUANTITY' => 'quantity',
            'FIELD_OFR_TOTAL' => 'total', // form field only
            'FIELD_OFR_STATUS' => 'status',

            // og:type of an entry page
            'OG_TYPE' => 'product',

            // page URIs
            'URI_VIEW_ENTRY' => 'view-ad',
            'URI_VIEW_ENTRY_OFFERS' => 'view-ad-offers',
            'URI_VIEW_ENTRY_PROMOTION' => 'view-ad-promotion',
            'URI_AUTHOR_ENTRIES' => 'ads-author',
            'URI_ENTRIES_BY_CONTEXT' => 'ads-context',
            'URI_ADD_ENTRY' => 'create-ad',
            'URI_EDIT_ENTRY' => 'edit-ad',
            'URI_EDIT_ENTRY_BUDGET' => 'edit-ad-budget',
            'URI_MANAGE_COMMON' => 'ads-manage',

            'URL_HOME' => 'page.php?i=ads-home',
            'URL_POPULAR' => 'page.php?i=ads-popular',
            'URL_UPDATED' => 'page.php?i=ads-updated',
            'URL_CATEGORIES' => 'page.php?i=ads-categories',
            'URL_MANAGE_COMMON' => 'page.php?i=ads-manage',
            'URL_MANAGE_ADMINISTRATION' => 'page.php?i=ads-administration',
            'URL_SOURCES' => 'page.php?i=ads-sources',
            'URI_FAVORITES_LIST' => 'ads-favorites',
            'URL_LICENSES_COMMON' => 'page.php?i=ads-licenses',
            'URL_LICENSES_ADMINISTRATION' => 'page.php?i=ads-licenses-administration',

            'GET_PARAM_CATEGORY' => 'category',

            // some params
            'PARAM_AUTO_APPROVE' => 'bx_ads_enable_auto_approve',
            'PARAM_CHARS_SUMMARY' => 'bx_ads_summary_chars',
            'PARAM_CHARS_SUMMARY_PLAIN' => 'bx_ads_plain_summary_chars',
            'PARAM_NUM_RSS' => 'bx_ads_rss_num',
            'PARAM_SEARCHABLE_FIELDS' => 'bx_ads_searchable_fields',
            'PARAM_PER_PAGE_FOR_FAVORITES_LISTS' => 'bx_ads_per_page_for_favorites_lists',
            'PARAM_PER_PAGE_BROWSE_SHOWCASE' => 'bx_ads_per_page_browse_showcase',
            'PARAM_LIFETIME' => 'bx_ads_lifetime',
            'PARAM_LIFETIME_OFFERS' => 'bx_ads_offer_lifetime',
            'PARAM_USE_IIN' => 'bx_ads_internal_interested_notification',
            'PARAM_CATEGORY_LEVEL_MAX' => 1,
            'PARAM_USE_AUCTION' => 'bx_ads_enable_auction',
            'PARAM_USE_SOURCES' => 'bx_ads_enable_sources',
            'PARAM_USE_PROMOTION' => 'bx_ads_enable_promotion',
            'PARAM_PROMOTION_CPM' => 'bx_ads_promotion_cpm',

            'PARAM_LINKS_ENABLED' => true,

            // objects
            'OBJECT_STORAGE' => 'bx_ads_covers',
            'OBJECT_STORAGE_FILES' => 'bx_ads_files',
            'OBJECT_STORAGE_PHOTOS' => 'bx_ads_photos',
            'OBJECT_STORAGE_VIDEOS' => 'bx_ads_videos',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW' => 'bx_ads_preview',
            'OBJECT_IMAGES_TRANSCODER_GALLERY' => 'bx_ads_gallery',
            'OBJECT_IMAGES_TRANSCODER_COVER' => 'bx_ads_cover',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_FILES' => 'bx_ads_preview_files',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_FILES' => 'bx_ads_gallery_files',
            'OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS' => 'bx_ads_preview_photos',
            'OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS' => 'bx_ads_gallery_photos',
            'OBJECT_IMAGES_TRANSCODER_VIEW_PHOTOS' => 'bx_ads_view_photos',
            'OBJECT_VIDEOS_TRANSCODERS' => array(
                'poster' => 'bx_ads_videos_poster', 
            	'poster_preview' => 'bx_ads_videos_poster_preview',
            	'mp4' => 'bx_ads_videos_mp4', 
            	'mp4_hd' => 'bx_ads_videos_mp4_hd'
            ),
            'OBJECT_VIDEO_TRANSCODER_HEIGHT' => '480px',
            'OBJECT_REPORTS' => 'bx_ads',
            'OBJECT_VIEWS' => 'bx_ads',
            'OBJECT_VOTES' => 'bx_ads',
            'OBJECT_REACTIONS' => 'bx_ads_reactions',
            'OBJECT_SCORES' => 'bx_ads',
            'OBJECT_FAVORITES' => 'bx_ads',
            'OBJECT_FEATURED' => 'bx_ads',
            'OBJECT_METATAGS' => 'bx_ads',
            'OBJECT_COMMENTS' => 'bx_ads',
            'OBJECT_NOTES' => 'bx_ads_notes',
            'OBJECT_REVIEWS' => 'bx_ads_reviews',
            'OBJECT_CATEGORY' => '',
            'OBJECT_PRIVACY_VIEW' => 'bx_ads_allow_view_to',
            'OBJECT_PRIVACY_LIST_VIEW' => 'bx_ads_allow_view_favorite_list',
            'OBJECT_FORM_SOURCES_DETAILS' => 'bx_ads_form_sources_details',
            'OBJECT_FORM_SOURCES_DETAILS_DISPLAY_EDIT' => 'bx_ads_form_sources_details_edit',
            'OBJECT_FORM_CATEGORY' => 'bx_ads_category',
            'OBJECT_FORM_CATEGORY_DISPLAY_ADD' => 'bx_ads_category_add',
            'OBJECT_FORM_CATEGORY_DISPLAY_EDIT' => 'bx_ads_category_edit',
            'OBJECT_FORM_CATEGORY_DISPLAY_DELETE' => 'bx_ads_category_delete',
            'OBJECT_FORM_ENTRY' => 'bx_ads',
            'OBJECT_FORM_ENTRY_DISPLAY_VIEW' => '',
            'OBJECT_FORM_ENTRY_DISPLAY_ADD' => 'bx_ads_entry_add',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT' => '',
            'OBJECT_FORM_ENTRY_DISPLAY_EDIT_BUDGET' => 'bx_ads_entry_edit_budget',
            'OBJECT_FORM_ENTRY_DISPLAY_DELETE' => 'bx_ads_entry_delete',
            'OBJECT_FORM_POLL' => 'bx_ads_poll',
            'OBJECT_FORM_POLL_DISPLAY_ADD' => 'bx_ads_poll_add',
            'OBJECT_FORM_OFFER' => 'bx_ads_offer',
            'OBJECT_FORM_OFFER_DISPLAY_ADD' => 'bx_ads_offer_add',
            'OBJECT_FORM_OFFER_DISPLAY_VIEW' => 'bx_ads_offer_view',
            'OBJECT_MENU_ENTRY_ATTACHMENTS' => 'bx_ads_entry_attachments', // attachments menu in create/edit forms
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY' => 'bx_ads_view', // actions menu on view entry page
            'OBJECT_MENU_ACTIONS_VIEW_ENTRY_ALL' => 'bx_ads_view_actions', // all actions menu on view entry page
            'OBJECT_MENU_ACTIONS_MY_ENTRIES' => 'bx_ads_my', // actions menu on my entries page
            'OBJECT_MENU_SUBMENU' => 'bx_ads_submenu', // main module submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY' => 'bx_ads_view_submenu', // view entry submenu
            'OBJECT_MENU_SUBMENU_VIEW_ENTRY_MAIN_SELECTION' => 'ads-home', // first item in view entry submenu from main module submenu
            'OBJECT_MENU_SNIPPET_META' => 'bx_ads_snippet_meta', // menu for snippet meta info
            'OBJECT_MENU_MANAGE_TOOLS' => 'bx_ads_menu_manage_tools', //manage menu in content administration tools
            'OBJECT_MENU_LICENSES' => 'bx_ads_licenses_submenu',
            'OBJECT_GRID_CATEGORIES' => 'bx_ads_categories',
            'OBJECT_GRID_ADMINISTRATION' => 'bx_ads_administration',
            'OBJECT_GRID_COMMON' => 'bx_ads_common',
            'OBJECT_GRID_LICENSES_ADMINISTRATION' => 'bx_ads_licenses_administration',
            'OBJECT_GRID_LICENSES' => 'bx_ads_licenses',
            'OBJECT_GRID_OFFERS' => 'bx_ads_offers',
            'OBJECT_GRID_OFFERS_ALL' => 'bx_ads_offers_all',
            'OBJECT_UPLOADERS' => array('bx_ads_simple', 'bx_ads_html5'),
            'OBJECT_PROMOTION_CHARTS' => ['bx_ads_promotion_growth', 'bx_ads_promotion_growth_speed'],

            'BADGES_AVALIABLE' => true,

            // menu items which visibility depends on custom visibility checking
            'MENU_ITEM_TO_METHOD' => array (
                'bx_ads_my' => array (
                    'create-ad' => 'checkAllowedAdd',
                ),
                'bx_ads_view' => $aMenuItems2Methods,
                'bx_ads_view_submenu' => $aMenuItems2Methods
            ),

            // informer messages
            'INFORMERS' => array (
                'approving' => array (
                    'name' => 'bx-ads-approving',
                    'map' => array (
                        'pending' => array('msg' => '_bx_ads_txt_msg_status_pending', 'type' => BX_INFORMER_ALERT),
                        'hidden' => array('msg' => '_bx_ads_txt_msg_status_hidden', 'type' => BX_INFORMER_ERROR),
                    ),
                ),
                'processing' => array (
                    'name' => 'bx-ads-processing',
                    'map' => array (
                        'awaiting' => array('msg' => '_bx_ads_txt_processing_awaiting', 'type' => BX_INFORMER_ALERT),
                        'failed' => array('msg' => '_bx_ads_txt_processing_failed', 'type' => BX_INFORMER_ERROR)
                    ),
                ),
                'auction' => array (
                    'name' => 'bx-ads-auction',
                    'map' => array (
                        'offer' => array('msg' => '_bx_ads_txt_msg_auction_offer', 'type' => BX_INFORMER_INFO),
                        'sold' => array('msg' => '_bx_ads_txt_msg_auction_sold', 'type' => BX_INFORMER_INFO)
                    ),
                ),
                'promotion' => [
                    'name' => 'bx-ads-promotion',
                    'map' => [
                        'unpaid' => ['msg' => '_bx_ads_txt_msg_promotion_unpaid', 'type' => BX_INFORMER_ALERT],
                    ],
                ]
            ),

            // email templates
            'ETEMPLATE_INTERESTED' => 'bx_ads_interested',
            'ETEMPLATE_PURCHASED' => 'bx_ads_purchased',
            'ETEMPLATE_SHIPPED' => 'bx_ads_shipped',
            'ETEMPLATE_RECEIVED' => 'bx_ads_received',
            'ETEMPLATE_OFFER_ADDED' => 'bx_ads_offer_added',
            'ETEMPLATE_OFFER_ACCEPTED' => 'bx_ads_offer_accepted',
            'ETEMPLATE_OFFER_DECLINED' => 'bx_ads_offer_declined',
            'ETEMPLATE_OFFER_CANCELED' => 'bx_ads_offer_canceled',

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_ads_txt_sample_single',
            	'txt_sample_single_with_article' => '_bx_ads_txt_sample_single_with_article',
            	'txt_sample_comment_single' => '_bx_ads_txt_sample_comment_single',
            	'txt_sample_vote_single' => '_bx_ads_txt_sample_vote_single',
                'txt_sample_reaction_single' => '_bx_ads_txt_sample_reaction_single',
                'txt_sample_score_up_single' => '_bx_ads_txt_sample_score_up_single',
                'txt_sample_score_down_single' => '_bx_ads_txt_sample_score_down_single',
                'txt_sample_interest_single' => '_bx_ads_txt_sample_interest_single',
                'txt_status_offer' => '_bx_ads_txt_status_offer',
                'txt_status_sold' => '_bx_ads_txt_status_sold',
                'form_field_author' => '_bx_ads_form_entry_input_author',
                'form_field_covers_uploader_simple' => '_bx_ads_form_entry_input_covers_uploader_simple_title',
                'form_field_covers_uploader_html5' => '_bx_ads_form_entry_input_covers_uploader_html5_title',
            	'grid_action_err_delete' => '_bx_ads_grid_action_err_delete',
            	'grid_txt_account_manager' => '_bx_ads_grid_txt_account_manager',
                'filter_item_active' => '_bx_ads_grid_filter_item_title_adm_active',
            	'filter_item_hidden' => '_bx_ads_grid_filter_item_title_adm_hidden',
                'filter_item_pending' => '_bx_ads_grid_filter_item_title_adm_pending',
                'filter_item_unpaid' => '_bx_ads_grid_filter_item_title_adm_unpaid',
            	'filter_item_select_one_filter1' => '_bx_ads_grid_filter_item_title_adm_select_one_filter1',
                'filter_item_select_one_filter2' => '_bx_ads_grid_filter_item_title_adm_select_one_filter2',
            	'menu_item_manage_my' => '_bx_ads_menu_item_title_manage_my',
            	'menu_item_manage_all' => '_bx_ads_menu_item_title_manage_all',
                'txt_all_entries_by' => '_bx_ads_txt_all_entries_by',
                'txt_all_entries_in' => '_bx_ads_txt_all_entries_in',
                'txt_all_entries_by_author' => '_bx_ads_page_title_browse_by_author',
                'txt_all_entries_by_context' => '_bx_ads_page_title_browse_by_context',
                'txt_err_cannot_perform_action' => '_bx_ads_txt_err_cannot_perform_action',
                'txt_poll_form_answers_add' => '_bx_ads_form_poll_input_answers_add',
                'txt_poll_menu_view_answers' => '_bx_ads_txt_poll_view_answers',
                'txt_poll_menu_view_results' => '_bx_ads_txt_poll_view_results',
                'txt_poll_answer_vote_do_by' => '_bx_ads_txt_poll_answer_vote_do_by',
                'txt_poll_answer_vote_counter' => '_bx_ads_txt_poll_answer_vote_counter',
                'txt_poll_answer_vote_percent' => '_bx_ads_txt_poll_answer_vote_percent',
                'txt_link_form_err_delete' => '_bx_ads_form_entry_input_link_err_delete',
                'txt_display_add' => '_bx_ads_txt_display_title_add',
                'txt_display_edit' => '_bx_ads_txt_display_title_edit',
                'txt_display_view' => '_bx_ads_txt_display_title_view',
                'txt_cd_ct_product' => '_bx_ads_txt_cd_ct_product',
                'txt_cd_ct_promotion' => '_bx_ads_txt_cd_ct_promotion',
                'chart_label_impressions' => '_bx_ads_chart_label_impressions',
                'chart_label_clicks' => '_bx_ads_chart_label_clicks',
                'chart_label_roi_local' => '_bx_ads_chart_label_roi_local',
                'chart_label_roi_source' => '_bx_ads_chart_label_roi_source',
                'chart_label_roi_investment' => '_bx_ads_chart_label_roi_investment',
            ),
        ));

        $this->_aJsClasses = array_merge($this->_aJsClasses, [
            'main' => 'BxAdsMain',
            'manage_tools' => 'BxAdsManageTools',
            'studio' => 'BxAdsStudio',
            'entry' => 'BxAdsEntry',
            'form' => 'BxAdsForm',
            'form_offer' => 'BxAdsFormOffer',
        ]);

        $this->_aJsObjects = array_merge($this->_aJsObjects, [
            'main' => 'oBxAdsMain',
            'manage_tools' => 'oBxAdsManageTools',
            'studio' => 'oBxAdsStudio',
            'entry' => 'oBxAdsEntry',
            'form' => 'oBxAdsForm',
            'form_offer' => 'oBxAdsFormOffer',
        ]);

        $this->_aGridObjects = [
            'categories' => $this->CNF['OBJECT_GRID_CATEGORIES'],
            'common' => $this->CNF['OBJECT_GRID_COMMON'],
            'administration' => $this->CNF['OBJECT_GRID_ADMINISTRATION'],
        ];

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'unit' => $sPrefix . '-unit-',
            'offer_popup' =>  $sPrefix . '-offer-popup',
        ]);

        $this->_bAttachmentsInTimeline = true;

        $this->_bPromotion = false;
        $this->_fPromotionCpm = 0;

        $this->_sCacheEngineShopify = 'File';
        $this->_iCacheLifetimeShopify = 2419200; //1 month
    }

    public function init(&$oDb)
    {
        $this->_oDb = &$oDb;

        $this->_bSources = getParam($this->CNF['PARAM_USE_SOURCES']) == 'on';

        $this->_bAuction = getParam($this->CNF['PARAM_USE_AUCTION']) == 'on';

        $this->_bPromotion = getParam($this->CNF['PARAM_USE_PROMOTION']) == 'on';
        if($this->_bPromotion) {
            $this->_fPromotionCpm = (float)getParam($this->CNF['PARAM_PROMOTION_CPM']);
        }
    }

    public function getActiveStatus()
    {
        return [BX_BASE_MOD_TEXT_STATUS_ACTIVE];
    }

    public function getActiveStatusAdmin()
    {
        return [BX_BASE_MOD_TEXT_STATUS_ACTIVE];
    }

    public function isSources()
    {
        return $this->_bSources;
    }

    public function isAuction()
    {
        return $this->_bAuction;
    }

    public function isPromotion()
    {
        return $this->_bPromotion;
    }

    public function getEntryName($sName)
    {
        return uriGenerate($sName, $this->CNF['TABLE_ENTRIES'], $this->CNF['FIELD_NAME'], ['lowercase' => false]);
    }

    public function getDay($iTimestamp = null)
    {
        return mktime(0, 0, 0, date("m", $iTimestamp), date("d", $iTimestamp), date("Y", $iTimestamp));
    }

    public function getPromotionCpm()
    {
        return $this->_fPromotionCpm;
    }
    
    public function getCacheEngineShopify()
    {
        return $this->_sCacheEngineShopify;
    }

    public function getCacheLifetimeShopify()
    {
        return $this->_iCacheLifetimeShopify;
    }

    public function getCacheKeyShopify()
    {
        return 'bx_ads_shopify_' . bx_site_hash() . '.php';
    }
    
    public function getRandomWeightedItem($aWeightedValues)
    {
        $iRand = mt_rand(1, (int)array_sum($aWeightedValues));
        foreach($aWeightedValues as $iKey => $iValue)
            if(($iRand -= $iValue) <= 0)
                return $iKey;
    }
}

/** @} */
