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

/**
 * Authorize endpoint. A request of any client goes through the library's controller as it is,
 * except for the clients of native apps (BxOAuthUserCredentialsStorage::isNativeAppClient),
 * which sign in the way RFC 8252 and RFC 7636 describe:
 * - PKCE: the library checks a code_verifier at the token endpoint, but its authorize step never
 *   stores the code_challenge, so a code_challenge of any other client is ignored, as it always
 *   was. A native app can't keep a secret, so PKCE is required of it: only S256 is accepted, and
 *   the challenge is stored with the code.
 * - Loopback redirects: a native app listens on a port the OS picks, so its registered
 *   http://127.0.0.1/... or http://[::1]/... redirect matches the same address and path on any
 *   port, and nothing else. Its other redirects, and those of every other client, are compared
 *   the way the library always did.
 *
 * The clients MCP clients register for themselves (BxOAuthUserCredentialsStorage::isMcpClient)
 * have the same PKCE rule, a redirect matched exactly (a loopback one, localhost too, on any
 * port), the `api` scope when they ask for none, and a `resource` (RFC 8707), when they send
 * one, that is the site's MCP server.
 */
class BxOAuthAuthorizeController extends OAuth2\Controller\AuthorizeController
{
    protected $_bNativeApp = false;
    protected $_bMcpClient = false;
    protected $_sCodeChallenge = null;
    protected $_sCodeChallengeMethod = null;

    public function validateAuthorizeRequest(OAuth2\RequestInterface $oRequest, OAuth2\ResponseInterface $oResponse)
    {
        $this->_sCodeChallenge = $this->_sCodeChallengeMethod = null;

        // the client as the parent reads it: validateRedirectUri is called before the parent keeps the id
        $mixedClientId = $oRequest->query('client_id', $oRequest->request('client_id'));
        $this->_bNativeApp = is_string($mixedClientId) && $mixedClientId !== '' && $this->clientStorage->isNativeAppClient($mixedClientId);
        $this->_bMcpClient = !$this->_bNativeApp && is_string($mixedClientId) && $mixedClientId !== '' && method_exists($this->clientStorage, 'isMcpClient') && $this->clientStorage->isMcpClient($mixedClientId);

        // an MCP client that asks for no scope gets the MCP server's own, not the site's default
        if ($this->_bMcpClient && (string)$oRequest->query('scope', $oRequest->request('scope')) === '') {
            if ('POST' == $oRequest->server('REQUEST_METHOD'))
                $oRequest->request['scope'] = 'api';
            else
                $oRequest->query['scope'] = 'api';
        }

        if (!parent::validateAuthorizeRequest($oRequest, $oResponse))
            return false;

        if (!$this->_bNativeApp && !$this->_bMcpClient)
            return true;

        // the parent keeps the validated request in private fields: read them through its getters
        $sChallenge = $oRequest->query('code_challenge', $oRequest->request('code_challenge'));
        $sMethod = $oRequest->query('code_challenge_method', $oRequest->request('code_challenge_method'));
        $sRedirectUri = $this->getRedirectUri() ?: $this->_getRegisteredRedirectUri();

        if ($sChallenge === null || $sChallenge === '') {
            $oResponse->setRedirect($this->config['redirect_status_code'], $sRedirectUri, $this->getState(), 'invalid_request', 'This client must use PKCE (code_challenge with S256)', null);
            return false;
        }

        // RFC 7636 4.2: S256 of a 43-128 character verifier is 43 base64url characters
        if (!is_string($sChallenge) || !preg_match('/^[A-Za-z0-9\-._~]{43,128}$/', $sChallenge) || $sMethod !== 'S256') {
            $oResponse->setRedirect($this->config['redirect_status_code'], $sRedirectUri, $this->getState(), 'invalid_request', 'code_challenge must be an S256 challenge', null);
            return false;
        }

        // RFC 8707: a token for another resource than the MCP server is not one this site gives
        $sResource = $oRequest->query('resource', $oRequest->request('resource'));
        if ($this->_bMcpClient && is_string($sResource) && $sResource !== '' && !in_array(rtrim($sResource, '/'), array(rtrim(BxDolMcpServer::getResourceUrl(), '/'), rtrim(BX_DOL_URL_ROOT, '/')), true)) {
            $oResponse->setRedirect($this->config['redirect_status_code'], $sRedirectUri, $this->getState(), 'invalid_target', 'The resource is not the MCP server of this site', null);
            return false;
        }

        $this->_sCodeChallenge = $sChallenge;
        $this->_sCodeChallengeMethod = 'S256';
        return true;
    }

    /**
     * Whether the request validated last names a client an MCP client registered, valid or not.
     */
    public function isMcpClientRequest()
    {
        return $this->_bMcpClient;
    }

    /**
     * Whether the request validated last names a native app, valid or not.
     */
    public function isNativeAppRequest()
    {
        return $this->_bNativeApp;
    }

    public function getCodeChallenge()
    {
        return $this->_sCodeChallenge;
    }

