<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

bx_import('BxDolLanguages');

define('BX_DOL_MARKET_URL_ROOT', 'https://unacms.com/');
define('BX_DOL_MARKET_URL_INTEGRATION', BX_DOL_MARKET_URL_ROOT . 'm/market_api/');

define('BX_DOL_STUDIO_IU_RC_SUCCESS', 0);
define('BX_DOL_STUDIO_IU_RC_FAILED', 1);
define('BX_DOL_STUDIO_IU_RC_SCHEDULED', 2);

/*
 * Errors list.
 * It can be broaden later.
 */
define('BX_DOL_STUDIO_IU_RCE_NOT_FOUND', 100);
define('BX_DOL_STUDIO_IU_RCE_NOT_AVAILABLE', 101);
define('BX_DOL_STUDIO_IU_RCE_NOT_AUTHORIZED', 102);
define('BX_DOL_STUDIO_IU_RCE_ALREADY_PERFORMED', 103);
define('BX_DOL_STUDIO_IU_RCE_UNIQUE_PARAMS_USED', 104);
define('BX_DOL_STUDIO_IU_RCE_WSV_MI', 105); //--- Wrong script version during module install
define('BX_DOL_STUDIO_IU_RCE_WSV_MU', 106); //--- Wrong script version during module update
define('BX_DOL_STUDIO_IU_RCE_WMV', 107); //--- Wrong module version during module update
define('BX_DOL_STUDIO_IU_RCE_MODIFIED', 108);
define('BX_DOL_STUDIO_IU_RCE_CHECKSUM_FAILED', 109);
define('BX_DOL_STUDIO_IU_RCE_DEPRECATED', 110); //--- A deprecated module is not installed on a site that doesn't have it

define('BX_DOL_STUDIO_IU_RCE_SUBACTION_FAILED', 200); //--- Error appeared in some subaction


class BxDolStudioInstallerUtils extends BxDolInstallerUtils implements iBxDolSingleton
{
    protected $bUseFtp;

    protected $sAuthorizedAccessClass;
    protected $sStoreDataUrlPublic;

    protected $_oLog;

    public function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->bUseFtp = BX_FORCE_USE_FTP_FILE_TRANSFER;

        $this->sAuthorizedAccessClass = 'BxDolStudioOAuthOAuth2';
        $this->sStoreDataUrlPublic = BX_DOL_MARKET_URL_INTEGRATION;        
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolStudioInstallerUtils();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public static function getNamePerformAction($sParam)
    {
    	return 'sys_perform_action_' . md5($sParam);
    }

    public static function getNameDownloadFile($sParam)
    {
    	return 'sys_download_file_complete_' . $sParam;
    }

    public static function getNamePerformModulesUpgrade()
    {
    	return 'sys_upgrade_modules_transient';
    }

    /*
     * Is used to complete Downloading inside Transient Cron Job.
     */
    public function serviceDownloadFileComplete($sFilePath, $aParams = array())
    {
    	return $this->downloadFileComplete($sFilePath, array_merge($aParams, array('transient' => true)));
    }

    /*
     * Is used to perform action inside Transient Cron Job.
     */
    public function servicePerformAction($sDirectory, $sOperation, $aParams)
    {
    	return $this->perform($sDirectory, $sOperation, array_merge($aParams, array('transient' => true)));
    }

    /*
     * Is used to perform modules upgrade inside Transient Cron Job.
     */
    public function servicePerformModulesUpgrade($aParams = array())
    {
        return $this->performModulesUpgrade(array_merge($aParams, array('directly' => true, 'transient' => true)));
    }

    public function getStoreDataUrl($sType = 'public')
    {
    	return $sType == 'public' ? $this->sStoreDataUrlPublic : '';
    }

    public function getAccessObject($bAuthorizedAccess)
    {
        $sClass = $bAuthorizedAccess ? $this->sAuthorizedAccessClass : 'BxDolStudioJson';

        bx_import($sClass);
        return $sClass::getInstance();
    }

