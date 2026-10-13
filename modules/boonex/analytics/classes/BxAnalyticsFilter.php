<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * The period, timezone, platform and dimension filters of a report, read from request
 * parameters. Every report block on a page reads the same parameters, so one filter bar
 * drives them all, in the classic UI, in Studio and in NEO.
 *
 * Parameters: range (today, yesterday, 24h, 7d, 30d, 90d, 12m, custom), from and to
 * (YYYY-MM-DD, for custom), tz (IANA timezone), platform, f (dimension => value).
 */
class BxAnalyticsFilter
{
    const RANGE_DEFAULT = '7d';

    /**
     * Longest custom period, in days.
     */
    const RANGE_MAX_DAYS = 731;

    /**
     * The viewer's IANA timezone, kept by the dashboard (js/dashboard.js) for requests
     * without `tz`.
     */
    const TZ_COOKIE = 'bx_analytics_tz';

    public static $aRanges = ['today', 'yesterday', '24h', '7d', '30d', '90d', '12m', 'custom'];

    protected $_oDb;
    protected $_oConfig;
    protected $_iNow;

    protected $_aFilter;

    /**
     * @param object $oModule the Analytics module
     * @param array $aInput request parameters
     * @param int $iNow current time, for tests
     */
    public function __construct($oModule, $aInput, $iNow = null)
    {
        $this->_oDb = $oModule->_oDb;
        $this->_oConfig = $oModule->_oConfig;
        $this->_iNow = $iNow ? (int)$iNow : time();

        $this->_aFilter = $this->_parse(is_array($aInput) ? $aInput : []);
    }

    /**
     * The filter for Db report methods: from, to (exclusive), platform, dims, and for
     * series: bucket, offset, starts (exact bucket starts when fixed lengths won't do) and
     * buckets (every bucket start, to fill gaps with zeros).
     */
    public function get()
    {
        return $this->_aFilter;
    }

    /**
     * The same filter for the period of the same length just before, for comparisons.
     */
    public function getPrevious()
    {
        $aFilter = $this->_aFilter;
        $iLength = $aFilter['to'] - $aFilter['from'];
        $aFilter['to'] = $aFilter['from'];
        $aFilter['from'] -= $iLength;

        return $aFilter;
    }

    /**
     * Parameters that reproduce this filter, for links, exports and NEO requests.
     */
    public function getParams()
    {
        $a = [
            'range' => $this->_aFilter['range'],
            'tz' => $this->_aFilter['tz'],
        ];
        if($this->_aFilter['range'] == 'custom') {
            $a['from'] = $this->_aFilter['from_date'];
            $a['to'] = $this->_aFilter['to_date'];
        }
        if($this->_aFilter['platform'] !== '')
            $a['platform'] = $this->_aFilter['platform'];
        if(!empty($this->_aFilter['dims']))
            $a['f'] = $this->_aFilter['dims'];

        return $a;
    }

