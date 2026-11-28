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

class BxReputationFormLevel extends BxTemplStudioFormView
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_reputation';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($this->aInputs[$CNF['FIELD_LEVEL_NAME']])) {
            $sJsObject = $this->_oModule->_oConfig->getJsObject('levels');

            $iId = $this->getLevelId();
            $aMask = array('mask' => "javascript:%s.checkName('%s');", $sJsObject, $CNF['FIELD_LEVEL_NAME']);
            if(!empty($iId) && $this->aParams['display'] == $CNF['OBJECT_FORM_LEVEL_DISPLAY_EDIT']) {
                $aMask['mask'] = "javascript:%s.checkName('%s', %d);";
                $aMask[] = $iId;
            }

            $sOnBlur = call_user_func_array('sprintf', array_values($aMask)); 
            $this->aInputs[$CNF['FIELD_LEVEL_NAME']]['attrs']['onblur'] = $sOnBlur;
        }
        
        if(isset($this->aInputs[$CNF['FIELD_LEVEL_ICON']]))
            $this->aInputs[$CNF['FIELD_LEVEL_ICON']]['code'] = 1;
    }

    public function insert ($aValsToAdd = [], $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($this->aInputs[$CNF['FIELD_LEVEL_NAME']])) {
            $sName = BxDolForm::getSubmittedValue($CNF['FIELD_LEVEL_NAME'], $this->aFormAttrs['method'], $this->_aSpecificValues);
            $sName = $this->_oModule->_oConfig->getLevelName($sName);
            BxDolForm::setSubmittedValue($CNF['FIELD_LEVEL_NAME'], $sName, $this->aFormAttrs['method'], $this->_aSpecificValues);
        }

        return parent::insert ($aValsToAdd, $isIgnore);
    }

    function update ($iContentId, $aValsToAdd = [], &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sNameKey = $CNF['FIELD_LEVEL_NAME'];
        if(isset($this->aInputs[$sNameKey])) {
            $sName = $this->getCleanValue($sNameKey);
            $aContentInfo = $this->_oModule->_oDb->getLevels(['sample' => 'id', 'id' => $iContentId]);

            if($aContentInfo[$sNameKey] != $sName) {
                $sName = $this->_oModule->_oConfig->getLevelName($sName);
                BxDolForm::setSubmittedValue($sNameKey, $sName, $this->aFormAttrs['method'], $this->_aSpecificValues);
            }
        }

        return parent::update ($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);
    }

    public function getLevelId()
    {
        $iResult = 0;

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $sId = bx_get('id');
            if(!empty($sId))
                $iResult = $sId;
        }
        else
            $iResult = array_shift($aIds);

        return (int)$iResult;
    }
}

/** @} */
