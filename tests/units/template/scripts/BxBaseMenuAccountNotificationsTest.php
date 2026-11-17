<?php

/**
 * The account menu (sys_account_notifications) has the profile switcher as its item 'switch-profile', link
 * '{switch_profile}'. The apps draw the account's profiles for it; the site replaces the item's `li` with the account's
 * other profiles after the menu's cache, and the account popup's own list (profile-switcher) is off on the site.
 */
class BxBaseMenuAccountNotificationsTest extends BxDolTestCase
{
    private static function readFile(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return $s;
    }

    public function testFreshInstallHasTheSwitchProfileItemInTheAccountMenu(): void
    {
        $sSql = self::readFile('install/sql/system.sql');

        $this->assertMatchesRegularExpression(
            "/\('sys_account_notifications', 'system', 'switch-profile', '_sys_menu_item_title_system_switch_profile', '_sys_menu_item_title_switch_profile', '\{switch_profile\}', [^\n]*, 2147483646, 1, 1, 0\)/",
            $sSql
        );
    }

    public function testFreshInstallTurnsOffThePopupProfileListOnTheSite(): void
    {
        $sSql = self::readFile('install/sql/system.sql');

        $this->assertStringContainsString(
            "('sys_account_popup', 'system', 'profile-switcher', '_sys_menu_item_title_system_ap_profile_switcher', '', '', '', '', '', '', '', 2147483646, 0, 1, 3)",
            $sSql
        );
    }

    public function testTheAppsGetTheSwitchProfileItem(): void
    {
        $sSql = self::readFile('modules/system/install/sql/enable-app-menus.sql');

        $this->assertStringContainsString(
            "UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_notifications' AND `module`='system' AND `name`='switch-profile';",
            $sSql
        );
    }

    public function testTheItemHasItsTitlesInEnglishAndRussian(): void
    {
        foreach (['modules/boonex/english/data/langs/system/en.xml', 'modules/boonex/russian/data/langs/system/ru.xml'] as $sPath) {
            $sXml = self::readFile($sPath);
            $this->assertStringContainsString('<string name="_sys_menu_item_title_system_switch_profile">', $sXml, $sPath);
            $this->assertStringContainsString('<string name="_sys_menu_item_title_switch_profile">', $sXml, $sPath);
        }
    }

    public function testReplacesTheItemOfTheBaseTemplate(): void
    {
        $sCode = '<ul class="bx-menu-floating-blocks-wide">'
            . '<li class="bx-menu-item bx-menu-item-switch-profile bx-def-round-corners ">' . "
"
            . '<a href="{switch_profile}"><div class="bx-menu-floating-blocks-title">Switch profile</div></a>' . "
"
            . '</li><li class="bx-menu-item bx-menu-item-dashboard bx-def-round-corners "><a href="page.php?i=dashboard">Dashboard</a></li>'
            . '</ul>';

        $sResult = BxBaseMenuAccountNotifications::replaceSwitchProfileItem($sCode, '<div class="bx-menu-item-switch-profile-cnt">LIST</div>');

        // The item keeps its own `li`; only its link gives way to the list.
        $this->assertSame(
            '<ul class="bx-menu-floating-blocks-wide"><li class="bx-menu-item bx-menu-item-switch-profile bx-def-round-corners ">'
            . '<div class="bx-menu-item-switch-profile-cnt">LIST</div></li>'
            . '<li class="bx-menu-item bx-menu-item-dashboard bx-def-round-corners "><a href="page.php?i=dashboard">Dashboard</a></li></ul>',
            $sResult
        );
    }

    public function testReplacesTheItemOfTheArtificerTemplate(): void
    {
        $sCode = "<ul>
        <li class=\"bx-menu-item bx-menu-item-switch-profile  bx-stl-mil-hover group relative flex\">
"
            . "            <a class=\"flex flex-1\" href=\"{switch_profile}\">Switch profile</a>
        </li>
"
            . "        <li class=\"bx-menu-item bx-menu-item-profile  bx-stl-mil-hover\"><a href=\"page.php?i=view-persons-profile\">Profile</a></li>
</ul>";

        $sResult = BxBaseMenuAccountNotifications::replaceSwitchProfileItem($sCode, 'LIST');

        $this->assertStringNotContainsString('{switch_profile}', $sResult);
        $this->assertStringContainsString('<li class="bx-menu-item bx-menu-item-switch-profile  bx-stl-mil-hover group relative flex">LIST</li>', $sResult);
        $this->assertStringContainsString('bx-menu-item-profile ', $sResult);
    }

    public function testReplacesTheItemOfTheNotificationsTemplate(): void
    {
        // Studio may put the menu on 'menu_account_notifications.html', whose rows carry only `bx-menu-item-<name>`.
        $sCode = '<ul class="bx-menu-notif"><li class="bx-menu-item-switch-profile bx-def-border-bottom"><a href="{switch_profile}"><span>Switch profile</span></a></li></ul>';

        $this->assertSame(
            '<ul class="bx-menu-notif"><li class="bx-menu-item-switch-profile bx-def-border-bottom">LIST</li></ul>',
            BxBaseMenuAccountNotifications::replaceSwitchProfileItem($sCode, 'LIST')
        );
    }

    public function testAnAccountWithOneProfileLosesTheItem(): void
    {
        $sCode = '<ul><li class="bx-menu-item bx-menu-item-switch-profile"><a href="{switch_profile}">Switch profile</a></li><li class="bx-menu-item bx-menu-item-logout"><a href="page.php?i=logout">Logout</a></li></ul>';

        $this->assertSame(
            '<ul><li class="bx-menu-item bx-menu-item-logout"><a href="page.php?i=logout">Logout</a></li></ul>',
            BxBaseMenuAccountNotifications::replaceSwitchProfileItem($sCode, '')
        );
    }

    public function testLeavesOtherItemsAlone(): void
    {
        // An item whose name only starts with the switcher's is another item.
        $sCode = '<ul><li class="bx-menu-item bx-menu-item-switch-profile-old"><a href="x">Old</a></li><li class="bx-menu-item bx-menu-item-logout"><a href="y">Logout</a></li></ul>';

        $this->assertFalse(BxBaseMenuAccountNotifications::hasSwitchProfileItem($sCode));
        $this->assertSame($sCode, BxBaseMenuAccountNotifications::replaceSwitchProfileItem($sCode, 'LIST'));
    }

    public function testASwitcherWithDollarSignsIsKeptAsItIs(): void
    {
        $sCode = '<ul><li class="bx-menu-item bx-menu-item-switch-profile"><a href="{switch_profile}">S</a></li></ul>';

        $this->assertTrue(BxBaseMenuAccountNotifications::hasSwitchProfileItem($sCode));
        $this->assertSame(
            '<ul><li class="bx-menu-item bx-menu-item-switch-profile">A $1 \0 B</li></ul>',
            BxBaseMenuAccountNotifications::replaceSwitchProfileItem($sCode, 'A $1 \0 B')
        );
    }

    public function testTheSwitcherTemplateHasNoListItemOfItsOwn(): void
    {
        // The item's own `li` holds the list, so the template is its content only.
        $this->assertStringNotContainsString('<li', self::readFile('template/menu_account_switch_profile.html'));
    }
}
