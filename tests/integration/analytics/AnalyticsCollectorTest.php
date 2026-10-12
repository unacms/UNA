<?php

/**
 * Hits through the collector into sessions and events, and back out through reports.
 * Test hits are dated in September 2001, far from real traffic, and deleted afterwards.
 */
class AnalyticsCollectorTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    protected $_oModule;
    protected $_aOptions = [];
    protected $_aGoals = [];
    protected $_aFunnels = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getCollector(); // loads the collector classes
        $this->_oModule->getFilter([]);

        $this->_cleanup();

        foreach (['bx_analytics_track_actions' => 'on', 'bx_analytics_track_bots' => 'on', 'bx_analytics_tracking' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => '', 'bx_analytics_geo_source' => 'headers'] as $sName => $sValue)
            $this->_setOption($sName, $sValue);
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            foreach ($this->_aOptions as $sName => $sValue)
                setParam($sName, $sValue);
        }

        parent::tearDown();
    }

    public function testPageviewsMakeOneSession()
    {
        $aServer = $this->_server('81.2.69.142', ['HTTP_CF_IPCOUNTRY' => 'GB']);

        $this->assertSame(1, $this->_collect($aServer, [
            'platform' => 'core-web',
            'referrer' => 'https://www.google.com/',
            'language' => 'en-GB',
            'screen' => '1440x900',
            'hits' => [['type' => 'pageview', 'url' => 'http://una.test/page/explore?utm_source=nl&utm_medium=email&gclid=1', 'title' => 'Explore']],
        ], self::NOW));

        $this->assertSame(2, $this->_collect($aServer, [
            'platform' => 'core-web',
            'hits' => [
                ['type' => 'leave', 'url' => 'http://una.test/page/explore', 'engaged' => 15000],
                ['type' => 'pageview', 'url' => 'http://una.test/page/view-post?id=5', 'title' => 'Post'],
            ],
        ], self::NOW + 60));

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions);

        $a = $aSessions[0];
        $this->assertSame('core-web', $a['platform']);
        $this->assertSame(2, (int)$a['pageviews']);
        $this->assertSame(0, (int)$a['bounce']);
        $this->assertSame(60, (int)$a['duration']);
        $this->assertSame('/page/explore', $a['entry_path'], 'campaign tags and click ids are not part of the path');
        $this->assertSame('/page/view-post?id=5', $a['exit_path']);
        $this->assertSame(['google.com', 'email', 'nl', 'GB', 'Safari', 'macOS', 'desktop', '1440x900'], [$a['referrer_host'], $a['channel'], $a['utm_source'], $a['country'], $a['browser'], $a['os'], $a['device'], $a['screen']]);

        $aEvents = BxDolDb::getInstance()->getAll("SELECT `path`, `engaged` FROM `bx_analytics_events` WHERE `session_id` = :id ORDER BY `id`", ['id' => $a['id']]);
        $this->assertEquals([['path' => '/page/explore', 'engaged' => 15000], ['path' => '/page/view-post?id=5', 'engaged' => 0]], $aEvents, 'engaged time goes to the page that was left');
    }

    public function testDroppedHits()
    {
        $aHit = ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]];

        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142', [], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), $aHit, self::NOW), 'bot');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142', ['HTTP_DNT' => '1']), $aHit, self::NOW), 'Do Not Track');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core'] + $aHit, self::NOW), 'the server platform is not for clients');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142'), ['platform' => 'windows-phone'] + $aHit, self::NOW), 'unknown platform');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'https://elsewhere.example/']]], self::NOW, ['same_origin' => true]), 'another site');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142', ['HTTP_SEC_FETCH_SITE' => 'cross-site']), $aHit, self::NOW, ['same_origin' => true]), 'cross-site request');

        $this->_setOption('bx_analytics_exclude_ips', '81.2.69.0/24');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142'), $aHit, self::NOW), 'excluded address');

        $this->_setOption('bx_analytics_platforms', 'next-web');
        $this->assertSame(0, $this->_collect($this->_server('93.184.216.34'), $aHit, self::NOW), 'platform switched off');

        $this->assertCount(0, $this->_sessions());
    }

    public function testNativeAppHit()
    {
        $this->assertSame(1, $this->_collect($this->_server('93.184.216.34', [], 'okhttp/4.12.0'), [
            'platform' => 'rn-android',
            'app' => 'com.neo.so',
            'app_version' => '1.5.0',
            'os_version' => '15',
            'device' => 'tablet',
            'hits' => [['type' => 'pageview', 'url' => '/page/explore', 'title' => 'Explore']],
        ], self::NOW), 'an HTTP library user agent is fine for an app');

        $a = $this->_sessions()[0];
        $this->assertSame(['rn-android', 'com.neo.so', '1.5.0', 'Android', '15', 'tablet', 'com.neo.so'], [$a['platform'], $a['app'], $a['app_version'], $a['os'], $a['os_version'], $a['device'], $a['hostname']]);
    }

    public function testTrackerConfig()
    {
        $this->assertTrue($this->_oModule->serviceIsSafeService('get_tracker_config'), 'NEO reads it over the API');

        $a = $this->_oModule->serviceGetTrackerConfig('rn-ios');
        $this->assertSame(['enabled', 'persistent', 'respect_dnt', 'session_timeout'], array_keys($a), 'settings only, nothing about the site or the viewer');
        $this->assertTrue($a['enabled']);
        $this->assertFalse($a['persistent']);
        $this->assertTrue($a['respect_dnt']);
        $this->assertSame($this->_oModule->_oConfig->getSessionTimeout(), $a['session_timeout']);

        $this->assertFalse($this->_oModule->serviceGetTrackerConfig('core')['enabled'], 'the server platform is not for clients');
        $this->assertFalse($this->_oModule->serviceGetTrackerConfig('windows-phone')['enabled'], 'unknown platform');

        $this->_setOption('bx_analytics_identity', 'persistent');
        $this->assertTrue($this->_oModule->serviceGetTrackerConfig('next-web')['persistent']);

        $this->_setOption('bx_analytics_platforms', 'next-web');
        $this->assertFalse($this->_oModule->serviceGetTrackerConfig('rn-ios')['enabled'], 'platform switched off');

        $this->_setOption('bx_analytics_tracking', '');
        $a = $this->_oModule->serviceGetTrackerConfig('next-web');
        $this->assertFalse($a['enabled'], 'tracking off');
        $this->assertFalse($a['persistent'], 'no visitor id to keep when nothing is sent');
    }

    public function testGuestSignsInAndIsForgotten()
    {
        $iProfileId = 987654321;
        $aServer = $this->_server('93.184.216.34');
        $aHit = ['platform' => 'next-web', 'hits' => [['type' => 'pageview', 'url' => 'https://neo.test/']]];

        $this->_collect($aServer, $aHit, self::NOW);
        $this->_collect($aServer, $aHit, self::NOW + 30, ['profile_id' => $iProfileId]);

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions, 'signing in continues the visit');
        $this->assertSame($iProfileId, (int)$aSessions[0]['profile_id']);
        $sMemberVisitor = $aSessions[0]['visitor'];

        $this->_oModule->onProfileDelete($iProfileId);

        $aSessions = $this->_sessions();
        $this->assertSame(0, (int)$aSessions[0]['profile_id']);
        $this->assertNotSame($sMemberVisitor, $aSessions[0]['visitor']);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `profile_id` = :p", ['p' => $iProfileId]));
    }

    public function testCookielessVisitorsChangeDaily()
    {
        $aServer = $this->_server('93.184.216.34');
        $aHit = ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]];

        $this->_collect($aServer, $aHit, self::NOW);
        $this->_collect($aServer, $aHit, self::NOW + 2 * 86400);

        $aSessions = $this->_sessions();
        $this->assertCount(2, $aSessions);
        $this->assertNotSame($aSessions[0]['visitor'], $aSessions[1]['visitor']);
    }

    public function testReports()
    {
        // two visitors: one bounces from a search, one views two pages on iOS
        $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core-web', 'referrer' => 'https://duckduckgo.com/', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/a']]], self::NOW);
        $this->_collect($this->_server('93.184.216.34', [], 'NEO/1 CFNetwork/1.0 Darwin/24.0.0'), ['platform' => 'rn-ios', 'app' => 'com.neo.so', 'hits' => [['type' => 'pageview', 'url' => '/a'], ['type' => 'pageview', 'url' => '/b']]], self::NOW + 10);

        $aParams = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'];

        $aOverview = $this->_oModule->getReports()->getOverview($this->_filter($aParams));
        $this->assertSame(2, $aOverview['kpis']['visitors']['value']);
        $this->assertSame(3, $aOverview['kpis']['pageviews']['value']);
        $this->assertEquals(50, $aOverview['kpis']['bounce_rate']['value']);
        $this->assertSame('hour', $aOverview['bucket']);
        $this->assertSame(24, count($aOverview['series']));

        $aIos = $this->_oModule->getReports()->getOverview($this->_filter($aParams + ['platform' => 'rn-ios']));
        $this->assertSame(1, $aIos['kpis']['visitors']['value']);

        $aPages = $this->_oModule->getReports()->getTop($this->_filter($aParams), ['group' => 'pages', 'tab' => 'pages']);
        $this->assertSame(['/a', '/b'], array_column($aPages['items'], 'value'));
        $this->assertSame([2, 1], array_column($aPages['items'], 'visitors'));

        $aChannels = $this->_oModule->getReports()->getTop($this->_filter($aParams + ['f' => ['path' => '/b']]), ['group' => 'sources', 'tab' => 'channels']);
        $this->assertSame(['direct'], array_column($aChannels['items'], 'value'), 'a page filter keeps the sessions that saw it');

        $aPlatforms = $this->_oModule->getReports()->getTop($this->_filter($aParams), ['group' => 'platforms', 'tab' => 'platforms']);
        $this->assertEqualsCanonicalizing(['core-web', 'rn-ios'], array_column($aPlatforms['items'], 'value'));

        $aTable = $this->_oModule->getReports()->getTable($this->_filter($aParams), ['table' => 'pages']);
        $this->assertSame(['/a', '/b'], array_column($aTable['rows'], 'label'));
        $this->assertSame(2, $aTable['rows'][0]['values']['entries'], 'both sessions entered on /a');
        $this->assertSame(1, $aTable['rows'][0]['values']['exits'], 'the one-page session left from /a');
        $this->assertEquals(50, $aTable['rows'][0]['values']['bounce_rate']);
        $this->assertSame(2, $aTable['total']);

        $this->assertFalse($this->_oModule->getReports()->getTable($this->_filter($aParams), ['table' => 'nope']));
        $this->assertFalse($this->_oModule->getReportData('nope', $aParams), 'unknown reports are refused');
    }

    public function testBotsAreCountedApart()
    {
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($this->_server('66.249.66.1')), self::NOW);
        $this->assertTrue($oCollector->collectBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '/page/explore?utm_source=x'));
        $this->assertTrue($oCollector->collectBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '/page/explore'));
        $this->assertTrue($oCollector->collectBot('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)', '/'));
        $this->assertFalse($oCollector->collectBot(self::UA_SAFARI, '/'), 'browsers are not bots');

        // a headless browser that runs the tracker is a bot, not a visit
        $this->assertSame(0, $this->_collect($this->_server('66.249.66.1', [], 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]], self::NOW));
        $this->assertCount(0, $this->_sessions());

        $aFilter = $this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'])->get();
        $this->assertEquals(['hits' => 4, 'bots' => 3], $this->_oModule->_oDb->getBotTotals($aFilter));
        $this->assertEquals(['hits' => 1, 'bots' => 1], $this->_oModule->_oDb->getBotTotals($aFilter, ['ai_agent']));

        $aPages = $this->_oModule->_oDb->getBotPages($aFilter, ['search'], 10);
        $this->assertEquals([['path' => '/page/explore', 'hits' => 2]], $aPages, 'campaign tags are not part of the path');

        $aReport = $this->_oModule->getReports()->getBots($this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09']), ['tab_bots' => 'ai']);
        $this->assertSame('ai', $aReport['tab']);
        $this->assertSame(['ChatGPT'], array_column($aReport['bots']['rows'], 'label'));
    }

    public function testSiteActionsJoinTheVisit()
    {
        $iProfileId = 987654321;
        $aServer = $this->_server('93.184.216.34', ['REQUEST_METHOD' => 'POST']);

        $this->_collect($aServer, ['platform' => 'rn-ios', 'app' => 'com.neo.so', 'hits' => [['type' => 'pageview', 'url' => '/page/create-post']]], self::NOW, ['profile_id' => $iProfileId]);

        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW + 20);
        $this->assertTrue($oCollector->collectAction('content_add', 'bx_posts', 77, $iProfileId, ['platform' => 'rn-ios']));

        // a renewal by cron has no visit and runs on the server's own platform
        $oCron = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 30);
        $this->assertTrue($oCron->collectAction('login', 'account', 1, $iProfileId));

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions);
        $this->assertSame(1, (int)$aSessions[0]['events']);
        $this->assertSame(0, (int)$aSessions[0]['bounce'], 'doing something is not a bounce');

        $aEvents = BxDolDb::getInstance()->getAll("SELECT `session_id`, `type`, `name`, `module`, `object_id`, `platform` FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to ORDER BY `id`", ['to' => self::NOW + 86400]);
        $this->assertEquals([
            ['session_id' => $aSessions[0]['id'], 'type' => 'una', 'name' => 'content_add', 'module' => 'bx_posts', 'object_id' => 77, 'platform' => 'rn-ios'],
            ['session_id' => 0, 'type' => 'una', 'name' => 'login', 'module' => 'account', 'object_id' => 1, 'platform' => 'core'],
        ], $aEvents);

        $aParams = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'];
        $oReports = $this->_oModule->getReports();

        $aList = $oReports->getEvents($this->_filter($aParams), ['tab_events' => 'site']);
        $this->assertSame('list', $aList['view']);
        $this->assertCount(2, $aList['rows']);

        $aDetail = $oReports->getEvents($this->_filter($aParams), ['event' => 'una|content_add|bx_posts']);
        $this->assertSame('detail', $aDetail['view']);
        $this->assertSame(1, $aDetail['tiles'][0]['value']);
        $this->assertSame([['label' => $oReports->getLabel('platform', 'rn-ios'), 'count' => 1, 'share' => 100.0]], $aDetail['platforms']);

        $this->assertNull($oReports->getEvents($this->_filter($aParams), ['event' => 'pageview|x|y'])['event'] ?? null, 'pageviews are not events');

        $aSessionsList = $oReports->getSessions($this->_filter($aParams));
        $this->assertCount(1, $aSessionsList['rows']);
        $aSessionDetail = $oReports->getSessions($this->_filter($aParams), ['session' => $aSessions[0]['id']]);
        $this->assertSame(['pageview', 'una'], array_column($aSessionDetail['timeline'], 'type'));
        $this->assertSame(20, $aSessionDetail['timeline'][1]['offset']);

        $aUsers = $oReports->getUsers($this->_filter($aParams));
        $this->assertSame(1, count($aUsers['rows']));
        $this->assertSame(['param' => 'user', 'value' => $iProfileId], $aUsers['rows'][0]['open']);
    }

    public function testJourneysAndRetention()
    {
        // three members' visits: / -> /a -> /b, / -> /a -> /c, / -> /d, the first coming back a week later
        $aVisits = [
            [987654321, self::NOW, ['/', '/a', '/b']],
            [987654322, self::NOW + 100, ['/', '/a', '/a', '/c']],
            [987654323, self::NOW + 200, ['/', '/d']],
            [987654321, self::NOW + 7 * 86400, ['/']],
        ];
        foreach ($aVisits as list($iProfileId, $iTime, $aPages))
            foreach ($aPages as $i => $sPage)
                $this->_collect($this->_server('93.184.216.' . ($iProfileId % 100)), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test' . $sPage]]], $iTime + $i * 10, ['profile_id' => $iProfileId]);

        $oReports = $this->_oModule->getReports();
        $oFilter = $this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09']);

        $aJourneys = $oReports->getJourneys($oFilter);
        $this->assertSame('/', $aJourneys['from'], 'the top entry page by default');
        $this->assertSame(3, $aJourneys['from_sessions']);
        $this->assertSame([['page' => '/a', 'sessions' => 2, 'share' => 66.7], ['page' => '/d', 'sessions' => 1, 'share' => 33.3]], $aJourneys['next']);

        $aVia = $oReports->getJourneys($oFilter, ['via' => '/a']);
        $this->assertEqualsCanonicalizing(['/b', '/c'], array_column($aVia['after'], 'page'), 'a page reloaded in place counts once');

        $aPaths = array_map(function ($a) { return implode(' ', $a['pages']); }, $aJourneys['paths']);
        $this->assertContains('/ /a /b', $aPaths);

        $aRetention = $oReports->getRetention(new BxAnalyticsFilter($this->_oModule, ['range' => '7d'], self::NOW + 8 * 86400));
        $aCohorts = array_values(array_filter($aRetention['rows'], function ($a) { return $a['size'] > 0; }));
        $this->assertCount(1, $aCohorts);
        $this->assertSame(3, $aCohorts[0]['size']);
        $this->assertEquals(100, $aCohorts[0]['weeks'][0]);
        $this->assertEquals(33.3, $aCohorts[0]['weeks'][1], 'one of three came back the next week');
    }

    public function testGoalsAndFunnels()
    {
        $oDb = $this->_oModule->_oDb;
        $iPricing = $oDb->saveGoal(0, ['name' => 'Test 2001 pricing', 'type' => 'page', 'pattern' => '/pricing*']);
        $iBuy = $oDb->saveGoal(0, ['name' => 'Test 2001 buy', 'type' => 'event', 'pattern' => 'buy']);
        $iFunnel = $oDb->saveFunnel(0, 'Test 2001 funnel', [
            ['type' => 'page', 'pattern' => '/'],
            ['type' => 'page', 'pattern' => '/pricing*'],
            ['type' => 'event', 'pattern' => 'buy'],
        ]);
        $this->_aGoals = [$iPricing, $iBuy];
        $this->_aFunnels = [$iFunnel];
        $this->assertGreaterThan(0, $iPricing);
        $this->assertGreaterThan(0, $iFunnel);

        // A: / -> /pricing -> buy, B: / -> buy -> /pricing?plan=pro, C: /pricing only
        $aVisits = [
            ['93.184.216.1', [['pageview', '/'], ['pageview', '/pricing'], ['event', '/pricing', 'buy']]],
            ['93.184.216.2', [['pageview', '/'], ['event', '/', 'buy'], ['pageview', '/pricing?plan=pro']]],
            ['93.184.216.3', [['pageview', '/pricing']]],
        ];
        foreach ($aVisits as $iVisit => list($sIp, $aHits))
            foreach ($aHits as $i => $aHit)
                $this->_collect($this->_server($sIp), ['platform' => 'core-web', 'hits' => [['type' => $aHit[0], 'url' => 'http://una.test' . $aHit[1], 'name' => isset($aHit[2]) ? $aHit[2] : '']]], self::NOW + $iVisit * 100 + $i * 10);

        $oReports = $this->_oModule->getReports();
        $oFilter = $this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09']);

        $aGoals = array_column($oReports->getGoals($oFilter)['goals'], null, 'id');
        $this->assertSame(3, $aGoals[$iPricing]['conversions'], 'a page goal with * matches the query string too');
        $this->assertEquals(100, $aGoals[$iPricing]['rate']);
        $this->assertSame(2, $aGoals[$iBuy]['conversions']);
        $this->assertEquals(66.67, $aGoals[$iBuy]['rate']);

        $aFunnel = $oReports->getFunnels($oFilter, ['funnel' => $iFunnel]);
        $this->assertSame($iFunnel, $aFunnel['funnel']['id']);
        $this->assertSame([2, 2, 1], array_column($aFunnel['steps'], 'sessions'), 'a step counts only after the previous one');
        $this->assertEquals([100, 100, 50], array_column($aFunnel['steps'], 'rate'));
        $this->assertEquals([null, 0, 50], array_column($aFunnel['steps'], 'drop'));

        $this->assertTrue($oDb->deleteGoal($iBuy));
        $this->assertFalse((bool)$oDb->getGoal($iBuy));
        $this->assertTrue($oDb->deleteFunnel($iFunnel));
        $this->assertNotContains($iFunnel, array_column($oReports->getFunnels($oFilter)['funnels'], 'id'), 'a deleted funnel is not listed');
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

    protected function _sessions()
    {
        return BxDolDb::getInstance()->getAll("SELECT * FROM `bx_analytics_sessions` WHERE `started` < :to ORDER BY `id`", ['to' => self::NOW + 30 * 86400]);
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
        $oDb->query("DELETE FROM `bx_analytics_salts` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_bots` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_bot_pages` WHERE `day` < '2002-01-01'");
        foreach ($this->_aGoals as $iId)
            $this->_oModule->_oDb->deleteGoal($iId);
        foreach ($this->_aFunnels as $iId)
            $this->_oModule->_oDb->deleteFunnel($iId);
        $this->_aGoals = $this->_aFunnels = [];
    }
}
