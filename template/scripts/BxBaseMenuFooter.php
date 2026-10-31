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

    /**
     * The footer's tools. From desktop width they sit on the right, links and text on the left, as in the apps'
     * footer; on smaller screens everything is centred and wraps.
     */
    public const TOOLS = ['switch_language', 'switch_template', 'color_scheme', 'sounds', 'powered_by'];

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

    /**
     * The copyright notice: "© 2026 Site." in full, "© 2026 Site" on phones. The owner is the site title; the full
     * form ends the name with its own full stop, so a title like "Acme Inc." doesn't get a second one.
     */
    public function getCopyright($bShort = false)
    {
        $sOwner = trim((string)getParam('site_title'));

        return $bShort ? _t('_sys_txt_copyright_short', date('Y'), $sOwner) : _t('_sys_txt_copyright_full', date('Y'), rtrim($sOwner, '.'));
    }

    public function getMenuItems ()
    {
        $aItems = parent::getMenuItems();
        $bToolsStart = false;
        foreach($aItems as $iKey => $aItem) {
            switch($aItem['name']) {
                case 'switch_language':
                    $aItems[$iKey] = $this->_getLanguageItem($aItems[$iKey]);
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

            }

            // The page you're on: the footer keeps its link in the foreground colour, and screen readers hear it.
            if(isset($aItems[$iKey]['class_add']) && strpos($aItems[$iKey]['class_add'], 'bx-menu-tab-active') !== false)
                $aItems[$iKey]['attrs'] .= ' aria-current="page"';

            $aItems[$iKey] = $this->_addTitleAttrs($aItems[$iKey]);

            if(!$bToolsStart && in_array($aItem['name'], self::TOOLS)) {
                $aItems[$iKey]['class_add'] = ($aItems[$iKey]['class_add'] ?? '') . ' bx-menu-footer-tools-start';
                $bToolsStart = true;
            }

            $aItems[$iKey] = $this->_addTextOrLink($aItems[$iKey]);
        }

        return $aItems;
    }

    /**
     * As in the apps' footer: the language in use by its code ("EN"), named in full ("Language: English");
     * its menu opens above it and marks the current one.
     */
    protected function _getLanguageItem ($a)
    {
        $sLanguage = BxDolLanguages::getInstance()->getCurrentLangName();
        $aLanguages = BxDolLanguagesQuery::getInstance()->getLanguages(false, true);
        $sLabel = bx_html_attribute(_t('_sys_menu_item_title_switch_language_current', $aLanguages[$sLanguage] ?? $sLanguage));
        $sTitle = $this->_oTemplate->parseHtmlByName('menu_footer_language.html', [
            'code' => bx_process_output($sLanguage)
        ]);

        $a['title'] = $sTitle;
        $a['bx_if:title']['condition'] = true;
        $a['bx_if:title']['content']['title'] = $sTitle;
        $a['attrs'] = preg_replace('/ (title|aria-label)="[^"]*"/', '', $a['attrs']) . ' title="' . $sLabel . '" aria-label="' . $sLabel . '" aria-haspopup="menu" aria-expanded="false"';

        return $a;
    }

    /**
     * The item's tooltip, on its link and on its image, from its title where it has none of its own.
     */
    protected function _addTitleAttrs ($a)
    {
        $bTitleAttr = isset($a['title_attr']);
        $bTitleAttrImage = isset($a['bx_if:image']['content']['title_attr']);
        if($bTitleAttr && $bTitleAttrImage)
            return $a;

        $sTitleAttr = bx_html_attribute(strip_tags($a['title']));

        if(!$bTitleAttr)
            $a['title_attr'] = $sTitleAttr;

        if(!$bTitleAttrImage)
            $a['bx_if:image']['content']['title_attr'] = $sTitleAttr;

        return $a;
    }

    /**
     * An item with neither a link nor a script is text, not a link: the copyright notice, or a line an
     * admin adds in Navigation. menu_footer.html shows the short form on phones.
     */
    protected function _addTextOrLink ($a)
    {
        $bText = $this->_isTextItem($a);
        $aText = $bText ? $this->_getItemText($a) : ['text' => '', 'text_short' => ''];

        $a['bx_if:text'] = [
            'condition' => $bText,
            'content' => [
                'text' => $aText['text'],
                'text_short' => $aText['text_short'],
            ]
        ];
        $a['bx_if:link'] = [
            'condition' => !$bText,
            'content' => $a
        ];

        return $a;
    }

    /**
     * Text items reach the apps as text too, with both forms (`text`, `text_short`) as plain text.
     */
    protected function _getMenuItemAPI ($a)
    {
        $aResult = parent::_getMenuItemAPI($a);

        // The badge has no title: the apps name it, as the site does in its tooltip and aria-label.
        if($a['name'] == 'powered_by')
            $aResult['title_attr'] = _t('_sys_txt_powered_by');

        if(!$this->_isTextItem($a))
            return $aResult;

        $aText = $this->_getItemText($a);
        $fPlain = function($s) {
            return html_entity_decode(strip_tags($s), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        };

        return array_merge($aResult, [
            'display_type' => 'text',
            'link' => '',
            'text' => $fPlain($aText['text']),
            'text_short' => $fPlain($aText['text_short']),
        ]);
    }

    /**
     * The badge reads "Powered by UNA"; its tooltip and accessible name say it in full.
     */
    protected function _getMenuTitle ($a)
    {
        if($a['name'] == 'powered_by')
            return bx_html_attribute(_t('_sys_txt_powered_by'));

        return parent::_getMenuTitle($a);
    }

    protected function _isTextItem ($a)
    {
        $sOnclick = trim(isset($a['onclick']) ? (string)$a['onclick'] : '');

        // A site that still has the old Copyright row (a link to the popup, on_copyright_click) shows it as text too.
        if(isset($a['name']) && $a['name'] == 'copyright' && $sOnclick == 'on_copyright_click()')
            return true;

        return trim(isset($a['link']) ? (string)$a['link'] : '') === '' && $sOnclick === '';
    }

    /**
     * The text of a text item: the copyright notice, else the item's title. HTML-safe.
     */
    protected function _getItemText ($a)
    {
        if($a['name'] == 'copyright')
            return [
                'text' => bx_process_output($this->getCopyright()),
                'text_short' => bx_process_output($this->getCopyright(true)),
            ];

        $sTitle = isset($a['title']) ? _t($a['title']) : '';

        return ['text' => $sTitle, 'text_short' => $sTitle];
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

            // The apps show the badge while the site does: switching the item off in Navigation hides it in both.
            case 'powered_by':
                $bResult = !$this->_bIsApi || !isset($a['active']) || (int)$a['active'] != 0;
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
