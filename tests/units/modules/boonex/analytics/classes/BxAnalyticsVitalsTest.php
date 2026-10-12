<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Web vitals: what a client may send, ratings, and the 75th percentile from the log-scale
 * histogram the database builds instead of sorting every value.
 */
class BxAnalyticsVitalsTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsVitals.php';
    }

    public static function providerSets()
    {
        mt_srand(42);

        $aUniform = [];
        for ($i = 0; $i < 2000; $i++)
            $aUniform[] = mt_rand(100, 5000);

        // lognormal around 2 s, the usual shape of page timings
        $aLognormal = [];
        for ($i = 0; $i < 5000; $i++) {
            $fNormal = sqrt(-2 * log(mt_rand(1, mt_getrandmax()) / mt_getrandmax())) * cos(2 * M_PI * mt_rand() / mt_getrandmax());
            $aLognormal[] = (int)round(exp(log(2000) + 0.6 * $fNormal));
        }

        // CLS in thousandths: most pages don't shift at all
        $aCls = [];
        for ($i = 0; $i < 1000; $i++)
            $aCls[] = $i % 10 < 6 ? 0 : mt_rand(1, 400);

        $aZeros = array_merge(array_fill(0, 90, 0), range(1, 10));

        return [
            'uniform' => [$aUniform],
            'lognormal' => [$aLognormal],
            'cls with many zeros' => [$aCls],
            'mostly zeros' => [$aZeros],
        ];
    }

    #[DataProvider('providerSets')]
    public function testPercentileFromHistogram($aValues)
    {
        $aHistogram = [];
        foreach ($aValues as $iValue) {
            $iBucket = BxAnalyticsVitals::getBucket($iValue);
            $aHistogram[$iBucket] = (isset($aHistogram[$iBucket]) ? $aHistogram[$iBucket] : 0) + 1;
        }

        sort($aValues);
        $iExact = $aValues[(int)ceil(0.75 * count($aValues)) - 1];
        $fEstimate = BxAnalyticsVitals::getPercentile($aHistogram);

        if ($iExact == 0)
            $this->assertSame(0.0, $fEstimate);
        else
            $this->assertEqualsWithDelta($iExact, $fEstimate, 0.03 * $iExact, 'within 3% of the exact value');
    }

    public function testBuckets()
    {
        $this->assertSame(-1, BxAnalyticsVitals::getBucket(0), 'zero has a bucket of its own');
        $this->assertSame(0, BxAnalyticsVitals::getBucket(1));
        $this->assertSame((int)floor(log(2500) * 20), BxAnalyticsVitals::getBucket(2500));
        $this->assertLessThan(exp((BxAnalyticsVitals::getBucket(2500) + 1) / 20), 2500);
        $this->assertGreaterThanOrEqual(exp(BxAnalyticsVitals::getBucket(2500) / 20), 2500);
    }

    public function testPercentileEdges()
    {
        $this->assertNull(BxAnalyticsVitals::getPercentile([]), 'nothing measured');
        $this->assertNull(BxAnalyticsVitals::getPercentile([150 => 19]), 'fewer than 20 samples');
        $this->assertNotNull(BxAnalyticsVitals::getPercentile([150 => 19], 0.75, 5));
        $this->assertSame(0.0, BxAnalyticsVitals::getPercentile([-1 => 30]));

        // all in one bucket: the estimate stays inside it
        $fValue = BxAnalyticsVitals::getPercentile([150 => 40]);
        $this->assertGreaterThanOrEqual(exp(150 / 20), $fValue);
        $this->assertLessThanOrEqual(exp(151 / 20), $fValue);
    }

    public function testPercentileKeepsToTheThresholds()
    {
        // every LCP at the good line: the bucket alone says 2534, the counts say good
        $aHistogram = [BxAnalyticsVitals::getBucket(2500) => 40];
        $this->assertGreaterThan(2500, BxAnalyticsVitals::getPercentile($aHistogram));
        $this->assertSame(2500.0, BxAnalyticsVitals::getPercentile($aHistogram, 0.75, 20, [40, 0, 0], [2500, 4000]));
        $this->assertSame('good', BxAnalyticsVitals::getRating(round(BxAnalyticsVitals::getPercentile([BxAnalyticsVitals::getBucket(800) => 30], 0.75, 20, [30, 0, 0], [800, 1800])), [800, 1800]), 'TTFB at the line');

        // just over the line: needs improvement however the bucket rounds
        $aHistogram = [BxAnalyticsVitals::getBucket(1800) => 28, BxAnalyticsVitals::getBucket(2501) => 12];
        $this->assertLessThan(2500, BxAnalyticsVitals::getPercentile($aHistogram), 'the 30th value is early in a bucket that starts below the line');
        $this->assertSame(2501.0, BxAnalyticsVitals::getPercentile($aHistogram, 0.75, 20, [28, 12, 0], [2500, 4000]));
        $this->assertSame(4001.0, BxAnalyticsVitals::getPercentile([BxAnalyticsVitals::getBucket(3990) => 40], 0.75, 20, [0, 5, 35], [2500, 4000]));

        // away from the lines the estimate is left alone
        $fValue = BxAnalyticsVitals::getPercentile([BxAnalyticsVitals::getBucket(1000) => 40]);
        $this->assertSame($fValue, BxAnalyticsVitals::getPercentile([BxAnalyticsVitals::getBucket(1000) => 40], 0.75, 20, [40, 0, 0], [2500, 4000]));
    }

    public static function providerRatings()
    {
        return [
            'lcp good at the line' => [2500, [2500, 4000], 'good'],
            'lcp just over' => [2501, [2500, 4000], 'needs_improvement'],
            'lcp poor line is not poor' => [4000, [2500, 4000], 'needs_improvement'],
            'lcp poor' => [4001, [2500, 4000], 'poor'],
            'cls zero' => [0, [100, 250], 'good'],
            'nothing' => [null, [100, 250], ''],
        ];
    }

    #[DataProvider('providerRatings')]
    public function testRating($mixedValue, $aThresholds, $sExpected)
    {
        $this->assertSame($sExpected, BxAnalyticsVitals::getRating($mixedValue, $aThresholds));
    }

    public function testValues()
    {
        $this->assertSame(1234, BxAnalyticsVitals::getValue('lcp', 1234.4));
        $this->assertSame(0, BxAnalyticsVitals::getValue('inp', 0));
        $this->assertSame(120000, BxAnalyticsVitals::getValue('ttfb', 120000));
        $this->assertNull(BxAnalyticsVitals::getValue('ttfb', 120001), 'two minutes at most');
        $this->assertNull(BxAnalyticsVitals::getValue('fcp', -1));
        $this->assertNull(BxAnalyticsVitals::getValue('fcp', 'fast'));
        $this->assertNull(BxAnalyticsVitals::getValue('fcp', true));
        $this->assertNull(BxAnalyticsVitals::getValue('fcp', INF));
        $this->assertNull(BxAnalyticsVitals::getValue('speed_index', 100), 'unknown metric');

        $this->assertSame(105, BxAnalyticsVitals::getValue('cls', 0.1049), 'CLS is stored in thousandths');
        $this->assertSame(10000, BxAnalyticsVitals::getValue('cls', 10));
        $this->assertNull(BxAnalyticsVitals::getValue('cls', 10.5));
        $this->assertSame(0.105, BxAnalyticsVitals::toDisplay('cls', 105));
        $this->assertSame(2400, BxAnalyticsVitals::toDisplay('lcp', 2400.4));
        $this->assertSame('cls', BxAnalyticsVitals::getUnit('cls'));
        $this->assertSame('ms', BxAnalyticsVitals::getUnit('screen_load'));
    }
}
