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
 * Web vitals and app timings: which metrics there are, what a client may send, and the 75th
 * percentile from a log-scale histogram the database builds with GROUP BY (no window
 * functions, so it runs on every MySQL and MariaDB UNA supports).
 *
 * Timings are milliseconds. CLS is a unitless score; it is stored in thousandths.
 */
class BxAnalyticsVitals
{
    /**
     * Every metric, in the order reports show them. LCP, INP, CLS, FCP and TTFB are web vitals
     * of a page load; screen_load is a navigation inside a running app or a soft navigation
     * on the web; app_start is a native app's cold start.
     */
    const METRICS = ['lcp', 'inp', 'cls', 'fcp', 'ttfb', 'screen_load', 'app_start'];

    const WEB_METRICS = ['lcp', 'inp', 'cls', 'fcp', 'ttfb', 'screen_load'];
    const APP_METRICS = ['screen_load', 'app_start'];

    /**
     * How the page was reached: the Navigation Timing type, `soft` for a navigation inside a
     * single-page app or an htmx swap, `restore` for the back-forward cache.
     */
    const NAVS = ['navigate', 'reload', 'back_forward', 'prerender', 'soft', 'restore'];

    const MAX_MS = 120000;
    const MAX_CLS = 10;

    /**
     * Histogram buckets per e-fold: 20 makes a bucket 5% wide, so the interpolated
     * percentile is within a bucket of the exact one, and usually within 2.5%.
     */
    const BUCKETS = 20;

    /**
     * A sent value as stored, or null when it is not a number in range: whole milliseconds
     * up to 2 minutes, CLS from 0 to 10 in thousandths.
     */
    public static function getValue($sMetric, $mixedValue)
    {
        if(!in_array($sMetric, self::METRICS, true) || is_bool($mixedValue) || !is_numeric($mixedValue))
            return null;

        $fValue = (float)$mixedValue;
        if(!is_finite($fValue) || $fValue < 0)
            return null;

        if($sMetric == 'cls')
            return $fValue <= self::MAX_CLS ? (int)round($fValue * 1000) : null;

        return $fValue <= self::MAX_MS ? (int)round($fValue) : null;
    }

    /**
     * A stored value in the metric's own unit: CLS back from thousandths.
     */
    public static function toDisplay($sMetric, $mixedValue)
    {
        if($mixedValue === null)
            return null;

        return $sMetric == 'cls' ? round($mixedValue / 1000, 3) : (int)round($mixedValue);
    }

    /**
     * The format a metric's values are shown in: ms or cls.
     */
    public static function getUnit($sMetric)
    {
        return $sMetric == 'cls' ? 'cls' : 'ms';
    }

    /**
     * The histogram bucket of a stored value: -1 for exactly 0, else floor(ln(v) * 20). The
     * SQL in BxAnalyticsDb::_getVitalsBucketSql is the same expression.
     */
    public static function getBucket($iValue)
    {
        return $iValue <= 0 ? -1 : (int)floor(log($iValue) * self::BUCKETS);
    }

    /**
     * A percentile from histogram counts, interpolated geometrically inside the bucket it
     * falls in (at the middle of the ranked sample's share of the bucket); null with fewer
     * samples than `$iMinSamples`.
     *
     * A bucket can't tell where its values sit, so with the exact counts on each side of the
     * thresholds the estimate is kept on the side the exact percentile is on: a page whose
     * values are all 2500 ms has an LCP p75 of 2500, which is good, not 2534.
     *
     * @param array $aHistogram bucket => count
     * @param float $fPercentile 0.75 for p75
     * @param array $aSides counts of values up to the good threshold, between the two, and
     *      above the poor threshold, or [] when unknown
     * @param array $aThresholds [good up to, poor above], with `$aSides`
     */
    public static function getPercentile($aHistogram, $fPercentile = 0.75, $iMinSamples = 20, $aSides = [], $aThresholds = [])
    {
        $mixedValue = self::_getPercentile($aHistogram, $fPercentile, $iMinSamples);
        if($mixedValue === null || count($aSides) != 3 || count($aThresholds) != 2)
            return $mixedValue;

        $fRank = $fPercentile * array_sum($aSides);
        if($aSides[0] >= $fRank)
            return min($mixedValue, (float)$aThresholds[0]);

        if($aSides[0] + $aSides[1] >= $fRank)
            return min(max($mixedValue, (float)$aThresholds[0] + 1), (float)$aThresholds[1]);

        return max($mixedValue, (float)$aThresholds[1] + 1);
    }

    protected static function _getPercentile($aHistogram, $fPercentile, $iMinSamples)
    {
        $iTotal = 0;
        foreach($aHistogram as $iCount)
            $iTotal += (int)$iCount;
        if(!$iTotal || $iTotal < $iMinSamples)
            return null;

        ksort($aHistogram, SORT_NUMERIC);

        $fRank = $fPercentile * $iTotal;
        $iBefore = 0;
        foreach($aHistogram as $iBucket => $iCount) {
            $iCount = (int)$iCount;
            if(!$iCount)
                continue;

            if($iBefore + $iCount >= $fRank) {
                if((int)$iBucket < 0)
                    return 0.0;

                $fShare = min(1, max(0, ($fRank - $iBefore - 0.5) / $iCount));
                return exp(((int)$iBucket + $fShare) / self::BUCKETS);
            }

            $iBefore += $iCount;
        }

        // rounding left the rank past the last bucket
        end($aHistogram);
        $iLast = (int)key($aHistogram);

        return $iLast < 0 ? 0.0 : exp(($iLast + 1) / self::BUCKETS);
    }

    /**
     * good, needs_improvement or poor for a stored value.
     *
     * @param array $aThresholds [good up to, poor above]
     */
    public static function getRating($mixedValue, $aThresholds)
    {
        if($mixedValue === null)
            return '';

        if($mixedValue <= $aThresholds[0])
            return 'good';

        return $mixedValue > $aThresholds[1] ? 'poor' : 'needs_improvement';
    }
}

/** @} */
