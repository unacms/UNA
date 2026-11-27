<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Media Manager (bx_media): the recent files its uploader offers and how one of them gets into another
 * uploader's storage, and the POST rule of its actions.
 *
 * - Recent files are the member's own files that no content uses yet; a file id names a file only
 *   together with its storage.
 * - A recent file of another storage is copied; a file of the same storage is used as it is, so a
 *   single file field doesn't delete it before it is copied.
 * - A copy for an existing content belongs to that content: the uploader shows the content's files.
 * - UpdateContent and CopyFile change data only for a POST.
 *
 * The test makes its own files in local system storages and removes them.
 */
#[Group('integration')]
class MediaManagerTest extends BxDolIntegrationTestCase
{
    public const STORAGE = 'sys_images';
    public const STORAGE_OTHER = 'sys_images_editor';

    protected $_oModule;
    protected $_iProfileId = 0;
    protected $_aFiles = [];
    protected $_aServerBackup;
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_media'))
            $this->markTestSkipped('Media Manager is not installed.');

        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');

        foreach ([self::STORAGE, self::STORAGE_OTHER] as $sStorage)
            if (!BxDolStorage::getObjectInstance($sStorage))
                $this->markTestSkipped('Storage ' . $sStorage . ' is not installed.');

        $this->_oModule = BxDolModule::getInstance('bx_media');
        $this->_iProfileId = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id());
        $this->assertGreaterThan(0, $this->_iProfileId, 'The test admin has no profile.');

        $this->_aServerBackup = $_SERVER;
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        foreach ($this->_aFiles as $aFile) {
            $oStorage = BxDolStorage::getObjectInstance($aFile[0]);
            if ($oStorage && $oStorage->getFile($aFile[1]))
                $oStorage->deleteFile($aFile[1], 0);
        }

        $_SERVER = $this->_aServerBackup ?? $_SERVER;
        $_GET = $this->_aGetBackup ?? [];

        parent::tearDown();
    }

    public function testRecentFilesAreTheMembersUnusedFiles(): void
    {
        $iUnused = $this->storeImage(self::STORAGE);
        $iUsed = $this->storeImage(self::STORAGE, 123456789);

        $aRecent = $this->_oModule->_oDb->getRecentGhosts($this->_iProfileId, 1000);
        $aKeys = array_map(function ($a) { return $a['object'] . ':' . $a['id']; }, $aRecent);

        $this->assertContains(self::STORAGE . ':' . $iUnused, $aKeys);
        $this->assertNotContains(self::STORAGE . ':' . $iUsed, $aKeys, 'A file a content uses is not a recent file.');

        $this->assertNotEmpty($this->_oModule->_oDb->getGhostOfProfile($iUnused, self::STORAGE, $this->_iProfileId));
        $this->assertEmpty($this->_oModule->_oDb->getGhostOfProfile($iUnused, self::STORAGE_OTHER, $this->_iProfileId), 'A file id names a file only with its storage.');
        $this->assertEmpty($this->_oModule->_oDb->getGhostOfProfile($iUnused, self::STORAGE, $this->_iProfileId + 1000000), 'Another member\'s file is not offered.');
        $this->assertEmpty($this->_oModule->_oDb->getGhostOfProfile($iUsed, self::STORAGE, $this->_iProfileId), 'A file a content uses is not offered.');

        $this->assertCount(1, $this->_oModule->_oDb->getRecentGhosts($this->_iProfileId, 1), 'The list has a limit.');
    }

    public function testFileOfAnotherStorageIsCopiedForTheContent(): void
    {
        $iSource = $this->storeImage(self::STORAGE_OTHER);
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);

        $iCopy = $this->copyRecentFile($oStorage, $iSource, self::STORAGE_OTHER, 987654321);
        $this->_aFiles[] = [self::STORAGE, $iCopy];

        $this->assertGreaterThan(0, $iCopy);
        $this->assertNotEmpty($oStorage->getFile($iCopy), 'The copy is in the uploader\'s storage.');
        $this->assertSame(987654321, (int)$oStorage->getGhost($iCopy)['content_id'], 'The copy belongs to the content.');
        $this->assertNotEmpty(BxDolStorage::getObjectInstance(self::STORAGE_OTHER)->getFile($iSource), 'The source stays.');
    }

    public function testFileOfTheSameStorageIsUsedAsItIs(): void
    {
        $iSource = $this->storeImage(self::STORAGE);
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        $iFilesBefore = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_storage_ghosts` WHERE `object` = :object", ['object' => self::STORAGE]);

        $iCopy = $this->copyRecentFile($oStorage, $iSource, self::STORAGE, 0);

        $this->assertSame($iSource, $iCopy);
        $this->assertSame($iFilesBefore, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_storage_ghosts` WHERE `object` = :object", ['object' => self::STORAGE]), 'No copy is made.');
    }

    public function testAnotherMembersFileIsNotCopied(): void
    {
        $iSource = $this->storeImage(self::STORAGE_OTHER);
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        $oUploader = BxDolUploader::getObjectInstance('sys_html5', self::STORAGE, 'mmtest');

        $oMethod = new ReflectionMethod($this->_oModule, '_copyRecentFile');
        $iCopy = $oMethod->invoke($this->_oModule, $oStorage, $oUploader, $iSource, self::STORAGE_OTHER, $this->_iProfileId + 1000000, false, 0);

        $this->assertSame(0, $iCopy);
        $this->assertNotSame('', $oUploader->getUploadErrorMessages());
    }

    public function testActionsChangeDataOnlyForPost(): void
    {
        $this->bxLoginAsAdmin();

        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_GET = ['module' => 'bx_persons', 'field' => 'picture', 'content_id' => 1, 'file_id' => 1];

        ob_start();
        $this->_oModule->actionUpdateContent();
        $sAnswer = ob_get_clean();

        $this->assertSame(['code' => 1], json_decode($sAnswer, true));

        $_GET = ['FileId' => 1, 'SourceStorage' => self::STORAGE, 'StorageObject' => self::STORAGE, 'UploaderObject' => 'sys_html5', 'UniqId' => 'mmtest', 'UploaderInstanceName' => 'oTest'];
        ob_start();
        $this->_oModule->actionCopyFile();
        $this->assertSame('', ob_get_clean(), 'CopyFile does nothing for a GET.');
    }

    public function testEditorCaptionsAreTranslated(): void
    {
        foreach ($this->_oModule->_oConfig->getEditorTranslations() as $sKey)
            $this->assertNotSame($sKey, _t($sKey), $sKey . ' has no English string.');
    }

    protected function copyRecentFile($oStorage, $iFileId, $sSourceStorage, $iContentId)
    {
        $oUploader = BxDolUploader::getObjectInstance('sys_html5', $oStorage->getObject(), 'mmtest');
        $oMethod = new ReflectionMethod($this->_oModule, '_copyRecentFile');
        return $oMethod->invoke($this->_oModule, $oStorage, $oUploader, $iFileId, $sSourceStorage, $this->_iProfileId, false, $iContentId);
    }

    protected function storeImage($sStorage, $iContentId = 0)
    {
        $sPath = tempnam(sys_get_temp_dir(), 'mmtest') . '.png';
        $oImage = imagecreatetruecolor(8, 8);
        imagepng($oImage, $sPath);

        $oStorage = BxDolStorage::getObjectInstance($sStorage);
        $iId = (int)$oStorage->storeFileFromPath($sPath, false, $this->_iProfileId, $iContentId);
        @unlink($sPath);

        if (!$iId)
            $this->fail('Cannot store a test file: ' . $oStorage->getErrorString());
        $this->_aFiles[] = [$sStorage, $iId];

        return $iId;
    }
}
