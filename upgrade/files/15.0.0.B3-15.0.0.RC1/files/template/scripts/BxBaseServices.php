<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System services.
 */
class BxBaseServices extends BxDol implements iBxDolProfileService
{
    public function __construct()
    {
        parent::__construct();
    }

    public function serviceIsPublicService($s)
    {
        $sService = bx_gen_method_name($s);
        $aServices = $this->serviceGetPublicServices();
        return isset($aServices[$sService]);
    }

    public function serviceGetPublicServices()
    {
        return array (
            'GetProductsNames' => 'BxBaseServices',
            'GetPageByRequest' => 'BxBaseServicePages',
        );
    }

    public function serviceIsSafeService($s)
    {
        $sService = bx_gen_method_name($s);
        $aSafeServices = $this->serviceGetSafeServices();
        return isset($aSafeServices[$sService]);
    }

    public function serviceGetSafeServices()
    {
        return array(
            'GetMenu' => 'BxBaseServices',
            'GetCreatePostForm' => 'BxBaseServices',
            'GetProductsNames' => 'BxBaseServices',
            'KeywordSearch' => 'BxBaseServices',
            'GetDataSearchApi' => 'BxBaseServices',
            'Cmts' => 'BxBaseServices',
            'GetFooter' => 'BxBaseServices',
            'SetBadges' => 'BxBaseServices',

            'GetPageContentByRequest' => 'BxBaseServicePages',
            'GetPageBlockData' => 'BxBaseServicePages',
            'SetPageBlockData' => 'BxBaseServicePages',
            'GetPageBlockImageData' => 'BxBaseServicePages',
            'GetUrlInfo' => 'BxBaseServicePages',

            'CreateAccountForm' => 'BxBaseServiceAccount',
            'AccountSettingsEmail' => 'BxBaseServiceAccount',
            'AccountSettingsPassword' => 'BxBaseServiceAccount',
            'AccountSettingsDelAccount' => 'BxBaseServiceAccount',
            'AccountSettingsInfo' => 'BxBaseServiceAccount',
            'ForgotPassword' => 'BxBaseServiceAccount',
            'SwitchProfile' => 'BxBaseServiceAccount',
            'AccountProfileSwitcher' => 'BxBaseServiceAccount',
            'EmailConfirmation' => 'BxBaseServiceAccount',
            'ConfirmEmail' => 'BxBaseServiceAccount',
            
            'CategoriesList' => 'BxBaseServiceCategory',

            'Test' => 'BxBaseServiceLogin',
            'MemberAuthCode' => 'BxBaseServiceLogin',
            'LoginForm' => 'BxBaseServiceLogin',
            'LoginFormOnly' => 'BxBaseServiceLogin',
            'Logout' => 'BxBaseServiceLogin',
        
            'KeywordsCloud' => 'BxBaseServiceMetatags',

            'AccountProfileSwitcher' => 'BxBaseServiceProfiles',
            'ProfileMembership' => 'BxBaseServiceProfiles',
            'ProfileNotifications' => 'BxBaseServiceProfiles',
            'GetCountOnlineProfiles' => 'BxBaseServiceProfiles',
            'BrowseRecommendationsFriends' => 'BxBaseServiceProfiles',
            'BrowseRecommendationsSubscriptions' => 'BxBaseServiceProfiles',
            'BrowseFriends' => 'BxBaseServiceProfiles',
            'SetMembership' => 'BxBaseServiceProfiles',
            'ResetMembership' => 'BxBaseServiceProfiles',
            'BrowseFriendRequests' => 'BxBaseServiceProfiles',
            'BrowseFriendRequested' => 'BxBaseServiceProfiles',
            'BrowseSubscribedMe' => 'BxBaseServiceProfiles',
            'BrowseSubscriptions' => 'BxBaseServiceProfiles',
            'BrowseMembers' => 'BxBaseServiceProfiles',
            'BrowseInvitations' => 'BxBaseServiceProfiles',
            'UpdateSettings' => 'BxBaseServiceProfiles',
            'Befriend' => 'BxBaseServiceProfiles',
            'ProfileCounters' => 'BxBaseServiceProfiles',
            'ProfileInfo' => 'BxBaseServiceProfiles',
            
            'GetChartGrowth' => 'BxBaseChartServices',
            'GetChartStats' => 'BxBaseChartServices',
            'GetDataByInterval' => 'BxBaseChartServices',
            
            'GetCartItemsCount' => 'BxBasePaymentsServices',
            'GetOrdersCount' => 'BxBasePaymentsServices',

            'Do' => 'BxBaseReportServices',
            'GetPerformedBy' => 'BxBaseReportServices',

            'Do' => 'BxBaseVoteServices',
            'GetPerformedBy' => 'BxBaseVoteServices',

            'Perform' => 'BxBaseFeatureServices',
            
            'Perform' => 'BxBaseFavoriteServices',
            'GetPerformedBy' => 'BxBaseFavoriteServices',

            'Perform' => 'BxBaseServiceConnections',
            'Perform' => 'BxBaseServiceRecommendations',
            'GetDataApi' => 'BxBaseCmtsServices',

            'GetDataApi' => 'BxBaseUploaderServices',
            
            'GetStatBlock' => 'BxBaseDashboardServices',
            
            'PerfomActionApi' => 'BxBaseServiceGrid',

            'GetLabels' => 'BxBaseLabelsServices',
            'GetForm' => 'BxBaseSearchExtendedServices',
            'GetResults' => 'BxBaseSearchExtendedServices'
        );
    }

