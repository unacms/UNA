<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * @see BxDolReport
 */
class BxBaseReport extends BxDolReport
{
    protected $_bCssJsAdded;

    protected $_sJsObjClass;
    protected $_sJsObjName;
    protected $_sStylePrefix;

    protected $_aHtmlIds;

    protected $_aElementDefaults;
    protected $_aElementDefaultsApi;
    protected $_aElementParamsApi; //--- Params from DefaultsApi array to be passed to Api

    public function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);

        $this->_bCssJsAdded = false;

        $this->_sJsObjClass = 'BxDolReport';
        $this->_sJsObjName = 'oReport' . bx_gen_method_name($sSystem, array('_' , '-')) . $iId;
        $this->_sStylePrefix = 'bx-report';

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $sSystem) . '-' . $iId;
        $this->_aHtmlIds = array(
            'main' => 'bx-report-' . $sHtmlId,
            'counter' => 'bx-report-counter-' . $sHtmlId,
            'do_link' => 'bx-report-do-link-' . $sHtmlId,
            'do_popup' => 'bx-report-do-popup-' . $sHtmlId,
            'do_form' => 'bx-report-do-form-' . $sHtmlId,
            'by_popup' => 'bx-report-by-popup-' . $sHtmlId
        );

        $this->_aElementDefaults = array(
            'show_do_report_as_button' => false,
            'show_do_report_as_button_small' => false,
            'show_do_report_icon' => true,
            'show_do_report_label' => false,
            'show_counter' => true,
            'show_counter_only' => true
        );
        if($this->_bApi) {
            $aTypes = BxDolFormQuery::getDataItems($this->_sTypesPreList);

            $this->_aElementDefaultsApi = array_merge($this->_aElementDefaults, [
                'show_counter' => true,
                'types' => array_map(function($sType) use ($aTypes) {
                    return ['name' => $sType, 'title' => $aTypes[$sType]];
                }, $this->_aTypes)
            ]);
            $this->_aElementParamsApi = ['is_reported', 'types'];
        }

        $this->_sTmplContentElementBlock = $this->_oTemplate->getHtml('report_element_block.html');
        $this->_sTmplContentElementInline = $this->_oTemplate->getHtml('report_element_inline.html');
        $this->_sTmplContentDoAction = $this->_oTemplate->getHtml('report_do_report.html');
        $this->_sTmplContentDoActionLabel = $this->_oTemplate->getHtml('report_do_report_label.html');
    }

    public function report($aParams = [])
    {
        if (!$this->isEnabled())
            return ['code' => 1, 'message' => _t('_report_err_not_enabled')];

        if(!$this->isAllowedReport())
            return ['code' => 2, 'message' => $this->msgErrAllowedReport()];

        $iAuthorId = $this->_getAuthorId();

        $iObjectId = $this->_iId;
        $iObjectAuthorId = $this->_oQuery->getObjectAuthorId($iObjectId);

        $bPerformed = $this->isPerformed($iObjectId, $iAuthorId);
        if($bPerformed) {
            if(!$this->isUndo())
                return ['code' => 4, 'message' => _t('_report_err_duplicate_report')];

            if(($iId = $this->_oQuery->putReport($iObjectId, $iAuthorId, true)) !== false) {
                $this->_trigger();

                bx_alert($this->_sSystem, 'undoReport', $iObjectId, $iAuthorId, array('report_id' => $iId, 'report_author_id' => $iAuthorId, 'object_author_id' => $iObjectAuthorId));
                /**
                 * @hooks
                 * @hookdef hook-report-undo 'report', 'undo' - hook on cancel report 
                 * - $unit_name - equals `report`
                 * - $action - equals `undo` 
                 * - $object_id - report id 
                 * - $sender_id - profile_id for report's author
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `object_system` - [string] system name, ex: bx_posts
                 *      - `object_id` - [int] reported object id 
                 *      - `object_author_id` - [int] author's profile_id for reported object_id 
                 * @hook @ref hook-report-undo
                 */
                bx_alert('report', 'undo', $iId, $iAuthorId, array('object_system' => $this->_sSystem, 'object_id' => $iObjectId, 'object_author_id' => $iObjectAuthorId));

                $aReport = $this->_getReport($iObjectId, true);
                $aResult = $this->_returnReportData($iObjectId, $iAuthorId, $iId, $aReport, !$bPerformed);

                if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
                    $oSockets->sendEvent($this->getSocketName(), $iObjectId, 'reported', json_encode($this->_returnReportDataForSocket($aResult)));

                return $aResult;
            }
        }

        $oForm = $this->_getFormObject();
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid() || ($this->_bApi && !empty($aParams) && is_array($aParams)))
            return $this->_report($bPerformed, $aParams, $oForm);

        if($this->_bApi)
            return [
                'code' => 0,
                'api' => bx_api_get_block('form', $oForm->getCodeAPI(), [
                    'ext' => [
                        'name' => $oForm->getName(),
                        'request' => ['url' => '/api.php?r=system/do/TemplReportServices&params[]=' . json_encode(['s' => $this->_sSystem, 'o' => $this->_iId]), 'immutable' => true]
                    ]
                ])
            ];

        $sPopupId = $this->_aHtmlIds['do_popup'];
        $sPopupContent = BxTemplFunctions::getInstance()->transBox($sPopupId, $this->_oTemplate->parseHtmlByName('report_do_report_form.html', array(
            'style_prefix' => $this->_sStylePrefix,
            'js_object' => $this->getJsObjectName(),
            'form' => $oForm->getCode(),
            'form_id' => $oForm->id,
        )));

        return ['popup' => $sPopupContent, 'popup_id' => $sPopupId];
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjName;
    }

    public function getJsScript($bDynamicMode = false, $aParams = [])
    {
        $sJsObjName = $this->getJsObjectName();
        $aJsObjParams = [
            'sObjName' => $sJsObjName,
            'sSystem' => $this->getSystemName(),
            'iAuthorId' => $this->_getAuthorId(),
            'iObjId' => $this->getId(),
            'sRootUrl' => BX_DOL_URL_ROOT,
            'sSocket' => $this->getSocketName(),
            'sStylePrefix' => $this->_sStylePrefix,
            'aHtmlIds' => $this->_aHtmlIds,
            'sUnreportConfirm' => bx_js_string(_t('_report_do_unreport_confirm'))
        ];
        if(($sK = 'js_params') && isset($aParams[$sK]) && is_array($aParams[$sK]))
            $aJsObjParams = array_merge($aJsObjParams, $aParams[$sK]);

        $sCode = "var " . $sJsObjName . " = new " . $this->_sJsObjClass . "(" . json_encode($aJsObjParams) . ");";

        return $this->_oTemplate->_wrapInTagJsCode($sCode);
    }

    public function getJsClick()
    {
        return $this->getJsObjectName() . '.report(this)';
    }

    public function getCounter($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaults, $aParams);

        $bShowDoReportAsButtonSmall = isset($aParams['show_do_report_as_button_small']) && $aParams['show_do_report_as_button_small'] == true;
        $bShowDoReportAsButton = !$bShowDoReportAsButtonSmall && isset($aParams['show_do_report_as_button']) && $aParams['show_do_report_as_button'] == true;

        $aReport = $this->_getReport($this->getId());

        $sClass = 'sys-action-counter';
        if(isset($aParams['show_counter_only']) && (bool)$aParams['show_counter_only'] === true)
            $sClass .= ' sys-ac-only';

        $sClass .= ' ' . $this->_sStylePrefix . '-counter';
        if($bShowDoReportAsButtonSmall)
            $sClass .= ' bx-btn-small-height';
        if($bShowDoReportAsButton)
            $sClass .= ' bx-btn-height';

        return $this->_oTemplate->parseLink('javascript:void(0)',  (int)$aReport['count'] > 0 ? $this->_getCounterLabel($aReport['count']) : '', array(
            'id' => $this->_aHtmlIds['counter'],
            'class' => $sClass, 
            'title' => _t('_report_do_report_by'),
            'onclick' => 'javascript:' . $this->getJsObjectName() . '.toggleByPopup(this)' 
        ));
    }

    public function getCounterAPI($aParams = [])
    {
        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        return $this->_getReport();
    }

    public function getElementBlock($aParams = array())
    {
        $aParams['usage'] = BX_DOL_REPORT_USAGE_BLOCK;

        return $this->getElement($aParams);
    }

    public function getElementInline($aParams = array())
    {
        $aParams['usage'] = BX_DOL_REPORT_USAGE_INLINE;

        return $this->getElement($aParams);
    }

    public function getElement($aParams = array())
    {
    	$aParams = array_merge($this->_aElementDefaults, $aParams);
    	$bDynamicMode = isset($aParams['dynamic_mode']) && $aParams['dynamic_mode'] === true;

        $bShowDoReportAsButtonSmall = isset($aParams['show_do_report_as_button_small']) && $aParams['show_do_report_as_button_small'] == true;
        $bShowDoReportAsButton = !$bShowDoReportAsButtonSmall && isset($aParams['show_do_report_as_button']) && $aParams['show_do_report_as_button'] == true;
        $bShowCounter = isset($aParams['show_counter']) && $aParams['show_counter'] === true && $this->isAllowedReportView();

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $aReport = $this->_getReport($iObjectId);

        if(!$this->isAllowedReport() && (!$this->isAllowedReportView() || (int)$aReport['count'] == 0))
            return '';

        $aParams['is_reported'] = $this->isPerformed($iObjectId, $iAuthorId) ? true : false;

        $sTmplName = $this->{'_getTmplContentElement' . bx_gen_method_name(!empty($aParams['usage']) ? $aParams['usage'] : BX_DOL_REPORT_USAGE_DEFAULT)}();
        return $this->_oTemplate->parseHtmlByContent($sTmplName, array(
            'style_prefix' => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['main'],
            'class' => $this->_sStylePrefix . ($bShowDoReportAsButton ? '-button' : '') . ($bShowDoReportAsButtonSmall ? '-button-small' : ''),
            'count' => $aReport['count'],
            'do_report' => $this->_getDoReport($aParams),
            'bx_if:show_counter' => array(
                'condition' => $bShowCounter,
                'content' => array(
                    'style_prefix' => $this->_sStylePrefix,
                    'bx_if:show_hidden' => array(
                        'condition' => (int)$aReport['count'] == 0,
                        'content' => array()
                    ),
                    'counter' => $this->getCounter(array_merge($aParams, [
                        'show_counter_only' => false
                    ]))
                )
            ),
            'script' => $this->getJsScript($bDynamicMode, $aParams)
        ));
    }

    public function getElementAPI($aParams = [])
    {
        if(!$this->_bApi)
            return;
        
        if(!$this->isEnabled())
            return bx_api_get_msg('_report_err_not_enabled');

        $aParams = array_merge($this->_aElementDefaultsApi, $aParams);

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();

        $bCount = $this->_isCount();
        $isAllowedReport = $this->isAllowedReport();
        $isAllowedReportView = $this->isAllowedReportView();
        $aParams['is_reported'] = $this->isPerformed($iObjectId, $iAuthorId);
        $aParams['track'] = $aParams['is_reported'] ? $this->_getTrack($iObjectId, $iAuthorId) : [];

        //--- Do Report
        $bDoReport = $this->_isShowDoReport($aParams, $isAllowedReport, $isAllowedReportView, $bCount);
        $aDoReport = $bDoReport ? $this->_getDoReport($aParams, $isAllowedReport) : [];

        //--- Counter
        $bCounter = $this->_isShowCounter($aParams, $isAllowedReport, $isAllowedReportView, $bCount);
        $aCounter = $bCounter ? $this->getCounterAPI(array_merge($aParams, [
            'show_counter_only' => false, 
            'show_script' => false
        ])) : [];

        if(!$bDoReport && !$bCounter)
            return bx_api_get_msg('');

        return [
            'type' => 'reports',
            'system' => $this->_sSystem,
            'object_id' => $this->_iId,
            'params' => array_intersect_key($aParams, array_flip($this->_aElementParamsApi)),
            'action' => $aDoReport,
            'counter' => $aCounter
        ];
    }

    public function getReportedByWithComments($sObjectNotes)
    {
        $aTmplReports = array();
        $aTypes = BxDolForm::getDataItems('sys_report_types');

        $aReports = $this->_oQuery->getPerformedBy($this->getId());
        foreach($aReports as $aReport) {
            list($sUserName, $sUserUrl, $sUserIcon, $sUserUnit) = $this->_getAuthorInfo($aReport['author_id']);

            $sText = bx_process_output($aReport['text'], BX_DATA_TEXT_MULTILINE);
            
            $oCmtsNotes = BxDolCmts::getObjectInstance($sObjectNotes, -$aReport['id'], true, $this->_oTemplate);
            $aCmtsNotes = $oCmtsNotes->getCommentsBlock(array(), array('in_designbox' => false));
            $iCmtsNotesCount = $oCmtsNotes->getCommentsCount();
           
            $aTmplReports[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'user_name' => $sUserName,
                'id' => $aReport['id'],
                'user_url' => $sUserUrl,
            	'type' => $aTypes[$aReport['type']],
                'comments_count' => _t('_report_comments_count', $iCmtsNotesCount),
                'comments' => $aCmtsNotes['content'],
                'date' => bx_time_js($aReport['date']),
            	'bx_if:show_text' => array(
                    'condition' => strlen($sText) > 0,
                    'content' => array(
                        'text' => $sText
                    )
            	)
            );
        }

        if(empty($aTmplReports))
            return '';

        return $this->_oTemplate->parseHtmlByName('report_by_list_with_comments.html', array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:list' => $aTmplReports
        ));
    }

    public function getPerformedByAPI($aParams = [])
    {
        $aValues = $this->_oQuery->getPerformedBy($this->getId());

        $aTmplUsers = [];
        foreach($aValues as $mValue) {
            $mValue = is_array($mValue) ? $mValue : ['author_id' => (int)$mValue, 'reaction' => ''];

            $aTmplUsers[] = BxDolProfile::getData($mValue['author_id']);
        }

        return [
            'performed_by' => $aTmplUsers
        ];
    }

    /**
     * Internal methods.
     */
    protected function _report($bPerformed, $aParams, &$oForm)
    {
        $iAuthorId = $this->_getAuthorId();
        $iAuthorNip = bx_get_ip_hash($this->_getAuthorIp());

        $iObjectId = $this->_bApi ? $this->_iId : $oForm->getCleanValue('object_id');
        $iObjectAuthorId = $this->_oQuery->getObjectAuthorId($iObjectId);

        if(!$this->isAllowedReport(true))
            return ['code' => 2, 'message' => $this->msgErrAllowedReport()];

        $sType = $this->_bApi ? $aParams['type'] : $oForm->getCleanValue('type');
        if(!in_array($sType, $this->_aTypes)) 
            return ['code' => 5, 'message' => _t('_report_err_wrong_type')];

        $sText = $this->_bApi ? $aParams['text'] : $oForm->getCleanValue('text');
        $sText = bx_process_input($sText, BX_DATA_TEXT_MULTILINE);

        $iId = (int)$oForm->insert(['object_id' => $iObjectId, 'author_id' => $iAuthorId, 'author_nip' => $iAuthorNip, 'type' => $sType, 'text' => $sText,  'date' => time()]);
        if($iId != 0 && $this->_oQuery->putReport($iObjectId, $iAuthorId)) {
            if(!empty($this->_sObjectCmts) && ($oCmts = BxDolCmts::getObjectInstance($this->_sObjectCmts, $this->getId()))) {
                $sCmtText = '_report_comment';
                if(!empty($sText))
                    $sCmtText = '_report_comment_with_note';

                $aTypes = BxDolForm::getDataItems('sys_report_types');

                $oCmts->add([
                    'cmt_author_id' => $iAuthorId,
                    'cmt_parent_id' => 0,
                    'cmt_text' => _t($sCmtText, $aTypes[$sType], $sText)
                ]);
            }

            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_Reported', [
                'report_type' => $sType,
                'report_text' => $sText,
                'report_url' => $this->getBaseUrl(),
            ]);
            if($aTemplate)
                sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body']);

            if(($mixedParams = $this->_prepareAuditParams($iObjectId, ['type' => $sType, 'text' => $sText]))) {
                $iAuditObjectId = (int)$mixedParams['object_id'];
                $sAuditActionName = $mixedParams['action_name'];
                unset($mixedParams['object_id'], $mixedParams['action_name']);

                bx_audit($iAuditObjectId, $this->_sSystem, $sAuditActionName, $mixedParams);
            }

            $aReport = $this->_getReport($iObjectId, true);

            $iBlockContentAfter = (int)getParam('sys_security_block_content_after_n_reports');
            if ($iBlockContentAfter > 0 && $aReport['count'] >= $iBlockContentAfter){
                $oModule = BxDolModule::getInstance($this->_aSystem['module_name']);
                if($oModule)
                    $oModule->_oDb->updateStatusAdmin($iObjectId, false);
            }

            $this->_trigger();

            bx_alert($this->_sSystem, 'doReport', $iObjectId, $iAuthorId, ['report_id' => $iId, 'report_author_id' => $iAuthorId, 'object_author_id' => $iObjectAuthorId, 'type' => $sType, 'text' => $sText]);
            /**
             * @hooks
             * @hookdef hook-report-do 'report', 'do' - hook on create new report 
             * - $unit_name - equals `report`
             * - $action - equals `do` 
             * - $object_id - report id 
             * - $sender_id - profile_id for report's author
             * - $extra_params - array of additional params with the following array keys:
             *      - `object_system` - [string] system name, ex: bx_posts
             *      - `object_id` - [int] reported object id 
             *      - `object_author_id` - [int] author's profile_id for reported object_id 
             *      - `type` - [string] report type
             *      - `text` - [bool] report text
             * @hook @ref hook-report-do
             */
            bx_alert('report', 'do', $iId, $iAuthorId, ['object_system' => $this->_sSystem, 'object_id' => $iObjectId, 'object_author_id' => $iObjectAuthorId, 'type' => $sType, 'text' => $sText]);

            if(($sModule = $this->_aSystem['module_name']) && ($sMethod = 'get_moderators') && bx_is_srv($sModule, $sMethod)) {
                $aModerators = bx_srv($sModule, $sMethod, [$iObjectId]);
                if(!empty($aModerators) && is_array($aModerators))
                    foreach($aModerators as $iModeratorId)
                        /**
                         * @hooks
                         * @hookdef hook-bx_base_general-reported_content '{module_name}', 'reported_content' - hook to notify admins/moderators about newly reported content
                         * - $unit_name - module name
                         * - $action - equals `reported_content`
                         * - $object_id - content id
                         * - $sender_id - report author profile id
                         * - $extra_params - array of additional params with the following array keys:
                         *      - `object_author_id` - [int] admin/moderator profile id
                         *      - `report_id` - [int] report id
                         *      - `report_type` - [string] report type
                         *      - `report_text` - [string] message attached to report
                         * @hook @ref hook-bx_base_general-reported_content
                         */
                        bx_alert($this->_sSystem, 'reported_content', $iObjectId, $iAuthorId, [
                            'object_author_id' => (int)$iModeratorId,

                            'report_id' => $iId,
                            'report_type' => $sType, 
                            'report_text' => $sText
                        ]);
            }
            
            $aResult = $this->_returnReportData($iObjectId, $iAuthorId, $iId, $aReport, !$bPerformed);

            if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
                $oSockets->sendEvent($this->getSocketName(), $iObjectId, 'reported', json_encode($this->_returnReportDataForSocket($aResult)));

            return $aResult;
        }

        return ['code' => 3, 'message' => _t('_report_err_cannot_perform_action')];
    }

    protected function _getDoReport($aParams = [])
    {
    	$bReported = isset($aParams['is_reported']) && $aParams['is_reported'] === true;
        $bShowDoReportAsButtonSmall = isset($aParams['show_do_report_as_button_small']) && $aParams['show_do_report_as_button_small'] == true;
        $bShowDoReportAsButton = !$bShowDoReportAsButtonSmall && isset($aParams['show_do_report_as_button']) && $aParams['show_do_report_as_button'] == true;
        $bDisabled = !$this->isAllowedReport() || ($bReported && !$this->isUndo());

        $sTitle = call_user_func_array('_t', $this->_getTitleDoReport($bReported, $aParams));

        if($this->_bApi)
            return [
                'is_undo' => $this->isUndo(),
                'is_reported' => $bReported,
                'is_disabled' => $bDisabled,
                'title' => $sTitle,
            ];

        $sClass = '';
        if($bShowDoReportAsButton)
            $sClass = 'bx-btn';
        else if ($bShowDoReportAsButtonSmall)
            $sClass = 'bx-btn bx-btn-small';

        if($bDisabled)
            $sClass .= $bShowDoReportAsButton || $bShowDoReportAsButtonSmall ? ' bx-btn-disabled' : 'bx-report-disabled';

        if($bReported)
            $sClass .= ' bx-report-reported';

        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentDoAction(), array(
            'style_prefix' => $this->_sStylePrefix,
            'html_id' => $this->_aHtmlIds['do_link'],
            'class' => $sClass,
            'title' => bx_html_attribute($sTitle),
        	'bx_if:show_onclick' => array(
                    'condition' => !$bDisabled,
                    'content' => array(
                        'js_object' => $this->getJsObjectName()
                    )
        	),
            'do_report' => $this->_getLabelDoReport($aParams),
        ));
    }

    protected function _getCounterLabel($iCount)
    {
        return _t('_report_counter', $iCount);
    }

    protected function _getLabelDoReport($aParams = [])
    {
    	$bReported = isset($aParams['is_reported']) && $aParams['is_reported'] === true;
        return $this->_oTemplate->parseHtmlByContent($this->_getTmplContentDoActionLabel(), [
            'style_prefix' => $this->_sStylePrefix,
            'bx_if:show_icon' => [
                'condition' => isset($aParams['show_do_report_icon']) && $aParams['show_do_report_icon'] == true,
                'content' => [
                    'style_prefix' => $this->_sStylePrefix,
                    'name' => $this->_getIconDoReport($bReported)
                ]
            ],
            'bx_if:show_text' => [
                'condition' => isset($aParams['show_do_report_label']) && $aParams['show_do_report_label'] == true,
                'content' => [
                    'style_prefix' => $this->_sStylePrefix,
                    'text' => call_user_func_array('_t', $this->_getTitleDoReport($bReported, $aParams))
                ]
            ]
        ]);
    }

    protected function _getReportedBy()
    {
        $aTmplReports = array();
        $aTypes = BxDolForm::getDataItems('sys_report_types');

        $aReports = $this->_oQuery->getPerformedBy($this->getId());
        foreach($aReports as $aReport) {
            list($sUserName, $sUserUrl, $sUserIcon, $sUserUnit) = $this->_getAuthorInfo($aReport['author_id']);

            $sText = bx_process_output($aReport['text'], BX_DATA_TEXT_MULTILINE);

            $aTmplReports[] = array(
                'style_prefix' => $this->_sStylePrefix,
                'user_unit' => $sUserUnit,
            	'type' => $aTypes[$aReport['type']],
            	'bx_if:show_text' => array(
                    'condition' => strlen($sText) > 0,
                    'content' => array(
                        'text' => $sText
                    )
            	)
            );
        }

        if(empty($aTmplReports))
            $aTmplReports = MsgBox(_t('_Empty'));

        return $this->_oTemplate->parseHtmlByName('report_by_list.html', array(
            'style_prefix' => $this->_sStylePrefix,
            'bx_repeat:list' => $aTmplReports
        ));
    }

    protected function _returnReportData($iObjectId, $iAuthorId, $iReportId, $aData, $bPerformed)
    {
        $bUndo = $this->isUndo();
        if(empty($aData) || !is_array($aData))
            $aData = $this->_getReport($iObjectId);

        $aResult = array(
            'eval' => $this->getJsObjectName() . '.onReport(oData, oElement)',
            'code' => 0,
            'id' => $iReportId, 
            'count' => $aData['count'], 
            'countf' => (int)$aData['count'] > 0 ? $this->_getCounterLabel($aData['count']) : '',
            'label_icon' => $this->_getIconDoReport($bPerformed),
            'label_title' => call_user_func_array('_t', $this->_getTitleDoReport($bPerformed)),
            'reported' => $bPerformed,
            'disabled' => $bPerformed && !$bUndo,
        );

        $aResult['api'] = [
            'performer_id' => $iAuthorId,
            'is_reported' => $aResult['reported'],
            'is_disabled' => $aResult['disabled'],
            'icon' => $aResult['label_icon'],
            'title' => $aResult['label_title'],
            'counter' => $this->_getReport()
        ];

        return $aResult;
    }

    protected function _returnReportDataForSocket($aData, $aMask = [])
    {
        if(empty($aMask) || !is_array($aMask))
            $aMask = ['code', 'count', 'countf', 'api'];

        return array_intersect_key($aData, array_flip($aMask));
    }

    private function _prepareAuditParams($iObjectId, $aData)
    {
        $sModule = $this->_sSystem;
        $sKeyObjectContentInfo = 'OBJECT_CONTENT_INFO';
        $sActionName = '_sys_audit_action_report';
        
        if ($this->_sSystem == 'sys_cmts'){
            $aCommentData = BxDolCmtsQuery::getInfoByUniqId($iObjectId);
            $oComment = BxDolCmts::getObjectInstance($aCommentData['system_name'], $aCommentData['cmt_object_id']);
            $aComment = $oComment->getCommentSimple($aCommentData['cmt_id']);
            $aSystem = $oComment->getSystemInfo();
            
            $sModule = $aSystem['module'];
            $aData['comment_id'] = $aCommentData['cmt_id'];
            $aData['comment_author_id'] = $aComment['cmt_author_id'];
            $aData['comment_text'] = $aComment['cmt_text'];
            $iObjectId = $aCommentData['cmt_object_id'];
            
            $sKeyObjectContentInfo = 'OBJECT_CMTS_CONTENT_INFO';
            $sActionName = '_sys_audit_action_report_comment';
        }

        $oModule = BxDolModule::getInstance($sModule);
        if ($oModule) {
            $CNF = $oModule->_oConfig->CNF;

            $aContentInfo = BxDolRequest::serviceExists($sModule, 'get_all') ? BxDolService::call($sModule, 'get_all', array(array('type' => 'id', 'id' => $iObjectId))) : array();
                    
            return [
                'content_title' => !empty($CNF['FIELD_TITLE'])  ? $aContentInfo[$CNF['FIELD_TITLE']] : '',
                'content_info_object' => !empty($CNF[$sKeyObjectContentInfo]) ? $CNF[$sKeyObjectContentInfo] : '',
                'data' => $aData,
                'action_name' => $sActionName, 
                'object_id' => $iObjectId 
            ];
        }
        
        return false;
    }

    protected function _isShowDoReport($aParams, $isAllowedReport, $isAllowedReportView, $bCount)
    {
        $bShowDoReport = !isset($aParams['show_do_report']) || (bool)$aParams['show_do_report'] === true;

        return $bShowDoReport && ($isAllowedReport || ($isAllowedReportView && $bCount));
    }

    protected function _isShowCounter($aParams, $isAllowedReport, $isAllowedReportView, $bCount)
    {
        $bShowCounter = isset($aParams['show_counter']) && (bool)$aParams['show_counter'] === true;

        return $bShowCounter && $isAllowedReportView && ($isAllowedReport || $bCount);
    }
}

/** @} */
