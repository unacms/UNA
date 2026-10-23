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

require_once('BxDevFunctions.php');

define('BX_DEV_TOOLS_SETTINGS', 'settings');
define('BX_DEV_TOOLS_FORMS', 'forms');
define('BX_DEV_TOOLS_PAGES', 'pages');
define('BX_DEV_TOOLS_NAVIGATION', 'navigation');
define('BX_DEV_TOOLS_POLYGLOT', 'polyglot');
define('BX_DEV_TOOLS_PERMISSIONS', 'permissions');

class BxDevModule extends BxDolModule
{
    public $aTools;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->aTools = array(
            array('name' => BX_DEV_TOOLS_SETTINGS, 'title' => '_adm_page_cpt_settings', 'icon' => 'bx-dev-mi-settings.svg'),
            array('name' => BX_DEV_TOOLS_POLYGLOT, 'title' => '_adm_page_cpt_polyglot', 'icon' => 'bx-dev-mi-polyglot.svg'),
            array('name' => BX_DEV_TOOLS_FORMS, 'title' => '_adm_page_cpt_builder_forms', 'icon' => 'bx-dev-mi-forms.svg'),
            array('name' => BX_DEV_TOOLS_NAVIGATION, 'title' => '_adm_page_cpt_builder_menus', 'icon' => 'bx-dev-mi-navigation.svg'),
            array('name' => BX_DEV_TOOLS_PAGES, 'title' => '_adm_page_cpt_builder_pages', 'icon' => 'bx-dev-mi-pages.svg'),
            //array('name' => BX_DEV_TOOLS_PERMISSIONS, 'title' => '_adm_page_cpt_builder_permissions', 'icon' => 'bx-dev-mi-permissions.png'),
        );
    }

    function getToolsList()
    {
        return $this->aTools;
    }

    public function actionResetHash($sType, $sModule = '')
    {
    	$oDb = bx_instance('BxDolStudioInstallerQuery');

        if(!$this->_oConfig->isEnabled() || !isAdmin())
            return;

    	$sResult = '';
    	switch ($sType) {
    		case 'system':
                    $oHasher = bx_instance('BxDolInstallerHasher');

                    $oDb->deleteModuleTrackFiles(BX_SYSTEM_MODULE_ID);

                    $sResult = _t('_bx_dev_hash_' . ($oHasher->hashSystemFiles() ? 'msg' : 'err') . '_reset_hash_system');    			
                    break;

    		case 'modules':
                    $oModuleQuery = BxDolModuleQuery::getInstance();
                    if(!empty($sModule)) {
                        $aNames = strpos($sModule, ',') !== false ? explode(',', $sModule) : array($sModule);

                        $aModule = array();
                        foreach($aNames as $aName)
                            $aModules[] = $oModuleQuery->getModuleByName($aName);
                    }
                    else
                        $aModules = $oModuleQuery->getModules();

                    $aTmplVarsModules = array();
                    if(!empty($aModules) && is_array($aModules))
                        foreach($aModules as $aModule) {
                            if($aModule['name'] == 'system')
                                continue;

                            $aConfig = BxDolInstallerUtils::getModuleConfig($aModule);
                            $sPathInstaller = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'install/installer.php';
                            if(empty($aConfig) || !file_exists($sPathInstaller))
                                continue;

                            require_once($sPathInstaller);

                            $sClassName = $aConfig['class_prefix'] . 'Installer';
                            $oInstaller = new $sClassName($aConfig);

                            $oDb->deleteModuleTrackFiles($aModule['id']);

                            $aFiles = array();
                            $oInstaller->hashFiles(BX_DIRECTORY_PATH_ROOT . 'modules/' . $aModule['path'], $aFiles);
                            foreach($aFiles as $aFile)
                                $oDb->insertModuleTrack($aModule['id'], $aFile);

                            $aTmplVarsModules[] = array(
                                'module' => $aModule['title'],
                                'files' => count($aFiles)
                            );
                        }

                        $sResult = $this->_oTemplate->parseHtmlByName('hash_modules.html', array(
                            'bx_repeat:modules' => $aTmplVarsModules
                        ));
                        break;
    	}

    	echo $sResult;
    	exit;
    }
    
    public function actionExport()
    {
        if(!$this->_oConfig->isEnabled() || !isAdmin())
            return echoJson([]);

        $sType = bx_process_input(bx_get('type'));
        if(empty($sType))
            return echoJson([]);

        echoJson([
            'url' => BX_DOL_URL_ROOT . bx_append_url_params($this->_oConfig->getBaseUri() . 'download', [
                'type' => $sType,
            ]),
            'eval' => $this->_oConfig->getJsObject('main') . '.onExport(oData);'
        ]);
    }

    public function actionDownload()
    {
        if(!$this->_oConfig->isEnabled() || !isAdmin())
            return;

        $sType = bx_process_input(bx_get('type'));
        if(empty($sType))
            return;

        $sMethod = '_eiExport' . bx_gen_method_name($sType);
        if(!method_exists($this, $sMethod))
            return;

        $mixedFull = ($mixedFull = bx_get('full')) !== false ? (int)$mixedFull != 0 : false;

        list($aMeta, $aData) = $this->$sMethod($mixedFull);

        $iNow = time();
    	$sContent = json_encode([
            'meta' => array_merge([
                'version' => bx_get_ver(),
                'type' => $sType,
                'full' => $mixedFull,
                'date' => date('D, d M Y H:i:s', $iNow),
            ], $aMeta),
            'data' => $aData
    	]);

    	header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Content-type: application/json");
        header("Content-Length: " . strlen($sContent));
        header("Content-Disposition: attachment; filename=\"" . $sType . ($mixedFull ? "_f" : "") . "_". date('d_m_Y', $iNow) . ".json\"");

        echo $sContent;
        exit;
    }
    
    public function actionImport()
    {
        if(!$this->_oConfig->isEnabled() || !isAdmin())
            return echoJson([]);

        $sType = bx_process_input(bx_get('type'));
        if(empty($sType))
            return echoJson([]);

        $aResult = $this->getPopupCodeImport($sType, [
            'form_name' => 'bx-dev-' . $sType . '-import-full',
            'form_action' => BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'import?type=' . $sType
        ]);

        if(!isset($aResult['code']) || (int)$aResult['code'] != 0)
            return echoJson($aResult);
        
        $sMethod = '_eiImport' . bx_gen_method_name($sType);
        if(!method_exists($this, $sMethod))
            return echoJson([]);

        echoJson($this->$sMethod($aResult['content'], $aResult['disable'] != 0));
    }

    public function getPopupCodeImport($sType, $aParams)
    {
    	$sJsObject = $this->_oConfig->getJsObject('main');

    	$sForm = $aParams['form_name'];
    	$aForm = [
            'form_attrs' => [
                'id' => $sForm,
                'name' => $sForm,
                'action' => $aParams['form_action'],
                'method' => 'post',
                'enctype' => 'multipart/form-data'
            ],
            'params' => [
                'db' => [
                    'submit_name' => 'save'
                ],
            ],
            'inputs' => [
            	'file' => [
                    'type' => 'file',
                    'name' => 'file',
                    'caption' => '',
                    'value' => '',
                ],
                'disable' => [
                    'type' => 'switcher',
                    'name' => 'disable',
                    'caption' => _t('_bx_dev_txt_disable_before_import'),
                    'info' => _t('_bx_dev_txt_disable_before_import_note'),
                    'value' => '1',
                    'checked' => 0,
                    'db' => [
                        'pass' => 'Int',
                    ],
                ],
                'controls' => [
                    'type' => 'input_set', [
                        'type' => 'submit',
                        'name' => 'save',
                        'value' => _t('_bx_dev_btn_import_full'),
                    ], [
                        'type' => 'button',
                        'name' => 'cancel',
                        'value' => _t('_bx_dev_btn_cancel'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left-auto',
                            'onclick' => '$(".bx-popup-applied:visible").dolPopupHide()'
                        ]
                    ]
                ]
            ]
        ];

        $oForm = new BxTemplStudioFormView($aForm);
        $oForm->initChecker();

        if($oForm->isSubmittedAndValid()) {
            $sError = _t('_bx_dev_err_cannot_perform');
            $sErrorWf = _t('_bx_dev_err_import_wrong_format');

            if(empty($_FILES['file']) || empty($_FILES['file']['tmp_name']))
                return ['code' => 1, 'msg' => $sError];

            $aFile = $_FILES['file'];
            $sFile = $aFile['tmp_name'];
            $rHandle = @fopen($sFile, "r");
            if(!$rHandle)
                return ['code' => 2, 'message' => $sError];

            $sContents = fread($rHandle, filesize($sFile));
            fclose($rHandle);

            $aContent = json_decode($sContents, true);
            if(!is_array($aContent) || empty($aContent['meta']) || empty($aContent['data']))
                return ['code' => 3, 'message' => $sErrorWf];

            if(empty($aContent['meta']['type']) || strcmp($aContent['meta']['type'], $sType) != 0)
                return ['code' => 4, 'message' => $sErrorWf];

            return ['code' => 0, 'content' => $aContent, 'disable' => $oForm->getCleanValue('disable')];
        }

        return [
            'popup' => BxTemplStudioFunctions::getInstance()->popupBox('bx-dev-import-popup', _t('_bx_dev_txt_import_full_popup'), $this->_oTemplate->parseHtmlByName('import_popup.html', [
                'js_object' => $sJsObject,
                'form_id' => $sForm,
                'form' => $oForm->getCode(true),
            ]))
        ];
    }

    public function isValidJson($s)
    {
        //--- Validation is disabled for now.         
        //--- return json_decode($s, true) !== null;

        return true;
    }

    /**
     * 
     * Methods for Export/Import feature.
     * 
     */
    protected function _eiExportForms($bModeFull = false)
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_forms'));
        if(!$oGrid)
            return [];

        $aForms = [];
        $oGrid->oDb->getForms(['type' => 'export'], $aForms, false);
        if(empty($aForms) || !is_array($aForms))
            return [];

        $aMeta = [
            'masks' => [
                'form' => ['object', 'active'],
                'display' => ['display_name'],
                'input' => ['object', 'name', 'privacy', 'checker_func', 'checker_params', 'checker_error', 'db_pass', 'db_params'],
                'display_input' => ['display_name', 'input_name', 'visible_for_levels', 'active', 'order']
            ]
        ];

        if($bModeFull) {
            $aMeta['masks'] = [
                'form' => ['object', 'module', 'title', 'action', 'form_attrs', 'submit_name', 'table', 'key', 'uri', 'uri_title', 'params', 'deletable', 'active', 'override_class_name', 'override_class_file'],
                'display' => ['display_name', 'module', 'object', 'title', 'view_mode'],
                'input' => ['object', 'module', 'name', 'value', 'values', 'checked', 'type', 'caption_system', 'caption', 'info', 'help', 'icon', 'required', 'unique', 'collapsed', 'html', 'privacy', 'rateable', 'attrs', 'attrs_tr', 'attrs_wrapper', 'checker_func', 'checker_params', 'checker_error', 'db_pass', 'db_params', 'editable', 'deletable'],
                'display_input' => ['display_name', 'input_name', 'visible_for_levels', 'active', 'order']
            ];
        }

        $aMfForm = $aMfDisplay = $aMfInput = $aMfDisplayInput = false;
        foreach($aMeta['masks'] as $sMask => $aMask)
            ${'aMf' . bx_gen_method_name($sMask)} = array_flip($aMask);

        $aData = [];
        foreach($aForms as $aForm) {
            $sObject = $aForm['object'];

            $aDisplays = [];
            $oGrid->oDb->getDisplays(['type' => 'export_by_object', 'value' => $sObject], $aDisplays, false);
            
            $aListDisplays = [];
            $aDataDisplays = [];
            if(!empty($aDisplays) && is_array($aDisplays))
                foreach($aDisplays as $aDisplay) {
                    $aListDisplays[] = $aDisplay['display_name'];
                    $aDataDisplays[] = $aMfDisplay !== false ? array_intersect_key($aDisplay, $aMfDisplay) : $aDisplay;
                }

            $aInputs = [];
            $oGrid->oDb->getInputs(['type' => 'dump_inputs', 'value' => $sObject], $aInputs, false);

            $aDataInputs = [];
            if(!empty($aInputs) && is_array($aInputs))
                foreach($aInputs as $aInput)
                    $aDataInputs[] = $aMfInput !== false ? array_intersect_key($aInput, $aMfInput) : $aInput;

            $aDisplayInputs = [];
            $oGrid->oDb->getInputs(['type' => 'dump_display_inputs', 'displays' => $aListDisplays], $aDisplayInputs, false);

            $aDataDisplayInputs = [];
            if(!empty($aDisplayInputs) && is_array($aDisplayInputs))
                foreach($aDisplayInputs as $aDisplayInput)
                    $aDataDisplayInputs[] = $aMfDisplayInput !== false ? array_intersect_key($aDisplayInput, $aMfDisplayInput) : $aDisplayInput;

            $aData[] = [
                'form' => $aMfForm !== false ? array_intersect_key($aForm, $aMfForm) : $aForm,
                'displays' => $aDataDisplays,
                'inputs' => $aDataInputs,
                'display_inputs' => $aDataDisplayInputs
            ];
        }

        return [$aMeta, $aData];
    }

    protected function _eiExportMenus($bModeFull = false)
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_nav_menus'));
        if(!$oGrid)
            return [];

        $aMenus = [];
        $oGrid->oDb->getMenus(['type' => 'export'], $aMenus, false);
        if(empty($aMenus) || !is_array($aMenus))
            return [];

        $aMeta = [
            'masks' => [
                'menu' => ['object', 'active'],
                'set' => ['set_name'],
                'item' => ['set_name', 'name', 'visible_for_levels', 'visibility_custom', 'hidden_on', 'hidden_on_cxt', 'hidden_on_pt', 'hidden_on_col', 'active', 'active_api', 'order']
            ]
        ];

        if($bModeFull) {
            $aMeta['masks'] = [
                'menu' => ['object', 'title', 'set_name', 'module', 'template_id', 'deletable', 'active', 'override_class_name', 'override_class_file'],
                'set' => ['set_name', 'module', 'title', 'deletable'],
                'item' => ['parent_id', 'set_name', 'module', 'name', 'title_system', 'title', 'link', 'onclick', 'target', 'icon', 'addon', 'addon_cache', 'markers', 'submenu_object', 'submenu_popup', 'visible_for_levels', 'visibility_custom', 'hidden_on', 'hidden_on_cxt', 'hidden_on_pt', 'hidden_on_col', 'primary', 'collapsed', 'active', 'active_api', 'copyable', 'editable', 'order']
            ];
        }

        $aMfMenu = $aMfSet = $aMfItem = false;
        foreach($aMeta['masks'] as $sMask => $aMask)
            ${'aMf' . bx_gen_method_name($sMask)} = array_flip($aMask);

        $aData = [];
        foreach($aMenus as $aMenu) {
            $aSet = [];
            $oGrid->oDb->getSets(['type' => 'export_by_name', 'value' => $aMenu['set_name']], $aSet, false);

            $aDataItems = [];
            if(!empty($aSet) && is_array($aSet)) {
                $aItems = [];
                $oGrid->oDb->getItems(['type' => 'export_by_set_name', 'value' => $aSet['set_name']], $aItems, false);

                if(!empty($aItems) && is_array($aItems))
                    foreach($aItems as $aItem)
                        $aDataItems[] = $aMfItem !== false ? array_intersect_key($aItem, $aMfItem) : $aItem;
            }

            $aData[] = [
                'menu' => $aMfMenu !== false ? array_intersect_key($aMenu, $aMfMenu) : $aMenu,
                'set' => !empty($aSet) && $aMfSet !== false ? array_intersect_key($aSet, $aMfSet) : $aSet,
                'items' => $aDataItems,
            ];
        }

        return [$aMeta, $aData];
    }

    protected function _eiExportPages($bModeFull = false)
    {
        bx_import('BuilderPage', $this->_aModule);
        $oBuilderPage = new BxDevBuilderPage(['type' => '', 'page' => '', 'url' => '']);
        if(!$oBuilderPage)
            return [];

        $oBpDb = $oBuilderPage->getDb();

        $aPages = $oBpDb->getPages(['type' => 'export']);
        if(empty($aPages) || !is_array($aPages))
            return [];

        $aMeta = [
            'masks' => [
                'page' => ['object', 'visible_for_levels'],
                'block' => ['object', 'cell_id', 'module', 'title_system', 'title', 'visible_for_levels', 'hidden_on', 'active', 'active_api', 'order']
            ]
        ];

        if($bModeFull) {
            $aMeta['masks'] = [
                'page' => ['author', 'added', 'object', 'uri', 'title_system', 'title', 'module', 'cover', 'cover_image', 'cover_title', 'type_id', 'layout_id', 'sticky_columns', 'submenu', 'visible_for_levels', 'visible_for_levels_editable', 'url', 'content_info', 'meta_description', 'meta_keywords', 'meta_robots', 'cache_lifetime', 'cache_editable', 'inj_head', 'inj_footer', 'deletable', 'override_class_name', 'override_class_file'],
                'block' => ['object', 'cell_id', 'module', 'title_system', 'title', 'designbox_id', 'class', 'submenu', 'tabs', 'async', 'visible_for_levels', 'hidden_on', 'type', 'content', 'content_empty', 'text', 'text_updated', 'help', 'cache_lifetime', 'deletable', 'copyable', 'active', 'active_api', 'order']
            ];
        }

        $aMfPage = $aMfBlock = false;
        foreach($aMeta['masks'] as $sMask => $aMask)
            ${'aMf' . bx_gen_method_name($sMask)} = array_flip($aMask);

        $aData = [];
        foreach($aPages as $aPage) {
            $aBlocks = [];
            $oBpDb->getBlocks(['type' => 'export_by_object', 'value' => $aPage['object']], $aBlocks, false);

            $aDataBlocks = [];
            if(!empty($aBlocks) && is_array($aBlocks))
                foreach($aBlocks as $aBlock)
                    $aDataBlocks[] = $aMfBlock !== false ? array_intersect_key($aBlock, $aMfBlock) : $aBlock;

            $aData[] = [
                'page' => $aMfPage !== false ? array_intersect_key($aPage, $aMfPage) : $aPage,
                'blocks' => $aDataBlocks,
            ];
        }

        return [$aMeta, $aData];
    }

    protected function _eiImportPages($aContent, $bDisable = false)
    {
        bx_import('BuilderPage', $this->_aModule);
        $oBuilderPage = new BxDevBuilderPage(['type' => '', 'page' => '', 'url' => '']);
        if(!$oBuilderPage)
            return [];

        $oBpDb = $oBuilderPage->getDb();

        $bModeFull = isset($aContent['meta']['full']) && (bool)$aContent['meta']['full'] === true;

        $aMfMenu = $aMfSet = $aMfItem = false;
        foreach($aContent['meta']['masks'] as $sMask => $aMask)
            ${'aMf' . bx_gen_method_name($sMask)} = array_flip($aMask);

        if($bDisable)
            $oBpDb->updateBlocks(['active' => 0, 'active_api' => 0]);

        $iData = 0;
        foreach($aContent['data'] as $aData) {
            $iData += 1;

            $sObject = $aData['page']['object'];
            if($bModeFull && !$oBpDb->isPageExists($sObject)) {
                if(!$oBpDb->addPage($aData['page']))
                    continue;
            }
            else
                $oBpDb->updatePageByObject($sObject, $aData['page']);

            foreach($aData['blocks'] as $aBlock) {
                $aFields = [
                    'object' => $aBlock['object'],
                    'module' => $aBlock['module'], 
                    'title_system' => $aBlock['title_system'], 
                    'title' => $aBlock['title']
                ];

                if($bModeFull && !$oBpDb->isBlockExists($aFields))
                    $oBpDb->insertBlock($aBlock);
                else
                    $oBpDb->updateBlockByFields($aFields, $aBlock);
            }
        }

        BxDolCacheUtilities::getInstance()->clear('db');

        return [
            'msg' => _t('_bx_dev_msg_imported', $iData), 
            'eval' => $this->_oConfig->getJsObject('main') . '.onImport(oData);'
        ];
    }
}
/** @} */
