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
        $oTours = BxDolTours::getInstance();
        if ($oTours->isAvailable(BxDolTours::HOME))
            $s .= $this->_oTemplate->parseHtmlByName('homepage_tour.html', $oTours->getTemplateVars(BxDolTours::HOME));

        if($this->_sCanonicalUrl)
            BxDolTemplate::getInstance()->setPageUrl($this->_sCanonicalUrl);

        return $s;
    }

    /**
     * The page for the apps, with the home cover the site shows above the blocks (`cover_home`) while the page's cover
     * is on for this viewer (Studio > Pages > Home > Cover) and the guest gets no splash.
     */
    public function getPageAPI($aBlocks = [])
    {
        $a = parent::getPageAPI($aBlocks);

        if(($a['layout'] ?? '') != 'splash' && empty($a['page_status']) && $this->isPage() && $this->isPageCover()) {
            $a['cover_home'] = $this->getCoverHomeAPI();
        }

        return $a;
    }

    /**
     * The home cover for the apps: the words, the cover picture (the page's, else the site's common cover) and, for
     * guests, the links to sign up and to log in, the first of them the primary one.
     * @return array title, title_accent (shown after the title, highlighted; may be empty), text, image (URL or empty), actions
     */
    public function getCoverHomeAPI()
    {
        $aTexts = $this->_getCoverHomeTextsAPI();

        $sImage = '';
        $aCover = $this->getPageCoverImage();
        if(!empty($aCover['id']) && ($oTranscoder = BxDolTranscoder::getObjectInstance($aCover['transcoder']))) {
            $sImage = (string)$oTranscoder->getFileUrlById($aCover['id']);
        }

        $aActions = [];
        // The apps' own routes, as the splash's __join_link__ and __login_link__ (BxDolSplash).
        if(!isLogged()) {
            $aActions = [
                ['name' => 'join', 'title' => $aTexts['join'], 'link' => '/create-account', 'primary' => true],
                ['name' => 'login', 'title' => $aTexts['login'], 'link' => '/login', 'primary' => false],
            ];
        }

        return [
            'title' => $aTexts['title'],
            'title_accent' => $aTexts['title_accent'],
            'text' => $aTexts['text'],
            'image' => $sImage,
            'actions' => $aActions,
        ];
    }

    /**
     * The words of the home cover for the apps, translated: title, title_accent, text, join, login.
     * A template with a cover of its own words overrides it.
     */
    protected function _getCoverHomeTextsAPI()
    {
        return [
            'title' => _t('_sys_txt_splash_title'),
            'title_accent' => '',
            'text' => _t('_sys_txt_splash_slogan'),
            'join' => _t('_sys_txt_splash_join'),
            'login' => _t('_sys_txt_splash_login'),
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

    protected function _addJsCss()
    {
        parent::_addJsCss();
        if (isAdmin()) {
            $this->_oTemplate->addJs(array(
                'shepherd/js/shepherd.min.js',
            ));
            $this->_oTemplate->addCss(array(
                'homepage.css',
                BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'shepherd/css/|shepherd.css',
                'tour.css',
            ));
        }
    }
}

/** @} */
