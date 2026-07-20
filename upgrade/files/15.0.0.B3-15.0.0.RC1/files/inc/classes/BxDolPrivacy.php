<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_PG_HIDDEN', '1');
define('BX_DOL_PG_MEONLY', '2');
define('BX_DOL_PG_ALL', '3');
define('BX_DOL_PG_MEMBERS', '4');
define('BX_DOL_PG_FRIENDS', '5');
define('BX_DOL_PG_FRIENDS_SELECTED', '6');
define('BX_DOL_PG_RELATIONS', '7');
define('BX_DOL_PG_RELATIONS_SELECTED', '8');
define('BX_DOL_PG_MEMBERSHIPS_SELECTED', '9');
define('BX_DOL_PG_CUSTOM', '99');

define('BX_DOL_PG_DEFAULT', BX_DOL_PG_ALL);

/**
 * Privacy settings for any content.
 *
 * Integration of the content with privacy engine allows site member
 * to organize the access to his content.
 *
 * In addition to regular privacy groups (Public, Friends), spaces are supported. 
 * When some space (usually some another profile) is specified as privacy, 
 * then another profile visibility is used to check the privacy.
 *
 * Related classes:
 *  BxDolPrivacyQuery - database queries.
 *
 * Example of usage:
 * 1. Register your privacy actions in `sys_privacy_actions` database table.
 * 2. Add one privacy field(with INT type) in the table with your items for each action.
 *    For example, for action 'comment', the field name should be 'allow_comment_to'.
 * 3. Add group choosers for necessary actions in the form, which is used to add new items.
 * @code
 *    $oPrivacy = new BxDolPrivacy();
 *    $oPrivacy->getGroupChooser($iItemOwnerId, $sModuleUri, $sModuleAction);
 * @endcode
 *
 * 4. Check privacy when any user tries to view an item.
 * @code
 *    $oPrivacy = new BxDolPrivacy($sTable, $sFieldId, $sFieldOwnerId);
 *    if($oPrivacy->check($sAction, $iObjectId, $iViewerId)) {
 *     //show necessary content
 *    }
 * @endcode
 *
 *    @see an example of integration in BoonEx modules, for example: Posts
 *
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 *
 * Alerts:
 * no alerts available
 *
 */
