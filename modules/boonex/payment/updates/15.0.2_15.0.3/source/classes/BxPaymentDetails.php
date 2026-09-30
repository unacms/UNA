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

class BxPaymentDetails extends BxBaseModPaymentDetails
{
    protected $_bIsApi;
    protected $_sLangsPrefix;

    function __construct()
    {
        $this->MODULE = 'bx_payment';

        parent::__construct();

        $this->_bIsApi = bx_is_api();
        $this->_sLangsPrefix = $this->_oModule->_oConfig->getPrefix('langs');
    }

    /**
     * @page service Service Calls
     * @section bx_payment Payment
     * @subsection bx_payment-page_blocks Page Blocks
     * @subsubsection bx_payment-get_block_details get_block_details
     * 
     * @code bx_srv('bx_payment', 'get_block_details', [...], 'Details'); @endcode
     * 
     * Get page block with payment providers' configuration settings represented as subforms.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxPaymentDetails::serviceGetBlockDetails
     */
    /** 
     * @ref bx_payment-get_block_details "get_block_details"
     */
    public function serviceGetBlockDetails($iUserId = BX_PAYMENT_EMPTY_ID, $mixedPaymentProvider = false)
    {
        if(!$this->_oModule->isLogged())
            return ($sMsg = $this->_sLangsPrefix . 'err_required_login') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox(_t($sMsg));

        $iUserId = $iUserId != BX_PAYMENT_EMPTY_ID ? $iUserId : $this->_oModule->getProfileId();

        $aPaymentProviders = [];
        if(!$mixedPaymentProvider) {
            $aPaymentProviders = $this->_oModule->_oDb->getProviders([
                'type' => 'all', 
                'active' => true, 
                'order' => true
            ]);

            if(!empty($aPaymentProviders) && is_array($aPaymentProviders))
                $aPaymentProviders = array_keys($aPaymentProviders);
        }
        else {
            if(is_array($mixedPaymentProvider))
                $aPaymentProviders = $mixedPaymentProvider;
            else if(is_string($mixedPaymentProvider))
                $aPaymentProviders = [$mixedPaymentProvider];
        }

        if(!$aPaymentProviders)
            return ($sMsg = $this->_sLangsPrefix . 'msg_no_results') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox(_t($sMsg));

        $mixedContent = $this->_bIsApi ? [] : '';
        foreach($aPaymentProviders as $iIndex => $sPaymentProvider) {
            $mixedForm = $this->getForm($iUserId, $sPaymentProvider);

            if($this->_bIsApi)
                $mixedContent[] = bx_api_get_block('form', $mixedForm, [
                    'id' => $iIndex + 1,
                    'ext' => [
                        'name' => $mixedForm['attrs']['name'] ?? $this->MODULE,
                        'request' => ['url' => '/api.php?r=' . $this->MODULE . '/get_block_details/Details', 'immutable' => true]
                    ]
                ]);
            else
                $mixedContent .= $this->_oModule->_oTemplate->parseHtmlByName('details_form.html', [
                    'provider' => str_replace('_', '-', $sPaymentProvider),
                    'form' => $mixedForm
                ]);
        }

        if(empty($mixedContent))
            return ($sMsg = $this->_sLangsPrefix . 'msg_no_results') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox(_t($sMsg));

        return $this->_bIsApi ? $mixedContent : $mixedContent;
    }

    public function getForm($iProfileId, $sPaymentProvider)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oForm = BxTemplFormView::getObjectInstance($CNF['OBJECT_FORM_DETAILES'], $CNF['OBJECT_FORM_DETAILES_EDIT']);
        $oForm->initWithParams($iProfileId, $sPaymentProvider);
        $oForm->initChecker();
        if($oForm->isSubmitted()) {
            if($oForm->isValid()) {
                $aOptions = $this->_oModule->_oDb->getOptionsByProvider($sPaymentProvider);
                foreach($aOptions as $aOption) {
                    $sValue = ($_sValue = $oForm->getCleanValue($aOption['name'])) !== false ? $_sValue : '';
                    $this->_oModule->_oDb->updateOption($iProfileId, $aOption['id'], bx_process_input($sValue));
                }

                if(!$this->_bIsApi) {
                    header('Location: ' . bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=payment-details', ['pp' => $sPaymentProvider])));
                    return;
                }
            }
            else
                foreach($oForm->aInputs as $aInput)
                    if(!empty($aInput['error']) && !empty($aInput['attrs']['bx-data-provider'])) {
                        $sProviderBlock = 'provider_' . (int)$aInput['attrs']['bx-data-provider'] . '_begin';
                        if(!empty($oForm->aInputs[$sProviderBlock]))
                            $oForm->aInputs[$sProviderBlock]['collapsed'] = false;
                    }
        }

        return $this->_bIsApi ? $oForm->getCodeAPI() : $oForm->getCode();
    }
}

/** @} */
