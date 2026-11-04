<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OktaConnect Okta Connect
 * @ingroup     UnaModules
 *
 * @{
 */


/**
 * This Okta connect code was created with instructions from:
 * https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/
 */
class BxOktaConModule extends BxBaseModConnectModule
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

        if (!$this->_oConfig->sClientID || !$this->_oConfig->sSecret || !$this->_oConfig->sDomain) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_oktacon_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_oktacon'), $sCode);
        } 
        else {

            // First stage of the authentication process; This is just a simple redirect (first load of this page)
            $sUrl = bx_append_url_params("https://{$this->_oConfig->sDomain}/oauth2/default/v1/authorize", [
                'state' => $this->_genToken(), // BxDolSession::getInstance()->getId(), // This at least semi-random string is likely good enough as state identifier
                'scope' => $this->_oConfig->sScope,
                'response_type' => 'code',
                'response_mode' => 'query',
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

        $s = bx_file_get_contents("https://{$this->_oConfig->sDomain}/oauth2/default/v1/token", [
            'grant_type'    => 'authorization_code',
            'client_id'     => $this->_oConfig->sClientID,
            'redirect_uri'  => $this->_oConfig->sPageHandle,
            'code'          => $sCode,
            'client_secret' => $this->_oConfig->sSecret,
        ], 'post', array ('Content-Type: application/x-www-form-urlencoded'));
        $aAuthData = $this->_decodeResponseAndHandleError($s);

        $aRemoteProfileInfo = [];

        if ($this->_oConfig->bGetUserInfoFromIdToken) {
            $aRemoteProfileInfo = json_decode(base64_decode(str_replace('_', '/', str_replace('-','+',explode('.', $aAuthData['id_token'])[1]))), true);
        }
        else {
            // get the data, especially access_token
            $sAccessToken = $aAuthData['access_token'];
            $sExpiresIn = $aAuthData['expires_in'];
            $sExpiresAt = new \DateTime('+' . $sExpiresIn . ' seconds');

            // request info about profile
            $s = bx_file_get_contents("https://{$this->_oConfig->sDomain}/oauth2/default/v1/userinfo", array(), 'get', array(
                'Accept: application/json',
                'Authorization: Bearer ' . $sAccessToken,
            ));
            $aRemoteProfileInfo = $this->_decodeResponseAndHandleError($s);
        }

	    $aRemoteProfileInfo['id'] = $aRemoteProfileInfo[$this->_oConfig->sUserIdField];
/*
        // request profile photo
        $s = bx_file_get_contents("https://graph.microsoft.com/v1.0/me/photo/", array(), 'get', array(
            'Accept: application/json',
            'Authorization: Bearer ' . $sAccessToken,
        ));
        $aUserPhoto = $this->_decodeResponseAndHandleError($s, false);

        $aRemoteProfileInfo['picture'] = $aUserPhoto;
*/
        if ($aRemoteProfileInfo) {

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
            
            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile->id(), '', true, getParam('bx_oktacon_remember_session')); // remember user
                bx_import('Custom', $this->_aModule);
                $oCustom = new BxOktaConCustom($this->_aModule);
                $oCustom->onLogin($oProfile, $aRemoteProfileInfo);
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

    function _createProfileRaw($aProfileInfo, $sAlternativeName = '', $isAutoFriends = true, $isSetLoggedIn = true) 
    {
        $mixed = parent::_createProfileRaw($aProfileInfo, $sAlternativeName, $isAutoFriends, $isSetLoggedIn);
        if (is_array($mixed) && isset($mixed['profile_id']) && (!isset($mixed['join_page_redirect']) || !$mixed['join_page_redirect'])) {
            bx_import('Custom', $this->_aModule);
            $oCustom = new BxOktaConCustom($this->_aModule);
            $oCustom->onRegister($mixed['profile_id'], $aProfileInfo);
        }

        return $mixed;
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = $aProfileInfo;
	    $sName =  !empty($aProfileInfo['name']) ? $aProfileInfo['name'] : $aProfileInfo[$this->_oConfig->sUserIdField];
        $aProfileFields['name'] = !empty($aProfileInfo['preferred_username']) ? $aProfileInfo['preferred_username'] : $sName;
        $aProfileFields['fullname'] = $sName; // !empty($aProfileInfo['given_name']) ? $aProfileInfo['given_name'] : $aProfileFields['name'];
        $aProfileFields['last_name'] = !empty($aProfileInfo['family_name']) ? ' ' . $aProfileInfo['family_name'] : '';
        $aProfileFields['email'] = isset($aProfileInfo['email']) ? $aProfileInfo['email'] : '';
        $aProfileFields['picture'] = '';
        $aProfileFields['allow_view_to'] = getParam('bx_oktacon_privacy');

        bx_import('Custom', $this->_aModule);
        $oCustom = new BxOktaConCustom($this->_aModule);
        $oCustom->onConvertRemoteFields($aProfileInfo, $aProfileFields);

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

    protected function _getExistingAccount($aProfileInfo, &$aFieldsAccount, &$aFieldsProfile)
    {
	    if ($this->_oConfig->bAddExtensionsForDuplicateEmails) {
            $i = 1;
            while (BxDolAccount::getInstance($aFieldsAccount['email'])) {
                $aFieldsAccount['email'] = preg_replace('/(.*?)(\+\d+)?@(.*?)/', '$1+' . $i . '@$3', $aFieldsAccount['email']);
                ++$i;
            } 
            return false;
	    }
	    else {
            return BxDolAccount::getInstance($aFieldsAccount['email']);
        }
    }

    protected function _isRemoteEmailVerified($aProfileInfo)
    {
        // enforced when Okta reports it
        return !isset($aProfileInfo['email_verified']) || $this->_isRemoteFlagTrue($aProfileInfo['email_verified']);
    }

    function serviceLogin($sRemoteId)
    {
        // logs in by a remote ID given by the caller, so it is for internal calls only (not for API clients)
        if (BxDolService::isExternalCall($this->getName(), 'login'))
            return false;

        $iProfileId = $this->_oDb->getProfileId($sRemoteId);
        if (!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        $bRememberMe = false;
        bx_login($oProfile->getAccountId(), $bRememberMe);
        $aRet = $this->getUserIds($oProfile);
        $aRet['session'] = BxDolSession::getInstance()->getId();
        return $aRet;
    }

    function serviceGetUserIds($sRemoteId)
    {
        // it discloses local IDs by a remote ID given by the caller, so it is for internal calls only (not for API clients)
        if (BxDolService::isExternalCall($this->getName(), 'get_user_ids'))
            return false;

        $iProfileId = $this->_oDb->getProfileId($sRemoteId);
        if (!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        return $this->getUserIds($oProfile);
    }

    protected function getUserIds($oProfile)
    {
        return [
            'account_id' => $oProfile->getAccountId(),
            'profile_id' => $oProfile->id(),
            'content_id' => $oProfile->getContentId(),
            'content_module' => $oProfile->getModule(),
        ];
    }
}

/** @} */
