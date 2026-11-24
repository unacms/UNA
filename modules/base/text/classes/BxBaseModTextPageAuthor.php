<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseText Base classes for text modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Profile's entries page.
 */
class BxBaseModTextPageAuthor extends BxTemplPage
{
    protected $_aProfileInfo;
    protected $_oProfile;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        // get profile info
        $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        if ($iProfileId) {
            $this->_oProfile = BxDolProfile::getInstance($iProfileId);
            $this->_aProfileInfo = $this->_oProfile ? $this->_oProfile->getInfo() : false;
        }

        if (!$this->_aProfileInfo || !$this->_oProfile)
            return;

        if(bx_process_input(bx_get('owner'), BX_DATA_INT) == 1) {
            // select item in Profile Stats menu
            $oMenu = BxDolMenu::getObjectInstance('sys_profile_stats');
            if($oMenu && isset($this->_aObject['module']) && ($oModuleContent = BxDolModule::getInstance($this->_aObject['module']))) {
                $oMenu->setSelected($this->_aObject['module'], 'profile-stats-my-' . $oModuleContent->_oConfig->getUri());
            }
        }
        else {
            //set cover
            $sProfileModule = $this->_oProfile->getModule();
            if(BxDolRequest::serviceExists($sProfileModule, 'set_view_profile_cover')) {
                $aProfileInfoFull = BxDolService::call($sProfileModule, 'get_all', array(array('type' => 'id', 'id' => $this->_oProfile->getContentId())));

                BxDolService::call($sProfileModule, 'set_view_profile_cover', array($this, $aProfileInfoFull));
            }

            // select view profile submenu
            $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
            if ($oMenuSubmenu) {
                $sProfileObject = BxDolService::call($this->_oProfile->getModule(), 'get_submenu_object');
                if ($sProfileObject)
                    $oMenuSubmenu->setObjectSubmenu($sProfileObject, array (
                        'title' => $this->_oProfile->getDisplayName(),
                        'link' => $this->_oProfile->getUrl(),
                        'icon' => $this->_oProfile->getIconModule(),
                    ));
            }
        }

        // add replaceable markers
        $this->addMarkers($this->_aProfileInfo); // every profile field can be used as marker
        $this->addMarkers(array('profile_id' => $this->_oProfile->id())); // profile id 
        $this->addMarkers(array('display_name' => $this->_oProfile->getDisplayName())); // profile display name 
        $this->addMarkers(array('profile_link' => $this->_oProfile->getUrl())); // profile link
    }
    
    /**
     * A profile's items show the profile's cover, except the owner's own list (owner=1), which has the page's own.
     */
    public static function getOwnerCoverMode()
    {
        return BX_PAGE_OWNER_COVER_OTHERS;
    }

    public function getCode()
    {
        if(!empty($this->_oProfile))
            BxDolTemplate::getInstance()->setPageUrl('page.php?i=' . $this->_aObject['uri'] . '&profile_id=' . $this->_oProfile->id());

        return parent::getCode();
    }

    protected function _isAvailablePage($a)
    {
        if (!$this->_aProfileInfo || !$this->_oProfile) {
            $this->_aObject['cover'] = 0;
            return false;
        }
        
        return parent::_isAvailablePage($a);
    }
}

/** @} */
