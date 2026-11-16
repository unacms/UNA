<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaTemplate UNA Template Classes
 * @{
 */

/**
 * @see BxBasePageHome
 */
class BxTemplPageHome extends BxBasePageHome
{
    public function __construct($aObject, $oTemplate)
    {
        parent::__construct($aObject, $oTemplate);
        $this->addMarkers(array('site_title' => getParam('site_title')));

        $aCover = $this->getPageCoverImage();

        $bTmplVarsCover = !empty($aCover['id']);
        $aTmplVarsCover = $bTmplVarsCover ? array('image_url' => BxDolTranscoder::getObjectInstance($aCover['transcoder'])->getFileUrlById($aCover['id'])) : array();

        BxDolCover::getInstance()->set(array(
            'class' => 'bx-cover-homepage',
            'title' => _t('_sys_txt_homepage_cover', bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-account'))),
            'link_join' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-account')),
            'link_login' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=login')),
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

        BxDolMenu::setSelectedGlobal('system', $sSelName);
    }

    /**
     * Artificer's home cover (cover_home.html) for the apps: its words and the arrow on Log in. The art of a cover without
     * a picture is the default of Studio > Designer > Cover (BxDolCover::getDefaultArt), Artificer's cover-default.svg.
     */
    protected function _getCoverHomeLookAPI()
    {
        return array_merge(parent::_getCoverHomeLookAPI(), [
            'title' => _t('_bx_artificer_txt_splash_welcome_l1'),
            'title_accent' => _t('_bx_artificer_txt_splash_welcome_l2'),
            'text' => _t('_bx_artificer_txt_splash_welcome_l3'),
            'join' => _t('_bx_artificer_txt_splash_welcome_a1'),
            'login' => _t('_bx_artificer_txt_splash_welcome_a2'),
            'login_icon' => 'arrow-right',
        ]);
    }
}

/** @} */
