<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * The revenue ledger's arithmetic: MRR per period unit, conversion to the default currency
 * from an order's rate snapshot, sale, renewal or trial, period lengths, trial registrations
 * and the first item of an order.
 */
class BxAnalyticsRevenueTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsConfig.php';
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsRequest.php';
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsRevenue.php';
    }

    public static function providerMrr()
    {
        return [
            'yearly 120' => [120, 1, 'year', 10.0],
            'monthly 9.99' => [9.99, 1, 'month', 9.99],
            'every 3 months 30' => [30, 3, 'month', 10.0],
            'weekly 3' => [3, 1, 'week', 13.0],
            'daily 1' => [1, 1, 'day', 30.4375],
            'hourly 0.01' => [0.01, 1, 'hour', 7.305],
            'every minute 0.001' => [0.001, 1, 'minute', 43.83],
            'period 0 counts as 1' => [12, 0, 'month', 12.0],
        ];
    }

    #[DataProvider('providerMrr')]
    public function testMrr($fAmount, $iPeriod, $sUnit, $fExpected)
    {
        $this->assertEqualsWithDelta($fExpected, BxAnalyticsRevenue::getMrr($fAmount, $iPeriod, $sUnit), 0.0001);
    }

    public function testMrrUnknown()
    {
        $this->assertNull(BxAnalyticsRevenue::getMonthFactor('fortnight'));
        $this->assertNull(BxAnalyticsRevenue::getMrr(10, 1, 'fortnight'), 'a unit the payment module does not use');
        $this->assertNull(BxAnalyticsRevenue::getMrr(null, 1, 'month'), 'a price without a rate');
    }

    public static function providerRate()
    {
        $sEur = serialize(['cur_def' => 'USD', 'cur_rate' => 0.92]);

        return [
            'default currency' => ['USD', serialize(['cur_def' => 'USD']), 'USD', 1.0],
            'no currency' => ['', '', 'USD', 1.0],
            'snapshot rate' => ['EUR', $sEur, 'USD', 0.92],
            'rate as a string' => ['EUR', serialize(['cur_def' => 'USD', 'cur_rate' => '2']), 'USD', 2.0],
            'no rate in the snapshot' => ['GBP', serialize(['cur_def' => 'USD']), 'USD', null],
            'zero rate' => ['GBP', serialize(['cur_def' => 'USD', 'cur_rate' => 0]), 'USD', null],
            'default currency changed since' => ['USD', serialize(['cur_def' => 'USD']), 'EUR', null],
            'an order in what is now the default currency' => ['USD', serialize(['cur_def' => 'EUR', 'cur_rate' => 1.25]), 'USD', 1.0],
            'no snapshot, default currency' => ['USD', '', 'USD', 1.0],
            'no snapshot, other currency' => ['EUR', '', 'USD', null],
            'broken snapshot' => ['EUR', 'a:1:{', 'USD', null],
            'objects are not unserialized' => ['EUR', 'O:8:"stdClass":0:{}', 'USD', null],
        ];
    }

    #[DataProvider('providerRate')]
    public function testSnapshotRate($sCurrency, $sData, $sDefault, $mixedExpected)
    {
        $this->assertSame($mixedExpected, BxAnalyticsRevenue::getSnapshotRate($sCurrency, $sData, $sDefault));
    }

    public function testToDefault()
    {
        $this->assertSame(50.0, BxAnalyticsRevenue::toDefault(100, 2.0), 'rates are quoted against the default currency');
        $this->assertSame(32.6087, BxAnalyticsRevenue::toDefault(30, 0.92));
        $this->assertSame(-10.0, BxAnalyticsRevenue::toDefault(-10, 1.0));
        $this->assertNull(BxAnalyticsRevenue::toDefault(100, null));
        $this->assertNull(BxAnalyticsRevenue::toDefault(100, 0));
    }

    public function testKind()
    {
        $this->assertSame('sale', BxAnalyticsRevenue::getKind('single', 1700000600, 1700000000), 'every transaction of a single order is a sale');
        $this->assertSame('sale', BxAnalyticsRevenue::getKind('recurring', 1700000000, 1700000000), 'the first charge of a subscription, add-ons included');
        $this->assertSame('renewal', BxAnalyticsRevenue::getKind('recurring', 1702592000, 1700000000));
    }

    public function testPeriodSeconds()
    {
        $this->assertSame(2629800, BxAnalyticsRevenue::getPeriodSeconds(1, 'month'));
        $this->assertSame(1209600, BxAnalyticsRevenue::getPeriodSeconds(2, 'week'));
        $this->assertSame(86400, BxAnalyticsRevenue::getPeriodSeconds(0, 'day'), 'period 0 counts as 1');
        $this->assertNull(BxAnalyticsRevenue::getPeriodSeconds(1, 'fortnight'));
    }

    public function testTrialRegistration()
    {
        $aTrial = ['started' => 1700000000, 'trial' => 14];
        $this->assertTrue(BxAnalyticsRevenue::isTrialRegistration($aTrial, 1700000005), 'registered when the trial starts');
        $this->assertFalse(BxAnalyticsRevenue::isTrialRegistration($aTrial, 1700000000 + 14 * 86400 - 600), 'charged when it ends, a little early');
        $this->assertFalse(BxAnalyticsRevenue::isTrialRegistration(['started' => 1700000000, 'trial' => 0], 1700000005), 'no trial');
        $this->assertFalse(BxAnalyticsRevenue::isTrialRegistration([], 1700000005));
    }

    public function testChargeKind()
    {
        $aTrial = ['started' => 1700000000, 'trial' => 7];
        $iPaid = 1700000000 + 7 * 86400;

        $this->assertSame('trial', BxAnalyticsRevenue::getChargeKind('recurring', $aTrial, 1700000005, $iPaid), 'the registration took no money');
        $this->assertSame('sale', BxAnalyticsRevenue::getChargeKind('recurring', $aTrial, $iPaid, $iPaid), 'the first charge after the trial');
        $this->assertSame('renewal', BxAnalyticsRevenue::getChargeKind('recurring', $aTrial, $iPaid + 7 * 86400, $iPaid));
        $this->assertSame('sale', BxAnalyticsRevenue::getChargeKind('recurring', [], 1700000005, 1700000005), 'no trial');
        $this->assertSame('sale', BxAnalyticsRevenue::getChargeKind('single', $aTrial, 1700000005, 1700000005), 'only subscriptions have trials');

        $this->assertSame(['purchase', 'renewal', 'trial_start'], array_map(['BxAnalyticsRevenue', 'getActionName'], ['sale', 'renewal', 'trial']));
    }

    public function testKindChanges()
    {
        $aTrial = ['started' => 1700000000, 'trial' => 7];
        $iPaid = 1700000000 + 7 * 86400;

        // read before the trial was known: the registration became the sale
        $aRows = [
            ['id' => 1, 'transaction_id' => 11, 'kind' => 'sale', 'ts' => 1700000005],
            ['id' => 2, 'transaction_id' => 12, 'kind' => 'renewal', 'ts' => $iPaid],
            ['id' => 3, 'transaction_id' => 13, 'kind' => 'renewal', 'ts' => $iPaid + 7 * 86400],
        ];
        $this->assertSame([1 => 'trial', 2 => 'sale'], BxAnalyticsRevenue::getKindChanges('recurring', $aTrial, $aRows));
        $this->assertSame([], BxAnalyticsRevenue::getKindChanges('recurring', ['started' => 1700000000, 'trial' => 0], $aRows), 'no trial');

        // a negated charge keeps its kind and is not taken for a registration
        $aRows[] = ['id' => 4, 'transaction_id' => 11, 'kind' => 'refund', 'ts' => $iPaid + 3600];
        $this->assertSame([2 => 'sale'], BxAnalyticsRevenue::getKindChanges('recurring', $aTrial, $aRows));
    }

    public function testFirstItem()
    {
        $this->assertSame([65, 3], BxAnalyticsRevenue::getFirstItem('1_65_3_1'));
        $this->assertSame([56, 12], BxAnalyticsRevenue::getFirstItem('4_56_12_2:4_56_13_1'));
        $this->assertSame([0, 0], BxAnalyticsRevenue::getFirstItem(''));
    }
}
