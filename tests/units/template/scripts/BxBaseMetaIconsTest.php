<?php

/**
 * Favicon tags in the page head. Browser tabs follow the browser/OS colour scheme, so the default favicon has a
 * dark variant that the head script swaps in. Studio shows the site's icons, uploaded in Designer or the default.
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

    public function testStudioShowsTheSiteIcons(): void
    {
        $sSite = $this->withDefaultIcons(fn() => BxDolTemplate::getInstance()->parseSystemKey('meta_icons', null, false));
        $sStudio = $this->withDefaultIcons(fn() => BxDolStudioTemplate::getInstance()->parseSystemKey('meta_icons', null, false));

        $this->assertStringContainsString('template/images/icons/favicon-dark.svg', $sStudio, 'Studio switches to the white icon on dark tabs too.');
        $this->assertSame($sSite, $sStudio, 'Studio and the site carry the same icons, the ones uploaded in Designer included.');
        $this->assertFileDoesNotExist(BX_DIRECTORY_PATH_ROOT . 'studio/template/images/icons/favicon.svg', 'Studio has no favicon of its own.');
    }

    /**
     * Page shells without __meta_info__ carry the icons themselves, else the browser asks for /favicon.ico.
     */
    public function testPageShellsCarryTheIcons(): void
    {
        foreach (['template/page_2.html', 'template/page_22.html', 'template/_header.html', 'studio/template/_header.html'] as $sFile)
            $this->assertStringContainsString('__meta_info__', file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile), $sFile);

        foreach (['template/page_44.html', 'template/page_150.html', 'studio/template/page_2.html', 'studio/template/page_150.html'] as $sFile)
            $this->assertStringContainsString('__meta_icons__', file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile), $sFile);

        // Without a database: the default icon, with the same light/dark switch.
        foreach (['install/templates/_page.php' => '../template/images/icons/', 'index.php' => 'template/images/icons/'] as $sFile => $sPath) {
            $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile);
            $this->assertStringContainsString('<link rel="icon" href="' . $sPath . 'favicon.svg" type="image/svg+xml" data-bx-icon-light="' . $sPath . 'favicon.svg" data-bx-icon-dark="' . $sPath . 'favicon-dark.svg" />', $s, $sFile);
            $this->assertStringContainsString("matchMedia('(prefers-color-scheme: dark)')", $s, $sFile);
        }
    }

    /**
     * favicon.ico is the default glyph on a transparent background, like NEO's: no white square on a dark tab.
     */
    public function testFaviconIcoIsTransparent(): void
    {
        $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'favicon.ico');
        $aHeader = unpack('vreserved/vtype/vcount', substr($s, 0, 6));
        $this->assertSame(1, $aHeader['type']);

        for ($i = 0; $i < $aHeader['count']; ++$i) {
            $a = unpack('Cw/Ch/Cc/Cr/vplanes/vbpp/Vsize/Voffset', substr($s, 6 + 16 * $i, 16));
            $r = imagecreatefromstring(substr($s, $a['offset'], $a['size']));
            $this->assertNotFalse($r, 'Icon ' . $a['w'] . ' is a PNG.');
            foreach ([[0, 0], [$a['w'] - 1, 0], [0, $a['h'] - 1], [$a['w'] - 1, $a['h'] - 1]] as [$x, $y])
                $this->assertSame(127, (imagecolorat($r, $x, $y) >> 24) & 127, 'Icon ' . $a['w'] . ': a transparent corner.');
        }

        $this->assertStringContainsString('RewriteRule ^favicon\.ico$  favicon.php [L]', file_get_contents(BX_DIRECTORY_PATH_ROOT . '.htaccess'));
        $this->assertMatchesRegularExpression('#location = /favicon\.ico \{\s*rewrite \^ /favicon\.php last;#', file_get_contents(BX_DIRECTORY_PATH_ROOT . 'scripts/docker-compose/nginx.conf'));
    }
}
