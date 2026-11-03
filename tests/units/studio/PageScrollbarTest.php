<?php

/**
 * Studio one-column pages (the launcher, the dashboard) scroll a box of the window's height under the fixed header. Its native bar is
 * hidden, so the header no longer covers it and the page keeps its width whether it scrolls or not, and page.js draws the blocks'
 * overlay bar for it, which starts under the header because bx_scrollbar_overlay keeps clear of the box's scroll-padding.
 */
class PageScrollbarTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    private static function rule(string $sCss, string $sSelector): string
    {
        if (!preg_match('/(?:^|\n)' . preg_quote($sSelector, '/') . ' \{([^}]*)\}/', $sCss, $a))
            self::fail('No rule for ' . $sSelector);

        return $a[1];
    }

    public function testOneColumnBoxHidesItsNativeBar(): void
    {
        $s = self::read('studio/template/css/general.css');

        $sRule = self::rule($s, 'div.bx-std-content-wrp.bx-std-one-col');
        $this->assertStringContainsString('overflow-y: auto;', $sRule);
        $this->assertStringContainsString('scrollbar-width: none;', $sRule);
        $this->assertMatchesRegularExpression('/\ndiv\.bx-std-content-wrp\.bx-std-one-col::-webkit-scrollbar \{\s*display: none;\s*\}/', $s);
    }

    public function testScrollPaddingMatchesTheHeader(): void
    {
        $sRule = self::rule(self::read('studio/template/css/general.css'), 'div.bx-std-content-wrp.bx-std-one-col');

        $this->assertSame(1, preg_match('/\bpadding-top: ([\d.]+rem);/', $sRule, $aPadding));
        $this->assertSame(1, preg_match('/\bscroll-padding-top: ([\d.]+rem);/', $sRule, $aScroll));
        $this->assertSame($aPadding[1], $aScroll[1], 'The bar and focused items start where the content does, under the header.');
    }

    public function testOverlayKeepsClearOfScrollPadding(): void
    {
        $s = self::read('inc/js/functions.js');

        $iStart = strpos($s, 'function bx_scrollbar_overlay_update(o)');
        $this->assertNotFalse($iStart);
        $sUpdate = substr($s, $iStart, strpos($s, "\n}\n", $iStart) - $iStart);

        $this->assertStringContainsString('fTop += Number.parseFloat(oCss.scrollPaddingTop) || 0;', $sUpdate, '"auto" parses as NaN and counts as none');
        $this->assertStringContainsString('fBottom -= Number.parseFloat(oCss.scrollPaddingBottom) || 0;', $sUpdate);
        $this->assertLessThan(strpos($sUpdate, 'var sPath'), strpos($sUpdate, 'scrollPaddingTop'), 'The padding is applied before the path is drawn.');
    }

    public function testPageJsDrawsTheBarForOneColumnPages(): void
    {
        $s = self::read('studio/js/page.js');

        $this->assertMatchesRegularExpression("/\\\$\('div\.bx-std-content-wrp\.bx-std-one-col'\)\.each\(function\(\) \{\s*bx_scrollbar_overlay\(this, this\.parentNode, \{/", $s);
        $this->assertStringContainsString("scrolling: 'bx-std-scrolling',", $s);
    }

    public function testBarShowsOverThePageAndAboveBlocks(): void
    {
        $s = self::read('studio/template/css/page.css');

        $this->assertStringContainsString("div.bx-std-content:hover > svg.bx-std-scrollbar,\ndiv.bx-std-content.bx-std-scrolling > svg.bx-std-scrollbar {\n    opacity: 1;", $s);
        $this->assertMatchesRegularExpression('/\ndiv\.bx-std-content > svg\.bx-std-scrollbar \{\s*z-index: 3;/', $s);

        $iBase = strpos($s, "\nsvg.bx-std-scrollbar {");
        $this->assertMatchesRegularExpression('/z-index: 2;/', substr($s, $iBase, 200), 'Blocks draw theirs under the page bar.');
    }
}
