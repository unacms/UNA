<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Payment Payment
 * @ingroup     UnaModules
 * 
 * @{
 */


class BxPaymentGridCarts extends BxBaseModPaymentGridCarts
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct ($aOptions, $oTemplate);
    }
    
    public function getCodeAPI($bForceReturn = false)
    {
        $aData = parent::getCodeAPI($bForceReturn);
        $aData['settings']['field_id'] = 'id';
        foreach ($aData['data'] as &$aRow){
            $aRow['id'] = $aRow['checkbox']['data'];
            $aRow['vendor_id']['value'] = strip_tags($aRow['vendor_id']['value']);
            $aRow['items_price']['value'] = str_replace('&#36; ','$', $aRow['items_price']['value']);
        }
        return $aData;
    }

    protected function _getCellVendorId($mixedValue, $sKey, $aField, $aRow)
    {
    	return parent::_getCellDefault($this->_oModule->_oTemplate->displayProfileLink(array(
            'id' => $mixedValue,
            'name' => $aRow['vendor_name'],
            'title' => _t('_bx_payment_txt_checkout_to', $aRow['vendor_name']),
            'link' => bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_CART'), array('seller_id' => (int)$mixedValue))
    	)), $sKey, $aField, $aRow);
    }

    protected function _getCellItemsPrice($mixedValue, $sKey, $aField, $aRow)
    {
        $sSign = $this->_sCurrencySign;
        if(!$this->_bSingleSeller && !empty($aRow['vendor_currency_sign']))
            $sSign = $aRow['vendor_currency_sign'];

        return parent::_getCellDefault(_t_format_currency_ext($mixedValue, ['sign' => $sSign]), $sKey, $aField, $aRow);
    }

    protected function _getActionContinue ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $sUrl = bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_CART'), array('seller_id' => $aRow['vendor_id']));

        if($this->_bIsApi)
            return array_merge($a, [
                'type' => 'link',
                'name' => $sKey,
                'url' => $sUrl
            ]);

        unset($a['attr']['bx_grid_action_single']);
        $a['attr'] = array_merge($a['attr'], array(
            "onclick" => "window.open('" . $sUrl . "','_self');"
        ));

        return parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getFilterControls ()
    {
    	return '';
    }
    
    protected function _getDataArray($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(empty($this->_aQueryAppend['client_id']))
            return array();

        $this->_aOptions['source'] = array_values($this->_oModule->getObjectCart()->getInfo(BX_PAYMENT_TYPE_SINGLE, $this->_aQueryAppend['client_id']));

        return parent::_getDataArray($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _delete($mixedId)
    {
        return $this->_oCart->serviceDeleteFromCart($mixedId);
    }
}

/** @} */
