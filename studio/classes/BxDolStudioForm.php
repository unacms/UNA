<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_METHOD_DEFAULT', 'post');

class BxDolStudioForm extends BxBaseFormView
{
    function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate !== false ? $oTemplate : BxDolStudioTemplate::getInstance());

        $this->_sCheckerHelper = isset($this->aParams['checker_helper']) ? $this->aParams['checker_helper'] : 'BxDolStudioFormCheckerHelper';
    }

    /**
     * Studio's own forms keep their labels above the fields, whatever the site's forms use.
     */
    function getLabelStyle()
    {
        return BX_DOL_FORM_LABEL_STYLE_REGULAR;
    }

    function initChecker($aValues = array (), $aSpecificValues = array())
    {
        parent::initChecker($aValues, $aSpecificValues);

        if($this->isSubmitted() && !$this->_isValid)
            $this->processTranslationsValues();
    }

    function insert($aValsToAdd = array(), $isIgnore = false)
    {
        $sAction = 'insert';
        $this->processTranslationsKey($sAction);

        $mixedResult = parent::insert($aValsToAdd, $isIgnore);
        if($mixedResult !== false)
            $this->processTranslations($sAction);

        return $mixedResult;
    }

    function update($val, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $sAction = 'update';
        $this->processTranslationsKey($sAction);

        $mixedResult = parent::update($val, $aValsToAdd, $aTrackTextFieldsChanges);
        if($mixedResult === false) 
            return $mixedResult;

        $mixedResult += (int)$this->processTranslations($sAction);
        return $mixedResult;
    }

    function updateWithVisibility($iId)
    {
        $iVisibleFor = BxDolStudioUtils::getVisibilityValue($this->getCleanValue('visible_for'), $this->getCleanValue('visible_for_levels'));
        BxDolForm::setSubmittedValue('visible_for_levels', $iVisibleFor, $this->aFormAttrs['method']);
        unset($this->aInputs['visible_for']);

        return $this->update($iId);
    }

    function getCleanValue ($sName)
    {
        $aResult = parent::getCleanValue($sName);

        $a = isset($this->aInputs[$sName]) ? $this->aInputs[$sName] : false;
        if($a && !empty($a['reverse']) && !empty($a['values']))
            $aResult = array_diff(array_keys($a['values']), (is_array($aResult) ? $aResult : array()));

        return $aResult;
    }

    protected function processTranslations($sType = 'insert')
    {
        $bResult = false;
        foreach($this->aInputs as $sName => $aInput) {
            if(!in_array($aInput['type'], array('text_translatable', 'textarea_translatable', 'list_translatable')))
                continue; 

            if($aInput['type'] == 'list_translatable') {
                $iIndex = (int)$this->getCleanValue($sName . '_ind');
                for($i = 0; $i < $iIndex; $i++) 
                    if($this->_processTranslationsByName($sType, $sName . '_' . $i) !== false)
                        $bResult = true;

                continue;
            }

            if($this->_processTranslationsByName($sType, $sName) !== false)
                $bResult = true;
        }

        return $bResult;
    }

    protected function _processTranslationsByName($sType, $sName)
    {
        $oLanguage = BxDolStudioLanguagesUtils::getInstance();

        $aType2Method = array(
            'insert' => 'addLanguageString',
            'update' => 'updateLanguageString'
        );

        $bResult = false;

        $sKey = $this->getCleanValue($sName);
        if(empty($sKey))
            return $bResult;

        $aValues = $this->getTranslationsValues($sType, $sName);
        foreach($aValues as $iLanguageId => $sString)
            if($oLanguage->{$aType2Method[$sType]}($sKey, $sString, $iLanguageId))
                $bResult = true;

        return $bResult;
    }

    protected function processTranslationsKey($sType = 'insert')
    {
        foreach($this->aInputs as $sName => $aInput) {
            if(!in_array($aInput['type'], array('text_translatable', 'textarea_translatable', 'list_translatable'))) 
                continue;

            if($aInput['type'] == 'list_translatable') {
                $iIndex = (int)$this->getCleanValue($sName . '_ind');
                for($i = 0; $i < $iIndex; $i++)
                    $this->_processTranslationsKeyByName($sType, $sName . '_' . $i);

                continue;
            }

            $this->_processTranslationsKeyByName($sType, $sName);
        }
    }

    protected function _processTranslationsKeyByName($sType, $sName)
    {
        $oLanguage = BxDolStudioLanguagesUtils::getInstance();

        //--- Fill in the Key if some values are available only. 
        $sKey = '';
        $sKeyDefault = $this->getCleanValue($sName);

        $aValues = $this->getTranslationsValues($sType, $sName, true);
        if(!empty($aValues) && is_array($aValues))
            $sKey = $this->getTranslationsKey($sType, $sName, $sKeyDefault);

        //--- Remove Key if it exists but no values for him
        if(empty($sKey) && !empty($sKeyDefault)) 
            $oLanguage->deleteLanguageString($sKeyDefault);

        BxDolForm::setSubmittedValue($sName, $sKey, $this->aFormAttrs['method']);
    }
            
    protected function processTranslationsValues()
    {
        //print_r($this->aInputs);
        foreach($this->aInputs as $sName => $aInput) {
            if (!isset($aInput['type'])){
                unset($this->aInputs[$sName]);
                unset($aInput);
            }
        }
        
        foreach($this->aInputs as $sName => $aInput) {
            if(!in_array($aInput['type'], array('text_translatable', 'textarea_translatable', 'list_translatable')))
                continue;

            if($aInput['type'] == 'list_translatable')
                $this->_processTranslationsValuesByNameList($sName, (int)$this->getCleanValue($sName . '_ind'));
            else 
                $this->_processTranslationsValuesByName($sName);
        }
    }

    protected function _getTranslationsValuesByName($sName)
    {
        $aResults = array();

        $aLanguages = BxDolStudioLanguagesUtils::getInstance()->getLanguages();
        foreach($aLanguages as $sLangName => $sLangTitle)
            $aResults[$sLangName] = BxDolForm::getSubmittedValue($sName . '-' . $sLangName, $this->aFormAttrs['method']);

        return $aResults;
    }

    protected function _processTranslationsValuesByName($sName)
    {
        $this->aInputs[$sName]['values'] = $this->_getTranslationsValuesByName($sName);
    }

    protected function _processTranslationsValuesByNameList($sName, $iIndex)
    {
        for($i = 0; $i < $iIndex; $i++)
            $this->aInputs[$sName]['values'][$i] = $this->_getTranslationsValuesByName($sName . '_' . $i);
    }

    protected function getTranslationsKey($sType, $sName, $sValue)
    {
        $iRand = time();
        $sPrefixDefault = "_sys_form_input";

        $sName = BxDolStudioUtils::getSystemName(trim($sName));

        $sResult = '';
        switch($sType) {
            case 'insert':
                $sValue = !empty($sValue) ? BxDolStudioUtils::getSystemName($sValue) : $sPrefixDefault;
                $sResult = $sValue . '_' . $sName . '_' . $iRand;
            break;

            case 'update':
                $sResult = !empty($sValue) ? $sValue : $sPrefixDefault . '_' . $sName . '_' . $iRand;
                break;
        }

        return $sResult;
    }

    protected function getTranslationsValues($sType, $sName, $bCheckEmpty = false)
    {
        $aLanguages = BxDolStudioLanguagesUtils::getInstance()->getLanguagesInfo();

        $aResults = array();
        foreach($aLanguages as $aLanguage) {
            $sString = BxDolForm::getSubmittedValue($sName . '-' . $aLanguage['name'], $this->aFormAttrs['method']);
            if(($bCheckEmpty && empty($sString)) || (!$bCheckEmpty &&  $sString === false))
                continue;

            $aResults[$aLanguage['id']] = $sString;
        }

        return $aResults;
    }
}

