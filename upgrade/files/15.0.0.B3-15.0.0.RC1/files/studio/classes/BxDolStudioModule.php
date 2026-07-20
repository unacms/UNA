<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

bx_import('BxDolStudioUtils');

define('BX_DOL_STUDIO_MOD_TYPE_SETTINGS', 'settings');
define('BX_DOL_STUDIO_MOD_TYPE_DEFAULT', BX_DOL_STUDIO_MOD_TYPE_SETTINGS);

class BxDolStudioModule extends BxTemplStudioWidget
{
    protected $sLangPrefix;
    protected $sParamPrefix;

    protected $sModule;
    protected $aModule;

    protected $sPage;
    protected $sPageDefault = BX_DOL_STUDIO_MOD_TYPE_DEFAULT;

    protected $sManageUrl;

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($mixedPageName);

        $this->sLangPrefix = 'mod';
        $this->sParamPrefix = 'mod';

        $this->sPageRssHelpObject = 'sys_studio_module_help'; 

        $this->sModule = '';
        if(is_string($sModule) && !empty($sModule))
            $this->sModule = $sModule;

        $this->sPage = $this->sPageDefault;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;

        $this->sManageUrl = '';
        if($this->bPage)
            $this->sManageUrl = BX_DOL_URL_STUDIO . 'module.php?name=' . $this->aPage['name'];
    }

    public static function getObjectInstance($mixedPageName, $sPage = "", $bInit = true)
    {
        $sModule = BX_DOL_STUDIO_MODULE_SYSTEM;
        $sClass = get_called_class();

        $aPage = BxDolStudioPageQuery::getInstance()->getPages(array('type' => 'by_page_name_full', 'value' => $mixedPageName));
        if(!empty($aPage) && is_array($aPage)) {
            $aModule = BxDolModuleQuery::getInstance()->getModuleByName($aPage['wid_module']);
            if(!empty($aModule) && is_array($aModule)) {
                $sModule = $aModule['name'];

                if(file_exists(BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'classes/' . $aModule['class_prefix'] . 'StudioPage.php')) {
                    bx_import('StudioPage', $aModule);
                    $sClass = $aModule['class_prefix'] . 'StudioPage';
                }
            }
        }

        $oObject = new $sClass($sModule, $mixedPageName, $sPage);
        if($bInit)
            $oObject->init();

        return $oObject;
    }

    public function init()
    {
        $this->aModule = BxDolModuleQuery::getInstance()->getModuleByName($this->sModule);
        if(empty($this->aModule) || !is_array($this->aModule))
            BxDolStudioTemplate::getInstance()->displayPageNotFound();

        $this->sPageRssHelpUrl = $this->aModule['help_url'];
        $this->sPageRssHelpId = $this->aModule['name'];

        $this->addMarkers(array(
            'module_name' => $this->aModule['name'],
            'module_uri' => $this->aModule['uri'],
            'module_title' => $this->aModule['title'],
        ));

        if($this->sModule != BX_DOL_STUDIO_MODULE_SYSTEM)
            $this->addAction(array(
                'type' => 'switcher',
                'name' => 'activate',
                'caption' => '_adm_txt_pca_active',
                'checked' => (int)$this->aModule['enabled'] == 1,
                'onchange' => "javascript:" . $this->getPageJsObject() . ".activate(this, '" . $this->aPage['name'] . "', {widget_id})"
            ), false);
    }

    public function checkAction()
    {
    	$sAction = bx_get($this->sParamPrefix . '_action');
    	if($sAction === false)
            return false;

        if(empty($this->aModule) || !is_array($this->aModule))
            return array('code' => 1, 'message' => _t('_sys_request_page_not_found_cpt'));

        $sAction = bx_process_input($sAction);

        $aResult = array('code' => 2, 'message' => _t('_adm_mod_err_cannot_process_action'));
        switch($sAction) {
            case 'settings':
                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));
                $iWidgetId = bx_process_input(bx_get($this->sParamPrefix . '_widget_id'), BX_DATA_INT);
                if(empty($sValue) || empty($iWidgetId))
                    break;

                $aResult = $this->settings($sValue, $iWidgetId);
                break;

            case 'activate':
                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));
                if(empty($sValue))
                    break;

                $iWidgetId = (int)bx_get($this->sParamPrefix . '_widget_id');

                $aResult = $this->activate($sValue, $iWidgetId);
                break;

            case 'uninstall':
                $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));
                if(empty($sValue))
                    break;

                $iWidgetId = bx_process_input(bx_get($this->sParamPrefix . '_widget_id'), BX_DATA_INT);

                $aResult = $this->uninstall($sValue, $iWidgetId);
                break;
        }

        return $aResult;
    }
    
    public function settings($sPage, $iWidgetId)
    {
        $aResultError = array('code' => 1, 'message' => _t('_adm_err_operation_failed'));

        $aPage = $this->aPage['wid_module'];
        if(empty($aPage) || !is_array($aPage))           
            $aPage = $this->oDb->getPages(array('type' => 'by_page_name_full', 'value' => $sPage));

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($aPage['wid_module']);
        if(empty($aModule) || !is_array($aModule))
            return $aResultError;

        $sPopupSettings = $this->getPopupSettings($sPage, $iWidgetId);
        if(empty($sPopupSettings))
            return $aResultError;

        return array('code' => 0, 'popup' => array(
            'html' => $sPopupSettings,
            'options' => array(
                'closeOnOuterClick' => true,
                'removeOnClose' => true,
                'pointer' => array(
                    'el' => '#bx-std-widget-' . $iWidgetId . ' .bx-std-wa-settings',
                )
            )
        ));
    }

    public function activate($sPage, $iWidgetId = 0)
    {
        $aPage = $this->aPage['wid_module'];
        if(empty($aPage) || !is_array($aPage))           
            $aPage = $this->oDb->getPages(array('type' => 'by_page_name_full', 'value' => $sPage));

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($aPage['wid_module']);
        if(empty($aModule) || !is_array($aModule))
            return array('code' => 1, 'message' => _t('_adm_err_operation_failed'));

        $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aModule['path'], ((int)$aModule['enabled'] == 0 ? 'enable' : 'disable'), array('html_response' => true));
        if($aResult['code'] != 0)
            return $aResult;

        $this->aModule = BxDolModuleQuery::getInstance()->getModuleByName($this->sModule);

        $aResult = array('code' => 0, 'message' => _t('_adm_scs_operation_done'));
        if($iWidgetId == 0) {
            $aResult['content'] = '';
            if(!$this->_bShowHeaderBreadcrumb || (int)$aModule['enabled'] == 0)
                $aResult['content'] = BxDolStudioTemplate::getInstance()->parseHtmlByName('page_content_2_col.html', [
                    'page_menu_code' => $this->getPageMenu(),
                    'page_main_code' => $this->getPageCode()
                ]);
        }
        else
            $aResult['widget'] = BxTemplStudioFunctions::getInstance()->getWidget($iWidgetId);

        return $aResult;
    }

    public function uninstall($sPage, $iWidgetId = 0)
    {
        $aPage = $this->aPage;
        if(empty($aPage) || !is_array($aPage))           
            $aPage = $this->oDb->getPages(array('type' => 'by_page_name_full', 'value' => $sPage));

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($aPage['wid_module']);
        if(empty($aModule) || !is_array($aModule))
            return array('code' => 1, 'message' => _t('_adm_err_operation_failed'));

        if($iWidgetId != 0 && (int)bx_get($this->sParamPrefix . '_confirmed') != 1)
            return array('code' => 2, 'popup' => $this->getPopupConfirmUninstall($iWidgetId, $aModule));

        $aResult = BxDolStudioInstallerUtils::getInstance()->perform($aModule['path'], 'uninstall', array('html_response' => true));
        if($aResult['code'] == BX_DOL_STUDIO_IU_RC_SUCCESS) {
            $aResult = array_merge($aResult, array(
                'page' => $aPage['name'],
                'widget_id' => $iWidgetId,
                'eval' => $this->getPageJsObject() . ".onUninstall(oData);"
            ));

            BxTemplStudioMenuTop::historyDelete($aPage['name']);
        }

        return $aResult;
    }
}

/** @} */