    protected function _parse($aInput)
    {
        $sRange = isset($aInput['range']) && in_array($aInput['range'], self::$aRanges, true) ? $aInput['range'] : self::RANGE_DEFAULT;

        // with the backward-compatible names (Asia/Calcutta, Europe/Kiev), which Intl still
        // reports on some runtimes; without one in the request, the viewer's own from the
        // dashboard's cookie, so a page opened from a menu isn't drawn in UTC and then again
        $aZones = timezone_identifiers_list(DateTimeZone::ALL_WITH_BC);
        $sTz = 'UTC';
        if(isset($aInput['tz']) && is_string($aInput['tz']) && in_array($aInput['tz'], $aZones, true))
            $sTz = $aInput['tz'];
        elseif(!isset($aInput['tz']) && isset($_COOKIE[self::TZ_COOKIE]) && is_string($_COOKIE[self::TZ_COOKIE]) && in_array($_COOKIE[self::TZ_COOKIE], $aZones, true))
            $sTz = $_COOKIE[self::TZ_COOKIE];
        $oTz = new DateTimeZone($sTz);

        $oNow = (new DateTime('@' . $this->_iNow))->setTimezone($oTz);
        $oToday = (clone $oNow)->setTime(0, 0);
        $oTomorrow = (clone $oToday)->modify('+1 day');

        $sBucket = 'day';
        switch($sRange) {
            case 'today':
                $oFrom = $oToday;
                $oTo = $oTomorrow;
                $sBucket = 'hour';
                break;

            case 'yesterday':
                $oFrom = (clone $oToday)->modify('-1 day');
                $oTo = $oToday;
                $sBucket = 'hour';
                break;

            case '24h':
                $oTo = (clone $oNow)->setTime((int)$oNow->format('G'), 0)->modify('+1 hour');
                $oFrom = (clone $oTo)->modify('-24 hours');
                $sBucket = 'hour';
                break;

            case '30d':
                $oFrom = (clone $oToday)->modify('-29 days');
                $oTo = $oTomorrow;
                break;

            case '90d':
                $oFrom = (clone $oToday)->modify('-89 days');
                $oTo = $oTomorrow;
                $sBucket = 'week';
                break;

            case '12m':
                $oFrom = (clone $oToday)->modify('first day of this month')->modify('-11 months');
                $oTo = (clone $oToday)->modify('first day of next month');
                $sBucket = 'month';
                break;

            case 'custom':
                $oFrom = $this->_date($aInput, 'from', $oTz);
                $oTo = $this->_date($aInput, 'to', $oTz);
                if($oFrom && $oTo && $oFrom <= $oTo) {
                    $oTo = (clone $oTo)->modify('+1 day');
                    $iDays = (int)round(($oTo->getTimestamp() - $oFrom->getTimestamp()) / 86400);
                    if($iDays > self::RANGE_MAX_DAYS)
                        $oFrom = (clone $oTo)->modify('-' . self::RANGE_MAX_DAYS . ' days');

                    $sBucket = $iDays <= 2 ? 'hour' : ($iDays <= 62 ? 'day' : ($iDays <= 180 ? 'week' : 'month'));
                    break;
                }
                $sRange = self::RANGE_DEFAULT;
                // invalid dates: the default period

            case '7d':
            default:
                $oFrom = (clone $oToday)->modify('-6 days');
                $oTo = $oTomorrow;
                break;
        }

        // the bucket may be overridden to anything that keeps the chart readable
        if(isset($aInput['bucket']) && in_array($aInput['bucket'], ['hour', 'day', 'week', 'month'], true)) {
            $iHours = ($oTo->getTimestamp() - $oFrom->getTimestamp()) / 3600;
            $aMaxHours = ['hour' => 24 * 7, 'day' => 24 * 190, 'week' => 24 * 740, 'month' => PHP_INT_MAX];
            if($iHours <= $aMaxHours[$aInput['bucket']])
                $sBucket = $aInput['bucket'];
        }

        $sPlatform = isset($aInput['platform']) && $this->_oConfig->isPlatform($aInput['platform']) ? $aInput['platform'] : '';

        $aDims = [];
        if(isset($aInput['f']) && is_array($aInput['f']))
            foreach($aInput['f'] as $sName => $sValue)
                if(is_string($sName) && is_string($sValue) && $this->_oDb->isDimension($sName) && $sName != 'platform')
                    $aDims[$sName] = get_mb_substr($sValue, 0, 255);

        $iFrom = $oFrom->getTimestamp();
        $iTo = $oTo->getTimestamp();
        $iOffset = $oFrom->getOffset();

        // fixed-length buckets drift by an hour across a daylight saving change; then the exact
        // local starts go to the database as a list, as months always do
        $aStarts = [];
        if($sBucket == 'month')
            $aStarts = $this->_months($oFrom, $oTo);
        elseif(in_array($sBucket, ['day', 'week'], true) && $oFrom->getOffset() != (clone $oTo)->modify('-1 second')->getOffset())
            $aStarts = $this->_localStarts($oFrom, $oTo, $sBucket);

        return [
            'range' => $sRange,
            'tz' => $sTz,
            'from' => $iFrom,
            'to' => $iTo,
            'from_date' => $oFrom->format('Y-m-d'),
            'to_date' => (clone $oTo)->modify('-1 second')->format('Y-m-d'),
            'now' => $this->_iNow,
            'platform' => $sPlatform,
            'dims' => $aDims,
            'bucket' => $sBucket,
            'offset' => $iOffset,
            'starts' => $aStarts,
            'buckets' => !empty($aStarts) ? $aStarts : $this->_buckets($iFrom, $iTo, $sBucket, $iOffset),
        ];
    }

    /**
     * Every bucket start in the period, computed the way BxAnalyticsDb buckets rows.
     */
    protected function _buckets($iFrom, $iTo, $sBucket, $iOffset)
    {
        $aSizes = ['hour' => 3600, 'day' => 86400, 'week' => 604800];
        $iSize = $aSizes[$sBucket];
        $iShift = $sBucket == 'week' ? 345600 : 0;

        $iStart = (int)(floor(($iFrom + $iOffset - $iShift) / $iSize) * $iSize + $iShift - $iOffset);

        $aResult = [];
        for($i = $iStart; $i < $iTo && count($aResult) < 2000; $i += $iSize)
            $aResult[] = $i;

        return $aResult;
    }

    protected function _months($oFrom, $oTo)
    {
        $aResult = [];
        $oMonth = (clone $oFrom)->modify('first day of this month')->setTime(0, 0);
        while($oMonth < $oTo && count($aResult) < 100) {
            $aResult[] = $oMonth->getTimestamp();
            $oMonth->modify('first day of next month');
        }

        return $aResult;
    }

    /**
     * Local midnights of every day, or of every Monday, in the period.
     */
    protected function _localStarts($oFrom, $oTo, $sBucket)
    {
        $oStart = (clone $oFrom)->setTime(0, 0);
        if($sBucket == 'week')
            $oStart->modify('-' . ((int)$oStart->format('N') - 1) . ' days');

        $sStep = $sBucket == 'week' ? '+1 week' : '+1 day';

        $aResult = [];
        while($oStart < $oTo && count($aResult) < 800) {
            $aResult[] = $oStart->getTimestamp();
            $oStart->modify($sStep)->setTime(0, 0);
        }

        return $aResult;
    }

    protected function _date($aInput, $sKey, $oTz)
    {
        if(!isset($aInput[$sKey]) || !is_string($aInput[$sKey]) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $aInput[$sKey]))
            return null;

        $oDate = DateTime::createFromFormat('!Y-m-d', $aInput[$sKey], $oTz);

        return $oDate ? $oDate : null;
    }
}

/** @} */
