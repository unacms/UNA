<?php

/**
 * Feed images: every image has an alt, which also names the link around it, and a valid `sizes`.
 */
class BxTimelineTemplateImagesTest extends BxDolTestCase
{
    protected $_oTemplate;

    protected function setUp(): void
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_timeline');
        if (!$oModule)
            $this->markTestSkipped('bx_timeline module is not installed.');

        $oTemplate = $oModule->_oTemplate;
        if ($oTemplate instanceof BxDolModuleProxy)
            $oTemplate = $this->bxGetProtected($oTemplate, '_oProxifiedObject', BxDolModuleProxy::class);

        $this->_oTemplate = $oTemplate;
    }

    private function images(array $aImages, string $sTitle = '', array $aBrowseParams = []): array
    {
        $aEvent = ['id' => 42, 'content' => ['title' => $sTitle]];
        $aBrowseParams = array_merge(['view' => 'timeline', 'type' => 'feed'], $aBrowseParams);

        $a = $this->bxCallProtectedArgs($this->_oTemplate, '_getTmplVarsImages', [$aImages, true, &$aEvent, &$aBrowseParams]);

        return array_map(fn($aItem) => $aItem['item'], $a['items']);
    }

    private function image(int $i): array
    {
        return [
            'id' => $i,
            'src' => 'https://example.test/' . $i . '-300.jpg',
            'src_small' => 'https://example.test/' . $i . '-300.jpg',
            'src_medium' => 'https://example.test/' . $i . '-500.jpg',
            'src_orig' => 'https://example.test/' . $i . '-1200.jpg',
        ];
    }

    public function testSingleImageIsNamedAfterThePost(): void
    {
        [$s] = $this->images([$this->image(1)], 'Trip to the "lake"');

        $this->assertStringContainsString('alt="Trip to the &quot;lake&quot;"', $s);
        $this->assertMatchesRegularExpression('/^<a [^>]*><img [^>]*alt="[^"]+"/', $s, 'The image is the link\'s only content, so its alt names the link.');
    }

    public function testImageWithoutPostTitleStillHasAnAlt(): void
    {
        [$s] = $this->images([$this->image(1)]);

        $this->assertStringContainsString('alt="' . _t('_bx_timeline_txt_image_alt') . '"', $s);
    }

    public function testSeveralImagesAreNumbered(): void
    {
        $a = $this->images([$this->image(1), $this->image(2), $this->image(3)], 'Trip');

        $this->assertStringContainsString('alt="' . _t('_bx_timeline_txt_image_alt_title_n', 'Trip', 2, 3) . '"', $a[1]);

        $a = $this->images([$this->image(1), $this->image(2)]);
        $this->assertStringContainsString('alt="' . _t('_bx_timeline_txt_image_alt_n', 2, 2) . '"', $a[1]);
    }

    public function testSizesIsAValidSourceSizeList(): void
    {
        [$s] = $this->images([$this->image(1)]);

        $this->assertStringNotContainsString('sizes="100%"', $s, 'A percentage is not a valid source size; browsers fall back to 100vw.');
        $this->assertStringContainsString('sizes="(min-width: 768px) 500px, 100vw"', $s);
        $this->assertStringContainsString(' 1200w', $s);
    }
}
