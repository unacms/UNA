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

        // live figures are never cached
        $oReports = $this->_oModule->getReports();
        foreach (['realtime' => [], 'filters' => [], 'map' => ['tab' => 'live']] as $sReport => $aParams)
            $this->assertTrue($oReports->isLive($sReport, $aParams), $sReport);
        foreach (['overview' => [], 'top' => [], 'map' => []] as $sReport => $aParams)
            $this->assertFalse($oReports->isLive($sReport, $aParams), $sReport);

        // nothing is cached with the database cache off
        $this->_setOption('sys_db_cache_enable', '');
        $this->_session('d', $iDay + 14400);
        $this->assertSame(4, $this->_oModule->getReportData('overview', $this->_aDay)['kpis']['sessions']['value']);
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
                $oDb->query("INSERT INTO `bx_analytics_events` SET `session_id` = :s, `visitor` = :v, `platform` = 'core-web', `ts` = :ts, `type` = 'pageview', `path` = :path, `props` = ''", ['s' => $iSession, 'v' => $this->_visitor($sVisitor), 'ts' => $iTime, 'path' => $sPath]);
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

        // visits of the day that viewed a page, that page's views of the day
        $aTotals = $oData->getTotals($fFilter(['path' => '/x']));
        $this->assertSame([2, 2], [(int)$aTotals['sessions'], (int)$aTotals['pageviews']]);
        $this->assertSame(1, (int)$oData->getTotals($fFilter(['path' => '/z']))['sessions']);
        $this->assertSame(0, (int)$oData->getTotals($fFilter(['path' => '/y']))['sessions'], 'only in the visit that began the day before');
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
