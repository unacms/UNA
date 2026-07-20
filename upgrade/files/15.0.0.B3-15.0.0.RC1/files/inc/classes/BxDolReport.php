<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolAcl');

define('BX_DOL_REPORT_USAGE_BLOCK', 'block');
define('BX_DOL_REPORT_USAGE_INLINE', 'inline');
define('BX_DOL_REPORT_USAGE_DEFAULT', BX_DOL_REPORT_USAGE_BLOCK);

define('BX_DOL_REPORT_STASUS_NEW', 0);
define('BX_DOL_REPORT_STASUS_IN_PROCESS', 1);
define('BX_DOL_REPORT_STASUS_PROCESSED', 2);
/**
 * Report any content
 *
 * Related classes:
 * - BxDolReportQuery - report database queries
 * - BxBaseReport - report base representation
 * - BxTemplReport - custom template representation
 *
 * AJAX report for any content.
 *
 * To add report section to your feature you need to add a record to 'sys_objects_report' table:
 *
 * - id - autoincremented id for internal usage
 * - name - your unique module name, with vendor prefix, lowercase and spaces are underscored
 * - table_main - table name where summary reports are stored
 * - table_track - table name where each report is stored
 * - is_on - is this report object enabled
 * - base_url - base URL for reported object
 * - trigger_table - table to be updated upon each report
 * - trigger_field_id - trigger_table table field with unique record id, primary key
 * - trigger_field_author - trigger_table table field with author
 * - trigger_field_count - trigger_table table field with reports count
 * - class_name - your custom class name, if you overrride default class
 * - class_file - your custom class path
 *
 * You can refer to BoonEx modules for sample record in this table.
 *
 *
 *
 * @section example Example of usage:
 * You can show report in any place, using the following code:
 * @code
 * $o = BxDolReport::getObjectInstance('system object name', $iYourEntryId);
 * if (!$o->isEnabled()) 
 *     return '';
 * echo $o->getElementBlock();
 * @endcode
 *
 *
 * @section acl Memberships/ACL:
 * - report
 * - report view
 *
 *
 * @section alerts Alerts:
 * Alerts type/unit - every module has own type/unit, it equals to ObjectName.
 * The following alerts are rised:
 *
 * - type: 'object name', action: doReport
 * - type: report, action: do
 *
 */

class BxDolReport extends BxDolObject
{
    protected $_oTemplate;

    protected $_bUndo;
    protected $_bProcessible;   ///< Determines whether the report should be processed by admins/moderators or not.
    protected $_sBaseUrl;

    protected $_sObjectCmts;

    protected $_sFormObject;
    protected $_sFormDisplayPost;

    protected $_sTypesPreList;
    protected $_aTypes;

    protected $_aReport;

