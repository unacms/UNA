<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * @see BxDolVote
 */
class BxDolVoteReactionsQuery extends BxDolVoteQuery
{
    public function __construct(&$oModule)
    {
        parent::__construct($oModule);
    }

    public function getVote($iObjectId)
    {
        $aReactions = $this->_oModule->getReactions();
        $aReactionsGot = $this->getAllWithKey('SELECT * FROM ' . $this->_sTable . ' WHERE `object_id` = :object_id ORDER BY `count` DESC', 'reaction', array('object_id' => $iObjectId));

        // Free-picked emoji (Many mode) are counted under their code; add the ones this object has.
        if($this->_oModule->isFreeEmojiAllowed())
            foreach($aReactionsGot as $sName => $aRow)
                if((int)$aRow['count'] > 0 && !in_array($sName, $aReactions) && $this->_oModule->getReaction($sName) !== false)
                    $aReactions[] = $sName;

        $aResult = array();
        foreach($aReactions as $sName) {
            $iCount = $iSum = 0;
            if(!empty($aReactionsGot[$sName])) {
                $iCount = (int)$aReactionsGot[$sName]['count'];
                $iSum = (int)$aReactionsGot[$sName]['sum'];
            }

            $aResult['count_' . $sName] = $iCount;
            $aResult['sum_' . $sName] = $iSum;
            $aResult['rate_' . $sName] = $iCount != 0 ? $iSum / $iCount : 0;
        }

        return $aResult;
    }

    public function putVote($iObjectId, $iAuthorId, $sAuthorIp, $aData, $bUndo = false)
    {
        $sReaction = $aData['reaction'];
        $aReaction = $this->_oModule->getReaction($sReaction);
        if($aReaction === false)
            return false;

        $iValue = (int)$aData['value'];
        $fValueFinal = $iValue * (float)$aReaction['weight'];

        $sQuery = "SELECT `object_id` FROM `{$this->_sTable}` WHERE `object_id` = :object_id AND `reaction` = :reaction LIMIT 1";
        $bExists = (int)$this->getOne($sQuery, array('object_id' => $iObjectId, 'reaction' => $sReaction)) != 0;
        if(!$bExists && $bUndo)
            return false;      

        if(!$bExists)
            $sQuery = $this->prepare("INSERT INTO {$this->_sTable} SET `object_id` = ?, `reaction` = ?, `count` = '1', `sum` = ?", $iObjectId, $sReaction, $fValueFinal);
        else
            $sQuery = $this->prepare("UPDATE `{$this->_sTable}` SET `count` = `count` " . ($bUndo ? "-" : "+") . " 1, `sum` = `sum` " . ($bUndo ? "-" : "+") . " ? WHERE `object_id` = ? AND `reaction` = ?", $fValueFinal, $iObjectId, $sReaction);

        if((int)$this->query($sQuery) == 0)
            return false;

        if($bUndo)
            return $this->_deleteTrackReaction($iObjectId, $iAuthorId, $sReaction);

        $iNow = time();
        $iAuthorNip = bx_get_ip_hash($sAuthorIp);
        $sQuery = $this->prepare("INSERT INTO `{$this->_sTableTrack}` SET `object_id` = ?, `author_id` = ?, `author_nip` = ?, `reaction` = ?, `value` = ?, `date` = ?", $iObjectId, $iAuthorId, $iAuthorNip, $sReaction, $iValue, $iNow);
        if((int)$this->query($sQuery) > 0)
            return $this->lastId();

        return false;
    }

    /**
     * The author's reactions to the object, oldest first.
     */
    public function getReactionsBy($iObjectId, $iAuthorId)
    {
        return $this->getColumn("SELECT `reaction` FROM `{$this->_sTableTrack}` WHERE `object_id` = :object_id AND `author_id` = :author_id ORDER BY `id` ASC", [
            'object_id' => $iObjectId,
            'author_id' => $iAuthorId
        ]);
    }

    /**
     * The author's latest reaction to the object (what the do-button shows).
     */
    public function getTrackLatest($iObjectId, $iAuthorId)
    {
        return $this->getRow("SELECT * FROM `{$this->_sTableTrack}` WHERE `object_id` = :object_id AND `author_id` = :author_id ORDER BY `id` DESC LIMIT 1", [
            'object_id' => $iObjectId,
            'author_id' => $iAuthorId
        ]);
    }

    public function getTrackReaction($iObjectId, $iAuthorId, $sReaction)
    {
        return $this->getRow("SELECT * FROM `{$this->_sTableTrack}` WHERE `object_id` = :object_id AND `author_id` = :author_id AND `reaction` = :reaction LIMIT 1", [
            'object_id' => $iObjectId,
            'author_id' => $iAuthorId,
            'reaction' => $sReaction
        ]);
    }

