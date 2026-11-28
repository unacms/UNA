<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxJobsGridConnections extends BxBaseModGroupsGridConnections
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sContentModule = 'bx_jobs';
        parent::__construct ($aOptions, $oTemplate);
    }

    protected function _getActionSetRole ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_aContentInfo[$CNF['FIELD_AUTHOR']] == $aRow['id'])
            return $this->_bIsApi ? [] : '';

        return parent::_getActionSetRole ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = []);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_aContentInfo[$CNF['FIELD_AUTHOR']] == $aRow['id'])
            return $this->_bIsApi ? [] : '';

        return parent::_getActionDelete ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }
}

/** @} */
