<?php

/**
 * Errors and web vitals through the collector, into their tables and back out through the
 * Errors and Performance reports. Test hits are dated in September 2001, far from real
 * traffic, and deleted afterwards; error messages start with "Test 2001" so no real group
 * is touched.
 */
class AnalyticsHealthTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    // what a real catch-all group's fingerprint is while a test makes its own
    const OVERFLOW_ASIDE = 'test-2001-aside!';

    protected $_oModule;
    protected $_aOptions = [];
    protected $_aCnf = [];
    protected $_sOverflow = '';

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getCollector(); // loads the collector classes
        $this->_oModule->getReports();
        $this->_oModule->getFilter([]);

        $this->_cleanup();

        foreach (['bx_analytics_tracking' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => '', 'bx_analytics_geo_source' => 'headers', 'bx_analytics_track_errors' => 'on', 'bx_analytics_track_vitals' => 'on', 'bx_analytics_vitals_sample' => '100', 'bx_analytics_errors_ignore' => "ResizeObserver loop*\nScript error.*\n*Non-Error promise rejection*"] as $sName => $sValue)
            $this->_setOption($sName, $sValue);
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            if ($this->_sOverflow !== '')
                BxDolDb::getInstance()->query("UPDATE `bx_analytics_errors` SET `fingerprint` = :fingerprint WHERE `fingerprint` = :aside", ['fingerprint' => $this->_sOverflow, 'aside' => self::OVERFLOW_ASIDE]);
            foreach ($this->_aOptions as $sName => $sValue)
                setParam($sName, $sValue);
            foreach ($this->_aCnf as $sName => $mixedValue)
                $this->_oModule->_oConfig->CNF[$sName] = $mixedValue;
        }

        parent::tearDown();
    }

    public function testErrorJoinsTheVisit()
    {
        $aServer = $this->_server('81.2.69.142', ['HTTP_CF_IPCOUNTRY' => 'GB']);
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/page/view-post?id=5']]], self::NOW);

        $this->assertSame(1, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$this->_error('Test 2001 TypeError: a is undefined', [
            'url' => 'http://una.test/page/view-post?id=5',
            'source' => 'https://una.example.com/js/app.js?v=3',
            'line' => 10,
            'col' => 5,
            'stack' => "TypeError: a is undefined\n    at render (https://cdn.example.net/app.js?token=abc:10:5)",
            'repeats' => 3,
        ])]], self::NOW + 5));

        $aSession = $this->_sessions()[0];
        $this->assertSame(1, (int)$aSession['errors']);
        $this->assertSame(1, (int)$aSession['pageviews'], 'an error is no pageview');
        $this->assertSame(1, (int)$aSession['bounce'], 'nor an interaction');

        $aHits = $this->_errorHits();
        $this->assertCount(1, $aHits);
        $this->assertSame((int)$aSession['id'], (int)$aHits[0]['session_id']);
        $this->assertSame($aSession['visitor'], $aHits[0]['visitor']);
        $this->assertSame(['core-web', 'Safari', 'macOS', 'desktop', 'GB', '/page/view-post', '/page/view-post', 3], [$aHits[0]['platform'], $aHits[0]['browser'], $aHits[0]['os'], $aHits[0]['device'], $aHits[0]['country'], $aHits[0]['path'], $aHits[0]['route'], (int)$aHits[0]['repeats']]);

        $aGroup = $this->_oModule->_oDb->getErrorGroup($aHits[0]['error_id']);
        $this->assertSame('js', $aGroup['kind']);
        $this->assertSame(3, (int)$aGroup['occurrences']);
        $this->assertSame("TypeError: a is undefined\n    at render (https://cdn.example.net/app.js:10:5)", $aGroup['stack'], 'no query string or token');
        $this->assertSame(self::NOW + 5, (int)$aGroup['first_seen']);
    }

    public function testErrorsPerVisitAreCapped()
    {
        $this->_setCnf('MAX_ERRORS_PER_SESSION', 4);
        $aServer = $this->_server('81.2.69.142');
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]], self::NOW);

        // 12 hits in one request: 10 are read, 4 fit the visit
        $aHits = [];
        for ($i = 0; $i < 12; $i++)
            $aHits[] = $this->_error('Test 2001 loop ' . $i);
        $this->assertSame(4, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => $aHits], self::NOW + 5));
        $this->assertSame(0, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$this->_error('Test 2001 one more')]], self::NOW + 6));

        $this->assertSame(4, (int)$this->_sessions()[0]['errors']);
        $this->assertCount(4, $this->_errorHits());
    }

    public function testErrorWithoutVisit()
    {
        // an app that crashed before its first page, and a deferred error from its last run
        $aServer = $this->_server('93.184.216.34', ['HTTP_CF_IPCOUNTRY' => 'DE'], 'okhttp/4.12.0');
        $aPayload = ['platform' => 'rn-android', 'app' => 'com.neo.so', 'app_version' => '1.5.0', 'os_version' => '15'];

        $this->assertSame(1, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('Test 2001 crash at start', ['kind' => 'native', 'fatal' => 1, 'url' => '/'])]], self::NOW));
        $this->assertCount(0, $this->_sessions(), 'an error starts no visit');

        $aHit = $this->_errorHits()[0];
        $this->assertSame(0, (int)$aHit['session_id']);
        $this->assertSame(16, strlen($aHit['visitor']));
        $this->assertSame(['rn-android', '1.5.0', 'Android', 'mobile', 'DE', 1], [$aHit['platform'], $aHit['app_version'], $aHit['os'], $aHit['device'], $aHit['country'], (int)$aHit['fatal']]);

        // the next launch: a deferred error from two days ago arrives with the first page
        $this->_collect($aServer, $aPayload + ['hits' => [
            $this->_error('Test 2001 crash on the last run', ['kind' => 'native', 'fatal' => 1, 'url' => '/feed', 'age' => 2 * 86400 * 1000, 'deferred' => 1]),
            ['type' => 'pageview', 'url' => '/feed'],
        ]], self::NOW + 3 * 86400);

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions);
        $this->assertSame(0, (int)$aSessions[0]['errors'], 'the old error is not part of this visit');

        $aHits = $this->_errorHits();
        $this->assertSame(self::NOW + 86400, (int)$aHits[1]['ts'], 'dated when it happened');
        $this->assertSame(0, (int)$aHits[1]['session_id']);

        // older than 7 days: dropped
        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('Test 2001 ancient', ['age' => 8 * 86400 * 1000])]], self::NOW + 3 * 86400));
    }

    public function testDeferredCrashJoinsItsVisit()
    {
        $aServer = $this->_server('93.184.216.34', [], 'okhttp/4.12.0');
        $aPayload = ['platform' => 'rn-android', 'app' => 'com.neo.so', 'app_version' => '1.5.0'];

        // a visit, a crash five minutes into it, and the next launch two hours later
        $this->_collect($aServer, $aPayload + ['hits' => [['type' => 'pageview', 'url' => '/feed']]], self::NOW);
        $this->_collect($aServer, $aPayload + ['hits' => [
            $this->_error('Test 2001 crash reported later', ['kind' => 'native', 'fatal' => 1, 'url' => '/feed?id=5', 'age' => (7200 - 300) * 1000, 'deferred' => 1]),
            ['type' => 'pageview', 'url' => '/feed'],
        ]], self::NOW + 7200);

        $aSessions = $this->_sessions();
        $this->assertCount(2, $aSessions);
        $this->assertSame([1, 0], [(int)$aSessions[0]['errors'], (int)$aSessions[1]['errors']], 'the crash counts in the visit it ended');

        $aHit = $this->_errorHits()[0];
        $this->assertSame((int)$aSessions[0]['id'], (int)$aHit['session_id']);
        $this->assertSame([self::NOW + 300, '/feed'], [(int)$aHit['ts'], $aHit['path']]);
        $this->assertSame((int)$aSessions[0]['last_seen'], self::NOW, 'the old visit is not extended');

        $aTiles = array_column($this->_oModule->getReports()->getErrors($this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09']))['tiles'], 'value', 'title');
        $this->assertEquals(50, $aTiles[_t('_bx_analytics_metric_crash_free')], 'one of two app visits crashed');

        // a crash with no visit found counts as a crashed visit too
        $this->_collect($this->_server('93.184.216.40', [], 'okhttp/4.12.0'), $aPayload + ['hits' => [$this->_error('Test 2001 crash at start', ['kind' => 'native', 'fatal' => 1, 'url' => '/'])]], self::NOW + 7300);
        $aTotals = $this->_oModule->_oDb->getErrorTotals($this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'])->get(), ['open', 'resolved'], ['rn-android']);
        $this->assertSame(2, (int)$aTotals['fatal_sessions']);
    }

    public function testGroupsCountAndReopen()
    {
        $aServer = $this->_server('81.2.69.142');
        $aError = $this->_error('Test 2001 item 5 failed', ['stack' => "Error: item 5 failed\n    at load (/_next/static/chunks/app/page-3f9a1b2c4d5e6f70.js:1:200)"]);
        $this->_collect($aServer, ['platform' => 'next-web', 'hits' => [$aError + ['repeats' => 3]]], self::NOW);

        // the next build, another item: the same error
        $aNext = $this->_error('Test 2001 item 77 failed', ['stack' => "Error: item 77 failed\n    at load (/_next/static/chunks/app/page-a0b1c2d3e4f5a6b7.js:1:180)"]);
        $this->_collect($aServer, ['platform' => 'next-web', 'hits' => [$aNext + ['repeats' => 2]]], self::NOW + 60);

        $aHits = $this->_errorHits();
        $this->assertCount(2, $aHits);
        $this->assertSame($aHits[0]['error_id'], $aHits[1]['error_id']);

        $oDb = $this->_oModule->_oDb;
        $iId = (int)$aHits[0]['error_id'];
        $this->assertSame(5, (int)$oDb->getErrorGroup($iId)['occurrences']);
        $this->assertSame(self::NOW + 60, (int)$oDb->getErrorGroup($iId)['last_seen']);
        $this->assertSame('Test 2001 item 77 failed', $oDb->getErrorGroup($iId)['message'], 'the latest occurrence\'s text, none older than the group\'s last occurrence');

        $this->assertTrue($oDb->setErrorStatus($iId, 'resolved', self::NOW + 100));

        // a deferred report of an older occurrence doesn't reopen it, a new one does
        $this->_collect($aServer, ['platform' => 'next-web', 'hits' => [$aError + ['age' => 90 * 1000]]], self::NOW + 120);
        $this->assertSame('resolved', $oDb->getErrorGroup($iId)['status']);
        $this->assertSame('Test 2001 item 77 failed', $oDb->getErrorGroup($iId)['message'], 'an older occurrence reported late leaves it');

        $this->_collect($aServer, ['platform' => 'next-web', 'hits' => [$aError]], self::NOW + 200);
        $this->assertSame('open', $oDb->getErrorGroup($iId)['status']);

        // an ignored error keeps counting
        $oDb->setErrorStatus($iId, 'ignored', self::NOW + 300);
        $this->_collect($aServer, ['platform' => 'next-web', 'hits' => [$aError]], self::NOW + 400);
        $this->assertSame('ignored', $oDb->getErrorGroup($iId)['status']);
        $this->assertSame(8, (int)$oDb->getErrorGroup($iId)['occurrences']);
    }

    public function testNewGroupsAreCapped()
    {
        // the catch-all group has one fingerprint on every site: a real one is set aside
        // while the test makes its own, and restored in tearDown
        $sOverflow = BxAnalyticsErrors::getFingerprint(BxAnalyticsErrors::getOverflowError());
        if (BxDolDb::getInstance()->query("UPDATE `bx_analytics_errors` SET `fingerprint` = :aside WHERE `fingerprint` = :fingerprint", ['aside' => self::OVERFLOW_ASIDE, 'fingerprint' => $sOverflow]))
            $this->_sOverflow = $sOverflow;

        $this->_setCnf('MAX_NEW_ERROR_GROUPS_PER_HOUR', 2);
        $aServer = $this->_server('81.2.69.142');

        $aHits = [];
        foreach (['alpha', 'beta', 'gamma', 'delta'] as $sName)
            $aHits[] = $this->_error('Test 2001 random ' . $sName, ['stack' => "Error\n    at " . $sName . " (/js/app.js:1:1)"]);
        $this->assertSame(4, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => $aHits], self::NOW));

        $aGroups = [];
        foreach (array_column($this->_errorHits(), 'error_id') as $iId)
            $aGroups[] = $this->_oModule->_oDb->getErrorGroup($iId);
        $this->assertSame(['js', 'js', 'overflow', 'overflow'], array_column($aGroups, 'kind'), 'past the limit, new errors share one group');
        $this->assertSame($aGroups[2]['id'], $aGroups[3]['id']);
        $this->assertSame(2, (int)$aGroups[2]['occurrences']);

        // a known error still gets its own group
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$aHits[0]]], self::NOW + 10);
        $this->assertSame(2, (int)BxDolDb::getInstance()->getOne("SELECT `occurrences` FROM `bx_analytics_errors` WHERE `message` = 'Test 2001 random alpha'"));
    }

    public function testDroppedErrors()
    {
        $aServer = $this->_server('81.2.69.142');
        $aPayload = ['platform' => 'core-web'];

        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('ResizeObserver loop completed with undelivered notifications.')]], self::NOW), 'ignore list');
        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('Script error.', ['stack' => ''])]], self::NOW), 'a hidden cross-origin error');
        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('Test 2001 ext', ['source' => 'chrome-extension://abc/content.js'])]], self::NOW), 'an extension');
        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('Test 2001 kind', ['kind' => 'php'])]], self::NOW), 'kinds a client may not send');
        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('')]], self::NOW), 'no message');

        $this->_setOption('bx_analytics_errors_ignore', '');
        $this->assertSame(1, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('ResizeObserver loop completed with undelivered notifications.')]], self::NOW + 1), 'an empty ignore list');

        $this->_setOption('bx_analytics_track_errors', '');
        $this->assertSame(0, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('Test 2001 off')]], self::NOW + 2), 'errors switched off');

        $this->assertCount(1, $this->_errorHits());

        // http errors get a message from their status
        $this->_setOption('bx_analytics_track_errors', 'on');
        $this->assertSame(1, $this->_collect($aServer, $aPayload + ['hits' => [$this->_error('', ['kind' => 'http', 'status' => 502, 'source' => '/api.php'])]], self::NOW + 3));
        $this->assertSame('HTTP 502', BxDolDb::getInstance()->getOne("SELECT `message` FROM `bx_analytics_errors` WHERE `kind` = 'http' AND `created` < :to", ['to' => self::NOW + 86400]));
    }

    public function testVitals()
    {
        $aServer = $this->_server('81.2.69.142');

        $this->assertSame(0, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$this->_vitals(['lcp' => 2000])]], self::NOW), 'no visit, no vitals');

        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/page/view-post?id=5']]], self::NOW);
        $this->assertSame(2, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [
            ['type' => 'leave', 'url' => 'http://una.test/page/view-post?id=5', 'engaged' => 4000],
            $this->_vitals(['ttfb' => 310.4, 'fcp' => 900, 'lcp' => 2400, 'inp' => 180, 'cls' => 0.1049, 'speed_index' => 3]),
            $this->_vitals(['lcp' => 1]),
        ]], self::NOW + 30), 'one vitals hit per request');

        $aSession = $this->_sessions()[0];
        $this->assertSame([1, 0, 1], [(int)$aSession['pageviews'], (int)$aSession['events'], (int)$aSession['bounce']], 'vitals are no pageview or event');
        $this->assertSame(30, (int)$aSession['duration']);

        $aRows = BxDolDb::getInstance()->getAll("SELECT * FROM `bx_analytics_vitals` WHERE `ts` < :to", ['to' => self::NOW + 30 * 86400]);
        $this->assertCount(1, $aRows);
        $a = $aRows[0];
        $this->assertSame([(int)$aSession['id'], 'core-web', 'desktop', '/page/view-post', '/page/view-post', 'navigate'], [(int)$a['session_id'], $a['platform'], $a['device'], $a['path'], $a['route'], $a['nav']]);
        $this->assertSame([310, 900, 2400, 180, 105], [(int)$a['ttfb'], (int)$a['fcp'], (int)$a['lcp'], (int)$a['inp'], (int)$a['cls']], 'whole ms, CLS in thousandths');
        $this->assertNull($a['screen_load'], 'what was not measured stays empty');
        $this->assertArrayNotHasKey('visitor', $a, 'no visitor is stored with vitals');

        $this->_setOption('bx_analytics_track_vitals', '');
        $this->assertSame(0, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$this->_vitals(['lcp' => 2000])]], self::NOW + 40), 'vitals switched off');
        $this->assertSame(0, $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$this->_vitals(['lcp' => 999999, 'cls' => 50])]], self::NOW + 40), 'out of range');
    }

    public function testErrorsReport()
    {
        $aParams = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'];
        $oReports = $this->_oModule->getReports();

        // two visitors hit one error, one of them another error once; an iOS visit crashes
        $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/a'], $this->_error('Test 2001 common', ['url' => 'http://una.test/a', 'repeats' => 2]), $this->_error('Test 2001 rare', ['url' => 'http://una.test/a'])]], self::NOW);
        $this->_collect($this->_server('93.184.216.34'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/b'], $this->_error('Test 2001 common', ['url' => 'http://una.test/b'])]], self::NOW + 10);
        $this->_collect($this->_server('93.184.216.35', [], 'NEO/1 CFNetwork/1.0 Darwin/24.0.0'), ['platform' => 'rn-ios', 'app' => 'com.neo.so', 'hits' => [['type' => 'pageview', 'url' => '/feed'], $this->_error('Test 2001 crash', ['kind' => 'native', 'url' => '/feed', 'fatal' => 1])]], self::NOW + 20);
        $this->_collect($this->_server('93.184.216.36', [], 'NEO/1 CFNetwork/1.0 Darwin/24.0.0'), ['platform' => 'rn-ios', 'app' => 'com.neo.so', 'hits' => [['type' => 'pageview', 'url' => '/feed']]], self::NOW + 30);

        $aList = $oReports->getErrors($this->_filter($aParams));
        $this->assertSame('list', $aList['view']);
        $this->assertSame('open', $aList['tab']);
        $this->assertSame(['Test 2001 common', 'Test 2001 crash', 'Test 2001 rare'], array_slice(array_column($aList['rows'], 'label'), 0, 3));
        $this->assertSame(3, $aList['rows'][0]['values']['count'], 'repeats count');
        $this->assertSame(2, $aList['rows'][0]['values']['users']);
        $this->assertSame(['param' => 'error', 'value' => $this->_groupId('Test 2001 common')], $aList['rows'][0]['open']);
        $this->assertSame(3, array_sum($aList['rows'][0]['values']['trend']), 'the trend adds up to the count');

        $aTiles = array_column($aList['tiles'], 'value', 'title');
        $this->assertSame(5, $aTiles[_t('_bx_analytics_metric_errors')]);
        $this->assertEquals(75, $aTiles[_t('_bx_analytics_metric_error_sessions')], 'three of four visits');
        $this->assertEquals(50, $aTiles[_t('_bx_analytics_metric_crash_free')], 'one of two app visits crashed');
        $this->assertSame(3, $aTiles[_t('_bx_analytics_metric_new_errors')]);

        // filters: the hit's own columns, and the visit's
        $aIos = $oReports->getErrors($this->_filter($aParams + ['platform' => 'rn-ios']));
        $this->assertSame(['Test 2001 crash'], array_column($aIos['rows'], 'label'));
        $aPage = $oReports->getErrors($this->_filter($aParams + ['f' => ['path' => '/b']]));
        $this->assertSame(['Test 2001 common'], array_column($aPage['rows'], 'label'));
        $aPage = $oReports->getErrors($this->_filter($aParams + ['f' => ['path' => '/b?id=7&ref=x']]));
        $this->assertSame(['Test 2001 common'], array_column($aPage['rows'], 'label'), "a pageview's path with its query string");
        $aChannel = $oReports->getErrors($this->_filter($aParams + ['f' => ['channel' => 'direct']]));
        $this->assertCount(3, $aChannel['rows']);

        // resolved and ignored errors move to their tabs
        $this->_oModule->_oDb->setErrorStatus($this->_groupId('Test 2001 rare'), 'ignored', self::NOW + 100);
        $this->assertNotContains('Test 2001 rare', array_column($oReports->getErrors($this->_filter($aParams))['rows'], 'label'));
        $this->assertSame(['Test 2001 rare'], array_column($oReports->getErrors($this->_filter($aParams), ['tab_errors' => 'ignored'])['rows'], 'label'));
        $this->assertCount(3, $oReports->getErrors($this->_filter($aParams), ['tab_errors' => 'all'])['rows']);

        $aDetail = $oReports->getErrors($this->_filter($aParams), ['error' => $this->_groupId('Test 2001 common')]);
        $this->assertSame('detail', $aDetail['view']);
        $this->assertSame([3, 2, 2], array_column($aDetail['tiles'], 'value'));
        $this->assertSame(3, array_sum($aDetail['chart']['datasets'][0]['values']));
        $aRoutes = array_column($aDetail['breakdowns'], null, 'name')['error_route'];
        $this->assertEqualsCanonicalizing(['/a', '/b'], array_column($aRoutes['rows'], 'label'));
        $this->assertCount(2, $aDetail['occurrences']['rows']);
        $this->assertSame('', $aDetail['stack'], 'the stack needs the people permission');
        $this->assertTrue($aDetail['stack_hidden']);
        $this->assertSame([], $aDetail['actions'], 'status changes need the manage permission');

        $this->assertTrue($oReports->getErrors($this->_filter($aParams), ['error' => 999999999])['missing']);
    }

    public function testPerformanceReport()
    {
        $aParams = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'];

        // 40 visits: /fast pages load in 1 s, /slow ones in 1 to 5 s
        for ($i = 0; $i < 40; $i++) {
            $bSlow = $i % 2 == 1;
            $sUrl = 'http://una.test/page/' . ($bSlow ? 'slow' : 'fast') . '/' . $i . '?id=' . $i;
            $this->_collect($this->_server('81.2.' . intdiv($i, 200) . '.' . ($i % 200 + 1), [], $i % 4 < 2 ? self::UA_SAFARI : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'), ['platform' => 'core-web', 'hits' => [
                ['type' => 'pageview', 'url' => $sUrl],
                $this->_vitals(['lcp' => $bSlow ? 1000 + 200 * intdiv($i, 2) : 1000, 'cls' => 0, 'ttfb' => 200], $sUrl),
            ]], self::NOW + $i * 60);
        }

        $aReport = $this->_oModule->getReports()->getPerformance($this->_filter($aParams));
        $this->assertSame('lcp', $aReport['metric']);
        $aCards = array_column($aReport['cards'], null, 'metric');
        $this->assertSame(40, $aCards['lcp']['samples']);
        $this->assertSame(['lcp', 'inp', 'cls', 'fcp', 'ttfb', 'screen_load', 'app_start'], array_keys($aCards), 'every metric on all platforms');

        // exact p75 of 20 x 1000 and 1000..4800 is the 30th of 40: 2800
        $this->assertEqualsWithDelta(2800, $aCards['lcp']['value'], 2800 * 0.03);
        $this->assertSame('needs_improvement', $aCards['lcp']['rating']);
        $this->assertEquals(round(100 * 28 / 40, 1), $aCards['lcp']['good'], 'up to 2.5 s is good');
        $this->assertSame(0.0, $aCards['cls']['value']);
        $this->assertNull($aCards['inp']['value'], 'not measured');

        $aPages = array_column($aReport['pages']['rows'], null, 'label');
        $this->assertSame(['/page/fast/*', '/page/slow/*'], array_keys($aPages), 'pages by route: the ids go');
        $this->assertEqualsWithDelta(1000, $aPages['/page/fast/*']['values']['p75'], 30);
        $this->assertSame('good', $aPages['/page/fast/*']['values']['rating']);
        $this->assertEqualsWithDelta(3800, $aPages['/page/slow/*']['values']['p75'], 3800 * 0.03, 'p75 of 1000..4800 by 200');
        $this->assertSame('needs_improvement', $aPages['/page/slow/*']['values']['rating']);

        // a pageview's path filters the timings of its page
        $aPage = $this->_oModule->getReports()->getPerformance($this->_filter($aParams + ['f' => ['path' => '/page/slow/3?id=3']]));
        $this->assertSame(1, array_column($aPage['cards'], null, 'metric')['lcp']['samples']);

        $aOverTime = $aReport['chart']['datasets'][0]['values'];
        $this->assertCount(24, $aOverTime, 'hourly buckets for one day');
        $this->assertNotNull($aOverTime[1], 'the hour with the visits has a value');

        $aMobile = $this->_oModule->getReports()->getPerformance($this->_filter($aParams), ['vital_device' => 'mobile']);
        $this->assertSame(20, array_column($aMobile['cards'], null, 'metric')['lcp']['samples']);

        $aPaths = $this->_oModule->getReports()->getPerformance($this->_filter($aParams), ['tab_performance' => 'path', 'vital' => 'ttfb']);
        $this->assertSame('ttfb', $aPaths['metric']);
        $this->assertSame(25, count($aPaths['pages']['rows']), 'a page of paths');
        $this->assertSame(2, $aPaths['pages']['pages']);
        $this->assertSame('performance', $aPaths['pages']['name'], 'the list pages under the block name its tabs reset');
        $this->assertSame(15, count($this->_oModule->getReports()->getPerformance($this->_filter($aParams), ['tab_performance' => 'path', 'page_performance' => 2])['pages']['rows']));

        $aApps = $this->_oModule->getReports()->getPerformance($this->_filter($aParams + ['platform' => 'rn-ios']));
        $this->assertSame(['screen_load', 'app_start'], array_column($aApps['cards'], 'metric'));
    }

    public function testPruningAndForget()
    {
        $iProfileId = 987654321;
        $aServer = $this->_server('81.2.69.142');
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/'], $this->_error('Test 2001 member error'), $this->_vitals(['lcp' => 1500])]], self::NOW, ['profile_id' => $iProfileId]);

        $aHit = $this->_errorHits()[0];
        $this->assertSame($iProfileId, (int)$aHit['profile_id']);

        $this->_oModule->onProfileDelete($iProfileId);
        $aHit = $this->_errorHits()[0];
        $this->assertSame(0, (int)$aHit['profile_id']);
        $this->assertSame($this->_sessions()[0]['visitor'], $aHit['visitor'], 'the same anonymous visitor as the visit');

        $oDb = $this->_oModule->_oDb;
        $this->assertSame(1, $oDb->deleteErrorHitsBefore(self::NOW + 1, 100));
        $this->assertSame(1, $oDb->deleteVitalsBefore(self::NOW + 1, 100));
        $this->assertSame(1, $oDb->deleteErrorGroupsBefore(self::NOW + 1, 100));
        $this->assertCount(0, $this->_errorHits());
    }

    public function testPruningCutoffs()
    {
        $this->_setOption('bx_analytics_retention_days', '30');
        $this->_setOption('bx_analytics_vitals_retention_days', '5');
        $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/'], $this->_error('Test 2001 pruned error'), $this->_vitals(['lcp' => 1500])]], self::NOW);

        // ten days later: vitals are past their 5 days, the rest is within its 30
        $iNow = self::NOW + 10 * 86400;
        $aCutoffs = $this->_oModule->getPruningCutoffs($iNow);
        $this->assertSame(['deleteLimitsBefore', 'deleteVitalsBefore', 'deleteErrorHitsBefore', 'deleteErrorGroupsBefore', 'clearErrorStacksBefore', 'deleteEventsBefore', 'deleteSessionsBefore'], array_keys($aCutoffs), 'the small, fast growing tables first: they share the run\'s time limit');
        $this->assertSame($iNow - 5 * 86400, $aCutoffs['deleteVitalsBefore']);
        foreach (['deleteEventsBefore', 'deleteSessionsBefore', 'deleteErrorHitsBefore', 'deleteErrorGroupsBefore', 'clearErrorStacksBefore'] as $sMethod)
            $this->assertSame($iNow - 30 * 86400, $aCutoffs[$sMethod], $sMethod);

        $oDb = $this->_oModule->_oDb;
        foreach ($aCutoffs as $sMethod => $iTime)
            $oDb->$sMethod($iTime, 100);

        $this->assertCount(1, $this->_sessions());
        $this->assertCount(1, $this->_errorHits());
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_errors` WHERE `message` = 'Test 2001 pruned error'"));
        $this->assertNotSame('', $oDb->getErrorGroup($this->_groupId('Test 2001 pruned error'))['stack'], 'a sample within the retention stays');

        // a group that goes on happening keeps its sample stack no longer than the rest
        $this->assertSame(1, $oDb->clearErrorStacksBefore(self::NOW + 1, 100));
        $aGroup = BxDolDb::getInstance()->getRow("SELECT `stack`, `stack_ts` FROM `bx_analytics_errors` WHERE `id` = :id", ['id' => $this->_groupId('Test 2001 pruned error')]);
        $this->assertSame(['', 0], [$aGroup['stack'], (int)$aGroup['stack_ts']]);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_vitals` WHERE `ts` < :to", ['to' => self::NOW + 30 * 86400]));

        // vitals are never kept longer than the rest
        $this->_setOption('bx_analytics_vitals_retention_days', '400');
        $this->assertSame($iNow - 30 * 86400, $this->_oModule->getPruningCutoffs($iNow)['deleteVitalsBefore']);
    }

    protected function _error($sMessage, $aExtra = [])
    {
        return array_merge(['type' => 'error', 'url' => 'http://una.test/', 'kind' => 'js', 'message' => $sMessage, 'stack' => "Error: x\n    at f (/js/app.js:1:1)"], $aExtra);
    }

    protected function _vitals($aMetrics, $sUrl = 'http://una.test/page/view-post?id=5')
    {
        return ['type' => 'vitals', 'url' => $sUrl, 'nav' => 'navigate', 'metrics' => $aMetrics];
    }

    protected function _groupId($sMessage)
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `bx_analytics_errors` WHERE `message` = :message", ['message' => $sMessage]);
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

    protected function _errorHits()
    {
        return BxDolDb::getInstance()->getAll("SELECT * FROM `bx_analytics_error_hits` WHERE `ts` < :to ORDER BY `id`", ['to' => self::NOW + 30 * 86400]);
    }

    protected function _setOption($sName, $sValue)
    {
        if (!array_key_exists($sName, $this->_aOptions))
            $this->_aOptions[$sName] = getParam($sName);

        setParam($sName, $sValue);
    }

    protected function _setCnf($sName, $mixedValue)
    {
        if (!array_key_exists($sName, $this->_aCnf))
            $this->_aCnf[$sName] = $this->_oModule->_oConfig->CNF[$sName];

        $this->_oModule->_oConfig->CNF[$sName] = $mixedValue;
    }

    protected function _cleanup()
    {
        $oDb = BxDolDb::getInstance();
        $iTo = self::NOW + 30 * 86400;
        $oDb->query("DELETE FROM `bx_analytics_events` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_sessions` WHERE `started` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_error_hits` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_vitals` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_errors` WHERE `created` < :to AND `last_seen` < :to2", ['to' => $iTo, 'to2' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_salts` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_limits` WHERE `bucket` < 1009843200");
        $this->_oModule->cleanReportCache(); // reports of the test data cached by the run before
    }
}
