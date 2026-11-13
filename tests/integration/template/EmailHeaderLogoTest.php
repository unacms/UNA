<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The email header shows the logo uploaded in Designer ({site_logo}): an <img> for a PNG, JPEG or GIF,
 * the site title as text otherwise, because email clients block SVG.
 */
#[Group('integration')]
class EmailHeaderLogoTest extends BxDolIntegrationTestCase
{
    protected $_sLogoBackup;
    protected $_aFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sLogoBackup = getParam('sys_site_logo');
    }

    protected function tearDown(): void
    {
        setParam('sys_site_logo', $this->_sLogoBackup);

        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        foreach ($this->_aFiles as $iId)
            $oStorage->deleteFile($iId, 0);

        parent::tearDown();
    }

    protected function useLogo(string $sExt, string $sData): int
    {
        $sPath = BX_DIRECTORY_PATH_TMP . 'email-logo-test-' . genRndPwd(8, false) . '.' . $sExt;
        file_put_contents($sPath, $sData);

        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        $iId = (int)@$oStorage->storeFileFromPath($sPath, false, 0);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iId, 'The test logo is stored.');
        $oStorage->afterUploadCleanup($iId, 0);
        $this->_aFiles[] = $iId;

        setParam('sys_site_logo', $iId);
        if ((int)BxDolDesigns::getInstance()->getSiteLogo() !== $iId)
            $this->markTestSkipped('The template has a logo of its own.');

        return $iId;
    }

    protected function png(): string
    {
        $r = imagecreatetruecolor(120, 40);
        ob_start();
        imagepng($r);
        return ob_get_clean();
    }

    protected function title(): string
    {
        return htmlspecialchars(trim(html_entity_decode(getParam('site_title'), ENT_QUOTES | ENT_HTML5, 'UTF-8')), ENT_QUOTES, 'UTF-8');
    }

    public function testRasterLogoIsAnImage(): void
    {
        $iId = $this->useLogo('png', $this->png());
        $sUrl = BxDolDesigns::getInstance()->getSiteLogoUrl($iId);

        $sHtml = BxTemplFunctions::getInstance()->getEmailLogo();
        $this->assertStringContainsString('<img src="' . bx_html_attribute($sUrl) . '"', $sHtml);
        $this->assertStringContainsString('height="40"', $sHtml);
    }

    public function testSvgLogoFallsBackToTheTitle(): void
    {
        $this->useLogo('svg', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40"/></svg>');

        $sHtml = BxTemplFunctions::getInstance()->getEmailLogo();
        $this->assertStringNotContainsString('<img', $sHtml);
        $this->assertSame($this->title(), $sHtml);
    }

    public function testNoLogoShowsTheTitle(): void
    {
        setParam('sys_site_logo', 0);
        if (BxDolDesigns::getInstance()->getSiteLogo())
            $this->markTestSkipped('The template has a logo of its own.');

        $this->assertSame($this->title(), BxTemplFunctions::getInstance()->getEmailLogo());
    }

    public function testHeaderMarkerIsReplaced(): void
    {
        setParam('sys_site_logo', 0);
        if (BxDolDesigns::getInstance()->getSiteLogo())
            $this->markTestSkipped('The template has a logo of its own.');

        $sHtml = BxDolEmailTemplates::getInstance()->parseContent('<div>{site_logo}</div>', []);
        $this->assertSame('<div>' . $this->title() . '</div>', $sHtml);
    }
}
