<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

bx_import('BxTemplStudioFormsField');

define('BX_DOL_STUDIO_FORMS_FIELDS_JS_OBJECT', 'oBxDolStudioFormsFields');

class BxBaseStudioFormsFields extends BxDolStudioFormsFields
{
    protected $sClass;
    protected $sUrlPage;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aConfirmMessages['delete'] = _t('_adm_form_txt_confirm_delete');
        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_form_btn_field_edit');
        $this->_aOptions['actions_single']['delete']['attr']['title'] = _t('_adm_form_btn_field_delete');

        $this->sClass = 'BxTemplStudioFormsField';
        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_forms.php?page=fields';
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        $sType = '';
        if(($mixedType = bx_get('type')) !== false)
            $sType = bx_process_input($mixedType);

        $oClass = $this->_getFieldObject($sType, array('module' => $this->sModule, 'object' => $this->sObject, 'display' => $this->sDisplay));
        if($oClass === false || !$oClass->canAdd()) {
            echoJson(array('msg' => _t('_adm_form_err_field_add_not_allowed')));
            exit;
        }

        $mixedResult = $oClass->getCode($sAction, $this->_sObject);
        if(is_array($mixedResult))
            echoJson($mixedResult);
        else if(is_string($mixedResult))
            echoJson(array('popup' => array('html' => $mixedResult, 'options' => array('closeOnOuterClick' => false))));
        else if(is_int($mixedResult) || is_bool($mixedResult)) {
            $aResult = $mixedResult !== false ? array('grid' => $this->getCode(false), 'blink' => (int)$mixedResult) : array('msg' => _t('_adm_form_err_field_add'));
            echoJson($aResult);
        }
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('di_id');
            if(!$iId) {
                echoJson(array());
                exit;
            }

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $aField = array();
        $this->oDb->getInputs(array('type' => 'by_object_id', 'object' => $this->sObject, 'id' => (int)$iId), $aField, false);
        if(empty($aField) || !is_array($aField)) {
            echoJson(array());
            exit;
        }

        $sType = '';
        if(($mixedType = bx_get('type')) !== false)
            $aField['type'] = bx_process_input($mixedType);
        
        $oClass = $this->_getFieldObject($aField['type'], array('module' => $this->sModule, 'object' => $this->sObject, 'display' => $this->sDisplay), $aField);
        if($oClass === false) {
            echoJson(array());
            exit;
        }

