<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Forum Forum
 * @ingroup     UnaModules
 *
 * @{
 */

class BxForumStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
    	$this->_sModule = 'bx_forum';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems['categories'] = array('name' => 'categories', 'icon' => 'menu', 'title' => '_bx_forum_lmi_cpt_categories');
    }

    protected function getCategories()
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oModule->_oConfig->CNF['OBJECT_GRID_CATEGORIES'], BxDolStudioTemplate::getInstance());
        if(!$oGrid)
            return '';

        return $oGrid->getCode();
    }
}

/** @} */
