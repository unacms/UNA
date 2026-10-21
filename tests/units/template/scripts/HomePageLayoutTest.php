<?php

/**
 * Home page fixes: phones show the feed before the side column and the app grid as a two-row strip, grid tiles
 * fill the row like menu rows, text is smoothed once at the root, and the composer's 'more' trigger has a name.
 */
class HomePageLayoutTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testPhonesShowTheContentBeforeTheSideColumn(): void
    {
        $s = self::read('template/layout_topbottom_area_col2_col5_col3.html');

        $this->assertMatchesRegularExpression('/bx-layout-bcb-bar1 [^"]*\border-2 md:order-1\b/', $s, 'The side column goes last on phones and back to the left from md up.');
        $this->assertMatchesRegularExpression('/<div class="max-w-full md:w-8\/10 [^"]*\border-1"/', $s);
    }

    public function testAppGridTilesFillTheRowAndMatchTheMenuRows(): void
    {
        $sTmpl = self::read('modules/boonex/artificer/data/template/system/menu_floating_blocks.html');
        $this->assertDoesNotMatchRegularExpression('/\bw-(20|24)\b/', $sTmpl, 'No fixed tile width: the grid sizes the tiles.');
        $this->assertStringContainsString('__class_add__ rounded-lg">', $sTmpl, '8px corners, as the menu rows have.');
        $this->assertMatchesRegularExpression('/class="bx-stl-mil-hover [^"]*\bh-full\b[^"]*\brounded-lg"/', $sTmpl, 'The link fills its tile, so the hover shape is the whole tile.');

        $s = self::read('modules/boonex/artificer/data/template/system/css/menu.css');
        $this->assertMatchesRegularExpression('/\nul\.bx-menu-floating-blocks \{\s*display: grid;\s*grid-template-columns: repeat\(auto-fill, minmax\(6\.5rem, 1fr\)\);\s*margin: -0\.5rem;\s*\}/', $s, 'Tiles stretch to fill the row, at least 6.5rem (wider than a tile is tall), 8px from the card edge.');
        $this->assertMatchesRegularExpression('/@media \(max-width: 767\.98px\) \{\s*ul\.bx-menu-floating-blocks \{[^}]*grid-auto-flow: column;[^}]*grid-template-rows: repeat\(2, auto\);[^}]*overflow-x: auto;/', $s, 'Phones: a two-row strip that scrolls sideways.');
    }

    public function testTextIsSmoothedOnceAtTheRoot(): void
    {
        $this->assertMatchesRegularExpression('/\nhtml \{\s*-webkit-font-smoothing: antialiased;\s*-moz-osx-font-smoothing: grayscale;\s*\}/', self::read('modules/boonex/artificer/data/template/system/css/common.css'));
    }

    public function testComposerMoreTriggerHasAName(): void
    {
        $this->assertMatchesRegularExpression("/'name' => 'more-auto',\s*'title_system' => '_sys_menu_item_title_system_va_more_auto',/", self::read('template/scripts/BxBaseMenuCreatePost.php'), 'BxBaseMenu::_getMenuTitle falls back to title_system for the icon-only trigger.');
    }
}
