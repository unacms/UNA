<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A deprecated module: its config's `deprecated` is copied to sys_modules, Studio says so,
 * and it cannot be installed where it isn't installed.
 */
#[Group('integration')]
class ModuleDeprecationTest extends BxDolIntegrationTestCase
{
    private const URI = 'bx_test_deprecated';
    private const PATH = 'boonex/bx_test_deprecated/';

    private BxDolStudioInstallerQuery $_oDb;

    protected function setUp(): void
    {
        parent::setUp();

        // The installer's result codes are defined with the installer utilities.
        class_exists('BxDolStudioInstallerUtils');
        $this->_oDb = bx_instance('BxDolStudioInstallerQuery');
        $this->assertTrue($this->_oDb->isFieldExists('sys_modules', 'deprecated'), 'sys_modules has no deprecated column: run periodic/migration.php.');

        $this->cleanup();
    }

    protected function tearDown(): void
    {
        $this->cleanup();

        parent::tearDown();
    }

    private function cleanup(): void
    {
        $this->_oDb->query("DELETE FROM `sys_modules` WHERE `uri` = :uri", ['uri' => self::URI]);
        $this->_oDb->cleanModulesListCache();
    }

    private function config(array $aExtra = []): array
    {
        return array_merge([
            'type' => BX_DOL_MODULE_TYPE_MODULE,
            'name' => 'bx_test_deprecated',
            'title' => 'Deprecation fixture',
            'vendor' => 'UNA INC',
            'version' => '15.0.0',
            'home_dir' => self::PATH,
            'home_uri' => self::URI,
            'class_prefix' => 'BxTestDeprecated',
            'db_prefix' => 'bx_test_deprecated_',
            'language_category' => 'Deprecation fixture',
        ], $aExtra);
    }

    private function row(): array
    {
        $this->_oDb->cleanModulesListCache();
        $a = $this->_oDb->getRow("SELECT `deprecated`, `replaced_by` FROM `sys_modules` WHERE `uri` = :uri", ['uri' => self::URI]);
        return ['deprecated' => (int)$a['deprecated'], 'replaced_by' => (string)$a['replaced_by']];
    }

    public function testConfigForms(): void
    {
        $this->assertNull(BxDolModuleQuery::getConfigDeprecation($this->config()));
        $this->assertSame(['deprecated' => 1, 'replaced_by' => ''], BxDolModuleQuery::getConfigDeprecation($this->config(['deprecated' => true])));
        $this->assertSame(['deprecated' => 1, 'replaced_by' => 'system'], BxDolModuleQuery::getConfigDeprecation($this->config(['deprecated' => ['replaced_by' => 'system']])));
        $this->assertSame(['deprecated' => 0, 'replaced_by' => ''], BxDolModuleQuery::getConfigDeprecation($this->config(['deprecated' => false])));
        $this->assertSame(['deprecated' => 1, 'replaced_by' => ''], BxDolModuleQuery::getConfigDeprecation($this->config(['deprecated' => ['replaced_by' => ['x']]])));
    }

    public function testConfigIsCopiedAndAnUpdateCanClearIt(): void
    {
        $aConfig = $this->config();
        $iId = $this->_oDb->insertModule($aConfig);
        $this->assertGreaterThan(0, $iId);

        // A config that doesn't say leaves the row as it is.
        $this->assertFalse($this->_oDb->setModuleDeprecation($iId, $this->config()));
        $this->assertSame(['deprecated' => 0, 'replaced_by' => ''], $this->row());

        // The module list of this request is read before the change, and must not stay stale after it.
        $this->assertNotContains(self::URI, array_column($this->_oDb->getDeprecatedModules(), 'uri'));
        $this->assertTrue($this->_oDb->setModuleDeprecation($iId, $this->config(['deprecated' => ['replaced_by' => 'bx_polls']])));
        $this->assertContains(self::URI, array_column($this->_oDb->getDeprecatedModules(), 'uri'));
        $this->assertSame(['deprecated' => 1, 'replaced_by' => 'bx_polls'], $this->row());

        $this->assertTrue($this->_oDb->setModuleDeprecation($iId, $this->config(['deprecated' => false])));
        $this->assertNotContains(self::URI, array_column($this->_oDb->getDeprecatedModules(), 'uri'));
        $this->assertSame(['deprecated' => 0, 'replaced_by' => ''], $this->row());
    }

    public function testMigrationUpdatesCopyItToo(): void
    {
        $aConfig = $this->config();
        $this->assertGreaterThan(0, $this->_oDb->insertModule($aConfig));

        // BxDolMigrationsHelper::moduleUpdated() writes through this query on sites that follow master.
        $oQuery = new BxDolMigrationsQuery();
        $oQuery->setModuleDeprecation(self::URI, $this->config());
        $this->assertSame(['deprecated' => 0, 'replaced_by' => ''], $this->row());

        $oQuery->setModuleDeprecation(self::URI, $this->config(['deprecated' => ['replaced_by' => 'system']]));
        $this->assertSame(['deprecated' => 1, 'replaced_by' => 'system'], $this->row());
    }

    public function testStudioMessages(): void
    {
        $aModule = ['title' => 'Deprecation fixture', 'deprecated' => 0, 'replaced_by' => ''];
        $this->assertSame('', BxDolStudioModule::getDeprecationMessage($aModule));

        $aModule['deprecated'] = 1;
        $this->assertSame(_t('_adm_msg_module_deprecated', 'Deprecation fixture'), BxDolStudioModule::getDeprecationMessage($aModule));
        $this->assertStringContainsString('Deprecation fixture', BxDolStudioModule::getDeprecationMessage($aModule));

        $aModule['replaced_by'] = 'system';
        $this->assertSame(_t('_adm_msg_module_deprecated_core', 'Deprecation fixture'), BxDolStudioModule::getDeprecationMessage($aModule));

        // A replacement that isn't installed is named by its module name.
        $aModule['replaced_by'] = 'bx_not_installed_module';
        $this->assertSame(_t('_adm_msg_module_deprecated_replaced', 'Deprecation fixture', 'bx_not_installed_module'), BxDolStudioModule::getDeprecationMessage($aModule));
    }

    public function testNotInstalledOnASiteThatDoesNotHaveIt(): void
    {
        $oInstaller = new BxDolStudioInstaller($this->config(['deprecated' => true]));
        $aResult = $oInstaller->install([]);

        $this->assertFalse($aResult['result']);
        $this->assertSame(BX_DOL_STUDIO_IU_RCE_DEPRECATED, $aResult['code']);
        $this->assertFalse($this->_oDb->isModule(self::URI));
    }
}
