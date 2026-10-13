<?php

/**
 * Studio tools of Analytics: the API playground, Dashboards (pages with analytics blocks) and
 * Setup (tracker status per platform, the dry-run check of a browser). Only site
 * administrators reach them, and get_report never does. Test hits are dated in September
 * 2001, far from real traffic, and deleted afterwards.
 */
class AnalyticsToolsTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    protected $_oModule;
    protected $_aOptions = [];
    protected $_aMatrix = [];
    protected $_aPages = [];
    protected $_aServer;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getCollector(); // loads the collector classes
        $this->_oModule->getFilter([]);
        $this->_aServer = $_SERVER;

        $this->_cleanup();

        foreach (['bx_analytics_tracking' => 'on', 'bx_analytics_track_actions' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api,core', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => '', 'bx_analytics_trusted_proxies' => '', 'bx_analytics_geo_source' => 'headers'] as $sName => $sValue)
            $this->_setOption($sName, $sValue);

        $this->_becomeAdmin();
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            foreach ($this->_aPages as $sObject)
                $this->_deletePage($sObject);
            foreach ($this->_aOptions as $sName => $sValue)
                setParam($sName, $sValue);
            $this->_restoreMatrix();
        }
        $_SERVER = $this->_aServer;
        $GLOBALS['glForceCurrentProfileId'] = 0;

        parent::tearDown();
    }

    public function testToolsAreForAdminsOnly()
    {
        // never reports: get_report and the blocks don't know them
        foreach (['api', 'dashboards', 'setup'] as $sTool) {
            $this->assertFalse($this->_oModule->getReportData($sTool, []), $sTool);
            $this->assertSame(404, $this->_oModule->serviceGetReport($sTool)['code'], $sTool);
            $this->assertSame('', $this->_oModule->serviceGetBlockReport($sTool), $sTool);
            $this->assertNotSame('', $this->_oModule->getStudioSection($sTool), $sTool . ' for an admin');
        }

        // an action needs a POST with the form token
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_POST = ['csrf_token' => BxDolForm::getCsrfToken()];
        $this->assertFalse($this->_oModule->isAdminRequest());
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $this->assertTrue($this->_oModule->isAdminRequest());
        $_POST = ['csrf_token' => 'not-a-token'];
        $this->assertFalse($this->_oModule->isAdminRequest());

        // a guest
        $_POST = ['csrf_token' => BxDolForm::getCsrfToken()];
        $this->bxBecomeGuest();
        $this->assertFalse($this->_oModule->isAdminRequest());
        foreach (['api', 'dashboards', 'setup'] as $sTool)
            $this->assertSame('', $this->_oModule->getStudioSection($sTool), $sTool . ' for a guest');

        // a member whose level may use analytics and see people, but who isn't an admin
        $iProfile = $this->_becomeMember();
        $iLevel = (int)BxDolAcl::getInstance()->getMemberMembershipInfo($iProfile)['id'];
        $this->_grant($iLevel, 'use analytics', true);
        $this->_grant($iLevel, 'view analytics people', true);
        $this->assertTrue($this->_oModule->serviceIsAvaliable());
        $_POST = ['csrf_token' => BxDolForm::getCsrfToken()];
        $this->assertFalse($this->_oModule->isAdminRequest());
        foreach (['api', 'dashboards', 'setup'] as $sTool)
            $this->assertSame('', $this->_oModule->getStudioSection($sTool), $sTool . ' for a member');
    }

    public function testApiCatalogAndResponse()
    {
        $aCatalog = $this->_oModule->getApiCatalog();
        $this->assertSame(['range', 'from', 'to', 'tz', 'platform', 'bucket', 'f'], array_keys($aCatalog['common']));
        foreach (['sessions', 'users', 'revenue', 'query', 'top'] as $sReport)
            $this->assertArrayHasKey($sReport, $aCatalog['reports'], 'an admin sees ' . $sReport);
        foreach (['api', 'dashboards', 'setup'] as $sTool)
            $this->assertArrayNotHasKey($sTool, $aCatalog['reports']);

        // every report in the catalog takes every value of its enum parameters
        $aDay = ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'];
        foreach ($aCatalog['reports'] as $sReport => $aParams) {
            // with the defaults of the others (a top list needs its group)
            $aDefaults = [];
            foreach ($aParams as $sName => $aParam)
                if (isset($aParam['default']))
                    $aDefaults[$sName] = $aParam['default'];

            foreach ($aParams as $sName => $aParam) {
                // a tab of a top list or table: each one its group or table really has
                if ($aParam['type'] == 'enum_by') {
                    $this->assertArrayHasKey($aParam['by'], $aParams);
                    $this->assertSame($aParams[$aParam['by']]['values'], array_keys($aParam['values']), $sReport . ': a list of ' . $sName . ' per ' . $aParam['by']);
                    foreach ($aParam['values'] as $sBy => $aValues)
                        foreach ($aValues as $sValue)
                            $this->assertSame($sValue, $this->_oModule->getReportData($sReport, array_merge($aDay, [$aParam['by'] => $sBy, $sName => $sValue]))['tab'], $sReport . ' ' . $sBy . ' ' . $sName . '=' . $sValue);
                    continue;
                }

                if ($aParam['type'] != 'enum')
                    continue;
                foreach ($aParam['values'] as $sValue)
                    $this->assertIsArray($this->_oModule->getReportData($sReport, array_merge($aDay, $aDefaults, [$sName => $sValue])), $sReport . ' ' . $sName . '=' . $sValue);
            }
        }

        // the envelope of api.php
        $a = $this->_oModule->getApiResponse('top', '{"group": "platforms", "range": "7d"}');
        $this->assertSame([200, 'bx_analytics', 'get_report', 'top'], [$a['status'], $a['module'], $a['method'], $a['params'][0]]);
        $this->assertSame('platforms', $a['data']['group']);
        $this->assertEquals($this->_oModule->serviceGetReport('top', ['group' => 'platforms', 'range' => '7d']), $a['data']);
        $this->assertSame(200, $this->_oModule->getApiResponse('overview', '')['status'], 'no parameters');

        // only reports of the catalog, never a service or a method name
        foreach (['setup', 'getStudioApi', 'get_tracker_config', '../top', 'Top'] as $sReport)
            $this->assertSame(404, $this->_oModule->getApiResponse($sReport, '{}')['status'], $sReport);
        foreach (['[1, 2]', '{range: 7d', '"7d"', '42'] as $sParams)
            $this->assertSame(400, $this->_oModule->getApiResponse('top', $sParams)['status'], $sParams);

        // without "view analytics people" the reports with members are left out
        $iProfile = $this->_becomeMember();
        $iLevel = (int)BxDolAcl::getInstance()->getMemberMembershipInfo($iProfile)['id'];
        $this->_grant($iLevel, 'use analytics', true);
        $this->_grant($iLevel, 'view analytics people', false);
        $this->_grant($iLevel, 'view analytics revenue', false);
        $aCatalog = $this->_oModule->getApiCatalog();
        foreach (['sessions', 'users', 'revenue', 'subscriptions', 'sales', 'credits'] as $sReport) {
            $this->assertArrayNotHasKey($sReport, $aCatalog['reports'], $sReport);
            $this->assertSame(404, $this->_oModule->getApiResponse($sReport, '{}')['status'], $sReport);
        }
        $this->assertArrayHasKey('query', $aCatalog['reports']);
        $this->assertFalse($this->_oModule->getReportData('sessions', []));
    }

    public function testDashboards()
    {
        $aObjects = array_column($this->_oModule->getDashboards(), 'object');
        $this->assertContains('bx_analytics_page', $aObjects);
        $this->assertNotContains('sys_std_dashboard', $aObjects, 'Studio pages are left out');

        $this->assertFalse($this->_oModule->createDashboard(''));
        $this->assertFalse($this->_oModule->createDashboard('   '));
        $this->assertFalse($this->_oModule->createDashboard(str_repeat('a', 101)));

        $a = $this->_oModule->createDashboard('PHPUnit analytics');
        $this->assertIsArray($a);
        $this->_aPages[] = $a['object'];
        $b = $this->_oModule->createDashboard('PHPUnit analytics');
        $this->assertIsArray($b);
        $this->_aPages[] = $b['object'];
        $this->assertNotSame($a['uri'], $b['uri'], 'a unique uri');
        $this->assertNotSame($a['object'], $b['object']);
        $this->assertMatchesRegularExpression('/^bx_analytics_[a-z0-9_]+$/', $a['object']);
        $this->assertStringContainsString('builder_page.php?type=bx_analytics&page=' . $a['object'], $a['edit_url']);

        // not Latin: the object stays Latin for the language keys
        $c = $this->_oModule->createDashboard("\u{0410}\u{043d}\u{0430}\u{043b}\u{0438}\u{0442}\u{0438}\u{043a}\u{0430} \u{043f}\u{0440}\u{043e}\u{0434}\u{0430}\u{0436}");
        $this->assertIsArray($c);
        $this->_aPages[] = $c['object'];
        $this->assertMatchesRegularExpression('/^bx_analytics_[a-z0-9_]+$/', $c['object']);

        $oDb = BxDolDb::getInstance();
        $aPage = $oDb->getRow("SELECT * FROM `sys_objects_page` WHERE `object` = :object", ['object' => $a['object']]);
        $this->assertSame(['bx_analytics', 12, 1, 'page.php?i=' . $a['uri']], [$aPage['module'], (int)$aPage['layout_id'], (int)$aPage['deletable'], $aPage['url']]);
        $this->assertSame('PHPUnit analytics', _t($aPage['title']));

        // the analytics page's center and right bar, shown in NEO as their sources are
        $aSource = $oDb->getAll("SELECT `cell_id`, `content`, `active_api` FROM `sys_pages_blocks` WHERE `object` = 'bx_analytics_page' AND `active` = 1 AND `cell_id` IN (2, 3) ORDER BY `cell_id`, `order`");
        $aBlocks = $oDb->getAll("SELECT `cell_id`, `content`, `active_api`, `copyable`, `module` FROM `sys_pages_blocks` WHERE `object` = :object ORDER BY `cell_id`, `order`", ['object' => $a['object']]);
        $this->assertNotEmpty($aBlocks);
        $this->assertSame($aSource, array_map(function ($aBlock) { return ['cell_id' => $aBlock['cell_id'], 'content' => $aBlock['content'], 'active_api' => $aBlock['active_api']]; }, $aBlocks));
        foreach ($aBlocks as $aBlock)
            $this->assertSame([0, 'bx_analytics'], [(int)$aBlock['copyable'], $aBlock['module']]);

        // listed, with its blocks
        $aListed = array_column($this->_oModule->getDashboards(), null, 'object');
        $this->assertSame(count($aBlocks), $aListed[$a['object']]['blocks']);
        $this->assertSame(count(array_filter(array_column($aBlocks, 'active_api'))), $aListed[$a['object']]['api_blocks']);

        // a block NEO has no element for, added to the page in the builder, stays out of NEO
        $oDb->query("INSERT INTO `sys_pages_blocks` (`object`, `cell_id`, `module`, `title`, `designbox_id`, `visible_for_levels`, `type`, `content`, `deletable`, `copyable`, `active`, `active_api`, `order`) VALUES ('bx_analytics_page', 2, 'bx_analytics', 'PHPUnit realtime', 11, 2147483647, 'service', :content, 1, 1, 1, 0, 999)", ['content' => 'a:2:{s:6:"module";s:12:"bx_analytics";s:6:"method";s:14:"get_block_test";}']);
        $iAdded = (int)$oDb->lastId();
        $e = $this->_oModule->createDashboard('PHPUnit analytics realtime');
        $oDb->query("DELETE FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => $iAdded]);
        $this->assertIsArray($e);
        $this->_aPages[] = $e['object'];
        $this->assertSame(0, (int)$oDb->getOne("SELECT `active_api` FROM `sys_pages_blocks` WHERE `object` = :object AND `title` = 'PHPUnit realtime'", ['object' => $e['object']]));
        $this->assertSame('PHPUnit analytics', $aListed[$a['object']]['title']);

        // disabling the module removes the page rows but keeps the title keys: the same
        // title again gets the same object, and the stale keys don't block it
        $oDb->query("DELETE FROM `sys_pages_blocks` WHERE `object` = :object", ['object' => $c['object']]);
        $oDb->query("DELETE FROM `sys_objects_page` WHERE `object` = :object", ['object' => $c['object']]);
        foreach (['sys_pages_objects_data', 'sys_pages_uri_object_map', 'sys_pages_urirewrite_object_map'] as $sCache)
            $oDb->cleanCache($sCache);
        $d = $this->_oModule->createDashboard("\u{0410}\u{043d}\u{0430}\u{043b}\u{0438}\u{0442}\u{0438}\u{043a}\u{0430} \u{043f}\u{0440}\u{043e}\u{0434}\u{0430}\u{0436}");
        $this->assertIsArray($d);
        $this->_aPages[] = $d['object'];
        $this->assertSame($c['object'], $d['object']);
    }

    public function testPlatformActivity()
    {
        $iNow = self::NOW + 600;

        // the classic site and the iOS app now, an older iOS version, the server two days ago
        $this->_collect($this->_server('81.2.69.142'), ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/a'], ['type' => 'pageview', 'url' => 'http://una.test/b']]], self::NOW);
        $this->_collect($this->_server('81.2.69.143', [], 'NEO/1 CFNetwork/1.0 Darwin/24.0.0'), ['platform' => 'rn-ios', 'app' => 'com.neo.so', 'app_version' => '1.10.0', 'hits' => [['type' => 'pageview', 'url' => '/feed']]], self::NOW);
        $this->_collect($this->_server('81.2.69.144', [], 'NEO/1 CFNetwork/1.0 Darwin/24.0.0'), ['platform' => 'rn-ios', 'app' => 'com.neo.so', 'app_version' => '1.9.0', 'hits' => [['type' => 'pageview', 'url' => '/feed']]], self::NOW - 3 * 86400);
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest(['REQUEST_METHOD' => '']), self::NOW - 2 * 86400);
        $this->assertTrue($oCollector->collectAction('phpunit_tools', '', 0, 0, ['type' => 'event', 'platform' => 'core']));
        // an Android action outside any visit three days ago
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest(['REQUEST_METHOD' => '']), self::NOW - 3 * 86400);
        $this->assertTrue($oCollector->collectAction('phpunit_tools', '', 0, 0, ['type' => 'event', 'platform' => 'rn-android']));

        $a = $this->_oModule->getPlatformActivity($iNow, false);
        $this->assertSame(['core-web', 'next-web', 'rn-ios', 'rn-android', 'api', 'core'], array_keys($a));
        $this->assertSame(['last' => self::NOW, 'hits' => 2, 'visitors' => 1, 'sessions' => 1, 'app_version' => ''], $a['core-web']);
        $this->assertSame(['last' => self::NOW, 'hits' => 1, 'visitors' => 1, 'sessions' => 2, 'app_version' => '1.10.0'], $a['rn-ios'], 'versions compare as versions');
        $this->assertSame(['last' => self::NOW - 2 * 86400, 'hits' => 0, 'visitors' => 0, 'sessions' => 0, 'app_version' => ''], $a['core'], 'the server keeps no visits');
        $this->assertSame(self::NOW - 3 * 86400, $a['rn-android']['last'], 'an action outside a visit is a hit too');
        $this->assertSame(0, $a['api']['last']);
        $this->assertSame(self::NOW - 2 * 86400, $this->_oModule->getPlatformActivity(self::NOW + 9 * 86400, false)['core']['last'], 'the latest hit, however old');

        $aStatus = $this->_oModule->getSetupStatus($iNow, false);
        $this->assertSame(['core-web' => 'receiving', 'next-web' => 'nodata', 'rn-ios' => 'receiving', 'rn-android' => 'quiet', 'api' => 'nodata', 'core' => 'quiet'], array_column($aStatus, 'status', 'platform'));
        $this->assertSame('quiet', $this->_oModule->getSetupStatus(self::NOW + 2 * 3600, false)['core-web']['status']);
        $this->assertSame('nodata', $this->_oModule->getSetupStatus(self::NOW + 8 * 86400, false)['rn-ios']['status']);

        $this->_setOption('bx_analytics_platforms', 'core-web,next-web,rn-android');
        $aStatus = $this->_oModule->getSetupStatus($iNow, false);
        $this->assertSame(['receiving', 'off', false], [$aStatus['core-web']['status'], $aStatus['rn-ios']['status'], $aStatus['rn-ios']['enabled']]);
        $this->_setOption('bx_analytics_tracking', '');
        $this->assertSame(['off'], array_values(array_unique(array_column($this->_oModule->getSetupStatus($iNow, false), 'status'))));
    }

    public function testCheckReasons()
    {
        $iEvents = $this->_count('bx_analytics_events');
        $iSessions = $this->_count('bx_analytics_sessions');
        $iBots = $this->_count('bx_analytics_bots');
        $this->_setOption('bx_analytics_track_bots', 'on');
        $aPayload = ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => BX_DOL_URL_ROOT]]];
        $aContext = ['platform' => 'core-web', 'same_origin' => true];
        $fCheck = function ($aServer, $aContextExtra = []) use ($aPayload, $aContext) {
            $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW);
            return $oCollector->check($aPayload, $aContextExtra + $aContext);
        };

        $a = $fCheck($this->_server('81.2.69.142', ['HTTP_CF_IPCOUNTRY' => 'gb']));
        $this->assertSame(['ok'], $a['reasons']);
        $this->assertSame(['81.2.69.142', '81.2.69.142', 'HTTP_CF_IPCOUNTRY', 'GB', 'cookieless', 'core-web'], [$a['ip'], $a['remote_addr'], $a['country_header'], $a['country'], $a['identity'], $a['platform']]);

        // a trusted proxy in front: the address from its header, next to the proxy's own
        $this->_setOption('bx_analytics_trusted_proxies', '203.0.113.7');
        $a = $fCheck($this->_server('203.0.113.7', ['HTTP_X_FORWARDED_FOR' => '81.2.69.150']));
        $this->assertSame(['81.2.69.150', '203.0.113.7', ''], [$a['ip'], $a['remote_addr'], $a['country_header']]);

        $this->assertSame(['dnt'], $fCheck($this->_server('81.2.69.142', ['HTTP_DNT' => '1']))['reasons']);
        $this->assertSame(['cross_site'], $fCheck($this->_server('81.2.69.142', ['HTTP_SEC_FETCH_SITE' => 'cross-site']))['reasons']);
        $this->assertSame(['bot'], $fCheck($this->_server('81.2.69.142', [], 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'))['reasons']);

        $this->_setOption('bx_analytics_exclude_ips', '81.2.69.0/24');
        $this->assertSame(['excluded_ip'], $fCheck($this->_server('81.2.69.142'))['reasons']);
        // every reason at once, not only the first
        $this->assertSame(['dnt', 'excluded_ip'], $fCheck($this->_server('81.2.69.142', ['HTTP_DNT' => '1']))['reasons']);
        $this->_setOption('bx_analytics_exclude_ips', '');

        $this->_setOption('bx_analytics_exclude_paths', '/');
        $this->assertSame(['excluded_path'], $fCheck($this->_server('81.2.69.142'))['reasons']);
        $this->_setOption('bx_analytics_exclude_paths', '');

        $this->_setOption('bx_analytics_exclude_levels', (string)MEMBERSHIP_ID_NON_MEMBER);
        $this->assertSame(['excluded_level'], $fCheck($this->_server('81.2.69.142'))['reasons']);
        $this->_setOption('bx_analytics_exclude_levels', '');

        $this->_setOption('bx_analytics_link_members', '');
        $a = $fCheck($this->_server('81.2.69.142'), ['profile_id' => 987654321]);
        $this->assertSame([['ok'], ['link_members_off']], [$a['reasons'], $a['notes']]);

        $this->_setOption('bx_analytics_platforms', 'next-web');
        $this->assertSame(['platform_off'], $fCheck($this->_server('81.2.69.142'))['reasons']);
        $this->_setOption('bx_analytics_tracking', '');
        $this->assertSame(['tracking_off', 'platform_off'], $fCheck($this->_server('81.2.69.142'))['reasons']);

        // a dry run: nothing stored, bots not counted either
        $this->assertSame($iEvents, $this->_count('bx_analytics_events'));
        $this->assertSame($iSessions, $this->_count('bx_analytics_sessions'));
        $this->assertSame($iBots, $this->_count('bx_analytics_bots'), 'the Googlebot check above');

        // the same guards in collect(): a bot is counted with the bots, not as a visit
        $this->_setOption('bx_analytics_tracking', 'on');
        $this->_setOption('bx_analytics_platforms', 'core-web');
        $this->assertSame(0, $this->_collect($this->_server('81.2.69.142', ['HTTP_DNT' => '1']), $aPayload, self::NOW, $aContext));
        $this->assertSame(1, $this->_collect($this->_server('81.2.69.142'), $aPayload, self::NOW, $aContext));
    }

    public function testStudioSectionsRender()
    {
        foreach (['api', 'dashboards', 'setup'] as $sTool) {
            $s = $this->_oModule->getStudioSection($sTool);
            $this->assertStringContainsString('bx-analytics-' . $sTool, $s);
            $this->assertDoesNotMatchRegularExpression('/__[a-z][a-z0-9_]*__/', $s, $sTool . ': every placeholder replaced');
            $this->assertStringNotContainsString('_bx_analytics_', $s, $sTool . ': every language key exists');
        }
    }

    protected function _becomeAdmin()
    {
        $GLOBALS['glForceCurrentProfileId'] = 0;
        $this->bxSetLoggedFlags(BX_DOL_ROLE_MEMBER | BX_DOL_ROLE_ADMIN);
    }

    protected function _becomeMember()
    {
        $iProfile = (int)BxDolDb::getInstance()->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON `a`.`id` = `p`.`account_id` WHERE (`a`.`role` & :admin) = 0 AND `p`.`type` <> 'system' AND `p`.`status` = 'active' ORDER BY `p`.`id` LIMIT 1", ['admin' => BX_DOL_ROLE_ADMIN]);
        if (!$iProfile)
            $this->markTestSkipped('no member profile to sign in as');

        $GLOBALS['glForceCurrentProfileId'] = $iProfile;
        $this->bxSetLoggedFlags(BX_DOL_ROLE_MEMBER);
        $this->assertFalse(isAdmin());

        return $iProfile;
    }

    protected function _collect($aServer, $aPayload, $iNow, $aContext = [])
    {
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), $iNow);

        return $oCollector->collect($aPayload, $aContext + ['platform' => 'api']);
    }

    protected function _server($sIp, $aExtra = [], $sUserAgent = self::UA_SAFARI)
    {
        return array_merge(['REMOTE_ADDR' => $sIp, 'HTTP_USER_AGENT' => $sUserAgent], $aExtra);
    }

    /**
     * Rows of a table in the test window only: the dev site's own traffic and the hourly
     * pruning change the rest at any time. Bots count their hits.
     */
    protected function _count($sTable)
    {
        $oDb = BxDolDb::getInstance();
        switch ($sTable) {
            case 'bx_analytics_events':
                return (int)$oDb->getOne("SELECT COUNT(*) FROM `bx_analytics_events` WHERE `ts` < :to", ['to' => self::NOW + 30 * 86400]);
            case 'bx_analytics_sessions':
                return (int)$oDb->getOne("SELECT COUNT(*) FROM `bx_analytics_sessions` WHERE `started` < :to", ['to' => self::NOW + 30 * 86400]);
            case 'bx_analytics_bots':
                return (int)$oDb->getOne("SELECT IFNULL(SUM(`hits`), 0) FROM `bx_analytics_bots` WHERE `day` < '2002-01-01'");
        }

        $this->fail('no test window for ' . $sTable);
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

    protected function _deletePage($sObject)
    {
        $oDb = BxDolDb::getInstance();
        $aPage = $oDb->getRow("SELECT * FROM `sys_objects_page` WHERE `object` = :object", ['object' => $sObject]);
        if (empty($aPage))
            return;

        $oDb->query("DELETE FROM `sys_pages_blocks` WHERE `object` = :object", ['object' => $sObject]);
        $oDb->query("DELETE FROM `sys_objects_page` WHERE `object` = :object", ['object' => $sObject]);
        BxDolStudioLanguagesUtils::getInstance()->deleteLanguageString($aPage['title']);
        BxDolStudioLanguagesUtils::getInstance()->deleteLanguageString($aPage['title_system']);
        foreach (['sys_pages_objects_data', 'sys_pages_uri_object_map', 'sys_pages_urirewrite_object_map'] as $sCache)
            $oDb->cleanCache($sCache);
    }

    protected function _cleanup()
    {
        $oDb = BxDolDb::getInstance();
        $iTo = self::NOW + 30 * 86400;
        $oDb->query("DELETE FROM `bx_analytics_events` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_sessions` WHERE `started` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_bots` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_salts` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_limits` WHERE `bucket` < 1009843200");
        $this->_oModule->cleanReportCache(); // reports of the test data cached by the run before
    }
}
