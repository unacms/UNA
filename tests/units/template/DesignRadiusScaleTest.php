<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Corner radii are one scale: Tailwind's rounded-* classes and Studio's own styles read --bx-radius-* variables,
 * which Studio > Designer > Settings > Corners sizes (template/css/tailwind.css, template/design_radius.html).
 */
class DesignRadiusScaleTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public static function configs(): array
    {
        return [['tailwind.config.js'], ['tailwind.config.full.js']];
    }

    #[DataProvider('configs')]
    public function testTailwindRadiiReadTheVariables(string $sPath): void
    {
        $s = self::read($sPath);

        foreach (['sm' => '-sm', 'DEFAULT' => '', 'md' => '-md', 'lg' => '-lg', 'xl' => '-xl', '2xl' => '-2xl', '3xl' => '-3xl'] as $sKey => $sSuffix)
            $this->assertMatchesRegularExpression('/[\'"]?' . preg_quote($sKey, '/') . '[\'"]?: \'var\(--bx-radius' . $sSuffix . '\)\'/', $s, $sKey);

        $this->assertStringContainsString("'full': '9999px'", $s, 'A pill does not follow the corner size.');
        $this->assertMatchesRegularExpression('/\.rounded-full\'?: \{ \'corner-shape\': \'round\' \}/', $s, 'A pill stays round with smooth corners.');
    }

    public function testVariablesKeepTailwindsSizesAtTheDefault(): void
    {
        $s = self::read('template/css/tailwind.css');

        $this->assertStringContainsString('--bx-radius-size: 1;', $s);
        $this->assertStringContainsString('--bx-radius-smooth: 1;', $s);
        $this->assertStringContainsString('--bx-radius-scale: calc(var(--bx-radius-size) * var(--bx-radius-smooth));', $s);

        foreach (['-sm' => '0.125rem', '' => '0.25rem', '-md' => '0.375rem', '-lg' => '0.5rem', '-xl' => '0.75rem', '-2xl' => '1rem', '-3xl' => '1.5rem'] as $sSuffix => $sSize)
            $this->assertStringContainsString('--bx-radius' . $sSuffix . ': calc(' . $sSize . ' * var(--bx-radius-scale));', $s);
    }

    public function testNoFixedRadiusIsLeftInTheSharedStyles(): void
    {
        $s = self::read('template/css/tailwind.css');

        $this->assertSame(0, preg_match('/border(?:-[a-z]+)*-radius:\s*[\d.]+(?:rem|px);/', $s, $a), 'A fixed radius: ' . ($a[0] ?? ''));
        $this->assertSame(0, preg_match('/rounded(?:-[trbl]{1,2})?-\[[\d.]+(?:rem|px)\]/', $s, $a), 'A fixed radius class: ' . ($a[0] ?? ''));
    }

    public function testStudioRadiiFollowTheScale(): void
    {
        $aFiles = glob(__DIR__ . '/../../../studio/template/css/*.css');
        $this->assertNotEmpty($aFiles);

        $iRadii = 0;
        foreach ($aFiles as $sPath) {
            $sFile = basename($sPath);

            preg_match_all('/border(?:-[a-z]+)*-radius:\s*([^;]+);/', self::read('studio/template/css/' . $sFile), $a);
            foreach ($a[1] as $sValue) {
                $iRadii++;
                $this->assertMatchesRegularExpression('/^(?:0|1px|9999px|inherit|[^;]*var\(--bx-radius[a-z0-9-]*\)[^;]*)$/', trim($sValue), $sFile . ': ' . $sValue);
            }
        }

        $this->assertGreaterThan(50, $iRadii);
    }

    public function testStudioPopupsAndHalosFollowTheScale(): void
    {
        $sLess = self::read('studio/template/css/common.less');
        $this->assertStringContainsString("    margin: 0.5rem;\n\n    border-radius: var(--bx-radius-3xl);", $sLess, 'Studio popups and dialogs.');
        $this->assertDoesNotMatchRegularExpression('/\.radius\((?:24|12)px\)/', $sLess);

        // a ring's corner is the tile's plus its width, so the hover halo and the active ring are drawn wide and clipped to the scaled shape
        $this->assertMatchesRegularExpression('/\.bx-std \.bx-std-header-btn,\s*\.bx-std \.bx-menu-top-center li \.bx-mi-icon,\s*\.bx-std \.bx-menu-breadcrumb li\.bx-menu-bc-page \.bx-mi-icon\.bx-icon-tile \{\s*clip-path: inset\(-0\.5rem round var\(--bx-radius-2xl\)\);/', self::read('template/css/tailwind.css'));
    }

    public function testHeadStylesSetTheSizeAndSmoothCornersOnlyWhereSupported(): void
    {
        $s = self::read('template/design_radius.html');

        $this->assertStringContainsString('--bx-radius-size: __size__;', $s);
        $this->assertMatchesRegularExpression('/<bx_if:smooth>\s*<style id="bx-design-radius-smooth">\s*@supports \(corner-shape: squircle\) \{.*--bx-radius-smooth: __factor__;.*\}\s*<\/style>\s*<\/bx_if:smooth>/s', $s);
        $this->assertStringContainsString('[class*="rounded-full"]', $s);
        $this->assertStringContainsString('corner-shape: round;', $s);
        $this->assertMatchesRegularExpression('/\*::before,\s*:where\(html\) \*::after \{\s*corner-shape: inherit;/', $s, 'A ring or a highlight drawn by a pseudo-element has its element\'s corners.');
    }

    public function testOptionsAreInstalledAndMigrated(): void
    {
        $sInstall = self::read('install/sql/system.sql');
        $sMigration = self::read('migrations/2026111900_design_radius.php');

        foreach (["'sys_design_radius'" => "'large'", "'sys_design_radius_smooth'" => "''", "'sys_design_radius_smooth_factor'" => "'1.75'"] as $sName => $sValue) {
            $this->assertMatchesRegularExpression('/' . preg_quote($sName, '/') . ',\s*[^\n]*' . preg_quote($sValue, '/') . '/', $sInstall, $sName);
            $this->assertStringContainsString(trim($sName, "'"), $sMigration);
        }

        $this->assertStringContainsString('UNA-Migration-Min-System-Version:', $sMigration);
    }
}
