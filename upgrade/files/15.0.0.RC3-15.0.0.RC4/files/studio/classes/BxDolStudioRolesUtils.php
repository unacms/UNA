<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

/**
 * Default Studio roles actions.
 */
define('BX_SRA_MANAGE_ROLES', 'manage roles');
define('BX_SRA_MANAGE_APPS', 'manage apps');

class BxDolStudioRolesUtils extends BxDol implements iBxDolSingleton
{
    protected $oDb;

    public function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->oDb = BxDolStudioRolesQuery::getInstance();
    }
    
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolStudioRolesUtils();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function getRoles($bActive = true)
    {
        return $this->oDb->getRoles(array('type' => 'all' . ($bActive ? '_active' : '')));
    }
    
    public function getRole($iAccountId)
    {
        $aMember = $this->oDb->getMembers(array('type' => 'by_account_id', 'account_id' => $iAccountId));
        if(empty($aMember) || !is_array($aMember))
            return 0;

        return (int)$aMember['role'];
    }

    public function setRole($iAccountId, $mixedRole)
    {
        return $this->oDb->setRole($iAccountId, $this->convertRoleA2I($mixedRole));
    }

    public function isRoleInSet($iRole, $mixedRoles)
    {
        $iRoles = $this->convertRoleA2I($mixedRoles);
        if(!$iRoles)
            return false;

        return (pow(2, $iRole - 1) & $iRoles);
    }

    public function convertRoleA2I($mixedRole) 
    {
        if(!is_array($mixedRole))
            return $mixedRole;

        if(count($mixedRole) == 1 && current($mixedRole) == 0) 
            return 0;

        $iAccountRole = 0;
        foreach($mixedRole as $iRole)
            $iAccountRole = $iAccountRole | pow(2, ($iRole - 1));

        return $iAccountRole;
    }

    public function isActionAllowed($sAction, $iAccountId = 0)
    {
        if(empty($iAccountId))
            $iAccountId = getLoggedId();

        $aAction = $this->oDb->getActions(array('type' => 'by_name', 'name' => $sAction));
        if(empty($aAction) || !is_array($aAction))
            return true;

        $iRole = $this->getRole($iAccountId);
        return $this->oDb->isActionAllowed($iRole, (int)$aAction['id']);
    }
}

/** @} */
