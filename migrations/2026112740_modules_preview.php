<?php defined('BX_DOL') or die('hack attempt');
/*
 * UNA-Migration-Min-System-Version: 15.0.0-RC4
 * Modules: a module can be marked as a preview, unfinished work that is installed and updated like any module and
 * labelled in Studio and the installer. The module's install/config.php declares `'preview' => true`, and install and
 * update copy it here. This also copies it for the modules a site already has, since their configs say it now.
 * MySQL has no ADD COLUMN IF NOT EXISTS, so the column is checked first.
 */

$oDb = BxDolDb::getInstance();

if(!$oDb->isFieldExists('sys_modules', 'preview') && $oDb->query("ALTER TABLE `sys_modules` ADD `preview` tinyint(1) NOT NULL default '0' AFTER `replaced_by`") === false)
    return false;

// Module rows are cached whole: without this the new column is missing from them until the cache expires.
$oModules = BxDolModuleQuery::getInstance();
$oModules->cleanModulesListCache();

foreach($oModules->getModules() as $aModule)
    if(($aConfig = BxDolInstallerUtils::getModuleConfig($aModule)))
        $oModules->setModulePreview($aModule['id'], $aConfig);

$oModules->cleanModulesListCache();

return true;
