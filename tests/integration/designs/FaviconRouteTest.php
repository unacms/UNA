<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * /favicon.ico (favicon.php): the favicon uploaded in Designer, else the default one.
 */
#[Group('integration')]
class FaviconRouteTest extends BxDolIntegrationTestCase
{
    private static $_oServer;

    private array $_aPrior = [];
    private array $_aFileIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['sys_site_icon', 'sys_site_icon_svg', 'sys_site_icon_dark'] as $sName) {
            $this->_aPrior[$sName] = getParam($sName);
            setParam($sName, '0');
        }
    }

    protected function tearDown(): void
    {
        foreach ($this->_aPrior as $sName => $sValue)
            setParam($sName, $sValue);

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_FILES);
        foreach ($this->_aFileIds as $iId)
            $oStorage->deleteFile($iId);

        parent::tearDown();
    }

    public static function tearDownAfterClass(): void
    {
        if (self::$_oServer) {
            self::$_oServer->stop();
            self::$_oServer = null;
        }
    }

    private function request(): array
    {
        if (!self::$_oServer) {
            if (!function_exists('proc_open'))
                $this->markTestSkipped('proc_open is not available.');

            $aUrl = parse_url(BX_DOL_URL_ROOT);
            self::$_oServer = new BxDolTestPhpServer(BX_DIRECTORY_PATH_ROOT, null, $aUrl['host'] . (empty($aUrl['port']) ? '' : ':' . $aUrl['port']));
        }

        return self::$_oServer->request('GET', '/favicon.php');
    }

    public function testDefaultIcon(): void
    {
        $a = $this->request();

        $this->assertSame(200, $a['status']);
        $this->assertSame('image/x-icon', BxDolTestPhpServer::header($a, 'content-type'));
        $this->assertSame('public, max-age=86400', BxDolTestPhpServer::header($a, 'cache-control'));
        $this->assertSame(file_get_contents(BX_DIRECTORY_PATH_ROOT . 'favicon.ico'), $a['body']);
    }

    public function testIconUploadedInDesigner(): void
    {
        if (!function_exists('imagecreatetruecolor'))
            $this->markTestSkipped('GD is not available.');

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_FILES);
        $sFile = BX_DIRECTORY_PATH_TMP . 'favicon_route_test_' . getmypid() . '.png';
        imagepng(imagecreatetruecolor(32, 32), $sFile);
        $iId = (int)$oStorage->storeFileFromPath($sFile, false, 0);
        @unlink($sFile);
        $this->assertGreaterThan(0, $iId, 'Storage error code ' . $oStorage->getErrorCode());
        $this->_aFileIds[] = $iId;
        $oStorage->afterUploadCleanup($iId, 0);

        setParam('sys_site_icon', (string)$iId);

        $a = $this->request();

        $this->assertSame(302, $a['status']);
        $this->assertSame($oStorage->getFileUrlById($iId), BxDolTestPhpServer::header($a, 'location'));
        $this->assertSame(['fav' => $oStorage->getFileUrlById($iId), 'svg' => '', 'dark' => ''], BxTemplFunctions::getUploadedFaviconUrls());
    }
}
