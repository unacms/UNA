<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Cover representation.
 * @see BxDolCover
 */
class BxBaseCover extends BxDolCover
{
    protected $_bJsCssAdded = false;

    /**
     * The parts of the page's own cover display() draws (displayPageCover): band, title, and the screen sizes each is
     * hidden on. Null draws both everywhere.
     */
    protected $_aPageParts = null;

    /**
     * The page's own cover was drawn (displayPageCover): its picture, set while drawing it, doesn't make it a cover set
     * in code (isCover).
     */
    protected $_bPageCoverDrawn = false;

    protected $_oTemplate;

    public function __construct ($oTemplate)
    {
        parent::__construct ();

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();
    }

    /**
     * Display Cover.
     */
    public function display ()
    {
        $this->_addJsCss();

        $sResult = null;
        $aParams = [];
        if(!empty($this->_aOptions) && is_array($this->_aOptions)){
            $aParams = array_merge($this->_aOptiondDefault, $this->_aOptions);
        }
        else{
            $oPage = BxDolPage::getObjectInstanceByURI();
            if(empty($oPage) || !is_a($oPage, 'BxDolPage'))
                return $this->displayEmpty();

            $mixedOptions = $oPage->getPageCoverParams();
            if(empty($mixedOptions) || !is_array($mixedOptions))
                return $this->displayEmpty();

            if(!$this->_sCoverImageUrl) {
                $iId = (int)getParam('sys_site_cover_common');
                if($iId != 0)
                    $this->setCoverImageUrl(array('id' => $iId, 'transcoder' => BX_DOL_TRANSCODER_OBJ_COVER));
            }

            if($this->_sCoverImageUrl)
                $mixedOptions['bx_if:bg'] = array (
                    'condition' => true,
                    'content' => array('image_url' => $this->_sCoverImageUrl),
                );

            $mixedOptions['bx_if:empty_cover_class'] = array (
                'condition' => empty($this->_sCoverImageUrl),
                'content' => array(),
            );
        
            $aParams = array_merge($this->_aOptiondDefault, $mixedOptions);
        }

        //--- The cover title is the page's <h1>. Content view pages deliberately leave it empty and
        //--- headline the content instead, so the heading element is only emitted when there is a title.
        $aParams['bx_if:title'] = array (
            'condition' => !empty($aParams['title']) && ($this->_aPageParts === null || $this->_aPageParts['title']),
            'content' => array('title' => isset($aParams['title']) ? $aParams['title'] : ''),
        );

        //--- A page's cover is a band of the picture or the template's art with no words on it, so no picture can
        //--- hide them; the page's title follows it on the page: with the section's icon above the tabs of a section,
        //--- as a plain heading above the blocks elsewhere. The band shows from desktop width: below it the title and
        //--- tabs start the page, as in the apps, whose header holds them there. An entry's cover (no title) keeps
        //--- its band on every screen.
        if(empty($this->_aOptions))
            $aParams = array_merge($aParams, $this->_getPageCoverTitleParams($aParams));

        //--- The title on the band (the base template's cover.html) hides where the page's title row does.
        if(!empty($aParams['bx_if:title']['condition']))
            $aParams['bx_if:title']['content']['title_class'] = isset($aParams['title_class']) ? $aParams['title_class'] : '';

        //--- The band's markup (its picture, its class, its actions) is inside <bx_if:band>, which gets the cover's params.
        if(!empty($aParams['bx_if:band']['condition']))
            $aParams['bx_if:band']['content'] = $aParams;

        /**
         * @hooks
         * @hookdef hook-system-display_cover 'system', 'display_cover' - hook to override page cover code to be output
         * - $unit_name - equals `system`
         * - $action - equals `display_cover`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `res` - [string] by ref, when null the default generation mechanism will be used, can be overridden in hook processing
         *      - `template_name` - [string] by ref, template name, can be overridden in hook processing
         *      - `params` - [array] by ref, additional params array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-system-display_cover
         */
        bx_alert('system', 'display_cover', 0, 0, [
            'res' => &$sResult, 

            'template_name' => &$this->_sTemplateName, 
            'params' => &$aParams, 

            'template_name_ref' => &$this->_sTemplateName, 
            'params_ref' => &$aParams, 
        ]);

        if ($sResult  != null)
            return $sResult;
        
        return $this->_oTemplate->parseHtmlByName($this->_sTemplateName, $aParams); 
    }
    
