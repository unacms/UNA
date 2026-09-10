<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioGridNavigation extends BxTemplStudioGrid
{
    protected $_sFilter;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_sFilter = '';
        if(($sFilter = $this->_getFilterValue()))
            $this->_sFilter = $sFilter;
    }

    public function getModulesSelectAll($sGetItemsMethod, $bShowCustom = true, $bShowSystem = true)
    {
        if(empty($sGetItemsMethod))
            return '';

        $sJsObject = $this->getJsObject();
        $oForm = new BxTemplStudioFormView(array());

        $aInputModules = array(
            'type' => 'select',
            'name' => 'module',
            'attrs' => array(
                'id' => 'bx-grid-module-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_module'),
                'onChange' => 'javascript:$(this).off(\'keyup focusout\'); ' . $sJsObject . '.onChangeFilter()',
        		'onBlur' => 'javascript:' . $sJsObject . '.onChangeFilter()',
            ),
            'value' => '',
            'values' => $this->getModules($bShowCustom, $bShowSystem)
        );

        $aCounter = array();
        $this->oDb->$sGetItemsMethod(array('type' => 'counter_by_modules'), $aCounter, false);
        foreach($aInputModules['values'] as $sKey => $sValue)
                $aInputModules['values'][$sKey] = $aInputModules['values'][$sKey] . " (" . (isset($aCounter[$sKey]) ? $aCounter[$sKey] : "0") . ")";

        $aInputModules['values'] = array_merge(array('' => _t('_adm_nav_txt_all_modules')), $aInputModules['values']);

        return $oForm->genRow($aInputModules);
    }
}

/** @} */
