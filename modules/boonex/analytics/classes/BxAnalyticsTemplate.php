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
     * Query: what to break down and sort by, the first values over time, the table, and the
     * CSV download of every value.
     */
    protected function _getQueryHtml($aData, $oFilter)
    {
        $aDimensions = ['event' => [], 'session' => []];
        foreach($aData['dimensions'] as $aDimension)
            $aDimensions[$aDimension['kind']][] = [
                'dim_value' => $aDimension['name'],
                'dim_title' => $aDimension['title'],
                'dim_selected' => $aDimension['name'] == $aData['dimension'] ? 'selected="selected"' : '',
            ];

        $aMetrics = [];
        foreach($aData['metrics'] as $aMetric)
            $aMetrics[] = [
                'metric_value' => $aMetric['name'],
                'metric_title' => $aMetric['title'],
                'metric_selected' => $aMetric['name'] == $aData['metric'] ? 'selected="selected"' : '',
            ];

        $aDirs = [];
        foreach(['desc', 'asc'] as $sDir)
            $aDirs[] = [
                'dir_value' => $sDir,
                'dir_title' => _t('_bx_analytics_txt_sort_' . $sDir),
                'dir_selected' => $sDir == $aData['dir'] ? 'selected="selected"' : '',
            ];

        $bRows = !empty($aData['rows']);
        $sExportUrl = bx_append_url_params(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'export/query/', http_build_query(array_merge($oFilter->getParams(), [
            'q_dim' => $aData['dimension'],
            'q_metric' => $aData['metric'],
            'q_dir' => $aData['dir'],
        ]), '', '&', PHP_QUERY_RFC3986));

        return $this->parseHtmlByName('query.html', [
            'dimension_label' => _t('_bx_analytics_txt_dimension'),
            'event_dims_label' => _t('_bx_analytics_txt_dims_event'),
            'bx_repeat:event_dims' => $aDimensions['event'],
            'session_dims_label' => _t('_bx_analytics_txt_dims_session'),
            'bx_repeat:session_dims' => $aDimensions['session'],
            'metric_label' => _t('_bx_analytics_txt_metric'),
            'bx_repeat:metrics' => $aMetrics,
            'dir_label' => _t('_bx_analytics_txt_sort'),
            'bx_repeat:dirs' => $aDirs,
            'bx_if:download' => [
                'condition' => $bRows,
                'content' => [
                    'export_url' => $this->_esc($sExportUrl),
                    'download' => _t('_bx_analytics_txt_download_csv'),
                ],
            ],
            'bx_if:chart' => [
                'condition' => $bRows,
                'content' => [
                    'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_query', _t('_bx_analytics_metric_' . $aData['metric']), count($aData['chart']['series']))),
                    'chart_json' => $this->_json($aData['chart']),
                ],
            ],
            'table' => $this->_getTableHtml($aData, $oFilter),
            'bx_if:truncated' => [
                'condition' => $aData['total'] > $aData['export_max'],
                'content' => [
                    'truncated' => _t('_bx_analytics_txt_csv_truncated', $this->formatValue('number', $aData['export_max']), $this->formatValue('number', $aData['total'])),
                ],
            ],
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
                // the column the rows are sorted by: ascending or descending
                'sort' => isset($aColumn['sort']) && in_array($aColumn['sort'], ['ascending', 'descending'], true) ? 'aria-sort="' . $aColumn['sort'] . '"' : '',
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
     * Studio > API: pick a report, edit its parameters, see the call as bx_srv, as an
     * api.php URL and as NEO's request, and run it.
     *
     * @param array $aData catalog (see BxAnalyticsModule::getApiCatalog), api_enabled, api_access
     */
    public function getStudioApi($aData)
    {
        $aCatalog = $aData['catalog'];

        $aNotices = [];
        if(!$aData['api_enabled'])
            $aNotices[] = ['notice' => $this->_esc(_t('_bx_analytics_txt_api_disabled'))];
        elseif(!$aData['api_access'])
            $aNotices[] = ['notice' => $this->_esc(_t('_bx_analytics_txt_api_no_access'))];

        // a top list first: it shows what parameters do
        $sSelected = isset($aCatalog['reports']['top']) ? 'top' : (string)key($aCatalog['reports']);

        $aReports = [];
        $aDocs = [];
        foreach($aCatalog['reports'] as $sReport => $aParams) {
            $aReports[] = [
                'report_value' => $sReport,
                'report_title' => $this->_esc(_t('_bx_analytics_report_' . $sReport)),
                'report_selected' => $sReport == $sSelected ? 'selected="selected"' : '',
            ];

            $aDocs[] = [
                'doc_report' => $sReport,
                'doc_hidden' => $sReport == $sSelected ? '' : 'hidden',
                'doc_table' => $this->_getApiParamsHtml($aParams, _t('_bx_analytics_txt_api_report_params', _t('_bx_analytics_report_' . $sReport))),
            ];
        }

        $this->_addToolsAssets();

        return $this->_getToolsJsInit() . $this->parseHtmlByName('studio_api.html', [
            'bx_if:notices' => [
                'condition' => !empty($aNotices),
                'content' => ['bx_repeat:notices' => $aNotices],
            ],
            'intro' => _t('_bx_analytics_txt_api_intro'),
            'csrf' => $this->_esc((string)BxDolForm::getCsrfToken()),
            'report_label' => _t('_bx_analytics_txt_api_report'),
            'bx_repeat:reports' => $aReports,
            'params_label' => _t('_bx_analytics_txt_api_params'),
            'params_hint' => _t('_bx_analytics_txt_api_params_hint'),
            'docs_label' => _t('_bx_analytics_txt_api_docs'),
            'params_default' => $this->_esc($sSelected == 'top' ? '{"group": "pages", "range": "7d"}' : '{"range": "7d"}'),
            'common_table' => $this->_getApiParamsHtml($aCatalog['common'], _t('_bx_analytics_txt_api_common_params')),
            'bx_repeat:docs' => $aDocs,
            'code_srv' => $this->_getCodeHtml('bx-analytics-api-srv', _t('_bx_analytics_txt_api_srv'), ''),
            'code_url' => $this->_getCodeHtml('bx-analytics-api-url', _t('_bx_analytics_txt_api_url'), ''),
            'code_neo' => $this->_getCodeHtml('bx-analytics-api-neo', _t('_bx_analytics_txt_api_neo'), ''),
            'run' => _t('_bx_analytics_txt_api_run'),
            'response_label' => _t('_bx_analytics_txt_api_response'),
            'copy' => _t('_bx_analytics_txt_copy'),
            'copied' => $this->_esc(_t('_bx_analytics_txt_copied')),
            'catalog_json' => $this->_json([
                'root' => BX_DOL_URL_ROOT,
                'module' => $this->MODULE,
                'reports' => array_keys($aCatalog['reports']),
            ]),
        ]);
    }

    /**
     * A table of parameters: name and what it accepts.
     */
    protected function _getApiParamsHtml($aParams, $sCaption)
    {
        $aRows = [];
        foreach($aParams as $sName => $aParam) {
            switch($aParam['type']) {
                case 'enum':
                    $sAccepts = _t('_bx_analytics_txt_api_type_enum', implode(', ', $aParam['values']));
                    break;
                case 'enum_by':
                    $aLists = [];
                    foreach($aParam['values'] as $sBy => $aValues)
                        $aLists[] = $sBy . ': ' . implode(', ', $aValues);
                    $sAccepts = _t('_bx_analytics_txt_api_type_enum_by', $aParam['by'], implode('; ', $aLists));
                    break;
                case 'int':
                    $sAccepts = isset($aParam['max']) ? _t('_bx_analytics_txt_api_type_int_range', $aParam['min'], $aParam['max']) : _t('_bx_analytics_txt_api_type_int', $aParam['min']);
                    break;
                case 'date':
                    $sAccepts = _t('_bx_analytics_txt_api_type_date');
                    break;
                case 'dims':
                    $sAccepts = _t('_bx_analytics_txt_api_type_dims', implode(', ', $aParam['values']));
                    break;
                default:
                    $sAccepts = _t('_bx_analytics_txt_api_type_string');
            }
            if(isset($aParam['default']))
                $sAccepts .= ' ' . _t('_bx_analytics_txt_api_default', $aParam['default']);

            $aRows[] = [
                'param_name' => $this->_esc($sName),
                'param_accepts' => $this->_esc($sAccepts),
            ];
        }

        return $this->parseHtmlByName('api_params.html', [
            'caption' => $this->_esc($sCaption),
            'bx_if:params' => [
                'condition' => !empty($aRows),
                'content' => [
                    'caption' => $this->_esc($sCaption),
                    'col_param' => _t('_bx_analytics_txt_api_col_param'),
                    'col_accepts' => _t('_bx_analytics_txt_api_col_accepts'),
                    'bx_repeat:params' => $aRows,
                ],
            ],
            'bx_if:none' => [
                'condition' => empty($aRows),
                'content' => ['none' => _t('_bx_analytics_txt_api_no_params')],
            ],
        ]);
    }

    /**
     * Studio > Dashboards: site pages with analytics blocks, and a form for a new one.
     *
     * @param array $aData pages (see BxAnalyticsModule::getDashboards)
     */
    public function getStudioDashboards($aData)
    {
        $aPages = [];
        foreach($aData['pages'] as $aPage)
            $aPages[] = [
                'view_url' => $this->_esc($aPage['view_url']),
                'page_title' => $this->_esc($aPage['title']),
                'blocks' => $this->formatValue('number', $aPage['blocks']),
                'api_blocks' => $this->formatValue('number', $aPage['api_blocks']),
                'edit_url' => $this->_esc($aPage['edit_url']),
                'edit' => _t('_bx_analytics_txt_dash_edit'),
                'edit_label' => $this->_esc(_t('_bx_analytics_txt_dash_edit_label', $aPage['title'])),
            ];

        $this->_addToolsAssets();

        return $this->_getToolsJsInit() . $this->parseHtmlByName('studio_dashboards.html', [
            'intro' => _t('_bx_analytics_txt_dash_intro'),
            'bx_if:pages' => [
                'condition' => !empty($aPages),
                'content' => [
                    'caption' => $this->_esc(_t('_bx_analytics_txt_dash_pages')),
                    'col_page' => _t('_bx_analytics_txt_dash_col_page'),
                    'col_blocks' => _t('_bx_analytics_txt_dash_blocks'),
                    'col_neo' => _t('_bx_analytics_txt_dash_neo_blocks'),
                    'col_actions' => _t('_bx_analytics_txt_dash_col_actions'),
                    'bx_repeat:pages' => $aPages,
                ],
            ],
            'bx_if:empty' => [
                'condition' => empty($aPages),
                'content' => ['empty' => _t('_bx_analytics_txt_dash_empty')],
            ],
            'neo_note' => _t('_bx_analytics_txt_dash_neo_note'),
            'create_title' => _t('_bx_analytics_txt_dash_create'),
            'csrf' => $this->_esc((string)BxDolForm::getCsrfToken()),
            'label_title' => _t('_bx_analytics_txt_dash_title'),
            'create_hint' => _t('_bx_analytics_txt_dash_create_hint'),
            'disable_warning' => _t('_bx_analytics_txt_dash_disable_warning'),
            'create' => _t('_bx_analytics_txt_dash_create_btn'),
        ]);
    }

    /**
     * Studio > Setup: tracker status per platform, checks of the admin's own browser, what
     * each client needs, and custom events.
     *
     * @param array $aData status (see BxAnalyticsModule::getSetupStatus), tracking, injection,
     *      track_actions, alerts, api_enabled, api_key, api_origin
     */
    public function getStudioSetup($aData)
    {
        $sRoot = BX_DOL_URL_ROOT;
        $sCsrf = $this->_esc((string)BxDolForm::getCsrfToken());

        // what NEO and the apps need from the site
        $aNeoChecks = [
            ['on' => $aData['api_enabled'], 'text' => _t('_bx_analytics_txt_setup_neo_api')],
            ['on' => $aData['api_key'] || $aData['api_origin'], 'text' => _t('_bx_analytics_txt_setup_neo_access')],
        ];
        foreach([BX_ANALYTICS_PLATFORM_NEXT_WEB, BX_ANALYTICS_PLATFORM_RN_IOS, BX_ANALYTICS_PLATFORM_RN_ANDROID] as $sPlatform) {
            $aStatus = $aData['status'][$sPlatform];
            $aNeoChecks[] = [
                'on' => $aStatus['enabled'],
                'text' => _t($aStatus['enabled'] ? '_bx_analytics_txt_setup_platform_on' : '_bx_analytics_txt_setup_platform_off', _t($this->_oConfig->getPlatforms()[$sPlatform])),
            ];
        }

        $aChecks = [];
        foreach($aNeoChecks as $aCheck)
            $aChecks[] = [
                'check_state' => $aCheck['on'] ? 'yes' : 'no',
                'check_icon' => $this->_getIconHtml($aCheck['on'] ? 'check' : 'x'),
                'check_text' => $this->_esc($aCheck['text']),
            ];

        $aAlerts = [];
        foreach($aData['alerts'] as $sAlert)
            $aAlerts[] = ['alert' => $this->_esc($sAlert)];

        $sCurl = "curl -X POST '" . $sRoot . "api.php?r=" . $this->MODULE . "/collect' \\\n"
            . "  -H 'Authorization: Bearer YOUR_API_KEY' \\\n"
            . "  -H 'Content-Type: application/json' \\\n"
            . "  -d '{\"platform\": \"api\", \"app\": \"my-client\", \"app_version\": \"1.0.0\", \"hits\": [{\"type\": \"pageview\", \"url\": \"https://example.com/pricing\", \"title\": \"Pricing\"}, {\"type\": \"event\", \"name\": \"signup_click\", \"url\": \"https://example.com/pricing\", \"props\": {\"plan\": \"pro\"}}]}'";

        $this->_addToolsAssets();

        return $this->_getToolsJsInit() . $this->parseHtmlByName('studio_setup.html', [
            'bx_if:tracking_off' => [
                'condition' => !$aData['tracking'],
                'content' => [
                    'tracking_off' => _t('_bx_analytics_txt_setup_tracking_off'),
                    'settings_url' => $this->_esc(BX_DOL_URL_STUDIO . 'module.php?name=' . $this->MODULE . '&page=settings'),
                    'settings' => _t('_bx_analytics_txt_setup_open_settings'),
                ],
            ],
            'status_title' => _t('_bx_analytics_txt_setup_status'),
            'status' => $this->getSetupStatusHtml($aData['status']),
            'check_title' => _t('_bx_analytics_txt_setup_check_title'),
            'check_hint' => _t('_bx_analytics_txt_setup_check_hint'),
            'csrf' => $sCsrf,
            'check' => _t('_bx_analytics_txt_setup_check'),
            'test' => _t('_bx_analytics_txt_setup_test'),
            'test_warning' => _t('_bx_analytics_txt_setup_test_warning'),
            'install_title' => _t('_bx_analytics_txt_setup_install'),
            'core_web_title' => _t('_bx_analytics_platform_core_web'),
            'core_web_text' => _t('_bx_analytics_txt_setup_core_web'),
            'injection_state' => $aData['injection'] ? 'yes' : 'no',
            'injection_icon' => $this->_getIconHtml($aData['injection'] ? 'check' : 'x'),
            'injection' => _t($aData['injection'] ? '_bx_analytics_txt_setup_injection_on' : '_bx_analytics_txt_setup_injection_off'),
            'core_web_exclusions' => _t('_bx_analytics_txt_setup_core_web_exclusions'),
            'neo_title' => _t('_bx_analytics_txt_setup_neo_title'),
            'neo_text' => _t('_bx_analytics_txt_setup_neo'),
            'bx_repeat:neo_checks' => $aChecks,
            'api_title' => _t('_bx_analytics_platform_api'),
            'api_text' => _t('_bx_analytics_txt_setup_api'),
            'code_curl' => $this->_getCodeHtml('bx-analytics-setup-curl', _t('_bx_analytics_txt_setup_curl'), $sCurl),
            'core_title' => _t('_bx_analytics_platform_core'),
            'core_text' => _t('_bx_analytics_txt_setup_core'),
            'actions_state' => $aData['track_actions'] ? 'yes' : 'no',
            'actions_icon' => $this->_getIconHtml($aData['track_actions'] ? 'check' : 'x'),
            'actions' => _t($aData['track_actions'] ? '_bx_analytics_txt_setup_actions_on' : '_bx_analytics_txt_setup_actions_off'),
            'alerts_label' => _t('_bx_analytics_txt_setup_alerts'),
            'bx_repeat:alerts' => $aAlerts,
            'events_title' => _t('_bx_analytics_txt_setup_events'),
            'events_hint' => _t('_bx_analytics_txt_setup_events_hint'),
            'code_classic' => $this->_getCodeHtml('bx-analytics-setup-js', _t('_bx_analytics_txt_setup_events_classic'), "window.bx_analytics && bx_analytics.track('signup_click', {plan: 'pro'});"),
            'code_neo' => $this->_getCodeHtml('bx-analytics-setup-neo', _t('_bx_analytics_txt_setup_events_neo'), "import { trackEvent } from 'app/lib/analytics';\n\ntrackEvent('signup_click', { plan: 'pro' });"),
            'code_server' => $this->_getCodeHtml('bx-analytics-setup-srv', _t('_bx_analytics_txt_setup_events_server'), "bx_srv('" . $this->MODULE . "', 'track', ['export_done', ['rows' => 120]]);"),
            'events_warning' => _t('_bx_analytics_txt_setup_events_warning'),
        ]);
    }

    /**
     * The tracker status table, on the page and after a test event.
     */
    public function getSetupStatusHtml($aStatus)
    {
        $aPlatforms = $this->_oConfig->getPlatforms();

        $aRows = [];
        foreach($aStatus as $sPlatform => $aRow) {
            $bApp = $this->_oConfig->isAppPlatform($sPlatform);
            $aRows[] = [
                'platform_title' => _t($aPlatforms[$sPlatform]),
                'status' => $aRow['status'],
                'status_icon' => $this->_getIconHtml($aRow['status']),
                'status_title' => _t('_bx_analytics_txt_setup_status_' . $aRow['status']),
                'last' => $aRow['last'] ? $this->formatValue('datetime', $aRow['last']) : _t('_bx_analytics_txt_setup_never'),
                'hits' => $this->formatValue('number', $aRow['hits']),
                // the server's own hits keep no visits
                'visitors' => $sPlatform == BX_ANALYTICS_PLATFORM_CORE ? _t('_bx_analytics_txt_not_available') : $this->formatValue('number', $aRow['visitors']),
                'sessions' => $sPlatform == BX_ANALYTICS_PLATFORM_CORE ? _t('_bx_analytics_txt_not_available') : $this->formatValue('number', $aRow['sessions']),
                'version' => $bApp && $aRow['app_version'] !== '' ? $this->_esc($aRow['app_version']) : ($bApp ? _t('_bx_analytics_txt_setup_none') : _t('_bx_analytics_txt_not_available')),
            ];
        }

        return $this->parseHtmlByName('setup_status.html', [
            'caption' => $this->_esc(_t('_bx_analytics_txt_setup_status')),
            'col_platform' => _t('_bx_analytics_txt_platform'),
            'col_status' => _t('_bx_analytics_txt_setup_col_status'),
            'col_last' => _t('_bx_analytics_txt_setup_last_hit'),
            'col_hits' => _t('_bx_analytics_txt_setup_hits_24h'),
            'col_visitors' => _t('_bx_analytics_txt_setup_visitors_24h'),
            'col_sessions' => _t('_bx_analytics_txt_setup_sessions_7d'),
            'col_version' => _t('_bx_analytics_txt_setup_app_version'),
            'bx_repeat:rows' => $aRows,
        ]);
    }

    /**
     * The result of "Check this browser": tracked or not and why, and what the server sees.
     *
     * @param array $aCheck see BxAnalyticsCollector::check
     */
    public function getSetupCheckHtml($aCheck)
    {
        $bTracked = $aCheck['reasons'] == ['ok'];

        $aReasons = [];
        foreach($aCheck['reasons'] as $sReason)
            if($sReason != 'ok')
                $aReasons[] = [
                    'reason_kind' => 'no',
                    'reason_icon' => $this->_getIconHtml('x'),
                    'reason' => _t('_bx_analytics_txt_check_' . $sReason),
                ];
        foreach($aCheck['notes'] as $sNote)
            $aReasons[] = [
                'reason_kind' => 'note',
                'reason_icon' => $this->_getIconHtml('info'),
                'reason' => _t('_bx_analytics_txt_check_' . $sNote),
            ];

        $sGeo = _t('_bx_analytics_txt_check_geo_none');
        if($aCheck['geo_source'] == BX_ANALYTICS_GEO_NONE)
            $sGeo = _t('_bx_analytics_txt_check_geo_off');
        elseif($aCheck['country_header'] !== '')
            $sGeo = _t('_bx_analytics_txt_check_geo_header', $this->_esc(str_replace('_', '-', preg_replace('/^HTTP_/', '', $aCheck['country_header']))), $this->_esc($aCheck['country']));

        return $this->parseHtmlByName('setup_check.html', [
            'verdict_state' => $bTracked ? 'yes' : 'no',
            'verdict_icon' => $this->_getIconHtml($bTracked ? 'check' : 'x'),
            'verdict' => _t($bTracked ? '_bx_analytics_txt_check_tracked' : '_bx_analytics_txt_check_not_tracked'),
            'bx_if:reasons' => [
                'condition' => !empty($aReasons),
                'content' => ['bx_repeat:reasons' => $aReasons],
            ],
            'ip_label' => _t('_bx_analytics_txt_check_ip'),
            'ip' => $aCheck['ip'] !== '' ? $this->_esc($aCheck['ip']) : _t('_bx_analytics_txt_not_available'),
            'remote_label' => _t('_bx_analytics_txt_check_remote_addr'),
            'remote' => $aCheck['remote_addr'] !== '' ? $this->_esc($aCheck['remote_addr']) : _t('_bx_analytics_txt_not_available'),
            'geo_label' => _t('_bx_analytics_txt_check_geo'),
            'geo' => $sGeo,
            'identity_label' => _t('_bx_analytics_adm_stg_cpt_identity'),
            'identity' => _t('_bx_analytics_identity_' . $aCheck['identity']),
        ]);
    }

    /**
     * A code snippet with a copy button. The code is text: it is escaped here.
     */
    protected function _getCodeHtml($sId, $sLabel, $sCode)
    {
        return $this->parseHtmlByName('code.html', [
            'code_id' => $sId,
            'code_label' => $this->_esc($sLabel),
            'code' => $this->_esc($sCode),
            'copy' => _t('_bx_analytics_txt_copy'),
            'copied' => $this->_esc(_t('_bx_analytics_txt_copied')),
        ]);
    }

    /**
     * A small Lucide icon next to a status text, hidden from screen readers.
     *
     * @param string $sName receiving, quiet, nodata, off, check, x, info
     */
    protected function _getIconHtml($sName)
    {
        $aIcons = ['receiving' => 'check', 'quiet' => 'clock', 'nodata' => 'minus', 'off' => 'power', 'check' => 'check', 'x' => 'x', 'info' => 'info'];
        $sIcon = isset($aIcons[$sName]) ? $aIcons[$sName] : 'info';

        $aVars = [];
        foreach(array_unique(array_values($aIcons)) as $sGlyph)
            $aVars['bx_if:' . $sGlyph] = ['condition' => $sGlyph == $sIcon, 'content' => []];

        return $this->parseHtmlByName('icon.html', $aVars);
    }

    protected function _addToolsAssets()
    {
        $this->_addAssets(['studio_tools.js'], ['dashboard.css']);
    }

    protected function _getToolsJsInit()
    {
        return $this->getJsCode('tools', [
            'aStrings' => [
                'error' => _t('_bx_analytics_txt_error_loading'),
                'running' => _t('_bx_analytics_txt_api_running'),
                'meta' => _t('_bx_analytics_txt_api_meta', '{status}', '{ms}', '{size}'),
                'truncated' => _t('_bx_analytics_txt_api_truncated'),
                'bad_json' => _t('_bx_analytics_txt_api_bad_params'),
            ],
        ], [
            'mask' => "if(typeof window.{object} == 'undefined') window.{object} = new {class}({params});",
            'wrap' => true,
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
