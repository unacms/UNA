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
     * Filters, key figures and the main chart.
     */
    public function getBlockOverview($aOverview, $aRealtime, $oFilter)
    {
        $this->_addDashboardAssets();

        return $this->_getJsInit() . $this->_getOverviewHtml($aOverview, $aRealtime, $oFilter);
    }

    /**
     * A tabbed top list.
     */
    public function getBlockTop($aTop, $oFilter)
    {
        $this->_addDashboardAssets();

        return $this->_getJsInit() . $this->_getTopHtml($aTop, $oFilter);
    }

    /**
     * Block HTML for a report reloaded by the dashboard script.
     */
    public function getReportHtml($sReport, $aData, $oFilter)
    {
        switch($sReport) {
            case 'overview':
                return $this->_getOverviewHtml($aData, $this->getModule()->getReports()->getRealtime($oFilter->get()['platform'], 0), $oFilter);

            case 'top':
                return $this->_getTopHtml($aData, $oFilter);
        }

        return '';
    }

    /**
     * The Overview tab in Studio: the overview block, then the top lists in a grid.
     */
    public function getStudioOverview($sOverview, $aCards)
    {
        return $this->parseHtmlByName('studio_overview.html', [
            'overview' => $sOverview,
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
                'value' => $this->_formatMetric($sMetric, $aKpi['value']),
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
            'online' => $this->_formatNumber($aRealtime['online']),
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

    protected function _getOverviewHtml($aOverview, $aRealtime, $oFilter)
    {
        $aFilter = $oFilter->get();
        $sMetric = bx_get('metric');
        if(!in_array($sMetric, $this->getModule()->getReports()->getMetrics(), true))
            $sMetric = 'visitors';

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

        $oReports = $this->getModule()->getReports();
        $aChips = [];
        foreach($aFilter['dims'] as $sName => $sValue)
            $aChips[] = [
                'name' => $sName,
                'title' => _t('_bx_analytics_dim_' . $sName),
                'value' => $this->_esc($oReports->getLabel($sName, $sValue)),
                'remove' => $this->_esc(_t('_bx_analytics_txt_remove_filter', _t('_bx_analytics_dim_' . $sName))),
            ];

        $aKpis = [];
        foreach($aOverview['kpis'] as $sName => $aKpi)
            $aKpis[] = [
                'metric' => $sName,
                'pressed' => $sName == $sMetric ? 'true' : 'false',
                'title' => _t('_bx_analytics_metric_' . $sName),
                'value' => $this->_formatMetric($sName, $aKpi['value']),
                'change' => $this->_formatChange($aKpi['change']),
                'change_title' => $this->_esc(_t('_bx_analytics_txt_previous_period', $this->_formatMetric($sName, $aKpi['previous']))),
                'trend' => $this->_trend($sName, $aKpi['change']),
            ];

        $aChart = [
            'metric' => $sMetric,
            'bucket' => $aOverview['bucket'],
            'tz' => $aOverview['tz'],
            'series' => $aOverview['series'],
            'titles' => array_combine($oReports->getMetrics(), array_map(function($s) { return _t('_bx_analytics_metric_' . $s); }, $oReports->getMetrics())),
        ];

        return $this->parseHtmlByName('overview.html', [
            'range_label' => _t('_bx_analytics_txt_range'),
            'bx_repeat:ranges' => $aRanges,
            'platform_label' => _t('_bx_analytics_txt_platform'),
            'bx_repeat:platforms' => $aPlatforms,
            'bx_if:chips' => [
                'condition' => !empty($aChips),
                'content' => ['bx_repeat:chips' => $aChips],
            ],
            'online' => $this->_formatNumber($aRealtime['online']),
            'online_title' => _t('_bx_analytics_txt_online_now', $aRealtime['window']),
            'kpis_label' => _t('_bx_analytics_txt_key_figures'),
            'bx_repeat:kpis' => $aKpis,
            'chart_label' => $this->_esc(_t('_bx_analytics_txt_chart_label')),
            'chart_json' => $this->_json($aChart),
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
                'label_attr' => $this->_esc($aItem['label']),
                'visitors' => $this->_formatNumber($aItem['visitors']),
                'share' => $aItem['share'],
                'bar' => $aItem['bar'],
                'filter_title' => $this->_esc(_t('_bx_analytics_txt_filter_by', $aItem['label'])),
            ];

        $aTabs = [];
        foreach($aTop['tabs'] as $aTab)
            $aTabs[] = [
                'group' => $aTop['group'],
                'name' => $aTab['name'],
                'title' => $aTab['title'],
                'selected' => $aTab['active'] ? 'true' : 'false',
                'tabindex' => $aTab['active'] ? '0' : '-1',
            ];

        return $this->parseHtmlByName('top.html', [
            'group' => $aTop['group'],
            'tabs_label' => $this->_esc(_t('_bx_analytics_group_' . $aTop['group'])),
            'bx_repeat:tabs' => $aTabs,
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

    /**
     * Creates the dashboard script object once per page, whatever block comes first.
     */
    protected function _getJsInit()
    {
        $sObject = $this->_oConfig->getJsObject('dashboard');

        return $this->getJsCode('dashboard', [
            'sActionUrl' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri(),
            'aStrings' => [
                'duration_m' => _t('_bx_analytics_txt_duration_m'),
                'duration_s' => _t('_bx_analytics_txt_duration_s'),
                'error' => _t('_bx_analytics_txt_error_loading'),
            ],
        ], [
            'mask' => "if(typeof window.{object} == 'undefined') window.{object} = new {class}({params});",
            'wrap' => true,
        ]);
    }

    protected function _addDashboardAssets()
    {
        $this->_addAssets(['chart.umd.min.js', 'dashboard.js'], ['dashboard.css']);
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

    protected function _formatMetric($sMetric, $mixedValue)
    {
        switch($sMetric) {
            case 'bounce_rate':
                return round($mixedValue) . '%';

            case 'pages_per_session':
                return number_format((float)$mixedValue, 1);

            case 'duration':
                $iSeconds = (int)$mixedValue;
                if($iSeconds < 60)
                    return $iSeconds . _t('_bx_analytics_txt_duration_s');
                return intdiv($iSeconds, 60) . _t('_bx_analytics_txt_duration_m') . ' ' . ($iSeconds % 60) . _t('_bx_analytics_txt_duration_s');
        }

        return $this->_formatNumber($mixedValue);
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
     * up, down or flat, where down is good for bounce rate.
     */
    protected function _trend($sMetric, $mixedChange)
    {
        if($mixedChange === null || $mixedChange == 0)
            return 'flat';

        $bUp = $mixedChange > 0;
        if($sMetric == 'bounce_rate')
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
