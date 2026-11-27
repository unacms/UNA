<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reminders Reminders
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolPrivacy');

class BxRemindersCron extends BxDolCron
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
    	$this->_sModule = 'bx_reminders';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct();
    }

    function processing()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        //--- Delete expired reminders.
        $iExpireDays = (int)$this->_oModule->_oDb->getParam($CNF['PARAM_DELETE_AFTER']);
        if($iExpireDays >= 0)
            $this->_oModule->_oDb->deleteEntryExpired($iExpireDays);

        //--- Check and Add new reminders.
        $iSystemProfileId = $this->_oModule->_oConfig->getSystemProfileId();

        $aTypesSystem = $this->_oModule->_oDb->getType(array('type' => 'all', 'personal' => 0, 'active' => 1));
        $bTypesSystem = !empty($aTypesSystem) && is_array($aTypesSystem);

        $aTypesPersonal = $this->_oModule->_oDb->getType(array('type' => 'all', 'personal' => 1, 'active' => 1));
        $bTypesPersonal = !empty($aTypesPersonal) && is_array($aTypesPersonal);
        if(!$bTypesSystem && !$bTypesPersonal)
            return;

        $iNow = time();
        list($iNowYear, $iNowMonth, $iNowDay) = explode('-', date('Y-m-j'));

        /**
         * Checkes whether some of system reminders
         * can be shown today or not.
         */
        if($bTypesSystem) {
            foreach($aTypesSystem as $iKey => $aType) {
                list($iMonth, $iDay) = explode('-', $aType['when']);
                $aTypesSystem[$iKey]['expired'] = mktime(0, 0, 0, $iMonth, $iDay, $iNowYear);

                /**
                 * Check whether system reminder should be shown or not.
                 */
                $iDays = (int)$aType['show'];
                $aTypesSystem[$iKey]['show'] = false;

                if($iDays != 0 && $this->_checkDateBegin($iNowYear . '-' . $aType['when'], $iDays, $iNowMonth, $iNowDay))
                    $aTypesSystem[$iKey]['show'] = $iDays;

                 /**
                  * Check whether a notification about system reminder
                  * should be sent or not.
                  */
                $aDays = explode($CNF['PARAM_DAYS_DELIMITER'], $aType['notify']);
                $aTypesSystem[$iKey]['notify'] = false;

                if(!empty($aDays) && is_array($aDays))
                    foreach($aDays as $iDays) {
                        $iDays = (int)$iDays;

                        if($iDays != 0 && $this->_checkDateBegin($iNowYear . '-' . $aType['when'], $iDays, $iNowMonth, $iNowDay)) {
                            $aTypesSystem[$iKey]['notify'] = $iDays;
                            break;
                        }
                    }

                if($aTypesSystem[$iKey]['show'] === false && $aTypesSystem[$iKey]['notify'] === false)
                    unset($aTypesSystem[$iKey]);
            }

            $bTypesSystem = !empty($aTypesSystem) && is_array($aTypesSystem);
        }

        /**
         * Get all profiles from profile based modules
         * and start to show reminders and/or notify about them.
         */
        $aProfileModules = array();
        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule)
            if(BxDolRequest::serviceExists($aModule['name'], 'act_as_profile') && bx_srv($aModule['name'], 'act_as_profile'))
                $aProfileModules[] = $aModule['name'];        

        $aProfiles = $this->_oModule->_oDb->getProfiles($aProfileModules);
        foreach($aProfiles as $aProfile) {
            $iProfileId = (int)$aProfile['id'];
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if(!$oProfile)
                continue;

            //--- Process personal(related to followed friends) reminders.
            if($bTypesPersonal) {
                $aFriendsIds = $this->_getFriendsIds($iProfileId);
                foreach($aFriendsIds as $iFriendId) {
                    $oFriend = BxDolProfile::getInstance($iFriendId);
                    if(!$oFriend)
                        continue;

                    $aFriend = BxDolService::call($oFriend->getModule(), 'get_content_info_by_id', array($oFriend->getContentId()));
                    if(empty($aFriend) || !is_array($aFriend))
                        continue;

                    foreach($aTypesPersonal as $aType) {
                        $iTypeId = (int)$aType['id'];
                        $sTypePostfix = bx_gen_method_name($aType['name']);

                        $sMethod = '_checkDateBegin' . $sTypePostfix;
                        if(!method_exists($this, $sMethod)) 
                            continue;

                        $aEntryNew = array(
                            'type_id' => $iTypeId,
                            'rmd_pid' => $iProfileId,
                            'cnt_pid' => $iFriendId,
                            'params' => '',
                            'active' => 1,
                            'visible' => 1,
                            'added' => $iNow,
                            'expired' => 0
                        );

                        //--- Perform Show.
                        $iDays = (int)$aType['show'];
                        if($iDays != 0 && ($aBeginDates = $this->$sMethod($oFriend, $aFriend, $iDays, $iNowYear, $iNowMonth, $iNowDay)) !== false)
                            foreach($aBeginDates as $aBeginDate) {
                                $aEntry = $this->_oModule->_oDb->isEntryPersonal($iTypeId, $iProfileId, $iFriendId, $aBeginDate['expired']);
                                if($aEntry === false)
                                    $this->_oModule->_oDb->insertEntry(array_merge($aEntryNew, array(
                                        'params' => serialize($aBeginDate['params']),
                                        'visible' => 1,
                                        'expired' => $aBeginDate['expired']
                                    )));
                                else if((int)$aEntry['visible'] == 0)                                     
                                    $this->_oModule->_oDb->updateEntry(array('visible' => 1), array('id' => (int)$aEntry['id']));
                            }

                        //--- Perform Notify.
                        $aDays = explode($CNF['PARAM_DAYS_DELIMITER'], $aType['notify']);
                        if(empty($aDays) || !is_array($aDays))
                            continue;

                        foreach($aDays as $iDays) {
                            $iDays = (int)$iDays;
                            if(empty($iDays))
                                continue;

                            $aBeginDates = $this->$sMethod($oFriend, $aFriend, $iDays, $iNowYear, $iNowMonth, $iNowDay);
                            if($aBeginDates === false)
                                continue;

                            foreach($aBeginDates as $aBeginDate) {
                                $iExpired = (int)$aBeginDate['expired'];

                                $iEntry = 0;
                                $aEntry = $this->_oModule->_oDb->isEntryPersonal($iTypeId, $iProfileId, $iFriendId, $iExpired);
                                if($aEntry === false)
                                    $iEntry = $this->_oModule->_oDb->insertEntry(array_merge($aEntryNew, array(
                                        'params' => serialize($aBeginDate['params']),
                                        'visible' => 0,
                                        'expired' => $iExpired
                                    )));
                                else
                                    $iEntry = (int)$aEntry['id'];

                                /**
                                 * Stop the process if there is no an entry to notify about.
                                 */
                                if(empty($iEntry)) 
                                    continue;

                                /*
                                 * Stop the process if the action was already porformed. 
                                 */
                                $bNotified = !empty($aEntry['notified']) && is_array($aEntry['notified']);
                                if($bNotified && array_key_exists($iExpired, $aEntry['notified']) && in_array($iDays, $aEntry['notified'][$iExpired]))
                                    continue;

                                bx_alert($this->_oModule->getName(), 'added', $iEntry, $iFriendId, array(
                                    'object_author_id' => $iProfileId,
                                    'privacy_view' => BX_DOL_PG_ALL
                                ));

                                $aNotified = $bNotified ? $aEntry['notified'] : array();
                                if(!isset($aNotified[$iExpired]))
                                    $aNotified[$iExpired] = array();
                                $aNotified[$iExpired][] = $iDays;

                                $this->_oModule->_oDb->updateEntry(array('notified' => serialize($aNotified)), array('id' => $iEntry));
                            }

                            break;
                        }
                    }
                }
            }

            //--- Process system (related to holidays) reminders.
            if($bTypesSystem) {
                foreach($aTypesSystem as $aType) {
                    $iTypeId = (int)$aType['id'];

                    $aEntryNew = array(
                        'type_id' => $iTypeId,
                        'rmd_pid' => $iProfileId,
                        'cnt_pid' => 0,
                        'params' => '',
                        'active' => 1,
                        'visible' => 1,
                        'added' => $iNow,
                        'expired' => 0
                    );

                    //--- Perform Show.
                    if($aType['show'] !== false)
                        if($this->_oModule->_oDb->isEntrySystem($iTypeId, $iProfileId) === false)
                            $this->_oModule->_oDb->insertEntry(array_merge($aEntryNew, array(
                                'visible' => 1,
                                'expired' => $aType['expired']
                            )));

                    //--- Perform Notify.
                    if($aType['notify'] !== false) {
                        $iDays = (int)$aType['notify'];
                        $iExpired = (int)$aType['expired'];

                        $iEntry = 0;
                        $aEntry = $mResultExists = $this->_oModule->_oDb->isEntrySystem($iTypeId, $iProfileId);
                        if($aEntry === false)
                            $iEntry = $this->_oModule->_oDb->insertEntry(array_merge($aEntryNew, array(
                                'visible' => 0,
                                'expired' => $iExpired
                            )));
                        else
                            $iEntry = (int)$aEntry['id'];

                        /**
                         * Stop the process if there is no an entry to notify about.
                         */
                        if(empty($iEntry)) 
                           continue;

                        /*
                         * Stop the process if the action was already porformed. 
                         */
                        $bNotified = !empty($aEntry['notified']) && is_array($aEntry['notified']);
                        if($bNotified && array_key_exists($iExpired, $aEntry['notified']) && in_array($iDays, $aEntry['notified'][$iExpired]))
                            continue;

                        bx_alert($this->_oModule->getName(), 'added', $iEntry, $iSystemProfileId, array(
                            'object_author_id' => $iProfileId,
                            'privacy_view' => BX_DOL_PG_ALL
                        ));

                        $aNotified = $bNotified ? $aEntry['notified'] : array();
                        if(!isset($aNotified[$iExpired]))
                            $aNotified[$iExpired] = array();
                        $aNotified[$iExpired][] = $iDays;

                        $this->_oModule->_oDb->updateEntry(array('notified' => serialize($aNotified)), array('id' => $iEntry));
                    }
                }
            }
        }
    }

    protected function _checkDateBeginBirthday(&$oProfile, &$aProfile, $iDays, $iNowYear, $iNowMonth, $iNowDay)
    {
        if(!isset($aProfile['birthday']))
            return false;

        $mResult = $this->_checkDate($oProfile, $aProfile['birthday'], $iDays, $iNowYear, $iNowMonth, $iNowDay);
        if(!$mResult)
            return $mResult;
        
        return array($mResult);
    }

    protected function _checkDateBeginAnniversary(&$oProfile, &$aProfile, $iDays, $iNowYear, $iNowMonth, $iNowDay)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aDates = array();
        bx_alert($this->_oModule->getName(), 'get_important_dates', 0, 0, array(
            'profile_id' => $oProfile->id(),
            'profile_content_info' => $aProfile,
            'days' => $iDays, 
            'now_year' => $iNowYear, 
            'now_month' => $iNowMonth,
            'now_day' => $iNowDay,
            'override_result' => &$aDates
        ));
        if(empty($aDates) || !is_array($aDates))
            return false;

        $aResults = array();
        foreach($aDates as $aDate)
            if(($aResult = $this->_checkDate($oProfile, date('Y-m-d', $aDate['important_dates_date_start']), $iDays, $iNowYear, $iNowMonth, $iNowDay)) !== false) {
                $aResult['params']['title'] = $aDate['important_dates_description'];

                $aResults[] = $aResult;
            }

        return $aResults;
    }

    protected function _checkDate(&$oProfile, $sDate, $iDays, $iNowYear, $iNowMonth, $iNowDay)
    {
        $bResult = $this->_checkDateBegin($sDate, $iDays, $iNowMonth, $iNowDay);
        if(!$bResult)
            return $bResult;

        list($iYear, $iMonth, $iDay) = explode('-', $sDate);
        $iDate = mktime(0, 0, 0, $iMonth, $iDay, $iNowYear);

        return array(
            'params' => array(
                'profile_id' => $oProfile->id(),
                'profile_name' => $oProfile->getDisplayName(),
                'profile_link' => $oProfile->getUrl(),
                'date' => bx_time_js($iDate)
            ),
            'expired' => $iDate
        );
    }

    protected function _checkDateBegin($sDate, $iDays, $iNowMonth, $iNowDay) 
    {
        list($iMonth, $iDay) = explode('-', date('m-d', strtotime("-" . $iDays . " days", strtotime($sDate))));

        return (int)$iMonth == (int)$iNowMonth && (int)$iDay == (int)$iNowDay;
    }

    /**
     * Returns followed friends.
     */
    protected function _getFriendsIds($iProfileId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aFriends = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS_FRD'])->getConnectedContent($iProfileId, true);
        $aSubscriptions = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS_SBN'])->getConnectedContent($iProfileId);

        return array_intersect($aFriends, $aSubscriptions);
    }
}

/** @} */
