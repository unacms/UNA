<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup		UnaModules
 *
 * @{
 */

/**
 * View block menu.
 */
class BxMessengerLotInfoMenu extends BxBaseModTextMenu
{
    protected $_oModule;
    public function __construct($aObject, $oTemplate = false)
    {
        $this-> MODULE = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this-> MODULE);
        parent::__construct($aObject, $this->_oModule->_oTemplate);
    }

    public function setContentId($iContentId)
    {
        parent::setContentId($iContentId);

        $this->_aContentParams = array_merge((array)$this->_aContentParams, ['lot' => (int)$this->_iContentId]);
    }

    public function initContentParams()
    {
        parent::initContentParams();

        $this->_aContentParams['lot'] = (int)$this->_iContentId;
    }

    /**
     * API: the menu is requested on demand (system/get_menu) with the talk in params.
     */
    public function setContentParams($aParams)
    {
        if(empty($aParams['lot']))
            return false;

        $this->setContentId((int)$aParams['lot']);

        return parent::setContentParams($aParams);
    }

    /**
     * API: one menu for the talk header. Items of the talk menu (video call, star, mute, ...) go first,
     * its 'settings' item (which opens this menu on the site) is left out. The site keeps both menus as they are.
     */
    public function getCodeAPI ()
    {
        $aResult = parent::getCodeAPI();
        if(!$this->_iContentId)
            return $aResult;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $oMenuLot = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_ACTIONS_TALK_MENU']);
        if(!$oMenuLot)
            return $aResult;

        $oMenuLot->setContentId($this->_iContentId);
        $aMenuLot = $oMenuLot->getCodeAPI();
        if(empty($aMenuLot['items']) || !is_array($aMenuLot['items']))
            return $aResult;

        $aItems = array_values(array_filter($aMenuLot['items'], function($aItem) {
            return $aItem['name'] != 'settings';
        }));

        $aResult['items'] = array_merge($aItems, is_array($aResult['items']) ? $aResult['items'] : []);

        return $aResult;
    }

    protected function _isVisible ($a)
    {
        $iProfileId = bx_get_logged_profile_id();
        $aLotInfo = $this->_oModule->_oDb->getLotInfoById($this->_iContentId);
        if (!$iProfileId || empty($aLotInfo))
            return false;

        $oModule = &$this->_oModule;
        if(!parent::_isVisible($a) || !$this->_iContentId)
            return false;

        $this->addMarkers(array('id' => $this->_iContentId));
        switch ($a['name']) {
            case 'add_participants':
            case 'delete':
            case 'clear':
            case 'settings':
                return $oModule->_oDb->isAuthor($this->_iContentId, $iProfileId) || ($oModule->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $iProfileId) === true);

        }

        return true;
    }

    public function getCode(){
        return $this->_oTemplate->parseHtmlByName('popup_trans.html', [
            'id' => "lot-info-menu-{$this->_iContentId}",
            'wrapper_class' => 'bx-popup-menu',
            'wrapper_style' => 'display:none;',
            'content' => parent::getCode()]);
    }
}

/** @} */
