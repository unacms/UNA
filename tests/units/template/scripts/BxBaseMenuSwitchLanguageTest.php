<?php

/**
 * The language switcher popup shows each language's code as a glyph from xymbols (plugins_public/xymbols, built by
 * `build:xymbols` from the npm package NEO uses for its switcher), in the row's icon circle.
 */
class BxBaseMenuSwitchLanguageTest extends BxDolTestCase
{
    private function glyph(string $sName): string
    {
        $oMenu = (new ReflectionClass('BxTemplMenuSwitchLanguage'))->newInstanceWithoutConstructor();
        $oMethod = new ReflectionMethod($oMenu, 'getLanguageGlyph');
        return $oMethod->invoke($oMenu, $sName);
    }

    public function testLanguagesWithAGlyphGetItsSvg(): void
    {
        if (!file_exists(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'xymbols/locales/en.svg'))
            $this->markTestSkipped('plugins_public/xymbols is not built (yarn build:xymbols).');

        $this->assertStringContainsString('xymbol-locale-en', $this->glyph('en'));
        $this->assertStringContainsString('stroke="currentColor"', $this->glyph('en'), 'The glyph takes the row\'s text colour, like a Lucide icon.');
        $this->assertStringContainsString('xymbol-locale-pt', $this->glyph('pt-BR'), 'A region subtag is dropped.');
        $this->assertStringContainsString('xymbol-locale-no', $this->glyph('nb'), 'Norwegian Bokmål is "NO".');
    }

    public function testOtherNamesGetNoGlyph(): void
    {
        $this->assertSame('', $this->glyph('xx'), 'xymbols has no glyph for it: the row keeps the flag.');
        $this->assertSame('', $this->glyph('../en'), 'Only a plain language code reaches the file system.');
        $this->assertSame('', $this->glyph(''));
    }
}
