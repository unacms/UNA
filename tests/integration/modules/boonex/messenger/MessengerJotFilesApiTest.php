<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Messages in the apps (get_convo_messages): images come in `files`, which the apps show as pictures, and every
 * other file (zip, pdf ...) in `attachments` with its name, type, size and link, so a message with only a zip is
 * not an empty bubble.
 */
#[Group('integration')]
class MessengerJotFilesApiTest extends BxDolIntegrationTestCase
{
    protected int $iLotId = 0;
    protected array $aFileIds = [];
    protected array $aTmpFiles = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger'))
            $this->markTestSkipped('Messenger is not installed.');
    }

    protected function tearDown(): void
    {
        $oModule = $this->bxModule();
        $oStorage = BxDolStorage::getObjectInstance($oModule->_oConfig->CNF['OBJECT_STORAGE']);
        foreach ($this->aFileIds as $iFileId)
            $oStorage->deleteFile($iFileId);
        if ($this->iLotId)
            $oModule->_oDb->deleteLot($this->iLotId);
        foreach ($this->aTmpFiles as $sFile)
            @unlink($sFile);

        parent::tearDown();
    }

    public function testNonImageFilesAreAttachments(): void
    {
        $this->bxLoginAsUser();
        $iProfileId = (int)bx_get_logged_profile_id();
        if (!$iProfileId)
            $this->markTestSkipped('The test member has no profile.');

        $oModule = $this->bxModule();
        $CNF = &$oModule->_oConfig->CNF;

        $this->iLotId = (int)$oModule->_oDb->createNewLot($iProfileId, ['title' => 'Files test', 'type' => BX_IM_TYPE_PRIVATE], [$iProfileId]);
        $this->assertGreaterThan(0, $this->iLotId);
        $iJotId = (int)$oModule->_oDb->addJot($this->iLotId, '', $iProfileId);
        $this->assertGreaterThan(0, $iJotId);

        $iZip = $this->bxStoreFile($iJotId, 'report.zip', 'PK' . str_repeat('x', 1200), $iProfileId);

        $rImage = imagecreatetruecolor(4, 4);
        ob_start();
        imagepng($rImage);
        $iPng = $this->bxStoreFile($iJotId, 'photo.png', ob_get_clean(), $iProfileId);

        $aLot = $oModule->_oDb->getLotInfoById($this->iLotId);
        // A new services object: the one BxDolService keeps reads the viewer once, maybe another test's.
        bx_import('Services', $oModule->_aModule);
        $aResult = (new BxMessengerServices())->serviceGetConvoMessages(json_encode([
            'lot' => $aLot[$CNF['FIELD_HASH']],
            'jot' => $iJotId,
            'load' => 'ids',
        ]));

        $this->assertSame(0, $aResult['code'] ?? null, 'The member reads the talk.');
        $this->assertCount(1, $aResult['jots']);
        $aJot = $aResult['jots'][0];

        $this->assertCount(1, $aJot['files'], 'Only the image is in the pictures.');
        $this->assertCount(1, $aJot['attachments'], 'The zip is an attachment.');

        $aAttachment = $aJot['attachments'][0];
        $this->assertSame($iZip, $aAttachment['id']);
        $this->assertSame('report.zip', $aAttachment['name']);
        $this->assertSame(1202, $aAttachment['size']);
        $this->assertNotEmpty($aAttachment['mime_type']);
        $this->assertNotEmpty($aAttachment['url'], 'The attachment has a link to open.');
        $this->assertNotSame($iPng, $aAttachment['id']);
    }

    protected function bxModule(): BxMessengerModule
    {
        return BxDolModule::getInstance('bx_messenger');
    }

    protected function bxStoreFile(int $iJotId, string $sName, string $sContent, int $iProfileId): int
    {
        $oModule = $this->bxModule();
        $CNF = &$oModule->_oConfig->CNF;

        $sDir = BX_DIRECTORY_PATH_TMP . 'msg_files_test_' . uniqid();
        @mkdir($sDir);
        $sPath = $sDir . '/' . $sName;
        file_put_contents($sPath, $sContent);
        $this->aTmpFiles[] = $sPath;

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $iFileId = (int)$oStorage->storeFileFromPath($sPath, false, $iProfileId, $iJotId);
        $this->assertGreaterThan(0, $iFileId, 'Stored ' . $sName . ': ' . $oStorage->getErrorString());
        $this->aFileIds[] = $iFileId;

        $oStorage->afterUploadCleanup($iFileId, $iProfileId);
        $oModule->_oDb->updateFiles($iFileId, [$CNF['FIELD_ST_JOT'] => $iJotId]);

        return $iFileId;
    }
}
