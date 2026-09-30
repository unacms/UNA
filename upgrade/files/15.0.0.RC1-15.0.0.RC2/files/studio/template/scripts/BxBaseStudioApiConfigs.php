<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioApiConfigs extends BxDolStudioApiConfigs
{
    protected $_sConfigFile;
    protected $_sInstallerFile;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);
        
        $this->_sConfigFile = 'install/config.php';
        $this->_sInstallerFile = 'install/installer.php';

        $this->oDb = BxDolModuleQuery::getInstance();
    }

    public function performActionApply()
    {
        $iId = $this->_getIds();
        
        $mixedResult = $this->_performActionApply($iId);
        if($mixedResult === true)
            $mixedResult = ['code' => 0, 'msg' => _t('_adm_api_msg_applied')];
        else
            $mixedResult = ['code' => 1, 'msg' => is_string($mixedResult) ? $mixedResult : _t('_adm_err_operation_failed')];

        return echoJson($mixedResult);
    }

    public function performActionRemove()
    {
        $iId = $this->_getIds();

        $aResult = [];
        if($this->_performActionRemove($iId))
            $aResult = ['code' => 0, 'msg' => _t('_adm_api_msg_removed')];
        else
            $aResult = ['code' => 1, 'msg' => _t('_adm_err_operation_failed')];

        return echoJson($aResult);
    }

    public function performActionExport()
    {
        $iId = $this->_getIds();

        list($bResult, $sResult) = $this->_performActionExport($iId);
        if(!$bResult)
            return echoJson(['code' => 1, 'msg' => _t($sResult)]);

        return echoJson([
            'code' => 0,
            'redirect' => BX_DOL_URL_STUDIO . bx_append_url_params('api.php', [
                'page' => 'api_config',
                'api_action' => 'download',
                'api_value' => $sResult
            ])
        ]);
    }

    public function performActionApplyAll()
    {
        $iAffected = 0;
        
        $aModules = $this->oDb->getModulesBy(['type' => 'modules']);
        foreach($aModules as $aModule) {
            if((int)$aModule['enabled'] == 0)
                continue;

            $iAffected += ($this->_performActionApply($aModule['id']) === true ? 1 : 0);
        }

        return echoJson(['code' => 0, 'msg' => _t('_adm_api_msg_applied_for', $iAffected)]);
    }

    public function performActionRemoveAll()
    {
        $iAffected = 0;
        
        $aModules = $this->oDb->getModulesBy(['type' => 'modules']);
        foreach($aModules as $aModule) {
            if((int)$aModule['enabled'] == 0)
                continue;

            $iAffected += ($this->_performActionRemove($aModule['id']) === true ? 1 : 0);
        }

        return echoJson(['code' => 0, 'msg' => _t('_adm_api_msg_removed_for', $iAffected)]);
    }

    public function performActionExportAll()
    {
        list($bResult, $sResult) = $this->_performActionExport();
        if(!$bResult)
            return echoJson(['code' => 1, 'msg' => _t($sResult)]);

        return echoJson([
            'code' => 0,
            'redirect' => BX_DOL_URL_STUDIO . bx_append_url_params('api.php', [
                'page' => 'api_config',
                'api_action' => 'download',
                'api_value' => $sResult
            ])
        ]);
    }

    public function performActionImportAll()
    {
        $sAction = 'import_all';

        $sForm = 'adm_api_settings_' . $sAction;
    	$aForm = [
            'form_attrs' => [
                'id' => $sForm,
                'name' => $sForm,
                'action' => BX_DOL_URL_ROOT . 'grid.php?o=sys_studio_api_configs&a=' . $sAction,
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
                'controls' => [
                    'type' => 'input_set', [
                        'type' => 'submit',
                        'name' => 'save',
                        'value' => _t('_adm_api_btn_import'),
                    ], [
                        'type' => 'button',
                        'name' => 'cancel',
                        'value' => _t('_Cancel'),
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
            $sError = _t('_adm_api_err_cannot_perform_action');

            $sFile = '';
            if(!($sFile = $_FILES['file']['tmp_name'] ?? false))
                return echoJson(['code' => 1, 'msg' => $sError]);

            if($this->oDb->executeSQL($sFile) !== true)
                return echoJson(['code' => 2, 'msg' => $sError]);

            BxDolCacheUtilities::getInstance()->clear('db');

            return echoJson(['code' => 0, 'msg' => _t('_adm_api_msg_imported')]);
        }

        $sFormId = $oForm->getId();
        $sContent = BxTemplStudioFunctions::getInstance()->popupBox($sFormId . '_popup', _t('_adm_api_popup_import'), $this->_oTemplate->parseHtmlByName('api_settings_form.html', [
            'form_id' => $sFormId,
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _performActionApply($iId)
    {
        $aModule = $this->oDb->getModuleById($iId);
        if(!$aModule || !is_array($aModule))
            return false;

        $aConfig = BxDolStudioInstallerUtils::getModuleConfig(BX_DIRECTORY_PATH_MODULES . $aModule['path'] . $this->_sConfigFile);
        if(!$aConfig || !is_array($aConfig))
            return false;

        $sPathInstaller = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . $this->_sInstallerFile;
        if(!file_exists($sPathInstaller))
            return false;

        require_once($sPathInstaller);

        $sClassName = $aModule['class_prefix'] . 'Installer';
        $oInstaller = new $sClassName($aConfig);
        $mixedResult = $oInstaller->callAction('enable', 'execute_sql_addons');

        return $mixedResult == BX_DOL_STUDIO_INSTALLER_SUCCESS ? true : ($mixedResult['msg'] ?? false);
    }
    
    protected function _performActionRemove($iId)
    {
        $aModule = $this->oDb->getModuleById($iId);
        if(!$aModule || !is_array($aModule))
            return false;

        $this->oDb->query("UPDATE `sys_pages_blocks` SET `active_api`=0 WHERE `module`=:module", [
            'module' => $aModule['name']
        ]);

        $this->oDb->query("UPDATE `sys_menu_items` SET `active_api`=0 WHERE `module`=:module", [
            'module' => $aModule['name']
        ]);

        return true;
    }
    
    protected function _performActionExport($iId = 0)
    {
        $sModule = '';
        if($iId && ($aModule = BxDolModuleDb::getInstance()->getModuleById($iId)) && is_array($aModule))
            $sModule = $aModule['name'];

        $sContent = '';
        if(($_sContent = $this->_getQueriesPagesConfigApi($sModule)))
            $sContent .= "-- \n-- Pages 'Config API':\n-- " . $_sContent;
        if(($_sContent = $this->_getQueriesPagesActiveApi($sModule)))
            $sContent .= "-- \n-- Pages 'Active API':\n-- " . $_sContent;
        if(($_sContent = $this->_getQueriesMenusConfigApi($sModule)))
            $sContent .= "-- \n-- Manus 'Config API':\n-- " . $_sContent;
        if(($_sContent = $this->_getQueriesMenusActiveApi($sModule)))
            $sContent .= "-- \n-- Manus 'Active API':\n-- " . $_sContent;   

        if(!$sContent)
            return [false, '_adm_api_msg_export_empty'];

        $iNow = time();
        $sFile = "api_settings_" . ($sModule ?: 'all') . "_". date('d_m_Y', $iNow) . ".sql";

        $mixedResult = false;
        if(($oHandle = fopen(BX_DIRECTORY_PATH_TMP . $sFile, 'w'))) {
            $mixedResult = fwrite($oHandle, $sContent);
            fclose($oHandle);
        }

        return $mixedResult ? [true, $sFile] : [false, '_adm_err_operation_failed'];
    }
}

/** @} */
