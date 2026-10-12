<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    Analytics Analytics
* @ingroup     UnaModules
*
* @{
*/

/*
 * Module database queries
 */
class BxAnalyticsDb extends BxBaseModGeneralDb
{
    /**
     * Report dimensions stored on sessions, as name => column. Filters and top lists accept
     * these names only, so no user input reaches SQL as an identifier.
     */
    protected $_aSessionDimensions = [
        'platform' => 'platform',
        'app' => 'app',
        'app_version' => 'app_version',
        'hostname' => 'hostname',
        'entry_path' => 'entry_path',
        'exit_path' => 'exit_path',
        'referrer' => 'referrer',
        'referrer_host' => 'referrer_host',
        'channel' => 'channel',
        'utm_source' => 'utm_source',
        'utm_medium' => 'utm_medium',
        'utm_campaign' => 'utm_campaign',
        'utm_term' => 'utm_term',
        'utm_content' => 'utm_content',
        'country' => 'country',
        'region' => 'region',
        'city' => 'city',
        'language' => 'language',
        'browser' => 'browser',
        'os' => 'os',
        'device' => 'device',
        'screen' => 'screen',
    ];

    /**
     * Report dimensions stored on pageview events.
     */
    protected $_aEventDimensions = [
        'path' => 'path',
        'title' => 'title',
    ];

    public function isDimension($sName)
    {
        return isset($this->_aSessionDimensions[$sName]) || isset($this->_aEventDimensions[$sName]);
    }

    public function isEventDimension($sName)
    {
        return isset($this->_aEventDimensions[$sName]);
    }

    /*
     * Collecting
     */

    /**
     * The salt for a day, created by the first hit of that day.
     */
    public function getSalt($sDay)
    {
        $sTable = $this->_oConfig->CNF['TABLE_SALTS'];

        $this->query("INSERT IGNORE INTO `" . $sTable . "` (`day`, `salt`) VALUES (:day, :salt)", [
            'day' => $sDay,
            'salt' => random_bytes(32),
        ]);

        return (string)$this->getOne("SELECT `salt` FROM `" . $sTable . "` WHERE `day` = :day", ['day' => $sDay]);
    }

    /**
     * Latest session of any of the visitor ids on a platform, active since a time.
     */
    public function getActiveSession($aVisitors, $sPlatform, $iSince)
    {
        $aBindings = ['platform' => $sPlatform, 'since' => $iSince];
        $aIn = [];
        foreach(array_values(array_unique($aVisitors)) as $i => $sVisitor) {
            $aIn[] = ':v' . $i;
            $aBindings['v' . $i] = $sVisitor;
        }
        if(empty($aIn))
            return [];

        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `visitor` IN (" . implode(', ', $aIn) . ") AND `platform` = :platform AND `last_seen` >= :since ORDER BY `last_seen` DESC LIMIT 1", $aBindings);
    }

    public function insertSession($aSession)
    {
        unset($aSession['id']);

        $aBindings = [];
        foreach($aSession as $sField => $mixedValue)
            $aBindings[$sField] = $mixedValue;

        $sFields = '`' . implode('`, `', array_keys($aBindings)) . '`';
        $sValues = ':' . implode(', :', array_keys($aBindings));
        if(!$this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` (" . $sFields . ") VALUES (" . $sValues . ")", $aBindings))
            return 0;

        return (int)$this->lastId();
    }

    public function updateSession($iId, $aSet)
    {
        $aBindings = ['id' => (int)$iId];
        $aSql = [];
        foreach($aSet as $sField => $mixedValue) {
            $aSql[] = '`' . $sField . '` = :f_' . $sField;
            $aBindings['f_' . $sField] = $mixedValue;
        }

        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` SET " . implode(', ', $aSql) . " WHERE `id` = :id", $aBindings) > 0;
    }

    /**
     * Insert events in one query.
     *
     * @param array $aRows rows with the same keys
     * @return int rows inserted
     */
    public function insertEvents($aRows)
    {
        if(empty($aRows))
            return 0;

        $aFields = array_keys(reset($aRows));
        $aBindings = [];
        $aValues = [];
        foreach(array_values($aRows) as $i => $aRow) {
            $aPlaceholders = [];
            foreach($aFields as $sField) {
                $aPlaceholders[] = ':' . $sField . '_' . $i;
                $aBindings[$sField . '_' . $i] = $aRow[$sField];
            }
            $aValues[] = '(' . implode(', ', $aPlaceholders) . ')';
        }

        return (int)$this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` (`" . implode('`, `', $aFields) . "`) VALUES " . implode(', ', $aValues), $aBindings);
    }

    /**
     * Add engaged time to the latest view of a page in a session.
     */
    public function addEngagedTime($iSessionId, $sPath, $iMs, $iMaxMs)
    {
        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` SET `engaged` = LEAST(`engaged` + :ms, :max) WHERE `session_id` = :session AND `type` = 'pageview' AND `path` = :path ORDER BY `id` DESC LIMIT 1", [
            'ms' => (int)$iMs,
            'max' => (int)$iMaxMs,
            'session' => (int)$iSessionId,
            'path' => $sPath,
        ]) > 0;
    }

    /**
     * Count one bot request: a daily total per bot and platform, and per bot category and page.
     */
    public function addBotHit($sDay, $sBot, $sCategory, $sPlatform, $sPath, $iTime)
    {
        $CNF = &$this->_oConfig->CNF;

        $bResult = $this->query("INSERT INTO `" . $CNF['TABLE_BOTS'] . "` (`day`, `bot`, `category`, `platform`, `hits`, `last_seen`) VALUES (:day, :bot, :category, :platform, 1, :ts) ON DUPLICATE KEY UPDATE `hits` = `hits` + 1, `last_seen` = GREATEST(`last_seen`, VALUES(`last_seen`))", [
            'day' => $sDay,
            'bot' => $sBot,
            'category' => $sCategory,
            'platform' => $sPlatform,
            'ts' => (int)$iTime,
        ]) !== false;

        if($sPath !== '')
            $this->query("INSERT INTO `" . $CNF['TABLE_BOT_PAGES'] . "` (`day`, `category`, `path_hash`, `path`, `hits`) VALUES (:day, :category, :hash, :path, 1) ON DUPLICATE KEY UPDATE `hits` = `hits` + 1", [
                'day' => $sDay,
                'category' => $sCategory,
                'hash' => substr(sha1($sPath, true), 0, 8),
                'path' => $sPath,
            ]);

        return $bResult;
    }

    /**
     * Replace the module's subscriptions to per-module actions (content added) with the given
     * unit => [actions] list. Fixed subscriptions from enable.sql with the same action name
     * (comment/added) are listed in `$aFixedUnits` and stay.
     *
     * @return int subscriptions written
     */
    public function setActionAlerts($sHandler, $aActions, $aUnits, $aFixedUnits = [])
    {
        $iHandlerId = (int)$this->getOne("SELECT `id` FROM `sys_alerts_handlers` WHERE `name` = :name LIMIT 1", ['name' => $sHandler]);
        if(!$iHandlerId)
            return 0;

        $aIn = [];
        $aBindings = ['handler' => $iHandlerId];
        foreach(array_values($aActions) as $i => $sAction) {
            $aIn[] = ':a' . $i;
            $aBindings['a' . $i] = $sAction;
        }
        $sKeep = '';
        foreach(array_values($aFixedUnits) as $i => $sUnit) {
            $sKeep .= ($sKeep === '' ? '' : ', ') . ':k' . $i;
            $aBindings['k' . $i] = $sUnit;
        }
        $this->query("DELETE FROM `sys_alerts` WHERE `handler_id` = :handler AND `action` IN (" . implode(', ', $aIn) . ")" . ($sKeep !== '' ? " AND `unit` NOT IN (" . $sKeep . ")" : ''), $aBindings);

        $iWritten = 0;
        foreach($aUnits as $sUnit => $aUnitActions)
            foreach($aUnitActions as $sAction)
                $iWritten += (int)$this->query("INSERT INTO `sys_alerts` (`unit`, `action`, `handler_id`) VALUES (:unit, :action, :handler)", [
                    'unit' => $sUnit,
                    'action' => $sAction,
                    'handler' => $iHandlerId,
                ]);

        return $iWritten;
    }

    /*
     * Maintenance
     */

    public function deleteBotsBefore($sDay)
    {
        $CNF = &$this->_oConfig->CNF;

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_BOTS'] . "` WHERE `day` < :day", ['day' => $sDay]) + (int)$this->query("DELETE FROM `" . $CNF['TABLE_BOT_PAGES'] . "` WHERE `day` < :day", ['day' => $sDay]);
    }

    public function deleteSaltsBefore($sDay)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_SALTS'] . "` WHERE `day` < :day", ['day' => $sDay]);
    }

    /**
     * Delete up to `$iLimit` events or sessions older than a time; returns how many went.
     */
    public function deleteEventsBefore($iTime, $iLimit)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` WHERE `ts` < :ts ORDER BY `ts` LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
    }

    public function deleteSessionsBefore($iTime, $iLimit)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `last_seen` < :ts ORDER BY `last_seen` LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
    }

    /**
     * Unlink a deleted profile: its sessions and events stay as an anonymous visitor's.
     */
    public function forgetProfile($iProfileId, $sNewVisitor)
    {
        $aBindings = ['profile' => (int)$iProfileId, 'visitor' => $sNewVisitor];

        $iSessions = (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` SET `profile_id` = 0, `visitor` = :visitor WHERE `profile_id` = :profile", $aBindings);
        $iEvents = (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` SET `profile_id` = 0, `visitor` = :visitor WHERE `profile_id` = :profile", $aBindings);

        return $iSessions + $iEvents;
    }

    /*
     * Reports. A filter is an array from BxAnalyticsFilter::get(): from, to (unix times,
     * `to` exclusive), platform ('' for all) and dims (dimension => value).
     */

    /**
     * Visitors, sessions, pageviews, bounces and total duration in a period.
     */
    public function getTotals($aFilter)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        $aRow = $this->getRow("SELECT COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere, $aBindings);

        // filtered by a page: count that page's views, not all views of the sessions that saw it
        if(!empty($aRow) && $this->_hasEventDimensions($aFilter))
            $aRow['pageviews'] = $this->_getPageviews($aFilter);

        return $aRow;
    }

    /**
     * The same metrics per time bucket.
     *
     * @param array $aFilter report filter
     * @param string $sBucket hour, day, week or month
     * @param int $iOffset timezone offset in seconds, for bucket boundaries
     * @param array $aStarts exact bucket starts (unix times, ascending), required for months
     *      and used for any bucket when given
     * @return array rows keyed by bucket start time
     */
    public function getSeries($aFilter, $sBucket, $iOffset, $aStarts = [])
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);
        $sBucketSql = $this->_getBucketSql('`s`.`started`', $sBucket, $iOffset, $aStarts, $aBindings);

        return $this->getAllWithKey("SELECT " . $sBucketSql . " AS `bucket`, COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere . " GROUP BY `bucket` ORDER BY `bucket`", 'bucket', $aBindings);
    }

    /**
     * Top values of a dimension with visitors, sessions (session dimensions) and pageviews.
     */
    public function getTop($aFilter, $sDimension, $iLimit, $iStart = 0)
    {
        $sLimit = ' LIMIT ' . max(0, (int)$iStart) . ', ' . max(1, min(1000, (int)$iLimit));
        $aBindings = [];

        if(isset($this->_aEventDimensions[$sDimension])) {
            $sColumn = $this->_aEventDimensions[$sDimension];
            $sWhere = $this->_getEventsWhere($aFilter, $aBindings);

            // grouped by the column: events also have a `value` column, which an alias would lose to
            return $this->getAll("SELECT `e`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `e`.`visitor`) AS `visitors`, COUNT(*) AS `pageviews` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`" . $sColumn . "` ORDER BY `visitors` DESC, `pageviews` DESC" . $sLimit, $aBindings);
        }

        if(!isset($this->_aSessionDimensions[$sDimension]))
            return [];

        $sColumn = $this->_aSessionDimensions[$sDimension];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return $this->getAll("SELECT `s`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere . " GROUP BY `s`.`" . $sColumn . "` ORDER BY `visitors` DESC, `sessions` DESC" . $sLimit, $aBindings);
    }

    /**
     * How many different values a dimension has in the period, for paging.
     */
    public function getTopCount($aFilter, $sDimension)
    {
        $aBindings = [];

        if(isset($this->_aEventDimensions[$sDimension])) {
            $sWhere = $this->_getEventsWhere($aFilter, $aBindings);
            return (int)$this->getOne("SELECT COUNT(DISTINCT `e`.`" . $this->_aEventDimensions[$sDimension] . "`) FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere, $aBindings);
        }

        if(!isset($this->_aSessionDimensions[$sDimension]))
            return 0;

        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);
        return (int)$this->getOne("SELECT COUNT(DISTINCT `s`.`" . $this->_aSessionDimensions[$sDimension] . "`) FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Pages (or titles) with visitors, pageviews and average engaged time in seconds; pages
     * also get entries, bounces of the sessions that entered there, and exits.
     */
    public function getPageStats($aFilter, $sDimension, $iLimit, $iStart = 0)
    {
        if(!isset($this->_aEventDimensions[$sDimension]))
            return [];

        $sColumn = $this->_aEventDimensions[$sDimension];
        $aBindings = [];
        $sWhere = $this->_getEventsWhere($aFilter, $aBindings);

        $aRows = $this->getAllWithKey("SELECT `e`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `e`.`visitor`) AS `visitors`, COUNT(*) AS `pageviews`, IFNULL(AVG(NULLIF(`e`.`engaged`, 0)), 0) / 1000 AS `engaged` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`" . $sColumn . "` ORDER BY `visitors` DESC, `pageviews` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), 'value', $aBindings);
        if(empty($aRows) || $sDimension != 'path')
            return array_values($aRows);

        foreach($aRows as $sPath => $aRow)
            $aRows[$sPath] = array_merge($aRow, ['entries' => 0, 'bounces' => 0, 'bounce_rate' => 0, 'exits' => 0]);

        // entries, bounces and exits come from the sessions that started in the period
        $aSessionFilter = $aFilter;
        unset($aSessionFilter['dims']['path']);

        foreach(['entry_path' => ['entries', 'bounces'], 'exit_path' => ['exits', '']] as $sSessionColumn => list($sCount, $sBounces)) {
            $aSessionBindings = [];
            $sSessionWhere = $this->_getSessionsWhere($aSessionFilter, $aSessionBindings);

            $aIn = [];
            foreach(array_keys($aRows) as $i => $sPath) {
                $aIn[] = ':p' . $i;
                $aSessionBindings['p' . $i] = (string)$sPath;
            }

            $aCounts = $this->getAllWithKey("SELECT `s`.`" . $sSessionColumn . "` AS `value`, COUNT(*) AS `cnt`, SUM(`s`.`bounce`) AS `bounces` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sSessionWhere . " AND `s`.`" . $sSessionColumn . "` IN (" . implode(', ', $aIn) . ") GROUP BY `s`.`" . $sSessionColumn . "`", 'value', $aSessionBindings);
            foreach($aCounts as $sPath => $aCount) {
                if(!isset($aRows[$sPath]))
                    continue;
                $aRows[$sPath][$sCount] = (int)$aCount['cnt'];
                if($sBounces) {
                    $aRows[$sPath][$sBounces] = (int)$aCount['bounces'];
                    $aRows[$sPath]['bounce_rate'] = $aCount['cnt'] ? round(100 * $aCount['bounces'] / $aCount['cnt'], 1) : 0;
                }
            }
        }

        return array_values($aRows);
    }

    /**
     * Pageviews per minute since a time, keyed by the minute's start.
     */
    public function getPageviewsPerMinute($iSince, $sPlatform = '')
    {
        $aBindings = ['since' => (int)$iSince];
        $sWhere = '';
        if($sPlatform !== '') {
            $sWhere = ' AND `platform` = :platform';
            $aBindings['platform'] = $sPlatform;
        }

        return $this->getPairs("SELECT FLOOR(`ts` / 60) * 60 AS `minute`, COUNT(*) AS `pageviews` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` WHERE `ts` >= :since AND `type` = 'pageview'" . $sWhere . " GROUP BY `minute`", 'minute', 'pageviews', $aBindings);
    }

    /*
     * Behavior: events, sessions, members
     */

    /**
     * Events grouped by type, name and module, most frequent first.
     */
    public function getEventList($aFilter, $aTypes, $iLimit, $iStart = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, $aTypes, $aBindings);

        return $this->getAll("SELECT `e`.`type`, `e`.`name`, `e`.`module`, COUNT(*) AS `count`, COUNT(DISTINCT `e`.`visitor`) AS `visitors`, MAX(`e`.`ts`) AS `last` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`type`, `e`.`name`, `e`.`module` ORDER BY `count` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    public function getEventListCount($aFilter, $aTypes)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, $aTypes, $aBindings);

        return (int)$this->getOne("SELECT COUNT(DISTINCT `e`.`type`, `e`.`name`, `e`.`module`) FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere, $aBindings);
    }

    /**
     * One event's count and visitors per time bucket, per platform, and the properties of
     * its latest occurrences.
     */
    public function getEventSeries($aFilter, $aEvent, $sBucket, $iOffset, $aStarts = [])
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [$aEvent['type']], $aBindings, $aEvent);
        $sBucketSql = $this->_getBucketSql('`e`.`ts`', $sBucket, $iOffset, $aStarts, $aBindings);

        return $this->getAllWithKey("SELECT " . $sBucketSql . " AS `bucket`, COUNT(*) AS `count`, COUNT(DISTINCT `e`.`visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `bucket` ORDER BY `bucket`", 'bucket', $aBindings);
    }

    public function getEventPlatforms($aFilter, $aEvent)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [$aEvent['type']], $aBindings, $aEvent);

        return $this->getAll("SELECT `e`.`platform`, COUNT(*) AS `count`, COUNT(DISTINCT `e`.`visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`platform` ORDER BY `count` DESC", $aBindings);
    }

    public function getEventProps($aFilter, $aEvent, $iLimit = 2000)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [$aEvent['type']], $aBindings, $aEvent);

        return $this->getColumn("SELECT `e`.`props` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " AND `e`.`props` != '' ORDER BY `e`.`id` DESC LIMIT " . max(1, min(10000, (int)$iLimit)), $aBindings);
    }

    /**
     * Sessions that started in the period, latest first, optionally of one member.
     */
    public function getSessionList($aFilter, $iLimit, $iStart = 0, $iProfileId = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);
        if($iProfileId) {
            $sWhere .= ' AND `s`.`profile_id` = :profile';
            $aBindings['profile'] = (int)$iProfileId;
        }

        return $this->getAll("SELECT `s`.* FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere . " ORDER BY `s`.`started` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    public function getSessionListCount($aFilter, $iProfileId = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);
        if($iProfileId) {
            $sWhere .= ' AND `s`.`profile_id` = :profile';
            $aBindings['profile'] = (int)$iProfileId;
        }

        return (int)$this->getOne("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere, $aBindings);
    }

    public function getSession($iId)
    {
        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `id` = :id", ['id' => (int)$iId]);
    }

    public function getSessionEvents($iId, $iLimit = 500)
    {
        return $this->getAll("SELECT `ts`, `type`, `name`, `path`, `title`, `module`, `object_id`, `value`, `engaged`, `props` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` WHERE `session_id` = :id ORDER BY `id` LIMIT " . max(1, min(5000, (int)$iLimit)), ['id' => (int)$iId]);
    }

    /**
     * Members who visited in the period with their visits, pageviews, time and platforms,
     * the latest visitor first.
     */
    public function getMemberList($aFilter, $iLimit, $iStart = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return $this->getAll("SELECT `s`.`profile_id`, COUNT(*) AS `sessions`, SUM(`s`.`pageviews`) AS `pageviews`, SUM(`s`.`duration`) AS `duration`, MIN(`s`.`started`) AS `first`, MAX(`s`.`last_seen`) AS `last`, GROUP_CONCAT(DISTINCT `s`.`platform` ORDER BY `s`.`platform`) AS `platforms`, SUBSTRING_INDEX(GROUP_CONCAT(`s`.`country` ORDER BY `s`.`last_seen` DESC), ',', 1) AS `country` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere . " AND `s`.`profile_id` > 0 GROUP BY `s`.`profile_id` ORDER BY `last` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    public function getMemberListCount($aFilter)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return (int)$this->getOne("SELECT COUNT(DISTINCT `s`.`profile_id`) FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere . " AND `s`.`profile_id` > 0", $aBindings);
    }

    /**
     * A member's totals over all the data kept, and per platform.
     */
    public function getMemberTotals($iProfileId)
    {
        $aBindings = ['profile' => (int)$iProfileId];
        $sTable = $this->_oConfig->CNF['TABLE_SESSIONS'];

        return [
            'totals' => $this->getRow("SELECT COUNT(*) AS `sessions`, IFNULL(SUM(`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`duration`), 0) AS `duration`, MIN(`started`) AS `first`, MAX(`last_seen`) AS `last` FROM `" . $sTable . "` WHERE `profile_id` = :profile", $aBindings),
            'platforms' => $this->getPairs("SELECT `platform`, COUNT(*) AS `sessions` FROM `" . $sTable . "` WHERE `profile_id` = :profile GROUP BY `platform` ORDER BY `sessions` DESC", 'platform', 'sessions', $aBindings),
        ];
    }

    /**
     * A member's events and site actions in the period, most frequent first.
     */
    public function getMemberActions($iProfileId, $aFilter, $iLimit = 20)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere(array_merge($aFilter, ['dims' => []]), [BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_UNA], $aBindings);
        $aBindings['profile'] = (int)$iProfileId;

        return $this->getAll("SELECT `e`.`type`, `e`.`name`, `e`.`module`, COUNT(*) AS `count`, MAX(`e`.`ts`) AS `last` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " AND `e`.`profile_id` = :profile GROUP BY `e`.`type`, `e`.`name`, `e`.`module` ORDER BY `count` DESC LIMIT " . max(1, min(100, (int)$iLimit)), $aBindings);
    }

    /**
     * WHERE for events (alias `e`) of some types in the period, optionally one event
     * (type, name, module), with session filters through the event's session.
     */
    protected function _getAnyEventsWhere($aFilter, $aTypes, &$aBindings, $aEvent = null)
    {
        $aSql = ['`e`.`ts` >= :from', '`e`.`ts` < :to'];
        $aBindings['from'] = (int)$aFilter['from'];
        $aBindings['to'] = (int)$aFilter['to'];

        $aIn = [];
        foreach(array_values($aTypes) as $i => $sType) {
            $aIn[] = ':t' . $i;
            $aBindings['t' . $i] = $sType;
        }
        $aSql[] = '`e`.`type` IN (' . implode(', ', $aIn) . ')';

        if($aEvent !== null) {
            $aSql[] = '`e`.`name` = :ev_name';
            $aSql[] = '`e`.`module` = :ev_module';
            $aBindings['ev_name'] = $aEvent['name'];
            $aBindings['ev_module'] = $aEvent['module'];
        }

        if($aFilter['platform'] !== '') {
            $aSql[] = '`e`.`platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        $aSessionSql = [];
        foreach($aFilter['dims'] as $sName => $sValue) {
            if(isset($this->_aSessionDimensions[$sName])) {
                $aSessionSql[] = '`sf`.`' . $this->_aSessionDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
            elseif(isset($this->_aEventDimensions[$sName])) {
                $aSessionSql[] = "EXISTS (SELECT 1 FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `ef` WHERE `ef`.`session_id` = `e`.`session_id` AND `ef`.`type` = 'pageview' AND `ef`.`" . $this->_aEventDimensions[$sName] . "` = :d_" . $sName . ")";
                $aBindings['d_' . $sName] = $sValue;
            }
        }

        if(!empty($aSessionSql)) {
            // session dimensions go through the session; page filters stand on their own
            $aOwn = [];
            $aThrough = [];
            foreach($aSessionSql as $sSql)
                if(strncmp($sSql, 'EXISTS', 6) === 0)
                    $aOwn[] = $sSql;
                else
                    $aThrough[] = $sSql;

            if(!empty($aThrough))
                $aSql[] = "EXISTS (SELECT 1 FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `sf` WHERE `sf`.`id` = `e`.`session_id` AND " . implode(' AND ', $aThrough) . ")";
            $aSql = array_merge($aSql, $aOwn);
        }

        return implode(' AND ', $aSql);
    }

    /**
     * Bot totals in a period: hits and distinct bots, optionally for some categories.
     */
    public function getBotTotals($aFilter, $aCategories = [])
    {
        $aBindings = [];
        $sWhere = $this->_getBotsWhere($aFilter, $aCategories, $aBindings);

        return $this->getRow("SELECT IFNULL(SUM(`hits`), 0) AS `hits`, COUNT(DISTINCT `bot`) AS `bots` FROM `" . $this->_oConfig->CNF['TABLE_BOTS'] . "` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Bot hits per day and category.
     */
    public function getBotSeries($aFilter)
    {
        $aBindings = [];
        $sWhere = $this->_getBotsWhere($aFilter, [], $aBindings);

        return $this->getAll("SELECT `day`, `category`, SUM(`hits`) AS `hits` FROM `" . $this->_oConfig->CNF['TABLE_BOTS'] . "` WHERE " . $sWhere . " GROUP BY `day`, `category` ORDER BY `day`", $aBindings);
    }

    /**
     * Bots with their hits, last visit and platforms, busiest first.
     */
    public function getBotList($aFilter, $aCategories, $iLimit, $iStart = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getBotsWhere($aFilter, $aCategories, $aBindings);

        return $this->getAll("SELECT `bot`, `category`, SUM(`hits`) AS `hits`, MAX(`last_seen`) AS `last_seen`, GROUP_CONCAT(DISTINCT `platform` ORDER BY `platform`) AS `platforms` FROM `" . $this->_oConfig->CNF['TABLE_BOTS'] . "` WHERE " . $sWhere . " GROUP BY `bot`, `category` ORDER BY `hits` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    public function getBotListCount($aFilter, $aCategories)
    {
        $aBindings = [];
        $sWhere = $this->_getBotsWhere($aFilter, $aCategories, $aBindings);

        return (int)$this->getOne("SELECT COUNT(DISTINCT `bot`, `category`) FROM `" . $this->_oConfig->CNF['TABLE_BOTS'] . "` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Pages bots asked for most.
     */
    public function getBotPages($aFilter, $aCategories, $iLimit)
    {
        $aBindings = [];
        $sWhere = $this->_getBotsWhere($aFilter, $aCategories, $aBindings, false);

        return $this->getAll("SELECT `path`, SUM(`hits`) AS `hits` FROM `" . $this->_oConfig->CNF['TABLE_BOT_PAGES'] . "` WHERE " . $sWhere . " GROUP BY `path_hash`, `path` ORDER BY `hits` DESC LIMIT " . max(1, min(100, (int)$iLimit)), $aBindings);
    }

    /**
     * Bot rows are per UTC day: the period's days, its platform (the pages table has none)
     * and the categories.
     */
    protected function _getBotsWhere($aFilter, $aCategories, &$aBindings, $bPlatform = true)
    {
        $aSql = ['`day` >= :day_from', '`day` <= :day_to'];
        $aBindings['day_from'] = gmdate('Y-m-d', (int)$aFilter['from']);
        $aBindings['day_to'] = gmdate('Y-m-d', max((int)$aFilter['from'], (int)$aFilter['to'] - 1));

        if($bPlatform && $aFilter['platform'] !== '') {
            $aSql[] = '`platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        if(!empty($aCategories)) {
            $aIn = [];
            foreach(array_values($aCategories) as $i => $sCategory) {
                $aIn[] = ':c' . $i;
                $aBindings['c' . $i] = $sCategory;
            }
            $aSql[] = '`category` IN (' . implode(', ', $aIn) . ')';
        }

        return implode(' AND ', $aSql);
    }

    /**
     * Visitors per rounded location (sessions with coordinates from the edge), for the map.
     */
    public function getMapPoints($aFilter, $iLimit = 500)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return $this->getAll("SELECT `s`.`lat`, `s`.`lng`, MAX(`s`.`city`) AS `city`, MAX(`s`.`country`) AS `country`, COUNT(DISTINCT `s`.`visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` WHERE " . $sWhere . " AND `s`.`lat` IS NOT NULL GROUP BY `s`.`lat`, `s`.`lng` ORDER BY `visitors` DESC LIMIT " . max(1, min(2000, (int)$iLimit)), $aBindings);
    }

    /**
     * Visitors active since a time, per platform.
     */
    public function getOnline($iSince)
    {
        return $this->getPairs("SELECT `platform`, COUNT(DISTINCT `visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `last_seen` >= :since GROUP BY `platform`", 'platform', 'visitors', ['since' => (int)$iSince]);
    }

    /**
     * Latest pageviews with their session's place and device, for the realtime list.
     */
    public function getRecentPageviews($iSince, $iLimit, $sPlatform = '')
    {
        $aBindings = ['since' => (int)$iSince];
        $sWhere = '';
        if($sPlatform !== '') {
            $sWhere = ' AND `e`.`platform` = :platform';
            $aBindings['platform'] = $sPlatform;
        }

        return $this->getAll("SELECT `e`.`ts`, `e`.`platform`, `e`.`path`, `e`.`title`, `e`.`profile_id`, `s`.`country`, `s`.`city`, `s`.`device`, `s`.`browser`, `s`.`os` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` INNER JOIN `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` ON `s`.`id` = `e`.`session_id` WHERE `e`.`ts` >= :since AND `e`.`type` = 'pageview'" . $sWhere . " ORDER BY `e`.`id` DESC LIMIT " . max(1, min(100, (int)$iLimit)), $aBindings);
    }

    /**
     * Whether anything was ever collected, per platform: the setup check in Studio.
     */
    public function getLastHits()
    {
        return $this->getPairs("SELECT `platform`, MAX(`last_seen`) AS `last` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` GROUP BY `platform`", 'platform', 'last');
    }

    protected function _getPageviews($aFilter)
    {
        $aBindings = [];
        $sWhere = $this->_getEventsWhere($aFilter, $aBindings);

        return (int)$this->getOne("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere, $aBindings);
    }

    protected function _hasEventDimensions($aFilter)
    {
        foreach($aFilter['dims'] as $sName => $sValue)
            if(isset($this->_aEventDimensions[$sName]))
                return true;

        return false;
    }

    /**
     * WHERE for sessions (alias `s`) that started in the period and match the filters. A page
     * filter keeps the sessions that viewed that page.
     */
    protected function _getSessionsWhere($aFilter, &$aBindings)
    {
        $aSql = ['`s`.`started` >= :from', '`s`.`started` < :to'];
        $aBindings['from'] = (int)$aFilter['from'];
        $aBindings['to'] = (int)$aFilter['to'];

        if($aFilter['platform'] !== '') {
            $aSql[] = '`s`.`platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        $aEventSql = [];
        foreach($aFilter['dims'] as $sName => $sValue) {
            if(isset($this->_aSessionDimensions[$sName])) {
                $aSql[] = '`s`.`' . $this->_aSessionDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
            elseif(isset($this->_aEventDimensions[$sName])) {
                $aEventSql[] = '`ef`.`' . $this->_aEventDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
        }

        if(!empty($aEventSql))
            $aSql[] = "EXISTS (SELECT 1 FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `ef` WHERE `ef`.`session_id` = `s`.`id` AND `ef`.`type` = 'pageview' AND " . implode(' AND ', $aEventSql) . ")";

        return implode(' AND ', $aSql);
    }

    /**
     * WHERE for pageview events (alias `e`) in the period that match the filters. Session
     * filters keep the events of matching sessions.
     */
    protected function _getEventsWhere($aFilter, &$aBindings)
    {
        $aSql = ['`e`.`ts` >= :from', '`e`.`ts` < :to', "`e`.`type` = 'pageview'"];
        $aBindings['from'] = (int)$aFilter['from'];
        $aBindings['to'] = (int)$aFilter['to'];

        if($aFilter['platform'] !== '') {
            $aSql[] = '`e`.`platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        $aSessionSql = [];
        foreach($aFilter['dims'] as $sName => $sValue) {
            if(isset($this->_aEventDimensions[$sName])) {
                $aSql[] = '`e`.`' . $this->_aEventDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
            elseif(isset($this->_aSessionDimensions[$sName])) {
                $aSessionSql[] = '`sf`.`' . $this->_aSessionDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
        }

        if(!empty($aSessionSql))
            $aSql[] = "EXISTS (SELECT 1 FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `sf` WHERE `sf`.`id` = `e`.`session_id` AND " . implode(' AND ', $aSessionSql) . ")";

        return implode(' AND ', $aSql);
    }

    /**
     * Bucket start time of a timestamp column. Given a list of starts (months, or days across
     * a daylight saving change), a row goes to the latest start before it. Otherwise hours,
     * days and weeks (from Monday) are fixed lengths shifted by the timezone offset.
     */
    protected function _getBucketSql($sColumn, $sBucket, $iOffset, $aStarts, &$aBindings)
    {
        $iOffset = (int)$iOffset;

        if(!empty($aStarts)) {
            $aCases = [];
            foreach(array_reverse(array_values($aStarts)) as $i => $iStart) {
                $aCases[] = 'WHEN ' . $sColumn . ' >= :b' . $i . ' THEN :b' . $i . 'v';
                $aBindings['b' . $i] = (int)$iStart;
                $aBindings['b' . $i . 'v'] = (int)$iStart;
            }
            return 'CASE ' . implode(' ', $aCases) . ' ELSE 0 END';
        }

        switch($sBucket) {
            case 'hour':
                return 'FLOOR((' . $sColumn . ' + ' . $iOffset . ') / 3600) * 3600 - ' . $iOffset;

            case 'week':
                // 1970-01-05 was a Monday
                return 'FLOOR((' . $sColumn . ' + ' . $iOffset . ' - 345600) / 604800) * 604800 + 345600 - ' . $iOffset;

            default:
                return 'FLOOR((' . $sColumn . ' + ' . $iOffset . ') / 86400) * 86400 - ' . $iOffset;
        }
    }

    /*
     * Content reports
     */

    public function getGrowth($sTableName, $sColumnAdded, $iDateFrom, $iDateTo)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom,
            'dateto' => $iDateTo
        );
        $sQuery = "SELECT DATE(FROM_UNIXTIME(`" . $sColumnAdded . "`)) AS `period`, YEAR(FROM_UNIXTIME(`" . $sColumnAdded . "`)) AS `year`, COUNT(*) AS `count` FROM " . $sTableName . " WHERE `" . $sColumnAdded . "` >= :datefrom AND `" . $sColumnAdded . "` <= :dateto GROUP BY `period`, `year` ORDER BY `year`, `period` ASC";
        return $this->getAll($sQuery, $aBindings);
    }

    public function getGrowthInitValue($sTableName, $sColumnAdded, $iDateFrom)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom
        );
        $sQuery = "SELECT COUNT(*) AS `count` FROM " . $sTableName . " WHERE `" . $sColumnAdded . "` < :datefrom ";
        return $this->getOne($sQuery, $aBindings);
    }

    public function getTopContentByLikes($sModuleName, $sTableName, $iDateFrom, $iDateTo)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom,
            'dateto' => $iDateTo
        );
        $sQuery = "SELECT `object_id`,'" . $sModuleName . "' AS `module`, COUNT(*) AS `value` FROM `" . $sTableName . "` WHERE `date` >= :datefrom AND `date` <= :dateto GROUP BY `object_id` ORDER BY COUNT(*) DESC LIMIT 0, " . intval(getParam('bx_analytics_items_count'));
        return $this->getAll($sQuery, $aBindings);
    }

    public function getMostFollowedProfiles($sModuleName, $iDateFrom, $iDateTo)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom,
            'dateto' => $iDateTo
        );
        $sQuery = "SELECT `sys_profiles`.`content_id` AS `object_id`, `sys_profiles`.`type` , COUNT(`sys_profiles_conn_subscriptions`.`id`) AS `value` FROM `sys_profiles_conn_subscriptions`
INNER JOIN `sys_profiles` ON `sys_profiles`.`id` = `sys_profiles_conn_subscriptions`.`content` WHERE sys_profiles.type='" . $sModuleName . "' AND `sys_profiles_conn_subscriptions`.`added` >= :datefrom AND `sys_profiles_conn_subscriptions`.`added` <= :dateto GROUP BY `sys_profiles`.`content_id`, `sys_profiles`.`type` ORDER BY COUNT(`sys_profiles_conn_subscriptions`.`id`) DESC LIMIT 0," . intval(getParam('bx_analytics_items_count'));
        return $this->getAll($sQuery, $aBindings);
    }

    public function getMostActiveProfiles($sModuleName, $sContentModuleName, $sTableName, $sColumnAuthor, $sColumnAdded, $iDateFrom, $iDateTo)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom,
            'dateto' => $iDateTo
        );
        $sQuery = "SELECT `sys_profiles`.`content_id` AS `object_id`, `sys_profiles`.`type`, '" . $sContentModuleName . "' , COUNT(`" . $sTableName . "`.`id`) AS `value` FROM `" . $sTableName . "`
INNER JOIN `sys_profiles` ON `sys_profiles`.`id` = `" . $sTableName . "`.`" . $sColumnAuthor . "` WHERE sys_profiles.type='" . $sModuleName . "' AND `" . $sTableName . "`.`" . $sColumnAdded . "` >= :datefrom AND `" . $sTableName . "`.`" . $sColumnAdded . "` <= :dateto GROUP BY `sys_profiles`.`content_id`, `sys_profiles`.`type` ORDER BY COUNT(`" . $sTableName . "`.`id`) DESC LIMIT 0," . intval(getParam('bx_analytics_items_count'));
        return $this->getAll($sQuery, $aBindings);
    }
}

/** @} */
