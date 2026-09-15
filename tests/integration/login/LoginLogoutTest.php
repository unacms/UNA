<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Login and logout against a live install using admin and regular-user accounts.
 */
#[Group('integration')]
class LoginLogoutTest extends BxDolIntegrationTestCase
{
    static public function providerForAccounts()
    {
        return [
            'admin' => ['admin'],
            'user' => ['user'],
        ];
    }

    #[DataProvider('providerForAccounts')]
    public function testValidCredentialsAreAccepted(string $sKind): void
    {
        $this->bxAccount($sKind);
        $this->assertSame('', bx_check_password($this->bxTestEmail($sKind), $this->bxTestPassword($sKind), BX_DOL_ROLE_MEMBER));
    }

    #[DataProvider('providerForAccounts')]
    public function testInvalidPasswordIsRejected(string $sKind): void
    {
        $this->bxAccount($sKind);
        $sError = bx_check_password($this->bxTestEmail($sKind), 'not-the-password', BX_DOL_ROLE_MEMBER);

        $this->assertNotSame('', $sError);
        $this->assertFalse(isLogged());
        $this->assertSame(0, (int)getLoggedId());
    }

    #[DataProvider('providerForAccounts')]
    public function testLoginEstablishesSession(string $sKind): void
    {
        $this->assertFalse(isLogged());

        $oAccount = $this->bxAccount($sKind);
        $aInfo = $this->bxLoginAs($sKind);

        $this->assertSame((int)$oAccount->id(), (int)$aInfo['id']);
        $this->assertSame($this->bxTestEmail($sKind), $aInfo['email']);
        $this->assertTrue(isLogged());
        $this->assertTrue(isMember());
        $this->assertSame((int)$oAccount->id(), (int)getLoggedId());
        $this->assertSame((int)$oAccount->id(), (int)BxDolSession::getInstance()->getUserId());

        if ($sKind === 'admin')
            $this->assertTrue(isAdmin());
        else
            $this->assertFalse(isAdmin());
    }

    #[DataProvider('providerForAccounts')]
    public function testLogoutClearsSession(string $sKind): void
    {
        $this->bxLoginAs($sKind);
        $this->assertTrue(isLogged());

        bx_logout();
        $this->bxBecomeGuest();

        $this->assertFalse(isLogged());
        $this->assertFalse(isAdmin());
        $this->assertFalse(isMember());
        $this->assertSame(0, (int)getLoggedId());
        $this->assertSame(0, (int)BxDolSession::getInstance()->getUserId());
    }

    #[DataProvider('providerForAccounts')]
    public function testLoginFormAcceptsCredentials(string $sKind): void
    {
        $this->bxAccount($sKind);
        $oForm = $this->bxSubmitLoginForm($this->bxTestEmail($sKind), $this->bxTestPassword($sKind));

        $this->assertTrue($oForm->isSubmitted());
        $this->assertTrue($oForm->isSubmittedAndValid(), $oForm->getLoginError() ?: 'login form should accept ' . $sKind . ' credentials');

        $oAccount = BxDolAccount::getInstance(trim($oForm->getCleanValue('ID')));
        $this->assertInstanceOf(BxDolAccount::class, $oAccount);

        $aInfo = bx_login($oAccount->id(), $oForm->getRememberMe());
        $this->assertIsArray($aInfo);
        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);

        $this->assertTrue(isLogged());
        $this->assertSame((int)$oAccount->id(), (int)getLoggedId());
        if ($sKind === 'admin')
            $this->assertTrue(isAdmin());
        else
            $this->assertFalse(isAdmin());
    }

    #[DataProvider('providerForAccounts')]
    public function testLoginFormRejectsWrongPassword(string $sKind): void
    {
        $this->bxAccount($sKind);
        $oForm = $this->bxSubmitLoginForm($this->bxTestEmail($sKind), 'not-the-password');

        $this->assertTrue($oForm->isSubmitted());
        $this->assertFalse($oForm->isSubmittedAndValid());
        $this->assertNotSame('', $oForm->getLoginError());
        $this->assertFalse(isLogged());
    }

    #[DataProvider('providerForAccounts')]
    public function testServiceLogoutEndsSession(string $sKind): void
    {
        $this->bxLoginAs($sKind);
        $this->assertTrue(isLogged());

        $this->assertTrue(bx_srv('system', 'logout', [false], 'TemplServiceContent'));
        $this->bxBecomeGuest();

        $this->assertFalse(isLogged());
        $this->assertSame(0, (int)getLoggedId());
    }
}
