<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A preview module: its config's `preview` is copied to sys_modules, and Studio and the installer say so.
 * Unlike a deprecated module it is installed and updated like any other.
 */
#[Group('integration')]
class ModulePreviewTest extends BxDolIntegrationTestCase
{
    private const URI = 'bx_test_preview';
    private const PATH = 'boonex/bx_test_preview/';

    private BxDolStudioInstallerQuery $_oDb;

    protected function setUp(): void
    {
        parent::setUp();

        class_exists('BxDolStudioInstallerUtils');
        $this->_oDb = bx_instance('BxDolStudioInstallerQuery');
        if (!$this->_oDb->isFieldExists('sys_modules', 'preview'))
            $this->markTestSkipped('sys_modules has no preview column: run periodic/migration.php first.');

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
            'name' => 'bx_test_preview',
            'title' => 'Preview fixture',
            'vendor' => 'UNA INC',
            'version' => '15.0.0',
            'home_dir' => self::PATH,
            'home_uri' => self::URI,
            'class_prefix' => 'BxTestPreview',
            'db_prefix' => 'bx_test_preview_',
            'language_category' => 'Preview fixture',
        ], $aExtra);
    }

    private function preview(): int
    {
        $this->_oDb->cleanModulesListCache();
        return (int)$this->_oDb->getOne("SELECT `preview` FROM `sys_modules` WHERE `uri` = :uri", ['uri' => self::URI]);
    }

    public function testConfigForms(): void
    {
        $this->assertNull(BxDolModuleQuery::getConfigPreview($this->config()));
        $this->assertSame(['preview' => 1], BxDolModuleQuery::getConfigPreview($this->config(['preview' => true])));
        $this->assertSame(['preview' => 0], BxDolModuleQuery::getConfigPreview($this->config(['preview' => false])));
    }

    public function testConfigIsCopiedAndAnUpdateCanClearIt(): void
    {
        $aConfig = $this->config();
        $iId = $this->_oDb->insertModule($aConfig);
        $this->assertGreaterThan(0, $iId);

        $this->assertFalse($this->_oDb->setModulePreview($iId, $this->config()), 'A config that does not say leaves the row as it is.');
        $this->assertSame(0, $this->preview());

        $this->assertTrue($this->_oDb->setModulePreview($iId, $this->config(['preview' => true])));
        $this->assertSame(1, $this->preview());

        // A finished module's next version drops the mark.
        $this->assertTrue($this->_oDb->setModulePreview($iId, $this->config(['preview' => false])));
        $this->assertSame(0, $this->preview());
    }

    public function testMigrationUpdatesCopyItToo(): void
    {
        $aConfig = $this->config();
        $this->assertGreaterThan(0, $this->_oDb->insertModule($aConfig));

        (new BxDolMigrationsQuery())->setModulePreview(self::URI, $this->config(['preview' => true]));
        $this->assertSame(1, $this->preview());
    }

    public function testStudioMessage(): void
    {
        $aModule = ['title' => 'Preview fixture', 'preview' => 0];
        $this->assertSame('', BxDolStudioModule::getPreviewMessage($aModule));

        $aModule['preview'] = 1;
        $this->assertSame(_t('_adm_msg_module_preview', 'Preview fixture'), BxDolStudioModule::getPreviewMessage($aModule));
        $this->assertStringContainsString('Preview fixture', BxDolStudioModule::getPreviewMessage($aModule));
    }

    public function testThePreviewModulesSayItAndAreNotDeprecated(): void
    {
        foreach (['editor', 'github', 'resources'] as $sDir) {
            $aConfig = BxDolInstallerUtils::getModuleConfig(BX_DIRECTORY_PATH_MODULES . 'boonex/' . $sDir . '/install/config.php');
            $this->assertSame(['preview' => 1], BxDolModuleQuery::getConfigPreview($aConfig), $sDir);
            $this->assertEmpty(BxDolModuleQuery::getConfigDeprecation($aConfig)['deprecated'] ?? 0, $sDir . ': a preview is maintained, not retired.');
        }
    }
}
