<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Account forms reject invalid emails, weak/wrong passwords, and injection payloads.
 */
#[Group('integration')]
class AccountValidationTest extends BxDolAccountTestCase
{
    static public function providerForRejectedCreateEmails(): array
    {
        return [
            'empty' => [''],
            'no-at' => ['not-an-email'],
            'double-at' => ['a@b@c.com'],
            'leading-dot' => ['.user@example.com'],
            'underscore-domain' => ['user@exam_ple.com'],
            'sql-or' => ["admin@example.com' OR '1'='1"],
            'sql-comment' => ["' OR 1=1 --"],
            'sql-union' => ["x' UNION SELECT password FROM sys_accounts --@example.com"],
            'sql-drop' => ["'; DROP TABLE sys_accounts; --"],
            'xss' => ['<script>alert(1)</script>@example.com'],
        ];
    }

    static public function providerForRejectedCreatePasswords(): array
    {
        return [
            'empty' => [''],
            'too-short' => ['Ab1'],
            'no-digit' => ['Password'],
            'no-upper' => ['password1'],
            'no-lower' => ['PASSWORD1'],
            'sql-or' => ["' OR '1'='1"],
            'sql-comment' => ["' OR 1=1 --"],
        ];
    }

    static public function providerForRejectedCreateNames(): array
    {
        return [
            'empty' => [''],
            'at-prefix' => ['@admin'],
        ];
    }

    static public function providerForMaliciousNames(): array
    {
        return [
            'sql-or' => ["' OR '1'='1"],
            'sql-drop' => ["'; DROP TABLE sys_accounts; --"],
            'sql-delete' => ['1; DELETE FROM sys_accounts --'],
            'xss-script' => ['<script>alert(1)</script>'],
            'xss-img' => ['<img src=x onerror=alert(1)>'],
        ];
    }

    static public function providerForRejectedPasswordsCurrent(): array
    {
        return [
            'wrong' => ['not-the-password'],
            'empty' => [''],
            'sql-or' => ["' OR '1'='1"],
            'sql-comment' => ["' OR 1=1 --"],
            'sql-drop' => ["'; DROP TABLE sys_accounts; --"],
        ];
    }

    #[DataProvider('providerForRejectedCreateEmails')]
    public function testCreateFormRejectsInvalidEmail(string $sEmail): void
    {
        $this->bxBecomeGuest();
        $sName = 'lifecycle-' . bin2hex(random_bytes(4));

        $oForm = $this->bxSubmitCreateForm($sName, $sEmail, 'UnaTest1a');
        $this->bxAssertFormRejected($oForm, 'email');

        $iCreatedId = $this->bxAccountIdByName($sName);
        if ($iCreatedId)
            $this->_iCreatedAccountId = $iCreatedId;
        $this->assertSame(0, $iCreatedId);
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForRejectedCreatePasswords')]
    public function testCreateFormRejectsInvalidPassword(string $sPassword): void
    {
        $this->bxBecomeGuest();
        $sEmail = 'lifecycle-' . bin2hex(random_bytes(4)) . '@example.com';

        $oForm = $this->bxSubmitCreateForm('Lifecycle User', $sEmail, $sPassword);
        $this->bxAssertFormRejected($oForm, 'password');
        $this->assertSame(0, $this->bxAccountIdByEmail($sEmail));
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForRejectedCreateNames')]
    public function testCreateFormRejectsInvalidName(string $sName): void
    {
        $this->bxBecomeGuest();
        $sEmail = 'lifecycle-' . bin2hex(random_bytes(4)) . '@example.com';

        $oForm = $this->bxSubmitCreateForm($sName, $sEmail, 'UnaTest1a');
        $this->bxAssertFormRejected($oForm, 'name');
        $this->assertSame(0, $this->bxAccountIdByEmail($sEmail));
        $this->bxAssertAccountsTableIntact();
    }

    public function testCreateFormRejectsDuplicateEmail(): void
    {
        $this->bxBecomeGuest();
        $sEmail = $this->bxTestEmail('admin');
        $iExistingId = $this->bxAccountIdByEmail($sEmail);
        $this->assertGreaterThan(0, $iExistingId);

        $oForm = $this->bxSubmitCreateForm('Lifecycle User', $sEmail, 'UnaTest1a');
        $this->bxAssertFormRejected($oForm, 'email');
        $this->assertSame($iExistingId, $this->bxAccountIdByEmail($sEmail));
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForMaliciousNames')]
    public function testCreateFormTreatsMaliciousNameAsData(string $sName): void
    {
        $this->bxBecomeGuest();
        $sEmail = 'lifecycle-' . bin2hex(random_bytes(4)) . '@example.com';

        $oForm = $this->bxSubmitCreateForm($sName, $sEmail, 'UnaTest1a');
        if (!$oForm->isSubmittedAndValid()) {
            $this->assertSame(0, $this->bxAccountIdByEmail($sEmail));
            $this->bxAssertAccountsTableIntact();
            return;
        }

        $this->_aCreatedEmails[] = $sEmail;
        $iAccountId = $oForm->insert(['email_confirmed' => 0]);
        $this->assertNotFalse($iAccountId);
        $this->_iCreatedAccountId = (int)$iAccountId;
        (new BxTemplAccountForms())->onAccountCreated($iAccountId, $oForm->isSetPendingApproval());

        $this->assertSame((int)$iAccountId, $this->bxAccountIdByEmail($sEmail));
        $this->bxAssertAccountsTableIntact();

        $oAccount = BxDolAccount::getInstance($iAccountId, true);
        $this->assertInstanceOf(BxDolAccount::class, $oAccount);
        $this->assertSame($sEmail, $oAccount->getEmail());
        $this->assertStringNotContainsString('<script', strtolower($oAccount->getDisplayName()));
    }

    #[DataProvider('providerForRejectedCreateEmails')]
    public function testEmailFormRejectsInvalidEmail(string $sEmail): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $sResult = $this->bxSubmitEmailForm($aCreated['id'], $sEmail, $aCreated['password']);

        $this->assertIsString($sResult);
        $this->assertStringNotContainsString(_t('_sys_account_settings_email_successfully_submitted'), $sResult);

        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);
        $this->assertSame($aCreated['email'], $oAccount->getEmail());
        $this->assertSame($aCreated['id'], $this->bxAccountIdByEmail($aCreated['email']));
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForRejectedPasswordsCurrent')]
    public function testEmailFormRejectsWrongPassword(string $sPassword): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $sEmailNew = 'lifecycle-' . bin2hex(random_bytes(4)) . '-new@example.com';
        $sResult = $this->bxSubmitEmailForm($aCreated['id'], $sEmailNew, $sPassword);

        $this->assertIsString($sResult);
        $this->assertStringNotContainsString(_t('_sys_account_settings_email_successfully_submitted'), $sResult);

        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);
        $this->assertSame($aCreated['email'], $oAccount->getEmail());
        $this->assertSame(0, $this->bxAccountIdByEmail($sEmailNew));
        $this->bxAssertAccountsTableIntact();
    }

