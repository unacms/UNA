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

class BxMediaUploader extends BxDolUploader
{
    protected $_oModule;
    protected $_sIframeId;

    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        $this->_oModule = BxDolModule::getInstance('bx_media');

        parent::__construct($aObject, $sStorageObject, $sUniqId, $this->_oModule->_oTemplate);

        $this->_sIframeId = 'bx-form-input-files-' . $sUniqId . '-iframe';
        $this->_sButtonTemplate = 'media_uploader_button.html';
        $this->_sJsTemplate = 'media_uploader_button_js.html';
        $this->_sUploaderFormTemplate = 'media_uploader_form.html';
    }

    protected function getGhostTemplateVars($aFile, $iProfileId, $iContentId, $oStorage, $oImagesTranscoder)
    {
        return ['file_title_attr' => ''];
    }
	
    /**
     * Get uploader button title
     */
    public function getUploaderButtonTitle($mixed = false)
    {
        return $this->_oModule->_oTemplate->parseHtmlByName('media_uploader_icon.html', [
            'title' => _t('_bx_media_uploader_button_title')
        ]);
    }

    /**
     * Show uploader JS.
     * @return HTML string
     */
    public function getUploaderJs($mixedGhostTemplate, $isMultiple = true, $aParams = array(), $bDynamic = false)
    {
        if(!$aParams)
            $aParams = [];

        return parent::getUploaderJs($mixedGhostTemplate, $isMultiple, array_merge($aParams, [
            'module_path' => $this->_oModule->_aModule['path'],
            'action_url' => $this->_oModule->_oConfig->getBaseUri(),
            'csrf_token' => $this->_oModule->getCsrfToken()
        ]), $bDynamic);
    }

    /**
     * Show uploader form.
     * @return HTML string
     */
    public function getUploaderForm($isMultiple = true, $iContentId = false, $isPrivate = true)
    {
        $aStorageData = array();
        $aGhosts = $this->_oModule->_oDb->getRecentGhosts(bx_get_logged_profile_id(), BxMediaConfig::RECENT_FILES_LIMIT);
        foreach ($aGhosts as $aGhost) {
            $oStorage = BxDolStorage::getObjectInstance($aGhost['object']);
            if ($oStorage){
                $aStorageData[] = [
                    'uploader_instance_name' => $this->getNameJsInstanceUploader(),
                    'url' => $oStorage->getFileUrlById($aGhost['id']),
                    'id' => $aGhost['id'],
                    'object' => $aGhost['object'],
                ];
            }
        }

        $sAcceptedFiles = $this->getAcceptedFilesExtensions();

        return $this->_oModule->_oTemplate->parseHtmlByName($this->_sUploaderFormTemplate, array(
            'form_container_id' => $this->_sFormContainerId,
            'errors_container_id' => $this->_sErrorsContainerId,
            'uploader_instance_name' => $this->getNameJsInstanceUploader(),
            'restrictions_text' => $this->getRestrictionsText(),
            'iframe_id' => $this->_sIframeId,
            'engine' => $this->_aObject['object'],
            'storage_object' => $this->_sStorageObject,
            'uniq_id' => $this->_sUniqId,
            'multiple' => $isMultiple,
            'filepond_multiple' => $isMultiple ? 'true' : 'false',
            'content_id' => $iContentId,
            'storage_private' => $isPrivate,
            'accepted_files' => null === $sAcceptedFiles ? '' : 'accept="' . bx_js_string($sAcceptedFiles) . '"',
            'bx_if:recent_files' => array(
                'condition' => !empty($aStorageData),
                'content' => array(
                    'bx_repeat:items' => $aStorageData,
                )
            ),
        ));
    }
}

/** @} */
