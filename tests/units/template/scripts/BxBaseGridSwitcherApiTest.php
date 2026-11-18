<?php

/**
 * A grid's second switch, for the apps: the 'switcher_api' column turns the field named by the 'field_active_api'
 * option on and off (action 'enable_api'), and a row is greyed out only when it is off both on the site and in the apps.
 */
class BxBaseGridSwitcherApiTest extends BxDolTestCase
{
    protected function grid(array $aOptions = [], bool $bIsApi = false): BxTemplGrid
    {
        $oGrid = (new ReflectionClass('BxTemplGrid'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oGrid, '_bIsApi', $bIsApi, BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_sObject', 'test_grid', BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_oTemplate', BxDolTemplate::getInstance(), BxBaseGrid::class);
        $this->bxSetProtected($oGrid, '_aMarkers', [], BxDolGrid::class);
        $this->bxSetProtected($oGrid, '_aOptions', array_merge([
            'source' => '',
            'table' => 'test_table',
            'field_id' => 'id',
            'field_order' => '',
            'field_active' => 'active',
            'field_active_api' => 'active_api',
            'fields' => [
                'switcher' => ['name' => 'switcher', 'title' => '_sys_grid_lbl_site', 'width' => '1%'],
                'switcher_api' => ['name' => 'switcher_api', 'title' => '_sys_grid_lbl_apps', 'width' => '1%'],
                'title' => ['name' => 'title', 'title' => 'Name', 'width' => '100%', 'chars_limit' => 0, 'translatable' => 0],
            ],
        ], $aOptions), BxDolGrid::class);

        return $oGrid;
    }

    public function testRowIsGreyedOnlyWhenOffOnTheSiteAndInTheApps(): void
    {
        $oGrid = $this->grid();

        $this->assertFalse($this->bxCallProtected($oGrid, '_isRowDisabled', ['active' => 1, 'active_api' => 0]));
        $this->assertFalse($this->bxCallProtected($oGrid, '_isRowDisabled', ['active' => 0, 'active_api' => 1]), 'An item that is still in the apps is not greyed out.');
        $this->assertTrue($this->bxCallProtected($oGrid, '_isRowDisabled', ['active' => 0, 'active_api' => 0]));

        $oGridSiteOnly = $this->grid(['field_active_api' => '']);
        $this->assertTrue($this->bxCallProtected($oGridSiteOnly, '_isRowDisabled', ['active' => 0, 'active_api' => 1]), 'A grid without the apps field keeps the old rule.');
    }

    public function testFieldNameMustBeAPlainColumnName(): void
    {
        $this->assertSame('active_api', $this->bxCallProtected($this->grid(), '_getFieldActiveApi'));
        $this->assertSame('', $this->bxCallProtected($this->grid(['field_active_api' => 'active_api` = 1, `id']), '_getFieldActiveApi'));
        $this->assertSame('', $this->bxCallProtected($this->grid(['field_active_api' => '']), '_getFieldActiveApi'));

        $oGrid = $this->grid();
        $aOptions = $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class);
        unset($aOptions['field_active_api']);
        $this->bxSetProtected($oGrid, '_aOptions', $aOptions, BxDolGrid::class);
        $this->assertSame('', $this->bxCallProtected($oGrid, '_getFieldActiveApi'), 'A grid defined without the option has no apps field.');
    }

    public function testSwitcherApiIsAColumnOfControls(): void
    {
        $oGrid = $this->grid();

        $this->assertTrue($this->bxCallProtected($oGrid, '_isControlsColumn', 'switcher_api'));
        $this->assertSame(' bx-grid-cell-hug', $this->bxCallProtected($oGrid, '_getCellHugClass', 'switcher_api'));
    }

    public function testCellsAreSwitchesNamedForWhereTheyShowTheRow(): void
    {
        $oGrid = $this->grid();
        $aFields = $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class)['fields'];
        $aRow = ['id' => 7, 'title' => 'Dashboard', 'active' => 0, 'active_api' => 1];

