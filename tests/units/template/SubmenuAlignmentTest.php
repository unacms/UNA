<?php

/**
 * A section's tab row (sys_site_submenu) starts at the left, under the page title, as NEO's: its bar has the title row's 16px
 * sides (cover_title, px-4) and nothing centres the tabs, the plain row (menu_main_submenu.html, inline-flex in a text-left
 * wrapper) or the one with More (menu_main_submenu_more_auto.html, a flex row). Read from the templates and CSS, so a
 * change that centres them again fails here.
 */
class SubmenuAlignmentTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testBarHasTheTitleRowInsetAndStartsAtTheLeft(): void
    {
        foreach (['template/_page_submenu.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile) {
            $s = self::read($sFile);
            $this->assertMatchesRegularExpression('/<div id="bx-menu-main-bar" class="bx-menu-main-bar __site_submenu_class__ [^"]*\bmx-auto px-4 box-border">/', $s, $sFile . ': 16px sides, as the title row.');
            $this->assertStringNotContainsString('lg:px-8', $s, $sFile);
            $this->assertStringContainsString('<div class="flex items-center h-full text-left">', $s, $sFile . ': the page wrapper centres text, the tab row does not.');
        }

        $this->assertStringContainsString('<div class="flex items-center h-full text-left">', self::read('template/pt_application.html'));
    }

    public function testNothingCentresTheTabs(): void
    {
        foreach (['template/css/menu.css', 'modules/boonex/artificer/data/template/system/css/menu.css'] as $sFile)
            $this->assertDoesNotMatchRegularExpression('/(^|\n)\.bx-menu-main-submenu(\.bx-menu-more-auto)?\s*\{[^}]*justify-content:\s*center/', self::read($sFile), $sFile);

        $this->assertStringNotContainsString('justify-center', self::read('modules/boonex/artificer/data/template/system/menu_main_submenu_more_auto.html'));
    }
}
