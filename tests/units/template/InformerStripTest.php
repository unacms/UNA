<?php

/**
 * The informer is one strip right under the header, before the page's cover, tabs and blocks, on the site and in NEO:
 * its fill from edge to edge, its content as wide as the page. Read from the files, so a shell or a NEO layout that puts
 * it back into the page content fails here.
 */
class InformerStripTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public static function shells(): array
    {
        return [
            'default' => ['template/_sub_header.html', '<bx_include_auto:_page_cover.html />'],
            'application' => ['template/pt_application.html', '__cover__'],
            'artificer application' => ['modules/boonex/artificer/data/template/system/pt_application.html', '__cover__'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('shells')]
    public function testStripIsFirstInMain(string $sPath, string $sCover): void
    {
        $s = self::read($sPath);

        $this->assertSame(1, substr_count($s, '__informer__'), 'One informer per page.');
        $this->assertMatchesRegularExpression('/<main role="main" id="bx-content-main" tabindex="-1">\n(\s*<!--[^\n]*-->\n)?\s*<div id="bx-informer-strip" class="bx-informer-strip">__informer__<\/div>/', $s, 'The strip is the first thing in <main>.');
        $this->assertLessThan(strpos($s, $sCover), strpos($s, '__informer__'), 'Before the cover.');
    }

    public function testPageContentHasNoInformer(): void
    {
        $this->assertStringNotContainsString('__informer__', self::read('template/_page_content_beg.html'));
    }

    public static function partials(): array
    {
        return array_map(fn($s) => [$s], ['template/page_54.html', 'template/page_56.html', 'template/page_58.html']);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('partials')]
    public function testHtmxPartialsReplaceTheStrip(string $sPath): void
    {
        $this->assertStringContainsString('<div id="bx-informer-strip" class="bx-informer-strip" hx-swap-oob="true">__informer__</div>', self::read($sPath));
    }

    public function testStripIsEdgeToEdge(): void
    {
        $s = self::read('template/informer.html');
        $this->assertStringContainsString('role="status"', $s);
        $this->assertStringContainsString('<div class="bx-informer-msg-cnt bx-def-page-width mx-auto px-4 box-border">', $s, 'The content is as wide as the page, 16px in.');
        $this->assertStringNotContainsString('bx-def-border-radius-block', $s, 'A strip, not a rounded card.');

        $sCss = self::read('template/css/tailwind.css');
        $this->assertMatchesRegularExpression('/\.bx-informer-msg \{\s*@apply border-b /', $sCss, 'A line under each message.');
    }

    public function testNeoRendersOneStripAtTheLayout(): void
    {
        $sWeb = self::read('neo/packages/app/components/layout.web.js');
        $this->assertMatchesRegularExpression('/<main [^>]*>\s*\{\/\*[^}]*\*\/\}\s*\{stripInMain && <Informer \/>\}/', $sWeb, 'Web desktop: first in <main>, under the header.');
        $this->assertMatchesRegularExpression('/\{!isDesktop && <Informer \/>\}\s*<HeaderOptionsProvider>\s*<PageHeader /', $sWeb, 'Web below desktop: above the header, which carries the title there.');
        $this->assertStringContainsString('top: stripInView', self::read('neo/packages/app/ui/molecules/header/page-header.web.js'), 'The fixed header starts under what of the strip is still in view.');

        $sNative = self::read('neo/packages/app/components/layout.js');
        $this->assertLessThan(strpos($sNative, '<PageHeader'), strpos($sNative, '<InformerStrip topInset='), 'Apps: above the header, under the status bar.');
        $this->assertStringNotContainsString('<InformerStrip', self::read('neo/packages/app/ui/molecules/sections/conductor/native-ui.js'), 'Not in the list as well.');
        $this->assertStringNotContainsString('withInformerBlock', self::read('neo/packages/app/components/page-layout/profile.js'));

        $s = self::read('neo/packages/app/components/elements/informer.tsx');
        $this->assertStringContainsString("'w-full border-b'", $s);
        $this->assertStringContainsString("'w-full mx-auto px-4 py-3 flex-row items-start gap-3'", $s);
    }
}
