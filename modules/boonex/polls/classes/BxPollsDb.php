<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Polls Polls
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxPollsDb extends BxBaseModTextDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function getContentInfoById ($iContentId, $bForceGet = false)
    {
        $aContentInfo = parent::getContentInfoById($iContentId, $bForceGet);
        if(!empty($aContentInfo) && is_array($aContentInfo))
            $aContentInfo['salt'] = $this->_oConfig->getSalt();

        return $aContentInfo;
    }

    /**
     * The rows of these polls in one query, each with its salt as getContentInfoById gives it
     * (API v2 reads a page of polls at once).
     */
    public function getContentInfoByIds($aIds)
    {
        $aRows = parent::getContentInfoByIds($aIds);
        foreach($aRows as $iId => $aRow)
            $aRows[$iId]['salt'] = $this->_oConfig->getSalt();

        return $aRows;
    }

    /**
     * The answers of these polls in one query, in each poll's order.
     * @return array poll id => array of answer rows
     */
    public function getSubentriesByEntries($aEntryIds)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntryIds = array_values(array_unique(array_filter(array_map('intval', (array)$aEntryIds))));
        if(empty($aEntryIds))
            return [];

        $aResult = array_fill_keys($aEntryIds, []);
        foreach($this->getAll("SELECT * FROM `" . $CNF['TABLE_SUBENTRIES'] . "` WHERE `entry_id` IN (" . $this->implode_escape($aEntryIds) . ") ORDER BY `entry_id`, `order` ASC, `id` ASC") as $aRow)
            $aResult[(int)$aRow['entry_id']][] = $aRow;

        return $aResult;
    }

    /**
     * The answer a profile chose in each of these polls, in one query (a poll takes one answer
     * per voter: isPerformed). Polls the profile did not answer are left out.
     * @return array poll id => answer id
     */
    public function getPerformedValuesByEntries($aEntryIds, $iAuthorId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntryIds = array_values(array_unique(array_filter(array_map('intval', (array)$aEntryIds))));
        if(empty($aEntryIds) || (int)$iAuthorId <= 0)
            return [];

        $aResult = [];
        $sQuery = "SELECT `tse`.`entry_id`, `tt`.`object_id` FROM `" . $CNF['TABLE_VOTES_SUBENTRIES_TRACK'] . "` AS `tt` INNER JOIN `" . $CNF['TABLE_SUBENTRIES'] . "` AS `tse` ON `tse`.`id`=`tt`.`object_id` WHERE `tse`.`entry_id` IN (" . $this->implode_escape($aEntryIds) . ") AND `tt`.`author_id`=:author_id ORDER BY `tt`.`id` ASC";
        foreach($this->getAll($sQuery, ['author_id' => (int)$iAuthorId]) as $aRow)
            if(!isset($aResult[(int)$aRow['entry_id']]))
                $aResult[(int)$aRow['entry_id']] = (int)$aRow['object_id'];

        return $aResult;
    }

    /**
     * In the open row scope (BxDolDb::openRowScope): the answers of these polls (getSubentries
     * by entry and by id) and whether a signed-in viewer answered each (isPerformed), in a query
     * each, so preparing the polls reads none of them.
     */
    public function primeSubentriesByEntries($aEntryIds, $iViewerId = 0)
    {
        if(!self::$_aRowScopes)
            return;

        $iScope = count(self::$_aRowScopes) - 1;
        $aIds = [];
        foreach((array)$aEntryIds as $mId)
            if(($iId = (int)$mId) > 0 && !isset(self::$_aRowScopes[$iScope]['#polls_subentries'][$iId]))
                $aIds[$iId] = $iId;
        if(!$aIds)
            return;
        $aIds = array_values($aIds);

        $aById = [];
        foreach($this->getSubentriesByEntries($aIds) as $iId => $aRows) {
            self::$_aRowScopes[$iScope]['#polls_subentries'][$iId] = $aRows;
            foreach($aRows as $aRow)
                $aById[(int)$aRow['id']] = $aRow;
        }
        $this->_setScopedRows($this->_oConfig->CNF['TABLE_SUBENTRIES'], 'id', $aById);

        if((int)$iViewerId > 0) {
            $aPerformed = $this->getPerformedValuesByEntries($aIds, $iViewerId);
            foreach($aIds as $iId)
                self::$_aRowScopes[$iScope]['#polls_performed'][$iId . '#' . (int)$iViewerId . '#'] = isset($aPerformed[$iId]);
        }
    }

    public function isPerformed($iEntryId, $iAuthorId, $iAuthorIp)
    {
        $CNF = &$this->_oConfig->CNF;

        $iAuthorId = (int)$iAuthorId;

        // known in the open row scope (@see primeSubentriesByEntries), or asked before in it
        $sKey = (int)$iEntryId . '#' . $iAuthorId . '#' . (empty($iAuthorId) ? (string)$iAuthorIp : '');
        $iScope = count(self::$_aRowScopes) - 1;
        if($iScope >= 0 && isset(self::$_aRowScopes[$iScope]['#polls_performed'][$sKey]))
            return self::$_aRowScopes[$iScope]['#polls_performed'][$sKey];

        $aBindings = array('author_id' => $iAuthorId);
        $sWhereClause = "AND `author_id`=:author_id";

        if(empty($iAuthorId)) {
            $aBindings['author_nip'] = $iAuthorIp;
            $sWhereClause .= " AND `author_nip`=:author_nip";
        }

        $aSubentries = $this->getSubentries(array('type' => 'entry_id_pairs', 'entry_id' => $iEntryId));
        $bPerformed = (int)$this->getOne("SELECT `object_id` FROM `" . $CNF['TABLE_VOTES_SUBENTRIES_TRACK'] . "` WHERE `object_id` IN (" . $this->implode_escape(array_keys($aSubentries)) . ") " . $sWhereClause . " LIMIT 1", $aBindings) != 0;
        if($iScope >= 0)
            self::$_aRowScopes[$iScope]['#polls_performed'][$sKey] = $bPerformed;
        return $bPerformed;
    }
    
    public function getPerformedValue($iEntryId, $iAuthorId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = ['author_id' => $iAuthorId];
        $sWhereClause = "AND `author_id`=:author_id";

        $aSubentries = $this->getSubentries([
            'type' => 'entry_id_pairs', 
            'entry_id' => $iEntryId
        ]);

        return (int)$this->getOne("SELECT `object_id` FROM `" . $CNF['TABLE_VOTES_SUBENTRIES_TRACK'] . "` WHERE `object_id` IN (" . $this->implode_escape(array_keys($aSubentries)) . ") " . $sWhereClause . " LIMIT 1", $aBindings);
    }

    protected function _forgetScopedSubentries()
    {
        $this->_forgetScopedRows($this->_oConfig->CNF['TABLE_SUBENTRIES']);
        foreach(array_keys(self::$_aRowScopes) as $iScope)
            unset(self::$_aRowScopes[$iScope]['#polls_subentries'], self::$_aRowScopes[$iScope]['#polls_performed']);
    }

    public function getContentInfoBySubentryId ($iSubentryId)
    {
        $CNF = &$this->_oConfig->CNF;

        $sQuery = $this->prepare ("SELECT `te`.* FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te` LEFT JOIN `" . $CNF['TABLE_SUBENTRIES'] . "` AS `tse` ON `te`.`" . $CNF['FIELD_ID'] . "`=`tse`.`entry_id` WHERE `tse`.`id` = ?", $iSubentryId);
        return $this->getRow($sQuery);
    }

    public function getSubentries($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        // primed in the open row scope (@see primeSubentriesByEntries), in their own order
        if(self::$_aRowScopes && !isset($aParams['order_by']) && !isset($aParams['order_way'])) {
            $iScope = count(self::$_aRowScopes) - 1;
            $aRow = [];
            switch($aParams['type'] ?? '') {
                case 'id':
                    if($this->_getScopedRow($CNF['TABLE_SUBENTRIES'], 'id', $aParams['id'], $aRow))
                        return $aRow;
                    break;
                case 'entry_id':
                case 'entry_id_pairs':
                    if(is_numeric($aParams['entry_id']) && isset(self::$_aRowScopes[$iScope]['#polls_subentries'][(int)$aParams['entry_id']])) {
                        $aRows = self::$_aRowScopes[$iScope]['#polls_subentries'][(int)$aParams['entry_id']];
                        return $aParams['type'] === 'entry_id' ? $aRows : array_column($aRows, 'title', 'id');
                    }
                    break;
            }
        }

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sWhereClause = $sOrderByClause = "";

        $sSelectClause = "*";
        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['id']
                );

                $sWhereClause .= " AND `id`=:id";
                break;

            case 'entry_id_pairs':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'title';
                $aMethod['params'][3] = array(
                	'entry_id' => $aParams['entry_id']
                );

                $sWhereClause .= " AND `entry_id`=:entry_id";
                break;

            case 'entry_id':
                $aMethod['params'][1] = array(
                	'entry_id' => $aParams['entry_id']
                );

                $sWhereClause .= " AND `entry_id`=:entry_id";
                break;

            case 'entry_id_max_order':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                	'entry_id' => $aParams['entry_id']
                );

                $sSelectClause = "MAX(`order`)";
                $sWhereClause .= " AND `entry_id`=:entry_id";
                break;

            case 'all':
            	break;
        }

        $sOrderByClause = " ORDER BY " . (isset($aParams['order_by']) ? '`' . $aParams['order_by'] . '`' : '`order`');
        $sOrderByClause .= " " . (isset($aParams['order_way']) ? strtoupper($aParams['order_way']) : 'ASC');

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_SUBENTRIES'] . "` WHERE 1 " . $sWhereClause . $sOrderByClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function insertSubentry($aParamsSet)
    {
        $this->_forgetScopedSubentries();
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet))
            return false;

        $sSql = "INSERT INTO `" . $CNF['TABLE_SUBENTRIES'] . "` SET " . $this->arrayToSQL($aParamsSet);
        return $this->query($sSql);
    }

    public function updateSubentry($aParamsSet, $aParamsWhere)
    {
        $this->_forgetScopedSubentries();
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `" . $CNF['TABLE_SUBENTRIES'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }

    public function deleteSubentry($aParams)
    {
        $this->_forgetScopedSubentries();
        $CNF = &$this->_oConfig->CNF;

        $sSql = "DELETE FROM `" . $CNF['TABLE_SUBENTRIES'] . "` WHERE " . $this->arrayToSQL($aParams, " AND ");
        return $this->query($sSql);
    }

    public function deleteSubentryById($mixedId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!is_array($mixedId))
            $mixedId = array($mixedId);

        $sSql = "DELETE FROM `" . $CNF['TABLE_SUBENTRIES'] . "` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")";
        return $this->query($sSql);
    }
}

/** @} */
