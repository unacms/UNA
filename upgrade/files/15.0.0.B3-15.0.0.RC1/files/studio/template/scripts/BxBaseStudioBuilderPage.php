<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

define('BX_DOL_STUDIO_BUILDER_PAGE', 1);

class BxBaseStudioBuilderPage extends BxDolStudioBuilderPage
{
    protected $sParamsDivider = '#';
    protected $sSelectKeyPrefix = 'id-';

    protected $sActionPageCreate = 'page_create';
    protected $sActionPageDelete = 'page_delete';
    protected $sActionPageEdit = 'page_edit';
    protected $sActionBlockCreate = 'block_create';
    protected $sActionBlockEdit = 'block_edit';

    protected $sStorage;
    protected $sTranscoder;
    protected $aUploaders; 
    
    protected $sTranscoderCover;
    protected $aUploadersCover;

    protected $sBaseUrl;
    protected $sTypeUrl;
    protected $sPageUrl;

    protected $aHtmlIds = array(
        'add_popup_id' => 'adm-bp-add-popup',
        'edit_popup_id' => 'adm-bp-edit-popup',
        'uri_field_id' => 'adm-bp-field-uri',
    	'url_field_id' => 'adm-bp-field-url',
        'settings_group_id' => 'adm-bp-settings-group-',
        'settings_groups_id' => 'adm-bp-settings-groups',
        'create_block_popup_id' => 'adm-bp-create-block-popup',
        'edit_block_popup_id' => 'adm-bp-edit-block-popup',
    	'edit_block_editor_id' => 'adm-bp-edit-block-editor',
        'edit_block_builder_id' => 'adm-bp-edit-block-builder',
        'block_id' => 'adm-bpb-',
        'block_list_id' => 'adm-bpl-',
        'block_lists_id' => 'adm-bp-block-lists',
        'layout_id' => 'adm-bpl-',
    );

    protected $aPageSettings = array(
        array('name' => 'options', 'title' => '_adm_bp_mi_page_options', 'active' => 1),
        array('name' => 'cover', 'title' => '_adm_bp_mi_page_cover', 'active' => 0),
        array('name' => 'layout', 'title' => '_adm_bp_mi_page_layout', 'active' => 0),
        array('name' => 'visibility', 'title' => '_adm_bp_mi_page_visibility', 'active' => 0),
        array('name' => 'cache', 'title' => '_adm_bp_mi_page_cache', 'active' => 0),
        array('name' => 'seo', 'title' => '_adm_bp_mi_page_seo', 'active' => 0),
        array('name' => 'injections', 'title' => '_adm_bp_mi_page_injections', 'active' => 0)
    );

    function __construct($sType = '', $sPage = '')
    {
        parent::__construct($sType, $sPage);

        $this->sStorage = BX_DOL_STORAGE_OBJ_IMAGES;
        $this->sTranscoder = 'sys_builder_page_preview';
        $this->aUploaders = array('sys_builder_page_html5');

        $this->sTranscoderCover = 'sys_cover_preview';
        $this->aUploadersCover = array('sys_std_crop_cover');

        $this->sBaseUrl = BX_DOL_URL_STUDIO . 'builder_page.php';
        $this->sTypeUrl = $this->sBaseUrl . '?type=%s';
        $this->sPageUrl = $this->sTypeUrl . '&page=%s';
    }

    function getPageCss()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();
    	$aUploaders = array_merge($this->aUploaders, $this->aUploadersCover);
        foreach($aUploaders as $sUploader) {
            $oUploader = BxDolUploader::getObjectInstance($sUploader, $this->sStorage, '', $oTemplate);
            if($oUploader)
                $oUploader->addCssJs();
        }

