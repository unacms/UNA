<?php

/**
 * A section's add action (the + that creates an item of the section's type, e.g. a new organization) is one button on the
 * site and in NEO: glass prominent (the accent), small, with the module's own add icon (its create item in its "My" menu): a
 * pill with its label from lg, round and icon-only below, named and titled with the item
 * type's add label, at the end of the section's title row. Site: cover.html's `bx_if:add` with the standard bx-btn classes.
 * NEO: conductor web-ui.js AddMenu, NeoButton `glassProminent`, small. Read from the files, so a change on one side fails here.
 * PageAddActionTest checks who gets it.
 */
class PageAddActionTemplateTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSiteDrawsTheAddButtonAtTheEndOfTheSectionsTitleRow(): void
    {
        $sCover = self::read('modules/boonex/artificer/data/template/system/cover.html');

        $this->assertMatchesRegularExpression('/<bx_if:title_section>.*<h1 .*__title__<\/h1>.*<bx_if:add>.*<\/bx_if:add>.*<\/bx_if:title_section>/s', $sCover, 'After the title, in the section\'s title row.');
        $this->assertStringContainsString('<a class="bx-cover-add bx-btn bx-btn-primary bx-btn-glass bx-btn-small bx-btn-icon-mobile shrink-0" href="__url__" title="__title__" aria-label="__title__">__icon__<span class="bx-btn-icon-mobile-label">__label__</span></a>', $sCover, 'Standard bx-btn: primary, glass, small, the module\'s icon and its label (icon-only below lg); named and titled.');

        $sCss = self::read('template/css/tailwind.css');
        $this->assertStringContainsString("body:not(.bx-std) .bx-btn.bx-btn-icon-mobile {\n        @apply gap-1.5 rounded-full;", $sCss, 'A pill, the icon 6px from the label, as NeoButton small.');
        $this->assertMatchesRegularExpression('/@media not all and \(min-width: 1024px\) \{.*\.bx-btn\.bx-btn-icon-mobile \.bx-btn-icon-mobile-label \{\s*position: absolute;.*\.bx-btn\.bx-btn-icon-mobile\.bx-btn-small \{\s*@apply w-9 min-w-9 px-0;/s', $sCss, 'Below lg: round, icon-only, the label still its name.');
    }

    /**
     * Where the page's title is off or hidden (Studio > Pages > page > Title), the add action moves to the end of the
     * section's tab row, the same button on both sides.
     */
    public function testWithoutTheTitleRowTheAddButtonEndsTheTabRow(): void
    {
        $sAdd = self::read('template/cover_add.html');
        $this->assertStringContainsString('<a class="bx-cover-add bx-btn bx-btn-primary bx-btn-glass bx-btn-small bx-btn-icon-mobile shrink-0 self-center ms-2 me-1 __class__" href="__url__" title="__title__" aria-label="__title__">__icon__<span class="bx-btn-icon-mobile-label">__label__</span></a>', $sAdd, 'The title row\'s button.');

        foreach (['template/_page_submenu.html', 'modules/boonex/artificer/data/template/system/pt_application.html'] as $sFile)
            $this->assertMatchesRegularExpression('/<bx_menu:sys_site_manage \/>\s*__site_submenu_add__\s*<\/div>/', self::read($sFile), $sFile . ': after the section\'s tools, at the row\'s end.');

        $sUi = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');
        $this->assertStringContainsString("{!showTitle && actionButtons}", $sUi, 'NEO: Search and Add at the end of the tab row.');
    }

    public function testNeoAddButtonIsGlassProminentSmall(): void
    {
        $sUi = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');

        $this->assertStringContainsString('actionButtons={<AddMenu menu={menu} filter="hideInTopBar" actionStyle="glassProminent" labelled />}', $sUi, 'The title row (lg): Search and Add, pills with their labels.');
        $this->assertStringContainsString('const tabletAddButtons = <AddMenu menu={menu} filter="hideInTopBar" actionStyle="glassProminent" />', $sUi, 'The tab row on tablets: round, icon-only.');
        $this->assertStringContainsString("borderShape={labelled ? 'capsule' : 'circle'}", $sUi);
        $sHeader = self::read('neo/packages/app/ui/molecules/header/header-element.js');
        $this->assertStringContainsString('return <SectionAddButton add={sectionActions.add} buttonProps={tierButtonProps(item)} />', $sHeader, 'Phones: the section\'s Add at the header\'s end, round, icon-only, as the site\'s.');
        $this->assertStringContainsString("icon: menu.add_icon || 'Plus',", $sUi, 'The module\'s own add icon, as the site\'s.');
        $this->assertStringContainsString("if (menu.add_url && currentUser && menu.add_allowed !== false) {", $sUi, 'Only where UNA says the viewer may add.');
        $this->assertStringContainsString("tooltip: menu.add_title || 'Add',", $sUi, 'The item type\'s add label, as the site\'s.');
    }

    /**
     * Each module's create item in its "My" menu has its own Lucide icon, not the site's Add menu plus, and sites that are
     * already installed get it from the module's migration.
     */
    public function testEveryModuleCreateItemHasItsOwnIcon(): void
    {
        $iFound = 0;
        foreach (glob(__DIR__ . '/../../../modules/boonex/*/install/sql/enable.sql') as $sFile) {
            $sModule = basename(dirname($sFile, 3));
            foreach (preg_split('/\R/', file_get_contents($sFile)) as $sLine) {
                if (!preg_match("/\('(bx_[a-z_]+_my)', '(bx_[a-z_]+)', 'create-[^']*', '[^']*', '[^']*', '(page\.php\?i=create-[^']*)', '[^']*', '[^']*', '([^']*)'/", $sLine, $a))
                    continue;

                $iFound++;
                $this->assertNotSame('plus', $a[4], $sModule . ': its own add icon, not the Add menu\'s plus.');
                $this->assertMatchesRegularExpression('/^[a-z0-9]+(-[a-z0-9]+)*$/', $a[4], $sModule . ': a Lucide name.');

                $sMigration = __DIR__ . '/../../../modules/boonex/' . $sModule . '/migrations/2026112581_add_icon.sql';
                $this->assertFileExists($sMigration, $sModule . ': installed sites get it too.');
                $this->assertStringContainsString("SET `icon` = '" . $a[4] . "' WHERE `set_name` = '" . $a[1] . "' AND `module` = '" . $a[2] . "' AND `link` = '" . $a[3] . "' AND `icon` = 'plus';", file_get_contents($sMigration), $sModule);
            }
        }
        $this->assertGreaterThanOrEqual(20, $iFound);
    }
}
