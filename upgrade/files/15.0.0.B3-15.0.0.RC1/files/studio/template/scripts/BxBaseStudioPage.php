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
            'icon' => 'bc-home.svg',
            'link' => BX_DOL_URL_STUDIO,
            //'onclick' => bx_replace_markers('return {js_object_launcher}.browser(this)', $this->aMarkers),
            'title' => ''
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

        $aMenuItems['page'] = [
            'name' => 'page',
            'icon' => '', //$this->aPage['icon'],
            'link' => $this->getPageUrl(),
            'title' => _t($this->aPage['caption'])
        ];

        $oMenu = new BxTemplStudioMenu([
            'template' => 'page_breadcrumb.html',
            'menu_items' => $aMenuItems
        ]);
        $sMenu = $oMenu->getCode();

        $sActions = getParam('sys_std_show_header_left') == 'on' ? $this->getPageCaptionActions() : '';

        return BxDolStudioTemplate::getInstance()->parseHtmlByContent($sMenu, [
            'bx_if:show_page_action' => [
                'condition' => (bool)$sActions,
                'content' => [
                    'onclick' => $sActions,
                ]
            ],
            'bx_if:show_search' => [
                'condition' => $bPageHome && getParam('sys_std_show_header_left_search') == 'on',
                'content' => [
                    'bx_if:show_active' => [
                        'condition' => false,
                        'content' => []
                    ]
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

    protected function getPageCaptionActions()
    {
        $sActions = $this->getPageActions();
        if(empty($sActions))
            return '';

        $oTemplate = BxDolStudioTemplate::getInstance(); 

        $sActions = $oTemplate->parseHtmlByName('page_caption_actions.html', [
            'content' => $sActions
        ]);

        $oTemplate->addInjection('injection_header', 'text', BxTemplStudioFunctions::getInstance()->transBox('bx-std-pmenu-popup-actions', $sActions, true));

        return BX_DOL_STUDIO_PAGE_JS_OBJECT . ".togglePopup('actions', this)";
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

        $oAssistant = BxDolAIAssistant::getObjectInstance($this->iPageAssistantId);
        if(!$oAssistant)
            return '';

        $oTemplate = BxDolStudioTemplate::getInstance();

        $sContent = $oAssistant->getAskChat($this->sPageAssistantChatName, $this->sPageAssistantChatDescription, '', $oTemplate);
        if(!$sContent)
            return '';

        return $oTemplate->parseHtmlByName('page_caption_assistant.html', [
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
