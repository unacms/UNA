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

class BxCreditsConfig extends BxBaseModGeneralConfig
{
    protected $_iAuthor;
    protected $_aCurrency;

    protected $_sCheckoutSessionKey;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = array (

            // module icon
            'ICON' => 'copyright',

            // database tables
            'TABLE_BUNDLES' => $aModule['db_prefix'] . 'bundles',
            'TABLE_ORDERS' => $aModule['db_prefix'] . 'orders',
            'TABLE_ORDERS_DELETED' => $aModule['db_prefix'] . 'orders_deleted',
            'TABLE_PROFILES' => $aModule['db_prefix'] . 'profiles',
            'TABLE_HISTORY' => $aModule['db_prefix'] . 'history',
            'TABLE_WITHDRAWALS' => $aModule['db_prefix'] . 'withdrawals',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => '',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => '',
            'FIELD_NAME' => 'name',
            'FIELD_TITLE' => 'title',
            'FIELD_DESCRIPTION' => 'description',
            'FIELD_AMOUNT' => 'amount',
            'FIELD_BONUS' => 'bonus',
            'FIELD_PRICE' => 'price',
            'FIELD_STATUS' => 'active',

            'FIELD_C_CLEARED' => 'cleared',
            'FIELD_C_AMOUNT' => 'amount',
            'FIELD_C_MESSAGE' => 'message',

            'FIELD_H_ID' => 'id',
            'FIELD_H_DIRECTION' => 'direction',
            'FIELD_H_DATE' => 'date',
            'FIELD_H_CLEARED' => 'cleared',

            // page URIs
            'URI_HOME' => 'credits-home',
            'URL_HOME' => 'page.php?i=credits-home',
            'URL_CHECKOUT' => 'page.php?i=credits-checkout',
            'URL_ORDERS_COMMON' => 'page.php?i=credits-orders',
            'URL_ORDERS_ADMINISTRATION' => 'page.php?i=credits-orders-administration',
            'URL_HISTORY_COMMON' => 'page.php?i=credits-history-common',
            'URL_HISTORY_ADMINISTRATION' => 'page.php?i=credits-history-administration',
            'URL_WITHDRAWALS_COMMON' => 'page.php?i=credits-withdrawals-common',
            'URL_WITHDRAWALS_ADMINISTRATION' => 'page.php?i=credits-withdrawals-administration',

            // some params
            'PARAM_WITHDRAW' => 'bx_credits_enable_withdraw',
            'PARAM_WITHDRAW_EMAIL' => 'bx_credits_withdraw_email',
            'PARAM_WITHDRAW_CLEARING' => 'bx_credits_withdraw_clearing',
            'PARAM_WITHDRAW_MINIMUM' => 'bx_credits_withdraw_minimum',
            'PARAM_WITHDRAW_REMAINING' => 'bx_credits_withdraw_remaining',
            'PARAM_PRECISION' => 'bx_credits_precision',
            'PARAM_CR_USE' => 'bx_credits_conversion_rate_use',
            'PARAM_CR_WITHDRAW' => 'bx_credits_conversion_rate_withdraw',
            'PARAM_PROVIDER_NAME' => 'credits',
            'PARAM_PROVIDER_ENABLE' => 'bx_credits_enable_provider',
            'PARAM_CODE' => 'bx_credits_code',
            'PARAM_ICON' => 'bx_credits_icon',

            // objects
            'OBJECT_FORM_CREDIT' => 'bx_credits_credit',
            'OBJECT_FORM_CREDIT_DISPLAY_GRANT' => 'bx_credits_credit_grant',
            'OBJECT_FORM_CREDIT_DISPLAY_SEND' => 'bx_credits_credit_send',
            'OBJECT_FORM_CREDIT_DISPLAY_WITHDRAW_REQUEST' => 'bx_credits_credit_withdraw_request',
            'OBJECT_FORM_BUNDLE' => 'bx_credits_bundle',
            'OBJECT_FORM_BUNDLE_DISPLAY_ADD' => 'bx_credits_bundle_add',
            'OBJECT_FORM_BUNDLE_DISPLAY_EDIT' => 'bx_credits_bundle_edit',
            'OBJECT_FORM_PROFILE' => 'bx_credits_profile',
            'OBJECT_FORM_PROFILE_DISPLAY_EDIT' => 'bx_credits_profile_edit',
            'OBJECT_MENU_SUBMENU' => 'bx_credits_submenu', 
            'OBJECT_MENU_MANAGE_SUBMENU' => 'bx_credits_manage_submenu',
            'OBJECT_GRID_BUNDLES' => 'bx_credits_bundles',
            'OBJECT_GRID_ORDERS_ADMINISTRATION' => 'bx_credits_orders_administration',
            'OBJECT_GRID_ORDERS_COMMON' => 'bx_credits_orders_common',
            'OBJECT_GRID_HISTORY_ADMINISTRATION' => 'bx_credits_history_administration',
            'OBJECT_GRID_HISTORY_COMMON' => 'bx_credits_history_common',
            'OBJECT_GRID_WITHDRAWALS_ADMINISTRATION' => 'bx_credits_withdrawals_administration',
            'OBJECT_GRID_WITHDRAWALS_COMMON' => 'bx_credits_withdrawals_common',
            'OBJECT_GRID_PROFILES_ADMINISTRATION' => 'bx_credits_profiles_administration',

            // email templates
            'ETEMPLATE_GRANTED' => 'bx_credits_granted',
            'ETEMPLATE_RECEIVED' => 'bx_credits_received',
            'ETEMPLATE_PURCHASED' => 'bx_credits_purchased',
            'ETEMPLATE_IN' => 'bx_credits_in',
            'ETEMPLATE_OUT' => 'bx_credits_out',
            'ETEMPLATE_WITHDRAW_REQUESTED' => 'bx_credits_withdraw_requested',
            'ETEMPLATE_WITHDRAW_CANCELED' => 'bx_credits_withdraw_canceled',
            'ETEMPLATE_WITHDRAW_SENT' => 'bx_credits_withdraw_sent',

            // some language keys
            'T' => array (
                'txt_sample_single' => '_bx_credits_txt_sample_single',
                'grant_popup' => '_bx_credits_grid_popup_title_htr_grant',
                'send_popup' => '_bx_credits_grid_popup_title_htr_send',
                'withdraw_request_popup' => '_bx_credits_grid_popup_title_wdw_withdraw_request',
            ),
        );

