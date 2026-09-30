<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioUpdater extends BxDolStudioInstaller
{
    protected $_aModule;

    public function __construct($aConfig)
    {
        parent::__construct($aConfig);

        $this->_aModule = $this->oDb->getModuleByUri($aConfig['module_uri']);
        $this->_sModulePath = $this->_sBasePath . $aConfig['module_dir'];

        $this->_aActions = array_merge($this->_aActions, array(
            'check_module_exists' => array(
                'title' => _t('_adm_txt_modules_check_module_exists'),
            ),
            'check_module_matches' => array(
                'title' => _t('_adm_txt_modules_check_module_matches'),
            ),
            'check_module_version' => array(
                'title' => _t('_adm_txt_modules_check_module_version'),
            ),
            'check_module_hash' => array(
                'title' => _t('_adm_txt_modules_check_module_hash'),
            ),
            'update_files' => array(
                'title' => _t('_adm_txt_modules_update_files'),
            ),
            'restore_languages' => array(
                'title' => _t('_adm_txt_modules_restore_languages'),
            ),
        ));
    }

    public function update($aParams)
    {
        $bAutoUpdate = isset($aParams['autoupdate']) && (bool)$aParams['autoupdate'];
    	$bHtmlResponce = isset($aParams['html_response']) && (bool)$aParams['html_response'];

        $aResult = array(
            'operation_title' => _t('_adm_txt_modules_operation_update', $this->_aConfig['title'], $this->_aConfig['version_from'], $this->_aConfig['version_to'])
        );

        //--- Check for module to update ---//
        $aModuleInfo = $this->oDb->getModulesBy(array('type' => 'path_and_uri', 'path' => $this->_aConfig['module_dir'], 'uri' => $this->_aConfig['module_uri']));
        if(!$aModuleInfo)
            return array_merge($aResult, array(
                'code' => BX_DOL_STUDIO_IU_RCE_NOT_FOUND,
                'message' => $this->_displayResult('check_module_exists', false, '_adm_err_modules_module_not_found', $bHtmlResponce),
                'result' => false
            ));

        if(isset($aParams['module_name']) && strcmp($aParams['module_name'], $aModuleInfo['name']) !== 0)
            return array_merge($aResult, array(
                'code' => BX_DOL_STUDIO_IU_RCE_NOT_AVAILABLE,
                'message' => $this->_displayResult('check_module_matches', false, '_adm_err_modules_module_not_match', $bHtmlResponce),
                'result' => false
            ));

        //--- Check version compatibility ---//
        if(!$this->_isCompatibleWith())
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_WSV_MU,
                'message' => $this->_displayResult('check_script_version', false, _t('_adm_err_modules_wrong_version_script_update', $aModuleInfo['title']), $bHtmlResponce),
                'result' => false
            );

        //--- Check version ---//
        if(version_compare(strtolower($aModuleInfo['version']), strtolower($this->_aConfig['version_from'])) != 0)
            return array_merge($aResult, array(
                'code' => BX_DOL_STUDIO_IU_RCE_WMV,
                'message' => $this->_displayResult('check_module_version', false, '_adm_err_modules_wrong_version', $bHtmlResponce),
                'result' => false
            ));

        //--- Check hash ---//
        $aFiles = array();
        $this->hashFiles(BX_DIRECTORY_PATH_ROOT . 'modules/' . $this->_aConfig['module_dir'], $aFiles);

        list($aFilesChanged, $fChangedPercent) = $this->hashCheck($aFiles, $aModuleInfo['id']);
        $bAutoupdateForceModifiedFiles = getParam('sys_autoupdate_force_modified_files') == 'on';

    	if(!empty($aFilesChanged) && !$bAutoupdateForceModifiedFiles) 
            return array_merge($aResult, array(
                'code' => BX_DOL_STUDIO_IU_RCE_MODIFIED,
                'message' => $this->_displayResult('check_module_hash', false, '_adm_err_modules_module_was_modified', $bHtmlResponce),
                'result' => false
            ));
        else if($fChangedPercent > BX_FORCE_AUTOUPDATE_MAX_CHANGED_FILES_PERCENT && $bAutoupdateForceModifiedFiles) 
            return array_merge($aResult, array(
                'code' => BX_DOL_STUDIO_IU_RCE_CHECKSUM_FAILED,
                'message' => $this->_displayResult('check_module_hash', false, _t('_sys_upgrade_files_checksum_failed_too_many_module', round($fChangedPercent * 100), $aModuleInfo['title']), $bHtmlResponce),
                'result' => false
            ));

        //--- Perform action and check results ---//
        $aResult = array_merge($aResult, $this->_perform('install', $aParams));
        if($aResult['result']) {
            $aSet = array('version' => $this->_aConfig['version_to'], 'updated' => time());
            $aModuleConfig = self::getModuleConfig(BX_DIRECTORY_PATH_MODULES . $this->_aConfig['module_dir'] . 'install/config.php');
            if (isset($aModuleConfig['note']))
                $aSet['note'] = $aModuleConfig['note'];

            $this->oDb->updateModule($aSet, array('id' => $aModuleInfo['id']));

            //--- Remove update package ---//
            $this->delete($aParams);

            //--- Increase revision ---//
            setParam('sys_revision', 1 + getParam('sys_revision'));
        }

        return $aResult;
    }

    //--- Action Methods ---//
    protected function actionUpdateFiles($bInstall = true)
    {
        $sPath = $this->_sHomePath . 'source/';
        if(!file_exists($sPath))
            return BX_DOL_STUDIO_INSTALLER_FAILED;

		$oFile = $this->_getFileManager();
		if(empty($oFile))
			return BX_DOL_STUDIO_INSTALLER_FAILED;

		if(!$oFile->copy($sPath . '*', 'modules/' . $this->_aConfig['module_dir']))
			return BX_DOL_STUDIO_INSTALLER_FAILED;

		if(!empty($this->_aConfig['delete_files']) && is_array($this->_aConfig['delete_files']))
			foreach($this->_aConfig['delete_files'] as $sFile)
				if(!$oFile->delete('modules/' . $this->_aConfig['module_dir'] . $sFile))
					return BX_DOL_STUDIO_INSTALLER_FAILED;

		//--- Update files' tracks
		$aModuleInfo = $this->oDb->getModulesBy(array('type' => 'path_and_uri', 'path' => $this->_aConfig['module_dir'], 'uri' => $this->_aConfig['module_uri']));

		$this->oDb->deleteModuleTrackFiles($aModuleInfo['id']);
		
		$aFiles = array();
		$this->hashFiles(BX_DIRECTORY_PATH_ROOT . 'modules/' . $this->_aConfig['module_dir'], $aFiles);
		foreach($aFiles as $aFile)
			$this->oDb->insertModuleTrack($aModuleInfo['id'], $aFile);

        if (function_exists('opcache_reset'))
            opcache_reset();

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function actionExecuteSql($sOperation)
    {
    	$aModule = $this->oDb->getModuleByUri($this->_aConfig['module_uri']);
    	if(empty($aModule))
    		return BX_DOL_STUDIO_INSTALLER_FAILED;

    	$sPathInstall = $this->_sHomePath . 'install/sql/install.sql';
    	$sPathEnable = $this->_sHomePath . 'install/sql/enable.sql';

    	$mixedResult = true;
    	if(file_exists($sPathInstall))
        	$mixedResult = $this->oDb->executeSQL($sPathInstall, $this->getMarkersForDb());

		if($mixedResult === true && (int)$aModule['enabled'] == 1 && file_exists($sPathEnable))
			$mixedResult = $this->oDb->executeSQL($sPathEnable, $this->getMarkersForDb());

        return $mixedResult === true ? BX_DOL_STUDIO_INSTALLER_SUCCESS : array('code' => BX_DOL_STUDIO_INSTALLER_FAILED, 'content' => $mixedResult);
    }

    protected function actionUpdateLanguages($bInstall = true)
    {
        $aConfig = self::getModuleConfig($this->_sHomePath . 'install/config.php');
        if(empty($aConfig) || !is_array($aConfig))
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        $oLanguages = BxDolStudioLanguagesUtils::getInstance();
        $aLanguages = $oLanguages->getLanguagesExt();

        $aCategories = array();
        if(!empty($aConfig['language_category']) && is_array($aConfig['language_category'])) {
            $aCategories = $aConfig['language_category'];
            foreach($aCategories as $iIndex => $aCategory)
                $aCategories[$iIndex]['id'] = !empty($aCategory['name']) ? $oLanguages->getLanguageCategory($aCategory['name']) : 0;
        }
        else
            $aCategories[] = array(
                'id' => !empty($aConfig['language_category']) ? $oLanguages->getLanguageCategory($aConfig['language_category']) : 0,
                'name' => $aConfig['language_category'],
                'path' => ''
            );

        foreach($aLanguages as $sName => $aLanguage)
            foreach($aCategories as $iIndex => $aCategory)
            	$this->_updateLanguage($bInstall, $aLanguage, $aCategory['id'], $aCategory['path']);

        return $oLanguages->compileLanguage(0, true) ? BX_DOL_STUDIO_INSTALLER_SUCCESS : BX_DOL_STUDIO_INSTALLER_FAILED;
    }

    /*
     * Restore module's language files.
     * 
     * Note. Mainly the action is needed for Updates in 'language' type modules. 
     * It should be used after 'update_files' action if some changes were done in module's language files. 
     */
    protected function actionRestoreLanguages($bInstall = true)
    {
    	$aConfig = self::getModuleConfig($this->_sHomePath . 'install/config.php');
        if(empty($aConfig) || !is_array($aConfig) || empty($aConfig['module_uri']))
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        $oLanguages = BxDolStudioLanguagesUtils::getInstance();
        $aLanguages = $oLanguages->getLanguages();

        $bResult = true;
        foreach($aLanguages as $sName => $sTitle)
        	$bResult &= $oLanguages->restoreLanguage($sName, $aConfig['module_uri']);

        return $bResult ? BX_DOL_STUDIO_INSTALLER_SUCCESS : BX_DOL_STUDIO_INSTALLER_FAILED;
    }

    /**
     * NOTE. The action is ONLY needed for dependent module to let 
     * Notifications based module(s) know that he(they) should 
     * update (request and save) handlers from this dependent module.
     */
	protected function actionUpdateRelations($sOperation)
    {
        if(!in_array($sOperation, array('install'))) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

		if(empty($this->_aConfig['relations']) || !is_array($this->_aConfig['relations']))
            return BX_DOL_STUDIO_INSTALLER_SUCCESS;

		foreach($this->_aConfig['relations'] as $sModule) {
			if(!$this->oDb->isModuleByName($sModule))
				continue;

			$aRelation = $this->oDb->getRelationsBy(array('type' => 'module', 'value' => $sModule));
			if(empty($aRelation) || empty($aRelation['on_enable']) || empty($aRelation['on_disable']) || !BxDolRequest::serviceExists($aRelation['module'], $aRelation['on_enable']) || !BxDolRequest::serviceExists($aRelation['module'], $aRelation['on_disable']))
				continue;

			BxDolService::call($aRelation['module'], $aRelation['on_disable'], array($this->_aConfig['module_uri']));
			BxDolService::call($aRelation['module'], $aRelation['on_enable'], array($this->_aConfig['module_uri']));
		}

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	/**
     * NOTE. The action is ONLY needed for Notifications based modules 
     * to update (request and save) handlers from all dependent modules.
     */
    protected function actionUpdateRelationsForAll($sOperation)
    {
    	if(!in_array($sOperation, array('install'))) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

		$aRelation = $this->oDb->getRelationsBy(array('type' => 'module', 'value' => $this->_aModule['name']));
		if(empty($aRelation) || empty($aRelation['on_enable']) || empty($aRelation['on_disable']) || !BxDolRequest::serviceExists($this->_aModule['name'], $aRelation['on_enable']) || !BxDolRequest::serviceExists($this->_aModule['name'], $aRelation['on_disable']))
			return BX_DOL_STUDIO_INSTALLER_SUCCESS;

    	$aModules = $this->oDb->getModulesBy(array('type' => 'all', 'active' => 1));
	    foreach($aModules as $aModule) {
	    	$aConfig = self::getModuleConfig($aModule);
			if(empty($aConfig['relations']) || !is_array($aConfig['relations']) || !in_array($this->_aModule['name'], $aConfig['relations']))
				continue;

			BxDolService::call($this->_aModule['name'], $aRelation['on_disable'], array($aModule['uri']));
			BxDolService::call($this->_aModule['name'], $aRelation['on_enable'], array($aModule['uri']));
		}

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _updateLanguage($bInstall, $aLanguage, $iCategory = 0, $sPath = '')
    {
        $oLanguages = BxDolStudioLanguagesUtils::getInstance();

        $sPathAbsolute = $this->_sHomePath . 'install/langs/' . $sPath . $aLanguage['name'] . '.xml';
        $aLanguageInfo = $oLanguages->readLanguage($sPathAbsolute, 'update');
        if(empty($aLanguageInfo))
            return false;

        if(!empty($aLanguageInfo['category']))
            $iCategory = $oLanguages->getLanguageCategory($aLanguageInfo['category']);

        //--- Process delete. Note. Deletion is performed for all languages. ---//
        if(isset($aLanguageInfo['strings_del']))
            foreach($aLanguageInfo['strings_del'] as $sKey => $sValue)
                $oLanguages->deleteLanguageString($sKey, 0, false);

        //--- Process add. Note. Key's category will be updated if it doesn't match. ---//
        if(isset($aLanguageInfo['strings_add']))
            foreach($aLanguageInfo['strings_add'] as $sKey => $sValue)
                $oLanguages->addLanguageString($sKey, $sValue, $aLanguage['id'], $iCategory, false);

        //--- Process update. Note. Key's category will be updated if it doesn't match. ---//
        if(isset($aLanguageInfo['strings_upd']))
            foreach($aLanguageInfo['strings_upd'] as $sKey => $sValue)
                $oLanguages->updateLanguageString($sKey, $sValue, $aLanguage['id'], $iCategory, false);

        return true;
    }
}

/** @} */
