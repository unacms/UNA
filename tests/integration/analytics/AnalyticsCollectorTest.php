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

        foreach (['bx_analytics_track_actions' => 'on', 'bx_analytics_track_bots' => 'on', 'bx_analytics_tracking' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api,core', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => '', 'bx_analytics_geo_source' => 'headers', 'bx_analytics_limit_hits' => '300', 'bx_analytics_limit_visits' => '100'] as $sName => $sValue)
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
        $this->assertSame(['enabled', 'persistent', 'respect_dnt', 'session_timeout', 'errors', 'errors_ignore', 'vitals', 'vitals_sample'], array_keys($a), 'settings only, nothing about the site or the viewer');
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

        // health: what NEO reports about errors and timings
        $this->_setOption('bx_analytics_track_errors', 'on');
        $this->_setOption('bx_analytics_track_vitals', 'on');
        $this->_setOption('bx_analytics_vitals_sample', '25');
        $this->_setOption('bx_analytics_errors_ignore', "ResizeObserver loop*\r\nScript error.*");
        $a = $this->_oModule->serviceGetTrackerConfig('next-web');
        $this->assertTrue($a['errors']);
        $this->assertTrue($a['vitals']);
        $this->assertSame(25, $a['vitals_sample']);
        $this->assertSame(['ResizeObserver loop*', 'Script error.*'], $a['errors_ignore'], 'one pattern per line');

        $this->_setOption('bx_analytics_vitals_sample', '0');
        $this->assertFalse($this->_oModule->serviceGetTrackerConfig('next-web')['vitals'], 'nothing sampled');
        $this->_setOption('bx_analytics_track_errors', '');
        $this->assertFalse($this->_oModule->serviceGetTrackerConfig('next-web')['errors']);

        $this->_setOption('bx_analytics_tracking', '');
        $a = $this->_oModule->serviceGetTrackerConfig('next-web');
        $this->assertFalse($a['enabled'], 'tracking off');
        $this->assertFalse($a['persistent'], 'no visitor id to keep when nothing is sent');
        $this->_setOption('bx_analytics_track_errors', 'on');
        $this->assertFalse($this->_oModule->serviceGetTrackerConfig('next-web')['errors'], 'no errors when nothing is sent');
    }

    public function testGuestSignsInAndIsForgotten()
    {
        $iProfileId = 987654321;
        $aServer = $this->_server('93.184.216.34');
        $aHit = ['platform' => 'next-web', 'hits' => [['type' => 'pageview', 'url' => 'https://neo.test/']]];

        $oDb = BxDolDb::getInstance();
        $this->_collect($aServer, $aHit, self::NOW);
        $this->_collect($aServer, ['platform' => 'next-web', 'hits' => [['type' => 'event', 'url' => 'https://neo.test/', 'name' => 'cta_click']]], self::NOW + 5);
        $sGuestVisitor = $oDb->getOne("SELECT `visitor` FROM `bx_analytics_events` WHERE `ts` = :ts", ['ts' => self::NOW]);
        $this->_collect($aServer, $aHit, self::NOW + 30, ['profile_id' => $iProfileId]);

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions, 'signing in continues the visit');
        $this->assertSame($iProfileId, (int)$aSessions[0]['profile_id']);
        $sMemberVisitor = $aSessions[0]['visitor'];
        $this->assertNotSame($sMemberVisitor, $sGuestVisitor);

        $aBefore = $oDb->getAll("SELECT `visitor`, `profile_id` FROM `bx_analytics_events` WHERE `ts` < :ts ORDER BY `id`", ['ts' => self::NOW + 30]);
        $this->assertCount(2, $aBefore);
        foreach ($aBefore as $a)
            $this->assertSame([$sMemberVisitor, $iProfileId], [$a['visitor'], (int)$a['profile_id']], 'what happened before signing in is the member\'s too');

        // one visit is one person in the page and event reports, and the member's actions include those before signing in
        $aFilter = $this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'])->get();
        $aPages = $this->_oModule->_oDb->getPageStats($aFilter, 'path', 10);
        $this->assertSame([['/', 1, 2]], array_map(function ($a) { return [$a['value'], (int)$a['visitors'], (int)$a['pageviews']]; }, $aPages));
        $aActions = $this->_oModule->_oDb->getMemberActions($iProfileId, $aFilter);
        $this->assertSame([['cta_click', 1]], array_map(function ($a) { return [$a['name'], (int)$a['count']]; }, $aActions));

        // site actions about the account and the profile, and another visit days later
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer + ['REQUEST_METHOD' => 'POST']), self::NOW + 40);
        $this->assertTrue($oCollector->collectAction('login', 'account', 4242, $iProfileId, ['platform' => 'next-web']));
        $this->assertTrue($oCollector->collectAction('profile_add', 'bx_persons', $iProfileId, $iProfileId, ['platform' => 'next-web']));
        $this->_collect($this->_server('81.2.69.142'), $aHit, self::NOW + 2 * 86400, ['profile_id' => $iProfileId]);
        $this->assertCount(2, $this->_sessions());

        $this->_oModule->onProfileDelete($iProfileId);

        $aSessions = $this->_sessions();
        $this->assertSame([0, 0], array_map('intval', array_column($aSessions, 'profile_id')));
        $this->assertNotSame($sMemberVisitor, $aSessions[0]['visitor']);
        $this->assertNotSame($aSessions[0]['visitor'], $aSessions[1]['visitor'], 'its visits are not tied to one another');
        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `profile_id` = :p", ['p' => $iProfileId]));

        $aEvents = $oDb->getAll("SELECT `e`.`visitor`, `e`.`object_id`, `s`.`visitor` AS `session_visitor` FROM `bx_analytics_events` AS `e` INNER JOIN `bx_analytics_sessions` AS `s` ON `s`.`id` = `e`.`session_id` WHERE `e`.`ts` < :to ORDER BY `e`.`id`", ['to' => self::NOW + 30 * 86400]);
        $this->assertCount(6, $aEvents);
        foreach ($aEvents as $a) {
            $this->assertSame($a['session_visitor'], $a['visitor'], 'every event is its visit\'s, the one before signing in too');
            $this->assertNotContains($a['visitor'], [$sMemberVisitor, $sGuestVisitor]);
        }
        $this->assertSame([0, 0], array_map('intval', $oDb->getColumn("SELECT `object_id` FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to", ['to' => self::NOW + 30 * 86400])), 'the account and the profile the actions were about');

        // the profile's creation is found by a key, not among every profile created
        $aKey = $oDb->getAll("SHOW INDEX FROM `bx_analytics_events` WHERE `Key_name` = 'object'");
        $this->assertSame(['type', 'name', 'object_id'], array_column($aKey, 'Column_name'));
        $aPlan = $oDb->getRow("EXPLAIN SELECT `id` FROM `bx_analytics_events` WHERE `type` = 'una' AND `name` = 'profile_add' AND `object_id` = :profile", ['profile' => $iProfileId]);
        $this->assertContains('object', explode(',', (string)$aPlan['possible_keys']));
    }

    public function testSignInTakesOverOnlyARecentGuestVisit()
    {
        $aHit = ['platform' => 'next-web', 'hits' => [['type' => 'pageview', 'url' => 'https://neo.test/']]];
        $fProfiles = function () {
            return array_map('intval', array_column($this->_sessions(), 'profile_id'));
        };

        // someone else behind the same address with the same browser, 10 minutes before
        $aServer = $this->_server('93.184.216.34');
        $this->_collect($aServer, $aHit, self::NOW);
        $this->_collect($aServer, $aHit, self::NOW + 600, ['profile_id' => 987654321]);
        $this->assertSame([0, 987654321], $fProfiles(), 'a member doesn\'t take over an older guest visit');
        $aGuestEvents = BxDolDb::getInstance()->getAll("SELECT `visitor`, `profile_id` FROM `bx_analytics_events` WHERE `session_id` = :id", ['id' => $this->_sessions()[0]['id']]);
        $this->assertSame([[$this->_sessions()[0]['visitor'], 0]], array_map(function ($a) { return [$a['visitor'], (int)$a['profile_id']]; }, $aGuestEvents), 'nor its events');

        // the member's own visit comes first, while the guest's goes on
        $this->_collect($aServer, $aHit, self::NOW + 700);
        $this->_collect($aServer, $aHit, self::NOW + 720, ['profile_id' => 987654321]);
        $this->assertSame([0, 987654321], $fProfiles());
        $this->assertSame([2, 2], array_map('intval', array_column($this->_sessions(), 'pageviews')));

        // a guest visit active right before is the member's: they signed in during it
        $this->_collect($this->_server('93.184.216.35'), $aHit, self::NOW + 1000);
        $this->_collect($this->_server('93.184.216.35'), $aHit, self::NOW + 1060, ['profile_id' => 987654322]);
        $this->assertSame([0, 987654321, 987654322], $fProfiles());

        // a visitor id kept by the device is the device's own, however long ago
        $this->_setOption('bx_analytics_identity', 'persistent');
        $aDevice = $aHit + ['vid' => 'phpunit-device-0001'];
        $this->_collect($this->_server('93.184.216.36'), $aDevice, self::NOW + 2000);
        $this->_collect($this->_server('93.184.216.36'), $aDevice, self::NOW + 2900, ['profile_id' => 987654323]);
        $this->assertSame([0, 987654321, 987654322, 987654323], $fProfiles());
    }

    public function testSignInActionTakesOverTheGuestVisit()
    {
        $iProfileId = 987654321;
        $aServer = $this->_server('93.184.216.34');
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/login']]], self::NOW);

        // the sign-in request records the action before the member's first page
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer + ['REQUEST_METHOD' => 'POST']), self::NOW + 10);
        $this->assertTrue($oCollector->collectAction('login', 'account', 4242, $iProfileId, ['platform' => 'core-web']));

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions);
        $this->assertSame($iProfileId, (int)$aSessions[0]['profile_id']);
        $this->assertSame(1, (int)$aSessions[0]['events']);

        $aEvents = BxDolDb::getInstance()->getAll("SELECT `session_id`, `visitor`, `profile_id` FROM `bx_analytics_events` WHERE `ts` < :to ORDER BY `id`", ['to' => self::NOW + 86400]);
        $this->assertCount(2, $aEvents);
        foreach ($aEvents as $a)
            $this->assertSame([(int)$aSessions[0]['id'], $aSessions[0]['visitor'], $iProfileId], [(int)$a['session_id'], $a['visitor'], (int)$a['profile_id']]);
    }

    public function testPersistentSiteActionsJoinTheDeviceVisit()
    {
        $this->_setOption('bx_analytics_identity', 'persistent');
        $iProfileId = 987654321;
        $sVid = 'phpunit-device-0002';
        $aHit = ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]];
        $oDb = BxDolDb::getInstance();

        $this->_collect($this->_server('93.184.216.40'), $aHit + ['vid' => $sVid], self::NOW);
        // another guest behind the same address with the same browser, and no visitor id
        $this->_collect($this->_server('93.184.216.40'), $aHit, self::NOW + 1);
        $aSessions = $this->_sessions();
        $this->assertCount(2, $aSessions);
        $iDevice = (int)$aSessions[0]['id'];

        // the site's own requests carry the id in the classic tracker's cookie; signing in
        // comes later than a guest visit is taken over by address and browser
        $aServer = $this->_server('93.184.216.40', ['REQUEST_METHOD' => 'POST', 'HTTP_COOKIE' => 'bx_analytics_vid=' . $sVid]);
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW + 10);
        $this->assertTrue($oCollector->collectAction('signup', 'account', 1, 0, ['platform' => 'core-web']));
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW + 300);
        $this->assertTrue($oCollector->collectAction('login', 'account', 1, $iProfileId, ['platform' => 'core-web']));

        // without the cookie, from elsewhere: the device's visit isn't found
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($this->_server('93.184.216.41', ['REQUEST_METHOD' => 'POST'])), self::NOW + 20);
        $this->assertTrue($oCollector->collectAction('vote', 'bx_posts', 5, 0, ['platform' => 'core-web']));

        $aEvents = $oDb->getPairs("SELECT `name`, `session_id` FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to ORDER BY `ts`", 'name', 'session_id', ['to' => self::NOW + 86400]);
        $this->assertSame(['signup' => $iDevice, 'vote' => 0, 'login' => $iDevice], array_map('intval', $aEvents));

        $aSessions = $this->_sessions();
        $this->assertSame([2, 0], array_map('intval', array_column($aSessions, 'events')), 'not the other guest\'s visit');
        $this->assertSame([$iProfileId, 0], array_map('intval', array_column($aSessions, 'profile_id')), 'signing in on the device takes its visit over');

        $aFunnel = $this->_oModule->_oDb->getFunnelCounts($this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'])->get(), [['type' => 'page', 'pattern' => '/'], ['type' => 'event', 'pattern' => 'signup']]);
        $this->assertSame([2, 1], $aFunnel);
    }

    public function testSecretsAreNotStored()
    {
        $aServer = $this->_server('81.2.69.142');
        $aUrls = [
            'http://una.test/page.php?i=forgot-password&key=abcDEF1234567890xyz',
            'http://una.test/page.php?i=confirm-email&code=0123456789abcdef',
            'http://una.test/page.php?i=unsubscribe-notifications&id=42&code=5f4dcc3b5aa765d61d8327deb882cf99',
            'http://una.test/page/oauth-callback?code=4%2F0AX4XfWh&state=xyz&access_token=ya29.secret',
            'http://una.test/page/invite?Email=jane%40example.com&api_key=k1&_hsenc=p2ANqtz',
            'http://una.test/create-account?icode=Ab3kP9xQ&lang=en',
            'http://una.test/page.php?i=pricing&promocode=SPRING26&apikey=k2&user_sid=9',
            'http://una.test/page/search?q=jane%40example.com',
        ];
        foreach ($aUrls as $i => $sUrl)
            $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => $sUrl]]], self::NOW + $i * 10);

        $aPaths = BxDolDb::getInstance()->getColumn("SELECT `path` FROM `bx_analytics_events` WHERE `ts` < :to ORDER BY `id`", ['to' => self::NOW + 86400]);
        $this->assertSame([
            '/page.php?i=forgot-password',
            '/page.php?i=confirm-email',
            '/page.php?i=unsubscribe-notifications&id=42',
            '/page/oauth-callback?state=xyz',
            '/page/invite',
            '/create-account?lang=en',
            '/page.php?i=pricing',
            '/page/search?q=<redacted>',
        ], $aPaths, 'keys, codes, tokens and addresses are dropped; what is left is redacted');

        $aSession = $this->_sessions()[0];
        $this->assertSame(['/page.php?i=forgot-password', '/page/search?q=<redacted>'], [$aSession['entry_path'], $aSession['exit_path']]);

        // link previews and mail scanners fetch these links too
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($this->_server('66.249.66.1')), self::NOW);
        $this->assertTrue($oCollector->collectBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '/page.php?i=forgot-password&key=abcDEF1234567890xyz'));
        $this->assertSame(['/page.php?i=forgot-password'], BxDolDb::getInstance()->getColumn("SELECT `path` FROM `bx_analytics_bot_pages` WHERE `day` < '2002-01-01'"));
    }

    public function testLocationFromTheChosenEdge()
    {
        // behind Vercel, a visitor sends Cloudflare's country header too
        $aHeaders = ['HTTP_CF_IPCOUNTRY' => 'KP', 'HTTP_X_VERCEL_IP_COUNTRY' => 'DE', 'HTTP_X_VERCEL_IP_CITY' => 'Berlin'];
        $aHit = ['platform' => 'next-web', 'hits' => [['type' => 'pageview', 'url' => 'https://neo.test/']]];

        foreach (['vercel', 'headers', 'none'] as $i => $sSource) {
            $this->_setOption('bx_analytics_geo_source', $sSource);
            $this->_collect($this->_server('81.2.69.' . (150 + $i), $aHeaders), $aHit, self::NOW + $i * 10);
        }

        $aSessions = $this->_sessions();
        $this->assertSame([['DE', 'Berlin'], ['KP', 'Berlin'], ['', '']], array_map(function ($a) { return [$a['country'], $a['city']]; }, $aSessions));
    }

    public function testSiteActionsFollowTheVisitorsChoice()
    {
        $fAction = function ($aExtra = [], $sUserAgent = self::UA_SAFARI, $iProfileId = 987654321) {
            $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($this->_server('81.2.69.142', ['REQUEST_METHOD' => 'POST'] + $aExtra, $sUserAgent)), self::NOW);
            return $oCollector->collectAction('login', 'account', 1, $iProfileId, ['platform' => 'core-web']);
        };

        $this->assertFalse($fAction(['HTTP_DNT' => '1']), 'Do Not Track');
        $this->assertFalse($fAction(['HTTP_SEC_GPC' => '1']), 'Global Privacy Control');
        $this->assertFalse($fAction([], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), 'a bot');
        $this->_setOption('bx_analytics_exclude_ips', '81.2.69.0/24');
        $this->assertFalse($fAction(), 'an excluded address');
        $this->_setOption('bx_analytics_exclude_ips', '');

        $this->assertTrue($fAction());

        // a cron job has no visitor request: its headers don't apply
        $oCron = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest([]), self::NOW);
        $this->assertTrue($oCron->collectAction('renewal', 'account', 1, 987654321));

        // a guest's action, when guests aren't tracked
        $this->_setOption('bx_analytics_exclude_levels', (string)MEMBERSHIP_ID_NON_MEMBER);
        $this->assertFalse($fAction([], self::UA_SAFARI, 0));

        $this->assertSame(2, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to", ['to' => self::NOW + 86400]));
    }

    public function testLargeCollectBodiesAreNotRead()
    {
        $iMax = $this->_oModule->_oConfig->CNF['MAX_COLLECT_BYTES'];
        $sPath = '/phpunit-collect-size';
        $fPayload = function ($iTitle) use ($sPath) {
            return json_encode(['platform' => 'api', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test' . $sPath, 'title' => str_repeat('a', $iTitle)]]]);
        };

        $this->assertTrue($this->_oModule->isCollectBodyAllowed($fPayload(100)));
        $this->assertFalse($this->_oModule->isCollectBodyAllowed($fPayload($iMax)));

        // the service stores now, with the request's own address: the rows are deleted after
        $oDb = BxDolDb::getInstance();
        try {
            $this->assertSame(['stored' => 0], $this->_oModule->serviceCollect($fPayload($iMax)), 'too large: refused before it is decoded');
            $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `path` = :path", ['path' => $sPath]));
            $this->assertSame(['stored' => 1], $this->_oModule->serviceCollect($fPayload(100)), 'the same hit, small enough');
        }
        finally {
            $oDb->query("DELETE FROM `bx_analytics_sessions` WHERE `entry_path` = :path AND `started` > :since", ['path' => $sPath, 'since' => time() - 3600]);
            $oDb->query("DELETE FROM `bx_analytics_events` WHERE `path` = :path AND `ts` > :since", ['path' => $sPath, 'since' => time() - 3600]);
        }
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
        $this->assertSame('/', $aJourneys['jfrom'], 'the top entry page by default');
        $this->assertSame(3, $aJourneys['from_sessions']);
        $this->assertSame([['page' => '/a', 'sessions' => 2, 'share' => 66.7], ['page' => '/d', 'sessions' => 1, 'share' => 33.3]], $aJourneys['next']);

        $aVia = $oReports->getJourneys($oFilter, ['via' => '/a']);
        $this->assertEqualsCanonicalizing(['/b', '/c'], array_column($aVia['after'], 'page'), 'a page reloaded in place counts once');

        // the start page has its own param, so it doesn't break a custom date range
        $aRequest = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09', 'jfrom' => '/a'];
        $oRequestFilter = $this->_filter($aRequest);
        $this->assertSame($oFilter->get()['from'], $oRequestFilter->get()['from'], 'jfrom keeps the custom range');
        $this->assertSame($oFilter->get()['to'], $oRequestFilter->get()['to']);
        $aFromA = $oReports->getJourneys($oRequestFilter, $aRequest);
        $this->assertSame('/a', $aFromA['jfrom']);
        $this->assertSame(2, $aFromA['from_sessions']);

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

        // a purchase by webhook, outside any visit (session_id 0), is no visit that converted
        $oWebhook = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 500);
        $this->assertTrue($oWebhook->collectAction('buy', '', 0, 0, ['type' => 'event', 'platform' => 'core', 'request' => false]));
        $this->_oModule->cleanReportCache();
        $aGoals = array_column($oReports->getGoals($oFilter)['goals'], null, 'id');
        $this->assertSame(2, $aGoals[$iBuy]['conversions'], 'an action outside a visit adds no visit');
        $this->assertEquals(66.67, $aGoals[$iBuy]['rate']);
        $aBuyTotals = $oDb->getGoalTotals($this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09', 'platform' => 'core'])->get(), ['type' => 'event', 'pattern' => 'buy']);
        $this->assertSame([0, 1], [(int)$aBuyTotals['sessions'], (int)$aBuyTotals['visitors']], 'but its visitor reached the goal');

        // goals are capped: the report counts each one in both periods
        $iMax = $this->_oModule->_oConfig->CNF['MAX_GOALS'];
        $this->assertSame($oDb->getGoalsCount() >= $iMax, $this->_oModule->isGoalLimitReached());
        for ($i = $oDb->getGoalsCount(); $i < $iMax + 1; $i++)
            $this->_aGoals[] = $oDb->saveGoal(0, ['name' => 'Test 2001 goal ' . $i, 'type' => 'page', 'pattern' => '/goal-' . $i]);
        $this->assertTrue($this->_oModule->isGoalLimitReached());
        $this->assertCount($iMax, $oDb->getGoals($iMax));
        $this->assertCount($iMax, $oReports->getGoals($oFilter)['goals']);

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

    public function testFunnelStepsFollowTheEventOrder()
    {
        $oDb = $this->_oModule->_oDb;
        $fPage = function ($sPath) { return ['type' => 'pageview', 'url' => 'http://una.test' . $sPath]; };

        // /pricing before / in the same second; one /shop page; two /shop pages in one second
        $this->_collect($this->_server('93.184.216.1'), ['platform' => 'core-web', 'hits' => [$fPage('/pricing'), $fPage('/')]], self::NOW);
        $this->_collect($this->_server('93.184.216.2'), ['platform' => 'core-web', 'hits' => [$fPage('/shop/1')]], self::NOW);
        $this->_collect($this->_server('93.184.216.3'), ['platform' => 'core-web', 'hits' => [$fPage('/shop/2'), $fPage('/shop/3')]], self::NOW);
        $this->_collect($this->_server('93.184.216.4'), ['platform' => 'core-web', 'hits' => [['type' => 'event', 'url' => 'http://una.test/', 'name' => 'buy']]], self::NOW);

        $aFilter = $this->_filter(['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'])->get();
        $this->assertSame([1, 0], $oDb->getFunnelCounts($aFilter, [['type' => 'page', 'pattern' => '/'], ['type' => 'page', 'pattern' => '/pricing']]), 'a step recorded before the one before it in the same second');
        $this->assertSame([1, 1], $oDb->getFunnelCounts($aFilter, [['type' => 'page', 'pattern' => '/pricing'], ['type' => 'page', 'pattern' => '/']]), 'steps in the same second in order');
        $this->assertSame([2, 1], $oDb->getFunnelCounts($aFilter, [['type' => 'page', 'pattern' => '/shop/*'], ['type' => 'page', 'pattern' => '/shop/*']]), 'one view counts for one step');
        $this->assertSame([1, 0], $oDb->getFunnelCounts($aFilter, [['type' => 'event', 'pattern' => 'buy'], ['type' => 'event', 'pattern' => 'buy']]));
    }

    public function testConcurrentHitsOfAVisitAllCount()
    {
        $aServer = $this->_server('93.184.216.20');
        $fPage = function ($sPath) { return ['type' => 'pageview', 'url' => 'http://una.test' . $sPath]; };

        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$fPage('/a')]], self::NOW);
        $aStale = $this->_sessions()[0];
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [$fPage('/b')]], self::NOW + 30);

        // requests that read the visit before /b was stored and are written after it
        $fStale = function ($iNow) use ($aServer, $aStale) {
            $oCollector = new class($this->_oModule, new BxAnalyticsRequest($aServer), $iNow) extends BxAnalyticsCollector {
                public $aStale = [];
                protected function _findSession($aVisitor, $sPlatform, $iSince, $iUntil = 0, $iAt = 0)
                {
                    return $this->aStale;
                }
                protected function _getRequestVisit($sPlatform, $iLinkedProfileId, $bApiKey)
                {
                    return [parent::_getRequestVisit($sPlatform, $iLinkedProfileId, $bApiKey)[0], $this->aStale];
                }
            };
            $oCollector->aStale = $aStale;
            return $oCollector;
        };

        $this->assertSame(1, $fStale(self::NOW + 20)->collect(['platform' => 'core-web', 'hits' => [['type' => 'leave', 'url' => 'http://una.test/a', 'engaged' => 1000]]], ['platform' => 'api']));
        $a = $this->_sessions()[0];
        $this->assertSame([2, 0, '/b', self::NOW + 30, 30], [(int)$a['pageviews'], (int)$a['bounce'], $a['exit_path'], (int)$a['last_seen'], (int)$a['duration']], 'a late leave keeps the pageview, the exit page and the time');

        $this->assertSame(1, $fStale(self::NOW + 10)->collect(['platform' => 'core-web', 'hits' => [$fPage('/c')]], ['platform' => 'api']));
        $a = $this->_sessions()[0];
        $this->assertSame([3, '/b', self::NOW + 30], [(int)$a['pageviews'], $a['exit_path'], (int)$a['last_seen']], 'an older pageview written last is not the exit page');

        $this->assertTrue($fStale(self::NOW + 25)->collectAction('content_add', 'bx_posts', 1, 0, ['platform' => 'core-web']));
        $a = $this->_sessions()[0];
        $this->assertCount(1, $this->_sessions());
        $this->assertSame([3, 1, self::NOW + 30], [(int)$a['pageviews'], (int)$a['events'], (int)$a['last_seen']], 'a site action adds to the counters');
    }

    public function testConcurrentFirstHitsMakeOneVisit()
    {
        $aServer = $this->_server('93.184.216.21');
        $aEvent = ['platform' => 'core-web', 'hits' => [['type' => 'event', 'url' => 'http://una.test/', 'name' => 'cta_click']]];

        // the event's request starts the visit between this request's lookup and its insert
        $oCollector = new class($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW) extends BxAnalyticsCollector {
            public $fConcurrent;
            public $sLock;
            protected function _findSession($aVisitor, $sPlatform, $iSince, $iUntil = 0, $iAt = 0)
            {
                if($this->fConcurrent) {
                    $fConcurrent = $this->fConcurrent;
                    $this->fConcurrent = null;
                    $fConcurrent();
                    return [];
                }
                return parent::_findSession($aVisitor, $sPlatform, $iSince, $iUntil, $iAt);
            }
            protected function _getVisitLockName($sPlatform, $aVisitor)
            {
                return $this->sLock = parent::_getVisitLockName($sPlatform, $aVisitor);
            }
        };
        $oCollector->fConcurrent = function () use ($aServer, $aEvent) {
            $this->_collect($aServer, $aEvent, self::NOW);
        };

        $this->assertSame(1, $oCollector->collect(['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]], ['platform' => 'api']));
        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions, 'one visit');
        $this->assertSame([1, 1, 0], [(int)$aSessions[0]['pageviews'], (int)$aSessions[0]['events'], (int)$aSessions[0]['bounce']]);

        $this->assertLessThanOrEqual(64, strlen($oCollector->sLock));
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT IS_FREE_LOCK(:name)", ['name' => $oCollector->sLock]), 'the lock is released');

        // a visit refused by the rate limit releases the lock too
        $this->_setOption('bx_analytics_limit_visits', '1');
        $oCollector->sLock = null;
        $this->assertSame(0, $oCollector->collect(['platform' => 'next-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]], ['platform' => 'api']));
        $this->assertTrue($oCollector->isLimited());
        $this->assertNotNull($oCollector->sLock);
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT IS_FREE_LOCK(:name)", ['name' => $oCollector->sLock]));

        // a request without a hit that starts a visit takes no lock
        $oCollector->sLock = null;
        $this->assertSame(0, $oCollector->collect(['platform' => 'next-web', 'hits' => [['type' => 'leave', 'url' => 'http://una.test/', 'engaged' => 1000]]], ['platform' => 'api']));
        $this->assertNull($oCollector->sLock);
    }

    public function testHitsPerMinuteLimit()
    {
        $this->_setOption('bx_analytics_limit_hits', '5');
        $this->_setOption('bx_analytics_limit_visits', '0');
        $aServer = $this->_server('81.2.69.142');
        $fPayload = function ($iHits, $sPage = 'a') {
            return ['platform' => 'core-web', 'hits' => array_fill(0, $iHits, ['type' => 'pageview', 'url' => 'http://una.test/' . $sPage])];
        };

        // NOW is 40 seconds into its minute: NOW + 19 is the same minute, NOW + 20 the next
        $this->assertSame(3, $this->_collect($aServer, $fPayload(3), self::NOW));
        $this->assertSame(2, $this->_collect($aServer, $fPayload(2), self::NOW + 10), 'up to the limit');

        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW + 19);
        $this->assertSame(0, $oCollector->collect($fPayload(1, 'over'), ['platform' => 'api']), 'over the limit');
        $this->assertTrue($oCollector->isLimited());
        $this->assertContains('rate_limited', $oCollector->check($fPayload(1), ['platform' => 'api'])['reasons'], 'the Setup check tells');

        $this->assertSame(1, $this->_collect($this->_server('93.184.216.34'), $fPayload(1), self::NOW + 19), 'another address has its own limit');

        // site actions and server events are not limited
        $this->assertTrue($oCollector->collectAction('signup', 'account', 1, 0, ['platform' => 'core-web']));

        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW + 20);
        $this->assertSame(1, $oCollector->collect($fPayload(1, 'next'), ['platform' => 'api']), 'a new minute counts anew');
        $this->assertFalse($oCollector->isLimited());

        $aPaths = BxDolDb::getInstance()->getColumn("SELECT `path` FROM `bx_analytics_events` WHERE `ts` < :to AND `type` = 'pageview'", ['to' => self::NOW + 86400]);
        $this->assertNotContains('/over', $aPaths);
        $this->assertContains('/next', $aPaths);
        $this->assertSame(6, (int)$this->_sessions()[0]['pageviews'], 'the dropped hit is not in the visit');

        // the counters keep no address
        $aRows = BxDolDb::getInstance()->getAll("SELECT * FROM `bx_analytics_limits` WHERE `bucket` < 1009843200 ORDER BY `bucket`, `hits`");
        $this->assertSame([[self::NOW - 40, 1], [self::NOW - 40, 6], [self::NOW + 20, 1]], array_map(function ($a) { return [(int)$a['bucket'], (int)$a['hits']]; }, $aRows), 'dropped hits count too');
        foreach ($aRows as $a)
            $this->assertSame(8, strlen($a['key']));
    }

    public function testVisitsPerHourLimit()
    {
        $this->_setOption('bx_analytics_limit_hits', '0');
        $this->_setOption('bx_analytics_limit_visits', '2');
        $this->_setOption('bx_analytics_track_errors', 'on');
        $aHit = ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/'], ['type' => 'error', 'url' => 'http://una.test/', 'kind' => 'js', 'message' => 'Test 2001 limited error', 'stack' => "Error: x\n    at f (/js/app.js:1:1)"]]];

        // a script that changes its user agent with every request
        $this->assertSame(2, $this->_collect($this->_server('81.2.69.142', [], self::UA_SAFARI . ' a'), $aHit, self::NOW));
        $this->assertSame(2, $this->_collect($this->_server('81.2.69.142', [], self::UA_SAFARI . ' b'), $aHit, self::NOW + 1));
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($this->_server('81.2.69.142', [], self::UA_SAFARI . ' c')), self::NOW + 2);
        $this->assertSame(0, $oCollector->collect($aHit, ['platform' => 'api']), 'a third visit in the hour');
        $this->assertTrue($oCollector->isLimited());
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_error_hits` WHERE `ts` < :to AND `session_id` = 0", ['to' => self::NOW + 86400]), 'its errors are dropped too');

        $this->assertSame(1, $this->_collect($this->_server('81.2.69.142', [], self::UA_SAFARI . ' a'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/b']]], self::NOW + 3), 'a running visit goes on');
        $this->assertCount(2, $this->_sessions());

        // NOW is 2800 seconds into its hour
        $this->assertSame(2, $this->_collect($this->_server('81.2.69.142', [], self::UA_SAFARI . ' c'), $aHit, self::NOW + 800), 'a new hour counts anew');
        $this->assertCount(3, $this->_sessions());
    }

    public function testLimitAddresses()
    {
        $this->_setOption('bx_analytics_limit_hits', '2');
        $aHit = ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]];

        // one IPv6 /64 network is one address
        $this->assertSame(1, $this->_collect($this->_server('2001:db8:1:2::1'), $aHit, self::NOW));
        $this->assertSame(1, $this->_collect($this->_server('2001:db8:1:2::ffff'), $aHit, self::NOW));
        $this->assertSame(0, $this->_collect($this->_server('2001:db8:1:2:abcd::5'), $aHit, self::NOW));
        $this->assertSame(1, $this->_collect($this->_server('2001:db8:1:3::1'), $aHit, self::NOW), 'another network');

        // an IPv4 address written as IPv6 is that address
        $this->assertSame(1, $this->_collect($this->_server('81.2.69.142'), $aHit, self::NOW));
        $this->assertSame(1, $this->_collect($this->_server('::ffff:81.2.69.142'), $aHit, self::NOW));
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142'), $aHit, self::NOW));

        // a bot that runs the tracker is limited too: no bot rows past the limit
        $sBot = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
        $this->_collect($this->_server('93.184.216.34', [], $sBot), $aHit, self::NOW);
        $this->_collect($this->_server('93.184.216.34', [], $sBot), $aHit, self::NOW);
        $this->_collect($this->_server('93.184.216.34', [], $sBot), $aHit, self::NOW);
        $this->assertSame(2, (int)BxDolDb::getInstance()->getOne("SELECT SUM(`hits`) FROM `bx_analytics_bots` WHERE `day` < '2002-01-01'"));

        $this->_setOption('bx_analytics_limit_hits', '0');
        $this->assertSame(1, $this->_collect($this->_server('81.2.69.142'), $aHit, self::NOW), 'no limit');
    }

    public function testLimitsArePruned()
    {
        $this->_setOption('bx_analytics_limit_hits', '100');
        $this->_setOption('bx_analytics_limit_visits', '100');
        $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]], self::NOW);

        $fCount = function () {
            return (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_analytics_limits` WHERE `bucket` < 1009843200");
        };
        $this->assertSame(2, $fCount(), 'a minute of hits and an hour of visits');

        $oDb = $this->_oModule->_oDb;
        $oDb->deleteLimitsBefore($this->_oModule->getPruningCutoffs(self::NOW + 3600)['deleteLimitsBefore'], 100);
        $this->assertSame(2, $fCount(), 'kept for 2 hours');

        // NOW is 40 seconds into its minute and 2800 seconds into its hour
        $oDb->deleteLimitsBefore($this->_oModule->getPruningCutoffs(self::NOW + 4401)['deleteLimitsBefore'], 100);
        $this->assertSame(1, $fCount(), 'the hour goes once it started over 2 hours ago, the later minute is kept');

        $oDb->deleteLimitsBefore($this->_oModule->getPruningCutoffs(self::NOW + 7200)['deleteLimitsBefore'], 100);
        $this->assertSame(0, $fCount());
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
        $oDb->query("DELETE FROM `bx_analytics_limits` WHERE `bucket` < 1009843200");
        $this->_oModule->cleanReportCache(); // reports of the test data cached by the run before
        $oDb->query("DELETE FROM `bx_analytics_error_hits` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_errors` WHERE `message` = 'Test 2001 limited error'");
        $oDb->query("DELETE FROM `bx_analytics_bots` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_bot_pages` WHERE `day` < '2002-01-01'");
        foreach ($this->_aGoals as $iId)
            $this->_oModule->_oDb->deleteGoal($iId);
        foreach ($this->_aFunnels as $iId)
            $this->_oModule->_oDb->deleteFunnel($iId);
        $this->_aGoals = $this->_aFunnels = [];
    }
}
