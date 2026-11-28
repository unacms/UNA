<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * The version of the module, as its update pack (13.0.1 to 13.0.2) leaves it. Database only: only a module that has
 * the old version gets the new one, and files come with git or with the pack.
 */

BxDolMigrationsHelper::moduleUpdated('api', '13.0.1', '13.0.2');
