<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use function PHPUnit\Framework\assertEquals;
use function PHPUnit\Framework\assertStringContainsString;

final class ProgressiveRegistrationTest extends AbstractCidaasTestParent
{
    protected function setUp(): void
    {
        $this->setUpCidaas(false, false);
    }

    public function test_progressiveRegistration_sendsAcceptLanguageHeader(): void
    {
        $this->provider->progressiveRegistration(
            self::$REQUEST_ID,
            'track-123',
            ['given_name' => 'Test'],
            'de-DE'
        )->wait();

        $request = $this->mock->getLastRequest();
        assertEquals('POST', $request->getMethod());
        assertStringContainsString('/login-srv/progressive/update/user', $request->getUri()->getPath());
        assertEquals(self::$REQUEST_ID, $request->getHeaderLine('requestId'));
        assertEquals('track-123', $request->getHeaderLine('trackId'));
        assertEquals('de-DE', $request->getHeaderLine('acceptlanguage'));
    }
}
