<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioMenuTop extends BxDolStudioMenuTop
{
    function __construct()
    {
        parent::__construct();
    }

    function getCss()
    {
        return array(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flag-icons/css/|flag-icons.min.css', 'menu_top.css');
    }

    function getJs()
    {
        return array('menu_top.js');
    }

    function getJsObject()
    {
        return 'oBxDolStudioMenuTop';
    }

    function getCode()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aTmplVars = array();
        foreach($this->aItems as $sPosition => $mixedItems) {
            if(!$this->aVisible[$sPosition])
                continue;

            $sContent = "";
            if(is_string($mixedItems) && !empty($mixedItems))
                $sContent = $mixedItems;
            else if(is_array($mixedItems)) {
                $oMenu = new BxTemplStudioMenu($mixedItems);
                $oMenu->addMarkers(array(
                    'js_object' => $this->getJsObject(),
                    'url_root' => BX_DOL_URL_ROOT,
                    'url_studio' => BX_DOL_URL_STUDIO
                ));

                $sContent = $oMenu->getCode();
                if($sPosition == BX_DOL_STUDIO_MT_RIGHT) {
                    $sContent = $oTemplate->parseHtmlByContent($sContent, [
                        'bx_if:show_search' => [
                            'condition' => $this->sPageName == 'home' && getParam('sys_std_show_header_right_search') == 'on',
                            'content' => [
                                'bx_if:show_active' => [
                                    'condition' => false,
                                    'content' => []
                                ]
                            ]
                        ]
                    ]);
                }
            }

            $aTmplVars[] = array(
                'name' => $sPosition,
                'content' => $sContent
            );
        }

        if(empty($aTmplVars))
            return '';

        $oTemplate->addJs($this->getJs());
        $oTemplate->addCss($this->getCss());
        return $oTemplate->parseHtmlByName('menu_top.html', array('bx_repeat:menus' => $aTmplVars));
    }
}

/** @} */
