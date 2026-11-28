<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use Cidaas\OAuth2\Client\Provider\GrantType;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertTrue;

final class ChangePasswordTest extends AbstractCidaasTestParent {
    private static $getAccessTokenInvalidGrantResponse = '{"error":"Access denied for this resource","refnumber":"1603218944318-f1508e83-e50b-477a-af32-747e03d5f1a6"}';
    private static $OLD_PASSWORD = 'password';
    private static $NEW_PASSWORD = 'newPassword';
    private static $CONFIRM_MATCHING_PASSWORD = 'newPassword';
    private static $CONFIRM_NON_MATCHING_PASSWORD = 'wrongNewPassword';
    private static $IDENTITY_ID = '3f9555f9-ac03-4d33-9cdb-432e1bce140f';

    private static $passwordsNotMatchingResponse = '{"success":false,"status":417,"error":{"code":10009,"moreInfo":"","type":"UsersException","status":417,"referenceNumber":"1603199927908-eeacbc28-4637-45fe-9813-7bacaa403d7d","error":"new_password and confirm_password not matching"}}';
    private static $oldPasswordIncorrectResponse = '{"success":false,"status":400,"error":{"code":507,"moreInfo":"","type":"UsersException","status":400,"referenceNumber":"1603200282702-261da448-5e37-49a1-863a-81c3ce44c696","error":"Given old password is incorrect"}}';
    private static $passwordChangeSuccessfulResponse = '{"success":true,"status":200,"data":{"changed":true}}';

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

    public function test_changePassword_withOldAndNewPasswordsIdentityAndAccessToken_serverCalledWithPasswordsIdentityAndAccessToken() {
        $this->mock->append(new Response(200, [], self::$passwordChangeSuccessfulResponse));

        $this->responsePromise->then(function ($accessToken) {
            return $this->provider->changePassword(self::$OLD_PASSWORD, self::$NEW_PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, self::$IDENTITY_ID, $accessToken);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/changepassword', $request->getUri()->getPath());
        assertEquals('Bearer ' . self::$ACCESS_TOKEN, $request->getHeader('Authorization')[0]);
        $parsedBody = json_decode($request->getBody(), true);
        assertEquals(self::$OLD_PASSWORD, $parsedBody['old_password']);
        assertEquals(self::$NEW_PASSWORD, $parsedBody['new_password']);
        assertEquals(self::$CONFIRM_MATCHING_PASSWORD, $parsedBody['confirm_password']);
        assertEquals(self::$IDENTITY_ID, $parsedBody['identityId']);
    }

    public function test_changePassword_withMatchingPasswords_returnsPasswordChangeSuccessful() {
        $this->mock->append(new Response(200, [], self::$passwordChangeSuccessfulResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->changePassword(self::$NEW_PASSWORD, self::$OLD_PASSWORD, self::$OLD_PASSWORD, self::$IDENTITY_ID, $accessToken);
        });

        $response = $promise->wait();

        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertTrue($response['data']['changed']);
    }

    public function test_changePassword_withNonMatchingPasswords_returnsPasswordChangeError() {
        $this->mock->append(new Response(417, [], self::$passwordsNotMatchingResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->changePassword(self::$OLD_PASSWORD, self::$NEW_PASSWORD, self::$CONFIRM_NON_MATCHING_PASSWORD, self::$IDENTITY_ID, $accessToken);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(417, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(417, $response['status']);
            assertEquals(10009, $response['error']['code']);
        }
    }

    public function test_changePassword_withWrongOldPassword_returnsPasswordChangeError() {
        $this->mock->append(new Response(400, [], self::$oldPasswordIncorrectResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->changePassword(self::$OLD_PASSWORD, self::$NEW_PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, self::$IDENTITY_ID, $accessToken);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(400, $response['status']);
            assertEquals(507, $response['error']['code']);
        }
    }

    public function TODO_test_changePassword_withUnknownIdentityId_returnsWrongIdentityIdError() {
        // TODO implement this...currently, there is no error thrown, if identityId is wrong
        $this->mock->append(new Response(400, [], self::$getAccessTokenInvalidGrantResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->changePassword(self::$OLD_PASSWORD, self::$NEW_PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, 'unknownIdentity', $accessToken);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(417, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(417, $response['status']);
            assertEquals(10009, $response['error']['code']);
        }
    }

    public function test_changePassword_withInvalidAccessToken_returnsAccessTokenError() {
        $this->mock->append(new Response(401, [], self::$getAccessTokenInvalidGrantResponse));

        $promise = $this->responsePromise->then(function ($accessToken) {
            return $this->provider->changePassword(self::$OLD_PASSWORD, self::$NEW_PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, self::$IDENTITY_ID, "aaa" . $accessToken);
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
