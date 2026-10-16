<?php

/**
 * Menus with content cache ('global', 'guest', 'per_user', 'per_acl') keep their rendered HTML, which marks the selected
 * item with bx-menu-tab-active. The cache key includes the selected item, so the page that happens to render a menu
 * first doesn't decide the selected item for every other page.
 */
class BxBaseMenuCacheTest extends BxDolTestCase
{
    private const KEY = 'menu_sys_site_unit_test';

    protected function tearDown(): void
    {
        BxDolMenu::setSelectedGlobal('', '');
        parent::tearDown();
    }

    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    private function getSiteMenu(): BxBaseMenu
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_site');
        if (!$oMenu)
            $this->markTestSkipped('The site menu is not installed.');

        return $oMenu;
    }

    public function testCacheKeyFollowsTheSelectedItem(): void
    {
        $oMenu = $this->getSiteMenu();

        BxDolMenu::setSelectedGlobal('system', 'about');
        $sAbout = $this->callProtected($oMenu, '_getCacheKeySelected', [self::KEY]);

        BxDolMenu::setSelectedGlobal('system', 'home');
        $sHome = $this->callProtected($oMenu, '_getCacheKeySelected', [self::KEY]);

        BxDolMenu::setSelectedGlobal('system', 'no-such-item-in-this-menu');
        $sNone = $this->callProtected($oMenu, '_getCacheKeySelected', [self::KEY]);

        $this->assertNotSame('', $sAbout);
        $this->assertNotSame('', $sHome);
        $this->assertNotSame($sAbout, $sHome, 'Different selected items get different cache entries.');
        $this->assertSame('', $sNone, 'Pages that select nothing in this menu share one entry.');
        $this->assertSame(strlen($sAbout), strlen($sHome), 'The suffix has a fixed length, whatever the name.');
        $this->assertLessThanOrEqual(24, strlen($sAbout));
    }

    public function testItemNamesAreCachedWithTheMenu(): void
    {
        $oMenu = $this->getSiteMenu();
        if (!getParam('sys_content_cache_enable'))
            $this->markTestSkipped('Content cache is off.');

        BxDolMenu::setSelectedGlobal('system', 'about');
        $this->callProtected($oMenu, '_getCacheKeySelected', [self::KEY]);

        $aItems = bx_content_cache_get(self::KEY . '_items');
        $this->assertIsArray($aItems, 'The item list is kept next to the menu, so a cache hit needs no query.');
        $this->assertContains(['module' => 'system', 'name' => 'about'], $aItems);
    }

    public function testCachedMenuMarksTheItemOfEachPage(): void
    {
        $this->getSiteMenu();
        if (!getParam('sys_content_cache_enable'))
            $this->markTestSkipped('Content cache is off.');

        $aActive = [];
        foreach (['home', 'about', 'home'] as $sName) {
            BxDolMenu::setSelectedGlobal('system', $sName);
            preg_match_all('/bx-menu-item bx-menu-item-([\w-]+)[^"]*bx-menu-tab-active/', BxDolMenu::getObjectInstance('sys_site')->getCode(), $aMatches);
            $aActive[] = implode(',', $aMatches[1]);
        }

        $this->assertSame(['home', 'about', 'home'], $aActive);
    }
}
