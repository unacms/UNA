<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Storage lookups the API repeats: a file row is read once inside a file rows scope
 * (bx_api_get_image opens one), an extension's mime type, icon and font icon once per
 * request, and an image with id 0 reads no file row at all.
 */
#[Group('integration')]
class StorageQueryMemoTest extends BxDolIntegrationTestCase
{
    private const EXT = 'phpunitmemo';
    private const MISSING_ID = 2147483000;

    protected $_iFileId = 0;
    protected $_sTmpFile = '';

    protected function tearDown(): void
    {
        if ($this->_iFileId)
            BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->deleteFile($this->_iFileId, 0);
        if ($this->_sTmpFile && file_exists($this->_sTmpFile))
            unlink($this->_sTmpFile);

        BxDolDb::getInstance()->query("DELETE FROM `sys_storage_mime_types` WHERE `ext` = :ext", ['ext' => self::EXT]);
        BxDolDb::getInstance()->cleanMemoryAll();
        parent::tearDown();
    }

    /**
     * A small image stored in sys_images, deleted in tearDown.
     */
    protected function storeImage(): int
    {
        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');

        $this->_sTmpFile = BX_DIRECTORY_PATH_TMP . 'storage-query-memo-test-' . uniqid() . '.png';
        imagepng(imagecreatetruecolor(16, 10), $this->_sTmpFile);

        $this->_iFileId = (int)BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->storeFileFromPath($this->_sTmpFile, false, 0);
        $this->assertGreaterThan(0, $this->_iFileId, 'The fixture image was not stored.');

        return $this->_iFileId;
    }

    protected function scope()
    {
        return (new ReflectionProperty(BxDolStorageQuery::class, '_aFileRowsScope'))->getValue();
    }

    protected function storageQuery(): BxDolStorageQuery
    {
        $aObject = BxDolStorageQuery::getStorageObject('sys_images');
        if (empty($aObject))
            $this->markTestSkipped('The sys_images storage is not installed.');

        return new BxDolStorageQuery($aObject);
    }

    /**
     * Run the callback and return the SQL statements it made.
     */
    protected function record(callable $fCallback): array
    {
        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql); }
            public function __call($sName, $aArgs) { return null; }
        };

        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fCallback();
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        return $oRecorder->aQueries;
    }

    protected function filesQueries(array $aQueries): int
    {
        return count(array_filter($aQueries, fn($s) => stripos($s, 'FROM `sys_images`') !== false));
    }

    public function testFileRowsAreReadOnceInAScope(): void
    {
        $oQuery = $this->storageQuery();

        $aOutside = $this->record(function () use ($oQuery) {
            $oQuery->getFileById(self::MISSING_ID);
            $oQuery->getFileById(self::MISSING_ID);
        });
        $this->assertSame(2, $this->filesQueries($aOutside), 'Outside a scope a row is read every time.');

        $aScope = BxDolStorageQuery::openFileRowsScope();
        try {
            $aInside = $this->record(function () use ($oQuery) {
                $this->assertEmpty($oQuery->getFileById(self::MISSING_ID));
                $this->assertEmpty($oQuery->getFileById(self::MISSING_ID), 'A missing file is remembered as missing.');

                // A nested scope starts empty and gives the outer one back.
                $aNested = BxDolStorageQuery::openFileRowsScope();
                $oQuery->getFileById(self::MISSING_ID);
                BxDolStorageQuery::closeFileRowsScope($aNested);
                $oQuery->getFileById(self::MISSING_ID);
            });
        }
        finally {
            BxDolStorageQuery::closeFileRowsScope($aScope);
        }
        $this->assertSame(2, $this->filesQueries($aInside), 'Once in the scope, once in the nested one.');

        $aAfter = $this->record(fn() => $oQuery->getFileById(self::MISSING_ID));
        $this->assertSame(1, $this->filesQueries($aAfter), 'After the scope rows are read again.');
    }

    public function testApiImageReadsItsRowOnce(): void
    {
        $this->storageQuery();
        $iId = $this->storeImage();

        $mixedImage = null;
        $aQueries = $this->record(function () use ($iId, &$mixedImage) {
            $mixedImage = bx_api_get_image(BX_DOL_STORAGE_OBJ_IMAGES, $iId);
        });

        $this->assertIsArray($mixedImage);
        $this->assertNotEmpty($mixedImage['src']);
        $this->assertSame(1, $this->filesQueries($aQueries), 'The url, the info and the local path share one read.');
        $this->assertNull($this->scope(), 'The scope is closed again.');
    }

    public function testRowChangedInAScopeIsReadAgain(): void
    {
        $oQuery = $this->storageQuery();
        $iId = $this->storeImage();

        $aScope = BxDolStorageQuery::openFileRowsScope();
        try {
            $this->assertNotSame('phpunit-memo.png', $oQuery->getFileById($iId)['file_name']);

            $oQuery->modifyCustomField($iId, 'file_name', 'phpunit-memo.png', false);
            $this->assertSame('phpunit-memo.png', $oQuery->getFileById($iId)['file_name'], 'BxDolStorage::getFile writes rows it reads.');
        }
        finally {
            BxDolStorageQuery::closeFileRowsScope($aScope);
        }
    }

    public function testApiImageWithIdZeroReadsNoFile(): void
    {
        $this->storageQuery();

        $mixedImage = null;
        $aQueries = $this->record(function () use (&$mixedImage) {
            $mixedImage = bx_api_get_image('sys_images', 0);
        });

        $this->assertFalse($mixedImage);
        $this->assertSame(0, $this->filesQueries($aQueries));
    }

    public function testMimeTypeIsReadOncePerExtension(): void
    {
        $oQuery = $this->storageQuery();
        $oQuery->cleanMemoryAll();

        $aExpected = $oQuery->getRow("SELECT `mime_type`, `icon`, `icon_font` FROM `sys_storage_mime_types` WHERE `ext` = 'jpg'");
        if (empty($aExpected))
            $this->markTestSkipped('The jpg mime type is not installed.');

        $aValues = [];
        $aQueries = $this->record(function () use ($oQuery, &$aValues) {
            $aValues = [$oQuery->getMimeTypeByExt('jpg'), $oQuery->getIconByExt('jpg'), $oQuery->getIconFontByExt('jpg'), $oQuery->getMimeTypeByExt('jpg')];
        });

        $this->assertSame([$aExpected['mime_type'], $aExpected['icon'], $aExpected['icon_font'], $aExpected['mime_type']], $aValues);
        $this->assertCount(1, array_filter($aQueries, fn($s) => stripos($s, 'sys_storage_mime_types') !== false));
    }

    public function testAddedMimeTypeIsSeenAtOnce(): void
    {
        $oQuery = $this->storageQuery();

        $this->assertFalse($oQuery->getMimeTypeByExt(self::EXT), 'An unknown extension has no mime type.');

        $oQuery->addMimeType('application/x-phpunit-memo', self::EXT, 'icon-phpunit', 'font-phpunit');

        $this->assertSame('application/x-phpunit-memo', $oQuery->getMimeTypeByExt(self::EXT));
        $this->assertSame('icon-phpunit', $oQuery->getIconByExt(self::EXT));
        $this->assertSame('font-phpunit', $oQuery->getIconFontByExt(self::EXT));
    }
}
