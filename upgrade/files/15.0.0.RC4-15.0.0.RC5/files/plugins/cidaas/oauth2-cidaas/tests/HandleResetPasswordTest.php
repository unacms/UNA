<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertArrayNotHasKey;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertTrue;

final class HandleResetPasswordTest extends AbstractCidaasTestParent {
    private static $RESET_CODE = '641985';
    private static $EXCHANGE_ID = 'c74b059f-3615-4446-a6c7-433707814a9a';
    private static $RESET_REQUEST_ID = 'aea6496b-a017-4486-9592-3b559ce59dcc';
    private static $invalidResetCodeResponse = '{"success":false,"status":400,"error":{"code":10008,"moreInfo":"","type":"UsersException","status":400,"referenceNumber":"1603285905180-06ce0217-3ca7-41cf-bb28-b66691dd8d62","error":"Invalid code"}}';
    private static $invalidRequestIdResponse = '{"success":false,"status":400,"error":{"code":10002,"moreInfo":"","type":"UsersException","status":400,"referenceNumber":"1603285848732-d0f9aab1-00db-46f6-93a1-42c9c1a1a1b6","error":"Invalid resetRequestId"}}';

    private static function resetSuccessfulResponse() {
        return '{"success":true,"status":200,"data":{"exchangeId":"' . self::$EXCHANGE_ID . '","resetRequestId":"' . self::$RESET_REQUEST_ID . '"}}';
    }

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();

        $this->responsePromise = $this->provider->getRequestId();
    }

    public function test_handleResetPassword_withValidCodeAndResetRequestId_serverCalledWithCodeAndResetRequestId() {
        $this->mock->append(new Response(200, [], self::resetSuccessfulResponse()));

        $this->responsePromise->then(function ($requestId) {
            return $this->provider->handleResetPassword(self::$RESET_CODE, self::$RESET_REQUEST_ID);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/resetpassword/validatecode', $request->getUri()->getPath());
        $body = json_decode($request->getBody(), true);
        assertEquals(self::$RESET_CODE, $body['code']);
        assertEquals(self::$RESET_REQUEST_ID, $body['resetRequestId']);
    }

    public function test_handleResetPassword_withValidEmail_returnedSuccessResultFromServer() {
        $this->mock->append(new Response(200, [], self::resetSuccessfulResponse()));

        $response = $this->responsePromise->then(function ($requestId) {
            return $this->provider->handleResetPassword(self::$RESET_CODE, self::$RESET_REQUEST_ID);
        })->wait();

        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertEquals(self::$EXCHANGE_ID, $response['data']['exchangeId']);
        assertEquals(self::$RESET_REQUEST_ID, $response['data']['resetRequestId']);
    }

    public function test_handleResetPassword_withInvalidResetRequestId_returnErrorFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidRequestIdResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->handleResetPassword(self::$RESET_CODE, 'aaa' . self::$RESET_REQUEST_ID);
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

    public function test_handleResetPassword_withInvalidResetCode_returnErrorFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidResetCodeResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->handleResetPassword('aaa' . self::$RESET_CODE, self::$RESET_REQUEST_ID);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(400, $response['status']);
            assertEquals(10008, $response['error']['code']);
        }
    }
}
