<?php

/**
 * Studio > Designer > Settings > Accent color: every preset is a full scale, and the pairs the site and NEO draw with
 * it pass WCAG AA in light and dark mode. Blue, the default, is Tailwind's and what tailwind.css and NEO's palette.css
 * already have.
 */
class AccentPresetsTest extends BxDolTestCase
{
    private const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

    private const WHITE = '255 255 255';
    private const GRAY_50 = '250 250 252'; // the light page and cards (gray-50)
    private const GRAY_800 = '39 39 42'; // dark cards and popovers
    private const GRAY_900 = '24 24 27';
    private const GRAY_950 = '10 10 12'; // the dark page

    private static function luminance(string $sRgb): float
    {
        $f = function ($i) {
            $c = $i / 255;
            return $c <= 0.03928 ? $c / 12.92 : pow(($c + 0.055) / 1.055, 2.4);
        };
        list($r, $g, $b) = array_map('intval', explode(' ', $sRgb));

        return 0.2126 * $f($r) + 0.7152 * $f($g) + 0.0722 * $f($b);
    }

    private static function contrast(string $a, string $b): float
    {
        $la = self::luminance($a);
        $lb = self::luminance($b);

        return (max($la, $lb) + 0.05) / (min($la, $lb) + 0.05);
    }

    public function testSixToEightPresetsWithBlueFirst(): void
    {
        $aPresets = BxDolDesigns::getAccentPresets();

        $this->assertGreaterThanOrEqual(6, count($aPresets));
        $this->assertLessThanOrEqual(8, count($aPresets));
        $this->assertSame(BxDolDesigns::ACCENT_DEFAULT, array_key_first($aPresets));
    }

    public function testEveryPresetIsAFullScaleOfRgbTriplets(): void
    {
        foreach (BxDolDesigns::getAccentPresets() as $sName => $aScale) {
            $this->assertSame(self::STEPS, array_keys($aScale), $sName);
            foreach ($aScale as $iStep => $sRgb)
                $this->assertMatchesRegularExpression('/^(\d{1,3}) (\d{1,3}) (\d{1,3})$/', $sRgb, "$sName $iStep");
        }
    }

    public function testDefaultIsTheBlueTheStylesheetsHave(): void
    {
        $sCss = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/css/tailwind.css');
        $sNeo = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'neo/packages/app/design/styles/palette.css');

        foreach (BxDolDesigns::getAccentPresets()[BxDolDesigns::ACCENT_DEFAULT] as $iStep => $sRgb) {
            $this->assertStringContainsString("--bx-accent-$iStep: $sRgb;", $sCss, "site $iStep");
            if ($sNeo !== false)
                $this->assertStringContainsString("--accent-$iStep: $sRgb;", $sNeo, "NEO $iStep");
        }
    }

    public function testEveryPresetKeepsAA(): void
    {
        foreach (BxDolDesigns::getAccentPresets() as $sName => $a) {
            // light: primary buttons (white on 600), links and selected items (700 on white, gray-50, 50 and 100)
            $this->assertGreaterThanOrEqual(4.5, self::contrast(self::WHITE, $a[600]), "$sName: white on 600");
            foreach ([self::WHITE, self::GRAY_50, $a[50], $a[100]] as $sBg)
                $this->assertGreaterThanOrEqual(4.5, self::contrast($a[700], $sBg), "$sName: 700 on $sBg");

            // dark: links (400) on the page and cards; switches (500) and focus rings (400) against cards, 3:1
            foreach ([self::GRAY_950, self::GRAY_900, self::GRAY_800] as $sBg)
                $this->assertGreaterThanOrEqual(4.5, self::contrast($a[400], $sBg), "$sName: 400 on $sBg");
            $this->assertGreaterThanOrEqual(3, self::contrast($a[500], self::GRAY_900), "$sName: 500 on gray-900");

            // light: switches and focus rings (600) against the page, 3:1
            $this->assertGreaterThanOrEqual(3, self::contrast($a[600], self::GRAY_50), "$sName: 600 on gray-50");
        }
    }

    public function testTheSiteGetsTheScaleOnlyForAnotherPreset(): void
    {
        $sBefore = getParam('sys_design_accent');
        try {
            setParam('sys_design_accent', 'blue');
            $this->assertSame('blue', BxDolDesigns::getAccent());
            $this->assertSame([], BxDolDesigns::getAccentScale(), 'the default needs nothing');

            setParam('sys_design_accent', 'no-such-colour');
            $this->assertSame(BxDolDesigns::ACCENT_DEFAULT, BxDolDesigns::getAccent());

            setParam('sys_design_accent', 'green');
            $this->assertSame(BxDolDesigns::getAccentPresets()['green'], BxDolDesigns::getAccentScale());
        }
        finally {
            setParam('sys_design_accent', $sBefore);
        }
    }
}
