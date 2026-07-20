<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioWidget extends BxDolStudioWidget
{
    protected $bPageMenuTitle;
    protected $bPageMenuIconsInline;

    protected $aPageCodeNoWrap;

    public function __construct($mixedPageName)
    {
        parent::__construct($mixedPageName);

        $this->bPageMenuTitle = !$this->_bShowHeaderBreadcrumb;
        $this->bPageMenuIconsInline = true;

        $this->aPageCodeNoWrap = [];
    }

    public function getPageCss()
    {
        return array_merge(parent::getPageCss(), array(
            'launcher.css'
        ));
    }

    public function getPageJs()
    {
        return array_merge(parent::getPageJs(), array(
            'launcher.js'
        ));
    }

    public function getPageCaption()
    {
        if(empty($this->aPage) || !is_array($this->aPage))
            return '';

        $sResult = parent::getPageCaption();

        $this->updateHistory();

        $oTemplate = BxDolStudioTemplate::getInstance();
        $oFunctions = BxTemplStudioFunctions::getInstance();

        $sActions = '';
        $bActions = false;
        if(false && ($sActions = $this->getPageCaptionActions()) && ($bActions = strlen($sActions)) > 0)    //--- Hidden for now.
            $sActions = $oFunctions->transBox('bx-std-pcap-menu-popup-actions', $sActions, true);

        $sHelp = '';
        $bHelp = false;
        if(false && ($sHelp = $this->getPageCaptionHelp()) && ($bHelp = strlen($sHelp)) > 0)    //--- Hidden for now.
            $sHelp = $oFunctions->transBox('bx-std-pcap-menu-popup-help', $sHelp, true);

        if($bActions || $bHelp)
            $oTemplate->addInjection('injection_header', 'text', $sActions . $sHelp);

        //--- Menu Right ---//
        $aItemsRight = [];

        if($bHelp)
            $aItemsRight['help'] = [
                'name' => 'help',
                'icon' => 'tmi-help.svg',
                'onclick' => BX_DOL_STUDIO_PAGE_JS_OBJECT . ".togglePopup('help', this)",
                'title' => '_adm_txt_show_help'
            ];
        
        if($this->_bShowHeaderRightAssistant)
            $aItemsRight['assistant'] = [
                'name' => 'assistant',
                'icon' => 'tmi-assistant.svg',
                'link' => 'javascript:void(0);',
                'onclick' => BX_DOL_STUDIO_PAGE_JS_OBJECT . ".togglePopup('assistant', this)",
                'title' => '_adm_tmi_cpt_assistant'
            ];

        if($bActions)
            $aItemsRight['actions'] = [
                'name' => 'actions',
                'icon' => 'tmi-actions.svg',
                'onclick' => BX_DOL_STUDIO_PAGE_JS_OBJECT . ".togglePopup('actions', this)",
                'title' => '_adm_txt_show_actions'
            ];

        if($this->_bShowHeaderRightSite)
            $aItemsRight['site'] = [
                'name' => 'site',
                'icon' => 'tmi-site.svg',
                'link' => '{url_root}',
                'title' => '_adm_tmi_cpt_site'
            ];

        $aItemsRight['account'] = [
            'name' => 'account',
            'icon' => 'tmi-account.svg',
            'link' => 'javascript:void(0);',
            'onclick' => 'bx_menu_popup_inline(\'#bx-std-pcap-menu-popup-account\', this);',
            'title' => '_adm_tmi_cpt_account'
        ];

        $oTopMenu = BxTemplStudioMenuTop::getInstance();
        $oTopMenu->setPageName($this->aPage['name']);
        $oTopMenu->setContent(BX_DOL_STUDIO_MT_LEFT, $this->getPageBreadcrumb());
        $oTopMenu->setSelected(BX_DOL_STUDIO_MT_CENTER, $this->aPage['name']);
        $oTopMenu->setContent(BX_DOL_STUDIO_MT_RIGHT, array(
            'template' => 'menu_top_toolbar.html', 
            'menu_items' => $aItemsRight
        ));

        return $sResult;
    }

    public function getPageMenu($aMenu = [], $aMarkers = [])
    {
        if(!$this->bPageMenuTitle && $aMenu === false)
            return '';

        $sActions = $this->bPageMenuTitle ? $this->getPageCaptionActions() : '';           

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('page_menu.html', [
            'bx_if:show_title' => [
                'condition' => $this->bPageMenuTitle,
                'content' => [
                    'title' => _t($this->aPage['caption']),
                    'bx_if:show_actions' => [
                        'condition' => (bool)$sActions,
                        'content' => [
                            'onclick' => $sActions,
                        ]
                    ],
                ]
            ],
            'menu' => parent::getPageMenu($aMenu, $aMarkers)
        ]);
    }

    public function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;
 
        if(!empty($this->aPage['wid_type']) && !BxDolStudioRolesUtils::getInstance()->isActionAllowed('use ' . $this->aPage['wid_type'])) {
            $this->setError('_Access denied');
            return false;
        }

        if(empty($sPage))
            $sPage = $this->sPage;

        $sMethod = 'get' . bx_gen_method_name($sPage);
        if(method_exists($this, $sMethod)) {
            $mixedContent = $this->$sMethod();
            if(!$bWrap || in_array($sPage, $this->aPageCodeNoWrap))
                $sResult .= $mixedContent;
            else if(is_string($mixedContent))
                $sResult .= $this->getBlockCode([
                    'content' => $mixedContent
                ]);
            else if(is_array($mixedContent)) {
                if(isset($mixedContent['content']))
                    $sResult .= $this->getBlockCode($mixedContent);
                else
                    foreach($mixedContent as $sBlock)
                        $sResult .= $this->getBlockCode([
                            'content' => $sBlock
                        ]);
            }
            else if(is_a($mixedContent, 'BxDolPage'))
                $sResult .= $mixedContent->getCode();
        }

        return $sResult . BxTemplStudioLauncher::getInstance()->getPageJsCode(array(
            'bInit' => false
        ));
    }
    

    /**
     * Block related methods
     */
    public function getBlocksLine($aBlocks)
    {
        $aTmplVarsBlocks = array();
        foreach ($aBlocks as $aBlock) {
            $aTmplVarsBlocks[] = array(
                'content' => $this->getBlockCode($aBlock)
            ); 
        }

    	return BxDolStudioTemplate::getInstance()->parseHtmlByName('page_blocks_line.html', array(
    	    'count' => count($aTmplVarsBlocks),
            'bx_repeat:blocks' => $aTmplVarsBlocks
    	));
    }
    public function getBlockCode($aBlock)
    {
        $aTypeI2S = [
            BX_DB_CONTENT_ONLY => 'cnt',
            BX_DB_DEF => 'cnt-ttl-bg',
            BX_DB_NO_CAPTION => 'cnt-bg'
        ];

        $iType = isset($aBlock['type'], $aTypeI2S[$aBlock['type']]) ? $aBlock['type'] : BX_DB_DEF;

        $sContent = '';
        if(!empty($aBlock['content']))
            $sContent = $aBlock['content'];
        else if(!empty($aBlock['items']))
            $sContent = $aBlock['items'];

    	return BxDolStudioTemplate::getInstance()->parseHtmlByName('page_block.html', array(
            'type' => $aTypeI2S[$iType],
            'caption' => !in_array($iType, [BX_DB_CONTENT_ONLY, BX_DB_NO_CAPTION]) ? $this->getBlockCaption($aBlock) : '',
            'panel_top' => $this->getBlockPanelTop($aBlock),
            'items' => $sContent,
            'panel_bottom' => $this->getBlockPanelBottom($aBlock)
    	));
    }

    public function getBlockCaption($aBlock)
    {
        if(($sK = 'caption') && empty($aBlock[$sK])) {
            if(($sPageCaption = $this->aPage['subcaption'] ?? false))
                $aBlock[$sK] = $sPageCaption;
            else if(($sPageCaption = $this->aPage['caption'] ?? false)) {
                $_sPageCaption = _t($sPageCaption);
                if(strcmp($sPageCaption, $_sPageCaption) !== 0)
                    $aBlock[$sK] = $_sPageCaption;
            }
        }

        if(empty($aBlock) || !is_array($aBlock) || (empty($aBlock['caption']) && empty($aBlock['actions'])))
            return '';
        
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aTmplActions = array();
        if(!empty($aBlock['actions']) && is_array($aBlock['actions']))
            foreach($aBlock['actions'] as $aAction) {
                $aTmplVarsIcon = $aTmplVarsIconUrl = $aTmplVarsIconHtml = [];
                if(($sIcon = $aAction['icon'] ?? false)) {
                    list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $oTemplate->getTemplateFunctions()->getIcon($sIcon);
                    
                    if($sIcon)
                        $aTmplVarsIcon = [
                            'icon' => BxDolIconset::getObjectInstance()->getIcon($sIcon)
                        ];
                    else if($sIconUrl)
                        $aTmplVarsIconUrl = [
                            'icon_url' => $sIconUrl,
                        ];
                    else if($sIconHtml)
                        $aTmplVarsIconHtml = [
                            'icon_html' => $sIconHtml
                        ];
                }

                $sCaption = is_array($aAction['caption']) ? call_user_func_array('_t', $aAction['caption']) : _t($aAction['caption']);
                $bTitleOnly = $aAction['title_only'] ?? false;

                $bOnClick = !empty($aAction['onclick']);
                $aOnClick = $bOnClick ? array('onclick' => $aAction['onclick']) : array();

                $aTmplActions[] = [
                    'name' => $aAction['name'],
                    'url' => $aAction['url'],
                    'title' => bx_html_attribute($sCaption),
                    'bx_if:show_onclick' => [
                        'condition' => $bOnClick,
                        'content' => $aOnClick
                    ],
                    'bx_if:show_bc_icon' => [
                        'condition' => !empty($aTmplVarsIcon),
                        'content' => $aTmplVarsIcon
                    ],
                    'bx_if:show_bc_icon_url' => [
                        'condition' => !empty($aTmplVarsIconUrl),
                        'content' => $aTmplVarsIconUrl
                    ],
                    'bx_if:show_bc_icon_html' => [
                        'condition' => !empty($aTmplVarsIconHtml),
                        'content' => $aTmplVarsIconHtml
                    ],
                    'bx_if:show_bc_text' => [
                        'condition' => (bool)$sCaption && !$bTitleOnly,
                        'content' => [
                            'caption' => $sCaption
                        ]
                    ],
                    
                ];
            }

        return $oTemplate->parseHtmlByName('block_caption.html', [
            'caption' => is_array($aBlock['caption']) ? call_user_func_array('_t', $aBlock['caption']) : _t($aBlock['caption']),
            'bx_if:show_actions' => [
                'condition' => !empty($aTmplActions),
                'content' => [
                    'bx_repeat:actions' => $aTmplActions
                ]
            ],
        ]);
    }

    public function getBlockPanelTop($aBlock)
    {
        if(empty($aBlock) || !is_array($aBlock) || empty($aBlock['panel_top']))
            return '';

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('block_panel_top.html', array(
            'content' => $aBlock['panel_top']
        ));
    }

    public function getBlockPanelBottom($aBlock)
    {
        if(empty($aBlock) || !is_array($aBlock) || empty($aBlock['panel_bottom']))
            return '';

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('block_panel_bottom.html', array(
            'content' => $aBlock['panel_bottom']
        ));
    }


    /**
     * Internal methods.
     */
    protected function getPageActions($iWidgetId = 0)
    {
        if(empty($this->aActions))
            return "";

        $aMarkers = array(
            'widget_id' => $iWidgetId,
        );

        if(!empty($iWidgetId)) {
            $aWidget = BxDolStudioWidgetsQuery::getInstance()->getWidgets(array('type' => 'by_id', 'value' => $iWidgetId));
            if(!empty($aWidget) && is_array($aWidget))
                $aMarkers['widget_type'] = $aWidget['type'];            
        }

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-page-actions',
                'name' => 'adm-page-actions',
                'action' => '',
                'method' => 'post',
            ),
            'params' => array(),
            'inputs' => array()
        );

        foreach($this->aActions as $aAction) {
            if($aAction['name'] == 'rearrange' && (empty($iWidgetId) || getParam('sys_std_show_launcher_left') != 'on'))
                continue;

            $aInput = array(
                'type' => $aAction['type'],
                'name' => $aAction['name'],
                'caption' => _t($aAction['caption'])
            );

            switch($aAction['type']) {
                case 'switcher':
                    $aInput['checked'] = $aAction['checked'];
                    $aInput['attrs']['onchange'] = bx_replace_markers($aAction['onchange'], $aMarkers);
                    break;

                case 'select':
                    $aInput['value'] = bx_replace_markers($aAction['value'], $aMarkers);
                    $aInput['values'] = $aAction['values'];
                    $aInput['attrs']['onchange'] = bx_replace_markers($aAction['onchange'], $aMarkers);
                    break;
            }

            $aForm['inputs'][$aInput['name']] = $aInput;
        }

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getPageMenuObject($aMenu = array(), $aMarkers = array())
    {
        $oMenu = parent::getPageMenuObject($aMenu, $aMarkers);
        $oMenu->setInlineIcons($this->bPageMenuIconsInline);

        return $oMenu;
    }
}

/** @} */
