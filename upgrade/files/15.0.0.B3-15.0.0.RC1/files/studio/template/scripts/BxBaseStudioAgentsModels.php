<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioAgentsModels extends BxDolStudioAgentsGrid
{
    protected $_sUrlPage;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_sUrlPage = BX_DOL_URL_STUDIO . 'agents.php?page=models';
    }

    public function getPageJsObject()
    {
        return 'oBxDolStudioPageAgents';
    }

    public function performActionDuplicate()
    {
        $iId = $this->_getId();
        $aModel = $this->_oDb->getModelsBy(['sample' => 'id', 'id' => $iId]);
        if (!empty($aModel)) {
            unset($aModel['id']);
            $aModel['title'] .= ' (Copy)';
            $aModel['duplicate'] = 1;
            $aModel['changed'] = time();
            $aModel['active'] = 0;
            $iNewId = $this->_oDb->insertModel($aModel);
            if ($iNewId) {
                $aRes = ['grid' => $this->getCode(false), 'blink' => $iNewId];
                return echoJson($aRes);
            }
        }
        $aRes = ['msg' => _t('_sys_txt_error_occured')];
        return echoJson($aRes);
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        $iId = $this->_getId();
        $aModel = $this->_oDb->getModelsBy(['sample' => 'id', 'id' => $iId]);

        $aForm = $this->_getFormEdit($sAction, $aModel);
        $oForm = new BxTemplFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = ['changed' => time()];
            
            if($oForm->update($iId, $aValsToAdd) !== false)
                $aRes = ['grid' => $this->getCode(false), 'blink' => $iId];
            else
                $aRes = ['msg' => _t('_sys_txt_error_occured')];

            return echoJson($aRes);
        } 

        $sFormId = $oForm->getId();
        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($sFormId . '_popup', _t('_sys_agents_models_popup_edit'), $this->_oTemplate->parseHtmlByName('agents_automator_form.html', [
            'form_id' => $sFormId,
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getFormEdit($sAction, $aModel = [])
    {
        $aForm = $this->_getForm($sAction, $aModel);
        $aForm['form_attrs']['action'] .= '&id=' . $aModel['id'];

        return $aForm;
    }

    protected function _getForm($sAction, $aModel = [])
    {
        $sJsObject = $this->getPageJsObject();

        $sParams = $aModel['params'];
        if (!empty($aModel['params_user']))
            $sParams = $aModel['params_user'];
        $s = json_decode($sParams, true);
        $sParams = json_encode($s, JSON_PRETTY_PRINT);

        $oParsedown = new Parsedown();
        $oParsedown->setSafeMode(false);
        $sDocs = $oParsedown->text($aModel['docs']);

        $aForm = array(
            'form_attrs' => array(
                'id' => 'bx_std_agents_models_' . $sAction,
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=sys_studio_agents_models&a=' . $sAction,
                'method' => 'post',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_agents_models',
                    'key' => 'id',
                    'submit_name' => 'do_submit',
                ),
            ),
            'inputs' => array(
                'docs' => [
                    'type' => 'custom',
                    'name' => 'docs',
                    'caption' => '',
                    'content' => $sDocs,
                ],
                'title' => [
                    'type' => 'text',
                    'name' => 'title',
                    'required' => '1',
                    'caption' => _t('_sys_agents_models_field_title'),
                    'info' => _t('_sys_agents_models_field_title_info'),
                    'value' => isset($aModel['title']) ? $aModel['title'] : '',
                    'required' => '1',
                    'checker' => [
                        'func' => 'Avail',
                        'params' => [],
                        'error' => _t('_sys_agents_form_field_err_enter'),
                    ],
                    'db' => [
                        'pass' => 'Xss',
                    ]
                ],
                'model' => [
                    'type' => 'text',
                    'name' => 'model',
                    'caption' => _t('_sys_agents_models_field_model'),
                    'info' => _t('_sys_agents_models_field_model_info'),
                    'value' => isset($aModel['model']) ? $aModel['model'] : '',
                    'db' => [
                        'pass' => 'Xss',
                    ]
                ],
                'key' => [
                    'type' => 'text',
                    'name' => 'key',
                    'caption' => _t('_sys_agents_models_field_key'),
                    'info' => _t('_sys_agents_models_field_key_info'),
                    'value' => isset($aModel['key']) ? $aModel['key'] : '',
                    'db' => [
                        'pass' => 'Xss',
                    ]
                ],
                'params_user' => [
                    'type' => 'textarea',
                    'name' => 'params_user',
                    'caption' => _t('_sys_agents_models_field_params'),
                    'info' => _t('_sys_agents_models_field_params_info'),
                    'value' => $sParams,
                    'checker' => [
                        'func' => 'Json',
                        'params' => ['allow_empty' => true],
                        'error' => _t('_sys_agents_json_field_err'),
                    ],
                    'db' => [
                        'pass' => 'All'
                    ]
                ],
                'submit' => $this->_getFormControls(),
            ),
        );

        return $aForm;
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if ($sType == 'single' && $aRow['duplicate'] == 0)
            return '';
        return parent::_getActionDefault ($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _delete ($mixedId)
    {
        $aModel = $this->_oDb->getModelsBy(['sample' => 'id', 'id' => $mixedId]);
        if (empty($aModel) || $aModel['duplicate'] == 0)
            return false;
        return parent::_delete($mixedId);
    }

    protected function _getCellDesign($sKey, $aField, $aRow)
    {
        if ($sKey == 'icon')
            $aField['display'] = 'Raw';
        return parent::_getCellDesign($sKey, $aField, $aRow);
    }
    
    protected function _getCellIcon($mixedValue, $sKey, $aField, $aRow)
    {
        
        if (strpos($mixedValue, '.svg') !== false)
            $mixedValue = $this->_oTemplate->getIconContent($mixedValue);

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
}

/** @} */