        $this->_aJsClasses = array_merge($this->_aJsClasses, array(
            'studio' => 'BxCreditsStudio',
            'checkout' => 'BxCreditsCheckout',
            'subscribe' => 'BxCreditsSubscribe',
            'withdraw' => 'BxCreditsWithdraw',
        ));

        $this->_aJsObjects = array_merge($this->_aJsObjects, array(
            'studio' => 'oBxCreditsStudio',
            'checkout' => 'oBxCreditsCheckout',
            'subscribe' => 'oBxCreditsSubscribe',
            'withdraw' => 'oBxCreditsWithdraw',
        ));

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array(
            'add_bundle_popup' =>  $sPrefix . '-add-bundle-popup',
            'edit_bundle_popup' =>  $sPrefix . '-edit-bundle-popup',

            'send_popup' =>  $sPrefix . '-send-popup',
            'grant_popup' =>  $sPrefix . '-grant-popup',
            'withdraw_request_popup' =>  $sPrefix . '-withdraw-request-popup',
            'withdraw_confirm_popup' =>  $sPrefix . '-withdraw-confirm-popup',
            'withdraw_field_rate' => $sPrefix . '-wff-rate',
            'withdraw_field_amount' => $sPrefix . '-wff-amount',
            'withdraw_field_result' => $sPrefix . '-wff-result',

            'edit_profile_popup' =>  $sPrefix . '-edit-profile-popup',

            'subscribe_popup' =>  $sPrefix . '-subscribe-popup',
        );

        $this->_aPrefixes = array(
            'style' => 'bx-credits',
        );

        $oPayments = BxDolPayments::getInstance();
        $this->_iAuthor = (int)$oPayments->getOption('site_admin');
        $this->_aCurrency = array(
            'code' => $oPayments->getOption('default_currency_code'),
            'sign' => $oPayments->getOption('default_currency_sign')
        );
        
