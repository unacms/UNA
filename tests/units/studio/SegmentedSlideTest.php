<?php

/**
 * Studio segmented switchers (the dashboard's Users periods, Server Status/Audit): an 8px track, 6px tabs, and the selected tab's plate
 * as one layer of the track that slides between tabs (page.js places it from aria-selected).
 */
class SegmentedSlideTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testTrackAndTabCorners(): void
    {
        $s = self::read('template/css/tailwind.css');
        $this->assertStringContainsString('@apply relative isolate inline-flex p-1 rounded-lg bg-black/5 dark:bg-white/5;', $s, 'The track has the buttons\' corners.');
        $this->assertStringContainsString('h-7 px-3 rounded-[calc(var(--bx-radius-lg)-0.125rem)]', $s, 'Tabs: 28px with 6px corners.');
        $this->assertStringNotContainsString('inset 0 1px 2px', $s, 'The track has no inner fade shadow.');
        $this->assertStringContainsString("box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1); /* a 1px edge", $s, 'Only a 1px inner edge.');
        $this->assertStringContainsString("    .bx-std .bx-std-segmented[data-bx-seg]:is(.dark *)::after {\n        background-image: linear-gradient(to bottom, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0.1));\n        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.2), 0 1px 2px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.2);", $s, 'The plate is a regular button\'s: gradient, hairlines and drop shadow.');
        $this->assertStringContainsString('[aria-selected="true"]:not(:focus-visible) {', $s, 'A focused selected tab keeps its ring.');
    }

    public function testThePlateSlidesWithAnOvershoot(): void
    {
        $s = self::read('template/css/tailwind.css');
        $this->assertStringContainsString("    .bx-std .bx-std-segmented[data-bx-seg]::after {\n", $s);
        $this->assertStringContainsString('transform: translateX(var(--bx-seg-x, 0));', $s);
        $this->assertStringContainsString('transition: transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1), width 450ms cubic-bezier(0.34, 1.56, 0.64, 1);', $s);
        $this->assertMatchesRegularExpression('/@media \(prefers-reduced-motion: reduce\) \{\s*\.bx-std \.bx-std-segmented\[data-bx-seg="on"\]::after \{\s*transition: none;/', $s);

        $sJs = self::read('studio/js/page.js');
        $this->assertStringContainsString("attributeFilter: ['aria-selected']", $sJs, 'The plate follows aria-selected, which the block scripts set.');
        $this->assertStringContainsString("oTrack.style.setProperty('--bx-seg-x', oTab.offsetLeft + 'px');", $sJs);
    }
}
