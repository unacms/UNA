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

        $this->assertStringContainsString("--bx-sidebar-width: var(--bx-sidebar-width-expanded, 16rem); /* the width the member dragged it to (js/sidebar.js), or 16rem */\n    --bx-sidebar-width-narrow: 4rem;", $s);
        $this->assertMatchesRegularExpression('/\.bx-main\.bx-pt-application \.bx-app-sidebar \{\n    position: fixed;\n    top: 0;\n    bottom: 0;\n    left: 0;/', $s, 'Top to bottom.');

        $iWide = strpos($s, '@media (min-width: 1280px) {');
        $iDrawer = strpos($s, '@media (max-width: 1279.98px) {');
        $this->assertNotFalse($iWide);
        $this->assertNotFalse($iDrawer);
        $sWide = substr($s, $iWide, $iDrawer - $iWide);
        $this->assertStringContainsString(".bx-main.bx-pt-application .bx-app-sidebar {\n        top: var(--bx-app-header);\n        bottom: var(--bx-app-footer);\n        z-index: 4999;", $sWide, 'Wide, the sidebar is between the header and footer strips; the drawer covers them.');
        $this->assertStringNotContainsString('#bx-toolbar {', $sWide, 'The header spans the page.');
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

    public function testSidebarHasTheHeadersSurfaceAndCarriesTheLogo(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $this->assertSame(1, preg_match('/<aside id="sidebar" class="([^"]+)"/', $sApp, $aSidebar));
        $this->assertSame('bx-app-sidebar bx-main-column narrow', $aSidebar[1], 'No surface of its own on wide screens, as the header strip.');
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $this->assertStringContainsString("background-color: rgb(244 244 245); /* the drawer is over the page", substr($sCss, strpos($sCss, '@media (max-width: 1279.98px) {')), 'The drawer has the page\'s colour.');

        // The logo is the sidebar's, with its ids, first in the sidebar's top row; below the breakpoint the standard header has
        // a copy without them (hidden on wide screens).
        $this->assertSame(1, substr_count($sApp, '__main_logo__'));
        $this->assertStringContainsString('<div class="bx-toolbar-item bx-ti-left bx-ti-logo bx-app-header-logo flex-none items-center">__sys_main_logo_copy__</div>', $sApp);
        $iHead = strpos($sApp, '<div class="bx-app-sidebar-head">');
        $iLogo = strpos($sApp, '<div id="bx-logo-container" class="bx-app-sidebar-logo bx-ti-logo">');
        $this->assertTrue($iHead !== false && $iLogo !== false && $iHead < $iLogo && $iLogo < strpos($sApp, 'id="toggleSidebar"'), 'The logo comes before the button.');
        $this->assertLessThan(strpos($sApp, '<aside id="sidebar"'), strpos($sApp, '</header>'));

        // Narrow: the mark on top (Designer's mark, else the logo's first 36px), the button under it; the drawer shows the logo as it is.
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $iWide = strpos($sCss, '@media (min-width: 1280px) {');
        $iDrawer = strpos($sCss, '@media (max-width: 1279.98px) {');
        $sWide = substr($sCss, $iWide, $iDrawer - $iWide);
        $this->assertStringNotContainsString(".bx-app-sidebar-narrow .bx-app-sidebar-logo {\n        display: none;", $sWide);
        $this->assertStringContainsString(".bx-main.bx-pt-application.bx-app-sidebar-narrow .bx-app-sidebar-logo:not(:has(#bx-mark)) img {\n        width: 2.25rem !important;\n        object-fit: cover;\n        object-position: left center;", $sWide);
        $this->assertStringContainsString(".bx-main.bx-pt-application.bx-app-sidebar-narrow .bx-app-sidebar-logo #bx-mark {\n        display: block !important;", $sWide);
        $sDrawer = substr($sCss, $iDrawer);
        $this->assertStringContainsString(".bx-main.bx-pt-application .bx-app-sidebar-logo:not(:has(#bx-mark)) img {\n        width: 2.25rem !important;", $sDrawer, 'The drawer\'s row also holds three 44px buttons: the logo\'s mark, as in the narrow sidebar.');
        $this->assertStringNotContainsString(".bx-app-sidebar-logo {\n        display: none;", $sDrawer, 'The drawer never hides the logo.');
        $this->assertStringNotContainsString('#bx-logo-container', $sCss, 'The logo is never hidden for being in the header.');
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
        $this->assertStringContainsString('justify-content: space-between; /* the sidebar\'s logo starts the row, its button ends it */', $sCss);
    }

    public function testNarrowRowsKeepARoomyHoverPlate(): void
    {
        // 64px less 8px a side: a 48px row round its 32px icon; 16px a side left a 32px sliver under the pointer
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $this->assertMatchesRegularExpression('/\.bx-app-sidebar-narrow \.bx-app-sidebar \.bx-mc-cnt \{\n        padding: 0 0\.5rem;/', $sCss);
    }

    public function testToolsRowAndAccountFoot(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $iTools = strpos($sApp, '<div class="bx-app-sidebar-tools">');
        $iBody = strpos($sApp, '<div id="sidebar-content" class="bx-app-sidebar-body">');
        $iFoot = strpos($sApp, '<div class="bx-app-sidebar-foot">');
        $this->assertTrue($iTools !== false && $iTools < $iBody && $iBody < $iFoot, 'The context switcher, then the menus, then the account at the foot.');
        $this->assertMatchesRegularExpression('/<div class="bx-app-sidebar-tools">\s*__sys_app_context_switcher__\s*<\/div>/', $sApp);
        $this->assertTrue(strpos($sApp, '<bx_menu:sys_toolbar_application />') > strpos($sApp, '__main_logo__') && strpos($sApp, '<bx_menu:sys_toolbar_application />') < strpos($sApp, 'id="toggleSidebar"'), 'Search and Add on the logo\'s row.');
        $this->assertMatchesRegularExpression('/<div class="bx-app-sidebar-foot">\s*__sys_app_account__/', $sApp);
        $this->assertStringContainsString(".bx-app-sidebar-head .bx-menu-toolbar .bx-menu-toolbar-item {\n    width: 2.75rem;\n    height: 2.75rem;", self::read('modules/boonex/artificer/data/template/system/css/common.css'), 'Search and Add are 44px, as the header toolbar\'s buttons and NEO\'s.');

        $sSql = self::read('install/sql/system.sql');
        foreach (['search', 'add-content'] as $sName)
            $this->assertStringContainsString("('sys_toolbar_application', 'system', '" . $sName . "',", $sSql);
        $this->assertStringContainsString("('sys_site_panel', 'system', 'member-avatar', '_sys_menu_item_title_system_member_avatar', '', '', '', '', '', '', 2147483646, 0, 0, 1),", $sSql, 'The account is at the foot.');

        $sAccount = self::read('modules/boonex/artificer/template/application_account.html');
        $this->assertStringContainsString("oBxArtificerUtils.getAccountMenu('#bx-sliding-menu-account', this, {align: 'left', flip: true});", $sAccount, 'At the foot, the menu opens above it.');
        $this->assertStringContainsString('sidebar-toggle-item>__name__', $sAccount, 'The narrow sidebar shows the picture alone.');

        $sFn = self::read('modules/boonex/artificer/data/template/system/scripts/BxTemplFunctions.php');
        $this->assertStringContainsString("case 'sys_app_context_switcher':", $sFn);
        $this->assertStringContainsString("getParam('sys_api_context_switcher')", $sFn, 'The apps\' context switcher setting.');
    }

    public function testContentIsOneBlockScrollingInside(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $this->assertStringContainsString('<div id="main-content" class="bx-main-column wide bx-app-content bx-def-color-bg-block bx-def-border-block bx-def-border-radius-block relative w-full h-full overflow-y-auto">', $sApp, 'The blocks\' fill, edge, shadow and corners.');

        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $this->assertStringContainsString("height: 100dvh; /* the window: the content block scrolls inside it, between the strips */", $sCss);
        $this->assertStringContainsString("    margin: 0 1rem;\n}", $sCss, '16px from the window\'s sides, as the strips are from its top and bottom.');
        $this->assertStringContainsString("html:has(.bx-main.bx-pt-application) {\n        overflow: hidden;\n        scrollbar-gutter: auto;", substr($sCss, strpos($sCss, '@media (min-width: 1280px) {')), 'Wide, the window does not scroll, so no scrollbar gutter.');
        // below the breakpoint: a page of the Standard layout, the window scrolling it, no frame and no footer strip
        $sNarrow = substr($sCss, strpos($sCss, '@media (max-width: 1279.98px) {'));
        $this->assertStringContainsString(".bx-main.bx-pt-application .bx-app-content {\n        height: auto;\n        margin: 0;\n        overflow: visible;\n        border-radius: 0;\n        background-color: transparent;\n        box-shadow: none;", $sNarrow);
        $this->assertStringContainsString(".bx-main.bx-pt-application .bx-app-footer {\n        display: none;", $sNarrow);

        $this->assertStringContainsString("window.dispatchEvent(new Event('scroll'));", self::read('modules/boonex/artificer/js/sidebar.js'), 'The page\'s scripts listen on the window.');
    }

    public function testEdgeSizesAndTogglesTheSidebar(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $this->assertStringContainsString('<div id="sidebarResizer" class="bx-app-sidebar-resizer" role="separator" aria-orientation="vertical" aria-controls="sidebar" tabindex="0" aria-label="<bx_text_attribute:_sys_txt_sidebar_resize />"', $sApp);
        $this->assertStringContainsString("localStorage.getItem('sidebarWidth')", $sApp, 'The dragged width before the first paint.');

        $sJs = self::read('modules/boonex/artificer/js/sidebar.js');
        foreach (['var WIDTH_MIN = 240;', 'var WIDTH_MAX = 400;', 'var WIDTH_SNAP = 160;', "oMain.classList.toggle('bx-app-sidebar-narrow', bNarrow);", "localStorage.setItem(KEY_WIDTH,", "if(bMoved)\n                    fSave();\n                else\n                    fToggle();"] as $sPart)
            $this->assertStringContainsString($sPart, $sJs);

        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $this->assertStringContainsString('--bx-sidebar-width: var(--bx-sidebar-width-expanded, 16rem);', $sCss);
        $sWide = substr($sCss, strpos($sCss, '@media (min-width: 1280px) {'));
        $this->assertStringContainsString(".bx-main.bx-pt-application #toggleSidebar {\n        display: none;", $sWide, 'Wide screens have the handle, not the button.');
        $this->assertStringContainsString('cursor: col-resize;', $sWide);
        $this->assertMatchesRegularExpression('/\.bx-app-sidebar-resizer::after \{[^}]*background-color: rgb\(37 99 235\);/', $sWide, 'Hovered, dragged or focused, the handle is the accent colour, as in NEO.');

        $this->assertStringContainsString('_sys_txt_sidebar_resize', self::read('modules/boonex/english/data/langs/system/en.xml'));
        $this->assertStringContainsString('_sys_txt_sidebar_resize', self::read('migrations/2026111951_application_toolbar_en.xml'));
    }
}
