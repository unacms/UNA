<?php

/**
 * A Studio block's actions sit in its caption, beside the title; what narrows or orders its content (selects, filters, search) goes
 * in the row under it. The page builder is the first block arranged this way.
 */
class BlockCaptionControlsTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testCaptionHasAPlaceForControls(): void
    {
        $this->assertStringContainsString("<bx_if:show_controls>\n        <div class=\"bx-std-bcap-controls\">__controls__</div>\n    </bx_if:show_controls>", self::read('studio/template/block_caption.html'));

        $s = self::read('studio/template/scripts/BxBaseStudioWidget.php');
        $this->assertStringContainsString('public function getBlockCaptionControls($aBlock)', $s);
        $this->assertStringContainsString("'bx_if:show_controls' => [\n                'condition' => \$sControls != '',", $s);
    }

    public function testPageBuilderKeepsActionsInTheCaptionAndSelectsBelow(): void
    {
        $sPanel = self::read('studio/template/bp_block_panel_top.html');
        $this->assertStringContainsString('__selector_pages__', $sPanel);
        $this->assertStringNotContainsString('<button', $sPanel, 'No actions beside the selects.');

        $sControls = self::read('studio/template/bp_block_caption_controls.html');
        foreach (['__action_page_create__', '__action_block_create__', '__url_view__', '__action_page_edit__', 'deletePage()'] as $sAction)
            $this->assertStringContainsString($sAction, $sControls);
        $this->assertSame(substr_count($sControls, '<button'), substr_count($sControls, '<button type="button"'));

        $this->assertStringContainsString("parseHtmlByName('bp_block_caption_controls.html', \$this->_getTmplVarsBlockPanelTop())", self::read('studio/template/scripts/BxBaseStudioBuilderPage.php'));
    }

    public function testControlsAreARowOfButtonsThatWrapsOnPhones(): void
    {
        $s = self::read('studio/template/css/page.css');

        $this->assertMatchesRegularExpression('/\ndiv\.bx-std-bcap-controls \{\n    display: flex;\n    flex: none;\n    align-items: center;\n    justify-content: flex-end;\n    gap: 0\.5rem;\n\}/', $s);
        $this->assertMatchesRegularExpression('/div\.bx-std-block-caption:has\(> \.bx-std-bcap-controls\) \{\n        flex-wrap: wrap;/', $s);
    }
}
