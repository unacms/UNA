<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioPermissionsActions extends BxDolStudioPermissionsActions
{
    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['options']['attr']['title'] = _t('_adm_prm_btn_actions_options');
    }

    public function performActionEnable($mixedChecked = null)
    {
        $aIds = bx_get('ids');
        $bEnable = (int)bx_get('checked');

        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $aResultIds = array();
        foreach($aIds as $mixedId) {
            if(strpos($mixedId, $this->sParamsDivider) !== false)
                list($this->iLevel, $iId) = explode($this->sParamsDivider, urldecode($mixedId));

            if($this->oDb->switchAction($this->iLevel, $iId, $bEnable))
                $aResultIds[] = $iId;
        }

        $sAction = $bEnable ? 'enable' : 'disable';
        echo echoJson(array(
            $sAction => $aResultIds,
        ));
    }

    public function performActionOptions()
    {
        $sAction = 'options';

        if((int)$this->iLevel == 0)
            $this->iLevel = (int)bx_get('IDLevel');

        $aIds = bx_get('ids');
        if(empty($aIds) || !is_array($aIds)) {
            $iId = (int)bx_get('IDAction');
            if(!$iId)
                return echoJson([]);

            $aIds = [$iId];
        }

        $sId = array_shift($aIds);
        if(strpos($sId, $this->sParamsDivider) !== false)
            list($this->iLevel, $iId) = explode($this->sParamsDivider, urldecode($sId));
        else
            $iId = $sId;

        $aOption = [];
        $iOption = $this->oDb->getOptions(array('type' => 'by_level_action_ids', 'level_id' => $this->iLevel, 'action_id' => $iId), $aOption);
        if($iOption != 1 || empty($aOption))
            return echoJson([]);

        bx_import('BxTemplStudioFormView');

        $aActionParams = ['o' => $this->_sObject, 'a' => $sAction, 'level' => $this->iLevel];
        if(!empty($this->sModule))
            $aActionParams['module'] = $this->sModule;

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-prm-action-options',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams),
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_acl_matrix',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'IDLevel' => array(
                    'type' => 'hidden',
                    'name' => 'IDLevel',
                    'value' => $this->iLevel,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'IDAction' => array(
                    'type' => 'hidden',
                    'name' => 'IDAction',
                    'value' => $iId,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'AllowedCount' => array(
                    'type' => 'text',
                    'name' => 'AllowedCount',
                    'caption' => _t('_adm_prm_txt_actions_number'),
                    'info' => _t('_adm_prm_dsc_actions_number'),
                    'value' => $aOption['allowed_count'],
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'AllowedPeriodLen' => array(
                    'type' => 'text',
                    'name' => 'AllowedPeriodLen',
                    'caption' => _t('_adm_prm_txt_actions_reset'),
                    'info' => _t('_adm_prm_dsc_actions_reset'),
                    'value' => $aOption['allowed_period_len'],
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'AllowedPeriodStart' => array(
                    'type' => 'datetime',
                    'name' => 'AllowedPeriodStart',
                    'caption' => _t('_adm_prm_txt_actions_avail_start'),
                    'info' => _t('_adm_prm_dsc_actions_avail'),
                    'value' => $aOption['allowed_period_start'],
                    'attrs' => array(
                        'allow_input' => 'true',
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'AllowedPeriodEnd' => array(
                    'type' => 'datetime',
                    'name' => 'AllowedPeriodEnd',
                    'caption' => _t('_adm_prm_txt_actions_avail_end'),
                    'info' => _t('_adm_prm_dsc_actions_avail'),
                    'value' => $aOption['allowed_period_end'],
                    'attrs' => array(
                        'allow_input' => 'true',
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_prm_btn_actions_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_prm_btn_actions_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        if((int)$aOption['action_countable'] != 1)
            unset($aForm['inputs']['AllowedCount'], $aForm['inputs']['AllowedPeriodLen']);

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $aUpdate = [];
            foreach($aForm['inputs'] as $sName => $aInput) {
                if(in_array($aInput['type'], array('hidden', 'input_set')))
                    continue;

                $aUpdate[$sName] = $oForm->getCleanValue($sName);
                if(empty($aUpdate[$sName]))
                    $aUpdate[$sName] = null;
            }

            if($this->oDb->updateOptions((int)$oForm->getCleanValue('IDLevel'), (int)$oForm->getCleanValue('IDAction'), $aUpdate))
                $aRes = ['grid' => $this->getCode(false), 'blink' => $sId];
            else
                $aRes = ['msg' => _t('_adm_prm_err_action_edit')];

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-prm-action-options-popup', _t('_adm_prm_txt_actions_options_popup', _t($aOption['action_title'])), $this->_oTemplate->parseHtmlByName('prm_edit_option.html', [
                'form_id' => $aForm['form_attrs']['id'],
                'form' => $oForm->getCode(true),
                'object' => $this->_sObject,
                'action' => $sAction
            ]));

            echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
        }
    }

    function getJsObject()
    {
        return 'oBxDolStudioPermissionsActions';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('prm_actions.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'permissions_actions.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellSwitcher($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->iLevel == 0)
            return parent::_getCellDefault('', $sKey, $aField, $aRow);

        $aRow[$this->_aOptions['field_id']] = urlencode($this->iLevel . $this->sParamsDivider . $aRow[$this->_aOptions['field_id']]);
        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDesc($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = bx_process_output(_t($aRow['Desc']));
        $mixedValue = $this->_limitMaxLength($mixedValue, $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['Module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionOptions ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $a['attr']['bx_grid_action_data'] = urlencode($this->iLevel . $this->sParamsDivider . $a['attr']['bx_grid_action_data']);
        return  parent::_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sContent = "";

        $sJsObject = $this->getJsObject();
        $oForm = new BxTemplStudioFormView(array());

        $aInputLevels = array(
            'type' => 'select',
            'name' => 'level',
            'attrs' => array(
                'id' => 'bx-grid-level-' . $this->_sObject,
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeLevel()'
            ),
            'value' => 'id-' . $this->iLevel,
            'values' => array()
        );

        $aLevels = $aCounter = array();
        $this->oDb->getLevels(array('type' => 'all'), $aLevels, false);
        $this->oDb->getActions(array('type' => 'counter_by_levels'), $aCounter, false);
        foreach($aLevels as $aLevel)
            $aInputLevels['values']['id-' . $aLevel['id']] = _t($aLevel['name']) . " (" . (isset($aCounter[$aLevel['id']]) ? $aCounter[$aLevel['id']] : "0") . ")";

        asort($aInputLevels['values']);
        $aInputLevels['values'] = array_merge(array('id-0' => _t('_adm_prm_txt_select_level')), $aInputLevels['values']);

        $sContent .= $oForm->genRow($aInputLevels);
        if($this->iLevel == 0)
            return $sContent;

        $aInputModules = array(
            'type' => 'select',
            'name' => 'module',
            'attrs' => array(
                'id' => 'bx-grid-module-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_module'),
                'onChange' => 'javascript:$(this).off(\'keyup focusout\'); ' . $sJsObject . '.onChangeFilter()',
        		'onBlur' => 'javascript:' . $sJsObject . '.onChangeFilter()',
            ),
            'value' => '',
            'values' => $this->getModules(false)
        );

        $aInputModules['values'] = array_merge(array('' => _t('_adm_prm_txt_all_modules')), $aInputModules['values']);

        $aCounter = array();
        $this->oDb->getActions(array('type' => 'counter_by_modules'), $aCounter, false);
        foreach($aInputModules['values'] as $sKey => $sValue)
            if(isset($aCounter[$sKey]))
                $aInputModules['values'][$sKey] = $aInputModules['values'][$sKey] . " (" . $aCounter[$sKey] . ")";

        $sContent .= $oForm->genRow($aInputModules);

        $aInputSearch = array(
            'type' => 'text',
            'name' => 'keyword',
            'attrs' => array(
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_search'),
                'onKeyup' => 'javascript:$(this).off(\'keyup\'); ' . $this->getJsObject() . '.onChangeFilter()'
            )
        );
        $sContent .= $oForm->genRow($aInputSearch);

        return  $sContent;
    }
}

/** @} */
