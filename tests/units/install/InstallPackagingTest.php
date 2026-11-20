<?php

/**
 * What a clone or a release package ships for modules' PHP libraries, ffmpeg, and the web root.
 */
class InstallPackagingTest extends \PHPUnit\Framework\TestCase
{
    private static function root(): string
    {
        return realpath(__DIR__ . '/../../..') . '/';
    }

    private static function composer(): array
    {
        return json_decode(file_get_contents(self::root() . 'composer.json'), true);
    }

    /**
     * Nothing installs a module's own vendor folder (it isn't in git or in the release package),
     * so its libraries come from the root composer.json into plugins/.
     */
    public function testModulesDoNotLoadTheirOwnVendorFolder(): void
    {
        $aErrors = [];
        foreach (glob(self::root() . 'modules/*/*/composer.json') as $sPath) {
            // A module may commit its installed libraries (Xero keeps them in its plugins/).
            $sVendor = json_decode(file_get_contents($sPath), true)['config']['vendor-dir'] ?? 'vendor';
            if (!is_file(dirname($sPath) . '/' . $sVendor . '/autoload.php') || !is_file(dirname($sPath) . '/' . $sVendor . '/.htaccess'))
                $aErrors[] = substr($sPath, strlen(self::root())) . ' is not installed by anything';
        }

        foreach (glob(self::root() . 'modules/*/*/{classes,template}/*.php', GLOB_BRACE) as $sPath)
            if (preg_match('#^\s*require(_once)?\b.*vendor/autoload\.php#m', file_get_contents($sPath)))
                $aErrors[] = substr($sPath, strlen(self::root())) . ' loads a module vendor/autoload.php';

        $this->assertSame([], $aErrors);
    }

    public function testModulePhpClassesComeFromRootComposer(): void
    {
        $aRequire = self::composer()['require'];
        $aFound = [];
        foreach (glob(self::root() . 'modules/*/*/install/config.php') as $sPath) {
            $aConfig = null;
            include($sPath);
            foreach ($aConfig['php_classes'] ?? [] as $sClass => $sPackage) {
                $aFound[$aConfig['name']] = true;
                $this->assertArrayHasKey($sPackage, $aRequire, $aConfig['name'] . ' needs ' . $sPackage . ' for ' . $sClass);
            }
        }

        $this->assertArrayHasKey('bx_azrb2c', $aFound, 'Azure B2C lists its libraries.');
        $this->assertArrayHasKey('bx_cidaascon', $aFound, 'Cidaas lists its libraries.');
    }

    public function testComposerFetchesFfmpegForThisMachine(): void
    {
        $aComposer = self::composer();
        $this->assertArrayNotHasKey('ffmpeg/ffmpeg', $aComposer['require'], 'The x64-only ffmpeg package is gone.');
        $this->assertContains('@fetch-ffmpeg', $aComposer['scripts']['post-install-cmd']);
        $this->assertContains('@fetch-ffmpeg', $aComposer['scripts']['post-update-cmd']);
        $this->assertSame(['@php scripts/composer/ffmpeg.php plugins'], $aComposer['scripts']['fetch-ffmpeg']);
    }

    public static function platforms(): array
    {
        return [
            'x64 Linux' => ['Linux', 'x86_64', 'linux-x64'],
            'Graviton / Ampere' => ['Linux', 'aarch64', 'linux-arm64'],
            'arm64 Docker on Apple Silicon' => ['Linux', 'arm64', 'linux-arm64'],
            'Raspberry Pi 32-bit' => ['Linux', 'armv7l', 'linux-arm'],
            '32-bit Linux' => ['Linux', 'i686', 'linux-ia32'],
            'Apple Silicon Mac' => ['Darwin', 'arm64', 'darwin-arm64'],
            'Intel Mac' => ['Darwin', 'x86_64', 'darwin-x64'],
            'Windows' => ['Windows', 'AMD64', 'win32-x64'],
            'no build' => ['Linux', 'riscv64', null],
            'no build for the OS' => ['BSD', 'amd64', null],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('platforms')]
    public function testFfmpegPlatform(string $sOs, string $sMachine, ?string $sExpected): void
    {
        require_once self::root() . 'scripts/composer/ffmpeg.php';
        $this->assertSame($sExpected, BxComposerFfmpeg::getPlatform($sOs, $sMachine));
    }

    public function testFfmpegAssetsArePinned(): void
    {
        require_once self::root() . 'scripts/composer/ffmpeg.php';
        foreach (BxComposerFfmpeg::ASSETS as $sPlatform => $sHash)
            $this->assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $sHash, $sPlatform);
    }

