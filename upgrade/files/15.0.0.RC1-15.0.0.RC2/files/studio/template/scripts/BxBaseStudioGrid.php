<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioGrid extends BxDolStudioGrid
{
    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);
    }

    /**
     * Studio grid action glyphs are Lucide: a font-icon name from the action's data is drawn by the Lucide iconset (through its
     * Font Awesome map, Studio's own picks first); an icon Lucide lacks keeps the font glyph.
     */
    protected $_aActionIcons = ['pencil-alt' => 'square-pen'];

    protected function _getActionDefault ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(!$this->_bIsApi && !empty($a['icon']) && preg_match('/^[a-z0-9-]+$/i', $a['icon'])) {
            $sName = isset($this->_aActionIcons[$a['icon']]) ? $this->_aActionIcons[$a['icon']] : $a['icon'];
            if(($sSvg = $this->_getIconLucide($sName)) !== false)
                $a['icon'] = $sSvg;
        }

        return parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    /**
     * The row drag handle is a Lucide grip in every Studio grid.
     */
    protected function _getCellOrder ($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi || ($sSvg = $this->_getIconLucide('grip-vertical')) === false)
            return parent::_getCellOrder($mixedValue, $sKey, $aField, $aRow);

        $sAttr = $this->_convertAttrs(
            $aField, 'attr_cell',
            'bx-def-padding-sec-bottom bx-def-padding-sec-top',
            isset($aField['width']) ? 'width:' . $aField['width'] : false
        );

        return '<td ' . $sAttr . '><div id="' . $this->_sObject . '_cell_' . $aRow[$this->_aOptions['field_id']] . '" class="bx-grid-drag-handle">' . $sSvg . '</div></td>';
    }

    /**
     * Inline Lucide SVG for a Lucide or Font Awesome icon name, or false when Lucide has no such icon.
     */
    protected function _getIconLucide($sName, $aAttrs = [])
    {
        if(empty($sName) || !preg_match('/^[a-z0-9-]+$/i', $sName) || !($oIconset = BxDolIconset::getObjectInstance('sys_lucide')))
            return false;

        return $oIconset->getIconHtml($sName, $aAttrs);
    }

    function getJsObject()
    {
        return '';
    }
    
    public function getModulesSelectOneArray($sGetItemsMethod, $bShowCustom = true, $bShowSystem = true)
    {
        if(empty($sGetItemsMethod))
            return '';

        $aInputModules = array(
            'type' => 'select',
            'name' => 'module',
            'attrs' => array(
                'id' => 'bx-grid-module-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_module'),
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeModule()'
            ),
            'value' => $this->sModule,
            'values' => $this->getModules($bShowCustom, $bShowSystem)
        );

        $aCounter = array();
        $this->oDb->$sGetItemsMethod(array('type' => 'counter_by_modules'), $aCounter, false);
        foreach($aInputModules['values'] as $sKey => $sValue)
            $aInputModules['values'][$sKey] = $aInputModules['values'][$sKey] . " (" . (isset($aCounter[$sKey]) ? $aCounter[$sKey] : "0") . ")";
        
        return $aInputModules;
    }

    public function getModulesSelectOne($sGetItemsMethod, $bShowCustom = true, $bShowSystem = true)
    {
        $aInputModules = $this->getModulesSelectOneArray($sGetItemsMethod, $bShowCustom, $bShowSystem);
        $aInputModules['values'] = array_merge(array('' => _t('_adm_txt_select_module')), $aInputModules['values']);
        $oForm = new BxTemplStudioFormView(array());
        return $oForm->genRow($aInputModules);
    }

    public function getSearchInput()
    {
        return parent::_getSearchInput();
    }

    protected function _getFilterOnChange()
    {
        return $this->getJsObject() . '.onChangeFilter()';
    }

    protected function _getItem($sDbMethod = '')
    {
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return false;

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $aItem = array();
        $this->oDb->$sDbMethod(array('type' => 'by_id', 'value' => $iId), $aItem, false);
        if(!is_array($aItem) || empty($aItem))
            return false;

        return $aItem;
    }

    protected function _getIconPreview($iId, $sIconImage = '', $sIcon = '')
    {
        $bIconImage = !empty($sIconImage);

        $aIcons = BxTemplFunctions::getInstanceWithTemplate($this->_oTemplate)->getIcon($sIcon);
        $sIconHtml = $aIcons[2] . $aIcons[3] . $aIcons[4];
        $bIconHtml = !empty($sIconHtml) && !$bIconImage;

        return $this->_oTemplate->parseHtmlByName('item_icon_preview.html', [
            'id' => $iId,
            'bx_if:show_icon_empty' => [
                'condition' => !$bIconImage && !$bIconHtml,
                'content' => []
            ],
            'bx_if:show_icon_image' => [
                'condition' => $bIconImage,
                'content' => [
                    'js_object' => $this->getJsObject(),
                    'url' => $sIconImage,
                    'id' => $iId
                ]
            ],
            'bx_if:show_icon_html' => [
                'condition' => $bIconHtml,
                'content' => [
                    'icon' => $sIconHtml
                ]
            ]
        ]);
    }

    protected function _getIds()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds))
            return reset($aIds);

        if(($iId = bx_get('id')) !== false) 
            return (int)$iId;

        return false;
    }
}

/** @} */
