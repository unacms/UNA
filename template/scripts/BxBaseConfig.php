<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxBaseConfig extends BxDol implements iBxDolSingleton
{
    protected $_aConfig = array (
        'bAllowUnicodeInPreg' => true, ///< allow unicode in regular expressions
        'aLessConfig' => array (
            'bx-root-class-name' => '',
            
            'bx-page-width' => '1000px',

            'bx-margin' => '16px',
            'bx-margin-sec' => '8px',
            'bx-margin-thd' => '4px',

            'bx-padding' => '16px',
            'bx-padding-sec' => '8px',
            'bx-padding-thd' => '4px',

            'bx-font-family' => 'Helvetica, Arial, sans-serif',

            'bx-size-avatar-big' => '192px',
            'bx-size-avatar' => '96px',
            'bx-size-thumb' => '44px',
            'bx-size-icon' => '32px',

            'bx-size-gallery-img-width' => '300px',
            'bx-size-gallery-img-height' => '200px',

            'bx-color-page' => '#fff',
            'bx-color-block' => '#fff',
            'bx-color-box' => 'rgba(242, 242, 242, 1.0)',
            'bx-color-box-hover' => 'rgba(242, 242, 242, 0.8)',
            'bx-color-label' => '#e8e8e8',
            'bx-color-label-menu' => '#999999',
            'bx-color-sec' => '#f2f2f2',
            'bx-color-hl' => 'rgba(243, 244, 246, 1)',
            'bx-color-active' => 'rgba(24, 144, 255, 0.2)',
            'bx-color-disabled' => 'rgba(221, 221, 221, 1.0)',

            'bx-border-width' => '1px',
            'bx-border-type' => 'solid',
            'bx-border-color' => '#d0d0d0',
            'bx-border-color-hr' => 'rgba(232, 232, 232, 0.8)',

            'bx-font-size-default' => '16px',
            'bx-font-size-small' => '12px',
            'bx-font-size-middle' => '14px',
            'bx-font-size-large' => '20px',
            'bx-font-size-h1' => '32px',
            'bx-font-size-h2' => '28px',
            'bx-font-size-h3' => '24px',

            'bx-font-color-default' => '#333',
            'bx-font-color-grayed' => '#999',
            'bx-font-color-contrasted' => '#fff',

            'bx-round-corners-radius' => '3px',
            'bx-round-corners-radius-label' => '4px',
            'bx-round-corners-radius-label-menu' => '12px',
        ),
    );

    function __construct()
    {
        parent::__construct();
        
        if (class_exists('BxDolTemplate'))
            $this->_aConfig['aLessConfig']['bx-root-class-name'] =  BxDolTemplate::getInstance()->getCssClassName();
    }

    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxTemplConfig();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function __get($sName)
    {
        if (array_key_exists($sName, $this->_aConfig))
            return $this->_aConfig[$sName];

        trigger_error('Undefined property "' . $sName . '" in ' . get_class($this), E_USER_ERROR);

        return null;
    }

    public function __isset($sName)
    {
        return isset($this->_aConfig[$sName]);
    }

    protected function setPageWidth($sParamName)
    {
        if(!class_exists('BxDolDb') || !BxDolDb::getInstance() || empty($sParamName)) 
            return;

        $mixedWidth = getParam($sParamName);
        if(is_numeric($mixedWidth))
            $mixedWidth .= 'px';

        $this->_aConfig['aLessConfig']['bx-page-width'] = $mixedWidth;
    }

    protected function _setValue($sKey, $sDefault = '')
    {
        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setSize($sKey, $sDefault = '', $sPattern = '')
    {
        if(empty($sDefault))
            $sDefault = '0px';

        if(empty($sPattern))
            $sPattern = "/([0-9\.]+\s*((px)|(rem)|(vh))){1}/";

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !preg_match($sPattern, $sValue))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setSizePx($sKey, $sDefault = '')
    {
        return $this->_setSize($sKey, $sDefault, "/([0-9\.]+\s*(px)){1}/");
    }

    protected function _setSizeDivided($sValue)
    {
        $aEmpty = array(0, 0, 0, 0);

        $aValues = explode(' ', $sValue);
        if(empty($aValues) || !is_array($aValues))
            return $aEmpty;

        $aResult = $aEmpty;
        switch(count($aValues)) {
            case 1:
                $aResult = array($aValues[0], $aValues[0], $aValues[0], $aValues[0]);
                break;

            case 2:
                $aResult = array($aValues[0], $aValues[1], $aValues[0], $aValues[1]);
                break;

            case 3:
                $aResult = array($aValues[0], $aValues[1], $aValues[2], $aValues[1]);
                break;

            case 4:
                $aResult = array($aValues[0], $aValues[1], $aValues[2], $aValues[3]);
                break;
        }

        return $aResult;
    }

    protected function _setInnerSizeDivided($sValue, $aReductor = array('px' => 1, 'rem' => 0.0625))
    {
        $aEmpty = array(0, 0, 0, 0);

        $aValues = explode(' ', $sValue);
        if(empty($aValues) || !is_array($aValues))
            return $aEmpty;

        $aResult = $aEmpty;
        switch(count($aValues)) {
            case 1:
                $sValue0 = $this->_decreaseValue($aValues[0], $aReductor);
                $aResult = array($sValue0, $sValue0, $sValue0, $sValue0);
                break;

            case 2:
                $sValue0 = $this->_decreaseValue($aValues[0], $aReductor);
                $sValue1 = $this->_decreaseValue($aValues[1], $aReductor);
                $aResult = array($sValue0, $sValue1, $sValue0, $sValue1);
                break;

            case 3:
                $sValue0 = $this->_decreaseValue($aValues[0], $aReductor);
                $sValue1 = $this->_decreaseValue($aValues[1], $aReductor);
                $sValue2 = $this->_decreaseValue($aValues[2], $aReductor);
                $aResult = array($sValue0, $sValue1, $sValue2, $sValue1);
                break;

            case 4:
                $sValue0 = $this->_decreaseValue($aValues[0], $aReductor);
                $sValue1 = $this->_decreaseValue($aValues[1], $aReductor);
                $sValue2 = $this->_decreaseValue($aValues[2], $aReductor);
                $sValue3 = $this->_decreaseValue($aValues[3], $aReductor);
                $aResult = array($sValue0, $sValue1, $sValue2, $sValue3);
                break;
        }

        return $aResult;
    }

    protected function _decreaseValue($sValue, $aReductor = array('px' => 1, 'rem' => 0.0625))
    {
        $sPattern = "/(([0-9\.]+)\s*((px)|(rem))){1}/";

        $aMatches = array();
        if(!preg_match($sPattern, $sValue, $aMatches))
            return $sValue;

        if(!isset($aMatches[2]) || empty($aMatches[4]))
            return $sValue;

        if(!isset($aReductor[$aMatches[4]]))
            return $sValue;

        return ($aMatches[2] - $aReductor[$aMatches[4]]) . $aMatches[4];
    }

    protected function _getColorFromRgba($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = '51, 51, 51';

        $sPattern = "/rgba?\s*\(\s*(([0-9]{1,3}\s*,?\s*){3})\s*([0-9\.]+)?\s*\)/";

        $aMatch = array();
        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !preg_match($sPattern, $sValue, $aMatch) || empty($aMatch[1]))
            $sValue = $sDefault;
        else 
            $sValue = trim($aMatch[1], ', ');

        return $sValue;
    }

    protected function _setMargin($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = '0px';

        $sPattern = "/([0-9\.]+\s*((px)|(rem))\s*){1,4}/";

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || ($sValue != 'inherit' && !preg_match($sPattern, $sValue)))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setColorRgb($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = 'rgb(51, 51, 51)';

        $sPattern = "/rgb\s*\(\s*[0-9]{1,3}\s*,\s*[0-9]{1,3}\s*,\s*[0-9]{1,3}\s*\)/";

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !preg_match($sPattern, $sValue))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setColorRgba($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = 'rgba(51, 51, 51, 1.0)';

        $sPattern = "/rgba?\s*\(\s*([0-9]{1,3}\s*,?\s*){3}\s*([0-9\.]+)?\s*\)/";

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !preg_match($sPattern, $sValue))
            $sValue = $sDefault;

        return $sValue;
    }
    
    protected function _setColorRgbaCustom($sKey, $sOpacity, $sDefault = '')
    {
        $sDefaultColor = $sDefault;
        if(strpos($sDefaultColor, 'rgba') !== false)
            $sDefaultColor = $this->_getColorFromRgba($sDefault);

        return "rgba(" . $this->_getColorFromRgba($sKey, $sDefaultColor) . ", " . $sOpacity . ")";
    }

    protected function _setGradientLeft($sKey, $sDefault = '')
    {
        $sDefaultColor = $sDefault;
        if(strpos($sDefaultColor, 'rgba') !== false)
            $sDefaultColor = $this->_getColorFromRgba($sDefault);

        $sValue = $this->_getColorFromRgba($sKey, $sDefaultColor);
        return "linear-gradient(to right, rgba(" . $sValue . ", 1) 0%, rgba(" . $sValue . ", 0) 100%)";
    }
    
    protected function _setGradientRight($sKey, $sDefault = '')
    {
        $sDefaultColor = $sDefault;
        if(strpos($sDefaultColor, 'rgba') !== false)
            $sDefaultColor = $this->_getColorFromRgba($sDefault);

        $sValue = $this->_getColorFromRgba($sKey, $sDefaultColor);
        return "linear-gradient(to right, rgba(" . $sValue . ", 0) 0%, rgba(" . $sValue . ", 1) 100%)";
    }
    
    /**
     * Can be removed in on of the next versions.
     * 
     * @deprecated since 10.0.0-B2
     * @see BxBaseConfig::_setGradientLeft
     */
    protected function _setGradientMenuPageLeft($sKey, $sDefault = '')
    {
        return $this->_setGradientLeft($sKey, $sDefault);
    }

    /**
     * Can be removed in on of the next versions.
     * 
     * @deprecated since 10.0.0-B2
     * @see BxBaseConfig::_setGradientRight
     */
    protected function _setGradientMenuPageRight($sKey, $sDefault = '')
    {
        return $this->_setGradientRight($sKey, $sDefault);
    }

    protected function _setBgUrl($sKey, $oStorage = null)
    {
        if(empty($oStorage))
            $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');

        $iImageId = (int)getParam($sKey);
        if(empty($iImageId))
            return "none";

        $sImageUrl = $oStorage->getFileUrlById($iImageId);
        if(empty($sImageUrl))
            return "none";

        return "url('" . $sImageUrl . "')";
    }

    protected function _setBgRepeat($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = 'repeat';

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !in_array($sValue, array('no-repeat', 'repeat', 'repeat-x', 'repeat-y')))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setBgAttachment($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = 'scroll';

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !in_array($sValue, array('fixed', 'scroll', 'local')))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setBgSize($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = 'auto';

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !in_array($sValue, array('auto', 'cover', 'contain')))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setShadow($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = '0px 1px 3px 0px rgba(0, 0, 0, 0.25)';

        $sPattern = "/((-?[0-9]+\s*px\s*){4}\s*rgba\s*\(\s*([0-9]{1,3}\s*,\s*){3}\s*[0-9\.]+\s*\)\s*,?\s*)+/";

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || $sValue == 'none')
            $sValue = 'none';
        else if(!preg_match($sPattern, $sValue))
            $sValue = $sDefault;

        return $sValue;
    }
    
    protected function _setShadowCustom($iX, $iY, $iBlur, $iSpread, $sKeyColor, $fOpacity, $sDefault = '')
    {
        return $iX . 'px ' . $iY . 'px ' . $iBlur . 'px ' . $iSpread . 'px ' . $this->_setColorRgbaCustom($sKeyColor, 0.08, 'rgba(0, 0, 0, 0.25)');
    }

    protected function _setShadowFont($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = '0px 1px 3px rgba(0, 0, 0, 0.25)';

        $sPattern = "/(-?[0-9]+\s*px\s*){3}\s*rgba\s*\(\s*([0-9]{1,3}\s*,\s*){3}\s*[0-9\.]+\s*\)/";

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || $sValue == 'none')
            $sValue = 'none';
        else if(!preg_match($sPattern, $sValue))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setAlign($sKey, $sDefault = '')
    {
        if(empty($sDefault))
            $sDefault = 'left';

        $sValue = trim(getParam($sKey));
        if(!$this->_isModule || empty($sValue) || !in_array($sValue, array('left', 'center', 'right')))
            $sValue = $sDefault;

        return $sValue;
    }

    protected function _setAlignFlex($sKey, $sDefault = '')
    {
        $sValue = $this->_setAlign($sKey);

        $aToFlex = array(
            'left' => 'flex-start', 
            'center' => 'center', 
            'right' => 'flex-end'
        );

        if(empty($sDefault))
            $sDefault = 'flex-start';

        return isset($aToFlex[$sValue]) ? $aToFlex[$sValue] : $sDefault;
    }
}

/** @} */
