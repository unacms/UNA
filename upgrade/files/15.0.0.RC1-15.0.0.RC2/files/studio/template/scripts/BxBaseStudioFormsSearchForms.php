<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFormsSearchForms extends BxDolStudioFormsSearchForms
{
    protected $_sFilter;

    protected $sUrlViewFields;
    protected $sUrlViewSortableFields;

    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_form_btn_search_forms_edit');

        $this->_sFilter = '';
        if(($sFilter = $this->_getFilterValue()))
            $this->_sFilter = $sFilter;

        $this->sUrlViewFields = BX_DOL_URL_STUDIO . 'builder_forms.php?page=search_fields&module=%s&form=%s';
        $this->sUrlViewSortableFields = BX_DOL_URL_STUDIO . 'builder_forms.php?page=search_sortable_fields&module=%s&form=%s';
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

        $aFormData = array();
        $iFormData = $this->oDb->getSearchForms(array('type' => 'by_id', 'id' => $iId), $aFormData);
        if($iFormData != 1 || empty($aFormData)){
            echoJson(array());
            exit;
        }

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-search-form-edit',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
                    'o' => $this->_sObject, 
                    'a' => $sAction, 
                    $this->_aOptions['filter_get'] => $this->_sFilter
                ]),
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_objects_search_extended',
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
                    'caption' => _t('_adm_form_txt_search_forms_title'),
                    'info' => _t('_adm_form_dsc_search_forms_title'),
                    'value' => $aFormData['title'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3,100, 'title'),
                        'error' => _t('_adm_form_err_search_forms_title'),
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_search_forms_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_search_forms_cancel'),
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
                $aRes = array('msg' => _t('_adm_form_err_search_forms_edit'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-search-forms-edit-popup', _t('_adm_form_txt_search_forms_edit_popup', _t($aFormData['title'])), $this->_oTemplate->parseHtmlByName('form_add_search_form.html', array(
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
        return 'oBxDolStudioFormsSearchForms';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_search_forms.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_search_forms.js'));

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
        $this->oDb->getSearchFields(array('type' => 'by_object', 'object' => $aRow['object']), $aFields, false);

        $sLink = sprintf($this->sUrlViewFields, $aRow['module'], $aRow['object']);
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_form_txt_search_forms_n_fields', count($aFields)), array(
            'title' => _t('_adm_form_txt_search_forms_manage_fields')
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellSortableFields ($mixedValue, $sKey, $aField, $aRow)
    {
        $aFields = array();
        $this->oDb->getSortableFields(array('type' => 'by_object', 'object' => $aRow['object']), $aFields, false);

        $sLink = sprintf($this->sUrlViewSortableFields, $aRow['module'], $aRow['object']);
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_form_txt_search_forms_n_fields', count($aFields)), array(
            'title' => _t('_adm_form_txt_search_forms_manage_fields')
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sContent = "";

        $sJsObject = $this->getJsObject();
        $oForm = new BxTemplStudioFormView(array());

        $aInputModules = array(
            'type' => 'select',
            'name' => 'module',
            'attrs' => array(
                'id' => 'bx-grid-module-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_module'),
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeFilter()'
            ),
            'value' => '',
            'values' => $this->getModules(false)
        );

        $aCounter = array();
        $this->oDb->getSearchForms(array('type' => 'counter_by_modules'), $aCounter, false);
        foreach($aInputModules['values'] as $sKey => $sValue){
            if (isset($aCounter[$sKey]) && $aCounter[$sKey] > 0)
                $aInputModules['values'][$sKey] = $aInputModules['values'][$sKey] . " (" . (isset($aCounter[$sKey]) ? $aCounter[$sKey] : "0") . ")";
            else
                unset($aInputModules['values'][$sKey]);
        }

        $aInputModules['values'] = array_merge(array('' => _t('_adm_form_txt_all_modules')), $aInputModules['values']);

        $sContent .= $oForm->genRow($aInputModules);

        $aInputSearch = array(
            'type' => 'text',
            'name' => 'keyword',
            'attrs' => array(
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_search'),
                'onKeyup' => 'javascript:$(this).off(\'keyup focusout\'); ' . $sJsObject . '.onChangeFilter()',
            	'onBlur' => 'javascript:' . $sJsObject . '.onChangeFilter()',
            )
        );
        $sContent .= $oForm->genRow($aInputSearch);

        return  $sContent;
    }
}

/** @} */
