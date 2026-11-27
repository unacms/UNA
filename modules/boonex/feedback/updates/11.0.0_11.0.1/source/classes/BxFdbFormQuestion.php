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

require_once (BX_DOL_DIR_STUDIO_CLASSES . 'BxDolStudioForm.php');

class BxFdbFormQuestionChecker extends BxDolFormChecker
{
    function __construct($sHelper = '')
    {
        parent::__construct($sHelper);
    }

    public function getSubmittedValueAnswers($sKey, $sMethod, &$aSpecificValues = false)
    {
        $aValues = array(
            'ids' => array(), 
            'vals' => array(), 
            'imps' => array()
        );

        $iIndex = (int)BxDolForm::getSubmittedValue($sKey . '_ind', $sMethod, $aSpecificValues);

        for($i = 0; $i < $iIndex; $i++) {
            $sValue = BxDolForm::getSubmittedValue($sKey . '_' . $i, $sMethod, $aSpecificValues);
            if($sValue === false)
                continue;

            $aValues['vals'][$i] = $sValue;
            
            $sId = BxDolForm::getSubmittedValue($sKey . '_id_' . $i, $sMethod, $aSpecificValues);
            if($sId !== false)
                $aValues['ids'][$i] = $sId;

            $sImp = BxDolForm::getSubmittedValue($sKey . '_imp_' . $i, $sMethod, $aSpecificValues);
            if($sImp !== false && strcmp($sValue, $sImp) == 0)
                $aValues['imps'][] = $sImp;
        }

        return $aValues;
    }
}

class BxFdbFormQuestionCheckerHelper extends BxDolStudioFormCheckerHelper
{
    static public function checkAvailAnswers ($s, $sName)
    {
        $iCountMin = 2;

        if(self::_isEmptyArray($s) || count($s) < $iCountMin)
            return false;

        $iCount = 0;
        foreach($s as $k => $v)
            if(!empty($v))
                $iCount += 1;

        return $iCount >= $iCountMin;
    }
}

class BxFdbFormQuestion extends BxTemplStudioFormView
{
    protected $_sModule;
    protected $_oModule;
    
    protected $_sJsObject;

