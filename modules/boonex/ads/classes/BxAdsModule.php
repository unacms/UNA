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

define('BX_ADS_STATUS_OFFER', 'offer');
define('BX_ADS_STATUS_SOLD', 'sold');

define('BX_ADS_STATUS_ADMIN_UNPAID', 'unpaid');

define('BX_ADS_COMMODITY_TYPE_PRODUCT', 'product');
define('BX_ADS_COMMODITY_TYPE_PROMOTION', 'promotion');

define('BX_ADS_OFFER_STATUS_ACCEPTED', 'accepted');
define('BX_ADS_OFFER_STATUS_AWAITING', 'awaiting');
define('BX_ADS_OFFER_STATUS_DECLINED', 'declined');
define('BX_ADS_OFFER_STATUS_CANCELED', 'canceled');
define('BX_ADS_OFFER_STATUS_PAID', 'paid');

/**
 * Ads module
 */
class BxAdsModule extends BxBaseModTextModule
{
    protected $_aOfferStatuses;

    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);

        $CNF = &$this->_oConfig->CNF;

        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, array(
            $CNF['FIELD_CATEGORY_VIEW'],
            $CNF['FIELD_CATEGORY_SELECT']
        ));

        $this->_aOfferStatuses = array(
            BX_ADS_OFFER_STATUS_ACCEPTED,
            BX_ADS_OFFER_STATUS_AWAITING,
            BX_ADS_OFFER_STATUS_DECLINED
        );
    }
    
    public function decodeDataApi ($aData, $bExtended = false)
    {
        $CNF = $this->_oConfig->CNF;
        
        $aResult = array_merge(parent::decodeDataApi($aData, $bExtended), [
            $CNF['FIELD_PRICE'] => $aData[$CNF['FIELD_PRICE']],
            $CNF['FIELD_QUANTITY'] => $aData[$CNF['FIELD_QUANTITY']],
            $CNF['FIELD_NOTES_PURCHASED'] => $aData[$CNF['FIELD_NOTES_PURCHASED']]
        ]);

        if($this->_oConfig->isSources() && !empty($aData[$CNF['FIELD_URL']]))
            $aResult[$CNF['FIELD_URL']] = $aData[$CNF['FIELD_URL']];

        return $aResult;
    }

    public function actionGetSource()
    {
        $aEntries = $this->serviceGetSourceData();

        header('Content-Type:text/javascript; charset=utf-8');
        echo(json_encode($aEntries));
    }
    
    public function serviceGetSourceData()
    {
        $sSourceType = bx_get('source_type');
        if(empty($sSourceType)) {
            $aSource = $this->serviceGetSource($this->_iProfileId);
            if(!empty($aSource) && is_array($aSource))
                $sSourceType = $aSource['name'];
        }

        $sTerm = bx_get('term');

        $aEntries = $this->serviceLoadEntriesFromSourceByTerm($sSourceType, $sTerm);

        return $aEntries;
    }

    public function actionLoadEntryFromSource()
    {
        $sSourceType = bx_process_url_param(bx_process_input(bx_get('source_type')));
        $sSource = bx_process_url_param(bx_process_input(bx_get('source')));
        if(empty($sSourceType) || empty($sSource))
            return echoJson(['code' => 1]);

        $aEntry = $this->serviceLoadEntryFromSource($sSourceType, $sSource);
        if(empty($aEntry) || !is_array($aEntry))
            return echoJson(['code' => 2]);

        return echoJson([
            'code' => 0,
            'fields' => $aEntry
        ]);
    }

    public function actionGetCategoryForm()
    {
        if(($iCategory = bx_get('category')) === false || (int)$iCategory == 0)
            return echoJson(['msg' => _t('_bx_ads_form_entry_input_category_select_err')]);

        return echoJson([
            'eval' => $this->_oConfig->getJsObject('form') . '.onSelectCategory(oData)',
            'content' => $this->serviceGetCreatePostForm([
                'absolute_action_url' => true,
                'dynamic_mode' => true,
                'visibility_auto' => false,
                'context_id' => ($iContextId = bx_get('context_id')) !== false ? (int)$iContextId : false,
            ])
        ]);
    }

    public function actionCheckName()
    {
        $CNF = &$this->_oConfig->CNF;

        $iId = (int)bx_get($CNF['FIELD_ID']);
    	$sTitle = bx_process_input(bx_get($CNF['FIELD_TITLE']));

    	echoJson($this->serviceCheckName($sTitle, $iId));
    }

    public function actionInterested()
    {
        $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        
        $aResult = $this->serviceInterested($iContentId);

        echoJson($aResult);
    }

    public function serviceInterested($iContentId, $iViewer = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return [];

        $iViewer = $iViewer ?: bx_get_logged_profile_id();
        $oViewer = BxDolProfile::getInstance($iViewer);
        if(!$oViewer)
            return [];

        $iContentAuthor = (int)$aContentInfo[$CNF['FIELD_AUTHOR']];
        if($iContentAuthor == $iViewer)
            return ['msg' => _t('_bx_ads_txt_err_your_own')];

        if($this->_oDb->isInterested($iContentId, $iViewer))
            return ['msg' => _t('_bx_ads_txt_err_duplicate')];

        $iInterestId = $this->_oDb->insertInterested(array('entry_id' => $iContentId, 'profile_id' => $iViewer));
        if(!$iInterestId)
            return ['msg' => _t('_bx_ads_txt_err_cannot_perform_action')];

        /**
         * @hooks
         * @hookdef hook-bx_ads-doInterest 'bx_ads', 'doInterest' - hook after 'interested' action was performed
         * - $unit_name - equals `bx_ads`
         * - $action - equals `doInterest`
         * - $object_id - content id
         * - $sender_id - profile id who performed the action
         * - $extra_params - array of additional params with the following array keys:
         *      - `subobject_id` - [int] id of a database table record, created during the action
         *      - `subobject_author_id` - [int] profile id who performed the action
         *      - `object_author_id` - [int] content author profile id
         * @hook @ref hook-bx_ads-doInterest
         */
        bx_alert($this->getName(), 'doInterest', $iContentId, $iViewer, [
            'subobject_id' => $iInterestId, 
            'subobject_author_id' => $iViewer, 

            'object_author_id' => $iContentAuthor
        ]);

        if(getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_INTERESTED'], 0, $iContentAuthor, array(
                'viewer_name' => $oViewer->getDisplayName(),
                'viewer_url' => $oViewer->getUrl(),
                'ad_name' => $aContentInfo[$CNF['FIELD_TITLE']],
                'ad_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                )))
            ));

        return ['msg' => _t('_bx_ads_txt_msg_author_notified')];
    }

    public function actionShow()
    {
        return echoJson($this->_actionChangeStatus(BX_BASE_MOD_TEXT_STATUS_ACTIVE));
    }

    public function actionHide()
    {
        return echoJson($this->_actionChangeStatus(BX_BASE_MOD_TEXT_STATUS_HIDDEN));
    }

    public function actionMakeOffer()
    {
        $CNF = &$this->_oConfig->CNF;
        $sJsObject = $this->_oConfig->getJsObject('entry');

        $iAuthorId = bx_get_logged_profile_id();
        $iContentId = bx_process_input(bx_get('content_id'), BX_DATA_INT);

        if(empty($iAuthorId))
            return echoJson(['code' => 1, 'eval' => 'window.open("' . BxDolPermalinks::getInstance()->permalink('page.php?i=login') . '", "_self");']);

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return echoJson([]);

        if(($mixedCheck = $this->checkAllowedMakeOffer($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return echoJson(['code' => 2, 'msg' => $mixedCheck]);

        $aOffer = $this->_oDb->getOffersBy([
            'type' => 'content_and_author_ids', 
            'content_id' => $iContentId, 
            'author_id' => $iAuthorId, 
            'status' => BX_ADS_OFFER_STATUS_AWAITING
        ]);

        if(!empty($aOffer) && is_array($aOffer))
            return echoJson(['code' => 3, 'msg' => _t('_bx_ads_txt_err_duplicate')]);

        $aOffer = $this->_oDb->getOffersBy([
            'type' => 'content_and_author_ids', 
            'content_id' => $iContentId, 
            'author_id' => $iAuthorId, 
            'status' => BX_ADS_OFFER_STATUS_ACCEPTED
        ]);

        if(!empty($aOffer) && is_array($aOffer))
            return echoJson(['code' => 4, 'msg' => _t('_bx_ads_txt_err_offer_accepted')]);

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_OFFER'], $CNF['OBJECT_FORM_OFFER_DISPLAY_ADD']);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . bx_append_url_params($this->_oConfig->getBaseUri() . 'make_offer', ['content_id' => $iContentId]);
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iQuantity = (int)$oForm->getCleanValue($CNF['FIELD_OFR_QUANTITY']);
            $iQuantityAvailable = $this->getAvailableQuantity($aContentInfo);
            if($iQuantity > $iQuantityAvailable)
                return echoJson(['code' => 5, 'msg' => _t('_bx_ads_txt_err_offer_wrong_quantity', $iQuantityAvailable)]);

            $aValToAdd = ['content_id' => $iContentId, 'author_id' => $iAuthorId];

            if(($iId = (int)$oForm->insert($aValToAdd)) != 0) {
                $this->checkAllowedMakeOffer($aContentInfo, true);

                $this->onOfferAdded($iId, $aResult);

                $aResult = ['code' => 0, 'msg' => _t('_bx_ads_txt_msg_offer_added'), 'eval' => $sJsObject . '.onMakeOffer(oData);', 'id' => $iId];
            }
            else
                $aResult = ['code' => 6, 'msg' => _t('_bx_ads_txt_err_cannot_perform_action')];

            return echoJson($aResult);
        }

        $sContent = BxTemplFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('offer_popup'), $this->_oTemplate->parseHtmlByName('offer_popup.html', array(
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true)
        )));

        return echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false, 'removeOnClose' => true))));
    }

    public function actionViewOffer()
    {
        $CNF = &$this->_oConfig->CNF;

        $iAuthorId = bx_get_logged_profile_id();
        $iOfferId = bx_process_input(bx_get('id'), BX_DATA_INT);

        $aOffer = $this->_oDb->getOffersBy(array('type' => 'id', 'id' => $iOfferId));
        if(empty($aOffer) || !is_array($aOffer))
            return echoJson(array());
        
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_OFFER'], $CNF['OBJECT_FORM_OFFER_DISPLAY_VIEW']);
        $oForm->initChecker($aOffer);

        $sContent = BxTemplFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('offer_popup'), $this->_oTemplate->parseHtmlByName('offer_popup.html', array(
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true)
        )));

        return echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => true, 'removeOnClose' => true))));
    }

    public function actionAcceptOffer()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(($mixedResult = $this->offerAccept($iId)) !== true)
            return echoJson(['msg' => $mixedResult !== false ? $mixedResult : _t('_bx_ads_txt_err_cannot_perform_action')]);

        return echoJson(['msg' => _t('_bx_ads_txt_msg_offer_accepted'), 'reload' => 1]);
    }

    public function actionDeclineOffer()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$this->offerDecline($iId))
            return echoJson(array('msg' => _t('_bx_ads_txt_err_cannot_perform_action')));

        return echoJson(array('msg' => _t('_bx_ads_txt_msg_offer_declined'), 'reload' => 1));
    }

    public function actionCancelOffer()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$this->offerCancel($iId))
            return echoJson(['msg' => _t('_bx_ads_txt_err_cannot_perform_action')]);

        return echoJson(['msg' => _t('_bx_ads_txt_msg_offer_canceled'), 'reload' => 1]);
    }

    public function actionPayOffer()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(($mixedResult = $this->offerPay($iId)) !== false)
            return echoJson($mixedResult);

        return echoJson(array('msg' => _t('_bx_ads_txt_err_cannot_perform_action')));     
    }

    public function actionShipped()
    {
        return echoJson($this->_actionMarkAs('shipped'));
    }

    public function actionReceived()
    {
        return echoJson($this->_actionMarkAs('received'));
    }

    public function actionRegisterImpression($iId)
    {
        echoJson($this->serviceRegisterImpression($iId));
    }

    public function actionRegisterClick($iId)
    {
        echoJson($this->serviceRegisterClick($iId));
    }

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'Interested' => '',
            'IsSourcesAvaliable' => '',
            'LoadEntryFromSource' => '',
            'LoadEntriesFromSourceByTerm' => '',
            'EntityReviews' => '',
            'EntityReviewsRating' => '',
            'CategoriesList' => '',
            'BrowseCategory' => '',
            'RegisterImpression' => '',
            'RegisterClick' => '',
            'BlockSourcesDetails' => '',
            'GetSourceData' => '',
        ]);
    }

    public function serviceRegisterImpression($iId)
    {
        return ['code' => $this->_oDb->updatePromotionTracker($iId, 'impressions') ? 0 : 1];
    }
    
    public function serviceRegisterClick($iId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oDb->updatePromotionTracker($iId, 'clicks'))
            return ['code' => 1];

        $sUrl = '';
        if($this->_oConfig->isSources())  {
            $aEntry = $this->_oDb->getContentInfoById($iId);
            if(!empty($aEntry) && is_array($aEntry) && !empty($aEntry[$CNF['FIELD_URL']]))
                $sUrl = $aEntry[$CNF['FIELD_URL']];
        }

        return [
            'code' => 0,
            'redirect' => !empty($sUrl) ? $sUrl : $this->_oConfig->getViewEntryUrl($iId)
        ];
    }

    public function serviceCheckName($sTitle, $iId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

    	if(empty($sTitle))
            return array();

        $sName = '';
        if(!empty($iId)) {
            $aEntry = $this->_oDb->getContentInfoById($iId); 
            if(strcmp($sTitle, $aEntry[$CNF['FIELD_NAME']]) == 0) 
                $sName = $sTitle;
        }

        return array(
            'title' => $sTitle,
            'name' => !empty($sName) ? $sName : $this->_oConfig->getEntryName($sTitle, $iId)
    	);
    }

    public function serviceUpdateCategoriesStats($mixedContentInfo = false)
    {
        $aContentInfo = [];
        if(!empty($mixedContentInfo))
            $aContentInfo = !is_array($mixedContentInfo) ? $this->_oDb->getContentInfoById((int)$mixedContentInfo) : $mixedContentInfo;

        $iCategoryId = 0;
        if($aContentInfo && !empty($aContentInfo['category']))
            $iCategoryId = (int)$aContentInfo['category'];

        return $this->serviceUpdateCategoriesStatsByCategory($iCategoryId);
    }

    public function serviceUpdateCategoriesStatsByCategory($iCategoryId = 0)
    {
        $aParams = ['type' => 'collect_stats'];
        if($iCategoryId)
            $aParams['category_id'] = (int)$iCategoryId;

        $aStats = $this->_oDb->getCategories($aParams);
        if(empty($aStats) || !is_array($aStats))
            return true;

        $iUpdated = 0;
        foreach($aStats as $aStat)
            if($this->_oDb->updateCategory(array('items' => $aStat['count']), array('id' => $aStat['id'])))
                $iUpdated++;

        return count($aStats) == $iUpdated;
    }

    public function serviceGetCategoryOptions($iParentId, $bPleaseSelect = false)
    {
        $aValues = array();
        if($bPleaseSelect)
            $aValues[] = array('key' => '', 'value' => _t('_sys_please_select'));

        $this->_getCategoryOptions($iParentId, $aValues);

        return $aValues;
    }

    public function serviceGetSearchableFields($aInputsAdd = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetSearchableFields(array_merge($aInputsAdd, $this->_getSearchableFields()));
        unset($aResult[$CNF['FIELD_NOTES_PURCHASED']]);
        unset($aResult[$CNF['FIELD_CATEGORY_VIEW']], $aResult[$CNF['FIELD_CATEGORY_SELECT']]);
        unset($aResult[$CNF['FIELD_PRICE']], $aResult[$CNF['FIELD_YEAR']]);

        return $aResult;
    }

    public function serviceGetSearchableFieldsExtended($aInputsAdd = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $aInputsAdd = array_merge($aInputsAdd, $this->_getSearchableFields());

        if(isset($aInputsAdd[$CNF['FIELD_CATEGORY']])) {
            $aInputsAdd[$CNF['FIELD_CATEGORY']]['type'] = 'select';
            $aInputsAdd[$CNF['FIELD_CATEGORY']]['values_src'] = BxDolService::getSerializedService($this->_oConfig->getName(), 'get_category_options', array(0));
        }

        if(isset($aInputsAdd[$CNF['FIELD_PRICE']])) {
            $aInputsAdd[$CNF['FIELD_PRICE']]['search_type'] = 'text_range';
            $aInputsAdd[$CNF['FIELD_PRICE']]['search_operator'] = 'between';
        }

        if(isset($aInputsAdd[$CNF['FIELD_YEAR']])) {
            $aInputsAdd[$CNF['FIELD_YEAR']]['search_type'] = 'text_range';
            $aInputsAdd[$CNF['FIELD_YEAR']]['search_operator'] = 'between';
        }

        return parent::serviceGetSearchableFieldsExtended($aInputsAdd);
    }

    /**
     * Mark an ad as shipped/received by seller/bauer accordingly.
     * @param type $sAction - shipped/received action.
     * @param type $iContentId - an ad the action will be performed with.
     * @param integer $iProfileSrc - profile, who performed the action.
     * @param integer $iProfileDst - profile, the action is pointed on.
     * @return boolean - true or a string value with error message.
     */
    public function serviceMarkAs($sAction, $iContentId, $iProfileSrc = 0, $iProfileDst = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileSrc)
            $iProfileSrc = bx_get_logged_profile_id();

        $sTxtError = '_bx_ads_txt_err_cannot_perform_action';
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        $sMethodCheck = 'checkAllowedMark' . bx_gen_method_name($sAction) . 'ForProfile';
        if(!method_exists($this, $sMethodCheck))
            return _t($sTxtError);

        if(($mixedCheckResult = $this->$sMethodCheck($aContentInfo, false, $iProfileSrc)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $mixedCheckResult;

        if((int)$this->_oDb->updateEntriesBy(array($CNF['FIELD_' . strtoupper($sAction)] => time()), array($CNF['FIELD_ID'] => $iContentId)) == 0)
            return _t($sTxtError);

        $this->$sMethodCheck($aContentInfo, true, $iProfileSrc);

        $sMethodOnResult = 'on' . bx_gen_method_name($sAction);
        if(method_exists($this, $sMethodOnResult))
            $this->$sMethodOnResult($aContentInfo, $iProfileSrc, $iProfileDst);        

        return true;
    }

    public function serviceEntityCreate ($sParams = false)
    {
        $iCategory = is_numeric($sParams) ? (int)$sParams : 0;

        if($this->_bIsApi && ($iCategory = bx_get('category_select')) !== false)
            $iCategory = (int)$iCategory;

        if(($sDisplay = $this->getCategoryDisplay('add', $iCategory)) !== false) {
            if(empty($sParams) || !is_array($sParams))
                $sParams = [];

            $sParams['display'] = $sDisplay;
        }

        if($iCategory)
            BxDolSession::getInstance()->setValue($sDisplay . '_category', $iCategory);

        return parent::serviceEntityCreate($sParams);
    }

    public function serviceEntityEditBudget ($iContentId = 0, $sDisplay = false)
    {
        $CNF = &$this->_oConfig->CNF;

        return parent::serviceEntityEdit($iContentId, $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_BUDGET']);
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads 
     * @subsection bx_ads-page_blocks Page Blocks
     * @subsubsection bx_ads-entity_reviews entity_reviews
     * 
     * @code bx_srv('bx_ads', 'entity_reviews', [...]); @endcode
     * 
     * Get reviews for particular content
     * @param $iContentId content ID
     * 
     * @see BxAdsModule::serviceEntityReviews
     */
    /** 
     * @ref bx_ads-entity_reviews "entity_reviews"
     */
    public function serviceEntityReviews($iContentId = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        if(empty($CNF['OBJECT_REVIEWS']))
            return false;

        return $this->_entityComments($CNF['OBJECT_REVIEWS'], $iContentId);
    }
    
    /**
     * @page service Service Calls
     * @section bx_ads Ads 
     * @subsection bx_ads-page_blocks Page Blocks
     * @subsubsection bx_ads-entity_reviews_rating entity_reviews_rating
     * 
     * @code bx_srv('bx_ads', 'entity_reviews_rating', [...]); @endcode
     * 
     * Get reviews rating for particular content
     * @param $iContentId content ID
     * 
     * @see BxAdsModule::serviceEntityReviewsRating
     */
    /** 
     * @ref bx_ads-entity_reviews_rating "entity_reviews_rating"
     */
    public function serviceEntityReviewsRating($iContentId = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        if(empty($CNF['OBJECT_REVIEWS']))
            return false;

        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$iContentId)
            return false;

        $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_REVIEWS'], $iContentId);
        if (!$oCmts || !$oCmts->isEnabled())
            return false;

        return $oCmts->getRatingBlock(array('in_designbox' => false));
    }

    public function serviceEntityPromotionGrowth($iContentId = 0)
    {
        return $this->_serviceTemplateFunc('entryPromotionGrowth', $iContentId);
    }

    public function serviceEntityPromotionSummary($iContentId = 0)
    {
        return $this->_serviceTemplateFunc('entryPromotionSummary', $iContentId);
    }
    
    public function serviceEntityPromotionRoi($iContentId = 0)
    {
        return $this->_serviceTemplateFunc('entryPromotionRoi', $iContentId);
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads 
     * @subsection bx_ads-page_blocks Page Blocks
     * @subsubsection bx_ads-categories_list categories_list
     * 
     * @code bx_srv('bx_ads', 'categories_list', [...]); @endcode
     * 
     * Get reviews rating for particular content
     * @param $aParams additional params array, such as 'show_empty'
     * 
     * @see BxAdsModule::serviceCategoriesList
     */
    /** 
     * @ref bx_ads-categories_list "categories_list"
     */
    public function serviceCategoriesList($aParams = array())
    {
        if(!isset($aParams['show_empty']))
            $aParams['show_empty'] = true;

        return $this->_oTemplate->categoriesList($aParams);
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads 
     * @subsection bx_ads-browse Browse
     * @subsubsection bx_ads-browse_category browse_category
     * 
     * @code bx_srv('bx_ads', 'browse_category', [...]); @endcode
     * 
     * Get reviews rating for particular content
     * @param $iCategoryId category ID
     * @param $aParams additional params array, such as empty_message, ajax_paginate, etc
     * 
     * @see BxAdsModule::serviceBrowseCategory
     */
    /**
     * @ref bx_ads-browse_category "browse_category"
     */
    public function serviceBrowseCategory($sUnitView = false, $bEmptyMessage = true, $bAjaxPaginate = true, $aParams = [])
    {
        $mixedResult = parent::serviceBrowseCategory($sUnitView, $bEmptyMessage, $bAjaxPaginate, $aParams);
        if(empty($mixedResult['content']))
            return $mixedResult;

        $aCategory = $this->_oDb->getCategories([
            'type' => 'id', 
            'id' => !empty($aParams['category']) ? (int)$aParams['category'] : bx_process_input(bx_get('category'), BX_DATA_INT)
        ]);

        if(!empty($aCategory['title']))
            $mixedResult['title'] = _t('_bx_ads_page_block_title_entries_by_category_mask', _t($aCategory['title']));

        return $mixedResult;
    }

    public function serviceGetTimelinePost($aEvent, $aBrowseParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $mixedResult = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if(!$mixedResult)
            return $mixedResult;
        
        $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);

        if($this->_oConfig->isSources() && !empty($aContentInfo[$CNF['FIELD_URL']]))
            $mixedResult['url'] = $aContentInfo[$CNF['FIELD_URL']];

        return $mixedResult;
    }

    public function serviceGetNotificationsData()
    {
        $sModule = $this->_aModule['name'];

        $sEventPrivacy = $sModule . '_allow_view_event_to';
        if(BxDolPrivacy::getObjectInstance($sEventPrivacy) === false)
            $sEventPrivacy = '';

        $aResult = parent::serviceGetNotificationsData();
        $aResult['handlers'] = array_merge($aResult['handlers'], array(
            array('group' => $sModule . '_interest', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doInterest', 'module_name' => $sModule, 'module_method' => 'get_notifications_interest', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            array('group' => $sModule . '_paid', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'license_register', 'module_name' => $sModule, 'module_method' => 'get_notifications_license_register', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            //---> To Buyer
            array('group' => $sModule . '_shipped', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'shipped', 'module_name' => $sModule, 'module_method' => 'get_notifications_shipped', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            //<---
            array('group' => $sModule . '_received', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'received', 'module_name' => $sModule, 'module_method' => 'get_notifications_received', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),

            array('group' => $sModule . '_offer_added', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'offer_added', 'module_name' => $sModule, 'module_method' => 'get_notifications_offer_added', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            //---> To Offerer
            array('group' => $sModule . '_offer_accepted', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'offer_accepted', 'module_name' => $sModule, 'module_method' => 'get_notifications_offer_accepted', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            array('group' => $sModule . '_offer_declined', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'offer_declined', 'module_name' => $sModule, 'module_method' => 'get_notifications_offer_declined', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            //<---
            array('group' => $sModule . '_offer_canceled', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'offer_canceled', 'module_name' => $sModule, 'module_method' => 'get_notifications_offer_canceled', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy)
        ));

        $aResult['settings'] = array_merge($aResult['settings'], array(
            array('group' => 'interest', 'unit' => $sModule, 'action' => 'doInterest', 'types' => array('personal')),

            array('group' => 'usage', 'unit' => $sModule, 'action' => 'license_register', 'types' => array('personal')),
            array('group' => 'usage', 'unit' => $sModule, 'action' => 'shipped', 'types' => array('personal')),
            array('group' => 'usage', 'unit' => $sModule, 'action' => 'received', 'types' => array('personal')),
            array('group' => 'usage', 'unit' => $sModule, 'action' => 'offer_added', 'types' => array('personal')),
            array('group' => 'usage', 'unit' => $sModule, 'action' => 'offer_accepted', 'types' => array('personal')),
            array('group' => 'usage', 'unit' => $sModule, 'action' => 'offer_declined', 'types' => array('personal')),
            array('group' => 'usage', 'unit' => $sModule, 'action' => 'offer_canceled', 'types' => array('personal')),
        ));

        $aResult['alerts'] = array_merge($aResult['alerts'], array(
            array('unit' => $sModule, 'action' => 'doInterest'),
            array('unit' => $sModule, 'action' => 'license_register'),
            array('unit' => $sModule, 'action' => 'shipped'),
            array('unit' => $sModule, 'action' => 'received'),
            array('unit' => $sModule, 'action' => 'offer_added'),
            array('unit' => $sModule, 'action' => 'offer_accepted'),
            array('unit' => $sModule, 'action' => 'offer_declined'),
            array('unit' => $sModule, 'action' => 'offer_canceled'),
        ));

        return $aResult; 
    }

    public function serviceGetNotificationsInsertData($oAlert, $aHandler, $aDataItems)
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = [];
        switch($oAlert->sAction) {
            case 'license_register':
                $aContentInfo = $this->_oDb->getContentInfoById($oAlert->aExtras['product_id']);
                if(empty($aContentInfo) || !is_array($aContentInfo)) {
                    $aResult = $aDataItems;
                    break;
                }

                foreach($aDataItems as $aDataItem) {
                    $aDataItem = array_merge($aDataItem, [
                        'owner_id' => $oAlert->aExtras['profile_id'],
                        'object_id' => $aContentInfo[$CNF['FIELD_ID']],
                        'object_owner_id' => $aContentInfo[$CNF['FIELD_AUTHOR']],
                        'object_privacy_view' => BX_DOL_PG_ALL
                    ]);

                    $aResult[] = $aDataItem;
                }
                break;

            case 'shipped':
                foreach($aDataItems as $aDataItem) {
                    $aLicense = $this->_oDb->getLicense(['type' => 'entry_id', 'entry_id' => $aDataItem['object_id'], 'newest' => true]);
                    if(!empty($aLicense) && is_array($aLicense))
                        $aDataItem['object_owner_id'] = $aLicense['profile_id'];

                    $aResult[] = $aDataItem;
                }
                break;

            case 'offer_added':
            case 'offer_canceled':
                foreach($aDataItems as $aDataItem) {
                    $aDataItem['object_owner_id'] = $oAlert->aExtras['object_author_id'];

                    $aResult[] = $aDataItem;
                }
                break;

            case 'offer_accepted':
            case 'offer_declined':
                foreach($aDataItems as $aDataItem) {
                    $aDataItem['object_owner_id'] = $oAlert->aExtras['offer_author_id'];

                    $aResult[] = $aDataItem;
                }
                break;

            default:
                $aResult = $aDataItems;
        }

        return $aResult;
    }

    public function serviceGetNotificationsInterest($aEvent)
    {
    	$CNF = &$this->_oConfig->CNF;

    	$iContentId = (int)$aEvent['object_id'];
    	$aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return [];

        $iInterestedId = (int)$aEvent['subobject_id'];
        $aInterestedInfo = $this->_oDb->getInterested(['type' => 'id', 'id' => $iInterestedId]);
        if(empty($aInterestedInfo) || !is_array($aInterestedInfo))
            return [];

        if(($oInterestedProfile = BxDolProfile::getInstance($aInterestedInfo['profile_id'])) !== false)
            $sEntryUrl = $oInterestedProfile->getUrl();
        else
            $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iContentId), '{bx_url_root}');

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $aContentInfo[$CNF['FIELD_TITLE']],
            'entry_author' => $aContentInfo[$CNF['FIELD_AUTHOR']],
            'subentry_sample' => $CNF['T']['txt_sample_interest_single'],
            'subentry_url' => '',
            'lang_key' => '_bx_ads_txt_ntfs_subobject_interested', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    public function serviceGetNotificationsLicenseRegister($aEvent)
    {
        return $this->_serviceGetNotificationsByEntryAndAction($aEvent, 'license_register');
    }

    public function serviceGetNotificationsShipped($aEvent)
    {
        $aResult = $this->_serviceGetNotificationsByEntryAndAction($aEvent, 'shipped');
        $aResult['entry_author'] = $aEvent['object_owner_id'];

        return $aResult;
    }

    public function serviceGetNotificationsReceived($aEvent)
    {
        return $this->_serviceGetNotificationsByEntryAndAction($aEvent, 'received');
    }

    public function serviceGetNotificationsOfferAdded($aEvent)
    {
        return $this->_serviceGetNotificationsByOfferAndAction($aEvent, 'offer_added');
    }

    public function serviceGetNotificationsOfferAccepted($aEvent)
    {
        $aResult = $this->_serviceGetNotificationsByOfferAndAction($aEvent, 'offer_accepted');
        $aResult['entry_author'] = $aEvent['object_owner_id'];

        return $aResult;
    }

    public function serviceGetNotificationsOfferDeclined($aEvent)
    {
        $aResult = $this->_serviceGetNotificationsByOfferAndAction($aEvent, 'offer_declined');
        $aResult['entry_author'] = $aEvent['object_owner_id'];

        return $aResult;
    }

    public function serviceGetNotificationsOfferCanceled($aEvent)
    {
        return $this->_serviceGetNotificationsByOfferAndAction($aEvent, 'offer_canceled');
    }

    protected function _serviceGetNotificationsByEntryAndAction($aEvent, $sAction)
    {
    	$CNF = &$this->_oConfig->CNF;

    	$iContentId = (int)$aEvent['object_id'];
    	$aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return array();

        $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iContentId), '{bx_url_root}');

        return array(
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $aContentInfo[$CNF['FIELD_TITLE']],
            'entry_author' => $aContentInfo[$CNF['FIELD_AUTHOR']],
            'subentry_sample' => '',
            'subentry_url' => '',
            'lang_key' => '_bx_ads_txt_ntfs_object_' . $sAction, //may be empty or not specified. In this case the default one from Notification module will be used.
        );
    }

    protected function _serviceGetNotificationsByOfferAndAction($aEvent, $sAction)
    {
    	$CNF = &$this->_oConfig->CNF;

    	$iOfferId = (int)$aEvent['object_id'];
    	$aOfferInfo = $this->_oDb->getOffersBy(['type' => 'id', 'id' => $iOfferId]);
        if(empty($aOfferInfo) || !is_array($aOfferInfo))
            return array();

        $iContentId = $aOfferInfo[$CNF['FIELD_OFR_CONTENT']];
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return array();

        $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iContentId), '{bx_url_root}');

        return array(
            'object_id' => $iContentId,
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $aContentInfo[$CNF['FIELD_TITLE']],
            'entry_author' => $aContentInfo[$CNF['FIELD_AUTHOR']],
            'subentry_sample' => '',
            'subentry_url' => '',
            'lang_key' => '_bx_ads_txt_ntfs_' . $sAction, //may be empty or not specified. In this case the default one from Notification module will be used.
        );
    }
    
    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-page_blocks Page Blocks
     * @subsubsection bx_ads-block_licenses block_licenses
     * 
     * @code bx_srv('bx_ads', 'block_licenses', [...]); @endcode
     * 
     * Get page block with a list of licenses purchased by currently logged member.
     *
     * @return an array describing a block to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxAdsModule::serviceBlockLicenses
     */
    /** 
     * @ref bx_ads-block_licenses "block_licenses"
     */
    public function serviceBlockLicenses() 
    {
        return $this->_getBlockLicenses();
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-page_blocks Page Blocks
     * @subsubsection bx_ads-block_licenses_administration block_licenses_administration
     * 
     * @code bx_srv('bx_ads', 'block_licenses_administration', [...]); @endcode
     * 
     * Get page block with a list of all licenses. It's needed for moderators/administrators.
     *
     * @return an array describing a block to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxAdsModule::serviceBlockLicensesAdministration
     */
    /** 
     * @ref bx_ads-block_licenses "block_licenses"
     */
    public function serviceBlockLicensesAdministration() 
    {
        return $this->_getBlockLicenses('administration');
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-page_blocks Page Blocks
     * @subsubsection bx_ads-block_licenses_note block_licenses_note
     * 
     * @code bx_srv('bx_ads', 'block_licenses_note', [...]); @endcode
     * 
     * Get page block with a notice for licenses usage.
     *
     * @return HTML string with block content to display on the site.
     * 
     * @see BxAdsModule::serviceBlockLicensesNote
     */
    /** 
     * @ref bx_ads-block_licenses_note "block_licenses_note"
     */
    public function serviceBlockLicensesNote()
    {
        return MsgBox(_t('_bx_ads_page_block_content_licenses_note'));
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-get_payment_data get_payment_data
     * 
     * @code bx_srv('bx_ads', 'get_payment_data', [...]); @endcode
     * 
     * Get an array with module's description. Is needed for payments processing module.
     * 
     * @return an array with module's description.
     * 
     * @see BxAdsModule::serviceGetPaymentData
     */
    /** 
     * @ref bx_ads-get_payment_data "get_payment_data"
     */
    public function serviceGetPaymentData()
    {
        $CNF = &$this->_oConfig->CNF;

        $oPermalink = BxDolPermalinks::getInstance();
        return array_merge($this->_aModule, [
            'url_browse_order_common' => bx_absolute_url(bx_append_url_params($oPermalink->permalink($CNF['URL_LICENSES_COMMON']), ['filter' => '{order}'], false)),
            'url_browse_order_administration' => bx_absolute_url(bx_append_url_params($oPermalink->permalink($CNF['URL_LICENSES_ADMINISTRATION']), ['filter' => '{order}'], false))
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-get_cart_item get_cart_item
     * 
     * @code bx_srv('bx_ads', 'get_cart_item', [...]); @endcode
     * 
     * Get an array with prodict's description. Is used in Shopping Cart in payments processing module.
     * 
     * @param $mixedItemId product's ID or Unique Name.
     * @return an array with prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceGetCartItem
     */
    /** 
     * @ref bx_ads-get_cart_item "get_cart_item"
     */
    public function serviceGetCartItem($mixedItemId, $iClientId = 0)
    {
    	$CNF = &$this->_oConfig->CNF;

        if(!$mixedItemId || !is_numeric($mixedItemId))
            return [];

        $aCommodity = $this->_oDb->getCommodity(['sample' => 'id_with_entry', 'id' => (int)$mixedItemId]);
        if(empty($aCommodity) || !is_array($aCommodity))
            return [];

        $iItemId = (int)$aCommodity['id'];
        $sItemType = $aCommodity['type'];

        $iItemAuthor = 0;
        $fItemPrice = 0;
        switch($sItemType) {
            case BX_ADS_COMMODITY_TYPE_PRODUCT:
                $iItemAuthor = $aCommodity['entry_' . $CNF['FIELD_AUTHOR']];
                $fItemPrice = (float)$aCommodity['entry_' . $CNF['FIELD_PRICE']];
                if($this->_oConfig->isAuction() && (int)$aCommodity['entry_' . $CNF['FIELD_AUCTION']] != 0) {
                    $aOffer = $this->_oDb->getOffersBy([
                        'type' => 'content_and_author_ids', 
                        'content_id' => $iItemId, 
                        'author_id' => $iClientId,
                        'status' => BX_ADS_OFFER_STATUS_ACCEPTED
                    ]);

                    if(!empty($aOffer) && is_array($aOffer))
                        $fItemPrice = (float)$aOffer[$CNF['FIELD_OFR_AMOUNT']];
                }
                break;

            case BX_ADS_COMMODITY_TYPE_PROMOTION:
                $iItemAuthor = BxDolPayments::getInstance()->getOption('site_admin');
                $fItemPrice = (float)$aCommodity['amount'];
                break;
        }

        if(!$iClientId)
            $iClientId = bx_get_logged_profile_id();

        return [
            'id' => $iItemId,
            'author_id' => $iItemAuthor,
            'name' => $aCommodity['entry_' . $CNF['FIELD_NAME']] . '-' . $sItemType,
            'title' => $aCommodity['entry_' . $CNF['FIELD_TITLE']],
            'description' => $sItemDescription = _t($CNF['T']['txt_cd_ct_' . $sItemType]),
            'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'], ['id' => $aCommodity['entry_' . $CNF['FIELD_ID']]])),
            'price_single' => $fItemPrice,
            'price_recurring' => '',
            'period_recurring' => 0,
            'period_unit_recurring' => '',
            'trial_recurring' => ''
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-get_cart_items get_cart_items
     * 
     * @code bx_srv('bx_ads', 'get_cart_items', [...]); @endcode
     * 
     * Get an array with prodicts' descriptions by seller. Is used in Manual Order Processing in payments processing module.
     * 
     * @param $iSellerId seller ID.
     * @return an array with prodicts' descriptions. Empty array is returned if something is wrong or seller doesn't have any products.
     * 
     * @see BxAdsModule::serviceGetCartItems
     */
    /** 
     * @ref bx_ads-get_cart_items "get_cart_items"
     */
    public function serviceGetCartItems($iSellerId)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iSellerId = (int)$iSellerId;
        if(empty($iSellerId))
            return [];

        $aItems = $this->_oDb->getCommodity(['sample' => 'entry_author', 'author' => $iSellerId, 'type' => BX_ADS_COMMODITY_TYPE_PRODUCT]);

        $aResult = [];
        foreach($aItems as $aItem) {
            $aItemInfo = $this->_oDb->getContentInfoById((int)$aItem['entry_id']);
            if(empty($aItemInfo) || !is_array($aItemInfo) || $aItemInfo[$CNF['FIELD_STATUS']] != BX_BASE_MOD_TEXT_STATUS_ACTIVE || empty($aItemInfo[$CNF['FIELD_QUANTITY']]))
                continue;

            $aResult[] = $this->serviceGetCartItem($aItem['id']);
        }

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-authorize_cart_item authorize_cart_item
     * 
     * @code bx_srv('bx_ads', 'authorize_cart_item', [...]); @endcode
     * 
     * Authorize the order to process a single time payment inside the Ads module in future. Is called with payment processing module after the order was authorized there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with authorize prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceAuthorizeCartItem
     */
    /** 
     * @ref bx_ads-authorize_cart_item "authorize_cart_item"
     */
    public function serviceAuthorizeCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aItem = $this->serviceGetCartItem($iItemId);
        if(empty($aItem) || !is_array($aItem))
            return [];

        $aCommodity = $this->_oDb->getCommodity(['sample' => 'id_with_entry', 'id' => (int)$iItemId]);
        if(empty($aCommodity) || !is_array($aCommodity))
            return [];

        /**
         * @hooks
         * @hookdef hook-bx_ads-order_authorize 'bx_ads', 'order_authorize' - hook after the order was authorized with payment processing module
         * - $unit_name - equals `bx_ads`
         * - $action - equals `order_authorize`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `id` - [int] commodity id 
         *      - `type` - [string] commodity type, 'product' or 'promotion'
         *      - `product_id` - [int] ad (entry) id the commodity is associated with
         *      - `order` - [string] order number provided with payment processing module
         *      - `count` - [int] number of items in order
         * @hook @ref hook-bx_ads-order_authorize
         */
        bx_alert($this->getName(), 'order_authorize', 0, false, [
            'id' => $aCommodity['id'],
            'type' => $aCommodity['type'],
            'product_id' => $aCommodity['entry_id'],
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'count' => $iItemCount
        ]);

        return $aItem;
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-register_cart_item register_cart_item
     * 
     * @code bx_srv('bx_ads', 'register_cart_item', [...]); @endcode
     * 
     * Register a processed single time payment inside the Ads module. Is called with payment processing module after the payment was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceRegisterCartItem
     */
    /** 
     * @ref bx_ads-register_cart_item "register_cart_item"
     */
    public function serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        $aCommodity = $this->_oDb->getCommodity(['sample' => 'id', 'id' => (int)$iItemId]);
        if(empty($aCommodity) || !is_array($aCommodity))
            return [];
        
        $sMethod = '_registerCartItem' . bx_gen_method_name($aCommodity['type']);
        if(!method_exists($this, $sMethod))
            return [];

        return $this->$sMethod($iClientId, $iSellerId, $aCommodity, $iItemCount, $sOrder, $sLicense);
    }

    protected function _registerCartItemProduct($iClientId, $iSellerId, $aCommodity, $iItemCount, $sOrder, $sLicense)
    {
        $CNF = &$this->_oConfig->CNF;
        $sModule = $this->getName();

    	$aItem = $this->serviceGetCartItem($aCommodity['id']);
        if(empty($aItem) || !is_array($aItem))
            return [];

        $aEntry = $this->_oDb->getContentInfoById($aCommodity['entry_id']);
        if(empty($aEntry) || !is_array($aEntry))
            return [];

        $iEntryId = (int)$aCommodity['entry_id'];
        $iEntryQnt = (int)$aEntry[$CNF['FIELD_QUANTITY']];
        if(($iEntryQnt - $iItemCount) < 0 || !$this->_oDb->registerLicense($iClientId, $iEntryId, $iItemCount, $sOrder, $sLicense))
            return [];

        $aOffer = $this->_oDb->getOffersBy([
            'type' => 'content_and_author_ids', 
            'content_id' => $iEntryId, 
            'author_id' => $iClientId,
            'status' => BX_ADS_OFFER_STATUS_ACCEPTED
        ]);

        if(!empty($aOffer) && is_array($aOffer))
            $this->_oDb->updateOffer([$CNF['FIELD_OFR_STATUS'] => BX_ADS_OFFER_STATUS_PAID], [$CNF['FIELD_OFR_ID'] => $aOffer[$CNF['FIELD_OFR_ID']]]);

        $iEntryQnt -= $iItemCount;
        $bEntrySold = $iEntryQnt == 0;

        $aUpdate = [
            $CNF['FIELD_QUANTITY'] => $iEntryQnt
        ];
        if($bEntrySold)
            $aUpdate = array_merge($aUpdate, [
                $CNF['FIELD_STATUS'] =>  BX_ADS_STATUS_SOLD,
                $CNF['FIELD_SOLD'] => time()
            ]);

        $this->_oDb->updateEntriesBy($aUpdate, [$CNF['FIELD_ID'] => $iEntryId]);

        /**
         * @hooks
         * @hookdef hook-bx_ads-license_register 'bx_ads', 'license_register' - hook after the payment for an ad was processed with payment processing module
         * - $unit_name - equals `bx_ads`
         * - $action - equals `license_register`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `id` - [int] commodity id 
         *      - `type` - [string] commodity type, 'product' or 'promotion'
         *      - `product_id` - [int] ad (entry) id the commodity is associated with
         *      - `profile_id` - [int] client (buyer) profile id
         *      - `order` - [string] order number provided with payment processing module
         *      - `license` - [string] license number generated for the order
         *      - `count` - [int] number of items in order
         * @hook @ref hook-bx_ads-license_register
         */
        bx_alert($sModule, 'license_register', 0, false, [
            'id' => $aCommodity['id'],
            'type' => $aCommodity['type'],
            'product_id' => $iEntryId,
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'license' => $sLicense,
            'count' => $iItemCount
        ]);

        if($bEntrySold) {
            $aParams = $this->_alertParams($aEntry);
            
            /**
             * @hooks
             * @hookdef hook-bx_ads-sold 'bx_ads', 'sold' - hook after the payment was processed with payment processing module and there is no the ad (entry) for selling anymore
             * - $unit_name - equals `bx_ads`
             * - $action - equals `sold`
             * - $object_id - ad (entry) id
             * - $sender_id - not used
             * - $extra_params - array of additional params with the following array keys:
             *      - `status` - [string] content status
             *      - `status_admin` - [string] content admin status
             *      - `privacy_view` - [int] or [string] privacy for view content action, @see BxDolPrivacy
             *      - `cf` - [int] content's audience filter value
             * @hook @ref hook-bx_ads-sold
             */
            bx_alert($sModule, 'sold', $iEntryId, false, $aParams);
        }

        $oAuthor = BxDolProfile::getInstanceMagic($aEntry[$CNF['FIELD_AUTHOR']]);
        $oClient = BxDolProfile::getInstanceMagic($iClientId);
        $oSeller = BxDolProfile::getInstanceMagic($iSellerId);
        $sSellerUrl = $oSeller->getUrl();
        $sSellerName = $oSeller->getDisplayName();

        $sNote = $aEntry[$CNF['FIELD_NOTES_PURCHASED']];
        if(empty($sNote))
            $sNote = _t('_bx_ads_txt_purchased_note', $sSellerUrl, $sSellerName);

        $sEmailTemplate = $CNF['ETEMPLATE_PURCHASED'];
        $aEmailParams = [
            'client_name' => $oClient->getDisplayName(),
            'entry_name' => $aEntry[$CNF['FIELD_TITLE']],
            'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'], ['id' => $iEntryId])),
            'author_url' => $oAuthor->getUrl(),
            'author_name' => $oAuthor->getDisplayName(),
            'vendor_url' => $sSellerUrl,
            'vendor_name' => $sSellerName,
            'count' => (int)$iItemCount,
            'license' => $sLicense,
            'notes' => $sNote,
        ];

        $bCancel = false;
        /**
         * @hooks
         * @hookdef hook-bx_ads-license_register_notif 'bx_ads', 'license_register_notif' - hook before sending a notification about new license. Allows to override a notification message or cancel the notification
         * - $unit_name - equals `bx_ads`
         * - $action - equals `license_register_notif`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `entry_id` - [int] ad (entry) id
         *      - `order` - [string] order number
         *      - `recipient_id` - [int] by ref, client (buyer) profile id, can be overridden in hook processing
         *      - `email_template` - [string] by ref, email template name, can be overridden in hook processing
         *      - `email_params` - [array] by ref, email params array as key&value pairs, which will be parsed in email subject/body, can be overridden in hook processing
         *      - `cancel` - [boolean] by ref, if email sending should be canceled or not, can be overridden in hook processing
         * @hook @ref hook-bx_ads-license_register_notif
         */
        bx_alert($sModule, 'license_register_notif', 0, false, [
            'entry_id' => $iEntryId,
            'order' => $sOrder,

            'recipient_id' => &$iClientId,
            'email_template' => &$sEmailTemplate,
            'email_params' => &$aEmailParams,
            'cancel' => &$bCancel,

            'recipient_id_ref' => &$iClientId,
            'email_template_ref' => &$sEmailTemplate,
            'email_params_ref' => &$aEmailParams,
            'cancel_ref' => &$bCancel
        ]);

        if(!$bCancel)
            sendMailTemplate($sEmailTemplate, 0, $iClientId, $aEmailParams);

        return $aItem;
    }
    
    protected function _registerCartItemPromotion($iClientId, $iSellerId, $aCommodity, $iItemCount, $sOrder, $sLicense)
    {
        $CNF = &$this->_oConfig->CNF;

        $aItem = $this->serviceGetCartItem($aCommodity['id']);
        if(empty($aItem) || !is_array($aItem))
            return [];

        $aEntry = $this->_oDb->getContentInfoById($aCommodity['entry_id']);
        if(empty($aEntry) || !is_array($aEntry))
            return [];

        $iEntryId = (int)$aCommodity['entry_id'];
        if(!$this->_oDb->registerPromotion($aEntry[$CNF['FIELD_AUTHOR']], $aCommodity['id'], $iEntryId, $aCommodity['amount'], $sOrder, $sLicense))
            return [];

        if($aEntry[$CNF['FIELD_STATUS_ADMIN']] == BX_ADS_STATUS_ADMIN_UNPAID) {
            $aUpdate[$CNF['FIELD_STATUS_ADMIN']] = BX_BASE_MOD_GENERAL_STATUS_ACTIVE;
            if(!$this->_isModerator() && !$this->_oConfig->isAutoApproveEnabled())
                $aUpdate[$CNF['FIELD_STATUS_ADMIN']] = BX_BASE_MOD_GENERAL_STATUS_PENDING;
            
            $this->_oDb->updateEntriesBy($aUpdate, [$CNF['FIELD_ID'] => $iEntryId]);
        }

        /**
         * @hooks
         * @hookdef hook-bx_ads-promotion_register 'bx_ads', 'promotion_register' - hook after the payment for promotion was processed with payment processing module
         * - $unit_name - equals `bx_ads`
         * - $action - equals `promotion_register`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `id` - [int] commodity id 
         *      - `type` - [string] commodity type, 'product' or 'promotion'
         *      - `product_id` - [int] ad (entry) id the commodity is associated with
         *      - `profile_id` - [int] client (buyer) profile id
         *      - `amount` - [float] amount paid for the promotion
         *      - `order` - [string] order number provided with payment processing module
         *      - `license` - [string] license number generated for the order
         * @hook @ref hook-bx_ads-promotion_register
         */
        bx_alert($this->getName(), 'promotion_register', 0, false, [
            'id' => $aCommodity['id'],
            'type' => $aCommodity['type'],
            'product_id' => $iEntryId,
            'profile_id' => $iClientId,
            'amount' => $aCommodity['amount'],
            'order' => $sOrder,
            'license' => $sLicense,
        ]);

        return $aItem;
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-authorize_subscription_item authorize_subscription_item
     * 
     * @code bx_srv('bx_ads', 'authorize_subscription_item', [...]); @endcode
     * 
     * Authorize the order to process a subscription (recurring payment) inside the Ads module in future. Is called with payment processing module after the order for subscription was authorized there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with authorize prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceAuthorizeSubscriptionItem
     */
    /** 
     * @ref bx_ads-authorize_subscription_item "authorize_subscription_item"
     */
    public function serviceAuthorizeSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
        return [];
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-register_subscription_item register_subscription_item
     * 
     * @code bx_srv('bx_ads', 'register_subscription_item', [...]); @endcode
     * 
     * Register a processed subscription (recurring payment) inside the Ads module. Is called with payment processing module after the subscription was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with subscribed prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceRegisterSubscriptionItem
     */
    /** 
     * @ref bx_ads-register_subscription_item "register_subscription_item"
     */
    public function serviceRegisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return [];
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-reregister_cart_item reregister_cart_item
     * 
     * @code bx_srv('bx_ads', 'reregister_cart_item', [...]); @endcode
     * 
     * Reregister a single time payment inside the Ads module. Is called with payment processing module after the payment was reregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemIdOld old item ID.
     * @param $iItemIdNew new item ID.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceReregisterCartItem
     */
    /** 
     * @ref bx_ads-reregister_cart_item "reregister_cart_item"
     */
    public function serviceReregisterCartItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return [];
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-reregister_subscription_item reregister_subscription_item
     * 
     * @code bx_srv('bx_ads', 'reregister_subscription_item', [...]); @endcode
     * 
     * Reregister a subscription (recurring payment) inside the Ads module. Is called with payment processing module after the subscription was reregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemIdOld old item ID.
     * @param $iItemIdNew new item ID.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with subscribed prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAdsModule::serviceReregisterSubscriptionItem
     */
    /** 
     * @ref bx_ads-reregister_subscription_item "reregister_subscription_item"
     */
    public function serviceReregisterSubscriptionItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return [];
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-unregister_cart_item unregister_cart_item
     * 
     * @code bx_srv('bx_ads', 'unregister_cart_item', [...]); @endcode
     * 
     * Unregister an earlier processed single time payment inside the Ads module. Is called with payment processing module after the payment was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the payment was unregistered or not.
     * 
     * @see BxAdsModule::serviceUnregisterCartItem
     */
    /** 
     * @ref bx_ads-unregister_cart_item "unregister_cart_item"
     */
    public function serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        $aCommodity = $this->_oDb->getCommodity(['sample' => 'id', 'id' => (int)$iItemId]);
        if(empty($aCommodity) || !is_array($aCommodity))
            return [];
        
        $sMethod = '_unregisterCartItem' . bx_gen_method_name($aCommodity['type']);
        if(!method_exists($this, $sMethod))
            return [];

        return $this->$sMethod($iClientId, $iSellerId, $aCommodity, $iItemCount, $sOrder, $sLicense);
    }
    
    protected function _unregisterCartItemProduct($iClientId, $iSellerId, $aCommodity, $iItemCount, $sOrder, $sLicense)
    {
        $iEntryId = (int)$aCommodity['entry_id'];

        if(!$this->_oDb->unregisterLicense($iClientId, $iEntryId, $sOrder, $sLicense))
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_ads-license_unregister 'bx_ads', 'license_unregister' - hook after the payment for ad was refunded with payment processing module
         * It's equivalent to @ref hook-bx_ads-license_register
         * @hook @ref hook-bx_ads-license_unregister
         */
        bx_alert($this->getName(), 'license_unregister', 0, false, [
            'id' => $aCommodity['id'],
            'type' => $aCommodity['type'],
            'product_id' => $iEntryId,
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'license' => $sLicense,
            'count' => $iItemCount
        ]);

    	return true;
    }

    protected function _unregisterCartItemPromotion($iClientId, $iSellerId, $aCommodity, $iItemCount, $sOrder, $sLicense)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntry = $this->_oDb->getContentInfoById($aCommodity['entry_id']);
        if(empty($aEntry) || !is_array($aEntry))
            return false;

        $iEntryId = (int)$aCommodity['entry_id'];

        if(!$this->_oDb->unregisterPromotion($aEntry[$CNF['FIELD_AUTHOR']], $aCommodity['id'], $iEntryId, $sOrder, $sLicense))
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_ads-promotion_unregister 'bx_ads', 'promotion_unregister' - hook after the payment for promotion was refunded with payment processing module
         * It's equivalent to @ref hook-bx_ads-promotion_register
         * @hook @ref hook-bx_ads-promotion_unregister
         */
        bx_alert($this->getName(), 'promotion_unregister', 0, false, [
            'id' => $aCommodity['id'],
            'type' => $aCommodity['type'],
            'product_id' => $iEntryId,
            'profile_id' => $iClientId,
            'amount' => $aCommodity['amount'],
            'order' => $sOrder,
            'license' => $sLicense
        ]);

    	return true;
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-unregister_subscription_item unregister_subscription_item
     * 
     * @code bx_srv('bx_ads', 'unregister_subscription_item', [...]); @endcode
     * 
     * Unregister an earlier processed subscription (recurring payment) inside the Ads module. Is called with payment processing module after the subscription was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the subscription was unregistered or not.
     * 
     * @see BxAdsModule::serviceUnregisterSubscriptionItem
     */
    /** 
     * @ref bx_ads-unregister_subscription_item "unregister_subscription_item"
     */
    public function serviceUnregisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
    	return true; 
    }

    /**
     * @page service Service Calls
     * @section bx_ads Ads
     * @subsection bx_ads-payments Payments
     * @subsubsection bx_ads-cancel_subscription_item cancel_subscription_item
     * 
     * @code bx_srv('bx_ads', 'cancel_subscription_item', [...]); @endcode
     * 
     * Cancel an earlier processed subscription (recurring payment) inside the Ads module. Is called with payment processing module after the subscription was canceled there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return boolean value determining where the subscription was canceled or not.
     * 
     * @see BxAdsModule::serviceCancelSubscriptionItem
     */
    /** 
     * @ref bx_ads-cancel_subscription_item "cancel_subscription_item"
     */
    public function serviceCancelSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
    	return true;
    }

    public function serviceGetOffersCount($sStatus = '')
    {
        if(!$this->_oConfig->isAuction())
            return 0;

        if(empty($sStatus) || !in_array($sStatus, $this->_aOfferStatuses))
            $sStatus = BX_ADS_OFFER_STATUS_AWAITING;

        $iUserId = bx_get_logged_profile_id();
        return $this->_oDb->getOffersBy(array('type' => 'content_author_id', 'author_id' => $iUserId, 'status' => $sStatus, 'count' => true));
    }

    public function serviceGetLiveUpdates($sStatus, $aMenuItemParent, $aMenuItemChild, $iCount = 0)
    {
        if(!in_array($sStatus, $this->_aOfferStatuses))
            return false;

        $iUserId = bx_get_logged_profile_id();
        $iCountNew = $this->_oDb->getOffersBy(array('type' => 'content_author_id', 'author_id' => $iUserId, 'status' => $sStatus, 'count' => true));
        if($iCountNew == $iCount)
            return false;

        return array(
            'count' => $iCountNew, // required
            'method' => 'bx_menu_show_live_update(oData)', // required
            'data' => array(
                'code' => BxDolTemplate::getInstance()->parseHtmlByTemplateName('menu_item_addon', array(
                    'content' => '{count}'
                )),
            'mi_parent' => $aMenuItemParent,
            'mi_child' => $aMenuItemChild
            ),  // optional, may have some additional data to be passed in JS method provided using 'method' param above.
    	);
    }

    public function serviceOffers()       
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isAuction())
            return '';

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_OFFERS_ALL']);
        if(!$oGrid)
            return '';

        return $oGrid->getCode();
    }

    public function serviceEntityOffers($iContentId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isAuction())
            return '';

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_OFFERS']);
        if(!$oGrid)
            return '';

        if(empty($iContentId) && ($_iContentId = bx_get('id')) !== false)
            $iContentId = (int)$_iContentId;

        $oGrid->setContentId($iContentId);
        return $oGrid->getCode();
    }

    public function serviceEntityOfferAccepted($iContentId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isAuction())
            return '';

        $iUserId = bx_get_logged_profile_id();

        if(empty($iContentId) && ($_iContentId = bx_get('id')) !== false)
            $iContentId = (int)$_iContentId;

        $aContent = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContent) || !is_array($aContent) || $aContent[$CNF['FIELD_QUANTITY']] <= 0)
            return '';

        $aOffer = $this->_oDb->getOffersBy(array(
            'type' => 'content_and_author_ids', 
            'content_id' => $iContentId, 
            'author_id' => $iUserId,
            'status' => BX_ADS_OFFER_STATUS_ACCEPTED
        ));

        if(empty($aOffer) || !is_array($aOffer))
            return '';

        return $this->_oTemplate->entryOfferAccepted($iUserId, $aContent, $aOffer);
    }

    public function serviceIsSourcesAvaliable()
    {
        return $this->_oConfig->isSources();
    }
    
    public function serviceGetSources($iAuthorId)
    {
        $aSources = $this->_oDb->getSources(['sample' => 'all']);
        $aOptions = $this->_oDb->getSourcesOptions($iAuthorId);

        $aResult = [];
        foreach($aSources as $sSource => $aSource) {
            if(!isset($aOptions[$aSource['option_prefix'] . 'active']) || (int)$aOptions[$aSource['option_prefix'] . 'active']['value'] != 1) 
                continue;

            foreach($aOptions as $sName => $aOption)
                if(strpos($sName, $aSource['option_prefix']) !== false)
                    $aSource['options'][$sName] = $aOption;
            $aResult[$sSource] = $aSource;
        }

        return $aResult; 
    }

    public function serviceGetSource($iAuthorId, $sAuthorSource = '')
    {
    	$aSourcesOptions = $this->serviceGetSources($iAuthorId);
        if(empty($aSourcesOptions) || !is_array($aSourcesOptions))
            return false;

        $mixedResult = false;
        if(!empty($sAuthorSource)) {
            if(!empty($aSourcesOptions[$sAuthorSource]) && is_array($aSourcesOptions[$sAuthorSource]))
                $mixedResult = $aSourcesOptions[$sAuthorSource];
        }
        else 
            $mixedResult = array_shift($aSourcesOptions);

    	return $mixedResult;
    }

    public function serviceLoadEntriesFromSourceByTerm($sSourceType, $sTerm)
    {
        $CNF = &$this->_oConfig->CNF;

        $oSource = $this->getObjectSource($sSourceType, $this->_iProfileId);
        if(!$oSource)
            return [];

        $aEntries = $oSource->getEntries(['sample' => 'all_id_title_pairs']);
        if(empty($aEntries) || !is_array($aEntries))
            return [];

        $aResults = []; 
        foreach($aEntries as $aEntry) {
            if(stripos($aEntry[$CNF['FIELD_TITLE']], $sTerm) === false)
                continue;

            $aResults[] = [
                'label' => $aEntry[$CNF['FIELD_TITLE']], 
                'value' => $aEntry[$CNF['FIELD_SOURCE']], 
            ];
        }

        return $aResults; 
    }

    public function serviceLoadEntryFromSource($sSourceType, $sSource)
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = [];
        $oSource = $this->getObjectSource($sSourceType, $this->_iProfileId);
        if(!$oSource)
            return $aResult;

        $aEntry = $oSource->getEntry($sSource);
        if(empty($aEntry) || !is_array($aEntry))
            return $aResult;

        $aName = $this->serviceCheckName($aEntry[$CNF['FIELD_TITLE']]);
        if(!empty($aName) && is_array($aName))
            $aResult[$CNF['FIELD_NAME']] = ['type' => 'text', 'value' => $aName['name']];

        $aKey2Type = [
            $CNF['FIELD_TITLE'] => 'text',
            $CNF['FIELD_URL'] => 'hidden',
            $CNF['FIELD_TEXT'] => 'text_html',
            $CNF['FIELD_TAGS'] => 'text',
            $CNF['FIELD_PRICE'] => 'text', 
            $CNF['FIELD_QUANTITY'] => 'text'
        ];
        foreach($aEntry as $sKey => $sValue)
            if(isset($aKey2Type[$sKey]))
                $aResult[$sKey] = ['type' => $aKey2Type[$sKey], 'value' => $sValue];

        return $aResult;
    }

    public function serviceBlockSourcesDetails($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isLogged())
             return bx_is_api() ? [bx_api_get_msg(_t('_Access denied'))] : ['content' => MsgBox(_t('_Access denied'))];

        $iProfileId = !empty($iProfileId) ? $iProfileId : bx_get_logged_profile_id();

        $oForm = BxTemplFormView::getObjectInstance($CNF['OBJECT_FORM_SOURCES_DETAILS'], $CNF['OBJECT_FORM_SOURCES_DETAILS_DISPLAY_EDIT']);
        $oForm->setProfileId($iProfileId);
        $oForm->initChecker();

        if($oForm->isSubmitted()) {
            if($oForm->isValid()) {
                $aOptions = $this->_oDb->getSourcesOptions();
                foreach($aOptions as $aOption) {
                    $sValue = bx_get($aOption['name']) !== false ? bx_get($aOption['name']) : '';
                    $this->_oDb->updateSourceOption($iProfileId, $aOption['id'], bx_process_input($sValue));
                }
                if (bx_is_api()){
                    return [
                        bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['name' => $this->getName(), 'request' => ['url' => '/api.php?r=' . $this->getName() . '/block_sources_details', 'immutable' => true]]]),
                        bx_api_get_block('redirect', ['uri' => '/' . BxDolPermalinks::getInstance()->permalink($CNF['URL_SOURCES']), 'timeout' => 100])
                        ];
                }
                else{
                    header('Location: ' . bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_SOURCES'])));
                    return;
                }
            }
            else
                foreach($oForm->aInputs as $aInput)
                    if(!empty($aInput['error']) && !empty($aInput['attrs']['bx-data-source'])) {
                        $sSourceBlock = 'source_' . (int)$aInput['attrs']['bx-data-source'] . '_begin';
                        if(!empty($oForm->aInputs[$sSourceBlock]))
                            $oForm->aInputs[$sSourceBlock]['collapsed'] = false;
                    }
        }

        return bx_is_api() ? [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['name' => $this->getName(), 'request' => ['url' => '/api.php?r=' . $this->getName() . '/block_sources_details', 'immutable' => true]]])] : ['content' => $oForm->getCode()];
        
    }

    public function isEntryActive($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        $iViewer = bx_get_logged_profile_id();
        $bModerator = $this->_isModerator();

        $mixedResult = null;
        /**
         * @hooks
         * @hookdef hook-bx_ads-is_entry_active 'bx_ads', 'is_entry_active' - hook to override whether an ad (entry) active or not
         * It's equivalent to @ref hook-bx_base_general-is_entry_active
         * @hook @ref hook-bx_ads-is_entry_active
         */
        bx_alert($this->getName(), 'is_entry_active', 0, 0, [
            'viewer_id' => $iViewer, 
            'is_moderator' => $bModerator, 
            'content_info' => $aContentInfo, 
            'override_result' => &$mixedResult
        ]);
        if($mixedResult !== null)
            return $mixedResult;

        if($aContentInfo[$CNF['FIELD_AUTHOR']] == $iViewer || $bModerator)
            return true;

        if(isset($CNF['FIELD_STATUS']) && !in_array($aContentInfo[$CNF['FIELD_STATUS']], array(BX_BASE_MOD_TEXT_STATUS_ACTIVE, BX_ADS_STATUS_OFFER, BX_ADS_STATUS_SOLD)))
            return false;

        if(isset($CNF['FIELD_STATUS_ADMIN']) && $aContentInfo[$CNF['FIELD_STATUS_ADMIN']] != 'active')
            return false;

        return true;        
    }

    public function isAuction($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->_oConfig->isAuction() && (int)$aContentInfo[$CNF['FIELD_AUCTION']] != 0;
    }

    public function isAllowedMakeOffer($mixedContent, $isPerformAction = false)
    {
        return $this->checkAllowedMakeOffer($mixedContent, $isPerformAction) === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedMakeOffer($mixedContent, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;
        $sTxtError = '_sys_txt_access_denied';

        $iProfileId = bx_get_logged_profile_id();

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);

        if(empty($mixedContent) || !is_array($mixedContent))
            return _t($sTxtError);

        if(!$this->isAuction($mixedContent) || (int)$mixedContent[$CNF['FIELD_QUANTITY']] <= 0)
            return _t($sTxtError);

        if($mixedContent[$CNF['FIELD_AUTHOR']] == $iProfileId)
            return _t($sTxtError);

        $aCheck = checkActionModule($iProfileId, 'make offer', $this->getName(), $isPerformAction);
        if($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function isAllowedViewOffers($mixedContent, $isPerformAction = false)
    {
        return $this->checkAllowedViewOffers($mixedContent, $isPerformAction) === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedViewOffers($mixedContent, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;
        $sTxtError = '_sys_txt_access_denied';

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);

        if(empty($mixedContent) || !is_array($mixedContent))
            return _t($sTxtError);

        if(!$this->isAuction($mixedContent))
            return _t($sTxtError);

        if($this->_isModerator())
            return CHECK_ACTION_RESULT_ALLOWED;

        if($mixedContent[$CNF['FIELD_AUTHOR']] == bx_get_logged_profile_id())
            return CHECK_ACTION_RESULT_ALLOWED;

        return _t($sTxtError);
    }

    public function isAllowedMarkShipped($mixedContent, $isPerformAction = false)
    {
        return $this->checkAllowedMarkShipped($mixedContent, $isPerformAction) === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedMarkShipped($mixedContent, $isPerformAction = false)
    {
        return $this->checkAllowedMarkShippedForProfile($mixedContent, $isPerformAction);
    }

    public function checkAllowedMarkShippedForProfile($mixedContent, $isPerformAction = false, $iProfileId = false)
    {
        $CNF = &$this->_oConfig->CNF;
        $sTxtError = '_sys_txt_access_denied';

        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();
                
        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);

        if(empty($mixedContent) || !is_array($mixedContent) || !$this->isSingle($mixedContent))
            return _t($sTxtError);

        if((int)$mixedContent[$CNF['FIELD_SHIPPED']] != 0 || $mixedContent[$CNF['FIELD_STATUS']] != BX_ADS_STATUS_SOLD || (!$this->isEntryAuthor($mixedContent, $iProfileId) && !$this->_isModerator() && !$this->_isAdministrator()))
            return _t($sTxtError);

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function isAllowedMarkReceived($mixedContent, $isPerformAction = false)
    {
        return $this->checkAllowedMarkReceived($mixedContent, $isPerformAction) === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedMarkReceived($mixedContent, $isPerformAction = false)
    {
        return $this->checkAllowedMarkReceivedForProfile($mixedContent, $isPerformAction);
    }

    public function checkAllowedMarkReceivedForProfile($mixedContent, $isPerformAction = false, $iProfileId = false)
    {
        $CNF = &$this->_oConfig->CNF;
        $sTxtError = '_sys_txt_access_denied';

        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);

        if(empty($mixedContent) || !is_array($mixedContent) || !$this->isSingle($mixedContent))
            return _t($sTxtError);

        if((int)$mixedContent[$CNF['FIELD_RECEIVED']] != 0 || !$this->_oDb->hasLicense($iProfileId, $mixedContent[$CNF['FIELD_ID']]))
            return _t($sTxtError);

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function onPublished($iContentId)
    {
        $this->serviceUpdateCategoriesStats($iContentId);

        parent::onPublished($iContentId);
    }

    public function onOfferAdded($iOfferId, &$aResult)
    {
        $CNF = &$this->_oConfig->CNF;

        $aOfferInfo = $this->_oDb->getOffersBy(array('type' => 'id', 'id' => $iOfferId));
        if(empty($aOfferInfo) || !is_array($aOfferInfo))
            return;

        $iContentId = (int)$aOfferInfo[$CNF['FIELD_OFR_CONTENT']];
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return;

        $iViewer = bx_get_logged_profile_id();        
        $oViewer = BxDolProfile::getInstanceMagic($iViewer);

        if(getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_OFFER_ADDED'], 0, $aContentInfo[$CNF['FIELD_AUTHOR']], array(
                'viewer_name' => $oViewer->getDisplayName(),
                'viewer_url' => $oViewer->getUrl(),
                'entry_name' => $aContentInfo[$CNF['FIELD_TITLE']],
                'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                )))
            ));

        $aParams = $this->_alertParamsOffer($aContentInfo, $aOfferInfo);
        $aParams['override_result'] = &$aResult;

        /**
         * @hooks
         * @hookdef hook-bx_ads-offer_added 'bx_ads', 'offer_added' - hook after an offer was added. Allows to override action results.
         * - $unit_name - equals `bx_ads`
         * - $action - equals `offer_added`
         * - $object_id - offer id
         * - $sender_id - offer author profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_id` - [int] content id
         *      - `object_author_id` - [int] content author profile id
         *      - `offer_id` - [int] offer id
         *      - `offer_author_id` - [int] offer author profile id
         *      - `privacy_view` - [int] privacy for view action, equals to BX_DOL_PG_ALL, @see BxDolPrivacy
         *      - `override_result` - [array] by ref, results array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_ads-offer_added
         */
        bx_alert($this->getName(), 'offer_added', $iOfferId, $aOfferInfo[$CNF['FIELD_OFR_AUTHOR']], $aParams);
    }

    public function onOfferAccepted($iOfferId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aOfferInfo = $this->_oDb->getOffersBy(array('type' => 'id', 'id' => $iOfferId));
        if(empty($aOfferInfo) || !is_array($aOfferInfo))
            return;

        $iContentId = (int)$aOfferInfo[$CNF['FIELD_OFR_CONTENT']];
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return;

        if($aContentInfo[$CNF['FIELD_STATUS']] != BX_ADS_STATUS_OFFER && ($this->isSingle($aContentInfo) || $this->getAvailableQuantity($aContentInfo) <= 0))
            if(!$this->_oDb->updateEntriesBy([$CNF['FIELD_STATUS'] => BX_ADS_STATUS_OFFER], [$CNF['FIELD_ID'] => $iContentId]))
                return;

        $this->serviceUpdateCategoriesStats($iContentId);

        $iOfferer = (int)$aOfferInfo[$CNF['FIELD_OFR_AUTHOR']];
        $oOfferer = BxDolProfile::getInstanceMagic($iOfferer);

        if(getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_OFFER_ACCEPTED'], 0, $iOfferer, array(
                'offerer_name' => $oOfferer->getDisplayName(),
                'offerer_url' => $oOfferer->getUrl(),
                'entry_name' => $aContentInfo[$CNF['FIELD_TITLE']],
                'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                )))
            ));

        $aParams = $this->_alertParamsOffer($aContentInfo, $aOfferInfo);
        
        /**
         * @hooks
         * @hookdef hook-bx_ads-offer_accepted 'bx_ads', 'offer_accepted' - hook after an offer was accepted.
         * It's equivalent to @ref hook-bx_ads-offer_added
         * except content author profile id is passed to $sender_id and
         * `override_result` parameter in $extra_params is missing
         * @hook @ref hook-bx_ads-offer_accepted
         */
        bx_alert($this->getName(), 'offer_accepted', $iOfferId, $aContentInfo[$CNF['FIELD_AUTHOR']], $aParams);
    }

    public function onOfferDeclined($iOfferId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aOfferInfo = $this->_oDb->getOffersBy(array('type' => 'id', 'id' => $iOfferId));
        if(empty($aOfferInfo) || !is_array($aOfferInfo))
            return;

        $iContentId = (int)$aOfferInfo[$CNF['FIELD_OFR_CONTENT']];
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return;

        $iOfferer = (int)$aOfferInfo[$CNF['FIELD_OFR_AUTHOR']];
        $oOfferer = BxDolProfile::getInstanceMagic($iOfferer);

        if(getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_OFFER_DECLINED'], 0, $iOfferer, array(
                'offerer_name' => $oOfferer->getDisplayName(),
                'offerer_url' => $oOfferer->getUrl(),
                'entry_name' => $aContentInfo[$CNF['FIELD_TITLE']],
                'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                )))
            ));

        $aParams = $this->_alertParamsOffer($aContentInfo, $aOfferInfo);
        
        /**
         * @hooks
         * @hookdef hook-bx_ads-offer_declined 'bx_ads', 'offer_declined' - hook after an offer was declined.
         * It's equivalent to @ref hook-bx_ads-offer_accepted
         * @hook @ref hook-bx_ads-offer_declined
         */
        bx_alert($this->getName(), 'offer_declined', $iOfferId, $aContentInfo[$CNF['FIELD_AUTHOR']], $aParams);
    }

    public function onOfferCanceled($iOfferId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aOfferInfo = $this->_oDb->getOffersBy(['type' => 'id', 'id' => $iOfferId]);
        if(empty($aOfferInfo) || !is_array($aOfferInfo))
            return;

        $iContentId = (int)$aOfferInfo[$CNF['FIELD_OFR_CONTENT']];
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return;

        if(!$this->_oDb->updateEntriesBy([$CNF['FIELD_STATUS'] => BX_BASE_MOD_TEXT_STATUS_ACTIVE], [$CNF['FIELD_ID'] => $iContentId]))
            return;

        $this->serviceUpdateCategoriesStats($iContentId);

        $iOfferer = (int)$aOfferInfo[$CNF['FIELD_OFR_AUTHOR']];
        $oOfferer = BxDolProfile::getInstanceMagic($iOfferer);

        if(getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_OFFER_CANCELED'], 0, (int)$aContentInfo[$CNF['FIELD_AUTHOR']], [
                'offerer_name' => $oOfferer->getDisplayName(),
                'offerer_url' => $oOfferer->getUrl(),
                'entry_name' => $aContentInfo[$CNF['FIELD_TITLE']],
                'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', [
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                ]))
            ]);

        $aParams = $this->_alertParamsOffer($aContentInfo, $aOfferInfo);
        
        /**
         * @hooks
         * @hookdef hook-bx_ads-offer_canceled 'bx_ads', 'offer_canceled' - hook after an offer was declined.
         * It's equivalent to @ref hook-bx_ads-offer_added
         * except `override_result` parameter in $extra_params is missing
         * @hook @ref hook-bx_ads-offer_canceled
         */
        bx_alert($this->getName(), 'offer_canceled', $iOfferId, $aOfferInfo[$CNF['FIELD_OFR_AUTHOR']], $aParams);
    }

    /**
     * Common methods.
     */
    public function onShipped($mixedContent, $iProfileSrc = 0, $iProfileDst = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);
        $iContentId = (int)$mixedContent[$CNF['FIELD_ID']];

        if(empty($iProfileSrc))
            $iProfileSrc = (int)$mixedContent[$CNF['FIELD_AUTHOR']];

        $oProfileSrc = BxDolProfile::getInstanceMagic($iProfileSrc);

        $aOffer = $this->_oDb->getOffersBy(array('type' => 'accepted', 'content_id' => $iContentId));
        $bOffer = !empty($aOffer) && is_array($aOffer);

        if(empty($iProfileDst) && $bOffer)
            $iProfileDst = (int)$aOffer[$CNF['FIELD_OFR_AUTHOR']];        

        if(!empty($oProfileSrc) && !empty($iProfileDst) && getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_SHIPPED'], 0, $iProfileDst, array(
                'vendor_name' => $oProfileSrc->getDisplayName(),
                'vendor_url' => $oProfileSrc->getUrl(),
                'entry_name' => $mixedContent[$CNF['FIELD_TITLE']],
                'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                )))
            ));

        $aParams = $this->_alertParams($mixedContent);
        $aParams = array_merge($aParams, [
            'profile_src' => $iProfileSrc,
            'profile_dst' => $iProfileDst,
            'offer_id' => $bOffer ? (int)$aOffer[$CNF['FIELD_OFR_ID']] : 0,
        ]);

        /**
         * @hooks
         * @hookdef hook-bx_ads-shipped 'bx_ads', 'shipped' - hook after the ad (entry) was marked as shipped
         * - $unit_name - equals `bx_ads`
         * - $action - equals `shipped`
         * - $object_id - ad (entry) id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `status` - [string] content status
         *      - `status_admin` - [string] content admin status
         *      - `privacy_view` - [int] or [string] privacy for view content action, @see BxDolPrivacy
         *      - `cf` - [int] content's audience filter value
         *      - `profile_src` - [int] sender profile id
         *      - `profile_dst` - [int] recipient profile id
         *      - `offer_id` - [int] offer id if the ad was sold by offer
         * @hook @ref hook-bx_ads-shipped
         */
        bx_alert($this->getName(), 'shipped', $iContentId, false, $aParams);
    }

    public function onReceived($mixedContent, $iProfileSrc = 0, $iProfileDst = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);
        $iContentId = (int)$mixedContent[$CNF['FIELD_ID']];

        if(empty($iProfileDst))
            $iProfileDst = (int)$mixedContent[$CNF['FIELD_AUTHOR']];

        $aOffer = $this->_oDb->getOffersBy(array('type' => 'accepted', 'content_id' => $iContentId));
        $bOffer = !empty($aOffer) && is_array($aOffer);

        if(empty($iProfileSrc) && $bOffer)
            $iProfileSrc = (int)$aOffer[$CNF['FIELD_OFR_AUTHOR']];
        $oProfileSrc = BxDolProfile::getInstanceMagic($iProfileSrc);

        if(!empty($iProfileSrc) && !empty($iProfileDst) && getParam($CNF['PARAM_USE_IIN']) == 'on')
            sendMailTemplate($CNF['ETEMPLATE_RECEIVED'], 0, $iProfileDst, array(
                'client_name' => $oProfileSrc->getDisplayName(),
                'client_url' => $oProfileSrc->getUrl(),
                'entry_name' => $mixedContent[$CNF['FIELD_TITLE']],
                'entry_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                    'i' => $CNF['URI_VIEW_ENTRY'], 
                    $CNF['FIELD_ID'] => $iContentId
                )))
            ));

        $aParams = $this->_alertParams($mixedContent);
        $aParams = array_merge($aParams, [
            'profile_src' => $iProfileSrc,
            'profile_dst' => $iProfileDst,
            'offer_id' => $bOffer ? (int)$aOffer[$CNF['FIELD_OFR_ID']] : 0,
        ]);

        /**
         * @hooks
         * @hookdef hook-bx_ads-received 'bx_ads', 'received' - hook after the ad (entry) was marked as received
         * It's equivalent to @ref hook-bx_ads-shipped
         * @hook @ref hook-bx_ads-received
         */
        bx_alert($this->getName(), 'received', $iContentId, false, $aParams);
    }

    public function getObjectSource($sSource, $iProfileId = 0)
    {
        $aSource = $this->_oDb->getSources(array('sample' => 'by_name', 'name' => $sSource));
        if(empty($aSource) || !is_array($aSource) || empty($aSource['class_name']))
            return false;

        if(!empty($iProfileId)) {
            $aSource['author'] = (int)$iProfileId;
            $aSource['options'] = $this->_oDb->getSourcesOptions((int)$iProfileId, $aSource['id']);
        }

        $sClassPath = !empty($aSource['class_file']) ? BX_DIRECTORY_PATH_ROOT . $aSource['class_file'] : $this->_oConfig->getClassPath() . $aSource['class_name'] . '.php';
        if(!file_exists($sClassPath))
            return false;

        require_once($sClassPath);
        return new $aSource['class_name']($this->_iProfileId, $aSource, $this);
    }

    public function offerAccept($iId) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aOfferInfo = $this->_oDb->getOffersBy(['type' => 'id', 'id' => $iId]);
        if(empty($aOfferInfo) || !is_array($aOfferInfo))
            return false;

        $iContentId = (int)$aOfferInfo[$CNF['FIELD_OFR_CONTENT']];
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return false;

        $iQuantity = (int)$aOfferInfo[$CNF['FIELD_OFR_QUANTITY']];
        $iQuantityAvailable = $this->getAvailableQuantity($aContentInfo);
        if($iQuantity > $iQuantityAvailable)
            return _t('_bx_ads_txt_err_offer_wrong_quantity', $iQuantityAvailable);

        if(!$this->_oDb->updateOffer([$CNF['FIELD_OFR_STATUS'] => BX_ADS_OFFER_STATUS_ACCEPTED], [$CNF['FIELD_OFR_ID'] => $iId]))
            return false;

        $this->onOfferAccepted($iId);
        return true;
    }

    public function offerDecline($iId) 
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oDb->updateOffer([$CNF['FIELD_OFR_STATUS'] => BX_ADS_OFFER_STATUS_DECLINED], [$CNF['FIELD_OFR_ID'] => $iId]))
            return false;

        $this->onOfferDeclined($iId);
        return true;        
    }

    public function offerCancel($iId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oDb->updateOffer([$CNF['FIELD_OFR_STATUS'] => BX_ADS_OFFER_STATUS_CANCELED], [$CNF['FIELD_OFR_ID'] => $iId]))
            return false;

        $this->onOfferCanceled($iId);
        return true;
    }
    
    public function offerPay($iId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aOffer = $this->_oDb->getOffersBy(array('type' => 'id', 'id' => $iId));
        if(empty($aOffer) || !is_array($aOffer))
            return false;

        $iContent = (int)$aOffer[$CNF['FIELD_OFR_CONTENT']];
        $aContent = $this->_oDb->getContentInfoById($iContent);
        $iContentAuthor = (int)$aContent[$CNF['FIELD_AUTHOR']];

        $aReturn = array(
            'redirect' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php', array(
                'i' => $CNF['URI_VIEW_ENTRY'], 
                $CNF['FIELD_ID'] => $aOffer[$CNF['FIELD_OFR_CONTENT']]
            )))
        );

        $oPayments = BxDolPayments::getInstance();
        $aResult = $oPayments->addToCart($iContentAuthor, $this->getName(), $iContent, $aOffer[$CNF['FIELD_OFR_QUANTITY']]);
        if(!empty($aResult) && is_array($aResult)) {
            if(!empty($aResult['message']))
                $aReturn['msg'] = $aResult['message'];

            if(isset($aResult['code']) && (int)$aResult['code'] == 0)
                $aReturn['redirect'] = $oPayments->getCartUrl($iContentAuthor);
        }

        return $aReturn;
    }

    public function processMetasAdd($iContentId)
    {
        if(!parent::processMetasAdd($iContentId))
            return false;

        $CNF = &$this->_oConfig->CNF;

        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        $aCategoryTypes = $this->_oDb->getCategoryTypes(array('type' => 'all'));
        foreach($aCategoryTypes as $aCategoryType)
            $oMetatags->metaAddAuto($iContentId, $aContentInfo, $CNF, $aCategoryType['display_add']);

        return true;
    }

    public function processMetasEdit($iContentId, $oForm)
    {
        if(!parent::processMetasEdit($iContentId, $oForm))
            return false;
        
        $CNF = &$this->_oConfig->CNF;

        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        
        $aCategoryTypes = $this->_oDb->getCategoryTypes(array('type' => 'all'));
        foreach($aCategoryTypes as $aCategoryType)
            $oMetatags->metaAddAuto($iContentId, $aContentInfo, $CNF, $aCategoryType['display_edit']);

        return true;
    }

    public function getCategoryDisplay($sDisplayType, $iCategory = 0)
    {
        if(empty($iCategory) && bx_get('category') !== false)
            $iCategory = (int)bx_get('category');

        if(empty($iCategory))
            return false;

        $aCategory = $this->_oDb->getCategories(array('type' => 'id_full', 'id' => $iCategory));

        $sKey = 'type_display_' . $sDisplayType;
        if(empty($aCategory[$sKey]))
            return false;

        return $aCategory[$sKey];
    }

    public function isSingle($mixedContent)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);

        return (int)$mixedContent[$CNF['FIELD_SINGLE']] == 1;
    }

    public function getAvailableQuantity($mixedContent)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedContent))
            $mixedContent = $this->_oDb->getContentInfoById((int)$mixedContent);

        if(!$this->_oConfig->isAuction() || (int)$mixedContent[$CNF['FIELD_AUCTION']] == 0)
            return (int)$mixedContent[$CNF['FIELD_QUANTITY']];

        $iQuantity = (int)$this->_oDb->getOffersBy([
            'type' => 'quantity_reserved', 
            'content_id' => $mixedContent[$CNF['FIELD_ID']], 
            'status' => BX_ADS_OFFER_STATUS_ACCEPTED
        ]);

        return (int)$mixedContent[$CNF['FIELD_QUANTITY']] - $iQuantity;
    }


    /**
     * Internal methods.
     */
    protected function _actionMarkAs($sAction)
    {
        $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(($mixedResult = $this->serviceMarkAs($sAction, $iContentId)) !== true)
            return array('msg' => $mixedResult); 

        return array(
            'reload' => 1
        );
    }

    protected function _actionChangeStatus($sStatus)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        if(($mixedResult = $this->checkAllowedEdit($aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return array('msg' => $mixedResult);

        if(!$this->_oDb->updateEntriesBy(array($CNF['FIELD_STATUS'] => $sStatus), array($CNF['FIELD_ID'] => $iContentId)))
            return array('msg' => _t('_bx_ads_txt_err_cannot_perform_action'));

        $this->serviceUpdateCategoriesStats($aContentInfo);

        return array(
            'reload' => 1
        );
    }

    protected function _serviceEntityForm ($sFormMethod, $iContentId = 0, $sDisplay = false, $sCheckFunction = false, $bErrorMsg = true)
    {
        $CNF = &$this->_oConfig->CNF;

        $mixedContent = $this->_getContent($iContentId, true);
        if($mixedContent === false)
            return false;

        list($iContentId, $aContentInfo) = $mixedContent;

        $sDisplayType = false;
        switch($sFormMethod) {
            case 'editDataForm':
                if($sDisplay === false)
                    $sDisplayType = 'edit';
                break;
            case 'viewDataForm':
            case 'viewDataEntry':
                $sDisplayType = 'view';
                break;
        }

        if($sDisplayType !== false && ($sDisplayNew = $this->getCategoryDisplay($sDisplayType, $aContentInfo[$CNF['FIELD_CATEGORY']])) !== false)
            $sDisplay = $sDisplayNew;

        return parent::_serviceEntityForm ($sFormMethod, $iContentId, $sDisplay, $sCheckFunction, $bErrorMsg);
    }

    protected function _getCategoryOptions($iParentId, &$aValues)
    {
        $aCategories = $this->_oDb->getCategories(array('type' => 'parent_id', 'parent_id' => $iParentId, 'active' => true));
        foreach($aCategories as $aCategory) {
            $aValues[] = array('key' => $aCategory['id'], 'value' => str_repeat('--', (int)$aCategory['level']) . ' ' . _t($aCategory['title']));

            $this->_getCategoryOptions($aCategory['id'], $aValues);
        }
    }

    protected function _getSearchableFields($mixedDisplayType = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($mixedDisplayType))
            $mixedDisplayType = array('add', 'edit');

        $aResult = array();
        $aDisplays = $this->_oDb->getDisplays($this->_oConfig->getName() . '_entry', $mixedDisplayType);
        foreach($aDisplays as $aDisplay) {
            if($aDisplay['display_name'] == $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'])
                continue;

            $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $aDisplay['display_name'], $this->_oTemplate);
            if(!$oForm)
                continue;

            $aResult = array_merge($aResult, $oForm->aInputs);
        }

        return $aResult;
    }
    
    protected function _getContentForTimelinePost($aEvent, $aContentInfo, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $bDynamic = isset($aBrowseParams['dynamic_mode']) && (bool)$aBrowseParams['dynamic_mode'] === true;

        $sCategory = '';
        if(!empty($CNF['FIELD_CATEGORY']) && !empty($aContentInfo[$CNF['FIELD_CATEGORY']])) {
            $iCategory = (int)$aContentInfo[$CNF['FIELD_CATEGORY']];
            $aCategory = $this->_oDb->getCategories(array('type' => 'id', 'id' => $iCategory));
            $sCategory = _t($aCategory['title']);
            $sCategoryLink = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_CATEGORIES'], array($CNF['GET_PARAM_CATEGORY'] => $iCategory)));
        }

        $sPrice = _t('_bx_ads_txt_free');
        if(!empty($CNF['FIELD_PRICE']) && !empty($aContentInfo[$CNF['FIELD_PRICE']]))
            $sPrice = _t_format_currency_ext((float)$aContentInfo[$CNF['FIELD_PRICE']], [
                'sign' => BxDolPayments::getInstance()->getCurrencySign((int)$aContentInfo[$CNF['FIELD_AUTHOR']])
            ]);

        $aResult = parent::_getContentForTimelinePost($aEvent, $aContentInfo, $aBrowseParams);

        if(!$this->_bIsApi) {
            if(empty($aResult['raw']))
                $aResult['raw'] = '';

            $aResult['text'] = $this->_oTemplate->parseHtmlByName('timeline_post_text.html', [
                'category_link' => $sCategoryLink,
                'category_title' => $sCategory,
                'category_title_attr' => bx_html_attribute($sCategory),
                'price' => $sPrice,
                'text' => $aResult['text']
            ]);
        }
        else
            $aResult = array_merge($aResult, [
                'price' => $sPrice,
                'category_title' => $sCategory,
                'register_click' => $this->_oConfig->isPromotion() ? 'bx_ads/register_click&params[]=' . $aContentInfo[$CNF['FIELD_ID']] : false,
                'register_impression' => $this->_oConfig->isPromotion() ? 'bx_ads/register_impression&params[]=' . $aContentInfo[$CNF['FIELD_ID']] : false,
            ]);

        if($this->_oConfig->isSources() && !empty($aContentInfo[$CNF['FIELD_URL']]))
            $aResult['url'] = $aContentInfo[$CNF['FIELD_URL']];

        if($this->_bIsApi)
            return $aResult;

        if($this->_oConfig->isPromotion()) {
            $sJsObject = $this->_oConfig->getJsObject('main');
            $sHtmlId = $this->_oConfig->getHtmlIds('unit') . $aContentInfo[$CNF['FIELD_ID']] . '-' . time() . '-' . mt_rand(0, 100);

            $aResult['onclick'] = 'return ' . $sJsObject . '.registerClick(this, ' . $aContentInfo[$CNF['FIELD_ID']] . ')';
            $aResult['raw'] .= $this->_oTemplate->parseHtmlByName('timeline_post_promotion.html', [
                'html_id' => $sHtmlId,
                'js_code' => $this->_oTemplate->_wrapInTagJsCode($sJsObject . '.registerTrakerForTimeline(' . $aContentInfo[$CNF['FIELD_ID']] . ', \'' . $sHtmlId . '\');')
            ]);
        }

        $sInclude = $this->_oTemplate->addCss(['timeline.css'], $bDynamic);
        if($bDynamic)
            $aResult['raw'] .= $sInclude;

        return $aResult;
    }

    protected function _getBlockLicenses($sType = '') 
    {
        $CNF = &$this->_oConfig->CNF;

        $sGrid = $CNF['OBJECT_GRID_LICENSES' . (!empty($sType) ? '_' . strtoupper($sType) : '')];
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return '';

        $this->_oDb->updateLicense(array('new' => 0), array('profile_id' => bx_get_logged_profile_id(), 'new' => 1));

        $this->_oTemplate->addJs(array('licenses.js'));
        return array(
            'content' => $this->_oTemplate->getJsCode('licenses', array('sObjNameGrid' => $sGrid)) . $oGrid->getCode(),
            'menu' => $CNF['OBJECT_MENU_LICENSES']
        );
    }

    protected function _alertParamsOffer($aContentInfo, $aOfferInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        $aParams = array(
            'object_id' => (int)$aContentInfo[$CNF['FIELD_ID']],
            'object_author_id' => (int)$aContentInfo[$CNF['FIELD_AUTHOR']],

            'offer_id' => (int)$aOfferInfo[$CNF['FIELD_OFR_ID']],
            'offer_author_id' => (int)$aOfferInfo[$CNF['FIELD_OFR_AUTHOR']],
        );
        if(isset($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]))
            $aParams['privacy_view'] = $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']];

        return $aParams;
    }
}

/** @} */
