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

bx_import('BxDolModuleConfig');

define('BX_ANALYTICS_PLATFORM_CORE_WEB', 'core-web');
define('BX_ANALYTICS_PLATFORM_NEXT_WEB', 'next-web');
define('BX_ANALYTICS_PLATFORM_RN_IOS', 'rn-ios');
define('BX_ANALYTICS_PLATFORM_RN_ANDROID', 'rn-android');
define('BX_ANALYTICS_PLATFORM_API', 'api');
define('BX_ANALYTICS_PLATFORM_CORE', 'core');

define('BX_ANALYTICS_IDENTITY_COOKIELESS', 'cookieless');
define('BX_ANALYTICS_IDENTITY_PERSISTENT', 'persistent');

define('BX_ANALYTICS_GEO_NONE', 'none');
define('BX_ANALYTICS_GEO_HEADERS', 'headers');

// hit and event types: pageviews, custom events, page leaves (engaged time), site actions
define('BX_ANALYTICS_HIT_PAGEVIEW', 'pageview');
define('BX_ANALYTICS_HIT_EVENT', 'event');
define('BX_ANALYTICS_HIT_LEAVE', 'leave');
define('BX_ANALYTICS_HIT_UNA', 'una');

// health hits: a client error, and a page's web vitals (or an app screen's load times); they
// are stored apart from events and never start a visit
define('BX_ANALYTICS_HIT_ERROR', 'error');
define('BX_ANALYTICS_HIT_VITALS', 'vitals');

class BxAnalyticsConfig extends BxBaseModGeneralConfig
{
    /**
     * Where hits come from, as code => language key. Codes are stored with every session and
     * event, so they never change; a new client is a new code.
     * - core-web: the classic UNA web UI (PHP and HTML)
     * - next-web, rn-ios, rn-android: NEO on the web (Next.js) and its React Native apps
     * - api: any other client calling api.php directly
     * - core: the server itself, with no client request behind it (cron, background jobs)
     */
    protected $_aPlatforms = [
        BX_ANALYTICS_PLATFORM_CORE_WEB => '_bx_analytics_platform_core_web',
        BX_ANALYTICS_PLATFORM_NEXT_WEB => '_bx_analytics_platform_next_web',
        BX_ANALYTICS_PLATFORM_RN_IOS => '_bx_analytics_platform_rn_ios',
        BX_ANALYTICS_PLATFORM_RN_ANDROID => '_bx_analytics_platform_rn_android',
        BX_ANALYTICS_PLATFORM_API => '_bx_analytics_platform_api',
        BX_ANALYTICS_PLATFORM_CORE => '_bx_analytics_platform_core',
    ];

    /**
     * Platforms that run in a browser, where the user agent tells the browser and the device.
     */
    protected $_aBrowserPlatforms = [
        BX_ANALYTICS_PLATFORM_CORE_WEB,
        BX_ANALYTICS_PLATFORM_NEXT_WEB,
    ];

