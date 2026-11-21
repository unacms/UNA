<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Account settings menu (sys_account_settings): its sections are items without a link, Account and the current
 * profile (titled with the profile's name), and the items are their subitems. The apps draw each section as a heading
 * over its items, the site's tab row shows the items in their place. Deleting the account is marked in its app config
 * (`{"danger":true}`) for the destructive colour. They replace the items' group (Studio > Navigation > an item >
 * "Group in the apps", sys_menu_items.group_name), whose column goes. The modules' items move under the profile's
 * section in their own migrations of this number, which run after this one.
 * An item that is already under a parent, or a delete item with an app config of its own, is left as it is.
 */

$oDb = BxDolDb::getInstance();

$aSections = [
    ['account-settings-section-account', '_sys_menu_item_title_system_account_settings_section_account', '_sys_menu_item_title_account_settings_section_account', 1],
    ['account-settings-section-profile', '_sys_menu_item_title_system_account_settings_section_profile', '_sys_menu_item_title_account_settings_section_profile', 2],
];

$aQueries = [];
foreach ($aSections as list($sName, $sTitleSystem, $sTitle, $iOrder)) {
    $aQueries[] = $oDb->prepare("INSERT INTO `sys_menu_items` (`set_name`, `module`, `name`, `title_system`, `title`, `link`, `onclick`, `target`, `icon`, `submenu_object`, `visible_for_levels`, `visibility_custom`, `active`, `active_api`, `copyable`, `order`)
        SELECT 'sys_account_settings', 'system', ?, ?, ?, '', '', '', '', '', 2147483646, '', 1, 1, 0, ? FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `name`=?)", $sName, $sTitleSystem, $sTitle, $iOrder, $sName);
}
foreach ($aQueries as $sQuery) {
    if ($oDb->query($sQuery) === false) {
        return false;
    }
}

$aChildren = [
    'account-settings-section-account' => ['account-settings-info', 'account-profile-switcher', 'account-settings-email', 'account-settings-password'],
    'account-settings-section-profile' => ['profile-settings-cfilter'],
];
foreach ($aChildren as $sSection => $aNames) {
    $iParent = (int)$oDb->getOne($oDb->prepare("SELECT `id` FROM `sys_menu_items` WHERE `set_name`='sys_account_settings' AND `name`=? LIMIT 1", $sSection));
    if (!$iParent) {
        return false;
    }

    $sQuery = $oDb->prepare("UPDATE `sys_menu_items` SET `parent_id`=? WHERE `set_name`='sys_account_settings' AND `module`='system' AND `parent_id`=0 AND `name` IN (" . $oDb->implode_escape($aNames) . ")", $iParent);
    if ($oDb->query($sQuery) === false) {
        return false;
    }
}

$sQuery = "UPDATE `sys_menu_items` SET `config_api`='{\"danger\":true}' WHERE `set_name`='sys_account_settings' AND `module`='system' AND `name`='account-settings-delete' AND `config_api` IN ('', '{\"group\":\"danger\"}')";
if ($oDb->query($sQuery) === false) {
    return false;
}

BxDolMigrationsHelper::dropColumn('sys_menu_items', 'group_name');

return true;
