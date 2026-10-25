<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGeneral Base classes for modules
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolAcl');

/**
 * Entry create/edit pages
 */
class BxBaseModGeneralPageEntry extends BxTemplPage
{
    protected $MODULE;

    protected $_oModule;
    protected $_aContentInfo = false;

    protected $_sCoverClass;

    protected $_bMetaAllowed = null;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_oModule = BxDolModule::getInstance($this->MODULE);

        parent::__construct($aObject, $oTemplate ? $oTemplate : $this->_oModule->_oTemplate);

        $this->_sCoverClass = $this->_oModule->getName() . '_cover';

        $this->addMarkers([
            'module' => $this->MODULE,
        ]);
    }

    public function getContentInfo()
    {
        return $this->_aContentInfo;
    }
    
    public function getCode ()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!$this->_isAvailablePage($this->_aObject)) {
            $this->_oTemplate->displayPageNotFound();
            exit;
        }

        $oCover = BxDolCover::getInstance($this->_oModule->_oTemplate);        
        if ($oCover)
            $oCover->setCoverClass($this->_sCoverClass);

        // count views
        if(!empty($CNF['OBJECT_VIEWS'])) {
            $oView = BxDolView::getObjectInstance($CNF['OBJECT_VIEWS'], $this->_aContentInfo[$CNF['FIELD_ID']]);
            if($oView && $oView->isEnabled())
                $oView->doView();
        }

        // set cover image
        $mixedCover = method_exists($this, '_getImageForPageCover') ? $this->_getImageForPageCover() : $this->_getThumbForMetaObject();
        if($mixedCover !== false) {
            $aCover = array(
                'id' => $mixedCover['id']
            );

            if(!empty($mixedCover['transcoder']))
                $aCover['transcoder'] = $mixedCover['transcoder'];
            else if(!empty($CNF['OBJECT_IMAGES_TRANSCODER_COVER'])) 
                $aCover['transcoder'] = $CNF['OBJECT_IMAGES_TRANSCODER_COVER'];
            else if(!empty($mixedCover['object']))
                $aCover['object'] = $mixedCover['object'];

            $oCover->setCoverImageUrl($aCover);
        }

        // add content metatags (keywords, location), the page meta image is set by _getPageMetaImage
        if($this->_isMetaAllowed() && !empty($CNF['OBJECT_METATAGS']) && ($o = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])) !== false)
            $o->addPageMetaInfo($this->_aContentInfo[$CNF['FIELD_ID']]);

        $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if($oMenuSubmenu) {
            // add actions menu to submenu
            if(isset($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY']))
                $oMenuSubmenu->setObjectActionsMenu($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY']);

            // add social sharing menu to submenu
            $oMenuSubmenu->setServiceSocialSharing(array(
                'module' => $this->MODULE,
                'method' => 'entity_social_sharing',
            ));
        }
        
        BxDolTemplate::getInstance()->setPageUrl('page.php?i=' . $this->_aObject['uri'] . '&id=' . $this->_aContentInfo[$CNF['FIELD_ID']]);
        
        return parent::getCode ();
    }

    protected function _isAvailablePage ($a)
    {
        if(!$this->_aContentInfo)
            return false;

        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage ($a)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($mixedCheckResult = $this->_oModule->checkAllowedView($this->_aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED) 
            return $mixedCheckResult;

        if(!empty($CNF['FIELD_CF'])) {
            $oCf = BxDolContentFilter::getInstance();
            if($oCf->isEnabled() && !$oCf->isAllowed($this->_aContentInfo[$CNF['FIELD_CF']]))
                return false;
        }

        if(!parent::_isVisiblePage($a))
            return false;

        $this->_oModule->checkAllowedView($this->_aContentInfo, true);

        return true;
    }

    protected function _getPageAccessDeniedMsg ($mixedMsg = false)
    {
        $this->_oTemplate->displayAccessDenied($mixedMsg);
        exit;
    }

    /**
     * Whether the page head (link previews included) may describe the entry: it is available and the viewer may view it.
     * Unlike _isVisiblePage it doesn't perform the view action, and it is false on a closed profile page.
     * @return boolean
     */
    protected function _isMetaAllowed()
    {
        if($this->_bMetaAllowed !== null)
            return $this->_bMetaAllowed;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $bResult = $this->_aContentInfo && $this->_isAvailablePage($this->_aObject) === true && $this->_oModule->checkAllowedView($this->_aContentInfo) === CHECK_ACTION_RESULT_ALLOWED;
        if($bResult && !empty($CNF['FIELD_CF']) && isset($this->_aContentInfo[$CNF['FIELD_CF']]) && ($oCf = BxDolContentFilter::getInstance()) && $oCf->isEnabled())
            $bResult = $oCf->isAllowed($this->_aContentInfo[$CNF['FIELD_CF']]);

        return ($this->_bMetaAllowed = $bResult);
    }

    protected function _getPageMetaDesc()
    {
        // The API page is built even when the viewer can't see the entry, and a closed profile page is shown, so don't leak its text.
        if(!$this->_isMetaAllowed())
            return parent::_getPageMetaDesc();

        $CNF = &$this->_oModule->_oConfig->CNF;

        $sResult = '';
        if(isset($CNF['FIELD_TEXT'])) {
            $sResult = strip_tags($this->_oModule->_oTemplate->getText($this->_aContentInfo, false));

            $iLength = 0;
            if(!empty($CNF['PARAM_CHARS_SUMMARY']))
                $iLength = (int)getParam($CNF['PARAM_CHARS_SUMMARY']);
            if(empty($iLength))
                $iLength = 240;

            if(mb_strlen($sResult) > $iLength)
                $sResult = mb_substr($sResult, 0, $iLength);
        }

        if(empty($sResult))
            $sResult = $this->_replaceMarkers(_t($this->_aObject['meta_description']));

        return $sResult;
    }

    protected function _getThumbForMetaObject ()
    {
        return $this->_oModule->getEntryImageData($this->_aContentInfo);
    }

    protected function _getPageMetaImage()
    {
        // The API page is built even when the viewer can't see the entry, so don't leak its image.
        if(!$this->_isMetaAllowed())
            return '';

        if(!($aImage = $this->_getThumbForMetaObject()) || !is_array($aImage))
            return '';

        $o = null;
        if(!empty($aImage['object']))
            $o = BxDolStorage::getObjectInstance($aImage['object']);
        else if(!empty($aImage['transcoder']))
            $o = BxDolTranscoder::getObjectInstance($aImage['transcoder']);

        return $o ? (string)$o->getFileUrlById($aImage['id']) : '';
    }

    protected function _getPageCacheParams ()
    {
        $s = parent::_getPageCacheParams ();
        if (!$this->_aContentInfo)
            return $s;
        return $s . $this->_aContentInfo[$this->_oModule->_oConfig->CNF['FIELD_ID']]; // cache is different for every entry
    }
}

/** @} */
