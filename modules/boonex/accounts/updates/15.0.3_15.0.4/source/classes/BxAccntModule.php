<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Accounts Accounts
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAccntModule extends BxBaseModGeneralModule
{
    /**
     * Constructor
     */
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);
    }

    public function serviceGetSafeServices()
    {
        return array ();
    }

    public function serviceGetOptionsExportTo()
    {
        return array(
            'csv' => _t('_bx_accnt_txt_export_to_csv'),
            'xml' => _t('_bx_accnt_txt_export_to_xml'),
        );
    }
    
    public function serviceGetTitle ($iContentId)
    {
        $oAcc = BxDolAccount::getInstance($iContentId);
        return $oAcc ? $oAcc->getEmail() : '';
    }

    public function serviceGetOptionsExportFields()
    {
        $aResult = array();

        $aFields = $this->_oDb->getAccountFields();
        if(empty($aFields['original']) || !is_array($aFields['original']))
            return $aResult;

        foreach($aFields['original'] as $sField) {
            $sLangKey = '_bx_accnt_txt_field_' . $sField;
            $sLangString = _t($sLangKey);
            if(strcmp($sLangKey, $sLangString) == 0)
                continue;

            $aResult[] = array('key' => $sField, 'value' => $sLangString);
        }

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_accounts Accounts
     * @subsection bx_accounts-other Other
     * @subsubsection bx_accounts-get_menu_addon_manage_tools get_menu_addon_manage_tools
     * 
     * @code bx_srv('bx_accounts', 'get_menu_addon_manage_tools', [...]); @endcode
     * 
     * Get number of 'unconfirmed' accounts for User End -> Dasboard page -> Manage block.
     *
     * @return integer number of 'unconfirmed' accounts
     * 
     * @see BxAccntModule::serviceGetMenuAddonManageTools
     */
    /** 
     * @ref bx_accounts-get_menu_addon_manage_tools "get_menu_addon_manage_tools"
     */
    public function serviceGetMenuAddonManageTools()
    {   
        $iNumTotal = $this->_oDb->getEntriesNumByParams();

        $aConfirmed = array();
        $aUnConfirmed = array();
        $sCnfnType = getParam('sys_account_confirmation_type');
        $aFilter = [ 
            [
                'key' => 'name', 
                'value' => 'Robot', 
                'operator' => '<>'
            ]
        ];
        
        switch($sCnfnType) {
            case 'email':
                $aFilter[] = array('value' => '', 'key' => 'email_confirmed', 'operator' => '=');
                $aFilter[] = array('value' => '', 'key' => 'email_confirmed', 'operator' => '<>');
                break;
            case 'phone':
                $aFilter[] = array('value' => '', 'key' => 'phone_confirmed', 'operator' => '=');
                $aFilter[] = array('value' => '', 'key' => 'phone_confirmed', 'operator' => '<>');
                break;
            case 'email_and_phone':
                $aFilter[] = array('value' => '', 'key' => 'phone_confirmed` * `email_confirmed', 'operator' => '=');
                $aFilter[] = array('value' => '', 'key' => 'phone_confirmed` * `email_confirmed', 'operator' => '<>');
                break;
        }

        $iNum1 = $this->_oDb->getEntriesNumByParams($aFilter);      
        
        return array('counter1_value' => $iNum1,'counter3_value' => $iNumTotal, 'counter1_caption' => _t('_bx_accnt_menu_dashboard_manage_tools_addon_counter1_caption'));
    }

    public function checkAllowedManage($isPerformAction = false)
    {
        $bAdmin = isAdmin();
        if(!$bAdmin && !$this->_isModerator($isPerformAction) && !$this->_isAdministrator($isPerformAction))
            return _t('_sys_txt_access_denied');

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedConfirm(&$aDataEntry, $isPerformAction = false)
    {
    	$bAdmin = isAdmin();
    	if(!$bAdmin || BxDolAccount::getInstance($aDataEntry['id'])->isConfirmed())
    		return _t('_sys_txt_access_denied');

    	return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedDelete(&$aDataEntry, $isPerformAction = false)
    {
    	if(isAdmin() && (int)$aDataEntry['id'] == getLoggedId())
    		return _t('_sys_txt_access_denied');

        // check ACL
        $aCheck = checkActionModule($this->_iProfileId, 'delete account', 'system', $isPerformAction);
        if($aCheck[CHECK_ACTION_RESULT] != CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedEditEmail(&$aDataEntry, $isPerformAction = false)
    {
    	$bAdmin = isAdmin();
        $iAccountId = getLoggedId();
    	if((!$bAdmin && !$this->_isAdministrator($isPerformAction)) || (int)$aDataEntry['id'] == $iAccountId)
            return _t('_sys_txt_access_denied');

    	return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedSetOperatorRole(&$aDataEntry, $isPerformAction = false)
    {
    	$bAdmin = isAdmin();
        $iAccountId = getLoggedId();
    	if(!$bAdmin || !BxDolStudioRolesUtils::getInstance()->isActionAllowed(BX_SRA_MANAGE_ROLES, $iAccountId) || (int)$aDataEntry['id'] == $iAccountId)
            return _t('_sys_txt_access_denied');

    	return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedMakeOperator(&$aDataEntry, $isPerformAction = false)
    {
    	$bAdmin = isAdmin();
        $iAccountId = getLoggedId();
    	if(!$bAdmin || !BxDolStudioRolesUtils::getInstance()->isActionAllowed(BX_SRA_MANAGE_ROLES, $iAccountId) || (int)$aDataEntry['id'] == $iAccountId || (int)$aDataEntry['role'] == 3)
            return _t('_sys_txt_access_denied');

    	return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedUnmakeOperator(&$aDataEntry, $isPerformAction = false)
    {
    	$bAdmin = isAdmin();
        $iAccountId = getLoggedId();
    	if(!$bAdmin || !BxDolStudioRolesUtils::getInstance()->isActionAllowed(BX_SRA_MANAGE_ROLES, $iAccountId) || (int)$aDataEntry['id'] == $iAccountId || (int)$aDataEntry['role'] != 3)
            return _t('_sys_txt_access_denied');

    	return CHECK_ACTION_RESULT_ALLOWED;
    }
    
    public function checkAllowedUnlockAccount(&$aDataEntry, $isPerformAction = false)
    {
        $bAdmin = isAdmin();
    	if(!$bAdmin || (int)$aDataEntry['locked'] != 1)
    		return _t('_sys_txt_access_denied');

    	return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function isAllowDeleteOrDisable($iActorProfileId, $iTargetProfileId)
    {
        if(bx_acl_is_moderator($iActorProfileId) && bx_acl_is_advanced($iTargetProfileId))
            return false;

        return true;    
    }
}

/** @} */
