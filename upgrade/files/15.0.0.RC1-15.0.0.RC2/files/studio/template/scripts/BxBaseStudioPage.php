<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioPage extends BxDolStudioPage
{
    protected $aPageCss;
    protected $aPageJs;
    protected $sPageJsClass;
    protected $sPageJsObject;

    function __construct($mixedPageName)
    {
        parent::__construct($mixedPageName);

        $this->aPageCss = [
            'page.css', 
            'page-media-tablet.css', 
            'page-media-desktop.css', 
            'page_columns.css',
            'menu_top.css'
        ];

        $this->aPageJs = [
            'jquery.anim.js', 
            'jquery.jfeed.pack.js', 
            'jquery.dolRSSFeed.js', 
            'page.js'
        ];

        $this->sPageJsClass = 'BxDolStudioPage';
        $this->sPageJsObject = 'oBxDolStudioPage';
    }

    public function getPageIndex()
    {
        if(!is_array($this->aPage) || empty($this->aPage))
            return BX_PAGE_DEFAULT;

        if(!$this->bPageMultiple)
            return !empty($this->aPage['index']) ? (int)$this->aPage['index'] : BX_PAGE_DEFAULT;
        else
            return !empty($this->aPage[$this->sPageSelected]['index']) ? (int)$this->aPage[$this->sPageSelected]['index'] : BX_PAGE_DEFAULT;

        $this->aMarkers = array_merge($this->aMarkers, array(
            'js_object' => $this->getPageJsObject(),
        ));
    }

    public function getPageJs()
    {
        return $this->aPageJs;
    }

    public function getPageJsClass()
    {
        return $this->sPageJsClass;
    }

    public function getPageJsObject()
    {
        return $this->sPageJsObject;
    }

    public function getPageJsCode($aOptions = array(), $bWrap = true)
    {
        $sJsClass = $this->getPageJsClass();
        $sJsObject = $this->getPageJsObject();
        if(empty($sJsClass) || empty($sJsObject))
            return '';

        $sOptions = '{}';
        if(!empty($aOptions))
            $sOptions = json_encode($aOptions);

        $sContent = 'var ' . $sJsObject . ' = new ' . $sJsClass . '(' . $sOptions . ');';
        if($bWrap)
            $sContent = BxDolStudioTemplate::getInstance()->_wrapInTagJsCode($sContent);

        return $sContent;
    }

    public function getPageCss()
    {
        return $this->aPageCss;
    }

    public function getPageHeader()
    {
        if(empty($this->aPage) || !is_array($this->aPage))
            return '';

        return _t(!$this->bPageMultiple ? $this->aPage['caption'] : $this->aPage[$this->sPageSelected]['caption']);
    }

    /**
     * The page's meta description: the page's own text (_adm_page_dsc_<name>, {0} = site title) when it has one, the generic
     * Studio wording with the page caption otherwise (app pages). Read by search engines and offered by screen readers.
     */
    public function getPageDescription()
    {
        if(empty($this->aPage) || !is_array($this->aPage))
            return '';

        $aPage = !$this->bPageMultiple ? $this->aPage : $this->aPage[$this->sPageSelected];
        $sSiteTitle = getParam('site_title');

        $sKey = '_adm_page_dsc_' . $aPage['name'];
        $sDescription = _t($sKey, $sSiteTitle);
        if($sDescription == $sKey)
            $sDescription = _t('_adm_page_dsc_default', _t($aPage['caption']), $sSiteTitle);

        return strip_tags($sDescription);
    }

    /*
     * Left area in in page header. Contains 'home' button, page caption and search.
     */
    public function getPageBreadcrumb()
    {
        $bPageHome = $this->aPage['name'] == 'home';
        $bWidgetType = !empty($this->aPage['wid_type']);

        $aMarkers = array('js_object_launcher' => BxTemplStudioLauncher::getInstance()->getPageJsObject());
        if($bWidgetType)
            $aMarkers['widget_type'] = $this->aPage['wid_type'];

        $this->addMarkers($aMarkers);

        $aMenuItems = [];
        $aMenuItems['home'] = [
            'name' => 'home',
            'icon' => 'tmi-launcher.svg',
            'link' => BX_DOL_URL_STUDIO,
            //'onclick' => bx_replace_markers('return {js_object_launcher}.browser(this)', $this->aMarkers),
            'title' => '',
            'area_label' => '_adm_page_cpt_home'
        ];

        /**
         * Hidden for now.
         */
        if(false && $bWidgetType)
            $aMenuItems['type'] = [
                'name' => 'type',
                'icon' => $this->getPageTypeIcon(),
                'link' => $this->getPageTypeUrl(),
                'onclick' => bx_replace_markers("return {js_object_launcher}.browser(this, '{widget_type}')", $this->aMarkers),
                'title' => ''
            ];

        $bShowSearch = $bPageHome && getParam('sys_std_show_header_left_search') == 'on';

        // On the launcher the launcher button stays, and the search field takes the page item's place after the separator, its
        // glyph exactly where an app's icon sits on app pages (the page heading moves into the search block for assistive tech).
        // The app item is also the trigger of the page's context menu (right-click, Menu key, long press), when it has actions.
        if(!$bShowSearch)
            // the app's own launcher icon next to its title, as an image (not inlined: the tile art carries gradients)
            $aMenuItems['page'] = [
                'name' => 'page',
                'icon' => !empty($this->aPage['wid_icon']) ? $this->aPage['wid_icon'] : '',
                'icon_inline' => false,
                'link' => $this->getPageUrl(),
                'title' => _t($this->aPage['caption']),
                'attrs_add' => getParam('sys_std_show_header_left') == 'on' ? $this->getPageCaptionActions() : ''
            ];

        $oMenu = new BxTemplStudioMenu([
            'template' => 'page_breadcrumb.html',
            'menu_items' => $aMenuItems
        ]);
        $sMenu = $oMenu->getCode();

        return BxDolStudioTemplate::getInstance()->parseHtmlByContent($sMenu, [
            'bx_if:show_search' => [
                'condition' => $bShowSearch,
                'content' => [
                    'title' => _t($this->aPage['caption'])
                ]
            ]
        ]); 
    }

    public function getPageCaption()
    {
        if(($sAssistant = $this->getPageCaptionAssistant()) != '') {
            $sAssistant = BxTemplStudioFunctions::getInstance()->popupBox('bx-std-pcap-menu-popup-assistant', _t('_adm_txt_assistant_popup_title'), $sAssistant, true);

            BxDolStudioTemplate::getInstance()->addInjection('injection_header', 'text', $sAssistant);
        }

        return '';
    }

    public function getPageAttributes()
    {
        return '';
    }

    public function getPageMenu($aMenu = [], $aMarkers = [])
    {
        if($aMenu === false)
            return '';

        foreach($aMenu as $aItem)
            if(($aItem['selected'] ?? false))
                $this->aPage['subcaption'] = $aItem['title'] ?? '';

        return $this->getPageMenuObject($aMenu, $aMarkers)->getCode();
    }

    public function getPageCode($sPage = '', $bWrap = true) {
        if(empty($this->aPage) || !is_array($this->aPage)) {
            $this->setError([404, '_sys_request_page_not_found_cpt']);
            return false;
        }

        return '';
    }

    protected function getPageMenuObject($aMenu = array(), $aMarkers = array())
    {
        $oMenu = new BxTemplStudioMenu(array('template' => 'menu_side.html', 'menu_items' => $aMenu));
        if(!empty($aMarkers))
            $oMenu->addMarkers($aMarkers);

        return $oMenu;
    }

    /**
     * The page's actions live in a context menu (studio/js/context_menu.js): this puts the menu popup into the header and
     * returns the attributes that make an element its trigger, or '' when the page has no actions.
     */
    protected function getPageCaptionActions()
    {
        $sMenu = $this->getPageContextMenu();
        if(empty($sMenu))
            return '';

        $sId = 'bx-std-pmenu-popup-actions';
        BxDolStudioTemplate::getInstance()->addInjection('injection_header', 'text', BxTemplStudioFunctions::getInstance()->transBox($sId, [
            'wrapper_class' => 'bx-std-context-wrapper',
            'wrapper_role' => 'presentation', // the [role="menu"] inside is the thing
            'content' => $sMenu
        ], true));

        return 'data-bx-context-menu="#' . $sId . '"';
    }

    protected function getPageContextMenu($iWidgetId = 0)
    {
        return '';
    }

    protected function getPageCaptionHelp()
    {
    	$sContent = BxDolRss::getObjectInstance($this->sPageRssHelpObject)->getHolder($this->sPageRssHelpId, $this->iPageRssHelpLength, 0, false);

        $oTemplate = BxDolStudioTemplate::getInstance();
    	$oTemplate->addJsTranslation('_adm_txt_show_help_content_empty');
        return $oTemplate->parseHtmlByName('page_caption_help.html', array(
            'content' => $sContent
        ));
    }

    protected function getPageCaptionAssistant()
    {
        if(!$this->_bShowHeaderRightAssistant)
            return '';

        //TODO: Use new Manual agent here.
        $sContent = '';

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('page_caption_assistant.html', [
            'content' => $sContent
        ]);
    }

    protected function getPageActions($iWidgetId = 0)
    {
        return '';
    }

    protected function getJsResult($sMessage, $bTranslate = true, $bRedirect = false, $sRedirect = '', $sOnResult = '')
    {
        return bx_get_js_result(array(
            'message' => $sMessage,
            'translate' => $bTranslate,
            'redirect' => $bRedirect === true && !empty($sRedirect) ? $sRedirect : $bRedirect,
            'eval' => $sOnResult
        ));
    }

    protected function getJsResultBy($aParams)
    {
        return bx_get_js_result($aParams);
    }
}

/** @} */
