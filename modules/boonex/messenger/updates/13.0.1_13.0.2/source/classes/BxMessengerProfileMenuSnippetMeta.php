<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    Channels Channels
 * @indroup     UnaModules
 *
 * @{
 */

/**
 * For API only.
 */
class BxMessengerProfileMenuSnippetMeta extends BxBaseModProfileMenuSnippetMeta
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_messenger';
        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemMessage($aItem)
    {
        if(bx_is_api())
            $sUrl = BxDolPermalinks::getInstance()->permalink($aItem['link'], ['profile_id' => $this->_aContentInfo[$this->_oModule->_oConfig->CNF['FIELD_AUTHOR']]]);
            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => _t($aItem['title']),
                'link' => bx_api_get_relative_url($sUrl),
                'display_type' => 'button',
                'emulate' => true
            ]);

        return $this->_getMenuItem($aItem);
    }

    public function setContentModule($sModule = ''){
        if ($sModule)
            $this->_oModule = BxDolModule::getInstance($sModule);
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;
        if(!empty($this->_iContentId)) {
            $this->_aContentInfo = $this->_getContentInfo($this->_iContentId);

            $this->addMarkers(array(
                'content_id' => $this->_iContentId,
                'profile_id' => $this->_aContentInfo[$this->_oModule->_oConfig->CNF['FIELD_AUTHOR']]
            ));
        }
    }

    protected function _getContentInfo($iContentId)
    {
        return !empty($this->_oModule) && method_exists($this->_oModule->_oDb, 'getContentInfoById') ? $this->_oModule->_oDb->getContentInfoById($iContentId) : array();
    }
}

/** @} */
