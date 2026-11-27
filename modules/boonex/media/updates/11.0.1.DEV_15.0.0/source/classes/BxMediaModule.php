<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    MediaManager MediaManager
* @ingroup     UnaModules
*
* @{
*/

/**
 * Media Manager module: an uploader with recent files and an image editor,
 * and the editor on profile covers, profile pictures and content header images.
 */
class BxMediaModule extends BxDolModule
{
    public function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * Use one of the member's recent files (an uploaded file no content uses yet) in the uploader's storage.
     * A file of another storage is copied, a file of this storage is used as it is.
     * Answers with the script the uploader expects from storage_uploader.php.
     */
    public function actionCopyFile()
    {
        $iFileId = (int)bx_get('FileId');
        $sSourceStorage = bx_process_input(bx_get('SourceStorage'));
        $sStorageObject = bx_process_input(bx_get('StorageObject'));
        $sUniqId = bx_process_input(bx_get('UniqId'));
        $sUploaderObject = bx_process_input(bx_get('UploaderObject'));
        $sUploaderInstanceName = bx_process_input(bx_get('UploaderInstanceName'));
        $bPrivate = (bool)bx_get('isPrivate');
        $iContentId = (int)bx_get('ContentId');
        $bMultiple = (bool)bx_get('isMultiple');

        $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId || !$this->_isPostWithToken() || !$iFileId || !$sSourceStorage || !$sStorageObject || !preg_match('/^\w+$/', $sUploaderInstanceName))
            return;

        $oUploader = BxDolUploader::getObjectInstance($sUploaderObject, $sStorageObject, $sUniqId);
        $oStorage = BxDolStorage::getObjectInstance($sStorageObject);
        if(!$oUploader || !$oStorage)
            return;

        $iNewId = $this->_copyRecentFile($oStorage, $oUploader, $iFileId, $sSourceStorage, $iProfileId, $bPrivate, $iContentId);

        // a single file field keeps only the new file
        if($iNewId && !$bMultiple) {
            foreach($oStorage->getGhosts($iProfileId, $iContentId ? $iContentId : false, (bool)$iContentId) as $aGhost) {
                if((int)$aGhost['id'] != $iNewId)
                    $oStorage->deleteFile($aGhost['id']);
            }
        }

        echo $this->_oTemplate->parseHtmlByName('media_uploader_result.html', [
            'uploader_instance_name' => $sUploaderInstanceName,
            'errors' => bx_js_string($oUploader->getUploadErrorMessages(), BX_ESCAPE_STR_APOS),
        ]);
    }

    /**
     * @return int the id of the file in the uploader's storage, 0 on an error (added to the uploader's errors)
     */
    protected function _copyRecentFile($oStorage, $oUploader, $iFileId, $sSourceStorage, $iProfileId, $bPrivate, $iContentId)
    {
        $aGhost = $this->_oDb->getGhostOfProfile($iFileId, $sSourceStorage, $iProfileId);
        if(!$aGhost || !BxDolStorage::getObjectInstance($aGhost['object'])) {
            $oUploader->appendUploadErrorMessage(_t('_sys_uploader_err_msg', '', _t('_sys_storage_err_file_not_found')));
            return 0;
        }

        $iNewId = $aGhost['object'] == $oStorage->getObject() ? (int)$aGhost['id'] : (int)$oStorage->storeFileFromStorage(['id' => $iFileId, 'storage' => $aGhost['object']], $bPrivate, $iProfileId, $iContentId);
        if(!$iNewId) {
            $oUploader->appendUploadErrorMessage(_t('_sys_uploader_err_msg', '', $oStorage->getErrorString()));
            return 0;
        }

        // storeFileFromStorage doesn't keep the content id: the uploader shows the ghosts of the content
        if($iContentId)
            $oStorage->updateGhostsContentId($iNewId, $iProfileId, $iContentId);

        return $iNewId;
    }

    /**
     * Requests that change data: a POST with the token from getCsrfToken.
     */
    protected function _isPostWithToken()
    {
        return $_SERVER['REQUEST_METHOD'] === 'POST' && BxDolForm::isCsrfTokenValid(bx_get('csrf_token'), false);
    }

    /**
     * Set an image field of a content to an uploaded file, after the editor saved it.
     * The module's update_image service checks the permission and the field.
     */
    public function actionUpdateContent()
    {
        header('Content-Type: application/json; charset=utf-8');

        $sModule = bx_process_input(bx_get('module'));
        $sField = bx_process_input(bx_get('field'));
        $iContentId = (int)bx_get('content_id');
        $iFileId = (int)bx_get('file_id');

        if(!isLogged() || !$this->_isPostWithToken() || !$sModule || !$sField || !$iContentId || !$iFileId
            || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || !BxDolRequest::serviceExists($sModule, 'update_image')) {
            echo json_encode(['code' => 1]);
            return;
        }

        $mixedResult = BxDolService::call($sModule, 'update_image', [$sField, $iContentId, $iFileId]);
        echo json_encode($mixedResult === false ? ['code' => 1] : ['code' => 0]);
    }

    /**
     * A token for the module's POST actions, see _isPostWithToken.
     */
    public function getCsrfToken()
    {
        $mixedToken = BxDolForm::getCsrfToken();
        return $mixedToken ? $mixedToken : '';
    }

    /**
     * @page service Service Calls
     * @section bx_media Media Manager
     * @subsection bx_media-page_blocks Page Blocks
     * @subsubsection bx_media-include_js include_js
     *
     * @code bx_srv('bx_media', 'include_js', [...]); @endcode
     *
     * Add the module's JS, CSS and editor captions to the page (head injection).
     *
     * @return void
     *
     * @see BxMediaModule::serviceIncludeJs
     */
    /**
     * @ref bx_media-include_js "include_js"
     */
    public function serviceIncludeJs ()
    {
        $this->_oTemplate->addJs([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond.min.js',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-image-preview.min.js',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-image-transform.min.js',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-image-crop.min.js',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-image-resize.min.js',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-file-validate-size.min.js',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-file-validate-type.min.js',
            'BxMediaEditor.js',
            'BxMediaUploader.js',
            'BxMediaChanger.js',
        ]);

        $this->_oTemplate->addCss([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-image-preview.min.css',
            'main.css',
            'media-editor.css',
        ]);

        $this->_oTemplate->addJsTranslation($this->_oConfig->getEditorTranslations());
    }
}

/** @} */
