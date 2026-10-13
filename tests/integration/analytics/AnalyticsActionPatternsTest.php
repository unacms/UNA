<?php

/**
 * Goal and funnel patterns for the site actions the module records, and the examples the
 * goal and funnel forms show. Site actions go through the module's own alert handler with a
 * collector dated in September 2001, like the other analytics tests, and are deleted afterwards.
 */
class AnalyticsActionPatternsTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    const ACCOUNT = 987654351;
    const PROFILE = 987654352;

    // the hints that show what a goal or a funnel step can match
    const HINTS = ['_bx_analytics_txt_match_hint', '_bx_analytics_txt_funnel_hint'];

    // the generic form the English hint explains the syntax with, not an example
    const PLACEHOLDER = 'name@module';

    protected $_oModule;
    protected $_oAlertModule;
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

        // the module's alert handler, with a collector for the test's request and time
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_analytics');
        $this->_oAlertModule = new class($aModule) extends BxAnalyticsModule {
            public $oCollector = null;
            public function getCollector()
            {
                return $this->oCollector ? $this->oCollector : parent::getCollector();
            }
        };

        $this->_cleanup();

        foreach (['bx_analytics_track_actions' => 'on', 'bx_analytics_tracking' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api,core', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => ''] as $sName => $sValue)
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

    public function testGoalAndFunnelCountAVisitThatAddedAPost()
    {
        $oDb = $this->_oModule->_oDb;
        $aGoal = ['type' => 'event', 'pattern' => 'content_add@bx_posts'];
        $iGoal = $oDb->saveGoal(0, ['name' => 'Test 2001 new post'] + $aGoal);
        $iFunnel = $oDb->saveFunnel(0, 'Test 2001 posting', [
            ['type' => 'page', 'pattern' => '/page/create-post'],
            $aGoal,
        ]);
        $this->_aGoals = [$iGoal];
        $this->_aFunnels = [$iFunnel];

        // A adds a post, B adds a photo, C only looks at the form
        $aVisits = [['93.184.216.61', 'bx_posts'], ['93.184.216.62', 'bx_photos'], ['93.184.216.63', '']];
        foreach ($aVisits as $iVisit => list($sIp, $sUnit)) {
            $aServer = $this->_server($sIp);
            $iNow = self::NOW + $iVisit * 100;
            $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'https://una.test/page/create-post']]], $iNow);
            if ($sUnit !== '')
                $this->_alert($aServer, $iNow + 30, $sUnit, 'added', 70 + $iVisit, self::PROFILE + $iVisit);
        }

        $aSessions = $this->_sessions();
        $this->assertCount(3, $aSessions);
        $aEvents = BxDolDb::getInstance()->getAll("SELECT `session_id`, `name`, `module`, `object_id` FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to ORDER BY `id`", ['to' => self::NOW + 86400]);
        $this->assertEquals([
            ['session_id' => $aSessions[0]['id'], 'name' => 'content_add', 'module' => 'bx_posts', 'object_id' => 70],
            ['session_id' => $aSessions[1]['id'], 'name' => 'content_add', 'module' => 'bx_photos', 'object_id' => 71],
        ], $aEvents, 'a new post is the site action content_add of the module, in the visit');

        $oReports = $this->_oModule->getReports();
        $oFilter = $this->_filter();

        $aGoals = array_column($oReports->getGoals($oFilter)['goals'], null, 'id');
        $this->assertSame(1, $aGoals[$iGoal]['conversions']);
        $this->assertEquals(33.33, $aGoals[$iGoal]['rate']);

        $aFilter = $oFilter->get();
        $this->assertSame(2, (int)$oDb->getGoalTotals($aFilter, ['type' => 'event', 'pattern' => 'content_add'])['sessions'], 'without a module, new content of any module');
        $this->assertSame(0, (int)$oDb->getGoalTotals($aFilter, ['type' => 'event', 'pattern' => 'added@bx_posts'])['sessions'], 'the alert\'s name is not the action\'s');

        $aFunnel = $oReports->getFunnels($oFilter, ['funnel' => $iFunnel]);
        $this->assertSame([3, 1], array_column($aFunnel['steps'], 'sessions'));
    }

    public function testHintExamplesAreRecordedActions()
    {
        // one visit that does every site action the alert handler records
        $aServer = $this->_server('93.184.216.64');
        $this->_collect($aServer, ['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'https://una.test/page/view-post?id=70']]], self::NOW);
        $aAlerts = [
            // the test account has no profile, so it signs in as the guest the visit started as
            ['account', 'add', self::ACCOUNT, 0, []],
            ['account', 'login', self::ACCOUNT, 0, []],
            ['profile', 'add', self::PROFILE, self::PROFILE, ['module' => 'bx_persons']],
            ['bx_posts', 'added', 70, self::PROFILE, []],
            ['comment', 'added', 1, self::PROFILE, ['object_system' => 'bx_posts', 'object_id' => 70]],
            ['vote', 'do', 1, self::PROFILE, ['object_system' => 'bx_posts_reactions', 'object_id' => 70, 'reaction' => 'like']],
            ['system', 'connection_added', 5, self::PROFILE, ['object_name' => 'sys_profiles_friends', 'content' => 6]],
        ];
        foreach ($aAlerts as $i => list($sUnit, $sAction, $iObject, $iSender, $aExtras))
            $this->_alert($aServer, self::NOW + 10 + $i, $sUnit, $sAction, $iObject, $iSender, $aExtras);

        $aSessions = $this->_sessions();
        $this->assertCount(1, $aSessions);
        $aRecorded = BxDolDb::getInstance()->getColumn("SELECT DISTINCT `name` FROM `bx_analytics_events` WHERE `type` = 'una' AND `session_id` = :id", ['id' => $aSessions[0]['id']]);
        $this->assertCount(count($aAlerts), $aRecorded, 'every alert is a site action of the visit');

        // every action has a title of its own in the reports
        $aEn = $this->_strings(BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/install/langs/en.xml');
        $aRu = $this->_strings(BX_DIRECTORY_PATH_MODULES . 'boonex/russian/data/langs/bx_analytics/ru.xml');
        foreach ($aRecorded as $sName) {
            $this->assertArrayHasKey('_bx_analytics_action_' . $sName, $aEn, $sName);
            $this->assertArrayHasKey('_bx_analytics_action_' . $sName, $aRu, $sName);
        }

        $oDb = $this->_oModule->_oDb;
        $aFilter = $this->_filter()->get();
        foreach (self::HINTS as $sKey) {
            $this->assertArrayHasKey($sKey, $aEn);
            $this->assertArrayHasKey($sKey, $aRu);

            // Russian prose is Cyrillic, so its Latin words are the examples
            $aExamples = $this->_examples($aRu[$sKey], '/(?<![\p{L}\d_@])[a-z][a-z0-9_]*(?:@[a-z0-9_]+)?/u');
            $this->assertNotEmpty($aExamples['page'], $sKey . ': a page example');
            $this->assertNotEmpty(array_filter($aExamples['event'], function ($s) { return strpos($s, '@') !== false; }), $sKey . ': an action of one module');

            // the English hint shows the same examples
            $aEnExamples = $this->_examples($aEn[$sKey], '/(?<![\p{L}\d_@])[a-z][a-z0-9_]*@[a-z0-9_]+/u');
            $this->assertSame($aExamples['page'], $aEnExamples['page'], $sKey);
            $this->assertSame(array_values(array_filter($aExamples['event'], function ($s) { return strpos($s, '@') !== false; })), array_values(array_diff($aEnExamples['event'], [self::PLACEHOLDER])), $sKey);
            foreach ($aExamples['event'] as $sExample)
                $this->assertMatchesRegularExpression('/(?<![\p{L}\d_@])' . preg_quote($sExample, '/') . '(?![\p{L}\d_@])/u', $aEn[$sKey], $sKey . ': ' . $sExample);

            foreach ($aExamples['event'] as $sPattern)
                $this->assertContains(explode('@', $sPattern)[0], $aRecorded, $sKey . ': ' . $sPattern . ' names an action the module records');

            // and each of them, as a goal, counts the visit that did it
            foreach ($aExamples as $sType => $aPatterns)
                foreach ($aPatterns as $sPattern)
                    $this->assertSame(1, (int)$oDb->getGoalTotals($aFilter, ['type' => $sType, 'pattern' => $sPattern])['sessions'], $sKey . ': ' . $sPattern . ' matches');
        }
    }

    /**
     * Page paths and action names a hint gives as examples.
     */
    protected function _examples($sText, $sActionRegExp)
    {
        $aPages = [];
        if (preg_match_all('#(?<![\p{L}\d])/[\p{L}\d_\-/*?=.]*[\p{L}\d_\-/*?=]#u', $sText, $aMatches))
            $aPages = array_values(array_unique($aMatches[0]));

        $sProse = str_replace($aPages, ' ', $sText);
        $aEvents = preg_match_all($sActionRegExp, $sProse, $aMatches) ? array_values(array_unique($aMatches[0])) : [];

        return ['page' => $aPages, 'event' => $aEvents];
    }

    protected function _strings($sFile)
    {
        $this->assertFileExists($sFile);

        $aResult = [];
        foreach (simplexml_load_file($sFile)->xpath('//string') as $oString)
            $aResult[(string)$oString['name']] = (string)$oString;

        return $aResult;
    }

    protected function _alert($aServer, $iNow, $sUnit, $sAction, $iObject, $iSender, $aExtras = [])
    {
        $this->_oAlertModule->oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), $iNow);
        $this->_oAlertModule->onAlert(new BxDolAlerts($sUnit, $sAction, $iObject, $iSender, $aExtras));
        $this->_oAlertModule->oCollector = null;
    }

    protected function _collect($aServer, $aPayload, $iNow)
    {
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), $iNow);

        return $oCollector->collect($aPayload, ['platform' => 'api']);
    }

    protected function _filter()
    {
        return new BxAnalyticsFilter($this->_oModule, ['range' => 'custom', 'from' => '2001-09-09', 'to' => '2001-09-09'], self::NOW + 86400);
    }

    protected function _server($sIp)
    {
        return ['REMOTE_ADDR' => $sIp, 'HTTP_USER_AGENT' => self::UA_SAFARI, 'REQUEST_METHOD' => 'POST'];
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
        foreach ($this->_aGoals as $iId)
            $this->_oModule->_oDb->deleteGoal($iId);
        foreach ($this->_aFunnels as $iId)
            $this->_oModule->_oDb->deleteFunnel($iId);
        $this->_aGoals = $this->_aFunnels = [];
        $this->_oModule->cleanReportCache(); // reports of the test data cached by the run before
    }
}
