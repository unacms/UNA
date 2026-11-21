<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_PGT_TYPE_SETTINGS', 'pgt_settings');
define('BX_DOL_STUDIO_PGT_TYPE_KEYS', 'pgt_keys');
define('BX_DOL_STUDIO_PGT_TYPE_ETEMPLATES_TEXT', 'etemplates_text');
define('BX_DOL_STUDIO_PGT_TYPE_ETEMPLATES_HTML', 'etemplates_html');

define('BX_DOL_STUDIO_PGT_TYPE_DEFAULT', BX_DOL_STUDIO_PGT_TYPE_SETTINGS);

class BxDolStudioPolyglot extends BxTemplStudioWidget
{
    protected $sPage;

    protected $sEtSettingEditor;
    protected $sEtcContent;

    function __construct($sPage = "")
    {
        parent::__construct('polyglot');

        $this->oDb = new BxDolStudioPolyglotQuery();

        $this->sPage = BX_DOL_STUDIO_PGT_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;

        $this->sEtSettingEditor = 'sys_std_pgt_etemplates_editor';
        $this->sEtcContent = '<pre id="etc_content">' . _t('_adm_pgt_txt_et_c_content') . '</pre>';
    }

    public function checkAction()
    {
        $sAction = bx_get('pgt_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $oLanguages = BxDolStudioLanguagesUtils::getInstance();

        $aResult = array('code' => 1, 'message' => _t('_adm_pgt_err_cannot_process_action'));
        switch($sAction) {
            case 'get-page-by-type':
                $sValue = bx_process_input(bx_get('pgt_value'));
                if(empty($sValue))
                    break;

                $this->sPage = $sValue;
                $aResult = array('code' => 0, 'content' => $this->getPageCode());
                break;

            case 'enable-editor':
                $iValue = false;
                if(($iValue = bx_get('pgt_value')) !== false)
                    $iValue = bx_process_input($iValue, BX_DATA_INT);
                else
                    break;

                if(setParam($this->sEtSettingEditor, $iValue ? 'on' : ''))
                    $aResult = ['code' => 0, 'reload' => 1];
                break;

            /*
             * Available URL params:
             * pgt_action = recompile - action name
             * pgt_language - ID or name(en, ru, etc) of language.
             */
            case 'recompile':
                $sLanguage = bx_process_input(bx_get('pgt_language'));

                if($oLanguages->compileLanguage($sLanguage))
                    $aResult = array('code' => 0, 'content' => _t('_adm_pgt_scs_recompiled'));
                else
                    $aResult = array('code' => 2, 'content' => _t('_adm_pgt_err_cannot_recompile_lang'));
                break;

            /*
             * Available URL params:
             * pgt_action = restore - action name
             * pgt_language - ID or name(en, ru, etc) of language.
             * pgt_module - ID or Module Uri (@see sys_modules table). Leave empty for 'System' language file.
             */
            case 'restore':
                $sLanguage = bx_process_input(bx_get('pgt_language'));
                $sModule = bx_process_input(bx_get('pgt_module'));

                if($oLanguages->restoreLanguage($sLanguage, $sModule))
                    $aResult = array('code' => 0, 'content' => _t('_adm_pgt_scs_restored'));
                else
                    $aResult = array('code' => 2, 'content' => _t('_adm_pgt_err_cannot_restore_lang'));
                break;
        }

        return $aResult;
    }

    /**
     * TODO: Remove (after UNA 14) if new version is working fine.
     */
    public function submitEtemplatesHtmlOld(&$oForm)
    {
        $sUnsubscribe = "{unsubscribe}";
        $sHeader = $oForm->getCleanValue('et_hf_header');
        $sFooter = $oForm->getCleanValue('et_hf_footer');
        if(strpos($sHeader, $sUnsubscribe) === false && strpos($sFooter, $sUnsubscribe) === false)
            return $this->getJsResult('_adm_pgt_err_et_hf_save_unsubscribe'); 

        $bResult = false;
        $bResult |= $this->oDb->setParam('site_email_html_template_header', $sHeader);
        $bResult |= $this->oDb->setParam('site_email_html_template_footer', $sFooter);
        if(!$bResult)
            return $this->getJsResult('_adm_pgt_err_et_hf_save');

        return $this->getJsToast('_adm_pgt_scs_et_hf_save', BX_DOL_URL_STUDIO . 'polyglot.php?page=' . BX_DOL_STUDIO_PGT_TYPE_ETEMPLATES_HTML); 
    }
    
    public function submitEtemplatesHtml(&$oForm)
    {
        $sUnsubscribe = "{unsubscribe}";
        $sContent = $oForm->getCleanValue('content');
        if(strpos($sContent, $sUnsubscribe) === false)
            return $this->getJsResult('_adm_pgt_err_et_hf_save_unsubscribe'); 

        list($sHeader, $sFooter) = explode($this->sEtcContent, $sContent);

        $bResult = false;
        $bResult |= $this->oDb->setParam('site_email_html_template_header', $sHeader);
        $bResult |= $this->oDb->setParam('site_email_html_template_footer', $sFooter);
        if(!$bResult)
            return $this->getJsResult('_adm_pgt_err_et_hf_save');

        return $this->getJsToast('_adm_pgt_scs_et_hf_save', BX_DOL_URL_STUDIO . 'polyglot.php?page=' . BX_DOL_STUDIO_PGT_TYPE_ETEMPLATES_HTML); 
    }
}

/** @} */
