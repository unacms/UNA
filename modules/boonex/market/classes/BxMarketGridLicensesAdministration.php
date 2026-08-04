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

class BxMarketGridLicensesAdministration extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;

    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->_sModule = 'bx_market';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);
    	if(!$oTemplate)
            $oTemplate = $this->_oModule->_oTemplate;

        parent::__construct ($aOptions, $oTemplate);

        $this->_sDefaultSortingOrder = 'DESC';
        $this->_aQueryReset = array($this->_aOptions['order_get_field'], $this->_aOptions['order_get_dir'], $this->_aOptions['paginate_get_start'], $this->_aOptions['paginate_get_per_page']);
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'edit':
                $sResult = _t('_bx_market_popup_title_lcs_edit');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
    }

    public function performActionEdit()
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'edit';

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return $this->_bIsApi ? [] : echoJson([]);

            $aIds = [$iId];
        }

        $iId = array_shift($aIds);

        $aLicense = $this->_oModule->_oDb->getLicense(['type' => 'id', 'id' => $iId]);
        if(!is_array($aLicense) || empty($aLicense))
            return $this->_bIsApi ? [] : echoJson([]);

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LICENSE'], $CNF['OBJECT_FORM_LICENSE_DISPLAY_EDIT']);
        $oForm->setId($oForm->getId() . '_' . $sAction);
        $oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', ['o' => $this->_sObject, 'a' => $sAction, 'id' => $iId]));

        $oForm->initChecker($aLicense);
        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($aLicense['id']) !== false)
                $aRes = $this->_bIsApi ? [] : ['grid' => $this->getCode(false), 'blink' => $aLicense['id']];
            else
                $aRes = ($sMsg = _t('_bx_market_grid_action_err_cannot_perform')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

            return $this->_bIsApi ? $aRes : echoJson($aRes);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iId);

        $sContent = BxTemplFunctions::getInstance()->popupBox('bx-market-license-edit-popup', _t('_bx_market_popup_title_lcs_edit'), $this->_oModule->_oTemplate->parseHtmlByName('popup_license.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    /*
     * TODO: Start from here. Ask Roman:
     * 1. Don't ask confirmation.
     * 2. Need to reload data in grid's line.
     */
    public function performActionReset()
    {
    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            if(($iId = bx_get('id')) !== false)
                $aIds = [(int)$iId];
            else
                return $this->_bIsApi ? [] : echoJson([]);
        }

        $aWhere = [];
        if(!empty($this->_aQueryAppend['profile_id']))
            $aWhere['profile_id'] = $this->_aQueryAppend['profile_id'];
        
        $iAffected = 0;
        $aAffected = [];
        foreach($aIds as $iId) {
            $aWhere['id'] = $iId;

            $mixedResult = $this->_oModule->_oDb->updateLicense(['domain' => ''], $aWhere);
            if($mixedResult === false)
                continue;

            if((int)$mixedResult > 0)
                /**
                 * @hooks
                 * @hookdef hook-bx_market-license_reset 'bx_market', 'license_reset' - hook on license reset
                 * - $unit_name - equals `bx_market`
                 * - $action - equals `license_reset` 
                 * - $object_id - not used 
                 * - $sender_id - not used 
                 * - $extra_params - array of reseted licenses
                 * @hook @ref hook-bx_market-license_reset
                 */
                bx_alert($this->_oModule->getName(), 'license_reset', 0, false, $this->_oModule->_oDb->getLicense([
                    'type' => 'id',
                    'id' => $iId
                ]));

            $aAffected[] = $iId;
            $iAffected++;
        }

        $aResult = [];
        if($iAffected)
            $aResult = $this->_bIsApi ? [
                'rows' => $this->_getDataSqlUpdated($aAffected)
            ] : [
                'grid' => $this->getCode(false), 'blink' => $aAffected
            ];
        else
            $aResult = ($sMsg = _t('_bx_market_grid_action_err_cannot_perform')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

        return $this->_bIsApi ? $aResult : echoJson($aResult);
    }

    public function performActionDelete()
    {
    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) 
            return echoJson([]);

        $iId = array_shift($aIds);

        if(!$this->_oModule->_oDb->unregisterLicenseById($iId, 'manual'))
            return echoJson(['msg' => _t('_bx_market_grid_action_err_cannot_perform')]);

        return echoJson(['grid' => $this->getCode(false)]);
    }

    protected function _getCellProfileId($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->_oModule->_oTemplate->getProfileLink($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellProduct($mixedValue, $sKey, $aField, $aRow)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_VIEW_ENTRY'] . $aRow['product_id']));

        $mixedValue = $this->_oTemplate->parseHtmlByName('product_link.html', array(
            'href' => $sUrl,
            'title' => bx_html_attribute($mixedValue),
            'content' => $mixedValue
        ));

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellType($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t('_bx_market_grid_txt_lcs_type_' . $mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellDomain($mixedValue, $sKey, $aField, $aRow)
    {
        $sModuleOAuth = 'bx_oauth';
        if(!empty($mixedValue) && BxDolModuleQuery::getInstance()->isEnabledByName($sModuleOAuth)) {
            $aClient = bx_srv($sModuleOAuth, 'get_clients_by', array(array('type' => 'client_id', 'client_id' => $mixedValue)));
            if(!empty($aClient) && is_array($aClient) && !empty($aClient['title']))
                $mixedValue .= ' (' . $aClient['title'] . ')';
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_time_js($mixedValue, BX_FORMAT_DATE, true), $sKey, $aField, $aRow);
    }

    protected function _getCellExpired($mixedValue, $sKey, $aField, $aRow)
    {
    	$mixedValue = (int)$mixedValue != 0 ? bx_time_js($mixedValue, BX_FORMAT_DATE, true): _t('_bx_market_grid_txt_lcs_never');
    		
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionReset($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($this->_bIsApi)
            return array_merge($a, ['name' => $sKey, 'type' => 'callback', 'on_callback' => 'refresh_rows']);

    	return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getTableAlias()
    {
        return 'tl';
    }
}

/** @} */
