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
    protected $_sLogoDarkBackup;
    protected $_aFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sLogoBackup = getParam('sys_site_logo');
        $this->_sLogoDarkBackup = getParam('sys_site_logo_dark');
    }

    protected function tearDown(): void
    {
        setParam('sys_site_logo', $this->_sLogoBackup);
        setParam('sys_site_logo_dark', $this->_sLogoDarkBackup);

        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        foreach ($this->_aFiles as $iId)
            $oStorage->deleteFile($iId, 0);

        parent::tearDown();
    }

    /**
     * Store a logo the way Designer does (a private file) and make it the site's (dark) logo.
     */
    protected function useLogo(string $sExt, string $sData, string $sOption = 'sys_site_logo'): int
    {
        $sPath = BX_DIRECTORY_PATH_TMP . 'email-logo-test-' . genRndPwd(8, false) . '.' . $sExt;
        file_put_contents($sPath, $sData);

        $oStorage = BxDolStorage::getObjectInstance('sys_images_custom');
        $iId = (int)@$oStorage->storeFileFromPath($sPath, true, 0);
        @unlink($sPath);
        $this->assertGreaterThan(0, $iId, 'The test logo is stored.');
        $oStorage->afterUploadCleanup($iId, 0);
        $this->_aFiles[] = $iId;

        setParam($sOption, $iId);
        $oDesigns = BxDolDesigns::getInstance();
        if ((int)($sOption == 'sys_site_logo' ? $oDesigns->getSiteLogo() : $oDesigns->getSiteLogoDark()) !== $iId)
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

    public function testRasterLogoIsAnImageThatLasts(): void
    {
        setParam('sys_site_logo_dark', 0);
        $iId = $this->useLogo('png', $this->png());
        $this->assertTrue(BxDolStorage::getObjectInstance('sys_images_custom')->isFilePrivate($iId), 'Designer keeps the original private.');

        $sUrl = BxDolDesigns::getInstance()->getSiteLogoUrlScaled($iId, 80);
        $this->assertStringContainsString('image_transcoder.php', $sUrl);
        $this->assertDoesNotMatchRegularExpression('/[?&]t=/', $sUrl, 'No token that expires.');
        $this->assertStringContainsString('y=80', $sUrl, 'Twice the height it is shown at.');
        $this->assertStringNotContainsString(BxDolDesigns::getInstance()->getSiteLogoUrl($iId), BxTemplFunctions::getInstance()->getEmailLogo(), 'Not the private original.');

        $sHtml = BxTemplFunctions::getInstance()->getEmailLogo();
        $this->assertStringContainsString('<img class="bx-email-logo-light" src="' . bx_html_attribute($sUrl) . '"', $sHtml);
        $this->assertStringContainsString('height="40"', $sHtml);
        $this->assertStringNotContainsString('bx-email-logo-dark', $sHtml, 'No dark logo, no second image.');
    }

    public function testDarkLogoComesHidden(): void
    {
        $this->useLogo('png', $this->png());
        $iDark = $this->useLogo('png', $this->png(), 'sys_site_logo_dark');
        $sUrlDark = BxDolDesigns::getInstance()->getSiteLogoUrlScaled($iDark, 80);

        $sHtml = BxTemplFunctions::getInstance()->getEmailLogo();
        $this->assertStringContainsString('bx-email-logo-light', $sHtml);
        $this->assertMatchesRegularExpression('#<img class="bx-email-logo-dark" src="' . preg_quote(bx_html_attribute($sUrlDark), '#') . '"[^>]*style="display: none;[^"]*mso-hide: all;"#', $sHtml);
    }

    public function testDefaultHeaderSwitchesLogosInDarkMode(): void
    {
        // The install SQL when it is there (CI removes install/ before these tests), otherwise the installed site's header.
        $sSqlFile = BX_DIRECTORY_PATH_ROOT . 'install/sql/system.sql';
        if (is_file($sSqlFile)) {
            $this->assertSame(1, preg_match("#'site_email_html_template_header', '[^']*', '((?:[^'\\\\]|\\\\.)*)'#", file_get_contents($sSqlFile), $a));
            $sHeader = stripcslashes($a[1]);
        }
        else
            $sHeader = (string)getParam('site_email_html_template_header');

        $this->assertStringContainsString('<meta name="color-scheme" content="light dark">', $sHeader);
        $this->assertStringContainsString('@media (prefers-color-scheme: dark)', $sHeader);
        $this->assertStringContainsString('.bx-email-logo-light { display:none !important; }', $sHeader);
        $this->assertStringContainsString('.bx-email-logo-dark { display:block !important;', $sHeader);
        $this->assertStringContainsString('{site_logo}', $sHeader);
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
