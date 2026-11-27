<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Menus: the look and the size of a menu's buttons (Studio > Navigation > a menu), which the site and the apps both
 * read. Empty is automatic, so every existing menu stays as it is. MySQL has no ADD COLUMN IF NOT EXISTS, so each
 * column is checked first.
 */

$oDb = BxDolDb::getInstance();

if(!$oDb->isFieldExists('sys_objects_menu', 'button_style') && $oDb->query("ALTER TABLE `sys_objects_menu` ADD `button_style` varchar(16) NOT NULL DEFAULT '' AFTER `template_id`") === false)
    return false;

if(!$oDb->isFieldExists('sys_objects_menu', 'button_size') && $oDb->query("ALTER TABLE `sys_objects_menu` ADD `button_size` varchar(16) NOT NULL DEFAULT '' AFTER `button_style`") === false)
    return false;

// Menu objects are cached as whole rows: without this the new columns are missing from them until the cache expires.
$oDb->cleanCache('sys_menu_objects');

return true;
