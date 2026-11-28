<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Groups Groups
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxBaseModGroupsConnectionFans extends BxTemplConnection
{
    protected $_sModule;
    protected $_oModule;

    protected $_bQuestionnaire;

    protected $_bBan;
    protected $_oBanConnection;

    public function __construct($aObject)
    {
        parent::__construct($aObject);

        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_bQuestionnaire = false;

        $this->_bBan = false;
        $this->_oBanConnection = null;

        $this->_aT = array_merge($this->_aT, [
            'do_initiator' => $this->_getLKey('menu_item_title_sm_fans'),
            'do_content' => $this->_getLKey('menu_item_title_sm_fans_respond'),
            'counter' => $this->_getLKey('menu_item_title_sm_members')
        ]);
    }

    public function init()
    {
        if($this->_bBan)
            $this->_oBanConnection = BxDolConnection::getObjectInstance('sys_profiles_bans');
    }

    public function getModule()
    {
        return $this->_sModule;
    }

    public function checkAllowedAddConnection($iInitiator, $iContent, $isPerformAction = false, $isMutual = false, $isInvertResult = false, $isSwap = false, $isCheckExists = true)
    {
        if($this->_bBan && $this->_oBanConnection->isConnected($iContent, $iInitiator))
            return _t('_sys_txt_access_denied');

        return $this->checkAllowedConnect ($iInitiator, $iContent, $isPerformAction, $isMutual, $isInvertResult, $isSwap, $isCheckExists);
    }

    public function actionRemove($iContent = 0, $iInitiator = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aResult = parent::actionRemove($iContent, $iInitiator);
        if($this->_bQuestionnaire && $aResult['err'] == false) {
            if(!$iContent)
                $iContent = bx_process_input($_POST['id'], BX_DATA_INT);

            $aContentInfo = $this->_oModule->_oDb->getContentInfoByProfileId($iContent);
            if(!empty($aContentInfo) && is_array($aContentInfo))
                $this->_oModule->_oDb->deleteAnswersProfileId($aContentInfo[$CNF['FIELD_ID']], $iInitiator ? $iInitiator : bx_get_logged_profile_id());
        }

        return $aResult;
    }

    public function actionReject ($iInitiator = 0, $iContent = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aResult = parent::actionReject($iInitiator, $iContent);
        if($this->_bQuestionnaire && $aResult['err'] == false) {
            if(!$iContent)
                $iContent = bx_process_input($_POST['id'], BX_DATA_INT);

            $aContentInfo = $this->_oModule->_oDb->getContentInfoByProfileId($iContent);
            if(!empty($aContentInfo) && is_array($aContentInfo))
                $this->_oModule->_oDb->deleteAnswersProfileId($aContentInfo[$CNF['FIELD_ID']], $iInitiator ? $iInitiator : bx_get_logged_profile_id());
        }

        return $aResult;
    }

    public function hasQuestionnaire($iContentProfileId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        
        if(!$this->_bQuestionnaire || empty($CNF['FIELD_JOIN_CONFIRMATION']))
            return false;

        $aContentInfo = $this->_oModule->_oDb->getContentInfoByProfileId($iContentProfileId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return false;

        return (int)$aContentInfo[$CNF['FIELD_JOIN_CONFIRMATION']] != 0 && $this->_oModule->_oDb->hasQuestions($aContentInfo[$CNF['FIELD_ID']]);
    }
    
    public function isQuestionnaireAnswered($iContentProfileId, $iProfileId = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId)
            return false;

        if(!$this->_bQuestionnaire || empty($CNF['FIELD_JOIN_CONFIRMATION']))
            return false;

        $aContentInfo = $this->_oModule->_oDb->getContentInfoByProfileId($iContentProfileId);
        if(empty($aContentInfo) || !is_array($aContentInfo))
            return false;

        return (int)$aContentInfo[$CNF['FIELD_JOIN_CONFIRMATION']] != 0 && $this->_oModule->_oDb->areQuestionsAnswered($aContentInfo[$CNF['FIELD_ID']], $iProfileId);
    }

    public function getQuestionnaireForm($sAction, $iContentProfileId, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        
        if(!$this->_bQuestionnaire)
            return false;

        if(empty($aParams['request']) || !is_array($aParams['request']))
            $aParams['request'] = [];

        $aForm = [
            'form_attrs' => [
                'id' => $this->_oModule->getName() . '_questionnaire',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params($this->_oModule->_oConfig->getBaseUri() . 'get_questionnaire', array_merge([
                    'o' => $this->_sObject, 
                    'a' => $sAction, 
                    'cpi' => $iContentProfileId
                ], $aParams['request']))
            ],
            'params' => [
                'db' => [
                    'table' => $CNF['TABLE_ANSWERS'],
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ],
                'module' => $this->_sModule,
                'object' => $this->_sModule . '_questionnaire',
                'display' => $this->_sModule . '_questionnaire_answer',
                'view_mode' => 0,
            ],
            'inputs' => []
        ];

        $aQuestions = $this->_oModule->_oDb->getQuestions(['sample' => 'content_pid', 'content_pid' => $iContentProfileId]);
        if(empty($aQuestions) || !is_array($aQuestions))
            return false;

        foreach($aQuestions as $aQuestion) {
            $sName = 'question_' . $aQuestion['id'];

            $aForm['inputs'][$sName] = [
                'type' => 'text',
                'name' => $sName,
                'caption' => $aQuestion['question'],
                'value' => '',
                'required' => '1',
                'checker' => [
                    'func' => 'Avail',
                    'params' => [],
                    'error' => _t($CNF['T']['form_qnr_field_qn_err']),
                ],
                'db' => [
                    'pass' => 'Xss',
                ],
            ];
        }

        $aForm['inputs']['controls'] = [
            'name' => 'controls',
            'type' => 'input_set', [
                'type' => 'submit',
                'name' => 'do_submit',
                'value' => _t('_Submit'),
            ], [
                'type' => 'reset',
                'name' => 'close',
                'value' => _t('_Cancel'),
                'attrs' => [
                    'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                    'class' => 'bx-def-margin-sec-left',
                ],
            ]
        ];

    	return new BxTemplFormView($aForm);
    }

    protected function _checkAllowedConnectInitiator ($oInitiator, $isPerformAction = false)
    {
        if(!bx_srv($oInitiator->getModule(), 'act_as_profile'))
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::_checkAllowedConnectInitiator($oInitiator, $isPerformAction);
    }

    protected function _checkAllowedConnectContent ($oContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(bx_srv($oContent->getModule(), 'act_as_profile'))
            return CHECK_ACTION_RESULT_ALLOWED;

        if(!empty($CNF['OBJECT_PRIVACY_VIEW']) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false) {
            $iContentId = $oContent->getContentId();
            $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);

            if(in_array($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']], array_merge($oPrivacy->getPartiallyVisiblePrivacyGroups(), ['s'])))
                return CHECK_ACTION_RESULT_ALLOWED;
        }

        return parent::_checkAllowedConnectContent($oContent);
    }

    /**
     * The toggle's state and actions. With `show_do_label_short` (a card, where the button sits under the name of
     * what is joined) the wording is the card's: "Join", then "Request sent" with Cancel in its menu, "Invited" with
     * Accept and Decline, or "Joined" with Leave; a module can have its own words (an event: "Attend", "Going").
     */
    protected function _getActions($iInitiator, $iContent, $aParams = [])
    {
        $bShort = isset($aParams['show_do_label_short']) && (bool)$aParams['show_do_label_short'] === true;

        $sName = $sTitle = '';
        $aActions = [];

        /*
         * An empty array item shows the items in a popup, under the button with the state.
         */
        if($this->isConnectedNotMutual($iInitiator, $iContent)) {
            $aActions = [[
                'name' => 'remove',
                'title' => $this->_getLKey('menu_item_title_sm_leave_cancel')
            ]];
            if($bShort) {
                $sName = 'default';
                $sTitle = $this->_getLKey('menu_item_title_sm_join_requested_short');
                $aActions[] = [];
            }
        }
        else if($this->isConnectedNotMutual($iContent, $iInitiator)) {
            $sName = 'add';
            $sTitle = $bShort ? $this->_getLKey('menu_item_title_sm_join_invited') : $this->_aT['do_content'];
            $aActions = [[
                'name' => 'add',
                'title' => $this->_getLKey($bShort ? 'menu_item_title_sm_join_accept' : 'menu_item_title_sm_join_confirm')
            ], [
                'name' => 'remove',
                'title' => $this->_getLKey($bShort ? 'menu_item_title_sm_join_decline' : 'menu_item_title_sm_leave_reject')
            ]];
        }
        else if($this->isConnected($iInitiator, $iContent, true)) {
            $sName = 'default';
            $sTitle = $bShort ? $this->_getLKey('menu_item_title_sm_joined') : $this->_aT['do_initiator'];
            $aActions = [[
                'name' => 'remove',
                'title' => $this->_getLKey('menu_item_title_sm_leave')
            ], []];
        }
        else {
            $aActions = [[
                'name' => 'add',
                'title' => $this->_getLKey($bShort ? 'menu_item_title_sm_join_short' : 'menu_item_title_sm_join')
            ]];
        }

        return [
            'name' => $sName,
            'title' => $sTitle,
            'items' => $aActions
        ];
    }

    protected function _getActionIconAsIcon($sAction)
    {
        $sDefault = 'users';

        $aA2I = [
            'add' => 'sign-in-alt',
            'remove' => 'sign-out-alt'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getActionIconAsEmoji($sAction)
    {
        $sDefault = '🔄';

        $aA2I = [
            'add' => '✅️️',
            'remove' => '❎'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getActionIconAsImage($sAction)
    {
        $sDefault = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-round-icon lucide-users-round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>';

        $aA2I = [
            'add' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-in-icon lucide-log-in"><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
            'remove' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out-icon lucide-log-out"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>'
        ];

        return isset($aA2I[$sAction]) ? $aA2I[$sAction] : $sDefault;
    }

    protected function _getLKey($sKey, $bTranslate = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sLKey = !empty($CNF['T'][$sKey]) ? $CNF['T'][$sKey] : '_sys_' . $sKey;
        return $bTranslate ? _t($sLKey) : $sLKey;
    }

    protected function _getTriggerObject($sType, $iInitiator, $iContent)
    {
        if(($oInitiator = BxDolProfile::getInstance($iInitiator)) !== false && ($sModule = $oInitiator->getModule()))
            if(($sModule == $this->_sModule && $sType == BX_CONNECTIONS_TRIGGER_TYPE_CONTENT) || ($sModule != $this->_sModule && $sType == BX_CONNECTIONS_TRIGGER_TYPE_INITIATOR))
                return $oInitiator->getContentId();

        if(($oContent = BxDolProfile::getInstance($iContent)) !== false && ($sModule = $oContent->getModule())  == $this->_sModule)
            if(($sModule == $this->_sModule && $sType == BX_CONNECTIONS_TRIGGER_TYPE_CONTENT) || ($sModule != $this->_sModule && $sType == BX_CONNECTIONS_TRIGGER_TYPE_INITIATOR))
                return $oContent->getContentId();

        return false;
    }
}

/** @} */