class BxDolStudioFormCheckerHelper extends BxDolFormCheckerHelper
{
    static public function checkSegment ($s, $mValMin, $mValMax)
    {
        if(is_array($s)) {
            foreach($s as $mVal) {
                $mVal = (float)$mVal;
                if($mVal < $mValMin || $mVal > $mValMax)
                    return false;
            }

            return true;
        }

        $mVal = (float)$s;
        return $mVal >= $mValMin && $mVal <= $mValMax ? true : false;
    }

    function checkAvailTranslatable($sVal, $aName, $sMethod = BX_DOL_STUDIO_METHOD_DEFAULT, $bAll = true)
    {
        if(empty($sMethod) || empty($aName))
            return false;

        $aLanguages = BxDolStudioLanguagesUtils::getInstance()->getLanguages();

        foreach($aLanguages as $sLangName => $sLangTitle) {
            $sValue = BxDolForm::getSubmittedValue($aName . '-' . $sLangName, $sMethod);
            $bValue = parent::checkAvail($sValue);

            if($bAll && !$bValue)
                return $sLangName;
            if(!$bAll && $bValue)
                return true;
        }

        return $bAll ? true : false;
    }

    function checkLengthTranslatable($sVal, $iLenMin, $iLenMax, $aName, $sMethod = BX_DOL_STUDIO_METHOD_DEFAULT, $bAll = true)
    {
        if(empty($sMethod) || empty($aName))
            return false;

        $aLanguages = BxDolStudioLanguagesUtils::getInstance()->getLanguages();

        foreach($aLanguages as $sLangName => $sLangTitle) {
            $sValue = BxDolForm::getSubmittedValue($aName . '-' . $sLangName, $sMethod);
            $bValue = parent::checkLength($sValue, $iLenMin, $iLenMax);

            if($bAll && !$bValue)
                return $sLangName;
            if(!$bAll && $bValue)
                return true;
        }

        return $bAll ? true : false;
    }

    function checkTemplate($sVal)
    {
        return strlen($sVal) > 0 && BxDolModuleQuery::getInstance()->isEnabled($sVal);
    }
}

/** @} */
