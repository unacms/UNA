<?php defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 */

class BxDolInstallModulesTools
{

    public function __construct()
    {
    }

    public function getModules ($sType = null)
    {
        $aModules = array();

        $sPath = BX_INSTALL_DIR_MODULES;
        if (($rHandleVendor = opendir($sPath)) !== false) {
            while (($sVendor = readdir($rHandleVendor)) !== false) {
                if (substr($sVendor, 0, 1) == '.' || !is_dir($sPath . $sVendor))
                    continue;

                if (($rHandleModule = opendir($sPath . $sVendor)) !== false) {
                    while(($sModule = readdir($rHandleModule)) !== false) {
                        if(!is_dir($sPath . $sVendor . '/' . $sModule) || substr($sModule, 0, 1) == '.')
                            continue;

                        $sConfigPath = $sPath . $sVendor . '/' . $sModule . '/install/config.php';
                        $aModuleConfig = $this->getModuleConfigByConfigPath($sConfigPath);
                        if (empty($aModuleConfig) || ($sType && $sType != $aModuleConfig['type']))
                            continue;

                        $aModules[$aModuleConfig['name']] = $aModuleConfig;
                    }
                    closedir($rHandleModule);
                }
            }
            closedir($rHandleVendor);
        }

        ksort($aModules);
        return $aModules;
    }

    public function getModuleConfigByUri ($sUri, $aModules)
    {
        foreach ($aModules as $aModuleConfig)
            if ($sUri == $aModuleConfig['home_uri'])
                return $aModuleConfig;
        return null;
    }

    public function readLanguage ($aModuleConfig)
    {
        $sPath = BX_INSTALL_DIR_MODULES . $aModuleConfig['home_dir'] . 'data/langs/system/' . $aModuleConfig['home_uri'] . '.xml';

        if(!file_exists($sPath))
            return array();

        $oXmlParser = BxDolXmlParser::getInstance();
        $sXmlContent = file_get_contents($sPath);

        return $oXmlParser->getValues($sXmlContent, 'string');
    }

    protected function getModuleConfigByConfigPath ($sConfigPath)
    {
        if (!file_exists($sConfigPath))
            return array();

        include($sConfigPath);

        return $aConfig;
    }
}

/** @} */
