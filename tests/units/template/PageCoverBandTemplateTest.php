<?php

/**
 * A page's cover is a band with nothing written on it, so no picture can hide the page's title: the title (with the
 * section's icon on a section's page) follows the band on the page. The site and the apps draw the band the same: 176px
 * high, on desktop only for a page with a title (NEO's PageCoverBand).
 */
class PageCoverBandTemplateTest extends BxDolTestCase
{
    private const SITE = 'modules/boonex/artificer/data/template/system/cover.html';
    private const NEO = 'neo/packages/app/components/elements/covers/page-cover-band.tsx';

    private static function read(string $sPath): string
    {
        return str_replace("\r\n", "\n", (string)file_get_contents(__DIR__ . '/../../../' . $sPath));
    }

    /** The band: from the cover's gap to the end of the cover's wrapper. */
    private static function band(string $sHtml): string
    {
        $iStart = strpos($sHtml, 'bx-cover-gap');
        $iEnd = strpos($sHtml, '<bx_if:title_section>');
        self::assertNotFalse($iStart);
        self::assertNotFalse($iEnd);

        return substr($sHtml, $iStart, $iEnd - $iStart);
    }

    public function testNoWordsOnTheBand(): void
    {
        $sHtml = self::read(self::SITE);
        $sBand = self::band($sHtml);

        $this->assertStringNotContainsString('__title__', $sBand);
        $this->assertStringNotContainsString('<h1', $sBand);
        $this->assertStringNotContainsString('bx-cover-gradient', $sHtml, 'no scrim: nothing to keep readable on the picture');
        $this->assertSame(2, substr_count($sHtml, '<h1'), 'one heading per title variant, both after the band');
    }

    public function testTheBandIsAsHighAndShowsOnTheSameScreensOnTheSiteAndInTheApps(): void
    {
        $sBand = self::band(self::read(self::SITE));
        $sNeo = self::read(self::NEO);

        $this->assertStringContainsString(' h-44"', $sBand);
        $this->assertStringContainsString(' h-44 ', $sNeo);

        $sPhp = self::read('template/scripts/BxBaseCover.php');
        $this->assertStringContainsString("'band_class' => \$bTitle ? 'hidden lg:block' : ''", $sPhp);
        $this->assertStringContainsString('hidden lg:flex', $sNeo);
    }

    public function testTheSectionTitleIsTheAppsSectionTitle(): void
    {
        // NEO's section title (TopSidebar): a 28px icon in a 44px box, 8px before a 20px bold name on a 28px line.
        $sNeo = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');
        $this->assertStringContainsString('text-xl leading-7 font-bold tracking-tight', $sNeo);
        $this->assertStringContainsString('size={28}', self::read('neo/packages/app/ui/molecules/section-icon.tsx'));
        $this->assertStringContainsString('size-11', self::read('neo/packages/app/ui/molecules/section-icon.tsx'));

        $sHtml = self::read(self::SITE);
        $this->assertStringContainsString('<span class="flex size-11 shrink-0 items-center justify-center', $sHtml);
        $this->assertStringContainsString('text-xl leading-7 font-bold tracking-tight', $sHtml);
        $this->assertStringContainsString("['class' => 'size-7', 'aria-hidden' => 'true']", self::read('template/scripts/BxBaseCover.php'));
        $this->assertStringContainsString('flex items-center gap-2 py-2.5', $sHtml);
    }
}
