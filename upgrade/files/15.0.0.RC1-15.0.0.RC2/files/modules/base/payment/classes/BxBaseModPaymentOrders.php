<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BasePayment Base classes for Payment like modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxBaseModPaymentOrders extends BxDol
{
    protected $MODULE;
    protected $_oModule;

    protected $_bIsApi;

    function __construct()
    {
        parent::__construct();

        $this->_oModule = BxDolModule::getInstance($this->MODULE);

        $this->_bIsApi = bx_is_api();
    }

    /**
     * @page service Service Calls
     * @section bx_base_payment Base Payment
     * @subsection bx_base_payment-integration Integration
     * @subsubsection bx_base_payment-get_orders_url get_orders_url
     * 
     * @code bx_srv('bx_payment', 'get_orders_url', [...], 'Orders'); @endcode
     * 
     * Get orders page URL.
     *
     * @return string with orders page URL.
     * 
     * @see BxBaseModPaymentOrders::serviceGetOrdersUrl
     */
    /** 
     * @ref bx_base_payment-get_orders_url "get_orders_url"
     */
    public function serviceGetOrdersUrl()
    {
    	if(!$this->_oModule->isLogged())
            return '';

    	return $this->_oModule->_oConfig->getUrl('URL_ORDERS');
    }

    /**
     * @page service Service Calls
     * @section bx_base_payment Base Payment
     * @subsection bx_base_payment-integration Integration
     * @subsubsection bx_base_payment-get_pending_orders_url get_pending_orders_url
     * 
     * @code bx_srv('bx_payment', 'get_pending_orders_url', [...], 'Orders'); @endcode
     * 
     * Get pending orders page URL.
     *
     * @return string with pending orders page URL.
     * 
     * @see BxBaseModPaymentOrders::serviceGetPendingOrdersUrl
     */
    /** 
     * @ref bx_base_payment-get_pending_orders_url "get_pending_orders_url"
     */
    public function serviceGetPendingOrdersUrl()
    {
    	if(!$this->_oModule->isLogged())
            return '';

    	return $this->_oModule->_oConfig->getUrl('URL_ORDERS', array('type' => 'pending'));
    }

    /**
     * @page service Service Calls
     * @section bx_base_payment Base Payment
     * @subsection bx_base_payment-integration Integration
     * @subsubsection bx_base_payment-get_orders_count get_orders_count
     * 
     * @code bx_srv('bx_payment', 'get_orders_count', [...], 'Orders'); @endcode
     * 
     * Get processed orders count by type.
     *
     * @param $sType string value with type. For now 'new' type is available only.
     * @param $iProfileId (optional) integer value with profile ID. If empty value is provided then currently logged in profile will be used.
     * @return integer value with orders count.
     * 
     * @see BxBaseModPaymentOrders::serviceGetOrdersCount
     */
    /** 
     * @ref bx_base_payment-get_orders_count "get_orders_count"
     */
    public function serviceGetOrdersCount($sType, $iProfileId = 0)
    {
        if(!in_array($sType, array('new')))
            return 0;

    	$iProfileId = !empty($iProfileId) ? $iProfileId : $this->_oModule->getProfileId();
        if(empty($iProfileId))
            return 0;

        $aOrders = $this->_oModule->_oDb->getOrderProcessed(array('type' => $sType, 'seller_id' => $iProfileId));
        if(empty($aOrders) || !is_array($aOrders))
            return 0;

        return count($aOrders);
    }
}

/** @} */
