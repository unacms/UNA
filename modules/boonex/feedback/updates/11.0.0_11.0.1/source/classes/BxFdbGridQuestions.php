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

class BxFdbGridQuestions extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;

    protected $_sParamsDivider;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sModule = 'bx_feedback';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_sParamsDivider = '#-#';
    }

    public function getJsCode($sKey = 'question')
    {
        return $this->_oModule->_oTemplate->getJsCode($sKey, array(
            'sObjNameGrid' => $this->_sObject,
            'sParamsDivider' => $this->_sParamsDivider,
            'sTextSearchInput' => _t('_sys_grid_search')
        ));
    }

    public function getCode ($isDisplayHeader = true)
    {
        $sResult = parent::getCode($isDisplayHeader);
        if(!empty($sResult))
            $sResult .= $this->getJsCode();

        return $sResult;
    }

    public function performActionAdd()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'add';
        $aActionParams = array('o' => $this->_sObject, 'a' => $sAction);

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_QUESTION'], $CNF['OBJECT_FORM_QUESTION_DISPLAY_ADD']);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $iNow = time();

            $aValsToAdd = array(
                'author' => bx_get_logged_profile_id(),
                'added' => $iNow,
                'changed' => $iNow
            );

            if(($iId = $oForm->insert($aValsToAdd)) !== false) {
                $this->_oModule->onAddQuestion($iId);

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            }
            else
                $aRes = array('msg' => _t('_bx_feedback_err_cannot_perform'));

            return echoJson($aRes);
        }

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('question_popup_add'), _t('_bx_feedback_grid_question_popup_title_add'), $this->_oModule->_oTemplate->parseHtmlByName('question_popup_form.html', array(
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
    }

    public function performActionEdit()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return echoJson(array());

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $sAction = 'edit';
        $aActionParams = array('o' => $this->_sObject, 'a' => $sAction, 'id' => $iId);

        $aQuestion = $this->_oModule->_oDb->getQuestions(array('type' => 'id', 'id' => $iId));

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_QUESTION'], $CNF['OBJECT_FORM_QUESTION_DISPLAY_EDIT']);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams);
        $oForm->initChecker($aQuestion);

        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = array(
                'changed' => time()
            );

            if($oForm->update($iId, $aValsToAdd) !== false) {
                $this->_oModule->onEditQuestion($iId);

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            }
            else
                $aRes = array('msg' => _t('_bx_feedback_err_cannot_perform'));

            return echoJson($aRes);
        }

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('question_popup_edit'), _t('_bx_feedback_grid_question_popup_title_edit'), $this->_oModule->_oTemplate->parseHtmlByName('question_popup_form.html', array(
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
    }

    protected function _delete($mixedId)
    {
        $aQuestion = $this->_oModule->_oDb->getQuestions(array('type' => 'id', 'id' => $mixedId));
        if(empty($aQuestion) || !is_array($aQuestion))
            return false;

        $mixedResult = parent::_delete($mixedId);
        if($mixedResult !== false)
            $this->_oModule->onDeleteQuestion($aQuestion);

        return $mixedResult;
    }

    protected function _switcherChecked2State($isChecked)
    {
        return $isChecked ? 'active' : 'hidden';
    }

    protected function _switcherState2Checked($mixedState)
    {
        return 'active' == $mixedState ? true : false;
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($CNF['FIELD_STATUS_ADMIN']) && isset($aRow[$CNF['FIELD_STATUS_ADMIN']]) && !in_array($aRow[$CNF['FIELD_STATUS_ADMIN']], array('active', 'hidden'))) {
            $sStatusKey = '_sys_status_' . $aRow[$CNF['FIELD_STATUS_ADMIN']];
            if(!empty($CNF['T']['txt_status_' . $aRow[$CNF['FIELD_STATUS_ADMIN']]]))
                $sStatusKey = $CNF['T']['txt_status_' . $aRow[$CNF['FIELD_STATUS_ADMIN']]];

            return parent::_getCellDefault(_t($sStatusKey), $sKey, $aField, $aRow);
        }

        return parent::_getCellSwitcher ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_time_js($mixedValue, BX_FORMAT_DATE, true), $sKey, $aField, $aRow);
    }
}

/** @} */
