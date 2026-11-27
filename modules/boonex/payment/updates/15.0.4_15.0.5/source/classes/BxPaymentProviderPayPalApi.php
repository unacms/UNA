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

/*
 * 1. Set up server-side SDK:
 * https://developer.paypal.com/docs/business/checkout/server-side-api-calls/set-up-sdk/
 * 
 * 2. Orders API
 * https://developer.paypal.com/docs/api/orders/v2
 * 
 * 2.1. Checkout SDK in GitHUB
 * https://github.com/paypal/Checkout-PHP-SDK/
 * 
 * 3. Subscriptions:
 * https://developer.paypal.com/docs/subscriptions/
 * https://developer.paypal.com/docs/business/subscriptions/
 * 
 * 3.1. API
 * https://developer.paypal.com/docs/api/subscriptions/v1
 * https://developer.paypal.com/docs/api/catalog-products/v1
 * 
 * 3.2. Integration
 * https://developer.paypal.com/docs/subscriptions/integrate/
 * 
 * 3.3 WebHooks
 * https://developer.paypal.com/docs/api-basics/notifications/webhooks/rest/
 * 
 * 4. Authorize Intent and Capture Authorized: 
 * https://github.com/paypal/Checkout-PHP-SDK/tree/develop/samples
 * 
 */

use PayPalHttp\HttpException;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Core\ProductionEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use PayPalCheckoutSdk\Orders\OrdersGetRequest;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
use PayPalCheckoutSdk\Orders\OrdersAuthorizeRequest;
use PayPalCheckoutSdk\Payments\AuthorizationsCaptureRequest;

define('PP_API_MODE_LIVE', 1);
define('PP_API_MODE_TEST', 2);
define('PP_API_MODE_DEFAULT', PP_API_MODE_LIVE);

define('PP_API_SBS_STATUS_APPROVAL_PENDING', 'APPROVAL_PENDING');
define('PP_API_SBS_STATUS_APPROVED', 'APPROVED');
define('PP_API_SBS_STATUS_ACTIVE', 'ACTIVE');

class BxPaymentProviderPayPalApi extends BxBaseModPaymentProvider implements iBxBaseModPaymentProvider
{
    protected $_oSession;
    protected $_sSessionKeyOrder;
    protected $_sSessionKeySubscription;

    protected $_bCheckAmount;
    protected $_iMode;
    protected $_sEndpoint;
    protected $_sToken;

    function __construct($aConfig)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct($aConfig);

        $this->_oSession = BxDolSession::getInstance();
        $this->_sSessionKeyOrder = $this->MODULE . '_' . $this->_sPrefix . 'order';
        $this->_sSessionKeySubscription = $this->MODULE . '_' . $this->_sPrefix . 'subscription';

