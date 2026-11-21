<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/BxDolAccountMailTestCase.php';

/**
 * A member with a confirmed email changes it: the account keeps the current email, for signing in
 * and password recovery, and its profile stays visible, until the code sent to the new address is
 * entered. The current address is told about the change.
 */
#[Group('integration')]
class EmailChangeTest extends BxDolAccountMailTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->bxSetParamCache('sys_account_confirmation_type', BX_ACCOUNT_CONFIRMATION_EMAIL);
    }

    /**
     * A new account with its email confirmed, signed in.
     */
    private function bxConfirmedAccount(): array
    {
        $a = $this->bxCreateLifecycleAccount('Email Change');
        $a['account']->updateEmailConfirmed(true, false);
        $a['account'] = BxDolAccount::getInstance($a['id'], true);
        $this->assertTrue($a['account']->isConfirmedEmail());
        BxTestRecordMailAlertsResponse::$aSent = [];

        return $a;
    }

    private function bxNewEmail(): string
    {
        $sEmail = 'lifecycle-' . bin2hex(random_bytes(4)) . '-new@example.com';
        $this->_aCreatedEmails[] = $sEmail;

        return $sEmail;
    }

    private function bxCodeFrom(array $aMail): string
    {
        $this->assertSame(1, preg_match('/[?&]code=(\d+)/', $aMail['body'], $m), 'The confirmation letter should have the link with the code.');

        return $m[1];
    }

    public function testNewEmailWaitsForItsConfirmation(): void
    {
        $a = $this->bxConfirmedAccount();
        $sNew = $this->bxNewEmail();

        $sResult = $this->bxSubmitEmailForm($a['id'], $sNew, $a['password']);
        $this->assertStringContainsString(_t('_sys_txt_account_email_change_sent', $sNew, $a['email']), $sResult);

        $oAccount = BxDolAccount::getInstance($a['id'], true);
        $this->assertSame($a['email'], $oAccount->getEmail(), 'The account keeps its email until the new one is confirmed.');
        $this->assertSame($sNew, $oAccount->getEmailPending());
        $this->assertTrue($oAccount->isConfirmedEmail(), 'The account stays confirmed.');
        $this->assertTrue($oAccount->isConfirmed(), 'Its profiles stay visible to others, @see BxDolProfile::isActive');

        // the unconfirmed address neither signs in nor recovers the password
        $this->assertSame($a['id'], $this->bxAccountIdByEmail($a['email']));
        $this->assertSame(0, $this->bxAccountIdByEmail($sNew));

        $aToNew = $this->bxMailsTo($sNew);
        $this->assertCount(1, $aToNew, 'The new address gets the confirmation.');
        $this->assertSame($this->bxTemplateSubject('t_ConfirmEmailChange'), $aToNew[0]['subject']);

        $aToOld = $this->bxMailsTo($a['email']);
        $this->assertCount(1, $aToOld, 'The current address is told about the change.');
        $this->assertSame($this->bxTemplateSubject('t_EmailChangeRequested'), $aToOld[0]['subject']);
        $this->assertStringContainsString($sNew, $aToOld[0]['body']);
    }

    public function testCodeSwitchesTheEmailAndTellsThePreviousAddress(): void
    {
        $a = $this->bxConfirmedAccount();
        $sNew = $this->bxNewEmail();
        $this->bxSubmitEmailForm($a['id'], $sNew, $a['password']);
        $sCode = $this->bxCodeFrom($this->bxMailsTo($sNew)[0]);
        BxTestRecordMailAlertsResponse::$aSent = [];

        $this->assertTrue((new BxTemplServiceAccount())->serviceConfirmEmail($sCode));

        $oAccount = BxDolAccount::getInstance($a['id'], true);
        $this->assertSame($sNew, $oAccount->getEmail());
        $this->assertSame('', $oAccount->getEmailPending());
        $this->assertTrue($oAccount->isConfirmedEmail());
        $this->assertSame($a['id'], $this->bxAccountIdByEmail($sNew));
        $this->assertSame(0, $this->bxAccountIdByEmail($a['email']));

        $aToOld = $this->bxMailsTo($a['email']);
        $this->assertCount(1, $aToOld);
        $this->assertSame($this->bxTemplateSubject('t_EmailChanged'), $aToOld[0]['subject']);

        // the code is used up
        $this->assertNotTrue((new BxTemplServiceAccount())->serviceConfirmEmail($sCode));
    }

    public function testAddressTakenMeanwhileIsNotTakenOver(): void
    {
        $a = $this->bxConfirmedAccount();
        $sNew = $this->bxNewEmail();
        $this->bxSubmitEmailForm($a['id'], $sNew, $a['password']);
        $sCode = $this->bxCodeFrom($this->bxMailsTo($sNew)[0]);

        // another account signs up with that address before the code is entered
        $iOther = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_accounts` WHERE `id` != :id ORDER BY `id` LIMIT 1", ['id' => $a['id']]);
        $this->assertGreaterThan(0, $iOther);
        $sOtherEmail = BxDolAccount::getInstance($iOther, true)->getEmail();
        BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `email` = :email WHERE `id` = :id", ['email' => $sNew, 'id' => $iOther]);
        try {
            $this->assertNotTrue((new BxTemplServiceAccount())->serviceConfirmEmail($sCode));

            $oAccount = BxDolAccount::getInstance($a['id'], true);
            $this->assertSame($a['email'], $oAccount->getEmail());
            $this->assertSame($iOther, $this->bxAccountIdByEmail($sNew));
        }
        finally {
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `email` = :email WHERE `id` = :id", ['email' => $sOtherEmail, 'id' => $iOther]);
            BxDolAccount::getInstance($iOther, true);
        }
    }

    public function testSavingTheCurrentEmailCancelsTheChange(): void
    {
        $a = $this->bxConfirmedAccount();
        $sNew = $this->bxNewEmail();
        $this->bxSubmitEmailForm($a['id'], $sNew, $a['password']);
        $sCode = $this->bxCodeFrom($this->bxMailsTo($sNew)[0]);
        $this->bxSubmitEmailForm($a['id'], $a['email'], $a['password']);

        $oAccount = BxDolAccount::getInstance($a['id'], true);
        $this->assertSame('', $oAccount->getEmailPending());
        $this->assertNotTrue((new BxTemplServiceAccount())->serviceConfirmEmail($sCode), 'A cancelled change is not confirmed later.');
        $this->assertSame($a['email'], BxDolAccount::getInstance($a['id'], true)->getEmail());
    }

    public function testUnconfirmedAccountChangesItsEmailAtOnce(): void
    {
        $a = $this->bxCreateLifecycleAccount('Email Change');
        $this->assertFalse($a['account']->isConfirmedEmail());
        $sNew = $this->bxNewEmail();

        $this->bxSubmitEmailForm($a['id'], $sNew, $a['password']);

        $oAccount = BxDolAccount::getInstance($a['id'], true);
        $this->assertSame($sNew, $oAccount->getEmail(), 'An address that was never confirmed has nothing to keep.');
        $this->assertSame('', $oAccount->getEmailPending());
        $this->assertCount(1, $this->bxMailsTo($sNew), 'The confirmation goes to the new address.');
    }

    public function testPasswordChangeSendsANotice(): void
    {
        $a = $this->bxConfirmedAccount();

        $this->bxAccountForm('sys_account_settings_pwd');
        $_POST = [
            'password_current' => $a['password'],
            'password' => 'UnaTest2b',
            'password_confirm' => 'UnaTest2b',
            'do_submit' => '1',
        ];
        $sResult = (new BxTemplAccountForms())->editAccountPasswordSettingsForm($a['id']);
        $this->assertIsString($sResult);

        $aToAccount = $this->bxMailsTo($a['email']);
        $this->assertCount(1, $aToAccount);
        $this->assertSame($this->bxTemplateSubject('t_PasswordChanged'), $aToAccount[0]['subject']);
        $this->assertStringNotContainsString('UnaTest2b', $sResult, 'The password fields are empty after saving.');
    }
}
