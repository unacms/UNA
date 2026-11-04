<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioOptionsApi extends BxTemplStudioOptions
{
    public function __construct($sType = '', $mixedCategory = '', $sMix = '')
    {
        parent::__construct($sType, $mixedCategory, $sMix);

        $this->sBaseUrl = BX_DOL_URL_STUDIO . bx_append_url_params('api.php', ['page' => 'api_config']);
    }

    public function saveChanges(&$oForm)
    {
        $sResult = parent::saveChanges($oForm);

        if(($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled())
            $oSockets->sendEvent('sys_api', 0, 'config_changed', true);

        $sAppUrl = getParam('sys_api_url_root_email');
        if ($sAppUrl != ''){
           $sHttpCode = null;
           bx_file_get_contents($sAppUrl . '_upd_conf', [], 'get', [], $sHttpCode, [], 0, [], true);
        }
        
        return $sResult;
    }
}

/** @} */
