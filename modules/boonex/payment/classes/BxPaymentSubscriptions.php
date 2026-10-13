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

class BxPaymentSubscriptions extends BxBaseModPaymentSubscriptions
{
    function __construct()
    {
    	$this->MODULE = 'bx_payment';

    	parent::__construct();
    }

    /*
     * Service methods
     */
    
    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-page_blocks Page Blocks
     * @subsubsection bx_payment-get_block_list_my get_block_list_my
     * 
     * @code bx_srv('bx_payment', 'get_block_list_my', [...], 'Subscriptions'); @endcode
     * 
     * Get page block with a list of currently logged in member's subscriptions.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPaymentSubscriptions::serviceGetBlockListMy
     */
    /** 
     * @ref bx_payment-get_block_list_my "get_block_list_my"
     */
    public function serviceGetBlockListMy()
    {
        return $this->_getBlock('list_my');
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-page_blocks Page Blocks
     * @subsubsection bx_payment-get_block_list_all get_block_list_all
     * 
     * @code bx_srv('bx_payment', 'get_block_list_all', [...], 'Subscriptions'); @endcode
     * 
     * Get page block with a list of all subscriptions. It's available for authorized members only.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPaymentSubscriptions::serviceGetBlockListAll
     */
    /** 
     * @ref bx_payment-get_block_list_all "get_block_list_all"
     */
    public function serviceGetBlockListAll()
    {
        return $this->_getBlock('list_all');
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-page_blocks Page Blocks
     * @subsubsection bx_payment-get_block_history get_block_history
     * 
     * @code bx_srv('bx_payment', 'get_block_history', [...], 'Subscriptions'); @endcode
     * 
     * Get page block with a list of payments related to subscriptions of currently logged in member.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPaymentSubscriptions::serviceGetBlockHistory
     */
    /** 
     * @ref bx_payment-get_block_history "get_block_history"
     */
    public function serviceGetBlockHistory()
    {
        return $this->_getBlock('history');
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_subscription_orders_info get_subscription_orders_info
     * 
     * @code bx_srv('bx_payment', 'get_subscription_orders_info', [...], 'Subscriptions'); @endcode
     * 
     * Get subscription transaction(s) which meets all requirements.
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
     * @return an array of transactions. Each transaction has full info(client ID, seller ID, external transaction ID, date and so on)
     * 
     * @see BxPaymentSubscriptions::serviceGetSubscriptionOrdersInfo
     */
    /** 
     * @ref bx_payment-get_subscription_orders_info "get_subscription_orders_info"
     */
    public function serviceGetSubscriptionOrdersInfo($aConditions)
    {
        if(empty($aConditions) || !is_array($aConditions))
            return array();

        return $this->_oModule->_oDb->getOrderSubscription(array('type' => 'mixed', 'conditions' => $aConditions));
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_subscriptions_info get_subscriptions_info
     * 
     * @code bx_srv('bx_payment', 'get_subscriptions_info', [...], 'Subscriptions'); @endcode
     * 
     * Get subscription(s) which meets all requirements.
     *
     * @param $aConditions an array of pears('key' => 'value'). The most useful keys are the following:
     * a. pending_id - pending transaction ID (integer)
     * b. customer_id - customer ID from payment provider (string)
     * c. subscription_id - subscription ID from payment provider (string)
     * d. paid - flag determining whether the subscription paid or not (integer)
     * e. date - the date when the subscription was established(UNIXTIME STAMP)
     * @param $bCheckInProvider boolean value determining whether the subscription should be checked in associated payment provider.
     * @return an array of subscriptions. Each subscription has full info(pending ID, customer ID, subscription ID and so on)
     * 
     * @see BxPaymentSubscriptions::serviceGetSubscriptionsInfo
     */
    /** 
     * @ref bx_payment-get_subscriptions_info "get_subscriptions_info"
     */
    public function serviceGetSubscriptionsInfo($aConditions, $bCheckInProvider = false)
    {
        if(empty($aConditions) || !is_array($aConditions))
            return array();

        $aSubscriptions = $this->_oModule->_oDb->getSubscription(array('type' => 'mixed_ext', 'conditions' => $aConditions));
        if(empty($aSubscriptions) || !is_array($aSubscriptions) || !$bCheckInProvider)
            return $aSubscriptions;

        foreach($aSubscriptions as $iKey => $aSubscription) {
            if(empty($aSubscription['provider']) || $aSubscription['provider'] == 'manual')
                continue;

            $oProvider = $this->_oModule->getObjectProvider($aSubscription['provider'], $aSubscription['seller_id']);
            if(!$oProvider)
                continue;

            $aSubscriptions[$iKey]['data'] = $oProvider->getSubscription($aSubscription['pending_id'], $aSubscription['customer_id'], $aSubscription['subscription_id']);
        }

        return $aSubscriptions;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_subscriptions_after get_subscriptions_after
     *
     * @code bx_srv('bx_payment', 'get_subscriptions_after', [0, 500, false], 'Subscriptions'); @endcode
     *
     * Get subscriptions a page at a time, ordered by their pending transaction ID, to read
     * them all in steps. Pass the pending ID of the last subscription of the previous page to
     * get the next one.
     *
     * @param $iAfterPendingId integer value, the subscriptions with a greater pending ID are returned (0 for the first page).
     * @param $iLimit integer value, subscriptions per page (at most 5000).
     * @param $bDeleted boolean value, read cancelled (deleted) subscriptions instead of the current ones.
     * @return an array of subscriptions. Each has pending_id, subscription_id, period, period_unit, trial, date_add, date_next and status, its order's client_id, seller_id, type, provider, items, amount, currency, order and data, and for deleted ones the reason and the time they were deleted.
     *
     * @see BxPaymentSubscriptions::serviceGetSubscriptionsAfter
     */
    /**
     * @ref bx_payment-get_subscriptions_after "get_subscriptions_after"
     */
    public function serviceGetSubscriptionsAfter($iAfterPendingId = 0, $iLimit = 500, $bDeleted = false)
    {
        return $this->_oModule->_oDb->getSubscriptionsAfter((int)$iAfterPendingId, (int)$iLimit, (bool)$bDeleted);
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-subscribe subscribe
     * 
     * @code bx_srv('bx_payment', 'subscribe', [...], 'Subscriptions'); @endcode
     * 
     * Initialize subscription for specified item.
     *
     * @param $iSellerId integer value with seller ID.
     * @param $sSellerProvider string value with a name of payment provider to be used for processing. Empty value means that payment provider selector should be shown.
     * @param $iModuleId integer value with module ID.
     * @param $iItemId integer value with item ID.
     * @param $iItemCount integer value with a number of items for purchasing. It's equal to 1 in case of subscription.
     * @param $sRedirect (optional) string value with redirect URL, if it's needed. 
     * @return an array with special format which describes the result of operation.
     * 
     * @see BxPaymentSubscriptions::serviceSubscribe
     */
    /** 
     * @ref bx_payment-subscribe "subscribe"
     */
    public function serviceSubscribe($iSellerId, $sSellerProvider, $iModuleId, $iItemId, $iItemCount, $sRedirect = '', $aCustom = array())
    {
        return $this->serviceSubscribeWithAddons($iSellerId, $sSellerProvider, $iModuleId, $iItemId, $iItemCount, '', $sRedirect, $aCustom);
    }
    
    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-subscribe_with_addons subscribe_with_addons
     * 
     * @code bx_srv('bx_payment', 'subscribe_with_addons', [...], 'Subscriptions'); @endcode
     * 
     * Initialize subscription for specified item.
     *
     * @param $iSellerId integer value with seller ID.
     * @param $sSellerProvider string value with a name of payment provider to be used for processing. Empty value means that payment provider selector should be shown.
     * @param $iModuleId integer value with module ID.
     * @param $iItemId integer value with item ID.
     * @param $iItemCount integer value with a number of items for purchasing. It's equal to 1 in case of subscription.
     * @param $sItemAddons (optional) string with attached addons.
     * @param $sRedirect (optional) string value with redirect URL, if it's needed. 
     * @return an array with special format which describes the result of operation.
     * 
     * @see BxPaymentSubscriptions::serviceSubscribeWithAddons
     */
    /** 
     * @ref bx_payment-subscribe_with_addons "subscribe_with_addons"
     */
    public function serviceSubscribeWithAddons($iSellerId, $sSellerProvider, $mixedModuleId, $iItemId, $iItemCount, $sItemAddons = '', $sRedirect = '', $aCustom = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $iModuleId = $this->_oModule->_oConfig->getModuleId($mixedModuleId);
    	$iClientId = $this->_oModule->getProfileId();

    	$mixedResult = $this->_oModule->checkData($iClientId, $iSellerId, $iModuleId, $iItemId, $iItemCount);
    	if($mixedResult !== true)
            return $mixedResult;

        $aSellerProviders = $this->_oModule->_oDb->getVendorInfoProvidersRecurring($iSellerId, true);
        if(empty($aSellerProviders))
            return array('code' => 5, 'message' => _t($CNF['T']['ERR_NOT_ACCEPT_PAYMENTS']));

        $aCartItem = array($iSellerId, $iModuleId, $iItemId, $iItemCount, $sItemAddons);

        if(empty($sSellerProvider)) {
            $sId = $this->_oModule->_oConfig->getHtmlIds('cart', 'providers_select') . BX_PAYMENT_TYPE_RECURRING;
            $sTitle = _t($CNF['T']['POPUP_PROVIDERS_SELECT']);
            return array('popup' => array(
                'html' => BxTemplFunctions::getInstance()->popupBox($sId, $sTitle, $this->_oModule->_oTemplate->displayProvidersSelector($aCartItem, $aSellerProviders, $sRedirect, $aCustom)), 
                'options' => array('closeOnOuterClick' => true)
            ));
        }

        $aCustoms = array();
        $this->_oModule->_oConfig->putCustom($aCartItem, $aCustom, $aCustoms);

        $sCartItem = $this->_oModule->_oConfig->descriptorA2S($aCartItem);
        $mixedResult = $this->_oModule->serviceInitializeCheckout(BX_PAYMENT_TYPE_RECURRING, $iSellerId, $aSellerProviders[$sSellerProvider]['name'], array($sCartItem), $sRedirect, $aCustoms);
        if(is_string($mixedResult))
            return array('code' => 6, 'message' => _t($mixedResult));

        return $mixedResult;
    }

    public function serviceCancel($sOrder, $bForce = true)
    {
        $aPending = $this->_oModule->_oDb->getOrderPending(['type' => 'order', 'order' => $sOrder]);
        if(empty($aPending) || !is_array($aPending))
            return ['code' => 1, 'message' => _t('_bx_payment_err_not_found_pending')];

        if(!(bool)$bForce && ($mixedResult = $this->_oModule->isAllowedManage($aPending)) !== true)
            return ['code' => 2, 'message' => $mixedResult];

        if(!$this->cancel((int)$aPending['id']))
            return ['code' => 3, 'message' => _t('_bx_payment_err_cannot_perform')];

        return ['code' => 0, 'message' => _t('_bx_payment_msg_successfully_performed')];
    }

    public function serviceCancelByPendingId($iId, $bForce = true)
    {
        $aPending = $this->_oModule->_oDb->getOrderPending(['type' => 'id', 'id' => $iId]);
        if(empty($aPending) || !is_array($aPending))
            return ['code' => 1, 'message' => _t('_bx_payment_err_not_found_pending')];

        if(!(bool)$bForce && ($mixedResult = $this->_oModule->isAllowedManage($aPending)) !== true)
            return ['code' => 2, 'message' => $mixedResult];

        if(!$this->cancel((int)$aPending['id']))
            return ['code' => 3, 'message' => _t('_bx_payment_err_cannot_perform')];

        return ['code' => 0, 'message' => _t('_bx_payment_msg_successfully_performed')];
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-send_subscription_expiration_letters send_subscription_expiration_letters
     * 
     * @code bx_srv('bx_payment', 'send_subscription_expiration_letters', [...], 'Subscriptions'); @endcode
     * 
     * Send subscription expiration letters.
     *
     * @param $iPendingId integer value with pending transaction ID.
     * @param $sOrderId string value with order ID.
     * 
     * @see BxPaymentSubscriptions::serviceSendSubscriptionExpirationLetters
     */
    /** 
     * @ref bx_payment-send_subscription_expiration_letters "send_subscription_expiration_letters"
     */
    public function serviceSendSubscriptionExpirationLetters($iPendingId, $sOrderId)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;
        $sPrefix = $this->_oModule->_oConfig->getPrefix('general');

        $aSubscription = $this->serviceGetSubscriptionsInfo(array('subscription_id' => $sOrderId));
        if(empty($aSubscription) || !is_array($aSubscription))
            return;

        $aSubscription = array_shift($aSubscription);

        $oSeller = BxDolProfile::getInstance((int)$aSubscription['seller_id']);
        $oClient = BxDolProfile::getInstance((int)$aSubscription['client_id']);

        $aEtParams = array(
            'subscription_id' => $aSubscription['subscription_id'],
            'subscription_customer' => $aSubscription['customer_id'],
            'subscription_date' => bx_time_js($aSubscription['date_add'], BX_FORMAT_DATE, true)
        );

        /**
         * Notify seller.
         */
        if($oSeller !== false) {
            $sEmail = '';
            $oProvider = $this->_oModule->getObjectProvider($aSubscription['provider'], $aSubscription['seller_id']);
            if($oProvider !== false && $oProvider->isActive())
                $sEmail = $oProvider->getOption('expiration_email');

            if(empty($sEmail))
                $sEmail = $oSeller->getAccountObject()->getEmail();

            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($sPrefix . 'expiration_notification_seller', $aEtParams, 0, (int)$aSubscription['client_id']);

            sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, array(), BX_EMAIL_SYSTEM);
        }

        /**
         * Notify client.
         */
        if($oClient !== false) {
            $sEmail = $oClient->getAccountObject()->getEmail();
            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($sPrefix . 'expiration_notification_client', $aEtParams, 0, (int)$aSubscription['seller_id']);

            sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, array(), BX_EMAIL_SYSTEM);
        }
    }

    public function register($aPending, $aParams = array())
    {
        if($this->_oModule->_oDb->isSubscriptionByPending($aPending['id']) || empty($aPending['items']))
            return false;

        $aInfo = $this->_oModule->getObjectCart()->getInfo(BX_PAYMENT_TYPE_RECURRING, $aPending['client_id'], $aPending['seller_id'], $aPending['items']);
        if(empty($aInfo['items']) || !is_array($aInfo['items']))
            return false;

        $aItem = array_shift($aInfo['items']);

        $iPeriod = (int)$aItem['period_recurring'];
        $iTrial = (int)$aItem['trial_recurring'];

        $oDate = date_create();
        $iNow = $iNext = date_format($oDate, 'U');

        if((!empty($aParams['status']) && $aParams['status'] == BX_PAYMENT_SBS_STATUS_ACTIVE) || $iTrial > 0) {
            $sInterval = $this->_getInterval($iPeriod, $aItem['period_unit_recurring'], $iTrial);
            date_add($oDate, new DateInterval($sInterval));
            $iNext = date_format($oDate, 'U');
        }

        $sUnique = genRndPwd(9, false);

        $aSubscription = array(
            'pending_id' => $aPending['id'],
            'customer_id' => !empty($aParams['customer_id']) ? $aParams['customer_id'] : 'bx_cus_' . $sUnique,
            'subscription_id' => !empty($aParams['subscription_id']) ? $aParams['subscription_id'] : 'bx_sub_' . $sUnique,
            'period' => $iPeriod,
            'period_unit' => $aItem['period_unit_recurring'],
            'trial' => $iTrial,
            'date_add' => $iNow,
            'date_next' => $iNext,
            'status' => !empty($aParams['status']) ? $aParams['status'] : ($iTrial > 0 ? BX_PAYMENT_SBS_STATUS_TRIAL : BX_PAYMENT_SBS_STATUS_UNPAID)
        );

        if(!$this->_oModule->_oDb->insertSubscription($aSubscription))
            return false;

        $this->_oModule->onSubscriptionCreate($aPending, $aSubscription);

        return true;
    }

    public function prolong($aPending, $aParams = array())
    {
        if(empty($aPending['items']))
            return false;

        $aSubscription = $this->_oModule->_oDb->getSubscription(array('type' => 'pending_id', 'pending_id' => $aPending['id']));
        if(empty($aSubscription) || !is_array($aSubscription))
            return false;

        $aInfo = $this->_oModule->getObjectCart()->getInfo(BX_PAYMENT_TYPE_RECURRING, $aPending['client_id'], $aPending['seller_id'], $aPending['items']);
        if(empty($aInfo['items']) || !is_array($aInfo['items']))
            return false;

        $aItem = array_shift($aInfo['items']);
        $iItemPeriod = (int)$aItem['period_recurring'];
        $sItemPeriodUnit = $aItem['period_unit_recurring'];

        $iDateNext = 0;
        if(!empty($iItemPeriod) && !empty($sItemPeriodUnit)) {
            $sInterval = $this->_getInterval($iItemPeriod, $sItemPeriodUnit);
            if(empty($sInterval))
                return false;

            $oDate = date_create('@' . $aSubscription['date_next']);
            date_add($oDate, new DateInterval($sInterval));
            $iDateNext = date_format($oDate, 'U');
        }

        $this->_oModule->_oDb->updateSubscription(array_merge(array(
            'date_next' => $iDateNext,
            'pay_attempts' => 0,
            'status' => BX_PAYMENT_SBS_STATUS_ACTIVE
        ), $aParams), array(
            'id' => $aSubscription['id']
        ));

        $this->_oModule->onSubscriptionProlong($aPending, $aSubscription);

        return true;
    }

    public function overdue($aPending, $aParams = array())
    {
        $aSubscription = $this->_oModule->_oDb->getSubscription(array('type' => 'pending_id', 'pending_id' => $aPending['id']));
        if(empty($aSubscription) || !is_array($aSubscription))
            return false;

        $this->_oModule->_oDb->updateSubscription(array_merge(array(
            'status' => BX_PAYMENT_SBS_STATUS_UNPAID
        ), $aParams), array(
            'id' => $aSubscription['id']
        ));

        $this->_oModule->onSubscriptionOverdue($aPending, $aSubscription);

        return true;
    }

    public function cancel($iPendingId, $sReason = '')
    {
        if(!$this->cancelRemote($iPendingId))
            return false;

        if(!$this->cancelLocal($iPendingId, $sReason))
            return false;

        return true;
    }

    public function cancelRemote($mixedPending)
    {
        $aPending = is_array($mixedPending) ? $mixedPending : $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => (int)$mixedPending));
        if(empty($aPending) || !is_array($aPending) || $aPending['type'] != BX_PAYMENT_TYPE_RECURRING)
            return false;

        $aSubscription = $this->_oModule->_oDb->getSubscription(array('type' => 'pending_id', 'pending_id' => $aPending['id']));
        if(empty($aSubscription) || !is_array($aSubscription))
            return false;

        $iSellerId = (int)$aPending['seller_id'];
        $oProvider = $this->_oModule->getObjectProvider($aPending['provider'], $iSellerId);
        if($oProvider === false || !$oProvider->isActive())
            return false;

        if(!$oProvider->cancelRecurring($aPending['id'], $aSubscription['customer_id'], $aSubscription['subscription_id']))
            return false;

        return true;
    }

    public function cancelLocal($mixedPending, $sReason = 'cancel')
    {
        $aPending = is_array($mixedPending) ? $mixedPending : $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => (int)$mixedPending));
        if(empty($aPending) || !is_array($aPending) || $aPending['type'] != BX_PAYMENT_TYPE_RECURRING)
            return false;

        $aSubscription = $this->_oModule->_oDb->getSubscription(array('type' => 'pending_id', 'pending_id' => $aPending['id']));
        if(empty($aSubscription) || !is_array($aSubscription))
            return false;

        $aItems = $this->_oModule->_oConfig->descriptorsM2A($aPending['items']);
        foreach($aItems as $aItem)
            $this->_oModule->callCancelSubscriptionItem((int)$aItem['module_id'], array($aPending['client_id'], $aPending['seller_id'], $aItem['item_id'], $aItem['item_count'], $aPending['order']));

        if(!$this->_oModule->_oDb->deleteSubscription($aSubscription['id'], $sReason))
            return false;

        $this->_oModule->onSubscriptionCancel($aPending, $aSubscription, ['reason' => $sReason]);

        return true;
    }

