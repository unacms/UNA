<?php

/**
 * Every Studio grid has the page builder's header: the block's title with the grid's own buttons on the right, the filters in
 * the row under them, one line, then the rows. On a Studio page a grid's header starts with a title row
 * (BxDolGrid::setHeaderTitleRow) and the block puts its title there instead of drawing a caption above the grid
 * (BxBaseStudioWidget::getBlockCode).
 */
class GridHeaderTitleRowTest extends BxDolTestCase
{
    protected function tearDown(): void
    {
        BxDolGrid::setHeaderTitleRow(false);
        parent::tearDown();
    }

    protected function grid(array $aOptions = []): BxTemplGrid
    {
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_bIsApi', false, BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_sObject', 'test_grid', BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_oTemplate', BxDolTemplate::getInstance(), BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_oFunctions', BxTemplFunctions::getInstance(), BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aMarkers', [], BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_aQueryAppend', [], BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aQueryAppendExclude', [], BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aPopupOptions', [], BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aConfirmMessages', [], BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aQueryReset', [], BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aOptions', array_merge([
            'object' => 'test_grid',
            'engine' => '',
            'source_type' => 'Array',
            'source' => [['id' => 1, 'title' => 'Alpha', 'active' => 1]],
            'table' => 'test_table',
            'field_id' => 'id',
            'field_order' => '',
            'field_active' => 'active',
            'field_active_api' => '',
            'paginate_url' => 'page.php',
            'paginate_per_page' => 20,
            'paginate_simple' => null,
            'paginate_get_start' => '',
            'paginate_get_per_page' => '',
            'filter_fields' => 'title',
            'filter_fields_translatable' => '',
            'filter_get' => 'filter',
            'filter_mode' => 'like',
            'order_get_field' => 'order_field',
            'order_get_dir' => 'order_dir',
            'sorting_fields' => '',
            'sorting_fields_translatable' => '',
            'show_total_count' => 0,
            'responsive' => 0,
            'actions_independent' => [
                'add' => ['type' => 'button', 'title' => 'Add item', 'icon' => '', 'icon_only' => 0, 'confirm' => 0, 'active' => 1],
            ],
            'actions_bulk' => [],
            'actions_single' => [],
            'fields' => [
                'title' => ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ], $aOptions), BxDolGrid::class);

        return $oGrid;
    }

    protected function widget(): BxTemplStudioWidget
    {
        $oWidget = (new ReflectionClass('BxTemplStudioWidget'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oWidget, 'aPage', [], BxDolStudioPage::class);

        return $oWidget;
    }

    public function testOutsideStudioTheHeaderKeepsTheButtonsBesideTheFilters(): void
    {
        $s = $this->grid()->getCode();

        $this->assertStringNotContainsString(BxDolGrid::HEADER_TITLE_SLOT, $s);
        $this->assertStringNotContainsString('bx-gh-title', $s);
        $this->assertStringContainsString('<div class="bx-grid-header-controls-independent">', $s);
        $this->assertStringContainsString('bx_grid_action_independent="add"', $s);
    }

    public static function engines(): array
    {
        return [
            'classic' => [''],
            'ag' => ['ag'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('engines')]
    public function testOnAStudioPageTheTitleRowComesFirstWithTheButtons(string $sEngine): void
    {
        BxDolGrid::setHeaderTitleRow(true);
        $s = $this->grid(['engine' => $sEngine])->getCode();

        $this->assertStringContainsString('bx-gh-title', $s);
        $this->assertStringNotContainsString('bx-gh-title-only', $s, 'The filters follow in their own row.');
        $this->assertStringContainsString('<h2 class="bx-std-bcap-text">' . BxDolGrid::HEADER_TITLE_SLOT . '</h2>', $s);

        $this->assertSame(1, substr_count($s, 'bx_grid_action_independent="add"'));
        $iTitle = strpos($s, BxDolGrid::HEADER_TITLE_SLOT);
        $iButton = strpos($s, 'bx_grid_action_independent="add"');
        $iFilter = strpos($s, 'bx-grid-header-controls-filter');
        $this->assertStringContainsString('<div class="bx-std-bcap-controls bx-grid-header-controls-independent">', $s);

        if ($sEngine === 'ag') {
            // AG Grid: the grid's buttons and then the rows / cards switch, a segmented one, are in the title row.
            $iView = strpos($s, 'bx-grid-ag-view-btn');
            $this->assertSame(1, substr_count($s, 'class="bx-grid-ag-view bx-std-segmented"'));
            $this->assertTrue($iTitle < $iButton && $iButton < $iView && $iView < $iFilter);
        }
        else {
            // The buttons are in the title row, once, and come before the filters, as they show.
            $this->assertTrue($iTitle < $iButton && $iButton < $iFilter);
        }

        // Inside the grid's wrapper, where the grid script binds its buttons.
        $this->assertTrue(strpos($s, 'id="bx-grid-wrap-test_grid"') < $iButton);
    }

    public function testATitleRowWithoutFiltersIsTheWholeHeader(): void
    {
        BxDolGrid::setHeaderTitleRow(true);
        $s = $this->grid(['filter_fields' => ''])->getCode();

        $this->assertStringContainsString('bx-gh-title bx-gh-title-only', $s);
    }

    public function testTheBlockPutsItsTitleInTheGridHeader(): void
    {
        BxDolGrid::setHeaderTitleRow(true);
        $sGrid = $this->grid()->getCode();

        $s = $this->widget()->getBlockCode(['caption' => 'Menus <b>&</b>', 'content' => $sGrid]);

        $this->assertStringNotContainsString(BxDolGrid::HEADER_TITLE_SLOT, $s);
        $this->assertStringContainsString('<h2 class="bx-std-bcap-text">Menus <b>&</b></h2>', $s, 'The title as the caption prints it.');
        $this->assertSame(1, substr_count($s, 'class="bx-std-block-caption"'), 'No caption of the block above the grid.');
        $this->assertTrue(strpos($s, 'id="bx-grid-wrap-test_grid"') < strpos($s, 'bx-std-block-caption'));
    }

    public function testTheGridMayFollowThePageScripts(): void
    {
        BxDolGrid::setHeaderTitleRow(true);
        $sScript = "<script language=\"javascript\">\nvar oTools = new Tools({\"a\":\"<div>\"});\n</script>\n";

        $s = $this->widget()->getBlockCode(['caption' => 'Reports', 'content' => $sScript . $this->grid()->getCode()]);

        $this->assertStringContainsString('<h2 class="bx-std-bcap-text">Reports</h2>', $s);
        $this->assertSame(1, substr_count($s, 'class="bx-std-block-caption"'));
    }

    public function testABlockWithMoreThanTheGridKeepsItsCaption(): void
    {
        BxDolGrid::setHeaderTitleRow(true);
        $sGrid = $this->grid()->getCode();

        foreach ([
            'grid inside other content' => ['caption' => 'Connectors', 'content' => '<p>Intro</p>' . $sGrid],
            'caption actions' => ['caption' => 'Keys', 'content' => $sGrid, 'actions' => [['name' => 'more', 'caption' => 'More', 'url' => '#']]],
            'top panel' => ['caption' => 'Keys', 'content' => $sGrid, 'panel_top' => '<select></select>'],
        ] as $sCase => $aBlock) {
            $s = $this->widget()->getBlockCode($aBlock);

            $this->assertStringNotContainsString(BxDolGrid::HEADER_TITLE_SLOT, $s, $sCase);
            $this->assertStringContainsString('<h2 class="bx-std-bcap-text"></h2>', $s, $sCase . ': the grid row keeps only its buttons.');
            $this->assertLessThan(strpos($s, 'id="bx-grid-wrap-test_grid"'), strpos($s, 'bx-std-block-caption'), $sCase . ': the block caption comes first.');
        }
    }

    public function testABlockWithoutCaptionLeavesTheTitleEmpty(): void
    {
        BxDolGrid::setHeaderTitleRow(true);
        $s = $this->widget()->getBlockCode(['type' => BX_DB_CONTENT_ONLY, 'caption' => 'Hidden', 'content' => $this->grid()->getCode()]);

        $this->assertStringContainsString('<h2 class="bx-std-bcap-text"></h2>', $s);
        $this->assertStringNotContainsString('Hidden', $s);
    }

    public function testOneLineBetweenTheFiltersAndTheRows(): void
    {
        // The header (or the block caption above a grid without one) draws the line; the column titles drop their top border.
        $sCss = str_replace("\r\n", "\n", file_get_contents(__DIR__ . '/../../../studio/template/css/page.css'));
        $this->assertStringContainsString("div.bx-std-block-content > [id^=\"bx-grid-wrap-\"] .bx-grid-table thead th {\n    border-top-width: 0;\n}", $sCss);
        $this->assertStringContainsString('box-shadow: inset 0 -1px 0 0 rgb(0 0 0 / 0.05);', $sCss);
    }

    public function testStudioPagesTurnTheTitleRowOn(): void
    {
        $s = file_get_contents(__DIR__ . '/../../../studio/template/scripts/BxBaseStudioWidget.php');
        $this->assertStringContainsString('BxDolGrid::setHeaderTitleRow(true);', $s);
    }
}
