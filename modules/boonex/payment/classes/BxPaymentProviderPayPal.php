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
 * Usefull links related to the integration:
 * 
 * HTML Form Basics for PayPal Payments Standard
 * https://developer.paypal.com/docs/classic/paypal-payments-standard/integration-guide/formbasics/
 * 
 * HTML Variables for PayPal Payments Standard
 * https://developer.paypal.com/docs/classic/paypal-payments-standard/integration-guide/Appx_websitestandard_htmlvariables/
 * 
 */

define('PP_MODE_LIVE', 1);
define('PP_MODE_TEST', 2);

define('PP_PRC_TYPE_DIRECT', 1);
define('PP_PRC_TYPE_PDT', 2);
define('PP_PRC_TYPE_IPN', 3);

class BxPaymentProviderPayPal extends BxBaseModPaymentProvider implements iBxBaseModPaymentProvider
{
    function __construct($aConfig)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct($aConfig);
    }

    public function initializeCheckout($iPendingId, $aCartInfo, $bRecurring = false, $iRecurringDays = 0)
    {
        $iMode = (int)$this->getOption('mode');
        $sItemName = _t($this->_sLangsPrefix . 'txt_payment_to_for', $aCartInfo['vendor_name']);
        $sActionURL = $iMode == PP_MODE_LIVE ? 'https://www.paypal.com/cgi-bin/webscr' : 'https://www.sandbox.paypal.com/cgi-bin/webscr';

        if($bRecurring) {
            $aFormData = array(
                'cmd' => '_xclick-subscriptions',
                'a3' => sprintf("%.2f", (float)$aCartInfo['items_price']),
                'p3' => $iRecurringDays,
                't3' => 'D',
                'src' => '1', // repeat billings unles member cancels subscription
                'sra' => '1' // reattempt on failure
            );

            foreach($aCartInfo['items'] as $aItem)
                $sItemName .= ' ' . $aItem['title'] . ',';
		    $sItemName = trim($sItemName, ', ');
        }
        else {
            $aFormData = array(
                'cmd' => '_cart',
                'upload' => '1',
                'item_name' => $sItemName,
                'amount' => sprintf( "%.2f", (float)$aCartInfo['items_price'])
            );

            foreach($aCartInfo['items'] as $iIndex => $aItem) {
                $i = $iIndex + 1; 

                $aFormData['item_name_' . $i] = bx_process_output($aItem['title']);
			    $aFormData['quantity_' . $i] = $aItem['quantity'];
			    $aFormData['amount_' . $i] = $this->_oModule->_oConfig->getPrice(BX_PAYMENT_TYPE_SINGLE, $aItem);
            }
        }

        $aFormData = array_merge($aFormData, array(
            'business' => $iMode == PP_MODE_LIVE ? $this->getOption('business') : $this->getOption('sandbox'),
            'currency_code' => $aCartInfo['vendor_currency_code'],
            'no_note' => '1',
            'no_shipping' => '1',
            'custom' => $this->_constructCustomData($aCartInfo['vendor_id'], $iPendingId),
        	'item_name' => $sItemName,
            'item_number' => $iPendingId,
        ));

        switch($this->getOption('prc_type')) {
            case PP_PRC_TYPE_PDT:
            case PP_PRC_TYPE_DIRECT:
                $aFormData = array_merge($aFormData, array(
                    'return' => $this->getReturnDataUrl($aCartInfo['vendor_id']),
                    'rm' => '2'
                ));
                break;
            case PP_PRC_TYPE_IPN:
                $aFormData = array_merge($aFormData, array(
                    'return' => $this->getReturnUrl(),
                    'notify_url' => $this->getReturnDataUrl($aCartInfo['vendor_id']),
                    'rm' => '1'
                ));
                break;
        }

        $this->log('Initialize Checkout:', '', BX_LOG_INFO);
        $this->log($aFormData, '', BX_LOG_INFO);

        $this->_oModule->_oTemplate->displayPageCodeRedirect($sActionURL, $aFormData);
        exit;
    }

    public function finalizeCheckout(&$aData)
    {
        $aResult = $this->_registerCheckout($aData);
        if(!isset($aResult['code']) || (int)$aResult['code'] != BX_PAYMENT_RESULT_SUCCESS) {
            $this->log('Finalize Checkout: Failed', '', BX_LOG_ERR);
            $this->log($aData, '', BX_LOG_ERR);
            $this->log($aResult, '', BX_LOG_ERR);
        }

        return $aResult;
    }

    /**
     *
     * @param $aData - data from payment provider.
     * @return array with results.
     */
    protected function _registerCheckout(&$aData)
    {
        if(empty($this->_aOptions) && !empty($aData['item_number']))
            $this->_aOptions = $this->getOptionsByPending((int)$aData['item_number']);

        if(empty($this->_aOptions))
            return array('code' => 1, 'message' => $this->_sLangsPrefix . 'err_incorrect_provider');

        $iPrcType = (int)$this->getOption('prc_type');
        if((in_array($iPrcType, array(PP_PRC_TYPE_DIRECT, PP_PRC_TYPE_IPN)) && !isset($aData['txn_id'])) || ($iPrcType == PP_PRC_TYPE_PDT && !isset($aData['tx'])))
            return array('code' => 2, 'message' => $this->_sLangsPrefix . 'pp_err_no_data_given');

        $aPending = array();
        $aResult = $this->_validateCheckout($aData, $aPending);

        if(empty($aPending) || !is_array($aPending))
            return $aResult;

        if(!empty($aPending['order']) || !empty($aPending['error_code']) || !empty($aPending['error_msg']) || (int)$aPending['processed'] != 0)
            return array('code' => 11, 'message' => $this->_sLangsPrefix . 'err_already_processed');

        //--- Update pending transaction
        $this->_oModule->_oDb->updateOrderPending($aPending['id'], array(
            'order' => $aData['txn_id'],
            'error_code' => $aResult['code'],
            'error_msg' => _t($aResult['message'])
        ));

        $aResult['pending_id'] = $aPending['id'];
        $aResult['client_name'] = _t($this->_sLangsPrefix . 'txt_buyer_name_mask', bx_process_input($aData['first_name']), bx_process_input($aData['last_name'])); 
		$aResult['client_email'] = bx_process_input($aData['payer_email']);
		$aResult['paid'] = true;

        //--- The data was verified with PayPal itself (IPN/PDT), so no buyer session is needed (IPN has none).
        $aResult['verified'] = true;
        return $aResult;
    }

    protected function _validateCheckout(&$aData, &$aPending)
    {
        $iMode = (int)$this->getOption('mode');
        if($iMode == PP_MODE_LIVE) {
           $sBusiness = $this->getOption('business');
           $sConnectionUrl = 'www.paypal.com';
        } else {
            $sBusiness = $this->getOption('sandbox');
            $sConnectionUrl = 'www.sandbox.paypal.com';
        }

        $iPrcType = $this->getOption('prc_type');
        if($iPrcType == PP_PRC_TYPE_DIRECT || $iPrcType == PP_PRC_TYPE_IPN) {
            if($aData['payment_status'] != 'Completed' )
                return array('code' => 3, 'message' => $this->_sLangsPrefix . 'pp_err_not_completed');

            if($aData['business'] != $sBusiness)
                return array('code' => 4, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_business');

            $sRequest = 'cmd=_notify-validate';
            foreach($aData as $sKey => $sValue) {
                if(in_array($sKey, array('cmd', 'r')))
                    continue;

                $sRequest .= '&' . urlencode($sKey) . '=' . urlencode(bx_process_pass($sValue));
            }

            $aResponse = $this->_readValidationData($sConnectionUrl, $sRequest);
            if((int)$aResponse['code'] !== 0)
               return $aResponse;

            foreach($aResponse['content'] as $iLine => $sLine)
                $aResponse['content'][$iLine] = trim($sLine);

            if(strcmp($aResponse['content'][0], "INVALID") === 0)
                return array('code' => 6, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_transaction');
            else if(strcmp($aResponse['content'][0], "VERIFIED") !== 0)
                return array('code' => 7, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_verification_status');
        }
         else if($iPrcType == PP_PRC_TYPE_PDT) {
            $sRequest = "cmd=_notify-synch&tx=" . $aData['tx'] . "&at=" . $this->getOption('token');
            $aResponse = $this->_readValidationData($sConnectionUrl, $sRequest);

            if((int)$aResponse['code'] !== 0)
               return $aResponse;

            if(strcmp($aResponse['content'][0], "FAIL") === 0)
                return array('code' => 6, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_transaction');
            else if(strcmp($aResponse['content'][0], "SUCCESS") !== 0)
                return array('code' => 7, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_verification_status');

            $aKeys = array();
            foreach($aResponse['content'] as $sLine) 
                if(strpos($sLine, '=') !== false) {
                    list($sKey, $sValue) = explode('=', $sLine);
                    $aKeys[urldecode($sKey)] = urldecode($sValue);
                }

            $aData = array_merge($aData, $aKeys);

            if($aData['payment_status'] != 'Completed' )
                return array('code' => 3, 'message' => $this->_sLangsPrefix . 'pp_err_not_completed');

            if($aData['business'] != $sBusiness)
                return array('code' => 4, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_business');
        }

        if(empty($aData['custom']))
            return array('code' => 8, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_custom_data');

        list($iVendorId, $iPendingId) = $this->_deconstructCustomData($aData['custom']);
        if(empty($iVendorId) || empty($iPendingId))
            return array('code' => 8, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_custom_data');

        $aPending = $this->_oModule->_oDb->getOrderPending(array('type' => 'id', 'id' => $iPendingId));
        if((int)$iVendorId != (int)$aPending['seller_id'])
            return array('code' => 9, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_vendor');

        $aVendor = $this->_oModule->getVendorInfo($iVendorId);
        $fAmount = (float)$this->_getReceivedAmount($aVendor['currency_code'], $aData);
        if($fAmount != (float)$aPending['amount'])
            return array('code' => 10, 'message' => $this->_sLangsPrefix . 'pp_err_wrong_amount');

        return array('code' => BX_PAYMENT_RESULT_SUCCESS, 'message' => $this->_sLangsPrefix . 'pp_msg_verified');
    }

    protected function _readValidationData($sConnectionUrl, $sRequest)
    {
        $this->log('Validation Request: ', '', BX_LOG_INFO);
        $this->log($sRequest, '', BX_LOG_INFO);

		$rConnect = curl_init('https://' . $sConnectionUrl . '/cgi-bin/webscr');
		curl_setopt($rConnect, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
		curl_setopt($rConnect, CURLOPT_POST, 1);
		curl_setopt($rConnect, CURLOPT_RETURNTRANSFER,1);
		curl_setopt($rConnect, CURLOPT_POSTFIELDS, $sRequest);
		curl_setopt($rConnect, CURLOPT_SSL_VERIFYPEER, 1);
		curl_setopt($rConnect, CURLOPT_SSL_VERIFYHOST, 2);
		curl_setopt($rConnect, CURLOPT_FORBID_REUSE, 1);
		curl_setopt($rConnect, CURLOPT_HTTPHEADER, array('Connection: Close'));

		$sResponse = curl_exec($rConnect);
    	if(curl_errno($rConnect) == 60) { // CURLE_SSL_CACERT
            curl_setopt($rConnect, CURLOPT_CAINFO, BX_DIRECTORY_PATH_PLUGINS . 'curl/cacert/cacert.pem');
            $sResponse = curl_exec($rConnect);
        }

		if(!$sResponse) {
		    $this->log('Validation Data: ' . curl_error($rConnect), '', BX_LOG_ERR);
            $this->log($sResponse, '', BX_LOG_ERR);

			return array('code' => 5, 'message' => $this->_sLangsPrefix . 'err_cannot_validate');
		}

		$aResponse = explode("\n", $sResponse);

		$this->log('Validation Response: ', '', BX_LOG_INFO);
        $this->log($aResponse, '', BX_LOG_INFO);
		return array('code' => 0, 'content' => $aResponse);
    }

    protected function _getReceivedAmount($sCurrencyCode, &$aResultData)
    {
        $fAmount = 0.00;
        $fTax = isset($aResultData['tax']) ? (float)$aResultData['tax'] : 0.00;

        if($aResultData['mc_currency'] == $sCurrencyCode && isset($aResultData['payment_gross']) && !empty($aResultData['payment_gross']))
            $fAmount = (float)$aResultData['payment_gross'] - $fTax;
        else if($aResultData['mc_currency'] == $sCurrencyCode && isset($aResultData['mc_gross']) && !empty($aResultData['mc_gross']))
            $fAmount = (float)$aResultData['mc_gross'] - $fTax;
        else if($aResultData['settle_currency'] == $sCurrencyCode && isset($aResultData['settle_amount']) && !empty($aResultData['settle_amount']))
            $fAmount = (float)$aResultData['settle_amount'] - $fTax;

        return $fAmount;
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
}

/** @} */
