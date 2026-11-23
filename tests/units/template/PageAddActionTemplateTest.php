<?php

/**
 * A section's add action (the + that creates an item of the section's type, e.g. a new organization) is one button on the
 * site and in NEO: glass prominent (the accent), small, round, icon-only with a Lucide plus, named and titled with the item
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
        $this->assertMatchesRegularExpression('/<a class="bx-cover-add bx-btn bx-btn-primary bx-btn-glass bx-btn-small bx-btn-icon shrink-0 hidden sm:inline-flex" href="__url__" title="__title__" aria-label="__title__">/', $sCover, 'Standard bx-btn: primary, glass, small, icon-only, from tablets as NEO; named and titled.');
        $this->assertStringContainsString('class="lucide lucide-plus" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>', $sCover, 'Lucide plus.');
    }

    public function testNeoAddButtonIsGlassProminentSmall(): void
    {
        $sUi = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');

        $this->assertStringContainsString('actionButtons={<AddMenu menu={menu} filter="hideInTopBar" only="actions" actionStyle="glassProminent" />}', $sUi, 'The title row.');
        $this->assertStringContainsString('const addButtons = <AddMenu menu={menu} filter="hideInTopBar" actionStyle="glassProminent" />', $sUi, 'The tab row on tablets.');
        $this->assertStringContainsString("if (menu.add_url && currentUser && menu.add_allowed !== false) {", $sUi, 'Only where UNA says the viewer may add.');
        $this->assertStringContainsString("tooltip: menu.add_title || 'Add',", $sUi, 'The item type\'s add label, as the site\'s.');
    }
}
