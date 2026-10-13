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
 * The revenue ledger. Listens to the alerts every payment module fires on the `system` unit
 * and writes one row per money movement: a sale, a renewal, a refund or a reversal of a
 * processed order. Amounts are what the payment module records, also converted to the site's
 * default currency with the rate the order was placed at. Subscriptions are kept beside it,
 * with their price per month (MRR).
 *
 * A subscription with a trial is registered by the payment module when the trial starts, with
 * transactions at the full price although nothing was charged. Those rows are kept with the
 * kind `trial` (amounts for reference only): no revenue sum, count or chart reads them, they
 * are never refunded or reversed, and they make a `trial_start` action with no value instead
 * of a purchase. The first charge after the trial is the order's sale, the later ones renewals.
 *
 * A movement the buyer's own request makes carries the buyer's platform, visit and traffic
 * sources; a webhook or a cron job is the platform `core`. Money is always written; the visit
 * and the sources only when the request could be tracked.
 *
 * Past payments are read in steps through the payment module's paged services (backfill).
 */
class BxAnalyticsRevenue
{
    const KIND_SALE = 'sale';
    const KIND_RENEWAL = 'renewal';
    const KIND_REFUND = 'refund';
    const KIND_REVERSAL = 'reversal';
    const KIND_TRIAL = 'trial';

    const TYPE_SINGLE = 'single';
    const TYPE_RECURRING = 'recurring';

    const STATUS_TRIAL = 'trial';
    const STATUS_ACTIVE = 'active';
    const STATUS_UNPAID = 'unpaid';
    const STATUS_CANCELED = 'canceled';

    const PROVIDER_CREDITS = 'credits';
    const PROVIDER_APPLE = 'apple_in_app';

    /**
     * A payment registered further than this from now is history the alert brought along
     * (renewals of an order recorded before analytics was installed), not something the
     * current request did.
     */
    const LIVE_WINDOW = 86400;

    /**
     * How long an unpaid subscription still counts as paying after its paid period ends: the
     * payment module retries a failed charge for a few days and never cancels it by itself.
     */
    const UNPAID_GRACE = 604800;

    /**
     * Subscription period units per month, for MRR.
     */
    protected static $_aMonthFactors = [
        'year' => 1 / 12,
        'month' => 1,
        'week' => 52 / 12,
        'day' => 365.25 / 12,
        'hour' => 730.5,
        'minute' => 43830,
    ];

    /**
     * Subscription period units in seconds.
     */
    protected static $_aUnitSeconds = [
        'year' => 31557600,
        'month' => 2629800,
        'week' => 604800,
        'day' => 86400,
        'hour' => 3600,
        'minute' => 60,
    ];

    protected $_oModule;
    protected $_oConfig;
    protected $_oDb;
    protected $_oRequest;
    protected $_iNow;

    /**
     * What the request knows that tests set instead: `api` (the request came through
     * api.php), `api_key` (with an accepted API key), `logged` (the signed-in profile).
     */
    protected $_aOptions;

    protected $_oCollector = null;
    protected $_sDefaultCurrency = null;
    protected $_aModuleNames = [];
    protected $_aSources = [];

    public function __construct($oModule, $oRequest = null, $iNow = null, $aOptions = [])
    {
        $this->_oModule = $oModule;
        $this->_oConfig = $oModule->_oConfig;
        $this->_oDb = $oModule->_oDb;
        $this->_oRequest = $oRequest ? $oRequest : new BxAnalyticsRequest();
        $this->_iNow = $iNow ? (int)$iNow : time();
        $this->_aOptions = is_array($aOptions) ? $aOptions : [];
    }

    /*
     * Pure helpers
     */

    /**
     * How many of a period unit make a month, or null for a unit the payment module doesn't use.
     */
    public static function getMonthFactor($sUnit)
    {
        return isset(self::$_aMonthFactors[$sUnit]) ? self::$_aMonthFactors[$sUnit] : null;
    }

    /**
     * Monthly recurring revenue of a price charged every `$iPeriod` units, or null when the
     * price or the unit is unknown.
     */
    public static function getMrr($fAmount, $iPeriod, $sUnit)
    {
        $fFactor = self::getMonthFactor($sUnit);
        if($fAmount === null || $fFactor === null)
            return null;

        return round((float)$fAmount * $fFactor / max(1, (int)$iPeriod), 4);
    }

    /**
     * Length of a subscription period in seconds, or null for a unit the payment module doesn't use.
     */
    public static function getPeriodSeconds($iPeriod, $sUnit)
    {
        return isset(self::$_aUnitSeconds[$sUnit]) ? max(1, (int)$iPeriod) * self::$_aUnitSeconds[$sUnit] : null;
    }

    /**
     * A charge of a subscription with a trial is its registration when it came in the first
     * half of the trial: the payment module registers the order when the trial starts, and
     * the first real charge comes when it ends.
     *
     * @param array $aSubscription ledger subscription row: started, trial (days)
     */
    public static function isTrialRegistration($aSubscription, $iTs)
    {
        $iTrial = !empty($aSubscription['trial']) ? (int)$aSubscription['trial'] : 0;

        return $iTrial > 0 && (int)$iTs < self::getTrialPaidFrom($aSubscription);
    }

    /**
     * The time from which charges of a subscription are paid ones, see isTrialRegistration().
     */
    public static function getTrialPaidFrom($aSubscription)
    {
        $iTrial = !empty($aSubscription['trial']) ? (int)$aSubscription['trial'] : 0;

        return $iTrial > 0 ? (int)$aSubscription['started'] + $iTrial * 43200 : 0;
    }

