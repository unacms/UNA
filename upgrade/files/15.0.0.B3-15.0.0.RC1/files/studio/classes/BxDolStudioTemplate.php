<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_PAGE_COLUMN_DUAL', 3); ///< page, with 2 columns

class BxDolStudioTemplate extends BxDolTemplate implements iBxDolSingleton
{
    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_sRootPath = BX_DOL_DIR_STUDIO;
        $this->_sRootUrl = BX_DOL_URL_STUDIO;
        $this->_sPrefix = 'BxDolStudioTemplate';
        $this->_sInjectionsTable = 'sys_injections_admin';
        $this->_sInjectionsCache = 'sys_injections_admin.inc';

        $aCode = self::retrieveCode();

        $this->_sCodeKey = BX_DOL_STUDIO_TEMPLATE_CODE_KEY;
        $aCodeStudio = self::retrieveCode($this->_sCodeKey, $this->_sMixKey, $this->_sRootPath);

        $sCodeDefault = getParam('template');
        if($aCodeStudio !== false && $aCodeStudio[0] != $sCodeDefault)
            $aCode = $aCodeStudio;

        list(
            $this->_sCode, 
            $this->_sName, 
            $this->_sSubPath
        ) = $aCode;

        $this->_iMix = 0;
        if(is_array($this->_sCode))
            list($this->_sCode, $this->_iMix) = $this->_sCode;

        $this->addLocation('studio', $this->_sRootPath, $this->_sRootUrl);
        $this->addLocationJs('system_admin_js', $this->_sRootPath . 'js/' , $this->_sRootUrl . 'js/');
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
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolStudioTemplate();
            $GLOBALS['bxDolClasses'][__CLASS__]->init();
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function init()
    {
        parent::init();

        //--- Add default CSS in output
        $this->addCssSystem(array(
            'common.less',
            'default.less',
            'general.css',
            'menu.css',
        ));

        bx_import('BxTemplStudioConfig');
        $this->_oTemplateConfig = BxTemplStudioConfig::getInstance();

        bx_import('BxTemplStudioFunctions');
        $this->_oTemplateFunctions = BxTemplStudioFunctions::getInstance($this);
    }

    function _getAbsoluteLocation($sType, $sFolder, $sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
    	return parent::_getAbsoluteLocation($sType, $sFolder, $sName, BX_DOL_TEMPLATE_CHECK_IN_BASE);
    }

    function parseSystemKey($sKey, $mixedKeyWrapperHtml = null, $bProcessInjection = true)
    {
        $sRet = '';
        switch( $sKey ) {
            case 'version':
                $sRet = bx_get_ver();
                break;
            case 'page_breadcrumb':
                $sRet = $this->getPageBreadcrumb();
                break;
			case 'popup_loading':
                $s = $this->parsePageByName('popup_loading.html', array());
                $sRet = BxTemplFunctions::getInstance()->transBox('bx-popup-loading', $s, true);
                break;
            case 'dol_images':
                $sRet = $this->_processJsImages();
                break;
            case 'dol_lang':
                $sRet = $this->_processJsTranslations();
                break;
            case 'dol_options':
                $sRet = $this->_processJsOptions();
                break;
            case 'menu_top':
                $sRet = BxTemplStudioMenuTop::getInstance()->getCode();
                break;
            case 'copyright':
                $sRet = _t( '_copyright',   date('Y') ) . getVersionComment();
                break;
            case 'class_name':
                $sRet = 'bx-dir-' . strtolower(bx_lang_direction());
                break;
            default:
                $sRet = parent::parseSystemKey($sKey, $mixedKeyWrapperHtml, false);
        }

        return $this->processInjection($this->getPageNameIndex(), $sKey, $sRet);
    }

    function setPageBreadcrumb($aItems)
    {
        $this->aPage['breadcrumb'] = $aItems;
    }

    function getPageBreadcrumb()
    {
        if(empty($this->aPage['breadcrumb']) || !is_array($this->aPage['breadcrumb']))
           return "";

        $aItems = array();
        foreach($this->aPage['breadcrumb'] as $aItem) {
            $bLink = isset($aItem['link']) && $aItem['link'] != '';

            $aItems[] = array(
                'bx_if:show_link' => array(
                    'condition' => $bLink,
                    'content' => array(
                        'link' => $bLink ? $aItem['link'] : '',
                        'title' => _t($aItem['title'])
                    )
                ),
                'bx_if:show_text' => array(
                    'condition' => !$bLink,
                    'content' => array(
                        'title' => _t($aItem['title'])
                    )
                )
            );
        }

        return $this->parseHtmlByName('breadcrumb.html', array('bx_repeat:items' => $aItems));
    }

    function displayMsg ($mixed, $bTranslate = false, $iPage = BX_PAGE_DEFAULT, $iDesignBox = BX_DB_CONTENT_ONLY)
    {
        $iCode = 200;
        $sMessage = '';
        if(is_array($mixed))
            list($iCode, $sMessage) = $mixed;
        else
            $sMessage = $mixed;

        switch($iCode) {
            case 403:
                header('HTTP/1.0 403 Forbidden');
                header('Status: 403 Forbidden');
                break;

            case 404:
                header('HTTP/1.0 404 Not Found');
                header('Status: 404 Not Found');
                break;
        }
        
        $sTitle = $bTranslate ? _t($sMessage) : $sMessage;
        $sContent = $this->parseHtmlByName('page_not_found.html', [
            'content' => DesignBoxContent('', MsgBox($sTitle), $iDesignBox)
        ]);

        $this->setPageNameIndex($iPage);
        $this->setPageHeader($sTitle);
        $this->setPageContent('page_main_code', $sContent);
        $this->getPageCode();
        exit;
    }
    
    function displayPage(&$oPage)
    {
        if(($mixedResult = $oPage->checkAction()) !== false)
            return echoJson($mixedResult);

        $sPageMenu = $oPage->getPageMenu();
        $sPageCode = $oPage->getPageCode();
        if($sPageCode === false)
            $this->displayMsg(($sError = $oPage->getError(false)) !== false ? $sError : '_sys_txt_error_occured', true, BX_PAGE_DEFAULT, BX_DB_PADDING_NO_CAPTION);

        $this->setPageNameIndex($oPage->getPageIndex());
        $this->setPageHeader($oPage->getPageHeader());
        $this->setPageContent('page_caption_code', $oPage->getPageCaption());
        $this->setPageContent('page_attributes', $oPage->getPageAttributes());
        $this->setPageContent('page_menu_code', $sPageMenu);
        $this->setPageContent('page_main_code', $sPageCode);
        $this->addCss($oPage->getPageCss());
        $this->addJs($oPage->getPageJs());
        $this->getPageCode();
    }
}

/** @} */
