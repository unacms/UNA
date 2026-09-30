<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BasePayment Base classes for Payment like modules
 * @ingroup     UnaModules
 *
 * @{
 */

interface iBxBaseModPaymentProvider
{
    public function initializeCheckout($iPendingId, $aCartInfo);
    public function finalizeCheckout(&$aData);
    public function finalizedCheckout();
}

class BxBaseModPaymentProvider extends BxDol
{
    protected $_bIsApi;

    protected $MODULE;
    protected $_oModule;

    protected $_sLangsPrefix;

    protected $_iId;
    protected $_sName;
    protected $_sCaption;
    protected $_sPrefix;

    protected $_iVendor;
    protected $_aOptions;

    protected $_bUseSsl;
    protected $_bRedirectOnResult;

    /**
     * Is needed to translate status received from Payment Provider 
     * to internal one. 
     */
    protected $_aSbsStatuses;
    
    protected $_aIncludeJs;
    protected $_aIncludeCss;

    public function __construct($aConfig)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_oModule = BxDolModule::getInstance($this->MODULE);

        $this->_sLangsPrefix = $this->_oModule->_oConfig->getPrefix('langs');

        $this->_bRedirectOnResult = false;
        $this->_bUseSsl = false;

        $this->_iId = (int)$aConfig['id'];
        $this->_sName = $aConfig['name'];
        $this->_sCaption = _t($aConfig['caption']);
        $this->_sPrefix = $aConfig['option_prefix'];

        $this->_aSbsStatuses = array();

        $this->_iVendor = 0;
        if(!empty($aConfig['vendor']))
            $this->_iVendor = (int)$aConfig['vendor'];

        $this->_aOptions = array();
        if(!empty($aConfig['options']) && is_array($aConfig['options']))
            $this->initOptions($aConfig['options']);
    }

    public function initOptions($aOptions)
    {
    	$this->_aOptions = $aOptions;

    	/*
    	 * Note: Any settings related to Vendor Options
    	 * should be initialized here.
    	 */
    }

    public function initOptionsByVendor($iVendorId)
    {
        $this->_iVendor = (int)$iVendorId;

        $aOptions = $this->_oModule->_oDb->getOptions($this->_iVendor, $this->_iId);
        if(!empty($aOptions) && is_array($aOptions))
            $this->initOptions($aOptions);
    }

    public function isActive()
    {
        return in_array($this->getOption('active'), ['on', 1]);
    }

    public function isHidden()
    {
        return is_array($this->getOption('hidden'), ['on', 1]);
    }

    public function getOption($sName)
    {
        if(substr($sName, 0, strlen($this->_sPrefix)) != $this->_sPrefix)
            $sName = $this->_sPrefix . $sName;

        return isset($this->_aOptions[$sName]) ? $this->_aOptions[$sName]['value'] : false;
    }

    public function setOption($sName, $mixedValue, $bSave = false)
    {
    	if(substr($sName, 0, strlen($this->_sPrefix)) != $this->_sPrefix)
            $sName = $this->_sPrefix . $sName;

        if(empty($this->_aOptions[$sName]) || !is_array($this->_aOptions[$sName]))
            $this->_aOptions[$sName] = array('name' => $sName, 'value' => '');

        $this->_aOptions[$sName]['value'] = $mixedValue;   

        if($bSave && !empty($this->_iVendor)) {
            $aOption = $this->_oModule->_oDb->getOption(array('type' => 'by_pid_and_name', 'provider_id' => $this->_iId, 'name' => $sName));
            if(!empty($aOption) && is_array($aOption))
                $this->_oModule->_oDb->updateOption($this->_iVendor, $aOption['id'], $mixedValue);
        }

        return true;
    }

    public function getReturnUrl($aParams = array())
    {
        return $this->_oModule->_oConfig->getUrl('URL_RETURN', $aParams, $this->_bUseSsl);
    }

    public function getReturnDataUrl($iVendorId, $aParams = array())
    {
        if($this->_bIsApi)
            return $this->_oModule->_oConfig->getUrl('URL_RETURN_DATA_API') . implode('&params[]=', [$this->_sName, $iVendorId]);

        $sUrl = $this->_oModule->_oConfig->getUrl('URL_RETURN_DATA', [], $this->_bUseSsl) . $this->_sName . '/' . $iVendorId;
        if($aParams && is_array($aParams))
            $sUrl = bx_append_url_params($sUrl, $aParams);

        return $sUrl;
    }

    public function getNotifyUrl($iVendorId, $aParams = array())
    {
    	$sUrl = $this->_oModule->_oConfig->getUrl('URL_NOTIFY', array(), $this->_bUseSsl) . $this->_sName . '/' . $iVendorId;
        return bx_append_url_params($sUrl, $aParams);
    }

    /**
     * TODO: Check whether the method is needed or not. 
     * Is used on success only.
     */
    public function needRedirect()
    {
        return $this->_bRedirectOnResult;
    }

    public function addJsCss() {}

    public function getJsObject()
    {
        return $this->_oModule->_oConfig->getJsObject($this->_sName);
    }

    public function finalizedCheckout() {}

    public function isSubscriptionStatus($sStatus, $aSubscription, $sStatusKey = 'status')
    {
        return isset($this->_aSbsStatuses[$aSubscription[$sStatusKey]]) && $this->_aSbsStatuses[$aSubscription[$sStatusKey]] == $sStatus;
    }

    public function getSubscription($iPendingId, $sCustomerId, $sSubscriptionId)
    {
        return array();
    }

    protected function getOptionsByPending($iPendingId)
    {
        $aPending = $this->_oModule->_oDb->getPending(array(
            'type' => 'id',
            'id' => (int)$iPendingId
        ));
        return $this->_oModule->_oDb->getOptions((int)$aPending['seller_id'], $this->_iId);
    }

    protected function getOptionsByVendor($iVendorId)
    {
        return $this->_oModule->_oDb->getOptions((int)$iVendorId, $this->_iId);
    }

    /**
     *
     * Writes $contents to a log file specified in the bp_options file or, if missing,
     * defaults to a standard filename of 'bplog.txt'.
     *
     * @param mixed $contents
     * @return
     * @throws Exception $e 
     *
     */
    protected function log($mixedContents, $sTitle = '', $iLevel = BX_LOG_DEBUG)
    {
        $this->_oModule->log($mixedContents, $this->_sName, $sTitle, $iLevel);
    }
}

/** @} */
