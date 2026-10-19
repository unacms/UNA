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

    /**
     * What a breakdown of a session dimension may be sorted by, as metric => SQL over the
     * sessions (alias `s`). Fixed expressions: the metric name from the request only picks one.
     */
    protected $_aSessionMetrics = [
        'visitors' => 'COUNT(DISTINCT `s`.`visitor`)',
        'sessions' => 'COUNT(*)',
        'pageviews' => 'SUM(`s`.`pageviews`)',
        'pages_per_session' => 'SUM(`s`.`pageviews`) / COUNT(*)',
        'bounce_rate' => 'SUM(`s`.`bounce`) / COUNT(*)',
        'duration' => 'SUM(`s`.`duration`) / COUNT(*)',
    ];

    /**
     * The same for an event dimension, over pageview events (alias `e`).
     */
    protected $_aEventMetrics = [
        'visitors' => 'COUNT(DISTINCT `e`.`visitor`)',
        'pageviews' => 'COUNT(*)',
        'engaged' => 'IFNULL(AVG(NULLIF(`e`.`engaged`, 0)), 0)',
    ];

    /**
     * Pages and titles grouped with the number of their visitors: sorted first, then counted.
     * Read in time order (the `type_ts` key, which the optimizer takes for a short period or
     * with a visit filter) and grouped in a temporary table, a 255 character key with a
     * distinct count per group spilled to disk: 160 s for 30 days of 10 million events, against
     * 1 to 4 s sorted.
     */
    const SQL_GROUP_WIDE = 'SQL_BIG_RESULT';

    /**
     * Optimizer hint for an IN subquery: run it once into a temporary table (materialization),
     * not as a join nor once per row of the outer query. Next to NO_SEMIJOIN, MariaDB
     * ignores it as conflicting. See _getVisitsInSql.
     */
    const SQL_SUBQUERY_FIRST = '/*+ SUBQUERY(MATERIALIZATION) */';

    /**
     * Whether the report session settings were applied on this connection.
     */
    protected static $_bReportSession = false;

    /**
     * Session settings for report queries, once per connection. MariaDB, and MySQL before
     * 8.0.20, sort rows wider than max_length_for_sort_data (1024 bytes) by row id and read
     * every row again after the sort: a top list of pages (a 255 character utf8mb4 path)
     * over 90 days then reads each of its pageviews twice, in random order. A larger limit
     * keeps the columns in the sort. MySQL 8.0.20 and later always do that and deprecated
     * the variable, so it is left alone there.
     */
    public function setReportSession()
    {
        if(self::$_bReportSession)
            return;
        self::$_bReportSession = true;

        $sVersion = (string)BxDolDb::getLink()->getAttribute(PDO::ATTR_SERVER_VERSION);
        if(stripos($sVersion, 'mariadb') === false && !version_compare($sVersion, '8.0.20', '<'))
            return;

        $this->query("SET SESSION `max_length_for_sort_data` = 8192");
    }

    public function isDimension($sName)
    {
        return isset($this->_aSessionDimensions[$sName]) || isset($this->_aEventDimensions[$sName]);
    }

    public function isEventDimension($sName)
    {
        return isset($this->_aEventDimensions[$sName]);
    }

    /**
     * Every report dimension, as name => kind (event or session): pages first.
     */
    public function getDimensions()
    {
        $aResult = [];
        foreach(array_keys($this->_aEventDimensions) as $sName)
            $aResult[$sName] = 'event';
        foreach(array_keys($this->_aSessionDimensions) as $sName)
            $aResult[$sName] = 'session';

        return $aResult;
    }

    /**
     * Metrics a breakdown of a dimension may be sorted by, the default first; empty for an
     * unknown dimension.
     */
    public function getBreakdownMetrics($sDimension)
    {
        if(isset($this->_aEventDimensions[$sDimension]))
            return array_keys($this->_aEventMetrics);

        return isset($this->_aSessionDimensions[$sDimension]) ? array_keys($this->_aSessionMetrics) : [];
    }

    /*
     * Collecting
     */

    /**
     * The salt for a day, created by the first hit of that day.
     */
    public function getSalt($sDay)
    {
        $aSalts = $this->getSalts([$sDay]);

        return $aSalts[$sDay];
    }

    /**
     * The salts of some days, [day => salt]. Every hit needs them and only the first hit of a
     * day creates one, so they are read first, in one query, and written only when missing.
     */
    public function getSalts($aDays)
    {
        $sTable = $this->_oConfig->CNF['TABLE_SALTS'];

        $aBindings = [];
        $sIn = $this->_getInSql(array_values(array_unique($aDays)), 'd', $aBindings);
        $aSalts = $this->getPairs("SELECT `day`, `salt` FROM `" . $sTable . "` WHERE `day` IN (" . $sIn . ")", 'day', 'salt', $aBindings);

        $aResult = [];
        foreach($aDays as $sDay) {
            if(!isset($aSalts[$sDay])) {
                $this->query("INSERT IGNORE INTO `" . $sTable . "` (`day`, `salt`) VALUES (:day, :salt)", [
                    'day' => $sDay,
                    'salt' => random_bytes(32),
                ]);
                $aSalts[$sDay] = $this->getOne("SELECT `salt` FROM `" . $sTable . "` WHERE `day` = :day", ['day' => $sDay]);
            }

            $aResult[$sDay] = (string)$aSalts[$sDay];
        }

        return $aResult;
    }

    /**
     * Latest session of any of the visitor ids on a platform, active since a time.
     */
    public function getActiveSession($aVisitors, $sPlatform, $iSince, $iUntil = 0)
    {
        $aBindings = ['platform' => $sPlatform, 'since' => $iSince];
        $sUntil = '';
        if($iUntil) {
            $sUntil = ' AND `started` <= :until';
            $aBindings['until'] = (int)$iUntil;
        }
        $aIn = [];
        foreach(array_values(array_unique($aVisitors)) as $i => $sVisitor) {
            $aIn[] = ':v' . $i;
            $aBindings['v' . $i] = $sVisitor;
        }
        if(empty($aIn))
            return [];

        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `visitor` IN (" . implode(', ', $aIn) . ") AND `platform` = :platform AND `last_seen` >= :since" . $sUntil . " ORDER BY `last_seen` DESC LIMIT 1", $aBindings);
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
     * Add a request's hits to a visit's counters in the database, not from a copy read before
     * them: two requests of one visit at once (tabs opened together, an event and a pageview
     * sent together) both count. The time only moves forward, and the exit page is the visit's
     * latest pageview by time, whichever request is written last.
     *
     * Every expression reads only columns set after it in the statement, so the result is the
     * same whether the server assigns left to right or all at once (MariaDB's
     * SIMULTANEOUS_ASSIGNMENT).
     *
     * @param int $iPageviews pageviews in the request
     * @param int $iEvents events in the request
     * @param bool $bInteractive a hit that isn't a bounce on its own (an interactive event)
     * @param int $iLastSeen the request's latest hit, 0 for none
     * @param bool $bPageview the request has a pageview, so the exit page may change
     */
    public function addSessionHits($iId, $iPageviews, $iEvents, $bInteractive, $iLastSeen, $bPageview)
    {
        $sExit = '';
        $aBindings = [
            'id' => (int)$iId,
            'interactive' => $bInteractive ? 1 : 0,
            'pv' => (int)$iPageviews,
            'pv2' => (int)$iPageviews,
            'ev' => (int)$iEvents,
            'ls' => (int)$iLastSeen,
            'ls2' => (int)$iLastSeen,
        ];
        if($bPageview) {
            // the `session_id` key, a visit has few rows
            $sExit = ", `exit_path` = IFNULL((SELECT `path` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` WHERE `session_id` = :sid AND `type` = 'pageview' ORDER BY `ts` DESC, `id` DESC LIMIT 1), `exit_path`)";
            $aBindings['sid'] = (int)$iId;
        }

        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` SET
            `bounce` = IF(:interactive = 1 OR `pageviews` + :pv > 1, 0, `bounce`),
            `duration` = GREATEST(`duration`, CAST(GREATEST(`last_seen`, :ls) AS SIGNED) - CAST(`started` AS SIGNED)),
            `last_seen` = GREATEST(`last_seen`, :ls2),
            `pageviews` = LEAST(`pageviews` + :pv2, 65535),
            `events` = LEAST(`events` + :ev, 65535)" . $sExit . "
            WHERE `id` = :id", $aBindings) > 0;
    }

    /**
     * Take a named lock on the connection, waiting up to a number of seconds. MySQL releases it
     * when the connection closes, so a request that dies can't keep it.
     *
     * @return bool the lock is held
     */
    public function lockVisit($sName, $iTimeout)
    {
        return (int)$this->getOne("SELECT GET_LOCK(:name, :timeout)", ['name' => $sName, 'timeout' => (int)$iTimeout]) === 1;
    }

    public function unlockVisit($sName)
    {
        return (int)$this->getOne("SELECT RELEASE_LOCK(:name)", ['name' => $sName]) === 1;
    }

    /**
     * Give every event of a visit a visitor id and a profile: the member's, when they sign in
     * during a guest's visit. A visit has few events, found by the `session_id` key.
     */
    public function assignSessionEvents($iSessionId, $sVisitor, $iProfileId)
    {
        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` SET `visitor` = :visitor, `profile_id` = :profile WHERE `session_id` = :id", ['visitor' => $sVisitor, 'profile' => (int)$iProfileId, 'id' => (int)$iSessionId]);
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
                'hash' => substr(hash('sha256', $sPath, true), 0, 8),
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

    /**
     * Add to a rate limit counter and return its new value. One upsert by the primary key;
     * LAST_INSERT_ID(expr) hands the value back without reading the row again.
     *
     * @param string $sKey 8 bytes, see BxAnalyticsCollector::_getLimitKey
     * @param int $iBucket the minute's or hour's start
     * @param int $iHits how much to add
     * @return int the counter after the addition, 0 when it couldn't be written
     */
    public function addLimitHits($sKey, $iBucket, $iHits)
    {
        $iHits = max(1, (int)$iHits);
        $mixedResult = $this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_LIMITS'] . "` (`key`, `bucket`, `hits`) VALUES (:key, :bucket, LAST_INSERT_ID(:hits)) ON DUPLICATE KEY UPDATE `hits` = LAST_INSERT_ID(`hits` + :add)", [
            'key' => $sKey,
            'bucket' => (int)$iBucket,
            'hits' => $iHits,
            'add' => $iHits,
        ]);
        if($mixedResult === false)
            return 0;

        return (int)$this->getOne("SELECT LAST_INSERT_ID()");
    }

    /**
     * A rate limit counter's value, without adding to it.
     */
    public function getLimitHits($sKey, $iBucket)
    {
        return (int)$this->getOne("SELECT `hits` FROM `" . $this->_oConfig->CNF['TABLE_LIMITS'] . "` WHERE `key` = :key AND `bucket` = :bucket", ['key' => $sKey, 'bucket' => (int)$iBucket]);
    }

    /**
     * Delete up to `$iLimit` rate limit counters of minutes and hours that started before a time.
     */
    public function deleteLimitsBefore($iTime, $iLimit)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_LIMITS'] . "` WHERE `bucket` < :ts ORDER BY `bucket` LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
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
     * Unlink a deleted profile: its visits and events stay as anonymous visitors'. Each visit
     * gets a visitor id of its own, so its visits aren't tied to one another, and the events
     * of a visit recorded before signing in lose the guest's id too (in persistent mode the
     * device's, which the device sends again on later visits). Site actions lose the account
     * or profile they were about (sign-up, sign-in, the profile created).
     *
     * @param string $sSalt random bytes the new ids are made from, thrown away after
     */
    public function forgetProfile($iProfileId, $sSalt)
    {
        $CNF = &$this->_oConfig->CNF;
        $aBindings = ['profile' => (int)$iProfileId, 'salt' => bin2hex($sSalt)];
        $sAbout = "IF(`e`.`type` = 'una' AND (`e`.`module` = 'account' OR `e`.`name` = 'profile_add'), 0, `e`.`object_id`)";

        // the events of its visits, through the visits; then its events outside them
        $iEvents = (int)$this->query("UPDATE `" . $CNF['TABLE_EVENTS'] . "` AS `e` INNER JOIN `" . $CNF['TABLE_SESSIONS'] . "` AS `s` ON `s`.`id` = `e`.`session_id` SET `e`.`object_id` = " . $sAbout . ", `e`.`profile_id` = 0, `e`.`visitor` = UNHEX(MD5(CONCAT(:salt, 's', `e`.`session_id`))) WHERE `s`.`profile_id` = :profile", $aBindings);
        $iEvents += (int)$this->query("UPDATE `" . $CNF['TABLE_EVENTS'] . "` AS `e` SET `e`.`object_id` = " . $sAbout . ", `e`.`profile_id` = 0, `e`.`visitor` = UNHEX(MD5(CONCAT(:salt, 'e', `e`.`id`))) WHERE `e`.`profile_id` = :profile", $aBindings);
        // the profile's creation recorded while visits weren't tied to members
        $this->query("UPDATE `" . $CNF['TABLE_EVENTS'] . "` SET `object_id` = 0 WHERE `type` = 'una' AND `name` = 'profile_add' AND `object_id` = :profile", ['profile' => (int)$iProfileId]);

        $iErrors = (int)$this->query("UPDATE `" . $CNF['TABLE_ERROR_HITS'] . "` SET `profile_id` = 0, `visitor` = IF(`session_id` > 0, UNHEX(MD5(CONCAT(:salt, 's', `session_id`))), UNHEX(MD5(CONCAT(:salt_hit, 'h', `id`)))) WHERE `profile_id` = :profile", $aBindings + ['salt_hit' => $aBindings['salt']]);

        // the visits last: the events above were found through them
        $iSessions = (int)$this->query("UPDATE `" . $CNF['TABLE_SESSIONS'] . "` SET `profile_id` = 0, `visitor` = UNHEX(MD5(CONCAT(:salt, 's', `id`))) WHERE `profile_id` = :profile", $aBindings);

        return $iSessions + $iEvents + $iErrors;
    }

    /**
     * Delete up to `$iLimit` error hits or vitals older than a time; returns how many went.
     */
    public function deleteErrorHitsBefore($iTime, $iLimit)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` WHERE `ts` < :ts ORDER BY `ts` LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
    }

    public function deleteVitalsBefore($iTime, $iLimit)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_VITALS'] . "` WHERE `ts` < :ts ORDER BY `ts` LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
    }

    /**
     * Error groups last seen before a time: their hits are gone too.
     */
    public function deleteErrorGroupsBefore($iTime, $iLimit)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` WHERE `last_seen` < :ts ORDER BY `last_seen` LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
    }

    /**
     * Drop the sample stacks of error groups taken before a time: a group that keeps
     * happening stays, but its stack, which may hold what a visitor typed, is kept no longer
     * than the rest of the data. The next occurrence with a stack takes a new one.
     */
    public function clearErrorStacksBefore($iTime, $iLimit)
    {
        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` SET `stack` = '', `stack_ts` = 0 WHERE `stack_ts` > 0 AND `stack_ts` < :ts LIMIT " . (int)$iLimit, ['ts' => (int)$iTime]);
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

        $aRow = $this->getRow("SELECT COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere, $aBindings);

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

        $aRows = $this->getAllWithKey("SELECT " . $sBucketSql . " AS `bucket`, COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " GROUP BY `bucket` ORDER BY `bucket`", 'bucket', $aBindings);
        if(!$this->_hasEventDimensions($aFilter))
            return $aRows;

        // filtered by a page: that page's views in each bucket, as getTotals counts them, not
        // all views of the visits that saw it; a bucket may have views and no visit started in it
        $aEventBindings = [];
        $sEventWhere = $this->_getEventsWhere($aFilter, $aEventBindings);
        $sEventBucketSql = $this->_getBucketSql('`e`.`ts`', $sBucket, $iOffset, $aStarts, $aEventBindings);
        $aPageviews = $this->getPairs("SELECT " . $sEventBucketSql . " AS `bucket`, COUNT(*) AS `pageviews` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sEventWhere . " GROUP BY `bucket`", 'bucket', 'pageviews', $aEventBindings);

        foreach($aRows as $mixedBucket => $aRow)
            $aRows[$mixedBucket]['pageviews'] = isset($aPageviews[$mixedBucket]) ? (int)$aPageviews[$mixedBucket] : 0;

        foreach($aPageviews as $mixedBucket => $iPageviews)
            if(!isset($aRows[$mixedBucket]))
                $aRows[$mixedBucket] = ['bucket' => $mixedBucket, 'visitors' => 0, 'sessions' => 0, 'pageviews' => (int)$iPageviews, 'bounces' => 0, 'duration' => 0];

        ksort($aRows);

        return $aRows;
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
            return $this->getAll("SELECT " . self::SQL_GROUP_WIDE . " `e`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `e`.`visitor`) AS `visitors`, COUNT(*) AS `pageviews` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`" . $sColumn . "` ORDER BY `visitors` DESC, `pageviews` DESC" . $sLimit, $aBindings);
        }

        if(!isset($this->_aSessionDimensions[$sDimension]))
            return [];

        $sColumn = $this->_aSessionDimensions[$sDimension];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return $this->getAll("SELECT `s`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " GROUP BY `s`.`" . $sColumn . "` ORDER BY `visitors` DESC, `sessions` DESC" . $sLimit, $aBindings);
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
        return (int)$this->getOne("SELECT COUNT(DISTINCT `s`.`" . $this->_aSessionDimensions[$sDimension] . "`) FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere, $aBindings);
    }

    /**
     * Values of any dimension with every metric it has, sorted by one of them, a page at a
     * time: the Query report and its CSV. Session dimensions get the summed session columns
     * (visitors, sessions, pageviews, bounces, duration), event dimensions what getPageStats
     * returns. Ties go by the number of rows, then by the value, so pages don't overlap.
     *
     * @param string $sMetric one of getBreakdownMetrics($sDimension); anything else sorts by the first
     * @param string $sDir ASC or DESC (anything else is DESC)
     * @param int $iMax the most rows one call returns
     * @param bool $bPathSessions pages get entries, bounces and exits (see getPageStats)
     */
    public function getBreakdown($aFilter, $sDimension, $sMetric, $sDir, $iLimit, $iStart = 0, $iMax = 1000, $bPathSessions = true)
    {
        $sDir = $sDir === 'ASC' ? 'ASC' : 'DESC';

        if(isset($this->_aEventDimensions[$sDimension]))
            return $this->getPageStats($aFilter, $sDimension, $iLimit, $iStart, isset($this->_aEventMetrics[$sMetric]) ? $sMetric : 'visitors', $sDir, $iMax, $bPathSessions);

        if(!isset($this->_aSessionDimensions[$sDimension]))
            return [];

        $sColumn = $this->_aSessionDimensions[$sDimension];
        $sOrder = isset($this->_aSessionMetrics[$sMetric]) ? $this->_aSessionMetrics[$sMetric] : $this->_aSessionMetrics['visitors'];
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return $this->getAll("SELECT `s`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " GROUP BY `s`.`" . $sColumn . "` ORDER BY " . $sOrder . " " . $sDir . ", COUNT(*) " . $sDir . ", `s`.`" . $sColumn . "` ASC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min((int)$iMax, (int)$iLimit)), $aBindings);
    }

    /**
     * The metrics of some values of a dimension per time bucket: rows with bucket, value and
     * the columns getBreakdown returns for that dimension (without entries and exits).
     * `value` is the asked value itself: the tables compare text without case and trailing
     * spaces, so a group's own spelling ('facebook' for 'Facebook') can differ per bucket.
     *
     * @param array $aValues the values to follow, a few at most
     * @see getSeries for the bucket parameters
     */
    public function getBreakdownSeries($aFilter, $sDimension, $aValues, $sBucket, $iOffset, $aStarts = [])
    {
        if(empty($aValues))
            return [];

        $aValues = array_values(array_map('strval', $aValues));
        $aBindings = [];

        if(isset($this->_aEventDimensions[$sDimension])) {
            $sColumn = '`e`.`' . $this->_aEventDimensions[$sDimension] . '`';
            $sWhere = $this->_getEventsWhere($aFilter, $aBindings);
            $sIn = $this->_getInSql($aValues, 'qv', $aBindings);
            $sValue = $this->_getValueCaseSql($sColumn, $aValues, $aBindings);
            $sBucketSql = $this->_getBucketSql('`e`.`ts`', $sBucket, $iOffset, $aStarts, $aBindings);

            // GROUP BY looks a name up in the table before the select list, and events have a
            // `value` column: grouped by that, every value of a bucket was one row
            $aRows = $this->getAll("SELECT " . $sBucketSql . " AS `bucket`, " . $sValue . " AS `asked`, COUNT(DISTINCT `e`.`visitor`) AS `visitors`, COUNT(*) AS `pageviews`, IFNULL(AVG(NULLIF(`e`.`engaged`, 0)), 0) / 1000 AS `engaged` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " AND " . $sColumn . " IN (" . $sIn . ") GROUP BY `bucket`, `asked` ORDER BY `bucket`", $aBindings);
            foreach($aRows as $i => $aRow) {
                $aRows[$i] = array_merge(['bucket' => $aRow['bucket'], 'value' => $aRow['asked']], $aRow);
                unset($aRows[$i]['asked']);
            }

            return $aRows;
        }

        if(!isset($this->_aSessionDimensions[$sDimension]))
            return [];

        $sColumn = '`s`.`' . $this->_aSessionDimensions[$sDimension] . '`';
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);
        $sIn = $this->_getInSql($aValues, 'qv', $aBindings);
        $sValue = $this->_getValueCaseSql($sColumn, $aValues, $aBindings);
        $sBucketSql = $this->_getBucketSql('`s`.`started`', $sBucket, $iOffset, $aStarts, $aBindings);

        return $this->getAll("SELECT " . $sBucketSql . " AS `bucket`, " . $sValue . " AS `value`, COUNT(DISTINCT `s`.`visitor`) AS `visitors`, COUNT(*) AS `sessions`, IFNULL(SUM(`s`.`pageviews`), 0) AS `pageviews`, IFNULL(SUM(`s`.`bounce`), 0) AS `bounces`, IFNULL(SUM(`s`.`duration`), 0) AS `duration` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " AND " . $sColumn . " IN (" . $sIn . ") GROUP BY `bucket`, `value` ORDER BY `bucket`", $aBindings);
    }

    /**
     * CASE expression that turns a column into the first of some values it equals, in the
     * column's collation.
     */
    protected function _getValueCaseSql($sColumn, $aValues, &$aBindings)
    {
        $sResult = 'CASE';
        foreach(array_values($aValues) as $i => $sValue) {
            $sResult .= ' WHEN ' . $sColumn . ' = :qw' . $i . ' THEN :qt' . $i;
            $aBindings['qw' . $i] = $sValue;
            $aBindings['qt' . $i] = $sValue;
        }

        return $sResult . ' END';
    }

    /**
     * Pages (or titles) with visitors, pageviews and average engaged time in seconds; pages
     * also get entries, bounces of the sessions that entered there, and exits.
     *
     * @param string $sMetric sort by this metric (visitors, pageviews, engaged), ties by the
     *      row count and the value; empty for the usual order, visitors then pageviews
     * @param string $sDir ASC or DESC, with a metric
     * @param int $iMax the most rows one call returns
     * @param bool $bPathSessions pages get entries, bounces and exits; false skips the two
     *      queries on visits when only the values and their own figures are needed
     */
    public function getPageStats($aFilter, $sDimension, $iLimit, $iStart = 0, $sMetric = '', $sDir = 'DESC', $iMax = 1000, $bPathSessions = true)
    {
        if(!isset($this->_aEventDimensions[$sDimension]))
            return [];

        $sColumn = $this->_aEventDimensions[$sDimension];
        $aBindings = [];
        $sWhere = $this->_getEventsWhere($aFilter, $aBindings);

        $sOrder = '`visitors` DESC, `pageviews` DESC';
        if(isset($this->_aEventMetrics[$sMetric])) {
            $sDir = $sDir === 'ASC' ? 'ASC' : 'DESC';
            $sOrder = $this->_aEventMetrics[$sMetric] . ' ' . $sDir . ', COUNT(*) ' . $sDir . ', `e`.`' . $sColumn . '` ASC';
        }

        $aRows = $this->getAllWithKey("SELECT " . self::SQL_GROUP_WIDE . " `e`.`" . $sColumn . "` AS `value`, COUNT(DISTINCT `e`.`visitor`) AS `visitors`, COUNT(*) AS `pageviews`, IFNULL(AVG(NULLIF(`e`.`engaged`, 0)), 0) / 1000 AS `engaged` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`" . $sColumn . "` ORDER BY " . $sOrder . " LIMIT " . max(0, (int)$iStart) . ", " . max(1, min((int)$iMax, (int)$iLimit)), 'value', $aBindings);
        if(empty($aRows) || $sDimension != 'path' || !$bPathSessions)
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

            $aCounts = $this->getAllWithKey("SELECT `s`.`" . $sSessionColumn . "` AS `value`, COUNT(*) AS `cnt`, SUM(`s`.`bounce`) AS `bounces` FROM " . $this->_getSessionsFrom() . " WHERE " . $sSessionWhere . " AND `s`.`" . $sSessionColumn . "` IN (" . implode(', ', $aIn) . ") GROUP BY `s`.`" . $sSessionColumn . "`", 'value', $aSessionBindings);
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
        $sWhere = $this->_getAnyEventsWhere($aFilter, [$aEvent['type']], $aBindings, $aEvent, $this->_isShortPeriod($aFilter));
        $sBucketSql = $this->_getBucketSql('`e`.`ts`', $sBucket, $iOffset, $aStarts, $aBindings);

        return $this->getAllWithKey("SELECT " . $sBucketSql . " AS `bucket`, COUNT(*) AS `count`, COUNT(DISTINCT `e`.`visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `bucket` ORDER BY `bucket`", 'bucket', $aBindings);
    }

    public function getEventPlatforms($aFilter, $aEvent)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [$aEvent['type']], $aBindings, $aEvent, $this->_isShortPeriod($aFilter));

        return $this->getAll("SELECT `e`.`platform`, COUNT(*) AS `count`, COUNT(DISTINCT `e`.`visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`platform` ORDER BY `count` DESC", $aBindings);
    }

    public function getEventProps($aFilter, $aEvent, $iLimit = 2000)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [$aEvent['type']], $aBindings, $aEvent, $this->_isShortPeriod($aFilter));

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

        return $this->getAll("SELECT `s`.* FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " ORDER BY `s`.`started` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    public function getSessionListCount($aFilter, $iProfileId = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);
        if($iProfileId) {
            $sWhere .= ' AND `s`.`profile_id` = :profile';
            $aBindings['profile'] = (int)$iProfileId;
        }

        return (int)$this->getOne("SELECT COUNT(*) FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere, $aBindings);
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
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings) . ' AND `s`.`profile_id` > 0';

        // the page of members first, from the `profile_id` key alone (it holds the start, the
        // last hit and the platform), then their figures: all of them at once read every
        // visit of every member in the period (9 s for 375,000 visits at 90 days)
        $aIds = $this->getColumn("SELECT `s`.`profile_id` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " GROUP BY `s`.`profile_id` ORDER BY MAX(`s`.`last_seen`) DESC, `s`.`profile_id` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
        if(empty($aIds))
            return [];

        $sIn = $this->_getInSql(array_map('intval', $aIds), 'm', $aBindings);
        $aRows = $this->getAllWithKey("SELECT `s`.`profile_id`, COUNT(*) AS `sessions`, SUM(`s`.`pageviews`) AS `pageviews`, SUM(`s`.`duration`) AS `duration`, MIN(`s`.`started`) AS `first`, MAX(`s`.`last_seen`) AS `last`, GROUP_CONCAT(DISTINCT `s`.`platform` ORDER BY `s`.`platform`) AS `platforms`, SUBSTRING_INDEX(GROUP_CONCAT(`s`.`country` ORDER BY `s`.`last_seen` DESC), ',', 1) AS `country` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " AND `s`.`profile_id` IN (" . $sIn . ") GROUP BY `s`.`profile_id`", 'profile_id', $aBindings);

        $aResult = [];
        foreach($aIds as $iId)
            if(isset($aRows[$iId]))
                $aResult[] = $aRows[$iId];

        return $aResult;
    }

    public function getMemberListCount($aFilter)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return (int)$this->getOne("SELECT COUNT(DISTINCT `s`.`profile_id`) FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " AND `s`.`profile_id` > 0", $aBindings);
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

    /*
     * Conversion: journeys, retention
     */

    /**
     * Each visit's pages in order, for journeys, a page reloaded in place once: [session id
     * => [path, ...]] in session order, from at most `$iLimit` pageviews (the latest sessions
     * win when there are more), and how many pageviews were read.
     *
     * The rows are folded into the visits as they are read, and every path is kept once and
     * shared: a list of rows of the same size took over 100 MB.
     *
     * @return array sequences, rows
     */
    public function getPageSequences($aFilter, $iLimit = 200000)
    {
        $aBindings = [];
        $sWhere = $this->_getEventsWhere($aFilter, $aBindings, true);

        // one direction, the order of the `session_id` key (session, time, id), read backwards
        // and stopped at the limit: sorted the other way within a visit, the server sorted every
        // pageview of the period first (5 s for 7 million at 90 days)
        $oStatement = $this->prepare("SELECT `e`.`session_id`, `e`.`path` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere . " ORDER BY `e`.`session_id` DESC, `e`.`ts` DESC, `e`.`id` DESC LIMIT " . max(1, min(1000000, (int)$iLimit)));
        if(!$oStatement || !$this->res($oStatement, $aBindings))
            return ['sequences' => [], 'rows' => 0];

        $aPaths = [];
        $aSequences = [];
        $iRows = 0;
        while(($aRow = $oStatement->fetch(PDO::FETCH_NUM)) !== false) {
            $iRows++;
            $sPath = (string)$aRow[1];
            if(!isset($aPaths[$sPath]))
                $aPaths[$sPath] = $sPath;
            $sPath = $aPaths[$sPath];

            // backwards: a visit's last page comes first
            $iSession = (int)$aRow[0];
            if(!isset($aSequences[$iSession]))
                $aSequences[$iSession] = [$sPath];
            elseif(end($aSequences[$iSession]) !== $sPath)
                $aSequences[$iSession][] = $sPath;
        }
        $oStatement->closeCursor();

        foreach($aSequences as $iSession => $aSequence)
            $aSequences[$iSession] = array_reverse($aSequence);

        return ['sequences' => array_reverse($aSequences, true), 'rows' => $iRows];
    }

    /**
     * Weekly cohorts counted in the database, in one pass over the visits kept: visitors
     * whose first visit (ever kept) falls in the period, by the week of that visit and the
     * weeks they visited in, as a bit mask (bit n: week n of the period). Members only, or
     * every visitor id. The period starts on a week boundary and weeks are 7 days long, as
     * the week buckets of the reports. A visitor's own rows never reach PHP.
     *
     * The visits are read in the order of the `visitor` key, which holds every column used
     * here, so the grouping needs neither a sort nor a temporary table.
     *
     * @param int $iFrom the first week's start
     * @return array rows of cohort (the week of the first visit, 0 for the period's first),
     *      weeks (the bit mask) and visitors
     */
    public function getRetentionCohorts($iFrom, $iTo, $sPlatform, $bMembersOnly)
    {
        $aBindings = ['to' => (int)$iTo, 'from_first' => (int)$iFrom, 'from_in' => (int)$iFrom, 'from_week' => (int)$iFrom, 'from_cohort' => (int)$iFrom];
        $sWhere = '`s`.`started` < :to';
        if($bMembersOnly)
            $sWhere .= ' AND `s`.`profile_id` > 0';
        if($sPlatform !== '') {
            $sWhere .= ' AND `s`.`platform` = :platform';
            $aBindings['platform'] = $sPlatform;
        }

        return $this->getAll("SELECT FLOOR((`f`.`first` - :from_cohort) / 604800) AS `cohort`, `f`.`weeks`, COUNT(*) AS `visitors`
            FROM (SELECT MIN(`s`.`started`) AS `first`, BIT_OR(IF(`s`.`started` >= :from_in, 1 << FLOOR((`s`.`started` - :from_week) / 604800), 0)) AS `weeks` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " GROUP BY `s`.`visitor` HAVING `first` >= :from_first) AS `f`
            GROUP BY `cohort`, `f`.`weeks`", $aBindings);
    }

    /*
     * Goals and funnels
     */

    /**
     * Goals in their order, the first `$iLimit` only when given.
     */
    public function getGoals($iLimit = 0)
    {
        return $this->getAll("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_GOALS'] . "` ORDER BY `order`, `id`" . ((int)$iLimit > 0 ? " LIMIT " . (int)$iLimit : ''));
    }

    public function getGoalsCount()
    {
        return (int)$this->getOne("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_GOALS'] . "`");
    }

    public function getGoal($iId)
    {
        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_GOALS'] . "` WHERE `id` = :id", ['id' => (int)$iId]);
    }

    public function saveGoal($iId, $aGoal)
    {
        $sTable = $this->_oConfig->CNF['TABLE_GOALS'];
        $aBindings = ['name' => $aGoal['name'], 'type' => $aGoal['type'], 'pattern' => $aGoal['pattern']];
        if($iId)
            return $this->query("UPDATE `" . $sTable . "` SET `name` = :name, `type` = :type, `pattern` = :pattern WHERE `id` = :id", $aBindings + ['id' => (int)$iId]) !== false ? (int)$iId : 0;

        if(!$this->query("INSERT INTO `" . $sTable . "` (`name`, `type`, `pattern`, `added`, `order`) VALUES (:name, :type, :pattern, UNIX_TIMESTAMP(), (SELECT IFNULL(MAX(`o`.`order`), 0) + 1 FROM `" . $sTable . "` AS `o`))", $aBindings))
            return 0;

        return (int)$this->lastId();
    }

    public function deleteGoal($iId)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_GOALS'] . "` WHERE `id` = :id", ['id' => (int)$iId]) > 0;
    }

    public function getFunnels()
    {
        return $this->getAll("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_FUNNELS'] . "` ORDER BY `order`, `id`");
    }

    public function getFunnel($iId)
    {
        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_FUNNELS'] . "` WHERE `id` = :id", ['id' => (int)$iId]);
    }

    public function saveFunnel($iId, $sName, $aSteps)
    {
        $sTable = $this->_oConfig->CNF['TABLE_FUNNELS'];
        $aBindings = ['name' => $sName, 'steps' => json_encode(array_values($aSteps), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)];
        if($iId)
            return $this->query("UPDATE `" . $sTable . "` SET `name` = :name, `steps` = :steps WHERE `id` = :id", $aBindings + ['id' => (int)$iId]) !== false ? (int)$iId : 0;

        if(!$this->query("INSERT INTO `" . $sTable . "` (`name`, `steps`, `added`, `order`) VALUES (:name, :steps, UNIX_TIMESTAMP(), (SELECT IFNULL(MAX(`o`.`order`), 0) + 1 FROM `" . $sTable . "` AS `o`))", $aBindings))
            return 0;

        return (int)$this->lastId();
    }

    public function deleteFunnel($iId)
    {
        return (int)$this->query("DELETE FROM `" . $this->_oConfig->CNF['TABLE_FUNNELS'] . "` WHERE `id` = :id", ['id' => (int)$iId]) > 0;
    }

    /**
     * Visits and visitors that reached a goal (a page or an event) in the period. A site action
     * outside a visit (session_id 0: a payment webhook, cron) is not a visit, but its visitor
     * reached the goal.
     */
    public function getGoalTotals($aFilter, $aGoal)
    {
        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [BX_ANALYTICS_HIT_PAGEVIEW, BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_UNA], $aBindings, null, $this->_isShortPeriod($aFilter)) . ' AND ' . $this->_getMatchSql($aGoal, $aBindings, 'g');

        // nothing but the columns of the `path` key (or `name` and the visit), so a page goal
        // reads no row
        return $this->getRow("SELECT COUNT(DISTINCT NULLIF(`e`.`session_id`, 0)) AS `sessions`, COUNT(DISTINCT `e`.`visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `e` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Visits that reached each step of a funnel in order, counted in the database in one
     * query. A visit reaches the first step the first time it matches it in the period (and
     * the filters), and each next step the first time it matches it after the event that
     * reached the step before; one event counts for one step. One row per visit and step,
     * never one per event, reaches the server's temporary tables, and none reaches PHP.
     *
     * Each step joins the visits of the step before: [session_id, t0, k0, ..., t(n-1), k(n-1)]
     * with tn and kn, NULL when the visit didn't reach step n (and so no step after it). kn
     * orders the events: by the second they happened, then by the order they were stored
     * (ids follow the client's order in a request), so two hits in one second keep their order.
     *
     * @param array $aSteps steps of type and pattern, see _getMatchSql
     * @return array visits per step, in step order
     */
    public function getFunnelCounts($aFilter, $aSteps)
    {
        $aSteps = array_values($aSteps);
        if(empty($aSteps))
            return [];

        $sTable = $this->_oConfig->CNF['TABLE_EVENTS'];

        $aBindings = [];
        $sWhere = $this->_getAnyEventsWhere($aFilter, [BX_ANALYTICS_HIT_PAGEVIEW, BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_UNA], $aBindings, null, $this->_isShortPeriod($aFilter)) . ' AND ' . $this->_getMatchSql($aSteps[0], $aBindings, 's0') . ' AND `e`.`session_id` > 0';
        // 1e20 is past the id range: the second first, then the id
        $sKey = "MIN(CAST(`e`.`ts` AS DECIMAL(31,0)) * 100000000000000000000 + `e`.`id`)";
        $sSql = "SELECT `e`.`session_id`, MIN(`e`.`ts`) AS `t0`, " . $sKey . " AS `k0` FROM `" . $sTable . "` AS `e` WHERE " . $sWhere . " GROUP BY `e`.`session_id`";

        // the filters hold for every event of a visit that matched them, but the period
        $aCounts = ['COUNT(*) AS `c0`'];
        $aBefore = ['`p`.`t0`', '`p`.`k0`'];
        for($i = 1; $i < count($aSteps); $i++) {
            $aBindings['to' . $i] = (int)$aFilter['to'];
            $sSql = "SELECT `p`.`session_id`, " . implode(', ', $aBefore) . ", MIN(`e`.`ts`) AS `t" . $i . "`, " . $sKey . " AS `k" . $i . "` FROM (" . $sSql . ") AS `p` LEFT JOIN `" . $sTable . "` AS `e` ON `e`.`session_id` = `p`.`session_id` AND `e`.`ts` >= `p`.`t" . ($i - 1) . "` AND `e`.`ts` < :to" . $i . " AND CAST(`e`.`ts` AS DECIMAL(31,0)) * 100000000000000000000 + `e`.`id` > `p`.`k" . ($i - 1) . "` AND " . $this->_getMatchSql($aSteps[$i], $aBindings, 's' . $i) . " GROUP BY `p`.`session_id`, " . implode(', ', $aBefore);

            $aCounts[] = 'COUNT(`f`.`t' . $i . '`) AS `c' . $i . '`';
            $aBefore[] = '`p`.`t' . $i . '`';
            $aBefore[] = '`p`.`k' . $i . '`';
        }

        $aRow = $this->getRow("SELECT " . implode(', ', $aCounts) . " FROM (" . $sSql . ") AS `f`", $aBindings);

        $aResult = [];
        foreach(array_keys($aSteps) as $i)
            $aResult[] = isset($aRow['c' . $i]) ? (int)$aRow['c' . $i] : 0;

        return $aResult;
    }

    /**
     * SQL that matches events to a goal or a funnel step: a page path (exact, or with * for
     * any characters) or an event name (custom event or site action, `name@module` for one module).
     */
    protected function _getMatchSql($aMatch, &$aBindings, $sPrefix)
    {
        $sPattern = (string)$aMatch['pattern'];

        if($aMatch['type'] == 'page') {
            $aBindings[$sPrefix . '_pattern'] = str_replace('*', '%', addcslashes($sPattern, '\\%_'));
            return "`e`.`type` = 'pageview' AND `e`.`path` LIKE :" . $sPrefix . "_pattern";
        }

        $aParts = explode('@', $sPattern, 2);
        $aBindings[$sPrefix . '_name'] = $aParts[0];
        $sSql = "`e`.`type` IN ('event', 'una') AND `e`.`name` = :" . $sPrefix . "_name";
        if(isset($aParts[1]) && $aParts[1] !== '') {
            $aBindings[$sPrefix . '_module'] = $aParts[1];
            $sSql .= " AND `e`.`module` = :" . $sPrefix . "_module";
        }

        return $sSql;
    }

    /**
     * WHERE for events (alias `e`) of some types in the period, optionally one event
     * (type, name, module), with session filters through the event's session.
     */
    protected function _getAnyEventsWhere($aFilter, $aTypes, &$aBindings, $aEvent = null, $bCorrelated = false)
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

        // session dimensions go through the session; each page filter stands on its own
        $aThrough = [];
        foreach($aFilter['dims'] as $sName => $sValue) {
            if(isset($this->_aSessionDimensions[$sName])) {
                $aThrough[] = '`sf`.`' . $this->_aSessionDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
            elseif(isset($this->_aEventDimensions[$sName])) {
                $aSql[] = $this->_getPageVisitsInSql('`e`.`session_id`', ['`ef`.`' . $this->_aEventDimensions[$sName] . '` = :d_' . $sName], $aFilter, $aBindings, '_' . $sName);
                $aBindings['d_' . $sName] = $sValue;
            }
        }

        if(!empty($aThrough))
            $aSql[] = $this->_getVisitsInSql('`e`.`session_id`', $aThrough, $aFilter, $aBindings, $bCorrelated);

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
     * Bot rows are per UTC day (the collector's gmdate), so a period in another timezone
     * reads every UTC day it touches: from the UTC day of its first second to the UTC day
     * of its last one. East of UTC that starts a day before the local first day, west of
     * UTC it ends a day after the local last one. Reports chart these same days.
     */
    public function getBotDays($aFilter)
    {
        $iFrom = (int)$aFilter['from'];

        return [
            'from' => gmdate('Y-m-d', $iFrom),
            'to' => gmdate('Y-m-d', max($iFrom, (int)$aFilter['to'] - 1)),
        ];
    }

    /**
     * Bot rows are per UTC day: the period's UTC days (getBotDays), its platform (the pages
     * table has none) and the categories.
     */
    protected function _getBotsWhere($aFilter, $aCategories, &$aBindings, $bPlatform = true)
    {
        $aDays = $this->getBotDays($aFilter);
        $aSql = ['`day` >= :day_from', '`day` <= :day_to'];
        $aBindings['day_from'] = $aDays['from'];
        $aBindings['day_to'] = $aDays['to'];

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

        return $this->getAll("SELECT `s`.`lat`, `s`.`lng`, MAX(`s`.`city`) AS `city`, MAX(`s`.`country`) AS `country`, COUNT(DISTINCT `s`.`visitor`) AS `visitors` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " AND `s`.`lat` IS NOT NULL GROUP BY `s`.`lat`, `s`.`lng` ORDER BY `visitors` DESC LIMIT " . max(1, min(2000, (int)$iLimit)), $aBindings);
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
    public function getLastHits($iUntil)
    {
        return $this->getPairs("SELECT `platform`, MAX(`last_seen`) AS `last` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `last_seen` <= :until GROUP BY `platform`", 'platform', 'last', ['until' => (int)$iUntil]);
    }

    /**
     * Hits in a time range per platform, from the index on events: platform => [hits, last].
     */
    public function getRecentHits($iSince, $iUntil)
    {
        return $this->getAllWithKey("SELECT `platform`, COUNT(*) AS `hits`, MAX(`ts`) AS `last` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` WHERE `ts` >= :since AND `ts` <= :until GROUP BY `platform`", 'platform', ['since' => (int)$iSince, 'until' => (int)$iUntil]);
    }

    /**
     * The latest hit of a platform up to a time, visit or not (the server's own hits and
     * actions outside a visit keep none): one lookup in the platform index.
     */
    public function getLastEvent($sPlatform, $iUntil)
    {
        return (int)$this->getOne("SELECT MAX(`ts`) FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` WHERE `platform` = :platform AND `ts` <= :until", ['until' => (int)$iUntil, 'platform' => $sPlatform]);
    }

    /**
     * Visitors in visits active in a time range, per platform.
     */
    public function getActiveVisitors($iSince, $iUntil)
    {
        return $this->getPairs("SELECT `platform`, COUNT(DISTINCT `visitor`) AS `visitors` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `last_seen` >= :since AND `started` <= :until GROUP BY `platform`", 'platform', 'visitors', ['since' => (int)$iSince, 'until' => (int)$iUntil]);
    }

    /**
     * Visits started in a time range, per platform.
     */
    public function getStartedSessions($iSince, $iUntil)
    {
        return $this->getPairs("SELECT `platform`, COUNT(*) AS `sessions` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `started` >= :since AND `started` <= :until GROUP BY `platform`", 'platform', 'sessions', ['since' => (int)$iSince, 'until' => (int)$iUntil]);
    }

    /**
     * App versions in visits started in a time range, as rows of platform and app_version.
     */
    public function getAppVersions($iSince, $iUntil, $aPlatforms)
    {
        if(empty($aPlatforms))
            return [];

        $aBindings = ['since' => (int)$iSince, 'until' => (int)$iUntil];
        $sIn = $this->_getInSql($aPlatforms, 'platform', $aBindings);

        return $this->getAll("SELECT DISTINCT `platform`, `app_version` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `started` >= :since AND `started` <= :until AND `platform` IN (" . $sIn . ") AND `app_version` <> '' LIMIT 1000", $aBindings);
    }

    /*
     * Studio tools
     */

    /**
     * Site pages with active analytics blocks: the module's own page, builder copies on any
     * other page, and pages made with the Dashboards tool. Studio's own pages are left out.
     * Each page with its number of blocks and how many of them NEO renders (active_api).
     */
    public function getPagesWithBlocks($sModule)
    {
        return $this->getAll("SELECT `p`.`object`, `p`.`uri`, `p`.`url`, `p`.`title`, `p`.`module`, `p`.`deletable`, COUNT(`b`.`id`) AS `blocks`, SUM(`b`.`active_api`) AS `api_blocks`
            FROM `sys_pages_blocks` AS `b`
            INNER JOIN `sys_objects_page` AS `p` ON `p`.`object` = `b`.`object`
            WHERE `b`.`module` = :module AND `b`.`type` = 'service' AND `b`.`active` = 1 AND `b`.`object` <> '' AND `b`.`object` NOT LIKE 'sys\_std\_%'
            GROUP BY `p`.`object`, `p`.`uri`, `p`.`url`, `p`.`title`, `p`.`module`, `p`.`deletable`
            ORDER BY `p`.`id`", ['module' => $sModule]);
    }

    public function isPageObject($sObject)
    {
        return (bool)$this->getOne("SELECT 1 FROM `sys_objects_page` WHERE `object` = :object LIMIT 1", ['object' => $sObject]);
    }

    public function isPageUri($sUri)
    {
        return (bool)$this->getOne("SELECT 1 FROM `sys_objects_page` WHERE `uri` = :uri LIMIT 1", ['uri' => $sUri]);
    }

    /**
     * A new page of the module, with copies of the blocks in some cells of another page.
     * The copies are shown in NEO when their source is (active_api: a block NEO has no
     * element for shows as raw data there) and can't be copied again from the builder.
     *
     * @param array $aPage object, uri, title_system, title, module, layout_id, author
     * @param string $sFrom the page whose blocks are copied
     * @param array $aCells cell ids to copy
     * @return int blocks copied, or false when the page wasn't created
     */
    public function insertPageWithBlocks($aPage, $sFrom, $aCells)
    {
        $bInserted = $this->query("INSERT INTO `sys_objects_page` SET `author` = :author, `added` = :added, `object` = :object, `uri` = :uri, `title_system` = :title_system, `title` = :title, `module` = :module, `layout_id` = :layout_id, `visible_for_levels` = 2147483647, `visible_for_levels_editable` = 1, `url` = :url, `meta_robots` = 'noindex', `cache_lifetime` = 0, `cache_editable` = 1, `deletable` = 1", [
            'author' => (int)$aPage['author'],
            'added' => time(),
            'object' => $aPage['object'],
            'uri' => $aPage['uri'],
            'title_system' => $aPage['title_system'],
            'title' => $aPage['title'],
            'module' => $aPage['module'],
            'layout_id' => (int)$aPage['layout_id'],
            'url' => 'page.php?i=' . $aPage['uri'],
        ]);
        if(!$bInserted)
            return false;

        $aBindings = ['object' => $aPage['object'], 'from' => $sFrom];
        $sIn = $this->_getInSql(array_map('intval', $aCells), 'cell', $aBindings);

        return (int)$this->query("INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`)
            SELECT :object, `cell_id`, `module`, `title_system`, `title`, `designbox_id`, `class`, `visible_for_levels`, `type`, `content`, 1, 0, 1, `active_api`, `order`
            FROM `sys_pages_blocks` WHERE `object` = :from AND `active` = 1 AND `cell_id` IN (" . $sIn . ") ORDER BY `cell_id`, `order`", $aBindings);
    }

    /**
     * Whether the classic tracker is injected into the site's pages.
     */
    public function isInjectionActive($sName)
    {
        return (bool)$this->getOne("SELECT `active` FROM `sys_injections` WHERE `name` = :name LIMIT 1", ['name' => $sName]);
    }

    /**
     * Alerts a handler listens to, as rows of unit and action.
     */
    public function getHandlerAlerts($sHandler)
    {
        return $this->getAll("SELECT `a`.`unit`, `a`.`action` FROM `sys_alerts` AS `a` INNER JOIN `sys_alerts_handlers` AS `h` ON `h`.`id` = `a`.`handler_id` WHERE `h`.`name` = :name ORDER BY `a`.`id`", ['name' => $sHandler]);
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
     * A visit's hits are taken to be at most this many seconds before its start or after its
     * last hit, to bound the visits or pageviews a filter across the two tables reads.
     */
    const VISIT_SLACK = 86400;

    /**
     * `$sColumn` (a session id) is a visit that matches session conditions on `sf` and has
     * hits in the period. The visits are found first, once, and the rows only look them up:
     * a correlated EXISTS looked a visit up for every pageview, millions over 90 days, and lets
     * the optimizer group the pageviews in a temporary table. The hint asks MariaDB 12 and
     * MySQL for that order; older servers read it as a comment.
     *
     * @param bool $bCorrelated look each row's visit up instead: for a scan that stops after
     *      a few rows (a LIMIT in key order), where finding every visit first costs more
     */
    protected function _getVisitsInSql($sColumn, $aConditions, $aFilter, &$aBindings, $bCorrelated = false)
    {
        if($bCorrelated)
            return "EXISTS (SELECT 1 FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `sf` WHERE `sf`.`id` = " . $sColumn . " AND " . implode(' AND ', $aConditions) . ")";

        $aBindings['sf_from'] = (int)$aFilter['from'] - self::VISIT_SLACK;
        $aBindings['sf_to'] = (int)$aFilter['to'] + self::VISIT_SLACK;

        return $sColumn . " IN (SELECT " . self::SQL_SUBQUERY_FIRST . " `sf`.`id` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `sf` WHERE `sf`.`last_seen` >= :sf_from AND `sf`.`started` < :sf_to AND " . implode(' AND ', $aConditions) . ")";
    }

    /**
     * `$sColumn` (a session id) is a visit with a pageview that matches conditions on `ef`,
     * viewed from a day before the period on: the visits come from the `path` key (a page
     * filter) and are looked up once each, see _getVisitsInSql.
     *
     * @param string $sSuffix tells the bindings of several such conditions apart
     */
    protected function _getPageVisitsInSql($sColumn, $aConditions, $aFilter, &$aBindings, $sSuffix = '')
    {
        $aBindings['ef_from' . $sSuffix] = (int)$aFilter['from'] - self::VISIT_SLACK;

        return $sColumn . " IN (SELECT " . self::SQL_SUBQUERY_FIRST . " `ef`.`session_id` FROM `" . $this->_oConfig->CNF['TABLE_EVENTS'] . "` AS `ef` WHERE `ef`.`type` = 'pageview' AND `ef`.`ts` >= :ef_from" . $sSuffix . " AND " . implode(' AND ', $aConditions) . ")";
    }

    /**
     * The sessions table for reports, alias `s`. With a platform filter the optimizer may read
     * the visits of the platform through `platform_seen` (kept for Setup's last hit per
     * platform) instead of the period's range of the covering `started` key; when the kept
     * data is about as long as the period, it did: 7 s instead of 0.4 s for 90 days.
     */
    protected function _getSessionsFrom()
    {
        return "`" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` AS `s` IGNORE INDEX (`platform_seen`)";
    }

    /**
     * Whether a period is short enough to look the visit of each row up (see _getVisitsInSql):
     * a week of events of one kind are few rows, and finding every visit of the filter first
     * costs a scan of the visits' table (1.5 s at 2.5 million visits).
     */
    protected function _isShortPeriod($aFilter)
    {
        return (int)$aFilter['to'] - (int)$aFilter['from'] <= 8 * 86400;
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
            $aSql[] = $this->_getPageVisitsInSql('`s`.`id`', $aEventSql, $aFilter, $aBindings);

        return implode(' AND ', $aSql);
    }

    /**
     * WHERE for pageview events (alias `e`) in the period that match the filters. Session
     * filters keep the events of matching sessions.
     */
    protected function _getEventsWhere($aFilter, &$aBindings, $bCorrelated = false)
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
            $aSql[] = $this->_getVisitsInSql('`e`.`session_id`', $aSessionSql, $aFilter, $aBindings, $bCorrelated);

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
            // INTERVAL() finds the last start up to the value by a binary search over the
            // ascending list, ELT() returns that start; a CASE with a branch per start costs a
            // comparison per bucket for every row (90 at 90 days). Before the first start: 0.
            $aFind = [];
            $aPick = [];
            foreach(array_values($aStarts) as $i => $iStart) {
                $aFind[] = ':b' . $i;
                $aPick[] = ':b' . $i . 'v';
                $aBindings['b' . $i] = (int)$iStart;
                $aBindings['b' . $i . 'v'] = (int)$iStart;
            }
            return 'IFNULL(ELT(INTERVAL(' . $sColumn . ', ' . implode(', ', $aFind) . '), ' . implode(', ', $aPick) . '), 0)';
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
     * Health: errors and vitals
     */

    /**
     * Columns of an error hit that filters read directly; other dimensions go through its visit.
     */
    protected $_aErrorHitDimensions = ['app_version', 'browser', 'os', 'device', 'country', 'path'];

    /**
     * Columns an error breakdown may group by.
     */
    protected $_aErrorBreakdowns = ['platform', 'app_version', 'browser', 'os', 'device', 'country', 'route'];

    /**
     * Raise a visit's error count by `$iCount` unless that passes `$iMax`.
     *
     * @return bool whether the errors fit
     */
    public function addSessionErrors($iSessionId, $iCount, $iMax)
    {
        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` SET `errors` = `errors` + :n WHERE `id` = :id AND `errors` + :n2 <= :max", [
            'id' => (int)$iSessionId,
            'n' => (int)$iCount,
            'n2' => (int)$iCount,
            'max' => (int)$iMax,
        ]) > 0;
    }

    public function getErrorGroupByFingerprint($sFingerprint)
    {
        return $this->getRow("SELECT `id`, `status`, `status_changed` FROM `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` WHERE `fingerprint` = :fingerprint", ['fingerprint' => $sFingerprint]);
    }

    /**
     * Error groups created in a time span (server time, whatever the age of their first error).
     */
    public function getErrorGroupsCreated($iFrom, $iTo)
    {
        return (int)$this->getOne("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` WHERE `created` >= :from AND `created` <= :to", ['from' => (int)$iFrom, 'to' => (int)$iTo]);
    }

    /**
     * Add an occurrence to an error's group, creating the group with its sample stack when it
     * is new. The stack is replaced by a newer one once a day, so it follows new releases.
     * The message and the source are the latest occurrence's, so no visitor text in them
     * outlives the group's last occurrence (pruning clears old stacks, see
     * clearErrorStacksBefore). MySQL assigns left to right: `stack` comes before `stack_ts`,
     * the message and the source before `last_seen`.
     *
     * @param string $sFingerprint 16 bytes, see BxAnalyticsErrors::getFingerprint
     * @param array $aError kind, message, source, line, col, status, stack, fatal, repeats
     * @param int $iTime when it happened
     * @param int $iNow server time
     * @param int $iId the group's id when it is known to exist: an update, which doesn't use
     *      up an auto-increment id as INSERT ... ON DUPLICATE KEY UPDATE does
     * @return int the group's id, 0 on failure
     */
    public function saveErrorGroup($sFingerprint, $aError, $iTime, $iNow, $iId = 0)
    {
        if($iId) {
            $bResult = $this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` SET
                `message` = IF(:message_ts >= `last_seen`, :message, `message`),
                `source` = IF(:source_ts >= `last_seen`, :source, `source`),
                `first_seen` = LEAST(`first_seen`, :first_seen),
                `last_seen` = GREATEST(`last_seen`, :last_seen),
                `occurrences` = `occurrences` + :occurrences,
                `fatal` = GREATEST(`fatal`, :fatal),
                `stack` = IF(:stack != '' AND `stack_ts` < :stack_ts - 86400, :stack_new, `stack`),
                `stack_ts` = IF(:stack_check != '' AND `stack_ts` < :stack_ts_check - 86400, :stack_ts_new, `stack_ts`)
                WHERE `id` = :id", [
                'id' => (int)$iId,
                'message' => $aError['message'],
                'message_ts' => (int)$iTime,
                'source' => $aError['source'],
                'source_ts' => (int)$iTime,
                'first_seen' => (int)$iTime,
                'last_seen' => (int)$iTime,
                'occurrences' => isset($aError['repeats']) ? (int)$aError['repeats'] : 1,
                'fatal' => (int)$aError['fatal'],
                'stack' => $aError['stack'],
                'stack_new' => $aError['stack'],
                'stack_check' => $aError['stack'],
                'stack_ts' => (int)$iNow,
                'stack_ts_check' => (int)$iNow,
                'stack_ts_new' => (int)$iNow,
            ]);

            return $bResult !== false ? (int)$iId : 0;
        }

        $bResult = $this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` (`fingerprint`, `kind`, `message`, `source`, `line`, `col`, `status_code`, `stack`, `stack_ts`, `first_seen`, `last_seen`, `occurrences`, `fatal`, `created`) VALUES (:fingerprint, :kind, :message, :source, :line, :col, :status_code, :stack, :stack_ts, :first_seen, :last_seen, :occurrences, :fatal, :created)
            ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`),
                `message` = IF(VALUES(`last_seen`) >= `last_seen`, VALUES(`message`), `message`),
                `source` = IF(VALUES(`last_seen`) >= `last_seen`, VALUES(`source`), `source`),
                `first_seen` = LEAST(`first_seen`, VALUES(`first_seen`)),
                `last_seen` = GREATEST(`last_seen`, VALUES(`last_seen`)),
                `occurrences` = `occurrences` + VALUES(`occurrences`),
                `fatal` = GREATEST(`fatal`, VALUES(`fatal`)),
                `stack` = IF(VALUES(`stack`) != '' AND `stack_ts` < VALUES(`stack_ts`) - 86400, VALUES(`stack`), `stack`),
                `stack_ts` = IF(VALUES(`stack`) != '' AND `stack_ts` < VALUES(`stack_ts`) - 86400, VALUES(`stack_ts`), `stack_ts`)", [
            'fingerprint' => $sFingerprint,
            'kind' => $aError['kind'],
            'message' => $aError['message'],
            'source' => $aError['source'],
            'line' => (int)$aError['line'],
            'col' => (int)$aError['col'],
            'status_code' => (int)$aError['status'],
            'stack' => $aError['stack'],
            'stack_ts' => $aError['stack'] !== '' ? (int)$iNow : 0,
            'first_seen' => (int)$iTime,
            'last_seen' => (int)$iTime,
            'occurrences' => isset($aError['repeats']) ? (int)$aError['repeats'] : 1,
            'fatal' => (int)$aError['fatal'],
            'created' => (int)$iNow,
        ]);

        return $bResult !== false ? (int)$this->lastId() : 0;
    }

    /**
     * Set an error group's status (open, resolved, ignored), optionally only from another one.
     */
    public function setErrorStatus($iId, $sStatus, $iTime, $sFrom = '')
    {
        $aBindings = ['id' => (int)$iId, 'status' => $sStatus, 'time' => (int)$iTime];
        $sWhere = '';
        if($sFrom !== '') {
            $sWhere = ' AND `status` = :from';
            $aBindings['from'] = $sFrom;
        }

        return $this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` SET `status` = :status, `status_changed` = :time WHERE `id` = :id" . $sWhere, $aBindings) !== false;
    }

    public function getErrorGroup($iId)
    {
        return $this->getRow("SELECT `id`, `kind`, `message`, `source`, `line`, `col`, `status_code`, `stack`, `first_seen`, `last_seen`, `occurrences`, `fatal`, `status`, `status_changed` FROM `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` WHERE `id` = :id", ['id' => (int)$iId]);
    }

    public function getErrorGroups($aIds)
    {
        if(empty($aIds))
            return [];

        $aBindings = [];
        $aIn = [];
        foreach(array_values($aIds) as $i => $iId) {
            $aIn[] = ':id' . $i;
            $aBindings['id' . $i] = (int)$iId;
        }

        return $this->getAllWithKey("SELECT `id`, `kind`, `message`, `source`, `line`, `col`, `status_code`, `first_seen`, `last_seen`, `occurrences`, `fatal`, `status` FROM `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` WHERE `id` IN (" . implode(', ', $aIn) . ")", 'id', $aBindings);
    }

    /**
     * Insert error hits in one query.
     *
     * @return int rows inserted
     */
    public function insertErrorHits($aRows)
    {
        return $this->_insertRows($this->_oConfig->CNF['TABLE_ERROR_HITS'], $aRows);
    }

    /**
     * One page view's vitals; metrics not measured are left NULL.
     */
    public function insertVitals($aRow)
    {
        return $this->_insertRows($this->_oConfig->CNF['TABLE_VITALS'], [$aRow]);
    }

    /**
     * Error hits, visits with errors, visitors, and visits that ended in a fatal error on some
     * platforms, for error groups in some statuses.
     *
     * @param array $aFilter report filter
     * @param array $aStatuses group statuses
     * @param array $aFatalPlatforms platforms whose fatal errors are crashes (the apps)
     */
    public function getErrorTotals($aFilter, $aStatuses, $aFatalPlatforms = [])
    {
        $aBindings = [];
        $sWhere = $this->_getErrorHitsWhere($aFilter, $aStatuses, $aBindings);

        // a crash outside any visit known (an app that stopped before its first page, or whose
        // visit could not be found when it reported the crash on its next launch) is a visit too
        $sFatal = '0';
        if(!empty($aFatalPlatforms))
            $sFatal = "COUNT(DISTINCT CASE WHEN `h`.`fatal` = 1 AND `h`.`session_id` > 0 AND `h`.`platform` IN (" . $this->_getInSql($aFatalPlatforms, 'fp', $aBindings) . ") THEN `h`.`session_id` END) + COUNT(CASE WHEN `h`.`fatal` = 1 AND `h`.`session_id` = 0 AND `h`.`platform` IN (" . $this->_getInSql($aFatalPlatforms, 'fu', $aBindings) . ") THEN `h`.`id` END)";

        return $this->getRow("SELECT IFNULL(SUM(`h`.`repeats`), 0) AS `hits`, COUNT(DISTINCT NULLIF(`h`.`session_id`, 0)) AS `sessions`, COUNT(DISTINCT `h`.`visitor`) AS `users`, " . $sFatal . " AS `fatal_sessions` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` INNER JOIN `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` AS `g` ON `g`.`id` = `h`.`error_id` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Visits that started in the period per platform.
     */
    public function getSessionsPerPlatform($aFilter)
    {
        $aBindings = [];
        $sWhere = $this->_getSessionsWhere($aFilter, $aBindings);

        return $this->getPairs("SELECT `s`.`platform`, COUNT(*) AS `sessions` FROM " . $this->_getSessionsFrom() . " WHERE " . $sWhere . " GROUP BY `s`.`platform`", 'platform', 'sessions', $aBindings);
    }

    /**
     * Error groups with their hits in the period, most frequent first.
     *
     * @param int $iFirstSeenFrom only groups first seen since this time (new errors), 0 for any
     */
    public function getErrorList($aFilter, $aStatuses, $iFirstSeenFrom, $iLimit, $iStart = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getErrorHitsWhere($aFilter, $aStatuses, $aBindings, $iFirstSeenFrom);

        return $this->getAll("SELECT `h`.`error_id`, SUM(`h`.`repeats`) AS `count`, COUNT(DISTINCT NULLIF(`h`.`session_id`, 0)) AS `sessions`, COUNT(DISTINCT `h`.`visitor`) AS `users`, GROUP_CONCAT(DISTINCT `h`.`platform` ORDER BY `h`.`platform`) AS `platforms`, MAX(`h`.`fatal`) AS `fatal`, MAX(`h`.`ts`) AS `last_in` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` INNER JOIN `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` AS `g` ON `g`.`id` = `h`.`error_id` WHERE " . $sWhere . " GROUP BY `h`.`error_id` ORDER BY `count` DESC, `h`.`error_id` DESC LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    public function getErrorListCount($aFilter, $aStatuses, $iFirstSeenFrom = 0)
    {
        $aBindings = [];
        $sWhere = $this->_getErrorHitsWhere($aFilter, $aStatuses, $aBindings, $iFirstSeenFrom);

        return (int)$this->getOne("SELECT COUNT(DISTINCT `h`.`error_id`) FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` INNER JOIN `" . $this->_oConfig->CNF['TABLE_ERRORS'] . "` AS `g` ON `g`.`id` = `h`.`error_id` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Hits per time bucket of some error groups, or of one with visitors too.
     *
     * @return array [error id => [bucket => count]]
     */
    public function getErrorTrends($aFilter, $aIds, $sBucket, $iOffset, $aStarts = [])
    {
        if(empty($aIds))
            return [];

        $aBindings = [];
        $sWhere = $this->_getErrorHitsWhere($aFilter, [], $aBindings) . " AND `h`.`error_id` IN (" . $this->_getInSql($aIds, 'e', $aBindings) . ")";
        $sBucketSql = $this->_getBucketSql('`h`.`ts`', $sBucket, $iOffset, $aStarts, $aBindings);

        $aResult = [];
        foreach($this->getAll("SELECT `h`.`error_id`, " . $sBucketSql . " AS `bucket`, SUM(`h`.`repeats`) AS `count` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` WHERE " . $sWhere . " GROUP BY `h`.`error_id`, `bucket`", $aBindings) as $aRow)
            $aResult[(int)$aRow['error_id']][(int)$aRow['bucket']] = (int)$aRow['count'];

        return $aResult;
    }

    public function getErrorSeries($aFilter, $iId, $sBucket, $iOffset, $aStarts = [])
    {
        $aBindings = ['error' => (int)$iId];
        $sWhere = $this->_getErrorHitsWhere($aFilter, [], $aBindings) . " AND `h`.`error_id` = :error";
        $sBucketSql = $this->_getBucketSql('`h`.`ts`', $sBucket, $iOffset, $aStarts, $aBindings);

        return $this->getAllWithKey("SELECT " . $sBucketSql . " AS `bucket`, SUM(`h`.`repeats`) AS `count`, COUNT(DISTINCT `h`.`visitor`) AS `users` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` WHERE " . $sWhere . " GROUP BY `bucket` ORDER BY `bucket`", 'bucket', $aBindings);
    }

    /**
     * One error group's hits, visits and visitors in the period.
     */
    public function getErrorStats($aFilter, $iId)
    {
        $aBindings = ['error' => (int)$iId];
        $sWhere = $this->_getErrorHitsWhere($aFilter, [], $aBindings) . " AND `h`.`error_id` = :error";

        return $this->getRow("SELECT IFNULL(SUM(`h`.`repeats`), 0) AS `count`, COUNT(DISTINCT NULLIF(`h`.`session_id`, 0)) AS `sessions`, COUNT(DISTINCT `h`.`visitor`) AS `users` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` WHERE " . $sWhere, $aBindings);
    }

    /**
     * One error group's hits by a client column: platform, app version, browser, OS, device,
     * country or route.
     */
    public function getErrorBreakdown($aFilter, $iId, $sColumn, $iLimit = 10)
    {
        if(!in_array($sColumn, $this->_aErrorBreakdowns, true))
            return [];

        $aBindings = ['error' => (int)$iId];
        $sWhere = $this->_getErrorHitsWhere($aFilter, [], $aBindings) . " AND `h`.`error_id` = :error";

        return $this->getAll("SELECT `h`.`" . $sColumn . "` AS `value`, SUM(`h`.`repeats`) AS `count`, COUNT(DISTINCT `h`.`visitor`) AS `users` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` WHERE " . $sWhere . " GROUP BY `h`.`" . $sColumn . "` ORDER BY `count` DESC LIMIT " . max(1, min(100, (int)$iLimit)), $aBindings);
    }

    /**
     * One error group's latest hits in the period.
     */
    public function getErrorOccurrences($aFilter, $iId, $iLimit = 20)
    {
        $aBindings = ['error' => (int)$iId];
        $sWhere = $this->_getErrorHitsWhere($aFilter, [], $aBindings) . " AND `h`.`error_id` = :error";

        return $this->getAll("SELECT `h`.`ts`, `h`.`session_id`, `h`.`platform`, `h`.`app_version`, `h`.`browser`, `h`.`os`, `h`.`device`, `h`.`country`, `h`.`path`, `h`.`repeats`, `h`.`fatal` FROM `" . $this->_oConfig->CNF['TABLE_ERROR_HITS'] . "` AS `h` WHERE " . $sWhere . " ORDER BY `h`.`ts` DESC, `h`.`id` DESC LIMIT " . max(1, min(100, (int)$iLimit)), $aBindings);
    }

    /**
     * A log-scale histogram of a metric (see BxAnalyticsVitals::getBucket), optionally per
     * platform, page (route or path) or time bucket.
     *
     * @param array $aFilter report filter
     * @param string $sMetric a BxAnalyticsVitals::METRICS column
     * @param string $sDevice all, mobile (with tablets) or desktop
     * @param string $sGroup '', platform, route, path or bucket
     * @param array $aIn values of the group to keep (pages)
     * @param array $aBucket [bucket, offset, starts] when grouped by time
     * @return array rows of grp, hb, side (0 up to the good threshold, 1 between, 2 above
     *      the poor one), n
     */
    public function getVitalsHistogram($aFilter, $sMetric, $sDevice, $sGroup = '', $aIn = [], $aBucket = [])
    {
        if(!in_array($sMetric, BxAnalyticsVitals::METRICS, true))
            return [];

        $aBindings = [
            'side_good' => (int)$this->_oConfig->CNF['VITALS'][$sMetric][0],
            'side_poor' => (int)$this->_oConfig->CNF['VITALS'][$sMetric][1],
        ];
        $sWhere = $this->_getVitalsWhere($aFilter, $sDevice, $aBindings) . " AND `v`.`" . $sMetric . "` IS NOT NULL";

        switch($sGroup) {
            case 'platform':
            case 'route':
            case 'path':
                $sGroupSql = "`v`.`" . $sGroup . "`";
                if(!empty($aIn))
                    $sWhere .= " AND `v`.`" . $sGroup . "` IN (" . $this->_getInSql($aIn, 'g', $aBindings) . ")";
                break;

            case 'bucket':
                $sGroupSql = $this->_getBucketSql('`v`.`ts`', $aBucket[0], $aBucket[1], $aBucket[2], $aBindings);
                break;

            default:
                $sGroupSql = "''";
        }

        return $this->getAll("SELECT " . $sGroupSql . " AS `grp`, " . $this->_getVitalsBucketSql($sMetric) . " AS `hb`, (`v`.`" . $sMetric . "` > :side_good) + (`v`.`" . $sMetric . "` > :side_poor) AS `side`, COUNT(*) AS `n` FROM `" . $this->_oConfig->CNF['TABLE_VITALS'] . "` AS `v` WHERE " . $sWhere . " GROUP BY `grp`, `hb`, `side`", $aBindings);
    }

    /**
     * Log-scale histograms of several metrics in one pass over the period: each row is
     * paired with every metric (a derived table of their names), and the metric's own
     * column is bucketed.
     *
     * @return array rows of grp (the metric), hb, n
     */
    public function getVitalsHistograms($aFilter, $aMetrics, $sDevice)
    {
        $aMetrics = array_values(array_intersect(BxAnalyticsVitals::METRICS, $aMetrics));
        if(empty($aMetrics))
            return [];

        $aBindings = [];
        $sWhere = $this->_getVitalsWhere($aFilter, $sDevice, $aBindings);

        $aNames = [];
        $aValue = [];
        $aBucket = [];
        foreach($aMetrics as $sMetric) {
            // names from BxAnalyticsVitals::METRICS only
            $aNames[] = "SELECT '" . $sMetric . "' AS `metric`";
            $aValue[] = "WHEN '" . $sMetric . "' THEN `v`.`" . $sMetric . "`";
            $aBucket[] = "WHEN '" . $sMetric . "' THEN " . $this->_getVitalsBucketSql($sMetric);
        }

        // the vitals table is read first and once; the metric names join to each row
        return $this->getAll("SELECT `m`.`metric` AS `grp`, CASE `m`.`metric` " . implode(' ', $aBucket) . " END AS `hb`, COUNT(*) AS `n` FROM `" . $this->_oConfig->CNF['TABLE_VITALS'] . "` AS `v` STRAIGHT_JOIN (" . implode(' UNION ALL ', $aNames) . ") AS `m` WHERE " . $sWhere . " AND CASE `m`.`metric` " . implode(' ', $aValue) . " END IS NOT NULL GROUP BY `grp`, `hb`", $aBindings);
    }

    /**
     * A metric's histogram bucket, see BxAnalyticsVitals::getBucket.
     */
    protected function _getVitalsBucketSql($sMetric)
    {
        return "IF(`v`.`" . $sMetric . "` = 0, -1, FLOOR(LN(`v`.`" . $sMetric . "`) * " . BxAnalyticsVitals::BUCKETS . "))";
    }

    /**
     * Samples, good and poor values of every metric in one pass.
     *
     * @param array $aThresholds metric => [good up to, poor above], stored units
     * @return array metric => [samples, good, poor]
     */
    public function getVitalsDistribution($aFilter, $sDevice, $aThresholds)
    {
        $aBindings = [];
        $sWhere = $this->_getVitalsWhere($aFilter, $sDevice, $aBindings);

        $aSql = [];
        foreach(BxAnalyticsVitals::METRICS as $sMetric) {
            $aSql[] = "SUM(`v`.`" . $sMetric . "` IS NOT NULL) AS `" . $sMetric . "_n`, SUM(`v`.`" . $sMetric . "` <= :" . $sMetric . "_good) AS `" . $sMetric . "_good`, SUM(`v`.`" . $sMetric . "` > :" . $sMetric . "_poor) AS `" . $sMetric . "_poor`";
            $aBindings[$sMetric . '_good'] = (int)$aThresholds[$sMetric][0];
            $aBindings[$sMetric . '_poor'] = (int)$aThresholds[$sMetric][1];
        }

        $aRow = $this->getRow("SELECT " . implode(', ', $aSql) . " FROM `" . $this->_oConfig->CNF['TABLE_VITALS'] . "` AS `v` WHERE " . $sWhere, $aBindings);

        $aResult = [];
        foreach(BxAnalyticsVitals::METRICS as $sMetric)
            $aResult[$sMetric] = [
                'samples' => isset($aRow[$sMetric . '_n']) ? (int)$aRow[$sMetric . '_n'] : 0,
                'good' => isset($aRow[$sMetric . '_good']) ? (int)$aRow[$sMetric . '_good'] : 0,
                'poor' => isset($aRow[$sMetric . '_poor']) ? (int)$aRow[$sMetric . '_poor'] : 0,
            ];

        return $aResult;
    }

    /**
     * Pages (routes or paths) with the most samples of a metric.
     */
    public function getVitalsPages($aFilter, $sMetric, $sDevice, $sGroup, $iLimit, $iStart = 0)
    {
        if(!in_array($sMetric, BxAnalyticsVitals::METRICS, true) || !in_array($sGroup, ['route', 'path'], true))
            return [];

        $aBindings = [];
        $sWhere = $this->_getVitalsWhere($aFilter, $sDevice, $aBindings) . " AND `v`.`" . $sMetric . "` IS NOT NULL";

        return $this->getPairs("SELECT `v`.`" . $sGroup . "` AS `value`, COUNT(*) AS `n` FROM `" . $this->_oConfig->CNF['TABLE_VITALS'] . "` AS `v` WHERE " . $sWhere . " GROUP BY `v`.`" . $sGroup . "` ORDER BY `n` DESC, `value` LIMIT " . max(0, (int)$iStart) . ", " . max(1, min(1000, (int)$iLimit)), 'value', 'n', $aBindings);
    }

    public function getVitalsPagesCount($aFilter, $sMetric, $sDevice, $sGroup)
    {
        if(!in_array($sMetric, BxAnalyticsVitals::METRICS, true) || !in_array($sGroup, ['route', 'path'], true))
            return 0;

        $aBindings = [];
        $sWhere = $this->_getVitalsWhere($aFilter, $sDevice, $aBindings) . " AND `v`.`" . $sMetric . "` IS NOT NULL";

        return (int)$this->getOne("SELECT COUNT(DISTINCT `v`.`" . $sGroup . "`) FROM `" . $this->_oConfig->CNF['TABLE_VITALS'] . "` AS `v` WHERE " . $sWhere, $aBindings);
    }

    /**
     * WHERE for error hits (alias `h`, joined to their group `g` when statuses are given) in
     * the period. Filters use the hit's own client columns; other dimensions go through its
     * visit, so errors outside a visit drop out of those.
     */
    protected function _getErrorHitsWhere($aFilter, $aStatuses, &$aBindings, $iFirstSeenFrom = 0)
    {
        $sWhere = $this->_getHealthWhere('h', $this->_aErrorHitDimensions, $aFilter, $aBindings);

        if(!empty($aStatuses))
            $sWhere .= " AND `g`.`status` IN (" . $this->_getInSql($aStatuses, 'st', $aBindings) . ")";

        if($iFirstSeenFrom) {
            $sWhere .= " AND `g`.`first_seen` >= :first_seen";
            $aBindings['first_seen'] = (int)$iFirstSeenFrom;
        }

        return $sWhere;
    }

    /**
     * WHERE for vitals (alias `v`) in the period, on a kind of device.
     */
    protected function _getVitalsWhere($aFilter, $sDevice, &$aBindings)
    {
        $sWhere = $this->_getHealthWhere('v', ['device', 'path'], $aFilter, $aBindings);

        if($sDevice == 'mobile')
            $sWhere .= " AND `v`.`device` IN ('mobile', 'tablet')";
        elseif($sDevice == 'desktop')
            $sWhere .= " AND `v`.`device` = 'desktop'";

        return $sWhere;
    }

    /**
     * Period, platform and dimension filters for a health table with `ts`, `platform` and
     * `session_id` columns. Dimensions in `$aOwn` are columns of the table.
     */
    protected function _getHealthWhere($sAlias, $aOwn, $aFilter, &$aBindings)
    {
        $aSql = ['`' . $sAlias . '`.`ts` >= :from', '`' . $sAlias . '`.`ts` < :to'];
        $aBindings['from'] = (int)$aFilter['from'];
        $aBindings['to'] = (int)$aFilter['to'];

        if($aFilter['platform'] !== '') {
            $aSql[] = '`' . $sAlias . '`.`platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        $aThrough = [];
        foreach($aFilter['dims'] as $sName => $sValue) {
            if(in_array($sName, $aOwn, true)) {
                $aSql[] = '`' . $sAlias . '`.`' . $sName . '` = :d_' . $sName;
                // health hits keep only the page parameters of a path, a pageview's path its whole query
                $aBindings['d_' . $sName] = $sName == 'path' ? get_mb_substr(BxAnalyticsErrors::getCleanPath($sValue), 0, 255) : $sValue;
            }
            elseif(isset($this->_aSessionDimensions[$sName])) {
                $aThrough[] = '`sf`.`' . $this->_aSessionDimensions[$sName] . '` = :d_' . $sName;
                $aBindings['d_' . $sName] = $sValue;
            }
            elseif(isset($this->_aEventDimensions[$sName])) {
                $aSql[] = $this->_getPageVisitsInSql('`' . $sAlias . '`.`session_id`', ['`ef`.`' . $this->_aEventDimensions[$sName] . '` = :d_' . $sName], $aFilter, $aBindings, '_' . $sName);
                $aBindings['d_' . $sName] = $sValue;
            }
        }

        // errors and vitals are few rows next to pageviews: each looks its visit up
        if(!empty($aThrough))
            $aSql[] = $this->_getVisitsInSql('`' . $sAlias . '`.`session_id`', $aThrough, $aFilter, $aBindings, true);

        return implode(' AND ', $aSql);
    }

    /**
     * Placeholders for an IN list, with their bindings.
     */
    protected function _getInSql($aValues, $sPrefix, &$aBindings)
    {
        $aIn = [];
        foreach(array_values($aValues) as $i => $mixedValue) {
            $aIn[] = ':' . $sPrefix . $i;
            $aBindings[$sPrefix . $i] = $mixedValue;
        }

        return implode(', ', $aIn);
    }

    /**
     * Insert rows with the same keys in one query.
     */
    protected function _insertRows($sTable, $aRows)
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

        return (int)$this->query("INSERT INTO `" . $sTable . "` (`" . implode('`, `', $aFields) . "`) VALUES " . implode(', ', $aValues), $aBindings);
    }

    /*
     * Revenue: the ledger and subscriptions
     */

    /**
     * Ledger columns a revenue split may group by, as name => column.
     */
    protected $_aRevenueDimensions = [
        'module' => 'module',
        'provider' => 'provider',
        'platform' => 'platform',
        'first_channel' => 'first_channel',
        'first_referrer_host' => 'first_referrer_host',
        'first_utm_campaign' => 'first_utm_campaign',
        'last_channel' => 'last_channel',
        'last_referrer_host' => 'last_referrer_host',
        'last_utm_campaign' => 'last_utm_campaign',
        'seller_id' => 'seller_id',
    ];

    /**
     * Add a money movement unless the same movement (payment module, transaction, kind) is
     * there already; returns 1 when it was added.
     */
    public function insertRevenue($aRow)
    {
        $aBindings = [];
        foreach($aRow as $sField => $mixedValue)
            $aBindings[$sField] = $mixedValue;

        $sFields = '`' . implode('`, `', array_keys($aBindings)) . '`';
        $sValues = ':' . implode(', :', array_keys($aBindings));

        return (int)$this->query("INSERT IGNORE INTO `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` (" . $sFields . ") VALUES (" . $sValues . ")", $aBindings);
    }

    /**
     * Ledger rows of an order, of some kinds, in transaction order.
     */
    public function getRevenueRows($sPayment, $iPendingId, $aKinds = [])
    {
        $aBindings = ['payment' => $sPayment, 'pending' => (int)$iPendingId];

        return $this->getAll("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment AND `pending_id` = :pending" . $this->_getKindsSql($aKinds, $aBindings) . " ORDER BY `transaction_id`, `id`", $aBindings);
    }

    /**
     * The ledger row of a transaction, of some kinds.
     */
    public function getRevenueRow($sPayment, $iTransactionId, $aKinds = [])
    {
        $aBindings = ['payment' => $sPayment, 'transaction' => (int)$iTransactionId];

        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment AND `transaction_id` = :transaction" . $this->_getKindsSql($aKinds, $aBindings) . " ORDER BY `id` LIMIT 1", $aBindings);
    }

    /**
     * Time of the first paid charge of each order the ledger has (a trial's registration is
     * not one): [pending id => time].
     */
    public function getRevenueFirstCharges($sPayment, $aPendingIds)
    {
        $aPendingIds = array_values(array_unique(array_map('intval', $aPendingIds)));
        if(empty($aPendingIds))
            return [];

        return $this->getPairs("SELECT `pending_id`, MIN(`ts`) AS `first` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment AND `pending_id` IN (" . $this->implode_escape($aPendingIds) . ") AND `kind` IN ('sale', 'renewal') GROUP BY `pending_id`", 'pending_id', 'first', ['payment' => $sPayment]);
    }

    /**
     * Transactions of a list the ledger has as a charge (a sale, a renewal or a trial's
     * registration): [transaction id, ...].
     */
    public function getRevenueCharged($sPayment, $aTransactionIds)
    {
        $aTransactionIds = array_values(array_unique(array_map('intval', $aTransactionIds)));
        if(empty($aTransactionIds))
            return [];

        return array_map('intval', $this->getColumn("SELECT DISTINCT `transaction_id` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment AND `transaction_id` IN (" . $this->implode_escape($aTransactionIds) . ") AND `kind` IN ('sale', 'renewal', 'trial')", ['payment' => $sPayment]));
    }

    /**
     * A charge got its kind once its subscription's trial was known (`kind` is part of the
     * unique key: a transaction has one charge row, so the change never meets another row).
     */
    public function updateRevenueKind($iId, $sKind)
    {
        return (int)$this->query("UPDATE IGNORE `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` SET `kind` = :kind WHERE `id` = :id", ['id' => (int)$iId, 'kind' => $sKind]);
    }

    /**
     * Paid charges of an order in the ledger from a time on (a trial's registration is not
     * one): first and last time, and how many (the rows of one charge share their time).
     */
    public function getRevenuePaid($sPayment, $iPendingId, $iSince = 0)
    {
        return $this->getRow("SELECT IFNULL(MIN(`ts`), 0) AS `first`, IFNULL(MAX(`ts`), 0) AS `last`, COUNT(DISTINCT `ts`) AS `count` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment AND `pending_id` = :pending AND `kind` IN ('sale', 'renewal') AND `ts` >= :since", [
            'payment' => $sPayment,
            'pending' => (int)$iPendingId,
            'since' => (int)$iSince,
        ]);
    }

    /**
     * Give an order's rows that have no visit yet the buyer's platform, visit and sources.
     */
    public function updateRevenueContext($sPayment, $iPendingId, $aSet)
    {
        $aBindings = ['payment' => $sPayment, 'pending' => (int)$iPendingId];
        $aSql = [];
        foreach($aSet as $sField => $mixedValue) {
            $aSql[] = '`' . $sField . '` = :f_' . $sField;
            $aBindings['f_' . $sField] = $mixedValue;
        }

        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` SET " . implode(', ', $aSql) . " WHERE `payment` = :payment AND `pending_id` = :pending AND `session_id` = 0", $aBindings);
    }

    /**
     * The traffic source of a member's first visit, and of the latest one that started by a time.
     *
     * @return array ['first' => row or [], 'last' => row or []] with channel, referrer_host, utm_campaign
     */
    public function getSessionSources($iProfileId, $iTime)
    {
        $sSql = "SELECT `channel`, `referrer_host`, `utm_campaign` FROM `" . $this->_oConfig->CNF['TABLE_SESSIONS'] . "` WHERE `profile_id` = :profile AND `started` <= :time ORDER BY `started` %s LIMIT 1";
        $aBindings = ['profile' => (int)$iProfileId, 'time' => (int)$iTime];

        return [
            'first' => $this->getRow(sprintf($sSql, 'ASC'), $aBindings),
            'last' => $this->getRow(sprintf($sSql, 'DESC'), $aBindings),
        ];
    }

    /**
     * A deleted profile: its money stays in the ledger, its visit and traffic sources don't.
     */
    public function forgetRevenueProfile($iProfileId)
    {
        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` SET `session_id` = 0, `first_channel` = '', `first_referrer_host` = '', `first_utm_campaign` = '', `last_channel` = '', `last_referrer_host` = '', `last_utm_campaign` = '' WHERE `client_id` = :profile", ['profile' => (int)$iProfileId]);
    }

    /**
     * Rows the import of past payments wrote (they have no platform).
     */
    public function getRevenueImportedCount($sPayment)
    {
        return (int)$this->getOne("SELECT COUNT(*) FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment AND `platform` = ''", ['payment' => $sPayment]);
    }

    public function hasRevenue($sPayment)
    {
        return (bool)$this->getOne("SELECT 1 FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `payment` = :payment LIMIT 1", ['payment' => $sPayment]);
    }

    public function getSubscriptionRow($sPayment, $iPendingId)
    {
        return $this->getRow("SELECT * FROM `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` WHERE `payment` = :payment AND `pending_id` = :pending", [
            'payment' => $sPayment,
            'pending' => (int)$iPendingId,
        ]);
    }

    /**
     * Start and trial (days) of the subscriptions with a trial among some orders:
     * [pending id => ['started' => time, 'trial' => days]].
     */
    public function getSubscriptionTrials($sPayment, $aPendingIds)
    {
        $aPendingIds = array_values(array_unique(array_map('intval', $aPendingIds)));
        if(empty($aPendingIds))
            return [];

        return $this->getAllWithKey("SELECT `pending_id`, `started`, `trial` FROM `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` WHERE `payment` = :payment AND `pending_id` IN (" . $this->implode_escape($aPendingIds) . ") AND `trial` > 0", 'pending_id', ['payment' => $sPayment]);
    }

    /**
     * A new subscription, or new terms for one the ledger has (it keeps its start, payments
     * and cancellation).
     */
    public function saveSubscriptionRow($aRow)
    {
        $aBindings = [];
        foreach($aRow as $sField => $mixedValue)
            $aBindings[$sField] = $mixedValue;

        $aUpdate = [];
        foreach(['subscription_id', 'client_id', 'seller_id', 'module_id', 'module', 'item_id', 'provider', 'period', 'period_unit', 'trial', 'amount_default', 'mrr_default'] as $sField)
            if(array_key_exists($sField, $aBindings))
                $aUpdate[] = '`' . $sField . '` = VALUES(`' . $sField . '`)';
        if(array_key_exists('status', $aBindings))
            $aUpdate[] = "`status` = IF(`canceled` > 0, `status`, VALUES(`status`))";

        $sFields = '`' . implode('`, `', array_keys($aBindings)) . '`';
        $sValues = ':' . implode(', :', array_keys($aBindings));

        return $this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` (" . $sFields . ") VALUES (" . $sValues . ") ON DUPLICATE KEY UPDATE " . implode(', ', $aUpdate), $aBindings) !== false;
    }

    /**
     * A subscription read from the payment module's history: fills what the ledger doesn't
     * know yet and leaves what it recorded live.
     */
    public function importSubscriptionRow($aRow)
    {
        $aBindings = [];
        foreach($aRow as $sField => $mixedValue)
            $aBindings[$sField] = $mixedValue;

        $sFields = '`' . implode('`, `', array_keys($aBindings)) . '`';
        $sValues = ':' . implode(', :', array_keys($aBindings));

        return $this->query("INSERT INTO `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` (" . $sFields . ") VALUES (" . $sValues . ") ON DUPLICATE KEY UPDATE
            `first_paid` = IF(`first_paid` = 0, VALUES(`first_paid`), LEAST(`first_paid`, IF(VALUES(`first_paid`) > 0, VALUES(`first_paid`), `first_paid`))),
            `last_paid` = GREATEST(`last_paid`, VALUES(`last_paid`)),
            `paid_count` = GREATEST(`paid_count`, VALUES(`paid_count`)),
            `reason` = IF(`canceled` = 0, VALUES(`reason`), `reason`),
            `status` = IF(`canceled` = 0 AND VALUES(`canceled`) > 0, VALUES(`status`), `status`),
            `canceled` = IF(`canceled` = 0, VALUES(`canceled`), `canceled`)", $aBindings) !== false;
    }

    public function updateSubscriptionRow($sPayment, $iPendingId, $aSet)
    {
        $aBindings = ['payment' => $sPayment, 'pending' => (int)$iPendingId];
        $aSql = [];
        foreach($aSet as $sField => $mixedValue) {
            $aSql[] = '`' . $sField . '` = :f_' . $sField;
            $aBindings['f_' . $sField] = $mixedValue;
        }

        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` SET " . implode(', ', $aSql) . " WHERE `payment` = :payment AND `pending_id` = :pending", $aBindings);
    }

    /**
     * Charges of a subscription were recorded (`$iCount` charges, from `$iFirst` to `$iLast`):
     * it is active (unless cancelled) since its first.
     */
    public function addSubscriptionPayments($sPayment, $iPendingId, $iCount, $iFirst, $iLast)
    {
        return (int)$this->query("UPDATE `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` SET `first_paid` = IF(`first_paid` = 0, :first, LEAST(`first_paid`, :first)), `last_paid` = GREATEST(`last_paid`, :last), `paid_count` = `paid_count` + :count, `status` = IF(`canceled` > 0, `status`, 'active') WHERE `payment` = :payment AND `pending_id` = :pending", [
            'payment' => $sPayment,
            'pending' => (int)$iPendingId,
            'count' => (int)$iCount,
            'first' => (int)$iFirst,
            'last' => (int)$iLast,
        ]);
    }

    /**
     * Gross (sales and renewals), refunds (refunds and reversals, positive), net, orders,
     * paying customers, renewals and movements without an exchange rate in a period.
     *
     * @param array $aFilter report filter with `payment`, the payment module to read
     * @param int $iCash 1 for money, 0 for orders paid with credits, null for both
     */
    public function getRevenueTotals($aFilter, $iCash = 1)
    {
        $aBindings = [];
        $sWhere = $this->_getRevenueWhere($aFilter, $iCash, $aBindings);

        return $this->getRow("SELECT " . $this->_getRevenueSums() . ", COUNT(*) AS `movements` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` AS `r` WHERE " . $sWhere, $aBindings);
    }

    /**
     * The same sums per time bucket: rows keyed by bucket start.
     */
    public function getRevenueSeries($aFilter, $iCash = 1)
    {
        $aBindings = [];
        $sWhere = $this->_getRevenueWhere($aFilter, $iCash, $aBindings);
        $sBucket = $this->_getBucketSql('`r`.`ts`', $aFilter['bucket'], $aFilter['offset'], $aFilter['starts'], $aBindings);

        return $this->getAllWithKey("SELECT " . $sBucket . " AS `bucket`, " . $this->_getRevenueSums() . " FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` AS `r` WHERE " . $sWhere . " GROUP BY `bucket` ORDER BY `bucket`", 'bucket', $aBindings);
    }

    /**
     * Net and gross revenue, customers and orders per value of a ledger column, the largest first.
     */
    public function getRevenueSplit($aFilter, $sDimension, $iLimit, $iCash = 1)
    {
        if(!isset($this->_aRevenueDimensions[$sDimension]))
            return [];

        $aBindings = [];
        $sWhere = $this->_getRevenueWhere($aFilter, $iCash, $aBindings);
        $sColumn = '`r`.`' . $this->_aRevenueDimensions[$sDimension] . '`';

        return $this->getAll("SELECT " . $sColumn . " AS `value`, " . $this->_getRevenueSums() . " FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` AS `r` WHERE " . $sWhere . " GROUP BY " . $sColumn . " ORDER BY `net` DESC LIMIT " . max(1, min(1000, (int)$iLimit)), $aBindings);
    }

    /**
     * Items that brought the most net revenue, with units sold and orders.
     */
    public function getRevenueTopItems($aFilter, $iLimit)
    {
        $aBindings = [];
        $sWhere = $this->_getRevenueWhere($aFilter, 1, $aBindings);

        return $this->getAll("SELECT `r`.`module_id`, MAX(`r`.`module`) AS `module`, `r`.`item_id`, IFNULL(SUM(`r`.`amount_default`), 0) AS `net`, IFNULL(SUM(IF(`r`.`kind` = 'sale', `r`.`item_count`, 0)), 0) AS `units`, COUNT(DISTINCT IF(`r`.`kind` = 'sale', `r`.`pending_id`, NULL)) AS `orders`, SUM(`r`.`kind` = 'renewal') AS `renewals` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` AS `r` WHERE " . $sWhere . " GROUP BY `r`.`module_id`, `r`.`item_id` ORDER BY `net` DESC LIMIT " . max(1, min(100, (int)$iLimit)), $aBindings);
    }

    /**
     * Revenue the site sold itself (`$iSiteAdmin`, 0 when unknown), revenue of other sellers,
     * and commission invoices paid to the site (rows of the payment module's own items).
     */
    public function getRevenueSellers($aFilter, $iSiteAdmin)
    {
        $aBindings = ['admin' => (int)$iSiteAdmin, 'payment_module' => isset($aFilter['payment']) ? $aFilter['payment'] : ''];
        $sWhere = $this->_getRevenueWhere($aFilter, 1, $aBindings);

        return $this->getRow("SELECT IFNULL(SUM(IF(`r`.`module` <> :payment_module AND `r`.`seller_id` = :admin, `r`.`amount_default`, 0)), 0) AS `site`, IFNULL(SUM(IF(`r`.`module` <> :payment_module AND `r`.`seller_id` <> :admin, `r`.`amount_default`, 0)), 0) AS `vendors`, IFNULL(SUM(IF(`r`.`module` = :payment_module, `r`.`amount_default`, 0)), 0) AS `commissions`, COUNT(DISTINCT IF(`r`.`module` <> :payment_module AND `r`.`seller_id` <> :admin, `r`.`seller_id`, NULL)) AS `vendor_count` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` AS `r` WHERE " . $sWhere, $aBindings);
    }

    /**
     * Net revenue of members over all the ledger, trials' registrations aside (they took no
     * money): [profile id => amount].
     */
    public function getLifetimeValues($aProfileIds, $sPayment)
    {
        $aProfileIds = array_values(array_unique(array_filter(array_map('intval', $aProfileIds))));
        if(empty($aProfileIds))
            return [];

        return $this->getPairs("SELECT `client_id`, IFNULL(SUM(`amount_default`), 0) AS `ltv` FROM `" . $this->_oConfig->CNF['TABLE_REVENUE'] . "` WHERE `cash` = 1 AND `payment` = :payment AND `kind` <> 'trial' AND `client_id` IN (" . $this->implode_escape($aProfileIds) . ") GROUP BY `client_id`", 'client_id', 'ltv', ['payment' => $sPayment]);
    }

    /**
     * Subscriptions that were paying or in trial at some time in a period: paid or started
     * with a trial before its end, and not cancelled or lapsed before its start.
     *
     * @param array $aEnd when an unpaid subscription stops paying: unit_seconds [period unit =>
     *      seconds], unpaid (the status), grace (seconds); none to read lapsed ones too
     */
    public function getSubscriptionRows($aFilter, $aEnd = [])
    {
        $aBindings = ['from' => (int)$aFilter['from'], 'to' => (int)$aFilter['to'], 'payment' => isset($aFilter['payment']) ? $aFilter['payment'] : ''];
        $sPlatform = '';
        if($aFilter['platform'] !== '') {
            $sPlatform = ' AND `platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        // an unpaid subscription stopped paying when its last paid period and the grace time
        // ended, without a cancellation: those that stopped before the period stay out, or
        // every lapsed one would be read forever (see BxAnalyticsReports::_getSubscriptionEnd)
        $sLapsed = '';
        if(!empty($aEnd['unit_seconds'])) {
            $aUnits = [];
            foreach($aEnd['unit_seconds'] as $sUnit => $iSeconds) {
                $sBinding = 'unit' . count($aUnits);
                $aUnits[] = 'WHEN :' . $sBinding . ' THEN ' . (int)$iSeconds;
                $aBindings[$sBinding] = $sUnit;
            }
            $sLapsed = " AND NOT (`canceled` = 0 AND `status` = :unpaid AND `last_paid` > 0 AND `last_paid` + :grace + GREATEST(1, `period`) * (CASE `period_unit` " . implode(' ', $aUnits) . " ELSE 0 END) < :from)";
            $aBindings['unpaid'] = $aEnd['unpaid'];
            $aBindings['grace'] = (int)$aEnd['grace'];
        }

        return $this->getAll("SELECT `pending_id`, `module`, `item_id`, `period`, `period_unit`, `trial`, `mrr_default`, `started`, `first_paid`, `last_paid`, `canceled`, `status` FROM `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` WHERE `payment` = :payment" . $sPlatform . " AND (`canceled` = 0 OR `canceled` >= :from)" . $sLapsed . " AND ((`first_paid` > 0 AND `first_paid` < :to) OR ((`trial` > 0 OR `status` = 'trial') AND `started` < :to))", $aBindings);
    }

    /**
     * Why subscriptions were cancelled in a period: [reason => count], the most frequent first.
     * `cancel` is the payment module's default for no reason, counted with the empty one.
     */
    public function getSubscriptionReasons($aFilter, $iLimit)
    {
        $aBindings = ['from' => (int)$aFilter['from'], 'to' => (int)$aFilter['to'], 'payment' => isset($aFilter['payment']) ? $aFilter['payment'] : ''];
        $sPlatform = '';
        if($aFilter['platform'] !== '') {
            $sPlatform = ' AND `platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        return $this->getPairs("SELECT IF(`reason` = 'cancel', '', `reason`) AS `cause`, COUNT(*) AS `count` FROM `" . $this->_oConfig->CNF['TABLE_SUBSCRIPTIONS'] . "` WHERE `payment` = :payment" . $sPlatform . " AND `canceled` >= :from AND `canceled` < :to GROUP BY `cause` ORDER BY `count` DESC LIMIT " . max(1, min(100, (int)$iLimit)), 'cause', 'count', $aBindings);
    }

    protected function _getRevenueSums()
    {
        return "IFNULL(SUM(IF(`r`.`kind` IN ('sale', 'renewal'), `r`.`amount_default`, 0)), 0) AS `gross`, IFNULL(-SUM(IF(`r`.`kind` IN ('refund', 'reversal'), `r`.`amount_default`, 0)), 0) AS `refunds`, IFNULL(SUM(`r`.`amount_default`), 0) AS `net`, COUNT(DISTINCT IF(`r`.`kind` = 'sale', `r`.`pending_id`, NULL)) AS `orders`, COUNT(DISTINCT IF(`r`.`kind` IN ('sale', 'renewal'), `r`.`client_id`, NULL)) AS `customers`, COUNT(DISTINCT IF(`r`.`kind` = 'renewal', CONCAT(`r`.`pending_id`, ':', `r`.`ts`), NULL)) AS `renewals`, SUM(`r`.`kind` IN ('refund', 'reversal')) AS `refund_count`, IFNULL(SUM(`r`.`amount_default` IS NULL), 0) AS `unconverted`";
    }

    /**
     * WHERE for ledger rows (alias `r`) of one payment module in the period, money or credits
     * (null: both), on the filter's platform. A trial's registration took no money: no revenue
     * sum, count or chart reads it.
     */
    protected function _getRevenueWhere($aFilter, $iCash, &$aBindings)
    {
        $aSql = ['`r`.`ts` >= :from', '`r`.`ts` < :to', '`r`.`payment` = :payment', "`r`.`kind` <> 'trial'"];
        if($iCash !== null) {
            array_unshift($aSql, '`r`.`cash` = :cash');
            $aBindings['cash'] = (int)$iCash ? 1 : 0;
        }
        $aBindings['from'] = (int)$aFilter['from'];
        $aBindings['to'] = (int)$aFilter['to'];
        $aBindings['payment'] = isset($aFilter['payment']) ? (string)$aFilter['payment'] : '';

        if($aFilter['platform'] !== '') {
            $aSql[] = '`r`.`platform` = :platform';
            $aBindings['platform'] = $aFilter['platform'];
        }

        return implode(' AND ', $aSql);
    }

    protected function _getKindsSql($aKinds, &$aBindings)
    {
        if(empty($aKinds))
            return '';

        $aIn = [];
        foreach(array_values($aKinds) as $i => $sKind) {
            $aIn[] = ':k' . $i;
            $aBindings['k' . $i] = $sKind;
        }

        return ' AND `kind` IN (' . implode(', ', $aIn) . ')';
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
