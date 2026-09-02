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

bx_import('BxDolPrivacy');

class BxNtfsConfig extends BxBaseModNotificationsConfig
{
    protected $_iSummaryMaxLen;
    protected $_iOwnerNameMaxLen;
    protected $_iContentMaxLen;
    protected $_iPushMaxLen;
    protected $_iEmailSubjectMaxLen;

    protected $_aHandlersHiddenEmail;
    protected $_aHandlersHiddenPush;

    /**
     * Group settings by action. Enabled by default.
     */
    protected $_bSettingsGrouped;
    protected $_aSettingsTypes;
    protected $_aDeliveryTypes;

    protected $_aModulesProfiles;
    protected $_aModulesContexts;

    protected $_iDeliveryTimeout;

    protected $_bEventsGrouped;
    protected $_bEventsGroupedDb;

    protected $_bClickedIndicator;

    /**
     * Constructor
     */
    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = [
            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'events',

            // database fields
            'FIELD_ID' => 'id',

            // page URIs
            'URL_HOME' => 'page.php?i=notifications-view',

            // some params
            'PARAM_QUEUE_ADD_THRESHOLD' => 'bx_notifications_queue_add_threshold',
            'PARAM_QUEUE_ADD_LIMIT' => 'bx_notifications_queue_add_limit',
            'PARAM_COMMENT_POST_EXT' => 'bx_notifications_enable_comment_post_ext',
            'PARAM_REPLY_AS_COMMENT' => 'bx_notifications_enable_reply_as_comment',
            'PARAM_PROCESSED_EVENT' => 'bx_notifications_processed_event',

            // objects
            'OBJECT_FORM_ETEMPLATE' => 'bx_notifications_etemplate',
            'OBJECT_FORM_ETEMPLATE_DISPLAY_ADD' => 'bx_notifications_etemplate_add',
            'OBJECT_FORM_ETEMPLATE_DISPLAY_EDIT' => 'bx_notifications_etemplate_edit',
            'OBJECT_MENU_SUBMENU' => 'bx_notifications_submenu', // main module submenu
            'OBJECT_MENU_SETTINGS' => 'bx_notifications_settings', // settings submenu
            'OBJECT_GRID_SETTINGS_ADMINISTRATION' => 'bx_notifications_settings_administration',
            'OBJECT_GRID_SETTINGS_COMMON' => 'bx_notifications_settings_common',
            'OBJECT_GRID_ETEMPLATES' => 'bx_notifications_etemplates',

            // some language keys
            'T' => [
                'setting_personal' => '_bx_ntfs_setting_type_personal',
                'setting_follow_member' => '_bx_ntfs_setting_type_follow_member',
                'setting_follow_context' => '_bx_ntfs_setting_type_follow_context',
                'setting_other' => '_bx_ntfs_setting_type_other',
            ]
        ];

        $this->_aPrefixes = array(
            'style' => 'bx-ntfs',
            'language' => '_bx_ntfs',
            'option' => 'bx_notifications_'
        );

        $this->_iSummaryMaxLen = 0;
        $this->_iOwnerNameMaxLen = 0;
        $this->_iContentMaxLen = 0;
        $this->_iEmailSubjectMaxLen = 0;
        $this->_iPushMaxLen = 0;

        $this->_aHandlerDescriptor = array('module_name' => '', 'module_method' => '', 'module_class' => '');
        $this->_sHandlersMethod = 'get_notifications_data';
        $this->_aHandlersHiddenEmail = array();
        $this->_aHandlersHiddenPush = array();

        $this->_bSettingsGrouped = true;
        $this->_aSettingsTypes = array(
            BX_NTFS_STYPE_PERSONAL,
            BX_NTFS_STYPE_FOLLOW_MEMBER,
            BX_NTFS_STYPE_FOLLOW_CONTEXT,
            //BX_NTFS_STYPE_OTHER           //TODO: May be it can be removed, because there is no events(alerts) for this type.
        );

        $this->_aDeliveryTypes = [
            BX_NTFS_DTYPE_SITE,
            BX_NTFS_DTYPE_EMAIL,
            BX_NTFS_DTYPE_PUSH
        ];

        $this->_aModulesProfiles = false;
        $this->_aModulesContexts = false;

