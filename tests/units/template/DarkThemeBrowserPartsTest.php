<?php

/**
 * In the dark theme (the "dark" class on <html>) the browser's own parts are dark too: Artificer sets color-scheme
 * per theme, and its default theme-color names a dark colour that functions.js swaps in with the class.
 */
class DarkThemeBrowserPartsTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testArtificerSetsColorSchemePerTheme(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/css/common.css');

        $this->assertMatchesRegularExpression('/^:root \{\s*color-scheme: light;\s*\}/m', $s);
        $this->assertMatchesRegularExpression('/^:root\.dark \{\s*color-scheme: dark;\s*\}/m', $s);
    }

    public function testTheBaseTemplateDoesNot(): void
    {
        // Templates without dark styles must not get dark form controls on a light page.
        $this->assertDoesNotMatchRegularExpression('/:root\.dark\s*\{\s*color-scheme/', self::read('template/css/common.css'));
    }

    public function testArtificersDefaultThemeColorNamesItsDarkColour(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/_header_meta.html');

        $this->assertStringContainsString('<meta name="theme-color" content="#f5faff" data-bx-dark="#0a0a0c" />', $s);
        $this->assertStringStartsWith('__theme_color_meta__', $s, 'The colour set in Designer > PWA comes first and stays as set.');
        $this->assertStringNotContainsString('data-bx-dark', self::read('template/meta_theme_color.html'));
    }

    public function testTheScriptSwapsTheColourWithTheClass(): void
    {
        $s = self::read('inc/js/functions.js');

        $this->assertStringContainsString('function bx_sync_theme_color()', $s);
        $this->assertStringContainsString("meta[name=\"theme-color\"][data-bx-dark]", $s);
        $this->assertStringContainsString("new MutationObserver(bx_sync_theme_color).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});", $s);
    }
}
