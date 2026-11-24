<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

bx_import('BxDolDesigns');

class BxTemplFunctions extends BxBaseFunctions
{
    protected $_sModule;

    public function __construct($oTemplate = null)
    {
        parent::__construct($oTemplate);

        $this->_sModule = 'bx_artificer';
    }

    /**
     * How each logo image loads: the attributes of its <img>.
     */
    const LOGO_LOADING = [
        'logo' => 'fetchpriority="high"',
        'mark' => '',
        'logo_dark' => 'loading="lazy"',
        'mark_dark' => 'loading="lazy"',
    ];

    public function getMainLogoDarkUrl()
    {
        return BxDolDesigns::getInstance()->getSiteLogoDarkUrl();
    }

    public function getMainLogoInline()
    {
        return BxDolDesigns::getInstance()->getSiteLogoParam('logo_inline');
    }

    public function getMainMarkDarkUrl()
    {
        return BxDolDesigns::getInstance()->getSiteMarkDarkUrl();
    }

    public function getMainMarkInline()
    {
        return BxDolDesigns::getInstance()->getSiteLogoParam('mark_inline');
    }

    public function getMainLogo($aParams = [])
    {
        $oModule = BxDolModule::getInstance($this->_sModule);
        $oDesigns = BxDolDesigns::getInstance();

        $sTitle = getParam('site_title');

        $sAlt = $oDesigns->getSiteLogoAlt();
        if(empty($sAlt) && !empty($sTitle))
            $sAlt = $sTitle;
        $sAltAttr = bx_html_attribute($sAlt, BX_ESCAPE_STR_QUOTE);

        $aTypes = ['logo' => 'Logo', 'logo_dark' => 'LogoDark', 'mark' => 'Mark', 'mark_dark' => 'MarkDark'];
        $aSources = $oDesigns->getSiteLogoSources(function($sFile) {
            return $this->_oTemplate->getImageUrl($sFile);
        });

        $aTmplVarsImages = [];
        $bLogo = $bLogoDark = $bMark = $bMarkDark = false;
        foreach($aTypes as $sType => $sTypeUc) {
            $aSource = $aSources[$sType];
            if(!in_array($aSource['source'], [BxDolDesigns::LOGO_SOURCE_TEMPLATE, BxDolDesigns::LOGO_SOURCE_SYSTEM, BxDolDesigns::LOGO_SOURCE_BUILTIN]))
                continue;

            $iLogoHeight = (int)$oDesigns->{'getSite' . $sTypeUc . 'Height'}();
            $sLogoHeight = $iLogoHeight > 0 ? 'height:' . round($iLogoHeight/16, 3) . 'rem;' : '';

            /**
             * Generic (SVG) images get the height only, the browser derives the width from the image's own aspect ratio.
             * Uploaded images use the dimensions from Designs settings.
             */
            $iLogoWidth = $aSource['source'] != BxDolDesigns::LOGO_SOURCE_BUILTIN ? (int)$oDesigns->{'getSite' . $sTypeUc . 'Width'}() : 0;
            $sLogoWidth = $iLogoWidth > 0 ? 'width:' . round($iLogoWidth/16, 3) . 'rem;' : '';

            // width/height attributes let the browser reserve the space before the image arrives
            $aSize = BxDolDesigns::getLogoSizeAttrs(
                $aSource['source'] == BxDolDesigns::LOGO_SOURCE_BUILTIN ? BxDolDesigns::getImageFileSize($this->_oTemplate->getImagePath(BxDolDesigns::$aLogoBuiltins[$sType])) : [],
                $iLogoWidth, $iLogoHeight
            );

            $aTmplVarsImages[$sType] = [
                'id' => 'bx-' . str_replace('_', '-', $sType),
                'src' => $aSource['url'],
                'alt' => $sAltAttr,
                'class' => '',
                'style' => $sLogoWidth . ' ' . $sLogoHeight . $aSize['style'],
                'size' => $aSize['attrs'],
                // The logo is among the first things painted, so it is fetched first. The mark is the logo of a
                // narrow screen, so it is not lazy. The dark ones are hidden in most modes: they load when shown.
                'loading' => self::LOGO_LOADING[$sType],
            ];

            ${'b' . $sTypeUc} = true;
        }

        $sLogoInline = $sLogoInlineClass = '';
        if($aSources['logo']['source'] == BxDolDesigns::LOGO_SOURCE_INLINE) {
            $sLogoInline = $aSources['logo']['code'];
            $bLogo = true;
        }

        $sMarkInline = $sMarkInlineClass = '';
        if($aSources['mark']['source'] == BxDolDesigns::LOGO_SOURCE_INLINE) {
            $sMarkInline = $aSources['mark']['code'];
            $bMark = true;
        }

        if($bLogo) {
            if($bLogoDark && !$bMark)
                $aTmplVarsImages['logo']['class'] = 'block dark:hidden';
            if(!$bLogoDark && $bMark) {
                $sLogoInlineClass = 'hidden lg:block';
                if(isset($aTmplVarsImages['logo']))
                    $aTmplVarsImages['logo']['class'] = $sLogoInlineClass;
            }
            if($bLogoDark && $bMark)
                $aTmplVarsImages['logo']['class'] = 'hidden dark:hidden lg:block'; 
        }

        if($bLogoDark) {
            $aTmplVarsImages['logo_dark']['class'] = 'hidden dark:block';

            if($bMark || $bMarkDark)
                $aTmplVarsImages['logo_dark']['class'] = 'hidden dark:lg:block';
        }

        if($bMark) {
            $sMarkInlineClass = 'block lg:hidden';
            if(isset($aTmplVarsImages['mark']))
                $aTmplVarsImages['mark']['class'] = $sMarkInlineClass;

            if($bMarkDark)
                $aTmplVarsImages['mark']['class'] = 'block dark:hidden lg:hidden';
        }

        if($bMarkDark) {
            $aTmplVarsImages['mark_dark']['class'] = 'hidden dark:block dark:lg:hidden';
        }


        $aAttrs = [
            'href' => BX_DOL_URL_ROOT, 
            'title' => $sAltAttr
        ];
        if(!empty($aParams['attrs']) && is_array($aParams['attrs']))
            $aAttrs = array_merge($aAttrs, $aParams['attrs']);

        $sTmplName = 'logo_main.html';
        $aTmplVars = [
            'attrs' => bx_convert_array2attrs($aAttrs),
            'bx_if:show_title' => [
                'condition' => !$bLogo && !$sLogoInline,
                'content' => [
                    'logo' => $sTitle,
                ]
            ],
            'bx_if:show_logo_inline' => [
                'condition' => !empty($sLogoInline),
                'content' => [
                    'class' => $sLogoInlineClass,
                    'height' => $oModule->_oConfig->getLogoHeight() . 'px',
                    'content' => $sLogoInline
                ]
            ],
            'bx_if:show_mark_inline' => [
                'condition' => !empty($sMarkInline),
                'content' => [
                    'class' => $sMarkInlineClass,
                    'height' => $oModule->_oConfig->getMarkHeight() . 'px',
                    'content' => $sMarkInline
                ]
            ]
        ];

        foreach($aTypes as $sType => $sTypeUc) {
            if(($sTypeIf = 'bx_if:show_' . $sType) && isset($aTmplVarsImages[$sType]))
                $aTmplVars[$sTypeIf] = [
                    'condition' => true,
                    'content' => $aTmplVarsImages[$sType]
                ];
            else 
                $aTmplVars[$sTypeIf] = [
                    'condition' => false,
                    'content' => []
                ];
        }

        bx_alert('system', 'get_logo', 0, 0, [
            'tmpl_name' => &$sTmplName,
            'tmpl_vars' => &$aTmplVars,
            'tmpl_name_ref' => &$sTmplName,
            'tmpl_vars_ref' => &$aTmplVars,
        ]);

        return $this->_oTemplate->parseHtmlByName($sTmplName, $aTmplVars);
    }