    /**
     * The page's own cover, a page whose cover isn't set in code (an entry's, a profile's, the home page's): its band
     * where the page's cover is on (Studio > Pages > page > Cover) and its title where the page's title is on
     * (Studio > Pages > page > Title), each, both or neither, each hidden on the screen sizes picked for it.
     * @param object $oPage the page
     * @return string
     */
    public function displayPageCover($oPage)
    {
        $aParts = $this->getPageParts($oPage);
        if(!$aParts['band'] && !$aParts['title'])
            return $this->displayEmpty();

        if($aParts['band']) {
            $aCover = $oPage->getPageCoverImage();
            if(!empty($aCover))
                $this->setCoverImageUrl($aCover);
        }

        $this->_aPageParts = $aParts;
        $this->_bPageCoverDrawn = true;
        $sResult = $this->display();
        $this->_aPageParts = null;

        return $sResult;
    }

    /**
     * What the page's own cover shows to this viewer: the band (`band`, where covers are on in Studio > Designer >
     * Cover and the page's cover is on for this viewer) and the title (`title`, where the page's title is on for this
     * viewer), each with the screen sizes it is hidden on (`band_hidden_on`, `title_hidden_on`: BX_DB_HIDDEN_* bits).
     * A part hidden on every screen size the site has is off.
     * @param object $oPage the page, false for none
     * @return array
     */
    public function getPageParts($oPage)
    {
        $bPage = $oPage && !$this->isPageCoverOff() && method_exists($oPage, 'isPageCover');

        $bBand = $bPage && $this->isEnabled() && $oPage->isPageCover();
        $iBandHiddenOn = $bBand ? (int)$oPage->getPageCoverHiddenOn() : 0;

        $bTitle = $bPage && method_exists($oPage, 'isPageTitle') && $oPage->isPageTitle();
        $iTitleHiddenOn = $bTitle ? (int)$oPage->getPageTitleHiddenOn() : 0;

        $iSite = self::getHiddenOnBits([BX_DB_HIDDEN_PHONE, BX_DB_HIDDEN_TABLET, BX_DB_HIDDEN_DESKTOP]);
        return [
            'band' => $bBand && ($iBandHiddenOn & $iSite) != $iSite,
            'band_hidden_on' => $iBandHiddenOn,
            'title' => $bTitle && ($iTitleHiddenOn & $iSite) != $iSite,
            'title_hidden_on' => $iTitleHiddenOn,
        ];
    }

    /**
     * The bits of a "Hidden on" set (BX_DB_HIDDEN_* constants) for some screen sizes.
     * @param array $aSizes BX_DB_HIDDEN_* constants
     * @return int
     */
    public static function getHiddenOnBits($aSizes)
    {
        $iBits = 0;
        foreach($aSizes as $iSize)
            $iBits |= pow(2, $iSize - 1);

        return $iBits;
    }

    /**
     * The classes that hide an element on the site's screen sizes of a "Hidden on" set (bx-def-media-*-hide), or on
     * the others.
     * @param int $iHiddenOn BX_DB_HIDDEN_* bits
     * @param bool $bOthers the classes for the screen sizes not in the set
     * @return string
     */
    public static function getHiddenOnClasses($iHiddenOn, $bOthers = false)
    {
        $aClasses = [];
        foreach([BX_DB_HIDDEN_PHONE => 'bx-def-media-phone-hide', BX_DB_HIDDEN_TABLET => 'bx-def-media-tablet-hide', BX_DB_HIDDEN_DESKTOP => 'bx-def-media-desktop-hide'] as $iSize => $sClass)
            if((bool)((int)$iHiddenOn & self::getHiddenOnBits([$iSize])) != $bOthers)
                $aClasses[] = $sClass;

        return implode(' ', $aClasses);
    }

