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
}

/** @} */
