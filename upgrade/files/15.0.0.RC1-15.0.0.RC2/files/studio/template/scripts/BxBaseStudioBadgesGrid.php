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

class BxBaseStudioBadgesGrid extends BxDolStudioBadgesGrid
{   
    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);
    }
    
    public function performActionAdd()
    {
        $sAction = 'add';
        
        if(!$this->canAdd()) {
            echoJson(array());
            exit;
        }
        
        $oForm = $this->_getForm($sAction);
     
        if (!$oForm)
            return '';
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?' . bx_encode_url_params($_GET, array('ids', '_r'));
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            if(!empty($_FILES['icon_image']['tmp_name'])) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);

                $mixedIcon = $oStorage->storeFileFromForm($_FILES['icon_image'], false, 0);
                if($mixedIcon === false) {
                    echoJson(array('msg' => _t('_adm_nav_err_items_icon_image') . $oStorage->getErrorString()));
                    return;
                }

                $oStorage->afterUploadCleanup($mixedIcon, 0);
                BxDolForm::setSubmittedValue('icon', $mixedIcon, $oForm->aFormAttrs['method']);
            }
            
            $mixedResult = $oForm->insert(array('added' => time(), 'module' => $this->sModule));
            if(is_numeric($mixedResult))
                $aRes = array('grid' => $this->getCode(false), 'blink' => $mixedResult);
            else
                $aRes = array('msg' => $mixedResult);
            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-badges-add-popup', _t('_adm_form_txt_badges_add_popup'), $this->_oTemplate->parseHtmlByName('form_add_badge.html', array(
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

        $aBadge = $this->_oBadges->getData(array('type' => 'id', 'id' => $iId));
        if(empty($aBadge) || !is_array($aBadge))
            return echoJson(array());
        
        $this->sModule = $aBadge['module'];
        $oForm = $this->_getForm($sAction, $aBadge);
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $bIconImageCur = is_numeric($aBadge['icon']) && (int)$aBadge['icon'] != 0;
            $bIconImageNew = !empty($_FILES['icon_image']['tmp_name']);

            $sIconFont = $oForm->getCleanValue('icon');
            $bIconFont = !empty($sIconFont);

            if($bIconImageCur && ($bIconImageNew || $bIconFont)) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
                if(!$oStorage->deleteFile((int)$aBadge['icon'], 0)) {
                    echoJson(array('msg' => _t('_adm_nav_err_items_icon_image_remove')));
                    return;
                }
            }

            $sIcon = $sIconFont;
            if($bIconImageNew) {
                $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
                $sIcon = $oStorage->storeFileFromForm($_FILES['icon_image'], false, 0);
                if($sIcon === false) {
                    echoJson(array('msg' => _t('_adm_nav_err_items_icon_image') . $oStorage->getErrorString()));
                    return;
                }

                $oStorage->afterUploadCleanup($sIcon, 0);
            } else if($bIconImageCur && !$bIconFont)
                $sIcon = $aBadge['icon'];
           
            BxDolForm::setSubmittedValue('icon', $sIcon, $oForm->aFormAttrs['method']);
            
            $mixedResult = $oForm->update($iId);
            if(is_numeric($mixedResult))
                $aRes = array('grid' => $this->getCode(false), 'blink' => $mixedResult);
            else
                $aRes = array('msg' => $mixedResult);
            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-form-badges-edit-popup', _t('_adm_form_txt_badges_edit_popup', _t($aBadge['text'])), $this->_oTemplate->parseHtmlByName('form_add_badge.html', array(
               'form_id' => $oForm->aFormAttrs['id'],
               'form' => $oForm->getCode(true),
               'object' => $this->_sObject,
               'action' => $sAction
           )));

            echoJson(array('popup' => array('html' => $sContent, 'options' => array('closeOnOuterClick' => false))));
        }
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
        
        $aItem = array();
        $iItem = $this->oDb->getData(array('type' => 'id', 'id' => $iId), $aItem);
        if(empty($aItem)){
            echoJson(array());
            exit;
        }

        if(is_numeric($aItem['icon']) && (int)$aItem['icon'] != 0)
            if(!BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->deleteFile((int)$aItem['icon'], 0)) {
                echoJson(array());
                exit;
            }

        if($this->oDb->update($aItem['id'], array('icon' => '')) !== false)
            echoJson(array('grid' => $this->getCode(false), 'blink' => $iId, 'preview' => $this->_getIconPreview($aItem['id']), 'eval' => $this->getJsObject() . ".onDeleteIcon(oData)"));
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

        foreach ($aIds as $mixedId){
            if ($this->_delete($mixedId)){
                $iAffected ++;
                $this->_oBadges->delete(array('type' => 'id', 'id' => $mixedId));
            }
        }

        echo echoJson(array_merge(
            array(
                'grid' => $this->getCode(false),
            ),
            $iAffected ? array() : array('msg' => _t("_sys_grid_delete_failed"))
        ));
    }
    
    protected function _getCellModule ($mixedValue, $sKey, $aField, $aRow)
    {
        $oModule = BxDolModule::getInstance($aRow['module']);
        if($oModule && $oModule instanceof iBxDolContentInfoService){
            $mixedValue = $oModule->_aModule['title'];
        }
        else{
            $mixedValue = $aRow['module'];
        }
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellAdded($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }
    
    protected function _getCellText($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t($mixedValue), $sKey, $aField, $aRow);
    }
    
    protected function _getCellIcon ($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_oTemplate->getIcon($mixedValue, array('class' => 'bx-item-icon'));
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
    
    protected function _getCellView ($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = BxDolService::call('system', 'get_badge', array($aRow), 'TemplServices');
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }
         
    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'forms_badges.js'));
        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }
    
    function getJsObject()
    {
        return 'oBxDolStudioBadgesManageTools';
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
    
    protected function _getActionDeleteIcon ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }
    
    protected function _getFilterControls ()
    {
        parent::_getFilterControls();
        
        $aInputModules = $this->getModulesSelectOneArray('getData', false, false);
		foreach($aInputModules['values'] as $sKey => $sValue){
			$oModule = BxDolModule::getInstance($sKey);
            if(!($oModule instanceof iBxDolContentInfoService)){
                unset($aInputModules['values'][$sKey]);
			}	
            else{
                $CNF = $oModule->_oConfig->CNF;
                if(!isset($CNF['BADGES_AVALIABLE']) || !(bool)$CNF['BADGES_AVALIABLE']){
                    unset($aInputModules['values'][$sKey]);
                }
            }
		}
		$aInputModules['values'] = array_merge(array('' => _t('_adm_txt_select_module')), $aInputModules['values']);
		$oForm = new BxTemplStudioFormView(array());
        $sContent = $oForm->genRow($aInputModules);
        
        $oForm = new BxTemplStudioFormView(array());

        $aInputSearch = array(
            'type' => 'text',
            'name' => 'keyword',
            'attrs' => array(
                'id' => 'bx-grid-search-' . $this->_sObject,
                'aria-label' => _t('_adm_grid_lbl_search'),
            ),
        );
        $sContent .= $oForm->genRow($aInputSearch);

        return  $sContent;
    }
    
    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('forms_badges.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }
    
    protected function _getForm($sAction, $aBadge = array())
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-form-bages-form-' . $sAction,
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&module=' . $this->sModule . '&a=' . $sAction,
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_badges',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
                'checker_helper' => 'BxDolFormCheckerHelper'
            ),
            'inputs' => array (
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => isset($aBadge['id']) ? (int)$aBadge['id'] : 0,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'text' => array(
                    'type' => 'text',
                    'name' => 'text',
                    'caption' => _t('_adm_form_txt_badges_text'),
                    'info' => '',
                    'value' => isset($aBadge['text']) ? $aBadge['text'] : '',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'color' => array(
                    'type' => 'rgb-list',
                    'name' => 'color',
                    'caption' => _t('_adm_form_txt_badges_color'),
                    'info' => '',
                    'value' => isset($aBadge['color']) ? $aBadge['color'] : '',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                
                'is_icon_only' => array(
                    'type' => 'switcher',
                    'name' => 'is_icon_only',
                    'caption' => _t('_adm_form_txt_badges_is_icon_only'),
                    'info' => '',
                    'value' => '1',
                    'checked' => isset($aBadge['is_icon_only']) && $aBadge['is_icon_only'] == '1',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'icon' => array(
                    'type' => 'textarea',
                    'name' => 'icon',
                    'caption' => _t('_adm_form_txt_badges_icon'),
                    'info' => _t('_adm_form_dsc_badges_icon'),
                    'value' => '',
					'code' => 1,
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'icon_image' => array(
                    'type' => 'file',
                    'name' => 'icon_image',
                    'caption' => _t('_adm_form_txt_badges_icon_image'),
                    'info' => _t('_adm_form_dsc_badges_icon_image'),
                    'value' => '',
                    'checker' => array (
                        'func' => '',
                        'params' => '',
                        'error' => _t('_adm_form_err_badges_icon_image'),
                    ),
                ),
                'icon_preview' => array(
                    'type' => 'custom',
                    'name' => 'icon_preview',
                    'caption' => _t('_adm_form_txt_badges_icon_image_old'),
                    'content' => ''
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_form_btn_badges_submit'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_form_btn_badges_cancel'),
                        'attrs' => array(
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );
        
        switch($sAction) {
            case 'add':
                unset($aForm['inputs']['icon_preview']);
                break;

            case 'edit':
                $sIconImage = $sIconFont = "";
                if(!empty($aBadge['icon'])) {
                    if(is_numeric($aBadge['icon']) && (int)$aBadge['icon'] != 0) {
                        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);

                        $sIconImage = $oStorage->getFileUrlById((int)$aBadge['icon']);
                    }
                    else {
                        $sIconFont = $aBadge['icon'];
                        $aForm['inputs']['icon']['value'] = $sIconFont;
                    }
                }

                $aForm['inputs']['icon_preview']['content'] = $this->_getIconPreview($aBadge['id'], $sIconImage, $sIconFont);
                break;
        }
        
        return new BxTemplStudioFormView($aForm);
    }
}
/** @} */