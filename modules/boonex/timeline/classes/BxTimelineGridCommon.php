<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 * 
 * @{
 */

require_once('BxTimelineGridManageTools.php');

class BxTimelineGridCommon extends BxTimelineGridManageTools
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_timeline';
        parent::__construct ($aOptions, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_sStatusField = $CNF['FIELD_STATUS'];
        $this->_aStatusValues = array('active', 'hidden');

        $this->_sManageType = BX_DOL_MANAGE_TOOLS_COMMON;
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$this->_switcherState2Checked($aRow['status_admin']))
            return parent::_getCellDefault('', $sKey, $aField, $aRow);

        return parent::_getCellSwitcher ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellStatusAdmin($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!empty($CNF['T']['filter_item_' . $mixedValue]))
            $mixedValue = $CNF['T']['filter_item_' . $mixedValue];
        else
            $mixedValue = '_undefined';

        return parent::_getCellDefault(_t($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _isRowDisabled($aRow)
    {
        if(parent::_isRowDisabled($aRow))
            return true;

        return !$this->_switcherState2Checked($aRow['status_admin']);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $iProfileId = bx_get_logged_profile_id();

        /*
         * One member's events are a small part of the table, so they are found and then sorted, as before
         * the date_id key. Read in date order through that key, the list would go through most of the
         * table for a member with few or only old events.
         */
        $sTable = $this->_aOptions['table'];
        if(($sHint = $this->_oModule->_oDb->getIgnoreIndexHint($sTable, 'date_id')))
            $this->_aOptions['source'] = preg_replace('/FROM `' . preg_quote($sTable, '/') . '`(?! IGNORE INDEX)/', 'FROM `' . $sTable . '` ' . $sHint, $this->_aOptions['source'], 1);

        $this->_aOptions['source'] .=$this->_oModule->_oDb->prepareAsString(" AND (`owner_id`=? OR (`system`='0' AND `object_owner_id`=?))", $iProfileId, $iProfileId);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
