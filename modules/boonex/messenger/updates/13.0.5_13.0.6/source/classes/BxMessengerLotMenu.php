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
class BxMessengerLotMenu extends BxBaseModTextMenu
{
    protected $_oModule;
    private $_sPopupTalOptions = '';
    private $_iProfileId = 0;
    private $_isBlockVersion = true;
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->MODULE);
        $this->_iProfileId = bx_get_logged_profile_id();

        parent::__construct($aObject, $this->_oModule->_oTemplate);
    }
    public function setMessengerType($bType){
        $this->_isBlockVersion = $bType;
    }

    public function isActive($sName){
        if (!isset($this->_aObject['menu_items']))
            $this->_aObject['menu_items'] = $this->getMenuItemsRaw ();

        return !empty($sName) && isset($this->_aObject['menu_items'][$sName]) && (int)$this->_aObject['menu_items'][$sName]['active'];
    }

    public function _getMenuItem ($aMenu)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oModule = &$this->_oModule;

        switch($aMenu['name']){
            case 'mute':
                    $bIsMuted = $oModule->_oDb->isMuted($this->_iContentId, $this->_iProfileId);
                    $aMenu['title'] = $bIsMuted ? _t('_bx_messenger_lots_menu_mute_info_on') : _t('_bx_messenger_lots_menu_mute_info_off');
                    $aMenu['icon'] = $bIsMuted ? $CNF['BELL_ICON_OFF'] : $CNF['BELL_ICON_ON'];
                    $aMenu['value'] = +$bIsMuted;
                break;
            case 'star':
                    $bIsFav = $oModule->_oDb->isStarred($this->_iContentId, $this->_iProfileId);
                    $aMenu['icon'] = $CNF['STAR_ICON'] . ((int)$bIsFav ? ' fill' : '');
                    $aMenu['title'] = !$bIsFav ? _t('_bx_messenger_lots_menu_star_on') : _t('_bx_messenger_lots_menu_star_off');
                    $aMenu['value'] = +$bIsFav;
                break;
            default:
                $aMenu['value'] = '';
        }

        return parent::_getMenuItem($aMenu);
    }

    public function getCode ()
    {
        return parent::getCode() . $this->_sPopupTalOptions;
    }

    public function setTemplateById ($iTemplateId)
    {
        if ($iTemplateId == BX_DB_MENU_TEMPLATE_TABS)
            $this->_aObject['template'] = 'menu_messenger_talk_header_hor.html';
        else
            $this->_aObject['template'] = 'menu_messenger_talk_header_ver.html';
    }

    protected function _isVisible ($a)
    {
        if (!$this->_iProfileId)
            return false;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oModule = &$this->_oModule;
        if(!parent::_isVisible($a) || !$this->_iContentId)
            return false;

        $aLotInfo = $this->_oModule->_oDb->getLotInfoById($this->_iContentId);
        $aLotMenuSettings = $this->_oModule->_oDb->getLotSettings($this->_iContentId, $CNF['FLS_SETTINGS']);
        if (!empty($aLotMenuSettings) && in_array($a['name'], $aLotMenuSettings))
            return false;

        $bAllowedEdit = $this->_oModule->_oDb->isAuthor($aLotInfo[$CNF['FIELD_ID']], $this->_iProfileId) || $this->_oModule->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true;
        $bBroadcast = $aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_BROADCAST;
        if (!$bAllowedEdit && $bBroadcast)
            return false;

        switch ($a['name']) {
            case 'settings':
                if ($this->_iContentId)
                    $this->addMarkers(array('lot_menu_id' => "lot-info-menu-{$this->_iContentId}"));

                $oMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_TALK_INFO_MENU']);
                $oMenu->setContentId($this->_iContentId);

                $this->_sPopupTalOptions = $oMenu->getCode();
                return true;

            case 'parent':
                if (isset($aLotInfo[$CNF['FIELD_PARENT_JOT']]) && (int)$aLotInfo[$CNF['FIELD_PARENT_JOT']]) {
                    $iMainLotId = $this->_oModule->_oDb->getLotByJotId((int)$aLotInfo[$CNF['FIELD_PARENT_JOT']]);
                    $aType = $this->_oModule->_oDb->getLotType($iMainLotId);
                    $this->addMarkers(array('id' => $iMainLotId, 'type' => $aType['type'], 'jot' => (int)$aLotInfo[$CNF['FIELD_PARENT_JOT']]));
                    return true;
                }

                return false;
            case 'list':
                if (!$this->_isBlockVersion)
                    return false;

                if (!($iGroupId = $this->_oModule->_oDb->getGroupIdByLotId($this->_iContentId)))
                    return false;

                $aGroupsList = $this->_oModule->_oDb->getTalksByGroupId($iGroupId);
                unset($aGroupsList[$this->_iContentId]);
                if (empty($aGroupsList))
                    return false;

                /*
                 *  if (!($this->_isBlockVersion && $aLotInfo[$CNF['FIELD_CLASS']] !== 'members'))
                    return false;
                 * */

            case 'mute':
            case 'star':
                $this->addMarkers(array('id' => $this->_iContentId));
                return true;
            case 'video_call':
                if (empty($aLotInfo) || $oModule->_oConfig->isJitsiAllowed($aLotInfo[$CNF['FIELD_TYPE']])) {
                    if (!empty($aLotInfo)) {
                        $aJVC = $oModule->_oDb->getJVC($this->_iContentId);
                        $sRoom = empty($aJVC) ? $oModule->_oConfig->getRoomId($aLotInfo[$CNF['FIELD_ID']], $aLotInfo[$CNF['FIELD_AUTHOR']]) : $aJVC[$CNF['FJVC_ROOM']];
                    } else
                        $sRoom = $oModule->_oConfig->getRoomId();

                    $this->addMarkers(array('room' => $sRoom, 'id' => $this->_iContentId));
                    return true;
                }
        }

        return false;
    }

}

/** @} */