    public function getPopupCancelSurvey($iId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oForm = $this->_getFormCancelSurvey($iId);
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $aReasons = BxDolForm::getDataItems($CNF['OBJECT_FORM_PRELISTS_REASONS_CANCEL']);

            return [
                'code' => 0,
                'msg' => ($sOther = $oForm->getCleanValue('other')) ? $sOther : $aReasons[$oForm->getCleanValue('items')]
            ];
        }

        $sPopupId = $this->_oModule->_oConfig->getHtmlIds('subscription', 'popup_subscription_cancel_survay') . $iId;
        $sPopupContent = BxTemplFunctions::getInstance()->transBox($sPopupId, $this->_oModule->_oTemplate->parseHtmlByName('subscription_form.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true)
        ]));

        return ['code' => 1, 'popup' => ['html' => $sPopupContent, 'options' => ['closeOnOuterClick' => false]]];
    }

    protected function _getBlock($sType)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sMethod = 'displayBlockSbs' . bx_gen_method_name($sType);
        if(!$this->_oModule->_oTemplate->isMethodExists($sMethod))
            return $this->_bIsApi ? [] : [
                'content' => MsgBox(_t('_Empty'))
            ];

        $iUserId = $this->_oModule->getProfileId();
        if(empty($iUserId))
            return $this->_bIsApi ? [] : [
                'content' => MsgBox(_t($CNF['T']['ERR_REQUIRED_LOGIN']))
            ];

        $mixedBlockContent = $this->_oModule->_oTemplate->$sMethod($iUserId);

        if($this->_bIsApi)
            return !$mixedBlockContent ? [] : [
                bx_api_get_block('grid', $mixedBlockContent)
            ];

        $this->_oModule->setSiteSubmenu('menu_dashboard', 'system', 'dashboard-subscriptions');

        $sBlockSubmenu = $this->_oModule->_oConfig->getObject('menu_sbs_submenu');
        $oBlockSubmenu = BxDolMenu::getObjectInstance($sBlockSubmenu);
        if($oBlockSubmenu) 
            $oBlockSubmenu->setSelected($this->MODULE, 'sbs-' . str_replace('_', '-', $sType));     

        return [
            'content' => $mixedBlockContent,
            'menu' => $this->_oModule->_oConfig->getObject('menu_sbs_submenu')
        ];
    }

    private function _getInterval($iPeriod, $sPeriodUnit, $iTrial = 0)
    {
        if((int)$iTrial > 0)
            return 'P' . $iTrial . 'D';

        $sInterval = '';
        switch($sPeriodUnit) {
            case BX_PAYMENT_SBS_PU_YEAR:
                $sInterval = 'P' . $iPeriod . 'Y';
                break;

            case BX_PAYMENT_SBS_PU_MONTH:
                $sInterval = 'P' . $iPeriod . 'M';
                break;

            case BX_PAYMENT_SBS_PU_WEEK:
                $sInterval = 'P' . (7 * $iPeriod) . 'D';
                break;

            case BX_PAYMENT_SBS_PU_DAY:
                $sInterval = 'P' . $iPeriod . 'D';
                break;

            case BX_PAYMENT_SBS_PU_HOUR:
                $sInterval = 'PT' . $iPeriod . 'H';
                break;

            case BX_PAYMENT_SBS_PU_MINUTE:
                $sInterval = 'PT' . $iPeriod . 'I';
                break;
        }

        return $sInterval;
    }

    protected function _getFormCancelSurvey($iId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sJsObject = $this->_oModule->_oConfig->getJsObject('subscription');

        $aReasons = BxDolForm::getDataItems($CNF['OBJECT_FORM_PRELISTS_REASONS_CANCEL']);
        
        $aForm = [
            'form_attrs' => [
                'id' => $this->_oModule->_oConfig->getHtmlIds('subscription', 'form_subscription_cancel_survay') . $iId,
                'action' => BX_DOL_URL_ROOT . $this->_oModule->_oConfig->getBaseUri() . 'subscription_cancel/' . $iId,
                'method' => BX_DOL_FORM_METHOD_DEFAULT,
                'onsubmit' => 'return ' . $sJsObject . '.onSubmitCancelationReason(this)'
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ],
            ],
            'inputs' => [
                'items' => [
                    'type' => 'radio_set',
                    'name' => 'items',
                    'caption' => _t('_bx_payment_form_cs_input_items'),
                    'values' => $aReasons,
                    'value' => key($aReasons),
                    'required' => '1',
                    'attrs' => [
                        'onchange' => $sJsObject . '.onChangeCancelationReason(this)'
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ],
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => _t('_bx_payment_form_input_err'),
                    ],
                ],
                'other' => [
                    'type' => 'text',
                    'name' => 'other',
                    'caption' => _t('_bx_payment_form_cs_input_other'),
                    'value' => '',
                    'required' => '1',
                    'tr_attrs' => [
                        'class' => 'bx-payment-cs-other bx-payment-cs-hidden'
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ],
                ],
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_bx_payment_form_cs_input_submit'),
                    ], [
                        'type' => 'reset',
                        'name' => 'do_cancel',
                        'value' => _t('_bx_payment_form_cs_input_cancel'),
                        'attrs' => [
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ],
                    ]
                ]
            ]
        ];

        return new BxTemplFormView($aForm);
    }
}

/** @} */
