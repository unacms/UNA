<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioPolyglotEtemplates extends BxDolStudioPolyglotEtemplates
{
    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_pgt_btn_etemplates_gl_edit_title');
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

        $aEtemplate = array();
        $this->oDb->getEtemplates(array('type' => 'by_id', 'value' => $iId), $aEtemplate, false);
        if(empty($aEtemplate) || !is_array($aEtemplate)){
            echoJson(array());
            exit;
        }

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-pgt-etemplate-edit',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_email_templates',
                    'key' => 'ID',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'ID' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $iId,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'NameSystem' => array(
                    'type' => 'text_translatable',
                    'name' => 'NameSystem',
                    'caption' => _t('_adm_pgt_txt_etemplates_name_system'),
                    'info' => _t('_adm_pgt_dsc_etemplates_name_system'),
                    'value' => $aEtemplate['name_system'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3,100, 'NameSystem'),
                        'error' => _t('_adm_pgt_err_etemplates_name_system'),
                    ),
                ),
                'Subject' => array(
                    'type' => 'text_translatable',
                    'name' => 'Subject',
                    'caption' => _t('_adm_pgt_txt_etemplates_subject'),
                    'info' => _t('_adm_pgt_dsc_etemplates_subject'),
                    'value' => $aEtemplate['subject'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'AvailTranslatable',
                        'params' => array('Subject'),
                        'error' => _t('_adm_pgt_err_etemplates_subject'),
                    ),
                ),
                'Body' => array(
                    'type' => 'textarea_translatable',
                    'name' => 'Body',
                    'caption' => _t('_adm_pgt_txt_etemplates_body'),
                    'info' => _t('_adm_pgt_dsc_etemplates_body'),
                    'value' => $aEtemplate['body'],
                	'code' => 1,
                    'required' => '1',
                    'db' => array (
                        'pass' => 'XssHtml',
                    ),
                    'checker' => array (
                        'func' => 'AvailTranslatable',
                        'params' => array('Body'),
                        'error' => _t('_adm_pgt_err_etemplates_body'),
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_pgt_btn_etemplates_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_pgt_btn_etemplates_cancel'),
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
                $aRes = array('msg' => _t('_adm_pgt_err_etemplates_edit'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-pgt-etemplate-edit-popup', _t('_adm_pgt_txt_etemplates_edit_popup', _t($aEtemplate['name_system'])), $this->_oTemplate->parseHtmlByName('pgt_new_etemplate.html', array(
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
        return 'oBxDolStudioPolyglotEtemplates';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('pgt_etemplates.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'polyglot_etemplates.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['Module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
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
        $this->oDb->getEtemplates(array('type' => 'counter_by_modules'), $aCounter, false);
        foreach($aInputModules['values'] as $sKey => $sValue)
            $aInputModules['values'][$sKey] = $aInputModules['values'][$sKey] . " (" . (isset($aCounter[$sKey]) ? $aCounter[$sKey] : "0") . ")";

        $aInputModules['values'] = array_merge(array('' => _t('_adm_pgt_txt_all_modules')), $aInputModules['values']);

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
