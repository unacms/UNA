<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioWidgets extends BxDolStudioWidgets
{
    public function __construct($mixedPageName)
    {
        parent::__construct($mixedPageName);
    }

    public function getPageMenu($aMenu = array(), $aMarkers = array())
    {
        $aTypes = parent::getPageTypes();

        $iAccountId = getLoggedId();
        $oUtils = BxDolStudioRolesUtils::getInstance();

        $aMenuItems = array();
        foreach($aTypes as $sName => $aType) {
            if(!$oUtils->isActionAllowed('use ' . $sName, $iAccountId))
                continue;

            $aTypeData = unserialize($aType['Data']);

            $aMenuItems[] = array(
                'name' => $sName,
                'title' => _t($aType['LKey']),
                'link' => bx_append_url_params($this->sPageUrl, array(
                    'type' => $sName
                )),
                'icon' => !empty($aTypeData['icon']) ? $aTypeData['icon'] : '',
                'selected' => $sName == $this->_sType
            );
        }

        return parent::getPageMenu($aMenuItems);
    }

    public function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;

        $aWidgetsParams = array(
            'featured' => $this->isFeatured(),
            'notices' => $this->aWidgetsNotices
        );

        if(!$this->bPageMultiple)
            return $this->wrapWidgets($this->aPage['name'], $this->getWidgets($this->aPage['name'], $this->aWidgets, $aWidgetsParams));

        $sContent = "";
        foreach($this->aWidgets as $sPage => $aWidgets)
            $sContent .= $this->wrapWidgets($sPage, $this->getWidgets($sPage, $aWidgets, $aWidgetsParams), $sPage != $this->sPageSelected);

        return $sContent;
    }

    public function getPageCaption()
    {
        if(empty($this->aPage) || !is_array($this->aPage))
            return '';

        $sResult = parent::getPageCaption();

        //--- Menu Right ---//
        $aItemsRight = array(
            'template' => 'menu_top_toolbar.html',
            'menu_items' => array(
                'tour' => array(
                    'name' => 'tour',
                    'icon' => 'tmi-help.svg',
                    'link' => 'javascript:void(0);',
                    'onclick' => 'glTour.start()',
                    'title' => '_adm_tmi_cpt_tour'
                ),
                'assistant' => array(
                    'name' => 'assistant',
                    'icon' => 'tmi-assistant.svg',
                    'link' => 'javascript:void(0);',
                    'onclick' => BX_DOL_STUDIO_PAGE_JS_OBJECT . ".togglePopup('assistant', this)",
                    'title' => '_adm_tmi_cpt_assistant'
                ),
                'site' => array(
                    'name' => 'site',
                    'icon' => 'tmi-site.svg',
                    'link' => '{url_root}',
                    'title' => '_adm_tmi_cpt_site'
                ),
                'account' => array(
                    'name' => 'account',
                    'icon' => 'tmi-account.svg',
                    'link' => 'javascript:void(0);',
                    'onclick' => 'bx_menu_popup_inline(\'#bx-std-pcap-menu-popup-account\', this);',
                    'title' => '_adm_tmi_cpt_account'
                )
            )
        );

        if($this->_sType != BX_DOL_STUDIO_WTYPE_DEFAULT || getParam('site_tour_studio') != 'on')
            unset($aItemsRight['menu_items']['tour']);

        if(!$this->_bShowHeaderRightAssistant)
            unset($aItemsRight['menu_items']['assistant']);

        if(!$this->_bShowHeaderRightSite)
            unset($aItemsRight['menu_items']['site']);

        $oTopMenu = BxTemplStudioMenuTop::getInstance();
        $oTopMenu->setPageName($this->aPage['name']);
        $oTopMenu->setContent(BX_DOL_STUDIO_MT_LEFT, $this->getPageBreadcrumb());
        $oTopMenu->setContent(BX_DOL_STUDIO_MT_RIGHT, $aItemsRight);

        return $sResult;
    }

    protected function wrapWidgets($sName, $sContent, $bHidden = false)
    {
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('widgets_page.html', array(
            'page' => $sName,
            'bx_if:page_hidden' => array(
                'condition' => $bHidden,
                'content' => array()
            ),
            'content' => $sContent
        ));
    }

    protected function getWidgets($sPage, $aWidgets, $aParams = array())
    {
        $oFunction = BxTemplStudioFunctions::getInstance();

        $aTmplVars = array();
        foreach($aWidgets as $aWidget) {
            $sWidget = $oFunction->getWidget($aWidget, $aParams);
            if(empty($sWidget))
                continue;

            $aTmplVars[] = array(
                'widget' => $sWidget,
            );
        }

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('widgets.html', array(
            'bx_repeat:widgets' => $aTmplVars
        ));
    }
}

/** @} */
