<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Feedback Feedback
 * @ingroup     UnaModules
 *
 * @{
 */

class BxFdbModule extends BxBaseModGeneralModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function actionAnswer()
    {
        $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId)
            return echoJson(array('code' => 1, 'msg' => _t('_bx_feedback_err_login_required')));

        $iQuestionId = (int)bx_get('question_id');
        $iAnswerId = (int)bx_get('answer_id');
        if(empty($iQuestionId) || empty($iAnswerId))
            return echoJson(array('code' => 2, 'msg' => _t('_bx_feedback_err_wrong_data')));

        if(($iAnswerIdOld = $this->_oDb->isAnswer($iQuestionId, $iProfileId)) !== false)
            if($this->_oDb->undoAnswer($iAnswerIdOld, $iProfileId)) 
                $this->onDeleteAnswer($iQuestionId, $iAnswerIdOld, $iProfileId);

        $sText = bx_process_input(bx_get('text'));
        if(!$this->_oDb->doAnswer($iAnswerId, $iProfileId, $sText))
            return echoJson(array('code' => 3, 'msg' => _t('_bx_feedback_err_cannot_perform')));

        $this->onAddAnswer($iQuestionId, $iAnswerId, $iProfileId, array(
            'text' => $sText
        ));

        return echoJson(array(
            'code' => 0
        ));
    }

    public function serviceGetInfoAnswer ($iContentId)
    {
        $aAnswer = $this->_oDb->getAnswers(array('type' => 'id', 'id' => $iContentId));
        if(empty($aAnswer) || !is_array($aAnswer))
            return array();

        return $aAnswer;
    }

    public function serviceGetBlockQuestion()
    {
        $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId)
            return '';

        $aQuestion = $this->_oDb->getQuestions(array('type' => 'actual'));
        if(empty($aQuestion) || !is_array($aQuestion))
            return '';

        $aAnswers = $this->_oDb->getAnswers(array('type' => 'question_id_for_profile', 'question_id' => $aQuestion['id'], 'profile_id' => $iProfileId));
        if(empty($aAnswers) || !is_array($aAnswers))
            return '';

        return $this->_oTemplate->getBlockQuestion($aQuestion, $aAnswers);
    }


    /**
     * Integration methods.
     * 
     * Integration: Timeline.
     */
    public function serviceGetTimelineData()
    {
    	$sModule = $this->getName();

        return array(
            'handlers' => array(
                array('group' => $sModule . '_question', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'added_question', 'module_name' => $sModule, 'module_method' => 'get_timeline_question', 'module_class' => 'Module',  'groupable' => 0, 'group_by' => ''),
                array('group' => $sModule . '_question', 'type' => 'update', 'alert_unit' => $sModule, 'alert_action' => 'edited_question'),
                array('group' => $sModule . '_question', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'deleted_question'),
                
                array('group' => $sModule . '_answer', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'added_answer', 'module_name' => $sModule, 'module_method' => 'get_timeline_answer', 'module_class' => 'Module',  'groupable' => 0, 'group_by' => ''),
                array('group' => $sModule . '_answer', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'deleted_answer')
            ),
            'alerts' => array(
                array('unit' => $sModule, 'action' => 'added_question'),
                array('unit' => $sModule, 'action' => 'edited_question'),
                array('unit' => $sModule, 'action' => 'deleted_question'),

                array('unit' => $sModule, 'action' => 'added_answer'),
                array('unit' => $sModule, 'action' => 'deleted_answer'),
            )
        );
    }

    public function serviceGetTimelineQuestion($aEvent, $aBrowseParams = array())
    {
        $aQuestion = $this->_oDb->getQuestions(array('type' => 'id', 'id' => $aEvent['object_id']));
        if(empty($aQuestion) || !is_array($aQuestion))
            return false;

        $CNF = &$this->_oConfig->CNF;

        if(($aQuestion[$CNF['FIELD_STATUS_ADMIN']] != 'active'))
            return false;

        $iUserId = $this->getUserId();
        $iAuthorId = (int)$aQuestion[$CNF['FIELD_AUTHOR']];
        $iAuthorIdAbs = abs($iAuthorId);
        if($iAuthorId < 0 && ((is_numeric($aEvent['owner_id']) && $iAuthorIdAbs == (int)$aEvent['owner_id']) || (is_array($aEvent['owner_id']) && in_array($iAuthorIdAbs, $aEvent['owner_id']))) && $iAuthorIdAbs != $iUserId)
            return false;

        //--- Title & Description
        $sTitle = !empty($aQuestion[$CNF['FIELD_TEXT']]) ? $aQuestion[$CNF['FIELD_TEXT']] : '';

        $iOwnerId = $iAuthorIdAbs;
        if(isset($aEvent['object_privacy_view']) && (int)$aEvent['object_privacy_view'] < 0)
            $iOwnerId = abs($aEvent['object_privacy_view']);

        $bCache = true;
        $aContent = $this->_getContentForTimelineQuestion($aEvent, $aQuestion, $aBrowseParams);
        if(isset($aContent['_cache'])) {
            $bCache = (bool)$aContent['_cache'];

            unset($aContent['_cache']);
        }

        return array(
            '_cache' => $bCache,
            'owner_id' => $iOwnerId,
            'object_owner_id' => $iOwnerId,
            'icon' => !empty($CNF['ICON']) ? $CNF['ICON'] : '',
            'sample' => isset($CNF['T']['txt_sample_question_single_with_article']) ? $CNF['T']['txt_sample_question_single_with_article'] : $CNF['T']['txt_sample_single'],
            'sample_wo_article' => $CNF['T']['txt_sample_question_single'],
            'sample_action' => isset($CNF['T']['txt_sample_question_action']) ? $CNF['T']['txt_sample_question_action'] : '',
            'url' => BX_DOL_URL_ROOT,
            'content' => $aContent, //a string to display or array to parse default template before displaying.
            'allowed_view' => array('module' => $this->getName(), 'method' => 'get_timeline_question_allowed_view'),
            'date' => $aQuestion[$CNF['FIELD_ADDED']],
            'title' => $sTitle, //may be empty.
            'description' => '' //may be empty.
        );
    }

    public function serviceGetTimelineQuestionAllowedView($aEvent)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    public function serviceGetTimelineAnswer($aEvent, $aBrowseParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $iOwnerId = (int)$aEvent['owner_id'];

        $aAnswer = $this->_oDb->getAnswers(array('type' => 'id_for_profile', 'id' => $aEvent['object_id'], 'profile_id' => $iOwnerId));
        if(empty($aAnswer) || !is_array($aAnswer) || ($this->_oConfig->isModeNio() && (int)$aAnswer[$CNF['FIELD_ANS_IMPORTANT']] == 0))
            return false;

        $aQuestion = $this->_oDb->getQuestions(array('type' => 'id', 'id' => $aAnswer['question_id']));
        if(empty($aQuestion) || !is_array($aQuestion))
            return false;

        if(($aQuestion[$CNF['FIELD_STATUS_ADMIN']] != 'active'))
            return false;

        //--- Title & Description
        $sTitle = !empty($aAnswer[$CNF['FIELD_ANS2USR_TEXT']]) ? $aAnswer[$CNF['FIELD_ANS2USR_TEXT']] : '';

        $bCache = true;
        $aContent = $this->_getContentForTimelineAnswer($aEvent, $aQuestion, $aAnswer, $aBrowseParams);
        if(isset($aContent['_cache'])) {
            $bCache = (bool)$aContent['_cache'];

            unset($aContent['_cache']);
        }

        return array(
            '_cache' => $bCache,
            'owner_id' => $iOwnerId,
            'object_owner_id' => $iOwnerId,
            'icon' => !empty($CNF['ICON']) ? $CNF['ICON'] : '',
            'sample' => isset($CNF['T']['txt_sample_answer_single_with_article']) ? $CNF['T']['txt_sample_answer_single_with_article'] : $CNF['T']['txt_sample_single'],
            'sample_wo_article' => $CNF['T']['txt_sample_answer_single'],
            'sample_action' => isset($CNF['T']['txt_sample_answer_action']) ? $CNF['T']['txt_sample_answer_action'] : '',
            'url' => BX_DOL_URL_ROOT,
            'content' => $aContent, //a string to display or array to parse default template before displaying.
            'allowed_view' => array('module' => $this->getName(), 'method' => 'get_timeline_answer_allowed_view'),
            'date' => $aAnswer[$CNF['FIELD_ADDED']],
            'title' => $sTitle, //may be empty.
            'description' => '' //may be empty.
        );
    }

    public function serviceGetTimelineAnswerAllowedView($aEvent)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Integration: Notifications.
     */
    public function serviceGetNotificationsData()
    {
    	$sModule = $this->getName();

        $aResult = array(
            'handlers' => array(
                array('group' => $sModule . '_question', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'added_question', 'module_name' => $sModule, 'module_method' => 'get_notifications_question', 'module_class' => 'Module', 'module_event_privacy' => ''),
                array('group' => $sModule . '_question', 'type' => 'update', 'alert_unit' => $sModule, 'alert_action' => 'edited_question'),
                array('group' => $sModule . '_question', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'deleted_question'),

                array('group' => $sModule . '_answer', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'added_answer_notif', 'module_name' => $sModule, 'module_method' => 'get_notifications_answer', 'module_class' => 'Module', 'module_event_privacy' => ''),
                array('group' => $sModule . '_answer', 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'deleted_answer_notif'),
            ),
            'settings' => array(
                array('group' => 'content', 'unit' => $sModule, 'action' => 'added_question', 'types' => array('follow_member')),
                array('group' => 'content', 'unit' => $sModule, 'action' => 'added_answer_notif', 'types' => array('follow_member'))
            ),
            'alerts' => array(
                array('unit' => $sModule, 'action' => 'added_question'),
                array('unit' => $sModule, 'action' => 'edited_question'),
                array('unit' => $sModule, 'action' => 'deleted_question'),

                array('unit' => $sModule, 'action' => 'added_answer_notif'),
                array('unit' => $sModule, 'action' => 'deleted_answer_notif')
            )
        );

        return $aResult;
    }

    public function serviceGetNotificationsQuestion($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $aQuestion = $this->_oDb->getQuestions(array('type' => 'id', 'id' => $aEvent['object_id']));
        if(empty($aQuestion) || !is_array($aQuestion) || $aQuestion[$CNF['FIELD_STATUS_ADMIN']] != 'active')
            return array();

        $sEntryUrl = '{bx_url_root}';
        $sEntryCaption = strmaxtextlen($aQuestion[$CNF['FIELD_TEXT']], 20, '...');

        return array(
            'entry_sample' => $CNF['T']['txt_sample_question_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $sEntryCaption,
            'entry_author' => $aQuestion[$CNF['FIELD_AUTHOR']]
        );
    }

    public function serviceGetNotificationsAnswer($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $iOwnerId = (int)$aEvent['owner_id'];
        $oOwnerProfile = BxDolProfile::getInstance($iOwnerId);
        if(!$oOwnerProfile)
            return array();

        $aQuestion = $this->_oDb->getQuestions(array('type' => 'id', 'id' => $aEvent['object_id']));
        if(empty($aQuestion) || !is_array($aQuestion) || $aQuestion[$CNF['FIELD_STATUS_ADMIN']] != 'active')
            return array();

        $aAnswer = $this->_oDb->getAnswers(array('type' => 'id_for_profile', 'id' => $aEvent['subobject_id'], 'profile_id' => $iOwnerId));
        if(empty($aAnswer) || !is_array($aAnswer))
            return array();

        if($this->_oConfig->isModeNio() && (int)$aAnswer[$CNF['FIELD_ANS_IMPORTANT']] == 0)
            return array();

        $sEntryUrl = '{bx_url_root}';
        $sEntryCaption = strmaxtextlen($aQuestion[$CNF['FIELD_TEXT']], 20, '...');

        return array(
            'entry_sample' => $CNF['T']['txt_sample_question_single'],
            'entry_url' => $sEntryUrl,
            'entry_caption' => $sEntryCaption,
            'entry_author' => $aQuestion[$CNF['FIELD_AUTHOR']],
            'subentry_sample' => $CNF['T']['txt_sample_answer_single'],
            'subentry_url' => $oOwnerProfile->getUrl(),
        );
    }


    /**
     * Privacy methods.
     */
    public function serviceCheckAllowedWithContentForProfile($sAction, $iContentId, $iProfileId, $isPerformAction = false)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }


    /**
     * Event handlers.
     */
    public function onAddQuestion($iId)
    {
        /**
         * @hooks
         * @hookdef hook-bx_feedback-added_question 'bx_feedback', 'added_question' - hook on new question added
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `added_question` 
         * - $object_id - question_id
         * - $sender_id - not used
         * @hook @ref hook-bx_feedback-added_question
         */
        bx_alert($this->getName(), 'added_question', $iId);
    }

    public function onEditQuestion($iId)
    {
        /**
         * @hooks
         * @hookdef hook-bx_feedback-edited_question 'bx_feedback', 'edited_question' - hook on new question edited
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `edited_question` 
         * - $object_id - question_id
         * - $sender_id - not used
         * @hook @ref hook-bx_feedback-edited_question
         */
        bx_alert($this->getName(), 'edited_question', $iId);
    }

    public function onDeleteQuestion($aQuestion)
    {
        $CNF = &$this->_oConfig->CNF;

        $oLanguage = BxDolStudioLanguagesUtils::getInstance();
        $oLanguage->deleteLanguageString($aQuestion[$CNF['FIELD_TEXT']]);

        $aAnswers = $this->_oDb->getAnswers(array('type' => 'question_id', 'question_id' => $aQuestion[$CNF['FIELD_ID']]));
        if(!empty($aAnswers) && is_array($aAnswers))
            foreach($aAnswers as $aAnswer) {
                $oLanguage->deleteLanguageString($aAnswer[$CNF['FIELD_ANS_TITLE']]);

                $this->_oDb->deleteAnswer(array('id' => $aAnswer[$CNF['FIELD_ANS_ID']]));
                $this->_oDb->deleteAnswer2User(array('answer_id' => $aAnswer[$CNF['FIELD_ANS_ID']]));
            }

        /**
         * @hooks
         * @hookdef hook-bx_feedback-deleted_question 'bx_feedback', 'deleted_question' - hook on question deleted
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `deleted_question` 
         * - $object_id - question_id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `question` - [array] all question info
         *      - `answers` - [array] answers for current question
         * @hook @ref hook-bx_feedback-deleted_question
         */
        bx_alert($this->getName(), 'deleted_question', $aQuestion[$CNF['FIELD_ID']], false, array(
            'question' => $aQuestion,
            'answers' => $aAnswers,
        ));
    }

    public function onAddAnswer($iQuestionId, $iAnswerId, $iProfileId = false, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $sModule = $this->getName();
        $aAnswer = $this->_oDb->getAnswers(array('type' => 'id', 'id' => $iAnswerId));

        /**
         * @hooks
         * @hookdef hook-bx_feedback-added_answer 'bx_feedback', 'added_answer' - hook on new answer added
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `added_answer` 
         * - $object_id - answer id
         * - $sender_id - current user profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] current user profile_id
         *      - `question_id` - [int] question id
         *      - `important` - [string] answer's important value
         *      - `data` - [string] answer's content
         *      - `votes` - [int] count of votes
         * @hook @ref hook-bx_feedback-added_answer
         */
        bx_alert($sModule, 'added_answer', $iAnswerId, $iProfileId, array_merge(array(
            'object_author_id' => $iProfileId,
            'question_id' => $iQuestionId, 
            'important' => $aAnswer['important'],
            'data' => $aAnswer['data'], 
            'votes' => $aAnswer['votes']
        ), $aParams));

        /**
         * @hooks
         * @hookdef hook-bx_feedback-added_answer_notif 'bx_feedback', 'added_answer_notif' - hook on new answer added
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `added_answer_notif` 
         * - $object_id - question_id
         * - $sender_id - current user profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] current user profile_id
         *      - `subobject_id` - [int] answer id
         *      - `important` - [string] answer's important value
         *      - `data` - [string] answer's content
         *      - `votes` - [int] count of votes
         * @hook @ref hook-bx_feedback-added_answer_notif
         */
        bx_alert($sModule, 'added_answer_notif', $iQuestionId, $iProfileId, array_merge(array(
            'object_author_id' => $iProfileId,
            'subobject_id' => $iAnswerId, 
            'important' => $aAnswer['important'],
            'data' => $aAnswer['data'], 
            'votes' => $aAnswer['votes']
        ), $aParams));
    }

    public function onDeleteAnswer($iQuestionId, $iAnswerId, $iProfileId = false, $aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;

        $sModule = $this->getName();
        $aAnswer = $this->_oDb->getAnswers(array('type' => 'id', 'id' => $iAnswerId));

        /**
         * @hooks
         * @hookdef hook-bx_feedback-deleted_answer 'bx_feedback', 'deleted_answer' - hook on new answer deleted
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `deleted_answer` 
         * - $object_id - answer id
         * - $sender_id - current user profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `question_id` - [int] question id
         *      - `important` - [string] answer's important value
         *      - `data` - [string] answer's content
         *      - `votes` - [int] count of votes
         * @hook @ref hook-bx_feedback-deleted_answer
         */
        bx_alert($sModule, 'deleted_answer', $iAnswerId, $iProfileId, array_merge(array(
            'question_id' => $iQuestionId,
            'important' => $aAnswer['important'],
            'data' => $aAnswer['data'], 
            'votes' => $aAnswer['votes']
        ), $aParams));

        /**
         * @hooks
         * @hookdef hook-bx_feedback-deleted_answer_notif 'bx_feedback', 'added_answer_notif' - hook on new answer deleted
         * - $unit_name - equals `bx_feedback`
         * - $action - equals `added_answer_notif` 
         * - $object_id - question_id
         * - $sender_id - current user profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `subobject_id` - [int] answer id
         *      - `important` - [string] answer's important value
         *      - `data` - [string] answer's content
         *      - `votes` - [int] count of votes
         * @hook @ref hook-bx_feedback-added_answer_notif
         */
        bx_alert($sModule, 'deleted_answer_notif', $iQuestionId, $iProfileId, array_merge(array(
            'subobject_id' => $iAnswerId,
            'important' => $aAnswer['important'],
            'data' => $aAnswer['data'], 
            'votes' => $aAnswer['votes']
        ), $aParams));
    }


    /**
     * Internal methods
     */
    protected function _getContentForTimelineQuestion($aEvent, $aQuestion, $aBrowseParams = array())
    {
    	$CNF = &$this->_oConfig->CNF;

    	$sUrl = BX_DOL_URL_ROOT;

        //--- Title
        $sTitle = strmaxtextlen(_t($aQuestion[$CNF['FIELD_TEXT']]), 20, '...');

    	return array(
            'sample' => isset($CNF['T']['txt_sample_question_single_with_article']) ? $CNF['T']['txt_sample_question_single_with_article'] : $CNF['T']['txt_sample_question_single'],
            'sample_wo_article' => $CNF['T']['txt_sample_question_single'],
            'sample_action' => isset($CNF['T']['txt_sample_question_action']) ? $CNF['T']['txt_sample_question_action'] : '',
            'url' => $sUrl,
            'title' => $sTitle,
            'text' => '',
            'images' => array(),
            'images_attach' => array(),
            'videos' => array(),
            'videos_attach' => array(),
            'files' => array(),
            'files_attach' => array()
        );
    }

    protected function _getContentForTimelineAnswer($aEvent, $aQuestion, $aAnswer, $aBrowseParams = array())
    {
    	$CNF = &$this->_oConfig->CNF;

        $oOwnerProfile = BxDolProfile::getInstance((int)$aEvent['owner_id']);

    	$sUrl = BX_DOL_URL_ROOT;
        if($oOwnerProfile)
            $sUrl = $oOwnerProfile->getUrl();

        //--- Title
        $sTitle = strmaxtextlen(_t($aQuestion[$CNF['FIELD_TEXT']]), 20, '...');

        $sTextKey = '_bx_feedback_txt_answer_format' . (empty($aAnswer[$CNF['FIELD_ANS2USR_TEXT']]) ? '_wo_comment' : '');
        $sText = _t($sTextKey, _t($aAnswer[$CNF['FIELD_ANS_TITLE']]), $aAnswer[$CNF['FIELD_ANS2USR_TEXT']]); 

    	return array(
            'sample' => isset($CNF['T']['txt_sample_answer_single_with_article']) ? $CNF['T']['txt_sample_answer_single_with_article'] : $CNF['T']['txt_sample_answer_single'],
            'sample_wo_article' => $CNF['T']['txt_sample_answer_single'],
            'sample_action' => isset($CNF['T']['txt_sample_answer_action']) ? $CNF['T']['txt_sample_answer_action'] : '',
            'url' => $sUrl,
            'title' => $sTitle,
            'text' => $sText,
            'images' => array(),
            'images_attach' => array(),
            'videos' => array(),
            'videos_attach' => array(),
            'files' => array(),
            'files_attach' => array()
        );
    }
}

/** @} */
