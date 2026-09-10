<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * @see BxDolCategories
 */
class BxDolBadgesQuery extends BxDolDb
{
    protected $_sTableBadges;
    protected $_sTableCategories;

    public function __construct()
    {
    	parent::__construct();

        $this->_sTableBadges = 'sys_badges';
    }

    public function getData($aParams = array(), &$aItems = false)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`sc`.*";
        $sJoinClause = $sWhereClause = $sGroupClause = $sLimitClause = "";
        $sOrderClause = "`sc`.`added` ASC";

        if(isset($aParams['count_only']) && $aParams['count_only'] === true) {
            $aMethod['name'] = 'getOne';
            $sSelectClause = "COUNT(`sc`.`id`)";
        }

        switch($aParams['type']) {
            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = "`sc`.`module` AS `module`, COUNT(`sc`.`id`) AS `counter`";
                $sJoinClause = "LEFT JOIN `sys_badges2objects` `soc` ON `sc`.`id` =  `soc`.`badge_id`";
                $sGroupClause = "`sc`.`module`";
                break;
              
            case 'by_module&object':
                $aMethod['name'] = 'getAll';
                $sSelectClause = "`sc`.`id`, `sc`.`id`, `sc`.`text`, `sc`.`color`, `sc`.`fontcolor`, `sc`.`is_icon_only`, `sc`.`icon`, `soc`.`id` AS `badge_id`";
                $sJoinClause = "LEFT JOIN `sys_badges2objects` `soc` ON `sc`.`id` =  `soc`.`badge_id` AND `soc`.`object_id` = :object_id";
                $sWhereClause = " AND `sc`.`module` = :module";
                $aMethod['params'][1] = array(
                    'object_id' => $aParams['object_id'],
                    'module' => $aParams['module']
                );
                break;
                
            case 'by_module&object2':
                $aMethod['name'] = 'getAll';
                $sSelectClause = "`sc`.`id`, `sc`.`id`, `sc`.`text`, `sc`.`color`, `sc`.`fontcolor`, `sc`.`is_icon_only`, `sc`.`icon`, `soc`.`id` AS `badge_id`";
                $sJoinClause = "INNER JOIN `sys_badges2objects` `soc` ON `sc`.`id` =  `soc`.`badge_id` AND `soc`.`object_id` = :object_id";
                $sWhereClause = " AND `sc`.`module` = :module";
                $aMethod['params'][1] = array(
                    'object_id' => $aParams['object_id'],
                    'module' => $aParams['module']
                );
                break;
                
            case 'by_module&object2_single':
                $aMethod['name'] = 'getAll';
                $sSelectClause = "`sc`.`id`, `sc`.`id`, `sc`.`text`, `sc`.`color`, `sc`.`fontcolor`, `sc`.`is_icon_only`, `sc`.`icon`, `soc`.`id` AS `badge_id`";
                $sJoinClause = "INNER JOIN `sys_badges2objects` `soc` ON `sc`.`id` =  `soc`.`badge_id` AND `soc`.`object_id` = :object_id";
                $sWhereClause = " AND `sc`.`module` = :module";
                $sLimitClause = "LIMIT 0, 1";
                $aMethod['params'][1] = array(
                    'object_id' => $aParams['object_id'],
                    'module' => $aParams['module']
                );
                break;
                
            case 'by_module&object&badge':
                $aMethod['name'] = 'getAll';
                $sSelectClause = "`sc`.`id`, `sc`.`id`, `sc`.`text`, `sc`.`icon`, `soc`.`id` AS `badge_id`";
                $sJoinClause = "INNER JOIN `sys_badges2objects` `soc` ON `sc`.`id` =  `soc`.`badge_id` AND `soc`.`object_id` = :object_id";
                $sWhereClause = " AND `sc`.`module` = :module  AND `sc`.`id` = :badge_id";
                $aMethod['params'][1] = array(
                    'object_id' => $aParams['object_id'],
                    'badge_id' => $aParams['badge_id'],
                    'module' => $aParams['module']
                );
                break;
                
            case 'by_module&badge':
                $aMethod['name'] = 'getColumn';
                $sSelectClause = "`soc`.`object_id`";
                $sJoinClause = "INNER JOIN `sys_badges2objects` `soc` ON `sc`.`id` =  `soc`.`badge_id` ";
                $sWhereClause = " AND `sc`.`module` = :module  AND `sc`.`id` = :badge_id";
                $aMethod['params'][1] = array(
                    'badge_id' => $aParams['badge_id'],
                    'module' => $aParams['module']
                );
                break;
                
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `sc`.`id` = :id";
                break;
            
            case 'by_module':
                $aMethod['name'] = 'getAll';
                $sWhereClause = " AND `sc`.`module` = :module";
                $aMethod['params'][1] = array(
                    'module' => $aParams['module']
                );
                break;
        }

        if(!empty($sGroupClause))
            $sGroupClause = "GROUP BY " . $sGroupClause;

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " 
            FROM `" . $this->_sTableBadges . "` AS `sc`" . $sJoinClause . " 
            WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause. " " . $sLimitClause;
        $oRv = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
        if ($aItems === false)
            return $oRv;
        $aItems = $oRv;   
    }
    
    function update($iId, $aFields)
    {
        $sSql = "UPDATE `sys_badges` SET `" . implode("`=?, `", array_keys($aFields)) . "`=?  WHERE `id`=?";
        $sSql = call_user_func_array(array($this, 'prepare'), array_merge(array($sSql), array_values($aFields), array($iId)));
        return $this->query($sSql);
    }
    
    function add($iBadgeId, $iObjectId, $sModule)
    {
        $sSql = "INSERT `sys_badges2objects` (`badge_id`, `object_id`, `added`, `module`) VALUES (:badge_id, :object_id, :added, :module)";
        $aBindings = array(
            'badge_id' => $iBadgeId,
            'object_id' => $iObjectId,
            'added' => time(),
            'module' => $sModule,
        );
        return $this->query($sSql, $aBindings);
    }
    
    public function delete($aParams = array())
    {
        switch($aParams['type']) {
            case 'id':
                $sQuery = " WHERE `badge_id` = :badge_id";
                $aBindings = array(
                    'badge_id' => $aParams['id'],
                );
                break;
                
            case 'by_module&object':
                $sQuery = " WHERE `module` = :module AND object_id = :object_id";
                $aBindings = array(
                    'module' => $aParams['module'],
                    'object_id' => $aParams['object_id'],
                );
                break;
                
            case 'by_module':
                $sQuery = " WHERE `module` = :module";
                $aBindings = array(
                    'module' => $aParams['module'],
                );
                break;
                
            case 'by_module&object&badge':   
                $sQuery = " WHERE `module` = :module AND object_id = :object_id AND badge_id = :badge_id";
                $aBindings = array(
                    'module' => $aParams['module'],
                    'object_id' => $aParams['object_id'],
                    'badge_id' => $aParams['badge_id'],
                );
                break;
        }

        if(!$sQuery)
            return;

        $this->query("DELETE FROM `sys_badges2objects`" . $sQuery, $aBindings);

        if($aParams['type'] == 'by_module')
            $this->query("DELETE FROM `sys_badges`" . $sQuery, $aBindings);
    }
}

/** @} */
