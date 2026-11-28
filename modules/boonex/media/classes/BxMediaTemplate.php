<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MediaManager MediaManager
 * @ingroup     UnaModules
 *
 * @{
 */
class BxMediaTemplate extends BxDolModuleTemplate
{
    public function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }
	
    public function getJsCode($sType, $sUniq, $aParams = array(), $mixedWrap = true)
    {
        $sMask = "{var} {object}_{uniq} = new {class}({params});";
        $aMaskMarkers = array();
        if(is_array($mixedWrap)) {
            if(!empty($mixedWrap['mask']))
                $sMask = $mixedWrap['mask'];

            if(!empty($mixedWrap['mask_markers']) && is_array($mixedWrap['mask_markers']))
                $aMaskMarkers = $mixedWrap['mask_markers'];
        }

        $sJsClass = $this->_oConfig->getJsClass($sType);
        if(!empty($aParams['js_class'])) {
            $sJsClass = $aParams['js_class'];
            unset($aParams['js_class']);
        }

        $sJsObject = $this->_oConfig->getJsObject($sType);
        if(!empty($aParams['js_object'])) {
            $sJsObject = $aParams['js_object'];
            unset($aParams['js_object']);
        }

        $sBaseUri = $this->_oConfig->getBaseUri();
        $aParams = array_merge(array(
            'sActionUri' => $sBaseUri,
            'sActionUrl' => BX_DOL_URL_ROOT . $sBaseUri,
            'sObjName' => $sJsObject . '_' . $sUniq,
            'aHtmlIds' => array(),
            'oRequestParams' => array()
        ), $aParams);

        $sContent = bx_replace_markers($sMask, array_merge(array(
            'var' => 'var',
			'uniq' => $sUniq,
            'object' => $sJsObject, 
            'class' => $sJsClass,
            'params' => json_encode($aParams)
        ), $aMaskMarkers));

        return ($mixedWrap === true || (is_array($mixedWrap) && isset($mixedWrap['wrap']) && $mixedWrap['wrap'] === true)) ? $this->_wrapInTagJsCode($sContent) : $sContent;
    }
}

/** @} */
