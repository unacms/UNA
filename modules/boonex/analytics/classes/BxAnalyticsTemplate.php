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

bx_import ('BxDolModuleTemplate');

class BxAnalyticsTemplate extends BxBaseModGeneralTemplate
{
    /**
     * Blocks are drawn inside Studio: assets go to the Studio template.
     */
    protected $_bStudio = false;

    protected $_aRanges = ['today', 'yesterday', '24h', '7d', '30d', '90d', '12m'];

    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_analytics';
        parent::__construct($oConfig, $oDb);
    }

    public function setStudio($bStudio)
    {
        $this->_bStudio = (bool)$bStudio;
    }

    public function isStudio()
    {
        return $this->_bStudio;
    }

    function getCanvas()
    {
        $aTmp = $this->getModule()->getSelectedModules();
        $aModules = $aTmp[0];
        $aModulesList = $aTmp[1];
        $aModulesList2 = [];
        foreach($aModules as $sModule)
            $aModulesList2[] = ['value' => $sModule, 'title' => $aModulesList[$sModule]];

        $iDaysBefore = getParam('bx_analytics_default_interval_day');
        $sDate = date('d/m/Y', time() - $iDaysBefore * 86400) . ' - ' . date('d/m/Y');
        $aJs = ['chart.umd.min.js', 'chartjs-adapter-moment.min.js', 'analytics.js', BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/plugins/daterangepicker/|daterangepicker.js', BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/plugins/datatables/|datatables.min.js'];
        $aCss = ['main.css', BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/plugins/daterangepicker/|daterangepicker.css', BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/plugins/datatables/|datatables.min.css'];
        $this->_addAssets($aJs, $aCss);

        return $this->getJsCode('analytics') . $this->parseHtmlByName('canvas.html', [
            'bx_repeat:items' => $aModulesList2,
            'interval' => $sDate,
            'export_to_csv_title' => _t('_bx_analytics_txt_export_to_csv_title')
        ]);
    }

    /**
     * The classic UI tracker: a small deferred script configured by data attributes.
     */
    public function getTrackerCode()
    {
        return $this->parseHtmlByName('tracker.html', [
            'src' => $this->_getTrackerUrl(),
            'endpoint' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'collect',
            'platform' => BX_ANALYTICS_PLATFORM_CORE_WEB,
            'identity' => $this->_oConfig->getIdentityMode(),
            'dnt' => $this->_oConfig->isRespectDnt() ? 1 : 0,
            'errors' => $this->_oConfig->isTrackErrors() ? 1 : 0,
            // percent of page loads that measure vitals, 0 for none
            'vitals' => $this->_oConfig->isTrackVitals() ? $this->_oConfig->getVitalsSample() : 0,
        ]);
    }

    /**
     * The tracker's URL. Every classic page loads it, so when the site minifies its scripts
     * it is minified too, once per revision, into the public cache next to the site's
     * scripts (clearing the JS cache removes it); the source file otherwise, or when the
     * cache can't be written.
     */
    protected function _getTrackerUrl()
    {
        $iRevision = (int)getParam('sys_revision');
        $sSource = 'boonex/analytics/js/tracker.js';
        $sUrl = BX_DOL_URL_MODULES . $sSource . '?v=' . $iRevision;
        if(bx_is_dbg() || getParam('sys_template_cache_js_enable') != 'on' || getParam('sys_template_cache_minify_js_enable') != 'on')
            return $sUrl;

        $sName = $this->getCacheFilePrefix('js') . 'bx_analytics_tracker_' . bx_site_hash($sSource . $iRevision) . '.js';
        $sPath = BX_DIRECTORY_PATH_CACHE_PUBLIC . $sName;
        if(!file_exists($sPath)) {
            $sCode = @file_get_contents(BX_DIRECTORY_PATH_MODULES . $sSource);
            $sMinified = $sCode !== false ? BxDolMinify::getInstance()->minifyJs($sCode) : '';
            // written aside and moved in, so a page never loads a half-written file
            $sTemp = $sPath . '.' . uniqid() . '.tmp';
            if($sMinified === '' || @file_put_contents($sTemp, $sMinified) === false || !@rename($sTemp, $sPath)) {
                @unlink($sTemp);
                return $sUrl;
            }
            @chmod($sPath, BX_DOL_FILE_RIGHTS);
        }

        return BX_DOL_URL_CACHE_PUBLIC . $sName;
    }

    /**
     * A report block on a page: the dashboard script, once per page, and the report.
     *
     * @param string $sReport report name, see BxAnalyticsModule::getReportData
     * @param array $aData report data
     * @param object $oFilter the filter the data was built with
     * @param array $aParams block parameters (group, table...) the script sends back on reload
     */
    public function getBlock($sReport, $aData, $oFilter, $aParams = [])
    {
        $this->_addDashboardAssets($sReport);

        return $this->_getJsInit() . $this->getReportHtml($sReport, $aData, $oFilter, $aParams);
    }

    /**
     * Block HTML for a report, on first render and when the dashboard script reloads it.
     */
    public function getReportHtml($sReport, $aData, $oFilter, $aParams = [])
    {
        $sMethod = '_get' . bx_gen_method_name($sReport) . 'Html';
        if(!method_exists($this, $sMethod))
            return '';

        $sContent = $this->$sMethod($aData, $oFilter, $aParams);
        if($sContent === '')
            return '';

        return $this->parseHtmlByName('block.html', [
            'report' => $sReport,
            'params' => $this->_esc(json_encode((object)$aParams)),
            'class' => str_replace('_', '-', $sReport),
            'content' => $sContent,
        ]);
    }

    /**
     * A Studio section: blocks in a grid, the wide ones across all columns.
     *
     * @param array $aBlocks list of ['title' => heading or '', 'content' => HTML, 'wide' => bool]
     */
    public function getStudioSection($aBlocks)
    {
        $aCards = [];
        foreach($aBlocks as $aBlock) {
            if($aBlock['content'] === '' || $aBlock['content'] === [])
                continue;

            $aCards[] = [
                'class' => !empty($aBlock['wide']) ? 'bx-analytics-studio-wide' : '',
                'bx_if:title' => [
                    'condition' => !empty($aBlock['title']),
                    'content' => ['title' => !empty($aBlock['title']) ? $aBlock['title'] : ''],
                ],
                'content' => $aBlock['content'],
            ];
        }

        return $this->parseHtmlByName('studio_section.html', [
            'bx_repeat:cards' => $aCards,
        ]);
    }

    /**
     * Traffic block of the Studio dashboard.
     */
    public function getStudioDashboardTraffic($aOverview, $aRealtime, $aPlatforms)
    {
        $this->addStudioCss(['dashboard.css']);

        $aValues = array_map(function($a) { return $a['future'] ? null : $a['visitors']; }, $aOverview['series']);
        $iMax = max(array_merge([1], array_map('intval', $aValues)));
        $iCount = count($aValues);
        $aPoints = [];
        foreach($aValues as $i => $mixedValue)
            if($mixedValue !== null)
                $aPoints[] = round($iCount > 1 ? 100 * $i / ($iCount - 1) : 50, 2) . ',' . round(38 - 36 * $mixedValue / $iMax, 2);

        $aKpis = [];
        foreach(['visitors', 'pageviews'] as $sMetric) {
            $aKpi = $aOverview['kpis'][$sMetric];
            $aKpis[] = [
                'title' => _t('_bx_analytics_metric_' . $sMetric),
                'value' => $this->formatValue($sMetric, $aKpi['value']),
                'change' => $this->_formatChange($aKpi['change']),
                'trend' => $this->_trend($sMetric, $aKpi['change']),
            ];
        }

        $aRows = [];
        foreach($aPlatforms['items'] as $aItem)
            $aRows[] = [
                'label' => $this->_esc($aItem['label']),
                'share' => $aItem['share'],
                'bar' => $aItem['bar'],
            ];

        return $this->parseHtmlByName('studio_traffic.html', [
            'online' => $this->formatValue('number', $aRealtime['online']),
            'online_title' => _t('_bx_analytics_txt_online_now', $aRealtime['window']),
            'bx_repeat:kpis' => $aKpis,
            'points' => implode(' ', $aPoints),
            'chart_label' => _t('_bx_analytics_txt_chart_visitors_7d'),
            'bx_if:platforms' => [
                'condition' => !empty($aRows),
                'content' => ['bx_repeat:platforms' => $aRows],
            ],
            'bx_if:empty' => [
                'condition' => empty($aRows),
                'content' => ['empty' => _t('_bx_analytics_txt_no_data_yet')],
            ],
            'link' => BX_DOL_URL_STUDIO . 'module.php?name=' . $this->MODULE . '&page=overview',
            'link_title' => _t('_bx_analytics_txt_open_analytics'),
        ]);
    }

    /**
     * A number for display by its kind: number (950, 9.5K), percent, duration (seconds),
     * ms, pages_per_session, or a metric name.
     */
    public function formatValue($sType, $mixedValue)
    {
        if($mixedValue === null || $mixedValue === '')
            return '';

        switch($sType) {
            case 'bounce_rate':
            case 'percent':
            case 'rate':
                return (abs($mixedValue) < 10 && round($mixedValue) != $mixedValue ? number_format((float)$mixedValue, 1) : round($mixedValue)) . '%';

            // shares close to 100%, such as crash-free visits: 99.95%, not 100%
            case 'percent_precise':
                return rtrim(rtrim(number_format((float)$mixedValue, 2), '0'), '.') . '%';

            case 'pages_per_session':
            case 'decimal':
                return number_format((float)$mixedValue, 1);

            // good, needs_improvement or poor, as a coloured label
            case 'rating':
                return $this->parseHtmlByName('rating.html', [
                    'rating' => str_replace('_', '-', $this->_esc($mixedValue)),
                    'title' => _t('_bx_analytics_rating_' . preg_replace('/[^a-z_]/', '', (string)$mixedValue)),
                ]);

            // a small line of values over time
            case 'spark':
                return is_array($mixedValue) ? $this->_getSparkHtml($mixedValue) : '';

            case 'duration':
            case 'engaged':
                $iSeconds = (int)round($mixedValue);
                if($iSeconds < 60)
                    return $iSeconds . _t('_bx_analytics_txt_duration_s');
                if($iSeconds < 3600)
                    return intdiv($iSeconds, 60) . _t('_bx_analytics_txt_duration_m') . ' ' . ($iSeconds % 60) . _t('_bx_analytics_txt_duration_s');
                return intdiv($iSeconds, 3600) . _t('_bx_analytics_txt_duration_h') . ' ' . intdiv($iSeconds % 3600, 60) . _t('_bx_analytics_txt_duration_m');

            case 'ms':
                return $mixedValue >= 1000 ? number_format($mixedValue / 1000, 2) . _t('_bx_analytics_txt_duration_s') : round($mixedValue) . _t('_bx_analytics_txt_ms');

            case 'cls':
                return number_format((float)$mixedValue, 3);

            case 'money':
                // the site's default currency, the way the payment module shows it
                return $this->_esc(_t_format_currency((float)$mixedValue));

            case 'credits':
                return rtrim(rtrim(number_format((float)$mixedValue, 2), '0'), '.');

            case 'datetime':
                return bx_time_js((int)$mixedValue, BX_FORMAT_DATE_TIME, true);

            case 'date':
                return bx_time_js((int)$mixedValue, BX_FORMAT_DATE, true);

            case 'text':
                return $this->_esc($mixedValue);
        }

        return $this->_formatNumber($mixedValue);
    }

    protected function _getFiltersHtml($aData, $oFilter)
    {
        $aFilter = $oFilter->get();

        $aRanges = [];
        foreach($this->_aRanges as $sRange)
            $aRanges[] = [
                'value' => $sRange,
                'title' => _t('_bx_analytics_range_' . $sRange),
                'selected' => $aFilter['range'] == $sRange ? 'selected="selected"' : '',
            ];
        if($aFilter['range'] == 'custom')
            $aRanges[] = [
                'value' => 'custom',
                'title' => $this->_esc($aFilter['from_date'] . ' - ' . $aFilter['to_date']),
                'selected' => 'selected="selected"',
            ];

        $aPlatforms = [['value' => '', 'title' => _t('_bx_analytics_txt_all_platforms'), 'selected' => '']];
        foreach($this->_oConfig->getPlatforms() as $sCode => $sTitle)
            $aPlatforms[] = [
                'value' => $sCode,
                'title' => _t($sTitle),
                'selected' => $aFilter['platform'] == $sCode ? 'selected="selected"' : '',
            ];

        $aChips = [];
        foreach($aData['chips'] as $aChip)
            $aChips[] = [
                'name' => $aChip['name'],
                'title' => $aChip['title'],
                'value' => $this->_esc($aChip['label']),
                'remove' => $this->_esc(_t('_bx_analytics_txt_remove_filter', $aChip['title'])),
            ];

        return $this->parseHtmlByName('filters.html', [
            'range_label' => _t('_bx_analytics_txt_range'),
            'bx_repeat:ranges' => $aRanges,
            'platform_label' => _t('_bx_analytics_txt_platform'),
            'bx_repeat:platforms' => $aPlatforms,
            'bx_if:chips' => [
                'condition' => !empty($aChips),
                'content' => ['bx_repeat:chips' => $aChips],
            ],
            'online' => $this->formatValue('number', $aData['online']),
            'online_title' => _t('_bx_analytics_txt_online_now', $aData['window']),
        ]);
    }

    protected function _getOverviewHtml($aOverview, $oFilter)
    {
        $sMetric = bx_get('metric');
        $aMetrics = $this->getModule()->getReports()->getMetrics();
        if(!in_array($sMetric, $aMetrics, true))
            $sMetric = 'visitors';

        $aKpis = [];
        foreach($aOverview['kpis'] as $sName => $aKpi)
            $aKpis[] = [
                'metric' => $sName,
                'pressed' => $sName == $sMetric ? 'true' : 'false',
                'title' => _t('_bx_analytics_metric_' . $sName),
                'value' => $this->formatValue($sName, $aKpi['value']),
                'change' => $this->_formatChange($aKpi['change']),
                'change_title' => $this->_esc(_t('_bx_analytics_txt_previous_period', $this->formatValue($sName, $aKpi['previous']))),
                'trend' => $this->_trend($sName, $aKpi['change']),
            ];

        $aTitles = [];
        foreach($aMetrics as $sName)
            $aTitles[$sName] = _t('_bx_analytics_metric_' . $sName);

        return $this->parseHtmlByName('overview.html', [
            'kpis_label' => _t('_bx_analytics_txt_key_figures'),
            'bx_repeat:kpis' => $aKpis,
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_label')),
            'chart_json' => $this->_json([
                'metric' => $sMetric,
                'bucket' => $aOverview['bucket'],
                'tz' => $aOverview['tz'],
                'series' => $aOverview['series'],
                'titles' => $aTitles,
            ]),
        ]);
    }

    protected function _getTopHtml($aTop, $oFilter)
    {
        $aItems = [];
        foreach($aTop['items'] as $aItem)
            $aItems[] = [
                'dimension' => $aTop['dimension'],
                'value' => $this->_esc($aItem['value']),
                'label' => $this->_esc($aItem['label']),
                'visitors' => $this->formatValue('number', $aItem['visitors']),
                'share' => $aItem['share'],
                'bar' => $aItem['bar'],
                'filter_title' => $this->_esc(_t('_bx_analytics_txt_filter_by', $aItem['label'])),
            ];

        return $this->parseHtmlByName('top.html', [
            'tabs' => $this->_getTabsHtml($aTop['group'], $aTop['tabs']),
            'group' => $aTop['group'],
            'column' => $aTop['column'],
            'visitors' => _t('_bx_analytics_metric_visitors'),
            'bx_if:items' => [
                'condition' => !empty($aItems),
                'content' => ['bx_repeat:items' => $aItems],
            ],
            'bx_if:empty' => [
                'condition' => empty($aItems),
                'content' => ['empty' => _t('_bx_analytics_txt_no_data')],
            ],
        ]);
    }

    protected function _getRealtimeHtml($aData, $oFilter)
    {
        $iMax = 1;
        foreach($aData['minutes'] as $aMinute)
            $iMax = max($iMax, $aMinute['pageviews']);

        $aMinutes = [];
        foreach($aData['minutes'] as $aMinute)
            $aMinutes[] = [
                'height' => $aMinute['pageviews'] ? max(4, round(100 * $aMinute['pageviews'] / $iMax)) : 0,
                'title' => $this->_esc(_t('_bx_analytics_txt_pageviews_at', $aMinute['pageviews'], gmdate('H:i', $aMinute['t']) . ' UTC')),
            ];

        $aPlatforms = [];
        foreach($aData['platforms'] as $aPlatform)
            $aPlatforms[] = [
                'label' => $this->_esc($aPlatform['label']),
                'visitors' => $this->formatValue('number', $aPlatform['visitors']),
                'share' => $aPlatform['share'],
            ];

        $aRecent = [];
        foreach($aData['recent'] as $aItem) {
            $aMeta = array_filter([
                $aItem['platform_label'],
                $aItem['city'] !== '' ? $aItem['city'] . ', ' . $aItem['country_label'] : ($aItem['country'] !== '' ? $aItem['country_label'] : ''),
                $aItem['device'],
                $aItem['member'] ? _t('_bx_analytics_txt_member') : '',
            ]);
            $aRecent[] = [
                'time' => bx_time_js($aItem['ts'], BX_FORMAT_DATE_TIME),
                'title' => $this->_esc($aItem['title'] !== '' ? $aItem['title'] : $aItem['path']),
                'path' => $this->_esc($aItem['path']),
                'meta' => $this->_esc(implode(' · ', $aMeta)),
            ];
        }

        return $this->parseHtmlByName('realtime.html', [
            'online' => $this->formatValue('number', $aData['online']),
            'online_title' => _t('_bx_analytics_txt_online_now', $aData['window']),
            'bx_if:platforms' => [
                'condition' => !empty($aPlatforms),
                'content' => ['bx_repeat:platforms' => $aPlatforms],
            ],
            'minutes_label' => $this->_esc(_t('_bx_analytics_txt_pageviews_30m')),
            'bx_repeat:minutes' => $aMinutes,
            'axis_start' => _t('_bx_analytics_txt_minutes_ago', 30),
            'axis_end' => _t('_bx_analytics_txt_now'),
            'recent_title' => _t('_bx_analytics_txt_latest_pageviews'),
            'bx_if:recent' => [
                'condition' => !empty($aRecent),
                'content' => ['bx_repeat:recent' => $aRecent],
            ],
            'bx_if:empty' => [
                'condition' => empty($aRecent),
                'content' => ['empty' => _t('_bx_analytics_txt_no_recent')],
            ],
        ]);
    }

    protected function _getMapHtml($aData, $oFilter)
    {
        $aCountries = [];
        foreach(array_slice($aData['countries'], 0, 12) as $aCountry)
            $aCountries[] = [
                'value' => $this->_esc($aCountry['country']),
                'label' => $this->_esc($aCountry['label']),
                'visitors' => $this->formatValue('number', $aCountry['visitors']),
                'share' => $aCountry['share'],
                'bar' => $aCountry['bar'],
                'filter_title' => $this->_esc(_t('_bx_analytics_txt_filter_by', $aCountry['label'])),
            ];

        return $this->parseHtmlByName('map.html', [
            'tabs' => $this->_getTabsHtml('map', $aData['tabs']),
            'refresh' => $aData['tab'] == 'live' ? 'data-bx-analytics-refresh="30"' : '',
            'map_label' => $this->_esc(_t('_bx_analytics_txt_map_label')),
            'map_json' => $this->_json([
                'countries' => $aData['countries'],
                'points' => $aData['points'],
                'provider' => $aData['provider'],
                'visitors' => _t('_bx_analytics_metric_visitors'),
            ]),
            'column' => _t('_bx_analytics_tab_countries'),
            'visitors' => _t('_bx_analytics_metric_visitors'),
            'bx_if:countries' => [
                'condition' => !empty($aCountries),
                'content' => ['bx_repeat:countries' => $aCountries],
            ],
            'bx_if:empty' => [
                'condition' => empty($aCountries),
                'content' => ['empty' => _t($aData['tab'] == 'live' ? '_bx_analytics_txt_no_recent' : '_bx_analytics_txt_no_data')],
            ],
            'bx_if:unknown' => [
                'condition' => $aData['unknown'] > 0,
                'content' => ['unknown' => _t('_bx_analytics_txt_map_unknown', $this->formatValue('number', $aData['unknown']))],
            ],
        ]);
    }

    protected function _getBotsHtml($aData, $oFilter)
    {
        return $this->parseHtmlByName('bots.html', [
            'tabs' => $this->_getTabsHtml('bots', $aData['tabs']),
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_bots')),
            'chart_json' => $this->_json($aData['chart']),
            'bots' => $this->_getTableHtml($aData['bots'], $oFilter),
            'pages_title' => $aData['pages']['caption'],
            'pages' => $this->_getTableHtml($aData['pages'], $oFilter),
        ]);
    }

    protected function _getEventsHtml($aData, $oFilter)
    {
        if($aData['view'] == 'list')
            return $this->_getTableHtml($aData, $oFilter);

        $aProps = [];
        foreach($aData['props'] as $aTable)
            $aProps[] = [
                'title' => $this->_esc($aTable['caption']),
                'table' => $this->_getTableHtml($aTable, $oFilter),
            ];

        return $this->parseHtmlByName('event.html', [
            'back' => _t('_bx_analytics_txt_back_events'),
            'title' => $this->_esc($aData['title']),
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_event', $aData['title'])),
            'chart_json' => $this->_json($aData['chart']),
            'platforms_title' => _t('_bx_analytics_tab_platforms'),
            'platforms' => $this->_getBarsHtml($aData['platforms'], 'count'),
            'bx_repeat:props' => $aProps,
            'bx_if:no_props' => [
                'condition' => empty($aProps),
                'content' => [
                    'props_title' => _t('_bx_analytics_txt_properties'),
                    'no_props' => _t('_bx_analytics_txt_no_properties'),
                ],
            ],
        ]);
    }

    protected function _getSessionsHtml($aData, $oFilter)
    {
        if($aData['view'] == 'list')
            return $this->_getTableHtml($aData, $oFilter);

        return $this->_getSessionHtml($aData);
    }

    protected function _getUsersHtml($aData, $oFilter)
    {
        if($aData['view'] == 'list')
            return $this->_getTableHtml($aData, $oFilter);

        if($aData['view'] == 'detail')
            return $this->_getSessionHtml($aData);

        return $this->parseHtmlByName('user.html', [
            'back' => _t('_bx_analytics_txt_back_members'),
            'member' => $this->_getMemberHtml($aData['member']),
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'sessions_title' => _t('_bx_analytics_lmi_cpt_sessions'),
            'sessions' => $this->_getTableHtml($aData['sessions'], $oFilter),
            'platforms_title' => _t('_bx_analytics_tab_platforms'),
            'platforms' => $this->_getBarsHtml($aData['platforms'], 'count'),
            'actions_title' => $aData['actions']['caption'],
            'actions' => $this->_getTableHtml($aData['actions'], $oFilter),
        ]);
    }

    protected function _getSessionHtml($aData)
    {
        $aFacts = [];
        foreach($aData['facts'] as $aFact)
            $aFacts[] = [
                'title' => $aFact['title'],
                'value' => $aFact['value'] === '' ? '&mdash;' : $this->formatValue($aFact['type'], $aFact['value']),
            ];

        $aKinds = [
            BX_ANALYTICS_HIT_PAGEVIEW => _t('_bx_analytics_event_type_pageview'),
            BX_ANALYTICS_HIT_EVENT => _t('_bx_analytics_event_type_event'),
            BX_ANALYTICS_HIT_UNA => _t('_bx_analytics_event_type_una'),
        ];

        $aTimeline = [];
        foreach($aData['timeline'] as $aItem)
            $aTimeline[] = [
                'type' => $aItem['type'],
                'offset' => sprintf('%d:%02d', intdiv($aItem['offset'], 60), $aItem['offset'] % 60),
                'kind' => isset($aKinds[$aItem['type']]) ? $aKinds[$aItem['type']] : $this->_esc($aItem['type']),
                'label' => $this->_esc($aItem['label']),
                'bx_if:path' => [
                    'condition' => $aItem['path'] !== '' && $aItem['path'] !== $aItem['label'],
                    'content' => ['path' => $this->_esc($aItem['path'])],
                ],
                'engaged' => $aItem['engaged'] ? $this->formatValue('duration', $aItem['engaged']) : '',
            ];

        return $this->parseHtmlByName('session.html', [
            'back' => _t('_bx_analytics_txt_back_sessions'),
            'member' => $this->_getMemberHtml($aData['member']),
            'bx_repeat:facts' => $aFacts,
            'timeline_title' => _t('_bx_analytics_txt_timeline'),
            'bx_if:timeline' => [
                'condition' => !empty($aTimeline),
                'content' => ['bx_repeat:timeline' => $aTimeline],
            ],
            'bx_if:empty' => [
                'condition' => empty($aTimeline),
                'content' => ['empty' => _t('_bx_analytics_txt_no_data')],
            ],
        ]);
    }

    protected function _getMemberHtml($aMember)
    {
        $bMember = !empty($aMember);

        return $this->parseHtmlByName('member.html', [
            'bx_if:thumb' => [
                'condition' => $bMember && !empty($aMember['thumb']),
                'content' => ['thumb' => $bMember ? $this->_esc($aMember['thumb']) : ''],
            ],
            'bx_if:no_thumb' => [
                'condition' => !$bMember || empty($aMember['thumb']),
                'content' => [],
            ],
            'bx_if:link' => [
                'condition' => $bMember,
                'content' => [
                    'url' => $bMember ? $this->_esc($aMember['url']) : '',
                    'name' => $bMember ? $this->_esc($aMember['name']) : '',
                ],
            ],
            'bx_if:text' => [
                'condition' => !$bMember,
                'content' => ['name' => _t('_bx_analytics_txt_guest')],
            ],
        ]);
    }

    /**
     * Shares as bars: items with label, a count under `$sKey` and share in percent.
     */
    protected function _getBarsHtml($aItems, $sKey)
    {
        $iMax = 1;
        foreach($aItems as $aItem)
            $iMax = max($iMax, (int)$aItem[$sKey]);

        $aRows = [];
        foreach($aItems as $aItem)
            $aRows[] = [
                'label' => $this->_esc($aItem['label']),
                'value' => $this->formatValue('number', $aItem[$sKey]),
                'share' => $aItem['share'],
                'bar' => round(100 * $aItem[$sKey] / $iMax, 1),
            ];

        return $this->parseHtmlByName('bars.html', [
            'bx_if:items' => [
                'condition' => !empty($aRows),
                'content' => ['bx_repeat:items' => $aRows],
            ],
            'bx_if:empty' => [
                'condition' => empty($aRows),
                'content' => ['empty' => _t('_bx_analytics_txt_no_data')],
            ],
        ]);
    }

    protected function _getJourneysHtml($aData, $oFilter)
    {
        $aEntries = [];
        foreach($aData['entries'] as $aEntry)
            $aEntries[] = [
                'page' => $this->_esc($aEntry['page']),
                'label' => $this->_esc($aEntry['page']),
                'sessions' => $this->formatValue('number', $aEntry['sessions']),
                'active' => $aEntry['active'] ? 'bx-analytics-row-btn-active' : '',
                'pressed' => $aEntry['active'] ? 'true' : 'false',
            ];

        $fNodes = function($aItems, $bOpen) use ($aData) {
            $aResult = [];
            foreach($aItems as $aItem) {
                $bExit = !empty($aItem['exit']);
                $bActive = !$bExit && $bOpen && $aItem['page'] === $aData['via'];
                $aResult[] = [
                    'label' => $bExit ? _t('_bx_analytics_txt_left_site') : $this->_esc($aItem['page']),
                    'share' => $aItem['share'],
                    'class' => ($bExit ? 'bx-analytics-flow-exit' : '') . ($bActive ? ' bx-analytics-flow-node-active' : ''),
                    'attrs' => $bOpen && !$bExit ? 'data-bx-analytics-open="via" data-bx-analytics-value="' . $this->_esc($aItem['page']) . '" aria-pressed="' . ($bActive ? 'true' : 'false') . '"' : 'disabled',
                ];
            }
            return $aResult;
        };

        $iMax = 1;
        foreach($aData['paths'] as $aPath)
            $iMax = max($iMax, $aPath['sessions']);

        $aPathRows = [];
        foreach($aData['paths'] as $aPath)
            $aPathRows[] = [
                'label' => implode(' → ', $aPath['pages']),
                'bar' => round(100 * $aPath['sessions'] / $iMax, 1),
                'values' => ['sessions' => $aPath['sessions'], 'share' => $aPath['share']],
            ];

        return $this->parseHtmlByName('journeys.html', [
            'entries_title' => _t('_bx_analytics_txt_start_page'),
            'bx_if:entries' => [
                'condition' => !empty($aEntries),
                'content' => ['bx_repeat:entries' => $aEntries],
            ],
            'bx_if:no_entries' => [
                'condition' => empty($aEntries),
                'content' => ['empty' => _t('_bx_analytics_txt_no_data')],
            ],
            'bx_if:flow' => [
                'condition' => $aData['jfrom'] !== '',
                'content' => [
                    'flow_label' => $this->_esc(_t('_bx_analytics_txt_journey_from', $aData['jfrom'])),
                    'step1' => _t('_bx_analytics_txt_step', 1),
                    'step2' => _t('_bx_analytics_txt_step', 2),
                    'step3' => _t('_bx_analytics_txt_step', 3),
                    'from' => $this->_esc($aData['jfrom']),
                    'from_sessions' => $this->formatValue('number', $aData['from_sessions']),
                    'bx_repeat:next' => $fNodes($aData['next'], true),
                    'bx_repeat:after' => $fNodes($aData['after'], false),
                    'bx_if:no_after' => [
                        'condition' => empty($aData['after']),
                        'content' => ['no_after' => _t('_bx_analytics_txt_pick_next')],
                    ],
                ],
            ],
            'paths_title' => _t('_bx_analytics_txt_top_paths'),
            'paths' => $this->_getTableHtml([
                'name' => 'paths',
                'caption' => _t('_bx_analytics_txt_top_paths'),
                'columns' => [
                    ['key' => 'label', 'type' => 'label', 'title' => _t('_bx_analytics_txt_path')],
                    ['key' => 'sessions', 'type' => 'number', 'title' => _t('_bx_analytics_metric_sessions')],
                    ['key' => 'share', 'type' => 'percent', 'title' => _t('_bx_analytics_txt_share')],
                ],
                'rows' => $aPathRows,
            ], $oFilter),
            'bx_if:truncated' => [
                'condition' => $aData['truncated'],
                'content' => ['truncated' => _t('_bx_analytics_txt_journeys_truncated')],
            ],
        ]);
    }

    protected function _getRetentionHtml($aData, $oFilter)
    {
        $aWeeks = [];
        for($i = 0; $i < $aData['weeks']; $i++)
            $aWeeks[] = ['week' => _t('_bx_analytics_txt_week_n', $i)];

        $oTz = new DateTimeZone($aData['tz']);
        $aRows = [];
        foreach($aData['rows'] as $aRow) {
            $aCells = [];
            foreach($aRow['weeks'] as $mixedPercent)
                $aCells[] = [
                    'heat' => $mixedPercent !== null ? round($mixedPercent / 100, 3) : 0,
                    'strong' => $mixedPercent !== null && $mixedPercent >= 45 ? 'bx-analytics-cohort-strong' : '',
                    'percent' => $mixedPercent !== null && $aRow['size'] ? $this->formatValue('percent', $mixedPercent) : '',
                ];

            $aRows[] = [
                'start' => (new DateTime('@' . $aRow['start']))->setTimezone($oTz)->format('Y-m-d'),
                'size' => $this->formatValue('number', $aRow['size']),
                'bx_repeat:cells' => $aCells,
            ];
        }

        return $this->parseHtmlByName('retention.html', [
            'tabs' => $this->_getTabsHtml('retention', $aData['tabs']),
            'bx_if:cookieless' => [
                'condition' => $aData['cookieless'],
                'content' => ['cookieless' => _t('_bx_analytics_txt_retention_cookieless')],
            ],
            'caption' => $this->_esc(_t('_bx_analytics_lmi_cpt_retention')),
            'cohort_title' => _t('_bx_analytics_txt_cohort'),
            'size_title' => _t('_bx_analytics_metric_visitors'),
            'bx_repeat:weeks' => $aWeeks,
            'bx_repeat:rows' => $aRows,
        ]);
    }

    protected function _getGoalsHtml($aData, $oFilter)
    {
        $sCsrf = $aData['manage'] ? (string)BxDolForm::getCsrfToken() : '';
        $aTypes = ['page' => _t('_bx_analytics_txt_goal_type_page'), 'event' => _t('_bx_analytics_txt_goal_type_event')];

        $fMax = 0;
        foreach($aData['goals'] as $aGoal)
            $fMax = max($fMax, $aGoal['rate']);

        $aGoals = [];
        $aEdit = null;
        foreach($aData['goals'] as $aGoal) {
            if($aData['edit'] !== '' && $aGoal['id'] === (int)$aData['edit'])
                $aEdit = $aGoal;

            $aGoals[] = [
                'id' => $aGoal['id'],
                'name' => $this->_esc($aGoal['name']),
                'type' => _t('_bx_analytics_txt_goal_badge_' . $aGoal['type']),
                'pattern' => $this->_esc($aGoal['pattern']),
                'rate' => $this->formatValue('percent', $aGoal['rate']),
                'change' => $this->_formatChange($aGoal['change']),
                'trend' => $this->_trend('', $aGoal['change']),
                'conversions' => _t('_bx_analytics_txt_conversions', $this->formatValue('number', $aGoal['conversions']), $this->formatValue('number', $aGoal['visitors'])),
                'bar' => $fMax ? round(100 * $aGoal['rate'] / $fMax, 1) : 0,
                'bx_if:actions' => [
                    'condition' => $aData['manage'],
                    'content' => [
                        'id' => $aGoal['id'],
                        'edit' => _t('_bx_analytics_txt_edit'),
                        'delete' => _t('_bx_analytics_txt_delete'),
                        'confirm' => $this->_esc(_t('_bx_analytics_txt_goal_delete_confirm', $aGoal['name'])),
                        'csrf' => $this->_esc($sCsrf),
                    ],
                ],
            ];
        }

        $bForm = $aData['manage'] && ($aEdit || $aData['edit'] === 'new');

        return $this->parseHtmlByName('goals.html', [
            'bx_if:goals' => [
                'condition' => !empty($aGoals),
                'content' => ['bx_repeat:goals' => $aGoals],
            ],
            'bx_if:empty' => [
                'condition' => empty($aGoals),
                'content' => ['empty' => _t('_bx_analytics_txt_no_goals')],
            ],
            'bx_if:add' => [
                'condition' => $aData['manage'] && !$bForm,
                'content' => ['add' => _t('_bx_analytics_txt_add_goal')],
            ],
            'bx_if:form' => [
                'condition' => $bForm,
                'content' => [
                    'form_title' => _t($aEdit ? '_bx_analytics_txt_edit_goal' : '_bx_analytics_txt_add_goal'),
                    'form_id' => $aEdit ? $aEdit['id'] : 0,
                    'form_csrf' => $this->_esc($sCsrf),
                    'form_name' => $aEdit ? $this->_esc($aEdit['name']) : '',
                    'form_pattern' => $aEdit ? $this->_esc($aEdit['pattern']) : '',
                    'page_selected' => !$aEdit || $aEdit['type'] == 'page' ? 'selected' : '',
                    'event_selected' => $aEdit && $aEdit['type'] == 'event' ? 'selected' : '',
                    'label_name' => _t('_bx_analytics_txt_name'),
                    'label_type' => _t('_bx_analytics_txt_goal_type'),
                    'label_pattern' => _t('_bx_analytics_txt_goal_match'),
                    'type_page' => $aTypes['page'],
                    'type_event' => $aTypes['event'],
                    'hint' => _t('_bx_analytics_txt_match_hint'),
                    'save' => _t('_bx_analytics_txt_save'),
                    'cancel' => _t('_bx_analytics_txt_cancel'),
                ],
            ],
        ]);
    }

    protected function _getFunnelsHtml($aData, $oFilter)
    {
        $sCsrf = $aData['manage'] ? (string)BxDolForm::getCsrfToken() : '';
        $aTypes = ['page' => _t('_bx_analytics_txt_goal_type_page'), 'event' => _t('_bx_analytics_txt_goal_type_event')];

        $aList = [];
        foreach($aData['funnels'] as $aFunnel)
            $aList[] = [
                'id' => $aFunnel['id'],
                'name' => $this->_esc($aFunnel['name']),
                'active' => $aFunnel['active'] ? 'bx-analytics-chip-active' : '',
                'pressed' => $aFunnel['active'] ? 'true' : 'false',
            ];

        $aSteps = [];
        foreach($aData['steps'] as $i => $aStep)
            $aSteps[] = [
                'number' => $i + 1,
                'pattern' => $this->_esc($aStep['pattern']),
                'type' => _t('_bx_analytics_txt_goal_badge_' . $aStep['type']),
                'rate_bar' => $aStep['rate'],
                'sessions' => _t('_bx_analytics_txt_n_sessions', $this->formatValue('number', $aStep['sessions'])),
                'rate' => $this->formatValue('percent', $aStep['rate']),
                'bx_if:drop' => [
                    'condition' => $aStep['drop'] !== null,
                    'content' => ['drop' => _t('_bx_analytics_txt_dropped', $this->formatValue('percent', (float)$aStep['drop']))],
                ],
            ];

        $sEdit = (string)$aData['edit'];
        $bNew = $sEdit === 'new';
        $bEdit = $aData['funnel'] && $sEdit !== '' && (int)$sEdit === $aData['funnel']['id'];
        $bForm = $aData['manage'] && ($bNew || $bEdit);

        $aRows = [];
        $aDefinition = $bEdit ? $aData['definition'] : [];
        for($i = 0; $i < $aData['max_steps']; $i++) {
            $aStep = isset($aDefinition[$i]) ? $aDefinition[$i] : ['type' => 'page', 'pattern' => ''];
            $aRows[] = [
                'row_number' => $i + 1,
                'row_type_label' => _t('_bx_analytics_txt_step_type', $i + 1),
                'row_pattern_label' => _t('_bx_analytics_txt_step_match', $i + 1),
                'row_page' => $aStep['type'] == 'page' ? 'selected' : '',
                'row_type_page' => $aTypes['page'],
                'row_type_event' => $aTypes['event'],
                'row_event' => $aStep['type'] == 'event' ? 'selected' : '',
                'row_pattern' => $this->_esc($aStep['pattern']),
            ];
        }

        return $this->parseHtmlByName('funnels.html', [
            'bx_if:list' => [
                'condition' => count($aList) > 1,
                'content' => [
                    'list_label' => $this->_esc(_t('_bx_analytics_lmi_cpt_funnels')),
                    'bx_repeat:list' => $aList,
                ],
            ],
            'bx_if:manage' => [
                'condition' => $aData['manage'] && !$bForm,
                'content' => [
                    'add' => _t('_bx_analytics_txt_add_funnel'),
                    'bx_if:current' => [
                        'condition' => (bool)$aData['funnel'],
                        'content' => [
                            'current_id' => $aData['funnel'] ? $aData['funnel']['id'] : 0,
                            'edit' => _t('_bx_analytics_txt_edit'),
                            'delete' => _t('_bx_analytics_txt_delete'),
                            'confirm' => $this->_esc(_t('_bx_analytics_txt_funnel_delete_confirm', $aData['funnel'] ? $aData['funnel']['name'] : '')),
                            'csrf' => $this->_esc($sCsrf),
                        ],
                    ],
                ],
            ],
            'bx_if:steps' => [
                'condition' => !empty($aSteps) && !$bForm,
                'content' => ['bx_repeat:steps' => $aSteps],
            ],
            'bx_if:empty' => [
                'condition' => empty($aSteps) && !$bForm,
                'content' => ['empty' => _t('_bx_analytics_txt_no_funnels')],
            ],
            'bx_if:form' => [
                'condition' => $bForm,
                'content' => [
                    'form_title' => _t($bEdit ? '_bx_analytics_txt_edit_funnel' : '_bx_analytics_txt_add_funnel'),
                    'form_id' => $bEdit ? $aData['funnel']['id'] : 0,
                    'form_csrf' => $this->_esc($sCsrf),
                    'form_name' => $bEdit ? $this->_esc($aData['funnel']['name']) : '',
                    'label_name' => _t('_bx_analytics_txt_name'),
                    'bx_repeat:rows' => $aRows,
                    'hint' => _t('_bx_analytics_txt_funnel_hint'),
                    'save' => _t('_bx_analytics_txt_save'),
                    'cancel' => _t('_bx_analytics_txt_cancel'),
                ],
            ],
        ]);
    }

    protected function _getRevenueHtml($aData, $oFilter)
    {
        return $this->parseHtmlByName('revenue.html', [
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_revenue')),
            'chart_json' => $this->_json($aData['chart']),
            'split' => $this->_getTableHtml($aData['split'], $oFilter),
            'notes' => $this->_getNotesHtml($aData['notes']),
            'import' => $this->_getImportHtml($aData['import']),
        ]);
    }

    protected function _getSubscriptionsHtml($aData, $oFilter)
    {
        return $this->parseHtmlByName('subscriptions.html', [
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_mrr')),
            'chart_json' => $this->_json($aData['chart']),
            'movement_title' => _t('_bx_analytics_txt_sbs_movement'),
            'movement_label' => $this->_esc(_t('_bx_analytics_txt_sbs_movement')),
            'movement_json' => $this->_json($aData['movement']),
            'plans_title' => $this->_esc($aData['plans']['caption']),
            'plans' => $this->_getTableHtml($aData['plans'], $oFilter),
            'reasons_title' => $this->_esc($aData['reasons']['caption']),
            'reasons' => $this->_getTableHtml($aData['reasons'], $oFilter),
            'notes' => $this->_getNotesHtml($aData['notes']),
        ]);
    }

    protected function _getSalesHtml($aData, $oFilter)
    {
        return $this->parseHtmlByName('sales.html', [
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'items_title' => $this->_esc($aData['items']['caption']),
            'items' => $this->_getTableHtml($aData['items'], $oFilter),
            'sellers_title' => $this->_esc($aData['sellers']['caption']),
            'sellers' => $this->_getTableHtml($aData['sellers'], $oFilter),
            'bx_if:invoices' => [
                'condition' => !empty($aData['invoices']),
                'content' => [
                    'invoices_title' => _t('_bx_analytics_txt_sales_invoices'),
                    'invoices' => !empty($aData['invoices']) ? $this->_getTilesHtml($aData['invoices']) : '',
                ],
            ],
            'notes' => $this->_getNotesHtml($aData['notes']),
        ]);
    }

    protected function _getCreditsHtml($aData, $oFilter)
    {
        if(empty($aData['available']))
            return $this->parseHtmlByName('credits.html', [
                'bx_if:credits' => ['condition' => false, 'content' => []],
                'bx_if:none' => [
                    'condition' => true,
                    'content' => ['empty' => _t('_bx_analytics_txt_credits_none')],
                ],
                'notes' => '',
            ]);

        return $this->parseHtmlByName('credits.html', [
            'bx_if:credits' => [
                'condition' => true,
                'content' => [
                    'tiles' => $this->_getTilesHtml($aData['tiles']),
                    'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_credits')),
                    'chart_json' => $this->_json($aData['chart']),
                    'spenders_title' => $this->_esc($aData['spenders']['caption']),
                    'spenders' => $this->_getTableHtml($aData['spenders'], $oFilter),
                    'spent_title' => $this->_esc($aData['spent']['caption']),
                    'spent' => $this->_getTableHtml($aData['spent'], $oFilter),
                ],
            ],
            'bx_if:none' => ['condition' => false, 'content' => []],
            'notes' => $this->_getNotesHtml($aData['notes']),
        ]);
    }

    /**
     * Errors: the list with its key figures, or one error group. Messages, sources and
     * stacks come from visitors' browsers and apps: every one is escaped.
     */
    protected function _getErrorsHtml($aData, $oFilter)
    {
        if($aData['view'] == 'list')
            return $this->parseHtmlByName('errors.html', [
                'tiles' => $this->_getTilesHtml($aData['tiles']),
                'table' => $this->_getTableHtml($aData, $oFilter),
            ]);

        if(!empty($aData['missing']))
            return $this->parseHtmlByName('error_missing.html', [
                'back' => _t('_bx_analytics_txt_back_errors'),
                'text' => $this->_esc($aData['title']),
            ]);

        $sCsrf = $aData['manage'] ? (string)BxDolForm::getCsrfToken() : '';
        $aActions = [];
        foreach($aData['actions'] as $aAction)
            $aActions[] = [
                'action_op' => $aAction['op'],
                'action_id' => (int)$aData['id'],
                'action_csrf' => $this->_esc($sCsrf),
                'action_title' => $aAction['title'],
            ];

        $aFacts = [];
        foreach($aData['facts'] as $aFact)
            $aFacts[] = [
                'fact_title' => $aFact['title'],
                'fact_value' => $this->formatValue($aFact['type'], $aFact['value']),
            ];

        $aBreakdowns = [];
        foreach($aData['breakdowns'] as $aTable)
            $aBreakdowns[] = [
                'breakdown_title' => $this->_esc($aTable['caption']),
                'breakdown' => $this->_getTableHtml($aTable, $oFilter),
            ];

        $bStack = $aData['stack'] !== '';

        return $this->parseHtmlByName('error.html', [
            'back' => _t('_bx_analytics_txt_back_errors'),
            'title' => $this->_esc($aData['title']),
            'bx_if:actions' => [
                'condition' => !empty($aActions),
                'content' => [
                    'actions_label' => $this->_esc(_t('_bx_analytics_txt_error_actions')),
                    'bx_repeat:actions' => $aActions,
                ],
            ],
            'bx_repeat:facts' => $aFacts,
            'tiles' => $this->_getTilesHtml($aData['tiles']),
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_error', $aData['title'])),
            'chart_json' => $this->_json($aData['chart']),
            'stack_title' => _t('_bx_analytics_txt_error_stack'),
            'bx_if:no_stack' => [
                'condition' => !$bStack,
                'content' => ['no_stack' => _t($aData['stack_hidden'] ? '_bx_analytics_txt_error_stack_hidden' : '_bx_analytics_txt_error_no_stack')],
            ],
            'bx_if:breakdowns' => [
                'condition' => !empty($aBreakdowns),
                'content' => ['bx_repeat:breakdowns' => $aBreakdowns],
            ],
            'latest_title' => $this->_esc($aData['occurrences']['caption']),
            'latest' => $this->_getTableHtml($aData['occurrences'], $oFilter),
            // last: visitor text goes in after every placeholder is filled
            'bx_if:stack' => [
                'condition' => $bStack,
                'content' => [
                    'stack_label' => $this->_esc(_t('_bx_analytics_txt_error_stack')),
                    'stack' => $this->_esc($aData['stack']),
                ],
            ],
        ]);
    }

    /**
     * Performance: a card per metric (75th percentile, rating, distribution) that picks the
     * metric for the chart and the tables.
     */
    protected function _getPerformanceHtml($aData, $oFilter)
    {
        $aDevices = [];
        foreach($aData['devices'] as $aDevice)
            $aDevices[] = [
                'device_value' => $aDevice['value'],
                'device_title' => $aDevice['title'],
                'device_selected' => $aDevice['selected'] ? 'selected="selected"' : '',
            ];

        $aCards = [];
        foreach($aData['cards'] as $aCard)
            $aCards[] = [
                'card_metric' => $aCard['metric'],
                'card_title' => $aCard['title'],
                'card_value' => $aCard['value'] !== null ? $this->formatValue($aCard['unit'], $aCard['value']) : _t('_bx_analytics_txt_not_enough_data'),
                'card_rating' => $aCard['rating'] !== '' ? str_replace('_', '-', $aCard['rating']) : 'none',
                'card_rating_title' => $aCard['rating'] !== '' ? _t('_bx_analytics_rating_' . $aCard['rating']) : '',
                'card_pressed' => $aCard['active'] ? 'true' : 'false',
                'card_good' => $aCard['good'],
                'card_ni' => $aCard['needs_improvement'],
                'card_poor' => $aCard['poor'],
                'card_dist' => $aCard['samples'] ? _t('_bx_analytics_txt_vital_distribution', $this->formatValue('percent', $aCard['good']), $this->formatValue('percent', $aCard['needs_improvement']), $this->formatValue('percent', $aCard['poor'])) : '',
                'card_samples' => _t('_bx_analytics_txt_n_samples', $this->formatValue('number', $aCard['samples'])),
                'card_thresholds' => _t('_bx_analytics_txt_vital_thresholds', $this->formatValue($aCard['unit'], $aCard['good_max']), $this->formatValue($aCard['unit'], $aCard['poor_min'])),
            ];

        return $this->parseHtmlByName('performance.html', [
            'device_label' => _t('_bx_analytics_txt_device'),
            'bx_repeat:devices' => $aDevices,
            'cards_label' => $this->_esc(_t('_bx_analytics_txt_vitals_metrics')),
            'bx_repeat:cards' => $aCards,
            'chart_title' => $this->_esc(_t('_bx_analytics_txt_chart_vital', $aData['metric_title'])),
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_vital', $aData['metric_title'])),
            'chart_json' => $this->_json($aData['chart']),
            'platforms_title' => $this->_esc($aData['platforms']['caption']),
            'platforms' => $this->_getTableHtml($aData['platforms'], $oFilter),
            'pages_title' => $this->_esc($aData['pages']['caption']),
            'pages' => $this->_getTableHtml($aData['pages'], $oFilter),
        ]);
    }

    /**
     * A sparkline of values over time, scaled to its own maximum.
     */
    protected function _getSparkHtml($aValues)
    {
        $aValues = array_values($aValues);
        $iCount = count($aValues);
        if(!$iCount)
            return '';

        $fMax = max(1, max($aValues));
        $aPoints = [];
        foreach($aValues as $i => $mixedValue)
            $aPoints[] = round($iCount > 1 ? 100 * $i / ($iCount - 1) : 50, 2) . ',' . round(22 - 20 * (float)$mixedValue / $fMax, 2);
        if($iCount == 1)
            $aPoints[] = '100,' . round(22 - 20 * (float)$aValues[0] / $fMax, 2);

        return $this->parseHtmlByName('spark.html', [
            'points' => implode(' ', $aPoints),
        ]);
    }

    /**
     * Short notes under a report: how amounts are counted, what is missing.
     */
    protected function _getNotesHtml($aNotes)
    {
        if(empty($aNotes))
            return '';

        $aItems = [];
        foreach($aNotes as $sNote)
            $aItems[] = ['note' => $this->_esc($sNote)];

        return $this->parseHtmlByName('notes.html', [
            'bx_repeat:notes' => $aItems,
        ]);
    }

    /**
     * The import of past payments, with a button to run a step now, for administrators.
     */
    protected function _getImportHtml($aImport)
    {
        if(empty($aImport) || empty($aImport['state']))
            return '';

        $bRunning = $aImport['state'] == 'running';

        return $this->parseHtmlByName('import.html', [
            'title' => _t('_bx_analytics_txt_import_title'),
            'text' => $this->_esc(_t($bRunning ? '_bx_analytics_txt_import_running' : '_bx_analytics_txt_import_done', $this->formatValue('number', $aImport['imported']))),
            'hint' => _t('_bx_analytics_txt_import_hint'),
            'button' => _t($bRunning ? '_bx_analytics_txt_import_continue' : '_bx_analytics_txt_import_again'),
            'op' => $bRunning ? 'import' : 'restart',
            'confirm' => $bRunning ? '' : $this->_esc(_t('_bx_analytics_txt_import_confirm')),
            'csrf' => $this->_esc((string)BxDolForm::getCsrfToken()),
        ]);
    }

    /**
     * Key figures that are not chart switches: title, value and an optional note or change.
     */
    protected function _getTilesHtml($aTiles)
    {
        $aItems = [];
        foreach($aTiles as $aTile)
            $aItems[] = [
                'title' => $aTile['title'],
                // nothing to measure (a rate without a base): say so instead of an empty tile
                'value' => $aTile['value'] === null ? _t('_bx_analytics_txt_not_available') : $this->formatValue(isset($aTile['type']) ? $aTile['type'] : 'number', $aTile['value']),
                'bx_if:sub' => [
                    'condition' => !empty($aTile['sub']),
                    'content' => ['sub' => !empty($aTile['sub']) ? $this->_esc($aTile['sub']) : ''],
                ],
                'bx_if:change' => [
                    'condition' => isset($aTile['change']) && $aTile['change'] !== null,
                    'content' => [
                        'change' => isset($aTile['change']) ? $this->_formatChange($aTile['change']) : '',
                        'trend' => isset($aTile['change']) ? $this->_trend(isset($aTile['metric']) ? $aTile['metric'] : '', $aTile['change']) : 'flat',
                    ],
                ],
            ];

        return $this->parseHtmlByName('tiles.html', [
            'bx_repeat:tiles' => $aItems,
        ]);
    }

    /**
     * A table report: columns with types, rows with a label cell that filters, links or is plain.
     */
    protected function _getTableHtml($aTable, $oFilter)
    {
        $aColumns = [];
        foreach($aTable['columns'] as $aColumn)
            $aColumns[] = [
                'type' => $aColumn['type'],
                'title' => $aColumn['title'],
            ];

        $aRows = [];
        foreach($aTable['rows'] as $aRow) {
            $aCells = [];
            foreach($aTable['columns'] as $aColumn) {
                $sKey = $aColumn['key'];
                $bLabel = $aColumn['type'] == 'label';

                $aCells[] = [
                    'type' => $aColumn['type'],
                    'bx_if:label' => [
                        'condition' => $bLabel,
                        'content' => $bLabel ? $this->_getLabelCell($aRow) : [],
                    ],
                    'bx_if:value' => [
                        'condition' => !$bLabel,
                        'content' => [
                            'cell_value' => !$bLabel ? $this->formatValue($aColumn['type'], isset($aRow['values'][$sKey]) ? $aRow['values'][$sKey] : null) : '',
                        ],
                    ],
                ];
            }

            $aRows[] = ['bx_repeat:cells' => $aCells];
        }

        $aPager = isset($aTable['pages']) && $aTable['pages'] > 1 ? [
            'name' => $aTable['name'],
            'page' => $aTable['page'],
            'pages' => $aTable['pages'],
            'prev' => max(1, $aTable['page'] - 1),
            'next' => min($aTable['pages'], $aTable['page'] + 1),
            'prev_disabled' => $aTable['page'] <= 1 ? 'disabled' : '',
            'next_disabled' => $aTable['page'] >= $aTable['pages'] ? 'disabled' : '',
            'txt_prev' => _t('_bx_analytics_txt_prev'),
            'txt_next' => _t('_bx_analytics_txt_next'),
            'txt_page' => _t('_bx_analytics_txt_page_of', $aTable['page'], $aTable['pages']),
        ] : [];

        return $this->parseHtmlByName('table.html', [
            'tabs' => !empty($aTable['tabs']) ? $this->_getTabsHtml($aTable['name'], $aTable['tabs']) : '',
            'panel_attrs' => !empty($aTable['tabs']) ? 'role="tabpanel" id="bx-analytics-panel-' . $aTable['name'] . '"' : '',
            'name' => $aTable['name'],
            'caption' => $this->_esc($aTable['caption']),
            'bx_if:rows' => [
                'condition' => !empty($aRows),
                'content' => [
                    'caption' => $this->_esc($aTable['caption']),
                    'bx_repeat:columns' => $aColumns,
                    'bx_repeat:rows' => $aRows,
                ],
            ],
            'bx_if:empty' => [
                'condition' => empty($aRows),
                'content' => ['empty' => !empty($aTable['empty']) ? $aTable['empty'] : _t('_bx_analytics_txt_no_data')],
            ],
            'bx_if:pager' => [
                'condition' => !empty($aPager),
                'content' => $aPager,
            ],
        ]);
    }

    protected function _getLabelCell($aRow)
    {
        $sLabel = $this->_esc($aRow['label']);
        $sSub = isset($aRow['sub']) ? $this->_esc($aRow['sub']) : '';
        $bFilter = !empty($aRow['filter']);
        $bLink = !$bFilter && !empty($aRow['link']);
        $bOpen = !$bFilter && !$bLink && !empty($aRow['open']);

        return [
            'bar' => isset($aRow['bar']) ? $aRow['bar'] : 0,
            // placeholder names are unique across the row: the parser fills every one with
            // the same name from any part of the row
            'bx_if:filter' => [
                'condition' => $bFilter,
                'content' => [
                    'filter_dim' => $bFilter ? $aRow['filter']['dim'] : '',
                    'filter_value' => $bFilter ? $this->_esc($aRow['filter']['value']) : '',
                    'filter_title' => $this->_esc(_t('_bx_analytics_txt_filter_by', $aRow['label'])),
                    'label' => $sLabel,
                ],
            ],
            'bx_if:link' => [
                'condition' => $bLink,
                'content' => [
                    'link_href' => $bLink ? $this->_esc($aRow['link']) : '',
                    'label' => $sLabel,
                ],
            ],
            'bx_if:open' => [
                'condition' => $bOpen,
                'content' => [
                    'open_param' => $bOpen ? $aRow['open']['param'] : '',
                    'open_value' => $bOpen ? $this->_esc($aRow['open']['value']) : '',
                    'label' => $sLabel,
                ],
            ],
            'bx_if:text' => [
                'condition' => !$bFilter && !$bLink && !$bOpen,
                'content' => ['label' => $sLabel],
            ],
            'bx_if:sub' => [
                'condition' => $sSub !== '',
                'content' => ['sub' => $sSub],
            ],
        ];
    }

    protected function _getTabsHtml($sGroup, $aTabs)
    {
        if(count($aTabs) < 2)
            return '';

        $aItems = [];
        foreach($aTabs as $aTab)
            $aItems[] = [
                'group' => $sGroup,
                'name' => $aTab['name'],
                'title' => $aTab['title'],
                'selected' => $aTab['active'] ? 'true' : 'false',
                'tabindex' => $aTab['active'] ? '0' : '-1',
            ];

        return $this->parseHtmlByName('tabs.html', [
            'group' => $sGroup,
            'label' => $this->_esc(_t('_bx_analytics_group_' . $sGroup)),
            'bx_repeat:tabs' => $aItems,
        ]);
    }

    /**
     * Creates the dashboard script object once per page, whatever block comes first.
     */
    protected function _getJsInit()
    {
        return $this->getJsCode('dashboard', [
            'sActionUrl' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri(),
            'aStrings' => [
                'duration_h' => _t('_bx_analytics_txt_duration_h'),
                'duration_m' => _t('_bx_analytics_txt_duration_m'),
                'duration_s' => _t('_bx_analytics_txt_duration_s'),
                'ms' => _t('_bx_analytics_txt_ms'),
                'error' => _t('_bx_analytics_txt_error_loading'),
            ],
        ], [
            'mask' => "if(typeof window.{object} == 'undefined') window.{object} = new {class}({params});",
            'wrap' => true,
        ]);
    }

    protected function _addDashboardAssets($sReport = '')
    {
        $aJs = ['chart.umd.min.js', 'dashboard.js'];
        $aCss = ['dashboard.css'];

        // the map uses the Leaflet copy and tile provider the site's location maps use
        if($sReport == 'map') {
            $aJs = array_merge(['leaflet/leaflet.js', 'leaflet-providers/leaflet-providers.js'], $aJs);
            $aCss[] = BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'leaflet/|leaflet.css';
        }

        $this->_addAssets($aJs, $aCss);
    }

    protected function _addAssets($aJs, $aCss)
    {
        if($this->_bStudio) {
            $this->addStudioJs($aJs);
            $this->addStudioCss($aCss);
            return;
        }

        $this->addJs($aJs);
        $this->addCss($aCss);
    }

    /**
     * 950, 9.5K, 95K, 1.2M
     */
    protected function _formatNumber($iValue)
    {
        $iValue = (int)$iValue;
        foreach([1000000000 => 'B', 1000000 => 'M', 1000 => 'K'] as $iSize => $sSuffix)
            if($iValue >= $iSize) {
                $fValue = $iValue / $iSize;
                return ($fValue < 10 ? rtrim(rtrim(number_format($fValue, 1), '0'), '.') : number_format(floor($fValue))) . $sSuffix;
            }

        return (string)$iValue;
    }

    protected function _formatChange($mixedChange)
    {
        if($mixedChange === null)
            return '';

        return ($mixedChange > 0 ? '+' : '') . number_format(abs($mixedChange) < 10 ? $mixedChange : round($mixedChange), abs($mixedChange) < 10 ? 1 : 0) . '%';
    }

    /**
     * good, bad or flat, where down is good for bounce rate.
     */
    protected function _trend($sMetric, $mixedChange)
    {
        if($mixedChange === null || $mixedChange == 0)
            return 'flat';

        $bUp = $mixedChange > 0;
        if(in_array($sMetric, ['bounce_rate', 'errors', 'refunds', 'cancelled', 'churn'], true))
            return $bUp ? 'bad' : 'good';

        return $bUp ? 'good' : 'bad';
    }

    /**
     * Visitor-supplied text (paths, titles, referrers) for HTML text and attributes.
     */
    protected function _esc($s)
    {
        return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
    }

    /**
     * JSON safe to put inside a script element.
     */
    protected function _json($a)
    {
        return json_encode($a, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
    }
}

/** @} */