    public function getModules($bTitleAsKey = true)
    {
        $aModules = array();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aInstalledInfo = $this->getInstalledInfo();

        $sPath = BX_DIRECTORY_PATH_MODULES;
        if(($rHandleVendor = opendir($sPath)) !== false) {
            while(($sVendor = readdir($rHandleVendor)) !== false) {
                if(substr($sVendor, 0, 1) == '.' || !is_dir($sPath . $sVendor))
                    continue;

                if(($rHandleModule = opendir($sPath . $sVendor)) !== false) {
                    while(($sModule = readdir($rHandleModule)) !== false) {
                        if(!is_dir($sPath . $sVendor . '/' . $sModule) || substr($sModule, 0, 1) == '.')
                            continue;

                        $sModulePath = $sVendor . '/' . $sModule . '/';
                        $aModule = $this->getConfigModule($sPath . $sModulePath . 'install/config.php', !empty($aInstalledInfo[$sModulePath]) ? $aInstalledInfo[$sModulePath] : array());
                        if(empty($aModule))
                            continue;

                        $aModules[$bTitleAsKey ? $aModule['title'] : $aModule['name']] = $aModule;
                    }
                    closedir($rHandleModule);
                }
            }
            closedir($rHandleVendor);
        }

        ksort($aModules);
        return $aModules;
    }

    public function getUpdates()
    {
        $aUpdates = array();

        $oTemplate = BxDolStudioTemplate::getInstance();

        $aInstalledInfo = $this->getInstalledInfo();

        $sPath = BX_DIRECTORY_PATH_MODULES;
        if(($rHandleVendor = opendir($sPath)) !== false) {
            while(($sVendor = readdir($rHandleVendor)) !== false) {
                if(substr($sVendor, 0, 1) == '.' || !is_dir($sPath . $sVendor))
                    continue;

                if(($rHandleModule = opendir($sPath . $sVendor . '/')) !== false) {
                    while(($sModule = readdir($rHandleModule)) !== false) {
                        if(!is_dir($sPath . $sVendor . '/' . $sModule) || substr($sModule, 0, 1) == '.')
                            continue;

                        $sModulePath = $sVendor . '/' . $sModule . '/';
                        if(empty($aInstalledInfo[$sModulePath]))
                            continue;

                        $aUpdate = $this->getUpdate($aInstalledInfo[$sModulePath]);
                        if(!empty($aUpdate))
                            $aUpdates[$aUpdate['title']] = $aUpdate;
                    }
                    closedir($rHandleModule);
                }
            }
            closedir($rHandleVendor);
        }

        ksort($aUpdates);
        return $aUpdates;
    }

    public function getUpdate($mixedModule)
    {
        $aResult = array();

        if(!is_array($mixedModule))
            $mixedModule = BxDolModuleQuery::getInstance()->{is_numeric($mixedModule) ? 'getModuleById' : 'getModuleByName'}($mixedModule); 

        if(empty($mixedModule) || !is_array($mixedModule))
            return $aResult;

        $sPathModule = BX_DIRECTORY_PATH_MODULES . $mixedModule['path'];
        $sPathUpdates = $sPathModule . 'updates/';

        $rHandleUpdate = @opendir($sPathUpdates);
        if($rHandleUpdate === false)
            return $aResult; 

        while(($sUpdate = readdir($rHandleUpdate)) !== false) {
            $sPathUpdate = $sPathUpdates . $sUpdate . '/';
            if(substr($sUpdate, 0, 1) == '.' || !is_dir($sPathUpdate))
                continue;

            $aUpdate = $this->getConfigUpdate($sPathModule . 'install/config.php', $sPathUpdate . 'install/config.php', $mixedModule);
            if(empty($aUpdate) || !is_array($aUpdate) || version_compare(strtolower($aUpdate['module_version']), strtolower($aUpdate['version_from'])) != 0)
                continue;

            $aResult = $aUpdate;
            break;
        }

        closedir($rHandleUpdate);

        return $aResult;
    }

