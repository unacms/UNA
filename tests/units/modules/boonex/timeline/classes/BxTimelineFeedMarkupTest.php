<?php

/**
 * Feed markup: post titles are headings, a finished feed shows no disabled Load More, and the action bar keeps
 * one row on narrow cards.
 */
class BxTimelineFeedMarkupTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testPostTitleIsAHeading(): void
    {
        $this->assertStringContainsString('<h3 class="__style_prefix__-title-cnt mr-2">__title__</h3>', self::read('modules/boonex/timeline/template/type_post.html'), 'Post titles are h3 under the block\'s h2, so screen reader users can jump between posts.');

        foreach (['modules/boonex/timeline/template/css/view.css', 'modules/boonex/artificer/data/template/bx_timeline/css/view.css'] as $sPath)
            $this->assertMatchesRegularExpression('/div\.bx-tl-title \.bx-tl-title-cnt \{[^}]*margin: 0;[^}]*font: inherit;/', self::read($sPath), "$sPath keeps the heading at the title's own size.");
    }

    public function testActionBarHidesLabelsOnNarrowCards(): void
    {
        $s = self::read('modules/boonex/artificer/data/template/bx_timeline/css/view.css');

        $this->assertMatchesRegularExpression('/div\.bx-tl-item-cnt \{\s*container-type: inline-size;/', $s);
        $this->assertMatchesRegularExpression('/@container \(max-width: 24rem\) \{\s*\.bx-menu-object-bx_timeline_menu_item_actions \.bx-menu-item-title,\s*\.bx-menu-object-bx_timeline_menu_item_actions \.sys-action-do-text \{[^}]*clip: rect\(0, 0, 0, 0\);/', $s, 'Labels are visually hidden, not removed, so they still name the controls.');
    }

    public function testFinishedFeedHasNoDisabledLoadMore(): void
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_timeline');
        if (!$oModule)
            $this->markTestSkipped('bx_timeline module is not installed.');

        $oTemplate = $oModule->_oTemplate;
        if ($oTemplate instanceof BxDolModuleProxy)
            $oTemplate = $this->bxGetProtected($oTemplate, '_oProxifiedObject', BxDolModuleProxy::class);

        $aParams = ['view' => BX_TIMELINE_VIEW_OUTLINE, 'type' => 'public', 'start' => 0, 'per_page' => 10];

        $s = $oTemplate->getLoadMore($aParams, true);
        $this->assertStringContainsString('<button class="bx-btn" onclick=', $s);
        $this->assertStringContainsString('display:block', $s);

        $s = $oTemplate->getLoadMore($aParams, false);
        $this->assertStringNotContainsString('<button', $s, 'Nothing more to load: no button at all.');
        $this->assertStringNotContainsString('bx-btn-disabled', $s);
        $this->assertStringContainsString('display:none', $s);
    }
}
