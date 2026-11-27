<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 *
 * Studio > API > Configs: the "Keep in sync" switch of a module (#6261, #6340) is the `sync_app` column of
 * sys_modules. Install SQL has it; this adds it to a site installed before.
 */

BxDolMigrationsHelper::addColumn('sys_modules', 'sync_app', "tinyint(1) NOT NULL default '1' AFTER `pending_uninstall`");
