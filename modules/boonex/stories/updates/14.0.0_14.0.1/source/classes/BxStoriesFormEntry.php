<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxStoriesFormEntry extends BxBaseModTextFormEntry
{
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_stories';

        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if (isset($CNF['FIELD_PHOTO']) && isset($this->aInputs[$CNF['FIELD_PHOTO']]))
            $this->aInputs[$CNF['FIELD_PHOTO']]['init_reordering'] = true;
    }

    public function processFiles ($sFieldFile, $iContentId = 0, $isAssociateWithContent = false)
    {
        return parent::_processFilesInAlbumsAndStories($sFieldFile, $iContentId, $isAssociateWithContent);
    }
    
    protected function _associalFileWithContent($oStorage, $iFileId, $iProfileId, $iContentId, $sPictureField = '')
    {
        parent::_associalFileWithContent($oStorage, $iFileId, $iProfileId, $iContentId, $sPictureField);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $oTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_BIG']);
        
        $aInfo = bx_get_image_exif_and_size($oStorage, $oTranscoder, $iFileId);
        if($this->_oModule->_oDb->associateFileWithContent ($iContentId, $iFileId, $iProfileId, $this->getCleanValue('title-' . $iFileId), $aInfo['size']) === false)
            return;

        $aMediaInfo = $this->_oModule->_oDb->getMediaInfoSimpleByFileId($iFileId);
        $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);

        /**
         * @hooks
         * @hookdef hook-bx_stories-media_added 'bx_stories', 'media_added' - hook on new media added in story
         * - $unit_name - equals `bx_stories`
         * - $action - equals `media_added` 
         * - $object_id - story_id
         * - $sender_id - author's profile_id
         * - $extra_params - array of additional params with the following array keys:
         *      - `object_author_id` - [int] confirmation type can be none/phone/email/email_and_phone/email_or_phone
         *      - `subobject_id` - [int] id for added media
         *      - `media_id` - [int] id for added media
         *      - `media_info` - [array] media info
         * @hook @ref hook-bx_stories-media_added
         */
        bx_alert($this->_oModule->getName(), 'media_added', $iContentId, $iProfileId, array(
            'object_author_id' => $aContentInfo[$CNF['FIELD_AUTHOR']],

            'subobject_id' => $aMediaInfo['id'],

            'media_id' => $aMediaInfo['id'], 
            'media_info' => $aMediaInfo,
        ));

        bx_alert($this->_oModule->getName() . '_media', 'added', $aMediaInfo['id'], $iProfileId, array(
            'object_id' => $iContentId, 
            'object_author_id' => $aContentInfo[$CNF['FIELD_AUTHOR']], 

            'media_info' => $aMediaInfo
        ));
    }

    public function insert ($aValsToAdd = [], $isIgnore = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(empty($aValsToAdd[$CNF['FIELD_EXPIRED']]) && empty($this->getCleanValue($CNF['FIELD_EXPIRED'])))
            $aValsToAdd[$CNF['FIELD_EXPIRED']] = time() + 3600 * (int)getParam($CNF['PARAM_EXPIRATION_PERIOD']);

        return parent::insert ($aValsToAdd, $isIgnore);
    }

    public function delete ($iContentId, $aContentInfo = [])
    {
        if (!($bRet = parent::delete ($iContentId, $aContentInfo)))
            return $bRet;

        if (!($aMediaList = $this->_oModule->_oDb->getMediaListByContentId($iContentId)))
            return $bRet;

        foreach ($aMediaList as $aMediaInfo)
            $this->_oModule->serviceDeleteFileAssociations($aMediaInfo['file_id']);
        
        return $bRet;
    }
}

/** @} */
