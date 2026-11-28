<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * RC3 to RC4: indexes of the update pack, added only when they are missing.
 */

foreach (['bx_timeline_events', 'bx_timeline_events_slice'] as $sTable) {
    BxDolMigrationsHelper::addIndex($sTable, 'sticked_date_id', ['sticked', 'date', 'id']);
    BxDolMigrationsHelper::addIndex($sTable, 'date_id', ['date', 'id']);
    BxDolMigrationsHelper::addIndex($sTable, 'promoted', ['promoted']);
    BxDolMigrationsHelper::addIndex($sTable, 'source', ['source']);
}
