<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Discussions for the app: every discussion names its category (with the
 * icon the site uses when Studio sets none), and the unit meta sends the
 * reactions element.
 */
#[Group('integration')]
class ForumApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aContent;
    protected $_aCategoryRow;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum'))
            $this->markTestSkipped('Discussions are not installed.');

        $oDb = BxDolDb::getInstance();
        $this->_aContent = $oDb->getRow("SELECT * FROM `bx_forum_discussions` WHERE `cat` > 0 ORDER BY `id` DESC LIMIT 1");
        if (empty($this->_aContent))
            $this->markTestSkipped('There are no discussions with a category.');

        // The test changes the category's icon row; keep the original to restore it.
        $this->_aCategoryRow = $oDb->getRow("SELECT * FROM `bx_forum_categories` WHERE `category` = :category", ['category' => (int)$this->_aContent['cat']]);
    }

    protected function tearDown(): void
    {
        if (!empty($this->_aContent)) {
            $oDb = BxDolDb::getInstance();
            $oDb->query("DELETE FROM `bx_forum_categories` WHERE `category` = :category", ['category' => (int)$this->_aContent['cat']]);
            if (!empty($this->_aCategoryRow))
                $oDb->query("INSERT INTO `bx_forum_categories` SET `category` = :category, `visible_for_levels` = :levels, `icon` = :icon", [
                    'category' => (int)$this->_aCategoryRow['category'],
                    'levels' => (int)$this->_aCategoryRow['visible_for_levels'],
                    'icon' => $this->_aCategoryRow['icon'],
                ]);
            $oDb->cleanMemoryAll();
        }

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

    public function testUploadedIconIsSentAsUrl(): void
    {
        // A storage id with no file behind it: no URL, and never the bare id.
        $this->setCategoryIcon('2147483000');

        $sIcon = $this->decode($this->_aContent)['category']['icon'];

        $this->assertIsString($sIcon);
        $this->assertFalse(is_numeric($sIcon));
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

        $oVote = BxDolVote::getObjectInstance('bx_forum_reactions', (int)$this->_aContent['id']);
        if (!$oVote || !$oVote->isEnabled())
            $this->markTestSkipped('Discussion reactions are off.');

        $oMenu = BxDolMenu::getObjectInstance('bx_forum_snippet_meta_main');
        $this->assertInstanceOf(BxBaseModGeneralMenuSnippetMeta::class, $oMenu);
        $oIsApi = new ReflectionProperty($oMenu, '_bIsApi');
        $oIsApi->setValue($oMenu, true);
        $oMenu->setContentId((int)$this->_aContent['id']);

        $aItem = $this->bxCallProtected($oMenu, '_getMenuItemReactions', ['id' => 1, 'name' => 'reactions']);

        $this->assertIsArray($aItem);
        $this->assertSame('element', $aItem['display_type']);
        $this->assertSame('reactions', $aItem['data']['type']);
        $this->assertSame((int)$this->_aContent['id'], (int)$aItem['data']['object_id']);
    }
}
