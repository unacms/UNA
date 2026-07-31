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

define('BX_PAYMENT_ORDERS_TYPE_PENDING', 'pending');
define('BX_PAYMENT_ORDERS_TYPE_PROCESSED', 'processed');
define('BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION', 'subscription');
define('BX_PAYMENT_ORDERS_TYPE_HISTORY', 'history');

define('BX_PAYMENT_RESULT_SUCCESS', 0);

/*
 * Subscriptions: statuses.
 */
define('BX_PAYMENT_SBS_STATUS_SCHEDULED', 'scheduled');
define('BX_PAYMENT_SBS_STATUS_TRIAL', 'trial');
define('BX_PAYMENT_SBS_STATUS_ACTIVE', 'active');
define('BX_PAYMENT_SBS_STATUS_UNPAID', 'unpaid');
define('BX_PAYMENT_SBS_STATUS_PAUSED', 'paused');
define('BX_PAYMENT_SBS_STATUS_CANCELED', 'canceled');
define('BX_PAYMENT_SBS_STATUS_UNKNOWN', 'unknown');

/*
 * Subscriptions: period units.
 */
define('BX_PAYMENT_SBS_PU_YEAR', 'year');
define('BX_PAYMENT_SBS_PU_MONTH', 'month');
define('BX_PAYMENT_SBS_PU_WEEK', 'week');
define('BX_PAYMENT_SBS_PU_DAY', 'day');
define('BX_PAYMENT_SBS_PU_HOUR', 'hour');
define('BX_PAYMENT_SBS_PU_MINUTE', 'minute');

/*
 * Invoice: statuses.
 */
define('BX_PAYMENT_INV_STATUS_UNPAID', 'unpaid');
define('BX_PAYMENT_INV_STATUS_PAID', 'paid');
define('BX_PAYMENT_INV_STATUS_OVERDUE', 'overdue');

/*
 * Provider options: extended mode.
 */
define('BX_PAYMENT_POPT_EXT_NONE', 0);
define('BX_PAYMENT_POPT_EXT_SAVE', 1);
define('BX_PAYMENT_POPT_EXT_RESET', 2);

/**
 * Payment module by BoonEx
 *
 * This module is needed to work with payment providers and organize the process
 * of some item purchasing. Shopping Cart and Orders Manager are included.
 *
 * Integration notes:
 * To integrate your module with this one, you need:
 * 1. Get 'Add To Cart' button using serviceGetAddToCartLink service.
 * 2. Add info about your module in the 'bx_pmt_modules' table.
 * 3. Realize the following service methods in your Module class.
 *   a. serviceGetItems($iSellerId) - Is used in Orders Administration to get all products of the requested seller(vendor).
 *   b. serviceGetCartItem($iClientId, $iItemId) - Is used in Shopping Cart to get one product by specified id.
 *   c. serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrderId) - Register purchased product.
 *   d. serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrderId) - Unregister the product purchased earlier.
 * @see You may see an example of integration in Membership module.
 *
 *
 * Profile's Wall:
 * no spy events
 *
 *
 *
 * Spy:
 * no spy events
 *
 *
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 *
 *
 * Service methods:
 *
 * Is used to get "Add to cart" link for some item(s) in your module.
 * @see BxPmtModule::serviceGetAddToCartLink
 * BxDolService::call('payment', 'get_add_to_cart_link', array($iSellerId, $mixedModuleId, $iItemId, $iItemCount));
 *
 * Check transaction(s) in database which satisty all conditions.
 * @see BxPmtModule::serviceGetOrdersInfo
 * BxDolService::call('payment', 'get_orders_info', array($aConditions), 'Orders');
 *
 * Get total count of items in Shopping Cart.
 * @see BxPmtModule::serviceGetCartItemsCount
 * BxDolService::call('payment', 'get_cart_items_count', array($iUserId, $iOldCount));
 * @note is needed for internal usage(integration with member tool bar).
 *
 * Get Shopping cart content.
 * @see BxPmtModule::serviceGetCartItems
 * BxDolService::call('payment', 'get_cart_items');
 * @note is needed for internal usage(integration with member tool bar).
 *
 *
 * Alerts:
 * no alerts available
 *
 */
class BxPaymentModule extends BxBaseModPaymentModule
{
    protected $_iUserId;

    protected $_aOrderTypes;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_iUserId = $this->getProfileId();

