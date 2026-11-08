<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Uploaders are disigned to work as form field in forms. @see BxDolForm.
 *
 *
 * To add file to any form, use the following form field array:
 * @code
 * 'attachment' => array(
 *     'type' => 'files', // this is new form type, which enable upholders automatically
 *     'storage_object' => 'sample', // the storage object, where uploaded files are going to be saved
 *     'images_transcoder' => 'sample2', // images transcoder object to use for images preview
 *     'uploaders' => array ('sys_simple', 'sys_html5'), // the set of uploaders to use to upload files
 *     'upload_buttons_titles' => array('Simple' => 'Upload one by one', 'HTML5' => 'Upload several files in bulk'); // change default button titles, array with button names, or string to assign to all bnuttons
 *     'multiple' => true, // allow to upload multiple files per one upload
 *     'storage_private' => 0, // private or public storage (by default - private), if file is provate generated link will expire, for public storage the link is always persistent
 *     'content_id' => 4321, // content id to associate ghost files with
 *     'ghost_template' => $mixedGhostTemplate, // template for nested form
 *     'name' => 'attachment', // name of file form field, resulted file id is assigned to this field name
 *     'caption' => _t('Attachments'), // form field caption
 * ),
 * @endcode
 *
 *
 * Available uploaders:
 * - sys_simple - upload files using standard HTML forms.
 * - sys_html5 - upload files using AJAX uploader with multiple files selection support (without flash),
 *   it works in Firefox and WebKit(Safari, Chrome) browsers only, but has fallback for other browsers (IE, Opera).
 *
 *
 * Uploaded files are showed as "nested" forms.
 * You can pass nested form in 'ghost_template' parameter.
 * If you don't pass anything in 'ghost_template' parameter, then only file id is passed upon form submission.
 * The nested form can be declared using the different ways:
 *
 *
 * 1. Pass template as string - just plain string with HTML, for example:
 *
 * @code
 * <div id="bx-uploader-file-{storage_object}-{file_id}" class="bx-uploader-ghost">
 *     <div style="border:2px dotted green; padding:10px; margin-bottom:10px;">
 *         <input type="hidden" name="f[]" value="{file_id}" />
 *         {file_name} <br />
 *         <a href="javascript:void(0);" onclick="{js_instance_name}.deleteGhost('{file_id}')">delete</a>
 *     </div>
 * </div>
 * @endcode
 *
 *
 * 2. Pass form array - regular form array, but with inputs array only, for example:
 *
 * @code
 *  array (
 *      'inputs' => array (
 *          'file_name' => array (
 *              'type' => 'text',
 *              'name' => 'file_name[]',
 *              'value' => '{file_title}',
 *              'caption' => _t('Caption'),
 *          ),
 *          'file_desc' => array (
 *              'type' => 'textarea',
 *              'name' => 'file_desc[]',
 *              'caption' => _t('Description'),
 *          ),
 *      ),
 *  );
 * @endcode
 *
 * Array is automatically modified to add necessary form attributes to work as nested form,
 * file id field is added automatically as hidden input as well.
 *
 *
 * 3. Pass instance of BxDolFormNestedGhost class - use BxDolFormNestedGhost class or its custom subclass;
 * to create instance use the same form array as in the previous variant, for example:
 *
 * @code
 * $oFormNested = new BxDolFormNestedGhost('attachment', $aFormNested, 'do_submit');
 * @endcode
 *
 * - 'attachment' is the name of file form field from main form.
 * - $aFormNested is form array from previous example.
 * - 'do_submit' is main form submit_name; field name of submit form input to determine if form is submitted or not.
 *
 *
 * All 3 variants can have the following replace markers to substitute with real values:
 * - {file_id} - uploaded file id
 * - {file_name} - uploaded file name with extension
 * - {file_title} - uploaded file name without extension
 * - {file_icon} - URL to file icon automatically determined by file extension
 * - {file_url} - URL to the original file
 * - {js_instance_name} - instance of BxDolUploader javascript class
 *
 */
abstract class BxDolUploader extends BxDolFactory
{
    const UPLOAD_TOKEN_SALT = 'uploader';

    /** Max number of uploaders one restore_ghosts_batch request is answered for. */
    const GHOSTS_BATCH_MAX = 20;

    public static function isUploadTokenEnabled()
    {
        return getParam('sys_security_upload_token_enable') == 'on';
    }

