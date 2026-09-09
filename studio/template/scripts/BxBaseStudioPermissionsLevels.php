<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioPermissionsLevels extends BxDolStudioPermissionsLevels
{
    public static $iBinMB = 1048576;

    protected $sUrlPage;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_prm_btn_level_edit');
        $this->_aOptions['actions_single']['delete']['attr']['title'] = _t('_adm_prm_btn_level_delete');

        $this->sUrlPage = BX_DOL_URL_STUDIO . 'builder_permissions.php?page=levels';
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        $oForm = $this->_getFormObject($sAction);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if(($iId = $this->_getAvailableId()) === false) {
                echoJson(array('msg' => _t('_adm_prm_err_level_id')));
                return;
            }

            if(($aUnavailableTo = $oForm->getCleanValue('UnavailableTo')) && is_array($aUnavailableTo))
            BxDolForm::setSubmittedValue('UnavailableTo', implode(',', $aUnavailableTo), $oForm->aFormAttrs['method']);

            $mixedIcon = '';
            if(!empty($_FILES['Icon_image']['tmp_name'])) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);

                $mixedIcon = $oStorage->storeFileFromForm($_FILES['Icon_image'], false, 0);
                if($mixedIcon === false) {
                    echoJson(array('msg' => _t('_adm_prm_err_level_icon_image') . $oStorage->getErrorString()));
                    return;
                }

                $oStorage->afterUploadCleanup($mixedIcon, 0);
            }

            if(empty($mixedIcon))
                $mixedIcon = $oForm->getCleanValue('Icon');

            if(empty($mixedIcon))
                $mixedIcon = 'acl-unconfirmed.png';

            BxDolForm::setSubmittedValue('Icon', $mixedIcon, $oForm->aFormAttrs['method']);

            $fQuotaSize = round($oForm->getCleanValue('QuotaSize'), 1);
            BxDolForm::setSubmittedValue('QuotaSize', self::$iBinMB * $fQuotaSize, $oForm->aFormAttrs['method']);

            $fQuotaMaxFileSize = round($oForm->getCleanValue('QuotaMaxFileSize'), 1);
            BxDolForm::setSubmittedValue('QuotaMaxFileSize', self::$iBinMB * $fQuotaMaxFileSize, $oForm->aFormAttrs['method']);

            $iId = (int)$oForm->insert(array('ID' => $iId, 'Icon' => $mixedIcon, 'Order' => $this->oDb->getLevelOrderMax() + 1));
            if($iId != 0) {
                $aLevel = array();
                $this->oDb->getLevels(array('type' => 'by_id', 'value' => (int)$iId), $aLevel, false);

            	$iActionsFrom = (int)$oForm->getCleanValue('Actions');
            	if($iActionsFrom > 0) {
                    $aActions = array();
                    $this->oDb->getActions(array('type' => 'by_level_id', 'value' => $iActionsFrom), $aActions, false);
                    foreach($aActions as $aAction)
                        $this->oDb->switchAction($iId, $aAction['id'], true, array(
                            'AllowedCount' => $aAction['allowed_count'],
                            'AllowedPeriodLen' => $aAction['allowed_period_len'],
                            'AllowedPeriodStart' => $aAction['allowed_period_start'],
                            'AllowedPeriodEnd' => $aAction['allowed_period_end'],
                            'AdditionalParamValue' => $aAction['additional_param_value']
                        ));
            	}

                // create system event
                bx_alert('acl', 'added', $iId, 0, array('level' => $aLevel));

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            }
            else
                $aRes = array('msg' => _t('_adm_prm_err_level_create'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-prm-level-create-popup', _t('_adm_prm_txt_level_create_popup'), $this->_oTemplate->parseHtmlByName('prm_add_level.html', array(
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
            if(!$iId) {
                echoJson(array());
                exit;
            }

            $aIds = array($iId);
        }

        $iId = $aIds[0];

        $aLevel = array();
        $iLevel = $this->oDb->getLevels(array('type' => 'by_id', 'value' => $iId), $aLevel);
        if($iLevel != 1 || empty($aLevel)){
            echoJson(array());
            exit;
        }

        $oForm = $this->_getFormObject($sAction, $aLevel);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            if(($aUnavailableTo = $oForm->getCleanValue('UnavailableTo')) && is_array($aUnavailableTo))
                BxDolForm::setSubmittedValue('UnavailableTo', implode(',', $aUnavailableTo), $oForm->aFormAttrs['method']);

            $bIconImageCur = is_numeric($aLevel['icon']) && (int)$aLevel['icon'] != 0;
            $bIconImageNew = !empty($_FILES['Icon_image']['tmp_name']);

            $sIconFont = $oForm->getCleanValue('Icon');
            $bIconFont = !empty($sIconFont);

            if($bIconImageCur && ($bIconImageNew || $bIconFont)) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
                if(!$oStorage->deleteFile((int)$aLevel['icon'], 0)) {
                    echoJson(array('msg' => _t('_adm_prm_err_level_icon_image_remove')));
                    return;
                }
            }

            $sIcon = $sIconFont;
            if($bIconImageNew) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
                $sIcon = $oStorage->storeFileFromForm($_FILES['Icon_image'], false, 0);
                if($sIcon === false) {
                    echoJson(array('msg' => _t('_adm_prm_err_level_icon_image') . $oStorage->getErrorString()));
                    return;
                }

                $oStorage->afterUploadCleanup($sIcon, 0);
            } else if($bIconImageCur && !$bIconFont)
                $sIcon = $aLevel['icon'];

            BxDolForm::setSubmittedValue('Icon', $sIcon, $oForm->aFormAttrs['method']);

            $fQuotaSize = round($oForm->getCleanValue('QuotaSize'), 1);
            BxDolForm::setSubmittedValue('QuotaSize', self::$iBinMB * $fQuotaSize, $oForm->aFormAttrs['method']);

            $fQuotaMaxFileSize = round($oForm->getCleanValue('QuotaMaxFileSize'), 1);
            BxDolForm::setSubmittedValue('QuotaMaxFileSize', self::$iBinMB * $fQuotaMaxFileSize, $oForm->aFormAttrs['method']);

            if($oForm->update($iId) !== false) {
                $this->oDb->cleanCache('sys_acl_levels' . $iId);

                $aLevel = array();
                $this->oDb->getLevels(array('type' => 'by_id', 'value' => (int)$iId), $aLevel, false);

                // create system event
                bx_alert('acl', 'edited', $iId, 0, array('level' => $aLevel));

                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            }
            else
                $aRes = array('msg' => _t('_adm_prm_err_level_edit'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-prm-level-edit-popup', _t('_adm_prm_txt_level_edit_popup', _t($aLevel['name'])), $this->_oTemplate->parseHtmlByName('prm_add_level.html', array(
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
        $iAffected = 0;
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            echoJson(array());
            exit;
        }

        $aIdsAffected = array ();
        foreach($aIds as $iId) {
            if(!$this->delete($iId))
                continue;

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t('_adm_prm_err_level_delete')));
    }

    public function performActionDeleteIcon()
    {
        $sAction = 'delete_icon';

        $aIds = bx_get('ids');
        if(empty($aIds[0])) {
            echoJson(array());
            exit;
        }

        $iId = (int)$aIds[0];

        $aLevel = array();
        $iLevel = $this->oDb->getLevels(array('type' => 'by_id', 'value' => $iId), $aLevel);
        if($iLevel != 1 || empty($aLevel)){
            echoJson(array());
            exit;
        }

        if(is_numeric($aLevel['icon']) && (int)$aLevel['icon'] != 0)
            if(!BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->deleteFile((int)$aLevel['icon'], 0)) {
                echoJson(array());
                exit;
            }

        if($this->oDb->updateLevels($aLevel['id'], array('icon' => '')) !== false)
            echoJson(array('grid' => $this->getCode(false), 'blink' => $iId, 'preview' => $this->_getIconPreview($aLevel['id']), 'eval' => $this->getJsObject() . ".onDeleteIcon(oData)"));
    }

    public function getJsObject()
    {
        return 'oBxDolStudioPermissionsLevels';
    }

    public function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('prm_levels.html', array(
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
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'permissions_levels.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }
    protected function _getCellSwitcher ($mixedValue, $sKey, $aField, $aRow)
    {
        if(in_array($aRow['ID'], array(MEMBERSHIP_ID_NON_MEMBER, MEMBERSHIP_ID_ACCOUNT, MEMBERSHIP_ID_STANDARD, MEMBERSHIP_ID_UNCONFIRMED, MEMBERSHIP_ID_PENDING, MEMBERSHIP_ID_SUSPENDED)))
            return parent::_getCellDefault('', $sKey, $aField, $aRow);;

        return parent::_getCellSwitcher($mixedValue, $sKey, $aField, $aRow);
    }
    protected function _getCellIcon ($mixedValue, $sKey, $aField, $aRow)
    {
        if(($sSvg = $this->_getIconLucide($mixedValue, ['class' => 'bx-item-icon'])) !== false)
            $mixedValue = '<span class="bx-std-grid-icon">' . $sSvg . '</span>'; // a 24px glyph on a translucent tile (see "Studio: Grids" in tailwind.css)
        else
            $mixedValue = $this->_oTemplate->getImage($mixedValue, array('class' => 'bx-item-icon'));

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellActionsList ($mixedValue, $sKey, $aField, $aRow)
    {
        $aActions = array();
        $iActions = $this->oDb->getActions(array('type' => 'by_level_id', 'value' => $aRow['ID']), $aActions);

        $sLink = BX_DOL_URL_STUDIO . 'builder_permissions.php?page=actions&level=' . $aRow['ID'];
        $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_prm_txt_n_actions', $iActions), array(
            'title' => _t('_adm_prm_txt_manage_actions')
        ));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellQuotaSize ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault ($mixedValue > 0 ? _t_format_size($mixedValue) : '&infin;', $sKey, $aField, $aRow);
    }

    protected function _getCellQuotaNumber ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault ($mixedValue > 0 ? $mixedValue : '&infin;', $sKey, $aField, $aRow);
    }

    protected function _getCellQuotaMaxFileSize ($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault ($mixedValue > 0 ? _t_format_size($mixedValue) : '&infin;', $sKey, $aField, $aRow);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if ($sType == 'single' && $aRow['Removable'] != 'yes')
            return '';

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getFormObject($sAction, $aLevel = array())
    {
        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-prm-level-create',
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT,
                'enctype' => 'multipart/form-data',
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_acl_levels',
                    'key' => 'ID',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => isset($aLevel['id']) ? (int)$aLevel['id'] : 0,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'Active' => array(
                    'type' => 'hidden',
                    'name' => 'Active',
                    'value' => 'yes',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'Purchasable' => array(
                    'type' => 'hidden',
                    'name' => 'Purchasable',
                    'value' => 'no',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'Removable' => array(
                    'type' => 'hidden',
                    'name' => 'Removable',
                    'value' => 'yes',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'Name' => array(
                    'type' => 'text_translatable',
                    'name' => 'Name',
                    'caption' => _t('_adm_prm_txt_level_name'),
                    'info' => _t('_adm_prm_dsc_level_name'),
                    'value' => '_adm_prm_txt_level',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3, 100, 'Name'),
                        'error' => _t('_adm_prm_err_level_name'),
                    ),
                ),
                'Description' => array(
                    'type' => 'textarea_translatable',
                    'name' => 'Description',
                    'caption' => _t('_adm_prm_txt_level_description'),
                    'info' => _t('_adm_prm_dsc_level_description'),
                    'value' => isset($aLevel['description']) ? $aLevel['description'] : '_adm_prm_txt_level',
                    'code' => 1,
                    'db' => array (
                        'pass' => 'XssHtml',
                    )
                ),
                'UnavailableTo' => array(
                    'type' => 'checkbox_set',
                    'name' => 'UnavailableTo',
                    'caption' => _t('_adm_prm_txt_level_unavailable_to'),
                    'info' => _t('_adm_prm_dsc_level_unavailable_to'),
                    'value' => isset($aLevel['unavailable_to']) ? explode(',', $aLevel['unavailable_to']) : [],
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'QuotaSize' => array(
                    'type' => 'text',
                    'name' => 'QuotaSize',
                    'caption' => _t('_adm_prm_txt_level_quota_size'),
                    'info' => _t('_adm_prm_dsc_level_quota_size'),
                    'value' => isset($aLevel['quota_size']) ? round($aLevel['quota_size'] / self::$iBinMB, 1) : '0',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Float',
                    ),
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9\.]+$/'),
                        'error' => _t('_adm_prm_err_level_quota_size'),
                    ),
                ),
                'QuotaMaxFileSize' => array(
                    'type' => 'text',
                    'name' => 'QuotaMaxFileSize',
                    'caption' => _t('_adm_prm_txt_level_quota_max_file_size'),
                    'info' => _t('_adm_prm_dsc_level_quota_max_file_size'),
                    'value' => isset($aLevel['quota_max_file_size']) ? round($aLevel['quota_max_file_size'] / self::$iBinMB, 1) : '',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Float',
                    ),
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9\.]+$/'),
                        'error' => _t('_adm_prm_err_level_quota_max_file_size'),
                    ),
                ),
                'QuotaNumber' => array(
                    'type' => 'text',
                    'name' => 'QuotaNumber',
                    'caption' => _t('_adm_prm_txt_level_quota_number'),
                    'info' => _t('_adm_prm_dsc_level_quota_number'),
                    'value' => isset($aLevel['quota_number']) ? (int)$aLevel['quota_number'] : '0',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Int',
                    ),
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9]+$/'),
                        'error' => _t('_adm_prm_err_level_quota_number'),
                    ),
                ),
                'PasswordExpired' => array(
                    'type' => 'text',
                    'name' => 'PasswordExpired',
                    'caption' => _t('_adm_prm_txt_level_password_expired'),
                    'info' => _t('_adm_prm_dsc_level_password_expired'),
                    'value' => isset($aLevel['password_expired']) ? (int)$aLevel['password_expired'] : '0',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Int',
                    ),
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9]+$/'),
                        'error' => _t('_adm_prm_err_level_password_expired'),
                    ),
                ),
                'PasswordExpiredNotify' => array(
                    'type' => 'text',
                    'name' => 'PasswordExpiredNotify',
                    'caption' => _t('_adm_prm_txt_level_password_expired_notify'),
                    'info' => _t('_adm_prm_dsc_level_password_expired_notify'),
                    'value' => isset($aLevel['password_expired_notify']) ? (int)$aLevel['password_expired_notify'] : '0',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Int',
                    ),
                    'checker' => array (
                        'func' => 'preg',
                        'params' => array('/^[0-9]+$/'),
                        'error' => _t('_adm_prm_err_level_password_expired_notify'),
                    ),
                ),
                'Icon' => array(
                    'type' => 'textarea',
                    'name' => 'Icon',
                    'caption' => _t('_adm_prm_txt_level_icon'),
                    'info' => _t('_adm_prm_dsc_level_icon'),
                    'value' => '',
                    'required' => '0',
                    'code' => 1,
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => '',
                        'params' => array(),
                        'error' => _t('_adm_prm_err_level_icon'),
                    ),
                    'attrs' => array('class' => 'bx-form-input-textarea-small'),
                ),
                'Icon_image' => array(
                    'type' => 'file',
                    'name' => 'Icon_image',
                    'caption' => _t('_adm_prm_txt_level_icon_image'),
                    'info' => _t('_adm_prm_dsc_level_icon_image'),
                    'value' => '',
                    'checker' => array (
                        'func' => '',
                        'params' => '',
                        'error' => _t('_adm_prm_err_level_icon_image'),
                    ),
                ),
                'Icon_preview' => array(
                    'type' => 'custom',
                    'name' => 'Icon_preview',
                    'caption' => _t('_adm_prm_txt_level_icon_image_old'),
                    'content' => ''
                ),
                'Actions' => array(
                    'type' => 'select',
                    'name' => 'Actions',
                    'caption' => _t('_adm_prm_txt_level_actions_copy'),
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
                        'value' => _t('_adm_prm_btn_level_add'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_prm_btn_level_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        $aLevels = array(); 
        $this->oDb->getLevels(array('type' => 'all_pair'), $aLevels, false);
        foreach($aLevels as $iId => $sName)
            $aForm['inputs']['Actions']['values'][] = array('key' => $iId, 'value' => _t($sName));
        
        $aModules = bx_srv('system', 'GetModulesByType', ['profile']);
        foreach($aModules as $aModule)
            $aForm['inputs']['UnavailableTo']['values'][] = array('key' => '|' . $aModule['name'] . '|', 'value' => BxDolStudioUtils::getModuleTitle($aModule['name']));
        

        switch($sAction) {
            case 'add':
                unset($aForm['inputs']['id']);
                unset($aForm['inputs']['Icon_preview']);

                $aForm['form_attrs']['id'] .= 'create';
                break;

            case 'edit':
                unset($aForm['inputs']['Active']);
                unset($aForm['inputs']['Purchasable']);
                unset($aForm['inputs']['Removable']);
                unset($aForm['inputs']['Name']);
                unset($aForm['inputs']['Actions']);

                $aForm['form_attrs']['id'] .= 'edit';
                $aForm['inputs']['Icon_image']['caption'] = _t('_adm_prm_txt_level_icon_image_new');
                $aForm['inputs']['controls'][0]['value'] = _t('_adm_prm_btn_level_save');

                $sIconImage = $sIconFont = "";
                if(!empty($aLevel['icon'])) {
                    if(is_numeric($aLevel['icon']) && (int)$aLevel['icon'] != 0) {
                        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);

                        $sIconImage = $oStorage->getFileUrlById((int)$aLevel['icon']);
                    } else {
                        $sIconFont = $aLevel['icon'];
                        $aForm['inputs']['Icon']['value'] = $sIconFont;
                    }
                }

                $aForm['inputs']['Icon_preview']['content'] = $this->_getIconPreview($aLevel['id'], $sIconImage, $sIconFont);
                break;
        }

        return new BxTemplStudioFormView($aForm);
    }

    protected function _getAvailableId()
    {
        $aLevels = array();
        $this->oDb->getLevels(array('type' =>'all_order_id'), $aLevels, false);

        $iId = 1;
        foreach($aLevels as $aLevel) {
            if($iId != (int)$aLevel['id'])
                break;

            $iId++;
        }

        return $iId <= BX_DOL_STUDIO_PERMISSIONS_LEVEL_ID_INT_MAX ? $iId : false;
    }
}

/** @} */
