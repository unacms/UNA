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
