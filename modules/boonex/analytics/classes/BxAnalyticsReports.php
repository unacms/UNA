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
 * Report data as plain arrays. The classic templates, Studio and the NEO elements all render
 * from these, so a number means the same thing everywhere.
 *
 * Every report is a method get<Report>(BxAnalyticsFilter $oFilter, array $aParams) that returns
 * an array, or false when the parameters name nothing it knows.
 */
class BxAnalyticsReports
{
    /**
     * Tabbed top lists: group => [tab => dimension]. A block shows one group.
     */
    protected $_aGroups = [
        'pages' => ['pages' => 'path', 'titles' => 'title', 'entry' => 'entry_path', 'exit' => 'exit_path', 'hostnames' => 'hostname'],
        'sources' => ['referrers' => 'referrer_host', 'channels' => 'channel', 'utm_source' => 'utm_source', 'utm_medium' => 'utm_medium', 'utm_campaign' => 'utm_campaign'],
        'locations' => ['countries' => 'country', 'regions' => 'region', 'cities' => 'city', 'languages' => 'language'],
        'devices' => ['browsers' => 'browser', 'devices' => 'device', 'os' => 'os', 'screens' => 'screen'],
        'platforms' => ['platforms' => 'platform', 'apps' => 'app', 'app_versions' => 'app_version'],
    ];

    /**
     * Full tables with every metric: table => [tab => dimension].
     */
    protected $_aTables = [
        'pages' => ['pages' => 'path', 'titles' => 'title', 'entry' => 'entry_path', 'exit' => 'exit_path', 'hostnames' => 'hostname'],
        'sources' => ['referrers' => 'referrer_host', 'referrer_urls' => 'referrer', 'channels' => 'channel', 'utm_source' => 'utm_source', 'utm_medium' => 'utm_medium', 'utm_campaign' => 'utm_campaign', 'utm_term' => 'utm_term', 'utm_content' => 'utm_content'],
    ];

    protected $_aMetrics = ['visitors', 'sessions', 'pageviews', 'pages_per_session', 'bounce_rate', 'duration'];

    protected $_iPerPage = 25;

    protected $_oModule;
    protected $_oDb;
    protected $_oConfig;

    protected $_aCountries;

    public function __construct($oModule)
    {
        $this->_oModule = $oModule;
        $this->_oDb = $oModule->_oDb;
        $this->_oConfig = $oModule->_oConfig;
    }

    public function getGroups()
    {
        return $this->_aGroups;
    }

    public function isGroup($sGroup)
    {
        return isset($this->_aGroups[$sGroup]);
    }

    public function getMetrics()
    {
        return $this->_aMetrics;
    }

    /**
     * The filter bar: active dimension filters with readable values, and visitors online.
     */
    public function getFilters(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aFilter = $oFilter->get();

        $aChips = [];
        foreach($aFilter['dims'] as $sName => $sValue)
            $aChips[] = [
                'name' => $sName,
                'value' => $sValue,
                'title' => _t('_bx_analytics_dim_' . $sName),
                'label' => $this->getLabel($sName, $sValue),
            ];

        $aOnline = $this->_oDb->getOnline(time() - $this->_oConfig->getOnlineWindow());

        return [
            'chips' => $aChips,
            'online' => $aFilter['platform'] !== '' ? (isset($aOnline[$aFilter['platform']]) ? (int)$aOnline[$aFilter['platform']] : 0) : (int)array_sum($aOnline),
            'window' => (int)($this->_oConfig->getOnlineWindow() / 60),
        ];
    }

