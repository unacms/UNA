<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioNavigationSets extends BxDolStudioNavigationSets
{
    protected $sUrlViewItems;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_nav_btn_sets_edit');
        $this->_aOptions['actions_single']['delete']['attr']['title'] = _t('_adm_nav_btn_sets_delete');

        $this->sUrlViewItems = BX_DOL_URL_STUDIO . 'builder_menu.php?page=items&module=%s&set=%s';
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-nav-set-create',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
                    'o' => $this->_sObject, 
                    'a' => $sAction, 
                    $this->_aOptions['filter_get'] => $this->_sFilter
                ]),
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_menu_sets',
                    'key' => 'set_name',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_nav_txt_sets_title'),
                    'info' => _t('_adm_nav_dsc_sets_title'),
                    'value' => '_adm_nav_txt_set',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3, 100, 'title'),
                        'error' => _t('_adm_nav_err_sets_title'),
                    ),
                ),
                'deletable' => array(
                    'type' => 'hidden',
                    'name' => 'deletable',
                    'value' => 1,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_nav_btn_sets_add'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_nav_btn_sets_cancel'),
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
        	bx_import('BxDolStudioUtils');

            $sLanguage = BxDolStudioLanguagesUtils::getInstance()->getCurrentLangName(false);

            $sName = BxDolForm::getSubmittedValue('title-' . $sLanguage, $aForm['form_attrs']['method']);
            $sName = uriGenerate($sName, 'sys_menu_sets', 'set_name', ['empty' => 'set']);

            if($oForm->insert(array('set_name' => $sName, 'module' => BX_DOL_STUDIO_MODULE_CUSTOM)) !== false)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $sName);
            else
                $aRes = array('msg' => _t('_adm_nav_err_sets_create'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-nav-set-create-popup', _t('_adm_nav_txt_sets_create_popup'), $this->_oTemplate->parseHtmlByName('nav_add_set.html', array(
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

        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $sId = bx_get('set_name');
            if(!$sId) {
                echoJson(array());
                exit;
            }

            $aIds = array($sId);
        }

        $sId = bx_process_input($aIds[0]);

        $aSet = array();
        $iSet = $this->oDb->getSets(array('type' => 'by_name', 'value' => $sId), $aSet);
        if($iSet != 1 || empty($aSet)) {
            echoJson(array());
            exit;
        }

        bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-nav-set-edit',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
                    'o' => $this->_sObject, 
                    'a' => $sAction,
                    $this->_aOptions['filter_get'] => $this->_sFilter
                ]),
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_menu_sets',
                    'key' => 'set_name',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'set_name' => array(
                    'type' => 'hidden',
                    'name' => 'set_name',
                    'value' => $sId,
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_nav_txt_sets_title'),
                    'info' => _t('_adm_nav_dsc_sets_title'),
                    'value' => $aSet['title'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3, 100, 'title'),
                        'error' => _t('_adm_nav_err_sets_title'),
                    ),
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_nav_btn_menus_save'),
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_nav_btn_menus_cancel'),
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
            if($oForm->update($sId) !== false)
                $aRes = array('grid' => $this->getCode(false), 'blink' => $sId);
            else
                $aRes = array('msg' => _t('_adm_nav_err_sets_edit'));

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-nav-set-edit-popup', _t('_adm_nav_txt_sets_edit_popup', _t($aSet['title'])), $this->_oTemplate->parseHtmlByName('nav_add_set.html', array(
                'form_id' => $aForm['form_attrs']['id'],
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

        $oGridItems = BxDolGrid::getObjectInstance('sys_studio_nav_items');
        if(!$oGridItems) {
            echoJson(array());
            exit;
        }

        $aIdsAffected = array ();
        foreach($aIds as $sId) {
            $sId = bx_process_input($sId);

            $aSet = array();
            $this->oDb->getSets(array('type' => 'by_name', 'value' => $sId), $aSet, false);
            if(!is_array($aSet) || empty($aSet) || !$this->_isDeletable($aSet))
                continue;

            $aMenus = array();
            $this->oDb->getMenus(array('type' => 'by_set_name', 'value' => $sId), $aMenus, false);
            if(is_array($aMenus) && count($aMenus) > 0) {
                echoJson(array('msg' => _t('_adm_nav_err_sets_delete_used')));
                exit;
            }

            if((int)$this->_delete($sId) <= 0)
                continue;

            $aItems = array();
            $this->oDb->getItems(array('type' => 'by_set_name', 'value' => $aSet['name']), $aItems, false);
            if(is_array($aItems) && !empty($aItems))
                foreach($aItems as $aItem)
                    $oGridItems->deleteByItem($aItem);

            BxDolStudioLanguagesUtils::getInstance()->deleteLanguageString($aSet['title']);

            $aIdsAffected[] = $sId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t('_adm_nav_err_sets_delete')));
    }

    function getJsObject()
    {
        return 'oBxDolStudioNavigationSets';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('nav_sets.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'navigation_sets.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellItems ($mixedValue, $sKey, $aField, $aRow)
    {
        $aSets = array();
        $this->oDb->getSets(array('type' => 'by_name', 'value' => $aRow['set_name']), $aSets, false);

        $sLink = sprintf($this->sUrlViewItems, $aRow['module'], $aRow['set_name']);
        $mixedValue = $this->_getCellCount($aSets['items_count'], $sLink, _t('_adm_nav_txt_n_items', $aSets['items_count']), _t('_adm_nav_txt_manage_items'));

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if ($sType == 'single' && !$this->_isDeletable($aRow))
            return '';

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        return  $this->getModulesSelectAll('getSets') . $this->getSearchInput();
    }

    protected function _isDeletable(&$aRow)
    {
    	return (int)$aRow['deletable'] != 0;
    }
}

/** @} */
