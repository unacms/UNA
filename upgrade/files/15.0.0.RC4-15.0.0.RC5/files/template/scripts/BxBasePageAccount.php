<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Account page.
 */
class BxBasePageAccount extends BxTemplPage
{
    protected $_oInformer;
    protected $_aMapStatus2LangKey = array (
        BX_PROFILE_STATUS_PENDING => '_sys_txt_account_pending',
        BX_PROFILE_STATUS_SUSPENDED => '_sys_txt_account_suspended',
    );

    public function __construct($aObject, $oTemplate)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_oInformer = BxDolInformer::getInstance($this->_oTemplate);
        if($this->_aObject['uri'] == 'account-profile-switcher')
            $this->_oInformer->remove('sys-account-profile-system');

        $oProfile = BxDolProfile::getInstance();
        $aProfileInfo = $oProfile ? $oProfile->getInfo() : false;

        $this->addMarkers(array(
            'account_id' => $aProfileInfo ? $aProfileInfo['account_id'] : 0,
            'profile_id' => $aProfileInfo ? $aProfileInfo['id'] : 0,
            'profile_type' => $aProfileInfo ? $aProfileInfo['type'] : 0,
            'profile_content_id' => $aProfileInfo ? $aProfileInfo['content_id'] : 0,
        ));

        // set settings submenu
        $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if ($oMenuSubmenu) {
            $oMenuSubmenu->setObjectSubmenu('sys_account_settings_submenu', array (
                'title' => _t('_sys_menu_item_title_account_settings'),
                'link' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=settings')),
                'icon' => '',
            ));
        }

        // display message if profile isn't active
        if ($oProfile) {
            $sStatus = $oProfile->getStatus();
            if(isset($this->_aMapStatus2LangKey[$sStatus]))
                $this->_oInformer->add('sys-account-status-not-active', _t($this->_aMapStatus2LangKey[$sStatus]), BX_INFORMER_ALERT);
        }

        // switch profile context
        if ($iSwitchToProfileId = (int)bx_get('switch_to_profile')) {
            $sInformerMsg = '';
            $oProfile = BxDolProfile::getInstance($iSwitchToProfileId);

            if($oProfile && BxDolService::call($oProfile->getModule(), 'act_as_profile')) {
                $mixedRes = bx_srv('system', 'switch_profile', [$oProfile->id()], 'TemplServiceAccount');
                if($mixedRes === true) {
                    if(bx_get('redirect') !== false) {
                        $sLocation = '';

                        switch(bx_process_input(bx_get('redirect'))) {
                            case 'back':
                                if(isset($_SERVER['HTTP_REFERER']) && mb_stripos($_SERVER['HTTP_REFERER'], BX_DOL_URL_ROOT) === 0)
                                    $sLocation = $_SERVER['HTTP_REFERER'];
                                break;

                            case 'home':
                                $sLocation = BX_DOL_URL_ROOT;
                                break;

                            case 'profile':
                                $sLocation = $oProfile->getUrl();
                                break;

                            case 'custom':
                                $sLocation = getParam('sys_account_switch_to_profile_redirect_custom');
                                if(mb_stripos($sLocation, BX_DOL_URL_ROOT) !== 0)
                                    $sLocation = '';
                                break;
                        }

                        if($sLocation != '') {
                            header('Location: ' . $sLocation);
                            exit;
                        }
                    }

                    $sInformerMsg = _t('_sys_txt_account_profile_context_changed_success', $oProfile->getDisplayName());
                }
                else
                    $sInformerMsg = $mixedRes;

                $this->_oInformer->add('sys-account-profile-context-change-result', $sInformerMsg ? $sInformerMsg : _t('_error occured'), true === $mixedRes ? BX_INFORMER_INFO : BX_INFORMER_ERROR);
            }
        }
    }

    /**
     * The settings section's own page (`settings`, sys_settings) has nothing of its own to show on the site, so it
     * opens the settings menu's first page the member gets (Account). The apps show the menu itself there on phones and
     * tablets, as a list (BxDolMenu::SECTION_NAV_SMALL_LIST; the menu names the page as its `hub`). A site that gave
     * the page blocks in Studio keeps the page.
     */
    public function displayPage ($oTemplate = null)
    {
        if(isLogged() && ($sUrl = $this->getSectionFirstPageUrl()) !== '') {
            header('Location: ' . $sUrl, true, 302);
            exit;
        }

        parent::displayPage($oTemplate);
    }

    /**
     * Where the section's own page sends the member on the site: the first page of the settings menu they get. Empty
     * for any other page, for a page that has blocks, and when the menu has no page to open.
     */
    public function getSectionFirstPageUrl()
    {
        $oMenu = $this->_sObject == 'sys_settings' ? BxDolMenu::getObjectInstance('sys_account_settings_submenu') : false;
        if(!$oMenu || array_filter($this->_oQuery->getPageBlocks())) {
            return '';
        }

        $sLinkOwn = BxDolPermalinks::getInstance()->permalink('page.php?i=' . $this->_aObject['uri']);
        foreach($oMenu->getMenuItems() as $aItem) {
            $sLink = isset($aItem['link']) ? (string)$aItem['link'] : '';
            if($sLink !== '' && $sLink !== $sLinkOwn && mb_stripos($sLink, 'javascript:') !== 0) {
                return bx_absolute_url($sLink);
            }
        }

        return '';
    }

    protected function _isVisiblePage ($a)
    {
        if (!isLogged())
                return false;

        return parent::_isVisiblePage ($a);
    }
    
	protected function _addJsCss()
    {
    	parent::_addJsCss();

        $this->_oTemplate->addCss('account.css');
    }

    protected function _getPageCacheParams ()
    {
        $s = parent::_getPageCacheParams ();
        return $s . getLoggedId(); // cache is different for every account
    }
}

/** @} */