    public function __construct($aInfo, $oTemplate = false)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->_sModule = 'bx_feedback';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_sJsObject = $this->_oModule->_oConfig->getJsObject('question');
    }

    function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($this->aInputs[$CNF['FIELD_ANSWERS']]) && !empty($aValues['id'])) {
            $aAnswers = $this->_oModule->_oDb->getAnswers(array(
                'type' => 'question_id',
                'question_id' => $aValues['id']
            ));

            $aValue = array(
                'ids' => array(),
                'vals' => array(),
                'imps' => array()
            );

            foreach($aAnswers as $i => $aAnswer) {
                $aValue['ids'][$i] = $aAnswer['id'];
                $aValue['vals'][$i] = $aAnswer['title'];
                if((int)$aAnswer['important'] == 1)
                    $aValue['imps'][$i] = true;
            }

            $this->aInputs[$CNF['FIELD_ANSWERS']]['value'] = $aValue;
        }

        return parent::initChecker($aValues, $aSpecificValues);
    }

    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iContentId = parent::insert($aValsToAdd, $isIgnore);
        if(!empty($iContentId))
            $this->processAnswersAdd($CNF['FIELD_ANSWERS'], $iContentId);

        return $iContentId;
    }

    public function update ($iContentId, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iResult = parent::update($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);

        $this->processAnswersUpdate($CNF['FIELD_ANSWERS'], $iContentId);

        return $iResult;
    }

    public function processAnswersAdd ($sField, $iContentId = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($this->aInputs[$sField]))
            return true;

        $iIndex = (int)$this->getCleanValue($sField . '_ind');
        for($i = 0; $i < $iIndex; $i++) {
            $sValue = $this->getCleanValue($sField . '_' . $i);
            if(empty($sValue) || get_mb_len($sValue) == 0)
                continue;

            $sImp = $this->getCleanValue($sField . '_imp_' . $i);

            $this->_oModule->_oDb->insertAnswer(array(
                'question_id' => $iContentId,
                'title' => bx_process_input($sValue),
                'important' => !empty($sImp) && $sImp == 'on' ? 1 : 0,
                'order' => $i
            ));
        }

        return true;
    }

    public function processAnswersUpdate($sField, $iContentId = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($this->aInputs[$sField]))
            return true;

        $iIndex = (int)$this->getCleanValue($sField . '_ind');

        $aAnswersValues = $aAnswersIds = $aAnswersImps = array();
        for($i = 0; $i < $iIndex; $i++) {
            $sValue = $this->getCleanValue($sField . '_' . $i);
            if(empty($sValue))
                continue;

            $aAnswersValues[$i] = $sValue;

            $iId = $this->getCleanValue($sField . '_id_' . $i);
            if(!empty($iId))
                $aAnswersIds[$i] = $iId;

            $sImpName = $sField . '_imp_' . $i;
            $sImpValue = $this->getCleanValue($sImpName);

            if(!empty($sImpValue) && $sImpValue == 'on')
                $aAnswersImps[$i] = true;
        }

        //--- Remove deleted
        $aAnswersDb = $this->_oModule->_oDb->getAnswers(array('type' => 'question_id_pairs', 'question_id' => $iContentId));
        $this->_oModule->_oDb->deleteAnswerById(array_diff(array_keys($aAnswersDb), $aAnswersIds));

        //--- Update existed and remove empty
        foreach($aAnswersIds as $i => $iAnswerId) {
            $sAnswersValue = $aAnswersValues[$i];

            if($sAnswersValue != '' && get_mb_len($sAnswersValue) > 0)
                $this->_oModule->_oDb->updateAnswer(array(
                    'title' => bx_process_input($sAnswersValue), 
                    'important' => isset($aAnswersImps[$i]) && $aAnswersImps[$i] === true ? 1 : 0
                ), array('id' => (int)$iAnswerId));
            else 
                $this->_oModule->_oDb->deleteAnswer(array('id' => (int)$iAnswerId));
        }

        //--- Add new
        $iAnswersIds = count($aAnswersIds);
        $iAnswersValues = count($aAnswersValues);
        if($iAnswersValues > $iAnswersIds) {
            $iMaxOrder = (int)$this->_oModule->_oDb->getAnswers(array('type' => 'question_id_max_order', 'question_id' => $iContentId));

            for($i = $iAnswersIds; $i < $iAnswersValues; $i++)
                if($aAnswersValues[$i] != '' && get_mb_len($aAnswersValues[$i]) > 0)
                    $this->_oModule->_oDb->insertAnswer(array(
                        'question_id' => $iContentId,
                        'title' => bx_process_input($aAnswersValues[$i]),
                        'important' => isset($aAnswersImps[$i]) && $aAnswersImps[$i] === true ? 1 : 0,
                        'order' => ++$iMaxOrder
                    ));
        }

        return true;
    }

    protected function genCustomInputAnswers(&$aInput)
    {
        $iIndex = 0;
        $sAnswers = '';

        if(!empty($aInput['value']) && !empty($aInput['value']['vals']) && is_array($aInput['value']['vals'])) {
            $aImps = array();
            if(!empty($aInput['value']['imps']) && is_array($aInput['value']['imps']))
                $aImps = $aInput['value']['imps'];

            foreach($aInput['value']['vals'] as $i => $sValue)
                $sAnswers .= $this->_genAnswerSample($aInput, $iIndex++, array(
                    'value' => $sValue,
                    'values' => !empty($aInput['values']['vals'][$i]) && is_array($aInput['values']['vals'][$i]) ? $aInput['values']['vals'][$i] : '',
                    'id' => !empty($aInput['value']['ids'][$i]) ? (int)$aInput['value']['ids'][$i] : '',
                    'checked' => isset($aImps[$i]) && $aImps[$i] === true,
                ));
        }
        else
            for($i = 0; $i < 2; $i++)
                $sAnswers .= $this->_genAnswerSample($aInput, $iIndex++);

        return $this->_oModule->_oTemplate->parseHtmlByName('form_answers.html', array(
            'index' => $this->genCustomInputAnswersIndex($aInput, $iIndex),
            'sample' => $this->_genAnswerSample($aInput, '|x|'),
            'answers' => $sAnswers,
            'btn_add' => $this->genCustomInputAnswersButton($aInput)
        ));
    }

    protected function _genAnswerSample($aInput, $iIndex, $aParams = array())
    {
        $sClass = 'bx-form-input-answer';
        if(!empty($aParams['class']))
            $sClass .= ' ' . $aParams['class'];

        $mixedValue = !empty($aParams['value']) ? $aParams['value'] : '';
        $mixedValues = !empty($aParams['values']) ? $aParams['values'] : '';

        $sInputText = $this->genCustomInputAnswersText($aInput, $iIndex, $mixedValue, $mixedValues);
        if(!empty($aParams['id']))
            $sInputText .= $this->genCustomInputAnswersHidden($aInput, $iIndex, $aParams['id']);

        return $this->_oModule->_oTemplate->parseHtmlByName('form_answer.html', array(
            'js_object' => $this->_sJsObject, 
            'class' => $sClass,
            'input_text' => $sInputText,
            'input_checkbox' => $this->genCustomInputAnswersCheckbox($aInput, $iIndex, 'on', (isset($aParams['checked']) && $aParams['checked'] === true))
        ));
    }

    protected function genCustomInputAnswersText($aInput, $iIndex, $mixedValue = '', $mixedValues = '')
    {
        $aInput['type'] = 'text_translatable';
        $aInput['name'] .= '_' . $iIndex;
        $aInput['caption'] = '';
        $aInput['value'] = $mixedValue;
        $aInput['values'] = $mixedValues;
        $aInput['db'] = array(
            'pass' => 'Xss'
        );
        
        if(!is_array($aInput['attrs']))
            $aInput['attrs'] = array();

        $sJsMethod = 'javascript:' . $this->_sJsObject . '.answerOnType(event, \'' . $aInput['name'] . '\')';
        $aInput['attrs'] = array_merge($aInput['attrs'], array(
            'bx-index' => $iIndex,
            'class' => 'bx-def-margin-sec-top-auto',
            'onkeyup' => $sJsMethod,
            'onpaste' => $sJsMethod,
            'onblur' => $sJsMethod
        ));

        return $this->genRow($aInput);
    }

    protected function genCustomInputAnswersCheckbox($aInput, $iIndex, $mixedValue = '', $bChecked = false)
    {
        $aInput['type'] = 'checkbox';
        $aInput['name'] .= '_imp_' . $iIndex;
        $aInput['caption'] = _t('_bx_feedback_form_question_input_answers_imp');
        $aInput['value'] = $mixedValue;
        $aInput['required'] = 0;
        if($bChecked)
            $aInput['checked'] = 'checked';

        if(!is_array($aInput['attrs']))
            $aInput['attrs'] = array();

        $aInput['attrs'] = array_merge($aInput['attrs'], array(
            'bx-index' => $iIndex,
        ));

        return $this->genRow($aInput);
    }

    protected function genCustomInputAnswersHidden($aInput, $iIndex, $mixedValue = '')
    {
        $aInput['type'] = 'hidden';
        $aInput['name'] .= '_id_' . $iIndex;
        $aInput['value'] = $mixedValue;

        if(!is_array($aInput['attrs']))
            $aInput['attrs'] = array();

        $aInput['attrs'] = array_merge($aInput['attrs'], array(
            'bx-index' => $iIndex,
        ));

        return $this->genInput($aInput);
    }

    protected function genCustomInputAnswersIndex($aInput, $mixedValue = '')
    {        
        $aInput['type'] = 'hidden';
        $aInput['name'] .= '_ind';
        $aInput['value'] = $mixedValue;

        return $this->genInput($aInput);
    }

    protected function genCustomInputAnswersButton($aInput)
    {
        $sName = $aInput['name'];

        $aInput['type'] = 'button';
        $aInput['name'] .= '_add';
        $aInput['value'] = _t('_bx_feedback_form_question_input_answers_add');
        $aInput['attrs']['class'] = 'bx-def-margin-sec-top';
        $aInput['attrs']['onclick'] = $this->_oModule->_oConfig->getJsObject('question') . ".answerAdd(this, '" . $sName . "');";

        return $this->genInputButton($aInput);
    }

    protected function _processTranslationsValuesByNameList($sName, $iIndex)
    {
        for($i = 0; $i < $iIndex; $i++)
            $this->aInputs[$sName]['values']['vals'][$i] = $this->_getTranslationsValuesByName($sName . '_' . $i);
    }
}

/** @} */
