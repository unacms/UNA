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

        //--- '[Main Menu]' opens the site sidebar (see the switch below) instead of the sliding menu
        if($a['name'] == 'main-menu')
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
                //--- The sidebar it opens is for small screens only, wider ones show the main menu inline.
                if(isset($a['class_add']))
                    $a['class_add'] .= ' lg:hidden';
                $a['class_add_a'] = ' bx-sidebar-site-trigger';
                $a['link'] = 'javascript:void(0)';
                $a['onclick'] = '';
                $sAttrsAdd = 'aria-haspopup="dialog" aria-expanded="false" aria-controls="bx-sidebar-site"';
                break;

            case 'login':
            case 'create-account':
                //--- A guest's Log in and Sign up: labelled buttons from the small screens up, Sign up the primary one, as in the
                //--- apps. Phones have them at the top of the main menu's sidebar instead.
                if(isset($a['class_add'])) {
                    $a['class_add'] .= ' bx-menu-toolbar-item-button' . ($a['name'] == 'create-account' ? ' bx-menu-toolbar-item-primary' : '');
                }
                break;

            case 'account':
                //--- The account menu is a popup under the avatar (sys_account_popup, menu_account_popup.html), as in the apps.
                $a['class_add_a'] = ' bx-menu-account-trigger';
                $a['link'] = 'javascript:void(0)';
                $a['onclick'] = '';
                if(isset($a['bx_if:onclick']['content']['onclick'])) {
                    $a['bx_if:onclick']['condition'] = true;
                    $a['bx_if:onclick']['content']['onclick'] = "oBxArtificerUtils.getAccountMenu('#bx-sliding-menu-account', this);";
                }
                $sAttrsAdd = 'aria-haspopup="true" aria-expanded="false" aria-controls="bx-sliding-menu-account"';
                break;

            case 'add-content':
                if(isset($a['class_add']))
                    $a['class_add'] = str_replace('bx-def-media-phone-hide', '',  $a['class_add']);

                if(isset($a['bx_if:onclick']['content']['onclick']))
                    $a['bx_if:onclick']['content']['onclick'] = str_replace('bx_menu_slide_inline', 'bx_menu_popup_inline', $a['bx_if:onclick']['content']['onclick']);

                $sAttrsAdd = 'aria-haspopup="true" aria-expanded="false" aria-controls="bx-sliding-menu-sys_add_content"';
                break;

            case 'search':
                //--- The app gets the item as it is in the menu builder.
                if($this->_bIsApi)
                    break;

                if(isset($a['class_add']))
                    $a['class_add'] = str_replace('bx-def-media-phone-hide', '',  $a['class_add']);

                //--- The button opens the search window (BxBaseSearchWindow, also Cmd/Ctrl+K). Without it the button opens the search page.
                if(getParam('bx_artificer_header_search') == 'on') {
                    $a['link'] = 'javascript:void(0)';
                    $a['bx_if:onclick'] = ['condition' => true, 'content' => ['onclick' => 'bx_site_search_show(this)']];
                    $sAttrsAdd = 'aria-haspopup="dialog" aria-expanded="false" aria-controls="bx-search-window" aria-keyshortcuts="Control+K Meta+K"';
                }
                else {
                    $a['link'] = BX_DOL_URL_ROOT . 'searchKeyword.php';
                    $a['bx_if:onclick'] = ['condition' => false, 'content' => ['onclick' => '']];
                }
                break;

            case 'notifications-preview':
                //--- The popup stays anchored on the ancestor <ul> (the pointer's element), but the link is
                //--- the trigger, so bx_menu_popup() keeps its aria-expanded, which the open look keys on.
                $sAttrsAdd = 'aria-haspopup="dialog"';
                if(isset($a['bx_if:onclick']['content']['onclick'])) {
                    $sOnclick = str_replace(["bx_menu_slide", "'site', "], ['bx_menu_popup'], $a['bx_if:onclick']['content']['onclick']);

                    $sAnchor = "$(this).parents('ul:first')";
                    if(str_contains($sOnclick, $sAnchor . ',') && str_contains($sOnclick, 'pointer:{')) {
                        $sOnclick = str_replace([$sAnchor . ',', 'pointer:{'], ['this,', 'pointer:{el:' . $sAnchor . ', '], $sOnclick);
                        $sAttrsAdd .= ' aria-expanded="false"';
                    }

                    $a['bx_if:onclick']['content']['onclick'] = $sOnclick;
                }

                //--- No aria-controls: bx_menu_popup() creates the popup lazily, so its id does not exist yet.
                break;
        }

        if($sAttrsAdd && isset($a['attrs']))
            $a['attrs'] .= ' ' . $sAttrsAdd;

        return $a;
    }
}

/** @} */
