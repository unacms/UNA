<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

require_once('BxTasksGridTime.php');

class BxTasksGridTimeContextAdministration extends BxTasksGridTime
{
    protected $_iContextPid;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sPaginateType = 'load_more';

        if(($iContextPid = bx_get('context_pid')) !== false) 
            $this->setContextPid($iContextPid);
    }

    public function setContextPid($iContextPid)
    {
        $this->_iContextPid = (int)$iContextPid;
        $this->_aQueryAppend['context_pid'] = $this->_iContextPid;

        /*
         * Filter by author_id
         */
        if($this->_isAdministration())
            $this->_initFilter(1, $this->_oModule->getContextMembers($this->_iContextPid));

        /*
         * Filter by object_id
         */
        $this->_initFilter(2, $this->_oModule->getContextEntries($this->_iContextPid));
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
        return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&context_pid=' . $this->_iContextPid . '&id=' . $iId;
    }

    public function performActionCalculate()
    {
        if($this->_isAdministration() && !$this->_isAllowedByConext())
            return $this->_getActionResult([]);

        return parent::performActionCalculate();
    }

    public function performActionExport()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aFields = explode(',', getParam($CNF['PARAM_EXPORT_TIME_FIELDS']));
        if(!$aFields || !is_array($aFields)) {
            echoJson([]);
            return;
        }

        $aTitles = $aConverters = [];
        foreach($aFields as $sField) {
            $aTitles[$sField] = _t('_bx_tasks_option_export_time_field_' . $sField);
            
            $sConverter = '_exportFieldConverter' . bx_gen_method_name($sField);
            if(method_exists($this, $sConverter))
                $aConverters[$sField] = $sConverter;
        }

        $sMethod = '_exportTo' . bx_gen_method_name(getParam($CNF['PARAM_EXPORT_TIME_TO']));
        if(!method_exists($this, $sMethod)) {
            echoJson([]);
            return;
        }

        $aIds = $this->_getIds();
        if(!$aIds || !is_array($aIds)) {
            echoJson([]);
            return;
        }

        if(($aFile = $this->$sMethod($aIds, $aFields, $aTitles, $aConverters)) === false) {
            echoJson([]);
            return;
        }

        list($sFilePath, $sFileUrl) = $aFile;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE_EXPORT_FILES']);
        if($oStorage && ($iFileId = $oStorage->storeFileFromPath($sFilePath, true, bx_get_logged_profile_id())) !== false) {
            $sFileUrl = $oStorage->getFileUrlById($iFileId);

            @unlink($sFilePath);
        }

        echoJson(['redirect' => $sFileUrl]);
        return;
    }

    public function getCode ($isDisplayHeader = true)
    {
        if($this->_isAdministration() && !$this->_isAllowedByConext())
            return $this->_getActionResult([]);

        return parent::getCode($isDisplayHeader);
    }

    protected function _isAllowedByConext($iContextPid = 0)
    {
        if(!$iContextPid)
            $iContextPid = $this->_iContextPid;
        if(!$iContextPid)
            return false;

        return $this->_oModule->isAllowManageByContext($this->_iContextPid);
    }

    protected function _getFilterControls()
    {
        $this->_getFcDefault();

        $sContent = $this->_getFilterSelectOne($this->_sFilter1Name, $this->_sFilter1Value, $this->_aFilter1Values, '_bx_tasks_grid_filter_item_title_tm_select_one_author_id');
        $sContent .= $this->_getFilterSelectOne($this->_sFilter2Name, $this->_sFilter2Value, $this->_aFilter2Values, '_bx_tasks_grid_filter_item_title_tm_select_one_object_id');
        $sContent .= $this->_getFcDateSearch();
        return $sContent;
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND ABS(`tt`.`allow_view_to`)=?", $this->_iContextPid);

        $this->_parseFilterValue($sFilter);

    	if(!empty($this->_sFilter1Value))
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ttt`.`author_id`=?", $this->_sFilter1Value);

        if(!empty($this->_sFilter2Value))
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ttt`.`object_id`=?", $this->_sFilter2Value);
        
        if(!empty($this->_sFilter3Value))
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ttt`.`value_date`>=?", strtotime($this->_sFilter3Value));

        if(!empty($this->_sFilter4Value))
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ttt`.`value_date`<=?", strtotime($this->_sFilter4Value));

        return parent::__getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _exportToCsv($aIds, $aFields, $aTitles, $aConverters)
    {
        $sFileDiv = ';';
        $sFileName = 'tasks-reported-time-' . date('Y.m.d') . '.csv';
        $sFilePath = BX_DIRECTORY_PATH_TMP . $sFileName;
        $oFileHandler = fopen($sFilePath, 'w');
        if(!$oFileHandler)
            return false;

        fputcsv($oFileHandler, $aTitles, $sFileDiv);

        $aFieldsFlip = array_flip($aFields);
        foreach($aIds as $iId) {
            $aTrack = $this->_oModule->_oDb->getTimeTracks(['sample' => 'id', 'id' => $iId]);
            if(!$aTrack || !is_array($aTrack))
                continue;

            $aConvert = array_intersect_key($aConverters, $aTrack);
            foreach($aConvert as $sField => $sMethod)
                $aTrack[$sField] = $this->$sMethod($aTrack[$sField]);

            fputcsv($oFileHandler, array_intersect_key($aTrack, $aFieldsFlip), $sFileDiv);
        }

        fclose($oFileHandler);

        return [$sFilePath, BX_DOL_URL_ROOT . 'tmp/' . $sFileName];
    }

    protected function _exportToXml($aIds, $aFields, $aTitles, $aConverters)
    {
        $sFileName = 'tasks-reported-time-' . date('Y.m.d') . '.xml';
        $sFilePath = BX_DIRECTORY_PATH_TMP . $sFileName;
        $oFileHandler = fopen($sFilePath, 'w');
        if(!$oFileHandler)
            return false;

        $aFieldsFlip = array_flip($aFields);

        $oXML = xmlwriter_open_memory();
        xmlwriter_set_indent($oXML, 1);
        xmlwriter_set_indent_string($oXML, '  ');
        
        xmlwriter_start_document($oXML, '1.0', 'UTF-8');
        xmlwriter_start_element($oXML, 'items');

        foreach($aIds as $iId) {
            $aTrack = $this->_oModule->_oDb->getTimeTracks(['sample' => 'id', 'id' => $iId]);
            if(!$aTrack || !is_array($aTrack))
                continue;

            $aConvert = array_intersect_key($aConverters, $aTrack);
            foreach($aConvert as $sField => $sMethod)
                $aTrack[$sField] = $this->$sMethod($aTrack[$sField]);

            xmlwriter_start_element($oXML, 'item');
            $aTrackFields = array_intersect_key($aTrack, $aFieldsFlip);
            foreach($aTrackFields as $sTrackField => $sTrackValue) {
                xmlwriter_start_element($oXML, $sTrackField);
                xmlwriter_write_cdata($oXML, $sTrackValue);
                xmlwriter_end_element($oXML);
            }
            xmlwriter_end_element($oXML);
        }

        xmlwriter_end_document($oXML);

        fwrite($oFileHandler, xmlwriter_output_memory($oXML));
        fclose($oFileHandler);

        return [$sFilePath, BX_DOL_URL_ROOT . 'tmp/' . $sFileName];
    }

    protected function _exportFieldConverterAuthorId($mixedValue)
    {
        return BxDolProfile::getInstanceMagic($mixedValue)->getDisplayName();
    }

    protected function _exportFieldConverterObjectId($mixedValue)
    {
        return $this->_oModule->serviceGetTitle($mixedValue);
    }

    protected function _exportFieldConverterValue($mixedValue)
    {
        return $this->__exportFieldConverterTime($mixedValue);
    }

    protected function _exportFieldConverterValueDate($mixedValue)
    {
        return $this->__exportFieldConverterDate($mixedValue);
    }

    protected function _exportFieldConverterDate($mixedValue)
    {
        return $this->__exportFieldConverterDateTime($mixedValue);
    }

    protected function __exportFieldConverterDate($mixedValue)
    {
        return date('Y.m.d', $mixedValue);
    }

    protected function __exportFieldConverterDateTime($mixedValue)
    {
        return date('Y.m.d H:i', $mixedValue);
    }

    protected function __exportFieldConverterTime($mixedValue)
    {
        return $this->_oModule->_oConfig->timeI2S($mixedValue);
    }
}

/** @} */
