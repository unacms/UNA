<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define("BX_DOL_STUDIO_INSTALLER_SUCCESS", 0);
define("BX_DOL_STUDIO_INSTALLER_FAILED", 1);

/**
 * Base class for Installer classes in modules engine.
 *
 * The class contains different check functions which are used during the installation process.
 * An object of the class is created automatically with modules installer.
 * Installation/Uninstallation process can be controlled with config.php file located in  [module]/install/ folder.
 *
 *
 * Example of usage:
 * refer to the BoonEx modules
 *
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 *
 * Alerts:
 * no alerts available
 *
 */

class BxDolStudioInstaller extends BxDolInstallerUtils
{
    protected $oDb;

    protected $_aConfig;
    protected $_sBasePath;
    protected $_sHomePath;
    protected $_sModulePath;

    protected $_bUseFtp;
    protected $_aActions;

    protected $_bShowOnSuccess = false;

    public function __construct($aConfig)
    {
        parent::__construct();

        $this->oDb = bx_instance('BxDolStudioInstallerQuery');

        $this->_aConfig = $aConfig;
        $this->_sBasePath = BX_DIRECTORY_PATH_MODULES;
        $this->_sHomePath = $this->_sBasePath . $aConfig['home_dir'];
        $this->_sModulePath = $this->_sBasePath . $aConfig['home_dir'];

        $this->_bUseFtp = BX_FORCE_USE_FTP_FILE_TRANSFER;

        $this->_aActions = array(
            'perform_install' => array(
                'title' => '',
                'success' => _t('_adm_msg_modules_success_install'),
                'failed' => ''
            ),
            'perform_uninstall' => array(
                'title' => '',
                'success' => _t('_adm_msg_modules_success_uninstall'),
                'failed' => ''
            ),
            'perform_enable' => array(
                'title' => '',
                'success' => _t('_adm_msg_modules_success_enable'),
                'failed' => ''
            ),
            'perform_disable' => array(
                'title' => '',
                'success' => _t('_adm_msg_modules_success_disable'),
                'failed' => ''
            ),
            'check_script_version' => array(
                'title' => _t('_adm_txt_modules_check_script_version'),
            ),
            'check_dependencies' => array(
                'title' => _t('_adm_txt_modules_check_dependencies'),
            ),
            'show_introduction' => array(
                'title' => _t('_adm_txt_modules_show_introduction'),
            ),
            'move_sources' => array(
                'title' => _t('_adm_txt_modules_move_sources'),
            ),
            'execute_sql' => array(
                'title' => _t('_adm_txt_modules_execute_sql'),
            ),
            'install_language' => array(
                'title' => _t('_adm_txt_modules_install_language'),
            ),
            'update_languages' => array(
                'title' => _t('_adm_txt_modules_update_languages'),
            ),
            'update_relations' => array(
                'title' => _t('_adm_txt_modules_update_relations'),
            ),
            'update_relations_for_all' => array(
                'title' => _t('_adm_txt_modules_update_relations_for_all'),
            ),
            'process_connections' => array(
                'title' => _t('_adm_txt_modules_process_connections'),
            ),
            'process_deleted_profiles' => array(
                'title' => _t('_adm_txt_modules_process_deleted_profiles'),
            ),
            'process_menu_triggers' => array(
                'title' => _t('_adm_txt_modules_process_menu_triggers'),
            ),
            'process_page_triggers' => array(
                'title' => _t('_adm_txt_modules_process_page_triggers'),
            ),
            'process_storages' => array(
                'title' => _t('_adm_txt_modules_process_storages'),
            ),
            'process_esearches' => array(
                'title' => _t('_adm_txt_modules_process_esearches'),
            ),
            'register_transcoders' => array(
                'title' => _t('_adm_txt_modules_register_transcoders'),
            ),
            'unregister_transcoders' => array(
                'title' => _t('_adm_txt_modules_unregister_transcoders'),
            ),
            'clear_db_cache' => array(
                'title' => _t('_adm_txt_modules_clear_db_cache'),
            ),
            'clear_template_cache' => array(
                'title' => _t('_adm_txt_modules_clear_template_cache'),
            ),
            'show_conclusion' => array(
                'title' => _t('_adm_txt_modules_show_conclusion'),
            ),
        );

        $this->_aNonHashableFiles = array(
            'install',
            'updates'
        );
    }

    public function install($aParams, $bAutoEnable = false)
    {
    	//--- Auto uninstall before install ---//
    	$this->disable($aParams);
    	$this->uninstall($aParams);

    	$bAutoEnable = $bAutoEnable || (isset($aParams['auto_enable']) && (bool)$aParams['auto_enable']);
    	$bHtmlResponce = isset($aParams['html_response']) && (bool)$aParams['html_response'];

        //--- Check whether the module was already installed ---//
        if($this->oDb->isModule($this->_aConfig['home_uri']))
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_ALREADY_PERFORMED,
                'message' => _t('_adm_err_modules_already_installed'),
                'result' => false
            );

