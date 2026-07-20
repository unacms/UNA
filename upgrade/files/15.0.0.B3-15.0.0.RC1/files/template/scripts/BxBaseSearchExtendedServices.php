<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System services related to Extended Search.
 * 
 * @see BxDolSearchExtended
 */
class BxBaseSearchExtendedServices extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    public function serviceGetForm($mParams)
    {
        $aParams = [];
        if(is_string($mParams)) {
            if(($_mParams = json_decode($mParams, true)) !== null)
                $aParams = $_mParams;
            else
                $aParams['object'] = $mParams;
        }
        else
            $aParams = $mParams;
        $this->prepareParams($aParams);
        
        if(empty($aParams['object']))
            return '';

        $oSearch = BxDolSearchExtended::getObjectInstance($aParams['object']);
        if(!$oSearch || !$oSearch->isEnabled())
            return '';

        return $oSearch->getForm($aParams);
    }

    public function serviceGetSorting($mParams)
    {
        $aParams = [];
        if (is_string($mParams))
            $aParams['object'] = $mParams;
        else
            $aParams = $mParams;
        $this->prepareParams($aParams);

        if(empty($aParams['object']))
            return '';

        $oSearch = BxDolSearchExtended::getObjectInstance($aParams['object']);
        if(!$oSearch || !$oSearch->isEnabled())
            return '';

        return $oSearch->getSorting($aParams);
    }

    public function serviceGetResults($mParams)
    {
        $aParams = [];
        $fProcessDefValues = function($aValues) {
            if(empty($aValues) || !is_array($aValues))
                return;

            foreach($aValues as $sKey => $sValue) {
                if(empty($sValue))
                    continue;

                $_POST[$sKey] = $sValue;
            }
        };

        if(($mDefValues = bx_get('filters')) !== false)
            $fProcessDefValues(json_decode($mDefValues, true));

        if(is_string($mParams)) {
            $aParams = bx_api_get_browse_params($mParams, true);
            if(isset($aParams['filters']))
                $fProcessDefValues($aParams['filters']);
            if(isset($aParams['sort']))
                $fProcessDefValues(['sort' => $aParams['sort']]);
        }
        else
            $aParams = $mParams;

        $this->prepareParams($aParams);

        if(empty($aParams['object']))
            return '';

        $oSearch = BxDolSearchExtended::getObjectInstance($aParams['object']);
        if(!$oSearch || !$oSearch->isEnabled())
            return '';

        $sResults = $oSearch->getResults($aParams);

        if(bx_is_api())
            return $sResults;

        return !empty($sResults) ? $sResults : (isset($aParams['show_empty']) && (bool)$aParams['show_empty'] ? MsgBox(_t('_Empty')) : ''); 
    }

    public function prepareParams(&$aParams)
    {
        $this->_prepareParamEmpty('object', BX_DATA_TEXT, $aParams);
        $this->_prepareParamEmpty('context_id', BX_DATA_INT, $aParams);
        $this->_prepareParamEmpty('template', BX_DATA_TEXT, $aParams);

        if(($sK = 'show_empty') && !isset($aParams[$sK]) && ($iShowEmpty = bx_get($sK)) !== false)
            $aParams[$sK] = (bool)$iShowEmpty;

        if(($sK = 'cond') && empty($aParams[$sK]) && ($sCond = bx_get('cond')) !== false)
            $aParams[$sK] = BxDolSearchExtended::decodeConditions(bx_process_input($sCond, BX_DATA_TEXT));

        $this->_prepareParamIsset('start', BX_DATA_INT, $aParams);
        $this->_prepareParamIsset('per_page', BX_DATA_INT, $aParams);

        if(($sK = 'total') && !isset($aParams[$sK]) && ($mixedTotal = bx_get($sK)) !== false)
            $aParams[$sK] = is_numeric($mixedTotal) ? (int)$mixedTotal : $mixedTotal == 'true';
    }

    protected function _prepareParamEmpty($sParam, $iDataType, &$aParams)
    {
        if(empty($aParams[$sParam]) && ($mixedValue = bx_get($sParam)) !== false)
            $aParams[$sParam] = bx_process_input($mixedValue, $iDataType);
    }

    protected function _prepareParamIsset($sParam, $iDataType, &$aParams)
    {
        if(!isset($aParams[$sParam]) && ($mixedValue = bx_get($sParam)) !== false)
            $aParams[$sParam] = bx_process_input($mixedValue, $iDataType);
    }
}

/** @} */
