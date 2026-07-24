<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFormView extends BxDolStudioForm
{
    function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);
    }

    function addCssJs()
    {
        parent::addCssJs();

        $this->oTemplate->addJs(array(
            'forms.js'
        ));

        $this->oTemplate->addCss(array(
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'flag-icon-css/css/|flag-icon.min.css'
        ));
    }

    function genRowStandard(&$aInput, $isOneLine = false)
    {
        $aInput['attrs_wrapper']['class'] ??= '';
        $aInput['attrs_wrapper']['class'] .= ' bx-form-input-translatable';

        return parent::genRowStandard($aInput, $isOneLine);
    }

    function genInput(&$aInput)
    {
        $sInput = '';
        switch($aInput['type']) {
            case 'text_translatable':
                $sInput = $this->genInputTranslatable($aInput, 'text');
                break;

            case 'textarea_translatable':
                $sInput = $this->genInputTranslatable($aInput, 'textarea');
                break;

            default:
                $sInput = parent::genInput($aInput);
        }

        return $sInput;
    }

    function genInputTranslatable(&$aInput, $sType = 'text')
    {
        $iValueLength = 20;
        $sInputIdPrefix = 'bx-form-input-';
        $aInputMethod = array('text' => 'genInputStandard', 'textarea' => 'genInputTextarea');

        $sInput = '';
        $sInputName = $aInput['name'];
        $aInputAttrs = isset($aInput['attrs']) && is_array($aInput['attrs']) ? $aInput['attrs'] : array();

        $aInputLang = $aInput;

        $oFunctions = BxTemplStudioFunctions::getInstance();

        $oLanguage = BxDolStudioLanguagesUtils::getInstance();

        if(!empty($aInput['error']) && is_string($aInput['error'])) {
            $sLanguage = $aInput['error'];
            $aInput['error'] = isset($aInput['checker']['error']) ? $aInput['checker']['error'] : '';
            $aInput['error_updated'] = true;
        }
        else
            $sLanguage = $oLanguage->getCurrentLangName(false);

        $aLanguages = $oLanguage->getLanguagesInfo();

        if(!$this->_bIsApi)
            $aInput['type'] = 'hidden';
        $aInput['translations'] = [];
        $aInput['attrs'] = array_merge($aInputAttrs, array(
            'id' => $sInputIdPrefix . $aInput['name']
        ));
        $sInput .= $this->genInputStandard($aInput);

        $aStrings = !empty($aInput['value']) ? $oLanguage->getLanguageString($aInput['value']) : array();

        $aTmplVars = [];
        foreach($aLanguages as $aLanguage) {
            $bLanguage = $aLanguage['name'] == $sLanguage;
            $sInputLangName = $sInputName . '-' . $aLanguage['name'];

            $aInput['translations'][] = [
                'title' => $aLanguage['title'],
                'name' => $sInputLangName
            ];

            if($this->_bIsApi)
                continue;

            $sValue = '';
            if(key_exists($aLanguage['id'], $aStrings))
                $sValue = $aStrings[$aLanguage['id']]['string'];
            if(!$sValue && isset($aInput['values'][$aLanguage['name']]))
                $sValue = $aInput['values'][$aLanguage['name']];
            $bValue = !empty($sValue);

            $aInputLang['type'] = $sType;
            $aInputLang['name'] = $sInputLangName;
            $aInputLang['value'] = $sValue;
            $aInputLang['attrs'] = array_merge($aInputAttrs, array(
                'id' => $sInputIdPrefix . $aInputLang['name']
            ));

            $sInput .= $this->oTemplate->parseHtmlByName('form_input_translation.html', array(
                'class' => ' bx-form-input-translation-' . $aInputLang['name'],
                'attrs' => bx_convert_array2attrs(array(
                    'style' => !$bLanguage ? 'display:none;' : ''
                )),
                'content' => $this->{$aInputMethod[$sType]}($aInputLang)
            ));

            $aTmplVarValue = array(
                'condition' => $bValue,
                'content' => array(
                    'value' => strmaxtextlen($sValue, $iValueLength)
                )
            );
            $aTmplVarMissing = array(
                'condition' => !$bValue || empty($sValue),
                'content' => array()
            );
            $aTmplVars[] = array(
                'name' => $sInputName,
                'lang_name' => $aLanguage['name'],
                'lang_flag' => $aLanguage['icon'],
                'lang_title' => $aLanguage['title'],
                'bx_if:hide_active' => array(
                    'condition' => !$bLanguage,
                    'content' => array()
                ),
                'bx_if:act_value' => $aTmplVarValue,
                'bx_if:act_missing' => $aTmplVarMissing,
                'bx_if:hide_passive' => array(
                    'condition' => $bLanguage,
                    'content' => array()
                ),
                'bx_if:pas_value' => $aTmplVarValue,
                'bx_if:pas_missing' => $aTmplVarMissing,
            );
        }

        $sPopup = $this->oTemplate->parseHtmlByName('form_view_translator.html', array('bx_repeat:languages' => $aTmplVars));
        $sPopup = $oFunctions->transBox('bx-form-field-translator-popup-' . $sInputName, $sPopup, true);

        $aLanguage = $oLanguage->getLanguageInfo($sLanguage);
        $sControl = $this->oTemplate->parseHtmlByName('form_view_translatable.html', array(
            'flag' => $aLanguage['icon'],
            'title' => $aLanguage['title'],
            'name' => $sInputName,
            'popup' => $sPopup
        ));

        return $sInput . $sControl;
    }

    /**
     * Generate Reverse Checkbox Set Element
     *
     * @param  array  $aInput
     * @return string
     */
    function genInputCheckboxSet(&$aInput)
    {
     	$aInput['value'] = isset($aInput['value']) && $aInput['value'] && is_array($aInput['value']) ? $aInput['value'] : array();
        if(!empty($aInput['reverse']))
            $aInput['value'] = array_diff(array_keys($aInput['values']), $aInput['value']);

        return parent::genInputCheckboxSet($aInput);
    }
}

/** @} */
