<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

define('BX_DOL_STUDIO_LAUNCHER_JS_CLASS', 'BxDolStudioLauncher');
define('BX_DOL_STUDIO_LAUNCHER_JS_OBJECT', 'oBxDolStudioLauncher');

class BxBaseStudioLauncher extends BxDolStudioLauncher
{
    public function __construct()
    {
        parent::__construct();

        $this->sPageUrl = BX_DOL_URL_STUDIO . 'launcher.php';
    }

    public function getPageIndex()
    {
        return $this->isLeftColumn() ? parent::getPageIndex() : 4;
    }

    public function getPageCss()
    {
        $aCss = array(
            'launcher.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flag-icon-css/css/|flag-icon.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'shepherd/css/|shepherd.css',
        );
        foreach($this->aIncludes as $sName => $oInclude)
            $aCss = array_merge($aCss, $oInclude->getCss());

        return array_merge(parent::getPageCss(), $aCss);
    }

    public function getPageJs()
    {
        $aJs = array(
            'jquery-ui/jquery-ui.min.js',
            'jquery.ui.touch-punch.min.js',
            'jquery.easing.js',
            'jquery.cookie.min.js',
            'launcher.js',
            'hammer.min.js',
            'shepherd/js/shepherd.min.js',
        );
        foreach($this->aIncludes as $sName => $oInclude)
            $aJs = array_merge($aJs, $oInclude->getJs());

        return $aJs;
    }

    public function getPageJsClass()
    {
        return BX_DOL_STUDIO_LAUNCHER_JS_CLASS;
    }

    public function getPageJsObject()
    {
        return BX_DOL_STUDIO_LAUNCHER_JS_OBJECT;
    }

    public function getPageJsCode($aOptions = array(), $bWrap = true)
    {
        return parent::getPageJsCode(array_merge($aOptions, array(
            'sActionUrl' => $this->sPageUrl,
            'sTxtMatches' => _t('_adm_txt_launcher_search_matches'),
            'sTxtMatchesOne' => _t('_adm_txt_launcher_search_matches_one'),
            'sTxtMoved' => _t('_adm_txt_widget_moved'),
        )), $bWrap);
    }

    public function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;

        $oTemplate = BxDolStudioTemplate::getInstance();

        $sIncludes = '';
        foreach($this->aIncludes as $sName => $oInclude)
            $sIncludes .= $oInclude->getJsCode();

        $sResult = $oTemplate->parseHtmlByName('launcher.html', array(
            'js_object' => $this->getPageJsObject(),
            'js_code' => $this->getPageJsCode(),
            'includes' => $sIncludes,
            'items' => $sResult,
            'empty' => _t('_adm_txt_launcher_search_empty'),
            'edit_title' => _t('_sys_menu_item_title_sa_edit'),
            'edit_done' => _t('_sys_done'),
        ));

        if (getParam('site_tour_studio') == 'on')
            $sResult .= $oTemplate->parseHtmlByName('launcher_tour.html', array());

        $sResult .= BxDolInformer::getInstance($oTemplate)->display();
        
        $oTemplate->addInjection('injection_body_style', 'text', ' bx-std-page-launcher');
        return $sResult;
    }

    public function getPopupBrowser($sType = '')
    {
        $iAccountId = getLoggedId();

        $oUtils = BxDolStudioRolesUtils::getInstance();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $bType = !empty($sType);
        $aTypes = parent::getPageTypes();
        $sSelected = $bType ? $sType : reset($aTypes)['Value'];

        $aMarkers = array();
        $aMenuItems = array();
        $aTmplVarsTypes = array();
        foreach($aTypes as $sName => $aType) {
            if(!$oUtils->isActionAllowed('use ' . $sName, $iAccountId))
                continue;

            $aTypeData = unserialize($aType['Data']);

            //--- Menu
            $aMenuItems[] = array(
                'name' => $sName,
                'title' => _t($aType['LKey']),
                'link' => 'javascript:void(0)',
                'onclick' => $this->getPageJsObject() . '.browserChangeType(this, \'' . $sName . '\')',
                'icon' => !empty($aTypeData['icon']) ? $aTypeData['icon'] : '',
                'selected' => $sName == $sSelected
            );

            //--- Conetent
            $aTmplVarsTypes[] = array(
                'type' => $sName, 
                'class' => $sName == $sSelected ? 'bx-std-lbw-active' : '',
                'widgets' => $this->getWidgets($this->aPage['name'], $this->oDb->getWidgets(array(
                    'type' => 'by_page_id', 
                    'value' => $this->aPage['id'], 
                    'wtype' => $sName != BX_DOL_STUDIO_WTYPE_DEFAULT ? $sName : ''
                )))
            );
        }

        $oMenu = new BxTemplStudioMenu(array('template' => 'menu_launcher_browser.html', 'menu_items' => $aMenuItems));
        if(!empty($aMarkers))
            $oMenu->addMarkers($aMarkers);

        $sName = 'bx-std-launcher-browser';
        $sContent = $oTemplate->parseHtmlByName('launcher_browser.html', array(
            'logo' => BxTemplStudioFunctions::getInstance()->getLogo(),
            'logo_url' => $this->sPageUrl,
            'menu' => $oMenu->getCode(),
            'bx_repeat:types' => $aTmplVarsTypes
        ));

        return array(
            'html' => BxTemplStudioFunctions::getInstance()->transBox($sName, $sContent),
            'options' => array(
                'closeOnOuterClick' => true,
                'pointer' => array(
                    'el' => '.bx-menu-breadcrumb .bx-menu-bc-' . ($bType ? 'type' : 'home'),
                    'align' => 'left',
                    'offset' => '-16 0'
                )
            )
        );
    }

    public function serviceGetCacheUpdater()
    {
        check_logged();
        if(!isAdmin())
            return '';

        $oTemplate = BxDolStudioTemplate::getInstance();
        $sContent = $oTemplate->addJs('launcher.js', true);
        $sContent .= $oTemplate->parseHtmlByName('launcher_cache_updater.html', array(
            'js_object' => $this->getPageJsObject()
        ));

        return $sContent;
    }
}

/** @} */