    public function testFfmpegFetchKeepsAMatchingBinary(): void
    {
        require_once self::root() . 'scripts/composer/ffmpeg.php';
        $sPlatform = BxComposerFfmpeg::getPlatform(PHP_OS_FAMILY, php_uname('m'));
        if ($sPlatform === null)
            $this->markTestSkipped('No ffmpeg build for this machine.');

        $sPlugins = sys_get_temp_dir() . '/una-ffmpeg-' . bin2hex(random_bytes(4));
        mkdir($sPlugins . '/ffmpeg', 0755, true);
        file_put_contents($sPlugins . '/ffmpeg/ffmpeg.exe', 'kept');
        file_put_contents($sPlugins . '/ffmpeg/.platform', BxComposerFfmpeg::RELEASE . ' ' . $sPlatform . "\n");

        try {
            ob_start();
            $iCode = BxComposerFfmpeg::run($sPlugins);
            ob_end_clean();
            $this->assertSame(0, $iCode);
            $this->assertSame('kept', file_get_contents($sPlugins . '/ffmpeg/ffmpeg.exe'), 'Nothing is downloaded again.');
        }
        finally {
            array_map('unlink', glob($sPlugins . '/ffmpeg/{,.}[!.]*', GLOB_BRACE));
            rmdir($sPlugins . '/ffmpeg');
            rmdir($sPlugins);
        }
    }

    public function testInstallerFallsBackToServerFfmpeg(): void
    {
        if (!defined('BX_DOL_INSTALL'))
            define('BX_DOL_INSTALL', true);
        require_once self::root() . 'install/classes/BxDolInstallSiteConfig.php';
        $sBundled = '/una/plugins/ffmpeg/ffmpeg.exe';

        $this->assertSame($sBundled, BxDolInstallSiteConfig::getFfmpegPath('/una/', fn($s) => true));
        $this->assertSame('/usr/bin/ffmpeg', BxDolInstallSiteConfig::getFfmpegPath('/una/', fn($s) => $s === '/usr/bin/ffmpeg'));
        $this->assertSame($sBundled, BxDolInstallSiteConfig::getFfmpegPath('/una/', fn($s) => false), 'With no ffmpeg at all the audit names the bundled path.');
        $this->assertFalse(BxDolInstallSiteConfig::isFfmpegRunnable('/nonexistent/ffmpeg'));
    }

    public function testSamplesAreClosed(): void
    {
        $this->assertSame("Deny from all\n", file_get_contents(self::root() . 'samples/.htaccess'));

        $sNginx = file_get_contents(self::root() . 'scripts/docker-compose/nginx.conf');
        $this->assertMatchesRegularExpression('#location ~\* \^/\([^)]*\bsamples\b[^)]*\)/ \{\s*return 404;#', $sNginx);

        $this->assertStringContainsString('<exclude name="samples/**" />', file_get_contents(self::root() . 'build.xml'), 'Release packages leave samples out.');
    }

    public function testFaviconIcoAtWebRoot(): void
    {
        $sIco = file_get_contents(self::root() . 'favicon.ico');
        $aHeader = unpack('vreserved/vtype/vcount', substr($sIco, 0, 6));
        $this->assertSame(['reserved' => 0, 'type' => 1, 'count' => 3], $aHeader);
    }

    public function testRailwayInstallsOnlyExistingModulesOnce(): void
    {
        $this->assertSame(1, preg_match('/^\s*-m ([a-z0-9_,]+) \\\\$/m', file_get_contents(self::root() . 'scripts/railway/entrypoint.sh'), $m), 'The module list is found.');
        $aList = explode(',', $m[1]);

        $aNames = [];
        foreach (glob(self::root() . 'modules/*/*/install/config.php') as $sPath) {
            $aConfig = null;
            include($sPath);
            $aNames[$aConfig['name']] = true;
        }

        $this->assertSame([], array_values(array_diff($aList, array_keys($aNames))), 'Modules that do not exist');
        $this->assertSame([], array_values(array_diff_assoc($aList, array_unique($aList))), 'Modules listed twice');
    }
}
