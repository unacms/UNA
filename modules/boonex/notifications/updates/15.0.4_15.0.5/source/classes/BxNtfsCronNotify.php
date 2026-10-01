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

/**
 * Get notifications list and retrieve recipients for each notification. Put emails in:
 * a) internal queue, if Delivery Timeout is set,
 * b) system queue otherwise
 */
class BxNtfsCronNotify extends BxDolCron
{
    protected $_sModule;
    protected $_oModule;

    protected $_bOwnActions;
    protected $_bEventsGroupedDb;
    protected $_bDeliveryTimeout;

    public function __construct()
    {
    	$this->_sModule = 'bx_notifications';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct();

        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_bOwnActions = getParam($CNF['PARAM_OWN_ACTIONS']) == 'on';
        $this->_bEventsGroupedDb = $this->_oModule->_oConfig->isEventsGroupedDb();
        $this->_bDeliveryTimeout = $this->_oModule->_oConfig->getDeliveryTimeout() > 0;
    }

    public function processing()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bDeliveryTimeout) {
            $iCount = (int)$this->_oModule->_oDb->queueGet(['type' => 'count']);
            if($iCount > (int)getParam($CNF['PARAM_QUEUE_ADD_THRESHOLD']))
                return;
        }

        $aEvents = $this->_oModule->_oDb->getEventsToProcess((int)getParam($CNF['PARAM_QUEUE_ADD_LIMIT']));
        foreach($aEvents as $aEvent) {
            if(!empty($aEvent['content']) && is_string($aEvent['content']))
                $aEvent['content'] = unserialize($aEvent['content']);

            $this->_processNotifications($aEvent);
        }

        if($this->_bEventsGroupedDb && ($aProfiles = $this->_oModule->_oDb->aggregatorGetProfiles()) && is_array($aProfiles))
            foreach($aProfiles as $iProfile) {
                $aEventsIds = [];
                foreach([BX_BASE_MOD_NTFS_DTYPE_EMAIL, BX_BASE_MOD_NTFS_DTYPE_PUSH] as $sDeliveryType) {
                    $sMethodGet = 'getNotification' . bx_gen_method_name($sDeliveryType);

                    $aEvents = $this->_oModule->_oDb->aggregatorGetEvents($iProfile, $sDeliveryType);
                    foreach($aEvents as $aEvent) {
                        if(($sGroupedByMac = $aEvent['grouped_by_mac'] ?? false))
                            $aEventsIds = array_merge($aEventsIds,  explode(',', $sGroupedByMac));

                        $sEvent = $this->_oModule->_oTemplate->getPost($aEvent, ['perform_privacy_check_for' => $iProfile, 'show_real_profile' => false]);
                        if(empty($sEvent) || empty($aEvent['content_parsed']))
                            continue;

                        $mixedNotification = false;
                        if(($mixedNotification = $this->_oModule->_oTemplate->$sMethodGet($iProfile, $aEvent)) === false)
                            continue;

                        $this->_sendNotification($iProfile, $aEvent['id'], $sDeliveryType, $mixedNotification);
                    }
                }

                $this->_oModule->_oDb->aggregatorDelete($iProfile, array_unique($aEventsIds));
            }
    }

    protected function _processNotifications(&$aEvent)
    {
        $aHandler = $this->_oModule->_oConfig->getHandlers($aEvent['type'] . '_' . $aEvent['action']);
        if(empty($aHandler) || !is_array($aHandler))
            return;

        $aDeliveryTypes = [];

        $iId = (int)$aEvent['id'];
        $iSilentMode = $this->_oModule->getSilentMode($aEvent['content']);
        switch($iSilentMode) {
            case BX_BASE_MOD_NTFS_SLTMODE_ABSOLUTE:
            case BX_NTFS_SLTMODE_ABSOLUTE:
            case BX_NTFS_SLTMODE_SITE:
                return;

            case BX_NTFS_SLTMODE_SITE_EMAIL:
                $aDeliveryTypes[] = BX_BASE_MOD_NTFS_DTYPE_EMAIL;
                break;

            case BX_NTFS_SLTMODE_SITE_PUSH:
                $aDeliveryTypes[] = BX_BASE_MOD_NTFS_DTYPE_PUSH;
                break;

            default:
                $aDeliveryTypes = [BX_BASE_MOD_NTFS_DTYPE_EMAIL, BX_BASE_MOD_NTFS_DTYPE_PUSH];
        }

        $aSendUsing = [];
        foreach($aDeliveryTypes as $sDeliveryType) {
            $aHidden = $this->_oModule->_oConfig->getHandlersHidden($sDeliveryType);
            if(in_array($aHandler['id'], $aHidden))
                continue;

            $sMethod = 'Notification' . bx_gen_method_name($sDeliveryType);
            $sMethodGet = 'get' . $sMethod;
            if(!$this->_oModule->_oTemplate->isMethodExists($sMethodGet) || !method_exists($this->_oModule, 'send' . $sMethod))
                continue;

            $aSendUsing[$sDeliveryType] = $sMethodGet;
        }

        if(empty($aSendUsing) || !is_array($aSendUsing))
            return;

        $iOwner = (int)$aEvent['owner_id'];
        $aRecipients = [];

        //--- Get recipients: Subscribers.
        $oConnection = BxDolConnection::getObjectInstance($this->_oModule->_oConfig->getObject('conn_subscriptions'));
        $aSubscribers = $oConnection->getConnectedInitiators($iOwner);
        if(!empty($aSubscribers) && is_array($aSubscribers)) {
            $oOwner = BxDolProfile::getInstance($iOwner);
            if(!empty($oOwner)) {
                $sSettingType = bx_srv($oOwner->getModule(), 'act_as_profile') ? BX_NTFS_STYPE_FOLLOW_MEMBER : BX_NTFS_STYPE_FOLLOW_CONTEXT;

                foreach($aSubscribers as $iSubscriber) 
                    $this->_addRecipient($iSubscriber, $sSettingType, $aRecipients);
            }
        }

        //--- Get recipients: Content owner.
        $iObjectOwner = (int)$aEvent['object_owner_id'];
        if($iOwner != $iObjectOwner)
            $this->_addRecipient($iObjectOwner, BX_NTFS_STYPE_PERSONAL, $aRecipients);

        //--- Check recipients and send notifications.
        list($aModulesProfiles) = $this->_oModule->_oConfig->getProfileBasedModules();
        $aRecipientsId = $this->_oModule->_oDb->filterProfileIdsByModule(array_keys($aRecipients), $aModulesProfiles);
        $aRecipients = array_intersect_key($aRecipients, array_flip($aRecipientsId));

        $oPrivacyInt = BxDolPrivacy::getObjectInstance($this->_oModule->_oConfig->getObject('privacy_view'));
        $oPrivacyExt = $this->_oModule->_oConfig->getPrivacyObject($aEvent['type'] . '_' . $aEvent['action']);
        foreach($aRecipients as $iRecipient => $aSettingTypes) {
            $iIdRead = $this->_oModule->_oDb->getLastRead($iRecipient);
            if($iIdRead >= $iId)
                continue;

            if(!$this->_bOwnActions && $aEvent['author_id'] == $iRecipient)
                continue;

            if($oPrivacyExt !== false && !$oPrivacyExt->check($aEvent['id'], $iRecipient)) 
                continue;

            if($oPrivacyInt !== false && !$oPrivacyInt->check($aEvent['id'], $iRecipient))
                continue;

            /**
             * Check if the Recipient can view the notification.
             */
            $sEvent = $this->_oModule->_oTemplate->getPost($aEvent, ['perform_privacy_check_for' => $iRecipient, 'show_real_profile' => false]);
            if(empty($sEvent) || empty($aEvent['content_parsed']))
                continue;

            foreach($aSendUsing as $sDeliveryType => $sDeliveryTypeGet) {
                $mixedNotification = false;
                if(!$this->_bEventsGroupedDb && ($mixedNotification = $this->_oModule->_oTemplate->$sDeliveryTypeGet($iRecipient, $aEvent)) === false)
                    continue;

                foreach($aSettingTypes as $sSettingType) {
                    $aSetting = $this->_oModule->_oDb->getSetting(['by' => 'tsu_allowed', 'handler_id' => $aHandler['id'], 'delivery' => $sDeliveryType, 'type' => $sSettingType, 'user_id' => $iRecipient]);
                    if(empty($aSetting) || !is_array($aSetting))
                        continue;

                    if((int)$aSetting['active_adm'] == 0 || (int)$aSetting['active_pnl'] == 0)
                        continue;

                    if($this->_bEventsGroupedDb) {
                        $this->_oModule->_oDb->aggregatorAdd([
                            'profile_id' => $iRecipient, 
                            'event_id' => $aEvent['id'], 
                            'delivery' => $sDeliveryType
                        ]);
                        break;
                    }

                    /**
                     * (break) is essential to avoid duplicate sending to the same recipient.
                     */
                    if($this->_sendNotification($iRecipient, $aEvent['id'], $sDeliveryType, $mixedNotification) !== false)
                        break;
                }
            }
        }
    }

    protected function _addRecipient($iUser, $sSettingType, &$aRecipients)
    {
        if(!isset($aRecipients[$iUser]))
            $aRecipients[$iUser] = [];

        $aRecipients[$iUser][] = $sSettingType;
    }

    private function _sendNotification($iRecipient, $iEventId, $sDeliveryType, $aNotification)
    {
        /**
         * 'return true' (break) is essential to avoid duplicate sending to the same recipient.
         * Don't send directly if message was successfully queued.
         */
        if($this->_bDeliveryTimeout && $this->_oModule->_oDb->queueAdd([
            'profile_id' => $iRecipient, 
            'event_id' => $iEventId, 
            'delivery' => $sDeliveryType,
            'content' => serialize($aNotification),
            'date' => time()
        ]) !== false)
            return true;

        /**
         * 'return true' (break) is essential to avoid duplicate sending to the same recipient.
         * If a message was sent as 'personal', don't send it by subscription ('follow_member', 'follow_context').
         */
        if($this->_oModule->{'sendNotification' . bx_gen_method_name($sDeliveryType)}($iRecipient, $aNotification) !== false)
            return true;

        return false;
    }
}

/** @} */
