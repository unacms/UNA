<?php

/**
 * Artificer's phone sidebar (the site menu, `bx_artificer_sidebar_site`) shows the items marked `"button": true` in
 * their App config, the site menu's Log in and Sign up for guests, as a row of buttons above the list, Sign up (the
 * `primary` item) as the primary button. The apps read the same marks (NEO's header menu).
 */
class ArtificerSidebarSiteButtonsTest extends BxDolTestCase
{
    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    private function getSidebar()
    {
        $aObject = BxDolMenuQuery::getMenuObject('bx_artificer_sidebar_site');
        if (empty($aObject))
            $this->markTestSkipped('The Artificer sidebar menu is not installed.');

        $oMenu = BxDolMenu::getObjectInstance('bx_artificer_sidebar_site');
        if (!$oMenu || !method_exists($oMenu, '_isMenuItemButton'))
            $this->markTestSkipped('The site does not use the Artificer template.');

        return $oMenu;
    }

    public function testItemsMarkedInTheirAppConfigAreButtons(): void
    {
        $oMenu = $this->getSidebar();

        $this->assertTrue($this->callProtected($oMenu, '_isMenuItemButton', [['config_api' => '{"button":true}', 'submenu_object' => '']]));
        $this->assertFalse($this->callProtected($oMenu, '_isMenuItemButton', [['config_api' => '', 'submenu_object' => '']]));
        $this->assertFalse($this->callProtected($oMenu, '_isMenuItemButton', [['config_api' => '{"button":false}', 'submenu_object' => '']]));
        $this->assertFalse($this->callProtected($oMenu, '_isMenuItemButton', [['config_api' => '{"group":"account"}', 'submenu_object' => '']]));
        $this->assertFalse($this->callProtected($oMenu, '_isMenuItemButton', [['config_api' => 'not json', 'submenu_object' => '']]));
        $this->assertFalse($this->callProtected($oMenu, '_isMenuItemButton', [['config_api' => '{"button":true}', 'submenu_object' => 'sys_site_submenu']]), 'An item with a submenu stays a row.');
    }

    public function testGuestsGetLogInAndSignUpAsButtonsAboveTheList(): void
    {
        $oMenu = $this->getSidebar();
        $aVars = $this->callProtected($oMenu, '_getTemplateVars');

        $aButtons = array_column($aVars['bx_if:show_buttons']['content']['bx_repeat:buttons'], null, 'name');
        if (!isset($aButtons['login'], $aButtons['create-account']))
            $this->markTestSkipped('This site has no Log in and Sign up buttons in its site menu (the migration is not applied).');

        $this->assertTrue($aVars['bx_if:show_buttons']['condition']);
        $this->assertSame(['login', 'create-account'], array_keys($aButtons), 'Log in, then Sign up.');
        $this->assertNotContains('bx-btn-primary', explode(' ', $aButtons['login']['class_add']), 'Log in is a secondary button.');
        $this->assertContains('bx-btn-primary', explode(' ', $aButtons['create-account']['class_add']), 'Sign up is the primary button.');

        $aNames = array_column($aVars['bx_repeat:menu_items'], 'name');
        $this->assertNotContains('login', $aNames, 'The buttons leave the list.');
        $this->assertNotContains('create-account', $aNames);

        // Tablets and desktops have Log in and Sign up in the header, so the row with its divider hides there too.
        $aRowClasses = explode(' ', $aVars['bx_if:show_buttons']['content']['class_add']);
        $this->assertContains('bx-def-media-tablet-hide', $aRowClasses);
        $this->assertContains('bx-def-media-desktop-hide', $aRowClasses);
    }

    public function testTemplateDrawsTheButtonsBeforeTheRows(): void
    {
        $s = str_replace("\r\n", "\n", (string)file_get_contents(__DIR__ . '/../../../../modules/boonex/artificer/data/template/system/menu_sidebar_site.html'));

        $this->assertLessThan(strpos($s, '<bx_repeat:menu_items>'), strpos($s, '<bx_if:show_buttons>'), 'The buttons come first.');
        $this->assertMatchesRegularExpression('/<li class="bx-sidebar-buttons [^"]*\bborder-b\b[^"]*__class_add__">/', $s, 'A divider separates them from the rows.');
        $this->assertMatchesRegularExpression('/<a class="bx-btn [^"]*\bflex-1\b[^"]*__class_add__"/', $s, 'The buttons share the row equally.');
    }
}
