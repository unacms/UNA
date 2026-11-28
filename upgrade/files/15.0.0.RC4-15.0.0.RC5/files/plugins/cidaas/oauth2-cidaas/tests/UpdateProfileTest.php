<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertTrue;

final class UpdateProfileTest extends AbstractCidaasTestParent {
    private static $getAccessTokenInvalidResponse = '{"error":"Access denied for this resource","refnumber":"1603218944318-f1508e83-e50b-477a-af32-747e03d5f1a6"}';
    private static $updateProfileSuccessfulResponse = '{"success":true,"status":200,"data":{"updated":true}}';

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();
        $this->mock->append(new Response(200, [], self::loginSuccessfulResponse()), new Response(200, [], self::getAccessTokenSuccessfulResponse()));

        $this->responsePromise = $this->provider->getRequestId()->then(function ($requestId) {
            return $this->provider->loginWithCredentials($_ENV['USER_NAME'], $_ENV['USERNAME_TYPE'], $_ENV['PASSWORD'], $requestId);
        })->then(function ($credentialsResponse) {
            $code = $credentialsResponse['data']['code'];
            return $this->provider->getAccessToken(GrantType::AuthorizationCode, $code);
        });
    }

    public function test_updateProfile_withSubFieldsAndAccessToken_serverCalledWithSubFieldsAndAccessToken() {
        $this->mock->append(new Response(200, [], self::$updateProfileSuccessfulResponse));

        $this->responsePromise->then(function ($accessTokenResponse) {
            $sub = $accessTokenResponse['sub'];
            $accessToken = $accessTokenResponse['access_token'];
            return $this->provider->updateProfile($sub, [
                'given_name' => 'changed_given_name'
            ], $accessToken);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('PUT', $request->getMethod());
        assertEquals('/users-srv/user/profile/' . self::$SUB, $request->getUri()->getPath());
        assertEquals('Bearer ' . self::$ACCESS_TOKEN, $request->getHeader('Authorization')[0]);
        $parsedBody = json_decode($request->getBody(), true);
        assertEquals('changed_given_name', $parsedBody['given_name']);
    }

    public function test_updateProfile_withSubFieldsAndAccessToken_returnedResultFromServer() {
        $this->mock->append(new Response(200, [], self::$updateProfileSuccessfulResponse));

        $response = $this->responsePromise->then(function ($accessTokenResponse) {
            $sub = $accessTokenResponse['sub'];
            $accessToken = $accessTokenResponse['access_token'];
            return $this->provider->updateProfile($sub, [
                'given_name' => 'changed_given_name'
            ], $accessToken);
        })->wait();

        assertEquals(200, $response['status']);
        assertTrue($response['success']);
        assertTrue($response['data']['updated']);
    }

    public function TODO_test_updateProfile_withUnchangeableField_returnedError() {
        // TODO check in real system, after error is fixed...
        $this->mock->append(new Response(200, [], self::$updateProfileSuccessfulResponse));

        $promise = $this->responsePromise->then(function ($accessTokenResponse) {
            $sub = $accessTokenResponse['sub'];
            $accessToken = $accessTokenResponse['access_token'];
            return $this->provider->updateProfile($sub, [
                'sub' => 'foo'
            ], $accessToken);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(401, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertEquals('Access denied for this resource', $response['error']);
        }
    }

    public function test_updateProfile_withInvalidAccessToken_returnsErrorResult() {
        $this->mock->append(new Response(401, [], self::$getAccessTokenInvalidResponse));

        $promise = $this->responsePromise->then(function ($accessTokenResponse) {
            $sub = $accessTokenResponse['sub'];
            $accessToken = $accessTokenResponse['access_token'];
            return $this->provider->updateProfile($sub, [], 'aa' . $accessToken);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(401, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertEquals('Access denied for this resource', $response['error']);
        }
    }
}
