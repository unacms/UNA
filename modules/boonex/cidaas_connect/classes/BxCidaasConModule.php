<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CidaasConnect Cidaas Connect
 * @ingroup     UnaModules
 *
 * @{
 */

require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/cidaas_connect/vendor/autoload.php');

/**
 * https://github.com/cidaas/cidaas-sdk-php
 */
class BxCidaasConModule extends BxBaseModConnectModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * Redirect to remote site login form
     *
     * @return n/a - redirect or HTML page in case of error
     */
    function actionStart()
    {
        if (isset($_GET["error"])) {
            $this->_oTemplate->getPage(_t($this->_oConfig->sDefaultTitleLangKey), DesignBoxContent(_t($this->_oConfig->sDefaultTitleLangKey), MsgBox(bx_get('error'))));
            exit;
        }

        if (isLogged()) {
            $this->_redirect ($this -> _oConfig -> sDefaultRedirectUrl);
        }

        if (!$this->_oConfig->sClientID || !$this->_oConfig->sSecret) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_cidaascon_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_cidaascon'), $sCode);
        } 
        else {

            // First stage of the authentication process; This is just a simple redirect (first load of this page)
            $sUrl = bx_append_url_params("https://login.example.com/" . $this->_oConfig->sTenantID . "/oauth2/v2.0/authorize", [
                'state' => $this->_genToken(), // BxDolSession::getInstance()->getId(), // This at least semi-random string is likely good enough as state identifier
                'scope' => $this->_oConfig->sScope, // User.Read scope seems to be enough, but you can try "&scope=profile+openid+email+offline_access+User.Read" if you like
                'response_type' => 'code',
                'approval_prompt' => 'auto',
                'client_id' => $this->_oConfig->sClientID,
                'redirect_uri' => $this->_oConfig->sPageHandle,
            ]);
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

        // Verifying the received tokens
        $s = bx_file_get_contents("https://login.example.com/" . $this->_oConfig->sTenantID . "/oauth2/v2.0/token", [
            'grant_type'    => 'authorization_code',
            'client_id'     => $this->_oConfig->sClientID,
            'redirect_uri'  => $this->_oConfig->sPageHandle,
            'code'          => $sCode,
            'client_secret' => $this->_oConfig->sSecret,
        ], 'post', array ('Content-Type: application/x-www-form-urlencoded'));
        $aAuthData = $this->_decodeResponseAndHandleError($s);

        // get the data, especially access_token
        $sAccessToken = $aAuthData['access_token'];
        $sExpiresIn = $aAuthData['expires_in'];
        $sExpiresAt = new \DateTime('+' . $sExpiresIn . ' seconds');

        // request info about profile
        $s = bx_file_get_contents("https://graph.example.com/v1.0/me", array(), 'get', array(
            'Accept: application/json',
            'Authorization: Bearer ' . $sAccessToken,
        ));
        $aUserData = $this->_decodeResponseAndHandleError($s);

        // request profile photo
        $s = bx_file_get_contents("https://graph.example.com/v1.0/me/photo/", array(), 'get', array(
            'Accept: application/json',
            'Authorization: Bearer ' . $sAccessToken,
        ));
        $aUserPhoto = $this->_decodeResponseAndHandleError($s, false);

        $aRemoteProfileInfo = $aUserData;
        $aRemoteProfileInfo['picture'] = $aUserPhoto;

        if ($aRemoteProfileInfo) {

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
            
            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile ->id(), '', true, true); // remember user
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

        $a = explode('@', $aProfileInfo['userPrincipalName']);
        $sName = isset($a[0]) ? $a[0] : $aProfileInfo['userPrincipalName'];
    
        $aProfileFields['name'] = !empty($aProfileInfo['displayName']) ? $aProfileInfo['displayName'] : $sName;
        $aProfileFields['fullname'] = !empty($aProfileInfo['givenName']) ? $aProfileInfo['givenName'] : $aProfileFields['name'];
        $aProfileFields['last_name'] = !empty($aProfileInfo['surname']) ? ' ' . $aProfileInfo['surname'] : '';
        $aProfileFields['email'] = isset($aProfileInfo['mail']) ? $aProfileInfo['mail'] : $aProfileInfo['userPrincipalName'];
        $aProfileFields['picture'] = ''; // isset($aProfileInfo['picture']) ? $aProfileInfo['picture'] : '';
        $aProfileFields['allow_view_to'] = getParam('bx_cidaascon_privacy');

        return $aProfileFields;
    }

    protected function _decodeResponseAndHandleError($s, $bDisplayErrorPage = true)
    {
        if (!$s || NULL === ($aData = json_decode($s, true)) || !$aData || isset($aData['error'])) {
            if (is_array($aData['error']) && !empty($aData['error']['message']))
                $sErrorDescription = $aData['error']['message'];
            else
                $sErrorDescription = isset($aData['error_description']) ? $aData['error_description'] : _t('_error occured');
            if ($bDisplayErrorPage) {
                $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
                exit;
            }
            else {  
                return false;
            }
        }
        return $aData;
    }
}

/** @} */
