<?php

/**
 * A fresh install's menus (`sys_objects_menu`.`section_nav`): the column, and the connections' menu (Friends, Requests,
 * Suggestions...) set to the sidebar. Read from the SQL itself; the database side is MenuSectionNavTest (integration).
 */
class MenuSectionNavSqlTest extends PHPUnit\Framework\TestCase
{
    public function testFreshInstallHasTheSetting(): void
    {
        $sSql = file_get_contents(__DIR__ . '/../../../install/sql/system.sql');
        if($sSql === false)
            self::fail('install/sql/system.sql is not readable.');

        $this->assertStringContainsString("`section_nav` varchar(16) NOT NULL DEFAULT ''", $sSql);
        $this->assertStringContainsString("UPDATE `sys_objects_menu` SET `section_nav`='sidebar' WHERE `object`='sys_con_submenu';", $sSql);
    }

    /**
     * Phones and tablets: the column, and the account's settings opening on their list. The settings page itself has
     * no menu item and no block; Account is the menu's first page.
     */
    public function testFreshInstallOpensSettingsOnAList(): void
    {
        $sSql = file_get_contents(__DIR__ . '/../../../install/sql/system.sql');
        if($sSql === false)
            self::fail('install/sql/system.sql is not readable.');

        $this->assertStringContainsString("`section_nav_small` varchar(16) NOT NULL DEFAULT ''", $sSql);
        $this->assertStringContainsString("UPDATE `sys_objects_menu` SET `section_nav`='sidebar', `section_nav_small`='list' WHERE `object`='sys_account_settings_submenu';", $sSql);

        $this->assertStringNotContainsString("'page.php?i=settings', '', '', 'cog'", $sSql, 'The settings page is not an item of its own menu.');
        $this->assertStringNotContainsString("('sys_settings', 1, 'system'", $sSql, 'The settings page has no blocks.');
        $this->assertLessThan(
            strpos($sSql, "('sys_account_settings', 'system', 'account-profile-switcher'"),
            strpos($sSql, "('sys_account_settings', 'system', 'account-settings-info'"),
            'Account is the first settings page.'
        );
    }

    /**
     * A menu item's group (Studio > Navigation > an item > "Group in the apps"): the column, and the settings items'
     * groups in the apps' SQL, the system's and the modules', no longer in the items' app config.
     */
    public function testFreshInstallGroupsTheSettingsItems(): void
    {
        $sRoot = __DIR__ . '/../../../';
        $this->assertStringContainsString("`group_name` varchar(32) NOT NULL DEFAULT ''", (string)file_get_contents($sRoot . 'install/sql/system.sql'));

        $sApp = (string)file_get_contents($sRoot . 'modules/system/install/sql/enable-app-menus.sql');
        $this->assertStringContainsString("SET `group_name`='account' WHERE `set_name`='sys_account_settings'", $sApp);
        $this->assertStringContainsString("SET `group_name`=IF(`name`='account-settings-delete', 'danger', 'profile')", $sApp);

        foreach(['acl', 'notifications', 'payment'] as $sModule) {
            $sSql = (string)file_get_contents($sRoot . 'modules/boonex/' . $sModule . '/install/sql/enable-app.sql');
            $this->assertStringContainsString("SET `group_name`='profile' WHERE `set_name`='sys_account_settings' AND `module`='bx_" . $sModule . "'", $sSql, $sModule);
            $this->assertStringNotContainsString('{"group"', $sSql, $sModule);
        }
        $this->assertStringNotContainsString('{"group"', $sApp);
    }
}