        $this->_aOrderTypes = array(
            BX_PAYMENT_ORDERS_TYPE_PENDING, 
            BX_PAYMENT_ORDERS_TYPE_PROCESSED, 
            BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION, 
            BX_PAYMENT_ORDERS_TYPE_HISTORY
        );
    }

    /**
     * Manage Orders Methods
     */
    public function actionGetClients()
    {
        $sTerm = bx_get('term');

        $aResult = BxDolService::call('system', 'profiles_search', array($sTerm), 'TemplServiceProfiles');

        echoJson($aResult);
    }

    public function actionGetItems($sType, $iModuleId)
    {
    	$iSellerId = $this->getProfileId();
        $aItems = $this->callGetCartItems((int)$iModuleId, array($iSellerId));
        $aParams = [
            'filter' => bx_get('filter')
        ];

        echoJson([
            'code' => 0, 
            'eval' => $this->_oConfig->getJsObject('processed') . '.onSelectModule(oData);', 
            'data' => $this->_oTemplate->displayItems($iSellerId, $sType, $aItems, $aParams)
        ]);
    }

    public function actionGetFilterValuesItem($iSellerId, $iModuleId)
    {
        $sItems = '<option value="">' . _t('_bx_payment_txt_all_items') . '</option>';

        if(empty($iSellerId) || empty($iModuleId))
            return echoJson(array('code' => 1, 'content' => $sItems));

        $aItems = $this->callGetCartItems((int)$iModuleId, array($iSellerId));

        $this->_oConfig->sortByColumn('title', $aItems);

        foreach($aItems as $aItem)
            $sItems .= '<option value="' . $aItem['id'] . '">' . $aItem['title'] . '</option>';

        echoJson(array('code' => 0, 'content' => $sItems));
    }

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'GetBlockJoin' => 'BxPaymentJoin',

            'GetBlockCarts' => 'BxPaymentCart',
            'GetBlockCart' => 'BxPaymentCart',
            'GetBlockCartHistory' => 'BxPaymentCart',
            
            'GetBlockListMy' => 'BxPaymentSubscriptions',
            'GetBlockHistory' => 'BxPaymentSubscriptions',
            'Cancel' => 'BxPaymentSubscriptions',
            'CancelByPendingId' => 'BxPaymentSubscriptions',

            'GetProviderOptions' => '',
            'InitializeCheckoutApi' => '',
            'StripeV3CreateSessionApi' => '',
            'FinalizeCheckout' => ''
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-get_modules_with_payments get_modules_with_payments
     * 
     * @code bx_srv('bx_payment', 'get_modules_with_payments', []); @endcode
     * 
     * Get modules with payments functionality
     *
     * @return array with modules names
     * 
     * @see BxPaymentModule::serviceGetModulesWithPayments
     */
    /** 
     * @ref bx_payment-get_modules_with_payments "get_modules_with_payments"
     */
    public function serviceGetModulesWithPayments()
    {
        return $this->_oDb->getModulesWithPayments();
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-is_credits_only is_credits_only
     * 
     * @code bx_srv('bx_payment', 'is_credits_only'); @endcode
     * 
     * Check whether the 'Credits Only' mode is enabled or not.
     *
     * @return boolean value determining the result of checking.
     * 
     * @see BxPaymentModule::serviceIsCreditsOnly
     */
    /** 
     * @ref bx_payment-is_credits_only "is_credits_only"
     */
    public function serviceIsCreditsOnly()
    {
        return $this->_oConfig->isCreditsOnly();
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-is_accepting_payments is_accepting_payments
     * 
     * @code bx_srv('bx_payment', 'is_accepting_payments', [...]); @endcode
     * 
     * Check whether the specified vendor has a configured payment provider or not.
     *
     * @param $iVendorId integer value with vendor ID.
     * @param $sPaymentType (optional) string value with payment type. If specified then the vendor will be checked for having the payment provider of the requested type.
     * @return boolean value determining the result of checking.
     * 
     * @see BxPaymentModule::serviceIsAcceptingPayments
     */
    /** 
     * @ref bx_payment-is_accepting_payments "is_accepting_payments"
     */
    public function serviceIsAcceptingPayments($iVendorId, $sPaymentType = '')
    {
    	$bResult = false;

    	switch($sPaymentType) {
            case BX_PAYMENT_TYPE_SINGLE:
                $aProvidersCart = $this->_oDb->getVendorInfoProvidersSingle($iVendorId);
                $bResult = !empty($aProvidersCart);
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $aProvidersSubscription = $this->_oDb->getVendorInfoProvidersRecurring($iVendorId);
                $bResult = !empty($aProvidersSubscription);
                break;

            default:
                $aProviders = $this->_oDb->getVendorInfoProviders($iVendorId);
                $bResult = !empty($aProviders);
    	}

        return $bResult;
    }

    /** 
     * @deprecated since version 11.0.0
     * 
     * @see BxPaymentModule::serviceIsProviderOptions
     */
    public function serviceIsPaymentProvider($iVendorId, $sVendorProvider, $sPaymentType = '')
    {
    	return $this->serviceIsProviderOptions($iVendorId, $sVendorProvider, $sPaymentType);
    }

    /** 
     * @deprecated since version 11.0.0
     * 
     * @see BxPaymentModule::serviceGetProviderOptions
     */
    public function serviceGetPaymentProvider($iVendorId, $sVendorProvider, $sPaymentType = '')
    {
    	return $this->serviceGetProviderOptions($iVendorId, $sVendorProvider, $sPaymentType);
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-is_provider_options is_provider_options
     * 
     * @code bx_srv('bx_payment', 'is_provider_options', [...]); @endcode
     * 
     * Check whether the specified vendor has configured the specified payment provider or not.
     *
     * @param $iVendorId integer value with vendor ID.
     * @param $sVendorProvider string value with payment provider name.
     * @param $sPaymentType (optional) string value with payment type. If specified then the vendor will be checked for having the payment provider of the requested type.
     * @return boolean value determining the result of checking.
     * 
     * @see BxPaymentModule::serviceIsProviderOptions
     */
    /** 
     * @ref bx_payment-is_provider_options "is_provider_options"
     */
    public function serviceIsProviderOptions($iVendorId, $sVendorProvider, $sPaymentType = '')
    {
    	$aProvider = $this->serviceGetProviderOptions($iVendorId, $sVendorProvider, $sPaymentType);
    	return $aProvider !== false;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-get_provider_options get_provider_options
     * 
     * @code bx_srv('bx_payment', 'get_provider_options', [...]); @endcode
     * 
     * Get configuration settings for the payment provider entered by the specified vendor.
     *
     * @param $iVendorId integer value with vendor ID.
     * @param $sVendorProvider string value with payment provider name.
     * @param $sPaymentType (optional) string value with payment type. If specified then the vendor will be checked for having the payment provider of the requested type.
     * @return an array with special format describing the payment provider or false value if something is wrong.
     * 
     * @see BxPaymentModule::serviceGetProviderOptions
     */
    /** 
     * @ref bx_payment-get_provider_options "get_provider_options"
     */
    public function serviceGetProviderOptions($iVendorId, $sVendorProvider, $sPaymentType = '')
    {
    	$aProviders = array();
    	switch($sPaymentType) {
            case BX_PAYMENT_TYPE_SINGLE:
                $aProviders = $this->_oDb->getVendorInfoProvidersSingle($iVendorId);
                break;

            case BX_PAYMENT_TYPE_RECURRING:
                $aProviders = $this->_oDb->getVendorInfoProvidersRecurring($iVendorId);
                break;

            default:
                $aProviders = $this->_oDb->getVendorInfoProviders($iVendorId);
    	}

    	return !empty($aProviders) && !empty($aProviders[$sVendorProvider]) && is_array(($aProviders[$sVendorProvider])) ? $aProviders[$sVendorProvider] : false;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_options_default_currency_code get_options_default_currency_code
     * 
     * @code bx_srv('bx_payment', 'get_options_default_currency_code', [...]); @endcode
     * 
     * Get an array with available currencies. Is used in forms.
     *
     * @return an array with available currencies represented as key => value pairs.
     * 
     * @see BxPaymentModule::serviceGetOptionsDefaultCurrencyCode
     */
    /** 
     * @ref bx_payment-get_options_default_currency_code "get_options_default_currency_code"
     */
    public function serviceGetOptionsDefaultCurrencyCode()
    {
        $CNF = &$this->_oConfig->CNF;

        $aCurrencies = BxDolForm::getDataItems($CNF['OBJECT_FORM_PRELISTS_CURRENCIES']);

        $aResult = array();
        foreach($aCurrencies as $sKey => $sValue)
            $aResult[] = array(
                'key' => $sKey,
                'value' => $sValue
            );

        return $aResult;
    }

    public function serviceGetOptionsPersonalCurrencyCode()
    {
        return array_merge([[
            'key' => '',
            'value' => _t('_bx_payment_gc_currency_code_default')
        ]], $this->serviceGetOptionsDefaultCurrencyCode());
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-other Other
     * @subsubsection bx_payment-get_options_site_admin get_options_site_admin
     * 
     * @code bx_srv('bx_payment', 'get_options_site_admin', [...]); @endcode
     * 
     * Get an array with profiles which can be used as 'Site Admin (Owner)'. 'Site Admin' is a person who will be displayed to buyers when something is selling on behalf of the site.
     *
     * @return an array with profiles represented as key => value pairs.
     * 
     * @see BxPaymentModule::serviceGetOptionsSiteAdmin
     */
    /** 
     * @ref bx_payment-get_options_site_admin "get_options_site_admin"
     */
    public function serviceGetOptionsSiteAdmin()
    {
        $aResult = array(
            array('key' => '', 'value' => _t('_Select_one'))
        );

        $aIds = $this->_oDb->getAdminsIds();
        foreach($aIds as $iId) {
            $aUser = $this->getProfileInfo($iId);

            $aResult[] = array(
                'key' => $iId,
                'value' => $aUser['name']
            );
        }

        return $aResult;
    }

    public function serviceGetMenuAddonManageTools()
    {
        return array(
            'counter1_value' => (int)$this->_oDb->getInvoices(array('type' => 'status', 'status' => BX_PAYMENT_INV_STATUS_PAID, 'count' => true)), 
            'counter1_caption' => _t('_bx_payment_menu_item_title_admt_addon_counter1_caption'), 
            'counter2_value' => (int)$this->_oDb->getInvoices(array('type' => 'status', 'status' => BX_PAYMENT_INV_STATUS_OVERDUE, 'count' => true)), 
            'counter2_caption' => _t('_bx_payment_menu_item_title_admt_addon_counter2_caption'), 
            'counter3_value' => (int)$this->_oDb->getInvoices(array('type' => 'all_count'))
        );
    }

    public function serviceGetBlockCheckoutOffline()
    {
        $CNF = &$this->_oConfig->CNF;

        $oBuyer = BxDolProfile::getInstance();
        if(!$oBuyer)
            return MsgBox(_t('_bx_payment_err_required_login'));
        
        $iSeller = (int)bx_get('seller');
        $oSeller = BxDolProfile::getInstance($iSeller);
        if(!$oSeller)
            return MsgBox(_t('_bx_payment_err_unknown_vendor'));

        $aData = array(
            'seller' => $iSeller,
            'currency' => array(
                'code' => bx_process_input(bx_get('currency_code')),
                'sign' => bx_process_input(bx_get('currency_sign')),
            ),
            'amount' => (float)bx_get('amount'),
            'return_url' => bx_process_input(bx_get('return_url')),
        );

        if(empty($aData['currency']['code']))
            $aData['currency']['code'] = $this->_oConfig->getDefaultCurrencyCode();

        if(empty($aData['currency']['sign']))
            $aData['currency']['sign'] = $this->_oConfig->getDefaultCurrencySign();

        $sItems = '';
        $iItemsCount = (int)bx_get('items_count');
        for($i = 0; $i < $iItemsCount; $i++) {
            $aItem = array(
                'title' => bx_process_input(bx_get('item_title_' . $i)),
                'quantity' => (int)bx_get('item_quantity_' . $i)
            );

            $sItems .= _t('_bx_payment_txt_checkout_item', $aItem['title'], $aItem['quantity']);
            $aData['items'][] = $aItem;
        }

        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($this->_oConfig->getPrefix('general') . 'checkout_offline', array(
            'profile_name' => $oBuyer->getDisplayName(),
            'profile_link' => $oBuyer->getUrl(),
            'items' => $sItems,
            'amount' => $aData['currency']['sign'] . sprintf("%.2f", (float)($aData['amount'])),
            'date' => bx_time_js(time(), BX_FORMAT_DATE, true),
            'pending_orders_link' => $this->getObjectOrders()->serviceGetPendingOrdersUrl()
        ), 0, $iSeller);

        $sEmail = '';
        $oProvider = $this->getObjectProvider($CNF['OBJECT_PP_OFFLINE'], $iSeller);
        if($oProvider !== false && $oProvider->isActive())
            $sEmail = $oProvider->getOption('checkout_email');

        if(empty($sEmail))
            $sEmail = $oBuyer->getAccountObject()->getEmail();

        if(!sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, array(), BX_EMAIL_SYSTEM))
            return MsgBox(_t('_bx_payment_err_cannot_perform'));

        return $this->_oTemplate->displayBlockCheckoutOffline($oBuyer, $oSeller, $aData);
    }

    /**
     * Cart Processing Methods
     */
    public function actionAddToCart($iSellerId, $iModuleId, $iItemId, $iItemCount, $sCustom = '')
    {
        if(empty($sCustom) && ($sCustom = bx_get('custom')) !== false)
            $sCustom = bx_process_input($sCustom);

        $aCustom = [];
        if(!empty($sCustom)) {
            $aCustom = $this->_oConfig->s2a($sCustom);
            if(empty($aCustom) || !is_array($aCustom))
                $aCustom = [];
        }

        $aResult = $this->getObjectCart()->serviceAddToCart($iSellerId, $iModuleId, $iItemId, $iItemCount, $aCustom);
        echoJson($aResult);
    }

    /**
     * Isn't used yet.
     */
    public function actionDeleteFromCart($iSellerId, $iModuleId, $iItemId)
    {
        echoJson($this->getObjectCart()->serviceDeleteFromCart($iSellerId, $iModuleId, $iItemId));
    }

    /**
     * Isn't used yet.
     */
    public function actionEmptyCart($iSellerId)
    {
        echoJson($this->getObjectCart()->serviceDeleteFromCart($iSellerId));
    }

    public function actionSubscribe()
    {
    	$iSellerId = bx_process_input(bx_get('seller_id'), BX_DATA_INT);
    	$sSellerProvider = bx_process_input(bx_get('seller_provider'));
    	$iModuleId = bx_process_input(bx_get('module_id'), BX_DATA_INT);
    	$iItemId = bx_process_input(bx_get('item_id'), BX_DATA_INT);
    	$iItemCount = bx_process_input(bx_get('item_count'), BX_DATA_INT);
    	if(empty($iItemCount))
    		$iItemCount = 1;

        $sRedirect = bx_process_input(bx_get('redirect'));
        $sCustom = bx_process_input(bx_get('custom'));

        $aCustom = array();
        if(!empty($sCustom)) {
            $aCustom = json_decode(base64_decode($sCustom), true);
            if(empty($aCustom) || !is_array($aCustom))
                $aCustom = array();
        }

        $aResult = $this->getObjectSubscriptions()->serviceSubscribe($iSellerId, $sSellerProvider, $iModuleId, $iItemId, $iItemCount, $sRedirect, $aCustom);
        $bRedirect = !empty($aResult['redirect']);

        if(!empty($aResult['popup'])) {
            $sContent = '';
            $sContent .= $this->_oTemplate->displayCartJs(BX_PAYMENT_TYPE_RECURRING, $iSellerId);
            $sContent .= !empty($aResult['popup']['html']) ? $aResult['popup']['html'] : $aResult['popup'];

			return $this->_oTemplate->displayPageCodeResponse($sContent, false, true);
        }

		if(!empty($aResult['code']))
			return $this->_oTemplate->displayPageCodeError($aResult['message']);

		if(!empty($aResult['message']) && !$bRedirect)
			return $this->_oTemplate->displayPageCodeResponse($aResult['message']);

        if($bRedirect) {
            header('Location: ' . $aResult['redirect']);
            exit;
        }
    }

    public function actionSubscribeJson()
    {
    	$iSellerId = bx_process_input(bx_get('seller_id'), BX_DATA_INT);
    	$sSellerProvider = bx_process_input(bx_get('seller_provider'));
    	$iModuleId = bx_process_input(bx_get('module_id'), BX_DATA_INT);
    	$iItemId = bx_process_input(bx_get('item_id'), BX_DATA_INT);

    	$iItemCount = bx_process_input(bx_get('item_count'), BX_DATA_INT);
    	if(empty($iItemCount))
            $iItemCount = 1;

        $sItemAddons = '';
        if(bx_get('item_addons') !== false) {
            $sItemAddons = bx_process_input(bx_get('item_addons'));
            if(is_array($sItemAddons))
                $sItemAddons = $this->_oConfig->a2s($sItemAddons);
        }

        $sRedirect = bx_process_input(bx_get('redirect'));
        $sCustom = bx_process_input(bx_get('custom'));

        $aCustom = array();
        if(!empty($sCustom)) {
            $aCustom = $this->_oConfig->s2a($sCustom);
            if(empty($aCustom) || !is_array($aCustom))
                $aCustom = [];
        }

        echoJson($this->getObjectSubscriptions()->serviceSubscribeWithAddons($iSellerId, $sSellerProvider, $iModuleId, $iItemId, $iItemCount, $sItemAddons, $sRedirect, $aCustom));
    }

    public function actionSubscriptionGetDetails($iId)
    {
        echoJson($this->_oTemplate->displaySubscriptionGetDetails($iId));
    }

    public function actionSubscriptionChangeDetails($iId)
    {
        echoJson($this->_oTemplate->displaySubscriptionChangeDetails($iId));
    }

    public function actionSubscriptionGetBilling($iId)
    {
        echoJson($this->_oTemplate->displaySubscriptionGetBilling($iId));
    }

    public function actionSubscriptionChangeBilling($iId)
    {
        echoJson($this->_oTemplate->displaySubscriptionChangeBilling($iId));
    }

    public function actionSubscriptionCancelation($iId)
    {
        $aResult = array('code' => 1, 'message' => _t('_bx_payment_err_cannot_perform'));

        $aPending = $this->_oDb->getOrderPending(array('type' => 'id', 'id' => $iId));
        if(empty($aPending) || !is_array($aPending))
            return echoJson($aResult);

        $aSubscription = $this->_oDb->getSubscription(array('type' => 'pending_id', 'pending_id' => $iId));
        if(empty($aSubscription) || !is_array($aSubscription))
            return echoJson($aResult);

        $oRecipient = BxDolProfile::getInstance((int)$aPending['seller_id']);
        if(!$oRecipient)
            return echoJson($aResult);

        $mixedResult = $this->isAllowedManage($aPending);
        if($mixedResult !== true)
            return echoJson(array('code' => 2, 'message' => $mixedResult));

        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($this->_oConfig->getPrefix('general') . 'cancelation_request', array(
            'subscription_id' => $aSubscription['subscription_id'],
            'subscription_customer' => $aSubscription['customer_id'],
            'subscription_date' => bx_time_js($aSubscription['date_add'], BX_FORMAT_DATE, true)
        ), 0, (int)$aPending['client_id']);

        $sEmail = '';
        $oProvider = $this->getObjectProvider($aPending['provider'], $aPending['seller_id']);
        if($oProvider !== false && $oProvider->isActive())
            $sEmail = $oProvider->getOption('cancellation_email');

        if(empty($sEmail))
            $sEmail = $oRecipient->getAccountObject()->getEmail();

        if(!sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, array(), BX_EMAIL_SYSTEM))
            return echoJson($aResult);

        echoJson(array('code' => 0, 'message' => _t('_bx_payment_msg_cancelation_request_sent')));
    }

    public function actionSubscriptionCancel($iId, $mixedGridObject = false)
    {
        $CNF = &$this->_oConfig->CNF;
        $aResult = ['code' => 1, 'message' => _t('_bx_payment_err_cannot_perform')];

        $aPending = $this->_oDb->getOrderPending(['type' => 'id', 'id' => $iId]);
        if(empty($aPending) || !is_array($aPending))
            return echoJson($aResult);

        $mixedResult = $this->isAllowedManage($aPending);
        if($mixedResult !== true)
            return echoJson(['code' => 2, 'message' => $mixedResult]);

        $oSubscriptions = $this->getObjectSubscriptions();
        
        $sReason = '';
        if(getParam($CNF['PARAM_SBS_CANCEL_SURVEY']) == 'on') {
            $aCsResult = $oSubscriptions->getPopupCancelSurvey($iId);
            if($aCsResult['code'] != 0)
                return echoJson($aCsResult);

            $sReason = $aCsResult['msg'];
        }

        if(!$oSubscriptions->cancel($iId, $sReason))
            return echoJson($aResult);

        if(empty($mixedGridObject) && bx_get('grid') !== false)
            $mixedGridObject = bx_process_input(bx_get('grid'));

        if(!empty($mixedGridObject) && $aPending['client_id'] == $this->getProfileId()) {
            $oGrid = BxDolGrid::getObjectInstance($mixedGridObject, $this->_oTemplate);
            $oGrid->addQueryParam('client_id', $aPending['client_id']);

            return echoJson(['object' => $mixedGridObject, 'grid' => $oGrid->getCode(false), 'blink' => array($iId)]);
        }
        else
            return echoJson(['code' => 0, 'message' => _t('_bx_payment_msg_successfully_performed')]);
    }

    /**
     * Payment Processing Methods
     */
    public function actionAuthorizeCheckout($sType)
    {
    	if(!$this->isLogged())
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_required_login');

        if(bx_get('seller_id') === false || bx_get('provider') === false || bx_get('items') === false)
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_wrong_data');

        $iSellerId = bx_process_input(bx_get('seller_id'), BX_DATA_INT);
        $sProvider = bx_process_input(bx_get('provider'));
        $aItems = bx_process_input(bx_get('items'));

        $mixedResult = $this->serviceAuthorizeCheckout($sType, $iSellerId, $sProvider, $aItems);
        if(is_string($mixedResult))
            return $this->_oTemplate->displayPageCodeError($mixedResult);

        if(is_array($mixedResult) && !empty($mixedResult['redirect'])) {
            header('Location: ' . $mixedResult['redirect']);
            exit;
        }

        return $this->_oTemplate->displayPageCodeResponse($this->_sLangsPrefix . 'msg_successfully_performed');
    }

    public function actionCaptureAuthorizedCheckout($sType)
    {
        $iProfileId = bx_get_logged_profile_id();
    	if(!$iProfileId)
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_required_login');

        $sOrderAuth = '';
        if(($sOrderAuth = bx_get('order')) !== false) 
            $sOrderAuth = bx_process_input($sOrderAuth);

        if(empty($sOrderAuth))
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_empty_order');

        $aPending = $this->_oDb->getOrderPending(['type' => 'order', 'order' => $sOrderAuth]);
        if(empty($aPending) || !is_array($aPending))
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_empty_order');

        if((int)$aPending['seller_id'] != $iProfileId)
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_wrong_vendor');

        $mixedResult = $this->serviceCaptureAuthorizedCheckout($sType, $sOrderAuth);
        if(is_string($mixedResult))
            return $this->_oTemplate->displayPageCodeError($mixedResult);

        if(!empty($mixedResult['redirect'])) {
            header('Location: ' . base64_decode(urldecode($mixedResult['redirect'])));
            exit;
        }

        return $this->_oTemplate->displayPageCodeResponse($mixedResult['message']);
    }

    public function actionInitializeCheckout($sType)
    {
    	if(!$this->isLogged())
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_required_login');

        if(bx_get('seller_id') !== false && bx_get('provider') !== false && bx_get('items') !== false) {
            $iSellerId = bx_process_input(bx_get('seller_id'), BX_DATA_INT);
            $sProvider = bx_process_input(bx_get('provider'));
            $aItems = bx_process_input(bx_get('items'));

            $mixedResult = $this->serviceInitializeCheckout(BX_PAYMENT_TYPE_SINGLE, $iSellerId, $sProvider, $aItems);
            if($mixedResult !== true)
                return $this->_oTemplate->displayPageCodeError($mixedResult);
        }

        header('Location: ' . $this->_oConfig->getUrl('URL_CART'));
        exit;
    }

    public function actionInitializeCheckoutJson($sType)
    {
    	if(!$this->isLogged())
            return echoJson(['code' => 1, 'message' => _t($this->_sLangsPrefix . 'err_required_login')]);

        if(bx_get('seller_id') !== false && bx_get('provider') !== false && bx_get('items') !== false) {
            $iSellerId = bx_process_input(bx_get('seller_id'), BX_DATA_INT);
            $sProvider = bx_process_input(bx_get('provider'));
            $aItems = bx_process_input(bx_get('items'));

            $mixedResult = $this->serviceInitializeCheckout(BX_PAYMENT_TYPE_SINGLE, $iSellerId, $sProvider, $aItems);
            if($mixedResult === false)
                return echoJson(['code' => 2, 'message' => _t($this->_sLangsPrefix . 'err_cannot_perform')]);
            if(is_string($mixedResult))
                return echoJson(['code' => 3, 'message' => $mixedResult]);
            else if(is_array($mixedResult))
                return echoJson($mixedResult);
        }

        return echoJson(['code' => 0, 'redirect' => $this->_oConfig->getUrl('URL_CART')]);
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-authorize_checkout authorize_checkout
     * 
     * @code bx_srv('bx_payment', 'authorize_checkout', [...]); @endcode
     * 
     * Authorize order for future checkout.
     * 
     * @param $sType string value with payment type (single or recurring). 
     * @param $iSellerId integer value with seller ID. 
     * @param $sProvider string value with payment provider name. 
     * @param $aItems (optional) an array with items to be purchased. 
     * @param $sRedirect (optional) string value with redirect URL if it's needed.
     * @return the result depends on the payment provider which is used for processing or represented as string value with error message if something is wrong.
     * 
     * @see BxPaymentModule::serviceAuthorizeCheckout
     */
    /** 
     * @ref bx_payment-authorize_checkout "authorize_checkout"
     */
    public function serviceAuthorizeCheckout($sType, $iSellerId, $sProvider, $aItems = [], $sRedirect = '')
    {
        $bTypeSingle = $sType == BX_PAYMENT_TYPE_SINGLE;
        $bTypeRecurring = $sType == BX_PAYMENT_TYPE_RECURRING;

        if(!is_array($aItems))
            $aItems = [$aItems];

        $iSellerId = (int)$iSellerId;
        if($iSellerId == BX_PAYMENT_EMPTY_ID)
            return $this->_sLangsPrefix . 'err_unknown_vendor';

        $oProvider = $this->getObjectProvider($sProvider, $iSellerId);
        if($oProvider === false || !$oProvider->isActive())
            return $this->_sLangsPrefix . 'err_incorrect_provider';

        $aInfo = $this->getObjectCart()->getInfo($sType, $this->_iUserId, $iSellerId, $aItems);
        if(empty($aInfo) || $aInfo['vendor_id'] == BX_PAYMENT_EMPTY_ID || empty($aInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_order';

        $this->alert('before_authorize', 0, $this->_iUserId, array(
            'client_id' => $this->_iUserId,
            'seller_id' => $iSellerId, 

            'type' => &$sType,
            'provider' => &$sProvider,
            'cart_info' => &$aInfo,

            'type_ref' => &$sType,
            'provider_ref' => &$sProvider,
            'cart_info_ref' => &$aInfo,
        ));

        $iPendingId = $this->_oDb->insertOrderPending($this->_iUserId, $sType, $sProvider, $aInfo);
        if(empty($iPendingId))
            return $this->_sLangsPrefix . 'err_access_db';

        return $oProvider->authorizeCheckout($iPendingId, $aInfo, $sRedirect);
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-capture_authorized_checkout capture_authorized_checkout
     * 
     * @code bx_srv('bx_payment', 'capture_authorized_checkout', [...]); @endcode
     * 
     * Capture funds for previously authorized order.
     * 
     * @param $sType string value with payment type (single or recurring). 
     * @param $sOrderAuth string value with order's authorization ID. 
     * @return the result depends on the payment provider which is used for processing or represented as string value with error message if something is wrong.
     * 
     * @see BxPaymentModule::serviceCaptureAuthorizedCheckout
     */
    /** 
     * @ref bx_payment-capture_authorized_checkout "capture_authorized_checkout"
     */
    public function serviceCaptureAuthorizedCheckout($sType, $sOrderAuth, $sRedirect = '')
    {
        $aPending = $this->_oDb->getOrderPending(['type' => 'order', 'order' => $sOrderAuth]);
        if(empty($aPending) || !is_array($aPending))
            return $this->_sLangsPrefix . 'err_empty_order';

        if((int)$aPending['processed'] != 0)
            return $this->_sLangsPrefix . 'err_already_processed';

        $iClientId = (int)$aPending['client_id'];
        $iSellerId = (int)$aPending['seller_id'];
        $sProvider = $aPending['provider'];

        $oProvider = $this->getObjectProvider($sProvider, $iSellerId);
        if($oProvider === false || !$oProvider->isActive())
            return $this->_sLangsPrefix . 'err_incorrect_provider';

        $aInfo = $this->getObjectCart()->getInfo($sType, $iClientId, $iSellerId, $aPending['items']);
        if(empty($aInfo) || $aInfo['vendor_id'] == BX_PAYMENT_EMPTY_ID || empty($aInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_order';

        $this->alert('before_capture_authorized', 0, $iClientId, array(
            'order_auth' => $sOrderAuth,
            'client_id' => $iClientId,
            'seller_id' => $iSellerId, 

            'type' => &$sType,
            'provider' => &$sProvider,
            'cart_info' => &$aInfo,

            'type_ref' => &$sType,
            'provider_ref' => &$sProvider,
            'cart_info_ref' => &$aInfo,
        ));

        $aResult = $oProvider->captureAuthorizedCheckout($sOrderAuth, $aPending, $aInfo, $sRedirect);
        if((int)$aResult['code'] != BX_PAYMENT_RESULT_SUCCESS) 
            return $aResult['message'];

        //--- Get updated pending order
        $aPending = $this->_oDb->getOrderPending(['type' => 'id', 'id' => $aResult['pending_id']]);

        //--- Register payment for purchased items in associated modules 
        if(isset($aResult['paid']) && $aResult['paid'])
            $this->registerPayment($aPending);

        $this->alert('finalize_checkout', 0, bx_get_logged_profile_id(), array(
            'pending' => $aPending,
            'transactions' => $this->_oDb->getOrderProcessed(array('type' => 'pending_id', 'pending_id' => (int)$aPending['id'])),
            'provider' => $oProvider,

            'message' => &$aResult['message'],
            'result' => &$aResult,

            'message_ref' => &$aResult['message'],
            'result_ref' => &$aResult,
        ));

        if(empty($aResult['redirect']) && $oProvider->needRedirect())
            $aResult['redirect'] = $oProvider->getReturnUrl();

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-purchase_processing Purchase Processing
     * @subsubsection bx_payment-initialize_checkout initialize_checkout
     * 
     * @code bx_srv('bx_payment', 'initialize_checkout', [...]); @endcode
     * 
     * Initialize the checkout process.
     * 
     * @param $sType string value with payment type (single or recurring). 
     * @param $iSellerId integer value with seller ID. 
     * @param $sProvider string value with payment provider name. 
     * @param $aItems (optional) an array with items to be purchased. 
     * @param $sRedirect (optional) string value with redirect URL if it's needed.
     * @param $aCustom (optional) array with custom data to attach to a payment.
     * @return the result depends on the payment provider which is used for processing or represented as string value with error message if something is wrong.
     * 
     * @see BxPaymentModule::serviceInitializeCheckout
     */
    /** 
     * @ref bx_payment-initialize_checkout "initialize_checkout"
     */
    public function serviceInitializeCheckout($sType, $iSellerId, $sProvider, $aItems = array(), $sRedirect = '', $aCustoms = array())
    {
        $bTypeSingle = $sType == BX_PAYMENT_TYPE_SINGLE;
        $bTypeRecurring = $sType == BX_PAYMENT_TYPE_RECURRING;

        if(!is_array($aItems))
            $aItems = array($aItems);

        $iSellerId = (int)$iSellerId;
        if($iSellerId == BX_PAYMENT_EMPTY_ID)
            return $this->_sLangsPrefix . 'err_unknown_vendor';

        $oProvider = $this->getObjectProvider($sProvider, $iSellerId);
        if($oProvider === false || !$oProvider->isActive())
            return $this->_sLangsPrefix . 'err_incorrect_provider';

        $aInfo = $this->getObjectCart()->getInfo($sType, $this->_iUserId, $iSellerId, $aItems);
        if(empty($aInfo) || $aInfo['vendor_id'] == BX_PAYMENT_EMPTY_ID || empty($aInfo['items']))
            return $this->_sLangsPrefix . 'err_empty_order';

        /*
         * Process FREE (price = 0) items for LOGGED IN members
         * WITHOUT processing via payment provider.
         * Note. This section isn't used for now!
         */
        $bProcessedFree = false;
        $sKeyPriceSingle = $this->_oConfig->getKey('KEY_ARRAY_PRICE_SINGLE');
        $sKeyPriceRecurring = $this->_oConfig->getKey('KEY_ARRAY_PRICE_RECURRING');
        foreach($aInfo['items'] as $iIndex => $aItem) {
            if((int)$aInfo['client_id'] == 0)
                continue;

            //--- For Single time payments.
            if($bTypeSingle && (float)$aItem[$sKeyPriceSingle] == 0) {
                $aCart = $this->_oDb->getCartContent($aInfo['client_id']);
                $aCartCustoms = $aCart['customs'];

                $aCartItem = array($aInfo['vendor_id'], $aItem['module_id'], $aItem['id'], $aItem['quantity']);
                $aCartItemCustom = $this->_oConfig->pullCustom($aCartItem, $aCartCustoms);

                $aItemInfo = $this->callRegisterCartItem((int)$aItem['module_id'], array($aInfo['client_id'], $aInfo['vendor_id'], $aItem['id'], $aItem['quantity'], $this->_oConfig->getLicense(), $aCartItemCustom));
                if(!empty($aItemInfo) && is_array($aItemInfo)) {
                    if(!empty($aItemInfo['addons']) && is_array($aItemInfo['addons']))
                        foreach($aItemInfo['addons'] as $sAddon => $aAddon)
                            $this->callRegisterCartItem((int)$aAddon['module_id'], array($aInfo['client_id'], $aInfo['vendor_id'], $aAddon['id'], $aAddon['quantity'], $this->_oConfig->getLicense(), $aCartItemCustom));

                    $bProcessedFree = true;
                }

                $aInfo['items_count'] -= 1;
                unset($aInfo['items'][$iIndex]);

                $aCart['items'] = trim(preg_replace("'" . $this->_oConfig->descriptorA2S($aCartItem) . ":?'", "", $aCart['items']), ":");
                $this->_oDb->setCartItems($aInfo['client_id'], $aCart['items'], $aCartCustoms);
            }

            //--- For Recurring payments.
            if($bTypeRecurring && (float)$aItem[$sKeyPriceRecurring] == 0) {
                //TODO: Process FREE subscription here, if such situation will be possible.
            }
        }

        if(empty($aInfo['items']))
            return $this->_sLangsPrefix . ($bProcessedFree ? 'msg_successfully_processed_free' : 'err_empty_order');

        if($bTypeSingle && (empty($aCustoms) || !is_array($aCustoms))) {
            $aCart = $this->_oDb->getCartContent($aInfo['client_id']);
            $aCartCustoms = $aCart['customs'];

            $aCustoms = array();
            foreach($aInfo['items'] as $aItem) {
                $sCartItem = $this->_oConfig->descriptorA2S(array($aItem['author_id'], $aItem['module_id'], $aItem['id']));
                $aCartItemCustom = $this->_oConfig->getCustom($sCartItem, $aCartCustoms);
                $this->_oConfig->putCustom($sCartItem, $aCartItemCustom, $aCustoms);
            }
        }

        $this->alert('before_pending', 0, bx_get_logged_profile_id(), array(
            'client_id' => $this->_iUserId,
            'seller_id' => $iSellerId, 

            'type' => &$sType,
            'provider' => &$sProvider,
            'cart_info' => &$aInfo,
            'custom' => &$aCustoms,

            'type_ref' => &$sType,
            'provider_ref' => &$sProvider,
            'cart_info_ref' => &$aInfo,
            'custom_ref' => &$aCustoms,
        ));

        $iPendingId = $this->_oDb->insertOrderPending($this->_iUserId, $sType, $sProvider, $aInfo, $aCustoms);
        if(empty($iPendingId))
            return $this->_sLangsPrefix . 'err_access_db';

        /*
         * Perform Join WITHOUT processing via payment provider
         * if a client ISN'T logged in and has only ONE FREE item in the card.
         * Note. This section isn't used for now because only a member can purchase!
         */
        if((int)$aInfo['client_id'] == 0 && (int)$aInfo['items_count'] == 1) {
            reset($aInfo['items']);
            $aItem = current($aInfo['items']);

            if(!empty($aItem) && $this->_oConfig->getPrice($sType, $aItem)) {
                $this->_oDb->updateOrderPending($iPendingId, array(
                    'order' => $this->_oConfig->getLicense(),
                    'error_code' => '1',
                    'error_msg' => ''
                ));

                $this->getObjectJoin()->performJoin($iPendingId);
            }
        }

        return $oProvider->initializeCheckout($iPendingId, $aInfo, $sRedirect);
    }

    public function serviceInitializeCheckoutApi($sType, $iSellerId, $sProvider, $aItems = [], $sRedirect = '', $aCustoms = [])
    {
        if(is_string($aItems))
            $aItems = $this->_oConfig->descriptorsM2A($aItems, true);

        $mixedResult = $this->serviceInitializeCheckout($sType, $iSellerId, $sProvider, $aItems, $sRedirect, $aCustoms);
        if(is_string($mixedResult))
            return [bx_api_get_msg($mixedResult)];
        
        if(is_array($mixedResult)) {
            if(($sRedirect = $mixedResult['redirect'] ?? false))
                return ['url' => $sRedirect];

            if(($sMsg = $mixedResult['message'] ?? false))
                return [bx_api_get_msg($sMsg)];
        }

        return [];
    }

    public function actionFinalizeCheckout($sProvider, $mixedVendorId = "")
    {
        $aData = &$_REQUEST;

        $aResult = $this->serviceFinalizeCheckout($sProvider, $mixedVendorId, $aData);
        if(isset($aResult['error']))
            return $this->_oTemplate->displayPageCodeError($aResult['error']);
        else if(isset($aResult['redirect'])) {
            header('Location: ' . $aResult['redirect']);
            exit;
        }
        else
            $this->_oTemplate->displayPageCodeResponse($aResult['message']);
    }
    
    public function serviceFinalizeCheckout($sProvider, $mixedVendorId = "", $aData = [])
    {
        if($this->_bIsApi && is_string($aData))
            $aData = bx_api_get_browse_params($aData);

        $oProvider = $this->getObjectProvider($sProvider, $mixedVendorId);
        if($oProvider === false || !$oProvider->isActive())
            return ($sMsg = $this->_sLangsPrefix . 'err_incorrect_provider') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['error' => $sMsg];

        $aResult = $oProvider->finalizeCheckout($aData);
        if((int)$aResult['code'] != BX_PAYMENT_RESULT_SUCCESS) 
            return $this->_bIsApi ? [bx_api_get_msg($aResult['message'])] : ['error' => $aResult['message']];

        $aPending = $this->_oDb->getOrderPending(['type' => 'id', 'id' => (int)$aResult['pending_id']]);
        $bTypeRecurring = $aPending['type'] == BX_PAYMENT_TYPE_RECURRING;
        $bAuthorized = isset($aResult['authorized']) && $aResult['authorized'];
        $bPaid = isset($aResult['paid']) && $aResult['paid'];
        $bTrial = isset($aResult['trial']) && $aResult['trial'];

        //--- Register subscription
        if($bTypeRecurring) {
            $sStatus = BX_PAYMENT_SBS_STATUS_UNPAID;
            if($bPaid)
                $sStatus = BX_PAYMENT_SBS_STATUS_ACTIVE;
            else if($bTrial)
                $sStatus = BX_PAYMENT_SBS_STATUS_TRIAL;

            $aSubscription = array(
                'customer_id' => $aResult['customer_id'], 
                'subscription_id' => $aResult['subscription_id'],
                'status' => $sStatus
            );

            if(!$this->getObjectSubscriptions()->register($aPending, $aSubscription))
                return ($sMsg = $this->_sLangsPrefix . 'err_already_registered') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['error' => $sMsg];
        }

        $this->onPaymentRegisterBefore($aPending);

        //--- Check "Pay Before Join" situation
        if((int)$aPending['client_id'] == 0)
            $this->getObjectJoin()->performJoin((int)$aPending['id'], isset($aResult['client_name']) ? $aResult['client_name'] : '', isset($aResult['client_email']) ? $aResult['client_email'] : '');

        //--- Authorize order for selected items in associated modules 
        if($bAuthorized)
            $this->authorizePayment($aPending);

        //--- Register payment for purchased items in associated modules 
        if($bPaid || ($bTypeRecurring && $bTrial))
            $this->registerPayment($aPending);

        //--- Get updated pending order
        $aPending = $this->_oDb->getOrderPending(['type' => 'id', 'id' => $aPending['id']]);

        $this->alert('finalize_checkout', 0, bx_get_logged_profile_id(), array(
            'pending' => $aPending,
            'transactions' => $this->_oDb->getOrderProcessed(array('type' => 'pending_id', 'pending_id' => (int)$aPending['id'])),
            'provider' => $oProvider,

            'message' => &$aResult['message'],
            'result' => &$aResult,

            'message_ref' => &$aResult['message'],
            'result_ref' => &$aResult,
        ));

        if($oProvider->needRedirect()) 
            return ['redirect' => $oProvider->getReturnUrl()];

        if(!empty($aResult['redirect'])) 
            return ['redirect' => $this->_oConfig->urlDecode($aResult['redirect'])];

        return $this->_bIsApi ? [bx_api_get_msg($aResult['message'])] : ['message' => $aResult['message']];
    }

    public function actionFinalizedCheckout($sProvider, $mixedVendorId = "")
    {
        $oProvider = $this->getObjectProvider($sProvider, $mixedVendorId);
        if($oProvider === false || !$oProvider->isActive())
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_incorrect_provider');

        $aResult = $oProvider->finalizedCheckout();
        $this->_oTemplate->displayPageCodeResponse($aResult['message']);
    }

    public function actionNotify($sProvider, $mixedVendorId = "")
    {
    	$oProvider = $this->getObjectProvider($sProvider, $mixedVendorId);
        if($oProvider === false || !$oProvider->isActive())
            return $this->_oTemplate->displayPageCodeError($this->_sLangsPrefix . 'err_incorrect_provider');

        $oProvider->notify();
    }
    
    /**
     * The method is needed to pass direct action calls to necessary Payment Provider.
     */
    public function actionCall($sProvider, $sAction, $mixedVendorId = BX_PAYMENT_EMPTY_ID)
    {
        $oProvider = $this->getObjectProvider($sProvider, $mixedVendorId);
        if($oProvider === false)
            BxDolRequest::methodNotFound($sAction, $this->getName());

         $sMethod = 'action' . bx_gen_method_name($sAction);
         if(!method_exists($oProvider, $sMethod))
             BxDolRequest::methodNotFound($sAction, $this->getName());

        return call_user_func_array(array($oProvider, $sMethod), array_slice(func_get_args(), 2));
    }

    public function onProfileJoin($iProfileId)
    {
    	$this->getObjectJoin()->onProfileJoin($iProfileId);
    }

    public function onProfileDelete($iProfileId)
    {
        //--- Cancel subscriptions
        $aSubscriptions = $this->_oDb->getSubscription(['type' => 'mixed_ext', 'conditions' => ['client_id' => $iProfileId]]);
        if(!empty($aSubscriptions) && is_array($aSubscriptions)) 
            foreach($aSubscriptions as $aSubscription)
                $this->getObjectSubscriptions()->cancel($aSubscription['pending_id']);

        //--- Clean DB
        $this->_oDb->onProfileDelete($iProfileId);
    }

    public function isAllowedPurchase($aItem, $bPerform = false)
    {
        $iUserId = (int)$this->getProfileId();

        $aItemInfo = $this->callGetCartItem((int)$aItem['module_id'], array($aItem['item_id'], $iUserId, isset($aItem['custom']) ? $aItem['custom'] : array()));
        if(empty($aItemInfo))
            return false;

        if(isAdmin())
            return true;

        $aCheckResult = checkActionModule($iUserId, 'purchase', $this->getName(), $bPerform);
        if($aCheckResult[CHECK_ACTION_RESULT] == CHECK_ACTION_RESULT_ALLOWED)
            return true;

        return $aCheckResult[CHECK_ACTION_MESSAGE];
    }

    public function isAllowedSell($aItem, $bPerform = false)
    {
        $iUserId = (int)$this->getProfileId();
        if(!$iUserId)
            return false;

        $aItemInfo = $this->callGetCartItem((int)$aItem['module_id'], array($aItem['item_id'], $iUserId));
        if(empty($aItemInfo))
            return false;

        if(isAdmin())
            return true;

        $aCheckResult = checkActionModule($iUserId, 'sell', $this->getName(), $bPerform);
        if((int)$aItemInfo['author_id'] == $iUserId && $aCheckResult[CHECK_ACTION_RESULT] == CHECK_ACTION_RESULT_ALLOWED)
            return true;

        return $aCheckResult[CHECK_ACTION_MESSAGE];
    }

    public function isAllowedManage($aPending, $bPerform = false)
    {
        $iUserId = (int)$this->getProfileId();

        if($iUserId == $aPending['client_id'] || $iUserId == $aPending['seller_id'] || isAdmin())
            return true;

        $aCheckResult = checkActionModule($iUserId, 'manage any purchase', $this->getName(), $bPerform);
        if($aCheckResult[CHECK_ACTION_RESULT] == CHECK_ACTION_RESULT_ALLOWED)
            return true;

        return $aCheckResult[CHECK_ACTION_MESSAGE];
    }

    public function isAllowedManageInvoices($bPerform = false)
    {
        if($this->_isModerator())
            return true;

        return _t('_sys_txt_access_denied');
    }

    public function checkData($iClientId, $iSellerId, $iModuleId, $iItemId, $iItemCount, $aCustom = array())
    {
    	$CNF = &$this->_oConfig->CNF;

        if($iSellerId == BX_PAYMENT_EMPTY_ID || empty($iModuleId) || empty($iItemId) || empty($iItemCount))
            return array('code' => 1, 'message' => _t($CNF['T']['ERR_WRONG_DATA']));

        $iClientId = $this->getProfileId();
        if(empty($iClientId)) {
            $sLoginUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=login');
            return array('code' => 2, 'eval' => 'window.open("' . $sLoginUrl . '", "_self");');
        }

        $mixedResult = $this->isAllowedPurchase(array('module_id' => $iModuleId, 'item_id' => $iItemId, 'custom' => $aCustom));
        if($mixedResult !== true) {
            if(is_string($mixedResult) && !empty($mixedResult))
                return array('code' => 2, 'message' => $mixedResult);
            else 
                return array('code' => 1, 'message' => _t($CNF['T']['ERR_WRONG_DATA']));
        }

        if($iClientId == $iSellerId)
            return array('code' => 3, 'message' => _t($CNF['T']['ERR_SELF_PURCHASE']));

        $aSeller = $this->getVendorInfo($iSellerId);
        if(!$aSeller['active'])
            return array('code' => 4, 'message' => _t($CNF['T']['ERR_INACTIVE_VENDOR']));

		return true;
    }

    public function authorizePayment($mixedPending)
    {
        $aPending = is_array($mixedPending) ? $mixedPending : $this->_oDb->getOrderPending(['type' => 'id', 'id' => (int)$mixedPending]);
    	if(empty($aPending) || !is_array($aPending))
            return false;

        $sType = $aPending['type'];
        $bTypeSingle = $sType == BX_PAYMENT_TYPE_SINGLE;

        if((int)$aPending['authorized'] == 1)
            return true;

        $iClientId = (int)$aPending['client_id'];

        $aCart = array();
        if($bTypeSingle)
            $aCart = $this->_oDb->getCartContent($iClientId);
        
        $bResult = false;
        $aItems = $this->_oConfig->descriptorsM2A($aPending['items']);
        foreach($aItems as $aItem) {
            $sItem = $this->_oConfig->descriptorA2S([$aItem['vendor_id'], $aItem['module_id'], $aItem['item_id']]);
            
            $sMethod = $bTypeSingle ? 'callAuthorizeCartItem' : 'callAuthorizeSubscriptionItem';
            $aItemInfo = $this->$sMethod((int)$aItem['module_id'], [$aPending['client_id'], $aPending['seller_id'], $aItem['item_id'], $aItem['item_count'], $aPending['order']]);
            if(empty($aItemInfo) || !is_array($aItemInfo))
                continue;

            if($bTypeSingle)
            	$aCart['items'] = trim(preg_replace("'" . $this->_oConfig->descriptorA2S($aItem) . ":?'", "", $aCart['items']), ":");

            $bResult = true;
        }

        if($bResult) {
            $this->_oDb->updateOrderPending($aPending['id'], ['authorized' => 1]);

            $this->onPaymentAuthorize($aPending);
        }

        return $bResult;
    }
    
    public function registerPayment($mixedPending)
    {
    	$aPending = is_array($mixedPending) ? $mixedPending : $this->_oDb->getOrderPending(['type' => 'id', 'id' => (int)$mixedPending]);
    	if(empty($aPending) || !is_array($aPending))
            return false;

        $sType = $aPending['type'];
        $bTypeSingle = $sType == BX_PAYMENT_TYPE_SINGLE;

        if($bTypeSingle && (int)$aPending['processed'] == 1)
            return true;

        $iClientId = (int)$aPending['client_id'];
        $iSellerId = (int)$aPending['seller_id'];
        $sLicense = $this->_oConfig->getLicense();
        $aCustoms = !empty($aPending['customs']) ? $this->_oConfig->s2a($aPending['customs'], false) : [];
        $aCart = $bTypeSingle ? $this->_oDb->getCartContent($iClientId) : [];

        $bResult = false;
        $aItems = $this->_oConfig->descriptorsM2A($aPending['items']);
        foreach($aItems as $aItem) {
            $sItem = $this->_oConfig->descriptorA2S([$aItem['vendor_id'], $aItem['module_id'], $aItem['item_id']]);
            $aItemCustom = $this->_oConfig->getCustom($sItem, $aCustoms);

            $sMethod = $bTypeSingle ? 'callRegisterCartItem' : 'callRegisterSubscriptionItem';
            $aItemInfo = $this->$sMethod((int)$aItem['module_id'], [$iClientId, $iSellerId, $aItem['item_id'], $aItem['item_count'], $aPending['order'], $sLicense, $aItemCustom]);
            if(empty($aItemInfo) || !is_array($aItemInfo))
                continue;

            $this->_oDb->insertOrderProcessed([
                'pending_id' => $aPending['id'],
                'client_id' => $iClientId,
                'seller_id' => $iSellerId,
                'author_id' => (int)$aItem['vendor_id'],
                'module_id' => (int)$aItem['module_id'],
                'item_id' => (int)$aItem['item_id'],
                'item_count' => (int)$aItem['item_count'],
                'amount' => (int)$aItem['item_count'] * $this->_oConfig->getPrice($sType, $aItemInfo),
                'currency' => !empty($aPending['currency']) ? $aPending['currency'] : $this->getVendorCurrencyCode($iSellerId),
            	'license' => $sLicense,
            ]);

            if($bTypeSingle) {
                $this->_oConfig->pullCustom($sItem, $aCart['customs']);

            	$aCart['items'] = trim(preg_replace("'" . $this->_oConfig->descriptorA2S($aItem) . ":?'", "", $aCart['items']), ":");
            }

            $bResult = true;
        }

        if($bTypeSingle)
            $this->_oDb->setCartItems($iClientId, $aCart['items'], $aCart['customs']);

        if($bResult) {
            $this->_oDb->updateOrderPending($aPending['id'], ['processed' => 1]);

            $this->onPaymentRegister($aPending);
        }

        return $bResult;
    }

    public function refundPayment($mixedPending)
    {
        $aPending = is_array($mixedPending) ? $mixedPending : $this->_oDb->getOrderPending(array('type' => 'id', 'id' => (int)$mixedPending));
        if(empty($aPending) || !is_array($aPending))
            return false;

        $bTypeSingle = $aPending['type'] == BX_PAYMENT_TYPE_SINGLE;

        $iCanceled = 0;
        $aOrders = $this->_oDb->getOrderProcessed(array('type' => 'pending_id', 'pending_id' => (int)$aPending['id']));
        foreach($aOrders as $aOrder) {
            $sMethod = $bTypeSingle ? 'callUnregisterCartItem' : 'callUnregisterSubscriptionItem';
            $bResult = $this->$sMethod((int)$aOrder['module_id'], array($aOrder['client_id'], $aOrder['seller_id'], $aOrder['item_id'], $aOrder['item_count'], $aPending['order'], $aOrder['license']));
            if(!$bResult)
                continue;

            if($this->_oDb->deleteOrderProcessed($aOrder['id']))
                $iCanceled++;
        }

        if($iCanceled != count($aOrders))
                return false;

        $bResult = $this->_oDb->deleteOrderPending($aPending['id']);
        if($bResult)
                $this->onPaymentRefund($aPending);

        return $bResult;
    }

    /**
     * @deprecated since version 12.0.0
     * 
     * @use BxPaymentSubscriptions::register instead.
     */
    public function registerSubscription($aPending, $aParams = array())
    {
        return $this->getObjectSubscriptions()->register($aPending, $aParams);
    }

    /**
     * @deprecated since version 12.0.0
     * 
     * @use BxPaymentSubscriptions::cancelLocal instead.
     */
    public function cancelSubscription($mixedPending)
    {
        return $this->getObjectSubscriptions()->cancelLocal($mixedPending);
    }

    public function processCommissions()
    {
        if(!defined('BX_DOL_CRON_EXECUTE'))
            return;

        if(!$this->_oConfig->isCommissions())
            return;

        if((int)date('j') == $this->_oConfig->getInvoiceIssueDay())
            $this->_invoicesIssue();

        $this->_invoicesCheck();
    }

    protected function _invoicesIssue()
    {
        $CNF = &$this->_oConfig->CNF;

        $sInvoiceNameMask = 'INV-%d-%d-%d';

        $iMonth = date('m');
        $iYear = date('Y');
        $iPeriodStart = mktime(0, 0, 0, $iMonth-1, 1, $iYear);
        $iPeriodEnd = mktime(23, 59, 59, $iMonth, 0, $iYear);
        $iDateIssue = time();
        $iDateDue = $iDateIssue + 86400 * $this->_oConfig->getInvoiceLifetime();

        $aCommissionsInfo = array();
        $aAclLevels = BxDolAcl::getInstance()->getMemberships(false, true, false, true);
        foreach($aAclLevels as $iAclLevelId => $sAclLevelTitle)
            $aCommissionsInfo[$iAclLevelId] = $this->_oDb->getCommissions(['type' => 'acl_id', 'acl_id' => $iAclLevelId]);

        $iMainSellerId = $this->_oConfig->getSiteAdmin();

        $aVendors = $this->_oDb->getOrderProcessed(['type' => 'income', 'period_start' => $iPeriodStart, 'period_end' => $iPeriodEnd]);
        foreach($aVendors as $aVendor) {
            $iVendorId = (int)$aVendor['id'];
            if($iVendorId == $iMainSellerId)
                continue;

            $aInvoice = $this->_oDb->getInvoices(['type' => 'committent_id', 'committent_id' => $iVendorId, 'period_start' => $iPeriodStart, 'period_end' => $iPeriodEnd]);
            if(!empty($aInvoice) && is_array($aInvoice))
                continue;

            $aVendorAcl = BxDolAcl::getInstance()->getMemberMembershipInfo($iVendorId);
            $aCommissions = $aCommissionsInfo[$aVendorAcl['id']];

            $fCommission = 0;
            foreach($aCommissions as $aCommission) {
                if((float)$aCommission['percentage'] > 0)
                    $fCommission += (float)$aVendor['amount'] * (float)$aCommission['percentage'] / 100;

                if((float)$aCommission['installment'] > 0)
                    $fCommission += (float)$aCommission['installment'];
            }

            $this->alert('calculate_commission', 0, 0, [
                'vendor' => $aVendor,
                'commissions' => $aCommissions,
                'override_result' => &$fCommission,
            ]);

            if($fCommission > 0)
                $this->_oDb->insertInvoice([
                    'name' => sprintf($sInvoiceNameMask, $iMainSellerId, $iVendorId, $this->_oDb->getInvoices([
                        'type' => 'index', 
                        'commissionaire_id' => $iMainSellerId, 
                        'committent_id' => $iVendorId
                    ])),
                    'commissionaire_id' => $iMainSellerId, 
                    'committent_id' => $iVendorId,
                    'amount' => $fCommission,
                    'period_start' => $iPeriodStart,
                    'period_end' => $iPeriodEnd,
                    'date_issue' => $iDateIssue,
                    'date_due' => $iDateDue,
                    'status' => BX_PAYMENT_INV_STATUS_UNPAID
                ]);
        }
    }

    protected function _invoicesCheck()
    {
        $CNF = &$this->_oConfig->CNF;

        $sPrefix = $this->_oConfig->getPrefix('general');
        $oEmailTemplates = BxDolEmailTemplates::getInstance();

        //--- Process expiring invoices.
        $aInvoices = $this->_oDb->getInvoices(array('type' => 'expiring'));
        if(!empty($aInvoices) && is_array($aInvoices))
            foreach($aInvoices as $aInvoice) {
                if((int)$aInvoice['ntf_exp'] > 0)
                    continue;

                $oCommittent = BxDolProfile::getInstance($aInvoice['committent_id']);
                if(!$oCommittent)
                    continue;

                $bResult = sendMailTemplate($sPrefix . 'expiring_notification_committent', 0, (int)$aInvoice['committent_id'], array(
                    'invoice' => $aInvoice['name'],
                    'days' => $this->_oConfig->getInvoiceExpirationNotify(),
                    'period_start' => $this->_oConfig->formatDate($aInvoice['period_start']),
                    'period_end' => $this->_oConfig->formatDate($aInvoice['period_end']),
                    'date_issue' => $this->_oConfig->formatDateTime($aInvoice['date_issue']),
                    'date_due' => $this->_oConfig->formatDateTime($aInvoice['date_due']),
                ), BX_EMAIL_NOTIFY, true);

                if($bResult)
                    $this->_oDb->updateInvoice($aInvoice['id'], array('ntf_exp' => 1));
            }

        //--- Process overdue invoices.
        $aInvoices = $this->_oDb->getInvoices(array('type' => 'overdue'));
        if(!empty($aInvoices) && is_array($aInvoices))
            foreach($aInvoices as $aInvoice) {
                if((int)$aInvoice['ntf_due'] > 0 && $aInvoice['status'] == BX_PAYMENT_INV_STATUS_OVERDUE)
                    continue;

                $oCommittent = BxDolProfile::getInstance($aInvoice['committent_id']);
                if(!$oCommittent)
                    continue;

                $bResult = sendMailTemplate($sPrefix . 'overdue_notification_committent', 0, (int)$aInvoice['committent_id'], array(
                    'invoice' => $aInvoice['name'],
                    'period_start' => $this->_oConfig->formatDate($aInvoice['period_start']),
                    'period_end' => $this->_oConfig->formatDate($aInvoice['period_end']),
                    'date_issue' => $this->_oConfig->formatDateTime($aInvoice['date_issue']),
                    'date_due' => $this->_oConfig->formatDateTime($aInvoice['date_due']),
                ), BX_EMAIL_NOTIFY, true);

                $this->_oDb->updateInvoice($aInvoice['id'], array(
                    'status' => BX_PAYMENT_INV_STATUS_OVERDUE, 
                    'ntf_due' => $bResult ? 1 : 0
                ));
            }
    }

    public function processTimeTracker()
    {
        if(!defined('BX_DOL_CRON_EXECUTE'))
            return;

        $aSubscriptions = $this->_oDb->getSubscription(array(
            'type' => 'time_tracker',
            'status_active' => BX_PAYMENT_SBS_STATUS_ACTIVE,
            'status_trial' => BX_PAYMENT_SBS_STATUS_TRIAL,
            'status_unpaid' => BX_PAYMENT_SBS_STATUS_UNPAID,
            'pay_attempts_max' => $this->_oConfig->getPayAttemptsMax(),
            'pay_attempts_interval' => $this->_oConfig->getPayAttemptsInterval()
        ));

        if(empty($aSubscriptions) || !is_array($aSubscriptions))
            return;

        foreach($aSubscriptions as $aSubscription) {
            $aPending = $this->_oDb->getOrderPending(array('type' => 'id', 'id' => (int)$aSubscription['pending_id']));
            if(empty($aPending) || !is_array($aPending) || $aPending['type'] != BX_PAYMENT_TYPE_RECURRING) {
                $this->log($aSubscription, 'Time Tracker', 'Cannot process subscription.', BX_LOG_ERR);
                continue;
            }

            $oProvider = $this->getObjectProvider($aPending['provider'], $aPending['seller_id']);
            if($oProvider === false || !$oProvider->isActive() || !method_exists($oProvider, 'makePayment')) {
                $this->log($aSubscription, 'Time Tracker', 'Payment provider unavailable or incorrect.', BX_LOG_ERR);
                continue;
            }

            $this->_oDb->updateSubscription(['pay_attempts' => (int)$aSubscription['pay_attempts'] + 1], ['id' => $aSubscription['id']]);

            if(($mixedResult = $oProvider->makePayment($aPending)) !== true) {
                $this->_oDb->updateSubscription(['status' => BX_PAYMENT_SBS_STATUS_UNPAID], ['id' => $aSubscription['id']]);

                $this->log($aSubscription, 'Time Tracker', 'Payment cannot be processed (code: ' . (!empty($mixedResult['code']) ? (int)$mixedResult['code'] : 0) . ').', BX_LOG_ERR);
                continue;
            }

            if(!$this->getObjectSubscriptions()->prolong($aPending)) {
                $this->log($aSubscription, 'Time Tracker', 'Cannot prolong subscription.', BX_LOG_ERR);
                continue;
            }

            if(!$this->registerPayment($aPending)) {
                $this->log($aSubscription, 'Time Tracker', 'Cannot register payment.', BX_LOG_ERR);
                continue;
            }
        }
    }

    public function onPaymentRegisterBefore($aPending, $aResult = [])
    {
        $this->alert('before_register_payment', 0, $aPending['client_id'], array('pending' => $aPending));
    }

    public function onPaymentAuthorize($aPending, $aResult = [])
    {
        $this->alert('authorize_payment', 0, $aPending['client_id'], ['pending' => $aPending]);
    }

    public function onPaymentRegister($aPending, $aResult = [])
    {
        $bTypeSingle = $aPending['type'] == BX_PAYMENT_TYPE_SINGLE;

        if($bTypeSingle) {
            $aItems = $this->_oConfig->descriptorsM2A($aPending['items']);
            foreach($aItems as $aItem)
                $this->isAllowedPurchase(['module_id' => $aItem['module_id'], 'item_id' => $aItem['item_id']], true);
        }

        $this->alert('register_payment', 0, $aPending['client_id'], ['pending' => $aPending]);
    }

    public function onPaymentRefund($aPending, $aResult = [])
    {
        $this->alert('refund_payment', 0, $aPending['client_id'], ['pending' => $aPending]);
    }

    public function onSubscriptionCreate($aPending, $aSubscription, $aResult = [])
    {
        $aItems = $this->_oConfig->descriptorsM2A($aPending['items']);
        $this->isAllowedPurchase(['module_id' => $aItems[0]['module_id'], 'item_id' => $aItems[0]['item_id']], true);

        $this->alert('create_subscription', 0, $aPending['client_id'], [
            'pending' => $aPending,
            'subscription' => $aSubscription
        ]);
    }

    public function onSubscriptionProlong($aPending, $aSubscription, $aResult = [])
    {
        $this->alert('prolong_subscription', 0, $aPending['client_id'], [
            'pending' => $aPending,
            'subscription' => $aSubscription
        ]);
    }

    public function onSubscriptionOverdue($aPending, $aSubscription, $aResult = [])
    {
        $this->alert('overdue_subscription', 0, $aPending['client_id'], [
            'pending' => $aPending,
            'subscription' => $aSubscription
        ]);
    }

    public function onSubscriptionCancel($aPending, $aSubscription, $aResult = [])
    {
        $this->alert('cancel_subscription', 0, $aPending['client_id'], [
            'pending' => $aPending,
            'subscription' => $aSubscription
        ]);
    }

    public function setSiteSubmenu($sSubmenu, $sSelModule, $sSelName)
    {
        $oSiteSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if(!$oSiteSubmenu)
            return;

        $sModuleSubmenu = $this->_oConfig->getObject($sSubmenu);
        $oModuleSubmenu = BxDolMenu::getObjectInstance($sModuleSubmenu);
        if(!$oModuleSubmenu) 
            return;

        $oSiteSubmenu->setObjectSubmenu($sModuleSubmenu);
        $oModuleSubmenu->setSelected($sSelModule, $sSelName);
    }

    public function getProviderButtonJs($aCartItem, $aProvider, $sRedirect = '', $aCustom = array())
    {
        $aButtonJs = array();
        $iClientId = $this->getProfileId();

        $sItemAddons = '';
        if(count($aCartItem) == 5)
            $sItemAddons = array_pop($aCartItem);

        list($iSellerId, $iModuleId, $iItemId, $iItemCount) = $aCartItem;

        $oProvider = $this->getObjectProvider($aProvider['name'], $iSellerId);
        if($oProvider !== false && method_exists($oProvider, 'getButtonRecurring')) {
            $aParams = array(
                'sObjNameCart' => $this->_oConfig->getJsObject('cart'),
                'iSellerId' => $iSellerId,
                'iModuleId' => $iModuleId,
                'iItemId' => $iItemId,
                'iItemCount' => $iItemCount,
                'sItemAddons' => $sItemAddons,
                'sRedirect' => $sRedirect,
                'sCustom' => base64_encode(json_encode($aCustom))
            );

            $aCartInfo = $this->getObjectCart()->getInfo(BX_PAYMENT_TYPE_RECURRING, $iClientId, $iSellerId, $this->_oConfig->descriptorA2S($aCartItem));
            if(!empty($aCartInfo['items_price']) && !empty($aCartInfo['items']) && is_array($aCartInfo['items'])) {
                $aItem = array_shift($aCartInfo['items']);

                $aParams = array_merge($aParams, array(
                    'iAmount' => (int)round(100 * (float)$aCartInfo['items_price']),
                    'sItemName' => $aItem['name'],
                    'sItemTitle' => $aItem['title']
                ));
            }

            $aButtonJs = $oProvider->getButtonRecurringJs($iClientId, $iSellerId, $aParams);
        }

        if(empty($aButtonJs) || !is_array($aButtonJs))
            $aButtonJs = $this->getObjectSubscriptions()->serviceGetSubscribeJs($iSellerId, $aProvider['name'], $iModuleId, $iItemId, $iItemCount, $sRedirect, $aCustom);

        return $aButtonJs;
    }

    /**
     * Integration with itslef which is needed to pay an invoice.
     */

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-payments Payments
     * @subsubsection bx_payment-get_payment_data get_payment_data
     * 
     * @code bx_srv('bx_payment', 'get_payment_data', [...]); @endcode
     * 
     * Get an array with module's description. Is needed for payments processing module.
     * 
     * @return an array with module's description.
     * 
     * @see BxPaymentModule::serviceGetPaymentData
     */
    /** 
     * @ref bx_payment-get_payment_data "get_payment_data"
     */
    public function serviceGetPaymentData()
    {
        return $this->_aModule;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-payments Payments
     * @subsubsection bx_payment-get_cart_item get_cart_item
     * 
     * @code bx_srv('bx_payment', 'get_cart_item', [...]); @endcode
     * 
     * Get an array with prodict's description. Is used in Shopping Cart in payments processing module.
     * 
     * @param $mixedItemId product's ID or Unique Name.
     * @return an array with prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxPaymentModule::serviceGetCartItem
     */
    /** 
     * @ref bx_payment-get_cart_item "get_cart_item"
     */
    public function serviceGetCartItem($mixedItemId)
    {
    	$CNF = &$this->_oConfig->CNF;

        if(!$mixedItemId)
            return array();

        if(is_numeric($mixedItemId))
            $aItem = $this->_oDb->getInvoices(array('type' => 'id', 'id' => (int)$mixedItemId));
        else 
            $aItem = $this->_oDb->getInvoices(array('type' => 'name', 'name' => $mixedItemId));

        if(empty($aItem) || !is_array($aItem))
            return array();

        $oCommissionaire = BxDolProfile::getInstanceMagic($aItem['commissionaire_id']);

        return array (
            'id' => $aItem['id'],
            'author_id' => $aItem['commissionaire_id'],
            'name' => $aItem['name'],
            'title' => _t('_bx_payment_txt_invoice_title', $aItem['name'], $oCommissionaire->getDisplayName()),
            'description' => _t('_bx_payment_txt_invoice_description', bx_process_output($aItem['period_start'], BX_DATA_DATE_TS_UTC), bx_process_output($aItem['period_end'], BX_DATA_DATE_TS_UTC)),
            'url' => '',
            'price_single' => $aItem['amount'],
            'price_recurring' => '',
            'period_recurring' => 0,
            'period_unit_recurring' => '',
            'trial_recurring' => ''
        );
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-payments Payments
     * @subsubsection bx_payment-get_cart_items get_cart_items
     * 
     * @code bx_srv('bx_payment', 'get_cart_items', [...]); @endcode
     * 
     * Get an array with prodicts' descriptions by seller. Is used in Manual Order Processing in payments processing module.
     * 
     * @param $iCommissionaireId commissionaire ID.
     * @return an array with prodicts' descriptions. Empty array is returned if something is wrong or seller doesn't have any products.
     * 
     * @see BxPaymentModule::serviceGetCartItems
     */
    /** 
     * @ref bx_payment-get_cart_items "get_cart_items"
     */
    public function serviceGetCartItems($iCommissionaireId)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iCommissionaireId = (int)$iCommissionaireId;
        if(empty($iCommissionaireId))
            return array();

        $sCommissionaireName = BxDolProfile::getInstanceMagic($iCommissionaireId)->getDisplayName();

        $aItems = $this->_oDb->getInvoices(array('type' => 'commissionaire_id', 'commissionaire_id' => $iCommissionaireId));      

        $aResult = array();
        foreach($aItems as $aItem)
            $aResult[] = array(
                'id' => $aItem['id'],
                'author_id' => $aItem['commissionaire_id'],
                'name' => $aItem['name'],
                'title' => _t('_bx_payment_txt_invoice_title', $aItem['name'], $sCommissionaireName),
                'description' => _t('_bx_payment_txt_invoice_description', bx_process_output($aItem['period_start'], BX_DATA_DATE_TS_UTC), bx_process_output($aItem['period_end'], BX_DATA_DATE_TS_UTC)),
                'url' => '',
                'price_single' => $aItem['amount'],
                'price_recurring' => '',
                'period_recurring' => 0,
                'period_unit_recurring' => '',
                'trial_recurring' => ''
            );

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-payments Payments
     * @subsubsection bx_payment-register_cart_item register_cart_item
     * 
     * @code bx_srv('bx_payment', 'register_cart_item', [...]); @endcode
     * 
     * Register a processed single time payment inside the Payment module. Is called with payment processing module after the payment was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxPaymentModule::serviceRegisterCartItem
     */
    /** 
     * @ref bx_payment-register_cart_item "register_cart_item"
     */
    public function serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aItem = $this->serviceGetCartItem($iItemId);
        if(empty($aItem) || !is_array($aItem))
            return array();

        if(!$this->_oDb->updateInvoice($iItemId, array('status' => BX_PAYMENT_INV_STATUS_PAID)))
            return array();

        $this->alert('invoice_marked_as_paid', 0, false, array(
            'product_id' => $iItemId,
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'license' => $sLicense,
            'type' => BX_PAYMENT_TYPE_SINGLE,
            'count' => $iItemCount,
            'duration' => '',
            'trial' => ''
        ));

        return $aItem;
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-payments Payments
     * @subsubsection bx_payment-unregister_cart_item unregister_cart_item
     * 
     * @code bx_srv('bx_payment', 'unregister_cart_item', [...]); @endcode
     * 
     * Unregister an earlier processed single time payment inside the Payment module. Is called with payment processing module after the payment was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the payment was unregistered or not.
     * 
     * @see BxPaymentModule::serviceUnregisterCartItem
     */
    /** 
     * @ref bx_payment-unregister_cart_item "unregister_cart_item"
     */
    public function serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        if(!$this->_oDb->updateInvoice($iItemId, array('status' => BX_PAYMENT_INV_STATUS_UNPAID)))
            return false;

        $this->alert('invoice_marked_as_unpaid', 0, false, array(
            'product_id' => $iItemId,
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'license' => $sLicense,
            'type' => BX_PAYMENT_TYPE_SINGLE,
            'count' => $iItemCount
        ));

    	return true;
    }

    public function serviceStripeV3CreateSessionApi($mixedParams)
    {
        $aParams = is_array($mixedParams) ? $mixedParams : json_decode($mixedParams, true);
        if(!isset($aParams['type'], $aParams['seller_id'], $aParams['items']))
            return [bx_api_get_msg(_t($this->_sLangsPrefix . 'err_wrong_data'))];

        $sType = $aParams['type'];
        $sProvider = 'stripe_v3';
        $iClientId = $this->getProfileId();
        $iSellerId = (int)$aParams['seller_id'];
        $sItems = $aParams['items'];

        $oProvider = $this->getObjectProvider($sProvider, $iSellerId);
        if($oProvider === false || !$oProvider->isActive())
            return [bx_api_get_msg(_t($this->_sLangsPrefix . 'err_incorrect_provider'))];

        $aSessionParams = [];
        if(!empty($aParams['return_url'])) {
            $sRedirect = $this->_oConfig->urlEncode($this->_oConfig->getUrl('URL_' . ($sType == BX_PAYMENT_TYPE_RECURRING ? 'SUBSCRIPTIONS' : 'HISTORY')));

            $aSessionParams['return_url'] = $aParams['return_url'] . '/api.php?r=' . $this->getName() . '/initialize_checkout_api&params[]=' . implode('&params[]=', [$sType, $iSellerId, $sProvider, $sItems, $sRedirect]);
        }

        $minxedSession = $oProvider->createSessionPaymentEmbedded($sType, $iClientId, $iSellerId, $sItems, $aSessionParams);
        if($minxedSession === false)
            return [bx_api_get_msg(_t($this->_sLangsPrefix . 'err_cannot_perform'))];

        return [
            'clientSecret' => $minxedSession
        ];
    }

    public function serviceConvert($fAmount, $sCurrencyFrom, $sCurrencyTo, $fRate = false)
    {
        $sCurrencyDefault = $this->_oConfig->getDefaultCurrencyCode();
        $bFromDefault = strcmp($sCurrencyFrom, $sCurrencyDefault) == 0;
        $bToDefault = strcmp($sCurrencyTo, $sCurrencyDefault) == 0;

        if(!$bFromDefault && !$bToDefault)
            return false;

        if($fRate === false)
            $fRate = $this->_oDb->getCurrencyExchangeRate($bFromDefault ? $sCurrencyTo : $sCurrencyFrom);
        if($fRate === false)
            return false;

        $fRate = (float)$fRate;
        if($bToDefault)
            $fRate = 1/$fRate;

        return $fAmount * $fRate;
    }

    public function updateCurrencyExchangeRates()
    {
        $CNF = &$this->_oConfig->CNF;

        $sApiKey = getParam($CNF['PARAM_CURRENCY_EXCHANGE_API']);
        if(empty($sApiKey))
            return;

        $sCurrency = $this->_oDb->getParam($CNF['PARAM_CURRENCY_CODE'], false);
        $aCurrencies = BxDolForm::getDataItems($CNF['OBJECT_FORM_PRELISTS_CURRENCIES'], false, BX_DATA_VALUES_ADDITIONAL);
        unset($aCurrencies[$sCurrency]);

        $sApiEndpoint = 'https://api.apilayer.com/exchangerates_data/latest';
        $aApiParams = [
            'symbols' => implode(',', array_keys($aCurrencies)), 
            'base' => $sCurrency
        ];
        $sResponse = bx_file_get_contents($sApiEndpoint, $aApiParams, 'get', [
            'apikey: ' . $sApiKey
        ]);

        $aResponse = json_decode($sResponse, true);
        if(empty($aResponse['rates']) || !is_array($aResponse['rates']))
            return;

        $this->_oDb->deleteCurrencyExchangeRate($sCurrency);

        foreach($aResponse['rates'] as $sCode => $fRate)
            $this->_oDb->updateCurrencyExchangeRate($sCode, $fRate);
    }
}

/** @} */
