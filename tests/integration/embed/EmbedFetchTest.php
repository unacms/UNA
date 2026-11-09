<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A link which is not stored yet is fetched from its site, and its pictures are stored, for a signed in
 * profile only and only under a limit. A guest gets the link and its domain and nothing is stored. Stored
 * data is still served to guests, and data which expired goes away with its pictures.
 *
 * The embed provider is a stub which makes no request and stores one generated picture per link, and the
 * test removes the rows and pictures it makes and the limit counters, so it runs on any installed site.
 */
#[Group('integration')]
class EmbedFetchTest extends BxDolIntegrationTestCase
{
    protected $_sMark;
    protected $_oEmbed;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sMark = 'embedfetchtest' . uniqid();
        $this->_oEmbed = $this->getEmbed();
        $this->resetCounters();

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($oDb->getAll("SELECT * FROM `sys_embeded_data` WHERE `url` LIKE :mark", ['mark' => '%' . $this->_sMark . '%']) as $aRow)
            $this->_oEmbed->deleteLocalWithFiles($aRow);

        $this->resetCounters();
        $oDb->cleanMemoryAll();

        parent::tearDown();
    }

    protected function getEmbed(): BxTemplEmbedSystem
    {
        $aObject = BxDolEmbedQuery::getObject('sys_system');
        $this->assertIsArray($aObject);

        return new class($aObject, null) extends BxTemplEmbedSystem {
            public $iCalls = 0;
            public $bImage = true;

            public function getDataFromApi($sUrl, $sTheme)
            {
                $this->iCalls++;

                $a = ['url' => $sUrl, 'domain' => parse_url($sUrl, PHP_URL_HOST), 'title' => 'Title'];
                if ($this->bImage) {
                    $sTmp = tempnam(sys_get_temp_dir(), 'bxembed');
                    $sPath = $sTmp . '.jpg';
                    try {
                        $r = imagecreatetruecolor(8, 8);
                        imagejpeg($r, $sPath, 80);
                        imagedestroy($r);

                        $a['image_id'] = (int)BxDolStorage::getObjectInstance($this->_sStorage)->storeFileFromPath($sPath, false, 0);
                    }
                    finally {
                        @unlink($sPath);
                        @unlink($sTmp);
                    }
                }

                return json_encode($a);
            }
        };
    }

    protected function resetCounters(): void
    {
        $oCache = BxDolDb::getInstance()->getDbCacheObject();
        $oCache->delData($this->bxCallProtected($this->_oEmbed, '_getFetchCacheKey', 'ip', bx_get_ip_hash(getVisitorIP())));

        foreach (['admin', 'user'] as $sKind) {
            $oAccount = BxDolAccount::getInstance($this->bxTestEmail($sKind));
            if ($oAccount && ($oProfile = BxDolProfile::getInstanceByAccount($oAccount->id())))
                $oCache->delData($this->bxCallProtected($this->_oEmbed, '_getFetchCacheKey', 'profile', (string)(int)$oProfile->id()));
        }
    }

    protected function url(int $i): string
    {
        return 'https://example.com/?' . $this->_sMark . '=' . $i;
    }

    protected function countRows(): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `sys_embeded_data` WHERE `url` LIKE :mark", ['mark' => '%' . $this->_sMark . '%']);
    }

    public function testGuestStoresNothing(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $a = $this->_oEmbed->getData($this->url($i), '');

            $this->assertSame($this->url($i), $a['url']);
            $this->assertSame('example.com', $a['domain']);
        }

        $this->assertSame(0, $this->_oEmbed->iCalls, 'A guest makes no request.');
        $this->assertSame(0, $this->countRows(), 'And stores no row.');
        $this->assertSame(BxDolEmbed::FETCH_REFUSED_GUEST, $this->_oEmbed->getFetchRefused());
    }

    public function testGuestLinkHtmlStoresNothing(): void
    {
        $sHtml = $this->_oEmbed->getLinkHTML($this->url(1));

        $this->assertStringContainsString('example.com', $sHtml);
        $this->assertSame(0, $this->_oEmbed->iCalls);
        $this->assertSame(0, $this->countRows());
    }

    public function testSignedInFetchesOnceAndGuestGetsTheStoredData(): void
    {
        $this->bxLoginAsUser();

        $a = $this->_oEmbed->getData($this->url(1), '');
        $this->assertSame('Title', $a['title']);
        $this->assertSame(1, $this->_oEmbed->iCalls);
        $this->assertSame(1, $this->countRows());
        $this->assertNotEmpty($a['image_id']);
        $this->assertNotFalse(BxDolStorage::getObjectInstance('sys_images')->getFile($a['image_id']));

        $a = $this->_oEmbed->getData($this->url(1), '');
        $this->assertSame(1, $this->_oEmbed->iCalls, 'The stored link is not fetched again.');

        $this->bxBecomeGuest();
        $a = $this->_oEmbed->getData($this->url(1), '');
        $this->assertSame('Title', $a['title'], 'A guest gets what is stored.');
        $this->assertSame(1, $this->_oEmbed->iCalls);
        $this->assertSame(1, $this->countRows());
    }

    public function testFetchesAreLimitedPerProfile(): void
    {
        $this->bxLoginAsUser();
        $this->_oEmbed->bImage = false;

        $iLimit = min(BxDolEmbed::FETCH_LIMIT_PROFILE, BxDolEmbed::FETCH_LIMIT_IP);
        for ($i = 1; $i <= $iLimit; $i++) {
            $this->_oEmbed->getData($this->url($i), '');
            $this->assertSame('', $this->_oEmbed->getFetchRefused());
        }
        $this->assertSame($iLimit, $this->_oEmbed->iCalls);
        $this->assertTrue($this->_oEmbed->isFetchLimited());

        $a = $this->_oEmbed->getData($this->url($iLimit + 1), '');
        $this->assertSame(BxDolEmbed::FETCH_REFUSED_LIMIT, $this->_oEmbed->getFetchRefused());
        $this->assertSame($this->url($iLimit + 1), $a['url']);
        $this->assertSame($iLimit, $this->_oEmbed->iCalls);
        $this->assertSame($iLimit, $this->countRows());

        // A link which is stored is not limited.
        $this->_oEmbed->getData($this->url(1), '');
        $this->assertSame('', $this->_oEmbed->getFetchRefused());
        $this->assertSame($iLimit, $this->_oEmbed->iCalls);
    }

    public function testLongLinkIsNotFetchedNorStored(): void
    {
        $this->bxLoginAsUser();

        $sUrl = 'https://example.com/' . $this->_sMark . '/' . str_repeat('a', BxDolEmbed::URL_MAX_LENGTH);
        $a = $this->_oEmbed->getData($sUrl, '');

        $this->assertSame($sUrl, $a['url']);
        $this->assertSame(0, $this->_oEmbed->iCalls);
        $this->assertSame(0, $this->countRows());
    }

    public function testExpiredDataGoesAwayWithItsPictures(): void
    {
        if (!(int)getParam('sys_embed_lifetime'))
            $this->markTestSkipped('The embed lifetime is not tracked.');

        $this->bxLoginAsUser();
        $a = $this->_oEmbed->getData($this->url(1), '');
        $iImage = (int)$a['image_id'];
        $this->assertNotFalse(BxDolStorage::getObjectInstance('sys_images')->getFile($iImage));

        $iOld = time() - 86400 * ((int)getParam('sys_embed_lifetime') + 1);
        BxDolDb::getInstance()->query("UPDATE `sys_embeded_data` SET `added` = :added WHERE `url` = :url", ['added' => $iOld, 'url' => $this->url(1)]);

        // A guest cannot fetch a new copy, so the old one stays.
        $this->bxBecomeGuest();
        $a = $this->_oEmbed->getData($this->url(1), '');
        $this->assertSame('Title', $a['title']);
        $this->assertSame(1, $this->countRows());
        $this->assertSame(1, $this->_oEmbed->iCalls);

        $this->assertGreaterThanOrEqual(1, $this->_oEmbed->pruneExpired());
        $this->assertSame(0, $this->countRows());
        $this->assertFalse(BxDolStorage::getObjectInstance('sys_images')->getFile($iImage), 'The picture is deleted with its link.');
    }

    public function testSignedInRefetchDeletesThePictureOfTheExpiredCopy(): void
    {
        if (!(int)getParam('sys_embed_lifetime'))
            $this->markTestSkipped('The embed lifetime is not tracked.');

        $this->bxLoginAsUser();
        $iImage = (int)$this->_oEmbed->getData($this->url(1), '')['image_id'];

        BxDolDb::getInstance()->query("UPDATE `sys_embeded_data` SET `added` = :added WHERE `url` = :url", [
            'added' => time() - 86400 * ((int)getParam('sys_embed_lifetime') + 1),
            'url' => $this->url(1)
        ]);

        $a = $this->_oEmbed->getData($this->url(1), '');
        $this->assertSame(2, $this->_oEmbed->iCalls);
        $this->assertNotSame($iImage, (int)$a['image_id']);
        $this->assertFalse(BxDolStorage::getObjectInstance('sys_images')->getFile($iImage), 'No picture is left behind.');
        $this->assertSame(1, $this->countRows());
    }
}
