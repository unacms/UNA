<?php

/**
 * Messenger works from a git clone: the root `yarn` builds its styles and emoji picker (they are gitignored build
 * output), CI hands them to the package with plugins_public, the release package leaves out their sources, and the
 * Docker setup gives Messenger's installer the address of its own Jot server.
 */
class MessengerBuildAndJotTest extends \PHPUnit\Framework\TestCase
{
    private const ROOT = __DIR__ . '/../../../';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(self::ROOT . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r", '', $s);
    }

    public function testRootYarnBuildsMessenger(): void
    {
        $aPackage = json_decode(self::read('package.json'), true);
        $this->assertStringStartsWith('npm run build', $aPackage['scripts']['postinstall'] ?? '');
        $this->assertStringContainsString('npm-run-all --parallel build:*', $aPackage['scripts']['build']);

        $sScript = $aPackage['scripts']['build:messenger'] ?? '';
        $this->assertStringContainsString('cd modules/boonex/messenger', $sScript);
        $this->assertStringContainsString('yarn build', $sScript);

        $aMessenger = json_decode(self::read('modules/boonex/messenger/package.json'), true);
        $this->assertStringContainsString('build:tailwind', $aMessenger['scripts']['build'], "Messenger's build makes its CSS");
        $this->assertStringContainsString('build:emoji', $aMessenger['scripts']['build'], 'and its emoji picker.');
    }

    public function testEveryCompiledStyleHasItsSource(): void
    {
        $sIgnore = self::read('modules/boonex/messenger/.gitignore');
        preg_match_all('#^template/css/([a-z-]+\.css)$#m', $sIgnore, $aMatches);
        $this->assertNotEmpty($aMatches[1]);
        foreach ($aMatches[1] as $sFile)
            $this->assertFileExists(self::ROOT . 'modules/boonex/messenger/template/css/tailwind/components/' . $sFile, "$sFile is built from a component.");
    }

    public function testCiAndReleasePackageCarryTheBuild(): void
    {
        $sCi = self::read('.github/workflows/ci.yml');
        $this->assertStringContainsString('modules/boonex/messenger/js/emoji', $sCi, 'The dependencies artifact has the emoji picker');
        $this->assertStringContainsString('modules/boonex/messenger/template/css/*.css', $sCi, 'and the styles.');

        $sBuild = self::read('build.xml');
        $this->assertStringContainsString('<exclude name="modules/boonex/messenger/js/emoji-mart/**" />', $sBuild, 'The package leaves out the sources.');
        $this->assertStringContainsString('<exclude name="modules/boonex/messenger/template/css/tailwind/**" />', $sBuild);
        $this->assertStringNotContainsString('<exclude name="modules/boonex/messenger/js/emoji/', $sBuild, 'It keeps the build.');

        $this->assertStringNotContainsString("rm -rf js/emoji-mart", self::read('scripts/Jenkinsfile'), "Jenkins no longer removes package.json before the root yarn needs it.");
    }

    public function testDockerPassesTheJotUrl(): void
    {
        $this->assertMatchesRegularExpression('/^\s+UNA_JOT_URL: \$\{UNA_JOT_URL:-http:\/\/localhost:\$\{JOT_PORT:-5555\}\}$/m', self::read('docker-compose.yml'));
        $this->assertStringContainsString('env[UNA_JOT_URL] = $UNA_JOT_URL', self::read('scripts/docker-compose/php-fpm-pool.conf'), 'PHP-FPM passes it to the web installer and Studio.');
        $this->assertStringContainsString("getenv('UNA_JOT_URL')", self::read('modules/boonex/messenger/install/installer.php'));
    }
}
