<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A picture in an album, as the API gives it (BxAlbumsModule::getDataMediaAPI, the album page's
 * media list): its meta is that picture's date and author, read from its own row, not those of the
 * album whose id happens to equal the picture's id, and building it raises no warnings.
 *
 * The test makes its own albums and picture and removes them, so it runs on any site with Albums
 * installed. The picture is the test admin's, the other album a profile's that isn't the admin's
 * (the test user is not on every site).
 */
#[Group('integration')]
class AlbumsMediaApiMetaTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aAlbumIds = [];
    protected $_aFileIds = [];
    protected $_iProfileId = 0;
    protected $_iOtherProfileId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_albums'))
            $this->markTestSkipped('Albums is not installed.');

        // Members act as their current profile (a person), not the account's own system profile.
        $this->_iProfileId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id());
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');
        $this->_iOtherProfileId = (int)BxDolDb::getInstance()->getOne("SELECT MAX(`id`) + 1 FROM `sys_profiles`");

        $this->bxLoginAsAdmin();

        // The meta menu reads bx_is_api() when it is made; menus are kept per request.
        $this->_aGetBackup = $_GET;
        $_GET['api'] = 1;
        unset($GLOBALS['bxDolClasses']['BxDolMenu!bx_albums_snippet_meta']);
    }

    protected function tearDown(): void
    {
        $oStorage = BxDolStorage::getObjectInstance('bx_albums_files');
        foreach ($this->_aFileIds as $iFileId)
            if ($oStorage && $oStorage->getFile($iFileId))
                $oStorage->deleteFile($iFileId, 0);

        $oDb = BxDolDb::getInstance();
        foreach ($this->_aAlbumIds as $iAlbumId) {
            $oDb->query("DELETE FROM `bx_albums_files2albums` WHERE `content_id` = :id", ['id' => $iAlbumId]);
            $oDb->query("DELETE FROM `bx_albums_albums` WHERE `id` = :id", ['id' => $iAlbumId]);
        }

        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxDolMenu!bx_albums_snippet_meta']);

        parent::tearDown();
    }

    protected function insertAlbum(int $iAuthor, int $iAdded, int $iId = 0): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_albums_albums` SET " . ($iId ? "`id` = " . $iId . ", " : "") . "`author` = :author, `added` = :added, `changed` = :added, `thumb` = 0, `title` = 'AlbumsMediaApiMetaTest album', `text` = '', `labels` = '', `location` = ''", [
            'author' => $iAuthor,
            'added' => $iAdded,
        ]);

        $iAlbumId = $iId ?: (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iAlbumId, 'The fixture album was not created.');
        $this->_aAlbumIds[] = $iAlbumId;

        return $iAlbumId;
    }

    protected function albumExists(int $iId): bool
    {
        // Not getContentInfoById: it keeps rows for the request, the fixture of an earlier test among them.
        return (bool)BxDolDb::getInstance()->getOne("SELECT 1 FROM `bx_albums_albums` WHERE `id` = :id", ['id' => $iId]);
    }

    /**
     * A 1x1 PNG in the album, by the test admin.
     * @return array the media row as the album's media list has it
     */
    protected function insertPicture(int $iAlbumId): array
    {
        // Written as is, so the test doesn't need GD.
        $sFile = BX_DIRECTORY_PATH_TMP . 'albums-media-api-meta-test-' . uniqid() . '.png';
        file_put_contents($sFile, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='));

        $iFileId = (int)BxDolStorage::getObjectInstance('bx_albums_files')->storeFileFromPath($sFile, false, $this->_iProfileId, $iAlbumId);
        if (file_exists($sFile))
            unlink($sFile);

        $this->assertGreaterThan(0, $iFileId, 'The fixture picture was not stored.');
        $this->_aFileIds[] = $iFileId;

        $oModule = BxDolModule::getInstance('bx_albums');
        $this->assertNotEmpty($oModule->_oDb->associateFileWithContent($iAlbumId, $iFileId, $this->_iProfileId, 'AlbumsMediaApiMetaTest picture', '1x1'), 'The fixture picture is not in the album.');
        $iMediaId = (int)$oModule->_oDb->lastId();

        // Albums and their media count ids apart, so they often share one: move the picture to an id no album has.
        $oDb = BxDolDb::getInstance();
        $iFreeId = 1000 + (int)$oDb->getOne("SELECT GREATEST((SELECT IFNULL(MAX(`id`), 0) FROM `bx_albums_albums`), (SELECT IFNULL(MAX(`id`), 0) FROM `bx_albums_files2albums`))");
        $oDb->query("UPDATE `bx_albums_files2albums` SET `id` = :new WHERE `id` = :id", ['new' => $iFreeId, 'id' => $iMediaId]);
        $iMediaId = $iFreeId;

        $aMedia = $oModule->_oDb->getMediaInfoById($iMediaId);
        $this->assertNotEmpty($aMedia);

        return $aMedia;
    }

    /**
     * Runs the call and returns its result with the warnings and notices it raised.
     */
    protected function withWarnings(callable $fCall): array
    {
        $aWarnings = [];
        set_error_handler(function ($iErrno, $sError, $sFile, $iLine) use (&$aWarnings) {
            $aWarnings[] = $sError . ' in ' . basename($sFile) . ':' . $iLine;
            return true;
        }, E_WARNING | E_NOTICE | E_USER_WARNING | E_USER_NOTICE);

        try {
            $mixedResult = $fCall();
        }
        finally {
            restore_error_handler();
        }

        return [$mixedResult, $aWarnings];
    }

    protected function metaItems(array $aUnit): array
    {
        $this->assertArrayHasKey('meta', $aUnit);

        $aItems = [];
        foreach ($aUnit['meta']['items'] as $aItem)
            $aItems[$aItem['name']] = $aItem;

        return $aItems;
    }

    public function testPictureMetaIsThePictures(): void
    {
        $iAlbumAdded = time() - 86400 * 30;
        $iAlbumId = $this->insertAlbum($this->_iProfileId, $iAlbumAdded);
        $aMedia = $this->insertPicture($iAlbumId);
        $this->assertNotEquals($iAlbumAdded, (int)$aMedia['added']);

        // Someone else's album with the picture's id: what the meta used to show.
        $iMediaId = (int)$aMedia['id'];
        $this->assertFalse($this->albumExists($iMediaId));
        $this->insertAlbum($this->_iOtherProfileId, time() - 86400 * 365, $iMediaId);

        list($aUnit, $aWarnings) = $this->withWarnings(function () use ($aMedia) {
            return BxDolModule::getInstance('bx_albums')->getDataMediaAPI($aMedia, ['extended' => true]);
        });

        $this->assertSame([], $aWarnings);
        $this->assertSame((int)$aMedia['added'], (int)$aUnit['added']);
        $this->assertSame('', $aUnit['text'], 'A picture has no text.');

        $aItems = $this->metaItems($aUnit);
        $this->assertSame(['date', 'author'], array_keys($aItems), 'The items the app shows (active_api), in their order.');
        $this->assertSame((int)$aMedia['added'], (int)$aItems['date']['title'], "The picture's date, not the other album's.");
        $this->assertSame($this->_iProfileId, (int)$aItems['author']['data']['id'], "The picture's author, not the other album's.");
    }

    public function testPictureWithoutAnAlbumOfItsIdRaisesNoWarnings(): void
    {
        $iAlbumId = $this->insertAlbum($this->_iProfileId, time());
        $aMedia = $this->insertPicture($iAlbumId);
        $this->assertFalse($this->albumExists((int)$aMedia['id']));

        // A media row without the file's date, as a caller other than the media browse may pass it.
        unset($aMedia['added']);

        list($aUnit, $aWarnings) = $this->withWarnings(function () use ($aMedia) {
            return BxDolModule::getInstance('bx_albums')->getDataMediaAPI($aMedia);
        });

        $this->assertSame([], $aWarnings);
        $this->assertGreaterThan(0, (int)$aUnit['added'], "The file's date.");
        $this->assertSame($this->_iProfileId, (int)$this->metaItems($aUnit)['author']['data']['id']);
    }

    public function testMetaOfAnUnknownAlbumHasNoItems(): void
    {
        $iMissing = (int)BxDolDb::getInstance()->getOne("SELECT IFNULL(MAX(`id`), 0) + 1000 FROM `bx_albums_albums`");

        list($aMeta, $aWarnings) = $this->withWarnings(function () use ($iMissing) {
            $oMenu = BxDolMenu::getObjectInstance('bx_albums_snippet_meta');
            $oMenu->setContentId($iMissing);

            return $oMenu->getCodeAPI();
        });

        $this->assertSame([], $aWarnings);
        $this->assertSame('bx_albums_snippet_meta', $aMeta['object'], 'The menu keeps its shape.');
        $this->assertSame([], $aMeta['items']);
    }

    public function testAlbumUnitReadsTheSizeOfItsPicture(): void
    {
        $iAlbumId = $this->insertAlbum($this->_iProfileId, time());
        $this->insertPicture($iAlbumId);
        $aAlbum = BxDolModule::getInstance('bx_albums')->_oDb->getContentInfoById($iAlbumId);

        list($aUnit, $aWarnings) = $this->withWarnings(function () use ($aAlbum) {
            return BxDolModule::getInstance('bx_albums')->decodeDataAPI($aAlbum);
        });

        $this->assertSame([], $aWarnings);
        $this->assertEquals(1, $aUnit['image']['width']);
        $this->assertEquals(1, $aUnit['image']['height']);
    }
}
