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
     * The settings menu's sections are items without a link that the items sit under (Account, the current profile),
     * the modules' items join the profile's, deleting the account is `danger` in its app config, and no item has a
     * group (the removed `group_name` column, Studio's "Group in the apps").
     */
    public function testFreshInstallMakesTheSettingsSections(): void
    {
        $sRoot = __DIR__ . '/../../../';
        $sSystem = (string)file_get_contents($sRoot . 'install/sql/system.sql');
        $this->assertStringNotContainsString('`group_name`', $sSystem);
        $this->assertStringContainsString("('sys_account_settings', 'system', 'account-settings-section-account',", $sSystem);
        $this->assertStringContainsString("('sys_account_settings', 'system', 'account-settings-section-profile',", $sSystem);
        $this->assertStringContainsString("UPDATE `sys_menu_items` SET `parent_id`=@iMiAccountSettingsAccount WHERE `set_name`='sys_account_settings'", $sSystem);
        $this->assertStringContainsString("UPDATE `sys_menu_items` SET `parent_id`=@iMiAccountSettingsProfile WHERE `set_name`='sys_account_settings'", $sSystem);

        $sApp = (string)file_get_contents($sRoot . 'modules/system/install/sql/enable-app-menus.sql');
        $this->assertStringContainsString("SET `config_api`='{\"danger\":true}' WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-delete'", $sApp);
        $this->assertStringContainsString("`name` IN ('account-settings-section-account', 'account-settings-section-profile')", $sApp);
        $this->assertStringNotContainsString('group_name', $sApp);
        $this->assertStringNotContainsString('{"group"', $sApp);

        foreach(['acl', 'notifications', 'payment'] as $sModule) {
            $sEnable = (string)file_get_contents($sRoot . 'modules/boonex/' . $sModule . '/install/sql/enable.sql');
            $this->assertStringContainsString("`name`='account-settings-section-profile'", $sEnable, $sModule);
            $this->assertStringContainsString("SET `parent_id`=IFNULL(@iMiAccountSettingsProfile, 0) WHERE `set_name`='sys_account_settings'", $sEnable, $sModule);

            $sSql = (string)file_get_contents($sRoot . 'modules/boonex/' . $sModule . '/install/sql/enable-app.sql');
            $this->assertStringNotContainsString('group_name', $sSql, $sModule);
            $this->assertStringNotContainsString('{"group"', $sSql, $sModule);
        }
    }
}