    protected function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit);
        if(empty($this->_sSystem))
            return;

        $this->_oQuery = new BxDolReportQuery($this);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_bUndo = true;
        $this->_bProcessible = true;

        $this->_sBaseUrl = BxDolPermalinks::getInstance()->permalink($this->_aSystem['base_url']);
        if(get_mb_substr($this->_sBaseUrl, 0, 4) != 'http')
            $this->_sBaseUrl = BX_DOL_URL_ROOT . $this->_sBaseUrl;

        $this->_sObjectCmts = $this->_aSystem['object_comment'];

        $this->_sFormObject = 'sys_report';
        $this->_sFormDisplayPost = 'sys_report_post';

        $this->_sTypesPreList = 'sys_report_types';

        $aTypes = BxDolFormQuery::getDataItems($this->_sTypesPreList);
        if(!empty($aTypes) && is_array($aTypes))
            $this->_aTypes = array_keys($aTypes);
        else
            $this->_aTypes = array('spam', 'scam', 'fraud', 'nude', 'other');

        $this->_aReport = [];
    }

    /**
     * get reports object instanse
     * @param $sSys report object name
     * @param $iId associated content id, where report is available
     * @param $iInit perform initialization
     * @return null on error, or ready to use class instance
     */
    public static function getObjectInstance($sSys, $iId, $iInit = true, $oTemplate = false)
    {
        $sKey = 'BxDolReport!' . $sSys . $iId . ($oTemplate ? $oTemplate->getClassName() : '');
        if(isset($GLOBALS['bxDolClasses'][$sKey]))
            return $GLOBALS['bxDolClasses'][$sKey];

        $aSystems = self::getSystems();
        if(!isset($aSystems[$sSys]))
            return null;

        $sClassName = 'BxTemplReport';
        if(!empty($aSystems[$sSys]['class_name'])) {
            $sClassName = $aSystems[$sSys]['class_name'];
            if(!empty($aSystems[$sSys]['class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aSystems[$sSys]['class_file']);
        }

        $o = new $sClassName($sSys, $iId, $iInit, $oTemplate);
        return ($GLOBALS['bxDolClasses'][$sKey] = $o);
    }

    public static function &getSystems()
    {
        $sKey = 'bx_dol_cache_memory_report_systems';

        if(!isset($GLOBALS[$sKey]))
            $GLOBALS[$sKey] = BxDolDb::getInstance()->fromCache('sys_objects_report', 'getAllWithKey', '
                SELECT
                    `id` as `id`,
                    `name` AS `name`,
                    `module` AS `module_name`,
                    `table_main` AS `table_main`,
                    `table_track` AS `table_track`,
                    `pruning` AS `pruning`,
                    `is_on` AS `is_on`,
                    `base_url` AS `base_url`,
                    `object_comment` AS `object_comment`,
                    `trigger_table` AS `trigger_table`,
                    `trigger_field_id` AS `trigger_field_id`,
                    `trigger_field_author` AS `trigger_field_author`,
                    `trigger_field_count` AS `trigger_field_count`,
                    `class_name` AS `class_name`,
                    `class_file` AS `class_file`
                FROM `sys_objects_report`', 'name');

        return $GLOBALS[$sKey];
    }

    public static function onAuthorDelete ($iAuthorId)
    {
        $aSystems = self::getSystems();
        foreach($aSystems as $sSystem => $aSystem)
            self::getObjectInstance($sSystem, 0)->getQueryObject()->deleteAuthorEntries($iAuthorId);

        return true;
    }

    /**
     * Interface functions for outer usage
     */
    public function isUndo()
    {
        return (int)$this->_bUndo == 1;
    }

    public function isProcessible()
    {
        return $this->_bProcessible;
    }

    public function getBaseUrl()
    {
        return $this->_replaceMarkers($this->_sBaseUrl);
    }

    public function getStatCounter()
    {
        $aReport = $this->_oQuery->getReport($this->getId());
        return $aReport['count'];
    }
    
    public function getCountByStatus($iStatus)
    {
        return $this->_oQuery->getReportsCountByStatus($iStatus);
    }

    public function getSocketName()
    {
        return $this->_sSystem . '_reports';
    }

    /**
     * Actions functions
     */
    public function actionReport()
    {
        return echoJson($this->report());
    }

    public function actionClearReport()
    {
       $this->_oQuery->clearReports($this->getId());
    }

    public function actionGetReportedBy()
    {
        if (!$this->isEnabled())
           return '';

	    if(!$this->isAllowedReportView(true))
            return $this->msgErrAllowedReportView();

        return $this->_getReportedBy();
    }

    /**
     * Permissions functions
     */
    public function isAllowedReport($isPerformAction = false)
    {
        if(isAdmin())
            return true;

        return $this->checkAction('report', $isPerformAction);
    }

    public function msgErrAllowedReport()
    {
        return $this->checkActionErrorMsg('report');
    }

    public function isAllowedReportView($isPerformAction = false)
    {
        if(isAdmin())
            return true;

        return $this->checkAction('report_view', $isPerformAction);
    }
    
    public function changeStatusReport($iStatus, $iAuthorId, $sCmtText)
    {
        $iId = $this->getId();
        $aReport = $this->_oQuery->getDataById($iId);
        if(!empty($this->_sObjectCmts) && ($oCmts = BxDolCmts::getObjectInstance($this->_sObjectCmts, $aReport['object_id']))) {
            $oCmts->add(array(
                'cmt_author_id' => $iAuthorId,
                'cmt_parent_id' => 0,
                'cmt_text' => $sCmtText
            ));
        }
        $this->_oQuery->changeStatusReport($iId, $iStatus, $iAuthorId);
    }

    public function msgErrAllowedReportView()
    {
        return $this->checkActionErrorMsg('report_view');
    }

    /**
     * Internal functions
     */
    protected function _isCount($aVote = array())
    {
        if(empty($aReport))
            $aReport = $this->_getReport();

        return isset($aReport['count']) && (int)$aReport['count'] != 0;
    }

    protected function _getReport($iObjectId = 0, $bForceGet = false)
    {
        if(!empty($this->_aReport) && !$bForceGet)
            return $this->_aReport;

        if(empty($iObjectId))
            $iObjectId = $this->getId();

        $this->_aReport = $this->_oQuery->getReport($iObjectId);
        return $this->_aReport;
    }

    protected function _isReport($iObjectId = 0, $bForceGet = false)
    {
        $aReport = $this->_getReport($iObjectId, $bForceGet);

        return (int)$aReport['count'] > 0;
    }

    protected function _getTrack($iObjectId, $iAuthorId)
    {
        return $this->_oQuery->getTrack($iObjectId, $iAuthorId);
    }

    protected function _getIconDoReport($bPerformed)
    {
    	return $bPerformed && $this->isUndo() ? 'exclamation-circle' : 'exclamation-circle';
    }

    protected function _getTitleDoReport($bPerformed, $aParams = [])
    {
        if($bPerformed && $this->isUndo())
            return ['_report_do_unreport'];

        $sSample = '_' . $this->_sSystem . '_txt_sample_single';
        if(($$sSample = _t($sSample)) && strcmp($sSample, $$sSample) != 0)
            return ['_report_do_report_with_sample', $$sSample];

    	return ['_report_do_report'];
    }

    protected function _getFormObject()
    {
        $oForm = BxDolForm::getObjectInstance($this->_sFormObject, $this->_sFormDisplayPost);
        $oForm->setId($this->_aHtmlIds['do_form']);
        $oForm->setName($this->_aHtmlIds['do_form']);
        $oForm->aParams['db']['table'] = $this->_aSystem['table_track'];
        $oForm->aInputs['sys']['value'] = $this->_sSystem;
        $oForm->aInputs['object_id']['value'] = $this->_iId;
        $oForm->aInputs['action']['value'] = 'Report';

        return $oForm;
    }
}

/** @} */
