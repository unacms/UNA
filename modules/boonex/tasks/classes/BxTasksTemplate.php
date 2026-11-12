<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

require_once('BxTasksMenuTimer.php');
require_once('BxTasksMenuTimers.php');

class BxTasksTemplate extends BxBaseModTextTemplate
{
    public function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_tasks';

        parent::__construct($oConfig, $oDb);
    }

    public function getJsCodeView($sType, $aParams = [], $mixedWrap = true)
    {
        $aParams = array_merge([
            'aHtmlIds' => $this->_oConfig->getHtmlIds()
        ], $aParams);

        return parent::getJsCode($sType, $aParams, $mixedWrap === true ? [
            'wrap' => true, 
            'mask' => '{var} {object} = new {class}({params}); {object}.init();'
        ] : $mixedWrap);
    }

    public function getJsCodeTimer($sType, $aParams = [], $mixedWrap = true)
    {
        $aParams = array_merge([
            'aHtmlIds' => $this->_oConfig->getHtmlIds()
        ], $aParams);

        if(is_array($mixedWrap))
            return parent::getJsCode($sType, $aParams, [
                'wrap' => true,
                'mask' => "{var} {object} = new {class}({params}); {object}.init({content_id}, {profile_id}, {started});",
                'mask_markers' => $mixedWrap
            ]);
        else
            parent::getJsCode($sType, $aParams, $mixedWrap);
    }

    public function getBlockMenuBrowse()
    {
        $CNF = &$this->_oConfig->CNF;

        $iProfileId = bx_get_logged_profile_id();

        $sMenuUse = $this->_bIsApi ? [] : '';
        if(($oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_USE_TOOLS_SUBMENU'])) !== false)
            $sMenuUse = $this->_bIsApi ? $oMenu->getCodeAPI() : $oMenu->getCode();

        $sMenuManage = $this->_bIsApi ? [] : '';
        if(($oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_MANAGE_TOOLS_SUBMENU'])) !== false)
            $sMenuManage = $this->_bIsApi ? $oMenu->getCodeAPI() : $oMenu->getCode();

        $sMenuBrowse = $this->_bIsApi ? [] : '';
        if(($oMenu = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_BROWSE'])) !== false) {
            $oMenu->setProfileId($iProfileId);
            $sMenuBrowse = $this->_bIsApi ? $oMenu->getCodeAPI() : $oMenu->getCode();
        }

        if($this->_bIsApi)
            return [
                'menu_use' => $sMenuUse,
                'menu_browse' => $sMenuBrowse,
                'menu_manage' => $sMenuManage
            ];

        return $this->parseHtmlByName('menu_browse.html', [
            'menu_use' => $sMenuUse,
            'bx_if:show_menu_browse' => [
                'condition' => $sMenuBrowse != '',
                'content' => [
                    'menu_browse' => $sMenuBrowse
                ]
            ],
            'bx_if:show_menu_manage' => [
                'condition' => $sMenuManage != '',
                'content' => [
                    'menu_manage' => $sMenuManage
                ]
            ]
        ]);
    }

    public function getBlockBudget($aBudget)
    {
        $iTotal = (int)$aBudget['value_total'];
        $iSpent = (int)$aBudget['value_spent'];

        $iRemains = $iRemainsPercent = 0;
        if($iTotal) {
            $iRemains = $iTotal - $iSpent;
            $iRemainsPercent = round(100 * $iRemains / $iTotal, 2);
        }

        if($this->_bIsApi)
            return [
                'total' => $iTotal,
                'spent' => $iSpent,
                'remains' => $iRemains,
                'remains_percent' => $iRemainsPercent
            ];

        return $this->parseHtmlByName('block_budget.html', [
            'total' => $this->_oConfig->timeI2S($iTotal),
            'spent' => $this->_oConfig->timeI2S($iSpent),
            'bx_if:show_remains' => [
                'condition' => $iRemains > 0,
                'content' => [
                    'remains' => _t('_bx_tasks_txt_budget_remains_value', $this->_oConfig->timeI2S($iRemains), $iRemainsPercent)
                ]
            ]
        ]);
    }

    /**
     * Use Gallery image for both because currently there is no Unit types with small thumbnails.
     */
    protected function getUnitThumbAndGallery ($aData)
    {
        list($sPhotoThumb, $sPhotoGallery) = parent::getUnitThumbAndGallery($aData);

        return array($sPhotoGallery, $sPhotoGallery);
    }

    public function entryAssignments ($aProfiles, $aParams = [])
    {
        $aUnitParamsDefault = ['template' => ['name' => $aParams['unit_name'] ?? 'unit', 'size' => $aParams['unit_size'] ?? 'thumb']];
                
        $aTmplVarsProfiles = [];
        foreach($aProfiles as $mixedProfile) {
            $bProfile = is_array($mixedProfile);

            $oProfile = BxDolProfile::getInstance($bProfile ? (int)$mixedProfile['id'] : (int)$mixedProfile);
            if(!$oProfile)
                continue;

            $aUnitParams = $aUnitParamsDefault;
            if($bProfile && is_array($mixedProfile['info']))
                $aUnitParams['template']['vars'] = $mixedProfile['info'];

            $aTmplVarsProfiles[] = $this->_bIsApi ? BxDolProfile::getData($oProfile) : [
                'unit' => $oProfile->getUnit(0, $aUnitParams)
            ];
        }

        if($this->_bIsApi)
            return $aTmplVarsProfiles;

        return $aTmplVarsProfiles ? $this->parseHtmlByName('entry-assignments.html', [
            'bx_repeat:profiles' => $aTmplVarsProfiles
        ]) : MsgBox(_t('_sys_txt_empty'));
    }

    public function entryTimer ($iContentId, $iProfileId)
    {
        $mixedResult = $this->getTimer($iContentId, $iProfileId);
        if($this->_bIsApi || empty($mixedResult))
            return $mixedResult;

        $this->addCss(['timer.css']);
        $this->addJs(['timer.js']);
        return $mixedResult . $this->getJsCodeTimer('timer', [], [
            'content_id' => $iContentId,
            'profile_id' => $iProfileId,
            'started' => $this->_oDb->isTimerStarted($iContentId, $iProfileId),
        ]);
    }

    public function getBlockTimers ($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $oModule = $this->getModule();
        $sJsObject = $this->_oConfig->getJsObject('timer');

        //--- NEO reloads the block from here when a timer changes on another screen.
        $sRequestUrl = $this->MODULE . '/get_block_timers';

        $aTimers = $this->_oDb->getTimers(['sample' => 'profile_id', 'profile_id' => $iProfileId]);
        if(!$aTimers || !is_array($aTimers))
            return $this->_bIsApi ? ['sections' => [], 'request_url' => $sRequestUrl] : MsgBox(_t('_Empty'));

        $oPermalinks = BxDolPermalinks::getInstance();

        $sTimerName = 'hor-sm';
        $sTimersKey = $this->_bIsApi ? 'timers' : 'bx_repeat:timers';

        $aTmplVarsSections = [];
        foreach($aTimers as $aTimer) {
            $aContentInfo = $this->_oDb->getContentInfoById($aTimer['content_id']);
            if(!$aContentInfo || !is_array($aContentInfo))
                continue;

            //--- A timer left from a role that could log time in that context.
            $mixedTimer = $this->getTimer($aTimer['content_id'], $iProfileId, $sTimerName);
            if(empty($mixedTimer))
                continue;

            $sContextType = '';
            $aTmplVarsContext = [];
            if(($iAllowViewTo = (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) < 0 && ($oContext = BxDolProfile::getInstance(abs($iAllowViewTo))) !== false) {
                $sContextType = $oContext->getModule();
                $aTmplVarsContext = $this->_bIsApi ? BxDolProfile::getData($oContext) : [
                    'title' => $oContext->getDisplayName(),
                    'url' => $oContext->getUrl()
                ];
            }

            $sUrl = bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']]));

            if(!isset($aTmplVarsSections[$sContextType]))
                $aTmplVarsSections[$sContextType] = [
                    'section_title' => $oModule->getModuleTitle($sContextType),
                    $sTimersKey => []
                ];

            $aTmplVarsSections[$sContextType][$sTimersKey][] = array_merge([
                'content_title' => $aContentInfo[$CNF['FIELD_TITLE']],
                'content_url' => $this->_bIsApi ? bx_api_get_relative_url($sUrl) : $sUrl,
                'timer' => $mixedTimer,
            ], $this->_bIsApi ? [
                'context' => $aTmplVarsContext,
            ] : [
                'bx_if:show_context' => [
                    'condition' => !empty($aTmplVarsContext),
                    'content' => $aTmplVarsContext
                ],
                'js_code_timer' => $sJsObject . '.init(' . $aTimer['content_id'] . ', ' . $iProfileId . ', ' . ($aTimer['started'] != 0 ? 1 : 0) . ');'
            ]);
        }
        $aTmplVarsSections = array_values($aTmplVarsSections);

        $oActions = new BxTasksMenuTimers([
            'object' => str_replace('_', '-', $this->_oConfig->getName()) . '_timers',
            'template' => 'menu_custom_hor.html', 
            'menu_id' => $this->_oConfig->getHtmlIds('timers_actions'), 
            'persistent' => 0
        ]);
        $oActions->setParams($iProfileId);
        
        if($this->_bIsApi)
            return [
                'sections' => $aTmplVarsSections,
                'actions' => $oActions->getCodeAPI(),
                'request_url' => $sRequestUrl
            ];

        $this->addCss(['forms.css', 'timer.css']);
        $this->addJs(['timer.js']);
        return $this->parseHtmlByName('browse_timers.html', [
            'js_code' => $this->getJsCode('timer', [
                'sName' => $sTimerName,
                'bMulti' => true
            ]),
            'bx_repeat:sections' => $aTmplVarsSections,
            'actions' => $oActions->getCode()
        ]);
    }

    public function getBlockTimersStats ($iProfileId)
    {
        $aPeriods = [];
        foreach($this->_getTimersPeriods() as $sName => $aPeriod)
            $aPeriods[] = $this->_getTimersStatsPeriod($sName, $aPeriod['title'], $iProfileId, $aPeriod['from'], $aPeriod['to']);

        return [
            'periods' => $aPeriods,
            'labels' => [
                'total' => _t('_bx_tasks_txt_timers_stats_total'),
                'tasks' => _t('_bx_tasks_txt_timers_stats_tasks'),
                'show_more' => _t('_bx_tasks_txt_timers_stats_show_more'),
                'empty' => _t('_bx_tasks_txt_timers_stats_empty'),
            ],
            'request_url' => $this->MODULE . '/get_block_timers_stats'
        ];
    }

    protected function _getTimersPeriods ()
    {
        $iMonth = (int)date('n');
        $iYear = (int)date('Y');
        $iDay = (int)date('j');
        $iWeekDay = (int)date('N');

        $iThisMonth = mktime(0, 0, 0, $iMonth, 1, $iYear);

        return [
            'today' => [
                'title' => _t('_bx_tasks_txt_timers_stats_today'),
                'from' => mktime(0, 0, 0, $iMonth, $iDay, $iYear),
                'to' => mktime(0, 0, 0, $iMonth, $iDay + 1, $iYear)
            ],
            'this_week' => [
                'title' => _t('_bx_tasks_txt_timers_stats_this_week'),
                'from' => mktime(0, 0, 0, $iMonth, $iDay - $iWeekDay + 1, $iYear),
                'to' => mktime(0, 0, 0, $iMonth, $iDay - $iWeekDay + 8, $iYear)
            ],
            'this_month' => [
                'title' => _t('_bx_tasks_txt_timers_stats_this_month'),
                'from' => $iThisMonth,
                'to' => mktime(0, 0, 0, $iMonth + 1, 1, $iYear)
            ],
            'last_month' => [
                'title' => _t('_bx_tasks_txt_timers_stats_last_month'),
                'from' => mktime(0, 0, 0, $iMonth - 1, 1, $iYear),
                'to' => $iThisMonth
            ],
        ];
    }

    public function getBlockTimeSummary ($iContentId, $iProfileId, $aRights)
    {
        $oModule = $this->getModule();
        list($bEverybody, $bLogged, $bBilled) = $this->_getTimeSummaryScope($aRights);

        $aPeople = [];
        foreach($this->_oDb->getTimeTracks(['sample' => 'object_id', 'object_id' => $iContentId]) as $aTrack) {
            $iAuthorId = (int)$aTrack['author_id'];
            if(!$bEverybody && $iAuthorId != $iProfileId)
                continue;

            if(!isset($aPeople[$iAuthorId]))
                $aPeople[$iAuthorId] = array_merge($this->_getTimeSummaryTotals(), ['profile' => BxDolProfile::getData($iAuthorId), 'logs' => []]);

            $aSummaryTrack = ['value' => (int)$aTrack['value'], 'billed' => $oModule->getTrackBilled($aTrack), 'timer' => !empty($aTrack['by_timer']) ? (int)$aTrack['value_original'] : 0];
            $this->_addTimeSummaryTrack($aPeople[$iAuthorId], $aSummaryTrack);

            $iOriginal = (int)($aTrack['value_original'] ?? $aTrack['value']);
            $aPeople[$iAuthorId]['logs'][] = [
                'id' => (int)$aTrack['id'],
                'minutes' => $aSummaryTrack['value'],
                'original' => $iOriginal != $aSummaryTrack['value'] ? $iOriginal : null,
                'by_timer' => !empty($aTrack['by_timer']),
                'billed' => $aSummaryTrack['billed'],
                'date' => (int)$aTrack['value_date'] ?: (int)$aTrack['date'],
                'text' => $aTrack['text'],
            ];
        }

        //--- Those who see everybody keep the block on a task without time, so it is there for the first log.
        if(!$aPeople && !$bEverybody)
            return [];

        $aPeriod = array_merge($this->_getTimeSummaryTotals(), ['name' => 'all_time', 'title' => '']);
        foreach($aPeople as $aPerson)
            foreach(array_keys($this->_getTimeSummaryTotals()) as $sKey)
                $aPeriod[$sKey] += $aPerson[$sKey];

        $aPeriod['people'] = $this->_sortTimeSummary($aPeople, $bLogged);

        return $this->_filterTimeSummary([
            'periods' => [$aPeriod],
            'columns' => ['logged' => $bLogged, 'billed' => $bBilled],
            'labels' => $this->_getTimeSummaryLabels(),
            'request_url' => $this->MODULE . '/get_block_time_summary/&params[]=' . $iContentId
        ], $bLogged, $bBilled);
    }

    /**
     * $sMethod is the service the block reloads from: the Billing tab's block (Billed time only) comes the same way.
     * $sType 'my' (the My Time tab) is the viewer's own time only, whatever they may see of the others'.
     */
    public function getBlockTimeSummaryContext ($iContextPid, $iProfileId, $aRights, $sMethod = 'get_block_time_summary_context', $sType = '')
    {
        $CNF = &$this->_oConfig->CNF;

        $aPeriods = array_merge($this->_getTimersPeriods(), [
            'all_time' => ['title' => _t('_bx_tasks_txt_timers_stats_all_time'), 'from' => 0, 'to' => PHP_INT_MAX]
        ]);

        list($bEverybody, $bLogged, $bBilled) = $this->_getTimeSummaryScope($aRights);
        if($sType == 'my') {
            $bEverybody = false;
            $bLogged = true;
        }

        //--- One row per person and task, with the Logged and Billed sums for each period.
        $aSums = $this->_oDb->getTimeTracks(array_merge([
            'sample' => 'context_period_sums', 
            'context_id' => $iContextPid, 
            'periods' => $aPeriods
        ], $bEverybody ? [] : ['author_id' => $iProfileId]));
        if(!$aSums && !$bEverybody)
            return [];

        $oPermalinks = BxDolPermalinks::getInstance();

        $aProfiles = $aUrls = [];

        $aResult = [];
        foreach($aPeriods as $sName => $aPeriod) {
            $aPeople = [];
            $aTotals = $this->_getTimeSummaryTotals();

            foreach($aSums as $aSum) {
                if(empty($aSum[$sName]) && empty($aSum[$sName . '_billed']))
                    continue;

                $aTrack = ['value' => (int)$aSum[$sName], 'billed' => (int)$aSum[$sName . '_billed'], 'timer' => (int)$aSum[$sName . '_timer'], 'object_title' => $aSum['object_title']];
                $iAuthorId = (int)$aSum['author_id'];
                $iObjectId = (int)$aSum['object_id'];

                if(!isset($aPeople[$iAuthorId]))
                    $aPeople[$iAuthorId] = array_merge($this->_getTimeSummaryTotals(), [
                        'profile' => $aProfiles[$iAuthorId] ??= BxDolProfile::getData($iAuthorId),
                        'tasks' => []
                    ]);

                if(!isset($aPeople[$iAuthorId]['tasks'][$iObjectId]))
                    $aPeople[$iAuthorId]['tasks'][$iObjectId] = array_merge($this->_getTimeSummaryTotals(), [
                        'id' => $iObjectId,
                        'title' => $aTrack['object_title'],
                        'url' => $aUrls[$iObjectId] ??= bx_api_get_relative_url(bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iObjectId))),
                    ]);

                $this->_addTimeSummaryTrack($aTotals, $aTrack);
                $this->_addTimeSummaryTrack($aPeople[$iAuthorId], $aTrack);
                $this->_addTimeSummaryTrack($aPeople[$iAuthorId]['tasks'][$iObjectId], $aTrack);
            }

            foreach($aPeople as $iAuthorId => $aPerson)
                $aPeople[$iAuthorId]['tasks'] = $this->_sortTimeSummary($aPerson['tasks'], $bLogged);

            $aResult[] = array_merge($aTotals, [
                'name' => $sName,
                'title' => $aPeriod['title'],
                'people' => $this->_sortTimeSummary($aPeople, $bLogged)
            ]);
        }

        return $this->_filterTimeSummary([
            'periods' => $aResult,
            'default_period' => 'this_month',
            'columns' => ['logged' => $bLogged, 'billed' => $bBilled],
            'labels' => $this->_getTimeSummaryLabels(),
            'request_url' => $this->MODULE . '/' . $sMethod . '/&params[]=' . $iContextPid . ($sType ? '&params[]=' . $sType : '')
        ], $bLogged, $bBilled);
    }

    /**
     * Whose time a viewer sees and which of it: those who see Logged or Billed time of everybody get everybody,
     * the others their own Logged time.
     */
    protected function _getTimeSummaryScope ($aRights)
    {
        $bEverybody = !empty($aRights['view_logged_any']) || !empty($aRights['view_billed']);
        $bLogged = !empty($aRights['view_logged_any']) || !$bEverybody;
        $bBilled = !empty($aRights['view_billed']);

        return [$bEverybody, $bLogged, $bBilled];
    }

    protected function _getTimeSummaryTotals ()
    {
        //--- `timer` is the time timers logged (as first logged); the Logged time (`minutes`) less it is what was entered or changed by hand, + or -.
        return ['minutes' => 0, 'timer' => 0, 'billed' => 0];
    }

    protected function _addTimeSummaryTrack (&$aSummary, $aTrack)
    {
        $aSummary['minutes'] += (int)$aTrack['value'];
        $aSummary['timer'] += (int)($aTrack['timer'] ?? 0);
        $aSummary['billed'] += (int)$aTrack['billed'];
    }

    protected function _sortTimeSummary ($aItems, $bLogged = true)
    {
        $sKey = $bLogged ? 'minutes' : 'billed';
        usort($aItems, function($aA, $aB) use ($sKey) {
            return $aB[$sKey] <=> $aA[$sKey];
        });

        return $aItems;
    }

    /**
     * Time the viewer may not see doesn't leave the server: Logged (`minutes`, `original`) or Billed (`billed`).
     */
    protected function _filterTimeSummary ($aData, $bLogged, $bBilled)
    {
        $aRemove = array_merge($bLogged ? [] : ['minutes', 'original', 'timer', 'by_timer'], $bBilled ? [] : ['billed']);
        if(!$aRemove)
            return $aData;

        $fFilter = function($aNode) use (&$fFilter, $aRemove) {
            foreach($aNode as $sKey => $mixedValue) {
                if(in_array($sKey, $aRemove, true))
                    unset($aNode[$sKey]);
                else if(is_array($mixedValue) && !in_array($sKey, ['profile', 'labels', 'columns'], true))
                    $aNode[$sKey] = $fFilter($mixedValue);
            }

            return $aNode;
        };

        return $fFilter($aData);
    }

    protected function _getTimeSummaryLabels ()
    {
        return [
            'total' => _t('_bx_tasks_txt_timers_stats_total'),
            'logged' => _t('_bx_tasks_txt_time_logged'),
            'billed' => _t('_bx_tasks_txt_time_billed'),
            'original' => _t('_bx_tasks_txt_time_original'),
            'by_timer' => _t('_bx_tasks_txt_time_by_timer'),
            'by_hand' => _t('_bx_tasks_txt_time_by_hand'),
            'empty' => _t('_bx_tasks_txt_timers_stats_empty'),
        ];
    }

    protected function _getTimersStatsPeriod ($sName, $sTitle, $iProfileId, $iDateFrom, $iDateTo)
    {
        $CNF = &$this->_oConfig->CNF;

        $oModule = $this->getModule();
        $oPermalinks = BxDolPermalinks::getInstance();

        $aTracks = $this->_oDb->getTimeTracks([
            'sample' => 'author_period_sum',
            'author_id' => $iProfileId,
            'date_from' => $iDateFrom,
            'date_to' => $iDateTo
        ]);

        $iTotal = 0;
        $aTasks = $aContexts = [];
        foreach($aTracks as $aTrack) {
            $aContentInfo = $this->_oDb->getContentInfoById($aTrack['object_id']);
            if(!$aContentInfo || !is_array($aContentInfo))
                continue;

            $iTotal += (int)$aTrack['value'];

            //--- The time stays in the total, but a task the viewer can't access any more isn't named.
            if($oModule->checkAllowedViewForProfile($aContentInfo, $iProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
                continue;

            $iContextId = abs(min(0, (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]));
            if($iContextId && !isset($aContexts[$iContextId]))
                $aContexts[$iContextId] = ($oContext = BxDolProfile::getInstance($iContextId)) !== false ? BxDolProfile::getData($oContext) : [];

            $aTasks[] = [
                'id' => (int)$aContentInfo[$CNF['FIELD_ID']],
                'title' => $aContentInfo[$CNF['FIELD_TITLE']],
                'url' => bx_api_get_relative_url(bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']]))),
                'minutes' => (int)$aTrack['value'],
                'context' => $iContextId ? $aContexts[$iContextId] : [],
            ];
        }

        return [
            'name' => $sName,
            'title' => $sTitle,
            'minutes' => $iTotal,
            'tasks' => $aTasks
        ];
    }

    public function getTimer ($iContentId, $iProfileId, $sName = '')
    {
        $CNF = &$this->_oConfig->CNF;

        $sPrefix = str_replace('_', '-', $this->_oConfig->getName());
        $sJsObject = $this->_oConfig->getJsObject('timer');

        //--- No timer for those who may not log time here (clients).
        if(!$this->getModule()->getTimeRightsByContentId($iContentId, $iProfileId)['log'])
            return $this->_bIsApi ? [] : '';

        $aTimer = $this->_oDb->getTimers(['sample' => 'content_profile_ids', 'content_id' => $iContentId, 'profile_id' => $iProfileId]);
        $bTimer = $aTimer && is_array($aTimer);
        $bStarted = $bTimer && (int)$aTimer['started'] > 0;

        $iHours = $iMinutes = $iSeconds = 0;
        if($bTimer) {
            $iDuration = (int)$aTimer['duration'];
            if($bStarted)
                $iDuration += time() - (int)$aTimer['started'];

            list($iHours, $iMinutes, $iSeconds) = $this->_oConfig->timeI2A($iDuration, true);
        }

        $oActions = new BxTasksMenuTimer([
            'object' => $sPrefix . '_timer',
            'template' => 'menu_custom_hor.html', 
            'menu_id' => $this->_oConfig->getHtmlIds('timer_actions'), 
            'title_public' => '',
            'config_api' => [],
            'persistent' => 0
        ]);
        $oActions->setParams($iContentId, $iProfileId);

        if($this->_bIsApi) {
            $sState = '';
            if($bStarted)
                $sState = 'started';
            else if($bTimer) 
                $sState = 'paused';

            return [
                'id' => $bTimer ? $aTimer['id'] : 0,
                'time' => [
                    'hours' => $iHours,
                    'minutes' => $iMinutes,
                    'seconds' => $iSeconds,
                ],
                'state' => $sState,
                'request_url' => $this->MODULE . '/process_timer/&params[]=reload&params[]=' . $iContentId . '&params[]=' . $iProfileId, 
                'actions' => $oActions->getCodeAPI()
            ];
        }

        return $this->parseHtmlByName('entry-timer' . ($sName ? '-' . $sName : '') . '.html', [
            'html_id' => $this->_oConfig->getHtmlIds('timer') . $iContentId . '-' . $iProfileId,
            'hours' => sprintf("%02d", $iHours),
            'minutes' => sprintf("%02d", $iMinutes),
            'seconds' => sprintf("%02d", $iSeconds),
            'actions' => $oActions->getCode()
        ]);
    }

    public function getEntriesList($iContextId = 0, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;
        $sJsObject = $this->_oConfig->getJsObject('tasks');

        $iLoggedId = bx_get_logged_profile_id();
        $oModule = $this->getModule();

        $bContext = !empty($iContextId);
        $bAllowAdd = $bContext && $oModule->isAllowAdd($iContextId);

        $aFilters = [];
        if(($sFilters = $_COOKIE[$CNF['COOKIE_SETTING_KEY']] ?? false))
            $aFilters = json_decode($sFilters, true);
        $iFilterSelected = $aParams['filter'] ?? ($aFilters[$iContextId] ?? 0);

        $mixedFilters = $this->_getEntriesFilters($iContextId, array_merge($aParams, ['filter_selected' => $iFilterSelected]));

        $aEntries = $this->getEntries($iContextId, array_merge($aParams, [
            'filter' => $iFilterSelected,
        ]));

        if($this->_bIsApi) {
            $aActions = [];
            if($bAllowAdd)
                $aActions = array_merge($aActions, [[
                    'name' => 'add_list', 
                    'title' => _t('_bx_tasks_txt_new_task_list'),
                    'type' => 'modal', 
                    'callback' => $this->MODULE . '/process_task_list_form&params[]=' . $iContextId . '&params[]=0',
                ], [
                    'name' => 'add_task', 
                    'title' => _t('_bx_tasks_txt_new_task'),
                    'type' => 'modal', 
                    'callback' => $this->MODULE . '/process_task_form&params[]=' . $iContextId . '&params[]=0',
                ]]);

            return [
                'context_id' => $iContextId,
                'filters' => $mixedFilters,
                'lists' => $aEntries,
                'actions' => $aActions,
                'request_url' => $this->MODULE . '/' . ($bContext ? 'browse_context' : 'browse_tasks_by_profile') . '&params[]=' . ($bContext ? $iContextId : $iLoggedId),
            ];
        }

        $this->addCssJs();
        $this->addJs([
            'jquery-ui/jquery-ui.min.js',
            'tasks.js',
            'modules/base/general/js/|forms.js'
        ]);

        return $this->parseHtmlByName('browse_tasks.html', [
            'object' => $sJsObject,
            'context_id' => $iContextId,
            'bx_if:show_filters' => [
                'condition' => !empty($mixedFilters),
                'content' => [
                    'object' => $sJsObject,
                    'context_id' => $iContextId,
                    'filters' => $mixedFilters
                ]
            ],
            'bx_if:allow_add_list' => [
                'condition' => $bAllowAdd,
                'content' => [
                    'context_id' => $iContextId,
                    'object' => $sJsObject,
                ]
            ],
            'bx_if:allow_add_task' => [
                'condition' => $bAllowAdd,
                'content' => [
                    'context_id' => $iContextId,
                    'object' => $sJsObject,
                ]
            ],
            'task_lists' => $aEntries,
            'js_code' => $this->getJsCodeView('tasks', ['t_confirm_block_deletion' => _t('_bx_tasks_txt_msg_confirm_tasklist_deletion')])
        ]);
    }
    
    public function getEntries($iContextId = 0, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;
        $sJsObject = $this->_oConfig->getJsObject('tasks');

        $oModule = $this->getModule();
        $oPermalinks = BxDolPermalinks::getInstance();
        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);

        $aTypes = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_TYPES']);
        $aPriorities = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_PRIORITIES']);
        $aStates = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_STATES']);

        $bContext = !empty($iContextId);
        $bAllowAdd = $bContext && $oModule->isAllowAdd($iContextId);
        $bAllowManage = $bContext && $oModule->isAllowManageByContext($iContextId);
        $bShowManage = false; //--- Hidden for now.

        $iProfileId = bx_get_logged_profile_id();

        $aLists = [];
        if(!$bContext) {
            $iProfile = $aParams['for_profile'] ?? $iProfileId;

            $aContexts = $this->_oModule->getContexts();
            foreach($aContexts as $sName => $sTitle) {
                $aIds = $this->_oModule->_oDb->getContextsIdsByType($sName, $iProfile);
                foreach($aIds as $iId) {
                    $oContext = BxDolProfile::getInstance($iId);
                    if(!$oContext)
                        continue;

                    $aLists[] = [
                        'id' => $iId,
                        'title' => _t('_bx_tasks_txt_list_title', $oContext->getDisplayName(), $sTitle)
                    ];
                }
            }
        }
        else {
            $aListInbox = ['id' => 0, 'title' => _t('_bx_tasks_txt_list_inbox')];

            if(($iListId = $aParams['list'] ?? false) === false) {
                $aLists[] = $aListInbox;
                if(($aListsAdd = $this->_oDb->getLists($iContextId)) && is_array($aListsAdd))
                    $aLists = array_merge($aLists, $aListsAdd);
            }
            else
                $aLists[] = $iListId != 0 ? $this->_oDb->getList($iListId) : $aListInbox;
        }

        $aParams = array_merge($aParams, [
            'with_stats' => true
        ]);

        $aTmplVarsLists = [];
        foreach($aLists as $aList) {
            $iTasksContextId = $bContext ? $iContextId : ($aList['id'] ?? false);
            if(!$iTasksContextId)
                continue;

            $bTasksAllowManage = $bContext ? $bAllowManage : $oModule->isAllowManageByContext($iTasksContextId);

            //--- Those who see Billed time but not everybody's Logged time (clients) get the Billed total.
            $aTimeRights = $oModule->getTimeRights($iTasksContextId);
            $bTotalBilled = $aTimeRights['view_billed'] && !$aTimeRights['view_logged_any'];

            $aTasks = $this->_oDb->getTasks($iTasksContextId, $bContext ? $aList['id'] : false, $aParams);
            if((!$aTasks || !is_array($aTasks)) && (($bContext && !$aList['id']) || !$bTasksAllowManage))
                continue;

            $aTmplVarsTasks = [];
            foreach($aTasks as $aTask) {
                $iTaskId = (int)$aTask[$CNF['FIELD_ID']];

                $sTime = '';
                if($bTotalBilled) {
                    if(!empty($aTask['time_billed']))
                        $sTime = _t('_bx_tasks_txt_total', $this->_oConfig->timeI2S($aTask['time_billed']));
                }
                else if(!empty($aTask['time_total']))
                    $sTime = _t('_bx_tasks_txt_total', $this->_oConfig->timeI2S($aTask['time_total']) . (!empty($aTask['time']) ? ' (' . $this->_oConfig->timeI2S($aTask['time']) . ')' : ''));
                if(!empty($aTask['estimate']))
                    $sTime .= ' ' . _t('_bx_tasks_txt_estimate', $this->_oConfig->timeI2S(60 * (int)$aTask['estimate']));

                $aMembers = $oConnection->getConnectedInitiators($iTaskId);

                $aTmplVarsMembers = [];
                foreach($aMembers as $iMember)
                    if(($oProfile = BxDolProfile::getInstance($iMember)) !== false && !($oProfile instanceof BxDolProfileUndefined))
                        $aTmplVarsMembers[] = $this->_bIsApi ? BxDolProfile::getData($oProfile) : ['info' => $oProfile->getUnit(0, ['template' => 'unit_wo_info'])];

                $bCompleted = $aTask[$CNF['FIELD_COMPLETED']] == 1;
                $sUrl = bx_absolute_url($oPermalinks->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $iTaskId));

                $aActions = [];
                if($this->_bIsApi && $bShowManage && $bTasksAllowManage)
                    $aActions[] = [
                        'name' => 'set_completed', 
                        'title' => _t('_bx_tasks_menu_item_title_set_' . ($bCompleted ? 'uncompleted' : 'completed')),
                        'type' => 'callback', 
                        'callback' => $this->MODULE . '/set_completed&params[]=' . $iTaskId . '&params[]=' . ($bCompleted ? 0 : 1),
                        'on_callback' => 'refresh'
                    ];

                $aTmplVarsTasks[] = array_merge([
                    'id' => $iTaskId,
                    'title' => bx_process_output($aTask[$CNF['FIELD_TITLE']]),
                    'created' => $aTask[$CNF['FIELD_ADDED']],
                    'class' => $bCompleted ? 'completed' : 'uncompleted',
                    'due' => $aTask[$CNF['FIELD_DUE_DATE']] ?: '',
                    'type' => $aTypes[$aTask[$CNF['FIELD_TYPE']]] ?? '',
                    'priority' => $aPriorities[$aTask[$CNF['FIELD_PRIORITY']]] ?? '',
                    'state' => $aStates[$aTask[$CNF['FIELD_STATE']]] ?? '',
                    'time' => $sTime,
                    'badges' => $oModule->serviceGetBadges($iTaskId, true),
                    'url' => $sUrl
                ], $this->_bIsApi ? [
                    'url' => bx_api_get_relative_url($sUrl),
                    'completed' => $bCompleted ? 1 : 0,
                    'allow_log_time' => $aTimeRights['log'],
                    'members' => $aTmplVarsMembers,
                    'actions' => $aActions
                ] : [
                    'created' => bx_time_js($aTask[$CNF['FIELD_ADDED']]),
                    'due' => $aTask[$CNF['FIELD_DUE_DATE']] > 0 ? bx_time_js($aTask[$CNF['FIELD_DUE_DATE']]) : '',
                    'object' => $sJsObject,
                    'bx_repeat:members' => $aTmplVarsMembers,
                    'bx_if:show_manage' => [
                        'condition' => $bShowManage,
                        'content' => [
                            'bx_if:allow_manage' => [
                                'condition' => $bTasksAllowManage,
                                'content' => [
                                    'id' => $iTaskId,
                                    'object' => $sJsObject,
                                    'checked' => $bCompleted ? 'checked' : '',
                                ]
                            ],
                            'bx_if:deny_manage' => [
                                'condition' => !$bTasksAllowManage,
                                'content' => [
                                    'id' => $iTaskId,
                                    'checked' => $bCompleted ? 'checked' : '',
                                ]
                            ]
                        ]
                    ]
                ]);
            }

            $iListId = (int)$aList[$CNF['FIELD_LIST_ID']];

            if($this->_bIsApi) {
                $aActions = [];
                if($bAllowAdd)
                    $aActions = array_merge($aActions, [[
                        'name' => 'edit_list', 
                        'title' => _t('_bx_tasks_txt_edit_task_list'),
                        'type' => 'modal', 
                        'callback' => $this->MODULE . '/process_task_list_form&params[]=' . $iTasksContextId . '&params[]=' . $iListId,
                    ], [
                        'name' => 'add_task', 
                        'title' => _t('_bx_tasks_txt_new_task'),
                        'type' => 'modal', 
                        'callback' => $this->MODULE . '/process_task_form&params[]=' . $iTasksContextId . '&params[]=' . $iListId,
                    ]]);
                
                if($bAllowManage)
                    $aActions[] = [
                        'name' => 'delete_list', 
                        'title' => _t('_bx_tasks_txt_delete_task_list'),
                        'type' => 'callback', 
                        'callback' => $this->MODULE . '/delete_task_list&params[]=' . $iTasksContextId . '&params[]=' . $iListId,
                        'on_callback' => 'hide_row'
                    ];

                $aTmplVarsLists[] = [
                    'context_id' => $iTasksContextId,
                    'list_id' => $iListId,
                    'list_title' => $aList[$CNF['FIELD_LIST_TITLE']],
                    'tasks' => $aTmplVarsTasks,
                    'actions' => $aActions
                ];

                continue;
            }
            
            $sClass = $sCompleted = $sAll = "";
            if (isset($aFilterValues[$iListId])){
                $sClass = $aFilterValues[$iListId];
                if ($sClass == 'completed')
                    $sCompleted= 'selected';
                if ($sClass == 'all')
                    $sAll = 'selected';
            }

            $aTmplVarsAllowEditList = $aTmplVarsAllowAdd = [];
            if($bAllowAdd) {
                $aTmplVarsAllowEditList = [
                    'title' => $aList[$CNF['FIELD_LIST_TITLE']],
                    'context_id' => $iTasksContextId,
                    'list_id' => $iListId,
                    'object' => $sJsObject,
                ];
                
                $aTmplVarsAllowAdd = [
                    'context_id' => $iTasksContextId,
                    'list_id' => $iListId,
                    'object' => $sJsObject,
                ];
            }
            
            $aTmplVarsAllowDeleteList = [];
            if($bAllowManage) {
                $aTmplVarsAllowDeleteList = [
                    'context_id' => $iTasksContextId,
                    'list_id' => $iListId,
                    'object' => $sJsObject,
                ];
            }

            $aTmplVarsLists[] = [
                'bx_if:allow_edit_list' => [
                    'condition' => $bAllowAdd,
                    'content' => $aTmplVarsAllowEditList
                ],
                'bx_if:allow_add' => [
                    'condition' => $bAllowAdd,
                    'content' => $aTmplVarsAllowAdd
                ],
                'bx_if:allow_delete_list' => [
                    'condition' => $bAllowManage,
                    'content' => $aTmplVarsAllowDeleteList
                ],
                'bx_if:deny_edit_list' => [
                    'condition' => !$bAllowAdd,
                    'content' => [
                        'title' => $aList[$CNF['FIELD_LIST_TITLE']],
                    ]
                ],
                'bx_repeat:tasks' =>  $aTmplVarsTasks,
                'list_id' => $iListId,
                'list_by_viewer' => ($bContext ? 'l' : 'c') . $iListId . '-' . $iProfileId,
                'object' => $sJsObject
            ];
        }

        if($this->_bIsApi)
            return $aTmplVarsLists;

        return $this->parseHtmlByName('tasks.html', [
            'html_id' => $this->_oConfig->getHtmlIds('tasks'),
            'bx_repeat:task_lists' => $aTmplVarsLists,
        ]);
    }

    public function getStickers($aStickers)
    {
        $aTmplVarsStickers = [];
        foreach($aStickers as $aSticker)
            $aTmplVarsStickers[] = [
                'title' => $aSticker['title'],
                'bx_if:show_color' => [
                    'condition' => $aSticker['color'] != '',
                    'content' => [
                        'color' => $aSticker['color']
                    ]
                ]
            ];

        return $this->parseHtmlByName('stickers.html', [
            'bx_repeat:stickers' => $aTmplVarsStickers
        ]);
    }

    protected function _getEntriesFilters($iContextId = 0, $aParams = [])
    {
        $sJsObject = $this->_oConfig->getJsObject('tasks');
        $iLoggedId = bx_get_logged_profile_id();
        $bShowTemporary = $aParams['show_temporary'] ?? false;

        $this->_oDb->cleanFilters($iContextId, $iLoggedId);

        $aInput = [
            'type' => 'select', 
            'name' => 'filters',
            'area_label' => '_bx_tasks_filter_title_select',
            'value' => $aParams['filter_selected'] ?? 0,
            'values' => [
                ['key' => 0, 'value' => _t('_bx_tasks_filter_title_select')]
            ],  
            'attrs' => [
                'onchange' => $sJsObject . '.applyFilter(this, ' . $iContextId . ')'
            ]
        ];

        $aTypes = [
            '_bx_tasks_txt_flt_system' => ['sample' => 'active', 'context_id' => 0, 'author' => 0],
            '_bx_tasks_txt_flt_contextual' => ['sample' => 'active', 'context_id' => $iContextId, 'author' => 0],
            '_bx_tasks_txt_flt_my_permanent' => ['sample' => 'active', 'context_id' => $iContextId, 'author' => $iLoggedId, 'permanent' => 1],
        ];
        if($bShowTemporary)
            $aTypes['_bx_tasks_txt_flt_my_temporary'] = ['sample' => 'active', 'context_id' => $iContextId, 'author' => $iLoggedId, 'permanent' => 0];

        foreach($aTypes as $sTitle => $aType) {
            $aFilterItems = $this->_oDb->getFilters($aType);
            if($aFilterItems && is_array($aFilterItems)) {
                $aInput['values'][] = ['type' => 'group_header', 'value' => _t($sTitle)];
                foreach($aFilterItems as $aFilterItem)
                    $aInput['values'][] = [
                        'key' => $aFilterItem['id'], 
                        'value' => _t($aFilterItem['title'])
                    ];
                $aInput['values'][] = ['type' => 'group_end'];
            }
        }

        if($this->_bIsApi)
            return [
                'values' => $aInput['values'],
                'value' => $aInput['value'],
                'request_url_add' => $this->MODULE . '/create_filter&params[]=' . $iContextId,
                'request_url_apply' => $this->MODULE . '/apply_filter&params[]=' . $iContextId . '&params[]=',
                'request_url_save' => $this->MODULE . '/save_filter&params[]=' . $iContextId . '&params[]='
            ];

        $oForm = new BxTemplFormView([]);
        return $oForm->genInputSelect($aInput);
    }
}

/** @} */
