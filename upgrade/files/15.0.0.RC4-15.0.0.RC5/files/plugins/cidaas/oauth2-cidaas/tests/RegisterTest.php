<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertIsArray;
use function PHPUnit\Framework\assertNull;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertTrue;
use function PHPUnit\Framework\assertArrayNotHasKey;

final class RegisterTest extends AbstractCidaasTestParent {
    private static $registrationSuccessfulResponse = '{"success":true,"status":200,"data":{"q":"f41aa921-abaa-4494-8a8d-d452184c83b9","sub":"f41aa921-abaa-4494-8a8d-d452184c83b9","userStatus":"VERIFIED","email_verified":false,"suggested_redirect_uri":"https://nightlybuild.cidaas.de/user-ui/login?groupname=default&lang=&view_type=login&requestid=7976992b-6417-4461-be1e-3516255c11c4&view_type=login","suggested_action":"MFA","next_token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjM5NjgzODBkLThjZTItNDIzMS04MzA4LTAyOTE1NmQxN2RkYSJ9.eyJ1YV9oYXNoIjoiZDViNWI4NDJiOGUxOTM4YzIzNDJmMGY5ZTdjMzI0ZWEiLCJzaWQiOiI0MTExZjViYi01NzVjLTRlZWMtOTlhZS0wODhkNjg5MjZhYzkiLCJzdWIiOiJBTk9OWU1PVVMiLCJhdWQiOiI1MjE1NmQ1My0zY2JmLTQzZTctOTZlYi0yNTI4MDNkNGU5Y2EiLCJpYXQiOjE2MDMxOTUxNzksImF1dGhfdGltZSI6MTYwMzE5NTE3OSwiaXNzIjoiaHR0cHM6Ly9uaWdodGx5YnVpbGQuY2lkYWFzLmRlIiwianRpIjoiMTE0OGIzMTctNzUzMy00M2NmLWE3OTEtYjIzMTJhYTIzOWJhIiwic2NvcGVzIjpbXSwiZXhwIjoxNjAzMjgxNTc5fQ.QtvTkzJRSVRreYaQRNlahbWUGrPibawfE473K1CqiO0H3YRF4vo_3_gvjlx1s2gS5cqL-Xu1oCEZaESOBu3O5y8MXGfIRwdQqkXprMYmQcpHf9cyiPsOi8OGmSY0-OTxDqnM8reouEqRS4jobRe5agY2-gL78E9KCdjhLwPfi1Q"}}';
    private static $invalidRequestIdResponse = '{"success":false,"status":400,"error":{"code":10001,"moreInfo":"","type":"UsersException","status":400,"referenceNumber":"1603196016759-c2ff9172-cd0c-4bf6-8294-68858a0a166c","error":"Invalid request id"}}';
    private static $invalidFieldsResponse = '{"success":false,"status":417,"error":{"code":507,"moreInfo":"","type":"UsersException","status":417,"referenceNumber":"1603195110225-53ba4aa1-496d-4fc0-8a0d-87ab62ca7bab","error":"given_name cannot be null"}}';

    private $responsePromise;
    private $fields;

    protected function setUp(): void {
        $this->setUpCidaas();

        $this->responsePromise = $this->provider->getRequestId();
    }

    public function test_register_withValidRequestId_serverCalledWithRequestIdAndLocale() {
        $this->fields = [
            'field1' => 'field1',
            'field2' => 'field2'
        ];
        $this->mock->append(new Response(200, [], self::$registrationSuccessfulResponse));

        $this->responsePromise->then(function ($requestId) {
            return $this->provider->register($this->fields, $requestId);
        })->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('/users-srv/register', $request->getUri()->getPath());
        assertEquals(self::$REQUEST_ID, $request->getHeader('requestId')[0]);
        $parsedBody = json_decode($request->getBody(), true);
        assertEquals('field1', $parsedBody['field1']);
        assertEquals('field2', $parsedBody['field2']);
        assertEquals('self', $parsedBody['provider']);
    }

    public function test_register_withValidRequestIdAndFields_returnsSuccessfulRegistrationFromServer() {
        $this->mock->append(new Response(200, [], self::$registrationSuccessfulResponse));

        $response = $this->responsePromise->then(function ($requestId) {
            return $this->provider->register(['email' => 'user@widas.de',
                'given_name' => 'xxxxx',
                'family_name' => 'yyyyy',
                'password' => '123456',
                'password_echo' => '123456'
            ], $requestId);
        })->wait();

        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertIsArray($response['data']);
    }

    public function test_register_withValidRequestIdAndInvalidFields_returnsInvalidFieldsErrorMessageFromServer() {
        $this->mock->append(new Response(417, [], self::$invalidFieldsResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->register([], $requestId);
        });

        try {
            $promise->wait();
            self::fail('Promise should return exception');
        } catch (ClientException $exception) {
            assertEquals(417, $exception->getCode());
            $response = json_decode($exception->getResponse()->getBody(), true);
            assertFalse($response['success']);
            assertEquals(417, $response['status']);
            assertEquals(507, $response['error']['code']);
            assertArrayNotHasKey('data', $response);
        }
    }

    public function test_register_withInvalidRequestId_returnsInvalidRequestIdErrorMessageFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidRequestIdResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->register(['email' => 'user@widas.de',
                'given_name' => 'xxxxx',
                'family_name' => 'yyyyy',
                'password' => '123456',
                'password_echo' => '123456'
            ], 'aaa' . $requestId);
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
            assertArrayNotHasKey('data', $response);
        }
    }
}
