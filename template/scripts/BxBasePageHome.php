<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Homepage.
 */
class BxBasePageHome extends BxTemplPage
{
    protected $_sCanonicalUrl;

    public function __construct($aObject, $oTemplate)
    {
        parent::__construct($aObject, $oTemplate);

        $aCover = $this->getPageCoverImage();

        $bTmplVarsCover = !empty($aCover['id']);
        $aTmplVarsCover = $bTmplVarsCover ? array('image_url' => BxDolTranscoder::getObjectInstance($aCover['transcoder'])->getFileUrlById($aCover['id'])) : array();

        BxDolCover::getInstance()->set(array(
            'class' => 'bx-cover-homepage',
            'title' => _t('_sys_txt_homepage_cover', bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-account'))),
            'bx_if:empty_cover_class' => array (
                'condition' => !$bTmplVarsCover,
                'content' => array(),
            ),
            'bx_if:bg' => array (
                'condition' => $bTmplVarsCover,
                'content' => $aTmplVarsCover,
            ),
        ), 'cover_home.html');

        $sSelName = 'home';
        if(bx_get('i') !== false)
            $sSelName = bx_process_input(bx_get('i'));

        if($sSelName == 'home')
            $this->_sCanonicalUrl = BX_DOL_URL_ROOT;

        BxDolMenu::setSelectedGlobal('system', $sSelName);
    }

    public function getCode ()
    {
        $s = parent::getCode ();

        if($this->_sCanonicalUrl)
            BxDolTemplate::getInstance()->setPageUrl($this->_sCanonicalUrl);

        return $s;
    }

    /**
     * The page for the apps, with the home cover the site shows above the blocks (`cover_home`) where the site shows it:
     * covers on in Studio > Designer > Cover, the page's cover on for this viewer (Studio > Pages > Home > Cover), and
     * no splash for the guest.
     */
    public function getPageAPI($aBlocks = [])
    {
        $a = parent::getPageAPI($aBlocks);

        $bCover = ($a['layout'] ?? '') != 'splash' && empty($a['page_status']) && $this->isPage();
        if($bCover && BxDolCover::getInstance()->isEnabled() && $this->isPageCover()) {
            $a['cover_home'] = $this->getCoverHomeAPI();
        }

        return $a;
    }

    /**
     * The home cover for the apps, as the site draws it: the words, the picture and, for guests, the links to sign up
     * and to log in, the first of them the primary one.
     * @return array title, title_accent (shown after the title, highlighted; may be empty), text, image (the page's
     *         cover picture, else the site's common cover from Studio > Designer > Cover; empty for none),
     *         image_default (the template's own art the site shows when there is no picture: light and dark URLs),
     *         actions (name, title, link, primary, icon)
     */
    public function getCoverHomeAPI()
    {
        $aLook = $this->_getCoverHomeLookAPI();

        $sImage = '';
        $aCover = $this->getPageCoverImage();
        if(!empty($aCover['id']) && ($oTranscoder = BxDolTranscoder::getObjectInstance($aCover['transcoder']))) {
            $sImage = (string)$oTranscoder->getFileUrlById($aCover['id']);
        }

        $aActions = [];
        // The apps' own routes, as the splash's __join_link__ and __login_link__ (BxDolSplash).
        if(!isLogged()) {
            $aActions = [
                ['name' => 'join', 'title' => $aLook['join'], 'link' => '/create-account', 'primary' => true, 'icon' => $aLook['join_icon']],
                ['name' => 'login', 'title' => $aLook['login'], 'link' => '/login', 'primary' => false, 'icon' => $aLook['login_icon']],
            ];
        }

        return [
            'title' => $aLook['title'],
            'title_accent' => $aLook['title_accent'],
            'text' => $aLook['text'],
            'image' => $sImage,
            'image_default' => [
                'light' => $aLook['image_light'],
                'dark' => $aLook['image_dark'],
            ],
            'actions' => $aActions,
        ];
    }

    /**
     * How the template draws its home cover, for the apps: the words (translated: title, title_accent, text, join,
     * login), the buttons' icons (join_icon, login_icon) and the art it shows without a picture (image_light,
     * image_dark: URLs). A template with a cover of its own overrides it.
     */
    protected function _getCoverHomeLookAPI()
    {
        // The default Studio > Designer > Cover shows for the site's template: its own art, else cover.svg.
        list($sArtLight, $sArtDark) = BxDolCover::getDefaultArt(BxDolModuleQuery::getInstance()->getModuleByUri($this->_oTemplate->getCode()));

        return [
            'title' => _t('_sys_txt_splash_title'),
            'title_accent' => '',
            'text' => BxDolSplash::getInstance()->getSiteDescription(),
            'join' => _t('_sys_txt_splash_join'),
            'login' => _t('_sys_txt_splash_login'),
            'join_icon' => '',
            'login_icon' => '',
            'image_light' => $sArtLight,
            'image_dark' => $sArtDark,
        ];
    }

    protected function _getBlockRaw($aBlock)
    {
        if(strpos($aBlock['title'], 'splash') !== false) {
            $oPermalink = BxDolPermalinks::getInstance();

            $sJoinForm = $sLoginForm = '';
            if(!isLogged()) {
                $sJoinForm = BxDolService::call('system', 'create_account_form', array(), 'TemplServiceAccount');
                $sLoginForm = BxDolService::call('system', 'login_form', array(), 'TemplServiceLogin');
            }

            $oTemplate = BxDolTemplate::getInstance();
            $aBlock['content'] = $oTemplate->parseHtmlByContent($aBlock['content'], array(
                'join_link' => bx_absolute_url($oPermalink->permalink('page.php?i=create-account')),
                'join_form' => $sJoinForm,
                'join_form_in_box' => !empty($sJoinForm) ? DesignBoxContent(_t('_sys_txt_splash_join'), $sJoinForm, BX_DB_PADDING_DEF) : '',
                'login_link' => bx_absolute_url($oPermalink->permalink('page.php?i=login')),
                'login_form' => $sLoginForm,
                'login_form_in_box' => !empty($sLoginForm) ? DesignBoxContent(_t('_sys_txt_splash_login'), $sLoginForm, BX_DB_PADDING_DEF) : '',
            ));
        }

        return parent::_getBlockRaw($aBlock);
    }
}

/** @} */
