<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Xero Xero
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_XERO_ACCOUNT_CODE_SALES', 200);
define('BX_XERO_ACCOUNT_CODE_PURCHASES', 300);
define('BX_XERO_ACCOUNT_CODE_ADVERTIXING', 400);

class BxXeroModule extends BxDolModule
{
    protected $_oApi;
    protected $_oLog;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);

        bx_import('Api', $aModule);
        $this->_oApi = new BxXeroApi($this);
    }

    /**
     * ACTION METHODS
     */
    public function actionAuthorize()
    {
        $this->_requireAdmin();

        header('Location: ' . $this->_oApi->authorize());
        exit;
    }

    public function actionCallback()
    {
        $this->_requireAdmin();

        $sCode = bx_process_input(bx_get('code'));
        if($sCode === false) {
            header('Location: ' . $this->_oConfig->getAuthorizeUrl(1));
            exit();
        }

        if(($sState = bx_get('state')) === false || $sState != $this->_oConfig->getState()) {
            $this->_oConfig->unsetState();

            header('Location: ' . $this->_oConfig->getAuthorizeUrl(2));
            exit();
        }

        $sUrl = $this->_oApi->callback($sCode);
        if($sUrl === false)
            $sUrl = $this->_oConfig->getAuthorizeUrl(3);

        header('Location: ' . $sUrl);
        exit();
    }

    public function actionWebhook()
    {
        $sResponse = file_get_contents('php://input');

        $sSignatureComputed = base64_encode(hash_hmac('sha256', $sResponse, $this->_oConfig->getWebhookKey(), true));
        $sSignatureReceived = isset($_SERVER['HTTP_X_XERO_SIGNATURE']) ? $_SERVER['HTTP_X_XERO_SIGNATURE'] : '';

        if(!hash_equals($sSignatureComputed, $sSignatureReceived)) {
            bx_log($this->getName(), ":\n[Core] Get Webhook: Wrong Signature (" . $sSignatureComputed . ", " . $sSignatureReceived . ")", BX_LOG_ERR);
            http_response_code(401);
            return;
        }

        http_response_code(200);

        $aResponce = json_decode($sResponse, true);
        if(empty($aResponce) || !is_array($aResponce))
            return;

        foreach($aResponce['events'] as $aEvent) {
            $sMethod = '_process' . bx_gen_method_name(strtolower($aEvent['eventType']) . '_' . strtolower($aEvent['eventCategory']));
            if(!method_exists($this, $sMethod))
                continue;

            $this->$sMethod($aEvent['resourceId']);
        }
    }

    public function actionTest()
    {
        if(!isAdmin()) {
            echo _t('_Access denied');
            return;
        }

        $mixedResult = $this->_oApi->actionTest();
        if($mixedResult !== false)
            $mixedResult = _t('_bx_xero_txt_organization', $mixedResult);
        else 
            $mixedResult = _t('_bx_xero_txt_err_unknown');

        echo $mixedResult;
    }

    /**
     * Connecting the site to Xero and testing the connection are for admins only.
     */
    protected function _requireAdmin()
    {
        if(isAdmin())
            return;

        BxDolTemplate::getInstance()->displayAccessDenied();
        exit;
    }

    /**
     * SERVICE METHODS
     */
    public function serviceIncludeCssJs()
    {
        return $this->_oTemplate->getIncludeCssJs();
    }

    public function serviceIsContact($iProfileId, $bForceCheckApi = false)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return false;

        $sProfileEmail = $oProfile->getAccountObject()->getEmail();

        return $this->isContact($sProfileEmail, $bForceCheckApi);
    }

    public function serviceAddContact($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return false;

        $sProfileName = $oProfile->getDisplayName();
        $sProfileEmail = $oProfile->getAccountObject()->getEmail();
        return $this->_oApi->actionAddContact($iProfileId, $sProfileName, $sProfileEmail);
    }

    public function serviceAddInvoce($iProfileId, $sName, $mixedAmount, $iQuantity = 1, $mixedDueDate = false)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return false;

        $sProfileEmail = $oProfile->getAccountObject()->getEmail();
        return $this->addInvoice($sProfileEmail, $sName, $mixedAmount, $iQuantity, $mixedDueDate);
    }

    public function serviceAddInvoceAuto($iProfileId, $sName, $mixedAmount, $iQuantity = 1, $mixedDueDate = false)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return false;

        $sProfileEmail = $oProfile->getAccountObject()->getEmail();

        if(!$this->isContact($sProfileEmail)) {
            $sProfileName = $oProfile->getDisplayName();

            if($this->_oApi->actionAddContact($iProfileId, $sProfileName, $sProfileEmail) === false)
                return false;
        }

        return $this->addInvoice($sProfileEmail, $sName, $mixedAmount, $iQuantity, $mixedDueDate);
    }


    /*
     * COMMON METHODS
     */
    public function getApi()
    {
        return $this->_oApi;
    }

    public function isContact($sProfileEmail, $bForceCheckApi = false)
    {
        if(!$bForceCheckApi && $this->_oDb->isContact($sProfileEmail))
            return true;

        return $this->_oApi->actionIsContact($sProfileEmail);
    }
    
    public function addInvoice($sProfileEmail, $sName, $mixedAmount, $iQuantity, $mixedDueDate)
    {
        $CNF = &$this->_oConfig->CNF;

        $mixedInvoiceId = $this->_oApi->actionAddInvoice($sProfileEmail, $sName, $mixedAmount, $iQuantity, $mixedDueDate);
        if(!$mixedInvoiceId)
            return $mixedInvoiceId;

        if(getParam($CNF['PARAM_INVOICE_SEND']) == 'on')
            $this->_oApi->sendInvoice($mixedInvoiceId);

        return $mixedInvoiceId;
    }


    /*
     * INTERNAL METHODS
     */
    protected function _processCreateInvoice($sId) 
    {
        $oInvoice = $this->_oApi->actionGetInvoice($sId);
        $aInvoice = $this->_getInvoiceData($oInvoice);

        bx_log($this->getName(), [
            ":\n[Core] Create Invoice: " . $sId,
            $aInvoice
        ], BX_LOG_ERR);

        bx_alert($this->_oConfig->getName(), 'invoice_created', 0, 0, array(
            'id' => $sId,
            'invoice' => $aInvoice,
        ));
    }

    protected function _processUpdateInvoice($sId)
    {
        $oInvoice = $this->_oApi->actionGetInvoice($sId);
        $aInvoice = $this->_getInvoiceData($oInvoice);

        bx_log($this->getName(), [
            ":\n[Core] Update Invoice: " . $sId,
            $aInvoice
        ], BX_LOG_ERR);

        bx_alert($this->_oConfig->getName(), 'invoice_updated', 0, 0, array(
            'id' => $sId,
            'invoice' => $aInvoice,
        ));
    }

    protected function _getInvoiceData($oInvoice)
    {
        return [
            'id' => $oInvoice->getInvoiceId(),
            'number' => $oInvoice->getInvoiceNumber(),
            'reference' => $oInvoice->getReference(),
            'currency_code' => $oInvoice->getCurrencyCode(),
            'sub_total' => $oInvoice->getSubTotal(),
            'total_tax' => $oInvoice->getTotalTax(),
            'total' => $oInvoice->getTotal(),
            'amount_due' => $oInvoice->getAmountDue(),
            'amount_paid' => $oInvoice->getAmountPaid(),
            'status' => $oInvoice->getStatus(),
        ];
    }
}

/** @} */
