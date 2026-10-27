<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Work the API feed does for every item: no database writes while nothing changed,
 * the Share menu takes the item's url from the feed instead of building the post again,
 * the Counters menu takes the comment and reaction elements the Actions menu built,
 * and attachment lists that API units don't return aren't built.
 *
 * The test makes its own discussion and timeline event, so it runs on any site
 * with Timeline and Discussions installed.
 */
#[Group('integration')]
class TimelineFeedApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_mixedProfilerBackup;
    protected $_aIsApiBackup = [];
    protected $_sExtendedUnitsBackup = null;
    protected $_iAuthorId = 0;
    protected $_iContentId = 0;
    protected $_iEventId = 0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->_mixedProfilerBackup = $GLOBALS['bx_profiler'] ?? null;

        $oModules = BxDolModuleQuery::getInstance();
        if (!$oModules->isEnabledByName('bx_timeline') || !$oModules->isEnabledByName('bx_forum'))
            $this->markTestSkipped('Timeline or Discussions are not installed.');

        $oDb = BxDolDb::getInstance();
        $iCategory = (int)$oDb->getOne("SELECT `Value` FROM `sys_form_pre_values` WHERE `Key` = 'bx_forum_cats' AND `Value` <> '' ORDER BY `Order` LIMIT 1");

        $this->bxLoginAsAdmin();
        $this->_iAuthorId = (int)bx_get_logged_profile_id();

        $iNow = time();
        $oDb->query("INSERT INTO `bx_forum_discussions` SET `author` = :author, `added` = :now, `changed` = :now, `lr_timestamp` = :now, `thumb` = 0, `thumb_data` = '', `title` = 'TimelineFeedApiTest discussion', `cat` = :cat, `multicat` = '', `text` = '<p>Fixture</p>', `text_comments` = '', `lr_profile_id` = :author, `lr_comment_id` = 0, `labels` = ''", [
            'author' => $this->_iAuthorId,
            'now' => $iNow,
            'cat' => $iCategory,
        ]);
        $this->_iContentId = (int)$oDb->lastId();

        $oDb->query("INSERT INTO `bx_timeline_events` SET `owner_id` = :author, `system` = 1, `type` = 'bx_forum', `action` = 'added', `object_id` = :content, `object_owner_id` = :author, `object_privacy_view` = '3', `content` = '', `source` = :source, `title` = 'TimelineFeedApiTest event', `description` = 'TimelineFeedApiTest event', `labels` = '', `location` = '', `date` = :now, `published` = :now", [
            'author' => $this->_iAuthorId,
            'content' => $this->_iContentId,
            'source' => 'bx_forum_' . $this->_iAuthorId . '_' . $this->_iContentId,
            'now' => $iNow,
        ]);
        $this->_iEventId = (int)$oDb->lastId();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_iEventId) {
            $oDb->query("DELETE FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $this->_iEventId]);
            foreach (['photos', 'videos', 'files', 'links'] as $sType)
                if ($oDb->isTableExists('bx_timeline_ef_' . $sType))
                    $oDb->query("DELETE FROM `bx_timeline_ef_" . $sType . "` WHERE `event_id` = :id", ['id' => $this->_iEventId]);
            $oDb->query("DELETE FROM `sys_seo_links` WHERE `module` = 'bx_timeline' AND `param_value` = :id", ['id' => $this->_iEventId]);
        }
        if ($this->_iContentId) {
            $oDb->query("DELETE FROM `bx_forum_discussions` WHERE `id` = :id", ['id' => $this->_iContentId]);
            $oDb->query("DELETE FROM `sys_seo_links` WHERE `module` = 'bx_forum' AND `param_value` = :id", ['id' => $this->_iContentId]);
        }

        foreach ($this->_aIsApiBackup as $aBackup)
            $this->bxSetProtected($aBackup[0], '_bIsApi', $aBackup[1], $aBackup[2]);

        $this->resetObjectInstances();
        if (class_exists('BxTimelineTemplate', false))
            (new ReflectionProperty(BxTimelineTemplate::class, '_aMemoryCacheItemsUrl'))->setValue(null, []);

        if ($this->_sExtendedUnitsBackup !== null)
            setParam('sys_api_extended_units', $this->_sExtendedUnitsBackup);

        if ($this->_mixedProfilerBackup !== null)
            $GLOBALS['bx_profiler'] = $this->_mixedProfilerBackup;
        else
            unset($GLOBALS['bx_profiler']);

        $oDb->cleanMemoryAll();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function event(): array
    {
        return BxDolDb::getInstance()->getRow("SELECT * FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $this->_iEventId]);
    }

    /**
     * The template behind the module's proxy, so methods get the event by reference.
     */
    protected function template(): BxTimelineTemplate
    {
        $oProxy = BxDolModule::getInstance('bx_timeline')->_oTemplate;
        return (new ReflectionProperty(BxDolModuleProxy::class, '_oProxifiedObject'))->getValue($oProxy);
    }

    protected function setApi($o, string $sClass, bool $bApi): void
    {
        $this->_aIsApiBackup[] = [$o, $this->bxGetProtected($o, '_bIsApi', $sClass), $sClass];
        $this->bxSetProtected($o, '_bIsApi', $bApi, $sClass);
    }

    /**
     * Menus and the fixture's comments, views and votes objects are cached per request
     * and read the API mode when they are created.
     */
    protected function resetObjectInstances(): void
    {
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (preg_match('/^(BxDolMenu!bx_timeline_menu_item_(share|actions|manage|counters)$|BxDol(Cmts|Vote|View)!bx_forum)/', $sKey))
                unset($GLOBALS['bxDolClasses'][$sKey]);
    }

    /**
     * Element data of the API menu's items, by item name.
     */
    protected function elementsByName(array $aMenu): array
    {
        $aResult = [];
        foreach ($aMenu['items'] ?? [] as $aItem)
            if (is_array($aItem) && ($aItem['display_type'] ?? '') === 'element' && isset($aItem['data']['system']))
                $aResult[$aItem['name']] = $aItem['data'];

        return $aResult;
    }

    /**
     * The value without 'ts', the build time every API element carries.
     */
    protected function withoutTs($mixedValue)
    {
        if (!is_array($mixedValue))
            return $mixedValue;

        unset($mixedValue['ts']);
        return array_map([$this, 'withoutTs'], $mixedValue);
    }

    /**
     * Run the callback and return the SQL statements and service calls it made.
     */
    protected function record(callable $fCallback): TimelineFeedApiTestRecorder
    {
        $oRecorder = new TimelineFeedApiTestRecorder();
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

        return $oRecorder;
    }

    public function testFeedReadsDoNotRewriteTheEvent(): void
    {
        $oTemplate = $this->template();

        $aEvent = $this->event();
        $this->assertNotFalse($oTemplate->getData($aEvent), 'The fixture event has data.');

        $aEvent = $this->event();
        $oRecorder = $this->record(function () use ($oTemplate, &$aEvent) {
            $oTemplate->getData($aEvent);
        });
        $this->assertSame([], $oRecorder->writes('bx_timeline_events'), 'Nothing changed, so nothing is written.');

        //--- A stale owner is still put right.
        BxDolDb::getInstance()->query("UPDATE `bx_timeline_events` SET `object_owner_id` = 0 WHERE `id` = :id", ['id' => $this->_iEventId]);
        $aEvent = $this->event();
        $oRecorder = $this->record(function () use ($oTemplate, &$aEvent) {
            $oTemplate->getData($aEvent);
        });
        $this->assertCount(1, $oRecorder->writes('bx_timeline_events'));
        $this->assertSame($this->_iAuthorId, (int)$this->event()['object_owner_id']);
    }

    /**
     * A profile's 'added' event is shown to its author only: the profile module returns
     * privacy 2, and the feed stores it on the event.
     */
    public function testFeedReadsWritePrivacyOnlyWhenItChanges(): void
    {
        $oProfile = BxDolProfile::getInstance($this->_iAuthorId);
        if (!$oProfile || $oProfile->getModule() != 'bx_persons' || !BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('The admin has no Persons profile.');

        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_timeline_events` SET `owner_id` = :author, `system` = 1, `type` = 'bx_persons', `action` = 'added', `object_id` = :content, `object_owner_id` = :author, `object_privacy_view` = '3', `content` = '', `source` = '', `title` = 'TimelineFeedApiTest profile event', `description` = 'TimelineFeedApiTest profile event', `labels` = '', `location` = '', `date` = :now, `published` = :now", [
            'author' => $this->_iAuthorId,
            'content' => $oProfile->getContentId(),
            'now' => time(),
        ]);
        $iEventId = (int)$oDb->lastId();

        try {
            $fEvent = fn() => $oDb->getRow("SELECT * FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $iEventId]);
            $oTemplate = $this->template();

            $aEvent = $fEvent();
            $oRecorder = $this->record(function () use ($oTemplate, &$aEvent) {
                $oTemplate->getData($aEvent);
            });
            $this->assertCount(1, $oRecorder->writes('bx_timeline_events'), 'A changed privacy is written.');
            $this->assertSame('2', (string)$fEvent()['object_privacy_view']);

            $aEvent = $fEvent();
            $oRecorder = $this->record(function () use ($oTemplate, &$aEvent) {
                $oTemplate->getData($aEvent);
            });
            $this->assertSame([], $oRecorder->writes('bx_timeline_events'), 'An unchanged privacy is not written again.');
        }
        finally {
            $oDb->query("DELETE FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $iEventId]);
            $oDb->query("DELETE FROM `sys_seo_links` WHERE `module` = 'bx_timeline' AND `param_value` = :id", ['id' => $iEventId]);
        }
    }

    public function testApiShareMenuTakesTheUrlFromTheFeed(): void
    {
        $_GET['api'] = 1;
        $oTemplate = $this->template();
        $this->setApi($oTemplate, BxBaseModGeneralTemplate::class, true);

        $oMenu = BxDolMenu::getObjectInstance('bx_timeline_menu_item_share');
        $this->assertInstanceOf(BxTimelineMenuItemShare::class, $oMenu);
        $this->setApi($oMenu, BxDolMenu::class, true);

        $aEvent = $this->event();
        $aParams = ['view' => BX_TIMELINE_VIEW_TIMELINE, 'type' => BX_TIMELINE_TYPE_DEFAULT, 'viewer_id' => $this->_iAuthorId];
        $this->assertSame('OK', $oTemplate->getPost($aEvent, $aParams), 'The feed renders the fixture event.');
        $this->assertNotFalse($oTemplate->getItemUrlCached($this->_iEventId));

        $aItems = [];
        $oRecorder = $this->record(function () use ($oMenu, &$aItems) {
            $oMenu->setEventById($this->_iEventId);
            $aItems = $oMenu->getCodeAPI();
        });
        $this->assertSame([], $oRecorder->services('get_timeline_post'), 'The post is not built again for the menu.');
        $this->assertSame([], $oRecorder->writes(), 'The menu writes nothing.');

        $aMarkers = $this->bxGetProtected($oMenu, '_aMarkers', BxDolMenu::class);
        foreach (['repost_onclick', 'repost_with_onclick', 'repost_to_onclick'] as $sMarker)
            $this->assertSame('', $aMarkers[$sMarker], $sMarker . ' is not built for API menus.');

        //--- Without the url from the feed the menu asks the content module, as before, and shows the same items.
        (new ReflectionProperty(BxTimelineTemplate::class, '_aMemoryCacheItemsUrl'))->setValue(null, []);
        $aItemsUncached = [];
        $oRecorder = $this->record(function () use ($oMenu, &$aItemsUncached) {
            $oMenu->setEventById($this->_iEventId);
            $aItemsUncached = $oMenu->getCodeAPI();
        });
        $this->assertNotSame([], $oRecorder->services('get_timeline_post'));
        $this->assertSame($aItemsUncached, $aItems);
    }

    public function testApiCountersMenuReusesActionsElements(): void
    {
        $_GET['api'] = 1;
        $this->resetObjectInstances();

        $aParams = ['view' => BX_TIMELINE_VIEW_TIMELINE, 'type' => BX_TIMELINE_TYPE_DEFAULT];

        $oCounters = BxDolMenu::getObjectInstance('bx_timeline_menu_item_counters');
        $this->assertInstanceOf(BxTimelineMenuItemCounters::class, $oCounters);
        $oCounters->setEventById($this->_iEventId, $aParams);
        $aEvent = $this->bxGetProtected($oCounters, '_aEvent', BxTimelineMenuItemActions::class);
        $this->assertNotEmpty($aEvent['comments']['system'] ?? '', 'The fixture event has comments.');

        //--- Without the Actions menu in the event the Counters menu builds every element itself, as before.
        $aBase = [];
        $oBase = $this->record(function () use ($oCounters, &$aBase) {
            $aBase = $oCounters->getCodeAPI();
        });
        $this->assertArrayHasKey('item-comment', $this->elementsByName($aBase));
        $this->assertNotSame([], $oBase->queries('`bx_forum_cmts`'), 'The comment counter reads the latest comments.');

        //--- BxTimelineTemplate::_getPostApi puts the Actions menu into the event before it builds the Counters menu.
        $oActions = BxDolMenu::getObjectInstance('bx_timeline_menu_item_actions');
        $this->assertInstanceOf(BxTimelineMenuItemActions::class, $oActions);
        $this->assertTrue($oActions->setEvent($aEvent, $aParams));
        $aEvent['menu_actions'] = $oActions->getCodeAPI();
        $aActionsElements = $this->elementsByName($aEvent['menu_actions']);
        $this->assertArrayHasKey('item-comment', $aActionsElements);

        $this->assertTrue($oCounters->setEvent($aEvent, $aParams));
        $aReused = [];
        $oReused = $this->record(function () use ($oCounters, &$aReused) {
            $aReused = $oCounters->getCodeAPI();
        });
        $this->assertSame($this->withoutTs($aBase), $this->withoutTs($aReused), 'The Counters menu returns the same items.');

        $aShared = array_intersect_key($this->elementsByName($aReused), $aActionsElements);
        $this->assertArrayHasKey('item-comment', $aShared);
        foreach ($aShared as $sName => $aElement)
            $this->assertSame($aActionsElements[$sName], $aElement, $sName . ' is the element the Actions menu built, ts included.');
        $this->assertSame([], $oReused->queries('`bx_forum_cmts`'), 'The latest comments are not read again.');
        $this->assertLessThan(count($oBase->aQueries), count($oReused->aQueries));

        //--- An element the Actions menu didn't build for this object (hidden for the viewer, another object) is built in full.
        $aEventOther = $aEvent;
        foreach ($aEventOther['menu_actions']['items'] as $iKey => $aItem) {
            if (($aItem['name'] ?? '') === 'item-reaction')
                unset($aEventOther['menu_actions']['items'][$iKey]);
            else if (($aItem['name'] ?? '') === 'item-comment')
                $aEventOther['menu_actions']['items'][$iKey]['data']['object_id'] = 0;
        }
        $this->assertTrue($oCounters->setEvent($aEventOther, $aParams));
        $aFallback = [];
        $oFallback = $this->record(function () use ($oCounters, &$aFallback) {
            $aFallback = $oCounters->getCodeAPI();
        });
        $this->assertSame($this->withoutTs($aBase), $this->withoutTs($aFallback));
        $this->assertNotSame([], $oFallback->queries('`bx_forum_cmts`'), 'The comment element is built again.');
    }

    public function testApiTimelinePostSkipsAttachments(): void
    {
        $oForum = BxDolModule::getInstance('bx_forum');
        $aContent = BxDolDb::getInstance()->getRow("SELECT * FROM `bx_forum_discussions` WHERE `id` = :id", ['id' => $this->_iContentId]);
        $aEvent = $this->event();

        $this->setApi($oForum, BxBaseModGeneralModule::class, false);
        $oRecorder = $this->record(function () use ($oForum, $aEvent, $aContent) {
            $this->bxCallProtected($oForum, '_getContentForTimelinePost', $aEvent, $aContent, []);
        });
        $this->assertNotSame([], $oRecorder->queries('sys_storage_ghosts'), 'The web feed looks for attachments.');

        $this->setApi($oForum, BxBaseModGeneralModule::class, true);
        $this->_sExtendedUnitsBackup = getParam('sys_api_extended_units');
        $fRun = function () use ($oForum, $aEvent, $aContent, &$aResult) {
            $aResult = $this->bxCallProtected($oForum, '_getContentForTimelinePost', $aEvent, $aContent, []);
        };

        setParam('sys_api_extended_units', '');
        $aResult = [];
        $oRecorder = $this->record($fRun);
        $this->assertSame([], $oRecorder->queries('sys_storage_ghosts'), 'API units have no attachments to look for.');
        $this->assertSame(['url', 'title', 'abstract', 'text'], array_slice(array_keys($aResult), 0, 4));
        $this->assertSame([], preg_grep('/_attach$/', array_keys($aResult)));

        setParam('sys_api_extended_units', 'on');
        $aResult = [];
        $oRecorder = $this->record($fRun);
        $this->assertNotSame([], $oRecorder->queries('sys_storage_ghosts'), 'Extended API units return attachments.');
        $this->assertArrayHasKey('images_attach', $aResult);
    }
}

/**
 * Takes the place of $GLOBALS['bx_profiler'] to see the queries and service calls of a test.
 */
class TimelineFeedApiTestRecorder
{
    public array $aQueries = [];
    public array $aServices = [];

    public function beginQuery($sSql)
    {
        $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql);
    }

    public function beginModule($sType, $sHash, $aModule, $sClass = '', $sMethod = '')
    {
        if ($sType == 'service')
            $this->aServices[] = ($aModule['name'] ?? '') . ':' . $sMethod;
    }

    public function __call($sName, $aArgs)
    {
        return null;
    }

    public function queries(string $sNeedle): array
    {
        return array_values(array_filter($this->aQueries, fn($s) => stripos($s, $sNeedle) !== false));
    }

    public function writes(string $sTable = ''): array
    {
        return array_values(array_filter($this->aQueries, fn($s) => preg_match('/^\s*(UPDATE|INSERT|DELETE|REPLACE)\b/i', $s) && ($sTable === '' || stripos($s, '`' . $sTable . '`') !== false)));
    }

    public function services(string $sNeedle): array
    {
        $sNeedle = str_replace('_', '', $sNeedle);
        return array_values(array_filter($this->aServices, fn($s) => stripos(str_replace('_', '', $s), $sNeedle) !== false));
    }
}
