<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReputationGridManageLeaderboard extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;
    
    protected $_iContextId;
    
    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_reputation';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct ($aOptions, $oTemplate);

        $this->_sDefaultSortingOrder = 'DESC';

        $this->_iContextId = 0;
        if(($iContextId = bx_get('context_id')) !== false)
            $this->setContextId($iContextId);
    }

    public function setContextId($iContextId)
    {
        $this->_iContextId = (int)$iContextId;
        $this->_aQueryAppend['context_id'] = $this->_iContextId;
    }

    protected function _getCellProfileId($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'profile', 'data' => BxDolProfile::getData($mixedValue)];

        if(($oProfile = BxDolProfile::getInstanceMagic($mixedValue)));
            $mixedValue = $oProfile->getUnit();

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellPoints($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `context_id`=?", $this->_iContextId);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
