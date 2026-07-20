<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_BASE_MOD_GROUPS_MMODE_MULTI_ROLES', 'multi_roles');

define('BX_BASE_MOD_GROUPS_ROLE_COMMON', 0);
define('BX_BASE_MOD_GROUPS_ROLE_ADMINISTRATOR', 1);
define('BX_BASE_MOD_GROUPS_ROLE_MODERATOR', 2);

define('BX_BASE_MOD_GROUPS_ACTION_EDIT', 'edit');
define('BX_BASE_MOD_GROUPS_ACTION_CHANGE_SETTINGS', 'change_settings');
define('BX_BASE_MOD_GROUPS_ACTION_CHANGE_COVER', 'change_cover');
define('BX_BASE_MOD_GROUPS_ACTION_INVITE', 'invite');
define('BX_BASE_MOD_GROUPS_ACTION_MANAGE_FANS', 'manage_fans');
define('BX_BASE_MOD_GROUPS_ACTION_MANAGE_ROLES', 'manage_roles');
define('BX_BASE_MOD_GROUPS_ACTION_DELETE', 'delete');
define('BX_BASE_MOD_GROUPS_ACTION_EDIT_CONTENT', 'edit_any');
define('BX_BASE_MOD_GROUPS_ACTION_DELETE_CONTENT', 'delete_any');
define('BX_BASE_MOD_GROUPS_ACTION_TIMELINE_POST_PIN', 'pin'); //for timeline posts only

define('BX_BASE_MOD_GROUPS_PERIOD_UNIT_DAY', 'day');
define('BX_BASE_MOD_GROUPS_PERIOD_UNIT_WEEK', 'week');
define('BX_BASE_MOD_GROUPS_PERIOD_UNIT_MONTH', 'month');
define('BX_BASE_MOD_GROUPS_PERIOD_UNIT_YEAR', 'year');

/**
 * Groups profiles module.
 */
