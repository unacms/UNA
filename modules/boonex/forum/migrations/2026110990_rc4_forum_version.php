<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * RC3 to RC4: the version of the module, as its update pack (15.0.6 to 15.0.7) leaves it. Database only: only a
 * module that has 15.0.6 gets the new version, and files come with git.
 */

BxDolMigrationsHelper::moduleUpdated('forum', '15.0.6', '15.0.7');
