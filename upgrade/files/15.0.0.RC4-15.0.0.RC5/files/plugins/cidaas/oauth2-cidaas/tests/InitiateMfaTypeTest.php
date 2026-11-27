<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use GuzzleHttp\Psr7\Response;
use function PHPUnit\Framework\assertStringContainsString;

final class InitiateMfaTypeTest extends AbstractCidaasTestParent
{
    protected function setUp(): void
    {
        $this->setUpCidaas(false, false);
    }

    public function test_initiateMFA_acceptsTotpWithoutClientSideAllowlist(): void
    {
        $this->mock->append(new Response(200, [], '{"success":true,"status":200,"data":{}}'));

        $this->provider->initiateMFA('TOTP', [
            'email' => 'user@example.com',
            'request_id' => self::$REQUEST_ID,
            'usage_type' => 'MULTIFACTOR_AUTHENTICATION',
        ])->wait();

        $path = $this->mock->getLastRequest()->getUri()->getPath();
        assertStringContainsString('/verification-srv/v2/authenticate/initiate/totp', $path);
    }

    public function test_authenticateMFA_rejectsUnknownType(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('invalid mfa type');
        $this->provider->authenticateMFA('ex', 'sub', '123456', 'voice');
    }
}
