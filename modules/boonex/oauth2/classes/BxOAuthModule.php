<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OAuth2 OAuth2 server
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOAuthUserCredentialsStorage extends OAuth2\Storage\Pdo implements OAuth2\Storage\UserCredentialsInterface
{
    /**
     * Clients of native apps (RFC 8252), by their ids. They sign in for API v2 and are the only
     * clients with rules of their own (PKCE, loopback redirects, see BxOAuthAuthorizeController).
     * They are built in: none has a row in bx_oauth_clients, so a site without API v2 has the
     * clients it always had, in Studio and for every endpoint that looks a client up. None has a
     * secret. Its `api` scope is its own: it is not in bx_oauth_scopes.
     */
    const NATIVE_APP_CLIENTS = array(
        'una-desktop' => array(
            'title' => 'UNA Desktop',
            'redirect_uri' => 'http://127.0.0.1/callback',
            'grant_types' => 'authorization_code,refresh_token',
            'scope' => 'api',
        ),
    );

    /**
     * A native app's client as a row of bx_oauth_clients, false when the id is not one or API v2
     * is off. Native apps are clients of API v2, a preview that is off as installed: while it is
     * off the server doesn't know them (the id is like any other then, and a site's own client of
     * that id works as it always did); while it is on the id is the native app's, whatever the
     * table has. The id is matched as it is written, letter case too.
     * @return array|false
     */
    public static function getNativeAppClient($sClientId)
    {
        if (!is_string($sClientId) || !isset(self::NATIVE_APP_CLIENTS[$sClientId]) || !getParam(BxDolApiV2Router::OPTION_ENABLE))
            return false;

        return array('id' => 0, 'client_id' => $sClientId, 'client_secret' => null, 'parent_id' => 0, 'user_id' => 0) + self::NATIVE_APP_CLIENTS[$sClientId];
    }

    public function isNativeAppClient($sClientId)
    {
        return self::getNativeAppClient($sClientId) !== false;
    }

    // what the library asks about a client: a native app's is answered here, any other by the library, as it always was

    public function getClientDetails($sClientId)
    {
        if (($aClient = self::getNativeAppClient($sClientId)) !== false)
            return $aClient;

        return parent::getClientDetails($sClientId);
    }

    public function isPublicClient($sClientId)
    {
        if (self::getNativeAppClient($sClientId) !== false)
            return true;

        return parent::isPublicClient($sClientId);
    }

    public function checkClientCredentials($sClientId, $sClientSecret = null)
    {
        // a native app has no secret: it is never the one who knows it
        if (self::getNativeAppClient($sClientId) !== false)
            return false;

        return parent::checkClientCredentials($sClientId, $sClientSecret);
    }

    public function checkUserCredentials($sLogin, $sPassword)
    {
        return ($sErrorMsg = bx_check_password($sLogin, $sPassword)) ? false : true;
    }

    public function getUser($sLogin)
    {
        return $this->getUserDetails($sLogin);
    }
    
    public function getUserDetails($sLogin)
    {
        if (!($oAccount = BxDolAccount::getInstance($sLogin)))
            return false;

        if (!($oProfile = BxDolProfile::getInstanceByAccount($oAccount->id())))
            return false;

        // don't allow login under another profile
        if ($oProfile->getAccountId() != $oAccount->id()) {
            // force switch to own profile
            if ($oAccount->updateProfileContextAuto())
                $oProfile = BxDolProfile::getInstanceByAccount($oAccount->id(), true);
        }

        if (!$oProfile)
            return false;

        return array('user_id' => $oProfile->id());
    }

    public function checkRestrictedGrantType($iClientId, $sGrantType)
    {
        $aDetails = $this->getClientDetails($iClientId);
        if (isset($aDetails['grant_types'])) {
            $aGrantTypes = explode(',', $aDetails['grant_types']);

            return in_array($sGrantType, (array) $aGrantTypes);
        }

        // if grant_types are not defined, then none are restricted
        return true;
    }
}

class BxOAuthModule extends BxDolModule
{
    protected $_oStorage;
    protected $_oServer;
    protected $_oAPI;