    /**
     * A section's add action in its tab row, at the row's end: where the page's title row, which holds it, is off or
     * hidden (Studio > Pages > page > Title). Nothing where the title row shows it on every screen size.
     * @return string
     */
    public function getSubmenuAddAction()
    {
        // A cover set in code (an entry's, a profile's) has no section title row; the page's own cover sets its picture
        // while it is drawn, before the tab row, which keeps it the page's.
        if(($this->isCover() && !$this->_bPageCoverDrawn) || ($oPage = BxDolPage::getObjectInstanceByURI()) === false || !$oPage->isVisiblePageSubmenu())
            return '';

        $aParts = $this->getPageParts($oPage);
        $iSite = self::getHiddenOnBits([BX_DB_HIDDEN_PHONE, BX_DB_HIDDEN_TABLET, BX_DB_HIDDEN_DESKTOP]);
        if($aParts['title'] && ($aParts['title_hidden_on'] & $iSite) == 0)
            return '';

        $aAdd = $oPage->getAddEntryAction();
        if(empty($aAdd))
            return '';

        // Shown where the title row isn't: everywhere for a page without a title, else on its "Title hidden on" sizes.
        $sClass = $aParts['title'] ? self::getHiddenOnClasses($aParts['title_hidden_on'], true) : '';

        return $this->_oTemplate->parseHtmlByName('cover_add.html', $this->_getAddTmplVars($aAdd, $sClass));
    }

    /**
     * The template variables of a section's add action (cover.html, cover_add.html).
     * @param array $aAdd url, title, icon (BxBasePage::getAddEntryAction)
     * @param string $sClass more classes of the button
     * @return array
     */
    protected function _getAddTmplVars($aAdd, $sClass = '')
    {
        return [
            'class' => $sClass,
            'url' => $aAdd['url'],
            'title' => bx_html_attribute($aAdd['title']),
            'label' => bx_process_output($aAdd['title']),
            'icon' => BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml($aAdd['icon'], ['aria-hidden' => 'true']),
        ];
    }

