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
 * Analytics module
 */     
define('BX_ANALYTICS_SYSTEM', 'system');
define('BX_ANALYTICS_TOP_BY_LIKES', 'top_by_likes');
define('BX_ANALYTICS_TOP_BY_VIEWS', 'top_by_views');
define('BX_ANALYTICS_CONTENT_TOTAL', 'content_total');
define('BX_ANALYTICS_CONTENT_SPEED', 'content_speed');
define('BX_ANALYTICS_MOST_FOLLOWED_PROFILES', 'top_by_followers');
define('BX_ANALYTICS_MOST_ACTIVE_PROFILES', 'top_by_activity');
class BxAnalyticsModule extends BxDolModule
{
    protected $aColors = array('#3366CC', '#DC3912', '#FF9900', '#109618', '#990099');

    protected $_oReports = null;

    /**
     * Reports that blocks, Studio and the API may ask for; each is a BxAnalyticsReports method.
     */
    protected $_aReports = ['filters', 'overview', 'top', 'table', 'realtime', 'map', 'bots', 'sessions', 'users', 'events', 'journeys', 'retention', 'goals', 'funnels'];

    /**
     * Reports that show members by name.
     */
    protected $_aPeopleReports = ['sessions', 'users'];

    /**
     * Studio sections: page => list of [report, block params, spans all columns].
     */
    protected $_aStudioSections = [
        'overview' => [['filters', [], true], ['overview', [], true], ['top', ['group' => 'pages']], ['top', ['group' => 'sources']], ['top', ['group' => 'locations']], ['top', ['group' => 'devices']], ['top', ['group' => 'platforms']]],
        'realtime' => [['realtime', [], true]],
        'pages' => [['filters', [], true], ['table', ['table' => 'pages'], true]],
        'sources' => [['filters', [], true], ['table', ['table' => 'sources'], true]],
        'audience' => [['filters', [], true], ['top', ['group' => 'locations']], ['top', ['group' => 'devices']], ['top', ['group' => 'platforms']]],
        'map' => [['filters', [], true], ['map', [], true]],
        'bots' => [['filters', [], true], ['bots', [], true]],
        'sessions' => [['filters', [], true], ['sessions', [], true]],
        'users' => [['filters', [], true], ['users', [], true]],
        'events' => [['filters', [], true], ['events', [], true]],
        'journeys' => [['filters', [], true], ['journeys', [], true]],
        'retention' => [['filters', [], true], ['retention', [], true]],
        'goals' => [['filters', [], true], ['goals', [], true]],
        'funnels' => [['filters', [], true], ['funnels', [], true]],
    ];
          
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }
          
    /**
    * Service methods
    */
          
    /**
    * @page service Service Calls
    * @section bx_analytics Analytics
    * @subsection bx_analytics-other Other
    * @subsubsection bx_analytics get_canvas
    * 
    * @code bx_srv('bx_analytics', 'get_canvas', [...]); @endcode
    * 
    * Get canvas  
    * 
    * @return an html. 
    * 
    * @see BxAnalyticsModule::serviceGetCanvas
    */
    /** 
    * @ref bx_analytics-get_canvas "get_canvas"
    */
    public function serviceGetCanvas()
    {
        if(bx_is_api() || $this->checkAllowed() !== CHECK_ACTION_RESULT_ALLOWED)
            return bx_is_api() ? [] : '';

        return $this->_oTemplate->getCanvas();
    }
	
	/**
    * @page service Service Calls
    * @section bx_analytics Analytics
    * @subsection bx_analytics-other Other
    * @subsubsection bx_analytics is_avaliable
    * 
    * @code bx_srv('bx_analytics', 'is_avaliable', [...]); @endcode
    * 
    * Check avalability for current profile  
    * 
    * @return boolean. 
    * 
    * @see BxAnalyticsModule::serviceIsAvaliable
    */
    /** 
    * @ref bx_analytics-is_avaliable "is_avaliable"
    */
	public function serviceIsAvaliable()
    {
		return $this->checkAllowed() === CHECK_ACTION_RESULT_ALLOWED ? true : false;
    }
	
          
    /**
    * @page service Service Calls
    * @section bx_analytics Analytics
    * @subsection bx_analytics-other Other
    * @subsubsection bx_analytics get_modules
    * 
    * @code bx_srv('bx_analytics', 'get_modules', [...]); @endcode
    * 
    * Get modules list  
    * 
    * @return an html. 
    * 
    * @see BxAnalyticsModule::serviceGetModules
    */
    /** 
    * @ref bx_analytics-get_modules "get_modules"
    */
    public function serviceGetModules()
    {
        $aResult = array();
        $aResult[BX_ANALYTICS_SYSTEM] = _t('_bx_analytics_system_text');
        $BxDolModuleQuery = BxDolModuleQuery::getInstance();
        $aModules = $BxDolModuleQuery->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule){
            $oModule = BxDolModule::getInstance($aModule['name']);
            if($oModule instanceof iBxDolContentInfoService){
                $aResult[$aModule['name']] = $aModule['title'];
            }
        }
        
        /**
         * @hooks
         * @hookdef hook-bx_analytics-get_modules 'bx_analytics', 'get_modules' - hook on get modules list with avalaible analytics
         * - $unit_name - equals `get_modules`
         * - $action - equals `get_modules` 
         * - $object_id - not used
         * - $sender_id -not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `list` - [array] by ref, array of modules for analytics as [module_name] = module_title, can be overridden in hook processing
         * @hook @ref hook-bx_analytics-get_modules
         */
        bx_alert($this->_aModule['name'], 'get_modules', 0, 0, array(
            'list' => &$aResult,
            'list_ref' => &$aResult,
        ));
        
        return $aResult;
    }
          
    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'GetReport' => '',
            'GetTrackerConfig' => '',
        ]);
    }

    public function serviceGetPublicServices()
    {
        return array_merge(parent::serviceGetPublicServices(), [
            'Collect' => '',
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-tracking Tracking
     * @subsubsection bx_analytics-collect collect
     *
     * @code bx_srv('bx_analytics', 'collect', [$aPayload]); @endcode
     * @code api.php?r=bx_analytics/collect with the JSON payload as the request body @endcode
     *
     * Store pageviews and events sent by NEO, the apps or another API client.
     * The payload is described in BxAnalyticsCollector. Over the API the payload is read from
     * the request body when no parameter is given.
     *
     * @param $mixedPayload payload array or JSON string
     * @return array with `stored` - the number of hits stored
     *
     * @see BxAnalyticsModule::serviceCollect
     */
    /**
     * @ref bx_analytics-collect "collect"
     */
    public function serviceCollect($mixedPayload = '')
    {
        if(empty($mixedPayload))
            $mixedPayload = file_get_contents('php://input');

        $aPayload = is_array($mixedPayload) ? $mixedPayload : json_decode((string)$mixedPayload, true);
        if(!is_array($aPayload))
            return ['stored' => 0];

        $iStored = $this->getCollector()->collect($aPayload, [
            'platform' => BX_ANALYTICS_PLATFORM_API,
            'trusted' => $this->_isApiKeyRequest(),
            'profile_id' => bx_get_logged_profile_id(),
        ]);

        return ['stored' => $iStored];
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-tracking Tracking
     * @subsubsection bx_analytics-get_tracker_config get_tracker_config
     *
     * @code bx_srv('bx_analytics', 'get_tracker_config', ['rn-ios']); @endcode
     * @code api.php?r=bx_analytics/get_tracker_config&params[]=next-web @endcode
     *
     * Tracker settings for NEO and the apps, read once when the client starts:
     * whether to send hits at all, whether to keep a visitor id (persistent identity mode),
     * whether to honour Do Not Track, and the session timeout.
     *
     * @param $sPlatform client platform code (next-web, rn-ios, rn-android, api); when empty,
     *      the platform of the request
     * @return array with `enabled`, `persistent`, `respect_dnt` (booleans) and
     *      `session_timeout` (seconds)
     *
     * @see BxAnalyticsModule::serviceGetTrackerConfig
     */
    /**
     * @ref bx_analytics-get_tracker_config "get_tracker_config"
     */
    public function serviceGetTrackerConfig($sPlatform = '')
    {
        if(!is_string($sPlatform) || $sPlatform === '') {
            bx_import('Request', $this->_aModule);
            $oRequest = new BxAnalyticsRequest();
            $sPlatform = $oRequest->getPlatform(defined('BX_API'), $this->_isApiKeyRequest());
        }

        // `core` is the server's own platform, never a client's
        $bEnabled = $this->_oConfig->isTrackingEnabled() && $sPlatform != BX_ANALYTICS_PLATFORM_CORE && $this->_oConfig->isPlatformEnabled($sPlatform);

        return [
            'enabled' => $bEnabled,
            'persistent' => $bEnabled && $this->_oConfig->getIdentityMode() == BX_ANALYTICS_IDENTITY_PERSISTENT,
            'respect_dnt' => $this->_oConfig->isRespectDnt(),
            'session_timeout' => $this->_oConfig->getSessionTimeout(),
        ];
    }

    /**
     * Hits from the classic tracker: same origin, a JSON body sent with sendBeacon.
     */
    public function actionCollect()
    {
        $aPayload = json_decode((string)file_get_contents('php://input'), true);
        if(is_array($aPayload))
            $this->getCollector()->collect($aPayload, [
                'platform' => BX_ANALYTICS_PLATFORM_CORE_WEB,
                'same_origin' => true,
                'profile_id' => bx_get_logged_profile_id(),
            ]);

        header('HTTP/1.1 204 No Content');
        header('Cache-Control: no-store');
        exit;
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-tracking Tracking
     * @subsubsection bx_analytics-get_tracker_code get_tracker_code
     *
     * @code bx_srv('bx_analytics', 'get_tracker_code', [...]); @endcode
     *
     * The classic UI tracker, injected at the end of every page.
     *
     * @return HTML string, empty when tracking is off for the classic UI or for the viewer
     *
     * @see BxAnalyticsModule::serviceGetTrackerCode
     */
    /**
     * @ref bx_analytics-get_tracker_code "get_tracker_code"
     */
    public function serviceGetTrackerCode()
    {
        if(!$this->_oConfig->isTrackingEnabled() || !$this->_oConfig->isPlatformEnabled(BX_ANALYTICS_PLATFORM_CORE_WEB))
            return '';

        // bots don't run the tracker: the page counts them as it renders
        bx_import('UserAgent', $this->_aModule);
        $sUserAgent = isset($_SERVER['HTTP_USER_AGENT']) ? (string)$_SERVER['HTTP_USER_AGENT'] : '';
        if(BxAnalyticsUserAgent::isBot($sUserAgent)) {
            $this->getCollector()->collectBot($sUserAgent, isset($_SERVER['REQUEST_URI']) ? (string)$_SERVER['REQUEST_URI'] : '');
            return '';
        }

        $aLevels = $this->_oConfig->getExcludedLevels();
        if(!empty($aLevels)) {
            $iProfileId = bx_get_logged_profile_id();
            $aMembership = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId ? $iProfileId : 0);
            if(!empty($aMembership['id']) && in_array((int)$aMembership['id'], $aLevels, true))
                return '';
        }

        return $this->_oTemplate->getTrackerCode();
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-reports Reports
     * @subsubsection bx_analytics-get_report get_report
     *
     * @code bx_srv('bx_analytics', 'get_report', ['overview', ['range' => '30d', 'platform' => 'rn-ios']]); @endcode
     * @code api.php?r=bx_analytics/get_report&params[]=top&params[]={"group":"pages","tab":"entry","range":"7d"} @endcode
     *
     * Report data for NEO and other clients. Reports: filters, overview, top, table, realtime
     * and the other sections listed in BxAnalyticsModule::$_aReports.
     *
     * @param $sReport report name
     * @param $mixedParams filter parameters (see BxAnalyticsFilter) and the report's own
     *      (group, table, tab, page, limit...); an array or a JSON string
     * @return array report data, or an error array when the viewer may not use analytics
     *
     * @see BxAnalyticsModule::serviceGetReport
     */
    /**
     * @ref bx_analytics-get_report "get_report"
     */
    public function serviceGetReport($sReport, $mixedParams = [])
    {
        if(!$this->serviceIsAvaliable())
            return ['error' => _t('_sys_txt_access_denied'), 'code' => 403];

        $aParams = is_array($mixedParams) ? $mixedParams : json_decode((string)$mixedParams, true);
        if(!is_array($aParams))
            $aParams = [];

        $aData = $this->getReportData($sReport, $aParams);
        if($aData === false)
            return ['error' => _t('_sys_request_page_not_found_cpt'), 'code' => 404];

        return $aData;
    }

    /**
     * A report block reloaded by the dashboard script: data plus rendered HTML. The block's
     * own parameters (group, table...) come as JSON in `bp`, the filters as the page's URL
     * parameters.
     */
    public function actionReport($sReport = '')
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        if(!$this->serviceIsAvaliable()) {
            http_response_code(403);
            echo json_encode(['error' => _t('_sys_txt_access_denied')]);
            exit;
        }

        $aBlockParams = json_decode((string)bx_get('bp'), true);
        if(!is_array($aBlockParams))
            $aBlockParams = [];

        $aParams = array_merge($_GET, $aBlockParams);
        unset($aParams['bp']);

        $aData = $this->getReportData($sReport, $aParams);
        if($aData === false) {
            http_response_code(404);
            echo json_encode(['error' => _t('_sys_request_page_not_found_cpt')]);
            exit;
        }

        echo json_encode([
            'data' => $aData,
            'html' => $this->_oTemplate->getReportHtml($sReport, $aData, $this->getFilter($aParams), $aBlockParams),
        ]);
        exit;
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-blocks Blocks
     * @subsubsection bx_analytics-get_block_filters get_block_filters
     *
     * @code bx_srv('bx_analytics', 'get_block_filters'); @endcode
     *
     * The filter bar: period, platform, active filters and visitors online. It keeps the
     * filters in the page URL, and every analytics block on the page follows them.
     *
     * @return HTML string, or a block description for the API; empty for viewers without access
     *
     * @see BxAnalyticsModule::serviceGetBlockFilters
     */
    /**
     * @ref bx_analytics-get_block_filters "get_block_filters"
     */
    public function serviceGetBlockFilters()
    {
        return $this->_getBlock('filters');
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-blocks Blocks
     * @subsubsection bx_analytics-get_block_overview get_block_overview
     *
     * @code bx_srv('bx_analytics', 'get_block_overview'); @endcode
     *
     * Key figures with the change against the previous period, and the main chart.
     *
     * @return HTML string, or a block description for the API; empty for viewers without access
     *
     * @see BxAnalyticsModule::serviceGetBlockOverview
     */
    /**
     * @ref bx_analytics-get_block_overview "get_block_overview"
     */
    public function serviceGetBlockOverview()
    {
        return $this->_getBlock('overview');
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-blocks Blocks
     * @subsubsection bx_analytics-get_block_top get_block_top
     *
     * @code bx_srv('bx_analytics', 'get_block_top', ['sources']); @endcode
     *
     * A tabbed top list: pages, sources, locations, devices or platforms.
     *
     * @param $sGroup list group
     * @return HTML string, or a block description for the API; empty for viewers without access
     *
     * @see BxAnalyticsModule::serviceGetBlockTop
     */
    /**
     * @ref bx_analytics-get_block_top "get_block_top"
     */
    public function serviceGetBlockTop($sGroup = 'pages')
    {
        return $this->_getBlock('top', ['group' => $sGroup]);
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-blocks Blocks
     * @subsubsection bx_analytics-get_block_table get_block_table
     *
     * @code bx_srv('bx_analytics', 'get_block_table', ['pages']); @endcode
     *
     * A full table with every metric, a page at a time: pages or sources.
     *
     * @param $sTable table name
     * @return HTML string, or a block description for the API; empty for viewers without access
     *
     * @see BxAnalyticsModule::serviceGetBlockTable
     */
    /**
     * @ref bx_analytics-get_block_table "get_block_table"
     */
    public function serviceGetBlockTable($sTable = 'pages')
    {
        return $this->_getBlock('table', ['table' => $sTable]);
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-blocks Blocks
     * @subsubsection bx_analytics-get_block_report get_block_report
     *
     * @code bx_srv('bx_analytics', 'get_block_report', ['realtime']); @endcode
     *
     * Any other report as a block: realtime, map, bots, sessions, users, events, goals,
     * funnels, journeys, retention, revenue, subscriptions, sales, credits, errors,
     * performance, query.
     *
     * @param $sReport report name
     * @param $aParams the report's own parameters
     * @return HTML string, or a block description for the API; empty for viewers without access
     *
     * @see BxAnalyticsModule::serviceGetBlockReport
     */
    /**
     * @ref bx_analytics-get_block_report "get_block_report"
     */
    public function serviceGetBlockReport($sReport, $aParams = [])
    {
        return $this->_getBlock($sReport, is_array($aParams) ? $aParams : []);
    }

    /**
     * A Studio section: the filter bar (where the section uses it) and the section's blocks.
     */
    public function getStudioSection($sSection)
    {
        if(!isset($this->_aStudioSections[$sSection]))
            return '';

        // one report under the filter bar needs no heading: the section title names it
        $iReports = 0;
        foreach($this->_aStudioSections[$sSection] as $aBlock)
            if($aBlock[0] != 'filters')
                $iReports++;

        $aBlocks = [];
        foreach($this->_aStudioSections[$sSection] as $aBlock) {
            list($sReport, $aParams, $bWide) = array_pad($aBlock, 3, false);

            $sTitle = '';
            if($iReports > 1 && $sReport == 'top')
                $sTitle = _t('_bx_analytics_group_' . $aParams['group']);
            elseif($iReports > 1 && !in_array($sReport, ['filters', 'overview', 'table'], true))
                $sTitle = _t('_bx_analytics_report_' . (isset($aParams['title']) ? $aParams['title'] : $sReport));

            $aBlocks[] = [
                'title' => $sTitle,
                'content' => $this->_getBlock($sReport, $aParams ? $aParams : []),
                'wide' => (bool)$bWide,
            ];
        }

        return $this->_oTemplate->getStudioSection($aBlocks);
    }

    /**
     * A report as a page block: a description NEO renders from for the API, HTML otherwise.
     */
    protected function _getBlock($sReport, $aBlockParams = [])
    {
        if(!$this->serviceIsAvaliable() || !in_array($sReport, $this->_aReports, true))
            return bx_is_api() ? [] : '';

        if(in_array($sReport, $this->_aPeopleReports, true) && $this->checkAllowedPeople() !== CHECK_ACTION_RESULT_ALLOWED)
            return bx_is_api() ? [] : '';

        if(bx_is_api())
            return [bx_api_get_block('analytics_' . $sReport, $this->_getApiBlockData($sReport, $aBlockParams))];

        $aParams = array_merge($_GET, $aBlockParams);
        $aData = $this->getReportData($sReport, $aParams);
        if($aData === false)
            return '';

        return $this->_oTemplate->getBlock($sReport, $aData, $this->getFilter($aParams), $aBlockParams);
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-blocks Blocks
     * @subsubsection bx_analytics-get_studio_dashboard_traffic get_studio_dashboard_traffic
     *
     * @code bx_srv('bx_analytics', 'get_studio_dashboard_traffic'); @endcode
     *
     * Traffic block of the Studio dashboard: visitors online on every platform and the last 7 days.
     *
     * @return array with `content` for the Studio dashboard
     *
     * @see BxAnalyticsModule::serviceGetStudioDashboardTraffic
     */
    /**
     * @ref bx_analytics-get_studio_dashboard_traffic "get_studio_dashboard_traffic"
     */
    public function serviceGetStudioDashboardTraffic()
    {
        if(!isAdmin())
            return '';

        $oFilter = $this->getFilter(['range' => '7d']);
        $oReports = $this->getReports();

        return [
            'content' => $this->_oTemplate->getStudioDashboardTraffic($oReports->getOverview($oFilter), $oReports->getRealtime($oFilter, ['limit' => 0]), $oReports->getTop($oFilter, ['group' => 'platforms', 'limit' => 5])),
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-other Other
     * @subsubsection bx_analytics-pruning pruning
     *
     * @code bx_srv('bx_analytics', 'pruning'); @endcode
     *
     * Hourly cron job: deletes old daily salts, then data past the retention period in
     * small batches, within a time limit so other cron jobs aren't held up.
     *
     * @return int rows deleted
     *
     * @see BxAnalyticsModule::servicePruning
     */
    /**
     * @ref bx_analytics-pruning "pruning"
     */
    public function servicePruning()
    {
        $CNF = &$this->_oConfig->CNF;

        // yesterday's salt is still needed to continue visits that crossed midnight
        $this->_oDb->deleteSaltsBefore(gmdate('Y-m-d', time() - 86400));

        $iBefore = time() - 86400 * $this->_oConfig->getRetentionDays();
        $this->_oDb->deleteBotsBefore(gmdate('Y-m-d', $iBefore));
        $iDeadline = time() + $CNF['PRUNING_SECONDS'];

        $iDeleted = 0;
        foreach(['deleteEventsBefore', 'deleteSessionsBefore'] as $sMethod)
            do {
                $iBatch = $this->_oDb->$sMethod($iBefore, $CNF['PRUNING_BATCH']);
                $iDeleted += $iBatch;
            } while($iBatch >= $CNF['PRUNING_BATCH'] && time() < $iDeadline);

        return $iDeleted;
    }

    /**
     * @page service Service Calls
     * @section bx_analytics Analytics
     * @subsection bx_analytics-tracking Tracking
     * @subsubsection bx_analytics-sync_actions sync_actions
     *
     * @code bx_srv('bx_analytics', 'sync_actions'); @endcode
     *
     * Subscribe to "added" of every content module on the site, so new content becomes an
     * event (comments and votes have site-wide alerts). Runs when the module is enabled and
     * whenever another module is enabled or disabled.
     *
     * @return int subscriptions written
     *
     * @see BxAnalyticsModule::serviceSyncActions
     */
    /**
     * @ref bx_analytics-sync_actions "sync_actions"
     */
    public function serviceSyncActions()
    {
        $aUnits = [];

        foreach(BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule) {
            $oModule = BxDolModule::getInstance($aModule['name']);
            if($oModule instanceof iBxDolContentInfoService)
                $aUnits[$aModule['name']][] = 'added';
        }

        $iWritten = $this->_oDb->setActionAlerts($this->getName(), ['added'], $aUnits, ['comment']);
        BxDolAlerts::cacheInvalidate();

        return $iWritten;
    }

    /**
     * Alerts the module listens to: deleted profiles, modules switched on and off, and the
     * site actions it records as events.
     */
    public function onAlert($oAlert)
    {
        $sUnit = $oAlert->sUnit;
        $sAction = $oAlert->sAction;

        if($sUnit == 'profile' && $sAction == 'delete') {
            $this->onProfileDelete($oAlert->iObject);
            return;
        }

        if($sUnit == 'system' && in_array($sAction, ['enable', 'disable'], true)) {
            if(empty($oAlert->aExtras['config']['name']) || $oAlert->aExtras['config']['name'] != $this->getName())
                $this->serviceSyncActions();
            return;
        }

        $aContext = ['api_key' => $this->_isApiKeyRequest()];
        $iSender = (int)$oAlert->iSender;

        switch($sAction) {
            case 'add':
                if($sUnit == 'account') {
                    $this->getCollector()->collectAction('signup', 'account', $oAlert->iObject, 0, $aContext);
                    return;
                }
                if($sUnit == 'profile') {
                    $sType = isset($oAlert->aExtras['module']) ? $oAlert->aExtras['module'] : '';
                    $this->getCollector()->collectAction('profile_add', $sType, $oAlert->iObject, $oAlert->iObject, $aContext);
                }
                return;

            case 'login':
                if($sUnit == 'account') {
                    $oProfile = BxDolProfile::getInstanceAccountProfile($oAlert->iObject);
                    $this->getCollector()->collectAction('login', 'account', $oAlert->iObject, $oProfile ? $oProfile->id() : 0, $aContext);
                }
                return;

            case 'connection_added':
                if($sUnit == 'system')
                    $this->getCollector()->collectAction('connection', isset($oAlert->aExtras['object_name']) ? $oAlert->aExtras['object_name'] : '', isset($oAlert->aExtras['content']) ? (int)$oAlert->aExtras['content'] : 0, $iSender, $aContext);
                return;

            case 'added':
                // comments of any system, or new content of a module
                if($sUnit == 'comment')
                    $this->getCollector()->collectAction('comment', isset($oAlert->aExtras['object_system']) ? $oAlert->aExtras['object_system'] : '', isset($oAlert->aExtras['object_id']) ? (int)$oAlert->aExtras['object_id'] : 0, $iSender, $aContext);
                else
                    $this->getCollector()->collectAction('content_add', $sUnit, $oAlert->iObject, $iSender, $aContext);
                return;

            case 'do':
                if($sUnit == 'vote') {
                    $aProps = [];
                    if(!empty($oAlert->aExtras['reaction']) && is_string($oAlert->aExtras['reaction']))
                        $aProps['reaction'] = $oAlert->aExtras['reaction'];
                    $this->getCollector()->collectAction('vote', isset($oAlert->aExtras['object_system']) ? $oAlert->aExtras['object_system'] : '', isset($oAlert->aExtras['object_id']) ? (int)$oAlert->aExtras['object_id'] : 0, $iSender, $aContext + ['props' => $aProps]);
                }
                return;
        }
    }

    /**
     * Forget a deleted profile: its visits stay in reports as an anonymous visitor's.
     */
    public function onProfileDelete($iProfileId)
    {
        $iProfileId = (int)$iProfileId;
        if(!$iProfileId)
            return 0;

        return $this->_oDb->forgetProfile($iProfileId, random_bytes(16));
    }

    public function serviceGetOptionsPlatforms()
    {
        $aResult = [];
        foreach($this->_oConfig->getPlatforms() as $sCode => $sTitle)
            $aResult[$sCode] = _t($sTitle);

        return $aResult;
    }

    public function serviceGetOptionsIdentity()
    {
        return [
            BX_ANALYTICS_IDENTITY_COOKIELESS => _t('_bx_analytics_identity_cookieless'),
            BX_ANALYTICS_IDENTITY_PERSISTENT => _t('_bx_analytics_identity_persistent'),
        ];
    }

    public function serviceGetOptionsGeoSource()
    {
        return [
            BX_ANALYTICS_GEO_NONE => _t('_bx_analytics_geo_none'),
            BX_ANALYTICS_GEO_HEADERS => _t('_bx_analytics_geo_headers'),
        ];
    }

    public function getCollector()
    {
        bx_import('UserAgent', $this->_aModule);
        bx_import('Source', $this->_aModule);
        bx_import('Request', $this->_aModule);
        bx_import('Collector', $this->_aModule);

        return new BxAnalyticsCollector($this);
    }

    public function getFilter($aParams)
    {
        bx_import('Filter', $this->_aModule);

        return new BxAnalyticsFilter($this, $aParams);
    }

    public function getReports()
    {
        if($this->_oReports === null) {
            bx_import('Reports', $this->_aModule);
            $this->_oReports = new BxAnalyticsReports($this);
        }

        return $this->_oReports;
    }

    /**
     * Report data by name, or false for an unknown report or parameters it doesn't know.
     */
    public function getReportData($sReport, $aParams)
    {
        if(!in_array($sReport, $this->_aReports, true))
            return false;

        if(in_array($sReport, $this->_aPeopleReports, true) && $this->checkAllowedPeople() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $oReports = $this->getReports();
        $sMethod = 'get' . bx_gen_method_name($sReport);
        if(!method_exists($oReports, $sMethod))
            return false;

        $oFilter = $this->getFilter($aParams);
        $aData = $oReports->$sMethod($oFilter, $aParams);
        if($aData === false)
            return false;

        $aData['filter'] = $oFilter->getParams();

        return $aData;
    }

    /**
     * What an API block carries: the report and the endpoint NEO calls for its data.
     */
    protected function _getApiBlockData($sReport, $aParams = [])
    {
        $aRanges = [];
        foreach(['today', 'yesterday', '24h', '7d', '30d', '90d', '12m'] as $sRange)
            $aRanges[] = ['value' => $sRange, 'title' => _t('_bx_analytics_range_' . $sRange)];

        $aPlatforms = [];
        foreach($this->_oConfig->getPlatforms() as $sCode => $sTitle)
            $aPlatforms[] = ['value' => $sCode, 'title' => _t($sTitle)];

        $aMetrics = [];
        foreach($this->getReports()->getMetrics() as $sMetric)
            $aMetrics[$sMetric] = _t('_bx_analytics_metric_' . $sMetric);

        return [
            'report' => $sReport,
            'params' => (object)$aParams,
            // the element asks for its data itself, with the page's filters, from get_report
            'request_url' => 'bx_analytics/get_report',
            'ranges' => $aRanges,
            'platforms' => $aPlatforms,
            'metrics' => $aMetrics,
            'strings' => [
                'range' => _t('_bx_analytics_txt_range'),
                'platform' => _t('_bx_analytics_txt_platform'),
                'all_platforms' => _t('_bx_analytics_txt_all_platforms'),
                'online' => _t('_bx_analytics_txt_online_now', '{0}'),
                'remove_filter' => _t('_bx_analytics_txt_remove_filter', '{0}'),
                'filter_by' => _t('_bx_analytics_txt_filter_by', '{0}'),
                'previous_period' => _t('_bx_analytics_txt_previous_period', '{0}'),
                'key_figures' => _t('_bx_analytics_txt_key_figures'),
                'visitors' => _t('_bx_analytics_metric_visitors'),
                'no_data' => _t('_bx_analytics_txt_no_data'),
                // NEO shows a Retry button next to it, so no "reload the page"
                'error' => _t('_bx_analytics_txt_error_report'),
                'duration_h' => _t('_bx_analytics_txt_duration_h'),
                'duration_m' => _t('_bx_analytics_txt_duration_m'),
                'duration_s' => _t('_bx_analytics_txt_duration_s'),
            ],
        ];
    }

    /**
     * The request came through api.php with an API key that api.php has already checked:
     * the NEO server, whose proxy headers carry the visitor's address.
     */
    protected function _isApiKeyRequest()
    {
        if(!defined('BX_API') || !getParam('sys_api_access_by_key'))
            return false;

        $sAuth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        if($sAuth === '' && function_exists('getallheaders')) {
            $aHeaders = array_change_key_case((array)getallheaders(), CASE_LOWER);
            $sAuth = isset($aHeaders['authorization']) ? $aHeaders['authorization'] : '';
        }

        return strpos($sAuth, 'Bearer ') === 0;
    }

    /**
    * Action methods
    */
          
    public function actionGetReports($sModuleName)
    {
		if(!$this->serviceIsAvaliable())
            return '';
            
        header('Content-Type: application/json');
             
        $aSystemsVote = BxDolVote::getSystems();
        $aRv = array();
        if ($sModuleName == BX_ANALYTICS_SYSTEM){
            $aRv[BX_ANALYTICS_TOP_BY_LIKES] = _t('_bx_analytics_type_top_contents_by_likes');
            $aRv[BX_ANALYTICS_TOP_BY_VIEWS] = _t('_bx_analytics_type_top_by_views');
            $aRv[BX_ANALYTICS_CONTENT_TOTAL] = _t('_bx_analytics_type_accounts_growth');
            $aRv[BX_ANALYTICS_CONTENT_SPEED] = _t('_bx_analytics_type_accounts_speed');
        }
        else{
            $oModule = BxDolModule::getInstance($sModuleName);
                  
            if(BxDolRequest::serviceExists($sModuleName, 'act_as_profile') && BxDolService::call($sModuleName, 'act_as_profile') == true){
                $aRv[BX_ANALYTICS_MOST_FOLLOWED_PROFILES] = _t('_bx_analytics_type_most_followed_profiles');
                $aRv[BX_ANALYTICS_MOST_ACTIVE_PROFILES] = _t('_bx_analytics_type_most_active_profiles');
            }
                  
            if(isset($oModule->_oConfig->CNF['OBJECT_VOTES']) && isset($aSystemsVote[$oModule->_oConfig->CNF['OBJECT_VOTES']])){
                $aRv[BX_ANALYTICS_TOP_BY_LIKES] = _t('_bx_analytics_type_top_contents_by_likes');
            }
                  
            if(isset($oModule->_oConfig->CNF['OBJECT_VIEWS'])){
                $aRv[BX_ANALYTICS_TOP_BY_VIEWS] = _t('_bx_analytics_type_top_by_views');
            }
                  
            $aRv[BX_ANALYTICS_CONTENT_TOTAL] = _t('_bx_analytics_type_content_growth');
            $aRv[BX_ANALYTICS_CONTENT_SPEED] = _t('_bx_analytics_type_content_speed');
        }
        /**
         * @hooks
         * @hookdef hook-bx_analytics-get_reports 'bx_analytics', 'get_reports' - hook on get avalaible reports for specified module
         * - $unit_name - equals `bx_analytics`
         * - $action - equals `get_reports` 
         * - $object_id - not used
         * - $sender_id -not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] module name
         *      - `list` - [array] by ref, array of avalaible reports for analytics as [report_name] = report_title, can be overridden in hook processing
         * @hook @ref hook-bx_analytics-get_reports
         */
        bx_alert($this->_aModule['name'], 'get_reports', 0, 0, array(
            'module' => $sModuleName,
            'list' => &$aRv,
            'list_ref' => &$aRv,
        ));
        
        echo json_encode($aRv);
    }
          
    public function actionGetReportsData($sModuleName, $sReportName, $sDateFrom, $sDateTo, $sType = '')
    {
        if(!$this->serviceIsAvaliable())
            return '';
        
        if ($sType == 'csv'){
            header('Content-type: text/csv');
            header('Content-disposition: attachment;filename=' . $sModuleName . '_' . $sReportName . '_' . $sDateFrom . '_' . $sDateTo . '.csv');
            echo $this->actionGetReportsDataCsv($sModuleName, $sReportName, $sDateFrom, $sDateTo);
            
        }
        
        if ($sType == ''){
            header('Content-Type: application/json');
            echo $this->actionGetReportsDataJson($sModuleName, $sReportName, $sDateFrom, $sDateTo);
        } 
    }
    
    private function actionGetReportsDataCsv($sModuleName, $sReportName, $sDateFrom, $sDateTo)
    {
        $sRv = '';
        $sColumn = ";";
        $sRow = "\n";
        $sData = $this->actionGetReportsDataJson($sModuleName, $sReportName, $sDateFrom, $sDateTo);
        $oRv = json_decode($sData, true); 
        $oData = $oRv['data'];
        $sCol1 = $oRv['strings'][0];
        $iColumnCount = count($oData['datasets']);
        $sRv .= $sCol1 . $sColumn;
        foreach($oData['datasets'] as $aItem){
            $sRv .= ($aItem['label'] != '' ? $aItem['label'] : $oRv['strings'][1]) . $sColumn;
        }
   
        $sRv .= $sRow;
        $iK = 0;
        foreach($oData['datasets'][0]['data'] as $sDx => $aItemData){
            $sTxt = "";
            if (is_array($oData['datasets'][0]['data'][$sDx]))
                $sTxt = $oData['datasets'][0]['data'][$sDx]['x'];
            else
                $sTxt = $oData['labels'][$sDx];
            if (isset($oRv['links']) && count($oRv['links'])>0) {
                $sTxt .= ' (' . $oRv['links'][$sDx] . ')';
            }
            
            $sRv .= $sTxt . $sColumn;
            for ($i = 0; $i < $iColumnCount; $i++){
                $sText = '';
                if (is_array($aItemData)) {
                    $sText = $aItemData['y'];
                }
                else {
                    $sText = $aItemData;
                }
                $sRv .= $sText . $sColumn;
            }
            $sRv .= $sRow;
            $iK++;
        }
        echo $sRv;
    }
    
    private function actionGetReportsDataJson($sModuleName, $sReportName, $sDateFrom, $sDateTo)
    { 
        $iDateFrom = strtotime($sDateFrom);
        $iDateTo = strtotime($sDateTo) + 86400;
        $sType = "bar";
        $bIsTimeX = false;
        $iMinValueY = 0;
        $iMaxValueY = 0;
        $bDefaultFillData = true;
        $sReportType = $sReportName;
        
        $aValues = array('labels' => array(), 'values' => array(array('legend' => '', 'data' => array())), 'links' => array(), 'strings' => array(0 => _t('_bx_analytics_txt_item'), 1 => _t('_bx_analytics_txt_value')));
   
        if ($sModuleName != BX_ANALYTICS_SYSTEM){
            $oModule = BxDolModule::getInstance($sModuleName);
            $aValues['strings'][0] = $oModule->_aModule['title'];
            $aValues['strings'][1] = _t('_bx_analytics_type_' . $sReportType . '_label');
        }
        else{
            $aValues['strings'][0] = _t('_bx_analytics_txt_total_content');
            $aValues['strings'][1] = _t('_bx_analytics_type_' . $sReportType . '_label');
        }
              
        switch ($sReportType) {
            case BX_ANALYTICS_TOP_BY_LIKES:
                $bDefaultFillData = false;
                $this->getViewsOrVotes(BxDolVote::getSystems(), 'OBJECT_VOTES', $sModuleName, $iDateFrom, $iDateTo, $aValues, $iMaxValueY, $iMinValueY);
                break;
                  
            case BX_ANALYTICS_TOP_BY_VIEWS:
                $bDefaultFillData = false;
                $this->getViewsOrVotes(BxDolView::getSystems(), 'OBJECT_VIEWS', $sModuleName, $iDateFrom, $iDateTo, $aValues, $iMaxValueY, $iMinValueY);
                break;
                  
            case BX_ANALYTICS_MOST_FOLLOWED_PROFILES:
                $oModule = BxDolModule::getInstance($sModuleName);
                $aData = $this->_oDb->getMostFollowedProfiles($sModuleName, $iDateFrom, $iDateTo);
                break;
                  
            case BX_ANALYTICS_MOST_ACTIVE_PROFILES:
                $aData = array();
                $oModule = BxDolModule::getInstance($sModuleName);
                $aTmp = $this->getSelectedModules();
                foreach($aTmp[0] as $sContentModule){
                    $oContentModule = BxDolModule::getInstance($sContentModule);
                    if ($oContentModule && isset($oContentModule->_oConfig->CNF['TABLE_ENTRIES']) && isset($oContentModule->_oConfig->CNF['FIELD_AUTHOR'])){
                        $sContentTable = $oContentModule->_oConfig->CNF['TABLE_ENTRIES'];
                        $sColumnAuthor = $oContentModule->_oConfig->CNF['FIELD_AUTHOR'];
                        $sColumnAdded = $oContentModule->_oConfig->CNF['FIELD_ADDED'];
                        if (!empty($sContentTable) && !empty($sColumnAuthor) && !empty($sColumnAdded) && (!BxDolRequest::serviceExists($sContentModule, 'act_as_profile') || BxDolService::call($sContentModule, 'act_as_profile') == false)){
                            $aData1 = $this->_oDb->getMostActiveProfiles($sModuleName, $sContentModule, $sContentTable, $sColumnAuthor, $sColumnAdded, $iDateFrom, $iDateTo);
                            foreach($aData1 as $aTmp3){
                                if (array_key_exists($aTmp3['object_id'], $aData))
                                    $aData[$aTmp3['object_id']]['value'] += $aTmp3['value'];
                                else
                                    $aData[$aTmp3['object_id']] = $aTmp3;
                            }
                        }
                    }
                }
                $aData = $this->sortArrayOfArraysAndSlice($aData, 'value', intval(getParam('bx_analytics_items_count')));
                break;
                
            default:
                $sType = "line";
                $sTableName = '';
                $aValues['strings'][0] = _t('_bx_analytics_txt_date');
                $bDefaultFillData = false;
                if ($sModuleName != BX_ANALYTICS_SYSTEM){
                    $oModule = BxDolModule::getInstance($sModuleName);
                    if (isset($oModule->_oConfig->CNF['TABLE_ENTRIES']))
                        $sTableName = $oModule->_oConfig->CNF['TABLE_ENTRIES'];
                    $aValues['strings'][1] = ($sReportType == BX_ANALYTICS_CONTENT_TOTAL ? _t('_bx_analytics_txt_total_count', $oModule->_aModule['title']) : _t('_bx_analytics_txt_count', $oModule->_aModule['title']));
                }
                else{
                    $sTableName = 'sys_accounts';
                    $aValues['strings'][1] = ($sReportType == BX_ANALYTICS_CONTENT_TOTAL ? _t('_bx_analytics_txt_total_count', _t('_bx_analytics_txt_accounts')) : _t('_bx_analytics_txt_count', _t('_bx_analytics_txt_accounts')));
                }
                if (isset($oModule) && isset($oModule->_oConfig->CNF['FIELD_ADDED']))
                    $sColumnAdded = $oModule->_oConfig->CNF['FIELD_ADDED'];
                else
                    $sColumnAdded = 'added';
                
                $aData = array();
                $iValuePrev = 0;
                
                /**
                 * @hooks
                 * @hookdef hook-bx_analytics-get_chart_data_line 'bx_analytics', 'get_chart_data_line' - hook on get avalaible reports for specified module
                 * - $unit_name - equals `bx_analytics`
                 * - $action - equals `get_chart_data_line` 
                 * - $object_id - not used
                 * - $sender_id -not used
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `module` - [string] module name
                 *      - `report_name` - [string] report name
                 *      - `report_type` - [string]  by ref, report name, can be overridden in hook processing
                 *      - `date_from` - [int] report's start of interval in php time format
                 *      - `date_to` - [int] report's end of interval in php time format
                 *      - `data` - [array] by ref, array of data for chart, can be overridden in hook processing
                 *      - `prev_value` - [int] by ref, previous value for chart (started value), can be overridden in hook processing
                 * @hook @ref hook-bx_analytics-get_chart_data_line
                 */
                bx_alert($this->_aModule['name'], 'get_chart_data_line', 0, 0, array(
                    'module' => $sModuleName,
                    'report_name' => $sReportName,
                    'report_type' => &$sReportType,
                    'report_type_ref' => &$sReportType,
                    'date_from' => $iDateFrom,
                    'date_to' => $iDateTo,
                    'data' => &$aData,
                    'data_ref' => &$aData,
                    'prev_value' => &$iValuePrev,
                    'prev_value_ref' => &$iValuePrev,
                ));
                
                
                
                if ($sColumnAdded != '' && count($aData) == 0){
                    $aData = $this->_oDb->getGrowth($sTableName, $sColumnAdded, $iDateFrom, $iDateTo);
                    $iValuePrev = $this->_oDb->getGrowthInitValue($sTableName, $sColumnAdded, $iDateFrom);
                }
                
                if (count($aData) > 0){
                    $aTmpDates = array();
                    foreach ($aData as $aValue) {
                        $sX = $aValue['period'];
                        $aTmpDates[$sX] = $aValue['count'];
                    }
                    for ($i = $iDateFrom; $i < $iDateTo ; $i = $i + 86400 ){
                        $sX = date('Y-m-d', $i);
                        if (!array_key_exists($sX, $aTmpDates)){
                            array_push($aValues['values'][0]['data'], array('x' => $sX, 'y' => $sReportType == BX_ANALYTICS_CONTENT_TOTAL ? $iValuePrev : 0));
                        }
                        else{
                            array_push($aValues['values'][0]['data'], array('x' => $sX, 'y' => $sReportType == BX_ANALYTICS_CONTENT_TOTAL ? ($iValuePrev + $aTmpDates[$sX]) : $aTmpDates[$sX]));
                            $iValuePrev += $aTmpDates[$sX];
                        }
                        //array_push($aValues['labels'], $sX);
                        if ($sReportType == BX_ANALYTICS_CONTENT_TOTAL){
                            if ($iValuePrev > $iMaxValueY)
                                $iMaxValueY = $iValuePrev;
                        }
                        else{
                            if (array_key_exists($sX, $aTmpDates) && $aTmpDates[$sX] > $iMaxValueY)
                                $iMaxValueY = $aTmpDates[$sX];
                        } 
                    }
                }
                break;
        }
          
        if ($bDefaultFillData){
            foreach ($aData as $aValue) {
                array_push($aValues['labels'], $this->getItemName($oModule->serviceGetTitle($aValue['object_id'])));
                array_push($aValues['values'][0]['data'], $aValue['value']);
                array_push($aValues['links'], $oModule->serviceGetLink($aValue['object_id']));
                if ($aValue['value'] > $iMaxValueY)
                    $iMaxValueY = $aValue['value'];
            }
        }
        $iMaxValueY = ceil($iMaxValueY * 1.1);
        
        $aDataForChartXAxes = array();
        if ($bIsTimeX){
            $sUnit = 'day';
            $iInterval = ($iDateTo - $iDateFrom) / 86400;
            if ($iInterval > 50)
                $sUnit = 'week';
            if ($iInterval > 100)
                $sUnit = 'month';
            
            $aDataForChartXAxes = array(
                'type' => 'time',
                'time' => array(
                    'tooltipFormat' => 'DD.MM.YYYY',
                    'unit' => $sUnit,
                 ),
                'display' => true,
                'distribution' => 'linear',
                'ticks' => array(
                    'display' => true, 
                    'autoSkip' => true, 
                )
            );
        }
        else{
            $aDataForChartXAxes = array(
                'ticks' => array(
                    'autoSkip' => true
                ),
                'display' => true
            );
        }
       
        $aDataForChartDatasets = array();
        for($i = 0; $i < count($aValues['values']); $i++){
            $aDataForChartDatasets[] = array(
                'label' => $aValues['values'][$i]['legend'],
                'fill' => false,
                'backgroundColor' => $this->aColors[$i],
                'borderColor' => $this->aColors[$i],
                'borderWidth' => 2,
                'data' => $aValues['values'][$i]['data']
            );
        }
            
        $aDataForChart = array(
            'type' => $sType,
            'data' => array(
                'labels' => $aValues['labels'], 
                'datasets' => $aDataForChartDatasets
            ),
            'options' => array(
                'legend' => array(
                    'position' => 'bottom', 
                    'display' => count($aValues['values']) == 1 ? false :true
                ),
                'elements' => array(
                    'point'=> array(
                        'radius' => 0
                    )
                ),
                'scales' => array(
                    'y' => array(
                        'ticks' => array(
                            'max' => $iMaxValueY, 
                            'min' => $iMinValueY, 
                            'stepSize' => $this->getStep($iMinValueY, $iMaxValueY), 
                            'autoSkip' => true
                        )
                    ),
                    'x' => $aDataForChartXAxes
                )
            ),
            'links' => $aValues['links'],
            'strings' => $aValues['strings'],
        );
        
        return json_encode($aDataForChart);
    }
	
    /**
     * Who may define goals and funnels: site administrators, and levels with "manage analytics"
     * besides "use analytics".
     */
    public function checkAllowedManage()
    {
        if(isAdmin())
            return CHECK_ACTION_RESULT_ALLOWED;

        if($this->checkAllowed() !== CHECK_ACTION_RESULT_ALLOWED)
            return _t('_sys_txt_access_denied');

        $aCheck = checkActionModule(bx_get_logged_profile_id(), 'manage analytics', $this->getName(), false);

        return $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');
    }

    /**
     * Save or delete a goal: POST op (save, delete), id, name, type (page, event), pattern, csrf_token.
     */
    public function actionGoal()
    {
        $aResult = $this->_checkManageRequest();
        if($aResult === true) {
            $iId = (int)bx_get('id', 'post');
            if(bx_get('op', 'post') == 'delete')
                $aResult = ['ok' => $this->_oDb->deleteGoal($iId)];
            else {
                $aGoal = $this->_getMatchInput(bx_get('type', 'post'), bx_get('pattern', 'post'));
                $sName = trim((string)bx_get('name', 'post'));
                if($aGoal === false || $sName === '' || get_mb_len($sName) > 128)
                    $aResult = ['error' => _t('_bx_analytics_txt_goal_invalid')];
                else {
                    $iId = $this->_oDb->saveGoal($iId, ['name' => $sName] + $aGoal);
                    $aResult = ['ok' => (bool)$iId, 'id' => $iId];
                }
            }
        }

        $this->_outputJson($aResult);
    }

    /**
     * Save or delete a funnel: POST op, id, name, step_type[], step_pattern[], csrf_token.
     */
    public function actionFunnel()
    {
        $aResult = $this->_checkManageRequest();
        if($aResult === true) {
            $iId = (int)bx_get('id', 'post');
            if(bx_get('op', 'post') == 'delete')
                $aResult = ['ok' => $this->_oDb->deleteFunnel($iId), 'id' => 0];
            else {
                $aTypes = bx_get('step_type', 'post');
                $aPatterns = bx_get('step_pattern', 'post');
                $aSteps = [];
                if(is_array($aTypes) && is_array($aPatterns))
                    foreach(array_values($aTypes) as $i => $sType) {
                        if(!isset($aPatterns[$i]) || trim((string)$aPatterns[$i]) === '')
                            continue;
                        $aStep = $this->_getMatchInput($sType, $aPatterns[$i]);
                        if($aStep === false) {
                            $aSteps = false;
                            break;
                        }
                        $aSteps[] = $aStep;
                    }

                $sName = trim((string)bx_get('name', 'post'));
                if($aSteps === false || count($aSteps) < 2 || count($aSteps) > $this->_oConfig->CNF['MAX_FUNNEL_STEPS'] || $sName === '' || get_mb_len($sName) > 128)
                    $aResult = ['error' => _t('_bx_analytics_txt_funnel_invalid')];
                else {
                    $iId = $this->_oDb->saveFunnel($iId, $sName, $aSteps);
                    $aResult = ['ok' => (bool)$iId, 'id' => $iId];
                }
            }
        }

        $this->_outputJson($aResult);
    }

    /**
     * A POST from a manager with a valid form token, or an error array.
     */
    protected function _checkManageRequest()
    {
        if($_SERVER['REQUEST_METHOD'] != 'POST' || $this->checkAllowedManage() !== CHECK_ACTION_RESULT_ALLOWED)
            return ['error' => _t('_sys_txt_access_denied'), 'code' => 403];

        if(!BxDolForm::isCsrfTokenValid((string)bx_get('csrf_token', 'post'), false))
            return ['error' => _t('_sys_txt_access_denied'), 'code' => 403];

        return true;
    }

    /**
     * A goal or funnel step from form input: a page path (starting with / or *, * for any
     * characters) or an event name (name, or name@module), or false.
     */
    protected function _getMatchInput($sType, $sPattern)
    {
        $sPattern = trim((string)$sPattern);
        if($sPattern === '' || get_mb_len($sPattern) > 255)
            return false;

        if($sType == 'page')
            return in_array(get_mb_substr($sPattern, 0, 1), ['/', '*'], true) ? ['type' => 'page', 'pattern' => $sPattern] : false;

        if($sType == 'event')
            return preg_match('/^[\p{L}\p{N} _.:\/-]{1,64}(@[a-z0-9_]{1,32})?$/u', $sPattern) ? ['type' => 'event', 'pattern' => $sPattern] : false;

        return false;
    }

    protected function _outputJson($aResult)
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        if(isset($aResult['code']))
            http_response_code((int)$aResult['code']);

        echo json_encode($aResult);
        exit;
    }

    /**
     * Reports that show members by name: sessions and users. Site administrators always
     * see them; everyone else needs "view analytics people" besides "use analytics".
     */
    public function checkAllowedPeople()
    {
        if(isAdmin())
            return CHECK_ACTION_RESULT_ALLOWED;

        if($this->checkAllowed() !== CHECK_ACTION_RESULT_ALLOWED)
            return _t('_sys_txt_access_denied');

        $aCheck = checkActionModule(bx_get_logged_profile_id(), 'view analytics people', $this->getName(), false);

        return $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');
    }

	public function checkAllowed($isPerformAction = false)
    {
        // site administrators always see analytics, whatever their profile's level
        if(isAdmin())
            return CHECK_ACTION_RESULT_ALLOWED;

        $aCheck = checkActionModule(bx_get_logged_profile_id(), 'use analytics', $this->getName(), $isPerformAction);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
             return _t('_sys_txt_access_denied');
        return CHECK_ACTION_RESULT_ALLOWED;
    }
          
    public function getSelectedModules()
    {
        $aModulesList = $this->serviceGetModules();
        $aModules = array_keys($aModulesList);
        $sModulesDisabled = explode(',', getParam('bx_analytics_modules_disabled'));
        return array(array_diff($aModules, $sModulesDisabled), $aModulesList);
    }

    private function getViewsOrVotes($aSystems, $sSystem, $sModuleName, $iDateFrom, $iDateTo, &$aValues, &$iMaxValueY, &$iMinValueY)
    {
        $aData = array();
        if ($sModuleName != BX_ANALYTICS_SYSTEM){
            $oModule = BxDolModule::getInstance($sModuleName);
            $sSystem = $oModule->_oConfig->CNF['OBJECT_VIEWS'];
            if(isset($aSystems[$sSystem]))
                $aData = $this->_oDb->getTopContentByLikes($sModuleName, $aSystems[$sSystem]['table_track'], $iDateFrom, $iDateTo);
        }
        else{
            $aTmp = $this->getSelectedModules();
            foreach ($aTmp[0] as $sModule) {
                if ($sModule != BX_ANALYTICS_SYSTEM){
                    $oModule = BxDolModule::getInstance($sModule);
                    if (isset($oModule->_oConfig->CNF['OBJECT_VIEWS'])){
                        $sSystem = $oModule->_oConfig->CNF['OBJECT_VIEWS'];
                        if(isset($aSystems[$sSystem])){
                            $aData1 = $this->_oDb->getTopContentByLikes($sModule, $aSystems[$sSystem]['table_track'], $iDateFrom, $iDateTo);
                            $aData = array_merge($aData, $aData1);
                        }
                    }
                }
            }
            $aData = $this->sortArrayOfArraysAndSlice($aData, 'value', intval(getParam('bx_analytics_items_count')));
        }
        foreach ($aData as $aValue) {
            $oModule = BxDolModule::getInstance($aValue['module']);
            array_push($aValues['labels'], $this->getItemName($oModule->serviceGetTitle($aValue['object_id'])));
            array_push($aValues['values'][0]['data'], $aValue['value']);
            array_push($aValues['links'], $oModule->serviceGetLink($aValue['object_id']));
            if ($aValue['value'] > $iMaxValueY)
                $iMaxValueY = $aValue['value'];
        }
    }
          
    private function getStep($iMin, $iMax)
    {
        $iCount = 8;
        return ceil(($iMax - $iMin) / $iCount);
    }
          
    private function sortArrayOfArraysAndSlice($aArr, $sFld, $Count)
    {
        $aDataSort = array();
        foreach ($aArr as $sKey => $oRow)
        {
            $aDataSort[$sKey] = $oRow[$sFld];
        }
        array_multisort($aDataSort, SORT_DESC, $aArr);
        return array_slice($aArr, 0, $Count);
    }
          
    private function getItemName($sString)
    {
        $sString = strip_tags($sString);
        if ($sString == ''){
            $sString = _t('_bx_analytics_txt_empty_title_item');
        }
        return $sString;
    }
}

/** @} */