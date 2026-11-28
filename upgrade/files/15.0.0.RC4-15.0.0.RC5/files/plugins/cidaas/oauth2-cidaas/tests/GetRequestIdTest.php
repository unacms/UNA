<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertNotNull;

final class GetRequestIdTest extends AbstractCidaasTestParent {

    protected function setUp(): void {
        $this->setUpCidaas();
    }

    public function test_getRequestId_withClientIdAndSecretSet_serverCalledWithClientIdSecretAndDefaultScope() {
        $this->provider->getRequestId()->wait();

        $request = $this->mock->getLastRequest();
        assertEquals($_ENV['CIDAAS_BASE_URL'] . '/authz-srv/authrequest/authz/generate', $request->getUri());
        $body = json_decode($request->getBody(), true);
        assertEquals($_ENV['CIDAAS_CLIENT_ID'], $body['client_id']);
        assertEquals($_ENV['CIDAAS_REDIRECT_URI'], $body['redirect_uri']);
        assertEquals('code', $body['response_type']);
        assertEquals('openid', $body['scope']);
        assertNotNull($body['nonce']);
    }

    public function test_getRequestId_withClientIdAndSecretSetAndScopeGiven_serverCalledWithClientIdSecretAndScope() {
        $scope = 'openid profile';
        $this->provider->getRequestId($scope)->wait();

        $request = $this->mock->getLastRequest();
        assertEquals($_ENV['CIDAAS_BASE_URL'] . '/authz-srv/authrequest/authz/generate', $request->getUri());
        $body = json_decode($request->getBody(), true);
        assertEquals($_ENV['CIDAAS_CLIENT_ID'], $body['client_id']);
        assertEquals($_ENV['CIDAAS_REDIRECT_URI'], $body['redirect_uri']);
        assertEquals('code', $body['response_type']);
        assertEquals($scope, $body['scope']);
        assertNotNull($body['nonce']);
    }

    public function test_getRequestId_withClientIdAndSecretSet_returnsRequestIdFromServer() {
        $requestId = $this->provider->getRequestId()->wait();

        assertEquals(self::$REQUEST_ID, $requestId);
    }
}
