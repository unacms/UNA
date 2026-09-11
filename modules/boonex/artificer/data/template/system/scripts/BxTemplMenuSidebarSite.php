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
class BxTemplMenuSidebarSite extends BxTemplMenu
{
    protected $_sPageUri;
    protected $_aHideFromMenu;

    public function __construct ($aObject, $oTemplate = false)
    {
        parent::__construct ($aObject, $oTemplate);

        list($sPageUrl, $aPageParams) = bx_get_base_url_inline();
        $this->_sPageUri = !empty($aPageParams['i']) ? $aPageParams['i'] : '';

        $this->_aHideFromMenu = ['search', 'more-auto'];
    }

    protected function _getMenuItem ($a)
    {
        if(in_array($a['name'], $this->_aHideFromMenu))
            return false;

        $aResult = parent::_getMenuItem($a);
        if(empty($aResult) || !is_array($aResult))
            return $aResult;
                
        $aTmplVarsSubmenu = [];
        $bTmplVarsSubmenu = false;
        if(($bTmplVarsSubmenu = (!empty($aResult['submenu_object']) && ($oSubmenu = BxDolMenu::getObjectInstance($aResult['submenu_object'])) !== false))) {
            $aResult['bx_if:onclick'] = [
                'condition' => true,
                'content' => [
                    'onclick' => "javascript:return bx_sidebar_dropdown_toggle(this)"
            ]];
            $aResult['class_add'] .= ' bx-si-dropdown-has';
            $aResult['attrs'] .= ' aria-expanded="false"';

            $aSubmenuItems = $oSubmenu->getMenuItemsRaw();
            if($oSubmenu->isHtmx() && !$this->_isSelected($a) && !array_key_exists($this->_sPageUri, $aSubmenuItems))
                $oSubmenu->setHtmx(false);

            $aTmplVarsSubmenu['bx_repeat:submenu_items'] = $oSubmenu->getMenuItems();
        }

        $aResult['bx_if:show_arrow'] = [
            'condition' => false && $bTmplVarsSubmenu,
            'content' => [true],
        ];

        $aResult['bx_if:show_line'] = [
            'condition' => true,
            'content' => [true],
        ];

        $aResult['bx_if:show_submenu'] = [
            'condition' => $bTmplVarsSubmenu,
            'content' => $aTmplVarsSubmenu,
        ];

        return $aResult;
    }
}

/** @} */
