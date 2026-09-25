<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksMenuSubmenu extends BxTemplMenuCustom
{
    protected $_sModule;
    protected $_oModule;

    protected $_iProfileId;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $oTemplate);

        $this->_iProfileId = bx_get_logged_profile_id();
    }

    public function getCodeAPI ()
    {
        $aResult = parent::getCodeAPI();
        
        $aItems = [];
        foreach($aResult['items'] as $aItem)
            if(($aData = $aItem['data']['items'] ?? false) && is_array($aData))
                $aItems = array_merge($aItems, $aData);

        if($aItems)
            $aResult['items'] = $aItems;

        return $aResult;
    }

    protected function _getMenuItemUse ($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_USE_TOOLS_SUBMENU']);
        if(!$this->_bIsApi || !$oMenu)
            return false;

        return [
            'id' => $aItem['id'],
            'name' => $aItem['name'],
            'display_type' => 'menu',
            'data' => $oMenu->getCodeAPI()
        ];
    }

    protected function _getMenuItemBrowse ($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_BROWSE']);
        if(!$this->_bIsApi || !$oMenu)
            return false;

        $oMenu->setProfileId($this->_iProfileId);

        return [
            'id' => $aItem['id'],
            'name' => $aItem['name'],
            'display_type' => 'menu',
            'data' => $oMenu->getCodeAPI()
        ];
    }

    protected function _getMenuItemManage ($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_MANAGE_TOOLS_SUBMENU']);
        if(!$this->_bIsApi || !$oMenu)
            return false;

        return [
            'id' => $aItem['id'],
            'name' => $aItem['name'],
            'display_type' => 'menu',
            'data' => $oMenu->getCodeAPI()
        ];
    }
}

/** @} */
