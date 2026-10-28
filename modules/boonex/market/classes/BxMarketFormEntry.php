<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Market Market
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxMarketFormEntry extends BxBaseModTextFormEntry
{
    protected $_bPhotoGhostCheckboxes;

    /*
     * Header Image and Icon fields shown in API forms only, the site sets them on view product page.
     */
    protected $_aImageFieldsApi;
    protected $_aContentInfoApi;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_market';
        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        /*
         * Disabled since Header Image and Icon uploaders were moved on view product page.
         */
        $this->_bPhotoGhostCheckboxes = false;

        $iProfileId = bx_get_logged_profile_id();

        if(isset($this->aInputs[$CNF['FIELD_TITLE']], $this->aInputs[$CNF['FIELD_NAME']])) {
            $sJsObject = $this->_oModule->_oConfig->getJsObject('form');

            $aMask = array('mask' => "javascript:%s.checkName(this, '%s', '%s');", $sJsObject, $CNF['FIELD_TITLE'], $CNF['FIELD_NAME']);
            if($this->aParams['display'] == $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT'] && bx_get('id') !== false) {
                $aMask['mask'] = "javascript:%s.checkName(this, '%s', '%s', %d);";
                $aMask[] = (int)bx_get('id');
            }

            $sOnBlur = call_user_func_array('sprintf', array_values($aMask)); 
            $this->aInputs[$CNF['FIELD_TITLE']]['attrs']['onblur'] = $sOnBlur;
            $this->aInputs[$CNF['FIELD_NAME']]['attrs']['onblur'] = $sOnBlur;
        }

        if(isset($this->aInputs[$CNF['FIELD_COVER_RAW']]))
            $this->aInputs[$CNF['FIELD_COVER_RAW']]['code'] = 1;

        if(isset($this->aInputs[$CNF['FIELD_FILE']])) {
            $this->aInputs[$CNF['FIELD_FILE']]['storage_object'] = $CNF['OBJECT_STORAGE_FILES'];
            $this->aInputs[$CNF['FIELD_FILE']]['uploaders'] =  !empty($this->aInputs[$CNF['FIELD_FILE']]['value']) ? unserialize($this->aInputs[$CNF['FIELD_FILE']]['value']) : $CNF['OBJECT_UPLOADERS'];
            $this->aInputs[$CNF['FIELD_FILE']]['images_transcoder'] = '';
            $this->aInputs[$CNF['FIELD_FILE']]['storage_private'] = 1;
            $this->aInputs[$CNF['FIELD_FILE']]['multiple'] = true;
            $this->aInputs[$CNF['FIELD_FILE']]['content_id'] = 0;
            $this->aInputs[$CNF['FIELD_FILE']]['ghost_template'] = '';
        }

        $bRecurring = $this->_oModule->_oDb->getParam($CNF['OPTION_ENABLE_RECURRING']) == 'on';
        if(!$bRecurring) {
            $this->aInputs[$CNF['FIELD_DURATION_RECURRING']]['type'] = 'hidden';
            $this->aInputs[$CNF['FIELD_PRICE_RECURRING']]['type'] = 'hidden';
            $this->aInputs[$CNF['FIELD_PRICE_RECURRING']]['value'] = 0;

            unset($this->aInputs[$CNF['FIELD_HEADER_BEG_RECURRING']]);
            unset($this->aInputs[$CNF['FIELD_HEADER_END_RECURRING']]);
        }

        $oPayment = BxDolPayments::getInstance();
        $bNoPayments = $this->_oModule->_oDb->getParam($CNF['PARAM_NO_PAYMENTS']) == 'on';

        if(isset($this->aInputs[$CNF['FIELD_WARNING_SINGLE']])) {
            if(!$bNoPayments && !$oPayment->isAcceptingPayments($iProfileId, BX_PAYMENT_TYPE_SINGLE)) 
                $this->aInputs[$CNF['FIELD_WARNING_SINGLE']]['value'] = MsgBox(_t($this->aInputs[$CNF['FIELD_WARNING_SINGLE']]['value'], $oPayment->getDetailsUrl()));
            else 
                unset($this->aInputs[$CNF['FIELD_WARNING_SINGLE']]);
        }

        if(isset($this->aInputs[$CNF['FIELD_WARNING_RECURRING']])) {
            if(!$bNoPayments && $bRecurring && !$oPayment->isAcceptingPayments($iProfileId, BX_PAYMENT_TYPE_RECURRING))
                $this->aInputs[$CNF['FIELD_WARNING_RECURRING']]['value'] = MsgBox(_t($this->aInputs[$CNF['FIELD_WARNING_RECURRING']]['value'], $oPayment->getDetailsUrl()));
            else 
                unset($this->aInputs[$CNF['FIELD_WARNING_RECURRING']]);
        }

        if(isset($this->aInputs[$CNF['FIELD_ALLOW_PURCHASE_TO']]))
            $this->aInputs[$CNF['FIELD_ALLOW_PURCHASE_TO']] = BxDolPrivacy::getGroupChooser($CNF['OBJECT_PRIVACY_PURCHASE']);

        $aDynamicGroups = array(
            array ('key' => '', 'value' => '----'),
            array ('key' => 'c', 'value' => _t('_bx_market_privacy_group_customers'))
        );

        if(isset($this->aInputs[$CNF['FIELD_ALLOW_COMMENT_TO']])) {
            $this->aInputs[$CNF['FIELD_ALLOW_COMMENT_TO']] = BxDolPrivacy::getGroupChooser($CNF['OBJECT_PRIVACY_COMMENT'], $iProfileId, array('dynamic_groups' => $aDynamicGroups));
            $this->aInputs[$CNF['FIELD_ALLOW_COMMENT_TO']]['db']['pass'] = 'Xss';
        }

        if(isset($this->aInputs[$CNF['FIELD_ALLOW_VOTE_TO']])) {
            $this->aInputs[$CNF['FIELD_ALLOW_VOTE_TO']] = BxDolPrivacy::getGroupChooser($CNF['OBJECT_PRIVACY_VOTE'], $iProfileId, array('dynamic_groups' => $aDynamicGroups));
            $this->aInputs[$CNF['FIELD_ALLOW_VOTE_TO']]['db']['pass'] = 'Xss';
        }

        if(isset($this->aInputs[$CNF['FIELD_SUBENTRIES']]) && $this->_oModule->checkAllowedSetSubentries() !== CHECK_ACTION_RESULT_ALLOWED)
            unset($this->aInputs[$CNF['FIELD_SUBENTRIES']]);

        $this->_aImageFieldsApi = [];
        $this->_aContentInfoApi = [];
        if($this->_bIsApi && $this->_oModule->checkAllowedSetCover() === CHECK_ACTION_RESULT_ALLOWED)
            $this->_addImageFieldsApi();
    }

    protected function _addImageFieldsApi()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(getParam($CNF['PARAM_USE_ICON']) == 'on')
            $this->_aImageFieldsApi[$CNF['FIELD_THUMB']] = '_bx_market_form_entry_input_pictures_use_as_thumb';
        $this->_aImageFieldsApi[$CNF['FIELD_COVER']] = '_bx_market_form_entry_input_pictures_use_as_cover';

        // Tells the app how to show and crop the image, field names differ between modules.
        $aImageTypes = [
            $CNF['FIELD_THUMB'] => 'picture',
            $CNF['FIELD_COVER'] => 'cover',
        ];

        $aInputs = [];
        foreach($this->_aImageFieldsApi as $sField => $sCaption)
            $aInputs[$sField] = [
                'type' => 'files',
                'name' => $sField,
                'caption' => _t($sCaption),
                'image_type' => $aImageTypes[$sField],
                'storage_object' => $CNF['OBJECT_STORAGE'],
                'uploaders' => $CNF['OBJECT_UPLOADERS'],
                'images_transcoder' => $CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'],
                'storage_private' => 0,
                'multiple' => false,
                'content_id' => 0,
                'ghost_template' => '',
            ];

        // Put them before product pictures.
        $iPos = array_search('pictures', array_keys($this->aInputs));
        if($iPos === false)
            $this->aInputs = array_merge($this->aInputs, $aInputs);
        else
            $this->aInputs = array_merge(array_slice($this->aInputs, 0, $iPos, true), $aInputs, array_slice($this->aInputs, $iPos, null, true));
    }

    public function getCodeAPI()
    {
        $aResult = parent::getCodeAPI();
        if(empty($this->_aImageFieldsApi) || empty($this->_aContentInfoApi) || empty($aResult['inputs']))
            return $aResult;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if(!$oStorage)
            return $aResult;

        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']);

        foreach($this->_aImageFieldsApi as $sField => $sCaption) {
            if(!isset($aResult['inputs'][$sField]) || !($iFileId = (int)($this->_aContentInfoApi[$sField] ?? 0)))
                continue;

            $aFile = $oStorage->getFile($iFileId);
            if(empty($aFile) || !is_array($aFile))
                continue;

            $sUrl = $oStorage->getFileUrlById($iFileId);
            $aResult['inputs'][$sField]['values_src'] = [[
                'storage_object' => $CNF['OBJECT_STORAGE'],
                'file_id' => $iFileId,
                'file_type' => $aFile['mime_type'],
                'file_name' => $aFile['file_name'],
                'file_icon' => $oTranscoder ? $oTranscoder->getFileUrl($iFileId) : $sUrl,
                'file_url' => $sUrl,
            ]];
            $aResult['inputs'][$sField]['value'] = (string)$iFileId;
        }

        return $aResult;
    }

    /**
     * Header Image and Icon ids submitted from API form: [field => file id], only for submitted fields.
     * A field with someone else's file id is skipped and keeps its value.
     */
    protected function _getImageFieldsApiValues($aContentInfo = [])
    {
        $aResult = [];
        foreach($this->_aImageFieldsApi as $sField => $sCaption) {
            $mixedValue = $this->getCleanValue($sField);
            if($mixedValue === false || $mixedValue === null)
                continue;

            if(!is_array($mixedValue))
                $mixedValue = $mixedValue !== '' ? explode(',', $mixedValue) : [];

            $iFileId = (int)array_pop($mixedValue);
            if(!$this->_oModule->isImageFileAllowed($iFileId, $aContentInfo))
                continue;

            $aResult[$sField] = $iFileId;
        }

        return $aResult;
    }

    function getCode($bDynamicMode = false)
    {
        $sCss = '';
    	$sJs = $this->_oModule->_oTemplate->addJs([
            'form.js'
        ], $bDynamicMode);

        $sCode = '';
        if($bDynamicMode)
            $sCode .= $sCss . $sJs;

        $sCode .= $this->_oModule->_oTemplate->getJsCode('form');
        $sCode .= parent::getCode($bDynamicMode);

        return $sCode;
    }

    function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($this->aInputs[$CNF['FIELD_SUBENTRIES']]) && !empty($aValues[$CNF['FIELD_ID']])) {
            $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION_SUBENTRIES']);
            if($oConnection)
                $this->aInputs[$CNF['FIELD_SUBENTRIES']]['value'] = $oConnection->getConnectedContent((int)$aValues[$CNF['FIELD_ID']]);
        }

        if(!empty($this->_aImageFieldsApi) && !empty($aValues[$CNF['FIELD_ID']]))
            $this->_aContentInfoApi = $aValues;

        return parent::initChecker($aValues, $aSpecificValues);
    }

    public function insert ($aValsToAdd = [], $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(isset($this->aInputs[$CNF['FIELD_NAME']])) {
            $sName = BxDolForm::getSubmittedValue($CNF['FIELD_NAME'], $this->aFormAttrs['method'], $this->_aSpecificValues);
            if(!$sName && isset($this->aInputs[$CNF['FIELD_TITLE']]))
                $sName = BxDolForm::getSubmittedValue($CNF['FIELD_TITLE'], $this->aFormAttrs['method'], $this->_aSpecificValues);

            $sName = $this->_oModule->_oConfig->getEntryName($sName);

            BxDolForm::setSubmittedValue($CNF['FIELD_NAME'], $sName, $this->aFormAttrs['method'], $this->_aSpecificValues);
        }

        if($this->_oModule->checkAllowedSetCover() === CHECK_ACTION_RESULT_ALLOWED) {
            $aCover = isset($_POST[$CNF['FIELD_COVER']]) ? bx_process_input ($_POST[$CNF['FIELD_COVER']], BX_DATA_INT) : false;

            $aValsToAdd[$CNF['FIELD_COVER']] = 0;
            if(!empty($aCover) && is_array($aCover) && ($iFileCover = array_pop($aCover)) && $this->_oModule->isImageFileAllowed($iFileCover))
                $aValsToAdd[$CNF['FIELD_COVER']] = $iFileCover;
        }

        if(!empty($this->_aImageFieldsApi))
            $aValsToAdd = array_merge($aValsToAdd, $this->_getImageFieldsApiValues());

        $aPackage = bx_process_input(bx_get($CNF['FIELD_PACKAGE']), BX_DATA_INT);
        $aValsToAdd[$CNF['FIELD_PACKAGE']] = 0;
        if(!empty($aPackage) && is_array($aPackage) && ($iFilePackage = array_pop($aPackage)))
            $aValsToAdd[$CNF['FIELD_PACKAGE']] = $iFilePackage;

        $iContentId = parent::insert ($aValsToAdd, $isIgnore);
        if(!empty($iContentId)) {
            $this->processFiles($CNF['FIELD_FILE'], $iContentId, true, $CNF['OBJECT_STORAGE_FILES']);

            // Cover is processed by parent.
            if(isset($this->_aImageFieldsApi[$CNF['FIELD_THUMB']]))
                $this->processFiles($CNF['FIELD_THUMB'], $iContentId, true);
        }

        return $iContentId;
    }

    function update ($iContentId, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($sNameKey = $CNF['FIELD_NAME']) && isset($this->aInputs[$sNameKey])) {
            $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
            $bContentInfo = !empty($aContentInfo) && is_array($aContentInfo);

            $sName = $this->getCleanValue($sNameKey);
            if(!$sName) {
                if($bContentInfo && !empty($aContentInfo[$sNameKey])) {
                    $sName = $aContentInfo[$sNameKey];
                    BxDolForm::setSubmittedValue($sNameKey, $sName, $this->aFormAttrs['method'], $this->_aSpecificValues);
                }
                else if(($sTitleKey = $CNF['FIELD_TITLE']) && isset($this->aInputs[$sTitleKey]))
                    $sName = $this->getCleanValue($sTitleKey);
                else
                    $sName = 'ID' . time();
            }

            if($aContentInfo[$sNameKey] != $sName) {
                $sName = $this->_oModule->_oConfig->getEntryName($sName);
                BxDolForm::setSubmittedValue($sNameKey, $sName, $this->aFormAttrs['method'], $this->_aSpecificValues);
            }
        }

        // Submitted image ids are checked against the product: its current images and its author's files.
        $aContentInfoOld = $this->_oModule->_oDb->getContentInfoById($iContentId);
        if(empty($aContentInfoOld) || !is_array($aContentInfoOld))
            $aContentInfoOld = [];

        $aImagesApi = [];
        if(!empty($this->_aImageFieldsApi)) {
            $aImagesApi = $this->_getImageFieldsApiValues($aContentInfoOld);
            $aValsToAdd = array_merge($aValsToAdd, $aImagesApi);
        }
        else {
            $bSetImage = $this->_oModule->checkAllowedSetCover() === CHECK_ACTION_RESULT_ALLOWED; //--- Allow to set both Thumb and Cover.
            foreach(['FIELD_THUMB', 'FIELD_COVER'] as $sKey)
                if($bSetImage && ($aImage = bx_get($CNF[$sKey])) !== false) {
                    $aImage = bx_process_input($aImage, BX_DATA_INT);

                    $iFileImage = !empty($aImage) && is_array($aImage) ? (int)array_pop($aImage) : 0;
                    if($this->_oModule->isImageFileAllowed($iFileImage, $aContentInfoOld))
                        $aValsToAdd[$CNF[$sKey]] = $iFileImage;
                }
        }

        $aPackage = bx_process_input(bx_get($CNF['FIELD_PACKAGE']), BX_DATA_INT);
        $aValsToAdd[$CNF['FIELD_PACKAGE']] = 0;
        if(!empty($aPackage) && is_array($aPackage) && ($iFilePackage = array_pop($aPackage)))
            $aValsToAdd[$CNF['FIELD_PACKAGE']] = $iFilePackage;

        $iResult = parent::update ($iContentId, $aValsToAdd, $aTrackTextFieldsChanges);

        $this->processFiles($CNF['FIELD_FILE'], $iContentId, false, $CNF['OBJECT_STORAGE_FILES']);

        // Images change only with the saved product: on a failed save the old files stay in use.
        if($iResult !== false && !empty($aImagesApi)) {
            /*
             * API image fields have no content_id, so a file uploaded while editing is a ghost
             * with content_id = 0: associate it (only submitted ids are taken), otherwise
             * the ghost gets cleaned up and the field points to a deleted file.
             */
            foreach($aImagesApi as $sField => $iFileId)
                if($iFileId)
                    $this->processFiles($sField, $iContentId, true);

            // The same as BxMarketModule::actionUpdateImage does: drop the replaced file and the cover position.
            $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
            foreach($aImagesApi as $sField => $iFileId) {
                $iFileIdOld = (int)($aContentInfoOld[$sField] ?? 0);
                if($iFileIdOld == $iFileId)
                    continue;

                if($sField == $CNF['FIELD_COVER'])
                    $this->_oModule->serviceUpdateImagePosition($iContentId, $sField, '', '');

                // Keep the file if it's still used as the other image.
                $bUsed = false;
                foreach(array_keys($this->_aImageFieldsApi) as $sFieldOther)
                    if($sFieldOther != $sField && (int)($aImagesApi[$sFieldOther] ?? ($aContentInfoOld[$sFieldOther] ?? 0)) == $iFileIdOld)
                        $bUsed = true;

                // Never delete someone else's file, even if the product already points to it.
                if($iFileIdOld && !$bUsed && $oStorage && $this->_oModule->isImageFileOwner($iFileIdOld, $aContentInfoOld))
                    $oStorage->deleteFile($iFileIdOld);
            }
        }

        return $iResult;
    }

	function delete ($iContentId, $aContentInfo = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bResult = parent::delete($iContentId, $aContentInfo);
        if(!$bResult)
            return $bResult;

        // delete associated files
        if (!empty($CNF['OBJECT_STORAGE_FILES'])) {
            $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE_FILES']);
            if($oStorage)
                $oStorage->queueFilesForDeletionFromGhosts($aContentInfo[$CNF['FIELD_AUTHOR']], $iContentId);
        }

        // delete associations
        $bResult &= $this->_oModule->_oDb->deassociatePhotoWithContent($iContentId, 0);
        $bResult &= $this->_oModule->_oDb->deassociateFileWithContent($iContentId, 0);

        return $bResult;
    }

    protected function _associalFileWithContent($oStorage, $iFileId, $iProfileId, $iContentId, $sPictureField = '')
    {
        parent::_associalFileWithContent($oStorage, $iFileId, $iProfileId, $iContentId, $sPictureField);

        $sStorage = $oStorage->getObject();
        switch($sStorage) {
        	case $this->_oModule->_oConfig->CNF['OBJECT_STORAGE']:
                    $this->_oModule->_oDb->associatePhotoWithContent($iContentId, $iFileId, $this->getCleanValue('title-' . $iFileId));
                    break;

        	case $this->_oModule->_oConfig->CNF['OBJECT_STORAGE_FILES']:
                    $aParams = array(
                        'type' => $this->getCleanValue('type-' . $iFileId)        			
                    );

                    switch ($aParams['type']) {
                        case BX_MARKET_FILE_TYPE_VERSION:
                            $aParams = array_merge($aParams, array(
                                'version' => $this->getCleanValue('version-' . $iFileId),
                            ));
                            break;

                        case BX_MARKET_FILE_TYPE_UPDATE:
                            $aParams = array_merge($aParams, array(
                                'version' => $this->getCleanValue('version-from-' . $iFileId),
                                'version_to' => $this->getCleanValue('version-to-' . $iFileId),
                            ));
                            break;
                    }

                    $this->_oModule->_oDb->associateFileWithContent($iContentId, $iFileId, $aParams);
                    break;
        }
    }

    protected function _getPhotoGhostTmplVars($aContentInfo = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aResult = parent::_getPhotoGhostTmplVars($aContentInfo);

        if(!empty($aResult['bx_if:set_thumb']))
            $aResult['bx_if:set_thumb']['condition'] = $this->_bPhotoGhostCheckboxes && $aResult['bx_if:set_thumb']['condition'];

        return array_merge($aResult, [
            'thumb_id' => $aContentInfo[$CNF['FIELD_THUMB']] ?? 0,
            'cover_id' => $aContentInfo[$CNF['FIELD_COVER']] ?? 0,
            'bx_if:set_cover' => [
                'condition' => $this->_bPhotoGhostCheckboxes && $this->_oModule->checkAllowedSetCover() === CHECK_ACTION_RESULT_ALLOWED,
                'content' => [
                    'name_cover' => $CNF['FIELD_COVER'],
                ]
            ]
        ]);
    }

    protected function _getFileGhostTmplVars($aContentInfo = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $aResult = parent::_getFileGhostTmplVars($aContentInfo);
        $aResult = array_merge($aResult, array(
            'thumb_id' => isset($aContentInfo[$CNF['FIELD_PACKAGE']]) ? $aContentInfo[$CNF['FIELD_PACKAGE']] : 0,
            'bx_if:set_thumb' => array (
                'condition' => true,
                'content' => array(
                    'name_thumb' => $CNF['FIELD_PACKAGE'],
                ),
            ),
        ));

    	return $aResult;
    }

    function genInputPrice(&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!isset($aInput['value_currency'])) {
            $iAuthorId = 0;
            if(!empty($this->_iContentId)) {
                $aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_iContentId);
                if(!empty($aContentInfo) || is_array($aContentInfo))
                    $iAuthorId = $aContentInfo[$CNF['FIELD_AUTHOR']];
            }
            else
                $iAuthorId = bx_get_logged_profile_id();

            $aInput['value_currency'] = BxDolPayments::getInstance()->getCurrencyCode($iAuthorId);
        }

        return parent::genInputPrice($aInput);
    }

    protected function genCustomInputSubentries ($aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aInput['ajax_get_suggestions'] = BX_DOL_URL_ROOT . $this->_oModule->_oConfig->getBaseUri() . 'get_subentries';
        $aInput['placeholder'] = _t('_bx_market_form_entry_input_subentries_placeholder');

        $sVals = '';
        if(!empty($aInput['value']) && is_array($aInput['value'])) {
            foreach($aInput['value'] as $iValue) {
                $iValue = (int)$iValue;
                if(!$iValue)
                    continue;

                $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iValue);
                if(empty($aContentInfo) || !is_array($aContentInfo))
                    continue;
                
               $sVals .= '<b class="val bx-def-color-bg-hl bx-def-round-corners">' . $aContentInfo[$CNF['FIELD_TITLE']] . '<i class="sys-icon times ltr:ml-1 rtl:mr-1"></i><input type="hidden" name="' . $aInput['name'] . '[]" value="' . $iValue . '" /></b>';
            }
            $sVals = trim($sVals, ',');
        }
        $aInput['value'] = $sVals;

        return $this->genCustomInputUsernamesSuggestions($aInput);
    }
}

/** @} */
