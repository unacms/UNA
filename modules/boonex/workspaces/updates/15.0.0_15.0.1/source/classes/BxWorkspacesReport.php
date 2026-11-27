<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Workspaces Workspaces
 * @ingroup     UnaModules
 *
 * @{
 */

class BxWorkspacesReport extends BxTemplReport
{
    protected $MODULE;
    protected $_oModule;
    
    function __construct($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_workspaces';

        parent::__construct($aOptions, $oTemplate);

        $this->_oModule = BxDolModule::getInstance($this->MODULE);
    }

    public function isAllowedReport($isPerformAction = false)
    {
        $oProfile = BxDolProfile::getInstanceByContentAndType($this->getId(), $this->_oModule->getName());
        if($oProfile && $oProfile->id() == bx_get_logged_profile_id())
            return false;

        return parent::isAllowedReport($isPerformAction);
    }
}

/** @} */
