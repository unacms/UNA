<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioDesign extends BxDolStudioDesign
{
    protected $aMenuItems = array(
        BX_DOL_STUDIO_TEMPL_TYPE_SETTINGS => array('title' => '_adm_lmi_cpt_settings', 'icon' => 'mi-cog.svg', 'icon_bg' => true),
        BX_DOL_STUDIO_TEMPL_TYPE_LOGO => array('title' => '_adm_lmi_cpt_logo', 'icon' => 'mi-tpl-logo.svg', 'icon_bg' => true)
    );

    public function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->aPageJs = array_merge($this->aPageJs, ['jquery.form.min.js', 'jquery.webForms.js']);

        $this->oHelper = BxTemplStudioDesigns::getInstance();
    }

    protected function getSettings($mixedCategory = '', $sMix = '')
    {
        $oOptions = new BxTemplStudioOptions($this->sModule, $mixedCategory, $sMix);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('design.html', array(
            'content' => $oOptions->getCode(),
            'js_content' => $this->getPageJsCode(),
        ));
    }

    protected function getLogo()
    {
    	$oPage = $this->getObjectDesigner();

        $this->aPageCss = array_merge($this->aPageCss, $oPage->getPageCss());
        $this->aPageJs = array_merge($this->aPageJs, $oPage->getPageJs());
    	return BxDolStudioTemplate::getInstance()->parseHtmlByName('design.html', array(
            'content' => $oPage->getPageCode(BX_DOL_STUDIO_TEMPL_TYPE_LOGO, false),
            'js_content' => $this->getPageJsCode()
        ));
    }
    
    protected function getStyles($mixedCategory = '', $sMix = '')
    {
    	$oOptions = new BxTemplStudioOptions($this->sModule, $mixedCategory, $sMix);
    	$oOptions->enableReadOnly(true);
    	$oOptions->enableMixes(true);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss(), [BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'codemirror/|codemirror.css']);
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs(), ['codemirror/codemirror.min.js']);
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('design.html', [
            'content' => $oOptions->getCode(),
            'js_content' => $this->getPageJsCode([
                'sCodeMirror' => "textarea[name='" . $this->sModule . "_styles_custom']"
            ])
        ]);
    }
}

/** @} */
