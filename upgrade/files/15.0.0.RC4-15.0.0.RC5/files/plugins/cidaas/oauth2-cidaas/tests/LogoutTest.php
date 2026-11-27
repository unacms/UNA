<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertStringContainsString;
use function PHPUnit\Framework\assertStringNotContainsString;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertArrayNotHasKey;

final class LogoutTest extends AbstractCidaasTestParent {
    private static $getAccessTokenInvalidResponse = '{"success":false,"status":400,"error":{"code":24007,"moreInfo":"","type":"LoginException","status":400,"referenceNumber":"1603275867825-5044e54b-9cd3-4dbc-9e61-fa33235bed87","error":"invalid token passed"}}';
    private static $postLogoutUri = 'http://localhost:8000/logout';

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();
        $this->mock->append(new Response(200, [], self::loginSuccessfulResponse()), new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        $this->responsePromise = $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            return $accessTokenResponse['access_token'];
        });
    }

    public function test_logout_withAccessTokenAndPostLogoutUri_serverCalledWithAccessToken() {
        $this->mock->append(new Response(302, [], ''));

        $this->responsePromise->then(function ($accessToken) {
            return $this->provider->logout($accessToken, self::$postLogoutUri);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('POST', $request->getMethod());
        assertEquals('/session/end_session', $request->getUri()->getPath());
        assertEquals('', $request->getUri()->getQuery());
        assertEquals('application/json', $request->getHeaderLine('Content-Type'));
        $body = json_decode((string)$request->getBody(), true);
        assertEquals(self::$ACCESS_TOKEN, $body['access_token_hint']);
        assertEquals(self::$postLogoutUri, $body['post_logout_redirect_uri']);
    }

    public function test_logout_withAccessTokenAndNoPostLogoutUri_serverCalledWithAccessToken() {
        $this->mock->append(new Response(302, [], ''));

        $this->responsePromise->then(function ($accessToken) {
            return $this->provider->logout($accessToken);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('POST', $request->getMethod());
        assertEquals('/session/end_session', $request->getUri()->getPath());
        assertEquals('', $request->getUri()->getQuery());
        assertEquals('application/json', $request->getHeaderLine('Content-Type'));
        $body = json_decode((string)$request->getBody(), true);
        assertEquals(self::$ACCESS_TOKEN, $body['access_token_hint']);
        assertArrayNotHasKey('post_logout_redirect_uri', $body);
    }

    public function test_logout_withAccessTokenAndPostLogoutUri_returnsRedirectResponse() {
        $this->mock->append(new Response(302, ['location' => self::$postLogoutUri], ''));

        $response = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->logout($accessToken, self::$postLogoutUri);
        })->wait();

        assertEquals(302, $response->getStatusCode());
        assertEquals(self::$postLogoutUri, $response->getHeader('location')[0]);
    }

    public function test_logout_withInvalidAccessToken_returnsErrorResult() {
        $this->mock->append(new Response(401, [], self::$getAccessTokenInvalidResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->logout('aaa' . $accessToken);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(401, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(400, $response['status']);
            assertEquals(24007, $response['error']['code']);
        }
    }
}
