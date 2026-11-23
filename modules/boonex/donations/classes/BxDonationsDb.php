<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Donations Donations
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDonationsDb extends BxDolModuleDb
{
    protected $_oConfig;

    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_oConfig = $oConfig;
    }

    public function getTypeById($iId)
    {
        return $this->getTypes(array('type' => 'by_id', 'value' => $iId));
    }

    public function getTypes($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`tt`.*";
        $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause .= "AND `tt`.`id`=:id";
                break;

            case 'by_name':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'name' => $aParams['value']
                );

                $sWhereClause .= "AND `tt`.`name`=:name";
                break;

            case 'by_duration_amount':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'period' => $aParams['period'],
                    'period_unit' => $aParams['period_unit'],
                    'amount' => $aParams['amount'],
                );

                $sWhereClause .= "AND `tt`.`period`=:period AND `tt`.`period_unit`=:period_unit AND `tt`.`amount`=:amount";
                break;
            
            case 'by_btype_single':
            case 'by_btype_recurring':
                $aMethod['params'][1] = array(
                    'period' => 0,
                );

                $sWhereClause .= "AND `tt`.`period`" . ($aParams['type'] == 'by_btype_single' ? '=' : '<>') . ":period AND `tt`.`custom`='0'";

                if(isset($aParams['active'])) {
                    $aMethod['params'][1]['active'] = (int)$aParams['active'];

                    $sWhereClause .= " AND `tt`.`active`=:active";
                }

                $sOrderClause = "`tt`.`order` ASC";
                break;

            case 'conditions':
                if(empty($aParams['conditions']))
                    break;

                if(is_array($aParams['conditions']))
                    $sWhereClause .= $this->arrayToSQL($aParams['conditions'], ' AND ');
                else if(is_string($aParams['conditions']) && !empty($aParams['bindings']) && is_array($aParams['bindings'])) {
                    $sWhereClause .= $aParams['conditions'];
                    
                    if(!is_array($aMethod['params'][1]))
                        $aMethod['params'][1] = array();

                    $aMethod['params'][1] = array_merge($aMethod['params'][1], $aParams['bindings']);
                }
                break;

            case 'all':
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = ' ORDER BY ' . $sOrderClause;

        if(!empty($sLimitClause))
            $sLimitClause = ' LIMIT ' . $sLimitClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_TYPES'] . "` AS `tt` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sOrderClause . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getTypeOrderMax()
    {
        $CNF = &$this->_oConfig->CNF;

        return (int)$this->getOne("SELECT MAX(`order`) FROM `" . $CNF['TABLE_TYPES'] . "` WHERE 1");
    }

    public function insertType($aSet)
    {
        $CNF = &$this->_oConfig->CNF;

        return (int)$this->query("INSERT INTO `" . $CNF['TABLE_TYPES'] . "` SET " . $this->arrayToSQL($aSet)) > 0 ? $this->lastId() : false;
    }

    public function deleteTypes($aWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_TYPES'] . "` WHERE " . $this->arrayToSQL($aWhere, " AND ")) > 0;
    }

    public function registerEntry($iProfileId, $aTypeId, $iCount, $sOrder, $sLicense)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iProcessed = 0;
        for($i = 0; $i < $iCount; $i++) {
            $aQueryParams = array(
                'profile_id' => $iProfileId,
                'type_id' => $aTypeId,
                'order' => $sOrder,
                'license' => $sLicense
            );

            if((int)$this->query("INSERT INTO `" . $CNF['TABLE_ENTRIES'] . "` SET " . $this->arrayToSQL($aQueryParams) . ", `added`=UNIX_TIMESTAMP()") == 0)
                continue;

            $iProcessed += 1;
        }

        return $iCount == $iProcessed;
    }

    public function unregisterEntry($iProfileId, $aTypeId, $sOrder, $sLicense)
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = array(
            'profile_id' => $iProfileId,
            'type_id' => $aTypeId,
            'order' => $sOrder,
            'license' => $sLicense
    	);

    	$sWhereClause = "`profile_id`=:profile_id AND `type_id`=:type_id AND `order`=:order AND `license`=:license";

        //--- Move to deleted entries table with 'refund' as reason.
    	$sQuery = "INSERT IGNORE INTO `" . $CNF['TABLE_ENTRIES_DELETED'] . "` SELECT *, 'refund' AS `reason`, UNIX_TIMESTAMP() AS `deleted` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE " . $sWhereClause;
        $this->query($sQuery, $aBindings);

    	$sQuery = "DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE " . $sWhereClause;
        return $this->query($sQuery, $aBindings) !== false;
    }
}

/** @} */
