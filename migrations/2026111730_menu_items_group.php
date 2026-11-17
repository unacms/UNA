<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Menu items: a group (Studio > Navigation > an item > "Group in the apps"): none (empty), account, profile or danger.
 * The apps draw a menu whose items have groups as sections; the account's settings use them. Until now the group was
 * a key of the item's app config (`config_api`: {"group":"account"}), which Studio has no field for. It moves to its
 * own column, for the items of every module at once: a config that holds only the group is emptied, one with more in
 * it is left as it is (the apps still read the group from it). An item that has a group already keeps it. MySQL has no
 * ADD COLUMN IF NOT EXISTS, so the column is added only when it is missing.
 */

$oDb = BxDolDb::getInstance();

BxDolMigrationsHelper::addColumn('sys_menu_items', 'group_name', "varchar(32) NOT NULL DEFAULT '' AFTER `config_api`");

foreach(['account', 'profile', 'danger'] as $sGroup) {
    $sConfig = '{"group":"' . $sGroup . '"}';
    $aQueries = [
        $oDb->prepare("UPDATE `sys_menu_items` SET `group_name`=? WHERE `config_api`=? AND `group_name`=''", $sGroup, $sConfig),
        $oDb->prepare("UPDATE `sys_menu_items` SET `config_api`='' WHERE `config_api`=?", $sConfig),
    ];
    foreach($aQueries as $sQuery) {
        if($oDb->query($sQuery) === false) {
            return false;
        }
    }
}

return true;
