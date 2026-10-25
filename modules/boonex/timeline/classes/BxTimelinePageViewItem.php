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
     * What a post shows: type, action and object (an entry, or the event of a post) of the event or of the reposted one.
     * @return array [type, action, object id]
     */
    protected function _getMetaSource($aEvent)
    {
        $oConfig = $this->_oModule->_oConfig;

        // A repost's stored content has the reposted type, action and object (the prepared one lacks them in API mode).
        if($aEvent['type'] == $oConfig->getPrefix('common_post') . BX_TIMELINE_PARSE_TYPE_REPOST) {
            $aRaw = $this->_oModule->_oDb->getEvents(['browse' => 'id', 'value' => $aEvent['id']]);
            $aContent = !empty($aRaw['content']) && is_string($aRaw['content']) ? unserialize($aRaw['content'], ['allowed_classes' => false]) : [];
            if(!empty($aContent['type']))
                return [$aContent['type'], $aContent['action'] ?? '', (int)($aContent['object_id'] ?? 0)];
        }

        return [$aEvent['type'], $aEvent['action'], (int)($oConfig->isSystem($aEvent['type'], $aEvent['action']) ? $aEvent['object_id'] : $aEvent['id'])];
    }

    /**
     * The entry of another module a post shows (a discussion added or reposted), when the viewer may view it.
     * @return array [module, entry] or false
     */
    protected function _getMetaContent()
    {
        if(($aEvent = $this->_getMetaEvent()) === false)
            return false;

        list($sType, $sAction, $iObjectId) = $this->_getMetaSource($aEvent);
        if(!$this->_oModule->_oConfig->isSystem($sType, $sAction) || !BxDolModuleQuery::getInstance()->isEnabledByName($sType))
            return false;

        $oModule = BxDolModule::getInstance($sType);
        if(!($oModule instanceof BxBaseModGeneralModule) || !($aContentInfo = $oModule->_oDb->getContentInfoById($iObjectId)) || $oModule->checkAllowedView($aContentInfo) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return [$oModule, $aContentInfo];
    }

    /**
     * The title of the post, else its author: "Liam added a discussion" doesn't say what is shared.
     */
    protected function _getPageMetaTitle()
    {
        if(($aEvent = $this->_getMetaEvent()) === false)
            return parent::_getPageMetaTitle();

        $sTitle = bx_process_output($aEvent['content']['title'] ?? '');
        if(trim(strip_tags($sTitle)) === '')
            $sTitle = $this->_oModule->getObjectUser($aEvent['object_owner_id'])->getDisplayName();

        return $sTitle;
    }

    /**
     * An entry's abstract or text, as on its own page (the feed has a cut copy), else the text of the post.
     */
    protected function _getPageMetaDesc()
    {
        if(($aEvent = $this->_getMetaEvent()) === false)
            return parent::_getPageMetaDesc();

        if(($aContent = $this->_getMetaContent()) !== false) {
            list($oModule, $aContentInfo) = $aContent;
            foreach([$oModule->_oTemplate->getAbstract($aContentInfo), $oModule->_oTemplate->getText($aContentInfo, false)] as $sResult)
                if(trim(strip_tags($sResult)) !== '')
                    return $sResult;
        }

        return !empty($aEvent['content']['text']) ? $aEvent['content']['text'] : parent::_getPageMetaDesc();
    }

    protected function _getPageMetaType()
    {
        return 'article';
    }

    /**
     * An entry's cover, else its first attached photo; a post's first photo.
     */
    protected function _getPageMetaImage()
    {
        if(($aEvent = $this->_getMetaEvent()) === false)
            return '';

        $CNF = &$this->_oModule->_oConfig->CNF;

        $aImage = false;
        if(($aContent = $this->_getMetaContent()) !== false) {
            list($oModule, $aContentInfo) = $aContent;
            $aImage = $oModule->getEntryImageData($aContentInfo);
            if(!$aImage && $oModule instanceof BxBaseModTextModule)
                $aImage = $oModule->getEntryAttachedImageData($aContentInfo);
        }
        else {
            list($sType, $sAction, $iObjectId) = $this->_getMetaSource($aEvent);
            if(!$this->_oModule->_oConfig->isSystem($sType, $sAction) && ($aPhotos = $this->_oModule->_oDb->getMedia($CNF['FIELD_PHOTO'], $iObjectId)))
                $aImage = ['id' => reset($aPhotos), 'transcoder' => $this->_oModule->_oConfig->getObject('transcoder_photos_big')];
        }

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