    /** Max lifetime of a direct upload token, which isn't bound to a session. */
    const UPLOAD_TOKEN_DIRECT_MAX_LIFETIME = 900;

    public static function getUploadTokenLifetime($bDirect = false)
    {
        $iLifetime = max(60, (int)getParam('sys_security_upload_token_lifetime'));
        return $bDirect ? min($iLifetime, self::UPLOAD_TOKEN_DIRECT_MAX_LIFETIME) : $iLifetime;
    }

    /**
     * Issue an upload token.
     * A regular token is bound to the issuing session (browser forms).
     * A direct token ($bDirect) is for clients that post the file straight to api.php without cookies
     * (NEO direct uploads): it is bound to the profile instead of the session, lives shorter,
     * and is accepted only by the api.php upload service (see checkUploadToken).
     */
    public static function getUploadToken($sAction, $sStorageObject, $sUploaderObject = '', $aTranscoders = [], $bDirect = false)
    {
        $sSession = '';
        if (!$bDirect) {
            $oSession = BxDolSession::getInstance();
            $oSession->start(true);
            $sSession = $oSession->getId();
        }

        $aData = [
            'action' => $sAction,
            'storage' => $sStorageObject,
            'uploader' => $sUploaderObject,
            'session' => $sSession,
            'direct' => $bDirect ? 1 : 0,
            'profile_id' => (int)bx_get_logged_profile_id(),
            'transcoders' => array_values($aTranscoders),
        ];
        return BxDolKey::getInstance()->getNewKey($aData, self::getUploadTokenLifetime($bDirect), self::UPLOAD_TOKEN_SALT);
    }

    /**
     * Check an upload token. The token is not consumed: one form render serves several uploads
     * (multiple files, repeated uploads, editor images), so it works for any number of uploads
     * of its action, storage, uploader and session until it expires.
     * A direct token carries no session and is accepted only when $bAllowDirect is set.
     * @return token payload (with `profile_id`) or false
     */
    public static function checkUploadToken($sToken, $sAction, $sStorageObject, $sUploaderObject = '', $bAllowDirect = false)
    {
        if (!self::isUploadTokenEnabled() || !is_string($sToken) || $sToken === '')
            return false;

        $aData = BxDolKey::getInstance()->getKeyData($sToken, self::UPLOAD_TOKEN_SALT);
        if (!is_array($aData)
            || ($aData['action'] ?? '') !== $sAction
            || ($aData['storage'] ?? '') !== $sStorageObject
            || ($aData['uploader'] ?? '') !== $sUploaderObject)
            return false;

        if (!empty($aData['direct'])) {
            return $bAllowDirect ? $aData : false;
        }

        $oSession = BxDolSession::getInstance();
        $oSession->start(true);
        if (($aData['session'] ?? '') !== $oSession->getId())
            return false;

        return $aData;
    }

    protected $_bIsApi;
    protected $_oTemplate;

    protected $_iId; ///< object ID
    protected $_aObject; ///< object properties
    protected $_sStorageObject; ///< storage object name
    protected $_bMultiple;

    protected $_sUniqId; ///< uniq id used to generate UploaderJsInstance, ResultContainerId, UploadInProgressContainerId and PopupContainerId
    protected $_sUploaderJsInstance; ///< uplooader js object instance name
    protected $_sUploadInProgressContainerId; ///< container id where upload in progress element resides
    protected $_sPopupContainerId; ///< popup container id
    
    protected $_sResultContainerId; ///< uploading/uploaded objects container id
    protected $_sErrorsContainerId;
    protected $_sFormContainerId;

    protected $_sUploadErrorMessages; ///< upload error message

    protected $_sButtonTemplate; ///< template name for displaying upload button
    protected $_sJsTemplate; ///< template name for displaying upload JS
    protected $_sUploaderFormTemplate; ///< template name for displaying uploader form

    protected $_aJs;
    protected $_aCss;

