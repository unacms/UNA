<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Uninstalling a module whose sys_modules row was stored with an older vendor.
 *
 * Ticket #4577 renamed the vendor in modules' config.php from 'BoonEx' to 'UNA INC',
 * but installed sites keep the vendor the module was installed with. The uninstall
 * used to look the row up by vendor and path, so it ran the uninstall SQL and removed
 * the language category, but left the sys_modules row and its file tracks behind.
 */
#[Group('integration')]
class ModuleUninstallVendorTest extends BxDolIntegrationTestCase
{
    private const URI = 'bx_test_vendor_rename';
    private const PATH = 'boonex/bx_test_vendor_rename/';

    private BxDolStudioInstallerQuery $_oDb;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_oDb = new BxDolStudioInstallerQuery();
        $this->cleanup();
    }

    protected function tearDown(): void
    {
        $this->cleanup();

        parent::tearDown();
    }

    /**
     * Removes the fixture without deleteModule, which is the code under test.
     */
    private function cleanup(): void
    {
        $aModule = $this->_oDb->getModuleByUri(self::URI, false);
        if (empty($aModule))
            return;

        $this->_oDb->deleteModuleTrackFiles((int)$aModule['id']);
        $this->_oDb->query("DELETE FROM `sys_modules` WHERE `id` = :id", ['id' => (int)$aModule['id']]);
        $this->_oDb->cleanModulesListCache();
    }

    private function config(string $sVendor): array
    {
        return [
            'type' => BX_DOL_MODULE_TYPE_MODULE,
            'name' => 'bx_test_vendor_rename',
            'title' => 'Vendor rename fixture',
            'vendor' => $sVendor,
            'version' => '12.0.1',
            'home_dir' => self::PATH,
            'home_uri' => self::URI,
            'class_prefix' => 'BxTestVendorRename',
            'db_prefix' => 'bx_test_vendor_rename_',
            'language_category' => 'Vendor rename fixture',
        ];
    }

    private function install(string $sVendor): int
    {
        $aConfig = $this->config($sVendor);
        $iId = $this->_oDb->insertModule($aConfig);
        $this->assertGreaterThan(0, $iId, 'The fixture module was not inserted.');

        $aFile = ['file' => 'install/config.php', 'hash' => md5('fixture')];
        $this->_oDb->insertModuleTrack($iId, $aFile);

        return $iId;
    }

    public function testUninstallRemovesRowStoredWithOldVendor(): void
    {
        $iId = $this->install('BoonEx');

        $this->assertSame($iId, $this->_oDb->deleteModule($this->config('UNA INC')));
        $this->assertEmpty($this->_oDb->getModuleById($iId, false));
        $this->assertEmpty($this->_oDb->getModuleTrackFiles($iId));
    }

    public function testUninstallRemovesRowStoredWithSameVendor(): void
    {
        $iId = $this->install('UNA INC');

        $this->assertSame($iId, $this->_oDb->deleteModule($this->config('UNA INC')));
        $this->assertEmpty($this->_oDb->getModuleById($iId, false));
        $this->assertEmpty($this->_oDb->getModuleTrackFiles($iId));
    }

    public function testUninstallLeavesModuleWithAnotherPath(): void
    {
        $iId = $this->install('BoonEx');
        $this->_oDb->updateModule(['path' => 'boonex/bx_test_vendor_rename_other/'], ['id' => $iId]);

        $this->assertSame(0, $this->_oDb->deleteModule($this->config('UNA INC')));
        $this->assertNotEmpty($this->_oDb->getModuleById($iId, false));
        $this->assertNotEmpty($this->_oDb->getModuleTrackFiles($iId));
    }

    /**
     * Sites that already hit the bug have the row but no language category. Removing
     * the module's strings must succeed then, or the second uninstall fails with
     * "Update languages: An error occurred".
     */
    public function testRemovingLanguageOfMissingCategorySucceeds(): void
    {
        $aConfig = $this->config('UNA INC');
        $aModule = [
            'name' => $aConfig['name'],
            'path' => $aConfig['home_dir'],
            'uri' => $aConfig['home_uri'],
            'lang_category' => $aConfig['language_category'],
        ];

        $this->assertTrue(BxDolStudioLanguagesUtils::getInstance()->removeLanguageByModule($aModule, false));
    }
}