    /**
     * The rate of an order's currency against the default currency, from the snapshot the
     * payment module stores with the order (`data`: serialized cur_def and cur_rate): 1 for
     * the default currency (today's, whatever it was when the order was placed), the
     * snapshot's rate, or null when the snapshot doesn't tell (no rate, or the site's default
     * currency has changed since).
     */
    public static function getSnapshotRate($sCurrency, $sData, $sDefault)
    {
        if($sCurrency === '' || $sCurrency === $sDefault)
            return 1.0;

        $aData = is_string($sData) && $sData !== '' ? @unserialize($sData, ['allowed_classes' => false]) : [];
        if(!is_array($aData))
            $aData = [];

        $sSnapshotDefault = !empty($aData['cur_def']) && is_string($aData['cur_def']) ? $aData['cur_def'] : $sDefault;
        if($sSnapshotDefault !== $sDefault)
            return null;

        if(!empty($aData['cur_rate']) && is_numeric($aData['cur_rate']) && (float)$aData['cur_rate'] > 0)
            return (float)$aData['cur_rate'];

        return null;
    }

    /**
     * An amount in the default currency, or null without a rate. Rates are quoted against the
     * default currency, so the order's amount is divided by its rate.
     */
    public static function toDefault($fAmount, $mixedRate)
    {
        if($mixedRate === null || (float)$mixedRate <= 0)
            return null;

        return round((float)$fAmount / (float)$mixedRate, 4);
    }

    /**
     * A charge of a recurring order is its sale when it is the order's first charge and a
     * renewal otherwise; every transaction of a single order is a sale. A charge is the
     * transactions one registration wrote (one per item, add-ons included): they share their time.
     *
     * @param int $iChargeTs time of the transaction
     * @param int $iFirstTs time of the order's first charge
     */
    public static function getKind($sType, $iChargeTs, $iFirstTs)
    {
        return $sType == self::TYPE_RECURRING && (int)$iChargeTs != (int)$iFirstTs ? self::KIND_RENEWAL : self::KIND_SALE;
    }

    /**
     * The kind of a charge, trials included: a charge of a recurring order that registered its
     * trial (see isTrialRegistration()) is a `trial`, any other follows getKind() with the
     * order's first paid charge.
     *
     * @param array $aSubscription ledger subscription row (started, trial), [] for none
     * @param int $iFirstPaidTs time of the order's first charge that is not a trial registration
     */
    public static function getChargeKind($sType, $aSubscription, $iChargeTs, $iFirstPaidTs)
    {
        if($sType == self::TYPE_RECURRING && self::isTrialRegistration($aSubscription, $iChargeTs))
            return self::KIND_TRIAL;

        return self::getKind($sType, $iChargeTs, $iFirstPaidTs);
    }

    /**
     * The action a charge of the current request records: a purchase, a renewal, or the start
     * of a trial (with no value, it took no money).
     */
    public static function getActionName($sKind)
    {
        switch($sKind) {
            case self::KIND_RENEWAL:
                return 'renewal';
            case self::KIND_TRIAL:
                return 'trial_start';
        }

        return 'purchase';
    }

    /**
     * Kinds of an order's charges, from its ledger rows (sale, renewal and trial rows; refund and
     * reversal rows are read to leave the charges they negate as they are) and its subscription:
     * [row id => kind] for the rows whose kind differs. Used when the subscription becomes known
     * after its charges were read (the import reads transactions before subscriptions).
     */
    public static function getKindChanges($sType, $aSubscription, $aRows)
    {
        $aNegated = [];
        $iFirst = 0;
        foreach($aRows as $aRow) {
            if(in_array($aRow['kind'], [self::KIND_REFUND, self::KIND_REVERSAL], true))
                $aNegated[(int)$aRow['transaction_id']] = true;
            else if($sType != self::TYPE_RECURRING || !self::isTrialRegistration($aSubscription, (int)$aRow['ts']))
                $iFirst = $iFirst ? min($iFirst, (int)$aRow['ts']) : (int)$aRow['ts'];
        }

        $aChanges = [];
        foreach($aRows as $aRow) {
            if(!in_array($aRow['kind'], [self::KIND_SALE, self::KIND_RENEWAL, self::KIND_TRIAL], true) || isset($aNegated[(int)$aRow['transaction_id']]))
                continue;

            $sKind = self::getChargeKind($sType, $aSubscription, (int)$aRow['ts'], $iFirst);
            if($sKind != $aRow['kind'])
                $aChanges[(int)$aRow['id']] = $sKind;
        }

        return $aChanges;
    }

    /**
     * Module and item of an order's first item, from the payment module's item descriptors
     * (vendor_module_item_count, joined with ":").
     *
     * @return array [module id, item id]
     */
    public static function getFirstItem($sItems)
    {
        $aItems = explode(':', (string)$sItems);
        $aParts = explode('_', (string)reset($aItems));

        return [isset($aParts[1]) ? (int)$aParts[1] : 0, isset($aParts[2]) ? (int)$aParts[2] : 0];
    }

    /*
     * Alerts
     */

    /**
     * A payment alert on the `system` unit: extras carry the payment module's name.
     */
    public function onPaymentAlert($oAlert)
    {
        $aExtras = is_array($oAlert->aExtras) ? $oAlert->aExtras : [];
        $sPayment = isset($aExtras['module']) && is_string($aExtras['module']) && preg_match('/^[a-z0-9_]{1,32}$/', $aExtras['module']) ? $aExtras['module'] : '';
        if($sPayment === '')
            return false;

        $aPending = isset($aExtras['pending']) && is_array($aExtras['pending']) ? $aExtras['pending'] : [];
        $aSubscription = isset($aExtras['subscription']) && is_array($aExtras['subscription']) ? $aExtras['subscription'] : [];

        switch($oAlert->sAction) {
            case 'register_payment':
                return $this->registerPayment($sPayment, $aPending);

            case 'refund_payment':
                return $this->refundPayment($sPayment, $aPending);

            case 'create_subscription':
                return $this->createSubscription($sPayment, $aPending, $aSubscription);

            case 'prolong_subscription':
                return $this->setSubscriptionStatus($sPayment, $aPending, self::STATUS_ACTIVE);

            case 'overdue_subscription':
                return $this->setSubscriptionStatus($sPayment, $aPending, self::STATUS_UNPAID);

            case 'cancel_subscription':
                return $this->cancelSubscription($sPayment, $aPending, $aSubscription, isset($aExtras['reason']) && is_string($aExtras['reason']) ? $aExtras['reason'] : '');

            case 'cancel_order':
                // a pending order never took money
                if(isset($aExtras['type']) && $aExtras['type'] == 'processed' && isset($aExtras['order']) && is_array($aExtras['order']))
                    return $this->reverseTransaction($sPayment, $aExtras['order']);
                return false;

            case 'finalize_checkout':
                return $this->finalizeCheckout($sPayment, $aPending);
        }

        return false;
    }

