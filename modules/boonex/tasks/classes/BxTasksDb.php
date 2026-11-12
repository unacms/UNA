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

    public function getExportTimeFields()
    {
        return $this->getFields('bx_tasks_time_track');
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

    /**
     * The lists of these ids (API v2: a page of tasks reads its lists at once).
     * @return array list id => row
     */
    public function getListsByIds($aIds)
    {
        $CNF = &$this->_oConfig->CNF;

        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        if(!$aIds)
            return [];

        return $this->getAllWithKey("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `id` IN (" . $this->implode_escape($aIds) . ")", 'id');
    }

    /**
     * How many active tasks of a context each of its lists has (0 is its inbox: tasks in no
     * list), and how many of them are not completed (API v2's TaskList counts).
     * @return array list id => ['total' => int, 'open' => int]
     */
    public function getListCounts($iContextId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aRows = $this->getAll("SELECT `" . $CNF['FIELD_TASKLIST'] . "` AS `list_id`, COUNT(*) AS `total`, SUM(`" . $CNF['FIELD_COMPLETED'] . "` = 0) AS `open`
            FROM `" . $CNF['TABLE_ENTRIES'] . "`
            WHERE `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = :privacy AND `" . $CNF['FIELD_STATUS'] . "` = 'active' AND `" . $CNF['FIELD_STATUS_ADMIN'] . "` = 'active'
            GROUP BY `" . $CNF['FIELD_TASKLIST'] . "`", [
            'privacy' => (string)(-(int)$iContextId)
        ]);

        $aResult = [];
        foreach($aRows as $aRow)
            $aResult[(int)$aRow['list_id']] = ['total' => (int)$aRow['total'], 'open' => (int)$aRow['open']];

        return $aResult;
    }

    /**
     * Who is assigned to each of these tasks, the first assigned first (API v2: a page of tasks
     * reads its assignees at once).
     * @return array task id => profile ids
     */
    public function getAssigneesByTasks($aIds)
    {
        $CNF = &$this->_oConfig->CNF;

        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        if(!$aIds)
            return [];

        $aResult = [];
        foreach($this->getAll("SELECT `content`, `initiator` FROM `" . $CNF['TABLE_ASSIGNMENTS'] . "` WHERE `content` IN (" . $this->implode_escape($aIds) . ") ORDER BY `added`, `id`") as $aRow)
            $aResult[(int)$aRow['content']][] = (int)$aRow['initiator'];

        return $aResult;
    }

    /**
     * The privacy values (a context's negative profile id, or a privacy group) of the tasks
     * assigned to a profile and/or added by one, each once (API v2: which of those a viewer
     * may see is decided per value, so a page reads only tasks it may show).
     * @return array of int
     */
    public function getPrivacyValuesOfTasks($mixedAssignees, $iAuthor)
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = [];
        $sJoin = $sWhere = '';
        $aAssignees = array_values(array_filter(array_map('intval', (array)$mixedAssignees)));
        if($aAssignees)
            $sJoin = " INNER JOIN `" . $CNF['TABLE_ASSIGNMENTS'] . "` AS `ta` ON `ta`.`content` = `te`.`" . $CNF['FIELD_ID'] . "` AND `ta`.`initiator` IN (" . $this->implode_escape($aAssignees) . ")";
        if((int)$iAuthor) {
            $sWhere = " AND `te`.`" . $CNF['FIELD_AUTHOR'] . "` = :author";
            $aBindings['author'] = (int)$iAuthor;
        }

        return array_map('intval', $this->getColumn("SELECT DISTINCT `te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te`" . $sJoin . " WHERE 1" . $sWhere, $aBindings));
    }

    /**
     * The conditions of a tasks filter as SQL for a WHERE clause ("" for none, else starting
     * with " AND "), on the tasks table under the name or alias $sTable (API v2: a list of tasks
     * and its counts read the same conditions). $aFilter: `lists` (list ids, 0 the Inbox),
     * `completed` (0 or 1), `types`, `priorities`, `estimates`, `states` (pre-values),
     * `labels` (sticker values: a task with any of them), `assignees` (profile ids: a task
     * assigned to any of them), `author` (a profile id) and `filter` (a saved filter's row, as
     * getFilterById reads it: its conditions as the site's Tasks page applies them).
     */
    public function getTasksFilterSql($aFilter, $sTable)
    {
        $CNF = &$this->_oConfig->CNF;

        $sT = "`" . $sTable . "`";
        $aParts = [];

        $aIn = [
            'lists' => $CNF['FIELD_TASKLIST'],
            'types' => $CNF['FIELD_TYPE'],
            'priorities' => $CNF['FIELD_PRIORITY'],
            'estimates' => $CNF['FIELD_ESTIMATE'],
            'states' => $CNF['FIELD_STATE'],
        ];
        foreach($aIn as $sKey => $sField)
            if(isset($aFilter[$sKey]) && is_array($aFilter[$sKey]) && $aFilter[$sKey])
                $aParts[] = $sT . ".`" . $sField . "` IN (" . $this->implode_escape(array_map('intval', $aFilter[$sKey])) . ")";

        if(isset($aFilter['completed']) && $aFilter['completed'] !== null)
            $aParts[] = $sT . ".`" . $CNF['FIELD_COMPLETED'] . "` = " . ((int)$aFilter['completed'] ? 1 : 0);

        if(!empty($aFilter['labels']) && is_array($aFilter['labels'])) {
            // stickers are a set: bit (value - 1) for each value
            $iMask = 0;
            foreach($aFilter['labels'] as $iValue)
                if((int)$iValue >= 1 && (int)$iValue <= 31)
                    $iMask |= 1 << ((int)$iValue - 1);
            $aParts[] = "(" . $sT . ".`" . $CNF['FIELD_STICKERS'] . "` & " . $iMask . ") <> 0";
        }

        if(!empty($aFilter['assignees']) && is_array($aFilter['assignees']))
            $aParts[] = $sT . ".`" . $CNF['FIELD_ID'] . "` IN (SELECT `content` FROM `" . $CNF['TABLE_ASSIGNMENTS'] . "` WHERE `initiator` IN (" . $this->implode_escape(array_map('intval', $aFilter['assignees'])) . "))";

        if(!empty($aFilter['author']))
            $aParts[] = $sT . ".`" . $CNF['FIELD_AUTHOR'] . "` = " . (int)$aFilter['author'];

        if(!empty($aFilter['filter']) && is_array($aFilter['filter'])) {
            // the saved filter's own SQL, as getTasks applies it, over the tasks it keeps
            $this->_aSqlMarkers['logged_pid'] = (int)bx_get_logged_profile_id();
            $aConditions = $aFilter['filter']['conditions'] ?? [];
            $sJoin = ($aJoin = $aConditions['join'] ?? false) ? $this->_getSqlJoinFrom($aJoin) : '';
            $sWhere = ($aWhere = $aConditions['where'] ?? false) ? $this->_getSqlWhereFrom($aWhere) : '';
            $aParts[] = $sT . ".`" . $CNF['FIELD_ID'] . "` IN (SELECT `te`.`" . $CNF['FIELD_ID'] . "` FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te` " . $sJoin . " WHERE " . ($sWhere !== '' ? $sWhere : '1') . ")";
        }

        return $aParts ? " AND " . implode(" AND ", $aParts) : "";
    }

    /**
     * How many active tasks with these privacy values (a context's negative profile id, a
     * privacy group) and the conditions of getTasksFilterSql (on the alias `te`) there are by
     * each state, priority, type, estimate, list ("privacy:list"), sticker set, context and assignee, and how many
     * of those are open, in one query (API v2's task counts).
     * @return array facet => value => ['total' => int, 'open' => int]
     */
    public function getTaskFacets($aPrivacy, $sFilterSql)
    {
        $CNF = &$this->_oConfig->CNF;

        $aPrivacy = array_values(array_unique(array_map('strval', array_map('intval', (array)$aPrivacy))));
        if(!$aPrivacy)
            return [];

        $sWhere = "`te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` IN (" . $this->implode_escape($aPrivacy) . ") AND `te`.`" . $CNF['FIELD_STATUS'] . "` = 'active' AND `te`.`" . $CNF['FIELD_STATUS_ADMIN'] . "` = 'active'" . $sFilterSql;
        if(($oCf = BxDolContentFilter::getInstance()) && $oCf->isEnabled())
            $sWhere .= $oCf->getSQLParts('te', $CNF['FIELD_CF']);

        $sFrom = " FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te`";
        $sCount = ", COUNT(*) AS `total`, SUM(`te`.`" . $CNF['FIELD_COMPLETED'] . "` = 0) AS `open`";
        $aSelects = [];
        foreach([
            'state' => $CNF['FIELD_STATE'],
            'priority' => $CNF['FIELD_PRIORITY'],
            'type' => $CNF['FIELD_TYPE'],
            'estimate' => $CNF['FIELD_ESTIMATE'],
            'stickers' => $CNF['FIELD_STICKERS'],
            'privacy' => $CNF['FIELD_ALLOW_VIEW_TO'],
        ] as $sFacet => $sField)
            $aSelects[] = "(SELECT '" . $sFacet . "' AS `facet`, `te`.`" . $sField . "` AS `value`" . $sCount . $sFrom . " WHERE " . $sWhere . " GROUP BY `te`.`" . $sField . "`)";
        // a list is a context's (each one's Inbox is 0): "privacy:list"
        $aSelects[] = "(SELECT 'list' AS `facet`, CONCAT(`te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "`, ':', `te`.`" . $CNF['FIELD_TASKLIST'] . "`) AS `value`" . $sCount . $sFrom . " WHERE " . $sWhere . " GROUP BY `te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "`, `te`.`" . $CNF['FIELD_TASKLIST'] . "`)";
        $aSelects[] = "(SELECT 'assignee' AS `facet`, `ta`.`initiator` AS `value`" . $sCount . $sFrom . " INNER JOIN `" . $CNF['TABLE_ASSIGNMENTS'] . "` AS `ta` ON `ta`.`content` = `te`.`" . $CNF['FIELD_ID'] . "` WHERE " . $sWhere . " GROUP BY `ta`.`initiator`)";

        $aResult = [];
        foreach($this->getAll(implode(" UNION ALL ", $aSelects)) as $aRow)
            $aResult[$aRow['facet']][(string)$aRow['value']] = ['total' => (int)$aRow['total'], 'open' => (int)$aRow['open']];

        return $aResult;
    }

    /**
     * The contexts a profile added tasks in or has tasks assigned in, as the Tasks page's
     * context menus read them (getContextsIdsByType), of every kind at once.
     * @return array of context profile ids
     */
    public function getTaskContextIdsOfProfile($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        return array_map('intval', $this->getColumn("SELECT DISTINCT -CAST(`te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` AS SIGNED) AS `context_id`
            FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te`
            LEFT JOIN `" . $CNF['TABLE_ASSIGNMENTS'] . "` AS `ta` ON `ta`.`content` = `te`.`" . $CNF['FIELD_ID'] . "` AND `ta`.`initiator` = :profile
            WHERE CAST(`te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` AS SIGNED) < 0 AND (`te`.`" . $CNF['FIELD_AUTHOR'] . "` = :profile OR `ta`.`initiator` IS NOT NULL)
            ORDER BY `context_id`", [
            'profile' => (int)$iProfileId
        ]));
    }

    /**
     * The lists of these contexts, each context's in the order they were made.
     * @return array context id => list rows
     */
    public function getListsByContexts($aIds)
    {
        $CNF = &$this->_oConfig->CNF;

        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        if(!$aIds)
            return [];

        $aResult = [];
        foreach($this->getAll("SELECT * FROM `" . $CNF['TABLE_LISTS'] . "` WHERE `" . $CNF['FIELD_LIST_CONTEXT_ID'] . "` IN (" . $this->implode_escape($aIds) . ") ORDER BY `" . $CNF['FIELD_LIST_ID'] . "`") as $aRow)
            $aResult[(int)$aRow[$CNF['FIELD_LIST_CONTEXT_ID']]][] = $aRow;

        return $aResult;
    }

    /**
     * getListCounts of several contexts in one query.
     * @return array context id => list id => ['total' => int, 'open' => int]
     */
    public function getListCountsByContexts($aIds)
    {
        $CNF = &$this->_oConfig->CNF;

        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        if(!$aIds)
            return [];

        $aPrivacy = array_map(function ($iId) { return (string)(-$iId); }, $aIds);
        $aRows = $this->getAll("SELECT `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` AS `privacy`, `" . $CNF['FIELD_TASKLIST'] . "` AS `list_id`, COUNT(*) AS `total`, SUM(`" . $CNF['FIELD_COMPLETED'] . "` = 0) AS `open`
            FROM `" . $CNF['TABLE_ENTRIES'] . "`
            WHERE `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` IN (" . $this->implode_escape($aPrivacy) . ") AND `" . $CNF['FIELD_STATUS'] . "` = 'active' AND `" . $CNF['FIELD_STATUS_ADMIN'] . "` = 'active'
            GROUP BY `" . $CNF['FIELD_ALLOW_VIEW_TO'] . "`, `" . $CNF['FIELD_TASKLIST'] . "`");

        $aResult = [];
        foreach($aRows as $aRow)
            $aResult[-(int)$aRow['privacy']][(int)$aRow['list_id']] = ['total' => (int)$aRow['total'], 'open' => (int)$aRow['open']];

        return $aResult;
    }

    /**
     * The contexts' own values of these pre-lists (`type`, `sticker`), in their order.
     * @return array context id => list => value => row
     */
    public function getPreValuesByContexts($aIds, $aLists)
    {
        $CNF = &$this->_oConfig->CNF;

        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds))));
        if(!$aIds || !$aLists)
            return [];

        $aResult = [];
        foreach($this->getAll("SELECT * FROM `" . $CNF['TABLE_PRE_VALUES'] . "` WHERE `context_id` IN (" . $this->implode_escape($aIds) . ") AND `list` IN (" . $this->implode_escape(array_values($aLists)) . ") ORDER BY `order` ASC, `id` ASC") as $aRow)
            $aResult[(int)$aRow['context_id']][$aRow['list']][(string)$aRow['value']] = $aRow;

        return $aResult;
    }

    /**
     * A profile's timers on these tasks (all of its timers for null).
     * @return array task id => timer row
     */
    public function getTimersOfProfile($iProfileId, $aTaskIds = null)
    {
        $CNF = &$this->_oConfig->CNF;

        $sWhere = '';
        if($aTaskIds !== null) {
            $aTaskIds = array_values(array_unique(array_filter(array_map('intval', (array)$aTaskIds))));
            if(!$aTaskIds)
                return [];
            $sWhere = " AND `content_id` IN (" . $this->implode_escape($aTaskIds) . ")";
        }

        return $this->getAllWithKey("SELECT * FROM `" . $CNF['TABLE_TIMERS'] . "` WHERE `profile_id` = :profile_id" . $sWhere . " ORDER BY `started` DESC, `id` DESC", 'content_id', [
            'profile_id' => (int)$iProfileId
        ]);
    }

    /**
     * A task's time records, the latest first, at most $iLimit.
     */
    public function getTimeTracksByTask($iTaskId, $iLimit)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->getAll("SELECT * FROM `" . $CNF['TABLE_TIME_TRACK'] . "` WHERE `object_id` = :object_id ORDER BY `value_date` DESC, `id` DESC LIMIT " . (int)$iLimit, [
            'object_id' => (int)$iTaskId
        ]);
    }

    public function getTimeTrackById($iId)
    {
        return $this->getTimeTracks(['sample' => 'id', 'id' => (int)$iId]);
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

    public function getContextId($iContentId)
    {
        $CNF = $this->_oConfig->CNF;

        $aData = $this->getContentInfoById($iContentId);
        if($aData && is_array($aData) && ($iValue = (int)($aData[$CNF['FIELD_ALLOW_VIEW_TO']] ?? 0)) < 0)
            return abs($iValue);

        return 0;
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

                case 'object_id':
                    $aMethod['params'][1] = [
                        'object_id' => $aParams['object_id']
                    ];

                    $sWhereClause = "AND `ttt`.`object_id` = :object_id";
                    $sOrderClause = "`ttt`.`value_date` DESC, `ttt`.`id` DESC";
                    break;

                case 'context_id':
                    $aMethod['params'][1] = [
                        'context' => -(int)$aParams['context_id']
                    ];

                    $sSelectClause .= ", `te`.`" . $CNF['FIELD_TITLE'] . "` AS `object_title`";
                    $sJoinClause = "INNER JOIN `" . $CNF['TABLE_ENTRIES'] . "` AS `te` ON `ttt`.`object_id` = `te`.`" . $CNF['FIELD_ID'] . "`";
                    $sWhereClause = "AND `te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = :context";

                    if(!empty($aParams['author_id'])) {
                        $aMethod['params'][1]['author_id'] = (int)$aParams['author_id'];
                        $sWhereClause .= " AND `ttt`.`author_id` = :author_id";
                    }
                    break;

                case 'context_period_sums':
                    $aMethod['params'][1] = [
                        'context' => -(int)$aParams['context_id']
                    ];

                    $sDate = "IF(`ttt`.`value_date` > 0, `ttt`.`value_date`, `ttt`.`date`)";
                    $sSelectClause = "`ttt`.`author_id`, `ttt`.`object_id`, `ttt`.`billable`, `te`.`" . $CNF['FIELD_TITLE'] . "` AS `object_title`";
                    foreach($aParams['periods'] as $sName => $aPeriod) {
                        $sName = preg_replace('/[^a-z0-9_]/', '', $sName);
                        $aMethod['params'][1][$sName . '_from'] = (int)$aPeriod['from'];
                        $aMethod['params'][1][$sName . '_to'] = (int)$aPeriod['to'];
                        $sSelectClause .= ", SUM(IF(" . $sDate . " >= :" . $sName . "_from AND " . $sDate . " < :" . $sName . "_to, `ttt`.`value`, 0)) AS `" . $sName . "`";
                    }

                    $sJoinClause = "INNER JOIN `" . $CNF['TABLE_ENTRIES'] . "` AS `te` ON `ttt`.`object_id` = `te`.`" . $CNF['FIELD_ID'] . "`";
                    $sWhereClause = "AND `te`.`" . $CNF['FIELD_ALLOW_VIEW_TO'] . "` = :context";

                    if(!empty($aParams['author_id'])) {
                        $aMethod['params'][1]['author_id'] = (int)$aParams['author_id'];
                        $sWhereClause .= " AND `ttt`.`author_id` = :author_id";
                    }

                    $sWhereClause .= " GROUP BY `ttt`.`author_id`, `ttt`.`object_id`, `ttt`.`billable`, `te`.`" . $CNF['FIELD_TITLE'] . "`";
                    break;

                case 'author_period_sum':
                    $aMethod['params'][1] = [
                        'author_id' => $aParams['author_id'],
                        'date_from' => $aParams['date_from'],
                        'date_to' => $aParams['date_to']
                    ];

                    $sSelectClause = '`ttt`.`object_id`, SUM(`ttt`.`value`) AS `value`';
                    $sWhereClause = "AND `ttt`.`author_id` = :author_id AND `ttt`.`value_date` >= :date_from AND `ttt`.`value_date` < :date_to GROUP BY `ttt`.`object_id`";
                    $sOrderClause = "`value` DESC";
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

                case 'content_id':
                    $aMethod['params'][1] = [
                        'content_id' => $aParams['content_id']
                    ];

                    $sWhereClause = "AND `tt`.`content_id` = :content_id";

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

    public function getBudgetTracks($aParams = []) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tbt`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `tbt`.`id` = :id";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_BUDGET_TRACK'] . "` AS `tbt` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function getBudgetTrackById($iId)
    {
        return $this->getBudgetTracks(['sample' => 'id', 'id' => (int)$iId]);
    }

    /**
     * A context's budget entries, the newest first: those before an entry (0: from the newest)
     * whose note has $sText (HTML-escaped as notes are kept; empty: any), up to $iLimit.
     */
    public function getBudgetTracksByContext($iContextId, $iBeforeId, $iLimit, $sText = '')
    {
        $CNF = &$this->_oConfig->CNF;

        $aBindings = ['context_id' => (int)$iContextId];
        $sWhereClause = '';
        if ((int)$iBeforeId > 0) {
            $sWhereClause .= " AND `id` < :before_id";
            $aBindings['before_id'] = (int)$iBeforeId;
        }
        if ($sText !== '') {
            $sWhereClause .= " AND `text` LIKE :text";
            $aBindings['text'] = '%' . addcslashes($sText, '%_\\') . '%';
        }

        return $this->getAll("SELECT * FROM `" . $CNF['TABLE_BUDGET_TRACK'] . "` WHERE `context_id` = :context_id" . $sWhereClause . " ORDER BY `id` DESC LIMIT " . (int)$iLimit, $aBindings);
    }

    public function deleteBudgetTrack($iId)
    {
        $CNF = &$this->_oConfig->CNF;

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_BUDGET_TRACK'] . "` WHERE `id` = :id", ['id' => (int)$iId]) > 0;
    }

    public function getBudget($aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];
        $sSelectClause = '`tb`.*';
        $sJoinClause = $sWhereClause = $sOrderClause = '';

        if(!empty($aParams))
            switch($aParams['sample']) {
                case 'id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['id']
                    ];

                    $sWhereClause = "AND `tb`.`id` = :id";
                    break;

                case 'context_id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'context_id' => $aParams['context_id']
                    ];

                    $sWhereClause = "AND `tb`.`context_id` = :context_id";
                    break;
            }

        if(!empty($sOrderClause))
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $aMethod['params'][0] = "SELECT 
                " . $sSelectClause . " 
            FROM `" . $CNF['TABLE_BUDGET'] . "` AS `tb` " . $sJoinClause . " 
            WHERE 1 " . $sWhereClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    public function isBudgetByContext($iContextId)
    {
        $aBudget = $this->getBudget([
            'sample' => 'context_id', 
            'context_id' => $iContextId
        ]);

        return $aBudget && is_array($aBudget);
    }

    public function insertBudget($iContextId, $iValueTotal = 0, $iValueSpent = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->query("INSERT INTO `" . $CNF['TABLE_BUDGET'] . "` (`context_id`, `value_total`, `value_spent`) VALUES (:context_id, :value_total, :value_spent) ON DUPLICATE KEY UPDATE `value_total`=`value_total`+:value_total, `value_spent`=`value_spent`+:value_spent", [
            'context_id' => $iContextId,
            'value_total' => $iValueTotal,
            'value_spent' => $iValueSpent
        ]) !== false;
    }

    public function updateBudgetTotal($iContextId, $iValue)
    {
        return $this->updateBudgetValue('total', $iContextId, $iValue);
    }

    public function updateBudgetSpent($iContextId, $iValue)
    {
        return $this->updateBudgetValue('spent', $iContextId, $iValue);
    }

    public function updateBudgetValue($sField, $iContextId, $iValue)
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->query("UPDATE `" . $CNF['TABLE_BUDGET'] . "` SET `value_" . $sField . "` = `value_" . $sField . "` + :value WHERE `context_id` = :context_id", [
            'context_id' => $iContextId,
            'value' => $iValue,
        ]) !== false;
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

                    $sSelectClause = "IF(ISNULL(MAX(CAST(`tpv`.`value` AS UNSIGNED))), 0, MAX(CAST(`tpv`.`value` AS UNSIGNED))) + 1";
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
