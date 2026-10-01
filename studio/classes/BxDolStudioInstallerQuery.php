<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioInstallerQuery extends BxDolModuleQuery
{
    function __construct()
    {
        parent::__construct();
    }

    function insertRelation($sModule, $aRelation)
    {
    	$aRelation['module'] = $sModule;
        return (int)$this->query("INSERT INTO `sys_modules_relations` SET `module`=:module, `on_install`=:on_install, `on_uninstall`=:on_uninstall, `on_enable`=:on_enable, `on_disable`=:on_disable", $aRelation) > 0;
    }

	function deleteRelation($sModule)
    {
    	$sQuery = $this->prepare("DELETE FROM `sys_modules_relations` WHERE `module`=? LIMIT 1", $sModule);
        return (int)$this->query($sQuery) > 0;
    }

    function getRelationsBy($aParams = array())
    {
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
    	$sWhereClause = "";

        switch($aParams['type']) {
            case 'module':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                	'module' => $aParams['value']
                );

                $sWhereClause .= " AND `module`=:module";
                break;
        }

        $aMethod['params'][0] = "SELECT
                `id`,
                `module`,
                `on_install`,
                `on_uninstall`,
                `on_enable`,
                `on_disable`
            FROM `sys_modules_relations`
            WHERE 1" . $sWhereClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    function insertModule(&$aConfig)
    {
        $sHelpUrl = isset($aConfig['help_url']) ? $aConfig['help_url'] : '';
        $sNote = isset($aConfig['note']) ? $aConfig['note'] : '';

        $sDependencies = '';
        if(isset($aConfig['install']['check_dependencies']) && (int)$aConfig['install']['check_dependencies'] == 1 && !empty($aConfig['dependencies']) && is_array($aConfig['dependencies']))
            $sDependencies = implode(',', array_keys($aConfig['dependencies']));

        $sQuery = $this->prepare("INSERT IGNORE INTO `sys_modules`(`type`, `name`, `title`, `note`, `vendor`, `version`, `help_url`, `path`, `uri`, `class_prefix`, `db_prefix`, `lang_category`, `dependencies`, `date`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP())", $aConfig['type'], $aConfig['name'], $aConfig['title'], $sNote, $aConfig['vendor'], $aConfig['version'], $sHelpUrl, $aConfig['home_dir'], $aConfig['home_uri'], $aConfig['class_prefix'], $aConfig['db_prefix'], $aConfig['language_category'], $sDependencies);
        $iResult = (int)$this->query($sQuery);

        if ($iResult > 0) {
            $iRet = (int)$this->lastId();
            $this->cleanCache('sys_modules_list');
            return $iRet;
        } else {
            return 0;
        }
    }

    function insertModuleTrack($iModuleId, &$aFile)
    {
        $sQuery = $this->prepare("INSERT IGNORE INTO `sys_modules_file_tracks`(`module_id`, `file`, `hash`) VALUES(?, ?, ?)", $iModuleId, $aFile['file'], $aFile['hash']);
        $this->query($sQuery);
    }

    function getModuleTrackFiles($iModuleId)
    {
        $sQuery = $this->prepare("SELECT `file`, `hash` FROM `sys_modules_file_tracks` WHERE `module_id` = ?", $iModuleId);
        return $this->getAllWithKey($sQuery, "file");
    }

    function deleteModuleTrackFiles($iModuleId)
    {
        $sQuery = $this->prepare("DELETE FROM `sys_modules_file_tracks` WHERE `module_id` = ?", $iModuleId);
        return $this->query($sQuery);
    }

    function deleteModule($aConfig)
    {
        $sQuery = $this->prepare("SELECT `id` FROM `sys_modules` WHERE `vendor`=? AND `path`=? LIMIT 1", $aConfig['vendor'], $aConfig['home_dir']);
        $iId = (int)$this->getOne($sQuery);

        $sQuery = $this->prepare("DELETE FROM `sys_modules` WHERE `vendor`=? AND `path`=? LIMIT 1", $aConfig['vendor'], $aConfig['home_dir']);
        $this->query($sQuery);

        $this->deleteModuleTrackFiles($iId);

        $this->cleanCache('sys_modules_list');

        return $iId;
    }
}

/** @} */
