<?php

/**
 * While a popup with a fog is open, the page behind it is inert (inc/js/jquery.dolPopup.js, _dolPopupInert), and it is
 * given back when the last such popup closes. Checked on the source: what is made inert, what is left alone, and
 * where it is called.
 */
class PopupInertPageTest extends BxDolTestCase
{
    private static function source(): string
    {
        $s = file_get_contents(__DIR__ . '/../../../inc/js/jquery.dolPopup.js');
        if ($s === false)
            self::fail('jquery.dolPopup.js is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    private static function inertFunction(): string
    {
        if (!preg_match('/function _dolPopupInert \(\$el\) \{(.*?)\n    \};/s', self::source(), $aMatch))
            self::fail('_dolPopupInert is not in jquery.dolPopup.js');

        return $aMatch[1];
    }

    public function testPopupsFogToastsAndLiveRegionsAreLeftAlone(): void
    {
        $s = self::inertFunction();

        foreach (['#bx-popup-fog', '.bx-popup-wrapper', '[id^="bx-popup"]', '[id^="bx-sliding-menu"]', '[aria-live]', '[role="status"]', '[role="alert"]'] as $sSelector)
            $this->assertStringContainsString($sSelector, $s);
    }

    public function testHiddenPartsAndWhatHoldsAnOpenPopupAreLeftAlone(): void
    {
        $s = self::inertFunction();

        $this->assertStringContainsString("e.css('display') == 'none'", $s, 'A date picker or a suggestions list that is hidden now must work when a field in the popup shows it.');
        $this->assertStringContainsString('$.contains(this, $el.get(0))', $s);
        $this->assertStringContainsString("e.find('.bx-popup-active').length", $s);
    }

    public function testThePageIsGivenBackOnlyWhenNoModalPopupIsLeft(): void
    {
        $s = self::inertFunction();

        // a shown one: the site search popup is in the page's markup with aria-modal while hidden, and counting it
        // left the page inert after every modal popup closed
        $this->assertMatchesRegularExpression('/if \(\$\(\'\.bx-popup-wrapper\[aria-modal="true"\]\'\)\.filter\(\':visible\'\)\.length\)\s*return;/', $s);
        $this->assertStringContainsString("this.inert = false;", $s);
        $this->assertStringContainsString("this.removeAttribute('data-bx-popup-inert');", $s, 'Only what the popup made inert is given back.');
    }

    public function testItIsCalledWhereAFogPopupOpensAndWhereAPopupCloses(): void
    {
        $s = self::source();

        $this->assertMatchesRegularExpression('/\$el\.attr\(\'aria-modal\', o\.fog \? \'true\' : null\);\s*if \(o\.fog\)\s*_dolPopupInert\(\$el\);/', $s);
        $this->assertMatchesRegularExpression('/_dolPopupLockScreen\(false\);\s*_dolPopupInert\(null\);/', $s);
    }
}