class BxDolPrivacy extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_oDb;
    protected $_sObject;
    protected $_aObject;

    protected $_aGroupsSettings;
    protected $_aGroupsExclude;
    
    protected $_sFormGroupCustom;
    protected $_sFormDisplayGcMembers;
    protected $_sFormDisplayGcMemberships;

    /**
     * Constructor
     * @param $aObject array of grid options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_aObject = $aObject;
        $this->_sObject = $aObject['object'];

        $this->_oDb = new BxDolPrivacyQuery();
        $this->_oDb->init($this->_aObject);

        $this->_aGroupsSettings = [
            BX_DOL_PG_FRIENDS_SELECTED => [
                'name' => 'friends_selected',
                'is_allowed' => '',
                'connection' => 'sys_profiles_friends', 
                'js_method_create_group' => 'selectMembers',
                'db_table_items' => 'sys_privacy_groups_custom_members',
                'db_field_item' => 'member_id',
                'uri_get_items' => 'users_list',
            ],
            BX_DOL_PG_RELATIONS => [
                'name' => 'relations',
                'is_allowed' => 'isAllowedRelations',
                'connection' => 'sys_profiles_relations',
            ],
            BX_DOL_PG_RELATIONS_SELECTED => [
                'name' => 'relations_selected',
                'is_allowed' => 'isAllowedRelations',
                'connection' => 'sys_profiles_relations', 
                'js_method_create_group' => 'selectMembers',
                'db_table_items' => 'sys_privacy_groups_custom_members',
                'db_field_item' => 'member_id',
                'uri_get_items' => 'users_list',
            ],
            BX_DOL_PG_MEMBERSHIPS_SELECTED => [
                'name' => 'memberships_selected',
                'is_allowed' => 'isAllowedMemberships',
                'connection' => '',
                'js_method_create_group' => 'selectMemberships',
                'db_table_items' => 'sys_privacy_groups_custom_memberships',
                'db_field_item' => 'membership_id',
                'uri_get_items' => 'memberships_list',
            ]
        ];

        $this->_aGroupsExclude = array();

        $this->_sFormGroupCustom = 'sys_privacy_group_custom';
        $this->_sFormDisplayGcMembers = 'sys_privacy_group_custom_members';
        $this->_sFormDisplayGcMemberships = 'sys_privacy_group_custom_memberships';
    }

    /**
     * Get privacy object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    public static function getObjectInstance($sObject)
    {
        if(isset($GLOBALS['bxDolClasses']['BxDolPrivacy!' . $sObject]))
            return $GLOBALS['bxDolClasses']['BxDolPrivacy!' . $sObject];

        $aObject = BxDolPrivacyQuery::getPrivacyObject($sObject);
        if(!$aObject || !is_array($aObject))
            return false;

        $sClass = 'BxTemplPrivacy';
        if(!empty($aObject['override_class_name'])) {
            $sClass = $aObject['override_class_name'];
            if(!empty($aObject['override_class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);
        }

        $o = new $sClass($aObject);
        return ($GLOBALS['bxDolClasses']['BxDolPrivacy!' . $sObject] = $o);
    }

    /**
     * Get Select element with available groups.
     *
     * @param  string  $sObject  privacy object name.
     * @param  integer $iOwnerId object's owner ID.
     * @param  array   $aParams  an array of custom selector's params (dynamic_groups - an array of arrays('key' => group_id, 'value' => group_title), title - the title to be used for generated field).
     * @return an      array with Select element description.
     */
    public static function getGroupChooser($sObject, $iOwnerId = 0, $aParams = array())
    {
        $oPrivacy = BxDolPrivacy::getObjectInstance($sObject);
        if(empty($oPrivacy))
            return array();

        $sModule = $oPrivacy->_aObject['module'];
        $sAction = $oPrivacy->_aObject['action'];

        if($iOwnerId == 0)
            $iOwnerId = bx_get_logged_profile_id();

        $sValue = $oPrivacy->_oDb->getDefaultGroupByUser($sModule, $sAction, $iOwnerId);
        if(empty($sValue))
            $sValue = $oPrivacy->_oDb->getDefaultGroup($sModule, $sAction);

        $aValues = $oPrivacy->getGroups($iOwnerId, $aParams);

        $aValues = $oPrivacy->addDynamicGroups($aValues, $iOwnerId, $aParams);

        if(getParam('sys_enable_post_to_context_for_privacy') == 'on')
            $aValues = $oPrivacy->addSpaces($aValues, $iOwnerId, $aParams);

        $sName = $oPrivacy->convertActionToField($sAction);

        $sTitle = isset($aParams['title']) && !empty($aParams['title']) ? $aParams['title'] : '';
        if(empty($sTitle)) {
            $sTitle = $oPrivacy->_oDb->getTitle($sModule, $sAction);
            $sTitle = _t(!empty($sTitle) ? $sTitle : '_' . $sName);
        }

        $bDynamicMode = (isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true) || bx_is_dynamic_request();
        return array(
            'type' => 'select',
            'name' => $sName,
            'caption' => $sTitle,
            'value' => $sValue,
            'values' => $aValues,
            'attrs' => array(
                'class' => 'sys-privacy-group',
                'onchange' => 'javascript: ' . $oPrivacy->getJsObjectName() . '.selectGroup(this);'
            ),
            'checker' => array(
                'func' => 'avail',
                'error' => _t('_sys_ps_ferr_incorrect_select')
            ),
            'db' => array(
                'pass' => 'Int'
            ),
            'content' => $oPrivacy->addCssJs($bDynamicMode)
        );
    }

    public static function initGroupChooser($sObject, $iOwnerId = 0, $aParams = array())
    {
        $sResult = '';

        $oPrivacy = BxDolPrivacy::getObjectInstance($sObject);
        if(empty($oPrivacy))
            return $sResult;

        $iOwnerId = !empty($iOwnerId) ? (int)$iOwnerId : bx_get_logged_profile_id();
        $iContentId = !empty($aParams['content_id']) ? (int)$aParams['content_id'] : 0;
        $iGroupId = !empty($aParams['group_id']) ? (int)$aParams['group_id'] : 0;
        $bDynamicMode = (isset($aParams['dynamic_mode']) && (bool)$aParams['dynamic_mode'] === true) || bx_is_dynamic_request();

        $sJsCodeAdd = '';
        if($oPrivacy->isGroupsCustom())
            $sJsCodeAdd = $oPrivacy->getLoadGroupCustom($iOwnerId, $iContentId, $iGroupId, isset($aParams['html_ids']) ? $aParams['html_ids'] : array());

        return $oPrivacy->getJsScript($sJsCodeAdd, $bDynamicMode);
    }
    
    public static function initGroupChooserAPI($sObject, $iOwnerId = 0, $aParams = [])
    {
        $sResult = '';

        $oPrivacy = BxDolPrivacy::getObjectInstance($sObject);
        if(empty($oPrivacy))
            return $sResult;

        $iOwnerId = !empty($iOwnerId) ? (int)$iOwnerId : bx_get_logged_profile_id();
        $iContentId = !empty($aParams['content_id']) ? (int)$aParams['content_id'] : 0;
        $iGroupId = !empty($aParams['group_id']) ? (int)$aParams['group_id'] : 0;

        if($oPrivacy->isGroupsCustom() && ($aGroupsSettings = $oPrivacy->getGroupSettings($iGroupId)) !== false) {
            $aGroupCustom = $oPrivacy->getGroupCustom([
                'type' => 'pcog_ext', 
                'profile_id' => $iOwnerId, 
                'content_id' => $iContentId, 
                'object' => $sObject, 
                'group_id' => $iGroupId,
                'group_items_table' => $aGroupsSettings['db_table_items'],
                'group_items_field' => $aGroupsSettings['db_field_item']
            ]);

            if(is_array($aGroupCustom) && !empty($aGroupCustom['items']) && is_array($aGroupCustom['items']))
                $sResult = implode(',', $aGroupCustom['items']);
        }

        return $sResult;
    }
    
    public static function getIcon($iVisibility)
    {
        $aIcons =array(
           BX_DOL_PG_MEONLY => 'lock',
           BX_DOL_PG_ALL => 'globe',
           BX_DOL_PG_FRIENDS => 'user-friends',
           BX_DOL_PG_FRIENDS => 'user-friends'
       );
       return isset($aIcons[$iVisibility]) ? $aIcons[$iVisibility] : 'eye';
    }
    
            
    public function actionLoadGroupCustom()
    {
        $iProfileId = (int)bx_get('profile_id');
        $iContentId = (int)bx_get('content_id');
        $iGroupId = (int)bx_get('group_id');

        $oForm = BxDolForm::getObjectInstance($this->_sFormGroupCustom, $this->_sFormDisplayGcMembers);
        return echoJson(array('eval' => $this->getJsObjectName() . '.onSelectGroup(oData);', 'content' => $oForm->getElementGroupCustom(array(
            'profile_id' => $iProfileId, 
            'content_id' => $iContentId, 
            'object' => $this->_sObject, 
            'group_id' => $iGroupId
        ))));
    }

    public function actionSelectMembers()
    {
        $aValues = array(
            'profile_id' => (int)bx_get('profile_id'),
            'content_id' => (int)bx_get('content_id'),
            'object' => $this->_sObject,
            'group_id' => (int)bx_get('group_id')
        );

        $aParams = array(
            'popup_only' => (bool)bx_get('popup_only')
        );

        if(!isset($this->_aGroupsSettings[$aValues['group_id']]))
            return echoJson(array());

        if($aValues['profile_id'] != bx_get_logged_profile_id())
            return echoJson(array('msg' => _t('_sys_ps_ferr_incorrect_gc_owner')));

        if(($mixedResult = $this->isSelectGroupCustomUsers($aValues)) !== true)
            return echoJson(array('msg' => $mixedResult));

        return echoJson($this->getSelectGroup($aValues, $aParams));
    }

    public function actionSelectMemberships()
    {
        $aValues = array(
            'profile_id' => (int)bx_get('profile_id'),
            'content_id' => (int)bx_get('content_id'),
            'object' => $this->_sObject,
            'group_id' => (int)bx_get('group_id')
        );

        $aParams = array(
            'popup_only' => (bool)bx_get('popup_only')
        );

        if(!isset($this->_aGroupsSettings[$aValues['group_id']]))
            return echoJson(array());

        if($aValues['profile_id'] != bx_get_logged_profile_id())
            return echoJson(array('msg' => _t('_sys_ps_ferr_incorrect_gc_owner')));

        if(($mixedResult = $this->isSelectGroupCustomMemberships($aValues)) !== true)
            return echoJson(array('msg' => $mixedResult));

        return echoJson($this->getSelectMemberships($aValues, $aParams));
    }

    public function actionUsersList()
    {
        $iGroup = (int)bx_get('group');
        if(!isset($this->_aGroupsSettings[$iGroup]))
            return echoJson(array());

        $oConnection = BxDolConnection::getObjectInstance($this->_aGroupsSettings[$iGroup]['connection']);
        if(!$oConnection)
            return echoJson(array());

        $iProfileId = bx_get_logged_profile_id();
        $aConnectedIds = $oConnection->getConnectedContent($iProfileId, true);
        if(empty($aConnectedIds) || !is_array($aConnectedIds))
            return echoJson(array());

        $sTerm = bx_get('term');
        $aProfiles = BxDolService::call('system', 'profiles_search', array($sTerm), 'TemplServiceProfiles');
        if(empty($aProfiles))
            return echoJson(array());
        
        $aResult = array();
        foreach($aProfiles as $aProfile)
            if(in_array($aProfile['value'], $aConnectedIds))
                $aResult[] = $aProfile;

        echoJson($aResult);
    }

    public function getGroupSettings($iGroup)
    {
        if(empty($this->_aGroupsSettings[$iGroup]) || !is_array($this->_aGroupsSettings[$iGroup]))
            return false;

        return $this->_aGroupsSettings[$iGroup];
    }

    public function isGroupsCustom()
    {
        $aGroups = $this->_oDb->getGroupsBy(array('type' => 'active_list'));

        return in_array(BX_DOL_PG_FRIENDS_SELECTED, $aGroups) || in_array(BX_DOL_PG_RELATIONS_SELECTED, $aGroups) || in_array(BX_DOL_PG_MEMBERSHIPS_SELECTED, $aGroups);
    }
        
    public function getGroupsBy($aParams)
    {
        return $this->_oDb->getGroupsBy($aParams);          
    }

    public function getGroupCustom($aParams)
    {
        return $this->_oDb->getGroupCustom($aParams);
    }

    /**
     * Checks if this privacy object allows to add content in specified context.
     * 
     * @param type $sContext - context module name
     * @return boolean
     */
    public function isAllowedAddInContext($sContext)
    {
        $bSpaces = !empty($this->_aObject['spaces']);

        if($bSpaces && $this->_aObject['spaces'] == 'all') 
            return true;

        if($bSpaces && in_array($sContext, explode(',', $this->_aObject['spaces'])))
            return true;

        return false;
    }

    /**
     * Note. Is used when privacy group is processing after the main form submit.
     */
    public function addGroupCustom($aGroup, $aItems = [])
    {
        $this->deleteGroupCustom([
            'profile_id' => $aGroup['profile_id'],
            'content_id' => $aGroup['content_id'],
            'object' => $aGroup['object']
        ]);

        if(empty($aItems) || !is_array($aItems))
            return 0;

        $iGroupId = (int)$aGroup['group_id'];
        $iGroupCustomId = $this->_oDb->insertGroupCustom($aGroup);
        if($iGroupCustomId !== false && !empty($aItems) && is_array($aItems)) {
            $bMembers = $iGroupId == BX_DOL_PG_FRIENDS_SELECTED || $iGroupId == BX_DOL_PG_RELATIONS_SELECTED;
            $bMemberships = $iGroupId == BX_DOL_PG_MEMBERSHIPS_SELECTED;
            if(($bMembers || $bMemberships) && ($sType = $bMembers ? 'member' : ($bMemberships ? 'membership' : '')) !== '')
                foreach($aItems as $iItem)
                    $this->_oDb->{'insertGroupCustom' . ucfirst($sType)}(['group_id' => $iGroupCustomId, $sType . '_id' => $iItem]);
        }

        return $iGroupCustomId;
    }

    /**
     * Note. Is used when privacy group is processing after the main form submit.
     */
    public function editGroupCustom($aGroup, $aItems = [])
    {
        $aGroupCustom = $this->getGroupCustom([
            'type' => 'pco',
            'profile_id' => $aGroup['profile_id'],
            'content_id' => $aGroup['content_id'],
            'object' => $this->_sObject
        ]);
        if(empty($aGroupCustom) || !is_array($aGroupCustom))
            return $this->addGroupCustom($aGroup, $aItems);

        $iGroupId = (int)$aGroupCustom['group_id'];
        $iGroupCustomId = (int)$aGroupCustom['id'];

        if($iGroupId != (int)$aGroup['group_id'])
            return $this->addGroupCustom($aGroup, $aItems);

        $bMembers = $iGroupId == BX_DOL_PG_FRIENDS_SELECTED || $iGroupId == BX_DOL_PG_RELATIONS_SELECTED;
        $bMemberships = $iGroupId == BX_DOL_PG_MEMBERSHIPS_SELECTED;
        if(($bMembers || $bMemberships) && ($sType = $bMembers ? 'member' : ($bMemberships ? 'membership' : '')) !== '') {
            $sTypeUc = ucfirst($sType);

            $this->_oDb->{'deleteGroupCustom' . $sTypeUc}(['group_id' => $iGroupCustomId]);

            if(!empty($aItems) && is_array($aItems))
                foreach($aItems as $iItemId)
                    $this->_oDb->{'insertGroupCustom' . $sTypeUc}(['group_id' => $iGroupCustomId, $sType . '_id' => $iItemId]);
        }

        return $iGroupCustomId;
    }

    public function updateGroupCustom($aParamsSet, $aParamsWhere)
    {
        return $this->_oDb->updateGroupCustom($aParamsSet, $aParamsWhere);
    }

    public function deleteGroupCustom($aParamsWhere)
    {
        return $this->_oDb->deleteGroupCustom($aParamsWhere);
    }

    public function associateGroupCustomWithContent($iProfileId, $iContentId, $iGroupId)
    {
        return $this->updateGroupCustom(array('content_id' => $iContentId), array(
            'profile_id' => $iProfileId,
            'content_id' => 0,
            'object' => $this->_sObject,
            'group_id' => $iGroupId
        ));
    }

    public function reassociateGroupCustomWithContent($iProfileId, $iContentId, $iGroupId)
    {
        $aGroupCustom = $this->getGroupCustom(array(
            'type' => 'pco', 
            'profile_id' => $iProfileId,
            'content_id' => $iContentId,
            'object' => $this->_sObject
        ));

        if(!empty($aGroupCustom) && is_array($aGroupCustom) && $aGroupCustom['group_id'] != $iGroupId) {
            $this->deleteGroupCustom(array('id' => $aGroupCustom['id']));

            $this->associateGroupCustomWithContent($iProfileId, $iContentId, $iGroupId);
        }
    }

    public function deleteGroupCustomByContentId($iContentId)
    {
        return $this->_oDb->deleteGroupCustom(array('content_id' => $iContentId, 'object' => $this->_sObject));
    }

    public function deleteGroupCustomByProfileId($iProfileId, $mixedContentId = false)
    {
        $aParams = ['type' => 'profile_id', 'profile_id' => $iProfileId];
        if($mixedContentId !== false)
            $aParams['content_id'] = (int)$mixedContentId;

        $aGroups = $this->_oDb->getGroupCustom($aParams);
        if(empty($aGroups) || !is_array($aGroups))
            return true;

        foreach($aGroups as $aGroup)
            $this->_oDb->deleteGroupCustom(array('id' => $aGroup['id']));

        return true;
    }

    public function deleteGroupCustomByProfileIdUnused($iProfileId)
    {
        return $this->deleteGroupCustomByProfileId($iProfileId, 0);
    }

    public function addDynamicGroups($aValues, $iOwnerId, $aParams)
    {
        if (isset($aParams['dynamic_groups']) && is_array($aParams['dynamic_groups']))
            $aValues = array_merge($aValues, $aParams['dynamic_groups']);

        return $aValues;
    }

    public function addSpaces($aValues, $iOwnerId, $aParams)
    {
        if (!$this->_aObject['spaces'])
            return $aValues;

        if (!($oProfile = BxDolProfile::getInstance($iOwnerId)))
            return $aValues;

        if (!($aModules = BxDolModuleQuery::getInstance()->getModules()))
            return $aValues;
        
        $aExcludeModules = explode(',', getParam('sys_hide_post_to_context_for_privacy'));
        
        foreach ($aModules as $aModule) {
            if (!$aModule['enabled'])
                continue;

            if ('all' != $this->_aObject['spaces'] && false === stripos($this->_aObject['spaces'], $aModule['name']))
                continue;

            if (!BxDolRequest::serviceExists($aModule['name'], 'act_as_profile'))
                continue;
            
            if (in_array($aModule['name'], $aExcludeModules))
                continue;

            $oModule = BxDolModule::getInstance($aModule['name']);
            if (bx_srv($aModule['name'], 'act_as_profile') && (!isset($oModule->_oConfig->CNF['ALLOW_AS_CONTEXT']) || $oModule->_oConfig->CNF['ALLOW_AS_CONTEXT'] == false))
                continue;

            $a = BxDolService::call($aModule['name'], 'get_participating_profiles', array($oProfile->id()));

            // for an organization we should treat the organization profile itself as a participant of itself
            // to be able to post into an organization's context while being logged as that organization
            if ($aModule['name'] == 'bx_organizations' && $oProfile->getModule() == 'bx_organizations') $a = array_merge($a, [$oProfile->id()]);

            $aSpaces = array();       
            foreach ($a as $iProfileId) {
                if (!($o = BxDolProfile::getInstance($iProfileId)))
                    continue;

                // check whether a profile is allowed to post this type of content to a context
                $oConnectedProfile = BxDolProfile::getInstance($iProfileId);
                if (bx_srv($aModule['name'], 'check_allowed_post_in_profile', array($oConnectedProfile->getContentId(), $this->_aObject['module'])) !== CHECK_ACTION_RESULT_ALLOWED)
                    continue;

                $aSpaces[-$iProfileId] = array('key' => -$iProfileId, 'value' => $o->getDisplayName());
            }

            if ($aSpaces) {
                $aItemStart = array(array('type' => 'group_header', 'value' => mb_strtoupper(BxDolService::call($aModule['name'], 'get_space_title'))));
                $aItemEnd = array(array('type' => 'group_end'));
                $aValues = array_merge($aValues, $aItemStart, array_values($aSpaces), $aItemEnd);
            }
        }
        
        return $aValues;
    }

    /**
     * Get database field name for action.
     *
     * @param  string $sObject privacy object name.
     * @param  string $sAction action name.
     * @return string with field name.
     */
    public static function getFieldName($sObject, $sAction = '')
    {
        $oPrivacy = BxDolPrivacy::getObjectInstance($sObject);
        if(empty($oPrivacy))
            return '';

        if(empty($sAction))
            $sAction = $oPrivacy->_aObject['action'];

        return $oPrivacy->convertActionToField($sAction);
    }

    /**
     * Get necessary condition array to use privacy in search classes
     * @param $mixedGroupId group ID or array of group IDs
     * @return array of conditions, for now with 'restriction' part only is returned
     */
    public function getContentByGroupAsCondition($mixedGroupId)
    {
        $aResult = array(
            'restriction' => array (
                'privacy_' . $this->_sObject => array(
                    'value' => $mixedGroupId,
                    'field' => $this->convertActionToField($this->_aObject['action']),
                    'operator' => is_array($mixedGroupId) ? 'in' : '=',
                    'table' => $this->_aObject['table'],
                ),
            ),
        );   
         /**
         * @hooks
         * @hookdef hook-system-privacy_condition 'system', 'privacy_condition' - hook on get necessary condition array to use privacy in search classes
         * - $unit_name - equals `profile`
         * - $action - equals `privacy_condition` 
         * - $object_id - not used
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `group_id` - [int] group ID or array of group IDs
         *      - `field` - [string] field name
         *      - `object` - [array] array with object privacy 
         *      - `privacy_object` - [array] object privacy 
         *      - `result` - [bool] by ref, on success return true otherwise false, can be overridden in hook processing
         * @hook @ref hook-system-privacy_condition
         */
        bx_alert('system', 'privacy_condition', 0, false, array(
            'group_id' => $mixedGroupId,
            'field' => $this->convertActionToField($this->_aObject['action']),
            'object' => $this->_aObject,
            'privacy_object' => $this,
            'result' => &$aResult
            )
        );
        return $aResult;
    }

    /**
     * Get necessary condition array to use privacy in search classes
     * @param $iProfileIdOwner owner profile ID
     * @return array of conditions, for now with 'restriction' part only is returned
     */
    public function getContentPublicAsCondition($iProfileIdOwner = 0, $aCustomGroups = array())
    {
        $mixedPrivacyGroups = $this->getPrivacyGroupsForContentPublic($iProfileIdOwner, $aCustomGroups);
        if($mixedPrivacyGroups === true)
        	return array();

        return $this->getContentByGroupAsCondition($mixedPrivacyGroups);
    }

    /**
     * Get necessary parts of SQL query to use privacy in other queries
     * @param $mixedGroupId group ID or array of group IDs
     * @return array of SQL string parts, for now 'where' part only is returned
     */
    public function getContentByGroupAsSQLPart($mixedGroupId)
    {
        $sField = $this->convertActionToField($this->_aObject['action']);
        return $this->_oDb->getContentByGroupAsSQLPart($sField, $mixedGroupId);
    }

    /**
     * Get necessary parts of SQL query to use privacy in other queries
     * @param $iProfileIdOwner owner profile ID
     * @return array of SQL string parts, for now 'where' part only is returned
     */
    public function getContentPublicAsSQLPart($iProfileIdOwner = 0, $aCustomGroups = array())
    {
        $mixedPrivacyGroups = $this->getPrivacyGroupsForContentPublic($iProfileIdOwner, $aCustomGroups);
        if($mixedPrivacyGroups === true)
            return array();

        return $this->getContentByGroupAsSQLPart($mixedPrivacyGroups);
    }
    
    /**
     * Get necessary parts of SQL query to use privacy in other queries
     * @param $iProfileIdOwner owner profile ID
     * @return array of SQL string parts, for now 'where' part only is returned
     */
    public function getContentPublicAndInContextAsSQLPart($iProfileIdOwner = 0, $aCustomGroups = [], $aCustomContexts = [])
    {
        $mixedPrivacyGroups = $this->getPrivacyGroupsForContentPublic($iProfileIdOwner, $aCustomGroups);
        if($mixedPrivacyGroups === true)
            return [];

        $sField = $this->convertActionToField($this->_aObject['action']);
        return $this->_oDb->getContentByGroupAndContextAsSQLPart($sField, $mixedPrivacyGroups, $aCustomContexts);
    }

    /**
     * Check whether the viewer can make requested action.
     *
     * @param  integer $iObjectId object ID the action to be performed with.
     * @param  integer $iViewerId viewer ID.
     * @return boolean result of operation.
     */
    public function check($iObjectId, $iViewerId = 0)
    {
        $aObject = $this->getObjectInfo($this->convertActionToField($this->_aObject['action']), $iObjectId);
        $bRv = $this->_check($iObjectId, $iViewerId, $aObject);
        /**
         * @hooks
         * @hookdef hook-system-check_privacy 'system', 'check_privacy' - check privacy for object
         * - $unit_name - equals `profile`
         * - $action - equals `check_privacy` 
         * - $object_id - not used
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_id` - [int] object id
         *      - `viewer_id` - [int] profile_id for viewer
         *      - `object` - [array] object privacy 
         *      - `object_privacy` - [array] arry with object privacy 
         *      - `result` - [bool] by ref, on success return true otherwise false, can be overridden in hook processing
         * @hook @ref hook-system-check_privacy
         */
        bx_alert('system', 'check_privacy', 0, 0, array(
           'object_id' => $iObjectId,
           'viewer_id' => $iViewerId,
           'object' => $aObject,
           'object_privacy' => $this->_aObject,
           'result' => &$bRv
        ));
        return $bRv;
    }

    public function checkSpace($aObject, $iViewerId)
    {
        $oProfile = BxDolProfile::getInstance(-$aObject['group_id']);
        if (!$oProfile)
            return false;

        return CHECK_ACTION_RESULT_ALLOWED === bx_srv($oProfile->getModule(), 'check_space_privacy_for_profile', [$oProfile->getContentId(), $iViewerId]);
    }

    public function checkMeOnly($iOwnerId, $iViewerId)
    {
        return false;
    }

    public function checkPublic($iOwnerId, $iViewerId)
    {
        return true;
    }

    public function checkMembers($iOwnerId, $iViewerId)
    {
        return isMember();
    }

    public function checkFriends($iOwnerId, $iViewerId)
    {
        return BxDolConnection::getObjectInstance('sys_profiles_friends')->isConnected($iOwnerId, $iViewerId, true);
    }

    public function checkFriendsSelectedByObject($aObject, $iViewerId)
    {
        if(!$this->checkFriends($aObject['owner_id'], $iViewerId))
            return false;

        $aGroupCustom = $this->getGroupCustom(array(
            'type' => 'pcog_ext', 
            'profile_id' => $aObject['owner_id'], 
            'content_id' => $aObject['id'], 
            'object' => $this->_sObject, 
            'group_id' => $aObject['group_id'],
            'group_items_table' => $this->_aGroupsSettings[$aObject['group_id']]['db_table_items'],
            'group_items_field' => $this->_aGroupsSettings[$aObject['group_id']]['db_field_item']
        ));

        return !empty($aGroupCustom['items']) && is_array($aGroupCustom['items']) && in_array($iViewerId, $aGroupCustom['items']);
    }

    public function checkRelations($iOwnerId, $iViewerId)
    {
        return BxDolConnection::getObjectInstance('sys_profiles_relations')->isConnected($iOwnerId, $iViewerId, true);
    }

    public function checkRelationsSelectedByObject($aObject, $iViewerId)
    {
        if(!$this->checkRelations($aObject['owner_id'], $iViewerId))
            return false;

        $aGroupCustom = $this->getGroupCustom(array(
            'type' => 'pcog_ext', 
            'profile_id' => $aObject['owner_id'], 
            'content_id' => $aObject['id'], 
            'object' => $this->_sObject, 
            'group_id' => $aObject['group_id'],
            'group_items_table' => $this->_aGroupsSettings[$aObject['group_id']]['db_table_items'],
            'group_items_field' => $this->_aGroupsSettings[$aObject['group_id']]['db_field_item']
        ));

        return !empty($aGroupCustom['items']) && is_array($aGroupCustom['items']) && in_array($iViewerId, $aGroupCustom['items']);
    }

    public function checkMembershipsSelectedByObject($aObject, $iViewerId)
    {
        $aGroupCustom = $this->getGroupCustom(array(
            'type' => 'pcog_ext', 
            'profile_id' => $aObject['owner_id'], 
            'content_id' => $aObject['id'], 
            'object' => $this->_sObject, 
            'group_id' => $aObject['group_id'],
            'group_items_table' => $this->_aGroupsSettings[$aObject['group_id']]['db_table_items'],
            'group_items_field' => $this->_aGroupsSettings[$aObject['group_id']]['db_field_item']
        ));

        return !empty($aGroupCustom['items']) && is_array($aGroupCustom['items']) && BxDolAcl::getInstance()->isMemberLevelInSet($aGroupCustom['items'], $iViewerId);
    }

    public function checkCustomByObject($aObject, $iViewerId)
    {
        return '';
    }

    public function setTableFieldAuthor($sValue)
    {
        $this->_aObject['table_field_author'] = $sValue;

        $this->_oDb->init($this->_aObject);
    }

    protected function getObjectInfo($sAction, $iObjectId)
    {
        return $this->_oDb->getObjectInfo($sAction, $iObjectId);
    }

    protected function getPrivacyGroupsForContentPublic($iProfileIdOwner = 0, $aCustomGroups = array())
    {
        $aGroups = array(BX_DOL_PG_ALL);
        if(isLogged()) {
            $iProfileIdLogged = bx_get_logged_profile_id();
            if($iProfileIdLogged == $iProfileIdOwner)
                return true;

            $aGroups[] = BX_DOL_PG_MEMBERS;
            if($iProfileIdOwner && $this->checkFriends($iProfileIdOwner, $iProfileIdLogged))
                $aGroups[] = BX_DOL_PG_FRIENDS;
        }

        return array_merge($aGroups, $aCustomGroups);
    }

    protected function getCheckMethod($s)
    {
        if(substr($s, 0, 1) != '@')
            return false;

        return bx_gen_method_name(str_replace('@', 'check_', $s));
    }

    protected function convertActionToField($sAction)
    {
    	return 'allow_' . strtolower(str_replace(' ', '-', $sAction)) . '_to';
    }

    /**
     * Check whethere viewer is a member of dynamic group.
     *
     * @param  mixed   $mixedGroupId   dynamic group ID.
     * @param  integer $iObjectOwnerId object owner ID.
     * @param  integer $iViewerId      viewer ID.
     * @return boolean result of operation.
     */
    protected function isDynamicGroupMember($mixedGroupId, $iObjectOwnerId, $iViewerId, $iObjectId)
    {
        return false;
    }

    /**
     * get privacy groups for getGroupChooser
     */ 
    protected function getGroups($iOwnerId = 0, $aParams = []) 
    {
        $aValues = array();

        $aGroups = $this->_oDb->getGroupsBy(array('type' => 'active'));
        foreach($aGroups as $aGroup) {
            $iGroupId = (int)$aGroup['id'];

            if((int)$aGroup['active'] == 0 || in_array($iGroupId, $this->_aGroupsExclude))
               continue;

            if(isset($this->_aGroupsSettings[$iGroupId]) && !empty($this->_aGroupsSettings[$iGroupId]['is_allowed'])) {
                $sMethodIsAllowed = $this->_aGroupsSettings[$iGroupId]['is_allowed'];
                if(method_exists($this, $sMethodIsAllowed) && $this->$sMethodIsAllowed($iOwnerId) !== true)
                    continue;
            }

            $aValues[] = array('key' => $aGroup['id'], 'value' => _t($aGroup['title']));
        }

        return $aValues;
    }

    /**
     * Check whethere a custom group (based on users list) is allowed in current circumstances.
     * NOTE. Can be overwritten if it's needed.
     * 
     * @param type $aParams an array of parameters.
     * @return boolean result of operation.
     */
    protected function isSelectGroupCustomUsers($aParams)
    {
        return true;
    }

    /**
     * Check whethere a custom group (based on memberships list) is allowed in current circumstances.
     * NOTE. Can be overwritten if it's needed.
     * 
     * @param type $aParams an array of parameters.
     * @return boolean result of operation.
     */
    protected function isSelectGroupCustomMemberships($aParams)
    {
        return true;
    }

    public function isAllowedRelations($iUserId)
    {
        return BxDolConnectionRelation::isEnabled();
    }

    public function isAllowedMemberships($iUserId)
    {
        $aCheck = checkActionModule($iUserId, 'show membership levels in privacy groups', 'system', false);
        return $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Check whether the viewer can make requested action.
     *
     * @param  integer $iObjectId object ID the action to be performed with.
     * @param  integer $iViewerId viewer ID.
     * @return boolean result of operation.
     */
    protected function _check($iObjectId, $iViewerId, $aObject)
    {
        if(empty($iViewerId))
            $iViewerId = (int)bx_get_logged_profile_id();

        if(empty($aObject) || !is_array($aObject))
            return false;

        if($aObject['group_id'] == BX_DOL_PG_HIDDEN)
            return false;

        $aViewer = BxDolProfileQuery::getInstance()->getInfoById($iViewerId);
        if(($aViewer && isAdmin($aViewer['account_id'])) || $iViewerId == $aObject['owner_id'])
            return true;

        if(strncmp($aObject['group_id'], 'ml', 2) === 0) {
            $iLevel = (int)substr($aObject['group_id'], 2);
            return (bool)BxDolAcl::getInstance()->isMemberLevelInSet(array($iLevel), $iViewerId);
        }

        if($aObject['group_id'] < 0)
            return $this->checkSpace($aObject, $iViewerId);

        $aGroup = $this->_oDb->getGroupsBy(array('type' => 'id', 'id' => $aObject['group_id']));
        if(!empty($aGroup) && is_array($aGroup) && (int)$aGroup['active'] == 1 && !empty($aGroup['check'])) {
            $sCheckMethod = $this->getCheckMethod($aGroup['check']);
            if(method_exists($this, $sCheckMethod) && $this->$sCheckMethod((substr($sCheckMethod, -8) == 'ByObject' ? $aObject : $aObject['owner_id']), $iViewerId))
                return true;
        }

        return $this->isDynamicGroupMember($aObject['group_id'], $aObject['owner_id'], $iViewerId, $iObjectId);
    }
}

/** @} */
