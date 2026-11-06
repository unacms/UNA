<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Events Events
 * @ingroup     UnaModules
 *
 * @{
 */

use Spatie\CalendarLinks\Link;

/**
 * Events profiles module.
 */
class BxEventsModule extends BxBaseModGroupsModule implements iBxDolCalendarService 
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);

        $CNF = &$this->_oConfig->CNF;

        $this->_aSearchableNamesExcept = array_merge($this->_aSearchableNamesExcept, [
            $CNF['FIELD_TIMEZONE'],
            $CNF['FIELD_JOIN_CONFIRMATION'],
            $CNF['FIELD_REMINDER']
        ]);

        $this->_aBrowsingFiltersKeys = array_merge($this->_aBrowsingFiltersKeys, [
            'by_location_country', 'by_location_state', 'by_location_city',
            'by_date', 'date_start', 'date_end', 'timezone'
        ]);
    }

    public function actionCheckIn()
    {
    	$iId = (int)bx_get('id');
    	if(empty($iId) || empty($this->_iProfileId))
            return echoJson(['code' => 1]);

        if(!$this->serviceCheckIn($iId, $this->_iProfileId))
            return echoJson(['code' => 2]);

        return echoJson(['code' => 0, 'reload' => 1]);
    }

    public function actionCalendarSync($iContentId = 0)
    {
        $aContentInfo = (int)$iContentId ? $this->_oDb->getContentInfoById((int)$iContentId) : null;
        if (!$aContentInfo) {
            $this->_oTemplate->displayPageNotFound();
            exit;
        }

        if (CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedView($aContentInfo)) {
            $this->_oTemplate->displayAccessDenied();
            exit;
        }

        $CNF = $this->_oConfig->CNF;

        if (!isset($aContentInfo['date_start']) || !$aContentInfo['date_start'] || !isset($aContentInfo['date_end']) || !$aContentInfo['date_end'] || !$aContentInfo[$CNF['FIELD_TIMEZONE']] || empty($CNF['OBJECT_METATAGS'])) {
            $this->_oTemplate->displayPageNotFound();
            exit;
        }

        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
        $sLocation = $oMetatags && $oMetatags->locationsIsEnabled() ? $oMetatags->locationsString($aContentInfo[$CNF['FIELD_ID']], false) : '';

        $oDateStart = new DateTime('@' . $aContentInfo['date_start']);
        $oDateEnd = new DateTime('@' . ($aContentInfo['date_end'] > $aContentInfo['repeat_stop'] ? $aContentInfo['date_end'] : $aContentInfo['repeat_stop']));

        $oTz = new DateTimeZone($aContentInfo[$CNF['FIELD_TIMEZONE']]);
        $oDateStart->setTimezone($oTz);
        $oDateEnd->setTimezone($oTz);

        $oICalLink = $oDateStart && $oDateEnd ? Link::create(
            $aContentInfo[$CNF['FIELD_TITLE']],
            $oDateStart,
            $oDateEnd
        ) : null;

        if ($sLocation)
            $oICalLink->address($sLocation);

        $s = $oICalLink->ics();

        if (!preg_match('/^data:([a-zA-Z0-9\/]+);charset=[a-zA-Z0-9]+;base64,(.*)$/', $s, $m)) {
            $this->_oTemplate->displayErrorOccured();
            exit;
        }

        header('Content-type: ' . $m[1] . '; charset=utf-8');
        header('Content-Disposition: inline; filename="event.ics"');
        echo base64_decode($m[2]);
    }

    public function actionCalendarData()
    {
        $aParams = [
            'type' => ($sType = bx_get('type')) !== false ? $sType : 'browse',
            'start' => bx_get('start'),
            'end' => bx_get('end')
        ];
        if(($iEventId = bx_get('event')) !== false)
            $aParams['event_id'] = (int)$iEventId;
        if(($iProfileId = bx_get('profile_id')) !== false)
            $aParams['profile_id'] = (int)$iProfileId;
        if(($iContextId = bx_get('context_id')) !== false)
            $aParams['context_id'] = (int)$iContextId;
    
        $aResult = $this->serviceCalendarData($aParams);
        if(isset($aResult['data']))
            $aResult = $aResult['data'];

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($aResult);
    }

    public function serviceCheckIn($iId, $iProfileId = 0)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;
        if(!$iProfileId)
            return false;
        
        $aDataEntry = $this->_oDb->getContentInfoById($iId);
        if(empty($aDataEntry) || !is_array($aDataEntry))
            return false;

        if($this->checkAllowedCheckIn($aDataEntry) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        if(!$this->_oDb->checkIn($iProfileId, $iId))
            return false;

         /**
         * @hooks
         * @hookdef hook-bx_events-check_in 'bx_events', 'check_in' - hook in on somebody check-in some event 
         * - $unit_name - equals `bx_events`
         * - $action - equals `check_in` 
         * - $object_id - event_id
         * - $sender_id - current user's profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `event_profile_id` - [int] profile_id from checked event
         * @hook @ref hook-bx_events-check_in
         */
        bx_alert($this->getName(), 'check_in', $iId, $iProfileId, [
            'event_profile_id' => $aDataEntry['profile_id'],
        ]);

        return true;
    }

    public function serviceCalendarData($aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        if($this->_bIsApi && is_string($aParams)) {
            $aParams = json_decode($aParams, true);
            if(!empty($aParams['params']))
                $aParams = $aParams['params'];
            
             if (isset($aParams['profile_id']) && $aParams['profile_id'] == '{profile_id}')
                $aParams['profile_id'] =  bx_get_logged_profile_id();
        }

        $sModule = $this->getName();
        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);

        $iNow = time();

        if(empty($aParams['start']))
            $sStart = date('d.m.Y', $iNow);
        else if(is_numeric($aParams['start']))
            $sStart = date('d.m.Y', $aParams['start']);
        else
            $sStart = $aParams['start'];

        if(empty($aParams['end']))
            $sEnd = date('d.m.Y', $iNow + 3600 * 24 * 30);
        else if(is_numeric($aParams['end']))
            $sEnd = date('d.m.Y', $aParams['end']);
        else
            $sEnd = $aParams['end']; 

        $iContentId = 0;
        $iContextId = 0;
        $aSQLPart = [];
        switch($aParams['type']) {
            case 'event':
                $iContentId = !empty($aParams['event_id']) ? (int)$aParams['event_id'] : 0;
                $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
                if(CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedView($aContentInfo))
                    $this->_oTemplate->displayAccessDenied();
                break;

            case 'author':
                $iProfileId = !empty($aParams['profile_id']) ? (int)$aParams['profile_id'] : 0;

                $aSQLPart = $oPrivacy->getContentPublicAsSQLPart(0, $oPrivacy->getPartiallyVisiblePrivacyGroups());

                $aSQLPart['where'] ??= '';
                $aSQLPart['where'] .= $this->_oDb->prepareAsString(" AND `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_AUTHOR']}`=?", $iProfileId);
                break;

            case 'joined':
                $iProfileId = !empty($aParams['profile_id']) ? (int)$aParams['profile_id'] : 0;

                $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
                if(!$oConnection)
                    return [];

                $aEventsJoined = $oConnection->getConnectedContent($iProfileId, true);
                if(empty($aEventsJoined) || !is_array($aEventsJoined))
                    return [];

                $aSQLPart = $oPrivacy->getContentPublicAsSQLPart(0, $oPrivacy->getPartiallyVisiblePrivacyGroups());
                
                $aSQLPart['join'] ??= '';
                $aSQLPart['join'] .= "INNER JOIN `sys_profiles` ON `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_ID']}`=`sys_profiles`.`content_id` AND `sys_profiles`.`type`='{$sModule}'";

                $aSQLPart['where'] ??= '';
                $aSQLPart['where'] .= " AND `sys_profiles`.`id` IN (" . $this->_oDb->implode_escape($aEventsJoined) . ")";
                break;

            case 'followed':
                $iProfileId = !empty($aParams['profile_id']) ? (int)$aParams['profile_id'] : 0;

                $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
                if(!$oConnection)
                    return [];

                $aEventsFollowed = $oConnection->getConnectedContent($iProfileId, false);
                if(empty($aEventsFollowed) || !is_array($aEventsFollowed))
                    return [];

                $aSQLPart = $oPrivacy->getContentPublicAsSQLPart(0, $oPrivacy->getPartiallyVisiblePrivacyGroups());

                $aSQLPart['join'] ??= '';
                $aSQLPart['join'] .= "INNER JOIN `sys_profiles` ON `{$CNF['TABLE_ENTRIES']}`.`{$CNF['FIELD_ID']}`=`sys_profiles`.`content_id` AND `sys_profiles`.`type`='{$sModule}'";

                $aSQLPart['where'] ??= '';
                $aSQLPart['where'] .= "AND `sys_profiles`.`id` IN (" . $this->_oDb->implode_escape($aEventsFollowed) . ")";
                break;

            case 'context':
                $iContextId = !empty($aParams['context_id']) ? (int)$aParams['context_id'] : 0;
                if(!$this->serviceIsEnableForContext($iContextId))
                    return [];

                $aSQLPart = $oPrivacy->getContentByGroupAsSQLPart(-$iContextId);
                break;
            
            default:
                $aSQLPart = $oPrivacy->getContentPublicAsSQLPart(0, $oPrivacy->getPartiallyVisiblePrivacyGroups());
        }

        // get entries
        $aEntries = $this->_oDb->getEntriesByDate($sStart, $sEnd, $iContentId, $aSQLPart);
        
        foreach($aEntries as &$aEntry) {
            $aEntry['cover'] = $this->serviceGetCover($aEntry['id']);
        }
        
        /**
         * @hooks
         * @hookdef hook-bx_events-calendar_data 'bx_events', 'calendar_data' - hook in get data for calendar
         * - $unit_name - equals `bx_events`
         * - $action - equals `calendar_data` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `params` - [array] array of paramaretes in calendar 
         *      - `event` - [int] event id
         *      - `context_id` - [int] profile_id for context of current event
         *      - `start` - [string] start date in format date('d.m.Y')
         *      - `end` - [string] end date in format date('d.m.Y')
         *      - `sql_part` - [array] by ref, sql for data selection, can be overridden in hook processing
         *      - `data` - [array] by ref, data for calendar, can be overridden in hook processing
         * @hook @ref hook-bx_events-calendar_data
         */
        bx_alert($this->getName(), 'calendar_data', 0, false, [
            'params' => $aParams,
            'event' => $iContentId,
            'context_id' => $iContextId,
            'start' => $sStart,
            'end' =>  $sEnd,
            'sql_part' => &$aSQLPart,
            'data' => &$aEntries,
            'sql_part_ref' => &$aSQLPart,
            'data_ref' => &$aEntries,
        ]);

        return [
            'params' => ['start' => strtotime($sStart), 'end' => strtotime($sEnd)],
            'data' => $aEntries
        ];
    }

    public function serviceIsIcalExportAvaliable($iContentId)
    {
        $aContentInfo = $iContentId ? $this->_oDb->getContentInfoById($iContentId) : false;
        if(!$aContentInfo)
            return false;

        return $aContentInfo['date_start'] && $aContentInfo['date_end'];
    }

    public function decodeDataAPI($aData, $aParams = [])
    {
        $CNF = $this->_oConfig->CNF;
        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);

        $aResult = parent::decodeDataAPI($aData, $aParams);
        $aResult = array_merge($aResult, [
            'date_start' => $aData[$CNF['FIELD_DATE_START']],
            'date_end' => $aData[$CNF['FIELD_DATE_END']],
            'description' => $aData[$CNF['FIELD_TEXT']],
            'location_data' => $oMetatags->locationGet($aData[$CNF['FIELD_ID']]),
            'threshold' => $aData['threshold'],
            'location' => $oMetatags->locationsString($aData[$CNF['FIELD_ID']], false)
        ]);
        return $aResult;
    }

    public function serviceGetCalendarEntries($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;
        $oConn = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        $aData = $oConn->getConnectedContent($iProfileId);
        $aData2 = array(0);
        foreach($aData as $iProfileId2){
            $oProfile = BxDolProfile::getInstance($iProfileId2);
            array_push($aData2, $oProfile->getContentId());
        }
        $aSQLPart['where'] = " AND `bx_events_data`.`id` IN(" . implode(',', $aData2) . ")";
        return $this->_oDb->getEntriesByDate(bx_get('start'), bx_get('end'), null, $aSQLPart);
	}

    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'CheckIn' => '',
            'BrowsePastProfiles' => '',
            'Calendar' => '',
            'CalendarData' => ''
        ]);
    }

    public function serviceEntitySessions($iProfileId = 0)
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

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_SESSIONS_MANAGE']);
        if(!$oGrid)
            return '';

        if($this->_bIsApi){
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];
            
        }

        
        return $oGrid->getCode();
    }

    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-browse Browse
     * @subsubsection bx_events-browse_upcoming_profiles browse_upcoming_profiles
     * 
     * @code bx_srv('bx_events', 'browse_upcoming_profiles', [...]); @endcode
     * 
     * Browse upcoming events
     * 
     * @param $bDisplayEmptyMsg show "empty" message or not if nothing found
     * @param $bAjaxPaginate use AJAX paginate or not
     *
     * @see BxEventsModule::serviceBrowseUpcomingProfiles
     */
    /** 
     * @ref bx_events-browse_upcoming_profiles "browse_upcoming_profiles"
     */
    public function serviceBrowseUpcomingProfiles ($aParams = false)
    {
        $bDisplayEmptyMsg = false;
        if(isset($aParams['empty_message'])) {
            $bDisplayEmptyMsg = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }

        $bAjaxPaginate = true;
        if(isset($aParams['ajax_paginate'])) {
            $bAjaxPaginate = (bool)$aParams['ajax_paginate'];
            unset($aParams['ajax_paginate']);
        }

        return $this->_serviceBrowse ('upcoming', $aParams, BX_DB_PADDING_DEF, $bDisplayEmptyMsg, $bAjaxPaginate);
    }

    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-browse Browse
     * @subsubsection bx_events-browse_upcoming_connected_profiles browse_upcoming_connected_profiles
     * 
     * @code bx_srv('bx_events', 'browse_upcoming_connected_profiles', [...]); @endcode
     * 
     * Browse upcoming connected (followed) events
     * 
     * @param $bDisplayEmptyMsg show "empty" message or not if nothing found
     * @param $bAjaxPaginate use AJAX paginate or not
     *
     * @see BxEventsModule::serviceBrowseUpcomingConnectedProfiles
     */
    /** 
     * @ref bx_events-browse_upcoming_connected_profiles "browse_upcoming_connected_profiles"
     */
    public function serviceBrowseUpcomingConnectedProfiles ($aParams = false)
    {
        if(!is_array($aParams) || empty($aParams['object']) || empty($aParams['profile']))
            return '';

        $bDisplayEmptyMsg = false;
        if(isset($aParams['empty_message'])) {
            $bDisplayEmptyMsg = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }

        $bAjaxPaginate = true;
        if(isset($aParams['ajax_paginate'])) {
            $bAjaxPaginate = (bool)$aParams['ajax_paginate'];
            unset($aParams['ajax_paginate']);
        }

        $aDefaults = array(
            'type' => 'content',
            'mutual' => false,
            'profile2' => 0
        );

        return $this->_serviceBrowse ('upcoming_connected', array_merge($aDefaults, $aParams), BX_DB_PADDING_DEF, $bDisplayEmptyMsg, $bAjaxPaginate);
    }

    public function serviceBrowseRecentProfiles ($bDisplayEmptyMsg = false, $bAjaxPaginate = true, $sUnitView = false)
    {
        $sMode = 'recent';

        $sFilterSelector = '#' . $this->_oConfig->getHtmlIds('popup_bfilters_recent');
        $aFilterParams = ['mode' => $sMode];

        $aParams = [
            'filters' => [
                'values' => [],
                'onclick' => $this->_oConfig->getJsObject('main') . ".changeBrowsingFilters(this, '" . $sFilterSelector . "', " . json_encode($aFilterParams) . ")"
            ]
        ];
        if ($sUnitView) {
            $aParams['unit_view'] = $sUnitView;
        }
        return $this->_serviceBrowse ($sMode, $aParams, BX_DB_PADDING_DEF, $bDisplayEmptyMsg, $bAjaxPaginate);
    }

    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-browse Browse
     * @subsubsection bx_events-browse_past_profiles browse_past_profiles
     * 
     * @code bx_srv('bx_events', 'browse_past_profiles', [...]); @endcode
     * 
     * Browse past events
     * 
     * @param $bDisplayEmptyMsg show "empty" message or not if nothing found
     * @param $bAjaxPaginate use AJAX paginate or not
     *
     * @see BxEventsModule::serviceBrowsePastProfiles
     */
    /** 
     * @ref bx_events-browse_past_profiles "browse_past_profiles"
     */
    public function serviceBrowsePastProfiles ($bDisplayEmptyMsg = false, $bAjaxPaginate = true)
    {
        return $this->_serviceBrowse ('past', false, BX_DB_PADDING_DEF, $bDisplayEmptyMsg, $bAjaxPaginate);
    }
    
    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-browse Browse
     * @subsubsection bx_events-browse_past_profiles browse_past_profiles_by_params
     * 
     * @code bx_srv('bx_events', 'browse_past_profiles_by_params', [...]); @endcode
     * 
     * Browse past events
     * 
     * @param $aParams array with all parameters
     *
     * @see BxEventsModule::serviceBrowsePastProfilesByParams
     */
    /** 
     * @ref bx_events-browse_past_profiles_by_params "browse_past_profiles_by_params"
     */
    public function serviceBrowsePastProfilesByParams ($aParams)
    {
        $bDisplayEmptyMsg = false;
        if(isset($aParams['empty_message'])) {
            $bDisplayEmptyMsg = (bool)$aParams['empty_message'];
            unset($aParams['empty_message']);
        }

        $bAjaxPaginate = true;
        if(isset($aParams['ajax_paginate'])) {
            $bAjaxPaginate = (bool)$aParams['ajax_paginate'];
            unset($aParams['ajax_paginate']);
        }
        return $this->_serviceBrowse ('past', $aParams, BX_DB_PADDING_DEF, $bDisplayEmptyMsg, $bAjaxPaginate);
    }

    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-page_blocks Page Blocks
     * @subsubsection bx_events-calendar calendar
     * 
     * @code bx_srv('bx_events', 'calendar', [...]); @endcode
     * 
     * Shows event or events calendar
     * 
     * @param $aData additional data to point which events to show, leave empty to show all events, specify event's ID in 'event' array key to show calendar for one event only, specify context's ID in 'context_id' array key to show calendar for one context events only. If only one event is specified then it will show calendar only if it's repeating event.
     * @param $sTemplate template to use to show calendar, or leave empty for default template, possible options: calendar.html, calendar_compact.html
     * @return HTML string with calendar to display on the site, all necessary CSS and JS files are automatically added to the HEAD section of the site HTML. On error empty string is returned.
     *
     * @see BxEventsModule::serviceCalendar
     */
    /** 
     * @ref bx_events-calendar "calendar"
     */
    public function serviceCalendar($aData = [], $sTemplate = 'calendar.html')
    {
        if(isset($aData['event']) && !isset($aData['type']))
            $aData['type'] = 'event';

        if(isset($aData['profile_id']) && !isset($aData['type']))
            $aData['type'] = 'joined';

        if(isset($aData['context_id'])) {
            if(!$this->serviceIsEnableForContext($aData['context_id']))
                return '';

            $aData['type'] = 'context';
        }

        if(!isset($aData['type']))
            $aData['type'] = 'browse';

        $oCalendar = new BxTemplCalendar([
            'eventSources' => [
                bx_append_url_params(BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'calendar_data', $aData),
            ],
        ], $this->_oTemplate);

        if (bx_is_api())
            return [bx_api_get_block('calendar', ['request_url' => $this->getName() . '/calendar_data&params[]=' . json_encode(['params' => $aData])])];
        
        $this->_oTemplate->addCss(['main.css']);
        return $oCalendar->display($sTemplate);
    }

    public function serviceSessions($iContentId = 0)
    {
        if(!$iContentId)
            $iContentId = (int)bx_get('id');
        if(!$iContentId)
            return '';
        
        return $this->_oTemplate->getBlockSessions($iContentId);
    }

    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-other Other
     * @subsubsection bx_events-process_reminders process_reminders
     * 
     * @code bx_srv('bx_events', 'process_reminders'); @endcode
     * 
     * Send remiders to event's participants.
     *
     * It must be processed once every hour for the proper processing.
     * @return nothing
     *
     * @see BxEventsModule::serviceProcessReminders
     */
    /** 
     * @ref bx_events-process_reminders "process_reminders"
     */
    public function serviceProcessReminders()
    {
        $CNF = &$this->_oConfig->CNF;

        $iNow = time();
        $bUseIn = $this->_oConfig->isInternalNotifications();
        $sModule = $this->getName();

        // get all events for today and tomorrow, since the max reminder is 24 hours
        $aEntries = $this->_oDb->getEntriesByDate('@' . time(), '@' . (time() + 3600 * getParam('bx_events_reminder_interval')));

        foreach($aEntries as $aEntry) {
            $aReminders = $bUseIn ? [$aEntry['reminder']] : [24, 1];
            if(!$aReminders)
                continue;

            $oEventProfile = BxDolProfile::getInstanceByContentAndType($aEntry[$CNF['FIELD_ID']], $sModule);
            if(!$oEventProfile)
                continue;

            $iEventProfileId = $oEventProfile->id();
            foreach($aReminders as $iReminder) {
                $iTimestamp = $aEntry['start_utc'] - (3600 * $iReminder);
                if($iNow <= ($iTimestamp - 3600) || $iNow >= $iTimestamp)
                    continue;

                if($bUseIn)
                    $this->sendReminders($aEntry);

                /**
                 * @hooks
                 * @hookdef hook-bx_events-reminder 'bx_events', 'reminder' - hook on enent's reminder
                 * - $unit_name - equals `bx_events`
                 * - $action - equals `reminder` 
                 * - $object_id - event_id
                 * - $sender_id - event profile_id
                 * - $extra_params - array of additional params with the following array keys:
                 *      - `object_author_id` - [int] event profile_id 
                 *      - `reminder` - [int] reminder id
                 * @hook @ref hook-bx_events-reminder
                 */
                bx_alert($sModule, 'reminder', $aEntry[$CNF['FIELD_ID']], $iEventProfileId, array(
                    'object_author_id' => $iEventProfileId,
                    'reminder' => $iReminder
                ));
            }
        }
    }

    public function serviceGetNotificationsData()
    {
        $CNF = &$this->_oConfig->CNF;

        $aResults = parent::serviceGetNotificationsData();
        
        $sModule = $this->_aModule['name'];
        $aSettingsTypes = ['follow_context'];

        $aResults['handlers'] = array_merge($aResults['handlers'], [
            ['group' => $sModule . '_reminder', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'reminder', 'module_name' => $sModule, 'module_method' => 'get_notifications_reminder', 'module_class' => 'Module', 'module_event_privacy' => $CNF['OBJECT_PRIVACY_VIEW_NOTIFICATION_EVENT']],
        ]);

        $aResults['settings'] = array_merge($aResults['settings'], [
            ['group' => 'reminder', 'unit' => $sModule, 'action' => 'reminder', 'types' => $aSettingsTypes],
        ]);

        $aResults['alerts'] = array_merge($aResults['alerts'], [
            ['unit' => $sModule, 'action' => 'reminder'],
        ]);

        return $aResults;
    }

    public function serviceGetNotificationsInsertData($oAlert, $aHandler, $aDataItems)
    {
        if($oAlert->sAction != 'reminder' || empty($aDataItems) || !is_array($aDataItems) || empty($oAlert->aExtras['reminder']))
            return $aDataItems;

        foreach($aDataItems as $iIndex => $aDataItem) {
            $aContent = [];
            if(!empty($aDataItem['content']))
                $aContent = unserialize($aDataItem['content']);

            $aContent['reminder'] = (int)$oAlert->aExtras['reminder'];

            $aDataItems[$iIndex]['content'] = serialize($aContent);
        }

        return $aDataItems;
    }

    public function serviceGetNotificationsReminder($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!isset($aEvent['content']['reminder']))
            return [];

        $iContentId = (int)$aEvent['object_id'];
        $oEventProfile = BxDolProfile::getInstanceByContentAndType((int)$iContentId, $this->getName());
        if(!$oEventProfile)
            return [];

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return [];

        return [
            'entry_sample' => $CNF['T']['txt_sample_single'],
            'entry_url' => bx_absolute_url(str_replace(BX_DOL_URL_ROOT, '', $oEventProfile->getUrl()), '{bx_url_root}'),
            'entry_caption' => $oEventProfile->getDisplayName(),
            'entry_author' => $oEventProfile->id(),
            'lang_key' => '_bx_events_txt_ntfs_reminder_' . $aEvent['content']['reminder']
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_events Events
     * @subsection bx_events-internal Internal
     * @subsubsection bx_events-get_timeline_post get_timeline_post
     *
     * @code bx_srv('bx_events', 'get_timeline_post', [...]); @endcode
     * 
     * Get Timeline post. It's needed for Timeline module.
     * 
     * @param $aEvent timeline event array from Timeline module
     * @return array in special format which is needed specifically for Timeline module to display the data.
     *
     * @see BxEventsModule::serviceGetTimelinePost
     */
    /** 
     * @ref bx_events-get_timeline_post "get_timeline_post"
     */
    public function serviceGetTimelinePost($aEvent, $aBrowseParams = array())
    {
        $a = parent::serviceGetTimelinePost($aEvent, $aBrowseParams);
        if($a === false)
            return false;

        $aContentInfo = $this->_oDb->getContentInfoById($aEvent['object_id']);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return $a;

        $CNF = $this->_oConfig->CNF;

        $oDateStart = date_create('@' . $aContentInfo['date_start']);
        if ($oDateStart){
            $oDateStart->setTimezone(new DateTimeZone($aContentInfo['timezone'] ? $aContentInfo['timezone'] : 'UTC'));
            $a['content']['date_start'] = $aContentInfo['date_start'];
        }
        
        $oDateEnd = date_create('@' . $aContentInfo['date_end']);
        if ($oDateEnd){
            $oDateEnd->setTimezone(new DateTimeZone($aContentInfo['timezone'] ? $aContentInfo['timezone'] : 'UTC'));
            $a['content']['date_end'] = $aContentInfo['date_end'];
        }

        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
        $sLocationString = $oMetatags ? $oMetatags->locationsString($aContentInfo[$CNF['FIELD_ID']], false) : false;

        if(!$this->_bIsApi)
            $a['content']['raw'] = $this->_oTemplate->parseHtmlByName('timeline_post.html', [
                'title' => $a['content']['title'],
                'title_attr' => bx_html_attribute($a['content']['title']),
                'url' => $a['content']['url'],
                'bx_if:date' => [
                    'condition' => $oDateStart,
                    'content' => [
                        'date' => $oDateStart ? bx_time_js($aContentInfo['date_start'], BX_FORMAT_DATE_TIME, true) : '',
                        'date_c' => $oDateStart->format('c'),
                ]],
                'bx_if:location' => array(
                    'condition' => !!$sLocationString,
                    'content' => array('location' => $sLocationString),
                ),
            ]);

        return $a;
    }
    
    public function actionIntervals()
    {
        $sAction = bx_get('a');
        $sMethodName = 'subaction' . ucfirst($sAction);
        if (!method_exists($this, $sMethodName)) {
            $this->_oTemplate->pageNotFound();
            return;
        }
        $this->$sMethodName();
    }

    public function subactionRestore($iContentId = 0)
    {
        if (!$iContentId)
            $iContentId = (int)bx_get('c');

        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);

        if (
            ($aContentInfo && CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedEdit ($aContentInfo))
            ||
            (!$aContentInfo && CHECK_ACTION_RESULT_ALLOWED !== $this->checkAllowedAdd ())
        ) {
            $this->_oTemplate->displayAccessDenied();
            exit;
        }

        $a = $this->_oDb->getIntervals($iContentId);
        foreach ($a as $iIntervalId => $r) {
            $a[$iIntervalId]['file_id'] = $r['interval_id'];
            $a[$iIntervalId]['repeat_stop'] = bx_process_output ($r['repeat_stop'], BX_DATA_DATE_TS);
        }

        if ('json' == bx_get('f')) {
            header('Content-type: text/html; charset=utf-8');
            echo json_encode($a);
        }
    }

    public function subactionDelete()
    {
        header('Content-type: text/html; charset=utf-8');

        $iIntervalId = (int)bx_get('id');

        if (!($aContentInfo = $this->_oDb->getContentInfoByIntervalId($iIntervalId))) {
            echo _t('_sys_request_page_not_found_cpt');
        }
        elseif (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->checkAllowedEdit ($aContentInfo))) {
            echo $sMsg;
        } 
        elseif (!$this->_oDb->deleteIntervalById($iIntervalId)) {
            echo _t('_sys_txt_error_occured');
        } 
        else {
            echo 'ok';
        }
    }

    public function checkAllowedCheckIn($aDataEntry, $isPerformAction = false)
    {
        $CNF = &$this->_oConfig->CNF;

        $sError = _t('_sys_txt_access_denied');
        if(!$this->_iProfileId || !$this->isFan($aDataEntry[$CNF['FIELD_ID']], $this->_iProfileId))
            return $sError;

        if(!$this->isOngoing($aDataEntry))
            return $sError;

        if($this->_oDb->isCheckedIn($this->_iProfileId, $aDataEntry[$CNF['FIELD_ID']]))
            return $sError;

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkAllowedIcalExport ($aDataEntry, $isPerformAction = false)
    {
        return $aDataEntry['date_start'] && $aDataEntry['date_end'] ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');
    }

    /**
     * Send reminder to event's paritcipants
     * @param $aContentInfo content info
     * @return number of sent reminders
     */ 
    protected function sendReminders($aContentInfo)
    {
        $CNF = $this->_oConfig->CNF;

        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
        if (!$oConnection)
            return false;

        $oGroupProfile = BxDolProfile::getInstanceByContentAndType($aContentInfo[$CNF['FIELD_ID']], $this->getName());
        if (!$oGroupProfile)
            return false;

        $aParticipants = $oConnection->getConnectedInitiators($oGroupProfile->id(), true);
        if (!$aParticipants)
            return true;

        $oDateBegin = new DateTime();
        $oDateBegin->setTimestamp($aContentInfo['start_utc']);
        $oDateBegin->setTimezone(new DateTimeZone($aContentInfo['timezone'] ? $aContentInfo['timezone'] : 'UTC'));
        $sEntryBegin = $oDateBegin->format('r');
        $sEntryBeginShort = date(getParam($CNF['PARAM_FORMAT_DATE']), $oDateBegin->getTimestamp());
        $oDateBegin->setTimezone(new DateTimeZone('UTC'));
        $sEntryBeginUTC = $oDateBegin->format('c');

        $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
        $sLocationString = $oMetatags->locationsString($aContentInfo[$CNF['FIELD_ID']], false);

        $iCounter = 0;
        foreach ($aParticipants as $iProfileId) {

            $b = sendMailTemplate($CNF['EMAIL_REMINDER'], 0, $iProfileId, array(
                'EntryUrl' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']])),
                'EntryTitle' => $aContentInfo['title'],
                'EntryBegin' => $sEntryBegin,
                'EntryBeginShort' => $sEntryBeginShort,
                'EntryBeginUTC' => $sEntryBeginUTC,
                'EntryLocation' => $sLocationString ? _t('_bx_events_email_reminder_location', $sLocationString) : '',
            ), BX_EMAIL_NOTIFY);

            $iCounter += $b ? 1 : 0;
        }
        return $iCounter;
    }
    
    public function isOngoing($aDataEntry)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aDataEntry[$CNF['FIELD_DATE_START']]) || empty($aDataEntry[$CNF['FIELD_DATE_END']]))
            return false;

        $iTime = time();
        return $iTime >= $aDataEntry[$CNF['FIELD_DATE_START']] && $iTime <= $aDataEntry[$CNF['FIELD_DATE_END']];
    }
}

/** @} */
