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

        // add content metatags
        if(!empty($CNF['OBJECT_METATAGS']) && ($o = BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS'])) !== false)
            $o->addPageMetaInfo($this->_aContentInfo[$CNF['FIELD_ID']], $this->_getThumbForMetaObject());

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

    protected function _getPageMetaDesc()
    {
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

    /**
     * The og:type of an entry page: content is an article unless the module says otherwise.
     */
    protected function _getPageMetaType()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return !empty($CNF['OG_TYPE']) ? $CNF['OG_TYPE'] : 'article';
    }

    /**
     * The share card spec of this page - produced by the module and handed on untouched.
     *
     * share_card.php rebuilds the very same spec out of band from the entity key alone, through
     * BxDolContentInfo::getContentShareCard() and into this same BxBaseModGeneralModule::getShareCard()
     * call. The card URL is the hash of the spec, so adding or changing one key here would put
     * every card of every content module on the stale hash path and cost it its immutable cache.
     * A page has nothing to contribute to a card about content: contribute from the module.
     */
    protected function _getPageShareCard()
    {
        if(!$this->_aContentInfo)
            return array();

        //--- no $aParams: the out of band producer, BxDolContentInfo::getContentShareCard($iId), has
        //--- none to pass, so handing the page object in here would call the one producer with two
        //--- different arguments. Nothing reads it today; the day an override did, every card of that
        //--- module would quietly move to the stale hash path and no single page test would show it
        return $this->_oModule->getShareCard($this->_aContentInfo);
    }

    protected function _getThumbForMetaObject ()
    {
        return $this->_oModule->getEntryImageData($this->_aContentInfo);
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