    /**
     * An order was paid, a subscription charged or its trial registered: every transaction of
     * the order the ledger doesn't have yet. A transaction the current request made gets its
     * context and becomes a purchase, renewal or trial_start event, so goals and funnels can
     * end in a sale or a trial.
     *
     * @return int movements added
     */
    public function registerPayment($sPayment, $aPending)
    {
        $iPendingId = isset($aPending['id']) ? (int)$aPending['id'] : 0;
        if(!$iPendingId)
            return 0;

        // paid before joining: the order gets its client when the account is created
        if(empty($aPending['client_id']) || !isset($aPending['type'])) {
            $aFresh = $this->_getPendingOrder($sPayment, $iPendingId);
            if(!empty($aFresh))
                $aPending = $aFresh;
        }

        $aTransactions = $this->_getTransactions($sPayment, $iPendingId);
        if(empty($aTransactions))
            return 0;

        $aPending['client_id'] = isset($aPending['client_id']) ? (int)$aPending['client_id'] : 0;

        $sType = isset($aPending['type']) ? $aPending['type'] : self::TYPE_SINGLE;
        $fRate = $this->getRate(isset($aPending['currency']) ? (string)$aPending['currency'] : '', isset($aPending['data']) ? $aPending['data'] : '');

        // a renewal brings the whole order along: skip the charges the ledger has
        $aRows = $this->_oDb->getRevenueRows($sPayment, $iPendingId, [self::KIND_SALE, self::KIND_RENEWAL, self::KIND_TRIAL]);
        $aKnown = array_flip(array_map('intval', array_column($aRows, 'transaction_id')));

        $aNew = [];
        foreach($aTransactions as $aTransaction)
            if(!isset($aKnown[(int)$aTransaction['id']]))
                $aNew[] = $aTransaction;
        if(empty($aNew))
            return 0;

        // the subscription tells a trial's registration from a charge: its row is made first
        // when the subscription began before analytics was installed. A subscription's first
        // sale a webhook registers keeps the platform of the buyer's checkout.
        $aSubscription = [];
        if($sType == self::TYPE_RECURRING && $this->_ensureSubscription($sPayment, $aPending))
            $aSubscription = $this->_oDb->getSubscriptionRow($sPayment, $iPendingId);
        $sCheckoutPlatform = !empty($aSubscription['platform']) ? (string)$aSubscription['platform'] : '';

        // the order's first paid charge is the earliest one either side knows (the payment
        // module deletes a transaction its seller cancels, the ledger keeps it); the
        // registration of a trial is not one
        $iFirst = 0;
        foreach($aRows as $aRow)
            if($aRow['kind'] != self::KIND_TRIAL)
                $iFirst = $iFirst ? min($iFirst, (int)$aRow['ts']) : (int)$aRow['ts'];
        foreach($aNew as $aTransaction) {
            $iTs = !empty($aTransaction['date']) ? (int)$aTransaction['date'] : $this->_iNow;
            if(self::getChargeKind($sType, $aSubscription, $iTs, $iTs) != self::KIND_TRIAL)
                $iFirst = $iFirst ? min($iFirst, $iTs) : $iTs;
        }

        $iAdded = 0;
        $aLive = [];
        $aPaid = [];
        foreach($aNew as $aTransaction) {
            $iTs = !empty($aTransaction['date']) ? (int)$aTransaction['date'] : $this->_iNow;
            $sKind = self::getChargeKind($sType, $aSubscription, $iTs, $iFirst);
            $bLive = abs($this->_iNow - $iTs) <= self::LIVE_WINDOW;

            // a trial starts at the checkout, like a sale
            $sContextKind = $sKind == self::KIND_TRIAL ? self::KIND_SALE : $sKind;
            $aContext = $bLive ? $this->getContext((int)$aPending['client_id'], isset($aPending['provider']) ? $aPending['provider'] : '', $sContextKind, $iTs, $sContextKind == self::KIND_SALE ? $sCheckoutPlatform : '') : $this->_getImportContext((int)$aPending['client_id'], $iTs);
            $aRow = $this->_getLedgerRow($sPayment, $aPending, $aTransaction, $sKind, $iTs, $fRate, $aContext);
            if(!$this->_oDb->insertRevenue($aRow))
                continue;

            $iAdded++;
            if($sKind != self::KIND_TRIAL)
                $aPaid[$iTs] = $iTs;
            if($bLive)
                $aLive[] = [$aRow, $aContext];
        }

        // the registration of a trial took no money: the subscription pays from its first charge
        if(!empty($aPaid) && $sType == self::TYPE_RECURRING)
            $this->_oDb->addSubscriptionPayments($sPayment, $iPendingId, count($aPaid), min($aPaid), max($aPaid));

        // no amounts or order numbers in the properties: the events report shows them to
        // everyone who may use analytics, revenue or not
        foreach($aLive as list($aRow, $aContext))
            if($aContext['track'])
                $this->_getCollector()->collectAction(self::getActionName($aRow['kind']), $aRow['module'], $aRow['item_id'], $aRow['client_id'], [
                    'platform' => $aContext['platform'],
                    'api_key' => $this->_isApiKey(),
                    // decided by getContext: a webhook or a cron job is not the buyer's request
                    'request' => $aContext['buyer'],
                    'value' => $aRow['kind'] != self::KIND_TRIAL && $aRow['amount_default'] !== null ? (float)$aRow['amount_default'] : 0,
                    'props' => [
                        'provider' => $aRow['provider'],
                    ],
                ]);

        return $iAdded;
    }

