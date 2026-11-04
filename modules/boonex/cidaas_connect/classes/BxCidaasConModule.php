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

use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\Exception\ClientException;

/**
 * Login via the official Cidaas PHP SDK hosted login page.
 * @see https://github.com/cidaas/cidaas-sdk-php
 */
class BxCidaasConModule extends BxBaseModConnectModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

	public function actionLogout()
	{
		if (!isLogged())
			return;

        echo "TODO: logout";
    }

	/**
	 * This service need to be called when we call logout from UNA,
	 * so it will propagate logout to IDP
	 * Other words: logout in UNA, IDP and all other SP
	 */
	public function serviceLogout()
	{
		if (!isLogged() || bx_is_api() || !$this->_oConfig->sBaseUrl)
			return;

        $sAccessToken = BxDolSession::getInstance()->getValue('cidaascon_access_token');
        $sIdToken = BxDolSession::getInstance()->getValue('cidaascon_id_token');
		if (!$sAccessToken && !$sIdToken)
			return;

		$aParams = [];
		if ($this->_oConfig->sClientID)
			$aParams['client_id'] = $this->_oConfig->sClientID;

		$sEndSession = $this->_oConfig->sBaseUrl . '/session/end_session';
		if ($aParams)
			$sEndSession .= '?' . http_build_query($aParams);

		bx_logout(false);

		require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

		$sIframe = '<iframe src="' . bx_html_attribute($sEndSession) . '" width="0" height="0" style="display:none;visibility:hidden"></iframe>';
		$sJs = '<script>setTimeout(function () { window.location.href = ' . json_encode(BX_DOL_URL_ROOT) . '; }, 3000);</script>';

		$oTemplate = BxDolTemplate::getInstance();
		$oTemplate->setPageNameIndex(BX_PAGE_TRANSITION);
		$oTemplate->setPageHeader(_t('_Please Wait'));
		$oTemplate->setPageContent('page_main_code', MsgBox(_t('_Please Wait')) . $sIframe . $sJs);
		// Keep the 1s meta-refresh on this page from navigating away before the iframe request is sent.
		$oTemplate->setPageContent('url_relocate', '');
		send_headers_page_changed();
		$oTemplate->getPageCode();
		exit;

        /*
        $sAccessToken = BxDolSession::getInstance()->getUnsetValue('cidaascon_access_token');
        $sIdToken = BxDolSession::getInstance()->getUnsetValue('cidaascon_id_token');
        if (!$sAccessToken)
            return;

        try {
            $this->_getProvider()->logout($sAccessToken)->wait();
        } catch (Exception $oException) {
            bx_log('bx_cidaas', $this->_getExceptionMessage($oException));
        }
        */
	}

    /**
     * Redirect to Cidaas hosted login page.
     *
     * @return n/a - redirect or HTML page in case of error
     */
    function actionStart()
    {
        if (isset($_GET['error'])) {
            $this->_oTemplate->getPage(_t($this->_oConfig->sDefaultTitleLangKey), DesignBoxContent(_t($this->_oConfig->sDefaultTitleLangKey), MsgBox(bx_get('error'))));
            exit;
        }

        if (isLogged()) {
            $this->_redirect($this->_oConfig->sDefaultRedirectUrl);
        }

        if (!$this->_oConfig->sBaseUrl || !$this->_oConfig->sClientID || (!$this->_oConfig->bPkce && !$this->_oConfig->sSecret)) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode = MsgBox(_t('_bx_cidaascon_profile_error_api_keys'));
            $this->_oTemplate->getPage(_t('_bx_cidaascon'), $sCode);
            return;
        }

        try {
            $this->_getProvider()->loginWithBrowser($this->_oConfig->sScope, [
                'state' => $this->_genToken(),
            ], $this->_oConfig->bPkce);
        } catch (Exception $oException) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($this->_getExceptionMessage($oException)));
            return;
        }

        // SDK stores the PKCE verifier in PHP $_SESSION; persist it in UNA session for the callback.
        if ($this->_oConfig->bPkce && !empty($_SESSION['code-verifier']))
            BxDolSession::getInstance()->setValue($this->_oConfig->sSessionCodeVerifier, $_SESSION['code-verifier']);

        exit;
    }

    /**
     * $aAuthData = [
     *    [access_token] => eyJhbGciOiJSUz...
     *    [id_token] => eyJhbGciOiJS...
     *    [state] => TkkLRS6wp4ukNyEzPhZi
     *    [expires_in] => 86400
     *    [id_token_expires_in] => 86400
     *    [token_type] => Bearer
     *    [sub] => 21xxxxxx-9da8-4fd9-ad14-e5f3c615f55a
     *    [sid] => c5xxxxxx-a54a-403e-b237-99c728059cc6
     *    [identity_id] => 74e3bf36-d1d7-4e4c-a95b-5822abfc6b97
     * ]
     * @return void
     */
    function actionHandle()
    {
        require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

        try {
            $oProvider = $this->_getProvider();
        } catch (Exception $oException) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($this->_getExceptionMessage($oException)));
            return;
        }

        $aParameters = $oProvider->loginCallback();

        if ($this->_getToken() != ($aParameters['state'] ?? '')) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_state_invalid')));
            return;
        }

        $sCode = $aParameters['code'] ?? '';
        if (!$sCode || !empty($aParameters['error'])) {
            $sErrorDescription = !empty($aParameters['error_description']) ? $aParameters['error_description'] : (!empty($aParameters['error']) ? $aParameters['error'] : _t('_error occured'));
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        if ($this->_oConfig->bPkce) {
            $sCodeVerifier = BxDolSession::getInstance()->getUnsetValue($this->_oConfig->sSessionCodeVerifier);
            if ($sCodeVerifier)
                $_SESSION['code-verifier'] = $sCodeVerifier;
        }

        try {
            $aAuthData = $oProvider->getAccessToken(GrantType::AuthorizationCode, $sCode, '', $this->_oConfig->bPkce)->wait();
            // echoDbgLog($aAuthData);
            if (empty($aAuthData['access_token'])) {
                $sErrorDescription = isset($aAuthData['error_description']) ? $aAuthData['error_description'] : _t('_error occured');
                $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
                return;
            }

            BxDolSession::getInstance()->setValue('cidaascon_access_token', $aAuthData['access_token']);
            BxDolSession::getInstance()->setValue('cidaascon_id_token', $aAuthData['id_token']);

            $aRemoteProfileInfo = $oProvider->getUserProfile($aAuthData['access_token'])->wait();

        } catch (Exception $oException) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($this->_getExceptionMessage($oException)));
            return;
        }

        if (isset($aRemoteProfileInfo['data']) && is_array($aRemoteProfileInfo['data']))
            $aRemoteProfileInfo = $aRemoteProfileInfo['data'];

        if (empty($aRemoteProfileInfo['id']) && !empty($aRemoteProfileInfo['sub']))
            $aRemoteProfileInfo['id'] = $aRemoteProfileInfo['sub'];

        if ($aRemoteProfileInfo && !empty($aRemoteProfileInfo['id'])) {
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);

            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                $this->setLogged($oProfile->id(), '', true, true);
            }
            else {
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
     * Sign in (or join) with a Cidaas access token which was received by a client app.
     *
     * Only the access token is taken from the request. The token is introspected by Cidaas
     * to be sure that it was issued for this site's client, and the profile is requested from Cidaas here.
     *
     * @param $mParams - access token as array ['access_token' => '...'] or as JSON string of such array
     */
    public function serviceHandle($mParams = [])
    {
        if (!$this->_bIsApi)
            return;

        $aError = [
            bx_api_get_msg(_t('_sys_connect_profile_error_info'))
        ];

        if (!($sAccessToken = $this->_getAccessToken($mParams)))
            return $aError;

        $aTokenInfo = $this->_requestTokenInfo($sAccessToken);
        if (!$aTokenInfo)
            return $aError;

        $aUserInfo = $this->_requestUserInfo($sAccessToken);
        if (!$aUserInfo)
            return $aError;

        $aRemoteProfileInfo = $this->_buildVerifiedProfile($aTokenInfo, $aUserInfo);
        if (!$aRemoteProfileInfo)
            return $aError;

        $iProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
        if ($iProfileId && $oProfile = BxDolProfile::getInstance($iProfileId))
            return $this->setLogged($oProfile->id());
        else
            return $this->_createProfile($aRemoteProfileInfo);
    }

    /**
     * Ask Cidaas about the access token (token introspection, RFC 7662).
     *
     * @return array with token info or false on error
     */
    protected function _requestTokenInfo($sAccessToken)
    {
        $aParams = ['token' => $sAccessToken, 'token_type_hint' => 'access_token', 'client_id' => $this->_oConfig->sClientID];

        $aHeaders = ['Content-Type: application/x-www-form-urlencoded'];
        if ($this->_oConfig->sSecret)
            $aHeaders[] = 'Authorization: Basic ' . base64_encode($this->_oConfig->sClientID . ':' . $this->_oConfig->sSecret);

        $sHttpCode = '';
        $s = bx_file_get_contents($this->_oConfig->sBaseUrl . '/token-srv/introspect', $aParams, 'post', $aHeaders, $sHttpCode, [], 10);

        return $this->_decodeJsonResponse($s, $sHttpCode);
    }

    /**
     * Get the profile of the user the access token was issued for from Cidaas.
     *
     * @return array with profile info or false on error
     */
    protected function _requestUserInfo($sAccessToken)
    {
        try {
            $aProfile = $this->_getProvider()->getUserProfile($sAccessToken)->wait();
        } catch (Exception $oException) {
            return false;
        }

        if (isset($aProfile['data']) && is_array($aProfile['data']))
            $aProfile = $aProfile['data'];

        return is_array($aProfile) && $aProfile && !isset($aProfile['error']) ? $aProfile : false;
    }

    /**
     * Build remote profile info from the data received from Cidaas.
     * Returns false if the token wasn't issued to this site's client, expired, or if the user can't be identified reliably.
     *
     * @param $aTokenInfo - response of the introspection endpoint
     * @param $aUserInfo - response of the user profile endpoint
     * @return array with whitelisted profile fields or false
     */
    protected function _buildVerifiedProfile($aTokenInfo, $aUserInfo)
    {
        if (!is_array($aTokenInfo) || !is_array($aUserInfo) || !$this->_oConfig->sClientID)
            return false;

        if (!isset($aTokenInfo['active']) || !$this->_isRemoteFlagTrue($aTokenInfo['active']))
            return false;

        // the token must be issued to this site's client
        $aAudience = [];
        if (isset($aTokenInfo['client_id']) && is_string($aTokenInfo['client_id']))
            $aAudience[] = $aTokenInfo['client_id'];
        if (isset($aTokenInfo['aud']))
            $aAudience = array_merge($aAudience, (array)$aTokenInfo['aud']);
        if (!in_array($this->_oConfig->sClientID, $aAudience, true))
            return false;

        if (isset($aTokenInfo['exp']) && (!is_numeric($aTokenInfo['exp']) || (int)$aTokenInfo['exp'] <= time()))
            return false;

        // the user must be identified by the stable Cidaas ID
        if (empty($aUserInfo['sub']) || !is_string($aUserInfo['sub']) || !preg_match('/^[A-Za-z0-9_.:-]{1,255}$/D', $aUserInfo['sub']))
            return false;
        if (isset($aTokenInfo['sub']) && $aTokenInfo['sub'] !== $aUserInfo['sub'])
            return false;

        // the email must be verified by Cidaas
        if (empty($aUserInfo['email']) || !is_string($aUserInfo['email']) || !filter_var($aUserInfo['email'], FILTER_VALIDATE_EMAIL))
            return false;
        if (!isset($aUserInfo['email_verified']) || !$this->_isRemoteFlagTrue($aUserInfo['email_verified']))
            return false;

        $aProfileInfo = [
            'id' => $aUserInfo['sub'],
            'sub' => $aUserInfo['sub'],
            'email' => $aUserInfo['email'],
            'email_verified' => true,
        ];
        foreach (['name', 'given_name', 'family_name', 'preferred_username'] as $sKey)
            $aProfileInfo[$sKey] = isset($aUserInfo[$sKey]) && is_string($aUserInfo[$sKey]) ? get_mb_substr($aUserInfo[$sKey], 0, 255) : '';
        $aProfileInfo['picture'] = isset($aUserInfo['picture']) && is_string($aUserInfo['picture']) ? get_mb_substr($aUserInfo['picture'], 0, 2048) : '';

        return $aProfileInfo;
    }

    protected function _isRemoteEmailVerified($aProfileInfo)
    {
        // enforced when Cidaas reports it
        return !isset($aProfileInfo['email_verified']) || $this->_isRemoteFlagTrue($aProfileInfo['email_verified']);
    }

    /**
     * 
     * (
     *     [last_used_identity_id] => 74e3bf36-d1d7-4e4c-a95b-5822abfc6b97
     *     [sub] => 21e029a8-9da8-4fd9-ad14-e5f3c615f55a
     *     [updated_at] => 1787238995
     *     [createdTime] => 2026-08-20T15:16:35.513Z
     *     [userStatus] => VERIFIED
     *     [lastLoggedInTime] => 2026-08-24T10:05:34.3Z
     *     [customFields] => Array
     *         (
     *             [city] => Sydney
     *             [department] => Support
     *             [job_title] => Support
     *             [name_of_company] => UNA Inc
     *             [other_interests] => IT
     *             [responsibilty] => Support
     *         )
     * 
     *     [email] => team@unacms.com
     *     [email_verified] => 1
     *     [provider] => self
     *     [given_name] => UNA
     *     [family_name] => Team
     *     [address] => Array
     *         (
     *             [country] => Australia
     *         )
     * 
     *     [user_status] => VERIFIED
     *     [name] => UNA Team
     *     [last_accessed_at] => 1787565934
     * )
     * 
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = $aProfileInfo;

        $sEmail = !empty($aProfileInfo['email']) ? $aProfileInfo['email'] : '';
        if (!$sEmail && !empty($aProfileInfo['identities'][0]['email']))
            $sEmail = $aProfileInfo['identities'][0]['email'];

        $sName = !empty($aProfileInfo['preferred_username']) ? $aProfileInfo['preferred_username'] : '';
        if (!$sName && !empty($aProfileInfo['name']))
            $sName = $aProfileInfo['name'];
        if (!$sName && !empty($aProfileInfo['given_name']))
            $sName = $aProfileInfo['given_name'];
        if (!$sName && $sEmail)
            $sName = explode('@', $sEmail)[0];
        if (!$sName)
            $sName = !empty($aProfileInfo['sub']) ? $aProfileInfo['sub'] : '';

        $sFullname = !empty($aProfileInfo['name']) ? $aProfileInfo['name'] : trim((!empty($aProfileInfo['given_name']) ? $aProfileInfo['given_name'] : '') . ' ' . (!empty($aProfileInfo['family_name']) ? $aProfileInfo['family_name'] : ''));
        if (!$sFullname)
            $sFullname = $sName;

        $aProfileFields['name'] = $sName;
        $aProfileFields['fullname'] = $sFullname;
        $aProfileFields['first_name'] = !empty($aProfileInfo['given_name']) ? $aProfileInfo['given_name'] : '';
        $aProfileFields['last_name'] = !empty($aProfileInfo['family_name']) ? $aProfileInfo['family_name'] : '';
        $aProfileFields['email'] = $sEmail;
        $aProfileFields['picture'] = !empty($aProfileInfo['picture']) ? $aProfileInfo['picture'] : '';
        $aProfileFields['allow_view_to'] = getParam('bx_cidaascon_privacy');

        return $aProfileFields;
    }

    /**
     * @return BxCidaasConProvider
     */
    protected function _getProvider()
    {
        bx_import('Provider', $this->_aModule);
        return new BxCidaasConProvider(
            $this->_oConfig->sBaseUrl,
            $this->_oConfig->sClientID,
            $this->_oConfig->sSecret ? $this->_oConfig->sSecret : '',
            $this->_oConfig->sPageHandle,
            null,
            $this->_oConfig->bDebug
        );
    }

    protected function _getExceptionMessage($oException)
    {
        if ($oException instanceof ClientException && $oException->hasResponse()) {
            $aBody = json_decode((string)$oException->getResponse()->getBody(), true);
            if (!empty($aBody['error']['error_description']))
                return $aBody['error']['error_description'];
            if (!empty($aBody['error_description']))
                return $aBody['error_description'];
            if (!empty($aBody['error']) && is_string($aBody['error']))
                return $aBody['error'];
        }

        $sMessage = $oException->getMessage();
        return $sMessage ? $sMessage : _t('_error occured');
    }
}

/** @} */
