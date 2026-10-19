<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxRsnUpdater extends BxDolStudioUpdater
{
    function __construct($aConfig)
    {
        parent::__construct($aConfig);
    }

    protected function actionUpdateFiles($bInstall = true)
    {
        $iResult = parent::actionUpdateFiles($bInstall);

        if($iResult == BX_DOL_STUDIO_INSTALLER_SUCCESS) {
            $aModuleConfig = BxDolInstallerUtils::getModuleConfig(BX_DIRECTORY_PATH_MODULES . $this->_aConfig['module_dir'] . 'install/config.php');
            if(isset($aModuleConfig['note']))
                $this->oDb->query("UPDATE `sys_modules` SET `note`=:note WHERE `uri`=:uri", [
                    'note' => $aModuleConfig['note'],
                    'uri' => $this->_aConfig['module_uri']
                ]);
        }

        return $iResult;
    }
}
