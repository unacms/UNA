<?php

/**
 * Lucide's script (every icon as data) is not one of the scripts each page waits for in <head>: the set gives the
 * preloader no script, prints an async tag in <head> that draws the icons when it loads, and reserves each icon's room
 * in CSS so nothing moves when they arrive.
 */
class IconsetLucideLoadingTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    private static function method(string $sClassFile, string $sMethod): string
    {
        $s = self::read($sClassFile);
        if (!preg_match('/function ' . $sMethod . '\s*\(\)\s*\{(.*?)\n    \}/s', $s, $aMatch))
            self::fail($sMethod . ' is not in ' . $sClassFile);

        return $aMatch[1];
    }

    public function testEmojiIconsAreNotLucideNames(): void
    {
        // <i class="sys-icon sys-icon-emoji">...</i> holds an emoji: read as a name it is "-emoji", which Lucide warns about
        $this->assertStringContainsString("querySelectorAll('i.sys-icon:not(.sys-icon-emoji)')", self::method('template/scripts/BxBaseIconsetLucide.php', 'getCode'));
    }

    public function testTheSetGivesThePreloaderNoScript(): void
    {
        $this->assertMatchesRegularExpression('/^\s*return false;\s*$/', self::method('template/scripts/BxBaseIconsetLucide.php', 'getPreloaderJs'));
    }

    public function testTheScriptTagIsAsyncAndDrawsTheIconsOnLoad(): void
    {
        $s = self::read('template/iconset_lucide_head.html');

        $this->assertSame(1, preg_match_all('/<script\b[^>]*>/', $s, $aMatches));
        $this->assertMatchesRegularExpression('/\ssrc="__url__"/', $aMatches[0][0]);
        $this->assertMatchesRegularExpression('/\sasync[\s>]/', $aMatches[0][0]);
        $this->assertStringContainsString('onload="window.bx_iconset_init_lucide && bx_iconset_init_lucide()"', $aMatches[0][0]);

        $this->assertStringContainsString("parseHtmlByName('iconset_lucide_head.html'", self::method('template/scripts/BxBaseIconsetLucide.php', 'getCodeHead'));
        $this->assertStringContainsString('lucide/lucide.min.js', self::method('template/scripts/BxBaseIconsetLucide.php', 'getCodeHead'));
    }

    public function testTheHeadPrintsTheSetsCodeAndOtherSetsHaveNone(): void
    {
        $this->assertStringContainsString('->getCodeHead()', self::method('template/scripts/BxBaseFunctions.php', 'getInjHeadIcons'));
        $this->assertMatchesRegularExpression('/^\s*return false;\s*$/', self::method('template/scripts/BxBaseIconset.php', 'getCodeHead'));
    }

    public function testTheCodeAtThePagesEndStillDrawsAndWaitsForTheScript(): void
    {
        $s = self::read('template/scripts/BxBaseIconsetLucide.php');

        $this->assertStringContainsString('if(!window.lucide || !lucide.icons)', $s, 'Without the script yet, the call returns and the tag\'s onload draws.');
        $this->assertStringContainsString('bx_iconset_init_lucide();', $s);
    }

    public function testPlaceholdersKeepTheIconsRoom(): void
    {
        $this->assertStringContainsString("return 'icons_lucide.css';", self::method('template/scripts/BxBaseIconsetLucide.php', 'getPreloaderCss'));

        $s = self::read('template/css/icons_lucide.css');
        $this->assertMatchesRegularExpression('/^i\.sys-icon:empty:not\(\[data-lucide\]\) \{\s*display: inline-block;\s*width: 24px;\s*height: 24px;/m', $s);
        $this->assertSame(0, preg_match_all('/i\.sys-icon:empty(?!:not\(\[data-lucide\]\))/', $s), 'A name the set does not have takes no room once the script has run.');
    }
}
