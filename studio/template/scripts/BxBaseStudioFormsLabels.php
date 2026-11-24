<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

bx_import('BxTemplStudioFormView');

class BxStudioFormsLabelsCheckerHelper extends BxDolFormCheckerHelper
{
    public function checkAvailUnique($s, $aExclude = [])
    {
        if(!preg_match("/(\pL[\pL\pN_]+)/u", $s))
            return false;

        $aLabel = BxDolLabel::getInstance()->getLabels([
            'type' => 'value', 
            'value' => $s
        ]);

        if(!is_array($aExclude))
            $aExclude = [$aExclude];

        return empty($aLabel) || !is_array($aLabel) || in_array($aLabel['id'], $aExclude);
    }
}

class BxBaseStudioFormsLabels extends BxDolStudioFormsLabels
{
    protected $_sBaseUrl;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_sBaseUrl = BX_DOL_URL_STUDIO . bx_append_url_params('builder_forms.php', array(
            'page' => 'labels'
        ));
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        $oForm = $this->_getForm($sAction);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = array('module' => 'custom');

            $iParent = (int)$oForm->getCleanValue('parent');
            if($iParent != 0) {
                $aParent = $this->_oLabel->getLabels(array('type' => 'id', 'id' => $iParent));

                $aValsToAdd['level'] = $aParent['level'] + 1;
            }
            else
                $aValsToAdd['level'] = 0;

            $aValsToAdd['order'] = $this->_oLabel->getLabels(array('type' => 'parent_order', 'parent' => $iParent)) + 1;

            $iId = $oForm->insert($aValsToAdd);
            if($iId !== false) {
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);

                $this->_oLabel->onAdd($iId);
            }
            else
                $aRes = array('msg' => _t('_adm_form_err_labels_add'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-labels-add-popup', _t('_adm_form_txt_labels_add_popup'), $this->_oTemplate->parseHtmlByName('form_add_label.html', array(
                'form_id' => $oForm->aFormAttrs['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return echoJson(array());

            $aIds = array($iId);
        }

        $iId = (int)array_shift($aIds);

        $aLabel = $this->_oLabel->getLabels(array('type' => 'id', 'id' => $iId));
        if(empty($aLabel) || !is_array($aLabel))
            return echoJson(array());

        $oForm = $this->_getForm($sAction, $aLabel);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($iId) !== false) {
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);

                $this->_oLabel->onEdit($iId);
            }
            else
                $aRes = array('msg' => _t('_adm_form_err_labels_edit'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-labels-edit-popup', _t('_adm_form_txt_labels_edit_popup', $aLabel['value']), $this->_oTemplate->parseHtmlByName('form_add_label.html', array(
                'form_id' => $oForm->aFormAttrs['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    function getJsObject()
    {
        return 'oBxDolStudioFormsLabels';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_labels.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_labels.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getActionBack($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(empty($this->_iParent))
            return '';

        $sUrl = bx_append_url_params($this->_sBaseUrl, array('parent' => $this->_aParent['parent']));

    	$a['attr'] = array_merge($a['attr'], array(
            "onclick" => "window.open('" . $sUrl . "','_self');"
    	));

    	return $this->_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellItems ($mixedValue, $sKey, $aField, $aRow)
    {
        $iItems = $this->_oLabel->getLabels(array('type' => 'parent', 'parent' => $aRow['id'], 'count_only' => true));

        $sLink = bx_append_url_params($this->_sBaseUrl, array('parent' => $aRow['id']));
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_form_txt_labels_n_items', $iItems), array(
            'title' => _t('_adm_form_txt_labels_manage_items')
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getForm($sAction, $aLabel = array())
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-labels-form-' . $sAction,
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction . '&parent=' . $this->_iParent,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_labels',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
                'checker_helper' => 'BxStudioFormsLabelsCheckerHelper'
            ),
            'inputs' => array (
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => isset($aLabel['id']) ? (int)$aLabel['id'] : 0,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'parent' => array(
                    'type' => 'select',
                    'name' => 'parent',
                    'caption' => _t('_adm_form_txt_labels_parent'),
                    'info' => '',
                    'value' => $this->_iParent,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'value' => array(
                    'type' => 'text',
                    'name' => 'value',
                    'caption' => _t('_adm_form_txt_labels_value'),
                    'info' => '',
                    'value' => isset($aLabel['value']) ? $aLabel['value'] : '',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'AvailUnique',
                        'params' => array(isset($aLabel['id']) ? (int)$aLabel['id'] : 0),
                        'error' => _t('_adm_form_err_labels_value'),
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_labels_submit'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_labels_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        if(empty($this->_iParent))
            $aForm['inputs']['parent']['values'][] = array('key' => 0, 'value' => _t('_adm_form_txt_labels_parent_empty'));
        else {
            if(!empty($this->_aParent['parent'])) {
                $aForm['inputs']['parent']['values'][] = array('key' => '', 'value' => _t('_adm_form_txt_labels_grandparent_label'), 'attrs' => array('disabled' => 'disabled'));

                $aGrandParent = $this->_oLabel->getLabels(array('type' => 'id', 'id' => $this->_aParent['parent']));
                $aForm['inputs']['parent']['values'][] = array('key' => $aGrandParent['id'], 'value' => $aGrandParent['value']);
            }
            else
                $aForm['inputs']['parent']['values'][] = array('key' => 0, 'value' => _t('_adm_form_txt_labels_parent_empty'));

            $aForm['inputs']['parent']['values'][] = array('key' => '', 'value' => _t('_adm_form_txt_labels_parent_label'), 'attrs' => array('disabled' => 'disabled'));
            $aForm['inputs']['parent']['values'][] = array('key' => $this->_aParent['id'], 'value' => $this->_aParent['value']);
        }

        $aSiblings = $this->_oLabel->getLabels(array('type' => 'parent', 'parent' => $this->_iParent, 'exclude' => array(!empty($aLabel['id']) ? (int)$aLabel['id'] : 0)));
        if(!empty($aSiblings) && is_array($aSiblings)) {
            $aForm['inputs']['parent']['values'][] = array('key' => '', 'value' => _t('_adm_form_txt_labels_sibling_labels'), 'attrs' => array('disabled' => 'disabled'));

            foreach($aSiblings as $aSiblings)
                $aForm['inputs']['parent']['values'][] = array(
                    'key' => $aSiblings['id'], 
                    'value' => $aSiblings['value']
                );
        }

        return new BxTemplStudioFormView($aForm);
    }
}

/** @} */
