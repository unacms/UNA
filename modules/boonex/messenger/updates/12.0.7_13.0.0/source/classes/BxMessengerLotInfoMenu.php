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
