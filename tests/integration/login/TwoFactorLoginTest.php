<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Takes the SMS of two-factor login instead of sending it, and remembers where it would have gone.
 */
class BxTest2faSmsAlertsResponse extends BxDolAlertsResponse
{
    public static $aSent = [];

    public function response($oAlert)
    {
        if ($oAlert->sUnit !== 'account' || $oAlert->sAction !== 'before_2fa_send_sms')
            return;

        self::$aSent[] = ['phone' => $oAlert->aExtras['phone_number'], 'text' => $oAlert->aExtras['sms_text']];
        $oAlert->aExtras['override_result'] = true;
    }
}

/**
 * SMS two-factor login after member.php has checked the password: login-step2 sends the code,
 * login-step3 takes it. Whoever has only the password can't send the code to another phone,
 * and can't guess it: a code expires, a wrong one counts like a wrong password, and
 * BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS of them end the sign-in.
 *
 * The test changes the admin test account's phone and login counters and puts them back.
 */
#[Group('integration')]
class TwoFactorLoginTest extends BxDolIntegrationTestCase
{
    protected $_aAccountBackup;
    protected $_aAlertsCacheBackup;
    protected $_mixedLimitBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $oAccount = $this->bxAccount('admin');
        $this->_aAccountBackup = BxDolDb::getInstance()->getRow("SELECT `id`, `phone`, `phone_confirmed` FROM `sys_accounts` WHERE `id` = :id", ['id' => $oAccount->id()]);
        $this->_mixedLimitBackup = getParam('sys_account_limit_incorrect_login_attempts');