    function __construct(&$aModule)
    {
        parent::__construct($aModule);        
    }

    public function checkAllowedOrigins()
    {
        $aClient = array();
        if (isset($_SERVER['HTTP_ORIGIN']) && parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST) != parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST)) {

            $aClient = $this->_oDb->getClientByAllowedOriginUrl($_SERVER['HTTP_ORIGIN']);
            if (!$aClient) {
                header('HTTP/1.0 403 Forbidden');
                echo _t("_Access denied");
                exit;
            } 

            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
            
            if ('OPTIONS' == $_SERVER['REQUEST_METHOD']) {
                header('Access-Control-Allow-Methods: POST, GET');
                header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Custom-Header, X-Requested-With');                    
                exit(0);
            }            
        }
        return $aClient;
    }

    public function initOAuth($sClientId)
    {
        if ($this->_oStorage)
            return;        

        // check cross origin request
        
        $aClient = $this->checkAllowedOrigins();

        // get the client data if it wasn't set before
        
        if (empty($aClient))
            $aClient = $sClientId ? $this->getClient($sClientId) : false;
        
        if (!$aClient)
            $aClient = array('grant_types' => 'authorization_code');
        
        if (!$aClient['grant_types'])
            $aClient['grant_types'] = 'authorization_code';
        
        $aGrantTypes = explode(',', $aClient['grant_types']);


        // configure OAuth storage and server

        $this->_oStorage = $this->getStorage();

        $iRefreshTokenLifetime = (int)getParam('bx_oauth2_refresh_token_lifetime');
        $aServerConfig = array(
            'require_exact_redirect_uri' => false,
            'refresh_token_lifetime' => $iRefreshTokenLifetime ? $iRefreshTokenLifetime : 7779000, // set lifetime to 90 days
        );
        $this->_oServer = new OAuth2\Server($this->_oStorage, $aServerConfig);

        // The library's authorize controller, set up as the server sets up its own, plus the rules of native apps
        // (PKCE, loopback redirects), see BxOAuthAuthorizeController. It is there for every request, whatever
        // client the lines above found: the client the request itself names decides which rules apply.
        bx_import('AuthorizeController', $this->_aModule);
        $this->_oServer->setAuthorizeController(new BxOAuthAuthorizeController(
            $this->_oStorage,
            array('code' => new OAuth2\ResponseType\AuthorizationCode($this->_oStorage)),
            $aServerConfig,
            new OAuth2\Scope($this->_oStorage)
        ));

        // add grand types

        // Add the "Client Credentials" grant type (it is the simplest of the grant types)
        if (in_array('client_credentials', $aGrantTypes))
            $this->_oServer->addGrantType(new OAuth2\GrantType\ClientCredentials($this->_oStorage));

        // Add the "Authorization Code" grant type (this is where the oauth magic happens)
        if (in_array('authorization_code', $aGrantTypes))
            $this->_oServer->addGrantType(new OAuth2\GrantType\AuthorizationCode($this->_oStorage));

        // Add the "Password" grant type (generate client_id with empty client_secret)
        if (in_array('password', $aGrantTypes))
            $this->_oServer->addGrantType(new OAuth2\GrantType\UserCredentials($this->_oStorage));

        // Add the "Refresh Token" grant type
        if (in_array('refresh_token', $aGrantTypes))
            $this->_oServer->addGrantType(new OAuth2\GrantType\RefreshToken($this->_oStorage, array(
                'always_issue_new_refresh_token' => getParam('bx_oauth2_always_issue_new_refresh_token') ? true : false,
                // 'unset_refresh_token_after_use' => false,
            )));
    }

    /**
     * A client by its id: a native app's built-in one while API v2 is on
     * (BxOAuthUserCredentialsStorage::getNativeAppClient), otherwise its row of bx_oauth_clients,
     * as it always was.
     * @return array the client, empty when there is none
     */
    public function getClient($sClientId)
    {
        if (($aClient = BxOAuthUserCredentialsStorage::getNativeAppClient($sClientId)) !== false)
            return $aClient;

        return $this->_oDb->getClientsBy(array('type' => 'client_id', 'client_id' => $sClientId));
    }

    public function getStorage()
    {
        if ($this->_oStorage)
            return $this->_oStorage;

        return new BxOAuthUserCredentialsStorage(BxDolDb::getLink(), array (
            'client_table' => 'bx_oauth_clients',
            'access_token_table' => 'bx_oauth_access_tokens',
            'refresh_token_table' => 'bx_oauth_refresh_tokens',
            'code_table' => 'bx_oauth_authorization_codes',
            'user_table' => 'sys_accounts',
            'jwt_table'  => '',
            'jti_table'  => '',
            'scope_table'  => 'bx_oauth_scopes',
            'public_key_table'  => '',
        ));
    }

    /**
     * An access token that hasn't expired, for resource servers such as API v2.
     * No origin check and no output: the caller decides how to answer.
     * @param string $sToken bearer token
     * @return array|false ['profile_id' => int, 'client_id' => string, 'scopes' => [string], 'expires' => int]
     */
    public function serviceGetAccessTokenData($sToken)
    {
        if (!is_string($sToken) || !preg_match('/^[A-Za-z0-9]{20,80}$/', $sToken))
            return false;

        $aToken = $this->getStorage()->getAccessToken($sToken);
        if (empty($aToken) || empty($aToken['user_id']) || (int)$aToken['expires'] < time())
            return false;

        return array(
            'profile_id' => (int)$aToken['user_id'],
            'client_id' => (string)$aToken['client_id'],
            'scopes' => preg_split('/[\s,]+/', trim((string)$aToken['scope']), -1, PREG_SPLIT_NO_EMPTY),
            'expires' => (int)$aToken['expires'],
        );
    }

    /**
     * @page public_api API Public
     * @section public_api_token /m/oauth2/token
     * 
     * Get the token for the future communication with @ref private_api
     * 
     * **HTTP Method:** 
     * `POST`
     *
     * **Request params:**
     * - `grant_type` - for API it's better to use 'password' grant type
     * - `username` - login email
     * - `password` - login password
     * - `client_id` - client ID from bx_oauth_clients table
     *
     * **Response (success):**
     * @code
     * {  
     *    "access_token":"cdd7056d0adafa9ead87526ca22367c6b0df8273",
     *    "expires_in":3600,
     *    "token_type":"Bearer",
     *    "scope":"basic",
     *    "refresh_token":"c3d7f6f4b7cc640214ae0cba2b194872c3089f1c"
     * }
     * @endcode
     *
     * **Response (error):**
     * @code
     * {  
     *    "error":"short error description here",
     *    "error_description":"long error description here"
     * }
     * @endcode
     */
    function actionToken ()
    {
        $this->initOAuth(bx_get('client_id'));
        
        // Handle a request for an OAuth2.0 Access Token and send the response to the client
        $this->_oServer->handleTokenRequest(OAuth2\Request::createFromGlobals())->send();
    }

    /**
     * @page public_api API Public
     * @section public_api_revoke /m/oauth2/revoke
     * 
     * Revoke token 
     * 
     * **HTTP Method:** 
     * `POST`
     *
     * **Request params:**
     * - `token` - token to revoke
     *
     * **Request header:**
     * @code
     * Authorization: Bearer 9802c4a34e1535d8c3b721604ee0e7fb04116c49
     * @endcode
     *
     * **Response (success):**
     * @code
     * {  
     *    "revoked":true,
     * }
     * @endcode
     *
     * **Response (error):**
     * @code
     * {  
     *    "error":"short error description here",
     *    "error_description":"long error description here"
     * }
     * @endcode
     */
    function actionRevoke ()
    {
        $this->initOAuth($this->getClientIdFromAccessTokenHeader());
        $this->_oServer->handleRevokeRequest(OAuth2\Request::createFromGlobals())->send();
    }

    /**
     * Authenicated or public call to the "safe" and "public" service methods 
     */
    function actionCom ($sMethod)
    {
        if (!$this->_oAPI) {
            bx_import('API', $this->_aModule);
            $this->_oAPI = new BxOAuthAPI($this);
        }

        $bPublic = $this->_oAPI->isPublicAPI(bx_get('module') ? bx_get('module') : 'bx_api', $sMethod, bx_get('class') ? bx_get('class') : false);
        if ($bPublic) {

            if (!$this->_oDb->getClientsBy(array('type' => 'client_id', 'client_id' => bx_get('client_id')))) {
                $this->_oAPI->errorOutput(403, 'access_denied', '"public" services need valid "client_id" parameter');
                return;
            }

            $this->checkAllowedOrigins();
            $this->_oAPI->com($sMethod, array(), $bPublic);
        }
        else {
            if (!$this->_oAPI->isSafeAPI(bx_get('module') ? bx_get('module') : 'bx_api', $sMethod, bx_get('class') ? bx_get('class') : false)) {
                $this->_oAPI->errorOutput(403, 'access_denied', 'Only "public" and "safe" services can be called, or method doesn\'t exist');
                return;
            }

            $this->initOAuth($this->getClientIdFromAccessTokenHeader());

            // Handle a request to a resource and authenticate the access token
            if (!$this->_oServer->verifyResourceRequest(OAuth2\Request::createFromGlobals())) {
                $this->_oServer->getResponse()->send();
                return;
            }

            $aToken = $this->_oServer->getAccessTokenData(OAuth2\Request::createFromGlobals());

            $aScope = explode(',', $this->_oAPI->aAction2Scope['api']);
            $aScopeToken = explode(',', $aToken['scope']);
            if (!array_intersect($aScopeToken, $aScope)) {
                $this->_oAPI->errorOutput(403, 'insufficient_scope', 'The request requires higher privileges than provided by the access token');
                return;
            }

            $this->_oAPI->com($sMethod, $aToken, false);
        }
    }

    /**
     * Authenicated call to the API
     */
    function actionApi ($sAction)
    {
        $this->initOAuth($this->getClientIdFromAccessTokenHeader());
        
        // Handle a request to a resource and authenticate the access token
        if (!$this->_oServer->verifyResourceRequest(OAuth2\Request::createFromGlobals())) {
            $this->_oServer->getResponse()->send();
            return;
        }

        $aToken = $this->_oServer->getAccessTokenData(OAuth2\Request::createFromGlobals());

        if (!$this->_oAPI) {
            bx_import('API', $this->_aModule);
            $this->_oAPI = new BxOAuthAPI($this);
        }

        if (!$sAction || !method_exists($this->_oAPI, $sAction) || in_array($sAction, $this->_oAPI->aExceptionsAPI)) {
            $this->_oAPI->errorOutput(404, 'not_found', 'No such API endpoint available');
            return;
        }

        $aScope = explode(',', $this->_oAPI->aAction2Scope[$sAction]);
        $aScopeToken = explode(',', $aToken['scope']);
        if (!array_intersect($aScopeToken, $aScope)) {
            $this->_oAPI->errorOutput(403, 'insufficient_scope', 'The request requires higher privileges than provided by the access token');
            return;
        }

        $this->_oAPI->$sAction($aToken);
    }

    /**
     * Authorization endpoint, see processAuthorizeRequest.
     */
    function actionAuth ()
    {
        $this->initOAuth(bx_get('client_id'));

        $oRequest = OAuth2\Request::createFromGlobals();
        $oResponse = new OAuth2\Response();

        switch ($this->processAuthorizeRequest($oRequest, $oResponse)) {
            case 'error':
                // a native app waits for its redirect, so with a valid redirect_uri the error goes back to it
                // (RFC 6749 4.1.2.1); every other client gets the site's error page, as before
                if ($oResponse->isRedirection() && $this->_isNativeAppRequest()) {
                    $oResponse->send();
                    break;
                }
                require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
                $this->_oTemplate->getPage(false, MsgBox($this->_getAuthorizeError($oResponse)));
                break;

            case 'login':
                require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
                $sForceRelocate = BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'auth/?' . http_build_query($this->getAuthorizeParams());
                bx_login_form(false, false, $sForceRelocate);
                break;

            case 'consent':
                $oPage = BxDolPage::getObjectInstanceByURI('oauth-authorization');
                $this->_oTemplate->getPage(false, $oPage->getCode());
                break;

            default: // 'response': a redirect back to the client, with a code or an error
                $oResponse->send();
        }
    }

    /**
     * Decide on an authorize request. initOAuth must be called before.
     *
     * A code is issued only for a profile of the signed-in account, chosen in the consent form
     * (POST with the consent token). A GET can't approve anything. Without asking, only a
     * confidential client (one with a secret, so a code is of no use to anyone else) is approved:
     * for a profile that was connected to it before, or for the only profile of the account.
     *
     * @return string 'error' (invalid request), 'login' (guest), 'consent' (show the consent form)
     *         or 'response' ($oResponse holds the redirect to the client)
     */
    public function processAuthorizeRequest($oRequest, $oResponse)
    {
        if (!$this->_oServer->validateAuthorizeRequest($oRequest, $oResponse))
            return 'error';

        if (!isLogged())
            return 'login';

        $sClientId = $this->_oServer->getAuthorizeController()->getClientId();
        $aProfiles = $this->_getAuthorizeProfiles();

        if ('POST' == $oRequest->server('REQUEST_METHOD') && null !== ($mixedProfileId = $oRequest->request('profile_id'))) {
            // the answer from the consent form
            $iProfileId = is_scalar($mixedProfileId) ? (int)$mixedProfileId : 0;

            // "Cancel", or a profile of another account
            if (!$iProfileId || !isset($aProfiles[$iProfileId])) {
                $this->_oServer->handleAuthorizeRequest($oRequest, $oResponse, false);
                return 'response';
            }

            if ($this->isConsentTokenValid($oRequest->request('csrf_token'))) {
                $this->_oServer->handleAuthorizeRequest($oRequest, $oResponse, true, $iProfileId);
                return 'response';
            }

            // no valid consent token, so it wasn't sent from the consent form: ask again
            return 'consent';
        }

        if ($aProfiles && !$this->_oStorage->isPublicClient($sClientId)) {
            $iProfileId = (int)$this->_oDb->getSavedProfile($sClientId, $aProfiles);
            if (!$iProfileId && 1 == count($aProfiles))
                $iProfileId = (int)array_key_first($aProfiles);

            if ($iProfileId) {
                $this->_oServer->handleAuthorizeRequest($oRequest, $oResponse, true, $iProfileId);
                return 'response';
            }
        }

        return 'consent';
    }

    /**
     * Consent form. The page with it can be opened directly, so the request is validated here too,
     * and the form carries only the values the OAuth library accepted.
     */
    function serviceAuthorization ()
    {
        if (!isLogged())
            return MsgBox(_t('_Access denied'));

        $this->initOAuth(bx_get('client_id'));

        $oRequest = OAuth2\Request::createFromGlobals();
        $oResponse = new OAuth2\Response();
        if (!$this->_oServer->validateAuthorizeRequest($oRequest, $oResponse))
            return MsgBox($this->_getAuthorizeError($oResponse));

        $aParams = $this->getAuthorizeParams();

        // A native app: what it asks for, and where the browser goes back to, so a person can tell an app on
        // this computer from a website. Its PKCE challenge is in the form too: the form's POST is validated as
        // the request was. Every other client gets the page as it always was.
        $bNativeApp = $this->_isNativeAppRequest();
        $aNativeApp = $bNativeApp ? BxOAuthUserCredentialsStorage::getNativeAppClient($aParams['client_id']) : false;
        $sTitle = $aNativeApp ? $aNativeApp['title'] : $this->_oDb->getClientTitle($aParams['client_id']);
        $sRedirectHost = $bNativeApp ? $this->_getRedirectHost($aParams) : '';

        $aVars = array(
            'text' => _t('_bx_oauth_authorize_app', $this->_escapeAttribute($sTitle)),
            'bx_if:native_app' => array(
                'condition' => $bNativeApp,
                'content' => array(
                    'bx_if:scope_api' => array(
                        'condition' => $bNativeApp && in_array('api', preg_split('/[\s,]+/', $aParams['scope'], -1, PREG_SPLIT_NO_EMPTY), true),
                        'content' => array('scope_api_text' => _t('_bx_oauth_authorize_scope_api')),
                    ),
                    'bx_if:redirect' => array(
                        'condition' => $sRedirectHost !== '',
                        'content' => array('redirect_text' => _t('_bx_oauth_authorize_redirect', $this->_escapeAttribute($sRedirectHost))),
                    ),
                ),
            ),
            'url' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'auth',
            'csrf_token' => $this->_escapeAttribute($this->getConsentToken()),
            'client_id' => $this->_escapeAttribute($aParams['client_id']),
            'response_type' => $this->_escapeAttribute($aParams['response_type']),
            'redirect_uri' => $this->_escapeAttribute($aParams['redirect_uri']),
            'scope' => $this->_escapeAttribute($aParams['scope']),
            'state' => $this->_escapeAttribute($aParams['state']),
            'bx_if:pkce' => array(
                'condition' => isset($aParams['code_challenge']),
                'content' => array(
                    'code_challenge' => $this->_escapeAttribute($aParams['code_challenge'] ?? ''),
                    'code_challenge_method' => $this->_escapeAttribute($aParams['code_challenge_method'] ?? ''),
                ),
            ),
            'profiles' => BxDolService::call('system', 'account_profile_switcher', array(getLoggedId(), false, "javascript: $('#bx-auth-profile-id').val('{profile_id}'); $('#bx-auth-form form').submit(); void(0);", true, _t('_bx_oauth_connect'), 'unit_wo_links'), 'TemplServiceProfiles')['content'],
        );

        $this->_oTemplate->addCss('main.css');
        return $this->_oTemplate->parseHtmlByName('page_auth.html', $aVars);
    }

    /**
     * Params of the authorize request validated last, as the OAuth library accepted them.
     * Call it only after a successful validateAuthorizeRequest.
     */
    public function getAuthorizeParams()
    {
        $oController = $this->_oServer->getAuthorizeController();

        $aParams = array(
            'client_id' => (string)$oController->getClientId(),
            'response_type' => (string)$oController->getResponseType(),
            'redirect_uri' => (string)$oController->getRedirectUri(),
            'scope' => (string)$oController->getScope(),
        );
        if (($sState = $oController->getState()) !== null && $sState !== '')
            $aParams['state'] = (string)$sState;

        // PKCE of a native app (BxOAuthAuthorizeController): the challenge goes through the sign-in and the consent form with the rest
        $sChallenge = method_exists($oController, 'getCodeChallenge') ? (string)$oController->getCodeChallenge() : '';
        if ($sChallenge !== '') {
            $aParams['code_challenge'] = $sChallenge;
            $aParams['code_challenge_method'] = 'S256';
        }

        return $aParams;
    }

    /**
     * Token of the consent form, tied to the account and its session. Without it a consent can't be given.
     */
    public function getConsentToken()
    {
        $iAccountId = (int)getLoggedId();
        if (!$iAccountId)
            return '';

        $oSession = BxDolSession::getInstance();
        // A remembered user (memberID/memberPassword cookies with `sys_session_auth` off) may have no session
        // cookie, and a plain start() does nothing then, so the session is started explicitly.
        if (!$oSession->getId())
            $oSession->start(true);
        if (!($sSessionId = $oSession->getId()))
            return '';

        return hash_hmac('sha256', 'bx_oauth_consent|' . $iAccountId . '|' . $sSessionId, BX_DOL_SECRET);
    }

    public function isConsentTokenValid($sToken)
    {
        if (!is_string($sToken) || '' === $sToken)
            return false;

        $sExpected = $this->getConsentToken();
        return '' !== $sExpected && hash_equals($sExpected, $sToken);
    }

    /**
     * A value for an HTML attribute or text. Underscores are encoded too, so a value can't
     * make the template engine put another template key (`__csrf_token__`) in its place.
     */
    protected function _escapeAttribute($s)
    {
        return str_replace('_', '&#95;', htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    }

    /**
     * Profiles a code can be issued for: those of the signed-in account, by id.
     */
    protected function _getAuthorizeProfiles()
    {
        $oAccount = BxDolAccount::getInstance();
        return $oAccount ? $oAccount->getProfiles() : array();
    }

    /**
     * Whether the authorize request validated last names a native app, see BxOAuthAuthorizeController.
     */
    protected function _isNativeAppRequest()
    {
        $oController = $this->_oServer->getAuthorizeController();
        return method_exists($oController, 'isNativeAppRequest') && $oController->isNativeAppRequest();
    }

    /**
     * Where the browser goes back to after the consent page: host[:port] of the redirect in the
     * request, or of the registered one when the request has none.
     */
    protected function _getRedirectHost($aParams)
    {
        $sUri = $aParams['redirect_uri'];
        if ($sUri === '') {
            $aClient = $this->_oStorage->getClientDetails($aParams['client_id']);
            $sUri = is_array($aClient) ? (string)$aClient['redirect_uri'] : '';
        }

        $aUri = $sUri !== '' ? parse_url($sUri) : false;
        if (!is_array($aUri) || empty($aUri['host']))
            return '';

        return $aUri['host'] . (isset($aUri['port']) ? ':' . (int)$aUri['port'] : '');
    }

    protected function _getAuthorizeError($oResponse)
    {
        $s = $oResponse->getParameter('error_description');
        return htmlspecialchars_adv($s ? $s : _t('_error occured'));
    }

    function serviceGetClientsBy ($aParams = array())
    {
    	return $this->_oDb->getClientsBy($aParams);
    }

    function serviceAddClient ($aClient)
    {
        if (!isset($aClient['client_id'])) {
            bx_import('FormAdd', 'bx_oauth');
            for ($i = 0; $i < 99 ; ++$i) {
                $aClient['client_id'] = strtolower(genRndPwd(BxOAuthFormAdd::$LENGTH_ID, false));
                if (!$this->_oDb->getClientTitle($aClient['client_id'])) // check for uniq
                    break;
            }
        }

        if (!isset($aClient['client_secret'])) {
            bx_import('FormAdd', 'bx_oauth');
            $aClient['client_secret'] = strtolower(genRndPwd(BxOAuthFormAdd::$LENGTH_SECRET, false));
        }

        if (!isset($aClient['scope']))
            $aClient['scope'] = 'market';

        if (!isset($aClient['user_id']))
            $aClient['user_id'] = bx_get_logged_profile_id();

        if (!isset($aClient['title']) && isset($aClient['redirect_uri']) && ($sHost = parse_url($aClient['redirect_uri'], PHP_URL_HOST)))
            $aClient['title'] = $sHost;

    	return $this->_oDb->addClient($aClient);
    }

	function serviceUpdateClientsBy ($aParamsSet, $aParamsWhere)
    {
    	return $this->_oDb->updateClientsBy($aParamsSet, $aParamsWhere);
    }

	function serviceDeleteClientsBy ($aParams)
    {
    	return $this->_oDb->deleteClientsBy($aParams);
    }

    function studioSettings ()
    {
        if (!isAdmin()) {
            $this->_oTemplate->displayAccessDenied ();
            return;
        }

        $oGrid = BxDolGrid::getObjectInstance('bx_oauth', BxDolStudioTemplate::getInstance());
        if ($oGrid)
            return $oGrid->getCode();

        return '';
    }

    function getClientIdFromAccessTokenHeader()
    {
        if (isset($_SERVER['HTTP_AUTHORIZATION']))
            $sAuthHeader = $_SERVER['HTTP_AUTHORIZATION'];
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']))
            $sAuthHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        if (empty($sAuthHeader))
            return false;
        
        if (false === stripos($sAuthHeader, 'Bearer'))
            return false;

        return $this->_oDb->getClientIdByAccessToken(trim(substr($sAuthHeader, 6)));
    }
}

/** @} */
