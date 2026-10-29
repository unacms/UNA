<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * bx_api_get_image measures transcoder images from the local file, not by downloading the url
 * (or running ffmpeg for a video poster), unless the transcoder measures them its own way.
 */
#[Group('integration')]
class ApiImageSizeTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_iFileId = 0;
    protected $_sTmpFile = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');
    }

    protected function tearDown(): void
    {
        if ($this->_iFileId)
            BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->deleteFile($this->_iFileId, 0);
        if ($this->_sTmpFile && file_exists($this->_sTmpFile))
            unlink($this->_sTmpFile);

        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    public function testTranscodedImageIsMeasuredFromTheFile(): void
    {
        $this->_sTmpFile = BX_DIRECTORY_PATH_TMP . 'api-image-size-test-' . uniqid() . '.png';
        $oImage = imagecreatetruecolor(64, 40);
        imagepng($oImage, $this->_sTmpFile);

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        $this->_iFileId = (int)$oStorage->storeFileFromPath($this->_sTmpFile, false, 0);
        $this->assertGreaterThan(0, $this->_iFileId, 'The fixture image was not stored.');

        $_GET['api'] = 1;

        //--- The API shows the original, which is the file read from the disk.
        $sLocalPath = BxDolTranscoder::getObjectInstance(BX_DOL_TRANSCODER_OBJ_COVER)->getFileLocalPath($this->_iFileId);
        $this->assertNotFalse($sLocalPath);
        $this->assertSame($oStorage->getFileLocalPath($this->_iFileId), $sLocalPath);

        $aImage = bx_api_get_image([BX_DOL_STORAGE_OBJ_IMAGES, BX_DOL_TRANSCODER_OBJ_COVER], $this->_iFileId);

        $this->assertIsArray($aImage);
        $this->assertSame($oStorage->getFileUrlById($this->_iFileId), $aImage['src'], 'API images are the originals.');
        $this->assertSame(64, $aImage['width']);
        $this->assertSame(40, $aImage['height']);
    }

    public function testOnlyStockImageTranscodersAreMeasuredFromTheFile(): void
    {
        $this->assertTrue(bx_api_is_image_transcoder(BxDolTranscoder::getObjectInstance(BX_DOL_TRANSCODER_OBJ_COVER)));

        foreach ([ApiImageSizeTestTranscoder::class, ApiImageSizeTestTranscoderUrl::class] as $sClass) {
            $oCustom = (new ReflectionClass($sClass))->newInstanceWithoutConstructor();
            $this->assertFalse(bx_api_is_image_transcoder($oCustom), 'A custom transcoder keeps its getSize: ' . $sClass);
        }

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_posts'))
            return;

        $oPoster = BxDolTranscoder::getObjectInstance('bx_posts_videos_poster');
        $oVideo = BxDolTranscoder::getObjectInstance('bx_posts_videos_mp4');
        if ($oPoster)
            $this->assertTrue(bx_api_is_image_transcoder($oPoster), 'A video poster is an image.');
        if ($oVideo)
            $this->assertFalse(bx_api_is_image_transcoder($oVideo), 'A video is measured by getSize, as before.');
    }
}

class ApiImageSizeTestTranscoder extends BxDolTranscoderImage
{
    public function getSize($sFile)
    {
        return ['w' => 1, 'h' => 1];
    }
}

/**
 * Serves another file (a CDN variant, say) than the stock url, so its size isn't the original's.
 */
class ApiImageSizeTestTranscoderUrl extends BxDolTranscoderImage
{
    public function getFileUrl($mixedHandler)
    {
        return 'https://cdn.example.com/300x300/' . $mixedHandler . '.jpg';
    }
}
