<?php

/**
 * Report periods, buckets and filters from request parameters. Uses stand-ins for the
 * module's config and database, so the module doesn't have to be installed.
 */
class BxAnalyticsFilterTest extends \PHPUnit\Framework\TestCase
{
    // 2026-10-13 05:30:00 UTC, a Tuesday; 16:30 in Sydney (UTC+11)
    const NOW = 1791869400;

    protected $_oModule;

    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsFilter.php';
    }

    protected function setUp(): void
    {
        $this->_oModule = new stdClass();
        $this->_oModule->_oConfig = new class {
            public function isPlatform($s) { return in_array($s, ['core-web', 'next-web', 'rn-ios', 'rn-android', 'api', 'core'], true); }
        };
        $this->_oModule->_oDb = new class {
            public function isDimension($s) { return in_array($s, ['country', 'path', 'platform', 'referrer_host'], true); }
        };
    }

    protected function filter($aInput)
    {
        return new BxAnalyticsFilter($this->_oModule, $aInput, self::NOW);
    }

    public function testDefaultIsLastSevenDaysInUtc()
    {
        $a = $this->filter([])->get();

        $this->assertSame('7d', $a['range']);
        $this->assertSame('UTC', $a['tz']);
        $this->assertSame(gmmktime(0, 0, 0, 10, 7, 2026), $a['from']);
        $this->assertSame(gmmktime(0, 0, 0, 10, 14, 2026), $a['to']);
        $this->assertSame('day', $a['bucket']);
        $this->assertCount(7, $a['buckets']);
        $this->assertSame($a['from'], $a['buckets'][0]);
    }

    public function testTodayInATimezone()
    {
        $a = $this->filter(['range' => 'today', 'tz' => 'Australia/Sydney'])->get();

        // midnight in Sydney on 2026-10-13 is 13:00 UTC the day before
        $this->assertSame(gmmktime(13, 0, 0, 10, 12, 2026), $a['from']);
        $this->assertSame(86400, $a['to'] - $a['from']);
        $this->assertSame('hour', $a['bucket']);
        $this->assertCount(24, $a['buckets']);
        $this->assertSame(39600, $a['offset']);
    }

    public function testTwelveMonthsUseCalendarMonths()
    {
        $a = $this->filter(['range' => '12m'])->get();

        $this->assertSame('month', $a['bucket']);
        $this->assertCount(12, $a['starts']);
        $this->assertSame(gmmktime(0, 0, 0, 11, 1, 2025), $a['starts'][0]);
        $this->assertSame(gmmktime(0, 0, 0, 10, 1, 2026), $a['starts'][11]);
        $this->assertSame($a['starts'], $a['buckets']);
        $this->assertSame(gmmktime(0, 0, 0, 11, 1, 2026), $a['to']);
    }

    public function testCustomRange()
    {
        $a = $this->filter(['range' => 'custom', 'from' => '2026-09-01', 'to' => '2026-09-30'])->get();

        $this->assertSame(gmmktime(0, 0, 0, 9, 1, 2026), $a['from']);
        $this->assertSame(gmmktime(0, 0, 0, 10, 1, 2026), $a['to']);
        $this->assertSame('day', $a['bucket']);
        $this->assertSame(['range' => 'custom', 'tz' => 'UTC', 'from' => '2026-09-01', 'to' => '2026-09-30'], $this->filter(['range' => 'custom', 'from' => '2026-09-01', 'to' => '2026-09-30'])->getParams());
    }

    public function testInvalidInputFallsBack()
    {
        $a = $this->filter(['range' => 'custom', 'from' => '2026-09-30', 'to' => '2026-09-01', 'tz' => 'Mars/Olympus', 'platform' => 'windows-phone'])->get();

        $this->assertSame('7d', $a['range'], 'reversed dates');
        $this->assertSame('UTC', $a['tz']);
        $this->assertSame('', $a['platform']);
    }

    public function testDimensionFiltersAreWhitelisted()
    {
        $a = $this->filter(['platform' => 'rn-ios', 'f' => [
            'country' => 'DE',
            'path' => '/page/explore',
            'password' => 'x',
            'platform' => 'core-web',
            'referrer_host' => ['not', 'a', 'string'],
        ]])->get();

        $this->assertSame('rn-ios', $a['platform']);
        $this->assertSame(['country' => 'DE', 'path' => '/page/explore'], $a['dims'], 'unknown dimensions, arrays and a second platform are dropped');
    }

    public function testPreviousPeriod()
    {
        $oFilter = $this->filter(['range' => '30d']);
        $a = $oFilter->get();
        $aPrevious = $oFilter->getPrevious();

        $this->assertSame($a['from'], $aPrevious['to']);
        $this->assertSame($a['to'] - $a['from'], $aPrevious['to'] - $aPrevious['from']);
    }

    public function testDaysAcrossDaylightSavingStartAtLocalMidnight()
    {
        // Sydney moved from UTC+10 to UTC+11 on 2026-10-04
        $a = $this->filter(['range' => '30d', 'tz' => 'Australia/Sydney'])->get();

        $this->assertCount(30, $a['starts']);
        $oTz = new DateTimeZone('Australia/Sydney');
        foreach($a['starts'] as $iStart)
            $this->assertSame('00:00', (new DateTime('@' . $iStart))->setTimezone($oTz)->format('H:i'));
        $this->assertSame($a['starts'], $a['buckets']);
    }

    public function testNoDaylightSavingChangeUsesFixedDays()
    {
        $a = $this->filter(['range' => '7d', 'tz' => 'Asia/Tokyo'])->get();

        $this->assertSame([], $a['starts']);
        $this->assertCount(7, $a['buckets']);
    }

    public function testWeekBucketsStartOnMonday()
    {
        $a = $this->filter(['range' => '90d'])->get();

        $this->assertSame('week', $a['bucket']);
        foreach($a['buckets'] as $iStart)
            $this->assertSame('1', gmdate('N', $iStart));
    }
}
