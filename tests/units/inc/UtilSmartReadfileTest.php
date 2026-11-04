<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * bx_smart_readfile: full, HEAD, conditional and range responses, and the headers each of them carries.
 * Responses are checked through the PHP built-in server, since the CLI SAPI doesn't keep headers.
 */
class UtilSmartReadfileTest extends \PHPUnit\Framework\TestCase
{
    private const MTIME = 1700000000;
    private const AGE = 2592000;

    // Serves a file of its folder with bx_smart_readfile and saves what the function returned.
    // With w=1 the file is opened through a stream wrapper which counts opens and reads.
    private const ROUTER = <<<'EOF'
<?php
define('BX_DOL', 1);
require '%UTILS%';

class BxTestCountingStream
{
    public static $aCalls = ['open' => 0, 'read' => 0];
    public $context;
    private $_h;

    private static function path($s)
    {
        return preg_replace('#^bxtestcount://#', '', $s);
    }

    public function stream_open($sPath, $sMode, $iOptions, &$sOpenedPath)
    {
        ++self::$aCalls['open'];
        $this->_h = fopen(self::path($sPath), $sMode);
        return (bool)$this->_h;
    }

    public function stream_read($iCount)
    {
        ++self::$aCalls['read'];
        return fread($this->_h, $iCount);
    }

    public function stream_eof()
    {
        return feof($this->_h);
    }

    public function stream_seek($iOffset, $iWhence)
    {
        return 0 === fseek($this->_h, $iOffset, $iWhence);
    }

    public function stream_tell()
    {
        return ftell($this->_h);
    }

    public function stream_stat()
    {
        return fstat($this->_h);
    }

    public function stream_close()
    {
        fclose($this->_h);
    }

    public function url_stat($sPath, $iFlags)
    {
        return @stat(self::path($sPath));
    }
}
stream_wrapper_register('bxtestcount', 'BxTestCountingStream');

$sPath = __DIR__ . '/' . basename($_GET['f']);
if (!empty($_GET['w']))
    $sPath = 'bxtestcount://' . $sPath;

$mixedResult = bx_smart_readfile($sPath, isset($_GET['name']) ? $_GET['name'] : '', 'application/octet-stream', (int)$_GET['age'], $_GET['privacy'], $_GET['disposition'], !empty($_GET['immutable']));

file_put_contents(__DIR__ . '/state.json', json_encode(['result' => $mixedResult, 'calls' => BxTestCountingStream::$aCalls]));
EOF;

    private static $_sDir;
    private static $_aFiles = [];
    private static $_oServer;

    public static function setUpBeforeClass(): void
    {
        self::$_sDir = sys_get_temp_dir() . '/bx_smart_readfile_' . getmypid() . '_' . bin2hex(random_bytes(4));
        mkdir(self::$_sDir);

        // big.bin is longer than two 256 KB chunks
        foreach (['small.bin' => 1000, 'big.bin' => 600 * 1024 + 7, 'empty.bin' => 0] as $sName => $iSize) {
            self::$_aFiles[$sName] = $iSize ? random_bytes($iSize) : '';
            file_put_contents(self::$_sDir . '/' . $sName, self::$_aFiles[$sName]);
            touch(self::$_sDir . '/' . $sName, self::MTIME);
        }

        file_put_contents(self::$_sDir . '/router.php', str_replace('%UTILS%', BX_DIRECTORY_PATH_ROOT . 'inc/utils.inc.php', self::ROUTER));
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$_oServer) {
            self::$_oServer->stop();
            self::$_oServer = null;
        }

