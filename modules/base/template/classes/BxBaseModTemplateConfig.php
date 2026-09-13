<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseTemplate Base classes for template modules
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolDesigns');
bx_import('BxBaseModGeneralConfig');

class BxBaseModTemplateConfig extends BxBaseModGeneralConfig
{
    protected $_oDb;

    protected $_iLogo;
    protected $_sLogoAlt;
    protected $_iLogoWidth;
    protected $_iLogoHeight;
    protected $_fLogoAspectRatio;
    protected $_fLogoAspectRatioDefault;
    
    protected $_iMark;
    protected $_iMarkWidth;
    protected $_iMarkHeight;
    protected $_fMarkAspectRatio;
    protected $_fMarkAspectRatioDefault;

    protected $_iDefaultHeight;
    protected $_sKeyLogoAspectRatio;
    protected $_sKeyMarkAspectRatio;

    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_iLogoWidth = 0;
        $this->_iLogoHeight = 0;
        $this->_fLogoAspectRatioDefault = BxDolDesigns::$fLogoAspectRatioDefault;

        $this->_iMarkWidth = 0;
        $this->_iMarkHeight = 0;
        $this->_fMarkAspectRatioDefault = BxDolDesigns::$fMarkAspectRatioDefault;
    }

    public function init(&$oDb)
    {
        $this->_oDb = &$oDb;
        $sPrefix = $this->getPrefix('option');

        $this->_iDefaultHeight = $this->_calculateValuesHeight();
        $this->_sKeyLogoAspectRatio = $sPrefix . 'site_logo_aspect_ratio';
        $this->_sKeyMarkAspectRatio = $sPrefix . 'site_mark_aspect_ratio';

        $this->_iLogo = (int)$this->_oDb->getParam($sPrefix . 'site_logo');
        $this->_fLogoAspectRatio = (float)$this->_oDb->getParam($this->_sKeyLogoAspectRatio);

        $this->_iMark = (int)$this->_oDb->getParam($sPrefix . 'site_mark');
        $this->_fMarkAspectRatio = (float)$this->_oDb->getParam($this->_sKeyMarkAspectRatio);

        $this->_sLogoAlt = $this->_oDb->getParam($sPrefix . 'site_logo_alt');
    }

    public function getLogoParams()
    {
    	$sPrefix = $this->getPrefix('option');

    	return [
            'logo' => $sPrefix . 'site_logo',
            'mark' => $sPrefix . 'site_mark',
            'logo_alt' => $sPrefix . 'site_logo_alt'
    	];
    }

    public function getLogoValues($sType, $sUrl, $aInfo)
    {
        $sTypeUc = bx_gen_method_name($sType);

        $sHeight = '_i' . $sTypeUc . 'Height';
        if(empty($this->$sHeight))
            $this->$sHeight = $this->_iDefaultHeight;

        $sAspectRatio = '_f' . $sTypeUc . 'AspectRatio';
        if(!$this->$sAspectRatio)
            $this->$sAspectRatio = $this->_calculateValuesAspectRatio($sType, $sUrl, $aInfo);

        $sWidth = '_i' . $sTypeUc . 'Width';
        $this->$sWidth = (int)ceil($this->$sHeight * $this->$sAspectRatio);

        return [
            $sType . '_width' => $this->$sWidth,
            $sType . '_height' => $this->$sHeight,
            $sType . '_aspect_ratio' => $this->$sAspectRatio,
        ];
    }

    public function getLogo()
    {
    	return $this->_iLogo;
    }

    public function getLogoAlt()
    {
    	return $this->_sLogoAlt;
    }

    public function getLogoWidth()
    {
    	return $this->_iLogoWidth;
    }

    public function getLogoHeight()
    {
    	return $this->_iLogoHeight;
    }

    public function getMarkWidth()
    {
    	return $this->_iMarkWidth;
    }

    public function getMarkHeight()
    {
    	return $this->_iMarkHeight;
    }

    public function getDefaultHeight()
    {
        return $this->_iDefaultHeight;
    }

    protected function _calculateValuesHeight()
    {
        $sPrefix = $this->getPrefix('option');

        $sHeaderHeight = $this->_oDb->getParam($sPrefix . 'header_height');
        if(!$sHeaderHeight)
            return 0;

        $iHeaderHeight = $this->_str2px($sHeaderHeight);
        if(!$iHeaderHeight)
            return 0;
        
        $sHeaderPaddings = $this->_oDb->getParam($sPrefix . 'header_content_padding');
        if(!$sHeaderPaddings)
            return $iHeaderHeight;

        $aHeaderPaddings = explode(' ', $sHeaderPaddings);
        if(empty($aHeaderPaddings) || !is_array($aHeaderPaddings))
            return $iHeaderHeight;

        switch(count($aHeaderPaddings)) {
            case 1:
            case 2:
                $iPTop = $iPBottom = $this->_str2px($aHeaderPaddings[0]);
                break;

            case 3:
            case 4:
                $iPTop = $this->_str2px($aHeaderPaddings[0]);
                $iPBottom = $this->_str2px($aHeaderPaddings[2]);
                break;
        }

        return $iHeaderHeight - $iPTop - $iPBottom;
    }

    protected function _calculateValuesAspectRatio($sType, $sUrl, $aInfo)
    {
        $sTypeUc = bx_gen_method_name($sType);

        if(!$sUrl)
            return $this->{'_f' . $sTypeUc . 'AspectRatioDefault'};

        /*
         * Measure the stored file itself when it is on this server. The URL is the site's own
         * public address, which the server can't always reach from where it runs - inside a
         * container, behind a load balancer or a firewall - and a measurement which fails isn't
         * saved, so it would be retried, warning, on every page.
         */
        $sSource = !empty($aInfo['local_path']) ? $aInfo['local_path'] : $sUrl;

        $iWidth = $iHeight = 0;
        if(strpos($sUrl, '.svg') !== false)
            list($iWidth, $iHeight) = bx_get_svg_image_size($sSource);
        else if(isset($aInfo['mime_type']) && strncmp($aInfo['mime_type'], 'image/', 6) === 0)
            list($iWidth, $iHeight) = getimagesize($sSource);

        if(!$iHeight) 
            return $this->{'_f' . $sTypeUc . 'AspectRatioDefault'};

        $fResult = $iWidth / $iHeight;
        $this->_oDb->setParam($this->{'_sKey' . $sTypeUc . 'AspectRatio'}, $fResult);

        return $fResult;
    }

    protected function _str2px($sValue)
    {
        if(!$sValue)
            return 0;

        if(($iPosition = strpos($sValue, 'px')) !== false)
            return (int)substr($sValue, 0, $iPosition);

        if(($iPosition = strpos($sValue, 'rem')) !== false)
            return (int)ceil(16 * (float)substr($sValue, 0, $iPosition));

        return (int)$sValue;
    }
}

/** @} */