    /**
     * An order was refunded. The payment module has deleted its transactions by now, so the
     * ledger negates its own rows: every sale of a single order, and only the latest charge of
     * a recurring one (the provider refunds one charge). A refund keeps the platform and the
     * sources of the sale it takes back, so net revenue per source stays right. A transaction
     * its seller already cancelled (a reversal) is not taken back again, a trial's registration
     * took no money and is never taken back (a refund during the trial adds nothing), and an
     * order is refunded once: the payment module deletes it.
     *
     * @return int movements added
     */
    public function refundPayment($sPayment, $aPending)
    {
        $iPendingId = isset($aPending['id']) ? (int)$aPending['id'] : 0;
        if(!$iPendingId)
            return 0;

        $aNegated = [];
        foreach($this->_oDb->getRevenueRows($sPayment, $iPendingId, [self::KIND_REFUND, self::KIND_REVERSAL]) as $aRow) {
            if($aRow['kind'] == self::KIND_REFUND)
                return 0;

            $aNegated[(int)$aRow['transaction_id']] = true;
        }

        $aRows = [];
        foreach($this->_oDb->getRevenueRows($sPayment, $iPendingId, [self::KIND_SALE, self::KIND_RENEWAL]) as $aRow)
            if(!isset($aNegated[(int)$aRow['transaction_id']]))
                $aRows[] = $aRow;

        if(empty($aRows))
            return 0;

        // the latest charge: every item of it
        if(isset($aPending['type']) && $aPending['type'] == self::TYPE_RECURRING) {
            $iLast = max(array_map('intval', array_column($aRows, 'ts')));
            $aRows = array_filter($aRows, function($aRow) use ($iLast) { return (int)$aRow['ts'] == $iLast; });
        }

        $iAdded = 0;
        foreach($aRows as $aRow)
            $iAdded += $this->_insertNegation($aRow, self::KIND_REFUND);

        return $iAdded;
    }

    /**
     * A processed order (one transaction) was cancelled by its seller: the money goes back.
     */
    public function reverseTransaction($sPayment, $aOrder)
    {
        $iTransactionId = isset($aOrder['id']) ? (int)$aOrder['id'] : 0;
        if(!$iTransactionId)
            return 0;

        $aRow = $this->_oDb->getRevenueRow($sPayment, $iTransactionId, [self::KIND_SALE, self::KIND_RENEWAL]);
        if(empty($aRow) || !empty($this->_oDb->getRevenueRow($sPayment, $iTransactionId, [self::KIND_REFUND, self::KIND_REVERSAL])))
            return 0;

        return $this->_insertNegation($aRow, self::KIND_REVERSAL);
    }

    /**
     * A subscription was registered: its plan and price per month.
     */
    public function createSubscription($sPayment, $aPending, $aSubscription)
    {
        $iPendingId = isset($aPending['id']) ? (int)$aPending['id'] : 0;
        if(!$iPendingId)
            return false;

        $aContext = $this->getContext(isset($aPending['client_id']) ? (int)$aPending['client_id'] : 0, isset($aPending['provider']) ? $aPending['provider'] : '', self::KIND_SALE, $this->_iNow);

        $aRow = $this->_getSubscriptionRow($sPayment, $aPending, $aSubscription);
        $aRow['started'] = $this->_iNow;
        $aRow['platform'] = $aContext['platform'];

        return $this->_oDb->saveSubscriptionRow($aRow);
    }

    public function setSubscriptionStatus($sPayment, $aPending, $sStatus)
    {
        $iPendingId = isset($aPending['id']) ? (int)$aPending['id'] : 0;
        if(!$iPendingId || !$this->_ensureSubscription($sPayment, $aPending))
            return false;

        $aRow = $this->_oDb->getSubscriptionRow($sPayment, $iPendingId);
        if(!empty($aRow['canceled']))
            return false;

        return $this->_oDb->updateSubscriptionRow($sPayment, $iPendingId, ['status' => $sStatus]) > 0;
    }

    /**
     * A subscription was cancelled, with the reason the member or the provider gave.
     */
    public function cancelSubscription($sPayment, $aPending, $aSubscription, $sReason = '')
    {
        $iPendingId = isset($aPending['id']) ? (int)$aPending['id'] : 0;
        if(!$iPendingId)
            return false;

        if(empty($this->_oDb->getSubscriptionRow($sPayment, $iPendingId))) {
            $aRow = $this->_getSubscriptionRow($sPayment, $aPending, $aSubscription);
            $aRow['started'] = !empty($aSubscription['date_add']) ? (int)$aSubscription['date_add'] : $this->_iNow;
            $this->_oDb->saveSubscriptionRow($aRow);
        }

        return $this->_oDb->updateSubscriptionRow($sPayment, $iPendingId, [
            'status' => self::STATUS_CANCELED,
            'canceled' => $this->_iNow,
            'reason' => get_mb_substr(trim($sReason), 0, 255),
        ]) > 0;
    }

    /**
     * The buyer finished the checkout in their own request: the order's rows a webhook
     * registered first get the buyer's platform, visit and sources.
     */
    public function finalizeCheckout($sPayment, $aPending)
    {
        $iPendingId = isset($aPending['id']) ? (int)$aPending['id'] : 0;
        if(!$iPendingId)
            return 0;

        $iClientId = isset($aPending['client_id']) ? (int)$aPending['client_id'] : 0;
        $aContext = $this->getContext($iClientId, '', self::KIND_SALE, $this->_iNow);
        if(!$aContext['buyer'])
            return 0;

        $aSet = ['platform' => $aContext['platform']];
        if($aContext['link'])
            $aSet = array_merge($aSet, ['session_id' => $aContext['session_id']], $this->_getSourceColumns($aContext));

        $iUpdated = $this->_oDb->updateRevenueContext($sPayment, $iPendingId, $aSet);

        $aSubscription = $this->_oDb->getSubscriptionRow($sPayment, $iPendingId);
        if(!empty($aSubscription) && in_array($aSubscription['platform'], ['', BX_ANALYTICS_PLATFORM_CORE], true))
            $this->_oDb->updateSubscriptionRow($sPayment, $iPendingId, ['platform' => $aContext['platform']]);

        return $iUpdated;
    }

