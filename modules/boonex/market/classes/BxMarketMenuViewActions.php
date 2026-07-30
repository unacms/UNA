<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Market Market
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry social actions menu
 */
class BxMarketMenuViewActions extends BxBaseModTextMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_market';

        parent::__construct($aObject, $oTemplate);
    }

    public function getCode ()
    {
        $sCode = parent::getCode();

        if(!empty($this->_oMenuActions))
            $sCode .= $this->_oMenuActions->getJsCode();

    	return $sCode;
    }
    
    protected function _getMenuItemDownload($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemAddToCart($aItem)
    {
        $mixedResult = $this->_getMenuItemByNameActions($aItem);
        if(!$mixedResult)
            return $mixedResult;

        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi) {
            $oPayment = BxDolPayments::getInstance();

            $iSeller = (int)$this->_aContentInfo[$CNF['FIELD_AUTHOR']];
            $sDescriptor = $oPayment->getCartItemDescriptor($iSeller, $this->_oModule->_oConfig->getId(), (int)$this->_aContentInfo[$CNF['FIELD_ID']], 1);
            return array_merge($mixedResult, [
                'title' => _t('_bx_market_menu_item_title_add_to_cart', $this->_aContentInfo[$CNF['FIELD_PRICE_SINGLE']], ' ' . $oPayment->getCurrencyCode($iSeller)),
                'display_type' => 'callback',
                'data' => [
                    'on_callback' => 'redirect',
                    'request_url' => $this->_sModule . '/add_to_cart_api/&params[]=' . $sDescriptor, 
                    'payment_type' => BX_PAYMENT_TYPE_SINGLE,
                    'seller_id' => $iSeller,
                    'items' => [$sDescriptor],  
                ]
            ]);
        }

        return $mixedResult;
    }

    protected function _getMenuItemSubscribe($aItem)
    {
        $mixedResult = $this->_getMenuItemByNameActions($aItem);
        if(!$mixedResult)
            return $mixedResult;

        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bIsApi) {
            $oPayment = BxDolPayments::getInstance();

            $iSeller = (int)$this->_aContentInfo[$CNF['FIELD_AUTHOR']];
            $sProvider = 'stripe_v3'; //TODO: Payment Provider selector should be realized.
            $sDescriptor = $oPayment->getCartItemDescriptor($iSeller, $this->_oModule->_oConfig->getId(), (int)$this->_aContentInfo[$CNF['FIELD_ID']], 1);
            return array_merge($mixedResult, [
                'title' => _t('_bx_market_menu_item_title_subscribe', $this->_aContentInfo[$CNF['FIELD_PRICE_RECURRING']], ' ' . $oPayment->getCurrencyCode($iSeller), _t('_bx_market_txt_per_' . $this->_aContentInfo[$CNF['FIELD_DURATION_RECURRING']])),
                'display_type' => 'callback',
                'data' => [
                    'on_callback' => 'object',
                    'request_url' => $this->_sModule . '/subscribe_api/&params[]=' . $sProvider . '&params[]=' . $sDescriptor,
                    'object_name' => 'stripe_v3',
                    'payment_type' => BX_PAYMENT_TYPE_RECURRING,
                    'seller_id' => $iSeller,
                    'items' => [$sDescriptor],
                ]
            ]);
        }

        return $mixedResult;
    }

    protected function _getMenuItemUnhideProduct($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemHideProduct($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemEditProduct($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemDeleteProduct($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }
}

/** @} */
