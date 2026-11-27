<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertTrue;

final class ValidateAccessTokenTest extends AbstractCidaasTestParent {
    private static $validAccessTokenResponse = '{"active":true,"token_type":"Bearer","aud":"7d5abdbc-8186-4c82-9943-f71506aaf700","exp":1603449786,"iat":1603363386,"iss":"https://nightlybuild.cidaas.de","jti":"11aa3792-5309-49a8-b405-aac64f36ce0b","roles":["USER"],"scopes":["openid"],"sub":"df838cf7-dc95-44de-a1cc-5c0eafb0f6db","scope":"openid"}';
    private static $invalidAccessTokenResponse = '{"active":false,"token_type":"Bearer"}';
    private static $invalidBearerAccessTokenResponse = '{"error":"invalid_request","error_description":"The request is missing a required parameter : invalid authorization header access_token passed"}';

    private $accessTokenToValidate;
    private $accessTokenForApiAccess;

    protected function setUp(): void {
        $this->setUpCidaas();
        $this->mock->append(new Response(200, [], self::loginSuccessfulResponse()), new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        $this->accessTokenToValidate = $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            return $accessTokenResponse['access_token'];
        })->wait();
    }

    public function test_validateAccessToken_withAccessTokenToValidateAndAccessTokenForApiAccesss_serverCalledWithAccessTokens() {
        $this->mock->append(
            new Response(200, [], self::getRequestIdResponse()),
            new Response(200, [], self::loginSuccessfulResponse()),
            new Response(200, [], self::getAccessTokenSuccessfulResponse()),
            new Response(200, [], self::$validAccessTokenResponse)
        );

        $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            $this->accessTokenForApiAccess = $accessTokenResponse['access_token'];
            $this->provider->validateAccessToken($this->accessTokenToValidate, $this->accessTokenForApiAccess);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('POST', $request->getMethod());
        assertEquals('/token-srv/introspect', $request->getUri()->getPath());
        assertEquals('Bearer ' . $this->accessTokenForApiAccess, $request->getHeader('Authorization')[0]);
        $parsedBody = json_decode($request->getBody(), true);
        assertEquals('access_token', $parsedBody['token_type_hint']);
        assertEquals($this->accessTokenToValidate, $parsedBody['token']);
    }

    public function test_validateAccessToken_withAccessTokenToValidateAndNoAccessTokenForApiAccesss_serverCalledWithAccessTokenAndBasicAuthentication() {
        $this->mock->append(
            new Response(200, [], self::getRequestIdResponse()),
            new Response(200, [], self::loginSuccessfulResponse()),
            new Response(200, [], self::getAccessTokenSuccessfulResponse()),
            new Response(200, [], self::$validAccessTokenResponse)
        );

        $this->provider->validateAccessToken($this->accessTokenToValidate)->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('POST', $request->getMethod());
        assertEquals('/token-srv/introspect', $request->getUri()->getPath());
        assertEquals('Basic ' . base64_encode($_ENV['CIDAAS_CLIENT_ID'] . ":" . $_ENV['CIDAAS_CLIENT_SECRET']), $request->getHeader('Authorization')[0]);
        $parsedBody = json_decode($request->getBody(), true);
        assertEquals('access_token', $parsedBody['token_type_hint']);
        assertEquals($this->accessTokenToValidate, $parsedBody['token']);
    }

    public function test_validateAccessToken_withAccessTokenToValidateAndAccessTokenForApiAccesss_returnsResponseFromServer() {
        $this->mock->append(
            new Response(200, [], self::getRequestIdResponse()),
            new Response(200, [], self::loginSuccessfulResponse()),
            new Response(200, [], self::getAccessTokenSuccessfulResponse()),
            new Response(200, [], self::$validAccessTokenResponse)
        );

        $responsePromise = $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            $this->accessTokenForApiAccess = $accessTokenResponse['access_token'];
            return $this->provider->validateAccessToken($this->accessTokenToValidate, $this->accessTokenForApiAccess);
        });

        $response = $responsePromise->wait();
        assertTrue($response['active']);
    }

    public function test_validateAccessToken_withInvalidAccessTokenToValidateAndAccessTokenForApiAccesss_returnsResponseFromServer() {
        $this->mock->append(
            new Response(200, [], self::getRequestIdResponse()),
            new Response(200, [], self::loginSuccessfulResponse()),
            new Response(200, [], self::getAccessTokenSuccessfulResponse()),
            new Response(200, [], self::$invalidAccessTokenResponse)
        );

        $responsePromise = $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            $this->accessTokenForApiAccess = $accessTokenResponse['access_token'];
            return $this->provider->validateAccessToken('aa' . $this->accessTokenToValidate, $this->accessTokenForApiAccess);
        });

        $response = $responsePromise->wait();
        assertFalse($response['active']);
    }

    public function test_validateAccessToken_withAccessTokenToValidateAndInvalidAccessTokenForApiAccesss_returnsResponseFromServer() {
        $this->mock->append(
            new Response(200, [], self::getRequestIdResponse()),
            new Response(200, [], self::loginSuccessfulResponse()),
            new Response(200, [], self::getAccessTokenSuccessfulResponse()),
            new Response(400, [], self::$invalidBearerAccessTokenResponse)
        );

        $responsePromise = $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        })->then(function ($accessTokenResponse) {
            $this->accessTokenForApiAccess = $accessTokenResponse['access_token'];
            return $this->provider->validateAccessToken($this->accessTokenToValidate, 'aaa' . $this->accessTokenForApiAccess);
        });

        try {
            $responsePromise->wait();
            self::fail('promise should throw an exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertEquals('invalid_request', $response['error']);
        }
    }
}
