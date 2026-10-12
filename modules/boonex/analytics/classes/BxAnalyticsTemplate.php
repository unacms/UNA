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
            'src' => BX_DOL_URL_MODULES . 'boonex/analytics/js/tracker.js?v=' . (int)getParam('sys_revision'),
            'endpoint' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'collect',
            'platform' => BX_ANALYTICS_PLATFORM_CORE_WEB,
            'identity' => $this->_oConfig->getIdentityMode(),
            'dnt' => $this->_oConfig->isRespectDnt() ? 1 : 0,
        ]);
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

            case 'pages_per_session':
            case 'decimal':
                return number_format((float)$mixedValue, 1);

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

    /**
     * Key figures that are not chart switches: title, value and an optional note or change.
     */
    protected function _getTilesHtml($aTiles)
    {
        $aItems = [];
        foreach($aTiles as $aTile)
            $aItems[] = [
                'title' => $aTile['title'],
                'value' => $this->formatValue(isset($aTile['type']) ? $aTile['type'] : 'number', $aTile['value']),
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
                            'value' => !$bLabel ? $this->formatValue($aColumn['type'], isset($aRow['values'][$sKey]) ? $aRow['values'][$sKey] : null) : '',
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
            'bx_if:filter' => [
                'condition' => $bFilter,
                'content' => [
                    'dimension' => $bFilter ? $aRow['filter']['dim'] : '',
                    'value' => $bFilter ? $this->_esc($aRow['filter']['value']) : '',
                    'title' => $this->_esc(_t('_bx_analytics_txt_filter_by', $aRow['label'])),
                    'label' => $sLabel,
                ],
            ],
            'bx_if:link' => [
                'condition' => $bLink,
                'content' => [
                    'href' => $bLink ? $this->_esc($aRow['link']) : '',
                    'label' => $sLabel,
                ],
            ],
            'bx_if:open' => [
                'condition' => $bOpen,
                'content' => [
                    'param' => $bOpen ? $aRow['open']['param'] : '',
                    'value' => $bOpen ? $this->_esc($aRow['open']['value']) : '',
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
        if(in_array($sMetric, ['bounce_rate', 'errors'], true))
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
