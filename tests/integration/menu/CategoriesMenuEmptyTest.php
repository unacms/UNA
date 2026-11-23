<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The categories block of Posts, Discussions and Products (BxBaseModTextMenuCategories) lists only categories with items,
 * so "All categories" waits for one of them too: without items the menu is empty, the site draws no block and the API
 * sends none (BxBasePage::_getBlockMenu), where the apps drew a titled block with nothing in it.
 */
#[Group('integration')]
class CategoriesMenuEmptyTest extends BxDolIntegrationTestCase
{
    private const MENU = 'bx_posts_categories';

    private array $aGetBefore = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            $this->markTestSkipped('bx_posts is not installed.');

        // Loads BxPostsMenuCategories (the menu's override class).
        if (!BxDolMenu::getObjectInstance(self::MENU))
            $this->markTestSkipped('The ' . self::MENU . ' menu is not active.');

        $this->aGetBefore = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->aGetBefore;
        unset($GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU]);

        parent::tearDown();
    }

    public function testNoCategoriesWithItemsGivesNoItems(): void
    {
        $oMenu = $this->menu([]);

        $this->assertSame([], $oMenu->getMenuItems(), 'No "All categories" row while no category has items.');
        $this->assertSame('', $oMenu->getCode(), 'The site draws nothing, so the page hides the block.');
    }

    public function testOneCategoryGivesAllCategoriesWithTheTotal(): void
    {
        $aItems = $this->menu([
            ['value' => '3', 'name' => 'Travel', 'url' => 'page/posts-category?category=3', 'num' => 2],
            ['value' => '5', 'name' => 'Food', 'url' => 'page/posts-category?category=5', 'num' => 1],
        ])->getMenuItems();

        $this->assertCount(3, $aItems);
        $this->assertSame('show-0', $aItems[0]['name'], '"All categories" comes first.');
        $this->assertSame(_t('_bx_posts_txt_all_categories'), $aItems[0]['title']);
        $this->assertSame(3, $aItems[0]['bx_if:addon']['content']['addon'], 'It counts every listed category\'s items.');
        $this->assertSame('show-3', $aItems[1]['name']);
        $this->assertSame(2, $aItems[1]['bx_if:addon']['content']['addon']);
    }

    public function testApiSendsNoBlockForAMenuWithoutItems(): void
    {
        $_GET['api'] = 1;

        $oPage = BxDolPage::getObjectInstance('bx_posts_home');
        if (!$oPage)
            $this->markTestSkipped('The bx_posts_home page is missing.');

        $aBlock = ['id' => 0, 'type' => 'menu', 'content' => self::MENU, 'title' => '_bx_posts_page_block_title_cats'];

        $GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU] = $this->menu([], true);
        $this->assertSame([], $this->bxCallProtected($oPage, '_getBlockMenu', $aBlock), 'No block for the apps.');

        $GLOBALS['bxDolClasses']['BxDolMenu!' . self::MENU] = $this->menu([
            ['value' => '3', 'name' => 'Travel', 'url' => 'page/posts-category?category=3', 'num' => 2],
        ], true);
        $aResult = $this->bxCallProtected($oPage, '_getBlockMenu', $aBlock);
        $this->assertSame('menu', $aResult[0]['type'] ?? null);
        $this->assertNotEmpty($aResult[0]['data']['content']['items']);
    }

    public function testCategoriesListServiceSendsNoBlockToTheAppsWhenEmpty(): void
    {
        $o = new BxTemplServiceCategory();
        $aParams = ['show_empty' => true];

        $this->assertNotSame('', $o->serviceCategoriesList('bx_no_such_category', $aParams), 'The site keeps its "Empty" message box.');

        $_GET['api'] = 1;
        $this->assertSame([], $o->serviceCategoriesList('bx_no_such_category', $aParams), 'The apps get no block, not the HTML message box.');
    }

    /**
     * The Posts categories menu with the given category rows (as BxBaseCategory::getCategoriesList gives them).
     */
    private function menu(array $aRows, bool $bApi = false): BxPostsMenuCategories
    {
        $aCategories = $bApi
            ? ($aRows ? [bx_api_get_block('categories_list', $aRows)] : [])
            : ['bx_repeat:cats' => $aRows];

        $oMenu = new class(BxDolMenuQuery::getMenuObject(self::MENU), BxDolTemplate::getInstance(), $aCategories) extends BxPostsMenuCategories {
            private $aTestCategories;

            public function __construct($aObject, $oTemplate, $aCategories = [])
            {
                $this->aTestCategories = $aCategories;
                parent::__construct($aObject, $oTemplate);
            }

            protected function _getCategoriesList()
            {
                return $this->aTestCategories;
            }
        };

        $this->bxSetProtected($oMenu, '_bIsApi', $bApi, BxDolMenu::class);

        return $oMenu;
    }
}
