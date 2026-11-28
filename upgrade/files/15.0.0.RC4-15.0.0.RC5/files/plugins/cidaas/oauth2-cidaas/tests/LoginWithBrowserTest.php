<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\Cidaas;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertStringContainsString;
use function PHPUnit\Framework\assertStringNotContainsString;
use function PHPUnit\Framework\assertArrayNotHasKey;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertNotEmpty;
use function PHPUnit\Framework\assertNotEquals;

final class LoginWithBrowserTest extends AbstractCidaasTestParent {
    private static $LOGIN_URL = 'http://localhost:1111';

    protected function setUp(): void {
        $this->setUpCidaas(false, false);
    }

    public function test_loginWithBrowser_withRequestId_redirectsToLoginPage() {
        $this->mock->append(new Response(302, ['location' => self::$LOGIN_URL]));

        $this->provider->loginWithBrowser();

        $location = parent::$headers[0];
        assertStringContainsString('Location: https://nightlybuild.cidaas.de/authz-srv/authz?', $location);
        assertStringContainsString(
            http_build_query([
                'client_id' => $_ENV['CIDAAS_CLIENT_ID'],
                'response_type' => 'code',
                'scope' => 'openid profile offline_access',
                'redirect_uri' => $_ENV['CIDAAS_REDIRECT_URI'],
            ]),
            $location
        );
        assertStringContainsString('view_type=login', $location);
        assertStringContainsString('nonce=', $location);
        assertStringContainsString('state=', $location);
    }

    public function test_loginWithBrowser_encodesRedirectUriAndQueryParameters(): void
    {
        $redirectUri = 'http://localhost:8000/callback?foo=bar&x=y';
        $mock = new MockHandler([
            new Response(200, [], '{"issuer":"https://nightlybuild.cidaas.de","authorization_endpoint":"https://nightlybuild.cidaas.de/authz-srv/authz"}'),
        ]);
        $provider = new Cidaas(
            $_ENV['CIDAAS_BASE_URL'],
            $_ENV['CIDAAS_CLIENT_ID'],
            $_ENV['CIDAAS_CLIENT_SECRET'],
            $redirectUri,
            HandlerStack::create($mock),
            false
        );

        $provider->loginWithBrowser('openid', ['locale' => 'de-DE', 'x' => 'a b']);

        $location = parent::$headers[0];
        assertStringContainsString('Location: https://nightlybuild.cidaas.de/authz-srv/authz?', $location);
        assertStringContainsString('redirect_uri=' . urlencode($redirectUri), $location);
        assertStringContainsString(http_build_query(['locale' => 'de-DE', 'x' => 'a b']), $location);
        assertStringContainsString('view_type=login', $location);
        assertStringContainsString('nonce=', $location);
        assertStringContainsString('state=', $location);
    }

    public function test_loginWithBrowser_doesNotAllowQueryParametersToOverrideRequiredOAuthParams(): void
    {
        $this->provider->loginWithBrowser('openid', [
            'client_id' => 'attacker-client',
            'redirect_uri' => 'https://evil.example/callback',
            'response_type' => 'token',
        ]);

        $location = parent::$headers[0];
        assertStringContainsString('client_id=' . urlencode($_ENV['CIDAAS_CLIENT_ID']), $location);
        assertStringContainsString('redirect_uri=' . urlencode($_ENV['CIDAAS_REDIRECT_URI']), $location);
        assertStringContainsString('response_type=code', $location);
        assertStringNotContainsString('attacker-client', $location);
        assertStringNotContainsString('evil.example', $location);
    }

    public function test_loginWithBrowser_doesNotAllowQueryParametersToOverrideStateOrPkce(): void
    {
        $this->provider->loginWithBrowser('openid', [
            'state' => 'attacker-state',
            'code_challenge' => 'attacker-challenge',
            'code_challenge_method' => 'plain',
        ], true);

        parse_str(parse_url(substr(parent::$headers[0], strlen('Location: ')), PHP_URL_QUERY), $query);
        assertEquals($_SESSION['cidaas_oauth_state'], $query['state']);
        assertEquals('S256', $query['code_challenge_method']);
        assertNotEquals('attacker-challenge', $query['code_challenge']);
    }

    public function test_loginWithBrowser_allowsQueryParametersToOverrideNonceAndViewType(): void
    {
        $this->provider->loginWithBrowser('openid', [
            'nonce' => 'caller-nonce',
            'view_type' => 'register',
        ]);

        parse_str(parse_url(substr(parent::$headers[0], strlen('Location: ')), PHP_URL_QUERY), $query);
        assertEquals('caller-nonce', $query['nonce']);
        assertEquals('register', $query['view_type']);
    }

    public function test_loginWithBrowser_withPkce_storesVerifierMatchingS256Challenge(): void
    {
        $this->provider->loginWithBrowser('openid', [], true);

        parse_str(parse_url(substr(parent::$headers[0], strlen('Location: ')), PHP_URL_QUERY), $query);
        $verifier = $_SESSION['cidaas_code_verifier'];
        assertEquals(128, strlen($verifier));
        assertEquals('S256', $query['code_challenge_method']);
        assertEquals(rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '='), $query['code_challenge']);
    }

    public function test_loginWithBrowser_withoutPkce_clearsStaleVerifier(): void
    {
        $_SESSION['cidaas_code_verifier'] = 'stale-verifier';

        $this->provider->loginWithBrowser();

        assertArrayNotHasKey('cidaas_code_verifier', $_SESSION);
        assertStringNotContainsString('code_challenge', parent::$headers[0]);
    }

    public function test_registerWithBrowser_withPkce_addsS256Challenge(): void
    {
        $this->provider->registerWithBrowser('openid', [], true);

        $location = parent::$headers[0];
        assertStringContainsString('view_type=register', $location);
        assertStringContainsString('code_challenge=', $location);
        assertStringContainsString('code_challenge_method=S256', $location);
        assertNotEmpty($_SESSION['cidaas_code_verifier']);
    }

    public function test_registerWithBrowser_encodesRedirectUriAndQueryParameters(): void
    {
        $redirectUri = 'http://localhost:8000/callback?foo=bar&x=y';
        $mock = new MockHandler([
            new Response(200, [], '{"issuer":"https://nightlybuild.cidaas.de","authorization_endpoint":"https://nightlybuild.cidaas.de/authz-srv/authz"}'),
        ]);
        $provider = new Cidaas(
            $_ENV['CIDAAS_BASE_URL'],
            $_ENV['CIDAAS_CLIENT_ID'],
            $_ENV['CIDAAS_CLIENT_SECRET'],
            $redirectUri,
            HandlerStack::create($mock),
            false
        );

        $provider->registerWithBrowser('openid', ['locale' => 'en-US']);

        $location = parent::$headers[0];
        assertStringContainsString('Location: https://nightlybuild.cidaas.de/authz-srv/authz?', $location);
        assertStringContainsString('redirect_uri=' . urlencode($redirectUri), $location);
        assertStringContainsString(http_build_query(['locale' => 'en-US']), $location);
        assertStringContainsString('view_type=register', $location);
        assertStringContainsString('nonce=', $location);
        assertStringContainsString('state=', $location);
    }
}
