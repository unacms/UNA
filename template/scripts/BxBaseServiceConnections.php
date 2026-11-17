<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System services for connections.
 */
class BxBaseServiceConnections extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-connections Connections
     * @subsubsection bx_system_general-perform perform
     * 
     * @code bx_srv('system', 'perform', [[...]], 'TemplVoteServices'); @endcode
     * @code {{~system:perform:TemplVoteServices[[...]]~}} @endcode
     * 
     * Performs Perform an action (add, remove, etc) with connection object.
     * @param $aParams an array with necessary parameters 
     * 
     * @see BxBaseServiceConnections::servicePerform
     */
    /** 
     * @ref bx_system_general-perform "perform"
     * @api @ref bx_system_general-perform "perform"
     */
    public function servicePerform($aParams)
    {
        if(is_string($aParams))
            $aParams = json_decode($aParams, true);

        if(!$aParams['o'] || !$aParams['a'] || !$aParams['iid'] || !$aParams['cid'])
            return ['code' => 1];

        $oConnection = BxDolConnection::getObjectInstance($aParams['o']);
        if(!$oConnection)
            return ['code' => 2];

        $sMethodHas = 'hasQuestionnaire';
        $sMethodIsAnswered = 'isQuestionnaireAnswered';
        if($aParams['a'] == 'add' && method_exists($oConnection, $sMethodHas) && $oConnection->$sMethodHas($aParams['cid']) && method_exists($oConnection, $sMethodIsAnswered) && !$oConnection->$sMethodIsAnswered($aParams['cid'], $aParams['iid'])) {
            $sModule = $oConnection->getModule();

            return [
                'a' => 'questionnaire',
                'data' => [
                    bx_api_get_block('form', $oConnection->getQuestionnaireForm('add', $aParams['cid'])->getCodeAPI(), ['ext' => [
                        'name' => $sModule, 
                        'request' => ['url' => '/api.php?r=' . $sModule . '/get_questionnaire&params[]=main&params[]=' . $aParams['o'] . '&params[]=add&params[]=' . $aParams['cid'], 'immutable' => true]
                    ]])
                ]
            ];
        }

        $sMethod = 'action' . bx_gen_method_name($aParams['a']);
        if(!method_exists($oConnection, $sMethod))
            return ['code' => 2];

        $aResult = $oConnection->$sMethod($aParams['cid'], $aParams['iid']);
        if($aResult['err'] !== false)
            return ['code' => 3, 'message' => $aResult['msg']];

        // the toggle as it is now; a card's keeps its short wording (`short`, see BxBaseConnection::getElementAPI)
        if(($aParams['r'] ?? '') == 'object') 
            return $oConnection->getElementAPI($aParams['cid'], $aParams['iid'], !empty($aParams['short']) ? ['show_do_label_short' => true] : []);

        $aFlip = ['add' => 'remove', 'remove' => 'add'];

        return [
            'a' => $aFlip[$aParams['a']],
            'title' => $this->serviceGetActionTitle($aParams['o'], $aParams['a'], $aParams['iid'], $aParams['cid'], true),
        ];
    }

    public function serviceGetActionTitle($sObject, $sAction, $iInitiatorId, $iContentId, $bFlip = false)
    {
        if(empty($sAction))
            return '';

        $oConnection = BxDolConnection::getObjectInstance($sObject);
        if(!$oConnection || !$oConnection->isProfileContent())
            return '';

        $sMethod = 'get_menu_item_title_by_connection';
        $aContentProfileInfo = BxDolProfileQuery::getInstance()->getInfoById($iContentId);
        if(empty($aContentProfileInfo) || !is_array($aContentProfileInfo) || !BxDolRequest::serviceExists($aContentProfileInfo['type'], $sMethod))
            return '';

        $aTitles = bx_srv($aContentProfileInfo['type'], $sMethod, [$sObject, '', $iContentId, $iInitiatorId]);
        if(empty($aTitles) || !is_array($aTitles))
            return '';

        $aFlip = ['add' => 'remove', 'remove' => 'add'];
        if($bFlip)
            $sAction = $aFlip[$sAction];

        return !empty($aTitles[$sAction]) ? _t($aTitles[$sAction]) : '';
    }

    /**
     * get grid with friends connections
     */
    public function serviceConnectionsTable ($iProfileId = 0)
    {
        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return false;

        if(bx_is_api())
            return bx_srv('system', 'browse_friends', [
                'profile_id' => $iProfileId
            ], 'TemplServiceProfiles');

        $oGrid = BxDolGrid::getObjectInstance('sys_grid_connections');
        if(!$oGrid)
            return false;

        $oGrid->setProfile($iProfileId);
        return $oGrid->getCode();
    }

	/**
     * get grid with friends connection requests
     */
    public function serviceConnectionsRequestTable ()
    {
        $oGrid = BxDolGrid::getObjectInstance('sys_grid_connections_requests');
        if (!$oGrid)
            return false;

        return $oGrid->getCode();
    }

    /**
     * get number of received unconfirmed connections (friend requests)
     * @param $sConnectionsObject connections object to get unconfirmed connections from
     * @param $mixedId id to get connections for, if omitted then logged-in profile id is used
     * @param $bNew return all or only new (appeared since last check) unconfirmed connections
     * @return number
     */
    public function serviceGetUnconfirmedConnectionsNum ($sConnectionsObject, $mixedId = 0, $bNew = false)
    {
        $oConnection = BxDolConnection::getObjectInstance($sConnectionsObject);
        if (!$oConnection)
            return 0;

        if (!$mixedId)
            $mixedId = bx_get_logged_profile_id();

        $sMethodName = 'getConnectedInitiators';
        $aMethodParams = [$mixedId, 0];
        if($bNew) {
            $sMethodName .= 'Since';
            $aMethodParams = [$mixedId, BxDolProfileQuery::getInstance()->getProfileTrack($mixedId, 'view_friend_requests'), 0];
        }

        $i = 0;
        $a = call_user_func_array([$oConnection, $sMethodName], $aMethodParams); // get received friend requests
        foreach($a as $iId)
            if(BxDolProfile::getInstance($iId))
                ++$i;

        return $i;
    }

    public function serviceGetLiveUpdatesUnconfirmedConnections($sModule, $sConnectionsObject, $aMenuItemParent, $aMenuItemChild, $iCount = 0)
    {
        $iProfile = bx_get_logged_profile_id();
        $oProfile = BxDolProfile::getInstance($iProfile);
        if(!$oProfile || $oProfile->getModule() != $sModule)
            return false;

        $iCountNew = (int)$this->serviceGetUnconfirmedConnectionsNum($sConnectionsObject, $iProfile);
        if($iCountNew == (int)$iCount)
            return false;

        return array(
            'count' => $iCountNew, // required
            'method' => 'bx_menu_show_live_update(oData)', // required
            'data' => array(
                'code' => BxDolTemplate::getInstance()->parseHtmlByTemplateName('menu_item_addon', array(
                    'content' => '{count}'
                )),
                'mi_parent' => $aMenuItemParent,
                'mi_child' => $aMenuItemChild
            ),  // optional, may have some additional data to be passed in JS method provided using 'method' param above.
    	);
    }
    
    public function serviceGetLiveUpdatesUnconfirmedConnectionsNew($sModule, $sConnectionsObject, $aMenuItemParent, $aMenuItemChild, $iCount = 0)
    {
        $iProfile = bx_get_logged_profile_id();
        $oProfile = BxDolProfile::getInstance($iProfile);
        if(!$oProfile || $oProfile->getModule() != $sModule)
            return false;

        $iCountNew = (int)$this->serviceGetUnconfirmedConnectionsNum($sConnectionsObject, $iProfile, true);
        if($iCountNew == (int)$iCount)
            return false;

        return [
            'count' => $iCountNew, // required
            'method' => 'bx_menu_show_live_update(oData)', // required
            'data' => [
                'code' => BxDolTemplate::getInstance()->parseHtmlByTemplateName('menu_item_addon', [
                    'content' => '{count}'
                ]),
                'mi_parent' => $aMenuItemParent,
                'mi_child' => $aMenuItemChild
            ],  // optional, may have some additional data to be passed in JS method provided using 'method' param above.
    	];
    }

    /**
     * get number of initiated connections (like "my subscriptions")
     * @param $sConnectionsObject connections object to get connections from
     * @param $mixedId id to get connections for, if omitted then logged-in profile id is used
     * @return number
     */
    public function serviceGetConnectedContentNum ($sConnectionsObject, $mixedId = 0, $isMutual = false)
    {
        $oConnection = BxDolConnection::getObjectInstance($sConnectionsObject);
        if (!$oConnection)
            return 0;

        if (!$mixedId)
            $mixedId = bx_get_logged_profile_id();

        $i = 0;
        $a = $oConnection->getConnectedContent($mixedId, $isMutual, 0, BX_CONNECTIONS_LIST_NO_LIMIT); // get received friend requests
        foreach ($a as $iId)
            if (BxDolProfile::getInstance($iId))
                ++$i;

        return $i;
    }

    /**
     * get number of received connections (like "subscribed me")
     * @param $sConnectionsObject connections object to get connections from
     * @param $mixedId id to get connections for, if omitted then logged-in profile id is used
     * @return number
     */
    public function serviceGetConnectedInitiatorsNum ($sConnectionsObject, $mixedId = 0, $isMutual = false)
    {
        $oConnection = BxDolConnection::getObjectInstance($sConnectionsObject);
        if (!$oConnection)
            return 0;

        if (!$mixedId)
            $mixedId = bx_get_logged_profile_id();

        $i = 0;
        $a = $oConnection->getConnectedInitiators($mixedId, $isMutual, 0, BX_CONNECTIONS_LIST_NO_LIMIT); // get received friend requests
        foreach ($a as $iId)
            if (BxDolProfile::getInstance($iId))
                ++$i;

        return $i;
    }

    /**
     * get grid with subscriptions connections
     */
    public function serviceSubscriptionsTable ($iProfileId = 0)
    {
        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $oProfile = false;
        if(!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        $aProfile = $oProfile->getInfo();
        if(empty($aProfile) || !is_array($aProfile))
            return false;

        if(bx_is_api())
            return bx_srv('system', 'browse_subscriptions', [
                'profile_id' => $iProfileId,
            ], 'TemplServiceProfiles');

        $CNF = &BxDolModule::getInstance($aProfile['type'])->_oConfig->CNF;
        if(getParam($CNF['PARAM_PUBLIC_SBSN']) != 'on' && $aProfile['id'] != bx_get_logged_profile_id())
            return false;

        $oGrid = BxDolGrid::getObjectInstance('sys_grid_subscriptions');
        if (!$oGrid)
            return false;

        $oGrid->setProfileId($iProfileId);
        $sContent = $oGrid->getCode();
        if(empty($sContent))
            return false;

        return BxDolTemplate::getInstance()->parseHtmlByName('connections_list.html', array(
            'name' => 'subscriptions',
            'content' => $sContent
        ));
    }

    /**
     * get grid with subscribed me connections
     */
    public function serviceSubscribedMeTable ($iProfileId = 0)
    {
        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $oProfile = false;
        if(!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        $aProfile = $oProfile->getInfo();
        if(empty($aProfile) || !is_array($aProfile))
            return false;

        if(bx_is_api())
            return bx_srv('system', 'browse_subscribed_me', [
                'profile_id' => $iProfileId,
            ], 'TemplServiceProfiles');

        $CNF = &BxDolModule::getInstance($aProfile['type'])->_oConfig->CNF;
        if(getParam($CNF['PARAM_PUBLIC_SBSD']) != 'on' && $aProfile['id'] != bx_get_logged_profile_id())
            return false;

        $oGrid = BxDolGrid::getObjectInstance('sys_grid_subscribed_me');
        if(!$oGrid)
            return false;

        $oGrid->setProfileId($iProfileId);
        $sContent = $oGrid->getCode();
        if(empty($sContent))
            return false;

        return BxDolTemplate::getInstance()->parseHtmlByName('connections_list.html', array(
            'name' => 'subscribers',
            'content' => $sContent
        ));
    }

    /**
     * get grid with 'relations' connections
     */
    public function serviceRelationsTable ($iProfileId = 0)
    {
        if(!BxDolConnectionRelation::isEnabled())
            return false;

        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $oProfile = false;
        if(!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        $aProfile = $oProfile->getInfo();
        if(empty($aProfile) || !is_array($aProfile))
            return false;

        if(!BxDolConnection::getObjectInstance('sys_profiles_relations')->isRelationAvailableFromProfile($aProfile['type']))
            return false;

        $oGrid = BxDolGrid::getObjectInstance('sys_grid_relations');
        if (!$oGrid)
            return false;

        $oGrid->setProfileId($iProfileId);
        $sContent = $oGrid->getCode();
        if(empty($sContent))
            return false;

        return BxDolTemplate::getInstance()->parseHtmlByName('connections_list.html', array(
            'name' => 'relations',
            'content' => $sContent
        ));
    }

    /**
     * get grid with 'related me' connections
     */
    public function serviceRelatedMeTable ($iProfileId = 0)
    {
        if(!BxDolConnectionRelation::isEnabled())
            return false;

        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $oProfile = false;
        if(!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
            return false;

        $aProfile = $oProfile->getInfo();
        if(empty($aProfile) || !is_array($aProfile))
            return false;

        if(!BxDolConnection::getObjectInstance('sys_profiles_relations')->isRelationAvailableWithProfile($aProfile['type']))
            return false;

        $oGrid = BxDolGrid::getObjectInstance('sys_grid_related_me');
        if(!$oGrid)
            return false;

        $oGrid->setProfileId($iProfileId);
        $sContent = $oGrid->getCode();
        if(empty($sContent))
            return false;

        return BxDolTemplate::getInstance()->parseHtmlByName('connections_list.html', array(
            'name' => 'related-me',
            'content' => $sContent
        ));
    }

    /*
     * Get notification data for Notifications module - action Subscribe. 
     */
    public function serviceGetNotificationsPost($aEvent)
    {
        $iOwner = (int)$aEvent['owner_id'];
        $oOwner = BxDolProfile::getInstance($iOwner);
        if(!$oOwner)
            return array();

        $iProfile = (int)$aEvent['object_id'];
        $oProfile = BxDolProfile::getInstance($iProfile);
        if(!$oProfile)
            return array();

        return array(
            'entry_sample' => '_sys_profile_sample_single',
            'entry_url' => str_replace(BX_DOL_URL_ROOT, '{bx_url_root}', $oOwner->getUrl()),
            'entry_caption' => $oProfile->getDisplayName(),
            'entry_author' => $oProfile->id(),
            'lang_key' => '_sys_profile_subscription_added',
        );
    }

    /*
     * Get notification data for Notifications module - action Friend. 
     */
    public function serviceGetNotificationsPostFriendship($aEvent)
    {
        $iOwner = (int)$aEvent['owner_id'];
        $oOwner = BxDolProfile::getInstance($iOwner);
        if(!$oOwner)
            return array();

        $iProfile = (int)$aEvent['object_id'];
        $oProfile = BxDolProfile::getInstance($iProfile);
        if(!$oProfile)
            return array();

        $sLangKey = '_sys_profile_friendship_added';
        if(isset($aEvent['content']['request']) && (int)$aEvent['content']['request'] == 1)
            $sLangKey = '_sys_profile_friend_request_added';

        return array(
            'entry_sample' => '_sys_profile_sample_single',
            'entry_url' => str_replace(BX_DOL_URL_ROOT, '{bx_url_root}', $oOwner->getUrl()),
            'entry_caption' => $oProfile->getDisplayName(),
            'entry_author' => $oProfile->id(),
            'lang_key' => $sLangKey,
        );
    }

    public function serviceAlertResponseConnections($oAlert)
    {
        $sMethod = 'process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction);
        if(!method_exists($this, $sMethod))
            return;
            
        $this->$sMethod($oAlert);
    }

    protected function processSysProfilesFriendsConnectionAdded(&$oAlert)
    {
        if((int)$oAlert->aExtras['mutual'] != 1)
            return;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        $oConnection->addConnection((int)$oAlert->aExtras['initiator'], (int)$oAlert->aExtras['content'], array('alert_extras' => array('silent_mode' => 1)));
        $oConnection->addConnection((int)$oAlert->aExtras['content'], (int)$oAlert->aExtras['initiator'], array('alert_extras' => array('silent_mode' => 1)));
    }

    protected function processSysProfilesFriendsConnectionRemoved(&$oAlert)
    {
        if((int)$oAlert->aExtras['mutual'] != 1)
            return;

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        $oConnection->removeConnection((int)$oAlert->aExtras['initiator'], (int)$oAlert->aExtras['content']);
        $oConnection->removeConnection((int)$oAlert->aExtras['content'], (int)$oAlert->aExtras['initiator']);
    }
}

/** @} */
