<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Records file_downloaded alerts of the tested storage.
 */
class BxTestStorageDownloadAlertsResponse extends BxDolAlertsResponse
{
    public static $aFileIds = [];

    public function response($oAlert)
    {
        if ($oAlert->sUnit === StorageDownloadTest::STORAGE && $oAlert->sAction === 'file_downloaded')
            self::$aFileIds[] = (int)$oAlert->iObject;
    }
}

/**
 * Files of a local storage sent by storage.php: cache headers of public and private files,
 * errors which caches must not keep, and the download alert only for answers which send the file.
 */
#[Group('integration')]
class StorageDownloadTest extends BxDolIntegrationTestCase
{
    public const STORAGE = 'sys_images';

    private static $_oServer;

    private $_oStorage;
    private $_aObject;
    private $_aFileIds = [];
    private $_aAlertsCacheBackup;

    protected function setUp(): void
    {
        parent::setUp();

        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');

        $this->_oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        if (!$this->_oStorage)
            $this->markTestSkipped('Storage ' . self::STORAGE . ' is not installed.');

        $this->_aObject = $this->_oStorage->getObjectData();
        if ('Local' != $this->_aObject['engine'])
            $this->markTestSkipped('Storage ' . self::STORAGE . ' is not local.');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aFileIds as $iFileId)
            $this->_oStorage->deleteFile($iFileId);

        if (null !== $this->_aAlertsCacheBackup)
            (new ReflectionProperty(BxDolAlerts::class, '_aCacheData'))->setValue(null, $this->_aAlertsCacheBackup);

