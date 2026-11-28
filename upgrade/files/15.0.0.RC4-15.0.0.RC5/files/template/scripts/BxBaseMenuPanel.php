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
class BxBaseMenuPanel extends BxTemplMenu
{
    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
    }

    protected function _getMenuItem ($aItem)
    {
        // The apps draw the panel themselves (NEO's Application sidebar), so they get each item as any menu gives it:
        // its name and its submenu's name (`submenu`), whose items they ask for. Not the submenu's HTML.
        if($this->_bIsApi) {
            return parent::_getMenuItem($aItem);
        }

        $aHiddenOn = array(
            pow(2, BX_DB_HIDDEN_PHONE - 1) => 'bx-def-media-phone-hide',
            pow(2, BX_DB_HIDDEN_TABLET - 1) => 'bx-def-media-tablet-hide',
            pow(2, BX_DB_HIDDEN_DESKTOP - 1) => 'bx-def-media-desktop-hide',
            pow(2, BX_DB_HIDDEN_MOBILE - 1) => 'bx-def-mobile-app-hide'
        );

        if(isset($aItem['active']) && !$aItem['active'])
            return false;

        if(isset($aItem['visible_for_levels']) && !$this->_isVisible($aItem))
            return false;

        $sMethod = '_getMenuItemContent' . str_replace(' ', '', ucwords(str_replace(['-', '_'], [' ', ' '], $aItem['name'])));
        if(method_exists($this, $sMethod))
            $sTmplItem = $this->$sMethod($aItem);
        else
            $sTmplItem = $this->_getMenuItemContent($aItem);

        if(!$sTmplItem)
            return false;

        $sTmplClass = '';
        if(!empty($aItem['hidden_on']))
            foreach($aHiddenOn as $iHiddenOn => $sClass)
                if((int)$aItem['hidden_on'] & $iHiddenOn)
                    $sTmplClass .= ' ' . $sClass;

        return [
            'class' => trim($sTmplClass),
            'item' => $sTmplItem
        ];
    }

    protected function _getMenuItemContent($aItem)
    {
        $oSubmenu = null;
        if(empty($aItem['submenu_object']) || ($oSubmenu = BxDolMenu::getObjectInstance($aItem['submenu_object'])) === false)
            return false;

        return $oSubmenu->getCode();
    }

    protected function _getMenuItemContentMemberAvatar($aItem)
    {
        return bx_srv('system', 'profile_avatar', [], 'TemplServiceProfiles');
    }
}

/** @} */
