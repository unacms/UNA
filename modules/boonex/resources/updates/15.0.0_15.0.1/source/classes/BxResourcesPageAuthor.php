<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Profile's entries page.
 */
class BxResourcesPageAuthor extends BxBaseModTextPageAuthor
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_sModule = 'bx_resources';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        if(($oMenuHolder = BxDolMenu::getObjectInstance('sys_site_submenu')) && ($oMenu = BxDolMenu::getObjectInstance($oMenuHolder->getObjectSubmenu())))
            $oMenu->setSelected($this->_sModule, 'resources-context');
    }
}

/** @} */