    protected function buildAuthorizeParameters($oRequest, $oResponse, $mixedUserId)
    {
        $aParams = parent::buildAuthorizeParameters($oRequest, $oResponse, $mixedUserId);
        if ($aParams && $this->_sCodeChallenge !== null) {
            $aParams['code_challenge'] = $this->_sCodeChallenge;
            $aParams['code_challenge_method'] = $this->_sCodeChallengeMethod;
        }
        return $aParams;
    }

    protected function validateRedirectUri($sInputUri, $sRegisteredUris)
    {
        if ($this->_bMcpClient)
            return self::isRegisteredMcpRedirect($sInputUri, $sRegisteredUris);

        if (!$this->_bNativeApp)
            return parent::validateRedirectUri($sInputUri, $sRegisteredUris);

        if (!$sInputUri || !$sRegisteredUris)
            return false;

        foreach (preg_split('/\s+/', $sRegisteredUris) as $sRegisteredUri) {
            if ($sRegisteredUri === '')
                continue;
            // a loopback registration never falls back to the library's prefix match
            if (self::isLoopbackUri($sRegisteredUri)) {
                if (self::isSameLoopbackUri($sInputUri, $sRegisteredUri))
                    return true;
            }
            elseif (parent::validateRedirectUri($sInputUri, $sRegisteredUri))
                return true;
        }

        return false;
    }

    /**
     * http://127.0.0.1/... or http://[::1]/... with no user info, query or fragment.
     * `localhost` is left out on purpose (RFC 8252 8.3): it can resolve elsewhere.
     */
    public static function isLoopbackUri($sUri)
    {
        $a = parse_url($sUri);
        if (!is_array($a) || ($a['scheme'] ?? '') !== 'http')
            return false;
        if (isset($a['user']) || isset($a['pass']) || isset($a['query']) || isset($a['fragment']))
            return false;
        return in_array($a['host'] ?? '', ['127.0.0.1', '[::1]'], true);
    }

    /**
     * Same loopback address and exact path; the port may differ (RFC 8252 7.3).
     */
    public static function isSameLoopbackUri($sInputUri, $sRegisteredUri)
    {
        if (!self::isLoopbackUri($sInputUri))
            return false;

        $aIn = parse_url($sInputUri);
        $aReg = parse_url($sRegisteredUri);
        if (isset($aReg['port']) && ($aIn['port'] ?? null) !== $aReg['port'])
            return false;

        return $aIn['host'] === $aReg['host'] && ($aIn['path'] ?? '/') === ($aReg['path'] ?? '/');
    }

    /**
     * An MCP client's redirect: one it registered, exactly; a loopback one (127.0.0.1, [::1] or localhost, as MCP
     * clients on a computer register) on any port, with the same host and path.
     */
    public static function isRegisteredMcpRedirect($sInputUri, $sRegisteredUris)
    {
        if (!is_string($sInputUri) || $sInputUri === '' || !is_string($sRegisteredUris))
            return false;

        foreach (preg_split('/\s+/', $sRegisteredUris, -1, PREG_SPLIT_NO_EMPTY) as $sRegisteredUri) {
            if ($sInputUri === $sRegisteredUri)
                return true;

            if (self::isMcpLoopbackUri($sRegisteredUri) && self::isMcpLoopbackUri($sInputUri)) {
                $aIn = parse_url($sInputUri);
                $aReg = parse_url($sRegisteredUri);
                if (strtolower($aIn['host']) === strtolower($aReg['host']) && ($aIn['path'] ?? '/') === ($aReg['path'] ?? '/'))
                    return true;
            }
        }

        return false;
    }

    /**
     * A redirect an MCP client may register (BxOAuthModule::actionRegister): https:// with a host and no user info or
     * fragment, or a loopback one.
     */
    public static function isMcpRedirectUri($sUri)
    {
        if (!is_string($sUri) || strlen($sUri) > 255 || preg_match('/\s/', $sUri))
            return false;

        $a = parse_url($sUri);
        if (!is_array($a) || empty($a['host']) || isset($a['user']) || isset($a['pass']) || isset($a['fragment']))
            return false;

        return ($a['scheme'] ?? '') === 'https' || self::isMcpLoopbackUri($sUri);
    }

    /**
     * http://127.0.0.1/..., http://[::1]/... or http://localhost/... with no user info or fragment.
     */
    public static function isMcpLoopbackUri($sUri)
    {
        $a = parse_url((string)$sUri);
        if (!is_array($a) || ($a['scheme'] ?? '') !== 'http' || isset($a['user']) || isset($a['pass']) || isset($a['fragment']))
            return false;
        return in_array(strtolower($a['host'] ?? ''), array('127.0.0.1', '[::1]', 'localhost'), true);
    }

    protected function _getRegisteredRedirectUri()
    {
        $aClient = $this->clientStorage->getClientDetails($this->getClientId());
        return is_array($aClient) && !empty($aClient['redirect_uri']) ? $aClient['redirect_uri'] : '';
    }
}

/** @} */
