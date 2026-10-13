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
class BxMessengerJotMenu extends BxTemplMenuCustom
{
    protected $_oModule;
    protected $_iContentId;

    public function __construct($aObject, $oTemplate = false)
    {
        $this-> MODULE = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this-> MODULE);
        parent::__construct($aObject, $this->_oModule->_oTemplate);
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;
        $this->_aContentInfo = $this->_oModule->_oDb->getJotById($this->_iContentId);
        if($this->_aContentInfo)
            $this->addMarkers(array('content_id' => (int)$this->_iContentId));
    }

    public function getMenuItemByName($sName)
    {
        if (!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw ();

        return $this->_aObject['menu_items'][$sName];
    }

    public function isActive($sName){
        if (!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw ();

        return !empty($sName) && isset($this->_aObject['menu_items'][$sName]) && (int)$this->_aObject['menu_items'][$sName]['active'];
    }

    protected function _isVisible ($a)
    {
        if ($this->_iContentId && !($aInfo = $this->_oModule->_oDb->getJotById($this->_iContentId)))
            return false;

        $iProfileId = bx_get_logged_profile_id();
        if (!$iProfileId)
            return false;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oModule = &$this->_oModule;
        if(!parent::_isVisible($a))
            return false;

        if (in_array($a['name'], $CNF['JOT-MENU-TO-SHOW']))
            return false;

        $iJotAuthor = !empty($aInfo) ? (int)$aInfo[$CNF['FIELD_MESSAGE_AUTHOR']] : (int)$iProfileId;
        $iJotId = !empty($aInfo) ? (int)$aInfo[$CNF['FIELD_MESSAGE_ID']] : 0;

        $bAllowToDelete = $oModule->_oDb->isAllowedToDeleteJot($iJotId, $iProfileId, $iJotAuthor);
        $bAllowToEdit = $oModule->_oDb->isAllowedToEditJot($iJotId, $iProfileId) || empty($aInfo);
        $bVC = !empty($aJot) ? (int)$aJot[$CNF['FIELD_MESSAGE_VIDEOC']] : false;

        $aLotMenuSettings = $this->_oModule->_oDb->getLotSettings($this->_iContentId, $CNF['FLS_SETTINGS']);
        if (!empty($aLotMenuSettings) && in_array($a['name'], $aLotMenuSettings))
            return false;

        switch ($a['name']) {
            case 'edit':
                return !$bVC && $bAllowToEdit;
            case 'remove':
                return $bAllowToDelete;
            case 'thread':
                return $oModule->_oDb->isAuthor($this->_iContentId, $iProfileId) || ($oModule->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $iProfileId) === true);
        }

        return true;
    }

    public function getMenuItems ()
    {
        $aItems = parent::getMenuItems();

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oModule = &$this->_oModule;
        if (!empty($this->_aContentInfo))
        $aItems[] = [
            "name" => "time-info",
            "class" => " px-4 pt-2 text-sm ",
            "item" => $oModule->_oConfig->getSeparatorTime($this->_aContentInfo[$CNF['FIELD_MESSAGE_ADDED']])
        ];

        return $aItems;
    }

    public function getCode(){


        return $this->_oTemplate->parseHtmlByName('popup_trans.html', [
            'id' => "jot-menu-" . genRndPwd(8, false),
            'wrapper_class' => 'bx-popup-menu',
            'wrapper_style' => 'display:none;',
            'content' => parent::getCode()]);
    }

}

/** @} */
