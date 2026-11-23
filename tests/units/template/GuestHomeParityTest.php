<?php

/**
 * The guest home page reads the same on the site and in NEO: the main menu marks Home on the splash, the main menu's row
 * is 48rem at most on both, the sign-in block's footer rule runs from edge to edge 16px under the content at any block
 * padding, and NEO's page footer is as tall as the site's with its icon switchers 16px apart. Read from the files, so a
 * value changed on one side only fails here.
 */
class GuestHomeParityTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSplashMarksHomeInTheMainMenu(): void
    {
        $s = self::read('splash.php');
        $this->assertStringContainsString("BxDolMenu::setSelectedGlobal('system', 'home');", $s);
        $this->assertLessThan(strpos($s, '$oTemplate->getPageCode();'), strpos($s, "setSelectedGlobal('system', 'home')"), 'Selected before the header is drawn.');
    }

    public function testMainMenuMaxWidthMatches(): void
    {
        foreach (['template/css/menu.css', 'modules/boonex/artificer/data/template/system/css/menu.css'] as $sFile) {
            $sCss = self::read($sFile);
            $this->assertStringContainsString("#bx-toolbar .bx-ti-menu ul.bx-menu-main {\n    width: fit-content;\n    max-width: 48rem;\n}", $sCss, $sFile);
            $this->assertStringContainsString("#bx-toolbar .bx-ti-menu ul.bx-menu-main.bx-mma-more {\n    width: 100%;\n}", $sCss, $sFile);
            $this->assertStringContainsString("#bx-toolbar .bx-header-menu-center .bx-ti-menu ul.bx-menu-main {\n    margin-inline: auto;\n}", $sCss, $sFile);
            $this->assertStringContainsString("#bx-toolbar .bx-header-menu-end .bx-ti-menu ul.bx-menu-main {\n    margin-inline-start: auto;\n}", $sCss, $sFile);
        }

        $sJs = self::read('inc/js/classes/BxDolMenuMoreAuto.js');
        $this->assertStringContainsString('var fMax = Number.parseFloat(oStyleMenu.maxWidth);', $sJs, 'The fit counts with the row\'s max-width.');
        $this->assertStringContainsString("this._oMenu.toggleClass('bx-mma-more', sLayout.includes('0'));", $sJs);

        // 16px from the logo and from the toolbar, as NEO's header gap (gap-4).
        $this->assertStringContainsString('bx-ti-menu flex-2 hidden lg:block w-64 min-w-0 ms-4 me-2', self::read('template/_page_toolbar.html'));

        $this->assertMatchesRegularExpression('/\bmenu_max_width: 768,/', self::read('neo/packages/app/settings/layout.js'), 'NEO: 48rem.');
    }

    public function testBlockFooterRuleRunsEdgeToEdge(): void
    {
        $this->assertStringContainsString("    margin: 1rem calc(-1 * var(--bx-db-padding, 1rem)) 0;\n    padding: 1rem var(--bx-db-padding, 1rem) 0;", self::read('modules/boonex/artificer/data/template/system/css/general.css'));

        $sCss = self::read('template/css/page_layouts.css');
        $this->assertMatchesRegularExpression('/\.bx-db-padding-compact > \.bx-db-container > \.bx-content-padding-block \{\s*--bx-db-padding: 0\.5rem;\s*padding: 0\.5rem;/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-db-padding-large > \.bx-db-container > \.bx-content-padding-block \{\s*--bx-db-padding: 1\.5rem;\s*padding: 1\.5rem;/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-media-desktop \.bx-db-hide-padding-desktop \.bx-db-content \{\s*--bx-db-padding: 0px;\s*padding: 0 !important;/', $sCss);
    }

    public function testNeoBlockFooterSitsAsTheSites(): void
    {
        // 16px under the content at every padding size: the margin takes back the block's gap (gap-2, gap-4, gap-6).
        $sTheme = self::read('neo/packages/app/settings/theme/elements.js');
        $this->assertStringContainsString("'u-block-footer-offset': 'mt-0',", $sTheme);
        $this->assertStringContainsString("'u-block-footer-offset-compact': 'mt-2',", $sTheme);
        $this->assertStringContainsString("'u-block-footer-offset-large': '-mt-2',", $sTheme);
        $this->assertStringContainsString("'u-block-notice': 'w-full text-center web:text-balance text-xs leading-4.5 text-muted-foreground',", $sTheme, 'The site\'s 12px on an 18px line.');
        $this->assertStringContainsString('<BlockFooter isPad={bIsShowPadding} padSize={block.padding_size} className="border-t border-button pt-4 items-center justify-center">', self::read('neo/packages/app/components/block-wrapper.js'));
    }

    public function testNeoPageFooterIsAsTallAsTheSites(): void
    {
        $s = self::read('neo/packages/app/components/nav/menu-footer.tsx');
        $this->assertStringContainsString("export const MENU_FOOTER_CLASSES = 'flex w-full items-center border-t border-border/60 justify-center lg:justify-between flex-row flex-wrap gap-x-6 gap-y-4 p-4';", $s, 'No minimum height: 1px + 16px + 28px + 16px, as #bx-footer.');
        $this->assertStringContainsString("iconClassName: cn(legacy.containerClassName ?? '', isText ? '-mx-1.5' : ''),", $s, 'Icon triggers overlap the gaps by their 6px sides.');
        $this->assertSame(3, substr_count($s, 'className: visualProps.iconClassName,'), 'Language, theme and sounds.');
        $this->assertStringContainsString("iconHitSlop: isText ? { top: 8, right: 2, bottom: 8, left: 2 } : undefined,", $s, 'Squares 4px apart: hit areas that meet, not overlap.');
        $this->assertSame(3, substr_count($s, 'hitSlop: visualProps.iconHitSlop,'));
    }

    public function testCentredMenuHasEqualSidesFrom2xl(): void
    {
        // The site: 20rem sides inside the header's px-4, only with the menu in the middle (Designer).
        $this->assertStringContainsString('bx-ti-logo flex-none items-center 2xl:[.bx-header-menu-center_&]:min-w-80', self::read('template/_page_toolbar.html'));
        $this->assertStringContainsString('2xl:[.bx-header-menu-center_&]:flex 2xl:[.bx-header-menu-center_&]:justify-end 2xl:[.bx-header-menu-center_&]:min-w-80', self::read('template/menu_toolbar_right.html'));

        // NEO: its sides carry their own 16px padding, so 21rem.
        $sLayout = self::read('neo/packages/app/settings/layout.js');
        $this->assertStringContainsString("content_left_align: { start: '', center: 'web:lg:flex-1 web:lg:min-w-max web:2xl:flex-none web:2xl:min-w-84',", $sLayout);
        $this->assertStringContainsString("center: 'web:lg:flex-1 web:lg:min-w-max web:2xl:flex-none web:2xl:min-w-84', end: '' },", $sLayout);
    }

    public function testLogoAtTheHeadersInset(): void
    {
        // NEO's desktop logo link keeps its 2px room for the focus ring but not as an offset: the logo is where the site's is.
        $this->assertStringContainsString('className="flex min-h-11 min-w-11 items-center justify-center p-0.5 -m-0.5"', self::read('neo/packages/app/ui/molecules/header/page-header-parts.js'));
    }

    public function testPageScrollbarTrackAsNeos(): void
    {
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/general.css');
        $this->assertStringContainsString("html {\n    overflow-y: scroll;\n    scrollbar-gutter: stable;\n    scrollbar-width: thin;\n    scrollbar-color: #d4d4d8 rgba(228, 228, 231, 0.5);\n}", $sCss);
        $this->assertStringContainsString("html.dark {\n    scrollbar-color: #3f3f46 rgba(63, 63, 70, 0.5);\n}", $sCss);
        $this->assertStringContainsString('scrollbar-color: rgb(var(--border)) rgb(var(--muted) / 0.5);', self::read('neo/packages/app/design/styles/global.web.css'));
    }
}
