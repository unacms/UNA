<?php

/**
 * Module update packs (modules/<vendor>/<module>/updates/<from>_<to>/) must name the module they update the way the
 * installed module is recorded. BxDolStudioUpdater finds the module by `module_dir` and `module_uri`, and builds the
 * updater class name from `class_prefix`, so a pack that differs from the module's own config fails on every site.
 */
class ModuleUpdatePacksTest extends \PHPUnit\Framework\TestCase
{
    private static function modulesPath(): string
    {
        return __DIR__ . '/../../../modules/';
    }

    private static function readConfig(string $sPath): array
    {
        $aConfig = null;
        include($sPath);
        if (!is_array($aConfig))
            self::fail(substr($sPath, strlen(self::modulesPath())) . ' does not define $aConfig.');

        return $aConfig;
    }

    public function testPacksMatchTheirModule(): void
    {
        $sModules = self::modulesPath();
        $aPacks = glob($sModules . '*/*/updates/*/install/config.php');
        $this->assertNotEmpty($aPacks, 'The repository has module update packs.');

        $aModules = [];
        $aErrors = [];
        foreach ($aPacks as $sPath) {
            $sPack = substr(dirname($sPath, 2), strlen($sModules)) . '/';
            $aPack = self::readConfig($sPath);

            $sModuleDir = $aPack['module_dir'] ?? '';
            if (strpos($sPack, $sModuleDir . 'updates/') !== 0) {
                $aErrors[] = "$sPack: module_dir '$sModuleDir' is not the module the pack is in";
                continue;
            }

            if (!isset($aModules[$sModuleDir]))
                $aModules[$sModuleDir] = self::readConfig($sModules . $sModuleDir . 'install/config.php');
            $aModule = $aModules[$sModuleDir];

            if (($aPack['module_uri'] ?? '') !== $aModule['home_uri'])
                $aErrors[] = "$sPack: module_uri '" . ($aPack['module_uri'] ?? '') . "' is not the module's home_uri '{$aModule['home_uri']}'";

            if (($aPack['class_prefix'] ?? '') !== $aModule['class_prefix'])
                $aErrors[] = "$sPack: class_prefix '" . ($aPack['class_prefix'] ?? '') . "' is not the module's '{$aModule['class_prefix']}'";

            $sVersions = ($aPack['version_from'] ?? '') . '_' . ($aPack['version_to'] ?? '');
            if (basename($sPack) !== $sVersions)
                $aErrors[] = "$sPack: the folder is not named after version_from and version_to ($sVersions)";

            if (($aPack['home_dir'] ?? '') !== $sModuleDir . 'updates/update_' . $sVersions . '/')
                $aErrors[] = "$sPack: home_dir '" . ($aPack['home_dir'] ?? '') . "' is not '{$sModuleDir}updates/update_{$sVersions}/'";
        }

        $this->assertSame([], $aErrors, "Update packs that would not apply:\n" . implode("\n", $aErrors));
    }
}