class BxBaseModGroupsModule extends BxBaseModProfileModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;

        if(isset($CNF['FIELD_PUBLISHED']))
            $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, array(
                $CNF['FIELD_PUBLISHED'],
            ));
    }

    /**
     * Get possible recipients for start conversation form
     */
    public function actionAjaxGetInitialMembers ()
    {
        $sTerm = bx_get('term');

        $a = BxDolService::call('system', 'profiles_search', [$sTerm, ['module' => $this->_oConfig->getName()]], 'TemplServiceProfiles');

        header('Content-Type:text/javascript; charset=utf-8');
        echo(json_encode($a));
    }
    
    public function serviceGetInitialMembers ($sParams)
    {
        $aOptions = json_decode($sParams, true);
        if (!$sParams || !isset($aOptions['term']))
            return [];
        
        $a = BxDolService::call('system', 'profiles_search', [$aOptions['term'], ['module' => $this->_oConfig->getName()]], 'TemplServiceProfiles');

        return $a;
    }
    
    /**
     * Process Process Invitation
     */
    public function actionProcessInvite ($sKey, $iGroupProfileId, $bAccept)
    {
        return $this->serviceProcessInvite($sKey, $iGroupProfileId, $bAccept);
    }

    public function serviceProcessInvite ($sKey, $iGroupProfileId, $bAccept)
    {
        $aData = $this->_oDb->getInviteByKey($sKey, $iGroupProfileId);
        if (isset($aData['invited_profile_id'])){
            $CNF = &$this->_oConfig->CNF;
            if (!isset($CNF['OBJECT_CONNECTIONS']) || !($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])))
                return '';
            $iInvitedProfileId = $aData['invited_profile_id'];
            if ($iInvitedProfileId != bx_get_logged_profile_id())
                return '';
            if ($bAccept){
                if($oConnection && !$oConnection->isConnected($iInvitedProfileId, $iGroupProfileId)){
                    $oConnection->addConnection($iInvitedProfileId, $iGroupProfileId);
                    $oConnection->addConnection($iGroupProfileId, $iInvitedProfileId);
                }
            }
            $this->_oDb->deleteInviteByKey($sKey, $iGroupProfileId);
        }   
    }

    public function actionCheckName()
    {
        $CNF = &$this->_oConfig->CNF;

    	$sName = bx_process_input(bx_get('name'));
    	if(empty($sName))
            return echoJson(array());

        $sResult = '';

        $iId = (int)bx_get('id');
        if(!empty($iId)) {
            $aPrice = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iId)); 
            if(strcmp($sName, $aPrice[$CNF['FIELD_PRICE_NAME']]) == 0) 
                $sResult = $sName;
        }

    	echoJson(array(
            'name' => !empty($sResult) ? $sResult : $this->_oConfig->getPriceName($sName)
    	));
    }

    public function actionGetQuestionnaire()
    {
        $sSource = '';
        if(($sSource = bx_get('s')) !== false)
            $sSource = bx_process_url_param($sSource);

        $sObject = '';
        if(($sObject = bx_get('o')) !== false)
            $sObject = bx_process_url_param($sObject);
        
        $sAction = '';
        if(($sAction = bx_get('a')) !== false)
            $sAction = bx_process_url_param($sAction);

        $iContentProfileId = 0;
        if(($iContentProfileId = bx_get('cpi')) !== false)
            $iContentProfileId = (int)$iContentProfileId;

        echoJson($this->serviceGetQuestionnaire($sSource, $sObject, $sAction, $iContentProfileId));
    }

    public function serviceManageTools($sType = 'common')
    {
        $this->_oTemplate->addJs(['modules/base/groups/js/|manage_tools.js']);

        return parent::serviceManageTools($sType);
    }
    
    public function decodeDataAPI($aData, $aParams = [])
    {
        $CNF = $this->_oConfig->CNF;
        
        $aResult = parent::decodeDataAPI($aData, $aParams);

        if(isset($aParams['template']) && $aParams['template'] == 'unit_wo_info')
            return $aResult;

        if(getParam('sys_api_conn_in_prof_units') == 'on' && ($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])) !== false) {
            $oProfile = BxDolProfile::getInstanceByContentAndType($aData[$CNF['FIELD_ID']], $this->_aModule['name']);

            $aResult['members_count'] = $oConnection->getConnectedInitiatorsCount($oProfile->id(), false);
            $aResult['members_list'] = $oConnection->getConnectedListAPI($oProfile->id(), false, BX_CONNECTIONS_CONTENT_TYPE_INITIATORS);
        }

        return array_merge($aResult, [
            'author_data' => BxDolProfile::getData($aData[$CNF['FIELD_AUTHOR']]),
            'visibility' => $aData[$CNF['FIELD_ALLOW_VIEW_TO']]
        ]);
    }

    public function serviceGetMenuAddonManageTools()
    {
        $CNF = &$this->_oConfig->CNF;

        $aResult = parent::serviceGetMenuAddonManageTools();

        if(!empty($CNF['FIELD_STATUS_ADMIN']))
            $aResult['counter1_value'] = $this->_oDb->getEntriesNumByParams([[
                'key' => $CNF['FIELD_STATUS_ADMIN'],
                'value' => BX_BASE_MOD_GENERAL_STATUS_PENDING, 
                'operator' => '='
            ]]);

        return $aResult;
    }

    public function serviceGetOptionsMembersMode()
    {
        $CNF = &$this->_oConfig->CNF;

        return array(
            array('key' => '', 'value' => _t('_None')),
            array('key' => BX_BASE_MOD_GROUPS_MMODE_MULTI_ROLES, 'value' => _t($CNF['T']['option_members_mode_' . BX_BASE_MOD_GROUPS_MMODE_MULTI_ROLES])),
        );
    }

    public function serviceGetSearchResultUnit ($iContentId, $sUnitTemplate = '')
    {
        if(empty($sUnitTemplate))
            $sUnitTemplate = 'unit.html';

        return parent::serviceGetSearchResultUnit($iContentId, $sUnitTemplate);
    }

    /**
     * @see BxBaseModProfileModule::serviceGetSpaceTitle
     */ 
    public function serviceGetSpaceTitle()
    {
        return _t($this->_oConfig->CNF['T']['txt_sample_single']);
    }

    public function serviceGetFansConnectionObject()
    {
        $CNF = &$this->_oConfig->CNF;

        return ($sKey = 'OBJECT_CONNECTIONS') && !empty($CNF[$sKey]) && ($oConnection = BxDolConnection::getObjectInstance($CNF[$sKey])) !== false ? $oConnection : false;
    }

    /**
     * @see iBxDolProfileService::serviceGetParticipatingProfiles
     */ 
    public function serviceGetParticipatingProfiles($iProfileId, $aConnectionObjects = false)
    {
        $CNF = &$this->_oConfig->CNF;

        $mixedCo = $aConnectionObjects;
        $bCoEmpty = $mixedCo === false;
        $bCoString = !$bCoEmpty && is_string($mixedCo);

        $aConnectionObjects = [];
        if($bCoEmpty || ($bCoString && $mixedCo == 'subscriptions'))
            $aConnectionObjects[] = 'sys_profiles_subscriptions';
        
        if(($bCoEmpty || ($bCoString && $mixedCo == 'fans')) && !empty($CNF['OBJECT_CONNECTIONS']))
            $aConnectionObjects[] = $CNF['OBJECT_CONNECTIONS'];

        return parent::serviceGetParticipatingProfiles($iProfileId, $aConnectionObjects);
    }

    public function serviceGetSafeServices()
    {
        $CNF = &$this->_oConfig->CNF;

        $a = [
            'ProcessInvite' => '',
            'GetQuestionnaire' => '',
            'GetInitialMembers' => '',
            'EntityInvite' => '',
            'Invitations' => '',
            'FansWithoutAdmins' => '',
        ];

        if(!empty($CNF['OBJECT_RECOMMENDATIONS_FANS']))
            $a['BrowseRecommendationsFans'] = '';

        return array_merge(parent::serviceGetSafeServices(), $a);
    }

    /**
     * Check if this module entry can be used as profile
     */
    public function serviceActAsProfile ()
    {
        return false;
    }

    /**
     * Check if this module is group profile
     */
    public function serviceIsGroupProfile ()
    {
        return true;
    }

    public function serviceIsEnableForContext($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;
        $bRet = true;

        $sCnfKey = 'ENABLE_FOR_CONTEXT_IN_MODULES';
        if(empty($iProfileId) || empty($CNF[$sCnfKey]) || !is_array($CNF[$sCnfKey]))
            $bRet = false;

        $oProfile = null;
        if($bRet && !($oProfile = BxDolProfile::getInstance($iProfileId)))
            $bRet = false;

        if($bRet && !in_array($oProfile->getModule(), $CNF[$sCnfKey]))
            $bRet = false;

        bx_alert($this->getName(), 'is_enabled_for_context', $iProfileId, false, [
            'cnf' => $CNF,
            'module' => $this,
            'context_profile' => $oProfile,
            'result' => &$bRet
        ]);

        return $bRet;
    }

    /**
     * check if provided profile is member of the group 
     */ 
    public function serviceIsFan ($iGroupProfileId, $iProfileId = false) 
    {
        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        return $oGroupProfile !== false && $this->isFan($oGroupProfile->getContentId(), $iProfileId);
    }

    /**
     * check if provided profile is admin of the group 
     */ 
    public function serviceIsAdmin ($iGroupProfileId, $iProfileId = false) 
    {
        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        if(!$oGroupProfile)
            return false;

        $iGroupContentId = $oGroupProfile->getContentId();
        if(!$this->isFan($iGroupContentId, $iProfileId))
            return false;

        $aGroupContentInfo = $this->_oDb->getContentInfoById($iGroupContentId);
        return $this->_oDb->isAdmin($iGroupProfileId, $iProfileId, $aGroupContentInfo);
    }

    public function serviceGetAdminRole($iGroupProfileId, $iProfileId = false)
    {
        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        if(!$this->serviceIsAdmin($iGroupProfileId, $iProfileId))
            return 0;

        return $this->_oDb->getRole($iGroupProfileId, $iProfileId);
    }

    /*
     * Get context (group) advanced members who can perform the specified action.
     * If 'Roles' are disabled for the context then all context admins are returned.
     */
    public function serviceGetAdminsByAction($iGroupProfileId, $mixedAction)
    {
        if(!$this->_oConfig->isAdmins())
            return [];

        $aGroupContentInfo = $this->_oDb->getContentInfoByProfileId($iGroupProfileId);
        if(empty($aGroupContentInfo) || !is_array($aGroupContentInfo))
            return [];

        $aAdmins = $this->_oDb->getAdmins($iGroupProfileId);
        if(!$this->_oConfig->isRoles())
            return $aAdmins;

        if(!is_array($mixedAction))
            $mixedAction = [$mixedAction];

        $aResult = [];
        foreach($mixedAction as $sAction)
            foreach($aAdmins as $iAdminProfileId)
                if(!in_array($iAdminProfileId, $aResult) && $this->isAllowedActionByRole($sAction, $aGroupContentInfo, $iGroupProfileId, $iAdminProfileId))
                    $aResult[] = $iAdminProfileId;

        return $aResult;
    }

    public function serviceGetAdminsToManageContent($iGroupProfileId)
    {
        return $this->serviceGetAdminsByAction($iGroupProfileId, [
            BX_BASE_MOD_GROUPS_ACTION_EDIT_CONTENT, 
            BX_BASE_MOD_GROUPS_ACTION_DELETE_CONTENT
        ]);
    }

    /**
     * Delete profile from fans and admins tables
     * @param $iProfileId profile id 
     */
    public function serviceDeleteProfileFromFansAndAdmins ($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $this->_oDb->deleteAdminsByProfileId($iProfileId);

        if (isset($CNF['OBJECT_CONNECTIONS']) && ($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])))
            $oConnection->onDeleteInitiatorAndContent($iProfileId);
    }

    /**
     * Reset group's author for particular group
     * @param $iContentId group id 
     * @parem $iAuthorId new author profile ID
     * @return false of error, or number of updated records on success
     */
    public function serviceReassignEntityAuthor ($iContentId, $iAuthorId = 0)
    {
        $aContentInfo = $this->_oDb->getContentInfoById((int)$iContentId);
        if (!$aContentInfo)
            return false;

        if (empty($iAuthorId)) {
            $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName());
            if (!$oGroupProfile)
                return false;

            $aAdmins = $this->_oDb->getAdmins($oGroupProfile->id());
            if($aAdmins)
                $iAuthorId = array_pop($aAdmins);
        }

        return $this->_oDb->updateAuthorById($iContentId, $iAuthorId);
    }

    /**
     * Entry actions and social sharing block
     */
    public function serviceEntityAllActions ($mixedContent = false, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        if(!empty($mixedContent)) {
            if(!is_array($mixedContent))
                $mixedContent = array((int)$mixedContent, (method_exists($this->_oDb, 'getContentInfoById')) ? $this->_oDb->getContentInfoById((int)$mixedContent) : array());
        }
        else {
            $mixedContent = $this->_getContent();
            if($mixedContent === false)
                return false;
        }

        list($iContentId, $aContentInfo) = $mixedContent;

        if(!empty($CNF['FIELD_PICTURE']) && !empty($aContentInfo[$CNF['FIELD_PICTURE']]))
            $aParams = array_merge(array(
                'entry_thumb' => (int)$aContentInfo[$CNF['FIELD_PICTURE']]
            ), $aParams); 

        return parent::serviceEntityAllActions ($mixedContent, $aParams);
    }
    
    /**
     * Reset group's author when author profile is deleted
     * @param $iProfileId author profile id 
     * @param $iAuthorId new author profile id 
     * @return number of changed items
     */
    public function serviceReassignEntitiesByAuthor ($iProfileId, $iAuthorId = 0)
    {
        $a = $this->_oDb->getEntriesByAuthor((int)$iProfileId);
        if (!$a)
            return 0;

        $iCount = 0;
        foreach ($a as $aContentInfo)
            $iCount += ('' == $this->serviceReassignEntityAuthor($aContentInfo[$this->_oConfig->CNF['FIELD_ID']], $iAuthorId) ? 1 : 0);

        return $iCount;
    }

    public function servicePrepareFields ($aFieldsProfile)
    {
        $CNF = &$this->_oConfig->CNF;
        
        $aFieldsProfile[$CNF['FIELD_NAME']] = $aFieldsProfile['name'];
        $aFieldsProfile[$CNF['FIELD_TEXT']] = isset($aFieldsProfile['description']) ? $aFieldsProfile['description'] : '';
        unset($aFieldsProfile['name']);
        unset($aFieldsProfile['description']);
        return $aFieldsProfile;
    }

    public function serviceOnRemoveConnection ($iGroupProfileId, $iInitiatorId)
    {
        $CNF = &$this->_oConfig->CNF;

        list ($iProfileId, $iGroupProfileId, $oGroupProfile) = $this->_prepareProfileAndGroupProfile($iGroupProfileId, $iInitiatorId);
        if (!$oGroupProfile)
            return false;

        $this->_oDb->fromAdmins($iGroupProfileId, $iProfileId);

        if ($oConn = BxDolConnection::getObjectInstance('sys_profiles_subscriptions'))
            return $oConn->removeConnection($iProfileId, $iGroupProfileId);

        return false;
    }

    public function serviceAddInvitation ($iContextPid, $iPid, $iPerformerPid = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $oGroupProfile = false;
        if(!($oGroupProfile = BxDolProfile::getInstance($iContextPid)))
            return false;

        if(!($aContentInfo = $this->_oDb->getContentInfoById((int)$oGroupProfile->getContentId())))
            return false;

        $oConnection = false;
        if(!isset($CNF['OBJECT_CONNECTIONS']) || !($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])))
            return false;

        if($oConnection->isConnected((int)$iPid, $iContextPid) || $oConnection->isConnected($iContextPid, (int)$iPid))
            return false;

        if(!$iPerformerPid)
            $iPerformerPid = bx_get_logged_profile_id();

        $sEntryUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']]);
        if(!empty($CNF['TABLE_INVITES']) && !$this->_oDb->isInviteByInvited($iPid, $iContextPid)) {
            $sKey = BxDolKey::getInstance()->getNewKey(false, $CNF['INVITES_KEYS_LIFETIME']);

            $this->_oDb->insertInvite($sKey, $iContextPid, $iPerformerPid, $iPid);

            $sEntryUrl = bx_append_url_params($sEntryUrl, [
                'key' => $sKey
            ]);
        }

        $sModule = $this->getName();

        /**
         * @hooks
         * @hookdef hook-bx_base_groups-join_invitation '{module_name}', 'join_invitation' - hook before adding (sending) new join to context invitation
         * - $unit_name - module name
         * - $action - equals `join_invitation`
         * - $object_id - context id
         * - $sender_id - context profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `content` - [array] context info array as key&value pairs
         *      - `entry_title` - [string] context title
         *      - `entry_url` - [string] context URL
         *      - `group_profile` - [int] context profile id
         *      - `profile` - [int] profile id who was invited
         *      - `notification_subobject_id` - [int] profile id who was invited
         *      - `object_author_id` - [int] context profile id
         * @hook @ref hook-bx_base_groups-join_invitation
         */
        bx_alert($sModule, 'join_invitation', $aContentInfo[$CNF['FIELD_ID']], $iContextPid, [
            'content' => $aContentInfo, 
            'entry_title' => $aContentInfo[$CNF['FIELD_NAME']], 
            'entry_url' => bx_absolute_url($sEntryUrl), 
            'group_profile' => $iContextPid, 
            'profile' => $iPid, 
            'notification_subobject_id' => $iPid, 
            'object_author_id' => $iContextPid
        ]);

        /**
         * 'Invitation Received' alert for Notifications module.
         * Note. It's essential to use Recipient ($iPid) in 'object_author_id' parameter. 
         * In this case notification will be received by Recipient profile.
         */
        /**
         * @hooks
         * @hookdef hook-bx_base_groups-join_invitation_notif '{module_name}', 'join_invitation_notif' - hook before adding new join to context invitation. Is needed for Notifications module.
         * - $unit_name - module name
         * - $action - equals `join_invitation_notif`
         * - $object_id - context id
         * - $sender_id - context profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] profile id who was invited
         *      - `privacy_view` - [int] or [string] privacy for view context action, @see BxDolPrivacy
         * @hook @ref hook-bx_base_groups-join_invitation_notif
         */
        bx_alert($sModule, 'join_invitation_notif', $aContentInfo[$CNF['FIELD_ID']], $iContextPid, [
            'object_author_id' => $iPid, 
            'privacy_view' => isset($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) ? $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']] : 3, 
        ]);

        return true;
    }

    public function serviceAddMutualConnection ($iGroupProfileId, $iInitiatorId, $bSendInviteOnly = false)
    {        
        $CNF = &$this->_oConfig->CNF;

        list($iProfileId, $iGroupProfileId, $oGroupProfile) = $this->_prepareProfileAndGroupProfile($iGroupProfileId, $iInitiatorId);
        if(!$oGroupProfile)
            return false;

        if(!($aContentInfo = $this->_oDb->getContentInfoById((int)BxDolProfile::getInstance($iGroupProfileId)->getContentId())))
            return false;

        $oConnection = false;
        if(!isset($CNF['OBJECT_CONNECTIONS']) || !($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])))
            return false;

        $sEntryTitle = $aContentInfo[$CNF['FIELD_NAME']];
        $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']]));

        // send invitation to the group 
        $iPerformerId = bx_get_logged_profile_id();
        if($bSendInviteOnly)
            return $iProfileId != $iPerformerId ? $this->serviceAddInvitation($oGroupProfile->id(), $iInitiatorId, $iPerformerId) : false;

        $sModule = $this->getName();
        $sModuleGroup = $oGroupProfile->getModule();

        // send notification to group's admins that new connection is pending confirmation 
        if($oConnection->isConnected((int)$iInitiatorId, $oGroupProfile->id()) && !$oConnection->isConnected($oGroupProfile->id(), (int)$iInitiatorId) && $aContentInfo['join_confirmation'] && $aContentInfo[$CNF['FIELD_AUTHOR']] != $iProfileId) {
            /**
             * @hooks
             * @hookdef hook-bx_base_groups-join_request '{module_name}', 'join_request' - hook before adding new join to context request
             * - $unit_name - module name
             * - $action - equals `join_request`
             * - $object_id - context id
             * - $sender_id - context profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `object_author_id` - [int] context profile id
             *      - `performer_id` - [int] profile id who wants to join
             *      - `content` - [array] context info array as key&value pairs
             *      - `entry_title` - [string] context title
             *      - `entry_url` - [string] context URL
             *      - `group_profile` - [int] context profile id
             *      - `profile` - [int] profile id who wants to join
             * @hook @ref hook-bx_base_groups-join_request
             */
            bx_alert($this->getName(), 'join_request', $aContentInfo[$CNF['FIELD_ID']], $iGroupProfileId, [
            	'object_author_id' => $iGroupProfileId,
            	'performer_id' => $iProfileId, 

            	'content' => $aContentInfo, 
            	'entry_title' => $sEntryTitle, 
            	'entry_url' => $sEntryUrl, 

            	'group_profile' => $iGroupProfileId, 
            	'profile' => $iProfileId
            ]);
        }
        // send notification that join request was accepted 
        else if($oConnection->isConnected((int)$iInitiatorId, $oGroupProfile->id(), true) && $sModuleGroup != $sModule && $iProfileId != $iPerformerId) {
            /**
             * @hooks
             * @hookdef hook-bx_base_groups-join_request_accepted '{module_name}', 'join_request_accepted' - hook before accepting join to context request
             * It's equivalent to @ref hook-bx_base_groups-join_request
             * @hook @ref hook-bx_base_groups-join_request_accepted
             */
            bx_alert($this->getName(), 'join_request_accepted', $aContentInfo[$CNF['FIELD_ID']], $iGroupProfileId, [
            	'object_author_id' => $iGroupProfileId,
            	'performer_id' => $iProfileId,

            	'content' => $aContentInfo, 
            	'entry_title' => $sEntryTitle, 
            	'entry_url' => $sEntryUrl, 

            	'group_profile' => $iGroupProfileId, 
            	'profile' => $iProfileId
            ]);
        }

        // new fan was added
        if($oConnection->isConnected($oGroupProfile->id(), (int)$iInitiatorId, true)) {
            // follow group on join
            if(bx_srv($sModuleGroup, 'act_as_profile'))
                 $this->addFollower($oGroupProfile->id(), (int)$iInitiatorId);
            else
                 $this->addFollower((int)$iInitiatorId, $oGroupProfile->id()); 

            if($aContentInfo[$CNF['FIELD_AUTHOR']] != $iProfileId) {
                /**
                 * @hooks
                 * @hookdef hook-bx_base_groups-fan_added '{module_name}', 'fan_added' - hook before adding (registering) new context member
                 * It's equivalent to @ref hook-bx_base_groups-join_request
                 * @hook @ref hook-bx_base_groups-fan_added
                 */
                bx_alert($this->getName(), 'fan_added', $aContentInfo[$CNF['FIELD_ID']], $iGroupProfileId, [
                    'object_author_id' => $iGroupProfileId,
                    'performer_id' => $iProfileId,

                    'content' => $aContentInfo,
                    'entry_title' => $sEntryTitle, 
                    'entry_url' => $sEntryUrl,

                    'group_profile' => $iGroupProfileId, 
                    'profile' => $iProfileId,
                ]);
            }

            $this->doAudit($iGroupProfileId, $iInitiatorId, '_sys_audit_action_group_join_request_accepted');
            
            return false;
        }

        // don't automatically add connection (mutual) if group requires manual join confirmation
        if($aContentInfo['join_confirmation'])
            return false;

        // check if connection already exists
        if($oConnection->isConnected($oGroupProfile->id(), (int)$iInitiatorId, true) || $oConnection->isConnected($oGroupProfile->id(), (int)$iInitiatorId))
            return false;

        if(!$oConnection->addConnection($oGroupProfile->id(), (int)$iInitiatorId))
            return false;

        return true;
    }

    public function serviceFansTable ()
    {
        $CNF = &$this->_oConfig->CNF;

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_CONNECTIONS']);
        if(!$oGrid)
            return false;

        if($this->_bIsApi){
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];
        }

        return $oGrid->getCode();
    }
    
    public function serviceInvitesTable ()
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($CNF['OBJECT_GRID_INVITES']))
            return false;

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_INVITES']);
        if(!$oGrid)
            return false;

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        return $oGrid->getCode();
    }

    public function serviceBansTable ()
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($CNF['OBJECT_GRID_BANS']))
            return false;

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_BANS']);
        if(!$oGrid)
            return false;

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        return $oGrid->getCode();
    }

    public function serviceInvitations ($iInvitedPid = 0, $bAsArray = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iInvitedPid)
            $iInvitedPid = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iInvitedPid)
            return false;

        $aInvites = $this->_oDb->getInvites(['sample' => 'invited_pid', 'invited_pid' => $iInvitedPid]);
        if(empty($aInvites) || !is_array($aInvites))
            return false;

        if($bAsArray)
            return $aInvites;

        $iStart = $iLimit = 0;
        if($this->_bIsApi) {
            $aParams = bx_api_get_browse_params($bAsArray);

            $iStart = isset($aParams['start']) ? (int)$aParams['start'] : 0;
            $iLimit = isset($aParams['per_page']) ? (int)$aParams['per_page'] : 0;
        }
        else {
            $iStart = (int)bx_get('start');
            $iLimit = (int)bx_get('per_page');
        }

        $iLimit = !$iLimit && ($sKey = 'PARAM_NUM_CONNECTIONS_QUICK') && !empty($CNF[$sKey]) && ($iValue = (int)getParam($CNF[$sKey])) ? $iValue : 4;

        if($this->_bIsApi) {
            $aData = [
                'data' => [],
                'request_url' => '/api.php?r=' . $this->_oConfig->getName() . '/invites/&params[]=' . $iInvitedPid . '&params[]=',
                'params' => [
                    'start' => $iStart,
                    'per_page' => $iLimit
                ]
            ];

            foreach($aInvites as $aInvite)
                $aData['data'][] = BxDolProfile::getData($aInvite['group_profile_id']);

            return [bx_api_get_block('profiles_list', $aData)];
        }
        else
            return $this->_serviceBrowseQuick(array_keys($aInvites), $iStart, $iLimit);
    }

    public function serviceFans ($iContentId = 0, $bAsArray = false)
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

        if(is_bool($bAsArray) && $bAsArray === true)
            return BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])->getConnectedContent($oGroupProfile->id(), true);

        if($this->_bIsApi) {
            $aParams = bx_api_get_browse_params($bAsArray);

            $iStart = isset($aParams['start']) ? (int)$aParams['start'] : 0;
            $iLimit = isset($aParams['per_page']) ? (int)$aParams['per_page'] : 0;
            $iLimit = !$iLimit && ($sKey = 'PARAM_NUM_CONNECTIONS_QUICK') && !empty($CNF[$sKey]) && ($iValue = (int)getParam($CNF[$sKey])) ? $iValue : 4;

            $aProfiles = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])->getConnectedContent($oGroupProfile->id(), true, $iStart, $iLimit);
            if(empty($aProfiles) || !is_array($aProfiles))
                return false;

            $aData = [
                'data' => [],
                'request_url' => '/api.php?r=' . $this->_oConfig->getName() . '/fans/&params[]=' . $iContentId . '&params[]=',
                'params' => [
                    'start' => $iStart,
                    'per_page' => $iLimit
                ]
            ];

            foreach($aProfiles as $iProfileId)
                $aData['data'][] = BxDolProfile::getData($iProfileId);

            return [bx_api_get_block('profiles_list', $aData)];
        }

        bx_import('BxDolConnection');
        $mixedResult = $this->serviceBrowseConnectionsQuick ($oGroupProfile->id(), $CNF['OBJECT_CONNECTIONS'], BX_CONNECTIONS_CONTENT_TYPE_CONTENT, true);
        if(!$mixedResult)
            return MsgBox(_t('_sys_txt_empty'));

        return $mixedResult;
    }
    
    public function serviceFansWithoutAdmins ($iContentId = 0, $bAsArray = false)
    {
        if (!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iContentId)
            return false;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo)
            return false;

        if (!($oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName())))
            return false;
        
        $CNF = &$this->_oConfig->CNF;

        $aFans = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])->getConnectedContent($oGroupProfile->id(), true);
        if(empty($aFans) || !is_array($aFans))
            return false;

        $aAdmins = $this->_oDb->getAdmins($oGroupProfile->id());
        if(!empty($aAdmins) && is_array($aAdmins) && !($aFans = array_diff($aFans, $aAdmins)))
            return false;

        if(is_bool($bAsArray) && $bAsArray === true)
            return $aFans;

        $iStart = $iLimit = 0;
        if($this->_bIsApi) {
            $aParams = bx_api_get_browse_params($bAsArray);

            $iStart = isset($aParams['start']) ? (int)$aParams['start'] : 0;
            $iLimit = isset($aParams['per_page']) ? (int)$aParams['per_page'] : 0;
        }
        else {
            $iStart = (int)bx_get('start');
            $iLimit = (int)bx_get('per_page');
        }

        $iLimit = !$iLimit && ($sKey = 'PARAM_NUM_CONNECTIONS_QUICK') && !empty($CNF[$sKey]) && ($iValue = (int)getParam($CNF[$sKey])) ? $iValue : 4;

        if($this->_bIsApi) {
            $aData = [
                'data' => [],
                'request_url' => '/api.php?r=' . $this->_oConfig->getName() . '/fans_without_admins/&params[]=' . $iContentId . '&params[]=',
                'params' => [
                    'start' => $iStart,
                    'per_page' => $iLimit
                ]
            ];

            foreach($aProfiles as $iProfileId)
                $aData['data'][] = BxDolProfile::getData($iProfileId);

            return [bx_api_get_block('profiles_list', $aData)];
        }
        else
            return $this->_serviceBrowseQuick($aFans, $iStart, $iLimit);
    }

    public function serviceAdmins ($iContentId = 0, $sParams = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iContentId)
            return false;

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName());
        if(!$oGroupProfile)
            return false;

        $iStart = (int)bx_get('start');
        $iLimit = !empty($CNF['PARAM_NUM_CONNECTIONS_QUICK']) ? (int)getParam($CNF['PARAM_NUM_CONNECTIONS_QUICK']) : 4;
        if(!$iLimit)
            $iLimit = 4;

        if($this->_bIsApi && ($aParams = bx_api_get_browse_params($sParams))) {
            if(isset($aParams['start']))
                $iStart = (int)$aParams['start'];
            if(isset($aParams['per_page']))
                $iLimit = (int)$aParams['per_page'];
        }

        $aProfiles = $this->_oDb->getAdmins($oGroupProfile->id(), $iStart,  $iLimit+1);
        if(empty($aProfiles) || !is_array($aProfiles))
            return false;

        if($this->_bIsApi) {
            $aData = [
                'data' => [],
                'request_url' => '/api.php?r=' . $this->_oConfig->getName() . '/admins/&params[]=' . $iContentId . '&params[]=',
                'params' => [
                    'start' => $iStart,
                    'per_page' => $iLimit
                ]
            ];
            foreach($aProfiles as $iProfileId)
                $aData['data'][] = BxDolProfile::getData($iProfileId);

            return [bx_api_get_block('profiles_list', $aData)];
        }

        return $this->_serviceBrowseQuick($aProfiles, $iStart, $iLimit);
    }

    public function serviceMembersByRole ($iContentId = 0, $iRole = BX_BASE_MOD_GROUPS_ROLE_COMMON)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iContentId)
            return false;

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName());
        if(!$oGroupProfile)
            return false;

        $iStart = (int)bx_get('start');
        $iLimit = !empty($CNF['PARAM_NUM_CONNECTIONS_QUICK']) ? getParam($CNF['PARAM_NUM_CONNECTIONS_QUICK']) : 4;
        if(!$iLimit)
            $iLimit = 4;

        $aProfiles = $this->_oDb->getRoles([
            'type' => 'fan_pids_by_group_pid', 
            'group_profile_id' => $oGroupProfile->id(), 
            'role' => $iRole,
            'start' => $iStart,  
            'limit' => $iLimit + 1
        ]);

        if(empty($aProfiles) || !is_array($aProfiles))
            return false;

        return $this->_serviceBrowseQuick($aProfiles, $iStart, $iLimit);
    }

    public function serviceBrowseJoinedEntries ($iProfileId = 0, $bDisplayEmptyMsg = false)
    {
        if (!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if (!$iProfileId)
            return '';

        return $this->_serviceBrowse ('joined_entries', array('joined_profile' => $iProfileId), BX_DB_PADDING_DEF, $bDisplayEmptyMsg);
    }

    /**
     * Display entries posted into particular context and joined by profile
     */
    public function serviceBrowseContextJoinedEntries ($iContextPid = 0, $iProfileId = 0, $aParams = [])
    {
        if(!$iContextPid)
            $iContextPid = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iContextPid)
            return $this->_bIsApi ? [] : '';

        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId)
            return $this->_bIsApi ? [] : '';

        $bEmptyMessage = true;
        if(isset($aParams['empty_message'])) {
            $bEmptyMessage = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }

        $bAjaxPaginate = true;
        if(isset($aParams['ajax_paginate'])) {
            $bAjaxPaginate = (bool)$aParams['ajax_paginate'];
            unset($aParams['ajax_paginate']);
        }

        return $this->_serviceBrowse ('context_joined_entries', ['context' => $iContextPid, 'joined_profile' => $iProfileId], BX_DB_PADDING_DEF, $bEmptyMessage, $bAjaxPaginate);
    }

    public function serviceBrowseFollowedEntries ($iProfileId = 0, $bDisplayEmptyMsg = false)
    {
        if (!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if (!$iProfileId)
            return '';

        return $this->_serviceBrowse ('followed_entries', array('followed_profile' => $iProfileId), BX_DB_PADDING_DEF, $bDisplayEmptyMsg);
    }

    public function serviceBrowseCreatedEntries ($iProfileId = 0, $bDisplayEmptyMsg = false)
    {
        if (!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if (!$iProfileId)
            return '';

        return $this->_serviceBrowse ('created_entries', array('author' => $iProfileId), BX_DB_PADDING_DEF, $bDisplayEmptyMsg);
    }

    public function serviceBrowseRecommendationsFans ($iProfileId = 0, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        if($this->_bIsApi)
            $aParams = bx_api_get_browse_params($aParams, true);

        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId)
            return '';

        $aParams = array_merge([
            'empty_message' => false,
            'start' => 0,
            'per_page' => 0
        ], $aParams);

        if(($iStartGet = bx_get('start')) !== false)
            $aParams['start'] = (int)$iStartGet;

        if(($iPerPageGet = bx_get('per_page')) !== false)
            $aParams['per_page'] = (int)$iPerPageGet;

        $oRecommendation = BxDolRecommendation::getObjectInstance($CNF['OBJECT_RECOMMENDATIONS_FANS']);
        if(!$oRecommendation)
            return false;

        if($this->_bIsApi) {
            $aData = $oRecommendation->getCodeAPI($iProfileId, $aParams);
            $aData = array_merge($aData, [
                'module' => 'system',
                'unit' => 'mixed', 
                'request_url' => '/api.php?r=' . $this->getName() .'/browse_recommendations_fans&params[]=' . $iProfileId . '&params[]='
            ]);

            return [bx_api_get_block('browse', $aData)];
        }

        $sCode = $oRecommendation->getCode($iProfileId, $aParams);
        if(!$sCode && $aParams['empty_message'])
            $sCode = MsgBox(_t(!empty($aParams['empty_message_text']) ? $aParams['empty_message_text'] : '_Empty'));

        return $sCode;
    }

    public function serviceBrowseMembers ($iProfileId = 0, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return '';

        $oGroupProfile = BxDolProfile::getInstance($iProfileId);
        if(!($oGroupProfile))
            return '';

        return bx_srv('system', 'browse_members', [$oGroupProfile->id(), $CNF['OBJECT_CONNECTIONS'], $aParams], 'TemplServiceProfiles');
    }

    public function serviceEntityEditQuestionnaire($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return '';

        $aProfileInfo = BxDolProfileQuery::getInstance()->getInfoById($iProfileId);
        if(empty($aProfileInfo) || !is_array($aProfileInfo))
            return '';
        
        $aContentInfo = $this->_oDb->getContentInfoById($aProfileInfo['content_id']);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return '';

        if($this->checkAllowedEdit($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox(_t('_Access denied'));

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_QUESTIONS_MANAGE']);
        if(!$oGrid)
            return '';
        
        if($this->_bIsApi){
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];
        }

        return $oGrid->getCode();
    }

    public function serviceEntityPricing($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return $this->_bIsApi ? [] : '';

        if(!$this->_oConfig->isPaidJoin())
            return $this->_bIsApi ? [] : '';

        $oPayments = BxDolPayments::getInstance();
        if(!$oPayments->isActive())
            return ($sMsg = _t('_sys_payments_err_no_payments')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

        if($this->checkAllowedUsePaidJoin() !== CHECK_ACTION_RESULT_ALLOWED)
            return ($sMsg = _t('_Access denied')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

        if($this->checkAllowedManageAdmins($iProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return ($sMsg = _t('_Access denied')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_PRICES_MANAGE']);
        if(!$oGrid)
            return '';

        $sNote = '';
        if(!$oPayments->isAcceptingPayments($this->_iProfileId))
            $sNote = MsgBox(_t('_sys_payments_err_not_accept_payments', $oPayments->getDetailsUrl()));

        if($this->_bIsApi) {
            $aBlocks = [];
            if(!empty($sNote))
                $aBlocks[] = bx_api_get_msg($sNote);
            $aBlocks[] = bx_api_get_block('grid', $oGrid->getCodeAPI(true));

            return $aBlocks;
        }

        return $sNote . $oGrid->getCode();
    }

    public function serviceEntityJoin($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileId)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if(!$iProfileId)
            return $this->_bIsApi ? [] : '';

        if(!$this->_oConfig->isPaidJoin())
            return $this->_bIsApi ? [] : '';

        if($this->_bIsApi && !$this->isPaidJoinByProfile($iProfileId))
            return [];

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_PRICES_VIEW']);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        $oGrid->setProfileId($iProfileId);

        if($this->_bIsApi) {
            $aContentInfo = $this->_oDb->getContentInfoByProfileId($iProfileId);

            return [
                bx_api_get_block('pricing', array_merge_recursive($oGrid->getCodeAPI(true), ['settings' => [
                    'context_name' => $aContentInfo[$CNF['FIELD_TITLE']],
                    'unit' => 'productlist'
                ]]))
            ];
        }

        return $oGrid->getCode();
    }

    public function serviceEntityInvite ($iContentId = 0, $bErrorMsg = true)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($CNF['OBJECT_FORM_ENTRY_DISPLAY_INVITE']))
            return false;

        return $this->_serviceEntityForm ('inviteForm', $iContentId, false, false, $bErrorMsg);
    }
    
    /**
     * Entry social sharing block
     */
    public function serviceEntitySocialSharing ($mixedContent = false, $aParams = array())
    {
        if(!empty($mixedContent)) {
            if(!is_array($mixedContent))
               $mixedContent = array((int)$mixedContent, array());
        }
        else {
            $mixedContent = $this->_getContent();
            if($mixedContent === false)
                return false;
        }

        list($iContentId, $aContentInfo) = $mixedContent;

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType((int)$iContentId, $this->getName());
        if(!$oGroupProfile)
            return false;

        return parent::serviceEntitySocialSharing(array($iContentId, $aContentInfo), array(
            'title' => $oGroupProfile->getDisplayName()
        ));
    }

    public function serviceIsPricingAvaliable($iProfileId)
    {
        if(!$this->_oConfig->isPaidJoin())
            return false;

        if($this->checkAllowedUsePaidJoin() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;        

        if($this->checkAllowedManageAdmins($iProfileId) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return true;
    }

    public function serviceIsPaidJoinAvaliable($iGroupProfileId, $iProfileId = 0)
    {
        return $this->isPaidJoinByProfileForProfile($iGroupProfileId, $iProfileId);
    }

    public function serviceIsPaidJoinAvaliableByContent($iGroupContentId, $iProfileId = 0)
    {
        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iGroupContentId, $this->getName());
        if(!$oGroupProfile)
            return false;

        return $this->isPaidJoinByProfileForProfile($oGroupProfile->id(), $iProfileId);
    }

    public function serviceIsFreeJoinAvaliable($iGroupProfileId, $iProfileId = 0)
    {
        return !$this->isPaidJoinByProfileForProfile($iGroupProfileId, $iProfileId);
    }

    public function serviceIsFreeJoinAvaliableByContent($iGroupContentId, $iProfileId = 0)
    {
        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iGroupContentId, $this->getName());
        if(!$oGroupProfile)
            return false;

        return !$this->isPaidJoinByProfileForProfile($oGroupProfile->id(), $iProfileId);
    }

    /**
     * Is Paid Join enabled in the group and whether a profile can use it.
     * 
     * @param type $iGroupProfileId - Group profile ID.
     * @param type $iProfileId - Profile ID of the user who wants to join.
     * @return boolean
     */
    public function isPaidJoinByProfileForProfile($iGroupProfileId, $iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($iProfileId))
            $iProfileId = $this->_iProfileId;

        if(BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])->isConnected($iProfileId, $iGroupProfileId))
            return false;

        return $this->isPaidJoinByProfile($iGroupProfileId);
    }

    /**
     * Is Paid Join enabled as is and whether a group has pricing plans added.
     * 
     * @param type $iGroupProfileId - Group profile ID.
     * @return boolean
     */
    public function isPaidJoinByProfile($iGroupProfileId)
    {
        if(!$this->_oConfig->isPaidJoin())
            return false;

        $aPrices = $this->_oDb->getPrices(['type' => 'by_profile_id', 'profile_id' => $iGroupProfileId, 'active' => 1]);
        if(empty($aPrices) || !is_array($aPrices))
            return false;

        return true;
    }

    /**
     * Integration with Payments.
     */
    public function serviceGetPaymentData()
    {
        return $this->_aModule;
    }

    public function serviceGetCartItem($mixedItemId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$mixedItemId)
            return [];

        if(is_numeric($mixedItemId))
            $aItem = $this->_oDb->getPrices(['type' => 'by_id', 'value' => (int)$mixedItemId]);
        else 
            $aItem = $this->_oDb->getPrices(['type' => 'by_name', 'value' => $mixedItemId]);

        if(empty($aItem) || !is_array($aItem))
            return [];

        if(!$this->isPaidJoinByProfile($aItem['profile_id']))
            return [];

        $oGroupProfile = BxDolProfile::getInstance($aItem['profile_id']);
        if(!$oGroupProfile)
            return [];

        $aGroupProfile = $this->_oDb->getContentInfoById($oGroupProfile->getContentId());
        
        $aRoles = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_ROLES']);

        $sTitle = '';
        if(!empty($aItem['period']) && !empty($aItem['period_unit']))
            $sTitle = _t($CNF['T']['txt_cart_item_title'], $oGroupProfile->getDisplayName(), $aRoles[$aItem['role_id']], $aItem['period'], $aItem['period_unit']);
        else
            $sTitle = _t($CNF['T']['txt_cart_item_title_lifetime'], $oGroupProfile->getDisplayName(), $aRoles[$aItem['role_id']]);

        return [
            'id' => $aItem['id'],
            'author_id' => $aGroupProfile[$CNF['FIELD_AUTHOR']],
            'name' => $aItem['name'],
            'title' => $sTitle,
            'description' => '',
            'url' => $oGroupProfile->getUrl(),
            'price_single' => $aItem['price'],
            'price_recurring' => $aItem['price'],
            'period_recurring' => $aItem['period'],
            'period_unit_recurring' => $aItem['period_unit'],
            'trial_recurring' => 0,
            'added' => $aItem['added']
        ];
    }

    public function serviceGetCartItems($iSellerId)
    {
    	$CNF = &$this->_oConfig->CNF;

    	if(empty($iSellerId))
    	    return array();

        $sModule = $this->getName();
        $aRoles = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_ROLES']);

        $aGroups = $this->_oDb->getEntriesBy(array('type' => 'author', 'author' => $iSellerId));

        $aResult = array();
        foreach($aGroups as $aGroup) {
            $oGroupProfile = BxDolProfile::getInstanceByContentAndType($aGroup[$CNF['FIELD_ID']], $sModule);
            if(!$oGroupProfile)
                continue;

            $aPrices = $this->_oDb->getPrices(array('type' => 'by_profile_id', 'profile_id' => $oGroupProfile->id()));
            if(empty($aPrices) || !is_array($aPrices))
                continue;

            $sTitle = $oGroupProfile->getDisplayName();
            $sUrl = $oGroupProfile->getUrl();

            foreach($aPrices as $aPrice)
                $aResult[] = array(
                    'id' => $aPrice['id'],
                    'author_id' => $iSellerId,
                    'name' => $aPrice['name'],
                    'title' => _t($CNF['T']['txt_cart_item_title'], $sTitle, $aRoles[$aPrice['role_id']], $aPrice['period'], $aPrice['period_unit']),
                    'description' => '',
                    'url' => $sUrl,
                    'price_single' => $aPrice['price'],
                    'price_recurring' => $aPrice['price'],
                    'period_recurring' => $aPrice['period'],
                    'period_unit_recurring' => $aPrice['period_unit']
               );
        }

        return $aResult;
    }

    public function serviceRegisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder);
    }

    public function serviceRegisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder);
    }

    public function serviceReregisterCartItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return $this->_serviceReregisterItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder);
    }

    public function serviceReregisterSubscriptionItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        return $this->_serviceReregisterItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder);
    }

    public function serviceUnregisterCartItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
        return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder);
    }

    public function serviceUnregisterSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder, $sLicense)
    {
    	return $this->_serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder); 
    }

    public function serviceCancelSubscriptionItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
    	return true;
    }

    protected function _serviceRegisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aItem = $this->serviceGetCartItem($iItemId);
        if(empty($aItem) || !is_array($aItem))
            return array();

        $aItemInfo = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iItemId));

        $mixedPeriod = false;
        if((int)$aItemInfo['period'] != 0)
            $mixedPeriod = array(
                'period' => (int)$aItemInfo['period'], 
                'period_unit' => $aItemInfo['period_unit'], 
                'period_reserve' => $CNF['PARAM_RECURRING_RESERVE']
            );

        if(!$this->setRole($aItemInfo['profile_id'], $iClientId, $aItemInfo['role_id'], $mixedPeriod, $sOrder))
            return array();

        return $aItem;
    }

    protected function _serviceReregisterItem($iClientId, $iSellerId, $iItemIdOld, $iItemIdNew, $sOrder)
    {
        $aItem = $this->serviceGetCartItem($iItemIdNew);
        if(empty($aItem) || !is_array($aItem))
            return array();

        $aItemInfoOld = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iItemIdOld));
        if(empty($aItemInfoOld) || !is_array($aItemInfoOld))
            return array();

        $aItemInfoNew = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iItemIdNew));
        if(empty($aItemInfoNew) || !is_array($aItemInfoNew))
            return array();

        if(!$this->unsetRole($aItemInfoOld['profile_id'], $iClientId))
            return array();
        
        $aResult = $this->_serviceRegisterItem($iClientId, $iSellerId, $iItemIdNew, 1, $sOrder);
        if(empty($aResult) || !is_array($aResult))
            return array();

    	return $aItem;
    }

    protected function _serviceUnregisterItem($iClientId, $iSellerId, $iItemId, $iItemCount, $sOrder)
    {
        $aItemInfo = $this->_oDb->getPrices(array('type' => 'by_id', 'value' => $iItemId));
        if(empty($aItemInfo) || !is_array($aItemInfo))
            return false;

        return $this->unsetRole($aItemInfo['profile_id'], $iClientId);
    }

    public function serviceGetQuestionnaire($sSource, $sObject, $sAction, $iContentProfileId)
    {
        $CNF = &$this->_oConfig->CNF;
        $sMsg = _t('_sys_txt_not_found');

        $aContentInfo = $this->_oDb->getContentInfoByProfileId($iContentProfileId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['code' => 1, 'msg' => $sMsg];
        
        $oForm = null;
        if(($oConnection = BxDolConnection::getObjectInstance($sObject)) !== false) {
            $oForm = $oConnection->getQuestionnaireForm($sAction, $iContentProfileId, ['request' => [
                's' => $sSource,
            ]]);

            if($oForm === false)
                return $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['code' => 3, 'msg' => $sMsg];
        }
        else
            return $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['code' => 2, 'msg' => $sMsg];

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iProfileId = bx_get_logged_profile_id();

            $aQuestions = $this->_oDb->getQuestions(['sample' => 'content_pid', 'content_pid' => $iContentProfileId]);
            foreach($aQuestions as $aQuestion)
                $this->_oDb->insertAnswer((int)$aQuestion['id'], $iProfileId, $oForm->getCleanValue('question_' . $aQuestion['id']));

            return $this->_bIsApi ? [] : ['code' => 0, 'o' => $sObject, 'a' => $sAction, 'cpi' => $iContentProfileId, 'ci' => $aContentInfo[$CNF['FIELD_ID']], 'eval' => $this->_oConfig->getJsObject($sSource) . '.connActionPerformed(oData)'];
        }

        if($this->_bIsApi)
            return [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => [
                'name' => $this->_oModule->getName(), 
                'request' => ['url' => $oForm->aFormAttrs['action'], 'immutable' => true]]
            ])];

        bx_import('BxTemplFunctions');
        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oConfig->getHtmlIds('popup_questionnaire'), _t($CNF['T']['popup_title_questionnaire']), $this->_oTemplate->parseHtmlByName('popup_qnr_questionnaire.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
        ]));

        return ['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]];
    }

    /**
     * Data for Notifications module
     */
    public function serviceGetNotificationsData()
    {
    	$sModule = $this->_aModule['name'];

        $aSettingsTypes = ['follow_member', 'follow_context'];
        if($this->serviceActAsProfile())
            $aSettingsTypes = ['personal', 'follow_member'];

        return [
            'handlers' => [
                ['group' => $sModule . '_vote', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVote', 'module_name' => $sModule, 'module_method' => 'get_notifications_vote', 'module_class' => 'Module'],
                ['group' => $sModule . '_vote', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'undoVote'],
                
                ['group' => $sModule . '_score_up', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVoteUp', 'module_name' => $sModule, 'module_method' => 'get_notifications_score_up', 'module_class' => 'Module'],

                ['group' => $sModule . '_score_down', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'doVoteDown', 'module_name' => $sModule, 'module_method' => 'get_notifications_score_down', 'module_class' => 'Module'],

                ['group' => $sModule . '_fan_added', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'fan_added', 'module_name' => $sModule, 'module_method' => 'get_notifications_fan_added', 'module_class' => 'Module'],

                ['group' => $sModule . '_join_invitation', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'join_invitation_notif', 'module_name' => $sModule, 'module_method' => 'get_notifications_join_invitation', 'module_class' => 'Module'],
                
                ['group' => $sModule . '_join_request', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'join_request', 'module_name' => $sModule, 'module_method' => 'get_notifications_join_request', 'module_class' => 'Module', 'module_event_privacy' => $this->_oConfig->CNF['OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT']],
                
                ['group' => $sModule . '_timeline_post_common', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'timeline_post_common', 'module_name' => $sModule, 'module_method' => 'get_notifications_timeline_post_common', 'module_class' => 'Module'],
                
                //--- Moderation related: For 'admins'.
                ['group' => $sModule . '_object_pending_approval', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'pending_approval', 'module_name' => $sModule, 'module_method' => 'get_notifications_post_pending_approval', 'module_class' => 'Module'],
                ['group' => $sModule . '_object_reported', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'reported_content', 'module_name' => $sModule, 'module_method' => 'get_notifications_post_reported', 'module_class' => 'Module'],
            ],
            'settings' => [
                ['group' => 'vote', 'unit' => $sModule, 'action' => 'doVote', 'types' => $aSettingsTypes],

                ['group' => 'score_up', 'unit' => $sModule, 'action' => 'doVoteUp', 'types' => $aSettingsTypes],

                ['group' => 'score_down', 'unit' => $sModule, 'action' => 'doVoteDown', 'types' => $aSettingsTypes],
                
                ['group' => 'fan', 'unit' => $sModule, 'action' => 'fan_added', 'types' => $aSettingsTypes],

                ['group' => 'invite', 'unit' => $sModule, 'action' => 'join_invitation_notif', 'types' => ['personal']],

                ['group' => 'join', 'unit' => $sModule, 'action' => 'join_request', 'types' => $aSettingsTypes],

                ['group' => 'timeline_post', 'unit' => $sModule, 'action' => 'timeline_post_common', 'types' => $aSettingsTypes],

                //--- Moderation related: For 'admins'.
                ['group' => 'action_required', 'unit' => $sModule, 'action' => 'pending_approval', 'types' => ['personal']],
                ['group' => 'action_required', 'unit' => $sModule, 'action' => 'reported_content', 'types' => ['personal']],
            ],
            'alerts' => [
                ['unit' => $sModule, 'action' => 'doVote'],
                ['unit' => $sModule, 'action' => 'undoVote'],

                ['unit' => $sModule, 'action' => 'doVoteUp'],
                ['unit' => $sModule, 'action' => 'doVoteDown'],

                ['unit' => $sModule, 'action' => 'fan_added'],

                ['unit' => $sModule, 'action' => 'join_invitation_notif'],

                ['unit' => $sModule, 'action' => 'join_request'],

                ['unit' => $sModule, 'action' => 'timeline_post_common'],

                //--- Moderation related: For 'admins'.
                ['unit' => $sModule, 'action' => 'pending_approval'],
                ['unit' => $sModule, 'action' => 'reported_content'],
            ]
        ];
    }

    public function serviceGetNotificationsInsertData($oAlert, $aHandler, $aDataItems)
    {
        if($oAlert->sAction != 'join_invitation_notif' || empty($aDataItems) || !is_array($aDataItems))
            return $aDataItems;

        foreach($aDataItems as $iIndex => $aDataItem)
            $aDataItems[$iIndex]['object_privacy_view'] = BX_DOL_PG_ALL;

        return $aDataItems;
    }

    /**
     * Notification about new invitation to join the group
     */
    public function serviceGetNotificationsJoinInvitation($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iContentId = (int)$aEvent['object_id'];
        $oGroupProfile = BxDolProfile::getInstanceByContentAndType((int)$iContentId, $this->getName());
        if(!$oGroupProfile)
            return array();

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return array();

        /*
         * It's essential that 'object_owner_id' contains invited member profile id.
         */
        $oProfile = BxDolProfile::getInstance((int)$aEvent['object_owner_id']);
        if(!$oProfile)
            return array();

        /*
         * Note. Group Profile URL is used for both Entry and Subentry URLs, 
         * because Subentry URL has higher display priority and notification
         * should be linked to Group Profile (Group Profile -> Members tab) 
         * instead of Personal Profile of invited member.
         */
        $sEntryUrl = bx_absolute_url(str_replace(BX_DOL_URL_ROOT, '', $oGroupProfile->getUrl()), '{bx_url_root}');

        return array(
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $oGroupProfile->getDisplayName(),
            'subentry_sample' => $oProfile->getDisplayName(),
            'subentry_url' => $sEntryUrl,
            'lang_key' => $this->_oConfig->CNF['T']['txt_ntfs_join_invitation']
        );
    }

    /**
     * Notification about new member requst in the group
     */
    public function serviceGetNotificationsJoinRequest($aEvent)
    {
        return $this->_serviceGetNotification($aEvent, 'join_request', $this->_oConfig->CNF['T']['txt_ntfs_join_request']);
    }

	/**
     * Notification about new member in the group
     */
    public function serviceGetNotificationsFanAdded($aEvent)
    {
        return $this->_serviceGetNotification($aEvent, 'fan_added', $this->_oConfig->CNF['T']['txt_ntfs_fan_added']);
    }

    protected function _serviceGetNotification($aEvent, $sType, $sLangKey)
    {
    	$CNF = &$this->_oConfig->CNF;

        $iContentId = (int)$aEvent['object_id'];
        $oGroupProfile = BxDolProfile::getInstanceByContentAndType((int)$iContentId, $this->getName());
        if(!$oGroupProfile)
            return array();

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return array();

        $oProfile = BxDolProfile::getInstance((int)$aEvent['subobject_id']);
        if(!$oProfile)
            return array();

        $iGroupProfileId = $oGroupProfile->id();

        /*
         * Note. Group Profile URL is used for both Entry and Subentry URLs, 
         * because Subentry URL has higher display priority and notification
         * should be linked to Group Profile (Group Profile -> Members tab or Manage page) 
         * instead of Personal Profile of a member, who performed an action.
         */
        if($sType == 'join_request' && !empty($CNF['URL_ENTRY_MANAGE']))
            $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_ENTRY_MANAGE'], [
                'profile_id' => $iGroupProfileId
            ]), '{bx_url_root}');
        else if(!empty($CNF['URL_ENTRY_FANS']))
            $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_ENTRY_FANS'], [
                'profile_id' => $iGroupProfileId
            ]), '{bx_url_root}');
        else
            $sEntryUrl = bx_absolute_url(str_replace(BX_DOL_URL_ROOT, '', $oGroupProfile->getUrl()), '{bx_url_root}');

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $oGroupProfile->getDisplayName(),
            'entry_author' => $iGroupProfileId,
            'subentry_sample' => $oProfile->getDisplayName(),
            'subentry_url' => $sEntryUrl,
            'lang_key' => $sLangKey
        ];
    }

    /**
     * Data for Reputation module
     */
    public function serviceGetReputationData()
    {
        $sModule = $this->_aModule['name'];

        $aResult = parent::serviceGetReputationData();

        $bHandlers = !empty($aResult['handlers']) && is_array($aResult['handlers']);
        $bAlerts = !empty($aResult['alerts']) && is_array($aResult['alerts']);

        /**
         * Add Connections related handlers/alerts.
         */
        if($bHandlers)
            $aResult['handlers'] = array_merge($aResult['handlers'], [
                ['group' => $sModule . '_fan', 'type' => 'insert', 'alert_unit' => $sModule . '_fans', 'alert_action' => 'connection_added', 'points_active' => 1, 'points_passive' => 0],
                ['group' => $sModule . '_fan', 'type' => 'delete', 'alert_unit' => $sModule . '_fans', 'alert_action' => 'connection_removed', 'points_active' => -1, 'points_passive' => 0]
            ]);

        if($bAlerts)
            $aResult['alerts'] = array_merge($aResult['alerts'], [
                ['unit' => $sModule . '_fans', 'action' => 'connection_added'],
                ['unit' => $sModule . '_fans', 'action' => 'connection_removed']
            ]);

        /**
         * Remove Comments and Reactions related handlers/alerts because these actions aren't available in Contexts for now.
         */
        if($bHandlers)
            foreach($aResult['handlers'] as $iKey => $aHandler)
                if(in_array($aHandler['group'], [$sModule . '_comment', $sModule . '_reaction']))
                    unset($aResult['handlers'][$iKey]);

        if($bAlerts)
            foreach($aResult['alerts'] as $iKey => $aAlert)
                if($aAlert['unit'] == $sModule . '_reactions' || in_array($aAlert['action'], ['commentPost', 'commentRemoved']))
                    unset($aResult['alerts'][$iKey]);

        return $aResult;
    }

    /**
     * Data for Timeline module
     */
    public function serviceGetTimelineData()
    {
        $aResult = BxBaseModGeneralModule::serviceGetTimelineData();

        $sModule = $this->_aModule['name'];
        $aResult['handlers'] = array_merge($aResult['handlers'], [
            ['group' => $sModule . '_object', 'type' => 'update', 'alert_unit' => $sModule, 'alert_action' => 'context_cover_changed'],
            ['group' => $sModule . '_object', 'type' => 'update', 'alert_unit' => $sModule, 'alert_action' => 'context_cover_deleted']
        ]);
        $aResult['alerts'] = array_merge($aResult['alerts'], [
            ['unit' => $sModule, 'action' => 'context_cover_changed'],
            ['unit' => $sModule, 'action' => 'context_cover_deleted']
        ]);

        return $aResult;
    }

    /**
     * Entry post for Timeline module
     */
    public function serviceGetTimelinePost($aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $a = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if($a === false)
            return false;

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($aEvent['object_id'], $this->getName());
        $a['content']['url'] = $oGroupProfile->getUrl();
        $a['content']['title'] = $oGroupProfile->getDisplayName();
        
        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        if($oConnection)
            $a['content']['members'] = $oConnection->getConnectedInitiatorsCount($oGroupProfile->id(), true);

        if(isset($aEvent['object_privacy_view']))
            $a['content']['visibility'] = $aEvent['object_privacy_view'];

        if(isset($CNF['FIELD_PUBLISHED'])) {
            $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);
            if($aContentInfo[$CNF['FIELD_PUBLISHED']] > $a['date'])
                $a['date'] = $aContentInfo[$CNF['FIELD_PUBLISHED']];
        }

        return $a;
    }


    // ====== PERMISSION METHODS
    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    public function checkAllowedUsePaidJoin($isPerformAction = false)
    {
        // check ACL
        $aCheck = checkActionModule($this->_iProfileId, 'use paid join', $this->getName(), $isPerformAction);
        if($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    public function checkAllowedView ($aDataEntry, $isPerformAction = false)
    {
        return $this->serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction);
    }

    public function serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction = false, $iProfileId = false)
    {
        $CNF = &$this->_oConfig->CNF;
        
        $iGroupContentId = (int)$aDataEntry[$CNF['FIELD_ID']];

        $bInvited = false;
        if(!empty($CNF['TABLE_INVITES'])) {
            $iGroupProfileId = BxDolProfile::getInstanceByContentAndType($iGroupContentId, $this->getName())->id();

            if(($sKey = bx_get('key')) !== false) {
                $mixedInvited = $this->isInvited($sKey, $iGroupProfileId);
                if($mixedInvited === true)
                    $bInvited = true;
            }
            else {
                $mixedInvited = $this->isInvitedByProfileId($iProfileId ? $iProfileId : bx_get_logged_profile_id(), $iGroupProfileId);
                if($mixedInvited === true)
                    $bInvited = true;
            }
        }

        if ($this->isFan($iGroupContentId, $iProfileId) || $bInvited)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction, $iProfileId);
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    public function checkAllowedCompose(&$aDataEntry, $isPerformAction = false)
    {
        if(!$this->isFan($aDataEntry[$this->_oConfig->CNF['FIELD_ID']]))
            return _t('_sys_txt_access_denied');

        return parent::checkAllowedCompose ($aDataEntry, $isPerformAction);
    }

    public function checkAllowedFans(&$aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(($sMsg = $this->checkAllowedView($aDataEntry)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $sMsg;

        return $this->_checkAllowedConnect($aDataEntry, $isPerformAction, [$CNF['OBJECT_GRID_CONNECTIONS'], 'checkAllowedConnectByAcl'], false, false);
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    public function checkAllowedFanAdd(&$aDataEntry, $isPerformAction = false)
    {
        $mixedResult = $this->_modGroupsCheckAllowedFanAdd($aDataEntry, $isPerformAction);

        /**
         * @hooks
         * @hookdef hook-system-check_allowed_fan_add 'system', 'check_allowed_fan_add' - hook to override the result of checking whether 'fan add' to context action is allowed or not to currently logged in user
         * - $unit_name - equals `system`
         * - $action - equals `check_allowed_fan_add`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] module name
         *      - `content_info` - [array] context info array as key&value pairs
         *      - `profile_id` - [int] currently logged in profile id to be checked the availability of the action to
         *      - `override_result` - [string] or [int] by ref, check action result, can be overridden in hook processing. Return string with an error if action isn't allowed or CHECK_ACTION_RESULT_ALLOWED, @see BxDolAcl
         * @hook @ref hook-system-check_allowed_fan_add
         */
        bx_alert('system', 'check_allowed_fan_add', 0, 0, [
            'module' => $this->getName(), 
            'content_info' => $aDataEntry, 
            'profile_id' => bx_get_logged_profile_id(), 
            'override_result' => &$mixedResult
        ]);

        return $mixedResult;
    }

    public function _modGroupsCheckAllowedFanAdd (&$aDataEntry, $isPerformAction = false)
    {
        if ($this->isFan($aDataEntry[$this->_oConfig->CNF['FIELD_ID']]) || !isLogged())
            return _t('_sys_txt_access_denied');

        return $this->_checkAllowedConnect ($aDataEntry, $isPerformAction, $this->_oConfig->CNF['OBJECT_CONNECTIONS'], false, false);
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    public function checkAllowedFanRemove (&$aDataEntry, $isPerformAction = false)
    {
        if (CHECK_ACTION_RESULT_ALLOWED === $this->_checkAllowedConnect ($aDataEntry, $isPerformAction, $this->_oConfig->CNF['OBJECT_CONNECTIONS'], false, true, true))
            return CHECK_ACTION_RESULT_ALLOWED;
        return $this->_checkAllowedConnect ($aDataEntry, $isPerformAction, $this->_oConfig->CNF['OBJECT_CONNECTIONS'], false, true, false);
    }

    protected function _checkAllowedActionByFan($sAction, $aDataEntry, $iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $bRoles = $this->_oConfig->isRoles();
        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id();

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($aDataEntry[$CNF['FIELD_ID']], $this->getName());
        if(!$oGroupProfile)
            return $sAction == BX_BASE_MOD_GROUPS_ACTION_DELETE ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_not_found');

        $iGroupProfileId = $oGroupProfile->id();

        if(!$bRoles && $this->_oDb->isAdmin($iGroupProfileId, $iProfileId, $aDataEntry))
            return CHECK_ACTION_RESULT_ALLOWED;

        if($bRoles && $this->isAllowedActionByRole($sAction, $aDataEntry, $iGroupProfileId, $iProfileId))
            return CHECK_ACTION_RESULT_ALLOWED;

        return _t('_sys_txt_access_denied');
    }

    public function isAllowedActionByRole($mAction, $aDataEntry, $iGroupProfileId, $iProfileId)
    {
        $iProfileRole = $this->_oDb->getRole($iGroupProfileId, $iProfileId);

        if (is_array($mAction)) {
            $sAction = $mAction['action'];
            $sActionModule = $mAction['module'];
        } else {
            $sAction = $mAction;
            $sActionModule = $this->getName();
        }

        $bResult = false;
        if($iProfileId)
            $bResult = $this->isAllowedModuleActionByRole($sActionModule, $sAction, $iProfileRole);

        // in case neither of the profile's roles are having permissions set explicitly then fallback to an old way
        if ($bResult === NULL) {
            $bResult = false;
            if($this->isFanByGroupProfileId($iGroupProfileId)) {
                switch ($sAction) {
                    case BX_BASE_MOD_GROUPS_ACTION_DELETE:
                    case BX_BASE_MOD_GROUPS_ACTION_EDIT:
                    case BX_BASE_MOD_GROUPS_ACTION_CHANGE_SETTINGS:
                    case BX_BASE_MOD_GROUPS_ACTION_CHANGE_COVER:
                    case BX_BASE_MOD_GROUPS_ACTION_MANAGE_ROLES:
                        if($this->isRole($iProfileRole, BX_BASE_MOD_GROUPS_ROLE_ADMINISTRATOR)) 
                            $bResult = true;
                        break;

                    case BX_BASE_MOD_GROUPS_ACTION_MANAGE_FANS:
                    case BX_BASE_MOD_GROUPS_ACTION_INVITE:
                    case BX_BASE_MOD_GROUPS_ACTION_EDIT_CONTENT:
                    case BX_BASE_MOD_GROUPS_ACTION_DELETE_CONTENT:
                    case BX_BASE_MOD_GROUPS_ACTION_TIMELINE_POST_PIN:
                        if($this->isRole($iProfileRole, BX_BASE_MOD_GROUPS_ROLE_ADMINISTRATOR) || $this->isRole($iProfileRole, BX_BASE_MOD_GROUPS_ROLE_MODERATOR)) 
                            $bResult = true;
                        break;

                    default:
                        $bResult = true;
                }
            }
        }

        // in case current user is not allowed to edit/delete this group then
        // if it is a subgroup inside a context then give to the admin roles of a parent context the ability to edit/delete that subgroup.
        if (
            !$bResult &&
            ($sAction == BX_BASE_MOD_GROUPS_ACTION_EDIT || $sAction == BX_BASE_MOD_GROUPS_ACTION_DELETE) &&
            isset($this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']) &&
            $this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO'] &&
            isset($aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']]) &&
            $aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']] < 0)
        {
            $iParentContextProfileId = -$aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']];
            $oParentContext = BxDolProfile::getInstance($iParentContextProfileId);
            if ($oParentContext) {
                $sCheckAction = $sAction == BX_BASE_MOD_GROUPS_ACTION_EDIT ? BX_BASE_MOD_GROUPS_ACTION_EDIT_CONTENT : BX_BASE_MOD_GROUPS_ACTION_DELETE_CONTENT;
                $aParentDataEntry = bx_srv($oParentContext->getModule(), 'get_info', [$oParentContext->getContentId(), false]);
                return $this->isAllowedActionByRole(['action' => $sCheckAction, 'module' => $oParentContext->getModule()], $aParentDataEntry, $iParentContextProfileId, $iProfileId);
            }
        }

        /**
         * @hooks
         * @hookdef hook-system-check_allowed_action_by_role 'system', 'check_allowed_action_by_role' - hook to override the result of checking whether an action is allowed or not to context member by his role in the context
         * - $unit_name - equals `system`
         * - $action - equals `check_allowed_action_by_role`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] module name
         *      - `multi_roles` - [boolean] whether multi roles are enabled in context or not
         *      - `action` - [string] action to be checked
         *      - `action_module` - [string] module name which the action belongs to
         *      - `content_profile_id` - [int] context profile id
         *      - `content_info` - [array] context info array as key&value pairs
         *      - `profile_id` - [int] profile id to be checked the availability of the action to
         *      - `profile_role` - [int] profile role in the context
         *      - `override_result` - [boolean] by ref, check action result, can be overridden in hook processing.
         * @hook @ref hook-system-check_allowed_action_by_role
         */
        bx_alert('system', 'check_allowed_action_by_role', 0, 0, [
            'module' => $this->getName(), 
            'multi_roles' => $this->_oConfig->isMultiRoles(),
            'action' => $sAction,
            'action_module' => $sActionModule,
            'content_profile_id' => $iGroupProfileId, 
            'content_info' => $aDataEntry, 
            'profile_id' => $iProfileId, 
            'profile_role' => $iProfileRole,
            'override_result' => &$bResult
        ]);

        return $bResult;
    }

    public function isAllowedModuleActionByRole($sModule, $sAction, $iProfileRole)
    {
        if(($aRoles = $this->_oConfig->getRolesData()) && is_array($aRoles))
            foreach ($aRoles as $iRole => $aRoleData) {
                if(($iRole == 0 && $iProfileRole == 0) || ($iRole > 0 && $this->isRole($iProfileRole, $iRole))) {
                    $mPermissions = !empty($aRoleData['Data']) ? unserialize($aRoleData['Data']) : false;
                    if($mPermissions && isset($mPermissions[$sModule]))
                        return isset($mPermissions[$sModule][$sAction]) && $mPermissions[$sModule][$sAction];
                }
            }

        return NULL;
    }

    public function isAllowedModuleActionByProfile($iContentId, $sPostModule, $sAction, $iProfileId = 0) {
        if (!$iProfileId) $iProfileId = bx_get_logged_profile_id();

        if ($iProfileId && $this->isFan($iContentId, $iProfileId)) {
            $sModuleName = $this->getName();
            $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $sModuleName);
            $aDataEntry = $this->_oDb->getContentInfoById($iContentId);
            $bResult = $this->isAllowedActionByRole(['action' => $sAction, 'module' => $sPostModule], $aDataEntry, $oGroupProfile->id(), $iProfileId);

            if ($bResult === true) return CHECK_ACTION_RESULT_ALLOWED;
            if ($bResult === false) return _t('_sys_txt_access_denied');
        }

        return NULL; //undefined, because the profile is either not a fan or his role is not having permissions defined. So process the default way then.
    }

    public function isRole($iProfileRole, $iRole)
    {
        if(!$this->_oConfig->isMultiRoles())
            return $iProfileRole == $iRole;
        else 
            return $iProfileRole & (1 << ($iRole - 1));
    }

    public function serviceIsRole($iProfileRole, $iRole)
    {
        return $this->isRole($iProfileRole, $iRole);
    }

    public function checkAllowedManageFans($mixedDataEntry, $isPerformAction = false)
    {
        $aDataEntry = array();
        if(!is_array($mixedDataEntry)) {
            $oGroupProfile = BxDolProfile::getInstance((int)$mixedDataEntry);
            if($oGroupProfile && $this->getName() == $oGroupProfile->getModule())
                $aDataEntry = $this->_oDb->getContentInfoById($oGroupProfile->getContentId());
        }
        else
            $aDataEntry = $mixedDataEntry;

        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_MANAGE_FANS, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedEdit($aDataEntry, $isPerformAction);
    }

    public function checkAllowedManageAdmins($mixedDataEntry, $isPerformAction = false)
    {
        $aDataEntry = array();
        if(!is_array($mixedDataEntry)) {
            $oGroupProfile = BxDolProfile::getInstance((int)$mixedDataEntry);
            if($oGroupProfile && $this->getName() == $oGroupProfile->getModule())
                $aDataEntry = $this->_oDb->getContentInfoById($oGroupProfile->getContentId());
        }
        else
            $aDataEntry = $mixedDataEntry;

        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_MANAGE_ROLES, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedEdit($aDataEntry, $isPerformAction);
    }

    public function checkAllowedEdit($aDataEntry, $isPerformAction = false)
    {
        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_EDIT, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedEdit($aDataEntry, $isPerformAction);
    }

    public function checkAllowedInvite($aDataEntry, $isPerformAction = false)
    {
        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_INVITE, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedEdit($aDataEntry, $isPerformAction);
    }

    public function checkAllowedChangeCover($aDataEntry, $isPerformAction = false)
    {
        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_CHANGE_COVER, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedChangeCover($aDataEntry, $isPerformAction);
    }

    public function checkAllowedChangeSettings($aDataEntry, $isPerformAction = false)
    {
        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_CHANGE_SETTINGS, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedChangeSettings($aDataEntry, $isPerformAction);
    }

    public function checkAllowedDelete(&$aDataEntry, $isPerformAction = false)
    {
        if($this->_checkAllowedActionByFan(BX_BASE_MOD_GROUPS_ACTION_DELETE, $aDataEntry) === CHECK_ACTION_RESULT_ALLOWED)
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedDelete($aDataEntry, $isPerformAction);
    }

    public function checkAllowedJoin(&$aDataEntry, $isPerformAction = false)
    {
        if (bx_get('key')){
            $sKey = bx_get('key');
            $oGroupProfile = BxDolProfile::getInstanceByContentAndType($aDataEntry[$this->_oConfig->CNF['FIELD_ID']], $this->getName());
            $aData = $this->_oDb->getInviteByKey($sKey, $oGroupProfile->id());
            if (isset($aData['invited_profile_id']) && $aData['invited_profile_id'] == bx_get_logged_profile_id()){
                return CHECK_ACTION_RESULT_ALLOWED;
            }
        }   
        return _t('_sys_txt_access_denied');
    }   

    public function checkAllowedSubscribeAdd(&$aDataEntry, $isPerformAction = false)
    {
        $mixedResult = $this->_modGroupsCheckAllowedSubscribeAdd($aDataEntry, $isPerformAction);

        /**
         * @hooks
         * @hookdef hook-system-check_allowed_subscribe_add 'system', 'check_allowed_subscribe_add' - hook to override the result of checking whether currently logged in user can subscribe (follow) the context or not
         * - $unit_name - equals `system`
         * - $action - equals `check_allowed_subscribe_add`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] module name
         *      - `content_info` - [array] context info array as key&value pairs
         *      - `profile_id` - [int] currently logged in profile id to be checked the availability of the action to
         *      - `override_result` - [string] or [int] by ref, check action result, can be overridden in hook processing. Return string with an error if action isn't allowed or CHECK_ACTION_RESULT_ALLOWED, @see BxDolAcl
         * @hook @ref hook-system-check_allowed_subscribe_add
         */
        bx_alert('system', 'check_allowed_subscribe_add', 0, 0, [
            'module' => $this->getName(), 
            'content_info' => $aDataEntry, 
            'profile_id' => bx_get_logged_profile_id(), 
            'override_result' => &$mixedResult
        ]);

        return $mixedResult;
    }
    
    public function checkAllowedAddContent(&$aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        $sErrAccessDenied = _t('_sys_txt_access_denied');

        $sModule = $this->getName();
        $iProfileId = bx_get_logged_profile_id();

        $aContexts = BxDolService::call($sModule, 'get_participating_profiles', [$iProfileId]);
        if(!in_array($aDataEntry['profile_id'], $aContexts))
            return $sErrAccessDenied;

        if(bx_srv($sModule, 'check_allowed_post_in_profile', [$aDataEntry[$CNF['FIELD_ID']]]) !== CHECK_ACTION_RESULT_ALLOWED)
            return $sErrAccessDenied;

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Note. Is mainly needed for internal usage. Access level is 'public' to allow outer calls from alerts.
     */
    public function _modGroupsCheckAllowedSubscribeAdd(&$aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->isFan($aDataEntry[$CNF['FIELD_ID']]) && (!isset($CNF['PARAM_SBS_WO_JOIN']) || getParam($CNF['PARAM_SBS_WO_JOIN']) != 'on'))
            return _t('_sys_txt_access_denied');

        return parent::_modProfileCheckAllowedSubscribeAdd($aDataEntry, $isPerformAction);
    }

    /**
     * @deprecated since version 11.0.3 and can be removed in the next version.
     */
    public function _checkAllowedSubscribeAdd (&$aDataEntry, $isPerformAction = false)
    {
        return parent::checkAllowedSubscribeAdd ($aDataEntry, $isPerformAction);
    }
    
    public function doAudit($iGroupProfileId, $iFanId, $sAction)
    {
        $oProfile = BxDolProfile::getInstance($iFanId);
        
        $iContentId = $oProfile->getContentId();
        $sModule = $oProfile->getModule();
        $oModule = BxDolModule::getInstance($sModule);
        if (BxDolRequest::serviceExists($sModule, 'act_as_profile') && BxDolService::call($sModule, 'act_as_profile') && $oModule->_oConfig){
            $CNF = $oModule->_oConfig->CNF;

            $aContentInfo = BxDolRequest::serviceExists($sModule, 'get_all') ? BxDolService::call($sModule, 'get_all', array(array('type' => 'id', 'id' => $iContentId))) : array();
        
            $AuditParams = array(
                'content_title' => (isset($CNF['FIELD_TITLE']) && isset($aContentInfo[$CNF['FIELD_TITLE']])) ? $aContentInfo[$CNF['FIELD_TITLE']] : '',
                'context_profile_id' => $iGroupProfileId,
                'context_profile_title' => BxDolProfile::getInstance($iGroupProfileId)->getDisplayName()
            );
        
            bx_audit(
                $iContentId, 
                $sModule, 
                $sAction,  
                $AuditParams
            );
        }
    }
    
    protected function _checkAllowedConnect (&$aDataEntry, $isPerformAction, $sObjConnection, $isMutual, $isInvertResult, $isSwap = false)
    {
        $sResult = $this->checkAllowedView($aDataEntry);

        $oPrivacy = BxDolPrivacy::getObjectInstance($this->_oConfig->CNF['OBJECT_PRIVACY_VIEW']);

        // when context is in another context
        if ($aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']] < 0 && getParam('sys_check_fan_in_parent_context')) {
            $oParent = BxDolProfile::getInstance(abs($aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']]));
            $oModule = $oParent ? BxDolModule::getInstance($oParent->getModule()) : null;
            if ($oModule && method_exists($oModule, 'isFan') && !$oModule->isFan($oParent->getContentId()))
                return _t('_sys_txt_access_denied');
        }

        // if profile view isn't allowed but visibility is in partially visible groups 
        // then display buttons to connect (befriend, join) to profile, 
        // if other conditions (in parent::_checkAllowedConnect) are met as well
        if (CHECK_ACTION_RESULT_ALLOWED !== $sResult && !in_array($aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_VIEW_TO']], array_merge($oPrivacy->getPartiallyVisiblePrivacyGroups(), array('s'))))
            return $sResult;

        return parent::_checkAllowedConnect ($aDataEntry, $isPerformAction, $sObjConnection, $isMutual, $isInvertResult, $isSwap);
    }


    // ====== COMMON METHODS
    public function onUpdateImage($iContentId, $sFiledName, $sFiledValue, $iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        $aField2Method = [
            $CNF['FIELD_PICTURE'] => 'picture',
            $CNF['FIELD_COVER'] => 'cover',
        ];

        bx_content_cache_del_by_prefix('sprofile_unit_vars:' . $aContentInfo['profile_id'] . ':');
        bx_content_cache_del_by_prefix('menu_sys_toolbar_member_p' . $aContentInfo['profile_id']);

        if(!empty($aField2Method[$sFiledName]))
            /**
             * @hooks
             * @hookdef hook-bx_base_groups-context_picture_changed '{module_name}', 'context_picture_changed' - hook after context picture was changed
             * - $unit_name - module name
             * - $action - equals `context_picture_changed`
             * - $object_id - context id
             * - $sender_id - profile id who performed the action
             * - $extra_params - array of additional params with the following array keys:
             *      - `status` - [string] context status
             *      - `status_admin` - [string] context admin status
             *      - `privacy_view` - [int] or [string] privacy for view context action, @see BxDolPrivacy
             *      - `cf` - [int] context's audience filter value
             * @hook @ref hook-bx_base_groups-context_picture_changed
             */
            /**
             * @hooks
             * @hookdef hook-bx_base_groups-context_cover_changed '{module_name}', 'context_cover_changed' - hook after context cover was changed
             * It's equivalent to @ref hook-bx_base_groups-context_picture_changed 
             * @hook @ref hook-bx_base_groups-context_cover_changed
             */
            bx_alert($this->getName(), 'context_' . $aField2Method[$sFiledName] . '_changed', $iContentId, $iProfileId, $this->_alertParams($aContentInfo));
    }

    protected function _alertParams($aContentInfo)
    {
        $aParams = parent::_alertParams($aContentInfo);

        $CNF = &$this->_oConfig->CNF;

        if(!empty($CNF['FIELD_CF']) && isset($aContentInfo[$CNF['FIELD_CF']]))
            $aParams['cf'] = $aContentInfo[$CNF['FIELD_CF']];

        return $aParams;
    }

    public function alertAfterAdd($aContentInfo)
    {
        $CNF = &$this->_oConfig->CNF;

        $iId = (int)$aContentInfo[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContentInfo[$CNF['FIELD_AUTHOR']];

        $sAction = 'added';
        if(isset($CNF['FIELD_STATUS_ADMIN']) && isset($aContentInfo[$CNF['FIELD_STATUS_ADMIN']]) && $aContentInfo[$CNF['FIELD_STATUS_ADMIN']] == BX_BASE_MOD_GENERAL_STATUS_PENDING)
            $sAction = 'deferred';        

        $sModule = $this->getName();
        $aParams = $this->_alertParams($aContentInfo);
        /**
         * @hooks
         * @hookdef hook-system-prepare_alert_params 'system', 'prepare_alert_params' - hook to override alert (hook) params
         * - $unit_name - equals `system`
         * - $action - equals `prepare_alert_params`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `unit` - [string] unit name
         *      - `action` - [string] by ref, action, can be overridden in hook processing
         *      - `object_id` - [int] by ref, object id, can be overridden in hook processing
         *      - `sender_id` - [int] by ref, action performer profile id, can be overridden in hook processing
         *      - `extras` - [array] by ref, extra params array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-system-prepare_alert_params
         */
        bx_alert('system', 'prepare_alert_params', 0, 0, [
            'unit'=> $sModule, 

            'action' => &$sAction, 
            'object_id' => &$iId, 
            'sender_id' => &$iAuthorId, 
            'extras' => &$aParams,

            'action_ref' => &$sAction, 
            'object_id_ref' => &$iId, 
            'sender_id_ref' => &$iAuthorId, 
            'extras_ref' => &$aParams
        ]);
        /**
         * @hooks
         * @hookdef hook-bx_base_groups-added '{module_name}', 'added' - hook after context was added (published)
         * - $unit_name - module name
         * - $action - equals `added`
         * - $object_id - context id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `status` - [string] context status
         *      - `status_admin` - [string] context admin status
         *      - `privacy_view` - [int] or [string] privacy for view context action, @see BxDolPrivacy
         *      - `cf` - [int] context's audience filter value
         * @hook @ref hook-bx_base_groups-added
         */
        /**
         * @hooks
         * @hookdef hook-bx_base_groups-deferred '{module_name}', 'deferred' - hook after context was added with pending approval status
         * It's equivalent to @ref hook-bx_base_groups-added
         * @hook @ref hook-bx_base_groups-deferred
         */
        bx_alert($sModule, $sAction, $iId, false, $aParams);

        $this->_processModerationNotifications($aContentInfo);
    }

    public function addFollower ($iProfileId1, $iProfileId2)
    {
        $oConnectionFollow = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if($oConnectionFollow && !$oConnectionFollow->isConnected($iProfileId1, $iProfileId2)){
            $oConnectionFollow->addConnection($iProfileId1, $iProfileId2);
            return true;
        }
        return false;
    }
    
    public function isFan ($iContentId, $iProfileId = false) 
    {
        $CNF = &$this->_oConfig->CNF;

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->getName());
        if($oGroupProfile && isset($CNF['OBJECT_CONNECTIONS']))
            return ($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])) && $oConnection->isConnected($iProfileId ? $iProfileId : bx_get_logged_profile_id(), $oGroupProfile->id(), true);

        return false;
    }

    public function isFanByGroupProfileId ($iGroupProfileId, $iProfileId = false) 
    {
        $CNF = &$this->_oConfig->CNF;

        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        if($oGroupProfile && isset($CNF['OBJECT_CONNECTIONS']))
            return ($oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])) && $oConnection->isConnected($iProfileId ? $iProfileId : bx_get_logged_profile_id(), $oGroupProfile->id(), true);

        return false;
    }

    public function isInvited ($sKey, $iGroupProfileId) 
    {
        $CNF = &$this->_oConfig->CNF;
        $aData = $this->_oDb->getInviteByKey($sKey,  $iGroupProfileId);
        if (!isset($aData['invited_profile_id']))
            return _t($CNF['T']['txt_invitation_popup_error_invitation_absent']);
        
        if ($aData['invited_profile_id'] != bx_get_logged_profile_id())
            return _t($CNF['T']['txt_invitation_popup_error_wrong_user']);
        
        return true;
    }

    public function isInvitedByProfileId ($iProfileId, $iGroupProfileId) 
    {
        $CNF = &$this->_oConfig->CNF;

        $aData = $this->_oDb->getInviteByInvited($iProfileId,  $iGroupProfileId);
        if (!isset($aData['invited_profile_id']))
            return _t($CNF['T']['txt_invitation_popup_error_invitation_absent']);

        if ($aData['invited_profile_id'] != bx_get_logged_profile_id())
            return _t($CNF['T']['txt_invitation_popup_error_wrong_user']);

        return true;
    }

    public function serviceIsInvited($iGroupProfileId, $iProfileId = false, $sKey = '')
    {
        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        if(empty($sKey) && ($sKey = bx_get('key')) !== false)
            $sKey = bx_process_input($sKey);

        $mixedInvited = false;
        if(!empty($sKey))
            $mixedInvited = $this->isInvited($sKey, $iGroupProfileId);
        else if($iProfileId !== false)
            $mixedInvited = $this->isInvitedByProfileId($iProfileId, $iGroupProfileId);

        return $mixedInvited === true;
    }

    public function serviceIsNotInvited($iGroupProfileId, $iProfileId = false, $sKey = '')
    {
        return !$this->serviceIsInvited($iGroupProfileId, $iProfileId, $sKey);
    }

    public function serviceGetInvitedKey($iGroupProfileId, $iProfileId = false)
    {
        $sKey = '';
        if(($sKey = bx_get('key')) !== false)
            $sKey = bx_process_input($sKey);

        if(!$sKey) {
            if(!$iProfileId)
                $iProfileId = bx_get_logged_profile_id();

            if($iProfileId !== false) {
                $aInvite = $this->_oDb->getInviteByInvited($iProfileId, $iGroupProfileId);
                if(!empty($aInvite) && is_array($aInvite))
                    $sKey = $aInvite['key'];
            }
        }

        return $sKey;
    }

    public function getRole($iGroupProfileId, $iFanProfileId)
    {
        if(!$this->isFanByGroupProfileId($iGroupProfileId, $iFanProfileId))
            return false;

        return $this->_oDb->getRole($iGroupProfileId, $iFanProfileId);
    }

    public function setRole($iGroupProfileId, $iFanProfileId, $mixedRole, $mixedPeriod = false, $sOrder = '')
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$this->_oConfig->isMultiRoles() && is_array($mixedRole))
            $mixedRole = reset($mixedRole);

        if(!isset($CNF['OBJECT_CONNECTIONS']))
            return false;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        if(!$oConnection || !$oGroupProfile)
            return false;

        if(!$oConnection->isConnected($iFanProfileId, $iGroupProfileId, true) && !$oConnection->addConnection($iFanProfileId, $iGroupProfileId))
            return false;

        if(!$this->_oDb->setRole($iGroupProfileId, $iFanProfileId, $mixedRole, $mixedPeriod, $sOrder))
            return false;

        $this->onSetRole($iGroupProfileId, $iFanProfileId, $mixedRole);

        return true;
    }

    public function onSetRole($iGroupProfileId, $iFanProfileId, $mixedRole)
    {
        $CNF = &$this->_oConfig->CNF;

        $iProfileId = bx_get_logged_profile_id();
        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        $aGroupProfileInfo = $this->_oDb->getContentInfoById((int)$oGroupProfile->getContentId());
        $aRoles = BxDolFormQuery::getDataItems($CNF['OBJECT_PRE_LIST_ROLES']);

        // notify about admin status
        if(!empty($CNF['EMAIL_FAN_SET_ROLE']) && $iFanProfileId != $iProfileId) {
            $aSetRoles = is_array($mixedRole) ? $mixedRole : [$mixedRole];
            $aRolesNames = [];
            foreach ($aSetRoles as $iRole)
                $aRolesNames[] = $aRoles[(int)$iRole];

            sendMailTemplate($CNF['EMAIL_FAN_SET_ROLE'], 0, $iFanProfileId, array(
                'EntryUrl' => $oGroupProfile->getUrl(),
                'EntryTitle' => $oGroupProfile->getDisplayName(),
                'Role' => implode(', ', $aRolesNames),
            ), BX_EMAIL_NOTIFY);
        }

        /**
         * @hooks
         * @hookdef hook-bx_base_groups-set_role '{module_name}', 'set_role' - hook after 'set role' action was applied to context member
         * - $unit_name - module name
         * - $action - equals `set_role`
         * - $object_id - context id
         * - $sender_id - context profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] context profile id
         *      - `performer_id` - [int] performer profile id
         *      - `fan_id` - [int] context member profile id
         *      - `content` - [array] context info array as key&value pairs
         *      - `role` - [int] or [array] role or an array of roles to be set
         *      - `group_profile` - [int] context profile id
         *      - `profile` - [int] performer profile id
         * @hook @ref hook-bx_base_groups-set_role
         */
        bx_alert($this->getName(), 'set_role', $aGroupProfileInfo[$CNF['FIELD_ID']], $iGroupProfileId, array(
            'object_author_id' => $iGroupProfileId,
            'performer_id' => $iProfileId, 
            'fan_id' => $iFanProfileId,

            'content' => $aGroupProfileInfo, 
            'role' => $mixedRole,

            'group_profile' => $iGroupProfileId, 
            'profile' => $iProfileId
        ));

        $this->doAudit($iGroupProfileId, $iFanProfileId, '_sys_audit_action_group_role_changed');
    }

    public function unsetRole($iGroupProfileId, $iFanProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($CNF['OBJECT_CONNECTIONS']))
            return false;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        if(!$oConnection || !$oGroupProfile)
            return false;

        if($oConnection->isConnected($iFanProfileId, $iGroupProfileId, true) && !$oConnection->removeConnection($iFanProfileId, $iGroupProfileId))
            return false;

        $iRole = $this->_oDb->getRole($iGroupProfileId, $iFanProfileId);

        if(!$this->_oDb->unsetRole($iGroupProfileId, $iFanProfileId))
            return false;

        $this->onUnsetRole($iGroupProfileId, $iFanProfileId, $iRole);

        return true;
    }

    public function onUnsetRole($iGroupProfileId, $iFanProfileId, $iRole)
    {
        $CNF = &$this->_oConfig->CNF;

        $iProfileId = bx_get_logged_profile_id();
        $oGroupProfile = BxDolProfile::getInstance($iGroupProfileId);
        $aGroupProfileInfo = $this->_oDb->getContentInfoById((int)$oGroupProfile->getContentId());

        /**
         * @hooks
         * @hookdef hook-bx_base_groups-set_role '{module_name}', 'set_role' - hook after 'set role' action was applied to context member
         * - $unit_name - module name
         * - $action - equals `set_role`
         * - $object_id - context id
         * - $sender_id - context profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] context profile id
         *      - `performer_id` - [int] performer profile id
         *      - `fan_id` - [int] context member profile id
         *      - `content` - [array] context info array as key&value pairs
         *      - `role` - [int] or [array] role or an array of roles to be set
         *      - `group_profile` - [int] context profile id
         *      - `profile` - [int] performer profile id
         * @hook @ref hook-bx_base_groups-set_role
         */
        bx_alert($this->getName(), 'set_role', $aGroupProfileInfo[$CNF['FIELD_ID']], $iGroupProfileId, array(
            'object_author_id' => $iGroupProfileId,
            'performer_id' => $iProfileId, 
            'fan_id' => $iFanProfileId,

            'content' => $aGroupProfileInfo,
            'role' => $iRole,

            'group_profile' => $iGroupProfileId, 
            'profile' => $iProfileId
        ));

        $this->doAudit($iGroupProfileId, $iFanProfileId, '_sys_audit_action_group_role_changed');
    }

    public function getGroupsByFan($iProfileId, $mixedRole = false)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($CNF['OBJECT_CONNECTIONS']))
            return false;

        if($mixedRole === false)
            $mixedRole = BX_BASE_MOD_GROUPS_ROLE_COMMON;

        if(!is_array($mixedRole))
            $mixedRole = [$mixedRole];

        $aResult = [];
        foreach($mixedRole as $iRole) {
            switch($iRole) {
                case BX_BASE_MOD_GROUPS_ROLE_COMMON:
                    $aIds = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS'])->getConnectedContent($iProfileId);
                    break;

                default:
                    $aIds = $this->_oDb->getRoles([
                        'type' => 'group_pids_by_fan_id', 
                        'fan_id' => $iProfileId,
                        'role' => $iRole
                    ]);
            }

            $aResult = array_merge($aResult, $aIds);
        }

        return $aResult;
    }

    public function getMenuItemTitleByConnection($sConnection, $sAction, $iContentProfileId, $iInitiatorProfileId = 0)
    {
        $CNF = $this->_oConfig->getCNF();

        $aResult = parent::getMenuItemTitleByConnection($sConnection, $sAction, $iContentProfileId, $iInitiatorProfileId);
        if(!empty($aResult))
            return $aResult;

        $oConnection = BxDolConnection::getObjectInstance($sConnection);
        if(!$oConnection)
            return false;

        if(!$iInitiatorProfileId)
            $iInitiatorProfileId = bx_get_logged_profile_id();

        $aResult = [];
        if($oConnection->isConnectedNotMutual($iInitiatorProfileId, $iContentProfileId))
            $aResult = [
                'add' => _t(!empty($CNF['T']['menu_item_title_sm_join_requested']) ? $CNF['T']['menu_item_title_sm_join_requested'] : '_sys_menu_item_title_sm_join_requested'),
                'remove' => _t(!empty($CNF['T']['menu_item_title_sm_leave_cancel']) ? $CNF['T']['menu_item_title_sm_leave_cancel'] : '_sys_menu_item_title_sm_leave_cancel'),
            ];
        else if($oConnection->isConnectedNotMutual($iContentProfileId, $iInitiatorProfileId))
            $aResult = [
                'add' => _t(!empty($CNF['T']['menu_item_title_sm_join_confirm']) ? $CNF['T']['menu_item_title_sm_join_confirm'] : '_sys_menu_item_title_sm_join_confirm'),
                'remove' => _t(!empty($CNF['T']['menu_item_title_sm_leave_reject']) ? $CNF['T']['menu_item_title_sm_leave_reject'] : '_sys_menu_item_title_sm_leave_reject'),
            ];
        else if($oConnection->isConnected($iInitiatorProfileId, $iContentProfileId, true))
            $aResult = [
                'add' => '',
                'remove' => _t(!empty($CNF['T']['menu_item_title_sm_leave']) ? $CNF['T']['menu_item_title_sm_leave'] : '_sys_menu_item_title_sm_leave'),
            ];
        else
            $aResult = [
                'add' => _t(!empty($CNF['T']['menu_item_title_sm_join']) ? $CNF['T']['menu_item_title_sm_join'] : '_sys_menu_item_title_sm_join'),
                'remove' => '',
            ];

        return !empty($sAction) && isset($aResult[$sAction]) ? $aResult[$sAction] : $aResult;
    }

    protected function _getImagesForTimelinePost($aEvent, $aContentInfo, $sUrl, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;
        
        $iImageId = 0;
        $sImageMd = $sImageXl = '';
        if(isset($CNF['FIELD_COVER']) && !empty($aContentInfo[$CNF['FIELD_COVER']])) {
            $iImageId = (int)$aContentInfo[$CNF['FIELD_COVER']];
            $sImageMd = $this->_oConfig->getImageUrl($iImageId, ['OBJECT_IMAGES_TRANSCODER_GALLERY']);
            $sImageXl = $this->_oConfig->getImageUrl($iImageId, ['OBJECT_IMAGES_TRANSCODER_COVER']);
        }

        if($sImageXl == '' && isset($CNF['FIELD_PICTURE']) && !empty($aContentInfo[$CNF['FIELD_PICTURE']])) {
            $iImageId = (int)$aContentInfo[$CNF['FIELD_PICTURE']];
            $sImageMd = $this->_oConfig->getImageUrl($iImageId, ['OBJECT_IMAGES_TRANSCODER_GALLERY']);
            $sImageXl = $this->_oConfig->getImageUrl($iImageId, ['OBJECT_IMAGES_TRANSCODER_COVER']);
        }

        if(empty($sImageXl))
            return [];

        $aImage = [
            'id' => $iImageId, 
            'url' => $sUrl, 
            'src' => $sImageXl, 
            'src_orig' => $sImageXl
        ];

        if(!empty($sImageMd))
            $aImage['src_medium'] = $sImageMd;

        return [
            $aImage
        ];
    }

    protected function _prepareProfileAndGroupProfile($iGroupProfileId, $iInitiatorId)
    {
        if (!($oGroupProfile = BxDolProfile::getInstance($iGroupProfileId)))
            return array(0, 0, null);

        if ($oGroupProfile->getModule() == $this->getName()) {
            $iProfileId = $iInitiatorId;
            $iGroupProfileId = $oGroupProfile->id();
        } else {
            $iProfileId = $oGroupProfile->id();
            $iGroupProfileId = $iInitiatorId;
        }

        return array($iProfileId, $iGroupProfileId, $oGroupProfile);
    }
}

/** @} */
