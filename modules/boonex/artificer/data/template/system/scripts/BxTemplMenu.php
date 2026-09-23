<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

/**
 * @see BxDolMenu
 */
class BxTemplMenu extends BxBaseMenu
{
    public function __construct ($aObject, $oTemplate = false)
    {
        parent::__construct ($aObject, $oTemplate);

        if(isset($aObject['object'])) {
            //--- For page submenus ---//
            if(strpos($aObject['object'], '_submenu') !== false) {
                $this->_bHx = getParam('bx_artificer_use_htmx') == 'on';
                $this->_mHxPreload = $this->_bHx && true;
                $this->_aHx = [
                    'get' => '',
                    'trigger' => 'click',
                    'target' => '#bx-content-wrapper',
                    'swap' => 'outerHTML swap:400ms settle:400ms',
                    'push-url' => 'true',
                    'on::before:swap' => 'oBxArtificerUtils.submenuClickBl(this)',
                    'on::after:swap' => 'oBxArtificerUtils.submenuClickAl(this)'
                ];
            }
        }

        $this->_aOptionalParams['popup'] = '';
    }

    protected function _getTemplateVars()
    {
        return array_merge(parent::_getTemplateVars(), array(
            'html_id' => '',
            'bx_if:show_more_auto_class' => array(
                'condition' => false,
                'content' => array()
            ),
            'js_code' => ''
        ));
    }

    protected function _getMenuItem ($a)
    {
        $aResult = parent::_getMenuItem($a);
        if($aResult === false)
            return $aResult;

        if(!$this->_bIsApi && !empty($a['primary'])) {
            if(!isset($aResult['class_add']))
                $aResult['class_add'] = '';

            $aResult['class_add'] .= ' bx-mi-primary'; 
        }

        return $aResult;
    }
}

/** @} */
