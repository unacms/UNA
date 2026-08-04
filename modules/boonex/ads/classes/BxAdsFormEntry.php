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

/**
 * Create/Edit entry form
 */
class BxAdsFormEntry extends BxBaseModTextFormEntry
{
    protected $_aContentInfo;

    protected $_bSources;
    protected $_iCategory;
    protected $_sGhostTemplateCover = 'form_ghost_template_cover.html';
    protected $_bDisplayEditBudget;
	
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_ads';
        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $sJsObject = $this->_oModule->_oConfig->getJsObject('form');

        $this->_bSources = $this->_oModule->_oConfig->isSources();
        $this->_bDisplayEditBudget = $this->aParams['display'] == $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_BUDGET'];

        $this->_initCategoryFields((int)BxDolSession::getInstance()->getValue($this->aParams['display'] . '_category'));

        if(!$this->_bSources) {
            if(isset($this->aInputs[$CNF['FIELD_SOURCE_TYPE']]))
                unset($this->aInputs[$CNF['FIELD_SOURCE_TYPE']]);

            if(isset($this->aInputs[$CNF['FIELD_SOURCE']]))
                unset($this->aInputs[$CNF['FIELD_SOURCE']]);
        }

        if(isset($this->aInputs[$CNF['FIELD_SOURCE_TYPE']], $this->aInputs[$CNF['FIELD_SOURCE']])) {
            $aMask = ["javascript:%s.loadFromSource(this, '%s', '%s');", $sJsObject, $CNF['FIELD_SOURCE_TYPE'], $CNF['FIELD_SOURCE']];
            $sOnBlur = call_user_func_array('sprintf', $aMask);

            $this->aInputs[$CNF['FIELD_SOURCE']]['attrs']['onblur'] = $sOnBlur;
        }

        if(isset($this->aInputs[$CNF['FIELD_TITLE']], $this->aInputs[$CNF['FIELD_NAME']])) {
            $aMask = array('mask' => "javascript:%s.checkName(this, '%s', '%s');", $sJsObject, $CNF['FIELD_TITLE'], $CNF['FIELD_NAME']);
            if($this->aParams['display'] == $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'] && bx_get('id') !== false) {
                $aMask['mask'] = "javascript:%s.checkName(this, '%s', '%s', %d);";
                $aMask[] = (int)bx_get('id');
            }

            $sOnBlur = call_user_func_array('sprintf', array_values($aMask)); 
        	$this->aInputs[$CNF['FIELD_TITLE']]['attrs']['onblur'] = $sOnBlur;
        	$this->aInputs[$CNF['FIELD_NAME']]['attrs']['onblur'] = $sOnBlur;
        }

        if(isset($this->aInputs[$CNF['FIELD_AUCTION']]) && !$this->_oModule->_oConfig->isAuction())
            unset($this->aInputs[$CNF['FIELD_AUCTION']]);

        if(!$this->_oModule->_oConfig->isPromotion()) {
            if(isset($this->aInputs[$CNF['FIELD_BUDGET_TOTAL']]))
                unset($this->aInputs[$CNF['FIELD_BUDGET_TOTAL']]);

            if(isset($this->aInputs[$CNF['FIELD_BUDGET_DAILY']]))
                unset($this->aInputs[$CNF['FIELD_BUDGET_DAILY']]);
        }

        //--- Segmentation
        if(isset($this->aInputs[$CNF['FIELD_SEG_AGE']])) {
            if(!isset($this->aInputs[$CNF['FIELD_SEG_AGE']]['attrs']))
                $this->aInputs[$CNF['FIELD_SEG_AGE']]['attrs'] = [];

            $this->aInputs[$CNF['FIELD_SEG_AGE']]['attrs'] = array_merge($this->aInputs[$CNF['FIELD_SEG_AGE']]['attrs'], [
                'min' => 0, 
                'max' => 100
            ]);
            $this->aInputs[$CNF['FIELD_SEG_AGE']]['value'] = '18-99';
        }

