<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGitHubGridAuthorizations extends BxBaseModGeneralGrid
{
    protected $_iProfileId;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_github';

        parent::__construct ($aOptions, $oTemplate);

        if(($sFfName = 'profile_id') && ($iValue = bx_get($sFfName)) !== false) 
            $this->setProfileId($iValue);
    }

    public function setProfileId($iProfileId)
    {
        if($iProfileId != bx_get_logged_profile_id())
            return;

        $this->_iProfileId = (int)$iProfileId;
        $this->_aQueryAppend['profile_id'] = $this->_iProfileId;
    }

    public function performActionRefresh()
    {
        $iId = $this->_getId();

        $aItem = $this->_oModule->_oDb->getAuthorizations(['sample' => 'id', 'id' => $iId]);
        if(!$aItem)
            return echoJson([]);

        if($this->_oModule->refreshAccessToken($this->_iProfileId, $aItem['app_id'], $aItem['refresh_token']) !== false)
            $aRes = ['grid' => $this->getCode(false), 'blink' => $iId];
        else
            $aRes = ['msg' => _t('_bx_github_err_cannot_perform_action')];

        return echoJson($aRes);
    }

    protected function _getCellAppId($mixedValue, $sKey, $aField, $aRow)
    {
        if($mixedValue)
            $mixedValue = $aRow['app_title'] ?: _t('_undefined');

    	return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDefaultDateTime($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellChanged($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDefaultDateTime($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellAtExpiresIn($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$mixedValue)
            return parent::_getCellDefault(_t('_never'), $sKey, $aField, $aRow);

        return $this->_getCellDefaultDateTime($aRow['changed'] + $mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDefaultDateTime($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'time', 'data' => $mixedValue];

        return parent::_getCellDefault(bx_time_js($mixedValue, BX_FORMAT_DATE_TIME, true), $sKey, $aField, $aRow);
    }

    protected function _getActionRefresh($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if(!$aRow['at_expires_in'] || !$aRow['refresh_token'])
            return $this->_bIsApi ? [] : '';

        return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(!$this->_iProfileId)
            return false;

        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(' AND `tan`.`profile_id`=?', $this->_iProfileId);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getId()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds))
            return reset($aIds);

        if(($iId = bx_get('id')) !== false) 
            return (int)$iId;

        return false;
    }    
}

/** @} */