    /*
     * Context and conversion
     */

    /**
     * Who made a movement and how: the buyer's own request has its platform (and, when it can
     * be tracked, the running visit); anything else (a webhook, a cron job, a seller or an
     * administrator acting on the order) is the platform `core`. An Apple in-app sale outside
     * the buyer's request still came from the iOS app, and so does a sale whose checkout
     * platform is known (`$sCheckoutPlatform`, the subscription's, when its first charge
     * comes by webhook). Traffic sources come from the buyer's first visit and the latest one
     * before the movement.
     *
     * @return array platform, buyer (it is the buyer's request), track (the action may be
     *      recorded), link (the member may be linked to visits), session_id, first and last
     *      (channel, referrer_host, utm_campaign)
     */
    public function getContext($iClientId, $sProvider, $sKind, $iTs, $sCheckoutPlatform = '')
    {
        $iClientId = (int)$iClientId;
        $bApiKey = $this->_isApiKey();

        $sPlatform = $this->_oRequest->getPlatform($this->_isApi(), $bApiKey);
        $bBuyer = $sPlatform != BX_ANALYTICS_PLATFORM_CORE && $iClientId && $this->_getLoggedProfileId() == $iClientId;
        if(!$bBuyer) {
            if($sKind == self::KIND_SALE && $sCheckoutPlatform !== '' && $sCheckoutPlatform != BX_ANALYTICS_PLATFORM_CORE)
                $sPlatform = $sCheckoutPlatform;
            else
                $sPlatform = $sProvider == self::PROVIDER_APPLE && $sKind == self::KIND_SALE ? BX_ANALYTICS_PLATFORM_RN_IOS : BX_ANALYTICS_PLATFORM_CORE;
        }

        $bTrack = $this->_getCollector()->isTracked($sPlatform, $iClientId, $bApiKey, $bBuyer);
        $bLink = $bTrack && $iClientId && $this->_oConfig->isLinkMembers();

        $aContext = [
            'platform' => $sPlatform,
            'buyer' => $bBuyer,
            'track' => $bTrack,
            'link' => $bLink,
            'session_id' => 0,
            'first' => [],
            'last' => [],
        ];

        if(!$bLink)
            return $aContext;

        if($bBuyer) {
            $aSession = $this->_getCollector()->getRequestSession($sPlatform, $iClientId, $bApiKey);
            if(!empty($aSession) && (int)$aSession['profile_id'] == $iClientId)
                $aContext['session_id'] = (int)$aSession['id'];
        }

        return array_merge($aContext, $this->_getSources($iClientId, $iTs));
    }

    /**
     * The rate of an order's currency against the default one: the order's own snapshot, or
     * today's rate when the snapshot has none, or null when no rate is known.
     */
    public function getRate($sCurrency, $sData)
    {
        $sDefault = $this->getDefaultCurrency();
        $mixedRate = self::getSnapshotRate((string)$sCurrency, $sData, $sDefault);
        if($mixedRate !== null)
            return $mixedRate;

        if($sDefault === '' || $sCurrency === '')
            return null;

        $mixedConverted = BxDolPayments::getInstance()->convert(1, $sDefault, $sCurrency);

        return is_numeric($mixedConverted) && (float)$mixedConverted > 0 ? (float)$mixedConverted : null;
    }

    public function getDefaultCurrency()
    {
        if($this->_sDefaultCurrency === null) {
            $oPayments = BxDolPayments::getInstance();
            $this->_sDefaultCurrency = $oPayments->isActive() ? (string)$oPayments->getCurrencyCode() : '';
        }

        return $this->_sDefaultCurrency;
    }

    /*
     * Import of past payments
     */

    /**
     * Read past transactions, then subscriptions, from the active payment module a page at a
     * time until the deadline. The cursors are saved after every page, so the next step (the
     * hourly cron, or the Studio button) continues where this one stopped; rows the ledger has
     * already are skipped. Refunded orders can't be imported: the payment module deleted them.
     *
     * @param int $iDeadline unix time to stop by
     * @return array the import status, see getBackfillStatus()
     */
    public function backfill($iDeadline)
    {
        $CNF = &$this->_oConfig->CNF;

        $sPayment = $this->_getActivePayment();
        if($sPayment === '' || !bx_is_srv($sPayment, 'get_transactions_after', 'Orders'))
            return $this->getBackfillStatus();

        while(time() < $iDeadline) {
            $sCursor = (string)getParam($CNF['OPTION_BACKFILL']);
            if($sCursor !== '' && (int)$sCursor >= 0) {
                $aRows = bx_srv_ic($sPayment, 'get_transactions_after', [(int)$sCursor, $CNF['BACKFILL_PAGE']], 'Orders');
                if(empty($aRows) || !is_array($aRows)) {
                    setParam($CNF['OPTION_BACKFILL'], '-1');
                    if((string)getParam($CNF['OPTION_BACKFILL_SBS']) === '')
                        setParam($CNF['OPTION_BACKFILL_SBS'], 'active:0');
                    continue;
                }

                $this->importTransactions($sPayment, $aRows);
                $aLast = end($aRows);
                setParam($CNF['OPTION_BACKFILL'], (string)(int)$aLast['id']);
                continue;
            }

            $sCursor = (string)getParam($CNF['OPTION_BACKFILL_SBS']);
            if(!preg_match('/^(active|deleted):(\d+)$/', $sCursor, $aMatch) || !bx_is_srv($sPayment, 'get_subscriptions_after', 'Subscriptions'))
                break;

            $bDeleted = $aMatch[1] == 'deleted';
            $aRows = bx_srv_ic($sPayment, 'get_subscriptions_after', [(int)$aMatch[2], $CNF['BACKFILL_PAGE'], $bDeleted], 'Subscriptions');
            if(empty($aRows) || !is_array($aRows)) {
                setParam($CNF['OPTION_BACKFILL_SBS'], $bDeleted ? '-1' : 'deleted:0');
                continue;
            }

            $this->importSubscriptions($sPayment, $aRows, $bDeleted);
            $aLast = end($aRows);
            setParam($CNF['OPTION_BACKFILL_SBS'], $aMatch[1] . ':' . (int)$aLast['pending_id']);
        }

        return $this->getBackfillStatus();
    }

