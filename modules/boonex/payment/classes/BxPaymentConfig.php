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

class BxPaymentConfig extends BxBaseModPaymentConfig
{
    protected $_bExtendedMode;
    protected $_bCreditsOnly;

    protected $_iPayAttemptsMax;
    protected $_iPayAttemptsInterval;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $sBaseUrl = BX_DOL_URL_ROOT . $this->getBaseUri();

        $this->CNF = array_merge($this->CNF, [
            // module icon
            'ICON' => 'credit-card',

            // database tables
            'TABLE_COMMISSIONS' => $aModule['db_prefix'] . 'commissions',
            'TABLE_INVOICES' => $aModule['db_prefix'] . 'invoices',

            // page URIs
            'URL_JOIN' => 'page.php?i=payment-join',
            'URL_CARTS' => 'page.php?i=payment-carts',
            'URL_CART' => 'page.php?i=payment-cart',
            'URL_CART_CHECKOUT' => $sBaseUrl . 'initialize_checkout/' . BX_PAYMENT_TYPE_SINGLE . '/',
            'URL_AUTHORIZE' => $sBaseUrl . 'authorize_checkout/',
            'URL_SUBSCRIBE' => $sBaseUrl . 'subscribe/',
            'URL_SUBSCRIBE_JSON' => $sBaseUrl . 'subscribe_json/',
            'URL_SUBSCRIPTIONS' => 'page.php?i=payment-sbs-list-my',
            'URL_HISTORY' => 'page.php?i=payment-history',
            'URL_ORDERS' => 'page.php?i=payment-orders',
            'URL_INVOICES' => 'page.php?i=payment-invoices',
            'URL_DETAILS' => 'page.php?i=payment-details',
            'URL_RETURN' => 'page.php?i=payment-cart-thank-you',
            'URL_RETURN_DATA' => $sBaseUrl . 'finalize_checkout/',
            'URL_RETURN_DATA_API' => 'api.php?r=' . $aModule['name'] . '/finalize_checkout&params[]=',
            'URL_NOTIFY' => $sBaseUrl . 'notify/',
            'URL_CHECKOUT_OFFLINE' => 'page.php?i=payment-checkout-offline',

            'KEY_ARRAY_PRICE_SINGLE' => 'price_single',
            'KEY_ARRAY_PRICE_RECURRING' => 'price_recurring',
            'KEY_ARRAY_PERIOD_RECURRING' => 'period_recurring',
            'KEY_ARRAY_PERIOD_UNIT_RECURRING' => 'period_unit_recurring',
            'KEY_ARRAY_TRIAL_RECURRING' => 'trial_recurring',

            // some params
            'PARAM_SBS_CANCEL_SURVEY' => 'bx_payment_sbs_cancel_survey',
            'PARAM_CURRENCY_EXCHANGE_API' => 'bx_payment_currency_exchange_api',
            'PARAM_CMSN_ENABLE' => 'bx_payment_commissions',
            'PARAM_CMSN_INVOICE_ISSUE_DAY' => 'bx_payment_inv_issue_day', //some day of month
            'PARAM_CMSN_INVOICE_LIFETIME' => 'bx_payment_inv_lifetime', //in days
            'PARAM_CMSN_INVOICE_EXPIRATION_NOTIFY' => 'bx_payment_inv_expiraction_notify', //in days, before expiration date

            // objects
            'OBJECT_FORM_PRELISTS_CURRENCIES' => 'bx_payment_currencies',
            'OBJECT_FORM_PRELISTS_REASONS_CANCEL' => 'bx_payment_reasons_cancel',
            'OBJECT_PP_OFFLINE' => 'offline', //Offline payment provider
            'OBJECT_PP_CREDITS' => 'credits', //Credits payment provider

            'MODULE_CREDITS' => 'bx_credits',

            // some language keys
            'T' => [
                'MSG_ITEM_ADDED' => '_bx_payment_msg_item_added',
                'MSG_ITEM_DELETED' => '_bx_payment_msg_item_deleted',
                'MSG_SINGLE_SELLER_MODE' => '_bx_payment_msg_single_seller',
                'ERR_WRONG_DATA' => '_bx_payment_err_wrong_data',
                'ERR_REQUIRED_LOGIN' => '_bx_payment_err_required_login',
                'ERR_NOT_ACCEPT_PAYMENTS' => '_bx_payment_err_not_accept_payments',
                'ERR_SELF_PURCHASE' => '_bx_payment_err_self_purchase',
                'ERR_INACTIVE_VENDOR' => '_bx_payment_err_inactive_vendor',
                'ERR_UNKNOWN_VENDOR' => '_bx_payment_err_unknown_vendor',

                'BLOCK_TITLE_CART' => '_bx_payment_page_block_title_cart',

                'POPUP_PROVIDERS_SELECT' => '_bx_payment_popup_title_crd_providers_select', 

                'TXT_CART_PROVIDER' => '_bx_payment_txt_cart_'
            ]
        ]);

