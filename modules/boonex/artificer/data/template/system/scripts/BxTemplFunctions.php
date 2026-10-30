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

        $aImages = [
            'logo' => ['uc' => 'Logo', 'gi' => 'logo-generic.svg'], 
            'logo_dark' => ['uc' => 'LogoDark', 'gi' => 'logo-dark-generic.svg'], 
            'mark' => ['uc' => 'Mark', 'gi' => 'mark-generic.svg'], 
            'mark_dark' => ['uc' => 'MarkDark', 'gi' => 'mark-dark-generic.svg'], 
        ];

        $aTmplVarsImages = [];
        $bLogo = $bLogoDark = $bMark = $bMarkDark = false;
        foreach($aImages as $sType => &$aParams)
            if(($aParams['g'] = false) || ($sFileUrl = $this->{'getMain' . $aParams['uc'] . 'Url'}()) !== false || ($aParams['g'] = (($sType == 'logo' || $aImages['logo']['g']) && ($sFileUrl = $this->_oTemplate->getImageUrl($aParams['gi'])) != ''))) {
                $iLogoHeight = (int)$oDesigns->{'getSite' . $aParams['uc'] . 'Height'}();
                $sLogoHeight = $iLogoHeight > 0 ? 'height:' . round($iLogoHeight/16, 3) . 'rem;' : '';

                /**
                 * Generic (SVG) images get the height only, the browser derives the width from the image's own aspect ratio.
                 * Uploaded images use the dimensions from Designs settings.
                 */
                $iLogoWidth = empty($aParams['g']) ? (int)$oDesigns->{'getSite' . $aParams['uc'] . 'Width'}() : 0;
                $sLogoWidth = $iLogoWidth > 0 ? 'width:' . round($iLogoWidth/16, 3) . 'rem;' : '';

                $aTmplVarsImages[$sType] = [
                    'id' => 'bx-' . str_replace('_', '-', $sType),
                    'src' => $sFileUrl,
                    'alt' => $sAltAttr,
                    'class' => '',
                    'style' => $sLogoWidth . ' ' . $sLogoHeight,
                ];

                ${'b' . $aParams['uc']} = true;
            }

        $sLogoInline = $sLogoInlineClass = '';
        if($aImages['logo']['g'] && ($sLogoInline = $this->getMainLogoInline()) != '') {
            $bLogo = true;
            $bLogoDark = false;
            unset($aTmplVarsImages['logo'], $aTmplVarsImages['logo_dark']);
        }

        $sMarkInline = $sMarkInlineClass = '';
        if($aImages['mark']['g'] && ($sMarkInline = $this->getMainMarkInline()) != '') {
            $bMark = true;
            $bMarkDark = false;
            unset($aTmplVarsImages['mark'], $aTmplVarsImages['mark_dark']);
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

        foreach($aImages as $sType => $aParams) {
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

    public function TemplPageAddComponent($sKey)
    {
        $mixedResult = false;

        switch($sKey) {
            case 'sys_header_width':
                $mixedResult = '';
                if(getParam('bx_artificer_header_stretched') != 'on')
                    $mixedResult = parent::TemplPageAddComponent($sKey);
                break;

            case 'sys_toolbar_search':
                if(getParam('bx_artificer_header_search') == 'on')
                    $mixedResult = parent::TemplPageAddComponent($sKey);
                else
                    $mixedResult = '';
                break;

            default:
                $mixedResult = parent::TemplPageAddComponent($sKey);
        }

        return $mixedResult;
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
                'icon' => $sIcon,
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

        if(isLogged())
            $sContent .= $this->_oTemplate->getMenu('sys_add_content');

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

    protected function getInjFooterSidebarAccount() 
    {
        $oProfile = BxDolProfile::getInstance();
        if(!$oProfile)
            return '';

        $sMenuAccountPopup = 'sys_account_popup';
        $oMenuAccountPopup = BxTemplMenu::getObjectInstance($sMenuAccountPopup);

        return $this->_oTemplate->parsePageByName('sidebar_account.html', [
            'color_scheme_switcher' => $this->getColorSchemeSwitcher(),
            'ap_menu_object' => $sMenuAccountPopup,
            'bx_repeat:ap_menu_items' => $oMenuAccountPopup->getMenuItems(),
        ]);
    }
}

/** @} */
