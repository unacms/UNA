<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OktaConnect Okta Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxOktaConCustom
{
    function __construct($aModule)
    {
    }

    function onConfig ($oConfig)
    {
    }

    function onRegister ($iProfileId, $aRemoteProfileInfo)
    {
        bx_log('bx_oktacon', $aRemoteProfileInfo, BX_LOG_DEBUG);
        
        if (!empty($aRemoteProfileInfo['communities']))
           $this->syncCommunities($iProfileId, explode(',', $aRemoteProfileInfo['communities']));

        // $this->syncLocation($iProfileId, $aRemoteProfileInfo);
    }

    function onLogin ($oProfile, $aRemoteProfileInfo)
    {
        bx_log('bx_oktacon', $aRemoteProfileInfo, BX_LOG_DEBUG);

        if (!empty($aRemoteProfileInfo['communities']))
           $this->syncCommunities($oProfile ? $oProfile->id() : bx_get_logged_profile_id(), explode(',', $aRemoteProfileInfo['communities']));

        // $this->syncLocation($oProfile->id(), $aRemoteProfileInfo);
    }

    function onConvertRemoteFields($aProfileInfo, &$aProfileFields)
    {
        if (empty($aProfileInfo['grade']))
            return;

        $a = explode(',', $aProfileInfo['grade']);

        $v = 0;
        foreach ($a as $i) {
            if ($i == 'K Grader')
                $i = 20;
            elseif ($i == 'TK Grader')
                $i = 21;
            elseif ($i == 'AL Grader')
                $i = 22;
            $v += pow(2, (int)$i - 1);
        }

        $aProfileFields['grades'] = $v;
    }

    function syncLocation($iProfileId, $aRemoteProfileInfo)
    {
        if (empty($aRemoteProfileInfo['state']) || empty($aRemoteProfileInfo['city']))
            return;

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (!$oProfile)
            return;

        $oMetatags = BxDolMetatags::getObjectInstance('bx_persons');
        if (!$oMetatags || !$oMetatags->locationsIsEnabled())
            return;

        $sEndpoint = bx_append_url_params('https://nominatim.openstreetmap.org', [
            'format' => 'json',
            'limit' => 1,
            'country' => empty($aRemoteProfileInfo['country']) ? 'US' : $aRemoteProfileInfo['country'], 
            'state' => $aRemoteProfileInfo['state'], 
            'city' => $aRemoteProfileInfo['city'],
        ]);
        $sResults = bx_file_get_contents($sEndpoint);        
        if (!($a = @json_decode($sResults, true)))
            return;
        $a = array_shift($a);
    
        $oMetatags->locationsAdd($oProfile->getContentId(), $a['lat'], $a['lon'], 'US', $aRemoteProfileInfo['state'], $aRemoteProfileInfo['city']);
    }

    function syncCommunities($iProfileId, $aCommunities, $sModule = 'bx_groups', $sObjConn = 'bx_groups_fans')
    {
	    if (!$iProfileId)
	        return;

        // convers content ids to profile ids + validate
        $aCommunitiesNew = [];
        foreach ($aCommunities as $iId) {
            $iId = (int)trim($iId);
            $aInfo = bx_srv($sModule, 'get_info', [$iId, false]);
            if (!$aInfo)
                continue;
            $aCommunitiesNew[] = $aInfo['profile_id'];
        }

        // get current profile communities
        $oConnections = BxDolConnection::getObjectInstance($sObjConn);
        $aCommunitiesOld = $oConnections->getConnectedInitiators($iProfileId, true);

        // communities to remove
        $aCommunitiesRemove = array_diff($aCommunitiesOld, $aCommunitiesNew);
        if ($aCommunitiesRemove) {
            foreach ($aCommunitiesRemove as $i) {
                $oConnections->removeConnection($iProfileId, $i);
            }
        }

        // communities to add
        $aCommunitiesAdd = array_diff($aCommunitiesNew, $aCommunitiesOld);
        if ($aCommunitiesAdd) {
            foreach ($aCommunitiesAdd as $i) {
                $oConnections->addConnection($iProfileId, $i);
                $oConnections->addConnection($i, $iProfileId);
            }
	    }
    }
}

/** @} */
