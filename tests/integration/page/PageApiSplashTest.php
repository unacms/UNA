<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * The guest splash of the apps (Studio > Designer > Splash, BxDolSplash): the page API says `layout: 'splash'` for a
 * guest's home where the asking app's switch is on (X-Neo-Platform), falls back to sys_api_root_page_guest while a
 * switch was never saved, and sends the code prepared for the apps: markers as `<neo-slot>` placeholders, macros run,
 * scripts, handlers and site-only parts removed.
 */
#[Group('integration')]
class PageApiSplashTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = [
        'sys_api_root_page_guest', 'sys_site_splash_code', 'site_title',
        'sys_site_splash_web_enabled', 'sys_site_splash_ios_enabled', 'sys_site_splash_android_enabled',
        'sys_site_splash_code_web', 'sys_site_splash_code_ios', 'sys_site_splash_code_android',
    ];

    private array $_aOptionsBackup = [];
    private $_aGetBackup;
    private $_mPlatformBackup;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
        $this->_aGetBackup = $_GET;
        $this->_mPlatformBackup = $_SERVER['HTTP_X_NEO_PLATFORM'] ?? null;

        foreach (BxDolSplash::PLATFORMS as $sPlatform) {
            setParam(BxDolSplash::getOptionEnabled($sPlatform), '');
            setParam(BxDolSplash::getOptionCode($sPlatform), '');
        }

        $this->bxBecomeGuest();
        $GLOBALS['glMemCache'] = [];
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        $_GET = $this->_aGetBackup ?? [];
        if ($this->_mPlatformBackup === null)
            unset($_SERVER['HTTP_X_NEO_PLATFORM']);
        else
            $_SERVER['HTTP_X_NEO_PLATFORM'] = $this->_mPlatformBackup;

        BxDolDb::getInstance()->cleanMemoryAll();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    /** The home page as an app asks for it ('' sends no X-Neo-Platform). */
    private function requestHome(string $sPlatform): array
    {
        if ($sPlatform === '')
            unset($_SERVER['HTTP_X_NEO_PLATFORM']);
        else
            $_SERVER['HTTP_X_NEO_PLATFORM'] = $sPlatform;

        if (($sObject = BxDolPageQuery::getPageObjectNameByURI('home')))
            unset($GLOBALS['bxDolClasses']['BxDolPage!' . $sObject]);
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (strpos($sKey, 'BxDolMenu!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        BxDolMenu::setSelectedGlobal('', '');

        $_GET = ['api' => 1];
        // BxDolService::call keeps results per params within a process: each request here is a new one.
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/home', '', '[]'], 'TemplServicePages', true);
        $this->assertIsArray($aData);

        return $aData;
    }

    public static function platforms(): array
    {
        return [['web'], ['ios'], ['android']];
    }

    #[DataProvider('platforms')]
    public function testEachAppHasItsOwnSwitch(string $sPlatform): void
    {
        setParam('sys_api_root_page_guest', 'home');
        setParam('sys_site_splash_code', '<p>Hello</p>');
        setParam(BxDolSplash::getOptionEnabled($sPlatform), 'on');

        foreach (BxDolSplash::PLATFORMS as $sOther) {
            $aData = $this->requestHome($sOther);
            if ($sOther == $sPlatform) {
                $this->assertSame('splash', $aData['layout'], $sOther . ': its switch is on');
                $this->assertSame(['source' => 'una', 'code' => '<p>Hello</p>'], $aData['splash'] ?? null, $sOther);
            }
            else {
                $this->assertNotSame('splash', $aData['layout'], $sOther . ': its switch was never saved, the fallback is home');
                $this->assertArrayNotHasKey('splash', $aData, $sOther);
            }
        }

        // Off wins over the fallback.
        setParam('sys_api_root_page_guest', 'splash');
        setParam(BxDolSplash::getOptionEnabled($sPlatform), 'off');
        $this->assertNotSame('splash', $this->requestHome($sPlatform)['layout'], $sPlatform . ': switched off');
    }

    public function testUnsavedSwitchesFollowTheOlderOption(): void
    {
        setParam('sys_site_splash_code', '<p>Hello</p>');

        setParam('sys_api_root_page_guest', 'splash');
        foreach (BxDolSplash::PLATFORMS as $sPlatform)
            $this->assertTrue(BxDolSplash::getInstance()->isEnabledForApp($sPlatform), $sPlatform);
        $this->assertSame('splash', $this->requestHome('ios')['layout']);

        setParam('sys_api_root_page_guest', 'home');
        foreach (BxDolSplash::PLATFORMS as $sPlatform)
            $this->assertFalse(BxDolSplash::getInstance()->isEnabledForApp($sPlatform), $sPlatform);
        $this->assertNotSame('splash', $this->requestHome('ios')['layout']);
    }

    public function testAnyOtherClientCountsAsTheWebApp(): void
    {
        setParam('sys_site_splash_code', '<p>Hello</p>');
        setParam('sys_site_splash_web_enabled', 'on');
        setParam('sys_site_splash_ios_enabled', 'off');
        setParam('sys_site_splash_android_enabled', 'off');

        $this->assertSame('splash', $this->requestHome('')['layout'], 'no header');
        $this->assertSame('splash', $this->requestHome('Windows Phone')['layout'], 'a platform NEO does not send');
        $this->assertNotSame('splash', $this->requestHome('IOS')['layout'], 'the header is read in any case: IOS is iOS, which is off');
    }

    public function testMembersNeverGetTheSplash(): void
    {
        setParam('sys_site_splash_web_enabled', 'on');
        $this->bxLoginAsAdmin();

        $aData = $this->requestHome('web');
        $this->assertNotSame('splash', $aData['layout']);
        $this->assertArrayNotHasKey('splash', $aData);
    }

    public function testAnAppsOwnCodeWinsAndEmptyCodeIsLeftOut(): void
    {
        setParam('sys_site_splash_ios_enabled', 'on');
        setParam('sys_site_splash_web_enabled', 'on');
        setParam('sys_site_splash_code', '<p>Shared</p>');
        setParam('sys_site_splash_code_ios', '<p>iOS</p>');
        setParam('sys_site_splash_code_web', "  \n ");

        $this->assertSame('<p>iOS</p>', $this->requestHome('ios')['splash']['code']);
        $this->assertSame('<p>Shared</p>', $this->requestHome('web')['splash']['code'], 'blank app code uses the shared code');

        setParam('sys_site_splash_code', '');
        $this->assertSame(['source' => 'una'], $this->requestHome('web')['splash'], 'no code at all: the app draws its own splash');
    }

    public function testMarkersBecomePlaceholders(): void
    {
        setParam('site_title', 'Riverside Book Club');

        $sCode = BxDolSplash::getInstance()->getCodeForApp(
            '<header data-site-only>__logo__ <a href="__join_link__">Join</a></header>'
            . '<main class="m">__illustration__<h1 title="{site_title}">Welcome to {site_title}!</h1>'
            . '<div>__login_form_in_box__</div><div>__login_form__</div><div>__join_form_in_box__</div><div>__join_form__</div>'
            . '<a href="__login_link__">Sign in</a> <a href="__join_link__">Sign up</a> __logo__</main>'
            . '<footer data-site-only="1">Footer</footer>'
        );

        $this->assertSame(
            '<div class="m"><neo-slot name="illustration"></neo-slot><h1 title="Riverside Book Club">Welcome to <neo-slot name="site_title">Riverside Book Club</neo-slot>!</h1>'
            . '<div><neo-slot name="login_form"></neo-slot></div><div><neo-slot name="login_form"></neo-slot></div>'
            . '<div><neo-slot name="join_link"></neo-slot></div><div><neo-slot name="join_link"></neo-slot></div>'
            . '<a href="/login">Sign in</a> <a href="/create-account">Sign up</a> <neo-slot name="logo"></neo-slot></div>',
            $sCode
        );
    }

    public function testSiteTitleIsEscapedAndPlaceholdersCanBeWritten(): void
    {
        setParam('site_title', 'Tom & Jerry <Club>');

        $sCode = BxDolSplash::getInstance()->getCodeForApp('<img alt="{site_title}" src="data:image/png;base64,AAAA"><p>{site_title}</p><neo-slot name="social_login"></neo-slot>');

        $this->assertSame('<img alt="Tom &amp; Jerry &lt;Club&gt;" src="data:image/png;base64,AAAA"><p><neo-slot name="site_title">Tom &amp; Jerry &lt;Club&gt;</neo-slot></p><neo-slot name="social_login"></neo-slot>', $sCode);
    }

    public function testScriptsAndHandlersAreRemoved(): void
    {
        $sCode = BxDolSplash::getInstance()->getCodeForApp(
            '<script>alert(1)</script><SCRIPT src="https://example.com/x.js"></SCRIPT>'
            . '<div onclick="alert(2)" ONMOUSEOVER=\'alert(3)\' class="a">Text<!-- a comment --></div>'
            . '<a href=" JaVaScRiPt:alert(4)">One</a><a href="java&#x09;script:alert(5)">Two</a><a href="https://example.com/">Three</a>'
            . '<iframe srcdoc="<script>alert(6)</script>"></iframe><img src="x" onerror="alert(7)">'
            . '<a href="data:text/html,<script>alert(8)</script>">Four</a><form action="vbscript:x"></form>'
            . '<base href="https://evil.example/"><meta http-equiv="refresh" content="0;url=https://evil.example/">'
            . '<svg onload="alert(9)"><a xlink:href="javascript:alert(10)"><text>T</text></a></svg>'
            . '<style>.a { color: red; }</style>'
        );

        foreach (['<script', 'alert(1)', 'x.js', 'onclick', 'onmouseover', 'onerror', 'onload', 'srcdoc', 'javascript', 'vbscript', 'data:text', '<base', '<meta', 'a comment'] as $sBad)
            $this->assertStringNotContainsStringIgnoringCase($sBad, $sCode);

        $this->assertStringContainsString('<div class="a">Text</div>', $sCode);
        $this->assertStringContainsString('<a>One</a><a>Two</a><a href="https://example.com/">Three</a>', $sCode);
        $this->assertStringContainsString('<img src="x">', $sCode);
        $this->assertStringContainsString('<style>.a { color: red; }</style>', $sCode, 'styles stay: the web app uses them');
    }

    public function testTheDefaultCodeGivesTheAppsTheirOwnSplash(): void
    {
        $sCode = BxDolSplash::getInstance()->getCodeForApp((string)BxDolDb::getInstance()->getOne("SELECT `value` FROM `sys_options` WHERE `name` = 'sys_site_splash_code'"));

        $this->assertStringContainsString('<neo-slot name="illustration"></neo-slot>', $sCode);
        $this->assertStringContainsString('<neo-slot name="login_form"></neo-slot>', $sCode);
        $this->assertStringContainsString(_t('_sys_txt_splash_title'), $sCode);
        $this->assertStringNotContainsString('<main', $sCode, 'the apps have their own main landmark');
        $this->assertStringNotContainsString('<header', $sCode, 'site only');
        $this->assertStringNotContainsString('<footer', $sCode, 'site only');
        $this->assertStringNotContainsString('__', preg_replace('/<style>.*?<\/style>/s', '', $sCode), 'no marker is left');
    }

    public function testTheSiteFillsTheIllustration(): void
    {
        $sSvg = BxDolSplash::getInstance()->getIllustration();
        $this->assertStringContainsString('<svg', $sSvg);
        $this->assertStringContainsString('aria-hidden="true"', $sSvg);
    }
}
