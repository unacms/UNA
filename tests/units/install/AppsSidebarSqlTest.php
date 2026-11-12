<?php

/**
 * The apps' sidebar (API v2 GET /navigation) has menus of its own, Apps Sidebar (`sys_apps_sidebar`) and Apps Menu
 * (`sys_apps_menu`), so that the menus the site draws and API v1 gives NEO (`sys_site`, `sys_profile_stats`,
 * `sys_site_panel`) stay as they are without API v2. Read from the install SQL and the migrations themselves.
 */
class AppsSidebarSqlTest extends \PHPUnit\Framework\TestCase
{
    private const ROOT = __DIR__ . '/../../../';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(self::ROOT . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r", '', $s);
    }

    /** The names of a set's items a file inserts (install SQL's tuples and a migration's SELECTs), with each one's module. */
    private static function items(string $sSql, string $sSet): array
    {
        // set, module, name, then the system title's key: a row of sys_menu_items
        preg_match_all("/(?:^\\(|^SELECT )'" . preg_quote($sSet, '/') . "', ('[^']+'|@sName), '([^'_][^']*)', '_/m", $sSql, $aMatches, PREG_SET_ORDER);

        $aResult = [];
        foreach ($aMatches as $a)
            $aResult[$a[2]] = trim($a[1], "'");
        return $aResult;
    }

    public function testTheSidebarAndItsMenuAreInstalled(): void
    {
        $sSystem = self::read('install/sql/system.sql');

        $this->assertStringContainsString("('sys_apps_sidebar', '_sys_menu_title_apps_sidebar', '', 'sys_apps_sidebar', 'system', 30, 0, 1, 'BxTemplMenuAppsSidebar', '')", $sSystem);
        $this->assertStringContainsString("('sys_apps_menu', '_sys_menu_title_apps_menu', '', 'sys_apps_menu', 'system', 6, 0, 1, 'BxTemplMenuAppsMenu', '')", $sSystem);
        $this->assertStringContainsString("('sys_apps_sidebar', 'system', '_sys_menu_set_title_apps_sidebar', 0)", $sSystem);
        $this->assertStringContainsString("('sys_apps_menu', 'system', '_sys_menu_set_title_apps_menu', 0)", $sSystem);
        // its items have the viewer's own profile link, so what API v2 keeps of them is kept per profile
        $this->assertStringContainsString("UPDATE `sys_objects_menu` SET `cache` = 'per_user' WHERE `object` = 'sys_apps_menu';", $sSystem);

        $this->assertSame(['member-avatar', 'apps-menu', 'public-menu', 'member-menu', 'member-followings', 'member-memberships'], array_keys(self::items($sSystem, 'sys_apps_sidebar')));
        foreach (['apps-menu' => 'sys_apps_menu', 'public-menu' => 'sys_site_in_panel', 'member-menu' => 'sys_profile_stats', 'member-followings' => 'sys_profile_followings', 'member-memberships' => 'sys_profile_memberships'] as $sName => $sSubmenu)
            $this->assertMatchesRegularExpression("/\\('sys_apps_sidebar', 'system', '" . $sName . "', '[^']+', '[^']*', '', '', '', '', '" . $sSubmenu . "',/", $sSystem, $sName);
        $this->assertSame(['home', 'explore', 'profile', 'connections'], array_keys(self::items($sSystem, 'sys_apps_menu')));

        // on in the apps as installed: every group but the site's own Member Menu and Member Following
        $sApp = self::read('modules/system/install/sql/enable-app-menus.sql');
        $fOn = fn(string $sSet, string $sName) => "UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='" . $sSet . "' AND `module`='system' AND `name`='" . $sName . "';";
        foreach (['member-avatar', 'apps-menu', 'public-menu', 'member-memberships'] as $sName)
            $this->assertStringContainsString($fOn('sys_apps_sidebar', $sName), $sApp, $sName);
        foreach (['member-menu', 'member-followings'] as $sName)
            $this->assertStringNotContainsString($fOn('sys_apps_sidebar', $sName), $sApp, $sName . ' is for an owner to turn on');
        foreach (['home', 'explore', 'profile', 'connections'] as $sName)
            $this->assertStringContainsString($fOn('sys_apps_menu', $sName), $sApp, $sName);
    }

    public function testInstalledSitesGetTheSameFromTheMigration(): void
    {
        $sSystem = self::read('install/sql/system.sql');
        $sMigration = self::read('migrations/2026110900_apps_sidebar.sql');

        foreach (['sys_apps_sidebar', 'sys_apps_menu'] as $sSet) {
            $this->assertSame(self::items($sSystem, $sSet), self::items($sMigration, $sSet), $sSet);
            $this->assertStringContainsString("WHERE NOT EXISTS (SELECT 1 FROM `sys_objects_menu` WHERE `object` = '" . $sSet . "')", $sMigration);
            $this->assertStringContainsString("WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_sets` WHERE `set_name` = '" . $sSet . "')", $sMigration);
        }
        // it adds rows and changes none
        $this->assertDoesNotMatchRegularExpression('/^\s*(UPDATE|DELETE|REPLACE)\b/mi', $sMigration);
        $this->assertStringContainsString("'sys_profile_memberships'", self::read('migrations/2026110924_profile_memberships.sql'));
        $this->assertDoesNotMatchRegularExpression('/^\s*(UPDATE|DELETE|REPLACE)\b/mi', self::read('migrations/2026110924_profile_memberships.sql'));
    }

