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

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

class BxNtfsTemplate extends BxBaseModNotificationsTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }

    public function getInclude($bIncludeCss = true, $mixedIncludeJs = false)
    {
        if($bIncludeCss)
            $this->getAddedCss();

        $sResult = '';
        if(is_string($mixedIncludeJs) && !empty($mixedIncludeJs)) {
            $this->getAddedJs();
            
            $sResult = $this->getJsCode($mixedIncludeJs);
        }
            
        return $sResult;
    }

    public function getViewBlock($aParams)
    {
        return $this->parseHtmlByName('block_view.html', array(
            'html_id_view_block' => $this->_oConfig->getHtmlIds('view', 'block'),
            'html_id_events' => $this->_oConfig->getHtmlIds('view', 'events'),
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'content' => $this->getPosts($aParams),
            'js_content' => $this->getJsCode('view', array(
                'oRequestParams' => array(
                    'type' => $aParams['type'],
                    'owner_id' => $aParams['owner_id'],
                    'start' => $aParams['start'],
                    'per_page' => $aParams['per_page'],
                    'modules' => $aParams['modules']
                )
            ))
        ));
    }

    public function getSettingsBlock($sDeliveryType, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $iUserId = !empty($aParams['user_id']) ? (int)$aParams['user_id'] : bx_get_logged_profile_id();
        $sGrid = !empty($aParams['grid']) ? $aParams['grid'] : $CNF['OBJECT_GRID_SETTINGS_COMMON'];
        $oTemplate = !empty($aParams['template']) ? $aParams['template'] : $this;

        $oGrid = BxDolGrid::getObjectInstance($sGrid, $oTemplate);
        if(!$oGrid)
            return '';

        $oGrid->setDeliveryType($sDeliveryType);
        if(method_exists($oGrid, 'setUserId'))
            $oGrid->setUserId($iUserId);

        return !$this->_bIsApi ? $oGrid->getCode() : [
            bx_api_get_block('notifications_settings', $oGrid->getCodeApi(true), ['ext' => ['request_url' => '/api.php?r=' . $this->_oConfig->getName() . '/enable_setting/&params[]=']])
        ];
    }

    public function getPosts($aParams)
    {
    	$sJsObject = $this->_oConfig->getJsObject('view');

    	$aParamsDb = $aParams;
    	$aParamsDb['per_page'] = 3 * $aParamsDb['per_page'];

        $aEvents = $this->_oDb->getEvents($aParamsDb);
        if(empty($aEvents))
            return bx_is_api() ? [] : $this->getEmpty();

        if($this->_oConfig->isEventsGrouped())
            $this->_oModule->groupEvents($aEvents);

        $aTmplVarsEvents = array();

        foreach($aEvents as $aEvent) {
            $sEvent = $this->getPost($aEvent, $aParams);
            if(empty($sEvent))
                continue;

            if($this->_bIsApi)
                $aTmplVarsEvents[] = $sEvent;
            else
                $aTmplVarsEvents[] = ['event' => $sEvent];

            if(count($aTmplVarsEvents) >= ($aParams['per_page'] + 1))
            	break;
        }

        if($this->_bIsApi)
            return $aTmplVarsEvents;

        $oPaginate = new BxTemplPaginate([
            'start' => $aParams['start'],
            'per_page' => $aParams['per_page'],
            'page_url' => $this->_oConfig->getViewUrl(),
            'on_change_page' => $sJsObject . ".changePage(this, {start}, {per_page})"
        ]);
        $oPaginate->setNumFromDataArray($aTmplVarsEvents);

        return $this->parseHtmlByName('events.html', [
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'bx_repeat:events' => $aTmplVarsEvents,
            'paginate' => $oPaginate->getSimplePaginate()
        ]);
    }

    /**
     * Enter description here ...
     * @example Available keys are:
     * 1. owner_name and owner_link
     * 2. entry_caption and entry_url
     * 3. subentry_url and subentry_sample
     * 
     */
    public function getPost(&$aEvent, $aBrowseParams = array())
    {
    	$oModule = $this->getModule();

        if(!empty($aEvent['content']) && is_string($aEvent['content']))
            $aEvent['content'] = unserialize($aEvent['content']);

    	if((int)$aEvent['processed'] == 0)
            $this->_processContent($aEvent);

        if((int)$aEvent['processed'] == 0 || empty($aEvent['content']))
            return '';

        $sParamCheck = 'perform_privacy_check';
        if(!isset($aBrowseParams[$sParamCheck]) || $aBrowseParams[$sParamCheck] === true) {
            $sParamCheckFor = 'perform_privacy_check_for';
            $iViewerId = !empty($aBrowseParams[$sParamCheckFor]) ? (int)$aBrowseParams[$sParamCheckFor] : 0;

            $oPrivacyInt = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'));
            if(!$oPrivacyInt->check($aEvent['id'], $iViewerId))
                return '';

            $oPrivacyExt = $this->_oConfig->getPrivacyObject($aEvent['type'] . '_' . $aEvent['action']);
            if($oPrivacyExt !== false && !$oPrivacyExt->check($aEvent['id'], $iViewerId))
                return '';

            $sSrvModule = $this->_oConfig->getContentModule($aEvent);
            $sSrvMethod = 'check_allowed_with_content_for_profile';
            if($sSrvModule && bx_is_srv($sSrvModule, $sSrvMethod) && bx_srv($sSrvModule, $sSrvMethod, ['view', $this->_oConfig->getContentObjectId($aEvent), $iViewerId]) !== CHECK_ACTION_RESULT_ALLOWED)
                return '';
        }

        $bShowRealProfile = !isset($aBrowseParams['show_real_profile']) || $aBrowseParams['show_real_profile'] === true;

        $oAuthor = $oModule->getObjectUser($aEvent['author_id'] ?? 0);
        if(!$bShowRealProfile && $oAuthor instanceof BxDolProfileAnonymous)
            $oAuthor->setShowRealProfile($bShowRealProfile);

        $aEvent['content']['author_name'] = strmaxtextlen($oAuthor->getDisplayName(), $this->_oConfig->getOwnerNameMaxLen());
        $aEvent['content']['author_link'] = $oAuthor->getUrl();
        $aEvent['content']['author_icon'] = $oAuthor->getThumb();

        $oOwner = $oModule->getObjectUser($aEvent['owner_id']);
        if(!$bShowRealProfile && $oOwner instanceof BxDolProfileAnonymous)
            $oOwner->setShowRealProfile($bShowRealProfile);

        $aEvent['content']['owner_name'] = strmaxtextlen($oOwner->getDisplayName(), $this->_oConfig->getOwnerNameMaxLen());
        $aEvent['content']['owner_link'] = $oOwner->getUrl();
        $aEvent['content']['owner_icon'] = $oOwner->getThumb();

        if(!empty($aEvent['content']['entry_caption'])) {
            $sEntryCaption = bx_process_output($aEvent['content']['entry_caption'], BX_DATA_TEXT);
            if(get_mb_substr($sEntryCaption, 0, 1) == '_')
                $sEntryCaption = _t($sEntryCaption);

            $aEvent['content']['entry_caption'] = strmaxtextlen($sEntryCaption, $this->_oConfig->getContentMaxLen());
        }

        $iObjectOwner = (int)$aEvent['object_owner_id'];
        if(empty($iObjectOwner) && !empty($aEvent['content']['entry_author']))
            $iObjectOwner = (int)$aEvent['content']['entry_author'];

        $oObjectOwner = $oModule->getObjectUser($iObjectOwner);
        if($oObjectOwner) {
            if(!$bShowRealProfile && $oObjectOwner instanceof BxDolProfileAnonymous)
                $oObjectOwner->setShowRealProfile($bShowRealProfile);

            $aEvent['content']['object_owner_name'] = strmaxtextlen($oObjectOwner->getDisplayName(), $this->_oConfig->getOwnerNameMaxLen());
            $aEvent['content']['object_owner_link'] = $oObjectOwner->getUrl();
            $aEvent['content']['object_owner_icon'] = $oObjectOwner->getThumb();
        }

        foreach($aEvent['content'] as $sKey => $sValue) {
            if(!is_string($sValue) || substr($sValue, 0, 1) != '_') 
                continue;

            $aCallParams = array($sValue);

            $sKeyParams = $sKey . '_params';
            if(isset($aEvent['content'][$sKeyParams]) && is_array($aEvent['content'][$sKeyParams])) {
                foreach($aEvent['content'][$sKeyParams] as $iParamIndex => $sParamValue)
                    if(is_string($sParamValue) && substr($sParamValue, 0, 1) == '_')
                        $aEvent['content'][$sKeyParams][$iParamIndex] = _t($sParamValue);

                $aCallParams = array_merge($aCallParams, $aEvent['content'][$sKeyParams]);
                unset($aEvent['content'][$sKeyParams]);
            }

            $aEvent['content'][$sKey] = call_user_func_array('_t', $aCallParams);
        }

        $sAuthorUnit = '';
        if(($o = !($oAuthor instanceof BxDolProfileUndefined) ? $oAuthor : $oOwner) !== false)
            $sAuthorUnit = $o->getUnit(0, ['template' => 'unit_wo_info_links']);

        $bEventParsed = false;
        $bEventCanceled = false;

        /**
         * @hooks
         * @hookdef hook-bx_notifications-get_notification 'bx_notifications', 'get_notification' - hook to override notification or even cancel it
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `get_notification`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `browse_params` - [array] browse params array as key&value pairs
         *      - `event` - [array] by ref, event data array, can be overridden in hook processing        
         *      - `event_parsed` - [boolean] by ref, if event was already parsed (ready to display), can be overridden in hook processing
         *      - `event_canceled` - [boolean] by ref, if event was canceled, can be overridden in hook processing
         *      - `owner` - [object] by ref, an instance of owner profile, @see BxDolProfile, can be overridden in hook processing
         *      - `owner_unit` - [string] by ref, profile unit HTML code, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-get_notification
         */
        bx_alert($this->_oConfig->getName(), 'get_notification', 0, 0, [
            'browse_params' => $aBrowseParams,

            'event' => &$aEvent, 
            'event_parsed' => &$bEventParsed, 
            'event_canceled' => &$bEventCanceled,
            'author' => &$oAuthor, 
            'owner' => &$oOwner, 
            'owner_unit' => &$sAuthorUnit,

            'event_ref' => &$aEvent, 
            'event_parsed_ref' => &$bEventParsed, 
            'event_canceled_ref' => &$bEventCanceled,
            'author_ref' => &$oAuthor,
            'owner_ref' => &$oOwner,
            'owner_unit_ref' => &$sAuthorUnit,
        ]);

        if($bEventCanceled)
            return '';

        if(($sGroupedByMac = $aEvent['grouped_by_mac'] ?? false)) {
            $aGroupedByMac = explode(',', $sGroupedByMac);

            $sContentParsed = '';
            foreach($aGroupedByMac as $iSubEventId) {
                $aSubEvent = $this->_oDb->getEntriesBy(['type' => 'id', 'id' => $iSubEventId]);
                if(!$aSubEvent || !is_array($aSubEvent))
                    continue;

                if($sContentParsed && ($sK = 'content') && ($sEc = $aSubEvent[$sK] ?? '') && is_string($sEc)) {
                    $aSubEvent[$sK] = unserialize($sEc);
                    $aSubEvent[$sK]['author_name_wrapped'] = _t('_bx_ntfs_txt_and');
                }

                $this->getPost($aSubEvent);

                if(($sCp = $aSubEvent['content_parsed'] ?? false))
                    $sContentParsed .= ' ' . $sCp;
            }

            if($sContentParsed) {
                $aEvent['content_parsed'] = $sContentParsed;
                $bEventParsed = true;
            }
        }

        if(!$bEventParsed) {
            $mLk = '';
            if(!empty($aEvent['content']['lang_key'])) {
                $mLk = $aEvent['content']['lang_key'];
                if(!is_string($mLk) && !(is_array($mLk) && isset($mLk['site'], $mLk['email'], $mLk['push'])))
                    $mLk = '';
            }

            if(empty($mLk))
                $mLk = $this->_getContentLangKey($aEvent);

            if(is_array($mLk))
                foreach($mLk as $sDeliveryType => $sLangKey)
                    $aEvent['content_parsed'][$sDeliveryType] = $this->_parseContentLangKey($sLangKey, $aEvent);
            else
                $aEvent['content_parsed'] = $this->_parseContentLangKey($mLk, $aEvent);
        }

        // returns parsed content for React Jot
        if(isset($aBrowseParams['return_parsed_content']))
            return $aEvent;

        $bClickedIndicator = $this->_oConfig->isClickedIndicator();
        $sJsObject = $this->_oConfig->getJsObject('view');

        if($this->_bIsApi) {
            $aEvent['author_data'] = BxDolProfile::getData($aEvent['author_id']);

            $aLinks = [
                'author_link' => $aEvent['content']['author_link'],
                'owner_link' => $aEvent['content']['owner_link'],
                'object_owner_link' => $aEvent['content']['object_owner_link']
            ];

            foreach(['entry_url', 'entry_url_api', 'subentry_url', 'subentry_url_api'] as $sKey)
                if(!empty($aEvent['content'][$sKey]))
                    $aLinks[$sKey] = $this->_getLink($aEvent['content'][$sKey]);

            array_walk($aLinks, function(&$sValue, $sKey) {
                $sValue = bx_api_get_relative_url($sValue);
            });

            $aEvent['module'] = $aEvent['type'];
            if(!$this->_oDb->isModuleByName($aEvent['module'])) {
                if(!isset($aEvent['content']['module'])) {
                    if(($s = $aEvent['source'] ?: '') || ($s = $aEvent['type']))
                        $aEvent['module'] = substr($s, 0, strrpos($s, '_'));
                }
                else
                    $aEvent['module'] = $aEvent['content']['module'];
            }

            $aEvent['content'] = array_merge($aEvent['content'], $aLinks);
            $aEvent['content'] = array_intersect_key($aEvent['content'], array_flip([
                'entry_url', 'entry_url_api', 'subentry_url', 'subentry_url_api'
            ]));

            if(($sKey = 'content_parsed') && is_array($aEvent[$sKey])) {
                foreach($aEvent[$sKey] as $sDeliveryType => $sContentParsed)
                    $aEvent[$sKey][$sDeliveryType] = html_entity_decode($sContentParsed);
            }
            else    
                $aEvent[$sKey] = html_entity_decode($aEvent[$sKey]);

            return array_intersect_key($aEvent, array_flip([
                'id', 'author_id', 'author_data', 'owner_id', 'module', 'type', 'content', 'content_parsed', 'date'
            ]));
        }

        return $this->parseHtmlByName('event.html', [
            'html_id' => $this->_oConfig->getHtmlIds('view', 'event') . $aEvent['id'],
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'js_object' => $sJsObject,
            'class' => !empty($aBrowseParams['last_read']) && $aEvent['id'] > $aBrowseParams['last_read'] ? ' bx-def-color-bg-box-active' : '', 
            'id' => $aEvent['id'],
            'author_unit' => $sAuthorUnit,
            'link' => $this->_getContentLink($aEvent),
            'content' => is_array($aEvent['content_parsed']) && isset($aEvent['content_parsed']['site']) ? $aEvent['content_parsed']['site'] : $aEvent['content_parsed'],
            'date' => bx_time_js($aEvent['date']),
            'bx_if:show_onclick' => [
                'condition' => $bClickedIndicator,
                'content' => [
                    'js_object' => $sJsObject,
                    'id' => $aEvent['id']
                ]
            ],
            'bx_if:show_clicked_indicator' => [
                'condition' => $bClickedIndicator && (!isset($aEvent['clicked']) || (int)$aEvent['clicked'] == 0),
                'content' => []
            ],
        ]);
    }

    public function getNotificationEmail($iRecipient, &$aEvent)
    {
        $sEvent = $this->getPost($aEvent, ['perform_privacy_check_for' => $iRecipient, 'show_real_profile' => false]);
        if(empty($sEvent) || empty($aEvent['content_parsed']))
            return false;

        $aContent = &$aEvent['content'];

        $sIconUrl = !empty($aContent['owner_icon']) ? $aContent['owner_icon'] : $this->getIconUrl('std-icon.svg');
        $sContentUrl = bx_absolute_url($this->_getContentLink($aEvent, getParam('sys_api_url_root_email') != ''));
        $sContent = is_array($aEvent['content_parsed']) && isset($aEvent['content_parsed']['email']) ? $aEvent['content_parsed']['email'] : $aEvent['content_parsed'];
        $sSummary = (($sK = 'subentry_summary') && ($sV = $aContent[$sK] ?? false)) || (($sK = 'entry_summary') && ($sV = $aContent[$sK] ?? false)) ? $sV : '';
        $sDate = bx_process_output($aEvent['date'], BX_DATA_DATE_TS);

        $aEtemplate = $this->_oDb->getEtemplates([
            'sample' => 'type_action', 
            'type' => $aEvent['type'], 
            'action' => $aEvent['action'], 
            'active' => 1
        ]);

        $sSubject = $sBody = '';
        if(!empty($aEtemplate) && is_array($aEtemplate)) {
            $aEtParams = array_diff_key($aContent, array_flip(['lang_key', 'settings']));
            $aEtParams = array_merge($aEtParams, [
                'icon_url' => $sIconUrl,
                'content_url' => $sContentUrl,
                'content' => $sContent,
                'summary' => $sSummary,
                'date' => $sDate
            ]);

            $sSubject = bx_replace_markers($aEtemplate['subject'], $aEtParams);
            $sBody = bx_replace_markers($aEtemplate['body'], $aEtParams);
        }
        else {
            $sSubject = $sContent;
            $sBody = $this->parseHtmlByName('et_new_event.html', [
                'icon_url' => $sIconUrl,
                'content_url' => $sContentUrl,
                'content' => $sContent,
                'date' => $sDate,
                'bx_if:show_summary' => [
                    'condition' => !empty($sSummary),
                    'content' => [
                        'summary' => $sSummary
                    ]
                ]
            ]);
        }

        if(($iEmailSubjectMaxLen = $this->_oConfig->getEmailSubjectMaxLen()) !== 0)
            $sSubject = strmaxtextlen($sSubject, $iEmailSubjectMaxLen);
        else 
            $sSubject = trim(strip_tags($sSubject));

        return [
            'subject' => $sSubject,
            'content' => $sBody,
            'settings' => !empty($aContent['settings']['email']) ? $aContent['settings']['email'] : []
        ];
    }

    public function getNotificationPush($iRecipient, &$aEvent)
    {
        $sEvent = $this->getPost($aEvent, array('perform_privacy_check_for' => $iRecipient, 'show_real_profile' => false));
        if(empty($sEvent) || empty($aEvent['content_parsed']))
            return false;

        $sMessage = is_array($aEvent['content_parsed']) && isset($aEvent['content_parsed']['push']) ? $aEvent['content_parsed']['push'] : $aEvent['content_parsed'];
        $sMessage = preg_replace('/<\/?[a-zA-Z0-9=\'":;\(\)\s_-]+>/i', ($sChar = getParam("bx_ntfs_option_tag_to_char_push")) !== false ? $sChar : '"', $sMessage);
        if($sMessage)
            $sMessage = BxTemplFunctions::getInstance()->getStringWithLimitedLength(html_entity_decode($sMessage), $this->_oConfig->getPushMaxLen());

        if(empty($sMessage))
            return false;

        $aContent = &$aEvent['content'];
        return array(
            'content' => array(
                'url' => bx_absolute_url($this->_getContentLink($aEvent, getParam('sys_api_url_root_push') != '')),
                'message' => $sMessage,
                'icon' => !empty($aContent['owner_icon']) ? $aContent['owner_icon'] : ''
            ),
            'settings' => !empty($aContent['settings']['push']) ? $aContent['settings']['push'] : array()
        );
    }

    public function getEmpty($bVisible = true)
    {
        return $this->parseHtmlByName('empty.html', array(
            'style_prefix' => $this->_oConfig->getPrefix('style'),
            'visible' => $bVisible ? 'block' : 'none',
            'content' => MsgBox(_t('_bx_ntfs_txt_msg_no_results'))
        ));
    }

    public function getSelectActions($aActions)
    {
        $aTmplVarsActions = [
            ['value' => '', 'title' => _t('_sys_please_select')]
        ];

        foreach($aActions as $sAction)
            $aTmplVarsActions[] = ['value' => $sAction, 'title' => $this->getActionTitle($sAction)];

        return $this->parseHtmlByName('field_actions.html', [
            'bx_repeat:actions' => $aTmplVarsActions
        ]);
    }

    public function getTypeTitle($sType)
    {
        $sResult = '';
        if(($sKey = '_bx_ntfs_alert_module_' . $sType) && ($_sKey = _t($sKey)) && strcmp($sKey, $_sKey) != 0)
            $sResult = $_sKey;
        else if(($sKey = '_' . $sType) && ($_sKey = _t($sKey)) && strcmp($sKey, $_sKey) != 0)
            $sResult = $_sKey;
        else if(($aModule = $this->_oDb->getModuleByName($sType)) && is_array($aModule) && ($_sKey = $aModule['title'] ?? false))
            $sResult = $_sKey;
        else
            $sResult = $sType;

        return $sResult;
    }

    public function getActionTitle($sAction)
    {
        $sResult = '';
        if(($sKey = '_bx_ntfs_alert_action_' . $sAction) && ($_sKey = _t($sKey)) && strcmp($sKey, $_sKey) != 0)
            $sResult = $_sKey;
        else if(($sKey .= '_personal') && ($_sKey = _t($sKey)) && strcmp($sKey, $_sKey) != 0)
            $sResult = $_sKey;
        else
            $sResult = $sAction;

        return $sResult;
    }

    protected function _processContent(&$aEvent)
    {
    	$aContent = $this->_getContent($aEvent);
        if(empty($aContent) || !is_array($aContent)) 
            return;

        /**
         * @hooks
         * @hookdef hook-bx_notifications-get_content 'bx_notifications', 'get_content' - hook to override notification content
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `get_content`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `event` - [array] by ref, event data array, can be overridden in hook processing        
         *      - `override_result` - [array] by ref, event content array, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-get_content
         */
        bx_alert($this->_oConfig->getName(), 'get_content', 0, 0, [
            'event' => $aEvent,
            'override_result' => &$aContent
        ]);

        $aSet = array();
        if(!empty($aContent['entry_author'])) {
            $aSet['object_owner_id'] = (int)$aContent['entry_author'];
            unset($aContent['entry_author']);
        }

        if(!empty($aContent['entry_privacy'])) {
            $aSet['allow_view_event_to'] = $aContent['entry_privacy'];
            $aEvent['allow_view_event_to'] = $aContent['entry_privacy'];
            unset($aContent['entry_privacy']);
        }

        foreach(['entry_summary', 'subentry_summary'] as $sKey) {
            if(empty($aContent[$sKey]))
                continue;

            $sSummary = nl2br(strip_tags($aContent[$sKey]));
            $aContent[$sKey] = strmaxtextlen($sSummary, $this->_oConfig->getSummaryMaxLen());
        }

        if(!empty($aEvent['content'])) {
            if(is_string($aEvent['content']))
                $aEvent['content'] = unserialize($aEvent['content']);

            if(is_array($aEvent['content']))
                $aEvent['content'] = array_merge($aEvent['content'], $aContent);
        }
        else
            $aEvent['content'] = $aContent;

        $aEvent['processed'] = 1;

        $aSet = array_merge($aSet, array(
            'content' => serialize($aEvent['content']), 
            'processed' => 1
        ));

        $this->_oDb->updateEvent($aSet, array('id' => $aEvent['id']));
        return;
    }

    protected function _getContent(&$aEvent)
    {
        $sHandler = $aEvent['type'] . '_' . $aEvent['action'];
        if(!$this->_oConfig->isHandler($sHandler))
            return array();

        $aHandler = $this->_oConfig->getHandlers($sHandler);
        if(!empty($aHandler['module_name']) && !empty($aHandler['module_class']) && !empty($aHandler['module_method']))
            return BxDolService::call($aHandler['module_name'], $aHandler['module_method'], array($aEvent), $aHandler['module_class']);

        $sMethod = 'display' . bx_gen_method_name($aHandler['alert_unit'] . '_' . $aHandler['alert_action']);
        if(!method_exists($this, $sMethod))
            return array();

        return $this->$sMethod($aEvent);
    }

    protected function _getContentLangKey(&$aEvent)
    {
        $bInContext = $this->_isInContext($aEvent);

        if(!empty($aEvent['subobject_id']))
            return '_bx_ntfs_txt_subobject_added' . ($bInContext ? '_in_context' : '');

        $sKey = '';
        switch($aEvent['action']) {
            case 'pending_approval':
                $sKey = '_bx_ntfs_txt_object_pending_approval';
                break;

            case 'reported_content':
                $sKey = '_bx_ntfs_txt_object_reported_content';
                break;

            case 'publish_failed':
                $sKey = '_bx_ntfs_txt_object_publish_failed';
                break;

            case 'publish_succeeded':
                $sKey = '_bx_ntfs_txt_object_publish_succeeded';
                break;

            default:
                $sKey = '_bx_ntfs_txt_object_' . $aEvent['action'] . ($bInContext ? '_in_context' : '');
        }

    	return $sKey;
    }

    protected function _parseContentLangKey($sLangKey, &$aEvent)
    {
        $aMarkers = array_diff_key($aEvent['content'], array_flip([
            'lang_key', 'settings'
        ]));

        $aPreparsed = [];
        if(($sK = 'author_name_wrapped') && !isset($aMarkers[$sK]))
            $aPreparsed[$sK] = _t('_bx_ntfs_txt_author_name_wrapped');
        if(($sK = 'owner_name_wrapped') && !isset($aMarkers[$sK]))
            $aPreparsed[$sK] = _t('_bx_ntfs_txt_owner_name_wrapped');

        if($aPreparsed)
            $aMarkers = array_merge($aMarkers, bx_replace_markers($aPreparsed, $aMarkers));

        return bx_replace_markers(_t($sLangKey), $aMarkers);
    }

    protected function _getContentLink($aEvent, $bForApi = false)
    {
        $sLink = $aEvent['content']['entry_url' . ($bForApi ? '_api' : '')] ?? $aEvent['content']['entry_url'];
        if(!empty($aEvent['subobject_id']) && !empty($aEvent['content']['subentry_url'])) 
            $sLink = $aEvent['content']['subentry_url' . ($bForApi ? '_api' : '')] ?? $aEvent['content']['subentry_url'];

        return $this->_getLink($sLink);
    }

    protected function _getLink($sLink)
    {
        return bx_replace_markers($sLink, [
            'bx_url_root' => BX_DOL_URL_ROOT
        ]);
    }

    protected function _isInContext(&$aEvent)
    {
        return (int)$aEvent['object_privacy_view'] < 0;
    }
}

/** @} */
