<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * File manager actions (move, bookmark, delete, new folder, upload into a folder) check
 * every file they are given, not only the first one, keep a move inside one context, and
 * take a POST with a CSRF token. The test makes its own rows and removes them.
 */
#[Group('integration')]
class FilesActionAccessTest extends BxDolIntegrationTestCase
{
    protected $_oModule = null;
    protected $_iUser = 0;
    protected $_iOther = 0;
    protected $_aIds = [];
    protected $_iProfileIdBackup = 0;
    protected $_sMethodBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_files'))
            $this->markTestSkipped('Files is not installed.');

        $this->_iOther = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('admin')->id(), false);

        $this->bxLoginAsUser();
        $this->_iUser = (int)bx_get_logged_profile_id();
        if ($this->_iUser <= 0 || $this->_iOther <= 0 || $this->_iUser == $this->_iOther)
            $this->markTestSkipped('The test accounts have no profiles.');

        $this->_oModule = BxDolModule::getInstance('bx_files');
        $this->_iProfileIdBackup = $this->_oModule->setProfileId($this->_iUser);

        $this->_sMethodBackup = $_SERVER['REQUEST_METHOD'] ?? null;
    }

    protected function tearDown(): void
    {
        if ($this->_aIds)
            BxDolDb::getInstance()->query("DELETE FROM `bx_files_main` WHERE `id` IN (" . implode(',', array_map('intval', $this->_aIds)) . ")");
        $this->_aIds = [];

        if ($this->_oModule)
            $this->_oModule->setProfileId($this->_iProfileIdBackup);

        if ($this->_sMethodBackup === null)
            unset($_SERVER['REQUEST_METHOD']);
        else
            $_SERVER['REQUEST_METHOD'] = $this->_sMethodBackup;

        parent::tearDown();
    }

    public function testActionIdsAreDistinctPositiveIntegers()
    {
        $this->assertSame([7], $this->_oModule->getActionContentIds(7, ['1', '2']));
        $this->assertSame([3, 5], $this->_oModule->getActionContentIds(0, ['3', '3', '0', '-4', 'x', '5', ['6']]));
        $this->assertSame([], $this->_oModule->getActionContentIds(0, '1,2'));
        $this->assertSame([], $this->_oModule->getActionContentIds(0, []));
    }

    public function testMoveNeedsAccessToEveryFile()
    {
        $iOwn = $this->bxFile($this->_iUser, 'file');
        $iForeign = $this->bxFile($this->_iOther, 'file');

        $this->assertTrue($this->_oModule->isAllowedMove($this->bxInfo($iOwn)));
        $this->assertFalse($this->_oModule->isAllowedMove($this->bxInfo($iForeign)), 'A member may not move another member\'s personal file.');

        $this->assertSame($this->_iUser, $this->_oModule->getFileContext($this->bxInfo($iOwn)));
        $this->assertSame($this->_iOther, $this->_oModule->getFileContext($this->bxInfo($iForeign)));
    }

    public function testFilesGoOnlyIntoOwnFoldersOfTheSameContext()
    {
        $iOwnFolder = $this->bxFile($this->_iUser, 'folder');
        $iForeignFolder = $this->bxFile($this->_iOther, 'folder');
        $iOwnFile = $this->bxFile($this->_iUser, 'file');

        $this->assertTrue($this->_oModule->isAllowedFolderInContext(0, 0));
        $this->assertTrue($this->_oModule->isAllowedFolderInContext($iOwnFolder, 0));
        $this->assertFalse($this->_oModule->isAllowedFolderInContext($iForeignFolder, 0), 'Another member\'s folder');
        $this->assertFalse($this->_oModule->isAllowedFolderInContext($iOwnFile, 0), 'A file is not a folder');
        $this->assertFalse($this->_oModule->isAllowedFolderInContext($iOwnFolder, $this->_iOther), 'A folder of another context');
    }

    public function testFolderPathStopsAtALoop()
    {
        $iA = $this->bxFile($this->_iUser, 'folder');
        $iB = $this->bxFile($this->_iUser, 'folder');
        $oDb = BxDolDb::getInstance();
        $oDb->query("UPDATE `bx_files_main` SET `parent_folder_id` = :b WHERE `id` = :a", ['a' => $iA, 'b' => $iB]);
        $oDb->query("UPDATE `bx_files_main` SET `parent_folder_id` = :a WHERE `id` = :b", ['a' => $iA, 'b' => $iB]);
        $this->_oModule->_oDb->cleanMemoryAll();

        $aPath = $this->_oModule->_oDb->getFolderPath($iA);
        $this->assertSame([$iB, $iA], array_map('intval', array_column($aPath, 'folder')));
    }

    public function testFolderMovesInAContextTakeTurns()
    {
        $this->assertTrue($this->_oModule->_oDb->lockFolderMoves($this->_iUser));
        $this->_oModule->_oDb->unlockFolderMoves($this->_iUser);
        $this->assertTrue($this->_oModule->_oDb->lockFolderMoves($this->_iUser), 'The lock is released after a move.');
        $this->_oModule->_oDb->unlockFolderMoves($this->_iUser);
    }

    public function testChangesNeedPostWithCsrfToken()
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_POST = ['csrf_token' => (string)BxDolForm::getCsrfToken()];
        $this->assertFalse($this->bxCallProtected($this->_oModule, 'isActionRequestValid'));

        $_SERVER['REQUEST_METHOD'] = 'POST';
        $this->assertTrue($this->bxCallProtected($this->_oModule, 'isActionRequestValid'));

        if (getParam('sys_security_form_token_enable') == 'on') {
            $_POST = ['csrf_token' => 'not-a-token'];
            $this->assertFalse($this->bxCallProtected($this->_oModule, 'isActionRequestValid'));

            $_POST = [];
            $this->assertFalse($this->bxCallProtected($this->_oModule, 'isActionRequestValid'));
        }
    }

    protected function bxFile($iAuthor, $sType)
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_files_main` (`author`, `added`, `changed`, `file_id`, `title`, `cat`, `desc`, `data`, `labels`, `location`, `allow_view_to`, `type`) VALUES (:author, :time, :time, 0, :title, 0, '', '', '', '', '3', :type)", [
            'author' => (int)$iAuthor,
            'time' => time(),
            'title' => 'FilesActionAccessTest ' . uniqid(),
            'type' => $sType,
        ]);

        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aIds[] = $iId;

        return $iId;
    }

    protected function bxInfo($iId)
    {
        $aInfo = $this->_oModule->_oDb->getContentInfoById($iId);
        $this->assertIsArray($aInfo);

        return $aInfo;
    }
}
