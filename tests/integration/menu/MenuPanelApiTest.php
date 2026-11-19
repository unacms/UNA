<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The site panel's menu (`sys_site_panel`, BxBaseMenuPanel): each of its items is another menu. The site gets every
 * item as that menu's HTML; the apps draw the panel themselves, so they get the items as any menu gives them, with
 * the submenu's name in `submenu`.
 */
#[Group('integration')]
class MenuPanelApiTest extends BxDolIntegrationTestCase
{
    /** A copy of the panel's menu in the site's or the apps' mode, so the shared instance is left as it is. */
    protected function panel(bool $bApi): BxBaseMenuPanel
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_site_panel');
        $this->assertInstanceOf(BxBaseMenuPanel::class, $oMenu);
        $oMenu = clone $oMenu;

        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $aObject = $oProp->getValue($oMenu);
        $aObject['cache'] = 'off';
        $oProp->setValue($oMenu, $aObject);

        $oApi = new ReflectionProperty($oMenu, '_bIsApi');
        $oApi->setValue($oMenu, $bApi);

        return $oMenu;
    }

    public function testAppsGetSubmenuNames(): void
    {
        $this->bxLoginAsAdmin();

        $aItems = $this->panel(true)->getMenuItems();
        $this->assertNotEmpty($aItems, 'A member has the panel\'s items.');

        $aSubmenus = [];
        foreach($aItems as $aItem) {
            $this->assertArrayHasKey('name', $aItem);
            $this->assertArrayHasKey('submenu', $aItem);
            $this->assertArrayNotHasKey('item', $aItem, 'No HTML for the apps.');

            if($aItem['submenu'] !== '')
                $aSubmenus[] = $aItem['submenu'];
        }

        $this->assertContains('sys_profile_stats', $aSubmenus);
        foreach($aSubmenus as $sSubmenu)
            $this->assertNotFalse(BxDolMenu::getObjectInstance($sSubmenu), 'The submenu "' . $sSubmenu . '" is a menu the apps can ask for.');
    }

    /**
     * The apps' drawer also lists the modules, the account's own menu and the footer's links: three items that are on
     * in the apps only, marked `drawer` so the web app's sidebar leaves them out.
     */
    public function testAppsGetTheDrawerMenus(): void
    {
        $this->bxLoginAsAdmin();

        $aDrawer = [];
        foreach($this->panel(true)->getMenuItems() as $aItem) {
            // The title heads the menu in the apps.
            if($aItem['submenu'] !== '')
                $this->assertNotSame('', $aItem['title'], 'The menu "' . $aItem['name'] . '" has a title.');

            $aConfig = !empty($aItem['config']) ? json_decode($aItem['config'], true) : [];
            if(!empty($aConfig['drawer']))
                $aDrawer[$aItem['name']] = $aItem['submenu'];
        }

        $this->assertSame([
            'homepage-menu' => 'sys_homepage',
            'account-menu' => 'sys_account_notifications',
            'footer-menu' => 'sys_footer',
        ], $aDrawer);
    }

    public function testGuestsGetTheLinksOnly(): void
    {
        $this->bxBecomeGuest();

        $aNames = array_column($this->panel(true)->getMenuItems(), 'name');

        $this->assertContains('footer-menu', $aNames);
        $this->assertNotContains('account-menu', $aNames, 'The account\'s menu is a member\'s.');
        $this->assertNotContains('member-menu', $aNames);
    }

    public function testSiteStillGetsHtml(): void
    {
        $this->bxLoginAsAdmin();

        $aItems = $this->panel(false)->getMenuItems();
        $this->assertNotEmpty($aItems);

        foreach($aItems as $aItem) {
            $this->assertArrayHasKey('class', $aItem);
            $this->assertArrayHasKey('item', $aItem);
            $this->assertArrayNotHasKey('submenu', $aItem);
        }
    }
}
