<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * @see BxDolObject
 */
class BxDolObjectQuery extends BxDolDb
{
    protected $_oModule;

    protected $_sTable;

    protected $_sTableTrack;
    protected $_sTableTrackFieldObject;
    protected $_sTableTrackFieldAuthor;
    protected $_sTableTrackFieldDate;

    protected $_sTriggerTable;
    protected $_sTriggerFieldId;
    protected $_sTriggerFieldAuthor;
    protected $_sTriggerFieldCount;

    protected $_sMethodGetEntry;

    public function __construct(&$oModule)
    {
        parent::__construct();

        $this->_oModule = $oModule;

        $aSystem = $this->_oModule->getSystemInfo();
        $this->_sTable = isset($aSystem['table_main']) ? $aSystem['table_main'] : '';

        $this->_sTableTrack = isset($aSystem['table_track']) ? $aSystem['table_track'] : '';
        $this->_sTableTrackFieldObject = 'object_id';
        $this->_sTableTrackFieldAuthor = 'author_id';
        $this->_sTableTrackFieldDate = 'date';

        $this->_sTriggerTable = isset($aSystem['trigger_table']) ? $aSystem['trigger_table'] : '';
        $this->_sTriggerFieldId = isset($aSystem['trigger_field_id']) ? $aSystem['trigger_field_id'] : '';
        $this->_sTriggerFieldAuthor = isset($aSystem['trigger_field_author']) ? $aSystem['trigger_field_author'] : '';
        $this->_sTriggerFieldCount = isset($aSystem['trigger_field_count']) ? $aSystem['trigger_field_count'] : '';
    }

    /**
     * Get SQL parts for main table. 
     */
    public function getSqlParts($sMainTable, $sMainField)
    {
        if(empty($this->_sTable) || empty($sMainTable) || empty($sMainField))
            return array();

        return array (
            'fields' => ", `{$this->_sTable}`.`count` as `count` ",
            'join' => " LEFT JOIN `{$this->_sTable}` ON (`{$this->_sTable}`.`object_id` = `{$sMainTable}`.`{$sMainField}`) ",
        );
    }

    /**
     * Get SQL parts for track table. 
     */
    public function getSqlPartsTrack($sMainTable, $sMainField, $iAuthorId = 0)
    {
        if(empty($this->_sTableTrack) || empty($sMainTable) || empty($sMainField))
            return array();

        return array (
            'fields' => ", `{$this->_sTableTrack}`.`{$this->_sTableTrackFieldAuthor}` as `{$this->_sTableTrackFieldAuthor}` ",
            'where' => $this->prepareAsString(" AND `{$this->_sTableTrack}`.`{$this->_sTableTrackFieldAuthor}` = ?", $iAuthorId),
            'join' => " LEFT JOIN `{$this->_sTableTrack}` ON (`{$this->_sTableTrack}`.`object_id` = `{$sMainTable}`.`{$sMainField}`) ",
        );
    }

    public function getSqlPartsTrackAuthor($sMainTable, $sMainField, $iObjectId = 0)
    {
        if(empty($this->_sTableTrack) || empty($sMainTable) || empty($sMainField))
            return array();

        return array (
            'fields' => ", `{$this->_sTableTrack}`.`object_id` as `object_id` ",
            'where' => $this->prepareAsString(" AND `{$this->_sTableTrack}`.`object_id` = ?", $iObjectId),
            'join' => " LEFT JOIN `{$this->_sTableTrack}` ON (`{$this->_sTableTrack}`.`{$this->_sTableTrackFieldAuthor}` = `{$sMainTable}`.`{$sMainField}`) ",
        );
    }

    public function isPerformed($iObjectId, $iAuthorId)
    {
        $sQuery = $this->prepare("SELECT `object_id` FROM `{$this->_sTableTrack}` WHERE `object_id` = ? AND `author_id` = ? LIMIT 1", $iObjectId, $iAuthorId);
        return (int)$this->getOne($sQuery) != 0;
    }

