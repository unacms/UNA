<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

if (!function_exists('MsgBox'))
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

/**
 * bx_cidaascon/handle is open to guests and used to sign in the account named by the profile JSON that the client
 * sent. Now the client sends the access token only: Cidaas has to confirm that the token belongs to this site's
 * client, and the profile comes from Cidaas. The two requests are replaced here, so no case reaches the network
 * and no account or profile is created.
 */
#[Group('integration')]
class CidaasConHandleTest extends BxDolIntegrationTestCase
{
    private const CLIENT_ID = 'phpunit-cidaas-client';
    private const TOKEN = 'eyJhbGciOiJSUzI1NiJ9.phpunit.token0123456789';
    private const SUB = '21e029a8-9da8-4fd9-ad14-e5f3c615f55a';

    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_cidaascon'))
            $this->markTestSkipped('Cidaas Connect is not installed.');
        if (!is_file(BX_DIRECTORY_PATH_MODULES . 'boonex/cidaas_connect/vendor/autoload.php'))
            $this->markTestSkipped('The composer packages of Cidaas Connect are not installed.');

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function bxModule($mToken, $mUser): BxCidaasConModule
    {
        $this->assertInstanceOf(BxCidaasConModule::class, BxDolModule::getInstance('bx_cidaascon'));

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_cidaascon');
        $o = new class($aModule) extends BxCidaasConModule {
            public $mToken;
            public $mUser;
            public $aRequests = [];
            public $aCreated = [];

            protected function _requestTokenInfo($sAccessToken)
            {
                $this->aRequests[] = ['introspect', $sAccessToken];
                return $this->mToken;
            }

            protected function _requestUserInfo($sAccessToken)
            {
                $this->aRequests[] = ['profile', $sAccessToken];
                return $this->mUser;
            }

            public function _createProfile($aProfileInfo, $sAlternativeName = '')
            {
                $this->aCreated[] = $aProfileInfo;
                return ['created' => true];
            }

            public function build($aTokenInfo, $aUserInfo)
            {
                return $this->_buildVerifiedProfile($aTokenInfo, $aUserInfo);
            }

            public function emailVerified($aProfileInfo)
            {
                return $this->_isRemoteEmailVerified($aProfileInfo);
            }
        };

        $this->bxSetProtected($o, '_bIsApi', true, BxBaseModGeneralModule::class);
        $o->_oConfig->sClientID = self::CLIENT_ID;
        $o->mToken = $mToken;
        $o->mUser = $mUser;

        return $o;
    }

    protected function bxTokenInfo(array $aOverride = []): array
    {
        return array_merge(['active' => true, 'client_id' => self::CLIENT_ID, 'aud' => [self::CLIENT_ID], 'sub' => self::SUB, 'exp' => time() + 3600], $aOverride);
    }

    protected function bxUserInfo(array $aOverride = []): array
    {
        return array_merge([
            'sub' => self::SUB,
            'email' => 'phpunit.cidaas.user@example.com',
            'email_verified' => true,
            'name' => 'Phpunit User',
            'given_name' => 'Phpunit',
            'family_name' => 'User',
            'preferred_username' => 'phpunit',
            'picture' => 'https://cdn.example.com/phpunit.png',
        ], $aOverride);
    }

