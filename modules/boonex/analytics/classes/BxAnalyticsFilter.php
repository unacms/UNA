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

    /**
     * Timezone names browsers still report (Chrome and Hermes say Asia/Calcutta for India) and the names they have
     * today. A server's timezone database may come without the old names (Debian and Ubuntu moved them to a package
     * of their own, tzdata-legacy), and then PHP knows only the new one.
     */
    const TZ_RENAMED = [
        'Asia/Calcutta' => 'Asia/Kolkata',
        'Asia/Saigon' => 'Asia/Ho_Chi_Minh',
        'Asia/Katmandu' => 'Asia/Kathmandu',
        'Asia/Rangoon' => 'Asia/Yangon',
        'Asia/Dacca' => 'Asia/Dhaka',
        'Asia/Thimbu' => 'Asia/Thimphu',
        'Asia/Ulan_Bator' => 'Asia/Ulaanbaatar',
        'Asia/Macao' => 'Asia/Macau',
        'Asia/Ujung_Pandang' => 'Asia/Makassar',
        'Europe/Kiev' => 'Europe/Kyiv',
        'Atlantic/Faeroe' => 'Atlantic/Faroe',
        'America/Buenos_Aires' => 'America/Argentina/Buenos_Aires',
        'America/Godthab' => 'America/Nuuk',
        'America/Indianapolis' => 'America/Indiana/Indianapolis',
        'America/Louisville' => 'America/Kentucky/Louisville',
        'Pacific/Ponape' => 'Pacific/Pohnpei',
        'Pacific/Truk' => 'Pacific/Chuuk',
    ];

    public static $aRanges = ['today', 'yesterday', '24h', '7d', '30d', '90d', '12m', 'custom'];

    protected $_oDb;
    protected $_oConfig;
    protected $_iNow;

    protected $_aFilter;

    /**
     * Start of the previous period, a calendar step back in the filter's timezone.
     */
    protected $_iPreviousFrom;

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
     * The same filter for the period just before, for comparisons: as many local days (or
     * calendar months, or hours for 24h) as this one, so a daylight saving change or a leap
     * year doesn't shift it by an hour or a day.
     */
    public function getPrevious()
    {
        $aFilter = $this->_aFilter;
        $aFilter['to'] = $aFilter['from'];
        $aFilter['from'] = $this->_iPreviousFrom;

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

    /**
     * The timezone of a name a client sent: the name as it is, or today's name of a renamed zone when the server's
     * database has only that one (TZ_RENAMED), or the old name when it has only that one. Null for anything else.
     * @param mixed $mixedName an IANA timezone name
     * @return DateTimeZone|null
     */
    public static function getTimeZone($mixedName)
    {
        if(!is_string($mixedName) || $mixedName === '' || !preg_match('/^[A-Za-z0-9_+\-\/]{1,64}$/', $mixedName)) {
            return null;
        }

        $aNames = [$mixedName];
        if(isset(self::TZ_RENAMED[$mixedName])) {
            $aNames[] = self::TZ_RENAMED[$mixedName];
        }
        elseif(($sOld = array_search($mixedName, self::TZ_RENAMED, true)) !== false) {
            $aNames[] = $sOld;
        }

        $aKnown = timezone_identifiers_list(DateTimeZone::ALL_WITH_BC);
        foreach($aNames as $sName) {
            if(in_array($sName, $aKnown, true)) {
                return new DateTimeZone($sName);
            }
        }

        return null;
    }

    protected function _parse($aInput)
    {
        $sRange = isset($aInput['range']) && in_array($aInput['range'], self::$aRanges, true) ? $aInput['range'] : self::RANGE_DEFAULT;

        // with the backward-compatible names (Asia/Calcutta, Europe/Kiev), which Intl still
        // reports on some runtimes; without one in the request, the viewer's own from the
        // dashboard's cookie, so a page opened from a menu isn't drawn in UTC and then again
        // The name stays the client's own; the zone is the one the server has for it (getTimeZone).
        $sTz = 'UTC';
        $oTz = null;
        if(isset($aInput['tz'])) {
            $oTz = self::getTimeZone($aInput['tz']);
            if($oTz) {
                $sTz = $aInput['tz'];
            }
        }
        elseif(isset($_COOKIE[self::TZ_COOKIE])) {
            $oTz = self::getTimeZone($_COOKIE[self::TZ_COOKIE]);
            if($oTz) {
                $sTz = $_COOKIE[self::TZ_COOKIE];
            }
        }
        if(!$oTz) {
            $oTz = new DateTimeZone('UTC');
        }

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

        $aBack = ['today' => '-1 day', 'yesterday' => '-1 day', '24h' => '-24 hours', '7d' => '-7 days', '30d' => '-30 days', '90d' => '-90 days', '12m' => '-12 months'];
        $sBack = isset($aBack[$sRange]) ? $aBack[$sRange] : '-' . (int)round(($oTo->getTimestamp() - $oFrom->getTimestamp()) / 86400) . ' days';
        $this->_iPreviousFrom = (clone $oFrom)->modify($sBack)->getTimestamp();

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

        // fixed-length buckets drift by an hour across a daylight saving change inside the period
        // (two changes leave the ends at the same offset); then the exact local starts go to the
        // database as a list, as months always do. getTransitions() gives the state at the
        // start, then one entry per change.
        $aStarts = [];
        if($sBucket == 'month')
            $aStarts = $this->_months($oFrom, $oTo);
        elseif(in_array($sBucket, ['day', 'week'], true) && count($oTz->getTransitions($iFrom, $iTo - 1)) > 1)
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
