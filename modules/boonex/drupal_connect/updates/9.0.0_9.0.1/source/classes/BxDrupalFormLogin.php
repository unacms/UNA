<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxDrupalFormLogin extends BxTemplFormLogin
{
    protected $iProfileId = 0;

    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);
    }

    function isValid ()
    {
        if (!BxTemplFormView::isValid ())
            return false;
        
		$sId = trim($this->getCleanValue('ID'));
        $sPassword = $this->getCleanValue('Password');

        if ($sId != '') {
            $sErrorString = $this->checkPassword($sId, $sPassword, $this->getRole());
            $this->_setCustomError ($sErrorString);
            return $sErrorString ? false : true;
        } 
        else {
            $this->_setCustomError (_t('_sys_txt_error_occured'));
            return false;
        }
    }

    function checkPassword ($sEmail, $sPassword, $iRole = 1)
    {
        $mixedData = $this->call(array(
            'username' => $sEmail,
            'password' => $sPassword,   
        ));

        if (empty($mixedData) || !is_array($mixedData)) {
            return empty($mixedData) ? _t('_sys_txt_error_occured') : (string)$mixedData;
        }

        // find or create the local profile of this Drupal user
        $mixedProfileId = bx_srv('bx_drupal', 'handle_user', array($mixedData));
        $oProfile = is_numeric($mixedProfileId) ? BxDolProfile::getInstance((int)$mixedProfileId) : null;

        // a locked account can't sign in through Drupal either
        $sError = $oProfile ? bx_check_login_allowed($oProfile->getAccountId()) : '';
        if (!$oProfile && !$sError) {
            $sError = is_string($mixedProfileId) && $mixedProfileId !== '' ? $mixedProfileId : _t('_sys_txt_error_occured');
        }

        if ($sError === '') {
            $this->iProfileId = $oProfile->id();
        }
        return $sError;
    }

    /**
     * The local profile of the Drupal user whose password was checked, set once the form is valid.
     */
    public function getProfileId()
    {
        return $this->iProfileId;
    }
    
    function call ($aData)
    {
        $rCurl = curl_init();
        curl_setopt($rCurl, CURLOPT_URL, getParam('bx_drupal_login_url'));
        curl_setopt($rCurl, CURLOPT_POST, 1);
        curl_setopt($rCurl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($rCurl, CURLOPT_POSTFIELDS, json_encode($aData));
        curl_setopt($rCurl, CURLOPT_HEADER, FALSE);
        curl_setopt($rCurl, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($rCurl, CURLOPT_FAILONERROR, TRUE);

        $s = curl_exec($rCurl);
        $iHttpCode = curl_getinfo($rCurl, CURLINFO_HTTP_CODE);

        $mixedResult = '';
        
        // Check if login was successful
        if ($iHttpCode == 200) {
            // Convert json response as array
            $aData = @json_decode($s, TRUE);
            if (null === $aData)
                $mixedResult = _t('_bx_drupal_json_decode_failed', $mixedResult);
            else
                $mixedResult = $aData;
        }
        else {
            // Get error msg
            switch ($iHttpCode) {
            case 401:
                $mixedResult = _t('_bx_drupal_wrong_username_or_pass');
                break;
            default:                
                $mixedResult = curl_error($rCurl);
            }
        }

        return $mixedResult;
    }
}
/** @} */
