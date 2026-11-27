<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * The version of the system module, as the update pack (15.0.0-RC4 to 15.0.0-RC5) leaves it. Only a site that has the old
 * version gets the new one. Files are not touched, they come with git or with the pack.
 */

BxDolMigrationsHelper::moduleUpdated('system', '15.0.0-RC4', '15.0.0-RC5');
