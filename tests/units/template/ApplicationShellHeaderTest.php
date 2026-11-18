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
        $this->assertSame($aStd[1], $aApp[1], 'The same bar: surface, blur and edge.');

        $this->assertStringContainsString('<div class="bx-header-cnt __sys_header_width__ __sys_header_align__ mx-auto px-4 box-border">', $sApp);
        $this->assertStringContainsString('<div id="bx-toolbar-content" class="bx-toolbar-content relative flex items-center justify-start h-16">', $sApp);
        $this->assertMatchesRegularExpression('/<nav id="bx-menu-toolbar-1-container"[^>]*>\s*<bx_menu:sys_application \/>\s*<\/nav>/', $sApp);
        $this->assertStringContainsString('<bx_menu:sys_toolbar_member />', $sApp);
    }

    public function testSidebarButtonsAreHeaderButtons(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');

        // toggleSidebar sits in the sidebar's own head and narrows it (or closes the drawer); toggleSidebarMobile, in the header, opens the drawer
        foreach (['toggleSidebar' => 'sidebar-content', 'toggleSidebarMobile' => 'sidebar'] as $sId => $sControls) {
            $this->assertSame(1, preg_match('/<button type="button" id="' . $sId . '"([^\n]*)>\n/', $sApp, $a), $sId);
            $this->assertStringContainsString('aria-controls="' . $sControls . '"', $a[1]);
            $this->assertStringContainsString('aria-label="<bx_text_attribute:_sys_menu_item_title_system_main_menu />"', $a[1], 'An icon-only button has a name.');
            $this->assertMatchesRegularExpression('/class="bx-sidebar-toggle [^"]*\bh-11 w-11\b[^"]*\brounded-full\b/', $a[1], '44px, as the member toolbar\'s buttons.');
        }

        $sCss = self::read('template/css/tailwind.css');
        $this->assertSame(1, preg_match('/\n    \.bx-artificer \.bx-sidebar-toggle \{[^}]*\}/', $sCss, $aRule));
        $this->assertSame(1, preg_match('/\n    \.bx-artificer \.bx-menu-toolbar \.bx-menu-toolbar-item \{[^}]*\}/', $sCss, $aToolbar));
        foreach (['bg-gray-950/[0.08] hover:bg-gray-950/[0.12]', 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100', 'active:scale-[0.98]'] as $sLook) {
            $this->assertStringContainsString($sLook, $aToolbar[0]);
            $this->assertStringContainsString($sLook, $aRule[0], 'The toolbar buttons\' look.');
        }
    }

    public function testSidebarRowsAndTheProfileRowStartOnOneLine(): void
    {
        $sApp = self::read('modules/boonex/artificer/data/template/system/pt_application.html');
        $this->assertStringContainsString('<div class="bx-mc-cnt px-2 space-y-1 ', $sApp, '8px to the rows, whose icons are 8px inside them.');

        $sCss = self::read('modules/boonex/artificer/data/template/system/css/menu.css');
        $this->assertMatchesRegularExpression('/\n#sidebar \.bx-menu-panel \.bx-profile-avatar \{\n    padding: 0 0\.5rem;\n\}/', $sCss);
        $this->assertMatchesRegularExpression('/\n#sidebar\.bx-mc-narrowed \.bx-menu-panel \.bx-profile-avatar \{\n    padding: 0;\n\}/', $sCss);
    }

    public function testProfileSwitcherButtonHasAnIcon(): void
    {
        $this->assertStringContainsString("'arrows-alt-v' => 'chevrons-up-down',", self::read('template/scripts/BxBaseIconsetLucide.php'));
        $this->assertFileExists(__DIR__ . '/../../../plugins_public/lucide/icons/chevrons-up-down.svg');

        foreach (['template/profile_avatar.html', 'modules/boonex/artificer/data/template/system/profile_avatar.html'] as $sPath)
            $this->assertStringContainsString('arrows-alt-v', self::read($sPath), $sPath);
    }
}