    protected function bxAssertRejected(BxCidaasConModule $o, $mParams): void
    {
        $this->assertSame([bx_api_get_msg(_t('_sys_connect_profile_error_info'))], $o->serviceHandle($mParams));
        $this->assertSame([], $o->aCreated, 'No profile may be created.');
        $this->assertFalse(isLogged(), 'The viewer must stay a guest.');
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId());
    }

    public function testForgedProfileWithoutTokenIsRejected(): void
    {
        $aForged = ['id' => self::SUB, 'sub' => self::SUB, 'email' => $this->bxTestEmail('admin'), 'email_verified' => true];
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());

        $this->bxAssertRejected($o, json_encode($aForged));
        $this->bxAssertRejected($o, $aForged);
        $this->assertSame([], $o->aRequests);
    }

    public function testRequestFieldsOtherThanTokenAreIgnored(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());

        $this->assertSame(['created' => true], $o->serviceHandle(json_encode([
            'access_token' => self::TOKEN,
            'id' => 'forged-id',
            'sub' => 'forged-sub',
            'email' => $this->bxTestEmail('admin'),
        ])));

        $this->assertCount(1, $o->aCreated);
        $this->assertSame(self::SUB, $o->aCreated[0]['id']);
        $this->assertSame('phpunit.cidaas.user@example.com', $o->aCreated[0]['email']);
        $this->assertSame([['introspect', self::TOKEN], ['profile', self::TOKEN]], $o->aRequests);
    }

    #[DataProvider('invalidTokens')]
    public function testMalformedTokenIsRejected($mToken): void
    {
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());

        $this->bxAssertRejected($o, ['access_token' => $mToken]);
        $this->assertSame([], $o->aRequests);
    }

    public static function invalidTokens(): array
    {
        return [
            'empty' => [''],
            'array' => [['x']],
            'space' => ['eyJhbGci phpunit token'],
            'too long' => [str_repeat('a', 4097)],
        ];
    }

    #[DataProvider('foreignTokens')]
    public function testTokenOfAnotherClientIsRejected(array $aTokenOverride, array $aRemove): void
    {
        $aInfo = $this->bxTokenInfo($aTokenOverride);
        foreach ($aRemove as $sKey)
            unset($aInfo[$sKey]);

        $o = $this->bxModule($aInfo, $this->bxUserInfo());
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public static function foreignTokens(): array
    {
        return [
            'inactive' => [['active' => false], []],
            'no active' => [[], ['active']],
            'another client' => [['client_id' => 'attacker-client', 'aud' => ['attacker-client']], []],
            'no client' => [[], ['client_id', 'aud']],
            'expired' => [['exp' => time() - 10], []],
            'bad expiry' => [['exp' => 'never'], []],
            'subject mismatch' => [['sub' => 'another-user'], []],
        ];
    }

    public function testAudienceAsStringIsAccepted(): void
    {
        $aInfo = $this->bxTokenInfo(['aud' => self::CLIENT_ID]);
        unset($aInfo['client_id']);

        $o = $this->bxModule($aInfo, $this->bxUserInfo());
        $this->assertSame(['created' => true], $o->serviceHandle(['access_token' => self::TOKEN]));
    }

    #[DataProvider('unverifiedEmails')]
    public function testUnverifiedEmailIsRejected(array $aUserOverride, bool $bRemoveFlag): void
    {
        $aUser = $this->bxUserInfo($aUserOverride);
        if ($bRemoveFlag)
            unset($aUser['email_verified']);

        $o = $this->bxModule($this->bxTokenInfo(), $aUser);
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public static function unverifiedEmails(): array
    {
        return [
            'false' => [['email_verified' => false], false],
            'string false' => [['email_verified' => 'false'], false],
            'missing' => [[], true],
            'no email' => [['email' => ''], false],
            'no subject' => [['sub' => ''], false],
        ];
    }

    public function testFailedRequestsAreRejected(): void
    {
        $this->bxAssertRejected($this->bxModule(false, $this->bxUserInfo()), ['access_token' => self::TOKEN]);
        $this->bxAssertRejected($this->bxModule($this->bxTokenInfo(), false), ['access_token' => self::TOKEN]);
    }

    public function testSiteWithoutClientRejectsEverything(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(['client_id' => '', 'aud' => ['']]), $this->bxUserInfo());
        $o->_oConfig->sClientID = '';

        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public function testEmailVerificationHook(): void
    {
        $o = $this->bxModule([], []);

        $this->assertTrue($o->emailVerified(['email_verified' => true]));
        $this->assertTrue($o->emailVerified(['email' => 'a@example.com']), 'Not enforced when Cidaas does not say.');
        $this->assertFalse($o->emailVerified(['email_verified' => false]));
        $this->assertFalse($o->emailVerified(['email_verified' => '0']));
    }
}