        $this->_aHtmlIds = array(
            'cart' => array(
                'providers_select' => $this->_sName . '-cart-providers-select-',
            ),
            'history' => array(
                'order_history_view' => $this->_sName . '-order-view-history',
            ),
            'subscription' => array(
                'order_subscription_view' => $this->_sName . '-order-view-subscription',
                'order_subscription_get_details' => $this->_sName . '-order-get-details-subscription',
                'order_subscription_change_details' => $this->_sName . '-order-change-details-subscription',
                'order_subscription_get_billing' => $this->_sName . '-order-get-billing-subscription',
                'order_subscription_change_billing' => $this->_sName . '-order-change-billing-subscription',
                'form_subscription_change_billing' => $this->_sName . '-form-change-billing-subscription',
                'form_subscription_change_details' => $this->_sName . '-form-change-details-subscription',
                'form_subscription_cancel_survay' => $this->_sName . '-form-cancel-subscription-survay-',
                'popup_subscription_cancel_survay' => $this->_sName . '-popup-cancel-subscription-survay-',
            ),
            'pending' => array(
                'order_pending_view' => $this->_sName . '-order-view-pending',
                'order_pending_process' => $this->_sName . '-order-process',
            ),
            'processed' => array(
                'order_processed_view' => $this->_sName . '-order-view-processed',
                'order_processed_add' => $this->_sName . '-order-add',
                'order_processed_client_id' => $this->_sName . '-oa-client-id',
                'order_processed_client' => $this->_sName . '-oa-client',
                'order_processed_items' => $this->_sName . '-oa-items',	
            ),
            'commission' => array(
                'popup_add' => $this->_sName . '-commission-popup-add',
                'popup_edit' => $this->_sName . '-commission-popup-edit',
            ),
            'invoice' => array(
                'popup_edit' => $this->_sName . '-invoice-popup-edit',
            )
        );

        $this->_aPerPage = array(
            'orders' => 10,
            'history' => 10
        );

        $this->_aJsClasses = array(
            'cart' => 'BxPaymentCart',
            'history' => 'BxPaymentOrders',
            'subscription' => 'BxPaymentSubscriptions',
            'pending' => 'BxPaymentOrders',
            'processed' => 'BxPaymentOrders',
            'chargebee_v3' => 'BxPaymentProviderChargebeeV3',
            'stripe' => 'BxPaymentProviderStripe',
            'stripe_v3' => 'BxPaymentProviderStripeV3'
        );

        $this->_aJsObjects = array(
            'cart' => 'oPaymentCart',
            'history' => 'oPaymentOrders',
            'subscription' => 'oBxPaymentSubscriptions',
            'pending' => 'oPaymentOrders',
            'processed' => 'oPaymentOrders',
            'chargebee_v3' => 'oPaymentProviderChargebeeV3',
            'stripe' => 'oPaymentProviderStripe',
            'stripe_v3' => 'oPaymentProviderStripeV3'
        );

        $this->_bExtendedMode = false;
        $this->_bCreditsOnly = false;

