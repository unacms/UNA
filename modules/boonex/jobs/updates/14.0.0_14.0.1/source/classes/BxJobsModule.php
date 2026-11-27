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

/**
 * Jobs profiles module.
 */
class BxJobsModule extends BxBaseModGroupsModule
{
    public function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;

        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, [
            $CNF['FIELD_TIMEZONE'],
            $CNF['FIELD_JOIN_CONFIRMATION'],
        ]);
    }

    public function serviceApplicants ($iContentId = 0, $bAsArray = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$iContentId)
            return false;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(!$aContentInfo)
            return false;

        if(!($oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName())))
            return false;

        $iGroupProfileId = $oGroupProfile->id();
        if(!$this->serviceIsAdmin($iGroupProfileId))
            return false;

        if(!$bAsArray) {
            bx_import('BxDolConnection');
            $mixedResult = $this->serviceBrowseConnectionsQuick ($iGroupProfileId, $CNF['OBJECT_CONNECTIONS'], BX_CONNECTIONS_CONTENT_TYPE_INITIATORS, 0);
            if(!$mixedResult)
                return MsgBox(_t('_sys_txt_empty'));
        }
        else
            $mixedResult = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])->getConnectedInitiators($iGroupProfileId, 0);

        return $mixedResult;
    }

    public function checkAllowedFans(&$aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if($aDataEntry[$CNF['FIELD_AUTHOR']] == bx_get_logged_profile_id())
            return _t('_sys_txt_access_denied');

        return parent::checkAllowedFans($aDataEntry, $isPerformAction);
    }

    public function decodeDataAPI($aData, $aParams = [])
    {
        $aResult = parent::decodeDataAPI($aData, $aParams);

        if(isset($aParams['template']) && $aParams['template'] == 'unit_wo_info')
            return $aResult;

        $aResult = array_merge($aResult, [
            'description' =>  strip_tags($aData['desc']),
            'date_start ' =>  $aData['date_start'],
            'date_end' =>  $aData['date_end'],
            'pay_hourly' =>  $aData['pay_hourly'],
            'pay_total' =>  $aData['pay_total'],
            'votes' => $aData['votes'],
            'votes_avg' => $aData['rate']
        ]);

        return $aResult;
    }
}

/** @} */
