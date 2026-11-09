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
