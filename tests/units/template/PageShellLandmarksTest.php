<?php

/**
 * Every page shell opens <main> before the cover, so the cover and its <h1> sit inside the main landmark
 * and the skip link (#bx-content-main) lands on the page heading. The htmx partials swapped into it
 * (page_54/56/58) open no <main> of their own.
 */
class PageShellLandmarksTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    /**
     * Shell => [files it is made of, in output order; cover marker; marker of the page content; marker that must come right before </main>].
     */
    public static function shells(): array
    {
        $a = [
            'default' => [['template/_sub_header.html', 'template/default.html', 'template/_sub_footer.html'], '<bx_include_auto:_page_cover.html />', '__page_main_code__', '</div> <!-- #bx-content-with-cover-wrapper -->'],
            'application' => [['template/pt_application.html'], '__cover__', '__page_main_code__', '</div> <!-- #bx-content-wrapper -->'],
            'artificer application' => [['modules/boonex/artificer/data/template/system/pt_application.html'], '__cover__', '__page_main_code__', '</div> <!-- #bx-content-wrapper -->'],
        ];

        foreach (['ocean', 'decorous', 'protean', 'lucid'] as $sTemplate) {
            $sDir = 'modules/boonex/' . $sTemplate . '/data/template/system/';
            $a[$sTemplate] = [[$sDir . '_sub_header.html', 'template/default.html', $sDir . '_sub_footer.html'], '__cover__', '__page_main_code__', '</div> <!-- #bx-content-wrapper -->'];
            $a[$sTemplate . ' application'] = [[$sDir . 'pt_application.html'], '__cover__', '__page_main_code__', '</div> <!-- #bx-content-wrapper -->'];
        }

        return $a;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('shells')]
    public function testCoverIsInsideMain(array $aFiles, string $sCover, string $sContent, string $sBeforeClose): void
    {
        $s = implode("\n", array_map([self::class, 'read'], $aFiles));

        $this->assertSame(1, preg_match_all('/<main\b/', $s), 'One <main> per page.');
        $this->assertSame(1, substr_count($s, '</main>'));
        $this->assertSame(1, substr_count($s, 'id="bx-content-main"'), 'The skip link target is the <main> itself.');
        $this->assertMatchesRegularExpression('/<main role="main" id="bx-content-main" tabindex="-1">/', $s);

        $iOpen = strpos($s, '<main');
        $iCover = strpos($s, $sCover);
        $iContent = strpos($s, $sContent);
        $iClose = strpos($s, '</main>');
        $this->assertNotFalse($iCover);
        $this->assertNotFalse($iContent);
        $this->assertTrue($iOpen < $iCover && $iCover < $iContent && $iContent < $iClose, '<main> opens before the cover and closes after the content.');
        $this->assertMatchesRegularExpression('/' . preg_quote($sBeforeClose, '/') . '\n\s*<\/main>/', $s, '<main> closes right after the content wrapper.');

        $this->assertDoesNotMatchRegularExpression('/<footer\b/', substr($s, $iOpen, $iClose - $iOpen), 'The footer stays outside <main>.');
    }

    public static function partials(): array
    {
        return array_map(fn($s) => [$s], ['template/_page_content_beg.html', 'template/_page_content_end.html', 'template/page_54.html', 'template/page_56.html', 'template/page_58.html']);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('partials')]
    public function testHtmxPartialsOpenNoMain(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertDoesNotMatchRegularExpression('/<\/?main\b/', $s, 'The partial is swapped inside the shell\'s <main>.');
        $this->assertStringNotContainsString('id="bx-content-main"', $s);
    }

    public function testMainKeepsTheFooterAtTheBottomInThemeShells(): void
    {
        $s = self::read('template/css/general.css');

        $this->assertMatchesRegularExpression('/#bx-content-wrapper \{[^}]*flex-grow: 3;/', $s);
        $this->assertMatchesRegularExpression('/#bx-content-main:has\(> #bx-content-wrapper\) \{[^}]*flex-grow: 3;/', $s, '<main> took #bx-content-wrapper\'s place as the flex item.');
    }
}