    public function testEmailFormRejectsDuplicateEmail(): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $sResult = $this->bxSubmitEmailForm($aCreated['id'], $this->bxTestEmail('admin'), $aCreated['password']);

        $this->assertIsString($sResult);
        $this->assertStringNotContainsString(_t('_sys_account_settings_email_successfully_submitted'), $sResult);

        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);
        $this->assertSame($aCreated['email'], $oAccount->getEmail());
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForRejectedCreateNames')]
    public function testInfoFormRejectsInvalidName(string $sName): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $sResult = $this->bxSubmitInfoForm($aCreated['id'], $sName);

        $this->assertIsString($sResult);
        $this->assertStringNotContainsString(_t('_sys_account_settings_info_successfully_submitted'), $sResult);

        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);
        $this->assertSame($aCreated['name'], $oAccount->getDisplayName());
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForMaliciousNames')]
    public function testInfoFormTreatsMaliciousNameAsData(string $sName): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $sResult = $this->bxSubmitInfoForm($aCreated['id'], $sName);
        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);

        if (!str_contains((string)$sResult, _t('_sys_account_settings_info_successfully_submitted'))) {
            $this->assertSame($aCreated['name'], $oAccount->getDisplayName());
            $this->bxAssertAccountsTableIntact();
            return;
        }

        $this->assertSame($aCreated['email'], $oAccount->getEmail());
        $this->assertStringNotContainsString('<script', strtolower($oAccount->getDisplayName()));
        $this->bxAssertAccountsTableIntact();
    }

    #[DataProvider('providerForRejectedPasswordsCurrent')]
    public function testDeleteFormRejectsWrongPassword(string $sPassword): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $oForm = $this->bxSubmitDeleteForm($aCreated['account'], $sPassword);
        $this->bxAssertFormRejected($oForm, 'password_current');
        $this->assertInstanceOf(BxDolAccount::class, BxDolAccount::getInstance($aCreated['id'], true));
        $this->bxAssertAccountsTableIntact();
    }

    public function testDeleteFormRejectsMissingConfirm(): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $oForm = $this->bxSubmitDeleteForm($aCreated['account'], $aCreated['password'], '');
        $this->bxAssertFormRejected($oForm, 'delete_confirm');
        $this->assertInstanceOf(BxDolAccount::class, BxDolAccount::getInstance($aCreated['id'], true));
        $this->bxAssertAccountsTableIntact();
    }
}
