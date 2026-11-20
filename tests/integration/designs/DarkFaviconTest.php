<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The dark mode favicon uploaded in Designer (sys_site_icon_dark): the head script swaps it in on dark browser tabs,
 * on the site and in Studio, over the uploaded favicon or the default one.
 */
#[Group('integration')]
class DarkFaviconTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['sys_site_icon', 'sys_site_icon_svg', 'sys_site_icon_dark'];

    private array $_aPrior = [];
    private array $_aFileIds = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::OPTIONS as $sName) {
            $this->_aPrior[$sName] = getParam($sName);
            setParam($sName, '0');
        }
    }

    protected function tearDown(): void
    {
        foreach ($this->_aPrior as $sName => $sValue)
            setParam($sName, $sValue);

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        foreach ($this->_aFileIds as $iId)
            $oStorage->deleteFile($iId);

        parent::tearDown();
    }

    private function storeSvg(string $sColor): int
    {
        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        $sFile = BX_DIRECTORY_PATH_TMP . 'dark_favicon_test_' . getmypid() . '_' . count($this->_aFileIds) . '.svg';
        file_put_contents($sFile, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="' . $sColor . '"/></svg>');
        $iId = (int)$oStorage->storeFileFromPath($sFile, false, 0);
        @unlink($sFile);
        $this->assertGreaterThan(0, $iId, 'Storage error code ' . $oStorage->getErrorCode());
        $this->_aFileIds[] = $iId;
        $oStorage->afterUploadCleanup($iId, 0);

        return $iId;
    }

    private function url(int $iId): string
    {
        return BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES)->getFileUrlById($iId);
    }

    private function heads(): array
    {
        return [
            'site' => BxDolTemplate::getInstance()->parseSystemKey('meta_icons', null, false),
            'studio' => BxDolStudioTemplate::getInstance()->parseSystemKey('meta_icons', null, false),
        ];
    }

    public function testUploadedLightAndDark(): void
    {
        $iLight = $this->storeSvg('#111111');
        $iDark = $this->storeSvg('#eeeeee');
        setParam('sys_site_icon_svg', (string)$iLight);
        setParam('sys_site_icon_dark', (string)$iDark);

        foreach ($this->heads() as $sWhere => $sHtml) {
            $sLink = 'href="' . $this->url($iLight) . '" data-bx-icon-light="' . $this->url($iLight) . '" data-bx-icon-dark="' . $this->url($iDark) . '"';
            $this->assertStringContainsString($sLink, $sHtml, $sWhere);
            $this->assertStringContainsString("matchMedia('(prefers-color-scheme: dark)')", $sHtml, $sWhere);
        }
    }

    public function testUploadedDarkOverTheDefault(): void
    {
        $iDark = $this->storeSvg('#eeeeee');
        setParam('sys_site_icon_dark', (string)$iDark);

        foreach ($this->heads() as $sWhere => $sHtml) {
            $this->assertMatchesRegularExpression('#href="[^"]*/template/images/icons/favicon\.svg" data-bx-icon-light="[^"]*/favicon\.svg" data-bx-icon-dark="' . preg_quote($this->url($iDark), '#') . '"#', $sHtml, $sWhere);
            $this->assertStringNotContainsString('favicon-dark.svg', $sHtml, $sWhere);
        }
    }

    /**
     * The apps (NEO) draw their browser tabs from the page's `icons`: Designer's uploads, '' for each one not uploaded.
     */
    public function testPageApiCarriesTheUploads(): void
    {
        $this->assertSame(['fav' => '', 'svg' => '', 'dark' => ''], BxDolPage::getObjectInstanceByURI('about')->getPageAPI()['icons']);

        $iLight = $this->storeSvg('#111111');
        $iDark = $this->storeSvg('#eeeeee');
        setParam('sys_site_icon_svg', (string)$iLight);
        setParam('sys_site_icon_dark', (string)$iDark);

        $this->assertSame(['fav' => '', 'svg' => $this->url($iLight), 'dark' => $this->url($iDark)], BxDolPage::getObjectInstanceByURI('about')->getPageAPI()['icons']);
    }

    public function testUploadedLightWithoutDarkIsNotSwapped(): void
    {
        $iLight = $this->storeSvg('#111111');
        setParam('sys_site_icon_svg', (string)$iLight);

        foreach ($this->heads() as $sWhere => $sHtml) {
            $this->assertStringContainsString('<link rel="icon" href="' . $this->url($iLight) . '" type="image/svg+xml" />', $sHtml, $sWhere);
            $this->assertStringNotContainsString('data-bx-icon-dark', $sHtml, $sWhere);
        }

        $this->assertSame(['fav' => '', 'svg' => $this->url($iLight), 'dark' => ''], BxTemplFunctions::getUploadedFaviconUrls());
    }
}
