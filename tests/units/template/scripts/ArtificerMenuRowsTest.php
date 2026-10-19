<?php

/**
 * Menu rows in Artificer's popups, account panel and side menus share the header More list's look: 44px rows,
 * 8px corners, 16px labels, no gaps. Read from the template and CSS files, so a row style that drifts back fails here.
 */
class ArtificerMenuRowsTest extends \PHPUnit\Framework\TestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testAccountPanelRowsAre44pxWith16pxLabels(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/menu_floating_blocks_wide.html');

        $this->assertMatchesRegularExpression('/<ul class="bx-menu-floating-blocks-wide[^"]*\bpx-2\b/', $s, 'The list is inset 8px.');
        $this->assertMatchesRegularExpression('/<li class="[^"]*\bmin-h-11\b[^"]*\brounded-lg\b[^"]*\btext-base\b/', $s, 'Rows are 44px with 8px corners and 16px labels.');
        $this->assertStringNotContainsString('text-sm', $s, 'No small labels left.');
        $this->assertStringNotContainsString('py-2', $s, 'The row sets the height, not the link\'s padding.');
    }

    public function testSideMenuRowsHaveNoGaps(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/menu_vertical_more_less.html');

        $this->assertStringNotContainsString('space-y-2', $s, 'Rows sit right under each other, as in the More list.');
        $this->assertStringContainsString('rounded-lg', $s);
    }

    public function testPopupMenuRowsAreRoundedNotSquare(): void
    {
        $sCss = self::read('template/css/tailwind.css');
        $this->assertStringContainsString('.bx-artificer .bx-popup ul:is(.bx-menu-ver, .bx-menu-custom-ver, [class*="bx-menu-object-"])', $sCss, 'One rule styles every vertical menu in a popup.');
        $this->assertMatchesRegularExpression('/min-height: 2\.75rem;/', $sCss, 'Rows are 44px.');

        $sMenuCss = self::read('modules/boonex/artificer/data/template/system/css/menu.css');
        $this->assertDoesNotMatchRegularExpression('/more-auto \.bx-popup \.bx-menu-custom \.bx-menu-item[^{]*\{\s*border-radius: 0;/', $sMenuCss, 'No legacy rule squares the More rows again.');
    }
}