        parent::tearDown();
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$_oServer) {
            self::$_oServer->stop();
            self::$_oServer = null;
        }
    }

    public function testPublicFileIsImmutable(): void
    {
        $aFile = $this->storeFile(false);

        $a = $this->request($aFile);

        $this->assertSame(200, $a['status']);
        $this->assertTrue($this->fileContents($aFile) === $a['body'], 'The body differs from the file.');
        $this->assertSame('public, must-revalidate, max-age=' . $this->_aObject['cache_control'] . ', immutable', $this->header($a, 'cache-control'));
        $this->assertSame($this->etag($aFile), $this->header($a, 'etag'));
        $this->assertNull($this->header($a, 'set-cookie'));
    }

    public function testPrivateFileKeepsItsCacheHeaders(): void
    {
        $aFile = $this->storeFile(true);
        $iAge = $this->_aObject['cache_control'] > $this->_aObject['token_life'] ? $this->_aObject['token_life'] : $this->_aObject['cache_control'];

        $a = $this->request($aFile, [], 'GET', $this->token($aFile));

        $this->assertSame(200, $a['status']);
        $this->assertTrue($this->fileContents($aFile) === $a['body'], 'The body differs from the file.');
        $this->assertSame('private, must-revalidate, max-age=' . $iAge, $this->header($a, 'cache-control'));
    }

    public function testSuffixRange(): void
    {
        $aFile = $this->storeFile(false);
        $sContents = $this->fileContents($aFile);
        $iSize = strlen($sContents);

        $a = $this->request($aFile, ['Range' => 'bytes=-10']);

        $this->assertSame(206, $a['status']);
        $this->assertSame('bytes ' . ($iSize - 10) . '-' . ($iSize - 1) . '/' . $iSize, $this->header($a, 'content-range'));
        $this->assertSame(substr($sContents, -10), $a['body']);
    }

    public function testNotModified(): void
    {
        $aFile = $this->storeFile(false);

        $a = $this->request($aFile, ['If-None-Match' => $this->etag($aFile)]);

        $this->assertSame(304, $a['status']);
        $this->assertSame('', $a['body']);
        $this->assertSame('public, must-revalidate, max-age=' . $this->_aObject['cache_control'] . ', immutable', $this->header($a, 'cache-control'));
    }

    public function testUnsatisfiableRangeIsNotCacheable(): void
    {
        $aFile = $this->storeFile(false);

        foreach (['bytes=0-1,5-6', 'bytes=5-3', 'bytes=-0', 'bytes=abc'] as $sRange) {
            $a = $this->request($aFile, ['Range' => $sRange]);

            $this->assertSame(416, $a['status'], $sRange);
            $this->assertSame('bytes */' . strlen($this->fileContents($aFile)), $this->header($a, 'content-range'), $sRange);
            $this->assertNotCacheable($a, $sRange);
        }
    }

    public function testErrorsAreNotCacheable(): void
    {
        $aFile = $this->storeFile(true);

        $a = $this->request($aFile);
        $this->assertSame(403, $a['status']);
        $this->assertNotCacheable($a, 'no token');

        $a = $this->request(['remote_id' => 'phpunitmissing' . getmypid(), 'ext' => 'png']);
        $this->assertSame(404, $a['status']);
        $this->assertNotCacheable($a, 'missing file');
    }

    public function testOnlyAnswersWithTheFileAreDownloads(): void
    {
        $aFile = $this->storeFile(false);
        $sContents = $this->fileContents($aFile);
        $this->recordDownloads();

        $aCases = [
            ['GET', [], $sContents, [$aFile['id']]],
            ['GET', ['HTTP_RANGE' => 'bytes=-10'], substr($sContents, -10), [$aFile['id']]],
            ['HEAD', [], '', []],
            ['GET', ['HTTP_IF_NONE_MATCH' => $this->etag($aFile)], '', []],
            ['GET', ['HTTP_RANGE' => 'bytes=5-3'], '', []],
        ];
        foreach ($aCases as [$sMethod, $aServer, $sOutput, $aDownloads]) {
            $sCase = $sMethod . ' ' . json_encode($aServer);
            BxTestStorageDownloadAlertsResponse::$aFileIds = [];

            $aServerBackup = $_SERVER;
            $_SERVER = array_merge($_SERVER, ['REQUEST_METHOD' => $sMethod], $aServer);
            ob_start();
            try {
                $bResult = $this->_oStorage->download($aFile['remote_id']);
            }
            finally {
                $sResult = ob_get_clean();
                $_SERVER = $aServerBackup;
                http_response_code(200);
            }

            $this->assertTrue($bResult, $sCase);
            $this->assertTrue($sOutput === $sResult, $sCase . ': the output differs.');
            $this->assertSame($aDownloads, BxTestStorageDownloadAlertsResponse::$aFileIds, $sCase);
        }
    }

    private function assertNotCacheable(array $a, string $sCase): void
    {
        $this->assertSame('no-store', $this->header($a, 'cache-control'), $sCase);
        foreach (['expires', 'last-modified', 'etag'] as $sName)
            $this->assertNull($this->header($a, $sName), $sCase . ': ' . $sName);
    }

    private function storeFile(bool $isPrivate): array
    {
        $sFile = BX_DIRECTORY_PATH_TMP . 'storage_download_test_' . getmypid() . '.png';
        $r = imagecreatetruecolor(40, 30);
        imagefilledrectangle($r, 5, 5, 20, 20, imagecolorallocate($r, 200, 100, 50));
        imagepng($r, $sFile);

        $iFileId = (int)$this->_oStorage->storeFileFromPath($sFile, $isPrivate, 0);
        @unlink($sFile);

        $this->assertGreaterThan(0, $iFileId, 'Storage error code ' . $this->_oStorage->getErrorCode());
        $this->_aFileIds[] = $iFileId;
        $this->_oStorage->afterUploadCleanup($iFileId, 0);

        return $this->_oStorage->getFile($iFileId);
    }

    private function fileContents(array $aFile): string
    {
        return (string)file_get_contents($this->_oStorage->getFileLocalPath($aFile['id']));
    }

    private function etag(array $aFile): string
    {
        $sPath = $this->_oStorage->getFileLocalPath($aFile['id']);
        return '"' . dechex(filemtime($sPath)) . '-' . dechex(filesize($sPath)) . '"';
    }

    private function token(array $aFile): string
    {
        parse_str((string)parse_url($this->_oStorage->getFileUrlById($aFile['id']), PHP_URL_QUERY), $aQuery);
        $this->assertNotEmpty($aQuery['t'], 'A private file link has no token.');

        return $aQuery['t'];
    }

    private function request(array $aFile, array $aHeaders = [], string $sMethod = 'GET', ?string $sToken = null): array
    {
        if (!self::$_oServer) {
            if (!function_exists('proc_open'))
                $this->markTestSkipped('proc_open is not available.');

            $aUrl = parse_url(BX_DOL_URL_ROOT);
            self::$_oServer = new BxDolTestPhpServer(BX_DIRECTORY_PATH_ROOT, null, $aUrl['host'] . (empty($aUrl['port']) ? '' : ':' . $aUrl['port']));
        }

        $aQuery = ['o' => self::STORAGE, 'f' => $aFile['remote_id'] . '.' . $aFile['ext']];
        if (null !== $sToken)
            $aQuery['t'] = $sToken;

        return self::$_oServer->request($sMethod, '/storage.php?' . http_build_query($aQuery), $aHeaders);
    }

    private function header(array $a, string $sName): ?string
    {
        return BxDolTestPhpServer::header($a, $sName);
    }

    private function recordDownloads(): void
    {
        // the constructor loads the alerts cache when no alert was raised yet
        new BxDolAlerts('system', 'phpunit', 0);

        $oProperty = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $this->_aAlertsCacheBackup = $aCache = $oProperty->getValue();

        $sId = 'phpunit_storage_download';
        $aCache['handlers'][$sId] = [
            'name' => $sId,
            'class' => BxTestStorageDownloadAlertsResponse::class,
            'file' => 'tests/integration/storage/StorageDownloadTest.php',
            'service_call' => '',
            'active' => 1,
        ];
        $aCache['alerts'][self::STORAGE]['file_downloaded'][] = $sId;

        $oProperty->setValue(null, $aCache);
    }
}