        $this->_aJsClasses = array(
            'main' => 'BxNtfsMain',
            'view' => 'BxNtfsView',
        );
        $this->_aJsObjects = array(
            'main' => 'oBxNtfsMain',
            'view' => 'oBxNtfsView',
        );

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = [
            'main' => [
                'field_action' => $sHtmlPrefix . '-field-action',
            ],
            'view' => [
                'block' => $sHtmlPrefix,
                'events' => $sHtmlPrefix . '-events',
                'event' => $sHtmlPrefix . '-event-',
                'add_etemplate_popup' => $sHtmlPrefix . '-etemplate-add',
                'edit_etemplate_popup' => $sHtmlPrefix . '-etemplate-edit',
                'preview_etemplate_popup' => $sHtmlPrefix . '-etemplate-preview',
            ]
        ];
    }

    public function init(&$oDb)
    {
    	parent::init($oDb);

    	$sOptionPrefix = $this->getPrefix('option');
    	$this->_aPerPage = array(
            'default' => (int)getParam($sOptionPrefix . 'events_per_page'),
    	    'preview' => (int)getParam($sOptionPrefix . 'events_per_preview')
    	);

        $this->_bSettingsGrouped = getParam($sOptionPrefix . 'enable_group_settings') == 'on';

    	$aSettings = array(
    	    'site' => '',
    	    'email' => 'Email',
    	    'push' => 'Push'
    	);
    	foreach($aSettings as $sSetting => $sVariable) {
    	    $sHideTimeline = getParam($sOptionPrefix . 'events_hide_' . $sSetting);
            if(!empty($sHideTimeline))
                $this->{'_aHandlersHidden' . $sVariable} = explode(',', $sHideTimeline);
    	}

        $this->_iDeliveryTimeout = (int)getParam($sOptionPrefix . 'delivery_timeout');

        $this->_bEventsGrouped = getParam($sOptionPrefix . 'enable_group_events') == 'on';
        $this->_bEventsGroupedDb = false;

        $this->_bClickedIndicator = getParam($sOptionPrefix . 'enable_clicked_indicator') == 'on';

        $this->_iSummaryMaxLen = (int)getParam($sOptionPrefix . 'summary_chars');
        $this->_iOwnerNameMaxLen = (int)getParam($sOptionPrefix . 'owner_name_chars');
        $this->_iContentMaxLen = (int)getParam($sOptionPrefix . 'content_chars');
        $this->_iEmailSubjectMaxLen = (int)getParam($sOptionPrefix . 'email_subject_chars');
        $this->_iPushMaxLen = (int)getParam($sOptionPrefix . 'push_message_chars');
    }

    public function getSummaryMaxLen()
    {
        return $this->_iSummaryMaxLen;
    }

    public function getOwnerNameMaxLen()
    {
        return $this->_iOwnerNameMaxLen;
    }

    public function getContentMaxLen()
    {
        return $this->_iContentMaxLen;
    }

    public function getPushMaxLen()
    {
        return $this->_iPushMaxLen;
    }

    public function getEmailSubjectMaxLen()
    {
        return $this->_iEmailSubjectMaxLen;
    }

    public function getHandlersHidden($sType = '')
    {
        if(!in_array($sType, array('', 'email', 'push')))
            return array();

        return $this->{'_aHandlersHidden' . ucfirst($sType)};
    }

    public function isSettingsGrouped()
    {
        return $this->_bSettingsGrouped;
    }

    public function getSettingsTypes()
    {
        return $this->_aSettingsTypes;
    }
    
    public function getDeliveryTypes()
    {
        return $this->_aDeliveryTypes;
    }

    public function getDeliveryTimeout()
    {
        return $this->_iDeliveryTimeout;
    }

    public function isEventsGrouped()
    {
        return $this->_bEventsGrouped;
    }

    public function isEventsGroupedDb()
    {
        return $this->_bEventsGroupedDb;
    }

    public function isClickedIndicator()
    {
        return $this->_bClickedIndicator;
    }

    public function getProcessedEvent()
    {
        return (int)getParam($this->CNF['PARAM_PROCESSED_EVENT'], false);
    }

    public function setProcessedEvent($iEvent)
    {
        setParam($this->CNF['PARAM_PROCESSED_EVENT'], $iEvent);
    }

    /**
     * Ancillary functions
     */
    public function getViewUrl()
    {
        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=notifications-view'));
    }

    public function getContentModule(&$aEvent)
    {
        $sModule = $aEvent['type'];
        if($this->_oDb->isEnabledByName($sModule))
            return $sModule;

        $sModule = str_replace(array('_media', '_reactions'), array('', ''), $sModule);
        if($this->_oDb->isEnabledByName($sModule))
            return $sModule;

        return '';
    }

    public function getContentObjectId(&$aEvent)
    {
        $bContentObjectId = !empty($aEvent['content']['object_id']);
        if(!$bContentObjectId) {
            if(in_array($aEvent['action'], ['replyPost']))
                return false;

            if(strpos($aEvent['type'], '_media') !== false && in_array($aEvent['action'], ['commentPost', 'doVote', 'doVoteUp', 'doVoteDown']))
                return false;
        }

        return $bContentObjectId ? (int)$aEvent['content']['object_id'] : (int)$aEvent['object_id'];
    }

    public function getProfileBasedModules() 
    {
        if ($this->_aModulesProfiles !== false && $this->_aModulesContexts !== false)
            return array($this->_aModulesProfiles, $this->_aModulesContexts);

        if (getParam('sys_db_cache_enable')) {
            $oDb = BxDolDb::getInstance();
            $oCache = $oDb->getDbCacheObject();
            $sCacheKey = $oDb->genDbCacheKey('bx_ntfs_profile_based_modules');
            $aData = $oCache->getData($sCacheKey);
            if (null === $aData) {
                $aData = $this->_getProfileBasedModulesData();
                $oCache->setData ($sCacheKey, $aData);
            }
        } 
        else {
            $aData = $this->_getProfileBasedModulesData();
        }

        return $aData;
    }

    protected function _getProfileBasedModulesData() 
    {
        $this->_aModulesProfiles = [];
        $this->_aModulesContexts = [];

        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules']);
        foreach($aModules as $aModule) {
            if(!bx_is_srv($aModule['name'], 'act_as_profile'))
                continue;

            if(bx_srv($aModule['name'], 'act_as_profile'))
                $this->_aModulesProfiles[] = $aModule['name'];
            else
                $this->_aModulesContexts[] = $aModule['name'];
        }

        return [$this->_aModulesProfiles, $this->_aModulesContexts];
    }
}

/** @} */
