<?php

/**
 * The sign-in block reads the same on the site and in NEO: field labels are 14px medium in gray-700 (gray-300 in dark), text links
 * take the accent pair (blue-700, blue-300 in dark), "Forgot password?" comes after the Password field in the page on both, and the
 * splash illustration never outgrows its column. Read from the CSS, template and settings files, so a value changed on one side only
 * fails here.
 */
class SignInBlockParityTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public function testFieldLabelsMatch(): void
    {
        $this->assertMatchesRegularExpression('/\.bx-artificer \.bx-form-caption,\s*\.bx-artificer \.bx-form-row-view-caption \{\s*@apply text-gray-700 dark:text-gray-300 text-sm font-medium;/', self::read('template/css/tailwind.css'));

        $this->assertStringContainsString("'font-medium text-sm text-neutral-700 dark:text-neutral-300'", self::read('neo/packages/app/settings/forms.js'), 'NEO\'s label above a field: the site\'s weight, size and colours.');
    }

    public function testDarkTextLinksTakeTheAccentPair(): void
    {
        $sCss = self::read('template/css/tailwind.css');

        $this->assertStringContainsString("    .bx-artificer .bx-def-a-colored {\n        @apply text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200;", $sCss);
        $this->assertMatchesRegularExpression('/\.bx-artificer form a:not\(\.bx-btn\),[^{]*\{\s*@apply font-normal text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200;/', $sCss, 'Links in forms ("Forgot password?").');
        $this->assertStringContainsString('dark:prose-a:text-blue-300', $sCss, 'Links in rich text.');
        $this->assertStringNotContainsString('text-blue-400', $sCss, 'No text keeps the old dark link colour.');

        foreach (['block_login.html', 'block_join.html'] as $sFile)
            $this->assertStringContainsString('text-blue-700 dark:text-blue-300 hover:underline', self::read('modules/boonex/artificer/data/template/system/' . $sFile), $sFile . ': the link to the other form.');

        // NEO's links are text-accent-foreground
        $sSchemes = self::read('neo/packages/app/design/styles/palette-schemes.css');
        $this->assertStringContainsString('--accent-foreground: var(--accent-700);', $sSchemes);
        $this->assertStringContainsString('--accent-foreground: var(--accent-300);', $sSchemes);
    }

    public function testForgotPasswordComesAfterThePasswordField(): void
    {
        // The site orders the link's row before the Password row; it stays after it in the page.
        $this->assertMatchesRegularExpression('/> #bx-form-element-submit_text \{[^}]*\border: 1;[^}]*height: 0;/', self::read('modules/boonex/artificer/data/template/system/css/general.css'));

        // NEO on web draws the link after the control and lifts it onto the label's line.
        $sField = self::read('neo/packages/app/components/form-fields/_field.js');
        $this->assertStringContainsString('const captionAccessory = captionAccessoryProp ?? (isWeb ? null : linkOnLabelLine)', $sField, 'On web the link is not in the label\'s row, which is before the input.');
        $this->assertMatchesRegularExpression('/\{linkLifted \? \([^<]*<View className="absolute end-0 bottom-full /', $sField);
        $this->assertGreaterThan(strpos($sField, 'const control = ('), strpos($sField, '{linkLifted ? ('), 'Inside the control, after the input.');
        $this->assertStringNotContainsString('tabIndex', $sField, 'The order comes from the page, not from tabindex.');
    }

    public function testNeoSplashIllustrationStaysInItsColumn(): void
    {
        $this->assertStringContainsString('<View className="aspect-square w-48 max-w-full">', self::read('neo/packages/app/ui/molecules/sections/splash-parts.tsx'), '12rem grows with the text size: capped at the column, and square.');

        // The built-in splash and the join page draw theirs the same way.
        $sStatic = self::read('neo/packages/app/default/static.js');
        $this->assertSame(2, substr_count($sStatic, '<View className="aspect-square w-48 max-w-full">'));
        $this->assertStringNotContainsString('h-48 w-48', $sStatic);
    }
}
