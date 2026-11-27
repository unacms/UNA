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
     * Copy one of the member's recent files (an unused uploaded file) into the uploader's storage.
     * Answers with the script the uploader expects from storage_uploader.php.
     */
    public function actionCopyFile()
    {
        $iFileId = (int)bx_get('FileId');
        $sStorageObject = bx_process_input(bx_get('StorageObject'));
        $sUniqId = bx_process_input(bx_get('UniqId'));
        $sUploaderObject = bx_process_input(bx_get('UploaderObject'));
        $sUploaderInstanceName = bx_process_input(bx_get('UploaderInstanceName'));
        $bPrivate = (bool)bx_get('isPrivate');
        $iContentId = (int)bx_get('ContentId');
        $bMultiple = (bool)bx_get('isMultiple');

        $iProfileId = bx_get_logged_profile_id();
        if(!$iProfileId || !$iFileId || !$sStorageObject || !preg_match('/^[A-Za-z0-9_]+$/', $sUploaderInstanceName))
            return;

        $oUploader = BxDolUploader::getObjectInstance($sUploaderObject, $sStorageObject, $sUniqId);
        $oStorage = BxDolStorage::getObjectInstance($sStorageObject);
        if(!$oUploader || !$oStorage)
            return;

        // only a file the member uploaded and hasn't used yet
        $aGhost = $this->_oDb->getGhostOfProfile($iFileId, $iProfileId);
        $oSourceStorage = $aGhost ? BxDolStorage::getObjectInstance($aGhost['object']) : false;
        if(!$oSourceStorage) {
            $oUploader->appendUploadErrorMessage(_t('_sys_uploader_err_msg', '', _t('_sys_storage_err_file_not_found')));
        }
        else {
            if(!$bMultiple)
                $oUploader->deleteGhostsForProfile($iProfileId, $iContentId);

            if(!$oStorage->storeFileFromStorage(['id' => $iFileId, 'storage' => $aGhost['object']], $bPrivate, $iProfileId, $iContentId))
                $oUploader->appendUploadErrorMessage(_t('_sys_uploader_err_msg', '', $oStorage->getErrorString()));
        }

        echo $this->_oTemplate->parseHtmlByName('media_uploader_result.html', [
            'uploader_instance_name' => $sUploaderInstanceName,
            'errors' => bx_js_string($oUploader->getUploadErrorMessages(), BX_ESCAPE_STR_APOS),
        ]);
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

        if(!isLogged() || $_SERVER['REQUEST_METHOD'] !== 'POST' || !$sModule || !$sField || !$iContentId || !$iFileId
            || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || !BxDolRequest::serviceExists($sModule, 'update_image')) {
            echo json_encode(['code' => 1]);
            return;
        }

        $mixedResult = BxDolService::call($sModule, 'update_image', [$sField, $iContentId, $iFileId]);
        echo json_encode($mixedResult === false ? ['code' => 1] : ['code' => 0]);
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
