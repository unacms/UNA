<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxBaseModGeneralDb extends BxDolModuleDb
{
    protected $_oConfig;

    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
        $this->_oConfig = $oConfig;
    }

    public function getContentInfoById ($iContentId, $bForceGet = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_ENTRIES']) || empty($CNF['FIELD_ID']))
            return [];

        return $this->getRow("SELECT * FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_ID'] . "` = :id", [
            'id' => $iContentId
        ]);
    }

    function getEntriesBy($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query', 1 => array()));
        $sSelectClause = $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        $sSelectClause = "`" . $CNF['TABLE_ENTRIES'] . "`.*";

        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1]['id'] = (int)$aParams['id'];

                $sWhereClause .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . "` = :id";
                break;

            case 'author':
                $aMethod['params'][1]['author'] = (int)$aParams['author'];

                $sWhereClause .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_AUTHOR'] . "` = :author";
                break;

            case 'conditions':
                if(empty($aParams['conditions']))
                    break;

                if(isset($aParams['count']) && $aParams['count'] === true) {
                    $aMethod['name'] = 'getOne';
                    $sSelectClause = 'COUNT(`' . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . '`)';
                }

                if(is_array($aParams['conditions']))
                    $sWhereClause .= " AND " . $this->arrayToSQL($aParams['conditions'], ' AND ');
                else if(is_string($aParams['conditions']) && !empty($aParams['bindings']) && is_array($aParams['bindings'])) {
                    $sWhereClause .= $aParams['conditions'];
                    
                    if(!is_array($aMethod['params'][1]))
                        $aMethod['params'][1] = array();

                    $aMethod['params'][1] = array_merge($aMethod['params'][1], $aParams['bindings']);
                }
                break;

            case 'search_ids':
                $this->_getEntriesBySearchIds($aParams, $aMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);
                
                /**
                 * @hooks
                 * @hookdef hook-system-search_ids 'system', 'search_ids' - hook to modify a list of found content ids
                 * - $unit_name - equals `system`
                 * - $action - equals `search_ids`
                 * - $object_id - not used
                 * - $sender_id - not used
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `module_name` - [string] content's module name
                 *      - `params` - [array] by ref, override search params
                 *      - `select_clause` - [string] by ref, 'select' part of SQL query, can be overridden in hook processing
                 *      - `join_clause` - [string] by ref, 'join' part of SQL query, can be overridden in hook processing
                 *      - `where_clause` - [string] by ref, 'where' part of SQL query, can be overridden in hook processing
                 *      - `order_clause` - [string] by ref, 'order' part of SQL query, can be overridden in hook processing
                 *      - `limit_clause` - [string] by ref, 'limit' part of SQL query, can be overridden in hook processing
                 *      - `bindings` - [array] by ref, bindings of SQL query, can be overridden in hook processing
                 * @hook @ref hook-system-search_ids
                 */
                bx_alert('system', 'search_ids', 0, 0, [
                    'module_name' => $this->_oConfig->getName(), 
                    'params' => &$aParams, 
                    'select_clause' => &$sSelectClause, 
                    'join_clause' => &$sJoinClause, 
                    'where_clause' => &$sWhereClause, 
                    'order_clause' => &$sOrderClause, 
                    'limit_clause' => &$sLimitClause, 
                    'bindings' => &$aMethod['params'][1],

                    'params_ref' => &$aParams, 
                    'select_clause_ref' => &$sSelectClause, 
                    'join_clause_ref' => &$sJoinClause, 
                    'where_clause_ref' => &$sWhereClause, 
                    'order_clause_ref' => &$sOrderClause, 
                    'limit_clause_ref' => &$sLimitClause, 
                    'bindings_ref' => &$aMethod['params'][1]
                ]);
                break;

            case 'all_ids':
                $aMethod['name'] = 'getColumn';

                $sSelectClause = "`" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . "`";
                $sOrderClause .=  "`" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ADDED'] . "` ASC";
                break;

            case 'all':
                if(isset($aParams['count']) && $aParams['count'] === true) {
                    $aMethod['name'] = 'getOne';
                    $sSelectClause = 'COUNT(`' . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . '`)';
                }

                $sOrderClause .=  "`" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ADDED'] . "` ASC";
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = 'ORDER BY ' . $sOrderClause;

        if(!empty($sLimitClause))
            $sLimitClause = 'LIMIT ' . $sLimitClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_ENTRIES'] . "` " . $sJoinClause . " WHERE 1 " . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;
		return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getEntriesNumByContext ($iProfileId)
    {
        $sQuery = $this->prepare ("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `" . $this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO'] . "` = ?", - $iProfileId);
        return $this->getOne($sQuery);
    }

    public function getEntriesByAuthor ($iProfileId)
    {
        $sQuery = $this->prepare ("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `" . $this->_oConfig->CNF['FIELD_AUTHOR'] . "` = ? ORDER BY `" . $this->_oConfig->CNF['FIELD_ADDED'] . "` DESC", $iProfileId);
        return $this->getAll($sQuery);
    }

    public function getEntriesNumByAuthor ($iProfileId)
    {
        $sQuery = $this->prepare ("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE `" . $this->_oConfig->CNF['FIELD_AUTHOR'] . "` = ?", $iProfileId);
        return $this->getOne($sQuery);
    }
    
    public function getEntriesNumByParams ($aParams = [])
    {
        $sSql = "SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_ENTRIES'] . "` WHERE 1";
        
        foreach($aParams as $aValue){
            if (!$this->isValidOperator($aValue['operator'])) {
                throw new Exception('Invalid operator in getEntriesNumByParams method');
            }
            $sSql .= ' AND `' . $aValue['key'] ."` " . $aValue['operator'] . " '" . $aValue['value'] . "'";
        }
        
        $sQuery = $this->prepare($sSql);
        return $this->getOne($sQuery);
    }
    
    public function updateEntriesBy($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_ENTRIES']) || empty($aParamsSet) || empty($aParamsWhere))
            return false;

        return $this->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }

    public function updateStatusAdmin($iContentId, $isActive)
    {
        $CNF = $this->_oConfig->CNF;
        if (!isset($CNF['FIELD_STATUS_ADMIN']))
            return false;
        
        $sQuery = $this->prepare("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $CNF['FIELD_STATUS_ADMIN'] . "` = ? WHERE `" . $CNF['FIELD_ID'] . "` = ?", $isActive ? 'active' : 'hidden', $iContentId);
        return $this->query($sQuery);
    }
    
    public function publishEntries()
    {
        $CNF = $this->_oConfig->CNF;

        $aEntries = $this->getAll("SELECT `id`, `" . $CNF['FIELD_PUBLISHED'] . "`, FROM_UNIXTIME(`" . $CNF['FIELD_PUBLISHED'] . "`)  FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_PUBLISHED'] . "` > `" . $CNF['FIELD_ADDED'] . "` AND `" . $CNF['FIELD_STATUS'] . "` = 'awaiting'");
        if(empty($aEntries) || !is_array($aEntries))
            return false;

        $iNow = time();
        $aResult = array();
        foreach($aEntries as $aEntry)
            if($aEntry[$CNF['FIELD_PUBLISHED']] <= $iNow) 
                $aResult[] = $aEntry[$CNF['FIELD_ID']];

        $sSet = "`" . $CNF['FIELD_ADDED'] . "`=`" . $CNF['FIELD_PUBLISHED'] . "`, `" . $CNF['FIELD_STATUS'] . "` = 'active'";
        if(isset($CNF['FIELD_CHANGED']))
            $sSet .= ", `" . $CNF['FIELD_CHANGED'] . "`=`" . $CNF['FIELD_PUBLISHED'] . "`";

        return count($aResult) == (int)$this->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET " . $sSet . " WHERE `id` IN (" . $this->implode_escape($aResult) . ")") ? $aResult : false;
    }

    public function alterFulltextIndex ()
    {
        $CNF = $this->_oConfig->CNF;        

        $bFulltextIndex = false;
        $aIndexes = $this->getAll("SHOW INDEXES FROM `" . $CNF['TABLE_ENTRIES'] . "`");

        foreach ($aIndexes as $r) {
            if ($CNF['TABLE_ENTRIES_FULLTEXT'] == $r['Key_name']) {
                $bFulltextIndex = true;
                break;
            }
        }

        if ($bFulltextIndex)
            $this->query("ALTER TABLE `" . $CNF['TABLE_ENTRIES'] . "` DROP INDEX `" . $CNF['TABLE_ENTRIES_FULLTEXT'] . "`");

        $sFields = getParam($CNF['PARAM_SEARCHABLE_FIELDS']);
        if (!$sFields || !($aFields = explode(',', $sFields)))
            return true;

        $sFields = '';
        foreach ($aFields as $s)
            $sFields .= "`$s`,";

        return $this->query("ALTER TABLE `" . $CNF['TABLE_ENTRIES'] . "` ADD FULLTEXT `" . $CNF['TABLE_ENTRIES_FULLTEXT'] . "` (" . trim($sFields, ', ') . ")");
    }
    
    public function deleteNestedById ($iNestedId, $sTableKey, $sTableName)
    {
        return $this->query("DELETE FROM `" . $sTableName . "` WHERE `" . $sTableKey . "` = :content_id", array('content_id' => $iNestedId));
    }
   
    public function getNestedBy($aParams, $sTableName)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query', 1 => array()));
        $sSelectClause = $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        $sSelectClause = "`" . $sTableName . "`.*";

        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1]['id'] = (int)$aParams['id'];

                $sWhereClause .= " AND `" . $sTableName . "`.`" . $aParams['key_name'] . "` = :id";
                break;
                
            case 'content_id':
                $aMethod['name'] = 'getAllWithKey';
                $aMethod['params'][2]['id'] = (int)$aParams['id'];
                $aMethod['params'][1] = $aParams['key_name'];
                $sWhereClause .= " AND `" . $sTableName . "`.`content_id` = :id";
                $sOrderClause = $aParams['key_name'];
                break;
        }

        if(!empty($sOrderClause))
            $sOrderClause = 'ORDER BY ' . $sOrderClause;

        if(!empty($sLimitClause))
            $sLimitClause = 'LIMIT ' . $sLimitClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $sTableName . "` " . $sJoinClause . " WHERE 1 " . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    /**
     * 
     * Internal Polls related methods. 
     * 
     */
    public function isPollPerformed($iPollId, $iAuthorId, $iAuthorIp = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS_ANSWERS_VOTES_TRACK']))
            return false;

        $iAuthorId = (int)$iAuthorId;

        $aBindings = array('author_id' => $iAuthorId);
        $sWhereClause = "AND `author_id`=:author_id";

        if(empty($iAuthorId)) {
            $aBindings['author_nip'] = $iAuthorIp;
            $sWhereClause .= " AND `author_nip`=:author_nip";
        }

        $aAnswers = $this->getPollAnswers([
            'type' => 'poll_id_pairs', 
            'poll_id' => $iPollId
        ]);
        return (int)$this->getOne("SELECT `object_id` FROM `" . $CNF['TABLE_POLLS_ANSWERS_VOTES_TRACK'] . "` WHERE `object_id` IN (" . $this->implode_escape(array_keys($aAnswers)) . ") " . $sWhereClause . " LIMIT 1", $aBindings) != 0;
    }

    public function getPollPerformedValue($iPollId, $iAuthorId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = ['author_id' => $iAuthorId];
        $sWhereClause = "AND `author_id`=:author_id";

        $aSubentries = $this->getPollAnswers([
            'type' => 'poll_id_pairs', 
            'poll_id' => $iPollId
        ]);
        return (int)$this->getOne("SELECT `object_id` FROM `" . $CNF['TABLE_POLLS_ANSWERS_VOTES_TRACK'] . "` WHERE `object_id` IN (" . $this->implode_escape(array_keys($aSubentries)) . ") " . $sWhereClause . " LIMIT 1", $aBindings);
    }

    public function getPolls($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS']))
            return false;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sJoinClause = $sWhereClause = $sOrderByClause = "";

        $sSelectClause = "`tp`.*";
        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause .= " AND `tp`.`id`=:id";
                break;

            case 'answer_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'answer_id' => $aParams['answer_id']
                );

                $sJoinClause = "LEFT JOIN `" . $CNF['TABLE_POLLS_ANSWERS'] . "` AS `ta` ON `tp`.`" . $CNF['FIELD_POLL_ID'] . "`=`ta`.`poll_id`";
                $sWhereClause .= " AND `ta`.`id`=:answer_id";
                break;

            case 'content_id':
                $aMethod['params'][1] = array(
                    'content_id' => $aParams['content_id']
                );

                $sWhereClause .= " AND `tp`.`content_id`=:content_id";
                break;
            
            case 'content_id_ids':
                $aMethod['name'] = 'getColumn';
                $aMethod['params'][1] = array(
                    'content_id' => $aParams['content_id']
                );

                $sSelectClause = "`tp`.`" . $CNF['FIELD_POLL_ID'] . "`";
                $sWhereClause .= " AND `tp`.`content_id`=:content_id";
                break;

            case 'author_id':
                $aMethod['params'][1] = array(
                    'author_id' => $aParams['author_id']
                );

                $sWhereClause .= " AND `tp`.`author_id`=:author_id";

                if(isset($aParams['unused']) && $aParams['unused'] === true) {
                    $aMethod['params'][1]['content_id'] = 0;

                    $sWhereClause .= " AND `tp`.`content_id`=:content_id";
                }
                break;
        }

        if(!empty($sOrderByClause))
            $sOrderByClause = "ORDER BY " . $sOrderByClause;

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_POLLS'] . "` AS `tp` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sOrderByClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getPollInfoById($iId)
    {
        return $this->getPolls(array('type' => 'id', 'id' => $iId));
    }

    public function updatePolls($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS']) || empty($aParamsSet) || empty($aParamsWhere))
            return false;

        return $this->query("UPDATE `" . $CNF['TABLE_POLLS'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }

    public function deletePolls($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS']))
            return false;

        $sWhereClause = $this->arrayToSQL($aParams, " AND ");
        $aPolls = $this->getAll("SELECT * FROM `" . $CNF['TABLE_POLLS'] . "` WHERE " . $sWhereClause);
        if(empty($aPolls) || !is_array($aPolls))
            return true;

        return $this->_deletePolls($aPolls);
    }

    public function deletePollsByIds($mixedId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS']))
            return false;

        $sWhereClause = "`id` IN (" . $this->implode_escape(is_array($mixedId) ? $mixedId : array($mixedId)) . ")";
        $aPolls = $this->getAll("SELECT * FROM `" . $CNF['TABLE_POLLS'] . "` WHERE " . $sWhereClause);
        if(empty($aPolls) || !is_array($aPolls))
            return true;

        return $this->_deletePolls($aPolls);
    }

    public function getPollAnswers($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS_ANSWERS']))
            return false;

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

            case 'poll_id_pairs':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'title';
                $aMethod['params'][3] = array(
                    'poll_id' => $aParams['poll_id']
                );

                $sWhereClause .= " AND `poll_id`=:poll_id";
                break;

            case 'poll_id':
                $aMethod['params'][1] = array(
                    'poll_id' => $aParams['poll_id']
                );

                $sWhereClause .= " AND `poll_id`=:poll_id";
                break;

            case 'poll_id_max_order':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'poll_id' => $aParams['poll_id']
                );

                $sSelectClause = "MAX(`order`)";
                $sWhereClause .= " AND `poll_id`=:poll_id";
                break;

            case 'all':
            	break;
        }

        $sOrderByClause = " ORDER BY " . (isset($aParams['order_by']) ? '`' . $aParams['order_by'] . '`' : '`order`');
        $sOrderByClause .= " " . (isset($aParams['order_way']) ? strtoupper($aParams['order_way']) : 'ASC');

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_POLLS_ANSWERS'] . "` WHERE 1 " . $sWhereClause . $sOrderByClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function insertPollAnswer($aParamsSet)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS_ANSWERS']) || empty($aParamsSet))
            return false;

        return $this->query("INSERT INTO `" . $CNF['TABLE_POLLS_ANSWERS'] . "` SET " . $this->arrayToSQL($aParamsSet));
    }

    public function updatePollAnswers($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS_ANSWERS']) || empty($aParamsSet) || empty($aParamsWhere))
            return false;

        return $this->query("UPDATE `" . $CNF['TABLE_POLLS_ANSWERS'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }

    public function deletePollAnswers($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS_ANSWERS']))
            return false;

        $sWhereClause = $this->arrayToSQL($aParams, " AND ");
        $aAnswers = $this->getAll("SELECT * FROM `" . $CNF['TABLE_POLLS_ANSWERS'] . "` WHERE " . $sWhereClause);
        if(empty($aAnswers) || !is_array($aAnswers))
            return true;

        return $this->_deletePollAnswers($aAnswers);
    }

    public function deletePollAnswersByIds($mixedId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($CNF['TABLE_POLLS_ANSWERS']))
            return false;

        $sWhereClause = "`id` IN (" . $this->implode_escape(is_array($mixedId) ? $mixedId : array($mixedId)) . ")";
        $aAnswers = $this->getAll("SELECT * FROM `" . $CNF['TABLE_POLLS_ANSWERS'] . "` WHERE " . $sWhereClause);
        if(empty($aAnswers) || !is_array($aAnswers))
            return true;

        return $this->_deletePollAnswers($aAnswers);
    }

    protected function _deletePolls(&$aPolls)
    {
        $CNF = &$this->_oConfig->CNF;

        $aAffected = array();           
        foreach($aPolls as $aPoll) {
            if(!$this->deletePollAnswers(array('poll_id' => $aPoll[$CNF['FIELD_POLL_ID']])))
                continue;

            $aAffected[] = $aPoll[$CNF['FIELD_POLL_ID']];
        }

        return $this->query("DELETE FROM `" . $CNF['TABLE_POLLS'] . "` WHERE `id` IN (" . $this->implode_escape($aAffected) . ")");
    }

    protected function _deletePollAnswers(&$aAnswers)
    {
        $CNF = &$this->_oConfig->CNF;

        $aAffected = array();
        foreach($aAnswers as $aAnswer) {
            BxDolVote::getObjectInstance($CNF['OBJECT_VOTES_POLL_ANSWERS'], $aAnswer['id'])->onObjectDelete();

            $aAffected[] = $aAnswer['id'];
        }

        return $this->query("DELETE FROM `" . $CNF['TABLE_POLLS_ANSWERS'] . "` WHERE `id` IN (" . $this->implode_escape($aAffected) . ")");
    }

    protected function _getEntriesBySearchIds($aParams, &$aMethod, &$sSelectClause, &$sJoinClause, &$sWhereClause, &$sOrderClause, &$sLimitClause)
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod['name'] = 'getColumn';

        $sSelectClause = " DISTINCT `" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . "`";

        if (!empty($aParams['start']) && !empty($aParams['per_page']))
            $sLimitClause = $this->prepareAsString("?, ?", $aParams['start'], $aParams['per_page']);
        elseif (!empty($aParams['per_page']))
            $sLimitClause = $this->prepareAsString("?", $aParams['per_page']);

        $sWhereConditions = "1";
        foreach($aParams['search_params'] as $sSearchParam => $aSearchParam) {
            if(empty($aSearchParam['operator']))
                continue;

            $sSearchValue = "";
            switch ($aSearchParam['operator']) {
                case 'like':
                    if(is_array($aSearchParam['value'])) {
                        $sSubCondition = "0";
                        foreach($aSearchParam['value'] as $sValue)
                            if(!empty($sValue))
                                $sSubCondition .= " OR `" . $CNF['TABLE_ENTRIES'] . "`.`" . $sSearchParam . "` LIKE " . $this->_getEbsiLike($sValue);

                        if($sSubCondition != "0")
                            $sWhereConditions .= " AND (" . $sSubCondition . ")";
                    }
                    else
                        $sSearchValue = " LIKE " . $this->_getEbsiLike($aSearchParam['value']);
                    break;

                case 'in':
                    $sSearchValue = " IN (" . $this->implode_escape($aSearchParam['value']) . ")";
                    break;

                case 'not in':
                    $sSearchValue = " NOT IN (" . $this->implode_escape($aSearchParam['value']) . ")";
                    break;	
                    
                case 'and':
                    $iResult = 0;
                    if (is_array($aSearchParam['value']))
                        foreach ($aSearchParam['value'] as $iValue)
                            $iResult |= pow (2, $iValue - 1);
                    else 
                        $iResult = (int)$aSearchParam['value'];

                    $sSearchValue = " & " . $iResult . "";
                    break;

                case 'locate':
                    if(!isset($CNF['OBJECT_METATAGS']))
                        break;
                    if ($aSearchParam['type'] == 'location_radius'){
                        list($fLatitude, $fLongitude, $sCountry, $sState, $sCity, $sZip, $sStreet, $sStreetNumber, $iRadius) = $aSearchParam['value']['array'];
                        if ($fLatitude && $fLongitude && $iRadius) {
                            $aBounds = bx_get_location_bounds_latlng($fLatitude, $fLongitude, $iRadius);   
                            $aSql = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])->locationsGetAsSQLPart($CNF['TABLE_ENTRIES'], $CNF['FIELD_ID'], '', '', '', '', $aBounds);
                        }
                    }
                    else{
                        list($fLatitude, $fLongitude, $sCountry, $sState, $sCity, $sZip) = $aSearchParam['value']['array'];
                        $aSql = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])->locationsGetAsSQLPart($CNF['TABLE_ENTRIES'], $CNF['FIELD_ID'], $sCountry, $sState, $sCity, $sZip);
                    }
                    if(!empty($aSql['where'])) {
                        $sWhereConditions .= $aSql['where'];

                        if(!empty($aSql['join']))
                            $sJoinClause .= $aSql['join'];
                    }
                    break;
                    
                case 'between':
                    if(!is_array($aSearchParam['value']) || count($aSearchParam['value']) != 2) 
                        break;

                    list($mixedMin, $mixedMax) = $aSearchParam['value'];

                    if(!empty($mixedMin)) {
                        $sWhereConditions .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $sSearchParam . "` >= :" . $sSearchParam . "_from";
                        
                        $aMethod['params'][1][$sSearchParam . "_from"] = $mixedMin; 
                    }

                    if(!empty($mixedMax)) {
                        $sWhereConditions .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $sSearchParam . "` <= :" . $sSearchParam . "_to";

                        $aMethod['params'][1][$sSearchParam . "_to"] = $mixedMax; 
                    }
                    break;

                default:
                    if (!$this->isValidOperator($aSearchParam['operator'])) {
                        throw new Exception('Invalid operator in _getEntriesBySearchIds method');
                    }
                    $sSearchValue = " " . $aSearchParam['operator'] . " :" . $sSearchParam;
                    $aMethod['params'][1][$sSearchParam] = $aSearchParam['value'];
            }

            if(!empty($sSearchValue))
                $sWhereConditions .= " AND `" . $CNF['TABLE_ENTRIES'] . "`.`" . $sSearchParam . "`" . $sSearchValue;
        }

        $sWhereClause .= " AND (" . $sWhereConditions . ")"; 

        $this->_addCustomConditions($aParams, $aMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);

        $this->_getEntriesBySearchIdsOrder($aParams, $sOrderClause);
    }

    protected function _addCustomConditions($aParams, &$aMethod, &$sSelectClause, &$sJoinClause, &$sWhereClause, &$sOrderClause, &$sLimitClause)
    {
        $this->_addConditionsForAuthorStatus($aParams, $aMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);

        $this->_addConditionsForCf($aParams, $aMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);
    }
    
    protected function _addConditionsForAuthorStatus($aParams, &$aMethod, &$sSelectClause, &$sJoinClause, &$sWhereClause, &$sOrderClause, &$sLimitClause)
    {
        $CNF = &$this->_oConfig->CNF;
        if (empty($CNF['FIELD_AUTHOR']))
            return;

        if (!empty($aParams['show_all_content']))
            return;

        $sJoinClause .= " INNER JOIN `sys_profiles` as `p` ON (`p`.`id` = `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_AUTHOR']}` AND `p`.`status` = 'active') ";
    }

    protected function _addConditionsForCf($aParams, &$aMethod, &$sSelectClause, &$sJoinClause, &$sWhereClause, &$sOrderClause, &$sLimitClause)
    {
        $CNF = &$this->_oConfig->CNF;
        if(empty($CNF['FIELD_CF']))
            return;

        $oCf = BxDolContentFilter::getInstance();
        if(!$oCf->isEnabled()) 
            return;

        $sWhereClause .= $oCf->getSQLParts($CNF['TABLE_ENTRIES'], $CNF['FIELD_CF']);
    }

    protected function _getEntriesBySearchIdsOrder($aParams, &$sOrderClause)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParams['search_params']['order']) || !is_array($aParams['search_params']['order'])) 
            $aParams['search_params']['order'] = array(
                array('table' => $CNF['TABLE_ENTRIES'], 'field' => $CNF['FIELD_ADDED'], 'direction' => 'DESC')
            );

        $aOrders = array();
        foreach($aParams['search_params']['order'] as $aOrder) {
            $sTable = (isset($aOrder['table']) ? $aOrder['table'] : $CNF['TABLE_ENTRIES']);
            $sField = $CNF['FIELD_ADDED'];
            if (!empty($aOrder['field'])) {                
                if (!$this->isFieldExists($sTable, $aOrder['field'])) {
                    throw new Exception('Invalid field ' . $aOrder['field'] . ' in table ' . $sTable . ' in _getEntriesBySearchIdsOrder method');
                }
                $sField = $aOrder['field'];
            }

            $sDir = 'DESC';
            if (!empty($aOrder['direction'])) {
                $sDir = strtoupper($aOrder['direction']) == 'ASC' ? 'ASC' : 'DESC';
            }

            $aOrders[] = "`" . $sTable . "`.`" . $sField . "` " . $sDir;
        }

        $sOrderClause .= implode(', ', $aOrders);
    }

    protected function _getEbsiLike($sValue)
    {
        return $this->escape("%" . preg_replace('/\s+/', '%', $sValue) . "%");
    }
    
    public function getStatByProfile($iAuthorId)
    {
        $aBindings = array(
            'author' => $iAuthorId
        );
        $CNF = &$this->_oConfig->CNF;
        
        return $this->getRow("SELECT COUNT(id) AS count, SUM(views) AS views, SUM(votes) AS votes, SUM(score) AS score FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `author`=:author", $aBindings);
    }
}

/** @} */
