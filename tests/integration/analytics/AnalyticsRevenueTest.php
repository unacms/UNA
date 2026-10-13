<?php

/**
 * Payment alerts into the revenue ledger, and back out through the revenue reports.
 * Orders and transactions are seeded in the payment module's tables with the order number
 * `test-rev-*`, dated September 2001 like the other analytics tests, and deleted afterwards.
 */
class AnalyticsRevenueTest extends BxDolIntegrationTestCase
{
    // 2001-09-09 01:46:40 UTC
    const NOW = 1000000000;

    const UA_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

    const CLIENT = 987654401;
    const SELLER = 987654402;

    protected $_oModule;
    protected $_aOptions = [];
    protected $_aPending = [];
    protected $_iOrder = 0;
    protected $_iModuleId = 0;
    protected $_aMatrix = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_analytics'))
            $this->markTestSkipped('bx_analytics is not installed');

        $oPayments = BxDolPayments::getInstance();
        if (!$oPayments->isActive() || $oPayments->getActive() != 'bx_payment')
            $this->markTestSkipped('bx_payment is not the active payment module');

        // amounts below are in USD at rate 1
        if ($oPayments->getCurrencyCode() != 'USD')
            $this->markTestSkipped('the default currency of bx_payment is not USD');

        $this->_oModule = BxDolModule::getInstance('bx_analytics');
        $this->_oModule->getRevenue(); // loads the classes
        $this->_oModule->getFilter([]);

        // a module that sells: payment's own commission invoices are always there
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_payment');
        $this->_iModuleId = (int)$aModule['id'];

        $this->_cleanup();

