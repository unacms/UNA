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

final class InitiateResetPasswordTest extends AbstractCidaasTestParent {
    private static $invalidRequestIdResponse = '{"success":false,"status":400,"error":{"code":10001,"moreInfo":"","type":"UsersException","status":400,"referenceNumber":"1603280586488-0eca07a0-5b0e-42e2-95c8-dc9794114968","error":"Invalid request id"}}';
    private static $RPRQ = '9dc40ee4-43b6-4c83-998c-c066b476acec';

    private static function resetSuccessfulResponse() {
        return '{"success":true,"status":200,"data":{"reset_initiated":true,"rprq":"' . self::$RPRQ . '"}}';
    }

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();

        $this->responsePromise = $this->provider->getRequestId();
    }

    public function test_initiateResetPassword_withValidEmail_serverCalledWithEmail() {
        $this->mock->append(new Response(200, [], self::loginSuccessfulResponse()));

        $this->responsePromise->then(function ($requestId) {
            return $this->provider->initiateResetPassword($_ENV['USER_NAME'], $requestId);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/resetpassword/initiate', $request->getUri()->getPath());
        $body = json_decode($request->getBody(), true);
        assertEquals($_ENV['USER_NAME'], $body['email']);
        assertEquals('CODE', $body['processingType']);
        assertEquals('email', $body['resetMedium']);
        assertEquals(self::$REQUEST_ID, $body['requestId']);
    }

    public function test_initiateResetPassword_withValidEmail_returnSuccessResultFromServer() {
        $this->mock->append(new Response(200, [], self::resetSuccessfulResponse()));

        $response = $this->responsePromise->then(function ($requestId) {
            return $this->provider->initiateResetPassword($_ENV['USER_NAME'], $requestId);
        })->wait();

        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertTrue($response['data']['reset_initiated']);
        assertEquals(self::$RPRQ, $response['data']['rprq']);
    }

    public function test_initiateResetPassword_withInvalidEmail_returnErrorFromServer() {
        $this->mock->append(new Response(200, [], self::resetSuccessfulResponse()));

        $response = $this->responsePromise->then(function ($requestId) {
            return $this->provider->initiateResetPassword('invalid@widas.de', $requestId);
        })->wait();
        // TODO auf Fehler umstellen, falls das einer sein sollte...falls nicht, Methode löschen
        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertTrue($response['data']['reset_initiated']);
        assertEquals(self::$RPRQ, $response['data']['rprq']);
    }

    public function test_initiateResetPassword_withValidEmailAndInvalidRequestId_returnErrorFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidRequestIdResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->initiateResetPassword($_ENV['USER_NAME'], 'aaa' . $requestId);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(400, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(400, $response['status']);
            assertEquals(10001, $response['error']['code']);
        }
    }
}
