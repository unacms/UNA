<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * SVG uploads are cleaned by enshrined/svg-sanitize with its default settings
 * (BxDolStorage::storeFile). A sanitize() result of false rejects the upload.
 * The cases below come from the advisories fixed in svg-sanitize 1.x.
 */
class BxDolStorageSvgSanitizeTest extends \PHPUnit\Framework\TestCase
{
    protected function sanitize($sSvg)
    {
        $oSanitizer = new enshrined\svgSanitize\Sanitizer();
        return $oSanitizer->sanitize($sSvg);
    }

    public function testKeepsPlainIcon()
    {
        $sSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';

        $mixedOut = $this->sanitize($sSvg);
        $this->assertIsString($mixedOut);
        $this->assertSame(2, substr_count($mixedOut, '<path'));
        $this->assertStringContainsString('viewBox="0 0 24 24"', $mixedOut);
        $this->assertStringContainsString('stroke="currentColor"', $mixedOut);
    }

    public function testRemovesScriptsHandlersAndJavascriptLinks()
    {
        $mixedOut = $this->sanitize('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)"><rect width="1" height="1"/></a></svg>');

        $this->assertIsString($mixedOut);
        $this->assertStringNotContainsStringIgnoringCase('<script', $mixedOut);
        $this->assertStringNotContainsStringIgnoringCase('onload', $mixedOut);
        $this->assertStringNotContainsStringIgnoringCase('javascript:', $mixedOut);
    }

    #[DataProvider('providerForDtd')]
    public function testDtdCannotSmuggleJavascript($sSvg)
    {
        $mixedOut = $this->sanitize($sSvg);

        $this->assertTrue($mixedOut === false || stripos($mixedOut, 'javascript:') === false, 'Sanitized SVG still holds a javascript: URL: ' . $mixedOut);
    }

    static public function providerForDtd()
    {
        return [
            // GHSA-9rjx-3jch-6vjf: &Tab; is "#" in the DTD, but a TAB once the SVG is inlined in HTML
            'html named reference' => ['<!DOCTYPE svg [<!ENTITY Tab "#">]><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><a href="&Tab;javascript:alert(document.domain)"><rect width="400" height="120"/></a></svg>'],
            // GHSA-v383-3rw5-q8rf: a #FIXED default for a dropped attribute crashed the PHP worker
            'fixed attribute default' => ['<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg [<!ATTLIST svg badhref CDATA #FIXED "javascript:alert(1)">]><svg xmlns="http://www.w3.org/2000/svg" badhref="javascript:alert(1)" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>'],
        ];
    }

    /**
     * GHSA-m9xh-6747-9r6f: a <use> nesting bomb written as xlink:HrEf was kept whole.
     */
    public function testUseBombIsCutWhateverTheHrefCase()
    {
        $mixedCanonical = $this->sanitize($this->getUseBomb('xlink:href'));
        $mixedMixedCase = $this->sanitize($this->getUseBomb('xlink:HrEf'));

        $this->assertIsString($mixedCanonical);
        $this->assertIsString($mixedMixedCase);
        $this->assertLessThan(61, substr_count($mixedCanonical, '<use'));
        $this->assertSame(substr_count($mixedCanonical, '<use'), substr_count($mixedMixedCase, '<use'));
    }

    /**
     * Six levels of ten <use> each: about a million rendered copies of one rect.
     */
    protected function getUseBomb($sHrefAttr)
    {
        $s = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><rect id="l0" width="1" height="1"/>';
        for ($i = 1; $i <= 6; $i++)
            $s .= '<g id="l' . $i . '">' . str_repeat('<use ' . $sHrefAttr . '="#l' . ($i - 1) . '"/>', 10) . '</g>';

        return $s . '</defs><use ' . $sHrefAttr . '="#l6"/></svg>';
    }
}
