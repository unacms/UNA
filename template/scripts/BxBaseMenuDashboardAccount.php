<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * "Your account" on the dashboard (sys_dashboard_account): the member's profile with the profile switcher, their
 * stats as tiles (the Profile stats menu, sys_profile_stats_tiles), their preferences (sys_account_preferences) and
 * Sign out. Each part is an item, so Studio > Navigation can hide or reorder them. The apps get the same parts as
 * data (getCodeAPI) and draw them with their own controls.
 */
class BxBaseMenuDashboardAccount extends BxTemplMenuCustom
{
    public const POPUP_SWITCHER = 'bx-menu-dashboard-account-switcher';

    protected $_oProfile;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_oProfile = BxDolProfile::getInstance();
    }

    public function getCode ()
    {
        if(!$this->_oProfile)
            return '';

        return parent::getCode();
    }

    public function getCodeAPI ()
    {
        if(!$this->_oProfile)
            return [];

        return parent::getCodeAPI();
    }

    /**
     * The profile in use, a link to it, its membership level and, when there is something to switch to, the switcher.
     */
    protected function _getMenuItemProfile ($aItem)
    {
        $iProfileId = $this->_oProfile->id();

        $aAcl = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId);
        $aAclInfo = !empty($aAcl['id']) ? BxDolAcl::getInstance()->getMembershipInfo($aAcl['id']) : [];
        $sAclTitle = !empty($aAclInfo['name']) ? _t($aAclInfo['name']) : '';

        $aProfiles = $this->_getSwitcherProfiles();
        $bCreate = $this->_isProfileCreateAllowed();

        if($this->_bIsApi)
            return [
                'name' => $aItem['name'],
                'profile' => BxDolProfile::getData($iProfileId),
                'membership' => $sAclTitle,
                'profiles' => count($aProfiles) + 1,
                'switcher' => !empty($aProfiles) || $bCreate,
            ];

        $bSwitcher = !empty($aProfiles) || $bCreate;
        $sSwitcherTitle = _t('_sys_menu_item_title_switch_profile');

        return $this->_oTemplate->parseHtmlByName('menu_dashboard_account_profile.html', [
            'profile_url' => $this->_oProfile->getUrl(),
            'profile_title' => $this->_oProfile->getDisplayName(),
            'profile_unit' => $this->_oProfile->getUnit(0, ['template' => ['name' => 'unit_wo_info', 'size' => 'thumb']]),
            'bx_if:acl' => [
                'condition' => (bool)$sAclTitle,
                'content' => [
                    'acl_title' => $sAclTitle,
                ],
            ],
            'bx_if:switcher' => [
                'condition' => $bSwitcher,
                'content' => [
                    'popup_id' => self::POPUP_SWITCHER,
                    'switcher_title' => bx_html_attribute($sSwitcherTitle),
                    'popup' => $bSwitcher ? $this->_getSwitcherPopup($aProfiles, $bCreate) : '',
                ],
            ],
        ]);
    }

    /**
     * The member's own stats as tiles: Profile stats on its own menu object, so the tiles are cached apart from the
     * list on the home page.
     */
    protected function _getMenuItemStats ($aItem)
    {
        return $this->_getSubmenu($aItem, 'sys_profile_stats_tiles');
    }

    /**
     * Settings, language and theme (sys_account_preferences).
     */
    protected function _getMenuItemPreferences ($aItem)
    {
        return $this->_getSubmenu($aItem, 'sys_account_preferences');
    }

    /**
     * Sign out (and any link Studio adds) is a full width button.
     */
    protected function _getMenuItemDefault ($aItem)
    {
        $aItem['class_wrp'] = 'block';
        $aItem['class_link'] = 'bx-btn !flex w-full justify-center';

        return parent::_getMenuItemDefault($aItem);
    }

    protected function _getSubmenu ($aItem, $sDefault)
    {
        $sObject = !empty($aItem['submenu_object']) ? $aItem['submenu_object'] : $sDefault;
        $oMenu = BxDolMenu::getObjectInstance($sObject);
        if(!$oMenu)
            return false;

        if($this->_bIsApi) {
            $aMenu = $oMenu->getCodeAPI();
            if(empty($aMenu['items']))
                return false;

            return [
                'name' => $aItem['name'],
                'menu' => $aMenu,
            ];
        }

        return $oMenu->getCode();
    }

    /**
     * The account's other profiles a member can act as, the one in use left out.
     */
    protected function _getSwitcherProfiles ()
    {
        $oModuleQuery = BxDolModuleQuery::getInstance();

        $aResult = [];
        $aProfiles = BxDolProfileQuery::getInstance()->getProfilesByAccount($this->_oProfile->getAccountId());
        foreach($aProfiles as $aProfile) {
            if($aProfile['id'] == $this->_oProfile->id() || !$oModuleQuery->isEnabledByName($aProfile['type']))
                continue;

            if(!BxDolService::call($aProfile['type'], 'act_as_profile'))
                continue;

            $aResult[] = $aProfile;
        }

        return $aResult;
    }

    protected function _isProfileCreateAllowed ()
    {
        if(!BxDolAccount::isAllowedCreateMultiple($this->_oProfile->id()))
            return false;

        $oAccount = BxDolAccount::getInstance();
        return !$oAccount || !$oAccount->isProfilesLimitReached();
    }

    /**
     * The switcher: the other profiles to switch to, then the page that lists them all and creates new ones.
     */
    protected function _getSwitcherPopup ($aProfiles, $bCreate)
    {
        $sContent = '';
        if(!empty($aProfiles)) {
            $aResult = bx_srv('system', 'account_profile_switcher', [], 'TemplServiceProfiles');
            if(!empty($aResult['content']))
                $sContent .= $aResult['content'];
        }

        if($bCreate)
            $sContent .= $this->_oTemplate->parseHtmlByName('map_profile_create.html', [
                'url_switch_profile' => BxDolPermalinks::getInstance()->permalink('page.php?i=account-profile-switcher')
            ]);

        return BxTemplFunctions::getInstance()->transBox(self::POPUP_SWITCHER, $sContent, true);
    }
}

/** @} */
