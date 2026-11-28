<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * RC3 to RC4: the index of the update pack, added only when it is missing.
 */

BxDolMigrationsHelper::addIndex('bx_credits_history', 'date', ['date', 'type', 'direction']);