    /**
     * Which of the objects the author performed the action on (isPerformed for a page of
     * objects in one query): their ids.
     */
    public function getPerformedObjects($aObjectIds, $iAuthorId)
    {
        $aObjectIds = array_values(array_unique(array_filter(array_map('intval', (array)$aObjectIds))));
        if(empty($aObjectIds) || empty($this->_sTableTrack))
            return [];

        return array_map('intval', $this->getColumn("SELECT DISTINCT `object_id` FROM `{$this->_sTableTrack}` WHERE `author_id` = :author_id AND `object_id` IN (" . $this->implode_escape($aObjectIds) . ")", [
            'author_id' => $iAuthorId
        ]));
    }

    public function getPerformedBy($iObjectId, $iStart = 0, $iPerPage = 0)
    {
        $sLimitClause = "";
        if(!empty($iPerPage))
            $sLimitClause = $this->prepareAsString(" LIMIT ?, ?", $iStart, $iPerPage);

        $sQuery = $this->prepare("SELECT `tt`.`author_id` FROM `{$this->_sTableTrack}` AS `tt` INNER JOIN `sys_profiles` AS `tp` ON `tt`.`author_id`=`tp`.`id` AND `tp`.`status`='active' WHERE `tt`.`object_id` = ?" . $sLimitClause, $iObjectId);
        return $this->getColumn($sQuery);
    }
    
    public function getData($iObjectId)
    {
        $sQuery = $this->prepare("SELECT * FROM `{$this->_sTableTrack}` WHERE `object_id` = ?", $iObjectId);
        return $this->getAll($sQuery);
    }

    public function getTrack($iObjectId, $iAuthorId)
    {
        return $this->getRow("SELECT * FROM `{$this->_sTableTrack}` WHERE `object_id` = :object_id AND `author_id` = :author_id LIMIT 1", array(
            'object_id' => $iObjectId,
            'author_id' => $iAuthorId
        ));
    }
    
