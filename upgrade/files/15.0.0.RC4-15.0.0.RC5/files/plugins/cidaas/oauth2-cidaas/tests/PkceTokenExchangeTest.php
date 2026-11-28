<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Cidaas\OAuth2\Client\Provider\Cidaas;
use Cidaas\OAuth2\Client\Provider\GrantType;
use Dotenv\Dotenv;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use function PHPUnit\Framework\assertArrayHasKey;
use function PHPUnit\Framework\assertArrayNotHasKey;
use function PHPUnit\Framework\assertEquals;

final class PkceTokenExchangeTest extends TestCase {
    private const DISCOVERY = '{"issuer":"https://nightlybuild.cidaas.de","authorization_endpoint":"https://nightlybuild.cidaas.de/authz-srv/authz","token_endpoint":"https://nightlybuild.cidaas.de/token-srv/token","introspection_endpoint":"https://nightlybuild.cidaas.de/token-srv/introspect"}';
    private const TOKEN_RESPONSE = '{"token_type":"Bearer","access_token":"access","refresh_token":"refresh","expires_in":86400}';

    private MockHandler $mock;

    protected function setUp(): void {
        Dotenv::createImmutable(__DIR__, 'testconfig.env')->load();
        if (!isset($_SESSION) || !is_array($_SESSION)) {
            $_SESSION = [];
        }
        unset($_SESSION['cidaas_oauth_state'], $_SESSION['cidaas_code_verifier']);
        $this->mock = new MockHandler([new Response(200, [], self::DISCOVERY)]);
    }

    private function createProvider(string $clientSecret): Cidaas {
        return new Cidaas(
            $_ENV['CIDAAS_BASE_URL'],
            $_ENV['CIDAAS_CLIENT_ID'],
            $clientSecret,
            $_ENV['CIDAAS_REDIRECT_URI'],
            HandlerStack::create($this->mock)
        );
    }

    /**
     * @return array<string, string>
     */
    private function lastRequestBody(): array {
        parse_str((string)$this->mock->getLastRequest()->getBody(), $body);
        return $body;
    }

    public function test_getAccessToken_withPkceEnabled_sendsAndClearsVerifier(): void {
        $_SESSION['cidaas_code_verifier'] = 'stored-verifier';
        $this->mock->append(new Response(200, [], self::TOKEN_RESPONSE));

        $this->createProvider('')->getAccessToken(GrantType::AuthorizationCode, 'code', '', true)->wait();

        assertEquals('stored-verifier', $this->lastRequestBody()['code_verifier']);
        assertArrayNotHasKey('cidaas_code_verifier', $_SESSION);
    }

    public function test_getAccessToken_withStoredVerifierAndPkceFlagOmitted_stillSendsVerifier(): void {
        $_SESSION['cidaas_code_verifier'] = 'stored-verifier';
        $this->mock->append(new Response(200, [], self::TOKEN_RESPONSE));

        $this->createProvider('')->getAccessToken(GrantType::AuthorizationCode, 'code')->wait();

        assertEquals('stored-verifier', $this->lastRequestBody()['code_verifier']);
        assertArrayNotHasKey('cidaas_code_verifier', $_SESSION);
    }

    public function test_getAccessToken_withoutStoredVerifierAndPkceFlagOmitted_sendsNoVerifier(): void {
        $this->mock->append(new Response(200, [], self::TOKEN_RESPONSE));

        $this->createProvider('secret')->getAccessToken(GrantType::AuthorizationCode, 'code')->wait();

        assertArrayNotHasKey('code_verifier', $this->lastRequestBody());
    }

    /**
     * @runInSeparateProcess
     */
    public function test_getAccessToken_withPkceFlagOmitted_resumesExistingSessionToFindVerifier(): void {
        session_save_path(sys_get_temp_dir());
        session_start();
        $_SESSION['cidaas_code_verifier'] = 'stored-verifier';
        $sessionId = session_id();
        session_write_close();
        $_SESSION = [];
        $_COOKIE[session_name()] = $sessionId;
        $this->mock->append(new Response(200, [], self::TOKEN_RESPONSE));

        $this->createProvider('')->getAccessToken(GrantType::AuthorizationCode, 'code')->wait();

        assertEquals('stored-verifier', $this->lastRequestBody()['code_verifier']);
        assertArrayNotHasKey('cidaas_code_verifier', $_SESSION);
        session_destroy();
    }

    public function test_getAccessToken_withPkceEnabledAndNoStoredVerifier_throws(): void {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('PKCE code_verifier missing from session');

        $this->createProvider('')->getAccessToken(GrantType::AuthorizationCode, 'code', '', true)->wait();
    }

    public function test_getAccessToken_publicClient_omitsClientSecret(): void {
        $this->mock->append(
            new Response(200, [], self::TOKEN_RESPONSE),
            new Response(200, [], self::TOKEN_RESPONSE)
        );
        $provider = $this->createProvider('');

        $provider->getAccessToken(GrantType::AuthorizationCode, 'code')->wait();
        assertArrayNotHasKey('client_secret', $this->lastRequestBody());

        $provider->getAccessToken(GrantType::RefreshToken, '', 'refresh')->wait();
        assertArrayNotHasKey('client_secret', $this->lastRequestBody());
    }

    public function test_getAccessToken_confidentialClient_sendsClientSecret(): void {
        $this->mock->append(new Response(200, [], self::TOKEN_RESPONSE));

        $this->createProvider('secret')->getAccessToken(GrantType::AuthorizationCode, 'code')->wait();

        $body = $this->lastRequestBody();
        assertArrayHasKey('client_secret', $body);
        assertEquals('secret', $body['client_secret']);
    }

    public function test_getAccessToken_nonArrayJsonResponse_throwsUnexpectedValue(): void {
        $this->mock->append(new Response(200, [], 'null'));

        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionMessage('Expected JSON object or array in response, got NULL');

        $this->createProvider('secret')->getAccessToken(GrantType::AuthorizationCode, 'code')->wait();
    }

    public function test_getAccessToken_clientCredentialsWithoutSecret_throws(): void {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('client secret is required for client_credentials flow');

        $this->createProvider('')->getAccessToken(GrantType::ClientCredentials)->wait();
    }

    public function test_validateAccessToken_withoutSecretOrApiToken_throws(): void {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('client secret or accessTokenForApiAccess is required');

        $this->createProvider('')->validateAccessToken('token-to-validate');
    }
}
