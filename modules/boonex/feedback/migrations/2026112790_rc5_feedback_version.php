<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * The version of the module, as its update pack (11.0.0 to 11.0.1) leaves it. Database only: only a module that has
 * the old version gets the new one, and files come with git or with the pack.
 */

BxDolMigrationsHelper::moduleUpdated('feedback', '11.0.0', '11.0.1');
