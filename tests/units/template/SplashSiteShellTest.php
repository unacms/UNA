<?php

/**
 * The site's splash (splash.php) is drawn in the guests' page shell, between the site's header and footer. So the
 * default splash code (install SQL) has no header, footer or <main> of its own, and one <h1>; splash.php asks for no
 * bare page and tells the shell when the code has the page's heading.
 */
class SplashSiteShellTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return $s;
    }

    private static function defaultCode(): string
    {
        if (!preg_match("/\\(@iCategoryId, 'sys_site_splash_code', '', '(.*)', 'text', '', '', '', \\d+\\),/", self::read('install/sql/system.sql'), $aMatch))
            self::fail('The default splash code is not in install SQL.');

        return str_replace(['\r\n', "\\'"], ["\n", "'"], $aMatch[1]);
    }

    public function testDefaultCodeHasNoHeaderFooterOrMainOfItsOwn(): void
    {
        $s = self::defaultCode();

        $this->assertDoesNotMatchRegularExpression('/<(header|footer|main)\b/', $s);
        $this->assertDoesNotMatchRegularExpression('/<[^>]*data-site-only/', $s, 'No element is for the site only.');
        $this->assertStringNotContainsString('bx-landing-header', $s);
        $this->assertStringNotContainsString('bx-landing-footer', $s);
    }

    public function testDefaultCodeHasThePagesHeadingAndTheSignInForm(): void
    {
        $s = self::defaultCode();

        $this->assertSame(1, preg_match_all('/<h1\b/', $s));
        $this->assertStringContainsString('__login_form_in_box__', $s);
        $this->assertStringContainsString('__illustration__', $s);
    }

    public function testDefaultCodeFillsTheFirstScreenUnderTheHeader(): void
    {
        $s = self::defaultCode();

        $this->assertStringContainsString('min-height: calc(100dvh - 4rem);', $s);
        $this->assertDoesNotMatchRegularExpression('/min-height: 100vh;/', $s);
    }

    public function testSplashPageUsesTheGuestsShell(): void
    {
        $s = self::read('splash.php');

        $this->assertStringNotContainsString('BX_PAGE_TYPE_DEFAULT_WO_HF', $s, 'A bare page has no site header or footer.');
        $this->assertStringContainsString('BxDolCover::getInstance()->setPageHasHeading();', $s);
    }

    public function testMigrationChangesOnlyTheDefaultCode(): void
    {
        $s = self::read('migrations/2026111880_splash_in_site_shell.sql');

        $this->assertMatchesRegularExpression("/WHERE `name` = 'sys_site_splash_code' AND REPLACE\\(`value`, '\\\\r', ''\\) = REPLACE\\('/", $s);
        $this->assertSame(1, substr_count($s, 'UPDATE `sys_options`'));
        $this->assertStringContainsString('<header class="bx-landing-header" data-site-only>', $s, 'The previous default is what it looks for.');
    }
}
