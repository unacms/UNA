<?php

/**
 * Studio buttons and single-line fields follow the site's and NEO's control scale (template/css/tailwind.css): small 36px is the default (toolbars,
 * grid rows, cards, captions), regular 44px is a form's and a dialog's (the login box too), and .bx-btn-small, -mini and -large keep theirs anywhere.
 */
class ControlSizesTest extends BxDolTestCase
{
    private const REGULAR = '.bx-std :where(form, .bx-std-login-form, #bx-popup-alert, #bx-popup-confirm, #bx-popup-prompt)';
    private const NOT_SIZED = ':where(:not(.bx-btn-small, .bx-btn-mini, .bx-btn-large, .bx-btn-xlarge))';

    private static function css(): string
    {
        $s = file_get_contents(__DIR__ . '/../../../template/css/tailwind.css');
        if ($s === false)
            self::fail('tailwind.css is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    private static function rule(string $sCss, string $sSelectors): string
    {
        $i = strpos($sCss, $sSelectors . ' {');
        if ($i === false)
            self::fail('No rule for ' . $sSelectors);

        $i += strlen($sSelectors) + 2;
        return substr($sCss, $i, strpos($sCss, "\n    }", $i) - $i);
    }

    public function testButtonsAreSmallByDefault(): void
    {
        $this->assertStringContainsString('@apply inline-flex items-center justify-center h-9 min-h-9 px-3 py-0 rounded-lg;', self::rule(self::css(), '    .bx-std .bx-btn'));
    }

    public function testFormsAndDialogsUseRegular(): void
    {
        $s = self::css();

        $this->assertStringContainsString('@apply h-11 min-h-11 px-4 rounded-xl text-base leading-6;', self::rule($s, '    ' . self::REGULAR . ' .bx-btn' . self::NOT_SIZED));
        $this->assertStringContainsString('@apply h-11 leading-6;', $s);
        $this->assertSame(11, substr_count($s, self::REGULAR), 'Buttons, icon-only buttons, hit areas, fields, password fields, sets and select2 fields name the same contexts.');
    }

    public function testThirtySixPixelControlsHave24pxGlyphs(): void
    {
        $s = self::css();

        // icon-only buttons (16px in a mini one), the header's toolbar and search buttons, the sidebar's tile buttons and font icons
        $this->assertStringContainsString("    .bx-std .bx-btn.bx-btn-icon svg {\n        @apply w-6 h-6;", $s);
        $this->assertStringContainsString("    .bx-std .bx-btn:has(> div:only-child > svg:only-child) svg {\n        @apply w-6 h-6 leading-6 text-[24px];", $s);
        $this->assertStringContainsString("    .bx-std .bx-btn.bx-btn-mini:has(> div:only-child > svg:only-child) svg {\n        @apply w-4 h-4 leading-4 text-[16px];", $s);
        $this->assertStringContainsString("    .bx-std .bx-menu-toolbar .bx-menu-tab-item svg,\n    .bx-std .bx-std-search-trigger svg {\n        @apply w-6 h-6;", $s);
        $this->assertStringContainsString('@apply flex items-center justify-center text-[24px] leading-6;', $s);

        $sTop = str_replace("\r\n", "\n", file_get_contents(__DIR__ . '/../../../studio/template/css/menu_top.css'));
        $this->assertStringContainsString("/* Launcher button: a 24px glyph in a 36px button, like the toolbar. */", $sTop);
        $this->assertMatchesRegularExpression('/bx-std-header-btn img \{\s*display: block;\s*width: 1\.5rem;\s*height: 1\.5rem;/', $sTop);
    }

    public function testSelect2FieldsMatchTheNativeOnes(): void
    {
        $s = self::css();

        // the Pages builder's page pickers: 36px beside the toolbar's buttons, 44px with 16px text and 12px corners in a form or a dialog
        $this->assertStringContainsString('    @apply h-9 rounded-lg border-0 text-sm font-medium bg-no-repeat;', $s);
        $this->assertStringContainsString("    @apply p-0 leading-9 text-inherit;", $s);
        $this->assertStringContainsString(self::REGULAR . " .select2-container .select2-selection--single,", $s);
        $this->assertStringContainsString("    @apply h-11 rounded-xl text-base;", $s);
    }

    public function testPageSettingsSidebarFitsItsTiles(): void
    {
        $s = str_replace("\r\n", "\n", file_get_contents(__DIR__ . '/../../../studio/template/css/builder_page.css'));

        // 52px rows round the 36px tiles; the grid row is the sidebar's own height: 7 x 52 + 6 x 2 + 2 x 8 = 392px
        $this->assertMatchesRegularExpression('/div\.adm-bp-epf-left div\.bx-std-pmen-item \{[^}]*height: 3\.25rem;/', $s);
        $this->assertStringContainsString('grid-template-rows: minmax(0, 24.5rem) auto;', $s);
    }

    public function testExplicitSizesWin(): void
    {
        $s = self::css();

        $this->assertStringContainsString('@apply h-7 min-h-7 px-2.5 rounded-md text-xs leading-4;', self::rule($s, '    .bx-std .bx-btn.bx-btn-mini'));
        $this->assertStringContainsString('@apply h-[3.25rem] min-h-[3.25rem] px-6 rounded-xl text-base leading-6;', self::rule($s, '    .bx-std .bx-btn.bx-btn-large'));
    }

    public function testHitAreasStillReach44px(): void
    {
        $s = self::css();

        // a small button (36px) grows 4px each way through the shared hit area rule, a mini one (28px) 8px; regular and large already are 44px or more
        $this->assertStringContainsString("    .bx-std .bx-btn::before,\n    .bx-std .bx-std-header-btn::before,", $s);
        $this->assertStringContainsString("        position: absolute;\n        inset: -0.25rem; /* 36px → 44px */", $s);
        $this->assertStringContainsString("    .bx-std .bx-btn.bx-btn-mini::before {\n        inset: -0.5rem;", $s);
        $this->assertStringContainsString(self::REGULAR . ' .bx-btn' . self::NOT_SIZED . "::before,\n    .bx-std .bx-btn.bx-btn-large::before {\n        inset: 0;", $s);
    }

    public function testFieldsAreAsTallAsTheButtons(): void
    {
        $s = self::css();

        $this->assertStringContainsString("    .bx-std .bx-form-input-wrapper-password {\n        @apply h-9 py-0 leading-5;", $s);
        $this->assertStringNotContainsString('@apply h-8 py-0 leading-5;', $s, 'No 32px fields are left.');
    }

    public function testHeaderControlsAreSmall(): void
    {
        $s = str_replace("\r\n", "\n", file_get_contents(__DIR__ . '/../../../studio/template/css/menu_top.css'));

        // 16px round the 36px tiles and buttons: a 68px bar, the block captions' height, with 24px corners = the tiles' 8px + the 16px padding
        $this->assertMatchesRegularExpression('/div\.bx-std-menu-top-gap \{[^}]*padding: 1rem;\s*border-radius: 1\.5rem;/', $s);
        $this->assertMatchesRegularExpression('/div\.bx-std-menu-top-wrp \{[^}]*height: 5\.75rem;/', $s, 'The wrapper: the bar and 12px above and below.');
        $this->assertMatchesRegularExpression('/div\.bx-std-menu-top \.bx-menu-toolbar li \{[^}]*height: 2\.25rem;\s*min-width: 2\.25rem;/', $s);
        $this->assertMatchesRegularExpression('/div\.bx-std-menu-top \.bx-menu-top-center li \{[^}]*width: 2\.25rem;[^}]*height: 2\.25rem;/', $s);
        $this->assertDoesNotMatchRegularExpression('/(?<![\d.])(width|height|min-width): 2rem;/', $s, 'No 32px header control is left.');

        $sBreadcrumb = file_get_contents(__DIR__ . '/../../../studio/template/page_breadcrumb.html');
        $this->assertSame(3, substr_count($sBreadcrumb, 'justify-center w-9 h-9 rounded-lg'), 'The launcher button and the current app tile.');
        $this->assertStringNotContainsString('h-8', $sBreadcrumb);

        // the shared hit area grows a 36px control to 44px
        $this->assertStringContainsString("        content: '';\n        position: absolute;\n        inset: -0.25rem; /* 36px → 44px */", self::css());
    }

    public function testContentStartsUnderThe68pxBar(): void
    {
        // 12px margin + the 68px bar, and 12px more before the columns
        $this->assertMatchesRegularExpression('/padding-top: 5rem;[^\n]*\n\s*scroll-padding-top: 5rem;/', str_replace("\r\n", "\n", file_get_contents(__DIR__ . '/../../../studio/template/css/general.css')));
        $this->assertStringContainsString('padding: 5.75rem 0.75rem 0.75rem 0.75rem;', file_get_contents(__DIR__ . '/../../../studio/template/css/page_columns.css'));
    }

    public function testBlockCaptionMatchesTheBar(): void
    {
        $s = str_replace("\r\n", "\n", file_get_contents(__DIR__ . '/../../../studio/template/css/page.css'));

        // 16px round a 36px row: 68px like the header bar, the row's 8px corners concentric with the block's 24px
        $this->assertMatchesRegularExpression('/div\.bx-std-block-caption \{[^}]*padding: 1rem;/', $s);
        $this->assertMatchesRegularExpression('/\.bx-std-bcap-text \{[^}]*line-height: 2\.25rem;/', $s);
    }
}
