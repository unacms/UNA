<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * The member's preferences in "Your account" on the dashboard (sys_account_preferences): Settings, the language and
 * the theme, as buttons. The language button names the language in use and shows while the site has two or more;
 * the theme button shows while the visitor may choose (the template's colour scheme is Auto). Both open the same
 * menus as the footer's switchers. The apps draw their own switchers for these items, by name.
 */
class BxBaseMenuAccountPreferences extends BxTemplMenu
{
    public const POPUP_COLOR_SCHEME = 'bx-menu-account-preferences-color-scheme';

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
    }

    public function getCode ()
    {
        $sCode = parent::getCode();
        if(!$sCode)
            return $sCode;

        // The theme's menu is outside the menu's cache, and the visitor's choice is marked by script.
        if($this->_isItemShown('color-scheme'))
            $sCode .= BxTemplFunctions::getInstance()->getColorSchemeMenu(self::POPUP_COLOR_SCHEME);

        return $sCode;
    }

    public function getMenuItems ()
    {
        $aItems = parent::getMenuItems();
        if($this->_bIsApi)
            return $aItems;

        foreach($aItems as $iKey => $aItem) {
            switch($aItem['name']) {
                case 'switch-language':
                    $aItems[$iKey] = $this->_setTitle($aItem, $this->_getLanguageTitle());
                    $aItems[$iKey]['attrs'] .= ' aria-haspopup="menu" aria-expanded="false"';
                    break;

                case 'color-scheme':
                    $aItems[$iKey]['attrs'] .= ' aria-haspopup="menu" aria-expanded="false" data-bx-color-scheme-switch="1"';
                    break;
            }
        }

        return $aItems;
    }

    protected function _getMenuItemAPI ($a)
    {
        $aResult = parent::_getMenuItemAPI($a);

        if($a['name'] == 'switch-language') {
            $aResult['title'] = $this->_getLanguageTitle();
            $aResult['languages'] = array_keys(BxDolLanguagesQuery::getInstance()->getLanguages(false, true));
        }

        return $aResult;
    }

    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        switch($a['name']) {
            case 'switch-language':
                return count(BxDolLanguagesQuery::getInstance()->getLanguages(false, true)) > 1;

            case 'color-scheme':
                return BxTemplFunctions::getInstance()->isColorSchemeSwitchable();
        }

        return true;
    }

    protected function _isItemShown ($sName)
    {
        if(!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw();

        if(empty($this->_aObject['menu_items']) || !is_array($this->_aObject['menu_items']))
            return false;

        foreach($this->_aObject['menu_items'] as $aItem)
            if($aItem['name'] == $sName)
                return !empty($aItem['active']) && $this->_isVisible($aItem);

        return false;
    }

    /**
     * The language in use, by its name ("English").
     */
    protected function _getLanguageTitle ()
    {
        $sLanguage = BxDolLanguages::getInstance()->getCurrentLangName();
        $aLanguages = BxDolLanguagesQuery::getInstance()->getLanguages(false, true);

        return isset($aLanguages[$sLanguage]) ? $aLanguages[$sLanguage] : $sLanguage;
    }

    protected function _setTitle ($a, $sTitle)
    {
        $a['title'] = $sTitle;
        $a['title_attr'] = bx_html_attribute($sTitle);
        if(isset($a['bx_if:title'])) {
            $a['bx_if:title']['condition'] = (bool)$sTitle;
            $a['bx_if:title']['content']['title'] = $sTitle;
        }

        return $a;
    }
}

/** @} */
