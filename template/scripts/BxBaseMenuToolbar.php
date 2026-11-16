<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenuToolbar extends BxTemplMenu
{
    protected $_sUnitSize;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
        
        $this->_sUnitSize = 'icon';
    }

    public function getMenuItems ()
    {
        $a = parent::getMenuItems ();

        if (!isLogged())
            return $a;

        foreach ($a as $k => $r) {
            if($r['name'] != 'account')
                continue;

            if($a[$k]['bx_if:image']['condition'] || $a[$k]['bx_if:icon-html']['condition'])
                break;

            $oProfile = BxDolProfile::getInstance(bx_get_logged_profile_id());

            $sUnit = $oProfile->getUnit(0, array('template' => array('name' => 'unit_wo_info_links', 'size' => $this->_sUnitSize)));
            if(!empty($sUnit)) {
                $a[$k]['bx_if:icon']['condition'] = false;
                $a[$k]['bx_if:unit'] = array (
                    'condition' => true,
                    'content' => array('unit' => $sUnit),
                );

                break;
            }

            $sThumb = $oProfile->getThumb();
            if(!empty($sThumb)) {
                $a[$k]['bx_if:icon']['condition'] = false;
                $a[$k]['bx_if:image'] = array (
                    'condition' => true,
                    'content' => array('icon_url' => $sThumb),
                );

                break;
            }
        }

        return $a;
    }

    /**
     * A toolbar item opens its module's popup rather than a page, so it is never the page's own menu item. It is the
     * current one while its module's home page is open (the notifications item on the notifications page), as the apps
     * mark it, and takes the selected look (bx-menu-tab-active).
     */
    protected function _isSelected ($a)
    {
        if(parent::_isSelected($a))
            return true;

        if($this->_bIsApi || empty($a['module']) || $a['module'] == 'system' || $a['module'] != self::$SEL_MODULE)
            return false;

        if(!BxDolModuleQuery::getInstance()->isEnabledByName($a['module']) || !($oModule = BxDolModule::getInstance($a['module'])))
            return false;

        $oConfig = $oModule->_oConfig;
        if(empty($oConfig->CNF['URL_HOME']))
            return false;

        parse_str((string)parse_url($oConfig->CNF['URL_HOME'], PHP_URL_QUERY), $aQuery);
        return isset($aQuery['i']) && $aQuery['i'] === self::$SEL_NAME;
    }

    protected function _getMenuItem ($a)
    {
        $a = parent::_getMenuItem ($a);
        if($a === false)
            return $a;

        $a['bx_if:unit'] = array(
        	'condition' => false,
        	'content' => array()
        );

        if (isset($a['class_add']) && ('add-content' == $a['name'] || 'search' == $a['name']))
            $a['class_add'] .= ' bx-def-media-phone-hide';

        return $a;
    }
    
    protected function _getMenuAttrs ($aMenuItem)
    {
        $sAttrs = parent::_getMenuAttrs($aMenuItem);

        if($aMenuItem['name'] == 'apps') 
            $sAttrs .= ' data-dropdown-toggle="sys-menu-apps"';

        return $sAttrs;
    }

    protected function _getTmplVarsAddon($mixedAddon, $aMenuItem)
    {
        $aAddon = parent::_getTmplVarsAddon($mixedAddon, $aMenuItem);

        $sAddonF = '';
        if(!empty($aAddon['addon']))
            $sAddonF = $this->_oTemplate->parseHtmlByTemplateName('menu_item_addon', array(
                'content' => $aAddon['addon']
            ));

        return array(
            'addon' => $aAddon['addon'],
            'addonf' => $sAddonF
        );
    }
}

/** @} */
