<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

/**
 * Polyglot > Languages: the installed languages, each with the language app that holds its settings.
 */
class BxDolStudioPolyglotLanguages extends BxTemplStudioGrid
{
    protected $sLanguageDefault;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->oDb = new BxDolStudioPolyglotQuery();
        $this->sLanguageDefault = getParam('lang_default');
    }

    /**
     * The language key of a row's status: Default for the site's default language, otherwise On or Off.
     */
    public function getStatusKey($aRow)
    {
        if($aRow['name'] == $this->sLanguageDefault) {
            return '_adm_pgt_txt_status_default';
        }

        return (int)$aRow['enabled'] != 0 ? '_adm_pgt_txt_status_on' : '_adm_pgt_txt_status_off';
    }

    /**
     * Where a row's name links: the Studio app of its language module, or '' when no installed module provides it.
     */
    public function getLanguageUrl($aRow)
    {
        return !empty($aRow['module']) ? BX_DOL_URL_STUDIO . 'language.php?name=' . rawurlencode($aRow['module']) : '';
    }
}

/** @} */
