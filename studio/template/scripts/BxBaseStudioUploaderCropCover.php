<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioUploaderCropCover extends BxTemplUploaderCrop
{
    protected $_oModule;

    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        if(!$oTemplate)
            $oTemplate = BxDolStudioTemplate::getInstance();

        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate);

        $this->_sUploaderFormTemplate = 'uploader_form_crop_cover.html';
        // Designer shows the cover (and the default art) in its own preview, so the field keeps the button
        $this->_sPreviewTemplate = '';
    }
}

/** @} */
