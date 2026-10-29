<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolTranscoderImageApiUrlTestDouble extends BxDolTranscoderImage
{
    public $iOrigCalls = 0;
    public $mixedOrigUrl = false;

    public function setUpDouble($oStorage, $mixedOrigUrl)
    {
        $this->_aObject = ['object' => 'test_image', 'source_type' => 'Storage', 'source_params' => ['object' => 'sys_images']];
        $this->_oStorage = $oStorage;
        $this->mixedOrigUrl = $mixedOrigUrl;
    }

    public function getOrigFileUrl($mixedHandler)
    {
        $this->iOrigCalls++;
        return $this->mixedOrigUrl;
    }

    // Web mode: stop BxDolTranscoder::getFileUrl before it reads the DB.
    public function isFileReady($mixedHandlerOrig, $isCheckOutdated = true)
    {
        return false;
    }

    public function getFileUrlNotReady($mixedHandler)
    {
        return 'not-ready:' . $mixedHandler;
    }
}

class BxDolTranscoderImageApiUrlTestStorage
{
    public $iMimeCalls = 0;

    public function getMimeTypeByFileName($sFileName)
    {
        $this->iMimeCalls++;
        return str_ends_with($sFileName, '.svg') ? 'image/svg+xml' : 'image/png';
    }

    public function isMimeTypeSvg($sMimeType)
    {
        return str_starts_with($sMimeType, 'image/svg');
    }
}

/**
 * Image transcoder urls: the API gets the original after one lookup, the web keeps the SVG check (no DB).
 */
class BxDolTranscoderImageApiUrlTest extends BxDolTestCase
{
    private $_aGetBackup;

    protected function setUp(): void
    {
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;
    }

    private function transcoder($mixedOrigUrl, &$oStorage)
    {
        $oStorage = new BxDolTranscoderImageApiUrlTestStorage();
        $o = (new ReflectionClass(BxDolTranscoderImageApiUrlTestDouble::class))->newInstanceWithoutConstructor();
        $o->setUpDouble($oStorage, $mixedOrigUrl);
        return $o;
    }

    public static function providerForApi()
    {
        return [
            'raster' => ['https://example.com/s/abc.png'],
            'svg' => ['https://example.com/s/abc.svg'],
            'missing' => [false],
        ];
    }

    #[DataProvider('providerForApi')]
    public function testApiGetsOriginalWithOneLookup($mixedOrigUrl)
    {
        $_GET['api'] = 1;
        $o = $this->transcoder($mixedOrigUrl, $oStorage);

        $this->assertSame($mixedOrigUrl, $o->getFileUrl(5));
        $this->assertSame(1, $o->iOrigCalls, 'The original is read once.');
        $this->assertSame(0, $oStorage->iMimeCalls, 'No SVG check is needed in API mode.');
    }

    public static function providerForWeb()
    {
        return [
            'svg' => ['https://example.com/s/abc.svg', 'https://example.com/s/abc.svg', 1],
            'raster' => ['https://example.com/s/abc.png', 'not-ready:5', 1],
            'missing' => [false, 'not-ready:5', 0],
        ];
    }

    #[DataProvider('providerForWeb')]
    public function testWebKeepsSvgCheck($mixedOrigUrl, $sExpected, $iMimeCalls)
    {
        unset($_GET['api']);
        if (bx_is_api())
            $this->markTestSkipped('API mode is forced in this process.');

        $o = $this->transcoder($mixedOrigUrl, $oStorage);

        $this->assertSame($sExpected, $o->getFileUrl(5));
        $this->assertSame(1, $o->iOrigCalls);
        $this->assertSame($iMimeCalls, $oStorage->iMimeCalls);
    }
}