    /**
     * KPIs with the change against the previous period, and the series for the chart.
     */
    public function getOverview(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aFilter = $oFilter->get();

        $aCurrent = $this->_getKpis($this->_oDb->getTotals($aFilter));
        $aPrevious = $this->_getKpis($this->_oDb->getTotals($oFilter->getPrevious()));

        $aKpis = [];
        foreach($this->_aMetrics as $sMetric)
            $aKpis[$sMetric] = [
                'value' => $aCurrent[$sMetric],
                'previous' => $aPrevious[$sMetric],
                'change' => $this->_change($aCurrent[$sMetric], $aPrevious[$sMetric]),
            ];

        $aRows = $this->_oDb->getSeries($aFilter, $aFilter['bucket'], $aFilter['offset'], $aFilter['starts']);

        // the bucket that holds "now" is still filling up, and the chart draws it dashed
        $aSeries = [];
        $aBuckets = $aFilter['buckets'];
        foreach($aBuckets as $i => $iBucket) {
            $iNext = isset($aBuckets[$i + 1]) ? $aBuckets[$i + 1] : $aFilter['to'];
            $aKpi = $this->_getKpis(isset($aRows[$iBucket]) ? $aRows[$iBucket] : []);
            $aSeries[] = array_merge([
                't' => $iBucket,
                'future' => $iBucket > $aFilter['now'],
                'partial' => $iBucket <= $aFilter['now'] && $aFilter['now'] < $iNext,
            ], $aKpi);
        }

        return [
            'kpis' => $aKpis,
            'series' => $aSeries,
            'bucket' => $aFilter['bucket'],
            'from' => $aFilter['from'],
            'to' => $aFilter['to'],
            'tz' => $aFilter['tz'],
        ];
    }

    /**
     * One tab of a top list, with labels, shares and the filter each row applies when clicked.
     * Params: group, tab (or tab_<group>), limit.
     */
    public function getTop(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $sGroup = $this->_param($aParams, 'group');
        if(!isset($this->_aGroups[$sGroup]))
            return false;

        $sTab = $this->_getTab($aParams, $sGroup, $this->_aGroups[$sGroup]);
        $sDimension = $this->_aGroups[$sGroup][$sTab];
        $iLimit = isset($aParams['limit']) ? max(1, min(100, (int)$aParams['limit'])) : 10;

        $aRows = $this->_oDb->getTop($oFilter->get(), $sDimension, $iLimit);

        $iMax = 0;
        $iTotal = 0;
        foreach($aRows as $aRow) {
            $iMax = max($iMax, (int)$aRow['visitors']);
            $iTotal += (int)$aRow['visitors'];
        }

        $aItems = [];
        foreach($aRows as $aRow)
            $aItems[] = [
                'value' => (string)$aRow['value'],
                'label' => $this->getLabel($sDimension, (string)$aRow['value']),
                'visitors' => (int)$aRow['visitors'],
                'pageviews' => (int)$aRow['pageviews'],
                'share' => $iTotal ? round(100 * $aRow['visitors'] / $iTotal, 1) : 0,
                'bar' => $iMax ? round(100 * $aRow['visitors'] / $iMax, 1) : 0,
            ];

        return [
            'group' => $sGroup,
            'tab' => $sTab,
            'tabs' => $this->_getTabs($this->_aGroups[$sGroup], $sTab),
            'dimension' => $sDimension,
            'column' => _t('_bx_analytics_tab_' . $sTab),
            'items' => $aItems,
        ];
    }

