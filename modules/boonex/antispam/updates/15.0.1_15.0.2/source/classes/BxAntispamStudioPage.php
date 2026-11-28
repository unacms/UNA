<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Antispam Antispam
 * @ingroup     UnaModules
 *
 * @{
 */

require_once ('BxAntispamStudioOptions.php');

class BxAntispamStudioPage extends BxTemplStudioModule
{
    protected $oModule;

    function __construct($sModule, $mixedPageName, $sPage = "")
    {
        parent::__construct($sModule, $mixedPageName, $sPage);

        $this->oModule = BxDolModule::getInstance('bx_antispam');

        $this->aMenuItems = array(
            'settings' => array('name' => 'settings', 'icon' => 'settings', 'title' => '_adm_lmi_cpt_settings'),
            'ip_table' => array('name' => 'ip_table', 'icon' => 'text-align-justify', 'title' => '_bx_antispam_ip_table', 'link' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=antispam-ip-table'))),
            'dnsbl_list' => array('name' => 'dnsbl_list', 'icon' => 'text-align-justify', 'title' => '_bx_antispam_dnsbl_list', 'link' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=antispam-dnsbl-list'))),
            'block_log' => array('name' => 'block_log', 'icon' => 'clock', 'title' => '_bx_antispam_block_log', 'link' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=antispam-block-log'))),
            'help' => array('name' => 'help', 'icon' => 'circle-question-mark', 'title' => '_bx_antispam_help'),
        );
    }

    protected function getSettings()
    {
        $oOptions = new BxAntispamStudioOptions($this->sModule);

        $this->aPageCss = array_merge($this->aPageCss, $oOptions->getCss());
        $this->aPageJs = array_merge($this->aPageJs, $oOptions->getJs());
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('module.html', [
            'content' => $oOptions->getCode(),
        ]);
    }

    protected function getHelp ()
    {
        return _t('_bx_antispam_help_text');
    }
}

/** @} */
