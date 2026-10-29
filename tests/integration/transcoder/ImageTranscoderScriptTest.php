<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * image_transcoder.php serves only links which the site made (getFileUrlNotReady signs them),
 * so files of private storages can't be transcoded and published by trying file ids.
 */
#[Group('integration')]
class ImageTranscoderScriptTest extends BxDolIntegrationTestCase
{
    private const TRANSCODER = 'sys_cover';

    private $_oTranscoder;
    private $_oStorage;
    private $_iFileId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');

        $this->_oTranscoder = BxDolTranscoderImage::getObjectInstance(self::TRANSCODER);
        if (!$this->_oTranscoder)
            $this->markTestSkipped('Transcoder ' . self::TRANSCODER . ' is not installed.');

        $aTranscoder = BxDolTranscoderQuery::getTranscoderObject(self::TRANSCODER);
        $aSource = unserialize($aTranscoder['source_params']);
        $this->_oStorage = BxDolStorage::getObjectInstance($aSource['object']);

        $sFile = BX_DIRECTORY_PATH_TMP . 'transcoder_test_' . getmypid() . '.png';
        $r = imagecreatetruecolor(40, 30);
        imagepng($r, $sFile);
        $this->_iFileId = (int)$this->_oStorage->storeFileFromPath($sFile, true, 0);
        @unlink($sFile);

        $this->assertGreaterThan(0, $this->_iFileId, 'Storage error code ' . $this->_oStorage->getErrorCode());
        $this->_oStorage->afterUploadCleanup($this->_iFileId, 0);
        $this->assertTrue($this->_oStorage->isFilePrivate($this->_iFileId));
    }

    protected function tearDown(): void
    {
        if ($this->_iFileId) {
            // Delete transcoded copies and their traces directly: other tests swap the alerts cache,
            // so the file_deleted handlers may not run.
            foreach ([$this->_iFileId, $this->_iFileId . '@2x'] as $sHandler) {
                if (!($iTranscodedId = (int)$this->_oTranscoder->getDb()->getFileIdByHandler($sHandler)))
                    continue;

                $this->_oTranscoder->getStorage()->deleteFile($iTranscodedId);
                $this->_oTranscoder->onDeleteFileLocal($iTranscodedId);
            }

            $this->_oStorage->deleteFile($this->_iFileId);
        }

        parent::tearDown();
    }

    public function testUnsignedLinkIsRefused(): void
    {
        $this->assertSame(404, $this->request(['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1]));
        $this->assertFalse($this->isTranscoded($this->_iFileId));
    }

    public function testWrongSignatureIsRefused(): void
    {
        $aGet = ['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1, 's' => $this->_oTranscoder->getHandlerSignature($this->_iFileId + 1)];

        $this->assertSame(404, $this->request($aGet));
        $this->assertFalse($this->isTranscoded($this->_iFileId));
    }

    public function testLinkOfNotReadyFileIsServed(): void
    {
        $aGet = $this->notReadyLinkParams();

        $this->assertSame(302, $this->request($aGet));
        $this->assertTrue($this->isTranscoded($this->_iFileId));
    }

    public function testRetinaLinkIsServed(): void
    {
        $aGet = $this->notReadyLinkParams();
        $aGet['dpx'] = 2;

        $this->assertSame(302, $this->request($aGet));
        $this->assertTrue($this->isTranscoded($this->_iFileId . '@2x'));
    }

    private function notReadyLinkParams(): array
    {
        $this->_oTranscoder->forceDevicePixelRatio(1);
        $sUrl = $this->_oTranscoder->getFileUrlNotReady($this->_iFileId);
        $this->_oTranscoder->forceDevicePixelRatio(0);

        parse_str((string)parse_url($sUrl, PHP_URL_QUERY), $aGet);
        $this->assertSame(self::TRANSCODER, $aGet['o'] ?? null);
        $this->assertArrayHasKey('s', $aGet);

        return $aGet;
    }

    private function isTranscoded($sHandler): bool
    {
        return (bool)$this->_oTranscoder->getDb()->getFileIdByHandler($sHandler);
    }

    /**
     * Run image_transcoder.php in a separate process, since it exits, and return the response status.
     */
    private function request(array $aGet): int
    {
        $sCode = implode("\n", [
            "define('BX_SKIP_INSTALL_CHECK', 1);",
            '$_GET = $_REQUEST = ' . var_export(array_map('strval', $aGet), true) . ';',
            'register_shutdown_function(function () { echo "\n#status:" . http_response_code(); });',
            'chdir(' . var_export(BX_DIRECTORY_PATH_ROOT, true) . ');',
            "require './image_transcoder.php';",
        ]);

        exec(escapeshellarg(PHP_BINARY) . ' -r ' . escapeshellarg($sCode) . ' 2>/dev/null', $aOutput);

        $this->assertMatchesRegularExpression('/^#status:\d+$/', (string)end($aOutput));

        return (int)substr(end($aOutput), strlen('#status:'));
    }
}
