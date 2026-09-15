<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Create an account, change its email and name, then delete it on a live install.
 */
#[Group('integration')]
class AccountLifecycleTest extends BxDolAccountTestCase
{
    public function testCreateEditAndDeleteAccount(): void
    {
        $aCreated = $this->bxCreateLifecycleAccount();
        $sEmail = $aCreated['email'];
        $sEmailNew = 'lifecycle-' . bin2hex(random_bytes(4)) . '-new@example.com';
        $sNameNew = 'Lifecycle Renamed';
        $this->_aCreatedEmails[] = $sEmailNew;

        $this->assertTrue(isLogged());
        $this->assertSame($aCreated['id'], (int)getLoggedId());
        $this->assertSame($sEmail, $aCreated['account']->getEmail());
        $this->assertSame($aCreated['name'], $aCreated['account']->getDisplayName());

        $sEmailResult = $this->bxSubmitEmailForm($aCreated['id'], $sEmailNew, $aCreated['password']);
        $this->assertIsString($sEmailResult);
        $this->assertStringContainsString(_t('_sys_account_settings_email_successfully_submitted'), $sEmailResult);

        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);
        $this->assertInstanceOf(BxDolAccount::class, $oAccount);
        $this->assertSame($sEmailNew, $oAccount->getEmail());
        $this->assertSame(0, $this->bxAccountIdByEmail($sEmail));
        $this->assertSame($aCreated['id'], $this->bxAccountIdByEmail($sEmailNew));

        $sNameResult = $this->bxSubmitInfoForm($aCreated['id'], $sNameNew);
        $this->assertIsString($sNameResult);
        $this->assertStringContainsString(_t('_sys_account_settings_info_successfully_submitted'), $sNameResult);

        $oAccount = BxDolAccount::getInstance($aCreated['id'], true);
        $this->assertInstanceOf(BxDolAccount::class, $oAccount);
        $this->assertSame($sNameNew, $oAccount->getDisplayName());
        $this->assertSame($sEmailNew, $oAccount->getEmail());

        $oDeleteForm = $this->bxSubmitDeleteForm($oAccount, $aCreated['password']);
        $this->assertTrue($oDeleteForm->isSubmittedAndValid(), $oDeleteForm->getFormErrors() ?: 'delete account form should accept the posted values');

        $this->assertTrue($oAccount->delete((int)$oDeleteForm->getCleanValue('delete_content') != 0, false));
        $this->_iCreatedAccountId = 0;

        $this->bxBecomeGuest();
        $this->assertFalse(BxDolAccount::getInstance($sEmailNew, true));
        $this->assertSame(0, $this->bxAccountIdByEmail($sEmail));
        $this->assertSame(0, $this->bxAccountIdByEmail($sEmailNew));
        $this->assertEmpty(BxDolAccountQuery::getInstance()->getInfoById($aCreated['id']));
        $this->assertEmpty(BxDolDb::getInstance()->getColumn("SELECT `id` FROM `sys_profiles` WHERE `account_id` = :id", [
            'id' => $aCreated['id'],
        ]));
    }
}
