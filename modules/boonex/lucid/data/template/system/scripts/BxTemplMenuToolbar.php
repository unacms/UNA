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
class BxTemplMenuToolbar extends BxBaseMenuToolbar
{
	protected $_bSiteToolbar;

    public function __construct ($aObject, $oTemplate = false)
    {
        parent::__construct ($aObject, $oTemplate);
        
        $this->_bSiteToolbar = $this->_sObject == 'sys_toolbar_site';
    }

    protected function _getMenuItem ($a)
    {
    	//--- Hide system 'Search' from both toolbars, 'bx_lucid_search' replaces it
        if(in_array($a['name'], array('search')))
            return false;

        //--- Hide 'Login' from Member Toolbar
        if(!$this->_bSiteToolbar && in_array($a['name'], array('add-content')))
            return false;

        $a = parent::_getMenuItem ($a);
        if($a === false)
            return $a;

        $a['class_add_a'] = '';
        switch ($a['name']) {
            case 'bx_lucid_search':
                $a['class_add'] = 'bx-def-media-phone-hide';
                break;

            case 'main-menu':
                $a['class_add_a'] = ' cd-dropdown-trigger';
                $a['link'] = 'javascript:void(0)';
                $a['onclick'] = '';
                break;
        }

        return $a;
    }

    protected function _getTmplVarsAddon($mixedAddon, $aMenuItem)
    {
        $aAddon = parent::_getTmplVarsAddon($mixedAddon, $aMenuItem);

        $sAddonF = '';
        if(!empty($aAddon['addon']))
            $sAddonF = $this->_oTemplate->parseHtmlByTemplateName('menu_item_addon_small', array(
                'content' => $aAddon['addon']
            ));

        return array(
            'addon' => $aAddon['addon'],
            'addonf' => $sAddonF
        );
    }
}

/** @} */
