<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_STG_TYPE_SYSTEM', 'system');
define('BX_DOL_STUDIO_STG_TYPE_DEFAULT', BX_DOL_STUDIO_STG_TYPE_SYSTEM);

define('BX_DOL_STUDIO_STG_GROUP_SYSTEM', 'system');
define('BX_DOL_STUDIO_STG_GROUP_MODULES', 'modules');
define('BX_DOL_STUDIO_STG_GROUP_LANGUAGES', 'languages');
define('BX_DOL_STUDIO_STG_GROUP_TEMPLATES', 'templates');

define('BX_DOL_STUDIO_STG_CATEGORY_SYSTEM', 'system');
define('BX_DOL_STUDIO_STG_CATEGORY_LANGUAGES', 'languages');
define('BX_DOL_STUDIO_STG_CATEGORY_TEMPLATES', 'templates');
define('BX_DOL_STUDIO_STG_CATEGORY_AUDIT', 'audit');

define('BX_DOL_STUDIO_STG_MIX_SYSTEM', 'system');
define('BX_DOL_STUDIO_STG_MIX_DEFAULT', BX_DOL_STUDIO_STG_MIX_SYSTEM);

class BxDolStudioOptions extends BxDol
{
    protected $oDb;
    protected $sParamPrefix;
    protected $sBaseUrl;

    protected $sType;
    protected $sCategory;
    protected $aCategories;
    protected $aCustomCategories;

    protected $bManage;     //--- Enable/Disable Manage panel for system settings.
    protected $bReadOnly;   //--- Enable/Disable ReadOnly mode for system settings. Note. It doesn't affect Editable mixes.

    protected $bMixes;	//--- Enable/Disable mixes feature.
    protected $sMix;
    protected $aMix;

    protected $sStorage;
    protected $sTranscoder;

    protected $sErrorMessage;

    function __construct($sType = '', $mixedCategory = '', $sMix = '')
    {
        parent::__construct();

        $this->oDb = new BxDolStudioOptionsQuery();

        $this->sParamPrefix = 'opt';
        $this->sBaseUrl = BX_DOL_URL_STUDIO . 'options.php';

        $this->sType = BX_DOL_STUDIO_STG_TYPE_DEFAULT;
        if(!empty($sType) && is_string($sType))
            $this->sType = $sType;

        $this->sCategory = '';
        if(!empty($mixedCategory)) {
            if(is_array($mixedCategory))
                $this->sCategory = $mixedCategory;
            else if(is_string($mixedCategory)) {
                //--- Serialized array
                if(preg_match('/^a:[\d+]:\{/', $mixedCategory))
                    $this->sCategory = json_decode($mixedCategory, true);

                //--- Comma separated list
                if(empty($this->sCategory) && strpos($mixedCategory, ',') !== false)
                    $this->sCategory = explode(',', $mixedCategory);

                if(empty($this->sCategory))
                    $this->sCategory = $mixedCategory;
            }
        }

        $this->bManage = false;
        $this->bReadOnly = false;

        $this->bMixes = false;
        $this->sMix = $sMix;
        $this->aMix = [];

        $this->sStorage = 'sys_images_custom';
        $this->sTranscoder = 'sys_custom_images';

        $this->sErrorMessage = '';
    }

