<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

require_once('BxTasksTimeQuery.php');

class BxTasksTime extends BxTemplReport
{
    protected $_sModule;
    protected $_oModule;

    protected $_sUniqId;

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_sModule = 'bx_tasks';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_sUniqId = '';

        $this->_aElementParamsApi = ['is_reported'];

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_oQuery = new BxTasksTimeQuery($this);

        $this->_bUndo = false;
        $this->_bProcessible = false;

        $this->_sFormObject = $CNF['OBJECT_FORM_TIME'];
        $this->_sFormDisplayPost = $CNF['OBJECT_FORM_TIME_DISPLAY_ADD'];

        array_walk($this->_aHtmlIds, function(&$sVa1ue) {
            $sVa1ue = str_replace('bx-report', 'bx-tasks', $sVa1ue);
        });
    }

    public function getJsObjectName()
    {
        return parent::getJsObjectName() . $this->_sUniqId;
    }

    public function getJsScript($bDynamicMode = false, $aParams = [])
    {
        if($this->_iDoAuto($aParams)) {
            $aParams['js_params'] ??= [];
            $aParams['js_params']['oRequestParams'] ??= [];
            $aParams['js_params']['oRequestParams']['show_do_report_form'] = 0;
        }

        return parent::getJsScript($bDynamicMode, $aParams);
    }

    public function getElement($aParams = [])
    {
        $this->_sUniqId = $aParams['uniq_id'] ?? '';

        return parent::getElement($aParams);
    }

    public function report($aParams = [])
    {
        $iObjectId = $this->_iId;
        $iAuthorId = $this->_getAuthorId();
        $bPerformed = $this->isPerformed($iObjectId, $iAuthorId);

        $this->_oModule->serviceProcessTimer('pause', $iObjectId, $iAuthorId);

        if(($sK = 'show_do_report_form') && ($iShowDoReportForm = bx_get($sK)) !== false && !$iShowDoReportForm) {
            if(!$this->isEnabled())
                return ['code' => 1, 'message' => _t('_report_err_not_enabled')];

            if(!$this->isAllowedReport())
                return ['code' => 2, 'message' => $this->msgErrAllowedReport()];
   
            $aTimer = $this->_oModule->_oDb->getTimers([
                'sample' => 'content_profile_ids', 
                'content_id' => $this->_iId, 
                'profile_id' => $iAuthorId
            ]);

            if(!$aTimer || !is_array($aTimer) || !($iDuration = (int)$aTimer['duration']))
                return ['code' => 3, 'message' => _t('_bx_tasks_txt_err_timer_not_found')];

            list($iHours, $iMinutes) = $this->_oModule->_oConfig->timeI2A($iDuration, true);

            $oForm = $this->_getFormObject();
            return $this->_report($bPerformed, array_merge($aParams, [
                'object_id' => $iObjectId,
                'value_h' => $iHours,
                'value_m' => $iMinutes + 1,
                'text' => '',
                'timer_id' => $aTimer['id']
            ]), $oForm);
        }

        $mixedResult = parent::report($aParams);
        if(!empty($mixedResult) && is_array($mixedResult) && isset($mixedResult['popup'], $mixedResult['popup_id']))
            $mixedResult['popup'] = [
                'html' => $mixedResult['popup'], 
                'options' => ['closeOnOuterClick' => false]
            ];

        return $mixedResult;
    }

    /**
     * Should always return false to allow any number of time reports per user.
     */
    public function isPerformed($iObjectId, $iAuthorId, $iAuthorIp = 0)
    {
        return false;
    }

    public function putReport($iObjectId, $iAuthorId, $mixedTrack, $bUndo = false)
    {
        if(!$this->_oQuery->putReport($iObjectId, $iAuthorId, $bUndo))
            return false;

        $aTrack = is_array($mixedTrack) ? $mixedTrack : $this->_oQuery->getTrackBy(['type' => 'id', 'id' => (int)$mixedTrack]);
        if(empty($aTrack) || !is_array($aTrack))
            return false;

        if(!$bUndo && empty($aTrack['value_date']) && !$this->_oQuery->updateTrack(['value_date' => time()], ['id' => $aTrack['id']]))
            return false;

        if(!$this->_oQuery->updateReport($iObjectId, $aTrack['value'], $bUndo))
            return false;

        $iObjectAuthorId = $this->_oQuery->getObjectAuthorId($iObjectId);

        /*
         * TODO: May be we need to send notification to Context admins.
         * 
        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_Reported', [
           'report_type' => $sType,
           'report_text' => $sText,
           'report_url' => $this->getBaseUrl(),
        ]);
        if($aTemplate)
           sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body']);
        */          

        $this->_trigger();

        $this->_oModule->logActivity($iObjectId, [
            'key' => '_bx_tasks_txt_msg_report_time_for_date', 
            'markers' => [
                'time' => $this->_oModule->_oConfig->timeI2S($aTrack['value']),
                'date' => bx_process_output($aTrack['value_date'] ?: $aTrack['date'], BX_DATA_DATE_TS)
            ]
        ]);

        /**
         * @hooks
         * @hookdef bx_tasks-report_time '{module_name}', 'report_time' - hook on create new time report 
         * - $unit_name - module name
         * - $action - equals `report_time` 
         * - $object_id - reported entry ID
         * - $sender_id - profile id for report's author
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_system` - [string] system name
         *      - `object_author_id` - [int] author's profile_id for reported object_id 
         *      - `report_id` - [int] report id
         *      - `report_author_id` - [int] profile id for report's author
         *      - `type` - [string] reported time
         * @hook @ref hook-bx_tasks-report_time
         */
        bx_alert($this->_sModule, 'report_time', $iObjectId, $iAuthorId, [
            'object_system' => $this->_sSystem, 
            'object_author_id' => $iObjectAuthorId, 
            'report_id' => $aTrack['id'], 
            'report_author_id' => $iAuthorId, 
            'value' => $aTrack['value']
        ]);

        return true;
    }

    protected function _getDoReport($aParams = [])
    {
        $mixedResult = parent::_getDoReport($aParams);

        if($this->_bApi)
            $mixedResult['is_do_auto'] = $this->_iDoAuto($aParams);

        return $mixedResult;
    }

    protected function _report($bPerformed, $aParams, &$oForm)
    {
        $iAuthorId = $this->_getAuthorId();
        $iAuthorNip = bx_get_ip_hash($this->_getAuthorIp());

        $iObjectId = ($sKey = 'object_id') && $this->_bApi ? $this->_iId : ($aParams[$sKey] ?? $oForm->getCleanValue($sKey));

        if(!$this->isAllowedReport(true))
            return ['code' => 2, 'message' => $this->msgErrAllowedReport()];

        $iVh = ($sKey = 'value_h') && $this->_bApi ? $aParams[$sKey] : ($aParams[$sKey] ?? $oForm->getCleanValue($sKey));
        $iVm = ($sKey = 'value_m') && $this->_bApi ? $aParams[$sKey] : ($aParams[$sKey] ?? $oForm->getCleanValue($sKey));
        $iValue = $this->_oModule->_oConfig->timeA2I([$iVh, $iVm]);

        $sText = ($sKey = 'text') && $this->_bApi ? $aParams[$sKey] : ($aParams[$sKey] ?? $oForm->getCleanValue($sKey));
        $sText = bx_process_input($sText);

        $iId = (int)$oForm->insert(['object_id' => $iObjectId, 'author_id' => $iAuthorId, 'author_nip' => $iAuthorNip, 'value' => $iValue,  'text' => $sText,  'date' => time()]);
        if($iId != 0 && $this->putReport($iObjectId, $iAuthorId, $iId)) {
            $aReport = $this->_getReport($iObjectId, true);
            $aResult = $this->_returnReportData($iObjectId, $iAuthorId, $iId, $aReport, !$bPerformed);

            if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
                $oSockets->sendEvent($this->getSocketName(), $iObjectId, 'reported', json_encode($this->_returnReportDataForSocket($aResult)));

            /*
             * If timer is attached, clear it and initiate reloading.
             */
            if(($sKey = 'timer_id') && ($iTimerId = (int)($aParams[$sKey] ?? $oForm->getCleanValue($sKey)))) {
                $aTimer = $this->_oModule->_oDb->getTimers([
                    'sample' => 'id', 
                    'id' => $iTimerId
                ]);

                if($aTimer && ($iContentId = $aTimer['content_id'] ?? 0) && ($iProfileId = $aTimer['profile_id'] ?? 0)) {
                    $this->_oModule->serviceProcessTimer('clear', $iContentId, $iProfileId);

                    if(!$this->_bApi)
                        $aResult = array_merge($aResult, [
                            'label_title' => _t('_bx_tasks_txt_timer_log'),
                            'eval' => $aResult['eval'] . '; ' . $this->_oModule->_oConfig->getJsObject('timer'). '.reload(this, ' . $iContentId . ', ' . $iProfileId . ');'
                        ]);
                }
            }

            $this->_oModule->updateBudgetByContentId($iContentId, $iValue);

            return $aResult;
        }

        return ['code' => 3, 'message' => _t('_report_err_cannot_perform_action')];
    }

    protected function _returnReportData($iObjectId, $iAuthorId, $iReportId, $aData, $bPerformed)
    {
        return parent::_returnReportData($iObjectId, $iAuthorId, $iReportId, $aData, false);
    }

    protected function _getReportedBy()
    {
        $aTmplReports = [];

        $aReports = $this->_oQuery->getPerformedBy($this->getId());
        foreach($aReports as $aReport) {
            list($sUserName, $sUserUrl, $sUserIcon, $sUserUnit) = $this->_getAuthorInfo($aReport['author_id']);

            $sText = bx_process_output($aReport['text'], BX_DATA_TEXT_MULTILINE);

            $aTmplReports[] = [
                'style_prefix' => $this->_sStylePrefix,
                'user_unit' => $sUserUnit,
                'value' => $this->_oModule->_oConfig->timeI2S($aReport['value']),
                'date' => $aReport['value_date'] ? bx_time_js($aReport['value_date'], BX_FORMAT_DATE, true) : '',
            	'bx_if:show_text' => [
                    'condition' => strlen($sText) > 0,
                    'content' => [
                        'text' => $sText
                    ]
            	]
            ];
        }

        if(empty($aTmplReports))
            $aTmplReports = MsgBox(_t('_Empty'));

        return $this->_oModule->_oTemplate->parseHtmlByName('report_by_list.html', [
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:list' => $aTmplReports
        ]);
    }

    protected function _getIconDoReport($bPerformed)
    {
    	return $bPerformed && $this->isUndo() ? 'stopwatch' : 'stopwatch';
    }

    protected function _getTitleDoReport($bPerformed, $aParams = [])
    {
        if(($sTitle = $aParams['do_report_label'] ?? false))
            return [$sTitle];

        return ['_bx_tasks_report_time_do_' . ($bPerformed && $this->isUndo() ? 'un' : '') . 'report'];
    }

    protected function _iDoAuto($aParams)
    {
        return ($sK = 'show_do_report_form') && isset($aParams[$sK]) && $aParams[$sK] != true;
    }    
}

/** @} */
