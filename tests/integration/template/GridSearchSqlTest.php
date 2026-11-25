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

    private function grid(string $sObject)
    {
        unset($GLOBALS['bxDolClasses']['BxDolGrid!' . $sObject]);

        return BxDolGrid::getObjectInstance($sObject);
    }

    private function data($oGrid, string $sFilter, string $sOrder = ''): array
    {
        $oMethod = new ReflectionMethod(BxDolGrid::class, '_getData');

        return (array)$oMethod->invoke($oGrid, $sFilter, $sOrder, 'ASC', 0, 50);
    }

    public function testSearchAndEverySortMakeValidSql(): void
    {
        $iChecked = 0;
        foreach (self::GRIDS as $sObject) {
            $aGrid = BxDolGridQuery::getGridObject($sObject);
            if (empty($aGrid) || !($oGrid = $this->grid($sObject)))
                continue; // the module is not installed

            $this->data($oGrid, 'GridSearchSqlTest');
            foreach ((array)$aGrid['sorting_fields'] as $sField)
                $this->data($this->grid($sObject), '', $sField);

            $this->assertIsInt((int)$this->bxGetProtected($oGrid, '_iTotalCount', BxDolGrid::class), $sObject);
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
