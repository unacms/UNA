<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    PaidLevels Paid Levels
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolAcl');

define('BX_ACL_LICENSE_TYPE_SINGLE', 'single'); //--- one-time payment license
define('BX_ACL_LICENSE_TYPE_RECURRING', 'recurring'); //--- recurring payment license

class BxAclModule extends BxBaseModGeneralModule
{
    /**
     * Constructor
     */
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);
    }

    /**
     * ACTION METHODS
     */
    public function actionCheckName()
    {
        $CNF = &$this->_oConfig->CNF;

    	$sName = bx_process_input(bx_get('name'));
    	if(empty($sName))
            return echoJson(array());

        $sResult = '';

        $iId = (int)bx_get('id');
        if(!empty($iId)) {
            $aPrice = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iId)); 
            if(strcmp($sName, $aPrice[$CNF['FIELD_NAME']]) == 0) 
                $sResult = $sName;
        }

    	echoJson(array(
            'name' => !empty($sResult) ? $sResult : $this->_oConfig->getPriceName($sName)
    	));
    }

    public function actionGetActionsInPopup($iLevelId)
    {
        return echoJson([
            'code' => 0,
            'popup' => [
                'html' => $this->_oTemplate->displayActionsPopup($iLevelId), 
                'options' => ['closeOnOuterClick' => true, 'removeOnClose' => true]
            ],
        ]);
    }

    public function actionGetActions($iLevelId)
    {
        if(($iGetStart = bx_get('start')) !== false)
            $iStart = (int)$iGetStart;
        if(($iGetPerPage = bx_get('per_page')) !== false)
            $iLimit = (int)$iGetPerPage;
        
        return echoJson([
            'code' => 0,
            'level_id' => $iLevelId,
            'content' => $this->_oTemplate->displayActions($iLevelId, $iStart, $iLimit),
            'eval' => $this->_oConfig->getJsObject('main').'.onGetActions(oData)'
        ]);
    }

    /**
     * SERVICE METHODS
     */

    public function serviceGetSafeServices()
    {
        return array (
            'GetViewUrl' => '',
            'GetBlockView' => '',
            'GetMembershipActions' => '',
        );
    }

	/**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-other Other
     * @subsubsection bx_acl-get_view_url get_view_url
     * 
     * @code bx_srv('bx_acl', 'get_view_url', [...]); @endcode
     * 
     * Get page URL with membership levels list.
     *
     * @return string with page URL.
     * 
     * @see BxAclModule::serviceGetViewUrl
     */
    /** 
     * @ref bx_acl-get_view_url "get_view_url"
     */
	public function serviceGetViewUrl()
    {
        $CNF = &$this->_oConfig->CNF;

    	return  bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_VIEW']));
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-page_blocks Page Blocks
     * @subsubsection bx_acl-get_block_view get_block_view
     * 
     * @code bx_srv('bx_acl', 'get_block_view', [...]); @endcode
     * 
     * Get page block with a list of available ACL levels to purchase or get for Free. List is represented as table.
     *
     * @return HTML string with a list of ACL levels to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML. On error empty string is returned.
     * 
     * @see BxAclModule::serviceGetBlockView
     */
    /** 
     * @ref bx_acl-get_block_view "get_block_view"
     */
    public function serviceGetBlockView()
    {
        if(!$this->_oConfig->isShowToUnauthenticated())
            bx_require_authentication(false, false, $this->serviceGetViewUrl());

        $sGrid = $this->_oConfig->getGridObject('view');
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        if($this->_bIsApi)
            return [
                bx_api_get_block('pricing', array_merge_recursive($oGrid->getCodeAPI(true), ['settings' => ['unit' => 'cards']]))
            ];

        $this->_oTemplate->addCss(['view.css']);
        $this->_oTemplate->addJs(['main.js']);
        return [
            'content' => $this->_oTemplate->getJsCode('main') . $oGrid->getCode()
        ];
    }

    public function serviceGetBlockActions($iLevelId, $iStart = 0, $iLimit = 0)
    {
        if(($iGetStart = bx_get('start')) !== false)
            $iStart = (int)$iGetStart;
        if(($iGetPerPage = bx_get('per_page')) !== false)
            $iLimit = (int)$iGetPerPage;

        $mixedResult = $this->_oTemplate->displayActionsBlock($iLevelId, $iStart, $iLimit);

        return !$this->_bIsApi ? $mixedResult : [
            bx_api_get_block('acl_level_actions', $mixedResult)
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-page_blocks Page Blocks
     * @subsubsection bx_acl-get_membership_actions get_membership_actions
     * 
     * @code bx_srv('bx_acl', 'get_membership_actions', [...]); @endcode
     * 
     * Get page block with a list of current membership level's actions.
     *
     * @return HTML string with a list of actions to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML. On error empty string is returned.
     * 
     * @see BxAclModule::serviceGetMembershipActions
     */
    /** 
     * @ref bx_acl-get_membership_actions "get_membership_actions"
     */
    public function serviceGetMembershipActions($iProfileId)
    {
        if($iProfileId != $this->getUserId())
            return '';

        return $this->_oTemplate->displayMembershipActions($iProfileId);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-get_payment_data get_payment_data
     * 
     * @code bx_srv('bx_acl', 'get_payment_data', [...]); @endcode
     * 
     * Get an array with module's description. Is needed for payments processing module.
     * 
     * @return an array with module's description.
     * 
     * @see BxAclModule::serviceGetPaymentData
     */
    /** 
     * @ref bx_acl-get_payment_data "get_payment_data"
     */
	public function serviceGetPaymentData()
    {
        return $this->_aModule;
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-get_cart_item get_cart_item
     * 
     * @code bx_srv('bx_acl', 'get_cart_item', [...]); @endcode
     * 
     * Get an array with level's description. Is used in Shopping Cart in payments processing module.
     * 
     * @param $mixedItemId level's ID or Unique Name.
     * @return an array with level's description. Empty array is returned if something is wrong.
     * 
     * @see BxAclModule::serviceGetCartItem
     */
    /** 
     * @ref bx_acl-get_cart_item "get_cart_item"
     */
    public function serviceGetCartItem($mixedItemId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$mixedItemId)
            return array();

        if(is_numeric($mixedItemId))
            $aItem = $this->_oDb->getPrices(array('type' => 'by_id_full', 'value' => (int)$mixedItemId));
        else 
            $aItem = $this->_oDb->getPrices(array('type' => 'by_name_full', 'value' => $mixedItemId));

        if(empty($aItem) || !is_array($aItem))
            return array();

        $sTitle = '';
        if((int)$aItem['period'] == 0)
            $sTitle = _t('_bx_acl_txt_cart_item_title_lifetime', _t($aItem['level_name']));
        else
            $sTitle = _t('_bx_acl_txt_cart_item_title', _t($aItem['level_name']), $aItem['period'], $aItem['period_unit']);

        $sDescription = _t($aItem['level_description']);
        if(empty($sDescription))
            $sDescription = _t('_bx_acl_txt_cart_item_description', getParam('site_title'));

        return array (
            'id' => $aItem['id'],
            'author_id' => $this->_oConfig->getOwner(),
            'name' => $aItem['name'],
            'title' => $sTitle,
            'description' => $sDescription,
            'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_VIEW'])),
            'price_single' => $aItem['price'],
            'price_recurring' => $aItem['price'],
            'period_recurring' => $aItem['period'],
            'period_unit_recurring' => $aItem['period_unit'],
            'trial_recurring' => $aItem['trial'],
            'added' => $aItem['added'],
        );
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-get_cart_items get_cart_items
     * 
     * @code bx_srv('bx_acl', 'get_cart_items', [...]); @endcode
     * 
     * Get an array with levels' descriptions by seller. Is used in Manual Order Processing in payments processing module.
     * 
     * @param $iSellerId seller ID.
     * @return an array with levels' descriptions. Empty array is returned if something is wrong or seller doesn't have any paid level.
     * 
     * @see BxAclModule::serviceGetCartItems
     */
    /** 
     * @ref bx_acl-get_cart_items "get_cart_items"
     */
    public function serviceGetCartItems($iSellerId)
    {
    	$CNF = &$this->_oConfig->CNF;

    	$iSellerIdSetting = $this->_oConfig->getOwner();
    	if(empty($iSellerId) || ($iSellerId != $iSellerIdSetting && !isAdmin()))
    	    return array();

        $aItems = $this->_oDb->getPrices(array('type' => 'all_full'));
        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_VIEW']));

        $aResult = array();
        foreach($aItems as $aItem) {
            $sTitle = '';
            if((int)$aItem['period'] == 0)
                $sTitle = _t('_bx_acl_txt_cart_item_title_lifetime', _t($aItem['level_name']));
            else
                $sTitle = _t('_bx_acl_txt_cart_item_title', _t($aItem['level_name']), $aItem['period'], $aItem['period_unit']);

            $sDescription = _t($aItem['level_description']);
            if(empty($sDescription))
                $sDescription = _t('_bx_acl_txt_cart_item_description', getParam('site_title'));
            
            $aResult[] = array(
                'id' => $aItem['id'],
                'author_id' => $iSellerIdSetting,
                'name' => $aItem['name'],
                'title' => $sTitle,
                'description' => $sDescription,
                'url' => $sUrl,
                'price_single' => $aItem['price'],
                'price_recurring' => $aItem['price'],
                'period_recurring' => $aItem['period'],
                'period_unit_recurring' => $aItem['period_unit'],
                'trial_recurring' => $aItem['trial']
           );
        }

        return $aResult;
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-register_cart_item register_cart_item
     * 
     * @code bx_srv('bx_acl', 'register_cart_item', [...]); @endcode
     * 
     * Register a processed single time payment inside the Paid Levels module. Is called with payment processing module after the payment was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAclModule::serviceRegisterCartItem
     */
    /** 
     * @ref bx_acl-register_cart_item "register_cart_item"
     */
    public function serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_ACL_LICENSE_TYPE_SINGLE);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-register_subscription_item register_subscription_item
     * 
     * @code bx_srv('bx_acl', 'register_subscription_item', [...]); @endcode
     * 
     * Register a processed subscription (recurring payment) inside the Paid Levels module. Is called with payment processing module after the subscription was registered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return an array with subscribed prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAclModule::serviceRegisterSubscriptionItem
     */
    /** 
     * @ref bx_acl-register_subscription_item "register_subscription_item"
     */
    public function serviceRegisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
		return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_ACL_LICENSE_TYPE_RECURRING);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-reregister_cart_item reregister_cart_item
     * 
     * @code bx_srv('bx_acl', 'reregister_cart_item', [...]); @endcode
     * 
     * Reregister a single time payment inside the Paid Levels module. Is called with payment processing module after the payment was reregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemIdOld old item ID.
     * @param $iItemIdNew new item ID.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with purchased prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAclModule::serviceReregisterCartItem
     */
    /** 
     * @ref bx_acl-reregister_cart_item "reregister_cart_item"
     */
    public function serviceReregisterCartItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return $this->_serviceReregisterItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder, BX_ACL_LICENSE_TYPE_SINGLE);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-reregister_subscription_item reregister_subscription_item
     * 
     * @code bx_srv('bx_acl', 'reregister_subscription_item', [...]); @endcode
     * 
     * Reregister a subscription (recurring payment) inside the Paid Levels module. Is called with payment processing module after the subscription was reregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemIdOld old item ID.
     * @param $iItemIdNew new item ID.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return an array with subscribed prodict's description. Empty array is returned if something is wrong.
     * 
     * @see BxAclModule::serviceReregisterSubscriptionItem
     */
    /** 
     * @ref bx_acl-reregister_subscription_item "reregister_subscription_item"
     */
    public function serviceReregisterSubscriptionItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
		return $this->_serviceReregisterItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder, BX_ACL_LICENSE_TYPE_RECURRING);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-unregister_cart_item unregister_cart_item
     * 
     * @code bx_srv('bx_acl', 'unregister_cart_item', [...]); @endcode
     * 
     * Unregister an earlier processed single time payment inside the Paid Levels module. Is called with payment processing module after the payment was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the payment was unregistered or not.
     * 
     * @see BxAclModule::serviceUnregisterCartItem
     */
    /** 
     * @ref bx_acl-unregister_cart_item "unregister_cart_item"
     */
    public function serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_ACL_LICENSE_TYPE_SINGLE);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-unregister_subscription_item unregister_subscription_item
     * 
     * @code bx_srv('bx_acl', 'unregister_subscription_item', [...]); @endcode
     * 
     * Unregister an earlier processed subscription (recurring payment) inside the Paid Levels module. Is called with payment processing module after the subscription was unregistered there.
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @param $sLicense license number genereted with payment processing module for internal usage
     * @return boolean value determining where the subscription was unregistered or not.
     * 
     * @see BxAclModule::serviceUnregisterSubscriptionItem
     */
    /** 
     * @ref bx_acl-unregister_subscription_item "unregister_subscription_item"
     */
    public function serviceUnregisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
    	return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_ACL_LICENSE_TYPE_RECURRING); 
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-payments Payments
     * @subsubsection bx_acl-cancel_subscription_item cancel_subscription_item
     * 
     * @code bx_srv('bx_acl', 'cancel_subscription_item', [...]); @endcode
     * 
     * Cancel an earlier processed subscription (recurring payment) inside the Paid Levels module. Is called with payment processing module after the subscription was canceled there.
     * Reset membership to STANDARD if subscribed membership was still in Trial mode (hasn't been paid yet).
     * 
     * @param $iClientId client ID.
     * @param $iSellerId seller ID
     * @param $iItemId item ID.
     * @param $iItemCount the number of purchased items.
     * @param $sOrder order number received from payment provider (PayPal, Stripe, etc)
     * @return boolean value determining where the subscription was canceled or not.
     * 
     * @see BxAclModule::serviceCancelSubscriptionItem
     */
    /** 
     * @ref bx_acl-cancel_subscription_item "cancel_subscription_item"
     */
    public function serviceCancelSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
        $iItemTrial = 0;
        $aItemInfo = $this->_oDb->getPrices(['type' => 'by_id', 'value' => $iItemId]);
        if(empty($aItemInfo) || !is_array($aItemInfo) || !($iItemTrial = (int)$aItemInfo['trial']))
            return false;

        $oAcl = BxDolAcl::getInstance();

        $aMembershipInfo = $oAcl->getMemberMembershipInfo($iClientId);
        if(time() - $aMembershipInfo['date_starts'] > $iItemTrial * 86400)
            return true;

        return $oAcl->setMembership($iClientId, MEMBERSHIP_ID_STANDARD);
    }

    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-other Other
     * @subsubsection bx_acl-get_prices get_prices
     * 
     * @code bx_srv('bx_acl', 'get_prices', [...]); @endcode
     * 
     * Get array of available price options for membership levels
     *
     * @param $iLevelId membership level id
     * @param $bFreeUnlimitedOnly get unlimited free pricing options only
     * @return array of levels, or empty array of there are no any pricing options avaiulable
     * 
     * @see BxAclModule::serviceGetPrices
     */
    /** 
     * @ref bx_acl-get_prices "get_prices"
     */
	public function serviceGetPrices($iLevelId = 0, $bFreeUnlimitedOnly = false)
    {
        $aParams = array(
            'type' => $iLevelId ? 'by_level_id' : 'all_full',
            'value' => $iLevelId,
        );
        $aPrices = $this->_oDb->getPrices($aParams, false);        

        return array_filter($aPrices, function ($r) use ($bFreeUnlimitedOnly) {
            return $bFreeUnlimitedOnly ? !$r['price'] && !$r['period'] : true;
        });
    }
    
    /**
     * @page service Service Calls
     * @section bx_acl Paid Levels
     * @subsection bx_acl-other Other
     * @subsubsection bx_acl-get_products_names get_products_names
     * 
     * @code bx_srv('bx_acl', 'get_products_names', [...]); @endcode
     * 
     * Get an array of products names.
     * 
     * @param $iVendorId return products of 1 vendor only
     * @param $iLimit limit the result artay
     * @return an array of products names
     * 
     * @see BxAclModule::serviceGetProductsNames
     */
    /** 
     * @ref bx_acl-get_products_names "get_products_names"
     */
	public function serviceGetProductsNames($iVendorId = 0, $iLimit = 1000)
    {
    	return $this->_oDb->getProductsNames($iVendorId, $iLimit);
    }

    protected function _serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aItem = $this->serviceGetCartItem($iItemId);
        if(empty($aItem) || !is_array($aItem))
            return [];

        $oAcl = BxDolAcl::getInstance();

        $aItemInfo = $this->_oDb->getPrices(['type' => 'by_id', 'value' => $iItemId]);
        $aMembershipInfo = $oAcl->getMemberMembershipInfo($iClientId);

        $aPeriod = ['period' => (int)$aItemInfo['period'], 'period_unit' => $aItemInfo['period_unit']];
        if($sType == BX_ACL_LICENSE_TYPE_RECURRING && (int)$aItemInfo['trial'] > 0 && (int)$aItemInfo['level_id'] != (int)$aMembershipInfo['id'])
            $aPeriod = ['period' => (int)$aItemInfo['trial'], 'period_unit' => 'day', 'period_trial' => true];

        $iReserve = (int)getParam($CNF['PARAM_RECURRING_RESERVE']);
        if(!empty($iReserve))
            $aPeriod['period_reserve'] = $iReserve;

        $bImmediate = (int)$aItemInfo['immediate'] != 0;
        if(!$oAcl->setMembership($iClientId, $aItemInfo['level_id'], $aPeriod, $bImmediate, $sLicense))
            return [];

        $this->_oDb->insertLicense([
            'profile_id' => $iClientId,
            'price_id' => $iItemId,
            'type' => $sType,
            'order' => $sOrder,
            'license' => $sLicense,
            'added' => time()
        ]);

        if($bImmediate)
            $this->cancelSubscription($iClientId, $aMembershipInfo, $sOrder);

        return $aItem;
    }

    protected function _serviceReregisterItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder, $sType)
    {
        $aItemNew = $this->serviceGetCartItem($iItemIdNew);
        if(empty($aItemNew) || !is_array($aItemNew))
			return array();

        /*
         * Note. Membership level cannot be reregistered immediately.
         * it will be automatically changed in the end of current period.
         */
    	return $aItemNew;
    }

    protected function _serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType)
    {
    	$aItemInfo = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iItemId));
    	if(empty($aItemInfo) || !is_array($aItemInfo))
			return false;

    	return BxDolAcl::getInstance()->unsetMembership($iClientId, $aItemInfo['level_id'], $sLicense);
    }

    /**
     * COMMON METHODS
     */
	public function getUserId()
    {
        return isLogged() ? bx_get_logged_profile_id() : 0;
    }

    public function getUserInfo($iUserId = 0)
    {
        $oProfile = BxDolProfile::getInstance($iUserId);
        if (!$oProfile)
            $oProfile = BxDolProfileUndefined::getInstance();

        return array(
            $oProfile->getDisplayName(),
            $oProfile->getUrl(),
            $oProfile->getThumb(),
            $oProfile->getUnit()
        );
    }

    public function cancelSubscription($iUserId, $aMembership = [], $sOrder = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$aMembership || !is_array($aMembership))
            $aMembership = BxDolAcl::getInstance()->getMemberMembershipInfo($iUserId);

        $sLicense = '';
        if(!$aMembership || !is_array($aMembership) || !($sLicense = $aMembership['transaction_id'] ?? false))
            return;

        $oPayments = BxDolPayments::getInstance();

        $aLicense = $this->_oDb->getLicenses([
            'type' => 'by_license', 
            'license' => $sLicense
        ]);

        $sOrderDb = '';
        if(!$aLicense || !is_array($aLicense)) {
            $aOrders = $oPayments->getOrdersInfo(['license' => $sLicense]);
            if($aOrders && is_array($aOrders)) {
                $aOrder = reset($aOrders);

                $aPendings = $oPayments->getPendingOrdersInfo(['id' => $aOrder['pending_id']]);
                if($aPendings && is_array($aPendings)) {
                    $aPending = reset($aPendings);
                    if($aPending['type'] == BX_ACL_LICENSE_TYPE_RECURRING)
                        $sOrderDb = $aPending['order'];
                }
            }    
        }
        else if($aLicense['type'] == BX_ACL_LICENSE_TYPE_RECURRING)
            $sOrderDb = $aLicense['order'];

        if($sOrderDb && (!$sOrder || $sOrder != $sOrderDb) && (($aResult = $oPayments->cancelSubscription($sOrderDb)) === false || (int)$aResult['code'] != 0))
            sendMailTemplate($CNF['ETEMPLATE_SBS_CANCEL_REQUIRED'], 0, $iUserId, [
                'level' => _t($aMembership['name']),
                'order' => $sOrderDb,
                'date_starts' => $this->_oConfig->formatDate($aMembership['date_starts']),
                'date_expires' => $this->_oConfig->formatDate($aMembership['date_expires']),
            ], BX_EMAIL_NOTIFY, true);
    }
}

/** @} */
