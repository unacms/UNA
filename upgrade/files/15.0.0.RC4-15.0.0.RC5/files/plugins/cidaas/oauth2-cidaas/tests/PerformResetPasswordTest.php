<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertTrue;

final class PerformResetPasswordTest extends AbstractCidaasTestParent {
    private static $PASSWORD = 'newPassword';
    private static $CONFIRM_MATCHING_PASSWORD = 'newPassword';
    private static $CONFIRM_NON_MATCHING_PASSWORD = 'otherPassword';
    private static $EXCHANGE_ID = 'c74b059f-3615-4446-a6c7-433707814a9a';
    private static $RESET_REQUEST_ID = 'aea6496b-a017-4486-9592-3b559ce59dcc';
    private static $passwordsNotMatchingResponse = '{"success":false,"status":417,"error":{"code":10009,"moreInfo":"","type":"UsersException","status":417,"referenceNumber":"1603286589224-6ff85395-f644-4c36-bf82-83f537c5f4dc","error":"password and confirmPassword not matching"}}';
    private static $invalidExchangeIdOrRequestIdResponse = '{"success":false,"status":400,"error":{"code":10002,"moreInfo":"","type":"UsersException","status":400,"referenceNumber":"1603286538956-9e188e71-1bd5-4101-93ae-8c9e681a28ec","error":"Invalid resetRequestId or exchangeId"}}';
    private static $resetSuccessfulResponse = '{"success":true,"status":200,"data":{"reseted":true}}';

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();

        $this->responsePromise = $this->provider->getRequestId();
    }

    public function test_handleResetPassword_withValidPasswordsExchangeIdAndRequestId_serverCalledWithPasswordsExchangeIdAndResetRequestId() {
        $this->mock->append(new Response(200, [], self::$resetSuccessfulResponse));

        $this->responsePromise->then(function ($requestId) {
            return $this->provider->resetPassword(self::$PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, self::$EXCHANGE_ID, self::$RESET_REQUEST_ID);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/resetpassword/accept', $request->getUri()->getPath());
        $body = json_decode($request->getBody(), true);
        assertEquals(self::$PASSWORD, $body['password']);
        assertEquals(self::$CONFIRM_MATCHING_PASSWORD, $body['confirmPassword']);
        assertEquals(self::$EXCHANGE_ID, $body['exchangeId']);
        assertEquals(self::$RESET_REQUEST_ID, $body['resetRequestId']);
    }

    public function test_handleResetPassword_withValidPasswordsExchangeIdAndRequestId_returnsSuccessResultFromServer() {
        $this->mock->append(new Response(200, [], self::$resetSuccessfulResponse));

        $response = $this->responsePromise->then(function ($requestId) {
            return $this->provider->resetPassword(self::$PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, self::$EXCHANGE_ID, self::$RESET_REQUEST_ID);
        })->wait();

        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertTrue($response['data']['reseted']);
    }


    public function test_handleResetPassword_withNonMatchingPasswords_returnErrorFromServer() {
        $this->mock->append(new Response(417, [], self::$passwordsNotMatchingResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->resetPassword(self::$PASSWORD, self::$CONFIRM_NON_MATCHING_PASSWORD, self::$EXCHANGE_ID, self::$RESET_REQUEST_ID);
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

    public function test_handleResetPassword_withInvalidExchangeId_returnErrorFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidExchangeIdOrRequestIdResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->resetPassword(self::$PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, 'aaa' . self::$EXCHANGE_ID, self::$RESET_REQUEST_ID);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(400, $response['status']);
            assertEquals(10002, $response['error']['code']);
        }
    }

    public function test_handleResetPassword_withInvalidResetRequestId_returnErrorFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidExchangeIdOrRequestIdResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->resetPassword(self::$PASSWORD, self::$CONFIRM_MATCHING_PASSWORD, self::$EXCHANGE_ID, 'aaa' . self::$RESET_REQUEST_ID);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(400, $response['status']);
            assertEquals(10002, $response['error']['code']);
        }
    }
}
