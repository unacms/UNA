<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * An uploaded logo keeps its proportions: the ratio is read from the stored file (BxDolDesigns::getLogoFileAspectRatio),
 * never from the site's own URL, which fails in Docker, behind a CDN or basic auth. When it can't be read, the logo
 * gets a height only and never a square.
 */
#[Group('integration')]
class LogoAspectRatioTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['bx_artificer_site_logo', 'bx_artificer_site_logo_aspect_ratio', 'bx_artificer_site_logo_dark', 'bx_artificer_site_logo_dark_aspect_ratio'];

    private array $_aBackup = [];
    private array $_aFiles = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_artificer'))
            $this->markTestSkipped('Artificer is not installed.');

        foreach (self::OPTIONS as $sName)
            $this->_aBackup[$sName] = getParam($sName);
    }

    protected function tearDown(): void
    {
        foreach ($this->_aBackup as $sName => $sValue)
            setParam($sName, $sValue);

        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        foreach ($this->_aFiles as $iId)
            $oStorage->deleteFile($iId, 0);

        parent::tearDown();
    }

    public function testRatioOfAStoredPng(): void
    {
        $this->assertEqualsWithDelta(4.0, BxDolDesigns::getLogoFileAspectRatio($this->storePng(480, 120)), 0.0001);
    }

    public function testRatioOfAStoredSvg(): void
    {
        $iId = $this->store('svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><rect width="300" height="100"/></svg>');

        $this->assertEqualsWithDelta(3.0, BxDolDesigns::getLogoFileAspectRatio($iId), 0.0001);
    }

    public function testNoFileHasNoRatio(): void
    {
        $this->assertSame(0.0, BxDolDesigns::getLogoFileAspectRatio(0));
        $this->assertSame(0.0, BxDolDesigns::getLogoFileAspectRatio(PHP_INT_MAX));
        $this->assertSame(0.0, BxDolDesigns::getLogoFileAspectRatio($this->store('svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')));
    }

    public function testTheWidthFollowsTheMeasuredRatioAndIsSaved(): void
    {
        $iId = $this->storePng(480, 120);
        setParam('bx_artificer_site_logo_aspect_ratio', '');

        $aValues = $this->config()->getLogoValues('logo', 'http://example.com/logo.png', ['id' => $iId]);

        $this->assertSame(40, $aValues['logo_height']);
        $this->assertSame(160, $aValues['logo_width'], 'a 4:1 logo 40 high is 160 wide, not a 40x40 square');
        $this->assertEqualsWithDelta(4.0, (float)getParam('bx_artificer_site_logo_aspect_ratio'), 0.0001, 'measured once, then read from the option');
    }

    public function testTheDarkLogoToo(): void
    {
        $iId = $this->storePng(300, 100);
        setParam('bx_artificer_site_logo_dark_aspect_ratio', '');

        $aValues = $this->config()->getLogoValues('logo_dark', 'http://example.com/logo-dark.png', ['id' => $iId]);

        $this->assertSame(120, $aValues['logo_dark_width']);
        $this->assertEqualsWithDelta(3.0, (float)getParam('bx_artificer_site_logo_dark_aspect_ratio'), 0.0001);
    }

    public function testAnUnknownRatioGivesTheHeightOnly(): void
    {
        $iId = $this->store('svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
        setParam('bx_artificer_site_logo_aspect_ratio', '');

        $aValues = $this->config()->getLogoValues('logo', 'http://example.com/logo.svg', ['id' => $iId]);
        $this->assertSame(0, $aValues['logo_width'], 'no width: the browser takes it from the image');
        $this->assertSame(40, $aValues['logo_height']);
        $this->assertSame('-1', (string)getParam('bx_artificer_site_logo_aspect_ratio'), 'not measured again on every page');

        // the saved -1 is read back as unknown too
        $aValues = $this->config()->getLogoValues('logo', 'http://example.com/logo.svg', ['id' => $iId]);
        $this->assertSame(0, $aValues['logo_width']);
        $this->assertSame(0.0, $aValues['logo_aspect_ratio']);
    }

    public function testANewUploadIsMeasuredAgain(): void
    {
        setParam('bx_artificer_site_logo_aspect_ratio', '2.5');
        bx_alert('system', 'save_setting', 0, 0, ['category' => ['type_group' => 'system'], 'option' => 'bx_artificer_site_logo', 'value' => '1', 'value_prior' => '0']);
        $this->assertSame('', (string)getParam('bx_artificer_site_logo_aspect_ratio'), "the template's own logo setting");

        setParam('bx_artificer_site_logo_dark_aspect_ratio', '2.5');
        bx_alert('system', 'change_logo_dark', 0, 0, ['option' => 'sys_site_logo_dark', 'value' => 1, 'value_prior' => 0]);
        $this->assertSame('', (string)getParam('bx_artificer_site_logo_dark_aspect_ratio'), 'Designer > Logo');
    }

    private function config(): BxBaseModTemplateConfig
    {
        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_artificer');
        bx_import('Config', $aModule);

        $oConfig = new BxArtificerConfig($aModule);
        $oDb = BxDolModule::getInstance('bx_artificer')->_oDb;
        $oConfig->init($oDb);

        return $oConfig;
    }

    private function storePng(int $iWidth, int $iHeight): int
    {
        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not installed.');

        $oImage = imagecreatetruecolor($iWidth, $iHeight);
        ob_start();
        imagepng($oImage);
        return $this->store('png', (string)ob_get_clean());
    }

    private function store(string $sExt, string $sContent): int
    {
        $sTemp = tempnam(sys_get_temp_dir(), 'bx-logo-ratio-');
        $sPath = $sTemp . '.' . $sExt;
        rename($sTemp, $sPath);
        file_put_contents($sPath, $sContent);

        $iId = (int)BxDolStorage::getObjectInstance('sys_images_custom')->storeFileFromPath($sPath, false, 0);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iId, 'test image stored');

        return $this->_aFiles[] = $iId;
    }
}
