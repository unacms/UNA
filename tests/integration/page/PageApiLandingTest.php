<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * What the apps (NEO) get from the page API to show a page as UNA does: the words of their own landing pages
 * (`texts`, from Studio's language strings), the title UNA's cover shows (`cover_title`), a section's own name
 * ("People" on every People tab, not the module's "Persons"), and Studio's "Icon only" of a menu item.
 */
#[Group('integration')]
class PageApiLandingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->bxBecomeGuest();
        $GLOBALS['glMemCache'] = [];
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxPersonsModule']);
        BxDolDb::getInstance()->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    /** A page as NEO asks for it; page objects are cached per request, so drop the cached one. */
    protected function request(string $sUri): array
    {
        if (($sObject = BxDolPageQuery::getPageObjectNameByURI($sUri)))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        unset($GLOBALS['bxDolClasses']['BxPersonsModule']);
        // Menus keep the item selected by the last page, as within one request: each page here is a request of its own.
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        BxDolMenu::setSelectedGlobal('', '');

        $_GET = ['api' => 1];
        $aData = bx_srv('system', 'get_page_by_request', ['page/' . $sUri, '', '[]'], 'TemplServicePages');
        $this->assertIsArray($aData, $sUri);

        return $aData;
    }

    public function testLandingPagesCarryTheirWords(): void
    {
        $aHome = $this->request('home');
        $this->assertSame(['title' => _t('_sys_txt_splash_title'), 'text' => _t('_sys_txt_splash_slogan')], $aHome['texts'] ?? null);

        $aJoin = $this->request('create-account');
        foreach (['title' => '_sys_txt_join_title', 'text' => '_sys_txt_join_text', 'title_invite' => '_sys_txt_join_title_invite', 'text_invite' => '_sys_txt_join_text_invite'] as $sField => $sKey) {
            $this->assertSame(_t($sKey), $aJoin['texts'][$sField] ?? null, $sField);
            $this->assertNotSame($sKey, _t($sKey), $sKey . ' is installed.');
        }

        $this->assertArrayNotHasKey('texts', $this->request('about'), 'Other pages carry none.');
    }

    public function testCoverTitleIsTheSectionsName(): void
    {
        $this->assertSame(_t('_sys_page_title_about'), $this->request('about')['cover_title'] ?? null, 'A page of its own: its title.');

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        $sSection = _t('_bx_persons_menu_item_title_entries_home');
        foreach (['persons-home', 'persons-active'] as $sUri) {
            $aData = $this->request($sUri);
            $this->assertSame($sSection, $aData['cover_title'] ?? null, $sUri . ': the site menu item, as the cover.');
            $this->assertSame($sSection, $aData['menu']['title'] ?? null, $sUri . ': the section is named by it too.');
        }
    }

    public function testMenuItemsSayIfTheyAreIconOnly(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_site');
        $this->assertInstanceOf(BxBaseMenu::class, $oMenu);

        $oMethod = new ReflectionMethod($oMenu, '_getMenuItemAPI');
        $aItem = ['id' => 1, 'name' => 'phpunit', 'title' => 'PHPUnit', 'link' => 'page.php?i=about', 'icon' => 'info-circle'];
        $this->assertSame(1, $oMethod->invoke($oMenu, $aItem + ['icon_only' => 1])['icon_only']);
        $this->assertSame(0, $oMethod->invoke($oMenu, $aItem + ['icon_only' => 0])['icon_only']);
    }
}
