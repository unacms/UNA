<?php

/**
 * Explore: the Query report (any dimension by any metric), its CSV download, who may use
 * them, and custom events from server code. Test hits are dated in September 2001, far from
 * real traffic, and deleted afterwards.
 */
class AnalyticsExploreTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    const EVENT = 'phpunit_explore_track';

    protected $_oModule;
    protected $_aOptions = [];
    protected $_aMatrix = [];

    protected $_aDay = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getCollector(); // loads the collector classes
        $this->_oModule->getFilter([]);
        bx_import('Csv', $this->_oModule->_aModule);

        $this->_cleanup();

        foreach (['bx_analytics_track_actions' => 'on', 'bx_analytics_tracking' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api,core', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => '', 'bx_analytics_geo_source' => 'headers'] as $sName => $sValue)
            $this->_setOption($sName, $sValue);
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            foreach ($this->_aOptions as $sName => $sValue)
                setParam($sName, $sValue);
            $this->_restoreMatrix();
        }
        $GLOBALS['glForceCurrentProfileId'] = 0;

        parent::tearDown();
    }

    public function testEveryDimensionAndMetricIsSorted()
    {
        $this->_seed();
        $oReports = $this->_oModule->getReports();
        $aTotals = $this->_oModule->_oDb->getTotals($this->_filter($this->_aDay)->get());
        $this->assertSame(7, (int)$aTotals['visitors']);

        $aDimensions = $this->_oModule->_oDb->getDimensions();
        $this->assertCount(24, $aDimensions);
        $this->assertSame('path', key($aDimensions), 'pages come first: the default');

        foreach ($aDimensions as $sDimension => $sKind) {
            $aMetrics = $this->_oModule->_oDb->getBreakdownMetrics($sDimension);
            $this->assertSame($sKind == 'event' ? ['visitors', 'pageviews', 'engaged'] : ['visitors', 'sessions', 'pageviews', 'pages_per_session', 'bounce_rate', 'duration'], $aMetrics);
            $this->assertNotSame('_bx_analytics_dim_' . $sDimension, _t('_bx_analytics_dim_' . $sDimension), 'a title for ' . $sDimension);

            foreach ($aMetrics as $sMetric)
                foreach (['desc', 'asc'] as $sDir) {
                    $sCase = $sDimension . ' by ' . $sMetric . ' ' . $sDir;
                    $a = $oReports->getQuery($this->_filter($this->_aDay), ['q_dim' => $sDimension, 'q_metric' => $sMetric, 'q_dir' => $sDir]);

                    $this->assertSame([$sDimension, $sKind, $sMetric, $sDir], [$a['dimension'], $a['kind'], $a['metric'], $a['dir']], $sCase);
                    $this->assertNotEmpty($a['rows'], $sCase);
                    $this->assertSame(count($a['rows']), $a['total'], $sCase);

                    $aValues = array_map(function ($aRow) use ($sMetric) { return $aRow['values'][$sMetric]; }, $a['rows']);
                    $aSorted = $aValues;
                    $sDir == 'asc' ? sort($aSorted) : rsort($aSorted);
                    $this->assertEquals($aSorted, $aValues, $sCase);

                    $this->assertSame([$sDir == 'asc' ? 'ascending' : 'descending'], array_values(array_filter(array_column($a['columns'], 'sort'))), $sCase . ': the sorted column is marked');

                    if ($sKind == 'session')
                        $this->assertGreaterThanOrEqual(7, array_sum(array_map(function ($aRow) { return $aRow['values']['visitors']; }, $a['rows'])), $sCase . ': every visitor is in some row');
                }
        }
    }

    public function testQueryRowsAndChart()
    {
        $this->_seed();
        $oReports = $this->_oModule->getReports();
        $oFilter = $this->_filter($this->_aDay);

        $a = $oReports->getQuery($oFilter, []);
        $this->assertSame(['query', 'path', 'visitors', 'desc'], [$a['name'], $a['dimension'], $a['metric'], $a['dir']]);
        $this->assertSame([], $a['tabs']);
        $this->assertSame(7, $a['total']);
        $this->assertSame(['/a', '/c'], array_slice(array_column($a['rows'], 'label'), 0, 2), '3 visitors on /a, 2 on /c');
        $this->assertSame(['dim' => 'path', 'value' => '/a'], $a['rows'][0]['filter']);
        $this->assertSame(3, $a['rows'][0]['values']['entries']);
        $this->assertEquals(10, $a['rows'][0]['values']['engaged'], 'average engaged seconds of the views that reported it');

        // the chart: the first five values, every bucket of the period
        $aBuckets = $oFilter->get()['buckets'];
        $this->assertSame('series', $a['chart']['kind']);
        $this->assertCount(5, $a['chart']['series']);
        $this->assertSame(array_slice(array_column($a['rows'], 'label'), 0, 5), array_column($a['chart']['series'], 'label'));
        foreach ($a['chart']['series'] as $aSeries)
            $this->assertSame($aBuckets, array_column($aSeries['points'], 't'));

        // counts over the buckets add up to the row
        $a = $oReports->getQuery($oFilter, ['q_dim' => 'country', 'q_metric' => 'pageviews']);
        $this->assertSame(['GB', 'US', 'FR', 'DE'], array_column(array_column($a['rows'], 'filter'), 'value'));
        foreach ($a['chart']['series'] as $i => $aSeries)
            $this->assertSame($a['rows'][$i]['values']['pageviews'], array_sum(array_column($aSeries['points'], 'v')));

        // a rate is a gap where there were no visits, not a zero
        $a = $oReports->getQuery($oFilter, ['q_dim' => 'platform', 'q_metric' => 'bounce_rate', 'q_dir' => 'asc']);
        $this->assertContains(null, array_column($a['chart']['series'][0]['points'], 'v'));
        $this->assertSame('rn-ios', $a['rows'][0]['filter']['value'], 'no bounces on iOS');
        $this->assertSame('platform', $a['rows'][0]['filter']['dim'], 'the script sets the platform parameter for it');

        // filters apply
        $a = $oReports->getQuery($this->_filter($this->_aDay + ['f' => ['country' => 'GB']]), ['q_dim' => 'path']);
        $this->assertEqualsCanonicalizing(['/a', '/b', '/d'], array_column($a['rows'], 'label'));
        $a = $oReports->getQuery($this->_filter($this->_aDay + ['platform' => 'rn-ios']), ['q_dim' => 'country']);
        $this->assertSame(['US'], array_column(array_column($a['rows'], 'filter'), 'value'));

        // the report through the module, as blocks and the API ask for it
        $this->assertIsArray($this->_oModule->getReportData('query', $this->_aDay + ['q_dim' => 'browser']));
    }

    public function testChartKeepsSpellingsOfOneValue()
    {
        // the tables compare text without case: one value of the table, in every bucket
        foreach ([['81.2.69.160', 'Phpunit Case', 0], ['81.2.69.161', 'phpunit case', 3 * 3600], ['81.2.69.162', 'PHPUNIT CASE', 6 * 3600]] as list($sIp, $sTitle, $iAfter))
            $this->_collect($this->_server($sIp), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/case', 'title' => $sTitle]]], self::NOW + $iAfter);

        $oFilter = $this->_filter($this->_aDay + ['f' => ['path' => '/case']]);
        $this->assertGreaterThan(1, count($oFilter->get()['buckets']));

        $a = $this->_oModule->getReports()->getQuery($oFilter, ['q_dim' => 'title', 'q_metric' => 'pageviews']);
        $this->assertCount(1, $a['rows']);
        $this->assertSame(3, $a['rows'][0]['values']['pageviews']);
        $this->assertSame($a['rows'][0]['filter']['value'], $a['chart']['series'][0]['value']);
        $this->assertSame(3, array_sum(array_column($a['chart']['series'][0]['points'], 'v')), 'every spelling counts in its bucket');
        $this->assertCount(3, array_filter(array_column($a['chart']['series'][0]['points'], 'v')));
    }

    public function testHostileParametersFallBack()
    {
        $this->_seed();
        $oReports = $this->_oModule->getReports();

        $aDefault = $oReports->getQuery($this->_filter($this->_aDay), []);
        foreach ([
            ['q_dim' => 'path`;DROP TABLE `bx_analytics_events`;--'],
            ['q_metric' => 'visitors DESC,(SELECT 1)'],
            ['q_dir' => 'asc;--'],
            ['q_dim' => ['path'], 'q_metric' => ['visitors'], 'q_dir' => ['asc']],
            ['q_dim' => 'e`.`visitor', 'q_metric' => 'COUNT(*)', 'q_dir' => 'DESC'],
        ] as $aHostile)
            $this->assertEquals($aDefault, $oReports->getQuery($this->_filter($this->_aDay), $aHostile), json_encode($aHostile));

        $this->assertSame('visitors', $oReports->getQueryParams(['q_dim' => 'country', 'q_metric' => 'engaged'])['metric'], 'a metric of another kind of dimension');
        $this->assertSame('visitors', $oReports->getQueryParams(['q_dim' => 'path', 'q_metric' => 'bounce_rate'])['metric'], 'a column of the table that is not sortable');
        $this->assertSame(['country', 'session', 'duration', 'asc'], array_values(array_intersect_key($oReports->getQueryParams(['q_dim' => 'country', 'q_metric' => 'duration', 'q_dir' => 'asc']), array_flip(['dimension', 'kind', 'metric', 'dir']))));

        $this->assertSame([], $this->_oModule->_oDb->getBreakdown($this->_filter($this->_aDay)->get(), 'nope', 'visitors', 'DESC', 10));
        $this->assertSame([], $this->_oModule->_oDb->getBreakdownSeries($this->_filter($this->_aDay)->get(), 'nope', ['x'], 'day', 0));
        $this->assertGreaterThan(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `path` = '/a' AND `ts` < :to", ['to' => self::NOW + 86400]), 'the events are still there');
    }

    public function testExport()
    {
        $this->_seed();
        $oReports = $this->_oModule->getReports();

        $a = $oReports->getExport('query', $this->_filter($this->_aDay), ['q_dim' => 'country', 'q_metric' => 'pageviews'], 10000);
        $this->assertSame('country', $a['dimension']);
        $this->assertSame([_t('_bx_analytics_dim_country'), _t('_bx_analytics_txt_raw_value'), _t('_bx_analytics_metric_visitors')], array_slice($a['header'], 0, 3));
        $this->assertSame(['GB', 'US', 'FR', 'DE'], array_column($a['rows'], 1), 'the stored values, in the query\'s order');
        $this->assertSame($oReports->getLabel('country', 'GB'), $a['rows'][0][0]);
        $this->assertSame([2, 2, 4], array_slice($a['rows'][0], 2, 3), 'visitors, sessions, pageviews as numbers');
        $this->assertFalse($a['truncated']);

        // every value in the query's order, then the row cap
        $a = $oReports->getExport('query', $this->_filter($this->_aDay), ['q_dim' => 'path'], 10000);
        $this->assertSame(array_column(array_column($oReports->getQuery($this->_filter($this->_aDay), ['q_dim' => 'path'])['rows'], 'filter'), 'value'), array_column($a['rows'], 1));
        $this->assertCount(7, array_unique(array_column($a['rows'], 1)));
        $a = $oReports->getExport('query', $this->_filter($this->_aDay), ['q_dim' => 'path'], 3);
        $this->assertCount(3, $a['rows']);
        $this->assertSame(7, $a['total']);
        $this->assertTrue($a['truncated']);
        $this->assertSame(array_map('_t', ['_bx_analytics_dim_path', '_bx_analytics_txt_raw_value', '_bx_analytics_metric_visitors', '_bx_analytics_metric_pageviews', '_bx_analytics_metric_engaged', '_bx_analytics_metric_entries', '_bx_analytics_metric_bounce_rate', '_bx_analytics_metric_exits']), $a['header'], 'the table\'s columns');

        // a table or top list tab exports the same way
        $a = $oReports->getExport('table', $this->_filter($this->_aDay), ['table' => 'sources', 'tab_sources' => 'channels'], 100);
        $this->assertSame('channel', $a['dimension']);
        $a = $oReports->getExport('top', $this->_filter($this->_aDay), ['group' => 'platforms', 'tab' => 'platforms'], 100);
        $this->assertSame('platform', $a['dimension']);
        $this->assertEqualsCanonicalizing(['core-web', 'next-web', 'rn-ios'], array_column($a['rows'], 1));
        $this->assertFalse($oReports->getExport('table', $this->_filter($this->_aDay), ['table' => 'nope'], 100));
        $this->assertFalse($oReports->getExport('sessions', $this->_filter($this->_aDay), [], 100));

        // through the module: the file name is made of the report, the dimension and the dates only
        $this->bxSetLoggedFlags(BX_DOL_ROLE_MEMBER | BX_DOL_ROLE_ADMIN);
        $a = $this->_oModule->getReportExport('query', $this->_aDay + ['q_dim' => 'path";x', 'tz' => 'Europe/London']);
        $this->assertSame('analytics-query-path-2001-09-09-2001-09-09.csv', $a['filename']);
        $a = $this->_oModule->getReportExport('query', ['range' => 'custom', 'from' => '2001-09-09"><x', 'to' => '2001-09-09', 'q_dim' => 'country']);
        $this->assertMatchesRegularExpression('/^analytics-query-country-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/', $a['filename'], 'an invalid date falls back to the default period');
        $this->assertFalse($this->_oModule->getReportExport('sessions', $this->_aDay), 'no download of a report that names members');
        $this->assertFalse($this->_oModule->getReportExport('revenue', $this->_aDay));

        // the cells a spreadsheet would run as formulas
        $this->_collect($this->_server('81.2.69.150'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/x', 'title' => '=HYPERLINK("http://evil.example","open")']]], self::NOW + 300);
        $a = $oReports->getExport('query', $this->_filter($this->_aDay), ['q_dim' => 'title'], 100);
        $aCells = array_map([BxAnalyticsCsv::class, 'cell'], $a['rows'][array_search('=HYPERLINK("http://evil.example","open")', array_column($a['rows'], 1))]);
        $this->assertSame('\'=HYPERLINK("http://evil.example","open")', $aCells[0]);
        $this->assertSame('\'=HYPERLINK("http://evil.example","open")', $aCells[1]);
    }

    public function testAccess()
    {
        $this->_seed();

        // a guest
        $this->bxBecomeGuest();
        $this->assertFalse($this->_oModule->serviceIsAvaliable());
        $this->assertFalse($this->_oModule->getReportExport('query', $this->_aDay));
        $this->assertSame(403, $this->_oModule->serviceGetReport('query')['code']);
        $this->assertSame('', $this->_oModule->serviceGetBlockReport('query'));

        // a member whose level may not use analytics
        $iProfile = (int)BxDolDb::getInstance()->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON `a`.`id` = `p`.`account_id` WHERE (`a`.`role` & :admin) = 0 AND `p`.`type` <> 'system' AND `p`.`status` = 'active' ORDER BY `p`.`id` LIMIT 1", ['admin' => BX_DOL_ROLE_ADMIN]);
        if (!$iProfile)
            $this->markTestSkipped('no member profile to sign in as');

        $GLOBALS['glForceCurrentProfileId'] = $iProfile;
        $this->bxSetLoggedFlags(BX_DOL_ROLE_MEMBER);
        $this->assertFalse(isAdmin());

        $iLevel = (int)BxDolAcl::getInstance()->getMemberMembershipInfo($iProfile)['id'];
        $this->_grant($iLevel, 'use analytics', false);
        $this->assertFalse($this->_oModule->serviceIsAvaliable());
        $this->assertFalse($this->_oModule->getReportExport('query', $this->_aDay));
        $this->assertSame(403, $this->_oModule->serviceGetReport('query')['code']);

        // may use analytics, but not see people
        $this->_grant($iLevel, 'use analytics', true);
        $this->_grant($iLevel, 'view analytics people', false);
        $this->assertTrue($this->_oModule->serviceIsAvaliable());
        $this->assertIsArray($this->_oModule->getReportExport('query', $this->_aDay));
        $this->assertIsArray($this->_oModule->getReportData('query', $this->_aDay));
        $this->assertFalse($this->_oModule->getReportData('sessions', $this->_aDay));
        $this->assertFalse($this->_oModule->getReportData('users', $this->_aDay));
        $this->assertFalse($this->_oModule->getReportExport('sessions', $this->_aDay));

        // a download doesn't count as a use of the countable action
        $iBefore = $this->_countActions($iProfile);
        $this->_oModule->getReportExport('query', $this->_aDay);
        $this->assertSame($iBefore, $this->_countActions($iProfile));
    }

    public function testServerEvents()
    {
        $this->assertFalse($this->_oModule->serviceIsSafeService('track'), 'not over the API');
        $this->assertFalse($this->_oModule->serviceIsPublicService('track'));

        // a custom event joins the member's visit, even with site actions not tracked
        $this->_setOption('bx_analytics_track_actions', '');
        $iProfileId = 987654321;
        $aServer = $this->_server('93.184.216.34', ['REQUEST_METHOD' => 'POST']);
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/import']]], self::NOW, ['profile_id' => $iProfileId]);

        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW + 20);
        $this->assertTrue($oCollector->collectAction(self::EVENT, '', 0, $iProfileId, ['type' => 'event', 'platform' => 'core-web', 'props' => ['rows' => 120, 'bad key!' => 1], 'value' => 2.5]));
        $this->assertFalse($oCollector->collectAction('login', 'account', 1, $iProfileId, ['platform' => 'core-web']), 'site actions are off');

        $aEvent = BxDolDb::getInstance()->getRow("SELECT `e`.*, `s`.`events` AS `session_events` FROM `bx_analytics_events` AS `e` INNER JOIN `bx_analytics_sessions` AS `s` ON `s`.`id` = `e`.`session_id` WHERE `e`.`name` = :name", ['name' => self::EVENT]);
        $this->assertSame(['event', 'core-web', '', '{"rows":120}', 1], [$aEvent['type'], $aEvent['platform'], $aEvent['module'], $aEvent['props'], (int)$aEvent['session_events']]);
        $this->assertEquals(2.5, $aEvent['value']);

        // the service: from code running in any request, here the command line (platform core)
        $this->assertFalse($this->_oModule->serviceTrack('bad<name>'));
        $this->assertFalse($this->_oModule->serviceTrack(str_repeat('a', 65)));
        $this->assertFalse($this->_oModule->serviceTrack(['x']));
        $this->assertTrue($this->_oModule->serviceTrack(self::EVENT, ['plan' => 'pro']));
        $this->assertSame('core', BxDolDb::getInstance()->getOne("SELECT `platform` FROM `bx_analytics_events` WHERE `name` = :name AND `type` = 'event' AND `session_id` = 0", ['name' => self::EVENT]));

        // a platform left out of Settings > Platforms stores nothing, as Setup shows it
        $iEvents = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `name` = :name", ['name' => self::EVENT]);
        $this->_setOption('bx_analytics_platforms', 'core-web,next-web,rn-ios,rn-android,api');
        $this->assertFalse($this->_oModule->serviceTrack(self::EVENT), 'the server platform is off');
        $this->assertFalse($oCollector->collectAction(self::EVENT, '', 0, $iProfileId, ['type' => 'event', 'platform' => 'core']));
        $this->_setOption('bx_analytics_platforms', 'next-web');
        $this->assertFalse($oCollector->collectAction(self::EVENT, '', 0, $iProfileId, ['type' => 'event', 'platform' => 'core-web']), 'the classic site is off');
        $this->assertSame($iEvents, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `name` = :name", ['name' => self::EVENT]));
        $this->assertSame('off', $this->_oModule->getSetupStatus(self::NOW, false)['core']['status']);
        $this->_setOption('bx_analytics_platforms', 'core-web,next-web,rn-ios,rn-android,api,core');

        $this->_setOption('bx_analytics_tracking', '');
        $this->assertFalse($this->_oModule->serviceTrack(self::EVENT), 'tracking is off');
    }

    /**
     * Seven visitors on 2001-09-09: GB (4 pageviews), US (3, one on iOS), FR (2) and DE (1,
     * on NEO web); seven pages, /a seen by three, /c by two.
     */
    protected function _seed()
    {
        $aVisits = [
            ['81.2.69.142', 'GB', 'core-web', ['/a', '/b', '/d'], 'https://www.google.com/'],
            ['81.2.69.143', 'GB', 'core-web', ['/a'], ''],
            ['93.184.216.34', 'US', 'rn-ios', ['/a', '/c'], ''],
            ['93.184.216.35', 'US', 'core-web', ['/c'], ''],
            ['93.184.216.36', 'DE', 'next-web', ['/e'], ''],
            ['93.184.216.37', 'FR', 'core-web', ['/f'], ''],
            ['93.184.216.38', 'FR', 'core-web', ['/g'], ''],
        ];

        foreach ($aVisits as $i => list($sIp, $sCountry, $sPlatform, $aPages, $sReferrer)) {
            $aServer = $this->_server($sIp, ['HTTP_CF_IPCOUNTRY' => $sCountry], $sPlatform == 'rn-ios' ? 'NEO/1 CFNetwork/1.0 Darwin/24.0.0' : self::UA_SAFARI);
            $sHost = $sPlatform == 'rn-ios' ? '' : 'http://una.test';
            $iTime = self::NOW + $i * 600;
            foreach ($aPages as $j => $sPage) {
                $aHits = [];
                // the previous page reports its engaged time when the next one opens
                if ($j > 0)
                    $aHits[] = ['type' => 'leave', 'url' => $sHost . $aPages[$j - 1], 'engaged' => 5000 * ($i + 1)];
                $aHits[] = ['type' => 'pageview', 'url' => $sHost . $sPage, 'title' => 'Page ' . $sPage];
                $this->_collect($aServer, ['platform' => $sPlatform, 'referrer' => $j ? '' : $sReferrer] + ($sPlatform == 'rn-ios' ? ['app' => 'com.neo.so'] : []) + ['hits' => $aHits], $iTime + 30 * $j);
            }
        }
    }

    protected function _countActions($iProfileId)
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT IFNULL(SUM(`ActionsLeft`), 0) + COUNT(*) FROM `sys_acl_actions_track` WHERE `IDMember` = :id", ['id' => (int)$iProfileId]);
    }

    protected function _collect($aServer, $aPayload, $iNow, $aContext = [])
    {
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), $iNow);

        return $oCollector->collect($aPayload, $aContext + ['platform' => 'api']);
    }

    protected function _filter($aParams)
    {
        return new BxAnalyticsFilter($this->_oModule, $aParams, self::NOW + 86400);
    }

    protected function _server($sIp, $aExtra = [], $sUserAgent = self::UA_SAFARI)
    {
        return array_merge(['REMOTE_ADDR' => $sIp, 'HTTP_USER_AGENT' => $sUserAgent], $aExtra);
    }

    protected function _setOption($sName, $sValue)
    {
        if (!array_key_exists($sName, $this->_aOptions))
            $this->_aOptions[$sName] = getParam($sName);

        setParam($sName, $sValue);
    }

    protected function _grant($iLevel, $sAction, $bAllowed)
    {
        $oDb = BxDolDb::getInstance();
        $iAction = (int)$oDb->getOne("SELECT `ID` FROM `sys_acl_actions` WHERE `Module` = 'bx_analytics' AND `Name` = :name", ['name' => $sAction]);
        $aBindings = ['level' => (int)$iLevel, 'action' => $iAction];

        $sKey = $iLevel . ':' . $iAction;
        if (!array_key_exists($sKey, $this->_aMatrix))
            $this->_aMatrix[$sKey] = $oDb->getRow("SELECT * FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", $aBindings);

        $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", $aBindings);
        if ($bAllowed)
            $oDb->query("INSERT INTO `sys_acl_matrix` SET `IDLevel` = :level, `IDAction` = :action", $aBindings);

        $oDb->cleanMemoryAll();
    }

    protected function _restoreMatrix()
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aMatrix as $sKey => $aRow) {
            list($iLevel, $iAction) = explode(':', $sKey);
            $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", ['level' => (int)$iLevel, 'action' => (int)$iAction]);
            if (!empty($aRow))
                $oDb->query("INSERT INTO `sys_acl_matrix` SET " . $oDb->arrayToSQL(array_filter($aRow, function ($m) { return $m !== null; })));
        }

        $this->_aMatrix = [];
        $oDb->cleanMemoryAll();
    }

    protected function _cleanup()
    {
        $oDb = BxDolDb::getInstance();
        $iTo = self::NOW + 30 * 86400;
        $oDb->query("DELETE FROM `bx_analytics_events` WHERE `ts` < :to OR (`type` = 'event' AND `name` = :name)", ['to' => $iTo, 'name' => self::EVENT]);
        $oDb->query("DELETE FROM `bx_analytics_sessions` WHERE `started` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_salts` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_limits` WHERE `bucket` < 1009843200");
        $this->_oModule->cleanReportCache(); // reports of the test data cached by the run before
    }
}