    /**
     * Start the import over: every past payment is read again, and the ones the ledger has
     * are skipped.
     */
    public function restartBackfill()
    {
        setParam($this->_oConfig->CNF['OPTION_BACKFILL'], '0');
        setParam($this->_oConfig->CNF['OPTION_BACKFILL_SBS'], '');
    }

    /**
     * @param bool $bCount count the rows the import wrote (it reads the whole ledger)
     * @return array state (unavailable: no payment module; running; done), imported (rows
     *      the import wrote, 0 unless counted), cursor (the last transaction read)
     */
    public function getBackfillStatus($bCount = false)
    {
        $CNF = &$this->_oConfig->CNF;

        $sPayment = $this->_getActivePayment();
        if($sPayment === '' || !bx_is_srv($sPayment, 'get_transactions_after', 'Orders'))
            return ['state' => 'unavailable', 'imported' => 0, 'cursor' => 0];

        $sCursor = (string)getParam($CNF['OPTION_BACKFILL']);
        $sSbs = (string)getParam($CNF['OPTION_BACKFILL_SBS']);
        $bDone = ($sCursor === '' || (int)$sCursor < 0) && !preg_match('/^(active|deleted):\d+$/', $sSbs);

        return [
            'state' => $bDone ? 'done' : 'running',
            'imported' => $bCount ? $this->_oDb->getRevenueImportedCount($sPayment) : 0,
            'cursor' => max(0, (int)$sCursor),
        ];
    }

    /**
     * Past transactions into the ledger, with the time they were registered and no platform.
     * A transaction the ledger has as a sale, a renewal or a trial is skipped whatever its kind,
     * and kinds follow the same rule as live payments (see registerPayment()) with the
     * subscriptions the ledger has. The import reads transactions before subscriptions, so the
     * trial of a subscription the ledger doesn't have yet is applied when importSubscriptions()
     * reads it.
     *
     * @return int movements added
     */
    public function importTransactions($sPayment, $aRows)
    {
        $aTypes = [];
        foreach($aRows as $aRow)
            $aTypes[(int)$aRow['pending_id']] = !empty($aRow['type']) ? $aRow['type'] : self::TYPE_SINGLE;

        // trials of the recurring orders on this page: [pending id => started, trial]
        $aTrials = $this->_oDb->getSubscriptionTrials($sPayment, array_keys(array_filter($aTypes, function($sType) { return $sType == self::TYPE_RECURRING; })));

        $aFirst = [];
        foreach($aRows as $aRow) {
            $iPendingId = (int)$aRow['pending_id'];
            $aSubscription = isset($aTrials[$iPendingId]) ? $aTrials[$iPendingId] : [];
            if(self::getChargeKind($aTypes[$iPendingId], $aSubscription, (int)$aRow['date'], (int)$aRow['date']) != self::KIND_TRIAL)
                $aFirst[$iPendingId] = isset($aFirst[$iPendingId]) ? min($aFirst[$iPendingId], (int)$aRow['date']) : (int)$aRow['date'];
        }

        // a renewal on this page may belong to an order whose sale the ledger already has
        foreach($this->_oDb->getRevenueFirstCharges($sPayment, array_keys($aTypes)) as $iPendingId => $iTs)
            $aFirst[(int)$iPendingId] = isset($aFirst[(int)$iPendingId]) ? min($aFirst[(int)$iPendingId], (int)$iTs) : (int)$iTs;

        $aKnown = array_flip($this->_oDb->getRevenueCharged($sPayment, array_column($aRows, 'id')));

        $iAdded = 0;
        foreach($aRows as $aRow) {
            if(isset($aKnown[(int)$aRow['id']]))
                continue;

            $aPending = [
                'id' => (int)$aRow['pending_id'],
                'client_id' => (int)$aRow['client_id'],
                'type' => !empty($aRow['type']) ? $aRow['type'] : self::TYPE_SINGLE,
                'provider' => isset($aRow['provider']) ? (string)$aRow['provider'] : '',
                'order' => isset($aRow['order']) ? (string)$aRow['order'] : '',
                'currency' => !empty($aRow['pending_currency']) ? $aRow['pending_currency'] : (isset($aRow['currency']) ? $aRow['currency'] : ''),
                'data' => isset($aRow['data']) ? $aRow['data'] : '',
            ];

            $iTs = (int)$aRow['date'];
            $sKind = self::getChargeKind($aPending['type'], isset($aTrials[$aPending['id']]) ? $aTrials[$aPending['id']] : [], $iTs, isset($aFirst[$aPending['id']]) ? $aFirst[$aPending['id']] : 0);
            $fRate = $this->getRate($aPending['currency'], $aPending['data']);

            $iAdded += $this->_oDb->insertRevenue($this->_getLedgerRow($sPayment, $aPending, $aRow, $sKind, $iTs, $fRate, $this->_getImportContext((int)$aRow['client_id'], $iTs)));
        }

        return $iAdded;
    }

