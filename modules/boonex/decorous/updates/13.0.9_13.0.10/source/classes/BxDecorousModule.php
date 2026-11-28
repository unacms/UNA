<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Decorous Decorous template
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import ('BxBaseModTemplateModule');

class BxDecorousModule extends BxBaseModTemplateModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetActions($aWidget)
    {
        $oInformer = BxDolInformer::getInstance(BxDolStudioTemplate::getInstance());
        $oInformer->add('sys-module-discontinued', _t('_adm_txt_modules_discontinued', BX_DOL_URL_STUDIO . 'design.php?name=bx_decorous', _t('_bx_decorous_stg_cpt_type')), BX_INFORMER_ALERT);

        return bx_srv('system', 'get_actions', [$aWidget], 'TemplStudioDesigns');
    }

    function serviceIncludeCssJs($sType)
    {
        $sResult = '';
        if(BxDolTemplate::getInstance()->getCode() != $this->_oConfig->getUri())
            return $sResult;

        switch($sType) {
            case 'head':
                $sCss = trim(getParam($this->_oConfig->getName() . '_styles_custom'));
                if(!empty($sCss))
                    $sResult .= $this->_oTemplate->_wrapInTagCssCode($sCss);

                $sResult .= $this->_oTemplate->addJs([
                    'custom.js'
                ], true);
            break;

            case 'footer':
                // sidebar.js works the application page type's own sidebar (pt_application.html); no other page has its elements.
                if(BxDolTemplate::getInstance()->getPageType() == BX_PAGE_TYPE_APPLICATION) {
                    $sResult .= $this->_oTemplate->addJs([
                        'modules/base/template/js/|sidebar.js'
                    ], true);
                }
                break;
        }

        return $sResult;
    }
}

/** @} */
