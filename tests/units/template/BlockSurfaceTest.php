<?php

/**
 * Blocks on the site, in Studio and in NEO share one surface: 22px corners (--bx-radius-3xl), the card colour at 60% (white, gray-800
 * in dark), a white/50 hairline inside (white/2.5 in dark) and smooth-shadow-sm's six soft layers, over one page colour (gray-100,
 * gray-950 in dark). NEO's bg-card/60, rounded-block and shadow-block-outline carry the same values, so a change belongs on every side.
 */
class BlockSurfaceTest extends BxDolTestCase
{
    private const STACK = '0 18px 47px rgb(0 0 0 / 0.03), 0 7.5px 19px rgb(0 0 0 / 0.02), 0 4px 10.5px rgb(0 0 0 / 0.02), 0 2.3px 5.8px rgb(0 0 0 / 0.01), 0 1.2px 3.1px rgb(0 0 0 / 0.01), 0 0.5px 1.3px rgb(0 0 0 / 0.01)';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSiteBlocksTakeStudiosSurface(): void
    {
        $s = self::read('template/css/tailwind.css');

        $this->assertStringContainsString("    .bx-def-color-bg-block {\n        @apply bg-white/60 dark:bg-gray-800/60;", $s);
        $this->assertStringContainsString("    .bx-def-border-block {\n        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.5), " . self::STACK . ';', $s);
        $this->assertStringContainsString("    .bx-def-border-block:is(.dark *) {\n        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.025), " . self::STACK . ';', $s);
        $this->assertStringContainsString("    .bx-def-border-radius-block {\n        border-radius: var(--bx-radius-3xl);", $s);

        // Studio's own blocks and page are the site's
        $this->assertStringContainsString('@apply bg-white/60 dark:bg-gray-800/60 ring-1 ring-inset ring-white/50 dark:ring-white/[0.025];', $s);
        $this->assertStringContainsString("    .bx-def-color-bg-page{\n        @apply bg-gray-100 dark:bg-gray-950;", $s);
        $this->assertStringContainsString("    .bx-std-bg.bx-def-color-bg-page {\n        @apply bg-gray-100 dark:bg-gray-950;", $s);
        $this->assertStringNotContainsString('dark:bg-white/10 ring-1 ring-inset ring-white/50', $s, 'No block keeps the white/10 surface of the black Studio page.');
    }

    public function testNeoBlocksMatchTheSite(): void
    {
        $sTheme = self::read('neo/packages/app/design/styles/theme.css');
        $this->assertStringContainsString('--neo-radius-block: 1.375rem;', $sTheme, '22px, as --bx-radius-3xl.');
        $this->assertStringContainsString('--neo-shadow-block-outline:        inset 0 0 0 1px rgb(255 255 255 / 0.5), ' . self::STACK . ';', $sTheme);
        $this->assertStringContainsString('--neo-shadow-block-outline-deep:  inset 0 0 0 1px rgb(255 255 255 / 0.025), ' . self::STACK . ';', $sTheme);

        $sElements = self::read('neo/packages/app/settings/theme/elements.js');
        $this->assertStringContainsString("' bg-card/60 shadow-block-outline dark:shadow-block-outline-deep '", $sElements);

        $sSchemes = self::read('neo/packages/app/design/styles/palette-schemes.css');
        $this->assertStringContainsString('--background: var(--neutral-100);', $sSchemes);
        $this->assertStringContainsString('--background: var(--neutral-950);', $sSchemes);
        $this->assertStringContainsString('--card: var(--neutral-800);', $sSchemes);
    }
}
