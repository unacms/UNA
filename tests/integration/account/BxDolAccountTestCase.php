<?php

if (!function_exists('MsgBox'))
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';

/**
 * Pretend mail was sent so account create/edit does not block on SMTP.
 */
class BxTestSkipMailAlertsResponse extends BxDolAlertsResponse
{
    public function response($oAlert)
    {
        if ($oAlert->sUnit === 'system' && $oAlert->sAction === 'check_send_mail')
            $oAlert->aExtras['override_result'] = true;
    }
}

/**
 * Shared helpers for account create/edit/delete integration tests.
 */
abstract class BxDolAccountTestCase extends BxDolIntegrationTestCase
{
    protected $_iCreatedAccountId = 0;

    protected $_aCreatedEmails = [];

    protected $_aAlertsCacheBackup;

    protected $_sConfirmationBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sConfirmationBackup = getParam('sys_account_confirmation_type');
        $this->bxSetParamCache('sys_account_confirmation_type', BX_ACCOUNT_CONFIRMATION_NONE);
        $this->bxInstallTestAlertHandlers();
    }

    protected function tearDown(): void
    {
        $this->bxCleanupCreatedAccount();
        $this->bxRestoreTestAlertHandlers();
        if ($this->_sConfirmationBackup !== null)
            $this->bxSetParamCache('sys_account_confirmation_type', $this->_sConfirmationBackup);
        parent::tearDown();
    }

    protected function bxAccountForm(string $sDisplay): BxTemplFormAccount
    {
        BxDolForm::unSetObjectInstance('sys_account', $sDisplay);
        $oForm = BxDolForm::getObjectInstance('sys_account', $sDisplay);
        $this->assertInstanceOf(BxTemplFormAccount::class, $oForm);
        $oForm->aParams['csrf']['disable'] = true;

        return $oForm;
    }

    protected function bxSubmitCreateForm(string $sName, string $sEmail, string $sPassword): BxTemplFormAccount
    {
        $oForm = $this->bxAccountForm('sys_account_create');
        $_POST = [
            'name' => $sName,
            'email' => $sEmail,
            'password' => $sPassword,
            'receive_news' => '1',
            'do_publish' => '1',
        ];
        $oForm->initChecker();

        return $oForm;
    }

    protected function bxCreateLifecycleAccount(string $sName = 'Lifecycle User', string $sPassword = 'UnaTest1a'): array
    {
        $this->bxBecomeGuest();

        $sEmail = 'lifecycle-' . bin2hex(random_bytes(4)) . '@example.com';
        $this->_aCreatedEmails[] = $sEmail;

        $oForm = $this->bxSubmitCreateForm($sName, $sEmail, $sPassword);
        $this->assertTrue($oForm->isSubmittedAndValid(), $oForm->getFormErrors() ?: 'create account form should accept the posted values');

        $iAccountId = $oForm->insert(['email_confirmed' => 0]);
        $this->assertNotFalse($iAccountId);
        $this->_iCreatedAccountId = (int)$iAccountId;

        BxDolProfileQuery::getInstance()->getInfoById((int)$iAccountId, true);
        $iProfileId = (new BxTemplAccountForms())->onAccountCreated($iAccountId, $oForm->isSetPendingApproval());
        $this->assertGreaterThan(0, (int)$iProfileId);

        $oAccount = BxDolAccount::getInstance($iAccountId, true);
        $this->assertInstanceOf(BxDolAccount::class, $oAccount);

        $aInfo = $oAccount->getInfo();
        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);

        return [
            'id' => (int)$iAccountId,
            'profile_id' => (int)$iProfileId,
            'email' => $sEmail,
            'name' => $sName,
            'password' => $sPassword,
            'account' => $oAccount,
        ];
    }

    protected function bxSubmitEmailForm(int $iAccountId, string $sEmail, string $sPassword): string
    {
        $this->bxAccountForm('sys_account_settings_email');
        $_POST = [
            'email' => $sEmail,
            'password_current' => $sPassword,
            'receive_updates' => '1',
            'receive_news' => '1',
            'do_submit' => '1',
        ];

        return (new BxTemplAccountForms())->editAccountEmailSettingsForm($iAccountId);
    }

    protected function bxSubmitInfoForm(int $iAccountId, string $sName): string
    {
        $this->bxAccountForm('sys_account_settings_info');
        $_POST = [
            'name' => $sName,
            'do_submit' => '1',
        ];

        return (new BxTemplAccountForms())->editAccountInfoForm($iAccountId);
    }

    protected function bxSubmitDeleteForm(BxDolAccount $oAccount, string $sPassword, string $sConfirm = '1'): BxTemplFormAccount
    {
        $oForm = $this->bxAccountForm('sys_account_settings_del_account');
        $_POST = [
            'delete_content' => '0',
            'delete_confirm' => $sConfirm,
            'password_current' => $sPassword,
            'do_submit' => '1',
        ];
        $oForm->initChecker($oAccount->getInfo());

        return $oForm;
    }

    protected function bxAccountIdByEmail(string $sEmail): int
    {
        return (int)BxDolAccountQuery::getInstance()->getIdByEmail($sEmail);
    }

    protected function bxAccountIdByName(string $sName): int
    {
        return (int)BxDolDb::getInstance()->getOne('SELECT `id` FROM `sys_accounts` WHERE `name` = :name', [
            'name' => $sName,
        ]);
    }

    protected function bxAssertAccountsTableIntact(): void
    {
        $this->assertTrue(BxDolDb::getInstance()->isTableExists('sys_accounts'));
        $this->assertGreaterThan(0, $this->bxAccountIdByEmail($this->bxTestEmail('admin')));
    }

    protected function bxAssertFormRejected(BxDolForm $oForm, string $sField = ''): void
    {
        $this->assertTrue($oForm->isSubmitted());
        $this->assertFalse($oForm->isSubmittedAndValid(), $oForm->getFormErrors() ?: 'form should reject the posted values');
        if ($sField !== '')
            $this->assertNotEmpty($oForm->aInputs[$sField]['error'] ?? '', $sField . ' should have a checker error');
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    protected function bxInstallTestAlertHandlers(): void
    {
        new BxDolAlerts('system', 'phpunit_init', 0, 0);

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $this->_aAlertsCacheBackup = $oProp->getValue();
        $aCache = $this->_aAlertsCacheBackup;

        foreach ($aCache['handlers'] as $mixedId => $aHandler) {
            if (in_array($aHandler['class'] ?? '', ['BxSMTPAlertsResponse', 'BxMapShowAlertsResponse'], true))
                $aCache['handlers'][$mixedId]['active'] = 0;
        }

        $sId = 'phpunit_skip_mail';
        $aCache['handlers'][$sId] = [
            'name' => $sId,
            'class' => BxTestSkipMailAlertsResponse::class,
            'file' => 'tests/integration/account/BxDolAccountTestCase.php',
            'service_call' => '',
            'active' => 1,
        ];
        $aCache['alerts']['system']['check_send_mail'][] = $sId;
        $oProp->setValue(null, $aCache);
    }

    protected function bxRestoreTestAlertHandlers(): void
    {
        if ($this->_aAlertsCacheBackup === null)
            return;

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $oProp->setValue(null, $this->_aAlertsCacheBackup);
        $this->_aAlertsCacheBackup = null;
    }

    protected function bxCleanupCreatedAccount(): void
    {
        $aEmails = $this->_aCreatedEmails;
        if ($this->_iCreatedAccountId)
            $aEmails[] = $this->_iCreatedAccountId;

        foreach (array_unique($aEmails) as $mixedId) {
            $oAccount = BxDolAccount::getInstance($mixedId, true);
            if (!$oAccount)
                continue;

            $sJob = 'account_delete_' . $oAccount->id();
            $oJobs = BxDolBackgroundJobs::getInstance();
            if ($oJobs->exists($sJob))
                $oJobs->delete($sJob);

            $oAccount->delete(false, false);
        }

        $this->_iCreatedAccountId = 0;
        $this->_aCreatedEmails = [];
    }
}
