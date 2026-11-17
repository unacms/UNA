<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Editors save the image_transcoder.php link of a picture in the text of a post. A link saved before links
 * were signed has no signature, and image_transcoder.php still serves it for a public file of an editor
 * storage uploaded before the time in 'sys_transcoder_unsigned_before'.
 */
#[Group('integration')]
class ImageTranscoderUnsignedLinkTest extends BxDolIntegrationTestCase
{
    private const TRANSCODER = 'sys_images_editor';
    private const OPTION = 'sys_transcoder_unsigned_before';
    private const CUTOFF = 1700000000;

    private $_oTranscoder;
    private $_oStorage;
    private $_iFileId = 0;
    private $_sOptionBackup;

    protected function setUp(): void
    {
        parent::setUp();

        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');

        $this->_oTranscoder = BxDolTranscoderImage::getObjectInstance(self::TRANSCODER);
        if (!$this->_oTranscoder)
            $this->markTestSkipped('Transcoder ' . self::TRANSCODER . ' is not installed.');

        $this->_oStorage = BxDolStorage::getObjectInstance(self::TRANSCODER);

        $sFile = BX_DIRECTORY_PATH_TMP . 'transcoder_unsigned_test_' . getmypid() . '.png';
        $r = imagecreatetruecolor(40, 30);
        imagepng($r, $sFile);
        $this->_iFileId = (int)$this->_oStorage->storeFileFromPath($sFile, false, 0);
        @unlink($sFile);

        $this->assertGreaterThan(0, $this->_iFileId, 'Storage error code ' . $this->_oStorage->getErrorCode());
        $this->_oStorage->afterUploadCleanup($this->_iFileId, 0);

        $this->_sOptionBackup = getParam(self::OPTION);
        setParam(self::OPTION, (string)self::CUTOFF);
        $this->setFile(['added' => self::CUTOFF - 1]);
    }

    protected function tearDown(): void
    {
        if (null !== $this->_sOptionBackup)
            setParam(self::OPTION, $this->_sOptionBackup);

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

    public function testOldEditorFileIsServedWithoutSignature(): void
    {
        $this->assertSame(302, $this->request(['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1, 't' => 1690000000]));
        $this->assertTrue($this->isTranscoded($this->_iFileId));
    }

    public function testEmptySignatureIsAnUnsignedLink(): void
    {
        $this->assertSame(302, $this->request(['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1, 's' => '']));
    }

    public function testFileUploadedSinceLinksAreSignedIsRefused(): void
    {
        $this->setFile(['added' => self::CUTOFF]);

        $this->assertSame(404, $this->request(['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1]));
        $this->assertFalse($this->isTranscoded($this->_iFileId));
    }

    public function testNothingIsServedUnsignedOnSiteInstalledWithSignedLinks(): void
    {
        setParam(self::OPTION, '0');

        $this->assertSame(404, $this->request(['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1]));
        $this->assertFalse($this->isTranscoded($this->_iFileId));
    }

    public function testPrivateFileIsRefused(): void
    {
        $this->setFile(['private' => 1]);

        $this->assertSame(404, $this->request(['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1]));
        $this->assertFalse($this->isTranscoded($this->_iFileId));
    }

    public function testWrongSignatureIsNotTakenAsUnsigned(): void
    {
        $aGet = ['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1, 's' => $this->_oTranscoder->getHandlerSignature($this->_iFileId + 1)];

        $this->assertSame(404, $this->request($aGet));
        $this->assertFalse($this->isTranscoded($this->_iFileId));
    }

    public function testSignedLinkOfNewFileIsServed(): void
    {
        $this->setFile(['added' => time()]);

        $aGet = ['o' => self::TRANSCODER, 'h' => $this->_iFileId, 'dpx' => 1, 's' => $this->_oTranscoder->getHandlerSignature($this->_iFileId)];

        $this->assertSame(302, $this->request($aGet));
    }

    public function testOtherStoragesNeedSignature(): void
    {
        $oCover = BxDolTranscoderImage::getObjectInstance('sys_cover');
        if (!$oCover)
            $this->markTestSkipped('Transcoder sys_cover is not installed.');

        // the same id, a file of another storage or none: the storage is checked before the file
        $this->assertFalse($oCover->isUnsignedHandlerAllowed($this->_iFileId));
        $this->assertSame(404, $this->request(['o' => 'sys_cover', 'h' => $this->_iFileId, 'dpx' => 1]));
    }

    #[DataProvider('providerForHandlersNeverServedUnsigned')]
    public function testHandlerWhichIsNotFileIdIsRefused($mixedHandler): void
    {
        $this->assertFalse($this->_oTranscoder->isUnsignedHandlerAllowed($mixedHandler));
    }

    static public function providerForHandlersNeverServedUnsigned(): array
    {
        return [
            'missing file' => [2147483000],
            'retina handler' => ['1@2x'],
            'not a number' => ['1 OR 1=1'],
            'negative' => [-1],
            'empty' => [''],
            'false' => [false],
            'array' => [[1]],
        ];
    }

    private function setFile(array $aFields): void
    {
        $aSet = [];
        foreach ($aFields as $sField => $iValue)
            $aSet[] = '`' . $sField . '` = ' . (int)$iValue;

        BxDolDb::getInstance()->query('UPDATE `' . self::TRANSCODER . '` SET ' . implode(', ', $aSet) . ' WHERE `id` = :id', ['id' => $this->_iFileId]);
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
