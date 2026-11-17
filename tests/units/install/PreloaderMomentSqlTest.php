<?php

/**
 * Moment is in the scripts every page loads through the preloader's service ('datetime_js'), which picks the
 * viewer's locale, not as the build with every locale; the build script makes the split files it reads.
 */
class PreloaderMomentSqlTest extends BxDolTestCase
{
    const SERVICE = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:11:"datetime_js";}s:5:"class";s:12:"BaseServices";}';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return $s;
    }

    public function testTheServiceStringIsValid(): void
    {
        $a = unserialize(self::SERVICE);

        $this->assertSame(['module' => 'system', 'method' => 'get_preloader_content', 'params' => ['datetime_js'], 'class' => 'BaseServices'], $a);
    }

    public function testInstallSqlHasTheServiceRowInMomentsPlace(): void
    {
        $s = self::read('install/sql/system.sql');

        $this->assertStringContainsString("('system', 'js_system', '" . self::SERVICE . "', 1, 8),", $s);
        $this->assertStringNotContainsString("'js_system', 'moment-with-locales.min.js'", $s);
    }

    public function testMigrationChangesOnlyTheOldRow(): void
    {
        $s = self::read('migrations/2026111890_moment_one_locale.sql');

        $this->assertStringContainsString("SET `content` = '" . self::SERVICE . "'", $s);
        $this->assertStringContainsString("WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'moment-with-locales.min.js';", $s);
    }

    public function testTheBuildMakesTheSplitFilesAndKeepsTheFullOne(): void
    {
        $a = json_decode(self::read('package.json'), true);
        $s = $a['scripts']['build:moment'];

        $this->assertStringContainsString('cp node_modules/moment/min/moment.min.js plugins_public/moment', $s);
        $this->assertStringContainsString('cp node_modules/moment/locale/*.js plugins_public/moment/locale', $s);
        $this->assertStringContainsString('cp node_modules/moment/min/moment-with-locales.min.js plugins_public', $s, 'Modules that add the full build themselves still find it.');
    }
}
