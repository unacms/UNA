<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup   Editor integration
 * @ingroup     UnaModules
 *
 * @{
 */

class BxEditorStudioPage extends BxTemplStudioModule
{
    protected $_sModule;
    protected $_oModule;

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        $this->_sModule = 'bx_editor';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aMenuItems = array(
            'settings' => array('name' => 'mini', 'icon' => 'battery', 'title' => '_bx_editor_mini'),
            'standard' => array('name' => 'standard', 'icon' => 'battery-medium', 'title' => '_bx_editor_standard'),
            'full' => array('name' => 'full', 'icon' => 'battery-full', 'title' => '_bx_editor_full'),
        );
    }
    
    protected function getSettings()
    {
        return $this->getGrid('mini');
    }
    
    protected function getStandard()
    {
        return $this->getGrid('standard');
    }
    
    protected function getFull()
    {
        return $this->getGrid('full');
    }
    
    protected function getGrid($sMode)
    {
        $sGrid = 'bx_editor_toolbar';
        $oGrid = BxDolGrid::getObjectInstance($sGrid, BxDolStudioTemplate::getInstance());
        if(!$oGrid)
            return '';

        return $oGrid->getCode();
    }
}

/** @} */
