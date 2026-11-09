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

    /**
     * Turn the value of the modules field (an array from a form or a comma separated string from
     * the command line or the environment) into a list of unique, non empty module URIs.
     */
    public function parseUris ($mixedUris)
    {
        if (!is_array($mixedUris))
            $mixedUris = explode(',', (string)$mixedUris);

        $aUris = array();
        foreach ($mixedUris as $sUri) {
            $sUri = trim((string)$sUri);
            if ($sUri !== '' && !in_array($sUri, $aUris, true))
                $aUris[] = $sUri;
        }
        return $aUris;
    }

    /**
     * Get the modules to install in the order to install them.
     *
     * Only modules from $aModules (see getModules) are considered, unknown URIs are dropped. A module
     * that a selected one depends on is added to the selection, and always goes before its dependents.
     * The module of $sFirstUri, when selected, goes first, since the others may rely on its profiles.
     * The rest keeps the order of the selection.
     *
     * @param array $aModules module configs, as returned by getModules
     * @param array $aUris selected module URIs
     * @param string $sFirstUri URI of the module to install before the others
     * @return array module configs
     */
    public function getInstallOrder ($aModules, $aUris, $sFirstUri = '')
    {
        $aByUri = array();
        foreach ($aModules as $aConfig)
            $aByUri[$aConfig['home_uri']] = $aConfig;

        $aUris = array_values(array_intersect($this->parseUris($aUris), array_keys($aByUri)));
        if ($sFirstUri !== '' && ($i = array_search($sFirstUri, $aUris, true)) !== false) {
            unset($aUris[$i]);
            array_unshift($aUris, $sFirstUri);
        }

        $aOrdered = array();
        $aVisiting = array();
        foreach ($aUris as $sUri)
            $this->addWithDependencies($aByUri, $sUri, $aOrdered, $aVisiting);

        return array_values($aOrdered);
    }

    protected function addWithDependencies ($aByUri, $sUri, &$aOrdered, &$aVisiting)
    {
        if (isset($aOrdered[$sUri]) || isset($aVisiting[$sUri]))
            return;

        $aVisiting[$sUri] = true;

        $aConfig = $aByUri[$sUri];
        if (!empty($aConfig['dependencies']) && is_array($aConfig['dependencies'])) {
            foreach (array_keys($aConfig['dependencies']) as $sDependency) {
                $sDependencyUri = $this->getUriByUriOrName($aByUri, $sDependency);
                if ($sDependencyUri !== null)
                    $this->addWithDependencies($aByUri, $sDependencyUri, $aOrdered, $aVisiting);
            }
        }

        $aOrdered[$sUri] = $aConfig;
    }

    protected function getUriByUriOrName ($aByUri, $sUriOrName)
    {
        if (isset($aByUri[$sUriOrName]))
            return $sUriOrName;

        foreach ($aByUri as $sUri => $aConfig)
            if ($aConfig['name'] == $sUriOrName)
                return $sUri;

        return null;
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
