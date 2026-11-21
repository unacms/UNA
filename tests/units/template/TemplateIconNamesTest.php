<?php

use PHPUnit\Framework\Attributes\DataProvider;

require_once(__DIR__ . '/../../integration/BxDolIntegrationTestCase.php');
require_once(__DIR__ . '/../../integration/template/StoredIconNamesTest.php');

/**
 * Every icon the templates, scripts, code and language strings of the system and the starter modules name draws
 * itself, as StoredIconNamesTest asks of the stored ones: a Lucide icon or a brand mark (`brand-x`), not a Font
 * Awesome name only the Lucide set's map knows (`thumbtack` drew `pin`) and not one it doesn't (`angle-left` drew
 * nothing). The names are read where a class list has `sys-icon` and where PHP gives an `'icon' => '...'`.
 */
class TemplateIconNamesTest extends BxDolTestCase
{
    /**
     * Places that look like icons and are not: the Editor's toolbar tools (`'icon' => 'header'`) and names the apps
     * take in PascalCase.
     */
    protected const SKIP = [
        'modules/boonex/editor/classes/BxEditorModule.php',
        'template/scripts/BxBasePage.php' => ['Plus'],
        'modules/boonex/artificer/classes/BxArtificerConfig.php' => ['h-8 w-8'],
        'studio/template/scripts/BxBaseStudioFormsField.php' => ['ui-'],
    ];

    protected static function root(): string
    {
        return realpath(__DIR__ . '/../../..') . '/';
    }

    /**
     * Folders of the modules StoredIconNamesTest::MODULES lists, by the `name` in their install/config.php.
     */
    protected static function moduleDirs(): array
    {
        $aDirs = [];
        foreach (glob(self::root() . 'modules/boonex/*/install/config.php') as $sConfig) {
            if (!preg_match("/'name'\s*=>\s*'([^']+)'/", (string)file_get_contents($sConfig), $aMatch))
                continue;
            if (in_array($aMatch[1], StoredIconNamesTest::MODULES, true))
                $aDirs[$aMatch[1]] = 'modules/boonex/' . basename(dirname(dirname($sConfig))) . '/';
        }

        return $aDirs;
    }

    protected static function files(): array
    {
        $aRoots = ['inc/', 'template/', 'studio/', 'modules/base/', 'modules/boonex/artificer/', 'modules/boonex/english/data/langs/'];
        $aRoots = array_merge($aRoots, array_values(self::moduleDirs()));

        $aFiles = [];
        foreach ($aRoots as $sRoot) {
            $oIt = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(self::root() . $sRoot, FilesystemIterator::SKIP_DOTS));
            foreach ($oIt as $oFile) {
                $sPath = substr($oFile->getPathname(), strlen(self::root()));
                if (!preg_match('/\.(php|html|js|xml)$/', $sPath) || preg_match('#/(updates|plugins)/|\.min\.js$#', $sPath))
                    continue;
                $aFiles[$sPath] = true;
            }
        }
        ksort($aFiles);

