<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/BxDolAccountMailTestCase.php';

/**
 * Forgot password replies the same whether an account uses the email or not, so nobody can test
 * which addresses have accounts. Only an account's own address gets the letter.
 */
#[Group('integration')]
class ForgotPasswordReplyTest extends BxDolAccountMailTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->bxSetParamCache('sys_account_confirmation_type', BX_ACCOUNT_CONFIRMATION_EMAIL);
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        BxDolForm::unSetObjectInstance('sys_forgot_password', 'sys_forgot_password');
        parent::tearDown();
    }

    private function bxSubmitForgot(string $sEmail): string
    {
        BxDolForm::unSetObjectInstance('sys_forgot_password', 'sys_forgot_password');
        $oForm = BxDolForm::getObjectInstance('sys_forgot_password', 'sys_forgot_password');
        $this->assertInstanceOf(BxDolForm::class, $oForm);
        $oForm->aParams['csrf']['disable'] = true;
        unset($oForm->aInputs['captcha']);

        $_POST = ['email' => $sEmail, 'do_submit' => '1'];
        $mixed = (new BxTemplServiceAccount())->serviceForgotPassword();
        $this->assertIsString($mixed);

        return $mixed;
    }

    public function testUnknownAndKnownEmailsGetTheSameReply(): void
    {
        $a = $this->bxCreateLifecycleAccount('Forgot Password');
        $this->bxBecomeGuest();
        BxTestRecordMailAlertsResponse::$aSent = [];

        $sUnknown = 'nobody-' . bin2hex(random_bytes(4)) . '@example.com';
        $sReplyUnknown = $this->bxSubmitForgot($sUnknown);
        $sReplyKnown = $this->bxSubmitForgot($a['email']);

        $sNeutral = _t('_sys_txt_forgot_pasword_check_email');
        $this->assertStringContainsString($sNeutral, $sReplyUnknown);
        $this->assertStringContainsString($sNeutral, $sReplyKnown);
        $this->assertStringNotContainsString(_t('_sys_form_forgot_password_email_not_recognized'), $sReplyUnknown);

        $this->assertCount(0, $this->bxMailsTo($sUnknown));
        $aToAccount = $this->bxMailsTo($a['email']);
        $this->assertCount(1, $aToAccount, 'The account gets the reset link.');
        $this->assertSame($this->bxTemplateSubject('t_Forgot'), $aToAccount[0]['subject']);
    }

    public function testMalformedEmailIsStillRejected(): void
    {
        $sReply = $this->bxSubmitForgot('not an email');
        $this->assertStringNotContainsString(_t('_sys_txt_forgot_pasword_check_email'), $sReply);
        $this->assertCount(0, BxTestRecordMailAlertsResponse::$aSent);
    }

    public function testPendingEmailDoesNotRecoverThePassword(): void
    {
        $a = $this->bxCreateLifecycleAccount('Forgot Password');
        $a['account']->updateEmailConfirmed(true, false);
        $sNew = 'lifecycle-' . bin2hex(random_bytes(4)) . '-new@example.com';
        $this->_aCreatedEmails[] = $sNew;
        $this->assertTrue(BxDolAccount::getInstance($a['id'], true)->requestEmailChange($sNew));
        $this->bxBecomeGuest();
        BxTestRecordMailAlertsResponse::$aSent = [];

        $this->bxSubmitForgot($sNew);

        $this->assertCount(0, BxTestRecordMailAlertsResponse::$aSent, 'An address waiting for its confirmation gets no reset link.');
    }
}
