<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry forms helper functions
 */
class BxBaseModGeneralFormsEntryHelper extends BxDolProfileForms
{
    protected $_oModule;

    protected $_bIsApi;
    protected $_bDynamicMode;

    /**
     * 'Ajax Mode' determines the format of response. If it's TRUE the response 
     * (a form or an error appeared during form creation) should be returned 
     * as text during initial loading, while all other responses appeared after 
     * form submit should be arrays, which are ready to path to echoJson.
     */
    protected $_bAjaxMode;

    /**
     * 'Valid Mode' allows to create content even if some fields values 
     * didn't pass checking. It's needed when content was created 
     * with a service call. For example, automatic profile creation after join.
     */
    protected $_bValidMode;

    /**
     * Use absolute Action URL in generated form object. 
     * It's needed in Ajax Mode.
     */
    protected $_bAbsoluteActionUrl;

    /**
     * Allows to process entity deletion using BxDolBackgroundJobs. 
     * It's needed for 'heavy' entities which performs different time consuming subtasks during deletion.
     */
    protected $_bDeleteInBackground;

    protected $_mixedContextId;    

    public function __construct($oModule)
    {
        parent::__construct();
        $this->_oModule = $oModule;

        $this->_bIsApi = bx_is_api();

        $this->_bDynamicMode = false;
        $this->_bDeleteInBackground = false;

        $this->_bAjaxMode = false;
        $mixedAjaxMode = bx_get('ajax_mode');
        if($mixedAjaxMode !== false)
            $this->setAjaxMode($mixedAjaxMode);

        $this->_bAbsoluteActionUrl = false;
        $mixedAbsoluteActionUrl = bx_get('absolute_action_url');
        if($mixedAbsoluteActionUrl !== false)
            $this->setAbsoluteActionUrl($mixedAbsoluteActionUrl);

        $this->_mixedContextId = false;
    }

    public function setAjaxMode($bAjaxMode)
    {
        $this->_bAjaxMode = (bool)$bAjaxMode;
        if($this->_bAjaxMode)
            $this->setDynamicMode(true);
    }

    public function setValidMode($bValidMode)
    {
        $this->_bValidMode = (bool)$bValidMode;
    }

    public function setAbsoluteActionUrl($bAbsoluteActionUrl)
    {
        $this->_bAbsoluteActionUrl = (bool)$bAbsoluteActionUrl;
    }

    public function setContextId($mixedContextId)
    {
        $this->_mixedContextId = is_numeric($mixedContextId) ? (int)$mixedContextId : (bool)$mixedContextId;
    }

    public function setDynamicMode($bDynamicMode)
    {
        $this->_bDynamicMode = (bool)$bDynamicMode;
    }

    public function getObjectStorage()
    {
        return BxDolStorage::getObjectInstance($this->_oModule->_oConfig->CNF['OBJECT_STORAGE']);
    }

