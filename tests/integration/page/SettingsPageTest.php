<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The `settings` page is the settings section's own page: members only, with no blocks and no item in the settings
 * menu (sys_account_settings_submenu). The site opens the menu's first page there (Account); the apps show the menu
 * itself on phones and tablets, as a list (the menu's `section_nav_small`), and a sidebar on large screens
 * (`section_nav`). The menu's `config_api` names that page (`hub`) and the section's icon in the apps (`icon`). Its
 * items sit in sections, items without a link (Account, and the current profile titled with its name), which the apps
 * draw as headings and the site's tab row leaves out; deleting the account is marked `danger` in its app config. The
 * pages it lists (account-settings-email ...) stay as they are.
 */
#[Group('integration')]
class SettingsPageTest extends BxDolIntegrationTestCase
{

    public function testSettingsMenuNamesItsPageAndItsSections(): void
    {
        $oDb = BxDolDb::getInstance();

        $this->assertSame(['hub' => 'settings', 'icon' => 'settings'], json_decode($oDb->getOne("SELECT `config_api` FROM `sys_objects_menu` WHERE `object` = 'sys_account_settings_submenu'"), true));

        $aItems = $oDb->getAllWithKey("SELECT `id`, `name`, `parent_id`, `link`, `active`, `active_api`, `config_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings'", 'name');
        foreach (['account-settings-section-account', 'account-settings-section-profile'] as $sSection) {
            $this->assertArrayHasKey($sSection, $aItems);
            $this->assertSame('', $aItems[$sSection]['link'], 'A section has no page of its own.');
            $this->assertSame(0, (int)$aItems[$sSection]['parent_id']);
            $this->assertSame(1, (int)$aItems[$sSection]['active']);
            $this->assertSame(1, (int)$aItems[$sSection]['active_api'], 'The apps get the sections, or none of their items.');
        }

        $iAccount = (int)$aItems['account-settings-section-account']['id'];
        $iProfile = (int)$aItems['account-settings-section-profile']['id'];
        foreach (['account-settings-info', 'account-profile-switcher', 'account-settings-email', 'account-settings-password'] as $sName) {
            $this->assertSame($iAccount, (int)$aItems[$sName]['parent_id'], $sName);
        }
        $this->assertSame($iProfile, (int)$aItems['profile-settings-cfilter']['parent_id']);
        foreach (['notifications-settings', 'payment-details', 'acl-view'] as $sName) {
            if (isset($aItems[$sName])) {
                $this->assertSame($iProfile, (int)$aItems[$sName]['parent_id'], $sName);
            }
        }

        $this->assertSame(0, (int)$aItems['account-settings-delete']['parent_id']);
        $this->assertSame(['danger' => true], json_decode($aItems['account-settings-delete']['config_api'], true));

        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `config_api` LIKE '%\"group\"%'"), 'No item keeps a group.');
    }

    public function testItemsHaveNoGroup(): void
    {
        $this->assertFalse(BxDolDb::getInstance()->isFieldExists('sys_menu_items', 'group_name'));
        $this->assertFalse(defined('BxDolMenu::ITEM_GROUP_DANGER'));
        $this->assertFalse(method_exists(BxDolMenu::class, 'normalizeItemGroup'));

        $sStudio = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'studio/template/scripts/BxBaseStudioNavigationItems.php');
        $this->assertStringNotContainsString('group_name', $sStudio, 'Studio\'s item form has no "Group in the apps".');
    }

    public function testApiCarriesTheSections(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = BxDolMenu::getObjectInstance('sys_account_settings_submenu');
        $this->assertInstanceOf(BxBaseMenu::class, $oMenu);

        // the items as the API mode of api.php builds them
        $oMenu = clone $oMenu;
        (new ReflectionProperty(BxDolMenu::class, '_bIsApi'))->setValue($oMenu, true);

        $aItems = array_column($oMenu->getCodeAPI()['items'], null, 'name');
        $this->assertSame(['account-settings-section-account', 'account-settings-section-profile'], array_slice(array_keys($aItems), 0, 2));
        $this->assertSame('account-settings-delete', array_key_last($aItems));

        $aAccount = $aItems['account-settings-section-account'];
        $this->assertSame('', $aAccount['link']);
        $this->assertContains('account-settings-email', array_column($aAccount['subitems'], 'name'));
        $this->assertArrayNotHasKey('group', $aAccount['subitems'][0]);

        // The profile's section is titled with the current profile's name.
        $oProfile = BxDolProfile::getInstance();
        $this->assertSame($oProfile->getDisplayName(), $aItems['account-settings-section-profile']['title']);

        $this->assertSame(['danger' => true], json_decode($aItems['account-settings-delete']['config'], true));
    }

    /**
     * The site's tab row (`menu_main_submenu.html` has no subitems template) shows the sections' items in their place,
     * in the menu's order, without the sections; also after the menu was asked whether it is visible, which loads the
     * items the output then uses.
     */
    public function testSiteTabRowShowsTheSectionsItems(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = BxDolMenu::getObjectInstance('sys_account_settings_submenu');
        $oMenu = clone $oMenu;
        (new ReflectionProperty(BxDolMenu::class, '_bIsApi'))->setValue($oMenu, false);
        $this->assertTrue($oMenu->isVisible());

        $aNames = array_column($oMenu->getMenuItems(), 'name');
        $this->assertNotContains('account-settings-section-account', $aNames);
        $this->assertNotContains('account-settings-section-profile', $aNames);
        $this->assertSame('account-settings-info', $aNames[0] ?? null);
        // the last tab is Delete; on phones the site puts the tabs that don't fit under More, its own item after it
        $this->assertSame('more-auto', end($aNames));
        $this->assertSame('account-settings-delete', $aNames[count($aNames) - 2] ?? null);
        $this->assertTrue($oMenu instanceof BxBaseMenuMoreAuto && $oMenu->isMoreAuto());

        $iEmail = array_search('account-settings-email', $aNames, true);
        $iPassword = array_search('account-settings-password', $aNames, true);
        $this->assertNotFalse($iEmail);
        $this->assertSame($iEmail + 1, $iPassword);
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
        $aItems = BxDolDb::getInstance()->getAllWithKey("SELECT `name`, `order`, `active`, `active_api` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `module` = 'system' AND `link` != '' AND `parent_id` = (SELECT `id` FROM `sys_menu_items` WHERE `set_name` = 'sys_account_settings' AND `name` = 'account-settings-section-account')", 'name');

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
