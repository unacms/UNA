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
            'condition' => !empty($aParams['title']),
            'content' => array('title' => isset($aParams['title']) ? $aParams['title'] : ''),
        );

        //--- A page's cover is a band of the picture or the template's art with no words on it, so no picture can
        //--- hide them; the page's title follows it on the page: with the section's icon above the tabs of a section,
        //--- as a plain heading above the blocks elsewhere. The band shows from desktop width: below it the title and
        //--- tabs start the page, as in the apps, whose header holds them there. An entry's cover (no title) keeps
        //--- its band on every screen.
        if(empty($this->_aOptions))
            $aParams = array_merge($aParams, $this->_getPageCoverTitleParams($aParams));

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
        if($bSection && !empty($aParams['bx_if:icon']['condition']) && !empty($aParams['bx_if:icon']['content']['icon']))
            $sIcon = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIconAsHtml($aParams['bx_if:icon']['content']['icon'], ['class' => 'size-8', 'aria-hidden' => 'true']);

        $sActions = isset($aParams['actions']) ? $aParams['actions'] : '';

        return [
            'band_class' => $bTitle ? 'hidden lg:block' : '',
            'bx_if:title_section' => [
                'condition' => $bSection,
                'content' => [
                    'title' => $sTitle,
                    'bx_if:section_icon' => [
                        'condition' => $sIcon !== '',
                        'content' => ['icon' => $sIcon],
                    ],
                    'actions' => $sActions,
                ],
            ],
            'bx_if:title_page' => [
                'condition' => $bTitle && !$bSection,
                'content' => [
                    'title' => $sTitle,
                    'actions' => $sActions,
                ],
            ],
            'bx_if:actions' => [
                'condition' => !$bTitle,
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
