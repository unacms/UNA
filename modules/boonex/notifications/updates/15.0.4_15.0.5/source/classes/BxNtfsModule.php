<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Notifications Notifications
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxBaseModNotificationsModule');

define('BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS', 'obj_own_and_con');
define('BX_NTFS_TYPE_DEFAULT', BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS);

/**
 * STYPE - Setting Type:
 * 1. personal - related to you;
 * 2. follow_member - related to members you follow;
 * 3. follow_context - related to contexts you follow;
 * 4. other - others.
 */
define('BX_NTFS_STYPE_PERSONAL', 'personal');
define('BX_NTFS_STYPE_FOLLOW_MEMBER', 'follow_member');
define('BX_NTFS_STYPE_FOLLOW_CONTEXT', 'follow_context');
define('BX_NTFS_STYPE_OTHER', 'other');

/**
 * DTYPE - Delivery Type
 */
define('BX_NTFS_DTYPE_SITE', 'site');
define('BX_NTFS_DTYPE_EMAIL', 'email');
define('BX_NTFS_DTYPE_PUSH', 'push');

/**
 * SLTMODE - Silent mode:
 * It is needed for alert sending module to tell that the alert should be ignored 
 * with Notifications module completely or partially. Available values: 
 * 1. disabled (global, value = 0) - all notifications are available;
 * 2. absolute (global, value = 1) - alert isn't registered which means that there is no notifications at all;
 * 3. absolute (for Notifications only, value = 11) - the same as global absolute.
 * 3. on-site only (value = 12) - alert is registered. It means that on-site notification is available while the others are disabled.
 * 4. on-site + email (value = 13) - alert is registered (on-site) and notification via 'email' is enabled.
 * 5. on-site + push (value = 14) - alert is registered (on-site) and notification via 'push' is enabled.
 * 
 * @see BxNtfsResponse::response - 'silent_mode' parameter in Alerts Extras array.
 */
define('BX_NTFS_SLTMODE_ABSOLUTE', 11);
define('BX_NTFS_SLTMODE_SITE', 12);
define('BX_NTFS_SLTMODE_SITE_EMAIL', 13);
define('BX_NTFS_SLTMODE_SITE_PUSH', 14);

