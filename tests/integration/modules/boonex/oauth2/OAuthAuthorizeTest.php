<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The OAuth 2 server over HTTP (/m/oauth2/auth, /m/oauth2/token), for its two kinds of clients.
 *
 * - A client as sites always had them (a secret or none, its registered redirect, no PKCE): every
 *   request is answered the way it always was. These cases run with API v2 off, as installed.
 * - A native app (`una-desktop`, the desktop app's client for API v2): PKCE is required, its
 *   loopback redirect matches any port, errors go back to the app, the consent page says what it
 *   asks for. It is built in (no row in bx_oauth_clients) and the server knows it only while
 *   API v2 is on; with API v2 off its id is like any other.
 *
 * Needs the OAuth2 server module and the test user (UNA_TEST_USER_EMAIL) with a profile; skips
 * otherwise. Clients, codes and tokens the cases make are removed after each of them.
 */
#[Group('integration')]
class OAuthAuthorizeTest extends BxDolIntegrationTestCase
{
    private const NATIVE_APP = 'una-desktop';
    private const OPTION_API_V2 = 'sys_api_v2_enable';

    private static $_oServer;

    private $_sApiV2Enable;
    private $_aClients = [];
    private $_aCodes = [];
    private $_aAccessTokens = [];
    private $_aRefreshTokens = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth'))
            $this->markTestSkipped('bx_oauth is not installed.');

        $this->_sApiV2Enable = getParam(self::OPTION_API_V2);
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aCodes as $sCode)
            $oDb->query("DELETE FROM `bx_oauth_authorization_codes` WHERE `authorization_code` = :c", ['c' => $sCode]);
        foreach ($this->_aAccessTokens as $sToken)
            $oDb->query("DELETE FROM `bx_oauth_access_tokens` WHERE `access_token` = :t", ['t' => $sToken]);
        foreach ($this->_aRefreshTokens as $sToken)
            $oDb->query("DELETE FROM `bx_oauth_refresh_tokens` WHERE `refresh_token` = :t", ['t' => $sToken]);
        foreach ($this->_aClients as $sClientId)
            foreach (['bx_oauth_authorization_codes', 'bx_oauth_access_tokens', 'bx_oauth_refresh_tokens', 'bx_oauth_clients'] as $sTable)
                $oDb->query("DELETE FROM `" . $sTable . "` WHERE `client_id` = :c", ['c' => $sClientId]);

        if ($this->_sApiV2Enable !== null && getParam(self::OPTION_API_V2) !== $this->_sApiV2Enable)
            setParam(self::OPTION_API_V2, $this->_sApiV2Enable);

        parent::tearDown();
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$_oServer) {
            self::$_oServer->stop();
            self::$_oServer = null;
        }
        parent::tearDownAfterClass();
    }

    // a client as sites always had them

    public function testSecretlessClientSignsInWithoutPkceAndGetsThePageAsItWas(): void
    {
        $this->apiV2(false);
        list($oAccount, $sCookie) = $this->signedInUser();
        $iProfile = (int)$oAccount->getProfilesIds()[0];

        $sRedirect = 'https://client.example/cb';
        $sClientId = $this->client(null, $sRedirect, 'basic');
        $aQuery = ['client_id' => $sClientId, 'response_type' => 'code', 'scope' => 'basic', 'redirect_uri' => $sRedirect, 'state' => 'x'];

        // no code_challenge: a client with no secret always gets the consent page, and nothing asks it for PKCE
        $a = $this->auth('GET', $aQuery, $sCookie);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNull(BxDolTestPhpServer::header($a, 'location'));
        $this->assertConsentPageAsItWas($a['body']);
        $this->assertConsentButtons($a['body'], $iProfile);

        $sCode = $this->approve($this->consentForm($a['body']), $iProfile, $sCookie, $sRedirect);
        $this->assertNull($this->codeChallenge($sCode));

        // no secret and no code_verifier at the token endpoint either
        $a = $this->token(['grant_type' => 'authorization_code', 'code' => $sCode, 'redirect_uri' => $sRedirect, 'client_id' => $sClientId]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNotEmpty($a['json']['access_token'] ?? '');
        $this->assertSame('basic', $a['json']['scope']);
    }

    public function testCodeChallengeOfAConfidentialClientIsIgnored(): void
    {
        $this->apiV2(false);
        list($oAccount, $sCookie) = $this->signedInUser();
        $iProfile = (int)$oAccount->getProfilesIds()[0];

        $sRedirect = 'https://client.example/cb';
        $sSecret = bin2hex(random_bytes(16));
        $sClientId = $this->client($sSecret, $sRedirect, 'basic');

        // neither a challenge that is no S256 challenge nor a method the server never honoured is refused
        $aQuery = ['client_id' => $sClientId, 'response_type' => 'code', 'scope' => 'basic', 'redirect_uri' => $sRedirect, 'state' => 'x',
            'code_challenge' => 'short', 'code_challenge_method' => 'plain'];
        $a = $this->auth('GET', $aQuery, $sCookie);

        if ($a['status'] === 200) {
            // several profiles: the page asks which one, and carries no challenge
            $this->assertConsentPageAsItWas($a['body']);
            $sCode = $this->approve($this->consentForm($a['body']), $iProfile, $sCookie, $sRedirect);
        } else {
            // one profile: approved without the page
            $this->assertSame(302, $a['status'], $a['body']);
            $sCode = $this->codeFrom($a, $sRedirect);
        }
        $this->assertNull($this->codeChallenge($sCode), 'the challenge is not kept');

        // so the token endpoint asks for no code_verifier
        $a = $this->token(['grant_type' => 'authorization_code', 'code' => $sCode, 'redirect_uri' => $sRedirect, 'client_id' => $sClientId, 'client_secret' => $sSecret]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNotEmpty($a['json']['access_token'] ?? '');
    }

    public function testRegisteredRedirectOfAClientMatchesAsAPrefix(): void
    {
        $this->apiV2(false);
        list(, $sCookie) = $this->signedInUser();

        // also a loopback address: only a native app's redirect has rules of its own
        foreach (['https://client.example/cb', 'http://127.0.0.1/cb'] as $sRegistered) {
            $sClientId = $this->client(null, $sRegistered, 'basic');
            $aQuery = ['client_id' => $sClientId, 'response_type' => 'code', 'scope' => 'basic', 'state' => 'x'];

            $a = $this->auth('GET', $aQuery + ['redirect_uri' => $sRegistered . '/more?x=1'], $sCookie);
            $this->assertSame(200, $a['status'], $sRegistered);
            $this->assertSame($sRegistered . '/more?x=1', $this->consentForm($a['body'])['redirect_uri'], $sRegistered);
        }

        // another port is another prefix
        $a = $this->auth('GET', $aQuery + ['redirect_uri' => 'http://127.0.0.1:47021/cb'], $sCookie);
        $this->assertNull(BxDolTestPhpServer::header($a, 'location'));
        $this->assertStringContainsString('The redirect URI provided is missing or does not match', $a['body']);
        $this->assertStringNotContainsString('id="bx-auth-form"', $a['body']);
    }

    public function testAuthorizeErrorsOfAClientStayOnTheSite(): void
    {
        $this->apiV2(false);
        list(, $sCookie) = $this->signedInUser();

        $sRedirect = 'https://client.example/cb';
        $sClientId = $this->client(null, $sRedirect, 'basic');
        $aQuery = ['client_id' => $sClientId, 'response_type' => 'code', 'redirect_uri' => $sRedirect];

        // the redirect is valid, and the error is still shown on the site's own page
        foreach ([
            'The state parameter is required' => ['scope' => 'basic'],
            'An unsupported scope was requested' => ['scope' => 'service', 'state' => 'x'],
            'Invalid or missing response type' => ['scope' => 'basic', 'state' => 'x', 'response_type' => 'nothing'],
        ] as $sError => $aChange) {
            $a = $this->auth('GET', array_merge($aQuery, $aChange), $sCookie);
            $this->assertNull(BxDolTestPhpServer::header($a, 'location'), $sError);
            $this->assertStringContainsString($sError, $a['body']);
        }
    }

    public function testApiScopeIsOnlyForClientsRegisteredForIt(): void
    {
        $this->apiV2(false);
        list(, $sCookie) = $this->signedInUser();
        $sRedirect = 'https://client.example/cb';

        // a client with no scopes of its own may ask for the site's scopes, and `api` is not one of them
        $sClientId = $this->client(null, $sRedirect, '');
        $aQuery = ['client_id' => $sClientId, 'response_type' => 'code', 'redirect_uri' => $sRedirect, 'state' => 'x'];
        $a = $this->auth('GET', $aQuery + ['scope' => 'api'], $sCookie);
        $this->assertStringContainsString('An unsupported scope was requested', $a['body']);
        $this->assertStringNotContainsString('id="bx-auth-form"', $a['body']);
        $this->assertSame(200, $this->auth('GET', $aQuery + ['scope' => 'service'], $sCookie)['status']);

        // a client a site registered for `api` (/m/oauth2/com) gets its consent page with no new lines
        $sClientId = $this->client(null, $sRedirect, 'api');
        $a = $this->auth('GET', ['client_id' => $sClientId, 'scope' => 'api'] + $aQuery, $sCookie);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertConsentPageAsItWas($a['body']);
    }

    // a native app

    public function testNativeAppSignsInWithPkceOnly(): void
    {
        $this->apiV2(true);
        list($oAccount, $sCookie) = $this->signedInUser();
        $iProfile = (int)$oAccount->getProfilesIds()[0];

        $sRedirect = 'http://127.0.0.1:47031/callback';
        $sVerifier = rtrim(strtr(base64_encode(random_bytes(48)), '+/', '-_'), '=');
        $sChallenge = rtrim(strtr(base64_encode(hash('sha256', $sVerifier, true)), '+/', '-_'), '=');
        $aQuery = ['client_id' => self::NATIVE_APP, 'response_type' => 'code', 'scope' => 'api', 'redirect_uri' => $sRedirect, 'state' => 's1'];

        // no challenge, or one that is not S256: no code, and the error goes back to the app, which waits for it
        foreach ([
            'no challenge' => [],
            'plain' => ['code_challenge' => $sVerifier, 'code_challenge_method' => 'plain'],
            'no method' => ['code_challenge' => $sChallenge],
            'too short' => ['code_challenge' => 'short', 'code_challenge_method' => 'S256'],
        ] as $sCase => $aChange) {
            $a = $this->auth('GET', array_merge($aQuery, $aChange), $sCookie);
            $this->assertSame(302, $a['status'], $sCase);
            $sLocation = (string)BxDolTestPhpServer::header($a, 'location');
            $this->assertStringStartsWith($sRedirect . '?', $sLocation, $sCase);
            parse_str((string)parse_url($sLocation, PHP_URL_QUERY), $aBack);
            $this->assertSame('invalid_request', $aBack['error'] ?? '', $sCase);
            $this->assertSame('s1', $aBack['state'] ?? '', $sCase);
            $this->assertArrayNotHasKey('code', $aBack, $sCase);
        }

        // the id as it is written: in capitals it is no client at all
        $a = $this->auth('GET', array_merge($aQuery, ['client_id' => strtoupper(self::NATIVE_APP), 'code_challenge' => $sChallenge, 'code_challenge_method' => 'S256']), $sCookie);
        $this->assertNull(BxDolTestPhpServer::header($a, 'location'));
        $this->assertStringContainsString('The client id supplied is invalid', $a['body']);

        // S256: the consent page, always, which says what the app may do and where the browser goes back to
        $a = $this->auth('GET', $aQuery + ['code_challenge' => $sChallenge, 'code_challenge_method' => 'S256'], $sCookie);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(4, substr_count($a['body'], '<li class="bx-auth-scope">'));
        $this->assertSame(4, preg_match_all('#<span class="bx-auth-scope-icon" aria-hidden="true">\s*<(svg|i) #', $a['body']), 'each line has the site\'s check icon');
        $this->assertStringContainsString(' ' . _t('_bx_oauth_authorize_can') . '</p>', $a['body'], 'the list is led in by the first line');
        $this->assertStringNotContainsString('<h3', (string)substr($a['body'], (int)strpos($a['body'], 'id="bx-auth-form"'), 4000), 'no headings inside the block');
        foreach (['read', 'write', 'messages', 'profiles'] as $sScope)
            $this->assertStringContainsString(_t('_bx_oauth_authorize_can_' . $sScope), $a['body']);
        $this->assertStringContainsString('<strong>127.0.0.1:47031</strong>', $a['body']);
        $this->assertConsentButtons($a['body'], $iProfile);
        // the terms notice, in the block's footer
        $this->assertMatchesRegularExpression('#<div class="bx-db-footer[^"]*">[^<]*<a href="[^"]*terms[^"]*">#', $a['body']);
        $aForm = $this->consentForm($a['body']);
        $this->assertSame($sChallenge, $aForm['code_challenge'] ?? '');
        $this->assertSame('S256', $aForm['code_challenge_method'] ?? '');

        // the challenge is part of what the form posts back: without it there is no code
        $aNoChallenge = array_diff_key($aForm, ['code_challenge' => 1, 'code_challenge_method' => 1]);
        $a = $this->auth('POST', array_merge($aNoChallenge, ['profile_id' => (string)$iProfile]), $sCookie);
        $this->assertStringNotContainsString('code=', (string)BxDolTestPhpServer::header($a, 'location'));

        $sCode = $this->approve($aForm, $iProfile, $sCookie, $sRedirect);
        $this->assertSame($sChallenge, $this->codeChallenge($sCode), 'the challenge is kept with the code');

        // the token endpoint wants the verifier of that challenge
        $aToken = ['grant_type' => 'authorization_code', 'code' => $sCode, 'redirect_uri' => $sRedirect, 'client_id' => self::NATIVE_APP];
        $a = $this->token($aToken);
        $this->assertSame(400, $a['status'], $a['body']);
        $this->assertSame('code_verifier_missing', $a['json']['error']);
        $a = $this->token($aToken + ['code_verifier' => strrev($sVerifier)]);
        $this->assertSame(400, $a['status'], $a['body']);
        $this->assertSame('code_verifier_mismatch', $a['json']['error']);

        $a = $this->token($aToken + ['code_verifier' => $sVerifier]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('api', $a['json']['scope']);
        $this->assertNotEmpty($a['json']['refresh_token'] ?? '');
        $sAccess = $a['json']['access_token'];
        $this->assertSame($iProfile, (int)BxDolDb::getInstance()->getOne("SELECT `user_id` FROM `bx_oauth_access_tokens` WHERE `access_token` = :t", ['t' => $sAccess]));

        // a new access token for the refresh token, and both can be revoked
        $a = $this->token(['grant_type' => 'refresh_token', 'refresh_token' => $a['json']['refresh_token'], 'client_id' => self::NATIVE_APP]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertNotEmpty($a['json']['access_token'] ?? '');
        foreach ($this->_aRefreshTokens as $sToken)
            $this->assertSame(200, $this->revoke($sToken, 'refresh_token')['status']);
        $this->assertSame(200, $this->revoke($sAccess, 'access_token')['status']);
        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_oauth_access_tokens` WHERE `access_token` = :t", ['t' => $sAccess]));
    }

    public function testNativeAppRedirectIsItsLoopbackAddressOnAnyPort(): void
    {
        $this->apiV2(true);
        list(, $sCookie) = $this->signedInUser();

        $aQuery = ['client_id' => self::NATIVE_APP, 'response_type' => 'code', 'scope' => 'api', 'state' => 'x',
            'code_challenge' => str_repeat('c', 43), 'code_challenge_method' => 'S256'];

        foreach (['http://127.0.0.1:47032/callback', 'http://127.0.0.1:5/callback', 'http://127.0.0.1/callback'] as $sRedirect) {
            $a = $this->auth('GET', $aQuery + ['redirect_uri' => $sRedirect], $sCookie);
            $this->assertSame(200, $a['status'], $sRedirect);
            $this->assertSame($sRedirect, $this->consentForm($a['body'])['redirect_uri']);
        }

        // nothing else, so no prefix of it either; the error stays on the site, there is nowhere to send it
        foreach ([
            'http://127.0.0.1:47032/callback/more',
            'http://127.0.0.1:47032/callback?x=1',
            'http://127.0.0.1:47032/other',
            'http://localhost:47032/callback',
            'http://127.0.0.1.example.com/callback',
            'https://127.0.0.1:47032/callback',
            'http://user@127.0.0.1:47032/callback',
        ] as $sRedirect) {
            $a = $this->auth('GET', $aQuery + ['redirect_uri' => $sRedirect], $sCookie);
            $this->assertNull(BxDolTestPhpServer::header($a, 'location'), $sRedirect);
            $this->assertStringContainsString('The redirect URI provided is missing or does not match', $a['body'], $sRedirect);
            $this->assertStringNotContainsString('id="bx-auth-form"', $a['body'], $sRedirect);
        }
    }

    public function testNativeAppIsUnknownWhileApiV2IsOff(): void
    {
        $this->apiV2(false);
        list(, $sCookie) = $this->signedInUser();

        // as a site that never had the client answers
        $a = $this->auth('GET', ['client_id' => self::NATIVE_APP, 'response_type' => 'code', 'scope' => 'api', 'state' => 'x',
            'redirect_uri' => 'http://127.0.0.1:47033/callback', 'code_challenge' => str_repeat('d', 43), 'code_challenge_method' => 'S256'], $sCookie);
        $this->assertNull(BxDolTestPhpServer::header($a, 'location'));
        $this->assertStringContainsString('The client id supplied is invalid', $a['body']);
        $this->assertStringNotContainsString('id="bx-auth-form"', $a['body']);

        // and no token for a refresh token it was given while API v2 was on
        $sRefresh = bin2hex(random_bytes(20));
        BxDolDb::getInstance()->query("INSERT INTO `bx_oauth_refresh_tokens` (`refresh_token`, `client_id`, `user_id`, `expires`, `scope`) VALUES (:t, :c, :u, :e, 'api')", [
            't' => $sRefresh, 'c' => self::NATIVE_APP, 'u' => (int)$this->bxAccount('user')->getProfilesIds()[0], 'e' => date('Y-m-d H:i:s', time() + 600),
        ]);
        $this->_aRefreshTokens[] = $sRefresh;
        $aToken = ['grant_type' => 'refresh_token', 'refresh_token' => $sRefresh, 'client_id' => self::NATIVE_APP];
        $a = $this->token($aToken);
        $this->assertSame(400, $a['status'], $a['body']);
        // a client the site does not have: only the default grant type is set up for it
        $this->assertSame('unsupported_grant_type', $a['json']['error']);
        $a = $this->token(['grant_type' => 'authorization_code', 'code' => 'x', 'redirect_uri' => 'http://127.0.0.1:47033/callback', 'client_id' => self::NATIVE_APP]);
        $this->assertSame(400, $a['status'], $a['body']);
        $this->assertSame('invalid_client', $a['json']['error']);

        $this->apiV2(true);
        $a = $this->token($aToken);
        $this->assertSame(200, $a['status'], $a['body']);
    }

    public function testNativeAppIsBuiltInAndOpensNothingElse(): void
    {
        $oDb = BxDolDb::getInstance();
        if ((int)$oDb->getOne("SELECT COUNT(*) FROM `bx_oauth_clients` WHERE `client_id` = :c", ['c' => self::NATIVE_APP]))
            $this->markTestSkipped('The site has a client of its own with the id of the native app.');

        // nothing installs a row for it, so Studio lists the clients the site made and no other,
        // and "public" services (/m/oauth2/com), which want a registered client, don't take its id
        $sInstall = (string)file_get_contents(BX_DIRECTORY_PATH_MODULES . 'boonex/oauth2/install/sql/install.sql');
        $this->assertStringNotContainsString(self::NATIVE_APP, $sInstall);

        $sRegistered = $this->client(null, 'https://client.example/cb', 'basic');
        foreach ([false, true] as $bOn) {
            $this->apiV2($bOn);
            $a = $this->com(self::NATIVE_APP);
            $this->assertSame(403, $a['status'], $a['body']);
            $this->assertSame('access_denied', $a['json']['error'] ?? '');
            $this->assertNotSame(403, $this->com($sRegistered)['status'], 'a registered client may call it');
        }
    }

    public function testASitesOwnClientOfThatIdWorksAsItAlwaysDidWhileApiV2IsOff(): void
    {
        $oDb = BxDolDb::getInstance();
        if ((int)$oDb->getOne("SELECT COUNT(*) FROM `bx_oauth_clients` WHERE `client_id` = :c", ['c' => self::NATIVE_APP]))
            $this->markTestSkipped('The site has a client of its own with the id of the native app.');

        $this->apiV2(false);
        list($oAccount, $sCookie) = $this->signedInUser();
        $iProfile = (int)$oAccount->getProfilesIds()[0];

        $sRedirect = 'https://client.example/cb';
        $oDb->query("INSERT INTO `bx_oauth_clients` (`title`, `client_id`, `client_secret`, `redirect_uri`, `grant_types`, `scope`) VALUES ('OAuthAuthorizeTest', :c, NULL, :r, 'authorization_code', 'basic')", ['c' => self::NATIVE_APP, 'r' => $sRedirect]);
        $this->_aClients[] = self::NATIVE_APP;
        $aQuery = ['client_id' => self::NATIVE_APP, 'response_type' => 'code', 'scope' => 'basic', 'redirect_uri' => $sRedirect, 'state' => 'x'];

        // API v2 off: a client like any other, with its own redirect and no PKCE
        $a = $this->auth('GET', $aQuery, $sCookie);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertConsentPageAsItWas($a['body']);
        $sCode = $this->approve($this->consentForm($a['body']), $iProfile, $sCookie, $sRedirect);
        $a = $this->token(['grant_type' => 'authorization_code', 'code' => $sCode, 'redirect_uri' => $sRedirect, 'client_id' => self::NATIVE_APP]);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('basic', $a['json']['scope']);

        // API v2 on: the id is the native app's, whatever the table has
        $this->apiV2(true);
        $a = $this->auth('GET', $aQuery, $sCookie);
        $this->assertStringContainsString('The redirect URI provided is missing or does not match', $a['body']);
        $this->assertStringNotContainsString('id="bx-auth-form"', $a['body']);
    }

    // helpers

    private function apiV2(bool $bOn): void
    {
        if ((bool)getParam(self::OPTION_API_V2) !== $bOn)
            setParam(self::OPTION_API_V2, $bOn ? 'on' : ''); // the HTTP server reads it from the database
    }

    /**
     * A client as Studio or a module adds one; without a secret when $sSecret is null.
     */
    private function client(?string $sSecret, string $sRedirect, string $sScope): string
    {
        $sClientId = 'oauthtest' . bin2hex(random_bytes(4));
        BxDolDb::getInstance()->query("INSERT INTO `bx_oauth_clients` (`title`, `client_id`, `client_secret`, `redirect_uri`, `grant_types`, `scope`) VALUES ('OAuthAuthorizeTest', :c, :s, :r, 'authorization_code,refresh_token', :o)", [
            'c' => $sClientId, 's' => $sSecret, 'r' => $sRedirect, 'o' => $sScope,
        ]);
        $this->_aClients[] = $sClientId;
        return $sClientId;
    }

    /**
     * The test user signed in with a session.
     * @return array [account, Cookie header value]
     */
    private function signedInUser(): array
    {
        $oAccount = $this->bxAccount('user');
        if (!BxDolProfile::getInstanceByAccount($oAccount->id()) || !$oAccount->getProfilesIds())
            $this->markTestSkipped('The test user has no profile.');

        bx_login($oAccount->id());
        return [$oAccount, BX_DOL_SESSION_COOKIE . '=' . BxDolSession::getInstance()->getId()];
    }

    /**
     * /m/oauth2/auth (modules/index.php routes it).
     */
    private function auth(string $sMethod, array $aParams, string $sCookie): array
    {
        if ($sMethod === 'GET')
            return $this->request('GET', '/modules/index.php?r=oauth2/auth&' . http_build_query($aParams), ['Cookie' => $sCookie]);

        return $this->request('POST', '/modules/index.php?r=oauth2/auth', ['Cookie' => $sCookie, 'Content-Type' => 'application/x-www-form-urlencoded'], http_build_query($aParams));
    }

    /**
     * /m/oauth2/token; tokens it gives are removed after the test.
     */
    private function token(array $aParams): array
    {
        $a = $this->request('POST', '/modules/index.php?r=oauth2/token', ['Content-Type' => 'application/x-www-form-urlencoded'], http_build_query($aParams));
        if (!empty($a['json']['access_token']))
            $this->_aAccessTokens[] = $a['json']['access_token'];
        if (!empty($a['json']['refresh_token']))
            $this->_aRefreshTokens[] = $a['json']['refresh_token'];
        return $a;
    }

    /**
     * /m/oauth2/com: a "public" service of the system, called as this client.
     */
    private function com(string $sClientId): array
    {
        return $this->request('GET', '/modules/index.php?r=oauth2/com/get_products_names&' . http_build_query(['module' => 'system', 'class' => 'TemplServices', 'client_id' => $sClientId]));
    }

    private function revoke(string $sToken, string $sHint): array
    {
        return $this->request('POST', '/modules/index.php?r=oauth2/revoke', ['Content-Type' => 'application/x-www-form-urlencoded'], http_build_query(['token' => $sToken, 'token_type_hint' => $sHint]));
    }

    private function request(string $sMethod, string $sUri, array $aHeaders = [], string $sBody = ''): array
    {
        if (!self::$_oServer) {
            $aUrl = parse_url(BX_DOL_URL_ROOT);
            self::$_oServer = new BxDolTestPhpServer(BX_DIRECTORY_PATH_ROOT, null, $aUrl['host'] . (empty($aUrl['port']) ? '' : ':' . $aUrl['port']));
        }

        $a = self::$_oServer->request($sMethod, $sUri, $aHeaders, $sBody);
        if (stripos((string)BxDolTestPhpServer::header($a, 'transfer-encoding'), 'chunked') !== false) {
            $sOut = '';
            $s = $a['body'];
            while (($i = strpos($s, "\r\n")) !== false && ($iLen = hexdec(substr($s, 0, $i))) > 0) {
                $sOut .= substr($s, $i + 2, $iLen);
                $s = substr($s, $i + 2 + $iLen + 2);
            }
            $a['body'] = $sOut;
        }
        $a['json'] = json_decode($a['body'], true);
        return $a;
    }

    /**
     * The hidden fields of the consent form, values decoded as a browser would.
     */
    private function consentForm(string $sHtml): array
    {
        $this->assertSame(1, preg_match('#<div id="bx-auth-form".*?</form>#s', $sHtml, $m), 'the consent form');
        preg_match_all('#<input type="hidden" name="([^"]+)"[^>]*value="([^"]*)"#', $m[0], $aInputs, PREG_SET_ORDER);
        $aForm = [];
        foreach ($aInputs as $a)
            $aForm[$a[1]] = html_entity_decode($a[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return $aForm;
    }

    /**
     * The consent page of a client that is no native app: the fields it always had (the profile is
     * the pressed button's value), and nothing between its first line and its form.
     */
    private function assertConsentPageAsItWas(string $sHtml): void
    {
        $this->assertSame(['csrf_token', 'client_id', 'response_type', 'redirect_uri', 'scope', 'state'], array_keys($this->consentForm($sHtml)));
        $this->assertStringNotContainsString('bx-auth-scope', $sHtml);
        $this->assertStringNotContainsString('bx-auth-note', $sHtml);
        $this->assertStringNotContainsString('code_challenge', $sHtml);
        $this->assertStringNotContainsString('bx_if:', $sHtml);
        $this->assertStringNotContainsString('bx_repeat:', $sHtml);
        $this->assertMatchesRegularExpression('#<p class="bx-auth-lead">[^\r\n]*</p>\r?\n    <form method="post"#', $sHtml);
    }

    /**
     * The consent form is answered with its own buttons, no script: one per profile, and Cancel (profile 0).
     */
    private function assertConsentButtons(string $sHtml, int $iProfileId): void
    {
        $this->assertSame(1, preg_match('#<div id="bx-auth-form".*?</form>#s', $sHtml, $m), 'the consent form');
        $this->assertMatchesRegularExpression('#<button type="submit" name="profile_id" value="' . $iProfileId . '" class="[^"]*bx-btn-primary[^"]*"#', $m[0]);
        $this->assertSame(1, preg_match_all('#<button type="submit" name="profile_id" value="0"#', $m[0]));
        $this->assertStringNotContainsString('onclick', $m[0]);
    }

    /**
     * Choose the profile on the consent form; the code that comes back on the redirect.
     */
    private function approve(array $aForm, int $iProfileId, string $sCookie, string $sRedirect): string
    {
        $a = $this->auth('POST', array_merge($aForm, ['profile_id' => (string)$iProfileId]), $sCookie);
        $this->assertSame(302, $a['status'], $a['body']);
        return $this->codeFrom($a, $sRedirect);
    }

    private function codeFrom(array $aResponse, string $sRedirect): string
    {
        $sLocation = (string)BxDolTestPhpServer::header($aResponse, 'location');
        $this->assertStringStartsWith($sRedirect . '?', $sLocation);
        parse_str((string)parse_url($sLocation, PHP_URL_QUERY), $aBack);
        $this->assertNotEmpty($aBack['code'] ?? '', $sLocation);
        $this->_aCodes[] = $aBack['code'];
        return $aBack['code'];
    }

    private function codeChallenge(string $sCode): ?string
    {
        $aRow = BxDolDb::getInstance()->getRow("SELECT `code_challenge`, `code_challenge_method` FROM `bx_oauth_authorization_codes` WHERE `authorization_code` = :c", ['c' => $sCode]);
        $this->assertNotEmpty($aRow, 'the code is stored');
        return $aRow['code_challenge'];
    }
}