    /**
     * Designer's header for the page's layout, unless Artificer's settings set the width or the menu's place for
     * every layout.
     */
    public function getHeaderLayout()
    {
        $aResult = parent::getHeaderLayout();

        $oConfig = BxDolModule::getInstance($this->_sModule)->_oConfig;
        if(($sWidth = $oConfig->getHeaderWidth()) !== '')
            $aResult['width'] = $sWidth;
        if(($sAlign = $oConfig->getHeaderAlign()) !== '')
            $aResult['align'] = $sAlign;

        return $aResult;
    }

    /**
     * Designer's page width for the page's layout and audience, unless Artificer's Page width sets one for all.
     */
    public function getPageWidth()
    {
        $mixedWidth = BxDolModule::getInstance($this->_sModule)->_oConfig->getPageWidth();
        return $mixedWidth !== '' ? $mixedWidth : parent::getPageWidth();
    }

    public function TemplPageAddComponent($sKey)
    {
        $mixedResult = false;

        switch($sKey) {
            // The search window is on every page: a section's and a context's Search and Cmd/Ctrl+K open it. The
            // header search setting decides only whether the header's Search opens it or the results page.
            case 'sys_toolbar_search':
                $mixedResult = parent::TemplPageAddComponent($sKey);
                break;

            case 'sys_app_account':
                $mixedResult = $this->getApplicationAccount();
                break;

            case 'sys_app_context_switcher':
                $mixedResult = $this->getApplicationContextSwitcher();
                break;

            default:
                $mixedResult = parent::TemplPageAddComponent($sKey);
        }

        return $mixedResult;
    }

    /**
     * The Application layout's sidebar foot: the member's picture and name, opening the account menu.
     */
    public function getApplicationAccount()
    {
        if(!isLogged() || !($oProfile = BxDolProfile::getInstance()))
            return '';

        $sThumb = $oProfile->getThumb();

        return BxDolModule::getInstance($this->_sModule)->_oTemplate->parseHtmlByName('application_account.html', [
            'name' => bx_process_output($oProfile->getDisplayName()),
            'bx_if:image' => [
                'condition' => !empty($sThumb),
                'content' => ['thumb' => $sThumb],
            ],
        ]);
    }

