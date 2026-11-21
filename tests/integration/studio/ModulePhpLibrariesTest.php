<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A module that needs PHP libraries lists them in the 'php_classes' section of its config
 * (class => composer package). Install and enable stop with a message naming the missing
 * packages, instead of the fatal "vendor/autoload.php not found" that the Azure B2C and
 * Cidaas modules used to end with on a site that had no module-level vendor folder.
 */
#[Group('integration')]
class ModulePhpLibrariesTest extends BxDolIntegrationTestCase
{
    private const URI = 'bx_test_php_libraries';

    private BxDolStudioInstallerQuery $_oDb;

    protected function setUp(): void
    {
        parent::setUp();

        // Defines the BX_DOL_STUDIO_IU_* result codes the installer returns.
        BxDolStudioInstallerUtils::getInstance();

        $this->_oDb = bx_instance('BxDolStudioInstallerQuery');
        $this->assertEmpty($this->_oDb->getModuleByUri(self::URI, false), 'The fixture module is not installed.');
    }

    private function config(array $aPhpClasses): array
    {
        return [
            'type' => BX_DOL_MODULE_TYPE_MODULE,
            'name' => self::URI,
            'title' => 'PHP libraries fixture',
            'vendor' => 'UNA INC',
            'version' => '15.0.0',
            'compatible_with' => ['14.0.0'],
            'home_dir' => 'boonex/bx_test_php_libraries/',
            'home_uri' => self::URI,
            'db_prefix' => 'bx_test_php_libraries_',
            'class_prefix' => 'BxTestPhpLibraries',
            'install' => [],
            'uninstall' => [],
            'enable' => [],
            'disable' => [],
            'dependencies' => [],
            'php_classes' => $aPhpClasses,
        ];
    }

    public function testListsOnlyThePackagesWhoseClassesAreMissing(): void
    {
        $oInstaller = new BxDolStudioInstaller($this->config([
            'Acme\\Missing\\Client' => 'acme/missing',
            'Acme\\Missing\\Token' => 'acme/missing',
            BxDolStudioInstaller::class => 'unacms/una',
            Psr\Http\Message\ResponseInterface::class => 'psr/http-message',
        ]));

        $this->assertSame(['acme/missing'], $oInstaller->getMissingPhpPackages());
    }

    public function testInstallStopsWithTheMissingPackages(): void
    {
        $oInstaller = new BxDolStudioInstaller($this->config(['Acme\\Missing\\Client' => 'acme/missing']));

        $aResult = $oInstaller->install([]);

        $this->assertFalse($aResult['result']);
        $this->assertStringContainsString('acme/missing', $aResult['message']);
        $this->assertStringContainsString('composer install', $aResult['message']);
        $this->assertEmpty($this->_oDb->getModuleByUri(self::URI, false), 'Nothing is recorded for a module that was not installed.');
    }

    public function testModulesWithLibrariesHaveThemFromRootComposer(): void
    {
        foreach (glob(BX_DIRECTORY_PATH_MODULES . '*/*/install/config.php') as $sPath) {
            $aConfig = null;
            include($sPath);
            if (empty($aConfig['php_classes']))
                continue;

            $oInstaller = new BxDolStudioInstaller($aConfig);
            $this->assertSame([], $oInstaller->getMissingPhpPackages(), $aConfig['name'] . ' finds its libraries after composer install.');
        }
    }
}
