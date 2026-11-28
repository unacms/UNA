<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Tasks: billable flag of time entries. MySQL has no ADD COLUMN IF NOT EXISTS, so the column is checked first.
 */

$oDb = BxDolDb::getInstance();
if($oDb->isFieldExists('bx_tasks_time_track', 'billable'))
    return true;

return $oDb->query("ALTER TABLE `bx_tasks_time_track` ADD `billable` tinyint(4) NOT NULL default '1' AFTER `value_date`") !== false;
