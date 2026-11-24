<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Keeps the session cookie in memory instead of sending it: PHPUnit has printed output before a test runs.
 */
class BxDolSessionSecuritySpy extends BxDolSession
{
    public static function install(): self
    {
        unset($GLOBALS['bxDolClasses']['BxDolSession']);
        $o = new self();
        $GLOBALS['bxDolClasses']['BxDolSession'] = $o;
        return $o;
    }

    protected function sendCookie()
    {
        $_COOKIE[BX_DOL_SESSION_COOKIE] = $this->sId;
    }
}

/**
 * A session can't be fixed before sign-in or outlive what ends it: signing in gives the session a new id,
 * a session idle for too long or past its end stops working at once (not when the cron job deletes it),
 * and a changed or reset password ends the account's other sessions.
 */
#[Group('integration')]
class SessionSecurityTest extends BxDolIntegrationTestCase
{
    private $_aAccountBackup;
    private $_aOptionsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aOptionsBackup['sys_session_auth'] = getParam('sys_session_auth');
        setParam('sys_session_auth', 'on');

        $this->bxBecomeGuest();
        BxDolSessionSecuritySpy::install();
    }

    protected function tearDown(): void
    {
        if ($this->_aAccountBackup) {
            BxDolDb::getInstance()->query("UPDATE `sys_accounts` SET `password` = :password, `salt` = :salt WHERE `id` = :id", $this->_aAccountBackup);
            BxDolAccount::getInstance((int)$this->_aAccountBackup['id'], true);
        }

        $oSession = $GLOBALS['bxDolClasses']['BxDolSession'] ?? null;
        if ($oSession && $oSession->getId() && !$oSession->getUserId())
            $oSession->destroy(false);
        unset($_COOKIE[BX_DOL_SESSION_COOKIE]);

        parent::tearDown();

        unset($GLOBALS['bxDolClasses']['BxDolSession']);
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);
    }

    public function testSignInGivesTheSessionANewId(): void
    {
        $oAccount = $this->bxAccount('admin');

        // a guest session, whose id someone else may have planted in the browser
        $oSession = BxDolSession::getInstance();
        $oSession->start(true);
        $oSession->setValue('phpunit_kept', 'yes');
        $sGuestId = $oSession->getId();
        $this->assertNotEmpty($sGuestId);

        bx_login($oAccount->id());

        $this->assertNotSame($sGuestId, $oSession->getId(), 'The signed-in session has an id of its own.');
        $this->assertSame((int)$oAccount->id(), (int)$oSession->getUserId());
        $this->assertSame('yes', $oSession->getValue('phpunit_kept'), 'What the guest session held goes on.');
        $this->assertFalse($this->bxRow($sGuestId), 'The guest id signs nobody in.');
        $this->assertSame($oSession->getId(), $_COOKIE[BX_DOL_SESSION_COOKIE] ?? null, 'The browser gets the new id.');
    }

    public function testIdleSessionStopsWorkingWithoutCron(): void
    {
        $this->bxLoginAs('admin', false);
        $sId = BxDolSession::getInstance()->getId();
        BxDolDb::getInstance()->query("UPDATE `sys_sessions` SET `ttl` = 0, `date` = :date WHERE `id` = :id", ['date' => time() - BX_DOL_SESSION_IDLE_TIMEOUT - 60, 'id' => $sId]);

        $this->assertFalse((new BxDolSessionQuery())->exists($sId), 'An idle session is over.');

        $oSession = $this->bxNextRequest();
        $this->assertSame(0, (int)$oSession->getUserId());
        $this->assertNotSame($sId, $oSession->getId());
        $this->assertFalse($this->bxRow($sId), 'The ended session is deleted.');
    }

    public function testSessionInUseKeepsWorking(): void
    {
        $this->bxLoginAs('admin', false);
        $sId = BxDolSession::getInstance()->getId();

        $oSession = $this->bxNextRequest();
        $this->assertSame($sId, $oSession->getId());
        $this->assertSame((int)$this->bxAccount('admin')->id(), (int)$oSession->getUserId());
    }

    public function testPasswordChangeEndsOtherSessions(): void
    {
        $oAccount = $this->bxAccount('admin');
        $iId = (int)$oAccount->id();
        $this->_aAccountBackup = BxDolDb::getInstance()->getRow("SELECT `id`, `password`, `salt` FROM `sys_accounts` WHERE `id` = :id", ['id' => $iId]);

        $this->bxLoginAs('admin', false);
        $sCurrent = BxDolSession::getInstance()->getId();
        $sOther = $this->bxOtherSession($iId);
        $sOtherAccount = $this->bxOtherSession($iId + 100000);

        $this->assertTrue($oAccount->updatePassword('PhpUnit-' . bin2hex(random_bytes(4))));

        $this->assertNotFalse($this->bxRow($sCurrent), 'The session that changed the password goes on.');
        $this->assertFalse($this->bxRow($sOther), "The account's other sessions end.");
        $this->assertNotFalse($this->bxRow($sOtherAccount), 'Sessions of other accounts stay.');

        BxDolDb::getInstance()->query("DELETE FROM `sys_sessions` WHERE `id` = :id", ['id' => $sOtherAccount]);
    }

    public function testRequestInProgressDoesNotBringBackAnEndedSession(): void
    {
        $iId = (int)$this->bxAccount('admin')->id();
        $this->bxLoginAs('admin', false);
        $sId = BxDolSession::getInstance()->getId();

        // another request has read the session, then the password changes elsewhere and ends it
        $oInProgress = $this->bxNextRequest();
        $this->assertSame($sId, $oInProgress->getId());
        $this->assertSame(1, bx_end_other_sessions($iId, false));

        // the request in progress goes on and saves something in its session
        $oInProgress->setValue('phpunit_late', 'yes');

        $this->assertFalse($this->bxRow($sId), 'The ended session stays ended.');
    }

    public function testPasswordResetEndsEverySession(): void
    {
        $iId = (int)$this->bxAccount('admin')->id();
        $this->bxLoginAs('admin', false);
        $sCurrent = BxDolSession::getInstance()->getId();
        $sOther = $this->bxOtherSession($iId);

        $this->assertSame(2, bx_end_other_sessions($iId, false));

        $this->assertFalse($this->bxRow($sCurrent));
        $this->assertFalse($this->bxRow($sOther));
    }

    /**
     * A new request with the session's cookie: a fresh session object that reads the row again.
     */
    protected function bxNextRequest(): BxDolSessionSecuritySpy
    {
        $this->bxSyncSessionCookie();
        $oSession = BxDolSessionSecuritySpy::install();
        $oSession->getUserId();
        return $oSession;
    }

    protected function bxOtherSession(int $iAccountId): string
    {
        $sId = bin2hex(random_bytes(16));
        BxDolDb::getInstance()->query("INSERT INTO `sys_sessions` SET `id` = :id, `user_id` = :user, `data` = '', `date` = :date, `ttl` = 0", [
            'id' => $sId,
            'user' => $iAccountId,
            'date' => time(),
        ]);
        return $sId;
    }

    protected function bxRow(string $sId)
    {
        return BxDolDb::getInstance()->getRow("SELECT * FROM `sys_sessions` WHERE `id` = :id", ['id' => $sId]) ?: false;
    }
}
