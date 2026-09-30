<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFormsDisplays extends BxDolStudioFormsDisplays
{
    protected $sUrlPage;
    protected $sUrlViewFields;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_form_btn_displays_edit');

        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_forms.php?page=displays';
        $this->sUrlViewFields = BX_DOL_URL_STUDIO . 'builder_forms.php?page=fields&module=%s&object=%s&display=%s';
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

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

        $aDisplay = array();
        $iDisplay = $this->oDb->getDisplays(array('type' => 'by_id', 'value' => $iId), $aDisplay);
        if($iDisplay != 1 || empty($aDisplay)){
            echoJson(array());
            exit;
        }

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-display-edit',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction . '&object=' . $this->sObject,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_form_displays',
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
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_form_txt_displays_title'),
                    'info' => _t('_adm_form_dsc_displays_title'),
                    'value' => $aDisplay['title'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3,100, 'title'),
                        'error' => _t('_adm_form_err_displays_title'),
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_displays_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_displays_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($iId) !== false)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            else
                $aRes = array('msg' => _t('_adm_form_err_displays_edit'));

            echoJson($aRes);
        } 
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-forms-edit-popup', _t('_adm_form_txt_displays_edit_popup', _t($aDisplay['title'])), $this->_oTemplate->parseHtmlByName('form_add_display.html', array(
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    function getJsObject()
    {
        return 'oBxDolStudioFormsDisplays';
    }

    function getFormsSelector($sModule = '')
    {
        $oForm = new BxTemplStudioFormView(array());

        $aInputForms = array(
            'type' => 'select',
            'name' => 'form',
            'attrs' => array(
                'id' => 'bx-grid-form-' . $this->_sObject,
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeForm()'
            ),
            'value' => $this->sObject,
            'values' => array()
        );

        $aForms = array();
        if(!empty($sModule))
            $this->oDb->getForms(array('type' => 'by_module', 'value' => $sModule), $aForms, false);
        else
            $aInputForms['attrs']['disabled'] = 'disabled';

        if(!empty($aForms)) {
            $aCounter = array();
            $this->oDb->getDisplays(array('type' => 'counter_by_forms'), $aCounter, false);
            foreach($aForms as $aForm)
                $aInputForms['values'][$aForm['object']] = _t($aForm['title']) . " (" . (isset($aCounter[$aForm['object']]) ? $aCounter[$aForm['object']] : "0") . ")";

            asort($aInputForms['values']);
        }
        $aInputForms['values'] = array_merge(array('' => _t('_adm_form_txt_select_form')), $aInputForms['values']);

        return $oForm->genRow($aInputForms);
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_displays.html', array(
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
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_displays.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellFields ($mixedValue, $sKey, $aField, $aRow)
    {
        $aFields = array();
        $this->oDb->getInputs(array('type' => 'by_object_display', 'object' => $aRow['object'], 'display' => $aRow['display_name'], 'active' => 1), $aFields, false);

        $sLink = sprintf($this->sUrlViewFields, $aRow['module'], $aRow['object'], $aRow['display_name']);
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_form_txt_forms_n_fields', count($aFields)), array(
            'title' => _t('_adm_form_txt_displays_manage_fields') 
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sContent = $this->getModulesSelectOne('getDisplays', false) . $this->getFormsSelector($this->sModule);

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
}

/** @} */
