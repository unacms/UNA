<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The `settings` page lists every settings page: a members-only page in the settings section, as its
 * Overview item (hidden on desktop, where the menu is beside every settings page), whose one block is
 * the settings submenu (sys_account_settings_submenu). The submenu's `config_api` names that page
 * (`hub`), and each item says whose setting it is (`group`), so the apps list them under the account
 * or the profile. The pages it lists (account-settings-email ...) stay as they are.
 */
#[Group('integration')]
class SettingsPageTest extends BxDolIntegrationTestCase
{

    public function testSettingsMenuNamesItsPageAndTheGroups(): void
    {
        $oDb = BxDolDb::getInstance();

        $this->assertSame(['hub' => 'settings'], json_decode($oDb->getOne("SELECT `config_api` FROM `sys_objects_menu` WHERE `object` = 'sys_account_settings_submenu'"), true));

        $aGroups = $oDb->getPairs("SELECT `name`, `config_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `module` = 'system'", 'name', 'config_api');
        $this->assertSame(['group' => 'account'], json_decode($aGroups['account-settings-email'], true));
        $this->assertSame(['group' => 'account'], json_decode($aGroups['account-settings-password'], true));
        $this->assertSame(['group' => 'profile'], json_decode($aGroups['profile-settings-cfilter'], true));
        $this->assertSame(['group' => 'danger'], json_decode($aGroups['account-settings-delete'], true));
    }
}
