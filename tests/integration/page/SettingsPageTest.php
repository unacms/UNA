<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The `settings` page is the settings section's own page: members only, with no blocks and no item in the settings
 * menu (sys_account_settings_submenu). The site opens the menu's first page there (Account); the apps show the menu
 * itself on phones and tablets, as a list (the menu's `section_nav_small`), and a sidebar on large screens
 * (`section_nav`). The menu's `config_api` names that page (`hub`), and each item says whose setting it is (`group`),
 * so the apps list them under the account or the profile. The pages it lists (account-settings-email ...) stay as
 * they are.
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

    public function testSettingsAreASidebarAndAListOnPhones(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_account_settings_submenu');
        $this->assertInstanceOf(BxDolMenu::class, $oMenu);

        $this->assertSame(BxDolMenu::SECTION_NAV_SIDEBAR, $oMenu->getSectionNav());
        $this->assertSame(BxDolMenu::SECTION_NAV_SMALL_LIST, $oMenu->getSectionNavSmall());
    }

    public function testSettingsPageHasNoBlocksAndNoMenuItem(): void
    {
        $oDb = BxDolDb::getInstance();

        $this->assertSame(1, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_objects_page` WHERE `object` = 'sys_settings' AND `uri` = 'settings'"));
        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_pages_blocks` WHERE `object` = 'sys_settings'"));
        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `link` = 'page.php?i=settings'"));
    }

    public function testAccountIsTheFirstSettingsPageAndInTheApps(): void
    {
        $aItems = BxDolDb::getInstance()->getAllWithKey("SELECT `name`, `order`, `active`, `active_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `module` = 'system'", 'name');

        $this->assertSame(1, (int)$aItems['account-settings-info']['active']);
        $this->assertSame(1, (int)$aItems['account-settings-info']['active_api']);
        $this->assertSame((int)$aItems['account-settings-info']['order'], min(array_map('intval', array_column($aItems, 'order'))));
    }

    public function testSiteOpensTheFirstSettingsPage(): void
    {
        $this->bxLoginAsAdmin();

        $oPage = BxDolPage::getObjectInstanceByURI('settings');
        $this->assertInstanceOf(BxBasePageAccount::class, $oPage);
        $this->assertStringEndsWith('account-settings-info', $oPage->getSectionFirstPageUrl());
        $this->assertStringStartsWith(BX_DOL_URL_ROOT, $oPage->getSectionFirstPageUrl());

        $oOther = BxDolPage::getObjectInstanceByURI('account-settings-email');
        $this->assertInstanceOf(BxBasePageAccount::class, $oOther);
        $this->assertSame('', $oOther->getSectionFirstPageUrl(), 'Only the section\'s own page is left for the first one.');
    }
}
