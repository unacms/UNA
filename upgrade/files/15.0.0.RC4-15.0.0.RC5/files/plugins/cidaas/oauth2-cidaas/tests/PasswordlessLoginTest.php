<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertStringContainsString;

final class PasswordlessLoginTest extends AbstractCidaasTestParent
{
    protected function setUp(): void
    {
        $this->setUpCidaas(false, false);
    }

    public function test_initiatePasswordlessLogin_acceptsMixedCaseTypeAndCallsCorrectPath(): void
    {
        $this->provider->initiatePasswordlessLogin(self::$REQUEST_ID, 'EMAIL', 'user@example.com', 'medium-1')->wait();

        $request = $this->mock->getLastRequest();
        assertStringContainsString('/verification-srv/v2/authenticate/initiate/email', $request->getUri()->getPath());
        $body = (string) $request->getBody();
        assertStringContainsString('"type":"email"', $body);
    }

    public function test_initiatePasswordlessLogin_rejectsInvalidType(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('invalid type');

        $this->provider->initiatePasswordlessLogin(self::$REQUEST_ID, 'unknown', 'user@example.com', 'x');
    }

    public function test_verifyPasswordlessLogin_acceptsMixedCaseType(): void
    {
        $this->provider->verifyPasswordlessLogin('TOTP', 'ex-1', '123456', self::$REQUEST_ID)->wait();

        $request = $this->mock->getLastRequest();
        assertStringContainsString('/verification-srv/v2/authenticate/authenticate/totp', $request->getUri()->getPath());
        $body = (string) $request->getBody();
        assertStringContainsString('"type":"totp"', $body);
    }
}
