<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Credits Credits
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_CREDITS_TRANSFER_TYPE_PURCHASE', 'purchase');
define('BX_CREDITS_TRANSFER_TYPE_CHECKOUT', 'checkout');
define('BX_CREDITS_TRANSFER_TYPE_CANCELLATION', 'cancellation');
define('BX_CREDITS_TRANSFER_TYPE_GRANT', 'grant');
define('BX_CREDITS_TRANSFER_TYPE_SEND', 'send');
define('BX_CREDITS_TRANSFER_TYPE_WITHDRAW', 'withdraw');
define('BX_CREDITS_TRANSFER_TYPE_SERVICE', 'service');

define('BX_CREDITS_DIRECTION_IN', 'in');
define('BX_CREDITS_DIRECTION_OUT', 'out');

define('BX_CREDITS_ORDER_TYPE_SINGLE', 'single'); //--- one-time payment
define('BX_CREDITS_ORDER_TYPE_RECURRING', 'recurring'); //--- recurring payment (subscription)

define('BX_CREDITS_WITHDRAWAL_STATUS_REQUESTED', 'requested');
define('BX_CREDITS_WITHDRAWAL_STATUS_CANCELED', 'canceled');
define('BX_CREDITS_WITHDRAWAL_STATUS_CONFIRMED', 'confirmed');

