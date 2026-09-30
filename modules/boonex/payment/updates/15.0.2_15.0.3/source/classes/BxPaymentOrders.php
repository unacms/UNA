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

class BxPaymentOrders extends BxBaseModPaymentOrders
{
    protected $_sLangsPrefix;

    function __construct()
    {
    	$this->MODULE = 'bx_payment';

    	parent::__construct();

        $this->_sLangsPrefix = $this->_oModule->_oConfig->getPrefix('langs');
    }

	/*
     * Service methods
     */
    
    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-page_blocks Page Blocks
     * @subsubsection bx_payment-get_block_orders get_block_orders
     * 
     * @code bx_srv('bx_payment', 'get_block_orders', [...], 'Orders'); @endcode
     * 
     * Get page block with a list of orders represented as table.
     *
     * @param $sType string value with order type (processed or pending).
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPaymentOrders::serviceGetBlockOrders
     */
    /** 
     * @ref bx_payment-get_block_orders "get_block_orders"
     */
    public function serviceGetBlockOrders($sType = '', $iUserId = BX_PAYMENT_EMPTY_ID)
    {
        if(empty($sType) && bx_get('type') !== false)
            $sType = bx_process_input(bx_get('type'));

        if(empty($sType) || !in_array($sType, array(BX_PAYMENT_ORDERS_TYPE_PENDING, BX_PAYMENT_ORDERS_TYPE_PROCESSED)))
            $sType = BX_PAYMENT_ORDERS_TYPE_PROCESSED;

        if(!$this->_oModule->isLogged())
            return ($sMsg = _t($this->_sLangsPrefix . 'err_required_login')) && $this->_bIsApi ? [bx_api_get_msg ($sMsg)] : [
                'content' => MsgBox($sMsg)
            ];

        $iUserId = $iUserId != BX_PAYMENT_EMPTY_ID ? $iUserId : $this->_oModule->getProfileId();
        if($sType == BX_PAYMENT_ORDERS_TYPE_PROCESSED)
            $this->_oModule->_oDb->updateOrdersProcessed(array('new' => 0), array('seller_id' => $iUserId, 'new' => 1));

        $this->_oModule->setSiteSubmenu('menu_dashboard', 'system', 'dashboard-orders');

        $sBlockTitle = _t($this->_sLangsPrefix . 'page_block_title_orders_' . $sType);
        $sBlockContent = $this->_oModule->_oTemplate->displayBlockOrders($sType, $iUserId);

        $sBlockSubmenu = $this->_oModule->_oConfig->getObject('menu_orders_submenu');
        $oBlockSubmenu = BxDolMenu::getObjectInstance($sBlockSubmenu);
        if($oBlockSubmenu)
            $oBlockSubmenu->setSelected($this->MODULE, 'orders-' . $sType);

        return $this->_bIsApi ? [
            'title' => $sBlockTitle,
            'content' => !$sBlockContent ? [bx_api_get_msg(_t($this->_sLangsPrefix . 'msg_no_results'))] : [bx_api_get_block('grid', $sBlockContent)],
            'menu' => $oBlockSubmenu->getCodeAPI()
        ] : [
            'title' => $sBlockTitle,
            'content' => !$sBlockContent ? MsgBox(_t($this->_sLangsPrefix . 'msg_no_results')) : $sBlockContent,
            'menu' => $oBlockSubmenu
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_orders_info get_orders_info
     * 
     * @code bx_srv('bx_payment', 'get_orders_info', [...], 'Orders'); @endcode
     * 
     * Get transaction(s) which meets all requirements.
     *
     * @param $aConditions an array of pears('key' => 'value'). Available keys are the following:
     * a. license - internal license (string)
     * b. client_id - client's ID (integer)
     * c. seller_id - seller's ID (integer)
     * d. module_id - modules's where the purchased product is located. (integer)
     * e. item_id - item id in the database. (integer)
     * f. date - the date when the payment was processed(UNIXTIME STAMP)
     * @return an array of transactions. Each transaction has full info(client ID, seller ID, external transaction ID, date and so on)
     * 
     * @see BxPaymentOrders::serviceGetOrdersInfo
     */
    /** 
     * @ref bx_payment-get_orders_info "get_orders_info"
     */
    public function serviceGetOrdersInfo($aConditions)
    {
        if(empty($aConditions) || !is_array($aConditions))
            return array();

        return $this->_oModule->_oDb->getOrderProcessed(array('type' => 'mixed', 'conditions' => $aConditions));
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_pending_orders_info get_pending_orders_info
     * 
     * @code bx_srv('bx_payment', 'get_pending_orders_info', [...], 'Orders'); @endcode
     * 
     * Get pending transaction(s) which meets all requirements.
     *
     * @param $aConditions an array of pears('key' => 'value'). The most useful keys are the following:
     * a. client_id - client's ID (integer)
     * b. seller_id - seller's ID (integer)
     * c. type - transaction type: single or recurring (string)
     * d. amount - transaction amount (float)
     * e. order - order ID received from payment provider (string)
     * f. provider - payment provider name (string)
     * g. date - the date when the payment was established(UNIXTIME STAMP)
     * h. processed - whether the payment was processed or not (integer, 0 or 1)
     * @return an array of pending transactions. Each transaction has full info(client ID, seller ID, type, date and so on)
     * 
     * @see BxPaymentOrders::serviceGetPendingOrdersInfo
     */
    /** 
     * @ref bx_payment-get_pending_orders_info "get_pending_orders_info"
     */
    public function serviceGetPendingOrdersInfo($aConditions)
    {
        if(empty($aConditions) || !is_array($aConditions))
            return array();

        return $this->_oModule->_oDb->getOrderPending(array('type' => 'mixed', 'conditions' => $aConditions));
    }

    public function serviceProcessOrder($iSellerId, $iClientId, $iModuleId, $aItems, $sType, $sOrder)
    {
        $mixedResult = $this->addOrder(array(
            'client_id' => $iClientId,
            'seller_id' => $iSellerId,
            'provider' => 'manual',
            'type' => $sType,
            'order' => $sOrder,
            'error_code' => 0,
            'error_msg' => 'Manually processed',        		
            'module_id' => $iModuleId,
            'items' => $aItems
        ), true);

        if(is_array($mixedResult))
            return false;

        return $this->_oModule->registerPayment((int)$mixedResult);
    }

    public function serviceProcessOrderByPending($iPendingId, $sOrder)
    {
        $this->_oModule->_oDb->updateOrderPending($iPendingId, array(
            'order' => $sOrder,
            'error_code' => 0,
            'error_msg' => 'Manually processed'
        ));

        return $this->_oModule->registerPayment($iPendingId);
    }

    public function serviceRefundOrder($sOrder)
    {
        $aPending = $this->_oModule->_oDb->getOrderPending(['type' => 'order', 'order' => $sOrder]);
        if(empty($aPending) || !is_array($aPending))
            return false;

        return $this->_oModule->refundPayment($aPending);
    }

    public function addOrder($aData, $bForce = false)
    {
        $iSellerId = isset($aData['seller_id']) ? (int)$aData['seller_id'] : $this->_oModule->getProfileId();
        if($iSellerId == $aData['client_id'])
            return ['msg' => $this->_sLangsPrefix . 'err_self_purchase'];

        $sOrder = trim($aData['order']);
        if(empty($sOrder))
            return ['msg' => $this->_sLangsPrefix . 'form_processed_input_order_err'];

        $aItems = [];
        $fItemsPrice = 0;
        foreach($aData['items'] as $aItem) {
            if(!$bForce && !$this->_oModule->isAllowedSell(['module_id' => $aData['module_id'], 'item_id' => $aItem['id']], true))
                continue;

            $aItems[] = [
                'author_id' => $iSellerId,
                'module_id' => $aData['module_id'],
                'id' => $aItem['id'],
                'quantity' => $aItem['quantity']
            ];
            $fItemsPrice += $this->_oModule->_oConfig->getPrice($aData['type'], $aItem) * $aItem['quantity'];
        }

        $iPendingId = $this->_oModule->_oDb->insertOrderPending($aData['client_id'], $aData['type'], $aData['provider'], [
            'vendor_id' => $iSellerId, 
            'vendor_currency_code' => $this->_oModule->getVendorCurrencyCode($iSellerId),
            'items_price' => $fItemsPrice, 
            'items' => $aItems
        ]);

        $this->_oModule->_oDb->updateOrderPending($iPendingId, [
            'order' => $sOrder,
            'error_code' => $aData['error_code'],
            'error_msg' => $aData['error_msg']
        ]);

        return (int)$iPendingId;
    }

    public function getOrder($sType, $iId)
    {
        return $this->_oModule->_oTemplate->displayOrder($sType, $iId);
    }

    public function cancel($sType, $iOrderId)
    {
    	$sMethodName = 'getOrder' . bx_gen_method_name($sType);
    	$aOrder = $this->_oModule->_oDb->$sMethodName(array('type' => 'id', 'id' => $iOrderId));
        if(empty($aOrder) || !is_array($aOrder))
            return true;

        if($sType == BX_PAYMENT_ORDERS_TYPE_PROCESSED && !$this->_oModule->callUnregisterCartItem((int)$aOrder['module_id'], array($aOrder['client_id'], $aOrder['seller_id'], $aOrder['item_id'], $aOrder['item_count'], $aOrder['order'], $aOrder['license'])))
            return false;

        $sMethodName = 'deleteOrder' . bx_gen_method_name($sType);
        if(!$this->_oModule->_oDb->$sMethodName($iOrderId))
            return false;

        $this->_oModule->alert('cancel_order', $aOrder['id'], $aOrder['seller_id'], array(
            'type' => $sType,
            'order' => $aOrder
        ));

        return true;
    }
}

/** @} */
