<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertArrayNotHasKey;
use function PHPUnit\Framework\assertFalse;
use function PHPUnit\Framework\assertIsArray;
use function PHPUnit\Framework\assertNull;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertTrue;

final class GetRegistrationSetupTest extends AbstractCidaasTestParent {
    private static $LOCALE = 'de';
    private static $registrationSetupResponse = '{"success":true,"status":200,"data":[{"dataType":"URL","parent_group_id":"DEFAULT","is_group":false,"fieldKey":"website","fieldType":"SYSTEM","order":16,"readOnly":false,"required":false,"localeText":{"language":"de","name":"Website","locale":"de-de"}},{"dataType":"DATE","parent_group_id":"DEFAULT","is_group":false,"fieldKey":"birthdate","fieldType":"SYSTEM","order":5,"readOnly":false,"required":false,"fieldDefinition":{"maxDate":"2020-05-02T18:30:00.000Z","minDate":"1897-12-31T18:38:50.000Z"},"localeText":{"locale":"de-de","language":"de","name":"Geburtstag","required":"EinGeburtstagwirdbenötigt."}},{"dataType":"TEXT","parent_group_id":"DEFAULT","is_group":true,"fieldKey":"address","fieldType":"SYSTEM","order":1,"readOnly":false,"required":false,"localeText":{"language":"de","name":"Address","locale":"de-de"}},{"dataType":"PASSWORD","parent_group_id":"DEFAULT","is_group":false,"fieldKey":"password","fieldType":"SYSTEM","order":8,"readOnly":false,"required":true,"fieldDefinition":{"applyPasswordPoly":false,"maxLength":25,"minLength":6},"localeText":{"locale":"de-de","language":"de","name":"Passwort","required":"EinPasswortwirdbenötigt.","maxLength":"DasPasswortdarfnichtmehrals20Zeichenlangsein."}},{"dataType":"MOBILE","parent_group_id":"DEFAULT","is_group":false,"fieldKey":"mobile_number","fieldType":"SYSTEM","order":13,"readOnly":false,"required":false,"fieldDefinition":{"verificationRequired":true,"minLength":5,"maxLength":15},"localeText":{"locale":"de-de","language":"de","name":"Telefonnummer","required":"EinMobilewirdbenötigt.","verificationRequired":"Mobileisnotverified"}}]}';
    private static $invalidRequestIdResponse = '{"success":false,"status":400,"error":{"code":10001,"moreInfo":"","type":"RegistrationSetupException","status":400,"referenceNumber":"1603189744233-633c7555-613f-4a23-88c9-65f0173a482b","error":"invalid requestId"}}';

    private $responsePromise;

    protected function setUp(): void {
        $this->setUpCidaas();
        $this->responsePromise = $this->provider->getRequestId();
    }

    public function test_getRegistrationSetup_withValidRequestId_serverCalledWithRequestIdAndLocale() {
        $this->mock->append(new Response(200, [], self::$registrationSetupResponse));

        $this->responsePromise->then(function ($requestId) {
            return $this->provider->getRegistrationSetup($requestId, self::$LOCALE);
        })->wait();

        $uri = $this->mock->getLastRequest()->getUri();
        assertEquals('/registration-setup-srv/public/list', $uri->getPath());
        assertEquals('requestId=' . self::$REQUEST_ID . '&acceptlanguage=' . self::$LOCALE, $uri->getQuery());
    }

    public function test_getRegistrationSetup_withValidRequestId_returnsRegistrationFieldsFromServer() {
        $this->mock->append(new Response(200, [], self::$registrationSetupResponse));

        $response = $this->responsePromise->then(function ($requestId) {
            return $this->provider->getRegistrationSetup($requestId, self::$LOCALE);
        })->wait();

        assertTrue($response['success']);
        assertEquals(200, $response['status']);
        assertIsArray($response['data']);
    }

    public function test_getRegistrationSetup_withInvalidRequestId_returnsErrorMessageFromServer() {
        $this->mock->append(new Response(400, [], self::$invalidRequestIdResponse));

        $promise = $this->responsePromise->then(function ($requestId) {
            return $this->provider->getRegistrationSetup('aaa' . $requestId, self::$LOCALE);
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
