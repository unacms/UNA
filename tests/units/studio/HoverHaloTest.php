<?php

/**
 * Studio hover halos: the header's buttons, the dock and current-app tiles, and the sidebar (subtab) items all show the same 8px halo round
 * a 36px tile with 8px corners (16px outer corners) in the same neutrals, black/5 on hover and black/10 when active (white/5 and white/10 in
 * dark), set apart from it by a 1px line: the outer of the two hairlines that header buttons and app tiles alike carry.
 */
class HoverHaloTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    private static function rule(string $sCss, string $sSelectors): string
    {
        $i = strpos($sCss, $sSelectors . ' {');
        if ($i === false)
            self::fail('No rule for ' . $sSelectors);

        $i += strlen($sSelectors) + 2;
        return substr($sCss, $i, strpos($sCss, "\n    }", $i) - $i);
    }

    public function testHeaderButtonsHaveAHalfRemHalo(): void
    {
        $sRule = self::rule(self::read('template/css/tailwind.css'), "    .bx-std .bx-menu-toolbar .bx-menu-tab-item,\n    .bx-std .bx-std-search-trigger,\n    .bx-std .bx-std-header-btn");

        // 0.5rem (8px) in rem like the bar's padding and corners, so tile, halo and bar stay concentric at any text size
        $this->assertStringContainsString('@apply hover:ring-[0.5rem] hover:ring-black/5 dark:hover:ring-white/5;', $sRule, 'The sidebar items\' hover background.');
        $this->assertStringNotContainsString('ring-offset', $sRule, 'The plate\'s own outer hairline is the separation.');
    }

    public function testDockAndAppTilesMatchTheButtons(): void
    {
        $sRule = self::rule(self::read('template/css/tailwind.css'), "    .bx-std .bx-menu-top-center li:where(:not(.bx-menu-tab-active)) a:where(:not(:focus-visible)) .bx-mi-icon,\n    .bx-std .bx-menu-breadcrumb li.bx-menu-bc-page .bx-mi-icon.bx-icon-tile");

        // straight off the tile as on the buttons: the tile's own outer hairline is the halo's inner edge
        $this->assertStringContainsString('@apply hover:ring-[0.5rem] hover:ring-black/5 dark:hover:ring-white/5;', $sRule);
        $this->assertStringNotContainsString('ring-offset', $sRule);
    }

    public function testSelectedDockItemKeepsItsRingOnHover(): void
    {
        $s = self::read('template/css/tailwind.css');

        // the selected app's ring is not replaced by the halo while hovered: the halo rule leaves it out; it is the halo one step darker,
        // the sidebar's active item: 0.5rem of black/10 (white/10 in dark), straight off the tile like the hover halo
        $this->assertStringContainsString("    .bx-std .bx-menu-top-center .bx-menu-tab-active .bx-mi-icon {\n        @apply ring-[0.5rem] ring-black/10 dark:ring-white/10;", $s);
        $this->assertStringContainsString('@apply bg-black/10 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/10;', $s, 'The sidebar\'s active item, the same neutral.');
        $this->assertDoesNotMatchRegularExpression('/\.bx-menu-top-center (li )?\.bx-mi-icon[^{]*\{[^}]*hover:ring/', $s, 'Every dock hover halo rule excludes the selected item.');
    }

    public function testHeaderIconsLeaveRoomForTwoRings(): void
    {
        $s = self::read('studio/template/css/menu_top.css');

        // 8px ring + 2px + 8px ring between neighbours (one hovered, one active); each 2px separator sits 10px from either icon, 2px clear of both rings
        $this->assertStringContainsString('    gap: 1.125rem;', $s);
        $this->assertStringContainsString('<ul class="bx-menu-toolbar gap-x-[1.125rem]">', self::read('studio/template/menu_top_toolbar.html'));
        $this->assertMatchesRegularExpression('/li\.bx-menu-bc-div \{\s*padding: 0 0\.6875rem;/', $s, 'Breadcrumb separator: 11px either side of a 2px bar with -1px margins.');
        $this->assertMatchesRegularExpression('/margin-right: 0\.6875rem;\s*padding-right: 0\.6875rem;/', $s, 'The hairline between the dock and the tools.');
        $this->assertMatchesRegularExpression('/li\.bx-menu-item-divider \{\s*width: 2px;[^}]*margin: 0 -0\.5rem;/', $s, 'The dock group divider: 18px gaps less 8px each side.');
    }

    public function testFocusRingWinsOverTheDockHalo(): void
    {
        $s = self::read('template/css/tailwind.css');

        // a focused tile under the pointer shows the focus ring: the halo leaves focused links out, and :where keeps its specificity at
        // (0,4,1), under the focus rule's (0,4,2), in both schemes
        $this->assertStringContainsString('.bx-std .bx-menu-top-center li a:focus-visible .bx-mi-icon', $s);
        $this->assertStringContainsString('.bx-std .bx-menu-top-center li:where(:not(.bx-menu-tab-active)) a:where(:not(:focus-visible)) .bx-mi-icon,', $s);
    }

    public function testHeaderFocusRingFillsTheHalo(): void
    {
        // a 3px gap and 5px of blue: the halo's and the active ring's 0.5rem, so a focused icon keeps 2px from a hovered or active neighbour
        $sRule = self::rule(self::read('template/css/tailwind.css'), "    .bx-std .bx-menu-top-center li a:focus-visible .bx-mi-icon,\n    .bx-std .bx-menu-toolbar .bx-menu-tab-item:has(:is(a, button):focus-visible),\n    .bx-std .bx-menu-breadcrumb li a:focus-visible .bx-std-header-btn,\n    .bx-std .bx-std-search-trigger:focus-visible");

        $this->assertStringContainsString('@apply ring-[0.3125rem] ring-offset-[0.1875rem];', $sRule);
    }

    public function testLauncherTilesShowTheSameHalo(): void
    {
        // hovered, or picked by the launcher filter (Enter opens it): 0.5rem of black/5 (white/5 in dark) straight off the tile, as in the header and the sidebar
        $this->assertStringContainsString('<div class="bx-std-widget-icon bx-std-widget-icon-trans rounded-2xl hover:ring-[0.5rem] hover:ring-black/5 dark:hover:ring-white/5 hover:scale-105', self::read('studio/template/widget.html'));
        $this->assertStringContainsString('@apply ring-[0.5rem] ring-black/5 dark:ring-white/5 scale-105;', self::rule(self::read('template/css/tailwind.css'), '    .bx-std .bx-std-widget-icon.bx-std-widget-icon-pick'));
    }

    public function testLauncherAndSidebarFocusRingsMatchTheHeader(): void
    {
        $s = self::read('template/css/tailwind.css');

        // launcher tiles: the same gap and ring, the gap in the launcher page's gray-100
        $this->assertStringContainsString('@apply ring-[0.3125rem] ring-offset-[0.1875rem] ring-offset-gray-100 dark:ring-offset-black scale-105;', self::rule($s, '    .bx-std .bx-std-widget-icon:has(> .bx-std-widget-link:focus-visible)'));

        // sidebar items are 2px apart, so the ring is inside the item: 5px of the 8px padding, 3px left round the tile
        $this->assertStringContainsString("minus that, 3px, round the tile, the header's gap and ring measured from the tile, and the label inside the ring. */\n    .bx-std .bx-std-pmen-item:has(a:focus-visible) {\n        @apply ring-inset ring-[0.3125rem] ring-offset-0;", $s);
    }

    public static function templates(): array
    {
        return [
            'dock' => ['studio/template/menu_top_center.html', '<div class="bx-mi-icon rounded-lg active:opacity-80 duration-300">'],
            'current app' => ['studio/template/page_breadcrumb.html', '<div class="bx-mi-icon bx-icon-tile flex-0 flex items-center justify-center w-9 h-9 rounded-lg">'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('templates')]
    public function testTemplatesLeaveTheHaloToTheStylesheet(string $sPath, string $sTile): void
    {
        $s = self::read($sPath);

        $this->assertStringContainsString($sTile, $s);
        $this->assertStringNotContainsString('hover:ring-4', $s, 'A ring utility here would override the shared halo.');
    }

    public function testSidebarTilesAreSetApartLikeTheHeader(): void
    {
        $s = self::read('template/css/tailwind.css');

        // app art runs 1px past its tile, as far as a button's outer hairline, and a black/20 line over that outer pixel darkens the art's own
        // edge (always darker than the icon, in its hue) in both schemes; glyph tile buttons keep the buttons' hairlines; no extra ring on hover or when active
        $this->assertStringContainsString("    .bx-std .bx-std-menu-top .bx-icon-tile,\n    .bx-std .bx-std-pmen-ic-icon:not(.bx-std-tile-btn) {\n        @apply after:-inset-px after:rounded-[calc(0.5rem_+_1px)] after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)];", $s);
        foreach (['studio/template/css/menu_top.css' => 2, 'studio/template/css/general.css' => 1] as $sFile => $iRules) { // current-app tile and dock; sidebar
            $sCss = self::read($sFile);
            $this->assertSame($iRules, substr_count($sCss, "max-width: none; /* Tailwind's base caps images at their box */"), $sFile . ': the art is not capped at its tile.');
            $this->assertSame($iRules, substr_count($sCss, "    margin: -1px;\n"), $sFile . ': the art overhangs its tile by 1px.');
        }
        $this->assertStringContainsString("div.bx-std-menu-top .bx-menu-top-center li .bx-icon-tile {\n    display: flow-root;", self::read('studio/template/css/menu_top.css'), 'The dock tile keeps 36px: the art margins do not collapse through it.');
        $this->assertStringNotContainsString('.bx-std-pmen-item:hover .bx-std-pmen-ic-icon,', $s);

        // the item's 8px padding round the 36px tile is the halo, with the same 16px outer corners: a 52px item (88px square in the strip)
        $sGeneral = self::read('studio/template/css/general.css');
        $this->assertMatchesRegularExpression('/div\.bx-std-pmen-item \{[^}]*height: 3\.25rem;[^}]*border-radius: 1rem;/', $sGeneral);
        $this->assertMatchesRegularExpression('/div\.bx-std-pmen-item-cnt \{[^}]*padding: 0\.5rem;/', $sGeneral);
        $this->assertMatchesRegularExpression('/div\.bx-std-pmen-item \.bx-std-pmen-ic-icon \{[^}]*width: 2\.25rem;\s*height: 2\.25rem;/', $sGeneral);
        $this->assertStringContainsString('height: 3.25rem; /* the 36px tile with 8px around it', $sGeneral, 'The phone tabs.');
        $this->assertStringContainsString('<bx_if:show_icon_bg> bx-std-tile-btn p-1.5</bx_if:show_icon_bg>', self::read('studio/template/menu_side.html'), 'A 24px glyph in the 36px tile.');
    }
}