        return array_keys($aFiles);
    }

    /**
     * [file:line, icon code] for every icon named in a class list with `sys-icon` or an `'icon' => '...'` of PHP.
     */
    protected static ?array $_aNamedIcons = null;

    protected static function namedIcons(): array
    {
        if (self::$_aNamedIcons !== null)
            return self::$_aNamedIcons;

        $aResult = [];
        foreach (self::files() as $sPath) {
            $s = (string)file_get_contents(self::root() . $sPath);
            if (strpos($s, 'sys-icon') === false && strpos($s, 'icon') === false)
                continue;

            $aSkip = self::SKIP[$sPath] ?? (in_array($sPath, self::SKIP, true) ? true : []);
            if ($aSkip === true)
                continue;

            $aFound = [];
            // a class list: the icon's name is the first class after sys-icon that is not a style or a colour
            if (preg_match_all('/\bsys-icon((?:[ \t]+[A-Za-z0-9_:-]+)+)/', $s, $aMatches, PREG_OFFSET_CAPTURE))
                foreach ($aMatches[1] as [$sClasses, $iOffset]) {
                    $sName = BxBaseIconsetLucide::getCodeName($sClasses);
                    if ($sName === '' || strpos($sName, '__') !== false || strpos($sName, ':') !== false || preg_match('/^(text|w|h|m[trblxy]?|p[trblxy]?|size|stroke|fill|shrink|grow|inline|block|flex|hidden|align|leading|opacity|transition|rotate|absolute|relative|z|cursor|animate|self|group|lucide|ltr|rtl)(-|$)/', $sName))
                        continue;
                    // the name and the Font Awesome classes: the rest of the list styles the icon
                    $aCode = array_intersect(preg_split('/\s+/', strtolower(trim($sClasses))), ['fa', 'fas', 'far', 'fab', 'fa-fw']);
                    $aCode[] = $sName;
                    $aFound[] = [$iOffset, implode(' ', $aCode)];
                }

            // a template's <bx_image_auto:far,star|class1,class2 />: classes of the icon before the |
            if (preg_match_all('/<bx_image_auto:([A-Za-z0-9,_-]+)(?:\|[^\s]*)? \/>/', $s, $aMatches, PREG_OFFSET_CAPTURE))
                foreach ($aMatches[1] as [$sClasses, $iOffset])
                    if (!preg_match('/^\s*\*/', substr($s, (int)strrpos(substr($s, 0, $iOffset), "\n"), 40))) // not a doc comment's example
                        $aFound[] = [$iOffset, str_replace(',', ' ', $sClasses)];

            if (substr($sPath, -4) === '.php' && preg_match_all('/[\'"](?:icon|icon_font)[\'"]\s*=>\s*([\'"])([a-z][a-z0-9 -]*)\1/', $s, $aMatches, PREG_OFFSET_CAPTURE))
                foreach ($aMatches[2] as [$sCode, $iOffset])
                    if (!in_array($sCode, $aSkip, true))
                        $aFound[] = [$iOffset, $sCode];

            foreach ($aFound as [$iOffset, $sCode])
                $aResult[] = [$sPath . ':' . (substr_count($s, "\n", 0, $iOffset) + 1), $sCode];
        }

        return self::$_aNamedIcons = $aResult;
    }

    public function testTheModulesAreTheInstallersStarterSet(): void
    {
        $sInstaller = self::root() . 'install/classes/BxDolInstallSiteConfig.php';
        if (!file_exists($sInstaller))
            $this->markTestSkipped('The installer is not here.');

        $this->assertMatchesRegularExpression('/\$aStarterModules = array\((.*?)\);/s', (string)file_get_contents($sInstaller));
        preg_match('/\$aStarterModules = array\((.*?)\);/s', (string)file_get_contents($sInstaller), $aMatch);
        preg_match_all("/'([a-z_]+)'/", $aMatch[1], $aUris);

        $aNames = [];
        foreach (glob(self::root() . 'modules/boonex/*/install/config.php') as $sConfig) {
            $s = (string)file_get_contents($sConfig);
            if (preg_match("/'home_uri'\s*=>\s*'([^']+)'/", $s, $aUri) && in_array($aUri[1], $aUris[1], true) && preg_match("/'name'\s*=>\s*'([^']+)'/", $s, $aName))
                $aNames[] = $aName[1];
        }

        $this->assertCount(count($aUris[1]), $aNames, 'Every starter module is found.');
        $this->assertSame([], array_values(array_diff($aNames, StoredIconNamesTest::MODULES)), 'StoredIconNamesTest::MODULES lists the starter set.');
    }

    public function testTheIconsAreFound(): void
    {
        $aCodes = array_column(self::namedIcons(), 1);

        $this->assertGreaterThan(250, count($aCodes));
        $this->assertContains('chevron-left', $aCodes, 'The photo switcher (entry-photo-switcher.html).');
        $this->assertContains('bot', $aCodes, 'Studio > Agents (BxBaseStudioAgentsAgents.php).');
    }

    public function testNamedIconsDrawThemselves(): void
    {
        $oIconset = StoredIconNamesTest::iconset();

        $aProblems = [];
        foreach (self::namedIcons() as [$sWhere, $sCode])
            if (($sProblem = StoredIconNamesTest::problem($oIconset, $sCode)) !== '')
                $aProblems[] = $sWhere . ': "' . $sCode . '" ' . $sProblem;

        $this->assertSame([], $aProblems);
    }

    public static function codeNames(): array
    {
        return [
            'a name' => ['cog', 'cog'],
            'Font Awesome classes' => ['far file-alt', 'file-alt'],
            'a colour' => ['info-circle col-blue3-dark', 'info-circle'],
            'classes before sys-icon' => ['bx-std-star sys-icon star', 'star'],
            'sys-colored' => ['sys-icon sys-colored col-green1-dark circle-check', 'circle-check'],
            'an emoji holder' => ['sys-icon sys-icon-emoji', ''],
            'nothing' => ['', ''],
        ];
    }

    #[DataProvider('codeNames')]
    public function testTheNameOfACode(string $sCode, string $sName): void
    {
        $this->assertSame($sName, BxBaseIconsetLucide::getCodeName($sCode));
    }
}
