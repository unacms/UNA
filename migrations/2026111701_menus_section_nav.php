<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Menus: how the apps show a section's menu on large screens (Studio > Navigation > a menu): tabs (empty) or a sidebar
 * column. The connections' menu (Friends, Requests, Suggestions...) gets the sidebar; every other menu stays on tabs.
 * MySQL has no ADD COLUMN IF NOT EXISTS, so the column is checked first.
 */

$oDb = BxDolDb::getInstance();

if(!$oDb->isFieldExists('sys_objects_menu', 'section_nav') && $oDb->query("ALTER TABLE `sys_objects_menu` ADD `section_nav` varchar(16) NOT NULL DEFAULT '' AFTER `button_size`") === false)
    return false;

if($oDb->query("UPDATE `sys_objects_menu` SET `section_nav`='sidebar' WHERE `object`='sys_con_submenu' AND `section_nav`=''") === false)
    return false;

// Menu objects are cached as whole rows: without this the new column is missing from them until the cache expires.
$oDb->cleanCache('sys_menu_objects');

return true;
