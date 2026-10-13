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

    /**
     * Tabs of the other reports: report => [tab => what the tab shows]. The first is the default.
     * - map: the period's visitors or those online now
     * - events: event types
     * - retention: whether only members count (cohorts of member visitors)
     * - errors: statuses (`new` is open or resolved, first seen in the period)
     * - performance: pages grouped by route or by path
     * - revenue: splits as columns of the ledger
     */
    protected $_aReportTabs = [
        'map' => ['period' => 'period', 'live' => 'live'],
        // set in the constructor: the hit types are constants of the config, which the module loads on first use
        'events' => [],
        'retention' => ['members' => true, 'visitors' => false],
        'errors' => [
            'open' => ['open'],
            'new' => ['open', 'resolved'],
            'resolved' => ['resolved'],
            'ignored' => ['ignored'],
            'all' => ['open', 'resolved', 'ignored'],
        ],
        'performance' => ['route' => 'route', 'path' => 'path'],
        'revenue' => ['sources' => 'module', 'providers' => 'provider', 'platforms' => 'platform', 'first_touch' => 'first_channel', 'last_touch' => 'last_channel', 'campaigns' => 'last_utm_campaign'],
    ];

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

        $this->_aReportTabs['events'] = ['all' => [BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_UNA], 'custom' => [BX_ANALYTICS_HIT_EVENT], 'site' => [BX_ANALYTICS_HIT_UNA]];

        $this->_oDb->setReportSession();
    }

    /**
     * Whether a report shows live figures (visitors online, the last minutes), which are
     * never cached.
     */
    public function isLive($sReport, $aParams = [])
    {
        if(in_array($sReport, ['realtime', 'filters'], true))
            return true;

        return $sReport == 'map' && $this->_getTab($aParams, 'map', $this->_aReportTabs['map']) == 'live';
    }

    /**
     * The parameters a report reads, past the filter: its cache name is made of them. Blocks
     * send the whole page URL, which also holds other blocks' tabs and pages, the chart's
     * metric and opened rows; those would make a copy per combination of things the report
     * never shows. A report missing here keeps every parameter.
     */
    public function getCacheParams($sReport, $aParams)
    {
        $aKeys = [
            'overview' => [],
            'top' => ['group', 'tab'],
            'table' => ['table', 'tab', 'page'],
            'query' => ['q_dim', 'q_metric', 'q_dir', 'page', 'page_query'],
            'map' => ['tab', 'tab_map'],
            'bots' => ['tab', 'tab_bots', 'page_bot_list'],
            'events' => ['event', 'tab', 'tab_events', 'page_events'],
            'sessions' => ['session', 'page_sessions'],
            'users' => ['user', 'session', 'page_users', 'page_sessions'],
            'journeys' => ['jfrom', 'via'],
            'retention' => ['tab', 'tab_retention'],
            'goals' => ['edit_goal'],
            'funnels' => ['funnel', 'edit_funnel'],
            'revenue' => ['tab', 'tab_revenue'],
            'subscriptions' => [],
            'sales' => [],
            'credits' => [],
            'errors' => ['error', 'tab', 'tab_errors', 'page_errors'],
            'performance' => ['vital', 'vital_device', 'tab', 'tab_performance', 'page_performance'],
        ];
        if(!isset($aKeys[$sReport]))
            return $aParams;

        // a top list's tab, and a table's tab and page, are named after the group or the table
        $aOwn = array_merge($aKeys[$sReport], ['limit', 'meta']);
        if($sReport == 'top' && ($sGroup = (string)$this->_param($aParams, 'group')) !== '')
            $aOwn[] = 'tab_' . $sGroup;
        if($sReport == 'table' && ($sTable = (string)$this->_param($aParams, 'table')) !== '')
            array_push($aOwn, 'tab_' . $sTable, 'page_' . $sTable);

        return array_intersect_key($aParams, array_flip($aOwn));
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
     * What get_report accepts, for the API playground: the filter parameters every report
     * reads, and each report's own. A parameter is [type, values, min, max, default] with
     * type enum (one of values), enum_by (one of values[the value of the parameter `by`]),
     * int (min to max), date (YYYY-MM-DD), string, or dims (an object of dimension => value,
     * the dimensions in values).
     *
     * @return array common => parameters, reports => [report => parameters]
     */
    public function getParamsSchema()
    {
        $fEnum = function($aValues, $sDefault = null) {
            return ['type' => 'enum', 'values' => array_values($aValues), 'default' => $sDefault !== null ? $sDefault : reset($aValues)];
        };
        $fInt = function($iMin, $iMax = null, $iDefault = null) {
            return array_filter(['type' => 'int', 'min' => $iMin, 'max' => $iMax, 'default' => $iDefault], function($m) { return $m !== null; });
        };
        $fString = function() {
            return ['type' => 'string'];
        };

        // a tab is one of its group's or table's: group or table => tabs
        $fTabs = function($sBy, $aLists) {
            return ['type' => 'enum_by', 'by' => $sBy, 'values' => array_map('array_keys', $aLists)];
        };

        $aDimensions = array_keys($this->_oDb->getDimensions());
        $aQueryMetrics = [];
        foreach($aDimensions as $sDimension)
            $aQueryMetrics = array_merge($aQueryMetrics, $this->_oDb->getBreakdownMetrics($sDimension));

        bx_import('Filter', $this->_oModule->_aModule);

        return [
            'common' => [
                'range' => $fEnum(BxAnalyticsFilter::$aRanges, BxAnalyticsFilter::RANGE_DEFAULT),
                'from' => ['type' => 'date'],
                'to' => ['type' => 'date'],
                'tz' => ['type' => 'string', 'default' => 'UTC'],
                'platform' => ['type' => 'enum', 'values' => array_keys($this->_oConfig->getPlatforms())],
                'bucket' => ['type' => 'enum', 'values' => ['hour', 'day', 'week', 'month']],
                'f' => ['type' => 'dims', 'values' => array_values(array_diff($aDimensions, ['platform']))],
            ],
            'reports' => [
                'filters' => [],
                'overview' => [],
                'top' => ['group' => $fEnum(array_keys($this->_aGroups)), 'tab' => $fTabs('group', $this->_aGroups), 'limit' => $fInt(1, 100, 10)],
                'table' => ['table' => $fEnum(array_keys($this->_aTables)), 'tab' => $fTabs('table', $this->_aTables), 'page' => $fInt(1)],
                'realtime' => ['limit' => $fInt(0, 50, 20)],
                'map' => ['tab' => $fEnum(array_keys($this->_aReportTabs['map']))],
                'bots' => ['tab' => $fEnum(array_keys($this->_getBotCategories())), 'page_bot_list' => $fInt(1)],
                'events' => ['event' => $fString(), 'tab' => $fEnum(array_keys($this->_aReportTabs['events'])), 'page_events' => $fInt(1)],
                'sessions' => ['session' => $fInt(1), 'page_sessions' => $fInt(1)],
                'users' => ['user' => $fInt(1), 'session' => $fInt(1), 'page_users' => $fInt(1)],
                'journeys' => ['jfrom' => $fString(), 'via' => $fString()],
                'retention' => ['tab' => $fEnum(array_keys($this->_aReportTabs['retention']))],
                'goals' => [],
                'funnels' => ['funnel' => $fInt(1)],
                'revenue' => ['tab' => $fEnum(array_keys($this->_aReportTabs['revenue']))],
                'subscriptions' => [],
                'sales' => [],
                'credits' => [],
                'errors' => ['error' => $fInt(1), 'tab' => $fEnum(array_keys($this->_aReportTabs['errors'])), 'page_errors' => $fInt(1)],
                'performance' => ['vital' => $fEnum(BxAnalyticsVitals::METRICS), 'vital_device' => $fEnum(['all', 'mobile', 'desktop']), 'tab' => $fEnum(array_keys($this->_aReportTabs['performance'])), 'page_performance' => $fInt(1)],
                'query' => ['q_dim' => $fEnum($aDimensions), 'q_metric' => $fEnum(array_unique($aQueryMetrics)), 'q_dir' => $fEnum(['desc', 'asc']), 'page_query' => $fInt(1)],
            ],
        ];
    }

    /**
     * Bot tabs: tab => bot categories (none for all).
     */
    protected function _getBotCategories()
    {
        bx_import('UserAgent', $this->_oModule->_aModule);

        return [
            'all' => [],
            'ai' => [BxAnalyticsUserAgent::BOT_AI_CRAWLER, BxAnalyticsUserAgent::BOT_AI_AGENT],
            'search' => [BxAnalyticsUserAgent::BOT_SEARCH],
            'social' => [BxAnalyticsUserAgent::BOT_SOCIAL],
            'seo' => [BxAnalyticsUserAgent::BOT_SEO],
            'monitor' => [BxAnalyticsUserAgent::BOT_MONITOR],
            'script' => [BxAnalyticsUserAgent::BOT_SCRIPT, BxAnalyticsUserAgent::BOT_FEED, BxAnalyticsUserAgent::BOT_OTHER],
        ];
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
        // page_<table> first: in Studio `page` names the section
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_' . $sTable, $this->_param($aParams, 'page', 1))));
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
     * Explore any dimension: its values sorted by a metric, a page at a time, and the first
     * few of them over time. Same shape as a table, so it renders and pages like one.
     * Params: q_dim, q_metric, q_dir (see getQueryParams), page (or page_query).
     */
    public function getQuery(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aQuery = $this->getQueryParams($aParams);
        $sDimension = $aQuery['dimension'];
        $sMetric = $aQuery['metric'];
        $aFilter = $oFilter->get();

        $iTotal = $this->_oDb->getTopCount($aFilter, $sDimension);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        // page_query first: in Studio `page` names the section
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_query', $this->_param($aParams, 'page', 1))));
        $iStart = ($iPage - 1) * $this->_iPerPage;

        $aRows = $this->_getQueryRows($aFilter, $aQuery, $this->_iPerPage, $iStart);

        // the chart follows the first values in this order, whatever page the table shows
        $iSeries = (int)$this->_oConfig->CNF['QUERY_SERIES_VALUES'];
        $aFirst = $iStart == 0 ? array_slice($aRows, 0, $iSeries) : $this->_getQueryRows($aFilter, $aQuery, $iSeries, 0, $iSeries, false);

        $fMax = 0;
        foreach($aRows as $aRow)
            $fMax = max($fMax, (float)$aRow[$sMetric]);

        $aResult = [];
        foreach($aRows as $aRow)
            $aResult[] = [
                'label' => $this->getLabel($sDimension, $aRow['value']),
                'filter' => ['dim' => $sDimension, 'value' => $aRow['value']],
                'bar' => $fMax > 0 ? round(100 * $aRow[$sMetric] / $fMax, 1) : 0,
                'values' => $aRow,
            ];

        $aDimensions = [];
        foreach($this->_oDb->getDimensions() as $sName => $sKind)
            $aDimensions[] = ['name' => $sName, 'title' => _t('_bx_analytics_dim_' . $sName), 'kind' => $sKind];

        $aMetrics = [];
        foreach($aQuery['metrics'] as $sName)
            $aMetrics[] = ['name' => $sName, 'title' => _t('_bx_analytics_metric_' . $sName)];

        return [
            'name' => 'query',
            'caption' => _t('_bx_analytics_dim_' . $sDimension),
            'dimension' => $sDimension,
            'kind' => $aQuery['kind'],
            'metric' => $sMetric,
            'dir' => $aQuery['dir'],
            'dimensions' => $aDimensions,
            'metrics' => $aMetrics,
            'tabs' => [],
            'columns' => $this->_getQueryColumns($aQuery),
            'rows' => $aResult,
            'page' => $iPage,
            'pages' => $iPages,
            'total' => $iTotal,
            'export_max' => (int)$this->_oConfig->CNF['MAX_EXPORT_ROWS'],
            'chart' => $this->_getQuerySeries($aFilter, $aQuery, $aFirst),
        ];
    }

    /**
     * What a query asks for, from q_dim (a dimension, see BxAnalyticsDb::getDimensions),
     * q_metric (one the dimension can be sorted by) and q_dir (asc or desc). Anything unknown
     * falls back to the first valid choice: pages, by visitors, highest first.
     *
     * @return array dimension, kind (event or session), metric, metrics (the dimension's
     *      sortable metrics), dir
     */
    public function getQueryParams($aParams)
    {
        $aDimensions = $this->_oDb->getDimensions();
        $sDimension = (string)$this->_param($aParams, 'q_dim');
        if(!isset($aDimensions[$sDimension]))
            $sDimension = key($aDimensions);

        $aMetrics = $this->_oDb->getBreakdownMetrics($sDimension);
        $sMetric = (string)$this->_param($aParams, 'q_metric');
        if(!in_array($sMetric, $aMetrics, true))
            $sMetric = $aMetrics[0];

        return [
            'dimension' => $sDimension,
            'kind' => $aDimensions[$sDimension],
            'metric' => $sMetric,
            'metrics' => $aMetrics,
            'dir' => $this->_param($aParams, 'q_dir') === 'asc' ? 'asc' : 'desc',
        ];
    }

    /**
     * Every value of a report's dimension with its metrics, for a CSV download: the query,
     * or a table or top list tab (by visitors). Rows are the label, the stored value and the
     * metrics as plain numbers.
     *
     * @param string $sReport query, table or top
     * @param int $iMax rows at most
     * @return array dimension, header, rows, total (values in the period), truncated; or false
     */
    public function getExport($sReport, BxAnalyticsFilter $oFilter, $aParams, $iMax)
    {
        switch($sReport) {
            case 'query':
                $aQuery = $this->getQueryParams($aParams);
                break;

            case 'table':
            case 'top':
                $aLists = $sReport == 'table' ? $this->_aTables : $this->_aGroups;
                $sList = (string)$this->_param($aParams, $sReport == 'table' ? 'table' : 'group');
                if(!isset($aLists[$sList]))
                    return false;
                $aQuery = $this->getQueryParams(['q_dim' => $aLists[$sList][$this->_getTab($aParams, $sList, $aLists[$sList])]]);
                break;

            default:
                return false;
        }

        $aFilter = $oFilter->get();
        $aColumns = $this->_getQueryColumns($aQuery);

        $aHeader = [$aColumns[0]['title'], _t('_bx_analytics_txt_raw_value')];
        foreach(array_slice($aColumns, 1) as $aColumn)
            $aHeader[] = $aColumn['title'];

        // one query: pages of a re-run aggregate would cost a full scan each and could
        // repeat or skip values that change places while hits come in
        $iMax = max(1, (int)$iMax);
        $aRows = [];
        foreach($this->_getQueryRows($aFilter, $aQuery, $iMax, 0, $iMax) as $aRow) {
            $aLine = [$this->getLabel($aQuery['dimension'], $aRow['value']), $aRow['value']];
            foreach(array_slice($aColumns, 1) as $aColumn)
                $aLine[] = isset($aRow[$aColumn['key']]) ? $aRow[$aColumn['key']] : 0;
            $aRows[] = $aLine;
        }

        $iTotal = $this->_oDb->getTopCount($aFilter, $aQuery['dimension']);

        return [
            'dimension' => $aQuery['dimension'],
            'header' => $aHeader,
            'rows' => $aRows,
            'total' => $iTotal,
            'truncated' => $iTotal > count($aRows),
        ];
    }

    /**
     * Query rows: the stored value and the metrics as numbers (KPIs for a session dimension,
     * pageview figures for a page or title).
     *
     * @param bool $bPathSessions pages get entries, bounce rate and exits
     */
    protected function _getQueryRows($aFilter, $aQuery, $iLimit, $iStart, $iMax = 1000, $bPathSessions = true)
    {
        $aRows = $this->_oDb->getBreakdown($aFilter, $aQuery['dimension'], $aQuery['metric'], $aQuery['dir'] == 'asc' ? 'ASC' : 'DESC', $iLimit, $iStart, $iMax, $bPathSessions);

        $aResult = [];
        foreach($aRows as $aRow)
            $aResult[] = ['value' => (string)$aRow['value']] + ($aQuery['kind'] == 'session' ? $this->_getKpis($aRow) : $this->_getPageKpis($aRow));

        return $aResult;
    }

    /**
     * Metrics of a page or title row from BxAnalyticsDb::getPageStats.
     */
    protected function _getPageKpis($aRow)
    {
        $aResult = [
            'visitors' => isset($aRow['visitors']) ? (int)$aRow['visitors'] : 0,
            'pageviews' => isset($aRow['pageviews']) ? (int)$aRow['pageviews'] : 0,
            'engaged' => isset($aRow['engaged']) ? round((float)$aRow['engaged'], 1) : 0,
        ];

        if(isset($aRow['entries']))
            $aResult += [
                'entries' => (int)$aRow['entries'],
                'bounce_rate' => (float)$aRow['bounce_rate'],
                'exits' => (int)$aRow['exits'],
            ];

        return $aResult;
    }

    /**
     * Table columns of a query, the sorted one marked.
     */
    protected function _getQueryColumns($aQuery)
    {
        if($aQuery['kind'] == 'session')
            $aTypes = ['visitors' => 'number', 'sessions' => 'number', 'pageviews' => 'number', 'bounce_rate' => 'percent', 'pages_per_session' => 'decimal', 'duration' => 'duration'];
        else {
            $aTypes = ['visitors' => 'number', 'pageviews' => 'number', 'engaged' => 'engaged'];
            if($aQuery['dimension'] == 'path')
                $aTypes += ['entries' => 'number', 'bounce_rate' => 'percent', 'exits' => 'number'];
        }

        $aColumns = [['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_dim_' . $aQuery['dimension'])]];
        foreach($aTypes as $sKey => $sType) {
            $aColumn = ['key' => $sKey, 'type' => $sType, 'title' => _t('_bx_analytics_metric_' . $sKey)];
            if($sKey == $aQuery['metric'])
                $aColumn['sort'] = $aQuery['dir'] == 'asc' ? 'ascending' : 'descending';
            $aColumns[] = $aColumn;
        }

        return $aColumns;
    }

    /**
     * The chosen metric of some values per bucket. A bucket without data is 0 for a count
     * and a gap for an average or a rate; buckets after now are gaps.
     */
    protected function _getQuerySeries($aFilter, $aQuery, $aValues)
    {
        $sMetric = $aQuery['metric'];
        $bRatio = in_array($sMetric, ['pages_per_session', 'bounce_rate', 'duration', 'engaged'], true);

        $aData = [];
        foreach($this->_oDb->getBreakdownSeries($aFilter, $aQuery['dimension'], array_column($aValues, 'value'), $aFilter['bucket'], $aFilter['offset'], $aFilter['starts']) as $aRow) {
            $aKpis = $aQuery['kind'] == 'session' ? $this->_getKpis($aRow) : $this->_getPageKpis($aRow);
            $aData[(string)$aRow['value']][(int)$aRow['bucket']] = $aKpis[$sMetric];
        }

        $aBuckets = $aFilter['buckets'];
        $aSeries = [];
        foreach($aValues as $aValue) {
            $aPoints = [];
            foreach($aBuckets as $i => $iBucket) {
                $iNext = isset($aBuckets[$i + 1]) ? $aBuckets[$i + 1] : $aFilter['to'];
                if($iBucket > $aFilter['now'])
                    $mixedValue = null;
                elseif(isset($aData[$aValue['value']][$iBucket]))
                    $mixedValue = $aData[$aValue['value']][$iBucket];
                else
                    $mixedValue = $bRatio ? null : 0;

                $aPoints[] = [
                    't' => $iBucket,
                    'v' => $mixedValue,
                    'partial' => $iBucket <= $aFilter['now'] && $aFilter['now'] < $iNext,
                ];
            }

            $aSeries[] = [
                'value' => $aValue['value'],
                'label' => $this->getLabel($aQuery['dimension'], $aValue['value']),
                'points' => $aPoints,
            ];
        }

        return [
            'kind' => 'series',
            'metric' => $sMetric,
            'title' => _t('_bx_analytics_metric_' . $sMetric),
            'bucket' => $aFilter['bucket'],
            'tz' => $aFilter['tz'],
            'series' => $aSeries,
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

        $aTabs = $this->_aReportTabs['map'];
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

        $aCategories = $this->_getBotCategories();
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

        $aTabs = $this->_aReportTabs['events'];
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

        // the most common values of each property among the latest occurrences; a sale's
        // properties only for those who may see revenue (events recorded earlier carry amounts)
        $aProps = [];
        $bMoney = $aEvent['type'] == BX_ANALYTICS_HIT_UNA && in_array($aEvent['name'], ['purchase', 'renewal', 'trial_start'], true);
        foreach($bMoney && $this->_oModule->checkAllowedRevenue() !== CHECK_ACTION_RESULT_ALLOWED ? [] : $this->_oDb->getEventProps($aFilter, $aEvent) as $sJson) {
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

        $aMembers = $this->_oDb->getMemberList($aFilter, $this->_iPerPage, ($iPage - 1) * $this->_iPerPage);

        // lifetime value: what each member paid, for viewers who may see revenue
        $bRevenue = $this->_oModule->checkAllowedRevenue() === CHECK_ACTION_RESULT_ALLOWED;
        $aLtv = $bRevenue ? $this->getLifetimeValues(array_column($aMembers, 'profile_id')) : [];

        $aRows = [];
        foreach($aMembers as $aRow) {
            $aMember = $this->getMember((int)$aRow['profile_id']);
            $aValues = [
                'sessions' => (int)$aRow['sessions'],
                'pageviews' => (int)$aRow['pageviews'],
                'duration' => (int)$aRow['duration'],
                'platforms' => $this->_getPlatformsText($aRow['platforms']),
                'last' => (int)$aRow['last'],
            ];
            if($bRevenue)
                $aValues['ltv'] = isset($aLtv[$aRow['profile_id']]) ? round((float)$aLtv[$aRow['profile_id']], 2) : 0;

            $aRows[] = [
                'label' => $aMember ? $aMember['name'] : _t('_bx_analytics_txt_deleted_member'),
                'sub' => $aRow['country'] !== '' ? $this->getLabel('country', $aRow['country']) : '',
                'open' => ['param' => 'user', 'value' => (int)$aRow['profile_id']],
                'values' => $aValues,
            ];
        }

        $aColumns = [
            ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_member_name')],
            ['key' => 'sessions', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sessions')],
            ['key' => 'pageviews', 'type' => 'number', 'title' => _t('_bx_analytics_metric_pageviews')],
            ['key' => 'duration', 'type' => 'duration', 'title' => _t('_bx_analytics_txt_time_spent')],
            ['key' => 'platforms', 'type' => 'text', 'title' => _t('_bx_analytics_tab_platforms')],
        ];
        if($bRevenue)
            $aColumns[] = ['key' => 'ltv', 'type' => 'money', 'title' => _t('_bx_analytics_txt_lifetime_value')];
        $aColumns[] = ['key' => 'last', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_last_seen')];

        return [
            'view' => 'list',
            'name' => 'users',
            'caption' => _t('_bx_analytics_lmi_cpt_users'),
            'columns' => $aColumns,
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

        $aTiles = [
            ['title' => _t('_bx_analytics_metric_sessions'), 'value' => $iSessions, 'type' => 'number'],
            ['title' => _t('_bx_analytics_metric_pageviews'), 'value' => (int)$aTotals['totals']['pageviews'], 'type' => 'number'],
            ['title' => _t('_bx_analytics_txt_time_spent'), 'value' => (int)$aTotals['totals']['duration'], 'type' => 'duration'],
            ['title' => _t('_bx_analytics_txt_first_seen'), 'value' => (int)$aTotals['totals']['first'], 'type' => 'date'],
            ['title' => _t('_bx_analytics_txt_last_seen'), 'value' => (int)$aTotals['totals']['last'], 'type' => 'datetime'],
        ];
        if($this->_oModule->checkAllowedRevenue() === CHECK_ACTION_RESULT_ALLOWED) {
            $aLtv = $this->getLifetimeValues([$iProfileId]);
            $aTiles[] = ['title' => _t('_bx_analytics_txt_lifetime_value'), 'value' => isset($aLtv[$iProfileId]) ? round((float)$aLtv[$iProfileId], 2) : 0, 'type' => 'money'];
        }

        return [
            'view' => 'user',
            'member' => $this->getMember($iProfileId),
            'tiles' => $aTiles,
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

        // each visit's pages in order, a page reloaded in place counted once
        $aRead = $this->_oDb->getPageSequences($oFilter->get(), $iLimit);
        $aSequences = $aRead['sequences'];

        $aEntries = [];
        $aPaths = [];
        foreach($aSequences as $aSequence) {
            $aEntries[$aSequence[0]] = (isset($aEntries[$aSequence[0]]) ? $aEntries[$aSequence[0]] : 0) + 1;
            $sPath = implode("\n", array_slice($aSequence, 0, 3));
            $aPaths[$sPath] = (isset($aPaths[$sPath]) ? $aPaths[$sPath] : 0) + 1;
        }
        arsort($aEntries);
        arsort($aPaths);

        $sFrom = (string)$this->_param($aParams, 'jfrom', '');
        if($sFrom === '' || !isset($aEntries[$sFrom]) && !$this->_inSequences($aSequences, $sFrom))
            $sFrom = !empty($aEntries) ? (string)key($aEntries) : '';
        $sVia = (string)$this->_param($aParams, 'via', '');

        // the page after the first visit of `jfrom`, and after `via` when it came right after
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
            'jfrom' => $sFrom,
            'via' => $sVia !== '' && $iViaSessions ? $sVia : '',
            'sessions' => $iTotal,
            'truncated' => $aRead['rows'] >= $iLimit,
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
        $aTabs = $this->_aReportTabs['retention'];
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

        foreach($this->_oDb->getRetentionCohorts($iFrom, $iNow + 1, $aFilter['platform'], $aTabs[$sTab]) as $aRow) {
            $iCohort = $iFrom + (int)$aRow['cohort'] * 604800;
            if(!isset($aCohorts[$iCohort]))
                continue;

            $iVisitors = (int)$aRow['visitors'];
            $iMask = (int)$aRow['weeks'];
            $aCohorts[$iCohort]['size'] += $iVisitors;
            foreach(array_keys($aCohorts[$iCohort]['back']) as $iIndex)
                if($iMask & (1 << ((int)$aRow['cohort'] + $iIndex)))
                    $aCohorts[$iCohort]['back'][$iIndex] += $iVisitors;
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

    /**
     * Goals with their conversions: visits and visitors that reached them, the conversion
     * rate of all visits, and the change against the previous period.
     */
    public function getGoals(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aFilter = $oFilter->get();
        $aPrevious = $oFilter->getPrevious();

        $aTotals = $this->_oDb->getTotals($aFilter);
        $aTotalsPrevious = $this->_oDb->getTotals($aPrevious);
        $iSessions = (int)$aTotals['sessions'];
        $iSessionsPrevious = (int)$aTotalsPrevious['sessions'];

        $aGoals = [];
        foreach($this->_oDb->getGoals($this->_oConfig->CNF['MAX_GOALS']) as $aGoal) {
            $aCurrent = $this->_oDb->getGoalTotals($aFilter, $aGoal);
            $aBefore = $this->_oDb->getGoalTotals($aPrevious, $aGoal);
            $fRate = $iSessions ? round(100 * $aCurrent['sessions'] / $iSessions, 2) : 0;
            $fRateBefore = $iSessionsPrevious ? round(100 * $aBefore['sessions'] / $iSessionsPrevious, 2) : 0;

            $aGoals[] = [
                'id' => (int)$aGoal['id'],
                'name' => $aGoal['name'],
                'type' => $aGoal['type'],
                'pattern' => $aGoal['pattern'],
                'conversions' => (int)$aCurrent['sessions'],
                'visitors' => (int)$aCurrent['visitors'],
                'rate' => $fRate,
                'change' => $this->_change($fRate, $fRateBefore),
            ];
        }

        return [
            'goals' => $aGoals,
            'sessions' => $iSessions,
            'manage' => $this->_oModule->checkAllowedManage() === CHECK_ACTION_RESULT_ALLOWED,
            'edit' => (string)$this->_param($aParams, 'edit_goal', ''),
        ];
    }

    /**
     * A funnel's steps with the visits that reached each one in order within the visit, and
     * the drop between steps. Param `funnel` (default: the first).
     */
    public function getFunnels(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aFunnels = $this->_oDb->getFunnels();
        $iFunnel = (int)$this->_param($aParams, 'funnel', 0);

        $aFunnel = !empty($aFunnels) ? $aFunnels[0] : null;
        foreach($aFunnels as $a)
            if((int)$a['id'] === $iFunnel)
                $aFunnel = $a;

        $aSteps = [];
        if($aFunnel) {
            $aDefinition = json_decode($aFunnel['steps'], true);
            $aDefinition = is_array($aDefinition) ? $aDefinition : [];

            // each visit walks the steps in order: a step counts when it happens after the previous one
            $aDefinition = array_values(array_filter($aDefinition, function($aStep) {
                return is_array($aStep) && isset($aStep['type'], $aStep['pattern']);
            }));
            foreach($this->_oDb->getFunnelCounts($oFilter->get(), $aDefinition) as $i => $iSessions)
                $aSteps[] = [
                    'type' => $aDefinition[$i]['type'],
                    'pattern' => $aDefinition[$i]['pattern'],
                    'sessions' => $iSessions,
                ];

            $iFirst = !empty($aSteps) ? $aSteps[0]['sessions'] : 0;
            foreach($aSteps as $i => $aStep) {
                $aSteps[$i]['rate'] = $iFirst ? round(100 * $aStep['sessions'] / $iFirst, 1) : 0;
                $aSteps[$i]['drop'] = $i > 0 && $aSteps[$i - 1]['sessions'] ? round(100 * ($aSteps[$i - 1]['sessions'] - $aStep['sessions']) / $aSteps[$i - 1]['sessions'], 1) : null;
            }
        }

        $aList = [];
        foreach($aFunnels as $a)
            $aList[] = ['id' => (int)$a['id'], 'name' => $a['name'], 'active' => $aFunnel && (int)$a['id'] === (int)$aFunnel['id']];

        return [
            'funnels' => $aList,
            'funnel' => $aFunnel ? ['id' => (int)$aFunnel['id'], 'name' => $aFunnel['name']] : null,
            'steps' => $aSteps,
            'manage' => $this->_oModule->checkAllowedManage() === CHECK_ACTION_RESULT_ALLOWED,
            'edit' => (string)$this->_param($aParams, 'edit_funnel', ''),
            'definition' => $aFunnel ? json_decode($aFunnel['steps'], true) : [],
            'max_steps' => $this->_oConfig->CNF['MAX_FUNNEL_STEPS'],
        ];
    }

    protected function _inSequences($aSequences, $sPage)
    {
        foreach($aSequences as $aSequence)
            if(in_array($sPage, $aSequence, true))
                return true;

        return false;
    }

    /*
     * Health: client errors and performance
     */

    /**
     * Client errors grouped by fingerprint, with their hits, visitors and platforms in the
     * period and a trend per group. With `error` (a group id) one group in detail. Tabs: open,
     * new (first seen in the period), resolved, ignored, all.
     */
    public function getErrors(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $iError = (int)$this->_param($aParams, 'error', 0);
        if($iError)
            return $this->_getErrorDetail($oFilter, $iError);

        // ignored errors keep counting but stay out of everything but their own tab
        $aCounted = ['open', 'resolved'];
        $aTabs = $this->_aReportTabs['errors'];
        $sTab = $this->_getTab($aParams, 'errors', $aTabs);
        $aFilter = $oFilter->get();
        $iNewFrom = $sTab == 'new' ? (int)$aFilter['from'] : 0;

        // crashes are fatal errors in the apps, against the apps' visits
        $aApps = array_values(array_filter(array_keys($this->_oConfig->getPlatforms()), [$this->_oConfig, 'isAppPlatform']));
        $aTotals = $this->_oDb->getErrorTotals($aFilter, $aCounted, $aApps);
        $aBefore = $this->_oDb->getErrorTotals($oFilter->getPrevious(), $aCounted);
        $aSessions = $this->_oDb->getSessionsPerPlatform($aFilter);
        $iSessions = (int)array_sum($aSessions);
        $iAppSessions = 0;
        foreach($aApps as $sApp)
            $iAppSessions += isset($aSessions[$sApp]) ? (int)$aSessions[$sApp] : 0;

        $aTiles = [
            ['title' => _t('_bx_analytics_metric_errors'), 'value' => (int)$aTotals['hits'], 'type' => 'number', 'metric' => 'errors', 'change' => $this->_change((int)$aTotals['hits'], (int)$aBefore['hits'])],
            ['title' => _t('_bx_analytics_metric_error_sessions'), 'value' => $iSessions ? round(100 * $aTotals['sessions'] / $iSessions, 1) : null, 'type' => 'percent', 'sub' => _t('_bx_analytics_txt_n_sessions', (int)$aTotals['sessions'])],
        ];
        if($aFilter['platform'] === '' || $this->_oConfig->isAppPlatform($aFilter['platform']))
            $aTiles[] = ['title' => _t('_bx_analytics_metric_crash_free'), 'value' => $iAppSessions ? round(100 - 100 * min($iAppSessions, (int)$aTotals['fatal_sessions']) / $iAppSessions, 2) : null, 'type' => 'percent_precise', 'sub' => _t('_bx_analytics_txt_crash_free_apps')];
        $aTiles[] = ['title' => _t('_bx_analytics_metric_new_errors'), 'value' => $this->_oDb->getErrorListCount($aFilter, $aCounted, (int)$aFilter['from']), 'type' => 'number'];

        $iTotal = $this->_oDb->getErrorListCount($aFilter, $aTabs[$sTab], $iNewFrom);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_errors', 1)));

        $aList = $this->_oDb->getErrorList($aFilter, $aTabs[$sTab], $iNewFrom, $this->_iPerPage, ($iPage - 1) * $this->_iPerPage);
        $aIds = array_map('intval', array_column($aList, 'error_id'));
        $aGroups = $this->_oDb->getErrorGroups($aIds);
        $aTrends = $this->_oDb->getErrorTrends($aFilter, $aIds, $aFilter['bucket'], $aFilter['offset'], $aFilter['starts']);

        $iMax = 1;
        foreach($aList as $aRow)
            $iMax = max($iMax, (int)$aRow['count']);

        $aRows = [];
        foreach($aList as $aRow) {
            $iId = (int)$aRow['error_id'];
            if(!isset($aGroups[$iId]))
                continue;

            $aGroup = $aGroups[$iId];
            $aTrend = [];
            foreach($aFilter['buckets'] as $iBucket)
                $aTrend[] = isset($aTrends[$iId][$iBucket]) ? $aTrends[$iId][$iBucket] : 0;

            $aRows[] = [
                'label' => $this->getErrorLabel($aGroup),
                'sub' => implode(' · ', array_filter([
                    _t('_bx_analytics_error_kind_' . $aGroup['kind']),
                    $this->_getErrorLocation($aGroup),
                    (int)$aRow['fatal'] ? _t('_bx_analytics_txt_fatal') : '',
                    $sTab == 'all' ? _t('_bx_analytics_error_status_' . $aGroup['status']) : '',
                ])),
                'open' => ['param' => 'error', 'value' => $iId],
                'bar' => round(100 * $aRow['count'] / $iMax, 1),
                'values' => [
                    'trend' => $aTrend,
                    'count' => (int)$aRow['count'],
                    'users' => (int)$aRow['users'],
                    'platforms' => $this->_getPlatformsText($aRow['platforms']),
                    'first_seen' => (int)$aGroup['first_seen'],
                    'last_seen' => (int)$aRow['last_in'],
                ],
            ];
        }

        return [
            'view' => 'list',
            'tiles' => $aTiles,
            'name' => 'errors',
            'caption' => _t('_bx_analytics_lmi_cpt_errors'),
            'tab' => $sTab,
            'tabs' => $this->_getTabs($aTabs, $sTab, '_bx_analytics_tab_errors_'),
            'columns' => [
                ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_error')],
                ['key' => 'trend', 'type' => 'spark', 'title' => _t('_bx_analytics_txt_trend')],
                ['key' => 'count', 'type' => 'number', 'title' => _t('_bx_analytics_metric_occurrences')],
                ['key' => 'users', 'type' => 'number', 'title' => _t('_bx_analytics_metric_visitors')],
                ['key' => 'platforms', 'type' => 'text', 'title' => _t('_bx_analytics_dim_platform')],
                ['key' => 'last_seen', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_last_seen')],
            ],
            'rows' => $aRows,
            'page' => $iPage,
            'pages' => $iPages,
            'empty' => _t($sTab == 'open' || $sTab == 'new' ? '_bx_analytics_txt_no_errors' : '_bx_analytics_txt_no_data'),
        ];
    }

    /**
     * One error group: what and where, its hits over time and by client, and the latest
     * occurrences. The stack and the visits behind the occurrences can carry what a visitor
     * typed or opened, so they need the people permission.
     */
    protected function _getErrorDetail(BxAnalyticsFilter $oFilter, $iId)
    {
        $aGroup = $this->_oDb->getErrorGroup($iId);
        if(empty($aGroup))
            return ['view' => 'detail', 'missing' => true, 'title' => _t('_bx_analytics_txt_error_missing')];

        $aFilter = $oFilter->get();
        $bPeople = $this->_oModule->checkAllowedPeople() === CHECK_ACTION_RESULT_ALLOWED;
        $bManage = $this->_oModule->checkAllowedManage() === CHECK_ACTION_RESULT_ALLOWED;

        $aStats = $this->_oDb->getErrorStats($aFilter, $iId);
        $aRows = $this->_oDb->getErrorSeries($aFilter, $iId, $aFilter['bucket'], $aFilter['offset'], $aFilter['starts']);
        $aCounts = [];
        $aUsers = [];
        foreach($aFilter['buckets'] as $iBucket) {
            $aCounts[] = isset($aRows[$iBucket]) ? (int)$aRows[$iBucket]['count'] : 0;
            $aUsers[] = isset($aRows[$iBucket]) ? (int)$aRows[$iBucket]['users'] : 0;
        }

        // where it happens: a table per client column that has values
        $aBreakdowns = [];
        foreach(['platform', 'route', 'browser', 'os', 'device', 'app_version', 'country'] as $sColumn) {
            $aValues = $this->_oDb->getErrorBreakdown($aFilter, $iId, $sColumn);
            if(empty($aValues) || (count($aValues) == 1 && $aValues[0]['value'] === ''))
                continue;

            $iTotal = 0;
            foreach($aValues as $aValue)
                $iTotal += (int)$aValue['count'];

            $aBreakdownRows = [];
            foreach($aValues as $aValue)
                $aBreakdownRows[] = [
                    'label' => $this->getLabel($sColumn, (string)$aValue['value']),
                    'bar' => $iTotal ? round(100 * $aValue['count'] / $iTotal, 1) : 0,
                    'values' => [
                        'count' => (int)$aValue['count'],
                        'share' => $iTotal ? round(100 * $aValue['count'] / $iTotal, 1) : 0,
                    ],
                ];

            $sTitle = _t($sColumn == 'route' ? '_bx_analytics_txt_route' : '_bx_analytics_dim_' . $sColumn);
            $aBreakdowns[] = [
                'name' => 'error_' . $sColumn,
                'caption' => $sTitle,
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => $sTitle],
                    ['key' => 'count', 'type' => 'number', 'title' => _t('_bx_analytics_metric_occurrences')],
                    ['key' => 'share', 'type' => 'percent', 'title' => _t('_bx_analytics_txt_share')],
                ],
                'rows' => $aBreakdownRows,
            ];
        }

        $aOccurrences = [];
        foreach($this->_oDb->getErrorOccurrences($aFilter, $iId) as $aHit) {
            $aRow = [
                'label' => $aHit['path'] !== '' ? $aHit['path'] : '/',
                'sub' => implode(' · ', array_filter([
                    $this->getLabel('platform', $aHit['platform']),
                    $aHit['app_version'],
                    $aHit['device'] !== '' ? $this->getLabel('device', $aHit['device']) : '',
                    $aHit['browser'],
                    $aHit['os'],
                    $aHit['country'] !== '' ? $this->getLabel('country', $aHit['country']) : '',
                ])),
                'values' => [
                    'ts' => (int)$aHit['ts'],
                    'repeats' => (int)$aHit['repeats'],
                ],
            ];
            // the visit behind it, for those who may see visits (Studio is for administrators)
            if($bPeople && (int)$aHit['session_id'] && isAdmin())
                $aRow['link'] = BX_DOL_URL_STUDIO . 'module.php?name=' . $this->_oModule->getName() . '&page=sessions&session=' . (int)$aHit['session_id'];
            $aOccurrences[] = $aRow;
        }

        $aActions = [];
        if($bManage)
            foreach(['resolved', 'ignored', 'open'] as $sStatus)
                if($sStatus != $aGroup['status'])
                    $aActions[] = ['op' => $sStatus, 'title' => _t('_bx_analytics_txt_error_mark_' . $sStatus)];

        $sLocation = $this->_getErrorLocation($aGroup, true);

        return [
            'view' => 'detail',
            'id' => (int)$aGroup['id'],
            'title' => $this->getErrorLabel($aGroup),
            'status' => $aGroup['status'],
            'facts' => array_values(array_filter([
                ['title' => _t('_bx_analytics_txt_error_status'), 'value' => _t('_bx_analytics_error_status_' . $aGroup['status']), 'type' => 'text'],
                ['title' => _t('_bx_analytics_txt_error_kind'), 'value' => _t('_bx_analytics_error_kind_' . $aGroup['kind']) . ((int)$aGroup['fatal'] ? ' · ' . _t('_bx_analytics_txt_fatal') : ''), 'type' => 'text'],
                $sLocation !== '' ? ['title' => _t('_bx_analytics_txt_error_source'), 'value' => $sLocation, 'type' => 'text'] : null,
                (int)$aGroup['status_code'] ? ['title' => _t('_bx_analytics_txt_error_http_status'), 'value' => (string)(int)$aGroup['status_code'], 'type' => 'text'] : null,
                ['title' => _t('_bx_analytics_txt_first_seen'), 'value' => (int)$aGroup['first_seen'], 'type' => 'datetime'],
                ['title' => _t('_bx_analytics_txt_last_seen'), 'value' => (int)$aGroup['last_seen'], 'type' => 'datetime'],
                ['title' => _t('_bx_analytics_txt_error_all_time'), 'value' => (int)$aGroup['occurrences'], 'type' => 'number'],
            ])),
            'stack' => $bPeople ? (string)$aGroup['stack'] : '',
            'stack_hidden' => !$bPeople && (string)$aGroup['stack'] !== '',
            'tiles' => [
                ['title' => _t('_bx_analytics_metric_occurrences'), 'value' => (int)$aStats['count'], 'type' => 'number'],
                ['title' => _t('_bx_analytics_metric_visitors'), 'value' => (int)$aStats['users'], 'type' => 'number'],
                ['title' => _t('_bx_analytics_metric_sessions'), 'value' => (int)$aStats['sessions'], 'type' => 'number'],
            ],
            'chart' => [
                'kind' => 'lines',
                'labels' => $aFilter['buckets'],
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => [
                    ['key' => 'count', 'label' => _t('_bx_analytics_metric_occurrences'), 'values' => $aCounts],
                    ['key' => 'users', 'label' => _t('_bx_analytics_metric_visitors'), 'values' => $aUsers],
                ],
            ],
            'breakdowns' => $aBreakdowns,
            'occurrences' => [
                'name' => 'error_hits',
                'caption' => _t('_bx_analytics_txt_error_latest'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_tab_pages')],
                    ['key' => 'repeats', 'type' => 'number', 'title' => _t('_bx_analytics_metric_occurrences')],
                    ['key' => 'ts', 'type' => 'datetime', 'title' => _t('_bx_analytics_txt_time')],
                ],
                'rows' => $aOccurrences,
            ],
            'manage' => $bManage,
            'actions' => $aActions,
        ];
    }

    /**
     * What an error group is called in lists: its message, or a name for the catch-all group.
     */
    public function getErrorLabel($aGroup)
    {
        if($aGroup['kind'] == BxAnalyticsErrors::KIND_OVERFLOW)
            return _t('_bx_analytics_txt_error_overflow');

        return $aGroup['message'] !== '' ? $aGroup['message'] : _t('_bx_analytics_txt_unknown');
    }

    /**
     * Script and position of an error, file:line or file:line:column.
     */
    protected function _getErrorLocation($aGroup, $bColumn = false)
    {
        if($aGroup['source'] === '')
            return '';

        $sLocation = $aGroup['source'];
        if((int)$aGroup['line'])
            $sLocation .= ':' . (int)$aGroup['line'] . ($bColumn && (int)$aGroup['col'] ? ':' . (int)$aGroup['col'] : '');

        return $sLocation;
    }

    /**
     * Web vitals and app timings: the 75th percentile of each metric with the share of good,
     * needing improvement and poor values; the chosen metric over time, by platform and by
     * page. Params: `vital` (metric), `vital_device` (all, mobile, desktop), tab
     * (`tab_performance`): route or path.
     */
    public function getPerformance(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aFilter = $oFilter->get();
        $aThresholds = $this->_oConfig->CNF['VITALS'];
        $iMinSamples = 20;

        // the metrics the platform has: web vitals in browsers, screen loads and starts in apps
        $sPlatform = $aFilter['platform'];
        $aMetrics = BxAnalyticsVitals::METRICS;
        if($sPlatform !== '' && $this->_oConfig->isBrowserPlatform($sPlatform))
            $aMetrics = BxAnalyticsVitals::WEB_METRICS;
        elseif($sPlatform !== '' && $this->_oConfig->isAppPlatform($sPlatform))
            $aMetrics = BxAnalyticsVitals::APP_METRICS;

        $sMetric = (string)$this->_param($aParams, 'vital', '');
        if(!in_array($sMetric, $aMetrics, true))
            $sMetric = $aMetrics[0];

        $sDevice = (string)$this->_param($aParams, 'vital_device', 'all');
        if(!in_array($sDevice, ['all', 'mobile', 'desktop'], true))
            $sDevice = 'all';

        $aGroups = $this->_aReportTabs['performance'];
        $sGroup = $this->_getTab($aParams, 'performance', $aGroups);

        // the cards: exact counts on each side of the thresholds, and the histograms of the
        // metrics with enough samples, each in one pass
        $aDistribution = $this->_oDb->getVitalsDistribution($aFilter, $sDevice, $aThresholds);
        $aCardMetrics = [];
        foreach($aMetrics as $sCardMetric)
            if($aDistribution[$sCardMetric]['samples'] >= $iMinSamples)
                $aCardMetrics[] = $sCardMetric;
        list($aCardHistograms) = $this->_getHistograms($this->_oDb->getVitalsHistograms($aFilter, $aCardMetrics, $sDevice));

        $aCards = [];
        foreach($aMetrics as $sCardMetric) {
            $aCount = $aDistribution[$sCardMetric];
            $iSamples = $aCount['samples'];

            $mixedP75 = null;
            if(isset($aCardHistograms[$sCardMetric]))
                $mixedP75 = BxAnalyticsVitals::getPercentile($aCardHistograms[$sCardMetric], 0.75, $iMinSamples, [$aCount['good'], $iSamples - $aCount['good'] - $aCount['poor'], $aCount['poor']], $aThresholds[$sCardMetric]);

            $aCards[] = [
                'metric' => $sCardMetric,
                'title' => _t('_bx_analytics_vital_' . $sCardMetric),
                'unit' => BxAnalyticsVitals::getUnit($sCardMetric),
                'value' => $mixedP75 !== null ? BxAnalyticsVitals::toDisplay($sCardMetric, round($mixedP75)) : null,
                'rating' => $mixedP75 !== null ? BxAnalyticsVitals::getRating(round($mixedP75), $aThresholds[$sCardMetric]) : '',
                'samples' => $iSamples,
                'good' => $iSamples ? round(100 * $aCount['good'] / $iSamples, 1) : 0,
                'needs_improvement' => $iSamples ? round(100 * ($iSamples - $aCount['good'] - $aCount['poor']) / $iSamples, 1) : 0,
                'poor' => $iSamples ? round(100 * $aCount['poor'] / $iSamples, 1) : 0,
                'good_max' => BxAnalyticsVitals::toDisplay($sCardMetric, $aThresholds[$sCardMetric][0]),
                'poor_min' => BxAnalyticsVitals::toDisplay($sCardMetric, $aThresholds[$sCardMetric][1]),
                'active' => $sCardMetric == $sMetric,
            ];
        }

        $sUnit = BxAnalyticsVitals::getUnit($sMetric);
        $fP75 = function($aHistogram, $aSides, $iMin) use ($sMetric, $aThresholds) {
            $mixedValue = BxAnalyticsVitals::getPercentile($aHistogram, 0.75, $iMin, $aSides, $aThresholds[$sMetric]);
            return $mixedValue !== null ? BxAnalyticsVitals::toDisplay($sMetric, round($mixedValue)) : null;
        };
        $fRating = function($mixedValue) use ($sMetric, $aThresholds) {
            return $mixedValue !== null ? BxAnalyticsVitals::getRating($sMetric == 'cls' ? round($mixedValue * 1000) : $mixedValue, $aThresholds[$sMetric]) : '';
        };

        // the 75th percentile per time bucket, with the thresholds as lines; a bucket with few
        // samples is left as a gap
        list($aByBucket, $aBucketSides) = $this->_getHistograms($this->_oDb->getVitalsHistogram($aFilter, $sMetric, $sDevice, 'bucket', [], [$aFilter['bucket'], $aFilter['offset'], $aFilter['starts']]));
        $aValues = [];
        foreach($aFilter['buckets'] as $iBucket)
            $aValues[] = isset($aByBucket[$iBucket]) ? $fP75($aByBucket[$iBucket], $aBucketSides[$iBucket], 5) : null;
        $iCount = count($aFilter['buckets']);

        $aPlatformRows = [];
        list($aByPlatform, $aPlatformSides) = $this->_getHistograms($this->_oDb->getVitalsHistogram($aFilter, $sMetric, $sDevice, 'platform'));
        foreach($aByPlatform as $sValue => $aHistogram) {
            $mixedValue = $fP75($aHistogram, $aPlatformSides[$sValue], $iMinSamples);
            $aPlatformRows[] = [
                'label' => $this->getLabel('platform', (string)$sValue),
                'values' => ['p75' => $mixedValue, 'rating' => $fRating($mixedValue), 'samples' => (int)array_sum($aHistogram)],
            ];
        }
        usort($aPlatformRows, function($a, $b) { return $b['values']['samples'] - $a['values']['samples']; });

        $iTotal = $this->_oDb->getVitalsPagesCount($aFilter, $sMetric, $sDevice, $sGroup);
        $iPages = max(1, (int)ceil($iTotal / $this->_iPerPage));
        $iPage = min($iPages, max(1, (int)$this->_param($aParams, 'page_performance', 1)));
        $aPages = $this->_oDb->getVitalsPages($aFilter, $sMetric, $sDevice, $sGroup, $this->_iPerPage, ($iPage - 1) * $this->_iPerPage);
        list($aPageHistograms, $aPageSides) = $this->_getHistograms($this->_oDb->getVitalsHistogram($aFilter, $sMetric, $sDevice, $sGroup, array_map('strval', array_keys($aPages))));

        $iMax = 1;
        foreach($aPages as $iSamples)
            $iMax = max($iMax, (int)$iSamples);

        $aPageRows = [];
        foreach($aPages as $sValue => $iSamples) {
            $mixedValue = isset($aPageHistograms[$sValue]) ? $fP75($aPageHistograms[$sValue], $aPageSides[$sValue], $iMinSamples) : null;
            $aPageRows[] = [
                'label' => (string)$sValue,
                'bar' => round(100 * $iSamples / $iMax, 1),
                'values' => ['p75' => $mixedValue, 'rating' => $fRating($mixedValue), 'samples' => (int)$iSamples],
            ];
        }

        $aColumns = function($sTitle) use ($sUnit) {
            return [
                ['key' => 'label', 'type' => 'label', 'title' => $sTitle],
                ['key' => 'p75', 'type' => $sUnit, 'title' => _t('_bx_analytics_txt_p75')],
                ['key' => 'rating', 'type' => 'rating', 'title' => _t('_bx_analytics_txt_rating')],
                ['key' => 'samples', 'type' => 'number', 'title' => _t('_bx_analytics_txt_samples')],
            ];
        };

        $aDevices = [];
        foreach(['all', 'mobile', 'desktop'] as $sValue)
            $aDevices[] = ['value' => $sValue, 'title' => _t('_bx_analytics_txt_device_' . $sValue), 'selected' => $sValue == $sDevice];

        return [
            'metric' => $sMetric,
            'metric_title' => _t('_bx_analytics_vital_' . $sMetric),
            'unit' => $sUnit,
            'device' => $sDevice,
            'devices' => $aDevices,
            'min_samples' => $iMinSamples,
            'cards' => $aCards,
            'chart' => [
                'kind' => 'lines',
                'metric' => $sUnit,
                'labels' => $aFilter['buckets'],
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => [
                    ['key' => 'p75', 'label' => _t('_bx_analytics_txt_p75'), 'values' => $aValues],
                    ['key' => 'good', 'label' => _t('_bx_analytics_txt_threshold_good'), 'values' => array_fill(0, $iCount, BxAnalyticsVitals::toDisplay($sMetric, $aThresholds[$sMetric][0])), 'dashed' => true, 'tone' => 'good'],
                    ['key' => 'poor', 'label' => _t('_bx_analytics_txt_threshold_poor'), 'values' => array_fill(0, $iCount, BxAnalyticsVitals::toDisplay($sMetric, $aThresholds[$sMetric][1])), 'dashed' => true, 'tone' => 'bad'],
                ],
            ],
            'platforms' => [
                'name' => 'vital_platforms',
                'caption' => _t('_bx_analytics_tab_platforms'),
                'columns' => $aColumns(_t('_bx_analytics_dim_platform')),
                'rows' => $aPlatformRows,
                'empty' => _t('_bx_analytics_txt_no_vitals'),
            ],
            // named after the block, so its pager and the tabs (which reset the page) share page_performance
            'pages' => [
                'name' => 'performance',
                'caption' => _t('_bx_analytics_txt_vitals_pages'),
                'tab' => $sGroup,
                'tabs' => $this->_getTabs($aGroups, $sGroup, '_bx_analytics_tab_vitals_'),
                'columns' => $aColumns(_t($sGroup == 'route' ? '_bx_analytics_txt_route' : '_bx_analytics_tab_pages')),
                'rows' => $aPageRows,
                'page' => $iPage,
                'pages' => $iPages,
                'empty' => _t('_bx_analytics_txt_no_vitals'),
            ],
        ];
    }

    /**
     * Histogram rows (grp, hb, n, and side when the query has it) as [[group => [bucket =>
     * count]], [group => [counts up to the good threshold, between, above the poor one]]].
     */
    protected function _getHistograms($aRows)
    {
        $aHistograms = [];
        $aSides = [];
        foreach($aRows as $aRow) {
            $sGroup = (string)$aRow['grp'];
            $iBucket = (int)$aRow['hb'];
            $aHistograms[$sGroup][$iBucket] = (isset($aHistograms[$sGroup][$iBucket]) ? $aHistograms[$sGroup][$iBucket] : 0) + (int)$aRow['n'];

            if(!isset($aSides[$sGroup]))
                $aSides[$sGroup] = isset($aRow['side']) ? [0, 0, 0] : [];
            if(isset($aRow['side']))
                $aSides[$sGroup][min(2, max(0, (int)$aRow['side']))] += (int)$aRow['n'];
        }

        return [$aHistograms, $aSides];
    }

    /*
     * Revenue. Amounts come from the ledger in the site's default currency, as the payment
     * module recorded them; orders paid with credits are reported apart from money.
     */

    /**
     * Gross and net revenue, refunds, orders, paying customers and revenue per customer, over
     * time and split by source, provider, platform and the buyers' traffic sources. Param
     * `tab` (or tab_revenue): sources, providers, platforms, first_touch, last_touch, campaigns.
     */
    public function getRevenue(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aMoney = $this->getMoney();
        $aFilter = $this->_getRevenueFilter($oFilter->get(), $aMoney);
        $aPrevious = $this->_getRevenueFilter($oFilter->getPrevious(), $aMoney);

        $aCurrent = $this->_oDb->getRevenueTotals($aFilter);
        $aBefore = $this->_oDb->getRevenueTotals($aPrevious);

        $aTiles = [];
        foreach(['gross' => 'money', 'refunds' => 'money', 'net' => 'money', 'orders' => 'number', 'customers' => 'number', 'arppu' => 'money'] as $sKey => $sType) {
            $fValue = $sKey == 'arppu' ? ((int)$aCurrent['customers'] ? (float)$aCurrent['net'] / (int)$aCurrent['customers'] : 0) : (float)$aCurrent[$sKey];
            $fPrevious = $sKey == 'arppu' ? ((int)$aBefore['customers'] ? (float)$aBefore['net'] / (int)$aBefore['customers'] : 0) : (float)$aBefore[$sKey];

            $aTiles[] = [
                'key' => $sKey,
                'title' => _t('_bx_analytics_metric_revenue_' . $sKey),
                'value' => $sType == 'money' ? round($fValue, 2) : (int)$fValue,
                'previous' => $sType == 'money' ? round($fPrevious, 2) : (int)$fPrevious,
                'change' => $this->_change($fValue, $fPrevious),
                'type' => $sType,
                'metric' => $sKey,
            ];
        }

        $aRows = $this->_oDb->getRevenueSeries($aFilter);
        $aSeries = ['gross' => [], 'net' => [], 'refunds' => []];
        foreach($aFilter['buckets'] as $iBucket)
            foreach(array_keys($aSeries) as $sKey)
                $aSeries[$sKey][] = $iBucket > $aFilter['now'] ? null : (isset($aRows[$iBucket]) ? round((float)$aRows[$iBucket][$sKey], 2) : 0);

        $aDatasets = [];
        foreach($aSeries as $sKey => $aValues)
            $aDatasets[] = ['key' => $sKey, 'label' => _t('_bx_analytics_metric_revenue_' . $sKey), 'values' => $aValues];

        $aTabs = $this->_aReportTabs['revenue'];
        $sTab = $this->_getTab($aParams, 'revenue', $aTabs);

        $fNet = (float)$aCurrent['net'];
        $aSplit = [];
        foreach($this->_oDb->getRevenueSplit($aFilter, $aTabs[$sTab], 25) as $aRow) {
            $fRowNet = (float)$aRow['net'];
            $aSplit[] = [
                'label' => $this->getRevenueLabel($aTabs[$sTab], (string)$aRow['value'], $aMoney['payment']),
                'bar' => $fNet > 0 ? max(0, round(100 * $fRowNet / $fNet, 1)) : 0,
                'values' => [
                    'net' => round($fRowNet, 2),
                    'share' => $fNet > 0 ? round(100 * $fRowNet / $fNet, 1) : 0,
                    'customers' => (int)$aRow['customers'],
                    'orders' => (int)$aRow['orders'],
                ],
            ];
        }

        return [
            'money' => $aMoney,
            'tiles' => $aTiles,
            'chart' => [
                'kind' => 'lines',
                'metric' => 'money',
                'currency' => $aMoney['code'],
                'labels' => $aFilter['buckets'],
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => $aDatasets,
            ],
            'split' => [
                'name' => 'revenue',
                'caption' => _t('_bx_analytics_txt_revenue_split'),
                'tab' => $sTab,
                'tabs' => $this->_getTabs($aTabs, $sTab, '_bx_analytics_tab_revenue_'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_tab_revenue_' . $sTab)],
                    ['key' => 'net', 'type' => 'money', 'title' => _t('_bx_analytics_metric_revenue_net')],
                    ['key' => 'share', 'type' => 'percent', 'title' => _t('_bx_analytics_txt_share')],
                    ['key' => 'customers', 'type' => 'number', 'title' => _t('_bx_analytics_metric_revenue_customers')],
                    ['key' => 'orders', 'type' => 'number', 'title' => _t('_bx_analytics_metric_revenue_orders')],
                ],
                'rows' => $aSplit,
                'empty' => _t('_bx_analytics_txt_no_revenue'),
            ],
            'notes' => $this->_getRevenueNotes($aMoney, (int)$aCurrent['unconverted']),
            'import' => $this->_getImportStatus(),
        ];
    }

    /**
     * Monthly recurring revenue, new, renewed and cancelled subscriptions and churn per
     * bucket, the plans that bring the MRR, and why members cancel.
     */
    public function getSubscriptions(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aMoney = $this->getMoney();
        $aFilter = $this->_getRevenueFilter($oFilter->get(), $aMoney);
        $aPrevious = $this->_getRevenueFilter($oFilter->getPrevious(), $aMoney);
        $iNow = (int)$aFilter['now'];

        bx_import('Revenue', $this->_oModule->_aModule);

        // subscriptions alive in either period, read once
        $aRows = $this->_oDb->getSubscriptionRows(array_merge($aFilter, ['from' => $aPrevious['from']]), [
            'unit_seconds' => BxAnalyticsRevenue::getUnitSeconds(),
            'unpaid' => BxAnalyticsRevenue::STATUS_UNPAID,
            'grace' => BxAnalyticsRevenue::UNPAID_GRACE,
        ]);

        list($aCurrent) = $this->_sweepSubscriptions($aRows, [[$aFilter['from'], min($aFilter['to'], $iNow)]]);
        list($aBefore) = $this->_sweepSubscriptions($aRows, [[$aPrevious['from'], min($aPrevious['to'], $iNow)]]);

        $aTiles = [];
        foreach(['mrr' => 'money', 'active' => 'number', 'trials' => 'number', 'new' => 'number', 'cancelled' => 'number', 'churn' => 'percent'] as $sKey => $sType) {
            $sSub = '';
            if($sKey == 'trials' && $aCurrent['trial_mrr'] > 0)
                $sSub = _t('_bx_analytics_txt_sbs_trial_mrr', _t_format_currency($aCurrent['trial_mrr']));
            else if($sKey == 'churn' && $aCurrent['churn'] === null)
                $sSub = _t('_bx_analytics_txt_sbs_churn_no_base');

            $aTiles[] = [
                'key' => $sKey,
                'title' => _t('_bx_analytics_metric_sbs_' . $sKey),
                'value' => $aCurrent[$sKey],
                'previous' => $aBefore[$sKey],
                'change' => $aCurrent[$sKey] !== null && $aBefore[$sKey] !== null ? $this->_change($aCurrent[$sKey], $aBefore[$sKey]) : null,
                'type' => $sType,
                'metric' => $sKey,
                'sub' => $sSub,
            ];
        }

        // per bucket, within the period (the first bucket may start before it); renewals paid
        // with credits too, like the subscriptions
        $aRenewals = $this->_oDb->getRevenueSeries($aFilter, null);
        $aBuckets = $aFilter['buckets'];
        $aSpans = [];
        foreach($aBuckets as $i => $iBucket)
            if($iBucket <= $iNow)
                $aSpans[$i] = [max($iBucket, $aFilter['from']), min(isset($aBuckets[$i + 1]) ? $aBuckets[$i + 1] : $aFilter['to'], $iNow)];
        $aSwept = array_combine(array_keys($aSpans), $this->_sweepSubscriptions($aRows, $aSpans));

        $aMrr = $aNew = $aRenewed = $aCancelled = [];
        foreach($aBuckets as $i => $iBucket) {
            if(!isset($aSwept[$i])) {
                $aMrr[] = $aNew[] = $aRenewed[] = $aCancelled[] = null;
                continue;
            }

            $aMrr[] = $aSwept[$i]['mrr'];
            $aNew[] = $aSwept[$i]['new'];
            $aCancelled[] = $aSwept[$i]['cancelled'];
            $aRenewed[] = isset($aRenewals[$iBucket]) ? (int)$aRenewals[$iBucket]['renewals'] : 0;
        }

        // plans paying at the end of the period, by MRR
        $iEnd = min($aFilter['to'], $iNow);
        $aPlans = [];
        foreach($aRows as $aRow) {
            if(!$this->_isPaying($aRow, $iEnd))
                continue;

            $sKey = $aRow['module'] . '|' . (int)$aRow['item_id'];
            if(!isset($aPlans[$sKey]))
                $aPlans[$sKey] = ['module' => $aRow['module'], 'item_id' => (int)$aRow['item_id'], 'active' => 0, 'mrr' => 0];
            $aPlans[$sKey]['active']++;
            $aPlans[$sKey]['mrr'] += (float)$aRow['mrr_default'];
        }
        uasort($aPlans, function($a, $b) { return $b['mrr'] <=> $a['mrr']; });

        $aPlanRows = [];
        foreach(array_slice($aPlans, 0, 10) as $aPlan) {
            $aItem = $this->_getCartItem($aPlan['module'], $aPlan['item_id']);
            $aPlanRows[] = [
                'label' => $aItem['title'],
                'sub' => $aItem['module_title'],
                'link' => $aItem['url'],
                'bar' => $aCurrent['mrr'] > 0 ? round(100 * $aPlan['mrr'] / $aCurrent['mrr'], 1) : 0,
                'values' => ['active' => $aPlan['active'], 'mrr' => round($aPlan['mrr'], 2)],
            ];
        }

        $aReasons = $this->_oDb->getSubscriptionReasons($aFilter, 10);
        $iReasons = array_sum($aReasons);
        $aReasonRows = [];
        foreach($aReasons as $sReason => $iCount)
            $aReasonRows[] = [
                'label' => $sReason !== '' && $sReason !== 'cancel' ? $sReason : _t('_bx_analytics_txt_sbs_no_reason'),
                'bar' => $iReasons ? round(100 * $iCount / $iReasons, 1) : 0,
                'values' => ['count' => (int)$iCount, 'share' => $iReasons ? round(100 * $iCount / $iReasons, 1) : 0],
            ];

        $aLabels = $aFilter['buckets'];

        return [
            'money' => $aMoney,
            'tiles' => $aTiles,
            'chart' => [
                'kind' => 'lines',
                'metric' => 'money',
                'currency' => $aMoney['code'],
                'labels' => $aLabels,
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => [['key' => 'mrr', 'label' => _t('_bx_analytics_metric_sbs_mrr'), 'values' => $aMrr]],
            ],
            'movement' => [
                'kind' => 'stacked',
                'metric' => 'number',
                'labels' => $aLabels,
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => [
                    ['key' => 'new', 'label' => _t('_bx_analytics_metric_sbs_new'), 'values' => $aNew],
                    ['key' => 'renewed', 'label' => _t('_bx_analytics_metric_sbs_renewed'), 'values' => $aRenewed],
                    ['key' => 'cancelled', 'label' => _t('_bx_analytics_metric_sbs_cancelled'), 'values' => $aCancelled],
                ],
            ],
            'plans' => [
                'name' => 'sbs_plans',
                'caption' => _t('_bx_analytics_txt_sbs_plans'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_sbs_plan')],
                    ['key' => 'active', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sbs_active')],
                    ['key' => 'mrr', 'type' => 'money', 'title' => _t('_bx_analytics_metric_sbs_mrr')],
                ],
                'rows' => $aPlanRows,
                'empty' => _t('_bx_analytics_txt_no_subscriptions'),
            ],
            'reasons' => [
                'name' => 'sbs_reasons',
                'caption' => _t('_bx_analytics_txt_sbs_reasons'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_sbs_reason')],
                    ['key' => 'count', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sbs_cancelled')],
                    ['key' => 'share', 'type' => 'percent', 'title' => _t('_bx_analytics_txt_share')],
                ],
                'rows' => $aReasonRows,
                'empty' => _t('_bx_analytics_txt_no_cancellations'),
            ],
            'notes' => $this->_getRevenueNotes($aMoney, 0),
        ];
    }

    /**
     * The items that sell best, the sellers of a multi-vendor site, the site's own sales
     * against its vendors' and the commissions they paid, and commission invoices.
     */
    public function getSales(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aMoney = $this->getMoney();
        $aFilter = $this->_getRevenueFilter($oFilter->get(), $aMoney);

        $aTotals = $this->_oDb->getRevenueTotals($aFilter);
        $fNet = (float)$aTotals['net'];

        $aItems = [];
        foreach($this->_oDb->getRevenueTopItems($aFilter, 10) as $aRow) {
            $aItem = $this->_getCartItem($aRow['module'], (int)$aRow['item_id']);
            $aItems[] = [
                'label' => $aItem['title'],
                'sub' => $aItem['module_title'],
                'link' => $aItem['url'],
                'bar' => $fNet > 0 ? max(0, round(100 * $aRow['net'] / $fNet, 1)) : 0,
                'values' => [
                    'net' => round((float)$aRow['net'], 2),
                    'units' => (int)$aRow['units'],
                    'orders' => (int)$aRow['orders'],
                    'renewals' => (int)$aRow['renewals'],
                ],
            ];
        }

        $aSellers = [];
        foreach($this->_oDb->getRevenueSplit($aFilter, 'seller_id', 10) as $aRow) {
            $aMember = $this->getMember((int)$aRow['value']);
            $aSellers[] = [
                'label' => $aMember ? $aMember['name'] : _t('_bx_analytics_txt_deleted_member'),
                'link' => $aMember ? $aMember['url'] : '',
                'bar' => $fNet > 0 ? max(0, round(100 * $aRow['net'] / $fNet, 1)) : 0,
                'values' => [
                    'net' => round((float)$aRow['net'], 2),
                    'orders' => (int)$aRow['orders'],
                    'customers' => (int)$aRow['customers'],
                ],
            ];
        }

        $iSiteAdmin = (int)BxDolPayments::getInstance()->getOption('site_admin');
        $aSplit = $this->_oDb->getRevenueSellers($aFilter, $iSiteAdmin);

        $aTiles = [
            ['title' => _t('_bx_analytics_metric_revenue_net'), 'value' => round($fNet, 2), 'type' => 'money'],
        ];
        if($iSiteAdmin)
            $aTiles[] = ['title' => _t('_bx_analytics_metric_sales_site'), 'value' => round((float)$aSplit['site'], 2), 'type' => 'money'];
        $aTiles[] = ['title' => _t('_bx_analytics_metric_sales_vendors'), 'value' => round((float)$aSplit['vendors'], 2), 'type' => 'money', 'sub' => _t('_bx_analytics_txt_sales_vendor_count', (int)$aSplit['vendor_count'])];
        $aTiles[] = ['title' => _t('_bx_analytics_metric_sales_commissions'), 'value' => round((float)$aSplit['commissions'], 2), 'type' => 'money'];

        $aInvoices = [];
        foreach($this->getRevenueSources(['from' => $aFilter['from'], 'to' => $aFilter['to']], 'money') as $aSource)
            foreach($aSource['metrics'] as $aMetric)
                $aInvoices[] = [
                    'title' => _t($aMetric['title']),
                    'value' => isset($aMetric['value']) ? $aMetric['value'] : 0,
                    'type' => 'number',
                    'sub' => isset($aMetric['money']) && $aMetric['money'] !== null ? _t_format_currency($aMetric['money']) : '',
                ];

        return [
            'money' => $aMoney,
            'tiles' => $aTiles,
            'items' => [
                'name' => 'sales_items',
                'caption' => _t('_bx_analytics_txt_sales_items'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_item')],
                    ['key' => 'net', 'type' => 'money', 'title' => _t('_bx_analytics_metric_revenue_net')],
                    ['key' => 'units', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sales_units')],
                    ['key' => 'renewals', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sbs_renewed')],
                ],
                'rows' => $aItems,
                'empty' => _t('_bx_analytics_txt_no_revenue'),
            ],
            'sellers' => [
                'name' => 'sales_sellers',
                'caption' => _t('_bx_analytics_txt_sales_sellers'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_sales_seller')],
                    ['key' => 'net', 'type' => 'money', 'title' => _t('_bx_analytics_metric_revenue_net')],
                    ['key' => 'orders', 'type' => 'number', 'title' => _t('_bx_analytics_metric_revenue_orders')],
                    ['key' => 'customers', 'type' => 'number', 'title' => _t('_bx_analytics_metric_revenue_customers')],
                ],
                'rows' => $aSellers,
                'empty' => _t('_bx_analytics_txt_no_revenue'),
            ],
            'invoices' => $aInvoices,
            'notes' => $this->_getRevenueNotes($aMoney, (int)$aTotals['unconverted']),
        ];
    }

    /**
     * The credits economy as the modules that keep credits report it: bought, spent, granted,
     * sent and withdrawn, the top spenders and the credits members hold; and from the ledger,
     * what credits paid for, by module, valued in money. Those modules don't know the
     * platform, so the whole block is for every platform, the ledger's figures too.
     */
    public function getCredits(BxAnalyticsFilter $oFilter, $aParams = [])
    {
        $aMoney = $this->getMoney();
        $aFilter = $this->_getRevenueFilter($oFilter->get(), $aMoney);
        $bPlatform = $aFilter['platform'] !== '';
        $aFilter['platform'] = '';

        $aSources = $this->getRevenueSources([
            'from' => $aFilter['from'],
            'to' => $aFilter['to'],
            'starts' => $aFilter['buckets'],
            'limit' => 10,
        ], 'credits');

        $aSource = reset($aSources);
        $sSource = (string)key($aSources);

        $aTiles = $aDatasets = $aSpenders = [];
        if($aSource) {
            foreach($aSource['metrics'] as $sKey => $aMetric) {
                $aTiles[] = [
                    'key' => $sKey,
                    'title' => _t($aMetric['title']),
                    'value' => (float)$aMetric['value'],
                    'type' => 'credits',
                    'sub' => isset($aMetric['money']) && $aMetric['money'] !== null && (float)$aMetric['value'] > 0 ? _t_format_currency($aMetric['money']) : '',
                ];

                if(in_array($sKey, ['bought', 'spent', 'granted', 'withdrawn'], true))
                    $aDatasets[] = [
                        'key' => $sKey,
                        'label' => _t($aMetric['title']),
                        'values' => array_map(function($iBucket) use ($aMetric, $aFilter) {
                            return $iBucket > $aFilter['now'] ? null : (isset($aMetric['series'][$iBucket]) ? (float)$aMetric['series'][$iBucket] : 0);
                        }, $aFilter['buckets']),
                    ];
            }

            if(!empty($aSource['snapshot']['balance'])) {
                $aBalance = $aSource['snapshot']['balance'];
                $aTiles[] = [
                    'key' => 'balance',
                    'title' => _t($aBalance['title']),
                    'value' => (float)$aBalance['value'],
                    'type' => 'credits',
                    'sub' => _t('_bx_analytics_txt_credits_liability', _t_format_currency(isset($aBalance['money_default']) ? $aBalance['money_default'] : 0)),
                ];
            }

            if(!empty($aSource['lists']['top_spenders']['rows'])) {
                $aList = $aSource['lists']['top_spenders']['rows'];
                $fMax = 0;
                foreach($aList as $aRow)
                    $fMax = max($fMax, (float)$aRow['value']);

                foreach($aList as $aRow) {
                    $aMember = $this->getMember(isset($aRow['profile_id']) ? (int)$aRow['profile_id'] : 0);
                    $aSpenders[] = [
                        'label' => $aMember ? $aMember['name'] : (isset($aRow['label']) ? (string)$aRow['label'] : _t('_bx_analytics_txt_deleted_member')),
                        'link' => $aMember ? $aMember['url'] : '',
                        'bar' => $fMax > 0 ? round(100 * $aRow['value'] / $fMax, 1) : 0,
                        'values' => ['value' => (float)$aRow['value']],
                    ];
                }
            }
        }

        // what orders paid with credits bought, valued in money
        $aSpentRows = [];
        $aSpent = $this->_oDb->getRevenueSplit($aFilter, 'module', 10, 0);
        $fSpent = 0;
        foreach($aSpent as $aRow)
            $fSpent += max(0, (float)$aRow['net']);
        foreach($aSpent as $aRow)
            $aSpentRows[] = [
                'label' => $this->getRevenueLabel('module', (string)$aRow['value'], $aMoney['payment']),
                'bar' => $fSpent > 0 ? max(0, round(100 * $aRow['net'] / $fSpent, 1)) : 0,
                'values' => ['net' => round((float)$aRow['net'], 2), 'orders' => (int)$aRow['orders']],
            ];

        // credit bundles sold for money
        $fBundles = 0;
        if($sSource !== '')
            foreach($this->_oDb->getRevenueSplit($aFilter, 'module', 1000) as $aRow)
                if($aRow['value'] === $sSource)
                    $fBundles = (float)$aRow['net'];

        if($aSource)
            $aTiles[] = ['key' => 'bundles', 'title' => _t('_bx_analytics_metric_credits_bundles'), 'value' => round($fBundles, 2), 'type' => 'money'];

        $aNotes = [];
        if($aMoney['credits_only'])
            $aNotes[] = _t('_bx_analytics_txt_revenue_credits_only');
        if($aSource && $bPlatform)
            $aNotes[] = _t('_bx_analytics_txt_credits_all_platforms');
        // checkouts the ledger doesn't have: paid before it started, or not imported yet
        if(empty($aSpentRows) && !empty($aSource['metrics']['spent']['value']) && (float)$aSource['metrics']['spent']['value'] > 0)
            $aNotes[] = _t('_bx_analytics_txt_credits_not_in_ledger');

        return [
            'money' => $aMoney,
            'available' => !empty($aSource),
            'title' => $aSource ? _t($aSource['title']) : '',
            'tiles' => $aTiles,
            'chart' => [
                'kind' => 'lines',
                'metric' => 'number',
                'labels' => $aFilter['buckets'],
                'bucket' => $aFilter['bucket'],
                'tz' => $aFilter['tz'],
                'datasets' => $aDatasets,
            ],
            'spenders' => [
                'name' => 'credits_spenders',
                'caption' => _t('_bx_analytics_txt_credits_spenders'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_member_name')],
                    ['key' => 'value', 'type' => 'credits', 'title' => _t('_bx_analytics_txt_credits_spent')],
                ],
                'rows' => $aSpenders,
                'empty' => _t('_bx_analytics_txt_no_credits'),
            ],
            'spent' => [
                'name' => 'credits_spent',
                'caption' => _t('_bx_analytics_txt_credits_spent_on'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_tab_revenue_sources')],
                    ['key' => 'net', 'type' => 'money', 'title' => _t('_bx_analytics_txt_credits_value')],
                    ['key' => 'orders', 'type' => 'number', 'title' => _t('_bx_analytics_metric_revenue_orders')],
                ],
                'rows' => $aSpentRows,
                'empty' => _t('_bx_analytics_txt_no_credit_orders'),
            ],
            'notes' => $aNotes,
        ];
    }

    /**
     * The site's default currency and the payment module the ledger is read for.
     */
    public function getMoney()
    {
        $oPayments = BxDolPayments::getInstance();
        $bActive = $oPayments->isActive();

        return [
            'active' => $bActive,
            'payment' => $bActive ? (string)$oPayments->getActive() : '',
            'code' => $bActive ? (string)$oPayments->getCurrencyCode() : '',
            'credits_only' => $bActive && (bool)$oPayments->isCreditsOnly(),
        ];
    }

    /**
     * What modules report about their own economy through the get_analytics_revenue service,
     * found in every installed module: [module name => report], the ones of a unit only. The
     * unit is read first (meta), so a module of another unit doesn't compute its report.
     *
     * @param array $aParams from, to, starts, limit; or meta to learn titles and units only
     * @param string $sUnit money or credits, '' for any
     */
    public function getRevenueSources($aParams, $sUnit = '')
    {
        $aResult = [];
        foreach(BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule) {
            if(empty($aModule['name']) || !bx_is_srv($aModule['name'], 'get_analytics_revenue'))
                continue;

            if($sUnit !== '' && empty($aParams['meta'])) {
                $aMeta = bx_srv($aModule['name'], 'get_analytics_revenue', [['meta' => true]]);
                if(empty($aMeta['unit']) || $aMeta['unit'] != $sUnit)
                    continue;
            }

            $aReport = bx_srv($aModule['name'], 'get_analytics_revenue', [$aParams]);
            if(empty($aReport) || !is_array($aReport) || empty($aReport['unit']) || ($sUnit !== '' && $aReport['unit'] != $sUnit))
                continue;

            if(empty($aParams['meta']) && (empty($aReport['metrics']) || !is_array($aReport['metrics'])))
                continue;

            $aResult[$aModule['name']] = $aReport;
        }

        return $aResult;
    }

    /**
     * A human name for a ledger value: a module's title, a provider, a platform, a channel.
     */
    public function getRevenueLabel($sDimension, $sValue, $sPayment = '')
    {
        switch($sDimension) {
            case 'module':
                if($sValue === '')
                    return _t('_bx_analytics_txt_unknown');
                if($sPayment !== '' && $sValue === $sPayment)
                    return _t('_bx_analytics_txt_revenue_commissions');
                return $this->_getModuleTitle($sValue);

            case 'provider':
                if($sValue === '')
                    return _t('_bx_analytics_txt_unknown');
                $sValue = str_replace('_', ' ', $sValue);
                return mb_strtoupper(get_mb_substr($sValue, 0, 1)) . get_mb_substr($sValue, 1, get_mb_len($sValue) - 1);

            case 'platform':
                return $sValue !== '' ? $this->getLabel('platform', $sValue) : _t('_bx_analytics_txt_revenue_imported');

            case 'first_channel':
            case 'last_channel':
                return $sValue !== '' ? $this->getLabel('channel', $sValue) : _t('_bx_analytics_txt_revenue_untracked');

            case 'last_utm_campaign':
            case 'first_utm_campaign':
                return $sValue !== '' ? $sValue : _t('_bx_analytics_txt_revenue_no_campaign');
        }

        return $sValue;
    }

    /**
     * Net revenue of members over all the ledger, for the Users report: [profile id => amount].
     */
    public function getLifetimeValues($aProfileIds)
    {
        $aMoney = $this->getMoney();
        if($aMoney['payment'] === '')
            return [];

        return $this->_oDb->getLifetimeValues($aProfileIds, $aMoney['payment']);
    }

    /**
     * Subscription figures over spans of time, sorted and not overlapping. For each span: MRR
     * and paying subscriptions at its end, trials at its end, new and ended (cancelled, or
     * unpaid past the grace time) paying subscriptions in it, and churn (of those paying at
     * its start, the share that ended in it). One pass over the rows, each finding its spans
     * by binary search.
     *
     * @param array $aSpans [[from, to], ...]
     * @return array a result per span, in the order of $aSpans
     */
    protected function _sweepSubscriptions($aRows, $aSpans)
    {
        $aSpans = array_values($aSpans);
        $iSpans = count($aSpans);
        $aFroms = array_map('intval', array_column($aSpans, 0));
        $aTos = array_map('intval', array_column($aSpans, 1));

        // counts at the spans' ends (or starts) are ranges of spans: added as differences
        $aDiff = array_fill_keys(['mrr', 'active', 'trials', 'trial_mrr', 'at_start'], array_fill(0, $iSpans + 1, 0));
        $aNew = $aEnded = $aChurned = array_fill(0, $iSpans, 0);

        foreach($aRows as $aRow) {
            $iFirst = (int)$aRow['first_paid'];
            $iEnd = $this->_getSubscriptionEnd($aRow);
            $fMrr = (float)$aRow['mrr_default'];

            if($iFirst) {
                $this->_addSpans($aDiff['mrr'], $aTos, $iFirst, $iEnd, $fMrr);
                $this->_addSpans($aDiff['active'], $aTos, $iFirst, $iEnd, 1);
                $this->_addSpans($aDiff['at_start'], $aFroms, $iFirst, $iEnd, 1);

                if(($i = $this->_findSpan($aFroms, $aTos, $iFirst)) !== null)
                    $aNew[$i]++;

                if($iEnd && ($i = $this->_findSpan($aFroms, $aTos, $iEnd)) !== null) {
                    $aEnded[$i]++;
                    if($iFirst < $aFroms[$i])
                        $aChurned[$i]++;
                }
            }

            // in trial from its start until the trial, its first charge or its end is over
            $iTrialEnd = $this->_getTrialEnd($aRow);
            if($iTrialEnd !== null) {
                $iUntil = 0;
                foreach([$iTrialEnd, $iFirst, $iEnd] as $iTime)
                    if($iTime)
                        $iUntil = $iUntil ? min($iUntil, $iTime) : $iTime;

                $this->_addSpans($aDiff['trials'], $aTos, (int)$aRow['started'], $iUntil, 1);
                $this->_addSpans($aDiff['trial_mrr'], $aTos, (int)$aRow['started'], $iUntil, $fMrr);
            }
        }

        $aResults = [];
        $aSum = array_fill_keys(array_keys($aDiff), 0);
        for($i = 0; $i < $iSpans; $i++) {
            foreach($aDiff as $sKey => $aValues)
                $aSum[$sKey] += $aValues[$i];

            if($aTos[$i] <= $aFroms[$i]) {
                $aResults[] = ['mrr' => null, 'active' => null, 'trials' => null, 'trial_mrr' => 0, 'new' => null, 'cancelled' => null, 'churn' => null];
                continue;
            }

            $aResults[] = [
                'mrr' => round($aSum['mrr'], 2),
                'active' => (int)$aSum['active'],
                'trials' => (int)$aSum['trials'],
                'trial_mrr' => round($aSum['trial_mrr'], 2),
                'new' => $aNew[$i],
                'cancelled' => $aEnded[$i],
                'churn' => $aSum['at_start'] ? round(100 * $aChurned[$i] / $aSum['at_start'], 1) : null,
            ];
        }

        return $aResults;
    }

    /**
     * Add a value to the spans whose edge (from `$aEdges`, ascending) is in (`$iAfter`,
     * `$iUntil`], `$iUntil` 0 for no end.
     */
    protected function _addSpans(&$aDiff, $aEdges, $iAfter, $iUntil, $mixedValue)
    {
        $iLo = self::_firstAbove($aEdges, $iAfter);
        $iHi = $iUntil ? self::_firstAbove($aEdges, $iUntil) : count($aEdges);
        if($iLo >= $iHi)
            return;

        $aDiff[$iLo] += $mixedValue;
        $aDiff[$iHi] -= $mixedValue;
    }

    /**
     * The span a time falls in, or null.
     */
    protected function _findSpan($aFroms, $aTos, $iTime)
    {
        $i = self::_firstAbove($aFroms, $iTime) - 1;

        return $i >= 0 && $iTime < $aTos[$i] ? $i : null;
    }

    /**
     * Index of the first value greater than `$iTime` in an ascending list, or its length.
     */
    protected static function _firstAbove($aList, $iTime)
    {
        $iLo = 0;
        $iHi = count($aList);
        while($iLo < $iHi) {
            $iMid = ($iLo + $iHi) >> 1;
            if($aList[$iMid] > $iTime)
                $iHi = $iMid;
            else
                $iLo = $iMid + 1;
        }

        return $iLo;
    }

    /**
     * A subscription was paying at a time: first paid before it and not ended by then.
     */
    protected function _isPaying($aRow, $iTime)
    {
        $iFirst = (int)$aRow['first_paid'];
        $iEnd = $this->_getSubscriptionEnd($aRow);

        return $iFirst && $iFirst < $iTime && (!$iEnd || $iEnd >= $iTime);
    }

    /**
     * When a subscription stopped paying, or 0: its cancellation, or for an unpaid one the end
     * of its last paid period and the grace time (a failed charge the payment module stopped
     * retrying never cancels it).
     */
    protected function _getSubscriptionEnd($aRow)
    {
        if((int)$aRow['canceled'])
            return (int)$aRow['canceled'];

        if($aRow['status'] != BxAnalyticsRevenue::STATUS_UNPAID || !(int)$aRow['last_paid'])
            return 0;

        return (int)$aRow['last_paid'] + (int)BxAnalyticsRevenue::getPeriodSeconds($aRow['period'], $aRow['period_unit']) + BxAnalyticsRevenue::UNPAID_GRACE;
    }

    /**
     * When a subscription's trial ends (0: a trial of unknown length), or null without a trial.
     */
    protected function _getTrialEnd($aRow)
    {
        if((int)$aRow['trial'] > 0)
            return (int)$aRow['started'] + 86400 * (int)$aRow['trial'];

        return $aRow['status'] == BxAnalyticsRevenue::STATUS_TRIAL ? 0 : null;
    }

    /**
     * Title, link and module of something sold, from its module's get_cart_item.
     */
    protected function _getCartItem($sModule, $iItemId)
    {
        $aResult = [
            'title' => _t('_bx_analytics_txt_item_n', (int)$iItemId),
            'url' => '',
            'module_title' => $sModule !== '' ? $this->_getModuleTitle($sModule) : '',
        ];

        if($sModule === '' || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || !bx_is_srv($sModule, 'get_cart_item'))
            return $aResult;

        $aItem = bx_srv($sModule, 'get_cart_item', [(int)$iItemId]);
        if(!empty($aItem) && is_array($aItem)) {
            if(!empty($aItem['title']) && is_string($aItem['title']))
                $aResult['title'] = strip_tags($aItem['title']);
            if(!empty($aItem['url']) && is_string($aItem['url']))
                $aResult['url'] = $aItem['url'];
        }

        return $aResult;
    }

    protected function _getRevenueFilter($aFilter, $aMoney)
    {
        $aFilter['payment'] = $aMoney['payment'];

        return $aFilter;
    }

    protected function _getRevenueNotes($aMoney, $iUnconverted)
    {
        $aNotes = [];
        if(!$aMoney['active'])
            $aNotes[] = _t('_bx_analytics_txt_revenue_no_payment');
        if($aMoney['credits_only'])
            $aNotes[] = _t('_bx_analytics_txt_revenue_credits_only');
        if($iUnconverted > 0)
            $aNotes[] = _t('_bx_analytics_txt_revenue_no_rate', $iUnconverted);
        // no currency without a payment module: the tab still shows, for other revenue sources to come
        if($aMoney['code'] !== '')
            $aNotes[] = _t('_bx_analytics_txt_revenue_as_recorded', $aMoney['code']);

        return $aNotes;
    }

    /**
     * Where the import of past payments stands, for administrators.
     */
    protected function _getImportStatus()
    {
        if(!isAdmin())
            return [];

        $aStatus = $this->_oModule->getRevenue()->getBackfillStatus(true);

        return $aStatus['state'] == 'unavailable' ? [] : $aStatus;
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
            // an action without a title of its own (a module's, or a newer one) by its name
            $sKey = '_bx_analytics_action_' . $sName;
            $sLabel = _t($sKey);
            if($sLabel === $sKey)
                $sLabel = $sName;
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
