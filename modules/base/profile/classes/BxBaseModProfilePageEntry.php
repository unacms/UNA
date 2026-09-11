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
 * Profile create/edit/delete pages.
 */
class BxBaseModProfilePageEntry extends BxBaseModGeneralPageEntry
{
    protected $_sCanonicalUrl;
    protected $_aProfileInfo;
    protected $_oProfile;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        // get profile info
        $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);
        $iContentId = 0;
        if ('mine' == bx_get('id')) {
            $o = BxDolProfile::getInstance();
            if ($o && $iContentId = $o->getContentId())
                $_GET['id'] = $_REQUEST['id'] = $iContentId;
        } else {
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        }

        if ($iProfileId) {
            $this->_sCanonicalUrl = 'page.php?i=' . $this->_aObject['uri'] . '&profile_id=' . $iProfileId;
            $this->_oProfile = BxDolProfile::getInstance($iProfileId);
        }

        if (!$this->_oProfile && $iContentId)
            $this->_oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->MODULE);

        if ($this->_oProfile) {
            $this->_aProfileInfo = $this->_oProfile->getInfo();
            $this->_aContentInfo = $this->_oModule->_oDb->getContentInfoById($this->_aProfileInfo['content_id']);
        }

        if (!$this->_oProfile && isLogged() && !defined('BX_DOL_STUDIO_BUILDER_PAGE')) { // if no params are given, then redirect to own profile pages
            $a = [];
            if (isset($CNF['URI_VIEW_ENTRY']))
                $a[$CNF['URI_VIEW_ENTRY']] = ['id', 'getContentId'];
            if (isset($CNF['URI_VIEW_FRIENDS']))
                $a[$CNF['URI_VIEW_FRIENDS']] = ['profile_id', 'id'];
            if (isset($CNF['URI_VIEW_RELATIONS']))
                $a[$CNF['URI_VIEW_RELATIONS']] = ['profile_id', 'id'];

            foreach ($a as $sUri => $r) {
                if ($this->_aObject['uri'] == $sUri && ($oProfile = BxDolProfile::getInstance()) !== false) {
                    $this->setForceRedirect(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $sUri . '&' . $r[0] . '=' . $oProfile->{$r[1]}())));
                    return;
                }
            }
        }

        if (!$this->_isAvailablePage($this->_aObject) || !$this->_oProfile) {
            $this->setPageCover(false);
            return;
        }

        $bLoggedOwner = $this->_oProfile->id() == bx_get_logged_profile_id();
        $bLoggedModerator = $this->_oModule->checkAllowedEditAnyEntry() === CHECK_ACTION_RESULT_ALLOWED;
        if(!$this->_oProfile->isActive() && !$bLoggedOwner && !$bLoggedModerator) {
            $this->setPageCover(false);
            return;
        }

        // select view profile submenu
        $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if($oMenuSubmenu)
            $oMenuSubmenu->setObjectSubmenu($CNF['OBJECT_MENU_SUBMENU_VIEW_ENTRY'], array (
                'title' => $this->_oProfile->getDisplayName(),
                'link' => $this->_oProfile->getUrl(),
                'icon' => $CNF['ICON'],
            ));

        // select view profile manage menu
        if(($oMenuManage = BxDolMenu::getObjectInstance('sys_site_manage')) !== false) {
            if(!empty($CNF['FIELD_ID']) && !empty($this->_aContentInfo) && is_array($this->_aContentInfo))
                $oMenuManage->setContentId($this->_aContentInfo[$CNF['FIELD_ID']]);

            $aObjectManage = [];
            if(!empty($CNF['OBJECT_MENU_MANAGE_VIEW_ENTRY']))
                $aObjectManage = [$CNF['OBJECT_MENU_MANAGE_VIEW_ENTRY']];
            else if(!empty($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE']))
                $aObjectManage = [$CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE'], true];

            call_user_func_array([$oMenuManage, 'setObjectManage'], $aObjectManage);
        }

        // add replaceable markers
        $this->addMarkers($this->_aContentInfo);
        $this->addMarkers($this->_aProfileInfo); // every content field can be used as marker
        $this->addMarkers(array('profile_id' => $this->_oProfile->id())); // profile id field
        $this->addMarkers(array('display_name' => $this->_oProfile->getDisplayName())); // profile display name
        $this->addMarkers(array('profile_link' => $this->_oProfile->getUrl())); // profile link

        if(($oInformer = BxDolInformer::getInstance($this->_oTemplate))) {
            $aInformers = [];

            // display message to profile author if profile isn't active
            if ($bLoggedOwner && !empty($CNF['INFORMERS']['status'])) {
                $sStatus = $this->_aContentInfo['profile_status'];

                $aInformer = $CNF['INFORMERS']['status'];
                if (isset($aInformer['map'][$sStatus]))
                    $aInformers[] = array ('name' => $aInformer['name'], 'msg' => _t($aInformer['map'][$sStatus]), 'type' => BX_INFORMER_ALERT);
            }

            // display message to moderator/administrator if profile isn't active
            if (!$bLoggedOwner && $bLoggedModerator && !empty($CNF['INFORMERS']['status_moderation'])) {
                $sStatus = $this->_aContentInfo['profile_status'];
                $sManageUrl = '#';
                if(!empty($CNF['FIELD_TITLE']) && !empty($CNF['URL_MANAGE_ADMINISTRATION']))
                    $sManageUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_MANAGE_ADMINISTRATION'], array('filter' => urlencode($this->_aContentInfo[$CNF['FIELD_TITLE']]))));

                $aInformer = $CNF['INFORMERS']['status_moderation'];
                if (isset($aInformer['map'][$sStatus]))
                    $aInformers[] = array ('name' => $aInformer['name'], 'msg' => _t($aInformer['map'][$sStatus], $sManageUrl), 'type' => BX_INFORMER_ALERT);
            }

            // add informers
            if ($aInformers)
                foreach ($aInformers as $a)
                    $oInformer->add($a['name'], $this->_replaceMarkers($a['msg']), $a['type']);

            if($bLoggedOwner || $bLoggedModerator)
                $this->_oProfile->getAccountObject()->addInformerDeletionScheduled($oInformer);
        }

        // display message if it is possible to switch to this profile
        if ($this->_oModule->serviceActAsProfile()) {
            $oProfile = $this->_aContentInfo ? BxDolProfile::getInstanceByContentAndType($this->_aContentInfo['id'], $this->MODULE) : false;
            if ($oProfile)
                $oProfile->checkSwitchToProfile($this->_oTemplate);
        }

        // set cover
        $this->_oModule->_oTemplate->setCover($this, $this->_aContentInfo);
    }

    public function getCode ()
    {
        $this->_oTemplate->addCss('main.css');

        $sResult = parent::getCode();
        if($this->_sCanonicalUrl)
            BxDolTemplate::getInstance()->setPageUrl($this->_sCanonicalUrl);

        return $sResult;
    }

    protected function _isAvailablePage($a)
    {
        // check if profile is active
        if(!$this->_oProfile || (!$this->_oProfile->isActive() && $this->_oProfile->id() != bx_get_logged_profile_id() && $this->_oModule->checkAllowedEditAnyEntry() !== CHECK_ACTION_RESULT_ALLOWED))
            return false;

        return parent::_isAvailablePage($a);
    }

    protected function _isVisiblePage ($a)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        bx_import('BxDolPrivacy');

        if(($mixedAllowView = $this->_oModule->checkAllowedView($this->_aContentInfo)) !== CHECK_ACTION_RESULT_ALLOWED) {
            /*
             * If visible by privacy, replace current page with different set of blocks.
             */
            if(!in_array($this->_aContentInfo['allow_view_to'], [BX_DOL_PG_HIDDEN, BX_DOL_PG_MEONLY])) {
                $aObject = BxDolPageQuery::getPageObject($CNF['OBJECT_PAGE_VIEW_ENTRY_CLOSED']);
                $this->_sObject = $aObject['object'];
                $this->_aObject = $aObject;
                $this->_oQuery = new BxDolPageQuery($this->_aObject);
            }
            else 
                return $mixedAllowView;
        }

        if(!BxDolPage::_isVisiblePage($a))
            return false;
        
        $this->_oModule->checkAllowedView($this->_aContentInfo, true);
        
        return true;
    }

    /**
     * A profile page describes somebody, not a document. The very same value is produced by
     * BxBaseModProfileModule::getShareCard(), which share_card.php reaches without a page around it -
     * the two producers have to agree or the card is served off a hash nobody advertised, so the
     * CNF override is read here exactly as it is read there.
     */
    protected function _getPageMetaType()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return !empty($CNF['OG_TYPE']) ? $CNF['OG_TYPE'] : 'profile';
    }
}

/** @} */
