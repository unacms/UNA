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

class BxAlbumsMenuSnippetMeta extends BxBaseModTextMenuSnippetMeta
{
    /**
     * The items a media item (a picture or a video in an album) has of its own, read from its row.
     * The others (comments, votes, tags, the items count, ...) are the album's.
     */
    protected $_aMediaItems;

    protected $_bMedia;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_albums';

        parent::__construct($aObject, $oTemplate);

        $this->_aMediaItems = ['date', 'author', 'views'];
        $this->_bMedia = false;
    }

    public function setContentId($iContentId)
    {
        $this->_bMedia = false;

        parent::setContentId($iContentId);
    }

    /**
     * Show the meta of a media item instead of an album's: its own date, author and views.
     * @param int $iMediaId the media item's id in the files2albums table
     */
    public function setMediaId($iMediaId)
    {
        $this->_iButtons = 0;
        $this->_bMedia = true;
        $this->_iContentId = (int)$iMediaId;

        $this->_aContentInfo = $this->_oModule->_oDb->getMediaInfoById($this->_iContentId);
        if($this->_aContentInfo)
            $this->addMarkers(['content_id' => $this->_iContentId]);
    }

    protected function _isVisible($a)
    {
        if($this->_bMedia && !in_array($a['name'], $this->_aMediaItems))
            return false;

        return parent::_isVisible($a);
    }

    protected function _getMenuItemViews($aItem, $aParams = [])
    {
        // The views object counts the album's views, a media item has its own counter in its row.
        if($this->_bMedia)
            $aParams['show_as_object'] = false;

        return parent::_getMenuItemViews($aItem, $aParams);
    }

    protected function _getMenuItemItems($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iCount = $this->_oModule->_oDb->getMediaCountByContentId($this->_aContentInfo[$CNF['FIELD_ID']]);

        return $this->getUnitMetaItemText(_t($aItem['title'], $iCount));
    }
}

/** @} */
