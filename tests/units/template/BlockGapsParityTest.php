<?php

/**
 * Page blocks are 16px apart on the site and in NEO, across columns and down a column, at every width from tablet up,
 * and the page keeps 16px above the first block and under the last. Read from the files, so a value changed on one
 * side only fails here.
 */
class BlockGapsParityTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testSiteLayoutGapsAre16px(): void
    {
        $sCss = self::read('template/css/tailwind.css');
        $this->assertMatchesRegularExpression('/\.bx-layout-wrapper\{\s*@apply gap-4 flex flex-col;/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-layout-row\{\s*@apply w-full flex relative flex-wrap md:flex-nowrap gap-4;/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-search-results-container \{\s*@apply flex flex-col gap-4;/', $sCss);
        $this->assertMatchesRegularExpression('/\.bx-layout-gap\{\s*@apply gap-4;/', $sCss);

        $this->assertStringContainsString('<div class="bx-content-main my-4">', self::read('template/_page_content_beg.html'), '16px above the first block and under the last.');
        $this->assertStringContainsString('<div class="bx-page-wrapper bx-def-page-width mx-auto px-4 box-border">', self::read('template/_page_content_beg.html'), '16px sides.');
    }

    public function testNeoConductorGapsAre16px(): void
    {
        $s = self::read('neo/packages/app/ui/molecules/sections/conductor/web-ui.js');
        $this->assertStringContainsString("? 'sm:px-4 sm:pt-4'", $s, 'Center column: 16px sides and top, the last block\'s margin under it.');
        $this->assertStringContainsString("? 'mt-0.5 sm:mt-0 sm:-me-4 sm:p-4'", $s, 'Profile left column over the center\'s inset.');
        $this->assertStringContainsString('`sm:-me-4 ${appSetting(\'conductor\', \'sidebar_container\')}`', $s, 'Section sidebar over the center\'s inset.');
        $this->assertStringContainsString('mt-0.5 sm:mt-0 sm:-ms-4 sm:px-4 sm:pt-4', $s, 'Right column over the center\'s inset.');
        $this->assertStringContainsString('leftColumnClassName="gap-y-4 mb-0.5 sm:mb-4"', $s);

        $this->assertStringContainsString("'mb-0.5 sm:mb-4'", self::read('neo/packages/app/components/item-renderer.js'), '16px under each block from tablet up.');

        $sPost = self::read('neo/packages/app/components/page-layout/post.js');
        $this->assertStringContainsString('className="mt-0.5 sm:m-0 sm:p-4 ">', $sPost);
        $this->assertSame(2, substr_count($sPost, ' hidden sm:flex gap-4 mt-0.5 sm:mt-0 sm:-ms-4 sm:p-4'), 'Post page side column, in the page and in the dialog.');
        $this->assertStringNotContainsString('w-full hidden sm:flex gap-4', $sPost, 'No w-full: the box grows into its negative margin, so the outer gutter stays 16px.');
    }

    public function testNeoUniversalLayoutGapsAre16px(): void
    {
        $s = self::read('neo/packages/app/settings/layout.js');
        $this->assertStringContainsString("page_content_padding_default: ' p-4 ',", $s);
        $this->assertStringContainsString("page_content_gap: ' gap-4 ',", $s);
        $this->assertStringContainsString("page_content_gap_default: ' sm:gap-4 ',", $s);
    }
}
