<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTimelineMenuItemActionsAll extends BxTimelineMenuItemActions
{
    protected $_aBrowseParams;
    protected $_aSubmenus;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_timeline';

        parent::__construct($aObject, $oTemplate);

        $this->_aBrowseParams = array();
        $this->_aSubmenus = array();
    }

    public function setEvent($aEvent, $aBrowseParams = array())
    {
        $bResult = parent::setEvent($aEvent, $aBrowseParams);
        if(!$bResult)
            return $bResult;

        $this->_aSubmenus = array(
            $this->_getSubmenuKey('menu_item_actions') => false,
            $this->_getSubmenuKey('menu_item_manage') => false
        );

        return $bResult;
    }

    public function addMarkersExt($a)
    {
        $bResult = $this->addMarkers($a);
        if(!$bResult)
            return $bResult;

        foreach($this->_aSubmenus as $sSubmenu)
            if(($oSubmenu = $this->_getSubmenu($sSubmenu)) !== false)
                $oSubmenu->addMarkers($a);

        return $bResult;
    }

    protected function _setBrowseParams($aBrowseParams = array())
    {
        $this->_aBrowseParams = $aBrowseParams;

        parent::_setBrowseParams($aBrowseParams);
    }

    protected function _getHtmlIds()
    {
        return array_merge(parent::_getHtmlIds(), array(
            'main' => $this->_getHtmlIdMain()
        ));
    }

    protected function _getHtmlIdMain()
    {
        return parent::_getHtmlIdMain() . strtolower($this->_getUniquePart('-'));
    }

    protected function _getJsObjectMoreAuto()
    {
        return parent::_getJsObjectMoreAuto() . $this->_getUniquePart();
    }

    protected function _getSubmenu($sName)
    {
        $sKey = $this->_getSubmenuKey($sName);
        if(!$this->_aSubmenus[$sKey]) {
            $sObject = $this->_oModule->_oConfig->getObject($sName);

            $this->_aSubmenus[$sKey] = BxDolMenu::getObjectInstance($sObject);
            if(!$this->_aSubmenus[$sKey])
                return false;

            $this->_aSubmenus[$sKey]->setTemplateNameItem($this->_sTmplNameItem);
            $this->_aSubmenus[$sKey]->setEvent($this->_aEvent, $this->_aBrowseParams);

            $this->addMarkers($this->_aSubmenus[$sKey]->getMarkers());
        }

        return $this->_aSubmenus[$sKey];
    }
    
    protected function _getSubmenuKey($sName)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return $sName . '_' . $this->_aEvent[$CNF['FIELD_ID']];
    }
    
    /**
     * Items taken from 'Actions' menu
     */
    protected function _getMenuItemItemComment($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemItemShare($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemItemRepost($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }
    

    /**
     * Items taken from 'Manage' menu
     */
    protected function _getMenuItemItemPin($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }

    protected function _getMenuItemItemUnpin($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }

    protected function _getMenuItemItemStick($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }
    
    protected function _getMenuItemItemUnstick($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }

    protected function _getMenuItemItemPromote($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }
    
    protected function _getMenuItemItemUnpromote($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }
    
    protected function _getMenuItemItemEdit($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }

    protected function _getMenuItemItemDelete($aItem)
    {
        return $this->_getMenuItemByNameManage($aItem);
    }

    protected function _getMenuItemByNameActions($aItem, $aParams = array())
    {
        $oMenuManage = $this->_getSubmenu('menu_item_actions');
        if(!$oMenuManage)
            return false;

        $aItem = $oMenuManage->getMenuItem($aItem['name']);
        if(empty($aItem) || !is_array($aItem))
            return false;

        return $this->_bIsApi ? $aItem : $aItem['item'];
    }

    protected function _getMenuItemByNameManage($aItem, $aParams = array())
    {
        $oMenuManage = $this->_getSubmenu('menu_item_manage');
        if(!$oMenuManage)
            return false;

        $aItem = $oMenuManage->getMenuItem($aItem['name']);
        if(empty($aItem) || !is_array($aItem))
            return false;

        return $this->_bIsApi ? $aItem : $aItem['item'];
    }

    private function _getUniquePart($sDelimiter = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sResult = '';
        if(!empty($this->_aBrowseParams['view']))
            $sResult .= $sDelimiter . bx_gen_method_name($this->_aBrowseParams['view']);
        if(!empty($this->_aBrowseParams['type']))
            $sResult .= $sDelimiter . bx_gen_method_name($this->_aBrowseParams['type']);

        return $sResult . $sDelimiter . $this->_aEvent[$CNF['FIELD_ID']];
    }
}

/** @} */
