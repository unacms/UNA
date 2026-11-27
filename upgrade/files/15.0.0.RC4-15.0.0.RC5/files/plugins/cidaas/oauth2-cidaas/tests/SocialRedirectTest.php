<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/AbstractCidaasTestParent.php';

use Cidaas\OAuth2\Client\Provider\AbstractCidaasTestParent;
use function PHPUnit\Framework\assertStringContainsString;

final class SocialRedirectTest extends AbstractCidaasTestParent
{
    protected function setUp(): void
    {
        $this->setUpCidaas(false, false);
    }

    public function test_loginWithSocial_appendsEncodedQueryParametersToLocation(): void
    {
        $this->provider->loginWithSocial('Google', self::$REQUEST_ID, ['locale' => 'de-DE', 'x' => 'a b']);

        $expectedBase = 'https://nightlybuild.cidaas.de/login-srv/social/login/google/' . self::$REQUEST_ID;
        $expectedQuery = http_build_query(['locale' => 'de-DE', 'x' => 'a b']);
        assertStringContainsString('Location: ' . $expectedBase . '?' . $expectedQuery, parent::$headers[0]);
    }

    public function test_registerWithSocial_appendsEncodedQueryParametersToLocation(): void
    {
        $this->provider->registerWithSocial('Facebook', self::$REQUEST_ID, ['locale' => 'en-US']);

        $expectedBase = 'https://nightlybuild.cidaas.de/login-srv/social/register/facebook/' . self::$REQUEST_ID;
        $expectedQuery = http_build_query(['locale' => 'en-US']);
        assertStringContainsString('Location: ' . $expectedBase . '?' . $expectedQuery, parent::$headers[0]);
    }
}
