<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertEquals;

final class GetUserProfileTest extends AbstractCidaasTestParent {
    private static $getAccessTokenInvalidResponse = '{"error":"Access denied for this resource","refnumber":"1603218944318-f1508e83-e50b-477a-af32-747e03d5f1a6"}';

    private static function userProfileResponse() {
        return '{"sub":"' . self::$SUB . '","identities":[{"provider":"self","identityId":"3f9555f9-ac03-4d33-9cdb-432e1bce140f","email":"user@widas.de","email_verified":true,"mobile_number":"","mobile_number_verified":false}],"email":"user@widas.de"}';
    }

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

    public function test_getUserProfile_withAccessTokenAndNoSub_serverCalledWithAccessToken() {
        $this->mock->append(new Response(200, [], self::userProfileResponse()));

        $this->responsePromise->then(function ($accessToken) {
            return $this->provider->getUserProfile($accessToken);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/userinfo', $request->getUri()->getPath());
        assertEquals('Bearer ' . self::$ACCESS_TOKEN, $request->getHeader('Authorization')[0]);
    }

    public function test_getUserProfile_withAccessTokenAndSub_serverCalledWithSubAndAccessToken() {
        $this->mock->append(new Response(200, [], self::userProfileResponse()));

        $this->responsePromise->then(function ($accessToken) {
            return $this->provider->getUserProfile($accessToken, self::$SUB);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/userinfo/' . self::$SUB, $request->getUri()->getPath());
        assertEquals('Bearer ' . self::$ACCESS_TOKEN, $request->getHeader('Authorization')[0]);
    }

    public function test_getUserProfile_withAccessToken_returnsUserProfileFromServer() {
        $this->mock->append(new Response(200, [], self::userProfileResponse()));

        $response = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->getUserProfile($accessToken);
        })->wait();
        assertEquals(self::$SUB, $response['sub']);
        assertEquals($_ENV['USER_NAME'], $response['identities'][0]['email']);
        assertEquals($_ENV['USER_NAME'], $response['email']);
    }

    public function test_getUserProfile_withAccessTokenAndInvalidSub_returnsUserProfileFromServer() {
        $this->mock->append(new Response(200, [], self::userProfileResponse()));

        $response = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->getUserProfile($accessToken, 'invalidsub');
        })->wait();
        assertEquals(self::$SUB, $response['sub']);
        assertEquals($_ENV['USER_NAME'], $response['identities'][0]['email']);
        assertEquals($_ENV['USER_NAME'], $response['email']);
    }

    public function test_getUserProfile_withInvalidAccessToken_returnsErrorResult() {
        $this->mock->append(new Response(401, [], self::$getAccessTokenInvalidResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->getUserProfile('aa' . $accessToken);
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
