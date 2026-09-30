<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioFormsPreValues extends BxDolStudioFormsPreValues
{
    protected $sUrlPage;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_form_btn_pre_values_edit_item');
        $this->_aOptions['actions_single']['delete']['attr']['title'] = _t('_adm_form_btn_pre_values_delete_item');

        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_forms.php?page=pre_values';
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        if(!$this->canAdd()) {
            echoJson([]);
            exit;
        }

        $bUseInSets = (int)$this->aList['use_for_sets'] == 1;

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-pre-value-create',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction . '&list=' . $this->sList,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_form_pre_values',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'Key' => array(
                    'type' => 'hidden',
                    'name' => 'Key',
                    'value' => $this->sList,
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'Value' => array(
                    'type' => 'hidden',
                    'name' => 'Value',
                    'value' => $this->_getAvailableSetValue($this->sList),
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'LKey' => array(
                    'type' => 'text_translatable',
                    'name' => 'LKey',
                    'caption' => _t('_adm_form_txt_pre_values_lkey'),
                    'info' => _t('_adm_form_dsc_pre_values_lkey'),
                    'value' => '_adm_form_txt_pre_value',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(1,100, 'LKey'),
                        'error' => _t('_adm_form_err_pre_values_lkey'),
                    ),
                ),
                'icon_type' => [
                    'type' => 'select',
                    'name' => 'icon_type',
                    'caption' => _t('_adm_form_txt_pre_values_icon_type'),
                    'info' => '',
                    'values' => [
                        ['key' => '', 'value' => _t('_sys_please_select')],
                        ['key' => 'icon', 'value' => _t('_adm_form_txt_pre_values_icon_type_icon')],
                        ['key' => 'emoji', 'value' => _t('_adm_form_txt_pre_values_icon_type_emoji')],
                        ['key' => 'image', 'value' => _t('_adm_form_txt_pre_values_icon_type_image')]
                    ],
                    'value' => '',
                    'required' => '0',
                    'attrs' => [
                        'onchange' => 'javascript:' . $this->getJsObject() . '.onChangeIconType(this)'
                    ]
                ],
                'icon_icon' => [
                    'type' => 'text',
                    'name' => 'icon_icon',
                    'caption' => _t('_adm_form_txt_pre_values_icon'),
                    'info' => _t('_adm_form_dsc_pre_values_icon'),
                    'value' => '',
                    'required' => '0',
                    'code' => 1,
                    'tr_attrs' => ['class' => 'bx-pre-values-icon bx-pvi-icon', 'style' => 'display:none']
                ],
                'icon_emoji' => [
                    'type' => 'textarea',
                    'name' => 'icon_emoji',
                    'caption' => _t('_adm_form_txt_pre_values_icon'),
                    'info' => _t('_adm_form_dsc_pre_values_icon'),
                    'value' => '',
                    'required' => '0',
                    'code' => 1,
                    'tr_attrs' => ['class' => 'bx-pre-values-icon bx-pvi-emoji', 'style' => 'display:none']
                ],
                'icon_image' => [
                    'type' => 'textarea',
                    'name' => 'icon_image',
                    'caption' => _t('_adm_form_txt_pre_values_icon'),
                    'info' => _t('_adm_form_dsc_pre_values_icon'),
                    'value' => '',
                    'required' => '0',
                    'code' => 1,
                    'tr_attrs' => ['class' => 'bx-pre-values-icon bx-pvi-image', 'style' => 'display:none']
                ],
                'Empty' => array(
                    'type' => 'checkbox',
                    'name' => 'Empty',
                    'caption' => _t('_adm_form_txt_pre_values_empty'),
                    'info' => _t('_adm_form_dsc_pre_values_empty'),
                    'value' => 'on',
                    'required' => '0'
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_pre_values_add'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_pre_values_cancel'),
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
            $aAdd = ['LKey2' => '', 'Order' => $this->oDb->getValuesOrderMax($this->sList) + 1];

            if(($sIconType = $oForm->getCleanValue('icon_type'))) {
                $aData['use'] = $sIconType;
                foreach($this->aIconTypes as $sType)
                    if(($sIcon = $oForm->getCleanValue('icon_' . $sType)) !== false)
                        $aData[$sType] = $sIcon;

                $aAdd['Data'] = serialize($aData);
            }

            if($oForm->getCleanValue('Empty') == 'on')
                BxDolForm::setSubmittedValue('Value', '', $oForm->aFormAttrs['method']);

            if($bUseInSets) {
                $mixedValue = $oForm->getCleanValue('Value');
                if(!$this->canUseForSet($mixedValue)) {
                    if($this->oDb->isListUsedInSet($this->sList)) {
                        echoJson(array('msg' => _t('_adm_form_err_pre_values_create_forbidden', BX_DOL_STUDIO_FIELD_PRE_VALUE_INT_MAX)));
                        return;
                    }

                    $this->oDb->updateList($this->aList['id'], array('use_for_sets' => '0'));
                }
            }

            $iId = (int)$oForm->insert($aAdd);
            if($iId != 0) {
                $this->onDataListChanged($oForm->getCleanValue('Key'));
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            } else {
                $aRes = array('msg' => _t('_adm_form_err_pre_values_create'));
            }
            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-pre-value-create-popup', _t('_adm_form_txt_pre_values_create_popup'), $this->_oTemplate->parseHtmlByName('form_add_value.html', array(
                'form_id' => $aForm['form_attrs']['id'],
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

        $aValue = $this->_getItem('getValues');
        if($aValue === false) {
            echoJson([]);
            exit;
        }

        $bUseInSets = (int)$this->aList['use_for_sets'] == 1;

        $aData = !empty($aValue['Data']) && bx_is_serialized($aValue['Data']) ? unserialize($aValue['Data']) : [];

        $sIconType = !empty($aData['use']) ? $aData['use'] : '';

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-list-edit',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction . '&list=' . $this->sList,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_form_pre_values',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array(
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $aValue['id'],
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'LKey' => array(
                    'type' => 'text_translatable',
                    'name' => 'LKey',
                    'caption' => _t('_adm_form_txt_pre_values_lkey'),
                    'info' => _t('_adm_form_dsc_pre_values_lkey'),
                    'value' => $aValue['lkey'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3,100, 'LKey'),
                        'error' => _t('_adm_form_err_pre_values_lkey'),
                    ),
                ),
                'icon_type' => [
                    'type' => 'select',
                    'name' => 'icon_type',
                    'caption' => _t('_adm_form_txt_pre_values_icon_type'),
                    'info' => '',
                    'values' => [
                        ['key' => '', 'value' => _t('_sys_please_select')],
                        ['key' => 'icon', 'value' => _t('_adm_form_txt_pre_values_icon_type_icon')],
                        ['key' => 'emoji', 'value' => _t('_adm_form_txt_pre_values_icon_type_emoji')],
                        ['key' => 'image', 'value' => _t('_adm_form_txt_pre_values_icon_type_image')]
                    ],
                    'value' => $sIconType,
                    'required' => '0',
                    'attrs' => [
                        'onchange' => 'javascript:' . $this->getJsObject() . '.onChangeIconType(this)'
                    ]
                ],
                'icon_icon' => [
                    'type' => 'text',
                    'name' => 'icon_icon',
                    'caption' => _t('_adm_form_txt_pre_values_icon'),
                    'info' => _t('_adm_form_dsc_pre_values_icon'),
                    'value' => !empty($aData['icon']) ? $aData['icon'] : '',
                    'required' => '0',
                    'code' => 1,
                    'tr_attrs' => ['class' => 'bx-pre-values-icon bx-pvi-icon', 'style' => $sIconType != 'icon' ? 'display:none' : '']
                ],
                'icon_emoji' => [
                    'type' => 'textarea',
                    'name' => 'icon_emoji',
                    'caption' => _t('_adm_form_txt_pre_values_icon'),
                    'info' => _t('_adm_form_dsc_pre_values_icon'),
                    'value' => !empty($aData['emoji']) ? $aData['emoji'] : '',
                    'required' => '0',
                    'code' => 1,
                    'tr_attrs' => ['class' => 'bx-pre-values-icon bx-pvi-emoji', 'style' => $sIconType != 'emoji' ? 'display:none' : '']
                ],
                'icon_image' => [
                    'type' => 'textarea',
                    'name' => 'icon_image',
                    'caption' => _t('_adm_form_txt_pre_values_icon'),
                    'info' => _t('_adm_form_dsc_pre_values_icon'),
                    'value' => !empty($aData['image']) ? $aData['image'] : '',
                    'required' => '0',
                    'code' => 1,
                    'tr_attrs' => ['class' => 'bx-pre-values-icon bx-pvi-image', 'style' => $sIconType != 'image' ? 'display:none' : '']
                ],
                'Empty' => array(
                    'type' => 'checkbox',
                    'name' => 'Empty',
                    'caption' => _t('_adm_form_txt_pre_values_empty'),
                    'info' => _t('_adm_form_dsc_pre_values_empty'),
                    'value' => 'on',
                    'checked' => empty($aValue['value']) ? '1' : '0',
                    'required' => '0'
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_pre_lists_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_pre_lists_cancel'),
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
            $aAdd = [];

            if(($sIconType = $oForm->getCleanValue('icon_type'))) {
                $aData['use'] = $sIconType;
                foreach($this->aIconTypes as $sType)
                    if(($sIcon = $oForm->getCleanValue('icon_' . $sType)) !== false)
                        $aData[$sType] = $sIcon;

                $aAdd['Data'] = serialize($aData);
            }

            $bEmpty = $oForm->getCleanValue('Empty') == 'on';
            if($bEmpty)
                $aAdd['Value'] = empty($aValue['value']) ? $aValue['value'] : 0;
            else
                $aAdd['Value'] = !empty($aValue['value']) ? $aValue['value'] : $this->_getAvailableSetValue($this->sList);

            if(!empty($aAdd) && $bUseInSets) {
                $mixedValue = $aAdd['Value'];
                if(!$this->canUseForSet($mixedValue)) {
                    if($this->oDb->isListUsedInSet($this->sList)) {
                        echoJson(array('msg' => _t('_adm_form_err_pre_values_create_forbidden', BX_DOL_STUDIO_FIELD_PRE_VALUE_INT_MAX)));
                        return;
                    }

                    $this->oDb->updateList($this->aList['id'], array('use_for_sets' => '0'));
                }
            }

            if($oForm->update($aValue['id'], $aAdd) !== false) {
                $this->onDataListChanged($this->sList);
                $aRes = array('grid' => $this->getCode(false), 'blink' => $aValue['id']);
            } else {
                $aRes = array('msg' => _t('_adm_form_err_pre_values_edit'));
            }
            echoJson($aRes);
        } 
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-pre-value-edit-popup', _t('_adm_form_txt_pre_values_edit_popup', _t($aValue['lkey'])), $this->_oTemplate->parseHtmlByName('form_add_value.html', array(
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    public function performActionReorder()
    {        
        $mixed = parent::performActionReorder();
        $this->onDataListChanged($this->sList);
        return $mixed;
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

        $oLanguage = BxDolStudioLanguagesUtils::getInstance();

        $aIdsAffected = array ();
        foreach($aIds as $iId) {
            $aValue = array();
            $this->oDb->getValues(array('type' => 'by_id', 'value' => (int)$iId), $aValue);
            if(!is_array($aValue) || empty($aValue))
                continue;

            if((int)$this->_delete($iId) <= 0)
                continue;

            $this->onDataListChanged($this->sList);

            $oLanguage->deleteLanguageString($aValue['lkey']);
            $oLanguage->deleteLanguageString($aValue['lkey2']);

            if((int)$this->aList['use_for_sets'] != 1) {
                $bUseInSets = 1;
                $aValues = BxDolForm::getDataItems($this->sList);
                foreach($aValues as $mixedValue => $sTitle)
                    if(!$this->canUseForSet($mixedValue)) {
                        $bUseInSets = 0;
                        break;
                    }

                if($bUseInSets == 1)
                    $this->oDb->updateList($this->aList['id'], array('use_for_sets' => $bUseInSets));
            }

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t('_adm_form_err_pre_values_delete')));
    }

    function getJsObject()
    {
        return 'oBxDolStudioFormsValues';
    }

    function getListsSelector($sModule = '')
    {
        $oForm = new BxTemplStudioFormView(array());

        $aInputLists = array(
            'type' => 'select',
            'name' => 'list',
            'attrs' => array(
                'id' => 'bx-grid-list-' . $this->_sObject,
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeList()'
            ),
            'value' => $this->sList,
            'values' => array()
        );

        $aLists = array();
        if(!empty($sModule))
            $this->oDb->getLists(array('type' => 'by_module', 'value' => $sModule), $aLists, false);
        else
            $aInputLists['attrs']['disabled'] = 'disabled';

        if(!empty($aLists)) {
            $aCounter = array();
            $this->oDb->getValues(array('type' => 'counter_by_lists'), $aCounter, false);
            foreach($aLists as $aList)
                $aInputLists['values'][$aList['key']] = _t($aList['title']) . " (" . (isset($aCounter[$aList['key']]) ? $aCounter[$aList['key']] : "0") . ")";

            asort($aInputLists['values']);
        }

        $aInputLists['values'] = array_merge(array('' => _t('_adm_form_txt_select_list')), $aInputLists['values']);

        return $oForm->genRow($aInputLists);
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_values.html', array(
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
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_values.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getActionAdd($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(!$this->canAdd())
            $isDisabled = true;

        return parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sContent = $this->getModulesSelectOne('getValues') . $this->getListsSelector($this->sModule);

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

    protected function _getAvailableSetValue($sList)
    {
        $aValues = array();
        $this->oDb->getValues(array('type' =>'by_key_key_value', 'value' => $sList), $aValues, false);
        ksort($aValues);

        $iValue = 1;
        foreach($aValues as $aValue) {
            if((int)$aValue['value'] == 0)
                continue;

            if((int)$aValue['value'] != $iValue)
                break;

            $iValue++;
        }

        return $iValue;
    }

    protected function canAdd()
    {
        return $this->sList != '' && (int)$this->aList['extendable'] != 0;
    }

    protected function canUseForSet($mixedValue)
    {
        return is_numeric($mixedValue) && (int)$mixedValue >= 1 && (int)$mixedValue <= BX_DOL_STUDIO_FIELD_PRE_VALUE_INT_MAX;
    }

    protected function onDataListChanged($sKey)
    {
        $this->oDb->cleanCache('sys_form_pre_values_with_key_' . $sKey);
        $this->oDb->cleanCache('sys_form_pre_values_' . $sKey);
    }
}

/** @} */
