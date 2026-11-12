<?php

/**
 * In an API v2 request image sizes are the size the image is shown at: EXIF Orientation is
 * applied, as it is when the resized copies are made. Everywhere else (the site, API v1) the size
 * is the file's own, as it always was.
 */
class BxDolImageResizeTest extends BxDolTestCase
{
    private $_aFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->_aFiles as $sFile)
            @unlink($sFile);
        $this->_aFiles = [];
        bx_is_api_v2(false);
        parent::tearDown();
    }

    public function testQuarterTurns()
    {
        foreach ([0, 1, 2, 3, 4] as $i)
            $this->assertFalse(BxDolImageResize::isQuarterTurn($i), "orientation $i");
        foreach ([5, 6, 7, 8] as $i)
            $this->assertTrue(BxDolImageResize::isQuarterTurn($i), "orientation $i");
    }

    public function testSizeWithoutOrientation()
    {
        $sFile = $this->_jpeg(40, 20, 0);
        $this->assertSame(['w' => 40, 'h' => 20], BxDolImageResize::getImageSize($sFile));
    }

    public function testSizeOfARotatedPhotoIsTheFilesOwnOutsideApiV2()
    {
        if (!function_exists('exif_read_data'))
            $this->markTestSkipped('The exif extension is not installed.');

        $this->assertFalse(bx_is_api_v2());
        foreach ([3, 6, 8] as $iOrientation)
            $this->assertSame(['w' => 40, 'h' => 20], BxDolImageResize::getImageSize($this->_jpeg(40, 20, $iOrientation)), "orientation $iOrientation");
    }

    public function testSizeOfARotatedPhotoIsTheShownSizeInApiV2()
    {
        if (!function_exists('exif_read_data'))
            $this->markTestSkipped('The exif extension is not installed.');

        bx_is_api_v2(true);
        $this->assertSame(['w' => 20, 'h' => 40], BxDolImageResize::getImageSize($this->_jpeg(40, 20, 6)));
        $this->assertSame(['w' => 20, 'h' => 40], BxDolImageResize::getImageSize($this->_jpeg(40, 20, 8)));
        $this->assertSame(['w' => 40, 'h' => 20], BxDolImageResize::getImageSize($this->_jpeg(40, 20, 3)));
    }

    /**
     * A JPEG of the given size, with an EXIF Orientation when $iOrientation is not 0.
     */
    private function _jpeg($iWidth, $iHeight, $iOrientation)
    {
        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not installed.');

        $oImage = imagecreatetruecolor($iWidth, $iHeight);
        ob_start();
        imagejpeg($oImage);
        $sJpeg = ob_get_clean();

        if ($iOrientation) {
            // TIFF header (little endian), one IFD entry: Orientation (0x0112), SHORT, 1 value
            $sTiff = 'II' . pack('v', 0x2A) . pack('V', 8)
                . pack('v', 1)
                . pack('v', 0x0112) . pack('v', 3) . pack('V', 1) . pack('v', $iOrientation) . pack('v', 0)
                . pack('V', 0);
            $sApp1 = "Exif\0\0" . $sTiff;
            $sJpeg = substr($sJpeg, 0, 2) . "\xFF\xE1" . pack('n', strlen($sApp1) + 2) . $sApp1 . substr($sJpeg, 2);
        }

        $sFile = tempnam(sys_get_temp_dir(), 'bxir') . '.jpg';
        file_put_contents($sFile, $sJpeg);
        $this->_aFiles[] = $sFile;
        return $sFile;
    }
}
