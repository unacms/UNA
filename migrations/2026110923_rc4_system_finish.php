<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC3
 *
 * RC3 to RC4: the last step of the update pack, the version of the system module. Only a site that has
 * RC3 (15.0.0.RC3 or 15.0.0-RC3) gets RC4. Files are not touched, they come with git.
 */

BxDolMigrationsHelper::moduleUpdated('system', '15.0.0-RC3', '15.0.0-RC4');
