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

	/**
	 * This service need to be called when we call logout from UNA,
	 * so it will propagate logout to IDP
	 * Other words: logout in UNA, IDP and all other SP
	 */
	public function serviceLogout()
	{
		if (!isLogged())
			return;

		$sAccessToken = BxDolSession::getInstance()->getUnsetValue('cidaascon_access_token');
		if (!$sAccessToken)
			return;

		try {
			$this->_getProvider()->logout($sAccessToken)->wait();
		} catch (Exception $oException) {
            bx_log('bx_cidaas', $this->_getExceptionMessage($oException));
        }
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
            if (empty($aAuthData['access_token'])) {
                $sErrorDescription = isset($aAuthData['error_description']) ? $aAuthData['error_description'] : _t('_error occured');
                $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
                return;
            }

            BxDolSession::getInstance()->setValue('cidaascon_access_token', $aAuthData['access_token']);

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

    public function serviceHandle($aRemoteProfileInfo = [])
    {
        if (!$this->_bIsApi)
            return;

        if (is_string($aRemoteProfileInfo))
            $aRemoteProfileInfo = bx_api_get_browse_params($aRemoteProfileInfo);

        if (empty($aRemoteProfileInfo) || !is_array($aRemoteProfileInfo))
            return [
                bx_api_get_msg(_t('_sys_connect_profile_error_info'))
            ];

        if (empty($aRemoteProfileInfo['id']) && !empty($aRemoteProfileInfo['sub']))
            $aRemoteProfileInfo['id'] = $aRemoteProfileInfo['sub'];

        $iProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
        if ($iProfileId && $oProfile = BxDolProfile::getInstance($iProfileId))
            return $this->setLogged($oProfile->id());
        else
            return $this->_createProfile($aRemoteProfileInfo);
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
