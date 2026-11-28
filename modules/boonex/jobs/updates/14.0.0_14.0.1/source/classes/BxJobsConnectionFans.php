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

class BxJobsConnectionFans extends BxBaseModGroupsConnectionFans
{
    public function __construct($aObject)
    {
        $this->_sModule = 'bx_jobs';

        parent::__construct($aObject);

        $this->_bBan = true;
        $this->_bQuestionnaire = true;
    }
    
    public function getConnectedInitiatorsCount($iContent, $isMutual = false)
    {
        $iResult = parent::getConnectedInitiatorsCount($iContent, $isMutual);

        if(($aAdmins = $this->_oModule->_oDb->getAdmins($iContent)) && is_array($aAdmins) && ($iAdmins = count($aAdmins)) > 0)
            $iResult -= $iAdmins;

        return $iResult;
    }

    public function getConnectedInitiators($iContent, $isMutual = false, $iStart = 0, $iLimit = BX_CONNECTIONS_LIST_LIMIT, $iOrder = BX_CONNECTIONS_ORDER_NONE)
    {
        $aResults = parent::getConnectedInitiators($iContent, $isMutual, $iStart, $iLimit, $iOrder);

        if(($aAdmins = $this->_oModule->_oDb->getAdmins($iContent)) && is_array($aAdmins))
            $aResults = array_diff($aResults, $aAdmins);

        return $aResults;
    }

    public function getConnectedContentAsCondition($sContentField, $iInitiator, $iMutual = false)
    {
        $aResults = parent::getConnectedContentAsCondition($sContentField, $iInitiator, $iMutual);

        if(($aAdmins = $this->_oModule->_oDb->getAdmins($iInitiator)) && is_array($aAdmins))
            $aResults['restriction']['connections_exclude_' . $this->_sObject] = [
                'value' => $aAdmins,
                'field' => 'content',
                'operator' => 'not in',
                'table' => $this->_aObject['table'],
            ];

        return $aResults;
    }
}

/** @} */
