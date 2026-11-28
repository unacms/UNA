<?php

/**
 * engine '' keeps the HTML table. engine 'ag' renders the AG Grid container and its data
 * action returns typed cells (the _getCell* methods in their API shape, with the values the
 * classic grid prints) plus a total, without leaving the request in API mode.
 */
class BxBaseGridAgEngineTest extends BxDolTestCase
{
    protected function tearDown(): void
    {
        unset($_GET['filter'], $_GET['order_field'], $_GET['order_dir'], $_GET['start'], $_GET['per_page']);
        parent::tearDown();
    }

    protected function grid(array $aOptions = [], string $sClass = 'BxTemplGrid'): BxTemplGrid
    {
        $oGrid = (new ReflectionClass($sClass))->newInstanceWithoutConstructor();
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
            'source' => [],
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
            'filter_fields' => '',
            'filter_fields_translatable' => '',
            'filter_get' => 'filter',
            'filter_mode' => 'like',
            'order_get_field' => 'order_field',
            'order_get_dir' => 'order_dir',
            'sorting_fields' => '',
            'sorting_fields_translatable' => '',
            'show_total_count' => 0,
            'responsive' => 0,
            'actions_independent' => [],
            'actions_bulk' => [],
            'actions_single' => [],
            'fields' => [
                'title' => ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ], $aOptions), BxDolGrid::class);

        return $oGrid;
    }

    public function testClassicEngineRendersTheHtmlTable(): void
    {
        $oGrid = $this->grid([
            'source' => [
                ['id' => 1, 'title' => 'Alpha', 'active' => 1],
            ],
        ]);

        $s = $oGrid->getCode();

        $this->assertStringContainsString('class="bx-grid-table"', $s);
        $this->assertStringNotContainsString('bx-grid-ag', $s);
        $this->assertFalse($this->bxGetProtected($oGrid, '_bIsApi', BxDolGrid::class));
    }

    public function testAgEngineRendersTheAgContainer(): void
    {
        $oGrid = $this->grid([
            'engine' => 'ag',
            'field_order' => 'order',
            'fields' => [
                'order' => ['name' => 'order', 'title' => '', 'width' => '1%', 'chars_limit' => 0, 'translatable' => 0],
                'title' => ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ]);

        $s = $oGrid->getCode();

        $this->assertStringContainsString('bx-grid-ag', $s);
        $this->assertStringContainsString('ag-theme-quartz', $s);
        $this->assertStringContainsString('BxDolGridAg', $s);
        $this->assertStringNotContainsString('class="bx-grid-table"', $s);
        $this->assertStringNotContainsString('bx-grid-ag-pager', $s);
        $this->assertStringContainsString('"kind":"order"', $s);
        $this->assertFalse($this->bxGetProtected($oGrid, '_bIsApi', BxDolGrid::class));
    }

    public function testDataAgReturnsOneSortedPageAndLeavesWebMode(): void
    {
        $_GET['filter'] = '';
        $_GET['order_field'] = 'title';
        $_GET['order_dir'] = 'DESC';
        $_GET['start'] = '0';
        $_GET['per_page'] = '1';

        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [
                ['id' => 1, 'title' => 'A', 'active' => 1],
                ['id' => 2, 'title' => 'B', 'active' => 0],
            ],
            'show_total_count' => 0,
            'paginate_per_page' => 1,
            'paginate_get_start' => 'start',
            'paginate_get_per_page' => 'per_page',
            'sorting_fields' => ['title'],
            'fields' => [
                'title' => ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0],
                'switcher' => ['name' => 'switcher', 'title' => 'Active', 'width' => '1%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ]);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');

        $this->assertCount(1, $a['data']);
        $this->assertSame(2, $a['total']);
        $this->assertArrayNotHasKey('total_f', $a);
        $this->assertSame(2, $a['data'][0]['_id']);
        $this->assertSame('text', $a['data'][0]['title']['type']);
        $this->assertSame('B', $a['data'][0]['title']['value']);
        $this->assertSame('switcher', $a['data'][0]['switcher']['type']);
        $this->assertSame('enable', $a['data'][0]['switcher']['action']);
        $this->assertFalse($this->bxGetProtected($oGrid, '_bIsApi', BxDolGrid::class));
        $this->assertSame(0, $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class)['show_total_count']);

        $sCell = $this->bxCallProtected($oGrid, '_getCellDefault', 'B', 'title', ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0], ['id' => 2, 'title' => 'B']);
        $this->assertStringContainsString('<td', $sCell);
    }

    public function testDataAgFormatsTheTotalWhenTheGridShowsIt(): void
    {
        $_GET['filter'] = '';
        $_GET['order_field'] = '';
        $_GET['order_dir'] = '';
        $_GET['start'] = '0';
        $_GET['per_page'] = '10';

        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [
                ['id' => 1, 'title' => 'A', 'active' => 1],
            ],
            'show_total_count' => 1,
            'paginate_per_page' => 10,
            'paginate_get_start' => 'start',
            'paginate_get_per_page' => 'per_page',
        ]);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');

        $this->assertSame(1, $a['total']);
        $this->assertNotSame('', $a['total_f']);
        $this->assertSame(1, $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class)['show_total_count']);
    }

    public function testDataAgFilterCountsTheMatches(): void
    {
        $_GET['filter'] = 'Bee';
        $_GET['order_field'] = '';
        $_GET['order_dir'] = '';
        $_GET['start'] = '0';
        $_GET['per_page'] = '10';

        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [
                ['id' => 1, 'title' => 'Alpha', 'active' => 1],
                ['id' => 2, 'title' => 'Bee', 'active' => 1],
            ],
            'filter_fields' => ['title'],
            'paginate_per_page' => 10,
            'paginate_get_start' => 'start',
            'paginate_get_per_page' => 'per_page',
        ]);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');

        $this->assertCount(1, $a['data']);
        $this->assertSame(1, $a['total']);
        $this->assertSame('Bee', $a['data'][0]['title']['value']);
    }

    /**
     * The classic grid escapes a row's text (_getCellData) before it prints it. The AG data carries
     * the same escaped value and says it is HTML, so the client can insert it as the classic grid
     * prints it and markup from the row never runs.
     */
    public function testDataAgEscapesRowTextAsTheClassicGridDoes(): void
    {
        $_GET['start'] = '0';
        $_GET['per_page'] = '10';

        $sTitle = '<img src=x onerror="alert(1)">Tom & Jerry';
        $aField = ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0];
        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [
                ['id' => 1, 'title' => $sTitle, 'active' => 1],
            ],
            'fields' => ['title' => $aField],
        ]);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');
        $aCell = $a['data'][0]['title'];

        $this->assertSame('text', $aCell['type']);
        $this->assertSame(1, $aCell['html']);
        $this->assertStringNotContainsString('<', $aCell['value']);
        $this->assertSame($sTitle, html_entity_decode($aCell['value'], ENT_QUOTES, 'UTF-8'));

        // the classic cell prints the very same value
        $this->assertSame($aCell['value'], $this->bxCallProtected($oGrid, '_getCellData', 'title', $aField, ['id' => 1, 'title' => $sTitle]));
    }

    public function testDataAgNeverReturnsMoreThanItsCap(): void
    {
        $_GET['start'] = '0';
        $_GET['per_page'] = '100000';

        $oGrid = $this->grid(['engine' => 'ag', 'paginate_per_page' => 20]);
        list(, , , $iPerPage) = $this->bxCallProtected($oGrid, '_agWindow');
        $this->assertSame($this->bxGetProtected($oGrid, '_iAgPerPageMax', BxBaseGrid::class), $iPerPage);

        // a grid whose own page is larger than the cap keeps its page
        $oGrid = $this->grid(['engine' => 'ag', 'paginate_per_page' => 1000]);
        list(, , , $iPerPage) = $this->bxCallProtected($oGrid, '_agWindow');
        $this->assertSame(1000, $iPerPage);

        $_GET['per_page'] = '7';
        list(, , , $iPerPage) = $this->bxCallProtected($oGrid, '_agWindow');
        $this->assertSame(7, $iPerPage);
    }

    /**
     * What the classic grid decides on the server for a row goes out with the AG data: a
     * disabled checkbox, the state of the switch, and the disabled state of the row's actions.
     */
    public function testDataAgCarriesTheRowStateOfTheClassicGrid(): void
    {
        $_GET['start'] = '0';
        $_GET['per_page'] = '10';

        $aCol = ['title' => '', 'width' => '1%', 'chars_limit' => 0, 'translatable' => 0];
        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [
                ['id' => 1, 'title' => 'On', 'active' => 1],
                ['id' => 2, 'title' => 'Off', 'active' => 0],
            ],
            'actions_single' => [
                'edit' => ['active' => 1, 'title' => 'Edit', 'icon' => 'pencil', 'icon_only' => 1, 'confirm' => 0],
            ],
            'fields' => [
                'checkbox' => ['name' => 'checkbox'] + $aCol,
                'switcher' => ['name' => 'switcher'] + $aCol,
                'actions' => ['name' => 'actions'] + $aCol,
            ],
        ]);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');
        list($aOn, $aOff) = $a['data'];

        $this->assertSame(0, $aOn['checkbox']['disabled']);
        $this->assertSame(1, $aOn['switcher']['on']);
        $this->assertSame('edit', $aOn['actions']['data'][0]['name']);
        $this->assertSame(0, $aOn['actions']['data'][0]['disabled']);

        $this->assertSame(1, $aOff['checkbox']['disabled']);
        $this->assertSame(0, $aOff['switcher']['on']);
        $this->assertSame(1, $aOff['actions']['data'][0]['disabled']);
    }

    /**
     * The engine switch is a console command. Nothing in the site root changes a grid on a GET,
     * and the command leaves before UNA is loaded when it is not run from the console.
     */
    public function testEngineSwitchIsConsoleOnly(): void
    {
        $this->assertFileDoesNotExist(BX_DIRECTORY_PATH_ROOT . 'grid_engine.php');

        $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'scripts/grid_engine.php');
        $iGuard = strpos($s, "PHP_SAPI !== 'cli'");
        $iHeader = strpos($s, 'header.inc.php');
        $this->assertNotFalse($iGuard);
        $this->assertNotFalse($iHeader);
        $this->assertLessThan($iHeader, $iGuard);
    }

    /**
     * The client inserts a value as HTML only when the server flagged it, and asks for rows
     * without a home-made random number in the request.
     */
    public function testClientInsertsHtmlOnlyWhenTheServerFlagsIt(): void
    {
        $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'inc/js/classes/BxDolGridAg.js');

        $this->assertStringNotContainsString('Math.random', $s);
        $this->assertSame(1, preg_match('/_text = function \(eGui, mixed, oAg, bHtml\) \{(.*?)\n\};/s', $s, $aMatch));
        $this->assertLessThan(strpos($aMatch[1], 'innerHTML'), strpos($aMatch[1], 'if (!bHtml)'));
        $this->assertStringContainsString("this._text(eGui, cell.value ?? '', oAg, !!cell.html);", $s);
    }

    public function testDataAgRefusesAClassicGrid(): void
    {
        $oGrid = $this->grid([
            'engine' => '',
            'source' => [
                ['id' => 1, 'title' => 'Alpha', 'active' => 1],
            ],
        ]);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');

        $this->assertSame([], $a['data']);
        $this->assertSame(0, $a['total']);
        $this->assertFalse($this->bxGetProtected($oGrid, '_bIsApi', BxDolGrid::class));
    }

    /**
     * AG Grid always asks for the total. The count query replaces the columns of the main query only: a column that
     * is a subquery has a FROM of its own (the module's title of Polyglot > Text Keys).
     */
    public function testTotalCountKeepsASubqueryColumnOutOfTheCount(): void
    {
        $oGrid = $this->grid();
        $iExpected = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_localization_categories`");

        $sPlain = "SELECT `tlc`.`ID` AS `id`, `tlc`.`Name` AS `name` FROM `sys_localization_categories` AS `tlc` WHERE 1";
        $this->assertSame($iExpected, (int)$this->bxCallProtected($oGrid, '_getDataSqlCounter', $sPlain, ''));

        $sSubquery = "SELECT `tlc`.`ID` AS `id`, IFNULL((SELECT `tm`.`title` FROM `sys_modules` AS `tm` WHERE `tm`.`lang_category`=`tlc`.`Name` LIMIT 1), `tlc`.`Name`) AS `module` FROM `sys_localization_categories` AS `tlc` WHERE 1";
        $this->assertSame($iExpected, (int)$this->bxCallProtected($oGrid, '_getDataSqlCounter', $sSubquery, ''));

        $sLines = "SELECT
    `tlc`.`ID` AS `id`
FROM `sys_localization_categories` AS `tlc`
WHERE 1";
        $this->assertSame($iExpected, (int)$this->bxCallProtected($oGrid, '_getDataSqlCounter', $sLines, ''));
    }

    /**
     * A column named From (Antispam's IP table) or a string with FROM in it is not the query's FROM.
     */
    public function testTotalCountSkipsFromInNamesAndStrings(): void
    {
        $oGrid = $this->grid();
        $iExpected = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_localization_categories`");

        $sNamed = "SELECT `ID`, `Name` AS `From`, `Name` AS `from_name` FROM `sys_localization_categories` WHERE 1";
        $this->assertSame($iExpected, (int)$this->bxCallProtected($oGrid, '_getDataSqlCounter', $sNamed, ''));

        $sString = "SELECT `ID`, 'a FROM b' AS `s`, \"it's from\" AS `t`, CONCAT(`Name`, ') FROM (') AS `c` FROM `sys_localization_categories` WHERE 1";
        $this->assertSame($iExpected, (int)$this->bxCallProtected($oGrid, '_getDataSqlCounter', $sString, ''));
    }

    /**
     * The transfers of the migration modules: the row's id is a module name, and a column of the same name shows its
     * title, in the classic grid's markup. The id stays apart (_id), the column shows what is inside its <td>.
     */
    public function testAgRowsKeepTheIdApartFromAColumnOfTheSameName(): void
    {
        $oGrid = $this->grid([
            'engine' => 'ag',
            'field_id' => 'module',
            'source' => [['module' => 'profiles', 'title' => 'x']],
            'fields' => [
                'module' => ['name' => 'module', 'title' => 'Module', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ], BxBaseGridAgEngineTestCustomGrid::class);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');

        $this->assertSame('profiles', $a['data'][0]['_id']);
        $this->assertSame(['type' => 'text', 'value' => 'Profiles', 'html' => 1], $a['data'][0]['module']);
    }

    /**
     * Permissions' and roles' actions: a switch acts on an id the grid builds (level and action). AG Grid's rows carry
     * it; the API's shape does not change.
     */
    public function testASwitchSendsItsOwnIdInAgRowsOnly(): void
    {
        $aSwitch = ['name' => 'switcher', 'title' => 'Active', 'width' => '1%', 'chars_limit' => 0, 'translatable' => 0];
        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [['id' => 1, 'title' => 'A', 'active' => 1]],
            'fields' => ['switcher' => $aSwitch],
        ], BxBaseGridAgEngineTestCustomGrid::class);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');
        $this->assertSame(urlencode('3#-#1'), $a['data'][0]['switcher']['id']);

        // The API: the switch as before, no id of its own.
        $this->bxSetProtected($oGrid, '_bIsApi', true, BxDolGrid::class);
        $aApi = $this->bxCallProtected($oGrid, '_getCellSwitcher', 1, 'switcher', $aSwitch, ['id' => 1, 'active' => 1]);
        $this->assertSame(['type' => 'switcher', 'data' => 1, 'fld' => 'active', 'action' => 'enable'], $aApi);

        // A switch on the row's own id sends none either.
        $oPlain = $this->grid(['engine' => 'ag', 'source' => [['id' => 1, 'title' => 'A', 'active' => 1]], 'fields' => ['switcher' => $aSwitch]]);
        $a = $this->bxCallProtected($oPlain, '_getDataAg');
        $this->assertArrayNotHasKey('id', $a['data'][0]['switcher']);
    }

    /**
     * Help Tours' preview: an action the grid draws as a link keeps its href in AG Grid's rows.
     */
    public function testALinkActionKeepsItsHref(): void
    {
        $oGrid = $this->grid([
            'engine' => 'ag',
            'source' => [['id' => 5, 'title' => 'A', 'active' => 1]],
            'actions_single' => ['preview' => ['title' => 'Preview', 'icon' => 'eye', 'icon_only' => 1, 'confirm' => 0, 'active' => 1]],
            'fields' => [
                'actions' => ['name' => 'actions', 'title' => '', 'width' => '1%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ], BxBaseGridAgEngineTestCustomGrid::class);

        $a = $this->bxCallProtected($oGrid, '_getDataAg');
        $aAction = $a['data'][0]['actions']['data'][0];

        $this->assertSame('preview', $aAction['name']);
        $this->assertSame('https://example.com/?help_tour_preview=5', $aAction['attr']['href']);
        $this->assertSame('_blank', $aAction['attr']['target']);
    }
}

/**
 * A grid with the cells and actions some grids have of their own (the transfers' module, the permissions' switch,
 * the tours' preview link).
 */
class BxBaseGridAgEngineTestCustomGrid extends BxTemplGrid
{
    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        return '<td>' . ucfirst($mixedValue) . '</td>';
    }

    protected function _getCellSwitcher($mixedValue, $sKey, $aField, $aRow)
    {
        $aRow[$this->_aOptions['field_id']] = urlencode('3#-#' . $aRow[$this->_aOptions['field_id']]);
        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }

    public function _getActionPreview($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $a['attr']['href'] = 'https://example.com/?help_tour_preview=' . $aRow['id'];
        $a['attr']['target'] = '_blank';
        return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }
}