        return array_merge(parent::getPageCss(), [
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'codemirror/|codemirror.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'grapesjs/|grapes.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'select2/css/|select2.min.css',
            'page_layouts.css', 
            'builder_page.css'
        ]);
    }

    function getPageJs()
    {
        return array_merge(parent::getPageJs(), [
            'codemirror/codemirror.min.js',
            'grapesjs/grapes.min.js',
            'grapesjs/grapesjs-blocks-basic.js',
            'grapesjs/grapesjs-style-bg.js',
            'grapesjs/grapesjs-preset-webpage.min.js',
            'select2/js/select2.min.js',
            'jquery-ui/jquery-ui.min.js',
            'jquery.ui.touch-punch.min.js',
            'jquery.easing.js',
            'jquery.form.min.js',
            'functions.js',
            'builder_page.js'
        ]);
    }

    function getPageJsObject()
    {
        return 'oBxDolStudioBuilderPage';
    }

    function getPageMenu($aMenu = [], $aMarkers = [])
    {
        $aMenuItems = [
            BX_DOL_STUDIO_BP_TYPE_SYSTEM => ['icon' => 'mi-bp-system.svg'],
            BX_DOL_STUDIO_BP_TYPE_CUSTOM => ['icon' => 'mi-bp-custom.svg'],
            BX_DOL_STUDIO_BP_TYPE_MODULES => ['icon' => 'mi-bp-modules.svg']
        ];

        $aMenu = [];
        foreach($aMenuItems as $sMenuItem => $aItem)
            $aMenu[] = [
                'name' => $sMenuItem,
                'icon' => $aItem['icon'],
                'icon_bg' => true,
                'link' => sprintf($this->sTypeUrl, $sMenuItem),
                'title' => _t('_adm_bp_cpt_type_' . $sMenuItem),
                'selected' => $sMenuItem == $this->sType || ($sMenuItem == BX_DOL_STUDIO_BP_TYPE_MODULES && !isset($aMenuItems[$this->sType]))
            ];

        return parent::getPageMenu($aMenu);
    }

    function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;

        $oPage = BxTemplPage::getObjectInstance($this->sPage);

        $oTemplate = BxDolStudioTemplate::getInstance();
        $sJsObject = $this->getPageJsObject();
        $sTxtEmpty = _t('_sys_txt_empty');

        $sContent = "";
        if(($bPage = $this->sPage != '') === true) {
            /**
             * Reset (move to hidden sell) blocks which cannot be seen, 
             * because of unsuitable cell number to currently selected layout.
             */
            $this->oDb->resetBlocksByPage($this->aPageRebuild['object'], $this->aPageRebuild['layout_cells_number']);

            $aTmplVars = array(
                'page_id' => 'bx-page-' . $this->aPageRebuild['uri'],
                'bx_if:show_layout_row_dump' => array(
                    'condition' => true,
                    'content' => array()
                )
            );
            for($i = 0; $i <= $this->aPageRebuild['layout_cells_number']; $i++) {
                $aBlocks = array();
                $this->oDb->getBlocks(array('type' => 'by_object_cell', 'object' => $this->aPageRebuild['object'], 'cell' => $i), $aBlocks, false);

                $aTmplVarsCell = array('id' => $i, 'bx_repeat:blocks' => array());
                foreach($aBlocks as $aBlock) {
                    $sTitle = strip_tags(!empty($aBlock['title_system']) ? _t($aBlock['title_system']) : $oPage->getBlockTitle($aBlock));
                    list($sIcon, $sIconUrl) = $this->getBlockIcon($aBlock);

                    $aTmplVarsCell['bx_repeat:blocks'][] = array(
                        'html_id' => $this->aHtmlIds['block_id'] . $aBlock['id'],
                        'bx_if:is_inactive' => array(
                            'condition' => (int)$aBlock['active'] == 0,
                            'content' => array()
                        ),
                        'bx_if:show_link' => array(
                            'condition' => true,
                            'content' => array(
                                'onclick' => $sJsObject . ".performAction('block_edit', {id: " . $aBlock['id'] . "})",
                                'title' => !empty($sTitle) ? $sTitle : $sTxtEmpty,
                            )
                        ),
                        'bx_if:show_text' => array(
                            'condition' => false,
                            'content' => array()
                        ),
                        'bx_if:show_api' => [
                            'condition' => (int)$aBlock['active_api'] != 0,
                            'content' => []
                        ],
                        'bx_if:image' => array (
                            'condition' => (bool)$sIconUrl,
                            'content' => array('icon_url' => $sIconUrl),
                        ),
                        'bx_if:icon' => array (
                            'condition' => (bool)$sIcon,
                            'content' => array('icon' => $sIcon),
                        ),
                        'module' => $this->getModuleTitle($aBlock['module']),
                        'visible_for' => _t('_adm_bp_txt_visible_for', BxDolStudioUtils::getVisibilityTitle($aBlock['visible_for_levels'])),
                        'bx_if:show_checkbox' => array(
                            'condition' => false,
                            'content' => array()
                        ),
                        'bx_if:show_drag_handle' => array(
                            'condition' => true,
                            'content' => array()
                        )
                    );
                }

                $sCell = $oTemplate->parseHtmlByName('bp_cell.html', $aTmplVarsCell);
                if($i == 0)
                    $aTmplVars['bx_if:show_layout_row_dump']['content']['cell_' . $i] = $sCell;
                else
                    $aTmplVars['cell_' . $i] = $sCell;
            }

            $sContent = $oTemplate->parseHtmlByName($this->aPageRebuild['layout_template'], $aTmplVars);
        }

        $aLanguages = BxDolStudioLanguagesUtils::getInstance()->getLanguages();

        $aTmplVars = array(
            'js_object' => $sJsObject,
            'action_url' => $this->sBaseUrl,
            'page_url' => sprintf($this->sPageUrl, '{0}', '{1}'),
            'type' => $this->sType,
            'page' => $this->sPage,
            'html_ids' => json_encode($this->aHtmlIds),
            'languages' => json_encode($aLanguages),
            'content' => $this->getBlockCode(array(
                'items' => $sContent
            ))
        );

        $oTemplate->addJsTranslation([
            '_sys_not_available',
            '_adm_bp_wrn_page_delete',
            '_adm_bp_wrn_page_block_delete'
        ]);
        return $sResult . $oTemplate->parseHtmlByName('builder_page.html', $aTmplVars);
    }

    function getBlockPanelTop($aBlock)
    {
        return parent::getBlockPanelTop(
            array('panel_top' => BxDolStudioTemplate::getInstance()->parseHtmlByName('bp_block_panel_top.html', $this->_getTmplVarsBlockPanelTop()))
        );
    }

    protected function actionPageCreate()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sModule = BX_DOL_STUDIO_MODULE_CUSTOM;        

        $oForm = $this->_getPageCreateForm();
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            unset($oForm->aInputs['settings']);
            foreach($this->aPageSettings as $aSetting)
                $oForm->aInputs = array_merge($oForm->aInputs, $this->{'getSettings' . $this->getClassName($aSetting['name']) . 'Fields'}());

            $sLanguage = BxDolStudioLanguagesUtils::getInstance()->getCurrentLangName(false);

            $sObject = BxDolForm::getSubmittedValue('title-' . $sLanguage, $oForm->aFormAttrs['method']);
            $sObject = uriGenerate($sObject, 'sys_objects_page', 'object', ['empty' => 'object']);

            $sUri = $oForm->getCleanValue('uri');
            
            $aPage = $this->oDb->getPages(['type' => 'by_uri', 'value' => $sUri]);
            if(!empty($aPage) && is_array($aPage)) 
            	return ['msg' => _t('_adm_bp_err_page_uri')];

            $iVisibleFor = BxDolStudioUtils::getVisibilityValue($oForm->getCleanValue('visible_for'), $oForm->getCleanValue('visible_for_levels'));
            BxDolForm::setSubmittedValue('visible_for_levels', $iVisibleFor, $oForm->aFormAttrs['method']);
            unset($oForm->aInputs['visible_for']);

            $aValsToAdd = [
                'author' => bx_get_logged_profile_id(), 
                'object' => $sObject, 
                'url' => $this->sPageBaseUrl . $sUri, 
                'added' => time()
            ];

            $this->onSavePage($oForm, $aValsToAdd);

            $iId = (int)$oForm->insert($aValsToAdd);
            if($iId != 0) {
                $this->onPageChanged($oForm, $aValsToAdd);
                return ['eval' => $sJsObject . '.onCreatePage(\'' . $sModule . '\', \'' . $sObject . '\')'];
            } else {
                return ['msg' => _t('_adm_bp_err_page_create')];
            }
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->aHtmlIds['add_popup_id'], _t('_adm_bp_txt_create_popup'), $oTemplate->parseHtmlByName('bp_add_page.html', array(
            'js_object' => $sJsObject,
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true)
        )));

        return array('popup' => $sContent);
    }

    protected function actionPageEdit()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $oForm = $this->_getPageEditForm();
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            unset($oForm->aInputs['settings']);
            foreach($this->aPageSettings as $aSetting)
                $oForm->aInputs = array_merge($oForm->aInputs, $this->{'getSettings' . $this->getClassName($aSetting['name']) . 'Fields'}($this->aPageRebuild, false));

            $mixedVisibleFor = $oForm->getCleanValue('visible_for');
            $mixedVisibleForLevels = $oForm->getCleanValue('visible_for_levels');
            if($mixedVisibleFor !== false && $mixedVisibleForLevels !== false) {
                $iVisibleFor = BxDolStudioUtils::getVisibilityValue($mixedVisibleFor, $mixedVisibleForLevels);
                BxDolForm::setSubmittedValue('visible_for_levels', $iVisibleFor, $oForm->aFormAttrs['method']);
                unset($oForm->aInputs['visible_for']);
            }

            $this->onSavePage($oForm, $this->aPageRebuild);

            if($oForm->update($this->aPageRebuild['id'])) {
                $this->onPageChanged($oForm, $this->aPageRebuild);
                $iLevelId = $oForm->getCleanValue('layout_id');
                if(!empty($iLevelId) && $iLevelId != $this->aPageRebuild['layout_id']) {
                    $aLayoutOld = array();
                    $this->oDb->getLayouts(array('type' => 'by_id', 'value' => $this->aPageRebuild['layout_id']), $aLayoutOld, false);

                    $aLayoutNew = array();
                    $this->oDb->getLayouts(array('type' => 'by_id', 'value' => $iLevelId), $aLayoutNew, false);

                    if($aLayoutOld['cells_number'] > $aLayoutNew['cells_number'] && $this->oDb->resetBlocksByPage($this->sPage, $aLayoutNew['cells_number']) === false)
                        return array('msg' => _t('_adm_bp_err_save'));

                    return array('eval' => $sJsObject . '.onSaveSettingsLayout()');
                }

                return array();
            } 
            else
                return array('msg' => _t('_adm_bp_err_save'));
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->aHtmlIds['edit_popup_id'], _t('_adm_bp_txt_settings_popup'), $oTemplate->parseHtmlByName('bp_edit_page.html', array(
            'js_object' => $sJsObject,
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true)
        )));

        return array('popup' => $sContent);
    }

    protected function actionPageDelete()
    {
        if(empty($this->sPage) || empty($this->aPageRebuild) || !is_array($this->aPageRebuild))
            return array('msg' => _t('_adm_bp_err_page_delete'));

        $oLangauge = BxDolStudioLanguagesUtils::getInstance();
        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);

        $aBlocks = array();
        $this->oDb->getBlocks(array('type' => 'by_object', 'value' => $this->sPage), $aBlocks, false);
        if(is_array($aBlocks) && !empty($aBlocks)) {
            foreach($aBlocks as $aBlock)
                $this->onBlockDelete($aBlock);

            $this->oDb->deleteBlocks(array('type' => 'by_object', 'value' => $this->sPage));
        }

        if($this->oDb->deletePages(array('type' => 'by_object', 'value' => $this->sPage))) {
            $oLangauge->deleteLanguageString($this->aPageRebuild['title_system']);
            $oLangauge->deleteLanguageString($this->aPageRebuild['title']);
            $this->onPageChanged(null, $this->aPageRebuild);
            return array('eval' => 'window.parent.location.href = "' . sprintf($this->sTypeUrl, $this->sType) . '";');
        }

        return array('msg' => _t('_adm_bp_err_page_delete'));
    }

    protected function actionBlockList()
    {
        $sModule = BX_DOL_STUDIO_BP_TYPE_DEFAULT;
        if(bx_get('bp_module') !== false)
            $sModule = bx_process_input(bx_get('bp_module'));

        return array(
            'content' => $this->getBlockList($sModule)
        );
    }

    protected function actionBlockCreate()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sSelected = BX_DOL_STUDIO_BP_SKELETONS;

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-block-create',
                'action' => sprintf($this->sPageUrl, $this->sType, $this->sPage) .  '&bp_action=' . $this->sActionBlockCreate,
                'method' => 'post'
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_pages_blocks',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
            ),
            'inputs' => array (
                'blocks' => array(
                    'type' => 'custom',
                    'name' => 'blocks',
                    'content' => '',
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
            )
        );

        $aMenu = [
            BX_DOL_STUDIO_BP_SKELETONS => [
                'name' => BX_DOL_STUDIO_BP_SKELETONS,
                'icon' => 'mi-qrcode.svg',
                'icon_bg' => true,
                'title' => '_sys_block_types_skeletons',
                'selected' => $sSelected == BX_DOL_STUDIO_BP_SKELETONS,
            ],
            BX_DOL_STUDIO_MODULE_SYSTEM => [
                'name' => BX_DOL_STUDIO_MODULE_SYSTEM,
                'icon' => 'mi-cog.svg',
                'icon_bg' => true,
                'title' => '_sys_block_types_system',
                'selected' => $sSelected == BX_DOL_STUDIO_MODULE_SYSTEM,
            ],
            BX_DOL_STUDIO_MODULE_CUSTOM => [
                'name' => BX_DOL_STUDIO_MODULE_CUSTOM,
                'icon' => 'mi-wrench.svg',
                'icon_bg' => true,
                'title' => '_sys_block_types_custom',
                'selected' => $sSelected == BX_DOL_STUDIO_MODULE_CUSTOM,
            ]
        ];

        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'type', 'value' => [BX_DOL_MODULE_TYPE_MODULE, BX_DOL_MODULE_TYPE_TEMPLATE]]);
        $aModulesWithBlocks = $this->oDb->getModulesWithCopyableBlocks();
        foreach($aModules as $aModule) {
            $sName = $aModule['name'];
            if(!in_array($sName, $aModulesWithBlocks))
                continue;

            if(!empty($aMenu[$sName]))
                $aMenu[$sName] = array_merge($aMenu[$sName], $aModule);
            else
                $aMenu[$sName] = $aModule;

            if(empty($aMenu[$sName]['icon']))
                $aMenu[$sName]['icon'] = BxDolStudioUtils::getModuleIcon($aModule, 'menu', false); 
        }

        foreach($aMenu as $sKey => $aItem)
            $aMenu[$sKey]['onclick'] =  $sJsObject . '.onChangeModule(\'' . $aItem['name'] . '\', this);';

        $oMenu = new BxTemplStudioMenu(['template' => 'menu_side.html', 'menu_items' => $aMenu]);

        $aForm['inputs']['blocks']['content'] = $oTemplate->parseHtmlByName('bp_add_block_form.html', [
            'menu' => $oMenu->getCode(),
            'html_block_lists_id' => $this->aHtmlIds['block_lists_id'],
            'blocks' => $this->getBlockList($sSelected)
        ]);

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $aIds = $oForm->getCleanValue('blocks');

            $aBlocks = array();
            $this->oDb->getBlocks(array('type' => 'by_ids', 'value' => $aIds), $aBlocks, false);

            $oLanguage = BxDolStudioLanguagesUtils::getInstance();
            $oStorege = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);

            $bResult = true;
            foreach($aBlocks as $aBlock) {
            	$sModule = $aBlock['module'];
                $sTitleKey = $this->getSystemName($aBlock['title'] . '_' . time());
                $aTitleValues = $oLanguage->getLanguageString($aBlock['title']);

                unset($aBlock['id']);
                $aBlock['object'] = $this->sPage;
                $aBlock['cell_id'] = 1;
                $aBlock['module'] = $this->getBlockModule($aBlock);
                $aBlock['title'] = $sTitleKey;
                $aBlock['copyable'] = $sModule == BX_DOL_STUDIO_BP_SKELETONS ? 1 : 0;
                $aBlock['deletable'] = 1;

                //--- Process Lang copy
                $sContentKey = $sContentValue = "";
                if($aBlock['type'] == BX_DOL_STUDIO_BP_BLOCK_LANG && $aBlock['content'] != '') {
                    $sContentKey = $this->getSystemName($aBlock['content'] . '_' . time());
                    $sContentValue = _t($aBlock['content']);

                    $aBlock['content'] = $sContentKey;
                    $oLanguage->addLanguageString($sContentKey, $sContentValue);
                }

                //--- Process Image copy
                $iImageId = $sImageAlign = "";
                if($aBlock['type'] == BX_DOL_STUDIO_BP_BLOCK_IMAGE && $aBlock['content'] != '') {
                    list($iImageId, $sImageAlign) = explode($this->sParamsDivider, $aBlock['content']);

                    $aBlock['content'] = "";
                    if(is_numeric($iImageId) && (int)$iImageId != 0 && ($iImageId = $oStorege->storeFileFromStorage(array('id' => $iImageId))) !== false)
                        $aBlock['content'] = implode($this->sParamsDivider, array($iImageId, $sImageAlign));
                }

                // add indexing data
                $aBlock = array_merge($aBlock, $this->getIndexingDataForBlock($aBlock['type'], $aBlock['content']));

                if(!$this->oDb->insertBlock($aBlock)) {
                    if($sContentKey != "")
                        $oLanguage->deleteLanguageString($sContentKey);

                    if($iImageId != "")
                        $oStorege->deleteFile((int)$iImageId, 0);

                    $bResult = false;
                    break;
                }

                //--- Process Title copy
                foreach($aTitleValues as $iLangId => $aTitleValue)
                	$oLanguage->addLanguageString($sTitleKey, $aTitleValue['string'], $iLangId);
            }

            if($bResult)
                return array('eval' => $sJsObject . '.onCreateBlock(oData)');
            else
                return array('msg' => _t('_adm_bp_err_block_added'));
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->aHtmlIds['create_block_popup_id'], _t('_adm_bp_txt_new_block_popup'), $oTemplate->parseHtmlByName('bp_add_block.html', array(
        	'action' => 'create',
            'form_id' => $aForm['form_attrs']['id'],
            'form' => $oForm->getCode(true)
        )));

        return array('popup' => $sContent);
    }

    protected function actionBlockEdit()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $iId = (int)bx_get('id');
        if(!$iId)
            return array();

        $aBlock = array();
        $this->oDb->getBlocks(array('type' => 'by_id', 'value' => $iId), $aBlock, false);
        if(empty($aBlock) || !is_array($aBlock))
            return array('msg' => _t('_adm_bp_err_block_not_found'));

        bx_import('BxDolStudioUtils');
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-block-edit',
                'action' => sprintf($this->sPageUrl, $this->sType, $this->sPage) . '&bp_action=' . $this->sActionBlockEdit,
                'method' => 'post'
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_pages_blocks',
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
                    'value' => $iId,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_bp_txt_block_title'),
                    'info' => _t('_adm_bp_dsc_block_title'),
                    'value' => $aBlock['title'],
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'LengthTranslatable',
                        'params' => array(3, 100, 'title'),
                        'error' => _t('_adm_bp_err_block_title'),
                    ),
                ),
                'description' => array(
                    'type' => 'text_translatable',
                    'name' => 'description',
                    'caption' => _t('_adm_bp_txt_block_description'),
                    'info' => _t('_adm_bp_dsc_block_description'),
                    'value' => $aBlock['description'],
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'icon' => array(
                    'type' => 'textarea',
                    'name' => 'icon',
                    'caption' => _t('_adm_bp_txt_block_icon'),
                    'info' => _t('_adm_bp_dsc_block_icon'),
                    'value' => $aBlock['icon'],
                    'code' => 1,
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'attrs' => array('class' => 'bx-form-input-textarea-small'),
                ),
                'designbox_id' => array(
                    'type' => 'select',
                    'name' => 'designbox_id',
                    'caption' => _t('_adm_bp_txt_block_designbox'),
                    'info' => '',
                    'value' => $this->sSelectKeyPrefix . $aBlock['designbox_id'],
                    'values' => array(
                        array('key' => '', 'value' => _t('_adm_bp_txt_block_designbox_empty')),
                    ),
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'avail',
                        'params' => array(),
                        'error' => _t('_adm_bp_err_block_designbox'),
                    ),
                ),
                'async' => array(
                    'type' => 'select',
                    'name' => 'async',
                    'caption' => _t('_adm_bp_txt_block_async'),
                    'info' => '',
                    'value' => isset($aBlock['async']) ? $aBlock['async'] : 0,
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'submenu' => array(
                    'type' => 'select',
                    'name' => 'submenu',
                    'caption' => _t('_adm_bp_txt_block_submenu'),
                    'info' => '',
                    'value' => isset($aBlock['submenu']) ? $aBlock['submenu'] : '',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'tabs' => array(
                    'type' => 'switcher',
                    'name' => 'tabs',
                    'caption' => _t('_adm_bp_txt_block_tabs'),
                    'info' => '',
                    'value' => '1',
                    'checked' => $aBlock['tabs'] == '1',
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'hidden_on' => array(
                    'type' => 'select_multiple',
                    'name' => 'hidden_on',
                    'caption' => _t('_adm_bp_txt_block_hidden_on'),
                    'info' => '',
                    'value' => (int)$aBlock['hidden_on'],
                    'values' => array(
                        BX_DB_HIDDEN_PHONE => _t('_adm_bp_txt_block_hidden_on_phone'),
                        BX_DB_HIDDEN_TABLET => _t('_adm_bp_txt_block_hidden_on_tablet'),
                        BX_DB_HIDDEN_DESKTOP => _t('_adm_bp_txt_block_hidden_on_desktop'),
                        BX_DB_HIDDEN_MOBILE => _t('_adm_bp_txt_block_hidden_on_mobile')
                    ),
                    'db' => array (
                        'pass' => 'Set',
                    )
                ),
                'visible_for' => array(
                    'type' => 'select',
                    'name' => 'visible_for',
                    'caption' => _t('_adm_bp_txt_block_visible_for'),
                    'info' => '',
                    'value' => $aBlock['visible_for_levels'] == BX_DOL_INT_MAX ? BX_DOL_STUDIO_VISIBLE_ALL : BX_DOL_STUDIO_VISIBLE_SELECTED,
                    'values' => array(
                        array('key' => BX_DOL_STUDIO_VISIBLE_ALL, 'value' => _t('_adm_bp_txt_block_visible_for_all')),
                        array('key' => BX_DOL_STUDIO_VISIBLE_SELECTED, 'value' => _t('_adm_bp_txt_block_visible_for_selected')),
                    ),
                    'required' => '0',
                    'attrs' => array(
                        'onchange' => $sJsObject . '.onChangeVisibleFor(this)'
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'visible_for_levels' => array(
                    'type' => 'checkbox_set',
                    'name' => 'visible_for_levels',
                    'caption' => _t('_adm_bp_txt_block_visible_for_levels'),
                    'info' => _t('_adm_bp_dsc_block_visible_for_levels'),
                    'value' => array(),
                    'values' => array(),
                    'tr_attrs' => array(
                        'style' => $aBlock['visible_for_levels'] == BX_DOL_INT_MAX ? 'display:none' : ''
                    ),
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'content_empty' => array(
                    'type' => 'text_translatable',
                    'name' => 'content_empty',
                    'caption' => _t('_adm_bp_txt_block_content_empty'),
                    'info' => _t('_adm_bp_dsc_block_content_empty'),
                    'value' => $aBlock['content_empty'],
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'help' => array(
                    'type' => 'textarea_translatable',
                    'name' => 'help',
                    'caption' => _t('_adm_bp_txt_block_help'),
                    'info' => '',
                    'value' => $aBlock['help'],
                    'required' => '0',
                    'html' => 2,
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'class' => array(
                    'type' => 'text',
                    'name' => 'class',
                    'caption' => _t('_adm_bp_txt_block_class'),
                    'info' => '',
                    'value' => $aBlock['class'],
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'cache_lifetime' => array(
                    'type' => 'text',
                    'name' => 'cache_lifetime',
                    'caption' => _t('_adm_bp_txt_block_cache_lifetime'),
                    'info' => '',
                    'value' => isset($aBlock['cache_lifetime']) ? $aBlock['cache_lifetime'] : 0,
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Int',
                    ),
                ),
                'active' => array(
                    'type' => 'switcher',
                    'name' => 'active',
                    'caption' => _t('_adm_bp_txt_block_active'),
                    'info' => '',
                    'value' => '1',
                    'checked' => $aBlock['active'] == '1',
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'active_api' => array(
                    'type' => 'switcher',
                    'name' => 'active_api',
                    'caption' => _t('_adm_bp_txt_block_active_api'),
                    'info' => '',
                    'value' => '1',
                    'checked' => $aBlock['active_api'] == '1',
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
                        'value' => _t('_adm_bp_btn_block_save')
                    ),
                    array (
                        'type' => 'reset',
                        'name' => 'close',
                        'value' => _t('_adm_bp_btn_block_cancel'),
                        'attrs' => array(
                            'onclick' => $sJsObject . '.onEditBlockCancel(this)',
                            'class' => 'bx-def-margin-sec-left',
                        ),
                    )
                )
            )
        );

        $aDBoxes = array();
        $this->oDb->getDesignBoxes(array('type' => 'ordered'), $aDBoxes, false);
        foreach($aDBoxes as $aDBox)
            $aForm['inputs']['designbox_id']['values'][] = array('key' => $this->sSelectKeyPrefix . $aDBox['id'], 'value' => _t($aDBox['title']));

        $aContentPlaceholders = $this->oDb->getContentPlaceholders();
        $aForm['inputs']['async']['values'][] = array('key' => 0, 'value' => _t('_sys_no_async'));
        foreach ($aContentPlaceholders as $iKey => $sTitle)
            $aForm['inputs']['async']['values'][] = array('key' => $iKey, 'value' => _t($sTitle));

        $aSubmenus = $this->oDb->getBlockSubmenus();
        $aForm['inputs']['submenu']['values'][] = array('key' => '', 'value' => _t('_sys_menu_item_title_inherited'));
        $aForm['inputs']['submenu']['values'][] = array('key' => 'disabled', 'value' => _t('_sys_menu_item_title_disabled'));
        foreach ($aSubmenus as $sObject => $sTitle)
            $aForm['inputs']['submenu']['values'][] = array('key' => $sObject, 'value' => _t($sTitle));

        BxDolStudioUtils::getVisibilityValues($aBlock['visible_for_levels'], $aForm['inputs']['visible_for_levels']['values'], $aForm['inputs']['visible_for_levels']['value']);

        $aForm['inputs'] = $this->addInArray($aForm['inputs'], 'visible_for_levels', $this->getBlockContent($aBlock));

        if((int)$aBlock['deletable'] != 0)
            $aForm['inputs']['controls'][] = array (
                'type' => 'reset',
                'name' => 'close',
                'value' => _t('_adm_bp_btn_block_delete'),
                'attrs' => array(
                    'onclick' => $sJsObject . '.deleteBlock(' . $aBlock['id'] . ')',
                    'class' => 'bx-def-margin-sec-left',
                ),
            );

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $this->onSaveBlock($oForm, $aBlock);

            // add indexing data
            $aBlockAddon = $this->getIndexingDataForBlock($aBlock['type'], $oForm->getCleanValue('content'));

            if($oForm->update($iId, $aBlockAddon) !== false)
                return array('eval' => $sJsObject . '.onEditBlock(oData)');
            else
                return array('msg' => _t('_adm_bp_err_block_edit'));
        }

        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($this->aHtmlIds['edit_block_popup_id'], _t('_adm_bp_txt_edit_block_popup', _t($aBlock['title_system'])), $oTemplate->parseHtmlByName('bp_add_block.html', array(
        	'action' => 'edit',
            'form_id' => $aForm['form_attrs']['id'],
            'form' => $oForm->getCode(true)
        )));

        return array('popup' => array('html' => $sContent, 'options' => array('onBeforeShow' => $sJsObject . '.onEditBlockBeforeShow($el)')));
    }

    protected function actionBlockDelete()
    {
        $sJsObject = $this->getPageJsObject();
        $iId = (int)bx_get('id');

        $aBlock = array();
        $this->oDb->getBlocks(array('type' => 'by_id', 'value' => $iId), $aBlock, false);
        if(empty($aBlock) || !is_array($aBlock))
            return array('msg' => _t('_adm_bp_err_block_not_found'));

        if((int)$aBlock['deletable'] == 0)
            return array('msg' => _t('_adm_bp_err_block_not_deletable'));

        if(!$this->oDb->deleteBlocks(array('type' => 'by_id', 'value' => $iId)))
            return array('msg' => _t('_adm_bp_err_block_delete'));

        $this->onBlockDelete($aBlock);
        return array('eval' => $sJsObject . '.onDeleteBlock(' . $iId . ', oData)');
    }

    protected function actionUriGet()
    {
        $oLanguage = BxDolStudioLanguagesUtils::getInstance();
        $aLanguages = $oLanguage->getLanguages();

        $sLanguageDef = $oLanguage->getDefaultLangName();
        $sLanguageCur = $oLanguage->getCurrentLangName(false);

        $aValues = array();
        foreach($aLanguages as $sName => $sTitle)
            if(($mixedValue = bx_get($sName)) !== false)
                $aValues[$sName] = bx_process_input($mixedValue);

        $sUri = "";
        if(($mixedValue = bx_get('uri')) !== false)
        	$sUri = bx_process_input($mixedValue);
        else if(array_key_exists('en', $aValues) && $aValues['en'] != '')
            $sUri = $aValues['en'];
        else if(array_key_exists($sLanguageDef, $aValues) && $aValues[$sLanguageDef] != '')
            $sUri = $aValues[$sLanguageDef];
        else if(array_key_exists($sLanguageCur, $aValues) && $aValues[$sLanguageCur] != '')
            $sUri = $aValues[$sLanguageCur];
        else if(count($aValues) > 0)
            foreach($aValues as $sValue)
                if(!empty($sValue)) {
                    $sUri = $sValue;
                    break;
                }

        $sUri = $sUri != "" ? uriGenerate($sUri, 'sys_objects_page', 'uri') : "";
        $sUrl = BxDolPermalinks::getInstance()->permalink($this->sPageBaseUrl . $sUri);

        return array('eval' => $this->getPageJsObject() . '.onGetUri(oData)', 'uri' => $sUri, 'url' => $sUrl);
    }

    protected function getSettingsOptions($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-settings-options',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => array (
                'title_system' => array(
                    'type' => 'text_translatable',
                    'name' => 'title_system',
                    'caption' => _t('_adm_bp_txt_page_title_system'),
                    'info' => _t('_adm_bp_dsc_page_title_system'),
                    'value' => isset($aPage['title_system']) ? $aPage['title_system'] : '',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'length',
                        'params' => array(3,100),
                        'error' => _t('_adm_bp_err_page_title_system'),
                    ),
                ),
                'title' => array(
                    'type' => 'text_translatable',
                    'name' => 'title',
                    'caption' => _t('_adm_bp_txt_page_title'),
                    'info' => _t('_adm_bp_dsc_page_title'),
                    'value' => isset($aPage['title']) ? $aPage['title'] : '',
                    'required' => '1',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                    'checker' => array (
                        'func' => 'length',
                        'params' => array(3,100),
                        'error' => _t('_adm_bp_err_page_title'),
                    ),
                ),
                'url' => array(
					'type' => 'text',
					'name' => 'url',
					'caption' => _t('_adm_bp_txt_page_url'),
					'info' => _t('_adm_bp_dsc_page_url'),
					'value' => isset($aPage['url']) ? BxDolPermalinks::getInstance()->permalink($aPage['url']) : '',
					'required' => '0',
					'attrs' => array(
                		'id' => $this->aHtmlIds['url_field_id'],
						'disabled' => 'disabled'
					),
				),
				'type_id' => array(
					'type' => 'select',
					'name' => 'type_id',
					'caption' => _t('_adm_bp_txt_page_type_id'),
					'info' => _t('_adm_bp_dsc_page_type_id'),
					'value' => isset($aPage['type_id']) ? $aPage['type_id'] : '',
					'required' => '1',
					'db' => array (
                        'pass' => 'Int',
                    ),
				),
                'submenu' => array(
                    'type' => 'select',
                    'name' => 'submenu',
                    'caption' => _t('_adm_bp_txt_page_submenu'),
                    'info' => _t('_adm_bp_dsc_page_submenu'),
                    'value' => isset($aPage['submenu']) ? $aPage['submenu'] : '',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'sticky_columns' => array(
                    'type' => 'switcher',
                    'name' => 'sticky_columns',
                    'caption' => _t('_adm_bp_txt_page_sticky_columns'),
                    'info' => '',
                    'value' => '1',
                    'checked' => isset($aPage['sticky_columns']) && $aPage['sticky_columns'] == 1,
                    'db' => array (
                        'pass' => 'Int',
                    )
                )
            )
        );
        
        $aTypes = array();
        $this->oDb->getTypes(array('type' => 'all'), $aTypes, false);
        foreach($aTypes as $aType)
        	$aForm['inputs']['type_id']['values'][] = array('key' => $aType['id'], 'value' => _t($aType['title']));

        $aSubmenus = $this->oDb->getSubmenus();
        $aForm['inputs']['submenu']['values'][] = array('key' => '', 'value' => _t('_sys_menu_item_title_inherited'));
        $aForm['inputs']['submenu']['values'][] = array('key' => 'disabled', 'value' => _t('_sys_menu_item_title_disabled'));
        foreach ($aSubmenus as $sObject => $sTitle)
            $aForm['inputs']['submenu']['values'][] = array('key' => $sObject, 'value' => _t($sTitle));

        if($bCreate) {
        	$sJsObject = $this->getPageJsObject();

        	$aForm['inputs']['title']['attrs']['onblur'] = $sJsObject . '.getUri(this);';

        	$aForm['inputs'] = bx_array_insert_before(array(
        		'uri' => array(
					'type' => 'text',
					'name' => 'uri',
					'caption' => _t('_adm_bp_txt_page_uri'),
					'info' => _t('_adm_bp_dsc_page_uri'),
					'value' => '',
					'required' => '1',
        			'attrs' => array(
						'id' => $this->aHtmlIds['uri_field_id'],
						'onblur' => $sJsObject . '.getUri(this);'
					),
					'db' => array (
						'pass' => 'Xss',
					),
					'checker' => array (
						'func' => 'length',
						'params' => array(3,100),
					    'error' => _t('_adm_bp_err_page_uri'),
					),
				)
        	), $aForm['inputs'], 'url');
        }

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsOptionsFields($aPage = array(), $bCreate = true)
    {
    	return $this->getSettingsOptions($aPage, $bCreate, true);
    }

    protected function getSettingsCover($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-settings-cover',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => array (
                'cover' => array(
                    'type' => 'select',
                    'name' => 'cover',
                    'caption' => _t('_adm_bp_txt_page_cover'),
                    'info' => '',
                    'value' => isset($aPage['cover']) ? (int)$aPage['cover'] : '1',
                    'values' => array(
                        array('key' => 0, 'value' => _t('_adm_bp_txt_page_cover_0')),
                        array('key' => 1, 'value' => _t('_adm_bp_txt_page_cover_1')),
                        array('key' => 2, 'value' => _t('_adm_bp_txt_page_cover_2')),
                        array('key' => 3, 'value' => _t('_adm_bp_txt_page_cover_3'))
                    ),
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'cover_image' => array(
                    'type' => 'files',
                    'name' => 'cover_image',
                    'storage_object' => $this->sStorage,
                    'images_transcoder' => $this->sTranscoderCover,
                    'uploaders' => $this->aUploadersCover,
                    'multiple' => false,
                    'content_id' => isset($aPage['id']) ? $aPage['id'] : 0,
                    'ghost_template' => BxTemplStudioFunctions::getInstance()->getDefaultGhostTemplate('cover_image'),
                    'caption' => _t('_adm_bp_txt_page_cover_image'),
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
                'cover_title' => array(
                    'type' => 'text_translatable',
                    'name' => 'cover_title',
                    'caption' => _t('_adm_bp_txt_page_cover_title'),
                    'info' => '',
                    'value' => isset($aPage['cover_title']) ? $aPage['cover_title'] : '',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsCoverFields($aPage = array(), $bCreate = true)
    {
    	return $this->getSettingsCover($aPage, $bCreate, true);
    }

    protected function getSettingsLayout($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $iLayout = isset($aPage['layout_id']) ? (int)$aPage['layout_id'] : 5;

        $aLayouts = array();
        $this->oDb->getLayouts(array('type' => 'all'), $aLayouts, false);

        $aTmplParams = array(
            'bx_repeat:layouts' => array(),
            'form' => ''
        );

        foreach($aLayouts as $aLayout)
            $aTmplParams['bx_repeat:layouts'][] = array(
                'id' => $aLayout['id'],
                'html_id' => $this->aHtmlIds['layout_id'] . $aLayout['id'],
                'js_object' => $sJsObject,
                'bx_if:active' => array(
                    'condition' => (int)$aLayout['id'] == $iLayout,
                    'content' => array()
                ),
                'icon' => $oTemplate->getImageUrl($aLayout['icon']),
                'title' => _t($aLayout['title']),
            );

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-settings-layout',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => array (
                'layout_id' => array(
                    'type' => 'hidden',
                    'name' => 'layout_id',
                    'value' => $iLayout,
                    'db' => array (
                        'pass' => 'Int',
                    ),
                )
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        $aTmplParams['form'] = $oForm->getCode();

        return $oTemplate->parseHtmlByName('bp_layouts.html', $aTmplParams);
    }

    protected function getSettingsLayoutFields($aPage = array(), $bCreate = true)
    {
    	return $this->getSettingsLayout($aPage, $bCreate, true);
    }

    protected function getSettingsVisibility($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
    	$iVisibleForLevels = isset($aPage['visible_for_levels']) ? (int)$aPage['visible_for_levels'] : BX_DOL_INT_MAX;

        if(isset($aPage['visible_for_levels_editable']) && (int)$aPage['visible_for_levels_editable'] == 0)
            $aInputs = array(
                'visible_for_levels' => array(
                    'type' => 'custom',
                    'name' => 'visible_for_levels',
                    'content' => MsgBox(_t('_adm_bp_err_page_visible_for_levels'))
                )
            );
        else {
        	bx_import('BxDolStudioUtils');
            $aInputs = array(
                'visible_for' => array(
                    'type' => 'select',
                    'name' => 'visible_for',
                    'caption' => _t('_adm_bp_txt_block_visible_for'),
                    'info' => '',
                    'value' => $iVisibleForLevels == BX_DOL_INT_MAX ? BX_DOL_STUDIO_VISIBLE_ALL : BX_DOL_STUDIO_VISIBLE_SELECTED,
                    'values' => array(
                        array('key' => BX_DOL_STUDIO_VISIBLE_ALL, 'value' => _t('_adm_bp_txt_block_visible_for_all')),
                        array('key' => BX_DOL_STUDIO_VISIBLE_SELECTED, 'value' => _t('_adm_bp_txt_block_visible_for_selected')),
                    ),
                    'required' => '0',
                    'attrs' => array(
                        'onchange' => $this->getPageJsObject() . '.onChangeVisibleFor(this)'
                    ),
                    'db' => array (
                        'pass' => 'Xss',
                    )
                ),
                'visible_for_levels' => array(
                    'type' => 'checkbox_set',
                    'name' => 'visible_for_levels',
                    'caption' => _t('_adm_bp_txt_page_visible_for_levels'),
                    'info' => _t('_adm_bp_dsc_page_visible_for_levels'),
                    'value' => array(),
                    'values' => array(),
                    'tr_attrs' => array(
                        'style' => $iVisibleForLevels == BX_DOL_INT_MAX ? 'display:none' : ''
                    ),
                    'db' => array (
                        'pass' => 'Int',
                    )
                )
            );
        }

        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-settings-visibility',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => $aInputs
        );

        BxDolStudioUtils::getVisibilityValues($iVisibleForLevels, $aForm['inputs']['visible_for_levels']['values'], $aForm['inputs']['visible_for_levels']['value']);

        if($bInputsOnly)
            return $aForm['inputs'];       	

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsVisibilityFields($aPage = array(), $bCreate = true)
    {
        return $this->getSettingsVisibility($aPage, $bCreate, true);
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
            'inputs' => array (
                'cache_lifetime' => array(
                    'type' => 'text',
                    'name' => 'cache_lifetime',
                    'caption' => _t('_adm_bp_txt_page_cache_lifetime'),
                    'info' => _t('_adm_bp_dsc_page_cache_lifetime'),
                    'value' => isset($aPage['cache_lifetime']) ? $aPage['cache_lifetime'] : 0,
                    'required' => '',
                    'attrs' => array(
                        'disabled' => isset($aPage['cache_editable']) && (int)$aPage['cache_editable'] == 0 ? 'disabled' : ''
                    ),
                    'db' => array (
                        'pass' => 'Int',
                    )
                ),
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsCacheFields($aPage = array(), $bCreate = true)
    {
    	return $this->getSettingsCache($aPage, $bCreate, true);
    }

    protected function getSettingsSeo($aPage = array(), $bCreate = true, $bInputsOnly = false)
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
            'inputs' => array (
                'meta_title' => array(
                    'type' => 'text',
                    'name' => 'meta_title',
                    'caption' => _t('_adm_bp_txt_page_meta_title'),
                    'value' => isset($aPage['meta_title']) ? $aPage['meta_title'] : '',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'meta_description' => array(
                    'type' => 'textarea',
                    'name' => 'meta_description',
                    'caption' => _t('_adm_bp_txt_page_meta_description'),
                    'info' => _t('_adm_bp_dsc_page_meta_description'),
                    'value' => isset($aPage['meta_description']) ? $aPage['meta_description'] : '',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'meta_keywords' => array(
                    'type' => 'textarea',
                    'name' => 'meta_keywords',
                    'caption' => _t('_adm_bp_txt_page_meta_keywords'),
                    'info' => _t('_adm_bp_dsc_page_meta_keywords'),
                    'value' => isset($aPage['meta_keywords']) ? $aPage['meta_keywords'] : '',
                    'db' => array (
                        'pass' => 'Xss',
                    ),
                ),
                'meta_robots' => array(
                    'type' => 'text',
                    'name' => 'meta_robots',
                    'caption' => _t('_adm_bp_txt_page_meta_robots'),
                    'info' => _t('_adm_bp_dsc_page_meta_robots'),
                    'value' => isset($aPage['meta_robots']) ? $aPage['meta_robots'] : '',
                    'required' => '0',
                    'db' => array (
                        'pass' => 'Xss',
                    )
                )
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsSeoFields($aPage = array(), $bCreate = true)
    {
    	return $this->getSettingsSeo($aPage, $bCreate, true);
    }

    protected function getSettingsInjections($aPage = array(), $bCreate = true, $bInputsOnly = false)
    {
        $aForm = array(
            'form_attrs' => array(
                'id' => 'adm-bp-injections-seo',
            ),
            'params' => array (
                'remove_form' => '1',
                'csrf' => array(
                    'disable' => true
                )
            ),
            'inputs' => array (
                'inj_head' => array(
                    'type' => 'textarea',
                    'name' => 'inj_head',
                    'caption' => _t('_adm_bp_txt_page_inj_head'),
                    'info' => _t('_adm_bp_dsc_page_inj_head'),
                    'value' => isset($aPage['inj_head']) ? $aPage['inj_head'] : '',
                    'code' => 1,
                    'db' => array (
                        'pass' => 'XssHtml',
                    ),
                ),
                'inj_footer' => array(
                    'type' => 'textarea',
                    'name' => 'inj_footer',
                    'caption' => _t('_adm_bp_txt_page_inj_footer'),
                    'info' => _t('_adm_bp_dsc_page_inj_footer'),
                    'value' => isset($aPage['inj_footer']) ? $aPage['inj_footer'] : '',
                    'code' => 1,
                    'db' => array (
                        'pass' => 'XssHtml',
                    ),
                )
            )
        );

        if($bInputsOnly)
            return $aForm['inputs'];

        $oForm = new BxTemplStudioFormView($aForm);
        return $oForm->getCode();
    }

    protected function getSettingsInjectionsFields($aPage = array(), $bCreate = true)
    {
    	return $this->getSettingsInjections($aPage, $bCreate, true);
    }

    protected function getBlockIcon($aBlock)
    {
        $sIcon = $sIconUrl = "";

        $sResult = '';
        switch($aBlock['type']) {
            case BX_DOL_STUDIO_BP_BLOCK_RAW:
            	$sResult = 'far file-alt';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_HTML:
            	$sResult = 'code';
            	break;
            
            case BX_DOL_STUDIO_BP_BLOCK_CREATIVE:
            	$sResult = 'object-group';
            	break;
            
            case BX_DOL_STUDIO_BP_BLOCK_BENTO_GRID:
                $sResult = 'fa-grip-horizontal';
                break;

            case BX_DOL_STUDIO_BP_BLOCK_RSS:
            	$sResult = 'rss';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_IMAGE:
            	$sResult = 'far image';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_LANG:
            	$sResult = 'globe';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_MENU:
            	$sResult = 'list-alt';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_WIKI:
            	$sResult = 'file-word';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_CUSTOM:
                $sResult = 'file';
            	break;

            case BX_DOL_STUDIO_BP_BLOCK_SERVICE:
                $sResult = $this->getModuleIcon($aBlock['module'], 'page');
                break;
        }

        if(strpos($sResult, '.') === false)
            $sIcon = $sResult;
        else
            $sIconUrl = $sResult;

        return array($sIcon, $sIconUrl);
    }

    protected function getBlockModule($aBlock)
    {
        return  $aBlock['module'] != BX_DOL_STUDIO_BP_SKELETONS ? $aBlock['module'] : BX_DOL_STUDIO_MODULE_CUSTOM;
    }

    protected function getBlockContent($aBlock)
    {
        $aFields = array();

        switch($aBlock['type']) {
            case BX_DOL_STUDIO_BP_BLOCK_CUSTOM:
            case BX_DOL_STUDIO_BP_BLOCK_RAW:
            case BX_DOL_STUDIO_BP_BLOCK_BENTO_GRID:
                $aFields = [
                    'content' => [
                        'type' => 'textarea',
                        'name' => 'content',
                        'caption' => _t('_adm_bp_txt_block_content_raw'),
                        'info' => _t('_adm_bp_dsc_block_content_raw'),
                        'value' => $aBlock['content'],
                        'required' => '0',
                        'code' => 1,
                        'attrs' => [
                            'class' => 'bx-form-input-textarea-codemirror'
                        ],
                        'db' => [
                            'pass' => 'XssHtml',
                        ],
                    ],
                ];
                break;

            case BX_DOL_STUDIO_BP_BLOCK_HTML:
                $aFields = [
                    'content' => [
                        'type' => 'textarea',
                        'name' => 'content',
                        'caption' => _t('_adm_bp_txt_block_content_raw'),
                        'info' => _t('_adm_bp_dsc_block_content_raw'),
                        'value' => $aBlock['content'],
                        'required' => '0',
                        'html' => 2,
                        'html_toggle' => true,
                        'attrs' => [
                            'id' => $this->aHtmlIds['edit_block_editor_id']
                        ],
                        'db' => [
                            'pass' => 'XssHtml',
                        ],
                    ],
                    'attachments' => [
                    	'type' => 'files',
                        'name' => 'attachments',
                        'storage_object' => $this->sStorage,
                        'images_transcoder' => $this->sTranscoder,
                        'uploaders' => $this->aUploaders,
                        'multiple' => true,
                        'content_id' => $aBlock['id'],
                        'ghost_template' => BxDolStudioTemplate::getInstance()->parseHtmlByName('bp_fgt_attachments.html', [
                            'js_object' => $this->getPageJsObject(),
                            'name' => 'attachments',
                            'editor_id' => $this->aHtmlIds['edit_block_editor_id'],
                    	]),
                        'caption' => _t('_adm_bp_txt_block_content_attachments_html')
                    ]
                ];
                break;
            
            case BX_DOL_STUDIO_BP_BLOCK_CREATIVE:
                $oTemplate = BxDolStudioTemplate::getInstance();

                $sContent = $oTemplate->parseHtmlByName('bp_block_skeleton_creative.html', [
                    'html_id' => $this->aHtmlIds['edit_block_builder_id'],
                    'content_html' => $aBlock['content'],
                    'content_data' => json_encode([
                        'pages' => [
                            ['component' => $aBlock['content']]
                        ]
                    ])
                ]);

                $aFields = [
                    'content' => [
                        'type' => 'custom',
                        'name' => 'content',
                        'caption' => _t('_adm_bp_txt_block_content_raw'),
                        'content' => $sContent,
                        'required' => '0',
                        'db' => [
                            'pass' => 'XssHtml',
                        ],
                    ],
                ];
                break;

            case BX_DOL_STUDIO_BP_BLOCK_LANG:
                $aFields = [
                    'content' => [
                        'type' => 'textarea_translatable',
                        'name' => 'content',
                        'caption' => _t('_adm_bp_txt_block_content_lang'),
                        'info' => _t('_adm_bp_dsc_block_content_lang'),
                        'value' => $aBlock['content'],
                        'required' => '0',
                        'html' => 2,
                        'html_toggle' => true,
                        'db' => [
                            'pass' => 'XssHtml',
                        ],
                    ],
                ];
                break;

            case BX_DOL_STUDIO_BP_BLOCK_IMAGE:
                $iImageId = $sImageAlign = '';
                if($aBlock['content'] != '')
                    list($iImageId, $sImageAlign) = explode($this->sParamsDivider, $aBlock['content']);

                $aFields = [
                    'content' => [
                        'type' => 'hidden',
                        'name' => 'content',
                        'value' => '',
                        'db' => [
                            'pass' => 'Xss',
                        ],
                    ],
                    'image_file' => [
                        'type' => 'files',
                        'name' => 'image_file',
                        'storage_object' => BX_DOL_STORAGE_OBJ_IMAGES,
                        'images_transcoder' => 'sys_image_resize',
                        'uploaders' => ['sys_html5'],
                        'multiple' => false,
                        'content_id' => $aBlock['id'],
                        'ghost_template' => BxTemplStudioFunctions::getInstance()->getDefaultGhostTemplate('image_file'),
                        'caption' => _t('_adm_bp_txt_block_content_image_file'),
                    ],
                    'image_align' => [
                        'type' => 'select',
                        'name' => 'image_align',
                        'caption' => _t('_adm_bp_txt_block_content_image_align'),
                        'info' => '',
                        'value' => $sImageAlign,
                        'values' => [
                            ['key' => '', 'value' => _t('_adm_bp_txt_block_content_image_align_empty')],
                            ['key' => 'left', 'value' => _t('_adm_bp_txt_block_content_image_align_left')],
                            ['key' => 'center', 'value' => _t('_adm_bp_txt_block_content_image_align_center')],
                            ['key' => 'right', 'value' => _t('_adm_bp_txt_block_content_image_align_right')],
                        ],
                        'required' => '0',
                        'db' => [
                            'pass' => 'Xss',
                        ],
                    ],
                ];
                break;

            case BX_DOL_STUDIO_BP_BLOCK_RSS:
                $sRssUrl = $sRssLength = '';
                if($aBlock['content'] != '')
                    list($sRssUrl, $sRssLength) = explode($this->sParamsDivider, $aBlock['content']);

                $aFields = [
                    'content' => [
                        'type' => 'hidden',
                        'name' => 'content',
                        'value' => '',
                        'db' => [
                            'pass' => 'Xss',
                        ],
                    ],
                    'rss_url' => [
                        'type' => 'text',
                        'name' => 'rss_url',
                        'caption' => _t('_adm_bp_txt_block_content_rss_url'),
                        'info' => _t('_adm_bp_dsc_block_content_rss_url'),
                        'value' => $sRssUrl,
                        'required' => '0',
                        'db' => [
                            'pass' => 'Xss',
                        ],
                    ],
                    'rss_length' => [
                        'type' => 'text',
                        'name' => 'rss_length',
                        'caption' => _t('_adm_bp_txt_block_content_rss_length'),
                        'info' => _t('_adm_bp_dsc_block_content_rss_length'),
                        'value' => $sRssLength,
                        'required' => '0',
                        'db' => [
                            'pass' => 'Int',
                        ],
                    ],
                ];
                break;

            case BX_DOL_STUDIO_BP_BLOCK_MENU:
                $aFields = [
                    'content' => [
                        'type' => 'select',
                        'name' => 'content',
                        'caption' => _t('_adm_bp_txt_block_content_menu'),
                        'info' => '',
                        'value' => $aBlock['content'],
                        'values' => [],
                        'required' => '0',
                        'db' => [
                            'pass' => 'Xss',
                        ],
                    ]
                ];

                $sGroup = '';
                $aMenus = $this->oDb->getMenus(true);
                foreach($aMenus as $sKey => $aMenu) {
                    if($sGroup != $aMenu['module']) {
                        if(!empty($sGroup))
                            $aFields['content']['values'][$sGroup . '_end'] = ['type' => 'group_end'];

                        $sGroup = $aMenu['module'];
                        $aFields['content']['values'][$sGroup . '_beg'] = ['type' => 'group_header', 'value' => BxDolStudioUtils::getModuleTitle($sGroup)];
                    }

                    $aFields['content']['values'][$sKey] = _t($aMenu['title']);
                }

                $aFields['content']['values'] = array_merge(['' => _t('_adm_bp_txt_block_content_menu_empty')], $aFields['content']['values']);
                break;

            case BX_DOL_STUDIO_BP_BLOCK_SERVICE:
                $aService = ['module' => '', 'method' => ''];
                if($aBlock['content'] != '')
                    $aService = unserialize($aBlock['content']);

                $aFields = [
                    'service_module' => [
                        'type' => 'value',
                        'name' => 'service_module',
                        'caption' => _t('_adm_bp_txt_block_content_service_module'),
                        'value' => $this->getModuleTitle($aService['module'])
                    ],
                    'service_method' => [
                        'type' => 'value',
                        'name' => 'service_method',
                        'caption' => _t('_adm_bp_txt_block_content_service_method'),
                        'value' => $aService['method']
                    ]
                ];
                break;
        }

        return $aFields;
    }

    protected function getBlockList($sModule)
    {
        if(empty($sModule))
            return '';

        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $oForm = new BxTemplStudioFormView(array());

        $aInputCheckbox = [
            'type' => 'checkbox',
            'name' => 'blocks[]',
            'attrs' => [
                'onChange' => 'javascript:' . $sJsObject . '.onSelectBlock(this);'
            ],
            'value' => ''
        ];

        $aTmplParams = [
            'html_block_list_id' => $this->aHtmlIds['block_list_id'] . $sModule,
            'bx_repeat:blocks' => []
        ];

        $aBlocks = $this->getBlocks($sModule);
        foreach($aBlocks as $aBlock) {
        	list($sIcon, $sIconUrl) = $this->getBlockIcon($aBlock);

            $aInputCheckbox['value'] = $aBlock['id'];

            $aTmplParams['bx_repeat:blocks'][] = [
                'js_object' => $sJsObject,
                'html_id' => $this->aHtmlIds['block_id'] . $aBlock['id'],
                'bx_if:is_inactive' => array(
                    'condition' => false,
                    'content' => [true]
                ),
                'bx_if:show_link' => [
                    'condition' => false,
                    'content' => [true]
                ],
                'bx_if:show_text' => [
                    'condition' => true,
                    'content' => [
                        'title' => _t(!empty($aBlock['title_system']) ? $aBlock['title_system'] : $aBlock['title']),
                    ]
                ],
                'bx_if:show_api' => [
                    'condition' => false,
                    'content' => [true]
                ],
                'bx_if:image' => [
                    'condition' => (bool)$sIconUrl,
                    'content' => array('icon_url' => $sIconUrl),
                ],
                'bx_if:icon' => [
                    'condition' => (bool)$sIcon,
                    'content' => ['icon' => $sIcon],
                ],
                'module' => $this->getModuleTitle($aBlock['module']),
                'visible_for' => _t('_adm_bp_txt_visible_for', BxDolStudioUtils::getVisibilityTitle($aBlock['visible_for_levels'])),
                'bx_if:show_checkbox' => [
                    'condition' => true,
                    'content' => [
                        'content' => $oForm->genRow($aInputCheckbox)
                    ]
                ],
                'bx_if:show_drag_handle' => [
                    'condition' => false,
                    'content' => []
                ]
            ];
        }

        return $oTemplate->parseHtmlByName('bp_blocks_list.html', $aTmplParams);
    }

    protected function onBlockDelete($aBlock)
    {
    	if($aBlock['module'] != BX_DOL_STUDIO_MODULE_CUSTOM)
    		return;

        BxDolStudioLanguagesUtils::getInstance()->deleteLanguageString($aBlock['title']);

        //--- Process Lang block
        if($aBlock['type'] == BX_DOL_STUDIO_BP_BLOCK_LANG && $aBlock['content'] != '')
            BxDolStudioLanguagesUtils::getInstance()->deleteLanguageString($aBlock['content']);

        //--- Process Image block
        if($aBlock['type'] == BX_DOL_STUDIO_BP_BLOCK_IMAGE && $aBlock['content'] != '') {
            $iImageId = $sImageAlign = '';
            list($iImageId, $sImageAlign) = explode($this->sParamsDivider, $aBlock['content']);

            if(is_numeric($iImageId) && (int)$iImageId != 0)
                BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->deleteFile((int)$iImageId, 0);
        }
    }

    protected function getBlocks($sModule)
    {
        $aBlocks = array();
        $this->oDb->getBlocks(array('type' => 'by_module_to_copy', 'value' => $sModule), $aBlocks, false);

        return $aBlocks;
    }

    protected function _getPageCreateForm()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sForm = 'adm-bp-page-create';
        $aForm = array(
            'form_attrs' => array(
                'id' => $sForm,
                'name' => $sForm,
                'action' => sprintf($this->sPageUrl, $this->sType, $this->sPage) . '&bp_action=' . $this->sActionPageCreate,
                'method' => 'post'
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_objects_page',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
                'display' => $sForm
            ),
            'inputs' => array (
                'module' => array(
                    'type' => 'hidden',
                    'name' => 'module',
                    'value' => BX_DOL_STUDIO_MODULE_CUSTOM,
                    'db' => array (
                        'pass' => 'Xss',
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
                'settings' => array(
                    'type' => 'custom',
                    'name' => 'settings',
                    'content' => $oTemplate->parseHtmlByName('bp_edit_page_form.html', $this->_getTmplVarsPageSettings()),
                ),
            )
        );

        return new BxTemplStudioFormView($aForm);
    }

    protected function _getPageEditForm()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sForm = 'adm-bp-page-edit';
        $aForm = array(
            'form_attrs' => array(
                'id' => $sForm,
                'name' => $sForm,
                'action' => sprintf($this->sPageUrl, $this->sType, $this->sPage) . '&bp_action=' . $this->sActionPageEdit,
                'method' => 'post'
            ),
            'params' => array (
                'db' => array(
                    'table' => 'sys_objects_page',
                    'key' => 'id',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => 'do_submit'
                ),
                'display' => $sForm
            ),
            'inputs' => array (
                'settings' => array(
                    'type' => 'custom',
                    'name' => 'settings',
                    'content' => $oTemplate->parseHtmlByName('bp_edit_page_form.html', $this->_getTmplVarsPageSettings($this->aPageRebuild, false)),
                ),
            )
        );

        return new BxTemplStudioFormView($aForm);
    }

    protected function _getTmplVarsBlockPanelTop()
    {
        $oPermalink = BxDolPermalinks::getInstance();
        $sJsObject = $this->getPageJsObject();

        $aInputTypes = [];
        if(!in_array($this->sType, [BX_DOL_STUDIO_BP_TYPE_SYSTEM, BX_DOL_STUDIO_BP_TYPE_CUSTOM])) {
            $aModulesDb = $this->oDb->getPages(['type' => 'modules_with_pages']);

            $aInputTypesValues = [[
                'key' => '',
                'value' => _t('_adm_txt_select_module')
            ]];
            foreach($aModulesDb as $aModuleDb) {
                $sName = $aModuleDb['name'];
                if($sName == BX_DOL_STUDIO_MODULE_SYSTEM)
                    continue;

                $aInputTypesValues[] = [
                    'key' => $sName,
                    'value' => BxDolStudioUtils::getModuleTitle($sName)
                ]; 
            }

            $aInputTypes = [
                'type' => 'select',
                'name' => 'page',
                'attrs' => [
                    'onChange' => 'javascript:' . $sJsObject . '.onChangeType(this)'
                ],
                'value' => $this->sType,
                'values' => $aInputTypesValues
            ];
        }

        $aPages = $this->oDb->getPages(['type' => 'by_module', 'value' => $this->sType]);

        $aCounter = [];
        $this->oDb->getBlocks(['type' => 'counter_by_pages'], $aCounter, false);
        
        $aInputPagesValues = [];
        foreach($aPages as $aPage) {
            $sTitle = _t($aPage['title_system']);
            if(empty($sTitle))
                $sTitle = _t($aPage['title']);

            $aInputPagesValues[] = [
                'key' => $aPage['object'], 
                'value' => $sTitle,
                'attrs' => [
                    'data-url' => $aPage['url'] ? $oPermalink->permalink($aPage['url']) : '',
                    'data-blocks' => $aCounter[$aPage['object']] ?? 0
                ]
            ];
        }

        usort($aInputPagesValues, function($aV1, $aV2) {
            return strcmp($aV1['value'], $aV2['value']);
        });

        $aInputPages = [
            'type' => 'select',
            'name' => 'page',
            'attrs' => [
                'onChange' => 'javascript:' . $sJsObject . '.onChangePage(this)'
            ],
            'value' => $this->sPage,
            'values' => array_merge([[
                'key' => '', 
                'value' => _t('_adm_bp_txt_select_page')
            ]], $aInputPagesValues)
        ];

        $aTmplVarsActions = [];
        if(($this->sPage != '' && !empty($this->aPageRebuild)) !== false)
            $aTmplVarsActions = $this->_getTmplVarsBlockPanelTopActions();

        $oForm = new BxTemplStudioFormView([]);

        return [
            'js_object' => $sJsObject,
            'bx_if:show_selector_types' => [
                'condition' => !empty($aInputTypes),
                'content' => [
                    'selector_types' => $oForm->genRow($aInputTypes),
                ]
            ],
            'selector_pages' => $oForm->genRow($aInputPages),
            'action_page_create' => $this->sActionPageCreate,
            'bx_if:show_actions' => [
                'condition' => $this->sPage != '',
                'content' => $aTmplVarsActions
            ]
        ];
    }

    protected function _getTmplVarsBlockPanelTopActions()
    {
        $sJsObject = $this->getPageJsObject();

        $oPermalinks = BxDolPermalinks::getInstance();

        return [
            'js_object' => $sJsObject,
            'bx_if:can_view' => [
                'condition' => !empty($this->aPageRebuild['url']),
                'content' => [
                    'url_view' => bx_absolute_url($oPermalinks->permalink($this->aPageRebuild['url'])),
                ]
            ],
            'action_page_edit' => $this->sActionPageEdit,
            'bx_if:can_delete' => [
                'condition' => (int)$this->aPageRebuild['deletable'] == 1,
                'content' => [
                    'js_object' => $sJsObject
                ]
            ],
            'action_block_create' => $this->sActionBlockCreate,
        ];
    }

    protected function _getTmplVarsPageSettings($aPage = array(), $bCreate = true)
    {
    	$sJsObject = $this->getPageJsObject();

        $aTmplParams = array(
            'js_object' => $sJsObject,
            'menu' => array(),
            'html_settings_groups_id' => $this->aHtmlIds['settings_groups_id'],
            'bx_repeat:settings_groups' => array(),
        	'submit' => _t($bCreate ? '_adm_bp_btn_page_create' : '_adm_bp_btn_page_apply')
        );
        foreach($this->aPageSettings as $aSetting) {
            //--- get menu items
            $aTmplParams['menu'][$aSetting['name']] = array(
                'name' => $aSetting['name'],
                'icon' => '',
                'onclick' => $sJsObject . '.onChangeSettingGroup(\'' . $aSetting['name'] . '\', this);',
                'title' => $aSetting['title'],
                'selected' => isset($aSetting['active']) && (int)$aSetting['active'] == 1
            );

            //--- get settings
            $aTmplParams['bx_repeat:settings_groups'][] = array(
                'html_settings_group_id' => $this->aHtmlIds['settings_group_id'] .  $aSetting['name'],
                'bx_if:hidden' => array(
                    'condition' => $aSetting['active'] != 1,
                    'content' => array()
                ),
                'content' => $this->{'getSettings' . $this->getClassName($aSetting['name'])}($aPage, $bCreate)
            );
        }

        $oMenu = new BxTemplStudioMenu(array('template' => 'menu_side.html', 'menu_items' => $aTmplParams['menu']));
        $aTmplParams['menu'] = $oMenu->getCode();

        return $aTmplParams;
    }

    protected function getIndexingDataForBlock($sType, $sContent)
    {
        $aBlock = array();   
        switch($sType) {
            case BX_DOL_STUDIO_BP_BLOCK_HTML:
            case BX_DOL_STUDIO_BP_BLOCK_RAW:
                $aBlock['text'] = trim(strip_tags($sContent));
                $aBlock['text_updated'] = time();
                break;
        }
        return $aBlock;
    }

    protected function onPageChanged($oForm, $aPage)
    {
        $this->oDb->cleanCache('sys_pages_objects_data');
        $this->oDb->cleanCache('sys_pages_uri_object_map');
        $this->oDb->cleanCache('sys_pages_urirewrite_object_map');
    }
}

/** @} */