        $this->_bCheckAmount = true;
        $this->_iMode = (int)$this->getOption('mode');
        $this->_sEndpoint = 'https://api-m' . ($this->_iMode == PP_API_MODE_TEST ? '.sandbox' : '') . '.paypal.com/';
    }

    public function authorizeCheckout($iPendingId, $aCartInfo)
    {
        if(empty($aCartInfo['items']) || !is_array($aCartInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_items';

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return $this->_sLangsPrefix . 'err_already_processed';

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $mixedResult = $this->_createOrder($iPendingId, $aCartInfo, ['intent' => 'authorize']);
                if($mixedResult === false)
                    return $this->_sLangsPrefix . 'err_cannot_perform';

                $this->_setSessionOrder($mixedResult['order']);
                return [
                    'code' => BX_PAYMENT_RESULT_SUCCESS,
                    'redirect' => $mixedResult['redirect']
                ];

            case BX_PAYMENT_TYPE_RECURRING:
                return $this->_sLangsPrefix . 'err_not_supported';
        }
    }

    public function captureAuthorizedCheckout($sOrderAuth, $mixedPending, $aInfo)
    {
        $aPending = is_array($mixedPending) ? $mixedPending : $this->_oModule->_oDb->getOrderPending(['type' => 'id', 'id' => (int)$mixedPending]);
        if(empty($aPending) || !is_array($aPending))
            return ['code' => 2, 'message' => $this->_sLangsPrefix . 'err_empty_order'];

        $mixedResult = false;
        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $mixedResult = $this->_captureAuthorization($sOrderAuth);
                if($mixedResult === false)
                    return ['code' => 3, 'message' => $this->_sLangsPrefix . 'err_cannot_perform'];
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                return ['code' => 1, 'message' => $this->_sLangsPrefix . 'err_not_supported'];
        }

        $aResult = [
            'code' => BX_PAYMENT_RESULT_SUCCESS,
            'message' => $this->_sLangsPrefix . 'pp_api_msg_captured',
            'pending_id' => $aPending['id'],
            'paid' => true
        ];

        //--- Update pending transaction
        $this->_oModule->_oDb->updateOrderPending($aResult['pending_id'], [
            'order' => $mixedResult['order'],
            'error_code' => $aResult['code'],
            'error_msg' => _t($aResult['message']),
        ]);

        return $aResult;
    }

    public function initializeCheckout($iPendingId, $aCartInfo)
    {
        if(empty($aCartInfo['items']) || !is_array($aCartInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_items';

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return $this->_sLangsPrefix . 'err_already_processed';

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $mixedResult = $this->_createOrder($iPendingId, $aCartInfo);
                if($mixedResult === false)
                    return $this->_sLangsPrefix . 'err_cannot_perform';

                $this->_setSessionOrder($mixedResult['order']);
                header("Location: " . $mixedResult['redirect']);
                exit;

            case BX_PAYMENT_TYPE_RECURRING:
                $mixedResult = $this->_createSubscription($iPendingId, $aCartInfo);
                if(is_string($mixedResult))
                    return $mixedResult;

                $this->_setSessionSubscription($mixedResult['subscription']);
                return array(
                    'code' => 0,
                    'redirect' => $mixedResult['redirect'],
                );
        }
    }

    /**
     * The order and its pending order (custom_id, reference_id) are read from
     * PayPal's API, not from the request.
     */
    public function isFinalizeVerified()
    {
        return true;
    }

    public function finalizeCheckout(&$aData)
    {
        $sMethod = '_finalizeCheckout' . bx_gen_method_name(!empty($aData['subscription_id']) && !empty('ba_token') ? BX_PAYMENT_TYPE_RECURRING : BX_PAYMENT_TYPE_SINGLE);

        $aResult = $this->$sMethod($aData);
        if(!isset($aResult['code']) || (int)$aResult['code'] != BX_PAYMENT_RESULT_SUCCESS) {
            $this->log($aResult, 'Finalize Checkout Failed:', BX_LOG_ERR);
            $this->log($aData, 'Finalize Checkout Input:', BX_LOG_ERR);
        }

        return $aResult;
    }

    public function notify()
    {
        $iResult = $this->_processEvent();
        http_response_code($iResult);
    }

    public function getClientId()
    {
        return $this->getOption($this->_getMode() . '_client_id');
    }

    public function getSecret()
    {
        return $this->getOption($this->_getMode() . '_secret');
    }

    public function getMenuItemsActionsRecurring($iClientId, $iVendorId, $aParams = array())
    {
        return [];
    }

    public function cancelRecurring($iPendingId, $sCustomerId, $sSubscriptionId)
    {
        return $this->_cancelSubscription($sSubscriptionId);
    }

    protected function _finalizeCheckoutSingle(&$aData)
    {
        $sOrder = '';
        if(!empty($aData['token']))
            $sOrder = bx_process_input($aData['token']);
        if(empty($sOrder))
            $sOrder = $this->_getSessionOrder();
        if(empty($sOrder))
            return['code' => 1, 'message' => $this->_sLangsPrefix . 'err_empty_order'];

        $aOrder = $this->_getOrder($sOrder);
        if(empty($aOrder) || !is_array($aOrder))
            return ['code' => 1, 'message' => $this->_sLangsPrefix . 'err_empty_order'];

        $sMessage = '';
        $bAuthorized = $bPaid = false;
        switch($aOrder['intent']) {
            case 'authorize':
                $mixedResult = $this->_authorizeOrder($sOrder);
                if($mixedResult === false)
                    return ['code' => 2, 'message' => $this->_sLangsPrefix . 'pp_api_err_cannot_authorize'];

                $sMessage = $this->_sLangsPrefix . 'pp_api_msg_authorized';
                $bAuthorized = true;
                break;

            case 'capture':
                $mixedResult = $this->_captureOrder($sOrder);
                if($mixedResult === false)
                    return ['code' => 2, 'message' => $this->_sLangsPrefix . 'pp_api_err_cannot_capture'];

                $sMessage = $this->_sLangsPrefix . 'pp_api_msg_captured';
                $bPaid = true;
                break;
        }

        $aResult = [
            'code' => BX_PAYMENT_RESULT_SUCCESS, 
            'message' => $sMessage,
            'pending_id' => $mixedResult['pending_id'],
            'client_name' => _t($this->_sLangsPrefix . 'txt_buyer_name_mask', $mixedResult['client_first_name'], $mixedResult['client_last_name']),
            'client_email' => $mixedResult['client_email'],
            'authorized' => $bAuthorized,
            'paid' => $bPaid
        ];

        //--- Update pending transaction
        $this->_oModule->_oDb->updateOrderPending($aResult['pending_id'], [
            'order' => $mixedResult['order'],
            'error_code' => $aResult['code'],
            'error_msg' => _t($aResult['message']),
        ]);

        return $aResult;
    }

    protected function _finalizeCheckoutRecurring(&$aData)
    {
        $sSubscription = '';
        if(!empty($aData['subscription_id']))
            $sSubscription = bx_process_input($aData['subscription_id']);
        if(empty($sSubscription))
            $sSubscription = $this->_getSessionSubscription();
        if(empty($sSubscription))
            return array('code' => 1, 'message' => $this->_sLangsPrefix . 'pp_api_err_no_subscription');

        $aSubscription = $this->_getSubscription($sSubscription);
        if(empty($aSubscription) || !in_array($aSubscription['status'], array(PP_API_SBS_STATUS_APPROVAL_PENDING, PP_API_SBS_STATUS_APPROVED, PP_API_SBS_STATUS_ACTIVE)))
            return array('code' => 2, 'message' => $this->_sLangsPrefix . 'pp_api_err_no_subscription');

        $aSubscriber = $this->_getClientInfo($aSubscription['subscriber']);
        list($bPaid, $bTrial) = $this->_getBillingStatus($aSubscription['billing_info']);

        $aResult = array(
            'code' => BX_PAYMENT_RESULT_SUCCESS, 
            'message' => $this->_sLangsPrefix . 'pp_api_msg_subscribed',
            'pending_id' => $aSubscription['custom_id'],
            'customer_id' => $aSubscription['subscriber']['payer_id'], 
            'subscription_id' => $sSubscription,
            'client_name' => _t($this->_sLangsPrefix . 'txt_buyer_name_mask', $aSubscriber['client_first_name'], $aSubscriber['client_last_name']),
            'client_email' => $aSubscriber['client_email'],
            'trial' => $bTrial,
        );

        if($aSubscription['status'] == PP_API_SBS_STATUS_APPROVAL_PENDING)       
            $aResult = array_merge($aResult, array(
                'code' => 3,
                'message' => $this->_sLangsPrefix . 'pp_api_err_subscription_not_confirmed'
            ));

        //--- Update pending transaction
        $this->_oModule->_oDb->updateOrderPending($aResult['pending_id'], array(
            'order' => $sSubscription,
            'error_code' => $aResult['code'],
            'error_msg' => _t($aResult['message'])
        ));

        return $aResult;
    }

    /**
     * Methods which use common HTTPS calls to process Recurring time payments.
     */
    protected function _createSubscription($iPendingId, $aCartInfo, $sReturnType = 'approve')
    {
        $aItem = array_shift($aCartInfo['items']);
        if(empty($aItem) || !is_array($aItem))
            return $this->_sLangsPrefix . 'pp_api_err_no_item';

        $aItem['price_currency'] = $aCartInfo['vendor_currency_code'];

        $aProduct = $this->_getProduct($aItem['name']);
        if(empty($aProduct)) {
            $aProduct = $this->_createProduct($aItem);
            if($aProduct === false)
                return $this->_sLangsPrefix . 'err_cannot_perform';
        }

        $aProductPlan = [];

        $aPlans = $this->_getPlans($aProduct['id']);
        if(!$this->_validateProduct($aItem, $aProduct, $aPlans))
            return $this->_sLangsPrefix . 'pp_api_err_wrong_item';

        if(!empty($aPlans)) 
            foreach($aPlans as $aPlan)
                if(strcmp($aPlan['name'], $aItem['name']) == 0) {
                    $aProductPlan = $aPlan;
                    break;
                }
        
        if(empty($aProductPlan) || !is_array($aProductPlan)) {
            $aProductPlan = $this->_createPlan($aProduct['id'], $aItem);
            if($aProductPlan === false)
                return $this->_sLangsPrefix . 'err_cannot_perform';
        }

        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/billing/subscriptions', array(
            'plan_id' => $aProductPlan['id'],
            'custom_id' => $iPendingId,
            'application_context' => array(
                'cancel_url' => $aItem['url'],
                'return_url' => $this->getReturnDataUrl($aCartInfo['vendor_id'])
            )
        ));

        if($mixedResult === false || empty($mixedResult['id']) || empty($mixedResult['links'])) {
            $this->log($mixedResult, 'Create Subscription:', BX_LOG_ERR);
            
            return $this->_sLangsPrefix . 'err_cannot_perform';
        }

        $mixedLink = false;
        foreach($mixedResult['links'] as $aLink)
            if($aLink['rel'] == $sReturnType) {
                $mixedLink = $aLink['href'];
                break;
            }

        return array(
            'subscription' => $mixedResult['id'],
            'redirect' => $mixedLink
        );
    }

    protected function _getSubscription($sSubscriptionId)
    {
        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/billing/subscriptions/' . $sSubscriptionId, array(), array(), 'get');
        if($mixedResult === false || !isset($mixedResult['id'])) {
            $this->log($mixedResult, 'Get Subscription:', BX_LOG_ERR);

            return array();
        }

        return $mixedResult;
    }

    protected function _cancelSubscription($sSubscriptionId)
    {
        list($sCode, $sResponse) = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/billing/subscriptions/' . $sSubscriptionId . '/cancel', [
            'reason' => 'Not needed anymore'
        ], [], 'post-json', true);

        if($sCode != 204) {
            $this->log($sResponse, 'Cancel Subscription:', BX_LOG_ERR);

            return false;
        }

        return true;
    }

    protected function _createProduct($aItem)
    {
        if(empty($aItem['description']))
            $aItem['description'] = _t('_bx_payment_txt_payment_description', getParam('site_title'));
        $aItem['description'] = strmaxtextlen($aItem['description'], 60, '...');

        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/catalogs/products', array(
            'id' => $aItem['name'],
            'name' => $aItem['title'],
            'description' => $aItem['description'],
            'type' => 'DIGITAL',
            'home_url' => $aItem['url'],
        ), array(
            'PayPal-Request-Id: bx_prod_' . $aItem['name']
        ));

        if($mixedResult === false || !isset($mixedResult['id'])) {
            $this->log($mixedResult, 'Create Product:', BX_LOG_ERR);

            return false;
        }

        return $mixedResult;
    }
    
    protected function _getProduct($sProductId)
    {
        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/catalogs/products/' . $sProductId, array(), array(), 'get');
        if($mixedResult === false || !isset($mixedResult['id'])) {
            $this->log($mixedResult, 'Get Product:', BX_LOG_ERR);

            return array();
        }

        return $mixedResult;
    }
    
    protected function _validateProduct($aItem, $aProduct, $aPlans)
    {
        //--- by date creation.
        if(isset($aItem['added'], $aProduct['create_time']) && $aItem['added'] > strtotime($aProduct['create_time']))
            return false;

        return true;
    }

    protected function _createPlan($sProductId, $aItem)
    {
        $aCycles = array();

        $sIntervalUnit = $this->_getIntervalUnit($aItem['period_unit_recurring']);
        if($sIntervalUnit === false)
            return false;

        $iSequence = 1;

        $iTrial = $this->_oModule->_oConfig->getTrial(BX_PAYMENT_TYPE_RECURRING, $aItem);
        if(!empty($iTrial)) 
            $aCycles[] = array(
                'frequency' => array(
                    'interval_unit' => $this->_getIntervalUnit(BX_PAYMENT_SBS_PU_DAY),
                    'interval_count' => $iTrial
                ),
                'tenure_type' => 'TRIAL',
                'sequence' => $iSequence++,
                'total_cycles' => 1,
            );

        $aCycles[] = array(
            'frequency' => array(
                'interval_unit' => $sIntervalUnit,
                'interval_count' => (int)$aItem['period_recurring']
            ),
            'tenure_type' => 'REGULAR',
            'sequence' => $iSequence,
            'total_cycles' => 0,
            'pricing_scheme' => array(
                'fixed_price' => array(
                    'value' => $this->_oModule->_oConfig->getPrice(BX_PAYMENT_TYPE_RECURRING, $aItem),
                    'currency_code' => $aItem['price_currency']
                )
            )
        );

        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/billing/plans', array(
            'product_id' => $sProductId,
            'name' => $aItem['name'],
            'description' => $aItem['title'],
            'billing_cycles' => $aCycles,
            'payment_preferences' => array(
                'auto_bill_outstanding' => true,
                'setup_fee' => array(
                    'value' => 0,
                    'currency_code' => $aItem['price_currency']
                ),
                'setup_fee_failure_action' => 'CONTINUE',
                'payment_failure_threshold' => 3
            ),
        ), array(
            'PayPal-Request-Id: bx_plan_' . $aItem['name']
        ));

        if($mixedResult === false || !isset($mixedResult['id'])) {
            $this->log($mixedResult, 'Create Plan:', BX_LOG_ERR);

            return false;
        }

        return $mixedResult;
    }

    protected function _getPlan($sPlanId)
    {
        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/billing/plans/' . $sPlanId, array(), array(), 'get');
        if($mixedResult === false || !isset($mixedResult['id'])) {
            $this->log($mixedResult, 'Get Plan:', BX_LOG_ERR);

            return array();
        }

        return $mixedResult;
    }

    protected function _getPlans($sProductId, $iStart = false, $iPerPage = false)
    {
        $aParams = array(
            'product_id' => $sProductId,
        );
        
        if($iStart !== false)
            $aParams['page'] = (int)$iStart >= 1 && (int)$iStart <= 100000 ? $iStart : 1;
        if($iPerPage !== false)
            $aParams['page_size'] = (int)$iPerPage >= 1 && (int)$iPerPage <= 20 ? $iPerPage : 20;

        $mixedResult = $this->_apiCallAuthorized($this->_sEndpoint . 'v1/billing/plans', $aParams, array(), 'get');
        if(empty($mixedResult) || !is_array($mixedResult) || !isset($mixedResult['plans'])) {
            $this->log($mixedResult, 'Get Plans:', BX_LOG_ERR);

            return array();
        }

        return $mixedResult['plans'];
    }

    protected function _getToken()
    {
        $mixedResult = $this->_apiCallAuthorize($this->_sEndpoint . 'v1/oauth2/token', [
            'grant_type' => 'client_credentials'
        ], [
            'user' => $this->getClientId(),
            'password' => $this->getSecret()
        ]);

        if($mixedResult === false || empty($mixedResult['access_token'])) {
            $this->log($mixedResult, 'Get Token:', BX_LOG_ERR);

            return false;
        }

        return $mixedResult['access_token'];
    }

    protected function _apiCallAuthorize($sEndpoint, $aParams = [], $aBasicAuth = [], $sMethod = 'post')
    {
        $sResponse = $this->_apiCall($sEndpoint, $aParams, [], $sMethod, $aBasicAuth);

        return !empty($sResponse) ? json_decode($sResponse, true) : false;
    }

    protected function _apiCallAuthorized($sEndpoint, $aParams = [], $aHeaders = [], $sMethod = 'post-json', $bRawResponse = false)
    {
        if(!$this->_sToken)
            $this->_sToken = $this->_getToken();

        $aHeaders = array_merge([
            'Authorization: Bearer ' . $this->_sToken,
            'Prefer: return=representation'
        ], $aHeaders);

        $sHttpCode = $bRawResponse ? true : null;

        $sResponse = $this->_apiCall($sEndpoint, $aParams, $aHeaders, $sMethod, [], $sHttpCode);
        if($bRawResponse)
            return [$sHttpCode, $sResponse];

        return !empty($sResponse) ? json_decode($sResponse, true) : false;
    }

    protected function _apiCall($sEndpoint, $aParams = [], $aHeaders = [], $sMethod = 'post-json', $aBasicAuth = [], &$sHttpCode = null)
    {
        $aHeaders = array_merge([
            'Accept: application/json',
            'Content-Type: application/json'
        ], $aHeaders);

        return bx_file_get_contents($sEndpoint, $aParams, $sMethod, $aHeaders, $sHttpCode, $aBasicAuth);
    }

    protected function _getIntervalUnit($sPeriodUnit)
    {
        $aIntervalUnits = array(
            BX_PAYMENT_SBS_PU_DAY => 'DAY',
            BX_PAYMENT_SBS_PU_WEEK => 'WEEK',
            BX_PAYMENT_SBS_PU_MONTH => 'MONTH',
            BX_PAYMENT_SBS_PU_YEAR => 'YEAR'
        );

        return isset($aIntervalUnits[$sPeriodUnit]) ? $aIntervalUnits[$sPeriodUnit] : false;
    }


    /**
     * Methods which use 'Checkout SDK' to process Single time payments.
     */
    protected function _getClient()
    {
        $sClientId = $this->getClientId();
        $sSecret = $this->getSecret();

        if($this->_iMode == PP_API_MODE_LIVE)
            $oEnvironment = new ProductionEnvironment($sClientId, $sSecret);
        else 
            $oEnvironment = new SandboxEnvironment($sClientId, $sSecret);

        return new PayPalHttpClient($oEnvironment);
    }

    protected function _createOrder($iPendingId, $aCartInfo, $aParams = [])
    {
        $sReturnType = isset($aParams['return_type']) ? $aParams['return_type'] : 'approve';
                
        $aItems = array();
        foreach($aCartInfo['items'] as $aItem)
            $aItems[] = array(
                'name' => $aItem['title'],
                'unit_amount' => array(
                    'value' => sprintf("%.2f", $this->_oModule->_oConfig->getPrice(BX_PAYMENT_TYPE_SINGLE, $aItem)),
                    'currency_code' => $aCartInfo['vendor_currency_code']
                ),
                'quantity' => $aItem['quantity']
            );

        $sItemsPrice = sprintf("%.2f", round($aCartInfo['items_price'], 2));

        $oRequest = new OrdersCreateRequest();
        $oRequest->prefer('return=representation');
        $oRequest->body = array(
            'intent' => isset($aParams['intent']) ? strtoupper($aParams['intent']) : 'CAPTURE',
            'purchase_units' => array(
                array(
                    'reference_id' => $iPendingId,
                    'amount' => array(
                        'currency_code' => $aCartInfo['vendor_currency_code'],
                        'value' => $sItemsPrice,
                        'breakdown' => array(
                            'item_total' => array(
                                'currency_code' => $aCartInfo['vendor_currency_code'],
                                'value' => $sItemsPrice,
                            )
                        )
                    ),
                    'items' => $aItems
                )
            ),
            'application_context' => array(
                'cancel_url' => $this->_oModule->getObjectCart()->serviceGetCartUrl($aCartInfo['vendor_id']),
                'return_url' => $this->getReturnDataUrl($aCartInfo['vendor_id'])
            )
        );

        try {
            $oResponse = $this->_getClient()->execute($oRequest);
            if($oResponse->statusCode != 201)
                return false;

            $mixedLink = false;
            foreach($oResponse->result->links as $oLink)
                if($oLink->rel == $sReturnType) {
                    $mixedLink = $oLink->href;
                    break;
                }

            return array(
                'order' => $oResponse->result->id,
                'redirect' => $mixedLink,
            );
        }
        catch (HttpException $oException) {
            return $this->_processException('Create Order Error: ', $oException);
        }
    }

    protected function _getOrder($sOrderId)
    {
        $oRequest = new OrdersGetRequest($sOrderId);

        try {
            $oResponse = $this->_getClient()->execute($oRequest);
            if($oResponse->statusCode != 200 || strcmp(strtolower($oResponse->result->status), 'approved') != 0)
                return false;

            $oPurchase = current($oResponse->result->purchase_units);
            return array_merge(array(
                'id' => $oResponse->result->id,
                'intent' => strtolower($oResponse->result->intent),
                'pending_id' => (int)$oPurchase->reference_id,
            ), $this->_getClientInfo($oResponse->result->payer));
        }
        catch (HttpException $oException) {
            return $this->_processException('Get Order Error: ', $oException);
        }
        
    }

    protected function _authorizeOrder($sOrderId)
    {
        $oRequest = new OrdersAuthorizeRequest($sOrderId);

        try {
            $oResponse = $this->_getClient()->execute($oRequest);
            if($oResponse->statusCode != 201 || strcmp(strtolower($oResponse->result->status), 'completed') != 0)
                return false;

            $oPurchase = current($oResponse->result->purchase_units);
            $oAuthorization = current($oPurchase->payments->authorizations);
            return array_merge(array(
                'pending_id' => (int)$oPurchase->reference_id,
                'order' => $oAuthorization->id,
            ), $this->_getClientInfo($oResponse->result->payer));
        }
        catch (HttpException $oException) {
            return $this->_processException('Authorize Order Error: ', $oException);
        }
    }

    protected function _captureOrder($sOrderId)
    {
        $oRequest = new OrdersCaptureRequest($sOrderId);

        try {
            $oResponse = $this->_getClient()->execute($oRequest);
            if($oResponse->statusCode != 201 || strcmp(strtolower($oResponse->result->status), 'completed') != 0)
                return false;

            $oPurchase = current($oResponse->result->purchase_units);
            $oCapture = current($oPurchase->payments->captures);
            return array_merge(array(
                'pending_id' => (int)$oPurchase->reference_id,
                'order' => $oCapture->id,
            ), $this->_getClientInfo($oResponse->result->payer));
        }
        catch (HttpException $oException) {
            return $this->_processException('Capture Order Error: ', $oException);
        }
    }
    
    protected function _captureAuthorization($sAuthorizationId)
    {
        $oRequest = new AuthorizationsCaptureRequest($sAuthorizationId);

        try {
            $oResponse = $this->_getClient()->execute($oRequest);
            if($oResponse->statusCode != 201 || strcmp(strtolower($oResponse->result->status), 'completed') != 0)
                return false;

            return [
                'order' => $oResponse->result->id
            ];
        }
        catch (HttpException $oException) {
            return $this->_processException('Capture Authorization Error: ', $oException);
        }
    }

    protected function _processException($sMessage, &$oException)
    {
        $sDescription = '';
        $aError = [];

        $sMethod = 'getJsonBody';
        if(method_exists($oException, $sMethod)) {
            $aError = $oException->getJsonBody();
            if(isset($aError['error']['message']))
                $sDescription = $aError['error']['message'];
        }

        if(empty($sDescription))
            $sDescription = $oException->getMessage();

        $this->log($sMessage . $sDescription, '', BX_LOG_ERR);
        if(!empty($aError))
            $this->log($aError, '', BX_LOG_ERR);

        return false;
    }

    /**
     * Methods to process WebHooks
     */
    protected function _processEvent()
    {
        $sInput = @file_get_contents("php://input");
        $aEvent = json_decode($sInput, true);
        if(empty($aEvent) || !is_array($aEvent)) 
            return 404;

        $sType = $aEvent['event_type'];
        if(!in_array($sType, array('PAYMENT.SALE.COMPLETED', 'PAYMENT.CAPTURE.REFUNDED', 'BILLING.SUBSCRIPTION.CANCELLED')))
            return 200;

        $this->log($aEvent, 'Webhooks: ' . (!empty($sType) ? $sType : ''), BX_LOG_INFO);

        $sMethod = '_processEvent' . bx_gen_method_name(strtolower($sType), array('.', '_', '-'));
    	if(!method_exists($this, $sMethod))
            return 200;

    	return $this->$sMethod($aEvent) ? 200 : 403;
    }

    protected function _processEventPaymentSaleCompleted($aEvent)
    {
        $mixedResult = $this->_getEventData($aEvent);
        if($mixedResult === false)
            return false;

        list($aPending, $aEventData) = $mixedResult;

        $fChargeAmount = (float)$aEventData['amount']['total'];
        $sChargeCurrency = strtoupper($aEventData['amount']['currency']);
        if($this->_bCheckAmount && ((float)$aPending['amount'] != $fChargeAmount || strcasecmp($this->_oModule->_oConfig->getDefaultCurrencyCode(), $sChargeCurrency) !== 0))
            return false;

        if($aPending['type'] == BX_PAYMENT_TYPE_RECURRING)
            $this->_oModule->getObjectSubscriptions()->prolong($aPending);

        return $this->_oModule->registerPayment($aPending);
    }

    protected function _processEventPaymentCaptureRefunded($aEvent)
    {
        $mixedResult = $this->_getEventData($aEvent);
        if($mixedResult === false)
            return false;

        list($aPending, $aEventData) = $mixedResult;
        return $this->_oModule->refundPayment($aPending);
    }

    protected function _processEventBillingSubscriptionCancelled($aEvent)
    {
        $mixedResult = $this->_getEventData($aEvent);
        if($mixedResult === false)
            return false;

        list($aPending, $aEventData) = $mixedResult;
        return $this->_oModule->getObjectSubscriptions()->cancelLocal($aPending);
    }

    protected function _getEventData($aEvent)
    {
        if(empty($aEvent['resource']) || !is_array($aEvent['resource']))
            return false;

        $aData = $aEvent['resource'];
        if(empty($aData['billing_agreement_id']))
            return false;       

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'order', 'order' => $aData['billing_agreement_id']));
        if(empty($aPending) || !is_array($aPending))
            return false;

        return array($aPending, $aData);
    }

    /**
     * Common methods for internal usage.
     */
    protected function _getMode()
    {
        if(empty($this->_iMode))
            $this->_iMode = (int)$this->getOption('mode');

        $aModeI2S = array(
            PP_API_MODE_LIVE => 'live',
            PP_API_MODE_TEST => 'test'
        );

        return isset($aModeI2S[$this->_iMode]) ? $aModeI2S[$this->_iMode] : $aModeI2S[PP_API_MODE_DEFAULT];
    }

    protected function _getSessionOrder()
    {
        return $this->_oSession->getUnsetValue($this->_sSessionKeyOrder);
    }

    protected function _setSessionOrder($sValue)
    {
        $this->_oSession->setValue($this->_sSessionKeyOrder, $sValue);
    }

    protected function _getSessionSubscription()
    {
        return $this->_oSession->getUnsetValue($this->_sSessionKeySubscription);
    }

    protected function _setSessionSubscription($sValue)
    {
        $this->_oSession->setValue($this->_sSessionKeySubscription, $sValue);
    }

    /**
     * Retrieve 'Client Info' from a 'getSubscription' call's response.
     */
    protected function _getClientInfo($mixedClient)
    {
        $_sName = 'name';
        $_sFirst = 'given_name';
        $_sLast = 'surname';
        $_sEmail = 'email_address';

        $aResult = [];
        if(is_object($mixedClient))
            $aResult = [
                'client_first_name' => $mixedClient->$_sName->$_sFirst,
                'client_last_name' => $mixedClient->$_sName->$_sLast,
                'client_email' => $mixedClient->$_sEmail,
            ];
        else
            $aResult = [
                'client_first_name' => $mixedClient[$_sName][$_sFirst],
                'client_last_name' => $mixedClient[$_sName][$_sLast],
                'client_email' => $mixedClient[$_sEmail],
            ];

        return $aResult;
    }

    /**
     * Retrieve 'Billing Status' from a 'getSubscription' call's response.
     */
    protected function _getBillingStatus($mixedBillingInfo)
    {
        $bTrial = $bPaid = false;

        $_sCycles = 'cycle_executions';
        $_sCycleType = 'tenure_type';
        $_sCyclesCompleted = 'cycles_completed';
        $_sCyclesTotal = 'total_cycles';

        $bByObject = is_object($mixedBillingInfo);
        $aCycles = $bByObject ? $mixedBillingInfo->$_sCycles : $mixedBillingInfo[$_sCycles];
        if(empty($aCycles) || !is_array($aCycles))
            return [$bPaid, $bTrial];

        foreach($aCycles as $mixedCycle) {
            $sCycleType = $bByObject ? $mixedCycle->$_sCycleType : $mixedCycle[$_sCycleType];
            $iCyclesCompleted = $bByObject ? $mixedCycle->$_sCyclesCompleted : (int)$mixedCycle[$_sCyclesCompleted];
            $iCyclesTotal = $bByObject ? $mixedCycle->$_sCyclesTotal : (int)$mixedCycle[$_sCyclesTotal];

            switch($sCycleType) {
                case 'TRIAL':
                    $bTrial = $iCyclesCompleted <= $iCyclesTotal;
                    break;

                case 'REGULAR':
                    if($iCyclesCompleted == 0)
                        break;

                    $bPaid = true;
                    $bTrial = false;
                    break 2;
            }
        }

        return [$bPaid, $bTrial];
    }
}

/** @} */
