<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Menus: how the apps show a section's menu on phones and tablets (Studio > Navigation > a menu): tabs (empty) or a
 * list, where the section opens on the menu itself and each page opens from it with Back. The account's settings get
 * the list, and the sidebar on large screens.
 *
 * The settings page (`settings`) stops being a page of its own that lists the section: its "Overview" menu item and
 * its menu block go. The site opens the settings menu's first page there (BxBasePageAccount), the apps show the menu.
 * Account is that first page: it moves before Profiles, where both still have their installed order, and the apps get
 * it. MySQL has no ADD COLUMN IF NOT EXISTS, so the column is added only when it is missing.
 */

$oDb = BxDolDb::getInstance();

BxDolMigrationsHelper::addColumn('sys_objects_menu', 'section_nav_small', "varchar(16) NOT NULL DEFAULT '' AFTER `section_nav`");

$aQueries = [
    "UPDATE `sys_objects_menu` SET `section_nav`='sidebar', `section_nav_small`='list' WHERE `object`='sys_account_settings_submenu' AND `section_nav`='' AND `section_nav_small`=''",
    "DELETE FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='settings' AND `link`='page.php?i=settings'",
    "DELETE FROM `sys_pages_blocks` WHERE `object`='sys_settings' AND `module`='system' AND `type`='menu' AND `content`='sys_account_settings_submenu' AND `title`='_sys_page_block_title_settings'",
    "UPDATE `sys_menu_items` SET `active_api`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-info' AND `active_api`=0",
];

// Account before Profiles, only where both have the order they were installed with.
$sOrder = "SELECT `order` FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`=:name LIMIT 1";
if((int)$oDb->getOne($sOrder, ['name' => 'account-profile-switcher']) === 1 && (int)$oDb->getOne($sOrder, ['name' => 'account-settings-info']) === 2) {
    $aQueries[] = "UPDATE `sys_menu_items` SET `order`=2 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-profile-switcher' AND `order`=1";
    $aQueries[] = "UPDATE `sys_menu_items` SET `order`=1 WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-info' AND `order`=2";
}

foreach($aQueries as $sQuery) {
    if($oDb->query($sQuery) === false) {
        return false;
    }
}

// Menu objects are cached as whole rows: without this the new column is missing from them until the cache expires.
$oDb->cleanCache('sys_menu_objects');

return true;
