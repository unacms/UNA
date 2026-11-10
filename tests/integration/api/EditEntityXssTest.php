<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The generic "edit content" service (BxBaseModGeneralModule::serviceEditEntity,
 * exposed to logged-in members through the api.php "edit_entity" safe service)
 * must clean caller-supplied field values through each form input's own db pass.
 *
 * Before the fix the values were handed to BxDolForm::update() as "manually
 * provided" values, which BxDolFormChecker::serializeDbValues() writes into the
 * SQL after the per-input passes run. An html field (db pass XssHtml) was
 * therefore stored exactly as received and rendered back without filtering -
 * stored XSS in a member's own content.
 */
#[Group('integration')]
class EditEntityXssTest extends BxDolIntegrationTestCase
{
    private const MARK = 'EditEntityXssTest';

    // <script>, an event handler and a javascript: URL - all stripped by XssHtml.
    private const HOSTILE =
        '<p>' . self::MARK . ' clean</p>'
        . '<script>window.__editEntityXss=1</script>'
        . '<img src=x onerror="window.__editEntityXss=1">'
        . '<a href="javascript:window.__editEntityXss=1">x</a>';

    protected $_iPostId = 0;
    protected $_iEventId = 0;
    protected $_iEventProfileId = 0;

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();

        if ($this->_iPostId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $this->_iPostId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $this->_iPostId]);
            $this->_iPostId = 0;
        }
        if ($this->_iEventProfileId) {
            $oDb->query("DELETE FROM `sys_profiles` WHERE `id` = :id", ['id' => $this->_iEventProfileId]);
            $this->_iEventProfileId = 0;
        }
        if ($this->_iEventId) {
            BxDolPage::deleteSeoLink('bx_events', 'bx_events', $this->_iEventId);
            $oDb->query("DELETE FROM `bx_events_data` WHERE `id` = :id", ['id' => $this->_iEventId]);
            $this->_iEventId = 0;
        }

        unset($GLOBALS['bxDolClasses']['BxPostsModule'], $GLOBALS['bxDolClasses']['BxEventsModule']);

        parent::tearDown();
    }

    public function testEditEntityFiltersHtmlInOwnContent(): void
    {
        $this->requirePosts();
        $this->bxLoginAsUser();
        $iPost = $this->addOwnPost();

        $oModule = BxDolModule::getInstance('bx_posts');
        $sResult = $oModule->serviceEditEntity($iPost, ['text' => self::HOSTILE]);

        $this->assertSame('', $sResult, 'A member editing their own post should succeed.');
        $this->assertStored($iPost);
    }

    public function testEditEntityFiltersHtmlFromApiStringPayload(): void
    {
        $this->requirePosts();
        $this->bxLoginAsUser();
        $iPost = $this->addOwnPost();

        // Reproduce the api.php path: _bIsApi is set and the values arrive as a
        // JSON string, decoded by bx_api_get_browse_params() inside the service.
        $oModule = BxDolModule::getInstance('bx_posts');
        $oReflection = new ReflectionClass(get_parent_class($oModule) ?: $oModule);
        while ($oReflection && !$oReflection->hasProperty('_bIsApi'))
            $oReflection = $oReflection->getParentClass();
        $this->assertNotFalse($oReflection, 'Module should expose the _bIsApi flag.');
        $oProp = $oReflection->getProperty('_bIsApi');
        $oProp->setAccessible(true);
        $oProp->setValue($oModule, true);

        $sResult = $oModule->serviceEditEntity($iPost, json_encode(['text' => self::HOSTILE]));

        $oProp->setValue($oModule, false);

        $this->assertSame('', $sResult, 'A member editing their own post over the API should succeed.');
        $this->assertStored($iPost);
    }

    public function testEditEntityKeepsTimestampDateField(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_events'))
            $this->markTestSkipped('Events are not installed.');

        $this->bxLoginAsUser();
        $iEvent = $this->addOwnEvent();

        // 'date_start' is a DateTimeUtc field: stored as a unix timestamp, and
        // a service caller (edit_entity / system+update) sends that timestamp,
        // not a form-format date string.
        $iStamp = 1794268800; // fixed unix timestamp

        $oModule = BxDolModule::getInstance('bx_events');
        $sResult = $oModule->serviceEditEntity($iEvent, ['date_start' => $iStamp]);
        $this->assertSame('', $sResult, 'A member editing their own event should succeed.');

        $iStored = (int)BxDolDb::getInstance()->getOne("SELECT `date_start` FROM `bx_events_data` WHERE `id` = :id", ['id' => $iEvent]);
        $this->assertSame($iStamp, $iStored, 'A timestamp sent to a date field must be stored unchanged, not zeroed.');
    }

    protected function assertStored(int $iPost): void
    {
        $sStored = (string)BxDolDb::getInstance()->getOne("SELECT `text` FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iPost]);

        // the benign markup survives, the attack payload does not
        $this->assertStringContainsString(self::MARK . ' clean', $sStored);
        $this->assertStringNotContainsStringIgnoringCase('<script', $sStored);
        $this->assertStringNotContainsStringIgnoringCase('onerror', $sStored);
        $this->assertStringNotContainsStringIgnoringCase('javascript:', $sStored);
    }

    protected function requirePosts(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');
    }

    protected function addOwnPost(): int
    {
        $iAuthor = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $iAuthor, 'A member must be logged in to own the post.');

        $iNow = time();
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'thumb' => 0,
            'thumb_data' => '',
            'title' => self::MARK . ' post',
            'cat' => 0,
            'multicat' => '',
            'abstract' => '',
            'text' => '<p>' . self::MARK . ' original</p>',
            'labels' => '',
            'location' => '',
            'allow_view_to' => BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
        ]));
        $this->_iPostId = (int)$oDb->lastId();

        return $this->_iPostId;
    }

    protected function addOwnEvent(): int
    {
        $iAuthor = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $iAuthor, 'A member must be logged in to own the event.');

        $iNow = time();
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_events_data` SET " . $oDb->arrayToSQL([
            'author' => $iAuthor,
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'picture' => 0,
            'cover' => 0,
            'cover_data' => '',
            'event_name' => self::MARK . ' event',
            'event_cat' => 0,
            'event_desc' => '<p>' . self::MARK . '</p>',
            'hashtag' => '',
            'date_start' => $iNow,
            'date_end' => $iNow,
            'labels' => '',
            'location' => '',
            'allow_view_to' => (string)BX_DOL_PG_ALL,
            'status' => 'active',
            'status_admin' => 'active',
        ]));
        $this->_iEventId = (int)$oDb->lastId();

        // Events are context profiles; the module's content lookup inner-joins
        // sys_profiles, so the entry needs its own profile row (owned by the
        // logged-in member) to be editable.
        $iAccountId = (int)BxDolProfile::getInstance($iAuthor)->getAccountId();
        $oDb->query("INSERT INTO `sys_profiles` SET " . $oDb->arrayToSQL([
            'account_id' => $iAccountId,
            'type' => 'bx_events',
            'content_id' => $this->_iEventId,
            'status' => 'active',
        ]));
        $this->_iEventProfileId = (int)$oDb->lastId();

        return $this->_iEventId;
    }
}
