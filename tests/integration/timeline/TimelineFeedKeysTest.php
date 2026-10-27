<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The feed keys on bx_timeline_events, and the "My posts" grid, which keeps away from the date_id key:
 * one member's events are found and sorted, rather than read in date order through the whole table.
 */
#[Group('integration')]
class TimelineFeedKeysTest extends BxDolIntegrationTestCase
{
    protected $_aClassesBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $this->_aClassesBackup = $GLOBALS['bxDolClasses'] ?? [];
    }

    protected function tearDown(): void
    {
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (!array_key_exists($sKey, $this->_aClassesBackup))
                unset($GLOBALS['bxDolClasses'][$sKey]);

        parent::tearDown();
    }

    protected function db(): BxTimelineDb
    {
        return BxDolModule::getInstance('bx_timeline')->_oDb;
    }

    public function testMigrationIsApplied(): void
    {
        foreach (['bx_timeline_events', 'bx_timeline_events_slice'] as $sTable)
            foreach (['sticked_date_id', 'date_id', 'promoted', 'source'] as $sKey)
                $this->assertTrue($this->db()->isIndexExists($sTable, $sKey), "$sTable has KEY `$sKey` (the timeline keys migration is applied).");
    }

    public function testIgnoreIndexHintOnlyForAnExistingKey(): void
    {
        $this->assertSame('IGNORE INDEX (`date_id`)', $this->db()->getIgnoreIndexHint('bx_timeline_events', 'date_id'));
        $this->assertSame('', $this->db()->getIgnoreIndexHint('bx_timeline_events2users', 'date_id'), 'No hint where the key is missing: it would be an SQL error.');
    }

    public function testMyPostsGridKeepsAwayFromTheDateKey(): void
    {
        $this->bxLoginAsAdmin();

        unset($GLOBALS['bxDolClasses']['BxDolGrid!bx_timeline_common']);
        $oGrid = BxDolGrid::getObjectInstance('bx_timeline_common');
        $this->assertInstanceOf(BxTimelineGridCommon::class, $oGrid);

        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = $sSql; }
            public function __call($sName, $aArgs) { return null; }
        };
        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fData = Closure::bind(fn() => $this->_getDataSql('', 'date', 'DESC', 0, 21), $oGrid, BxTimelineGridCommon::class);
            $fData();
            $fData(); // the source is kept on the object: a second page must not get a second hint
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        $aList = array_values(array_filter($oRecorder->aQueries, fn($s) => stripos($s, 'FROM `bx_timeline_events`') !== false && stripos($s, '`object_owner_id`') !== false));
        $this->assertCount(2, $aList, 'The grid read the member\'s events twice.');

        foreach ($aList as $sSql) {
            $this->assertSame(1, substr_count($sSql, 'IGNORE INDEX (`date_id`)'), 'One hint on the events table.');
            foreach (BxDolDb::getInstance()->getAll('EXPLAIN ' . $sSql) as $aPlan)
                $this->assertNotSame('date_id', $aPlan['key'], 'The list is not read in date order through date_id.');
        }
    }
}