    public function perform($sDirectory, $sOperation, $aParams = array())
    {
        $bTransient = false;
        if(isset($aParams['transient'])) {
            $bTransient = (bool)$aParams['transient'];
            unset($aParams['transient']);
        }

        if(!defined('BX_DOL_CRON_EXECUTE') && !self::isRealOwner() && !in_array($sOperation, array('install', 'uninstall', 'enable', 'disable'))) {
            if($this->addTransientJob(self::getNamePerformAction($sDirectory), 'perform_action', array($sDirectory, $sOperation, $aParams)))
                return array('code' => BX_DOL_STUDIO_IU_RC_SCHEDULED, 'message' => _t('_adm_mod_msg_process_operation_scheduled'));
            else 
                return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_mod_err_process_operation_failed', $sOperation, $sDirectory));
        }

        $sConfigFile = 'install/config.php';
        $sInstallerFile = 'install/installer.php';
        $sInstallerClass = $sOperation == 'update' ? 'Updater' : 'Installer';

        $aConfig = self::getModuleConfig(BX_DIRECTORY_PATH_MODULES . $sDirectory . $sConfigFile);
        if(empty($aParams['module_name']) && !empty($aConfig['name']))
            $aParams['module_name'] = $aConfig['name'];

        $sPathInstaller = BX_DIRECTORY_PATH_MODULES . $sDirectory . $sInstallerFile;
        if(empty($aConfig) || !file_exists($sPathInstaller)) {
            $sMessage = _t('_adm_mod_err_process_operation_failed', $sOperation, $sDirectory);

            bx_log('sys_modules', ":\n[" . $sOperation . "] Operation failed: " . $this->getModuleTitle($aParams) . "\n" . strip_tags($sMessage), BX_LOG_ERR);
            
            if($bTransient)
                $this->emailNotify($sMessage, $aParams);

            return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => $sMessage);
        } 

        require_once($sPathInstaller);

        $sClassName = $aConfig['class_prefix'] . $sInstallerClass;
        $oInstaller = new $sClassName($aConfig);
        $aResult = $oInstaller->$sOperation($aParams);

        if(!$aResult['result']) {
            bx_log('sys_modules', ":\n[" . $sOperation . "] Operation failed: " . $this->getModuleTitle($aParams) . "\n" . strip_tags($aResult['message']), BX_LOG_ERR);

            if($bTransient)
                $this->emailNotify($aResult['message'], $aParams);
        }

