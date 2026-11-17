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
class BxBaseMenuAccountNotifications extends BxTemplMenu
{
    /**
     * The profile switcher item: a `{switch_profile}` link. The apps draw the account's profiles for it; the site
     * lists the other profiles in its place (getCode), after the menu's cache, which is shared by an ACL.
     */
    const ITEM_SWITCH_PROFILE = 'switch-profile';
    const LINK_SWITCH_PROFILE = '{switch_profile}';

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $aMarkers = [
            'studio_url' => BX_DOL_URL_STUDIO,
        ];

        if(($oProfile = BxDolProfile::getInstance()) !== false && ($sModule = $oProfile->getModule()) != 'system') {
            $oModule = BxDolModule::getInstance($sModule);
            if($oModule !== null && isset($oModule->_oConfig->CNF['URI_VIEW_ENTRY']))
                $aMarkers['own_profile_url'] = 'page.php?i=' . $oModule->_oConfig->CNF['URI_VIEW_ENTRY'];
        }

        $this->addMarkers($aMarkers);        
    }

    /**
     * The menu, with the profile switcher item replaced by the account's other profiles. The menu itself may come from
     * the cache (per ACL); the list is the viewer's own, so it goes in afterwards.
     */
    public function getCode ()
    {
        $sCode = parent::getCode();
        if(!$sCode || !self::hasSwitchProfileItem($sCode))
            return $sCode;

        return self::replaceSwitchProfileItem($sCode, $this->_getSwitchProfileCode());
    }

    /**
     * Whether the menu's markup has the profile switcher item (its `li`, marked `bx-menu-item-switch-profile`).
     */
    public static function hasSwitchProfileItem ($sCode)
    {
        return (bool)preg_match(self::_getSwitchProfileItemPattern(), (string)$sCode);
    }

    /**
     * The menu's markup with the profile switcher item's `li` replaced by $sSwitcher (empty removes it).
     */
    public static function replaceSwitchProfileItem ($sCode, $sSwitcher)
    {
        $sResult = preg_replace_callback(self::_getSwitchProfileItemPattern(), function () use ($sSwitcher) {
            return $sSwitcher;
        }, (string)$sCode, 1);

        return $sResult === null ? (string)$sCode : $sResult;
    }

    protected static function _getSwitchProfileItemPattern ()
    {
        return '#<li class="[^"]*\bbx-menu-item-' . preg_quote(self::ITEM_SWITCH_PROFILE, '#') . '(?=[\s"])[^>]*>.*?</li>#s';
    }

    /**
     * The account's other profiles, each with its Switch button, as the account popup listed them; empty for an
     * account with one profile.
     */
    protected function _getSwitchProfileCode ()
    {
        $aSwitcher = bx_srv('system', 'account_profile_switcher', [], 'TemplServiceProfiles');
        if(!is_array($aSwitcher) || empty($aSwitcher['content']) || trim($aSwitcher['content']) === '')
            return '';

        return $this->_oTemplate->parseHtmlByName('menu_account_switch_profile.html', [
            'content' => $aSwitcher['content'],
        ]);
    }

    protected function getMenuItemsRaw ()
    {
        return $this->getMenuItemsRawProfileRelated();
    }

    /**
     * Check if menu items is visible with extended checking for friends notifications
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        switch ($a['name']) {
            case 'studio':
                if (!isAdmin())
                    return false;
                break;

            case 'cart':
                $oPayments = BxDolPayments::getInstance();
                if(!$oPayments->isActive())
                    return false;
                break;

            case 'orders':
                $oPayments = BxDolPayments::getInstance();
                if(!$oPayments->isActive())
                    return false;
                break;

            case 'sounds':
                if(!BxDolSounds::getInstance()->isOn('site'))
                    return false;
                break;
        }

        return true;
    }

    /**
     * Sounds steps through the visitor's own level of interface sounds in this browser (full, quiet, off);
     * bx_sound_mark_switches() shows the level on its icon and in its name.
     */
    protected function _getMenuItem ($a)
    {
        // A `{switch_profile}` item added in Studio under another name is the switcher too; the apps match the link.
        if(!$this->_bIsApi && isset($a['link']) && $a['link'] == self::LINK_SWITCH_PROFILE)
            $a['name'] = self::ITEM_SWITCH_PROFILE;

        if($a['name'] == 'sounds')
            $a['attrs_add'] = trim((!empty($a['attrs_add']) ? $a['attrs_add'] : '') . ' role="button" data-bx-sounds-switch="1"');

        return parent::_getMenuItem($a);
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