    public function getTrackBy($aParams = array())
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sWhereClause = $sOrderByClause = $sLimitClause = "";
        $aBindings = array();

        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aBindings['id'] = $aParams['id'];

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'all':
            	break;
        }

        if(!empty($aParams['order_by']))
            $sOrderByClause = " ORDER BY " . $aParams['order_by'] . (!empty($aParams['order_way']) ? " " . $aParams['order_way'] : "");

        if(isset($aParams['start']) && !empty($aParams['per_page']))
            $sLimitClause = " LIMIT " . $aParams['start'] . ", " . $aParams['per_page'];

        $aMethod['params'][0] = "SELECT * FROM `{$this->_sTableTrack}` WHERE 1 " . $sWhereClause . $sOrderByClause . $sLimitClause;
        $aMethod['params'][] = $aBindings;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function deleteObjectEntries($iObjectId)
    {
    	if(!empty($this->_sTable)) {
            $sQuery = $this->prepare("DELETE FROM `{$this->_sTable}` WHERE `object_id` = ?", $iObjectId);
            if($this->query($sQuery))
                $this->query("OPTIMIZE TABLE `{$this->_sTable}`");
    	}

    	if(!empty($this->_sTableTrack))
            $this->pruningByObject($iObjectId);
    }
    public function deleteAuthorEntries($iAuthorId)
    {
        if(empty($this->_sTableTrack))
            return;

        $bTable = !empty($this->_sTable);
        $bTableTrigger = !empty($this->_sTriggerTable) && !empty($this->_sTriggerFieldCount);

        if($bTable || $bTableTrigger) {
            $aTracks = $this->getAll("SELECT * FROM `{$this->_sTableTrack}` WHERE `{$this->_sTableTrackFieldAuthor}`=:author_id", array('author_id' => $iAuthorId));
            foreach($aTracks as $aTrack) {
                if($bTable)
                    $this->_deleteAuthorEntriesTableMain($aTrack);
    
                /**
                 * Note. It's essential that Trigger Table is updated at the end, 
                 * because it may require updated data from main ($this->_sTable) table. 
                 */
                if($bTableTrigger)
                    $this->_deleteAuthorEntriesTableTrigger($aTrack);
            }
        }

        $this->pruningByAuthor($iAuthorId);
    }

    public function getObjectInfo($iId)
    {
        if(empty($this->_sTriggerFieldId))
            return [];

        // the row primed in the open row scope (an API page of entries: BxDolDb::openRowScope)
        $aRow = [];
        if($this->_getScopedRow($this->_sTriggerTable, $this->_sTriggerFieldId, $iId, $aRow))
            return $aRow;

        return $this->getRow("SELECT * FROM `{$this->_sTriggerTable}` WHERE `{$this->_sTriggerFieldId}` = :id LIMIT 1", [
            'id' => $iId
        ]);
    }

    public function getObjectAuthorId($iId)
    {
        if(empty($this->_sTriggerFieldAuthor))
            return 0;

        $sQuery = $this->prepare("SELECT `{$this->_sTriggerFieldAuthor}` FROM `{$this->_sTriggerTable}` WHERE `{$this->_sTriggerFieldId}` = ? LIMIT 1", $iId);
        return (int)$this->getOne($sQuery);
    }

    public function getObjectCount($iId)
    {
        $sQuery = $this->prepare("SELECT `{$this->_sTriggerFieldCount}` FROM `{$this->_sTriggerTable}` WHERE `{$this->_sTriggerFieldId}` = ? LIMIT 1", $iId);
        return (int)$this->getOne($sQuery);
    }

    public function updateMainTableValue($iObjectId, $iValue)
    {
        $sQuery = $this->prepare("UPDATE `{$this->_sTable}` SET `count` = `count` + ? WHERE `object_id` = ?", (int)$iValue, $iObjectId);
        return (int)$this->query($sQuery) > 0;
    }

    public function updateTriggerTable($iObjectId)
    {
    	if(empty($this->_sMethodGetEntry))
            return false;

        $aEntry = $this->{$this->_sMethodGetEntry}($iObjectId);
        if(empty($aEntry) || !is_array($aEntry))
            return false;

        return $this->_updateTriggerTable($iObjectId, $aEntry);
    }

    public function pruningByObject($iObjectId)
    {
        if($this->query("DELETE FROM `{$this->_sTableTrack}` WHERE `object_id` = :object_id", ['object_id' => $iObjectId]))
            $this->query("OPTIMIZE TABLE `{$this->_sTableTrack}`");
    }

    public function pruningByAuthor($iAuthorId)
    {
        if($this->query("DELETE FROM `{$this->_sTableTrack}` WHERE `{$this->_sTableTrackFieldAuthor}` = :author_id", ['author_id' => $iAuthorId]))
            $this->query("OPTIMIZE TABLE `{$this->_sTableTrack}`");
    }

    public function pruningByDate($iDate)
    {
        $iResult = (int)$this->query("DELETE FROM `{$this->_sTableTrack}` WHERE `{$this->_sTableTrackFieldDate}` < (UNIX_TIMESTAMP() - :date)", ['date' => $iDate]);
        if($iResult)
            $this->query("OPTIMIZE TABLE `{$this->_sTableTrack}`");

        return $iResult;
    }

    /**
     * Is used instead of 'updateTriggerTable' when trigger table contains 
     * only one field related to this object (View, Vote, Comment, etc).
     * For example, it's used in Favourite (simple mode w\o lists) and Feature objects.
     */
    public function updateTriggerTableValue($iObjectId, $iValue)
    {
        $sQuery = $this->prepare("UPDATE `{$this->_sTriggerTable}` SET `{$this->_sTriggerFieldCount}` = `{$this->_sTriggerFieldCount}` + ? WHERE `{$this->_sTriggerFieldId}` = ?", (int)$iValue, $iObjectId);
        return (int)$this->query($sQuery) > 0;
    }

    protected function _updateTriggerTable($iObjectId, $aEntry)
    {
    	$sQuery = $this->prepare("UPDATE `{$this->_sTriggerTable}` SET `{$this->_sTriggerFieldCount}` = ? WHERE `{$this->_sTriggerFieldId}` = ?", $aEntry['count'], $iObjectId);
        return (int)$this->query($sQuery) > 0;
    }

    protected function _deleteAuthorEntriesTableMain($aTrack)
    {
        return $this->updateMainTableValue($aTrack['object_id'], -1);
    }

    protected function _deleteAuthorEntriesTableTrigger($aTrack)
    {
        return $this->updateTriggerTableValue($aTrack['object_id'], -1);
    }
}

/** @} */