    /**
     * A full table of a dimension with every metric, a page at a time.
     * Params: table (pages, sources), tab (or tab_<table>), page (or page_<table>).
     */
    public function getTable(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $sTable = $this->_param($aParams, 'table');
        if(!isset($this->_aTables[$sTable]))
            return false;

        $sTab = $this->_getTab($aParams, $sTable, $this->_aTables[$sTable]);
        $sDimension = $this->_aTables[$sTable][$sTab];
        $aFilter = $oFilter->get();

        $iTotal = $this->_oDb->getTopCount($aFilter, $sDimension);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page', $this->_param($aParams, 'page_' . $sTable, 1))));
        $iStart = ($iPage - 1) * $this->_iPerPage;

        if($this->_oDb->isEventDimension($sDimension)) {
            $aRows = $this->_oDb->getPageStats($aFilter, $sDimension, $this->_iPerPage, $iStart);
            $aColumns = [
                ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_tab_' . $sTab)],
                ['key' => 'visitors', 'type' => 'number', 'title' => _t('_bx_analytics_metric_visitors')],
                ['key' => 'pageviews', 'type' => 'number', 'title' => _t('_bx_analytics_metric_pageviews')],
                ['key' => 'engaged', 'type' => 'engaged', 'title' => _t('_bx_analytics_metric_engaged')],
            ];
            if($sDimension == 'path')
                $aColumns = array_merge($aColumns, [
                    ['key' => 'entries', 'type' => 'number', 'title' => _t('_bx_analytics_metric_entries')],
                    ['key' => 'bounce_rate', 'type' => 'percent', 'title' => _t('_bx_analytics_metric_bounce_rate')],
                    ['key' => 'exits', 'type' => 'number', 'title' => _t('_bx_analytics_metric_exits')],
                ]);
        }
        else {
            $aRows = [];
            foreach($this->_oDb->getTop($aFilter, $sDimension, $this->_iPerPage, $iStart) as $aRow)
                $aRows[] = array_merge($aRow, $this->_getKpis($aRow));

            $aColumns = [
                ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_tab_' . $sTab)],
                ['key' => 'visitors', 'type' => 'number', 'title' => _t('_bx_analytics_metric_visitors')],
                ['key' => 'sessions', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sessions')],
                ['key' => 'bounce_rate', 'type' => 'percent', 'title' => _t('_bx_analytics_metric_bounce_rate')],
                ['key' => 'pages_per_session', 'type' => 'decimal', 'title' => _t('_bx_analytics_metric_pages_per_session')],
                ['key' => 'duration', 'type' => 'duration', 'title' => _t('_bx_analytics_metric_duration')],
            ];
        }

        $iMax = 0;
        foreach($aRows as $aRow)
            $iMax = max($iMax, (int)$aRow['visitors']);

        $aResult = [];
        foreach($aRows as $aRow)
            $aResult[] = [
                'label' => $this->getLabel($sDimension, (string)$aRow['value']),
                'filter' => ['dim' => $sDimension, 'value' => (string)$aRow['value']],
                'bar' => $iMax ? round(100 * $aRow['visitors'] / $iMax, 1) : 0,
                'values' => $aRow,
            ];

        return [
            'name' => $sTable,
            'caption' => _t('_bx_analytics_group_' . $sTable),
            'tab' => $sTab,
            'tabs' => $this->_getTabs($this->_aTables[$sTable], $sTab),
            'dimension' => $sDimension,
            'columns' => $aColumns,
            'rows' => $aResult,
            'page' => $iPage,
            'pages' => $iPages,
            'total' => $iTotal,
        ];
    }

    /**
     * Visitors online now, per platform, pageviews per minute over the last 30 minutes, and
     * the latest pageviews.
     */
    public function getRealtime(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $iNow = time();
        $sPlatform = $oFilter->get()['platform'];

        $aOnline = $this->_oDb->getOnline($iNow - $this->_oConfig->getOnlineWindow());
        $aPlatforms = [];
        $iTotal = 0;
        foreach($this->_oConfig->getPlatforms() as $sCode => $sTitle) {
            $iCount = isset($aOnline[$sCode]) ? (int)$aOnline[$sCode] : 0;
            $iTotal += $iCount;
            if($iCount)
                $aPlatforms[] = ['value' => $sCode, 'label' => _t($sTitle), 'visitors' => $iCount];
        }
        foreach($aPlatforms as $i => $a)
            $aPlatforms[$i]['share'] = $iTotal ? round(100 * $a['visitors'] / $iTotal, 1) : 0;

        $iMinutes = 30;
        $iStart = (int)(floor($iNow / 60) * 60) - ($iMinutes - 1) * 60;
        $aPerMinute = $this->_oDb->getPageviewsPerMinute($iStart, $sPlatform);
        $aMinutes = [];
        for($i = 0; $i < $iMinutes; $i++) {
            $iMinute = $iStart + $i * 60;
            $aMinutes[] = ['t' => $iMinute, 'pageviews' => isset($aPerMinute[$iMinute]) ? (int)$aPerMinute[$iMinute] : 0];
        }

        $iLimit = isset($aParams['limit']) ? max(0, min(50, (int)$aParams['limit'])) : 20;
        $aRecent = [];
        $aRows = $iLimit > 0 ? $this->_oDb->getRecentPageviews($iNow - $iMinutes * 60, $iLimit, $sPlatform) : [];
        foreach($aRows as $aRow)
            $aRecent[] = [
                'ts' => (int)$aRow['ts'],
                'platform' => $aRow['platform'],
                'platform_label' => $this->getLabel('platform', $aRow['platform']),
                'path' => $aRow['path'],
                'title' => $aRow['title'],
                'country' => $aRow['country'],
                'country_label' => $this->getLabel('country', $aRow['country']),
                'city' => $aRow['city'],
                'device' => $this->getLabel('device', $aRow['device']),
                'browser' => $aRow['browser'],
                'os' => $aRow['os'],
                'member' => (int)$aRow['profile_id'] > 0,
            ];

        return [
            'online' => $sPlatform !== '' ? (isset($aOnline[$sPlatform]) ? (int)$aOnline[$sPlatform] : 0) : $iTotal,
            'platforms' => $aPlatforms,
            'minutes' => $aMinutes,
            'recent' => $aRecent,
            'window' => (int)($this->_oConfig->getOnlineWindow() / 60),
        ];
    }

    /**
     * Visitors on a map: per country at the country's centre, and per place where the edge
     * gave coordinates. Tabs: the period, or live (the last 30 minutes).
     */
    public function getMap(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        bx_import('Geo', $this->_oModule->_aModule);

        $aTabs = ['period' => 'period', 'live' => 'live'];
        $sTab = $this->_getTab($aParams, 'map', $aTabs);

        $aFilter = $oFilter->get();
        if($sTab == 'live') {
            $aFilter['from'] = time() - 30 * 60;
            $aFilter['to'] = time() + 60;
        }

        $aCountries = [];
        $iMax = 0;
        $iUnknown = 0;
        foreach($this->_oDb->getTop($aFilter, 'country', 250) as $aRow) {
            $aCenter = BxAnalyticsGeo::getCenter($aRow['value']);
            if(!$aCenter) {
                $iUnknown += (int)$aRow['visitors'];
                continue;
            }

            $iMax = max($iMax, (int)$aRow['visitors']);
            $aCountries[] = [
                'country' => $aRow['value'],
                'label' => $this->getLabel('country', $aRow['value']),
                'visitors' => (int)$aRow['visitors'],
                'lat' => $aCenter[0],
                'lng' => $aCenter[1],
            ];
        }

        $aPoints = [];
        foreach($this->_oDb->getMapPoints($aFilter) as $aRow)
            $aPoints[] = [
                'label' => trim($aRow['city'] . ($aRow['country'] !== '' ? ', ' . $this->getLabel('country', $aRow['country']) : ''), ', '),
                'visitors' => (int)$aRow['visitors'],
                'lat' => (float)$aRow['lat'],
                'lng' => (float)$aRow['lng'],
            ];

        $iTotal = array_sum(array_column($aCountries, 'visitors'));
        foreach($aCountries as $i => $a) {
            $aCountries[$i]['share'] = $iTotal ? round(100 * $a['visitors'] / $iTotal, 1) : 0;
            $aCountries[$i]['bar'] = $iMax ? round(100 * $a['visitors'] / $iMax, 1) : 0;
        }

        return [
            'tab' => $sTab,
            'tabs' => array_map(function($sName) use ($sTab) {
                return ['name' => $sName, 'title' => _t('_bx_analytics_tab_map_' . $sName), 'active' => $sName == $sTab];
            }, array_keys($aTabs)),
            'countries' => $aCountries,
            'points' => $aPoints,
            'unknown' => $iUnknown,
            'provider' => getParam('sys_location_leaflet_provider'),
        ];
    }

    /**
     * Bots and agents: totals, hits per day by category, the bots and the pages they ask for.
     * Tabs narrow it to a category; AI covers crawlers and assistants fetching for a person.
     */
    public function getBots(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        bx_import('UserAgent', $this->_oModule->_aModule);

        $aCategories = [
            'all' => [],
            'ai' => [BxAnalyticsUserAgent::BOT_AI_CRAWLER, BxAnalyticsUserAgent::BOT_AI_AGENT],
            'search' => [BxAnalyticsUserAgent::BOT_SEARCH],
            'social' => [BxAnalyticsUserAgent::BOT_SOCIAL],
            'seo' => [BxAnalyticsUserAgent::BOT_SEO],
            'monitor' => [BxAnalyticsUserAgent::BOT_MONITOR],
            'script' => [BxAnalyticsUserAgent::BOT_SCRIPT, BxAnalyticsUserAgent::BOT_FEED, BxAnalyticsUserAgent::BOT_OTHER],
        ];
        $sTab = $this->_getTab($aParams, 'bots', $aCategories);
        $aIn = $aCategories[$sTab];
        $aFilter = $oFilter->get();

        $aTotals = $this->_oDb->getBotTotals($aFilter, $aIn);
        $aAi = $this->_oDb->getBotTotals($aFilter, $aCategories['ai']);
        $aHumans = $this->_oDb->getTotals(array_merge($aFilter, ['dims' => []]));
        $iHits = (int)$aTotals['hits'];
        $iAll = $sTab == 'all' ? $iHits : (int)$this->_oDb->getBotTotals($aFilter)['hits'];

        $aTiles = [
            ['title' => _t('_bx_analytics_metric_bot_hits'), 'value' => $iHits, 'type' => 'number'],
            ['title' => _t('_bx_analytics_metric_bots'), 'value' => (int)$aTotals['bots'], 'type' => 'number'],
            ['title' => _t('_bx_analytics_metric_ai_hits'), 'value' => (int)$aAi['hits'], 'type' => 'number'],
            ['title' => _t('_bx_analytics_metric_bot_share'), 'value' => $iAll + (int)$aHumans['pageviews'] ? round(100 * $iAll / ($iAll + (int)$aHumans['pageviews']), 1) : 0, 'type' => 'percent'],
        ];

        // hits per day and category, every day of the period
        $aDays = [];
        for($i = (int)$aFilter['from']; $i < (int)$aFilter['to'] && count($aDays) < 800; $i += 86400)
            $aDays[gmdate('Y-m-d', $i)] = true;
        $aDays = array_keys($aDays);

        $aSeries = [];
        foreach($this->_oDb->getBotSeries($aFilter) as $aRow)
            if(empty($aIn) || in_array($aRow['category'], $aIn, true))
                $aSeries[$aRow['category']][$aRow['day']] = (int)$aRow['hits'];

        $aDatasets = [];
        foreach($aSeries as $sCategory => $aValues)
            $aDatasets[] = [
                'key' => $sCategory,
                'label' => _t('_bx_analytics_bot_' . $sCategory),
                'values' => array_map(function($sDay) use ($aValues) { return isset($aValues[$sDay]) ? $aValues[$sDay] : 0; }, $aDays),
            ];

        $iTotal = $this->_oDb->getBotListCount($aFilter, $aIn);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_bot_list', 1)));

        $aBots = $this->_oDb->getBotList($aFilter, $aIn, $this->_iPerPage, ($iPage - 1) * $this->_iPerPage);
        $iMax = 1;
        foreach($aBots as $aBot)
            $iMax = max($iMax, (int)$aBot['hits']);

        $aRows = [];
        foreach($aBots as $aBot)
            $aRows[] = [
                'label' => $aBot['bot'],
                'sub' => _t('_bx_analytics_bot_' . $aBot['category']),
                'bar' => round(100 * $aBot['hits'] / $iMax, 1),
                'values' => [
                    'hits' => (int)$aBot['hits'],
                    'last_seen' => (int)$aBot['last_seen'],
                    'platforms' => implode(', ', array_map(function($s) { return $this->getLabel('platform', $s); }, explode(',', (string)$aBot['platforms']))),
                ],
            ];

        $aPagesRows = [];
        $aPages = $this->_oDb->getBotPages($aFilter, $aIn, 10);
        $iMaxPage = 1;
        foreach($aPages as $aPage)
            $iMaxPage = max($iMaxPage, (int)$aPage['hits']);
        foreach($aPages as $aPage)
            $aPagesRows[] = [
                'label' => $aPage['path'],
                'bar' => round(100 * $aPage['hits'] / $iMaxPage, 1),
                'values' => ['hits' => (int)$aPage['hits']],
            ];

        return [
            'tab' => $sTab,
            'tabs' => $this->_getTabs(array_flip(array_keys($aCategories)), $sTab, '_bx_analytics_tab_bots_'),
            'tiles' => $aTiles,
            'chart' => [
                'kind' => 'stacked',
                'labels' => array_map(function($sDay) { return strtotime($sDay . ' 00:00:00 UTC'); }, $aDays),
                'bucket' => 'day',
                'tz' => 'UTC',
                'datasets' => $aDatasets,
            ],
            'bots' => [
                'name' => 'bot_list',
                'caption' => _t('_bx_analytics_lmi_cpt_bots'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_bot')],
                    ['key' => 'hits', 'type' => 'number', 'title' => _t('_bx_analytics_metric_bot_hits')],
                    ['key' => 'platforms', 'type' => 'text', 'title' => _t('_bx_analytics_dim_platform')],
                    ['key' => 'last_seen', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_last_seen')],
                ],
                'rows' => $aRows,
                'page' => $iPage,
                'pages' => $iPages,
                'empty' => _t('_bx_analytics_txt_no_bots'),
            ],
            'pages' => [
                'name' => 'bot_pages',
                'caption' => _t('_bx_analytics_txt_bot_pages'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_tab_pages')],
                    ['key' => 'hits', 'type' => 'number', 'title' => _t('_bx_analytics_metric_bot_hits')],
                ],
                'rows' => $aPagesRows,
                'empty' => _t('_bx_analytics_txt_no_bots'),
            ],
        ];
    }

    /**
     * A human name for a stored dimension value.
     */
    public function getLabel($sDimension, $sValue)
    {
        if($sValue === '')
            return _t($sDimension == 'referrer_host' || $sDimension == 'referrer' ? '_bx_analytics_txt_direct' : '_bx_analytics_txt_unknown');

        switch($sDimension) {
            case 'platform':
                $aPlatforms = $this->_oConfig->getPlatforms();
                return isset($aPlatforms[$sValue]) ? _t($aPlatforms[$sValue]) : $sValue;

            case 'channel':
                return _t('_bx_analytics_channel_' . $sValue);

            case 'device':
                return _t('_bx_analytics_device_' . $sValue);

            case 'country':
                if($this->_aCountries === null)
                    $this->_aCountries = BxDolFormQuery::getDataItems('Country');
                return isset($this->_aCountries[$sValue]) ? $this->_aCountries[$sValue] : $sValue;
        }

        return $sValue;
    }

    /**
     * Report metrics from summed session columns.
     */
    protected function _getKpis($aRow)
    {
        $iVisitors = isset($aRow['visitors']) ? (int)$aRow['visitors'] : 0;
        $iSessions = isset($aRow['sessions']) ? (int)$aRow['sessions'] : 0;
        $iPageviews = isset($aRow['pageviews']) ? (int)$aRow['pageviews'] : 0;
        $iBounces = isset($aRow['bounces']) ? (int)$aRow['bounces'] : 0;
        $iDuration = isset($aRow['duration']) ? (int)$aRow['duration'] : 0;

        return [
            'visitors' => $iVisitors,
            'sessions' => $iSessions,
            'pageviews' => $iPageviews,
            'pages_per_session' => $iSessions ? round($iPageviews / $iSessions, 2) : 0,
            'bounce_rate' => $iSessions ? round(100 * $iBounces / $iSessions, 1) : 0,
            'duration' => $iSessions ? (int)round($iDuration / $iSessions) : 0,
        ];
    }

    /**
     * The tab a report shows: `tab`, or `tab_<name>` from the page URL, or the first one.
     */
    protected function _getTab($aParams, $sName, $aTabs)
    {
        $sTab = $this->_param($aParams, 'tab', $this->_param($aParams, 'tab_' . $sName, ''));

        return isset($aTabs[$sTab]) ? $sTab : key($aTabs);
    }

    protected function _getTabs($aTabs, $sActive, $sKeyPrefix = '_bx_analytics_tab_')
    {
        $aResult = [];
        foreach(array_keys($aTabs) as $sName)
            $aResult[] = ['name' => $sName, 'title' => _t($sKeyPrefix . $sName), 'active' => $sName == $sActive];

        return $aResult;
    }

    /**
     * A scalar request parameter, or the default.
     */
    protected function _param($aParams, $sKey, $mixedDefault = '')
    {
        return isset($aParams[$sKey]) && is_scalar($aParams[$sKey]) ? $aParams[$sKey] : $mixedDefault;
    }

    /**
     * Change in percent, or null when there is nothing to compare with.
     */
    protected function _change($fCurrent, $fPrevious)
    {
        if(!$fPrevious)
            return null;

        return round(100 * ($fCurrent - $fPrevious) / $fPrevious, 1);
    }
}

/** @} */
