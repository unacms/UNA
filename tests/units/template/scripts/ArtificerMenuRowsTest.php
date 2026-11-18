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
        $this->assertMatchesRegularExpression('/#bx-sidebar-site \.bx-sidebar-item > a,[^{]*\{\s*@apply flex items-center min-h-11 [^;]*rounded-xl/', $sCss, 'Main menu dropdown rows are 44px with 12px corners, as the More list.');
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
        $this->assertMatchesRegularExpression('/border-radius: var\(--bx-radius-xl\);/', $sPopup, 'Popup rows have 12px corners, as NEO\'s regular menu items.');
        $this->assertMatchesRegularExpression('/min-height: 2\.75rem;[^}]*padding-inline-start: 1rem;\s*padding-inline-end: 1rem;/', $sPopup, 'A label is 16px from either side of its row.');
        $this->assertMatchesRegularExpression('/\.bx-artificer \.bx-popup-menu \.bx-popup-border \{\s*border-radius: calc\(1\.25rem \* var\(--bx-radius-scale\)\);/', $sCss, 'Menu popups have 20px corners, concentric with the rows\' 12px ones in the 8px inset.');
        $this->assertMatchesRegularExpression('/\.bx-popup \.bx-menu-highlight-list::before \{[^}]*\brounded-xl\b/', $sCss, 'The sliding highlight has the rows\' corners.');

        $sList = '\.bx-artificer \.bx-popup ul:is\(\.bx-menu-ver, \.bx-menu-custom-ver, \[class\*="bx-menu-object-"\]\):not\(\.bx-menu-hor\):not\(\.bx-menu-custom-hor\):not\(\.bx-menu-floating-blocks-wide\)';
        $this->assertMatchesRegularExpression('/' . $sList . ' \{[^}]*display: flex;\s*flex-direction: column;\s*gap: 0\.25rem;/', $sPopup, 'Rows are 4px apart, as NEO\'s (gap-1).');
        $this->assertMatchesRegularExpression('/' . $sList . ' > li \{\s*position: relative;\s*margin-top: 0;/', $sPopup, 'Artificer\'s 1px row margins give way to the gap.');
        $this->assertMatchesRegularExpression('/' . $sList . '::after,\s*' . $sList . ':not\(\.bx-menu-highlight-list\)::before \{\s*display: none;/', $sPopup, 'The clearfix boxes take no gap, so the list is inset the same above and below; the highlight\'s ::before stays.');
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
        $this->assertMatchesRegularExpression('/@supports \(animation-timeline: scroll\(\)\) \{\s*\.bx-artificer \.bx-popup-menu \.bx-popup-content,\s*#bx-sidebar-site \.bx-sidebar-site-list \{\s*mask-image: linear-gradient\([^;]*var\(--bx-scroll-fade-top\)[^;]*var\(--bx-scroll-fade-bottom\)[^;]*;\s*animation: bx-scroll-fade-top linear both, bx-scroll-fade-bottom linear both;\s*animation-timeline: scroll\(self\), scroll\(self\);/', $sCss, 'Menu popups and the phone main menu fade rows into their edges while scrolling, the timeline after the animation shorthand that resets it.');
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
        $this->assertMatchesRegularExpression($sItem . ' \.bx-stl-mit \{\s*@apply text-sm font-medium text-gray-600 dark:text-gray-400;[^\n]*\s*transition: color 150ms ' . $sCurve . ';/', $s, 'Labels are 14px medium, as every menu\'s in both apps, a step lighter at rest.');
        $this->assertMatchesRegularExpression($sItem . ':hover \.bx-stl-mii:has\(> \*\) \{\s*@apply bg-gray-300 dark:bg-gray-700 text-gray-950 dark:text-gray-50;/', $s, 'On hover the circle darkens and the glyph turns to the text colour.');
        $this->assertMatchesRegularExpression($sItem . ':hover \.bx-stl-mit \{\s*@apply text-gray-950 dark:text-gray-50;/', $s, 'And so does the label.');
        $this->assertMatchesRegularExpression($sItem . '\.bx-menu-tab-active \{\s*@apply bg-blue-100 dark:bg-blue-900;/', $s, 'The current item is the accent row, a step brighter in dark mode so it shows on the popup.');
        $this->assertMatchesRegularExpression($sItem . '\.bx-menu-tab-active \.bx-stl-mit \{\s*@apply text-blue-700 dark:text-blue-300;/', $s, 'Its label is the accent text.');
        $this->assertMatchesRegularExpression($sItem . '\.bx-menu-tab-active \.bx-stl-mii:has\(> \*\) \{\s*@apply bg-blue-600 text-white;/', $s, 'Its circle is solid blue with a white glyph, so it still shows on the blue row.');

        $this->assertMatchesRegularExpression('/\.bx-popup \.bx-menu-highlight-list::before \{[^}]*opacity 150ms ' . $sCurve . ';/', $sCss, 'The sliding highlight fades on the same curve as the items\' colours.');
    }

    public function testHeaderTabsAndMoreListMatchNeo(): void
    {
        $sCss = self::read('template/css/tailwind.css');
        $sGeneral = self::read('modules/boonex/artificer/data/template/system/css/general.css');
        $sTab = self::read('neo/packages/app/components/menu-items/topmenu.tsx');
        $sTheme = self::read('neo/packages/app/settings/theme/elements.js');

        //--- Tabs: a regular button's 12px corners and the popup menus' 14px label, in both apps.
        $this->assertMatchesRegularExpression('/#bx-toolbar \.bx-menu-main > \.bx-menu-item \{\s*@apply rounded-xl;/', $sCss);
        $this->assertStringContainsString('@apply h-11 py-0 ltr:pl-3 ltr:pr-4 rtl:pr-3 rtl:pl-4 border-0 rounded-xl', $sCss);
        $this->assertMatchesRegularExpression('/#bx-toolbar \.bx-menu-main > \.bx-menu-item > \.bx-stl-mil \.bx-stl-mit \{\s*@apply text-sm leading-5;/', $sCss);
        $this->assertStringNotContainsString("#bx-toolbar .bx-menu-main.bx-menu-highlight-list::before {\n    border-radius: 9999px;", $sGeneral, 'The sliding highlight keeps the 12px corners.');
        $this->assertStringContainsString("const ROW_BASE = 'items-center justify-center gap-2 h-11 min-w-11 rounded-xl'", $sTab);
        $this->assertStringContainsString("const LABEL_SIZE = 'text-sm leading-5'", $sTab);

        //--- More: 24px icons without a circle, the current page's row in the current tab's colours, in both apps.
        $this->assertMatchesRegularExpression('/#bx-toolbar \.bx-menu-submenu-more-auto > li \.bx-stl-mii:has\(> \*\),[^{]*\{\s*@apply w-6 h-6 bg-transparent/', $sCss);
        $this->assertMatchesRegularExpression('/#bx-toolbar \.bx-menu-submenu-more-auto > li\.bx-menu-tab-active \{\s*@apply bg-blue-200\/60 dark:bg-blue-900\/60;/', $sCss);
        $this->assertStringContainsString('plainIcons', $sTab, 'NEO\'s More draws plain icons.');
        $this->assertStringContainsString("item_plain_current: 'neo-menu-current bg-accent-200/60 dark:bg-accent-900/60'", $sTheme);

        //--- The same states as the tabs: medium label, the full text colour on hover, the press on the highlight.
        // More's rows take the popup rows' medium label (asserted above): no weight of their own.
        $this->assertDoesNotMatchRegularExpression('/#bx-toolbar \.bx-menu-submenu-more-auto > li \.bx-stl-mit \{\s*@apply font-/', $sCss);
        $this->assertStringContainsString("const MENU_TEXT_BASE = 'block w-full font-medium text-secondary-foreground", $sTheme, 'NEO\'s dropdown rows are medium too.');
        $this->assertMatchesRegularExpression('/#bx-toolbar \.bx-menu-main > \.bx-menu-item:not\(\.bx-menu-tab-active\) > \.bx-stl-mil:hover \{\s*@apply text-gray-950 dark:text-gray-50;/', $sCss);
        $this->assertStringContainsString('#bx-toolbar .bx-menu-submenu-more-auto.bx-menu-highlight-list > li:has(> .bx-stl-mil:active) {', $sGeneral);
        $this->assertStringContainsString("item_plain_row: 'neo-menu-plain web:active:scale-95 web:duration-100'", $sTheme);
        $this->assertStringContainsString("off: 'text-secondary-foreground web:group-hover:text-foreground'", $sTab);
    }

    public function testPhoneMainMenuIsADropdownLikeNeos(): void
    {
        $sHtml = self::read('modules/boonex/artificer/data/template/system/sidebar_site.html');
        $sCss = self::read('template/css/tailwind.css');
        $sMotion = self::read('modules/boonex/artificer/data/template/system/css/menu-sidebar.css');

        //--- The same dialog and menu object, as a dropdown: no logo, no close button, no dimmed page.
        $this->assertStringContainsString('<bx_menu:bx_artificer_sidebar_site />', $sHtml);
        $this->assertStringContainsString('role="dialog"', $sHtml);
        $this->assertStringContainsString('bx-focus-trap', $sHtml);
        $this->assertStringNotContainsString('__main_logo__', $sHtml);
        $this->assertStringNotContainsString('bx-sidebar-site-close', $sHtml);
        $this->assertStringNotContainsString('bg-gray-600', $sHtml);

        //--- NEO's header menu: 320px, 8px under the button, the menu popups' 20px corners; More's rows.
        $this->assertMatchesRegularExpression('/#bx-sidebar-site \.bx-sidebar-cnt \{\s*@apply absolute top-\[3\.875rem\] ltr:right-4 rtl:left-4 w-80 [^;]*rounded-\[calc\(1\.25rem_\*_var\(--bx-radius-scale\)\)\]/', $sCss);
        $this->assertMatchesRegularExpression('/#bx-sidebar-site \.bx-sidebar-item > a,\s*#bx-sidebar-site \.bx-sidebar-dropdown-content > li > a \{\s*@apply flex items-center min-h-11 py-0 ps-3 pe-3 rounded-xl border-0 text-sm leading-5 font-medium/', $sCss);
        $this->assertStringContainsString('@apply bg-blue-200/60 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 ring-0;', $sCss);
        $this->assertMatchesRegularExpression('/#bx-sidebar-site \.bx-si-icon \{\s*@apply flex items-center justify-center w-6 h-6/', $sCss, '24px icons without a circle.');

        //--- It grows from the button's corner; the account sidebar still slides in.
        $this->assertStringContainsString('.bx-sidebar.bx-sidebar-site.bx-sidebar-active .bx-sidebar-cnt {' . "\n" . '    transform: scale(1);', $sMotion);
        $this->assertStringNotContainsString('.bx-dir-ltr .bx-sidebar.bx-sidebar-site .bx-sidebar-cnt,', $sMotion);
        $this->assertStringContainsString('.bx-dir-ltr .bx-sidebar.bx-sidebar-account .bx-sidebar-cnt {', $sMotion);

        $this->assertStringContainsString('plainIcons', self::read('neo/packages/app/components/nav/menu-header-navigation.tsx'), 'NEO\'s phone menu has the same rows.');
    }
}
