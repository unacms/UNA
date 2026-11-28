<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GitHub GitHub
 * @ingroup     UnaModules
 *
 * @{
 */

class BxGitHubTemplate extends BxDolModuleTemplate
{
    public function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }

    public function getBlockAuthorize($iAppId, $iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $oApp = $this->_oModule->getObjectApp($iAppId);
        if(!$oApp)
            return '';

        $bAuthorized = $this->_oDb->isAuthorization($iProfileId, $iAppId);

        return $this->parseHtmlByName('authorize.html', [
            'bx_if:show_authorize' => [
                'condition' => !$bAuthorized,
                'content' => [
                    'authorize_url' => $oApp->getUrlAuthorize()
                ]
            ],
            'bx_if:show_authorized' => [
                'condition' => $bAuthorized,
                'content' => [
                    'manage_url' => BxDolPermalinks::getInstance()->permalink($CNF['URL_SETTINGS'])
                ]
            ]
        ]);
    }

    public function getBlockSettingsClient($iProfileId)
    {
        $CNF = &$this->_oConfig->CNF;

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_SETTINGS'], $CNF['OBJECT_FORM_SETTINGS_DISPLAY_EDIT'], $this);
        if(!$oForm)
            return MsgBox(_t('_sys_txt_error_occured'));

        $aSettings = $this->_oDb->getSettings(['sample' => 'profile_id', 'profile_id' => $iProfileId]);
        $bSettings = !empty($aSettings) && is_array($aSettings);

        $sResultTimer = 0;
        $sResultMessage = '';

        $oForm->initChecker($aSettings);
        if($oForm->isSubmittedAndValid()) {
            if((!$bSettings && (int)$oForm->insert(['profile_id' => $iProfileId]) > 0) || ($bSettings && $oForm->update($aSettings['id']) !== false)) {
                $sResultTimer = 3;
                $sResultMessage = '_bx_github_msg_save_settings';
            }
            else
                $sResultMessage = '_bx_github_err_save_settings';
        }

        return (!empty($sResultMessage) ? MsgBox(_t($sResultMessage), $sResultTimer) : '') . $oForm->getCode();
    }
}

/** @} */