    /**
     * constructor
     */
    protected function __construct($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        parent::__construct();
        $this->_bIsApi = bx_is_api();
        $this->_oTemplate = $oTemplate ? $oTemplate : BxDolTemplate::getInstance();

        $this->_iId = (int)$aObject['id'];
        $this->_aObject = $aObject;
        $this->_sStorageObject = $sStorageObject;
        $this->_bMultiple = true;

        $this->_sUniqId = $sUniqId;

        $this->_sUploaderJsInstance = 'glUploader_' . $sUniqId . '_' . $this->_aObject['object'];
        $this->_sUploadInProgressContainerId = 'bx-form-input-files-' . $sUniqId . '-upload-in-progress-' . $this->_aObject['object'];
        $this->_sPopupContainerId = 'bx-form-input-files-' . $sUniqId . '-popup-wrapper-' . $this->_aObject['object'];

        $this->_sResultContainerId = 'bx-form-input-files-' . $sUniqId . '-upload-result';
        $this->_sErrorsContainerId = 'bx-form-input-files-' . $sUniqId . '-errors';
        $this->_sFormContainerId = 'bx-form-input-files-' . $sUniqId . '-form-cont';

        $this->_aJs = ['BxDolUploader.js'];
        $this->_aCss = ['uploaders.css'];
    }

