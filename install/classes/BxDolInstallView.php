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

    /**
     * Steps in the header, in order. The site configuration form shows three of them, a page each.
     */
    protected $_aSteps = array('server', 'database', 'site', 'apps', 'install', 'done');
    protected $_sStep = '';

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

        $aSteps = array();
        foreach ($this->_aSteps as $sStep)
            $aSteps[$sStep] = _t('_sys_inst_step_' . $sStep);
        $sStepCurrent = $this->_sStep;
        $iCurrent = array_search($sStepCurrent, $this->_aSteps);
        $aStepsDone = false === $iCurrent ? array() : array_slice($this->_aSteps, 0, $iCurrent);

        $sInlineCSS = $this->_getInlineCSS();
        $sFilesCSS = $this->_getFilesCSS();
        $sFilesJS = $this->_getFilesJS();
        $sCode = ob_get_clean();
        include($this->_sDirTemplates . '_page.php');
    }

    /**
     * The step of the header the page belongs to; none on the welcome page.
     */
    public function setStep($sStep)
    {
        $this->_sStep = $sStep;
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
