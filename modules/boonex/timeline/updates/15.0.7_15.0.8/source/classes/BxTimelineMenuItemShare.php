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

/**
 * 'Item' menu.
 */
class BxTimelineMenuItemShare extends BxTemplMenu
{
    protected $_sModule;
    protected $_oModule;

    protected $_iEvent;
    protected $_aEvent;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_timeline';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aObject, $this->_oModule->_oTemplate);

        $iContentId = 0;
        if(bx_get('content_id') !== false)
            $iContentId = bx_process_input(bx_get('content_id'), BX_DATA_INT);

        if(!empty($iContentId)) {
            $aBrowseParams = array('name' => '', 'view' => '', 'type' => '');
            foreach($aBrowseParams as $sKey => $sValue)
                if(bx_get($sKey) !== false)
                    $aBrowseParams[$sKey] = $this->_oModule->_oConfig->prepareParam($sKey);

            $this->setEventById($iContentId, $aBrowseParams);
        }
    }

    public function setEventById($iEventId, $aBrowseParams = array())
    {
    	$this->_iEvent = $iEventId;
    	$this->_aEvent = $this->_oModule->_oDb->getEvents(array('browse' => 'id', 'value' => $this->_iEvent));

        $this->_setBrowseParams($aBrowseParams);

        $sRepostOnclick = $sRepostWithOnclick = $sRepostToOnclick = $sAetSend = '';
        if(!empty($this->_aEvent) && is_array($this->_aEvent)) {
            $sType = $this->_aEvent['type'];
            $sAction = $this->_aEvent['action'];
            $bSystem = $this->_oModule->_oConfig->isSystem($sType, $sAction);

            /**
             * In API mode a system event's url is taken from the feed, which already
             * got the event's data from the content module.
             */
            $sUrl = $bSystem && $this->_bIsApi ? $this->_oModule->_oTemplate->getItemUrlCached($this->_iEvent) : false;
            if($sUrl !== false)
                $this->_aEvent['url'] = $sUrl;
            else {
                $this->_aEvent['url'] = $this->_oModule->_oConfig->getItemViewUrl($this->_aEvent);
                if($bSystem) {
                    $aResult = $this->_oModule->_oConfig->getSystemData($this->_aEvent);
                    if(!empty($aResult['url']))
                        $this->_aEvent['url'] = $aResult['url'];
                }
            }

            //--- Repost and 'Repost To' items, API menus have no onclick handlers
            if(!$this->_bIsApi) {
                $iOwnerId = $this->_oModule->getUserId(); //--- in whose timeline the content will be reposted
                $iObjectId = $bSystem ? $this->_aEvent['object_id'] : $this->_aEvent['id'];
                $sRepostOnclick = $this->_oModule->serviceGetRepostJsClick($iOwnerId, $sType, $sAction, $iObjectId);
                $sRepostWithOnclick = $this->_oModule->serviceGetRepostWithJsClick($iOwnerId, $sType, $sAction, $iObjectId);
                $sRepostToOnclick = $this->_oModule->serviceGetRepostToJsClick($iOwnerId, $sType, $sAction, $iObjectId);
            }

            //--- Send item
            $sAetSend = urlencode(base64_encode(json_encode([
                'name' => 'bx_timeline_send',
                'params' => [
                    'ViewLink' => $this->_aEvent['url']
                ]
            ]))); 
        }

        if($this->_bIsApi && ($sRootUrl = bx_api_get_base_url()) !== false) {
            if(substr(BX_DOL_URL_ROOT, -1) == '/' && substr($sRootUrl, -1) != '/')
                $sRootUrl .= '/';

            $this->_aEvent['url'] = str_replace(BX_DOL_URL_ROOT, $sRootUrl, $this->_aEvent['url']);
        }

        $this->addMarkers([
            'content_id' => $this->_iEvent,
            'content_url' => $this->_aEvent['url'],

            'view_js_object' => $this->_oModule->_oConfig->getJsObjectView($aBrowseParams),

            'repost_onclick' => $sRepostOnclick,
            'repost_with_onclick' => $sRepostWithOnclick,
            'repost_to_onclick' => $sRepostToOnclick,

            'et_send' => $sAetSend
        ]);
    }

    public function getMenuItems ()
    {
        $aItems = parent::getMenuItems();

        $aMarkers = array(
            'id' => $this->_iEvent,
            'module' => $this->_oModule->_oConfig->getName(),
            'url' => $this->_aEvent['url'],
            'title' => $this->_aEvent['title'],
            'img_url' => '',
            'img_url_encoded' => ''
        );

        /**
         * The image is used by the Pinterest link only. API output replaces
         * social sharing links with the item's url, so the event's data isn't needed.
         */
        $aEventData = !$this->_bIsApi ? $this->_oModule->_oTemplate->getDataCached($this->_aEvent) : [];
        if(!empty($aEventData['content']['images']) && is_array($aEventData['content']['images'])) {
            $aImage = array_shift($aEventData['content']['images']);

            $sImgUrl = isset($aImage['src_medium']) ? $aImage['src_medium'] : $aImage['src'];;
            if(!empty($sImgUrl))
                $aMarkers = array_merge($aMarkers, array(
                    'img_url' => $sImgUrl,
                    'img_url_encoded' => rawurlencode($sImgUrl),
                ));
        }

        if(($oSocial = BxDolMenu::getObjectInstance('sys_social_sharing')) !== false) {
            $oSocial->addMarkers($aMarkers);

            $aItems = array_merge($aItems, $oSocial->getMenuItems());
        }

        if($this->_bIsApi) {
            $aItemsApi = [];

            foreach($aItems as $aItem)
                switch($aItem['name']) {
                    case 'item-repost':
                        $iOwnerId = $this->_oModule->getUserId();
                        $sType = $this->_aEvent['type'];
                        $sAction = $this->_aEvent['action'];
                        $iObjectId = 0;

                        $sCommonPrefix = $this->_oModule->_oConfig->getPrefix('common_post');
                        if(str_replace($sCommonPrefix, '', $sType) == BX_TIMELINE_PARSE_TYPE_REPOST) {
                            $aRepostedData = unserialize($this->_aEvent['content']);

                            $sType = $aRepostedData['type'];
                            $sAction = $aRepostedData['action'];
                            $iObjectId = $aRepostedData['object_id'];
                        }
                        else
                            $iObjectId = $this->_oModule->_oConfig->isSystem($sType, $sAction) ? $this->_aEvent['object_id'] : $this->_aEvent['id'];

                        $aItemsApi['item-repost'] = array_merge($aItem, [
                            'data' => [
                                'author_id' => $iOwnerId,
                                'owner_id' => $iOwnerId,
                                'type' => $sType,
                                'action' => $sAction,
                                'object_id' => $iObjectId
                            ]
                        ]);
                        break;

                    case 'item-copy':
                        $aItemsApi['item-copy'] = array_merge($aItem, [
                            'link' => $aMarkers['url'],
                        ]);
                        break;

                    /**
                     * TODO: Update when unified Share popup will be used here.
                     */
                    case 'social-sharing-facebook':
                    case 'social-sharing-twitter':
                    case 'social-sharing-pinterest':
                    case 'social-sharing-linked_in':
                    case 'social-sharing-whatsapp':
                        if(isset($aItemsApi['item-share']))
                            break;

                        $aItemsApi['item-share'] = array_merge($aItem, [
                            'name' => 'item-share',
                            'title' => _t('_sys_menu_item_title_social_sharing'),
                            'link' => $aMarkers['url'],
                        ]);
                        break;
                }

            return array_values($aItemsApi);
        }

        return $aItems;
    }

    protected function _setBrowseParams($aBrowseParams = array())
    {
        $aMarkers = array();
        foreach($aBrowseParams as $sKey => $mixedValue)
            if(!is_array($aMarkers))
                $aMarkers[$sKey] = $mixedValue;

        $this->addMarkers($aMarkers);
        $this->addMarkers(array(
            'js_object_view' => $this->_oModule->_oConfig->getJsObjectView($aBrowseParams)
        ));
    }

    /**
     * Check if menu items is visible.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        if(empty($this->_aEvent) || !is_array($this->_aEvent))
            return false;

        $sCheckFuncName = '';
        $aCheckFuncParams = array();
        switch ($a['name']) {
            case 'item-repost':
                $sCheckFuncName = 'isAllowedRepost';
                $aCheckFuncParams = array($this->_aEvent);
                break;

            case 'item-send':
                $sCheckFuncName = 'isAllowedSend';
                $aCheckFuncParams = array($this->_aEvent);
                break;
        }

        if(!$sCheckFuncName || !method_exists($this->_oModule, $sCheckFuncName))
            return true;

        return call_user_func_array(array($this->_oModule, $sCheckFuncName), $aCheckFuncParams) === true;
    }
}

/** @} */
