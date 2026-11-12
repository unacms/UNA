<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 GET /persons (BxPersonsApiV2 on BxBaseModProfileApiV2), over real HTTP: the people
 * directory in its views (Recent, Active, Online), as the module's browse blocks list them;
 * paging; a guest and a member (a person who keeps the page for friends is listed to a guest
 * with less); the path only while
 * Persons is enabled; how many queries a page takes. Skips without bx_persons.
 */
#[Group('integration')]
class ApiV2PersonsTest extends ApiV2TestCase
{
    /** [content id, allow_view_to] of a person whose privacy a test changed, put back after it. */
    protected $_aPrivacy = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->requireModule('bx_persons');
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aPrivacy as [$iContent, $sAllow])
            $oDb->query("UPDATE `bx_persons_data` SET `allow_view_to` = :a WHERE `id` = :id", ['a' => $sAllow, 'id' => $iContent]);
        if ($this->_aPrivacy)
            $oDb->cleanMemoryAll();
        parent::tearDown();
    }

    protected function persons(array $aAuth, string $sQuery = ''): array
    {
        $a = $this->http('GET', 'persons' . ($sQuery !== '' ? '?' . $sQuery : ''), $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Profile', $a['json']);
        return $a['json'];
    }

    /** Every page of a view, `limit` at a time: the ids in order. */
    protected function allPages(array $aAuth, string $sView, int $iLimit): array
    {
        $aIds = [];
        $sCursor = null;
        for ($i = 0; $i < 100; $i++) {
            $a = $this->persons($aAuth, 'view=' . $sView . '&limit=' . $iLimit . ($sCursor !== null ? '&cursor=' . rawurlencode($sCursor) : ''));
            $this->assertLessThanOrEqual($iLimit, count($a['items']));
            foreach ($a['items'] as $aItem)
                $aIds[] = (int)$aItem['id'];
            if (($sCursor = $a['next_cursor']) === null)
                break;
        }
        return $aIds;
    }

    public function testThePathOnlyWhilePersonsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);

        $aWithout = $aEnabled;
        unset($aWithout['bx_persons']);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router(BxDolApiV2Router::classesFor($aWithout, $aWithFile))))->build();
        $this->assertArrayNotHasKey('/persons', $aSpec['paths']);

        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxPersonsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        $this->assertArrayHasKey('/persons', $aSpec['paths']);
        $this->assertArrayHasKey('Page_Profile', $aSpec['components']['schemas']);

        // GET /api/v2 lists the module with its tag
        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status'], $a['body']);
        $aModules = array_column($a['json']['modules'] ?? [], null, 'module');
        $this->assertSame('persons', $aModules['bx_persons']['tag'] ?? null);
        $this->assertSame('person', $aModules['bx_persons']['kind'] ?? null);
    }

    public function testRecentIsTheNewestFirstAndPagesDontOverlap(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];

        $aFirst = $this->persons($aMember);
        $this->assertNotEmpty($aFirst['items']);
        foreach ($aFirst['items'] as $aItem) {
            $this->assertSame('person', $aItem['kind']);
            $this->assertSame('bx_persons', $aItem['module']);
            $this->assertSame('active', $aItem['status']);
        }
        $this->assertSame($aFirst, $this->persons($aMember, 'view=recent'), 'recent is the default');

        // the module's own list: its active persons, newest first, the profile id breaking ties
        $aExpected = array_map('intval', BxDolDb::getInstance()->getColumn("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `bx_persons_data` AS `d` ON `d`.`id` = `p`.`content_id` INNER JOIN `sys_accounts` AS `a` ON `a`.`id` = `p`.`account_id` WHERE `p`.`type` = 'bx_persons' AND `p`.`status` = 'active' ORDER BY `d`.`added` DESC, `p`.`id` DESC LIMIT 200"));
        $aAll = array_map(fn($a) => (int)$a['id'], $this->persons($aMember, 'limit=200')['items']);
        if (getParam('sys_account_hide_unconfirmed_accounts') !== 'on' || getParam('sys_account_confirmation_type') === BX_ACCOUNT_CONFIRMATION_NONE)
            $this->assertSame($aExpected, $aAll);
        else
            $this->assertSame(array_values(array_intersect($aExpected, $aAll)), $aAll, 'in the same order, without the unconfirmed');

        // two at a time: the same people in the same order, none twice
        if (count($aAll) > 2) {
            $aPaged = $this->allPages($aMember, 'recent', 2);
            $this->assertSame($aAll, $aPaged);
        }

        $a = $this->http('GET', 'persons?view=nearby', $aMember);
        $this->assertSame(422, $a['status'], $a['body']);
    }

    public function testActiveAndOnline(): void
    {
        [, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $oDb = BxDolDb::getInstance();

        // Active: the most recently signed in first
        $aActive = array_map(fn($a) => (int)$a['id'], $this->persons($aMember, 'view=active&limit=200')['items']);
        $this->assertNotEmpty($aActive);
        $aLogged = [];
        foreach ($aActive as $iId)
            $aLogged[] = (int)$oDb->getOne("SELECT `a`.`logged` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON `a`.`id` = `p`.`account_id` WHERE `p`.`id` = :id", ['id' => $iId]);
        $aSorted = $aLogged;
        rsort($aSorted);
        $this->assertSame($aSorted, $aLogged);
        $this->assertEqualsCanonicalizing($aActive, array_map(fn($a) => (int)$a['id'], $this->persons($aMember, 'limit=200')['items']), 'the same people as Recent');

        // Online: only those with a session in the site's online time, each once
        $iSince = time() - 60 * (int)getParam('sys_account_online_time');
        $aOnline = array_map(fn($a) => (int)$a['id'], $this->persons($aMember, 'view=online&limit=200')['items']);
        $this->assertSame($aOnline, array_values(array_unique($aOnline)));
        foreach ($aOnline as $iId)
            $this->assertGreaterThan($iSince, (int)$oDb->getOne("SELECT MAX(`s`.`date`) FROM `sys_profiles` AS `p` INNER JOIN `sys_sessions` AS `s` ON `s`.`user_id` = `p`.`account_id` WHERE `p`.`id` = :id", ['id' => $iId]), 'person ' . $iId . ' is online');
        $iOnlineNow = (int)$oDb->getOne("SELECT COUNT(DISTINCT `p`.`id`) FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON `a`.`id` = `p`.`account_id` AND `a`.`profile_id` = `p`.`id` INNER JOIN `sys_sessions` AS `s` ON `s`.`user_id` = `p`.`account_id` WHERE `p`.`type` = 'bx_persons' AND `p`.`status` = 'active' AND `s`.`date` > :since", ['since' => $iSince]);
        if (getParam('sys_account_hide_unconfirmed_accounts') !== 'on')
            $this->assertCount($iOnlineNow, $aOnline);
    }

    public function testAGuestSeesWhatTheSiteShowsGuests(): void
    {
        [$iViewer, $sToken] = $this->userToken();
        $aMember = ['Authorization' => 'Bearer ' . $sToken];
        $oDb = BxDolDb::getInstance();

        // a person who keeps the page for friends: listed to a guest by name, without the join date
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $oOther = BxDolProfile::getInstance($iOther);
        $iContent = (int)$oOther->getContentId();
        $this->_aPrivacy[] = [$iContent, (string)$oDb->getOne("SELECT `allow_view_to` FROM `bx_persons_data` WHERE `id` = :id", ['id' => $iContent])];
        $oDb->query("UPDATE `bx_persons_data` SET `allow_view_to` = :a WHERE `id` = :id", ['a' => BX_DOL_PG_FRIENDS, 'id' => $iContent]);

        $fFind = function (array $aPage) use ($iOther) {
            foreach ($aPage['items'] as $aItem)
                if ((int)$aItem['id'] === $iOther)
                    return $aItem;
            return null;
        };
        $aGuestSees = $fFind($this->persons([], 'limit=200'));
        $this->assertNotNull($aGuestSees, 'listed to a guest, as on the site');
        $this->assertSame($oOther->getDisplayName(), $aGuestSees['display_name']);
        $this->assertSame('1970-01-01T00:00:00Z', $aGuestSees['created_at'], 'the page is for friends');
        $this->assertSame(403, $this->http('GET', 'profiles/' . $iOther)['status']);
        // the person sees their own
        $aOwnSees = $fFind($this->persons(['Authorization' => 'Bearer ' . $this->profileToken($iOther)], 'limit=200'));
        $this->assertNotNull($aOwnSees);
        $this->assertNotSame('1970-01-01T00:00:00Z', $aOwnSees['created_at']);

        // guests and members find the same people
        $fIds = fn(array $a) => array_map(fn($i) => (int)$i['id'], $a['items']);
        $this->assertSame($fIds($this->persons($aMember, 'limit=200')), $fIds($this->persons([], 'limit=200')));
    }

    public function testQueriesAreBounded(): void
    {
        [$iViewer] = $this->userToken();
        foreach (['recent', 'active', 'online'] as $sView) {
            $this->assertLessThanOrEqual(30, $this->countQueries(0, $sView), 'a guest, ' . $sView);
            $this->assertLessThanOrEqual(35, $this->countQueries($iViewer, $sView), 'a member, ' . $sView);
        }
    }

    /** The queries a page of 50 takes, the second time (what a request reads once is read). */
    protected function countQueries(int $iProfile, string $sView): int
    {
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        if ($iProfile)
            $GLOBALS['glForceCurrentProfileId'] = $iProfile;
        else
            unset($GLOBALS['glForceCurrentProfileId']);
        $oAuth = new class($iProfile) extends BxDolApiV2Auth {
            public function __construct(int $i)
            {
                $this->_iProfileId = $i;
                $this->_sMode = $i ? self::MODE_TOKEN : self::MODE_GUEST;
            }
        };
        bx_import('ApiV2', BxDolModuleQuery::getInstance()->getModuleByName('bx_persons'));
        $oDb = BxDolDb::getInstance();
        $fQueries = fn() => (int)$oDb->getRow("SHOW SESSION STATUS LIKE 'Questions'")['Value'];
        try {
            $fRun = function () use ($oAuth, $sView) {
                BxDolApiV2Map::reset();
                return (new BxPersonsApiV2())->listPersons(new BxDolApiV2Request('GET', [], ['view' => $sView, 'limit' => '50'], null, [], $oAuth));
            };
            $fRun();
            $oDb->cleanMemoryAll();
            $iBefore = $fQueries();
            $a = $fRun();
            $iQueries = $fQueries() - $iBefore - 1;
            $this->assertIsArray($a['items']);
            return $iQueries;
        }
        finally {
            if ($mBefore === null)
                unset($GLOBALS['glForceCurrentProfileId']);
            else
                $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
    }
}
