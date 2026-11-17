<?php

/**
 * A grid's columns of controls (the row's checkbox, drag handle, switch and action buttons) are as wide as what is in
 * them: their `sys_grid_fields` width is left out and their cells get .bx-grid-cell-hug (css/grid.css). The text
 * columns' percent widths are scaled to fill the table, so the room they don't claim doesn't go to the controls.
 */
class BxBaseGridControlsColumnTest extends BxDolTestCase
{
    protected function grid(array $aFields, string $sFieldOrder = ''): BxTemplGrid
    {
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_bIsApi', false, BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_sObject', 'test_grid', BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_aOptions', ['field_id' => 'id', 'field_active' => 'active', 'field_order' => $sFieldOrder, 'fields' => $aFields], BxDolGrid::class);

        return $oGrid;
    }

    protected function fields(): array
    {
        return [
            'order' => ['name' => 'order', 'title' => '', 'width' => '2%'],
            'switcher' => ['name' => 'switcher', 'title' => '', 'width' => '8%'],
            'title' => ['name' => 'title', 'title' => 'Name', 'width' => '30%', 'chars_limit' => 0, 'translatable' => 0],
            'module' => ['name' => 'module', 'title' => 'Module', 'width' => '20%', 'chars_limit' => 0, 'translatable' => 0],
            'actions' => ['name' => 'actions', 'title' => '', 'width' => '40%'],
        ];
    }

    public function testControlsColumnsAreNamed(): void
    {
        $oGrid = $this->grid($this->fields(), 'order');

        foreach(['checkbox', 'switcher', 'actions', 'order'] as $sKey)
            $this->assertTrue($this->bxCallProtected($oGrid, '_isControlsColumn', $sKey), $sKey);
        foreach(['title', 'module'] as $sKey)
            $this->assertFalse($this->bxCallProtected($oGrid, '_isControlsColumn', $sKey), $sKey);

        $this->assertFalse($this->bxCallProtected($this->grid($this->fields()), '_isControlsColumn', 'order'), 'A column named order in a grid that is not ordered is a text column.');
    }

    public function testControlsColumnsHugTheirContent(): void
    {
        $aFields = $this->fields();
        $oGrid = $this->grid($aFields, 'order');

        $this->assertSame(' bx-grid-cell-hug', $this->bxCallProtected($oGrid, '_getCellHugClass', 'switcher'));
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getCellHugClass', 'title'));
        $this->assertFalse($this->bxCallProtected($oGrid, '_getCellWidthStyle', 'switcher', $aFields['switcher']));
        $this->assertFalse($this->bxCallProtected($oGrid, '_getCellWidthStyle', 'actions', $aFields['actions']));

        $sCell = $this->bxCallProtected($oGrid, '_getCellOrder', 1, 'order', $aFields['order'], ['id' => 5]);
        $this->assertStringContainsString('bx-grid-cell-hug', $sCell);
        $this->assertStringNotContainsString('width:', $sCell);

        $sHead = $this->bxCallProtected($oGrid, '_getCellHeaderDefault', 'actions', $aFields['actions']);
        $this->assertStringContainsString('bx-grid-cell-hug', $sHead);
        $this->assertStringNotContainsString('width:', $sHead);
    }

    public function testTextColumnsFillTheTable(): void
    {
        $aFields = $this->fields();
        $oGrid = $this->grid($aFields, 'order');

        // 30% and 20% of the table become 60% and 40%
        $this->assertSame('width:60%', $this->bxCallProtected($oGrid, '_getCellWidthStyle', 'title', $aFields['title']));
        $this->assertSame('width:40%', $this->bxCallProtected($oGrid, '_getCellWidthStyle', 'module', $aFields['module']));

        $sCell = $this->bxCallProtected($oGrid, '_getCellDefault', 'System', 'module', $aFields['module'], []);
        $this->assertStringContainsString('width:40%', $sCell);
        $this->assertStringNotContainsString('bx-grid-cell-hug', $sCell);
    }

    public function testWidthsThatAreNotPercentsStayAsTheyAre(): void
    {
        $aFields = $this->fields();
        $aFields['title']['width'] = '200px';
        $oGrid = $this->grid($aFields, 'order');

        $this->assertSame('width:200px', $this->bxCallProtected($oGrid, '_getCellWidthStyle', 'title', $aFields['title']));
        $this->assertSame('width:20%', $this->bxCallProtected($oGrid, '_getCellWidthStyle', 'module', $aFields['module']));
    }

    public function testStylesHaveTheHugCell(): void
    {
        $sCss = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/grid.css');
        $this->assertMatchesRegularExpression('/\.bx-grid-table \.bx-grid-cell-hug \{\s*width: 1px;\s*white-space: nowrap;/', $sCss);
    }
}