    /**
     * The icon of a section's title: the site menu item's, else the section's module's (its `ICON`), as the apps take
     * the menu's `icon` when the item has none.
     * @param string $sMenuIcon the selected site menu item's icon, '' for none
     * @param string $sModule the page's module
     * @return string the icon's code, '' for none
     */
    public function getSectionIconCode($sMenuIcon, $sModule)
    {
        if($sMenuIcon !== '')
            return $sMenuIcon;

        if($sModule === '' || $sModule == 'system' || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return '';

        $oModule = BxDolModule::getInstance($sModule);
        return $oModule && !empty($oModule->_oConfig->CNF['ICON']) ? (string)$oModule->_oConfig->CNF['ICON'] : '';
    }

    /**
     * The page cover's band and title (cover.html): `band_class` hides the band below desktop width where the page has
     * a title, `bx_if:title_section` is the title of a section's page (its tabs show: the section's icon and name),
     * `bx_if:title_page` that of any other page.
     * @param array $aParams the cover's params (title, actions, bx_if:icon)
     * @return array
     */
    protected function _getPageCoverTitleParams($aParams)
    {
        $sTitle = isset($aParams['title']) ? $aParams['title'] : '';
        $bTitle = !empty($sTitle);

        $bSection = false;
        if($bTitle && ($oPage = BxDolPage::getObjectInstanceByURI()) !== false && $oPage->isVisiblePageSubmenu()) {
            $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
            $bSection = $oMenuSubmenu !== false && $oMenuSubmenu->isVisible();
        }

        $sIcon = '';
        if($bSection) {
            $sMenuIcon = !empty($aParams['bx_if:icon']['condition']) && !empty($aParams['bx_if:icon']['content']['icon']) ? $aParams['bx_if:icon']['content']['icon'] : '';
            $sIconCode = $this->getSectionIconCode($sMenuIcon, (string)$oPage->getModule());
            if($sIconCode !== '')
                $sIcon = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml($sIconCode, ['class' => 'size-7', 'aria-hidden' => 'true']);
        }

        $sActions = isset($aParams['actions']) ? $aParams['actions'] : '';

        // The parts the page shows (displayPageCover): both everywhere when display() is called on its own.
        $aParts = $this->_aPageParts !== null ? $this->_aPageParts : ['band' => true, 'band_hidden_on' => 0, 'title' => true, 'title_hidden_on' => 0];
        $bBand = $aParts['band'];
        $bTitleRow = $bTitle && $aParts['title'];
        $sTitleClass = $bTitleRow ? self::getHiddenOnClasses($aParts['title_hidden_on']) : '';

        // A section's "add" action (the + the apps draw there too): at the end of its title row, for a viewer who may add.
        // Where the title row is off or hidden, the tab row has it (getSubmenuAddAction).
        $aAdd = $bSection && $bTitleRow ? $oPage->getAddEntryAction() : [];

        // The band shows from desktop width where the page has a title: below it the title and tabs start the page.
        $aBandClasses = [];
        if($bTitle)
            $aBandClasses[] = 'hidden lg:block';
        if($bBand && ($sBandHidden = self::getHiddenOnClasses($aParts['band_hidden_on'])) !== '')
            $aBandClasses[] = $sBandHidden;

        // The page's heading for screen readers where its title row is off or hidden.
        $sTitleSrClass = $bTitleRow ? self::getHiddenOnClasses($aParts['title_hidden_on'], true) : '';
        $bTitleSr = $bTitle && !$this->_bPageHasHeading && (!$bTitleRow || $sTitleSrClass !== self::getHiddenOnClasses(0, true));

        // A template whose band holds the title (the base template's cover.html): the title on the band where both show,
        // the title alone where the band is off or hidden.
        $sBandHidden = $bBand ? self::getHiddenOnClasses($aParts['band_hidden_on']) : '';
        $bTitleOnly = $bTitleRow && (!$bBand || $sBandHidden !== '');
        $sTitleOnlyClass = trim($sTitleClass . ($bBand ? ' ' . self::getHiddenOnClasses($aParts['band_hidden_on'], true) : ''));

        return [
            'band_class' => implode(' ', $aBandClasses),
            'band_hidden_class' => $sBandHidden,
            'title_class' => $sTitleClass,
            'bx_if:band' => [
                'condition' => $bBand,
                'content' => [],
            ],
            'bx_if:title_section' => [
                'condition' => $bTitleRow && $bSection,
                'content' => [
                    'title_class' => $sTitleClass,
                    'title' => $sTitle,
                    'bx_if:section_icon' => [
                        'condition' => $sIcon !== '',
                        'content' => ['icon' => $sIcon],
                    ],
                    'actions' => $sActions,
                    'bx_if:add' => [
                        'condition' => !empty($aAdd),
                        'content' => !empty($aAdd) ? $this->_getAddTmplVars($aAdd) : [],
                    ],
                ],
            ],
            'bx_if:title_page' => [
                'condition' => $bTitleRow && !$bSection,
                'content' => [
                    'title_class' => $sTitleClass,
                    'title' => $sTitle,
                    'actions' => $sActions,
                ],
            ],
            // A template whose band holds the title (the base template's cover.html): the title alone without the band.
            'bx_if:title_only' => [
                'condition' => $bTitleOnly,
                'content' => [
                    'title_only_class' => $sTitleOnlyClass,
                    'title' => $sTitle,
                ],
            ],
            'bx_if:title_sr' => [
                'condition' => $bTitleSr,
                'content' => [
                    'class' => $sTitleSrClass,
                    'title' => $sTitle,
                ],
            ],
            'bx_if:actions' => [
                'condition' => !$bTitleRow && $bBand,
                'content' => ['actions' => $sActions],
            ],
        ];
    }

    /**
     * Display Empty Cover.
     */
    public function displayEmpty ()
    {
        $aTmplVarsTitle = ($sTitle = $this->_oTemplate->getPageHeader()) ? [
            'title' => bx_process_output(strip_tags($sTitle))
        ] : false;

        return $this->_oTemplate->parseHtmlByName($this->_sTemplateNameEmpty, [
            'bx_if:title' => [
                'condition' => !$this->_bPageHasHeading && $aTmplVarsTitle !== false,
                'content' => $aTmplVarsTitle,
            ],
        ]);
    }

    /**
     * Add css/js files which are needed for display and functionality.
     */
    protected function _addJsCss()
    {
        if ($this->_bJsCssAdded)
            return;

        $this->_oTemplate->addCss(array('cover.css'));
        $this->_bJsCssAdded = true;
    }
}

/** @} */
