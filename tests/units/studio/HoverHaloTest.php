<?php

/**
 * Studio hover halos: the header's buttons, the dock and current-app tiles, and the sidebar (subtab) items all show the same 8px halo round
 * a 32px tile with 8px corners (16px outer corners), set apart from it by a 1px line: the plate's outer hairline on header buttons, a ring
 * offset on the dock tiles in the light scheme (their art has no outer hairline there), the tile's own hairlines in the sidebar.
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

    public function testHeaderButtonsHaveAnEightPixelHalo(): void
    {
        $sRule = self::rule(self::read('template/css/tailwind.css'), "    .bx-std .bx-menu-toolbar .bx-menu-tab-item,\n    .bx-std .bx-std-search-trigger,\n    .bx-std .bx-std-header-btn");

        $this->assertStringContainsString('@apply hover:ring-8 hover:ring-black/10 dark:hover:ring-white/10;', $sRule);
        $this->assertStringNotContainsString('ring-offset', $sRule, 'The plate\'s own outer hairline is the separation.');
    }

    public function testDockAndAppTilesMatchTheButtons(): void
    {
        $sRule = self::rule(self::read('template/css/tailwind.css'), "    .bx-std .bx-menu-top-center li:where(:not(.bx-menu-tab-active)) a:where(:not(:focus-visible)) .bx-mi-icon,\n    .bx-std .bx-menu-breadcrumb li.bx-menu-bc-page .bx-mi-icon.bx-icon-tile");

        // light: 1px offset line plus 7px of ring = 8px; dark: the tile's black/20 hairline is the line, the ring is the full 8px
        $this->assertStringContainsString('@apply hover:ring-[7px] hover:ring-offset-1 hover:ring-black/10 hover:ring-offset-black/10;', $sRule);
        $this->assertStringContainsString('@apply dark:hover:ring-8 dark:hover:ring-offset-0 dark:hover:ring-white/10;', $sRule);
    }

    public function testSelectedDockItemKeepsItsRingOnHover(): void
    {
        $s = self::read('template/css/tailwind.css');

        // the selected app's blue ring is not replaced by the halo while hovered: the halo rule leaves it out
        $this->assertStringContainsString("    .bx-std .bx-menu-top-center .bx-menu-tab-active .bx-mi-icon {\n        @apply ring ring-blue-300/50 ring-offset-1", $s);
        $this->assertDoesNotMatchRegularExpression('/\.bx-menu-top-center (li )?\.bx-mi-icon[^{]*\{[^}]*hover:ring/', $s, 'Every dock hover halo rule excludes the selected item.');
    }

    public function testFocusRingWinsOverTheDockHalo(): void
    {
        $s = self::read('template/css/tailwind.css');

        // a focused tile under the pointer shows the focus ring: the halo leaves focused links out, and :where keeps its specificity at
        // (0,4,1), under the focus rule's (0,4,2), in both schemes
        $this->assertStringContainsString('.bx-std .bx-menu-top-center li a:focus-visible .bx-mi-icon', $s);
        $this->assertStringContainsString('.bx-std .bx-menu-top-center li:where(:not(.bx-menu-tab-active)) a:where(:not(:focus-visible)) .bx-mi-icon,', $s);
    }

    public static function templates(): array
    {
        return [
            'dock' => ['studio/template/menu_top_center.html', '<div class="bx-mi-icon rounded-lg active:opacity-80 duration-300">'],
            'current app' => ['studio/template/page_breadcrumb.html', '<div class="bx-mi-icon bx-icon-tile flex-0 flex items-center justify-center w-8 h-8 rounded-lg">'],
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

        $this->assertStringContainsString("    .bx-std-pmen-item:hover .bx-std-pmen-ic-icon,\n    .bx-std-pmen-item.bx-menu-tab-active .bx-std-pmen-ic-icon {\n        @apply ring-1 ring-black/10 dark:ring-transparent;", $s, 'In the dark scheme the tile\'s own black/20 hairline is the line; a white one would wash it out.');

        // the item's 8px padding round the 32px tile is the halo, with the same 16px outer corners
        $sGeneral = self::read('studio/template/css/general.css');
        $this->assertMatchesRegularExpression('/div\.bx-std-pmen-item \{[^}]*border-radius: 1rem;/', $sGeneral);
        $this->assertMatchesRegularExpression('/div\.bx-std-pmen-item-cnt \{[^}]*padding: 0\.5rem;/', $sGeneral);
    }
}