    /**
     * Native apps, which report their system and device themselves.
     */
    protected $_aAppPlatforms = [
        BX_ANALYTICS_PLATFORM_RN_IOS,
        BX_ANALYTICS_PLATFORM_RN_ANDROID,
    ];

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = [
            'TABLE_SESSIONS' => $aModule['db_prefix'] . 'sessions',
            'TABLE_EVENTS' => $aModule['db_prefix'] . 'events',
            'TABLE_SALTS' => $aModule['db_prefix'] . 'salts',
            'TABLE_BOTS' => $aModule['db_prefix'] . 'bots',
            'TABLE_BOT_PAGES' => $aModule['db_prefix'] . 'bot_pages',
            'TABLE_GOALS' => $aModule['db_prefix'] . 'goals',
            'TABLE_FUNNELS' => $aModule['db_prefix'] . 'funnels',
            'TABLE_REVENUE' => $aModule['db_prefix'] . 'revenue',
            'TABLE_SUBSCRIPTIONS' => $aModule['db_prefix'] . 'subscriptions',
            'TABLE_ERRORS' => $aModule['db_prefix'] . 'errors',
            'TABLE_ERROR_HITS' => $aModule['db_prefix'] . 'error_hits',
            'TABLE_VITALS' => $aModule['db_prefix'] . 'vitals',

            // import of past payments: the cursors, rows read per service call, and the time
            // one step may take in the hourly cron and from the Studio button
            'OPTION_BACKFILL' => 'bx_analytics_revenue_backfill',
            'OPTION_BACKFILL_SBS' => 'bx_analytics_revenue_backfill_sbs',
            'BACKFILL_PAGE' => 500,
            'BACKFILL_SECONDS' => 10,

            // funnel steps at most
            'MAX_FUNNEL_STEPS' => 6,

            // Query: values drawn on the chart, and rows in a CSV download at most
            'QUERY_SERIES_VALUES' => 5,
            'MAX_EXPORT_ROWS' => 10000,

            // hits per request and their properties, to bound the work of one beacon
            'MAX_HITS_PER_REQUEST' => 20,
            'MAX_PROPS_LENGTH' => 2048,

            // health: error hits per request and per visit, new error groups per hour (more go
            // to one catch-all group), how old a deferred error may be (an app that crashed
            // sends it on the next launch), and vitals hits per request
            'MAX_ERRORS_PER_REQUEST' => 10,
            'MAX_ERRORS_PER_SESSION' => 50,
            'MAX_NEW_ERROR_GROUPS_PER_HOUR' => 200,
            'MAX_ERROR_AGE' => 7 * 86400,
            'MAX_VITALS_PER_REQUEST' => 1,

            // vitals thresholds, metric => [good up to, poor above]: milliseconds, and CLS in
            // thousandths (the web.dev and Lighthouse values; app screens and starts by RN guides)
            'VITALS' => [
                'lcp' => [2500, 4000],
                'inp' => [200, 500],
                'cls' => [100, 250],
                'fcp' => [1800, 3000],
                'ttfb' => [800, 1800],
                'screen_load' => [1000, 2500],
                'app_start' => [2000, 4000],
            ],

            // engaged time above this on one page is a tab left open, not reading
            'MAX_ENGAGED_MS' => 30 * 60 * 1000,

            // rows deleted per query when pruning, and the time one pruning run may take
            'PRUNING_BATCH' => 5000,
            'PRUNING_SECONDS' => 20,
        ];