        $aResult = array();
        bx_alert('system', 'before_install', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        if ($aResult && !$aResult['result'])
            return $aResult;

        //--- Check mandatory settings ---//
        if($this->oDb->isModuleParamsUsed($this->_aConfig['name'], $this->_aConfig['home_uri'], $this->_aConfig['home_dir'], $this->_aConfig['db_prefix'], $this->_aConfig['class_prefix']))
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_UNIQUE_PARAMS_USED,
                'message' => _t('_adm_txt_modules_params_used'),
                'result' => false
            );

        //--- Check version compatibility ---//
        if(!$this->_isCompatibleWith())
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_WSV_MI,
                'message' => $this->_displayResult('check_script_version', false, '_adm_err_modules_wrong_version_script', $bHtmlResponce),
                'result' => false
            );

        //--- Check for available translations ---//
        $oFile = $this->_getFileManager();
        $sModuleUri = $this->_aConfig['home_uri'];

        $aLanguages = $this->oDb->getModulesBy(array('type' => 'languages'));
        foreach($aLanguages as $aLanguage) {
            if($aLanguage['uri'] == 'en')
                continue;

            $aLanguageConfig = self::getModuleConfig(BX_DIRECTORY_PATH_MODULES . $aLanguage['path'] . '/install/config.php');
            if(empty($aLanguageConfig))
                    continue;

            if(!isset($aLanguageConfig['includes'][$sModuleUri]) || empty($aLanguageConfig['includes'][$sModuleUri]))
                continue;

            $sSrcPath = 'modules/' . $aLanguage['path'] . 'install/data/' . $aLanguageConfig['includes'][$sModuleUri];
            $sDstPath = $aLanguageConfig['includes'][$sModuleUri];
            $oFile->copy($sSrcPath, $sDstPath);
        }

        $aResultBefore = $this->_onInstallBefore();
        if($aResultBefore !== BX_DOL_STUDIO_INSTALLER_SUCCESS)
            return array(
                'message' => $aResultBefore['content'],
                'result' => false
            );

        //--- Check actions ---//
        $aResult = $this->_perform('install', $aParams);
        if($aResult['result']) {
            $iModuleId = $this->oDb->insertModule($this->_aConfig);

            if(($iModuleSubtypes = $this->getSubtypes($this->_aConfig['name'])) != 0)
                $this->oDb->updateModule(['subtypes' => $iModuleSubtypes], ['id' => $iModuleId]);

            $sTitleKey = BxDolModule::getTitleKey($this->_aConfig['home_uri']);

            $oLanguages = BxDolStudioLanguagesUtils::getInstance();
            $oLanguages->addLanguageString($sTitleKey, $this->_aConfig['title']);
            $oLanguages->compileLanguage();

            BxDolStudioInstallerUtils::getInstance()->checkModules();

            $aFiles = array();
            $this->hashFiles($this->_sModulePath, $aFiles);

            foreach($aFiles as $aFile)
                $this->oDb->insertModuleTrack($iModuleId, $aFile);

            $this->cleanupMemoryAfterAction($this->_aConfig['name'], $this->_aConfig['home_uri'], $iModuleId);

            $this->_onInstallAfter();

            if(!empty($this->_aConfig['install_success']))
            	$this->_perform('install_success', $aParams);
        }
    	else {
            if(!empty($this->_aConfig['install_failed']))
            	$this->_perform('install_failed', $aParams);
        }

        bx_alert('system', 'install', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));

        if($aResult['result'] && $bAutoEnable) {
            $aResultEnable = $this->enable($aParams);

            $aResult['result'] = $aResult['result'] & $aResultEnable['result'];
            $aResult['message'] = $aResult['message'] . $aResultEnable['message'];
        }

        return $aResult;
    }

    public function uninstall($aParams, $bAutoDisable = false)
    {
    	$bAutoDisable = $bAutoDisable || (isset($aParams['auto_disable']) && (bool)$aParams['auto_disable']);
    	$bHtmlResponce = isset($aParams['html_response']) && (bool)$aParams['html_response'];

        //--- Check whether the module was already uninstalled ---//
        if(!$this->oDb->isModule($this->_aConfig['home_uri']))
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_ALREADY_PERFORMED,
                'message' => _t('_adm_err_modules_already_uninstalled'),
                'result' => false
            );

        if($bAutoDisable) {
            $aResultDisable = $this->disable($aParams);
            if(!$aResultDisable['result'])
            	return $aResultDisable;
        }

        $aResult = array();
        bx_alert('system', 'before_uninstall', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        if ($aResult && !$aResult['result'])
            return $aResult;

        //--- Check for dependent modules ---//
        $bDependent = false;
        $aDependents = $this->oDb->getDependent($this->_aConfig['name'], $this->_aConfig['home_uri']);
        if(is_array($aDependents) && !empty($aDependents)) {
            $bDependent = true;

            $sMessage = '<br />' . _t('_adm_err_modules_wrong_dependency_uninstall') . '<br />';
            foreach($aDependents as $aDependent)
                $sMessage .= $aDependent['title'] . '<br />';
        }

        if($bDependent)
            return array(
                'message' => $this->_displayResult('check_dependencies', false, $sMessage, $bHtmlResponce),
                'result' => false
            );

        //--- Process storages and comments ---//
        $aResultBefore = $this->_onUninstallBefore();
        if($aResultBefore !== BX_DOL_STUDIO_INSTALLER_SUCCESS)
            return array(
                'message' => $aResultBefore['content'],
                'result' => false
            );

        $aResult = $this->_perform('uninstall', $aParams);
        if($aResult['result']) {
            $iModuleId = $this->oDb->deleteModule($this->_aConfig);

            $sTitleKey = BxDolModule::getTitleKey($this->_aConfig['home_uri']);

            $oLanguages = BxDolStudioLanguagesUtils::getInstance();
            $oLanguages->deleteLanguageString($sTitleKey);
            $oLanguages->compileLanguage();

            $this->cleanupMemoryAfterAction($this->_aConfig['name'], $this->_aConfig['home_uri'], $iModuleId);

            $this->_onUninstallAfter();

            if(!empty($this->_aConfig['uninstall_success']))
            	$this->_perform('uninstall_success', $aParams);
        }
    	else {
        	if(!empty($this->_aConfig['uninstall_failed']))
            	$this->_perform('uninstall_failed', $aParams);
        }

        if($bAutoDisable) {
	        $aResult['result'] = $aResultDisable['result'] & $aResult['result'];
			$aResult['message'] = $aResultDisable['message'] . $aResult['message'];
        }

        bx_alert('system', 'uninstall', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        return $aResult;
    }

    public function delete($aParams)
    {
    	$aError = array(
            'message' => _t('_adm_err_modules_cannot_remove_package'),
            'result' => false
        );

    	$oFile = $this->_getFileManager();
    	if(empty($oFile))
            return $aError;

        if(!$oFile->delete('modules/' . $this->_aConfig['home_dir']))
            return $aError;

        return array(
            'message' => '', //_t('_adm_msg_modules_success_delete'),
            'result' => true
        );
    }

    public function enable($aParams)
    {
    	//--- Auto disable before enable ---//
    	$this->disable($aParams);

        $aModule = $this->oDb->getModuleByUri($this->_aConfig['home_uri']);

        //--- Check whether the module is installed ---//
        if(empty($aModule) || !is_array($aModule))
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_NOT_FOUND,
                'message' => _t('_adm_err_modules_module_not_installed'),
                'result' => false
            );

        //--- Check whether the module is already enabled ---//
        if((int)$aModule['enabled'] != 0)
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_ALREADY_PERFORMED,
                'message' => _t('_adm_err_modules_already_enabled'),
                'result' => false
            );

        $aResult = array();
        if(!empty($this->_aConfig['before_enable'])) {
            $aResult = $this->_perform('before_enable', $aParams);
            if($aResult && !$aResult['result'])
                return $aResult;
        }

        $aResult = array();
        bx_alert('system', 'before_enable', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        if ($aResult && !$aResult['result'])
            return $aResult;

        $aResultBefore = $this->_onEnableBefore();
        if($aResultBefore !== BX_DOL_STUDIO_INSTALLER_SUCCESS)
            return array(
                'message' => $aResultBefore['content'],
                'result' => false
            );

        $aResult = $this->_perform('enable', $aParams);
        if($aResult['result']) {
            $this->oDb->enableModuleByUri($aModule['uri']);

            $this->cleanupMemoryAfterAction($aModule['name'], $aModule['uri'], $aModule['id']);

            $this->_onEnableAfter();

            if(!empty($this->_aConfig['enable_success']))
            	$this->_perform('enable_success', $aParams);
        }
        else {
            if(!empty($this->_aConfig['enable_failed']))
            	$this->_perform('enable_failed', $aParams);
        }

        setParam('sys_revision', 1 + getParam('sys_revision'));

        bx_alert('system', 'enable', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        return $aResult;
    }

    public function disable($aParams)
    {
    	$bHtmlResponce = isset($aParams['html_response']) && (bool)$aParams['html_response'];

        $aModule = $this->oDb->getModuleByUri($this->_aConfig['home_uri']);

        //--- Check whether the module is installed ---//
        if(empty($aModule) || !is_array($aModule))
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_NOT_FOUND,
                'message' => _t('_adm_err_modules_module_not_installed'),
                'result' => false
            );

        //--- Check whether the module is already disabled ---//
        if((int)$aModule['enabled'] == 0)
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_ALREADY_PERFORMED,
                'message' => _t('_adm_err_modules_already_disabled'),
                'result' => false
            );

        $aResult = array();
        if(!empty($this->_aConfig['before_disable'])) {
            $aResult = $this->_perform('before_disable', $aParams);
            if($aResult && !$aResult['result'])
                return $aResult;
        }

        $aResult = array();
        bx_alert('system', 'before_disable', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        if ($aResult && !$aResult['result'])
            return $aResult;

        //--- Check for dependent modules ---//
        $bDependent = false;
        $aDependents = $this->oDb->getDependent($this->_aConfig['name'], $this->_aConfig['home_uri']);
        if(is_array($aDependents) && !empty($aDependents)) {
            $bDependent = true;

            $sMessage = '<br />' . _t('_adm_err_modules_wrong_dependency_disable') . '<br />';
            foreach($aDependents as $aDependent)
                $sMessage .= $aDependent['title'] . '<br />';
        }

        if($bDependent)
            return array(
                'message' => $this->_displayResult('check_dependencies', false, $sMessage, $bHtmlResponce),
                'result' => false
            );

        $aResultBefore = $this->_onDisableBefore();
        if($aResultBefore !== BX_DOL_STUDIO_INSTALLER_SUCCESS)
            return array(
                'message' => $aResultBefore['content'],
                'result' => false
            );

        $aResult = $this->_perform('disable', $aParams);
        if($aResult['result']) {
            $this->oDb->disableModuleByUri($aModule['uri']);

            $this->cleanupMemoryAfterAction($aModule['name'], $aModule['uri'], $aModule['id']);

            $this->_onDisableAfter();

            if(!empty($this->_aConfig['disable_success']))
            	$this->_perform('disable_success', $aParams);
        }
        else {
        	if(!empty($this->_aConfig['disable_failed']))
            	$this->_perform('disable_failed', $aParams);
        }

        bx_alert('system', 'disable', 0, false, array ('config' => $this->_aConfig, 'result' => &$aResult));
        return $aResult;
    }
    
    public function callAction($sOperation, $sAction)
    {
        $sMethod = 'action' . bx_gen_method_name($sAction);
        if(!method_exists($this, $sMethod))
            return ['code' => BX_DOL_STUDIO_INSTALLER_FAILED, 'msg' => _t('_sys_txt_not_found')];

        return $this->$sMethod($sOperation);
    }

    //--- Get/Set Methods ---//
    public function getVendor()
    {
        return $this->_aConfig['vendor'];
    }
    public function getName()
    {
        return $this->_aConfig['name'];
    }
    public function getTitle()
    {
        return $this->_aConfig['title'];
    }
    public function getHomeDir()
    {
        return $this->_aConfig['home_dir'];
    }

    //--- Action Methods ---//
    protected function actionOperationFailed($mixedResult)
    {
        return _t('_adm_err_modules_process_action_failed');
    }
    protected function actionCheckDependencies($sOperation)
    {
        $sContent = '';

        if(in_array($sOperation, array('install', 'enable', 'update'))) {
            if(!isset($this->_aConfig['dependencies']) || !is_array($this->_aConfig['dependencies']))
                return BX_DOL_STUDIO_INSTALLER_SUCCESS;

            foreach($this->_aConfig['dependencies'] as $sModule => $sModuleTitle) {
                if($this->oDb->isModule($sModule) && $this->oDb->isEnabled($sModule))
                    continue;

                if($this->oDb->isModuleByName($sModule) && $this->oDb->isEnabledByName($sModule))
                    continue;

                $sContent .= $sModuleTitle . '<br />';
            }

            if(!empty($sContent))
                $sContent = '<br />' . _t('_adm_err_modules_wrong_dependency_install') . '<br />' . $sContent;
        }

        return empty($sContent) ? BX_DOL_STUDIO_INSTALLER_SUCCESS : array('code' => BX_DOL_STUDIO_INSTALLER_FAILED, 'content' => $sContent);
    }
    protected function actionCheckDependenciesFailed($mixedResult)
    {
        return $mixedResult['content'];
    }
    protected function actionShowIntroduction($sOperation)
    {
        if(!isset($this->_aConfig[$sOperation . '_info']['introduction']))
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        $sPath = $this->_sHomePath . 'install/info/' . $this->_aConfig[$sOperation . '_info']['introduction'];
        return file_exists($sPath) ? array("code" => BX_DOL_STUDIO_INSTALLER_SUCCESS, "content" => file_get_contents($sPath)) : BX_DOL_STUDIO_INSTALLER_FAILED;
    }
    protected function actionShowConclusion($sOperation)
    {
        if(!isset($this->_aConfig[$sOperation . '_info']['conclusion']))
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        $sPath = $this->_sHomePath . 'install/info/' . $this->_aConfig[$sOperation . '_info']['conclusion'];
        return file_exists($sPath) ? array("code" => BX_DOL_STUDIO_INSTALLER_SUCCESS, "content" => file_get_contents($sPath)) : BX_DOL_STUDIO_INSTALLER_FAILED;
    }
    protected function actionMoveSources($sOperation)
    {
        $oFile = $this->_getFileManager();
        $aInstalled = array_merge(array('system'), $this->oDb->getModulesUri());

        $bResult = true;
        foreach($this->_aConfig['includes'] as $sUri => $sPath) {
            if(!in_array($sUri, $aInstalled) || empty($sPath))
                continue;

            if($sOperation == 'install') {
                $sSrcPath = 'modules/' . $this->_aConfig['home_dir'] . 'install/data/' . $sPath;
                $sDstPath = $sPath;
                $bResult &= $oFile->copy($sSrcPath, $sDstPath);
            } else if($sOperation == 'uninstall')
                $bResult &= $oFile->delete($sPath);
        }

        return $bResult ? BX_DOL_STUDIO_INSTALLER_SUCCESS : BX_DOL_STUDIO_INSTALLER_FAILED;
    }
    protected function actionExecuteSql($sOperation)
    {
        switch($sOperation) {
            case 'install':
                $this->actionExecuteSql('disable');
                $this->actionExecuteSql('uninstall');
                break;
            case 'enable':
                $this->actionExecuteSql('disable');
                break;
        }

        $mixedResult = $this->oDb->executeSQL($this->_sHomePath . 'install/sql/' . $sOperation . '.sql', $this->getMarkersForDb());

        return $mixedResult === true ? BX_DOL_STUDIO_INSTALLER_SUCCESS : array('code' => BX_DOL_STUDIO_INSTALLER_FAILED, 'content' => $mixedResult);
    }
    protected function actionExecuteSqlAddons($sOperation)
    {
        $sPath = $this->_sHomePath . 'install/sql/';
        $aMarkers = $this->getMarkersForDb();

        $aErrors = [];
        if(($rHandle = opendir($sPath)) !== false) {
            while(($sFile = readdir($rHandle)) !== false) {
                if(!is_file($sPath . $sFile) || substr($sFile, 0, strlen($sOperation) + 1) != $sOperation . '-')
                    continue;

                if(($mixedResult = $this->oDb->executeSQL($sPath . $sFile, $aMarkers)) !== true)
                    $aErrors += $mixedResult;
            }
            closedir($rHandle);
        }

        return !$aErrors ? BX_DOL_STUDIO_INSTALLER_SUCCESS : array('code' => BX_DOL_STUDIO_INSTALLER_FAILED, 'content' => $aErrors);
    }
    protected function actionExecuteSqlFailed($mixedResult)
    {
    	if(is_int($mixedResult))
    		return $this->actionOperationFailed($mixedResult);

        $sResult = _t('_adm_err_modules_wrong_mysql_query') . '<br />';
        foreach($mixedResult['content'] as $aQuery) {
            $sResult .= _t('_adm_err_modules_wrong_mysql_query_msg', $aQuery['error']) . '<br />';
            $sResult .= '<pre>' . $aQuery['query'] . '</pre>';
        }
        return $sResult;
    }
    protected function actionInstallLanguage($sOperation)
    {
        $oLanguages = BxDolStudioLanguagesUtils::getInstance();

        $sLanguage = isset($this->_aConfig['home_uri']) ? $this->_aConfig['home_uri'] : '';

        $bResult = true;
        if($sOperation == 'install')
            $bResult = $oLanguages->installLanguage(array('name' => $this->_aConfig['name'], 'path' => $this->_aConfig['home_dir'], 'uri' => $this->_aConfig['home_uri'], 'lang_category' => $this->_aConfig['language_category']), false);
        if($bResult)
            $bResult &= $oLanguages->compileLanguage(0, true);

        $oLanguages->fixLanguage($sLanguage);

        return $bResult ? BX_DOL_STUDIO_INSTALLER_SUCCESS : BX_DOL_STUDIO_INSTALLER_FAILED;
    }
    protected function actionUpdateLanguages($sOperation)
    {
        if(!isset($this->_aConfig['language_category']) || empty($this->_aConfig['language_category']))
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        $oLanguages = BxDolStudioLanguagesUtils::getInstance();

        $bResult = true;
        $aResult = array();

        //--- Process Language Category ---//
        if($sOperation == 'install')
            $iCategoryId = $oLanguages->addLanguageCategory($this->_aConfig['language_category']);

        //--- Process languages' key=>value pears ---//
        $aModule = array(
        	'name' => $this->_aConfig['name'],
            'path' => $this->_aConfig['home_dir'],
            'uri' => $this->_aConfig['home_uri'],
            'lang_category' => $this->_aConfig['language_category']
        );

        if($sOperation == 'install')
            $bResult = $oLanguages->restoreLanguage(0, $aModule, false);
        else if($sOperation == 'uninstall')
            $bResult = $oLanguages->removeLanguageByModule($aModule, false);

        if($sOperation == 'uninstall' && $bResult)
            $oLanguages->deleteLanguageCategory($this->_aConfig['language_category']);

        return $bResult && $oLanguages->compileLanguage(0, true) ? BX_DOL_STUDIO_INSTALLER_SUCCESS : BX_DOL_STUDIO_INSTALLER_FAILED;
    }

    /**
     * NOTE. The action is ONLY needed for dependent module to let 
     * Notifications based module(s) know that he(they) should 
     * update (request and save) handlers from this dependent module.
     */
	protected function actionUpdateRelations($sOperation)
    {
        if(!in_array($sOperation, array('install', 'uninstall', 'enable', 'disable'))) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

        if(empty($this->_aConfig['relations']) || !is_array($this->_aConfig['relations']))
            return BX_DOL_STUDIO_INSTALLER_SUCCESS;

        foreach($this->_aConfig['relations'] as $sModule) {
            if(!$this->oDb->isModuleByName($sModule))
                continue;

            $aRelation = $this->oDb->getRelationsBy(array('type' => 'module', 'value' => $sModule));
            if(empty($aRelation) || empty($aRelation['on_' . $sOperation]) || !BxDolRequest::serviceExists($aRelation['module'], $aRelation['on_' . $sOperation]))
                continue;

            bx_srv_ii($aRelation['module'], $aRelation['on_' . $sOperation], array($this->_aConfig['home_uri']));
        }

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    /**
     * NOTE. The action is ONLY needed for Notifications based modules 
     * to update (request and save) handlers from all dependent modules.
     */
    protected function actionUpdateRelationsForAll($sOperation)
    {
    	if(!in_array($sOperation, array('enable', 'disable'))) 
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        if($sOperation == 'enable')
            $this->oDb->insertRelation($this->_aConfig['name'], $this->_aConfig['relation_handlers']);

        $aRelation = $this->oDb->getRelationsBy(array('type' => 'module', 'value' => $this->_aConfig['name']));
        if(empty($aRelation) || empty($aRelation['on_' . $sOperation]))
            return BX_DOL_STUDIO_INSTALLER_SUCCESS;

        $sHandlersMethod = isset($this->_aConfig['relation_handlers_method']) ? $this->_aConfig['relation_handlers_method'] : '';

    	$aModules = $this->oDb->getModulesBy(array('type' => 'all', 'active' => 1));
        foreach($aModules as $aModule) {
            $aConfig = self::getModuleConfig($aModule);
            if(!empty($aConfig['relations']) && is_array($aConfig['relations']) && in_array($this->_aConfig['name'], $aConfig['relations']))
                bx_srv_ii($this->_aConfig['name'], $aRelation['on_' . $sOperation], array($aModule['uri']));
            else if($sHandlersMethod && bx_is_srv($aModule['name'], $sHandlersMethod) && (bx_srv('system', 'is_module_content', [$aModule['name']]) || bx_srv('system', 'is_module_context', [$aModule['name']])))
                bx_srv_ii($this->_aConfig['name'], $aRelation['on_' . $sOperation], array($aModule['uri']));
        }

        if($sOperation == 'disable')
            $this->oDb->deleteRelation($this->_aConfig['name']);

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	/**
     * 
     * Connections objects associated with module data. It must be defined which content is associated with the connection.
     * The key is connection object name and value is array (possible array values: type, conn, table, field_id).
     * If 'type' == 'profiles', then it is considered profiles connection and other possible param is 'conn' ('initiator', 'content' or 'both') 
     * If 'type' == 'custom' (or ommited), then other possible params are 'conn', 'table' and 'field_id'
     * @param string $sOperation - operation type.
     */
    protected function actionProcessConnections($sOperation)
    {
		if(!in_array($sOperation, array('uninstall')) || empty($this->_aConfig['connections'])) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

		foreach($this->_aConfig['connections'] as $sObjectConnections => $a) {
			$o = BxDolConnection::getObjectInstance($sObjectConnections);
			if(!$o)
				continue;

			$sFuncSuffix = 'DeleteInitiatorAndContent';
			if (isset($a['conn']) && 'initiator' == $a['conn'])
				$sFuncSuffix = 'DeleteInitiator';
			elseif (isset($a['conn']) && 'content' == $a['conn'])
				$sFuncSuffix = 'DeleteContent';

			if (isset($a['type']) && 'profiles' == $a['type']) {
				$sFunc = 'onModuleProfile' . $sFuncSuffix;
				$o->$sFunc($this->_aConfig['name']);
			} else {
				$sFunc = 'onModule' . $sFuncSuffix;
				$o->$sFunc($a['table'], $a['field_id']);
			}
		}

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	/**
     * 
     * Process the list of menu triggers provided in config array. 
     * It must be specified in the module which adds menu item and in modules where menu items are added, @see BxDolMenu::processMenuTrigger
     * @param string $sOperation - operation type.
     */
    protected function actionProcessMenuTriggers($sOperation)
    {
		if(empty($this->_aConfig['menu_triggers'])) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

		foreach($this->_aConfig['menu_triggers'] as $sMenuTriggerName)
			BxDolMenu::processMenuTrigger($sMenuTriggerName);

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    /**
     * 
     * Process the list of page triggers provided in config array. 
     * It must be specified in the module which adds page block and in modules where page blocks are added, @see BxDolPage::processPageTrigger
     * @param string $sOperation - operation type.
     */
	protected function actionProcessPageTriggers($sOperation)
    {
    	if(empty($this->_aConfig['page_triggers'])) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

        foreach($this->_aConfig['page_triggers'] as $sPageTriggerName)
			BxDolPage::processPageTrigger($sPageTriggerName);

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	protected function actionProcessDeletedProfiles($sOperation)
    {
        if(!in_array($sOperation, array('install', 'uninstall', 'enable', 'disable'))) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

        $o = BxDolProfileQuery::getInstance();
        $o->processDeletedProfiles();

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	/**
     * 
     * Process the list of extended search forms provided in config array. 
     * @param string $sOperation - operation type.
     */
    protected function actionProcessEsearches($sOperation)
    {
    	if(empty($this->_aConfig['esearches'])) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

        foreach($this->_aConfig['esearches'] as $sObject) {
            if(in_array($sOperation, array('install', 'enable', 'enable_success')))
		        BxDolSearchExtended::getObjectInstance($sObject);
            else if(in_array($sOperation, array('uninstall', 'disable')))
                BxDolSearchExtended::getObjectInstance($sObject)->clean();
        }		    

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	/**
     * 
     * Process the list of transcoders provided in config array. 
     * Transcoder objects to automatically register/unregister necessary alerts for.
     * @param string $sOperation - operation type.
     */
    protected function actionRegisterTranscoders($sOperation)
    {
    	if(empty($this->_aConfig['transcoders'])) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

		BxDolTranscoderImage::registerHandlersArray($this->_aConfig['transcoders']);

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

	/**
     * 
     * Process the list of transcoders provided in config array. 
     * Transcoder objects to automatically register/unregister necessary alerts for.
     * @param string $sOperation - operation type.
     */
    protected function actionUnregisterTranscoders($sOperation)
    {
    	if(empty($this->_aConfig['transcoders'])) 
        	return BX_DOL_STUDIO_INSTALLER_FAILED;

		BxDolTranscoderImage::unregisterHandlersArray($this->_aConfig['transcoders']);
        BxDolTranscoderImage::cleanupObjectsArray($this->_aConfig['transcoders']);

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function actionClearDbCache($sOperation)
    {
        $oCache = $this->oDb->getDbCacheObject();

        $bResult = $oCache->removeAllByPrefix('db_');
        $bResult &= $this->oDb->cleanMemoryAll();

        $aKeys = array_keys($GLOBALS);
        $aKeysPrefixes = array('bx_dol_cache_memory_');
        foreach($aKeysPrefixes as $sKeyPrefix)
            foreach($aKeys as $sKey)
                if(substr($sKey, 0, strlen($sKeyPrefix)) == $sKeyPrefix)
                    unset($GLOBALS[$sKey]);

        if(!$bResult) 
            return BX_DOL_STUDIO_INSTALLER_FAILED;

        bx_alert('system', 'clear_cache', 0, 0, array('type' => 'custom'));

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function actionClearTemplateCache($sOperation)
    {
        $aCaches = array('template', 'css', 'js');
        $oCacheUtilities = BxDolCacheUtilities::getInstance();

        foreach($aCaches as $sCache) {
            $aResult = $oCacheUtilities->clear($sCache);
            if($aResult === false)
            	continue;

            if(isset($aResult['code']) && $aResult['code'] != 0)
				return BX_DOL_STUDIO_INSTALLER_FAILED;
        }

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onInstallBefore()
    {
        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onInstallAfter()
    {
        $this->actionExecuteSqlAddons('install');

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onEnableBefore()
    {
        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onEnableAfter()
    {
        $this->actionExecuteSqlAddons('enable');

        BxDolCmts::onModuleEnable($this->_aConfig['name']);

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onDisableBefore()
    {
        BxDolCmts::onModuleDisable($this->_aConfig['name']);

        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onDisableAfter()
    {
        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onUninstallBefore()
    {
		// check if module is already waiting while files are deleting
        if(self::isModulePendingUninstall($this->_aConfig['home_uri']))
			return array(
				'code' => BX_DOL_STUDIO_INSTALLER_FAILED,
				'content' => _t('_adm_err_modules_pending_uninstall_already'),
            );

		$bSetModulePendingUninstall = false;

		// delete comments and queue for deletion comments attachments
        $iFiles = 0;
        BxDolCmts::onModuleUninstall($this->_aConfig['name'], $iFiles);
        if($iFiles)
			$bSetModulePendingUninstall = true;

        // delete forms common data
        BxDolForm::onModuleUninstall($this->_aConfig['name'], $iFiles);
        
        // delete badges data
        BxDolBadges::onModuleUninstall($this->_aConfig['name'], $iFiles);
        
        // delete SEO links
        BxDolPage::deleteSeoLinkByModule($this->_aConfig['name']);

        // delete alerts
        BxDolAlerts::deleteModuleAlerts($this->_aConfig['name']);

        // queue for deletion storage files
        if(!empty($this->_aConfig['storages']) && is_array($this->_aConfig['storages']))        
            foreach($this->_aConfig['storages'] as $s)
    			if(($o = BxDolStorage::getObjectInstance($s)) && $o->queueFilesForDeletionFromObject())
                    $bSetModulePendingUninstall = true;       

        // if some files were added to the queue, set module as pending uninstall
        if ($bSetModulePendingUninstall) {
            self::setModulePendingUninstall($this->_aConfig['home_uri']);
            return array(
            	'code' => BX_DOL_STUDIO_INSTALLER_FAILED,
                'content' => _t('_adm_err_modules_pending_uninstall'),
            );
        }

		return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _onUninstallAfter()
    {
        return BX_DOL_STUDIO_INSTALLER_SUCCESS;
    }

    protected function _perform($sOperationName, $aParams = array())
    {
    	$bHtmlResponce = isset($aParams['html_response']) && (bool)$aParams['html_response'];

        if(!defined('BX_SKIP_INSTALL_CHECK') && !defined('BX_DOL_CRON_EXECUTE') && !$GLOBALS['logged']['admin'])
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_NOT_AUTHORIZED,
                'message' => '_adm_mod_err_only_admin_can_perform_operations_with_modules', 
                'result' => false
            );

        $sMessage = '';
        foreach($this->_aConfig[$sOperationName] as $sAction => $iEnabled) {
            $sMethod = 'action' . bx_gen_method_name($sAction);
            if($iEnabled == 0 || !method_exists($this, $sMethod))
                continue;
            if(isset($aParams['disabled_actions']) && in_array($sAction, $aParams['disabled_actions']))
                continue;

            $mixedResult = $this->$sMethod($sOperationName);

            //--- On Success ---//
            if((is_int($mixedResult) && (int)$mixedResult == BX_DOL_STUDIO_INSTALLER_SUCCESS) || (isset($mixedResult['code']) && (int)$mixedResult['code'] == BX_DOL_STUDIO_INSTALLER_SUCCESS)) {
                $sMessage .= $this->_displayResult($sAction, true, isset($mixedResult['content']) ? $mixedResult['content'] : '', $bHtmlResponce);
                continue;
            }

            //--- On Failed ---//
            $sMethodFailed = $sMethod . 'Failed';
            return array(
                'code' => BX_DOL_STUDIO_IU_RCE_SUBACTION_FAILED,
                'message' => $this->_displayResult($sAction, false, method_exists($this, $sMethodFailed) ? $this->$sMethodFailed($mixedResult) : $this->actionOperationFailed($mixedResult), $bHtmlResponce), 
                'result' => false
            );
        }

        if($this->_bShowOnSuccess)
            $sMessage = $this->_aActions['perform_' . $sOperationName]['success'] . $sMessage;

        return array('message' => $sMessage, 'result' => true);
    }

    protected function _displayResult($sAction, $bResult, $sResult = '', $bHtmlResponse = true)
    {
    	if($bResult && !in_array($sAction, array('show_introduction', 'show_conclusion')) && !$this->_bShowOnSuccess)
            return '';

        $sTitle = $this->_aActions[$sAction]['title'] . ' ';
        if(!empty($sResult))
            $sResult = (substr($sResult, 0, 1) == '_' ? _t($sResult) : $sResult);

		$sContent = !empty($sResult) ? $sResult : _t($bResult ? '_adm_txt_modules_process_action_success' : '_adm_err_modules_process_action_failed');
		if(!$bHtmlResponse)
			return $sTitle . $sContent;

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('mod_action_result_step.html', array(
        	'color' => $bResult ? 'green' : 'red',
            'title' => $sTitle,
            'content' => $sContent
        ));
    }

    protected function _getFileManager()
    {
        $oFile = null;

        if($this->_bUseFtp) {
            $oFile = new BxDolFtp(isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost', getParam('sys_ftp_login'), getParam('sys_ftp_password'), getParam('sys_ftp_dir'));

            if(!$oFile->connect())
                return null;

            if(!$oFile->isUna())
                return null;
        }
        else
            $oFile = BxDolFile::getInstance();

        return $oFile;
    }

    protected function _isCompatibleWith()
    {
    	$sVersionCur = bx_get_ver();

    	$bCompatible = false;
        if(isset($this->_aConfig['compatible_with']) && is_array($this->_aConfig['compatible_with']))
            foreach($this->_aConfig['compatible_with'] as $iKey => $sVersionReq)
            	$bCompatible = $bCompatible || (version_compare(strtolower($sVersionCur), strtolower($sVersionReq), '>=') == 1);

		return $bCompatible;
    }

    protected function filePathWithoutBase($sPath)
    {
        return bx_ltrim_str($sPath, $this->_sModulePath);
    }

    protected function getMarkersForDb()
    {
        $sDbName = defined('BX_DATABASE_NAME') ? BX_DATABASE_NAME : '';
        if (is_array($sDbName))
            $sDbName = array_shift($sDbName);
        return array(
            'from' => array('{db_name}'),
            'to' => array($sDbName),
        );
    }

    protected function cleanupMemoryAfterAction($sModuleName, $sModuleUri, $iModuleId)
    {
        $this->oDb->cleanMemory('sys_modules_' . $sModuleName);
        $this->oDb->cleanMemory('sys_modules_' . $sModuleUri);
        $this->oDb->cleanMemory('sys_modules_' . $iModuleId);
        $this->oDb->cleanMemory('sys_module_' . $sModuleName);
        $this->oDb->cleanMemory('sys_module_' . $sModuleUri);
        $this->oDb->cleanMemory('sys_module_enabled_' . $sModuleName);
        $this->oDb->cleanMemory('sys_module_enabled_' . $sModuleUri);
        $this->oDb->cleanMemory('sys_modules');
        $this->oDb->cleanMemory('sys_modules_modules');
        $this->oDb->cleanMemory('sys_modules_modules_active');
    }
}

/** @} */
