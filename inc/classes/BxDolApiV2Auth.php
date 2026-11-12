<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Who an API v2 request acts as.
 *
 * - `Authorization: Bearer <token>`: an OAuth 2 access token from the OAuth2 server module
 *   (bx_oauth) with the `api` scope. The request acts as the token's profile, for this request
 *   only: no session is started and the session cookie is ignored.
 * - No Bearer token: the site's own session cookie, for pages of the site itself. A request
 *   that changes something must then come from the site's origin (same scheme, host and port)
 *   or an allowed one (sys_api_origins), so another site can't post a form with the visitor's
 *   cookie. Other Authorization schemes (such as HTTP Basic in front of a staging site) are
 *   not API credentials and are ignored.
 * - Neither: a guest.
 */
class BxDolApiV2Auth
{
    const MODE_GUEST = 'guest';
    const MODE_TOKEN = 'token';
    const MODE_SESSION = 'session';

    const SCOPE = 'api';

    protected $_sMode = self::MODE_GUEST;
    protected $_iProfileId = 0;
    protected $_aToken = null;
    protected $_sCredential = '';

    /**
     * @param string $sMethod HTTP method of the request
     */
    public static function fromRequest($sMethod)
    {
        $o = new static();

        $sAuth = self::_getHeader('Authorization');
        if (self::isBearer($sAuth)) {
            $o->_authToken($sAuth);
            return $o;
        }

        if (($iProfileId = (int)bx_get_logged_profile_id()) > 0) {
            if (!in_array($sMethod, ['GET', 'HEAD', 'OPTIONS'], true) && !self::_isAllowedOrigin(self::_getHeader('Origin')))
                throw new BxDolApiV2Problem(403, 'origin_not_allowed', 'Requests signed in with the site cookie must come from the site');

            $o->_sMode = self::MODE_SESSION;
            $o->_iProfileId = $iProfileId;
            $o->_sCredential = (string)BxDolSession::getSessionCookie();
        }

        return $o;
    }

    public function getMode()
    {
        return $this->_sMode;
    }

    public function getProfileId()
    {
        return $this->_iProfileId;
    }

    /**
     * What the request was signed in with: the bearer token, or the session cookie's id; '' for
     * a guest. Never sent or logged; BxDolApiV2Idempotency keeps only a digest of it.
     */
    public function getCredential()
    {
        return $this->_sCredential;
    }

    public function getClientId()
    {
        return $this->_aToken['client_id'] ?? null;
    }

    /**
     * After the account switched profiles within this request.
     */
    public function setProfile($oProfile)
    {
        $this->_iProfileId = $oProfile->id();
        if ($this->_sMode === self::MODE_TOKEN)
            $GLOBALS['glForceCurrentProfileId'] = $oProfile->id();
    }

