<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The web app behind an API request (bx_api_get_client_url): its Origin, when the site lets that origin call its API,
 * so a sign-up's confirmation and a password reset link back to the app the member signed up in. And the site's own
 * logo the apps draw (BxBaseApiV2System::logos, sent with every page as `logo`).
 */
#[Group('integration')]
class ApiClientUrlTest extends BxDolIntegrationTestCase
{
    protected $_aServerBackup;
    protected $_aGetBackup;
    protected $_iOriginId = 0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aServerBackup = $_SERVER;
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        if ($this->_iOriginId)
            BxDolDb::getInstance()->query("DELETE FROM `sys_api_origins` WHERE `id` = :id", ['id' => $this->_iOriginId]);
        $_SERVER = $this->_aServerBackup;
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function bxAllowOrigin(string $sOrigin): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_api_origins` (`url`, `order`) VALUES (:url, 0)", ['url' => $sOrigin]);
        $this->_iOriginId = (int)$oDb->lastId();
    }

    public function testAllowedWebAppOrigin(): void
    {
        $this->bxAllowOrigin('https://app.client-url.test');
        $_GET['api'] = 1;
        $_SERVER['HTTP_ORIGIN'] = 'https://app.client-url.test';

        $this->assertSame('https://app.client-url.test/', bx_api_get_client_url());
    }

    public function testNotForTheSiteUnknownOriginsOrNativeApps(): void
    {
        $this->bxAllowOrigin('https://app.client-url.test');
        $_SERVER['HTTP_ORIGIN'] = 'https://app.client-url.test';
        unset($_GET['api']);
        if (!defined('BX_API'))
            $this->assertFalse(bx_api_get_client_url(), 'A request to the site itself keeps the site\'s links.');

        $_GET['api'] = 1;
        foreach (['https://other.client-url.test', 'neo://app', 'https://app.client-url.test/path', ''] as $sOrigin) {
            $_SERVER['HTTP_ORIGIN'] = $sOrigin;
            $this->assertFalse(bx_api_get_client_url(), $sOrigin);
        }
    }

    public function testLogosForTheApps(): void
    {
        $a = BxBaseApiV2System::logos();
        $this->assertSame(['mark', 'mark_dark', 'logo', 'logo_dark', 'logo_aspect', 'logo_dark_aspect'], array_keys($a));
        foreach (['mark', 'mark_dark', 'logo', 'logo_dark'] as $sKey)
            $this->assertTrue($a[$sKey] === null || is_string($a[$sKey]), $sKey);
    }
}