    protected function _deleteTrackReaction($iObjectId, $iAuthorId, $sReaction)
    {
        $iId = (int)$this->getOne("SELECT `id` FROM `{$this->_sTableTrack}` WHERE `object_id` = :object_id AND `author_id` = :author_id AND `reaction` = :reaction LIMIT 1", [
            'object_id' => $iObjectId,
            'author_id' => $iAuthorId,
            'reaction' => $sReaction
        ]);
        if(!$iId)
            return false;

        if((int)$this->query("DELETE FROM `{$this->_sTableTrack}` WHERE `id` = :id LIMIT 1", ['id' => $iId]) > 0)
            return $iId;

        return false;
    }

    public function getSqlParts($sMainTable, $sMainField)
    {
        if(empty($this->_sTable) || empty($sMainTable) || empty($sMainField))
            return array();

        $sFields = $sJoin = '';
        $aReactions = $this->_oModule->getReactions();
        foreach($aReactions as $iIndex => $sName) {
            $sFields .= ", `t{$iIndex}`.`count` as `vote_count_{$sName}`, (`t{$iIndex}`.`sum` / `t{$iIndex}`.`count`) AS `vote_rate_{$sName}` ";
            $sJoin .= " LEFT JOIN `{$this->_sTable}` AS `t{$iIndex}` ON (`t{$iIndex}`.`object_id` = `{$sMainTable}`.`{$sMainField}` AND `t{$iIndex}`.`reaction` = '{$sName}') ";
        }

        return array (
            'fields' => $sFields,
            'join' => $sJoin,
        );
    }

    public function getPerformed($aParams = array())
    {
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $aBindings = array();

    	$sSelectClause = '`tt`.*';
    	$sJoinClause = $sWhereClause = '';
    	$sLimitClause = isset($aParams['start']) && !empty($aParams['per_page']) ? "LIMIT " . $aParams['start'] . ", " . $aParams['per_page'] : "";

    	if(!empty($aParams['type']))
            switch($aParams['type']) {
                case 'by':
                    $aBindings['object_id'] = $aParams['object_id'];

                    $sJoinClause = "INNER JOIN `sys_profiles` AS `tp` ON `tt`.`author_id`=`tp`.`id` AND `tp`.`status`='active'";
                    $sWhereClause = "AND `tt`.`object_id` = :object_id";

                    if(!empty($aParams['reaction'])) {
                        $aMethod['name'] = 'getColumn';
                        $aBindings['reaction'] = $aParams['reaction'];

                        $sSelectClause = "`tt`.`author_id`";
                        $sWhereClause .= " AND `tt`.`reaction`=:reaction";
                    }
                    else {
                        $aMethod['name'] = 'getAll';

                        $sSelectClause = "`tt`.`author_id`, `tt`.`reaction`";
                    }
                    break;
            }

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $this->_sTableTrack . "` AS `tt` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sLimitClause;
        $aMethod['params'][] = $aBindings;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    /**
     * Update trigger table.
     * @param integer $iObjectId - object ID;
     * @param array $aEntry - contains data received from BxDolVoteReactionsQuery::getVote method;
     * @return boolean - operation result.
     */
    protected function _updateTriggerTable($iObjectId, $aEntry)
    {
        $iCounted = $iTotalCount = $fTotalRate = 0;
        foreach($aEntry as $sKey => $mixedValue) {
            if(strncmp($sKey, 'count_', 6) !== 0)
                continue;

            $sName = substr($sKey, 6);
            $iCount = (int)$mixedValue;
            if($iCount == 0)
                continue;

            $iTotalCount += $iCount;
            $fTotalRate += (float)$aEntry['rate_' . $sName];
            $iCounted += 1;
        }

        return (int)$this->query("UPDATE `{$this->_sTriggerTable}` SET `{$this->_sTriggerFieldCount}`=:count, `{$this->_sTriggerFieldRate}`=:rate  WHERE `{$this->_sTriggerFieldId}`=:id", array(
            'count' => $iTotalCount, 
            'rate' => $iCounted != 0 ? $fTotalRate / $iCounted : 0, 
            'id' => $iObjectId
        )) > 0;
    }

    protected function _deleteAuthorEntriesTableMain($aTrack)
    {
        $aReaction = $this->_oModule->getReaction($aTrack['reaction']);
        return $this->query("UPDATE `{$this->_sTable}` SET `count`=`count`-1, `sum`=`sum`-:value WHERE `object_id`=:object_id AND `reaction`=:reaction", array(
            'value' => (int)$aTrack['value'] * (float)$aReaction['weight'],
            'object_id' => $aTrack['object_id'],
            'reaction' => $aTrack['reaction']
        ));
    }
}

/** @} */
