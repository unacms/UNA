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

        $this->assertMatchesRegularExpression('/\.bx-artificer ul\.bx-menu-floating-blocks-wide \{\s*padding-left: 0\.5rem;/', self::read('template/css/tailwind.css'), 'The list is inset 8px (a class would lose to Artificer\'s menu.css).');
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

    public function testMainMenuSidebarAndStatsCardFollow(): void
    {
        $this->assertStringNotContainsString('space-y-1', self::read('modules/boonex/artificer/data/template/system/sidebar_site.html'), 'Main menu sidebar rows have no gaps.');
        $this->assertStringNotContainsString('space-y-1', self::read('modules/boonex/artificer/data/template/system/menu_sidebar_site.html'), 'Nor do its submenus.');
        $this->assertStringNotContainsString('rounded-md', self::read('modules/boonex/artificer/data/template/system/profile_stats.html'), 'The profile row has 8px corners like the menu rows.');

        $sCss = self::read('template/css/tailwind.css');
        $this->assertMatchesRegularExpression('/\.bx-artificer \.bx-sidebar-item > a,[^{]*\{[^}]*min-height: 2\.75rem;[^}]*border-radius: 0\.5rem;/', $sCss, 'Main menu sidebar rows are 44px with 8px corners.');
        $this->assertMatchesRegularExpression('/\.bx-profile-stats \.bx-profile-avatar-cnt,[^{]*\{\s*margin: -0\.5rem;/', self::read('modules/boonex/artificer/data/template/system/css/menu.css'), 'The stats card\'s rows, the profile one included, sit 8px from its edges (16px block padding less 8px).');
    }

    public function testBlockTabsAreCapsulesInLineWithContent(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/css/common.css');

        $this->assertMatchesRegularExpression('/\.bx-db-menu ul\.bx-menu-custom\.bx-menu-custom-hor > li:not\(\.bx-stl-mil-sm\) \{[^}]*padding: 0;/', $s, 'Tabs have no side padding, so the first and last line up with the block content.');
        $this->assertMatchesRegularExpression('/gap: 0\.5rem;/', $s, 'The tab list spaces its tabs with a gap.');
        $this->assertMatchesRegularExpression('/\.bx-db-menu ul\.bx-menu-hor > li > a\.bx-stl-mil-sm,[^{]*\{\s*border-radius: 9999px;/', $s, 'Block tabs are capsules like the header tabs.');
    }

    public function testPopupMenuRowsAreRoundedNotSquare(): void
    {
        $sCss = self::read('template/css/tailwind.css');

        // Only the popup section, so the side menus' rule (with the same height) can't satisfy these checks.
        $iStart = strpos($sCss, 'Menus in popups (More');
        $iEnd = strpos($sCss, '/* Side menus (profile stats');
        $this->assertNotFalse($iStart, 'tailwind.css has the popup menu rows section.');
        $this->assertNotFalse($iEnd, 'tailwind.css has the side menu rows section after it.');
        $sPopup = substr($sCss, $iStart, $iEnd - $iStart);

        $this->assertStringContainsString('.bx-artificer .bx-popup ul:is(.bx-menu-ver, .bx-menu-custom-ver, [class*="bx-menu-object-"])', $sPopup, 'One rule styles every vertical menu in a popup.');
        $this->assertStringContainsString(':not(.bx-menu-floating-blocks-wide)', $sPopup, 'The account panel pads its own rows, so links there get no second padding.');
        $this->assertMatchesRegularExpression('/min-height: 2\.75rem;/', $sPopup, 'Popup rows are 44px.');
        $this->assertMatchesRegularExpression('/border-radius: 0\.5rem;/', $sPopup, 'Popup rows have 8px corners.');
        $this->assertMatchesRegularExpression('/padding-inline-start: 0\.75rem;/', $sPopup, '12px on the icon side.');

        $sMenuCss = self::read('modules/boonex/artificer/data/template/system/css/menu.css');
        $this->assertDoesNotMatchRegularExpression('/more-auto \.bx-popup \.bx-menu-custom \.bx-menu-item[^{]*\{\s*border-radius: 0;/', $sMenuCss, 'No legacy rule squares the More rows again.');
    }
}
