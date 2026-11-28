<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolPush extends BxDolFactoryObject
{
    protected $_sEndpoint;
    protected $_sAppId;

    protected $_sApiUrlRootPush;
    protected $_sApiUrlRootEmail;

    protected function __construct($aObject, $oTemplate = null, $sDbClassName = 'BxDolPushQuery')
    {
        parent::__construct($aObject, $oTemplate, $sDbClassName);

        $this->_sEndpoint = '';
        $this->_sAppId = '';

        $this->_sApiUrlRootEmail = $this->_getUrlRoot('email');
        $this->_sApiUrlRootPush = $this->_getUrlRoot('push');
    }

    /**
     * Get Push Notification provider object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject = false, $oTemplate = false)
    {
        if(!$sObject)
            $sObject = getParam('sys_push_default');
        if(!$sObject)
            return false;

        return parent::getObjectInstanceByClassNames($sObject, $oTemplate, 'BxDolPush', 'BxDolPushQuery');
    }

    /**
     * Get tags to send to PUSH server
     * @param $iProfileId - profile ID
     * @return array of tags
     */
    public static function getTags($iProfileId = false)
    {
        if (false === $iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $oProfile = BxDolProfile::getInstance($iProfileId);
        $oAccount = $oProfile ? $oProfile->getAccountObject() : null;
        if (!$oProfile || !$oAccount)
            return false;

        $oPush = self::getObjectInstance();
        if (!$oPush)
            return false;

        $sEmail = $oAccount->getEmail();
        $a = [
            'user_hash' => encryptUserId($iProfileId),
            'real_name' => $oProfile->getDisplayName(),
            'email' => $sEmail,
            'email_hash' => $sEmail ? hash_hmac('sha256', $sEmail, $oPush->getAppId()) : '',
        ];

         /**
         * @hooks
         * @hookdef hook-system-is_confirmed 'system', 'push_tags' - hook on get tags to send to PUSH server
         * - $unit_name - equals `system`
         * - $action - equals `push_tags` 
         * - $object_id - profile_id from current user
         * - $sender_id - profile_id from current user
         * - $extra_params - array of additional params with the following array keys:
         *      - `tags` - [array] by ref, array of tags, can be overridden in hook processing
         * @hook @ref hook-system-push_tags
         */
        bx_alert('system', 'push_tags', $iProfileId, $iProfileId, [
            'tags' => &$a, 
            'tags_ref' => &$a
        ]);

        return $a;
    }

    /**
     * @param $a - array to fill with notification counter per module
     * @return total number of notifications
     */
    public static function getNotificationsCount($iProfileId = 0, &$aBubbles = null)
    {    
        if ('' != trim(getParam('sys_api_url_root_push'))) {
             return bx_srv('bx_notifications', 'get_unread_notifications_num', [$iProfileId]);
        }   
        
        $iMemberIdCookie = null;
        $bLoggedMemberGlobals = null;
        if ($iProfileId && $iProfileId != bx_get_logged_profile_id()) {
            if (getLoggedId())
                $iMemberIdCookie = getLoggedId();
            if (!empty($GLOBALS['logged']['member']))
                $bLoggedMemberGlobals = $GLOBALS['logged']['member'];
            $oProfile = BxDolProfile::getInstance($iProfileId);
            $_COOKIE['memberID'] = $oProfile ? $oProfile->getAccountId() : 0;
            $GLOBALS['logged']['member'] = $oProfile ? true : false;
        }
    
        $aMenusObjects = array('sys_account_notifications', 'sys_toolbar_member');
        foreach ($aMenusObjects as $sMenuObject) {
            if ($iProfileId && $iProfileId != bx_get_logged_profile_id())
                unset($GLOBALS['bxDolClasses']['BxDolMenu!sys_account_notifications']);
            $oMenu = BxDolMenu::getObjectInstance($sMenuObject);
            if ($iProfileId && $iProfileId != bx_get_logged_profile_id())
                unset($GLOBALS['bxDolClasses']['BxDolMenu!sys_account_notifications']);

            $bSave = $oMenu->setDisplayAddons(true);
            $a = $oMenu->getMenuItems();
            $iBubbles = 0;
            foreach ($a as $r) {
                if (!$r['bx_if:addon']['condition'])
                    continue;
                if (null !== $aBubbles)
                    $aBubbles[$r['name']] = $r['bx_if:addon']['content']['addon'];
                $iBubbles += $r['bx_if:addon']['content']['addon'];
            }
        }

        if ($iProfileId && $iProfileId != bx_get_logged_profile_id()) {
            if (null === $iMemberIdCookie)
                unset($_COOKIE['memberID']);
            else
                $_COOKIE['memberID'] = $iMemberIdCookie;

            if (null === $bLoggedMemberGlobals)
                unset($GLOBALS['logged']['member']);
            else
                $GLOBALS['logged']['member'] = $bLoggedMemberGlobals;
        }

        return $iBubbles;
    }

    public function getAppId()
    {
        return $this->_sAppId;
    }

    public function getCode($sFor = '')
    {
        if($sFor && ($sMethod = '_getCode' . bx_gen_method_name($sFor)) && method_exists($this, $sMethod))
            return $this->$sMethod();

        return '';
    }

    public function send($iProfileId, $aMessage, $bAddToQueue = false) {}

    protected function _getUrlRoot($sType)
    {
        $sRootUrl = getParam('sys_api_url_root_' . $sType);
        if(!$sRootUrl)
            return false;
            
        if(substr(BX_DOL_URL_ROOT, -1) == '/' && substr($sRootUrl, -1) != '/')
            $sRootUrl .= '/';

        return $sRootUrl;
    }
}

/** @} */