        $this->_aJsClasses = [
            'analytics' => 'BxAnalytics',
            'dashboard' => 'BxAnalyticsDashboard',
            'tools' => 'BxAnalyticsStudioTools',
        ];
        $this->_aJsObjects = [
            'analytics' => 'oAnalytics',
            'dashboard' => 'oBxAnalyticsDashboard',
            'tools' => 'oBxAnalyticsStudioTools',
        ];
    }

    public function getPlatforms()
    {
        return $this->_aPlatforms;
    }

    public function isPlatform($sPlatform)
    {
        return is_string($sPlatform) && isset($this->_aPlatforms[$sPlatform]);
    }

    public function isBrowserPlatform($sPlatform)
    {
        return in_array($sPlatform, $this->_aBrowserPlatforms, true);
    }

    public function isAppPlatform($sPlatform)
    {
        return in_array($sPlatform, $this->_aAppPlatforms, true);
    }

    public function isTrackingEnabled()
    {
        return getParam('bx_analytics_tracking') == 'on';
    }

    public function isPlatformEnabled($sPlatform)
    {
        return $this->isPlatform($sPlatform) && in_array($sPlatform, $this->_getList('bx_analytics_platforms'), true);
    }

    public function getSessionTimeout()
    {
        return 60 * max(1, (int)getParam('bx_analytics_session_timeout'));
    }

    public function getOnlineWindow()
    {
        return 60 * max(1, (int)getParam('bx_analytics_online_window'));
    }

    public function getIdentityMode()
    {
        return getParam('bx_analytics_identity') == BX_ANALYTICS_IDENTITY_PERSISTENT ? BX_ANALYTICS_IDENTITY_PERSISTENT : BX_ANALYTICS_IDENTITY_COOKIELESS;
    }

    public function isLinkMembers()
    {
        return getParam('bx_analytics_link_members') == 'on';
    }

    public function isTrackActions()
    {
        return getParam('bx_analytics_track_actions') == 'on';
    }

    public function isTrackBots()
    {
        return getParam('bx_analytics_track_bots') == 'on';
    }

    public function isRespectDnt()
    {
        return getParam('bx_analytics_respect_dnt') == 'on';
    }

    public function getExcludedLevels()
    {
        return array_map('intval', $this->_getList('bx_analytics_exclude_levels'));
    }

    public function getExcludedIps()
    {
        return $this->_getList('bx_analytics_exclude_ips');
    }

    public function getExcludedPaths()
    {
        return $this->_getList('bx_analytics_exclude_paths');
    }

    /**
     * Query parameters left out of stored paths, as patterns with * for any characters.
     */
    public function getIgnoredParams()
    {
        return $this->_getList('bx_analytics_ignore_params');
    }

    public function getTrustedProxies()
    {
        return $this->_getList('bx_analytics_trusted_proxies');
    }

    public function getGeoSource()
    {
        return getParam('bx_analytics_geo_source') == BX_ANALYTICS_GEO_HEADERS ? BX_ANALYTICS_GEO_HEADERS : BX_ANALYTICS_GEO_NONE;
    }

    public function getRetentionDays()
    {
        return max(1, (int)getParam('bx_analytics_retention_days'));
    }

    public function isTrackErrors()
    {
        return getParam('bx_analytics_track_errors') == 'on';
    }

    public function isTrackVitals()
    {
        return getParam('bx_analytics_track_vitals') == 'on';
    }

    /**
     * Percent of page loads that measure vitals, 0 to 100; the client samples.
     */
    public function getVitalsSample()
    {
        return min(100, max(0, (int)getParam('bx_analytics_vitals_sample')));
    }

    /**
     * Error messages that are not stored, one pattern per line with * for any characters.
     * Lines, not commas: messages have spaces and commas.
     */
    public function getErrorsIgnore()
    {
        $sValue = trim((string)getParam('bx_analytics_errors_ignore'));
        if($sValue === '')
            return [];

        return array_values(array_filter(array_map('trim', preg_split('/\R/u', $sValue)), 'strlen'));
    }

    /**
     * Vitals are kept for this many days, at most as long as the rest.
     */
    public function getVitalsRetentionDays()
    {
        return min($this->getRetentionDays(), max(1, (int)getParam('bx_analytics_vitals_retention_days')));
    }

    /**
     * Hosts that belong to the site: a referrer from one of them isn't a traffic source.
     */
    public function getInternalHosts()
    {
        $aHosts = [parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST)];

        /**
         * @hooks
         * @hookdef hook-bx_analytics-get_internal_hosts 'bx_analytics', 'get_internal_hosts' - hook to add the hosts of other clients (NEO web, white-label domains) whose referrers are internal
         * - $unit_name - equals `bx_analytics`
         * - $action - equals `get_internal_hosts`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `hosts` - [array] by ref, list of host names, can be overridden in hook processing
         * @hook @ref hook-bx_analytics-get_internal_hosts
         */
        bx_alert($this->getName(), 'get_internal_hosts', 0, 0, [
            'hosts' => &$aHosts,
        ]);

        return array_filter($aHosts);
    }

    /**
     * Values of a list setting, which Studio stores comma separated; text settings may use lines too.
     */
    protected function _getList($sName)
    {
        $sValue = trim((string)getParam($sName));
        if($sValue === '')
            return [];

        return array_values(array_filter(array_map('trim', preg_split('/[\s,]+/', $sValue)), 'strlen'));
    }
}

/** @} */
