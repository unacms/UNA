<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Takes the SMS of phone confirmation instead of sending it.
 */
class BxTestConfirmPhoneSmsAlertsResponse extends BxDolAlertsResponse
{
    public static $aSent = [];

    public function response($oAlert)
    {
        if ($oAlert->sUnit !== 'account' || $oAlert->sAction !== 'before_confirm_phone_send_sms')
            return;

        self::$aSent[] = ['phone' => $oAlert->aExtras['phone_number'], 'text' => $oAlert->aExtras['sms_text']];
        $oAlert->aExtras['override_result'] = true;
    }
}

/**
 * Confirm phone (page confirm-phone): a new phone becomes the account's only once the code sent to it is entered,
 * the code is six random digits that expire and allow BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS tries,
 * and one account or phone gets BX_ACCOUNT_SMS_SENDS_LIMIT codes an hour.
 *
 * The test changes the user test account's phone and puts it back.
 */
#[Group('integration')]
class PhoneConfirmationTest extends BxDolIntegrationTestCase
{
    private const PHONE = '+1 555 015 2047';

    private $_aAccountBackup;
    private $_aAlertsCacheBackup;
    private $_mixedConfirmationTypeBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $oAccount = $this->bxAccount('user');
        $this->_aAccountBackup = BxDolDb::getInstance()->getRow("SELECT `id`, `phone`, `phone_confirmed` FROM `sys_accounts` WHERE `id` = :id", ['id' => $oAccount->id()]);
        BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `phone` = '', `phone_confirmed` = 0 WHERE `id` = :id", ['id' => $oAccount->id()]);
        BxDolAccount::getInstance((int)$oAccount->id(), true);

        // the site asks members to confirm their phones
        $this->_mixedConfirmationTypeBackup = getParam('sys_account_confirmation_type');
        $this->bxSetParamCache('sys_account_confirmation_type', BX_ACCOUNT_CONFIRMATION_PHONE);