    /**
     * The Application layout's context switcher: the contexts the member takes part in, of the module the apps' context switcher
     * names (Settings > API, sys_api_context_switcher and sys_api_context_connection), as the apps list them. Nothing without it.
     */
    public function getApplicationContextSwitcher()
    {
        $sModule = getParam('sys_api_context_switcher');
        $sConnection = getParam('sys_api_context_connection');
        if(!isLogged() || !$sModule || !$sConnection || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return '';

        $aIds = bx_srv($sModule, 'get_participating_profiles', [bx_get_logged_profile_id(), $sConnection != 'participants' ? $sConnection : false]);
        if(empty($aIds) || !is_array($aIds))
            return '';

        $aContexts = [];
        foreach($aIds as $iId) {
            $oContext = BxDolProfile::getInstance($iId);
            if(!$oContext)
                continue;

            $aContexts[] = [
                'url' => $oContext->getUrl(),
                'name' => bx_process_output($oContext->getDisplayName()),
                'thumb' => $oContext->getThumb(),
            ];
        }
        if(empty($aContexts))
            return '';

        return BxDolModule::getInstance($this->_sModule)->_oTemplate->parseHtmlByName('application_context_switcher.html', [
            'title' => bx_process_output(_t('_' . $sModule)),
            'bx_repeat:contexts' => $aContexts,
        ]);
    }

    public function getColorSchemeSwitcher()
    {
        if(!$this->isColorSchemeSwitchable())
            return '';

        return BxDolModule::getInstance($this->_sModule)->_oTemplate->parseHtmlByName('color_scheme_switcher.html', [
            'popup' => $this->getColorSchemeMenu('bx-sb-theme-switcher-menu')
        ]);
    }

    public function isColorSchemeSwitchable()
    {
        return BxDolModule::getInstance($this->_sModule)->_oConfig->getColorScheme() == 'auto';
    }

    /**
     * Light, Dark and System. Each option carries its code (data-bx-color-scheme) so the visitor's choice can be
     * marked (oBxArtificerUtils.setColorSchemeIcon); several menus can be on one page, each with its own id.
     */
    public function getColorSchemeMenu($sId)
    {
        if(!$this->isColorSchemeSwitchable())
            return '';

        $aMenu = [];
        foreach([1 => ['sun', 'light'], 2 => ['moon', 'dark'], 0 => ['desktop', 'system']] as $iCode => list($sIcon, $sTitle))
            $aMenu[] = [
                'id' => $sId . '-' . $sIcon,
                'name' => $this->_sModule . '-css-' . $sIcon,
                'class' => '',
                'link' => 'javascript:void(0)',
                'onclick' => "javascript:oBxArtificerUtils.setColorScheme(" . $iCode . "); $('#" . $sId . "').dolPopupHide();",
                'target' => '_self',
                'icon' => $sIcon == 'desktop' ? 'monitor' : $sIcon,
                'title' => _t('_bx_artificer_txt_color_scheme_' . $sTitle),
                'attrs_add' => 'data-bx-color-scheme="' . $iCode . '"',
            ];

        $oMenu = new BxTemplMenu(['template' => 'menu_vertical.html', 'menu_id'=> $sId . '-items', 'menu_items' => $aMenu]);

        return $this->transBox($sId, $oMenu->getCode(), true);
    }

    protected function getInjFooterPopupMenus() 
    {
        $sContent = '';

        $oSearch = new BxTemplSearch();
        $oSearch->setLiveSearch(true);
        $sContent .= $this->_oTemplate->parsePageByName('search.html', array(
            'search_form' => $oSearch->getForm(BX_DB_CONTENT_ONLY),
            'results' => $oSearch->getResultsContainer(),
        ));

        //--- The member's menus open as popups under their buttons: Add content, and the account menu under the avatar
        //--- (menu_account_popup.html), as the apps have it. The account menu was a sidebar across the page's height.
        if(isLogged()) {
            $sContent .= $this->_oTemplate->getMenu('sys_add_content');
            $sContent .= $this->_oTemplate->getMenu('sys_account_popup');
        }

        return $sContent;
    }

    protected function getInjFooterSidebarSite() 
    {
        $oSearch = new BxTemplSearch();
        $oSearch->setLiveSearch(true);
        $sSearch = $oSearch->getForm(BX_DB_CONTENT_ONLY);

        $sLogoUrl = $this->getMainLogoUrl();
        $bLogoUrl = !empty($sLogoUrl);

        $sLogoText = BxDolDesigns::getInstance()->getSiteLogoAlt();
        if(empty($sLogoText))
            $sLogoText = getParam('site_title');

        return $this->_oTemplate->parsePageByName('sidebar_site.html', array(
            'bx_if:show_logo_image' => array(
                'condition' => $bLogoUrl,
                'content' => array(
                    'logo_url' => $sLogoUrl,
                    'logo_text' => $sLogoText
                )
            ),
            'bx_if:show_logo_text' => array(
                'condition' => !$bLogoUrl,
                'content' => array(
                    'logo_text' => $sLogoText
                )
            ),
            'search_form' => $sSearch,
        ));
    }
}

/** @} */
