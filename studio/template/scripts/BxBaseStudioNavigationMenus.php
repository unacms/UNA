<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

bx_import('BxDolStudioUtils');

class BxBaseStudioNavigationMenus extends BxDolStudioNavigationMenus
{
    private $sCreateNew = 'sys_create_new';
    protected $sUrlViewItems;

    function __construct($aOptions, $oTemplate = false)
    {
        parent::__construct($aOptions, $oTemplate);

        $this->_aOptions['actions_single']['edit']['attr']['title'] = _t('_adm_nav_btn_menus_edit');
        $this->_aOptions['actions_single']['delete']['attr']['title'] = _t('_adm_nav_btn_menus_delete');

        $this->sUrlViewItems = BX_DOL_URL_STUDIO . 'builder_menu.php?page=items&module=%s&set=%s';
    }

    public function performActionAdd()
    {
        $sAction = 'add';

        $oForm = $this->_getFormObject($sAction);
        if($oForm->isSubmitted() && isset($oForm->aInputs['set_name']))
            $this->updateSetFields($oForm);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $oLanguage = BxDolStudioLanguagesUtils::getInstance();
            $sLanguage = $oLanguage->getCurrentLangName(false);

            $sObject = BxDolForm::getSubmittedValue('title-' . $sLanguage, $oForm->aFormAttrs['method']);
            $sObject = uriGenerate($sObject, 'sys_objects_menu', 'object', ['empty' => 'object']);

            //--- New Set Creation
            if($oForm->getCleanValue('set_name') == $this->sCreateNew) {
                $sSetTitleValue = $oForm->getCleanValue('set_title');
                $sSetName = uriGenerate($sSetTitleValue, 'sys_menu_sets', 'set_name', ['empty' => 'set']);
                $sSetTitleKey = '_adm_nav_txt_set_' . $sSetName;

                if($this->oDb->addSet(array('set_name' => $sSetName, 'module' => BX_DOL_STUDIO_MODULE_CUSTOM, 'title' => $sSetTitleKey, 'deletable' => 1))) {
                    $oLanguage->addLanguageString($sSetTitleKey, $sSetTitleValue);

                    BxDolForm::setSubmittedValue('set_name', $sSetName, $oForm->aFormAttrs['method']);
                }
            }
            unset($oForm->aInputs['set_title']);

            $iId = (int)$oForm->insert(array('object' => $sObject, 'module' => BX_DOL_STUDIO_MODULE_CUSTOM, 'deletable' => 1, 'active' => 1));
            if($iId != 0) {
                $this->onMenuChanged($sObject);
                $aRes = array('grid' => $this->getCode(false), 'blink' => $iId);
            } else {
                $aRes = array('msg' => _t('_adm_nav_err_menus_create'));
            }
            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-nav-menu-create-popup', _t('_adm_nav_txt_menus_create_popup'), $this->_oTemplate->parseHtmlByName('nav_add_menu.html', array(
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

        $aMenu = $this->_getItem('getMenus');
        if($aMenu === false) {
            echoJson(array());
            exit;
        }

        $oForm = $this->_getFormObject($sAction, $aMenu);
        if($oForm->isSubmitted() && isset($oForm->aInputs['set_name']))
            $this->updateSetFields($oForm);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {        	
            //--- New Set Creation
            if($oForm->getCleanValue('set_name') == $this->sCreateNew) {
                $sSetTitleValue = $oForm->getCleanValue('set_title');
                $sSetName = 'custom_' . $this->getSystemName($sSetTitleValue);
                $sSetTitleKey = '_adm_nav_txt_set_' . $sSetName;

                if($this->oDb->addSet(array('set_name' => $sSetName, 'module' => BX_DOL_STUDIO_MODULE_CUSTOM, 'title' => $sSetTitleKey, 'deletable' => 1))) {
                    BxDolStudioLanguagesUtils::getInstance()->addLanguageString($sSetTitleKey, $sSetTitleValue);

                    BxDolForm::setSubmittedValue('set_name', $sSetName, $oForm->aFormAttrs['method']);
                }
            }
            unset($oForm->aInputs['set_title']);

            if($oForm->update($aMenu['id']) !== false) {
                $this->onMenuChanged($aMenu['object']);
                $aRes = array('grid' => $this->getCode(false), 'blink' => $aMenu['id']);
            } else {
                $aRes = array('msg' => _t('_adm_nav_err_menus_edit'));
            }

            echoJson($aRes);
        }
        else {
            $sContent = BxTemplStudioFunctions::getInstance()->popupBox('adm-nav-menu-edit-popup', _t('_adm_nav_txt_menus_edit_popup', _t($aMenu['title'])), $this->_oTemplate->parseHtmlByName('nav_add_menu.html', array(
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
        if(!$aIds || !is_array($aIds))
            return echoJson([]);

        $aIdsAffected = [];
        foreach($aIds as $iId) {
            $aMenu = array();
            $iMenu = $this->oDb->getMenus(array('type' => 'by_id', 'value' => (int)$iId), $aMenu);
            if($iMenu != 1 || empty($aMenu) || !$this->_isDeletable($aMenu))
                continue;

            if((int)$this->_delete($iId) <= 0)
                continue;

            BxDolStudioLanguagesUtils::getInstance()->deleteLanguageString($aMenu['title']);

            $this->onMenuChanged($aMenu['object']);            

            $aIdsAffected[] = $iId;
            $iAffected++;
        }

        echoJson($iAffected ? array('grid' => $this->getCode(false), 'blink' => $aIdsAffected) : array('msg' => _t('_adm_nav_err_menus_delete')));
    }

    function getJsObject()
    {
        return 'oBxDolStudioNavigationMenus';
    }

    function getCode($isDisplayHeader = true)
    {
        return $this->_oTemplate->parseHtmlByName('nav_menus.html', array(
            'content' => parent::getCode($isDisplayHeader),
            'js_object' => $this->getJsObject(),
            'grid_object' => $this->_sObject,
            'params_divider' => $this->sParamsDivider
        ));
    }

    protected function _addJsCss()
    {
        parent::_addJsCss();
        $this->_oTemplate->addJs(array('jquery.form.min.js', 'navigation_menus.js'));

        $oForm = new BxTemplStudioFormView(array());
        $oForm->addCssJs();
    }

    protected function _getCellTitle ($mixedValue, $sKey, $aField, $aRow)
    {
        $aValue = $this->_limitMaxLength(_t($aRow['title']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow, false);

        $sLink = sprintf($this->sUrlViewItems, $aRow['module'], $aRow['set_name']);
        $mixedValue = $this->_oTemplate->parseLink($sLink, $aValue[0], array(
            'title' => _t('_adm_nav_txt_manage_items')
        )) . (isset($aValue[1]) ? $aValue[1] : '');

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellItems ($mixedValue, $sKey, $aField, $aRow)
    {
        if(!empty($aRow['set_name'])) {
            $aSets = array();
            $this->oDb->getSets(array('type' => 'by_name', 'value' => $aRow['set_name']), $aSets, false);

            $sLink = sprintf($this->sUrlViewItems, $aRow['module'], $aRow['set_name']);
            $mixedValue = $this->_oTemplate->parseLink($sLink, _t('_adm_nav_txt_n_items', $aSets['items_count']), array(
                'title' => _t('_adm_nav_txt_manage_items')
            ));
        }

        return parent::_getCellDefault ($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellModule($mixedValue, $sKey, $aField, $aRow)
    {
        $mixedValue = $this->_limitMaxLength($this->getModuleTitle($aRow['module']), $sKey, $aField, $aRow, $this->_isDisplayPopupOnTextOverflow);
        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionDelete ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if($sType == 'single' && !$this->_isDeletable($aRow))
            return '';

        return parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        return  $this->getModulesSelectAll('getMenus') . $this->getSearchInput();
    }

    protected function _getFormObject($sAction, $aMenu = array())
    {
    	bx_import('BxTemplStudioFormView');

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-nav-menu-',
                'action' => BX_DOL_URL_ROOT . bx_append_url_params('grid.php', [
                    'o' => $this->_sObject, 
                    'a' => $sAction,
                    $this->_aOptions['filter_get'] => $this->_sFilter
                ]),
                'method' => BX_DOL_STUDIO_METHOD_DEFAULT
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_objects_menu',
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
                    'value' => isset($aMenu['id']) ? (int)$aMenu['id'] : 0,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_nav_txt_menus_title'),
                    'info' => _t('_adm_nav_dsc_menus_title'),
                    'value' => isset($aMenu['title']) ? $aMenu['title'] : '_adm_nav_txt_menu',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3, 100, 'title'),
                        'error' => _t('_adm_nav_err_menus_title'),
                    ),
                ),
                'title_public' => array(
                    'type' => 'text_translatable',
                    'name' => 'title_public',
                    'caption' => _t('_adm_nav_txt_menus_title_public'),
                    'info' => '',
                    'value' => $aMenu['title_public'] ?? '',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'set_name' => array(
                    'type' => 'select',
                    'name' => 'set_name',
                    'caption' => _t('_adm_nav_txt_menus_set_name'),
                    'info' => _t('_adm_nav_dsc_menus_set_name'),
                    'value' => isset($aMenu['set_name']) ? $aMenu['set_name'] : '',
                    'values' => array(
                        array('key' => '', 'value' => _t('_adm_nav_txt_menus_set_name_select')),
                        array('key' => $this->sCreateNew, 'value' => _t('_adm_nav_txt_menus_set_name_new'))
                    ),
                    'required' => '1',
                    'attrs' => array(
                        'id' => 'bx-form-field-set-name',
                        'onchange' => $this->getJsObject() . ".onSelectSet(this)"
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'avail',
                        'params' => array(),
                        'error' => _t('_adm_nav_err_menus_set_name'),
                    ),
                ),
                'set_title' => array(
                    'type' => 'text',
                    'name' => 'set_title',
                    'caption' => _t('_adm_nav_txt_menus_set_title'),
                    'info' => _t('_adm_nav_dsc_menus_set_title'),
                    'value' => '',
                    'required' => '1',
                    'tr_attrs' => array(
                        'style' => 'display:none'
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'Avail',
                        'params' => array(),
                        'error' => _t('_adm_nav_err_menus_set_title'),
                    ),
                ),
                'template_id' => array(
                    'type' => 'select',
                    'name' => 'template_id',
                    'caption' => _t('_adm_nav_txt_menus_style'),
                    'info' => _t('_adm_nav_dsc_menus_style'),
                    'value' => isset($aMenu['template_id']) ? $aMenu['template_id'] : '',
                    'values' => array(
                        array('key' => '', 'value' => _t('_adm_nav_txt_menus_style_select'))
                    ),
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'avail',
                        'params' => array(),
                        'error' => _t('_adm_nav_err_menus_style'),
                    ),
                ),
                'button_style' => array(
                    'type' => 'select',
                    'name' => 'button_style',
                    'caption' => _t('_adm_nav_txt_menus_button_style'),
                    'info' => _t('_adm_nav_dsc_menus_button_style'),
                    'value' => isset($aMenu['button_style']) ? $aMenu['button_style'] : BxDolMenu::BUTTON_STYLE_AUTO,
                    'values' => array(
                        array('key' => BxDolMenu::BUTTON_STYLE_AUTO, 'value' => _t('_adm_nav_txt_menus_button_auto')),
                        array('key' => BxDolMenu::BUTTON_STYLE_REGULAR, 'value' => _t('_adm_nav_txt_menus_button_style_regular')),
                        array('key' => BxDolMenu::BUTTON_STYLE_GLASS, 'value' => _t('_adm_nav_txt_menus_button_style_glass')),
                        array('key' => BxDolMenu::BUTTON_STYLE_PLAIN, 'value' => _t('_adm_nav_txt_menus_button_style_plain')),
                    ),
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'button_size' => array(
                    'type' => 'select',
                    'name' => 'button_size',
                    'caption' => _t('_adm_nav_txt_menus_button_size'),
                    'info' => _t('_adm_nav_dsc_menus_button_size'),
                    'value' => isset($aMenu['button_size']) ? $aMenu['button_size'] : BxDolMenu::BUTTON_SIZE_AUTO,
                    'values' => array(
                        array('key' => BxDolMenu::BUTTON_SIZE_AUTO, 'value' => _t('_adm_nav_txt_menus_button_auto')),
                        array('key' => BxDolMenu::BUTTON_SIZE_MINI, 'value' => _t('_adm_nav_txt_menus_button_size_mini')),
                        array('key' => BxDolMenu::BUTTON_SIZE_SMALL, 'value' => _t('_adm_nav_txt_menus_button_size_small')),
                        array('key' => BxDolMenu::BUTTON_SIZE_REGULAR, 'value' => _t('_adm_nav_txt_menus_button_size_regular')),
                        array('key' => BxDolMenu::BUTTON_SIZE_LARGE, 'value' => _t('_adm_nav_txt_menus_button_size_large')),
                    ),
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'persistent' => array(
                    'type' => 'text',
                    'name' => 'persistent',
                    'caption' => _t('_adm_nav_txt_menus_persistent'),
                    'info' => _t('_adm_nav_dsc_menus_persistent'),
                    'value' => isset($aMenu['persistent']) ? $aMenu['persistent'] : 0,
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'controls' => array(
                    'name' => 'controls',
                    'type' => 'input_set',
                    array(
                        'type' => 'submit',
                        'name' => 'do_submit',
                        'value' => _t('_adm_nav_btn_menus_add'),
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

        $aSets = array();
        $this->oDb->getSets(array('type' => 'all'), $aSets, false);
        foreach($aSets as $sSet)
            $aForm['inputs']['set_name']['values'][] = array('key' => $sSet['name'], 'value' => _t($sSet['title']));

        $aTemplates = array();
        $this->oDb->getTemplates(array('type' => 'all_visible_key_id'), $aTemplates, false);
        foreach($aTemplates as $aTemplate)
            $aForm['inputs']['template_id']['values'][] = array('key' => $aTemplate['id'], 'value' => _t($aTemplate['title']));

        switch($sAction){
            case 'add':
                unset($aForm['inputs']['id']);

                $aForm['form_attrs']['id'] .= 'create';
                break;

            case 'edit':
                $aForm['form_attrs']['id'] .= 'edit';
                $aForm['inputs']['set_title']['checker']['func'] = 'UniqueSet';

                if($aMenu['module'] != BX_DOL_STUDIO_MODULE_CUSTOM)
                    $aForm['inputs']['template_id']['type'] = 'hidden';

                $aForm['inputs']['controls'][0]['value'] = _t('_adm_nav_btn_menus_save');
                break;
        }

        return new BxTemplStudioFormView($aForm);
    }

    protected function updateSetFields(&$oForm)
    {
        if($oForm->getCleanValue('set_name') != $this->sCreateNew)
            unset($oForm->aInputs['set_title']['checker']);
        else
            unset($oForm->aInputs['set_title']['tr_attrs']['style']);
    }

    protected function _isDeletable(&$aRow)
    {
    	return (int)$aRow['deletable'] != 0;
    }

    protected function onMenuChanged($sObject)
    {
        bx_content_cache_del_by_prefix('menu_' . $sObject); 
        $this->oDb->cleanCache('sys_menus');
        $this->oDb->cleanCache('sys_menu_objects');
    }
}

/** @} */