        $sApi = $this->bxCallProtected($oGrid, '_getCellSwitcherApi', '', 'switcher_api', $aFields['switcher_api'], $aRow);
        $this->assertStringContainsString('bx_grid_action_single="enable_api"', $sApi);
        $this->assertStringContainsString('bx_grid_action_data="7"', $sApi);
        $this->assertStringContainsString('aria-label="' . bx_html_attribute(_t('_sys_grid_lbl_show_in_apps') . ': Dashboard') . '"', $sApi);
        $this->assertStringContainsString('title="' . bx_html_attribute(_t('_sys_grid_lbl_show_in_apps') . ': Dashboard') . '"', $sApi);
        $this->assertStringContainsString('bx-switcher-cont on', $sApi);

        $sSite = $this->bxCallProtected($oGrid, '_getCellSwitcher', '', 'switcher', $aFields['switcher'], $aRow);
        $this->assertStringContainsString('bx_grid_action_single="enable"', $sSite);
        $this->assertStringContainsString('aria-label="' . bx_html_attribute(_t('_sys_grid_lbl_show_on_site') . ': Dashboard') . '"', $sSite);
        $this->assertStringContainsString('bx-switcher-cont off', $sSite);

        // two switches in one row need different names
        $this->assertNotSame(
            $this->attr($sSite, 'name'),
            $this->attr($sApi, 'name')
        );
    }

    public function testGridWithoutTheAppsFieldHasNoAppsSwitch(): void
    {
        $oGrid = $this->grid(['field_active_api' => '']);
        $aFields = $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class)['fields'];

        $sApi = $this->bxCallProtected($oGrid, '_getCellSwitcherApi', '', 'switcher_api', $aFields['switcher_api'], ['id' => 7, 'active' => 1, 'active_api' => 1]);
        $this->assertStringNotContainsString('bx_grid_action_single', $sApi);

        $sSite = $this->bxCallProtected($oGrid, '_getCellSwitcher', '', 'switcher', ['name' => 'switcher', 'title' => ''], ['id' => 7, 'title' => 'Dashboard', 'active' => 1]);
        $this->assertStringContainsString('aria-label="' . bx_html_attribute(_t('_sys_active') . ': Dashboard') . '"', $sSite, 'A grid with one switch names it as before.');
    }

    public function testApiFormReturnsBothSwitches(): void
    {
        $oGrid = $this->grid([], true);
        $aFields = $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class)['fields'];
        $aRow = ['id' => 7, 'active' => 0, 'active_api' => 1];

        $this->assertSame(['type' => 'switcher', 'data' => 0, 'fld' => 'active', 'action' => 'enable'], $this->bxCallProtected($oGrid, '_getCellSwitcher', '', 'switcher', $aFields['switcher'], $aRow));
        $this->assertSame(['type' => 'switcher', 'data' => 1, 'fld' => 'active_api', 'action' => 'enable_api'], $this->bxCallProtected($oGrid, '_getCellSwitcherApi', '', 'switcher_api', $aFields['switcher_api'], $aRow));
    }

    public function testEnableApiIsRefusedWithoutTheAppsFieldOrColumn(): void
    {
        $_GET['ids'] = $_REQUEST['ids'] = [7];
        try {
            $this->assertSame([], $this->grid(['field_active_api' => ''], true)->performActionEnableApi(1));

            $oGrid = $this->grid([], true);
            $aOptions = $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class);
            unset($aOptions['fields']['switcher_api']);
            $this->bxSetProtected($oGrid, '_aOptions', $aOptions, BxDolGrid::class);
            $this->assertSame([], $oGrid->performActionEnableApi(1), 'A grid without the Apps column does not take the action.');

            $this->assertFalse($this->bxCallProtected($this->grid(['field_active_api' => 'bad name']), '_enableApi', 7, 1));
        } finally {
            unset($_GET['ids'], $_REQUEST['ids']);
        }
    }

    protected function attr(string $sHtml, string $sAttr): string
    {
        $this->assertSame(1, preg_match('/<input[^>]* ' . $sAttr . '="([^"]*)"/', $sHtml, $aMatch), $sAttr);
        return $aMatch[1];
    }
}
