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

bx_import('BxDolAcl');

/**
 * Entry create/edit pages
 */
class BxAlbumsPageMedia extends BxTemplPage
{
    protected $MODULE;
    protected $_oModule;
    protected $_aAlbumInfo = false;
    protected $_aMediaInfo = false;
    protected $_mixedContext = false;
    protected $_bAlbumActive = null;

    public function __construct($aObject, $oTemplate = false)
    {        
        parent::__construct($aObject, $oTemplate);
        $this->MODULE = 'bx_albums';
        $this->_oModule = BxDolModule::getInstance($this->MODULE);
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iMediaId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if ($iMediaId)
            $this->_aMediaInfo = $this->_oModule->_oDb->getMediaInfoById($iMediaId);

        if ($this->_aMediaInfo)
            $this->_aAlbumInfo = $this->_oModule->_oDb->getContentInfoById($this->_aMediaInfo['content_id']);

        if ($this->_aAlbumInfo) {
            $this->addMarkers(array_merge($this->_aAlbumInfo, $this->_aMediaInfo)); // every field can be used as marker
            $this->addMarkers(array(
                'title' => !empty($this->_aMediaInfo['title']) ? $this->_aMediaInfo['title'] : _t('_bx_albums_txt_media_title_alt', $this->_aAlbumInfo[$CNF['FIELD_TITLE']]),
            ));

            $sTitle = isset($this->_aAlbumInfo[$CNF['FIELD_TITLE']]) ? $this->_aAlbumInfo[$CNF['FIELD_TITLE']] : strmaxtextlen($this->_aAlbumInfo[$CNF['FIELD_TEXT']], 20, '...');
            $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $this->_aAlbumInfo[$CNF['FIELD_ID']]));

            // select view entry submenu
            $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
            if($oMenuSubmenu)
                $oMenuSubmenu->setObjectSubmenu($CNF['OBJECT_MENU_SUBMENU_VIEW_ENTRY'], array (
                    'title' => '',
                    'link' => '',
                    'icon' => '',
                ));
        }
    }

    public function isAlbumActive()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if($this->_bAlbumActive !== null)
            return $this->_bAlbumActive;

        $oPageEntry = BxDolPage::getObjectInstance($this->MODULE . '_view_entry');
        $oPageEntry->setContentId($this->_aAlbumInfo[$CNF['FIELD_ID']]);
        return ($this->_bAlbumActive = $oPageEntry->isPage());
    }

    public function getCode ()
    {
        // check if content exists
        if (!$this->_aAlbumInfo || !$this->isAlbumActive() || !$this->_aMediaInfo) { // if entry is not found - display standard "404 page not found" page
            $this->_oTemplate->displayPageNotFound();
            exit;
        }

        // permissions check 
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->_oModule->checkAllowedView($this->_aAlbumInfo))) {
            $this->_oTemplate->displayAccessDenied($sMsg);
            exit;
        }
        $this->_oModule->checkAllowedView($this->_aAlbumInfo, true);

        // count views
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!empty($CNF['OBJECT_VIEWS_MEDIA']))
            BxDolView::getObjectInstance($CNF['OBJECT_VIEWS_MEDIA'], $this->_aMediaInfo['id'])->doView();

        // add content metatags
        if(!empty($CNF['OBJECT_METATAGS_MEDIA'])) {
            $oMetatags = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS_MEDIA']);
            if($oMetatags)
                $oMetatags->addPageMetaInfo($this->_aMediaInfo['id'], $this->_getThumbForMetaObject());
        }

        return parent::getCode ();
    }

    /**
     * The checks of getCode, for the API page as well, which doesn't run getCode.
     */
    protected function _isAvailablePage ($a)
    {
        if(!$this->_aAlbumInfo || !$this->_aMediaInfo || !$this->isAlbumActive())
            return false;

        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage ($a)
    {
        if(($mixedResult = $this->_oModule->checkAllowedView($this->_aAlbumInfo)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $mixedResult;

        return parent::_isVisiblePage($a);
    }

    protected function _getThumbForMetaObject ()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;        
        
        if(empty($this->_aMediaInfo['file_id']) || empty($CNF['OBJECT_TRANSCODER_COVER']))
            return false;

        return array('id' => $this->_aMediaInfo['file_id'], 'transcoder' => $CNF['OBJECT_TRANSCODER_COVER']);
    }
    
    protected function _addJsCss()
    {
        parent::_addJsCss();

        $this->_oModule->_oTemplate->addCss([
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'photo-swipe/|photoswipe.css',
        ]);

        $this->_oModule->_oTemplate->addJs([
            'history.js',
            'history.adapter.jquery.js',
            'photo-swipe/photoswipe.umd.min.js',
            'photo-swipe/photoswipe-lightbox.umd.min.js',
            'media_view.js',
        ]);
    }
}

/** @} */
