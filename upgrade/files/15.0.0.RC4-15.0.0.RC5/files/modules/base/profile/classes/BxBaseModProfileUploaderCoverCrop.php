<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseProfile Base classes for profile modules
 * @ingroup     UnaModules
 *
 * @{
 */

require_once('BxBaseModProfileUploaderCrop.php');

class BxBaseModProfileUploaderCoverCrop extends BxBaseModProfileUploaderCrop
{
    public function __construct ($aObject, $sStorageObject, $sUniqId, $oTemplate)
    {
        parent::__construct($aObject, $sStorageObject, $sUniqId, $oTemplate ? $oTemplate : $this->_oModule->_oTemplate);

        $this->_sUploaderFormTemplate = 'uploader_form_crop_cover.html';
        $this->_sPreviewShape = self::PREVIEW_COVER;
        
        $CNF = $this->_oModule->_oConfig->CNF;

        $this->_sImage = $CNF['FIELD_COVER'];
        $this->_aOtherImages = [$CNF['FIELD_PICTURE']];
        if(!empty($CNF['FIELD_BADGE']))
            $this->_aOtherImages[] = $CNF['FIELD_BADGE'];
    }
}

/** @} */
