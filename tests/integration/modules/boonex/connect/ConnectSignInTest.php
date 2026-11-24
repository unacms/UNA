<?php

use PHPUnit\Framework\Attributes\Group;

if (!function_exists('MsgBox'))
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

/**
 * A remote site (a Connect module) proves who the member is, like a password does, and nothing more:
 * a locked account stays locked, SMS two-factor login still applies, an existing account is linked
 * by email only when the remote site verified that email, Drupal Connect signs in the account of the
 * Drupal user it checked (not the account the typed login names), and Okta finds returning members by `sub`.
 *
 * The cases change the user test account's lock and last sign-in, and put them back.
 */
#[Group('integration')]
class ConnectSignInTest extends BxDolIntegrationTestCase
{
    private $_aAccountBackup;
    private $_aParamsBackup = [];
    private $_aRemoteLinks = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->bxBecomeGuest();
        BxTemplServiceLogin::reset2faLogin();
    }

    protected function tearDown(): void
    {
        BxTemplServiceLogin::reset2faLogin();
        $this->bxBecomeGuest();

        if ($this->_aAccountBackup) {
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `locked` = :locked, `logged` = :logged WHERE `id` = :id", $this->_aAccountBackup);
            BxDolAccount::getInstance((int)$this->_aAccountBackup['id'], true);
        }

        foreach ($this->_aParamsBackup as $sKey => $mixedValue)
            $this->bxSetParamCache($sKey, $mixedValue);

        foreach ($this->_aRemoteLinks as $a)
            BxDolDb::getInstance()->query("DELETE FROM `" . $a[0] . "accounts` WHERE `local_profile` = :profile AND `remote_profile` = :remote", ['profile' => $a[1], 'remote' => $a[2]]);

        BxDolForm::unSetObjectInstance('bx_drupal_login', 'bx_drupal_login');

        parent::tearDown();
    }

    public function testRemoteSignInOfLockedAccountIsRefused(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 1]);

        $mixed = $this->bxModule('bx_facebook')->setLogged($iProfileId, '', false);

        $this->assertIsString($mixed, 'A locked account gets an error.');
        $this->assertNotSame('', $mixed);
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId(), 'Nobody is signed in.');
    }

    public function testRemoteSignInWaitsForTheSmsCode(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 0, 'logged' => 0]);
        $this->bxParam('sys_account_activation_2fa_enable', 'on');
        $this->bxParam('sys_sms_default', 'phpunit');

        $mixed = $this->bxModule('bx_facebook')->setLogged($iProfileId, '', false);

        $this->assertIsArray($mixed, 'The sign-in continues with the code.');
        $this->assertStringContainsString('login-step2', $mixed['redirect']);
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId(), 'Nobody is signed in before the code.');
        $this->assertSame($iAccountId, (int)BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID));
    }

    public function testPageToGoToWaitsThroughTheSmsCode(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 0, 'logged' => 0]);
        $this->bxParam('sys_account_activation_2fa_enable', 'on');
        $this->bxParam('sys_sms_default', 'phpunit');

        $sUrl = BX_DOL_URL_ROOT . 'page.php?i=phpunit-start';
        $this->bxModule('bx_facebook')->setLogged($iProfileId, $sUrl, false);

        $this->assertSame($sUrl, BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_RELOCATE));
    }

    public function testRemoteSignInOfAllowedAccount(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 0]);
        $this->bxParam('sys_account_activation_2fa_enable', 'off');

        $this->assertTrue($this->bxModule('bx_facebook')->setLogged($iProfileId, '', false));
        $this->assertSame($iAccountId, (int)BxDolSession::getInstance()->getUserId());
    }

    public function testExistingAccountIsLinkedOnlyByVerifiedEmail(): void
    {
        $this->assertFalse($this->bxEmailVerified('bx_drupal', ['user' => ['mail' => 'a@example.com']]), 'Sites that report nothing about the email: not linked.');
        $this->assertTrue($this->bxEmailVerified('bx_facebook', ['email' => 'a@example.com']), 'Facebook gives only confirmed emails.');
        $this->assertFalse($this->bxEmailVerified('bx_facebook', ['email' => '']));
        $this->assertTrue($this->bxEmailVerified('bx_twitter', ['email' => 'a@example.com']), 'X gives only verified emails.');
        $this->assertTrue($this->bxEmailVerified('bx_linkedin', ['email' => 'a@example.com', 'email_verified' => true]));
        $this->assertFalse($this->bxEmailVerified('bx_linkedin', ['email' => 'a@example.com', 'email_verified' => false]));
        $this->assertFalse($this->bxEmailVerified('bx_linkedin', ['email' => 'a@example.com']));
    }

    public function testDrupalSignsInTheAccountDrupalChecked(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 0]);
        $this->bxLink('bx_drupal', $iProfileId, 'phpunit-drupal-1');

        // the admin's email is typed, Drupal accepts the password of its user that is linked to the user test account
        $oForm = $this->bxDrupalForm(['user' => ['uid' => 'phpunit-drupal-1', 'mail' => 'someone@example.com']]);
        $this->assertSame('', $oForm->checkPassword($this->bxTestEmail('admin'), 'any'));

        $this->assertSame($iProfileId, (int)$oForm->getProfileId(), 'The Drupal user\'s account, not the typed one.');
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId(), 'Checking the password signs nobody in.');
    }

    public function testDrupalSignInOfLockedAccountIsRefused(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 1]);
        $this->bxLink('bx_drupal', $iProfileId, 'phpunit-drupal-2');

        $oForm = $this->bxDrupalForm(['user' => ['uid' => 'phpunit-drupal-2']]);
        $this->assertNotSame('', $oForm->checkPassword('anyone', 'any'));
        $this->assertSame(0, (int)$oForm->getProfileId());
    }

    public function testDrupalUserServiceSignsNobodyIn(): void
    {
        [$iAccountId, $iProfileId] = $this->bxUser(['locked' => 0]);
        $this->bxLink('bx_drupal', $iProfileId, 'phpunit-drupal-3');

        $this->assertSame($iProfileId, (int)$this->bxModule('bx_drupal')->serviceHandleUser(['user' => ['uid' => 'phpunit-drupal-3']]));
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId());
        $this->assertIsString($this->bxModule('bx_drupal')->serviceHandleUser(['user' => []]), 'No uid: an error.');
    }

    public function testOktaFindsMembersBySub(): void
    {
        $o = $this->bxModule('bx_oktacon');

        $this->assertSame('00u1phpunit', $this->bxCall($o, '_getRemoteId', ['sub' => '00u1phpunit', 'email' => 'a@example.com']), 'Without the configured claim, `sub`.');
        $this->assertSame('custom-1', $this->bxCall($o, '_getRemoteId', ['identityId' => 'custom-1', 'sub' => '00u1phpunit']), 'A configured claim the token has wins.');
        $this->assertSame('', $this->bxCall($o, '_getRemoteId', ['email' => 'a@example.com']), 'No id at all: nobody to find or create.');
    }

    protected function bxModule(string $sName): BxBaseModConnectModule
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sName))
            $this->markTestSkipped($sName . ' is not installed.');

        return BxDolModule::getInstance($sName);
    }

    /**
     * Call a protected method of a module.
     */
    protected function bxCall($o, string $sMethod, ...$aArgs)
    {
        return (new ReflectionMethod($o, $sMethod))->invoke($o, ...$aArgs);
    }

    protected function bxEmailVerified(string $sModule, array $aProfileInfo): bool
    {
        return $this->bxCall($this->bxModule($sModule), '_isRemoteEmailVerified', $aProfileInfo);
    }

    /**
     * The Drupal login form, with Drupal's answer given instead of asked for.
     */
    protected function bxDrupalForm(array $aDrupalUser)
    {
        $this->bxModule('bx_drupal');
        $aObject = BxDolFormQuery::getFormArray('bx_drupal_login', 'bx_drupal_login');
        require_once BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file'];

        $o = new class($aObject, false) extends BxDrupalFormLogin {
            public $aDrupalUser = [];
            function call($aData) { return $this->aDrupalUser; }
        };
        $o->aDrupalUser = $aDrupalUser;
        return $o;
    }

    protected function bxLink(string $sModule, int $iProfileId, string $sRemoteId): void
    {
        $o = $this->bxModule($sModule);
        $sPrefix = $o->_oConfig->getDbPrefix();
        if (BxDolDb::getInstance()->getOne("SELECT `remote_profile` FROM `" . $sPrefix . "accounts` WHERE `local_profile` = :id", ['id' => $iProfileId]))
            $this->markTestSkipped('The user test profile is linked already.');

        $o->_oDb->saveRemoteId($iProfileId, $sRemoteId);
        $this->_aRemoteLinks[] = [$sPrefix, $iProfileId, $sRemoteId];
    }

    /**
     * The user test account with these fields changed (they are put back); [account id, profile id].
     */
    protected function bxUser(array $aFields): array
    {
        $oAccount = $this->bxAccount('user');
        $iId = (int)$oAccount->id();
        $oDb = BxDolDb::getInstance();
        if (!$this->_aAccountBackup)
            $this->_aAccountBackup = $oDb->getRow("SELECT `id`, `locked`, `logged` FROM `sys_accounts` WHERE `id` = :id", ['id' => $iId]);

        foreach ($aFields as $sField => $mixedValue)
            $oDb->query("UPDATE `sys_accounts` SET `" . $sField . "` = :value WHERE `id` = :id", ['value' => $mixedValue, 'id' => $iId]);
        $oDb->cleanMemoryAll();
        BxDolAccount::getInstance($iId, true);

        $oProfile = BxDolProfile::getInstanceByAccount($iId, true);
        if (!$oProfile)
            $this->markTestSkipped('The user test account has no profile.');

        return [$iId, (int)$oProfile->id()];
    }

    protected function bxParam(string $sKey, $mixedValue): void
    {
        if (!array_key_exists($sKey, $this->_aParamsBackup))
            $this->_aParamsBackup[$sKey] = getParam($sKey);
        $this->bxSetParamCache($sKey, $mixedValue);
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }
}
