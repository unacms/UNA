<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GoogleConnect Google Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGoogleConModule extends BxBaseModConnectModule
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
        if (isLogged())
            $this->_redirect ($this -> _oConfig -> sDefaultRedirectUrl);

        if (!$this->_oConfig->sApiID || !$this->_oConfig->sApiSecret) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_googlecon_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_googlecon'), $sCode);
        } 
        else {

            // define redirect URL to the remote site                
            $sUrl = bx_append_url_params($this->_oConfig->sOauthUrl . '/auth', array(
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
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . '/oauth2/v4/token', array(
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
        $s = bx_file_get_contents($this->_oConfig->sApiUrl . '/oauth2/v1/userinfo', array(), 'get', array(
            'Authorization: Bearer ' . $sAccessToken,
        ));

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !$aResponse || isset($aResponse['error'])) {
            $sErrorDescription = isset($aResponse['error_description']) ? $aResponse['error_description'] : _t('_error occured'); 
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        $aRemoteProfileInfo = $aResponse;

        // don't use an email address which wasn't verified by Google
        if (isset($aRemoteProfileInfo['verified_email']) && !$this->_isRemoteFlagTrue($aRemoteProfileInfo['verified_email'])) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_profile_error_info')));
            return;
        }

        if ($aRemoteProfileInfo) {

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
            
            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile ->id());
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

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'Handle' => '',
        ]);
    }

    /**
     * Sign in (or join) with a Google access token which was received by a client (NEO app).
     *
     * Only the access token is taken from the request. Who the user is, is defined by Google:
     * the token is checked to be issued to one of our clients and the profile is requested from Google here.
     *
     * @param $mParams - access token as array ['access_token' => '...'] or as JSON string of such array
     */
    public function serviceHandle($mParams = [])
    {
        if(!$this->_bIsApi)
            return;

        $aError = [
            bx_api_get_msg(_t('_sys_connect_profile_error_info'))
        ];

        if(!($sAccessToken = $this->_getAccessToken($mParams)))
            return $aError;

        $aTokenInfo = $this->_requestTokenInfo($sAccessToken);
        if(!$aTokenInfo)
            return $aError;

        $aUserInfo = $this->_requestUserInfo($sAccessToken);
        if(!$aUserInfo)
            return $aError;

        $aRemoteProfileInfo = $this->_buildVerifiedProfile($aTokenInfo, $aUserInfo);
        if(!$aRemoteProfileInfo)
            return $aError;

        // check if user logged in before
        $iProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
        if($iProfileId && $oProfile = BxDolProfile::getInstance($iProfileId))
            return $this->setLogged($oProfile->id());
        else
            return $this->_createProfile($aRemoteProfileInfo);
    }

    /**
     * Ask Google about the access token: to which client it was issued, until when it is valid.
     *
     * @return array with token info or false on error
     */
    protected function _requestTokenInfo($sAccessToken)
    {
        $sHttpCode = '';
        $s = bx_file_get_contents($this->_oConfig->sTokenInfoUrl, ['access_token' => $sAccessToken], 'post', ['Content-Type: application/x-www-form-urlencoded'], $sHttpCode, [], 10);

        return $this->_decodeJsonResponse($s, $sHttpCode);
    }

    /**
     * Ask Google for the profile of the user the access token was issued for.
     *
     * @return array with profile info or false on error
     */
    protected function _requestUserInfo($sAccessToken)
    {
        $sHttpCode = '';
        $s = bx_file_get_contents($this->_oConfig->sUserInfoUrl, [], 'get', ['Authorization: Bearer ' . $sAccessToken], $sHttpCode, [], 10);

        return $this->_decodeJsonResponse($s, $sHttpCode);
    }

    /**
     * Build remote profile info from the data received from Google.
     * Returns false if the token wasn't issued to our client, expired, or if the user can't be identified reliably.
     *
     * @param $aTokenInfo - response of Google tokeninfo endpoint
     * @param $aUserInfo - response of Google userinfo endpoint
     * @return array with whitelisted profile fields or false
     */
    protected function _buildVerifiedProfile($aTokenInfo, $aUserInfo)
    {
        if(!is_array($aTokenInfo) || !is_array($aUserInfo))
            return false;

        // the token must be issued to one of our clients
        $sAudience = isset($aTokenInfo['aud']) ? $aTokenInfo['aud'] : (isset($aTokenInfo['azp']) ? $aTokenInfo['azp'] : '');
        if(!is_string($sAudience) || $sAudience === '' || !in_array($sAudience, $this->_oConfig->aClientIds, true))
            return false;

        // the token must be alive
        if(!isset($aTokenInfo['expires_in']) || !is_numeric($aTokenInfo['expires_in']) || (int)$aTokenInfo['expires_in'] <= 0)
            return false;

        // the user must be identified by the stable Google account ID
        if(empty($aUserInfo['sub']) || !is_string($aUserInfo['sub']) || !preg_match('/^[A-Za-z0-9_.-]{1,255}$/D', $aUserInfo['sub']))
            return false;
        if(isset($aTokenInfo['sub']) && $aTokenInfo['sub'] !== $aUserInfo['sub'])
            return false;

        // the email must be verified by Google
        if(empty($aUserInfo['email']) || !is_string($aUserInfo['email']) || !filter_var($aUserInfo['email'], FILTER_VALIDATE_EMAIL))
            return false;
        if(!isset($aUserInfo['email_verified']) || !$this->_isRemoteFlagTrue($aUserInfo['email_verified']))
            return false;

        $aProfileInfo = [
            'id' => $aUserInfo['sub'],
            'email' => $aUserInfo['email'],
            'verified_email' => true,
        ];
        foreach(['name', 'given_name', 'family_name'] as $sKey)
            $aProfileInfo[$sKey] = isset($aUserInfo[$sKey]) && is_string($aUserInfo[$sKey]) ? get_mb_substr($aUserInfo[$sKey], 0, 255) : '';
        $aProfileInfo['picture'] = $this->_getSafePicture(isset($aUserInfo['picture']) ? $aUserInfo['picture'] : '');

        return $aProfileInfo;
    }

    /**
     * Profile pictures are downloaded by the server, so only Google image hosts are allowed.
     */
    protected function _getSafePicture($sUrl)
    {
        if(!is_string($sUrl) || $sUrl === '' || preg_match('/[\s\x00-\x1f]/', $sUrl))
            return '';

        $aUrl = parse_url($sUrl);
        if(!is_array($aUrl) || empty($aUrl['host']) || empty($aUrl['scheme']) || !preg_match('/^https$/iD', $aUrl['scheme']))
            return '';
        if(isset($aUrl['user']) || isset($aUrl['pass']) || isset($aUrl['port']))
            return '';

        return preg_match('/^([a-z0-9-]+\.)+googleusercontent\.com$/iD', $aUrl['host']) ? $sUrl : '';
    }

    protected function _isRemoteEmailVerified($aProfileInfo)
    {
        if(isset($aProfileInfo['verified_email']))
            return $this->_isRemoteFlagTrue($aProfileInfo['verified_email']);

        return isset($aProfileInfo['email_verified']) && $this->_isRemoteFlagTrue($aProfileInfo['email_verified']);
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = $aProfileInfo;

        $aProfileFields['name'] = !empty($aProfileInfo['given_name']) ? $aProfileInfo['given_name'] : (isset($aProfileInfo['name']) ? $aProfileInfo['name'] : '');
        $aProfileFields['fullname'] = isset($aProfileInfo['name']) ? $aProfileInfo['name'] : '';
        $aProfileFields['email'] = isset($aProfileInfo['email']) ? $aProfileInfo['email'] : '';
        $aProfileFields['picture'] = $this->_getSafePicture(isset($aProfileInfo['picture']) ? $aProfileInfo['picture'] : '');
        $aProfileFields['allow_view_to'] = getParam('bx_googlecon_privacy');
        
        return $aProfileFields;
    }

}

/** @} */
