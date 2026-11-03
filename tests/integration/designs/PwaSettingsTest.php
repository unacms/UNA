<?php

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * The installed app's settings (Studio > Designer > PWA, BxDolDesigns::getPwaSettings): what an empty field defaults to,
 * that a saved value wins, and that the manifest and the theme-color meta tag use them.
 */
#[Group('integration')]
class PwaSettingsTest extends BxDolIntegrationTestCase
{
    private const OPTIONS = ['site_title', 'sys_pwa_manifest_name', 'sys_pwa_manifest_short_name', 'sys_pwa_manifest_description', 'sys_pwa_manifest_background_color', 'sys_pwa_manifest_theme_color'];

    private array $_aOptionsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);

        foreach (self::OPTIONS as $sName)
            if ($sName != 'site_title')
                setParam($sName, '');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        parent::tearDown();
    }

    public function testEmptyFieldsTakeTheSiteNameWhiteAndTheTemplateColor(): void
    {
        setParam('site_title', 'Riverside Book Club');

        $aPwa = BxDolDesigns::getPwaSettings();

        $this->assertSame('Riverside Book Club', $aPwa['name']['used']);
        $this->assertSame('Riverside', $aPwa['short_name']['used'], 'the first word fits under the icon');
        $this->assertSame('', $aPwa['description']['used']);
        $this->assertSame('#ffffff', $aPwa['background_color']['used']);
        $this->assertSame(BxDolDesigns::getTemplateThemeColor(), $aPwa['theme_color']['used']);
        $this->assertMatchesRegularExpression('/^#[0-9a-f]{3,8}$/', $aPwa['theme_color']['used']);
        foreach ($aPwa as $sKey => $aField)
            $this->assertSame('', $aField['value'], $sKey . ' has nothing saved');
    }

    public function testSavedValuesWinAndTheShortNameFollowsTheAppName(): void
    {
        setParam('site_title', 'UNA');
        setParam('sys_pwa_manifest_name', 'Nightly Astronomers');
        setParam('sys_pwa_manifest_theme_color', 'rgb(29, 78, 216)');

        $aPwa = BxDolDesigns::getPwaSettings();

        $this->assertSame('Nightly Astronomers', $aPwa['name']['used']);
        $this->assertSame('UNA', $aPwa['name']['default']);
        $this->assertSame('Nightly', $aPwa['short_name']['used'], 'shortened from the app name, not the site name');
        $this->assertSame('rgb(29, 78, 216)', $aPwa['theme_color']['used']);
    }

    public function testShortNames(): void
    {
        $this->assertSame('UNA', BxDolDesigns::getPwaShortName('UNA'));
        $this->assertSame('Twelve chars', BxDolDesigns::getPwaShortName('Twelve chars'));
        $this->assertSame('Riverside', BxDolDesigns::getPwaShortName('Riverside Book Club'));
        $this->assertSame('Supercalifra', BxDolDesigns::getPwaShortName('Supercalifragilistic community'));
        $this->assertSame('Сообщество', BxDolDesigns::getPwaShortName('Сообщество любителей книг'), 'counts characters, not bytes');
    }

    public function testThemeColorMetaOnlyWhenSet(): void
    {
        $oTemplate = BxDolTemplate::getInstance();
        $this->assertSame('', $oTemplate->parseSystemKey('theme_color_meta'), 'the template keeps its own meta');

        setParam('sys_pwa_manifest_theme_color', '#1d4ed8');
        $this->assertSame('<meta name="theme-color" content="#1d4ed8" />', $oTemplate->parseSystemKey('theme_color_meta'));
    }

    public function testEveryTemplateMetaPutsTheSettingFirst(): void
    {
        $aFiles = array_merge([BX_DIRECTORY_PATH_ROOT . 'template/_header_meta.html'], glob(BX_DIRECTORY_PATH_MODULES . 'boonex/*/data/template/system/_header_meta.html'));
        foreach ($aFiles as $sFile)
            $this->assertStringStartsWith('__theme_color_meta__', file_get_contents($sFile), $sFile . ': the first theme-color meta is the one browsers use');
    }

    // manifest.json.php defines BX_MANIFEST, which turns sessions off for the rest of the process.
    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    public function testTheManifestUsesTheSettings(): void
    {
        setParam('site_title', 'Riverside Book Club');
        setParam('sys_pwa_manifest_background_color', '#f4f4f5');

        $sCwd = getcwd();
        chdir(BX_DIRECTORY_PATH_ROOT);
        ob_start();
        try {
            include BX_DIRECTORY_PATH_ROOT . 'manifest.json.php';
        } finally {
            $sJson = ob_get_clean();
            chdir($sCwd);
        }

        $aManifest = json_decode($sJson, true);
        $this->assertIsArray($aManifest, 'the manifest is JSON');
        $this->assertSame('Riverside Book Club', $aManifest['name']);
        $this->assertSame('Riverside', $aManifest['short_name']);
        $this->assertSame('#f4f4f5', $aManifest['background_color']);
        $this->assertSame(BxDolDesigns::getTemplateThemeColor(), $aManifest['theme_color']);
        $this->assertArrayNotHasKey('description', $aManifest, 'an empty description is left out');
    }
}
