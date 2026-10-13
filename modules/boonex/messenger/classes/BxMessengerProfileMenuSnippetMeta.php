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
    protected $_oModuleContent;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_messenger';

        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemMessage($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(bx_is_api()) {
            $aProfile = BxDolProfileQuery::getInstance()->getProfileByContentAndType($this->_iContentId, $this->_oModuleContent->getName());
            if(empty($aProfile) || !is_array($aProfile))
                return [];

            $aParticipants = [bx_get_logged_profile_id(), $aProfile['id']];

            $aLot = $this->_oModule->_oDb->findLotByParams([
                $CNF['FIELD_PARTICIPANTS'] => $aParticipants,
                $CNF['FIELD_TYPE'] => BX_IM_TYPE_PRIVATE
            ]);
            
            if(empty($aLot) || !is_array($aLot)) {
                $aResult = $this->_oModule->saveParticipantsList($aParticipants);
                if(!isset($aResult['lot']))
                    return [];

                $aLot = $this->_oModule->_oDb->getLotInfoById($aResult['lot']);
                if(empty($aLot) || !is_array($aLot))
                    return [];
            }

            return $this->_getMenuItemAPI($aItem, 'text', [
                'title' => _t($aItem['title']),
                'link' => bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']) . '/inbox/' . $aLot['hash']),
                'display_type' => 'button',
                'emulate' => true
            ]);
        }

        return $this->_getMenuItem($aItem);
    }

    public function setContentModule($sModule = ''){
        if ($sModule)
            $this->_oModuleContent = BxDolModule::getInstance($sModule);
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;
        if(!empty($this->_iContentId)) {
            $this->_aContentInfo = $this->_getContentInfo($this->_iContentId);

            $this->addMarkers(array(
                'content_id' => $this->_iContentId,
                'profile_id' => $this->_aContentInfo[$this->_oModuleContent->_oConfig->CNF['FIELD_AUTHOR']]
            ));
        }
    }

    protected function _getContentInfo($iContentId)
    {
        return !empty($this->_oModuleContent) && method_exists($this->_oModuleContent->_oDb, 'getContentInfoById') ? $this->_oModuleContent->_oDb->getContentInfoById($iContentId) : array();
    }
}

/** @} */
