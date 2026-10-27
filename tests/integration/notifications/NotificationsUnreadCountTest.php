<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Work the unread notifications count saves on every poll: the two live updates of one
 * request share the count, and a processed event gives its content object id from its
 * stored content instead of having the whole notification built.
 */
#[Group('integration')]
class NotificationsUnreadCountTest extends BxDolIntegrationTestCase
{
    protected $_oTemplateBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications'))
            $this->markTestSkipped('Notifications are not installed.');

        $oModule = $this->module(); // loads the class before the reflection below
        $this->memo()->setValue($oModule, []);
    }

    protected function tearDown(): void
    {
        if ($this->_oTemplateBackup !== null)
            $this->setTemplate($this->_oTemplateBackup);

        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_notifications')) {
            $oModule = $this->module();
            $this->memo()->setValue($oModule, []);
        }

        parent::tearDown();
    }

    protected function module(): BxNtfsModule
    {
        return BxDolModule::getInstance('bx_notifications');
    }

    protected function memo(): ReflectionProperty
    {
        return new ReflectionProperty(BxNtfsModule::class, '_aLiveUpdatesUnreadNum');
    }

    /**
     * Put a template in the module's place; BxDolModule keeps it in a private store.
     */
    protected function setTemplate($oTemplate): void
    {
        $oStore = new ReflectionProperty(BxDolModule::class, '_aInstancesStorage');
        $aStore = $oStore->getValue($this->module());
        $aStore['_oTemplate'] = $oTemplate;
        $oStore->setValue($this->module(), $aStore);
    }

    /**
     * A template that counts getPost calls and processes an unprocessed event the simple way.
     */
    protected function spyTemplate()
    {
        $oModule = $this->module();
        $this->_oTemplateBackup = $oModule->_oTemplate;

        $oConfig = $oModule->_oConfig;
        $oDb = $oModule->_oDb;
        $oSpy = new class($oConfig, $oDb) extends BxNtfsTemplate {
            public int $iPosts = 0;

            public function getPost(&$aEvent, $aBrowseParams = array())
            {
                $this->iPosts++;
                $aEvent['processed'] = 1;
                $aEvent['content'] = ['object_id' => 7];
                return 'post';
            }
        };
        $this->setTemplate($oSpy);

        return $oSpy;
    }

    protected function contentObjectId(array &$aEvent)
    {
        $fCall = Closure::bind(fn(&$aEvent) => $this->_getContentObjectId($aEvent, []), $this->module(), BxNtfsModule::class);
        return $fCall($aEvent);
    }

    public function testProcessedEventGivesItsStoredObjectId(): void
    {
        $oSpy = $this->spyTemplate();

        $aEvent = ['type' => 'bx_posts', 'action' => 'replyPost', 'object_id' => 5, 'processed' => 1, 'content' => serialize(['object_id' => 42, 'entry_caption' => 'x'])];
        $this->assertSame(42, $this->contentObjectId($aEvent));
        $this->assertSame(0, $oSpy->iPosts, 'The notification is not built.');
        $this->assertIsArray($aEvent['content'], 'The content is read as the post would read it.');

        $aEvent = ['type' => 'bx_posts', 'action' => 'commentPost', 'object_id' => 5, 'processed' => 1, 'content' => ['object_id' => 9]];
        $this->assertSame(9, $this->contentObjectId($aEvent));
        $this->assertSame(0, $oSpy->iPosts);
    }

    public function testUnprocessedEventIsBuiltOnce(): void
    {
        $oSpy = $this->spyTemplate();

        $aEvent = ['type' => 'bx_posts', 'action' => 'replyPost', 'object_id' => 5, 'processed' => 0, 'content' => ''];
        $this->assertSame(7, $this->contentObjectId($aEvent));
        $this->assertSame(1, $oSpy->iPosts, 'Building the post processes the event.');
    }

    public function testLiveUpdatesOfOnePollShareTheCount(): void
    {
        $this->bxLoginAsAdmin();
        $oModule = $this->module();

        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = $sSql; }
            public function __call($sName, $aArgs) { return null; }
        };

        $fEventsQueries = fn() => count(array_filter($oRecorder->aQueries, fn($s) => stripos($s, 'bx_notifications_events') !== false));

        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $mixedMenu = $oModule->serviceGetLiveUpdates(['name' => 'menu'], ['name' => 'notifications'], -1);
            $iFirst = $fEventsQueries();
            $mixedToolbar = $oModule->serviceGetLiveUpdates(['name' => 'toolbar'], ['name' => 'notifications'], -1);
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        $this->assertGreaterThan(0, $iFirst, 'The first live update counts.');
        $this->assertSame($iFirst, $fEventsQueries(), 'The second one takes the same count.');
        $this->assertSame($mixedMenu['count'], $mixedToolbar['count']);
        $this->assertSame($oModule->serviceGetUnreadNotificationsNum(), $mixedMenu['count']);
    }
}
