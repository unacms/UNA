<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxTasksDb extends BxBaseModTextDb
{
    protected $_aSqlMarkers;

    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_aSqlMarkers = [
            'logged_pid' => bx_get_logged_profile_id()
        ];
    }

    public function getContexts($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tc`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `tc`.`id` = :id";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_CONTEXTS'] . "` AS `tc` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getContextRepository($iId) 
    {
        $aContext = $this->getContexts([
            'sample' => 'id', 
            'id' => $iId
        ]);

        return $aContext && is_array($aContext) ? $aContext : false;
    }

    public function getLists ($iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getAll("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `context_id` = :context_id", [
            'context_id' => $iContextId
        ]);
    }
	
    public function getList ($iId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getRow("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `id` = :id", [
            'id' => $iId
        ]);
    }
    
    public function deleteList ($iId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if($this->query("DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_TASKLIST'] . "`=:id", ['id' => $iId]) === false)
            return false;

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `id`=:id", [
            'id' => $iId
        ]) > 0;
    }

    public function getTasks ($iContextId = 0, $iListId = false, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = [];
        $sSelectClause = "`te`.*";
        $sJoinClause = $sWhereClause = "";

        if(($sField = $CNF['FIELD_ALLOW_VIEW_TO']) && $iContextId) {
            $aBindings[$sField] = -$iContextId;
            $sWhereClause .= " AND `te`.`" . $sField . "` = :" . $sField;
        }

        if(($sField = $CNF['FIELD_TASKLIST']) && $iListId !== false) {
            $aBindings[$sField] = $iListId;
            $sWhereClause .= " AND `te`.`" . $sField . "` = :" . $sField;
        }

        if(($iFilter = (int)($aParams['filter'] ?? 0)) && ($aFilter = $this->getFilterById($iFilter))) {
            if(($aFltJoin = $aFilter['conditions']['join'] ?? false) && ($sFltJoin = $this->_getSqlJoinFrom($aFltJoin)) != '')
                $sJoinClause .= " " . $sFltJoin;

            if(($aFltWhere = $aFilter['conditions']['where'] ?? false) && ($sFltWhere = $this->_getSqlWhereFrom($aFltWhere)) != '')
                $sWhereClause .= " AND " . $sFltWhere;
        }

        if(($iProfileId = $aParams['for_profile'] ?? false)) {
            $aBindings['profile_id'] = (int)$iProfileId;
            $sJoinClause .= " LEFT JOIN `" . $CNF['TABLE_ASSIGNMENTS'] . "` AS `tafp` ON `te`.`id`=`tafp`.`content`";
            $sWhereClause .= " AND (`te`.`" . $CNF['FIELD_AUTHOR'] . "`=:profile_id OR `tafp`.`initiator`=:profile_id)";
        }

        if(($oCf = BxDolContentFilter::getInstance()) && $oCf->isEnabled())
            $sWhereClause .= $oCf->getSQLParts('te', $CNF['FIELD_CF']);

        if(($aParams['with_stats'] ?? false)) {
            $sSelectClause .= $this->prepareAsString(", (SELECT SUM(`value`) FROM `" . $CNF['TABLE_TIME_TRACK'] . "` WHERE `object_id`=`te`.`id` AND `author_id`=?) AS `time`, `tt`.`sum` AS `time_total`", bx_get_logged_profile_id());

            $sJoinClause .= " LEFT JOIN `" . $CNF['TABLE_TIME'] . "` AS `tt` ON `te`.`id`=`tt`.`object_id`";
        }

        return $this->getAll("SELECT DISTINCT " . $sSelectClause . " FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te`" . $sJoinClause . " WHERE 1" . $sWhereClause, $aBindings);
    }

    public function getEntriesByDate($sDateFrom, $sDateTo, $aSQLPart = array())
    {
        // validate input data
        if (false === ($oDateFrom = date_create($sDateFrom, new DateTimeZone('UTC'))))
            return array();
        if (false === ($oDateTo = date_create($sDateTo, new DateTimeZone('UTC'))))
            return array();
        if ($oDateFrom > $oDateTo)
            return array();

        // increase start and end date to cover timezones
        $oDateFrom = $oDateFrom->sub(new DateInterval("P1D"));
        $oDateTo = $oDateTo->add(new DateInterval("P1D"));

        // look throught all days in the interval
        $oDateIter = clone($oDateFrom);
        $aEntries = array();
        while ($oDateIter->format('Y-m-d') != $oDateTo->format('Y-m-d')) {

            $oDateMin = date_create($oDateIter->format('Y-m-d') . '00:00:00', new DateTimeZone('UTC'));
            $oDateMax = date_create($oDateIter->format('Y-m-d') . '23:59:59', new DateTimeZone('UTC'));
                
            // get all events for the specific day            
            $oDateMonthBegin = date_create($oDateIter->format('Y-m-01'), new DateTimeZone('UTC'));
            $iWeekOfMonth = $oDateIter->format('W') - $oDateMonthBegin->format('W') + 1;
            $aBindings = array(
                'timestamp_min' => $oDateMin->getTimestamp(),
                'timestamp_max' => $oDateMax->getTimestamp(),
              
            );

            $sWhere = isset($aSQLPart['where']) ? $aSQLPart['where'] : '';
            $a = $this->getAll("SELECT DISTINCT `bx_tasks_tasks`.`id`, `bx_tasks_tasks`.`title` AS `title`, `bx_tasks_tasks`.`due_date`
				FROM `bx_tasks_tasks`
                WHERE (`bx_tasks_tasks`.`due_date` >= :timestamp_min AND `bx_tasks_tasks`.`due_date` <= :timestamp_max ) $sWhere
            ", $aBindings);

            // prepare variables for each event
            $sCurrentDay = $oDateIter->format('Y-m-d');
            foreach ($a as $k => $r) {
                $oDateStart = new DateTime();
                $oDateStart->setTimestamp($r['due_date']);
                $oDateStart->setTimezone(new DateTimeZone('UTC'));
                $oDateEnd = new DateTime();
                $oDateEnd->setTimestamp($r['due_date']);
                $oDateEnd->setTimezone(new DateTimeZone('UTC'));
                $oDuration = $oDateStart->diff($oDateEnd);

                $sHoursStart = $oDateStart->format('H:i:s');

                $oStart = date_create($sCurrentDay . ' ' . $sHoursStart, new DateTimeZone('UTC'));
                $oEnd = $oStart ? clone($oStart) : null;
                $oEnd = $oEnd ? $oEnd->add($oDuration) : null;

                $a[$k]['start'] = $oStart ? $oStart->format('Y-m-d') : 0;
                $a[$k]['start_utc'] = $oStart ? $oStart->getTimestamp() : 0;
                $a[$k]['url'] = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->_oConfig->CNF['URI_VIEW_ENTRY'] . '&id=' . $r['id']));
            }

            // merge with all other events
            $aEntries = array_merge($aEntries, $a);

            // go to the next day
            $oDateIter = $oDateIter->add(new DateInterval("P1D"));
        }

        return $aEntries;
    }

    public function expireEntries()
    {
        $CNF = $this->_oConfig->CNF;

        $aResult = $this->getColumn("SELECT `id` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_DUE_DATE'] . "` < UNIX_TIMESTAMP()  AND `" . $CNF['FIELD_EXPIRED'] . "` = '0'");
        if(empty($aResult) || !is_array($aResult))
            return false;

        return count($aResult) == (int)$this->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $CNF['FIELD_EXPIRED'] . "` = '1' WHERE `id` IN (" . $this->implode_escape($aResult) . ")") ? $aResult : false;
    }

    public function getContextsIdsByType($sType, $iProfileId)
    {
        $CNF = $this->_oConfig->CNF;

        //--- Add own tasks
        $sQuery = '(SELECT `tp`.`id` FROM `' . $CNF['TABLE_ENTRIES'] . '` AS `tt` INNER JOIN `sys_profiles` AS `tp` ON ABS(`tt`.`allow_view_to`)=`tp`.`id` AND `tp`.`type`=:type WHERE `tt`.`author`=:author GROUP BY `tp`.`id`)';

        //--- Add assigned tasks
        $oAssignments = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);
        $aSql = $oAssignments->getConnectedContentAsSQLParts('tt', 'id', $iProfileId);

        if($aSql && ($sJoin = $aSql['join'] ?? false))
            $sQuery .= ' UNION (SELECT `tp`.`id` FROM `' . $CNF['TABLE_ENTRIES'] . '` AS `tt` INNER JOIN `sys_profiles` AS `tp` ON ABS(`tt`.`allow_view_to`)=`tp`.`id` AND `tp`.`type`=:type ' . $sJoin . ' WHERE 1)';

        return $this->getColumn($sQuery, [
            'type' => $sType,
            'author' => $iProfileId
        ]);
    }

    public function getFilters($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tf`.*';
        $sJoinClause = $sWhereClause = '';
        $sOrderClause = '`tf`.`added` ASC, `tf`.`permanent` ASC';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `tf`.`id` = :id";
                    break;

                case 'temporary':
                    $aMethod['name'] = 'getRow';

                    $sWhereClause .= " AND `tf`.`permanent` = '0'";

                    if(($iContextId = $aParams['context_id'] ?? false) !== false) {
                        $aMethod['params'][1]['context_id'] = $iContextId;
                        
                        $sWhereClause .= " AND `tf`.`context_id` = :context_id";
                    }

                    if(($iAuthor = $aParams['author'] ?? false) !== false) {
                        $aMethod['params'][1]['author'] = $iAuthor;

                        $sWhereClause .= " AND `tf`.`author` = :author";
                    }
                    break;

                case 'author':
                    $aMethod['params'][1] = [
                        'author' => $aParams['author']
                    ];

                    $sWhereClause = "AND `tf`.`author` = :author";

                    if(isset($aParams['active']) && $aParams['active'] === true)
                        $sWhereClause .= " AND `tf`.`active` <> '0'";
                    break;

                case 'active':
                    $sWhereClause .= " AND `tf`.`active` <> '0'";

                    if(($iContextId = $aParams['context_id'] ?? false) !== false) {
                        $aMethod['params'][1]['context_id'] = $iContextId;
                        
                        $sWhereClause .= " AND `tf`.`context_id` = :context_id";
                    }

                    if(($iAuthor = $aParams['author'] ?? false) !== false) {
                        $aMethod['params'][1]['author'] = $iAuthor;

                        $sWhereClause .= " AND `tf`.`author` = :author";
                    }

                    if(($iPermanent = $aParams['permanent'] ?? false) !== false) {
                        $aMethod['params'][1]['permanent'] = $iPermanent;

                        $sWhereClause .= " AND `tf`.`permanent` = :permanent";
                    }

                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_FILTERS'] . "` AS `tf` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }
    
    public function getFilterById($iId) 
    {
        $aFilter = $this->getFilters(['sample' => 'id', 'id' => $iId]);
        if(!$aFilter || !is_array($aFilter))
            return false;
     
        if(($sK = 'conditions') && $aFilter[$sK])
            $aFilter[$sK] = json_decode($aFilter[$sK], true);

        return $aFilter;
    }

    public function cleanFilters($iContextId, $iAuthor, $iLifetime = 3600) 
    {
        $CNF = &$this->_oConfig->CNF;

        $this->query("DELETE FROM `" . $CNF['TABLE_FILTERS'] . "` WHERE `context_id` = :context_id AND `author` = :author AND UNIX_TIMESTAMP() - `added` > :lifetime AND `permanent` = '0'", [
            'context_id' => $iContextId,
            'author' => $iAuthor,
            'lifetime' => $iLifetime
        ]);
    }

    public function getTemporaryFilterId($iContextId, $iAuthorId) 
    {
        $aFilter = $this->getFilters([
            'sample' => 'temporary', 
            'context_id' => $iContextId, 
            'author' => $iAuthorId
        ]);

        return $aFilter && is_array($aFilter) ? $aFilter['id'] : 0;
    }

    public function getTimeTracks($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`ttt`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `ttt`.`id` = :id";
                    break;

                case 'assignees':
                    $aMethod['name'] = 'getColumn';

                    $sSelectClause = 'DISTINCT `ttt`.`author_id`';
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_TIME_TRACK'] . "` AS `ttt` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function insertTimeTrack($aParamsSet)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet))
            return false;

        return $this->query("INSERT INTO `" . $CNF['TABLE_TIME_TRACK'] . "` SET " . $this->arrayToSQL($aParamsSet)) ? $this->lastId() : false;
    }

    public function getTimers($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tt`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `tt`.`id` = :id";
                    break;

                case 'content_profile_ids':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'content_id' => $aParams['content_id'],
                        'profile_id' => $aParams['profile_id']
                    ];

                    $sWhereClause = "AND `tt`.`content_id` = :content_id AND `tt`.`profile_id` = :profile_id";
                    break;

                case 'profile_id':
                    $aMethod['params'][1] = [
                        'profile_id' => $aParams['profile_id']
                    ];

                    $sWhereClause = "AND `tt`.`profile_id` = :profile_id";

                    if(isset($aParams['active']) && $aParams['active'] === true) {
                        $aMethod['name'] = 'getRow';

                        $sWhereClause .= " AND `tt`.`started` <> '0'";
                    }
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_TIMERS'] . "` AS `tt` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function isTimerStarted($iObjectId, $iAuthorId)
    {
        $aTimer = $this->getTimers([
            'sample' => 'content_profile_ids', 
            'content_id' => $iObjectId, 
            'profile_id' => $iAuthorId
        ]);

        return ($aTimer['started'] ?? 0) != 0;
    }

    public function insertTimer($aParamsSet)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet))
            return false;

        return $this->query("INSERT INTO `" . $CNF['TABLE_TIMERS'] . "` SET " . $this->arrayToSQL($aParamsSet)) ? $this->lastId() : false;
    }
    
    public function updateTimer($aParamsSet, $aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        return $this->query("UPDATE `" . $CNF['TABLE_TIMERS'] . "` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }

    public function deleteTimer($aParamsWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aParamsWhere))
            return false;

        return $this->query("DELETE FROM `" . $CNF['TABLE_TIMERS'] . "` WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }

    public function getPreLists($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tpl`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'name':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'name' => $aParams['name']
                    ];

                    $sWhereClause = "AND `tpl`.`name` = :name";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_PRE_LISTS'] . "` AS `tpl` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getPreValues($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tpv`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'value_to_use':
                    $aMethod['name'] = 'getOne';
                    $aMethod['params'][1] = [
                        'context_id' => $aParams['context_id'],
                        'list' => $aParams['list']
                    ];

                    $sSelectClause = "IF(ISNULL(MAX(`tpv`.`value`)), 0, MAX(`tpv`.`value`)) + 1";
                    $sWhereClause = "AND `tpv`.`context_id` = :context_id AND `tpv`.`list` = :list";
                    break;

                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `tpv`.`id` = :id";
                    break;

                case 'context_list_value':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'context_id' => $aParams['context_id'],
                        'list' => $aParams['list'],
                        'value' => $aParams['value']
                    ];

                    $sWhereClause = "AND `tpv`.`context_id` = :context_id AND `tpv`.`list` = :list AND `tpv`.`value` = :value";
                    break;

                case 'context_list':
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'value';
                    $aMethod['params'][2] = [
                        'context_id' => $aParams['context_id'],
                        'list' => $aParams['list']
                    ];

                    $sWhereClause = "AND `tpv`.`context_id` = :context_id AND `tpv`.`list` = :list";
                    
                    if(($iActive = $aParams['active'] ?? false) !== false) {
                        $aMethod['params'][2]['active'] = (int)$iActive;

                        $sWhereClause .= " AND `tpv`.`active` = :active";
                    }

                    $sOrderClause = "`tpv`.`order` ASC";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_PRE_VALUES'] . "` AS `tpv` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    /**
     * Legend: 
     * grp - group
     * cnd - condition
     * cnds - conditions
     * 
     * t - table
     * f - field
     * o - operation
     * v - value
     * j - joining type (INNER, LEFT)
     * 
     * Addons:
     * +a - alias, like ta - table alias
     * +j - join, like tj - table join or fj - field join
     * +m - main, like tm - table main or fm - field main
     */
    protected function _getSqlJoinFrom($aCnd)
    {
        return $this->_getSqlClauseFrom('join', $aCnd);
    }

    protected function _getSqlJoinFromGroup($aGrp)
    {
        $sResult = "";
        if(empty($aGrp['cnds']) || !is_array($aGrp['cnds']))
            return $sResult;

        $sOprGrp = " ";
        foreach($aGrp['cnds'] as $aCnd)
            if(($sResultCnd = $this->_getSqlJoinFromCondition($aCnd)) != '')
                $sResult .= $sOprGrp . $sResultCnd;

        return trim($sResult, $sOprGrp);
    }

    protected function _getSqlJoinFromCondition($aCnd)
    {
    	$sResult = "";
    	if(!$this->_isJoinCondition($aCnd))
            return $sResult;

        $sFldJ = "`" . ($aCnd['taj'] ?? $aCnd['tj']) . "`.`" . $aCnd['fj'] . "`";

        $sFldM = "`" . $aCnd['fm'] . "`";
        if(($sTblAlsM = $aCnd['tam'] ?? ($aCnd['tm'] ?? false)))
            $sFldM = "`" . $sTblAlsM . "`." . $sFldM;

        return $aCnd['j'] . " JOIN `" . $aCnd['tj'] . "`" . (($sTblAlsJ = $aCnd['taj'] ?? false) ? " AS `" . $sTblAlsJ . "`" : "") . " ON (" . $sFldM . " = " . $sFldJ . ")";
    }

    protected function _getSqlWhereFrom($aCnd)
    {
        return $this->_getSqlClauseFrom('where', $aCnd);
    }

    protected function _getSqlWhereFromGroup($aGrp)
    {
        $sResult = "";
        if(!isset($aGrp['o'], $aGrp['cnds']) || empty($aGrp['cnds']) || !is_array($aGrp['cnds']))
            return $sResult;

        $sOprGrp = " " . $aGrp['o'] . " ";
        foreach($aGrp['cnds'] as $aCnd)
            if(($sResultCnd = $this->_getSqlWhereFrom($aCnd)) != '')
                $sResult .= $sOprGrp . $sResultCnd;

        if(($sResult = trim($sResult, $sOprGrp)) != '')
            $sResult = "(" . $sResult . ")";

    	return $sResult;
    }

    protected function _getSqlWhereFromCondition($aCnd)
    {
        $sResult = "";
        if(!$this->_isWhereCondition($aCnd))
            return $sResult;

        if(($sMethod = '_getSqlWhereFromCondition' . bx_gen_method_name($aCnd['f'])) && method_exists($this, $sMethod)) {
            $mixedResult = $this->$sMethod($aCnd);
            if(!$this->_isWhereCondition($mixedResult))
                return $mixedResult;

            $aCnd = $mixedResult;    
        }

        $sFld = "`" . $aCnd['f'] . "`";
        if(($sTbl = $aCnd['t'] ?? ''))
            $sFld = "`" . $sTbl . "`." . $sFld;

        switch($aCnd['o']) {
            case 'IN':
                if(empty($aCnd['v']) || !is_array($aCnd['v']))
                    break;

                $sResult .= $sFld . " IN (" . $this->implode_escape($aCnd['v']) . ")";
                break;
            
            case 'NOT IN':
                if(empty($aCnd['v']) || !is_array($aCnd['v']))
                    break;

                $sResult .= $sFld . " NOT IN (" . $this->implode_escape($aCnd['v']) . ")";
                break;

            case 'LIKE':
                $sResult .= $sFld . " LIKE " . $this->escape('%' . $aCnd['v'] . '%');
                break;

            default:
                $sResult .= $sFld . " " . $aCnd['o'] . " " . $this->escape($aCnd['v']);
        }

        return $sResult;
    }

    protected function _isJoinCondition($mixedCnd)
    {
        return is_array($mixedCnd) && isset($mixedCnd['j'], $mixedCnd['tj'], $mixedCnd['fj'], $mixedCnd['fm']);
    }

    protected function _isWhereCondition($mixedCnd)
    {
        return is_array($mixedCnd) && isset($mixedCnd['f'], $mixedCnd['v'], $mixedCnd['o']);
    }

    protected function _getSqlClauseFrom($sType, $aCnd)
    {
        $sMethod = '';
        if(($aCnd['grp'] ?? false) === true)
            $sMethod = 'Group';
        else if(($aCnd['cnd'] ?? false) === true)
            $sMethod = 'Condition';

        if(!$sMethod || !method_exists($this, ($sMethod = '_getSql' . bx_gen_method_name($sType) . 'From' . $sMethod)))
            return '';

        $sResult = $this->$sMethod($aCnd);
        if($sResult && $this->_aSqlMarkers)
            $sResult = bx_replace_markers($sResult, $this->_aSqlMarkers);

        return $sResult;
    }
}

/** @} */
