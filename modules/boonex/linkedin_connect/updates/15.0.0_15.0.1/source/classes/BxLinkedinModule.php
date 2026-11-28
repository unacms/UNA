<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    LinkedInConnect LinkedIn Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxLinkedinModule extends BxBaseModConnectModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * The settings the module needs to sign people in are filled in.
     */
    public function isConfigured()
    {
        return (bool)($this->_oConfig->sApiID && $this->_oConfig->sApiSecret);
    }
    
    /**
     * Redirect to remote site login form
     *
     * @return n/a - redirect or HTML page in case of error
     */
    function actionStart()
    {
        if (isLogged())
            $this->_redirect ($this -> _oConfig -> sDefaultRedirectUrl);

        if (!$this->isConfigured()) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_linkedin_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_linkedin'), $sCode);            
        } 
        else {

            // define redirect URL to the remote site                
            $sUrl = bx_append_url_params($this->_oConfig->sOauthUrl . '/authorization', array(
                'response_type' => 'code',
                'client_id' => $this->_oConfig->sApiID,
                'redirect_uri' => $this->_oConfig->sPageHandle,
                'scope' => $this->_oConfig->sScope,
                'state' => $this->_genToken(),
            ));
            $this->_redirect($sUrl);
        }
    }

    function actionHandle()
    {
        require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

        // check CSRF token
        if ($this->_getToken() != bx_get('state')) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_state_invalid')));
            return;
        }

        // check code
        $sCode = bx_get('code');
        if (!$sCode || bx_get('error')) {
            $sErrorDescription = bx_get('error_description') ? bx_get('error_description') : _t('_error occured');
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        // make request for token
        $s = bx_file_get_contents($this->_oConfig->sOauthUrl . '/accessToken', array(
            'client_id'     => $this->_oConfig->sApiID,
            'client_secret' => $this->_oConfig->sApiSecret,
            'grant_type'    => 'authorization_code',
            'code'          => $sCode,
            'redirect_uri'  => $this->_oConfig->sPageHandle,
        ), 'post', array ('Content-Type: application/x-www-form-urlencoded'));

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !isset($aResponse['access_token']) || isset($aResponse['error'])) {
            $sErrorDescription = isset($aResponse['error_description']) ? $aResponse['error_description'] : _t('_error occured');
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        // get the data, especially access_token
        $sAccessToken = $aResponse['access_token'];
        $sExpiresIn = $aResponse['expires_in'];
        $sExpiresAt = new \DateTime('+' . $sExpiresIn . ' seconds');

        // request info about profile
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . '/userinfo', array(), 'get', array(
            'Authorization: Bearer ' . $sAccessToken,
        ));

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !$aResponse || (isset($aResponse['status']) && ($aResponse['status'] < 200 || $aResponse['status'] > 299))) {
            $sErrorDescription = isset($aResponse['message']) ? $aResponse['message'] : _t('_error occured'); 
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        $aRemoteProfileInfo = array_merge($aResponse, ['id' => $aResponse['sub']]);

        if ($aRemoteProfileInfo) {

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
            
            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile->id());
            }             
            else {  
                // register new user
                $this->_createProfile($aRemoteProfileInfo);
            }
        } 
        else {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_profile_error_info')));
        }
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = $aProfileInfo;

        $aProfileFields['name'] = $aProfileInfo['name'];
        $aProfileFields['fullname'] = $aProfileInfo['name'];
        $aProfileFields['email'] = $aProfileInfo['email'];
        $aProfileFields['picture'] = $aProfileInfo['picture'];
        $aProfileFields['allow_view_to'] = getParam('bx_linkedin_privacy');

        return $aProfileFields;
    }

    /**
     * LinkedIn's userinfo reports whether the email address is verified.
     */
    protected function _isRemoteEmailVerified($aProfileInfo)
    {
        return isset($aProfileInfo['email_verified']) && $this->_isRemoteFlagTrue($aProfileInfo['email_verified']);
    }
}

/** @} */