        $this->bxBecomeGuest();
        BxTemplServiceLogin::reset2faLogin();
        $this->bxInstallSmsHandler();
    }

    protected function tearDown(): void
    {
        BxTemplServiceLogin::reset2faLogin();

        if ($this->_aAccountBackup) {
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `phone` = :phone, `phone_confirmed` = :phone_confirmed WHERE `id` = :id", $this->_aAccountBackup);
            BxDolAccount::getInstance((int)$this->_aAccountBackup['id'], true);
        }
        $this->bxSetParamCache('sys_account_limit_incorrect_login_attempts', $this->_mixedLimitBackup);

        if ($this->_aAlertsCacheBackup !== null)
            (new ReflectionProperty(BxDolAlerts::class, '_aCacheData'))->setValue(null, $this->_aAlertsCacheBackup);
        BxTest2faSmsAlertsResponse::$aSent = [];

        foreach (['sys_login_step2', 'sys_login_step3'] as $sDisplay)
            BxDolForm::unSetObjectInstance('sys_login', $sDisplay);

        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    protected function bxInstallSmsHandler(): void
    {
        new BxDolAlerts('system', 'phpunit_init', 0, 0);

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $this->_aAlertsCacheBackup = $oProp->getValue();

        $aCache = $this->_aAlertsCacheBackup;
        $aCache['handlers']['phpunit_2fa_sms'] = [
            'name' => 'phpunit_2fa_sms',
            'class' => BxTest2faSmsAlertsResponse::class,
            'file' => 'tests/integration/login/TwoFactorLoginTest.php',
            'service_call' => '',
            'active' => 1,
        ];
        $aCache['alerts']['account']['before_2fa_send_sms'][] = 'phpunit_2fa_sms';
        $oProp->setValue(null, $aCache);
    }

    /**
     * The admin test account with this phone, the password checked by member.php.
     */
    protected function bxPasswordChecked(string $sPhone): int
    {
        $iId = (int)$this->bxAccount('admin')->id();
        BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `phone` = :phone, `login_attempts` = 0, `locked` = 0 WHERE `id` = :id", ['phone' => $sPhone, 'id' => $iId]);
        BxDolAccount::getInstance($iId, true);

        $oSession = BxDolSession::getInstance();
        $oSession->setValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID, $iId);
        $oSession->setValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_IS_REMEMBER, false);

        return $iId;
    }

    protected function bxAccountInfo(int $iId): array
    {
        BxDolDb::getInstance()->cleanMemoryAll();
        return BxDolDb::getInstance()->getRow("SELECT `phone`, `login_attempts`, `locked` FROM `sys_accounts` WHERE `id` = :id", ['id' => $iId]);
    }

    /**
     * The account the session signed in (bx_login sets the session; the logged flags of a CLI run stay as they were).
     */
    protected function bxSignedIn(): int
    {
        return (int)BxDolSession::getInstance()->getUserId();
    }

    protected function bxCode(): array
    {
        $aCode = BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE);
        $this->assertIsArray($aCode, 'A code is waiting in the session.');

        return $aCode;
    }

    /**
     * Post a display of the login form to its service, the way login-step2 and login-step3 do.
     */
    protected function bxPost(string $sDisplay, array $aPost)
    {
        // Each post is a request of its own: nothing read in an earlier one is remembered.
        BxDolDb::getInstance()->cleanMemoryAll();
        if (($iId = (int)BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID)))
            BxDolAccount::getInstance($iId, true);

        BxDolForm::unSetObjectInstance('sys_login', $sDisplay);
        $oForm = BxDolForm::getObjectInstance('sys_login', $sDisplay);
        $oForm->aParams['csrf']['disable'] = true;

        $_POST = $aPost;
        $oService = new BxTemplServiceLogin();
        $mixedResult = 'sys_login_step2' == $sDisplay ? $oService->serviceLoginFormStep2() : $oService->serviceLoginFormStep3();
        $_POST = [];

        BxDolForm::unSetObjectInstance('sys_login', $sDisplay);
        return $mixedResult;
    }

    protected function bxSendCode(string $sPhone = '')
    {
        return $this->bxPost('sys_login_step2', ['phone' => $sPhone, 'do_sendsms' => '1', 'relocate' => '']);
    }

    protected function bxEnterCode(string $sCode)
    {
        return $this->bxPost('sys_login_step3', ['code' => $sCode, 'do_checkcode' => '1', 'relocate' => '']);
    }

    protected function bxWrongCode(): string
    {
        return (string)(((int)$this->bxCode()['code'] + 1) % 1000000);
    }

    public function testCodeGoesToThePhoneOfTheAccount(): void
    {
        $iId = $this->bxPasswordChecked('+1 555 010 4242');

        $sForm = $this->bxPost('sys_login_step2', []);
        $this->assertStringContainsString('••42', $sForm, 'The form shows where the code goes.');
        $this->assertStringNotContainsString('555 010', $sForm);

        $this->bxSendCode('+1 555 010 9999');

        $this->assertSame([['phone' => '+1 555 010 4242', 'text' => _t('_sys_txt_login_2fa_sms_text', $this->bxCode()['code'])]], BxTest2faSmsAlertsResponse::$aSent);
        $this->assertSame('+1 555 010 4242', $this->bxAccountInfo($iId)['phone']);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $this->bxCode()['code']);
        $this->assertSame('', $this->bxCode()['phone']);
    }

    public function testNewPhoneIsTheAccountsOnlyAfterItsCode(): void
    {
        $iId = $this->bxPasswordChecked('');
        $sPhone = '+1 555 019 ' . random_int(1000, 9999);

        $this->bxSendCode($sPhone);

        $this->assertSame($sPhone, BxTest2faSmsAlertsResponse::$aSent[0]['phone'] ?? null);
        $this->assertSame('', $this->bxAccountInfo($iId)['phone'], 'Not saved before its code comes back.');

        $this->bxEnterCode($this->bxCode()['code']);

        $this->assertSame($iId, $this->bxSignedIn());
        $this->assertSame($sPhone, $this->bxAccountInfo($iId)['phone']);
    }

    public function testRightCodeSignsInAndForgetsTheSignIn(): void
    {
        $iId = $this->bxPasswordChecked('+1 555 010 4242');
        $this->bxSendCode();

        $this->bxEnterCode($this->bxCode()['code']);

        $this->assertSame($iId, $this->bxSignedIn());
        $oSession = BxDolSession::getInstance();
        foreach ([BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE, BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID, BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_IS_REMEMBER] as $sKey)
            $this->assertFalse($oSession->isValue($sKey), $sKey);
    }

    public function testWrongCodesEndTheSignIn(): void
    {
        $this->bxSetParamCache('sys_account_limit_incorrect_login_attempts', 0);
        $this->bxPasswordChecked('+1 555 010 4242');
        $this->bxSendCode();
        $sCode = $this->bxCode()['code'];
        $sWrong = $this->bxWrongCode();

        for ($i = 1; $i < BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS; $i++) {
            $sForm = $this->bxEnterCode($sWrong);
            $this->assertStringContainsString(explode('<a', _t('_sys_form_login_input_code_error_wrong', ''))[0], $sForm);
            $this->assertSame($i, $this->bxCode()['attempts']);
        }

        // A new code doesn't bring the guesses back.
        $this->bxSendCode();
        $this->assertSame(BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS - 1, $this->bxCode()['attempts']);
        $sCode = $this->bxCode()['code'];

        $sForm = $this->bxEnterCode((string)(((int)$sCode + 1) % 1000000));
        $this->assertStringContainsString(explode('<a', _t('_sys_form_login_input_code_error_attempts', ''))[0], $sForm);
        $this->assertFalse(BxDolSession::getInstance()->isValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID), 'The sign-in starts over from the password.');

        $this->bxEnterCode($sCode);
        $this->assertSame(0, $this->bxSignedIn(), 'The last code is gone with the sign-in.');
    }

    public function testWrongCodesCountLikeWrongPasswords(): void
    {
        $this->bxSetParamCache('sys_account_limit_incorrect_login_attempts', 2);
        $iId = $this->bxPasswordChecked('+1 555 010 4242');
        $this->bxSendCode();
        $sCode = $this->bxCode()['code'];
        $sWrong = $this->bxWrongCode();

        $this->bxEnterCode($sWrong);
        $this->bxEnterCode($sWrong);
        $this->assertSame(2, (int)$this->bxAccountInfo($iId)['login_attempts']);
        $this->assertSame(0, (int)$this->bxAccountInfo($iId)['locked']);

        $this->bxEnterCode($sWrong);
        $this->assertSame(1, (int)$this->bxAccountInfo($iId)['locked'], 'The limit locks the account, as for passwords.');

        BxDolAccount::getInstance($iId, true);
        $sForm = $this->bxEnterCode($sCode);
        $this->assertSame(0, $this->bxSignedIn(), 'A locked account gets no sign-in from the right code.');
        $this->assertStringContainsString(explode('<a', _t('_sys_txt_login_locked', ''))[0], $sForm);
    }

    public function testExpiredCodeIsRefused(): void
    {
        $this->bxPasswordChecked('+1 555 010 4242');
        $this->bxSendCode();
        $aCode = $this->bxCode();
        $aCode['expires'] = time() - 1;
        BxDolSession::getInstance()->setValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_CODE, $aCode);

        $sForm = $this->bxEnterCode($aCode['code']);

        $this->assertSame(0, $this->bxSignedIn());
        $this->assertStringContainsString(explode('<a', _t('_sys_form_login_input_code_error_expired', ''))[0], $sForm);
    }

    public function testNoCodeWithoutThePassword(): void
    {
        $this->assertFalse($this->bxSendCode('+1 555 010 4242'), 'No form and no SMS before member.php has checked a password.');
        $this->assertSame([], BxTest2faSmsAlertsResponse::$aSent);

        $sForm = $this->bxEnterCode('123456');
        $this->assertSame(0, $this->bxSignedIn());
        $this->assertStringContainsString(explode('<a', _t('_sys_form_login_input_code_error_restart', ''))[0], $sForm);
    }
}
