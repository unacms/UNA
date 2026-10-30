<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Site main menu representation.
 */
class BxBaseMenuFooter extends BxTemplMenu
{
    /**
     * Ids of the menus the footer's Theme and Sounds items open.
     */
    public const POPUP_COLOR_SCHEME = 'bx-menu-footer-color-scheme';
    public const POPUP_SOUNDS = 'bx-menu-footer-sounds';

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
    }

    public function getCode ()
    {
        return parent::getCode() . $this->getSwitcherPopups() . getVersionComment();
    }

    /**
     * The menus of the Theme and Sounds items, for the items the footer shows. They are outside the menu's cache,
     * and the visitor's own choice is marked by script: bx_sound_mark_switches and the template's colour scheme code.
     */
    public function getSwitcherPopups()
    {
        $sResult = '';

        if($this->_isItemShown('color_scheme'))
            $sResult .= BxTemplFunctions::getInstance()->getColorSchemeMenu(self::POPUP_COLOR_SCHEME);

        if($this->_isItemShown('sounds'))
            $sResult .= $this->getSoundsMenu();

        return $sResult;
    }

    public function getSoundsMenu()
    {
        $aIcons = ['full' => 'volume-up', 'quiet' => 'volume-down', 'off' => 'volume-mute'];

        $aItems = [];
        foreach(BxDolSounds::LEVELS as $sLevel)
            $aItems[] = [
                'id' => self::POPUP_SOUNDS . '-' . $sLevel,
                'name' => 'sounds-' . $sLevel,
                'class' => '',
                'link' => 'javascript:void(0)',
                'onclick' => "bx_sound_set_level('" . $sLevel . "'); $('#" . self::POPUP_SOUNDS . "').dolPopupHide();",
                'target' => '',
                'icon' => $aIcons[$sLevel],
                'title' => _t('_sys_txt_sounds_level_' . $sLevel),
                'attrs_add' => 'data-bx-sounds-option="' . $sLevel . '"',
            ];

        $oMenu = new BxTemplMenu(['template' => 'menu_vertical.html', 'menu_id' => self::POPUP_SOUNDS . '-items', 'menu_items' => $aItems], $this->_oTemplate);

        return BxTemplFunctions::getInstance()->transBox(self::POPUP_SOUNDS, $oMenu->getCode(), true);
    }

    public function getMenuItems ()
    {
        $aItems = parent::getMenuItems();
        foreach($aItems as $iKey => $aItem) {
            switch($aItem['name']) {
                case 'switch_language':
                    $sTitle = _t('_sys_menu_item_title_switch_language_mask', $aItems[$iKey]['title'], genFlag());

                    $aItems[$iKey]['title'] = $sTitle;
                    $aItems[$iKey]['bx_if:title']['condition'] = (bool)$sTitle;
                    $aItems[$iKey]['bx_if:title']['content']['title'] = $sTitle;
                    break;

                case 'switch_template':
                    $aTemplates = get_templates_array(true, true);

                    $sTemplateName = $this->_oTemplate->getCode();                    
                    $sTemplateTitle = isset($aTemplates[$sTemplateName]) ? $aTemplates[$sTemplateName] : '';

                    $sTitle = _t('_sys_menu_item_title_switch_template_mask', $aItems[$iKey]['title'], $sTemplateTitle);

                    $aItems[$iKey]['title'] = $sTitle;
                    $aItems[$iKey]['bx_if:title']['condition'] = (bool)$sTitle;
                    $aItems[$iKey]['bx_if:title']['content']['title'] = $sTitle;
                    break;

                case 'copyright':
                    $aItems[$iKey]['title_attr'] = bx_html_attribute(_t('_copyright', date('Y')));
                    break;

                /**
                 * Icon only, as in the apps' footer: the icon shows the current choice and the menu (getSwitcherPopups)
                 * names each one. The item's system title names the button.
                 */
                case 'color_scheme':
                    $aItems[$iKey]['attrs'] .= ' aria-haspopup="menu" aria-expanded="false" data-bx-color-scheme-switch="1"';
                    break;

                case 'sounds':
                    $aItems[$iKey]['attrs'] .= ' aria-haspopup="menu" aria-expanded="false" data-bx-sounds-switch="1"';
                    break;

                case 'powered_by':
                    $sTitleAttr = bx_html_attribute(_t('_sys_txt_powered_by'));

                    $aItems[$iKey]['title_attr'] = $sTitleAttr;
                    $aItems[$iKey]['bx_if:image']['content']['title_attr'] = $sTitleAttr;
                    break;
            }

            // The page you're on: the footer keeps its link in the foreground colour, and screen readers hear it.
            if(isset($aItems[$iKey]['class_add']) && strpos($aItems[$iKey]['class_add'], 'bx-menu-tab-active') !== false)
                $aItems[$iKey]['attrs'] .= ' aria-current="page"';

            $bTitleAttr = isset($aItems[$iKey]['title_attr']);
            $bTitleAttrImage = isset($aItems[$iKey]['bx_if:image']['content']['title_attr']);
            if(!$bTitleAttr || !$bTitleAttrImage) {
                $sTitleAttr = bx_html_attribute(strip_tags($aItems[$iKey]['title']));

                if(!$bTitleAttr)
                    $aItems[$iKey]['title_attr'] = $sTitleAttr;

                if(!$bTitleAttrImage)
                    $aItems[$iKey]['bx_if:image']['content']['title_attr'] = $sTitleAttr;
            }
        }

        return $aItems;
    }

    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        $bResult = true;
        switch ($a['name']) {
            case 'switch_language':
                $aLanguages = BxDolLanguagesQuery::getInstance()->getLanguages(false, true);
                if(count($aLanguages) <= 1)
                    $bResult = false;
                break;

            case 'color_scheme':
                $bResult = BxTemplFunctions::getInstance()->isColorSchemeSwitchable();
                break;

            case 'sounds':
                $bResult = BxDolSounds::getInstance()->isOn('site');
                break;

            case 'switch_template':
                $iTemplates = 0;
                $aTemplates = get_templates_array(true, false);
                foreach($aTemplates as $aTemplate) {
                    $aMixes = $this->_oQuery->getParamsMixes($aTemplate['name'], 1);
                    if(!empty($aMixes) && is_array($aMixes))
                        $iTemplates += count($aMixes);
                    else 
                        $iTemplates += 1;
                }
                if($iTemplates <= 1)
                    $bResult = false;
                break;
        }

        return $bResult;
    }

    /**
     * The apps show the copyright notice in a dialog, as the site does in a popup.
     */
    protected function _getMenuCallbackDataAPI($a)
    {
        if($a['name'] != 'copyright')
            return parent::_getMenuCallbackDataAPI($a);

        return [
            'title' => _t($a['title']),
            'text' => html_entity_decode(strip_tags(_t('_copyright', date('Y'))), ENT_QUOTES | ENT_HTML5, 'UTF-8'),
        ];
    }

    protected function _isItemShown($sName)
    {
        // Items load with the menu; a menu served from its cache hasn't loaded them.
        if(!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw();

        if(empty($this->_aObject['menu_items']) || !is_array($this->_aObject['menu_items']))
            return false;

        foreach($this->_aObject['menu_items'] as $aItem)
            if($aItem['name'] == $sName)
                return !empty($aItem['active']) && $this->_isVisible($aItem);

        return false;
    }
}

/** @} */
