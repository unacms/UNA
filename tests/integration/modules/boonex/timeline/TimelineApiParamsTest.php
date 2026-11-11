<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Feed params sent by API clients and by live update checks are cleaned the way the web's
 * are, the server decides the status and moderator flag, and the values that reach the
 * events query are integers or bound parameters. One event goes only to whoever may see
 * it, and an API repost is always the viewer's own.
 *
 * The test makes its own timeline events and deletes them, with any repost made of them.
 */
#[Group('integration')]
class TimelineApiParamsTest extends BxDolIntegrationTestCase
{
    protected $_bReady = false;
    protected $_aEventIds = [];
    protected $_aIsApiBackup = [];
    protected $_aProfileIdBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        // The module (which defines the BX_TIMELINE_* constants) is shared by every test
        // and keeps the profile it was built for: make it the guest's.
        $this->becomeGuest();
        $this->_bReady = true;
    }

    protected function tearDown(): void
    {
        try {
            if ($this->_bReady)
                $this->deleteEvents();
        }
        finally {
            foreach (array_reverse($this->_aIsApiBackup) as $aBackup)
                $this->bxSetProtected($aBackup[0], '_bIsApi', $aBackup[1], $aBackup[2]);

            $this->restoreProfileIds();

            BxDolDb::getInstance()->cleanMemoryAll();
            parent::tearDown();
        }
    }

    protected function becomeGuest(): void
    {
        $this->bxBecomeGuest();
        $this->setModuleProfileId($this->module(), 0);
    }

    /**
     * Change a cached module's viewer, remembering the one it had before the test.
     */
    protected function setModuleProfileId($oModule, int $iProfileId): void
    {
        $sName = $oModule->getName();
        $iPrev = $oModule->setProfileId($iProfileId);
        if (!array_key_exists($sName, $this->_aProfileIdBackup))
            $this->_aProfileIdBackup[$sName] = $iPrev;
    }

    protected function restoreProfileIds(): void
    {
        foreach ($this->_aProfileIdBackup as $sName => $iProfileId)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sName))
                BxDolModule::getInstance($sName)->setProfileId($iProfileId);

        $this->_aProfileIdBackup = [];
    }

    /**
     * Log in and make the module's profile the logged-in one, as in a request.
     */
    protected function loginAs(string $sKind): int
    {
        $this->bxLoginAs($sKind);

        $iProfileId = (int)bx_get_logged_profile_id();
        $this->setModuleProfileId($this->module(), $iProfileId);

        // The profile's own module checks who may post to it as the profile it was created for,
        // which an earlier test may have logged in as.
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if ($oProfile && $oProfile->getModule() !== $this->module()->getName() && BxDolModuleQuery::getInstance()->isEnabledByName($oProfile->getModule()))
            $this->setModuleProfileId(BxDolModule::getInstance($oProfile->getModule()), $iProfileId);

        return $iProfileId;
    }

    protected function module(): BxTimelineModule
    {
        return BxDolModule::getInstance('bx_timeline');
    }

    /**
     * The template behind the module's proxy.
     */
    protected function template(): BxTimelineTemplate
    {
        $oProxy = $this->module()->_oTemplate;
        return (new ReflectionProperty(BxDolModuleProxy::class, '_oProxifiedObject'))->getValue($oProxy);
    }

    protected function setApi($o, string $sClass, bool $bApi): void
    {
        $this->_aIsApiBackup[] = [$o, $this->bxGetProtected($o, '_bIsApi', $sClass), $sClass];
        $this->bxSetProtected($o, '_bIsApi', $bApi, $sClass);
    }

    protected function setApiModule(): void
    {
        $this->setApi($this->module(), BxBaseModGeneralModule::class, true);
        $this->setApi($this->template(), BxBaseModGeneralTemplate::class, true);
    }

    protected function adminProfileId(): int
    {
        return (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
    }

    /**
     * Log in as the member account and return its profile, which is not a moderator.
     */
    protected function loginAsMember(): int
    {
        $iProfileId = $this->loginAs('user');
        if ($this->module()->isModerator())
            $this->markTestSkipped('The member account moderates Timeline.');

        return $iProfileId;
    }

    /**
     * A direct post by a profile (the admin's account profile by default) on its own timeline,
     * with its admin status (moderation) and active flag.
     */
    protected function addEvent(string $sStatus, int $iAuthorId = 0, string $sStatusAdmin = 'active', int $iActive = 1): int
    {
        $oDb = BxDolDb::getInstance();
        if (!$iAuthorId)
            $iAuthorId = $this->adminProfileId();

        $oDb->query("INSERT INTO `bx_timeline_events` SET `owner_id` = :author, `system` = 0, `type` = 'timeline_common_post', `action` = '', `object_id` = :author, `object_owner_id` = :author, `object_privacy_view` = '3', `content` = '', `title` = '', `description` = 'TimelineApiParamsTest event', `labels` = '', `location` = '', `date` = :now, `published` = :now, `status` = :status, `status_admin` = :status_admin, `active` = :active", [
            'author' => $iAuthorId,
            'now' => time(),
            'status' => $sStatus,
            'status_admin' => $sStatusAdmin,
            'active' => $iActive,
        ]);

        return $this->_aEventIds[] = (int)$oDb->lastId();
    }

    /**
     * The fixture events, and reposts made of them through the module, so the
     * repost's track, counter and notifications go too.
     */
    protected function deleteEvents(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aEventIds as $iId) {
            $aRepostIds = $oDb->getColumn("SELECT `event_id` FROM `bx_timeline_reposts_track` WHERE `reposted_id` = :id", ['id' => $iId]);
            foreach ($aRepostIds as $iRepostId) {
                $this->module()->deleteEvent($this->module()->_oDb->getEvents(['browse' => 'id', 'value' => (int)$iRepostId]));
                $oDb->query("DELETE FROM `bx_timeline_events` WHERE `id` = :id", ['id' => (int)$iRepostId]);
            }

            $oDb->query("DELETE FROM `bx_timeline_reposts_track` WHERE `reposted_id` = :id", ['id' => $iId]);
            $oDb->query("DELETE FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $iId]);
        }
    }

    protected function repostsOf(int $iId): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_timeline_reposts_track` WHERE `reposted_id` = :id", ['id' => $iId]);
    }

    /**
     * Run the callback and return the events list queries it made.
     */
    protected function eventsQueries(callable $fCallback): array
    {
        $oRecorder = new TimelineApiParamsTestRecorder();
        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fCallback();
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        return array_values(array_filter($oRecorder->aQueries, fn($s) => stripos($s, '`bx_timeline_events`') !== false && stripos($s, "`active`='1'") !== false));
    }

    /**
     * The status and moderator flag of the queries come from the server, and paging is limited.
     */
    protected function assertCleanedQueries(array $aQueries, string $sService): void
    {
        $this->assertNotEmpty($aQueries, $sService . ' reads the feed.');
        foreach ($aQueries as $sQuery) {
            $this->assertStringNotContainsString("`status`='" . BX_TIMELINE_STATUS_HIDDEN . "'", $sQuery, $sService . ': the status comes from the server.');
            $this->assertStringContainsString('`status_admin`=', $sQuery, $sService . ': a guest is never a moderator.');

            preg_match_all('/LIMIT\s+(\d+)(?:\s*,\s*(\d+))?/i', $sQuery, $aMatches);
            foreach (array_filter(array_merge($aMatches[1], $aMatches[2]), 'strlen') as $sNumber)
                $this->assertLessThanOrEqual(100000 + 101, (int)$sNumber, $sService . ': paging is limited.');
        }
    }

    protected function clientParams(): array
    {
        return [
            'type' => BX_TIMELINE_TYPE_DEFAULT,
            'start' => '24',
            'per_page' => '5000',
            'owner_id' => '7',
            'status' => BX_TIMELINE_STATUS_HIDDEN,
            'moderator' => true,
            'viewer_id' => 123456,
            'dynamic_mode' => false,
            'unknown' => 'value',
        ];
    }

    /**
     * What a client sends to read hidden posts in bulk, past the paging limits.
     */
    protected function forgedParams(): array
    {
        return [
            'type' => BX_TIMELINE_TYPE_DEFAULT,
            'owner_id' => 0,
            'status' => BX_TIMELINE_STATUS_HIDDEN,
            'moderator' => true,
            'per_page' => 5000,
            'start' => 1000000000,
        ];
    }

    protected function assertCleaned(array $aParams): void
    {
        $this->assertSame(24, $aParams['start']);
        $this->assertSame(100, $aParams['per_page'], 'A client gets at most 100 events per page.');
        $this->assertSame(7, $aParams['owner_id']);
        $this->assertSame(BX_TIMELINE_STATUS_ACTIVE, $aParams['status'], 'The status comes from the server.');
        $this->assertFalse($aParams['moderator'], 'A guest is never a moderator.');
        $this->assertSame(0, (int)$aParams['viewer_id'], 'The viewer is the logged-in profile.');
        $this->assertFalse($aParams['dynamic_mode']);
        $this->assertArrayNotHasKey('unknown', $aParams);
    }

    public function testJsonParamsAreCleaned(): void
    {
        $sParams = json_encode(['params' => $this->clientParams()]);
        $this->assertCleaned($this->bxCallProtected($this->module(), '_prepareParamsApi', $sParams));
    }

    public function testArrayParamsAreCleaned(): void
    {
        $this->assertCleaned($this->bxCallProtected($this->module(), '_prepareParamsApi', $this->clientParams()));
    }

    public function testPagingIsLimited(): void
    {
        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['start' => '1000000000', 'per_page' => '5000', 'per_page_default' => '5000']);
        $this->assertSame(100000, $aParams['start']);
        $this->assertSame(100, $aParams['per_page']);
        $this->assertSame(100, $aParams['per_page_default']);
    }

    public function testTypeAndNumbersAreValidated(): void
    {
        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['type' => 'not a type!', 'start' => 'abc']);
        $this->assertSame(BX_TIMELINE_TYPE_DEFAULT, $aParams['type'], 'A type is word characters only.');
        $this->assertEmpty($aParams['start'], 'A start that is not a number is no start.');
    }

    public function testMediaFilterKeepsKnownTypes(): void
    {
        if (array_diff(['images', 'videos'], $this->module()->_oConfig->getFiltersMedia()))
            $this->markTestSkipped('The images or videos filter is hidden.');

        // NEO joins the checked types with commas; a response echoes them back as an array.
        foreach (['images,videos', ['images', 'videos'], 'videos, images,bogus', ['videos', ['images'], 'images', 'x`y']] as $mMedia) {
            $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['media' => $mMedia]);
            $this->assertSame('images,videos', $aParams['media'], json_encode($mMedia));
        }

        $this->assertSame('images', $this->bxCallProtected($this->module(), '_prepareParamsApi', ['media' => 'images'])['media']);
        $this->assertSame('', $this->bxCallProtected($this->module(), '_prepareParamsApi', ['media' => 'bogus'])['media']);

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsLiveUpdate', ['media' => ['images', 'videos']]);
        $this->assertSame(['images', 'videos'], $aParams['media'], 'A live update filters by the same types.');
        $this->assertSame(['images', 'videos'], $this->module()->getParamsExt($aParams)['media'], 'Prepared params can be prepared again.');

        $this->setApiModule();
        $sParams = json_encode(['params' => ['type' => BX_TIMELINE_TYPE_DEFAULT, 'media' => 'images,videos', 'start' => 1000000000]]);
        $aResult = $this->module()->serviceGetPosts($sParams);
        $this->assertSame(['images', 'videos'], $aResult[0]['data']['params']['media'], 'get_posts filters by both types.');

        // get reads the feed itself (get_posts leaves it to the block on an API page).
        $aQueries = $this->eventsQueries(fn() => $this->module()->serviceGet($sParams));
        $this->assertNotEmpty($aQueries);
        $this->assertStringContainsString('_ef_photos`', $aQueries[0], 'The feed is filtered by images.');
        $this->assertStringContainsString('_ef_videos`', $aQueries[0], 'And by videos.');
    }

    public function testServicesCleanClientParams(): void
    {
        $this->setApiModule();
        $sParams = json_encode(['params' => $this->forgedParams()]);

        // The block carries the params its feed is read with.
        $aParams = $this->module()->serviceGetPosts($sParams)[0]['data']['params'];
        $this->assertSame(BX_TIMELINE_STATUS_ACTIVE, $aParams['status']);
        $this->assertFalse($aParams['moderator']);
        $this->assertSame(100, $aParams['per_page']);
        $this->assertSame(100000, $aParams['start']);

        $this->assertCleanedQueries($this->eventsQueries(fn() => $this->module()->serviceGet($sParams)), 'get');
        $this->assertCleanedQueries($this->eventsQueries(fn() => $this->module()->serviceGetLiveUpdate($this->forgedParams(), 0)), 'get_live_update');
        // Its first check (init) returns the count only; the popup's params are the server's own.
        $this->assertCleanedQueries($this->eventsQueries(fn() => $this->module()->serviceGetLiveUpdates($this->forgedParams(), 0, 0, 1)), 'get_live_updates');
    }

    public function testEventsQueryTakesIntegersAndBoundTypes(): void
    {
        $oModule = $this->module();
        $aBase = $this->bxCallProtected($oModule, '_prepareParams', ['type' => BX_TIMELINE_TYPE_DEFAULT]);

        $aEvents = $oModule->_oDb->getEvents(array_merge($aBase, ['browse' => 'list', 'start' => '0x', 'per_page' => '2y']));
        $this->assertIsArray($aEvents);
        $this->assertLessThanOrEqual(2, count($aEvents), 'Page values are read as integers.');

        // An owner makes the query join profiles of the requested type.
        $iOwnerId = $this->adminProfileId();
        $aEvents = $oModule->_oDb->getEvents(array_merge($aBase, ['browse' => 'list', 'type' => "o'brien", 'owner_id' => $iOwnerId, 'start' => 0, 'per_page' => 2]));
        $this->assertIsArray($aEvents, 'A quote in the type does not break the query.');

        // The feed adds promoted posts to whatever the type matches; this type matches no profile.
        foreach ($aEvents as $aEvent)
            $this->assertNotEquals(0, (int)$aEvent['promoted'], 'A profile type is a bound value; this one matches nothing.');
    }

    public function testOnlyGetTakesOneEvent(): void
    {
        $iId = $this->addEvent(BX_TIMELINE_STATUS_ACTIVE);

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId]);
        $this->assertSame('list', $aParams['browse'], 'A list request stays a list.');

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', json_encode(['params' => ['browse' => 'id', 'value' => $iId]]), true);
        $this->assertSame('id', $aParams['browse']);
        $this->assertSame($iId, $aParams['value']);

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId + 1000000], true);
        $this->assertSame(0, $aParams['value'], 'An event that does not exist is no event.');
    }

    public function testPendingAndInactiveEventsAreNotForGuests(): void
    {
        $iAuthorId = $this->loginAs('admin');
        $iPendingId = $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iAuthorId, 'pending');
        $iInactiveId = $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iAuthorId, 'active', 0);

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iPendingId], true);
        $this->assertSame($iPendingId, $aParams['value'], 'Its author gets a post awaiting moderation.');

        $this->becomeGuest();
        foreach (['awaiting moderation' => $iPendingId, 'inactive' => $iInactiveId] as $sWhat => $iId) {
            $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId], true);
            $this->assertSame(0, $aParams['value'], 'A guest does not get a post ' . $sWhat . '.');
        }
    }

    public function testHiddenEventIsNotForOthers(): void
    {
        $iId = $this->addEvent(BX_TIMELINE_STATUS_HIDDEN, $this->loginAs('admin'));
        $this->becomeGuest();

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId], true);
        $this->assertSame(0, $aParams['value'], 'A guest does not get a hidden event.');

        $this->setApiModule();
        $this->assertSame([], $this->module()->serviceGet(json_encode(['params' => ['browse' => 'id', 'value' => $iId]])));

        $this->loginAsMember();
        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId], true);
        $this->assertSame(0, $aParams['value'], 'Nor does a member who neither wrote nor moderates it.');
    }

    public function testHiddenEventIsNotForGuestsOnAnExternalCall(): void
    {
        $iHiddenId = $this->addEvent(BX_TIMELINE_STATUS_HIDDEN, $this->loginAs('admin'));
        $iPublicId = $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $this->adminProfileId());
        $this->becomeGuest();

        // Not an API request: a macro in content reaches the service the same way.
        $this->assertSame([], BxDolService::callExternal('bx_timeline', 'get', [['browse' => 'id', 'value' => $iHiddenId]], 'Module', true), 'A hidden event is not for a guest.');

        $aParams = ['browse' => 'id', 'value' => $iPublicId, 'status' => BX_TIMELINE_STATUS_HIDDEN, 'moderator' => true];
        $aQueries = $this->eventsQueries(fn() => BxDolService::callExternal('bx_timeline', 'get', [$aParams], 'Module', true));
        foreach ($aQueries as $sQuery)
            $this->assertStringNotContainsString("`status`='" . BX_TIMELINE_STATUS_HIDDEN . "'", $sQuery, 'The status comes from the server.');
    }

    public function testEventWithoutAuthorIsNotTheGuests(): void
    {
        $iId = $this->addEvent(BX_TIMELINE_STATUS_HIDDEN);
        BxDolDb::getInstance()->query("UPDATE `bx_timeline_events` SET `object_owner_id` = 0 WHERE `id` = :id", ['id' => $iId]);
        BxDolDb::getInstance()->cleanMemoryAll();

        $this->becomeGuest();
        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId], true);
        $this->assertSame(0, $aParams['value'], 'A guest is not the author of an event which has none.');
    }

    public function testHiddenEventIsForItsAuthor(): void
    {
        $iId = $this->addEvent(BX_TIMELINE_STATUS_HIDDEN, $this->loginAsMember());

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId], true);
        $this->assertSame($iId, $aParams['value']);
    }

    public function testHiddenEventIsForModerators(): void
    {
        $iId = $this->addEvent(BX_TIMELINE_STATUS_HIDDEN, $this->loginAsMember());

        $this->loginAs('admin');
        if (!$this->module()->isModerator())
            $this->markTestSkipped('The admin account does not moderate Timeline.');

        $aParams = $this->bxCallProtected($this->module(), '_prepareParamsApi', ['browse' => 'id', 'value' => $iId], true);
        $this->assertSame($iId, $aParams['value']);
    }

    public function testApiRepostByAGuestIsRefused(): void
    {
        $iId = $this->addEvent(BX_TIMELINE_STATUS_ACTIVE);
        $iAuthorId = $this->adminProfileId();

        $this->setApiModule();

        // Without an owner the destination check passes, so the permission check of the repost refuses.
        $mixedResult = $this->module()->serviceRepost($iAuthorId, 0, 'timeline_common_post', '', $iId, true);

        $this->assertIsArray($mixedResult, 'A guest cannot repost, whatever author and force it sends.');
        $this->assertSame(2, $mixedResult['code']);

        // An owner profile may refuse the guest first, which depends on the profile type and settings.
        $mixedResult = $this->module()->serviceRepost($iAuthorId, $iAuthorId, 'timeline_common_post', '', $iId, true);

        $this->assertIsArray($mixedResult, 'A guest cannot repost, whatever author and force it sends.');
        $this->assertContains($mixedResult['code'], [1, 2]);
        $this->assertSame(0, $this->repostsOf($iId));
    }

    public function testApiRepostIsTheViewersOwn(): void
    {
        $iMemberId = $this->loginAsMember();
        $iId = $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iMemberId);

        $this->setApiModule();
        $mixedResult = $this->module()->serviceRepost($this->adminProfileId(), $iMemberId, 'timeline_common_post', '', $iId, true);
        if (is_array($mixedResult) && (int)$mixedResult['code'] == 2)
            $this->markTestSkipped('The member account may not repost.');

        $this->assertSame(0, $mixedResult['code']);
        $this->assertSame($iMemberId, (int)$mixedResult['performer_id']);

        $aRepost = $this->module()->_oDb->getEvents(['browse' => 'id', 'value' => (int)$mixedResult['id']]);
        $this->assertSame($iMemberId, (int)$aRepost['object_owner_id'], 'The repost is by the viewer, not by the author the client sent.');
        $this->assertSame(1, $this->repostsOf($iId));
    }

    /**
     * One feed page read the way get_posts reads it, and whether more events follow it. `get`
     * reads the feed also after another test rendered an API page (BX_API_PAGE), where
     * get_posts leaves it to the page's block.
     */
    protected function feedPage(int $iOwnerId, int $iStart, int $iPerPage): array
    {
        $aData = $this->module()->serviceGet(json_encode(['params' => [
            'type' => BX_TIMELINE_TYPE_DEFAULT, 'owner_id' => $iOwnerId, 'start' => $iStart, 'per_page' => $iPerPage,
        ]]));
        return ['data' => $aData, 'has_more' => $this->template()->getPostsHasMore()];
    }

    /**
     * A feed page says whether more events follow it (the query reads one more than a page),
     * so a client with a short page doesn't ask for the next one to find it empty.
     */
    public function testFeedPageSaysWhetherMoreFollow(): void
    {
        $iAuthorId = $this->adminProfileId();
        $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iAuthorId);
        $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iAuthorId);

        $this->setApiModule();
        $aFirst = $this->feedPage($iAuthorId, 0, 1);
        $this->assertCount(1, $aFirst['data']);
        $this->assertTrue($aFirst['has_more'], 'Another event follows a one-event page of two.');

        $aPast = $this->feedPage($iAuthorId, 1000000, 10);
        $this->assertSame([], $aPast['data']);
        $this->assertFalse($aPast['has_more'], 'Nothing follows a page past the end.');

        // The get_posts block carries it as `has_more` (unless an API page leaves the feed to its block).
        if (!defined('BX_API_PAGE')) {
            $aBlock = $this->module()->serviceGetPosts(json_encode(['params' => [
                'type' => BX_TIMELINE_TYPE_DEFAULT, 'owner_id' => $iAuthorId, 'start' => 0, 'per_page' => 1,
            ]]))[0]['data'];
            $this->assertTrue($aBlock['has_more']);
        }
    }

    /**
     * The last page of a feed says nothing follows it, also when it has posts on it: the case
     * that kept a client paging after a short feed.
     */
    public function testLastFeedPageWithPostsSaysNoMore(): void
    {
        $iAuthorId = $this->adminProfileId();
        $aIds = [$this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iAuthorId), $this->addEvent(BX_TIMELINE_STATUS_ACTIVE, $iAuthorId)];
        // The oldest events of the feed, so they are on its last page whatever else it holds.
        BxDolDb::getInstance()->query("UPDATE `bx_timeline_events` SET `date` = 1, `published` = 1 WHERE `id` IN (" . implode(',', $aIds) . ")");

        $this->setApiModule();
        $iPerPage = 100;
        $aPage = null;
        for ($iStart = 0, $i = 0; $i < 1000; $iStart += $iPerPage, $i++) {
            $aPage = $this->feedPage($iAuthorId, $iStart, $iPerPage);
            if (!$aPage['has_more']) {
                break;
            }
        }

        $this->assertFalse($aPage['has_more'], 'The feed ends within 1000 pages.');
        $aOnPage = array_map('intval', array_column($aPage['data'], 'id'));
        $this->assertNotEmpty(array_intersect($aIds, $aOnPage), 'The page that says nothing follows holds the oldest posts.');
    }
}

/**
 * Takes the place of $GLOBALS['bx_profiler'] to see the queries of a test.
 */
class TimelineApiParamsTestRecorder
{
    public array $aQueries = [];

    public function beginQuery($sSql)
    {
        $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql);
    }

    public function __call($sName, $aArgs)
    {
        return null;
    }
}
