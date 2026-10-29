<?php

/**
 * What keeps reports fast on large data: the report cache, retention cohorts counted in the
 * database, and filters across visits and pageviews. Test visits are dated in August and
 * September 2001, far from real traffic, and deleted afterwards.
 */
class AnalyticsScaleTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    protected $_oModule;
    protected $_aOptions = [];

    protected $_aDay = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09', 'tz' => 'UTC'];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getFilter([]);
        $this->_oModule->getReports();

        $this->_cleanup();
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            foreach ($this->_aOptions as $sName => $sValue)
                setParam($sName, $sValue);
            $this->_oModule->cleanReportCache();
        }

        parent::tearDown();
    }

    public function testRetentionCohorts()
    {
        $iFrom = $this->_monday() - 4 * 604800;
        $iDay = 86400;

        // visitor => [platform, profile, [visit times]]
        $aVisitors = [
            'a' => ['core-web', 0, [$iFrom + $iDay, $iFrom + 2 * $iDay, $iFrom + 2 * 604800 + $iDay]],
            'b' => ['core-web', 0, [$iFrom + 3 * $iDay]],
            'c' => ['core-web', 0, [$iFrom + 604800 + $iDay, $iFrom + 3 * 604800 + $iDay]],
            // first came before the period: no cohort
            'd' => ['core-web', 0, [$iFrom - $iDay, $iFrom + 604800 + 2 * $iDay]],
            'e' => ['core-web', 7, [$iFrom + 2 * 604800 + 2 * $iDay]],
            'f' => ['rn-ios', 0, [$iFrom + 4 * $iDay]],
        ];
        foreach ($aVisitors as $sVisitor => list($sPlatform, $iProfile, $aTimes))
            foreach ($aTimes as $iTime)
                $this->_session($sVisitor, $iTime, ['platform' => $sPlatform, 'profile_id' => $iProfile]);

        $oDb = $this->_oModule->_oDb;
        $fRows = function ($aRows) {
            $aResult = [];
            foreach ($aRows as $aRow)
                $aResult[] = [(int)$aRow['cohort'], (int)$aRow['weeks'], (int)$aRow['visitors']];
            sort($aResult);
            return $aResult;
        };

        // cohort (week of the first visit), the weeks visited as bits, visitors
        $iTo = $iFrom + 4 * 604800;
        $this->assertSame([[0, 1, 2], [0, 5, 1], [1, 10, 1], [2, 4, 1]], $fRows($oDb->getRetentionCohorts($iFrom, $iTo, '', false)));
        $this->assertSame([[0, 1, 1]], $fRows($oDb->getRetentionCohorts($iFrom, $iTo, 'rn-ios', false)));
        $this->assertSame([[2, 4, 1]], $fRows($oDb->getRetentionCohorts($iFrom, $iTo, '', true)), 'members only');
        $this->assertSame([[0, 1, 3]], $fRows($oDb->getRetentionCohorts($iFrom, $iFrom + 604800, '', false)), 'visits after the end are left out');

        // the report: 12 weekly cohorts up to the current week, the last 4 of them seeded
        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => '7d', 'tz' => 'UTC'], $iFrom + 3 * 604800 + 2 * $iDay);
        $a = $this->_oModule->getReports()->getRetention($oFilter, ['tab' => 'visitors']);
        $this->assertSame(12, $a['weeks']);
        $this->assertCount(12, $a['rows']);
        $aRows = array_slice($a['rows'], 8);
        $this->assertSame($iFrom, $aRows[0]['start']);
        $this->assertSame([3, 1, 1, 0], array_column($aRows, 'size'));
        $this->assertEquals([100, 0, 33.3, 0], $aRows[0]['weeks'], 'a of a, b and f came back in week 2');
        $this->assertEquals([100, 0, 100], $aRows[1]['weeks']);
        $this->assertEquals([100, 0], $aRows[2]['weeks']);
        $this->assertSame([null], $aRows[3]['weeks']);

        $a = $this->_oModule->getReports()->getRetention($oFilter, ['tab' => 'members']);
        $this->assertSame([0, 0, 1, 0], array_column(array_slice($a['rows'], 8), 'size'));
    }

    public function testReportCache()
    {
        $this->_setOption('sys_db_cache_enable', 'on');
        $this->_oModule->cleanReportCache();
        $iDay = 999993600; // 2001-09-09 00:00 UTC

        $this->_session('a', $iDay + 3600);
        $this->_session('b', $iDay + 7200);

        $a = $this->_oModule->getReportData('overview', $this->_aDay);
        $this->assertSame(2, $a['kpis']['sessions']['value']);
        $this->assertSame(['range' => 'custom', 'tz' => 'UTC', 'from' => '2001-09-09', 'to' => '2001-09-09'], $a['filter']);

        // a new visit shows after the cached copy expires or is dropped
        $this->_session('c', $iDay + 10800);
        $this->assertSame(2, $this->_oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value'], 'from the cache');
        $this->assertSame(3, $this->_oModule->getReportData('overview', $this->_aDay + ['platform' => 'core-web'])['kpis']['sessions']['value'], 'other filters, another copy');
        $this->_oModule->cleanReportCache();
        $this->assertSame(3, $this->_oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value'], 'dropped');

        // in files, reports are plain text: as PHP scripts read with include(), opcache would
        // keep every one of them
        if ($this->_oModule->_oDb->getDbCacheObject() instanceof BxDolCacheFile) {
            $sPattern = BX_DIRECTORY_PATH_CACHE . 'db_' . $this->_oModule->_oConfig->CNF['REPORT_CACHE_PREFIX'] . '*';
            $aFiles = glob($sPattern);
            $this->assertNotEmpty($aFiles);
            foreach ($aFiles as $sFile) {
                $sData = file_get_contents($sFile);
                $this->assertStringStartsWith(BxAnalyticsModule::REPORT_CACHE_GUARD, $sData);
                $this->assertStringNotContainsString('$mixedData', $sData);
            }

            // past their time to live they are pruned, whether read again or not
            $this->assertSame(0, $this->_oModule->pruneReportCache(time()));
            foreach ($aFiles as $sFile)
                touch($sFile, time() - 3600);
            $this->assertSame(count($aFiles), $this->_oModule->pruneReportCache(time()));
            $this->assertSame([], array_values(array_intersect($aFiles, glob($sPattern))));
        }

        // the cache name holds what the report reads: blocks send the whole page URL, with
        // other blocks' tabs and pages, the chart's metric and opened rows
        $oName = new ReflectionMethod($this->_oModule, '_getReportCacheName');
        $fName = function ($sReport, $aParams) use ($oName) {
            return $oName->invoke($this->_oModule, $sReport, $this->_oModule->getFilter($this->_aDay + $aParams), $this->_aDay + $aParams);
        };
        $aNoise = ['metric' => 'pageviews', 'tab_pages' => 'entry', 'page_sessions' => '2', 'session' => '7', 'i' => 'analytics', 'r' => 'analytics/report'];
        $this->assertSame($fName('overview', []), $fName('overview', $aNoise));
        $this->assertSame($fName('top', ['group' => 'sources']), $fName('top', ['group' => 'sources', 'page_sources' => '2'] + $aNoise));
        $this->assertNotSame($fName('top', ['group' => 'sources']), $fName('top', ['group' => 'sources', 'tab_sources' => 'channels']));
        $this->assertNotSame($fName('table', ['table' => 'sources']), $fName('table', ['table' => 'sources', 'page_sources' => '2']));
        $this->assertNotSame($fName('sessions', []), $fName('sessions', ['session' => '7']));
        $this->assertNotSame($fName('overview', []), $fName('overview', ['platform' => 'core-web']), 'filters count');

        // dropping the cache starts a new generation instead of deleting by prefix, which
        // empties a whole Memcache(d) server or scans every Redis key
        $sBefore = $fName('overview', []);
        $this->_oModule->cleanReportCache();
        $this->assertNotSame($sBefore, $fName('overview', []));

        $aModule = $this->_oModule->_aModule;
        $oShared = new class extends BxDolCache {
            public $aData = [];
            public $iFlushes = 0;
            public function getData($sKey, $iTTL = false) { return $this->aData[$sKey] ?? null; }
            public function setData($sKey, $mixedData, $iTTL = false) { $this->aData[$sKey] = $mixedData; return true; }
            public function delData($sKey) { unset($this->aData[$sKey]); return true; }
            public function removeAllByPrefix($s) { $this->iFlushes++; $this->aData = []; return true; }
        };
        $oModule = new class($aModule, $oShared) extends BxAnalyticsModule {
            protected $_oShared;
            public function __construct(&$aModule, $oShared) { parent::__construct($aModule); $this->_oShared = $oShared; }
            protected function _getReportCacheEngine() { return $this->_oShared; }
        };
        $oShared->aData['db_other_module_key'] = 'kept';
        $this->assertSame(3, $oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value']);
        $this->_session('e', $iDay + 12600);
        $this->assertSame(3, $oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value'], 'from the shared cache');
        $oModule->cleanReportCache();
        $this->assertSame(4, $oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value'], 'a new generation');
        $this->assertSame(0, $oShared->iFlushes);
        $this->assertSame('kept', $oShared->aData['db_other_module_key']);

        // live figures are never cached
        $oReports = $this->_oModule->getReports();
        foreach (['realtime' => [], 'filters' => [], 'map' => ['tab' => 'live']] as $sReport => $aParams)
            $this->assertTrue($oReports->isLive($sReport, $aParams), $sReport);
        foreach (['overview' => [], 'top' => [], 'map' => []] as $sReport => $aParams)
            $this->assertFalse($oReports->isLive($sReport, $aParams), $sReport);

        // nothing is cached with the database cache off
        $this->_setOption('sys_db_cache_enable', '');
        $this->_session('d', $iDay + 14400);
        $this->assertSame(5, $this->_oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value']);
    }

    public function testFiltersAcrossVisitsAndPageviews()
    {
        $iDay = 999993600;
        $oDb = BxDolDb::getInstance();

        // a visit that began the day before still counts its pageviews of the day
        $aVisits = [
            ['a', $iDay - 600, 'DE', ['/x' => $iDay - 300, '/y' => $iDay + 60]],
            ['b', $iDay + 3600, 'DE', ['/x' => $iDay + 3600, '/z' => $iDay + 3700]],
            ['c', $iDay + 7200, 'FR', ['/x' => $iDay + 7200]],
        ];
        foreach ($aVisits as list($sVisitor, $iStarted, $sCountry, $aViews)) {
            $iSession = $this->_session($sVisitor, $iStarted, ['country' => $sCountry, 'last_seen' => max($aViews), 'pageviews' => count($aViews)]);
            foreach ($aViews as $sPath => $iTime)
                $oDb->query("INSERT INTO `bx_analytics_events` SET `session_id` = :s, `visitor` = :v, `platform` = 'core-web', `ts` = :ts, `type` = 'pageview', `path` = :path, `title` = :title, `props` = ''", ['s' => $iSession, 'v' => $this->_visitor($sVisitor), 'ts' => $iTime, 'path' => $sPath, 'title' => 'Page ' . $sPath]);
        }

        $oData = $this->_oModule->_oDb;
        $fFilter = function ($aDims) { return (new BxAnalyticsFilter($this->_oModule, $this->_aDay + ['f' => $aDims], self::NOW + 86400))->get(); };
        $fPages = function ($aRows) {
            $aResult = array_column($aRows, 'pageviews', 'value');
            ksort($aResult);
            return array_map('intval', $aResult);
        };

        // pageviews of the day in visits from Germany, the one that began the day before too
        $this->assertSame(['/x' => 1, '/y' => 1, '/z' => 1], $fPages($oData->getTop($fFilter(['country' => 'DE']), 'path', 10)));
        $this->assertSame(['/x' => 1], $fPages($oData->getTop($fFilter(['country' => 'FR']), 'path', 10)));
        $this->assertSame(2, (int)$oData->getTotals($fFilter(['country' => 'DE']))['pageviews'], 'visits of the day: b with its 2 views; a began the day before');

        // goals and events through the visit: a short period looks each visit up, a longer one
        // finds the visits first; both count the same
        $oDb->query("INSERT INTO `bx_analytics_events` SET `session_id` = :s, `visitor` = :v, `platform` = 'core-web', `ts` = :ts, `type` = 'event', `name` = 'phpunit_scale', `props` = ''", ['s' => $oDb->getOne("SELECT `id` FROM `bx_analytics_sessions` WHERE `visitor` = :v", ['v' => $this->_visitor('b')]), 'v' => $this->_visitor('b'), 'ts' => $iDay + 3800]);
        $aGoal = ['type' => 'page', 'pattern' => '/x'];
        $fLong = function ($aDims) { return (new BxAnalyticsFilter($this->_oModule, ['range' => 'custom', 'from' => '2001-08-30', 'to' => '2001-09-09', 'tz' => 'UTC', 'f' => $aDims], self::NOW + 86400))->get(); };
        $this->assertSame(['sessions', 'visitors'], array_keys($oData->getGoalTotals($fFilter(['country' => 'DE']), $aGoal)), 'columns of the covering key only');
        $this->assertSame(1, (int)$oData->getGoalTotals($fFilter(['country' => 'DE']), $aGoal)['sessions'], 'b viewed /x in the day');
        $this->assertSame(2, (int)$oData->getGoalTotals($fLong(['country' => 'DE']), $aGoal)['sessions'], 'a too over 11 days');
        $this->assertSame(1, (int)$oData->getGoalTotals($fLong(['country' => 'FR']), $aGoal)['sessions']);
        foreach ([$fFilter(['country' => 'DE']), $fLong(['country' => 'DE'])] as $aFilter)
            $this->assertSame(['phpunit_scale' => 1], array_map('intval', array_column($oData->getEventList($aFilter, ['event'], 10), 'count', 'name')));
        $this->assertSame([], $oData->getEventList($fLong(['country' => 'FR']), ['event'], 10));

        // visits of the day that viewed a page, that page's views of the day
        $aTotals = $oData->getTotals($fFilter(['path' => '/x']));
        $this->assertSame([2, 2], [(int)$aTotals['sessions'], (int)$aTotals['pageviews']]);
        $this->assertSame(1, (int)$oData->getTotals($fFilter(['path' => '/z']))['sessions']);
        $this->assertSame(0, (int)$oData->getTotals($fFilter(['path' => '/y']))['sessions'], 'only in the visit that began the day before');

        // the chart of a page counts that page's views, as the key figure does, in the hour
        // they happened: b views /x again at 05:00, when no visit started
        $oDb->query("INSERT INTO `bx_analytics_events` SET `session_id` = :s, `visitor` = :v, `platform` = 'core-web', `ts` = :ts, `type` = 'pageview', `path` = '/x', `title` = 'Page /x', `props` = ''", ['s' => $oDb->getOne("SELECT `id` FROM `bx_analytics_sessions` WHERE `visitor` = :v", ['v' => $this->_visitor('b')]), 'v' => $this->_visitor('b'), 'ts' => $iDay + 5 * 3600]);
        foreach ([['path' => '/x'], ['title' => 'Page /x']] as $aDims) {
            $aFilter = $fFilter($aDims);
            $this->assertSame('hour', $aFilter['bucket']);
            $aSeries = $oData->getSeries($aFilter, $aFilter['bucket'], $aFilter['offset'], $aFilter['starts']);
            $this->assertSame(3, (int)$oData->getTotals($aFilter)['pageviews']);
            $this->assertSame([$iDay + 3600, $iDay + 7200, $iDay + 5 * 3600], array_map('intval', array_keys($aSeries)), 'in time order');
            $this->assertSame([1, 1, 1], array_map('intval', array_column($aSeries, 'pageviews')));
            $this->assertSame([1, 1, 0], array_map('intval', array_column($aSeries, 'sessions')));

            $aOverview = $this->_oModule->getReportData('overview', $this->_aDay + ['f' => $aDims]);
            $this->assertSame(3, $aOverview['kpis']['pageviews']['value']);
            $this->assertSame(3, (int)array_sum(array_column($aOverview['series'], 'pageviews')), 'the chart adds up to the key figure');
        }
    }

    protected function _monday()
    {
        return (int)(floor((self::NOW - 345600) / 604800) * 604800 + 345600);
    }

    protected function _visitor($sName)
    {
        return str_pad('phpunit-scale-' . $sName, 16, "\0");
    }

    protected function _session($sVisitor, $iStarted, $aSet = [])
    {
        return $this->_oModule->_oDb->insertSession(array_merge([
            'visitor' => $this->_visitor($sVisitor),
            'platform' => 'core-web',
            'started' => $iStarted,
            'last_seen' => $iStarted,
            'pageviews' => 1,
        ], $aSet));
    }

    protected function _setOption($sName, $sValue)
    {
        if (!array_key_exists($sName, $this->_aOptions))
            $this->_aOptions[$sName] = getParam($sName);

        setParam($sName, $sValue);
    }

    protected function _cleanup()
    {
        $oDb = BxDolDb::getInstance();
        $iTo = self::NOW + 30 * 86400;
        $oDb->query("DELETE FROM `bx_analytics_events` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_sessions` WHERE `started` < :to", ['to' => $iTo]);
    }
}
