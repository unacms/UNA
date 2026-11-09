<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Hashtag suggestions (the # list in editors) come from the keywords of public and active content only.
 * A guest must not get hashtags of private group, members-only or friends-only posts, nor of posts
 * which are hidden or awaiting.
 *
 * The test makes its own posts and keywords and deletes them, so it runs on any site with Posts installed.
 */
#[Group('integration')]
class HashtagSuggestionsVisibilityTest extends BxDolIntegrationTestCase
{
    protected const PREFIX = 'zqhtvis';

    protected $_aIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('Posts are not installed.');

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aIds as $iId) {
            $oDb->query("DELETE FROM `bx_posts_meta_keywords` WHERE `object_id` = :id", ['id' => $iId]);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iId]);
        }
        $oDb->cleanMemoryAll();

        parent::tearDown();
    }

    protected function addPost(string $sKeyword, string $sAllowViewTo = '3', string $sStatus = 'active', string $sStatusAdmin = 'active'): int
    {
        $oDb = BxDolDb::getInstance();
        $iNow = time();

        $oDb->query("INSERT INTO `bx_posts_posts` SET `author` = 0, `added` = :added, `changed` = :changed, `published` = :published, `title` = :title, `text` = '', `allow_view_to` = :view, `status` = :status, `status_admin` = :status_admin", [
            'added' => $iNow,
            'changed' => $iNow,
            'published' => $iNow,
            'title' => $sKeyword,
            'view' => $sAllowViewTo,
            'status' => $sStatus,
            'status_admin' => $sStatusAdmin,
        ]);
        $iId = (int)$oDb->lastId();
        $this->_aIds[] = $iId;

        $oDb->query("INSERT INTO `bx_posts_meta_keywords` SET `object_id` = :id, `keyword` = :keyword", ['id' => $iId, 'keyword' => $sKeyword]);

        $oDb->cleanMemoryAll();

        return $iId;
    }

    protected function suggested(): array
    {
        $a = BxDolMetatags::getMetatagsDataByTerm('keywords', 'keyword', self::PREFIX);

        return array_map('strval', array_keys($a));
    }

    public function testPublicActivePostIsSuggested(): void
    {
        $this->addPost(self::PREFIX . 'public');

        $this->assertContains(self::PREFIX . 'public', $this->suggested());
    }

    public function testPrivateGroupPostIsNotSuggested(): void
    {
        $this->addPost(self::PREFIX . 'secret', '-2147483000');
        $this->addPost(self::PREFIX . 'public');

        $a = $this->suggested();
        $this->assertContains(self::PREFIX . 'public', $a);
        $this->assertNotContains(self::PREFIX . 'secret', $a);
    }

    public function testMembersOnlyAndFriendsOnlyPostsAreNotSuggested(): void
    {
        $this->addPost(self::PREFIX . 'members', '2');
        $this->addPost(self::PREFIX . 'friends', '4');
        $this->addPost(self::PREFIX . 'owner', '1');

        $a = $this->suggested();
        $this->assertNotContains(self::PREFIX . 'members', $a);
        $this->assertNotContains(self::PREFIX . 'friends', $a);
        $this->assertNotContains(self::PREFIX . 'owner', $a);
    }

    public function testAwaitingAndHiddenPostsAreNotSuggested(): void
    {
        $this->addPost(self::PREFIX . 'awaiting', '3', 'awaiting');
        $this->addPost(self::PREFIX . 'hidden', '3', 'hidden');
        $this->addPost(self::PREFIX . 'pending', '3', 'active', 'pending');
        $this->addPost(self::PREFIX . 'adminhidden', '3', 'active', 'hidden');

        $a = $this->suggested();
        $this->assertNotContains(self::PREFIX . 'awaiting', $a);
        $this->assertNotContains(self::PREFIX . 'hidden', $a);
        $this->assertNotContains(self::PREFIX . 'pending', $a);
        $this->assertNotContains(self::PREFIX . 'adminhidden', $a);
    }

    public function testQueryRunsForEveryInstalledMetatagsObject(): void
    {
        $aObjects = BxDolMetatagsQuery::getMetatagsObjects();
        $this->assertNotEmpty($aObjects);

        foreach ($aObjects as $aObject) {
            $oMetatags = BxDolMetatags::getObjectInstance($aObject['object']);
            if (!$oMetatags || !$oMetatags->keywordsIsEnabled())
                continue;

            $oQuery = new BxDolMetatagsQuery($aObject);
            $this->assertIsArray($oQuery->keywordsGetByTerm(self::PREFIX), $aObject['object']);
        }
    }

    public function testKeywordWithoutContentIsNotSuggested(): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_posts_meta_keywords` SET `object_id` = 2147483000, `keyword` = :keyword", ['keyword' => self::PREFIX . 'orphan']);
        $oDb->cleanMemoryAll();

        try {
            $this->assertNotContains(self::PREFIX . 'orphan', $this->suggested());
        } finally {
            $oDb->query("DELETE FROM `bx_posts_meta_keywords` WHERE `object_id` = 2147483000");
        }
    }
}
