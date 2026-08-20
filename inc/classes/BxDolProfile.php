<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_PROFILE_ACTION_AUTO', 0); ///< automatic action without any checking
define('BX_PROFILE_ACTION_MANUAL', 1); ///< manual action performed by human
define('BX_PROFILE_ACTION_ROBOT', 2); ///< action peformed by some robot based on some conditions
define('BX_PROFILE_ACTION_EXTERNAL', 2); ///< action peformed by external service, like join using OAuth 

class BxDolProfile extends BxDolFactory implements iBxDolProfile
{
    protected $_iProfileID;
    protected $_aProfile;
    protected $_oQuery;

    /**
     * Constructor
     */
    protected function __construct ($iProfileId)
    {
        $iProfileId = (int)$iProfileId;
        $sClass = get_class($this) . '_' . $iProfileId;
        if (isset($GLOBALS['bxDolClasses'][$sClass]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_iProfileID = $iProfileId; // since constructor is protected $iProfileId is always valid
        $this->_oQuery = BxDolProfileQuery::getInstance();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        $sClass = get_class($this) . '_' . $this->_iProfileID;
        if (isset($GLOBALS['bxDolClasses'][$sClass]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of Account Profile by account id
     */
    public static function getInstanceAccountProfile($iAccountId = false, $bClearCache = false)
    {
        if (!$iAccountId)
            $iAccountId = getLoggedId();
        $oQuery = BxDolProfileQuery::getInstance();
        $aProfile = $oQuery->getProfileByContentTypeAccount($iAccountId, 'system', $iAccountId);
        if (!$aProfile)
            return false;
        return self::getInstance($aProfile['id'], $bClearCache);
    }

    /**
     * Get singleton instance of Profile by account id, content id and type
     */
    public static function getInstanceByContentTypeAccount($iContent, $sType, $iAccountId = false)
    {
        if (!$iAccountId)
            $iAccountId = getLoggedId();
        $oQuery = BxDolProfileQuery::getInstance();
        $aProfile = $oQuery->getProfileByContentTypeAccount($iContent, $sType, $iAccountId);
        if (!$aProfile)
            return false;
        return self::getInstance($aProfile['id']);
    }

    /**
     * Get singleton instance of Profile by content id and type
     */
    public static function getInstanceByContentAndType($iContent, $sType, $bClearCache = false)
    {
        $oQuery = BxDolProfileQuery::getInstance();
        $aProfile = $oQuery->getProfileByContentAndType($iContent, $sType, $bClearCache);
        if (!$aProfile)
            return false;
        return self::getInstance($aProfile['id']);
    }

    /**
     * Get singleton instance of Profile by Account id (currently active profile is returned)
     */
    public static function getInstanceByAccount($iAccountId = false, $bClearCache = false)
    {
        $oQuery = BxDolProfileQuery::getInstance();
        $mixedProfileId = $oQuery->getCurrentProfileByAccount($iAccountId, $bClearCache);

        return self::getInstance($mixedProfileId);
    }

    /**
     * Get singleton instance of Profile by profile id, if profile isn't found it returns instance of BxDolProfileAnonymous or BxDolProfileUndefined
     */
    public static function getInstanceMagic($mixedProfileId = false, $bClearCache = false)
    {
        if ($mixedProfileId < 0)
            return BxDolProfileAnonymous::getInstance($mixedProfileId);

        if (0 === $mixedProfileId || !($oProfile = self::getInstance($mixedProfileId, $bClearCache)))
            return BxDolProfileUndefined::getInstance();
        
        return $oProfile;
    }

    /**
     * Get singleton instance of Profile by profile id
     */
    public static function getInstance($mixedProfileId = false, $bClearCache = false)
    {
        $oQuery = BxDolProfileQuery::getInstance();

        if (!$mixedProfileId) {
            if (isset($GLOBALS['glForceCurrentProfileId']) && $GLOBALS['glForceCurrentProfileId'] > 0)
                $mixedProfileId = $GLOBALS['glForceCurrentProfileId'];
            else
                $mixedProfileId = $oQuery->getCurrentProfileByAccount(getLoggedId(), $bClearCache);
        }

        $aProfileInfo = $oQuery->getInfoById($mixedProfileId);
        if (empty($aProfileInfo['id']) || !BxDolModuleDb::getInstance()->isEnabledByName($aProfileInfo['type']))
            return false;

        $sClass = __CLASS__ . '_' . $aProfileInfo['id'];
        if (!isset($GLOBALS['bxDolClasses'][$sClass]))
            $GLOBALS['bxDolClasses'][$sClass] = new BxDolProfile($aProfileInfo['id']);

        return $GLOBALS['bxDolClasses'][$sClass];
    }

    public static function getData($mixedProfileId = false, $aParams = [])
    {
        $sDisplayType = 'unit';
        if(isset($aParams['display_type']))
            $sDisplayType = $aParams['display_type'];

        if(!($mixedProfileId instanceof BxDolProfile))
            $oProfile = BxDolProfile::getInstanceMagic($mixedProfileId);
        else
            $oProfile = $mixedProfileId;

        $aRv = [
            'id' => $oProfile->id(),
            'display_name' => $oProfile->getDisplayName(),
            'url' => ($sUrl = $oProfile->getUrl()) !== false ? bx_api_get_relative_url($sUrl) : false,
            'url_avatar' => $oProfile->{isset($aParams['get_avatar']) && method_exists($oProfile, $aParams['get_avatar']) ? $aParams['get_avatar'] : 'getAvatar'}(),
            'module' => $oProfile->getModule(),
        ];

        if(isset($aParams['with_info']) && (bool)$aParams['with_info'])
            $aRv['info'] = bx_srv($oProfile->getModule(), 'get_info', [$oProfile->getContentId(), false]);
        
        return $aRv;
    }
    
    public static function getDataForPage($mixedProfileId = false, $aParams = [])
    {
        $oAcl = BxDolAcl::getInstance();
        $oTemplate = BxDolTemplate::getInstance();

        if(!($mixedProfileId instanceof BxDolProfile))
            $oProfile = BxDolProfile::getInstanceMagic($mixedProfileId);
        else
            $oProfile = $mixedProfileId;

        $oAccount = $oProfile->getAccountObject();

        $iId = $oProfile->id();
        $sUrl = bx_api_get_relative_url($oProfile->getUrl());

        $aMembershipInfo = $oAcl->getMemberMembershipInfo($iId);
        $aMembershipLevelInfo =  $oAcl->getMembershipInfo($aMembershipInfo['id']);

        $sIconS = $aMembershipLevelInfo['icon'];
        $sIconD = $oTemplate->getImage($sIconS, ['wrap_in_tag' => false]);

        $aRv = [
            'id' => $iId,
            'account_id' => $oAccount->id(),
            'email' => $oAccount->getEmail(),
            'display_name' => $oProfile->getDisplayName(),
            'url' => $sUrl,
            'url_postfix' => substr($sUrl, strrpos($sUrl, '/') + 1),
            'avatar' => $oProfile->getAvatar(),
            'settings' => $oProfile->getSettings(),
            'membership' => $aMembershipInfo['id'],
            'membership_name' => _t($aMembershipInfo['name']),
            'membership_icon' => strcmp($sIconS, $sIconD) != 0 ? $sIconD : BxDolIconset::getObjectInstance()->getIcon($sIconD),
            'moderator' => (bool)BxDolAcl::getInstance()->isMemberLevelInSet([MEMBERSHIP_ID_ADMINISTRATOR, MEMBERSHIP_ID_MODERATOR], $iId),
            'operator' => isAdmin(),
            //'info' => $oProfile->getInfo(),
            'confirmed' => $oAccount->isConfirmed(),
            'profiles_count' => $oAccount->getProfilesNumber(true),
            'hash' => encryptUserId($iId),
            'profiles_limit' => (int)getParam('sys_account_limit_profiles_number'),
            'active' => $oProfile->isActive(),
            'status' => $oProfile->getStatus(),
        ];
        
        if ($iId == bx_get_logged_profile_id()){
            $aRv['counters'] = bx_srv('system', 'profile_counters', [], 'TemplServiceProfiles');
            
            $oInformer = BxDolInformer::getInstance($oTemplate);
            $sRet = $oInformer ? $oInformer->display() : '';
            if ($sRet){
                $aRv['informer'] = $sRet;
            }

            /*  
            $oPayments = BxDolPayments::getInstance();
            if($oPayments->isActive())
                $aRv['cart'] = $oPayments->getCartItemsCount();

            $sModuleNotifications = 'bx_notifications';
            if(BxDolRequest::serviceExists($sModuleNotifications, 'get_unread_notifications_num'))
                $aRv['notifications'] = bx_srv($sModuleNotifications, 'get_unread_notifications_num', [$iId]);
            */

            if($oProfile !== false && BxDolAccount::isAllowedCreateMultiple($iId)) {
                $oAccount = BxDolAccount::getInstance();
                if($oAccount != false && !$oAccount->isProfilesLimitReached()) {
                    $oMenuProfileAdd = BxDolMenu::getObjectInstance('sys_add_profile');
                    if($oMenuProfileAdd !== false)
                        $aRv['menu'] = $oMenuProfileAdd->getCodeAPI();
                }
            }
        }

        bx_alert('system', 'get_profile_for_page_api', 0, 0, ['override_result' => &$aRv]);
        
        return $aRv;
    }

    /**
     * Get profile id
     */
    public function id()
    {
        $aProfile = $this->getInfo($this->_iProfileID);
        return isset($aProfile['id']) ? $aProfile['id'] : false;
    }

    /**
     * Get account id associated with the profile
     */
    public function getAccountId($iProfileId = false)
    {
        $aInfo = $this->getInfo($iProfileId);
        return $aInfo['account_id'];
    }

    /**
     * Get account object associated with the profile
     */
    public function getAccountObject($iProfileId = false)
    {
        return BxDolAccount::getInstance($this->getAccountId($iProfileId));
    }

    /**
     * Get content id associated with the profile
     */
    public function getContentId()
    {
        $aInfo = $this->getInfo();
        return $aInfo['content_id'];
    }

    /**
     * Check if profile status is active
     */
    public function isActive($iProfileId = false)
    {
        if($this->getStatus($iProfileId) != BX_PROFILE_STATUS_ACTIVE)
            return false;

        return (($oAccount = $this->getAccountObject($iProfileId)) !== false && $oAccount->isConfirmed()) || !getParam('sys_account_hide_unconfirmed_accounts');
    }

    /**
     * Is profile online
     */
    public function isOnline($iProfileId = false)
    {
        $iProfileId = (int)$iProfileId ? $iProfileId : $this->_iProfileID;
        return $this->_oQuery->isOnline($iProfileId);
    }

    /**
     * Is profile can 'Act as Profile'
     */
    public function isActAsProfile($iProfileId = false)
    {
        $aInfo = $this->_oQuery->getInfoById((int)$iProfileId ? $iProfileId : $this->_iProfileID);
        return BxDolService::call($aInfo['type'], 'act_as_profile');
    }

    /**
     * Get profile status
     */
    public function getStatus($iProfileId = false)
    {
        $aInfo = $this->_oQuery->getInfoById((int)$iProfileId ? $iProfileId : $this->_iProfileID);
        if(empty($aInfo) || !is_array($aInfo))
            return false;

        return $aInfo['status'];
    }

    /**
     * Get profile module name
     */
    public function getModule($iProfileId = false)
    {
        $aInfo = $this->_oQuery->getInfoById((int)$iProfileId ? $iProfileId : $this->_iProfileID);
        return $aInfo['type'];
    }

    /**
     * Get profile info
     */
    public function getInfo($iProfileId = 0)
    {
        if ($iProfileId && $iProfileId != $this->_iProfileID)
            return $this->_oQuery->getInfoById((int)$iProfileId ? $iProfileId : $this->_iProfileID);

        if ($this->_aProfile)
            return $this->_aProfile;
        
        $this->_aProfile = $this->_oQuery->getInfoById((int)$iProfileId ? $iProfileId : $this->_iProfileID);
        return $this->_aProfile;
    }

    /**
     * Validate profile id.
     * @param $s - profile id
     * @return profile id or false if profile was not found
     */
    static public function getID($s)
    {
        $iId = BxDolProfileQuery::getInstance()->getIdById((int)$s);
        return $iId ? $iId : false;
    }

    /**
     * Get name to display in thumbnail
     */
    public function getDisplayName($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        $sDisplayName = BxDolService::call($aInfo['type'], 'profile_name', array($aInfo['content_id']));
        /**
         * @hooks
         * @hookdef hook-profile-profile_name 'profile', 'profile_name' - hook on before profile deletion
         * - $unit_name - equals `profile`
         * - $action - equals `profile_name` 
         * - $object_id - profile_id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `info` - [array] profile info
         *      - `display_name` - [bool] by ref, display profile name, can be overridden in hook processing
         * @hook @ref hook-profile-profile_name
         */
        bx_alert('profile', 'profile_name', $iProfileId, 0, array(
            'info' => $aInfo, 
            'display_name' => &$sDisplayName,
            'display_name_ref' => &$sDisplayName
        ));
        return $sDisplayName;
    }
    
    public function getSettings($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return  BxDolService::call($aInfo['type'], 'profile_settings', array($aInfo['content_id']));
    }

    /**
     * Get profile url
     */
    public function getUrl($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_url', array($aInfo['content_id']));
    }

    /**
     * Get profile unit
     */
    public function getUnit($iProfileId = 0, $aParams = array())
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_unit', array($aInfo['content_id'], $aParams));
    }

    /**
     * Get profile unit for API calls
     */
    public function getUnitAPI($iProfileId = 0, $aParams = array())
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_unit_api', array($aInfo['content_id'], $aParams));
    }

    /**
     * Get badges
     */
    public function getBadges($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'get_badges', array($aInfo['content_id'], false, true));
    }

	/**
     * Check whether a profile has real image uploaded by user.
     */
    public function hasImage($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'has_image', array($aInfo['content_id']));
    }

    /**
     * Get picture url
     */
    public function getPicture($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_picture', array($aInfo['content_id']));
    }

    /**
     * Get avatar url
     */
    public function getAvatar($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_avatar', array($aInfo['content_id']));
    }

    /**
     * Get big (2x) avatar url
     */
    public function getAvatarBig($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_avatar_big', array($aInfo['content_id']));
    }

    /**
     * Get cover url
     */
    public function getCover($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_cover', array($aInfo['content_id']));
    }

	/**
     * Get unit cover url
     */
    public function getUnitCover($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_unit_cover', array($aInfo['content_id']));
    }

    /**
     * Get thumbnail url
     */
    public function getThumb($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_thumb', array($aInfo['content_id']));
    }

    /**
     * Get icon url
     */
    public function getIcon($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_icon', array($aInfo['content_id']));
    }

    /**
     * Get module icon
     */
    public function getIconModule($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'module_icon');
    }