        $this->_sCheckoutSessionKey = $this->_sName . '_checkout';
    }

    public function getHtmlIds($sKey = '')
    {
        if(empty($sKey))
            return $this->_aHtmlIds;

        return isset($this->_aHtmlIds[$sKey]) ? $this->_aHtmlIds[$sKey] : '';
    }

    public function getAuthor()
    {
    	return $this->_iAuthor;
    }

    public function getCurrency()
    {
    	return $this->_aCurrency;
    }

    public function isWithdraw()
    {
        return getParam($this->CNF['PARAM_WITHDRAW']) == 'on';
    }

    public function getWithdrawEmail()
    {
        $sEmail = getParam($this->CNF['PARAM_WITHDRAW_EMAIL']);
        if(empty($sEmail))
            $sEmail = getParam('site_email');

        return $sEmail;
    }

    public function getWithdrawClearing()
    {
        return (int)getParam($this->CNF['PARAM_WITHDRAW_CLEARING']);
    }

    public function getWithdrawMinimum()
    {
        return (int)getParam($this->CNF['PARAM_WITHDRAW_MINIMUM']);
    }

    public function getWithdrawRemaining()
    {
        return (int)getParam($this->CNF['PARAM_WITHDRAW_REMAINING']);
    }

    public function getTransferTypesForClearing()
    {
        return [
            BX_CREDITS_TRANSFER_TYPE_PURCHASE,
            BX_CREDITS_TRANSFER_TYPE_CHECKOUT,
            BX_CREDITS_TRANSFER_TYPE_GRANT,
            BX_CREDITS_TRANSFER_TYPE_SEND,
            BX_CREDITS_TRANSFER_TYPE_SERVICE
        ];
    }

    public function getTransferTypesForSpending()
    {
        return [
            BX_CREDITS_TRANSFER_TYPE_CHECKOUT,
            BX_CREDITS_TRANSFER_TYPE_SEND,
            BX_CREDITS_TRANSFER_TYPE_WITHDRAW,
            BX_CREDITS_TRANSFER_TYPE_SERVICE
        ];
    }

    public function getPrecision()
    {
        return (int)getParam($this->CNF['PARAM_PRECISION']);
    }

    public function getConversionRateUse()
    {
        return $this->_getConversionRate('use');
    }

    public function getConversionRateWithdraw()
    {
        return $this->_getConversionRate('withdraw');
    }

    public function getCheckoutUrl()
    {
        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink($this->CNF['URL_CHECKOUT']));
    }

    public function getBundleUrl($aBundle)
    {
        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink($this->CNF['URL_HOME']));
    }

    public function getBundleName($sName)
    {
        return uriGenerate($sName, $this->CNF['TABLE_BUNDLES'], $this->CNF['FIELD_NAME'], ['empty' => 'cat', 'divider' => '_', 'lowercase' => false]);
    }

    public function getBundleDescription($aBundle)
    {
        if(($sDsc = _t($aBundle[$this->CNF['FIELD_DESCRIPTION']]) ?: false))
            return $sDsc;

        if(($iBns = (int)$aBundle[$this->CNF['FIELD_BONUS']] ?: false))
            return _t('_bx_credits_txt_n_plus_m_for_free', $aBundle[$this->CNF['FIELD_AMOUNT']], $iBns);

        return $aBundle[$this->CNF['FIELD_AMOUNT']];
    }

    public function getCheckoutData()
    {
        return BxDolSession::getInstance()->getUnsetValue($this->_sCheckoutSessionKey);
    }

    public function setCheckoutData($aData)
    {
        return BxDolSession::getInstance()->setValue($this->_sCheckoutSessionKey, $aData);
    }

    public function getOrder($iLength = 16)
    {
        return strtoupper(genRndPwd($iLength, false));
    }

    public function constructCheckoutCustomData()
    {
        $aParams = func_get_args();
        return urlencode(base64_encode(implode('|', $aParams)));
    }

    public function deconstructCheckoutCustomData($sData)
    {
        return explode('|', base64_decode(urldecode($sData)));
    }

    /**
     * Convert Credits to Money
     */
    public function convertC2M($fCredits, $fRate = false, $iPrecision = false)
    {
        if($fRate === false)
            $fRate = $this->getConversionRateUse();
        if($iPrecision === false)
            $iPrecision = $this->getPrecision();

        return round((float)$fCredits * $fRate, $iPrecision);
    }

    /**
     * Convert Money to Credits
     */
    public function convertM2C($fMoney, $fRate = false, $iPrecision = false)
    {
        if($fRate === false)
            $fRate = $this->getConversionRateUse();
        if($iPrecision === false)
            $iPrecision = $this->getPrecision();

        return round((float)$fMoney / $fRate, $iPrecision);
    }

    /*
     * Internal methods
     */
    protected function _getConversionRate($sType)
    {
        $fRate = (float)getParam($this->CNF['PARAM_CR_' . strtoupper($sType)]);

        return $fRate > 0 && $fRate <= 1 ? $fRate : 1;
    }
}

/** @} */