        if (self::$_sDir && is_dir(self::$_sDir)) {
            array_map('unlink', glob(self::$_sDir . '/*'));
            rmdir(self::$_sDir);
        }
    }

    #[DataProvider('providerForParseRange')]
    public function testParseRange($sRange, $iSize, $mixedResult)
    {
        $this->assertSame($mixedResult, bx_parse_http_range($sRange, $iSize));
    }

    static public function providerForParseRange()
    {
        return [
            'first and last' => ['bytes=0-99', 1000, [0, 99]],
            'one byte' => ['bytes=999-999', 1000, [999, 999]],
            'open end' => ['bytes=900-', 1000, [900, 999]],
            'suffix' => ['bytes=-100', 1000, [900, 999]],
            'suffix longer than the file' => ['bytes=-5000', 1000, [0, 999]],
            'last after the end' => ['bytes=990-5000', 1000, [990, 999]],
            'huge last' => ['bytes=0-99999999999999999999999', 1000, [0, 999]],
            'unit is case-insensitive' => ['BYTES=0-0', 1000, [0, 0]],
            'surrounding spaces' => [' bytes=1-2 ', 1000, [1, 2]],
            'other unit is ignored' => ['items=0-1', 1000, null],
            'several ranges' => ['bytes=0-1,5-6', 1000, false],
            'last before first' => ['bytes=5-3', 1000, false],
            'first at the end' => ['bytes=1000-', 1000, false],
            'first after the end' => ['bytes=1000-2000', 1000, false],
            'empty suffix' => ['bytes=-0', 1000, false],
            'no positions' => ['bytes=-', 1000, false],
            'empty set' => ['bytes=', 1000, false],
            'not a number' => ['bytes=abc', 1000, false],
            'three parts' => ['bytes=1-2-3', 1000, false],
            'sign' => ['bytes=+1-2', 1000, false],
            'space in the set' => ['bytes= 0-1', 1000, false],
            'no set' => ['bytes', 1000, false],
            'no unit' => ['=0-1', 1000, false],
            'empty file' => ['bytes=0-', 0, false],
            'suffix of empty file' => ['bytes=-10', 0, false],
        ];
    }

    #[DataProvider('providerForNotModified')]
    public function testNotModified($sIfNoneMatch, $sIfModifiedSince, $bResult)
    {
        $this->assertSame($bResult, bx_is_http_not_modified($sIfNoneMatch, $sIfModifiedSince, self::etag(1000), self::MTIME));
    }

    static public function providerForNotModified()
    {
        $sETag = self::etag(1000);
        $sLastModified = self::lastModified();

        return [
            'same etag' => [$sETag, null, true],
            'weak etag' => ['W/' . $sETag, null, true],
            'etag in a list' => ['"other", ' . $sETag, null, true],
            'any etag' => ['*', null, true],
            'other etag' => ['"other"', null, false],
            'other etag wins over the date' => ['"other"', $sLastModified, false],
            'same date' => [null, $sLastModified, true],
            'later date' => [null, gmdate('D, d M Y H:i:s', self::MTIME + 60) . ' GMT', true],
            'earlier date' => [null, gmdate('D, d M Y H:i:s', self::MTIME - 1) . ' GMT', false],
            'rfc 850 date' => [null, gmdate('l, d-M-y H:i:s', self::MTIME) . ' GMT', true],
            'asctime date' => [null, gmdate('D M j H:i:s Y', self::MTIME), true],
            'future date' => [null, gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT', false],
            'relative date' => [null, 'tomorrow', false],
            'not a date' => [null, 'garbage', false],
            'no conditions' => [null, null, false],
        ];
    }

    public function testFullResponse()
    {
        [$a, $aState] = $this->fetch(['f' => 'small.bin', 'name' => 'small.bin']);

        $this->assertSame(200, $a['status']);
        $this->assertSame(self::$_aFiles['small.bin'], $a['body']);
        $this->assertTrue($aState['result']);

        $this->assertSame('application/octet-stream', $this->header($a, 'content-type'));
        $this->assertSame('public, must-revalidate, max-age=' . self::AGE, $this->header($a, 'cache-control'));
        $this->assertNotNull($this->header($a, 'expires'));
        $this->assertSame(self::lastModified(), $this->header($a, 'last-modified'));
        $this->assertSame(self::etag(1000), $this->header($a, 'etag'));
        $this->assertSame('bytes', $this->header($a, 'accept-ranges'));
        $this->assertSame('inline; filename="small.bin"', $this->header($a, 'content-disposition'));
        $this->assertSame('bytes 0-999/1000', $this->header($a, 'content-range'));
        $this->assertSame('1000', $this->header($a, 'content-length'));
    }

    public function testCacheControl()
    {
        [$a] = $this->fetch(['f' => 'small.bin', 'immutable' => 1]);
        $this->assertSame('public, must-revalidate, max-age=' . self::AGE . ', immutable', $this->header($a, 'cache-control'));

        [$a] = $this->fetch(['f' => 'small.bin', 'immutable' => 1, 'age' => 0]);
        $this->assertSame('public, must-revalidate, max-age=0', $this->header($a, 'cache-control'));

        [$a] = $this->fetch(['f' => 'small.bin', 'privacy' => 'private', 'age' => 360, 'disposition' => 'attachment', 'name' => 'small.bin']);
        $this->assertSame('private, must-revalidate, max-age=360', $this->header($a, 'cache-control'));
        $this->assertSame('attachment; filename="small.bin"', $this->header($a, 'content-disposition'));
    }

    public function testBigFile()
    {
        $sFile = self::$_aFiles['big.bin'];
        $iSize = strlen($sFile);

        [$a, $aState] = $this->fetch(['f' => 'big.bin']);
        $this->assertSame(200, $a['status']);
        $this->assertSame((string)$iSize, $this->header($a, 'content-length'));
        $this->assertTrue($sFile === $a['body'], 'The body differs from the file.');
        $this->assertTrue($aState['result']);

        // a stream which returns less than asked for
        [$a] = $this->fetch(['f' => 'big.bin', 'w' => 1]);
        $this->assertTrue($sFile === $a['body'], 'The body read through the stream wrapper differs from the file.');

        // across the chunk borders
        [$a] = $this->fetch(['f' => 'big.bin'], ['Range' => 'bytes=262000-530000']);
        $this->assertSame(206, $a['status']);
        $this->assertSame('bytes 262000-530000/' . $iSize, $this->header($a, 'content-range'));
        $this->assertTrue(substr($sFile, 262000, 268001) === $a['body'], 'The body differs from the range of the file.');
    }

    public function testEmptyFile()
    {
        [$a, $aState] = $this->fetch(['f' => 'empty.bin']);

        $this->assertSame(200, $a['status']);
        $this->assertSame('', $a['body']);
        $this->assertSame('0', $this->header($a, 'content-length'));
        $this->assertNull($this->header($a, 'content-range'));
        $this->assertTrue($aState['result']);
    }

    #[DataProvider('providerForRange')]
    public function testRange($sRange, $iStart, $iEnd)
    {
        [$a, $aState] = $this->fetch(['f' => 'small.bin'], ['Range' => $sRange]);

        $this->assertSame(206, $a['status']);
        $this->assertSame('bytes ' . $iStart . '-' . $iEnd . '/1000', $this->header($a, 'content-range'));
        $this->assertSame((string)($iEnd - $iStart + 1), $this->header($a, 'content-length'));
        $this->assertSame(substr(self::$_aFiles['small.bin'], $iStart, $iEnd - $iStart + 1), $a['body']);
        $this->assertSame('public, must-revalidate, max-age=' . self::AGE, $this->header($a, 'cache-control'));
        $this->assertSame(self::etag(1000), $this->header($a, 'etag'));
        $this->assertTrue($aState['result']);
    }

    static public function providerForRange()
    {
        return [
            'first and last' => ['bytes=0-99', 0, 99],
            'open end' => ['bytes=900-', 900, 999],
            'whole file' => ['bytes=0-', 0, 999],
            'suffix' => ['bytes=-100', 900, 999],
            'suffix longer than the file' => ['bytes=-5000', 0, 999],
            'last after the end' => ['bytes=990-5000', 990, 999],
        ];
    }

    #[DataProvider('providerForUnsatisfiableRange')]
    public function testUnsatisfiableRange($sFile, $sRange)
    {
        [$a, $aState] = $this->fetch(['f' => $sFile, 'w' => 1, 'name' => $sFile], ['Range' => $sRange]);

        $this->assertSame(416, $a['status']);
        $this->assertSame('', $a['body']);
        $this->assertSame('bytes */' . strlen(self::$_aFiles[$sFile]), $this->header($a, 'content-range'));
        $this->assertNotCacheable($a);
        $this->assertNull($this->header($a, 'content-disposition'));
        $this->assertSame(416, $aState['result']);
        $this->assertSame(['open' => 0, 'read' => 0], $aState['calls']);
    }

    static public function providerForUnsatisfiableRange()
    {
        return [
            'several ranges' => ['small.bin', 'bytes=0-1,5-6'],
            'last before first' => ['small.bin', 'bytes=5-3'],
            'first at the end' => ['small.bin', 'bytes=1000-'],
            'empty suffix' => ['small.bin', 'bytes=-0'],
            'no positions' => ['small.bin', 'bytes=-'],
            'not a number' => ['small.bin', 'bytes=abc'],
            'three parts' => ['small.bin', 'bytes=1-2-3'],
            'empty file' => ['empty.bin', 'bytes=0-'],
        ];
    }

    public function testOtherRangeUnitIsIgnored()
    {
        [$a] = $this->fetch(['f' => 'small.bin'], ['Range' => 'items=0-1']);

        $this->assertSame(200, $a['status']);
        $this->assertSame(self::$_aFiles['small.bin'], $a['body']);
    }

    public function testRangeOfOtherMethodsIsIgnored()
    {
        [$a] = $this->fetch(['f' => 'small.bin'], ['Range' => 'bytes=0-9'], 'POST');

        $this->assertSame(200, $a['status']);
        $this->assertSame(self::$_aFiles['small.bin'], $a['body']);
    }

    public function testIfRange()
    {
        $aRange = ['Range' => 'bytes=0-9'];

        [$a] = $this->fetch(['f' => 'small.bin'], $aRange + ['If-Range' => self::etag(1000)]);
        $this->assertSame(206, $a['status']);

        [$a] = $this->fetch(['f' => 'small.bin'], $aRange + ['If-Range' => self::lastModified()]);
        $this->assertSame(206, $a['status']);

        // a changed file is sent whole
        foreach (['"other"', 'W/' . self::etag(1000), gmdate('D, d M Y H:i:s', self::MTIME - 1) . ' GMT'] as $sIfRange) {
            [$a] = $this->fetch(['f' => 'small.bin'], $aRange + ['If-Range' => $sIfRange]);
            $this->assertSame(200, $a['status'], $sIfRange);
            $this->assertSame(self::$_aFiles['small.bin'], $a['body'], $sIfRange);
        }
    }

    public function testHead()
    {
        foreach ([[], ['Range' => 'bytes=0-9']] as $aHeaders) {
            [$a, $aState] = $this->fetch(['f' => 'small.bin', 'w' => 1, 'name' => 'small.bin'], $aHeaders, 'HEAD');

            $this->assertSame(200, $a['status']);
            $this->assertSame('', $a['body']);
            $this->assertSame('1000', $this->header($a, 'content-length'));
            $this->assertSame('bytes 0-999/1000', $this->header($a, 'content-range'));
            $this->assertSame('public, must-revalidate, max-age=' . self::AGE, $this->header($a, 'cache-control'));
            $this->assertSame(self::etag(1000), $this->header($a, 'etag'));
            $this->assertSame('inline; filename="small.bin"', $this->header($a, 'content-disposition'));
            $this->assertSame(200, $aState['result']);
            $this->assertSame(['open' => 0, 'read' => 0], $aState['calls'], 'HEAD must not read the file.');
        }
    }

    public function testNotModifiedResponse()
    {
        $aCases = [
            ['GET', ['If-None-Match' => self::etag(1000)]],
            ['GET', ['If-None-Match' => 'W/' . self::etag(1000)]],
            ['GET', ['If-Modified-Since' => self::lastModified()]],
            ['GET', ['If-None-Match' => self::etag(1000), 'Range' => 'bytes=0-9']],
            ['HEAD', ['If-None-Match' => self::etag(1000)]],
        ];
        foreach ($aCases as [$sMethod, $aHeaders]) {
            $sCase = $sMethod . ' ' . json_encode($aHeaders);
            [$a, $aState] = $this->fetch(['f' => 'small.bin', 'w' => 1, 'immutable' => 1], $aHeaders, $sMethod);

            $this->assertSame(304, $a['status'], $sCase);
            $this->assertSame('', $a['body'], $sCase);
            $this->assertSame('public, must-revalidate, max-age=' . self::AGE . ', immutable', $this->header($a, 'cache-control'), $sCase);
            $this->assertNotNull($this->header($a, 'expires'), $sCase);
            $this->assertSame(self::etag(1000), $this->header($a, 'etag'), $sCase);
            $this->assertSame(self::lastModified(), $this->header($a, 'last-modified'), $sCase);
            $this->assertSame(304, $aState['result'], $sCase);
            $this->assertSame(['open' => 0, 'read' => 0], $aState['calls'], $sCase);
        }
    }

    public function testModified()
    {
        foreach ([['If-None-Match' => '"other"'], ['If-Modified-Since' => gmdate('D, d M Y H:i:s', self::MTIME - 1) . ' GMT']] as $aHeaders) {
            [$a] = $this->fetch(['f' => 'small.bin'], $aHeaders);

            $this->assertSame(200, $a['status'], json_encode($aHeaders));
            $this->assertSame(self::$_aFiles['small.bin'], $a['body'], json_encode($aHeaders));
        }
    }

    public function testMissingFileSendsNothing()
    {
        [$a, $aState] = $this->fetch(['f' => 'missing.bin']);

        $this->assertFalse($aState['result']);
        $this->assertSame('', $a['body']);
        foreach (['cache-control', 'expires', 'last-modified', 'etag', 'content-length', 'content-range'] as $sName)
            $this->assertNull($this->header($a, $sName), $sName);
    }

    private function assertNotCacheable(array $a)
    {
        $this->assertSame('no-store', $this->header($a, 'cache-control'));
        foreach (['expires', 'last-modified', 'etag'] as $sName)
            $this->assertNull($this->header($a, $sName), $sName);
    }

    private function fetch(array $aParams, array $aHeaders = [], string $sMethod = 'GET'): array
    {
        if (!self::$_oServer) {
            if (!function_exists('proc_open'))
                $this->markTestSkipped('proc_open is not available.');
            self::$_oServer = new BxDolTestPhpServer(self::$_sDir, self::$_sDir . '/router.php');
        }

        @unlink(self::$_sDir . '/state.json');

        $aParams += ['age' => self::AGE, 'privacy' => 'public', 'disposition' => 'inline'];
        $a = self::$_oServer->request($sMethod, '/?' . http_build_query($aParams), $aHeaders);

        $aState = json_decode((string)@file_get_contents(self::$_sDir . '/state.json'), true);
        $this->assertIsArray($aState, 'The script did not finish: ' . $a['status'] . ' ' . $a['body']);

        return [$a, $aState];
    }

    private function header(array $a, string $sName): ?string
    {
        return BxDolTestPhpServer::header($a, $sName);
    }

    private static function etag(int $iSize): string
    {
        return '"' . dechex(self::MTIME) . '-' . dechex($iSize) . '"';
    }

    private static function lastModified(): string
    {
        return gmdate('D, d M Y H:i:s', self::MTIME) . ' GMT';
    }
}
