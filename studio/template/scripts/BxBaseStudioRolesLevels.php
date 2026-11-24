<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioRolesLevels extends BxDolStudioRolesLevels
{
    public static $iBinMB = 1048576;

    protected $sUrlPage;

    public function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_roles.php?page=rlevels';
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        $oForm = $this->_getFormObject($sAction);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if(($iId = $this->_getAvailableId()) === false)
                return echoJson(array('msg' => _t('_adm_prm_err_role_id')));

            $sLanguage = BxDolStudioLanguagesUtils::getInstance()->getCurrentLangName(false);

            $sName = BxDolForm::getSubmittedValue('title-' . $sLanguage, $oForm->aFormAttrs['method']);
            $sName = uriGenerate(strtolower($sName), 'sys_std_roles', 'name', ['empty' => 'role']);

            $iId = (int)$oForm->insert(array('id' => $iId, 'name' => $sName, 'active' => 1, 'order' => $this->oDb->getRoleOrderMax() + 1));
            if($iId != 0) {
                $aRole = $this->oDb->getRoles(array('type' => 'by_id', 'id' => (int)$iId));

            	if(($iActionsFrom = (int)$oForm->getCleanValue('actions')) > 0) {
                    $aActions = $this->oDb->getActions(array('type' => 'by_role_id', 'role_id' => $iActionsFrom));
                    foreach($aActions as $aAction)
                        $this->oDb->switchAction($iId, $aAction['id'], true);
            	}

                // create system event
                bx_alert('roles', 'added', $iId, 0, array('role' => $aRole));

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            }
            else
                $aRes = array('msg' => _t('_adm_rl_err_role_create'));

            return echoJson($aRes);
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-rl-role-add-popup', _t('_adm_rl_txt_role_create_popup'), $this->_oTemplate->parseHtmlByName('rl_role.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
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

        $aRole = $this->oDb->getRoles(array('type' => 'by_id', 'id' => $iId));
        if(empty($aRole) || !is_array($aRole))
            return echoJson(array());

        $oForm = $this->_getFormObject($sAction, $aRole);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if($oForm->update($iId) !== false) {
                $aRole = $this->oDb->getRoles(array('type' => 'by_id', 'id' => (int)$iId));

                // create system event
                bx_alert('roles', 'edited', $iId, 0, array('role' => $aRole));

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            }
            else
                $aRes = array('msg' => _t('_adm_rl_err_role_edit'));

            return echoJson($aRes);
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-rl-role-edit-popup', _t('_adm_rl_txt_role_edit_popup', _t($aRole['title'])), $this->_oTemplate->parseHtmlByName('rl_role.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
    }

    public function getJsObject()
    {
        return 'oBxDolStudioRolesLevels';
    }

    public function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('rl_roles_levels.html', array(
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
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'roles_levels.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        if(in_array($aRow['id'], array(BX_DOL_STUDIO_ROLE_MASTER)))
            return parent::_getCellDefault('', $sKey, $aField, $aRow);

        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellActionsList ($mixedValue, $sKey, $aField, $aRow)
    {
        $aActions = $this->oDb->getActions(array('type' => 'by_role_id', 'role_id' => $aRow['id']));

        $sLink = BX_DOL_URL_STUDIO . 'builder_roles.php?page=ractions&role=' . $aRow['id'];
        $mixedValue = $this->_getCellCount(count($aActions), $sLink, _t('_adm_rl_txt_n_actions', count($aActions)), _t('_adm_rl_txt_manage_actions'));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(in_array($aRow['id'], array($this->aNonDeletable)))
            return '';

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getFormObject($sAction, $aRole = array())
    {
    	bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-rl-role-',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT,
                'enctype' => 'multipart/form-data',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_std_roles',
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
                    'value' => isset($aRole['id']) ? (int)$aRole['id'] : 0,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_rl_txt_role_title'),
                    'value' => isset($aRole['title']) ? $aRole['title'] : '_adm_rl_txt_role',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3, 100, 'title'),
                        'error' => _t('_adm_rl_err_role_title'),
                    ),
                ),
                'description' => array(
                    'type' => 'textarea_translatable',
                    'name' => 'description',
                    'caption' => _t('_adm_rl_txt_role_description'),
                    'value' => isset($aRole['description']) ? $aRole['description'] : '_adm_rl_txt_role',
                    'code' => 1,
                    'db' => array (
                        'pass' => 'XssHtml',
                    )
                ),
                'actions' => array(
                    'type' => 'select',
                    'name' => 'actions',
                    'caption' => _t('_adm_rl_txt_role_actions_copy'),
                    'values' => array(
                        array('key' => 0, 'value' => _t('_sys_txt_empty'))
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_rl_btn_role_create'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_rl_btn_role_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        $aRoles = $this->oDb->getRoles(array('type' => 'all_pair'));
        foreach($aRoles as $iId => $sTitle)
            $aForm['inputs']['actions']['values'][] = array('key' => $iId, 'value' => _t($sTitle));

        switch($sAction) {
            case 'add':
                unset($aForm['inputs']['id']);

                $aForm['form_attrs']['id'] .= 'create';
                break;

            case 'edit':
                unset($aForm['inputs']['actions']);

                $aForm['form_attrs']['id'] .= 'edit';
                $aForm['inputs']['controls'][0]['value'] = _t('_adm_rl_btn_role_save');
                break;
        }

        return new BxTemplStudioFormView($aForm);
    }

    protected function _getAvailableId()
    {
        $aRoles = $this->oDb->getRoles(array('type' =>'all_order_id'));

        $iId = 1;
        foreach($aRoles as $aRole) {
            if($iId != (int)$aRole['id'])
                break;

            $iId++;
        }

        return $iId <= BX_DOL_STUDIO_ROLES_ROLE_ID_INT_MAX ? $iId : false;
    }
}

/** @} */