        return array(
            'code' => isset($aResult['code']) ? $aResult['code'] : ($aResult['result'] ? BX_DOL_STUDIO_IU_RC_SUCCESS : BX_DOL_STUDIO_IU_RC_FAILED), 
            'message' => $aResult['message']
        );
    }

    /**
     * Update modules using cron based auto updates.
     * @see BxDolCronUpgradeModulesCheck
     */
    public function performModulesUpgrade($aParams = array())
    {
        $bDirectly = true;
        if(isset($aParams['directly'])) {
            $bDirectly = (bool)$aParams['directly'];
            unset($aParams['directly']);
        }

        $bTransient = true;
        if(isset($aParams['transient'])) {
            $bTransient = (bool)$aParams['transient'];
            unset($aParams['transient']);
        }

        if(!defined('BX_DOL_CRON_EXECUTE') && !$bDirectly)
            return $this->addTransientJob(self::getNamePerformModulesUpgrade(), 'perform_modules_upgrade', array($aParams));

        $aFailed = array();
        $aUpdates = $this->checkUpdates();
        if(empty($aUpdates) || !is_array($aUpdates)) {
            bx_log('sys_modules', ":\n[upgrade] Cannot get a list of modules which require to be updated.", BX_LOG_ERR);
            return true;
        }

        foreach($aUpdates as $aUpdate) {
            $mixedResult = $this->downloadUpdatePublic($aUpdate['name']);
            if($mixedResult !== true) {
                $aFailed[$aUpdate['name']] = $mixedResult;
                continue;
            }
        }

        $aSuccess = array();
        $aUpdates = $this->getUpdates();
        if(empty($aUpdates) || !is_array($aUpdates)) {
            bx_log('sys_modules', ":\n[upgrade] Cannot find update scripts for modules. They are damaged or were not downloaded.", BX_LOG_ERR);
            return true;
        }

        foreach($aUpdates as $aUpdate) {
            $aParams['module_name'] = $aUpdate['module_name'];

            $aResult = $this->perform($aUpdate['dir'], 'update', $aParams);
            switch((int)$aResult['code']) {
                case BX_DOL_STUDIO_IU_RC_SUCCESS:
                    $aSuccess[$aUpdate['module_name']] = $aUpdate['version_to'];
                    break;

                case BX_DOL_STUDIO_IU_RCE_WSV_MU:
                    if(isset($aParams['autoupdate']) && (bool)$aParams['autoupdate'] === true)
                        break;

                default:
                    $aFailed[$aUpdate['module_name']] = $aResult['message'];
            }
        }

        if(!empty($aFailed)) {
            bx_log('sys_modules', [
                ":\n[upgrade] Failed to update modules:",
                $aFailed
            ], BX_LOG_ERR);

            if($bTransient)
                $this->emailNotifyModulesUpgrade('failed', $aFailed);
        }

        if(!empty($aSuccess)) {
            bx_log('sys_modules', [
                ":\n[upgrade] Successfully updated modules:",
                $aSuccess
            ], BX_LOG_INFO);

            if($bTransient)
                $this->emailNotifyModulesUpgrade('success', $aSuccess);
        }

        return empty($aFailed);
    }

    public function checkModules($bAuthorizedAccess = false)
    {
        $iPerPage = 9999; //--- Note. It's essential to load all purchased products at the same time.
        $sVersion = bx_get_ver();

        if($bAuthorizedAccess)
            $aProducts = $this->getAccessObject(true)->loadItems(array(
                'method' => 'browse_purchased', 
                'domain' => BX_DOL_URL_ROOT, 
                'version' => $sVersion,
                'products' => $this->getInstalledInfoShort(),
                'per_page' => $iPerPage
            ));
        else
            $aProducts = $this->getAccessObject(false)->load($this->sStoreDataUrlPublic . 'json_browse_purchased', array('key' => getParam('sys_oauth_key'), 'per_page' => $iPerPage));

        if(empty($aProducts) || !is_array($aProducts))
            return $aProducts;

        $oModuleDb = BxDolModuleQuery::getInstance();

        $oModuleDb->updateModule(array('hash' => ''));
        if(!empty($aProducts) && is_array($aProducts))
            foreach ($aProducts as $aProduct)
                if(!empty($aProduct['hash']))
                    $oModuleDb->updateModule(array('hash' => $aProduct['hash']), array('name' => $aProduct['name']));

        return $aProducts;
    }

    public function checkUpdates($bAuthorizedAccess = false)
    {
        return $this->getUpdatesInfo('', $bAuthorizedAccess);
    }

    public function checkUpdatesByModule($sModule, $bAuthorizedAccess = false)
    {
        return $this->getUpdatesInfo($sModule, $bAuthorizedAccess);
    }

    public function downloadFileAuthorized($iFileId)
    {
        $aItem = $this->getAccessObject(true)->loadItems(array(
            'method' => 'download_file', 
            'version' => bx_get_ver(),
            'file_id' => $iFileId
        ));

        if(empty($aItem) || !is_array($aItem))
            return $aItem;

        return $this->downloadFileInit($aItem, array('module_name' => $aItem['module_name']));
    }

    public function downloadUpdatePublic($sModuleName, $bApplyUpdate = false)
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModuleName);

        $aItem = $this->getAccessObject(false)->load($this->sStoreDataUrlPublic . 'json_download_update', array(
            'key' => getParam('sys_oauth_key'),
            'version' => bx_get_ver(),
            'product' => base64_encode(json_encode(array(
                'name' => $aModule['name'],
                'version' => $aModule['version'],
                'hash' => $aModule['hash'],
            ))),
        ));

        return $this->downloadFileInit($aItem, array('module_name' => $sModuleName, 'auto_action' => $bApplyUpdate ? 'update' : ''));
    }

    protected function downloadFileInit($aItem, $aParams = array())
    {
        if(empty($aItem) || !is_array($aItem))
            return $aItem;

        //--- write ZIP archive.
        $sFilePath = '';
        $mixedResult = $this->performWrite($aItem, $sFilePath);
        if($mixedResult !== true)
            return $mixedResult;

        return $this->downloadFileComplete($sFilePath, $aParams);
    }

    protected function downloadFileComplete($sFilePath, $aParams = array())
    {
        $bTransient = false;
    	if(isset($aParams['transient'])) {
            $bTransient = (bool)$aParams['transient'];
            unset($aParams['transient']);
    	}

        $sAutoAction = '';
        $bAutoAction = false;
        if(isset($aParams['auto_action'])) {
            $sAutoAction = $aParams['auto_action'];
            $bAutoAction = !empty($sAutoAction);
            unset($aParams['auto_action']);
        }

        if(!defined('BX_DOL_CRON_EXECUTE') && !self::isRealOwner()) {
            if(!$this->addTransientJob(self::getNameDownloadFile($aParams['module_name']), 'download_file_complete', array($sFilePath, array_merge($aParams, array('auto_action' => $sAutoAction)))))
                return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_str_err_download_failed'));

            return array('code' => BX_DOL_STUDIO_IU_RC_SCHEDULED, 'message' => _t('_adm_str_msg_download' . ($bAutoAction ? '_and_install' : '') . '_scheduled'));
        }

        //--- Unarchive package.
        $sPackagePath = '';
        $mixedResult = $this->performUnarchive($sFilePath, $sPackagePath);

        @unlink($sFilePath);
        if($mixedResult !== true) {
            bx_log('sys_modules', ":\n[download] Operation failed: " . $this->getModuleTitle($aParams) . "\n" . $mixedResult, BX_LOG_ERR);

            if($bTransient)
                $this->emailNotify($mixedResult, $aParams);

            return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => $mixedResult);
        }

        //--- Copy unarchived package.
        $sHomePath = '';
        $mixedResult = $this->performCopy($sPackagePath, $sHomePath);

        @bx_rrmdir($sPackagePath);
        if($mixedResult !== true) {
            bx_log('sys_modules', ":\n[download] Operation failed: " . $this->getModuleTitle($aParams) . "\n" . $mixedResult, BX_LOG_ERR);

            if($bTransient)
                $this->emailNotify($mixedResult, $aParams);

            return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => $mixedResult);
        }

        if(!$bAutoAction)
            return true;

        //--- Autoinstall the downloaded package if it's needed.
        $aResult = $this->perform($sHomePath, $sAutoAction, $aParams);
        if((int)$aResult['code'] == 0) 
            return true;

        if($bTransient)
            $this->emailNotify($aResult['message'], $aParams);

        return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => $aResult['message']);
    }

    protected function performWrite($aItem, &$sFilePath)
    {
        $sFilePath = BX_DIRECTORY_PATH_TMP . $aItem['name'];
        if(file_exists($sFilePath))
            @unlink($sFilePath);

        $iUmaskSave = umask(0);

        if(!$rHandler = fopen($sFilePath, 'w')) {
            umask($iUmaskSave);
            return _t('_adm_str_err_cannot_write');
        }

        $sContent = base64_decode(urldecode($aItem['content']));
        if(!fwrite($rHandler, $sContent, strlen($sContent))) {
            umask($iUmaskSave);
            return _t('_adm_str_err_cannot_write');
        }

        fclose($rHandler);

        umask($iUmaskSave);
        return true;
    }

    protected function performUnarchive($sFilePath, &$sPackagePath)
    {
        if(!class_exists('ZipArchive'))
            return _t('_adm_str_err_zip_not_available');

        $iUmaskSave = umask(0);

        $oZip = new ZipArchive();
        if($oZip->open($sFilePath) !== true) {
            umask($iUmaskSave);
            return _t('_adm_str_err_cannot_unzip_package');
        }

        $sPackageFolder = '';
        if($oZip->numFiles > 0)
            $sPackageFolder = $oZip->getNameIndex(0);

        if(empty($sPackageFolder)) {
            umask($iUmaskSave);
            return _t('_adm_str_err_cannot_unzip_package');
        }

        $sPackagePath = BX_DIRECTORY_PATH_TMP . $sPackageFolder;
        if(file_exists($sPackagePath)) // remove existing tmp folder with the same name
            @bx_rrmdir($sPackagePath);

        if(!$oZip->extractTo(BX_DIRECTORY_PATH_TMP)) {
            umask($iUmaskSave);
            return _t('_adm_str_err_cannot_unzip_package');
        }

        $oZip->close();

        umask($iUmaskSave);
        return true;
    }

    protected function performCopy($sPackagePath, &$sHomePath)
    {
        if($this->bUseFtp) {
            $sLogin = getParam('sys_ftp_login');
            $sPassword = getParam('sys_ftp_password');
            $sPath = getParam('sys_ftp_dir');
            if(empty($sLogin) || empty($sPassword) || empty($sPath))
                return _t('_adm_str_err_no_ftp_info');

            $oFile = new BxDolFtp($_SERVER['HTTP_HOST'], $sLogin, $sPassword, $sPath);

            if(!$oFile->connect())
                return _t('_adm_str_err_cannot_connect_to_ftp');

            if(!$oFile->isUna())
                return _t('_adm_str_err_destination_not_valid');
        }
        else
            $oFile = BxDolFile::getInstance();

        $aConfig = self::getModuleConfig($sPackagePath . 'install/config.php');
        if(empty($aConfig) || !is_array($aConfig) || empty($aConfig['home_dir']))
            return _t('_adm_str_err_wrong_package_format');

        $sHomePath = $aConfig['home_dir'];
        if(!$oFile->copy($sPackagePath, 'modules/' . $sHomePath))
            return _t('_adm_str_err_files_copy_failed');

        return true;
    }

    protected function getConfigModule($sConfigPath, $aInstalled = array())
    {
    	$aConfig = self::getModuleConfig($sConfigPath);
        if(empty($aConfig) || !is_array($aConfig))
            return array();

        $bInstalled = !empty($aInstalled);
        $bEnabled = $bInstalled && (int)$aInstalled['enabled'] == 1;
        $sVersion = $bInstalled ? $aInstalled['version'] : $aConfig['version'];

        return array(
            'type' => $aConfig['type'],
            'name' => isset($aConfig['name']) ? $aConfig['name'] : $aConfig['home_uri'],
            'title' => bx_process_output($aConfig['title']),
            'vendor' => $aConfig['vendor'],
            'version' => $sVersion,
            'uri' => $aConfig['home_uri'],
            'dir' => $aConfig['home_dir'],
            'note' => isset($aConfig['note']) ? bx_process_output($aConfig['note']) : '',
            'deprecated' => !empty(BxDolModuleQuery::getConfigDeprecation($aConfig)['deprecated']),
            'installed' => $bInstalled,
            'enabled' => $bEnabled
        );
    }

    protected function getConfigUpdate($sConfigPathModule, $sConfigPathUpdate, $aInstalledModule = array())
    {
        $aModule = $this->getConfigModule($sConfigPathModule, $aInstalledModule);
        if(empty($aModule) || !$aModule['installed'])
            return array();

		$aConfig = self::getModuleConfig($sConfigPathUpdate);
        if(empty($aConfig) || !is_array($aConfig))
            return array();

        return array(
            'title' => bx_process_output($aConfig['title']),
            'vendor' => $aConfig['vendor'],
            'version_from' => $aConfig['version_from'],
            'version_to' => $aConfig['version_to'],
            'dir' => $aConfig['home_dir'],
        	'module_type' => $aModule['type'],
            'module_name' => $aModule['name'],
            'module_dir' => $aModule['dir'],
        	'module_version' => $aModule['version']
        );
    }

    private function getInstalledInfo()
    {
        $aModules = BxDolModuleQuery::getInstance()->getModules();

        $aInstalledInfo = array();
        foreach($aModules as $aModule)
            $aInstalledInfo[$aModule['path']] = $aModule;

        return $aInstalledInfo;
    }

    private function getInstalledInfoShort($sModule = '')
    {
        if(!empty($sModule))
            $aModules = array(BxDolModuleQuery::getInstance()->getModuleByName($sModule));
        else
            $aModules = BxDolModuleQuery::getInstance()->getModules();

        $aProducts = array();
        foreach($aModules as $aModule) {
            if(empty($aModule['name']))
                continue;

            $aProducts[$aModule['name']] = array(
                'name' => $aModule['name'],
                'version' => $aModule['version'],
            	'hash' => $aModule['hash'],
            );
        }

        return base64_encode(json_encode($aProducts));
    }

    protected function getUpdatesInfo($sModule = '', $bAuthorizedAccess = false)
    {
        $sVersion = bx_get_ver();
        $sProducts = $this->getInstalledInfoShort($sModule);

        if($bAuthorizedAccess)
            return $this->getAccessObject(true)->loadItems(array(
                'method' => 'browse_updates', 
                'version' => $sVersion,
                'products' => $sProducts
            ));

        return $this->getAccessObject(false)->load($this->sStoreDataUrlPublic . 'json_browse_updates', array(
            'key' => getParam('sys_oauth_key'),
            'version' => $sVersion,
            'products' => $sProducts
        ));
    }

    private function addTransientJob($sName, $sAction, $aParams)
    {
        if(BxDolCronQuery::getInstance()->addTransientJobService($sName, array('system', $sAction, $aParams, 'DolStudioInstallerUtils')))
            return true;

        return false;
    }

    private function emailNotify($sMessage, $aParams = array())
    {
    	sendMailTemplateSystem('t_BgOperationFailed', array (
            'conclusion' => strip_tags($this->getModuleTitle($aParams) . $sMessage),
        ));
    }

    private function getModuleTitle($aParams = array())
    {
        if(empty($aParams['module_name'])) 
            return '';

        $sTitleKey = '_' . $aParams['module_name'];
        $sTitleValue = _t($sTitleKey);
        if(strcmp($sTitleKey, $sTitleValue) == 0) {
            $aModule = BxDolModuleQuery::getInstance()->getModuleByName($aParams['module_name']);
            $sTitleValue = is_array($aModule) && !empty($aModule['title']) ? $aModule['title'] : $aParams['module_name'];
        }

        return $sTitleValue . ': ';
    }

    private function emailNotifyModulesUpgrade($sResult, $aData)
    {
        $oModuleQuery = BxDolModuleQuery::getInstance();

    	$sConclusion = '';
    	if(!empty($aData))
            foreach($aData as $sModule => $sMessage) {
                $aModule = $oModuleQuery->getModuleByName($sModule);

                $sConclusion .= _t('_sys_et_txt_body_modules_upgrade_' . $sResult, $aModule['title'], $sMessage);
            }

        sendMailTemplateSystem('t_UpgradeModules' . ucfirst($sResult), array (
            'conclusion' => $sConclusion,
        ));
    }
}

/** @} */
