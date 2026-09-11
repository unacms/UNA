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
        if (isAdmin() && getParam('site_tour_home') == 'on')
            $s .= $this->_oTemplate->parseHtmlByName('homepage_tour.html', array());

        if($this->_sCanonicalUrl)
            BxDolTemplate::getInstance()->setPageUrl($this->_sCanonicalUrl);

        return $s;
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
            $oTemplate->addJs(array('lottie.min.js'));
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
                BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'shepherd/css/|shepherd.css'
            ));
        }
    }

    /**
     * The legacy og:image of the home page: the app icon, exactly as on master.
     *
     * It is only read by the OLD meta block, the one that runs when sys_share_cards_enable is off -
     * the share card path never looks at aPage['image']. Keeping it is what makes turning the
     * feature off restore the previous tag set byte for byte, which is the whole point of the flag.
     */
    protected function _getPageMetaImage()
    {
        $iImage = 0;
        foreach(['icon_apple', 'icon_android', 'icon_android_splash'] as $sIcon)
            if(($iImage = (int)getParam('sys_site_' . $sIcon)) != 0)
                break;

        if(empty($iImage))
            return '';

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        if(!$oStorage)
            return '';

        return $oStorage->getFileUrlById($iImage);
    }
}

/** @} */