class BxNtfsModule extends BxBaseModNotificationsModule
{
    /**
     * Constructor
     */
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_iOwnerId = $this->getUserId();
    }

    /**
     * ACTION METHODS
     */
    public function actionGetAction($sType)
    {
        $aActions = $this->_oDb->getHandlerActions($sType);
        if(empty($aActions) || !is_array($aActions))
            return echoJson(['code' => 1]);

        echoJson([
            'code' => 0, 
            'content' => $this->_oTemplate->getSelectActions($aActions)
        ]);
    }

    function actionMarkAsClicked()
    {
        $iId = bx_process_input(bx_get('id'), BX_DATA_INT);
        $aEvent = $this->_oDb->getEvents(['browse' => 'id', 'value' => $iId]);
        if(empty($aEvent) || !is_array($aEvent))
            return echoJson(['code' => 1]);

        $aParams = $this->_prepareParamsGet();
        if($this->_oDb->markAsClicked($aParams['viewer_id'], $iId) === false)
            return echoJson(['code' => 2]);

        echoJson([
            'code' => 0, 
            'id' => $iId
        ]);
    }

    function actionGetPosts()
    {
        $aParams = $this->_prepareParamsGet();
        if(empty($aParams['owner_id']) || (int)$aParams['owner_id'] != $this->_iOwnerId)
            return echoJson([]);

        echoJson([
            'events' => $this->_oTemplate->getPosts($aParams)
        ]);
    }

    /**
     * SERVICE METHODS
     */

    /**
     * The Studio Dashboard's Queues block: the delivery queue, which can be emptied.
     */
    public function serviceGetDashboardQueues()
    {
        $sTable = "`" . $this->_oDb->getPrefix() . "queue`";

        return array(
            'queue' => array(
                'name' => '_bx_ntfs_queue',
                'icon' => 'bell-ring',
                'all' => "SELECT COUNT(*) FROM " . $sTable,
                'action' => "DELETE FROM " . $sTable
            )
        );
    }

    public function serviceGetSafeServices()
    {
        return [
            'GetBlockView' => '',
            'GetData' => '',
            'GetUnreadNotificationsNum' => '',
            'GetUnreadNotificationsNumEx' => '',
            'MarkAsRead' => '',
            'EnableSetting' => '',
            'ChangeSetting' => '',
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_notifications Invitations
     * @subsection bx_notifications-other Other
     * @subsubsection bx_notifications-get_include get_include
     * 
     * @code bx_srv('bx_notifications', 'get_include', [...]); @endcode
     * 
     * Get all necessary CSS and JS files to include in a page.
     *
     * @return string with all necessary CSS and JS files.
     * 
     * @see BxInvModule::serviceGetInclude
     */
    /** 
     * @ref bx_notifications-get_include "get_include"
     */
    public function serviceGetInclude($bIncludeCss = true, $mixedIncludeJs = false)
    {
        return $this->_oTemplate->getInclude($bIncludeCss, $mixedIncludeJs);
    }

    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-page_blocks Page Blocks
     * @subsubsection bx_notifications-get_block_settings get_block_settings
     * 
     * @code bx_srv('bx_notifications', 'get_block_settings', [...]); @endcode
     * 
     * Get Settings block for a separate page.
     *
     * @return a string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxNtfsModule::serviceGetBlockSettings
     */
    /** 
     * @ref bx_notifications-get_block_settings "get_block_settings"
     */
    public function serviceGetBlockSettings($sDeliveryType = '', $aParams = array())
    {
        if(!isLogged())
            return '';

        if(empty($sDeliveryType) && bx_get('delivery') !== false)
            $sDeliveryType = bx_process_input(bx_get('delivery'));

        if(empty($sDeliveryType))
            $sDeliveryType = BX_BASE_MOD_NTFS_DTYPE_SITE;

        $iUserId = bx_get_logged_profile_id();
        if(!empty($aParams['user_id']))
            $iUserId = (int)$aParams['user_id'];
        else
            $aParams['user_id'] = $iUserId;

        $this->_oDb->initSettingUser($iUserId);

        return array(
            'content' => $this->getBlockSettings($sDeliveryType, $aParams),
        );
    }

    
    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-page_blocks Page Blocks
     * @subsubsection bx_notifications-get_data get_data
     * 
     * @code bx_srv('bx_notifications', 'get_data', [...]); @endcode
     * 
     * Get data for app
     *
     * @return an array .
     * 
     * @see BxNtfsModule::serviceGetData
     */
     /** 
     * @ref bx_notifications-get_data "get_data"
     * @api @ref bx_notifications-get_data "get_data"
     */
    public function serviceGetData($aParams)
    {
        if(is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams, true);

        return call_user_func_array([$this, 'serviceGetBlockView'], [
            isset($aParams['type']) ? $aParams['type'] : '',
            isset($aParams['start']) ? (int)$aParams['start'] : -1,
            isset($aParams['per_page']) ? (int)$aParams['per_page'] : -1,
            isset($aParams['modules']) ? $aParams['modules'] : [],
        ]);
    }
    
    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-page_blocks Page Blocks
     * @subsubsection bx_notifications-get_block_view get_block_view
     * 
     * @code bx_srv('bx_notifications', 'get_block_view', [...]); @endcode
     * 
     * Get View block for a separate page. Will return a block with "Empty" message if nothing found.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxNtfsModule::serviceGetBlockView
     */
    /** 
     * @ref bx_notifications-get_block_view "get_block_view"
     */
    public function serviceGetBlockView($sType = '', $iStart = -1, $iPerPage = -1, $aModules = [])
    {
    	$aBrowseTypes = [BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS, BX_BASE_MOD_NTFS_TYPE_CONNECTIONS, BX_BASE_MOD_NTFS_TYPE_OBJECT_OWNER];

    	if(empty($sType)) {
            $mixedType = bx_get('type');
            if($mixedType !== false && in_array($mixedType, $aBrowseTypes))
                $sType = $mixedType;

            if(empty($sType))
                $sType = BX_NTFS_TYPE_DEFAULT;
    	}

    	$iOwnerId = $this->getUserId();
        if(!$iOwnerId) {
            $sResult = _t('_bx_ntfs_txt_msg_no_results');
            return $this->_bIsApi ? [bx_api_get_msg($sResult)] : ['content' => MsgBox($sResult)];
        }

        $aParams = $this->_prepareParams($sType, $iOwnerId, $iStart, $iPerPage, $aModules);

        if($this->_bIsApi) {
            $aParams['start_from_item'] = true;

            $aContent = defined('BX_API_PAGE') ? [] : $this->_oTemplate->getPosts($aParams);
            if(!empty($aContent) && is_array($aContent)) {
                $iContent = count($aContent);
                if($iContent > $aParams['per_page'])
                    $aContent = array_slice($aContent, 0, -($iContent - $aParams['per_page']));

                $aParams['start'] = end($aContent)['id'];
            }

            //if($aParams['start'] == 0)
            //    $this->markAsRead($iOwnerId, $aParams);

            return [bx_api_get_block('browse', [
                'unit' => 'notifications',  
                'request_url' => '/api.php?r=bx_notifications/get_data/&params[]=',
                'params' => $aParams,
                'id' => $iOwnerId,
                'data' => $aContent]),
            ];
        }

        $sContent = $this->_oTemplate->getViewBlock($aParams);

        $this->markAsRead($iOwnerId, $aParams);

        return ['content' => $sContent]; 
    }

    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-browsing Browsing
     * @subsubsection bx_notifications-get_event_by_id get_event_by_id
     * 
     * @code bx_srv('bx_notifications', 'get_event_by_id', [...]); @endcode
     * 
     * Get event's data by event ID.
     *
     * @return an array with event's data.
     * 
     * @see BxNtfsModule::serviceGetEventById
     */
    /** 
     * @ref bx_notifications-get_event_by_id "get_event_by_id"
     */
    public function serviceGetEventById($iId)
    {
        $aParams = array(
            'browse' => 'id',
            'value' => $iId,
        );
    	return $this->_oDb->getEvents($aParams);
    }

    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-other Other
     * @subsubsection bx_notifications-get_notifications get_notifications
     * 
     * @code bx_srv('bx_notifications', 'get_notifications', [...]); @endcode
     * 
     * Get notifications by params.
     *
     * @return array with notifications.
     * 
     * @see BxNtfsModule::serviceGetNotifications
     */
    /** 
     * @ref bx_notifications-get_notifications "get_notifications"
     */
    public function serviceGetNotifications($iOwnerId = 0, $aBrowseParams = array())
    {
        if(!$iOwnerId)
            $iOwnerId = $this->getUserId();

        if(!$iOwnerId)
            return 0;

        $aParams = $this->_prepareParams(BX_NTFS_TYPE_DEFAULT, $iOwnerId);
        if(!empty($aBrowseParams) && is_array($aBrowseParams))
            $aParams = array_merge($aParams, $aBrowseParams);

        $aEvents = $this->_oDb->getEvents($aParams);

        if($this->_oConfig->isEventsGrouped())
            $this->groupEvents($aEvents);

        // returns parsed content for React Jot
        if (!is_array($aBrowseParams) && $aBrowseParams === 'return_parsed_content')
            foreach ($aEvents as &$aContent)
                $this->_oTemplate->getPost($aContent, array('return_parsed_content'));

        return $aEvents;
    }

    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-other Other
     * @subsubsection bx_notifications-get_unread_notifications get_unread_notifications
     * 
     * @code bx_srv('bx_notifications', 'get_unread_notifications', [...]); @endcode
     * 
     * Get unread notifications.
     *
     * @return array with unread notifications.
     * 
     * @see BxNtfsModule::serviceGetUnreadNotifications
     */
    /** 
     * @ref bx_notifications-get_unread_notifications "get_unread_notifications"
     */
    public function serviceGetUnreadNotifications($iOwnerId = 0)
    {
        return $this->serviceGetNotifications($iOwnerId, array('new' => 1));
    }

    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-other Other
     * @subsubsection bx_notifications-get_unread_notifications_num get_unread_notifications_num
     * 
     * @code bx_srv('bx_notifications', 'get_unread_notifications_num', [...]); @endcode
     * 
     * Get number of unread notifications.
     *
     * @return integer value with number of unread notifications.
     * 
     * @see BxNtfsModule::serviceGetUnreadNotificationsNum
     */
    /** 
     * @ref bx_notifications-get_unread_notifications_num "get_unread_notifications_num"
     */
    public function serviceGetUnreadNotificationsNum($iOwnerId = 0)
    {
        if(!$iOwnerId)
            $iOwnerId = $this->getUserId();

        if(!$iOwnerId)
            return 0;

        $sModule = $this->_oConfig->getName();
        $aBrowseParams = $this->_prepareParams(BX_NTFS_TYPE_DEFAULT, $iOwnerId, 0, PHP_INT_MAX);

        $sParamCheck = 'perform_privacy_check';
        $sParamCheckFor = 'perform_privacy_check_for';

        $iEvents = 0;
        if($this->_oConfig->isEventsGrouped()) {
            $aEvents = $this->_oDb->getEvents($aBrowseParams);

            $this->groupEvents($aEvents);

            $iCount = 0;
            $iLastRead = $this->_oDb->getLastRead((int)$aBrowseParams['owner_id']);
            foreach($aEvents as $aEvent)
                if($aEvent['id'] > $iLastRead)
                    $iCount++;

            $aEvents = array_slice($aEvents, 0, $iCount);
        }
        else {
            $aBrowseParams = array_merge($aBrowseParams, [
                'new' => 1,
            ]);

            $aEvents = $this->_oDb->getEvents($aBrowseParams);
        }

        foreach($aEvents as $aEvent) {
            if(isset($aBrowseParams[$sParamCheck]) && $aBrowseParams[$sParamCheck] !== true) 
                continue;

            $iViewerId = !empty($aBrowseParams[$sParamCheckFor]) ? (int)$aBrowseParams[$sParamCheckFor] : 0;

            $oPrivacyInt = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'));
            if(!$oPrivacyInt->check($aEvent['id'], $iViewerId))
                continue;

            $oPrivacyExt = $this->_oConfig->getPrivacyObject($aEvent['type'] . '_' . $aEvent['action']);
            if($oPrivacyExt !== false && !$oPrivacyExt->check($aEvent['id'], $iViewerId))
                continue;

            $iContentObjectId = $this->_oConfig->getContentObjectId($aEvent);
            if($iContentObjectId === false) {
                $this->_oTemplate->getPost($aEvent, $aBrowseParams);
                $iContentObjectId = $this->_oConfig->getContentObjectId($aEvent);
            }

            $sSrvModule = $this->_oConfig->getContentModule($aEvent);
            $sSrvMethod = 'check_allowed_with_content_for_profile';
            if($sSrvModule && bx_is_srv($sSrvModule, $sSrvMethod) && bx_srv($sSrvModule, $sSrvMethod, ['view', $iContentObjectId, $iViewerId]) !== CHECK_ACTION_RESULT_ALLOWED)
                continue;

            $bEventCanceled = false;
            
            /**
             * @hooks
             * @hookdef hook-bx_notifications-is_notification 'bx_notifications', 'is_notification' - hook to override checking if an event is available or not
             * - $unit_name - equals `bx_notifications`
             * - $action - equals `is_notification`
             * - $object_id - not used
             * - $sender_id - not used
             * - $extra_params - array of additional params with the following array keys:
             *      - `browse_params` - [array] browse params array as key&value pairs
             *      - `event` - [array] by ref, array with event data as key&value pairs, can be overridden in hook processing
             *      - `event_canceled` - [boolean] by ref, if event is canceled (not available) or not, can be overridden in hook processing
             * @hook @ref hook-bx_notifications-is_notification
             */
            bx_alert($sModule, 'is_notification', 0, 0, [
                'browse_params' => $aBrowseParams,
                'event' => &$aEvent, 
                'event_canceled' => &$bEventCanceled,
                'event_ref' => &$aEvent, 
                'event_canceled_ref' => &$bEventCanceled
            ]);

            if($bEventCanceled)
                continue;

            $iEvents++;
        }

        return $iEvents;
    }
    
    public function serviceGetUnreadNotificationsNumEx($iOwnerId, $iCount)
    {
         header('Content-Type: text/event-stream');
         header('Cache-Control: no-cache');
         $iTmp = $this->serviceGetUnreadNotificationsNum($iOwnerId);
         if ($iCount != $iTmp){
             $time = date('r');
             echo "id: " . time() . "\n";
             echo "data: $iTmp\n\n";
             flush();
         }
         exit();
            
     }

    /**
     * @page service Service Calls
     * @section bx_notifications Notifications
     * @subsection bx_notifications-other Other
     * @subsubsection bx_notifications-get_live_updates get_live_updates
     * 
     * @code bx_srv('bx_notifications', 'get_live_updates', [...]); @endcode
     * 
     * Get data for Live Updates system.
     *
     * @return an array with special format.
     * 
     * @see BxNtfsModule::serviceGetLiveUpdates
     */
    /** 
     * @ref bx_notifications-get_live_updates "get_live_updates"
     */
    public function serviceGetLiveUpdates($aMenuItemParent, $aMenuItemChild, $iCount = 0)
    {
        $iOwnerId = $this->getUserId();
        $iCountNew = $this->serviceGetUnreadNotificationsNum($iOwnerId);
        if($iCountNew == $iCount)
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

    /*
     * COMMON METHODS
     */
    public function getBlockSettings($sDeliveryType, $aParams = array())
    {
        return $this->_oTemplate->getSettingsBlock($sDeliveryType, $aParams);
    }

    public function setSubmenu($sSelected)
    {
    	$oSubmenuSystem = BxDolMenu::getObjectInstance('sys_site_submenu');
        if(!$oSubmenuSystem)
            return;

        $CNF = &$this->_oConfig->CNF;

        $oSubmenuSystem->setObjectSubmenu($CNF['OBJECT_MENU_SUBMENU'], array (
            'title' => _t('_bx_ntfs'),
            'link' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME'])),
            'icon' => '',
        ));

        $oSubmenuModule = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_SUBMENU']);
        if($oSubmenuModule)
            $oSubmenuModule->setSelected($this->_oConfig->getName(), $sSelected);
    }

    public function onPost($iId)
    {
    	//--- Event -> Post for Alerts Engine ---//
        $oAlert = new BxDolAlerts($this->_oConfig->getObject('alert'), 'post', $iId);
        $oAlert->alert();
        //--- Event -> Post for Alerts Engine ---//
    }

    public function enableSettingsLike($iId, $bValue, $bAdministration = false)
    {
        return $this->_changeSettingsLike($iId, 'activate', [$bValue], $bAdministration);
    }

    public function changeSettingsValueLike($iId, $sField, $mixedValue, $bAdministration = false)
    {
        return $this->_changeSettingsLike($iId, 'change', [$sField, $mixedValue], $bAdministration);
    }

    public function sendNotificationEmail($iProfile, $aNotification)
    {
        if(!$iProfile)
            return false;

        $aSettings = &$aNotification['settings'];

        $sTemplate = !empty($aSettings['template']) ? $aSettings['template'] : 'bx_notifications_new_event';
        $aTemplateMarkers = [
            'subject' => !empty($aNotification['subject']) ? $aNotification['subject'] : _t('_bx_ntfs_txt_new_event_subject', getParam('site_title')),
            'content' => $aNotification['content']
        ];
        if(!empty($aSettings['markers']) && is_array($aSettings['markers']))
            $aTemplateMarkers = array_merge($aTemplateMarkers, $aSettings['markers']);              

        $aTemplate = null;
        /**
         * @hooks
         * @hookdef hook-bx_notifications-before_parse_email_template 'bx_notifications', 'before_parse_email_template' - hook to override email template
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `before_parse_email_template`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile_id` - [int] recipient profile id
         *      - `template` - [string] email template name
         *      - `markers` - [array] parsable variables array as key&value pairs
         *      - `notification` - [array] notification data array as key&value pairs
         *      - `override_result` - [array] by ref, email template (subject and body), if null, then default one will be used, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-before_parse_email_template
         */
        bx_alert($this->_aModule['name'], 'before_parse_email_template', 0, 0, [
            'profile_id' => $iProfile, 
            'template' => $sTemplate, 
            'markers' => $aTemplateMarkers, 
            'notification' => $aNotification, 
            'override_result' => &$aTemplate
        ]);
        if(is_null($aTemplate))
            $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($sTemplate, $aTemplateMarkers, 0, $iProfile);
        if(!$aTemplate)
            return false;

        $sEmail = BxDolProfileQuery::getInstance()->getEmailById($iProfile);
        $sSubject = !empty($aSettings['subject']) ? $aSettings['subject'] : $aTemplate['Subject'];
        return sendMail($sEmail, $sSubject, $aTemplate['Body'], $iProfile, array(), BX_EMAIL_NOTIFY, 'html', false, array(), true);
    }

    public function sendNotificationPush($iProfile, $aNotification)
    {
        if(!$iProfile)
            return false;
        
        $oPush = BxDolPush::getObjectInstance();
        if(!$oPush)
            return false;
        

        $aContent = &$aNotification['content'];
        $aSettings = &$aNotification['settings'];
        
        /**
         * @hooks
         * @hookdef hook-bx_notifications-before_send_notification_push 'bx_notifications', 'before_send_notification_push' - hook to override push message
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `before_send_notification_push`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile_id` - [int] recipient profile id
         *      - `content` - [array] by ref, push message params array as key&value pairs, can be overridden in hook processing
         *      - `setting` - [array] by ref, push settings array as key&value pairs, can be overridden in hook processing
         *      - `subject` - [string] by ref, push message subject, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-before_send_notification_push
         */
        bx_alert($this->_aModule['name'], 'before_send_notification_push', 0, 0, [
            'profile_id' => $iProfile, 

            'content' => &$aContent, 
            'setting' => &$aSettings, 
            'subject' => &$sSubject,

            'content_ref' => &$aContent, 
            'setting_ref' => &$aSettings, 
            'subject_ref' => &$sSubject,
        ]);
        
        if (!$aContent)
            return false;

        $sSubject = !empty($aSettings['subject']) ? $aSettings['subject'] : _t('_bx_ntfs_txt_new_event_subject', getParam('site_title'));

        return $oPush->send($iProfile, [
            'contents' => [
                'en' => $aContent['message']
            ],
            'headings' => [
                'en' => $sSubject
            ],
            'url' => $aContent['url'],
            'icon' => $aContent['icon']
        ], true);
    }

    public function groupEvents(&$aEvents)
    {
        //--- Check for Visual Grouping
        $aGroups = [];
        foreach($aEvents as $iIndex => $aEvent) {
            if(empty($aEvent['source']))
                continue;

            $sSource = $aEvent['source'];
            if(!isset($aGroups[$sSource]))
               $aGroups[$sSource] = [];

            $aGroups[$sSource][$iIndex] = $aEvent['priority'];
        }

        //--- Perform Visual Grouping
        foreach($aGroups as $sSource => $aGroup) {
            if(!is_array($aGroup) || count($aGroup) < 2)
                continue;

            arsort($aGroup);
            $iPriorityMax = reset($aGroup);

            foreach($aGroup as $iIndex => $iPriority)
                if($iPriority != $iPriorityMax)
                    unset($aEvents[$iIndex]);
        }
    }
    
    public function serviceMarkAsRead()
    {
        $iOwnerId = bx_get_logged_profile_id();
        $aParams = $this->_prepareParams(BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS, $iOwnerId);
        $this->markAsRead($iOwnerId, $aParams);
    }

    public function markAsRead($iOwnerId, $aParams)
    {
        $aParams['browse'] = 'first';
    	$aEvent = $this->_oDb->getEvents($aParams);
    	if(empty($aEvent) || !is_array($aEvent))
            return false;

        return $this->_oDb->markAsRead($iOwnerId, $aEvent['id']) !== false;
    }

    public function serviceEnableSetting($mixedParams)
    {
        if(!is_array($mixedParams))
            $mixedParams = json_decode($mixedParams, true);

        if(!isset($mixedParams['id'], $mixedParams['value']))
            return false;

        $iId = (int)$mixedParams['id'];
        $iValue = (int)$mixedParams['value'];
        $bAdministration = isset($mixedParams['admin']) && $mixedParams['admin'];

        if(!$this->_oConfig->isSettingsGrouped())
            $mixedResult = $this->_oDb->updateSetting(['active' => $iValue], ['id' => $iId]);
        else 
            $mixedResult = $this->enableSettingsLike($iId, $iValue, $bAdministration);

        return $mixedResult !== false;
    }
            
    public function serviceChangeSetting($mixedParams)
    {
        if(!is_array($mixedParams))
            $mixedParams = json_decode($mixedParams, true);

        if(!isset($mixedParams['id'], $mixedParams['value']))
            return false;

        $iId = (int)$mixedParams['id'];
        $iValue = (int)$mixedParams['value'];

        if(!$this->_oConfig->isSettingsGrouped())
            $mixedResult = $this->_oDb->updateSetting(['value' => $iValue], ['id' => $iId]);
        else 
            $mixedResult = $this->changeSettingsValueLike($iId, 'value', $iValue, true);

        return $mixedResult !== false;
    }

    /*
     * INTERNAL METHODS
     */
    protected function _changeSettingsLike($iId, $sAction, $aArgs, $bAdministration = false)
    {
        $aSetting = $this->_oDb->getSetting(array(
            'by' => $bAdministration ? 'id' : 'tsu_id', 
            'id' => (int)$iId
        ));
        if(empty($aSetting) || !is_array($aSetting))
            return false;

        $aSettingsIds = $this->_oDb->getSetting(array(
            'by' => 'group_type_delivery', 
            'group' => $aSetting['group'], 
            'delivery' => $aSetting['delivery'], 
            'type' => $aSetting['type'], 
            'active' => !$bAdministration
        ));
        if(empty($aSettingsIds) || !is_array($aSettingsIds))
            return false;

        $sMethod = $sAction . 'SettingById' . (!$bAdministration ? 'User' : '');

        if(!$bAdministration)
            $aArgs[] = bx_get_logged_profile_id();
        $aArgs[] = $aSettingsIds;

        return call_user_func_array([$this->_oDb, $sMethod], $aArgs);
    }

    protected function _prepareParams($sType = '', $iOwnerId = 0, $iStart = -1, $iPerPage = -1, $aModules = [])
    {
        $iUserId = $this->getUserId();
        $iOwnerId = (int)$iOwnerId != 0 ? $iOwnerId : $iUserId;

        $aParams = [
            'browse' => 'list',
            'type' => !empty($sType) ? $sType : BX_NTFS_TYPE_DEFAULT,
            'owner_id' => $iOwnerId,
            'start' => (int)$iStart > 0 ? $iStart : 0,
            'start_from_item' => false,
            'per_page' => (int)$iPerPage > 0 ? $iPerPage : $this->_oConfig->getPerPage(),
            'modules' => is_array($aModules) && !empty($aModules) ? $aModules : [],
            'last_read' => $this->_oDb->getLastRead($iOwnerId),
            'viewer_id' => $iUserId,
            'active' => 1
        ];

        return $aParams;
    }

    protected function _prepareParamsGet()
    {
        $aParams = [];
        $aParams['browse'] = 'list';

        $sType = bx_get('type');
        $aParams['type'] = $sType !== false ? bx_process_input($sType, BX_DATA_TEXT) : BX_NTFS_TYPE_DEFAULT;

        $aParams['owner_id'] = $sType !== false ? bx_process_input(bx_get('owner_id'), BX_DATA_INT) : $this->getUserId();

        $iStart = bx_get('start');
        $aParams['start'] = $iStart !== false ? bx_process_input($iStart, BX_DATA_INT) : 0;
        $aParams['start_from_item'] = false;

        $iPerPage = bx_get('per_page');
        $aParams['per_page'] = $iPerPage !== false ? bx_process_input($iPerPage, BX_DATA_INT) : $this->_oConfig->getPerPage();

        $aModules = bx_get('modules');
        $aParams['modules'] = $aModules !== false ? bx_process_input($aModules, BX_DATA_TEXT) : [];

        $iViewerId = $this->getUserId();
        if(($aParams['viewer_id'] = bx_get('viewer_id')) !== false)
            $aParams['viewer_id'] = bx_process_input($aParams['viewer_id'], BX_DATA_INT);
        if(!$aParams['viewer_id'] || $aParams['viewer_id'] != $iViewerId)
            $aParams['viewer_id'] = $iViewerId;

        $aParams['active'] = 1;

        return $aParams;
    }
}

/** @} */
