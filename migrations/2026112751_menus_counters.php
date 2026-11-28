<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Menus: how a menu of actions shows their counts (Studio > Navigation > a menu): labels, counts or button groups.
 * Empty is automatic, the menu class's own choice, so no row needs a value. MySQL has no ADD COLUMN IF NOT EXISTS,
 * so the column is checked first.
 */

$oDb = BxDolDb::getInstance();

if(!$oDb->isFieldExists('sys_objects_menu', 'counters') && $oDb->query("ALTER TABLE `sys_objects_menu` ADD `counters` varchar(16) NOT NULL DEFAULT '' AFTER `button_size`") === false)
    return false;
