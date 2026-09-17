<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for Connection objects.
 * @see BxDolConnection
 */
class BxDolConnectionQuery extends BxDolDb
{
    protected $_aObject;
    protected $_sTable;
    protected $_sType;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
        $this->_sTable = $aObject['table'];
        $this->_sType = $aObject['type'];
    }

    static public function getConnectionObject ($sObject)
    {
        $a = BxDolDb::getInstance()->fromCache('sys_objects_connection', 'getAllWithKey', "SELECT * FROM `sys_objects_connection`", 'object');
        if ($a && isset($a[$sObject]))
            return $a[$sObject];
        return false;
    }

    public function getCommonContentSQLParts ($sContentTable, $sContentField, $iInitiator1, $iInitiator2, $isMutual = false)
    {
        $sWhereJoin1 = $this->prepareAsString(" AND `c`.`initiator` = ?", $iInitiator1);
        $sWhereJoin2 = $this->prepareAsString(" AND `c2`.`initiator` = ?", $iInitiator2);
        if (false !== $isMutual) {
            $sWhereJoin1 .= $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual);
            $sWhereJoin2 .= $this->prepareAsString(" AND `c2`.`mutual` = ?", $isMutual);
        }

        $sJoin = "";
        if($this->_aObject['profile_content'])
            $sJoin = " INNER JOIN `sys_profiles` AS `cp1` ON (`cp1`.`id` = `c`.`content` AND `cp1`.`status` = 'active') INNER JOIN `sys_profiles` AS `cp2` ON (`cp2`.`id` = `c2`.`content` AND `cp2`.`status` = 'active')";

        return [
            'join' => "INNER JOIN `{$this->_sTable}` AS `c` ON (`c`.`content` = `$sContentTable`.`$sContentField` $sWhereJoin1) INNER JOIN `{$this->_sTable}` AS `c2` ON (`c2`.`content` = `c`.`content` $sWhereJoin2)" . $sJoin,
        ];
    }

    public function getConnectedContentSQLParts ($sContentTable, $sContentField, $iInitiator, $isMutual = false)
    {
        $aResult = $this->getConnectedContentSQLPartsExt($sContentTable, $sContentField, $iInitiator, $isMutual);

        $aFields = [];
        foreach($aResult['fields'] as $sFieldAlias => $aField)
            $aFields[$sFieldAlias] = "`" . $aField['table_alias'] . "`.`" . $aField['name'] . "`";

        $sJoin = "";
        if($this->_aObject['profile_content']) 
            $sJoin = " INNER JOIN `sys_profiles` AS `cp` ON (`cp`.`id` = `{$aResult['join']['table_alias']}`.`content` AND `cp`.`status` = 'active')";

        return [
            'fields' => $aFields,
            'join' => $aResult['join']['type'] . " JOIN `" . $aResult['join']['table'] . "` AS `" . $aResult['join']['table_alias'] . "` ON (" . $aResult['join']['condition'] . ")" . $sJoin,
        ];
    }

    public function getConnectedContentSQLPartsExt ($sContentTable, $sContentField, $iInitiator, $isMutual = false)
    {
        $sWhere = $this->prepareAsString(" AND `c`.`initiator` = ?", $iInitiator);
        if(false !== $isMutual)
            $sWhere .= $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual);

        return array(
            'fields' => array(
                'added' => array('table_alias' => 'c', 'name' => 'added')
            ),
            'join' => array(
                'type' => 'INNER',
                'table' => $this->_sTable,
                'table_alias' => 'c',
            	'condition' => "`c`.`content` = `" . $sContentTable . "`.`" . $sContentField . "`" . $sWhere
            )
        );
    }

    public function getConnectedContentSQLPartsMultiple ($sContentTable, $sContentField, $sInitiatorTable, $sInitiatorField, $isMutual = false)
    {
        $sOn = "";
        if (false !== $isMutual)
            $sOn .= $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual);
        return array(
            'join' => "INNER JOIN `{$this->_sTable}` AS `c` ON (`c`.`content` = `$sContentTable`.`$sContentField` $sOn)",
        	'where' => " AND `c`.`initiator` = `$sInitiatorTable`.`$sInitiatorField`"
        );
    }

    public function getConnectedInitiatorsSQLParts ($sInitiatorTable, $sInitiatorField, $iContent, $isMutual = false)
    {
        $aResult = $this->getConnectedInitiatorsSQLPartsExt($sInitiatorTable, $sInitiatorField, $iContent, $isMutual);

        $sJoin = '';
        if($this->_aObject['profile_initiator'])
            $sJoin = " INNER JOIN `sys_profiles` AS `cp` ON (`cp`.`id` = `{$aResult['join']['table_alias']}`.`initiator` AND `cp`.`status` = 'active')";

        return [
            'join' => $aResult['join']['type'] . " JOIN `" . $aResult['join']['table'] . "` AS `" . $aResult['join']['table_alias'] . "` ON (" . $aResult['join']['condition'] . ")" . $sJoin,
        ];
    }

    public function getConnectedInitiatorsSQLPartsExt ($sInitiatorTable, $sInitiatorField, $iContent, $isMutual = false)
    {
        $sWhere = $this->prepareAsString(" AND `c`.`content` = ?", $iContent);
        if(false !== $isMutual)
            $sWhere .= $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual);

        return array(
            'join' => array(
                'type' => 'INNER',
        		'table' => $this->_sTable,
                'table_alias' => 'c',
        		'condition' => "`c`.`initiator` = `" . $sInitiatorTable . "`.`" . $sInitiatorField . "`" . $sWhere
            )
        );
    }

    public function getConnectedInitiatorsSQLPartsMultiple ($sInitiatorTable, $sInitiatorField, $sContentTable, $sContentField, $isMutual = false)
    {
        $sOn = "";
        if(false !== $isMutual)
            $sOn .= $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual);

        return array(
            'join' => "INNER JOIN `{$this->_sTable}` AS `c` ON (`c`.`initiator` = `$sInitiatorTable`.`$sInitiatorField` $sOn)",
            'where' => " AND `c`.`content` = `$sContentTable`.`$sContentField`"
        );
    }

    public function getCommonContent($iInitiator1, $iInitiator2, $isMutual, $iStart, $iLimit, $iOrder)
    {
        $aBindings = [
            'initiator1' => $iInitiator1,
            'initiator2' => $iInitiator2,  
    	];

        $sWhereJoin = "";
        if($isMutual !== false) {
            $aBindings['mutual'] = $isMutual;

            $sWhereJoin = " AND `c2`.`mutual` = :mutual";
        }

        $sJoin = "INNER JOIN `" . $this->_sTable . "` AS `c2` ON (`c2`.`initiator` = :initiator2 AND `c`.`content` = `c2`.`content` $sWhereJoin)";
        if($this->_aObject['profile_content'])
            $sJoin .= "INNER JOIN `sys_profiles` AS `p1` ON (`p1`.`id` = `c`.`content` AND `p1`.`status` = 'active') INNER JOIN `sys_profiles` AS `p2` ON (`p2`.`id` = `c2`.`content` AND `p2`.`status` = 'active')";

        $sWhere = " AND `c`.`initiator` = :initiator1";

        return $this->getColumn($this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`content`', $isMutual, $iStart, $iLimit, $iOrder), $aBindings);
    }

    public function getConnectedContent ($iInitiator, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sWhere = " AND `c`.`initiator` = :initiator";

        $sJoin = $this->_aObject['profile_content'] ? "INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`content` AND `p`.`status` = 'active'" : '';

        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`content`', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getColumn($sQuery, array(
        	'initiator' => $iInitiator
        ));
    }
    
    public function getConnectedContentByType ($iInitiator, $mixedType, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $mixedType = is_array($mixedType) ? $mixedType : array($mixedType);

        $sWhere = " AND `c`.`initiator` = :initiator";

        $sJoin = $this->_aObject['profile_content'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`content` AND `p`.`status` = \'active\' AND `p`.`type` IN (' . $this->implode_escape($mixedType) . ')' : '';

        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`content`', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getColumn($sQuery, array(
            'initiator' => $iInitiator,
        ));
    }
    
    public function getConnectedContentSince ($iInitiator, $iDate, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sWhere = " AND `c`.`initiator` = :initiator AND `c`.`added` >= :date";

        $sJoin = $this->_aObject['profile_content'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`content` AND `p`.`status` = \'active\'' : '';

        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`content`', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getColumn($sQuery, [
            'initiator' => $iInitiator,
            'date' => $iDate
        ]);
    }

    public function getConnectedInitiators ($iContent, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sWhere = " AND `c`.`content` = :content";

        $sJoin = $this->_aObject['profile_initiator'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`initiator` AND `p`.`status` = \'active\'' : ''; 

        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`initiator`', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getColumn($sQuery, array(
            'content' => $iContent
        ));
    }

    public function getConnectedInitiatorsByType ($iContent, $mixedType, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $mixedType = is_array($mixedType) ? $mixedType : array($mixedType);

        $sWhere = " AND `c`.`content` = :content";

        $sJoin = $this->_aObject['profile_initiator'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`initiator` AND `p`.`status` = \'active\' AND `p`.`type` IN (' . $this->implode_escape($mixedType) . ')' : ''; 

        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`initiator`', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getColumn($sQuery, array(
            'content' => $iContent,
        ));
    }

    public function getConnectedInitiatorsSince ($iContent, $iDate, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sWhere = " AND `c`.`content` = :content AND `c`.`added` >= :date";

        $sJoin = $this->_aObject['profile_initiator'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`initiator` AND `p`.`status` = \'active\'' : ''; 

        $sQuery = $this->_getConnectionsQuery($sWhere, $sJoin, '`c`.`initiator`', $isMutual, $iStart, $iLimit, $iOrder);

        return $this->getColumn($sQuery, [
            'content' => $iContent,
            'date' => $iDate
        ]);
    }

    protected function _getConnectionsQuery ($sWhere, $sJoin = '', $sFields = '*', $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $sOrder = $this->_getOrderClause($iOrder, '`c`');

        $sWhere .= (false !== $isMutual) ? $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual) : '';

        $sLimit = "";
        if($iLimit != BX_CONNECTIONS_LIST_NO_LIMIT)
            $sLimit = $this->prepareAsString("LIMIT ?, ?", $iStart, $iLimit);

        return "SELECT $sFields FROM `" . $this->_sTable . "` AS `c` $sJoin WHERE 1 $sWhere $sOrder $sLimit";
    }

    public function getCommonContentCount($iInitiator1, $iInitiator2, $isMutual)
    {
        $aBindings = [
            'initiator1' => $iInitiator1,
            'initiator2' => $iInitiator2
        ];

        $sWhereJoin = "";
        if($isMutual !== false) {
            $aBindings['mutual'] = $isMutual;

            $sWhereJoin = " AND `c2`.`mutual` = :mutual";
        }

        $sJoin = "INNER JOIN `" . $this->_sTable . "` AS `c2` ON (`c2`.`initiator` = :initiator2 AND `c`.`content` = `c2`.`content` $sWhereJoin)";
        if($this->_aObject['profile_content'])
            $sJoin .= "INNER JOIN `sys_profiles` AS `p1` ON (`p1`.`id` = `c`.`content` AND `p1`.`status` = 'active') INNER JOIN `sys_profiles` AS `p2` ON (`p2`.`id` = `c2`.`content` AND `p2`.`status` = 'active')";

        $sWhere = " AND `c`.`initiator` = :initiator1";

        return $this->getOne($this->_getConnectionsQueryCount($sWhere, $sJoin, $isMutual, '`c`.`content`'), $aBindings);
    }

    public function getConnectedContentCount ($iInitiator, $isMutual = false, $iFromDate = 0)
    {
        return $this->getConnectedContentCountExt($iInitiator, $isMutual, ['from_date' => $iFromDate]);
    }

    public function getConnectedContentCountExt ($iInitiator, $isMutual = false, $aParams = [])
    {
        $sJoin = $this->_aObject['profile_content'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`content` AND `p`.`status` = \'active\'' : ''; 
        $sWhere = $this->prepareAsString(" AND `c`.`initiator` = ?", $iInitiator);
        
        if(isset($aParams['from_date']) && ($iFromDate = (int)$aParams['from_date']) > 0)
            $sWhere .= $this->prepareAsString(" AND `c`.`added` > ?", $iFromDate);
        
        if(!empty($aParams['by_type']) && is_array($aParams['by_type']) && $this->_aObject['profile_content'])
            $sWhere .= " AND `p`.`type` IN (" . $this->implode_escape($aParams['by_type']) . ")";

        $sQuery = $this->_getConnectionsQueryCount($sWhere, $sJoin, $isMutual);
        return $this->getOne($sQuery);
    }

    public function getConnectedInitiatorsCount ($iContent, $isMutual = false)
    {
        $sJoin = $this->_aObject['profile_initiator'] ? 'INNER JOIN `sys_profiles` `p` ON `p`.`id` = `c`.`initiator` AND `p`.`status` = \'active\'' : ''; 
        $sWhere = $this->prepareAsString(" AND `c`.`content` = ?", $iContent);
        $sQuery = $this->_getConnectionsQueryCount($sWhere, $sJoin, $isMutual);
        return $this->getOne($sQuery);
    }

    protected function _getConnectionsQueryCount ($sWhere, $sJoin = '', $isMutual = false, $sFields = '`c`.`id`')
    {
        $sWhere .= (false !== $isMutual) ? $this->prepareAsString(" AND `c`.`mutual` = ?", $isMutual) : '';
        return "SELECT COUNT(" . $sFields . ") FROM `" . $this->_sTable . "` AS `c` $sJoin WHERE 1 $sWhere";
    }

    protected function _getOrderClause ($iOrder = BX_CONNECTIONS_ORDER_NONE, $sTable = '')
    {
        if ($sTable)
            $sTable .= '.';

        $sOrder = '';
        switch ($iOrder) {
            case BX_CONNECTIONS_ORDER_ADDED_ASC:
                $sOrder = "ORDER BY {$sTable}`added` ASC";
                break;
            case BX_CONNECTIONS_ORDER_ADDED_DESC:
                $sOrder = "ORDER BY {$sTable}`added` DESC";
                break;
        }

        return $sOrder;
    }

    public function getConnection ($iInitiator, $iContent)
    {
        $sQuery = $this->prepare("SELECT * FROM `" . $this->_sTable . "` WHERE `initiator` = ? AND `content` = ?", $iInitiator, $iContent);
        return $this->fromMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent, 'getRow', $sQuery);
    }

    public function getConnectionById ($iId)
    {
        $sQuery = $this->prepare("SELECT * FROM `" . $this->_sTable . "` WHERE `id` = ?", $iId);
        return $this->fromMemory('BxDolConnectionQuery::getConnectionById' . $this->_sTable . $iId, 'getRow', $sQuery);
    }

    public function addConnection ($iInitiator, $iContent, &$iMutualParam = null)
    {
        if ($this->getConnection($iInitiator, $iContent)) // connection already exists
            return false;

        $aBindings = [];

        $iMutual = 0;
        $sMutualField = '';
        if (BX_CONNECTIONS_TYPE_MUTUAL == $this->_sType) {
            $aConnectionMutual = $this->getConnection($iContent, $iInitiator);
            $iMutual = $aConnectionMutual ? 1 : 0;

            $sMutualField = ", `mutual` = :mutual";
            $aBindings['mutual'] = $iMutual;
        }

        $sQuery = $this->prepare("INSERT IGNORE INTO `" . $this->_sTable . "` SET `initiator` = :initiator, `content` = :content, `added` = :added" . $sMutualField);
        if (!$this->query($sQuery, array_merge($aBindings, array('initiator' => $iInitiator, 'content' => $iContent, 'added' => time()))))
            return false;

        $iId = $this->lastId();

        if ($iMutual) // in case of mutual connection update 'mutual' field
            $this->updateConnectionMutual($iContent, $iInitiator, $iMutual);

        if (null !== $iMutualParam)
            $iMutualParam = $iMutual;

        $this->cleanMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent);
        return $iId;
    }

    public function updateConnection ($iInitiator, $iContent, $aSet)
    {
        if(empty($aSet) || !is_array($aSet))
            return false;

        $sQuery = $this->prepare("UPDATE `" . $this->_sTable . "` SET " . $this->arrayToSQL($aSet) . " WHERE `initiator` = ? AND `content` = ?", $iInitiator, $iContent);
        if ($bResult = $this->query($sQuery))
            $this->cleanMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent);

        return $bResult;
    }

    public function updateConnectionMutual ($iInitiator, $iContent, $iMutual)
    {
        $sQuery = $this->prepare("UPDATE `" . $this->_sTable . "` SET `mutual` = ? WHERE `initiator` = ? AND `content` = ?", $iMutual, $iInitiator, $iContent);
        if ($bResult = $this->query($sQuery))
            $this->cleanMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent);
        return $bResult;
    }

    public function removeConnection ($iInitiator, $iContent)
    {
        if (!($aConnection = $this->getConnection($iInitiator, $iContent))) // connection doesn't exist
            return true;

        $sQuery = $this->prepare("DELETE FROM `" . $this->_sTable . "` WHERE `initiator` = ? AND `content` = ?", $iInitiator, $iContent);
        if (!$this->res($sQuery))
            return false;

        $this->cleanMemory('BxDolConnectionQuery::getConnection' . $this->_sTable . $iInitiator . '_' . $iContent);
        
        if (BX_CONNECTIONS_TYPE_MUTUAL == $this->_sType && $aConnection['mutual'])
            $this->removeConnection($iContent, $iInitiator);

        return true;
    }

    public function onDelete ($iId, $sField = 'initiator')
    {
        $sQuery = $this->prepare("DELETE FROM `{$this->_sTable}` WHERE `$sField` = ?", $iId);
        return $this->query($sQuery);
    }

    public function onModuleDelete ($sTable, $sFieldId, $sField = 'initiator')
    {
        return $this->onModuleDeleteCustom ($sTable, $sFieldId, $sField);
    }

    public function onModuleProfileDelete ($sModuleName, $sField = 'initiator')
    {
        return $this->onModuleDeleteCustom ('sys_profiles', 'id', $sField, $this->prepareAsString(" AND `sys_profiles`.`type` = ? ", $sModuleName));
    }

    protected function onModuleDeleteCustom ($sTable, $sFieldId, $sField = 'initiator', $sWhere = '')
    {
        $sQuery = $this->prepare("DELETE `" . $this->_sTable . "` FROM `" . $this->_sTable . "` INNER JOIN `{$sTable}` WHERE `" . $this->_sTable . "`.`$sField` = `{$sTable}`.`{$sFieldId}` " . $sWhere);
        return $this->query($sQuery);
    }

    public function getTriggerValue($sType, $iObjectId)
    {
        return (int)$this->getOne("SELECT `{$this->_aObject['tf_count_' . $sType]}` FROM `{$this->_aObject['tt_' . $sType]}` WHERE `{$this->_aObject['tf_id_' . $sType]}` = :id", [
            'id' => $iObjectId
        ]);
    }

    public function updateTriggerValue($sType, $iObjectId, $iValue)
    {
        return (int)$this->query("UPDATE `{$this->_aObject['tt_' . $sType]}` SET `{$this->_aObject['tf_count_' . $sType]}` = `{$this->_aObject['tf_count_' . $sType]}` + :count WHERE `{$this->_aObject['tf_id_' . $sType]}` = :id", [
            'id' => $iObjectId,
            'count' => (int)$iValue
        ]) > 0;
    }
}

/** @} */
