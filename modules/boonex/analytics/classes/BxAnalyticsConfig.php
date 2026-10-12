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

            // hits per request and their properties, to bound the work of one beacon
            'MAX_HITS_PER_REQUEST' => 20,
            'MAX_PROPS_LENGTH' => 2048,

            // engaged time above this on one page is a tab left open, not reading
            'MAX_ENGAGED_MS' => 30 * 60 * 1000,

            // rows deleted per query when pruning, and the time one pruning run may take
            'PRUNING_BATCH' => 5000,
            'PRUNING_SECONDS' => 20,
        ];

        $this->_aJsClasses = [
            'analytics' => 'BxAnalytics',
            'dashboard' => 'BxAnalyticsDashboard',
        ];
        $this->_aJsObjects = [
            'analytics' => 'oAnalytics',
            'dashboard' => 'oBxAnalyticsDashboard',
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
