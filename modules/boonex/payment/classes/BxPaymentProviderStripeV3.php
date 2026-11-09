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

require_once('BxPaymentProviderStripeBasic.php');

class BxPaymentProviderStripeV3 extends BxPaymentProviderStripeBasic implements iBxBaseModPaymentProvider
{
    protected $_oStripe;

    protected $_iAmountPrecision;

    function __construct($aConfig)
    {
        parent::__construct($aConfig);

        $this->_aIncludeJs = array(
            'stripe_v3.js'
        );

        $this->_oStripe = null;

        $this->_iAmountPrecision = 2;
    }

    public function actionGetSessionRecurring()
    {
        $aClient = $this->_oModule->getProfileInfo();

        $aParams = array(
            'seller_id' => (int)bx_get('seller_id'),
            'seller_provider' => bx_process_input(bx_get('seller_provider')),
            'module_id' => (int)bx_get('module_id'),
            'item_id' => (int)bx_get('item_id'),
            'item_count' => (int)bx_get('item_count'),
            'item_addons' => '',
            'redirect' => bx_process_input(bx_get('redirect')),
            'custom' => bx_process_input(bx_get('custom')),
        );
        
        if(($mixedItemAddons = bx_get('item_addons')) !== false) {
            $mixedItemAddons = bx_process_input($mixedItemAddons);
            if(!is_array($mixedItemAddons))
                $mixedItemAddons = strpos($mixedItemAddons, ',') !== false ? explode(',', $mixedItemAddons) : [$mixedItemAddons];

            $aParams['item_addons'] = $this->_oModule->_oConfig->a2s($mixedItemAddons);
        }

        $aItems = array($this->_oModule->_oConfig->descriptorA2S(array(
            'seller_id' => $aParams['seller_id'],
            'module_id' => $aParams['module_id'],
            'item_id' => $aParams['item_id'],
            'item_count' => $aParams['item_count'],
            'item_addons' => $aParams['item_addons'],
        )));

        $oCart = $this->_oModule->getObjectCart();
        $aCartInfo = $oCart->getInfo(BX_PAYMENT_TYPE_RECURRING, $aClient['id'], $aParams['seller_id'], $aItems);
        if(empty($aCartInfo) || !is_array($aCartInfo))
            return echoJson(array('msg' => _t('_bx_payment_err_nothing_selected')));

        $aItem = reset($aCartInfo['items']);

        $aSessionParams = array(
            'cancel_url' => $aItem['url'],
            'success_url' => bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_SUBSCRIBE_JSON'), array_merge($aParams, array(
                'session_id' => '{CHECKOUT_SESSION_ID}'
            )), false)
        );

        $mixedSession = $this->_createSession(BX_PAYMENT_TYPE_RECURRING, $aSessionParams, $aClient, $aCartInfo);
        if($mixedSession === false)
            return echoJson(array('msg' => _t('_bx_payment_err_cannot_perform')));

        $sJsObject = $this->getJsObject(array(
            'iModuleId' => $aParams['module_id'],
            'iSellerId' => $aParams['seller_id'],
            'iItemId' => $aParams['item_id']
        ));

        return echoJson(array(
            'code' => 0, 
            'session_id' => $mixedSession['id'],
            'eval' => $sJsObject . '.onSubscribe(oData);'
        ));
    }

    public function authorizeCheckout($iPendingId, $aCartInfo, $sRedirect = '')
    {
        $sSessionId = bx_process_input(bx_get('session_id'));

    	if(empty($aCartInfo['items']) || !is_array($aCartInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_items';

        $aClient = $this->_oModule->getProfileInfo();
        $aVendor = $this->_oModule->getProfileInfo($aCartInfo['vendor_id']);

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return $this->_sLangsPrefix . 'err_already_processed';

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $mixedResult = $this->_getSession(BX_PAYMENT_TYPE_SINGLE, $sSessionId);
                if($mixedResult === false)
                    return $this->_sLangsPrefix . 'err_cannot_perform';

                return [
                    'code' => BX_PAYMENT_RESULT_SUCCESS,
                    'redirect' => $this->getReturnDataUrl($aVendor['id'], array(
                        'mode' => $mixedResult['mode'],
                        'order_id' => $mixedResult['order_id'],
                        'customer_id' => $mixedResult['customer_id'], 
                        'pending_id' => $aPending['id'],
                        'redirect' => $sRedirect
                    ))
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

        $bPaid = false;
        $sOrder = '';
        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $oPaymentIntent = $this->_createPaymentIntent($sOrderAuth, $aInfo['items_price'], $aInfo['vendor_currency_code']);
                if($oPaymentIntent === false)
                    return ['code' => 3, 'message' => $this->_sLangsPrefix . 'err_cannot_perform'];

                $aPaymentIntent = $oPaymentIntent->jsonSerialize();
                if(empty($aPaymentIntent) || !is_array($aPaymentIntent))
                    return ['code' => 3, 'message' => $this->_sLangsPrefix . 'err_cannot_perform'];

                $bPaid = $aPaymentIntent['status'] == 'succeeded';
                $sOrder = $aPaymentIntent['id'];
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                return ['code' => 1, 'message' => $this->_sLangsPrefix . 'err_not_supported'];
        }

        $aResult = [
            'code' => BX_PAYMENT_RESULT_SUCCESS,
            'message' => $this->_sLangsPrefix . 'strp_msg_charged',
            'pending_id' => $aPending['id'],
            'paid' => $bPaid
        ];

        //--- Update pending transaction
        $this->_oModule->_oDb->updateOrderPending($aResult['pending_id'], [
            'order' => $sOrder,
            'error_code' => $aResult['code'],
            'error_msg' => _t($aResult['message']),
        ]);

        return $aResult;
    }

    public function initializeCheckout($iPendingId, $aCartInfo, $sRedirect = '')
    {
        $sSessionId = bx_process_input(bx_get('session_id'));

    	if(empty($aCartInfo['items']) || !is_array($aCartInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_items';

        $aClient = $this->_oModule->getProfileInfo();
        $aVendor = $this->_oModule->getProfileInfo($aCartInfo['vendor_id']);

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return $this->_sLangsPrefix . 'err_already_processed';

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $mixedResult = $this->_getSession(BX_PAYMENT_TYPE_SINGLE, $sSessionId);
                if($mixedResult === false || $mixedResult['status'] != 'paid')
                    return $this->_sLangsPrefix . 'err_cannot_perform';
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $mixedResult = $this->_getSession(BX_PAYMENT_TYPE_RECURRING, $sSessionId);
                if($mixedResult === false)
                    return $this->_sLangsPrefix . 'err_cannot_perform';
                break;
        }

        $aProcessed = $this->_oModule->_oDb->getOrderPending(['type' => 'order', 'order' => $mixedResult['order_id']]);
        if(!empty($aProcessed) && is_array($aProcessed) && (int)$aProcessed['processed'] != 0 && $aProcessed['id'] != $iPendingId)
            return $this->_sLangsPrefix . 'err_already_processed';

        $aData = [
            'mode' => $mixedResult['mode'],
            'order_id' => $mixedResult['order_id'],
            'customer_id' => $mixedResult['customer_id'], 
            'pending_id' => $aPending['id'],
            'redirect' => $sRedirect
        ];

        if(bx_is_api())
            return $this->_oModule->serviceFinalizeCheckout($this->_sName, $aVendor['id'], $aData);

        header("Location: " . $this->getReturnDataUrl($aVendor['id'], $aData));
        exit;
    }

    public function finalizeCheckout(&$aData)
    {
        $sMode = bx_process_input($aData['mode']);
    	$sOrderId = bx_process_input($aData['order_id']);
    	$sCustomerId = bx_process_input($aData['customer_id']);
        $iPendingId = bx_process_input($aData['pending_id'], BX_DATA_INT);
        if(empty($iPendingId))
            return array('code' => 1, 'message' => $this->_sLangsPrefix . 'err_wrong_data');

        $sRedirect = bx_process_input($aData['redirect']);

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return array('code' => 3, 'message' => $this->_sLangsPrefix . 'err_already_processed');

        $aResult = array(
            'code' => BX_PAYMENT_RESULT_SUCCESS,
            'message' => '',
            'pending_id' => $iPendingId,
            'customer_id' => '',
            'subscription_id' => '',
            'client_name' => '',
            'client_email' => '',
            'authorized' => false,
            'paid' => false,
            'trial' => false,
            'redirect' => $sRedirect
        );

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $oCustomer = $this->_retrieveCustomer(BX_PAYMENT_TYPE_SINGLE, $sCustomerId);
                if($oCustomer === false)
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                $aCustomer = $oCustomer->jsonSerialize();
                if(empty($aCustomer) || !is_array($aCustomer))
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                $sMessage = '';
                $bPaid = $bAuthorized = false;
                switch($sMode) {
                    case 'setup':
                        $oSetupIntent = $this->_retrieveSetupIntent($sOrderId);
                        if($oSetupIntent === false)
                            return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');
                        
                        $aSetupIntent = $oSetupIntent->jsonSerialize();
                        if(empty($aSetupIntent) || !is_array($aSetupIntent))
                            return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');
                                
                        $sMessage = $this->_sLangsPrefix . 'strp_msg_authorized';
                        $bAuthorized = $aSetupIntent['status'] == 'succeeded';
                        break;

                    case 'payment':
                        $oPaymentIntent = $this->_retrievePaymentIntent($sOrderId);
                        if($oPaymentIntent === false)
                            return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                        $aPaymentIntent = $oPaymentIntent->jsonSerialize();
                        if(empty($aPaymentIntent) || !is_array($aPaymentIntent))
                            return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                        $sMessage = $this->_sLangsPrefix . 'strp_msg_charged';
                        $bPaid = $aPaymentIntent['status'] == 'succeeded';
                        break;
                }

                $aResult = array_merge($aResult, array(
                    'message' => $sMessage,
                    'client_email' => $aCustomer['email'],
                    'authorized' => $bAuthorized,
                    'paid' => $bPaid,
                ));
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $oCustomer = $this->_retrieveCustomer(BX_PAYMENT_TYPE_RECURRING, $sCustomerId);
                $oSubscription = $this->_retrieveSubscription($sCustomerId, $sOrderId);
                if($oCustomer === false || $oSubscription === false)
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                $aCustomer = $oCustomer->jsonSerialize();
                $aSubscription = $oSubscription->jsonSerialize();
                if(empty($aCustomer) || !is_array($aCustomer) || empty($aSubscription) || !is_array($aSubscription))
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                $aResult = array_merge($aResult, [
                    'message' => $this->_sLangsPrefix . 'strp_msg_subscribed',
                    'customer_id' => $sCustomerId,
                    'subscription_id' => $sOrderId,
                    'client_email' => $aCustomer['email'],
                    'trial' => $this->isSubscriptionStatus(BX_PAYMENT_SBS_STATUS_TRIAL, $aSubscription)
                ]);

                $aPaymentPending = $this->_oModule->_oDb->getStrpPaymentPending($sOrderId);
                if(empty($aPaymentPending) || !is_array($aPaymentPending)) 
                    break;

                if($this->_bCheckAmount && ((float)$aPending['amount'] != (float)$aPaymentPending['amount'] || strcasecmp($this->_oModule->_oConfig->getDefaultCurrencyCode(), $aPaymentPending['currency']) !== 0))
                    break;

                $aResult['paid'] = true;
                break;
        }

        //--- Update pending transaction ---//
        $this->_oModule->_oDb->updateOrderPending($iPendingId, array(
            'order' => $sOrderId,
            'error_code' => $aResult['code'],
            'error_msg' => _t($aResult['message'])
        ));

        return $aResult;
    }

    public function getButtonSingle($iClientId, $iVendorId, $aParams = array())
    {
        if(!isset($aParams['sAction']))
            return '';

        return $aParams['sAction'] . parent::getButtonSingle($iClientId, $iVendorId, $aParams);
    }

    public function overwriteCheckoutParamsSingle($aParams, &$oGrid)
    {
        $aClient = $this->_oModule->getProfileInfo();

        $oCart = $this->_oModule->getObjectCart();
        $aCartInfo = $oCart->getInfo(BX_PAYMENT_TYPE_SINGLE, $aClient['id'], $aParams['seller_id'], $aParams['items']);
        if(empty($aCartInfo) || !is_array($aCartInfo))
            return array('msg' => _t('_bx_payment_err_nothing_selected'));

        $aSessionParams = array(
            'cancel_url' => $oCart->serviceGetCartUrl($aParams['seller_id']),
            'success_url' => bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_CART_CHECKOUT'), array_merge($aParams, array(
                'session_id' => '{CHECKOUT_SESSION_ID}'
            )), false)
        );

        $mixedSession = $this->_createSession(BX_PAYMENT_TYPE_SINGLE, $aSessionParams, $aClient, $aCartInfo);
        if($mixedSession === false)
            return array('msg' => _t('_bx_payment_err_cannot_perform'));

        return array(
            'eval' => $this->_oModule->_oConfig->getJsObject($this->_sName) . '.onCartCheckout(oData);', 
            'session_id' => $mixedSession['id']
        );
    }

    /**
     * Note. Isn't used for now in default version.
     */
    public function createSessionAuthorize($sType, $iClientId, $iSellerId, $sItems, $aSessionParams = [])
    {
        $aClient = $this->_oModule->getProfileInfo($iClientId);

        $oCart = $this->_oModule->getObjectCart();
        $aCartInfo = $oCart->getInfo($sType, $aClient['id'], $iSellerId, $sItems);
        if(empty($aCartInfo) || !is_array($aCartInfo))
            return false;

        $aSessionParams = array_merge([
            'cancel_url' => $oCart->serviceGetCartUrl($iSellerId),
            'success_url' => bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_AUTHORIZE') . $sType . '/', [
                'provider' => $this->_sName,
                'seller_id' => $iSellerId,
                'items' => $sItems,
                'session_id' => '{CHECKOUT_SESSION_ID}'
            ], false)
        ], $aSessionParams);

        $mixedSession = $this->_createSession('authorize', $aSessionParams, $aClient, $aCartInfo);
        if($mixedSession === false)
            return false;

        return $mixedSession['id'];
    }

    /*
     * https://stripe.com/docs/checkout/embedded/quickstart?client=react&lang=php
     */
    public function createSessionPaymentEmbedded($sType, $iClientId, $iSellerId, $sItems, $aSessionParams = [])
    {
        $aClient = $this->_oModule->getProfileInfo($iClientId);

        $oCart = $this->_oModule->getObjectCart();
        $aCartInfo = $oCart->getInfo($sType, $aClient['id'], $iSellerId, $sItems);
        if(empty($aCartInfo) || !is_array($aCartInfo))
            return false;

        $aSessionParams = array_merge([
            'ui_mode' => 'embedded_page',
            'return_url' => bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_CART_CHECKOUT'), [
                'provider' => $this->_sName,
                'seller_id' => $iSellerId,
                'items' => $sItems,
                'session_id' => '{CHECKOUT_SESSION_ID}'
            ], false)
        ], $aSessionParams);

        if(strpos($aSessionParams['return_url'], 'session_id') === false)
            $aSessionParams['return_url'] .= '&session_id={CHECKOUT_SESSION_ID}';

        $mixedSession = $this->_createSession($sType, $aSessionParams, $aClient, $aCartInfo);
        if($mixedSession === false)
            return false;

        return $mixedSession['client_secret'];
    }

    public function createTax($sName, $fPercentage, $bInclusive = false)
    {
        $oTax = null;
        $aTax = [
            'display_name' => $sName,
            'percentage' => $fPercentage,
            'inclusive' => $bInclusive,
        ];

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_create_tax 'bx_payment', 'stripe_v3_create_tax' - hook to override tax data redurned by payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_create_tax`
         * - $object_id - pending transaction id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `tax_object` - [object] by ref, an instance of tax, redurned by payment provider, can be overridden in hook processing
         *      - `tax_params` - [array] by ref, array with tax parameters, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_create_tax
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_create_tax', 0, false, [
            'tax_object' => &$oTax, 
            'tax_params' => &$aTax,
            'tax_params_ref' => &$aTax,
        ]);

        try {
            if(empty($oTax))
                $oTax = $this->_getStripe()->taxRates->create($aTax);
        }
        catch (Exception $oException) {
            return $this->_processException('Create Tax Error: ', $oException);
        }

        $aResult = $oTax->jsonSerialize();
        if(empty($aResult) || !is_array($aResult))
            return false;

        return $aResult['id'];
    }

    public function retrieveTax($sId)
    {
        $oTax = null;
        
        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_retrieve_tax 'bx_payment', 'stripe_v3_retrieve_tax' - hook to override tax data retrieved from payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_retrieve_tax`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `tax_id` - [string] by ref, unique tax id, can be overridden in hook processing
         *      - `tax_object` - [object] by ref, an instance of tax, redurned by payment provider, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_retrieve_tax
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_retrieve_tax', 0, false, [
            'tax_id' => &$sId,
            'tax_object' => &$oTax
        ]);

        try {
            if(empty($oTax))
                $oTax = $this->_getStripe()->taxRates->retrieve($sId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Tax Error: ', $oException);
        }

        return $oTax;
    }

    public function getVerificationCodeSession($iVendorId, $iCustomerId, $fAmount, $sCurrency)
    {
        $sCode = $this->_getVerificationCodeSession($iVendorId, $iCustomerId, $fAmount, $sCurrency);

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_get_code_session 'bx_payment', 'stripe_v3_get_code_session' - hook to override session verification code
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_get_code_session`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `provider` - [object] an instance of provider, @see BxBaseModPaymentProvider
         *      - `vendor_id` - [int] vendor (seller) profile id
         *      - `customer_id` - [int] customer (buyer) profile id
         *      - `amount` - [float] session amount
         *      - `currency` - [string] session currency code
         *      - `override_result` - [string] by ref, verification code, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_get_code_session
         */        
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_get_code_session', 0, false, [
            'provider' => $this,
            'vendor_id' => $iVendorId, 
            'customer_id' => $iCustomerId,
            'amount' => $fAmount,
            'currency' => $sCurrency,
            'override_result' => &$sCode
        ]);

        return $sCode;
    }

    public function checkVerificationCodeSession($iVendorId, $iCustomerId, $aResult)
    {
        $bCheckResult = $this->_checkVerificationCodeSession($iVendorId, $iCustomerId, $aResult);

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_verify_session 'bx_payment', 'stripe_v3_verify_session' - hook to override checking of session verification code
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_verify_session`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `provider` - [object] an instance of provider, @see BxBaseModPaymentProvider
         *      - `vendor_id` - [int] vendor (seller) profile id
         *      - `customer_id` - [int] customer (buyer) profile id
         *      - `result` - [array] results array received from payment provider
         *      - `override_result` - [boolean] by ref, is verification passed or not, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_verify_session
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_verify_session', 0, false, [
            'provider' => $this,
            'vendor_id' => $iVendorId, 
            'customer_id' => $iCustomerId,
            'result' => $aResult,
            'override_result' => &$bCheckResult
        ]);

        return $bCheckResult;
    }

    protected function _getStripe()
    {
        if(empty($this->_oStripe))
            $this->_oStripe = new \Stripe\StripeClient($this->_getSecretKey());

        return $this->_oStripe;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/customers/retrieve
     */
    protected function _retrieveCustomer($sType, $sId)
    {
        $oCustomer = null;
        
        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_retrieve_customer 'bx_payment', 'stripe_v3_retrieve_customer' - hook to override customer data retrieved from payment provider
         * It's equivalent to @ref hook-bx_payment-stripe_retrieve_customer
         * @hook @ref hook-bx_payment-stripe_v3_retrieve_customer
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_retrieve_customer', 0, false, [
            'type' => $sType,
            'customer_id' => &$sId,
            'customer_object' => &$oCustomer
        ]);

        try {
            if(empty($oCustomer))
                $oCustomer = $this->_getStripe()->customers->retrieve($sId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Customer Error: ', $oException);
        }

        return $oCustomer;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/checkout/sessions/create
     */
    protected function _createSession($sType, $aParams, &$aClient, &$aCartInfo)
    {
        $sMode = '';
        $aLineItems = $aMetaItems = [];
        $bVerify = true;

        switch($sType) {
            case 'authorize':
                $sMode = 'setup';
                $bVerify = false;

                foreach($aCartInfo['items'] as $aItem) {
                    $aMetaItems[] = $this->_oModule->_oConfig->descriptorA2S([$aItem['module_id'], $aItem['id']]);
                    if(!empty($aItem['addons']) && is_array($aItem['addons']))
                        foreach($aItem['addons'] as $aAddon)
                            $aMetaItems[] = $this->_oModule->_oConfig->descriptorA2S([$aAddon['module_id'], $aAddon['id']]);
                }

                $aParams['customer_creation'] = 'always';
                break;

            case BX_PAYMENT_TYPE_SINGLE:
                $sMode = 'payment';

                foreach($aCartInfo['items'] as $aItem) {
                    list($_aLineItems, $_aMetaItems) = $this->_getLineItems($sType, $aItem, [
                        'vendor_currency_code' => $aCartInfo['vendor_currency_code']
                    ]);

                    $aLineItems = array_merge($aLineItems, $_aLineItems);
                    $aMetaItems = array_merge($aMetaItems, $_aMetaItems);
                }

                $aParams['customer_creation'] = 'always';
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $sMode = 'subscription';
                $iTrial = 0;

                foreach($aCartInfo['items'] as $aItem) {
                    list($_aLineItems, $_aMetaItems) = $this->_getLineItems($sType, $aItem, [
                        'vendor_currency_code' => $aCartInfo['vendor_currency_code']
                    ]);

                    $aLineItems = array_merge($aLineItems, $_aLineItems);
                    $aMetaItems = array_merge($aMetaItems, $_aMetaItems);

                    if((int)$aItem['trial_recurring'] > 0)
                        $iTrial = (int)$aItem['trial_recurring'];
                }

                if($iTrial > 0) {
                    $bVerify = false;

                    $aParams['subscription_data'] = [
                        'trial_period_days' => $iTrial
                    ];
                }

                break;
        }

        $oSession = null;
        $aSession = array_merge([
            'mode' => $sMode,
            'customer_email' => !empty($aClient['email']) ? $aClient['email'] : ''
        ], $aParams);

        $bLineItems = !empty($aLineItems);
        $aSession['line_items'] = $aLineItems;

        $bMetaData = !empty($aMetaItems);
        if($bMetaData) {
            $aSession['metadata'] = [
                'vendor' => $aCartInfo['vendor_id'],
                'client' => $aClient['id'],
                'type' => $sType, 
                'items' => $this->_oModule->_oConfig->descriptorsA2S($aMetaItems)
            ];

            if($bVerify) {
                $fAmount = 100 * round((float)$aCartInfo['items_price'], $this->_iAmountPrecision);
                $aSession['metadata']['verification'] = $this->getVerificationCodeSession($aCartInfo['vendor_id'], $aClient['id'], $fAmount, $aCartInfo['vendor_currency_code']);
            }
        }

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_create_session 'bx_payment', 'stripe_v3_create_session' - hook to override session data redurned by payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_create_session`
         * - $object_id - pending transaction id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `session_object` - [object] by ref, an instance of session, redurned by payment provider, can be overridden in hook processing
         *      - `session_params` - [array] by ref, array with session parameters, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_create_session
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_create_session', 0, false, [
            'session_object' => &$oSession, 
            'session_params' => &$aSession
        ]);

        try {
            if(empty($oSession))
                $oSession = $this->_getStripe()->checkout->sessions->create($aSession);
        }
        catch (Exception $oException) {
            return $this->_processException('Create Session Error: ', $oException);
        }

        $aResult = $oSession->jsonSerialize();
        if(empty($aResult) || !is_array($aResult))
            return false;

        if($bVerify && !$this->checkVerificationCodeSession($aCartInfo['vendor_id'], $aClient['id'], $aResult))
            return false;

        return $aResult;
    }

    protected function _getSession($sType, $sId)
    {
        $oSession = $this->_retrieveSession($sId);
        if($oSession === false)
            return false;

        $aSession = $oSession->jsonSerialize();
        if(empty($aSession) || !is_array($aSession))
            return array();

        $sMode = 'payment';
        if(!empty($aSession['mode']))
            $sMode = $aSession['mode'];
        
        $aResult = array(
            'id' => $aSession['id'],
            'mode' => $sMode,
            'order_id' => '',
            'customer_id' => $aSession['customer'],
            'status' => $aSession['payment_status']
        );

        switch($sType) {
            case BX_PAYMENT_TYPE_SINGLE:
                $aResult['order_id'] = $aSession[($sMode == 'setup' ? 'setup' : 'payment') . '_intent'];
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $aResult['order_id'] = $aSession['subscription'];
                break;
        }

        return $aResult;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/checkout/sessions/retrieve
     */
    protected function _retrieveSession($sId)
    {
        $oSession = null;
        
        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_retrieve_session 'bx_payment', 'stripe_v3_retrieve_session' - hook to override session data retrieved from payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_retrieve_session`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `session_id` - [string] by ref, unique session id, can be overridden in hook processing
         *      - `session_object` - [object] by ref, an instance of session, redurned by payment provider, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_retrieve_session
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_retrieve_session', 0, false, [
            'session_id' => &$sId,
            'session_object' => &$oSession
        ]);

        try {
            if(empty($oSession))
                $oSession = $this->_getStripe()->checkout->sessions->retrieve($sId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Session Error: ', $oException);
        }

        return $oSession;
    }
    
    
    /*
     * Related Docs: https://stripe.com/docs/api/setup_intents/retrieve
     */
    protected function _retrieveSetupIntent($sId)
    {
        $oSetupIntent = null;

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_retrieve_setup_intent 'bx_payment', 'stripe_v3_retrieve_setup_intent' - hook to override SetupIntent data retrieved from payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_retrieve_setup_intent`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `setup_intent_id` - [string] by ref, unique SetupIntent id, can be overridden in hook processing
         *      - `setup_intent_object` - [object] by ref, an instance of SetupIntent, redurned by payment provider, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_retrieve_setup_intent
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_retrieve_setup_intent', 0, false, [
            'setup_intent_id' => &$sId,
            'setup_intent_object' => &$oSetupIntent
        ]);

        try {
            if(empty($oSetupIntent))
                $oSetupIntent = $this->_getStripe()->setupIntents->retrieve($sId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Setup Intent Error: ', $oException);
        }

        return $oSetupIntent;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/payment_intents/create
     */
    protected function _createPaymentIntent($sSetupIntentId, $fAmount, $sCurrency, $bConfirm = true)
    {
        $oPaymentIntent = null;

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_create_payment_intent 'bx_payment', 'stripe_v3_create_payment_intent' - hook to override PaymentIntent data redurned by payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_create_payment_intent`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `setup_intent_id` - [string] by ref, unique SetupIntent id, can be overridden in hook processing
         *      - `payment_intent_object` - [object] by ref, an instance of PaymentIntent, redurned by payment provider, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_create_payment_intent
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_create_payment_intent', 0, false, [
            'setup_intent_id' => &$sSetupIntentId,
            'payment_intent_object' => &$oPaymentIntent
        ]);

        try {
            if(empty($oPaymentIntent)) {
                $oSetupIntent = $this->_retrieveSetupIntent($sSetupIntentId);
                if($oSetupIntent === false)
                    return false;

                $aSetupIntent = $oSetupIntent->jsonSerialize();
                if(empty($aSetupIntent) || !is_array($aSetupIntent))
                    return false;

                $oPaymentIntent = $this->_getStripe()->paymentIntents->create([
                    'amount' => 100 * round($fAmount, $this->_iAmountPrecision),
                    'currency' => strtolower($sCurrency),
                    'customer' => $aSetupIntent['customer'],
                    'payment_method' => $aSetupIntent['payment_method'],
                    'confirm' => $bConfirm
                ]);
            }
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Payment Intent Error: ', $oException);
        }

        return $oPaymentIntent;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/payment_intents/retrieve
     */
    protected function _retrievePaymentIntent($sId)
    {
        $oPaymentIntent = null;

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_retrieve_payment_intent 'bx_payment', 'stripe_v3_retrieve_payment_intent' - hook to override PaymentIntent data retrieved from payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_retrieve_payment_intent`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `payment_intent_id` - [string] by ref, unique PaymentIntent id, can be overridden in hook processing
         *      - `payment_intent_object` - [object] by ref, an instance of PaymentIntent, redurned by payment provider, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_retrieve_payment_intent
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_retrieve_payment_intent', 0, false, [
            'payment_intent_id' => &$sId,
            'payment_intent_object' => &$oPaymentIntent
        ]);

        try {
            if(empty($oPaymentIntent))
                $oPaymentIntent = $this->_getStripe()->paymentIntents->retrieve($sId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Payment Intent Error: ', $oException);
        }

        return $oPaymentIntent;
    }
    
    /*
     * Related Docs: https://stripe.com/docs/api/subscriptions/retrieve
     */
    protected function _retrieveSubscription($sCustomerId, $sSubscriptionId)
    {
        $oSubscription = null;
        
        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_retrieve_subscription 'bx_payment', 'stripe_v3_retrieve_subscription' - hook to override subscription data retrieved from payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_retrieve_subscription`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `subscription_id` - [string] by ref, unique subscription id, can be overridden in hook processing
         *      - `subscription_object` - [object] by ref, an instance of subscription, redurned by payment provider, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_retrieve_subscription
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_retrieve_subscription', 0, false, [
            'subscription_id' => &$sSubscriptionId,
            'subscription_object' => &$oSubscription
        ]);

        try {
            if(empty($oSubscription))
                $oSubscription = $this->_getStripe()->subscriptions->retrieve($sSubscriptionId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Subscription Error: ', $oException);
        }

        return $oSubscription;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/tokens/create_card
     */
    protected function _createToken($aCard)
    {
        try {
            $oToken = $this->_getStripe()->tokens->create(['card' => $aCard]);
        }
        catch (\Stripe\Exception\ApiErrorException $oException) {
            return $this->_processException('Create Token Error: ', $oException);
        }

        return $oToken->jsonSerialize();
    }

    /*
     * Related Docs: https://stripe.com/docs/api/cards/create
     */
    protected function _createCard($sType, $sCustomerId, $sToken)
    {
        try {
            $oCard = $this->_getStripe()->customers->createSource($sCustomerId, [
                'source' => $sToken
            ]);
        }
        catch (\Stripe\Exception\ApiErrorException $oException) {
            return $this->_processException('Create Card Error: ', $oException);
        }

        return $oCard->jsonSerialize();
    }

    protected function _retrieveCard($sCustomerId, $sCardId = '')
    {
        try {
            $oCustomer = $this->_getStripe()->customers->retrieve($sCustomerId);

            if(empty($sCardId))
                $sCardId = $oCustomer->default_source;
            if(empty($sCardId))
                return false;

            $oCard = $this->_getStripe()->customers->retrieveSource($sCustomerId, $sCardId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Card Error: ', $oException);
        }

        return $oCard;
    }

    /*
     * Related Docs: https://stripe.com/docs/api/payment_methods/retrieve
     */
    protected function _retrievePaymentMethod($sPaymentMethodId)
    {
        try {
            $oPaymentMethod = $this->_getStripe()->paymentMethods->retrieve($sPaymentMethodId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Payment Method Error: ', $oException);
        }

        return $oPaymentMethod;
    }

    protected function _getButton($sType, $iClientId, $iVendorId, $aParams = array())
    {
        list($sJsCode, $sJsMethod) = $this->_getButtonJs($sType, $iClientId, $iVendorId, $aParams);

    	if($sType == BX_PAYMENT_TYPE_SINGLE)
            return $sJsCode;

        return parent::_getButton($sType, $iClientId, $iVendorId);
    }

    protected function _getButtonJs($sType, $iClientId, $iVendorId, $aParams = array())
    {
        $sClientEmail = '';
    	if(!empty($iClientId) && ($oClient = BxDolProfile::getInstance($iClientId)) !== false)
            $sClientEmail = $oClient->getAccountObject()->getEmail();

        $sPublicKey = '';
        $sConnectedAccountId = '';
        
        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_v3_get_button 'bx_payment', 'stripe_v3_get_button' - hook to override checkout/subscibe button
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_v3_get_button`
         * - $object_id - not used
         * - $sender_id - client (buyer) profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] by ref, payment type ('single' or 'recurring'), can be overridden in hook processing
         *      - `public_key` - [string] by ref, public key from Stripe account, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_v3_get_button
         */
    	bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_get_button', 0, $iClientId, [
            'client_id' => $iClientId,
            'vendor_id' => $iVendorId,

            'type' => &$sType, 
            'public_key' => &$sPublicKey,
            'connected_account_id' => &$sConnectedAccountId,

            'type_ref' => &$sType, 
            'public_key_ref' => &$sPublicKey,
            'connected_account_id_ref' => &$sConnectedAccountId,
        ]);

        $sJsMethod = '';
        $sJsObject = $this->getJsObject($aParams);
        switch($sType) {
            case BX_PAYMENT_TYPE_SINGLE:
                $sJsMethod = 'void(0)';
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $sJsMethod = $sJsObject . '.subscribe(this)';
                break;
        }

        return [$this->_oModule->_oTemplate->getJsCode($this->_sName, array_merge([
            'js_object' => $sJsObject,
            'sProvider' => $this->_sName,
            'sPublicKey' => !empty($sPublicKey) ? $sPublicKey : $this->_getPublicKey(),
            'sConnectedAccountId' => $sConnectedAccountId,
            'sVendorName' => '',
            'sVendorCurrency' => '',
            'sVendorIcon' => '',
            'sClientEmail' => $sClientEmail,
        ], $aParams)), $sJsMethod];
    }

    protected function _getVerificationCodeSession($iVendorId, $iCustomerId, $fAmount, $sCurrency)
    {
        return md5(implode('#-#', array(
            (int)$iVendorId,
            (int)$iCustomerId,
            (float)$fAmount,
            strtoupper($sCurrency)
        )));
    }

    protected function _checkVerificationCodeSession($iVendorId, $iCustomerId, $aResult)
    {
        return !empty($aResult['metadata']['verification']) && $aResult['metadata']['verification'] == $this->getVerificationCodeSession($iVendorId, $iCustomerId, $aResult['amount_total'], $aResult['currency']);
    }

    protected function _getLineItems($sType, $aItem, $aParams = [])
    {
        $aLineItems = $aMetaItems = [];

        $bRecurring = $sType == BX_PAYMENT_TYPE_RECURRING;
        $sCurrency = ($sKey = 'vendor_currency_code') && !empty($aParams[$sKey]) ? $aParams[$sKey] : $this->_oModule->_oConfig->getDefaultCurrencyCode();

        $aProductData = [
            'name' => $aItem['title']
        ];
        if(!empty($aItem['description']))
            $aProductData['description'] = strmaxtextlen(strip_tags($aItem['description']), 60, '...');

        $aLineItem = [
            'price_data' => [
                'currency' => $sCurrency,
                'product_data' => $aProductData,
                'unit_amount' => 100 * $this->_oModule->_oConfig->getPrice($sType, $aItem, $this->_iAmountPrecision),
            ],
            'quantity' => $aItem['quantity'],
        ];
        
        if($bRecurring && ($mixedPeriod = $this->_oModule->_oConfig->getPeriod($sType, $aItem)) !== false) {
            list($iPeriod, $sPeriodUnit) = $mixedPeriod;
            $aLineItem['price_data']['recurring'] = [
                'interval' => $sPeriodUnit,
                'interval_count' => $iPeriod
            ];
        }

        $aLineItems[] = $aLineItem;
        $aMetaItems[] = $this->_oModule->_oConfig->descriptorA2S([$aItem['module_id'], $aItem['id']]);

        if(!empty($aItem['addons']) && is_array($aItem['addons']))
            foreach($aItem['addons'] as $aAddon) {
                $aAddonData = [
                    'name' => $aAddon['title']
                ];
                if(!empty($aAddon['description']))
                    $aAddonData['description'] = strmaxtextlen(strip_tags($aAddon['description']), 60, '...');

                $aLineItem = [
                    'price_data' => [
                        'currency' => $sCurrency,
                        'product_data' => $aAddonData,
                        'unit_amount' => 100 * $this->_oModule->_oConfig->getPrice($sType, $aAddon, $this->_iAmountPrecision),
                    ],
                    'quantity' => $aAddon['quantity'],
                ];
                
                if($bRecurring && ($mixedPeriod = $this->_oModule->_oConfig->getPeriod($sType, $aAddon)) !== false) {
                    list($iPeriod, $sPeriodUnit) = $mixedPeriod;
                    $aLineItem['price_data']['recurring'] = [
                        'interval' => $sPeriodUnit,
                        'interval_count' => $iPeriod
                    ];
                }

                $aLineItems[] = $aLineItem;
                $aMetaItems[] = $this->_oModule->_oConfig->descriptorA2S([$aAddon['module_id'], $aAddon['id']]);
            }

        return [$aLineItems, $aMetaItems];
    }

    protected function _processException($sMessage, &$oException)
    {
        if(method_exists($oException, 'getError') && ($oError = $oException->getError())) {
            $sError = $oError->message;
            $aError = $oError->toArray();
        }
        else { 
            $sError = $oException->getMessage();
            $aError = array();
        }

        $this->log($sMessage . $sError, '', BX_LOG_ERR);
        if(!empty($aError))
            $this->log($aError, '', BX_LOG_ERR);

        return false;
    }
}

/** @} */