    public function serviceGetPreloaderContent($sName) {
        $sResult = '';

        switch($sName) {
            case 'icons_css':
                if(($sCss = BxDolIconset::getObjectInstance()->getPreloaderCss()) !== false)
                    $sResult = $sCss;
                break;

            case 'icons_js':
                if(($sJs = BxDolIconset::getObjectInstance()->getPreloaderJs()) !== false)
                    $sResult = $sJs;
                break;

            case 'tailwind':
                $sFile = getParam('sys_css_tailwind_default');
                if(empty($sFile))
                    $sFile = 'tailwind.min.css';

                $sPath = '{dir_plugins_public}tailwind/css/|';
                if($sFile == 'cdn')
                    $sResult = [
                        'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
                        $sPath . 'tailwind.min.css' //TODO: Replace this with correct file name.
                    ];
                else
                    $sResult = $sPath . $sFile;
                break;
        }

        return $sResult;
    }
            
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_check_for_update module_check_for_update
     * 
     * @code bx_srv('system', 'module_check_for_update', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_check_for_update', ["bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:module_check_for_update:TemplServices["bx_posts"]~}} @endcode
     * 
     * Checks whether an update is available for requested module or not.
     * @param $mixedModule - module ID/name to check the updates for.
     * @return array with information about the update, false if nothing was found
     * 
     * @see BxBaseServices::serviceModuleCheckForUpdate
     */
    /** 
     * @ref bx_system_general-module_check_for_update "module_check_for_update"
     */
    public function serviceModuleCheckForUpdate($mixedModule)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        if(empty($aModule) || !is_array($aModule))
            return false;

        $aUpdates = BxDolStudioInstallerUtils::getInstance()->checkUpdatesByModule($aModule['name']);
        if(empty($aUpdates) || !is_array($aUpdates)) 
            return false;

        $aUpdate = array_shift($aUpdates);
        return array(
            'version_from' => $aUpdate['file_version'],
            'version_to' => $aUpdate['file_version_to'],
            'file_id' => $aUpdate['file_id']
        );
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_update module_update
     * 
     * @code bx_srv('system', 'module_update', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_update', ["bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:module_update:TemplServices["bx_posts"]~}} @endcode
     * 
     * Download and install an update for requested module. The operation may be performed 
     * immediately or by Transient Cron task. The second way is more common.
     * @param $mixedModule - module ID/name to check the updates for.
     * @return integer value determining the result of the operation. It can be one of the following values:
     * BX_DOL_STUDIO_IU_RC_SUCCESS, BX_DOL_STUDIO_IU_RC_FAILED or BX_DOL_STUDIO_IU_RC_SCHEDULED.
     * 
     * @see BxBaseServices::serviceModuleUpdate
     */
    /** 
     * @ref bx_system_general-module_update "module_update"
     */
    public function serviceModuleUpdate($mixedModule)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        if(empty($aModule) || !is_array($aModule))
            return BX_DOL_STUDIO_IU_RC_FAILED;

        $aResult = BxDolStudioInstallerUtils::getInstance()->downloadUpdatePublic($aModule['name'], true);
        return $aResult['code'];
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_delete module_delete
     * 
     * @code bx_srv('system', 'module_delete', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_delete', ["bx_posts", true], 'TemplServices'); @endcode
     * @code {{~system:module_delete:TemplServices["bx_posts"]~}} @endcode
     * 
     * Delete the requested module. By default only uninstalled module can be deleted.
     * The operation may be performed immediately or by Transient Cron task. The second way is more common.
     * @param $sModule - module name to delete.
     * @param $bForceUninstall - if 'true' is passed the module will be uninstalled before deletion.
     * @return integer value determining the result of the operation. It can be one of the following values:
     * BX_DOL_STUDIO_IU_RC_SUCCESS, BX_DOL_STUDIO_IU_RC_FAILED or BX_DOL_STUDIO_IU_RC_SCHEDULED.
     * 
     * @see BxBaseServices::serviceModuleDelete
     */
    /** 
     * @ref bx_system_general-module_delete "module_delete"
     */
    public function serviceModuleDelete($sModule, $bForceUninstall = false)
    {
        $sModulePath = '';
        $oInstallerUtils = BxDolStudioInstallerUtils::getInstance();

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule, false);
        if(!empty($aModule) && is_array($aModule)) {
            if(!$bForceUninstall)
                return BX_DOL_STUDIO_IU_RC_FAILED;

            $sModulePath = $aModule['path'];

            $aResult = $oInstallerUtils->perform($sModulePath, 'uninstall', array('auto_disable' => $bForceUninstall));
            if($aResult['code'] != BX_DOL_STUDIO_IU_RC_SUCCESS)
                return BX_DOL_STUDIO_IU_RC_FAILED;
        }
        else {
            $aModules = $oInstallerUtils->getModules(false);
            if(!isset($aModules[$sModule]))
                return BX_DOL_STUDIO_IU_RC_FAILED;
            
            $sModulePath = $aModules[$sModule]['dir'];
        }

        $aResult = $oInstallerUtils->perform($sModulePath, 'delete');
        return $aResult['code'];
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_install module_install
     * 
     * @code bx_srv('system', 'module_install', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_install', ["bx_posts", true], 'TemplServices'); @endcode
     * @code {{~system:module_install:TemplServices["bx_posts"]~}} @endcode
     * 
     * Install the requested module. By default the module will be installed only.
     * @param $sModule - module name to install.
     * @param $bForceEnable - if 'true' is passed the module will be automatically enabled after installation.
     * @return boolean value determining the result of the operation.
     * 
     * @see BxBaseServices::serviceModuleInstall
     */
    /** 
     * @ref bx_system_general-module_install "module_install"
     */
    public function serviceModuleInstall($sModule, $bForceEnable = false)
    {
        $oInstallerUtils = BxDolStudioInstallerUtils::getInstance();

        $aModules = $oInstallerUtils->getModules(false);
        if(!isset($aModules[$sModule]))
            return false;

        $aResult = $oInstallerUtils->perform($aModules[$sModule]['dir'], 'install', array('auto_enable' => $bForceEnable));
        if($aResult['code'] != BX_DOL_STUDIO_IU_RC_SUCCESS)
            return false;

        return true;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_uninstall module_uninstall
     * 
     * @code bx_srv('system', 'module_uninstall', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_uninstall', ["bx_posts", true], 'TemplServices'); @endcode
     * @code {{~system:module_uninstall:TemplServices["bx_posts"]~}} @endcode
     * 
     * Uninstall the requested module. By default only disabled module can be uninstalled.
     * @param $mixedModule - module ID/name to uninstall.
     * @param $bForceDisable - if 'true' is passed the module will be automatically disabled before uninstallation.
     * @return boolean value determining the result of the operation.
     * 
     * @see BxBaseServices::serviceModuleUninstall
     */
    /** 
     * @ref bx_system_general-module_uninstall "module_uninstall"
     */
    public function serviceModuleUninstall($mixedModule, $bForceDisable = false)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        if(empty($aModule) || !is_array($aModule))
            return false;

        if((int)$aModule['enabled'] != 0 && !$bForceDisable)
            return false;

        $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aModule['path'], 'uninstall', array('auto_disable' => $bForceDisable));
        if($aResult['code'] != BX_DOL_STUDIO_IU_RC_SUCCESS)
            return false;

        return true;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_enable module_enable
     * 
     * @code bx_srv('system', 'module_enable', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_enable', ["bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:module_enable:TemplServices["bx_posts"]~}} @endcode
     * 
     * Enable the requested module.
     * @param $mixedModule - module ID/name to enable.
     * @return boolean value determining the result of the operation.
     * 
     * @see BxBaseServices::serviceModuleEnable
     */
    /** 
     * @ref bx_system_general-module_enable "module_enable"
     */
    public function serviceModuleEnable($mixedModule)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        if(empty($aModule) || !is_array($aModule))
            return false;

        if((int)$aModule['enabled'] != 0)
            return false;

        $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aModule['path'], 'enable');
        if($aResult['code'] != BX_DOL_STUDIO_IU_RC_SUCCESS)
            return false;

        return true;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-module_disable module_disable
     * 
     * @code bx_srv('system', 'module_disable', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'module_disable', ["bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:module_disable:TemplServices["bx_posts"]~}} @endcode
     * 
     * Disable the requested module.
     * @param $mixedModule - module ID/name to disable.
     * @return boolean value determining the result of the operation.
     * 
     * @see BxBaseServices::serviceModuleDisable
     */
    /** 
     * @ref bx_system_general-module_disable "module_disable"
     */
    public function serviceModuleDisable($mixedModule)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        if(empty($aModule) || !is_array($aModule))
            return false;

        if((int)$aModule['enabled'] == 0)
            return false;

        $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aModule['path'], 'disable');
        if($aResult['code'] != BX_DOL_STUDIO_IU_RC_SUCCESS)
            return false;

        return true;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-is_module_installed is_module_installed
     * 
     * @code bx_srv('system', 'is_module_installed', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'is_module_installed', ["bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:is_module_installed:TemplServices["bx_posts"]~}} @endcode
     * 
     * Checks whether the requested module is installed or not.
     * @param $mixedModule - module ID/name to check.
     * @return boolean value determining the result of the operation.
     * 
     * @see BxBaseServices::serviceIsModuleInstalled
     */
    /** 
     * @ref bx_system_general-is_module_installed "is_module_installed"
     */
    public function serviceIsModuleInstalled($mixedModule)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        return !empty($aModule) && is_array($aModule);
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-is_module_enabled is_module_enabled
     * 
     * @code bx_srv('system', 'is_module_enabled', ["bx_posts"]); @endcode
     * @code bx_srv('system', 'is_module_enabled', ["bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:is_module_enabled:TemplServices["bx_posts"]~}} @endcode
     * 
     * Checks whether the requested module is enabled or not.
     * @param $mixedModule - module ID/name to check.
     * @return boolean value determining the result of the operation.
     * 
     * @see BxBaseServices::serviceIsModuleEnabled
     */
    /** 
     * @ref bx_system_general-is_module_enabled "is_module_enabled"
     */
    public function serviceIsModuleEnabled($mixedModule)
    {
        $aModule = BxDolModuleQuery::getInstance()->{'getModuleBy' . (is_numeric($mixedModule) ? 'Id' : 'Name')}($mixedModule, false);
        return !empty($aModule) && is_array($aModule) && (int)$aModule['enabled'] != 0;
    }

    /**
     * Checks whether a module is a 'Content' module or not.
     * 
     * @param string $mixedModule - module name or an instance of Module class.
     * @return boolean result of operation.
     */
    public function serviceIsModuleContent($mixedModule)
    {
        if($mixedModule instanceof BxDolModule)
            $mixedModule = $mixedModule->getName();

        return BxDolModuleQuery::getInstance()->isModuleContent($mixedModule);
    }

    /**
     * Checks whether a module is a 'Context' module or not.
     * 
     * @param string $mixedModule - module name or an instance of Module class.
     * @return boolean result of operation.
     */
    public function serviceIsModuleContext($mixedModule)
    {
        if($mixedModule instanceof BxDolModule)
            $mixedModule = $mixedModule->getName();

        return BxDolModuleQuery::getInstance()->isModuleContext($mixedModule);
    }

    /**
     * Checks whether a module is a 'Profile' module or not.
     * 
     * @param string $mixedModule - module name or an instance of Module class.
     * @return boolean result of operation.
     */
    public function serviceIsModuleProfile($mixedModule)
    {
        if($mixedModule instanceof BxDolModule)
            $mixedModule = $mixedModule->getName();

        return BxDolModuleQuery::getInstance()->isModuleProfile($mixedModule);
    }

    /**
     * Get modules by type. Available types are 'content', 'context', 'profile'.
     * 
     * @param type $sType - string with type.
     * @return array of modules.
     */
    public function serviceGetModulesByType($sType, $aParams = [])
    {
        $oModuleQuery = BxDolModuleQuery::getInstance();

        if(!$oModuleQuery->checkModulesSubtypes()) {
            $oInstallerUtils = new BxDolInstallerUtils();
            $aModules = $oModuleQuery->getModulesBy(['type' => 'modules']);
            foreach($aModules as $aModule)
                if(($iModuleSubtypes = $oInstallerUtils->getSubtypes($aModule['name'])) != 0)
                    $oModuleQuery->updateModule(['subtypes' => $iModuleSubtypes], ['id' => $aModule['id']]);
        }

        $iSubtypes = 0;
        switch($sType) {
            case 'content':
                $iSubtypes = BX_DOL_MODULE_SUBTYPE_TEXT;
                break;

            case 'context':
                $iSubtypes = BX_DOL_MODULE_SUBTYPE_CONTEXT;
                break;

            case 'profile':
                $iSubtypes = BX_DOL_MODULE_SUBTYPE_PROFILE;
                break;
        }

        $aResults = $oModuleQuery->getModulesBy(array_merge([
            'type' => 'modules_subtypes', 
            'value' => $iSubtypes, 
            'active' => 1
        ], array_intersect_key($aParams, array_flip(['id_as_key', 'name_as_key']))));

        return $aResults;
    }

    public function serviceGetModulesBySubtypeSimple($sType)
    {
        $a = $this->serviceGetModulesByType($sType, ['name_as_key' => true]);
        return array_map(function ($r) {
            return $r['title'];
        }, $a);
    }

    public function serviceProfileUnit ($iContentId, $aParams = array())
    {
        return $this->_serviceProfileFunc('getUnit', $iContentId, $aParams);
    }
    
    public function serviceProfileUnitApi ($iContentId, $aParams = [])
    {
        return $this->_serviceProfileFunc('getUnitApi', $iContentId, $aParams);
    }

    public function serviceHasImage ($iContentId)
    {
        return false;
    }

    public function serviceProfilePicture ($iContentId)
    {
        return $this->_serviceProfileFunc('getPicture', $iContentId);
    }

    public function serviceProfileAvatar ($iContentId)
    {
        return $this->_serviceProfileFunc('getAvatar', $iContentId);
    }

    public function serviceProfileAvatarBig ($iContentId)
    {
        return $this->_serviceProfileFunc('getAvatarBig', $iContentId);
    }

    public function serviceProfileCover ($iContentId)
    {
        return '';
    }

    public function serviceProfileEditUrl ($iContentId)
    {
        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=account-settings-info'));
    }

    public function serviceProfileThumb ($iContentId)
    {
        return $this->_serviceProfileFunc('getThumb', $iContentId);
    }

    public function serviceProfileIcon ($iContentId)
    {
        return $this->_serviceProfileFunc('getIcon', $iContentId);
    }

    public function serviceProfileName ($iContentId)
    {
        return $this->_serviceProfileFunc('getDisplayName', $iContentId);
    }

    public function serviceProfileUrl ($iContentId)
    {
        return $this->_serviceProfileFunc('getUrl', $iContentId);
    }

    /**
     * @see iBxDolProfileService::serviceCheckAllowedProfileView
     */ 
    public function serviceCheckAllowedProfileView($iContentId)
    {
        return _t('_Access denied');
    }

    /**
     * @see iBxDolProfileService::serviceCheckAllowedProfileContact
     */ 
    public function serviceCheckAllowedProfileContact($iContentId)
    {
        return _t('_Access denied');
    }

    /**
     * @see iBxDolProfileService::serviceCheckAllowedPostInProfile
     */ 
    public function serviceCheckAllowedPostInProfile($iContentId, $sPostModule = '')
    {
        return _t('_Access denied');
    }

    /**
     * @see iBxDolProfileService::serviceCheckAllowedModuleActionInProfile
     */
    public function serviceCheckAllowedModuleActionInProfile($iContentId, $sPostModule, $sActionName)
    {
        return _t('_Access denied');
    }

    /**
     * @see iBxDolProfileService::serviceGetSpaceTitle
     */ 
    public function serviceGetSpaceTitle()
    {
        return '';
    }

    /**
     * @see iBxDolProfileService::serviceGetParticipatingProfiles
     */ 
    public function serviceGetParticipatingProfiles($iProfileId, $aConnectionObject = false)
    {
        return array();
    }
    
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-get_create_post_form get_create_post_form
     * 
     * @code bx_srv('system', 'get_create_post_form', [false, "bx_posts"], 'TemplServices'); @endcode
     * @code {{~system:get_create_post_form:TemplServices[false,"bx_posts"]~}} @endcode
     * 
     * Get United Create Post form.
     * @param $mixedContextId - context which the post will be created in:
     *      - false = 'Public' post form;
     *      - 0 = 'Profile' post form, which allows to post in your own profile and connections;
     *      - n = 'Context' post form, which allows to post in context (3d party profile, group, event, etc).
     * @param $sDefault - tab selected by default.
     * @param $aCustom - an array with custom paramaters.
     * @return string with form content
     * 
     * @see BxBaseServices::serviceGetCreatePostForm
     */
    /** 
     * @ref bx_system_general-get_create_post_form "get_create_post_form"
     */
    public function serviceGetCreatePostForm($mixedContextId = false, $sDefault = '', $aCustom = array())
    {
    	if(!isLogged() || ($mixedContextId !== false && !is_numeric($mixedContextId)))
            return '';

        $oProfile = BxDolProfile::getInstance();
        if(!$oProfile)
            return '';

        if($mixedContextId !== false)
            $mixedContextId = (int)(!empty($mixedContextId) ? -$mixedContextId : $oProfile->id());

    	$oMenu = BxDolMenu::getObjectInstance('sys_create_post');
        if(!$oMenu)
            return '';

        $oMenu->setContextId($mixedContextId);
    	$aMenuItems = $oMenu->getMenuItems();
    	if(empty($aMenuItems) || !is_array($aMenuItems))
            return '';

    	if(empty($sDefault)) {
            $aDefault = array_shift($aMenuItems);
            $sDefault = !empty($aDefault['module']) ? $aDefault['module'] : $aDefault['name'];
    	}
    	$oMenu->setSelected($sDefault, $sDefault);

        $oContext = false;
        $bContext = $mixedContextId !== false;
        if($bContext && ($oContext = BxDolProfile::getInstance(abs($mixedContextId))) !== false)
            if(bx_srv($oContext->getModule(), 'check_allowed_post_in_profile', [$oContext->getContentId(), $sDefault]) !== CHECK_ACTION_RESULT_ALLOWED)
                return '';

        $sTitle = '_sys_page_block_title_create_post';
        if(!$bContext)
            $sTitle = _t($sTitle . '_public');
        else if($mixedContextId < 0) {
            $sTitle = _t($sTitle . '_context');
            if($oContext)
                $sTitle = bx_replace_markers($sTitle, [
                    'display_name' => $oContext->getDisplayName()
                ]);
        }
        else
            $sTitle = _t($sTitle);

        $sPlaceholder = _t('_sys_txt_create_post_placeholder', $oProfile->getDisplayName());

        $oDbModules = BxDolModuleQuery::getInstance();
    	$oTemplate = BxDolTemplate::getInstance();
    	$oTemplate->addJs(['BxDolCreatePost.js']);

        $aPreloadingList = [];
        $aModules = explode(',', getParam('sys_create_post_form_preloading_list'));
        if(!empty($aModules))
            foreach($aModules as $sModule) {
                $aModule = $oDbModules->getModuleByName($sModule);
                if(empty($aModule) || !is_array($aModule))
                    continue;

                $aPreloadingList[$sModule] = $aModule['uri'];
            }

        if(bx_is_api()) {
            return [
                'title' => $sTitle,
                'content' =>  [
                    bx_api_get_block('get_create_post_form', [
                        'menu' => $oMenu->getCodeAPI(),
                        'params' => ['context_id' => $mixedContextId]])
                ]
            ];
        }

    	$sJsObject = 'oBxDolCreatePost';
        $sJsContent = $oTemplate->_wrapInTagJsCode("var " . $sJsObject . " = new BxDolCreatePost(" . json_encode([
            'sObjName' => $sJsObject,
            'sRootUrl' => BX_DOL_URL_ROOT,
            'sDefault' => $sDefault,
            'iContextId' => $bContext ? $mixedContextId : 0,
            'oPreloadingList' => $aPreloadingList,
            'oCustom' => $aCustom
        ]) . ");");

    	return [
            'title' => $sTitle,
            'content' => $oTemplate->parseHtmlByName('create_post_form.html', [
                'default' => $sDefault,
                'placeholder' => $sPlaceholder,
                'user_thumb' => $oProfile->getUnit(0, ['template' => 'unit_wo_info_links']),
                'form' => bx_srv($sDefault, 'get_create_post_form', [[
                    'context_id' => $mixedContextId, 
                    'ajax_mode' => true, 
                    'absolute_action_url' => true, 
                    'custom' => $aCustom
                ]]),
                'js_object' => $sJsObject,
                'js_content' => $sJsContent
            ]),
            'menu' => $oMenu->getMenuItemsCount() > 1 ? $oMenu : ''
        ];
    }

    public function serviceGetOptionsCreatePostFormPreloadingList()
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_create_post');
        if(!$oMenu)
            return [];

        $aMenuItems = $oMenu->getMenuItems();

        $aResult = [];
        foreach($aMenuItems as $aMenuItem) {
            $sModule = !empty($aMenuItem['module']) ? $aMenuItem['module'] : $aMenuItem['name'];
            if(!bx_srv('system', 'is_module_enabled', [$sModule]))
                continue;

            $aResult[] = [
                'key' => $sModule, 
                'value' => _t('_' . $sModule)
            ];
        }

        return $aResult;
    }

    public function serviceGetBlockAuthor($sModule, $iContentId = 0)
    {
        if(!$iContentId && bx_get('id') !== false)
            $iContentId = (int)bx_get('id');

        $sMethodGetAuthor = 'get_author';
        if(!$sModule || !$iContentId || !BxDolRequest::serviceExists($sModule, $sMethodGetAuthor))
            return '';

        $iAuthor = bx_srv($sModule, $sMethodGetAuthor, [$iContentId]);
        if(!$iAuthor)
            return '';

        $oAuthor = BxDolProfile::getInstance($iAuthor);
        if(!$oAuthor)
            return '';

        $sModuleAuthor = $oAuthor->getModule();
        $sMethodGetCover = 'entity_cover';
        if(!BxDolRequest::serviceExists($sModuleAuthor, $sMethodGetCover))
            return '';

        return bx_srv($sModuleAuthor, $sMethodGetCover, [$oAuthor->getContentId(), [
            'use_as_author' => true,
            'show_text' => false
        ]]);
    }

    public function serviceGetBlockAskAssistant($aParams = [])
    {
        $iAssistant = BxDolAI::getAssistantForAskBlock();
        if(!$iAssistant)
            return '';

        return BxDolAIAssistant::getObjectInstance($iAssistant)->getAskBlock($aParams);
    }

    public function serviceGetMenu($aParams)
    {
        $bIsApi = bx_is_api();
        $mixedResulEmpty = $bIsApi ? [] : '';

        if($bIsApi && is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);

        if(!isset($aParams['object']))
            return $mixedResulEmpty;

        $oMenu = BxDolMenu::getObjectInstance($aParams['object']);
        if(!$oMenu)
            return $mixedResulEmpty;

        if(!empty($aParams['params']) && is_array($aParams['params']))
            $oMenu->setContentParams($aParams['params']);

        return $bIsApi ? $oMenu->getCodeAPI() : $oMenu->getCode();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-get_site_submenu get_site_submenu
     * 
     * @code bx_srv('system', 'get_site_submenu', [], 'TemplServices'); @endcode
     * @code {{~system:get_site_submenu:TemplServices[]~}} @endcode
     * 
     * Get Site Submenu code.
     * @see BxBaseServices::serviceGetSiteSubmenu
     */
    /** 
     * @ref bx_system_general-get_site_submenu "get_site_submenu"
     */
    public function serviceGetSiteSubmenu()
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        return $oMenu ? $oMenu->getCode() : '';
    }
    
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-get_products_names get_products_names
     * 
     * @code bx_srv('system', 'get_products_names', [], 'TemplServices'); 
     *
     * @code http://example.com/m/oauth2/com/get_products_names?module=system&class=BaseServices @endcode
     * @code http://hihi.una.io/modules/?r=oauth2/com/get_products_names&module=system&class=BaseServices @endcode
     * 
     * Get an array of products names from all modules with payments functionality.
     * @param $iVendorId filter products by vendor ID.
     * @param $iLimit limit number of records from one module.
     * @return array of products where key id product name and value is module name
     * 
     * @see BxBaseServices::serviceGetProductsNames
     */
    /** 
     * @ref bx_system_general-get_products_names "get_products_names"
     */
    public function serviceGetProductsNames($iVendorId = 0, $iLimit = 1000)
    {
        $o = BxDolPayments::getInstance();
        if (!$o)
            return array();
        return $o->getProductsNames($iVendorId, $iLimit);
    }

    /**
     * @see iBxDolProfileService::serviceCheckSpacePrivacy
     */ 
    public function serviceCheckSpacePrivacy($iContentId)
    {
        return _t('_Access denied');
    }
    
    public function serviceFormsHelper ()
    {
        return new BxTemplAccountForms();
    }

    public function serviceActAsProfile ()
    {
        return false;
    }

    public function serviceGetModerators($iContentId)
    {
        $aModerators = BxDolAclQuery::getInstance()->getProfilesByMembership([
            MEMBERSHIP_ID_MODERATOR, 
            MEMBERSHIP_ID_ADMINISTRATOR
        ]);

        $aIds = [];
        array_walk($aModerators, function ($aItem, $iKey, $aParams) {
            if(!empty($aItem['id']))
                $aParams[0][] = (int)$aItem['id'];
        }, [&$aIds]);

        return $aIds;
    }

    public function servicePrepareFields ($aFieldsProfile)
    {
        return $aFieldsProfile;
    }

    public function serviceProfilesSearch ($sTerm, $iLimit)
    {
        $oDb = BxDolAccountQuery::getInstance();
        $aRet = array();
        $a = $oDb->searchByTerm($sTerm, $iLimit);
        foreach ($a as $r)
            $aRet[] = array ('label' => $this->serviceProfileName($r['content_id']), 'value' => $r['profile_id']);
        return $aRet;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-keyword_search keyword_search
     * 
     * @code bx_srv('system', 'keyword_search', ["bx_posts", ["keyword" => "test"}], 'TemplServices'); @endcode
     * 
     * @code {{~system:keyword_search:TemplServices["bx_posts", {"keyword":"test"}]~}} @endcode
     * @code {{~system:keyword_search:TemplServices["bx_albums", {"meta_type": "location_country", "keyword": "AU"}, "unit.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServices["bx_albums", {"meta_type": "location_country_state", "state":"NSW", "keyword": "AU"}, "unit.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServices["bx_albums", {"meta_type": "location_country_city", "state":"NSW", "city":"Manly", "keyword": "AU"}, "unit.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServices["bx_posts", {"meta_type": "mention", "keyword": 2}, "unit_gallery.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServices["bx_posts", {"cat": "bx_posts_cats", "keyword": 3}, "unit_gallery.html"]~}} @endcode
     * 
     * Search by keyword
     * @param $sSection - search object to search in, usually module name, for example: bx_posts
     * @param $aCondition - condition for search, supported conditions: 
     *          - search by keyword: ["keyword" => "test"]
     *          - search by country: ["meta_type" => "location_country", "keyword" => "AU"]
     *          - search by country and state: ["meta_type": "location_country_state", "state":"NSW", "keyword": "AU"]
     *          - search by country, state and city: ["meta_type": "location_country_city", "state":"NSW", "city":"Manly", "keyword": "AU"]
     *          - search for mentions: ["meta_type" => "mention", "keyword" => 2]
     *          - search in category: ["cat": "bx_posts_cats", "keyword": 3]
     * @param $sTemplate - template for displaying search results, for example: unit.html
     * @param $iStart - paginate, display records starting from this number
     * @param $iPerPage - paginate, display this number of records per page
     * @param $bLiveSearch - search results like in live search
     * 
     * @see BxBaseServices::serviceKeywordSearch
     */
    /** 
     * @ref bx_system_general-keyword_search "keyword_search"
     */
    public function serviceKeywordSearch ($sSection, $aCondition, $sTemplate = '', $iStart = 0, $iPerPage = 0, $bLiveSearch = 0, $bPaginate = false)
    {
        if (!$sSection || !isset($aCondition['keyword']))
            return '';

        $sClass = 'BxTemplSearch';

        $sElsName = 'bx_elasticsearch';
        $sElsMethod = 'is_configured';
        if(BxDolRequest::serviceExists($sElsName, $sElsMethod) && BxDolService::call($sElsName, $sElsMethod)) {
             $oModule = BxDolModule::getInstance($sElsName);

             bx_import('Search', $oModule->_aModule);
             $sClass = 'BxElsSearch';
        }

        $oSearch = new $sClass(array($sSection));
        $oSearch->setLiveSearch($bLiveSearch);
        $oSearch->setMetaType(isset($aCondition['meta_type']) ? $aCondition['meta_type'] : '');
        $oSearch->setCategoryObject(isset($aCondition['cat']) ? $aCondition['cat'] : '');
        $oSearch->setCustomSearchCondition($aCondition);
        if (!$bPaginate)
            $oSearch->setRawProcessing(true);
        $oSearch->setCustomCurrentCondition(array(
            'paginate' => array (
                'start' => $iStart,
                'perPage' => $iPerPage ? $iPerPage : BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT,
            )));
        if ($sTemplate)
            $oSearch->setUnitTemplate($sTemplate);
        
        return $oSearch->response();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-keyword_search keyword_search
     * 
     * @code bx_srv('system', 'search_keyword_form', 'TemplServices'); @endcode
     * 
     * Block with Search by Keywords Form
     *  
     * @see BxBaseServices::serviceSearchKeywordForm
     */
    /** 
     * @ref bx_system_general-keyword_search "keyword_search"
     */
    public function serviceSearchKeywordForm ()
    {
        return $this->_getSearchObject()->getForm(BX_DB_PADDING_DEF, false, true);
    }
    
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-keyword_search keyword_search
     * 
     * @code bx_srv('system', 'search_keyword_result', 'TemplServices'); @endcode
     * 
     * Block with Search by Keywords Results
     *  
     * @see BxBaseServices::serviceSearchKeywordResult
     */
    /** 
     * @ref bx_system_general-keyword_search "keyword_search"
     */
    public function serviceSearchKeywordResult ()
    {
        $sType = bx_process_input(bx_get('type'));
        $sKeyword = bx_process_input(bx_get('keyword'));
        $bKeyword = $sKeyword !== false;

        if(bx_is_api())
            return $this->serviceGetDataSearchApi(['params' => [
                'type' => $sType,
                'keyword' => $sKeyword,
                'section' => bx_process_input(bx_get('section')),
                'cat' => bx_process_input(bx_get('cat'))
            ]]);

        $sCode = '';
        if($bKeyword) {
            $oSearch = $this->_getSearchObject();

            if(($sCode = $oSearch->response()))
                $sCode = BxDolTemplate::getInstance()->parseHtmlByName('search_result_block.html', [
                    'html_id' => 'bx-search-results-keyword',
                    'class' => 'bx-search-results-container',
                    'attrs' => '',
                    'content' => $sCode,
                    'bx_if:do_center' => [
                        'condition' => false,
                        'content' => [
                            'html_id' => '',
                            'selector_content' => ''
                        ]
                    ]
                ]);
            else
                $sCode = $oSearch->getEmptyResult();
        }

        return $sCode;
    }

    /** 
     * @ref bx_system_general-get_date_search_api "get_date_search_api"
     * @api @ref bx_system_general-get_date_search_api "get_date_search_api"
     */
    public function serviceGetDataSearchApi ($aParams)
    {
        if(!bx_is_api())
            return false;

        if(is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);

        $bForceAll = ($aParams['params']['type'] ?? '') == 'keyword';

        $aSectionsAvail = explode(',', getParam('sys_api_search_sections'));
        $aSectionsAll = BxDolDb::getInstance()->fromCache(
            'sys_global_search_pairs', 
            'getPairs', 
            'SELECT `ObjectName` AS `name`, `Title` AS `title` FROM `sys_objects_search` WHERE `GlobalSearch`=\'1\' ORDER BY `Order` ASC',
            'name', 'title'
        );

        $aSections = [];
        foreach($aSectionsAll as $sSectionName => $sSectionTitle)
            if(in_array($sSectionName, $aSectionsAvail) || $bForceAll)
                $aSections[$sSectionName] = [
                    'name' => $sSectionName,
                    'title' => _t($sSectionTitle)
                ];

        $aParamsBrowse = array_merge([
            'keyword' => '',
            'section' => '',
            'sections' => array_values($aSections),
            'start' => 0,
            'per_page' => 12
        ], !empty($aParams['params']) && is_array($aParams['params']) ? $aParams['params'] : []);

        if(empty($aParamsBrowse['section']))
            $aParamsBrowse['section'] = array_keys($aSections);
        else if(is_string($aParamsBrowse['section']))
            $aParamsBrowse['section'] = explode(',', $aParamsBrowse['section']);

        $sClass = 'BxTemplSearch';
        
        $sSections = $aParamsBrowse['section'];
        if ($aParamsBrowse['live'] !== true && count($sSections) > 1){
            
            $aParamsBrowse['section'] = [];
            $aParamsBrowse['sections'] = [];
            
            $aDataRv = [];
            foreach ($sSections as $sSection) {
                $oSearch = new $sClass($sSection);
                $oSearch->setLiveSearch(true);
                $oSearch->setDataProcessing(true);
                $oSearch->setCustomSearchCondition(['keyword' => $aParamsBrowse['keyword']]);
                $oSearch->setCustomCurrentCondition([
                    'paginate' => [
                        'forceStart' => $aParamsBrowse['start'],
                        'perPage' => $aParamsBrowse['per_page'],
                    ]
                ]);

                $aData = $oSearch->response();
                if(count($aData) > $aParamsBrowse['per_page'])
                    $aData = array_slice($aData, $aParamsBrowse['start'], $aParamsBrowse['per_page']);

                if (count($aData) > 0) {
                    $oSearchResult = $oSearch->getSearchResultObject($sSection);
                    $sSectionTitle = $oSearchResult->aCurrent['title'];

                    $aParamsBrowse['section'][] = $sSection;
                    $aParamsBrowse['sections'][] = ['name' => $sSection, 'title' => $sSectionTitle];

                    $aDataRv[] = [
                        'section' => $sSection, 
                        'section_name' => $sSectionTitle, 
                        'data' => $aData,
                        'is_profile' => bx_srv('system', 'is_module_profile', [$oSearchResult->aCurrent['module_name']])
                    ];
                }
                
            }
            return [bx_api_get_block('search_sections', [
                'data' => $aDataRv,
                'params' => $aParamsBrowse
            ])];
        }
        else{
            $oSearch = new $sClass($aParamsBrowse['section']);
            $oSearch->setLiveSearch(true);
            $oSearch->setDataProcessing(true);
            $oSearch->setCustomSearchCondition(['keyword' => $aParamsBrowse['keyword']]);
            $oSearch->setCustomCurrentCondition([
                'paginate' => [
                    'forceStart' => $aParamsBrowse['start'],
                    'perPage' => $aParamsBrowse['per_page'],
                ]
            ]);

            $aData = $oSearch->response();
            if(count($aData) > $aParamsBrowse['per_page'])
                $aData = array_slice($aData, $aParamsBrowse['start'], $aParamsBrowse['per_page']);

            return [
                bx_api_get_block('browse', [
                    'unit' => 'search-results',  
                    'request_url' => '/api.php?r=system/get_data_search_api/TemplServices&params[]=',
                    'params' => $aParamsBrowse,
                    'data' => $aData
                ])
            ];
        }
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-cmts cmts
     * 
     * @code bx_srv('system', 'cmts', ["sys_blocks", 1], 'TemplServices'); @endcode
     * 
     * @code {{~system:cmts:TemplServices["sys_blocks", 1]~}} @endcode
     * 
     * Comments block
     * @param $sObject - comments object name
     * @param $sId - content id assiciated tith the comments
     * 
     * @see BxBaseServices::serviceCmts
     */
    /** 
     * @ref bx_system_general-cmts "cmts"
     */
    public function serviceCmts ($sObject, $sId)
    {
        $o = BxDolCmts::getObjectInstance($sObject, $sId);
        if (!$o || !$o->isEnabled())
            return '';
        return $o->getCommentsBlock(array(), array('in_designbox' => false, 'show_empty' => true));
    }

    public function _serviceProfileFunc ($sFunc, $iContentId, $aParams = array())
    {
        if (!$iContentId)
            return false;
        if (!($oAccount = BxDolAccount::getInstance($iContentId)))
            return false;

        return $oAccount->$sFunc(false, $aParams);
    }

    public function serviceAlertResponseProcessInstalled()
    {
        BxDolTranscoderImage::registerHandlersSystem();
    }

    public function serviceAlertResponseProcessStorageChange ($oAlert)
    {
        if ('sys_storage_default' != $oAlert->aExtras['option'])
            return;

        $aStorages = BxDolStorageQuery::getStorageObjects();
        foreach ($aStorages as $r) {
            if (0 == $r['current_size'] && 0 == $r['current_number'] && ($oStorage = BxDolStorage::getObjectInstance($r['object'])))
                $oStorage->changeStorageEngine($oAlert->aExtras['value']);
        }

    }

    public function serviceGetOptionsProfileBot()
    {
        $aResult = array(
            array('key' => '', 'value' => _t('_Select_one'))
        );

        $aAccountsIds = BxDolAccountQuery::getInstance()->getOperators();
        foreach($aAccountsIds as $iAccountId) {
            $aProfilesIds = BxDolAccount::getInstance($iAccountId)->getProfilesIds(true, false);
            foreach($aProfilesIds as $iProfileId) {
                $oProfile = BxDolProfile::getInstance($iProfileId);
                $aResult[] = array(
                    'key' => $iProfileId,
                    'value' => _t('_sys_profile_with_type', $oProfile->getDisplayName(), $oProfile->getModule()),
                );
            }
        }

        return $aResult;
    }
    
    public function serviceGetOptionsModuleListForPrivacySelector()
    {
        $aResult = array();
        $BxDolModuleQuery = BxDolModuleQuery::getInstance();
        $aModules = $BxDolModuleQuery->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule){
            $oModule = BxDolModule::getInstance($aModule['name']);
            if($oModule instanceof iBxDolContentInfoService){
                if (!BxDolRequest::serviceExists($aModule['name'], 'act_as_profile'))
                    continue;
                $aResult[$aModule['name']] = $aModule['title'];
            }
        }
        return $aResult;
    }
    

    public function serviceGetOptionsCaptchaDefault()
    {
        $aResults = [];
        $aObjects = BxDolCaptchaQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = $aObject['title'];

        return $aResults;
    }

    public function serviceGetOptionsEmbedDefault()
    {
        $aResults = array(
            '' => _t('_None')
        );

        $aObjects = BxDolEmbedQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = _t($aObject['title']);

        return $aResults;
    }

    public function serviceGetOptionsLocationFieldDefault()
    {
        $aResults = array();

        $aObjects = BxDolLocationFieldQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = _t($aObject['title']);

        return $aResults;
    }

    public function serviceGetOptionsLocationMapDefault()
    {
        $aResults = array();

        $aObjects = BxDolLocationMapQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = _t($aObject['title']);

        return $aResults;
    }

    public function serviceGetOptionsPushDefault()
    {
        $aResults = [
            '' => _t('_None')
        ];

        $aObjects = BxDolPushQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = $aObject['title'];

        return $aResults;
    }

    public function serviceGetOptionsSmsDefault()
    {
        $aResults = [
            '' => _t('_None')
        ];

        $aObjects = BxDolSmsQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = $aObject['title'];

        return $aResults;
    }

    public function serviceGetOptionsSocketsFieldDefault()
    {
        $aResults = [];
        $aObjects = ['sys_sockets_disabled', 'sys_sockets_soketi'];
        foreach($aObjects as $sObject)
            $aResults[$sObject] = _t('_adm_stg_cpt_option_sys_sockets_type_' . $sObject);
        return $aResults;
    }

    public function serviceGetOptionsLocationLeafletGetProviders()
    {
        return BxDolLocationMapLeaflet::getProviders();
    }

    public function serviceGetOptionsRelations()
    {
        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array('type' => 'modules', 'active' => 1));

        $aProfiles = array();
        foreach($aModules as $aModule) {
            $sMethod = 'act_as_profile';
            if(!BxDolRequest::serviceExists($aModule['name'], $sMethod) || !BxDolService::call($aModule['name'], $sMethod))
                continue;

            $aProfiles[$aModule['name']] = _t('_' . $aModule['name']);
        }

        $aResults = array();
        foreach($aProfiles as $sName1 => $sTitle1)
            foreach($aProfiles as $sName2 => $sTitle2)
                $aResults[$sName1 . '_' . $sName2] = $sTitle1 . ' - ' . $sTitle2;

        return $aResults;
    }

    public function serviceGetOptionsCfProhibited()
    {
        return BxDolFormQuery::getDataItems('sys_content_filter');
    }

    public function serviceGetOptionsCfUnauthenticated()
    {
        return BxDolFormQuery::getDataItems('sys_content_filter');
    }

    public function serviceGetOptionsTaiwindDefault()
    {
        $sPath = BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'tailwind/css';
        $aExcludes = ['.', '..', 'tailwind.css'];

        $aResults = [];
        if(($oHandle = opendir($sPath)) !== false) {
            while(($sFile = readdir($oHandle)) !== false) {
                if(in_array($sFile, $aExcludes))
                    continue;

                if(($oHandlerFile = fopen($sPath . '/' . $sFile, 'r')) === false)
                    continue;

                if(($sContent = fread($oHandlerFile, 1024)) !== false && strpos($sContent, '@tailwind base') === false)
                    $aResults[$sFile] = $sFile;

                fclose($oHandlerFile);
            }

            closedir($oHandle);
        }

        /**
         * Disabled for now, because CDN and custom compiled build with own styles 
         * don't work correctly together.
         * 
         * $aResults['cdn'] = _t('_adm_stg_cpt_option_sys_css_tailwind_default_cdn');
         */

        return $aResults;
    }

    public function serviceGetOptionsIconsetDefault()
    {
        $aObjects = BxDolIconsetQuery::getObjects();
        foreach($aObjects as $aObject)
            $aResults[$aObject['object']] = $aObject['title'];

        return $aResults;
    }

    public function serviceGetOptionsApiRootPageGuest()
    {
        $sKey = '_adm_stg_cpt_option_sys_api_root_page_';

        return [
            'home' => _t($sKey .'home'), 
            'splash' => _t($sKey . 'splash')
        ];
    }

    public function serviceGetOptionsApiRootPageMember()
    {
        $sKey = '_adm_stg_cpt_option_sys_api_root_page_';

        return [
            'home' => _t($sKey .'home'), 
            'dashboard' => _t($sKey . 'dashboard'), 
            'profile' => _t($sKey . 'profile')
        ];
    }

    public function serviceGetOptionsApiMenuTop()
    {
        $aMenus = BxDolMenuQuery::getMenuObjects();

        $aResults = ['' => _t('_sys_please_select')];
        foreach($aMenus as $aMenu)
            if($aMenu['module'] == 'system')
                $aResults[$aMenu['object']] = _t($aMenu['title']);

        return $aResults;
    }

    public function serviceGetOptionsApiContextSwitcher()
    {
        $aContexts = bx_srv('system', 'get_modules_by_type', ['context']);

        $aResults = ['' => _t('_None')];
        foreach($aContexts as $aContext)
            $aResults[$aContext['name']] = _t('_' . $aContext['name']);

        return $aResults;
    }

    public function serviceGetOptionsApiContextConnection()
    {
        $aConnections = ['subscriptions', 'fans', 'participants'];

        $aResults = ['' => _t('_sys_please_select')];
        foreach($aConnections as $sConnection)
            $aResults[$sConnection] = _t('_adm_stg_cpt_option_sys_api_cnt_cnn_' . $sConnection);

        return $aResults;
    }

    public function serviceGetOptionsAgentsModel()
    {
        return ['' => _t('_Select_one')] + BxDolAI::getInstance()->getModels(['active' => true, 'hidden' => false]);
    }

    public function serviceGetOptionsAgentsProfile($bSelectOne = true, $sSelectOneLangKey = '_Select_one')
    {
        $aResult = [];
        if($bSelectOne)
            $aResult[] = ['key' => '', 'value' => _t($sSelectOneLangKey)];

        $aAccountsIds = BxDolAccountQuery::getInstance()->getOperators();
        foreach($aAccountsIds as $iAccountId) {
            $aProfilesIds = BxDolAccount::getInstance($iAccountId)->getProfilesIds(true, false);
            foreach($aProfilesIds as $iProfileId) {
                $oProfile = BxDolProfile::getInstance($iProfileId);
                $sProfileModule = false === $oProfile ? '' : $oProfile->getModule();
                if ($sProfileModule && ($sProfileModule != 'system' || ($sProfileModule == 'system' && empty($oProfile->getAccountObject()->getEmail())))) {
                    $aResult[] = [
                        'key' => $iProfileId,
                        'value' => _t('_sys_profile_with_type', $oProfile->getDisplayName(), $sProfileModule === 'system' ? 'System' : _t('_' . $sProfileModule))
                    ];
                }
            }
        }

        return $aResult;
    }

    public function serviceGetOptionsStudioAssistant()
    {
        return $this->_getOptionsAiAssistants();
    }

    public function serviceGetOptionsLiveSearchAssistant()
    {
        return $this->_getOptionsAiAssistants();
    }

    public function serviceGetOptionsAskBlockAssistant()
    {
        return $this->_getOptionsAiAssistants();
    }

    public function serviceRedirect($sUrl = false)
    {
        if (!getParam('sys_confirmation_before_redirect')) {
            BxDolTemplate::getInstance()->displayPageNotFound();
            exit;
        }

        if (false === $sUrl)
            $sUrl = bx_get('url');

        if (!$sUrl || !preg_match('@^https?://@', $sUrl)) {
            http_response_code(500);
            return MsgBox(_t('_error occured'));
        }
        else {

            $bSpam = null;
            /**
             * @hooks
             * @hookdef hook-system-check_spam_url 'system', 'check_spam_url' - hook to override sClass for search
             * - $unit_name - equals `system`
             * - $action - equals `check_spam_url` 
             * - $object_id - not used 
             * - $sender_id - logged account id 
             * - $extra_params - array of additional params with the following array keys:
             *      - `is_spam` - [bool] by ref, spam url or not, can be overridden in hook processing
             *      - `content` - [string] by ref, url of link, can be overridden in hook processing
             *      - `where` - [string]  equal redirect
             * @hook @ref hook-system-check_spam_url
             */
            bx_alert('system', 'check_spam_url', 0, getLoggedId(), array(
                'is_spam' => &$bSpam, 
                'content' => &$sUrl, 
                'is_spam_ref' => &$bSpam, 
                'content_ref' => &$sUrl, 
                'where' => 'redirect'
            ));

            $sLangKey = $bSpam ? '_sys_redirect_confirmation_harmful' : '_sys_redirect_confirmation';
            return BxDolTemplate::getInstance()->parseHtmlByName('redirect.html', [
                'text' => _t($sLangKey, bx_process_output($sUrl), getParam('site_title')),
                'url' => bx_js_string($sUrl, BX_ESCAPE_STR_APOS),
            ]);
        }
    }

    public function serviceSetBadges($iContentId, $sBadgesIds, $sModule)
    {
        $aSelectedBadges = explode(",", $sBadgesIds);
        
        $iPerformerId = bx_get_logged_profile_id();
        $aCheck = checkActionModule($iPerformerId, 'set badge', 'system', false);
        if(!isAdmin() && $aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return false;
        
        $oBadges = BxDolBadges::getInstance();

        $aBadges = $oBadges->getData(array('type' => 'by_module&object', 'object_id' => $iContentId, 'module' => $sModule));

        foreach ($aBadges as $aBadge) {
            if (isset($aBadge['badge_id'])){
                $oBadges->delete($aBadge['badge_id']);
            }
        }
        
        foreach ($aSelectedBadges as $iSelectedBadge) {
           $oBadges->add($iSelectedBadge, $iContentId, $sModule);
        }
        
        checkActionModule($iPerformerId, 'set badge', 'system', true); // perform action
        
        return true;
    }
    
    public function serviceGetBadge($aBadge, $bIsCompact = false)
    {
        $sClass = '';
		$sStyleFont = '';
		$sStyleBg = '';
		if ($aBadge['color'] == '')
			$aBadge['color'] = 'purple-600';
		
        if ($bIsCompact && $aBadge['icon'] != ''){
            $aBadge['is_icon_only'] = 1;
        }
        if ($aBadge['is_icon_only'] == 1){
            $sClass .= ' bx-badge-compact';
            if (substr_count($aBadge['color'], 'rgb('))
                $sStyleFont = 'color: ' . $aBadge['color'];
            else
                $sClass .= ' text-' . $aBadge['color'];
        }
		else{
            if (substr_count($aBadge['color'], 'rgb('))
                $sStyleBg = 'background-color: ' . $aBadge['color'];
            else
                $sClass .= ' bg-' . $aBadge['color'];
		}
        
        return BxDolTemplate::getInstance()->parseHtmlByName('badge.html', array(
            'bx_if:content' => array(
                'condition' => $aBadge['is_icon_only'] != '1',
                'content' => array('content' => _t($aBadge['text'])),
            ),
            'bx_if:icon' => array(
                'condition' => $aBadge['icon'] != '',
                'content' => array('content' => BxDolTemplate::getInstance()->getIcon($aBadge['icon'], array('class' => 'bx-badge-icon sys-colored', 'style' => $sStyleFont))),
            ),
            'title' => $aBadge['text'],
			'style_font' => $sStyleFont,
			'style_bg' => $sStyleBg,
            'class' => $sClass,
            )
    	);
    }
    
    public function serviceGetFooter()
    {
        return BxDolTemplate::getInstance()->parseHtmlByName('footer.html', []);
    }

    private function _getSearchObject()
    {
        $sClass = 'BxTemplSearch';
        $sElsName = 'bx_elasticsearch';
        $sElsMethod = 'is_configured';
        if(BxDolRequest::serviceExists($sElsName, $sElsMethod) && BxDolService::call($sElsName, $sElsMethod) && !bx_get('cat') && !bx_get('type')) {
            $oModule = BxDolModule::getInstance($sElsName);
            bx_import('Search', $oModule->_aModule);
            $sClass = 'BxElsSearch';
        }
        /**
         * @hooks
         * @hookdef hook-system-search_keyword 'system', 'search_keyword' - hook to override sClass for search
         * - $unit_name - equals `system`
         * - $action - equals `search_keyword` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [string] by ref, class name for search, can be overridden in hook processing
         * @hook @ref hook-system-search_keyword
         */
        bx_alert('system', 'search_keyword', 0, 0, array('class' => &$sClass, 'class_name_ref' => &$sClass));

        $oSearch = new $sClass(bx_get('section'));
        $oSearch->setLiveSearch(bx_get('live_search') ? 1 : 0);
        $oSearch->setMetaType(bx_process_input(bx_get('type')));
        $oSearch->setCategoryObject(bx_process_input(bx_get('cat')));

        return $oSearch;
    }

    public function serviceHomeRedirect()
    {
        header("Location:" . BX_DOL_URL_ROOT, true, 301);
        exit;        
    }

    public function serviceProcessEmbed()
    {
        BxDolEmbed::getObjectInstance()->process();
    }

    public function serviceCallAgent($sType, $aAgent, $aParams)
    {
        $oAi = BxDolAI::getInstance();
        return $oAi->callAgent($sType, $aAgent, $aParams);
    }

    public function serviceCallAgentForFormInput($iAgentId)
    {
        if (!bx_get_logged_profile_id())
            return echoJson(['code' => 403, 'msg' => _t('_sys_agents_unauthorized')]);

        $sJson = file_get_contents('php://input');
        $aData = json_decode($sJson, true);

        if (json_last_error() !== JSON_ERROR_NONE)
            return echoJson(['code' => 500, 'msg' => _t('_sys_agents_json_field_err')]);
        
        $sPrompt = $aData['prompt'] ?? null;
        $sInputName = $aData['input_name'] ?? null;
        $aValues = $aData['values'] ?? [];

        $aAgent = BxDolAiQuery::getAgentObject($iAgentId);
        if (!$aAgent || !$aAgent['active'])
            return echoJson(['code' => 404, 'msg' => _t('_sys_agents_agent_not_found')]);
        
        $aParams = [
            'sender_profile_id' => bx_get_logged_profile_id(),
            'user_prompt' => $sPrompt,
            'form_field_name' => $sInputName,
            'form_values' => $aValues,
        ];

        $oAi = BxDolAI::getInstance();
        $mixed = $oAi->callAgent('form-input', $aAgent, $aParams);

        return echoJson(['code' => 200, 'msg' => $mixed]);
    }

    protected function _getOptionsAiAssistants()
    {
        $aResult = ['' => _t('_Select_one')];

        $aAgents = BxDolAI::getInstance()->getAgentsByTriggerType('manual');
        if($aAgents && is_array($aAgents)) 
            foreach($aAgents as $aAgent)
                $aResult[$aAgent['id']] = $aAgent['title'];

        return $aResult;
    }
}

/** @} */
