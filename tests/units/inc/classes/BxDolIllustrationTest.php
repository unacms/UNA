<?php

/**
 * A picture of plain shapes (BxDolIllustration): the site shows its template file, the apps get each path's `d` and
 * tone, because iOS and Android have no web view to show an SVG file. Only paths the apps can draw are sent.
 */
class BxDolIllustrationTest extends BxDolTestCase
{
    private const PLUS = 'M28 4H72A24 24 0 0 1 96 28V72A24 24 0 0 1 72 96H28A24 24 0 0 1 4 72V28A24 24 0 0 1 28 4Z';
    private const DOT = 'M136 50a14 14 0 1 0 28 0a14 14 0 1 0 -28 0Z';

    private static function template(): string
    {
        $s = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'template/create_account_illustration.html');
        if ($s === false)
            self::fail('template/create_account_illustration.html is not readable.');

        return $s;
    }

    public function testShapesComeFromThePathsOfTheFile(): void
    {
        $a = BxDolIllustration::parse('<svg viewBox="0 0 120 80" aria-hidden="true">'
            . '<path data-tone="primary" class="fill-blue-600" d="' . self::PLUS . '" />'
            . '<path data-tone="muted" fill-rule="evenodd" d="' . self::DOT . '" />'
            . '</svg>');

        $this->assertSame('0 0 120 80', $a['view_box']);
        $this->assertSame([
            ['d' => self::PLUS, 'tone' => 'primary'],
            ['d' => self::DOT, 'tone' => 'muted', 'even_odd' => true],
        ], $a['shapes']);
    }

    public function testOnlyWhatTheAppsCanDrawIsSent(): void
    {
        $a = BxDolIllustration::parse('<svg viewBox="0,0, 200 200">'
            . '<path data-tone="accent" d="' . self::DOT . '" />'
            . '<path d="' . self::DOT . '" />'
            . '<path data-tone="brand" d="' . self::DOT . '" />'
            . '<path data-tone="muted" d="url(#gradient)" />'
            . '<path data-tone="muted" d="" />'
            . '<path data-tone="muted" d="M0 0' . str_repeat(' 1', 1200) . '" />'
            . '<circle data-tone="muted" cx="10" cy="10" r="5" />'
            . '<g><path data-tone="accent-foreground" d="' . self::PLUS . '" /></g>'
            . '</svg>');

        $this->assertSame('0 0 200 200', $a['view_box'], 'Commas and spaces become single spaces.');
        $this->assertSame([
            ['d' => self::DOT, 'tone' => 'accent'],
            ['d' => self::PLUS, 'tone' => 'accent-foreground'],
        ], $a['shapes']);
    }

    public function testCodeThatIsNotOneSvgHasNoShapes(): void
    {
        foreach (['', '   ', 'plain text', '<div><svg><path data-tone="muted" d="M0 0Z" /></svg></div>', '<svg><path data-tone="muted" d="M0 0Z"></svg>'] as $sCode)
            $this->assertSame(['view_box' => BxDolIllustration::VIEW_BOX_DEFAULT, 'shapes' => []], BxDolIllustration::parse($sCode), $sCode);

        $this->assertSame(BxDolIllustration::VIEW_BOX_DEFAULT, BxDolIllustration::parse('<svg viewBox="0 0 100%"><path data-tone="muted" d="M0 0Z" /></svg>')['view_box']);
    }

    public function testNoMoreShapesThanAPictureNeeds(): void
    {
        $a = BxDolIllustration::parse('<svg>' . str_repeat('<path data-tone="muted" d="' . self::DOT . '" />', BxDolIllustration::SHAPES_MAX + 10) . '</svg>');

        $this->assertCount(BxDolIllustration::SHAPES_MAX, $a['shapes']);
    }

    public function testTemplateNameHasOnlyNameCharacters(): void
    {
        $this->assertSame('create_account_illustration.html', BxDolIllustration::getTemplateName('create_account'));
        $this->assertSame('create_account_illustration.html', BxDolIllustration::getTemplateName('../Create_Account'));
    }

    public function testTheSignUpPictureIsDrawnTheSameByTheSiteAndTheApps(): void
    {
        $sSvg = self::template();
        $a = BxDolIllustration::parse($sSvg);

        // Every path of the file reaches the apps: none without a tone they know.
        $this->assertSame(substr_count($sSvg, '<path '), count($a['shapes']));
        $this->assertCount(7, $a['shapes']);
        $this->assertSame('0 0 200 200', $a['view_box']);
        $this->assertSame(['primary', 'primary-foreground', 'primary-foreground', 'accent', 'accent-foreground', 'muted', 'accent-foreground'], array_column($a['shapes'], 'tone'));

        // Decorative: hidden from screen readers and out of the tab order.
        $this->assertMatchesRegularExpression('/^<svg [^>]*aria-hidden="true"/', $sSvg);
        $this->assertStringContainsString('focusable="false"', $sSvg);
    }

    public function testTheSignUpPictureHasTheAppsColoursInBothSchemes(): void
    {
        // The site's colour of each tone, light and dark: the apps' tokens (NEO palette-schemes.css) on the site's
        // scales, where blue is the site's accent and gray the neutrals.
        $aClasses = [
            'primary' => 'fill-blue-600',
            'primary-foreground' => 'fill-gray-50',
            'accent' => 'fill-blue-100 dark:fill-blue-900',
            'accent-foreground' => 'fill-blue-700 dark:fill-blue-300',
            'muted' => 'fill-gray-200 dark:fill-gray-700',
        ];

        $this->assertSame(7, preg_match_all('/<path data-tone="([a-z-]+)" class="([^"]+)" d="/', self::template(), $aMatches, PREG_SET_ORDER));
        foreach ($aMatches as $aMatch)
            $this->assertSame($aClasses[$aMatch[1]] ?? null, $aMatch[2], $aMatch[1]);

        $this->assertSame(array_keys($aClasses), array_values(array_intersect(array_keys($aClasses), BxDolIllustration::TONES)), 'Each is a tone the apps know.');
    }
}
