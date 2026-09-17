<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioApiConfigs extends BxTemplStudioGrid
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= " AND `enabled`<>0 ";

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getQueriesPagesConfigApi($sModule = '')
    {
        $sResult = '';
        $sWhere = $sModule ? $this->oDb->prepareAsString(" AND `module`=?", $sModule) : "";

        $aPages = $this->oDb->getAll("SELECT `object`, `config_api` FROM `sys_objects_page` WHERE `config_api` <> ''" . $sWhere . " ORDER BY `id` ASC");
        if($aPages && is_array($aPages)) {
            $sResult = "\n\n-- PAGES:\n";
            foreach($aPages as $aPage)
                $sResult .= $this->oDb->prepareAsString("UPDATE `sys_objects_page` SET `config_api`=? WHERE `object`=?;\n", $aPage['config_api'], $aPage['object']);
        }

        $aBlocks = $this->oDb->getAll("SELECT `object`, `module`, `title_system`, `title`, `config_api` FROM `sys_pages_blocks` WHERE `config_api` <> ''" . $sWhere . " ORDER BY `id` ASC");
        if($aBlocks && is_array($aBlocks)) {
            $sResult .= "\n\n-- PAGE BLOCKS:\n";
            foreach($aBlocks as $aBlock)
                $sResult .= $this->oDb->prepareAsString("UPDATE `sys_pages_blocks` SET `config_api`=? WHERE `object`=? AND `module`=? AND `title_system`=? AND `title`=?;\n", $aBlock['config_api'], $aBlock['object'], $aBlock['module'], $aBlock['title_system'], $aBlock['title']);
        }

        return $sResult;
    }

    protected function _getQueriesPagesActiveApi($sModule = '')
    {
        $sResult = '';
        $sWhere = $sModule ? $this->oDb->prepareAsString(" AND `module`=?", $sModule) : "";

        $aBlocks = $this->oDb->getAll("SELECT `object`, `module`, `title_system`, `title`, `active_api` FROM `sys_pages_blocks` WHERE `active_api` <> '0'" . $sWhere . " ORDER BY `id` ASC");
        if($aBlocks && is_array($aBlocks)) {
            $sResult = "\n\n-- PAGE BLOCKS:\n";
            foreach($aBlocks as $aBlock)
                $sResult .= $this->oDb->prepareAsString("UPDATE `sys_pages_blocks` SET `active_api`=? WHERE `object`=? AND `module`=? AND `title_system`=? AND `title`=?;\n", $aBlock['active_api'], $aBlock['object'], $aBlock['module'], $aBlock['title_system'], $aBlock['title']);
        }

        return $sResult;
    }

    protected function _getQueriesMenusConfigApi($sModule = '')
    {
        $sResult = '';
        $sWhere = $sModule ? $this->oDb->prepareAsString(" AND `module`=?", $sModule) : "";

        $aMenus = $this->oDb->getAll("SELECT `object`, `config_api` FROM `sys_objects_menu` WHERE `config_api` <> ''" . $sWhere . " ORDER BY `id` ASC");
        if($aMenus && is_array($aMenus)) {
            $sResult = "\n\n-- MENUS:\n";
            foreach($aMenus as $aMenu)
                $sResult .= $this->oDb->prepareAsString("UPDATE `sys_objects_menu` SET `config_api`=? WHERE `object`=?;\n", $aMenu['config_api'], $aMenu['object']);
        }

        $aItems = $this->oDb->getAll("SELECT `set_name`, `module`, `name`, `config_api` FROM `sys_menu_items` WHERE `config_api` <> ''" . $sWhere . " ORDER BY `id` ASC");
        if($aItems && is_array($aItems)) {
            $sResult .= "\n\n-- MENU ITEMS:\n";
            foreach($aItems as $aItem)
                $sResult .= $this->oDb->prepareAsString("UPDATE `sys_menu_items` SET `config_api`=? WHERE `set_name`=? AND `module`=? AND `name`=?;\n", $aItem['config_api'], $aItem['set_name'], $aItem['module'], $aItem['name']);
        }

        return $sResult;
    }

    protected function _getQueriesMenusActiveApi($sModule = '')
    {
        $sResult = '';
        $sWhere = $sModule ? $this->oDb->prepareAsString(" AND `module`=?", $sModule) : "";

        $aItems = $this->oDb->getAll("SELECT `set_name`, `module`, `name`, `active_api` FROM `sys_menu_items` WHERE `active_api` <> '0'" . $sWhere . " ORDER BY `id` ASC");
        if($aItems && is_array($aItems)) {
            $sResult = "\n\n-- MENU ITEMS:\n";
            foreach($aItems as $aItem)
                $sResult .= $this->oDb->prepareAsString("UPDATE `sys_menu_items` SET `active_api`=? WHERE `set_name`=? AND `module`=? AND `name`=?;\n", $aItem['active_api'], $aItem['set_name'], $aItem['module'], $aItem['name']);
        }       

        return $sResult;
    }
}

/** @} */
