<?php

/**
 * Logo images get width and height attributes, so the header keeps its layout while they load.
 */
class BxDolDesignsLogoSizeTest extends BxDolTestCase
{
    protected $_aFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->_aFiles as $sFile)
            @unlink($sFile);
    }

    protected function file(string $sExt, string $sContent): string
    {
        $sFile = tempnam(sys_get_temp_dir(), 'bxlogo') . '.' . $sExt;
        file_put_contents($sFile, $sContent);
        return $this->_aFiles[] = $sFile;
    }

    public function testSvgWidthAndHeight()
    {
        $sFile = $this->file('svg', '<?xml version="1.0"?><svg width="335" height="100px" viewBox="91 4 67 20" xmlns="http://www.w3.org/2000/svg"></svg>');

        $this->assertSame([335, 100], BxDolDesigns::getImageFileSize($sFile));
    }

    public function testSvgViewBoxWhenNoSize()
    {
        $sFile = $this->file('svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120.4 40"></svg>');

        $this->assertSame([120, 40], BxDolDesigns::getImageFileSize($sFile));
    }

    public function testSvgWithRelativeSizeUsesViewBox()
    {
        $sFile = $this->file('svg', '<svg width="100%" height="100%" viewBox="0,0,64,32" xmlns="http://www.w3.org/2000/svg"></svg>');

        $this->assertSame([64, 32], BxDolDesigns::getImageFileSize($sFile));
    }

    public function testRasterImage()
    {
        $sFile = $this->file('png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAEUlEQVR42mNkYPhfz4AEGJE5ABxbAgSN0XNvAAAAAElFTkSuQmCC'));

        $this->assertSame([3, 2], BxDolDesigns::getImageFileSize($sFile));
    }

    public function testUnknown()
    {
        $this->assertSame([], BxDolDesigns::getImageFileSize(''));
        $this->assertSame([], BxDolDesigns::getImageFileSize('/no/such/file.svg'));
        $this->assertSame([], BxDolDesigns::getImageFileSize($this->file('svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')));
    }

    public function testBuiltinLogoHasASize()
    {
        $this->assertSame([335, 100], BxDolDesigns::getImageFileSize(BX_DIRECTORY_PATH_ROOT . 'template/images/' . BxDolDesigns::$aLogoBuiltins['logo']));
    }

    public function testAttrsForHeightOnly()
    {
        $this->assertSame(['attrs' => 'width="335" height="100"', 'style' => 'width:auto;'], BxDolDesigns::getLogoSizeAttrs([335, 100], 0, 40));
        $this->assertSame(['attrs' => 'width="335" height="100"', 'style' => 'height:auto;'], BxDolDesigns::getLogoSizeAttrs([335, 100], 120, 0));
    }

    public function testAttrsFromSettingsWhenBothAreSet()
    {
        $this->assertSame(['attrs' => 'width="160" height="48"', 'style' => ''], BxDolDesigns::getLogoSizeAttrs([], 160, 48));
    }

    public function testNoAttrsWhenTheSizeIsUnknown()
    {
        $this->assertSame(['attrs' => '', 'style' => ''], BxDolDesigns::getLogoSizeAttrs([], 0, 40));
    }

    public function testGzipLoaderCachesForAYear()
    {
        $o = new BxDolGzip('bx_templ_js_0123abcd.js');

        $this->assertGreaterThanOrEqual(3600 * 24 * 365, $this->bxGetProtected($o, '_iExpirationOffset'));
    }
}