        if(isset($this->aInputs[$CNF['FIELD_SEG_COUNTRY']]))
            $this->aInputs[$CNF['FIELD_SEG_COUNTRY']]['values'] = array_merge(['' => _t('_bx_ads_form_entry_input_seg_country_all')], $this->aInputs[$CNF['FIELD_SEG_COUNTRY']]['values']);

        $this->addMarkers([
            'js_object' => $sJsObject
        ]);
    }

    function getCode($bDynamicMode = false)
    {
        $sJs = $this->_oModule->_oTemplate->addJs(array('form.js'), $bDynamicMode);

        $sCode = '';
        if($bDynamicMode)
            $sCode .= $sJs;

        $sCode .= $this->_oModule->_oTemplate->getJsCode('form', [
            'sObjNameForm' => $this->getJsObjectName()
        ]);
        $sCode .= parent::getCode($bDynamicMode);

        return $sCode;
    }

    function initChecker ($aValues = [], $aSpecificValues = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($aValues && !empty($aValues['id']))
            $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($aValues['id']);
        $bContentInfo = !empty($this->_aContentInfo) && is_array($this->_aContentInfo);

        $iContentAuthorId = bx_get_logged_profile_id();
        if($bContentInfo) {
            $iContentAuthorId = (int)$this->_aContentInfo[$CNF['FIELD_AUTHOR']];

            $this->_initCategoryFields($this->_aContentInfo[$CNF['FIELD_CATEGORY']]);
        }

        if($this->_bSources) {
            if(isset($this->aInputs[$CNF['FIELD_SOURCE_TYPE']]) && !empty($iContentAuthorId)) {
                $aSource = $this->_oModule->serviceGetSource($iContentAuthorId);
                if(!empty($aSource) && is_array($aSource))
                    $this->aInputs[$CNF['FIELD_SOURCE_TYPE']]['value'] = $aSource['name'];
            }

            if(isset($this->aInputs[$CNF['FIELD_SOURCE']]) && $bContentInfo) {
                if(!isset($this->aInputs[$CNF['FIELD_SOURCE']]['attrs']))
                    $this->aInputs[$CNF['FIELD_SOURCE']]['attrs'] = [];

                $this->aInputs[$CNF['FIELD_SOURCE']]['attrs']['disabled'] = 'disabled';
            }
        }

        if(isset($CNF['FIELD_COVER']) && isset($this->aInputs[$CNF['FIELD_COVER']])) {
            if($bContentInfo)
                $this->aInputs[$CNF['FIELD_COVER']]['content_id'] = $this->_aContentInfo[$CNF['FIELD_ID']];

            $this->aInputs[$CNF['FIELD_COVER']]['ghost_template'] = $this->_oModule->_oTemplate->parseHtmlByName($this->_sGhostTemplateCover, $this->_getCoverGhostTmplVars($this->_aContentInfo));
        }

        if(isset($this->aInputs[$CNF['FIELD_SEG_AGE']]) && $bContentInfo)
            $this->aInputs[$CNF['FIELD_SEG_AGE']]['value'] = implode('-', [$this->_aContentInfo[$CNF['FIELD_SEG_AGE_MIN']], $this->_aContentInfo[$CNF['FIELD_SEG_AGE_MAX']]]);

        parent::initChecker ($aValues, $aSpecificValues);

        $sKeyBt = $CNF['FIELD_BUDGET_TOTAL'];
        if($this->isSubmitted() && $this->_bDisplayEditBudget && isset($this->aInputs[$sKeyBt], $aValues[$sKeyBt])) {
            if((float)$this->getCleanValue($sKeyBt) < (float)$aValues[$sKeyBt]) {
                $this->aInputs[$CNF['FIELD_BUDGET_TOTAL']]['error'] = _t('_bx_ads_form_entry_input_budget_total_err_decreased');
                $this->_isValid = false;
            }
        }
    }

    public function insert ($aValsToAdd = [], $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        
        $bPromotion = $this->_oModule->_oConfig->isPromotion();

        $aValsToAdd[$CNF['FIELD_SINGLE']] = $this->_getSingleField();

        if($bPromotion && isset($this->aInputs[$CNF['FIELD_BUDGET_TOTAL']]) && $this->getCleanValue($CNF['FIELD_BUDGET_TOTAL']) > 0)
            $aValsToAdd[$CNF['FIELD_STATUS_ADMIN']] = BX_ADS_STATUS_ADMIN_UNPAID;

        if(isset($this->aInputs[$CNF['FIELD_SEG_AGE']]) && ($sSegAge = $this->getCleanValue($CNF['FIELD_SEG_AGE'])) != '') {
            $aSegAge = explode('-', $sSegAge);
            if(is_array($aSegAge) && count($aSegAge) == 2)
                list($aValsToAdd[$CNF['FIELD_SEG_AGE_MIN']], $aValsToAdd[$CNF['FIELD_SEG_AGE_MAX']]) = $aSegAge;
        }

        $iContentId = parent::insert($aValsToAdd, $isIgnore);
        if(!empty($iContentId)) {
            $this->processFiles($CNF['FIELD_COVER'], $iContentId, true);
            
            $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
            if(!empty($aContentInfo[$CNF['FIELD_PRICE']]))
                $this->_oModule->_oDb->insertCommodity($iContentId, BX_ADS_COMMODITY_TYPE_PRODUCT, $aContentInfo[$CNF['FIELD_PRICE']]);

            if($bPromotion && (float)$aContentInfo[$CNF['FIELD_BUDGET_TOTAL']] > 0)
                $this->_oModule->_oDb->insertCommodity($iContentId, BX_ADS_COMMODITY_TYPE_PROMOTION, $aContentInfo[$CNF['FIELD_BUDGET_TOTAL']]);
        }

        return $iContentId;
    }

    public function update ($iContentId, $aValsToAdd = [], &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bPromotion = $this->_oModule->_oConfig->isPromotion();

        if(!$this->_bDisplayEditBudget)
            $aValsToAdd[$CNF['FIELD_SINGLE']] = $this->_getSingleField();

        if(isset($this->aInputs[$CNF['FIELD_SEG_AGE']]) && ($sSegAge = $this->getCleanValue($CNF['FIELD_SEG_AGE'])) != '') {
            $aSegAge = explode('-', $sSegAge);
            if(is_array($aSegAge) && count($aSegAge) == 2)
                list($aValsToAdd[$CNF['FIELD_SEG_AGE_MIN']], $aValsToAdd[$CNF['FIELD_SEG_AGE_MAX']]) = $aSegAge;
        }

        $aTrackTextFieldsChanges = [];
        $iResult = parent::update($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);
        if($bPromotion && in_array($CNF['FIELD_BUDGET_TOTAL'], $aTrackTextFieldsChanges['changed_fields'])) {
            $fBudgetTotalDiff = (float)$this->getCleanValue($CNF['FIELD_BUDGET_TOTAL']) - (float)$aTrackTextFieldsChanges['data'][$CNF['FIELD_BUDGET_TOTAL']];
            if($fBudgetTotalDiff > 0) {
                $this->_oModule->_oDb->insertCommodity($iContentId, BX_ADS_COMMODITY_TYPE_PROMOTION, $fBudgetTotalDiff);

                $this->_oModule->_oDb->updateEntriesBy([$CNF['FIELD_STATUS_ADMIN'] => BX_ADS_STATUS_ADMIN_UNPAID], [$CNF['FIELD_ID'] => $iContentId]);
            }
        }

        $this->processFiles($CNF['FIELD_COVER'], $iContentId, false);

        return $iResult;
    }

    public function delete ($iContentId, $aContentInfo = [])
    {
        $this->_oModule->_oDb->deleteOffer(['content_id' => $iContentId]);
        $this->_oModule->_oDb->deleteCommodity(['entry_id' => $iContentId]);
        $this->_oModule->_oDb->deleteLicense(['entry_id' => $iContentId]);

        return parent::delete($iContentId, $aContentInfo);
    }

    protected function genCustomInputSource (&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sUrl = BX_DOL_URL_ROOT . 'modules/?r=' . $this->_oModule->_oConfig->getUri() . '/get_source';
        if(isset($this->aInputs[$CNF['FIELD_SOURCE_TYPE']]) && !empty($this->aInputs[$CNF['FIELD_SOURCE_TYPE']]['value']))
            $sUrl = bx_append_url_params($sUrl, ['source_type' => $this->aInputs[$CNF['FIELD_SOURCE_TYPE']]['value']]);

        $aInput = array_merge($aInput, [
            'ajax_get_suggestions' => $sUrl, 
            'placeholder' => _t('_bx_ads_form_entry_input_source_paceholder'),
            'custom' => ['only_once' => true]
        ]);
        
         if (bx_is_api()){
             $aInput['ajax_get_suggestions'] = 'bx_ads/get_source_data&params[]=';
             $aInput['type'] = 'suggestion';
             $aInput['custom']['callback'] = 'bx_ads/load_entry_from_source&params[]=shopify_admin&params[]=';
             return $aInput;
        }

        return $this->genCustomInputUsernamesSuggestions($aInput);
    }
    
    protected function genCustomInputSourceValue($aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aValue = is_array($aInput['value']) ? $aInput['value'] : [$aInput['value']];

        $iAuthorId = $this->_getAuthorId();
        $sSourceType = $this->_getSourceType();

        $oSource = $this->_oModule->getObjectSource($sSourceType, $iAuthorId);
        if(!$oSource)
            return [];

        $aResults = [];
        foreach($aValue as $sValue) {
            $aEntry = $oSource->getEntry($sValue);
            if(empty($aEntry) || !is_array($aEntry))
                continue;

            $aResults[] = [
                'item_unit' => '',
                'item_name' => $aEntry[$CNF['FIELD_TITLE']],
                'name' => $aInput['name'] . (isset($aInput['custom']['only_once']) && $aInput['custom']['only_once'] == 1 ? '' : '[]'),
                'value' => $sValue
            ];
        }

        return $aResults;
    }

    public function genInputPrice(&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($aInput['value_currency'])) {
            $iAuthorId = $this->_getAuthorId();
            $aInput['value_currency'] = BxDolPayments::getInstance()->getCurrencyCode($iAuthorId);
        }

        return parent::genInputPrice($aInput);
    }

    protected function genCustomInputCategoryView(&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!empty($this->_iCategory)) {
            $aCategory = $this->_oModule->_oDb->getCategories(array('type' => 'id', 'id' => $this->_iCategory));
            if(!empty($aCategory) && is_array($aCategory))
                $aInput['value'] = bx_process_output(_t($aCategory['title']));
        }

        return $this->genInputStandard($aInput);
    }

    protected function genCustomViewRowValueCategoryView(&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($aInput['value']))
            return '';

        $aCategory = $this->_oModule->_oDb->getCategories(['type' => 'id', 'id' => $aInput['value']]);
        if(empty($aCategory) || !is_array($aCategory))
            return '';

        if($this->_bIsApi)
            $aInput['value'] = bx_process_output(_t($aCategory['title']));

        $sLink = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_CATEGORIES'], [$CNF['GET_PARAM_CATEGORY'] => $aCategory['id']]));
        return $this->_oModule->_oTemplate->parseLink($sLink, bx_process_output(_t($aCategory['title'])));
    }

    protected function genCustomViewRowValueQuantity(&$aInput)
    {
        return (int)$aInput['value'] > 0 ? (int)$aInput['value'] : 0;
    }

    protected function _getCoverGhostTmplVars($aContentInfo = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	return array (
            'name' => $this->aInputs[$CNF['FIELD_COVER']]['name'],
            'content_id' => $this->aInputs[$CNF['FIELD_COVER']]['content_id'],
            'editor_id' => isset($CNF['FIELD_TEXT_ID']) ? $CNF['FIELD_TEXT_ID'] : '',
            'thumb_id' => isset($CNF['FIELD_THUMB']) && isset($aContentInfo[$CNF['FIELD_THUMB']]) ? $aContentInfo[$CNF['FIELD_THUMB']] : 0,
            'name_thumb' => isset($CNF['FIELD_THUMB']) ? $CNF['FIELD_THUMB'] : ''
        );
    }

    protected function _getPhotoGhostTmplVars($aContentInfo = [])
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	return [
            'name' => $this->aInputs[$CNF['FIELD_PHOTO']]['name'],
            'content_id' => (int)$this->aInputs[$CNF['FIELD_PHOTO']]['content_id'],
            'editor_id' => isset($CNF['FIELD_TEXT_ID']) ? $CNF['FIELD_TEXT_ID'] : '',
            'bx_if:set_thumb' => [
                'condition' => false,
                'content' => []
            ],
    	];
    }

    protected function _getSingleField()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($this->aInputs[$CNF['FIELD_QUANTITY']])) 
            return;

        $iSingle = 1;
        $iQuantity = (int)$this->getCleanValue($CNF['FIELD_QUANTITY']);
        if($iQuantity > 1)
            $iSingle = 0;

        return $iSingle;
    }

    protected function _initCategoryFields($iCategory = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_iCategory = (int)$iCategory;
        if(empty($this->_iCategory) && bx_get('category') !== false)
            $this->_iCategory = (int)bx_get('category');

        if(isset($CNF['FIELD_CATEGORY']) && isset($this->aInputs[$CNF['FIELD_CATEGORY']]) && $this->_iCategory != 0)
            $this->aInputs[$CNF['FIELD_CATEGORY']]['value'] = $this->_iCategory;

        if(isset($CNF['FIELD_CATEGORY_VIEW']) && isset($this->aInputs[$CNF['FIELD_CATEGORY_VIEW']]) && $this->_iCategory != 0)
            $this->aInputs[$CNF['FIELD_CATEGORY_VIEW']]['value'] = $this->_iCategory;

        if(isset($CNF['FIELD_CATEGORY_SELECT']) && isset($this->aInputs[$CNF['FIELD_CATEGORY_SELECT']]))
            $this->aInputs[$CNF['FIELD_CATEGORY_SELECT']]['values'] = $this->_oModule->serviceGetCategoryOptions(0, true);
    }

    protected function _isChangeUserForAdmins($sDisplay)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_bAllowChangeUserForAdmins)
            return false;

        if(strpos($sDisplay, '_add') !== false)
            return $sDisplay != $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'];

        if(strpos($sDisplay, '_edit') !== false)
            return true;

        return false;
    }
    
    protected function _getAuthorId()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!empty($this->_aContentInfo) && is_array($this->_aContentInfo))
            return (int)$this->_aContentInfo[$CNF['FIELD_AUTHOR']];

        if(!empty($this->_iContentId)) {
            $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_iContentId);
            if(!empty($this->_aContentInfo) && is_array($this->_aContentInfo))
                return (int)$this->_aContentInfo[$CNF['FIELD_AUTHOR']];
        }

        return bx_get_logged_profile_id();
    }

    protected function _getSourceType()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!empty($this->_aContentInfo) && is_array($this->_aContentInfo))
            return $this->_aContentInfo[$CNF['FIELD_SOURCE_TYPE']];
        
        if(!empty($this->_iContentId)) {
            $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_iContentId);
            if(!empty($this->_aContentInfo) && is_array($this->_aContentInfo))
                return $this->_aContentInfo[$CNF['FIELD_SOURCE_TYPE']];
        }
        
        $iAuthorId = $this->_getAuthorId();
        return $this->_oModule->serviceGetSource($iAuthorId);
    }

    protected function _genInputButtonAttrs(&$aInput)
    {
        return $this->_replaceMarkers(parent::_genInputButtonAttrs($aInput));
    }
}

/** @} */
