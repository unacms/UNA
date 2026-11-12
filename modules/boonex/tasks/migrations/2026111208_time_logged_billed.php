<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Tasks: Logged and Billed time of an entry.
 * - value_original: the time as first logged (what a timer measured), the Logged time `value` may be changed later;
 * - value_billed: the Billed time, NULL while it follows the Logged one;
 * - by_timer: the entry was logged from a timer, otherwise by hand.
 * The Billable flag is replaced by the Billed time: a non-billable entry is billed for nothing. MySQL 5.7 has no
 * ADD COLUMN IF NOT EXISTS, so the helper checks the columns first.
 */

BxDolMigrationsHelper::addColumn('bx_tasks_time_track', 'value_original', "int(11) NOT NULL default '0' AFTER `value`");
BxDolMigrationsHelper::addColumn('bx_tasks_time_track', 'value_billed', "int(11) default NULL AFTER `value_original`");
BxDolMigrationsHelper::addColumn('bx_tasks_time_track', 'by_timer', "tinyint(4) NOT NULL default '0' AFTER `value_billed`");

$oDb = BxDolDb::getInstance();

//--- Entries made before this were never changed, so what they have is the time as first logged.
$oDb->query("UPDATE `bx_tasks_time_track` SET `value_original` = `value` WHERE `value_original` = 0 AND `value` <> 0");

if($oDb->isFieldExists('bx_tasks_time_track', 'billable')) {
    $oDb->query("UPDATE `bx_tasks_time_track` SET `value_billed` = 0 WHERE `billable` = 0 AND `value_billed` IS NULL");
    $oDb->query("ALTER TABLE `bx_tasks_time_track` DROP COLUMN `billable`");
}

return true;
