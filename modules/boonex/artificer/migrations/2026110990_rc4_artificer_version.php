<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * RC3 to RC4: the version of the module, as its update pack (15.0.7 to 15.0.8) leaves it. Database only: only a
 * module that has 15.0.7 gets the new version, and files come with git.
 */

BxDolMigrationsHelper::moduleUpdated('artificer', '15.0.7', '15.0.8');
