<?php

/**
 * jQuery UI in the scripts every page loads is its position utility alone (the preloader's 'jquery_ui_js' service);
 * the pages that use its widgets add the whole library by a file name that exists, and content that arrives later
 * loads it when no widget is there yet.
 */
class PreloaderJqueryUiTest extends BxDolTestCase
{
    const SERVICE = 'a:4:{s:6:"module";s:6:"system";s:6:"method";s:21:"get_preloader_content";s:6:"params";a:1:{i:0;s:12:"jquery_ui_js";}s:5:"class";s:12:"BaseServices";}';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return $s;
    }

    public function testTheServiceStringIsValid(): void
    {
        $this->assertSame(['module' => 'system', 'method' => 'get_preloader_content', 'params' => ['jquery_ui_js'], 'class' => 'BaseServices'], unserialize(self::SERVICE));
    }

    public function testInstallSqlAndTheMigration(): void
    {
        $s = self::read('install/sql/system.sql');
        $this->assertStringContainsString("('system', 'js_system', '" . self::SERVICE . "', 1, 3),", $s);
        $this->assertStringNotContainsString("'js_system', 'jquery-ui/jquery-ui.min.js'", $s);

        $s = self::read('migrations/2026111895_jquery_ui_position_only.sql');
        $this->assertStringContainsString("SET `content` = '" . self::SERVICE . "'", $s);
        $this->assertStringContainsString("WHERE `module` = 'system' AND `type` = 'js_system' AND `content` = 'jquery-ui/jquery-ui.min.js';", $s);
    }

    public function testTheBuildMakesThePositionFileFromItsTwoModules(): void
    {
        $a = json_decode(self::read('package.json'), true);
        $s = $a['scripts']['build:jquery-ui'];

        $this->assertStringContainsString('cp ../../node_modules/jquery-ui/dist/jquery-ui.min.js .', $s, 'The whole library stays for the pages that add it.');
        $this->assertStringContainsString('cat ../../node_modules/jquery-ui/ui/version.js ../../node_modules/jquery-ui/ui/position.js > jquery-ui.position.js', $s);
    }

    public function testTheServiceFallsBackToTheWholeLibrary(): void
    {
        $s = self::read('template/scripts/BxBaseServices.php');

        $this->assertMatchesRegularExpression("/case 'jquery_ui_js':.*?file_exists\\(BX_DIRECTORY_PATH_PLUGINS_PUBLIC \\. 'jquery-ui\\/jquery-ui\\.position\\.js'\\) \\? 'jquery-ui\\.position\\.js' : 'jquery-ui\\.min\\.js'/s", $s);
    }

    public function testNoCodeAsksForAFileTheBuildDoesNotMake(): void
    {
        foreach (['template/scripts/BxBaseGrid.php', 'modules/boonex/classes/classes/BxClssModule.php', 'modules/boonex/antispam/classes/BxAntispamGridIpTable.php', 'modules/boonex/se_migration/classes/BxSEMigStudioPage.php', 'modules/boonex/dolphin_migration/classes/BxDolMStudioPage.php'] as $sFile) {
            $s = self::read($sFile);
            $this->assertStringNotContainsString('jquery-ui.custom.min.js', $s, $sFile);
            $this->assertStringContainsString("'jquery-ui/jquery-ui.min.js'", $s, $sFile);
        }
    }

    public function testLaterContentLoadsTheLibraryWhenNoWidgetIsThere(): void
    {
        foreach (['template/scripts/BxBaseFormView.php', 'template/scripts/BxBaseLabel.php', 'template/scripts/BxBasePrivacy.php'] as $sFile) {
            $s = self::read($sFile);
            $this->assertStringNotContainsString('typeof(jQuery.ui.position)', $s, $sFile . ': the position utility is on every page, so it says nothing about the widgets.');
            $this->assertStringContainsString('typeof(jQuery.ui.sortable)', $s, $sFile);
        }

        $s = self::read('inc/js/functions.js');
        $this->assertStringContainsString('function bx_jquery_ui (fCallback)', $s);
        $this->assertStringContainsString("bx_get_scripts([sUrlRoot + 'plugins_public/jquery-ui/jquery-ui.min.js'], fCallback);", $s);
        $this->assertStringContainsString('bx_jquery_ui(fInitReordering);', self::read('inc/js/classes/BxDolUploader.js'));
        $this->assertStringContainsString('bx_jquery_ui(function () {', self::read('inc/js/classes/BxDolGrid.js'));
    }
}