    protected function _authToken($sHeader)
    {
        $aUnauthorized = ['WWW-Authenticate' => 'Bearer realm="api", error="invalid_token"'];

        if (!preg_match('/^Bearer\s+(\S+)$/i', trim($sHeader), $m))
            throw new BxDolApiV2Problem(401, 'invalid_token', 'Send an access token as "Authorization: Bearer <token>"', [], $aUnauthorized);

        $aToken = false;
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth'))
            $aToken = bx_srv('bx_oauth', 'get_access_token_data', [$m[1]]);

        if (empty($aToken) || !is_array($aToken))
            throw new BxDolApiV2Problem(401, 'invalid_token', 'The access token is unknown or has expired', [], $aUnauthorized);

        if (!in_array(self::SCOPE, $aToken['scopes'], true))
            throw new BxDolApiV2Problem(403, 'insufficient_scope', 'The access token needs the "' . self::SCOPE . '" scope', [], ['WWW-Authenticate' => 'Bearer realm="api", error="insufficient_scope", scope="' . self::SCOPE . '"']);

        $oProfile = BxDolProfile::getInstance($aToken['profile_id']);
        $oAccount = $oProfile ? $oProfile->getAccountObject() : false;
        if (!$oProfile || !$oAccount || $oAccount->isLocked())
            throw new BxDolApiV2Problem(401, 'invalid_token', 'The account of this token is not available', [], $aUnauthorized);

        // The token belongs to the account; like a site session it acts as the account's current
        // profile, so switching profiles (PUT /me/active-profile) works the same as on the site.
        // A profile of another account (admins can switch to any) is never taken from there.
        $iCurrentId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($oAccount->id());
        $oCurrent = $iCurrentId ? BxDolProfile::getInstance($iCurrentId) : false;
        if ($oCurrent && (int)$oCurrent->getAccountId() === (int)$oAccount->id())
            $oProfile = $oCurrent;

        if ($oProfile->getStatus() != BX_PROFILE_STATUS_ACTIVE)
            throw new BxDolApiV2Problem(401, 'invalid_token', 'The profile of this token is not active', [], $aUnauthorized);

        $this->_actAs($oProfile, $oAccount);

        $this->_sMode = self::MODE_TOKEN;
        $this->_iProfileId = $oProfile->id();
        $this->_aToken = $aToken;
        $this->_sCredential = $m[1];
    }

    /**
     * Act as the profile for the rest of this request, the way UNA's AI tools and content
     * services do, so every permission check sees that profile and account.
     */
    protected function _actAs($oProfile, $oAccount)
    {
        $aInfo = $oAccount->getInfo();
        $iRole = (int)($aInfo['role'] ?? 0);

        $GLOBALS['logged'] = [
            'admin' => (bool)($iRole & BX_DOL_ROLE_ADMIN),
            'member' => (bool)($iRole & BX_DOL_ROLE_MEMBER),
        ];
        $GLOBALS['glForceCurrentProfileId'] = $oProfile->id();
    }

    protected static function _isAllowedOrigin($sOrigin)
    {
        if ($sOrigin === '')
            return true; // not a browser cross-site request: browsers send Origin on every POST, PUT, PATCH and DELETE

        $sNormalized = self::origin($sOrigin);
        if ($sNormalized !== null && $sNormalized === self::origin(BX_DOL_URL_ROOT))
            return true;

        return (bool)BxDolApiQuery::getInstance()->getOrigin($sOrigin);
    }

    /**
     * Whether an Authorization header carries a Bearer token (RFC 6750); other schemes are not
     * API credentials.
     */
    public static function isBearer($sHeader)
    {
        return (bool)preg_match('/^\s*Bearer(\s|$)/i', (string)$sHeader);
    }

    /**
     * The origin of a URL as browsers serialize it, scheme://host[:port] with the default port
     * left out, or null for something that is not an http(s) URL.
     */
    public static function origin($sUrl)
    {
        $a = parse_url((string)$sUrl);
        if (!is_array($a) || empty($a['host']))
            return null;

        $sScheme = strtolower($a['scheme'] ?? '');
        if (!in_array($sScheme, ['http', 'https'], true))
            return null;

        $iPort = isset($a['port']) ? (int)$a['port'] : ($sScheme === 'https' ? 443 : 80);
        $bDefault = ($sScheme === 'https' && $iPort === 443) || ($sScheme === 'http' && $iPort === 80);
        return $sScheme . '://' . strtolower($a['host']) . ($bDefault ? '' : ':' . $iPort);
    }

    protected static function _getHeader($sName)
    {
        $sKey = 'HTTP_' . strtoupper(str_replace('-', '_', $sName));
        if (!empty($_SERVER[$sKey]))
            return (string)$_SERVER[$sKey];
        if (!empty($_SERVER['REDIRECT_' . $sKey]))
            return (string)$_SERVER['REDIRECT_' . $sKey];

        if (function_exists('getallheaders'))
            foreach ((array)getallheaders() as $k => $v)
                if (strcasecmp($k, $sName) === 0)
                    return (string)$v;

        return '';
    }
}

/** @} */
