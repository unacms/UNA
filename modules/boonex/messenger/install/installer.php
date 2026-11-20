<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Messenger Messenger
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxBaseModTextInstaller');

class BxMessengerInstaller extends BxBaseModTextInstaller
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    /**
     * Uses the Jot server named in the UNA_JOT_URL environment variable when the site has none yet. The Docker
     * setup (docker-compose.yml) sets it to its own Jot server, so Messenger is real-time there with no setup.
     */
    public function enable($aParams)
    {
        $aResult = parent::enable($aParams);

        $sOption = $this->_aConfig['db_prefix'] . 'server_url';
        $sJotUrl = trim((string)getenv('UNA_JOT_URL'));
        if ($aResult['result'] && $sJotUrl !== '' && trim((string)getParam($sOption)) === '') {
            setParam($sOption, $sJotUrl);
        }

        return $aResult;
    }
}

/** @} */
