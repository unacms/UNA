<?php defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 */

class BxDolInstallView
{
    protected $_sDirPlugins = BX_INSTALL_DIR_PLUGINS;
    protected $_sDirTemplates = BX_INSTALL_DIR_TEMPLATES;

    protected $_sUrlCss = '../template/css/';
    protected $_sPathCss = '../template/css/';
    protected $_sUrlJs = '../';

    protected $_aToolbarItem = array();

    protected $_aFilesCss = array (
        '../../plugins_public/tailwind/css/tailwind.min.css',
        'common.css',
        'default.less',
        'general.css',
        'icons.css',
        'colors.css',
        'forms.css',
        'menu.css',
        'media-desktop.css',
        'media-tablet.css',
        'media-phone.css',
        'media-print.css',
    );

    protected $_aFilesJs = array (
        'plugins_public/jquery/jquery.min.js',
        'plugins_public/jquery-ui/jquery-ui.min.js',
        'inc/js/jquery.dolPopup.js',
        'inc/js/jquery.webForms.js',
    );

    function __construct()
    {
    }

    function out ($sTemplate, $aVars = array())
    {
        extract($aVars);
        include($this->_sDirTemplates . $sTemplate);
    }

    function pageStart ()
    {
        ob_start();
    }

    function pageEnd ($sTitle)
    {
        $oLang = BxDolInstallLang::getInstance();
        $aLangs = $oLang->getAvailableLanguages();
        $sLang = $oLang->getLang();
        $sLangTitle = (isset($aLangs[$sLang]) && !empty($aLangs[$sLang]['title'])) ? $aLangs[$sLang]['title'] : $sLang;

        $aToolbarItem = $this->_aToolbarItem;
        $sInlineCSS = $this->_getInlineCSS();
        $sFilesCSS = $this->_getFilesCSS();
        $sFilesJS = $this->_getFilesJS();
        $sCode = ob_get_clean();
        include($this->_sDirTemplates . '_page.php');
    }

    function setToolbarItem($sIcon, $sLink, $sTitle = '', $sTarget = '')
    {
        $this->_aToolbarItem = array(
            'icon' => $sIcon,
            'link' => $sLink,
            'title' => $sTitle,
            'target' => $sTarget,
        );
    }

    protected function _getFilesCSS()
    {
        $s = '';
        foreach ($this->_aFilesCss as $sFile)
            if (substr($sFile, -4) === '.css')
                $s .= '<link rel="stylesheet" href="' . $this->_sUrlCss . $sFile . '" />' . "\n";
        return $s;
    }

    protected function _getFilesJS()
    {
        $s = '';
        foreach ($this->_aFilesJs as $sFile)
            $s .= '<script src="' . $this->_sUrlJs . $sFile . '"></script>';
        return $s;
    }

    protected function _getInlineCSS()
    {
        $oLessParser = new Less_Parser();

        $oConfigBase = new BxBaseConfig();
        $oLessParser->ModifyVars($oConfigBase->aLessConfig);

        foreach ($this->_aFilesCss as $sFile) {
            if (substr($sFile, -5) !== '.less')
                continue;

            $oLessParser->parseFile($this->_sPathCss . $sFile, $this->_sUrlCss);
        }
        return $oLessParser->getCss();
    }
}

/** @} */
