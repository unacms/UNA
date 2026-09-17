<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseProfile Base classes for profile modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View profile entry menu
 */
class BxBaseModProfileMenuView extends BxTemplMenuMoreAuto
{
    protected $_sModule;
    protected $_oModule;

    protected $_iContentId;
    protected $_aContentInfo;

    protected $_oProfile;
    protected $_aProfileInfo;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
        if(!$oTemplate)
            $oTemplate = $this->_oModule->_oTemplate;

        parent::__construct($aObject, $oTemplate);

        $CNF = $this->_oModule->_oConfig->CNF;

        $this->_aHtmlIds['main'] = 'bx-menu-main-submenu';

        $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if(empty($iContentId) && bx_get('profile_id') !== false)
            $iContentId = BxDolProfile::getInstance(bx_process_input(bx_get('profile_id'), BX_DATA_INT))->getContentId();

        if(!empty($iContentId))
            $this->setContentId($iContentId);
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;

        $this->_oProfile = BxDolProfile::getInstanceByContentAndType($this->_iContentId, $this->_sModule);
        if(!$this->_oProfile) 
            return;

        $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_iContentId);
        $this->_aProfileInfo = $this->_oProfile->getInfo();     

        $this->addMarkers($this->_aProfileInfo);
        $this->addMarkers(array(
            'profile_id' => $this->_oProfile->id()
        ));
    }

    public function isMenuItemActive($a)
    {
        return parent::_isActive($a);
    }

    public function isMenuItemVisible($a)
    {
        return parent::_isVisible($a);
    }

    /**
     * Check if menu items is visible with extended checking linked to "allow*" method of particular module
     * Associated "allow*" method with particular menu item is stored in module config in MENU_ITEM_TO_METHOD array.
     * @param $a menu item array
     * @return boolean
     */
    protected function _isVisible ($a)
    {
        if(!parent::_isVisible($a))
            return false;

        return $this->_oModule->isMenuItemVisible($this->_sObject, $a, $this->_aContentInfo);
    }
}

/** @} */
