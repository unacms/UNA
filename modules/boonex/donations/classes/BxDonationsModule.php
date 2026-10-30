<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Donations Donations
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_DONATIONS_BTYPE_SINGLE', 'single');
define('BX_DONATIONS_BTYPE_RECURRING', 'recurring');

class BxDonationsModule extends BxBaseModGeneralModule
{
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
            $aPrice = $this->_oDb->getTypes(array('type' => 'by_id', 'value' => $iId)); 
            if(strcmp($sName, $aPrice[$CNF['FIELD_NAME']]) == 0) 
                $sResult = $sName;
        }

    	echoJson(array(
            'name' => !empty($sResult) ? $sResult : $this->_oConfig->getTypeName($sName)
    	));
    }

    public function actionMakeOther()
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isEnableOther())
            return echoJson([]);

        $sBillingType = bx_process_input(bx_get('btype'));
        $bBillingTypeRecurring = $sBillingType == BX_DONATIONS_BTYPE_RECURRING;

        $fAmount = bx_process_input(bx_get('amount'), BX_DATA_FLOAT);
    	if(empty($sBillingType) || empty($fAmount))
            return echoJson([]);

        if($fAmount < $CNF['PARAM_OTHER_PRICE_MIN'])
            return echoJson(['msg' => _t('_bx_donations_err_min_value', _t_format_currency($CNF['PARAM_OTHER_PRICE_MIN'], getParam($CNF['PARAM_AMOUNT_PRECISION'])))]);

        $iOwner = $this->_oConfig->getOwner();
        $sModule = $this->getName();
        $iTypeId = $this->_oDb->insertType(array(
            $CNF['FIELD_NAME'] => $this->_oConfig->getTypeNameCustom(),
            $CNF['FIELD_PERIOD'] => $bBillingTypeRecurring ? $CNF['PARAM_OTHER_PERIOD'] : 0,
            $CNF['FIELD_PERIOD_UNIT'] => $bBillingTypeRecurring ? $CNF['PARAM_OTHER_PERIOD_UNIT'] : '',
            $CNF['FIELD_AMOUNT'] => $fAmount,
            $CNF['FIELD_CUSTOM'] => 1
        ));

        $oPayments = BxDolPayments::getInstance();

        $aResult = array();
        switch($sBillingType) {
            case BX_DONATIONS_BTYPE_SINGLE:
                $aResultSrv = $oPayments->addToCart($iOwner, $sModule, $iTypeId, 1);
                if(!empty($aResultSrv['code']))
                    $aResult = array('msg' => isset($aResultSrv['message']) ? $aResultSrv['message'] : _t('_bx_donations_err_cannot_perform'));
                else
                    $aResult = array('redirect' => $oPayments->getCartUrl($iOwner));
                break;

            case BX_DONATIONS_BTYPE_RECURRING:
                $aResultSrv = $oPayments->subscribeWithAddons($iOwner, '', $sModule, $iTypeId, 1);
                if(!empty($aResultSrv['code']))
                    $aResult = array('msg' => isset($aResultSrv['message']) ? $aResultSrv['message'] : _t('_bx_donations_err_cannot_perform'));
                else 
                    $aResult = isset($aResultSrv['popup']) || isset($aResultSrv['redirect']) ? $aResultSrv : array('redirect' => $oPayments->getSubscriptionsUrl());
                break;
        }

        return echoJson($aResult);
    }

    /**
     * SERVICE METHODS
     */
    public function serviceGetTypesBy($aParams)
    {
    	return $this->_oDb->getTypes($aParams);
    }

    public function serviceIncludeCssJs()
    {
        return $this->_oTemplate->getIncludeCssJs();
    }

    public function serviceGetBlockMake()
    {
        return $this->_oTemplate->getBlockMake();
    }

    public function serviceGetBlockList()
    {
        return $this->_getBlockList();
    }

    public function serviceGetBlockListAll()
    {
        return $this->_getBlockList('all');
    }

    public function serviceGetPaymentData()
    {
        $CNF = &$this->_oConfig->CNF;

        $oPermalink = BxDolPermalinks::getInstance();
        return array_merge($this->_aModule, [
            'url_browse_order_common' => bx_absolute_url(bx_append_url_params($oPermalink->permalink($CNF['URL_LIST']), ['filter' => '{order}'], false)),
            'url_browse_order_administration' => bx_absolute_url(bx_append_url_params($oPermalink->permalink($CNF['URL_LIST_ALL']), ['filter' => '{order}'], false))
        ]);
    }

    public function serviceGetCartItem($mixedItemId)
    {
    	$CNF = &$this->_oConfig->CNF;

        if(!$mixedItemId)
            return [];

        $aItem = $this->_oDb->getTypes([
            'type' => 'by_' . (is_numeric($mixedItemId) ? 'id' : 'name'), 
            'value' => $mixedItemId
        ]);

        if(empty($aItem) || !is_array($aItem) || (int)$aItem['active'] == 0)
            return [];

        return [
            'id' => $aItem[$CNF['FIELD_ID']],
            'author_id' => $this->_oConfig->getOwner(),
            'name' => $aItem[$CNF['FIELD_NAME']],
            'title' => _t($this->_oConfig->isShowTitle() && !empty($aItem[$CNF['FIELD_TITLE']]) ? $aItem[$CNF['FIELD_TITLE']] : '_bx_donations_txt_cart_item_title'),
            'description' => _t('_bx_donations_txt_cart_item_description', getParam('site_title')),
            'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_MAKE'])),
            'price_single' => $aItem[$CNF['FIELD_AMOUNT']],
            'price_recurring' => $aItem[$CNF['FIELD_AMOUNT']],
            'period_recurring' => $aItem[$CNF['FIELD_PERIOD']],
            'period_unit_recurring' => $aItem[$CNF['FIELD_PERIOD_UNIT']],
            'trial_recurring' => ''
        ];
    }

    public function serviceGetCartItems($iSellerId)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iSellerId = (int)$iSellerId;
        if(empty($iSellerId))
            return array();

        $aItems = $this->_oDb->getTypes(array('type' => 'all'));
        if(empty($aItems) || !is_array($aItems))
            return array();

        $bShowTitle = $this->_oConfig->isShowTitle();

        $aResult = array();
        foreach($aItems as $aItem)
            $aResult[] = array(
                'id' => $aItem[$CNF['FIELD_ID']],
                'author_id' => $this->_oConfig->getOwner(),
                'name' => $aItem[$CNF['FIELD_NAME']],
                'title' => _t($bShowTitle && !empty($aItem[$CNF['FIELD_TITLE']]) ? $aItem[$CNF['FIELD_TITLE']] : '_bx_donations_txt_cart_item_title'),
                'description' => _t('_bx_donations_txt_cart_item_description', getParam('site_title')),
                'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_MAKE'])),
                'price_single' => $aItem[$CNF['FIELD_AMOUNT']],
                'price_recurring' => $aItem[$CNF['FIELD_AMOUNT']],
                'period_recurring' => $aItem[$CNF['FIELD_PERIOD']],
                'period_unit_recurring' => $aItem[$CNF['FIELD_PERIOD_UNIT']],
                'trial_recurring' => ''
            );

        return $aResult;
    }

    public function serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_DONATIONS_BTYPE_SINGLE);
    }

    public function serviceRegisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_DONATIONS_BTYPE_RECURRING);
    }

    public function serviceReregisterCartItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return array();
    }

    public function serviceReregisterSubscriptionItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return array();
    }

    public function serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_DONATIONS_BTYPE_SINGLE);
    }

    public function serviceUnregisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, BX_DONATIONS_BTYPE_RECURRING); 
    }

    public function serviceCancelSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
        return true;
    }

    protected function _serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aItem = $this->serviceGetCartItem($iItemId);
        if(empty($aItem) || !is_array($aItem))
            return array();

        if(!$this->_oDb->registerEntry($iClientId, $iItemId, $iItemCount, $sOrder, $sLicense))
            return array();

        /**
         * @hooks
         * @hookdef hook-bx_donations-donation_register 'bx_donations', 'donation_register' - hook after the donation payment was processed with payment processing module
         * - $unit_name - equals `bx_donations`
         * - $action - equals `donation_register`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `donation_id` - [int] donation id
         *      - `profile_id` - [int] donator profile id
         *      - `order` - [string] order number provided with payment processing module
         *      - `type` - [string] payment type ('single' or 'recurring')
         *      - `amount` - [float] donated amount
         *      - `count` - [int] number of items in order
         * @hook @ref hook-bx_donations-donation_register
         */
        bx_alert($this->getName(), 'donation_register', 0, false, [
            'donation_id' => $iItemId,
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'type' => $sType,
            'amount' => (float)$aItem['price_' . $sType],
            'count' => $iItemCount
        ]);

        $oClient = BxDolProfile::getInstanceMagic($iClientId);
        sendMailTemplate($CNF['ETEMPLATE_DONATED'], 0, $iClientId, array(
            'client_name' => $oClient->getDisplayName(),
        ));

        return $aItem;
    }

    protected function _serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense, $sType)
    {
    	if(!$this->_oDb->unregisterEntry($iClientId, $iItemId, $sOrder, $sLicense))
            return false;

        /**
         * @hooks
         * @hookdef hook-bx_donations-donation_unregister 'bx_donations', 'donation_unregister' - hook after the donation payment was refunded with payment processing module
         * It's equivalent to @ref hook-bx_donations-donation_register
         * except `amount` parameter in $extra_params is missing
         * @hook @ref hook-bx_donations-donation_unregister
         */
        bx_alert($this->getName(), 'donation_unregister', 0, false, [
            'donation_id' => $iItemId,
            'profile_id' => $iClientId,
            'order' => $sOrder,
            'type' => $sType,
            'count' => $iItemCount
        ]);

    	return true;
    }


    /*
     * INTERNAL METHODS
     */
    protected function _getBlockList($sType = '') 
    {
        $CNF = &$this->_oConfig->CNF;

        $sGrid = $CNF['OBJECT_GRID_LIST' . (!empty($sType) ? '_' . strtoupper($sType) : '')];
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return '';

        return $oGrid->getCode();
    }
}

/** @} */