    public function getObjectFormAdd ($sDisplay = false)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        if(false === $sDisplay)
            $sDisplay = $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'];

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sDisplay, $this->_oModule->_oTemplate);
        if($this->_bAjaxMode)
            $oForm->setAjaxMode($this->_bAjaxMode);

        if($this->_bAbsoluteActionUrl)
            $this->_setAbsoluteActionUrl('add', $oForm);

        return $oForm; 
    }

    public function getObjectFormEdit ($sDisplay = false)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        if(false === $sDisplay)
            $sDisplay = $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'];

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sDisplay, $this->_oModule->_oTemplate);
        if($this->_bAjaxMode)
            $oForm->setAjaxMode($this->_bAjaxMode);

        if($this->_bAbsoluteActionUrl)
            $this->_setAbsoluteActionUrl('edit', $oForm);

        return $oForm;
    }

    public function getObjectFormView ($sDisplay = false)
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        if (false === $sDisplay)
            $sDisplay = $CNF['OBJECT_FORM_ENTRY_DISPLAY_VIEW'];

        return BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sDisplay, $this->_oModule->_oTemplate);
    }

    public function getObjectFormDelete ($sDisplay = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (false === $sDisplay)
            $sDisplay = $CNF['OBJECT_FORM_ENTRY_DISPLAY_DELETE'];

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $sDisplay, $this->_oModule->_oTemplate);
        if($this->_bAjaxMode)
            $oForm->setAjaxMode($this->_bAjaxMode);

        if($this->_bAbsoluteActionUrl)
            $this->_setAbsoluteActionUrl('delete', $oForm);

        return $oForm;
    }

    public function viewDataEntry ($iContentId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sMsgCnt = '';
        // get content data and profile info
        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        if (!$aContentInfo)
            $sMsgCnt = _t('_sys_txt_error_entry_is_not_defined');

        // check access
        if (empty($sMsgCnt) && CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->_oModule->checkAllowedView($aContentInfo)))
            $sMsgCnt = $sMsg;
        
        if ($sMsgCnt)
            return bx_is_api() ? [bx_api_get_msg($sMsgCnt)] : MsgBox($sMsgCnt);

        $oForm = $this->getObjectFormView();
        if (!$oForm)
            return '';

        $oForm->initChecker($aContentInfo);

        if(!empty($CNF['FIELD_TEXT']) &&  !$oForm->isInputVisible($CNF['FIELD_TEXT']))
            $s = '';
        else
            $s = $this->_oModule->_oTemplate->entryText($aContentInfo);
        
        return bx_is_api() ? [bx_api_get_block('entity_text', $s)] : $s;
    }

    public function addData ($iProfile, $aValues, $sDisplay = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        // check and display form
        $oForm = $this->getObjectFormAdd($sDisplay);
        if (!$oForm)
            return array('code' => 1, 'message' => '_sys_txt_error_occured');

        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        if(!empty($oForm->aParams['db']['submit_name'])) {            
            $sSubmitName = false;
            if (is_array($oForm->aParams['db']['submit_name'])) {
                foreach ($oForm->aParams['db']['submit_name'] as $sVal) {
                    if (isset($oForm->aInputs[$sVal])) {
                        $sSubmitName = $sVal;
                        break;
                    }
                }
            } 
            else {
                $sSubmitName = $oForm->aParams['db']['submit_name'];
            }
            if ($sSubmitName && isset($oForm->aInputs[$sSubmitName]))
                $aValues[$sSubmitName] = $oForm->aInputs[$sSubmitName]['value'];
        }

        $oForm->initChecker([], $aValues);
        if($this->_bValidMode && !$oForm->isValid())
            $oForm->setValid(true);

        if(!$oForm->isSubmittedAndValid()) {
            $aErrors = array();
            array_walk($oForm->aInputs, function($aInput, $sKey) use (&$aErrors) {
                if(!empty($aInput['error']))
                    $aErrors[$sKey] = $aInput['error'];
            });

            return array('code' => 2, 'message' => '_sys_txt_error_occured', 'errors' => $aErrors);
        }

        // insert data into database
        $aValsToAdd = array ();
        if(isset($CNF['FIELD_AUTHOR']))
            $aValsToAdd[$CNF['FIELD_AUTHOR']] = $iProfile;

        $iContentId = $oForm->insert($aValsToAdd);
        if (!$iContentId) {
            if (!$oForm->isValid())
                return array('code' => 2, 'message' => '_sys_txt_error_occured');
            else
                return array('code' => 3, 'message' => '_sys_txt_error_entry_creation');
        }

        $sResult = $this->onDataAddAfter(BxDolProfile::getInstance($iProfile)->getAccountId(), $iContentId);
        if($sResult)
            return array('code' => 4, 'message' => $sResult);

        list($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        /*
         * Process metas.
         * Note. It's essential to process metas a the very end, 
         * because all data related to an entry should be already
         * processed and are ready to be passed to alert. 
         */
        $this->_oModule->processMetasAdd($iContentId);

        /*
         * Create alert about the completed action.
         */
        $this->_oModule->alertAfterAdd($aContentInfo);

        return array('code' => 0, 'message' => '', 'content' => $aContentInfo);
    }

    public function addDataForm ($sDisplay = false, $sCheckFunction = false)
    {
        if (!$sCheckFunction)
            $sCheckFunction = 'checkAllowedAdd';

        $CNF = &$this->_oModule->_oConfig->CNF;

        $bAsJson = false;

        // get form object
        $oForm = $this->getObjectFormAdd($sDisplay);
        if (!$oForm)
            return ($sMsg = '_sys_txt_error_occured') && $this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : $this->prepareResponse(MsgBox(_t($sMsg)), $bAsJson, 'msg');

        $bAsJson = $this->_bAjaxMode && $oForm->isSubmitted();
        // check access
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->_oModule->$sCheckFunction())) {
            if (($oProfile = BxDolProfile::getInstance()) !== false && ($aProfileInfo = $oProfile->getInfo()) && $aProfileInfo['type'] == 'system' && is_subclass_of($this->_oModule, 'BxBaseModProfileModule') && $this->_oModule->serviceActAsProfile()) // special check for system profile is needed, because of incorrect error message
                return ($sMsg = '_sys_txt_access_denied') && $this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : $this->prepareResponse(MsgBox(_t($sMsg)), $bAsJson, 'msg');
            else
                return $this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : $this->prepareResponse(MsgBox($sMsg), $bAsJson, 'msg');
        }

        // check and display form
        $oForm->initChecker();
        if (!$oForm->isSubmittedAndValid()) {
            if(!$oForm->isSubmitted() && isset($CNF['FIELD_ALLOW_VIEW_TO']) && ($oProfile = BxDolProfile::getInstance()) !== false && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
                $oPrivacy->deleteGroupCustomByProfileIdUnused($oProfile->id());

            return $this->_bIsApi ? $this->prepareResponseAPI('form', $oForm->getCodeAPI(), ['request_uri' => 'entity_create']) : $this->prepareResponse($oForm->getCode($this->_bDynamicMode), $bAsJson, 'form', [
            	'form_id' => $oForm->getId()
            ]);
        }

        // insert data into database
        $aValsToAdd = array ();
        $iContentId = $oForm->insert ($aValsToAdd);
        if (!$iContentId) {
            if (!$oForm->isValid())
                return $this->_bIsApi ? $this->prepareResponseAPI('form', $oForm->getCodeAPI(), ['request_uri' => 'entity_create']) : $this->prepareResponse($oForm->getCode($this->_bDynamicMode), $bAsJson, 'form', [
                    'form_id' => $oForm->getId()
                ]);
            else
                return ($sMsg = '_sys_txt_error_entry_creation') && $this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : $this->prepareResponse(MsgBox(_t($sMsg)), $bAsJson, 'msg');
        }

        $sResult = $this->onDataAddAfter (getLoggedId(), $iContentId);
        if ($sResult)
            return $this->_bIsApi ? $this->prepareResponseAPI('msg', $sResult) : $this->prepareResponse($sResult, $bAsJson, 'msg');

        list($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        /*
         * Process metas.
         * Note. It's essential to process metas a the very end, 
         * because all data related to an entry should be already
         * processed and are ready to be passed to alert. 
         */
        $this->_oModule->processMetasAdd($iContentId);

        // Perform ACL action
        $this->_oModule->$sCheckFunction(true);

        // Create alert about the completed action.
        $this->_oModule->alertAfterAdd($aContentInfo);

        // Redirect
        if ($this->_bIsApi)
            return $this->redirectAfterAdd($aContentInfo);
        else
            $this->redirectAfterAdd($aContentInfo);
    }
            
    public function redirectAfterAdd($aContentInfo, $sUrl = '')
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        if ($sUrl == '')
            $sUrl = 'page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']];

        if(($mixedUrl = $this->_getRedirectFromContext('add', $aContentInfo)) !== false)
              $sUrl = $mixedUrl;

        /**
         * @hooks
         * @hookdef hook-bx_base_general-redirect_after_add '{module_name}', 'redirect_after_add' - hook to override redirect URL which is used after content creation
         * - $unit_name - module name
         * - $action - equals `redirect_after_add`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `ajax_mode` - [boolean] dynamic loading is used or not
         *      - `content` - [array] content info array as key&value pairs
         *      - `override_result` - [string] by ref, redirect URL, can be overridden in hook processing
         * @hook @ref hook-bx_base_general-redirect_after_add
         */
        bx_alert($this->_oModule->getName(), 'redirect_after_add', 0, false, [
            'ajax_mode' => $this->_bAjaxMode,
            'content' => $aContentInfo,
            'override_result' => &$sUrl,
        ]);

        if($this->_bIsApi)
            return !empty($sUrl) ? [bx_api_get_block('redirect', ['uri' => bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($sUrl))])] : [];

        if($this->_bAjaxMode) {
            echoJson($this->prepareResponse($sUrl, $this->_bAjaxMode, 'redirect'));
            exit;
        }
        else
            $this->_redirectAndExit($sUrl);
    }

    public function editDataForm ($iContentId, $sDisplay = false, $sCheckFunction = false, $bErrorMsg = true)
    {
        if (!$sCheckFunction)
            $sCheckFunction = 'checkAllowedEdit';

        $CNF = &$this->_oModule->_oConfig->CNF;

        // get content data and profile info
        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        if (!$aContentInfo)
            return $bErrorMsg && ($sMsg = '_sys_txt_error_entry_is_not_defined') ? ($this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : MsgBox(_t($sMsg))) : '';

        // check access
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->_oModule->$sCheckFunction($aContentInfo)))
            return $bErrorMsg ? ($this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : MsgBox($sMsg)) : '';

        // check and display form
        $oForm = $this->getObjectFormEdit($sDisplay);
        if (!$oForm)
            return $bErrorMsg && ($sMsg = '_sys_txt_error_occured') ? ($this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : MsgBox(_t($sMsg))) : '';

        $aSpecificValues = array();        
        if (!empty($CNF['OBJECT_METATAGS'])) {
            $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']);
            if ($oMetatags->locationsIsEnabled())
                $aSpecificValues = $oMetatags->locationGet($iContentId, empty($CNF['FIELD_LOCATION_PREFIX']) ? '' : $CNF['FIELD_LOCATION_PREFIX']);
        }

        $oForm->initChecker($aContentInfo, $aSpecificValues);
        if (!$oForm->isSubmittedAndValid())
            return $this->_bIsApi ? $this->prepareResponseAPI('form', $oForm->getCodeAPI(), ['request_uri' => 'entity_edit', 'request_params' => ['params' => [$iContentId, $oForm->aParams['display']]]]) : $oForm->getCode();

        // update data in the DB
        $aTrackTextFieldsChanges = null;

        $this->onDataEditBefore ($aContentInfo[$CNF['FIELD_ID']], $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm);

        if (!$oForm->update ($aContentInfo[$CNF['FIELD_ID']], array(), $aTrackTextFieldsChanges)) {
            if (!$oForm->isValid())
                return $this->_bIsApi ? $this->prepareResponseAPI('form', $oForm->getCodeAPI(), ['request_uri' => 'entity_edit', 'request_params' => ['params' => [$iContentId, $oForm->aParams['display']]]]) : $oForm->getCode();
            else
                return ($sMsg = '_sys_txt_error_entry_update') && $this->_bIsApi ? $this->prepareResponseAPI('msg', $sMsg) : MsgBox(_t($sMsg));
        }

        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        $sResult = $this->onDataEditAfter ($aContentInfo[$CNF['FIELD_ID']], $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm);
        if ($sResult)
            return $this->_bIsApi ? $this->prepareResponseAPI('msg', $sResult) : $sResult;

        /*
         * Process metas.
         * Note. It's essential to process metas a the very end, 
         * because all data related to an entry should be already
         * processed and are ready to be passed to alert. 
         */
        $this->_oModule->processMetasEdit($iContentId, $oForm);

        // Perform ACL action
        $this->_oModule->$sCheckFunction($aContentInfo, true);

        // Create alert about the completed action.
        $this->_oModule->alertAfterEdit($aContentInfo);

        // Redirect
        if ($this->_bIsApi)
            return $this->redirectAfterEdit($aContentInfo);
        else
            $this->redirectAfterEdit($aContentInfo);
    }

    /**
     * @return empty string on success or error message string on error
     */
    public function editData ($iContentId, $aValues, $sDisplay = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        // get content data and profile info
        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        if (!$aContentInfo)
            return _t('_sys_txt_error_entry_is_not_defined');

        // get display form
        $oForm = $this->getObjectFormEdit($sDisplay);
        if (!$oForm)
            return _t('_sys_txt_error_occured');

        foreach ($aValues as $k => $v) {
            if (!isset($oForm->aInputs[$k]))
                return _t('_sys_txt_forms_unknown_field_err', $k);
        }

        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $oForm->initChecker($aContentInfo, $aContentInfo);

        // before edit hook
        $aTrackTextFieldsChanges = null;
        $this->onDataEditBefore ($aContentInfo[$CNF['FIELD_ID']], $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm);

        // update data in the DB
        if (!$oForm->update ($aContentInfo[$CNF['FIELD_ID']], $aValues, $aTrackTextFieldsChanges)) {
            return _t('_sys_txt_error_entry_update');
        }

        // after edit hook
        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        $sResult = $this->onDataEditAfter ($aContentInfo[$CNF['FIELD_ID']], $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm);
        if ($sResult)
            return $sResult;

        /*
         * Process metas.
         * Note. It's essential to process metas a the very end, 
         * because all data related to an entry should be already
         * processed and are ready to be passed to alert. 
         */
        $this->_oModule->processMetasEdit($iContentId, $oForm);

        // Create alert about the completed action.
        $this->_oModule->alertAfterEdit($aContentInfo);

        return '';
    }

    protected function redirectAfterEdit($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($sUrl == '')
            $sUrl = 'page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $aContentInfo[$CNF['FIELD_ID']];

        if(($mixedUrl = $this->_getRedirectFromContext('edit', $aContentInfo)) !== false)
            $sUrl = $mixedUrl;

        /**
         * @hooks
         * @hookdef hook-bx_base_general-redirect_after_edit '{module_name}', 'redirect_after_edit' - hook to override redirect URL which is used after content changing
         * It's equivalent to @ref hook-bx_base_general-redirect_after_add
         * except `ajax_mode` parameter in $extra_params is missing
         * @hook @ref hook-bx_base_general-redirect_after_edit
         */
        bx_alert($this->_oModule->getName(), 'redirect_after_edit', 0, false, [
            'content' => $aContentInfo,
            'override_result' => &$sUrl,
        ]);

        if($this->_bIsApi)
            return !empty($sUrl) ? bx_api_get_block('redirect', ['uri' => bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($sUrl))]) : [];

        $this->_redirectAndExit($sUrl);
    }

    public function deleteDataForm ($iContentId, $sDisplay = false, $sCheckFunction = false)
    {
        if (!$sCheckFunction)
            $sCheckFunction = 'checkAllowedDelete';
        
        $CNF = &$this->_oModule->_oConfig->CNF;

        // get content data and profile info
        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        if (!$aContentInfo)
            return ($sMsg = '_sys_txt_error_entry_is_not_defined') && $this->_bIsApi ? bx_api_get_msg($sMsg) : MsgBox(_t($sMsg));

        // check access
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->_oModule->$sCheckFunction($aContentInfo)))
            return $this->_bIsApi ? bx_api_get_msg($sMsg) : MsgBox($sMsg);

        // check and display form
        $oForm = $this->getObjectFormDelete($sDisplay);
        if (!$oForm)
            return ($sMsg = '_sys_txt_error_occured') && $this->_bIsApi ? bx_api_get_msg($sMsg) : MsgBox(_t($sMsg));

        $oForm->initChecker($aContentInfo);
        if (!$oForm->isSubmittedAndValid())
            return $this->_bIsApi ? $oForm : $oForm->getCode();

        $bScheduled = false;
        if($this->_bDeleteInBackground)
            $bScheduled = $this->deleteDataInBackground($iContentId);

        if((!$this->_bDeleteInBackground || !$bScheduled) && ($sError = $this->deleteData($iContentId, $aContentInfo, $oProfile, $oForm)))
            return $this->_bIsApi ? bx_api_get_msg($sError) : MsgBox($sError);

        // perform action
        $this->_oModule->$sCheckFunction($aContentInfo, true);

        // redirect
        if (bx_is_api())
            return $this->redirectAfterDelete($aContentInfo);
        else
            $this->redirectAfterDelete($aContentInfo);
    }

    protected function redirectAfterDelete($aContentInfo, $sUrl = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($sUrl == '')
            $sUrl = $CNF['URL_HOME'];

        $aMarkers = array(
            'account_id' => getLoggedId(),
            'profile_id' => bx_get_logged_profile_id(),
        );

        /**
         * @hooks
         * @hookdef hook-bx_base_general-redirect_after_delete '{module_name}', 'redirect_after_delete' - hook to override redirect URL which is used after content deletion
         * It's equivalent to @ref hook-bx_base_general-redirect_after_add
         * except `markers` parameter was added to $extra_params. It allows to override an array of markers, which can be parsed in URL.
         * @hook @ref hook-bx_base_general-redirect_after_delete
         */
        bx_alert($this->_oModule->getName(), 'redirect_after_delete', 0, false, [
            'content' => $aContentInfo,
            'markers' => &$aMarkers,
            'markers_ref' => &$aMarkers,
            'override_result' => &$sUrl,
        ]);

        if($this->_bIsApi)
            return bx_api_get_block('redirect', ['uri' => bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($sUrl))]);

        $this->_redirectAndExit($sUrl, true, $aMarkers);
    }

    /**
     * Delete data entry
     * @param $iContentId entry id
     * @param $oForm optional content info array
     * @param $aContentInfo optional content info array
     * @param $oProfile optional content author profile
     * @return error string on error or empty string on success
     */
    public function deleteData ($iContentId, $aContentInfo = false, $oProfile = null, $oForm = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!$aContentInfo || !$oProfile)
            list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        if (!$aContentInfo)
            return _t('_sys_txt_error_entry_is_not_defined');

        if (!$oForm)
            $oForm = $this->getObjectFormDelete();

        if (!$oForm->delete ($aContentInfo[$CNF['FIELD_ID']], $aContentInfo))
            return _t('_sys_txt_error_entry_delete');

        // remove data from nested forms 
        $aNestedForms = BxDolFormQuery::getNestedFormObjects($oForm->aParams['object']);
        foreach ($aNestedForms as $aNestedForm) {
            BxDolFormQuery::deleteDataFromNestedForm($aNestedForm['table'], $iContentId);
        }
        
        if ($sResult = $this->onDataDeleteAfter ($aContentInfo[$CNF['FIELD_ID']], $aContentInfo, $oProfile))
            return $sResult;

        /**
         * @hooks
         * @hookdef hook-bx_base_general-deleted '{module_name}', 'deleted' - hook after content was deleted
         * - $unit_name - module name
         * - $action - equals `deleted`
         * - $object_id - content id
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `content` - [array] by ref, content info array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_base_general-deleted
         */
        $aAlertParams = [
            'content' => &$aContentInfo,
            'content_ref' => &$aContentInfo
        ];

        if(!empty($CNF['FIELD_ALLOW_VIEW_TO']) && isset($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]))
            $aAlertParams['privacy_view'] = $aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']];

        bx_alert($this->_oModule->getName(), 'deleted', $aContentInfo[$CNF['FIELD_ID']], false, $aAlertParams);

        return '';
    }

    public function deleteDataInBackground ($iContentId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sModule = $this->_oModule->getName();        
        $bResult = BxDolBackgroundJobs::getInstance()->add($sModule . '_delete_entity' . $iContentId, [$sModule, 'delete_entity', [$iContentId]]);
        if($bResult && ($sFldStatusAdmin = $CNF['FIELD_STATUS_ADMIN'] ?? false))
            $this->_oModule->_oDb->updateEntriesBy([$sFldStatusAdmin => 'deleting'], [$CNF['FIELD_ID'] => $iContentId]);

        return $bResult;
    }

    public function viewDataForm ($iContentId, $sDisplay = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        // get content data and profile info
        list ($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);
        if (!$aContentInfo)
            return $this->_bIsApi ? bx_api_get_msg('_sys_txt_error_entry_is_not_defined') : MsgBox(_t('_sys_txt_error_entry_is_not_defined'));

        // check access
        if ($sMsg = $this->_processPermissionsCheckForViewDataForm ($aContentInfo, $oProfile))
            return $this->_bIsApi ? bx_api_get_msg($sMsg) : MsgBox($sMsg);

        // get form
        $oForm = $this->getObjectFormView($sDisplay);
        if (!$oForm)
            return $this->_bIsApi ? bx_api_get_msg('_sys_txt_error_occured') : MsgBox(_t('_sys_txt_error_occured'));

        // process metatags
        $aSpecificValues =[];
        if (!empty($CNF['OBJECT_METATAGS']) && ($oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])) !== false) {
            if ($oMetatags->keywordsIsEnabled()) {
                $aFields = $oMetatags->metaFields($aContentInfo, $CNF, $CNF['OBJECT_FORM_ENTRY_DISPLAY_VIEW']);
                $oForm->setMetatagsKeywordsData($iContentId, $aFields, $oMetatags);
            }

            if ($oMetatags->locationsIsEnabled())
                $aSpecificValues = $oMetatags->locationGet($iContentId, empty($CNF['FIELD_LOCATION_PREFIX']) ? '' : $CNF['FIELD_LOCATION_PREFIX']);
        }        

        // display profile
        $oForm->initChecker($aContentInfo, $aSpecificValues);

        if ($this->_bIsApi)
            return ($aForm = $oForm->getCodeAPI()) ? [bx_api_get_block('entity_info', $aForm)] : [];
        
        return $oForm->getCode();
    }

    protected function _processPermissionsCheckForViewDataForm ($aContentInfo, $oProfile)
    {
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->_oModule->checkAllowedView($aContentInfo)))
            return $sMsg;

        return '';
    }

    public function onDataDeleteAfter ($iContentId, $aContentInfo, $oProfile)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
            $oPrivacy->deleteGroupCustomByContentId($iContentId);

        $sKey = 'FIELD_ALLOW_VIEW_TO';
        if(isset($CNF[$sKey], $aContentInfo[$CNF[$sKey]]) && ($iContextPid = (int)$aContentInfo[$CNF[$sKey]]) < 0) {
            $iContextPid = abs($iContextPid);
            if(($oContext = BxDolProfile::getInstance($iContextPid)) !== false) {
                $sModule = $oContext->getModule();
                $sMethod = 'on_content_deleted';
                if(bx_is_srv($sModule, $sMethod))
                    bx_srv($sModule, $sMethod, [$this->_oModule->getName(), $iContentId, $oContext->getContentId()]);
            }
        }

        $this->_oModule->_oDb->deletePolls(['content_id' => $iContentId]);

        bx_audit(
            $iContentId, 
            $this->_oModule->getName(), 
            '_sys_audit_action_detete_content',  
            $this->_oModule->_prepareAuditParams($aContentInfo)
        );
        
        return '';
    }

    public function onDataEditBefore ($iContentId, $aContentInfo, &$aTrackTextFieldsChanges, &$oProfile, &$oForm)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($CNF['FIELD_STATUS']) && isset($aContentInfo[$CNF['FIELD_STATUS']]) && $aContentInfo[$CNF['FIELD_STATUS']] == 'failed')
            $oForm->addTrackFields($CNF['FIELD_STATUS'], $aContentInfo);
    }

    public function onDataEditAfter ($iContentId, $aContentInfo, $aTrackTextFieldsChanges, $oProfile, $oForm)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        /*
         * Load update data.
         */
        list($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        if(isset($CNF['FIELD_PHOTO']))
            $oForm->processFiles ($CNF['FIELD_PHOTO'], $iContentId, false);

        if(isset($CNF['FIELD_STATUS']) && ($aTrackResult = $oForm->isTrackFieldChanged($CNF['FIELD_STATUS'], true)) !== false)
            if($aTrackResult['old'] == 'failed' && $aTrackResult['new'] == 'active')
                $this->_oModule->alertAfterAdd($aContentInfo);

        if(isset($CNF['FIELD_ALLOW_VIEW_TO']) && !empty($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
            $oPrivacy->reassociateGroupCustomWithContent($oProfile->id(), $iContentId, (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]);
        
        bx_audit(
            $iContentId, 
            $this->_oModule->getName(), 
            '_sys_audit_action_edit_content',  
            $this->_oModule->_prepareAuditParams($aContentInfo)
        );
        
        return '';
    }

    public function onDataAddAfter ($iAccountId, $iContentId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        list($oProfile, $aContentInfo) = $this->_getProfileAndContentData($iContentId);

        if(($oForm = $this->getObjectFormAdd()) !== false) {
            if(isset($CNF['FIELD_PHOTO']))
                $oForm->processFiles($CNF['FIELD_PHOTO'], $iContentId, true);
        }

        if(isset($CNF['FIELD_ALLOW_VIEW_TO']) && !empty($aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])) !== false)
            $oPrivacy->associateGroupCustomWithContent($oProfile->id(), $iContentId, (int)$aContentInfo[$CNF['FIELD_ALLOW_VIEW_TO']]);

        bx_audit(
            $iContentId, 
            $this->_oModule->getName(), 
            '_sys_audit_action_add_content',  
            $this->_oModule->_prepareAuditParams($aContentInfo)
        );
        
        return '';
    }

    protected function prepareCustomRedirectUrl($s, $aContentInfo)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oProfile = BxDolProfile::getInstanceByContentAndType($aContentInfo[$CNF['FIELD_ID']], $this->_oModule->getName());

        $aMarkers = array(
            '{profile_id}',
            '{content_id}',
            '{module}',
        );
        $aReplacements = array(
            $oProfile ? $oProfile->id() : 0,
            $aContentInfo[$CNF['FIELD_ID']],
            $this->_oModule->getName(),
        );
        $s = str_replace($aMarkers, $aReplacements, $s);

        $s = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($s));
        
        return $s;
    }
    
    protected function prepareResponse($mixedResponse, $bAsJson = false, $sKey = 'msg', $aAdditional = array())
    {
    	if(!$bAsJson)
            return $mixedResponse;

        $aResponse = array(
            $sKey => $mixedResponse,
            '_dt' => 'json'
        );

        if(!empty($aAdditional) && is_array($aAdditional))
            $aResponse = array_merge($aResponse, $aAdditional);

        return $aResponse;
    }
    
    protected function prepareResponseAPI($sType, $mixedData, $aParams = [])
    {
        $aResult = [];
        switch($sType) {
            case 'msg':
                $aResult = bx_api_get_msg($mixedData);
                break;

            case 'form':
                $sModule = $this->_oModule->getName();
                $sRequestUrl = '/api.php?r=' . $sModule . '/' . $aParams['request_uri'];
                if(!empty($aParams['request_params']) && is_array($aParams['request_params']))
                    $sRequestUrl = bx_append_url_params($sRequestUrl, $aParams['request_params']);

                $aResult = bx_api_get_block('form', $mixedData, [
                    'ext' => [
                        'name' => $sModule, 
                        'request' => ['url' => $sRequestUrl, 'immutable' => true]
                    ]
                ]);
                break;
        }
        
        return [$aResult];
    }

    protected function _setAbsoluteActionUrl($sType, &$oForm)
    {
        $sUri = $this->_oModule->_oConfig->getEntryUri($sType);
        if(!$sUri)
            return;

        $oForm->setAbsoluteActionUrl(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $sUri)));
    }

    protected function _getRedirectFromContext($sAction, $aContentInfo)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sKey = 'FIELD_ALLOW_VIEW_TO';
        if(empty($CNF[$sKey]) || !isset($aContentInfo[$CNF[$sKey]]) || (int)$aContentInfo[$CNF[$sKey]] >= 0) 
            return false;

        $iContextPid = abs($aContentInfo[$CNF[$sKey]]);
        $oContext = BxDolProfile::getInstance($iContextPid);
        if(!$oContext)
            return false;

        $sModuleContext = $oContext->getModule();
        $sMethodContext = 'on_content_' . $sAction . 'ed_redirect';
        if(!bx_is_srv($sModuleContext, $sMethodContext))
            return false;

        return bx_srv($sModuleContext, $sMethodContext, [$this->_oModule->getName(), $aContentInfo[$CNF['FIELD_ID']]]);
    }
}

/** @} */
