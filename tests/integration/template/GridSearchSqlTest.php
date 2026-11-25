<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A grid's search and sort make valid SQL. AG Grid always counts the rows and shows a search field wherever the grid
 * has filter fields, so a wrong column or an ambiguous one is a grid that never loads.
 */
#[Group('integration')]
class GridSearchSqlTest extends BxDolIntegrationTestCase
{
    /**
     * Grids whose search or sort once pointed at a column their query doesn't have, or one a join made ambiguous.
     */
    private const GRIDS = [
        'sys_studio_forms_pre_lists',
        'sys_studio_nav_menus', // translatable fields that name their table: `tm`.`title`
        'sys_studio_forms_displays',
        'bx_notifications_settings_administration',
        'sys_audit_administration',
        'sys_cmts_administration',
        'bx_antispam_grid_dnsbl',
        'bx_antispam_grid_ip_table',
        'bx_notifications_etemplates',
        'bx_dolphin_migration_transfers', // SE Migration's transfers are the same grid; its object connects to the old site first
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->bxLoginAsAdmin();
    }

    private const PER_PAGE = 50;

    /**
     * Grids whose rows are not the rows of the counted query: Notifications' settings are grouped by type, with a
     * title row before each group.
     */
    private const COUNT_APART = ['bx_notifications_settings_administration'];

    /**
     * The grid, counting its rows as AG Grid always has it do.
     */
    private function grid(string $sObject)
    {
        unset($GLOBALS['bxDolClasses']['BxDolGrid!' . $sObject]);

        $oGrid = BxDolGrid::getObjectInstance($sObject);
        if ($oGrid) {
            $aOptions = $this->bxGetProtected($oGrid, '_aOptions', BxDolGrid::class);
            $aOptions['show_total_count'] = 1;
            $this->bxSetProtected($oGrid, '_aOptions', $aOptions, BxDolGrid::class);
        }

        return $oGrid;
    }

    private function data($oGrid, string $sFilter, string $sOrder = ''): array
    {
        $oMethod = new ReflectionMethod(BxDolGrid::class, '_getData');

        return (array)$oMethod->invoke($oGrid, $sFilter, $sOrder, 'ASC', 0, self::PER_PAGE);
    }

    /**
     * The total the count query gave is the number of rows: all of them when they fit on the page, more otherwise.
     */
    private function assertTotal($oGrid, array $aRows, string $sMessage): void
    {
        $mixedTotal = $this->bxGetProtected($oGrid, '_iTotalCount', BxDolGrid::class);
        $this->assertTrue(is_numeric($mixedTotal), $sMessage . ': no total, the count query failed.');
        if (in_array($this->bxGetProtected($oGrid, '_sObject', BxDolGrid::class), self::COUNT_APART, true))
            return;

        if (count($aRows) < self::PER_PAGE)
            $this->assertSame(count($aRows), (int)$mixedTotal, $sMessage);
        else
            $this->assertGreaterThanOrEqual(count($aRows), (int)$mixedTotal, $sMessage);
    }

    public function testSearchAndEverySortMakeValidSql(): void
    {
        $iChecked = 0;
        foreach (self::GRIDS as $sObject) {
            $aGrid = BxDolGridQuery::getGridObject($sObject);
            if (empty($aGrid) || !($oGrid = $this->grid($sObject)))
                continue; // the module is not installed

            $this->assertTotal($oGrid, $this->data($oGrid, ''), $sObject);

            $oGrid = $this->grid($sObject);
            $this->assertTotal($oGrid, $this->data($oGrid, 'GridSearchSqlTest'), $sObject . ', a search');

            foreach ((array)$aGrid['sorting_fields'] as $sField) {
                $oGrid = $this->grid($sObject);
                $this->assertTotal($oGrid, $this->data($oGrid, '', $sField), $sObject . ', sorted by ' . $sField);
            }

            $iChecked++;
        }

        $this->assertGreaterThan(0, $iChecked);
    }

    /**
     * A translatable field is searched in its translations without joining them to the grid's query: the grid's own
     * `key` and `id` stay its own, and a list matches once, whatever number of languages has the words.
     */
    public function testATranslatableFieldFindsItsRowOnce(): void
    {
        $oDb = BxDolDb::getInstance();
        $aList = $oDb->getRow("SELECT `l`.`id`, `l`.`key`, `s`.`String` AS `title` FROM `sys_form_pre_lists` AS `l` INNER JOIN `sys_localization_keys` AS `k` ON `k`.`Key` = `l`.`title` INNER JOIN `sys_localization_strings` AS `s` ON `s`.`IDKey` = `k`.`ID` WHERE `s`.`String` <> '' LIMIT 1");
        if (empty($aList))
            $this->markTestSkipped('No data list has a translated title.');

        $aRows = $this->data($this->grid('sys_studio_forms_pre_lists'), $aList['title']);

        $aIds = array_column($aRows, 'id');
        $this->assertContains($aList['id'], $aIds);
        $this->assertSame(count($aIds), count(array_unique($aIds)), 'A list comes once.');
        foreach ($aRows as $aRow)
            if ($aRow['id'] == $aList['id'])
                $this->assertSame($aList['key'], $aRow['key'], 'The row keeps its own key, not the language key.');
    }
}
