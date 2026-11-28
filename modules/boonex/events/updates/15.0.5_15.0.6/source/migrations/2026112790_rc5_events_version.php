<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * The version of the module, as its update pack (15.0.5 to 15.0.6) leaves it. Database only: only a module that has
 * the old version gets the new one, and files come with git or with the pack.
 */

BxDolMigrationsHelper::moduleUpdated('events', '15.0.5', '15.0.6');
