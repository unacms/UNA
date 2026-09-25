<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFormsField extends BxDolStudioFormsField
{
    protected $aForm;
    protected $sTypeTitlePrefix = '_adm_form_txt_field_type_';

    public function __construct($aParams = [], $aField = [])
    {
        parent::__construct($aParams, $aField);
    }

    public function init()
    {
        parent::init();

        $sJsObject = $this->getJsObject();

        bx_import('BxTemplStudioFormView');

        $this->aForm = array(
            'form_attrs' => array(
                'id' => '',
                'action' => '',
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_form_inputs',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'type' => array(
                    'type' => 'custom',
                    'name' => 'type',
                    'content' => '',
                    'attrs' => array(
                        'id' => 'bx-form-field-type',
                        'class' => 'bx-form-field-type',
                        'onchange' => $sJsObject . '.onSelectType()'
                    ),
                ),
                'reset' => array (
                    'type' => 'reset',
                    'name' => 'close',
                    'value' => _t('_adm_form_btn_field_cancel'),
                    'attrs' => array(
                        'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                        'class' => 'bx-def-margin-sec-left',
                    ),
                )
            )
        );

        $aTypes = array();
        foreach($this->aTypes as $sType => $aParams)
        	if(isset($aParams['add']) && (int)$aParams['add'] == 1)
            	$aTypes[$sType] = _t($this->sTypeTitlePrefix . $sType);

        asort($aTypes);

        $aMenu = array();
        foreach($aTypes as $sName => $sTitle)
            $aMenu[] = array(
                'name' => $sName,
                'icon' => 'ui-' . $sName . '.png',
                'onclick' => $sJsObject . ".onSelectType('" . $sName . "', this)",
                'title' => $sTitle
            );

        $oMenu = new BxTemplStudioMenu(array('template' => 'menu_vertical.html', 'menu_items' => $aMenu));
        $this->aForm['inputs']['type']['content'] = $oMenu->getCode();
    }

    public function getJsObject()
    {
        return BX_DOL_STUDIO_FORMS_FIELDS_JS_OBJECT;
    }

    public function getCheckFunctions()
    {
        return $this->aCheckFunctions;
    }

    public function getCode($sAction, $sObject)
    {
        $sFunction = 'getCode' . $this->getClassName($sAction);
        if(method_exists($this, $sFunction))
            return $this->$sFunction($sAction, $sObject);

        return false;
    }

    protected function getCodeAdd($sAction, $sObject)
    {
        $aForm = $this->getFormAdd($sAction, $sObject);
        $oForm = new BxTemplStudioFormView($aForm);

        if($oForm->isSubmitted())
            $this->onCheckField('add', $oForm);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            //--- Process field name.
            $sInputName = $oForm->getCleanValue('name');
            if(empty($sInputName)) {
                $sInputObject = $oForm->getCleanValue('object');

                $sLanguage = BxDolStudioLanguagesUtils::getInstance()->getCurrentLangName(false);
                $sInputCaption = BxDolForm::getSubmittedValue('caption-' . $sLanguage, $aForm['form_attrs']['method']);
                if(empty($sInputCaption))
                    $sInputCaption = BxDolForm::getSubmittedValue('caption_system-' . $sLanguage, $aForm['form_attrs']['method']);

                $sInputName = $this->getFieldName($sInputObject, $sInputCaption);
                BxDolForm::setSubmittedValue('name', $sInputName, $oForm->aFormAttrs['method']);
            }

            $sFieldName = strmaxtextlen($sInputName, $this->iFieldNameMaxLen, '');
            if(strcmp($sInputName, $sFieldName) !== 0) {
                if($this->oDb->isInput($sInputObject, $sFieldName))
                    return array('msg' => _t('_adm_form_err_field_add_already_exists'));

            	BxDolForm::setSubmittedValue('name', $sFieldName, $oForm->aFormAttrs['method']);                
            }

            if($this->isField($sFieldName))
                return array('msg' => _t('_adm_form_err_field_add_already_exists'));

            $this->onSubmitField($oForm);
            if(($iId = $oForm->insert()) === false)
                return false;

            if ($oForm->getCleanValue('rateable') != '')
                $this->checkRateableFiledValue($sInputName, $oForm->getCleanValue('module'), $oForm->getCleanValue('object'), $oForm->getCleanValue('value'));
            
            $this->alterAdd($sFieldName);
            return true;
        } 
        else
            return BxTemplStudioFunctions::getInstance()->popupBox('adm-form-field-add-' . $this->aParams['display'] . '-popup', _t('_adm_form_txt_field_add_popup'), BxDolStudioTemplate::getInstance()->parseHtmlByName('form_add_field.html', array(
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $sObject,
                'action' => $sAction
            )));
    }

    protected function getCodeEdit($sAction, $sObject)
    {
        $aForm = $this->getFormEdit($sAction, $sObject);
        $oForm = new BxTemplStudioFormView($aForm);

        $bAlter = false;
        if($oForm->isSubmitted())
            $bAlter = $this->onCheckField('edit', $oForm);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $sInputName = $oForm->getCleanValue('name');

            $sFieldName = strmaxtextlen($sInputName, $this->iFieldNameMaxLen, '');
            if(strcmp($sInputName, $sFieldName) !== 0)
            	BxDolForm::setSubmittedValue('name', $sFieldName, $oForm->aFormAttrs['method']);

            $this->onSubmitField($oForm);
            if($oForm->update((int)$this->aField['id']) === false)
                return false;
            
            if ($oForm->getCleanValue('rateable') != '')
                $this->checkRateableFiledValue($sInputName, $oForm->getCleanValue('module'), $oForm->getCleanValue('object'), $oForm->getCleanValue('value'));

            $sFieldNameOld = $this->aField['name'];
            if($bAlter || strcmp($sFieldNameOld, $sFieldName) !== 0)
                $this->alterChange($sFieldNameOld, $sFieldName);

            return true;
        } 
        else {
            $sCaption = _t($this->aField['caption_system']);
            if(empty($sCaption))
                $sCaption = _t($this->aField['caption']);

            return BxTemplStudioFunctions::getInstance()->popupBox('adm-form-field-edit-' . $this->aField['type'] . '-popup', _t('_adm_form_txt_field_edit_popup', $sCaption), BxDolStudioTemplate::getInstance()->parseHtmlByName('form_add_field.html', array(
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $sObject,
                'action' => $sAction
            )));
        }
    }

    protected function getFormAdd($sAction, $sObject)
    {
        $aForm = $this->aForm;
        $aForm['form_attrs']['id'] = 'adm-form-field-add-' . $this->aParams['display'];
        $aForm['form_attrs']['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $sObject . '&a=' . $sAction . '&object=' . $this->aParams['object'] . '&display=' . $this->aParams['display'];

        if(isset($aForm['inputs']['object']))
            $aForm['inputs']['object']['value'] = $this->aParams['object'];

        if(($sClass = get_class($this)) && defined($sClass . '::mixedChangeFormAdd') && call_user_func_array('method_exists', $sClass::mixedChangeFormAdd))
            $aForm = call_user_func($sClass::mixedChangeFormAdd, $sAction, $aForm, $this);

        return $aForm;
    }

    protected function getFormEdit($sAction, $sObject)
    {
        $aForm = $this->aForm;
        $aForm['form_attrs']['id'] = 'adm-form-field-edit-' . $this->aParams['display'];
        $aForm['form_attrs']['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $sObject . '&a=' . $sAction . '&object=' . $this->aParams['object'] . '&display=' . $this->aParams['display'] . '&di_id=' . (int)$this->aField['di_id'];

        foreach($aForm['inputs'] as $sKey => $aInput)
            if(!in_array($sKey, array('type_display', 'controls')))
                switch($sKey) {
                    case 'value':
                        $aForm['inputs'][$sKey]['value'] = $this->aField[$sKey];

                        //--- Date and DateTime
                        if(in_array($aForm['inputs']['type']['value'], array('datepicker', 'datetime', 'date_time'))) 
                            $aForm['inputs'][$sKey]['db']['pass'] = $this->aField['db_pass'];

                        //--- Select, Multi Select, Radio Set and Checkbox Set
                        if(in_array($aForm['inputs']['type']['value'], array('select', 'select_multiple', 'radio_set', 'checkbox_set'))) {
                            $sList = trim($this->getFieldValues($this->aField), BX_DATA_LISTS_KEY_PREFIX . ' ');

                            $bUseForSets = false;
                            if(in_array($aForm['inputs']['type']['value'], array('select_multiple', 'checkbox_set'))) {
                                $aList = array();
                                $this->oDb->getLists(array('type' => 'by_key', 'value' => $sList), $aList, false);

                                $bUseForSets = (int)$aList['use_for_sets'] == 1;
                            }

                            $aPreValues = BxDolForm::getDataItems($sList, $bUseForSets);
                            foreach($aPreValues as $mixedValue => $sTitle)
                                 $aForm['inputs'][$sKey]['values'][] = array('key' => $mixedValue, 'value' => $sTitle);
                        }

                        //--- Files
                        if(in_array($aForm['inputs']['type']['value'], array('files'))) {
                        	if(!empty($aForm['inputs'][$sKey]['value']))
                        		$aForm['inputs'][$sKey]['value'] = unserialize($aForm['inputs'][$sKey]['value']);

                        	$aValues = unserialize($this->getFieldValues($this->aField));
                        	if(!empty($aValues) && is_array($aValues)) {
                        		$aForm['inputs'][$sKey]['values'] = array();

	                        	foreach($aValues as $mixedValue => $sTitle)
									$aForm['inputs'][$sKey]['values'][$mixedValue] = _t($sTitle);
                        	}
                        }
                        break;

                    case 'values':
                        if(!empty($this->aField[$sKey]))
                            $aForm['inputs'][$sKey]['value'] = $this->getFieldValues($this->aField);

                        if(in_array($aForm['inputs']['type']['value'], array('select', 'select_multiple', 'radio_set', 'checkbox_set'))) {
                            $aForm['inputs'][$sKey]['type'] = 'value';
                            foreach($aForm['inputs'][$sKey]['values'] as $aValue)
                                if($aValue['key'] == $aForm['inputs'][$sKey]['value']) {
                                    $sLink = BX_DOL_URL_STUDIO . 'builder_forms.php?page=pre_values&list=' . trim($aValue['key'], BX_DATA_LISTS_KEY_PREFIX . ' ');
                                    $aForm['inputs'][$sKey]['value'] = BxDolStudioTemplate::getInstance()->parseLink($sLink, $aValue['value'], array(
                                        'title' =>  _t('_adm_form_txt_field_values_manage') 
                                    ));
                                    break;
                                }
                            unset($aForm['inputs'][$sKey]['values'], $aForm['inputs'][$sKey]['db']);
                        }
                        break;

                    case 'checked':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        break;

                    case 'icon_preview':
                        $aForm['inputs'][$sKey]['content'] = $this->getFieldIconPreview($this->aField['id'], $this->aField['icon']);
                        break;

                    case 'collapsed':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        break;

                    case 'required':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        if($aForm['inputs'][$sKey]['checked'] == 1 && isset($aForm['inputs']['checker_func'])) {
                            unset($aForm['inputs']['checker_func']['tr_attrs']['style'], $aForm['inputs']['checker_error']['tr_attrs']['style']);
                            unset($aForm['inputs']['checker_func']['attrs']['disabled'], $aForm['inputs']['checker_error']['attrs']['disabled']);
                        }
                        break;

                    case 'unique':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        break;

                    case 'privacy':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        break;
                        
                    case 'checker_func':
                        $sCfValue = strtolower($this->aField[$sKey]);
                        $aForm['inputs'][$sKey]['value'] = $sCfValue;

                        $bHidden = isset($aForm['inputs'][$sKey]['attrs']['disabled']) && !empty($sCfValue);
                        if($bHidden) {
                            unset($aForm['inputs'][$sKey]['attrs']['disabled']);
                            unset($aForm['inputs']['checker_error']['attrs']['disabled']);
                        }
                        
                        switch($sCfValue) {
                            case 'length':
                                if(!$bHidden)
                                    unset($aForm['inputs']['checker_params_length_min']['tr_attrs']['style'], $aForm['inputs']['checker_params_length_max']['tr_attrs']['style']);
                                unset($aForm['inputs']['checker_params_length_min']['attrs']['disabled'], $aForm['inputs']['checker_params_length_max']['attrs']['disabled']);
                                break;
                            case 'date_range':
                                if(!$bHidden)
                                    unset($aForm['inputs']['checker_params_length_min']['tr_attrs']['style'], $aForm['inputs']['checker_params_length_max']['tr_attrs']['style'], $aForm['inputs']['checker_params_required']['tr_attrs']['style']);
                                unset($aForm['inputs']['checker_params_length_min']['attrs']['disabled'], $aForm['inputs']['checker_params_length_max']['attrs']['disabled'], $aForm['inputs']['checker_params_required']['attrs']['disabled']);
                                break;
                            case 'preg':
                            case 'password':
                                if(!$bHidden)
                                    unset($aForm['inputs']['checker_params_preg']['tr_attrs']['style']);
                                unset($aForm['inputs']['checker_params_preg']['attrs']['disabled']);
                                break;
                        }

                        if(!empty($sCfValue) && !in_array($sCfValue, $this->aCheckFunctions)) {
                            $aForm['inputs'][$sKey]['values'][] = array(
                                'key' => $sCfValue, 
                                'value' => _t('_adm_form_txt_field_checker_custom')
                            );
                            if(!isset($aForm['inputs'][$sKey]['attrs']))
                                $aForm['inputs'][$sKey]['attrs'] = [];
                            $aForm['inputs'][$sKey]['attrs']['disabled'] = 'disabled';
                        }
                        break;

                    case 'checker_params_length_min':
                        $aParams = unserialize($this->aField['checker_params']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['min']) ? (int)$aParams['min'] : 0;
                        break;

                    case 'checker_params_length_max':
                        $aParams = unserialize($this->aField['checker_params']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['max']) ? (int)$aParams['max'] : 0;
                        break;
                    
                    case 'checker_params_required':
                        $aParams = unserialize($this->aField['checker_params']);
                        $aForm['inputs'][$sKey]['checked'] = isset($aParams['required']) ? (int)$aParams['required'] : 0;
                        break;

                    case 'checker_params_preg':
                        $aParams = unserialize($this->aField['checker_params']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['preg']) ? $aParams['preg'] : '';
                        break;

                    case 'attrs_min':
                        $aParams = unserialize($this->aField['attrs']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['min']) ? (int)$aParams['min'] : 0;
                        break;

                    case 'attrs_max':
                        $aParams = unserialize($this->aField['attrs']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['max']) ? (int)$aParams['max'] : 100;
                        break;

                    case 'attrs_step':
                        $aParams = unserialize($this->aField['attrs']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['step']) ? (int)$aParams['step'] : 1;
                        break;

                    case 'attrs_src':
                        $aParams = unserialize($this->aField['attrs']);
                        $aForm['inputs'][$sKey]['value'] = isset($aParams['src']) ? $aParams['src'] : '';
                        break;

                    case 'editable':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        break;

                    case 'deletable':
                        $aForm['inputs'][$sKey]['checked'] = (int)$this->aField[$sKey];
                        break;

                    default:
                        $aForm['inputs'][$sKey]['value'] = $this->aField[$sKey];
                }

        if(array_key_exists($aForm['inputs']['type']['value'], $this->aTypesRelated)) {
           $aForm['inputs']['type'] = $this->getFieldTypesSelector('type', $aForm['inputs']['type']['value'], true);
           unset($aForm['inputs']['type_display']);
        }

        $aForm['inputs']['controls'][0]['value'] = _t('_adm_form_btn_field_save');

        if(($sClass = get_class($this)) && defined($sClass . '::mixedChangeFormEdit') && call_user_func_array('method_exists', $sClass::mixedChangeFormEdit))
            $aForm = call_user_func($sClass::mixedChangeFormEdit, $sAction, $aForm, $this);

        return $aForm;
    }

    //--- If field is rateable, check presence in 'sys_form_fields_ids' table, insertation, if not.
    protected function checkRateableFiledValue($sInputName, $sModuleName, $sFormObject, $sNestedForm)
    {
        $oModule = BxDolModule::getInstance($sModuleName);
        $CNF = $oModule->_oConfig->CNF;
        
        $aData = bx_srv($sModuleName, 'get_all');
        
        foreach($aData as $aContentInfo){
            $iContentId = $aContentInfo[$CNF['FIELD_ID']];
            if ($sNestedForm == ''){
                $mixedId = BxDolFormQuery::getFormField($sFormObject, $sInputName, $iContentId);
                if (!$mixedId){
                    BxDolFormQuery::addFormField($sFormObject, $sInputName, $iContentId, $aContentInfo[$CNF['FIELD_AUTHOR']], $sModuleName);
                }
            }
            else{
                $aNestedForm = BxDolFormQuery::getFormObject ($sNestedForm); 
                $aNestedValues = $oModule->_oDb->getNestedBy(array('type' => 'content_id', 'id' => $iContentId, 'key_name' => $aNestedForm['key']), $aNestedForm['table']);
                foreach($aNestedValues as $aNestedValue){
                    $mixedId = BxDolFormQuery::getFormField($sFormObject, $sInputName, $iContentId, $aNestedValue[$aNestedForm['key']]);
                    if (!$mixedId){
                        BxDolFormQuery::addFormField($sFormObject, $sInputName, $iContentId, $aContentInfo[$CNF['FIELD_AUTHOR']], $sModuleName, $aNestedValue[$aNestedForm['key']]);
                    }
                }
            }
        }
    }

    protected function getFieldTypes($sRelatedTo = '')
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aTypesList = $sRelatedTo != '' && isset($this->aTypesRelated[$sRelatedTo]) ? $this->aTypesRelated[$sRelatedTo]['types'] : array_keys($this->aTypes);

        $aTypes = array();
        foreach($aTypesList as $sType)
            $aTypes[$sType] = _t($this->sTypeTitlePrefix . $sType);

        asort($aTypes);

        $aResult = array();
        foreach($aTypes as $sName => $sTitle)
            $aResult[] = array(
                'key' => $sName,
                'value' => $sTitle,
                'style' => 'background-image:url(' . $oTemplate->getIconUrl('ui-' . $sName . '.png') . ')'
            );

        return $aResult;
    }

    protected function getFieldTypesSelector($sName, $sValue, $bRelated = false)
    {
        $bRelated = $bRelated && $sValue != '' && isset($this->aTypesRelated[$sValue]);

        $aField = array(
            'type' => 'select',
            'name' => $sName,
            'caption' => _t('_adm_form_txt_field_type_display'),
            'info' => '',
            'value' => $sValue,
            'values' => $this->getFieldTypes($bRelated ? $sValue : ''),
            'required' => '',
            'attrs' => array(
                'id' => 'bx-form-field-type',
                'class' => 'bx-form-field-type',
                'disabled' => 'disabled'
            )
        );

        if($bRelated) {
            $aField['db'] = array('pass' => 'Xss');
            if((int)$this->aTypesRelated[$sValue]['reload_on_change'] == 1)
                $aField['attrs']['onchange'] = $this->getJsObject() . '.onChangeType(' . $this->aField['di_id'] . ', this)';
            unset($aField['attrs']['disabled']);
        }

        return $aField;
    }

    protected function getFieldName($sObject, $mixedCaption)
    {
        if($mixedCaption === false)
            return $this->genFieldName($sObject);

        $sName = get_mb_replace('/([^\d^\w]+)/u', '', $mixedCaption);
        if(empty($sName))
            return $this->genFieldName($sObject);

        $sName = get_mb_replace('/([^\d^\w^\s]+)/u', '', $mixedCaption);
        $sName = $this->getSystemName(trim($sName));
        if($this->oDb->isInput($sObject, $sName))
            $sName = $this->genFieldName($sObject, $sName);

        return $sName;
    }

    protected function getFieldValues($aField)
    {
        $mixedResult = null;

        switch($aField['type']) {
            case 'select':
            case 'select_multiple':
            case 'checkbox_set':
            case 'radio_set':
                $mixedResult = $this->aField['values'];
                break;

            case 'input_set':
                $mixedResult = $this->aField['values'];
                break;

			case 'files':
                $mixedResult = $this->aField['values'];
                break;
        }

        return $mixedResult;
    }

    protected function getFieldIconPreview($iId, $sIcon)
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aIcons = BxTemplFunctions::getInstanceWithTemplate($oTemplate)->getIcon($sIcon);

        $sIconHtml = $aIcons[2] . $aIcons[3] . $aIcons[4];
        $bIconHtml = !empty($sIconHtml);

        return $oTemplate->parseHtmlByName('item_icon_preview.html', [
            'id' => $iId,
            'bx_if:show_icon_empty' => [
                'condition' => !$bIconHtml,
                'content' => []
            ],
            'bx_if:show_icon_image' => [
                'condition' => false,
                'content' => []
            ],
            'bx_if:show_icon_html' => [
                'condition' => $bIconHtml,
                'content' => [
                    'icon' => $sIconHtml
                ]
            ]
        ]);
    }

    protected function getCheckerFields($bMandatory = false)
    {
        $aResult = array(
            'checker_func' => array(
                'type' => 'select',
                'name' => 'checker_func',
                'caption' => _t('_adm_form_txt_field_checker_func'),
                'info' => '',
                'value' => '',
                'values' => array(
                    array('key' => '', 'value' => _t('_adm_form_txt_field_checker_empty'))
                ),
                'required' => $bMandatory ? '1' : '0',
                'attrs' => array(
                    'id' => 'bx-form-field-type',
                    'onchange' => $this->getJsObject() . ".onSelectChecker(this)",
                    'disabled' => 'disabled'
                ),
                'tr_attrs' => array(
                    'style' => 'display:none'
                ),
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'checker_params' => array(
                'type' => 'hidden',
                'name' => 'checker_params',
                'value' => '',
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'checker_params_length_min' => array(
                'type' => 'text',
                'name' => 'checker_params_length_min',
                'caption' => _t('_adm_form_txt_field_checker_params_length_min'),
                'info' => '',
                'value' => '',
                'required' => $bMandatory ? '1' : '0',
                'attrs' => array(
                    'disabled' => 'disabled'
                ),
                'tr_attrs' => array(
                    'style' => 'display:none'
                ),
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'checker_params_length_max' => array(
                'type' => 'text',
                'name' => 'checker_params_length_max',
                'caption' => _t('_adm_form_txt_field_checker_params_length_max'),
                'info' => '',
                'value' => '',
                'required' => $bMandatory ? '1' : '0',
                'attrs' => array(
                    'disabled' => 'disabled'
                ),
                'tr_attrs' => array(
                    'style' => 'display:none'
                ),
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'checker_params_required' => array(
                'type' => 'checkbox',
                'name' => 'checker_params_required',
                'caption' => _t('_adm_form_txt_field_checker_params_required'),
                'info' => '',
                'value' => '1',
                'required' => $bMandatory ? '1' : '0',
                'attrs' => array(
                    'disabled' => 'disabled'
                ),
                'tr_attrs' => array(
                    'style' => 'display:none'
                ),
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'checker_params_preg' => array(
                'type' => 'text',
                'name' => 'checker_params_preg',
                'caption' => _t('_adm_form_txt_field_checker_params_preg'),
                'info' => _t('_adm_form_dsc_field_checker_params_preg'),
                'value' => '',
                'required' => $bMandatory ? '1' : '0',
                'attrs' => array(
                    'disabled' => 'disabled'
                ),
                'tr_attrs' => array(
                    'style' => 'display:none'
                ),
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'checker_error' => array(
                'type' => 'text_translatable',
                'name' => 'checker_error',
                'caption' => _t('_adm_form_txt_field_checker_error'),
                'info' => '',
                'value' => '_sys_form_txt_field_checker_error',
                'required' => $bMandatory ? '1' : '0',
                'attrs' => array(
                    'disabled' => 'disabled'
                ),
                'tr_attrs' => array(
                    'style' => 'display:none'
                ),
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
        );

        foreach($this->aCheckFunctions as $sCheckFunction)
            $aResult['checker_func']['values'][] = array('key' => $sCheckFunction, 'value' => _t('_adm_form_txt_field_checker_' . $sCheckFunction));

        if($bMandatory) 
            $aResult = array_merge_recursive($aResult, array(
                'checker_func' => array(
                    'checker' => array (
                        'func' => 'avail',
                        'params' => array(),
                        'error' => _t('_adm_form_err_field_checker_func'),
                    )
                ),
                'checker_params_length_min' => array(
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9]+$/'),
                        'error' => _t('_adm_form_err_field_checker_params_length_min'),
                    )
                ),
                'checker_params_length_max' => array(
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9]+$/'),
                        'error' => _t('_adm_form_err_field_checker_params_length_max'),
                    )
                ),
                'checker_params_preg' => array(
                    'checker' => array (
                        'func' => 'avail',
                        'params' => array(),
                        'error' => _t('_adm_form_err_field_checker_params_preg'),
                    ),
                    
                ),
                'checker_error' => array(
                    'checker' => array (
                        'func' => 'availTranslatable',
                        'params' => array('checker_error'),
                        'error' => _t('_adm_form_err_field_checker_error'),
                    )
                )
            ));

        return $aResult;
    }

    protected function updateCheckerFields($sType, &$oForm)
    {
            if((int)$oForm->getCleanValue('required') == 0)
                switch($sType) {
                    case 'add':
                        $this->unsetCheckerFields($oForm);
                        break;

                    case 'edit':
                        $this->clearCheckerFields($oForm);
                        break;
                }
            else {
                unset($oForm->aInputs['checker_func']['tr_attrs']['style'], $oForm->aInputs['checker_error']['tr_attrs']['style']);
                unset($oForm->aInputs['checker_func']['attrs']['disabled'], $oForm->aInputs['checker_error']['attrs']['disabled']);
                switch($oForm->getCleanValue('checker_func')) {
                    case 'length':
                        unset($oForm->aInputs['checker_params_length_min']['tr_attrs']['style'], $oForm->aInputs['checker_params_length_max']['tr_attrs']['style']);
                        unset($oForm->aInputs['checker_params_length_min']['attrs']['disabled'], $oForm->aInputs['checker_params_length_max']['attrs']['disabled']);
                        $this->unsetCheckerFields($oForm, 'required');
                        $this->unsetCheckerFields($oForm, 'preg');
                        break;

                    case 'date_range':
                        unset($oForm->aInputs['checker_params_length_min']['tr_attrs']['style'], $oForm->aInputs['checker_params_length_max']['tr_attrs']['style'], $oForm->aInputs['checker_params_required']['tr_attrs']['style']);
                        unset($oForm->aInputs['checker_params_length_min']['attrs']['disabled'], $oForm->aInputs['checker_params_length_max']['attrs']['disabled'], $oForm->aInputs['checker_params_required']['attrs']['disabled']);
                        $this->unsetCheckerFields($oForm, 'preg');
                        break;

                    case 'preg':
                    case 'password':
                        unset($oForm->aInputs['checker_params_preg']['tr_attrs']['style']);
                        unset($oForm->aInputs['checker_params_preg']['attrs']['disabled']);
                        $this->unsetCheckerFields($oForm, 'date_range');
                        break;

                    default:
                        $this->unsetCheckerFields($oForm, 'params');
                }
            }
    }

    protected function clearCheckerFields(&$oForm, $sCheckerFunc = 'all')
    {
        switch($sCheckerFunc) {
            case 'length':
                $oForm->aInputs['checker_params_length_min']['value'] = '';
                $oForm->aInputs['checker_params_length_max']['value'] = '';
                break;
                
            case 'date_range':
                $oForm->aInputs['checker_params_length_min']['value'] = '';
                $oForm->aInputs['checker_params_length_max']['value'] = '';
                $oForm->aInputs['checker_params_required']['value'] = '';
                break;

            case 'required':
                $oForm->aInputs['checker_params_required']['value'] = '';
                break;

            case 'preg':
                $oForm->aInputs['checker_params_preg']['value'] = '';
                break;

            case 'params':
                $oForm->aInputs['checker_params_length_min']['value'] = '';
                $oForm->aInputs['checker_params_length_max']['value'] = '';
                $oForm->aInputs['checker_params_required']['value'] = '';
                $oForm->aInputs['checker_params_preg']['value'] = '';
                break;

            case 'all':
                $oForm->aInputs['checker_func']['value'] = '';
                $oForm->aInputs['checker_params']['value'] = '';
                $oForm->aInputs['checker_params_length_min']['value'] = '';
                $oForm->aInputs['checker_params_length_max']['value'] = '';
                $oForm->aInputs['checker_params_required']['value'] = '';
                $oForm->aInputs['checker_params_preg']['value'] = '';
                $oForm->aInputs['checker_error']['value'] = '';
        }
    }

    protected function unsetCheckerFields(&$oForm, $sCheckerFunc = 'all')
    {
        switch($sCheckerFunc) {
            case 'length':
                unset(
                    $oForm->aInputs['checker_params_length_min'],
                    $oForm->aInputs['checker_params_length_max']
                );
                break;
                
            case 'date_range':
                unset(
                    $oForm->aInputs['checker_params_length_min'],
                    $oForm->aInputs['checker_params_length_max'],
                    $oForm->aInputs['checker_params_required']
                );
                break;

            case 'required':
                unset(
                    $oForm->aInputs['checker_params_required']
                );
                break;

            case 'preg':
            case 'password':
                unset($oForm->aInputs['checker_params_preg']);
                break;

            case 'params':
                unset(
                    $oForm->aInputs['checker_params_length_min'],
                    $oForm->aInputs['checker_params_length_max'],
                    $oForm->aInputs['checker_params_required'],
                    $oForm->aInputs['checker_params_preg']
                );
                break;

            case 'all':
                unset(
                    $oForm->aInputs['checker_func'],
                    $oForm->aInputs['checker_params'],
                    $oForm->aInputs['checker_params_length_min'],
                    $oForm->aInputs['checker_params_length_max'],
                    $oForm->aInputs['checker_params_required'],
                    $oForm->aInputs['checker_params_preg'],
                    $oForm->aInputs['checker_error']
                );
        }
    }

    protected function genFieldName($sObject, $sPrefix = 'field')
    {
        $aFields = array();
        $this->oDb->getInputs(array('type' => 'by_object_name_filter', 'object' => $sObject, 'name_filter' => $sPrefix . '%'), $aFields, false);

        for($iIndex = 1; true; $iIndex++)
            if(!in_array($sPrefix . $iIndex, $aFields))
                break;

        return $sPrefix . $iIndex;
    }

    protected function onCheckField($sType, &$oForm)
    {
        $bAlter = false;

        //--- Process field 'required' and related 'checker' fields.
        if(isset($oForm->aInputs['required']))
            $this->updateCheckerFields($sType, $oForm);

        //--- Process field 'db_pass' and related dependencies.
        if(isset($oForm->aInputs['db_pass']) && $oForm->aInputs['db_pass']['type'] == 'select') {
            $sDbPass = $oForm->getCleanValue('db_pass');

            $this->aForm['inputs']['value']['db']['pass'] = $sDbPass;

            if(!empty($this->aDbPassDependency[$sDbPass])) {
                $this->aParams['table_field_type'] = $this->aDbPassDependency[$sDbPass]['alter'];
                $bAlter = true;
            }
        }

        return $bAlter;
    }

    protected function onSubmitField(&$oForm)
    {
        //--- Process field value.
        if(isset($oForm->aInputs['value']['db']))
            $oForm->aInputs['value']['db']['pass'] = $oForm->getCleanValue('db_pass');

        //--- Process field values.
        if(isset($oForm->aInputs['values']['db'])) 
            $this->onSubmitFieldValues($oForm);

        //--- Process field 'html' flag.
        if(isset($oForm->aInputs['html'])) {
            $iHtml = (int)$oForm->getCleanValue('html');
            BxDolForm::setSubmittedValue('db_pass', $iHtml == 0 ? 'XssMultiline' : 'XssHtml', $oForm->aFormAttrs['method']);
        }

        //--- Process field checker.
        $sCheckerFunc = $oForm->getCleanValue('checker_func');

        $aCheckerParams = array();
        if(!empty($sCheckerFunc)) {
            if(isset($oForm->aInputs['checker_params_length_min'], $oForm->aInputs['checker_params_length_max'])) {
                $aCheckerParams['min'] = $oForm->getCleanValue('checker_params_length_min');
                $aCheckerParams['max'] = $oForm->getCleanValue('checker_params_length_max');
            }

            if(isset($oForm->aInputs['checker_params_preg']))
                $aCheckerParams['preg'] = $oForm->getCleanValue('checker_params_preg');

            if(isset($oForm->aInputs['checker_params_required']))
                $aCheckerParams['required'] = $oForm->getCleanValue('checker_params_required');

            switch($sCheckerFunc) {
                case 'location':
                    $aCheckerParams['name'] = $oForm->getCleanValue('name');
                    break;
            }
        }

        unset($oForm->aInputs['checker_params_length_min'], $oForm->aInputs['checker_params_length_max'], $oForm->aInputs['checker_params_preg'], $oForm->aInputs['checker_params_required']);
        BxDolForm::setSubmittedValue('checker_params', !empty($aCheckerParams) ? serialize($aCheckerParams) : '', $oForm->aFormAttrs['method']);

        //--- Process field attrs.
        $aAttrs = array();
        if(isset($oForm->aInputs['attrs_min'], $oForm->aInputs['attrs_max'], $oForm->aInputs['attrs_step'])) {
            $aAttrs['min'] = $oForm->getCleanValue('attrs_min');
            $aAttrs['max'] = $oForm->getCleanValue('attrs_max');
            $aAttrs['step'] = $oForm->getCleanValue('attrs_step');
        } else if(isset($oForm->aInputs['attrs_src']))
            $aAttrs['src'] = $oForm->getCleanValue('attrs_src');

        unset($oForm->aInputs['attrs_min'], $oForm->aInputs['attrs_max'], $oForm->aInputs['attrs_step'], $oForm->aInputs['attrs_src']);
        BxDolForm::setSubmittedValue('attrs', serialize($aAttrs), $oForm->aFormAttrs['method']);
    }

    protected function onSubmitFieldValues(&$oForm)
    {
    	$sValues = $oForm->getCleanValue('values');
        if(is_string($sValues) && strpos($sValues, BX_DATA_LISTS_KEY_PREFIX) === false)
            BxDolForm::setSubmittedValue('values', serialize(explode("\n", $sValues)), $oForm->aFormAttrs['method']);
    }
}

class BxBaseStudioFormsFieldBlockPart extends BxBaseStudioFormsField
{
    public function init()
    {
        parent::init();

        $this->aForm = array(
            'form_attrs' => array(
                'id' => '',
                'action' => '',
                'method' => 'post'
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_form_inputs',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'module' => array(
                    'type' => 'hidden',
                    'name' => 'module',
                    'caption' => _t('_adm_form_txt_field_module'),
                    'value' => 'custom',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'object' => array(
                    'type' => 'hidden',
                    'name' => 'object',
                    'caption' => _t('_adm_form_txt_field_object'),
                    'value' => '',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'name' => array(
                    'type' => 'hidden',
                    'name' => 'name',
                	'caption' => _t('_adm_form_txt_field_name'),
                    'value' => '',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'type' => array(
                    'type' => 'hidden',
                    'name' => 'type',
                    'value' => $this->sType,
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'db_pass' => array(
                    'type' => 'hidden',
                    'name' => 'db_pass',
                    'value' => $this->sDbPass,
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'type_display' => $this->getFieldTypesSelector('type_display', $this->sType),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_field_add'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_field_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );
    }
}

class BxBaseStudioFormsFieldBlockHeader extends BxBaseStudioFormsFieldBlockPart
{
    protected $sType = 'block_header';

    public function init()
    {
        parent::init();

        $aFields = array(
            'caption_system' => array(
                'type' => 'text_translatable',
                'name' => 'caption_system',
                'caption' => _t('_adm_form_txt_field_caption_system'),
                'info' => _t('_adm_form_dsc_field_caption_system'),
                'value' => '_sys_form_txt_field',
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                ),
            ),
            'caption' => array(
                'type' => 'text_translatable',
                'name' => 'caption',
                'caption' => _t('_adm_form_txt_field_caption'),
                'info' => _t('_adm_form_dsc_field_caption_block_header'),
                'value' => '_sys_form_txt_field',
                'required' => '1',
                'db' => array (
                    'pass' => 'Xss',
                ),
                'checker' => array (
                    'func' => 'LengthTranslatable',
                    'params' => array(3, 100, 'caption'),
                    'error' => _t('_adm_form_err_field_caption'),
                ),
            ),
            'collapsed' => array(
                'type' => 'checkbox',
                'name' => 'collapsed',
                'caption' => _t('_adm_form_txt_field_collapsed'),
                'info' => _t('_adm_form_dsc_field_collapsed'),
                'value' => '1',
                'required' => '0',
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'privacy' => array(
                'type' => 'switcher',
                'name' => 'privacy',
                'caption' => _t('_adm_form_txt_field_privacy'),
                'info' => _t('_adm_form_dsc_field_privacy'),
                'value' => '1',
                'required' => '0',
                'attrs' => array(
                    'id' => 'bx-form-field-privacy'
                ),
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'rateable' => array(
                'type' => 'select',
                'name' => 'rateable',
                'caption' => _t('_adm_form_txt_field_rateable'),
                'info' => _t('_adm_form_dsc_field_rateable'),
                'values' => array(
                    array('key' => '', 'value' => _t('_adm_form_txt_field_rateable_value_non')),
                    array('key' => 'sys_form_fields_votes', 'value' => _t('_adm_form_txt_field_rateable_value_votes')),
                    array('key' => 'sys_form_fields_reaction', 'value' => _t('_adm_form_txt_field_rateable_value_reactions'))
                ),
                'required' => '0',
                'attrs' => array(
                    'id' => 'bx-form-field-rateable'
                ),
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'icon' => array(
                'type' => 'textarea',
                'name' => 'icon',
                'caption' => _t('_adm_form_txt_field_icon'),
                'info' => _t('_adm_form_dsc_field_icon'),
                'value' => '',
                'code' => 1,
                'required' => '0',
                'attrs' => array('class' => 'bx-form-input-textarea-small'),
                'db' => array (
                    'pass' => 'Xss',
                ),
            ),
            'icon_preview' => array(
                'type' => 'custom',
                'name' => 'icon_preview',
                'caption' => _t('_adm_form_txt_field_icon_preview'),
                'content' => ''
            ),
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'type_display', $aFields);

        if($this->isNested())
            unset($this->aForm['inputs']['rateable']);
    }
}

class BxBaseStudioFormsFieldBlockEnd extends BxBaseStudioFormsFieldBlockPart
{
    protected $sType = 'block_end';

    public function init()
    {
        parent::init();

        $aFields = array(
            'caption_system' => array(
                'type' => 'text_translatable',
                'name' => 'caption_system',
                'caption' => _t('_adm_form_txt_field_caption_system'),
                'info' => _t('_adm_form_dsc_field_caption_system'),
                'value' => '_sys_form_txt_field',
                'required' => '1',
                'db' => array (
                    'pass' => 'Xss',
                ),
                'checker' => array (
                    'func' => 'LengthTranslatable',
                    'params' => array(3,100, 'caption_system'),
                    'error' => _t('_adm_form_err_field_caption_system'),
                ),
            ),
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'type_display', $aFields);
    }
}

class BxBaseStudioFormsFieldValue extends BxBaseStudioFormsFieldBlockHeader
{
    protected $sType = 'value';

    public function init()
    {
        parent::init();

        $this->aForm['inputs']['caption']['info'] = _t('_adm_form_dsc_field_caption');

        $aFields = array(
            'value' => array(
                'type' => 'text',
                'name' => 'value',
                'caption' => _t('_adm_form_txt_field_value_custom_text'),
                'info' => '',
                'value' => '',
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'caption', $aFields);

        unset(
            $this->aForm['inputs']['collapsed']
        );
    }
}

class BxBaseStudioFormsFieldText extends BxBaseStudioFormsFieldBlockHeader
{
    protected $sType = 'text';
    protected $aCheckFunctions = array('avail', 'length', 'preg', 'email');
    protected $sDbPass = 'Xss';

    protected $aFieldUnique;

    public function init()
    {
        parent::init();

        $this->aParams['table_alter'] = true;
        $this->aParams['table_field_type'] = 'varchar(255)';

        $this->aForm['inputs']['caption']['info'] = _t('_adm_form_dsc_field_caption');

        $this->aFieldUnique = array(
            'type' => 'switcher',
            'name' => 'unique',
            'caption' => _t('_adm_form_txt_field_unique'),
            'info' => _t('_adm_form_dsc_field_unique'),
            'value' => '1',
            'required' => '0',
            'attrs' => array(
                'id' => 'bx-form-field-unique'
            ),
            'db' => array (
                'pass' => 'Int',
            )
        );

        $aFields = array(
            'value' => array(
                'type' => 'text',
                'name' => 'value',
                'caption' => _t('_adm_form_txt_field_value_default'),
                'info' => '',
                'value' => '',
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'info' => array(
                'type' => 'textarea_translatable',
                'name' => 'info',
                'caption' => _t('_adm_form_txt_field_info'),
                'info' => _t('_adm_form_dsc_field_info'),
                'value' => '_sys_form_txt_field',
                'required' => '0',
                'code' => 1,
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'help' => array(
                'type' => 'textarea_translatable',
                'name' => 'help',
                'caption' => _t('_adm_form_txt_field_help'),
                'info' => _t('_adm_form_dsc_field_help'),
                'value' => '_sys_form_txt_field',
                'required' => '0',
                'html' => 2,
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'area_label' => array(
                'type' => 'text_translatable',
                'name' => 'area_label',
                'caption' => _t('_adm_form_txt_field_area_label'),
                'info' => _t('_adm_form_dsc_field_area_label'),
                'value' => '_sys_form_txt_field',
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                ),
            ),
            'required' => array(
                'type' => 'switcher',
                'name' => 'required',
                'caption' => _t('_adm_form_txt_field_required'),
                'info' => _t('_adm_form_dsc_field_required'),
                'value' => '1',
                'required' => '0',
                'attrs' => array(
                    'id' => 'bx-form-field-required',
                    'onchange' => $this->getJsObject() . ".onCheckRequired(this)"
                ),
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'unique' => $this->aFieldUnique
        );

        $aFields = array_merge($aFields, $this->getCheckerFields());

        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'caption', $aFields);
        unset($this->aForm['inputs']['collapsed']);
    }
}

class BxBaseStudioFormsFieldPassword extends BxBaseStudioFormsFieldText
{
    protected $sType = 'password';
    protected $aCheckFunctions = array('avail', 'length', 'preg', 'password');

    public function init()
    {
        parent::init();

        unset($this->aForm['inputs']['unique']);
    }
}

class BxBaseStudioFormsFieldTextarea extends BxBaseStudioFormsFieldText
{
    protected $sType = 'textarea';
    protected $aCheckFunctions = array('avail', 'length', 'preg');

    public function init()
    {
        parent::init();

        $this->aParams['table_field_type'] = 'text';

        $this->aForm['inputs']['value']['type'] = $this->sType;

        $aFields = array(
            'html' => array(
                'type' => 'select',
                'name' => 'html',
                'caption' => _t('_adm_form_txt_field_html'),
                'info' => _t('_adm_form_dsc_field_html'),
                'value' => '0',
                'values' => array(
                    array('key' => '0', 'value' => _t('_adm_form_txt_field_html_none')),
                    array('key' => '1', 'value' => _t('_adm_form_txt_field_html_standard')),
                    array('key' => '2', 'value' => _t('_adm_form_txt_field_html_full')),
                    array('key' => '3', 'value' => _t('_adm_form_txt_field_html_mini')),
                ),
                'required' => '0',
                'db' => array (
                    'pass' => 'Int',
                )
            ),
        );

        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'help', $aFields);
        unset($this->aForm['inputs']['unique']);
    }
}

class BxBaseStudioFormsFieldDatepicker extends BxBaseStudioFormsFieldText
{
    protected $sType = 'datepicker';
    protected $aCheckFunctions = array('date','date_range');
    protected $sDbPass = 'DateTs';
    protected $aDbPassDependency = array(
        'Date' => array('alter' => 'date'),
    	'DateTs' => array('alter' => 'int(11)'),
    	'DateUtc' => array('alter' => 'int(11)'),
    );

    public function init()
    {
        parent::init();

        $this->aParams['table_field_type'] = 'int(11)';

        $this->aForm['inputs']['value']['type'] = $this->sType;
        $this->aForm['inputs']['value']['db']['pass'] = $this->sDbPass;

        $aFields = array(
            'db_pass' => array(
                'type' => 'select',
                'name' => 'db_pass',
                'caption' => _t('_adm_form_txt_field_db_pass'),
                'info' => _t('_adm_form_dsc_field_db_pass'),
                'value' => $this->sDbPass,
                'values' => array(
                    array('key' => '', 'value' => _t('_adm_form_txt_field_db_pass_select_value')),
                    array('key' => 'Date', 'value' => _t('_adm_form_txt_field_db_pass_date')),
                    array('key' => 'DateTs', 'value' => _t('_adm_form_txt_field_db_pass_date_ts')),
                    array('key' => 'DateUtc', 'value' => _t('_adm_form_txt_field_db_pass_date_utc')),
                ),
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
        );

        unset($this->aForm['inputs']['db_pass']);
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'controls', $aFields, false);
    }
}

class BxBaseStudioFormsFieldDateselect extends BxBaseStudioFormsFieldDatepicker
{
    protected $sType = 'dateselect';
}

class BxBaseStudioFormsFieldDatetime extends BxBaseStudioFormsFieldDatepicker
{
    protected $sType = 'datetime';
    protected $aCheckFunctions = array('date_time');
    protected $sDbPass = 'DateTimeTs';
    protected $aDbPassDependency = array(
        'DateTime' => array('alter' => 'datetime'),
    	'DateTimeTs' => array('alter' => 'int(11)'),
    	'DateTimeUtc' => array('alter' => 'int(11)'),
    );

    public function init()
	{
		parent::init();

        $this->aForm['inputs']['value']['db']['pass'] = $this->sDbPass;

        $this->aForm['inputs']['db_pass']['values'] = array(
            array('key' => '', 'value' => _t('_adm_form_txt_field_db_pass_select_value')),
            array('key' => 'DateTime', 'value' => _t('_adm_form_txt_field_db_pass_date_time')),
            array('key' => 'DateTimeTs', 'value' => _t('_adm_form_txt_field_db_pass_date_time_ts')),
            array('key' => 'DateTimeUtc', 'value' => _t('_adm_form_txt_field_db_pass_date_time_utc')),
        );
    }
}

class BxBaseStudioFormsFieldCheckbox extends BxBaseStudioFormsFieldText
{
    protected $sType = 'checkbox';
    protected $aCheckFunctions = array('avail', 'length', 'preg');

    public function init()
	{
		parent::init();

        $this->aForm['inputs']['value']['type'] = 'hidden';
        $this->aForm['inputs']['value']['caption'] = _t('_adm_form_txt_field_value_checkbox');
        $this->aForm['inputs']['value']['value'] = '1';
        $this->aForm['inputs']['value']['info'] = _t('_adm_form_dsc_field_value_checkbox');

        $aFields = array(
            'checked' => array(
                'type' => 'checkbox',
                'name' => 'checked',
                'caption' => _t('_adm_form_txt_field_checked'),
                'value' => '1',
                'required' => '0',
                'db' => array (
                    'pass' => 'Int',
                )
            )
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'value', $aFields);
        unset($this->aForm['inputs']['unique']);
    }
}

class BxBaseStudioFormsFieldSwitcher extends BxBaseStudioFormsFieldCheckbox
{
    protected $sType = 'switcher';

    public function init()
	{
		parent::init();

        $this->aForm['inputs']['checked']['caption'] = _t('_adm_form_txt_field_checked_switcher');
    }
}

class BxBaseStudioFormsFieldFile extends BxBaseStudioFormsFieldText
{
    protected $sType = 'file';
    protected $aCheckFunctions = array('avail', 'length', 'preg');
    protected $sDbPass = '';

    public function init()
	{
		parent::init();

        unset(
            $this->aForm['inputs']['value'],
            $this->aForm['inputs']['unique']
        );
    }
}

class BxBaseStudioFormsFieldFiles extends BxBaseStudioFormsFieldFile
{
    protected $sType = 'files';

    public function init()
    {
        parent::init();

        $aFields = array(
            'values' => array(
                'type' => 'hidden',
                'name' => 'values',
                'value' => array(),
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
            'value' => array(
                'type' => 'checkbox_set',
                'name' => 'value',
                'caption' => _t('_adm_form_txt_field_value_files'),
                'info' => '',
                'value' => array(),
            	'values' => array(),
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                )
            )
        );

        $aUploaders = array(
            'sys_html5' => '_sys_uploader_html5_title'
        );
        foreach($aUploaders as $sObject => $sTitle) {
            $aUploader = BxDolUploaderQuery::getUploaderObject($sObject);
            if(empty($aUploader) || !is_array($aUploader) || (int)$aUploader['active'] == 0)
                continue;

            $aFields['values']['value'][$sObject] = $sTitle;
            $aFields['value']['values'][$sObject] = _t($sTitle);
        }
        $aFields['values']['value'] = !empty($aFields['values']['value']) && is_array($aFields['values']['value']) ? serialize($aFields['values']['value']) : '';

        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'required', $aFields);
    }

    protected function onSubmitField(&$oForm)
    {
    	//--- Process field value.
        if(isset($oForm->aInputs['value']['db'])) 
        	$this->onSubmitFieldValue($oForm);

		parent::onSubmitField($oForm);
    }

	protected function onSubmitFieldValue(&$oForm)
    {
    	$mixedValue = $oForm->getCleanValue('value');
		if(is_array($mixedValue))
			BxDolForm::setSubmittedValue('value', serialize($mixedValue), $oForm->aFormAttrs['method']);
    }

    /*
     * Note. Value of Values should be saved as is in case of 'Files' field.
     */
	protected function onSubmitFieldValues(&$oForm)
    {
		return;
    }
}

class BxBaseStudioFormsFieldNumber extends BxBaseStudioFormsFieldText
{
    protected $sType = 'number';
    protected $aCheckFunctions = array('avail', 'length', 'preg');
    protected $sDbPass = 'Int';

    public function init()
	{
		parent::init();

        $this->aParams['table_field_type'] = 'int(11)';

        $this->aForm['inputs']['value']['db']['pass'] = 'Int';
        $this->aForm['inputs']['value']['checker'] = array (
            'func' => 'preg',
            'params' => array('/^\d*?$/'),
            'error' => _t('_adm_form_err_field_value_number'),
        );
    }
}

class BxBaseStudioFormsFieldPrice extends BxBaseStudioFormsFieldText
{
    protected $sType = 'price';
    protected $aCheckFunctions = ['avail', 'length', 'preg'];
    protected $sDbPass = 'Float';

    public function init() 
    {
        parent::init();

        $this->aParams['table_field_type'] = 'float';

        $this->aForm['inputs']['value']['db']['pass'] = 'Float';
        $this->aForm['inputs']['value']['checker'] = [
            'func' => 'preg',
            'params' => array('/^\d*?$/'),
            'error' => _t('_adm_form_err_field_value_number'),
        ];
    }
}

class BxBaseStudioFormsFieldNestedForm extends BxBaseStudioFormsFieldBlockHeader
{
    protected $sType = 'nested_form';

    public function init()
    {
        parent::init();

        $aFormsParams = ['type' => 'nested', 'parent_form' => $this->aParams['object']];
        if(bx_get('ids'))
            $aFormsParams['ids'] = implode(',', bx_get('ids'));
        
        $aFormsData = [];
        $this->oDb->getForms($aFormsParams, $aFormsData, false);
        foreach($aFormsData as $sKey => $sValue)
            $aFormsData[$sKey] = _t($sValue);

        $aFields = array(
            'value' => array(
                'type' => 'select',
                'name' => 'value',
                'caption' => _t('_adm_form_txt_field_select_nested_form'),
                'values' => $aFormsData,
                'required' => '1',
                'db' => array (
                    'pass' => 'Xss',
                ),
                'checker' => array (
                    'func' => 'avail',
                    'error' => _t('_adm_form_err_field_select_nested_form'),
                ),
            ),
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'caption', $aFields);

        unset(
            $this->aForm['inputs']['collapsed'],
            $this->aForm['inputs']['icon'],
            $this->aForm['inputs']['icon_preview']
        );
    }
}

class BxBaseStudioFormsFieldTime extends BxBaseStudioFormsFieldText
{
    protected $sType = 'time';
    protected $aCheckFunctions = array('avail');
    protected $sDbPass = 'Xss';
    
    public function init()
	{
		parent::init();

        $this->aParams['table_field_type'] = 'time';

        $this->aForm['inputs']['value']['db']['pass'] = 'Xss';
    }
}

class BxBaseStudioFormsFieldSlider extends BxBaseStudioFormsFieldNumber
{
    protected $sType = 'slider';
    protected $aCheckFunctions = array('avail', 'length');

    public function init()
	{
		parent::init();

        $aFields = array(
            'attrs' => array(
                'type' => 'hidden',
                'name' => 'attrs',
                'value' => '',
                'db' => array (
                    'pass' => 'Xss',
                ),
            ),
            'attrs_min' => array(
                'type' => 'text',
                'name' => 'attrs_min',
                'caption' => _t('_adm_form_txt_field_attrs_min'),
                'info' => _t('_adm_form_dsc_field_attrs_min'),
                'value' => '1',
                'required' => '0',
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'attrs_max' => array(
                'type' => 'text',
                'name' => 'attrs_max',
                'caption' => _t('_adm_form_txt_field_attrs_max'),
                'info' => _t('_adm_form_dsc_field_attrs_max'),
                'value' => '100',
                'required' => '0',
                'db' => array (
                    'pass' => 'Int',
                )
            ),
            'attrs_step' => array(
                'type' => 'text',
                'name' => 'attrs_step',
                'caption' => _t('_adm_form_txt_field_attrs_step'),
                'info' => _t('_adm_form_dsc_field_attrs_step'),
                'value' => '1',
                'required' => '0',
                'db' => array (
                    'pass' => 'Int',
                )
            ),
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'value', $aFields);
        unset($this->aForm['inputs']['unique']);
    }
}

class BxBaseStudioFormsFieldDoublerange extends BxBaseStudioFormsFieldSlider
{
    protected $sType = 'doublerange';
    protected $aCheckFunctions = array('avail', 'length');
    protected $sDbPass = 'Xss';

    public function init()
	{
		parent::init();

        $this->aParams['table_field_type'] = 'varchar(255)';

        $this->aForm['inputs']['value']['db']['pass'] = 'Xss';
        $this->aForm['inputs']['value']['checker'] = array (
            'func' => 'preg',
            'params' => array('/^(\d+-\d+)?$/'),
            'error' => _t('_adm_form_err_field_value_doublerange'),
        );
    }
}

class BxBaseStudioFormsFieldHidden extends BxBaseStudioFormsFieldText
{
    protected $sType = 'hidden';
    protected $aCheckFunctions = array('avail', 'length', 'preg', 'date', 'date_time', 'email');
    protected $sDbPass = '';

    public function init()
	{
		parent::init();

        unset(
            $this->aForm['inputs']['caption'],
            $this->aForm['inputs']['info'],
            $this->aForm['inputs']['required'],
            $this->aForm['inputs']['unique'],
            $this->aForm['inputs']['checker_func'],
            $this->aForm['inputs']['checker_params'],
            $this->aForm['inputs']['checker_params_length_min'],
            $this->aForm['inputs']['checker_params_length_max'],
            $this->aForm['inputs']['checker_params_required'],
            $this->aForm['inputs']['checker_params_preg'],
            $this->aForm['inputs']['checker_error']
        );
    }
}

class BxBaseStudioFormsFieldButton extends BxBaseStudioFormsFieldText
{
    protected $sType = 'button';
    protected $sDbPass = '';

    public function init()
	{
		parent::init();

        $this->aParams['table_alter'] = false;

        $this->aForm['inputs']['value']['type'] = 'text_translatable';
        $this->aForm['inputs']['value']['caption'] = _t('_adm_form_txt_field_value_button');
        $this->aForm['inputs']['value']['info'] = _t('_adm_form_dsc_field_value_button');
        $this->aForm['inputs']['value']['value'] = '_sys_form_txt_field';

        unset(
            $this->aForm['inputs']['caption'],
            $this->aForm['inputs']['info'],
            $this->aForm['inputs']['required'],
            $this->aForm['inputs']['unique'],
            $this->aForm['inputs']['checker_func'],
            $this->aForm['inputs']['checker_params'],
            $this->aForm['inputs']['checker_params_length_min'],
            $this->aForm['inputs']['checker_params_length_max'],
            $this->aForm['inputs']['checker_params_required'],
            $this->aForm['inputs']['checker_params_preg'],
            $this->aForm['inputs']['checker_error']
        );
    }
}

class BxBaseStudioFormsFieldReset extends BxBaseStudioFormsFieldButton
{
    protected $sType = 'reset';

    public function init()
	{
		parent::init();

        $this->aForm['inputs']['value']['info'] = _t('_adm_form_dsc_field_value_reset');
    }
}

class BxBaseStudioFormsFieldSubmit extends BxBaseStudioFormsFieldButton
{
    protected $sType = 'submit';

    public function init()
	{
		parent::init();

        $this->aForm['inputs']['value']['info'] = _t('_adm_form_dsc_field_value_submit');
    }
}

class BxBaseStudioFormsFieldImage extends BxBaseStudioFormsFieldButton
{
    protected $sType = 'image';

    public function init()
	{
		parent::init();

        $aFields = array(
            'attrs' => array(
                'type' => 'hidden',
                'name' => 'attrs',
                'value' => '',
                'db' => array (
                    'pass' => 'Xss',
                ),
            ),
            'attrs_src' => array(
                'type' => 'text',
                'name' => 'attrs_src',
                'caption' => _t('_adm_form_txt_field_attrs_src'),
                'info' => _t('_adm_form_dsc_field_attrs_src'),
                'value' => '',
                'required' => '0',
                'db' => array (
                    'pass' => 'Xss',
                )
            ),
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'value', $aFields);

        unset(
            $this->aForm['inputs']['value']
        );
    }
}

class BxBaseStudioFormsFieldSelect extends BxBaseStudioFormsFieldText
{
    protected $sType = 'select';
    protected $aCheckFunctions = array('avail', 'length', 'preg');

    public function init()
	{
		parent::init();

        $this->aForm['inputs']['value']['type'] = 'select';
        $this->aForm['inputs']['value']['values'] = array(
            array('key' => '', 'value' => _t('_adm_form_txt_field_value_select_value'))
        );
        $this->aForm['inputs']['value']['attrs'] = array(
            'id' => 'adm-form-field-add-value'
        );

        $aFields = array(
            'values' => array(
                'type' => 'select',
                'name' => 'values',
                'caption' => _t('_adm_form_txt_field_values'),
                'info' => '',
                'value' => '',
                'values' => array(
                    array('key' => '', 'value' => _t('_adm_form_txt_field_values_select_list'))
                ),
                'required' => '1',
                'attrs' => array(
                    'onChange' => $this->getJsObject() . ".onChangeValues(0, this)"
                ),
                'db' => array (
                    'pass' => 'Xss',
                ),
                'checker' => array (
                    'func' => 'avail',
                    'params' => array(),
                    'error' => _t('_adm_form_err_field_values'),
                ),
            )
        );

        $aLists = array();
        $this->oDb->getLists(array('type' => 'all'), $aLists, false);
        foreach($aLists as $aList)
            $aFields['values']['values'][] = array('key' => BX_DATA_LISTS_KEY_PREFIX . $aList['key'], 'value' => _t($aList['title']));

        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'caption', $aFields);
        unset($this->aForm['inputs']['unique']);
    }
}

class BxBaseStudioFormsFieldRadioSet extends BxBaseStudioFormsFieldSelect
{
    protected $sType = 'radio_set';
    protected $aCheckFunctions = array('avail', 'length', 'preg');
}

class BxBaseStudioFormsFieldSelectMultiple extends BxBaseStudioFormsFieldSelect
{
    protected $sType = 'select_multiple';
    protected $aCheckFunctions = array('avail', 'length', 'preg');
    protected $sDbPass = 'Set';

    public function init()
	{
		parent::init();

        $this->aParams['table_field_type'] = 'bigint(20)';

        $this->aForm['inputs']['value']['type'] = 'select_multiple';
        $this->aForm['inputs']['value']['values'] = array();
        $this->aForm['inputs']['value']['db']['pass'] = 'Set';
        $this->aForm['inputs']['values']['values'] = array(
            array('key' => '', 'value' => _t('_adm_form_txt_field_values_select_list'))
        );
        $this->aForm['inputs']['values']['attrs']['onChange'] = $this->getJsObject() . ".onChangeValues(1, this)";

        $aLists = array();
        $this->oDb->getLists(array('type' => 'all_for_sets'), $aLists, false);
        foreach($aLists as $aList)
            $this->aForm['inputs']['values']['values'][] = array('key' => BX_DATA_LISTS_KEY_PREFIX . $aList['key'], 'value' => _t($aList['title']));
    }
}

class BxBaseStudioFormsFieldCheckboxSet extends BxBaseStudioFormsFieldSelectMultiple
{
    protected $sType = 'checkbox_set';
    protected $aCheckFunctions = array('avail', 'length', 'preg');
}

class BxBaseStudioFormsFieldCustom extends BxBaseStudioFormsFieldText
{
    protected $sType = 'custom';
    protected $sDbPass = '';

	public function init()
	{
		parent::init();

        unset(
            $this->aForm['inputs']['required'],
            $this->aForm['inputs']['unique'],
            $this->aForm['inputs']['checker_func'],
            $this->aForm['inputs']['checker_params'],
            $this->aForm['inputs']['checker_params_length_min'],
            $this->aForm['inputs']['checker_params_length_max'],
            $this->aForm['inputs']['checker_params_required'], 
            $this->aForm['inputs']['checker_params_preg'],
            $this->aForm['inputs']['checker_error']
        );
    }
}

class BxBaseStudioFormsFieldInputSet extends BxBaseStudioFormsFieldCustom
{
    protected $sType = 'input_set';

    public function init()
	{
		parent::init();

        $this->aParams['table_alter'] = false;

        $aFields = array(
            'values' => array(
                'type' => 'value',
                'name' => 'values',
                'caption' => _t('_adm_form_txt_field_values'),
                'value' => ''
            )
        );
        $this->aForm['inputs'] = $this->addInArray($this->aForm['inputs'], 'value', $aFields);

        unset(
            $this->aForm['inputs']['value']
        );
    }
}

class BxBaseStudioFormsFieldCaptcha extends BxBaseStudioFormsFieldText
{
    protected $sType = 'captcha';
    protected $aCheckFunctions = array('captcha');
    protected $sDbPass = '';

    public function init()
    {
        parent::init();

        $this->aParams['table_alter'] = false;

        $this->aForm['inputs']['required'] = array(
            'type' => 'hidden',
            'name' => 'required',
            'value' => '1',
            'db' => array (
                'pass' => 'Int',
            )
        );

        $this->aForm['inputs']['checker_func']['type'] = 'hidden';
        $this->aForm['inputs']['checker_func']['value'] = 'captcha';
        $this->aForm['inputs']['checker_error']['info'] = _t('_adm_form_dsc_field_checker_error_captcha');

        unset(
            $this->aForm['inputs']['value'],
            $this->aForm['inputs']['unique'],
            $this->aForm['inputs']['checker_func']['tr_attrs']['style'], $this->aForm['inputs']['checker_error']['tr_attrs']['style'],
            $this->aForm['inputs']['checker_func']['attrs']['disabled'], $this->aForm['inputs']['checker_error']['attrs']['disabled']
        );
    }
}

class BxBaseStudioFormsFieldLocation extends BxBaseStudioFormsFieldText
{
    protected $sType = 'location';
    protected $aCheckFunctions = array('location');
    protected $sDbPass = '';

    public function init()
    {
        parent::init();

        $this->aParams['table_alter'] = false;

        unset(
            $this->aForm['inputs']['unique']
        );
    }
}
/** @} */
