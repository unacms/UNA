<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Which pages a site locked from guests (sys_lock_from_unauthenticated) still opens to them:
 * the pages in sys_lock_from_unauthenticated_exceptions and the login page, decided by the page alone.
 *
 * The options are changed in memory only, so the site itself is never locked by the test.
 */
#[Group('integration')]
class PageLockExceptionsTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_lock_from_unauthenticated', 'sys_lock_from_unauthenticated_exceptions'];

    protected $_aServerBackup;
    protected $_aOptionsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aServerBackup = $_SERVER;

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $mixedValue)
            $this->bxSetParamCache($sName, $mixedValue);

        $_SERVER = $this->_aServerBackup ?? $_SERVER;
        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    protected function lock(string $sExceptions, bool $bLocked = true): void
    {
        $this->bxSetParamCache('sys_lock_from_unauthenticated', $bLocked ? 'on' : '');
        $this->bxSetParamCache('sys_lock_from_unauthenticated_exceptions', $sExceptions);
    }

    public function testExceptionsOpenTheirPagesOnly(): void
    {
        $this->lock('about, terms ,home');

        foreach (['about', 'terms', 'home'] as $sUri)
            $this->assertFalse(BxDolPage::isLockedFromUnauthenticated($sUri), $sUri);

        foreach (['view-post', 'dashboard', 'abou', ''] as $sUri)
            $this->assertTrue(BxDolPage::isLockedFromUnauthenticated($sUri), $sUri);
    }

    public function testLoginPagesAreAlwaysOpen(): void
    {
        // Locked pages send guests to the login page, and two-factor login goes on to its SMS and code steps:
        // none of them can be locked, or nobody could sign in.
        $this->lock('');

        foreach (['login', 'login-step2', 'login-step3'] as $sUri)
            $this->assertFalse(BxDolPage::isLockedFromUnauthenticated($sUri), $sUri);

        foreach (['login-step4', 'view-post'] as $sUri)
            $this->assertTrue(BxDolPage::isLockedFromUnauthenticated($sUri), $sUri);
    }

    public function testLoginStepsShowNothingBeforeThePassword(): void
    {
        // Open to guests, so they must give nothing away until member.php has checked a password.
        $oSession = BxDolSession::getInstance();
        $oSession->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID);
        $oSession->unsetValue(BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE);

        $oService = new BxTemplServiceLogin();
        $this->assertFalse($oService->serviceLoginFormStep2(), 'No phone form without an account that passed the password check.');

        // The code form shows, but no code is accepted without one sent by the SMS step.
        $_POST = ['code' => '1234', 'do_checkcode' => '1', 'role' => (string)BX_DOL_ROLE_MEMBER];
        BxDolForm::unSetObjectInstance('sys_login', 'sys_login_step3');
        $sForm = $oService->serviceLoginFormStep3();
        BxDolForm::unSetObjectInstance('sys_login', 'sys_login_step3');

        $this->assertIsString($sForm);
        $this->assertFalse(isLogged());
    }

    public static function requests(): array
    {
        return [
            'api' => ['/api.php?r=system/get_page_by_request/TemplServicePages', '/api.php'],
            'oauth2 in the query string' => ['/page.php?i=view-post&id=1&back=/oauth2/', '/page.php'],
            'oauth2 in the path info' => ['/page.php/oauth2/?i=view-post&id=1', '/page.php/oauth2/'],
            'member.php in the path info' => ['/page.php/member.php?i=view-post&id=1', '/page.php/member.php'],
            'oauth2 module' => ['/m/oauth2/com/get_page_by_request', '/modules/index.php'],
            'member.php' => ['/member.php', '/member.php'],
        ];
    }

    #[DataProvider('requests')]
    public function testTheRequestHasNoSay(string $sRequestUri, string $sPhpSelf): void
    {
        $this->lock('login,home');
        $_SERVER['REQUEST_URI'] = $sRequestUri;
        $_SERVER['PHP_SELF'] = $sPhpSelf;

        $this->assertTrue(BxDolPage::isLockedFromUnauthenticated('view-post'));
        $this->assertFalse(BxDolPage::isLockedFromUnauthenticated('home'));
    }

    public function testNoRequestNeeded(): void
    {
        // CLI has neither REQUEST_URI nor PHP_SELF of a web request.
        $this->lock('home');
        unset($_SERVER['REQUEST_URI'], $_SERVER['PHP_SELF']);

        $this->assertTrue(BxDolPage::isLockedFromUnauthenticated('view-post'));
    }

    public function testUnlockedSiteAndMembersAreNotLocked(): void
    {
        $this->lock('', false);
        $this->assertFalse(BxDolPage::isLockedFromUnauthenticated('view-post'));

        $this->lock('');
        $this->bxLoginAsAdmin();
        $this->assertFalse(BxDolPage::isLockedFromUnauthenticated('view-post'));
    }
}