    public function testModulesPutTheirItemsInTheAppsMenu(): void
    {
        $aFound = [];
        foreach (glob(self::ROOT . 'modules/boonex/*/install/sql/enable.sql') as $sEnable) {
            $sDir = substr(dirname($sEnable, 3), strlen(self::ROOT));
            $aItems = self::items(self::read($sDir . '/install/sql/enable.sql'), 'sys_apps_menu');
            if (!$aItems)
                continue;

            $this->assertFileExists(self::ROOT . $sDir . '/install/sql/enable-app.sql', $sDir);
            $sApp = self::read($sDir . '/install/sql/enable-app.sql');
            $sMigrations = '';
            foreach (glob(self::ROOT . $sDir . '/migrations/*.sql') ?: [] as $sFile)
                $sMigrations .= str_replace("\r", '', (string)file_get_contents($sFile));
            foreach (array_keys($aItems) as $sName) {
                $this->assertMatchesRegularExpression("/SET `active_api`=1 WHERE `set_name`='sys_apps_menu' AND `module`='bx_[a-z_]+' AND `name`='" . preg_quote($sName, '/') . "';/", $sApp, $sName . ' is on in the apps');
                $this->assertArrayHasKey($sName, self::items($sMigrations, 'sys_apps_menu'), $sName . ' has a migration');
                $aFound[] = $sName;
            }
        }
        sort($aFound);
        $this->assertSame(['convos-messages', 'messenger-messages', 'notifications-view'], $aFound);
    }

    public function testTheSitesMenusAreLeftAsTheyAre(): void
    {
        $sSystem = self::read('install/sql/system.sql');

        // the site menu and the member menu have no item that is there for the apps' sidebar
        $this->assertSame(['home', 'about', 'search', 'more-auto', 'login', 'create-account'], array_keys(self::items($sSystem, 'sys_site')));
        $this->assertSame(['profile-stats-profile', 'friend-suggestions'], array_keys(self::items($sSystem, 'sys_profile_stats')));
        // the Site Panel: its four items, none with a heading, in the site's order
        $this->assertSame(['member-avatar', 'public-menu', 'member-menu', 'member-followings'], array_keys(self::items($sSystem, 'sys_site_panel')));
        foreach (['public-menu' => ['sys_site_in_panel', '2147483647, 0, 0, 2'], 'member-menu' => ['sys_profile_stats', '2147483646, 1, 0, 3'], 'member-followings' => ['sys_profile_followings', '2147483646, 1, 0, 4']] as $sName => [$sSubmenu, $sRest])
            $this->assertStringContainsString("('sys_site_panel', 'system', '" . $sName . "', '_sys_menu_item_title_system_" . str_replace('-', '_', $sName) . "', '', '', '', '', '', '" . $sSubmenu . "', " . $sRest . ")", $sSystem, $sName);

        $sApp = self::read('modules/system/install/sql/enable-app-menus.sql');
        $this->assertStringNotContainsString("`set_name`='sys_site_panel' AND `module`='system' AND `name`='public-menu'", $sApp, 'The Site Panel\'s Public Menu stays off in the apps.');
        $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_site_panel' AND `module`='system' AND `name`='member-followings';", $sApp);
        $this->assertStringNotContainsString("`set_name`='sys_profile_stats' AND `module`='system' AND `name`='friend-suggestions'", $sApp);

        // no module adds its Messages or Notifications to the site menu or the member menu for the apps,
        // and no migration of this tree changes a row of the site's three menus
        foreach (glob(self::ROOT . 'modules/boonex/*/install/sql/enable*.sql') as $sFile) {
            $sSql = str_replace("\r", '', (string)file_get_contents($sFile));
            foreach (['sys_site' => ['convos-messages', 'messenger-messages', 'notifications-view'], 'sys_profile_stats' => ['profile-stats-messages', 'profile-stats-notifications', 'profile-stats-home']] as $sSet => $aNames)
                foreach ($aNames as $sName)
                    $this->assertDoesNotMatchRegularExpression("/'" . $sSet . "'[^\\n]*'" . $sName . "'/", $sSql, basename(dirname($sFile, 3)) . ': ' . $sName);
        }
        foreach (['2026110900_apps_sidebar.sql', '2026110924_profile_memberships.sql'] as $sFile)
            foreach (['sys_site', 'sys_profile_stats', 'sys_site_panel'] as $sSet) {
                $sSql = self::read('migrations/' . $sFile);
                $this->assertSame([], self::items($sSql, $sSet), $sFile . ' adds nothing to ' . $sSet);
                $this->assertStringNotContainsString("`set_name` = '" . $sSet . "'", $sSql, $sFile . ' leaves ' . $sSet . ' alone');
            }
    }
}
