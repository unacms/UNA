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
require_once(__DIR__ . '/BxMediaUploader.php');

class BxMediaUploaderAttachments extends BxMediaUploader
{
    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate);

        $this->_sButtonTemplate = 'media_uploader_button_attachment.html';
        $this->_sJsTemplate = 'media_uploader_button_js.html';
        $this->_sUploaderFormTemplate = 'media_uploader_form.html';

        if ($this->_oTemplate instanceof BxDolModuleProxy) {
            $CNF = $this->_oTemplate->getModule()->_oConfig->CNF;
            if (isset($CNF['OBJECT_MENU_ENTRY_ATTACHMENTS'])) {
                BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_ENTRY_ATTACHMENTS'], $this->_oTemplate)->addMarkers(array(
                    'js_object_bx_media_uploader_attachments' => $this->getNameJsInstanceUploader()
                ));
            }	
        }
    }

    public function getUploaderButtonTitle($mixed = false)
    {
        return '<i class="sys-icon camera"></i> ' . _t('_bx_media_uploader_button_title');
    }
}

/** @} */