    /**
     * get profile edit page url
     */
    public function getEditUrl($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'profile_edit_url', array($aInfo['content_id']));
    }

    /**
     * @see iBxDolProfile::checkAllowedProfileView
     */
    public function checkAllowedProfileView($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'check_allowed_profile_view', array($aInfo['content_id']));
    }

    /**
     * @see iBxDolProfile::checkAllowedProfileContact
     */
    public function checkAllowedProfileContact($iProfileId = 0)
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'check_allowed_profile_contact', array($aInfo['content_id']));
    }
    
    
    /**
     * @see iBxDolProfile::checkAllowedPostInProfile
     */
    public function checkAllowedPostInProfile($iProfileId = 0, $sPostModule = '')
    {
        $aInfo = $this->getInfo($iProfileId);
        return BxDolService::call($aInfo['type'], 'check_allowed_post_in_profile', array($aInfo['content_id'], $sPostModule));
    }
    
    /**
     * Delete profile.
     * @param $ID - optional profile id to delete
     * @param $bDeleteWithContent - delete profile with all its contents
     * @param $bForceDelete - force deletetion is case of account profile deletion
     * @return false on error, or true on success
     */
    function delete($ID = false, $bDeleteWithContent = false, $bForceDelete = false)
    {
        $ID = (int)$ID;
        if (!$ID)
            $ID = $this->_iProfileID;

        $aProfileInfo = $this->_oQuery->getInfoById($ID);
        if (!$aProfileInfo)
            return false;

        // delete system profiles (accounts) is not allowed, instead - delete whole account
        if (!$bForceDelete && 'system' == $aProfileInfo['type'])
            return false;

        // delete actual profile
        if ($sErrorMsg = BxDolService::call($aProfileInfo['type'] , 'delete_entity_service', array($aProfileInfo['content_id'], $bDeleteWithContent)))
            return false;

        // switch profile context if deleted profile is active profile context
        $oAccount = BxDolAccount::getInstance ($aProfileInfo['account_id']);
        $aAccountInfo = $oAccount->getInfo();
        if (!$bForceDelete && $ID == $aAccountInfo['profile_id'])
            $oAccount->updateProfileContextAuto($ID);

        $isStopDeletion = false;
        /**
         * @hooks
         * @hookdef hook-profile-before_delete 'profile', 'before_delete' - hook on before profile deletion
         * - $unit_name - equals `profile`
         * - $action - equals `before_delete` 
         * - $object_id - profile_id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `delete_with_content` - [bool] also delete content for profile or not
         *      - `stop_deletion` - [bool] by ref, if true then stop profile deletion, can be overridden in hook processing
         *      - `type` - [string] module name
         * @hook @ref hook-profile-before_delete
         */
        bx_alert('profile', 'before_delete', $ID, 0, array('delete_with_content' => $bDeleteWithContent, 'stop_deletion' => &$isStopDeletion, 'stop_deletion_ref' => &$isStopDeletion, 'type' => $aProfileInfo['type']));
        if ($isStopDeletion)
            return false;

        // delete associated content
        if($bDeleteWithContent) {
	        BxDolCmts::onAuthorDelete($ID);

	        BxDolReport::onAuthorDelete($ID);

	        BxDolVote::onAuthorDelete($ID);

	        BxDolFavorite::onAuthorDelete($ID);

	        BxDolView::onAuthorDelete($ID);
        }

        // delete connections
        $oConn = BxDolConnection::getObjectInstance('sys_profiles_friends');
        $oConn->onDeleteInitiatorAndContent($ID);

        $oConn = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        $oConn->onDeleteInitiatorAndContent($ID);

        // delete profile's acl levels
        BxDolAcl::getInstance()->onProfileDelete($ID);

        // delete SEO links
        BxDolPage::deleteSeoLinkByParam ('profile_id', $ID);

        // delete profile
        if (!$this->_oQuery->delete($ID))
            return false;

        /**
         * @hooks
         * @hookdef hook-profile-delete 'profile', 'delete' - hook on profile deleted
         * - $unit_name - equals `profile`
         * - $action - equals `delete` 
         * - $object_id - profile_id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `delete_with_content` - [bool] also delete content for profile or not
         *      - `type` - [string] module name
         * @hook @ref hook-profile-delete
         */
        bx_alert('profile', 'delete', $ID, 0, array('delete_with_content' => $bDeleteWithContent, 'type' => $aProfileInfo['type']));

        // unset class instance to prevent creating the instance again
        $this->_iProfileID = 0;
        $sClass = get_class($this) . '_' . $ID;
        unset($GLOBALS['bxDolClasses'][$sClass]);

        return true;
    }

    /**
     * Insert account and content id association. Also if currect profile id is not defined - it updates current profile id in account.
     * @param $iAccountId account id
     * @param $iContentId content id
     * @param $sStatus profile status
     * @param $sType profile content type
     * @return inserted profile's id
     */
    static public function add ($iAction, $iAccountId, $iContentId, $sStatus, $sType = 'system')
    {
        $oQuery = BxDolProfileQuery::getInstance();
        if (!($iProfileId = $oQuery->insertProfile ($iAccountId, $iContentId, $sStatus, $sType)))
            return false;
         /**
         * @hooks
         * @hookdef hook-profile-add 'profile', 'add' - hook on profile added
         * - $unit_name - equals `profile`
         * - $action - equals `add` 
         * - $object_id - profile_id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `module` - [string] action id
         *      - `content` - [int] content_id in module
         *      - `account` - [int] account_id
         *      - `status` - [string] status 
         *      - `action` - [int] action id
         *      - `profile_id` - [int] by ref, iprofile_id, can be overridden in hook processing
         * @hook @ref hook-profile-add
         */
        bx_alert('profile', 'add', $iProfileId, 0, array('module' => $sType, 'content' => $iContentId, 'account' => $iAccountId, 'status' => $sStatus, 'action' => $iAction, 'profile_id' => &$iProfileId, 'profile_id_ref' => &$iProfileId));
        return $iProfileId;
    }

    /**
     * Change profile status to 'Active'
     */
    public function activate($iAction, $iProfileId = 0, $bSendEmailNotification = true)
    {
        $sStatus = $this->getStatus($iProfileId);
        return $this->changeStatus(BX_PROFILE_STATUS_ACTIVE, BX_PROFILE_STATUS_PENDING == $sStatus ? 'approve' : 'activate', $iAction, $iProfileId, $bSendEmailNotification);
    }

    /**
     * Change profile status from 'Pending' to the next level - 'Active'
     */
    public function approve($iAction, $iProfileId = 0, $bSendEmailNotification = true)
    {
        return $this->changeStatus(BX_PROFILE_STATUS_ACTIVE, 'approve', $iAction, $iProfileId, $bSendEmailNotification);
    }

    /**
     * Change profile status to 'Pending'
     */
    public function disapprove($iAction, $iProfileId = 0, $bSendEmailNotification = true)
    {
        return $this->changeStatus(BX_PROFILE_STATUS_PENDING, 'disapprove', $iAction, $iProfileId, $bSendEmailNotification);
    }

    /**
     * Move profile to another account
     */
    public function move($iAccountId, $iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = $this->_iProfileID;

        if($this->getAccountId($iProfileId) == $iAccountId)
            return true;

        return $this->_oQuery->changeAccountId($iProfileId, $iAccountId) !== false;
    }

    public function doAudit($sAction, $aData = array())
    {
        bx_audit(
            $this->getContentId(), 
            $this->getModule(), 
            $sAction,  
            array('content_title' => $this->getDisplayName(), 'data' => $aData)
        );  
    }
    
    /**
     * Change profile status to 'Suspended'
     */
    public function suspend($iAction, $iProfileId = 0, $bSendEmailNotification = true)
    {
        if (!$iProfileId)
            $iProfileId = $this->_iProfileID;
        
        //moderators shouldn't be able to suspend other moderators and admins
        if (BxDolAcl::getInstance()->isMemberLevelInSet(array(MEMBERSHIP_ID_MODERATOR), bx_get_logged_profile_id()) && BxDolAcl::getInstance()->isMemberLevelInSet(array(MEMBERSHIP_ID_MODERATOR, MEMBERSHIP_ID_ADMINISTRATOR), $iProfileId))
            return false;
        
        return $this->changeStatus(BX_PROFILE_STATUS_SUSPENDED, 'suspend', $iAction, $iProfileId, $bSendEmailNotification);
    }

    protected function changeStatus($sStatus, $sAlertActionName, $iAction, $iProfileId = 0, $bSendEmailNotification = true)
    {
        if (!$iProfileId)
            $iProfileId = $this->_iProfileID;

        // get account and profile objects
        $oProfile = BxDolProfile::getInstance($iProfileId);
        $oAccount = $oProfile->getAccountObject();
        if (!$oProfile || !$oAccount)
            return false;

        // change status
        if (!$this->_oQuery->changeStatus($iProfileId, $sStatus))
            return false;

        $this->_aProfile = array();

        /**
         * @hooks
         * @hookdef hook-profile-approve 'profile', 'approve' - hook on switch profile
         * - $unit_name - equals `profile`
         * - $action - equals `approve` 
         * - $object_id - profile_id for current user
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `action` - [int] action id
         *      - `status` - [string] by ref, status, can be overridden in hook processing
         *      - `send_email_notification` - [bool] by ref, if need to send notification about changed status = true, otherwise false, can be overridden in hook processing
         * @hook @ref hook-profile-approve
         */
        bx_alert('profile', $sAlertActionName, $iProfileId, false, array(
            'action' => $iAction, 
            'status' => &$sStatus, 
            'status_ref' => &$sStatus, 
            'send_email_notification' => &$bSendEmailNotification,
            'send_email_notification_ref' => &$bSendEmailNotification
        ));
        
        $this->doAudit('_sys_audit_action_set_status_' . $sStatus);
        
        // send email to member about status change
        if ($bSendEmailNotification)
            sendMailTemplate('t_ChangeStatus' . ucfirst($sStatus), $oAccount->id(), $iProfileId, array('status' => $sStatus), BX_EMAIL_SYSTEM);

        return true;
    }

    public static function getSwitchToProfileRedirectUrl($iProfileId)
    {
        return BxDolPermalinks::getInstance()->permalink('page.php?i=account-profile-switcher', [
            'switch_to_profile' => $iProfileId, 
            'redirect' => getParam('sys_account_switch_to_profile_redirect')
        ]);
    }

    /**
     * Display informer message if it is possible to switch to this profile
     */
    public function checkSwitchToProfile($oTemplate = null, $iViewerAccountId = false, $iViewerProfileId = false)
    {
        if (false === $iViewerAccountId)
            $iViewerAccountId = getLoggedId();
        if (false === $iViewerProfileId)
            $iViewerProfileId = bx_get_logged_profile_id();

        if (!$iViewerAccountId || !$iViewerProfileId)
            return;

        $aCheck = checkActionModule($iViewerProfileId, 'switch to any profile', 'system', false);
        $bAllowSwitchToAnyProfile = $aCheck[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED;
        
        $iSwitchToAccountId = $this->getAccountId();
        $iSwitchToProfileId = $this->id();
        $bCanSwitch = ($iSwitchToAccountId == $iViewerAccountId || $bAllowSwitchToAnyProfile);
        /**
         * @hooks
         * @hookdef hook-account-check_switch_context 'account', 'check_switch_context' - hook on switch profile
         * - $unit_name - equals `account`
         * - $action - equals `check_switch_context` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `switch_to_profile` - [int] profile_id for switched profile
         *      - `viewer_account` - [int] profile_id for viewer profile
         *      - `override_result` - [bool] by ref, if allow to switch to profile = true, otherwise false, can be overridden in hook processing
         * @hook @ref hook-account-check_switch_context
         */
        bx_alert('account', 'check_switch_context', $iSwitchToAccountId, $iViewerProfileId, array('switch_to_profile' => $iSwitchToProfileId, 'viewer_account' => $iViewerAccountId, 'override_result' => &$bCanSwitch));

        if(!$bCanSwitch ||  $iViewerProfileId == $iSwitchToProfileId)
            return;

        $oInformer = BxDolInformer::getInstance($oTemplate);
        if($oInformer)
            $oInformer->add('sys-switch-profile-context', _t('_sys_txt_account_profile_context_change' . ($iSwitchToAccountId != $iViewerAccountId ? '_to_another' : '') . '_suggestion', self::getSwitchToProfileRedirectUrl($this->id())), BX_INFORMER_INFO);
    }

    /**
     * Add permament messages.
     */
    public function addInformerPermanentMessages ($oInformer)
    {
    	$aInfo = $this->getInfo();
    	$aProfiles = $this->_oQuery->getProfilesByAccount($aInfo['account_id']);

        if ($aInfo['type'] == 'system' && count($aProfiles) == 1) {
            $sUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=account-profile-switcher');
            $oInformer->add('sys-account-profile-system', _t('_sys_txt_account_profile_system'), BX_INFORMER_INFO, [
                'icon' => 'plus',
                'action_url' => $sUrl,
                'action_title' => _t('_sys_txt_account_profile_system_action'),
            ]);
        }
    }
}

/** @} */
