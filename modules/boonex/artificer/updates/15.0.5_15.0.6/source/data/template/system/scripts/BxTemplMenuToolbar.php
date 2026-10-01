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
    protected $_aHideFromSiteToolbar;
    protected $_aHideFromMemberToolbar;

    protected $_bSiteToolbar;    

    public function __construct ($aObject, $oTemplate = false)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_aHideFromSiteToolbar = ['search'];
        $this->_aHideFromMemberToolbar = [];

        $this->_bSiteToolbar = $this->_sObject == 'sys_toolbar_site';
    }

    protected function _getMenuItem ($a)
    {
        if(in_array($a['hidden_on'], [7, 15])) 
            return false;

        //--- Update '[Main Menu]' from Site Toolbar
        if($this->_bSiteToolbar && $a['name'] == 'main-menu')
            $a['onclick'] = '';

    	//--- Hide '[Search]' from Site Toolbar
        if($this->_bSiteToolbar && in_array($a['name'], $this->_aHideFromSiteToolbar))
            return false;

        //--- Hide '[+ Add]' from Member Toolbar
        if(!$this->_bSiteToolbar && in_array($a['name'], $this->_aHideFromMemberToolbar))
            return false;

        $a = parent::_getMenuItem ($a);
        if($a === false)
            return $a;

        $a['class_add_a'] = '';

        //--- Each of these items is a disclosure: it opens a sidebar or a popup instead of following a link.
        $sAttrsAdd = '';
        switch ($a['name']) {
            case 'main-menu':
                $a['class_add_a'] = ' bx-sidebar-site-trigger';
                $a['link'] = 'javascript:void(0)';
                $a['onclick'] = '';
                $sAttrsAdd = 'aria-haspopup="dialog" aria-expanded="false" aria-controls="bx-sidebar-site"';
                break;

            case 'account':
                $a['class_add_a'] = ' bx-sidebar-account-trigger';
                $a['link'] = 'javascript:void(0)';
                $a['onclick'] = '';
                $sAttrsAdd = 'aria-haspopup="dialog" aria-expanded="false" aria-controls="bx-sidebar-account"';
                break;

            case 'add-content':
                $a['class_add'] = str_replace('bx-def-media-phone-hide', '',  $a['class_add']);

                if(isset($a['bx_if:onclick']['content']['onclick']))
                    $a['bx_if:onclick']['content']['onclick'] = str_replace('bx_menu_slide_inline', 'bx_menu_popup_inline', $a['bx_if:onclick']['content']['onclick']);

                $sAttrsAdd = 'aria-haspopup="true" aria-expanded="false" aria-controls="bx-sliding-menu-sys_add_content"';
                break;

            case 'notifications-preview':
                if(isset($a['bx_if:onclick']['content']['onclick']))
                    $a['bx_if:onclick']['content']['onclick'] = str_replace(["bx_menu_slide", "'site', "], ['bx_menu_popup'], $a['bx_if:onclick']['content']['onclick']);

                //--- No aria-controls, because bx_menu_popup() creates the popup lazily and the id does not
                //--- exist yet, and no aria-expanded, because the popup is anchored on the ancestor <ul>
                //--- rather than on this link, so nothing is in a position to keep the state honest.
                $sAttrsAdd = 'aria-haspopup="dialog"';
                break;
        }

        if($sAttrsAdd && isset($a['attrs']))
            $a['attrs'] .= ' ' . $sAttrsAdd;

        return $a;
    }
}

/** @} */
