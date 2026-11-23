<?php

/**
 * A section's tab row (sys_site_submenu) starts at the left, under the page title, as NEO's: its bar has 12px sides and each tab
 * draws its hover pill 4px in from its cell, so the first pill is at the title row's 16px (cover_title, px-4), and nothing centres the tabs, the plain row (menu_main_submenu.html, inline-flex in a text-left
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

    public function testBarStartsAtTheLeft(): void
    {
        foreach (['template/_page_submenu.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile) {
            $s = self::read($sFile);
            $this->assertMatchesRegularExpression('/<div id="bx-menu-main-bar" class="bx-menu-main-bar __site_submenu_class__ [^"]*\bmx-auto px-3 box-border">/', $s, $sFile . ': 12px sides and the pill\'s 4px: the first pill at the title row\'s 16px.');
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

    /**
     * A tab's hover, press and keyboard focus are drawn on a pill around its label, as NEO's small tab buttons (36px, capsule,
     * 12px sides), not on the row's full height: the menu item states (PR #6216), gray-200/50 (gray-700/50 in dark) hovered and
     * gray-200 (gray-700) pressed in 150ms on ease-out, and the site's focus outline. The cell stays the hit area.
     */
    public function testTabStatesAreOnAPillAroundTheLabel(): void
    {
        $sPill = '<span class="bx-mi-pill absolute inset-x-1 inset-y-2 rounded-full transition-colors duration-150 ease-out group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/50 group-active:bg-gray-200 dark:group-active:bg-gray-700 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-blue-600 dark:group-focus-visible:outline-blue-400" aria-hidden="true"></span>';
        foreach (['menu_main_submenu.html', 'menu_main_submenu_more_auto.html'] as $sName) {
            $s = self::read('modules/boonex/artificer/data/template/system/' . $sName);
            $this->assertStringContainsString($sPill, $s, $sName);
            $this->assertStringContainsString('group block relative py-4 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-50 transition-colors duration-150 ease-out ', $s, $sName . ': the cell is the hit area, with no fill of its own.');
            $this->assertDoesNotMatchRegularExpression('/<a [^>]*hover:bg-/', $s, $sName);
            $this->assertStringContainsString('<span class="bx-mi-underline absolute inset-x-1 bottom-0 h-0.5 rounded-md"></span>', $s, $sName . ': the current tab\'s underline is as wide as the pill.');
        }

        $this->assertMatchesRegularExpression('/body:not\(\.bx-std\) \.bx-menu-main-submenu > \.bx-menu-item > a:focus-visible \{\s*@apply outline-none;/', self::read('template/css/tailwind.css'), 'The site\'s focus outline is on the pill, not the cell.');
        $this->assertMatchesRegularExpression('/\.bx-menu-item \.bx-mi-pill \{\s*display: none;/', self::read('modules/boonex/artificer/data/template/system/css/menu.css'), 'No pill on the tabs in the More popup.');
    }
}
