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

class BxFdbConfig extends BxBaseModGeneralConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = array (

            // module icon
            'ICON' => 'comment col-green3',

            // database tables
            'TABLE_QUESTIONS' => $aModule['db_prefix'] . 'questions',
            'TABLE_ANSWERS' => $aModule['db_prefix'] . 'answers',
            'TABLE_ANSWERS2USERS' => $aModule['db_prefix'] . 'answers2users',

            // database fields
            'FIELD_ID' => 'id',
            'FIELD_AUTHOR' => 'author',
            'FIELD_ADDED' => 'added',
            'FIELD_CHANGED' => 'changed',
            'FIELD_TEXT' => 'text',
            'FIELD_ANSWERS' => 'answers',
            'FIELD_STATUS_ADMIN' => 'status_admin',

            'FIELD_ANS_ID' => 'id',
            'FIELD_ANS_TITLE' => 'title',
            'FIELD_ANS_IMPORTANT' => 'important',

            'FIELD_ANS2USR_TEXT' => 'text',

            // page URIs

            // some params
            'PARAM_QUESTIONS' => 'bx_feedback_enable_questions',
            'PARAM_QUESTION_LIFETIME' => 'bx_feedback_question_lifetime',
            'PARAM_ANSWER_NTF_IMPORTANT_ONLY' => 'bx_feedback_enable_answer_ntf_important_only',

            // objects
            'OBJECT_FORM_QUESTION' => 'bx_feedback_question',
            'OBJECT_FORM_QUESTION_DISPLAY_ADD' => 'bx_feedback_question_add',
            'OBJECT_FORM_QUESTION_DISPLAY_EDIT' => 'bx_feedback_question_edit',
            'OBJECT_FORM_QUESTION_DISPLAY_DELETE' => 'bx_feedback_question_delete',
            'OBJECT_FORM_QUESTION_DISPLAY_VIEW' => 'bx_feedback_question_view',
            'OBJECT_GRID_QUESTIONS' => 'bx_feedback_questions',

            // some language keys
            'T' => array (
                'txt_sample_question_single' => '_bx_feedback_txt_sample_question_single',
                'txt_sample_question_single_with_article' => '_bx_feedback_txt_sample_question_single_with_article',
                'txt_sample_answer_single' => '_bx_feedback_txt_sample_answer_single',
                'txt_sample_answer_single_with_article' => '_bx_feedback_txt_sample_answer_single_with_article',
                //'txt_sample_answer_action' => '_bx_feedback_txt_sample_answer_action',
            ),
        );

        $this->_aJsClasses = array_merge($this->_aJsClasses, array(
            'question' => 'BxFdbQuestion',
        ));

        $this->_aJsObjects = array_merge($this->_aJsObjects, array(
            'question' => 'oBxFdbQuestion',
        ));

        $sPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array(
            'question' => $sPrefix . '-question-',
            'question_popup_add' =>  $sPrefix . '-question-popup-add',
            'question_popup_edit' =>  $sPrefix . '-question-popup-edit'
        );

        $this->_aPrefixes = array(
            'style' => 'bx-fdb',
        );
    }

    public function getHtmlIds($sKey = '')
    {
        if(empty($sKey))
            return $this->_aHtmlIds;

        return isset($this->_aHtmlIds[$sKey]) ? $this->_aHtmlIds[$sKey] : '';
    }

    /**
     * Notify about important Answers only.
     */
    public function isModeNio()
    {
        return getParam($this->CNF['PARAM_ANSWER_NTF_IMPORTANT_ONLY']) == 'on';
    }
}

/** @} */
