<?php

/**
 * Shared helpers for integration tests that talk to a live UNA install.
 */
abstract class BxDolIntegrationTestCase extends BxDolTestCase
{
    protected $_aAccountAuthBackups;
    protected $_aLoggedBackup;
    protected $_aPostBackup;
    protected $_aCookieBackup;

    protected function setUp(): void
    {
        $this->_aAccountAuthBackups = [];
        foreach (['admin', 'user'] as $sKind) {
            $oAccount = BxDolAccount::getInstance($this->bxTestEmail($sKind));
            if (!$oAccount)
                continue;

            $aInfo = $oAccount->getInfo();
            $this->_aAccountAuthBackups[(int)$oAccount->id()] = [
                'login_attempts' => (int)$aInfo['login_attempts'],
                'locked' => (int)$aInfo['locked'],
            ];
        }

        $this->_aLoggedBackup = [
            'member' => !empty($GLOBALS['logged']['member']),
            'admin' => !empty($GLOBALS['logged']['admin']),
        ];
        $this->_aPostBackup = $_POST;
        $this->_aCookieBackup = $_COOKIE;
    }

    protected function tearDown(): void
    {
        $this->bxBecomeGuest();
        $this->bxRestoreAccountAuth();

        $_POST = $this->_aPostBackup ?? [];
        $_COOKIE = $this->_aCookieBackup ?? [];

        BxDolForm::unSetObjectInstance('sys_login', 'sys_login');

        $GLOBALS['logged']['member'] = $this->_aLoggedBackup['member'] ?? false;
        $GLOBALS['logged']['admin'] = $this->_aLoggedBackup['admin'] ?? false;
    }

    protected function bxAccount(string $sKind = 'admin'): BxDolAccount
    {
        $sEmail = $this->bxTestEmail($sKind);
        $oAccount = BxDolAccount::getInstance($sEmail, true);
        if (!$oAccount)
            $this->markTestSkipped('Account ' . $sEmail . ' is not installed.');

        return $oAccount;
    }

    protected function bxBecomeGuest(): void
    {
        $oSession = BxDolSession::getInstance();
        if ($oSession->getId() || $oSession->getUserId() || isLogged())
            bx_logout(false);

        unset($_COOKIE['memberID'], $_COOKIE['memberPassword'], $_COOKIE[BX_DOL_SESSION_COOKIE]);
        $this->bxSetLoggedFlags(0);
    }

    protected function bxSetLoggedFlags(int $iRole): void
    {
        $GLOBALS['logged']['member'] = (bool)($iRole & BX_DOL_ROLE_MEMBER);
        $GLOBALS['logged']['admin'] = (bool)($iRole & BX_DOL_ROLE_ADMIN);
    }

    protected function bxSyncSessionCookie(): void
    {
        $sId = BxDolSession::getInstance()->getId();
        if ($sId)
            $_COOKIE[BX_DOL_SESSION_COOKIE] = $sId;
        else
            unset($_COOKIE[BX_DOL_SESSION_COOKIE]);
    }

    protected function bxLoginAs(string $sKind = 'admin', bool $bRememberMe = false): array
    {
        $oAccount = $this->bxAccount($sKind);
        $aInfo = bx_login($oAccount->id(), $bRememberMe);
        $this->assertIsArray($aInfo, 'bx_login should return account info.');
        $this->assertSame((int)$oAccount->id(), (int)BxDolSession::getInstance()->getUserId());

        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);

        return $aInfo;
    }

    protected function bxLoginAsAdmin(bool $bRememberMe = false): array
    {
        return $this->bxLoginAs('admin', $bRememberMe);
    }

    protected function bxLoginAsUser(bool $bRememberMe = false): array
    {
        return $this->bxLoginAs('user', $bRememberMe);
    }

    protected function bxSubmitLoginForm(string $sEmail, string $sPassword): BxBaseFormLogin
    {
        BxDolForm::unSetObjectInstance('sys_login', 'sys_login');

        $_POST = [
            'ID' => $sEmail,
            'Password' => $sPassword,
            'role' => (string)BX_DOL_ROLE_MEMBER,
            'login' => '1',
        ];

        $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login');
        $this->assertInstanceOf(BxBaseFormLogin::class, $oForm);

        $oForm->aParams['csrf']['disable'] = true;
        $oForm->initChecker();

        return $oForm;
    }

    protected function bxTestEmail(string $sKind = 'admin'): string
    {
        $this->bxAssertAccountKind($sKind);
        return $sKind === 'user'
            ? $this->bxEnv('UNA_TEST_USER_EMAIL', 'user@example.com')
            : $this->bxEnv('UNA_TEST_ADMIN_EMAIL', 'admin@example.com');
    }

    protected function bxTestPassword(string $sKind = 'admin'): string
    {
        $this->bxAssertAccountKind($sKind);
        return $sKind === 'user'
            ? $this->bxEnv('UNA_TEST_USER_PASSWORD', 'unauna')
            : $this->bxEnv('UNA_TEST_ADMIN_PASSWORD', 'unauna');
    }

    protected function bxAssertAccountKind(string $sKind): void
    {
        if ($sKind !== 'admin' && $sKind !== 'user')
            $this->fail('Unknown test account kind: ' . $sKind);
    }

    protected function bxEnv(string $sName, string $sDefault): string
    {
        $s = getenv($sName);
        if ($s === false || $s === '')
            $s = $_ENV[$sName] ?? $_SERVER[$sName] ?? '';
        return ($s !== '') ? (string)$s : $sDefault;
    }

    protected function bxRestoreAccountAuth(): void
    {
        if (!$this->_aAccountAuthBackups)
            return;

        foreach ($this->_aAccountAuthBackups as $iId => $aBackup) {
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `login_attempts` = :attempts, `locked` = :locked WHERE `id` = :id", [
                'attempts' => $aBackup['login_attempts'],
                'locked' => $aBackup['locked'],
                'id' => $iId,
            ]);
            BxDolAccount::getInstance($iId, true);
        }
    }
}
