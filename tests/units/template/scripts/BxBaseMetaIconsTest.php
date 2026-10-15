<?php

/**
 * Favicon tags in the page head. Browser tabs follow the browser/OS colour scheme, so the default favicon has a
 * dark variant that the head script swaps in; Studio's favicon is a coloured plate and has none.
 */
class BxBaseMetaIconsTest extends BxDolTestCase
{
    private function withOptions(array $aOptions, callable $fTest)
    {
        $aPrior = [];
        foreach ($aOptions as $sName => $sValue) {
            $aPrior[$sName] = getParam($sName);
            setParam($sName, $sValue);
        }

        try {
            return $fTest();
        }
        finally {
            foreach ($aPrior as $sName => $sValue)
                setParam($sName, $sValue);
        }
    }

    private function withDefaultIcons(callable $fTest)
    {
        return $this->withOptions(['sys_site_icon' => '0', 'sys_site_icon_svg' => '0'], $fTest);
    }

    public function testDefaultFaviconSwitchesWithTheBrowserScheme(): void
    {
        $sHtml = $this->withDefaultIcons(fn() => BxTemplFunctions::getInstance()->getMetaIcons());

        $this->assertMatchesRegularExpression('/<link rel="icon" href="[^"]*\/favicon\.svg" sizes="any" data-bx-icon-light="[^"]*\/favicon\.svg" data-bx-icon-dark="[^"]*\/favicon-dark\.svg" \/>/', $sHtml);
        $this->assertMatchesRegularExpression('/<link rel="icon" href="[^"]*\/favicon\.svg" type="image\/svg\+xml" data-bx-icon-light="[^"]*" data-bx-icon-dark="[^"]*\/favicon-dark\.svg" \/>/', $sHtml);
        $this->assertStringContainsString("matchMedia('(prefers-color-scheme: dark)')", $sHtml);
        $this->assertStringContainsString('<link rel="apple-touch-icon" href="', $sHtml);
    }

    public function testDefaultFaviconFilesAreDarkAndLightInk(): void
    {
        $sDir = BX_DIRECTORY_PATH_ROOT . 'template/images/icons/';

        $sLight = file_get_contents($sDir . 'favicon.svg');
        $this->assertStringContainsString('g{fill:#18181B}', $sLight, 'Dark ink on light tabs.');
        $this->assertStringContainsString('@media (prefers-color-scheme:dark){g{fill:#fff}}', $sLight, 'Browsers that read the SVG\'s own media query switch without the script.');

        $sDark = file_get_contents($sDir . 'favicon-dark.svg');
        $this->assertStringContainsString('<g fill="#fff">', $sDark, 'White ink on dark tabs, with no media query left for the browser to ignore.');
        $this->assertStringNotContainsString('@media', $sDark);
    }

    public function testStudioKeepsItsOwnFaviconInDarkMode(): void
    {
        $sHtml = $this->withDefaultIcons(fn() => BxTemplStudioFunctions::getInstance()->getMetaIcons());

        $this->assertStringContainsString('studio/template/images/icons/favicon.svg', $sHtml);
        $this->assertStringNotContainsString('data-bx-icon-dark', $sHtml);
        $this->assertStringNotContainsString('favicon-dark.svg', $sHtml);
    }
}
