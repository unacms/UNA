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

/**
 * Credits payment provider can be used when 
 * Credits module is installed and active.
 */

class BxPaymentProviderCredits extends BxBaseModPaymentProvider implements iBxBaseModPaymentProvider
{
    protected $_sModuleCredits;

    function __construct($aConfig)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct($aConfig);

        $this->_sModuleCredits = $this->_oModule->_oConfig->CNF['MODULE_CREDITS'];
    }

    public function initializeCheckout($iPendingId, $aCartInfo, $sRedirect = '')
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName($this->_sModuleCredits))
            return ($sMsg = $this->_sLangsPrefix . 'cdt_err_not_available') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : $sMsg;

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return ($sMsg = $this->_sLangsPrefix . 'err_already_processed') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : $sMsg;

        $iSellerId = (int)$aCartInfo['vendor_id'];
        $sCustomData = $this->_constructCustomData($aCartInfo['vendor_id'], $iPendingId);
        $sReturnDataUrl = $this->getReturnDataUrl($iSellerId);

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                $aFormData = array(
                    'currency_code' => $aCartInfo['vendor_currency_code'],
                    'currency_sign' => $aCartInfo['vendor_currency_sign'],
                    'seller' => $iSellerId,
                    'amount' => (float)$aCartInfo['items_price'],
                    'items_count' => count($aCartInfo['items']),
                    'custom' => $sCustomData,
                    'return_data_url' => $sReturnDataUrl,
                );

                $iIndex = 0;
                foreach($aCartInfo['items'] as $aItem) {
                    $aFormData['item_title_' . $iIndex] = bx_process_output($aItem['title']);
                    $aFormData['item_quantity_' . $iIndex] = $aItem['quantity'];

                    $iIndex += 1;
                }

                $sCheckoutUrl = bx_srv($this->_sModuleCredits, 'get_checkout_url');
                if($this->_bIsApi)
                    return ['redirect' => bx_api_get_relative_url(bx_append_url_params($sCheckoutUrl, $aFormData))];

                $this->_oModule->_oTemplate->displayPageCodeRedirect($sCheckoutUrl, $aFormData);
                exit;

            case BX_PAYMENT_TYPE_RECURRING:
                $aItem = array_shift($aCartInfo['items']);

                return array(
                    'code' => 0,
                    'popup' => array(
                        'html' => bx_srv($this->_sModuleCredits, 'get_popup_subscribe', array(array(
                            'currency_code' => $aCartInfo['vendor_currency_code'],
                            'currency_sign' => $aCartInfo['vendor_currency_sign'],
                            'seller' => $iSellerId,
                            'title' => bx_process_output($aItem['title']),
                            'amount' => $aItem['price_recurring'],
                            'period' => $aItem['period_recurring'],
                            'period_unit' => $aItem['period_unit_recurring'],
                            'trial' => isset($aItem['trial_recurring']) ? $aItem['trial_recurring'] : 0,
                            'custom' => $sCustomData,
                            'return_data_url' => $sReturnDataUrl,
                        ))),
                        'options' => array(
                            'closeOnOuterClick' => true,
                            'removeOnClose' => true
                        )
                    )
                );
        }
    }

    public function finalizeCheckout(&$aData)
    {
        $aResult = $this->_finalizeCheckout($aData);
        if((int)$aResult['code'] != BX_PAYMENT_RESULT_SUCCESS) {
            $this->log('Finalize Checkout: Failed', '', BX_LOG_ERR);
            $this->log($aData, '', BX_LOG_ERR);
            $this->log($aResult, '', BX_LOG_ERR);
        }

        if(!empty($aResult['pending_id']))
            $this->_oModule->_oDb->updateOrderPending($aResult['pending_id'], array(
                'order' => $aResult['order'],
                'error_code' => $aResult['code'],
                'error_msg' => _t($aResult['message'])
            ));

        return $aResult;
    }

    public function makePayment($mixedPending)
    {
        if(!BxDolModuleQuery::getInstance()->isEnabledByName($this->_sModuleCredits))
            return ['code' => 1, 'message' => $this->_sLangsPrefix . 'cdt_err_not_available'];

        if(!is_array($mixedPending))
            $mixedPending = $this->_oModule->_oDb->getOrderPending(['type' => 'id', 'id' => (int)$mixedPending]);

        if(empty($mixedPending) || !is_array($mixedPending))
            return ['code' => 2, 'message' => $this->_sLangsPrefix . 'err_not_found_pending'];

        $iClient = (int)$mixedPending['client_id'];
        $oClient = BxDolProfile::getInstance($iClient);

        $iSeller = (int)$mixedPending['seller_id'];
        $oSeller = BxDolProfile::getInstance($iSeller);

        if(!$oClient || !$oSeller)
            return ['code' => 3, 'message' => $this->_sLangsPrefix . 'err_wrong_data'];

        $fAmountM = $this->_getAmountByPending($mixedPending);
        $fAmountC = bx_srv($this->_sModuleCredits, 'convert_money_to_credits', [$fAmountM]);

        $fClientBalance = bx_srv($this->_sModuleCredits, 'get_profile_balance', [$iClient]);
        if($fAmountC > $fClientBalance) {
            $aSubscription = $this->_oModule->_oDb->getSubscription([
                'type' => 'pending_id', 
                'pending_id' => $mixedPending['id']
            ]);

            if(!empty($aSubscription) && is_array($aSubscription)) {
                $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($this->_oModule->_oConfig->getPrefix('general') . 'wrong_balance', [
                    'profile_name' => $oClient->getDisplayName(),
                    'profile_link' => $oClient->getUrl(),
                    'subscription_id' => $aSubscription['subscription_id'],
                    'subscription_customer' => $aSubscription['customer_id'],
                    'subscription_provider' => _t('_bx_payment_txt_name_' . $mixedPending['provider']),
                    'subscription_date' => date(getParam('sys_format_date'), $aSubscription['date_add']),
                ], 0, $iClient);

                if($aTemplate !== false)
                    sendMail($oClient->getAccountObject()->getEmail(), $aTemplate['Subject'], $aTemplate['Body'], 0, [], BX_EMAIL_SYSTEM);
            }

            return ['code' => 4, 'message' => $this->_sLangsPrefix . 'cdt_err_wrong_balance'];
        }

        if(!bx_srv($this->_sModuleCredits, 'make_payment', [$iClient, $fAmountC, $iSeller, $mixedPending['order']]))
            return ['code' => 5, 'message' => $this->_sLangsPrefix . 'err_cannot_perform'];

        return true;        
    }

    public function cancelRecurring($iPendingId, $sCustomerId, $sSubscriptionId)
    {
        /**
         * @hooks
         * @hookdef hook-bx_payment-credits_cancel_subscription 'bx_payment', 'credits_cancel_subscription' - hook after a subscription was canceled
         * - $unit_name - equals `bx_payment`
         * - $action - equals `credits_cancel_subscription`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `pending_id` - [string] pending transaction id
         *      - `subscription_id` - [string] unique subscription id
         * @hook @ref hook-bx_payment-credits_cancel_subscription
         */
        bx_alert($this->MODULE, $this->_sName . '_cancel_subscription', 0, false, [
            'pending_id' => $iPendingId,
            'subscription_id' => $sSubscriptionId,
        ]);

        return true;
    }

    public function getMenuItemsActionsRecurring($iClientId, $iVendorId, $aParams = array())
    {
        return array();
    }

    protected function _finalizeCheckout(&$aData)
    {
        list($iSellerId, $iPendingId) = $this->_deconstructCustomData($aData['c']);

        if(empty($this->_aOptions) && !empty($iPendingId))
            $this->_aOptions = $this->getOptionsByPending((int)$iPendingId);

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if(empty($aPending) || !is_array($aPending))
            return array('code' => 1, 'message' => $this->_sLangsPrefix . 'err_not_found_pending');

        if(empty($this->_aOptions) || !BxDolModuleQuery::getInstance()->isEnabledByName($this->_sModuleCredits))
            return array('code' => 2, 'message' => $this->_sLangsPrefix . 'err_incorrect_provider', 'pending_id' => $iPendingId);

        switch($aPending['type']) {
            case BX_PAYMENT_TYPE_SINGLE:
                if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
                    return array('code' => 3, 'message' => $this->_sLangsPrefix . 'err_already_processed');

                $sOrder = $aData['o'];
                $fAmount = $this->_getAmountByPending($aPending);
                if(!bx_srv($this->_sModuleCredits, 'validate_checkout', array((int)$aPending['seller_id'], (int)$aPending['client_id'], $fAmount, $sOrder)))
                    return array('code' => 4, 'message' => $this->_sLangsPrefix . 'cdt_err_wrong_transaction', 'pending_id' => $iPendingId);

                $aResult = array(
                    'message' => $this->_sLangsPrefix . 'cdt_msg_charged',
                    'order' => $sOrder,
                    'paid' => true
                );
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $sSubscriptionId = bx_process_input($aData['sb']);

                $aResult = array(
                    'message' => $this->_sLangsPrefix . 'cdt_msg_subscribed',
                    'customer_id' => bx_process_input($aData['cs']),
                    'subscription_id' => $sSubscriptionId,
                    'trial' => (bool)$aData['tr'],
                    'order' => $sSubscriptionId,
                );
                break;
        }

        $oClient = BxDolProfile::getInstance($aPending['client_id']);
        return array_merge(array(
            'code' => BX_PAYMENT_RESULT_SUCCESS, 
            'message' => '',
            'pending_id' => $iPendingId,
            'client_name' => $oClient->getDisplayName(),
            'client_email' => $oClient->getAccountObject()->getEmail(),
            'order' => ''
        ), $aResult);
    }

    protected function _constructCustomData()
    {
        $aParams = func_get_args();
        return urlencode(base64_encode(implode('|', $aParams)));
    }

    protected function _deconstructCustomData($data)
    {
        return explode('|', base64_decode(urldecode($data)));
    }

    protected function _getAmountByPending($aPending)
    {
        $fCurrencyRate = false;
        $sCurrencyDefault = $this->_oModule->_oConfig->getDefaultCurrencyCode();
        if(!empty($aPending['data'])) {
            $aPendingData = unserialize($aPending['data']);

            if(!empty($aPendingData['cur_rate']))
                $fCurrencyRate = (float)$aPendingData['cur_rate'];

            if(!empty($aPendingData['cur_def']))
                $sCurrencyDefault = $aPendingData['cur_def'];
        }

        $fAmount = (float)$aPending['amount'];
        if(strcmp($aPending['currency'], $sCurrencyDefault) != 0)
            $fAmount = $this->_oModule->serviceConvert($fAmount, $aPending['currency'], $sCurrencyDefault, $fCurrencyRate);

        return $fAmount;
    }
}

/** @} */
