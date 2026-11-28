<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Cidaas\OAuth2\Client\Provider\Cidaas;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertNull;

final class LoginCallbackTest extends TestCase {
    const PARAM_1_KEY = 'param1Key';
    const PARAM_2_KEY = 'param2Key';
    const PARAM_1_VALUE = 'param1Value';
    const PARAM_2_VALUE = 'param2Value';
    private MockHandler $mock;
    private Cidaas $provider;

    protected function setUp(): void {
        Dotenv::createImmutable(__DIR__, 'testconfig.env')->load();
        $_GET = [];
        if (!isset($_SESSION) || !is_array($_SESSION)) {
            $_SESSION = [];
        }
        unset($_SESSION['cidaas_oauth_state'], $_SESSION['cidaas_code_verifier']);

        // Discovery stub is queued only so constructing Cidaas stays consistent with other tests.
        // loginCallback() must not perform HTTP (no token exchange) — asserted below via mock count.
        $this->mock = new MockHandler([
            new Response(200, [], '{"issuer":"https://nightlybuild.cidaas.de","authorization_endpoint":"https://nightlybuild.cidaas.de/authz-srv/authz"}'),
        ]);
        $this->provider = new Cidaas(
            $_ENV['CIDAAS_BASE_URL_WITH_PROXY'],
            $_ENV['CIDAAS_CLIENT_ID'],
            $_ENV['CIDAAS_CLIENT_SECRET'],
            $_ENV['CIDAAS_REDIRECT_URI'],
            HandlerStack::create($this->mock)
        );
    }

    public function test_loginCallback_withGetParametersSet_returnsAllGetParameterElements() {
        $_GET = [
            self::PARAM_1_KEY => self::PARAM_1_VALUE,
            self::PARAM_2_KEY => self::PARAM_2_VALUE,
        ];

        $parameters = $this->provider->loginCallback();

        assertEquals(self::PARAM_1_VALUE, $parameters[self::PARAM_1_KEY]);
        assertEquals(self::PARAM_2_VALUE, $parameters[self::PARAM_2_KEY]);
        $this->assertNoHttpPerformed();
    }

    public function test_loginCallback_withMatchingOAuthState_returnsParameters(): void
    {
        $_SESSION['cidaas_oauth_state'] = 'expected-state';
        $_GET = [
            'code' => 'auth-code',
            'state' => 'expected-state',
        ];

        $parameters = $this->provider->loginCallback();

        // loginCallback only validates state and returns $_GET — it does not exchange the code.
        assertEquals('auth-code', $parameters['code']);
        assertEquals('expected-state', $parameters['state']);
        $this->assertNoHttpPerformed();
    }

    public function test_loginCallback_withInvalidOAuthState_throws(): void
    {
        $_SESSION['cidaas_oauth_state'] = 'expected-state';
        $_GET = [
            'code' => 'auth-code',
            'state' => 'attacker-state',
        ];

        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid or missing OAuth state');
        try {
            $this->provider->loginCallback();
        } finally {
            $this->assertNoHttpPerformed();
        }
    }

    public function test_loginCallback_withSessionStateButNoStateParameter_throws(): void
    {
        $_SESSION['cidaas_oauth_state'] = 'expected-state';
        $_GET = ['code' => 'auth-code'];

        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionMessage('Invalid or missing OAuth state');
        $this->provider->loginCallback();
    }

    public function test_loginCallback_withCodeButNoSessionState_throws(): void
    {
        // Login CSRF: victim never started a login, attacker injects their own code.
        $_GET = ['code' => 'attacker-code'];

        $this->expectException(\UnexpectedValueException::class);
        $this->expectExceptionMessage('No OAuth state stored in session');
        try {
            $this->provider->loginCallback();
        } finally {
            $this->assertNoHttpPerformed();
        }
    }

    public function test_loginCallback_withCodeButNoSessionStateAndStateNotRequired_returnsParameters(): void
    {
        $_GET = ['code' => 'auth-code'];

        $parameters = $this->provider->loginCallback(false);

        assertEquals('auth-code', $parameters['code']);
        $this->assertNoHttpPerformed();
    }

    public function test_loginCallback_withStateConsumed_rejectsReplay(): void
    {
        $_SESSION['cidaas_oauth_state'] = 'expected-state';
        $_GET = ['code' => 'auth-code', 'state' => 'expected-state'];
        $this->provider->loginCallback();

        $this->expectException(\UnexpectedValueException::class);
        $this->provider->loginCallback();
    }

    private function assertNoHttpPerformed(): void
    {
        assertNull($this->mock->getLastRequest());
        assertEquals(1, $this->mock->count(), 'discovery mock must remain unused after loginCallback');
    }
}
