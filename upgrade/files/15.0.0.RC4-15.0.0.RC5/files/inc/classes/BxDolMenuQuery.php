<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_MENU_LAST_ITEM_ORDER', 9999);

/**
 * Database queries for menus.
 * @see BxDolMenu
 */
class BxDolMenuQuery extends BxDolDb
{
    protected $_aObject;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
    }

    static public function getMenuObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();

        $aMenuObjects = $oDb->fromCache('sys_menu_objects', 'getAllWithKey', "SELECT `o`.*, `t`.`template` FROM `sys_objects_menu` AS `o` INNER JOIN `sys_menu_templates` AS `t` ON (`t`.`id` = `o`.`template_id`)", 'object');
        if (!$aMenuObjects || !isset($aMenuObjects[$sObject]))
            return false;
        return $aMenuObjects[$sObject];
    }

    static public function getMenuObjects($bActive = true, $bFromCache = true)
    {
        $oDb = BxDolDb::getInstance();
        $sSql = $oDb->prepare("SELECT `sys_objects_menu`.`title`, `object`, `module`, `uri` FROM `sys_objects_menu` INNER JOIN `sys_modules` ON (`sys_modules`.`name` = `sys_objects_menu`.`module`) WHERE `active` = ? ORDER BY FIELD(`module`, 'system') DESC, `module` ASC, `object` ASC", $bActive ? 1 : 0);
        return $bFromCache ? $oDb->fromCache('sys_menus', 'getAll', $sSql) : $oDb->getAll($sSql);
    }

    static public function getMenuTriggers($sTriggerName)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_menu_items` WHERE `set_name` = ? ORDER BY `order` DESC", $sTriggerName);
        return $oDb->getAll($sQuery);
    }

    /**
     * The icon of a set's item that opens a link: a module's create item in its "My" menu gives the module's add button
     * its icon (BxBasePage::getAddEntryParams), so operators change it in Studio > Navigation.
     * @param string $sSetName menu set
     * @param string $sLink the item's link as stored (page.php?i=create-post)
     * @return string the icon, or an empty string
     */
    static public function getMenuItemIconByLink($sSetName, $sLink)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT `icon` FROM `sys_menu_items` WHERE `set_name` = ? AND `link` = ? ORDER BY `id` ASC LIMIT 1", $sSetName, $sLink);
        return (string)$oDb->getOne($sQuery);
    }

    static public function addMenuItemToSet($aMenuItem)
    {
        $oDb = BxDolDb::getInstance();

        if (empty($aMenuItem['set_name']))
            return false;

        // check if menu item already exists, 
        // so the menu item position will not reset when it's unnecessary
        $sQuery = $oDb->prepare("SELECT `id` FROM `sys_menu_items` WHERE `set_name` = ? AND `name` = ?", $aMenuItem['set_name'], $aMenuItem['name']);
        if ($oDb->getOne($sQuery))
            return true;
      
        // get order
        if (empty($aMenuItem['order'])) {
            $sQuery = $oDb->prepare("SELECT `order` FROM `sys_menu_items` WHERE `set_name` = ? AND `active` = 1 AND `order` != ? ORDER BY `order` DESC LIMIT 1", $aMenuItem['set_name'], BX_MENU_LAST_ITEM_ORDER);
            $iProfileMenuOrder = (int)$oDb->getOne($sQuery);
            $aMenuItem['order'] = $iProfileMenuOrder + 1;
        }

        // add new item
        unset($aMenuItem['id']);
        return $oDb->query("INSERT INTO `sys_menu_items` SET " . $oDb->arrayToSQL($aMenuItem));
    }

    public function getMenuItems()
    {
        return $this->getMenuItemsFromSet($this->_aObject['set_name']);
    }
    
    public function getMenuItemsHierarchy()
    {
        $aWithSubitems = $this->getMenuItemsBy(array(
            'type' => 'with_subitems', 
            'set_name' => $this->_aObject['set_name']
        ));

        $aResult = array();
        $this->_getMenuItemsHierarchy($this->_aObject['set_name'], 0, $aWithSubitems, $aResult);

        return $aResult;
    }

    public function _getMenuItemsHierarchy($sSet, $iParentId, $aWithSubitems, &$aResult)
    {
        $aItems = $this->getMenuItemsFromSet($sSet, $iParentId);
        foreach($aItems as $sItem => $aItem) {
            $aResult[$sItem] = $aItem;

            if(!in_array($sItem, $aWithSubitems))
                continue;

            $this->_getMenuItemsHierarchy($sSet, $aItem['id'], $aWithSubitems, $aResult[$sItem]['subitems']);
        }
    }

    public function getMenuItemsFromSet($sSetName, $iParentId = false)
    {
        $aBindings = array('set_name' => $sSetName);
        $sWhereClause = " AND `set_name` = :set_name";
        
        if($iParentId !== false) {
            $aBindings['parent_id'] = $iParentId;

            $sWhereClause .= " AND `parent_id` = :parent_id";
        }

        return $this->getAllWithKey("SELECT * FROM `sys_menu_items` WHERE 1" . $sWhereClause . " ORDER BY `order` ASC", 'name', $aBindings);
    }

    public function getMenuItemsBy($aParams = array())
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $aBindings = array();

    	$sSelectClause = '*';
    	$sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = '';
    	$sLimitClause = isset($aParams['start']) && !empty($aParams['per_page']) ? " LIMIT " . $aParams['start'] . ", " . $aParams['per_page'] : "";

    	if(!empty($aParams['type']))
            switch($aParams['type']) {
                case 'set_name':
                    $aBindings['set_name'] = $aParams['set_name'];

                    $sWhereClause = 'AND `set_name` = :set_name';
                    $sOrderClause = '`order` ASC';
                    break;

                case 'set_name_duplicates':
                    $aMethod['name'] = 'getColumn';
                    $aBindings['set_name'] = $aParams['set_name'];

                    $sSelectClause = '`name`';
                    $sWhereClause = 'AND `set_name` = :set_name';
                    $sGroupClause = '`name` HAVING COUNT(`id`) > 1';
                    break;

                case 'with_subitems':
                    $aMethod['name'] = 'getColumn';
                    $aBindings['set_name'] = $aParams['set_name'];

                    $sSelectClause = 'DISTINCT `ti`.`name`';
                    $sJoinClause = 'AS `ti` INNER JOIN `sys_menu_items` AS `tsi` ON `ti`.`id`=`tsi`.`parent_id`';
                    $sWhereClause = 'AND `ti`.`set_name` = :set_name';
                    break;

                case 'subitems':
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'name';
                    $aBindings['parent_id'] = $aParams['parent_id'];

                    $sWhereClause = 'AND `parent_id` = :parent_id';
                    $sOrderClause = '`order` ASC';
                    break;
            }

        if(!empty($sGroupClause))
            $sGroupClause = " GROUP BY " . $sGroupClause;

        if(!empty($sOrderClause))
            $sOrderClause = " ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `sys_menu_items` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sGroupClause . $sOrderClause . $sLimitClause;
        $aMethod['params'][] = $aBindings;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }
    
    public function getMenuTemplateById($iId, $bFromCache = true)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_menu_templates` WHERE `id`=? LIMIT 1", $iId);
        return $bFromCache ? $this->fromMemory('sys_menu_templates_' . $iId, 'getRow', $sSql) : $this->getRow($sSql);
    }

    public function isSetMultilevel($sName)
    {
        $sSql = $this->prepare("SELECT 1 FROM `sys_menu_items` WHERE `set_name` = ? AND `parent_id` != '0' LIMIT 1", $sName);
        return (int)$this->getOne($sSql) > 0;
    }
}

/** @} */
