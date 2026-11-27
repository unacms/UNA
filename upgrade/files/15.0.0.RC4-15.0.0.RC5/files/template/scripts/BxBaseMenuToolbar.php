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

        // the account item's avatar is site markup; the apps draw their own (an API item carries no template parts)
        if (!isLogged() || $this->_bIsApi)
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
        $bModuleItem = !$this->_bIsApi && !empty($a['module']) && $a['module'] != 'system' && $a['module'] == self::$SEL_MODULE;

        return parent::_isSelected($a) || ($bModuleItem && $this->getModuleHomePage($a['module']) === self::$SEL_NAME);
    }

    /**
     * URI of an enabled module's home page (its URL_HOME, page.php?i=<uri>), or an empty string.
     */
    protected function getModuleHomePage ($sModule)
    {
        $sUri = '';
        if(BxDolModuleQuery::getInstance()->isEnabledByName($sModule) && ($oModule = BxDolModule::getInstance($sModule))) {
            $oConfig = $oModule->_oConfig;
            if(!empty($oConfig->CNF['URL_HOME'])) {
                parse_str((string)parse_url($oConfig->CNF['URL_HOME'], PHP_URL_QUERY), $aQuery);
                $sUri = isset($aQuery['i']) ? (string)$aQuery['i'] : '';
            }
        }

        return $sUri;
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
