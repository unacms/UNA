<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioFormsQuery extends BxDolDb
{
    function __construct()
    {
        parent::__construct();
    }

    function getForms($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = "
            `tf`.`id` AS `id`,
            `tf`.`object` AS `object`,
            `tf`.`module` AS `module`,
            `tf`.`title` AS `title`,
            `tf`.`action` AS `action`,
            `tf`.`form_attrs` AS `form_attrs`,
            `tf`.`table` AS `table`,
            `tf`.`key` AS `key`,
            `tf`.`uri` AS `uri`,
            `tf`.`uri_title` AS `uri_title`,
            `tf`.`submit_name` AS `submit_name`,
            `tf`.`params` AS `params`,
            `tf`.`deletable` AS `deletable`,
            `tf`.`active` AS `active`,
            `tf`.`override_class_name` AS `override_class_name`,
            `tf`.`override_class_file` AS `override_class_file`";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tf`.`title` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = " AND `tf`.`id`=:id ";
                break;

            case 'by_object':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'object' => $aParams['value'],
                ];

                $sWhereClause = "AND `tf`.`object`=:object ";
                break;

            case 'by_object_display':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'object' => $aParams['object'],
                    'display_name' => $aParams['display']
                );

                $sJoinClause = "LEFT JOIN `sys_form_displays` AS `td` ON `tf`.`object`=`td`.`object` ";
                $sWhereClause = "AND `td`.`object`=:object AND `td`.`display_name`=:display_name ";
                break;

            case 'by_module':
            	$aMethod['params'][1] = array(
                    'module' => $aParams['value']
                );

                $sWhereClause = "AND `tf`.`module`=:module";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tf`.`module`";
                break;
                
            case 'nested':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'object';
                $aMethod['params'][2] = 'title';
                $aMethod['params'][3] = array(
                    'parent_form' => $aParams['parent_form']
                );
                $sSubQuery = "SELECT `value` FROM `sys_form_inputs` sfi WHERE `type`='nested_form' AND `object` = :parent_form ";
                if (!@empty($aParams['ids'])){
                    $sSubQuery = "SELECT `value` FROM `sys_form_inputs` sfi WHERE `type`='nested_form' AND `object` = :parent_form AND `name` NOT IN (SELECT `input_name` FROM `sys_form_display_inputs` WHERE `id` IN(" . $aParams['ids'] . "))";
                }
                $sWhereClause = "AND `tf`.`parent_form`=:parent_form AND `object` NOT IN (" . $sSubQuery . ")";
                break;

            case 'export':
                $sSelectClause = "`tf`.*";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . $sSelectClause . "
            FROM `sys_objects_form` AS `tf` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }
    
    function isForm($sName)
    {
        $aForm = [];
        $this->getForms(['type' => 'by_object', 'value' => $sName], $aForm, false);

        return !empty($aForm) && is_array($aForm);
    }

    function addForm($aFields)
    {
        return $this->query("INSERT INTO `sys_objects_form` SET " . $this->arrayToSQL($aFields));
    }

    function updateForms($aParamsSet, $aParamsWhere = [])
    {
        if(empty($aParamsSet))
            return false;

        $sWhereClause = "1";
        if(!empty($aParamsWhere))
            $sWhereClause = $this->arrayToSQL($aParamsWhere, " AND ");

        return $this->query("UPDATE `sys_objects_form` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $sWhereClause);
    }

    function updateFormByObject($sObject, $aFields)
    {
        return $this->query("UPDATE `sys_objects_form` SET " . $this->arrayToSQL($aFields) . " WHERE `object`=:object", [
            'object' => $sObject
        ]);
    }

    function getDisplays($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = "
            `td`.`id` AS `id`,
            `td`.`object` AS `object`,
            `td`.`display_name` AS `name`,
            `td`.`display_name` AS `display_name`,
            `td`.`module` AS `module`,
            `td`.`view_mode` AS `view_mode`,
            `td`.`label_style` AS `label_style`,
            `td`.`title` AS `title`";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `td`.`title` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = " AND `td`.`id`=:id ";
                $sLimitClause = "LIMIT 1";
                break;

            case 'by_object_display':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'object' => $aParams['object'],
                    'display_name' => $aParams['display']
                );

                $sWhereClause = " AND `td`.`object`=:object AND `td`.`display_name`=:display_name ";
                $sLimitClause = "LIMIT 1";
                break;

            case 'by_name':
            	$aMethod['params'][1] = array(
                    'display_name' => $aParams['value']
                );

                $sWhereClause = " AND `td`.`display_name`=:display_name ";
                $sLimitClause = "LIMIT 1";
                break;

            case 'by_module':
            	$aMethod['params'][1] = array(
                    'module' => $aParams['value']
                );

                $sWhereClause = " AND `td`.`module`=:module ";
                break;

            case 'by_module_with_forms':
            	$aMethod['params'][1] = array(
                    'module' => $aParams['value']
                );

                $sSelectClause .= ", `tf`.`title` AS `form_title`";
                $sJoinClause = "LEFT JOIN `sys_objects_form` AS `tf` ON `td`.`object`=`tf`.`object` ";
                $sWhereClause = " AND `td`.`module`=:module ";
                $sOrderClause = "ORDER BY `td`.`object` ASC, `td`.`title` ASC";
                break;

            case 'by_object':
            	$aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sWhereClause = " AND `td`.`object`=:object ";
                break;

            case 'export_by_object':
                $aMethod['params'][1] = [
                    'object' => $aParams['value']
                ];

                $sSelectClause = "`td`.*";
                $sWhereClause = " AND `td`.`object`=:object ";
                break;

            case 'counter_by_forms':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'object';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `td`.`object`";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `td`.`module`";
                break;

            case 'all':
                break;

            case 'all_with_forms':
                $sSelectClause .= ", `tf`.`title` AS `form_title`";
                $sJoinClause = "LEFT JOIN `sys_objects_form` AS `tf` ON `td`.`object`=`tf`.`object` ";
                $sOrderClause = "ORDER BY `td`.`object` ASC, `td`.`title` ASC";
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . $sSelectClause . "
            FROM `sys_form_displays` AS `td` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function isDisplay($sName, $sDisplay)
    {
        $aDisplay = [];
        $this->getDisplays(['type' => 'by_object_display', 'object' => $sName, 'display' => $sDisplay], $aDisplay, false);

        return !empty($aDisplay) && is_array($aDisplay);
    }

    function addDisplay($aFields)
    {
        return $this->query("INSERT INTO `sys_form_displays` SET " . $this->arrayToSQL($aFields));
    }

    function updateDisplayByObjectAndName($sObject, $sName, $aFields)
    {
        return $this->query("UPDATE `sys_form_displays` SET " . $this->arrayToSQL($aFields) . " WHERE `object`=:object AND `display_name`=:display_name ", [
            'object' => $sObject,
            'display_name' => $sName
        ]);
    }

    function getInputs($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sFromClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        $sSelectClause = "
            `tdi`.`id` AS `id`,
            `ti`.`name` AS `name`,
            `ti`.`type` AS `type`,
            `ti`.`caption_system` AS `caption_system`,
            `ti`.`caption` AS `caption`,
            `tdi`.`visible_for_levels` AS `visible_for_levels`,
            `tdi`.`active` AS `active`,
            `tdi`.`order` AS `order`";

        $sFromClause = "`sys_form_display_inputs` AS `tdi`";
        $sJoinClause = "LEFT JOIN `sys_form_inputs` AS `ti` ON `tdi`.`input_name`=`ti`.`name` ";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tdi`.`order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = " AND `tdi`.`id`=:id ";
                break;

            case 'by_object_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'object' => $aParams['object'],
                	'id' => $aParams['id']
                );

                $sSelectClause = "`ti`.*, `tdi`.`id` AS `di_id`, `tdi`.`display_name` AS `display_name`, `tdi`.`visible_for_levels` AS `visible_for_levels`";
                $sWhereClause = " AND `ti`.`object`=:object AND `tdi`.`id`=:id ";
                break;

            case 'by_object_display':
            	$aMethod['params'][1] = array(
                	'object' => $aParams['object'],
                	'display_name' => $aParams['display']
                );

                $sWhereClause = " AND `ti`.`object`=:object AND `tdi`.`display_name`=:display_name ";

                if(isset($aParams['active'])) {
                	$aMethod['params'][1]['active'] = (int)$aParams['active'];
                	$sWhereClause .= " AND `tdi`.`active`=:active ";
                }
                break;

            case 'by_object_name_filter':
                $aMethod['name'] = 'getColumn';
                $aMethod['params'][1] = array(
                	'object' => $aParams['object'],
                	'name_filter' => $aParams['name_filter']
                );

                $sSelectClause = "DISTINCT `ti`.`name` AS `name`";
                $sWhereClause = " AND `ti`.`object`=:object AND `ti`.`name` LIKE (:name_filter) ";
                $sOrderClause = "ORDER BY LENGTH(`ti`.`name`) ASC, `ti`.`name` ASC";
                break;

            case 'dump_inputs':
            	$aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sSelectClause = "`ti`.*";
                $sFromClause = "`sys_form_inputs` AS `ti`";
                $sJoinClause = "";
                $sWhereClause = " AND `ti`.`object`=:object ";
                $sOrderClause = "";
                break;

            case 'dump_display_inputs':
                $sSelectClause = "`tdi`.*";
                $sJoinClause = "";
                $sWhereClause = " AND `tdi`.`display_name` IN (" . $this->implode_escape($aParams['displays']) . ") ";
                $sOrderClause = "";
                break;

            case 'dump_connections':
            	$aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sSelectClause = "`tdi`.*";
                $sJoinClause .= "LEFT JOIN `sys_form_displays` AS `td` ON `tdi`.`display_name`=`td`.`display_name` ";
                $sWhereClause = " AND `td`.`object`=:object AND `ti`.`object`=:object ";
                $sOrderClause = "ORDER BY `tdi`.`display_name` ASC, `tdi`.`order` ASC";
                break;

            case 'counter_by_displays':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'display_name';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = "`tdi`.`display_name` AS `display_name`, COUNT(`tdi`.`display_name`) AS `counter`";
                $sJoinClause = "";
                $sGroupClause = "GROUP BY `tdi`.`display_name`";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = "`ti`.`module` AS `module`, COUNT(*) AS `counter`";
                $sFromClause = "`sys_form_inputs` AS `ti`";
                $sJoinClause = "";
                $sGroupClause = "GROUP BY `ti`.`module`";
                $sOrderClause = "";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . " " . $sSelectClause . "
            FROM " . $sFromClause . " " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function isInput($sObject, $sName)
    {
        return (int)$this->getOne("SELECT `id` FROM `sys_form_inputs` WHERE `object`=:object AND `name`=:name LIMIT 1", [
            'object' => $sObject,
            'name' => $sName
        ]) > 0;
    }

    function isDisplayInput($sDisplay, $sInput)
    {
        return (int)$this->getOne("SELECT `id` FROM `sys_form_display_inputs` WHERE `display_name`=:display AND `input_name`=:input LIMIT 1", [
            'display' => $sDisplay,
            'input' => $sInput
        ]) > 0;
    }

    function addInput($aFields)
    {
        return $this->query("INSERT INTO `sys_form_inputs` SET " . $this->arrayToSQL($aFields));
    }
    
    function addDisplayInput($aFields)
    {
        return $this->query("INSERT INTO `sys_form_display_inputs` SET " . $this->arrayToSQL($aFields));
    }

    function updateInputByObjectAndName($sObject, $sName, $aFields)
    {
        return $this->query("UPDATE `sys_form_inputs` SET " . $this->arrayToSQL($aFields) . " WHERE `object`=:object AND `name`=:name ", [
            'object' => $sObject,
            'name' => $sName
        ]);
    }

    public function updateDisplayInputs($aParamsSet, $aParamsWhere = [])
    {
        if(empty($aParamsSet))
            return false;

        $sWhereClause = "1";
        if(!empty($aParamsWhere))
            $sWhereClause = $this->arrayToSQL($aParamsWhere, " AND ");

        return $this->query("UPDATE `sys_form_display_inputs` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $sWhereClause);
    }

    function updateDisplayInputByDisplayAndInput($sDisplay, $sInput, $aFields)
    {
        return $this->query("UPDATE `sys_form_display_inputs` SET " . $this->arrayToSQL($aFields) . " WHERE `display_name`=:display_name AND `input_name`=:input_name ", [
            'display_name' => $sDisplay,
            'input_name' => $sInput
        ]);
    }

    function deleteInputs($aParams)
    {
    	$aBindings = array();
        $sWhereClause = $sLimitClause = "";

        switch($aParams['type']) {
            case 'by_id':
                if(isset($aParams['object'], $aParams['name'])) {
                    $sSql = $this->prepare("DELETE FROM `tdi` USING `sys_form_display_inputs` AS `tdi` LEFT JOIN `sys_form_displays` AS `td` ON `tdi`.`display_name`=`td`.`display_name` WHERE `td`.`object`=? AND `tdi`.`input_name`=?", $aParams['object'], $aParams['name']);
                    $this->query($sSql);
                }

                $aBindings['id'] = $aParams['value'];

                $sWhereClause = " AND `ti`.`id`=:id ";
                break;
            case 'all':
                break;
        }

        $sSql = "DELETE FROM `ti` USING `sys_form_inputs` AS `ti` WHERE 1 " . $sWhereClause . " " . $sLimitClause;
        return (int)$this->query($sSql, $aBindings) > 0;
    }

    function checkInputsInDisplays($sObject, $sDisplayName)
    {
        $aDisplay = array();
        $this->getDisplays(array('type' => 'by_object_display', 'object' => $sObject, 'display' => $sDisplayName), $aDisplay, false);
        if(empty($aDisplay) || !is_array($aDisplay))
            return false;

		$sSql = $this->prepare("DELETE FROM `tdi` USING `sys_form_display_inputs` AS `tdi` LEFT JOIN `sys_form_inputs` AS `ti` ON `tdi`.`input_name`=`ti`.`name` WHERE 1 AND `tdi`.`display_name`=? AND `ti`.`id` IS NULL", $sDisplayName);
		$this->query($sSql);

        $sSql = $this->prepare("INSERT INTO `sys_form_display_inputs`(`display_name`, `input_name`) SELECT ? AS `display_name`,`ti`.`name` AS `input_name` FROM `sys_form_inputs` AS `ti` LEFT JOIN `sys_form_display_inputs` AS `tdi` ON  `ti`.`name`=`tdi`.`input_name` AND `tdi`.`display_name`=? WHERE 1 AND `ti`.`object`=? AND `tdi`.`id` IS NULL", $sDisplayName, $sDisplayName, $sObject);
        return (int)$this->query($sSql) > 0;
    }

    function getInputOrderMax($sDisplayName)
    {
        $sSql = $this->prepare("SELECT MAX(`order`) FROM `sys_form_display_inputs` WHERE `display_name`=? LIMIT 1", $sDisplayName);
        return (int)$this->getOne($sSql);
    }

    function getLists($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tl`.`key` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = " AND `tl`.`id`=:id ";
                break;

            case 'by_key':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'key' => $aParams['value']
                );

                $sWhereClause = " AND `tl`.`key`=:key ";
                break;

            case 'by_module':
            	$aMethod['params'][1] = array(
                	'module' => $aParams['value']
                );

                $sWhereClause = " AND `tl`.`module`=:module ";
                break;

            case 'pairs_list_values':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'key';
                $aMethod['params'][2] = 'values';
                $sSelectClause = ",COUNT( `tv`.`id`) AS `values`";
                $sJoinClause = "LEFT JOIN `sys_form_pre_values` AS `tv` ON `tl`.`key`=`tv`.`Key`";
                $sGroupClause = "GROUP BY `tl`.`id`";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tl`.`module`";
                break;

            case 'all_for_sets':
                $sWhereClause = "AND `tl`.`use_for_sets`='1'";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tl`.`id` AS `id`,
                `tl`.`module` AS `module`,
                `tl`.`key` AS `key`,
                `tl`.`title` AS `title`,
                `tl`.`use_for_sets` AS `use_for_sets`,
                `tl`.`extendable` AS `extendable`" . $sSelectClause . "
            FROM `sys_form_pre_lists` AS `tl` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function updateList($iId, $aFields)
    {
        $sSql = "UPDATE `sys_form_pre_lists` SET `" . implode("`=?, `", array_keys($aFields)) . "`=?  WHERE `id`=?";
        $sSql = call_user_func_array(array($this, 'prepare'), array_merge(array($sSql), array_values($aFields), array($iId)));
        return $this->query($sSql);
    }

    function isListUsedInSet($sKey)
    {
        bx_import('BxDolForm');

        $sSql = $this->prepare("SELECT
                COUNT( DISTINCT `ti`.`id`) AS `id`
            FROM `sys_form_pre_lists` AS `tl`
            LEFT JOIN `sys_form_inputs` AS `ti` ON CONCAT('" . BX_DATA_LISTS_KEY_PREFIX . "', `tl`.`key`)=`ti`.`values` AND `ti`.`type` IN ('select_multiple', 'checkbox_set')
            WHERE 1 AND `tl`.`key`=?", $sKey);
        return (int)$this->getOne($sSql) > 0;
    }
    
    function getCategories($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
            $sOrderClause = "ORDER BY `tv`.`module` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = " AND `tv`.`id`=:id ";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", `tv`.`module` AS `module`, COUNT(`tv`.`id`) AS `counter`";
                $sGroupClause = "GROUP BY `tv`.`module`";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tv`.`id` AS `id`,
                `tv`.`Value` AS `value`,
                `tv`.`Value` AS `Value` " . $sSelectClause . "
            FROM `sys_categories` AS `tv` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }
    
    
    function deleteCategories($CategoryId)
    {
        $sSql = "DELETE FROM `sys_categories2objects` WHERE `category_id` = :category_id";
        $aBindings = array(
            'category_id' => $CategoryId
    	);
        return $this->query($sSql, $aBindings);
    }

    function getValues($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tv`.`Order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = " AND `tv`.`id`=:id ";
                break;

            case 'by_key':
            	$aMethod['params'][1] = array(
                	'key' => $aParams['value']
                );

                $sWhereClause = " AND `tv`.`Key`=:key ";
                break;

            case 'by_key_key_value':
                $aMethod['name'] = 'getAllWithKey';
                $aMethod['params'][1] = 'value';
                $aMethod['params'][2] = array(
                	'key' => $aParams['value']
                );

                $sWhereClause = " AND `tv`.`Key`=:key ";
                break;

            case 'counter_by_lists':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'key';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tv`.`Key`";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", `tl`.`module` AS `module`, COUNT(`tv`.`id`) AS `counter`";
                $sJoinClause = "LEFT JOIN `sys_form_pre_lists` AS `tl` ON `tv`.`Key`=`tl`.`key`";
                $sGroupClause = "GROUP BY `tl`.`module`";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tv`.`id` AS `id`,
                `tv`.`Key` AS `key`,
                `tv`.`Key` AS `Key`,
                `tv`.`Value` AS `value`,
                `tv`.`Value` AS `Value`,
                `tv`.`LKey` AS `lkey`,
                `tv`.`LKey` AS `LKey`,
                `tv`.`LKey2` AS `lkey2`,
                `tv`.`LKey2` AS `LKey2`,
                `tv`.`Data` AS `data`,
                `tv`.`Data` AS `Data`,
                `tv`.`Order` AS `order`,
                `tv`.`Order` AS `Order`" . $sSelectClause . "
            FROM `sys_form_pre_values` AS `tv` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }
    
    function deleteValues($aParams)
    {
    	$aBindings = array();
        $sWhereClause = $sLimitClause = "";

        switch($aParams['type']) {
            case 'by_key':
            	$aBindings['key'] = $aParams['value'];

                $sWhereClause = " AND `tv`.`Key`=:key ";
                break;

            case 'all':
                break;
        }

        $sSql = "DELETE FROM `tv` USING `sys_form_pre_values` AS `tv` WHERE 1 " . $sWhereClause . " " . $sLimitClause;
        return $this->query($sSql, $aBindings) !== false;
    }

    function getValuesOrderMax($sKey)
    {
        $sSql = $this->prepare("SELECT MAX(`Order`) FROM `sys_form_pre_values` WHERE `Key`=? LIMIT 1", $sKey);
        return (int)$this->getOne($sSql);
    }

    function getSearchForms($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tf`.`title` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['id']
                );

                $sWhereClause = " AND `tf`.`id`=:id ";
                break;

            case 'by_module':
            	$aMethod['params'][1] = array(
                	'module' => $aParams['module']
                );

                $sWhereClause = "AND `tf`.`module`=:module";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tf`.`module`";

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tf`.*" . $sSelectClause . "
            FROM `sys_objects_search_extended` AS `tf` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function getSearchFields($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sFromClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tfld`.`order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['id']
                );

                $sWhereClause = " AND `tfld`.`id`=:id ";
                break;

            case 'by_object':
            	$aMethod['params'][1] = array(
                	'object' => $aParams['object']
                );

                $sWhereClause = "AND `tfld`.`object`=:object";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tfld`.`module`";
                $sOrderClause = "";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . " 
            	`tfld`.*" . $sSelectClause . "
            FROM `sys_search_extended_fields` AS `tfld` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }
    
    function getSortableFields($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sFromClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tfld`.`order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['id']
                );

                $sWhereClause = " AND `tfld`.`id`=:id ";
                break;

            case 'by_object':
            	$aMethod['params'][1] = array(
                	'object' => $aParams['object']
                );

                $sWhereClause = "AND `tfld`.`object`=:object";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tfld`.`module`";
                $sOrderClause = "";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . " 
            	`tfld`.*" . $sSelectClause . "
            FROM `sys_search_extended_sorting_fields` AS `tfld` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function alterAdd($sTable, $sField, $sType)
    {
        if($this->isFieldExists($sTable, $sField))
            return true;

        return (int)$this->query("ALTER TABLE `" . $sTable . "` ADD `" . $sField . "` " . $sType) > 0;
    }

    function alterChange($sTable, $sFieldOld, $sFieldNew, $sTypeNew)
    {
        if(!$this->isFieldExists($sTable, $sFieldOld))
            return false;

        if(strcmp($sFieldOld, $sFieldNew) !== 0 && $this->isFieldExists($sTable, $sFieldNew))
            return false;

        return (int)$this->query("ALTER TABLE `" . $sTable . "` CHANGE `" . $sFieldOld . "` `" . $sFieldNew . "` " . $sTypeNew) > 0;
    }

    function alterRemove($sTable, $sField)
    {
        if(!$this->isFieldExists($sTable, $sField))
            return true;

        return (int)$this->query("ALTER TABLE `" . $sTable . "` DROP `" . $sField . "`") > 0;
    }
}

/** @} */
