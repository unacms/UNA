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

/**
 * 'Manage tools' menu.
 */
class BxAccntMenuManageTools extends BxBaseModGeneralMenuManageTools
{

    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_accounts';
        parent::__construct($aObject, $oTemplate);
    }

    /**
     * Check if menu items is visible.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        $aDataEntry = BxDolAccountQuery::getInstance()->getInfoById($this->_iContentId);
        if(empty($aDataEntry) || !is_array($aDataEntry))
        	return false;

        $sCheckFuncName = '';
        switch ($a['name']) {
            case 'edit-email':
                $sCheckFuncName = 'checkAllowedEditEmail';
                break;
            case 'delete':
            case 'delete-with-content':
                $sCheckFuncName = 'checkAllowedDelete';
                break;
            case 'set-operator-role':
                $sCheckFuncName = 'checkAllowedSetOperatorRole';
            	break;
            case 'make-operator':
            	$sCheckFuncName = 'checkAllowedMakeOperator';
            	break;
            case 'unmake-operator':
            	$sCheckFuncName = 'checkAllowedUnmakeOperator';
            	break;
            case 'unlock-account':
            	$sCheckFuncName = 'checkAllowedUnlockAccount';
            	break;
            case 'confirm':
            	$sCheckFuncName = 'checkAllowedConfirm';
            	break;
        }

        if(!$sCheckFuncName || !method_exists($this->_oModule, $sCheckFuncName))
            return true;

        return $this->_oModule->{$sCheckFuncName}($aDataEntry) === CHECK_ACTION_RESULT_ALLOWED;
    }
}

/** @} */
