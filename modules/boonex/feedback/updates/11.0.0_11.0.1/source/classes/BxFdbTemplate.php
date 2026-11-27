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

class BxFdbTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_feedback';

        parent::__construct($oConfig, $oDb);
    }

    public function getJsCode($sType, $aParams = array(), $bWrap = true)
    {
        $aParams = array_merge(array(
            'aHtmlIds' => $this->_oConfig->getHtmlIds()
        ), $aParams);

        return parent::getJsCode($sType, $aParams, $bWrap);
    }

    public function getBlockQuestion($aQuestion, $aAnswers)
    {
        $sJsObject = $this->_oConfig->getJsObject('question');

        $iQuestion = (int)$aQuestion['id'];

        $aTmplVarsAnswers = array();
        foreach($aAnswers as $aAnswer) 
            $aTmplVarsAnswers[] = array(
                'js_object' => $sJsObject,
                'id' => $aAnswer['id'],
                'question_id' => $iQuestion,
                'title' => bx_process_output(_t($aAnswer['title'])),
                'bx_if:show_checked' => array(
                    'condition' => (int)$aAnswer['checked'] > 0,
                    'content' => array()
                )
            );

        $this->addCss(array('question.css'));
        $this->addJs(array('question.js'));
        $this->addJsTranslation(array('_bx_feedback_txt_enter_text'));
        return $this->getJsCode('question') . $this->parseHtmlByName('question.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('question') . $iQuestion,
            'text' => bx_process_output(_t($aQuestion['text'])),
            'bx_repeat:answers' => $aTmplVarsAnswers,
        ));
    }
}

/** @} */
