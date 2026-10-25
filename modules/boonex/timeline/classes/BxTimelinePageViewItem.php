<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTimelinePageViewItem extends BxTemplPage
{
    protected $_sModule;
    protected $_oModule;

    protected $_iItemId;
    protected $_aItemData;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_timeline';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $this->_oModule->_oTemplate);

        $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(!$iItemId) 
            return;

        $this->_iItemId = $iItemId;
        $this->_aItemData = $this->_oModule->getItemData($this->_iItemId);
    }

    protected function _isAvailablePage ($a)
    {
        if (!$this->_iItemId || $this->_aItemData['code'] == 1)
            return false;

        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage ($a)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_iItemId || $this->_aItemData['code'] == 2)
            return false;

        $oCf = BxDolContentFilter::getInstance();
        if($oCf->isEnabled() && !$oCf->isAllowed($this->_aItemData['event'][$CNF['FIELD_CF']]))
            return false;

        return parent::_isVisiblePage($a);
    }

    /**
     * The item the page head (link previews included) may describe: a viewable active one.
     * @return array event or false
     */
    protected function _getMetaEvent()
    {
        if(empty($this->_aItemData['event']) || (int)$this->_aItemData['code'] !== 0 || $this->_isAvailablePage($this->_aObject) !== true)
            return false;

        return $this->_aItemData['event'];
    }

    /**
     * The title of the post, else its author: "Liam added a discussion" doesn't say what is shared.
     */
    protected function _getPageMetaTitle()
    {
        if(($aEvent = $this->_getMetaEvent()) === false)
            return parent::_getPageMetaTitle();

        $sTitle = $aEvent['content']['title'] ?? '';
        if(trim(strip_tags($sTitle)) === '')
            $sTitle = $this->_oModule->getObjectUser($aEvent['object_owner_id'])->getDisplayName();

        return $sTitle;
    }

    protected function _getPageMetaDesc()
    {
        if(($aEvent = $this->_getMetaEvent()) === false || empty($aEvent['content']['text']))
            return parent::_getPageMetaDesc();

        return $aEvent['content']['text'];
    }

    protected function _getPageMetaType()
    {
        return 'article';
    }

    /**
     * An entry of another module (a discussion added) shows that entry's image, a post shows its first photo.
     */
    protected function _getPageMetaImage()
    {
        if(($aEvent = $this->_getMetaEvent()) === false)
            return '';

        $CNF = &$this->_oModule->_oConfig->CNF;

        $aImage = false;
        if($this->_oModule->_oConfig->isSystem($aEvent['type'], $aEvent['action'])) {
            if(BxDolModuleQuery::getInstance()->isEnabledByName($aEvent['type']) && ($oModule = BxDolModule::getInstance($aEvent['type'])) instanceof BxBaseModGeneralModule
                && ($aContentInfo = $oModule->_oDb->getContentInfoById($aEvent['object_id'])) && $oModule->checkAllowedView($aContentInfo) === CHECK_ACTION_RESULT_ALLOWED)
                $aImage = $oModule->getEntryImageData($aContentInfo);
        }
        else if(($aPhotos = $this->_oModule->_oDb->getMedia($CNF['FIELD_PHOTO'], $aEvent[$CNF['FIELD_ID']])))
            $aImage = ['id' => reset($aPhotos), 'transcoder' => $this->_oModule->_oConfig->getObject('transcoder_photos_big')];

        if($aImage && ($sUrl = $this->_getMetaImage($aImage)))
            return $sUrl;

        return parent::_getPageMetaImage();
    }

    public function getCode()
    {
        if(empty($this->_aItemData) || !is_array($this->_aItemData))
            $this->_oTemplate->displayPageNotFound();

        if($this->_aItemData['code'] != 0) {
            switch($this->_aItemData['code']) {
                case 1:
                    $this->_oTemplate->displayPageNotFound();
                    break;

                case 2: 
                    $this->_oTemplate->displayAccessDenied($this->_aItemData['content']);
                    break;

                default:
                    $this->_oTemplate->displayMsg($this->_aItemData['content']);
            }
        }

        $sPageUrl = 'page.php?i=' . $this->_aObject['uri'] . '&id=' . $this->_iItemId;
        if(!empty($this->_aItemData['event']['content']['url']))
            $sPageUrl = $this->_aItemData['event']['content']['url'];

        BxDolTemplate::getInstance()->setPageUrl($sPageUrl);

        return parent::getCode();
    }
}

/** @} */
