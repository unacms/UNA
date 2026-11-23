<?php

/**
 * The buttons at the end of a section's tab row look like its tabs, on the site and in NEO. On the site that is the manage menu
 * (a profile's or a context's cog, sys_site_manage) in the submenu bar: as tall as the row, the tabs' sides and label colours,
 * the current tab's colour while its popup is open. In NEO it is the row's Search, filters and (on tablets) Add: NeoButton glass,
 * small and round, as the tabs (MenuItemSubmenu). Read from the template, CSS and NEO files, so a change on one side fails here.
 */
class SubmenuToolsParityTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSiteManageMenuIsDrawnAsATab(): void
    {
        foreach (['template/_page_submenu.html', 'template/pt_application.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile)
            $this->assertMatchesRegularExpression('/<div class="bx-menu-main-bar-tools flex-none self-stretch flex items-stretch z-0">\s*<bx_menu:sys_site_manage \/>/', self::read($sFile), $sFile . ': the slot is as tall as the tab row.');

        $sCss = self::read('template/css/tailwind.css');
        $this->assertStringContainsString("@apply flex items-stretch h-full p-0 border-0 bg-transparent dark:bg-transparent ring-0;", $sCss, 'No pill of its own, also while its popup marks it active.');
        $this->assertStringContainsString("    .bx-menu-main-bar-tools .bx-menu-item > a {\n        @apply flex items-center justify-center h-full px-4 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200;", $sCss, 'The tab\'s 16px sides and label colours (menu_main_submenu.html).');
        $this->assertMatchesRegularExpression('/\.bx-menu-main-bar \.bx-menu-main-bar-tools \.bx-menu-item > a\[aria-expanded="true"\],\s*\.bx-menu-main-bar \.bx-menu-main-bar-tools \.bx-menu-item\.bx-menu-tab-active > a \{\s*@apply text-blue-700 dark:text-blue-300;/', $sCss, 'Open: the current tab\'s colour.');

        $sTab = self::read('modules/boonex/artificer/data/template/system/menu_main_submenu.html');
        $this->assertStringContainsString('py-4 px-4 text-gray-600 dark:text-gray-400', $sTab, 'The tab the cog copies.');
    }

    public function testNeoTabRowButtonsAreGlassSmall(): void
    {
        $sUi = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');
        $this->assertStringContainsString("const AddMenu = ({ menu, filter, only, style = 'glass', actionStyle = style, controlSize = 'small', labelled = false }) => {", $sUi);
        $this->assertStringContainsString('toolButtons={<AddMenu menu={menu} filter="hideInTopBar" only="search" />}', $sUi, 'Search on the tab row: the tabs\' look.');
        $this->assertStringContainsString('only="actions" actionStyle="glassProminent" labelled />}', $sUi, 'Add on the section\'s first line: glass prominent, small, as the site\'s (PageAddActionTemplateTest).');

        $sTab = self::read('neo/packages/app/components/menu-items/submenu.js');
        $this->assertStringContainsString("const controlSize = 'small';", $sTab);
        $this->assertStringContainsString("const style = 'glass';", $sTab);
    }
}
