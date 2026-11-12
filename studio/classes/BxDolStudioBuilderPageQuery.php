<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioBuilderPageQuery extends BxDolStudioPageQuery
{
    function __construct()
    {
        parent::__construct();
    }

    public function insertPage ($sObj, $sModule, $sUri, $sUrl, $sTitleLangKey, $iType = 1, $iLayoutId = 5, $iVisibleForLevels = 2147483647, $sClass = '', $sClassFile = '')
    {
        $b = $this->query('INSERT INTO `sys_objects_page` SET
            `author` = :author,
            `added` = :added,
            `object` = :obj,
            `uri` = :uri,
            `title` = :title,
            `module` = :module,
            `cover` = :cover,
            `type_id` = :type,
            `layout_id` = :layout,
            `visible_for_levels` = :levels, 
            `visible_for_levels_editable` = 1,
            `url` = :url,
            `cache_lifetime` = 0,
            `cache_editable` = 1,
            `deletable` = 1,
            `override_class_name` = :class,
            `override_class_file` = :file
        ', array(
            'author' => bx_get_logged_profile_id(),
            'added' => time(),
            'obj' => $sObj,
            'uri' => $sUri,
            'title' => $sTitleLangKey,
            'module' => $sModule,
            'cover' => 0,
            'type' => $iType,
            'layout' => $iLayoutId,
            'levels' => $iVisibleForLevels,
            'url' => $sUrl,
            'class' => $sClass,
            'file' => $sClassFile,
        ));
        if (!$b)
            return false;

        return $this->lastId();
    }

    function getPages($aParams)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = "
            `tp`.`id` AS `id`,
            `tp`.`object` AS `object`,
            `tp`.`uri` AS `uri`,
            `tp`.`title_system` AS `title_system`,
            `tp`.`title` AS `title`,
            `tp`.`module` AS `module`,
            `tp`.`cover` AS `cover`,
            `tp`.`cover_image` AS `cover_image`,
            `tp`.`cover_title` AS `cover_title`,
            `tp`.`cover_hidden_on` AS `cover_hidden_on`,
            `tp`.`type_id` AS `type_id`,
            `tp`.`layout_id` AS `layout_id`,
            `tp`.`submenu` AS `submenu`,
            `tp`.`visible_for_levels` AS `visible_for_levels`,
            `tp`.`visible_for_levels_editable` AS `visible_for_levels_editable`,
            `tp`.`url` AS `url`,
            `tp`.`meta_title` AS `meta_title`,
            `tp`.`meta_description` AS `meta_description`,
            `tp`.`meta_keywords` AS `meta_keywords`,
            `tp`.`meta_robots` AS `meta_robots`,
            `tp`.`cache_lifetime` AS `cache_lifetime`,
            `tp`.`cache_editable` AS `cache_editable`,
            `tp`.`inj_head` AS `inj_head`,
            `tp`.`inj_footer` AS `inj_footer`,
            `tp`.`sticky_columns` AS `sticky_columns`,
            `tp`.`config_api` AS `config_api`,
            `tp`.`deletable` AS `deletable`,
            `tp`.`override_class_name` AS `override_class_name`,
            `tp`.`override_class_file` AS `override_class_file`";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "`tp`.`object` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = " AND `tp`.`id`=:id ";
                break;
            case 'by_object':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sWhereClause = " AND `tp`.`object`=:object ";
                break;

            case 'by_uri':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'uri' => $aParams['value']
                );

                $sWhereClause = " AND `tp`.`uri`=:uri ";
                break;

            case 'by_object_full':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sSelectClause .= ", `tpl`.`name` AS `layout_name`, `tpl`.`icon` AS `layout_icon`, `tpl`.`title` AS `layout_title`, `tpl`.`template` AS `layout_template`, `tpl`.`cells_number` AS `layout_cells_number`";
                $sJoinClause = "LEFT JOIN `sys_pages_layouts` AS `tpl` ON `tp`.`layout_id`=`tpl`.`id`";
                $sWhereClause = " AND `tp`.`object`=:object ";
                break;

            case 'by_module':
            	$aMethod['params'][1] = array(
                    'module' => $aParams['value']
                );

                $sWhereClause = " AND `tp`.`module`=:module ";
                break;

            case 'modules_with_pages':
                $sSelectClause = "DISTINCT `tm`.*";
                $sJoinClause = "INNER JOIN `sys_modules` AS `tm` ON `tp`.`module`=`tm`.`name`";
                $sWhereClause = " AND `tm`.`enabled`='1'";
                $sOrderClause = "`tm`.`title` ASC";
                break;

            case 'export':
                $sSelectClause = "`tp`.*";
                break;

            case 'all':
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . "
            FROM `sys_objects_page` AS `tp` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    function isPageExists($sObject)
    {
        $aPage = $this->getPages(['type' => 'by_object', 'value' => $sObject]);
        return !empty($aPage) && is_array($aPage);
    }

    function addPage($aFields)
    {
        $sSql = "INSERT INTO `sys_objects_page` SET `" . implode("`=?, `", array_keys($aFields)) . "`=?";
        $sSql = call_user_func_array(array($this, 'prepare'), array_merge(array($sSql), array_values($aFields)));
        return (int)$this->query($sSql) > 0 ? $this->lastId() : 0;
    }

    function updatePage($iId, $aFields)
    {
        $sSql = "UPDATE `sys_objects_page` SET `" . implode("`=?, `", array_keys($aFields)) . "`=?  WHERE `id`=?";
        $sSql = call_user_func_array(array($this, 'prepare'), array_merge(array($sSql), array_values($aFields), array($iId)));
        return $this->query($sSql);
    }
    
    function updatePageByObject($sObject, $aFields)
    {
        return $this->query("UPDATE `sys_objects_page` SET " . $this->arrayToSQL($aFields) . " WHERE `object`=:object", [
            'object' => $sObject
        ]);
    }

    function deletePages($aParams)
    {
    	$aBindings = array();
        $sWhereClause = "";

        switch($aParams['type']) {
            case 'by_id':
            	$aBindings = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = "AND `tp`.`id`=:id ";
                break;

            case 'by_object':
            	$aBindings = array(
                	'object' => $aParams['value']
                );

                $sWhereClause = "AND `tp`.`object`=:object ";
                break;

            case 'all':
                break;
        }

        $sSql = "DELETE FROM `tp` USING `sys_objects_page` AS `tp` WHERE 1 " . $sWhereClause;
        return (int)$this->query($sSql, $aBindings) > 0;
    }

    function isUniqUri($sUri)
    {
        $sSql = $this->prepare("SELECT `id` FROM `sys_objects_page` WHERE `uri`=? LIMIT 1", $sUri);
        return (int)$this->getOne($sSql) <= 0;
    }

	function getTypes($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tpt`.`id` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = "AND `tpt`.`id`=:id ";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tpt`.`id` AS `id`,
                `tpt`.`title` AS `title`,
                `tpt`.`template` AS `template`,
                `tpt`.`order` AS `order`" . $sSelectClause . "
            FROM `sys_pages_types` AS `tpt` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function getContentPlaceholders()
    {
        return $this->getPairs('SELECT `id`, `title` FROM `sys_pages_content_placeholders` ORDER BY `order`', 'id', 'title');
    }

    function getSubmenus($mixedTemplateIds = 8)
    {
        if(!is_array($mixedTemplateIds))
            $mixedTemplateIds = array($mixedTemplateIds);

        return BxDolDb::getInstance()->getPairs('SELECT `object`, `title` FROM `sys_objects_menu` WHERE `template_id` IN (' . $this->implode_escape($mixedTemplateIds) . ')', 'object', 'title');
    }

    function getBlockSubmenus($mixedTemplateIds = array(25, 26))
    {
        if(!is_array($mixedTemplateIds))
            $mixedTemplateIds = array($mixedTemplateIds);
        
        return BxDolDb::getInstance()->getPairs('SELECT `object`, `title` FROM `sys_objects_menu` WHERE `template_id` IN (' . $this->implode_escape($mixedTemplateIds) . ')', 'object', 'title');
    }

    function getLayouts($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tpl`.`id` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = "AND `tpl`.`id`=:id ";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tpl`.`id` AS `id`,
                `tpl`.`name` AS `name`,
                `tpl`.`icon` AS `icon`,
                `tpl`.`title` AS `title`,
                `tpl`.`template` AS `template`,
                `tpl`.`cells_number` AS `cells_number`" . $sSelectClause . "
            FROM `sys_pages_layouts` AS `tpl` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function getDesignBoxes($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tpd`.`order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = "AND `tpd`.`id`=:id ";
                break;

            case 'ordered':
                $sWhereClause = "AND `tpd`.`order`<>0 ";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tpd`.`id` AS `id`,
                `tpd`.`title` AS `title`,
                `tpd`.`template` AS `template`" . $sSelectClause . "
            FROM `sys_pages_design_boxes` AS `tpd` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function getModulesWithCopyableBlocks()
    {
        $aTypes = [BX_DOL_MODULE_TYPE_MODULE, BX_DOL_MODULE_TYPE_TEMPLATE];

    	$sSql = $this->prepare("SELECT
                `tm`.`name` AS `module`
            FROM `sys_modules` AS `tm`
            LEFT JOIN `sys_pages_blocks` AS `tpb` ON `tm`.`name`=`tpb`.`module`
            WHERE `tm`.`type` IN (" . $this->implode_escape($aTypes) . ") AND `tpb`.`copyable`=?
            GROUP BY `tm`.`name`", 1);
    	return $this->getColumn($sSql);
    }

    function getBlocks($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = "
            `tpb`.`id` AS `id`,
            `tpb`.`object` AS `object`,
            `tpb`.`cell_id` AS `cell_id`,
            `tpb`.`module` AS `module`,
            `tpb`.`title_system` AS `title_system`,
            `tpb`.`title` AS `title`,
            `tpb`.`description` AS `description`,
            `tpb`.`icon` AS `icon`,
            `tpb`.`header_icon` AS `header_icon`,
            `tpb`.`designbox_id` AS `designbox_id`,
            `tpb`.`class` AS `class`,
            `tpb`.`async` AS `async`,
            `tpb`.`cache_lifetime` AS `cache_lifetime`,
            `tpb`.`submenu` AS `submenu`,
            `tpb`.`tabs` AS `tabs`,
            `tpb`.`hidden_on` AS `hidden_on`,
            `tpb`.`title_hidden_on` AS `title_hidden_on`,
            `tpb`.`bg_hidden_on` AS `bg_hidden_on`,
            `tpb`.`padding_hidden_on` AS `padding_hidden_on`,
            `tpb`.`visible_for_levels` AS `visible_for_levels`,
            `tpb`.`type` AS `type`,
            `tpb`.`content` AS `content`,
            `tpb`.`content_empty` AS `content_empty`,
            `tpb`.`help` AS `help`,
            `tpb`.`config_api` AS `config_api`,
            `tpb`.`deletable` AS `deletable`,
            `tpb`.`copyable` AS `copyable`,
            `tpb`.`active` AS `active`,
            `tpb`.`active_api` AS `active_api`,
            `tpb`.`order` AS `order`
        ";
        $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tpb`.`order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`id`=:id ";
                break;
            
            case 'by_fields':
                $aMethod['name'] = 'getRow';

                $sWhereClause = "AND " . $this->arrayToSQL($aParams['fields'], ' AND ');
                break;

            case 'skeleton_by_type':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'module' => BX_DOL_STUDIO_BP_SKELETONS,
                    'type' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`object`='' AND `tpb`.`module`=:module AND `tpb`.`type`=:type ";
                break;

            case 'by_ids':
                $sWhereClause = "AND `tpb`.`id` IN (" . $this->implode_escape($aParams['value']) . ")";
                break;

            case 'by_object':
            	$aMethod['params'][1] = array(
                    'object' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`object`=:object";
                break;
            
            case 'export_by_object':
                $aMethod['params'][1] = [
                    'object' => $aParams['value']
                ];

                $sSelectClause = "`tpb`.*";
                $sWhereClause = "AND `tpb`.`object`=:object";
                break;

            case 'by_object_cell':
            	$aMethod['params'][1] = array(
                    'object' => $aParams['object'],
                    'cell_id' => $aParams['cell']
                );

                $sWhereClause = "AND `tpb`.`object`=:object AND `tpb`.`cell_id`=:cell_id";
                break;

            case 'by_module_to_copy':
            	$aMethod['params'][1] = array(
                    'module' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`module`=:module AND `tpb`.`copyable`=1";

                if($aParams['value'] == BX_DOL_STUDIO_BP_SKELETONS)
                    $sWhereClause .= " AND `tpb`.`object`=''";
                break;

            case 'counter_by_pages':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'object';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tpb`.`object`";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . $sSelectClause . "
            FROM `sys_pages_blocks` AS `tpb` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function isBlockExists($aFields)
    {
        $aBlock = [];
        $this->getBlocks(['type' => 'by_fields', 'fields' => $aFields], $aBlock, false);

        return !empty($aBlock) && is_array($aBlock);
    }
            
    function insertBlock($aData)
    {
        if(!isset($aData['order']))
            $aData['order'] = $this->getBlockOrderMax($aData['object']) + 1;

        return $this->query("INSERT INTO `sys_pages_blocks` SET " . $this->arrayToSQL($aData)) ? $this->lastId() : false;
    }

    function updateBlock($iId, $aData)
    {
        return $this->query("UPDATE `sys_pages_blocks` SET " . $this->arrayToSQL($aData) . " WHERE `id`=:id", [
            'id' => $iId
        ]) ? true : false;
    }
    
    function updateBlockByFields($aFields, $aData)
    {
        return $this->query("UPDATE `sys_pages_blocks` SET " . $this->arrayToSQL($aData) . " WHERE " . $this->arrayToSQL($aFields, ' AND ')) ? true : false;
    }
    
    function updateBlocks($aParamsSet, $aParamsWhere = [])
    {
        if(empty($aParamsSet))
            return false;

        $sWhereClause = "1";
        if(!empty($aParamsWhere))
            $sWhereClause = $this->arrayToSQL($aParamsWhere, " AND ");

        return $this->query("UPDATE `sys_pages_blocks` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $sWhereClause);
    }

    function deleteBlocks($aParams)
    {
    	$aBindings = array();
        $sWhereClause = "";
        $aBlockIds = array();
        switch($aParams['type']) {
            case 'by_id':
            	$aBindings = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`id`=:id ";
                $aBlockIds[] = $aParams['value'];
                break;

            case 'by_object':
            	$aBindings = array(
                	'object' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`object`=:object ";
                $aBlockIds = $this->getColumn("SELECT `id` FROM `sys_pages_blocks` AS `tpb` WHERE 1 " . $sWhereClause, $aBindings);
                break;

            default:
                return false;
        }

        $sSql = "DELETE FROM `tpb` USING `sys_pages_blocks` AS `tpb` WHERE 1 " . $sWhereClause;
        $b = ((int)$this->query($sSql, $aBindings) > 0);
        if ($b && $aBlockIds)
            BxDolWiki::onBlockDelete($aBlockIds);
        return $b;
    }

    function resetBlocksByPage($sObject, $iCellId, $bDeactivate = false)
    {
        $aSetClause = array('cell_id' => 0);
        if($bDeactivate)
            $aSetClause['active'] = 0;

        return $this->query("UPDATE `sys_pages_blocks` SET " . $this->arrayToSQL($aSetClause) . " WHERE `object`=:object AND `cell_id`>:cell_id", array(
            'object' => $sObject,
            'cell_id' => $iCellId
        ));
    }

    function getBlockOrderMax($sObject, $iCellId = 1)
    {
        $sSql = $this->prepare("SELECT MAX(`order`) FROM `sys_pages_blocks` WHERE `object`=? AND `cell_id`=? LIMIT 1", $sObject, $iCellId);
        return (int)$this->getOne($sSql);
    }

    function deleteImage($aParams)
    {
        $sWhereClause = "";

        switch($aParams['type']) {
            case 'by_id':
            	$aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = "AND `tpb`.`id`=:id ";
                break;

            case 'all':
                break;
        }

        $sSql = "DELETE FROM `tpb` USING `sys_pages_blocks` AS `tpb` WHERE 1 " . $sWhereClause;
        return (int)$this->query($sSql) > 0;
    }

    function getMenus($bFull = false)
    {
        $sSql = "SELECT * FROM `sys_objects_menu` WHERE 1 ORDER BY `module`, `object`";
        if($bFull)
            return $this->getAllWithKey($sSql, 'object');
        else
            return $this->getPairs($sSql, 'object', 'title');
    }
}

/** @} */
