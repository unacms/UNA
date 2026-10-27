<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * The Bots and agents chart against bot rows, which are stored per UTC day. A period in a
 * timezone east or west of UTC touches one more UTC day than it has local days, and the
 * chart must have exactly the UTC days the table reads, today's included.
 * Rows are dated 2001, far from real traffic, and deleted afterwards.
 */
class AnalyticsBotsChartTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 05:30 UTC: 15:30 in Sydney (UTC+10), 22:30 on 2001-09-08 in Los Angeles (UTC-7)
    const NOW_SEPTEMBER = 1000013400;

    // 2001-10-30 05:30 UTC: 16:30 in Sydney (UTC+11 since 2001-10-28), 21:30 on 2001-10-29
    // in Los Angeles (UTC-8 since 2001-10-28); the week before crosses both changes
    const NOW_OCTOBER = 1004419800;

    // hits on the UTC day of "now", told apart from the 1 hit of every other day
    const TODAY_HITS = 7;

    protected $_oModule;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getFilter([]); // loads the filter class

        $this->_cleanup();
    }

    protected function tearDown(): void
    {
        if ($this->_oModule)
            $this->_cleanup();

        parent::tearDown();
    }

    public static function periods()
    {
        return [
            'UTC, a week' => ['UTC', self::NOW_SEPTEMBER, '7d', '2001-09-03', '2001-09-09', 7],
            'Sydney +10, a week' => ['Australia/Sydney', self::NOW_SEPTEMBER, '7d', '2001-09-02', '2001-09-09', 8],
            'Sydney +10, today' => ['Australia/Sydney', self::NOW_SEPTEMBER, 'today', '2001-09-08', '2001-09-09', 2],
            'Sydney +10 to +11, a week' => ['Australia/Sydney', self::NOW_OCTOBER, '7d', '2001-10-23', '2001-10-30', 8],
            'Los Angeles -7, a week' => ['America/Los_Angeles', self::NOW_SEPTEMBER, '7d', '2001-09-02', '2001-09-09', 8],
            'Los Angeles -7, today' => ['America/Los_Angeles', self::NOW_SEPTEMBER, 'today', '2001-09-08', '2001-09-09', 2],
            'Los Angeles -7 to -8, a week' => ['America/Los_Angeles', self::NOW_OCTOBER, '7d', '2001-10-23', '2001-10-30', 8],
        ];
    }

    #[DataProvider('periods')]
    public function testChartHasTheUtcDaysOfThePeriod($sTz, $iNow, $sRange, $sFirst, $sLast, $iDays)
    {
        $this->_addHits($iNow);

        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => $sRange, 'tz' => $sTz], $iNow);
        $aReport = $this->_oModule->getReports()->getBots($oFilter, []);
        $aChart = $aReport['chart'];

        $aLabels = array_map(function ($i) { return gmdate('Y-m-d H:i:s', $i); }, $aChart['labels']);
        $this->assertSame('UTC', $aChart['tz'], 'labels are UTC days, as the rows are');
        $this->assertCount($iDays, $aLabels);
        $this->assertSame($sFirst . ' 00:00:00', $aLabels[0]);
        $this->assertSame($sLast . ' 00:00:00', end($aLabels));
        $this->assertSame(array_values(array_unique($aLabels)), $aLabels, 'one bar per day');

        $this->assertCount(1, $aChart['datasets']);
        $aValues = $aChart['datasets'][0]['values'];
        $this->assertCount($iDays, $aValues);
        $this->assertSame(self::TODAY_HITS, end($aValues), "today's hits are the last bar");

        // the chart and the table read the same days
        $iTotal = (int)$this->_oModule->_oDb->getBotTotals($oFilter->get())['hits'];
        $this->assertSame($iTotal, array_sum($aValues));
        $this->assertSame($iTotal, array_sum(array_column(array_column($aReport['bots']['rows'], 'values'), 'hits')));
        $this->assertSame($iDays - 1 + self::TODAY_HITS, $iTotal, 'a hit on every other day of the chart, none outside it');
    }

    /**
     * A hit on each UTC day from 10 days before "now" to 2 days after, and more on the day of "now".
     */
    protected function _addHits($iNow)
    {
        $oDb = $this->_oModule->_oDb;
        $sToday = gmdate('Y-m-d', $iNow);
        for ($i = -10; $i <= 2; $i++) {
            $sDay = gmdate('Y-m-d', $iNow + $i * 86400);
            for ($j = $sDay == $sToday ? self::TODAY_HITS : 1; $j > 0; $j--)
                $this->assertTrue($oDb->addBotHit($sDay, 'Googlebot', 'search', 'core-web', '/', $iNow + $i * 86400));
        }
    }

    protected function _cleanup()
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("DELETE FROM `bx_analytics_bots` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_bot_pages` WHERE `day` < '2002-01-01'");
    }
}
