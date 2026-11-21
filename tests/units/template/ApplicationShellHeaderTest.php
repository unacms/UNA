<?php

/**
 * Artificer's Application layout (pt_application.html) has the standard header (_page_toolbar.html) with the sidebar's button before
 * the logo, so the header's styles (#bx-toolbar: the main menu's tabs, the toolbar's buttons) are the same in both layouts. The
 * sidebar's rows and the profile row start on one line, and the profile switcher's button has an icon.
 */
class ApplicationShellHeaderTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testHeaderIsTheStandardHeader(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $sStd = self::read('template/_page_toolbar.html');

        $this->assertSame(1, preg_match('/<header id="bx-toolbar" class="([^"]+)">/', $sStd, $aStd));
        $this->assertSame(1, preg_match('/<header id="bx-toolbar" class="([^"]+)">/', $sApp, $aApp), 'The same element and id, so #bx-toolbar rules apply.');
        $this->assertSame('bx-header bx-app-header bx-def-z-index-nav fixed top-0 w-full', $aApp[1], 'No surface of its own: no fill, blur, edge or shadow.');

        $this->assertStringContainsString('<div class="bx-header-cnt __sys_header_width__ __sys_header_align__ mx-auto px-4 box-border">', $sApp);
        // 8px above and below what it holds, a 16px strip while empty (members: their logo, tools and account are in the sidebar);
        // guests keep Log in and Join; the script keeps its height in --bx-app-header, which the sidebar and the content start under
        $this->assertStringContainsString('<div id="bx-toolbar-content" class="bx-toolbar-content relative flex items-center justify-start py-2">', $sApp);
        $this->assertStringContainsString('<div class="bx-main-content flex overflow-hidden">', $sApp);
        $this->assertStringContainsString("--bx-app-header: 1rem;", self::read('modules/boonex/artificer/data/template/system/css/common.css'));
        $this->assertStringContainsString("[['bx-toolbar', '--bx-app-header'], ['bx-app-footer', '--bx-app-footer']]", self::read('modules/boonex/artificer/js/sidebar.js'));

        // the footer strip, the same: no surface, 8px above and below, 16px while empty (as installed)
        $this->assertMatchesRegularExpression('/<footer id="bx-app-footer" class="bx-app-footer bx-def-z-index-nav fixed bottom-0 w-full">\s*<div class="bx-app-footer-cnt flex items-center px-4 py-2"><\/div>\s*<\/footer>/', $sApp);
        $this->assertStringNotContainsString('<bx_menu:sys_application />', $sApp);
        $this->assertStringNotContainsString('<bx_menu:sys_toolbar_member />', $sApp);
        $this->assertStringContainsString('__sys_application_toolbar__', $sApp);
        $this->assertStringContainsString("case 'sys_application_toolbar':\n                \$oMenu = BxDolMenu::getObjectInstance('sys_toolbar_member');", self::read('template/scripts/BxBaseFunctions.php'));
        // wide screens hide it for a member (their tools and account are in the sidebar); below them it is the standard header's
        $sCss = self::read('modules/boonex/artificer/data/template/system/css/common.css');
        $this->assertStringContainsString(".bx-main.bx-pt-application:has(.bx-app-sidebar-account) #bx-toolbar .bx-ti-right {\n        display: none;", $sCss);
        $this->assertStringContainsString("min-height: 4rem; /* the standard header's 64px */", substr($sCss, strpos($sCss, '@media (max-width: 1279.98px) {')));
    }

    public function testSidebarButtonsAreHeaderButtons(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');

        // toggleSidebar sits in the sidebar's own head and narrows it (or closes the drawer); toggleSidebarMobile, in the header, opens the drawer
        foreach (['toggleSidebar' => 'sidebar-content', 'toggleSidebarMobile' => 'sidebar'] as $sId => $sControls) {
            $this->assertSame(1, preg_match('/<button type="button" id="' . $sId . '"([^\n]*)>\n/', $sApp, $a), $sId);
            $this->assertStringContainsString('aria-controls="' . $sControls . '"', $a[1]);
            $this->assertStringContainsString('aria-label="<bx_text_attribute:_sys_menu_item_title_system_main_menu />"', $a[1], 'An icon-only button has a name.');
            $this->assertMatchesRegularExpression('/class="bx-sidebar-toggle [^"]*\bh-11 w-11\b[^"]*\brounded-full\b/', $a[1], '44px, as the header toolbar\'s and the sidebar\'s toolbar buttons.');
        }

        $sCss = self::read('template/css/tailwind.css');
        $this->assertSame(1, preg_match('/\n    \.bx-artificer \.bx-sidebar-toggle \{[^}]*\}/', $sCss, $aRule));
        $this->assertSame(1, preg_match('/\n    \.bx-artificer \.bx-menu-toolbar \.bx-menu-toolbar-item \{[^}]*\}/', $sCss, $aToolbar));
        foreach (['bg-gray-950/[0.08] hover:bg-gray-950/[0.12]', 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100', 'transition duration-300 active:opacity-50 active:shadow-none'] as $sLook) {
            $this->assertStringContainsString($sLook, $aToolbar[0]);
            $this->assertStringContainsString($sLook, $aRule[0], 'The toolbar buttons\' look.');
        }
        $this->assertStringNotContainsString('scale', $aToolbar[0] . $aRule[0], 'A press dims the button: no scale.');
    }

    public function testSidebarRowsAndTheProfileRowStartOnOneLine(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $this->assertStringContainsString('<div class="bx-mc-cnt px-2 space-y-1 ', $sApp, '8px to the rows, whose icons are 8px inside them.');

        $sCss = self::read('modules/boonex/artificer/data/template/system/css/menu.css');
        $this->assertMatchesRegularExpression('/\n#sidebar \.bx-menu-panel \.bx-profile-avatar \{\n    padding: 0 0\.5rem;\n\}/', $sCss);
        $this->assertStringNotContainsString('#sidebar.bx-mc-narrowed .bx-menu-panel .bx-profile-avatar', $sCss, 'The same 8px in the narrow sidebar: its rows are as wide as their hover plate.');
    }

    public function testProfileSwitcherButtonHasAnIcon(): void
    {
        $this->assertFileExists(__DIR__ . '/../../../plugins_public/lucide/icons/chevrons-up-down.svg');

        foreach (['template/profile_avatar.html', 'modules/boonex/artificer/data/template/system/profile_avatar.html'] as $sPath)
            $this->assertStringContainsString('<bx_image_auto:chevrons-up-down />', self::read($sPath), $sPath);
    }

    public function testHeaderMenuIconsTakeTheTabsColour(): void
    {
        // the Application menu's items carry icon colours that are unreadable on the dark header
        $this->assertStringContainsString("'house col-gray-dark'", self::read('install/sql/system.sql'));

        $this->assertMatchesRegularExpression('/\n#bx-toolbar \.bx-menu-main \.bx-stl-mii \.sys-icon \{\n    color: inherit;\n\}/', self::read('modules/boonex/artificer/data/template/system/css/menu.css'));
    }

    public function testHeaderStaysInPlaceInTheApplicationLayout(): void
    {
        // the header hides on scroll by its id (Headroom); the Application header has that id now, and stays: the sidebar beside it does
        $s = self::read('template/_header_js_toolbar.html');
        $this->assertStringContainsString("!oToolbar.closest('.bx-pt-application').length", $s);
        $this->assertLessThan(strpos($s, 'new Headroom('), strpos($s, "closest('.bx-pt-application')"), 'Checked before the header is handed to Headroom.');
    }

    public function testHoverHighlightHasTheTabsCorners(): void
    {
        // the tabs are rounded-xl, on the radius scale (Designer > Corners); a fixed 12px highlight under a hovered tab was smaller than the current tab
        $s = self::read('modules/boonex/artificer/data/template/system/css/general.css');
        $this->assertSame(1, preg_match('/#bx-toolbar \.bx-menu-main\.bx-menu-highlight-list::before,[^{]*\{[^}]*\}/', $s, $a));
        $this->assertStringContainsString('border-radius: var(--bx-radius-xl);', $a[0]);

        $this->assertMatchesRegularExpression('/#bx-toolbar \.bx-menu-main > \.bx-menu-item \{\s*@apply rounded-xl;/', self::read('template/css/tailwind.css'));
    }
}
