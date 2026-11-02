<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    UnaCore UNA Core
* @{
*/

define('BX_DOL_MANAGE_TOOLS_ADMINISTRATION', 'administration');

class BxDolAuditGrid extends BxTemplGrid
{
    protected $oDb;

    protected $_sParamsDivider;

    protected $_sFilter1Name;
    protected $_sFilter1Value;
    protected $_aFilter1Values;

    protected $_sFilterProfileName;
    protected $_sFilterProfileValue;
    protected $_aFilterProfileValues;

    protected $_sFilterActionName;
    protected $_sFilterActionValue;
    protected $_aFilterActionValues;

    protected $_sFilterFromDateName;
    protected $_sFilterFromDateValue;

    protected $_sFilterToDateName;
    protected $_sFilterToDateValue;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sFilter1Name = 'module';

        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array('type' => 'modules'));
        $this->_aFilter1Values[''] = _t('_adm_txt_select_module');
        foreach($aModules as $aModule){
            $this->_aFilter1Values[$aModule['name']] = $aModule['title'];
        }

    	$sFilter1 = bx_get($this->_sFilter1Name);
        if(!empty($sFilter1)) {
            $this->_sFilter1Value = bx_process_input($sFilter1);
            $this->_aQueryAppend[$this->_sFilter1Name] = $this->_sFilter1Value;
        }
        
        $this->_sFilterProfileName = 'profile';

        $aProfiles = BxDolAuditQuery::getInstance()->getData(array('type' => 'profile_list'));
        $this->_aFilterProfileValues[''] = _t('_sys_audit_filter_profile_select');
        foreach($aProfiles as $iProfile){
            $oProfile = BxDolProfile::getInstance($iProfile);
			if ($oProfile)
				$this->_aFilterProfileValues[$iProfile] = $oProfile->getDisplayName();
        }

    	$sFilterProfile = bx_get($this->_sFilterProfileName);
        if(!empty($sFilterProfile)) {
            $this->_sFilterProfileValue = bx_process_input($sFilterProfile);
            $this->_aQueryAppend[$this->_sFilterProfileName] = $this->_sFilterProfileValue;
        }
        
        $this->_sFilterActionName = 'action';

        $aActions = BxDolAuditQuery::getInstance()->getData(array('type' => 'action_list'));
        $this->_aFilterActionValues[''] = _t('_sys_audit_filter_action_select');
        foreach($aActions as $sAction){
            $this->_aFilterActionValues[$sAction] = _t($sAction);
        }

    	$sFilterAction = bx_get($this->_sFilterActionName);
        if(!empty($sFilterAction)) {
            $this->_sFilterActionValue = bx_process_input($sFilterAction);
            $this->_aQueryAppend[$this->_sFilterActionName] = $this->_sFilterActionValue;
        }
        
        $this->_sFilterFromDateName = 'from_date';
        $this->_sFilterToDateName = 'to_date';
        
        
        parent::__construct ($aOptions, $oTemplate);

        $this->_sParamsDivider = '#-#';
        $this->_sDefaultSortingOrder = 'DESC';
        
        $this->oDb = new BxDolStudioFormsQuery();
    }

    protected function _isVisibleGrid ($a)
    {
        return isAdmin();
    }

	protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(strpos($sFilter, $this->_sParamsDivider) !== false)
            list($this->_sFilter1Value, $this->_sFilterProfileValue, $this->_sFilterActionValue, $this->_sFilterFromDateValue, $this->_sFilterToDateValue, $sFilter) = explode($this->_sParamsDivider, $sFilter);

        if($this->_sFilter1Value != '')
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `content_module` = ?", $this->_sFilter1Value);
        
        if($this->_sFilterProfileValue != '')
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `profile_id` = ?", $this->_sFilterProfileValue);
        
        if($this->_sFilterActionValue != '')
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `action_lang_key` = ?", $this->_sFilterActionValue);
        
        if($this->_sFilterFromDateValue != '')
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `added` > ?", strtotime($this->_sFilterFromDateValue));
        
        if($this->_sFilterToDateValue != '')
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `added` <= ?", strtotime($this->_sFilterToDateValue));
        
        if(bx_get('content_id') && is_numeric(bx_get('content_id')))
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `content_id` = ?", (int)bx_get('content_id'));
        
		if(bx_get('context_id')  && is_numeric(bx_get('context_id')))
            $this->_aOptions['source'] .= $this->oDb->prepareAsString(" AND `context_profile_id` = ?", (int)bx_get('context_id'));
        
        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
