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

define('BX_DOL_STUDIO_FIELD_PRE_VALUE_INT_MAX', round(log(BX_DOL_INT_MAX, 2)));

define('BX_DOL_MOD_GROUPS_ROLE_COMMON', 0);
define('BX_DOL_MOD_GROUPS_ROLE_ADMINISTRATOR', 1);
define('BX_DOL_MOD_GROUPS_ROLE_MODERATOR', 2);

class BxBaseStudioFormsGroupsRoles extends BxDolStudioFormsGroupsRoles
{
    protected $sUrlPage;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_forms.php?page=groups_roles';
    }
    
    public function performActionAdd()
    {
        $sAction = 'add';
        
        if(!$this->canAdd()) {
            echoJson(array());
            exit;
        }

        $oForm = $this->_getPermissionsForm($sAction);

        if (!$oForm)
            return '';
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?' . bx_encode_url_params($_GET, array('ids', '_r'));
        $oForm->initChecker();
        if ($oForm->isSubmitted())
            $this->initDataSwitchers($oForm->aInputs);

        if($oForm->isSubmittedAndValid()) {
            $iNewValue = $this->_getAvailableSetValue($this->sRolesDataList);

            if(!$this->canUseForSet($iNewValue)) {
                echoJson(array('msg' => _t('_adm_form_err_pre_values_create_forbidden', BX_DOL_STUDIO_FIELD_PRE_VALUE_INT_MAX)));
                return;
            }

            $aData = $oForm->getCleanValue('Data');
            $aAllActions = $this->_getDefaultActionsArray(0);
            foreach ($aAllActions as $sModule => $aActions)
                if (!isset($aData[$sModule])) $aData[$sModule] = [];

            $mixedResult = $oForm->insert([
                'LKey2' => '',
                'Value' => $iNewValue,
                'Order' => $this->oDb->getValuesOrderMax($this->sRolesDataList) + 1,
                'Key' => $this->sRolesDataList,
                'Data' => serialize($aData),
            ]);
            if(is_numeric($mixedResult))
                $aRes = array('grid' => $this->getCode(false), 'blink' => $mixedResult);
            else
                $aRes = array('msg' => $mixedResult);
            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-groups-roles-add-popup', _t('_adm_form_txt_groups_roles_add_popup'), $this->_oTemplate->parseHtmlByName('form_add_groups_role.html', array(
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

        $aItem = array();
        $this->oDb->getValues(array('type' => 'by_id', 'value' => $iId), $aItem, false);
        if(!is_array($aItem) || empty($aItem)) {
            echoJson([]);
            exit;
        }

        $oForm = $this->_getPermissionsForm($sAction, $aItem);
        $oForm->initChecker();
        if ($oForm->isSubmitted())
            $this->initDataSwitchers($oForm->aInputs);

        if($oForm->isSubmittedAndValid()) {
            $aData = $oForm->getCleanValue('Data');
            $aAllActions = $this->_getDefaultActionsArray($aItem['Value']);
            foreach ($aAllActions as $sModule => $aActions)
                if (!isset($aData[$sModule])) $aData[$sModule] = [];

            $mixedResult = $oForm->update($iId, ['Data' => serialize($aData)]);
            if(is_numeric($mixedResult))  {
                $this->onRoleChanged($aItem);

                $aRes = array('grid' => $this->getCode(false), 'blink' => $mixedResult);
            }
            else
                $aRes = array('msg' => $mixedResult);
            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-groups-roles-edit-popup', _t('_adm_form_txt_groups_roles_edit_popup', _t($aItem['LKey'])), $this->_oTemplate->parseHtmlByName('form_add_groups_role.html', array(
               'form_id' => $oForm->aFormAttrs['id'],
               'form' => $oForm->getCode(true),
               'object' => $this->_sObject,
               'action' => $sAction
           )));

           echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
    }

    public function performActionDelete()
    {
        $this->_replaceMarkers ();

        $iAffected = 0;
        $aIds = bx_get('ids');
        if (!$aIds || !is_array($aIds)) {
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

            $oLanguage->deleteLanguageString($aValue['lkey']);
            $oLanguage->deleteLanguageString($aValue['lkey2']);

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echo echoJson(array_merge(
            array(
                'grid' => $this->getCode(false),
            ),
            $iAffected ? array() : array('msg' => _t("_sys_grid_delete_failed"))
        ));
    }

    protected function _getPermissionsForm($sFormAction, $aRole = [])
    {
        if (!empty($aRole['Data']) && !is_array($aRole['Data'])) $aRole['Data'] = unserialize($aRole['Data']);

        $aInputs = [];
        $aInputs['id'] = [
            'type' => 'hidden',
            'name' => 'id',
            'value' => isset($aRole['id']) ? (int)$aRole['id'] : 0,
            'db' => [
                'pass' => 'Int',
            ],
        ];
        $aInputs['LKey'] = [
            'type' => 'text_translatable',
            'name' => 'LKey',
            'caption' => _t('_adm_form_txt_groups_role_value'),
            'info' => '',
            'value' => isset($aRole['LKey']) ? $aRole['LKey'] : '',
            'required' => '1',
            'db' => [
                'pass' => 'Xss',
            ],
            'checker' => [
                'func' => 'LengthTranslatable',
                'params' => [1,100, 'LKey'],
                'error' => _t('_adm_form_txt_groups_role_value_err'),
            ],
        ];

        $aAllActions = $this->_getDefaultActionsArray(isset($aRole['Value']) ? (int)$aRole['Value'] : 0);
        foreach ($aAllActions as $sModule => $aActionsList) {
            $oModule = BxDolModule::getInstance($sModule);

            $aInputs[$sModule.'_begin'] = [
                'type' => 'block_header',
                'caption' => BxDolModule::getTitle($oModule->_aModule['uri']),
                'collapsed' => true,
            ];

            foreach ($aActionsList as $sAction => $bAllowedByDefault) {
                $bChecked = false;
                // if pemission is not set explicitly then consider the default value
                if ((empty($aRole) || !is_array($aRole['Data']) || !isset($aRole['Data'][$sModule])) && $bAllowedByDefault) $bChecked = true;

                // if pemission is set explicitly then use the value set
                if (!empty($aRole) && is_array($aRole['Data']) && isset($aRole['Data'][$sModule]) && isset($aRole['Data'][$sModule][$sAction]) && $aRole['Data'][$sModule][$sAction]) $bChecked = true;

                $aInputs[$sModule.'|'.$sAction] = [
                    'type' => 'switcher',
                    'name' => "Data[{$sModule}][{$sAction}]",
                    'caption' => _t('_adm_form_txt_groups_role_'.$sAction),
                    'value' => 1,
                    'checked' => $bChecked,
                ];
            }
        }

        $aInputs['end'] = [
            'type' => 'block_end',
        ];

        $aInputs['controls'] = [
            'name' => 'controls',
            'type' => 'input_set',
            [
                'type' => 'submit',
                'name' => 'do_submit',
                'value' => _t('_adm_form_btn_labels_submit'),
            ],
            [
                'type' => 'reset',
                'name' => 'close',
                'value' => _t('_adm_form_btn_labels_cancel'),
                'attrs' => [
                    'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                    'class' => 'bx-def-margin-sec-left',
                ],
            ]
        ];

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-groups-role-edit',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&module=' . $this->sModule . '&a=' . $sFormAction,
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
            'inputs' => $aInputs
        );
        return new BxTemplStudioFormView($aForm);
    }

    protected function _getCellActionsList($mixedValue, $sKey, $aField, $aRow)
    {
        $mPermissions = $aRow['Data'] ? unserialize($aRow['Data']) : false;
        $aDefaultActionsByModules = $this->_getDefaultActionsArray($aRow['Value']);

        $iAllowedPermissions = 0;
        foreach ($aDefaultActionsByModules as $sModule => $aDefaultActions) {
            foreach ($aDefaultActions as $sAction => $bAllowedByDefault) {
                // if pemission is not set explicitly then consider the default value
                if ((!is_array($mPermissions) || !isset($mPermissions[$sModule])) && $bAllowedByDefault) $iAllowedPermissions++;

                // if pemission is set explicitly then use the value set
                if (is_array($mPermissions) && isset($mPermissions[$sModule]) && isset($mPermissions[$sModule][$sAction]) && $mPermissions[$sModule][$sAction]) $iAllowedPermissions++;
            }
        }

        $sLink = 'javascript: glGrids.'.$this->_sObject.'.action(\'edit\', {id: '.$aRow['id'].'});';
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_prm_txt_n_actions', $iAllowedPermissions), array(
            'title' => _t('_adm_prm_txt_manage_actions')
        ));

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_groups_roles.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }
    
    protected function canAdd()
    {
        return $this->sModule != '';
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
        return $this->getModulesSelectOne('', false, false);
    }

    public function getModulesSelectOneArray($sGetItemsMethod, $bShowCustom = true, $bShowSystem = true)
    {
        $aModules = $this->getModules($bShowCustom, $bShowSystem);
        foreach ($aModules as $sModuleUri => $sModuleName) {
            $oModule = BxDolModule::getInstance($sModuleUri);
            if ($oModule) {
                $sRolesDataList = isset($oModule->_oConfig->CNF['OBJECT_PRE_LIST_ROLES']) ? $oModule->_oConfig->CNF['OBJECT_PRE_LIST_ROLES'] : '';
                if ($sRolesDataList) {
                    $aRoles = BxBaseFormView::getDataItems($sRolesDataList);
                    $aModules[$sModuleUri] = $sModuleName . ' (' . ($aRoles ? count($aRoles) : 0) . ')';
                    continue;
                }
            }
            unset($aModules[$sModuleUri]);
        }

        $aInputModules = array(
            'type' => 'select',
            'name' => 'module',
            'attrs' => array(
                'id' => 'bx-grid-module-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_module'),
                'onChange' => 'javascript:' . $this->getJsObject() . '.onChangeModule()'
            ),
            'value' => $this->sModule,
            'values' => $aModules
        );

        return $aInputModules;
    }

    protected function _getDefaultActionsArray($iRole) {
        $bAdminOrModerator = $iRole == BX_DOL_MOD_GROUPS_ROLE_ADMINISTRATOR || $iRole == BX_DOL_MOD_GROUPS_ROLE_MODERATOR;

        $aDefaultActions = [
            $this->sModule => [
                'invite' => $bAdminOrModerator,
                'manage_fans' => $bAdminOrModerator,
                'manage_roles' => $iRole == BX_DOL_MOD_GROUPS_ROLE_ADMINISTRATOR,
                'edit' => $iRole == BX_DOL_MOD_GROUPS_ROLE_ADMINISTRATOR,
                'change_cover' => $iRole == BX_DOL_MOD_GROUPS_ROLE_ADMINISTRATOR,
            ]
        ];

        // if timeline is installed then handle it as a special case
        $oTimeline = BxDolModule::getInstance('bx_timeline');
        if ($oTimeline) {
            $aDefaultActions['bx_timeline'] = [
                'post' => 1,
                'edit_any' => $bAdminOrModerator,
                'delete_any' => $bAdminOrModerator,
                'pin' => $bAdminOrModerator,
            ];
        }

        $aModules = $this->getModules(false, false);
        foreach ($aModules as $sModuleUri => $sModuleName) {
            $oModule = BxDolModule::getInstance($sModuleUri);
            if ($oModule) {
                if ((bx_srv('system', 'is_module_content', [$sModuleUri]) || bx_srv('system', 'is_module_context', [$sModuleUri])) && (!BxDolRequest::serviceExists($sModuleUri, 'act_as_profile') || !bx_srv($sModuleUri, 'act_as_profile'))) {
                    $aActions = [
                        'post' => 1,
                        'edit_any' => $bAdminOrModerator,
                        'delete_any' => $bAdminOrModerator,
                    ];

                    if (isset($aDefaultActions[$sModuleUri])) {
                        $aDefaultActions[$sModuleUri] = array_merge($aDefaultActions[$sModuleUri], $aActions);
                    } else {
                        $aDefaultActions[$sModuleUri] = $aActions;
                    }

                }
            }
        }

        return $aDefaultActions;
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

    protected function canUseForSet($mixedValue)
    {
        return is_numeric($mixedValue) && (int)$mixedValue >= 1 && (int)$mixedValue <= BX_DOL_STUDIO_FIELD_PRE_VALUE_INT_MAX;
    }
    
    function getJsObject()
    {
        return 'oBxDolStudioFormsGroupsRoles';
    }

    function initDataSwitchers(&$aInputs) {
        foreach ($aInputs as $sName => $aInput) {
            if ($aInput['type'] != 'switcher') continue;
            list ($sModule, $sAction) = explode('|', $sName);
            $aInputs[$sName]['checked'] = isset($_POST['Data']) && isset($_POST['Data'][$sModule]) && isset($_POST['Data'][$sModule][$sAction]);
        }
    }
    
    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_groups_roles.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function onRoleChanged($aRole)
    {
        if(!empty($aRole) && isset($aRole['key']) && ($sKey = $aRole['key'])) {
            $this->oDb->cleanCache('sys_form_pre_values_with_key_' . $sKey);
            $this->oDb->cleanCache('sys_form_pre_values_' . $sKey);
        }
    }
}

/** @} */
