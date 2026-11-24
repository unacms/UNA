<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The Lasso Moderation webhook (m/bx_antispam/content_checked):
 * - with no secret set it refuses every event, so nobody can sign one with an empty key;
 * - a wrong signature is refused, and neither the secret nor the expected signature is logged;
 * - an event signed with the secret is accepted.
 */
#[Group('integration')]
class LassoWebhookTest extends BxDolIntegrationTestCase
{
    private const SECRET = 'LassoWebhookTest-secret';

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_antispam'))
            $this->markTestSkipped('bx_antispam is not installed.');

        bx_import('LassoModeration', 'bx_antispam');
    }

    public function testNoSecretRefusesEveryEvent()
    {
        $sBody = $this->_body();
        $o = $this->_webhook('');

        $this->assertSame(404, $o->processPayload($sBody, $this->_sign($sBody, '')));
        $this->assertSame(404, $o->processPayload($sBody, 'sha256='));
    }

    public function testWrongSignatureIsRefusedAndSecretNotLogged()
    {
        $sBody = $this->_body();
        $o = $this->_webhook(self::SECRET);

        $this->assertSame(404, $o->processPayload($sBody, ''));
        $this->assertSame(404, $o->processPayload($sBody, $this->_sign($sBody, 'another secret')));

        $sLog = json_encode($o->aLog);
        $this->assertStringNotContainsString(self::SECRET, $sLog);
        $this->assertStringNotContainsString($this->_sign($sBody, self::SECRET), $sLog);
    }

    public function testSignedEventIsAccepted()
    {
        $sBody = $this->_body();
        $o = $this->_webhook(self::SECRET);

        $this->assertSame(200, $o->processPayload($sBody, $this->_sign($sBody, self::SECRET)));
    }

    protected function _body()
    {
        // an action of a type the webhook doesn't handle: nothing changes on the site
        return json_encode(['actions' => [['type' => 'user', 'status' => 'ok']]]);
    }

    protected function _sign($sBody, $sSecret)
    {
        return 'sha256=' . base64_encode(hash_hmac('sha256', $sBody, $sSecret, true));
    }

    protected function _webhook($sSecret)
    {
        return new class($sSecret) extends BxAntispamLassoModeration {
            public $aLog = [];

            public function __construct($sSecret)
            {
                parent::__construct();
                $this->_sWebhookSecret = $sSecret;
            }

            public function log($mixedContents, $sTitle = '')
            {
                $this->aLog[] = [$sTitle, $mixedContents];
            }
        };
    }
}
