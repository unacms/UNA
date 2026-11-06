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

class BxPaymentProviderStripe extends BxPaymentProviderStripeBasic implements iBxBaseModPaymentProvider
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);

        $this->_aIncludeJs = array(
            'https://checkout.stripe.com/checkout.js',
            'stripe.js'
        );
    }

    public function initializeCheckout($iPendingId, $aCartInfo, $sRedirect = '')
    {
    	$sToken = bx_process_input(bx_get('token'));

    	if(empty($aCartInfo['items']) || !is_array($aCartInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_items';

        $aClient = $this->_oModule->getProfileInfo();
        $aVendor = $this->_oModule->getProfileInfo($aCartInfo['vendor_id']);

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return $this->_sLangsPrefix . 'err_already_processed';

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $aCartInfo['items_title'] = '';
                foreach($aCartInfo['items'] as $aItem)
                    $aCartInfo['items_title'] .= ' ' . $aItem['title'] . ',';
                $aCartInfo['items_title'] = trim($aCartInfo['items_title'], ', ');

                $mixedResult = $this->_createCharge($sToken, $iPendingId, $aClient, $aCartInfo);
                if($mixedResult === false)
                    return $this->_sLangsPrefix . 'err_cannot_perform';

                header("Location: " . $this->getReturnDataUrl($aVendor['id'], array(
                    'order_id' => $mixedResult['order'],
                    'customer_id' => $mixedResult['customer'], 
                    'pending_id' => $aPending['id'],
                    'redirect' => $sRedirect
                )));
                exit;

            case BX_PAYMENT_TYPE_RECURRING:
                $mixedResult = $this->_createSubscription($sToken, $iPendingId, $aClient, $aCartInfo);
                if($mixedResult === false)
                    return $this->_sLangsPrefix . 'err_cannot_perform';

                return array(
                    'code' => 0,
                    'eval' => $this->_oModule->_oConfig->getJsObject('cart') . '.onSubscribeSubmit(oData);',
                    'redirect' => $this->getReturnDataUrl($aVendor['id'], array(
                        'order_id' => $mixedResult['order'],
                        'customer_id' => $mixedResult['customer'],
                        'pending_id' => $aPending['id'],
                        'redirect' => $sRedirect
                    ))
                );
        }
    }

    public function finalizeCheckout(&$aData)
    {
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
            'paid' => false,
            'trial' => false,
            'redirect' => $sRedirect
        );

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $oCustomer = $this->_retrieveCustomer(BX_PAYMENT_TYPE_SINGLE, $sCustomerId);
                $oCharge = $this->_retrieveCharge($sOrderId);
                if($oCustomer === false || $oCharge === false)
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                $aCustomer = $oCustomer->jsonSerialize();
                $aCharge = $oCharge->jsonSerialize();
                if(empty($aCustomer) || !is_array($aCustomer) || empty($aCharge) || !is_array($aCharge))
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'err_cannot_perform');

                $aResult = array_merge($aResult, array(
                    'message' => $this->_sLangsPrefix . 'strp_msg_charged',
                    'client_email' => $aCustomer['email'],
                    'paid' => (bool)$aCharge['paid']
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

                $aResult = array_merge($aResult, array(
                    'message' => $this->_sLangsPrefix . 'strp_msg_subscribed',
                    'customer_id' => $sCustomerId,
                    'subscription_id' => $sOrderId,
                    'client_email' => $aCustomer['email'],
                    'trial' => $aSubscription['status'] == 'trialing'
                ));
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

    public function getCheckoutParamsSingle($aParams, &$oGrid)
    {
    	if(bx_get('token') !== false)
            $aParams['token'] = bx_process_input(bx_get('token'));

    	return $aParams;
    }

    public function getVerificationCodeCharge($iVendorId, $iCustomerId, $fAmount, $sCurrency)
    {
        $sCode = $this->_getVerificationCodeCharge($iVendorId, $iCustomerId, $fAmount, $sCurrency);

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_get_code_charge 'bx_payment', 'stripe_get_code_charge' - hook to override verification code for 'charge' action
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_get_code_charge`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `provider` - [object] an instance of provider, @see BxBaseModPaymentProvider
         *      - `vendor_id` - [int] vendor (seller) profile id
         *      - `customer_id` - [int] customer (buyer) profile id
         *      - `amount` - [float] charge amount
         *      - `currency` - [string] charge currency code
         *      - `override_result` - [string] by ref, verification code, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_get_code_charge
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_get_code_charge', 0, false, [
            'provider' => $this,
            'vendor_id' => $iVendorId, 
            'customer_id' => $iCustomerId,
            'amount' => $fAmount,
            'currency' => $sCurrency,
            'override_result' => &$sCode
        ]);

        return $sCode;
    }

    public function checkVerificationCodeCharge($iVendorId, $iCustomerId, $aResult)
    {
        $bCheckResult = $this->_checkVerificationCodeCharge($iVendorId, $iCustomerId, $aResult);

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_verify_charge 'bx_payment', 'stripe_verify_charge' - hook to override code verification for 'charge' action
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_verify_charge`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `provider` - [object] an instance of provider, @see BxBaseModPaymentProvider
         *      - `vendor_id` - [int] vendor (seller) profile id
         *      - `customer_id` - [int] customer (buyer) profile id
         *      - `result` - [array] results array received from payment provider
         *      - `override_result` - [boolean] by ref, is verification passed or not, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_verify_charge
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_verify_charge', 0, false, array(
            'provider' => $this,
            'vendor_id' => $iVendorId, 
            'customer_id' => $iCustomerId,
            'result' => $aResult,
            'override_result' => &$bCheckResult
        ));

        return $bCheckResult;
    }

    public function getVerificationCodeSubscription($iVendorId, $iCustomerId, $sSubscription, $sCurrency)
    {
        $sCode = $this->_getVerificationCodeSubscription($iVendorId, $iCustomerId, $sSubscription, $sCurrency);

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_get_code_subscription 'bx_payment', 'stripe_get_code_subscription' - hook to override verification code for 'subscribe' action
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_get_code_subscription`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `provider` - [object] an instance of provider, @see BxBaseModPaymentProvider
         *      - `vendor_id` - [int] vendor (seller) profile id
         *      - `customer_id` - [int] customer (buyer) profile id
         *      - `subscription` - [string] unique subscription id
         *      - `currency` - [string] charge currency code
         *      - `override_result` - [string] by ref, verification code, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_get_code_subscription
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_get_code_subscription', 0, false, [
            'provider' => $this,
            'vendor_id' => $iVendorId, 
            'customer_id' => $iCustomerId,
            'subscription' => $sSubscription,
            'currency' => $sCurrency,
            'override_result' => &$sCode
        ]);

        return $sCode;
    }
    
    public function checkVerificationCodeSubscription($iVendorId, $iCustomerId, $aResult)
    {
        $bCheckResult = $this->_checkVerificationCodeSubscription($iVendorId, $iCustomerId, $aResult);

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_verify_subscription 'bx_payment', 'stripe_verify_subscription' - hook to override code verification for 'subscribe' action
         * It's equivalent to @ref hook-bx_payment-stripe_verify_charge
         * @hook @ref hook-bx_payment-stripe_verify_subscription
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_verify_subscription', 0, false, array(
            'provider' => $this,
            'vendor_id' => $iVendorId, 
            'customer_id' => $iCustomerId,
            'result' => $aResult,
            'override_result' => &$bCheckResult
        ));

        return $bCheckResult;
    }

    protected function _createToken($aCard)
    {
        try {
            $oToken = Stripe\Token::create(array('card' => $aCard));
        }
        catch (\Stripe\Exception\ApiErrorException $oException) {
            return $this->_processException('Create Token Error: ', $oException);
        }

        return $oToken->jsonSerialize();
    }

    protected function _createCustomer($sType, $sToken, $aClient)
    {
        $oCustomer = null;
        $aCustomer = array(
            'card' => $sToken,
            'email' => !empty($aClient['email']) ? $aClient['email'] : ''
        );

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_create_customer 'bx_payment', 'stripe_create_customer' - hook to override customer data redurned by payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_create_customer`
         * - $object_id - not used
         * - $sender_id - client (buyer) profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] payment type: single or recurring
         *      - `customer_object` - [object] by ref, an instance of customer, redurned by payment provider, can be overridden in hook processing
         *      - `customer_params` - [array] by ref, array with customer parameters, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_create_customer
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_create_customer', 0, $aClient['id'], [
            'type' => $sType,

            'customer_object' => &$oCustomer, 
            'customer_params' => &$aCustomer,

            'customer_object_ref' => &$oCustomer, 
            'customer_params_ref' => &$aCustomer,
        ]);

        try {
            $this->_oCustomer = !empty($oCustomer) ? $oCustomer : \Stripe\Customer::create($aCustomer);
        }
        catch (Exception $oException) {
            return $this->_processException('Create Customer Error: ', $oException);
        }

        return $this->_oCustomer->jsonSerialize();
    }

    protected function _createCharge($sToken, $iPendingId, &$aClient, &$aCartInfo)
    {
        if(empty($this->_oCustomer))
            $this->_createCustomer(BX_PAYMENT_TYPE_SINGLE, $sToken, $aClient);

        if(empty($this->_oCustomer))
            return false;

        $fAmount = 100 * (float)$aCartInfo['items_price'];

        $oCharge = null;
        $aCharge = array(
            'customer' => $this->_oCustomer->id,
            'amount' => $fAmount,
            'currency' => $aCartInfo['vendor_currency_code'],
            'description' => $aCartInfo['items_title'],
            'metadata' => array(
                'vendor' => $aCartInfo['vendor_id'],
                'client' => $aClient['id'],
                'product' => $iPendingId,
                'verification' => $this->getVerificationCodeCharge($aCartInfo['vendor_id'], $aClient['id'], $fAmount, $aCartInfo['vendor_currency_code'])
            )
        );

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_create_charge 'bx_payment', 'stripe_create_charge' - hook to override charge data redurned by payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_create_charge`
         * - $object_id - pending transaction id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `charge_object` - [object] by ref, an instance of charge, redurned by payment provider, can be overridden in hook processing
         *      - `charge_params` - [array] by ref, array with charge parameters, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_create_charge
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_create_charge', $iPendingId, false, [
            'charge_object' => &$oCharge, 
            'charge_params' => &$aCharge,
            'charge_params_ref' => &$aCharge,
        ]);

        try {
            if(empty($oCharge))
                $oCharge = \Stripe\Charge::create($aCharge);
        }
        catch (Exception $oException) {
            return $this->_processException('Create Charge Error: ', $oException);
        }

        $aResult = $oCharge->jsonSerialize();
        if(empty($aResult) || !is_array($aResult) || empty($aResult['paid']))
            return false;

        $aMetadata = $aResult['metadata'];
        if(!$this->checkVerificationCodeCharge($aCartInfo['vendor_id'], $aClient['id'], $aResult))
            return false;

        return array(
            'pending' => $iPendingId,
            'amount' =>(float)$aResult['amount'] / 100,
            'customer' => $this->_oCustomer->id,
            'order' => $aResult['id']
        );
    }

    protected function _createSubscription($sToken, $iPendingId, &$aClient, &$aCartInfo)
    {
        if(empty($this->_oCustomer))
            $this->_createCustomer(BX_PAYMENT_TYPE_RECURRING, $sToken, $aClient);

        if(empty($this->_oCustomer))
            return false;

        $aItem = array_shift($aCartInfo['items']);
        if(empty($aItem) || !is_array($aItem))
            return false;

        $iTrial = $this->_oModule->_oConfig->getTrial(BX_PAYMENT_TYPE_RECURRING, $aItem);
        $bTrial = !empty($iTrial);

        $oSubscription = null;
        $aSubscription = array(
            'plan' => $aItem['name'],
            'metadata' => array(
                'vendor' => $aCartInfo['vendor_id'],
                'client' => $aClient['id'],
                'product' => $iPendingId,
                'verification' => $this->getVerificationCodeSubscription($aCartInfo['vendor_id'], $aClient['id'], $aItem['name'], $aCartInfo['vendor_currency_code'])
            )
        );

        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_create_subscription 'bx_payment', 'stripe_create_subscription' - hook to override subscription data redurned by payment provider
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_create_subscription`
         * - $object_id - pending transaction id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `customer` - [object] by ref, an instance of customer, can be overridden in hook processing
         *      - `subscription_object` - [object] by ref, an instance of subscription, redurned by payment provider, can be overridden in hook processing
         *      - `subscription_params` - [array] by ref, array with subscription parameters, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_create_subscription
         */
        bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_create_subscription', $iPendingId, false, [
            'customer' => &$this->_oCustomer,

            'subscription_object' => &$oSubscription, 
            'subscription_params' => &$aSubscription,

            'subscription_object_ref' => &$oSubscription, 
            'subscription_params_ref' => &$aSubscription,
        ]);

        try {
            if(empty($oSubscription))
                $oSubscription = \Stripe\Subscription::create(['customer' => $this->_oCustomer->id, 'items' => [['price' => $aItem['name']]], 'metadata' => $aSubscription['metadata']]);				
        }
        catch (Exception $oException) {
            return $this->_processException('Create Subscription Error: ', $oException);
        }

        $aResult = $oSubscription->jsonSerialize();
        if(empty($aResult) || !is_array($aResult) || (!$bTrial && $aResult['status'] != 'active') || ($bTrial && !in_array($aResult['status'], array('active', 'trialing'))))
            return false;

        if(!$this->checkVerificationCodeSubscription($aCartInfo['vendor_id'], $aClient['id'], $aResult))
            return false;

        return array(
            'pending' => $iPendingId,
            'amount' =>(float)$aCartInfo['items_price'],
            'customer' => $this->_oCustomer->id, 
            'order' => $aResult['id'],
            'trial' => $bTrial
        );
    }

    protected function _createCard($sType, $sCustomerId, $sToken)
    {
        try {
            $oCard = $this->_retrieveCustomer($sType, $sCustomerId)->sources->create(array(
                'source' => $sToken
            ));
        }
        catch (\Stripe\Exception\ApiErrorException $oException) {
            return $this->_processException('Create Card Error: ', $oException);
        }

        return $oCard->jsonSerialize();
    }

    protected function _retrieveCard($sCustomerId, $sCardId = '') {
        try {
            $oCustomer = \Stripe\Customer::retrieve($sCustomerId);
            $oCard = $oCustomer->sources->retrieve(!empty($sCardId) ? $sCardId : $oCustomer->default_source);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Card Error: ', $oException);
        }

        return $oCard;
    }

    protected function _retrieveCoupon($sId) {
        try {
            $oCoupon = \Stripe\Coupon::retrieve($sId);
        }
        catch (Exception $oException) {
            return $this->_processException('Retrieve Coupon Error: ', $oException);
        }

        return $oCoupon;
    }

    protected function _getButtonJs($sType, $iClientId, $iVendorId, $aParams = array())
    {
        $sClientEmail = '';
    	if(!empty($iClientId) && ($oClient = BxDolProfile::getInstance($iClientId)) !== false)
            $sClientEmail = $oClient->getAccountObject()->getEmail();

        $sPublicKey = '';
        
        /**
         * @hooks
         * @hookdef hook-bx_payment-stripe_get_button 'bx_payment', 'stripe_get_button' - hook to override checkout/subscibe button
         * - $unit_name - equals `bx_payment`
         * - $action - equals `stripe_get_button`
         * - $object_id - not used
         * - $sender_id - client (buyer) profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] by ref, payment type ('single' or 'recurring'), can be overridden in hook processing
         *      - `public_key` - [string] by ref, Stripe public key, can be overridden in hook processing
         * @hook @ref hook-bx_payment-stripe_get_button
         */
    	bx_alert($this->_oModule->_oConfig->getName(), $this->_sName . '_get_button', 0, $iClientId, [
            'type' => &$sType, 
            'public_key' => &$sPublicKey,

            'type_ref' => &$sType, 
            'public_key_ref' => &$sPublicKey,
        ]);

        $sJsMethod = '';
        $sJsObject = $this->getJsObject($aParams);
        switch($sType) {
            case BX_PAYMENT_TYPE_SINGLE:
                $sJsMethod = $sJsObject . '.checkout(this)';
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $sJsMethod = $sJsObject . '.subscribe(this)';
                break;
        }

        return array($this->_oModule->_oTemplate->getJsCode($this->_sName, array_merge(array(
            'js_object' => $sJsObject,
            'sProvider' => $this->_sName,
            'sPublicKey' => !empty($sPublicKey) ? $sPublicKey : $this->_getPublicKey(),
            'sVendorName' => '',
            'sVendorCurrency' => '',
            'sVendorIcon' => '',
            'sClientEmail' => $sClientEmail,
        ), $aParams)), $sJsMethod);
    }
    
    protected function _getVerificationCodeCharge($iVendorId, $iCustomerId, $fAmount, $sCurrency)
    {
        return md5(implode('#-#', array(
            (int)$iVendorId,
            (int)$iCustomerId,
            (float)$fAmount,
            strtoupper($sCurrency)
        )));
    }

    protected function _checkVerificationCodeCharge($iVendorId, $iCustomerId, $aResult)
    {
        return !empty($aResult['metadata']['verification']) && $aResult['metadata']['verification'] == $this->getVerificationCodeCharge($iVendorId, $iCustomerId, $aResult['amount'], $aResult['currency']);
    }

    protected function _getVerificationCodeSubscription($iVendorId, $iCustomerId, $sSubscription, $sCurrency)
    {
        return md5(implode('#-#', array(
            (int)$iVendorId,
            (int)$iCustomerId,
            strtoupper($sSubscription),
            strtoupper($sCurrency)
        )));
    }

    protected function _checkVerificationCodeSubscription($iVendorId, $iCustomerId, $aResult)
    {
        return !empty($aResult['metadata']['verification']) && $aResult['metadata']['verification'] == $this->getVerificationCodeSubscription($iVendorId, $iCustomerId, $aResult['plan']['id'], $aResult['plan']['currency']);
    }
}

/** @} */
