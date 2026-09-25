<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 * @{
 */

define('BX_DOL_MANAGE_TOOLS_ADMINISTRATION', 'administration');
define('BX_DOL_MANAGE_TOOLS_COMMON', 'common');

class BxBaseModGeneralGridAdministration extends BxBaseModGeneralGrid
{
    protected $_sManageType;
    protected $_sParamsDivider;

    protected $_sStatusField;
    protected $_aStatusValues;
    
    protected $_bDeleteWithBgJobs; 

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_aQueryReset = array($this->_aOptions['filter_get'], $this->_aOptions['paginate_get_start'], $this->_aOptions['paginate_get_per_page']);
        
        $this->_sManageType = BX_DOL_MANAGE_TOOLS_ADMINISTRATION;
        $this->_sParamsDivider = '#-#';

        $this->_aStatusValues = array('active');

        $this->_sDefaultSortingOrder = 'DESC';
        
        $this->_bDeleteWithBgJobs = false;
    }

    public function performActionDelete($aParams = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iAffected = 0;
        $aResult = [];

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds))
            return echoJson($aResult);

        $aIdsAffected = array ();
        foreach($aIds as $iId) {
            $aContentInfo = $this->_getContentInfo($iId);
            if($this->_oModule->checkAllowedDelete($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
                continue;

            if(!$this->_doDelete($iId, $aParams))
                continue;

            if(!$this->_onDelete($iId, $aParams))
                continue;

            $this->_oModule->checkAllowedDelete($aContentInfo, true);

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        if($iAffected) {
            if(!$this->_bIsApi) 
                $aResult = !$this->_bDeleteWithBgJobs ? ['grid' => $this->getCode(false), 'blink' => $aIdsAffected] : ['toast' => _t($CNF['T']['grid_action_msg_delete_scheduled'])];
            else 
                $aResult = [];
        }
        else
            $aResult = ['msg' => _t($CNF['T']['grid_action_err_delete'])];

        return $this->_bIsApi ? $aResult : echoJson($aResult);
    }
    
    public function performActionClearReports($aParams = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $iAffected = 0;
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $aIdsAffected = array ();
        foreach($aIds as $iId) {
            if (isset($CNF['OBJECT_REPORTS'])){
                $oReport = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS'], $iId);
                $oReport->actionClearReport();
                $aIdsAffected[] = $iId;
                $iAffected++;
            }
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t($CNF['T']['grid_action_err_clear_reports'])));
    }

    protected function _getActionAuditContent($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if (!getParam('sys_audit_enable') || getParam('sys_audit_acl_levels') == '')
            return;
        
        $iProfileId = bx_get_logged_profile_id();
        if (!BxDolAcl::getInstance()->isMemberLevelInSet(explode(',', getParam('sys_audit_acl_levels')), $iProfileId))
            return;
    	
    	$CNF = &$this->_oModule->_oConfig->CNF;
        $sUrl = BX_DOL_URL_ROOT . 'page/audit-administration?module=' . $this->_oModule->getName() . '&content_id=' . $aRow[$CNF['FIELD_ID']];

    	$a['attr'] = array_merge($a['attr'], array(
    		"onclick" => "window.open('" . $sUrl . "','_audit');"
    	));

    	return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionDelete($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($this->_sManageType == BX_DOL_MANAGE_TOOLS_ADMINISTRATION && !$this->_oModule->_isAdministrator())
            return '';

        $CNF = &$this->_oModule->_oConfig->CNF;
        if(isset($CNF['FIELD_ID']) && isset($aRow[$CNF['FIELD_ID']])){
            $aContentInfo = $this->_getContentInfo($aRow[$CNF['FIELD_ID']]);
            if($this->_oModule->checkAllowedDelete($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
                return '';
        }

    	return parent::_getActionDelete($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getActionSettings($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
    	$sJsObject = $this->_oModule->_oConfig->getJsObject('manage_tools');
    	$sMenuName = $this->_oModule->_oConfig->CNF['OBJECT_MENU_MANAGE_TOOLS'];

    	$oMenu = BxDolMenu::getObjectInstance($sMenuName);
    	$oMenu->setContentId($aRow['id']);

    	$sMenu = $oMenu->getCode();
    	if(empty($sMenu))
    		return '';

    	$a['attr'] = array_merge($a['attr'], array(
    		"bx-popup-id" => $sMenuName . "-" . $aRow['id'],
    		"onclick" => "$(this).off('click'); " . $sJsObject . ".onClickSettings('" . $sMenuName . "', this);"
    	));

    	return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getFilterControlsAPI($aFilters = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!empty($aFilters) && is_array($aFilters))
            foreach($aFilters as $sName => &$aValues) {
                $aValues[] = ['value' => '', 'title' => _t($CNF['T']['filter_item_select_one_' . $sName])];

                $aFilterValues = $this->{'_a' . ucfirst($sName) . 'Values'};
                if(empty($aFilterValues) || !is_array($aFilterValues))
                    continue;

                foreach($aFilterValues as $sKey => $sValue) 
                    $aValues[] = ['value' => $sKey, 'title' => _t($sValue)];
            }

        return parent::_getFilterControlsAPI($aFilters);
    }

    protected function _getFilterOnChange()
    {
        return $this->_oModule->_oConfig->getJsObject('manage_tools') . '.onChangeFilter(this)';
    }

    protected function _getContentInfo($iId)
    {
    	return $this->_oModule->_oDb->getContentInfoById($iId);
    }
    
    protected function _getProfileObject($iId)
    {
        return BxDolProfile::getInstanceMagic($iId);
    }

    protected function _getManageAccountUrl($sFilter = '')
    {
    	$sModuleAccounts = 'bx_accounts';
    	if(!BxDolModuleQuery::getInstance()->isEnabledByName($sModuleAccounts))
            return '';

        $sTypeUpc = strtoupper($this->_sManageType);
        $oModuleAccounts = BxDolModule::getInstance($sModuleAccounts);
        if(!$oModuleAccounts || empty($oModuleAccounts->_oConfig->CNF['URL_MANAGE_' . $sTypeUpc]))
            return '';

        $sLink = $oModuleAccounts->_oConfig->CNF['URL_MANAGE_' . $sTypeUpc];
        $sLink = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($sLink));
        if(!empty($sFilter))
            $sLink = bx_append_url_params($sLink, ['filter' => $sFilter]);

        return $sLink;
    }

    protected function _enable ($mixedId, $isChecked)
    {
        return $this->__enable ($mixedId, $isChecked);
    }

    protected function __enable ($mixedId, $isChecked)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $mixedResult = parent::_enable($mixedId, $isChecked);
        if(!$mixedResult) 
            return $mixedResult;

        if(!empty($CNF['FIELD_CHANGED']))
            $this->_oModule->_oDb->updateEntriesBy([$CNF['FIELD_CHANGED'] => time()], [$this->_aOptions['field_id'] => $mixedId]);

        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($mixedId);

        $this->_oModule->alertAfterEdit($aContentInfo);

        $iContextId = isset($CNF['FIELD_ALLOW_VIEW_TO']) && (!empty($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) && (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] < 0) ? - $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] : 0;
        $AuditParams = [
            'content_title' => (isset($CNF['FIELD_TITLE']) && isset($aContentInfo[$CNF['FIELD_TITLE']])) ? $aContentInfo[$CNF['FIELD_TITLE']] : '',
            'context_profile_id' => $iContextId,
            'content_info_object' =>  isset($CNF['OBJECT_CONTENT_INFO']) ? $CNF['OBJECT_CONTENT_INFO'] : '',
            'data' => $aContentInfo
        ];
        if ($iContextId > 0)
            $AuditParams['context_profile_title'] = BxDolProfile::getInstance($iContextId)->getDisplayName();

        bx_audit(
            $mixedId, 
            $this->_oModule->getName(), 
            '_sys_audit_action_content_' . ($isChecked ? 'enabled': 'disabled'), 
            $AuditParams
        );

        return $mixedResult;
    }

    protected function _doDelete($iId, $aParams = array())
    {
    	return $this->_oModule->serviceDeleteEntity($iId) == '';
    }

    protected function _onDelete($iId, $aParams = array())
    {
    	return true;
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi)
            return ['type' => 'switcher', 'data' => $aRow[$this->_sStatusField], 'fld' => $this->_sStatusField];

        if(isset($aRow[$this->_sStatusField]) && !in_array($aRow[$this->_sStatusField], $this->_aStatusValues)) {
            $sStatusKey = '_sys_status_' . $aRow[$this->_sStatusField];
            if(!empty($CNF['T']['txt_status_' . $aRow[$this->_sStatusField]]))
                $sStatusKey = $CNF['T']['txt_status_' . $aRow[$this->_sStatusField]];

            return parent::_getCellDefault(_t($sStatusKey), $sKey, $aField, $aRow);
        }

        return parent::_getCellSwitcher ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellHeaderReports ($sKey, $aField)
    {
        $s = parent::_getCellHeaderDefault($sKey, $aField);
        return $this->_bIsApi ? [
                    'name' => bx_process_output($aField['name']),
                    'title' => bx_process_output($aField['title']),
                    'width' => $aField['width']
                ] : preg_replace ('/<a(.*?)>(.*?)<\/a>/', '<a$1 title="' . bx_html_attribute(_t('_sys_txt_reports_title')) . '"><i class="sys-icon exclamation-triangle"></i></a>', $s);
        
    }
    
    protected function _getCellReports($mixedValue, $sKey, $aField, $aRow)
    {
        if ($mixedValue == 0){
            $mixedValue = '';
        }
        else{
            $CNF = &$this->_oModule->_oConfig->CNF;
            $oReports = isset($CNF['OBJECT_REPORTS']) ? BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS'], $aRow[$CNF['FIELD_ID']]) : null;
            if ($oReports){
                $mixedValue = $oReports->getCounter().$oReports->getJsScript();
            }
        }
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _switcherState2Checked($mixedState)
    {
        return 'active' == $mixedState ? true : false;
    }
}

/** @} */
