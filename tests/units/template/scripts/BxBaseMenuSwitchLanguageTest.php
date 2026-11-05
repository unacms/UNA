<?php

/**
 * The language switcher popup shows each language's code as a glyph from tagsets (plugins_public/tagsets, built by
 * `build:tagsets` from the npm package NEO uses for its switcher), in the row's icon circle.
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
        if (!file_exists(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'tagsets/locales/en.svg'))
            $this->markTestSkipped('plugins_public/tagsets is not built (yarn build:tagsets).');

        $this->assertStringContainsString('tagsets-locale-en', $this->glyph('en'));
        $this->assertStringContainsString('stroke="currentColor"', $this->glyph('en'), 'The glyph takes the row\'s text colour, like a Lucide icon.');
        $this->assertStringContainsString('tagsets-locale-pt', $this->glyph('pt-BR'), 'A region subtag is dropped.');
        $this->assertStringContainsString('tagsets-locale-no', $this->glyph('nb'), 'Norwegian Bokmål is "NO".');
    }

    public function testOtherNamesGetNoGlyph(): void
    {
        $this->assertSame('', $this->glyph('xx'), 'tagsets has no glyph for it: the row keeps the flag.');
        $this->assertSame('', $this->glyph('../en'), 'Only a plain language code reaches the file system.');
        $this->assertSame('', $this->glyph(''));
    }
}
