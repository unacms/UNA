<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Modules: a module can be deprecated, optionally with what replaces it ('system' when the core does). The module's
 * install/config.php declares it and install and update copy it here; Studio shows a notice, and new sites don't get
 * the module. MySQL has no ADD COLUMN IF NOT EXISTS, so each column is checked first.
 */

$oDb = BxDolDb::getInstance();

if(!$oDb->isFieldExists('sys_modules', 'deprecated') && $oDb->query("ALTER TABLE `sys_modules` ADD `deprecated` tinyint(1) NOT NULL default '0' AFTER `sync_app`") === false)
    return false;

if(!$oDb->isFieldExists('sys_modules', 'replaced_by') && $oDb->query("ALTER TABLE `sys_modules` ADD `replaced_by` varchar(32) NOT NULL default '' AFTER `deprecated`") === false)
    return false;

// Module rows are cached whole: without this the new columns are missing from them until the cache expires.
BxDolModuleQuery::getInstance()->cleanModulesListCache();

return true;
