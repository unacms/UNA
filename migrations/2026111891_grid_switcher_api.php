<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Grids get a second switch, for the apps: `sys_objects_grid`.`field_active_api` names the field it turns on and off
 * (the 'switcher_api' column). Studio > Navigation > a menu's items shows both switches, "Site" (`active`) and
 * "Apps" (`active_api`), instead of the "Available in App" badge after the title.
 * MySQL 5.7 has no ADD COLUMN IF NOT EXISTS, so the column is added only when it is missing.
 */

BxDolMigrationsHelper::addColumn('sys_objects_grid', 'field_active_api', "varchar(255) NOT NULL DEFAULT '' AFTER `field_active`");

$oDb = BxDolDb::getInstance();
$aBind = ['object' => 'sys_studio_nav_items'];

$aQueries = [
    "UPDATE `sys_objects_grid` SET `field_active_api` = 'active_api' WHERE `object` = :object AND `field_active_api` = ''",
    "UPDATE `sys_grid_fields` SET `title` = '_sys_grid_lbl_site' WHERE `object` = :object AND `name` = 'switcher' AND `title` = ''",
];
foreach($aQueries as $sQuery)
    if($oDb->query($sQuery, $aBind) === false)
        return false;

// the Apps column goes right after the Site one, the columns after it move one place on
$mixedOrder = $oDb->getOne("SELECT `order` FROM `sys_grid_fields` WHERE `object` = :object AND `name` = 'switcher'", $aBind);
$bExists = (bool)$oDb->getOne("SELECT `id` FROM `sys_grid_fields` WHERE `object` = :object AND `name` = 'switcher_api'", $aBind);
if($mixedOrder !== false && $mixedOrder !== null && !$bExists) {
    $aBindOrder = array_merge($aBind, ['order' => (int)$mixedOrder]);
    if($oDb->query("UPDATE `sys_grid_fields` SET `order` = `order` + 1 WHERE `object` = :object AND `order` > :order", $aBindOrder) === false)
        return false;

    if($oDb->query("INSERT INTO `sys_grid_fields` (`object`, `name`, `title`, `width`, `translatable`, `chars_limit`, `params`, `order`) VALUES (:object, 'switcher_api', '_sys_grid_lbl_apps', '1%', 0, 0, '', :order + 1)", $aBindOrder) === false)
        return false;
}

return true;
