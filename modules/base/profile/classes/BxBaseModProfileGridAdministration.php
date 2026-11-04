<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseProfile Base classes for profile modules
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxBaseModProfileGridAdministration extends BxBaseModGeneralGridAdministration
{
    protected $_bSetAclWithDuration;

    protected $_sFilter1Name;
    protected $_sFilter1Value;
    protected $_aFilter1Values;

    protected $_sFilter2Name;
    protected $_sFilter2Value;
    protected $_aFilter2Values;

    protected $_sConfirmationType;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_aQueryReset = [$this->_aOptions['paginate_get_start'], $this->_aOptions['paginate_get_per_page']];

        $this->_bSetAclWithDuration = true;

        $this->_init();
    }

    protected function _init()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        //--- Status
        $this->_sStatusField = $CNF['FIELD_STATUS'] ?? 'status';
        $this->_aStatusValues = ['active', 'pending', 'suspended'];

        //--- Filter 1
        $this->_sFilter1Name = 'filter1';
        $this->_aFilter1Values = [
            'active' => $CNF['T']['filter_item_active'],
            'pending' => $CNF['T']['filter_item_pending'],
            'suspended' => $CNF['T']['filter_item_suspended'],
        ];

        if(($sFilter1 = bx_get($this->_sFilter1Name)) !== false) {
            $this->_sFilter1Value = bx_process_input($sFilter1);
            $this->_aQueryAppend[$this->_sFilter1Name] = $this->_sFilter1Value;
        }

        $this->_sConfirmationType = getParam('sys_account_confirmation_type');
        if($this->_sConfirmationType != BX_ACCOUNT_CONFIRMATION_NONE)
            $this->_aFilter1Values['unconfirmed'] = $CNF['T']['filter_item_unconfirmed'];

        //--- Filter 2
        $this->_sFilter2Name = 'filter2';

        $aLevels = [];
        BxDolAclQuery::getInstance()->getLevels(['type' => 'all_active_not_automatic_pair'], $aLevels);
        foreach($aLevels as $sKey => $sValue)
            $this->_aFilter2Values["level" . $sKey] = $sValue;

        if(($sFilter2 = bx_get($this->_sFilter2Name)) !== false) {
            $this->_sFilter2Value = bx_process_input($sFilter2);
            $this->_aQueryAppend[$this->_sFilter2Name] = $this->_sFilter2Value;
        }
    }

    public function performActionSetAclLevel()
    {
    	$oMenu = BxDolMenu::getObjectInstance('sys_set_acl_level');

    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds) || !$oMenu)
            return echoJson([]);

        $aIdsResult = [];
        foreach($aIds as $iId) {
            $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iId);
            if($this->_oModule->checkAllowedSetMembership($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
                continue;

            $aIdsResult[] = $this->_getProfileId($iId);
        }

        if(empty($aIdsResult))
            return echoJson([]);

        if(count($aIdsResult) == 1)
            $aIdsResult = $aIdsResult[0];

        $oMenu->setWithDuration($this->_bSetAclWithDuration);
        $oMenu->setHiddenByDefault(!$this->_bSetAclWithDuration);
        $sContent = $oMenu->getCode($aIdsResult);
        if(!$this->_bSetAclWithDuration)
            $sContent = BxTemplFunctions::getInstance()->transBox($this->_oModule->_oConfig->getName() . 'set_acl_level_popup', $this->_oTemplate->parseHtmlByName('set_acl_popup.html', [
                'content' => $sContent
            ]));

    	echoJson(['popup' => $sContent]);
    }

    public function performActionManageCf()
    {
        if(!$this->_oModule->_isModerator())
            return echoJson([]);

        $sModule = $this->_oModule->_oConfig->getName();

        $iContentId = $this->_getId();
        if($iContentId === false)
            return echoJson([]);

        $aProfileInfo = BxDolProfileQuery::getInstance()->getProfileByContentAndType($iContentId, $sModule, true);
        if(!$aProfileInfo || !is_array($aProfileInfo))
            return echoJson([]);

        $sAction = 'manage_cf';

        $sForm = 'sys_profile';
        $sFormDisplay = 'sys_profile_cf_manage';
        $oForm = BxDolForm::getObjectInstance($sForm, $sFormDisplay);
        if(!$oForm)
            return echoJson([]);

        $oForm->setAction(BX_DOL_URL_ROOT . 'grid.php', ['o' => $this->_sObject, 'a' => $sAction, 'id' => $iContentId]);
        $oForm->initChecker($aProfileInfo);
        if($oForm->isSubmittedAndValid()) {
            if(!$oForm->update($aProfileInfo['id']))
                $aResult = ['msg' => _t('_sys_txt_error_profile_update')];
            else
                $aResult = ['msg' => _t('_' . $sFormDisplay . '_successfully_submitted')];

            return echoJson($aResult);
        }

        $sPopupTitle = _t('_' . $sFormDisplay . '_popup');
        $sPopupContent = $this->_oTemplate->parseHtmlByName('content_filter_manage_popup.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode()
        ]);

        echoJson(['popup' => [
            'html' => BxTemplFunctions::getInstance()->popupBox($sModule . '_manage_cf_popup',  $sPopupTitle, $sPopupContent),
            'options' => [
                'closeOnOuterClick' => false,
                'removeOnClose' => true
            ]
        ]]);
    }

    public function performActionDeleteWithContent()
    {
    	$this->performActionDelete(array('with_content' => true));
    }

    protected function _getActionSetAclLevel($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
    	if($this->_sManageType == BX_DOL_MANAGE_TOOLS_ADMINISTRATION && $this->_oModule->checkAllowedSetMembership($aRow) !== CHECK_ACTION_RESULT_ALLOWED)
            return '';

        return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);	
    }

    protected function _getActionManageCf($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getActionAuditProfile($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if (!getParam('sys_audit_enable') || getParam('sys_audit_acl_levels') == '')
            return;
        
        $iProfileId = bx_get_logged_profile_id();
        if (!BxDolAcl::getInstance()->isMemberLevelInSet(explode(',', getParam('sys_audit_acl_levels')), $iProfileId))
            return;
    	
    	$CNF = &$this->_oModule->_oConfig->CNF;
        $oProfile = $this->_getProfileObject($aRow[$CNF['FIELD_ID']]);
        $sUrl = BX_DOL_URL_ROOT . 'page/audit-administration?profile=' . $oProfile->id();

    	$a['attr'] = array_merge($a['attr'], array(
            "onclick" => "window.open('" . $sUrl . "','_audit');"
    	));

    	return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }
    
    protected function _getActionSettings($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if (bx_is_api()) {
            return array_merge($a, ['name' => 'delete', 'type' => 'callback', 'action' => 'delete','on_callback' => 'hide_row', 'confirm' => 1,  'params' => '&id=' . $aRow[$this->_aOptions['field_id']] ]);
        }

        return parent::_getActionSettings($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionDeleteWithContent($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($this->_sManageType != BX_DOL_MANAGE_TOOLS_ADMINISTRATION || !$this->_oModule->_isAdministrator())
            return '';

    	return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }
    
    protected function _switcherChecked2State($isChecked)
    {
        return $isChecked ? 'active' : 'suspended';
    }

    protected function _enable ($mixedId, $isChecked)
    {
        $aContentInfo = $this->_getContentInfo($mixedId);
        if ($this->_oModule->checkAllowedEdit($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $oProfile = $this->_getProfileObject($mixedId);

        if($oProfile instanceof BxDolProfileUndefined)
            return false;

        $iAction = BX_PROFILE_ACTION_MANUAL;
        $bSendEmailNotification = $this->_oModule->serviceActAsProfile();
        return $isChecked ? $oProfile->activate($iAction, 0, $bSendEmailNotification && $this->_oModule->serviceIsEnableProfileActivationLetter()) : $oProfile->suspend($iAction, 0, $bSendEmailNotification);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $aFilterParts = explode($this->_sParamsDivider, $sFilter);
        switch (substr_count($sFilter, $this->_sParamsDivider)) {
            case 1:
                list($this->_sFilter1Value, $sFilter) = $aFilterParts;
                break;

            case 2:
                list($this->_sFilter1Value, $this->_sFilter2Value, $sFilter) = $aFilterParts;
                break;
        }

    	if(!empty($this->_sFilter1Value)) {
            if($this->_sFilter1Value == 'unconfirmed')
                switch ($this->_sConfirmationType) {
                    case BX_ACCOUNT_CONFIRMATION_EMAIL:
                        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ta`.`email_confirmed` = 0 ");
                        break;
                    case BX_ACCOUNT_CONFIRMATION_PHONE:
                        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ta`.`phone_confirmed` = 0 ");
                        break;
                    case BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE:
                        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND (`ta`.`email_confirmed` = 0 AND `ta`.`phone_confirmed` = 0) ");
                        break;
                }
            else
                $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tp`.`status`=?", $this->_sFilter1Value);
        }

        if(!empty($this->_sFilter2Value)) {
            if(($iLevel = (int)str_replace('level', '', $this->_sFilter2Value)) != 3)
                $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tp`.`id` IN (SELECT `IDMember` FROM `sys_acl_levels_members` WHERE IDLevel = ?) ", $iLevel);
            else
                $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tp`.`id` NOT IN (SELECT `IDMember` FROM `sys_acl_levels_members`) ");
        }

        return $this->_getDataSqlInner($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getDataSqlInner($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    //--- Layout methods ---//
    protected function _getFilterControls()
    {
        parent::_getFilterControls();

        return  $this->_getFilterSelectOne($this->_sFilter1Name, $this->_sFilter1Value, $this->_aFilter1Values) . $this->_getFilterSelectOne($this->_sFilter2Name, $this->_sFilter2Value, $this->_aFilter2Values) . $this->_getSearchInput();
    }

    protected function _getFilterControlsAPI($aFilters = [])
    {
        $aFilters = [
            $this->_sFilter1Name => []
        ];

        return parent::_getFilterControlsAPI($aFilters);
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        if (isset($aRow['profile_id']))
            if (!$this->_oModule->isAllowDeleteOrDisable(bx_get_logged_profile_id(), $aRow['profile_id']))
                return parent::_getCellDefault('', $sKey, $aField, $aRow);    
        
        return parent::_getCellSwitcher ($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellFullname($mixedValue, $sKey, $aField, $aRow)
    {
    	$oProfile = $this->_getProfileObject($aRow['id']);

        if($this->_bIsApi)
            return ['type' => 'profile', 'data' => BxDolProfile::getData($oProfile->id())];

        return parent::_getCellDefault($oProfile->getUnit(0, ['link_target' => '_blank']), $sKey, $aField, $aRow);
    }

    protected function _getCellLastOnline($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'time', 'data' => $mixedValue];

        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getCellAddedTs($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellLastOnline($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellAccount($mixedValue, $sKey, $aField, $aRow)
    {
        $sManageAccountUrl = $this->_getManageAccountUrl($aRow[$sKey]);
        if(!empty($sManageAccountUrl)) {
            $mixedValue = $this->_oTemplate->parseHtmlByName('account_link.html', [
                'href' => $sManageAccountUrl,
                'title' => _t($this->_oModule->_oConfig->CNF['T']['grid_txt_account_manager']),
                'content' => $mixedValue, 
                'class' => ''
            ]);
        }

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getProfileObject($iId)
    {
        return $this->_oModule->getProfileObject($iId);
    }

    protected function _getProfileId($iId)
    {
    	return $this->_getProfileObject($iId)->id();
    }

    protected function _doDelete($iId, $aParams = array())
    {
        $oProfile = $this->_getProfileObject($iId);
        if(!$oProfile || $oProfile instanceof BxDolProfileUndefined)
            return false;

        if(!$this->_oModule->isAllowDeleteOrDisable(bx_get_logged_profile_id(), $oProfile->id()))
            return false;

    	if($this->_oModule->checkMyself($iId))
            return false;

        return $oProfile->delete($oProfile->id(), isset($aParams['with_content']) && $aParams['with_content'] === true);
    }

    protected function _getId()
    {
        $aIds = bx_get('ids');
        if(!empty($aIds) && is_array($aIds)) 
            return (int)reset($aIds);

        $iId = bx_get('id');
        if($iId !== false) 
            return (int)$iId;

        return false;
    }
}

/** @} */