    public function checkAction()
    {
        $sAction = bx_get($this->sParamPrefix . '_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $sValue = '';
        if(bx_get($this->sParamPrefix . '_value') !== false)
            $sValue = bx_process_input(bx_get($this->sParamPrefix . '_value'));

        $aResult = ['code' => 0, 'message' => ''];
        switch($sAction) {
            case 'import':
                $aResult = array_merge($aResult, $this->getPopupCodeImport('settings'));
                break;

            case 'export':
                $aResult = array_merge($aResult, $this->export());
                break;

            case 'download':
                $aResult = array_merge($aResult, $this->download());
                break;

            case 'select-mix':
                $aResult = array_merge($aResult, $this->selectMix($sValue));
                break;

            case 'create-mix':
                $aResult = array_merge($aResult, $this->getPopupCodeCreateMix());
                break;

            case 'import-mix':
                $aResult = array_merge($aResult, $this->getPopupCodeImportMix());
                break;

            case 'export-mix':
                $aResult = array_merge($aResult, $this->exportMix((int)$sValue));
                break;

            case 'download-mix':
                $aResult = array_merge($aResult, $this->downloadMix((int)$sValue));
                break;

            case 'publish-mix':
                $aResult = array_merge($aResult, $this->publishMix((int)$sValue));
                break;

            case 'hide-mix':
                $aResult = array_merge($aResult, $this->hideMix((int)$sValue));
                break;

            case 'delete-mix':
                $aResult = array_merge($aResult, $this->deleteMix((int)$sValue));
                break;

            case 'get-page-by-type':
                $this->sType = $sValue;
                $aResult['content'] = $this->getPageCode();
                break;
        }

        return $aResult;
    }

    public function getType()
    {
        return $this->sType;
    }

    public function enableManage($bManage = true)
    {
    	$this->bManage = $bManage;
    }

    public function enableReadOnly($bReadOnly = true)
    {
    	$this->bReadOnly = $bReadOnly;
    }

    public function enableMixes($bMixes = true)
    {
    	$this->bMixes = $bMixes;
    }

    public function export()
    {
        return [
            'url' => bx_append_url_params($this->sBaseUrl, [
                $this->sParamPrefix . '_action' => 'download',
            ]),
            'eval' => $this->getJsObject() . '.onExport(oData);'
        ];
    }

    public function download()
    {
        $sType = 'settings';
        $mixedFull = false;
        $aOptionsExclude = ['sys_revision', 'sys_cron_time', 'sys_eq_time', 'sys_push_queue_time'];

        $aTypes = [];
        $this->oDb->getTypes(['type' => 'all'], $aTypes, false);
        if(empty($aTypes) || !is_array($aTypes))
            BxDolStudioTemplate::getInstance()->displayPageNotFound();

        $aListTypes = [];
        foreach($aTypes as $aType) {
            $aCategories = [];
            $this->oDb->getCategories(['type' => 'by_type_id_key_name', 'value' => $aType['id']], $aCategories, false);
            if(empty($aCategories) || !is_array($aCategories))
                continue;

            $aListCategories = [];
            foreach($aCategories as $aCategory) {
                $aOptions = [];
                $this->oDb->getOptions(['type' => 'by_category_id', 'value' => $aCategory['id'], 'for_export' => 1, 'exclude' => $aOptionsExclude], $aOptions, false);
                if(empty($aOptions) || !is_array($aOptions))
                    continue;

                $aListCategories[] = [
                    'name' => $aCategory['name'],
                    'options' => $aOptions
                ];
            }

            $aListTypes[] = [
                'name' => $aType['name'],
                'categories' => $aListCategories
            ];
        }

        $iNow = time();
    	$sContent = json_encode([
            'meta' => [
                'version' => bx_get_ver(),
                'type' => $sType,
                'full' => $mixedFull,
                'date' => date('D, d M Y H:i:s', $iNow),
            ],
            'data' => [
                'types' => $aListTypes
            ]
    	]);

    	header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Content-type: application/json");
        header("Content-Length: " . strlen($sContent));
        header("Content-Disposition: attachment; filename=\"" . $sType . ($mixedFull ? "_f" : "") . "_" . date('d_m_Y', $iNow) . ".json\"");

        echo $sContent;
        exit;
    }

    public function selectMix($sName)
    {
        $this->oDb->updateMixes(['active' => 0], [
            'type' => $this->sType,
            'category' => is_string($this->sCategory) ? $this->sCategory : '',
            'active' => 1
        ]);

        $aResult = [];
        if($sName == BX_DOL_STUDIO_STG_MIX_SYSTEM || $this->oDb->updateMixes(['active' => 1], ['name' => $sName])) {
            $this->clearCache();

            $aResult = ['eval' => $this->getJsObject() . '.onMixSelect(oData);'];
        }
        else 
            $aResult = ['message' => _t('_adm_stg_err_cannot_perform')];

        return $aResult;
    }

    public function exportMix($iId)
    {
    	$aMix = [];
    	$this->oDb->getMixes(['type' => 'by_id', 'value' => $iId], $aMix, false);
    	if(empty($aMix) || !is_array($aMix))
            return array('message' => _t('_adm_stg_err_cannot_perform'));

        return [
            'url' => bx_append_url_params($this->sBaseUrl, [
                $this->sParamPrefix . '_action' => 'download-mix',
                $this->sParamPrefix . '_value' => $iId,
            ]),
            'eval' => $this->getJsObject() . '.onMixExport(oData);'
        ];
    }

    public function downloadMix($iId)
    {
    	$aMix = [];
    	$this->oDb->getMixes(['type' => 'by_id', 'value' => $iId], $aMix, false);
    	if(empty($aMix) || !is_array($aMix))
            BxDolStudioTemplate::getInstance()->displayPageNotFound();

        $aOptions = [];
        $this->oDb->getMixesOptions(['type' => 'by_mix_id_pair_option_value', 'value' => $iId, 'for_export' => 1], $aOptions, false);

    	$sContent = json_encode([
            'mix' => [
                'type' => $aMix['type'],
                'category' => $aMix['category'],
                'name' => $aMix['name'],
                'title' => $aMix['title']
            ],
            'options' => $aOptions
    	]);

    	header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Content-type: application/json");
        header("Content-Length: " . strlen($sContent));
        header("Content-Disposition: attachment; filename=\"". strtolower($aMix['name']) . ".json\"");

        echo $sContent;
        exit;
    }

    public function publishMix($iId)
    {
    	$aResult = [];
        if($this->oDb->updateMixes(['published' => 1], ['id' => $iId])) {
            $this->clearCache();

            $aResult = ['eval' => $this->getJsObject() . '.onMixPublish(oData);'];
        }
        else 
            $aResult = ['message' => _t('_adm_stg_err_cannot_perform')];

        return $aResult;
    }

    public function hideMix($iId)
    {
    	$aResult = [];
        if($this->oDb->updateMixes(['published' => 0], ['id' => $iId])) {
            $this->clearCache();

            $aResult = ['eval' => $this->getJsObject() . '.onMixHide(oData);'];
        }
        else 
            $aResult = ['message' => _t('_adm_stg_err_cannot_perform')];

        return $aResult;
    }

    public function deleteMix($iId)
    {
    	$aResult = [];
    	if($this->oDb->deleteMixesOptions(['mix_id' => $iId]) && $this->oDb->deleteMixes(['id' => $iId])) {
    	    $this->clearCache();

            $aResult = ['eval' => $this->getJsObject() . '.onMixDelete(oData);'];
    	}
    	else 
            $aResult = ['message' => _t('_adm_stg_err_cannot_perform')]; 

    	return $aResult;
    }

    public function saveChanges(&$oForm)
    {
    	$iMixId = $oForm->getCleanValue('mix_id');
        $aCategories = explode(',', $oForm->getCleanValue('categories'));
        $sEvalRenewToken = $this->getJsObject() . ".onSubmitted('" . $oForm->getId() . "', '" . $oForm->getCsrfToken() . "', oData);";

        foreach ($aCategories as $sCategory) {
            $aOptions = [];
            $iOptions = $this->oDb->getOptions(['type' => 'by_category_name_full', 'value' => $sCategory], $aOptions);

            $aData = [];
            foreach($aOptions as $aOption) {
                $aData[$aOption['name']] = $this->getSubmittedValue($aOption, $oForm);
                if($aData[$aOption['name']] === false && !empty($this->sErrorMessage)) {
                    $this->sCategory = $sCategory;
                    return bx_get_js_result([
                        'code' => 1,
                        'message' => _t('_adm_stg_err_save_error_message', _t($aOption['caption']), _t($this->sErrorMessage)),
                        'translate' => false,
                        'eval' => $sEvalRenewToken
                    ]);
                }

                if(!empty($aOption['check'])) {
                    $sCheckerHelper = '';
                    if(!empty($aOption['type_name']) && BxDolRequest::serviceExists($aOption['type_name'], 'get_settings_checker_helper'))
                        $sCheckerHelper = BxDolService::call($aOption['type_name'], 'get_settings_checker_helper');

                    if($sCheckerHelper == '') {
                        bx_import('BxDolStudioForm');
                        $sCheckerHelper = 'BxDolStudioFormCheckerHelper';
                    }

                    $oChecker = new $sCheckerHelper();
                    $aCheckFunction = [$oChecker, 'check' . bx_gen_method_name($aOption['check'])];
                    $aCheckFunctionParams = [$aData[$aOption['name']]];
                    if(!empty($aOption['check_params']))
                        $aCheckFunctionParams = array_merge($aCheckFunctionParams, array_values(unserialize($aOption['check_params'])));

                    if(is_callable($aCheckFunction) && !call_user_func_array($aCheckFunction, $aCheckFunctionParams)) {
                        $this->sCategory = $sCategory;
                        return bx_get_js_result([
                            'code' => 2,
                            'message' => _t('_adm_stg_err_save_error_message', _t($aOption['caption']), _t($aOption['check_error'])), 
                            'translate' => false, 
                            'eval' => $sEvalRenewToken
                        ]);
                    }
                }

                if(isset($aData[$aOption['name']]))
                    $aData[$aOption['name']] = $this->getProcessedValue($aOption, $aData[$aOption['name']]);
                else
                    $aData[$aOption['name']] = $this->getEmptyValue($aOption);

                $mixedValue = $this->oDb->getParam($aOption['name']);
                if($this->oDb->setParam($aOption['name'], $aData[$aOption['name']], $iMixId)) {
                    $aCategoryInfo = [];
                    $this->oDb->getCategories(['type' => 'by_name', 'value' => $sCategory], $aCategoryInfo, false);

                    bx_alert('system', 'save_setting', 0, 0, [
                        'category' => $aCategoryInfo, 
                        'option' => $aOption['name'], 
                        'value' => $aData[$aOption['name']],
                        'value_prior' => $mixedValue
                    ]);
                }
            }
        }

        $this->clearCache();
        return bx_get_js_result([
            'code' => 0,
            'message' => '_adm_stg_scs_save',
            'eval' => $sEvalRenewToken
        ]);
    }

    protected function isReadOnly()
    {
    	$bMix = !empty($this->aMix);
    	return (!$bMix && $this->bReadOnly) || ($bMix && (int)$this->aMix['editable'] == 0);
    }

    protected function getSubmittedValue($aOption, &$oForm)
    {
    	$mixedValue = '';

    	switch($aOption['type']) {
            case 'image':
                $mixedValue = (int)getParam($aOption['name']);

                $mixedIds = $oForm->getCleanValue($aOption['name']);
                if(empty($mixedIds)) {
                    if(!empty($mixedValue))
                        $mixedValue = 0;

                    break;
                }

                $oStorage = BxDolStorage::getObjectInstance($this->sStorage);
                if(!$oStorage)
                    break;

                //--- Concatenation integer values as strings is required to get unique content id
                $iContentId = (int)($aOption['id'] . (int)$oForm->getCleanValue('mix_id'));
                $iImageId = is_array($mixedIds) ? (int)array_shift($mixedIds) : (int)$mixedIds;

                $oStorage->updateGhostsContentId($iImageId, false, $iContentId);
                $mixedValue = $iImageId;
                break;

            default: 
                $mixedValue = $oForm->getCleanValue($aOption['name']);
    	}

    	return $mixedValue;
    }

    protected function getProcessedValue($aOption, $mixedValue)
    {
        $sMethod = 'processCustomValue' . bx_gen_method_name(trim(str_replace($this->sType, '', $aOption['name']), '_'));
    	if(method_exists($this, $sMethod))
    	    return $this->$sMethod($aOption, $mixedValue);

        switch($aOption['type']) {
            case 'secret':
                if(strcmp(bx_gen_secret($aOption['value']), $mixedValue) == 0)
                    $mixedValue = $aOption['value'];
                break;

            default:
                if(is_array($mixedValue))
                    $mixedValue = implode(',', $mixedValue);
        }

        return $mixedValue;
    }

    protected function getEmptyValue($aOption)
    {
        $mixedValue = '';

        switch($aOption['type']) {
            case 'digit':
                $mixedValue = 0;
                break;

            case 'select':
                if (BxDolService::isSerializedService($aOption['extra']))
                    $aValues = BxDolService::callSerialized($aOption['extra']);
                else
                    $aValues = explode(',', $aOption['extra']);
                $mixedValue = $aValues[0];
                break;

            case 'text':
            case 'checkbox':
            case 'file':
                $mixedValue = "";
                break;
        }

        return $mixedValue;
    }

    protected function clearCache()
    {
        BxDolDb::getInstance()->cacheParams(true, true);

        $oCacheUtilities = BxDolCacheUtilities::getInstance();
        $oCacheUtilities->clear('db');
        $oCacheUtilities->clear('css');
    }

    protected function getCustomValueCurrencySign($aItem, $mixedValue)
    {
        return htmlspecialchars($mixedValue);
    }

    protected function processCustomValueCurrencySign($aItem, $mixedValue)
    {
        return htmlspecialchars_decode($mixedValue);
    }
}

/** @} */
