<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Artificer Artificer template
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxBaseModTemplateConfig');

class BxArtificerConfig extends BxBaseModTemplateConfig
{
    protected $_iLogoDark;
    protected $_iLogoDarkWidth;
    protected $_iLogoDarkHeight;
    protected $_fLogoDarkAspectRatio;
    protected $_fLogoDarkAspectRatioDefault;
    protected $_sLogoInline;
    
    protected $_iMarkDark;
    protected $_iMarkDarkWidth;
    protected $_iMarkDarkHeight;
    protected $_fMarkDarkAspectRatio;
    protected $_fMarkDarkAspectRatioDefault;
    protected $_sMarkInline;

    protected $_sKeyLogoDarkAspectRatio;
    protected $_sKeyMarkDarkAspectRatio;

    protected $_aReplacements;

    protected $_sThumbSizeDefault;
    protected $_aThumbSizes;
    protected $_aThumbSizeByTemplate;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = array_merge($this->CNF, [
            // some params
            'PARAM_IMAGES_CUSTOM' => 'bx_artificer_images_custom',
        ]);

        $this->_aJsClasses = array_merge($this->_aJsClasses, array(
            'utils' => 'BxArtificerUtils'
        ));

        $this->_aJsObjects = array_merge($this->_aJsObjects, array(
            'utils' => 'oBxArtificerUtils'
        ));

        $this->_iLogoHeight = 40;
        $this->_iLogoDarkWidth = 0;
        $this->_iLogoDarkHeight = $this->_iLogoHeight;
        $this->_fLogoDarkAspectRatioDefault = BxDolDesigns::$fLogoAspectRatioDefault;

        $this->_iMarkHeight = 40;
        $this->_iMarkDarkWidth = 0;
        $this->_iMarkDarkHeight = $this->_iMarkHeight;
        $this->_fMarkDarkAspectRatioDefault = BxDolDesigns::$fMarkAspectRatioDefault;

        $this->_aPrefixes = [
            'option' => 'bx_artificer_'
        ];

        $this->_aReplacements = [
            'bx-def-margin-sec-neg' => '-m-2',
        ];
                
        $this->_sThumbSizeDefault = 'thumb';
        $this->_aThumbSizes = [
            'icon' => 'h-8 w-8',
            'thumb' => 'h-10 w-10',
            'ava' => 'h-24 w-24',
            'ava-big' => 'w-48 h-48'
        ];
        $this->_aThumbSizeByTemplate = [
            'unit_with_cover.html' => 'h-24 w-24' //--- 'ava' size
        ];
    }
    
    public function init(&$oDb)
    {
        parent::init($oDb);
        $sPrefix = $this->getPrefix('option');

        $this->_sKeyLogoDarkAspectRatio = $sPrefix . 'site_logo_dark_aspect_ratio';
        $this->_sKeyMarkDarkAspectRatio = $sPrefix . 'site_mark_dark_aspect_ratio';

        $this->_iLogoDark = (int)$this->_oDb->getParam($sPrefix . 'site_logo_dark');
        $this->_fLogoDarkAspectRatio = (float)$this->_oDb->getParam($this->_sKeyLogoDarkAspectRatio);
        $this->_sLogoInline = $this->_oDb->getParam($sPrefix . 'site_logo_inline');

        $this->_iMarkDark = (int)$this->_oDb->getParam($sPrefix . 'site_mark_dark');
        $this->_fMarkDarkAspectRatio = (float)$this->_oDb->getParam($this->_sKeyMarkDarkAspectRatio);
        $this->_sMarkInline = $this->_oDb->getParam($sPrefix . 'site_mark_inline');
    }

    public function getColorScheme()
    {
        return getParam('bx_artificer_color_scheme');
    }

    /**
     * The header's width on every layout: 'page' or 'full'; '' leaves it to Designer (per layout).
     */
    public function getHeaderWidth()
    {
        $sValue = getParam('bx_artificer_header_width');
        return in_array($sValue, BxDolTemplate::HEADER_WIDTHS, true) ? $sValue : '';
    }

    /**
     * The main menu's place in the header on every layout: 'start', 'center' or 'end'; '' leaves it to Designer.
     */
    public function getHeaderAlign()
    {
        $sValue = getParam('bx_artificer_header_align');
        return in_array($sValue, BxDolTemplate::HEADER_ALIGNS, true) ? $sValue : '';
    }

    public function getLogoParams()
    {
    	$sPrefix = $this->getPrefix('option');

    	return [
            'logo' => $sPrefix . 'site_logo',
            'logo_dark' => $sPrefix . 'site_logo_dark',
            'logo_inline' => $sPrefix . 'site_logo_inline',
            'mark' => $sPrefix . 'site_mark',
            'mark_dark' => $sPrefix . 'site_mark_dark',
            'mark_inline' => $sPrefix . 'site_mark_inline',
            'logo_alt' => $sPrefix . 'site_logo_alt'
    	];
    }

    public function getReplacements()
    {
        return $this->_aReplacements;
    }

    public function getThumbSize($sName = '', $sTemplate = '')
    {
        if (empty($sName))
            $sName = 'thumb';
        
        if(!empty($sName) && isset($this->_aThumbSizes[$sName]))
            return $this->_aThumbSizes[$sName];

        if(!empty($sTemplate) && isset($this->_aThumbSizeByTemplate[$sTemplate]))
            return $this->_aThumbSizeByTemplate[$sTemplate];

        return $this->_sThumbSizeDefault;
    }
}

/** @} */