    static public function getObjectInstance($sObject, $sStorageObject, $sResultContainerId, $oTemplate = false)
    {
        $aObject = BxDolUploaderQuery::getUploaderObject($sObject);
        if (!$aObject || !is_array($aObject) || !$aObject['active'])
            return false;

        $sClass = $aObject['override_class_name'];
        if (!empty($aObject['override_class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);

        $o = new $sClass($aObject, $sStorageObject, $sResultContainerId, $oTemplate);

        if (!$o->isInstalled() || !$o->isAvailable())
            return false;

        return $o;
    }

    /**
     * Restore ghosts for several uploaders in one request (storage_uploader.php?a=restore_ghosts_batch).
     * Each item is what a single restore_ghosts request sends: uo (uploader object), so (storage object),
     * uid, img_trans, c (content id), m (multiple), l (latest only).
     * @param $aItems - list of items, at most GHOSTS_BATCH_MAX are processed
     * @param $iProfileId - profile to get orphaned files for
     * @return array of results in the same order as items: ghosts with order (['g' => ..., 'o' => ...]) or an empty array
     */
    static public function getGhostsForMany($aItems, $iProfileId)
    {
        $aResult = [];
        if(!is_array($aItems))
            return $aResult;

        foreach(array_slice(array_values($aItems), 0, self::GHOSTS_BATCH_MAX) as $aItem) {
            $aResult[] = self::_getGhostsForItem(is_array($aItem) ? $aItem : [], $iProfileId);
        }

        return $aResult;
    }

    static protected function _getGhostsForItem($aItem, $iProfileId)
    {
        $sUploaderObject = bx_process_input($aItem['uo'] ?? '');
        $sStorageObject = bx_process_input($aItem['so'] ?? '');
        $sUniqId = isset($aItem['uid']) && is_string($aItem['uid']) && preg_match("/^[\d\w]+$/", $aItem['uid']) ? $aItem['uid'] : '';
        if(!$sUploaderObject || !$sStorageObject || !$sUniqId || !is_string($sUploaderObject) || !is_string($sStorageObject))
            return [];

        if(!BxDolStorage::getObjectInstance($sStorageObject))
            return [];

        $oUploader = self::getObjectInstance($sUploaderObject, $sStorageObject, $sUniqId);
        if(!$oUploader)
            return [];

        if(isset($aItem['m']))
            $oUploader->setMultiple((bool)$aItem['m']);

        $mixedContentId = $aItem['c'] ?? '';
        $mixedContentId = '' === $mixedContentId || !is_scalar($mixedContentId) ? false : bx_process_input($mixedContentId, BX_DATA_INT);

        $sImagesTranscoder = isset($aItem['img_trans']) && is_string($aItem['img_trans']) ? bx_process_input($aItem['img_trans']) : '';

        $mixedGhosts = $oUploader->getGhostsWithOrder($iProfileId, 'array', $sImagesTranscoder, $mixedContentId, !empty($aItem['l']));

        return is_array($mixedGhosts) ? $mixedGhosts : [];
    }

    /**
     * Is uploader available?
     * @return boolean
     */
    public function isAvailable()
    {
        return $this->_aObject['active'] ? true : false;
    }

    /**
     * Are required php modules installed for this uploader ?
     * @return boolean
     */
    public function isInstalled()
    {
        return true;
    }

    public function isMultiple()
    {
        return $this->_bMultiple;
    }

    public function setMultiple($bMultiple)
    {
        $this->_bMultiple = (bool)$bMultiple;
    }

    public function getNameJsInstanceUploader()
    {
        return $this->_sUploaderJsInstance;
    }

    public function getIdContainerResult()
    {
        return $this->_sResultContainerId;
    }

    public function getIdContainerUploadInProgress()
    {
        return $this->_sUploadInProgressContainerId;
    }

    public function getIdContainerPopup()
    {
        return $this->_sPopupContainerId;
    }

    public function getIdContainerErrors()
    {
        return $this->_sErrorsContainerId;
    }

    /**
     * Handle uploads here.
     * @param $mixedFiles as usual $_FILES['some_name'] array, but maybe some other params depending on the uploader
     * @return nothing, but if some files failed to upload, the actual error message can be determined by calling BxDolUploader::getUploadErrorMessages()
     */
    public function handleUploads ($iProfileId, $mixedFiles, $isMultiple = true, $iContentId = false, $bPrivate = true)
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);       

        if(!$isMultiple)
            $this->deleteGhostsForProfile($iProfileId, [$iContentId, $this->_iId]);

        if($this->_bIsApi && $mixedFiles) {
            if(($iId = $oStorage->storeFileFromForm($mixedFiles, $bPrivate, $iProfileId, $iContentId)))
                $oStorage->updateGhostsUploaderId($iId, $this->_iId);

            return [
                'success' => 1, 
                'id' => $iId
            ];
        }

        if(($aMultipleFiles = $oStorage->convertMultipleFilesArray($mixedFiles)) === false)
            $aMultipleFiles = [$mixedFiles];

        foreach($aMultipleFiles as $aFile) {
            if(($iId = $oStorage->storeFileFromForm($aFile, $bPrivate, $iProfileId, $iContentId)))
                $oStorage->updateGhostsUploaderId($iId, $this->_iId);
            else 
                $this->appendUploadErrorMessage(_t('_sys_uploader_err_msg', $aFile['name'], $oStorage->getErrorString()));

            if(!$isMultiple)
                break;
        }

        echo '<script>window.parent.' . $this->getNameJsInstanceUploader() . '.onUploadCompleted(\'' . bx_js_string($this->getUploadErrorMessages(), BX_ESCAPE_STR_APOS) . '\');</script>';
    }

    public function getUploadErrorMessages ($sFormat = 'HTML')
    {
        if (!$this->_sUploadErrorMessages)
            return '';

        if ('HTML' == $sFormat)
            return nl2br($this->_sUploadErrorMessages);
        else
            return $this->_sUploadErrorMessages;
    }

    /**
     * Show uploader button.
     * @return HTML string
     */
    public function getUploaderButton($aParams = array())
    {
        return $this->_oTemplate->parseHtmlByName($this->_sButtonTemplate, $aParams);
    }
    
    public function getUploaderJsParams()
    {
        return [];
    }
    
    /**
     * Show uploader JS.
     * @return HTML string
     */
    public function getUploaderJs($mixedGhostTemplate, $isMultiple = true, $aParams = array(), $bDynamic = false)
    {
        $sJsValue = '';
        if(is_array($mixedGhostTemplate))
            $sJsValue = json_encode($mixedGhostTemplate);
        else
            $sJsValue = "'" . bx_js_string($mixedGhostTemplate, BX_ESCAPE_STR_APOS) . "'";

        $sJsObject = $this->getNameJsInstanceUploader();
        $sJsCode = $this->_oTemplate->parseHtmlByName($this->_sJsTemplate, array_merge([
            'uploader_instance_name' => $sJsObject,
            'engine' => $this->_aObject['object'],
            'storage_object' => $this->_sStorageObject,
            'images_transcoder' => '',
            'uniq_id' => $this->_sUniqId,
            'template_ghost' => $sJsValue,
            'multiple' => $isMultiple ? 1 : 0,
            'latest' => 0, //--- Return the latest one uploaded ghost only.
            'storage_private' => isset($aParams['storage_private']) ? $aParams['storage_private'] : 1,
            'upload_token' => isset($aParams['upload_token'])
                ? bx_js_string($aParams['upload_token'])
                : (self::isUploadTokenEnabled() ? bx_js_string(self::getUploadToken('upload', $this->_sStorageObject, $this->_aObject['object'])) : ''),
            'is_init_reordering' => isset($aParams['is_init_reordering']) ? $aParams['is_init_reordering'] : 0,
            'bx_if:restore_ghosts' => [
                'condition' => isset($aParams['is_init_ghosts']) ? $aParams['is_init_ghosts'] : 1,
                'content' => [
                    'uploader_instance_name' => $sJsObject,
                    'is_init_reordering' => isset($aParams['is_init_reordering']) ? $aParams['is_init_reordering'] : 0,
                ]
            ],
            'on_upload_before' => 'false',
            'on_upload' => 'false',
            'on_restore_ghosts' => 'false'
        ], $aParams));

        if(!$bDynamic) {
            $this->_oTemplate->addJs($this->_aJs);
            $sJsCode = $this->_oTemplate->addJsCodeOnLoadWrapped($sJsCode);
        }
        else 
            $sJsCode = $this->_oTemplate->addJsPreloadedWrapped($this->_aJs, $sJsCode);

        return $this->addCssJs($bDynamic) . $sJsCode;
    }

    /**
     * add necessary js, css files and js translations
     */ 
    public function addCssJs($bDynamic = false)
    {
        $s = '';
        $s .= $this->_oTemplate->addCss($this->_aCss, $bDynamic);
        $s .= $this->_oTemplate->addJsTranslation([
            '_sys_uploader_confirm_leaving_page',
            '_sys_uploader_confirm_close_popup',
            '_sys_uploader_upload_canceled',
            '_sys_uploader_image_reposition_info',
        ], $bDynamic);
        return $bDynamic ? $s : '';
    }

    public function addJs($mixedFile)
    {
        if(!is_array($mixedFile))
            $mixedFile = [$mixedFile];

        foreach($mixedFile as $sFile)
            if(!in_array($sFile, $this->_aJs))
                $this->_aJs[] = $sFile;
    }

    public function addCss($mixedFile)
    {
        if(!is_array($mixedFile))
            $mixedFile = [$mixedFile];

        foreach($mixedFile as $sFile)
            if(!in_array($sFile, $this->_aCss))
                $this->_aCss[] = $sFile;
    }

    /**
     * Get uploader button title
     */
    public function getUploaderButtonTitle($mixed = false)
    {
        // it is overrided in child classes
    }

    /**
     * Show uploader form.
     * @return HTML string
     */
    public function getUploaderForm($isMultiple = true, $iContentId = false, $isPrivate = true)
    {
        // it is overrided in child classes
    }

    /**
     * Display uploaded, but not saved files - ghosts
     * @param $iProfileId - profile id to get orphaned files from
     * @param $sFormat - output format, only 'json' output formt is supported
     * @param $sImagesTranscoder - transcoder object for files preview for images and videos, false by default - no preview
     * @param $mixedContent - int Content ID | array Content ID + Uploader ID | false to not consider content id at all
     * @return JSON string
     */
    public function getGhosts($iProfileId, $sFormat, $sImagesTranscoder = false, $mixedContent = false)
    {
        $iContent = (int)(is_array($mixedContent) ? reset($mixedContent) : $mixedContent);
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);

        $oImagesTranscoder = false;
        if($sImagesTranscoder)
            $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($sImagesTranscoder);

        $a = [];
        $aGhosts = $oStorage->getGhosts($this->isAdmin($iContent) && $iContent ? false : $iProfileId, $mixedContent);
        foreach($aGhosts as $aFile) {
            $sFileIcon = '';

            if($this->isUseTranscoderForPreview($oImagesTranscoder, $aFile))
                $sFileIcon = $oImagesTranscoder->getFileUrl($aFile['id']);

            if(!$sFileIcon)
                $sFileIcon = $this->_oTemplate->getIconUrl($oStorage->getIconNameByFileName($aFile['file_name']));

            $a[$aFile['id']] = array_merge([
            	'storage_object' => $this->_sStorageObject,
                'uploader_id' => $aFile['uploader_id'] ?? 0,
                'file_id' => $aFile['id'],
                'file_type' => $aFile['mime_type'],
                'file_name' => $aFile['file_name'],
                'file_title' => $oStorage->getFileTitle($aFile['file_name']),
                'file_icon' => $sFileIcon,
                'file_url' => $oStorage->getFileUrlById($aFile['id']),
                'file_remote_id' => $aFile['remote_id'],
                'file_created' => $aFile['created'],
                'js_instance_name' => $this->_sUploaderJsInstance,
            ], $this->getGhostTemplateVars($aFile, $iProfileId, $iContent, $oStorage, $oImagesTranscoder));
        }

        if('array' == $sFormat) {
            return $a;
        }
        else if('json' == $sFormat) {
            return json_encode($a);
        } 
        else { // html format is not suported for this data type
            return false;
        }
    }

