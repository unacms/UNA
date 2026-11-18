<?php

/**
 * A visitor who asks the system for less motion gets it on the whole page: one rule in the site's common.css (the
 * base template's and Artificer's own copy) ends transitions and animations at once, apart from the loading
 * indicators, and functions.js turns jQuery's animations off with the same setting.
 */
class ReducedMotionTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public static function stylesheets(): array
    {
        return [
            'base' => ['template/css/common.css'],
            'Artificer' => ['modules/boonex/artificer/data/template/system/css/common.css'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('stylesheets')]
    public function testOneRuleEndsMotionOnTheWholePage(string $sPath): void
    {
        $s = self::read($sPath);
        $this->assertSame(1, preg_match('/@media \(prefers-reduced-motion: reduce\) \{\s*\*:not\(\.bx-loading-ajax\)[^{]*\{([^}]*)\}\s*\}/s', $s, $aMatch), $sPath);

        foreach (['transition-duration: 0.01ms !important;', 'animation-duration: 0.01ms !important;', 'animation-iteration-count: 1 !important;', 'scroll-behavior: auto !important;'] as $sDeclaration)
            $this->assertStringContainsString($sDeclaration, $aMatch[1]);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('stylesheets')]
    public function testLoadingIndicatorsAreLeftOut(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertStringContainsString('*:not(.bx-loading-ajax):not(.bx-loading-ajax *):not(.bx-loading-ajax-btn):not(.bx-loading-ajax-btn *),', $s);
    }

    public function testJqueryAnimationsFollowTheSetting(): void
    {
        $s = self::read('inc/js/functions.js');

        $this->assertStringContainsString('function bx_reduced_motion_sync()', $s);
        $this->assertStringContainsString('jQuery.fx.off = oQuery.matches;', $s);
        $this->assertStringContainsString("oQuery.addEventListener('change', bx_reduced_motion_sync);", $s, 'It follows the setting when it changes.');
    }
}