        $this->bxResetSmsLimits();
        $this->bxInstallSmsHandler();
        $this->bxLoginAs('user');
        BxDolSession::getInstance()->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
    }

    protected function tearDown(): void
    {
        BxDolSession::getInstance()->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
        $this->bxBecomeGuest();
        $this->bxResetSmsLimits();

        if ($this->_aAccountBackup) {
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `phone` = :phone, `phone_confirmed` = :phone_confirmed WHERE `id` = :id", $this->_aAccountBackup);
            BxDolAccount::getInstance((int)$this->_aAccountBackup['id'], true);
        }

        $this->bxSetParamCache('sys_account_confirmation_type', $this->_mixedConfirmationTypeBackup);

        if ($this->_aAlertsCacheBackup !== null)
            (new ReflectionProperty(BxDolAlerts::class, '_aCacheData'))->setValue(null, $this->_aAlertsCacheBackup);
        BxTestConfirmPhoneSmsAlertsResponse::$aSent = [];

        foreach (['sys_confirm_phone_set_phone', 'sys_confirm_phone_confirmation'] as $sDisplay)
            BxDolForm::unSetObjectInstance('sys_confirm_phone', $sDisplay);

        parent::tearDown();
    }

    public function testNewPhoneWaitsForItsCode(): void
    {
        $this->bxSendCode(self::PHONE);

        $this->assertCount(1, BxTestConfirmPhoneSmsAlertsResponse::$aSent);
        $this->assertSame(self::PHONE, BxTestConfirmPhoneSmsAlertsResponse::$aSent[0]['phone']);
        $aCode = $this->bxCode();
        $this->assertMatchesRegularExpression('/^\d{6}$/', $aCode['code'], 'Six random digits.');
        $this->assertSame('', $this->bxAccountInfo()['phone'], 'The account keeps its phone until the code is entered.');

        $this->bxEnterCode($aCode['code']);

        $aInfo = $this->bxAccountInfo();
        $this->assertSame(self::PHONE, $aInfo['phone']);
        $this->assertSame(1, (int)$aInfo['phone_confirmed']);
        $this->assertFalse(BxDolSession::getInstance()->isValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE));
    }

    public function testWrongCodesEndTheCode(): void
    {
        $this->bxSendCode(self::PHONE);
        $aCode = $this->bxCode();
        $sWrong = $aCode['code'] === '000000' ? '111111' : '000000';

        for ($i = 0; $i < BX_ACCOUNT_2FA_LOGIN_CODE_ATTEMPTS; $i++)
            $this->bxEnterCode($sWrong);

        $this->assertFalse(BxDolSession::getInstance()->isValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE), 'The code is gone after the last try.');
        $this->bxEnterCode($aCode['code']);
        $aInfo = $this->bxAccountInfo();
        $this->assertSame('', $aInfo['phone'], 'The right code after the tries confirms nothing.');
        $this->assertSame(0, (int)$aInfo['phone_confirmed']);
    }

    public function testExpiredCodeIsRefused(): void
    {
        $this->bxSendCode(self::PHONE);
        $aCode = $this->bxCode();
        $aCode['expires'] = time() - 1;
        BxDolSession::getInstance()->setValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE, $aCode);

        $this->bxEnterCode($aCode['code']);

        $this->assertSame(0, (int)$this->bxAccountInfo()['phone_confirmed']);
    }

    public function testSmsSendsAreLimited(): void
    {
        $iId = (int)$this->bxAccount('user')->id();

        for ($i = 0; $i < BX_ACCOUNT_SMS_SENDS_LIMIT; $i++)
            $this->assertTrue(bx_sms_code_send_allowed($iId, '+1 555 015 3' . $i . '00'), 'Codes within the limit go out.');
        $this->assertFalse(bx_sms_code_send_allowed($iId, '+1 555 015 3999'), 'The account has used up its codes, whatever the phone.');

        for ($i = 0; $i < BX_ACCOUNT_SMS_SENDS_LIMIT; $i++)
            $this->assertTrue(bx_sms_code_send_allowed($iId + 100000 + $i, '+1 555 015 4000'));
        $this->assertFalse(bx_sms_code_send_allowed($iId + 200000, '+1-555-015-4000'), 'The phone has had its codes, whatever the account.');
    }

    public function testUsedUpLimitSendsNoSms(): void
    {
        $iId = (int)$this->bxAccount('user')->id();
        for ($i = 0; $i < BX_ACCOUNT_SMS_SENDS_LIMIT; $i++)
            bx_sms_code_send_allowed($iId, self::PHONE);

        $this->bxSendCode(self::PHONE);

        $this->assertCount(0, BxTestConfirmPhoneSmsAlertsResponse::$aSent);
        $this->assertFalse(BxDolSession::getInstance()->isValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE));
    }

    protected function bxSendCode(string $sPhone)
    {
        return $this->bxPost('sys_confirm_phone_set_phone', ['phone' => $sPhone, 'do_sendsms' => '1'], 1);
    }

    protected function bxEnterCode(string $sCode)
    {
        return $this->bxPost('sys_confirm_phone_confirmation', ['code' => $sCode, 'do_submit' => '1'], 2);
    }

    /**
     * Post a display of the form to the confirm-phone service, as its page does.
     */
    protected function bxPost(string $sDisplay, array $aPost, int $iStep)
    {
        BxDolDb::getInstance()->cleanMemoryAll();
        BxDolAccount::getInstance((int)$this->_aAccountBackup['id'], true);

        BxDolForm::unSetObjectInstance('sys_confirm_phone', $sDisplay);
        $oForm = BxDolForm::getObjectInstance('sys_confirm_phone', $sDisplay);
        $oForm->aParams['csrf']['disable'] = true;

        $_POST = $aPost;
        $_GET['step'] = $iStep;
        $mixedResult = @(new BxTemplServiceAccount())->servicePhoneConfirmation();
        $_POST = [];
        unset($_GET['step']);

        BxDolForm::unSetObjectInstance('sys_confirm_phone', $sDisplay);
        return $mixedResult;
    }

    protected function bxCode(): array
    {
        $aCode = BxDolSession::getInstance()->getValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);
        $this->assertIsArray($aCode, 'A code is waiting in the session.');
        return $aCode;
    }

    protected function bxAccountInfo(): array
    {
        BxDolDb::getInstance()->cleanMemoryAll();
        return BxDolDb::getInstance()->getRow("SELECT `phone`, `phone_confirmed` FROM `sys_accounts` WHERE `id` = :id", ['id' => $this->_aAccountBackup['id']]);
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    protected function bxResetSmsLimits(): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_keys` WHERE `salt` = 'named_counter'");
    }

    protected function bxInstallSmsHandler(): void
    {
        new BxDolAlerts('system', 'phpunit_init', 0, 0);

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $this->_aAlertsCacheBackup = $oProp->getValue();

        $aCache = $this->_aAlertsCacheBackup;
        $aCache['handlers']['phpunit_confirm_phone_sms'] = [
            'name' => 'phpunit_confirm_phone_sms',
            'class' => BxTestConfirmPhoneSmsAlertsResponse::class,
            'file' => 'tests/integration/account/PhoneConfirmationTest.php',
            'service_call' => '',
            'active' => 1,
        ];
        $aCache['alerts']['account']['before_confirm_phone_send_sms'][] = 'phpunit_confirm_phone_sms';
        $oProp->setValue(null, $aCache);
    }
}
