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
        $this->assertMatchesRegularExpression('/border-radius: 0\.75rem;/', $sPopup, 'Popup rows have 12px corners, as NEO\'s regular menu items.');
        $this->assertMatchesRegularExpression('/min-height: 2\.75rem;[^}]*padding-inline-start: 1rem;\s*padding-inline-end: 1rem;/', $sPopup, 'A label is 16px from either side of its row.');
        $this->assertMatchesRegularExpression('/\.bx-artificer \.bx-popup-menu \.bx-popup-border \{\s*border-radius: 1\.25rem;/', $sCss, 'Menu popups have 20px corners, concentric with the rows\' 12px ones in the 8px inset.');
        $this->assertMatchesRegularExpression('/\.bx-popup \.bx-menu-highlight-list::before \{[^}]*\brounded-xl\b/', $sCss, 'The sliding highlight has the rows\' corners.');

        $sList = '\.bx-artificer \.bx-popup ul:is\(\.bx-menu-ver, \.bx-menu-custom-ver, \[class\*="bx-menu-object-"\]\):not\(\.bx-menu-hor\):not\(\.bx-menu-custom-hor\):not\(\.bx-menu-floating-blocks-wide\)';
        $this->assertMatchesRegularExpression('/' . $sList . ' \{[^}]*display: flex;\s*flex-direction: column;\s*gap: 0\.25rem;/', $sPopup, 'Rows are 4px apart, as NEO\'s (gap-1).');
        $this->assertMatchesRegularExpression('/' . $sList . ' > li \{\s*position: relative;\s*margin-top: 0;/', $sPopup, 'Artificer\'s 1px row margins give way to the gap.');
        $this->assertMatchesRegularExpression('/' . $sList . ' > li:has\(:focus-visible\) \{\s*z-index: 1;/', $sPopup, 'A focused row is above its neighbours, so the current row next to it does not cover its ring.');
        $this->assertMatchesRegularExpression('/' . $sList . ' > li a:focus-visible \{\s*outline-offset: 0;/', $sPopup, 'The ring is on the row\'s edge, as in NEO.');

        $sMenuCss = self::read('modules/boonex/artificer/data/template/system/css/menu.css');
        $this->assertDoesNotMatchRegularExpression('/more-auto \.bx-popup \.bx-menu-custom \.bx-menu-item[^{]*\{\s*border-radius: 0;/', $sMenuCss, 'No legacy rule squares the More rows again.');
    }

    public function testScrollingMenuPopupsFadeAtTheirEdges(): void
    {
        $sCss = self::read('template/css/tailwind.css');

        $this->assertMatchesRegularExpression('/@property --bx-scroll-fade-top \{[^}]*initial-value: 0px;/', $sCss, 'At rest there is no fade.');
        $this->assertMatchesRegularExpression('/@keyframes bx-scroll-fade-bottom \{\s*from \{ --bx-scroll-fade-bottom: 1\.5rem; \}\s*to \{ --bx-scroll-fade-bottom: 0px; \}/', $sCss, 'The bottom fade goes away as the list reaches its end.');
        $this->assertMatchesRegularExpression('/@supports \(animation-timeline: scroll\(\)\) \{\s*\.bx-artificer \.bx-popup-menu \.bx-popup-content \{\s*mask-image: linear-gradient\([^;]*var\(--bx-scroll-fade-top\)[^;]*var\(--bx-scroll-fade-bottom\)[^;]*;\s*animation: bx-scroll-fade-top linear both, bx-scroll-fade-bottom linear both;\s*animation-timeline: scroll\(self\), scroll\(self\);/', $sCss, 'Menu popups fade rows into their edges while scrolling, the timeline after the animation shorthand that resets it.');
    }

    public function testPopupMenuItemsLookLikeNeos(): void
    {
        $sCss = self::read('template/css/tailwind.css');

        $iStart = strpos($sCss, 'Popup menu items look and behave like NEO');
        $iEnd = strpos($sCss, '/* Account panel: its list');
        $this->assertNotFalse($iStart, 'tailwind.css has the popup menu items section.');
        $this->assertNotFalse($iEnd, 'tailwind.css has the account panel rule after it.');
        $s = substr($sCss, $iStart, $iEnd - $iStart);

        $sItem = '/\.bx-popup ul:is\(\.bx-menu-ver, \.bx-menu-custom-ver, \[class\*="bx-menu-object-"\]\):not\(\.bx-menu-hor\):not\(\.bx-menu-custom-hor\):not\(\.bx-menu-floating-blocks-wide\) > li';
        $sCurve = 'cubic-bezier\(0, 0, 0\.2, 1\)';
        $this->assertMatchesRegularExpression($sItem . ' \.bx-stl-mii:has\(> \*\) \{\s*@apply shrink-0 w-8 h-8 rounded-full [^;]*bg-gray-200\/50 dark:bg-gray-700\/50 text-gray-600 dark:text-gray-400;\s*transition: color 150ms ' . $sCurve . ', background-color 150ms ' . $sCurve . ';/', $s, 'An icon sits in a 32px circle, in the label\'s colour, and both ease with the highlight.');
        $this->assertMatchesRegularExpression($sItem . ' > a:has\(> \.bx-stl-mii > \*\) \{\s*padding-inline-start: 0\.5rem;/', $s, 'The circle is 8px from the row\'s side (6px above and below in the 44px row).');
        $this->assertMatchesRegularExpression($sItem . ' \.bx-stl-mii > img \{\s*@apply w-8 h-8 rounded-full/', $s, 'A picture fills the 32px circle.');
        $this->assertMatchesRegularExpression($sItem . ' \.bx-stl-mii > \* \{\s*@apply w-5 h-5 m-0[^;]*;\s*color: inherit;/', $s, 'The glyph is 20px and takes the circle\'s colour.');
        $this->assertMatchesRegularExpression($sItem . ' \.bx-stl-mit \{\s*@apply text-sm font-semibold text-gray-600 dark:text-gray-400;\s*transition: color 150ms ' . $sCurve . ';/', $s, 'Labels are 14px semibold, a step lighter at rest.');
        $this->assertMatchesRegularExpression($sItem . ':hover \.bx-stl-mii:has\(> \*\) \{\s*@apply bg-gray-300 dark:bg-gray-700 text-gray-950 dark:text-gray-50;/', $s, 'On hover the circle darkens and the glyph turns to the text colour.');
        $this->assertMatchesRegularExpression($sItem . ':hover \.bx-stl-mit \{\s*@apply text-gray-950 dark:text-gray-50;/', $s, 'And so does the label.');
        $this->assertMatchesRegularExpression($sItem . '\.bx-menu-tab-active \{\s*@apply bg-blue-100 dark:bg-blue-900;/', $s, 'The current item is the accent row, a step brighter in dark mode so it shows on the popup.');
        $this->assertMatchesRegularExpression($sItem . '\.bx-menu-tab-active \.bx-stl-mit \{\s*@apply text-blue-700 dark:text-blue-300;/', $s, 'Its label is the accent text.');
        $this->assertMatchesRegularExpression($sItem . '\.bx-menu-tab-active \.bx-stl-mii:has\(> \*\) \{\s*@apply bg-blue-600 text-white;/', $s, 'Its circle is solid blue with a white glyph, so it still shows on the blue row.');

        $this->assertMatchesRegularExpression('/\.bx-popup \.bx-menu-highlight-list::before \{[^}]*opacity 150ms ' . $sCurve . ';/', $sCss, 'The sliding highlight fades on the same curve as the items\' colours.');
    }
}
