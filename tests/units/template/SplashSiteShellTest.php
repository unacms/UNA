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

    /** What 2026112483_splash_type_and_dark_art.sql replaces: the previous declaration => the default's. */
    private const TYPE_AND_DARK_ART = [
        '--bx-landing-accent: #172554;' => '--bx-landing-accent: #1e3a8a;',
        '--bx-landing-accent-fg: #60a5fa;' => '--bx-landing-accent-fg: #93c5fd;',
        'max-width: 48rem;' => 'max-width: 36rem;',
        'line-height: 1.5rem;' => 'line-height: 1.5;',
        'line-height: 1.75rem;' => 'line-height: 1.5556;',
    ];

    /** The install default as it was before that migration. */
    private static function defaultCodeBeforeTypeAndDarkArt(): string
    {
        return str_replace(array_values(self::TYPE_AND_DARK_ART), array_keys(self::TYPE_AND_DARK_ART), self::defaultCode());
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

    /**
     * A save in Studio stored the footer's "&copy;" as the copyright sign, and the first migration missed that
     * code: the site showed its header and footer and the splash's own. The second one takes either form.
     */
    public function testSecondMigrationTakesThePreviousDefaultWithTheCopyrightSign(): void
    {
        $sFirst = self::read('migrations/2026111880_splash_in_site_shell.sql');
        $sSecond = self::read('migrations/2026111897_splash_in_site_shell_copyright.sql');

        $sWhere = "WHERE `name` = 'sys_site_splash_code' AND REPLACE(REPLACE(`value`, '\\r', ''), _utf8mb4 0xC2A9, '&copy;') = REPLACE('";
        $this->assertSame(1, substr_count($sSecond, $sWhere));
        $this->assertSame(1, substr_count($sSecond, 'UPDATE `sys_options`'));

        // The code it looks for and the code it gives are the first migration's.
        $aFirst = explode("WHERE `name` = 'sys_site_splash_code' AND REPLACE(`value`, '\\r', '') = REPLACE('", $sFirst);
        $aSecond = explode($sWhere, $sSecond);
        $this->assertCount(2, $aFirst);
        $this->assertSame($aFirst[1], $aSecond[1], 'It looks for the same previous default.');
        $this->assertStringContainsString('<span>&copy; {site_title}</span>', $aSecond[1]);
        $this->assertSame(substr($aFirst[0], strpos($aFirst[0], 'UPDATE `sys_options`')), substr($aSecond[0], strpos($aSecond[0], 'UPDATE `sys_options`')), 'It gives the same code.');

        // And that code is the install default, before 2026112382 made its tagline the site's description and
        // 2026112483 changed its dark illustration colours and the text's measure and line height.
        $sDefault = str_replace('<p class="bx-landing-text">{site_description}</p>', '<p class="bx-landing-text"><bx_text:_sys_txt_splash_slogan /></p>', self::defaultCodeBeforeTypeAndDarkArt());
        $this->assertStringContainsString("SET `value` = '" . str_replace(["\n", "'"], ['\r\n', "\\'"], $sDefault) . "'", $sSecond);
    }

    /**
     * 2026112483 gives the dark illustration the apps' accent pair, the text a 36rem measure and a unitless line height.
     * It changes only a splash that is still the previous default (its MD5 without carriage returns), one declaration
     * at a time, and what it gives is the install default.
     */
    public function testTypeAndDarkArtMigrationChangesOnlyThePreviousDefault(): void
    {
        $s = self::read('migrations/2026112483_splash_type_and_dark_art.sql');
        $sBefore = self::defaultCodeBeforeTypeAndDarkArt();

        $this->assertNotSame(self::defaultCode(), $sBefore);
        $this->assertSame(1, substr_count($s, 'UPDATE `sys_options`'));
        $this->assertStringContainsString("WHERE `name` = 'sys_site_splash_code' AND MD5(REPLACE(`value`, '\\r', '')) = '" . md5($sBefore) . "';", $s);

        foreach (self::TYPE_AND_DARK_ART as $sOld => $sNew) {
            $this->assertStringContainsString("'" . $sOld . "', '" . $sNew . "')", $s);
            $this->assertStringContainsString($sOld, $sBefore);
            $this->assertStringNotContainsString($sOld, self::defaultCode(), 'The default has the new declaration only.');
        }
        $this->assertSame(self::defaultCode(), str_replace(array_keys(self::TYPE_AND_DARK_ART), array_values(self::TYPE_AND_DARK_ART), $sBefore));
    }
}