    /**
     * Past subscriptions, current or cancelled, with their payments taken from the ledger. The
     * charges of a subscription with a trial follow its trial: the import read them before it
     * knew it (see importTransactions()).
     */
    public function importSubscriptions($sPayment, $aRows, $bDeleted)
    {
        $iImported = 0;
        foreach($aRows as $aRow) {
            if(empty($aRow['pending_id']) || (isset($aRow['type']) && $aRow['type'] != self::TYPE_RECURRING))
                continue;

            $aPending = [
                'id' => (int)$aRow['pending_id'],
                'client_id' => (int)$aRow['client_id'],
                'seller_id' => (int)$aRow['seller_id'],
                'provider' => (string)$aRow['provider'],
                'items' => (string)$aRow['items'],
                'amount' => (float)$aRow['amount'],
                'currency' => (string)$aRow['currency'],
                'data' => (string)$aRow['data'],
            ];

            $aSubscription = $this->_getSubscriptionRow($sPayment, $aPending, $aRow);
            $aTrial = ['trial' => $aSubscription['trial'], 'started' => (int)$aRow['date_add']];
            if($aTrial['trial'] > 0)
                foreach(self::getKindChanges(self::TYPE_RECURRING, $aTrial, $this->_oDb->getRevenueRows($sPayment, $aPending['id'])) as $iId => $sKind)
                    $this->_oDb->updateRevenueKind($iId, $sKind);

            $aPaid = $this->_oDb->getRevenuePaid($sPayment, $aPending['id'], self::getTrialPaidFrom($aTrial));

            $iImported += (int)$this->_oDb->importSubscriptionRow(array_merge($aSubscription, [
                'status' => $bDeleted ? self::STATUS_CANCELED : $aSubscription['status'],
                'started' => (int)$aRow['date_add'],
                'first_paid' => (int)$aPaid['first'],
                'last_paid' => (int)$aPaid['last'],
                'paid_count' => (int)$aPaid['count'],
                'canceled' => $bDeleted ? max(1, (int)$aRow['deleted']) : 0,
                'reason' => $bDeleted ? get_mb_substr((string)$aRow['reason'], 0, 255) : '',
                'platform' => '',
            ]));
        }

        return $iImported;
    }

    /*
     * Internals
     */

    /**
     * A ledger row for a transaction of an order.
     */
    protected function _getLedgerRow($sPayment, $aPending, $aTransaction, $sKind, $iTs, $fRate, $aContext)
    {
        $iModuleId = (int)$aTransaction['module_id'];
        $sProvider = isset($aPending['provider']) ? (string)$aPending['provider'] : (isset($aTransaction['provider']) ? (string)$aTransaction['provider'] : '');
        $sCurrency = !empty($aTransaction['currency']) ? (string)$aTransaction['currency'] : (!empty($aPending['currency']) ? (string)$aPending['currency'] : $this->getDefaultCurrency());
        $fAmount = round((float)$aTransaction['amount'], 4);

        return array_merge([
            'ts' => (int)$iTs,
            'kind' => $sKind,
            'cash' => $sProvider == self::PROVIDER_CREDITS ? 0 : 1,
            'payment' => $sPayment,
            'pending_id' => !empty($aTransaction['pending_id']) ? (int)$aTransaction['pending_id'] : (int)$aPending['id'],
            'transaction_id' => (int)$aTransaction['id'],
            'order' => get_mb_substr(isset($aPending['order']) ? (string)$aPending['order'] : (isset($aTransaction['order']) ? (string)$aTransaction['order'] : ''), 0, 32),
            'module_id' => $iModuleId,
            'module' => $this->_getModuleName($iModuleId),
            'item_id' => max(0, (int)$aTransaction['item_id']),
            'item_count' => max(0, (int)$aTransaction['item_count']),
            'seller_id' => max(0, (int)$aTransaction['seller_id']),
            'author_id' => max(0, (int)$aTransaction['author_id']),
            'client_id' => max(0, !empty($aTransaction['client_id']) ? (int)$aTransaction['client_id'] : (isset($aPending['client_id']) ? (int)$aPending['client_id'] : 0)),
            'provider' => get_mb_substr($sProvider, 0, 32),
            'type' => isset($aPending['type']) ? (string)$aPending['type'] : self::TYPE_SINGLE,
            'amount' => $fAmount,
            'currency' => get_mb_substr($sCurrency, 0, 4),
            // 0: no rate known, the amount isn't converted
            'rate' => $fRate !== null ? $fRate : 0,
            'amount_default' => self::toDefault($fAmount, $fRate),
            'platform' => $aContext['platform'],
            'session_id' => (int)$aContext['session_id'],
        ], $this->_getSourceColumns($aContext));
    }

    /**
     * A refund or reversal of a ledger row: the same order, item and sources, negative amounts.
     */
    protected function _insertNegation($aRow, $sKind)
    {
        unset($aRow['id']);

        return $this->_oDb->insertRevenue(array_merge($aRow, [
            'ts' => $this->_iNow,
            'kind' => $sKind,
            'amount' => -abs((float)$aRow['amount']),
            'amount_default' => $aRow['amount_default'] !== null ? -abs((float)$aRow['amount_default']) : null,
            'session_id' => 0,
        ]));
    }

    /**
     * A subscription row from an order and the payment module's subscription.
     */
    protected function _getSubscriptionRow($sPayment, $aPending, $aSubscription)
    {
        list($iModuleId, $iItemId) = self::getFirstItem(isset($aPending['items']) ? $aPending['items'] : '');

        $iPeriod = max(1, isset($aSubscription['period']) ? (int)$aSubscription['period'] : 1);
        $sUnit = isset($aSubscription['period_unit']) ? (string)$aSubscription['period_unit'] : '';
        $fAmount = self::toDefault(isset($aPending['amount']) ? (float)$aPending['amount'] : 0, $this->getRate(isset($aPending['currency']) ? (string)$aPending['currency'] : '', isset($aPending['data']) ? $aPending['data'] : ''));

        $sStatus = isset($aSubscription['status']) ? (string)$aSubscription['status'] : '';
        if(!in_array($sStatus, [self::STATUS_TRIAL, self::STATUS_ACTIVE, self::STATUS_UNPAID, self::STATUS_CANCELED], true))
            $sStatus = self::STATUS_UNPAID;

        return [
            'payment' => $sPayment,
            'pending_id' => (int)$aPending['id'],
            'subscription_id' => get_mb_substr(isset($aSubscription['subscription_id']) ? (string)$aSubscription['subscription_id'] : '', 0, 32),
            'client_id' => isset($aPending['client_id']) ? max(0, (int)$aPending['client_id']) : 0,
            'seller_id' => isset($aPending['seller_id']) ? max(0, (int)$aPending['seller_id']) : 0,
            'module_id' => $iModuleId,
            'module' => $this->_getModuleName($iModuleId),
            'item_id' => $iItemId,
            'provider' => get_mb_substr(isset($aPending['provider']) ? (string)$aPending['provider'] : '', 0, 32),
            'period' => $iPeriod,
            'period_unit' => get_mb_substr($sUnit, 0, 16),
            'trial' => isset($aSubscription['trial']) ? max(0, (int)$aSubscription['trial']) : 0,
            'amount_default' => $fAmount,
            'mrr_default' => self::getMrr($fAmount, $iPeriod, $sUnit),
            'status' => $sStatus,
        ];
    }

