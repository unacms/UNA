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
class BxBaseMenuSwitchLanguage extends BxTemplMenu
{
    protected $_sType;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_sType = str_replace('sys_switch_language_', '', $this->_sObject);
    }

    public function getMenuItems ()
    {
        $this->loadData();

        $aItems = parent::getMenuItems();

        // The language in use, for screen readers too.
        foreach($aItems as $iKey => $aItem)
            if(isset($aItem['class_add']) && strpos($aItem['class_add'], 'bx-menu-tab-active') !== false)
                $aItems[$iKey]['attrs'] = (isset($aItem['attrs']) ? $aItem['attrs'] : '') . ' aria-current="true"';

        return $aItems;
    }

    protected function loadData()
    {
        $aLanguages = BxDolLanguagesQuery::getInstance()->getLanguages(false, true);
        if(empty($aLanguages) || !is_array($aLanguages) || count($aLanguages) < 2)
            return;

        $oModuleQuery = BxDolModuleQuery::getInstance();

        // Items are named 'lang-<name>' (below).
        $sLanguage = BxDolLanguages::getInstance()->getCurrentLangName();
        $this->setSelected('', 'lang-' . $sLanguage);

        list($sPageLink, $aPageParams) = $this->{'getBaseUrl' . bx_gen_method_name($this->_sType)}();

        $oPermalink = BxDolPermalinks::getInstance();
        $sMethod = 'getItemTitle' . bx_gen_method_name($this->_sType);

        $aItems = array();
        foreach( $aLanguages as $sName => $sLang ) {
            $aModule = $oModuleQuery->getModuleByUri($sName);
            if(empty($aModule) || !is_array($aModule) || (int)$aModule['enabled'] == 0)
                continue;

            $aPageParams['lang'] = $sName;

            $sTitle = getParam($aModule['name'] . '_switcher_title');
            if(!empty($sTitle))
                $sLang = $sTitle;

            $aItems[] = array(
                'id' => $sName,
                'name' => 'lang-' . $sName,
                'class' => '',
                'title' => $this->$sMethod($sName, $sLang),
                'target' => '_self',
                'icon' => $this->_sType == 'popup' ? $this->getLanguageGlyph($sName) : '',
                'link' => bx_html_attribute($oPermalink->permalink(bx_append_url_params($sPageLink, $aPageParams))),
                'onclick' => ''
            );
        }

        $this->_aObject['menu_items'] = $aItems;
    }

    protected function getBaseUrlPopup()
    {
        return bx_get_base_url_popup();
    }

    protected function getBaseUrlInline()
    {
        return bx_get_base_url_inline();
    }

    protected function getItemTitlePopup($sName, $sTitle)
    {
        // A language with a glyph shows it as the row's icon (above), as NEO's switcher does; others keep the flag.
        return $this->_oTemplate->parseHtmlByName('menu_switch_language_title.html', [
            'icon' => $this->getLanguageGlyph($sName) ? '' : genFlag($sName),
            'title' => $sTitle
        ]);
    }

    /**
     * The language's code drawn as a glyph ("EN", "RU"), an inline SVG from tagsets
     * (https://github.com/componext/tagsets, the glyphs NEO's language switcher uses), or '' when tagsets has none.
     * Region and script subtags are dropped (pt-BR is "PT"), and Norwegian Bokmål and Nynorsk are "NO".
     */
    protected function getLanguageGlyph($sName)
    {
        static $aCache = [];

        $sCode = strtolower(preg_replace('/[-_].*$/', '', $sName));
        if(in_array($sCode, ['nb', 'nn'])) {
            $sCode = 'no';
        }
        if(!preg_match('/^[a-z]{2,3}$/', $sCode)) {
            return '';
        }

        if(!isset($aCache[$sCode])) {
            $sPath = BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'tagsets/locales/' . $sCode . '.svg';
            $sSvg = file_exists($sPath) ? file_get_contents($sPath) : false;
            $aCache[$sCode] = $sSvg !== false ? trim($sSvg) : '';
        }

        return $aCache[$sCode];
    }

    protected function getItemTitleInline($sName, $sTitle)
    {
        return $this->_oTemplate->parseHtmlByName('menu_switch_language_title.html', [
            'icon' => genFlag($sName),
            'title' => ''
        ]);
    }
}

/** @} */
