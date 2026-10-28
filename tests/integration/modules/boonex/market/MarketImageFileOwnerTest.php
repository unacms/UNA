<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Market Icon and Header Image take only the member's own files (or the product's current images),
 * and replacing an image never deletes someone else's file.
 *
 * The member is the test user, the other member is the test admin. The test makes its own
 * product and photos and removes them, so it runs on any site with Market installed.
 */
#[Group('integration')]
class MarketImageFileOwnerTest extends BxDolIntegrationTestCase
{
    protected $_iContentId = 0;
    protected $_aFileIds = [];
    protected $_iUserProfileId = 0;
    protected $_iAdminProfileId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_market'))
            $this->markTestSkipped('Market is not installed.');

        $this->_iAdminProfileId = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $this->_iUserProfileId = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('user')->id())->id();

        $this->bxLoginAsUser();

        $oDb = BxDolDb::getInstance();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_market_products` SET `author` = :author, `added` = :now, `changed` = :now, `thumb` = 0, `cover` = 0, `cover_raw` = '', `name` = :name, `title` = 'MarketImageFileOwnerTest product', `text` = '', `notes` = '', `notes_purchased` = '', `cat` = 0, `labels` = '', `location` = ''", [
            'author' => $this->_iUserProfileId,
            'now' => $iNow,
            'name' => 'market-image-file-owner-test-' . uniqid(),
        ]);
        $this->_iContentId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $this->_iContentId, 'The fixture product was not created.');
    }

    protected function tearDown(): void
    {
        if ($this->_iContentId)
            BxDolDb::getInstance()->query("DELETE FROM `bx_market_products` WHERE `id` = :id", ['id' => $this->_iContentId]);

        $oStorage = BxDolStorage::getObjectInstance('bx_market_photos');
        foreach ($this->_aFileIds as $iFileId)
            if ($oStorage && $oStorage->getFile($iFileId))
                $oStorage->deleteFile($iFileId, 0);

        parent::tearDown();
    }

    /**
     * The module as the logged in member sees it: BxDolModule keeps one instance per request.
     */
    protected function module(): BxMarketModule
    {
        $oModule = BxDolModule::getInstance('bx_market');
        (new ReflectionProperty(BxBaseModGeneralModule::class, '_iProfileId'))->setValue($oModule, bx_get_logged_profile_id());

        return $oModule;
    }

    protected function storePhoto(int $iProfileId): int
    {
        // A 1x1 PNG written as is, so the test doesn't need GD.
        $sFile = BX_DIRECTORY_PATH_TMP . 'market-image-file-owner-test-' . uniqid() . '.png';
        file_put_contents($sFile, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='));

        $iFileId = (int)BxDolStorage::getObjectInstance('bx_market_photos')->storeFileFromPath($sFile, false, $iProfileId);
        if (file_exists($sFile))
            unlink($sFile);

        $this->assertGreaterThan(0, $iFileId, 'The fixture photo was not stored.');
        $this->_aFileIds[] = $iFileId;

        return $iFileId;
    }

    protected function setImages(int $iThumb, int $iCover = 0): void
    {
        BxDolDb::getInstance()->query("UPDATE `bx_market_products` SET `thumb` = :thumb, `cover` = :cover WHERE `id` = :id", [
            'thumb' => $iThumb,
            'cover' => $iCover,
            'id' => $this->_iContentId,
        ]);
    }

    protected function contentInfo(): array
    {
        return $this->module()->_oDb->getContentInfoById($this->_iContentId);
    }

    protected function photoExists(int $iFileId): bool
    {
        return !empty(BxDolStorage::getObjectInstance('bx_market_photos')->getFile($iFileId));
    }

    public function testOnlyOwnFilesOrCurrentImagesAreAllowed(): void
    {
        $iOwn = $this->storePhoto($this->_iUserProfileId);
        $iForeign = $this->storePhoto($this->_iAdminProfileId);
        $iForeignAttached = $this->storePhoto($this->_iAdminProfileId);
        $this->setImages(0, $iForeignAttached);

        $oModule = $this->module();
        $aContentInfo = $this->contentInfo();

        $this->assertTrue($oModule->isImageFileAllowed(0, $aContentInfo), 'An empty value clears the image.');
        $this->assertTrue($oModule->isImageFileAllowed($iOwn, $aContentInfo));
        $this->assertFalse($oModule->isImageFileAllowed($iForeign, $aContentInfo), "Another member's photo is rejected.");
        $this->assertFalse($oModule->isImageFileAllowed($iForeign), "Another member's photo is rejected for a new product.");
        $this->assertTrue($oModule->isImageFileAllowed($iForeignAttached, $aContentInfo), "The product's current image stays allowed.");
        $this->assertFalse($oModule->isImageFileOwner($iForeignAttached, $aContentInfo), "The product's current image may still be someone else's file.");
        $this->assertFalse($oModule->isImageFileAllowed(PHP_INT_MAX, $aContentInfo), 'A missing file is rejected.');
    }

    public function testUpdateImageRejectsForeignFile(): void
    {
        $iForeign = $this->storePhoto($this->_iAdminProfileId);

        $this->assertFalse($this->module()->serviceUpdateImage('thumb', $this->_iContentId, $iForeign));
        $this->assertSame(0, (int)$this->contentInfo()['thumb']);
    }

    public function testReplacingOwnImageDeletesTheOldFile(): void
    {
        $iOld = $this->storePhoto($this->_iUserProfileId);
        $iNew = $this->storePhoto($this->_iUserProfileId);
        $this->setImages($iOld);

        $this->assertNotFalse($this->module()->serviceUpdateImage('thumb', $this->_iContentId, $iNew));
        $this->assertSame($iNew, (int)$this->contentInfo()['thumb']);
        $this->assertFalse($this->photoExists($iOld), 'The replaced own photo is deleted.');
    }

    public function testReplacingImageKeepsFileSharedWithTheOtherImage(): void
    {
        $iShared = $this->storePhoto($this->_iUserProfileId);
        $iNew = $this->storePhoto($this->_iUserProfileId);
        $this->setImages($iShared, $iShared);

        $this->assertNotFalse($this->module()->serviceUpdateImage('thumb', $this->_iContentId, $iNew));
        $this->assertTrue($this->photoExists($iShared), 'Header Image still uses the photo.');
    }

    public function testReplacingForeignImageKeepsTheFile(): void
    {
        $iForeign = $this->storePhoto($this->_iAdminProfileId);
        $iOwn = $this->storePhoto($this->_iUserProfileId);
        $this->setImages($iForeign);

        $this->assertNotFalse($this->module()->serviceUpdateImage('thumb', $this->_iContentId, $iOwn));
        $this->assertSame($iOwn, (int)$this->contentInfo()['thumb']);
        $this->assertTrue($this->photoExists($iForeign), "Another member's photo is never deleted.");
    }

    public function testFormSaveResetsForeignImage(): void
    {
        $iOwnOld = $this->storePhoto($this->_iUserProfileId);
        $iOwnNew = $this->storePhoto($this->_iUserProfileId);
        $iForeign = $this->storePhoto($this->_iAdminProfileId);
        $this->setImages($iOwnOld, $iOwnOld);
        $aContentInfoOld = $this->contentInfo();

        // What the base form writes from the request: Icon with another member's photo, Header Image with an own one.
        $this->setImages($iForeign, $iOwnNew);
        $this->module()->resetNotAllowedImages($this->_iContentId, $aContentInfoOld);

        $aContentInfo = $this->contentInfo();
        $this->assertSame($iOwnOld, (int)$aContentInfo['thumb'], 'Icon keeps its previous value.');
        $this->assertSame($iOwnNew, (int)$aContentInfo['cover'], 'An own photo is saved.');

        // A new product has no previous value.
        $this->setImages($iForeign);
        $this->module()->resetNotAllowedImages($this->_iContentId);
        $this->assertSame(0, (int)$this->contentInfo()['thumb']);
    }
}
