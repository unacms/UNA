<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    MassMailer Mass Mailer
* @ingroup     UnaModules
* 
* @{
*/

class BxMassMailerGridCampaigns extends BxTemplGrid
{
    protected $MODULE;
    protected $_oModule;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->MODULE = 'bx_massmailer';
        $this->_oModule = BxDolModule::getInstance($this->MODULE);
        parent::__construct ($aOptions, $oTemplate);
        
        $this->_sDefaultSortingOrder = 'DESC';
    }
    
    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'send_test':
                $sResult = _t('_bx_massmailer_campaign_form_send_test_title');
                break;
            
            case 'send_all':
                $sResult = _t('_bx_massmailer_campaign_form_send_all_title');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&context_pid=' . $this->_iContextPid . '&id=' . $iId;
    }
    
    public function performActionDelete()
    {
        $aIds = bx_get('ids');
        foreach ($aIds as $iId){
            $this->_oModule->_oDb->deleteCampaignData($iId);
        }
        parent::performActionDelete();
    }

    public function performActionSendTest()
    {
        $sAction = 'send_test';
        $aIds = bx_get('ids');
        $iId = $aIds[0];
        $oForm = BxDolForm::getObjectInstance('bx_massmailer', 'bx_massmailer_campaign_send_test');
        if (!$oForm)
            return $this->_getActionResult([]);

        $oForm->setId('bx_massmailer_campaign_send_test');
        $oForm->setAction(BX_DOL_URL_ROOT . 'grid.php?' . bx_encode_url_params($_GET, array('_r')));
        $aContentInfo = array('email' => BxDolProfile::getInstance()->getAccountObject()->getEmail());
        $oForm->initChecker($aContentInfo, array());
        if($oForm->isSubmittedAndValid()) {
            $mixedResult = $this->_oModule->sendTest($oForm->aInputs['email']['value'], $iId);
            if($mixedResult !== false)
                return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $mixedResult]);
            else
                return ($sMsg = _t('_bx_massmailer_txt_send_test_error')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : echoJson(['msg' => $sMsg]);
        }
        else {
            if($this->_bIsApi)
                return $this->getFormBlockAPI($oForm, $sAction, $iTrackId);

            $sContent = BxTemplFunctions::getInstance()->popupBox('bx_massmailer_campaign_send_test', _t('_bx_massmailer_campaign_form_send_test_title'), $this->_oModule->_oTemplate->parseHtmlByName('manage_item.html', array(
                'form_id' => $oForm->id,
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));
            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    public function performActionSendAll()
    {
        $sAction = 'send_all';
        $aIds = bx_get('ids');
        $iId = $aIds[0];
        $oForm = BxDolForm::getObjectInstance('bx_massmailer', 'bx_massmailer_campaign_send_all');
        if (!$oForm)
            return $this->_getActionResult([]);

        $oForm->setId('bx_massmailer_campaign_send_all');
        $oForm->setAction(BX_DOL_URL_ROOT . 'grid.php?' . bx_encode_url_params($_GET, array('_r')));
        $oForm->initChecker(array(), array());
        $oForm->aInputs['campaign_info']['value'] = _t($oForm->aInputs['campaign_info']['value'], $this->_oModule->getEmailCountInSegment($iId));
        if($oForm->isSubmittedAndValid()) {
            $mixedResult = $this->_oModule->sendAll($iId);
            if($mixedResult !== false)
                return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $mixedResult]);
            else
                return $this->_bIsApi ? [bx_api_get_msg($mixedResult)] : echoJson(['msg' => $mixedResult]);
        }
        else {
            if($this->_bIsApi)
                return $this->getFormBlockAPI($oForm, $sAction, $iTrackId);

            $sContent = BxTemplFunctions::getInstance()->popupBox('bx_massmailer_campaign_send_all', _t('_bx_massmailer_campaign_form_send_all_title'), $this->_oModule->_oTemplate->parseHtmlByName('manage_item.html', array(
                'form_id' => $oForm->id,
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));
            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    public function performActionCopy()
    {
        $aIds = bx_get('ids');
        $iId = $aIds[0];
        $mixedResult = $this->_oModule->_oDb->copyCampaign($iId);
        if($mixedResult !== false)
            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $mixedResult]);
        else
            return $this->_bIsApi ? [bx_api_get_msg($mixedResult)] : echoJson(['msg' => $mixedResult]);
    }

    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'time', 'data' => $mixedValue];
        
        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellSegments($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->_oModule->getSegments($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellDateSent($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'time', 'data' => $mixedValue];

        return parent::_getCellDefault($mixedValue != '0' ? bx_time_js($mixedValue) : _t('_bx_massmailer_txt_never_sent'), $sKey, $aField, $aRow);
    }

    protected function _getCellIsOnePerAccount($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t('_bx_massmailer_grid_column_title_adm_is_one_per_account_' . ($mixedValue == '1' ? 'yes' : 'no')), $sKey, $aField, $aRow);
    }

    protected function _getActionCopy($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(isset($aRow["date_sent"]) && $aRow["date_sent"] == '0')
            return $this->_bIsApi ? [] : '';

        if($this->_bIsApi)
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'callback', 
                'on_callback' => 'refresh'
            ]);

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionSendTest($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(isset($aRow["date_sent"]) && $aRow["date_sent"] != '0')
            return $this->_bIsApi ? [] : '';

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionSendAll($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(isset($aRow["date_sent"]) && $aRow["date_sent"] != '0')
            return $this->_bIsApi ? [] : '';

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionAdd ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_ADD_CAMPAIGN']));
        if($this->_bIsApi)
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'modal', 
                'on_callback' => 'refresh',
                'link' => bx_api_get_relative_url($sUrl)
            ]);

        unset($a['attr']['bx_grid_action_independent']);
        $a['attr'] = array_merge($a['attr'], array(
            "onclick" => "window.open('" . $sUrl . "','_self');"
        ));

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionEdit ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(isset($aRow["date_sent"]) && $aRow["date_sent"] != '0')
            return $this->_bIsApi ? [] : '';

        $CNF = &$this->_oModule->_oConfig->CNF;

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_EDIT_CAMPAIGN'] . '&id=' . $aRow[$CNF['FIELD_ID']]));
        if($this->_bIsApi)
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'modal', 
                'on_callback' => 'refresh',
                'link' => bx_api_get_relative_url($sUrl)
            ]);

        $a['attr'] = array_merge($a['attr'], array(
            "onclick" => "window.open('" . $sUrl . "','_self');"
        ));

        return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionView ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(isset($aRow["date_sent"]) && $aRow["date_sent"] == '0')
            return $this->_bIsApi ? [] : '';

        $CNF = &$this->_oModule->_oConfig->CNF;

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_CAMPAIGN'] . '&id=' . $aRow[$CNF['FIELD_ID']]));
        if($this->_bIsApi)
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'callback', 
                'on_callback' => 'redirect', 
                'redirect_url' => bx_api_get_relative_url($sUrl)
            ]);

        unset($a['attr']['bx_grid_action_independent']);
        $a['attr'] = array_merge($a['attr'], array(
            "onclick" => "window.open('" . $sUrl . "','_self');"
        ));

        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getCellAuthor($mixedValue, $sKey, $aField, $aRow)
    {
        $oProfile = BxDolProfile::getInstance($aRow['author']);
        if (!$oProfile)
            $oProfile = BxDolProfileUndefined::getInstance();
        return parent::_getCellDefault($oProfile->getDisplayName(), $sKey, $aField, $aRow);
    }

    protected function _isVisibleGrid ($a)
    {
        if (isAdmin() || !isset($a['visible_for_levels']))
            return true;

        return $this->_oModule->checkAllowed() === CHECK_ACTION_RESULT_ALLOWED ? true : false;
    }
}

/** @} */