        foreach (['bx_analytics_track_actions' => 'on', 'bx_analytics_tracking' => 'on', 'bx_analytics_platforms' => 'core-web,next-web,rn-ios,rn-android,api,core', 'bx_analytics_respect_dnt' => 'on', 'bx_analytics_link_members' => 'on', 'bx_analytics_identity' => 'cookieless', 'bx_analytics_exclude_ips' => '', 'bx_analytics_exclude_levels' => '', 'bx_analytics_exclude_paths' => ''] as $sName => $sValue)
            $this->_setOption($sName, $sValue);
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            foreach ($this->_aOptions as $sName => $sValue)
                setParam($sName, $sValue);
            $this->_restoreMatrix();
        }
        $GLOBALS['glForceCurrentProfileId'] = 0;

        parent::tearDown();
    }

    public function testSaleInTheBuyersRequest()
    {
        // the buyer is browsing in the iOS app
        $aServer = $this->_server(['HTTP_X_NEO_PLATFORM' => 'ios']);
        $oCollector = new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW - 60);
        $this->assertSame(1, $oCollector->collect(['platform' => 'rn-ios', 'app' => 'com.neo.so', 'hits' => [['type' => 'pageview', 'url' => '/page/checkout']]], ['profile_id' => self::CLIENT]));
        $iSession = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `bx_analytics_sessions` WHERE `profile_id` = :p AND `started` < :to", ['p' => self::CLIENT, 'to' => self::NOW + 86400]);
        $this->assertGreaterThan(0, $iSession);

        $aEur = $this->_order('single', 'stripe_v3', 'EUR', 50, ['cur_def' => 'USD', 'cur_rate' => 2]);
        $this->_transaction($aEur, 50);
        $this->_buyer($aServer)->onPaymentAlert($this->_alert('register_payment', ['pending' => $aEur]));

        $aRow = $this->_ledger($aEur)[0];
        $this->assertSame(['sale', 'rn-ios', $iSession, 1, 'EUR', '25.0000'], [$aRow['kind'], $aRow['platform'], (int)$aRow['session_id'], (int)$aRow['cash'], $aRow['currency'], $aRow['amount_default']], 'converted with the order\'s own rate');
        $this->assertSame('bx_payment', $aRow['module']);

        $aUsd = $this->_order('single', 'stripe_v3', 'USD', 10);
        $this->_transaction($aUsd, 10);
        $this->_buyer($aServer)->onPaymentAlert($this->_alert('register_payment', ['pending' => $aUsd]));
        $this->assertSame('10.0000', $this->_ledger($aUsd)[0]['amount_default'], 'the default currency has rate 1');

        $aGbp = $this->_order('single', 'stripe_v3', 'GBP', 7);
        $this->_transaction($aGbp, 7);
        $this->_buyer($aServer)->onPaymentAlert($this->_alert('register_payment', ['pending' => $aGbp]));
        $this->assertNull($this->_ledger($aGbp)[0]['amount_default'], 'no rate known');

        $aRevenue = $this->_oModule->getReports()->getRevenue($this->_filter(), []);
        $aTiles = array_column($aRevenue['tiles'], 'value', 'key');
        $this->assertEquals(35.0, $aTiles['net']);
        $this->assertSame(3, $aTiles['orders']);
        $this->assertSame(1, $aTiles['customers']);
        $this->assertCount(2, $aRevenue['notes'], 'a payment without an exchange rate, and how amounts are counted');

        // the sale is an action of the visit, so goals and funnels can end in it
        $aEvents = BxDolDb::getInstance()->getAll("SELECT `session_id`, `name`, `value`, `platform` FROM `bx_analytics_events` WHERE `type` = 'una' AND `name` = 'purchase' AND `ts` < :to ORDER BY `id`", ['to' => self::NOW + 86400]);
        $this->assertCount(3, $aEvents);
        $this->assertEquals(['session_id' => $iSession, 'name' => 'purchase', 'value' => 25, 'platform' => 'rn-ios'], $aEvents[0]);

        $sProps = BxDolDb::getInstance()->getOne("SELECT `props` FROM `bx_analytics_events` WHERE `type` = 'una' AND `name` = 'purchase' AND `ts` < :to ORDER BY `id` LIMIT 1", ['to' => self::NOW + 86400]);
        $this->assertSame(['provider' => 'stripe_v3'], json_decode($sProps, true), 'no amounts or order numbers');
    }

    public function testWebhookThenFinalize()
    {
        $aPending = $this->_order('single', 'stripe_v3', 'USD', 20);
        $this->_transaction($aPending, 20);

        // the provider's webhook: nobody is signed in
        $oWebhook = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest(['REQUEST_METHOD' => 'POST', 'REMOTE_ADDR' => '54.187.174.169', 'HTTP_USER_AGENT' => 'Stripe/1.0']), self::NOW, ['api' => false, 'api_key' => false, 'logged' => 0]);
        $oWebhook->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $this->assertSame('core', $this->_ledger($aPending)[0]['platform'], 'a webhook POST is not the classic web UI');

        $aServer = $this->_server();
        (new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($aServer), self::NOW))->collect(['platform' => 'core-web', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/checkout']]], ['profile_id' => self::CLIENT, 'platform' => 'core-web']);

        $this->_buyer($aServer, 'core-web')->onPaymentAlert($this->_alert('finalize_checkout', ['pending' => $aPending], self::CLIENT));
        $aRow = $this->_ledger($aPending)[0];
        $this->assertSame('core-web', $aRow['platform']);
        $this->assertGreaterThan(0, (int)$aRow['session_id'], 'the buyer\'s visit');
    }

    public function testRecurring()
    {
        $aServer = $this->_server(['HTTP_X_NEO_PLATFORM' => 'web']);
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 120);
        $aSubscription = ['subscription_id' => 'test-rev-sub-1', 'period' => 1, 'period_unit' => 'year', 'trial' => 0, 'status' => 'active'];

        $oBuyer = $this->_buyer($aServer);
        $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));
        $this->_transaction($aPending, 120);
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        // the renewal comes from cron
        $oCron = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 3600, ['api' => false, 'api_key' => false, 'logged' => 0]);
        $oCron->onPaymentAlert($this->_alert('prolong_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));
        $this->_transaction($aPending, 120, self::NOW + 3600);
        $oCron->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        $aRows = $this->_ledger($aPending);
        $this->assertSame([['sale', 'next-web'], ['renewal', 'core']], array_map(function ($a) { return [$a['kind'], $a['platform']]; }, $aRows));

        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aPending['id']);
        $this->assertSame(['active', 2, '10.0000', self::NOW, self::NOW + 3600, 'next-web'], [$aSbs['status'], (int)$aSbs['paid_count'], $aSbs['mrr_default'], (int)$aSbs['first_paid'], (int)$aSbs['last_paid'], $aSbs['platform']], 'a yearly 120 plan is 10 a month');

        // a trial: the payment module registers the order at the full price when the trial starts
        $aWeekly = $this->_order('recurring', 'paypal_api', 'USD', 3);
        $aTrial = ['subscription_id' => 'test-rev-sub-2', 'period' => 1, 'period_unit' => 'week', 'status' => 'trial', 'trial' => 7];
        $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aWeekly, 'subscription' => $aTrial]));
        $this->_transaction($aWeekly, 3);
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aWeekly]));

        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aWeekly['id']);
        $this->assertSame(['13.0000', 'trial', 0, 0], [$aSbs['mrr_default'], $aSbs['status'], (int)$aSbs['first_paid'], (int)$aSbs['paid_count']], 'a weekly 3 plan is 13 a month; the trial took no money');
        $this->assertSame(['trial'], array_column($this->_ledger($aWeekly), 'kind'));

        $aTiles = array_column($this->_oModule->getReports()->getRevenue($this->_filter(), [])['tiles'], 'value', 'key');
        $this->assertEquals([240.0, 1], [$aTiles['gross'], $aTiles['orders']], 'the trial is not revenue');

        $aReport = $this->_oModule->getReports()->getSubscriptions($this->_filter(), []);
        $aTiles = array_column($aReport['tiles'], 'value', 'key');
        $this->assertEquals(10.0, $aTiles['mrr'], 'a trial is not recurring revenue yet');
        $this->assertSame([1, 1, 1], [$aTiles['active'], $aTiles['trials'], $aTiles['new']]);
        $this->assertSame(1, array_sum(array_filter($aReport['movement']['datasets'][1]['values'])), 'one renewal');

        // the trial ends with the first charge
        $oEnd = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 7 * 86400, ['api' => false, 'api_key' => false, 'logged' => 0]);
        $this->_transaction($aWeekly, 3, self::NOW + 7 * 86400);
        $oEnd->onPaymentAlert($this->_alert('register_payment', ['pending' => $aWeekly]));
        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aWeekly['id']);
        $this->assertSame(['active', self::NOW + 7 * 86400, 1], [$aSbs['status'], (int)$aSbs['first_paid'], (int)$aSbs['paid_count']]);
        $this->assertSame(['trial', 'sale'], array_column($this->_ledger($aWeekly), 'kind'), 'the first charge after the trial is the sale');
    }

    public function testTrial()
    {
        // a weekly 3 plan with a week of trial, checked out in NEO web
        $aServer = $this->_server(['HTTP_X_NEO_PLATFORM' => 'web']);
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 3);
        $aSubscription = ['subscription_id' => 'test-rev-sub-t', 'period' => 1, 'period_unit' => 'week', 'status' => 'trial', 'trial' => 7];
        $oBuyer = $this->_buyer($aServer);
        $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));

        // the payment module registers the order at the full price when the trial starts
        $iRegistration = $this->_transaction($aPending, 3);
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $this->assertSame([['trial', '3.0000', 'next-web']], array_map(function ($a) { return [$a['kind'], $a['amount_default'], $a['platform']]; }, $this->_ledger($aPending)), 'kept for reference, once');

        $oReports = $this->_oModule->getReports();
        $aTiles = array_column($oReports->getRevenue($this->_filter(), [])['tiles'], 'value', 'key');
        $this->assertEquals([0.0, 0.0, 0, 0], [$aTiles['gross'], $aTiles['net'], $aTiles['orders'], $aTiles['customers']], 'no money yet');
        $aTiles = array_column($oReports->getSubscriptions($this->_filter(), [])['tiles'], 'value', 'key');
        $this->assertEquals([0.0, 0, 1], [$aTiles['mrr'], $aTiles['active'], $aTiles['trials']]);
        $this->assertSame([], $oReports->getLifetimeValues([self::CLIENT]), 'no lifetime value');

        // the trial start is an action of the visit, with no value
        $aEvents = BxDolDb::getInstance()->getAll("SELECT `name`, `value`, `platform` FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to ORDER BY `id`", ['to' => self::NOW + 30 * 86400]);
        $this->assertEquals([['name' => 'trial_start', 'value' => 0, 'platform' => 'next-web']], $aEvents);

        // a seller cancelling the registration takes no money back
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 60, ['logged' => self::SELLER]))->onPaymentAlert($this->_alert('cancel_order', ['type' => 'processed', 'order' => ['id' => $iRegistration]], self::SELLER));
        $this->assertCount(1, $this->_ledger($aPending));

        // the first charge when the trial ends, and a renewal a week later, both by cron
        foreach ([7, 14] as $iDays) {
            $oCron = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + $iDays * 86400, ['api' => false, 'api_key' => false, 'logged' => 0]);
            $oCron->onPaymentAlert($this->_alert('prolong_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));
            $this->_transaction($aPending, 3, self::NOW + $iDays * 86400);
            $oCron->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        }

        $aRows = $this->_ledger($aPending);
        $this->assertSame([['trial', 'next-web'], ['sale', 'next-web'], ['renewal', 'core']], array_map(function ($a) { return [$a['kind'], $a['platform']]; }, $aRows), 'the sale keeps the checkout platform');

        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aPending['id']);
        $this->assertSame(['active', self::NOW + 7 * 86400, self::NOW + 14 * 86400, 2], [$aSbs['status'], (int)$aSbs['first_paid'], (int)$aSbs['last_paid'], (int)$aSbs['paid_count']]);

        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => 'custom', 'from' => '2001-09-08', 'to' => '2001-09-24'], self::NOW + 20 * 86400);
        $aRevenue = $oReports->getRevenue($oFilter, []);
        $aTiles = array_column($aRevenue['tiles'], 'value', 'key');
        $this->assertEquals([6.0, 6.0, 1, 1], [$aTiles['gross'], $aTiles['net'], $aTiles['orders'], $aTiles['customers']]);
        $this->assertEquals(6.0, array_sum(array_filter($aRevenue['chart']['datasets'][0]['values'])), 'the chart has the charges only');

        $aSubscriptions = $oReports->getSubscriptions($oFilter, []);
        $aTiles = array_column($aSubscriptions['tiles'], 'value', 'key');
        $this->assertEquals([13.0, 1, 0, 1], [$aTiles['mrr'], $aTiles['active'], $aTiles['trials'], $aTiles['new']]);
        $this->assertSame(1, array_sum(array_filter($aSubscriptions['movement']['datasets'][1]['values'])), 'one renewal: the first charge is the sale');

        $this->assertEquals([self::CLIENT => 6.0], array_map('floatval', $oReports->getLifetimeValues([self::CLIENT])));
        $aSales = $oReports->getSales($oFilter, []);
        $this->assertSame(['net' => 6.0, 'units' => 1, 'orders' => 1, 'renewals' => 1], $aSales['items']['rows'][0]['values']);

        $aEvents = BxDolDb::getInstance()->getPairs("SELECT `name`, SUM(`value`) AS `value` FROM `bx_analytics_events` WHERE `type` = 'una' AND `ts` < :to GROUP BY `name`", 'name', 'value', ['to' => self::NOW + 30 * 86400]);
        $this->assertEquals(['purchase' => 3, 'renewal' => 3, 'trial_start' => 0], $aEvents, 'the first charge is the purchase');

        // a refund during the trial takes nothing back; after it, the latest charge
        $aEarly = $this->_order('recurring', 'paypal_api', 'USD', 5);
        $this->_buyer($aServer)->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aEarly, 'subscription' => ['subscription_id' => 'test-rev-sub-t2', 'period' => 1, 'period_unit' => 'month', 'status' => 'trial', 'trial' => 14]]));
        $this->_transaction($aEarly, 5);
        $this->_buyer($aServer)->onPaymentAlert($this->_alert('register_payment', ['pending' => $aEarly]));
        $this->_deletePayment($aEarly);
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 600, ['logged' => 0]))->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aEarly]));
        $this->assertSame(['trial'], array_column($this->_ledger($aEarly), 'kind'));

        $this->_deletePayment($aPending);
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 15 * 86400, ['logged' => 0]))->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending]));
        $aRows = $this->_ledger($aPending);
        $this->assertSame(['trial', 'sale', 'renewal', 'refund'], array_column($aRows, 'kind'));
        $this->assertSame($aRows[2]['transaction_id'], $aRows[3]['transaction_id']);
    }

    public function testTrialImport()
    {
        // a weekly plan with a week of trial the ledger never saw: registered, charged, renewed
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 3);
        $iFirst = $this->_transaction($aPending, 3, self::NOW - 20 * 86400);
        $this->_transaction($aPending, 3, self::NOW - 13 * 86400);
        $this->_transaction($aPending, 3, self::NOW - 6 * 86400);

        // transactions are read before subscriptions: the trial isn't known yet
        $oRevenue = $this->_oModule->getRevenue();
        $aPage = bx_srv_ic('bx_payment', 'get_transactions_after', [$iFirst - 1, 10], 'Orders');
        $this->assertSame(3, $oRevenue->importTransactions('bx_payment', $aPage));
        $this->assertSame(['sale', 'renewal', 'renewal'], array_column($this->_ledger($aPending), 'kind'));

        // its subscription brings the trial
        $aSubscription = [
            'pending_id' => $aPending['id'], 'subscription_id' => 'test-rev-sub-ti', 'period' => 1, 'period_unit' => 'week', 'trial' => 7,
            'date_add' => self::NOW - 20 * 86400, 'date_next' => self::NOW + 86400, 'status' => 'active', 'client_id' => self::CLIENT, 'seller_id' => self::SELLER,
            'type' => 'recurring', 'provider' => 'stripe_v3', 'items' => self::SELLER . '_' . $this->_iModuleId . '_1_1', 'amount' => 3, 'currency' => 'USD',
            'order' => $aPending['order'], 'data' => $aPending['data'],
        ];
        $this->assertSame(1, $oRevenue->importSubscriptions('bx_payment', [$aSubscription], false));
        $this->assertSame(['trial', 'sale', 'renewal'], array_column($this->_ledger($aPending), 'kind'));
        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aPending['id']);
        $this->assertSame([self::NOW - 13 * 86400, self::NOW - 6 * 86400, 2], [(int)$aSbs['first_paid'], (int)$aSbs['last_paid'], (int)$aSbs['paid_count']]);

        // read again, nothing new; read with the subscription known, the kinds are right at once
        $this->assertSame(0, $oRevenue->importTransactions('bx_payment', $aPage));
        BxDolDb::getInstance()->query("DELETE FROM `bx_analytics_revenue` WHERE `payment` = 'bx_payment' AND `pending_id` = :id", ['id' => (int)$aPending['id']]);
        $this->assertSame(3, $oRevenue->importTransactions('bx_payment', $aPage));
        $this->assertSame(['trial', 'sale', 'renewal'], array_column($this->_ledger($aPending), 'kind'));

        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => 'custom', 'from' => '2001-08-19', 'to' => '2001-09-09'], self::NOW + 86400);
        $aTiles = array_column($this->_oModule->getReports()->getRevenue($oFilter, [])['tiles'], 'value', 'key');
        $this->assertEquals([6.0, 1], [$aTiles['gross'], $aTiles['orders']]);
    }

    public function testChargeWithAddons()
    {
        // the plan and an add-on: one transaction each, registered together
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 12);
        $oBuyer = $this->_buyer($this->_server(['HTTP_X_NEO_PLATFORM' => 'web']));
        $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => ['subscription_id' => 'test-rev-sub-a', 'period' => 1, 'period_unit' => 'month', 'status' => 'active']]));
        $this->_transaction($aPending, 10);
        $this->_transaction($aPending, 2);
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        $oCron = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 3600, ['api' => false, 'api_key' => false, 'logged' => 0]);
        $this->_transaction($aPending, 10, self::NOW + 3600);
        $this->_transaction($aPending, 2, self::NOW + 3600);
        $oCron->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        $this->assertSame(['sale', 'sale', 'renewal', 'renewal'], array_column($this->_ledger($aPending), 'kind'), 'the add-on is part of the first charge');
        $this->assertSame(2, (int)$this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aPending['id'])['paid_count'], 'charges, not items');

        $aReport = $this->_oModule->getReports()->getSubscriptions($this->_filter(), []);
        $this->assertSame(1, array_sum(array_filter($aReport['movement']['datasets'][1]['values'])), 'one renewal');

        // a refund takes back the whole latest charge
        $this->_deletePayment($aPending);
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 7200, ['logged' => 0]))->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending]));
        $aRows = $this->_ledger($aPending);
        $this->assertSame(['sale', 'sale', 'renewal', 'refund', 'renewal', 'refund'], array_column($aRows, 'kind'));
        $this->assertEquals(-12.0, array_sum(array_map(function ($a) { return $a['kind'] == 'refund' ? (float)$a['amount_default'] : 0; }, $aRows)));
    }

    public function testFirstSaleByWebhookKeepsTheCheckoutPlatform()
    {
        // the buyer checks out in the iOS app; the provider's webhook registers the first charge
        $aPending = $this->_order('recurring', 'paypal_api', 'USD', 5);
        $this->_buyer($this->_server(['HTTP_X_NEO_PLATFORM' => 'ios']))->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => ['subscription_id' => 'test-rev-sub-w', 'period' => 1, 'period_unit' => 'month', 'status' => 'unpaid']]));
        $this->_transaction($aPending, 5, self::NOW + 60);

        $oWebhook = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest(['REQUEST_METHOD' => 'POST', 'REMOTE_ADDR' => '173.0.82.126', 'HTTP_USER_AGENT' => 'PayPal/AUHD-214.0']), self::NOW + 60, ['api' => false, 'api_key' => false, 'logged' => 0]);
        $oWebhook->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending], 0));

        $aRow = $this->_ledger($aPending)[0];
        $this->assertSame(['sale', 'rn-ios', 0], [$aRow['kind'], $aRow['platform'], (int)$aRow['session_id']]);
    }

    public function testCancelledChargeIsNotImportedTwice()
    {
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 9);
        $iFirst = $this->_transaction($aPending, 9);
        $oBuyer = $this->_buyer($this->_server());
        $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => ['subscription_id' => 'test-rev-sub-r', 'period' => 1, 'period_unit' => 'month', 'status' => 'active']]));
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        // the seller cancels the processed first charge: the payment module deletes it
        BxDolDb::getInstance()->query("DELETE FROM `bx_payment_transactions` WHERE `id` = :id", ['id' => $iFirst]);
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 60, ['logged' => self::SELLER]))->onPaymentAlert($this->_alert('cancel_order', ['type' => 'processed', 'order' => ['id' => $iFirst]], self::SELLER));

        // the next charge is still a renewal
        $this->_transaction($aPending, 9, self::NOW + 3600);
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 3600, ['api' => false, 'api_key' => false, 'logged' => 0]))->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $this->assertSame(['sale', 'reversal', 'renewal'], array_column($this->_ledger($aPending), 'kind'));

        // importing the history again adds nothing
        $aPage = bx_srv_ic('bx_payment', 'get_transactions_after', [$iFirst - 1, 10], 'Orders');
        $this->assertSame(0, $this->_oModule->getRevenue()->importTransactions('bx_payment', $aPage));
        $this->assertCount(3, $this->_ledger($aPending));

        $aTiles = array_column($this->_oModule->getReports()->getRevenue($this->_filter(), [])['tiles'], 'value', 'key');
        $this->assertEquals([18.0, 9.0, 9.0], [$aTiles['gross'], $aTiles['refunds'], $aTiles['net']]);
    }

    public function testSingleRefund()
    {
        $aPending = $this->_order('single', 'stripe_v3', 'USD', 15);
        $this->_transaction($aPending, 15);
        $this->_buyer($this->_server())->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        // the payment module deletes the order before it says it was refunded
        $this->_deletePayment($aPending);
        $oWebhook = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 600, ['logged' => 0]);
        $oWebhook->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending]));
        $oWebhook->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending]));

        $aRows = $this->_ledger($aPending);
        $this->assertSame([['sale', '15.0000'], ['refund', '-15.0000']], array_map(function ($a) { return [$a['kind'], $a['amount_default']]; }, $aRows), 'a repeated alert adds nothing');
        $this->assertSame($aRows[0]['platform'], $aRows[1]['platform'], 'a refund keeps the sale\'s platform');

        $aTiles = array_column($this->_oModule->getReports()->getRevenue($this->_filter(), [])['tiles'], 'value', 'key');
        $this->assertEquals([15.0, 15.0, 0.0], [$aTiles['gross'], $aTiles['refunds'], $aTiles['net']]);
    }

    public function testRecurringRefundTakesBackTheLastCharge()
    {
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 9);
        $this->_transaction($aPending, 9);
        $this->_transaction($aPending, 9, self::NOW + 60);
        $this->_buyer($this->_server())->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        $this->_deletePayment($aPending);
        (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 600, ['logged' => 0]))->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending]));

        $aRows = $this->_ledger($aPending);
        $this->assertSame(['sale', 'renewal', 'refund'], array_column($aRows, 'kind'));
        $this->assertSame($aRows[1]['transaction_id'], $aRows[2]['transaction_id'], 'only the latest charge');
    }

    public function testCancelProcessedOrder()
    {
        $aPending = $this->_order('single', 'offline', 'USD', 40);
        $iTransaction = $this->_transaction($aPending, 40);
        $this->_buyer($this->_server())->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        $oSeller = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 60, ['logged' => self::SELLER]);
        $oSeller->onPaymentAlert($this->_alert('cancel_order', ['type' => 'pending', 'order' => ['id' => $aPending['id']]]));
        $this->assertCount(1, $this->_ledger($aPending), 'a pending order took no money');

        $oSeller->onPaymentAlert($this->_alert('cancel_order', ['type' => 'processed', 'order' => ['id' => $iTransaction, 'amount' => 40]]));
        $aRows = $this->_ledger($aPending);
        $this->assertSame([['sale', '40.0000'], ['reversal', '-40.0000']], array_map(function ($a) { return [$a['kind'], $a['amount']]; }, $aRows));
    }

    public function testRefundAfterReversal()
    {
        $aPending = $this->_order('single', 'stripe_v3', 'USD', 15);
        $iFirst = $this->_transaction($aPending, 10);
        $this->_transaction($aPending, 5);
        $this->_buyer($this->_server())->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

        // the seller cancels one item, then the provider refunds the order
        BxDolDb::getInstance()->query("DELETE FROM `bx_payment_transactions` WHERE `id` = :id", ['id' => $iFirst]);
        $oOther = new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW + 60, ['logged' => 0]);
        $oOther->onPaymentAlert($this->_alert('cancel_order', ['type' => 'processed', 'order' => ['id' => $iFirst]], self::SELLER));
        $this->_deletePayment($aPending);
        $oOther->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending], 0));
        $oOther->onPaymentAlert($this->_alert('refund_payment', ['pending' => $aPending], 0));

        $aRows = $this->_ledger($aPending);
        $this->assertSame([['sale', '10.0000'], ['reversal', '-10.0000'], ['sale', '5.0000'], ['refund', '-5.0000']], array_map(function ($a) { return [$a['kind'], $a['amount']]; }, $aRows), 'nothing is taken back twice');
    }

    public function testPaidWithCredits()
    {
        $aPending = $this->_order('single', 'credits', 'USD', 12);
        $this->_transaction($aPending, 12);
        $this->_buyer($this->_server())->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $this->assertSame(0, (int)$this->_ledger($aPending)[0]['cash']);

        $oReports = $this->_oModule->getReports();
        $aTiles = array_column($oReports->getRevenue($this->_filter(), [])['tiles'], 'value', 'key');
        $this->assertEquals(0.0, $aTiles['gross'], 'credits are not money');

        $aCredits = $oReports->getCredits($this->_filter(), []);
        $this->assertSame(1, count($aCredits['spent']['rows']));
        $this->assertEquals(12.0, $aCredits['spent']['rows'][0]['values']['net']);
    }

    public function testCancellationWithReason()
    {
        $aServer = $this->_server();
        $aIds = [];
        // reason (null: kept), paid days ago (0: within the reported day); `cancel` is the
        // payment module's default when no reason was given
        foreach ([['Too expensive', 20], ['Too expensive', 20], ['cancel', 20], ['', 20], ['Too expensive', 0], [null, 20]] as $i => list($sReason, $iDays)) {
            $iPaid = $iDays ? self::NOW - $iDays * 86400 : self::NOW - 3600;
            $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 10);
            $aSubscription = ['subscription_id' => 'test-rev-sub-c' . $i, 'period' => 1, 'period_unit' => 'month', 'status' => 'active'];
            $oBuyer = $this->_buyer($aServer, 'core-web', $iPaid);
            $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));
            $this->_transaction($aPending, 10, $iPaid);
            $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
            $aIds[] = [$aPending, $aSubscription, $sReason];
        }

        foreach ($aIds as list($aPending, $aSubscription, $sReason))
            if ($sReason !== null)
                $this->_buyer($aServer)->onPaymentAlert($this->_alert('cancel_subscription', ['pending' => $aPending, 'subscription' => $aSubscription, 'reason' => $sReason]));

        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aIds[0][0]['id']);
        $this->assertSame(['canceled', self::NOW, 'Too expensive'], [$aSbs['status'], (int)$aSbs['canceled'], $aSbs['reason']]);

        $aReport = $this->_oModule->getReports()->getSubscriptions($this->_filter(['from' => '2001-09-09', 'to' => '2001-09-09']), []);
        $aTiles = array_column($aReport['tiles'], 'value', 'key');
        $this->assertSame([5, 1, 1], [$aTiles['cancelled'], $aTiles['active'], $aTiles['new']]);
        $this->assertEquals(80.0, $aTiles['churn'], 'four of the five paying at the start; the one that started in the day is not churn');
        $this->assertSame(['Too expensive', _t('_bx_analytics_txt_sbs_no_reason')], array_column($aReport['reasons']['rows'], 'label'));
        $this->assertSame([3, 2], array_column(array_column($aReport['reasons']['rows'], 'values'), 'count'));
    }

    public function testUnpaidSubscriptionStopsPaying()
    {
        // two monthly subscriptions whose charge failed: one paid 40 days ago, one 10 days ago
        $aIds = [];
        foreach ([40, 10] as $i => $iDays) {
            $iPaid = self::NOW - $iDays * 86400;
            $aPending = $this->_order('recurring', 'credits', 'USD', 10);
            $aSubscription = ['subscription_id' => 'test-rev-sub-u' . $i, 'period' => 1, 'period_unit' => 'month', 'status' => 'active'];
            $oBuyer = $this->_buyer($this->_server(), 'core-web', $iPaid);
            $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));
            $this->_transaction($aPending, 10, $iPaid);
            $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));

            (new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest([]), self::NOW, ['logged' => 0]))->onPaymentAlert($this->_alert('overdue_subscription', ['pending' => $aPending, 'subscription' => $aSubscription]));
            $aIds[] = $aPending;
        }
        $this->assertSame('unpaid', $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aIds[0]['id'])['status']);

        // the first one's paid month and grace time ended in the period
        $aReport = $this->_oModule->getReports()->getSubscriptions($this->_filter(['from' => '2001-09-05', 'to' => '2001-09-10']), []);
        $aTiles = array_column($aReport['tiles'], 'value', 'key');
        $this->assertSame([1, 1], [$aTiles['active'], $aTiles['cancelled']]);
        $this->assertEquals([10.0, 50.0], [$aTiles['mrr'], $aTiles['churn']]);
        $this->assertSame(1, array_sum(array_filter($aReport['movement']['datasets'][2]['values'])));
    }

    public function testProfileDeletionKeepsTheMoney()
    {
        (new BxAnalyticsCollector($this->_oModule, new BxAnalyticsRequest($this->_server(['HTTP_REFERER' => ''])), self::NOW - 600))->collect(['platform' => 'core-web', 'referrer' => 'https://www.google.com/', 'hits' => [['type' => 'pageview', 'url' => 'http://una.test/']]], ['profile_id' => self::CLIENT, 'platform' => 'core-web']);

        $aPending = $this->_order('single', 'stripe_v3', 'USD', 5);
        $this->_transaction($aPending, 5);
        $this->_buyer($this->_server(), 'core-web')->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $aRow = $this->_ledger($aPending)[0];
        $this->assertSame(['search', 'search'], [$aRow['first_channel'], $aRow['last_channel']]);

        $this->_oModule->onProfileDelete(self::CLIENT);
        $aRow = $this->_ledger($aPending)[0];
        $this->assertSame([self::CLIENT, 0, '', ''], [(int)$aRow['client_id'], (int)$aRow['session_id'], $aRow['first_channel'], $aRow['last_channel']]);
        $this->assertSame('5.0000', $aRow['amount_default']);
    }

    public function testBackfill()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        foreach ([$CNF['OPTION_BACKFILL'], $CNF['OPTION_BACKFILL_SBS']] as $sName)
            $this->_setOption($sName, getParam($sName));

        // past payments the ledger never saw: a subscription charged three times and a sale
        $aRecurring = $this->_order('recurring', 'stripe_v3', 'USD', 9);
        $iFirst = $this->_transaction($aRecurring, 9, self::NOW - 3 * 86400);
        $this->_transaction($aRecurring, 9, self::NOW - 2 * 86400);
        $aSingle = $this->_order('single', 'paypal_api', 'EUR', 20, ['cur_def' => 'USD', 'cur_rate' => 0.8]);
        $this->_transaction($aSingle, 20, self::NOW - 86400);
        $this->_transaction($aRecurring, 9, self::NOW - 3600);

        $oRevenue = $this->_oModule->getRevenue();

        // two pages: the renewal on the second page still knows the sale was on the first
        $aPage = bx_srv_ic('bx_payment', 'get_transactions_after', [$iFirst - 1, 2], 'Orders');
        $this->assertCount(2, $aPage);
        $this->assertSame(2, $oRevenue->importTransactions('bx_payment', $aPage));
        $aPage = bx_srv_ic('bx_payment', 'get_transactions_after', [(int)end($aPage)['id'], 10], 'Orders');
        $this->assertSame(2, $oRevenue->importTransactions('bx_payment', $aPage));

        $aRows = $this->_ledger($aRecurring);
        $this->assertSame(['sale', 'renewal', 'renewal'], array_column($aRows, 'kind'));
        $this->assertSame([self::NOW - 3 * 86400, ''], [(int)$aRows[0]['ts'], $aRows[0]['platform']], 'the time it was paid, no platform');
        $this->assertSame('25.0000', $this->_ledger($aSingle)[0]['amount_default']);

        // the payment module's current subscriptions, a page at a time
        $this->_paymentSubscription($aRecurring, 'test-rev-sub-b', self::NOW - 3 * 86400);
        $aPage = bx_srv_ic('bx_payment', 'get_subscriptions_after', [(int)$aRecurring['id'] - 1, 10, false], 'Subscriptions');
        $this->assertSame([(int)$aRecurring['id']], array_map('intval', array_column($aPage, 'pending_id')));
        $this->assertSame(1, $oRevenue->importSubscriptions('bx_payment', $aPage, false));
        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aRecurring['id']);
        $this->assertSame(['active', 3, self::NOW - 3 * 86400, 0], [$aSbs['status'], (int)$aSbs['paid_count'], (int)$aSbs['first_paid'], (int)$aSbs['canceled']]);

        // the whole run again from the same place: nothing new, and the cursors end
        setParam($CNF['OPTION_BACKFILL'], (string)($iFirst - 1));
        setParam($CNF['OPTION_BACKFILL_SBS'], 'deleted:' . (int)$aSingle['id']);
        $aStatus = $oRevenue->backfill(time() + 30);
        $this->assertSame('done', $aStatus['state']);
        $this->assertSame('-1', (string)getParam($CNF['OPTION_BACKFILL']));
        $this->assertSame('-1', (string)getParam($CNF['OPTION_BACKFILL_SBS']));
        $this->assertCount(3, $this->_ledger($aRecurring));

        // subscriptions take their payments from the ledger
        $this->assertSame(1, $oRevenue->importSubscriptions('bx_payment', [[
            'pending_id' => $aRecurring['id'], 'subscription_id' => 'test-rev-sub-b', 'period' => 1, 'period_unit' => 'month', 'trial' => 0,
            'date_add' => self::NOW - 3 * 86400, 'date_next' => 0, 'status' => 'active', 'client_id' => self::CLIENT, 'seller_id' => self::SELLER,
            'type' => 'recurring', 'provider' => 'stripe_v3', 'items' => self::SELLER . '_' . $this->_iModuleId . '_1_1', 'amount' => 9, 'currency' => 'USD',
            'order' => $aRecurring['order'], 'data' => $aRecurring['data'], 'reason' => 'too slow', 'deleted' => self::NOW,
        ]], true));
        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aRecurring['id']);
        $this->assertSame(['canceled', 3, self::NOW - 3 * 86400, self::NOW, 'too slow', '9.0000'], [$aSbs['status'], (int)$aSbs['paid_count'], (int)$aSbs['first_paid'], (int)$aSbs['canceled'], $aSbs['reason'], $aSbs['mrr_default']]);

        // the hourly cron continues an import that is running
        $this->_setOption('bx_analytics_retention_days', '36500');
        BxDolDb::getInstance()->query("DELETE FROM `bx_analytics_revenue` WHERE `payment` = 'bx_payment' AND `pending_id` = :id", ['id' => (int)$aSingle['id']]);
        setParam($CNF['OPTION_BACKFILL'], (string)($iFirst - 1));
        setParam($CNF['OPTION_BACKFILL_SBS'], 'deleted:' . (int)$aSingle['id']);
        $this->_oModule->servicePruning();
        $this->assertSame('-1', (string)getParam($CNF['OPTION_BACKFILL']));
        $this->assertCount(1, $this->_ledger($aSingle), 'imported again by the cron');
    }

    public function testPaymentModuleAlerts()
    {
        $aPending = $this->_order('recurring', 'stripe_v3', 'USD', 10);
        $oBuyer = $this->_buyer($this->_server());
        $oBuyer->onPaymentAlert($this->_alert('create_subscription', ['pending' => $aPending, 'subscription' => ['subscription_id' => 'test-rev-sub-p', 'period' => 1, 'period_unit' => 'month', 'status' => 'active']]));
        $this->_transaction($aPending, 10);
        $oBuyer->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $this->_paymentSubscription($aPending, 'test-rev-sub-p', self::NOW);

        // the payment module's own code fires the alerts the ledger listens to
        $oSubscriptions = BxDolModule::getInstance('bx_payment')->getObjectSubscriptions();
        $this->assertTrue($oSubscriptions->overdue($aPending));
        $this->assertSame('unpaid', $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aPending['id'])['status'], 'a failed charge');

        $this->assertTrue($oSubscriptions->cancelLocal($aPending, 'Too slow'));
        $aSbs = $this->_oModule->_oDb->getSubscriptionRow('bx_payment', $aPending['id']);
        $this->assertSame(['canceled', 'Too slow'], [$aSbs['status'], $aSbs['reason']], 'the member\'s reason');
        $this->assertGreaterThan(0, (int)$aSbs['canceled']);
    }

    public function testSales()
    {
        $iSiteAdmin = (int)BxDolPayments::getInstance()->getOption('site_admin');

        // the site's own sale, a vendor's sale of two with a renewal, and a commission the vendor paid
        $this->_ledgerRow(1, ['kind' => 'sale', 'seller_id' => $iSiteAdmin, 'module' => 'test_rev_shop', 'item_id' => 7, 'item_count' => 1, 'amount' => 30]);
        $this->_ledgerRow(2, ['kind' => 'sale', 'seller_id' => self::SELLER, 'module' => 'test_rev_shop', 'item_id' => 8, 'item_count' => 2, 'amount' => 20, 'type' => 'recurring']);
        $this->_ledgerRow(3, ['kind' => 'renewal', 'pending_id' => 987650002, 'seller_id' => self::SELLER, 'module' => 'test_rev_shop', 'item_id' => 8, 'item_count' => 2, 'amount' => 20, 'type' => 'recurring', 'ts' => self::NOW + 60]);
        $this->_ledgerRow(4, ['kind' => 'sale', 'seller_id' => $iSiteAdmin, 'client_id' => self::SELLER, 'module' => 'bx_payment', 'module_id' => $this->_iModuleId, 'item_id' => 1, 'item_count' => 1, 'amount' => 5]);

        $oDb = BxDolDb::getInstance();
        foreach ([['paid', 5], ['unpaid', 7]] as $i => list($sStatus, $fAmount))
            $oDb->query("INSERT INTO `bx_payment_invoices` SET `name` = :name, `commissionaire_id` = :site, `committent_id` = :vendor, `amount` = :amount, `currency` = 'USD', `period_start` = :start, `period_end` = :date, `date_issue` = :date, `date_due` = :due, `status` = :status", [
                'name' => 'test-rev-inv-' . $i, 'site' => $iSiteAdmin, 'vendor' => self::SELLER, 'amount' => $fAmount, 'start' => self::NOW - 30 * 86400, 'date' => self::NOW, 'due' => self::NOW + 7 * 86400, 'status' => $sStatus,
            ]);

        $aFilter = $this->_filter()->get();
        $aFilter['payment'] = 'bx_payment';
        $aSplit = $this->_oModule->_oDb->getRevenueSellers($aFilter, $iSiteAdmin);
        $this->assertEquals([30, 40, 5, 1], [(float)$aSplit['site'], (float)$aSplit['vendors'], (float)$aSplit['commissions'], (int)$aSplit['vendor_count']]);

        $aSales = $this->_oModule->getReports()->getSales($this->_filter(), []);
        $aTiles = array_column($aSales['tiles'], 'value', 'title');
        $this->assertEquals(75.0, $aTiles[_t('_bx_analytics_metric_revenue_net')]);
        $this->assertEquals(40.0, $aTiles[_t('_bx_analytics_metric_sales_vendors')]);
        $this->assertEquals(5.0, $aTiles[_t('_bx_analytics_metric_sales_commissions')]);
        $this->assertSame($iSiteAdmin > 0, isset($aTiles[_t('_bx_analytics_metric_sales_site')]), 'the site\'s own sales when its seller is set');

        $this->assertSame(['net' => 40.0, 'units' => 2, 'orders' => 1, 'renewals' => 1], $aSales['items']['rows'][0]['values']);
        $this->assertSame([[40.0, 1, 1], [35.0, 2, 2]], array_map(function ($a) { return array_values($a['values']); }, $aSales['sellers']['rows']));

        $this->assertSame([2, 1, 1, 0], array_column($aSales['invoices'], 'value'), 'issued, paid, unpaid, overdue');
    }

    public function testAccess()
    {
        // a sale, so the events report has a purchase to show
        $aPending = $this->_order('single', 'stripe_v3', 'USD', 10);
        $this->_transaction($aPending, 10);
        $this->_buyer($this->_server(['HTTP_X_NEO_PLATFORM' => 'ios']))->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $sEvent = 'una|purchase|bx_payment';

        // a guest
        $this->bxBecomeGuest();
        $this->assertSame(403, $this->_oModule->serviceGetReport('revenue')['code']);
        $this->assertSame('', $this->_oModule->serviceGetBlockReport('revenue'));

        // a member whose level may use analytics but not see revenue, like a moderator by default
        $iProfile = (int)BxDolDb::getInstance()->getOne("SELECT `p`.`id` FROM `sys_profiles` AS `p` INNER JOIN `sys_accounts` AS `a` ON `a`.`id` = `p`.`account_id` WHERE (`a`.`role` & :admin) = 0 AND `p`.`type` <> 'system' AND `p`.`status` = 'active' ORDER BY `p`.`id` LIMIT 1", ['admin' => BX_DOL_ROLE_ADMIN]);
        if (!$iProfile)
            $this->markTestSkipped('no member profile to sign in as');

        $GLOBALS['glForceCurrentProfileId'] = $iProfile;
        $this->bxSetLoggedFlags(BX_DOL_ROLE_MEMBER);
        $this->assertSame($iProfile, (int)bx_get_logged_profile_id());
        $this->assertFalse(isAdmin());

        $iLevel = (int)BxDolAcl::getInstance()->getMemberMembershipInfo($iProfile)['id'];
        $this->_grant($iLevel, 'use analytics', true);
        $this->_grant($iLevel, 'view analytics revenue', false);
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowed());
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedRevenue());
        $this->assertFalse($this->_oModule->getReportData('revenue', []));
        $this->assertSame('', $this->_oModule->serviceGetBlockReport('subscriptions'));
        $this->assertSame(403, $this->_oModule->serviceGetReport('sales')['code']);
        $this->assertNotContains('ltv', array_column($this->_oModule->getReports()->getUsers($this->_filter(), [])['columns'], 'key'), 'no lifetime value');
        $aDetail = $this->_oModule->getReports()->getEvents($this->_filter(), ['event' => $sEvent]);
        $this->assertSame(1, $aDetail['tiles'][0]['value']);
        $this->assertSame([], $aDetail['props'], 'a sale\'s properties are revenue');

        // with the revenue permission
        $this->_grant($iLevel, 'view analytics revenue', true);
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedRevenue());
        $this->assertIsArray($this->_oModule->getReportData('revenue', []));
        $this->assertContains('ltv', array_column($this->_oModule->getReports()->getUsers($this->_filter(), [])['columns'], 'key'));
        $this->assertSame(['provider'], array_column($this->_oModule->getReports()->getEvents($this->_filter(), ['event' => $sEvent])['props'], 'caption'));
    }

    public function testCreditsDiscovery()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_credits'))
            $this->markTestSkipped('bx_credits is not installed');

        $oDb = BxDolDb::getInstance();
        foreach ([['purchase', 'in', 100], ['checkout', 'out', 30], ['checkout', 'out', 20], ['grant', 'in', 5]] as $i => list($sType, $sDirection, $fAmount))
            $oDb->query("INSERT INTO `bx_credits_history` SET `first_pid` = :pid, `second_pid` = 0, `amount` = :amount, `type` = :type, `direction` = :direction, `order` = :order, `data` = '', `info` = '', `date` = :date", [
                'pid' => self::CLIENT, 'amount' => $fAmount, 'type' => $sType, 'direction' => $sDirection, 'order' => 'test-rev-c' . $i, 'date' => self::NOW + $i,
            ]);

        $aFilter = $this->_filter()->get();
        $aSources = $this->_oModule->getReports()->getRevenueSources(['from' => $aFilter['from'], 'to' => $aFilter['to'], 'starts' => $aFilter['buckets'], 'limit' => 5], 'credits');
        $this->assertArrayHasKey('bx_credits', $aSources);

        $aMetrics = $aSources['bx_credits']['metrics'];
        $this->assertEquals([100, 50, 5], [$aMetrics['bought']['value'], $aMetrics['spent']['value'], $aMetrics['granted']['value']]);
        $this->assertEquals(50, array_sum($aMetrics['spent']['series']));
        $this->assertSame([['profile_id' => self::CLIENT, 'value' => 50.0]], $aSources['bx_credits']['lists']['top_spenders']['rows']);
        $this->assertArrayNotHasKey('bx_credits', $this->_oModule->getReports()->getRevenueSources(['from' => $aFilter['from'], 'to' => $aFilter['to']], 'money'), 'credits are not money');
    }

    /**
     * One checkout paid with credits, on both sides as a real one is: the credits module's
     * history and the ledger. The block's figures agree, with a platform selected too.
     */
    public function testCreditsBlockAgreesWithTheLedger()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_credits'))
            $this->markTestSkipped('bx_credits is not installed');

        $aPending = $this->_order('single', 'credits', 'USD', 12);
        $this->_transaction($aPending, 12);
        $this->_creditsHistory('checkout', 'out', 12, $aPending['order']);
        $this->_buyer($this->_server())->onPaymentAlert($this->_alert('register_payment', ['pending' => $aPending]));
        $this->assertNotSame('rn-ios', $this->_ledger($aPending)[0]['platform']);

        $oReports = $this->_oModule->getReports();
        $sAllPlatforms = _t('_bx_analytics_txt_credits_all_platforms');
        $sNotInLedger = _t('_bx_analytics_txt_credits_not_in_ledger');

        // a period no other test reads: service results are kept for the request (BxDolService)
        $aCredits = $oReports->getCredits($this->_filter(['from' => '2001-09-07', 'to' => '2001-09-10']), []);
        $aTiles = array_column($aCredits['tiles'], 'value', 'key');
        $this->assertEquals(12.0, $aTiles['spent']);
        $this->assertSame([[12.0, 1]], array_map(function ($a) { return array_values($a['values']); }, $aCredits['spent']['rows']));
        $this->assertNotContains($sAllPlatforms, $aCredits['notes']);
        $this->assertNotContains($sNotInLedger, $aCredits['notes']);

        // another platform: the credits module can't tell, so the whole block is for all of them
        $oFilter = new BxAnalyticsFilter($this->_oModule, ['range' => 'custom', 'from' => '2001-09-07', 'to' => '2001-09-10', 'platform' => 'rn-ios'], self::NOW + 86400);
        $aCredits = $oReports->getCredits($oFilter, []);
        $aTiles = array_column($aCredits['tiles'], 'value', 'key');
        $this->assertEquals(12.0, $aTiles['spent']);
        $this->assertCount(1, $aCredits['spent']['rows'], 'the ledger part is not filtered by platform either');
        $this->assertContains($sAllPlatforms, $aCredits['notes']);
    }

    public function testCreditsSpentOutsideTheLedgerAreExplained()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_credits'))
            $this->markTestSkipped('bx_credits is not installed');

        // a checkout from before the ledger, not imported
        $this->_creditsHistory('checkout', 'out', 25, 'test-rev-old');

        // a period no other test reads: service results are kept for the request (BxDolService)
        $aCredits = $this->_oModule->getReports()->getCredits($this->_filter(['from' => '2001-09-09', 'to' => '2001-09-10']), []);
        $aTiles = array_column($aCredits['tiles'], 'value', 'key');
        $this->assertEquals(25.0, $aTiles['spent']);
        $this->assertSame([], $aCredits['spent']['rows']);
        $this->assertSame(_t('_bx_analytics_txt_no_credit_orders'), $aCredits['spent']['empty']);
        $this->assertContains(_t('_bx_analytics_txt_credits_not_in_ledger'), $aCredits['notes']);
    }

    /*
     * Helpers
     */

    protected function _order($sType, $sProvider, $sCurrency, $fAmount, $aData = ['cur_def' => 'USD'])
    {
        $this->_iOrder++;
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_payment_transactions_pending` SET `client_id` = :client, `seller_id` = :seller, `type` = :type, `provider` = :provider, `items` = :items, `customs` = '', `amount` = :amount, `currency` = :currency, `order` = :order, `data` = :data, `date` = :date, `processed` = 1", [
            'client' => self::CLIENT,
            'seller' => self::SELLER,
            'type' => $sType,
            'provider' => $sProvider,
            'items' => self::SELLER . '_' . $this->_iModuleId . '_1_1',
            'amount' => $fAmount,
            'currency' => $sCurrency,
            'order' => 'test-rev-' . $this->_iOrder . '-' . mt_rand(),
            'data' => serialize($aData),
            'date' => self::NOW,
        ]);
        $iId = (int)$oDb->lastId();
        $this->_aPending[] = $iId;

        return $oDb->getRow("SELECT * FROM `bx_payment_transactions_pending` WHERE `id` = :id", ['id' => $iId]);
    }

    protected function _transaction($aPending, $fAmount, $iDate = self::NOW)
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_payment_transactions` SET `pending_id` = :pending, `client_id` = :client, `seller_id` = :seller, `author_id` = :seller, `module_id` = :module, `item_id` = 1, `item_count` = 1, `amount` = :amount, `currency` = :currency, `license` = 'test-rev', `date` = :date, `new` = 0", [
            'pending' => (int)$aPending['id'],
            'client' => self::CLIENT,
            'seller' => self::SELLER,
            'module' => $this->_iModuleId,
            'amount' => $fAmount,
            'currency' => $aPending['currency'],
            'date' => $iDate,
        ]);

        return (int)$oDb->lastId();
    }

    /**
     * The payment module's subscription of an order.
     */
    protected function _paymentSubscription($aPending, $sSubscriptionId, $iDate)
    {
        BxDolDb::getInstance()->query("INSERT INTO `bx_payment_subscriptions` SET `pending_id` = :pending, `customer_id` = 'test-rev', `subscription_id` = :subscription, `period` = 1, `period_unit` = 'month', `trial` = 0, `date_add` = :date, `date_next` = :next, `status` = 'active'", [
            'pending' => (int)$aPending['id'],
            'subscription' => $sSubscriptionId,
            'date' => $iDate,
            'next' => $iDate + 30 * 86400,
        ]);
    }

    /**
     * A ledger row written directly: `$i` makes its order, pending order and transaction.
     */
    protected function _ledgerRow($i, $aRow)
    {
        $aRow = array_merge([
            'ts' => self::NOW, 'cash' => 1, 'payment' => 'bx_payment', 'pending_id' => 987650000 + $i, 'transaction_id' => 987650000 + $i, 'order' => 'test-rev-l' . $i,
            'module_id' => 0, 'client_id' => self::CLIENT, 'author_id' => 0, 'provider' => 'stripe_v3', 'type' => 'single', 'currency' => 'USD', 'rate' => 1, 'platform' => 'core-web',
        ], $aRow);
        $aRow['amount_default'] = $aRow['amount'];

        $this->assertSame(1, $this->_oModule->_oDb->insertRevenue($aRow));
    }

    /**
     * A row of the credits module's history, for the test client; `$sOrder` must start with
     * `test-rev-` for the cleanup.
     */
    protected function _creditsHistory($sType, $sDirection, $fAmount, $sOrder, $iDate = self::NOW)
    {
        BxDolDb::getInstance()->query("INSERT INTO `bx_credits_history` SET `first_pid` = :pid, `second_pid` = 0, `amount` = :amount, `type` = :type, `direction` = :direction, `order` = :order, `data` = '', `info` = '', `date` = :date", [
            'pid' => self::CLIENT, 'amount' => $fAmount, 'type' => $sType, 'direction' => $sDirection, 'order' => $sOrder, 'date' => $iDate,
        ]);
    }

    protected function _grant($iLevel, $sAction, $bAllowed)
    {
        $oDb = BxDolDb::getInstance();
        $iAction = (int)$oDb->getOne("SELECT `ID` FROM `sys_acl_actions` WHERE `Module` = 'bx_analytics' AND `Name` = :name", ['name' => $sAction]);
        $aBindings = ['level' => (int)$iLevel, 'action' => $iAction];

        $sKey = $iLevel . ':' . $iAction;
        if (!array_key_exists($sKey, $this->_aMatrix))
            $this->_aMatrix[$sKey] = $oDb->getRow("SELECT * FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", $aBindings);

        $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", $aBindings);
        if ($bAllowed)
            $oDb->query("INSERT INTO `sys_acl_matrix` SET `IDLevel` = :level, `IDAction` = :action", $aBindings);

        $oDb->cleanMemoryAll();
    }

    protected function _restoreMatrix()
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aMatrix as $sKey => $aRow) {
            list($iLevel, $iAction) = explode(':', $sKey);
            $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", ['level' => (int)$iLevel, 'action' => (int)$iAction]);
            if (!empty($aRow))
                $oDb->query("INSERT INTO `sys_acl_matrix` SET " . $oDb->arrayToSQL(array_filter($aRow, function ($m) { return $m !== null; })));
        }

        $this->_aMatrix = [];
        $oDb->cleanMemoryAll();
    }

    protected function _deletePayment($aPending)
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("DELETE FROM `bx_payment_transactions` WHERE `pending_id` = :id", ['id' => (int)$aPending['id']]);
        $oDb->query("DELETE FROM `bx_payment_transactions_pending` WHERE `id` = :id", ['id' => (int)$aPending['id']]);
    }

    protected function _ledger($aPending)
    {
        return BxDolDb::getInstance()->getAll("SELECT * FROM `bx_analytics_revenue` WHERE `payment` = 'bx_payment' AND `pending_id` = :id ORDER BY `transaction_id`, `id`", ['id' => (int)$aPending['id']]);
    }

    protected function _alert($sAction, $aExtras, $iSender = self::CLIENT)
    {
        return new BxDolAlerts('system', $sAction, 0, $iSender, array_merge(['module' => 'bx_payment'], $aExtras));
    }

    /**
     * The handler in the buyer's own request: through api.php from NEO, or the classic UI.
     */
    protected function _buyer($aServer, $sPlatform = 'neo', $iNow = self::NOW)
    {
        return new BxAnalyticsRevenue($this->_oModule, new BxAnalyticsRequest($aServer), $iNow, ['api' => $sPlatform == 'neo', 'api_key' => false, 'logged' => self::CLIENT]);
    }

    protected function _server($aExtra = [])
    {
        return array_merge(['REQUEST_METHOD' => 'POST', 'REMOTE_ADDR' => '81.2.69.142', 'HTTP_USER_AGENT' => self::UA_SAFARI], $aExtra);
    }

    protected function _filter($aDates = ['from' => '2001-09-08', 'to' => '2001-09-10'])
    {
        return new BxAnalyticsFilter($this->_oModule, ['range' => 'custom'] + $aDates, self::NOW + 86400);
    }

    protected function _setOption($sName, $sValue)
    {
        if (!array_key_exists($sName, $this->_aOptions))
            $this->_aOptions[$sName] = getParam($sName);

        setParam($sName, $sValue);
    }

    protected function _cleanup()
    {
        $oDb = BxDolDb::getInstance();
        $iTo = self::NOW + 30 * 86400;

        $aPending = array_merge($this->_aPending, $oDb->getColumn("SELECT `id` FROM `bx_payment_transactions_pending` WHERE `order` LIKE 'test-rev-%'"));
        if (!empty($aPending)) {
            $oDb->query("DELETE FROM `bx_payment_transactions` WHERE `pending_id` IN (" . $oDb->implode_escape($aPending) . ")");
            $oDb->query("DELETE FROM `bx_payment_transactions_pending` WHERE `id` IN (" . $oDb->implode_escape($aPending) . ")");
        }
        $oDb->query("DELETE FROM `bx_payment_transactions` WHERE `license` = 'test-rev'");
        $oDb->query("DELETE FROM `bx_payment_subscriptions` WHERE `customer_id` = 'test-rev'");
        $oDb->query("DELETE FROM `bx_payment_subscriptions_deleted` WHERE `customer_id` = 'test-rev'");
        $oDb->query("DELETE FROM `bx_payment_invoices` WHERE `name` LIKE 'test-rev-%'");

        $oDb->query("DELETE FROM `bx_analytics_revenue` WHERE `ts` < :to OR `order` LIKE 'test-rev-%'", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_subscriptions` WHERE `started` < :to OR `subscription_id` LIKE 'test-rev-%'", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_events` WHERE `ts` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_sessions` WHERE `started` < :to", ['to' => $iTo]);
        $oDb->query("DELETE FROM `bx_analytics_salts` WHERE `day` < '2002-01-01'");
        $oDb->query("DELETE FROM `bx_analytics_limits` WHERE `bucket` < 1009843200");
        $this->_oModule->cleanReportCache(); // reports of the test data cached by the run before
        if ($oDb->getOne("SHOW TABLES LIKE 'bx_credits_history'"))
            $oDb->query("DELETE FROM `bx_credits_history` WHERE `order` LIKE 'test-rev-%'");

        $this->_aPending = [];
    }
}
