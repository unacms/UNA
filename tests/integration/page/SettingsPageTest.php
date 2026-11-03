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
    public function testSettingsPageIsForMembersAndShowsTheSettingsMenu(): void
    {
        $oDb = BxDolDb::getInstance();

        $aPage = $oDb->getRow("SELECT * FROM `sys_objects_page` WHERE `uri` = 'settings'");
        $this->assertNotEmpty($aPage, 'The settings page is installed.');
        $this->assertSame('sys_settings', $aPage['object']);
        $this->assertSame(2147483646, (int)$aPage['visible_for_levels'], 'Only members see it.');
        $this->assertSame('BxTemplPageAccount', $aPage['override_class_name'], 'An account page: it carries the settings submenu, as its siblings do.');

        $aOverview = $oDb->getRow("SELECT * FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `module` = 'system' AND `name` = 'settings'");
        $this->assertNotEmpty($aOverview, 'The page is the Overview item of its own section.');
        $this->assertSame('page.php?i=settings', $aOverview['link']);
        $this->assertSame((string)pow(2, BX_DB_HIDDEN_DESKTOP - 1), (string)$aOverview['hidden_on'], 'Hidden on desktop by default.');
        $this->assertSame(1, (int)$aOverview['active_api'], 'The apps get it.');

        $aBlock = $oDb->getRow("SELECT * FROM `sys_pages_blocks` WHERE `object` = 'sys_settings' AND `module` = 'system' AND `title` = '_sys_page_block_title_settings'");
        $this->assertNotEmpty($aBlock);
        $this->assertSame('menu', $aBlock['type']);
        $this->assertSame('sys_account_settings_submenu', $aBlock['content']);
        $this->assertSame(1, (int)$aBlock['active_api'], 'The apps get the block.');

        foreach (['account-settings-email', 'account-settings-password', 'account-settings-delete'] as $sUri)
            $this->assertNotEmpty(BxDolPageQuery::getPageObjectNameByURI($sUri), "The '$sUri' page is kept.");
    }

    public function testSettingsMenuNamesItsPageAndTheGroups(): void
    {
        $oDb = BxDolDb::getInstance();

        $this->assertSame(['hub' => 'settings'], json_decode($oDb->getOne("SELECT `config_api` FROM `sys_objects_menu` WHERE `object` = 'sys_account_settings_submenu'"), true));

        $aGroups = $oDb->getPairs("SELECT `name`, `config_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `module` = 'system'", 'name', 'config_api');
        $this->assertSame(['group' => 'account'], json_decode($aGroups['account-settings-email'], true));
        $this->assertSame(['group' => 'account'], json_decode($aGroups['account-settings-password'], true));
        $this->assertSame(['group' => 'profile'], json_decode($aGroups['profile-settings-cfilter'], true));
        $this->assertSame(['group' => 'danger'], json_decode($aGroups['account-settings-delete'], true));

        $this->assertSame('page.php?i=settings', $oDb->getOne("SELECT `link` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_notifications' AND `module` = 'system' AND `name` = 'account-settings'"), "The member menu's Settings opens the settings page.");
    }

    public function testAppsGetTheHubAndEachItemsGroup(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = BxDolMenu::getObjectInstance('sys_account_settings_submenu');
        $this->assertInstanceOf(BxBaseMenu::class, $oMenu);

        $oIsApi = new ReflectionProperty($oMenu, '_bIsApi');
        $bIsApi = $oIsApi->getValue($oMenu);
        try {
            $oIsApi->setValue($oMenu, true);
            $aMenu = $oMenu->getCodeAPI();
        }
        finally {
            // The menu instance is shared: put it back as it was.
            $oIsApi->setValue($oMenu, $bIsApi);
        }

        $this->assertSame(['hub' => 'settings'], json_decode($aMenu['config'], true));

        $aItems = array_column($aMenu['items'], null, 'name');
        $this->assertArrayHasKey('settings', $aItems);
        $this->assertSame(['desktop'], $aItems['settings']['hidden_on'], 'The apps hide the Overview on desktop.');
        $this->assertArrayHasKey('account-settings-email', $aItems);
        $this->assertSame(['group' => 'account'], json_decode($aItems['account-settings-email']['config'], true));
        $this->assertArrayHasKey('account-settings-delete', $aItems);
        $this->assertSame(['group' => 'danger'], json_decode($aItems['account-settings-delete']['config'], true));
    }
}
