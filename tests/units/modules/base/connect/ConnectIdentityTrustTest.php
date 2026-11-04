<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Connect modules: the checks that keep a remote site's answer, or a caller's claim, from becoming a login.
 * The module objects are made without their constructors, so nothing needs to be installed.
 */
#[AllowMockObjectsWithoutExpectations]
class ConnectIdentityTrustTest extends BxDolTestCase
{
    protected $_aExternalCallBackup;

    protected function setUp(): void
    {
        $this->_aExternalCallBackup = (new ReflectionProperty(BxDolService::class, '_aExternalCall'))->getValue();
    }

    protected function tearDown(): void
    {
        (new ReflectionProperty(BxDolService::class, '_aExternalCall'))->setValue(null, $this->_aExternalCallBackup);
    }

    protected function bxModule(string $sClass, string $sFile, string $sName)
    {
        if (!class_exists($sClass, false))
            require_once BX_DIRECTORY_PATH_MODULES . $sFile;

        $o = (new ReflectionClass($sClass))->newInstanceWithoutConstructor();
        $this->bxSetProtected($o, '_aModule', ['name' => $sName], BxDolModule::class);

        return $o;
    }

    protected function bxSetExternalCall(?array $a): void
    {
        (new ReflectionProperty(BxDolService::class, '_aExternalCall'))->setValue(null, $a);
    }

    protected function bxDb(int $iExpectedCalls)
    {
        $oDb = $this->createMock(BxBaseModConnectDb::class);
        $oDb->expects($this->exactly($iExpectedCalls))->method('getProfileId')->willReturn(0);

        return $oDb;
    }

    #[DataProvider('providerForEmailVerified')]
    public function testEmailVerified(string $sClass, string $sFile, array $aProfileInfo, bool $bExpected)
    {
        $o = $this->bxModule($sClass, $sFile, 'phpunit');

        $this->assertSame($bExpected, $this->bxCallProtected($o, '_isRemoteEmailVerified', $aProfileInfo));
    }

    public static function providerForEmailVerified(): array
    {
        $aGoogle = ['BxGoogleConModule', 'boonex/google_connect/classes/BxGoogleConModule.php'];
        $aOkta = ['BxOktaConModule', 'boonex/okta_connect/classes/BxOktaConModule.php'];
        $aAzure = ['BxAzrConModule', 'boonex/azure_connect/classes/BxAzrConModule.php'];

        return [
            'google verified_email' => [...$aGoogle, ['verified_email' => true], true],
            'google verified_email string' => [...$aGoogle, ['verified_email' => 'true'], true],
            'google email_verified' => [...$aGoogle, ['email_verified' => true], true],
            'google not verified' => [...$aGoogle, ['verified_email' => false], false],
            'google string false' => [...$aGoogle, ['verified_email' => 'false'], false],
            'google not reported' => [...$aGoogle, ['email' => 'a@example.com'], false],

            'okta verified' => [...$aOkta, ['email_verified' => true], true],
            'okta not verified' => [...$aOkta, ['email_verified' => false], false],
            'okta not reported' => [...$aOkta, ['email' => 'a@example.com'], true],

            'azure mail is upn' => [...$aAzure, ['mail' => 'A@Example.com', 'userPrincipalName' => 'a@example.com'], true],
            'azure no mail' => [...$aAzure, ['userPrincipalName' => 'a@example.com'], true],
            'azure mail is not upn' => [...$aAzure, ['mail' => 'ceo@victim.example', 'userPrincipalName' => 'attacker@tenant.example'], false],
            'azure mail without upn' => [...$aAzure, ['mail' => 'ceo@victim.example'], false],
            'azure nothing' => [...$aAzure, [], false],
        ];
    }

    public function testEmailIsNotVerifiedByDefaultOnlyWhereTheRemoteSiteReportsIt()
    {
        $o = $this->bxModule('BxDrupalModule', 'boonex/drupal_connect/classes/BxDrupalModule.php', 'bx_drupal');

        $this->assertTrue($this->bxCallProtected($o, '_isRemoteEmailVerified', ['email' => 'a@example.com']));
    }

