<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Records the session cookies instead of sending them: PHPUnit has printed output before
 * a test runs, so PHP can't send headers here.
 */
class BxDolSessionCookieSpy extends BxDolSession
{
    public $aCookies = [];

    public static function install(): self
    {
        unset($GLOBALS['bxDolClasses']['BxDolSession']);
        $o = new self();
        $GLOBALS['bxDolClasses']['BxDolSession'] = $o;
        return $o;
    }

    protected function sendCookie()
    {
        $this->aCookies[] = ['id' => $this->sId, 'expires' => $this->iTTL];
    }
}

/**
 * Members stay signed in: the login form has no "Remember me" switch, the long-lived cookie
 * goes out with the login response, and a session in use keeps moving its end forward.
 */
#[Group('integration')]
class RememberMeSessionTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!getParam('sys_session_auth'))
            $this->markTestSkipped('Needs session authentication (sys_session_auth).');
        if ($this->bxLifetime() < 2 * BX_DOL_SESSION_TTL_STEP)
            $this->markTestSkipped('Needs a session lifetime of at least two days.');

        BxDolSessionCookieSpy::install();
    }

    protected function tearDown(): void
    {
        // Guest sessions the tests made (logout only deletes a member's).
        $oSession = $GLOBALS['bxDolClasses']['BxDolSession'] ?? null;
        if ($oSession && $oSession->getId() && !$oSession->getUserId())
            $oSession->destroy(false);
        unset($_COOKIE[BX_DOL_SESSION_COOKIE]);

        parent::tearDown();

        unset($GLOBALS['bxDolClasses']['BxDolSession']);
    }

    public function testLoginFormHasNoRememberMeSwitch(): void
    {
        $oForm = $this->bxSubmitLoginForm($this->bxTestEmail(), $this->bxTestPassword());

        $this->assertArrayNotHasKey('rememberMe', $oForm->aInputs, 'The login form no longer offers the switch.');
        $this->assertSame(bx_is_remember_me(), $oForm->getRememberMe(), 'Without the switch the site setting decides.');
    }

    public function testRememberedLoginSendsLongLivedCookieAtOnce(): void
    {
        $this->bxLoginAs('admin', true);

        $oSession = $this->bxSpy();
        $iEnd = time() + $this->bxLifetime();
        $this->assertEqualsWithDelta($iEnd, $oSession->getTTL(), 5);
        $this->assertEqualsWithDelta($iEnd, (int)$this->bxRow($oSession->getId())['ttl'], 5);

        $aLast = end($oSession->aCookies);
        $this->assertSame($oSession->getId(), $aLast['id']);
        $this->assertEqualsWithDelta($iEnd, $aLast['expires'], 5, 'The login response itself carries the long-lived cookie.');
        $this->assertFalse($oSession->isValue('remember_me'), 'Nothing is left for the next request to do.');
    }

    public function testLoginWithoutRememberMeEndsWithBrowser(): void
    {
        $this->bxLoginAs('admin', false);

        $oSession = $this->bxSpy();
        $this->assertSame(0, $oSession->getTTL());
        $this->assertSame(0, end($oSession->aCookies)['expires']);
    }

    public function testSessionInUseMovesItsEndForward(): void
    {
        $this->bxLoginAs('admin', true);
        $sId = $this->bxSpy()->getId();
        $this->bxSetTTL($sId, time() + $this->bxLifetime() - 2 * BX_DOL_SESSION_TTL_STEP);

        $oSession = $this->bxNextRequest();

        $this->assertSame($sId, $oSession->getId());
        $this->assertSame((int)$this->bxAccount('admin')->id(), (int)$oSession->getUserId());
        $iEnd = time() + $this->bxLifetime();
        $this->assertEqualsWithDelta($iEnd, $oSession->getTTL(), 5);
        $this->assertEqualsWithDelta($iEnd, (int)$this->bxRow($sId)['ttl'], 5);
        $this->assertEqualsWithDelta($iEnd, end($oSession->aCookies)['expires'], 5);
    }

    public function testRecentlyMovedEndStaysAndSiteSendsNoCookie(): void
    {
        $this->bxLoginAs('admin', true);
        $sId = $this->bxSpy()->getId();
        $iEnd = time() + $this->bxLifetime() - 3600;
        $this->bxSetTTL($sId, $iEnd);

        $oSession = $this->bxNextRequest();

        $this->assertSame($iEnd, $oSession->getTTL(), 'The end moves at most once per BX_DOL_SESSION_TTL_STEP.');
        $this->assertSame([], $oSession->aCookies, 'Site responses, cached files among them, carry no cookie.');
    }

    public function testApiResponseRepeatsCookie(): void
    {
        $this->bxLoginAs('admin', true);
        $sId = $this->bxSpy()->getId();
        $iEnd = time() + $this->bxLifetime() - 3600;
        $this->bxSetTTL($sId, $iEnd);

        $_GET['api'] = 1;
        try {
            $oSession = $this->bxNextRequest();
        } finally {
            unset($_GET['api']);
        }

        $this->assertSame([['id' => $sId, 'expires' => $iEnd]], $oSession->aCookies, 'Every API response repeats the cookie.');
    }

    public function testSessionPastItsEndIsNotRevived(): void
    {
        $this->bxLoginAs('admin', true);
        $sId = $this->bxSpy()->getId();
        $this->bxSetTTL($sId, time() - 60);

        $oSession = $this->bxNextRequest();

        $this->assertSame(0, (int)$oSession->getUserId());
        $this->assertNotSame($sId, $oSession->getId());
        $this->assertFalse($this->bxRow($sId), 'The ended session is deleted.');
    }

    public function testGuestSessionGetsNoLongLivedCookie(): void
    {
        $oSession = $this->bxSpy();
        $oSession->setValue('test_guest', 1);
        $this->bxSyncSessionCookie();

        $oSession = $this->bxNextRequest();

        $this->assertSame(0, (int)$oSession->getUserId());
        $this->assertSame(0, $oSession->getTTL());
        $this->assertSame([], $oSession->aCookies, 'A guest whose cookie matches gets no Set-Cookie.');
    }

    protected function bxSpy(): BxDolSessionCookieSpy
    {
        $oSession = BxDolSession::getInstance();
        $this->assertInstanceOf(BxDolSessionCookieSpy::class, $oSession);
        return $oSession;
    }

    /**
     * A new request with the session's cookie: a fresh session object that reads the row again.
     */
    protected function bxNextRequest(): BxDolSessionCookieSpy
    {
        $this->bxSyncSessionCookie();
        $oSession = BxDolSessionCookieSpy::install();
        $oSession->getUserId();
        $this->bxSyncSessionCookie();
        return $oSession;
    }

    protected function bxLifetime(): int
    {
        return 60 * (int)getParam('sys_session_lifetime_in_min');
    }

    protected function bxRow(string $sId)
    {
        return BxDolDb::getInstance()->getRow("SELECT * FROM `sys_sessions` WHERE `id` = :id", ['id' => $sId]) ?: false;
    }

    protected function bxSetTTL(string $sId, int $iTTL): void
    {
        BxDolDb::getInstance()->query("UPDATE `sys_sessions` SET `ttl` = :ttl WHERE `id` = :id", ['ttl' => $iTTL, 'id' => $sId]);
    }
}
