<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioNavigationQuery extends BxDolDb
{
    function __construct()
    {
        parent::__construct();
    }

    function getMenus($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = "
            `tm`.`id` AS `id`,
            `tm`.`object` AS `object`,
            `tm`.`title` AS `title`,
            `tm`.`title_public` AS `title_public`,
            `tm`.`set_name` AS `set_name`,
            `tm`.`module` AS `module`,
            `tm`.`template_id` AS `template_id`,
            `tm`.`config_api` AS `config_api`,
            `tm`.`button_style` AS `button_style`,
            `tm`.`button_size` AS `button_size`,
            `tm`.`counters` AS `counters`,
            `tm`.`persistent` AS `persistent`,
            `tm`.`deletable` AS `deletable`,
            `tm`.`active` AS `active`,
            `tm`.`override_class_name` AS `override_class_name`,
            `tm`.`override_class_file` AS `override_class_file`";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tm`.`id` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = " AND `tm`.`id`=:id ";
                break;

            case 'by_object':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sWhereClause = " AND `tm`.`object`=:object ";
                break;

            case 'by_set_name':
            	$aMethod['params'][1] = array(
                    'set_name' => $aParams['value']
                );

                $sWhereClause = " AND `tm`.`set_name`=:set_name ";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tm`.`module`";
                break;
            
            case 'export':
                $sSelectClause = "`tm`.*";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . $sSelectClause . "
            FROM `sys_objects_menu` AS `tm` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }
    
    function isMenuExists($sObject)
    {
        $aMenu = [];
        $this->getMenus(['type' => 'by_object', 'value' => $sObject], $aMenu, false);

        return !empty($aMenu) && is_array($aMenu);
    }

    function addMenu($aFields)
    {
        return $this->query("INSERT INTO `sys_objects_menu` SET " . $this->arrayToSQL($aFields));
    }

    function updateMenus($aParamsSet, $aParamsWhere = [])
    {
        if(empty($aParamsSet))
            return false;

        $sWhereClause = "1";
        if(!empty($aParamsWhere))
            $sWhereClause = $this->arrayToSQL($aParamsWhere, " AND ");

        return $this->query("UPDATE `sys_objects_menu` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $sWhereClause);
    }
    
    function updateMenuByObject($sObject, $aFields)
    {
        return $this->query("UPDATE `sys_objects_menu` SET " . $this->arrayToSQL($aFields) . " WHERE `object`=:object", [
            'object' => $sObject
        ]);
    }

    function getSets($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = "
            `tms`.`set_name` AS `name`,
            `tms`.`set_name` AS `set_name`,
            `tms`.`module` AS `module`,
            `tms`.`title` AS `title`,
            `tms`.`deletable` AS `deletable`";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tms`.`title` ASC";

        switch($aParams['type']) {
            case 'by_name':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'set_name' => $aParams['value']
                );

                $sSelectClause .= ", COUNT(`tmi`.`id`) AS `items_count`";
                $sJoinClause = "LEFT JOIN `sys_menu_items` AS `tmi` ON `tms`.`set_name`=`tmi`.`set_name` AND `tmi`.`active`='1'";
                $sWhereClause = " AND `tms`.`set_name`=:set_name ";
                $sGroupClause = "GROUP BY `tms`.`set_name`";
                break;

            case 'by_module':
            	$aMethod['params'][1] = array(
                	'module' => $aParams['value']
                );

                $sWhereClause = " AND `tms`.`module`=:module ";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tms`.`module`";
                break;

            case 'dump_by_name':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'set_name' => $aParams['value']
                );

                $sWhereClause = " AND `tms`.`set_name`=:set_name ";
                break;

            case 'export_by_name':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'set_name' => $aParams['value']
                ];

                $sSelectClause = "`tms`.*";
                $sWhereClause = " AND `tms`.`set_name`=:set_name ";
                break;
            
            case 'all':
                if(isset($aParams['except'])) {
                    $aMethod['params'][1] = array(
                        'set_name' => $aParams['except']
                    );

                    $sWhereClause = " AND `tms`.`set_name`<>:set_name ";
                }
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . $sSelectClause . "
            FROM `sys_menu_sets` AS `tms` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function isSetExists($sName)
    {
        $aSet = [];
        $this->getSets(['type' => 'by_name', 'value' => $sName], $aSet, false);

        return !empty($aSet) && is_array($aSet);
    }

    function addSet($aFields)
    {
        $sSql = "INSERT INTO `sys_menu_sets` SET `" . implode("`=?, `", array_keys($aFields)) . "`=?";
        $sSql = call_user_func_array(array($this, 'prepare'), array_merge(array($sSql), array_values($aFields)));
        return (int)$this->query($sSql) > 0;
    }

    function getTemplates($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tmt`.`title` ASC";

        switch($aParams['type']) {
        	case 'all_visible_key_id':
        		$aMethod['name'] = 'getAllWithKey';
        		$aMethod['params'][1] = 'id';

        		$sWhereClause .= "AND `tmt`.`visible`='1'";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tmt`.`id` AS `id`,
                `tmt`.`template` AS `template`,
                `tmt`.`title` AS `title`,
                `tmt`.`visible` AS `visible`" . $sSelectClause . "
            FROM `sys_menu_templates` AS `tmt` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function isParentItem($iItemId)
    {
        $aItems = array();
        $this->getItems(array('type' => 'by_parent_id', 'value' => $iItemId), $aItems, false);

        return !empty($aItems) && is_array($aItems);
    }

    function getItems($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = "*";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tmi`.`order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = " AND `tmi`.`id`=:id ";
                break;

            case 'by_set_and_name':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'set_name' => $aParams['set_name'],
                    'name' => $aParams['name'],
                );

                $sWhereClause = " AND `tmi`.`set_name`=:set_name AND `tmi`.`name`=:name ";
                break;

            case 'by_parent_id':
                $aMethod['params'][1] = array(
                    'parent_id' => $aParams['value']
                );

                $sWhereClause = " AND `tmi`.`parent_id`=:parent_id ";
                break;

            case 'by_set_name':
            	$aMethod['params'][1] = array(
                    'set_name' => $aParams['value']
                );

                $sWhereClause = " AND `tmi`.`set_name`=:set_name ";
                break;

            case 'export_by_set_name':
                $aMethod['params'][1] = [
                    'set_name' => $aParams['value']
                ];

                $sSelectClause = "`tmi`.*";
                $sWhereClause = " AND `tmi`.`set_name`=:set_name ";
                break;

            case 'counter_by_sets':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'set_name';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tmi`.`set_name`";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tmi`.`module`";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . $sSelectClause . "
            FROM `sys_menu_items` AS `tmi` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function isItemExists($sSetName, $sName)
    {
        $aItem = [];
        $this->getItems(['type' => 'by_set_and_name', 'set_name' => $sSetName, 'name' => $sName], $aItem, false);

        return !empty($aItem) && is_array($aItem);
    }

    function deleteItemsBy($aParams)
    {
        $sWhereClause = $sLimitClause = "";

        switch($aParams['type']) {
            case 'by_id':
            	$aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = " AND `tmi`.`id`=:id ";
                break;

            case 'by_set_name':
            	$aMethod['params'][1] = array(
                	'set_name' => $aParams['value']
                );

                $sWhereClause = " AND `tmi`.`set_name`=:set_name ";
                break;

            case 'all':
                break;
        }

        $sSql = "DELETE FROM `tmi` USING `sys_menu_items` AS `tmi` WHERE 1 " . $sWhereClause . " " . $sLimitClause;
        return (int)$this->query($sSql) > 0;
    }

    function addItem($aItem)
    {
        $sSql = "INSERT INTO `sys_menu_items` SET `" . implode("`=?, `", array_keys($aItem)) . "`=?";
        $sSql = call_user_func_array(array($this, 'prepare'), array_merge(array($sSql), array_values($aItem)));
        return (int)$this->query($sSql) > 0 ? $this->lastId() : 0;
    }

    function updateItem($iId, $aFields)
    {
        $sSql = "UPDATE `sys_menu_items` SET " . $this->arrayToSQL($aFields) . " WHERE `id`=:id";
        return $this->query($sSql, ['id' => $iId]);
    }

    function updateItems($aParamsSet, $aParamsWhere = [])
    {
        if(empty($aParamsSet))
            return false;

        $sWhereClause = "1";
        if(!empty($aParamsWhere))
            $sWhereClause = $this->arrayToSQL($aParamsWhere, " AND ");

        return $this->query("UPDATE `sys_menu_items` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $sWhereClause);
    }

    function updateItemBySetAndName($sSetName, $sName, $aFields)
    {
        return $this->query("UPDATE `sys_menu_items` SET " . $this->arrayToSQL($aFields) . " WHERE `set_name`=:set_name AND `name`=:name", [
            'set_name' => $sSetName,
            'name' => $sName
        ]);
    }

    function getItemOrderMax($sSetName)
    {
        $sSql = $this->prepare("SELECT MAX(`order`) FROM `sys_menu_items` WHERE `set_name`=? LIMIT 1", $sSetName);
        return (int)$this->getOne($sSql);
    }
}

/** @} */