        $this->_iPayAttemptsMax = 3;
        $this->_iPayAttemptsInterval = 86400; //--- in sec
    }

    public function init(&$oDb)
    {
        parent::init($oDb);

        $sPrefix = $this->getPrefix('options');

        $this->_bExtendedMode = $this->_oDb->getParam($sPrefix . 'extended_mode') == 'on';
        $this->_bCreditsOnly = $this->_oDb->getParam($sPrefix . 'credits_only') == 'on';
    }

    public function isExtendedMode()
    {
        return $this->_bExtendedMode;
    }

    public function isCreditsOnly()
    {
        return $this->_bCreditsOnly;
    }

    public function getPayAttemptsMax()
    {
        return $this->_iPayAttemptsMax;
    }

    public function getPayAttemptsInterval()
    {
        return $this->_iPayAttemptsInterval;
    }

    public function getPrice($sType, $aItem, $iPrecision = 2)
    {
    	$fPrice = 0;

        switch($sType) {
            case BX_PAYMENT_TYPE_SINGLE:
                $fPrice = $aItem[$this->getKey('KEY_ARRAY_PRICE_SINGLE')];
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $fPrice = $aItem[$this->getKey('KEY_ARRAY_PRICE_RECURRING')];
                break;
        }

        return round((float)$fPrice, $iPrecision);
    }

    public function getPeriod($sType, $aItem)
    {
        $mixedResult = false;

        switch($sType) {
            case BX_PAYMENT_TYPE_SINGLE:
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $mixedResult = [$aItem[$this->getKey('KEY_ARRAY_PERIOD_RECURRING')], $aItem[$this->getKey('KEY_ARRAY_PERIOD_UNIT_RECURRING')]];
                break;
        }

        return $mixedResult;
    }

    public function getTrial($sType, $aItem)
    {
        $iTrial = 0;

        switch($sType) {
            case BX_PAYMENT_TYPE_RECURRING:
                $iTrial = $aItem[$this->getKey('KEY_ARRAY_TRIAL_RECURRING')];
                break;
        }

        return (int)$iTrial;
    }

    public function getModuleId($mixedId)
    {
        if(is_numeric($mixedId))
            return (int)$mixedId;

        if(is_string($mixedId)) {
            $aInfo = $this->_oDb->getModuleByName($mixedId);
            if(!is_array($aInfo) || empty($aInfo['id']))
                $aInfo = $this->_oDb->getModuleByUri($mixedId);

            if(is_array($aInfo) && !empty($aInfo['id']))
                return (int)$aInfo['id'];
        } 

        return 0;
    }

    public function a2s($a, $bEncodeString = true)
    {
        $s = json_encode($a);

        return $bEncodeString ? base64_encode($s) : $s;
    }

    public function s2a($s, $bDecodeString = true)
    {
        if($bDecodeString)
            $s = base64_decode($s);

        return json_decode($s, true);
    }

    public function urlEncode($s)
    {
        return urlencode(base64_encode($s));
    }

    public function urlDecode($s)
    {
        return base64_decode(urldecode($s));
    }

    public function descriptorA2S($a) 
    {
    	return implode($this->getDivider('DIVIDER_DESCRIPTOR'), $a);
    }

    public function descriptorS2A($s) 
    {
    	return explode($this->getDivider('DIVIDER_DESCRIPTOR'), $s);
    }

    public function descriptorsA2S($a) 
    {
    	return implode($this->getDivider('DIVIDER_DESCRIPTORS'), $a);
    }

    /**
     * Conver items to array with necessary structure.
     *
     * @param string/array $mixed - string with cart items divided with (:) or an array of cart items.
     * @param boolean $bDescriptorsOnly - converts a string with cart items to an array of descriptors represented as strings.
     * @return array with items.
     */
    public function descriptorsM2A($mixed, $bDescriptorsOnly = false)
    {
        $aResults = [];

        $aItems = [];
        if(is_string($mixed))
           $aItems = explode($this->getDivider('DIVIDER_DESCRIPTORS'), $mixed);
        else if(is_array($mixed))
           $aItems = $mixed;

        if($bDescriptorsOnly)
            return $aItems;

        foreach($aItems as $mixedItem) {
            $aItem = is_array($mixedItem) ? $mixedItem : $this->descriptorS2A($mixedItem);

            $aResult = ['vendor_id' => $aItem[0], 'module_id' => $aItem[1], 'item_id' => $aItem[2], 'item_count' => $aItem[3]];
            if(isset($aItem[4]))
                $aResult['item_addons'] = $aItem[4];

            $aResults[] = $aResult;
        }

        return $aResults;
    }

    public function putCustom($mDsc, $aCustom, &$aCustoms)
    {
        if(empty($aCustom) || !is_array($aCustom))
            return;

        if(is_array($mDsc))
            $mDsc = $this->descriptorA2S(array_slice($mDsc, 0, 3));

        $aCustoms[$mDsc] = !empty($aCustoms[$mDsc]) && is_array($aCustoms[$mDsc]) ? array_merge($aCustoms[$mDsc], $aCustom) : $aCustom;
    }

    public function getCustom($mDsc, &$aCustoms)
    {
        if(is_array($mDsc))
            $mDsc = $this->descriptorA2S(array_slice($mDsc, 0, 3));

        if(empty($aCustoms) || !is_array($aCustoms) || empty($aCustoms[$mDsc]))
            return array();

        return $aCustoms[$mDsc];
    }

    public function pullCustom($mDsc, &$aCustoms)
    {
        if(is_array($mDsc))
            $mDsc = $this->descriptorA2S(array_slice($mDsc, 0, 3));

        if(empty($aCustoms) || !is_array($aCustoms) || empty($aCustoms[$mDsc]))
            return array();

        $aResult = $aCustoms[$mDsc];
        unset($aCustoms[$mDsc]);           

        return $aResult;
    }

    public function http2https($s)
    {
    	if(strncmp($s, 'https://', 8) === 0)
    		return $s;

        return 'https://' . bx_ltrim_str($s, 'http://');
    }

    public function sortByColumn($sColumn, &$aValues)
    {
        return usort($aValues, function($aV1, $aV2) use ($sColumn) {
            if($aV1[$sColumn] == $aV2[$sColumn])
                return 0;

            return $aV1[$sColumn] < $aV2[$sColumn] ? -1 : 1;
        });
    }
}

/** @} */
