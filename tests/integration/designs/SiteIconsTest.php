<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The site's default icons (template/images/icons): every icon Studio > Designer > Icon previews has one, and the
 * PWA manifest lists the Android ones while nothing is uploaded, so the site has home screen icons out of the box.
 */
#[Group('integration')]
class SiteIconsTest extends BxDolIntegrationTestCase
{
    private const ANDROID = [
        'sys_site_icon_android' => ['android-icon-192.png', 192],
        'sys_site_icon_android_splash' => ['android-icon-512.png', 512],
    ];

    private array $_aOptionsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (array_keys(self::ANDROID) as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        parent::tearDown();
    }

    public function testEveryIconHasADefault(): void
    {
        foreach (['favicon.svg', 'favicon-dark.svg', 'apple-touch-icon.png', 'android-icon-192.png', 'android-icon-512.png'] as $sFile) {
            $this->assertFileExists(BX_DIRECTORY_PATH_ROOT . 'template/images/icons/' . $sFile);
            $this->assertNotSame('', BxDolTemplate::getInstance()->getIconUrl($sFile), $sFile . ' resolves through the template');
        }
    }

    public function testTheAndroidDefaultsAreSquarePngsOfTheirSize(): void
    {
        foreach (self::ANDROID as [$sFile, $iSize]) {
            $aSize = getimagesize(BX_DIRECTORY_PATH_ROOT . 'template/images/icons/' . $sFile);
            $this->assertSame([$iSize, $iSize, 'image/png'], [$aSize[0], $aSize[1], $aSize['mime']], $sFile);
        }
    }

    public function testTheManifestListsTheAndroidDefaultsWhenNothingIsUploaded(): void
    {
        foreach (array_keys(self::ANDROID) as $sName)
            setParam($sName, 0);

        $aIcons = $this->manifestIcons();

        foreach (self::ANDROID as [$sFile, $iSize]) {
            $aIcon = current(array_filter($aIcons, function ($aIcon) use ($sFile) {
                return strpos($aIcon['src'], $sFile) !== false;
            }));
            $this->assertIsArray($aIcon, $sFile . ' is in the manifest');
            $this->assertSame($iSize . 'x' . $iSize, $aIcon['sizes']);
            $this->assertSame('image/png', $aIcon['type']);
        }
    }

    private function manifestIcons(): array
    {
        $sCwd = getcwd();
        chdir(BX_DIRECTORY_PATH_ROOT);
        ob_start();
        try {
            include BX_DIRECTORY_PATH_ROOT . 'manifest.json.php';
        } finally {
            $sJson = ob_get_clean();
            chdir($sCwd);
        }

        $aManifest = json_decode($sJson, true);
        $this->assertIsArray($aManifest, 'the manifest is JSON');

        return isset($aManifest['icons']) ? $aManifest['icons'] : [];
    }
}
