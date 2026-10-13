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

    public function testLegacyTimezoneNameIsAccepted()
    {
        // Chrome and Hermes report India as Asia/Calcutta, a backward-compatible name
        $a = $this->filter(['range' => 'today', 'tz' => 'Asia/Calcutta'])->get();

        $this->assertSame('Asia/Calcutta', $a['tz']);
        $this->assertSame(19800, $a['offset']);
        $this->assertSame(gmmktime(18, 30, 0, 10, 12, 2026), $a['from']);
    }

    public function testTimezoneFromTheDashboardCookie()
    {
        $aCookie = $_COOKIE;
        try {
            // a page opened from a menu has no tz: the viewer's zone, as the dashboard keeps it
            $_COOKIE[BxAnalyticsFilter::TZ_COOKIE] = 'Australia/Sydney';
            $this->assertSame('Australia/Sydney', $this->filter(['range' => 'today'])->get()['tz']);
            $this->assertSame('Europe/Paris', $this->filter(['range' => 'today', 'tz' => 'Europe/Paris'])->get()['tz'], 'the request\'s own wins');

            $_COOKIE[BxAnalyticsFilter::TZ_COOKIE] = 'Mars/Olympus';
            $this->assertSame('UTC', $this->filter(['range' => 'today'])->get()['tz'], 'not a zone');
        }
        finally {
            $_COOKIE = $aCookie;
        }
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

    public function testPreviousPeriodAcrossDaylightSavingIsCalendarDays()
    {
        // 2026-10-25 12:00 UTC: Europe/London fell back from BST to GMT at 01:00 UTC, so
        // today is 25 hours long
        $iNow = gmmktime(12, 0, 0, 10, 25, 2026);

        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => 'today', 'tz' => 'Europe/London'], $iNow);
        $a = $oFilter->get();
        $aPrevious = $oFilter->getPrevious();
        $this->assertSame(25 * 3600, $a['to'] - $a['from']);
        $this->assertSame($a['from'], $aPrevious['to']);
        // yesterday's local midnight, 2026-10-24 00:00 BST
        $this->assertSame(gmmktime(23, 0, 0, 10, 23, 2026), $aPrevious['from']);

        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => '7d', 'tz' => 'Europe/London'], $iNow);
        $aPrevious = $oFilter->getPrevious();
        // 2026-10-19 00:00 BST back to 2026-10-12 00:00 BST
        $this->assertSame(gmmktime(23, 0, 0, 10, 18, 2026), $aPrevious['to']);
        $this->assertSame(gmmktime(23, 0, 0, 10, 11, 2026), $aPrevious['from']);

        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => 'custom', 'from' => '2026-10-20', 'to' => '2026-10-26', 'tz' => 'Europe/London'], $iNow);
        $aPrevious = $oFilter->getPrevious();
        $this->assertSame(gmmktime(23, 0, 0, 10, 12, 2026), $aPrevious['from'], 'seven local days before 2026-10-20 00:00 BST');
    }

    public function testPreviousTwelveMonthsAcrossALeapYear()
    {
        // 12m on 2028-03-10 runs from 2027-04-01; the year before starts on 2026-04-01
        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => '12m'], gmmktime(12, 0, 0, 3, 10, 2028));
        $aPrevious = $oFilter->getPrevious();

        $this->assertSame(gmmktime(0, 0, 0, 4, 1, 2027), $aPrevious['to']);
        $this->assertSame(gmmktime(0, 0, 0, 4, 1, 2026), $aPrevious['from']);
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

    public function testTwoDaylightSavingChangesStartAtLocalMidnight()
    {
        // London is on GMT at both ends of the 12 months, on BST in between
        $oTz = new DateTimeZone('Europe/London');
        $a = $this->filter(['range' => '12m', 'bucket' => 'week', 'tz' => 'Europe/London'])->get();

        $this->assertSame('week', $a['bucket']);
        $this->assertNotEmpty($a['starts']);
        $this->assertSame($a['starts'], $a['buckets']);
        foreach(array_slice($a['starts'], 1) as $iStart)
            $this->assertSame('1 00:00', (new DateTime('@' . $iStart))->setTimezone($oTz)->format('N H:i'));

        // about 5 and a half months from autumn to spring: weeks by default, or days
        foreach([[], ['bucket' => 'day']] as $aBucket) {
            $a = $this->filter(['range' => 'custom', 'from' => '2025-10-20', 'to' => '2026-04-10', 'tz' => 'Europe/London'] + $aBucket)->get();
            $this->assertSame(empty($aBucket) ? 'week' : 'day', $a['bucket']);
            $this->assertNotEmpty($a['starts']);
            foreach($a['starts'] as $iStart)
                $this->assertSame('00:00', (new DateTime('@' . $iStart))->setTimezone($oTz)->format('H:i'));
        }
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