    /**
     * The ledger's row for a subscription, created from the payment module's when the
     * subscription began before analytics was installed.
     */
    protected function _ensureSubscription($sPayment, $aPending)
    {
        $iPendingId = (int)$aPending['id'];
        if(!empty($this->_oDb->getSubscriptionRow($sPayment, $iPendingId)))
            return true;

        $aSubscription = [];
        if(bx_is_srv($sPayment, 'get_subscriptions_info', 'Subscriptions')) {
            $aList = bx_srv_ic($sPayment, 'get_subscriptions_info', [['pending_id' => $iPendingId]], 'Subscriptions');
            if(!empty($aList) && is_array($aList))
                $aSubscription = reset($aList);
        }

        if(empty($aPending['items']) || !isset($aPending['amount'])) {
            $aFresh = $this->_getPendingOrder($sPayment, $iPendingId);
            if(!empty($aFresh))
                $aPending = $aFresh;
        }

        $aRow = $this->_getSubscriptionRow($sPayment, $aPending, is_array($aSubscription) ? $aSubscription : []);
        $aRow['started'] = !empty($aSubscription['date_add']) ? (int)$aSubscription['date_add'] : $this->_iNow;

        return $this->_oDb->saveSubscriptionRow($aRow);
    }

    /**
     * Context of a movement read from history: no platform and no visit, sources when the
     * member's visits may be linked.
     */
    protected function _getImportContext($iClientId, $iTs)
    {
        $aContext = ['platform' => '', 'buyer' => false, 'track' => false, 'link' => false, 'session_id' => 0, 'first' => [], 'last' => []];
        if(!$iClientId || !$this->_oConfig->isLinkMembers() || !$this->_getCollector()->isTracked(BX_ANALYTICS_PLATFORM_CORE, $iClientId, false, false))
            return $aContext;

        return array_merge($aContext, $this->_getSources($iClientId, $iTs));
    }

    protected function _getSources($iClientId, $iTs)
    {
        $sKey = $iClientId . ':' . $iTs;
        if(!isset($this->_aSources[$sKey]))
            $this->_aSources[$sKey] = $this->_oDb->getSessionSources($iClientId, $iTs);

        return $this->_aSources[$sKey];
    }

    protected function _getSourceColumns($aContext)
    {
        $aColumns = [];
        foreach(['first', 'last'] as $sWhich) {
            $aSource = !empty($aContext[$sWhich]) && is_array($aContext[$sWhich]) ? $aContext[$sWhich] : [];
            $aColumns[$sWhich . '_channel'] = isset($aSource['channel']) ? (string)$aSource['channel'] : '';
            $aColumns[$sWhich . '_referrer_host'] = isset($aSource['referrer_host']) ? (string)$aSource['referrer_host'] : '';
            $aColumns[$sWhich . '_utm_campaign'] = isset($aSource['utm_campaign']) ? (string)$aSource['utm_campaign'] : '';
        }

        return $aColumns;
    }

    protected function _getModuleName($iModuleId)
    {
        $iModuleId = (int)$iModuleId;
        if(!$iModuleId)
            return '';

        if(!isset($this->_aModuleNames[$iModuleId])) {
            $aModule = BxDolModuleQuery::getInstance()->getModuleById($iModuleId);
            $this->_aModuleNames[$iModuleId] = !empty($aModule['name']) ? get_mb_substr($aModule['name'], 0, 32) : '';
        }

        return $this->_aModuleNames[$iModuleId];
    }

    /**
     * Transactions of an order from the payment module that reported it.
     */
    protected function _getTransactions($sPayment, $iPendingId)
    {
        if(!bx_is_srv($sPayment, 'get_orders_info', 'Orders'))
            return [];

        $aRows = bx_srv_ic($sPayment, 'get_orders_info', [['pending_id' => (int)$iPendingId]], 'Orders');

        return is_array($aRows) ? $aRows : [];
    }

    protected function _getPendingOrder($sPayment, $iPendingId)
    {
        if(!bx_is_srv($sPayment, 'get_pending_orders_info', 'Orders'))
            return [];

        $aRows = bx_srv_ic($sPayment, 'get_pending_orders_info', [['id' => (int)$iPendingId]], 'Orders');

        return !empty($aRows) && is_array($aRows) ? reset($aRows) : [];
    }

    protected function _getActivePayment()
    {
        $oPayments = BxDolPayments::getInstance();

        return $oPayments->isActive() ? (string)$oPayments->getActive() : '';
    }

    protected function _getCollector()
    {
        if($this->_oCollector === null)
            $this->_oCollector = new BxAnalyticsCollector($this->_oModule, $this->_oRequest, $this->_iNow);

        return $this->_oCollector;
    }

    protected function _getLoggedProfileId()
    {
        return array_key_exists('logged', $this->_aOptions) ? (int)$this->_aOptions['logged'] : (int)bx_get_logged_profile_id();
    }

    protected function _isApi()
    {
        return array_key_exists('api', $this->_aOptions) ? (bool)$this->_aOptions['api'] : defined('BX_API');
    }

    protected function _isApiKey()
    {
        return array_key_exists('api_key', $this->_aOptions) ? (bool)$this->_aOptions['api_key'] : $this->_oModule->isApiKeyRequest();
    }
}

/** @} */
