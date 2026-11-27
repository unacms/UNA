<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Ads Ads
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAdsSource extends BxDol
{
    protected $_oModule;
    protected $_iProfile;
    protected $_iProfileId;

    protected $_iId;
    protected $_sName;
    protected $_sCaption;
    protected $_sPrefix;
    protected $_aOptions;

    public function __construct($iProfile, $aSource, &$oModule)
    {
        parent::__construct();

        $this->_oModule = $oModule;
        $this->_iProfile = $iProfile;

        if(empty($aSource) || !is_array($aSource) || strcmp($aSource['name'], $this->_sName) != 0)
            $this->_log("Unexpected value provided for the credentials");

        $this->_iId = (int)$aSource['id'];
        $this->_sName = $aSource['name'];
        $this->_sCaption = _t($aSource['caption']);
        $this->_sPrefix = $aSource['option_prefix'];

        $this->_aOptions = [];
        if(!empty($aSource['options']) && is_array($aSource['options']))
            $this->initOptions($aSource['options']);
    }

    public function initOptions($aOptions)
    {
    	$this->_aOptions = $aOptions;
    }

    public function initOptionsByAuthor($iProfileId)
    {
        $this->_iProfileId = (int)$iProfileId;

        $aOptions = $this->_oModule->_oDb->getSourcesOptions($this->_iProfileId, $this->_iId);
        if(!empty($aOptions) && is_array($aOptions))
            $this->initOptions($aOptions);
    }

    public function getOption($sName)
    {
    	if(substr($sName, 0, strlen($this->_sPrefix)) != $this->_sPrefix)
            $sName = $this->_sPrefix . $sName;

        return isset($this->_aOptions[$sName]) ? $this->_aOptions[$sName]['value'] : '';
    }

    public function getEntry($sId)
    {
        return [];
    }

    public function getOrders($aParams)
    {
        return [];
    }

    /**
     * Internal methods.
     */
    protected function _call($sRequest, $aParams, $sMethod = 'post-json', $aHeaders = [])
    {}

    protected function _log($sMessage, $bUseLog = false)
    {
        if($bUseLog) {
            //TODO: Use bx_log here with ERROR level
        }
        else
            throw new Exception($sMessage);

        return false;
    }    
}
