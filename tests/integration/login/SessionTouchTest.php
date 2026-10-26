<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A session in use moves its `date` (last activity) at most once per touch interval instead of
 * on every request, and signing out still records that moment as the member's last activity.
 */
#[Group('integration')]
class SessionTouchTest extends BxDolIntegrationTestCase
{
    private $_aOptionsBackup = [];
    private $_aActiveBackup = [];
    private $_sId;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['sys_account_online_time', 'sys_session_auth'] as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
        $this->bxSetParamCache('sys_account_online_time', '5');

        $this->_sId = genRndPwd(32, false);
        (new BxDolSessionQuery())->save($this->_sId, ['user_id' => 0, 'ttl' => 0, 'data' => serialize([])]);
    }

    protected function tearDown(): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_sessions` WHERE `id` = :id", ['id' => $this->_sId]);
        foreach ($this->_aActiveBackup as $iAccountId => $iActive)
            BxDolAccountQuery::getInstance()->_updateField($iAccountId, 'active', $iActive);

        // Without this the parent's next request would find the deleted session's cookie and send a new one.
        unset($_COOKIE[BX_DOL_SESSION_COOKIE], $GLOBALS['bxDolClasses']['BxDolSession']);

        foreach ($this->_aOptionsBackup as $sName => $sValue)
            $this->bxSetParamCache($sName, $sValue);

        parent::tearDown();
    }

    public function testRecentlyTouchedSessionIsNotWritten(): void
    {
        $iDate = time() - 10;
        $this->bxSetDate($iDate);

        $this->assertTrue($this->bxNextSession()->exists($this->_sId));
        $this->assertSame($iDate, $this->bxDate(), 'A session touched 10 s ago keeps its date.');
    }

    public function testSessionOlderThanTheIntervalIsTouched(): void
    {
        $this->bxSetDate(time() - BX_DOL_SESSION_TOUCH_INTERVAL - 5);

        $this->assertTrue($this->bxNextSession()->exists($this->_sId));
        $this->assertEqualsWithDelta(time(), $this->bxDate(), 2);
    }

    public function testNoOnlineWindowTouchesEveryRequest(): void
    {
        $this->bxSetParamCache('sys_account_online_time', '0');
        $this->bxSetDate(time() - 10);

        $this->assertTrue($this->bxNextSession()->exists($this->_sId));
        $this->assertEqualsWithDelta(time(), $this->bxDate(), 2, 'The interval stays under half the online window.');
    }

    /**
     * The whole request, in both authentication modes: start() finds the session by its cookie,
     * and in session auth mode save() runs after exists() and must not write either.
     */
    public function testRequestWritesOnlyAStaleSession(): void
    {
        foreach (['on', ''] as $sAuth) {
            $this->bxSetParamCache('sys_session_auth', $sAuth);

            $iDate = time() - 10;
            $this->bxSetDate($iDate);
            $this->assertSame($this->_sId, $this->bxNextRequest()->getId());
            $this->assertSame($iDate, $this->bxDate(), 'A fresh session is not written (sys_session_auth=' . $sAuth . ').');

            $this->bxSetDate(time() - BX_DOL_SESSION_TOUCH_INTERVAL - 5);
            $this->assertSame($this->_sId, $this->bxNextRequest()->getId());
            $this->assertEqualsWithDelta(time(), $this->bxDate(), 2, 'A stale session is touched (sys_session_auth=' . $sAuth . ').');
        }
    }

    public function testSignOutRecordsTheMomentAsLastActivity(): void
    {
        $iAccountId = (int)$this->bxAccount('admin')->id();
        $oAccountQuery = BxDolAccountQuery::getInstance();
        $this->_aActiveBackup[$iAccountId] = (int)$oAccountQuery->getInfoById($iAccountId)['active'];
        $oAccountQuery->_updateField($iAccountId, 'active', time() - 1000);
        BxDolDb::getInstance()->query("UPDATE `sys_sessions` SET `user_id` = :user_id, `date` = :date WHERE `id` = :id", [
            'user_id' => $iAccountId,
            'date' => time() - 10,
            'id' => $this->_sId,
        ]);

        $oSession = $this->bxNextSession();
        $this->assertTrue($oSession->exists($this->_sId));
        $oSession->destroy(false);

        $this->assertSame(0, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_sessions` WHERE `id` = :id", ['id' => $this->_sId]));
        $this->assertEqualsWithDelta(time(), (int)$oAccountQuery->getInfoById($iAccountId)['active'], 2, 'The session date was 10 s old; signing out is the last activity.');
    }

    /**
     * Set an option for this process only: the database is shared with the running site.
     */
    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    /**
     * A fresh session object that reads the row again.
     */
    protected function bxNextSession(): BxDolSession
    {
        unset($GLOBALS['bxDolClasses']['BxDolSession']);
        return BxDolSession::getInstance();
    }

    /**
     * A new request that carries the session's cookie and goes through start().
     */
    protected function bxNextRequest(): BxDolSession
    {
        $_COOKIE[BX_DOL_SESSION_COOKIE] = $this->_sId;
        $oSession = $this->bxNextSession();
        $oSession->getUserId();
        return $oSession;
    }

    protected function bxSetDate(int $iDate): void
    {
        BxDolDb::getInstance()->query("UPDATE `sys_sessions` SET `date` = :date WHERE `id` = :id", ['date' => $iDate, 'id' => $this->_sId]);
    }

    protected function bxDate(): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT `date` FROM `sys_sessions` WHERE `id` = :id", ['id' => $this->_sId]);
    }
}
