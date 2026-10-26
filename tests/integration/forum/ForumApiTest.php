<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Discussions for the app: every discussion names its category (with the
 * icon the site uses when Studio sets none), and the unit meta sends the
 * reactions element.
 *
 * The test makes its own discussion and image, and restores the category
 * icon row it changes, so it runs on any site with Discussions installed.
 */
#[Group('integration')]
class ForumApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aContent;
    protected $_aCategoryRow;
    protected $_iImageId = 0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum'))
            $this->markTestSkipped('Discussions are not installed.');

        $oDb = BxDolDb::getInstance();
        $iCategory = (int)$oDb->getOne("SELECT `Value` FROM `sys_form_pre_values` WHERE `Key` = 'bx_forum_cats' AND `Value` <> '' ORDER BY `Order` LIMIT 1");
        $this->assertGreaterThan(0, $iCategory, 'Discussions install at least one category.');

        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_forum_discussions` SET `author` = :author, `added` = :now, `changed` = :now, `lr_timestamp` = :now, `thumb` = 0, `thumb_data` = '', `title` = 'ForumApiTest discussion', `cat` = :cat, `multicat` = '', `text` = '<p>Fixture</p>', `text_comments` = '', `lr_profile_id` = :author, `lr_comment_id` = 0, `labels` = ''", [
            'author' => $iAuthor,
            'now' => $iNow,
            'cat' => $iCategory,
        ]);
        $this->_aContent = $oDb->getRow("SELECT * FROM `bx_forum_discussions` WHERE `id` = :id", ['id' => (int)$oDb->lastId()]);

        // The tests change the category's icon row; keep the original to restore it.
        $this->_aCategoryRow = $oDb->getRow("SELECT * FROM `bx_forum_categories` WHERE `category` = :category", ['category' => $iCategory]);
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if (!empty($this->_aContent)) {
            $iCategory = (int)$this->_aContent['cat'];
            $oDb->query("DELETE FROM `bx_forum_categories` WHERE `category` = :category", ['category' => $iCategory]);
            if (!empty($this->_aCategoryRow))
                $oDb->query("INSERT INTO `bx_forum_categories` SET `category` = :category, `visible_for_levels` = :levels, `icon` = :icon", [
                    'category' => $iCategory,
                    'levels' => (int)$this->_aCategoryRow['visible_for_levels'],
                    'icon' => $this->_aCategoryRow['icon'],
                ]);
            $oDb->query("DELETE FROM `bx_forum_discussions` WHERE `id` = :id", ['id' => (int)$this->_aContent['id']]);
        }
        if ($this->_iImageId)
            BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->deleteFile($this->_iImageId, 0);
        $oDb->cleanMemoryAll();

        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function setCategoryIcon(?string $sIcon): void
    {
        $oDb = BxDolDb::getInstance();
        $iCategory = (int)$this->_aContent['cat'];
        $oDb->query("DELETE FROM `bx_forum_categories` WHERE `category` = :category", ['category' => $iCategory]);
        if ($sIcon !== null)
            $oDb->query("INSERT INTO `bx_forum_categories` SET `category` = :category, `icon` = :icon", ['category' => $iCategory, 'icon' => $sIcon]);
        $oDb->cleanMemoryAll();
    }

    protected function decode(array $aContent): array
    {
        $aResult = BxDolModule::getInstance('bx_forum')->decodeDataApi($aContent);
        $this->assertIsArray($aResult);

        return $aResult;
    }

    public function testCategoryWithoutIconRowFallsBackToFolder(): void
    {
        $this->setCategoryIcon(null);

        $aResult = $this->decode($this->_aContent);

        $this->assertArrayHasKey('category', $aResult);
        $this->assertNotSame('', $aResult['category']['name']);
        $this->assertSame('folder', $aResult['category']['icon']);
    }

    public function testCategoryIconFromStudio(): void
    {
        $this->setCategoryIcon('💬');

        $this->assertSame('💬', $this->decode($this->_aContent)['category']['icon']);
    }

    public function testUploadedIconIsSentAsItsUrl(): void
    {
        // tempnam() creates its own file; the image goes next to it with a .png name.
        $sTmp = tempnam(sys_get_temp_dir(), 'bxforum');
        $sPath = $sTmp . '.png';
        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        try {
            copy(BX_DIRECTORY_PATH_ROOT . 'template/images/acl-account.png', $sPath);
            $this->_iImageId = (int)$oStorage->storeFileFromPath($sPath, false, 0);
        }
        finally {
            @unlink($sPath);
            @unlink($sTmp);
        }
        if (!$this->_iImageId)
            $this->fail('Store the icon image: ' . $oStorage->getErrorString());

        $this->setCategoryIcon((string)$this->_iImageId);

        $sUrl = $oStorage->getFileUrlById($this->_iImageId);
        $this->assertNotEmpty($sUrl);
        $this->assertSame($sUrl, $this->decode($this->_aContent)['category']['icon']);
    }

    public function testMissingUploadedIconIsNeverTheBareId(): void
    {
        // A storage id with no file behind it: no URL, and never the id.
        $this->setCategoryIcon('2147483000');

        $this->assertSame('', $this->decode($this->_aContent)['category']['icon']);
    }

    public function testNoCategoryNoKey(): void
    {
        $aResult = $this->decode(array_merge($this->_aContent, ['cat' => 0]));

        $this->assertArrayNotHasKey('category', $aResult);
    }

    public function testUnitMetaSendsReactionsElement(): void
    {
        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        // Reactions on for this test only (in memory, the site setting is untouched).
        $aSystems = &BxDolVote::getSystems();
        $iIsOn = $aSystems['bx_forum_reactions']['is_on'] ?? null;
        $this->assertNotNull($iIsOn, 'Discussions install the bx_forum_reactions object.');
        $aSystems['bx_forum_reactions']['is_on'] = 1;
        $sVoteKey = 'BxDolVote!bx_forum_reactions' . (int)$this->_aContent['id'];
        unset($GLOBALS['bxDolClasses'][$sVoteKey]);

        $oMenu = BxDolMenu::getObjectInstance('bx_forum_snippet_meta_main');
        $this->assertInstanceOf(BxBaseModGeneralMenuSnippetMeta::class, $oMenu);
        $oIsApi = new ReflectionProperty($oMenu, '_bIsApi');
        $bIsApi = $oIsApi->getValue($oMenu);

        try {
            $oIsApi->setValue($oMenu, true);
            $oMenu->setContentId((int)$this->_aContent['id']);

            $aItem = $this->bxCallProtected($oMenu, '_getMenuItemReactions', ['id' => 1, 'name' => 'reactions']);
        }
        finally {
            // The menu and vote instances are shared: put them back as they were.
            $oIsApi->setValue($oMenu, $bIsApi);
            $aSystems['bx_forum_reactions']['is_on'] = $iIsOn;
            unset($GLOBALS['bxDolClasses'][$sVoteKey]);
        }

        $this->assertIsArray($aItem);
        $this->assertSame('element', $aItem['display_type']);
        $this->assertSame('reactions', $aItem['data']['type']);
        $this->assertSame((int)$this->_aContent['id'], (int)$aItem['data']['object_id']);
    }

    public function testCommentsCounterNamesAuthorWithoutComments(): void
    {
        $this->bxLoginAsAdmin();
        $_GET['api'] = 1;

        // A fresh instance in API mode; the shared one may have been built for the web.
        $sCmtsKey = 'BxDolCmts!bx_forum' . (int)$this->_aContent['id'];
        unset($GLOBALS['bxDolClasses'][$sCmtsKey]);
        try {
            $oCmts = BxDolCmts::getObjectInstance('bx_forum', (int)$this->_aContent['id']);
            $this->assertInstanceOf(BxForumCmts::class, $oCmts);

            $aElement = $oCmts->getElementAPI();
        }
        finally {
            unset($GLOBALS['bxDolClasses'][$sCmtsKey]);
        }

        if (!is_array($aElement) || empty($aElement['counter']))
            $this->markTestSkipped('Discussion comments are off.');

        // BxForumCmts adds the discussion author to the counter, even at 0 comments.
        $this->assertSame(0, $aElement['counter']['count']);
        $this->assertContains((int)$this->_aContent['author'], array_map('intval', array_column($aElement['counter']['authors'], 'id')));
    }
}
