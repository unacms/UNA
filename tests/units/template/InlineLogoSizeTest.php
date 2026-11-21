<?php

/**
 * SVG code pasted as the logo or the mark (Studio > Designer > Logo) is as tall as the header's logo height and as wide
 * as its viewBox makes it, also when the SVG has a viewBox only: `max-height: 100%` alone gave such an SVG no size.
 */
class InlineLogoSizeTest extends BxDolTestCase
{
    public function testInlineSvgTakesTheWrapperHeight(): void
    {
        $sCss = str_replace("\r\n", "\n", (string)file_get_contents(__DIR__ . '/../../../modules/boonex/artificer/data/template/system/css/general.css'));
        $this->assertSame(1, preg_match('/\.bx-toolbar-item\.bx-ti-logo \.bx-logo-inline svg \{([^}]*)\}/', $sCss, $aMatch));

        // inherit, not 100%: the wrapper is an inline span unless a class makes it a block
        $this->assertStringContainsString('height: inherit;', $aMatch[1]);
        $this->assertStringContainsString('width: auto;', $aMatch[1]);
    }

    public function testWrapperHasTheLogoHeight(): void
    {
        $sHtml = (string)file_get_contents(__DIR__ . '/../../../modules/boonex/artificer/data/template/system/logo_main.html');
        $this->assertSame(2, substr_count($sHtml, '<span class="bx-logo-inline __class__" style="height: __height__">'), 'The logo and the mark.');
    }
}
