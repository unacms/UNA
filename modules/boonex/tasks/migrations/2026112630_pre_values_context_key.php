<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Tasks: lists of values (states, priorities) belong to a context, so the same value may be in two contexts.
 * Install SQL has `context_id` in the unique key `list_value`; a site installed before has the key without it.
 */

$oDb = BxDolDb::getInstance();

$bWithContext = (int)$oDb->getOne("SELECT COUNT(*) FROM `information_schema`.`STATISTICS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'bx_tasks_pre_values' AND `INDEX_NAME` = 'list_value' AND `COLUMN_NAME` = 'context_id'") > 0;
if (!$bWithContext) {
    if ($oDb->isIndexExists('bx_tasks_pre_values', 'list_value'))
        $oDb->query("ALTER TABLE `bx_tasks_pre_values` DROP INDEX `list_value`");
    $oDb->query("ALTER TABLE `bx_tasks_pre_values` ADD UNIQUE KEY `list_value` (`context_id`, `list`, `value`(191))");
}
