<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioDashboard extends BxTemplStudioWidget
{
    protected $aBlocks;
    protected $aItemsCache;
    protected $aItemsHTools;

    protected $aAuditReport = null; // the report getAuditReport() settled on in this request
    protected $aItemsQueues;

    function __construct()
    {
        parent::__construct('dashboard');

        $this->oDb = new BxDolStudioDashboardQuery();

        $this->aBlocks = array(
        	'space' => 'serviceGetBlockSpace',
        	'htools' => 'serviceGetBlockHostTools',
        );

        // The queues the Queues block lists: the count queries and, where a queue can be emptied, its clear query.
        $this->aItemsQueues = array(
            'emails' => array(
                'name' => '_sys_queue_emails',
                'icon' => 'mail',
                'all' => "SELECT COUNT(*) FROM `sys_queue_email`",
                'action' => "DELETE FROM `sys_queue_email`"
            ),
            'push' => array(
                'name' => '_sys_queue_push',
                'icon' => 'bell',
                'all' => "SELECT COUNT(*) FROM `sys_queue_push`",
                'action' => "DELETE FROM `sys_queue_push`"
            ),
            'transcoding' => array(
                'name' => '_sys_queue_transcoding',
                'icon' => 'film',
                'all' => "SELECT COUNT(*) FROM `sys_transcoder_queue`",
                'failed' => "SELECT COUNT(*) FROM `sys_transcoder_queue` WHERE `status` = 'failed'",
                'action' => "DELETE FROM `sys_transcoder_queue` WHERE `status` != 'processing'"
            ),
        );
        $this->aItemsQueues = array_merge($this->aItemsQueues, $this->getModulesQueues());
        // last: the files waiting to be removed from storage, a queue that is watched but never emptied by hand
        $this->aItemsQueues['storage'] = array(
            'name' => '_sys_queue_storage',
            'icon' => 'hard-drive',
            'all' => "SELECT COUNT(*) FROM `sys_storage_deletions`"
        );

        $this->aItemsCache = array (
            array('name' => 'all'),
            array('name' => 'content'),
            array('name' => 'db'),
            array('name' => 'template'),
            array('name' => 'less'),
            array('name' => 'css'),
            array('name' => 'js'),
            array('name' => 'purifier'),
            array('name' => 'opcache'),
            array('name' => 'custom')
        );

        $this->aItemsHTools = array (
            'PHP' => 'requirementsPHP',
            'MySQL' => 'requirementsMySQL',
            'Web Server' => 'requirementsWebServer',
        );

        //--- Check actions ---//
        if(($sAction = bx_get('dbd_action')) !== false) {
            $sAction = bx_process_input($sAction);

            $aResult = array('code' => 1, 'message' => _t('_adm_err_cannot_process_action'));

            // actions that change something are only taken from a POST (dashboard.js posts them)
            if(in_array($sAction, array('set_option', 'perform_upgrade', 'clear_cache', 'clear_queue', 'run_audit')) && $_SERVER['REQUEST_METHOD'] != 'POST')
                $sAction = '';

            switch($sAction) {
            	case 'get_block':
                    $sValue = bx_get('dbd_value');
                    if($sValue === false)
                        break;

                    $sValue = bx_process_input($sValue);
                    if(!isset($this->aBlocks[$sValue]))
                        break;

                    $aBlock = $this->{$this->aBlocks[$sValue]}(true);
                    if(!empty($aBlock['content']))
                        $aResult = array('code' => 0, 'data' => $aBlock['content']);

                    break;

                case 'check_for_upgrade':
                    $aResult = array('code' => 0, 'data' => $this->getPageCodeVersionAvailable());
                    break;

                case 'set_option':
                    // The Version block's switches: only the update options, each with its 'on' and 'off' value.
                    $aOptions = array(
                        'sys_autoupdate' => array('on', ''),
                        'sys_autoupdate_force_modified_files' => array('on', ''),
                        'sys_upgrade_channel' => array('beta', 'stable')
                    );

                    $sName = bx_get('dbd_value');
                    if($sName === false)
                        break;

                    $sName = bx_process_input($sName);
                    if(!isset($aOptions[$sName]))
                        break;

                    $oDb = BxDolDb::getInstance();
                    $oDb->setParam($sName, $aOptions[$sName][(int)bx_get('dbd_state') == 1 ? 0 : 1]);
                    $oDb->cacheParamsClear();

                    $aResult = array('code' => 0, 'message' => '');
                    break;

            	case 'perform_upgrade':
                    $oUpgrader = bx_instance('BxDolUpgrader');
                    if(!$oUpgrader->prepare(false)){
                        $aResult = array('code' => 1, 'message' => $oUpgrader->getError());
					}
                    else{
						BxDolModuleQuery::getInstance()->updateModule(array('updated' => time()), array('name' => 'system'));
                        $aResult = array('code' => 0, 'message' => _t('_adm_dbd_msg_upgrade_started', BX_DOL_URL_STUDIO));
					}
                    break;

                case 'clear_cache':
                    $sValue = bx_get('dbd_value');
                    if($sValue === false)
                        break;

                    $sValue = bx_process_input($sValue);

                    $oCacheUtilities = BxDolCacheUtilities::getInstance();

                    switch ($sValue) {
                        case 'all':
                            $aResult = false;
                            foreach($this->aItemsCache as $aItem) {
                                if($aItem['name'] == 'all')
                                    continue;

                                $aResultClear = $oCacheUtilities->clear($aItem['name']);
                                if($aResultClear === false)
                                    continue;

                                $aResult = $aResultClear;
                                if(isset($aResult['code']) && $aResult['code'] != 0)
                                    break;
                            }
                            break;

                        case 'content':
                        case 'db':
                        case 'template':
                        case 'less':
                        case 'css':
                        case 'js':
                        case 'purifier':
                        case 'opcache':
                        case 'custom':
                            $aResult = $oCacheUtilities->clear($sValue);
                            break;

                        default:
                            $aResult = array('code' => 1, 'message' => _t('_error occured'));
                    }

                    if($aResult === false)
                        $aResult['data'] = MsgBox(_t('_adm_dbd_msg_c_all_disabled'));
                    else if(isset($aResult['code']) && $aResult['code'] == 0) {
                        bx_alert('system', 'clear_cache', 0, 0, array('type' => $sValue));

                        $aResult['data'] = $this->getCacheChartData(false);
                    }
                    break;

                case 'clear_queue':
                    $sValue = bx_get('dbd_value');
                    if($sValue === false)
                        break;

                    $sValue = bx_process_input($sValue);

                    $aActions = [];
                    if($sValue == 'all') {
                        foreach($this->aItemsQueues as $aQueue)
                            if(!empty($aQueue['action']))
                                $aActions[] = $aQueue['action'];
                    }
                    else if(!empty($this->aItemsQueues[$sValue]['action']))
                        $aActions[] = $this->aItemsQueues[$sValue]['action'];

                    if(empty($aActions))
                        break;

                    foreach($aActions as $sQuery)
                        BxDolDb::getInstance()->query($sQuery);

                    $aResult = array('code' => 0, 'message' => _t('_adm_dbd_msg_q_clean_success'), 'data' => $this->getQueuesChartData(false));
                    break;

                case 'run_audit':
                    // a fresh audit, then the Server block redrawn from it (dashboard.js reopens the Audit tab)
                    $this->getAuditReport(true);

                    $aBlock = $this->serviceGetBlockHostTools(true);
                    $aResult = array('code' => 0, 'data' => $aBlock['content']);
                    break;

                case 'server_audit':
                    header( 'Content-type: text/html; charset=utf-8' );
                    echo $this->getBlockHostToolsAudit();
                    exit;
            }

            if(!empty($aResult['message'])) {
                // the outcome dialog (dashboard.js popup): the message beside an icon tile coloured by the outcome, with a close button
                $sType = !empty($aResult['type']) ? $aResult['type'] : ((int)$aResult['code'] == 0 ? 'success' : 'error');
                $aIcons = array('success' => 'circle-check', 'error' => 'circle-x', 'info' => 'info');

                $aResult['message'] = BxDolStudioTemplate::getInstance()->parseHtmlByName('page_action_result.html', array(
                    'type' => $sType,
                    'icon' => $this->getChartIcon(isset($aIcons[$sType]) ? $aIcons[$sType] : 'info')['svg'],
                    'icon_close' => $this->getChartIcon('x')['svg'],
                    'content' => $aResult['message']
                ));
                $aResult['message'] = BxTemplStudioFunctions::getInstance()->transBox('', $aResult['message']);
            }

            echo json_encode($aResult);
            exit;
        }
    }

    /**
     * CPU, memory and disk usage in percent for the Server block's gauges, read from what PHP and the kernel expose
     * (load average per core, /proc/meminfo, disk_*_space); a metric that isn't readable on this host is null.
     */
    /**
     * The last server audit (BxDolStudioToolsAudit::getReport(): {time, sections}), kept in the sys_audit_report option; run
     * afresh when asked, when there is none yet, or when the stored one is older than a day.
     */
    public function getAuditReport($bFresh = false)
    {
        if(!$bFresh && $this->aAuditReport !== null)
            return $this->aAuditReport;

        $aReport = $bFresh ? false : json_decode((string)getParam('sys_audit_report'), true);
        if(empty($aReport['sections']) || time() - (int)$aReport['time'] >= 86400) {
            $oAudit = new BxDolStudioToolsAudit();
            $aReport = $oAudit->getReport();

            // reloading the options (rather than only dropping their cache) keeps getParam() working for the rest of this request
            $oDb = BxDolDb::getInstance();
            $oDb->setParam('sys_audit_report', json_encode($aReport));
            $oDb->cacheParams(true);
        }

        return $this->aAuditReport = $aReport;
    }

    /**
     * The Server block's gauges: each is null when the host does not expose it, or ['percent' => the arc's share, 'value' =>
     * the figure shown in the ring, 'unit' => a unit shown small under it, '' when the figure carries its own].
     */
    protected function getServerMetrics()
    {
        $aMetrics = ['cpu' => null, 'memory' => null, 'disk' => null, 'network' => null];
        $fnPercent = function($iPercent) {
            return ['percent' => $iPercent, 'value' => $iPercent . '%', 'unit' => ''];
        };

        if(function_exists('sys_getloadavg') && ($aLoad = @sys_getloadavg()) !== false && isset($aLoad[0])) {
            $iCores = 0;
            if(is_readable('/proc/cpuinfo') && ($sCpuInfo = @file_get_contents('/proc/cpuinfo')) !== false)
                $iCores = preg_match_all('/^processor\s*:/m', $sCpuInfo);
            if($iCores < 1)
                $iCores = 1;

            $aMetrics['cpu'] = $fnPercent((int)min(100, round($aLoad[0] / $iCores * 100)));
        }

        if(is_readable('/proc/meminfo') && ($sMemInfo = @file_get_contents('/proc/meminfo')) !== false && preg_match('/^MemTotal:\s*(\d+)/m', $sMemInfo, $aTotal) && preg_match('/^MemAvailable:\s*(\d+)/m', $sMemInfo, $aAvailable) && (int)$aTotal[1] > 0)
            $aMetrics['memory'] = $fnPercent((int)round(((int)$aTotal[1] - (int)$aAvailable[1]) / (int)$aTotal[1] * 100));

        $fDiskTotal = @disk_total_space(BX_DIRECTORY_PATH_ROOT);
        $fDiskFree = @disk_free_space(BX_DIRECTORY_PATH_ROOT);
        if($fDiskTotal !== false && $fDiskFree !== false && $fDiskTotal > 0)
            $aMetrics['disk'] = $fnPercent((int)round(($fDiskTotal - $fDiskFree) / $fDiskTotal * 100));

        // Network: the throughput over a 250 ms sample of the interface counters (this runs in the block's own ajax request, so the
        // pause is not felt), shown as a bit rate; the arc is its share of the link speed, 1 Gbit/s when the driver reports none.
        if(($aStart = $this->getNetworkCounters()) !== false) {
            $iStarted = hrtime(true);
            usleep(250000);
            $aEnd = $this->getNetworkCounters();
            $fSeconds = (hrtime(true) - $iStarted) / 1e9;

            if($aEnd !== false && $fSeconds > 0) {
                $fBits = max(0, $aEnd[0] - $aStart[0]) * 8 / $fSeconds;
                $fLink = ($aEnd[1] > 0 ? $aEnd[1] : 1000) * 1e6;

                $aMetrics['network'] = ['percent' => (int)min(100, round($fBits / $fLink * 100))] + $this->formatBitRate($fBits);
            }
        }

        return $aMetrics;
    }

    /**
     * @return array|false [bytes received plus sent over every interface but the loopback, the fastest of their link speeds in Mbit/s (0 when none reports one)]
     */
    protected function getNetworkCounters()
    {
        if(!is_readable('/proc/net/dev') || ($sDev = @file_get_contents('/proc/net/dev')) === false)
            return false;

        $iBytes = $iSpeed = 0;
        foreach(explode("\n", $sDev) as $sLine) {
            // "eth0: <rx bytes> <7 more receive counters> <tx bytes> ..."
            if(!preg_match('/^\s*([^:\s]+):\s*(\d+)(?:\s+\d+){7}\s+(\d+)/', $sLine, $aMatch) || $aMatch[1] == 'lo')
                continue;

            $iBytes += (int)$aMatch[2] + (int)$aMatch[3];
            $iSpeed = max($iSpeed, (int)@file_get_contents('/sys/class/net/' . $aMatch[1] . '/speed'));
        }

        return [$iBytes, $iSpeed];
    }

    /**
     * @return array ['value' => the figure, one decimal under 10, 'unit' => kbps, Mbps or Gbps]
     */
    protected function formatBitRate($fBits)
    {
        foreach(['gbps' => 1e9, 'mbps' => 1e6, 'kbps' => 1e3] as $sUnit => $fDivider) {
            if($fBits < $fDivider && $sUnit != 'kbps')
                continue;

            $fValue = $fBits / $fDivider;
            return ['value' => $fValue < 10 ? number_format($fValue, 1) : (string)round($fValue), 'unit' => _t('_adm_dbd_txt_ht_' . $sUnit)];
        }
    }

    protected function getDbSize()
    {
        $iTotalSize = 0;
        $oDb = BxDolDb::getInstance();

        $aTables = $oDb->getAll('SHOW TABLE STATUS');
        foreach($aTables as $aTable)
            $iTotalSize += $aTable['Data_length'] + $aTable['Index_length'];

        return $iTotalSize;
    }

    protected function getFolderSize($sPath)
    {
        $iTotalSize = 0;
        $aFiles = scandir($sPath);

        $sPath = rtrim($sPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        foreach($aFiles as $sFile) {
            if(is_dir($sPath . $sFile))
                  if($sFile != '.' && $sFile != '..')
                      $iTotalSize += $this->getFolderSize($sPath . $sFile);
            else
                  $iTotalSize += filesize($sPath . $sFile);
        }

        return $iTotalSize;
    }

    protected function getCacheChartData($bAsString = true)
    {
        $oCacheUtilities = BxDolCacheUtilities::getInstance();

        $aIcons = array('content' => 'file-text', 'db' => 'database', 'template' => 'layout-template', 'less' => 'braces', 'css' => 'palette', 'js' => 'code', 'purifier' => 'shield-check', 'opcache' => 'zap', 'custom' => 'box');

    	$aItems = array();
        $iTotal = 0;
    	foreach($this->aItemsCache as $aItem) {
            if($aItem['name'] == 'all')
                continue;

            $iSize = $oCacheUtilities->size($aItem['name']);
            if($iSize === false)
                continue;

            $iTotal += $iSize;
            $aItems[] = array(
                'name' => bx_process_output(_t('_adm_dbd_txt_c_' . $aItem['name'])),
                'bytes' => $iSize,
                'size' => _t_format_size($iSize),
                'icon' => $this->getChartIcon(isset($aIcons[$aItem['name']]) ? $aIcons[$aItem['name']] : 'box'),
                // the row's own clear button (dashboard.js showChart) when this cache can be cleared
                'type' => $aItem['name'],
                'clear' => $oCacheUtilities->isEnabled($aItem['name']) ? bx_process_output(_t('_adm_dbd_txt_c_clear_' . $aItem['name'])) : ''
            );
    	}

    	if(empty($aItems))
    		return false;

        // The hero shows the chart under its label, its three largest caches written under the bar, and the "clear all" button (dashboard.js showChart).
        $aChartData = $this->getChartData($aItems, $iTotal);
        $aChartData['label'] = bx_process_output(_t('_adm_dbd_txt_c_all'));
        $aChartData['top'] = 3;
        $aChartData['clear_all'] = bx_process_output(_t('_adm_dbd_txt_c_clear_all'));
        $aChartData['icon_clear'] = $this->getChartIcon('trash');

    	return $bAsString ? $this->getChartJson($aChartData) : $aChartData;
    }

    /**
     * Queues that installed modules add to the Queues block. A module implements serviceGetDashboardQueues() and returns
     * [id => ['name' => lang key, 'icon' => Lucide name, 'all' => COUNT query, 'failed' => COUNT query (optional),
     * 'action' => DELETE query (optional: without it the queue is listed but cannot be cleared)]]; the ids are prefixed
     * with the module name here, so 'clear_queue' can only ever run a query a module registered.
     */
    protected function getModulesQueues()
    {
        $aResult = array();

        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array('type' => 'modules'));
        foreach($aModules as $aModule) {
            if(empty($aModule['name']) || !bx_is_srv($aModule['name'], 'get_dashboard_queues'))
                continue;

            $aQueues = bx_srv($aModule['name'], 'get_dashboard_queues');
            if(!is_array($aQueues))
                continue;

            foreach($aQueues as $sId => $aQueue) {
                if(!is_array($aQueue) || empty($aQueue['name']) || empty($aQueue['all']))
                    continue;

                $aResult[$aModule['name'] . '_' . $sId] = array_merge(array('icon' => 'list', 'module' => $aModule['name']), $aQueue);
            }
        }

        return $aResult;
    }

    /**
     * The Queues block's list: a row per queue with its icon, the number of queued jobs, a note when some failed and a clear
     * button where the queue can be cleared; the headline totals the queued and failed jobs. No share bar (dashboard.js showChart).
     */
    protected function getQueuesChartData($bAsString = true)
    {
        $oDb = BxDolDb::getInstance();

        $aItems = array();
        $iQueued = $iFailed = 0;
        foreach($this->aItemsQueues as $sId => $aQueue) {
            $iAll = !empty($aQueue['all']) ? (int)$oDb->getOne($aQueue['all']) : 0;
            $iFail = !empty($aQueue['failed']) ? (int)$oDb->getOne($aQueue['failed']) : 0;

            $iQueued += $iAll;
            $iFailed += $iFail;

            $sName = _t($aQueue['name']);
            $aItems[] = array(
                'name' => bx_process_output($sName),
                'bytes' => $iAll,
                'size' => $iAll,
                'note' => $iFail > 0 ? bx_process_output(_t('_adm_dbd_txt_q_failed', $iFail)) : '',
                'note_alert' => true, // failed jobs: the note is a warning, not a count
                'icon' => $this->getChartIcon($aQueue['icon']),
                'type' => $sId,
                'clear' => !empty($aQueue['action']) ? bx_process_output(_t('_adm_dbd_txt_q_clear_item', $sName)) : ''
            );
        }

        if(empty($aItems))
            return false;

        // The hero: the chart under its label, and the "clear all" button under the bar (dashboard.js showChart), like the Cache block's.
        $aChartData = array(
            'items' => $aItems,
            'used_bytes' => $iQueued, // the bar (one slice per queue) is scaled to the queued total
            'label' => bx_process_output(_t('_adm_dbd_txt_q_all')),
            'top' => 3, // the three busiest queues under the bar, like the Cache block's three largest caches
            'top_zero' => true, // queues are usually empty; the line still shows the first counts
            'clear_all' => bx_process_output(_t('_adm_dbd_txt_q_clear_all')),
            'action' => 'clearQueue',
            'used' => bx_process_output(_t('_adm_dbd_txt_q_queued', $iQueued)),
            'total' => $iFailed > 0 ? bx_process_output(_t('_adm_dbd_txt_q_failed', $iFailed)) : '',
            'total_fail' => $iFailed > 0,
            'icon_clear' => $this->getChartIcon('trash')
        );

        return $bAsString ? $this->getChartJson($aChartData) : $aChartData;
    }

    /**
     * Chart data for the share charts: rows, the used size headline and, when known, the capacity the bar is scaled to.
     * Texts are HTML-escaped here because dashboard.js inserts them as HTML.
     */
    protected function getChartData($aItems, $iUsed, $fTotal = 0)
    {
        return array(
            'items' => $aItems,
            'used_bytes' => $iUsed,
            'used' => bx_process_output(_t('_adm_dbd_txt_chart_used', _t_format_size($iUsed))),
            'total_bytes' => $fTotal,
            'total' => $fTotal > 0 ? bx_process_output(_t('_adm_dbd_txt_chart_total', _t_format_size($fTotal))) : ''
        );
    }

    /**
     * Chart rows from labelled sizes, biggest first: name (HTML-escaped, dashboard.js inserts it as HTML), bytes, formatted size, icon,
     * and, when given, the page the row links to and a note shown before the size (a file count).
     */
    protected function getChartItems($aItems)
    {
        usort($aItems, function($a, $b) {
            return $b['value'] <=> $a['value'];
        });

        $aResult = array();
        foreach($aItems as $aItem)
            $aResult[] = array(
                'name' => bx_process_output(strip_tags($aItem['label'])),
                'bytes' => $aItem['value'],
                'size' => _t_format_size($aItem['value']),
                'icon' => $aItem['icon'],
                'url' => isset($aItem['url']) ? $aItem['url'] : '',
                'note' => isset($aItem['note']) ? bx_process_output($aItem['note']) : ''
            );

        return $aResult;
    }

    /**
     * Chart data as a JSON literal that is safe inside the block's inline <script>.
     */
    protected function getChartJson($aChartData)
    {
        return json_encode($aChartData, JSON_HEX_TAG | JSON_HEX_AMP);
    }

    /**
     * A chart row's icon: a module's own Studio icon by URL, or a Lucide glyph the chart draws on a gray tile.
     */
    protected function getChartIcon($sIcon, $bUrl = false)
    {
        if($bUrl)
            return array('url' => $sIcon);

        $oIconset = BxDolIconset::getObjectInstance('sys_lucide');
        $sSvg = $oIconset ? $oIconset->getIconHtml($sIcon) : false;
        return array('svg' => $sSvg !== false ? $sSvg : '');
    }
}

/** @} */