    #[DataProvider('providerForFlags')]
    public function testRemoteFlag($mixedValue, bool $bExpected)
    {
        $o = $this->bxModule('BxDrupalModule', 'boonex/drupal_connect/classes/BxDrupalModule.php', 'bx_drupal');

        $this->assertSame($bExpected, $this->bxCallProtected($o, '_isRemoteFlagTrue', $mixedValue));
    }

    public static function providerForFlags(): array
    {
        return [
            [true, true],
            [1, true],
            ['1', true],
            ['true', true],
            [false, false],
            [0, false],
            ['0', false],
            ['false', false],
            ['', false],
            [null, false],
            [[], false],
            ['yes', false],
        ];
    }

    #[DataProvider('providerForAccessTokens')]
    public function testAccessTokenIsTheOnlyThingTakenFromParams($mParams, $mExpected)
    {
        $o = $this->bxModule('BxDrupalModule', 'boonex/drupal_connect/classes/BxDrupalModule.php', 'bx_drupal');

        $this->assertSame($mExpected, $this->bxCallProtected($o, '_getAccessToken', $mParams));
    }

    public static function providerForAccessTokens(): array
    {
        return [
            'array' => [['access_token' => 'ya29.a0AfH6SMB-token_1'], 'ya29.a0AfH6SMB-token_1'],
            'json' => ['{"access_token":"ya29.a0AfH6SMB-token_1","email":"a@example.com"}', 'ya29.a0AfH6SMB-token_1'],
            'profile only' => [['id' => '1', 'sub' => '1', 'email' => 'a@example.com'], false],
            'profile as json' => ['{"id":"1","sub":"1","email":"a@example.com"}', false],
            'not json' => ['ya29.a0AfH6SMB-token_1', false],
            'empty' => [[], false],
            'empty string' => ['', false],
            'null' => [null, false],
            'token is array' => [['access_token' => ['ya29.a0AfH6SMB-token_1']], false],
            'too short' => [['access_token' => 'abc'], false],
            'space' => [['access_token' => 'ya29.a0AfH6 SMB-token_1'], false],
            'new line' => [['access_token' => "ya29.a0AfH6SMB-token_1\n"], false],
            'too long' => [['access_token' => str_repeat('a', 4097)], false],
            'longest' => [['access_token' => str_repeat('a', 4096)], str_repeat('a', 4096)],
        ];
    }

    public function testOktaLoginRefusesExternalCall()
    {
        $o = $this->bxModule('BxOktaConModule', 'boonex/okta_connect/classes/BxOktaConModule.php', 'bx_oktacon');
        $this->bxModuleInstances($o, ['_oDb' => $this->bxDb(0)]);

        $this->bxSetExternalCall(['bx_oktacon', 'Login']);
        $this->assertFalse($o->serviceLogin('00u1abcd'));
    }

    public function testOktaGetUserIdsRefusesExternalCall()
    {
        $o = $this->bxModule('BxOktaConModule', 'boonex/okta_connect/classes/BxOktaConModule.php', 'bx_oktacon');
        $this->bxModuleInstances($o, ['_oDb' => $this->bxDb(0)]);

        $this->bxSetExternalCall(['bx_oktacon', 'GetUserIds']);
        $this->assertFalse($o->serviceGetUserIds('00u1abcd'));
    }

    public function testOktaServicesWorkForInternalCalls()
    {
        $o = $this->bxModule('BxOktaConModule', 'boonex/okta_connect/classes/BxOktaConModule.php', 'bx_oktacon');
        $this->bxModuleInstances($o, ['_oDb' => $this->bxDb(2)]);

        // another service runs as an external call, this one is called by it from PHP
        $this->bxSetExternalCall(['bx_oktacon', 'Something']);
        $this->assertFalse($o->serviceLogin('00u1abcd'));

        $this->bxSetExternalCall(null);
        $this->assertFalse($o->serviceGetUserIds('00u1abcd'));
    }

    public function testDrupalHandleUserRefusesExternalCall()
    {
        $o = $this->bxModule('BxDrupalModule', 'boonex/drupal_connect/classes/BxDrupalModule.php', 'bx_drupal');
        $this->bxModuleInstances($o, ['_oDb' => $this->bxDb(0)]);

        $this->bxSetExternalCall(['bx_drupal', 'HandleUser']);
        $this->assertFalse($o->serviceHandleUser(['user' => ['uid' => '1', 'mail' => 'admin@example.com']]));
    }
}
