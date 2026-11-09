<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxBaseAuditGrid extends BxDolAuditGrid
{
    protected $sJsObject = 'oBxDolAuditManageTools';
    
    public function __construct($aInfo, $oTemplate = false)
    {
        parent::__construct($aInfo, $oTemplate);
    }
    
    public function getCode($isDisplayHeader = true)
    {
        list($aCssCalendar, $aJsCalendar) = BxBaseFormView::getCssJsCalendar();

        $this->_oTemplate->addCss(array_merge($aCssCalendar, ['manage_tools.css']));
        $this->_oTemplate->addJs(array_merge($aJsCalendar, ['BxDolAuditManageTools.js', 'BxDolGrid.js']));
        $this->_oTemplate->addJsTranslation(['_sys_grid_search']);

        return $this->getJsCode() . parent::getCode($isDisplayHeader);
    }
    
    public function getJsCode()
    {
        $aParams = array(
            'sObjName' => $this->sJsObject,
            'aHtmlIds' => array(),
            'oRequestParams' => array(),
        	'sObjNameGrid' => 'sys_audit_administration'
        );
        return BxDolTemplate::getInstance()->_wrapInTagJsCode("var " . $this->sJsObject . " = new BxDolAuditManageTools(" . json_encode($aParams) . ");");
    }
    
    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }
    
    protected function _getCellAction ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t($aRow['action_lang_key'], $aRow['action_lang_key_params']), $sKey, $aField, $aRow);
    }
    
    protected function _getCellContentId ($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = '';
        if ($aRow['content_id'] > 0){
			$sLink = BxDolRequest::serviceExists($aRow['content_module'], 'get_link') ? BxDolService::call($aRow['content_module'], 'get_link', array($aRow['content_id'])) : '';
			$sTitle = BxDolRequest::serviceExists($aRow['content_module'], 'get_title') ? BxDolService::call($aRow['content_module'], 'get_title', array($aRow['content_id'])) : $aRow['content_title'];
            if ($sLink){
                $mixedValue = BxDolTemplate::getInstance()->parseLink($sLink, $sTitle);
            }
            else{
                $mixedValue = $sTitle;
            }
        }
        $sLinkExtras = '';
        $aExtras = unserialize($aRow['extras']);
        if (isset($aExtras['display_info'])){
            $sLinkExtras = $this->_oTemplate->parseLink('javascript:void(0)',' <i class="sys-icon info-circle"></i>' , array(
                'title' => '',
                'bx_grid_action_single' => 'show_stat',
                'bx_grid_action_data' => json_encode($aExtras)
            ));
        }
        
        return parent::_getCellDefault($mixedValue . $sLinkExtras, $sKey, $aField, $aRow);
    }
    
    protected function _getCellContextProfileId ($mixedValue, $sKey, $aField, $aRow)
    {
        if ($aRow['context_profile_id'] > 0){
    	    $oProfile = BxDolProfile::getInstance($aRow['context_profile_id']);
            if ($oProfile){
                $mixedValue = BxDolTemplate::getInstance()->parseLink($oProfile->getUrl(), $oProfile->getDisplayName());
            }
            else{
                $mixedValue = $aRow['context_profile_title'];
            }
        }
        else{
            $mixedValue = '';
        }
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellContentModule ($mixedValue, $sKey, $aField, $aRow)
    {
        if(($oModule = BxDolModule::getInstance($aRow['content_module'])) && ($sTitle = $oModule->_aModule['title'] ?? false)) {
            $mixedValue = $sTitle;
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellProfileId ($mixedValue, $sKey, $aField, $aRow)
    {
        if ($aRow['profile_id'] > 0){
    	    $oProfile = BxDolProfile::getInstance($aRow['profile_id']);
            if ($oProfile){
    	        $mixedValue = BxDolTemplate::getInstance()->parseLink($oProfile->getUrl(), $oProfile->getDisplayName());
            }
            else{
                $mixedValue = $aRow['profile_title'];
            }
        }
        else{
            $mixedValue = '';
        }
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellAuthorId ($mixedValue, $sKey, $aField, $aRow)
    {
        if ($aRow['profile_id'] > 0){
    	    $oProfile = BxDolProfile::getInstance($aRow['profile_id']);
            if ($oProfile){
    	        $mixedValue = BxDolTemplate::getInstance()->parseLink($oProfile->getUrl(), $oProfile->getDisplayName());
            }
            else{
                $mixedValue = $aRow['profile_title'];
            }
        }
        else{
            $mixedValue = '';
        }
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    function _getFilterControls()
    {
        parent::_getFilterControls();
        return  $this->_getFilterSelectOne($this->_sFilter1Name, $this->_sFilter1Value, $this->_aFilter1Values) . 
            $this->_getFilterSelectOne($this->_sFilterProfileName, $this->_sFilterProfileValue, $this->_aFilterProfileValues) . 
            $this->_getFilterSelectOne($this->_sFilterActionName, $this->_sFilterActionValue, $this->_aFilterActionValues) .
            $this->_getFilterDatePicker($this->_sFilterFromDateName, $this->_sFilterFromDateValue) .
            $this->_getFilterLabel('-') .
            $this->_getFilterDatePicker($this->_sFilterToDateName, $this->_sFilterToDateValue) .
            $this->_getFilterButton();
    }
    
    protected function _getFilterDatePicker($sFilterName, $sFilterValue, $bAsArray = false)
    {
        $aInputDatePicker = parent::_getFilterDatePicker($sFilterName, $sFilterValue, true);
        if(!$aInputDatePicker)
            return $aInputDatePicker;

        $aInputButton['tr_attrs'] ??= [];
        $aInputButton['tr_attrs']['class'] = 'bx-grid-controls-filter-datepicker';

        if($bAsArray)
            return $aInputDatePicker;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputDatePicker);
    }

    protected function _getFilterButton($bAsArray = false)
    {
        $aInputButton = parent::_getFilterButton(true);

        $aInputButton['tr_attrs'] ??= [];
        $aInputButton['tr_attrs']['class'] = 'bx-grid-controls-filter-button';
        
        $aInputButton['attrs'] ??= [];
        $aInputButton['attrs']['onClick'] = 'javascript:' . $this->sJsObject . '.onChangeFilter(this)';

        if($bAsArray)
            return $aInputButton;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputButton);
    }

    protected function _getFilterLabel($sFilterValue, $bAsArray = false)
    {
        $aInputLabel = parent::_getFilterLabel($sFilterValue, true);

        $aInputLabel['tr_attrs'] ??= [];
        $aInputLabel['tr_attrs']['class'] = 'bx-grid-controls-filter-label';

        if($bAsArray)
            return $aInputLabel;

        $oForm = new BxTemplFormView([]);
        return $oForm->genRow($aInputLabel);
    }

    public function performActionShowStat()
    {
        $aTmp2 = bx_get('ids');
        $sData = $aTmp2[0];
        $aData = json_decode($sData, true);
        $sContentInfo = '';
        if (isset($aData['display_info'])) {
            foreach($aData['display_info'] as $sKey => $sValue)
                $sContentInfo .= $sKey . ': ' . $sValue;
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox('sys-audit-content-info', _t('_sys_audit_content_info_popup_title'), $sContentInfo);

        echoJson(array('popup' => $sContent));
    }
}

/** @} */
