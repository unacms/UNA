<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReputationPageBrowse extends BxTemplPage
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_reputation';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($sKey = 'OBJECT_MENU_SUBMENU') && isset($CNF[$sKey]) && ($oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu')) !== false)
            $oMenuSubmenu->setObjectSubmenu($CNF[$sKey]);
    }
}

/** @} */
