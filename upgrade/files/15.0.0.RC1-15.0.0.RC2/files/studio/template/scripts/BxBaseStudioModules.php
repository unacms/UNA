<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioModules extends BxDolStudioModules
{
    public function __construct()
    {
        parent::__construct();
    }

    public function getCss()
    {
        return array('module.css');
    }

    public function getJs()
    {
        return array('jquery.anim.js', 'page.js', 'module.js');
    }

    public function getJsClass()
    {
        return $this->sJsClass;
    }

    public function getJsObject()
    {
        return $this->sJsObject;
    }

    public function getJsParams($aParams = array())
    {
        return array_merge(array(
            'sActionUrl' => BX_DOL_URL_STUDIO . $this->sActionUri,
            'sActionsPrefix' => $this->sParamPrefix,
        ), $aParams);
    }

    public function getJsCode($aParams = array(), $mixedWrap = true)
    {
        $sJsObject = $this->getJsObject();
        $sJsClass = $this->getJsClass();

        $aParams = $this->getJsParams($aParams);

        $sContent = bx_replace_markers("var {object} = new {class}({params});", array(
            'object' => $sJsObject, 
            'class' => $sJsClass,
            'params' => json_encode($aParams)
        ));

        return ($mixedWrap === true || (is_array($mixedWrap) && isset($mixedWrap['wrap']) && $mixedWrap['wrap'] === true)) ? BxDolStudioTemplate::getInstance()->_wrapInTagJsCode($sContent) : $sContent;
    }
}

/** @} */
