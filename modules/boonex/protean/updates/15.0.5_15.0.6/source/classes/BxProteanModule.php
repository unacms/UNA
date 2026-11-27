<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Protean Protean template
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import ('BxBaseModTemplateModule');

class BxProteanModule extends BxBaseModTemplateModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetOptionsFormInputEditorSkin()
    {
        $aResultError = array(
            array('key' => '', 'value' => _t('_bx_protean_stg_cpt_option_form_input_editor_skin_unavailable'))
        );

        $oEditor = BxDolEditor::getObjectInstance();
        if(!$oEditor)
            return $aResultError;

        $aSkins = $oEditor->getSkins();
        if(empty($aSkins) || !is_array($aSkins))
            return $aResultError;

        return array_merge(array(
            array('key' => '', 'value' => _t('_bx_protean_stg_cpt_option_form_input_editor_skin_select'))
        ), $aSkins);
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
                break;

            case 'footer':
                // sidebar.js works the application page type's own sidebar (pt_application.html); no other page has its elements.
                if(BxDolTemplate::getInstance()->getPageType() == BX_PAGE_TYPE_APPLICATION) {
                    $sResult .= $this->_oTemplate->addJs([
                        'modules/base/template/js/|sidebar.js',
                    ], true);
                }
                break;
        }

        return $sResult;
    }
}

/** @} */
