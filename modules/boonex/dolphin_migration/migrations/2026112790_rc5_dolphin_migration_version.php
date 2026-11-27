<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * The version of the module, as its update pack (9.0.6 to 9.0.7) leaves it. Database only: only a module that has
 * the old version gets the new one, and files come with git or with the pack.
 */

BxDolMigrationsHelper::moduleUpdated('dolphin_migration', '9.0.6', '9.0.7');
