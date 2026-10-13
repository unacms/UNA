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
    protected $_sModule;
    protected $_oModule;
    protected $_iContentId;
    private $_aContentInfo;
    private $_iProfileId;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        $this->_iProfileId = bx_get_logged_profile_id();
        parent::__construct($aObject, $this->_oModule->_oTemplate);
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;
        $this->_aContentInfo = $this->_oModule->_oDb->getJotById($this->_iContentId);
        if(!empty($this->_aContentInfo))
            $this->addMarkers(array('content_id' => $this->_iContentId));
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
        $aInfo = $this->_aContentInfo;

        if (!$this->_iProfileId)
            return false;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oModule = &$this->_oModule;
        if(!parent::_isVisible($a))
            return false;

        if (in_array($a['name'], $CNF['JOT-MENU-TO-SHOW']))
            return false;

        $iJotAuthor = !empty($aInfo) ? (int)$aInfo[$CNF['FIELD_MESSAGE_AUTHOR']] : (int)$this->_iProfileId;
        $iJotId = !empty($aInfo) ? (int)$aInfo[$CNF['FIELD_MESSAGE_ID']] : 0;

        $bAllowToDelete = $oModule->_oDb->isAllowedToDeleteJot($iJotId, $this->_iProfileId, $iJotAuthor);
        $bAllowToEdit = $oModule->_oDb->isAllowedToEditJot($iJotId, $this->_iProfileId) || empty($aInfo);
        $bVC = !empty($aJot) ? (int)$aJot[$CNF['FIELD_MESSAGE_VIDEOC']] : false;

        $aLotMenuSettings = $this->_oModule->_oDb->getLotSettings($this->_iContentId, $CNF['FLS_SETTINGS']);
        if (!empty($aLotMenuSettings) && in_array($a['name'], $aLotMenuSettings))
            return false;

        switch ($a['name']) {
            case 'edit':
                return !$bVC && $bAllowToEdit;
            case 'remove':
                return $bAllowToDelete;
            case 'save':
                return !$CNF['USE-UNIQUE-MODE'];
            case 'thread':
                return !$CNF['USE-UNIQUE-MODE'] && ($oModule->_oDb->isAuthor($this->_iContentId, $this->_iProfileId) || ($oModule->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true));
        }

        return true;
    }

    protected function _getMenuItem ($a){
        if ($a['name'] === 'save' && $this->_oModule->_oDb->isJotSaved($this->_iContentId, $this->_iProfileId))
                $a['title'] = _t('_bx_messenger_jot_menu_remove_save');

        return parent::_getMenuItem($a);
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