        $mixedResult = $oClass->getCode($sAction, $this->_sObject);
        if(is_string($mixedResult))
            echoJson(array('popup' => array('html' => $mixedResult, 'options' => array('closeOnOuterClick' => false))));
        else if(is_bool($mixedResult)) {
            $aResult = $mixedResult ? array('grid' => $this->getCode(false), 'blink' => $iId) : array('msg' => _t('_adm_form_err_field_edit'));
            echoJson($aResult);
        }
    }

    public function performActionDelete()
    {
        $sAction = 'delete';

        $iAffected = 0;
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $aIdsAffected = array ();
        foreach($aIds as $iId) {
            $aField = array();
            $this->oDb->getInputs(array('type' => 'by_object_id', 'object' => $this->sObject, 'id' => (int)$iId), $aField, false);
            if(empty($aField) || !is_array($aField))
                continue;

            if((int)$aField['deletable'] != 1)
                continue;

            $oClass = $this->_getFieldObject($aField['type'], array('module' => $this->sModule, 'object' => $this->sObject, 'display' => $this->sDisplay));
            if($oClass === false || (int)$this->_delete($iId) <= 0 || !$this->oDb->deleteInputs(array('type' => 'by_id', 'value' => $aField['id'], 'object' => $aField['object'], 'name' => $aField['name'])))
                continue;

            $oClass->alterRemove($aField['name']);

            $oLanguage = BxDolStudioLanguagesUtils::getInstance();
            if(!empty($aField['caption']))
                $oLanguage->deleteLanguageString($aField['caption']);
            if(!empty($aField['info']))
                $oLanguage->deleteLanguageString($aField['info']);
            if(!empty($aField['checker_error']))
                $oLanguage->deleteLanguageString($aField['checker_error']);

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t('_adm_from_err_field_delete')));
    }

    public function performActionShowTo()
    {
        $sAction = 'show_to';

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId) {
                echoJson(array());
                exit;
            }

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $aField = array();
        $this->oDb->getInputs(array('type' => 'by_object_id', 'object' => $this->sObject, 'id' => (int)$iId), $aField, false);
        if(empty($aField) || !is_array($aField)) {
            echoJson(array());
            exit;
        }

        bx_import('BxDolStudioUtils');
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-field-visibility',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction . '&object=' . $this->sObject . '&display=' . $this->sDisplay,
                'method' => 'post'
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_form_display_inputs',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $iId,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'visible_for' => array(
                    'type' => 'select',
                    'name' => 'visible_for',
                    'caption' => _t('_adm_form_txt_field_visible_for'),
                    'info' => '',
                    'value' => $aField['visible_for_levels'] == BX_DOL_INT_MAX ? BX_DOL_STUDIO_VISIBLE_ALL : BX_DOL_STUDIO_VISIBLE_SELECTED,
                    'values' => array(
                        array('key' => BX_DOL_STUDIO_VISIBLE_ALL, 'value' => _t('_adm_form_txt_field_visible_for_all')),
                        array('key' => BX_DOL_STUDIO_VISIBLE_SELECTED, 'value' => _t('_adm_form_txt_field_visible_for_selected')),
                    ),
                    'required' => '0',
                    'attrs' => array(
                        'onchange' => $this->getJsObject() . '.onChangeVisibleFor(this)'
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'visible_for_levels' => array(
                    'type' => 'checkbox_set',
                    'name' => 'visible_for_levels',
                    'caption' => _t('_adm_form_txt_field_visible_for_levels'),
                    'info' => _t('_adm_form_dsc_field_visible_for_levels'),
                    'value' => '',
                    'values' => array(),
                    'tr_attrs' => array(
                        'style' => $aField['visible_for_levels'] == BX_DOL_INT_MAX ? 'display:none' : ''
                    ),
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_field_save'),
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

        BxDolStudioUtils::getVisibilityValues($aField['visible_for_levels'], $aForm['inputs']['visible_for_levels']['values'], $aForm['inputs']['visible_for_levels']['value']);

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->updateWithVisibility($iId) !== false)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            else
                $aRes = array('msg' => _t('_adm_form_err_field_show_to'));

            echoJson($aRes);
        } 
        else {
            $sCaption = _t($aField['caption_system']);
            if(empty($sCaption))
                $sCaption = _t($aField['caption']);

            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-field-show-to-popup', _t('_adm_form_txt_field_show_to_popup', $sCaption), $this->_oTemplate->parseHtmlByName('form_add_field.html', array(
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => $sContent));
        }
    }

    function getJsObject()
    {
        return BX_DOL_STUDIO_FORMS_FIELDS_JS_OBJECT;
    }

    function getDisplaysSelector($sModule = '')
    {
        $oForm = new BxTemplStudioFormView(array());

        $aInputDisplays = array(
            'type' => 'select',
            'name' => 'display',
            'attrs' => array(
                'id' => 'bx-grid-display-' . $this->_sObject,
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeDisplay()'
            ),
            'value' => $this->sObject . $this->sParamsDivider . $this->sDisplay,
            'values' => array(
                '' => _t('_adm_form_txt_select_display'),
            )
        );

        $aDisplays = array();
        if(!empty($sModule))
            $this->oDb->getDisplays(array('type' => 'by_module_with_forms', 'value' => $sModule), $aDisplays, false);
        else
            $aInputDisplays['attrs']['disabled'] = 'disabled';

        if(!empty($aDisplays)) {
            $aDisplaysGrouped = $aCounter = array();
            $this->oDb->getInputs(array('type' => 'counter_by_displays'), $aCounter, false);

            foreach($aDisplays as $aDisplay)
                $aDisplaysGrouped[_t($aDisplay['form_title'])][] = $aDisplay;
            ksort($aDisplaysGrouped);

            foreach($aDisplaysGrouped as $sForm => $aDisplays) {
                if(!empty($aDisplays))
                    $aInputDisplays['values'][] = array('type' => 'group_header', 'value' => _t($aDisplays[0]['form_title']) . " (" . (isset($aCounter[$aDisplays[0]['name']]) ? $aCounter[$aDisplays[0]['name']] : "0") . ")");

                $aDisplaysSubgroup = array();
                foreach($aDisplays as $aDisplay)
                    $aDisplaysSubgroup[$aDisplay['object'] . $this->sParamsDivider . $aDisplay['name']] = _t($aDisplay['title']);

                asort($aDisplaysSubgroup);
                $aInputDisplays['values'] = array_merge($aInputDisplays['values'], $aDisplaysSubgroup);

                if(!empty($aDisplays))
                    $aInputDisplays['values'][] = array('type' => 'group_end');
            }
        }

        return $oForm->genRow($aInputDisplays);
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_fields.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'page_url' => $this->sUrlPage,
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addCss(array('menu.css'));
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_fields.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getFieldObject ($sType, $aParams = array(), $aField = array())
    {
        $sClass = $this->sClass . $this->getClassName($sType);
        if(!class_exists($sClass)) 
            return false;

        $oClass = new $sClass($aParams, $aField);
        $oClass->init();
        if(method_exists($oClass, 'onInit'))
            $oClass->onInit();

        return $oClass;
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$this->_isEditable($aRow))
            return parent::_getCellDefault('', $sKey, $aField, $aRow);

        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellType ($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_oTemplate->getIcon('ui-' . $aRow['type'] . '.png', array('alt' => _t('_adm_form_txt_field_type_' . $aRow['type'])));
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellCaptionSystem ($mixedValue, $sKey, $aField, $aRow)
    {
        if(empty($mixedValue))
            $mixedValue = _t($aRow['caption']);

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellVisibleForLevels ($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$this->_isEditable($aRow))
            return parent::_getCellDefault('', $sKey, $aField, $aRow);

        $mixedValue = $this->_oTemplate->parseLink('javascript:void(0)', BxDolStudioUtils::getVisibilityTitle($aRow['visible_for_levels']), array(
            'title' => _t('_adm_form_txt_fields_manage_visibility'),
        	'bx_grid_action_single' => 'show_to',
            'bx_grid_action_data' => $aRow['id']
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionAdd ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($this->sDisplay == '')
            $isDisabled = true;

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getActionEdit ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($sType == 'single' && !$this->_isEditable($aRow))
            return '';

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($sType == 'single' && !$this->_isDeletable($aRow))
            return '';

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getActionShowTo ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getActionsDisabledBehavior($aRow)
    {
        return false;
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sContent = $this->getModulesSelectOne('getInputs') . $this->getDisplaysSelector($this->sModule);

        $oForm = new BxTemplStudioFormView(array());

        $aInputSearch = array(
            'type' => 'text',
            'name' => 'keyword',
            'attrs' => array(
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_search'),
            ),
            'tr_attrs' => array(
                'style' => 'display:none;'
            )
        );
        $sContent .= $oForm->genRow($aInputSearch);

        return  $sContent;
    }

    protected function _isEditable(&$aRow)
    {
    	return (int)$aRow['editable'] != 0;
    }

	protected function _isDeletable(&$aRow)
    {
    	return (int)$aRow['deletable'] != 0;
    }
}

/** @} */
