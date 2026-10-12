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

    protected $_aMetrics = ['visitors', 'sessions', 'pageviews', 'pages_per_session', 'bounce_rate', 'duration'];

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
     * KPIs with the change against the previous period, and the series for the chart.
     */
    public function getOverview(BxAnalyticsFilter $oFilter)
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
     */
    public function getTop(BxAnalyticsFilter $oFilter, $sGroup, $sTab, $iLimit = 10)
    {
        if(!isset($this->_aGroups[$sGroup]))
            return [];

        if(!isset($this->_aGroups[$sGroup][$sTab]))
            $sTab = key($this->_aGroups[$sGroup]);

        $sDimension = $this->_aGroups[$sGroup][$sTab];
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

        $aTabs = [];
        foreach($this->_aGroups[$sGroup] as $sName => $sDim)
            $aTabs[] = ['name' => $sName, 'title' => _t('_bx_analytics_tab_' . $sName), 'active' => $sName == $sTab];

        return [
            'group' => $sGroup,
            'tab' => $sTab,
            'tabs' => $aTabs,
            'dimension' => $sDimension,
            'column' => _t('_bx_analytics_tab_' . $sTab),
            'items' => $aItems,
            'filterable' => $this->_oDb->isDimension($sDimension),
        ];
    }

    /**
     * Visitors online now, per platform, and the latest pageviews.
     */
    public function getRealtime($sPlatform = '', $iLimit = 10)
    {
        $iSince = time() - $this->_oConfig->getOnlineWindow();

        $aOnline = $this->_oDb->getOnline($iSince);
        $aPlatforms = [];
        $iTotal = 0;
        foreach($this->_oConfig->getPlatforms() as $sCode => $sTitle) {
            $iCount = isset($aOnline[$sCode]) ? (int)$aOnline[$sCode] : 0;
            $iTotal += $iCount;
            if($iCount)
                $aPlatforms[] = ['value' => $sCode, 'label' => _t($sTitle), 'visitors' => $iCount];
        }

        $aRecent = [];
        $aRows = $iLimit > 0 ? $this->_oDb->getRecentPageviews(time() - 30 * 60, $iLimit, $sPlatform) : [];
        foreach($aRows as $aRow)
            $aRecent[] = [
                'ts' => (int)$aRow['ts'],
                'platform' => $this->getLabel('platform', $aRow['platform']),
                'path' => $aRow['path'],
                'title' => $aRow['title'],
                'country' => $aRow['country'],
                'country_label' => $this->getLabel('country', $aRow['country']),
                'device' => $this->getLabel('device', $aRow['device']),
                'member' => (int)$aRow['profile_id'] > 0,
            ];

        return [
            'online' => $sPlatform !== '' ? (isset($aOnline[$sPlatform]) ? (int)$aOnline[$sPlatform] : 0) : $iTotal,
            'platforms' => $aPlatforms,
            'recent' => $aRecent,
            'window' => (int)($this->_oConfig->getOnlineWindow() / 60),
        ];
    }

    /**
     * A human name for a stored dimension value.
     */
    public function getLabel($sDimension, $sValue)
    {
        if($sValue === '')
            return _t('_bx_analytics_txt_unknown');

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