    public function getGhostsWithOrder($iProfileId, $sFormat, $sImagesTranscoder = false, $mixedContent = false, $isLatestOnly = false)
    {
        $a = $this->getGhosts($iProfileId, 'array', $sImagesTranscoder, $mixedContent);
        if($isLatestOnly)
            $a = array_slice($a, 0, 1, true);

        if(!empty($a) && is_array($a))
            $a = ['g' => $a, 'o' => array_keys($a)];

        if ('json' == $sFormat) {
            return json_encode($a);
        } else { // html format is not suported for this data type
            return $a;
        }
    }
    
    /**
     * Reorder uploaded ghosts.
     * @param $iProfileId - profile id to get orphaned files from
     * @param $sFormat - output format, only 'json' output formt is supported
     * @param $aGhosts - an array of ordered ghosts' IDs.
     * @param $iContentId - content id to order orphaned files for, false by default
     * @return JSON string
     */
    public function reorderGhosts($iProfileId, $sFormat, $aGhosts, $iContentId = false)
    {
        $bResult = true;
        if(($oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject)) !== false)
            $bResult = $oStorage->reorderGhosts($this->isAdmin($iContentId) && $iContentId ? false : $iProfileId, $iContentId, $aGhosts);

        if($sFormat == 'json')
            return json_encode($bResult ? [] : ['msg' => _t('_error occured')]);
        else
            return $bResult;
    }

    /**
     * Delete file by file id, usually ghost file
     * @return 'ok' string on success or error string on error
     */
    public function deleteGhost($iFileId, $iProfileId)
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);

        $aFile = $oStorage->getGhost ($iFileId);
        if (!$aFile)
            $aFile = $oStorage->getFile ($iFileId);
        if (!$aFile)
            return _t('_error occured');

        $oProfile = BxDolProfile::getInstance($iProfileId);
        $oAccount = $oProfile ? $oProfile->getAccountObject() : null;
        $aProfiles = $oAccount ? $oAccount->getProfiles(false) : array();
        if (!isset($aProfiles[$aFile['profile_id']]) && !$this->isAdmin($aFile['content_id']))
            return _t('_sys_txt_access_denied');

        if (!$oStorage->deleteFile($iFileId))
            return $oStorage->getErrorString();

        return 'ok';
    }

    /**
     * Delete all ghosts files for the specified profile
     * @param $iProfileId - profile id to get orphaned files from
     * @param $mixedContent - int Content ID | array Content ID + Uploader ID | false
     * @return number of delete ghost files
     */
    public function deleteGhostsForProfile($iProfileId, $mixedContent = false)
    {
        $iCount = 0;

        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);
        if($oStorage === false)
            return $iCount;

        $aGhosts = $oStorage->getGhosts($iProfileId, $mixedContent, $mixedContent ? true : false);
        foreach ($aGhosts as $aFile)
            $iCount += $oStorage->deleteFile($aFile['id']);

        return $iCount;
    }

    protected function cleanUploadErrorMessages ()
    {
        $this->_sUploadErrorMessages = '';
    }

    public function appendUploadErrorMessage ($s)
    {
        $this->_sUploadErrorMessages .= ($this->_sUploadErrorMessages ? "\n" : '') . $s;
    }

    protected function getRestrictionsText ()
    {
        $sTextRestrictions = '';
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);
        if (!$oStorage)
            return '';

        $a = $oStorage->getRestrictionsTextArray(bx_get_logged_profile_id());
        foreach ($a as $s)
            $sTextRestrictions .= '<div class="bx-uploader-msg-info bx-def-font-grayed">' . $s . '</div>';

        return $sTextRestrictions;
    }

    protected function getMaxUploadFileSize ()
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);
        if (!$oStorage)
            return 0;
        return $oStorage->getMaxUploadFileSize(bx_get_logged_profile_id());
    }

    protected function getAcceptedFilesExtensions ()
    {
        $oStorage = BxDolStorage::getObjectInstance($this->_sStorageObject);
        if (!$oStorage)
            return null;
        return $oStorage->getAllowedExtensions();
    }

    protected function getGhostTemplateVars($aFile, $iProfileId, $iContentId, $oStorage, $oImagesTranscoder)
    {
        return array();
    }

    protected function isUseTranscoderForPreview($oImagesTranscoder, $aFile)
    {
        if (!$oImagesTranscoder)
            return false;

        return $oImagesTranscoder->isMimeTypeSupported($aFile['mime_type']);
    }

    protected function isAdmin ($iContentId = 0)
    {
        return isAdmin();
    }
}

/** @} */
