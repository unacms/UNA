<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAlbumsContentInfoMedia extends BxDolContentInfo
{
    protected $MODULE;
	protected $_oModule;

    protected function __construct($sSystem)
    {
        $this->MODULE = 'bx_albums';
        $this->_oModule = BxDolModule::getInstance($this->MODULE);

        parent::__construct($sSystem);
    }  

    public function getContentAuthor ($iContentId)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return 0;

        return $aMedia['author'];
    }
    
    public function getContentEmbed ($iContentId)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return '';
        
        $sTitle = $this->getContentTitle($iContentId);
        return $this->_oModule->_oTemplate->parseHtmlByName('embed_media.html', [
            'title' => $sTitle,
            'url' => BX_DOL_URL_ROOT . $this->_oModule->_oConfig->getBaseUri() . 'embed_media/' . $iContentId . '/'
        ]);
    }

    public function getContentDateAdded ($iContentId)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return 0;

        return $aMedia['added'];
    }

    public function getContentDateChanged ($iContentId)
    {
        return 0;
    }

    public function getContentTitle ($iContentId)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return '';

        return $aMedia['title'];
    }

    public function getContentThumb ($iContentId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return '';

        $sTranscoder = $CNF['OBJECT_TRANSCODER_BROWSE'];
        $oTranscoder = BxDolTranscoderImage::getObjectInstance($sTranscoder);
        if(!$oTranscoder)
            return '';

        return $oTranscoder->getFileUrl($aMedia['file_id']);
    }

    public function getContentLink ($iContentId)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return '';

        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->_oModule->_oConfig->CNF['URI_VIEW_MEDIA'] . '&id=' . $iContentId));
    }

    public function getContentText ($iContentId)
    {
        return '';
    }

    public function getContentInfo ($iContentId, $bSearchableFieldsOnly = true)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return array();

        return $aMedia;
    }

    /**
     * A picture or video may be seen where its album may be.
     */
    public function isViewAllowed ($iContentId)
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return false;

        $aAlbum = $this->_oModule->_oDb->getContentInfoById((int)$aMedia['content_id']);
        return !empty($aAlbum) && $this->_oModule->checkAllowedView($aAlbum) === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function getContentSearchResultUnit ($iContentId, $sUnitTemplate = '')
    {
        $aMedia = $this->_oModule->_oDb->getMediaInfoById($iContentId);
        if(empty($aMedia) || !is_array($aMedia))
            return '';

        if(empty($sUnitTemplate))
            $sUnitTemplate = 'unit_media.html';

        return $this->_oModule->_oTemplate->unitMedia($aMedia, true, $sUnitTemplate);
    }

    public function getAll ($aParams = array())
    {
        if(empty($aParams) || !is_array($aParams))
            $aParams = array('type' => 'all');

        return $this->_oModule->_oDb->getMediaBy($aParams);
    }

    public function getSearchableFieldsExtended ()
    {
        return array(
            'author' => array(
            	'type' => 'text_auto', 
            	'caption' => '_bx_albums_form_entry_input_author',
        		'info' => '',
        		'value' => '',
            	'values' => '',
        		'pass' => ''
            ),
            'title' => array(
            	'type' => 'text', 
            	'caption' => '_bx_albums_form_entry_file_title',
            	'info' => '',
        		'value' => '',
            	'values' => '',
            	'pass' => 'Xss'
            )
        );
    }

    public function getSearchResultExtended ($aParams, $iStart = 0, $iPerPage = 0, $bFilterMode = false)
    {
        if((empty($aParams) || !is_array($aParams)) && !$bFilterMode)
            return array();

        return $this->_oModule->_oDb->getMediaBy(array('type' => 'search_ids', 'search_params' => $aParams, 'start' => $iStart, 'per_page' => $iPerPage));
    }
}

/** @} */
