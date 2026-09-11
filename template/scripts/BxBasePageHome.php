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

}

/** @} */
