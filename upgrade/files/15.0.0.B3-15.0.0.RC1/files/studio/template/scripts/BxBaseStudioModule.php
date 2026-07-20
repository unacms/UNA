<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioModule extends BxDolStudioModule
{
    protected $oHelper;

    protected $aMenuItems = array(
        BX_DOL_STUDIO_MOD_TYPE_SETTINGS => array('name' => BX_DOL_STUDIO_MOD_TYPE_SETTINGS, 'icon' => 'cogs', 'title' => '_adm_lmi_cpt_settings')
    );

    protected $sTmplNamePopupSettings;
    protected $sTmplNamePopupConfirmUninstall;

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->oHelper = BxTemplStudioModules::getInstance();

        $this->sTmplNamePopupSettings = 'mod_popup_settings.html';
        $this->sTmplNamePopupConfirmUninstall = 'mod_popup_confirm_uninstall.html';
    }

    function getPageCss()
    {
        return array_merge(parent::getPageCss(), $this->oHelper->getCss());
    }

    function getPageJs()
    {
        return array_merge(parent::getPageJs(), $this->oHelper->getJs());
    }

    function getPageJsClass()
    {
        return $this->oHelper->getJsClass();
    }

    function getPageJsObject()
    {
        return $this->oHelper->getJsObject();
    }

    function getPageJsCode($aParams = array(), $mixedWrap = true)
    {
        return $this->oHelper->getJsCode($aParams, $mixedWrap);
    }

    function getPageCaption()
    {
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('mod_page_caption.html', array(
            'js_object' => $this->getPageJsObject(),
            'content' => parent::getPageCaption(),
            'js_code' => $this->getPageJsCode()
        ));
    }

    function getPageAttributes()
    {
        if($this->_bShowHeaderBreadcrumb && (int)$this->aModule['enabled'] == 0)
            return 'style="display:none"';

        return parent::getPageAttributes();
    }

    function getPageMenu($aMenu = array(), $aMarkers = array())
    {
        $sJsObject = $this->getPageJsObject();

        $aMenu = [];
        if((int)$this->aModule['enabled'] != 0)
            foreach($this->aMenuItems as $sName => $aItem)
                $aMenu[] = array_merge($aItem, [
                    'name' => $sName,
                    'link' => isset($aItem['link'])  ? $aItem['link'] : bx_append_url_params($this->sManageUrl, ['page' => $sName]),
                    'title' => _t(!empty($aItem['title']) ? $aItem['title'] : $aItem['caption']),
                    'selected' => $sName == $this->sPage
                ]);

        return parent::getPageMenu($aMenu);
    }

    public function getPageCode($sPage = '', $bWrap = true)
    {
        if((int)$this->aModule['enabled'] == 0)
            return '';

        return parent::getPageCode($sPage, $bWrap);
    }

    protected function getSettings()
    {
        $oOptions = new BxTemplStudioOptions($this->sModule);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('module.html', array(
            'content' => $oOptions->getCode(),
        ));
    }

    protected function getPopupSettings($sPage, $iWidgetId)
    {
        $sActions = $this->getPageActions($iWidgetId);
        if(empty($sActions))
            return '';

        $sPrefix = 'bx-std-mod-popup-settings';
        $sName = $sPrefix . '-' . $sPage;
        $sContent = BxDolStudioTemplate::getInstance()->parseHtmlByName($this->sTmplNamePopupSettings, array(
            'content' => $sActions
        ));

        return BxTemplStudioFunctions::getInstance()->transBox($sName, array(
            'wrapper_class' => $sPrefix . '-wrapper',
            'content' => $sContent
        ));
    }

    protected function getPopupConfirmUninstall($iWidgetId, &$aModule)
    {
        $sJsObject = $this->getPageJsObject();

        $sName = 'bx-std-mod-popup-confirm';
        $sContent = BxDolStudioTemplate::getInstance()->parseHtmlByName($this->sTmplNamePopupConfirmUninstall, array(
            'content' => _t('_adm_' . $this->sLangPrefix . '_cnf_uninstall', $aModule['title']),
            'click' => $sJsObject . ".uninstall('" . $aModule['name'] . "', " . $iWidgetId . ", 1)"
        ));

        return BxTemplStudioFunctions::getInstance()->transBox($sName, $sContent);
    }
}

/** @} */
