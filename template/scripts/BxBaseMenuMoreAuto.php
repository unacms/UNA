<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 *
 * @{
 */

define('BX_DEF_MENU_ITEM_MORE_AUTO', 'more-auto');

class BxBaseMenuMoreAuto extends BxTemplMenu
{
    protected static $_sTmplContentItemMore;
    protected static $_sTmplContentItemMorePopup;

    protected $_sTmplNameItemMore;
    protected $_sTmplNameItemMorePopup;

    protected $_bMoreAuto;
    protected $_iMoreAutoItemsStatic;
    protected $_bMoreAutoItemsStaticOnly;

    protected $_sJsClassMoreAuto;
    protected $_sJsObjectMoreAuto;
    protected $_sJsCallMoreAuto;

    protected $_aHtmlIds;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_sTmplNameItemMore = 'menu_item_more.html';
        $this->_sTmplNameItemMorePopup = 'menu_item_more_popup.html';

        $this->_bMoreAuto = null;
        $this->_iMoreAutoItemsStatic = (int)$aObject['persistent'];
        $this->_bMoreAutoItemsStaticOnly = false;

        $this->_sJsClassMoreAuto = 'BxDolMenuMoreAuto';
        $this->_sJsObjectMoreAuto = 'oMenuMoreAuto' . bx_gen_method_name($this->_sObject);
        $this->_sJsCallMoreAuto = "if(!{js_object}) {var {js_object} = new {js_class}({js_params}); {js_object}.init();}";

        $sPrefix = str_replace('_', '-', $this->_sObject);
        $this->_aHtmlIds = array(
            'main' => $sPrefix,
            'more_auto_popup' => $sPrefix . '-ma-popup',
        );
    }

    public function getCode()
    {
        $sResult = parent::getCode();

        if($this->_isMoreAuto()) {
            $this->_oTemplate->addJs(array('BxDolMenuMoreAuto.js'));

            if(!empty($sResult))
                $sResult = $this->_oTemplate->parseHtmlByName('menu_more_auto.html', array(
                    'menu' => $sResult
                ));
        }

        return $sResult;
    }

    public function isMoreAuto()
    {
        return $this->_isMoreAuto();
    }

    protected function _isMoreAuto()
    {
        if(is_bool($this->_bMoreAuto))
            return $this->_bMoreAuto;

        if(!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw();

        $sItem = BX_DEF_MENU_ITEM_MORE_AUTO;
        if(!empty($this->_aObject['menu_items'][$sItem]) && is_array($this->_aObject['menu_items'][$sItem]) && (int)$this->_aObject['menu_items'][$sItem]['active'] == 1)
            $this->_bMoreAuto = true;
        else
            $this->_bMoreAuto = false;

        return $this->_bMoreAuto;
    }

    protected function _getTemplateVars()
    {
        $aResult = parent::_getTemplateVars();

        $bMoreAuto = $this->_isMoreAuto();

        return array_merge($aResult, [
            'html_id' => $this->_getHtmlIdMain(),
            'bx_if:show_more_auto_class' => [
                'condition' => $bMoreAuto,
                'content' => []
            ],
            'js_code' => $bMoreAuto ? $this->_getJsCodeMoreAuto() : ''
        ]);
    }

    protected function _getJsCodeMoreAuto()
    {
        return $this->_oTemplate->_wrapInTagJsCode(bx_replace_markers($this->_sJsCallMoreAuto, [
            'js_class' => $this->_getJsClassMoreAuto(),
            'js_object' => $this->_getJsObjectMoreAuto(),
            'js_params' => json_encode([
                'sObject' => $this->_sObject,
                'iItemsStatic' => $this->_iMoreAutoItemsStatic,
                'bItemsStaticOnly' => $this->_bMoreAutoItemsStaticOnly ? 1 : 0,
                'aHtmlIds' => $this->_getHtmlIds()
            ])
        ]));
    }

    protected function _getMenuItem ($aItem)
    {
        $aItem['popup'] = '';

        if($aItem['name'] != BX_DEF_MENU_ITEM_MORE_AUTO)
            return parent::_getMenuItem($aItem);

        $aItem['onclick'] = $this->_getJsObjectMoreAuto() . '.more(this);';
        $aItem['popup'] = BxTemplFunctions::getInstance()->transBox($this->_aHtmlIds['more_auto_popup'], $this->_oTemplate->parseHtmlByContent($this->_getTmplContentItemMorePopup(), array(
            'content' => ''
        )), true);

        return parent::_getMenuItem($aItem);
    }

    /**
     * The 'more' trigger opens a popup that is rendered next to it (the __popup__ marker), so it is a disclosure
     * for a dialog, not a plain link. Its accessible name comes from the generic title/title_system handling in
     * BxBaseMenu::_getMenuTitle().
     */
    protected function _getMenuAttrs ($aMenuItem)
    {
        $sAttrs = parent::_getMenuAttrs($aMenuItem);

        if(!empty($aMenuItem['name']) && $aMenuItem['name'] == BX_DEF_MENU_ITEM_MORE_AUTO)
            $sAttrs .= ' aria-haspopup="dialog" aria-expanded="false" aria-controls="' . bx_html_attribute($this->_aHtmlIds['more_auto_popup']) . '"';

        return $sAttrs;
    }

    protected function _getHtmlIds()
    {
        return $this->_aHtmlIds;
    }

    protected function _getHtmlIdMain()
    {
        return $this->_aHtmlIds['main'];
    }

    protected function _getJsClassMoreAuto()
    {
        return $this->_sJsClassMoreAuto;
    }

    protected function _getJsObjectMoreAuto()
    {
        return $this->_sJsObjectMoreAuto;
    }
    
    protected function _getTmplContentItemMore()
    {
        if(empty(self::$_sTmplContentItemMore))
            self::$_sTmplContentItemMore = $this->_oTemplate->getHtml($this->_sTmplNameItemMore);

        return self::$_sTmplContentItemMore;
    }

    protected function _getTmplContentItemMorePopup()
    {
        if(empty(self::$_sTmplContentItemMorePopup))
            self::$_sTmplContentItemMorePopup = $this->_oTemplate->getHtml($this->_sTmplNameItemMorePopup);

        return self::$_sTmplContentItemMorePopup;
    }
}

/** @} */
