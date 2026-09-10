<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioAgentsInstruments extends BxTemplStudioGridAgents
{
    protected $_sFieldName;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sFieldName = 'name';
    }

    public function getPageJsObject()
    {
        return 'oBxDolStudioPageAgents';
    }

    public function _performActionDuplicate($sMethodGetData, $sMethodInsertData)
    {
        $iId = $this->_getId();
        $aData = $this->_oDb->$sMethodGetData($iId);
        if (!empty($aData)) {
            unset($aData['id']);
            $aData['title'] .= ' (Copy)';
            $aData['duplicate'] = 1;
            $aData['changed'] = time();
            $aData['active'] = 0;
            $iNewId = $this->_oDb->$sMethodInsertData($aData);
            if ($iNewId) {
                $aRes = ['grid' => $this->getCode(false), 'blink' => $iNewId];
                return echoJson($aRes);
            }
        }
        $aRes = ['msg' => _t('_sys_txt_error_occured')];
        return echoJson($aRes);
    }

    protected function _performActionEdit($sMethodGetDataById, $sPopupTitleKey)
    {
        $sAction = 'edit';

        $iId = $this->_getId();
        $aData = $this->_oDb->$sMethodGetDataById($iId);

        $aForm = $this->_getFormEdit($sAction, $aData);
        $oForm = new BxTemplFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($iId, ['changed' => time()]) === false)
                return echoJson(['msg' => _t('_sys_txt_error_occured')]);

            return echoJson(['grid' => $this->getCode(false), 'blink' => $iId]);
        } 

        $sFormId = $oForm->getId();
        $sForm = $oForm->getCode(true);
        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($sFormId . '_popup_' . $sAction, _t($sPopupTitleKey), $this->_oTemplate->parseHtmlByName('agents_automator_form.html', [
            'form_id' => $sFormId,
            'form' => $sForm,
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getFormEdit($sAction, $aData = [])
    {
        $aForm = $this->_getForm($sAction, $aData);
        $aForm['form_attrs']['action'] .= '&id=' . $aData['id'];

        return $aForm;
    }

    protected function _getForm($sAction = '', $aData = [])
    {
        return [];
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if ($sType == 'single' && $aRow['duplicate'] == 0)
            return '';
        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

}

/** @} */
