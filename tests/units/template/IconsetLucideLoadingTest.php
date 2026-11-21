<?php

/**
 * The Lucide set loads no script of icons (Lucide's own is every icon as data, about 118 KB compressed, for a page that
 * shows a few dozen): the page's code carries the drawings of the icons the page names (fillPageIcons, called with the
 * page's HTML before it goes out) and loads the file of an icon that comes later. Each icon's room is kept in CSS so
 * nothing moves when it is drawn.
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

    private static function iconset(): BxBaseIconsetLucide
    {
        $oIconset = BxDolIconset::getObjectInstance('sys_lucide');
        self::assertInstanceOf(BxBaseIconsetLucide::class, $oIconset);

        return $oIconset;
    }

    public function testEmojiIconsAreNotLucideNames(): void
    {
        // <i class="sys-icon sys-icon-emoji">...</i> holds an emoji: read as a name it is "-emoji", which Lucide warns about
        $this->assertStringContainsString("querySelectorAll('i.sys-icon:not(.sys-icon-emoji)')", self::method('template/scripts/BxBaseIconsetLucide.php', 'getCode'));
    }

    public function testNoScriptOfIconsLoads(): void
    {
        $this->assertMatchesRegularExpression('/^\s*return false;\s*$/', self::method('template/scripts/BxBaseIconsetLucide.php', 'getPreloaderJs'));
        $this->assertFalse(self::iconset()->getCodeHead(), 'Nothing in <head>.');
        $this->assertFileDoesNotExist(__DIR__ . '/../../../template/iconset_lucide_head.html');
        $this->assertStringNotContainsString('lucide.min.js', self::read('template/scripts/BxBaseIconsetLucide.php'));
    }

    public function testThePageCarriesTheDrawingsOfItsIcons(): void
    {
        $oIconset = self::iconset();
        $sCode = $oIconset->getCode();
        $this->assertStringContainsString('const oSvgs = ' . BxBaseIconsetLucide::PAGE_ICONS . ';', $sCode);

        $sHtml = '<i class="sys-icon cog"></i><span class="bx-std-star sys-icon star"></span><i class="sys-icon UserRoundKey"></i>'
            . '<i class="sys-icon brand-x"></i><i class="sys-icon no-such-icon"></i>' . $sCode;
        $sPage = $oIconset->fillPageIcons($sHtml);

        $this->assertStringNotContainsString(BxBaseIconsetLucide::PAGE_ICONS, $sPage);
        $this->assertSame(1, preg_match('/const oSvgs = (\{.*?\});\n/s', $sPage, $aMatch));
        $aSvgs = json_decode($aMatch[1], true);
        $this->assertSame(['settings', 'star', 'user-round-key', 'brand-x'], array_keys($aSvgs), 'Mapped, PascalCase and brand names are found; unknown ones are left to the script.');
        $this->assertStringStartsWith('<svg class="lucide lucide-settings"', $aSvgs['settings']);
        $this->assertStringStartsWith('<svg class="sys-icon-brand"', $aSvgs['brand-x']);
        $this->assertStringNotContainsString('</script>', $aMatch[1], 'The drawings cannot close the script.');
    }

    public function testThePageCodeFillsTheIcons(): void
    {
        $this->assertStringContainsString('$sResult = $oIconset->fillPageIcons($sResult);', self::read('inc/classes/BxDolTemplate.php'));
    }

    public function testIconsThatComeLaterLoadFromTheirFiles(): void
    {
        $sCode = self::iconset()->getCode();

        $this->assertStringContainsString("lucide/icons/", $sCode);
        $this->assertStringContainsString("template/images/brands/", $sCode);
        $this->assertStringContainsString("fetch((bBrand ?", $sCode);
        $this->assertStringContainsString('bx_iconset_init_lucide();', $sCode);
        $this->assertStringContainsString('glOnProcessHtml.push(', $sCode);
    }

    public function testPlaceholdersKeepTheIconsRoom(): void
    {
        $this->assertStringContainsString("return 'icons_lucide.css';", self::method('template/scripts/BxBaseIconsetLucide.php', 'getPreloaderCss'));

        $s = self::read('template/css/icons_lucide.css');
        $this->assertMatchesRegularExpression('/^i\.sys-icon:empty:not\(\[data-lucide\]\) \{\s*display: inline-block;\s*width: 24px;\s*height: 24px;/m', $s);
        $this->assertSame(0, preg_match_all('/i\.sys-icon:empty(?!:not\(\[data-lucide\]\))/', $s), 'A name the set does not have takes no room once the script has run.');
    }
}
