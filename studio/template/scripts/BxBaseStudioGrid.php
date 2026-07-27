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
