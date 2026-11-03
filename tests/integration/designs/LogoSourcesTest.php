<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Where the header's logo images come from (BxDolDesigns::getLogoSources), with Artificer's logo settings
 * as the template's: its own upload, then Designer's upload, then SVG code, then the built-in image.
 * Studio's logo previews and Artificer's header both read this, so they cannot disagree.
 */
#[Group('integration')]
class LogoSourcesTest extends BxDolIntegrationTestCase
{
    private const TYPES = ['logo', 'logo_dark', 'mark', 'mark_dark'];

    private array $_aTemplateParams = [];
    private array $_aOptionsBackup = [];
    private array $_aFiles = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_artificer'))
            $this->markTestSkipped('Artificer is not installed.');

        $this->_aTemplateParams = BxDolModule::getInstance('bx_artificer')->_oConfig->getLogoParams();

        foreach ($this->optionNames() as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);

        foreach ($this->optionNames() as $sName)
            setParam($sName, strpos($sName, '_inline') !== false ? '' : '0');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        foreach ($this->_aFiles as $iId)
            $oStorage->deleteFile($iId, 0);

        parent::tearDown();
    }

    public function testNothingUploadedUsesTheBuiltInImages(): void
    {
        $aSources = $this->sources();

        foreach (self::TYPES as $sType)
            $this->assertSame(BxDolDesigns::LOGO_SOURCE_BUILTIN, $aSources[$sType]['source'], $sType);

        $this->assertSame('builtin/logo-generic.svg', $aSources['logo']['url']);
        $this->assertSame('builtin/mark-dark-generic.svg', $aSources['mark_dark']['url']);
    }

    public function testATemplateWithoutBuiltInImagesHasNone(): void
    {
        $aSources = BxDolDesigns::getLogoSources($this->_aTemplateParams, function () {
            return '';
        });

        foreach (self::TYPES as $sType)
            $this->assertSame(BxDolDesigns::LOGO_SOURCE_NONE, $aSources[$sType]['source'], $sType);
    }

    public function testDesignerUploadReplacesEveryBuiltInImage(): void
    {
        setParam('sys_site_logo', $this->storeFile());

        $aSources = $this->sources();

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_SYSTEM, $aSources['logo']['source']);
        $this->assertNotSame('', $aSources['logo']['url']);
        foreach (['logo_dark', 'mark', 'mark_dark'] as $sType)
            $this->assertSame(BxDolDesigns::LOGO_SOURCE_NONE, $aSources[$sType]['source'], $sType . ' is not paired with a built-in image');
    }

    public function testTemplateUploadComesBeforeDesignerUpload(): void
    {
        $iSystem = $this->storeFile();
        $iTemplate = $this->storeFile();
        setParam('sys_site_logo', $iSystem);
        setParam($this->_aTemplateParams['logo'], $iTemplate);

        $aSource = $this->sources()['logo'];

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_TEMPLATE, $aSource['source']);
        $this->assertSame($iTemplate, $aSource['file_id']);
    }

    public function testUploadedMarkKeepsTheBuiltInLogoButNotTheBuiltInDarkMark(): void
    {
        setParam($this->_aTemplateParams['mark'], $this->storeFile());

        $aSources = $this->sources();

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_BUILTIN, $aSources['logo']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_BUILTIN, $aSources['logo_dark']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_TEMPLATE, $aSources['mark']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_NONE, $aSources['mark_dark']['source'], 'dark mode shows the uploaded mark, not the default dark one');
    }

    public function testSvgCodeReplacesTheBuiltInLogoInBothModes(): void
    {
        setParam('sys_site_logo_inline', '<svg xmlns="http://www.w3.org/2000/svg"/>');

        $aSources = $this->sources();

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_INLINE, $aSources['logo']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_SYSTEM, $aSources['logo']['code_source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_NONE, $aSources['logo_dark']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_BUILTIN, $aSources['mark']['source']);
    }

    public function testMarkSvgCodeStandsInNextToAnUploadedLogo(): void
    {
        setParam('sys_site_logo', $this->storeFile());
        setParam($this->_aTemplateParams['mark_inline'], '<svg xmlns="http://www.w3.org/2000/svg"/>');

        $aSources = $this->sources();

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_SYSTEM, $aSources['logo']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_INLINE, $aSources['mark']['source']);
        $this->assertSame(BxDolDesigns::LOGO_SOURCE_TEMPLATE, $aSources['mark']['code_source']);
    }

    public function testUploadedImageComesBeforeSvgCode(): void
    {
        setParam('sys_site_logo', $this->storeFile());
        setParam('sys_site_logo_inline', '<svg xmlns="http://www.w3.org/2000/svg"/>');

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_SYSTEM, $this->sources()['logo']['source']);
    }

    public function testSvgCodeIsSkippedForATemplateWithoutThatSetting(): void
    {
        setParam('sys_site_logo_inline', '<svg xmlns="http://www.w3.org/2000/svg"/>');

        $aParams = $this->_aTemplateParams;
        unset($aParams['logo_inline']);

        $aSources = BxDolDesigns::getLogoSources($aParams, function ($sFile) {
            return 'builtin/' . $sFile;
        });

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_BUILTIN, $aSources['logo']['source']);
    }

    public function testASettingWhoseFileIsGoneFallsBack(): void
    {
        $iId = $this->storeFile();
        BxDolStorage::getObjectInstance('sys_images_custom')->deleteFile($iId, 0);
        setParam('sys_site_logo', $iId);

        $this->assertSame(BxDolDesigns::LOGO_SOURCE_BUILTIN, $this->sources()['logo']['source']);
    }

    public function testDesignerHasAnOptionForEveryLogoImage(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach (['sys_site_logo', 'sys_site_logo_dark', 'sys_site_logo_inline', 'sys_site_mark', 'sys_site_mark_dark', 'sys_site_mark_inline', 'sys_site_logo_alt'] as $sName)
            $this->assertSame(1, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_options` WHERE `name` = :name", ['name' => $sName]), $sName);

        $this->assertNotSame('0', getParam('sys_site_logo_alt'), 'an empty logo text falls back to the site name');
    }

    private function sources(): array
    {
        return BxDolDesigns::getLogoSources($this->_aTemplateParams, function ($sFile) {
            return 'builtin/' . $sFile;
        });
    }

    private function optionNames(): array
    {
        $aNames = [];
        foreach (array_merge(self::TYPES, ['logo_inline', 'mark_inline']) as $sType) {
            $aNames[] = 'sys_site_' . $sType;
            if (!empty($this->_aTemplateParams[$sType]))
                $aNames[] = $this->_aTemplateParams[$sType];
        }

        return $aNames;
    }

    private function storeFile(): int
    {
        $sPath = tempnam(sys_get_temp_dir(), 'bx-logo-test-') . '.svg';
        file_put_contents($sPath, '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><rect width="200" height="40"/></svg>');

        $iId = (int)BxDolStorage::getObjectInstance('sys_images_custom')->storeFileFromPath($sPath, false, 0);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iId, 'test SVG stored');

        $this->_aFiles[] = $iId;
        return $iId;
    }
}
