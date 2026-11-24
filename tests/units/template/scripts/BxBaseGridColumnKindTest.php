<?php

/**
 * A grid column's width follows what it shows (BxBaseGrid::_getColumnKind): controls, counts and icons are as wide
 * as what is in them, text columns share the rest. A count is a number in a capsule (_getCellCount).
 */
class BxBaseGridColumnKindTest extends BxDolTestCase
{
    protected function grid(array $aFields, string $sFieldOrder = ''): BxTemplGrid
    {
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_bIsApi', false, BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_sObject', 'test_grid', BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_oTemplate', BxDolTemplate::getInstance(), BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aOptions', ['field_id' => 'id', 'field_active' => 'active', 'field_order' => $sFieldOrder, 'fields' => $aFields], BxDolGrid::class);

        return $oGrid;
    }

    protected function fields(): array
    {
        return [
            'order' => ['name' => 'order', 'title' => '', 'width' => '1%'],
            'switcher' => ['name' => 'switcher', 'title' => '', 'width' => '10%'],
            'Icon' => ['name' => 'Icon', 'title' => 'Icon', 'width' => '5%'],
            'title' => ['name' => 'title', 'title' => 'Name', 'width' => '30%', 'chars_limit' => 0, 'translatable' => 0],
            'items' => ['name' => 'items', 'title' => 'Items', 'width' => '10%', 'chars_limit' => 0, 'translatable' => 0, 'kind' => 'count'],
            'module' => ['name' => 'module', 'title' => 'Module', 'width' => '20%', 'chars_limit' => 0, 'translatable' => 0],
            'actions' => ['name' => 'actions', 'title' => '', 'width' => '24%'],
        ];
    }

    public function testKindComesFromTheColumn(): void
    {
        $oGrid = $this->grid($this->fields(), 'order');

        $aExpected = ['checkbox' => 'checkbox', 'order' => 'order', 'switcher' => 'switcher', 'switcher_api' => 'switcher', 'actions' => 'actions', 'Icon' => 'icon', 'icon' => 'icon', 'items' => 'count', 'title' => 'text', 'module' => 'text'];
        foreach($aExpected as $sKey => $sKind)
            $this->assertSame($sKind, $this->bxCallProtected($oGrid, '_getColumnKind', $sKey), $sKey);

        $this->assertSame('text', $this->bxCallProtected($this->grid($this->fields()), '_getColumnKind', 'order'), 'A column named order in a grid that is not ordered is a text column.');
    }

    public function testParamsKindWinsOverTheName(): void
    {
        $aFields = $this->fields();
        $aFields['Icon']['kind'] = 'text';
        $aFields['module']['kind'] = 'icon';
        $aFields['title']['kind'] = 'unknown';
        $oGrid = $this->grid($aFields, 'order');

        $this->assertSame('text', $this->bxCallProtected($oGrid, '_getColumnKind', 'Icon'));
        $this->assertSame('icon', $this->bxCallProtected($oGrid, '_getColumnKind', 'module'));
        $this->assertSame('text', $this->bxCallProtected($oGrid, '_getColumnKind', 'title'), 'A kind the engine does not know is ignored.');
    }

    public function testCountAndIconColumnsHug(): void
    {
        $aFields = $this->fields();
        $oGrid = $this->grid($aFields, 'order');

        foreach(['items', 'Icon', 'switcher', 'actions', 'order'] as $sKey) {
            $this->assertTrue($this->bxCallProtected($oGrid, '_isHugColumn', $sKey), $sKey);
            $this->assertFalse($this->bxCallProtected($oGrid, '_getCellWidthStyle', $sKey, $aFields[$sKey]), $sKey);
        }
        $this->assertFalse($this->bxCallProtected($oGrid, '_isHugColumn', 'title'));

        // A count is not a control: the AG engine still sizes it, the classic grid hugs it.
        $this->assertFalse($this->bxCallProtected($oGrid, '_isControlsColumn', 'items'));

        $sCell = $this->bxCallProtected($oGrid, '_getCellDefault', '<a>15</a>', 'items', $aFields['items'], []);
        $this->assertStringContainsString('bx-grid-cell-hug', $sCell);
        $this->assertStringNotContainsString('width:', $sCell);

        $sHead = $this->bxCallProtected($oGrid, '_getCellHeaderDefault', 'items', $aFields['items']);
        $this->assertStringContainsString('bx-grid-cell-hug', $sHead);
        $this->assertStringNotContainsString('width:', $sHead);
    }

    public function testTextColumnsShareWhatCountsAndIconsLeave(): void
    {
        $aFields = $this->fields();
        $oGrid = $this->grid($aFields, 'order');

        // title 30% and module 20% are all the text: 60% and 40% of the table
        $this->assertSame('width:60%', $this->bxCallProtected($oGrid, '_getCellWidthStyle', 'title', $aFields['title']));
        $this->assertSame('width:40%', $this->bxCallProtected($oGrid, '_getCellWidthStyle', 'module', $aFields['module']));
    }

    public function testAgColumnsSayWhichHug(): void
    {
        $aColumns = array_column($this->bxCallProtected($this->grid($this->fields(), 'order'), '_agColumns'), null, 'name');

        $this->assertSame('count', $aColumns['items']['hug']);
        $this->assertSame(0, $aColumns['items']['controls']);
        $this->assertSame('icon', $aColumns['Icon']['hug']);
        $this->assertSame('switcher', $aColumns['switcher']['hug']);
        $this->assertSame('actions', $aColumns['actions']['hug']);
        $this->assertSame('', $aColumns['title']['hug']);
    }

    public function testCountIsANumberInACapsule(): void
    {
        $oGrid = $this->grid($this->fields());

        $s = $this->bxCallProtected($oGrid, '_getCellCount', '15', 'studio/builder_menu.php?page=items&module=system&set=sys_site', '15 items', 'Manage items');
        $this->assertMatchesRegularExpression('/^<a class="bx-btn bx-btn-small bx-btn-capsule bx-grid-count" href="[^"]+" title="Manage items" aria-label="15 items">15<\/a>/', trim($s));
        $this->assertStringContainsString('href="studio/builder_menu.php?page=items&amp;module=system&amp;set=sys_site"', $s);

        // A javascript: link (Forms > Groups roles) keeps its quotes inside the attribute
        $s = $this->bxCallProtected($oGrid, '_getCellCount', 3, "javascript: glGrids.g.action('edit', {id: 2});", '3 actions');
        $this->assertStringNotContainsString("href=\"javascript: glGrids.g.action('edit'", $s);
        $this->assertStringContainsString(' title="3 actions" aria-label="3 actions" role="button">3</a>', $s, 'A javascript: action is a button, as parseLink names it.');
        $this->assertStringNotContainsString('role=', $this->bxCallProtected($oGrid, '_getCellCount', 3, 'page.php', '3 items'));

        // Not a number: shown as one
        $s = $this->bxCallProtected($oGrid, '_getCellCount', '<b>x</b>', '#', 'x');
        $this->assertStringContainsString('>0</a>', $s);
    }

    public function testAgEngineSizesHugColumnsByContent(): void
    {
        $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'inc/js/classes/BxDolGridAg.js');

        $this->assertStringContainsString("if (oCol.hug)\n        return { ...oDef, ...this._columnHug(oCol) };", $s);
        $this->assertStringContainsString('oApi.autoSizeColumns(aIds, false);', $s, 'A hug column is as wide as its widest cell and its title.');
        $this->assertStringContainsString('this._iRowGap = 0;', $s, 'Rows are list rows: no gap between them.');
    }

    public function testAgRowsAreListRowsNotCards(): void
    {
        $sCss = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/grid_ag.css');

        $this->assertStringNotContainsString('--bx-grid-ag-card', $sCss);
        $this->assertDoesNotMatchRegularExpression('/\.ag-row[^{]*::before\s*\{[^}]*box-shadow/', $sCss);
        $this->assertStringContainsString('--bx-grid-ag-hover: rgb(228 228 231 / 0.5);', $sCss, 'The menu items\' hover fill, gray-200/50.');
        $this->assertStringContainsString('--ag-odd-row-background-color: var(--bx-grid-ag-odd);', $sCss, 'Every other row tinted as the classic grid\'s.');
        $this->assertStringContainsString('.ag-row.ag-row-hover:not(.ag-full-width-row):not(.ag-row-selected)::before', $sCss, 'Hover never hides a selected row\'s fill.');
    }

    public function testStylesHaveTheCapsule(): void
    {
        $sCss = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/tailwind.css');
        $this->assertMatchesRegularExpression('/body:not\(\.bx-std\) \.bx-btn\.bx-btn-capsule \{\s*@apply min-w-11 rounded-full tabular-nums;/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-std \.bx-btn\.bx-btn-capsule \{\s*@apply min-w-9 rounded-full tabular-nums;/', $sCss);
    }
}
