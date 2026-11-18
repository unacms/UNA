<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Developer Developer
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDevBuilderPage extends BxTemplStudioBuilderPage
{
    protected $sActionPageExport = 'page_export';

    protected $oModule;
    protected $aParams;

    function __construct($aParams)
    {
        parent::__construct(isset($aParams['type']) ? $aParams['type'] : '',  isset($aParams['page']) ? $aParams['page'] : '');

        $this->bPageMenuTitle = false;

        $this->aParams = $aParams;
        $this->sBaseUrl = $this->aParams['url'];
        $this->sTypeUrl = $this->sBaseUrl . '&bp_type=%s';
        $this->sPageUrl = $this->sTypeUrl . '&bp_page=%s';

        $this->oModule = BxDolModule::getInstance('bx_developer');

        // this builder keeps its actions in its own row under the caption (bp_block_panel_top.html of this module)
        $this->bBlockCaptionControls = false;

        $this->oModule->_oTemplate->addStudioCss(array('builder_page.css'));
    }

    function getPageCode($sPage = '', $bWrap = true)
    {
        return $this->oModule->_oTemplate->getJsCode('main') . parent::getPageCode($sPage, $bWrap);
    }

    function getBlockPanelTop($aBlock)
    {
         return BxBaseStudioWidget::getBlockPanelTop(
            array('panel_top' => $this->oModule->_oTemplate->parseHtmlByName('bp_block_panel_top.html', $this->_getTmplVarsBlockPanelTop()))
        );
    }

    protected function actionPageCreate()
    {
    	$sFormObject = $this->oModule->_oConfig->getObject('form_bp_page');
        $sFormDisplay = $this->oModule->_oConfig->getObject('form_display_bp_page_add');

        $oForm = BxDolForm::getObjectInstance($sFormObject, $sFormDisplay, $this->oModule->_oTemplate);
        $oForm->aFormAttrs['action'] = sprintf($this->sPageUrl, $this->sType, $this->sPage) . '&bp_action=' . $this->sActionPageCreate;
        $oForm->aInputs['module']['values'] = array_merge(array('' => _t('_bx_dev_bp_txt_select_module')), BxDolStudioUtils::getModules());

        $oForm->aInputs['layout_id']['values'] = array(
            array('key' => '', 'value' => _t('_bx_dev_bp_txt_page_layout_id_select'))
        );

        $aLayouts = array();
        $this->oDb->getLayouts(array('type' => 'all'), $aLayouts, false);
        foreach($aLayouts as $aLayout)
            $oForm->aInputs['layout_id']['values'][] = array('key' => $aLayout['id'], 'value' => _t($aLayout['title']));

        if(($sKey = 'config_api') && isset($oForm->aInputs[$sKey]))
            $oForm->aInputs[$sKey] = array_merge($oForm->aInputs[$sKey], [
                'code' => 1
            ]);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $sObject = $oForm->getCleanValue('object');
            $sModule = $oForm->getCleanValue('module');

            if(($iId = (int)$oForm->insert()) != 0)
                return array('eval' => $this->getPageJsObject() . '.onCreatePage(\'' . $sModule . '\', \'' . $sObject . '\')');
            else
                return array('msg' => _t('_bx_dev_bp_err_page_create'));
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->aHtmlIds['add_popup_id'], _t('_bx_dev_bp_txt_page_create_popup'), $this->oModule->_oTemplate->parseHtmlByName('bp_add_page.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true)
        )));

        return array('popup' => $sContent);
    }

    protected function actionPageExport()
    {
        $sContentInsert = $sContentDelete = "";

        $aPage = $this->oDb->getPages(array('type' => 'by_object', 'value' => $this->sPage));
        if(empty($aPage) || !is_array($aPage))
            return array();

        $sContentInsert .= ($this->oModule->_oDb->getQueryInsert('sys_objects_page', array($aPage), "Dumping data for '" . $aPage['object'] . "' page"));
        $sContentDelete .= ($this->oModule->_oDb->getQueryDelete('sys_objects_page', 'object', array($aPage), "Deleting data for '" . $aPage['object'] . "' page"));

        $aBlocks = array();
        $this->oDb->getBlocks(array('type' => 'by_object', 'value' => $aPage['object']), $aBlocks, false);
        $sContentInsert .= $this->oModule->_oDb->getQueryInsert('sys_pages_blocks', $aBlocks, false, array('id', 'name'));
        $sContentDelete .= $this->oModule->_oDb->getQueryDelete('sys_pages_blocks', 'object', array($aPage), false);

        $aForm = array(
            'form_attrs' => array(),
            'inputs' => array (
                'insert' => array(
                    'type' => 'textarea',
                    'name' => 'insert',
                    'caption' => _t('_bx_dev_bp_txt_page_export_insert'),
                    'value' => $sContentInsert,
                ),
                'delete' => array(
                    'type' => 'textarea',
                    'name' => 'delete',
                    'caption' => _t('_bx_dev_bp_txt_page_export_delete'),
                    'value' => $sContentDelete,
                ),
                'done' => array (
                    'type' => 'button',
                    'name' => 'done',
                    'value' => _t('_bx_dev_bp_btn_page_done'),
                    'attrs' => array(
                        'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()",
                    ),
                )
            )
        );
        $oForm = new BxTemplStudioFormView($aForm);

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox('bx-dev-bp-page-export-popup', _t('_bx_dev_bp_txt_page_export_popup', _t($aPage['title'])), $this->oModule->_oTemplate->parseHtmlByName('bp_export.html', array(
            'content' => $oForm->getCode()
        )));

        return array('popup' => $sContent);
    }

    protected function actionBlockEdit()
    {
    	$sFormObject = $this->oModule->_oConfig->getObject('form_bp_block');
        $sFormDisplay = $this->oModule->_oConfig->getObject('form_display_bp_block_edit');
        
        $iId = (int)bx_get('id');
        if(!$iId)
            return array();

        $aBlock = array();
        $this->oDb->getBlocks(array('type' => 'by_id', 'value' => $iId), $aBlock, false);
        if(empty($aBlock) || !is_array($aBlock))
            return array('msg' => _t('_bx_dev_bp_err_block_not_found'));

        $oForm = BxDolForm::getObjectInstance($sFormObject, $sFormDisplay, $this->oModule->_oTemplate);

        $this->onLoadBlock($oForm, $aBlock);

        $oForm->initChecker($aBlock);
        if($oForm->isSubmittedAndValid()) {
            $this->onSaveBlock($oForm, $aBlock);

            if($oForm->update($iId) !== false)
                return array('eval' => $this->getPageJsObject() . '.onEditBlock(oData)');
            else
                return array('msg' => _t('_bx_dev_bp_err_block_edit'));
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->aHtmlIds['edit_block_popup_id'], _t('_bx_dev_bp_txt_block_edit_popup', _t($aBlock['title'])), $this->oModule->_oTemplate->parseHtmlByName('bp_add_block.html', array(
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true)
        )));

        return array('popup' => $sContent);
    }

    protected function actionBlockDelete()
    {
        $sJsObject = $this->getPageJsObject();
        $iId = (int)bx_get('id');

        $aBlock = array();
        $this->oDb->getBlocks(array('type' => 'by_id', 'value' => $iId), $aBlock, false);
        if(empty($aBlock) || !is_array($aBlock))
            return array('msg' => _t('_bx_dev_bp_err_block_not_found'));

        if(!$this->oDb->deleteBlocks(array('type' => 'by_id', 'value' => $iId)))
            return array('msg' => _t('_bx_dev_bp_err_block_delete'));

        $this->onBlockDelete($aBlock);
        return array('eval' => $sJsObject . '.onDeleteBlock(' . $iId . ', oData)');
    }

    protected function getSettingsOptions($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-settings-seo',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => array(
                'object'  => array(
                    'type' => 'text',
                    'name' => 'object',
                    'caption' => _t('_bx_dev_bp_txt_page_object'),
                    'info' => '',
                    'value' => $this->aPageRebuild['object'],
                    'required' => '',
                    'attrs' => array(
                        'disabled' => 'disabled'
                    ),
                )
            )
        );

        $aForm['inputs'] += parent::getSettingsOptions($aPage, $bCreate, true);

        $aForm['inputs']['title_system']['type'] = 'text';
        $aForm['inputs']['title_system']['caption'] = _t('_bx_dev_bp_txt_page_title_system');
        $aForm['inputs']['title']['type'] = 'text';

        $aUri = array(
            'uri'  => array(
                'type' => 'text',
                'name' => 'uri',
                'caption' => _t('_bx_dev_bp_txt_page_uri'),
                'info' => '',
                'value' => $this->aPageRebuild['uri'],
                'required' => '',
                'db' => array (
                    'pass' => 'Xss',
                ),
            )
        );
        $aForm['inputs'] = bx_array_insert_before($aUri, $aForm['inputs'], 'url');

        $aForm['inputs']['url']['caption'] = _t('_bx_dev_bp_txt_page_url');
        $aForm['inputs']['url']['value'] = isset($aPage['url']) ? $aPage['url'] : '';
        $aForm['inputs']['url']['db'] = array (
            'pass' => 'Xss',
        );
        unset($aForm['inputs']['url']['attrs']['disabled']);

        $aConfigApi = array(
            'config_api'  => array(
                'type' => 'textarea',
                'name' => 'config_api',
                'caption' => _t('_bx_dev_bp_txt_page_config_api'),
                'info' => '',
                'value' => $this->aPageRebuild['config_api'],
                'required' => '',
                'code' => '1',
                'db' => array (
                    'pass' => 'XssHtml',
                ),
            )
        );
        $aForm['inputs'] = bx_array_insert_before($aConfigApi, $aForm['inputs'], 'sticky_columns');

        $aForm['inputs']['deletable'] = array(
            'type' => 'switcher',
            'name' => 'deletable',
            'caption' => _t('_bx_dev_bp_txt_page_deletable'),
            'info' => '',
            'value' => '1',
            'checked' => (int)$this->aPageRebuild['deletable'] == 1,
            'required' => '',
            'db' => array (
                'pass' => 'Int',
            )
        );
        $aForm['inputs']['override_class_name'] = array(
            'type' => 'text',
            'name' => 'override_class_name',
            'caption' => _t('_bx_dev_bp_txt_page_override_class_name'),
            'info' => '',
            'value' => $this->aPageRebuild['override_class_name'],
            'required' => '0',
            'db' => array (
                'pass' => 'Xss',
            )
        );
        $aForm['inputs']['override_class_file'] = array(
            'type' => 'text',
            'name' => 'override_class_file',
            'caption' => _t('_bx_dev_bp_txt_page_override_class_file'),
            'info' => '',
            'value' => $this->aPageRebuild['override_class_file'],
            'required' => '0',
            'db' => array (
                'pass' => 'Xss',
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsCache($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-settings-cache',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => parent::getSettingsCache($aPage, $bCreate, true)
        );

        unset($aForm['inputs']['cache_lifetime']['attrs']);

        $aForm['inputs']['cache_editable'] = array(
            'type' => 'switcher',
            'name' => 'cache_editable',
            'caption' => _t('_bx_dev_bp_txt_page_cache_editable'),
            'info' => '',
            'value' => '1',
            'checked' => (int)$this->aPageRebuild['cache_editable'] == 1,
            'required' => '',
            'db' => array (
                'pass' => 'Int',
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getBlockModule($aBlock)
    {
        return $aBlock['module'] != BX_DOL_STUDIO_BP_SKELETONS ? $aBlock['module'] : $this->aPageRebuild['module'];
    }

    protected function getBlockContent($aBlock)
    {
        $aFields = array();

        switch($aBlock['type']) {
            case BX_DOL_STUDIO_BP_BLOCK_SERVICE:
                $aFields = array(
                    'content' => array(
                        'type' => 'textarea',
                        'name' => 'content',
                        'caption' => _t('_bx_dev_bp_txt_block_content_service'),
                        'info' => '',
                        'value' => $aBlock['content'],
                        'required' => '0',
                        'db' => array (
                            'pass' => 'Xss',
                        ),
                    )
                );
                break;

            case BX_DOL_STUDIO_BP_BLOCK_LANG:
                $aFields = array(
                    'content' => array(
                        'type' => 'text',
                        'name' => 'content',
                        'caption' => _t('_bx_dev_bp_txt_block_content_lang'),
                        'info' => _t('_bx_dev_bp_dsc_block_content_lang'),
                        'value' => $aBlock['content'],
                        'required' => '0',
                        'db' => array (
                            'pass' => 'Xss',
                        ),
                    ),
                );
                break;

            default:
                $aFields = parent::getBlockContent($aBlock);
                break;
        }

        return $aFields;
    }

    protected function getBlocks($sModule)
    {
        $aBlocks = parent::getBlocks($sModule);

        if($sModule == BX_DOL_STUDIO_BP_SKELETONS) {
            $aBlock = array();
            $this->oDb->getBlocks(array('type' => 'skeleton_by_type', 'value' => 'service'), $aBlock, false);
            if(!empty($aBlock) && is_array($aBlock))
                $aBlocks[] = $aBlock;
        }

        return $aBlocks;
    }

    protected function onLoadBlock(&$oForm, &$aBlock)
    {
        $oForm->aFormAttrs['action'] = sprintf($this->sPageUrl, $this->sType, $this->sPage) . '&bp_action=' . $this->sActionBlockEdit;
        $oForm->aInputs['module']['values'] = array_merge(array('' => _t('_bx_dev_bp_txt_select_module')), BxDolStudioUtils::getModules());

        if(($sKey = 'icon') && isset($oForm->aInputs[$sKey]))
            $oForm->aInputs[$sKey] = array_merge($oForm->aInputs[$sKey], [
                'code' => 1
            ]);

        $aDBoxes = array();
        $this->oDb->getDesignBoxes(array('type' => 'ordered'), $aDBoxes, false);
        foreach($aDBoxes as $aDBox)
            $oForm->aInputs['designbox_id']['values'][] = array('key' => $this->sSelectKeyPrefix . $aDBox['id'], 'value' => _t($aDBox['title']));

        $oForm->aInputs['class']['value'] = $aBlock['class'];

        $aContentPlaceholders = $this->oDb->getContentPlaceholders();
        $oForm->aInputs['async']['values'] = array(
            array('key' => 0, 'value' => _t('_sys_no_async'))
        );
        foreach ($aContentPlaceholders as $iKey => $sTitle)
            $oForm->aInputs['async']['values'][] = array('key' => $iKey, 'value' => _t($sTitle));

        $oForm->aInputs['hidden_on']['values'] = array(
            BX_DB_HIDDEN_PHONE => _t('_bx_dev_bp_txt_block_hidden_on_phone'),
            BX_DB_HIDDEN_TABLET => _t('_bx_dev_bp_txt_block_hidden_on_tablet'),
            BX_DB_HIDDEN_DESKTOP => _t('_bx_dev_bp_txt_block_hidden_on_desktop'),
            BX_DB_HIDDEN_MOBILE => _t('_bx_dev_bp_txt_block_hidden_on_mobile')
        );

        $aSubmenus = $this->oDb->getBlockSubmenus();
        $oForm->aInputs['submenu']['values'] = array(
            array('key' => '', 'value' => _t('_sys_no_menu'))
        );
        foreach ($aSubmenus as $sObject => $sTitle)
            $oForm->aInputs['submenu']['values'][] = array('key' => $sObject, 'value' => _t($sTitle));

        $oForm->aInputs['visible_for']['value'] = $aBlock['visible_for_levels'] == BX_DOL_INT_MAX ? BX_DOL_STUDIO_VISIBLE_ALL : BX_DOL_STUDIO_VISIBLE_SELECTED;
        $oForm->aInputs['visible_for']['values'] = array(
            array('key' => BX_DOL_STUDIO_VISIBLE_ALL, 'value' => _t('_bx_dev_bp_txt_block_visible_for_all')),
            array('key' => BX_DOL_STUDIO_VISIBLE_SELECTED, 'value' => _t('_bx_dev_bp_txt_block_visible_for_selected')),
        );
        $oForm->aInputs['visible_for']['attrs']['onchange'] = $this->getPageJsObject() . '.onChangeVisibleFor(this)';

        $oForm->aInputs['visible_for_levels']['tr_attrs']['style'] = $aBlock['visible_for_levels'] == BX_DOL_INT_MAX ? 'display:none' : '';
        BxDolStudioUtils::getVisibilityValues($aBlock['visible_for_levels'], $oForm->aInputs['visible_for_levels']['values'], $oForm->aInputs['visible_for_levels']['value']);
        $aBlock['visible_for_levels'] = $oForm->aInputs['visible_for_levels']['value'];

        $oForm->aInputs = $this->addInArray($oForm->aInputs, 'visible_for_levels', $this->getBlockContent($aBlock));

        if(($sKey = 'config_api') && isset($oForm->aInputs[$sKey]))
            $oForm->aInputs[$sKey] = array_merge($oForm->aInputs[$sKey], [
                'code' => 1
            ]);

        $oForm->aInputs['controls'][0]['value'] = _t('_bx_dev_bp_btn_block_save');
        $oForm->aInputs['controls'][2]['attrs']['onclick'] = $this->getPageJsObject() . ".deleteBlock(" . $aBlock['id'] . ")";

        if($aBlock['type'] == BX_DOL_STUDIO_BP_BLOCK_SERVICE)
            $aBlock['content'] = BxDevFunctions::unserializeString($aBlock['content']);

        $aBlock['designbox_id'] = $this->sSelectKeyPrefix . $aBlock['designbox_id'];
    }

    protected function onSavePage(&$oForm, &$aPage) 
    {
        if(($sConfigApi = $oForm->getCleanValue('config_api')) && !$this->oModule->isValidJson($sConfigApi))
            BxDolForm::setSubmittedValue('config_api', '', $oForm->aFormAttrs['method']);
    }

    protected function onSaveBlock(&$oForm, &$aBlock)
    {
        parent::onSaveBlock($oForm, $aBlock);

        if($aBlock['type'] == BX_DOL_STUDIO_BP_BLOCK_SERVICE && isset($oForm->aInputs['content']))
            $this->onSaveBlockService($oForm, $aBlock);

        if(($sConfigApi = $oForm->getCleanValue('config_api')) && !$this->oModule->isValidJson($sConfigApi))
            BxDolForm::setSubmittedValue('config_api', '', $oForm->aFormAttrs['method']);
    }

    protected function onSaveBlockLang(&$oForm, &$aBlock)
    {
        $sValue = $oForm->getCleanValue('content');
        BxDolForm::setSubmittedValue('content', $sValue, $oForm->aFormAttrs['method']);
    }

    protected function onSaveBlockService(&$oForm, &$aBlock)
    {
        $sValue = $oForm->getCleanValue('content');
        $sValue = BxDevFunctions::serializeString($sValue);
        BxDolForm::setSubmittedValue('content', $sValue, $oForm->aFormAttrs['method']);
    }

    protected function _getPageEditForm()
    {
        $oForm = parent::_getPageEditForm();
        $oForm->addCssJsCodeMirror();

        return $oForm;
    }

    protected function _getTmplVarsBlockPanelTop()
    {
        $aResult = parent::_getTmplVarsBlockPanelTop();

        $aResult['bx_if:show_actions_global'] = [
            'condition' => $this->sPage == '' || empty($this->aPageRebuild),
            'content' => [
                'js_object' => $this->oModule->_oConfig->getJsObject('main'),
                'action_page_import' => 'import',
                'action_page_export' => 'export'
            ]
        ];

        return $aResult;
    }

    protected function _getTmplVarsBlockPanelTopActions()
    {
        $sJsObject = $this->getPageJsObject();

        $oPermalinks = BxDolPermalinks::getInstance();

        return array(
            'js_object' => $sJsObject,
            'url_view' => bx_absolute_url($oPermalinks->permalink($this->aPageRebuild['url'])),
            'action_page_export' => $this->sActionPageExport,
            'action_page_edit' => $this->sActionPageEdit,
            'action_block_create' => $this->sActionBlockCreate,
        );
    }
}

/** @} */
