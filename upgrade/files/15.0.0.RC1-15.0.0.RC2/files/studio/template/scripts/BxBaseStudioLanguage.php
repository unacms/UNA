<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioLanguage extends BxDolStudioLanguage
{
    protected $aMenuItems = array(
        BX_DOL_STUDIO_LANG_TYPE_SETTINGS => array('name' => BX_DOL_STUDIO_LANG_TYPE_SETTINGS, 'caption' => '_adm_lmi_cpt_settings', 'icon' => 'mi-cog.svg', 'icon_bg' => true)
    );

    public function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->oHelper = BxTemplStudioLanguages::getInstance();
    }

    public function getPageCaption()
    {
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aTmplVars = array(
            'js_object' => $this->getPageJsObject(),
            'content' => parent::getPageCaption(),
        );
        return $oTemplate->parseHtmlByName('lang_page_caption.html', $aTmplVars);
    }

    protected function getSettings()
    {
        $oOptions = new BxTemplStudioOptions($this->sModule);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('language.html', array(
            'content' => $oOptions->getCode()
        ));
    }
}

/** @} */
