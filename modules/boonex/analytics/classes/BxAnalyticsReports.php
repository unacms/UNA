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
    protected $_aModuleTitles;

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
     * Custom events and site actions with their counts and visitors. With `event`
     * (type|name|module) one event over time, by platform and by its properties.
     * Tabs: all, custom (from trackers), site (UNA actions).
     */
    public function getEvents(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aEvent = $this->_parseEvent($this->_param($aParams, 'event'));
        if($aEvent)
            return $this->_getEventDetail($oFilter, $aEvent);

        $aTabs = ['all' => [BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_UNA], 'custom' => [BX_ANALYTICS_HIT_EVENT], 'site' => [BX_ANALYTICS_HIT_UNA]];
        $sTab = $this->_getTab($aParams, 'events', $aTabs);
        $aFilter = $oFilter->get();

        $iTotal = $this->_oDb->getEventListCount($aFilter, $aTabs[$sTab]);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_events', 1)));

        $aEvents = $this->_oDb->getEventList($aFilter, $aTabs[$sTab], $this->_iPerPage, ($iPage - 1) * $this->_iPerPage);
        $iMax = 1;
        foreach($aEvents as $aRow)
            $iMax = max($iMax, (int)$aRow['count']);

        $aRows = [];
        foreach($aEvents as $aRow)
            $aRows[] = [
                'label' => $this->getEventLabel($aRow['type'], $aRow['name'], $aRow['module']),
                'sub' => _t('_bx_analytics_event_type_' . $aRow['type']),
                'open' => ['param' => 'event', 'value' => $aRow['type'] . '|' . $aRow['name'] . '|' . $aRow['module']],
                'bar' => round(100 * $aRow['count'] / $iMax, 1),
                'values' => [
                    'count' => (int)$aRow['count'],
                    'visitors' => (int)$aRow['visitors'],
                    'per_visitor' => $aRow['visitors'] ? round($aRow['count'] / $aRow['visitors'], 1) : 0,
                    'last' => (int)$aRow['last'],
                ],
            ];

        return [
            'view' => 'list',
            'name' => 'events',
            'caption' => _t('_bx_analytics_lmi_cpt_events'),
            'tab' => $sTab,
            'tabs' => $this->_getTabs($aTabs, $sTab, '_bx_analytics_tab_events_'),
            'columns' => [
                ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_event')],
                ['key' => 'count', 'type' => 'number', 'title' => _t('_bx_analytics_metric_count')],
                ['key' => 'visitors', 'type' => 'number', 'title' => _t('_bx_analytics_metric_visitors')],
                ['key' => 'per_visitor', 'type' => 'decimal', 'title' => _t('_bx_analytics_metric_per_visitor')],
                ['key' => 'last', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_last_seen')],
            ],
            'rows' => $aRows,
            'page' => $iPage,
            'pages' => $iPages,
            'empty' => _t('_bx_analytics_txt_no_events'),
        ];
    }

    protected function _getEventDetail(BxAnalyticsFilter $oFilter, $aEvent)
    {
        $aFilter = $oFilter->get();

        $aRows = $this->_oDb->getEventSeries($aFilter, $aEvent, $aFilter['bucket'], $aFilter['offset'], $aFilter['starts']);
        $aCounts = [];
        $aVisitors = [];
        foreach($aFilter['buckets'] as $iBucket) {
            $aCounts[] = isset($aRows[$iBucket]) ? (int)$aRows[$iBucket]['count'] : 0;
            $aVisitors[] = isset($aRows[$iBucket]) ? (int)$aRows[$iBucket]['visitors'] : 0;
        }

        $aPlatforms = [];
        $iTotal = 0;
        $iTotalVisitors = 0;
        foreach($this->_oDb->getEventPlatforms($aFilter, $aEvent) as $aRow) {
            $iTotal += (int)$aRow['count'];
            $iTotalVisitors += (int)$aRow['visitors'];
            $aPlatforms[] = ['label' => $this->getLabel('platform', $aRow['platform']), 'count' => (int)$aRow['count']];
        }
        foreach($aPlatforms as $i => $a)
            $aPlatforms[$i]['share'] = $iTotal ? round(100 * $a['count'] / $iTotal, 1) : 0;

        // the most common values of each property among the latest occurrences
        $aProps = [];
        foreach($this->_oDb->getEventProps($aFilter, $aEvent) as $sJson) {
            $a = json_decode($sJson, true);
            if(!is_array($a))
                continue;
            foreach($a as $sKey => $mixedValue)
                if(is_scalar($mixedValue)) {
                    $sValue = is_bool($mixedValue) ? ($mixedValue ? 'true' : 'false') : (string)$mixedValue;
                    $aProps[$sKey][$sValue] = (isset($aProps[$sKey][$sValue]) ? $aProps[$sKey][$sValue] : 0) + 1;
                }
        }

        $aPropTables = [];
        foreach(array_slice($aProps, 0, 6, true) as $sKey => $aValues) {
            arsort($aValues);
            $iMax = max($aValues);
            $aPropRows = [];
            foreach(array_slice($aValues, 0, 10, true) as $sValue => $iCount)
                $aPropRows[] = ['label' => (string)$sValue, 'bar' => round(100 * $iCount / $iMax, 1), 'values' => ['count' => $iCount]];

            $aPropTables[] = [
                'name' => 'prop_' . preg_replace('/[^a-z0-9_]/i', '_', $sKey),
                'caption' => (string)$sKey,
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => (string)$sKey],
                    ['key' => 'count', 'type' => 'number', 'title' => _t('_bx_analytics_metric_count')],
                ],
                'rows' => $aPropRows,
            ];
        }

        return [
            'view' => 'detail',
            'event' => $aEvent,
            'title' => $this->getEventLabel($aEvent['type'], $aEvent['name'], $aEvent['module']),
            'tiles' => [
                ['title' => _t('_bx_analytics_metric_count'), 'value' => $iTotal, 'type' => 'number'],
                ['title' => _t('_bx_analytics_metric_visitors'), 'value' => $iTotalVisitors, 'type' => 'number'],
                ['title' => _t('_bx_analytics_metric_per_visitor'), 'value' => $iTotalVisitors ? round($iTotal / $iTotalVisitors, 1) : 0, 'type' => 'decimal'],
            ],
            'chart' => [
                'kind' => 'lines',
                'labels' => $aFilter['buckets'],
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => [
                    ['key' => 'count', 'label' => _t('_bx_analytics_metric_count'), 'values' => $aCounts],
                    ['key' => 'visitors', 'label' => _t('_bx_analytics_metric_visitors'), 'values' => $aVisitors],
                ],
            ],
            'platforms' => $aPlatforms,
            'props' => $aPropTables,
        ];
    }

    /**
     * Visits, latest first, with who, where from and on what. With `session` one visit's
     * timeline. Shows members by name, so it needs the people permission.
     */
    public function getSessions(BxAnalyticsFilter $oFilter, $aParams = [], $iProfileId = 0)
    {
        $iSession = (int)$this->_param($aParams, 'session', 0);
        if($iSession)
            return $this->_getSessionDetail($iSession);

        $aFilter = $oFilter->get();
        $iTotal = $this->_oDb->getSessionListCount($aFilter, $iProfileId);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_sessions', 1)));

        $aRows = [];
        foreach($this->_oDb->getSessionList($aFilter, $this->_iPerPage, ($iPage - 1) * $this->_iPerPage, $iProfileId) as $aSession) {
            $aMember = $this->getMember((int)$aSession['profile_id']);
            $aRows[] = [
                'label' => $aMember ? $aMember['name'] : _t('_bx_analytics_txt_guest'),
                'open' => ['param' => 'session', 'value' => (int)$aSession['id']],
                'values' => [
                    'started' => (int)$aSession['started'],
                    'platform' => $this->getLabel('platform', $aSession['platform']),
                    'location' => $this->_getLocation($aSession),
                    'device' => $this->_getDevice($aSession),
                    'source' => $aSession['referrer_host'] !== '' ? $aSession['referrer_host'] : $this->getLabel('channel', $aSession['channel'] !== '' ? $aSession['channel'] : 'direct'),
                    'pageviews' => (int)$aSession['pageviews'],
                    'duration' => (int)$aSession['duration'],
                ],
            ];
        }

        return [
            'view' => 'list',
            'name' => 'sessions',
            'caption' => _t('_bx_analytics_lmi_cpt_sessions'),
            'columns' => [
                ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_visitor')],
                ['key' => 'started', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_started')],
                ['key' => 'platform', 'type' => 'text', 'title' => _t('_bx_analytics_dim_platform')],
                ['key' => 'location', 'type' => 'text', 'title' => _t('_bx_analytics_txt_location')],
                ['key' => 'device', 'type' => 'text', 'title' => _t('_bx_analytics_dim_device')],
                ['key' => 'source', 'type' => 'text', 'title' => _t('_bx_analytics_txt_source')],
                ['key' => 'pageviews', 'type' => 'number', 'title' => _t('_bx_analytics_metric_pageviews')],
                ['key' => 'duration', 'type' => 'duration', 'title' => _t('_bx_analytics_txt_duration')],
            ],
            'rows' => $aRows,
            'page' => $iPage,
            'pages' => $iPages,
            'empty' => _t('_bx_analytics_txt_no_data'),
        ];
    }

    protected function _getSessionDetail($iSession)
    {
        $aSession = $this->_oDb->getSession($iSession);
        if(empty($aSession))
            return false;

        $iStart = (int)$aSession['started'];
        $aTimeline = [];
        foreach($this->_oDb->getSessionEvents($iSession) as $aEvent)
            $aTimeline[] = [
                'offset' => max(0, (int)$aEvent['ts'] - $iStart),
                'type' => $aEvent['type'],
                'label' => $aEvent['type'] == BX_ANALYTICS_HIT_PAGEVIEW ? ($aEvent['title'] !== '' ? $aEvent['title'] : $aEvent['path']) : $this->getEventLabel($aEvent['type'], $aEvent['name'], $aEvent['module']),
                'path' => $aEvent['type'] == BX_ANALYTICS_HIT_PAGEVIEW ? $aEvent['path'] : '',
                'engaged' => (int)round($aEvent['engaged'] / 1000),
            ];

        $aMember = $this->getMember((int)$aSession['profile_id']);

        return [
            'view' => 'detail',
            'id' => (int)$aSession['id'],
            'member' => $aMember,
            'facts' => [
                ['title' => _t('_bx_analytics_txt_started'), 'value' => (int)$aSession['started'], 'type' => 'datetime'],
                ['title' => _t('_bx_analytics_txt_duration'), 'value' => (int)$aSession['duration'], 'type' => 'duration'],
                ['title' => _t('_bx_analytics_metric_pageviews'), 'value' => (int)$aSession['pageviews'], 'type' => 'number'],
                ['title' => _t('_bx_analytics_dim_platform'), 'value' => $this->getLabel('platform', $aSession['platform']) . ($aSession['app_version'] !== '' ? ' ' . $aSession['app_version'] : ''), 'type' => 'text'],
                ['title' => _t('_bx_analytics_txt_location'), 'value' => $this->_getLocation($aSession), 'type' => 'text'],
                ['title' => _t('_bx_analytics_dim_device'), 'value' => $this->_getDevice($aSession), 'type' => 'text'],
                ['title' => _t('_bx_analytics_txt_source'), 'value' => $aSession['referrer'] !== '' ? $aSession['referrer'] : $this->getLabel('channel', $aSession['channel'] !== '' ? $aSession['channel'] : 'direct'), 'type' => 'text'],
                ['title' => _t('_bx_analytics_dim_language'), 'value' => $aSession['language'], 'type' => 'text'],
            ],
            'timeline' => $aTimeline,
        ];
    }

    /**
     * Members who visited in the period. With `user` one member's visits and actions; with
     * `session` too, one of their visits. Needs the people permission.
     */
    public function getUsers(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $iUser = (int)$this->_param($aParams, 'user', 0);
        if($iUser) {
            if((int)$this->_param($aParams, 'session', 0))
                return $this->_getSessionDetail((int)$aParams['session']);

            return $this->_getUserDetail($oFilter, $iUser, $aParams);
        }

        $aFilter = $oFilter->get();
        $iTotal = $this->_oDb->getMemberListCount($aFilter);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_users', 1)));

        $aRows = [];
        foreach($this->_oDb->getMemberList($aFilter, $this->_iPerPage, ($iPage - 1) * $this->_iPerPage) as $aRow) {
            $aMember = $this->getMember((int)$aRow['profile_id']);
            $aRows[] = [
                'label' => $aMember ? $aMember['name'] : _t('_bx_analytics_txt_deleted_member'),
                'sub' => $aRow['country'] !== '' ? $this->getLabel('country', $aRow['country']) : '',
                'open' => ['param' => 'user', 'value' => (int)$aRow['profile_id']],
                'values' => [
                    'sessions' => (int)$aRow['sessions'],
                    'pageviews' => (int)$aRow['pageviews'],
                    'duration' => (int)$aRow['duration'],
                    'platforms' => $this->_getPlatformsText($aRow['platforms']),
                    'last' => (int)$aRow['last'],
                ],
            ];
        }

        return [
            'view' => 'list',
            'name' => 'users',
            'caption' => _t('_bx_analytics_lmi_cpt_users'),
            'columns' => [
                ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_member_name')],
                ['key' => 'sessions', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sessions')],
                ['key' => 'pageviews', 'type' => 'number', 'title' => _t('_bx_analytics_metric_pageviews')],
                ['key' => 'duration', 'type' => 'duration', 'title' => _t('_bx_analytics_txt_time_spent')],
                ['key' => 'platforms', 'type' => 'text', 'title' => _t('_bx_analytics_tab_platforms')],
                ['key' => 'last', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_last_seen')],
            ],
            'rows' => $aRows,
            'page' => $iPage,
            'pages' => $iPages,
            'empty' => _t('_bx_analytics_txt_no_members'),
        ];
    }

    protected function _getUserDetail(BxAnalyticsFilter $oFilter, $iProfileId, $aParams)
    {
        $aTotals = $this->_oDb->getMemberTotals($iProfileId);
        if(empty($aTotals['totals']['sessions']))
            return false;

        $aPlatforms = [];
        $iSessions = (int)$aTotals['totals']['sessions'];
        foreach($aTotals['platforms'] as $sPlatform => $iCount)
            $aPlatforms[] = [
                'label' => $this->getLabel('platform', $sPlatform),
                'count' => (int)$iCount,
                'share' => $iSessions ? round(100 * $iCount / $iSessions, 1) : 0,
            ];

        $aActions = [];
        $aRows = $this->_oDb->getMemberActions($iProfileId, $oFilter->get());
        $iMax = 1;
        foreach($aRows as $aRow)
            $iMax = max($iMax, (int)$aRow['count']);
        foreach($aRows as $aRow)
            $aActions[] = [
                'label' => $this->getEventLabel($aRow['type'], $aRow['name'], $aRow['module']),
                'bar' => round(100 * $aRow['count'] / $iMax, 1),
                'values' => ['count' => (int)$aRow['count'], 'last' => (int)$aRow['last']],
            ];

        $aSessions = $this->getSessions($oFilter, $aParams, $iProfileId);

        return [
            'view' => 'user',
            'member' => $this->getMember($iProfileId),
            'tiles' => [
                ['title' => _t('_bx_analytics_metric_sessions'), 'value' => $iSessions, 'type' => 'number'],
                ['title' => _t('_bx_analytics_metric_pageviews'), 'value' => (int)$aTotals['totals']['pageviews'], 'type' => 'number'],
                ['title' => _t('_bx_analytics_txt_time_spent'), 'value' => (int)$aTotals['totals']['duration'], 'type' => 'duration'],
                ['title' => _t('_bx_analytics_txt_first_seen'), 'value' => (int)$aTotals['totals']['first'], 'type' => 'date'],
                ['title' => _t('_bx_analytics_txt_last_seen'), 'value' => (int)$aTotals['totals']['last'], 'type' => 'datetime'],
            ],
            'platforms' => $aPlatforms,
            'actions' => [
                'name' => 'user_actions',
                'caption' => _t('_bx_analytics_txt_actions'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_event')],
                    ['key' => 'count', 'type' => 'number', 'title' => _t('_bx_analytics_metric_count')],
                    ['key' => 'last', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_last_seen')],
                ],
                'rows' => $aActions,
                'empty' => _t('_bx_analytics_txt_no_events'),
            ],
            'sessions' => $aSessions,
        ];
    }

    /**
     * Where visitors go from a page: the pages they open next and, for one of those, the
     * pages after it; and the most common three-page paths from the entry page. Params:
     * `from` (default: the top entry page), `via` (a next page to follow further).
     */
    public function getJourneys(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $iLimit = 200000;
        $aRows = $this->_oDb->getPagePaths($oFilter->get(), $iLimit);

        // each visit's pages in order, a page reloaded in place counted once
        $aSequences = [];
        foreach($aRows as $aRow) {
            $iSession = (int)$aRow['session_id'];
            if(!isset($aSequences[$iSession]))
                $aSequences[$iSession] = [];
            if(end($aSequences[$iSession]) !== $aRow['path'])
                $aSequences[$iSession][] = $aRow['path'];
        }

        $aEntries = [];
        $aPaths = [];
        foreach($aSequences as $aSequence) {
            $aEntries[$aSequence[0]] = (isset($aEntries[$aSequence[0]]) ? $aEntries[$aSequence[0]] : 0) + 1;
            $sPath = implode("\n", array_slice($aSequence, 0, 3));
            $aPaths[$sPath] = (isset($aPaths[$sPath]) ? $aPaths[$sPath] : 0) + 1;
        }
        arsort($aEntries);
        arsort($aPaths);

        $sFrom = (string)$this->_param($aParams, 'from', '');
        if($sFrom === '' || !isset($aEntries[$sFrom]) && !$this->_inSequences($aSequences, $sFrom))
            $sFrom = !empty($aEntries) ? (string)key($aEntries) : '';
        $sVia = (string)$this->_param($aParams, 'via', '');

        // the page after the first visit of `from`, and after `via` when it came right after
        $iFromSessions = 0;
        $aNext = [];
        $iNextExits = 0;
        $iViaSessions = 0;
        $aAfter = [];
        $iAfterExits = 0;
        foreach($aSequences as $aSequence) {
            $i = array_search($sFrom, $aSequence, true);
            if($i === false)
                continue;

            $iFromSessions++;
            if(!isset($aSequence[$i + 1])) {
                $iNextExits++;
                continue;
            }

            $sNext = $aSequence[$i + 1];
            $aNext[$sNext] = (isset($aNext[$sNext]) ? $aNext[$sNext] : 0) + 1;

            if($sVia !== '' && $sNext === $sVia) {
                $iViaSessions++;
                if(isset($aSequence[$i + 2]))
                    $aAfter[$aSequence[$i + 2]] = (isset($aAfter[$aSequence[$i + 2]]) ? $aAfter[$aSequence[$i + 2]] : 0) + 1;
                else
                    $iAfterExits++;
            }
        }
        arsort($aNext);
        arsort($aAfter);

        $fStep = function($aCounts, $iExits, $iTotal, $iLimit) {
            $aResult = [];
            foreach(array_slice($aCounts, 0, $iLimit, true) as $sPage => $iCount)
                $aResult[] = ['page' => (string)$sPage, 'sessions' => $iCount, 'share' => $iTotal ? round(100 * $iCount / $iTotal, 1) : 0];
            if($iExits)
                $aResult[] = ['page' => '', 'exit' => true, 'sessions' => $iExits, 'share' => $iTotal ? round(100 * $iExits / $iTotal, 1) : 0];
            return $aResult;
        };

        $iTotal = count($aSequences);
        $aTopPaths = [];
        foreach(array_slice($aPaths, 0, 10, true) as $sPath => $iCount)
            $aTopPaths[] = ['pages' => explode("\n", (string)$sPath), 'sessions' => $iCount, 'share' => $iTotal ? round(100 * $iCount / $iTotal, 1) : 0];

        $aEntryList = [];
        foreach(array_slice($aEntries, 0, 10, true) as $sPage => $iCount)
            $aEntryList[] = ['page' => (string)$sPage, 'sessions' => $iCount, 'active' => (string)$sPage === $sFrom];

        return [
            'from' => $sFrom,
            'via' => $sVia !== '' && $iViaSessions ? $sVia : '',
            'sessions' => $iTotal,
            'truncated' => count($aRows) >= $iLimit,
            'entries' => $aEntryList,
            'from_sessions' => $iFromSessions,
            'next' => $fStep($aNext, $iNextExits, $iFromSessions, 8),
            'after' => $iViaSessions ? $fStep($aAfter, $iAfterExits, $iViaSessions, 8) : [],
            'via_sessions' => $iViaSessions,
            'paths' => $aTopPaths,
        ];
    }

    /**
     * Weekly cohorts by first visit and the share of each that came back in the weeks after.
     * Tabs: members (stable ids) or all visitor ids (with cookieless ids a guest is new every
     * day, so only persistent ids make guest retention meaningful).
     */
    public function getRetention(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aTabs = ['members' => true, 'visitors' => false];
        $sTab = $this->_getTab($aParams, 'retention', $aTabs);
        $aFilter = $oFilter->get();

        $iWeeks = 12;
        $iOffset = (int)$aFilter['offset'];
        $fWeek = function($iTime) use ($iOffset) {
            return (int)(floor(($iTime + $iOffset - 345600) / 604800) * 604800 + 345600 - $iOffset);
        };

        $iNow = (int)$aFilter['now'];
        $iThisWeek = $fWeek($iNow);
        $iFrom = $iThisWeek - ($iWeeks - 1) * 604800;

        $aCohorts = [];
        for($i = 0; $i < $iWeeks; $i++)
            $aCohorts[$iFrom + $i * 604800] = ['size' => 0, 'back' => array_fill(0, $iWeeks - $i, 0)];

        foreach($this->_oDb->getVisitorWeeks($iFrom, $iNow + 1, $iOffset, $aFilter['platform'], $aTabs[$sTab]) as $aVisitor) {
            $iCohort = $fWeek($aVisitor['first']);
            if(!isset($aCohorts[$iCohort]))
                continue;

            $aCohorts[$iCohort]['size']++;
            foreach(array_unique($aVisitor['weeks']) as $iWeek) {
                $iIndex = (int)round(($iWeek - $iCohort) / 604800);
                if($iIndex >= 0 && isset($aCohorts[$iCohort]['back'][$iIndex]))
                    $aCohorts[$iCohort]['back'][$iIndex]++;
            }
        }

        $aRows = [];
        foreach($aCohorts as $iStart => $aCohort)
            $aRows[] = [
                'start' => $iStart,
                'size' => $aCohort['size'],
                'weeks' => array_map(function($iCount) use ($aCohort) {
                    return $aCohort['size'] ? round(100 * $iCount / $aCohort['size'], 1) : null;
                }, $aCohort['back']),
            ];

        return [
            'tab' => $sTab,
            'tabs' => $this->_getTabs($aTabs, $sTab, '_bx_analytics_tab_retention_'),
            'weeks' => $iWeeks,
            'tz' => $aFilter['tz'],
            'rows' => $aRows,
            'cookieless' => $sTab == 'visitors' && $this->_oConfig->getIdentityMode() == BX_ANALYTICS_IDENTITY_COOKIELESS,
        ];
    }

    protected function _inSequences($aSequences, $sPage)
    {
        foreach($aSequences as $aSequence)
            if(in_array($sPage, $aSequence, true))
                return true;

        return false;
    }

    /**
     * Name, link and picture of a profile, or null when it no longer exists.
     */
    public function getMember($iProfileId)
    {
        if(!$iProfileId)
            return null;

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return null;

        return [
            'id' => (int)$iProfileId,
            'name' => $oProfile->getDisplayName(),
            'url' => $oProfile->getUrl(),
            'thumb' => $oProfile->getThumb(),
        ];
    }

    /**
     * A readable name for an event: a site action with the module it happened in, or a
     * custom event's own name.
     */
    public function getEventLabel($sType, $sName, $sModule)
    {
        $sModuleTitle = $sModule !== '' ? $this->_getModuleTitle($sModule) : '';

        if($sType == BX_ANALYTICS_HIT_UNA) {
            $sLabel = _t('_bx_analytics_action_' . $sName);
            return $sModuleTitle !== '' && $sModule != 'account' ? $sLabel . ' · ' . $sModuleTitle : $sLabel;
        }

        return $sModuleTitle !== '' ? $sName . ' · ' . $sModuleTitle : $sName;
    }

    /**
     * Title of the module an object system belongs to: bx_posts and bx_posts_reactions are both Posts.
     */
    protected function _getModuleTitle($sSystem)
    {
        if($this->_aModuleTitles === null) {
            $this->_aModuleTitles = [];
            foreach(BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
                $this->_aModuleTitles[$aModule['name']] = $aModule['title'];
            uksort($this->_aModuleTitles, function($a, $b) { return get_mb_len($b) - get_mb_len($a); });
        }

        foreach($this->_aModuleTitles as $sName => $sTitle)
            if($sSystem === $sName || bx_mb_strpos($sSystem, $sName . '_') === 0)
                return $sTitle;

        // core objects, like the friends and follows connections, have their own names
        $sKey = '_bx_analytics_object_' . $sSystem;
        $sTitle = _t($sKey);

        return $sTitle !== $sKey ? $sTitle : $sSystem;
    }

    protected function _parseEvent($sValue)
    {
        $aParts = explode('|', (string)$sValue);
        if(count($aParts) != 3 || !in_array($aParts[0], [BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_UNA], true) || $aParts[1] === '')
            return null;

        return ['type' => $aParts[0], 'name' => $aParts[1], 'module' => $aParts[2]];
    }

    protected function _getLocation($aSession)
    {
        $aParts = array_filter([$aSession['city'], $aSession['country'] !== '' ? $this->getLabel('country', $aSession['country']) : '']);

        return !empty($aParts) ? implode(', ', $aParts) : _t('_bx_analytics_txt_unknown');
    }

    protected function _getDevice($aSession)
    {
        $aParts = array_filter([
            $aSession['device'] !== '' ? $this->getLabel('device', $aSession['device']) : '',
            $aSession['browser'],
            trim($aSession['os'] . ' ' . $aSession['os_version']),
        ]);

        return implode(' · ', $aParts);
    }

    protected function _getPlatformsText($sPlatforms)
    {
        $aLabels = [];
        foreach(explode(',', (string)$sPlatforms) as $sPlatform)
            if($sPlatform !== '')
                $aLabels[] = $this->getLabel('platform', $sPlatform);

        return implode(', ', $aLabels);
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
