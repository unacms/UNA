<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

if (!function_exists('MsgBox'))
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

/**
 * bx_googlecon/handle is open to guests. It used to sign in the account named by the userinfo JSON that
 * the client sent, so anyone who knew an email address could sign in as its owner. Now the client sends
 * the access token only, and who the user is comes from Google. The two requests to Google are replaced
 * here, so no case reaches the network and no account or profile is created.
 */
#[Group('integration')]
class GoogleConHandleTest extends BxDolIntegrationTestCase
{
    private const CLIENT_ID = 'phpunit-client.apps.googleusercontent.com';
    private const TOKEN = 'ya29.phpunit-token-0123456789';
    private const SUB = '110000000000000000001';

    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_googlecon'))
            $this->markTestSkipped('Google Connect is not installed.');

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    /**
     * The module with Google's answers replaced. It records what would be created instead of creating it.
     */
    protected function bxModule($mToken, $mUser, array $aClientIds = [self::CLIENT_ID]): BxGoogleConModule
    {
        $this->assertInstanceOf(BxGoogleConModule::class, BxDolModule::getInstance('bx_googlecon'));

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_googlecon');
        $o = new class($aModule) extends BxGoogleConModule {
            public $mToken;
            public $mUser;
            public $aRequests = [];
            public $aCreated = [];

            protected function _requestTokenInfo($sAccessToken)
            {
                $this->aRequests[] = ['token', $sAccessToken];
                return $this->mToken;
            }

            protected function _requestUserInfo($sAccessToken)
            {
                $this->aRequests[] = ['userinfo', $sAccessToken];
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
        $o->_oConfig->aClientIds = $aClientIds;
        $o->mToken = $mToken;
        $o->mUser = $mUser;

        return $o;
    }

    protected function bxTokenInfo(array $aOverride = []): array
    {
        return array_merge(['aud' => self::CLIENT_ID, 'sub' => self::SUB, 'expires_in' => '3599'], $aOverride);
    }

    protected function bxUserInfo(array $aOverride = []): array
    {
        return array_merge([
            'sub' => self::SUB,
            'email' => 'phpunit.google.user@example.com',
            'email_verified' => true,
            'name' => 'Phpunit User',
            'given_name' => 'Phpunit',
            'family_name' => 'User',
            'picture' => 'https://lh3.googleusercontent.com/a/phpunit',
        ], $aOverride);
    }

    protected function bxError(): array
    {
        return [bx_api_get_msg(_t('_sys_connect_profile_error_info'))];
    }

    protected function bxAssertRejected(BxGoogleConModule $o, $mParams): void
    {
        $this->assertSame($this->bxError(), $o->serviceHandle($mParams));
        $this->assertSame([], $o->aCreated, 'No profile may be created.');
        $this->assertFalse(isLogged(), 'The viewer must stay a guest.');
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId());
    }

    public function testForgedProfileWithoutTokenIsRejected(): void
    {
        $sAdminEmail = $this->bxTestEmail('admin');

        // The original attack: the userinfo of the account to take over, and no token at all.
        $aForged = ['sub' => self::SUB, 'id' => self::SUB, 'email' => $sAdminEmail, 'email_verified' => true];
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());

        $this->bxAssertRejected($o, json_encode($aForged));
        $this->bxAssertRejected($o, $aForged);
        $this->assertSame([], $o->aRequests, 'Nothing is asked from Google without a token.');
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
            'short' => ['abc'],
            'array' => [['ya29.phpunit-token-0123456789']],
            'space' => ['ya29.phpunit token 0123456789'],
            'header injection' => ["ya29.phpunit-token\r\nHost: evil.example"],
            'too long' => [str_repeat('a', 4097)],
        ];
    }

    public function testRequestFieldsOtherThanTokenAreIgnored(): void
    {
        $sAdminEmail = $this->bxTestEmail('admin');
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());

        $this->assertSame(['created' => true], $o->serviceHandle(json_encode([
            'access_token' => self::TOKEN,
            'id' => 'forged-id',
            'sub' => 'forged-sub',
            'email' => $sAdminEmail,
            'name' => 'Forged Name',
            'picture' => 'http://evil.example/x.png',
        ])));

        $this->assertCount(1, $o->aCreated);
        $this->assertSame([
            'id' => self::SUB,
            'email' => 'phpunit.google.user@example.com',
            'verified_email' => true,
            'name' => 'Phpunit User',
            'given_name' => 'Phpunit',
            'family_name' => 'User',
            'picture' => 'https://lh3.googleusercontent.com/a/phpunit',
        ], $o->aCreated[0]);
        $this->assertSame([['token', self::TOKEN], ['userinfo', self::TOKEN]], $o->aRequests);
    }

    public function testTokenAsArrayIsAccepted(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());

        $this->assertSame(['created' => true], $o->serviceHandle(['access_token' => self::TOKEN]));
        $this->assertSame(self::SUB, $o->aCreated[0]['id']);
    }

    public function testTokenIssuedToAnotherClientIsRejected(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(['aud' => 'attacker-app.apps.googleusercontent.com']), $this->bxUserInfo());
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);

        $o = $this->bxModule($this->bxTokenInfo(['aud' => '']), $this->bxUserInfo());
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);

        $aInfo = $this->bxTokenInfo();
        unset($aInfo['aud']);
        $o = $this->bxModule($aInfo, $this->bxUserInfo());
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public function testNoConfiguredClientRejectsEverything(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo(), []);
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public function testAnyConfiguredClientIsAccepted(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(['aud' => 'ios-app.apps.googleusercontent.com']), $this->bxUserInfo(), [self::CLIENT_ID, 'ios-app.apps.googleusercontent.com']);
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
            'zero' => [['email_verified' => 0], false],
            'missing' => [[], true],
            'no email' => [['email' => ''], false],
            'bad email' => [['email' => 'not-an-email'], false],
        ];
    }

    public function testSubjectMismatchIsRejected(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(['sub' => '999']), $this->bxUserInfo());
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public function testMissingOrUnsafeSubjectIsRejected(): void
    {
        foreach (['', null, ['1'], 'a b', "1\n2", str_repeat('1', 256)] as $mSub) {
            $aInfo = $this->bxTokenInfo();
            unset($aInfo['sub']);

            $o = $this->bxModule($aInfo, $this->bxUserInfo(['sub' => $mSub]));
            $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
        }
    }

    public function testExpiredTokenIsRejected(): void
    {
        foreach (['0', 0, '-5', 'soon', null] as $mExpires) {
            $o = $this->bxModule($this->bxTokenInfo(['expires_in' => $mExpires]), $this->bxUserInfo());
            $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
        }

        $aInfo = $this->bxTokenInfo();
        unset($aInfo['expires_in']);
        $o = $this->bxModule($aInfo, $this->bxUserInfo());
        $this->bxAssertRejected($o, ['access_token' => self::TOKEN]);
    }

    public function testFailedRequestsAreRejected(): void
    {
        $this->bxAssertRejected($this->bxModule(false, $this->bxUserInfo()), ['access_token' => self::TOKEN]);
        $this->bxAssertRejected($this->bxModule([], $this->bxUserInfo()), ['access_token' => self::TOKEN]);
        $this->bxAssertRejected($this->bxModule($this->bxTokenInfo(), false), ['access_token' => self::TOKEN]);
    }

    public function testNotAnApiCallIsIgnored(): void
    {
        $o = $this->bxModule($this->bxTokenInfo(), $this->bxUserInfo());
        $this->bxSetProtected($o, '_bIsApi', false, BxBaseModGeneralModule::class);

        $this->assertNull($o->serviceHandle(['access_token' => self::TOKEN]));
        $this->assertSame([], $o->aCreated);
        $this->assertSame([], $o->aRequests);
    }

    #[DataProvider('pictures')]
    public function testPictureHost(string $sPicture, string $sExpected): void
    {
        $o = $this->bxModule([], []);
        $aProfile = $o->build($this->bxTokenInfo(), $this->bxUserInfo(['picture' => $sPicture]));

        $this->assertIsArray($aProfile);
        $this->assertSame($sExpected, $aProfile['picture']);
    }

    public static function pictures(): array
    {
        $sOk = 'https://lh3.googleusercontent.com/a/x=s96-c';

        return [
            'google host' => [$sOk, $sOk],
            'deep google host' => ['https://lh3.photos.googleusercontent.com/x', 'https://lh3.photos.googleusercontent.com/x'],
            'plain http' => ['http://lh3.googleusercontent.com/x', ''],
            'other host' => ['http://evil.example/x', ''],
            'host in path' => ['https://evil.example/googleusercontent.com', ''],
            'host in subdomain' => ['https://googleusercontent.com.evil.example/x', ''],
            'bare domain' => ['https://googleusercontent.com/x', ''],
            'user info' => ['https://lh3.googleusercontent.com@evil.example/x', ''],
            'user info reverse' => ['https://evil.example@lh3.googleusercontent.com/x', ''],
            'port' => ['https://lh3.googleusercontent.com:8443/x', ''],
            'internal address' => ['https://169.254.169.254/latest/meta-data', ''],
            'file' => ['file:///etc/passwd', ''],
            'whitespace' => ["https://lh3.googleusercontent.com/x\nhttp://evil.example", ''],
            'empty' => ['', ''],
        ];
    }

    public function testPictureOfRedirectFlowIsChecked(): void
    {
        $o = $this->bxModule([], []);
        $oMethod = new ReflectionMethod($o, '_convertRemoteFields');

        $aFields = $oMethod->invoke($o, ['id' => '1', 'email' => 'a@example.com', 'name' => 'A B', 'picture' => 'http://evil.example/x']);
        $this->assertSame('', $aFields['picture']);

        $aFields = $oMethod->invoke($o, ['id' => '1', 'email' => 'a@example.com', 'name' => 'A B', 'given_name' => 'A', 'picture' => 'https://lh3.googleusercontent.com/x']);
        $this->assertSame('https://lh3.googleusercontent.com/x', $aFields['picture']);
        $this->assertSame('A', $aFields['name']);
        $this->assertSame('A B', $aFields['fullname']);
    }

    public function testEmailVerificationHook(): void
    {
        $o = $this->bxModule([], []);

        $this->assertTrue($o->emailVerified(['verified_email' => true]));
        $this->assertTrue($o->emailVerified(['email_verified' => 'true']));
        $this->assertFalse($o->emailVerified(['verified_email' => false]));
        $this->assertFalse($o->emailVerified(['verified_email' => 'false']));
        $this->assertFalse($o->emailVerified(['email' => 'a@example.com']));
    }

    public function testOptionOfClientIdsIsReadByConfig(): void
    {
        $this->assertNotFalse(BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_options` WHERE `name` = 'bx_googlecon_client_ids'"), 'The option bx_googlecon_client_ids must be declared.');

        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aBackup = $oProp->getValue();
        $aParams = $aBackup;
        $aParams['bx_googlecon_api_key'] = 'web-client';
        $aParams['bx_googlecon_client_ids'] = " ios-client,\nandroid-client ; web-client";
        $oProp->setValue(null, $aParams);

        try {
            $oConfig = new BxGoogleConConfig(BxDolModuleQuery::getInstance()->getModuleByName('bx_googlecon'));
            $this->assertSame(['web-client', 'ios-client', 'android-client'], $oConfig->aClientIds);
        }
        finally {
            $oProp->setValue(null, $aBackup);
        }
    }
}
