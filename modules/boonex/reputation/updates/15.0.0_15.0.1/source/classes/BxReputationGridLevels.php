<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReputationGridLevels extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;
    
    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_reputation';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct ($aOptions, $oTemplate);
    }

    public function getCode($isDisplayHeader = true)
    {
        $mixedResult = parent::getCode($isDisplayHeader);
        if(!$mixedResult)
            return $mixedResult;

        return $this->_oModule->_oTemplate->getJsCode('levels', ['sObjNameGrid' => $this->_sObject]) . $mixedResult;
    } 

    public function performActionAdd()
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'add';

        $sForm = $CNF['OBJECT_FORM_LEVEL_DISPLAY_ADD'];
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LEVEL'], $CNF['OBJECT_FORM_LEVEL_DISPLAY_ADD']);
        $oForm->setId($sForm);
        $oForm->setName($sForm);
    	$oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
            'o' => $this->_sObject, 
            'a' => $sAction
        ]));

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = [
                'order' => $this->_oModule->_oDb->getLevelOrderMax() + 1, 
                'date' => time()
            ];

            $iLevel = $oForm->insert($aValsToAdd);
            if(!$iLevel)
                return $this->_getActionResult(['msg' => _t($CNF['T']['err_cannot_perform'])]);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iLevel]);    
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('level_popup'), _t($CNF['T']['popup_title_level_add']), $this->_oModule->_oTemplate->parseHtmlByName('popup_level.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function performActionEdit()
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'edit';

        $aIds = $this->_getIds();
        if($aIds === false)
            return $this->_getActionResult([]);

        $iLevel = array_shift($aIds);
        $aLevel = $this->_oModule->_oDb->getLevels(['sample' => 'id', 'id' => $iLevel]);
        if(!is_array($aLevel) || empty($aLevel))
            return $this->_getActionResult([]);

        $sForm = $CNF['OBJECT_FORM_LEVEL_DISPLAY_EDIT'];
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LEVEL'], $CNF['OBJECT_FORM_LEVEL_DISPLAY_EDIT']);
        $oForm->setId($sForm);
        $oForm->setName($sForm);
    	$oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
            'o' => $this->_sObject, 
            'a' => $sAction,
            'id' => $iLevel
        ]));

        $oForm->initChecker($aLevel);
        if($oForm->isSubmittedAndValid()) {
            if(!$oForm->update($iLevel))
                return $this->_getActionResult(['msg' => _t($CNF['T']['err_cannot_perform'])]);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iLevel]);    
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iLevel);

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('level_popup'), _t($CNF['T']['popup_title_level_edit']), $this->_oModule->_oTemplate->parseHtmlByName('popup_level.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getCellIcon($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_oTemplate->getIcon($mixedValue, ['class' => 'bx-reputation-level-icon']);

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellPointsOut($mixedValue, $sKey, $aField, $aRow)
    {
        if((int)$mixedValue == 0)
            $mixedValue = _t('_lifetime');

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDate($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getIds()
    {
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId) 
                return false;

            $aIds = [$iId];
        }

        return $aIds;
    }
}

/** @} */