class BxCreditsModule extends BxBaseModGeneralModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function actionGetProfiles()
    {
        $sTerm = bx_get('term');

        $a = BxDolService::call('system', 'profiles_search', array($sTerm), 'TemplServiceProfiles');

        echoJson($a);
    }

    public function actionCheckBundleName()
    {
        $CNF = &$this->_oConfig->CNF;

    	$sName = bx_process_input(bx_get('name'));
    	if(empty($sName))
            return echoJson(array());

        $sResult = '';

        $iId = (int)bx_get('id');
        if(!empty($iId)) {
            $aBundle = $this->_oDb->getBundle(array('type' => 'id', 'id' => $iId)); 
            if(strcmp($sName, $aBundle[$CNF['FIELD_NAME']]) == 0) 
                $sResult = $sName;
        }

    	echoJson(array(
            'name' => !empty($sResult) ? $sResult : $this->_oConfig->getBundleName($sName)
    	));
    }

    public function actionCheckout()
    {
        return echoJson($this->serviceCheckout());
    }

    public function actionSubscribe()
    {
        return echoJson($this->serviceSubscribe());
    }

    public function serviceGetSafeServices()
    {
        return [
            'GetBlockBundles' => '',
            'GetBlockOrders' => '',
            'GetBlockHistory' => '',
            'AddToCart' => '',
            'Checkout' => '',
            'Subscribe' => ''
        ];
    }

    public function serviceCheckout()
    {
        $iBuyerId = bx_get_logged_profile_id();
        if(!$iBuyerId)
            return ['code' => 1, 'msg' => _t('_bx_credits_err_unknown_buyer')];

        $sErrIncorrectData = _t('_bx_credits_err_incorrect_data');

        $aData = $this->_oConfig->getCheckoutData();
        if(empty($aData) || !is_array($aData))
            return ['code' => 2, 'msg' => $sErrIncorrectData];

        $fConversion = $this->_oConfig->getConversionRateUse();
        $iPrecision = $this->_oConfig->getPrecision();

        $iSellerId = (int)$aData['seller'];
        $fAmount = (float)$aData['amount'];
        $aCustomData = $this->_oConfig->deconstructCheckoutCustomData($aData['custom']);

        $oPayments = BxDolPayments::getInstance();
        $aPpOrders = $oPayments->getPendingOrdersInfo(['id' => (int)$aCustomData[1]]);
        if(!empty($aPpOrders) && is_array($aPpOrders)) {
            $aPpOrder = reset($aPpOrders);
            if(empty($aPpOrder) || !is_array($aPpOrder) || (int)$aPpOrder['seller_id'] != $iSellerId)
                return ['code' => 3, 'msg' => $sErrIncorrectData];

            $fAmountM = (float)$aPpOrder['amount'];
            $sCurrencyDefault = $oPayments->getCurrencyCode();
            if(strcmp($aPpOrder['currency'], $sCurrencyDefault) != 0)
                $fAmountM = $oPayments->convert ($fAmountM, $aPpOrder['currency'], $sCurrencyDefault);

            if($this->_oConfig->convertM2C($fAmountM, $fConversion, $iPrecision) != $fAmount)
                return ['code' => 3, 'msg' => $sErrIncorrectData];
        }

        $fBalance = (float)$this->_oDb->getProfile(['type' => 'balance', 'id' => $iBuyerId]);
        if($fAmount > $fBalance)
            return ['code' => 4, 'msg' => _t('_bx_credits_err_low_balance')];

        $sOrder = $this->_oConfig->getOrder();
        $sInfo = '_bx_credits_txt_history_info_checkout';
        $sData = serialize([
            'conversion' => $fConversion,
            'precision' => $iPrecision
        ]);

        $this->updateProfileBalance($iBuyerId, $iSellerId, -$fAmount, BX_CREDITS_TRANSFER_TYPE_CHECKOUT, $sOrder, $sInfo, $sData);
        $this->updateProfileBalance($iSellerId, $iBuyerId, $fAmount, BX_CREDITS_TRANSFER_TYPE_CHECKOUT, $sOrder, $sInfo, $sData);

        /**
         * @hooks
         * @hookdef hook-bx_credits-checkout 'bx_credits', 'checkout' - hook after checkout with creadits was performed
         * - $unit_name - equals `bx_credits`
         * - $action - equals `checkout`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `seller` - [int] seller profile id
         *      - `buyer` - [int] buyer profile id
         *      - `amount` - [float] amount was paid
         *      - `order` - [string] order number for processed checkout action
         * @hook @ref hook-bx_credits-checkout
         */
        bx_alert($this->getName(), 'checkout', 0, false, [
            'seller' => $iSellerId,
            'buyer' => $iBuyerId,
            'amount' => $fAmount, 
            'order' => $sOrder
        ]);

        $aParams = [
            'o' => $sOrder, 
            'c' => $aData['custom']
        ];

        return $this->_bIsApi ? [
            'code' => 0, 
            'request_url' => $aData['return_data_url'] . '&params[]=' . json_encode($aParams)
        ] : [
            'code' => 0,
            'redirect' => bx_append_url_params($aData['return_data_url'], $aParams)
        ];
    }

    public function serviceSubscribe()
    {
        $iBuyerId = bx_get_logged_profile_id();
        if(!$iBuyerId)
            return ['code' => 1, 'msg' => _t('_bx_credits_err_unknown_buyer')];

        $aData = $this->_oConfig->getCheckoutData();
        if(empty($aData) || !is_array($aData))
            return ['code' => 2, 'msg' => _t('_bx_credits_err_incorrect_data')];

        $iSellerId = (int)$aData['seller'];
        $fAmount = (float)$aData['amount'];

        $fBalance = (float)$this->_oDb->getProfile(array('type' => 'balance', 'id' => $iBuyerId));
        if($fAmount > $fBalance)
            return ['code' => 3, 'msg' => _t('_bx_credits_err_low_balance')];

        $sUnique = $this->_oConfig->getOrder(9);
        $sCustomer = 'bx_cus_' . $sUnique;
        $sSubscription = 'bx_sub_' . $sUnique;

        /**
         * @hooks
         * @hookdef hook-bx_credits-subscribe 'bx_credits', 'subscribe' - hook after subscription was registered
         * - $unit_name - equals `bx_credits`
         * - $action - equals `subscribe`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `seller` - [int] seller profile id
         *      - `buyer` - [int] buyer profile id
         *      - `amount` - [float] amount was paid
         *      - `trial` - [boolean] if trial period is available or not
         *      - `customer` - [string] unique customer id for newly registered subscription
         *      - `subscription` - [string] unique subscription id
         * @hook @ref hook-bx_credits-subscribe
         */
        bx_alert($this->getName(), 'subscribe', 0, false, [
            'seller' => $iSellerId,
            'buyer' => $iBuyerId,
            'amount' => $fAmount, 
            'trial' => $aData['trial'],
            'customer' => $sCustomer,
            'subscription' => $sSubscription
        ]);

        $aParams = [
            'cs' => $sCustomer, 
            'sb' => $sSubscription,
            'tr' => $aData['trial'],
            'c' => $aData['custom']
        ];

        return $this->_bIsApi ? [
            'code' => 0,
            'request_url' => $aData['return_data_url'] . '&params[]=' . json_encode($aParams)
        ] : [
            'code' => 0,
            'redirect' => bx_append_url_params($aData['return_data_url'], $aParams)
        ];
    }

    public function serviceGetCheckoutUrl()
    {
        return $this->_oConfig->getCheckoutUrl();
    }

    public function serviceConvertMoneyToCredits($fMoney, $fRate = false, $iPrecision = false)
    {
        return $this->_oConfig->convertM2C($fMoney, $fRate, $iPrecision);
    }

    public function serviceConvertCreditsToMoney($fCredits, $fRate = false, $iPrecision = false)
    {
        return $this->_oConfig->convertC2M($fCredits, $fRate, $iPrecision);
    }

    public function serviceValidateCheckout($iSeller, $iBuyer, $fAmount, $sOrder)
    {
        $fAmount = (float)$fAmount;

        $aOut = $this->_oDb->getHistory(array('type' => 'row_by', 'by' => array('first_pid' => $iBuyer, 'direction' => BX_CREDITS_DIRECTION_OUT, 'order' => $sOrder)));
        if(empty($aOut) || !is_array($aOut) || (int)$aOut['second_pid'] != (int)$iSeller)
            return false;
        
        $aDataOut = unserialize($aOut['data']);
        if($this->_oConfig->convertM2C($fAmount, $aDataOut['conversion'], $aDataOut['precision']) != (float)$aOut['amount'])
            return false;

        $aIn = $this->_oDb->getHistory(array('type' => 'row_by', 'by' => array('first_pid' => $iSeller, 'direction' => BX_CREDITS_DIRECTION_IN, 'order' => $sOrder)));
        if(empty($aIn) || !is_array($aIn) || (int)$aIn['second_pid'] != (int)$iBuyer)
            return false;

        $aDataIn = unserialize($aIn['data']);
        if($this->_oConfig->convertM2C($fAmount, $aDataIn['conversion'], $aDataIn['precision']) != (float)$aIn['amount'])
            return false;

        return true;
    }

    public function serviceGetBlockCheckout()
    {
        $oBuyer = BxDolProfile::getInstance();
        if(!$oBuyer)
            return ($sMsg = _t('_bx_credits_err_unknown_buyer')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);
        
        $iSeller = (int)bx_get('seller');
        $oSeller = BxDolProfile::getInstance($iSeller);
        if(!$oSeller)
            return ($sMsg = _t('_bx_credits_err_unknown_seller')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

        $fAmountM = $fAmountMInDef = (float)bx_get('amount');

        $oPayments = BxDolPayments::getInstance();
        $sCurrency = bx_process_input(bx_get('currency_code'));
        $sCurrencyDefault = $oPayments->getCurrencyCode();
        if(strcmp($sCurrency, $sCurrencyDefault) != 0)
            $fAmountMInDef = $oPayments->convert($fAmountM, $sCurrency, $sCurrencyDefault);

        $fAmountC = $this->_oConfig->convertM2C($fAmountMInDef);

        $aData = [
            'seller' => $iSeller,
            'currency' => [
                'code' => $sCurrency,
                'sign' => bx_process_input(bx_get('currency_sign')),
            ],
            'amountm' => $fAmountM,
            'amountc' => $fAmountC
        ];

        $iItemsCount = (int)bx_get('items_count');
        for($i = 0; $i < $iItemsCount; $i++) {
            $aData['items'][] = [
                'title' => bx_process_input(bx_get('item_title_' . $i)),
                'quantity' => (int)bx_get('item_quantity_' . $i)
            ];
        }

        $this->_oConfig->setCheckoutData([
            'seller' => $iSeller,
            'amount' => $fAmountC,
            'custom' => bx_process_input(bx_get('custom')),
            'return_data_url' => bx_process_input(bx_get('return_data_url')),
        ]);

        $mixedResult = $this->_oTemplate->getBlockCheckout($oBuyer, $oSeller, $aData);
        return $this->_bIsApi ? [bx_api_get_block('credits_checkout', $mixedResult)] : $mixedResult;
    }

    public function serviceGetPopupSubscribe($aData)
    {
        $oBuyer = BxDolProfile::getInstance();
        if(!$oBuyer)
            return ['msg' => _t('_bx_credits_err_unknown_buyer')];

        $iSeller = (int)$aData['seller'];
        $oSeller = BxDolProfile::getInstance($iSeller);
        if(!$oSeller)
            return ['msg' => _t('_bx_credits_err_unknown_seller')];

        $fAmountM = $fAmountMInDef = (float)$aData['amount'];

        $oPayments = BxDolPayments::getInstance();
        $sCurrency = $aData['currency_code'];
        $sCurrencyDefault = $oPayments->getCurrencyCode();
        if(strcmp($sCurrency, $sCurrencyDefault) != 0)
            $fAmountMInDef = $oPayments->convert($fAmountM, $sCurrency, $sCurrencyDefault);

        $fAmountC = $this->_oConfig->convertM2C($fAmountMInDef);

        $aData = array_merge($aData, [
            'currency' => [
                'code' => $sCurrency,
                'sign' => $aData['currency_sign'],
            ],
            'amountm' => $fAmountM,
            'amountc' => $fAmountC
        ]);

        $this->_oConfig->setCheckoutData([
            'seller' => $iSeller,
            'amount' => $fAmountC,
            'trial' => (int)$aData['trial'] > 0,
            'custom' => bx_process_input($aData['custom']),
            'return_data_url' => bx_process_input($aData['return_data_url']),
        ]);
        return $this->_oTemplate->getPopupSubscribe($oBuyer, $oSeller, $aData);
    }

    public function serviceGetMenuItemAddonAmount()
    {
        $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId)
            return '';

        return array(
            'unit' => $this->_oTemplate->getUnit(), 
            'value' => $this->convertC2S($this->_oDb->getProfile(array('type' => 'balance', 'id' => $iProfileId)), false)
        );
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-page_blocks Page Blocks
     * @subsubsection bx_credits-get_block_bundles get_block_bundles
     * 
     * @code bx_srv('bx_credits', 'get_block_bundles'); @endcode
     * 
     * Get page block with bundles
     * 
     * @see BxCreditsModule::serviceGetBlockBundles
     */
    /** 
     * @ref bx_credits-get_block_bundles "get_block_bundles"
     */
    public function serviceGetBlockBundles()
    {
        $mixedResult = $this->_oTemplate->getBlockBundles();

        if($this->_bIsApi)
            return [
                bx_api_get_block('bundles', $mixedResult)
            ];

        return $mixedResult;
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-page_blocks Page Blocks
     * @subsubsection bx_credits-get_block_orders_note get_block_orders_note
     * 
     * @code bx_srv('bx_credits', 'get_block_orders_note', [...]); @endcode
     * 
     * Get page block with a notice for orders usage.
     *
     * @return HTML string with block content to display on the site.
     * 
     * @see BxCreditsModule::serviceBlockLicensesNote
     */
    /** 
     * @ref bx_credits-get_block_orders_note "get_block_orders_note"
     */
    public function serviceGetBlockOrdersNote()
    {
        return MsgBox(_t('_bx_credits_page_block_content_orders_common_note'));
    }
    
    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-page_blocks Page Blocks
     * @subsubsection bx_credits-get_block_orders get_block_orders
     * 
     * @code bx_srv('bx_credits', 'get_block_orders', [...]); @endcode
     * 
     * Get page block with a list of orders purchased by currently logged member.
     *
     * @return an array describing a block to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxCreditsModule::serviceGetBlockOrders
     */
    /** 
     * @ref bx_credits-get_block_orders "get_block_orders"
     */
    public function serviceGetBlockOrders($sType = 'common') 
    {
        return $this->_getBlockOrders($sType);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-page_blocks Page Blocks
     * @subsubsection bx_credits-get_block_history get_block_history
     * 
     * @code bx_srv('bx_credits', 'get_block_history', [...]); @endcode
     * 
     * Get page block with a list of all changes with credits.
     *
     * @return an array describing a block to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxCreditsModule::serviceGetBlockHistory
     */
    /** 
     * @ref bx_credits-get_block_history "get_block_history"
     */
    public function serviceGetBlockHistory($sType = 'common') 
    {
        return $this->_getBlockHistory($sType);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-page_blocks Page Blocks
     * @subsubsection bx_credits-get_block_withdrawals get_block_withdrawals
     * 
     * @code bx_srv('bx_credits', 'get_block_withdrawals', [...]); @endcode
     * 
     * Get page block with a list of all credits withdrawals.
     *
     * @return an array describing a block to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxCreditsModule::serviceGetBlockHistory
     */
    /** 
     * @ref bx_credits-get_block_withdrawals "get_block_withdrawals"
     */
    public function serviceGetBlockWithdrawals($sType = 'common') 
    {
        if(!$this->_oConfig->isWithdraw())
            return MsgBox (_t('_bx_credits_msg_action_withdrawals_disabled'));

        return $this->_getBlockWithdrawals($sType);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-page_blocks Page Blocks
     * @subsubsection bx_credits-get_block_profiles get_block_profiles
     * 
     * @code bx_srv('bx_credits', 'get_block_profiles', [...]); @endcode
     * 
     * Get page block with a list of profiles for managing their parameters.
     *
     * @return an array describing a block to display on the site or false if there is no enough input data. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxCreditsModule::serviceGetBlockProfiles
     */
    /** 
     * @ref bx_credits-get_block_profiles "get_block_profiles"
     */
    public function serviceGetBlockProfiles($sType = 'common') 
    {
        return $this->_getBlockProfiles($sType);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-get_payment_data get_payment_data
     * 
     * @code bx_srv('bx_credits', 'get_payment_data', [...]); @endcode
     * 
     * Get an array with module's description. Is needed for payments processing module.
     * 
     * @return an array with module's description.
     * 
     * @see BxCreditsModule::serviceGetPaymentData
     */
    /** 
     * @ref bx_credits-get_payment_data "get_payment_data"
     */
    public function serviceGetPaymentData()
    {
        $CNF = &$this->_oConfig->CNF;

        $oPermalink = BxDolPermalinks::getInstance();
        return array_merge($this->_aModule, [
            'url_browse_order_common' => bx_absolute_url(bx_append_url_params($oPermalink->permalink($CNF['URL_ORDERS_COMMON']), ['filter' => '{order}'], false)),
            'url_browse_order_administration' => bx_absolute_url(bx_append_url_params($oPermalink->permalink($CNF['URL_ORDERS_ADMINISTRATION']), ['filter' => '{order}'], false))
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-add_to_cart add_to_cart
     * 
     * @code bx_srv('bx_credits', 'add_to_cart', [...]); @endcode
     * 
     * Adds an item in Shopping Cart. Is needed for payments processing module.
     * 
     * @return an array with module's description.
     * 
     * @see BxCreditsModule::serviceAddToCart
     */
    /** 
     * @ref bx_credits-add_to_cart "add_to_cart"
     */
    public function serviceAddToCart($iItemId)
    {
        $iVendor = $this->_oConfig->getAuthor();
        $oPayments = BxDolPayments::getInstance();

        $aResult = $oPayments->addToCart($iVendor, $this->_oConfig->getName(), $iItemId, 1, true);
        if(isset($aResult['code']) && (int)$aResult['code'] != 0)
            return $this->_bIsApi ? [bx_api_get_msg($aResult['message'])] : $aResult;

        return $this->_bIsApi ? [
            'url' => bx_api_get_relative_url($oPayments->getCartUrl($iVendor))
        ] : $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-get_cart_item get_cart_item
     * 
     * @code bx_srv('bx_credits', 'get_cart_item', [...]); @endcode
     * 
     * Get an array with prodict's description. Is used in Shopping Cart in payments processing module.
     * 
     * @param $iItemId product's ID.
     * @return an array with prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxCreditsModule::serviceGetCartItem
     */
    /** 
     * @ref bx_credits-get_cart_item "get_cart_item"
     */
    public function serviceGetCartItem($iItemId)
    {
    	$CNF = &$this->_oConfig->CNF;

        if(!$iItemId)
            return array();

        $aItem = $this->_oDb->getBundle(array('type' => 'id', 'id' => $iItemId));
        if(empty($aItem) || !is_array($aItem))
            return array();

        return array (
            'id' => $aItem[$CNF['FIELD_ID']],
            'author_id' => $this->_oConfig->getAuthor(),
            'name' => $aItem[$CNF['FIELD_NAME']],
            'title' => _t($aItem[$CNF['FIELD_TITLE']]),
            'description' => $this->_oConfig->getBundleDescription($aItem),
            'url' => $this->_oConfig->getBundleUrl($aItem),
            'price_single' => $aItem[$CNF['FIELD_PRICE']],
            'price_recurring' => '',
            'period_recurring' => 1,
            'period_unit_recurring' => '',
            'trial_recurring' => ''
        );
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-get_cart_items get_cart_items
     * 
     * @code bx_srv('bx_credits', 'get_cart_items', [...]); @endcode
     * 
     * Get an array with prodicts' descriptions by seller. Is used in Manual Order Processing in payments processing module.
     * 
     * @param $iSellerId seller ID.
     * @return an array with prodicts' descriptions. Empty array is returned if something is wrong or seller doesn't have any products.
     * 
     * @see BxCreditsModule::serviceGetCartItems
     */
    /** 
     * @ref bx_credits-get_cart_items "get_cart_items"
     */
    public function serviceGetCartItems($iSellerId)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iAuthorId = $this->_oConfig->getAuthor();
        if($iSellerId != $iAuthorId && !BxDolAcl::getInstance()->isMemberLevelInSet([MEMBERSHIP_ID_ADMINISTRATOR], $iSellerId))
            return array();

        $aItems = $this->_oDb->getBundle(array('type' => 'all', 'active' => 1));

        $aResult = array();
        foreach($aItems as $aItem)
            $aResult[] = array(
                'id' => $aItem[$CNF['FIELD_ID']],
                'author_id' => $iAuthorId,
                'name' => $aItem[$CNF['FIELD_NAME']],
                'title' => _t($aItem[$CNF['FIELD_TITLE']]),
                'description' => $this->_oConfig->getBundleDescription($aItem),
                'url' => $this->_oConfig->getBundleUrl($aItem),
                'price_single' => $aItem[$CNF['FIELD_PRICE']],
                'price_recurring' => '',
                'period_recurring' => 1,
                'period_unit_recurring' => '',
                'trial_recurring' => ''
            );

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-register_cart_item register_cart_item
     * 
     * @code bx_srv('bx_credits', 'register_cart_item', [...]); @endcode
     * 
     * Register a processed single time payment inside the Credits module. Is called with payment processing module after the payment was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxCreditsModule::serviceRegisterCartItem
     */
    /** 
     * @ref bx_credits-register_cart_item "register_cart_item"
     */
    public function serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_CREDITS_ORDER_TYPE_SINGLE);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-register_subscription_item register_subscription_item
     * 
     * @code bx_srv('bx_credits', 'register_subscription_item', [...]); @endcode
     * 
     * Register a processed subscription (recurring payment) inside the Credits module. Is called with payment processing module after the subscription was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with subscribed prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxCreditsModule::serviceRegisterSubscriptionItem
     */
    /** 
     * @ref bx_credits-register_subscription_item "register_subscription_item"
     */
    public function serviceRegisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_CREDITS_ORDER_TYPE_RECURRING);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-reregister_cart_item reregister_cart_item
     * 
     * @code bx_srv('bx_credits', 'reregister_cart_item', [...]); @endcode
     * 
     * Reregister a single time payment inside the Credits module. Is called with payment processing module after the payment was reregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemIdOld old item ID.
     * @param $iItemIdNew new item ID.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxCreditsModule::serviceReregisterCartItem
     */
    /** 
     * @ref bx_credits-reregister_cart_item "reregister_cart_item"
     */
    public function serviceReregisterCartItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return array();
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-reregister_subscription_item reregister_subscription_item
     * 
     * @code bx_srv('bx_credits', 'reregister_subscription_item', [...]); @endcode
     * 
     * Reregister a subscription (recurring payment) inside the Credits module. Is called with payment processing module after the subscription was reregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemIdOld old item ID.
     * @param $iItemIdNew new item ID.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with subscribed prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxCreditsModule::serviceReregisterSubscriptionItem
     */
    /** 
     * @ref bx_credits-reregister_subscription_item "reregister_subscription_item"
     */
    public function serviceReregisterSubscriptionItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return array();
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-unregister_cart_item unregister_cart_item
     * 
     * @code bx_srv('bx_credits', 'unregister_cart_item', [...]); @endcode
     * 
     * Unregister an earlier processed single time payment inside the Credits module. Is called with payment processing module after the payment was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the payment was unregistered or not.
     * 
     * @see BxCreditsModule::serviceUnregisterCartItem
     */
    /** 
     * @ref bx_credits-unregister_cart_item "unregister_cart_item"
     */
    public function serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_CREDITS_ORDER_TYPE_SINGLE);
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-unregister_subscription_item unregister_subscription_item
     * 
     * @code bx_srv('bx_credits', 'unregister_subscription_item', [...]); @endcode
     * 
     * Unregister an earlier processed subscription (recurring payment) inside the Credits module. Is called with payment processing module after the subscription was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the subscription was unregistered or not.
     * 
     * @see BxCreditsModule::serviceUnregisterSubscriptionItem
     */
    /** 
     * @ref bx_credits-unregister_subscription_item "unregister_subscription_item"
     */
    public function serviceUnregisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
    	return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_CREDITS_ORDER_TYPE_RECURRING); 
    }

    /**
     * @page service Service Calls
     * @section bx_credits Credits
     * @subsection bx_credits-payments Payments
     * @subsubsection bx_credits-cancel_subscription_item cancel_subscription_item
     * 
     * @code bx_srv('bx_credits', 'cancel_subscription_item', [...]); @endcode
     * 
     * Cancel an earlier processed subscription (recurring payment) inside the Credits module. Is called with payment processing module after the subscription was canceled there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return boolean value determining where the subscription was canceled or not.
     * 
     * @see BxCreditsModule::serviceCancelSubscriptionItem
     */
    /** 
     * @ref bx_credits-cancel_subscription_item "cancel_subscription_item"
     */
    public function serviceCancelSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
    	return true;
    }

    public function serviceGetProfileBalance($iProfileId = 0)
    {
        return $this->getProfileBalance($iProfileId);
    }

    public function serviceUpdateProfileBalance($iFirstPid, $fAmount, $iSecondPid = 0, $sOrder = '', $sInfo = '')
    {
        if(empty($sInfo))
            $sInfo = '_bx_credits_txt_history_info_service';

        return $this->updateProfileBalance($iFirstPid, $iSecondPid, $fAmount, BX_CREDITS_TRANSFER_TYPE_SERVICE, $sOrder, $sInfo);
    }
    
    public function serviceMakePayment($iBuyerPid, $fAmount, $iSellerPid, $sOrder = '')
    {
        $sInfo = '_bx_credits_txt_history_info_checkout';

        if(!$this->updateProfileBalance($iBuyerPid, $iSellerPid, -$fAmount, BX_CREDITS_TRANSFER_TYPE_CHECKOUT, $sOrder, $sInfo))
            return false;

        if(!$this->updateProfileBalance($iSellerPid, $iBuyerPid, $fAmount, $sOrder, BX_CREDITS_TRANSFER_TYPE_CHECKOUT, $sInfo)) {
            $this->updateProfileBalance($iBuyerPid, 0, $fAmount, BX_CREDITS_TRANSFER_TYPE_CANCELLATION, $sOrder, '_bx_credits_txt_history_info_cancellation');
            return false;
        }

        return true;
    }

    /**
     * Delete all content by profile 
     * @param $iProfileId profile id 
     * @return number of deleted items
     */
    public function serviceDeleteEntitiesByAuthor ($iProfileId)
    {
        $this->_oDb->deleteProfile(array('id' => $iProfileId));
        $this->_oDb->deleteHistory(array('first_pid' => $iProfileId));
    }


    /*
     * Common methods
     */
    public function convertC2S($fCredits, $bWithUnit = true)
    {
        $sResult = '';
        if($bWithUnit)
            $sResult .= $this->_oTemplate->getUnit();

        $iPrecision = $this->_oConfig->getPrecision();
        $sResult .= sprintf("%01." . $iPrecision . "f", round((float)$fCredits, $iPrecision));

        return $sResult;
    }

    public function getProfileLimits($iProfileId = 0)
    {
        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id();

        $aResults = [
            'wdw_clearing' => $this->_oConfig->getWithdrawClearing(),
            'wdw_minimum' => $this->_oConfig->getWithdrawMinimum(),
            'wdw_remaining' => $this->_oConfig->getWithdrawRemaining(),
        ];

        if(empty($iProfileId))
            return $aResults;

        $aProfile = $this->_oDb->getProfile(['type' => 'id', 'id' => $iProfileId]);

        foreach($aResults as $sKey => $mixedValue)
            if(!empty($aProfile[$sKey]))
                $aResults[$sKey] = $aProfile[$sKey];

        return $aResults;
    }

    public function getProfileBalance($iProfileId = 0)
    {
        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id();

        if(empty($iProfileId))
            return 0;

        return (float)$this->_oDb->getProfile(array('type' => 'balance', 'id' => $iProfileId));
    }

    public function getProfileBalanceCleared($iProfileId = 0)
    {
        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id();

        if(empty($iProfileId))
            return 0;

        $fCleared = (float)$this->_oDb->getHistory(['type' => 'cleared', 'profile' => $iProfileId]);
        $fSpent = (float)$this->_oDb->getHistory(['type' => 'spent', 'profile' => $iProfileId]);

        return $fCleared > $fSpent ? round($fCleared - $fSpent, 2) : 0;
    }

    public function updateProfileBalance($iFirstPid, $iSecondPid, $fAmount, $sType, $sOrder = '', $sInfo = '', $sData = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($sOrder))
            $sOrder = $this->_oConfig->getOrder();

        if(empty($sData))
            $sData = serialize(array(
                'conversion' => $this->_oConfig->getConversionRateUse(),
                'precision' => $this->_oConfig->getPrecision()
            ));

        if(!$this->_oDb->updateProfileBalance($iFirstPid, $fAmount))
            return false;

        $fAmountAbs = abs($fAmount);
        $sDirection = $fAmount > 0 ? BX_CREDITS_DIRECTION_IN : BX_CREDITS_DIRECTION_OUT;

        $iHistoryId = $this->_oDb->insertHistory([
            'first_pid' => $iFirstPid,
            'second_pid' => $iSecondPid,
            'amount' => $fAmountAbs,
            'type' => $sType,
            'direction' => $sDirection,
            'order' => $sOrder,
            'data' => $sData,
            'info' => $sInfo,
            'date' => time()
        ]);

        if(!$iHistoryId)
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_credits-update_balance 'bx_credits', 'update_balance' - hook after profile's credits balance was updated (credits were transferred from one profile to another)
         * - $unit_name - equals `bx_credits`
         * - $action - equals `update_balance`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `first_pid` - [int] first profile id
         *      - `second_pid` - [int] second profile id
         *      - `amount` - [float] amount was transferred
         *      - `type` - [string] transfer type: purchase, checkout, cancellation, grant, send, withdraw, service
         *      - `direction` - [string] transfer direction: in or out
         *      - `order` - [string] unique order number associated with the transfer
         * @hook @ref hook-bx_credits-update_balance
         */
        bx_alert($this->getName(), 'update_balance', 0, false, [
            'first_pid' => $iFirstPid,
            'second_pid' => $iSecondPid,
            'amount' => $fAmountAbs,
            'type' => $sType,
            'direction' => $sDirection,
            'order' => $sOrder,
        ]);

        $oSecondProfile = BxDolProfile::getInstanceMagic($iSecondPid);
        sendMailTemplate($CNF['ETEMPLATE_' . strtoupper($sDirection)], 0, $iFirstPid, array(
            'second_profile_name' => $oSecondProfile->getDisplayName(),
            'amount' => $fAmountAbs,
        ));

        return $iHistoryId;
    }

    public function processGrant($iUserId, $iProfileId, $fAmount, $sMessage = '')
    {
        $CNF = &$this->_oConfig->CNF;
        
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return ['code' => 2, 'msg' => '_bx_credits_err_profile_not_found'];

        $sInfo = '_bx_credits_txt_history_info_grant';
        $iHistoryId = $this->updateProfileBalance($iProfileId, 0, $fAmount, BX_CREDITS_TRANSFER_TYPE_GRANT, '', $sInfo);
        if(!$iHistoryId)
            return ['code' => 3, 'msg' => '_bx_credits_err_cannot_update_balance'];

        sendMailTemplate($CNF['ETEMPLATE_GRANTED'], 0, $iProfileId, [
            'amount' => $fAmount,
            'message' => $sMessage
        ]);

        /**
         * @hooks
         * @hookdef hook-bx_credits-granted 'bx_credits', 'granted' - hook after some amount of credits was granted to a profile
         * - $unit_name - equals `bx_credits`
         * - $action - equals `granted`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile` - [int] recipient profile id
         *      - `amount` - [float] amount was granted
         * @hook @ref hook-bx_credits-granted
         */
        bx_alert($this->getName(), 'granted', 0, false, [
            'profile' => $iProfileId,
            'amount' => $fAmount,
        ]);

        return ['code' => 0, 'id' => $iHistoryId];
    }

    public function processSend($iUserId, $iProfileId, $fAmount, $sMessage = '')
    {
        $CNF = &$this->_oConfig->CNF;

        $fAmountAvail = $this->getProfileBalance($iUserId);
        if($fAmount > $fAmountAvail)
            return ['code' => 1, 'msg' => '_bx_credits_err_low_balance'];

        $oProfile = null;
        if(!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return ['code' => 2, 'msg' => '_bx_credits_err_profile_not_found'];

        $sOrder = $this->_oConfig->getOrder();
        $sInfo = !empty($sMessage) ? $sMessage : '_bx_credits_txt_history_info_send';

        $iHistoryId = $this->updateProfileBalance($iUserId, $iProfileId, -$fAmount, BX_CREDITS_TRANSFER_TYPE_SEND, $sOrder, $sInfo);
        if(!$iHistoryId)
            return ['code' => 3, 'msg' => '_bx_credits_err_cannot_update_balance'];

        if(!$this->updateProfileBalance($iProfileId, $iUserId, $fAmount, BX_CREDITS_TRANSFER_TYPE_SEND, $sOrder, $sInfo)) {
            $sInfo = '_bx_credits_txt_history_info_cancellation';
            $iHistoryId = $this->updateProfileBalance($iUserId, 0, $fAmount, BX_CREDITS_TRANSFER_TYPE_CANCELLATION, $sOrder, $sInfo);

            return ['code' => 3, 'id' => $iHistoryId, 'msg' => '_bx_credits_err_cannot_update_balance'];
        }

        $oUser = BxDolProfile::getInstance($iUserId);
        sendMailTemplate($CNF['ETEMPLATE_RECEIVED'], 0, $iProfileId, [
            'performer_id' => $iUserId,
            'performer_name' => $oUser->getDisplayName(),
            'performer_link' => $oUser->getUrl(),
            'amount' => $fAmount,
            'order' => $sOrder,
            'message' => $sMessage
        ]);

        /**
         * @hooks
         * @hookdef hook-bx_credits-sent 'bx_credits', 'sent' - hook after some amount of credits was sent from one profile to another
         * - $unit_name - equals `bx_credits`
         * - $action - equals `sent`
         * - $object_id - not used
         * - $sender_id - sender profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `performer` - [int] sender profile id
         *      - `profile` - [int] recipient profile id
         *      - `amount` - [float] amount was sent
         *      - `order` - [string] unique order number associated with 'sent' action
         * @hook @ref hook-bx_credits-sent
         */
        bx_alert($this->getName(), 'sent', 0, $iUserId, [
            'performer' => $iUserId,
            'profile' => $iProfileId,
            'amount' => $fAmount,
            'order' => $sOrder,
        ]);

        return ['code' => 0, 'id' => $iHistoryId];
    }

    public function processWithdrawRequest($iUserId, $iProfileId, $fAmount, $sMessage = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id ();

        if(empty($iProfileId))
            return ['code' => 1, 'msg' => '_bx_credits_err_login_required'];

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return ['code' => 1, 'msg' => '_bx_credits_err_login_required'];

        $fBalanceCleared = $this->getProfileBalanceCleared($iProfileId);
        if($fAmount > $fBalanceCleared)
            return ['code' => 2, 'msg' => '_bx_credits_err_low_balance'];

        $aProfileInfo = $this->_oDb->getProfile(['type' => 'id', 'id' => $iProfileId]);

        $iWithdrawMinimum = !empty($aProfileInfo['wdw_minimum']) ? (int)$aProfileInfo['wdw_minimum'] : (int)getParam($CNF['PARAM_WITHDRAW_MINIMUM']);
        if($fAmount < $iWithdrawMinimum)
            return ['code' => 3, 'msg' => _t('_bx_credits_err_withdraw_minimum', $iWithdrawMinimum)];

        $fBalance = $this->getProfileBalance($iProfileId);
        $iWithdrawRemaining = !empty($aProfileInfo['wdw_remaining']) ? (int)$aProfileInfo['wdw_remaining'] : (int)getParam($CNF['PARAM_WITHDRAW_REMAINING']);
        if(($fBalance - $fAmount) < $iWithdrawRemaining)
            return ['code' => 4, 'msg' => _t('_bx_credits_err_withdraw_remaining', $iWithdrawRemaining)];

        $aResult = ['code' => 5, 'msg' => '_bx_credits_err_cannot_send'];

        $fRate = $this->_oConfig->getConversionRateWithdraw();

        $iId = $this->_oDb->insertWithdrawal([
            'profile_id' => $iProfileId, 
            'amount' => $fAmount,
            'rate' => $fRate,
            'message' => $sMessage,
            'added' => time()
        ]);

        if(!$iId)
            return $aResult;

        $aTemplateVars = [
            'profile_link' => $oProfile->getUrl(),
            'profile_name' => $oProfile->getDisplayName(),
            'amount' => $fAmount,
            'rate' => $fRate,
            'message' => $sMessage,
            'confirm_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_HISTORY_ADMINISTRATION']))
        ];
        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($CNF['ETEMPLATE_WITHDRAW_REQUESTED'], $aTemplateVars);
        if(!$aTemplate)
            return $aResult;

        $sEmail = $this->_oConfig->getWithdrawEmail();
        if(!sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, [], BX_EMAIL_SYSTEM))
            return $aResult;

        /**
         * @hooks
         * @hookdef hook-bx_credits-withdraw_requested 'bx_credits', 'withdraw_requested' - hook after a profile requested to withdraw some amount of credits from his balance
         * - $unit_name - equals `bx_credits`
         * - $action - equals `withdraw_requested`
         * - $object_id - not used
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile` - [int] performer profile id
         *      - `amount` - [float] amount to withdraw
         *      - `rate` - [float] withdraw conversion rate
         * @hook @ref hook-bx_credits-withdraw_requested
         */
        bx_alert($this->getName(), 'withdraw_requested', 0, $iProfileId, [
            'profile' => $iProfileId,
            'amount' => $fAmount,
            'rate' => $fRate
        ]);

        return ['code' => 0, 'id' => $iId];
    }

    public function processWithdrawCancel($iId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aWithdrawal = $this->_oDb->getWithdrawal(['type' => 'id', 'id' => $iId]);
        if(empty($aWithdrawal) || !is_array($aWithdrawal))
            return ['code' => 1, 'msg' => '_bx_credits_err_withdrawal_not_found'];

        $iProfileId = (int)$aWithdrawal['profile_id'];
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return ['code' => 2, 'msg' => '_bx_credits_err_profile_not_found'];

        $aResult = ['code' => 3, 'msg' => '_bx_credits_err_cannot_cancel_withdrawal'];       

        $aTemplateVars = [
            'profile_link' => $oProfile->getUrl(),
            'profile_name' => $oProfile->getDisplayName(),
            'amount' => $aWithdrawal['amount'],
            'manage_url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_WITHDRAWALS_ADMINISTRATION']))
        ];
        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($CNF['ETEMPLATE_WITHDRAW_CANCELED'], $aTemplateVars);
        if(!$aTemplate)
            return $aResult;

        $sEmail = $this->_oConfig->getWithdrawEmail();
        if(!sendMail($sEmail, $aTemplate['Subject'], $aTemplate['Body'], 0, [], BX_EMAIL_SYSTEM))
            return $aResult;

        if(!$this->_oDb->updateWithdrawal(['status' => BX_CREDITS_WITHDRAWAL_STATUS_CANCELED], ['id' => $iId]))
            return $aResult;

        /**
         * @hooks
         * @hookdef hook-bx_credits-withdraw_canceled 'bx_credits', 'withdraw_canceled' - hook after a profile canceled his withdrawal request
         * - $unit_name - equals `bx_credits`
         * - $action - equals `withdraw_canceled`
         * - $object_id - not used
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile` - [int] performer profile id
         *      - `amount` - [float] amount to withdraw
         *      - `rate` - [float] withdraw conversion rate
         * @hook @ref hook-bx_credits-withdraw_canceled
         */
        bx_alert($this->getName(), 'withdraw_canceled', $iId, $iProfileId, [
            'profile' => $iProfileId,
            'amount' => $aWithdrawal['amount'],
        ]);

        return ['code' => 0, 'id' => $iId];
    }

    public function processWithdrawConfirm($iUserId, $iWithdrawalId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aWithdrawal = $this->_oDb->getWithdrawal(['type' => 'id', 'id' => $iWithdrawalId]);
        if(empty($aWithdrawal) || !is_array($aWithdrawal))
            return ['code' => 1, 'msg' => '_bx_credits_err_withdrawal_not_found'];

        $iProfileId = (int)$aWithdrawal['profile_id'];
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return ['code' => 2, 'msg' => '_bx_credits_err_profile_not_found'];

        $fAmount = (float)$aWithdrawal['amount'];
        $fBalance = $this->getProfileBalance($iProfileId);
        if($fAmount > $fBalance)
            return ['code' => 3, 'msg' => '_bx_credits_err_low_balance'];

        $sInfo = '_bx_credits_txt_history_info_withdraw';
        $iHistoryId = $this->updateProfileBalance($iProfileId, 0, -$fAmount, BX_CREDITS_TRANSFER_TYPE_WITHDRAW, '', $sInfo);
        if(!$iHistoryId)
            return ['code' => 4, 'msg' => '_bx_credits_err_cannot_update_balance'];

        $aHistory = $this->_oDb->getHistory(['type' => 'id', 'id' => $iHistoryId]);
        
        if(!$this->_oDb->updateWithdrawal(['performer_id' => $iUserId, 'order' => $aHistory['order'], 'confirmed' => time(), 'status' => BX_CREDITS_WITHDRAWAL_STATUS_CONFIRMED], ['id' => $iWithdrawalId]))
            return $aResult;

        sendMailTemplate($CNF['ETEMPLATE_WITHDRAW_SENT'], 0, $iProfileId, [
            'amount' => $fAmount
        ], BX_EMAIL_SYSTEM);

        /**
         * @hooks
         * @hookdef hook-bx_credits-withdraw_sent 'bx_credits', 'withdraw_sent' - hook after the amount of credits requested to withdraw was sent
         * - $unit_name - equals `bx_credits`
         * - $action - equals `withdraw_sent`
         * - $object_id - not used
         * - $sender_id - performer profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile` - [int] performer profile id
         *      - `amount` - [float] amount to withdraw
         *      - `rate` - [float] withdraw conversion rate
         * @hook @ref hook-bx_credits-withdraw_sent
         */
        bx_alert($this->getName(), 'withdraw_sent', $iWithdrawalId, $iUserId, [
            'performer' => $iUserId,
            'profile' => $iProfileId,
            'amount' => $fAmount,
        ]);

        return ['code' => 0, 'id' => $iWithdrawalId];
    }

    public function processClearing()
    {
        $CNF = &$this->_oConfig->CNF;

        $aItems = $this->_oDb->getHistory(['type' => 'clearing', 'clearing' => $this->_oConfig->getWithdrawClearing()]);
        if(empty($aItems) || !is_array($aItems))
            return;

        $iNow = time();
        foreach($aItems as $aItem) {
            $this->_oDb->updateHistory([$CNF['FIELD_H_CLEARED'] => $iNow], [$CNF['FIELD_H_ID'] => $aItem['id']]);

            //TODO: Some action(s) related to clearing can be performed here.
        }
    }

    /*
     * Internal methods
     */
    protected function _serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aItem = $this->serviceGetCartItem($iItemId);
        if(empty($aItem) || !is_array($aItem))
            return array();

        $aBundle = $this->_oDb->getBundle(array('type' => 'id', 'id' => $iItemId));
        if(empty($aBundle) || !is_array($aBundle))
            return array();

        $iTrial = 0;
        $sDuration = '';
        $sAction = 'register';
        if($sType == BX_CREDITS_ORDER_TYPE_RECURRING && isset($CNF['FIELD_DURATION_RECURRING'], $CNF['FIELD_TRIAL_RECURRING'])) {
            $iTrial = $aBundle[$CNF['FIELD_TRIAL_RECURRING']];
            $sDuration = $aBundle[$CNF['FIELD_DURATION_RECURRING']];

            if($this->_oDb->isOrderByPbo($iClientId, $iItemId, $sOrder))
                $sAction = 'prolong';
        }

        if(!$this->_oDb->{$sAction . 'Order'}($iClientId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType, $sDuration, $iTrial))
            return array();

        $sInfo = '_bx_credits_txt_history_info_purchase';
        $fAmount = ((float)$aBundle[$CNF['FIELD_AMOUNT']] + (float)$aBundle[$CNF['FIELD_BONUS']]) * $iItemCount;
        if(!$this->updateProfileBalance($iClientId, 0, $fAmount, BX_CREDITS_TRANSFER_TYPE_PURCHASE, '', $sInfo))
            return array();

        /**
         * @hooks
         * @hookdef hook-bx_credits-order_register 'bx_credits', 'order_register' - hook after the payment for a bundle of credits was processed with payment processing module
         * - $unit_name - equals `bx_credits`
         * - $action - equals `order_register`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile_id` - [int] client (buyer) profile id
         *      - `bundle_id` - [int] bundle id
         *      - `product_id` - [int] bundle id
         *      - `count` - [int] number of items in order
         *      - `order` - [string] order number provided with payment processing module
         *      - `license` - [string] license number provided with payment processing module
         *      - `type` - [string] payment type ('single' or 'recurring'), current version supports 'single' type payments for bundles only
         *      - `duration` - [string] isn't supported
         *      - `trial` - [string] isn't supported
         * @hook @ref hook-bx_credits-order_register
         */
        /**
         * @hooks
         * @hookdef hook-bx_credits-order_prolong 'bx_credits', 'order_prolong' - hook isn't currently used because 'single' type payments for bundles are only supported
         * It's equivalent to @ref hook-bx_credits-order_register
         * @hook @ref hook-bx_credits-order_prolong
         */
        bx_alert($this->getName(), 'order_' . $sAction, 0, false, [
            'profile_id' => $iClientId,
            'bundle_id' => $iItemId,
            'product_id' => $iItemId,   //--- Alias for 'bundle_id'
            'count' => $iItemCount,
            'order' => $sOrder,
            'license' => $sLicense,
            'type' => $sType,
            'duration' => $sDuration,
            'trial' => $iTrial
        ]);

        $oClient = BxDolProfile::getInstanceMagic($iClientId);
        $oSeller = BxDolProfile::getInstanceMagic($iSellerId);
        $sSellerUrl = $oSeller->getUrl();
        $sSellerName = $oSeller->getDisplayName();

        sendMailTemplate($CNF['ETEMPLATE_PURCHASED'], 0, $iClientId, array(
            'client_name' => $oClient->getDisplayName(),
            'bundle_name' => $aBundle[$CNF['FIELD_NAME']],
            'bundle_title' => _t($aBundle[$CNF['FIELD_TITLE']]),
            'bundle_url' => $this->_oConfig->getBundleUrl($aBundle),
            'vendor_url' => $sSellerUrl,
            'vendor_name' => $sSellerName,
            'order' => $sOrder,
            'license' => $sLicense,
            'notes' => _t('_bx_credits_txt_purchased_note', $sSellerUrl, $sSellerName),
        ));

        return $aItem;
    }

    protected function _serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType)
    {
        $CNF = &$this->_oConfig->CNF;

        $aBundle = $this->_oDb->getBundle(array('type' => 'id', 'id' => $iItemId));
        if(empty($aBundle) || !is_array($aBundle))
            return false;

        if(!$this->_oDb->unregisterOrder($iClientId, $iItemId, $sOrder, $sLicense, $sType))
            return false;

        $fAmount = (float)$aBundle[$CNF['FIELD_AMOUNT']] + (float)$aBundle[$CNF['FIELD_BONUS']];
        $aProfile = $this->_oDb->getProfile(array('type' => 'id', 'id' => $iClientId));
        if(!empty($aProfile) && is_array($aProfile))
            $this->_oDb->updateProfile(array('balance' => (float)$aProfile['balance'] - $fAmount), array('id' => $aProfile['id']));

        /**
         * @hooks
         * @hookdef hook-bx_credits-order_unregister 'bx_credits', 'order_unregister' - hook after the payment for a bundle of credits was refunded with payment processing module
         * - $unit_name - equals `bx_credits`
         * - $action - equals `order_unregister`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile_id` - [int] client (buyer) profile id
         *      - `bundle_id` - [int] bundle id
         *      - `product_id` - [int] bundle id
         *      - `count` - [int] number of items in order
         *      - `order` - [string] order number provided with payment processing module
         *      - `license` - [string] license number provided with payment processing module
         *      - `type` - [string] payment type ('single' or 'recurring'), current version supports 'single' type payments for bundles only
         * @hook @ref hook-bx_credits-order_unregister
         */
        bx_alert($this->getName(), 'order_unregister', 0, false, [
            'profile_id' => $iClientId,
            'bundle_id' => $iItemId,
            'product_id' => $iItemId,   //--- Alias for 'bundle_id'
            'count' => $iItemCount,
            'order' => $sOrder,
            'license' => $sLicense,
            'type' => $sType,
        ]);

        return true;
    }

    protected function _getBlockOrders($sType) 
    {
        $CNF = &$this->_oConfig->CNF;
        
        return $this->_getBlockGrid($CNF['OBJECT_GRID_ORDERS_' . strtoupper($sType)]);
    }

    protected function _getBlockHistory($sType) 
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->_getBlockGrid($CNF['OBJECT_GRID_HISTORY_' . strtoupper($sType)]);
    }

    protected function _getBlockWithdrawals($sType) 
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->_getBlockGrid($CNF['OBJECT_GRID_WITHDRAWALS_' . strtoupper($sType)]);
    }

    protected function _getBlockProfiles($sType) 
    {
        $CNF = &$this->_oConfig->CNF;

        return $this->_getBlockGrid($CNF['OBJECT_GRID_PROFILES_' . strtoupper($sType)]);
    }

    protected function _getBlockGrid($sGrid) 
    {
        $CNF = &$this->_oConfig->CNF;

        $oGrid = null;
        if(!$sGrid || !($oGrid = BxDolGrid::getObjectInstance($sGrid)))
            return $this->_bIsApi ? [] : '';

        $sMenu = $CNF['OBJECT_MENU_MANAGE_SUBMENU'];
        return $this->_bIsApi ? [
            'content' => [bx_api_get_block('grid', $oGrid->getCodeAPI())],
            'menu' => ($oMenu = BxTemplMenu::getObjectInstance($sMenu)) ? $oMenu->getCodeAPI() : ''
        ] : [
            'content' => $oGrid->getCode(),
            'menu' => $sMenu
        ];
    }
}

/** @} */
