<?php

/**
 * Artificer's Application layout: the sidebar is the page's left column from top to bottom, and the header and the content start
 * beside it. One state drives it, two classes on .bx-main (bx-app-sidebar-narrow, bx-app-sidebar-open): the stylesheet lays the
 * page out from them and js/sidebar.js only flips them. Below the breakpoint the sidebar is a modal drawer.
 */
class ApplicationSidebarTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSidebarIsAColumnWithItsOwnHead(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/pt_application.html');

        $this->assertSame(1, preg_match('/<aside id="sidebar" class="([^"]+)"/', $s, $a));
        $this->assertStringContainsString('bx-app-sidebar ', $a[1]);
        foreach (['fixed', 'hidden', 'xl:flex', 'w-64', 'pt-16'] as $sClass)
            $this->assertNotContains($sClass, explode(' ', $a[1]), 'The layout is in the stylesheet, not in utility classes the script swaps.');

        $iHead = strpos($s, '<div class="bx-app-sidebar-head">');
        $iToggle = strpos($s, 'id="toggleSidebar"');
        $iBody = strpos($s, '<div id="sidebar-content" class="bx-app-sidebar-body">');
        $this->assertTrue($iHead !== false && $iHead < $iToggle && $iToggle < $iBody, 'The sidebar starts with its own top row, which holds its button.');
        $this->assertStringContainsString('<div id="sidebarBackdrop" class="bx-app-sidebar-backdrop"></div>', $s);

        $this->assertStringNotContainsString('xl:ml-64', $s, 'The content\'s offset is the sidebar\'s width variable.');
    }

    public function testNarrowStateIsAppliedBeforeTheFirstPaint(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/pt_application.html');

        $iAside = strpos($s, '<aside id="sidebar"');
        $iScript = strpos($s, '<script>', $iAside);
        $this->assertLessThan(strpos($s, '<div class="bx-app-sidebar-head">'), $iScript, 'The script is the sidebar\'s first child.');
        $sScript = substr($s, $iScript, strpos($s, '</script>', $iScript) - $iScript);

        $this->assertStringContainsString("localStorage.getItem('sidebarExpanded') === 'false'", $sScript);
        $this->assertStringContainsString("matchMedia('(min-width: 1280px)')", $sScript, 'The drawer is never narrow.');
        $this->assertStringContainsString("classList.add('bx-app-sidebar-narrow')", $sScript);
    }

    public function testStylesLayThePageOutFromTheState(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/system/css/common.css');

        $this->assertStringContainsString("--bx-sidebar-width: 16rem;\n    --bx-sidebar-width-narrow: 4rem;", $s);
        $this->assertMatchesRegularExpression('/\.bx-main\.bx-pt-application \.bx-app-sidebar \{\n    position: fixed;\n    top: 0;\n    bottom: 0;\n    left: 0;/', $s, 'Top to bottom.');

        $iWide = strpos($s, '@media (min-width: 1280px) {');
        $iDrawer = strpos($s, '@media (max-width: 1279.98px) {');
        $this->assertNotFalse($iWide);
        $this->assertNotFalse($iDrawer);
        $sWide = substr($s, $iWide, $iDrawer - $iWide);
        $this->assertStringContainsString(".bx-main.bx-pt-application #bx-toolbar {\n        left: var(--bx-sidebar-width);", $sWide, 'The header starts beside the sidebar.');
        $this->assertStringContainsString("#main-content {\n        margin-inline-start: var(--bx-sidebar-width);", $sWide);
        $this->assertStringContainsString(".bx-app-sidebar-narrow {\n        --bx-sidebar-width: var(--bx-sidebar-width-narrow);", $sWide);
        $this->assertStringContainsString('.bx-app-sidebar-narrow .bx-app-sidebar [sidebar-toggle-item] {', $sWide, 'Labels hide by a rule, not by classes added per element.');
        $this->assertStringContainsString('scrollbar-width: none;', $sWide, 'No scrollbar pushes the narrow sidebar\'s icons off centre.');

        $sDrawer = substr($s, $iDrawer);
        $this->assertStringContainsString('visibility: hidden;', $sDrawer, 'A closed drawer takes no focus.');
        $this->assertStringContainsString('.bx-app-sidebar-open .bx-app-sidebar-backdrop {', $sDrawer);
        $this->assertStringContainsString('@media (prefers-reduced-motion: reduce) {', $s);
    }

    public function testScriptOnlyFlipsTheState(): void
    {
        $s = self::read('modules/boonex/artificer/js/sidebar.js');

        $this->assertStringContainsString("oMain.classList.toggle('bx-app-sidebar-narrow', bNarrow);", $s);
        $this->assertStringContainsString("oMain.classList.add('bx-app-sidebar-open');", $s);
        foreach (['xl:w-', 'xl:ml-', 'xl:hidden', 'pl-11', 'textContent'] as $sOld)
            $this->assertStringNotContainsString($sOld, $s, 'No layout classes or rewritten labels in the script.');
        $this->assertStringNotContainsString('mouseenter', $s, 'The narrow sidebar does not widen on hover: NEO and the apps have no hover.');

        // the drawer is a modal
        $this->assertStringContainsString('oElement.inert = bInert;', $s);
        $this->assertStringContainsString("oEvent.key == 'Escape'", $s);
        $this->assertStringContainsString('oOpener.focus()', $s, 'Focus returns to the button that opened it.');

        $this->assertStringContainsString("'modules/boonex/artificer/js/|sidebar.js'", self::read('modules/boonex/artificer/classes/BxArtificerTemplate.php'));
    }

    public function testSidebarHasTheHeadersSurfaceAndCarriesTheLogoWhenExpanded(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $this->assertSame(1, preg_match('/<header id="bx-toolbar" class="([^"]+)">/', $sApp, $aHeader));
        $this->assertSame(1, preg_match('/<aside id="sidebar" class="([^"]+)"/', $sApp, $aSidebar));
        $aSurface = array_filter(explode(' ', $aHeader[1]), fn($s) => preg_match('/^(dark:)?bg-|^backdrop-/', $s));
        $this->assertNotEmpty($aSurface);
        foreach ($aSurface as $sClass)
            $this->assertContains($sClass, explode(' ', $aSidebar[1]), 'The sidebar is the colour of the header.');

        $this->assertSame(1, substr_count($sApp, '__main_logo__'), 'One logo on the page: no element ids twice.');

        // drawn over the expanded sidebar's head; back in the header when the sidebar is narrow or a drawer
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $iWide = strpos($sCss, '@media (min-width: 1280px) {');
        $sWide = substr($sCss, $iWide, strpos($sCss, '@media (max-width: 1279.98px) {') - $iWide);
        $this->assertStringContainsString(".bx-main.bx-pt-application:not(.bx-app-sidebar-narrow) #bx-logo-container {\n        position: fixed;", $sWide);
        $this->assertStringContainsString('left: calc(1rem - var(--bx-sidebar-width));', $sWide, 'First in the row, on the sidebar\'s 16px line.');
        $this->assertStringContainsString('top: calc((var(--bx-sidebar-head) - 2.75rem) / 2);', $sWide);
        $this->assertStringContainsString('--bx-sidebar-head: 4rem;', $sCss, 'The variable the row and the logo read is the one that is set.');
        $this->assertStringNotContainsString('--bx-app-sidebar-head', $sCss);
        $this->assertStringContainsString(".bx-main.bx-pt-application #bx-toolbar {\n        contain: layout;", $sWide, 'The header is the block the logo is placed in.');
        $this->assertStringContainsString(".bx-main.bx-pt-application .bx-app-sidebar {\n        z-index: 4999;", $sWide, 'Under the header, whose logo is drawn over it.');
    }

    public function testNarrowRowsAreTheirIconAlone(): void
    {
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');

        $this->assertMatchesRegularExpression('/\.bx-app-sidebar-narrow \.bx-app-sidebar \.bx-menu-panel li a \{\n        justify-content: center;\n        padding-left: 0;\n        padding-right: 0;\n    \}/', $sCss, 'The label\'s paddings would clip or squeeze a 32px icon in 32px.');
        $this->assertMatchesRegularExpression('/\.bx-app-sidebar-narrow \.bx-app-sidebar \.bx-menu-panel \.bx-stl-mii \{\n        flex: none;/', $sCss);
    }

    public function testTriggersUseThePanelIcons(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');

        // in the sidebar: what a press does, panel-left-close while it is open and panel-left-open while it is narrow
        $iToggle = strpos($sApp, 'id="toggleSidebar"');
        $sToggle = substr($sApp, $iToggle, strpos($sApp, '</button>', $iToggle) - $iToggle);
        $this->assertMatchesRegularExpression('/<span class="bx-app-sidebar-icon-close [^"]*">\s*<bx_image_auto:panel-left-close \/>/', $sToggle);
        $this->assertMatchesRegularExpression('/<span class="bx-app-sidebar-icon-open [^"]*">\s*<bx_image_auto:panel-left-open \/>/', $sToggle);

        // in the header: opens the drawer
        $iOpen = strpos($sApp, 'id="toggleSidebarMobile"');
        $this->assertStringContainsString('<bx_image_auto:panel-left-open />', substr($sApp, $iOpen, strpos($sApp, '</button>', $iOpen) - $iOpen));
        $this->assertStringNotContainsString('<bx_image_auto:bars />', $sApp);

        foreach (['panel-left-close', 'panel-left-open'] as $sIcon)
            $this->assertFileExists(__DIR__ . '/../../../plugins_public/lucide/icons/' . $sIcon . '.svg');

        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $this->assertMatchesRegularExpression('/\n\.bx-main\.bx-pt-application \.bx-app-sidebar-icon-open \{\n    display: none;\n\}/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-app-sidebar-narrow \.bx-app-sidebar-icon-close \{\n        display: none;\n    \}/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-app-sidebar-narrow \.bx-app-sidebar-icon-open \{\n        display: flex;\n    \}/', $sCss);
        $this->assertStringContainsString('justify-content: flex-end; /* the button ends the row', $sCss);
    }
}
