<?php

/**
 * Centered popups (alerts, confirms, popup forms) in Artificer: room for the shadow inside the scrolling
 * wrapper, and a minimum size. Read from template/css/tailwind.css itself.
 */
class PopupStylesTest extends \PHPUnit\Framework\TestCase
{
    private const CENTERED = '.bx-artificer .bx-popup-trans-wrapper:not(.bx-popup-with-pointer):not(.bx-popup-full-screen):not(.bx-popup-menu):not(.bx-popup-image-wrapper)';

    private static function rule(string $sSelector): string
    {
        $sCss = file_get_contents(__DIR__ . '/../../../template/css/tailwind.css');
        if ($sCss === false)
            self::fail('template/css/tailwind.css is not readable.');

        $bFound = preg_match('/^\s*' . preg_quote($sSelector, '/') . '\s*\{([^}]*)\}/m', $sCss, $aMatch);
        self::assertSame(1, $bFound, 'tailwind.css has a rule for ' . $sSelector);

        return $aMatch[1];
    }

    public function testCenteredPopupWrapperLeavesRoomForTheShadow(): void
    {
        // The wrapper has overflow-y: auto and clips outside its box; the popover shadow reaches about 20px
        // to the sides (the gap's mx-4 gives 16px), 8px up and 32px down.
        $this->assertStringContainsString('@apply px-1 pt-2 pb-8;', self::rule(self::CENTERED));
    }

    public function testDarkBackdropDimsThePage(): void
    {
        // A light gray backdrop in dark mode lifts the page above the popup, which then reads darker than blocks.
        $this->assertStringContainsString('dark:bg-gray-950', self::rule('.bx-artificer .bx-popup-fog'));
    }

    public function testCenteredPopupIsNeverNarrow(): void
    {
        $sPopup = self::rule(self::CENTERED . ' .bx-popup');
        $this->assertStringContainsString('md:min-w-[20rem]', $sPopup, 'Phones show these popups full width.');
        $this->assertStringContainsString('smooth-shadow-modal', $sPopup, 'Surface and drop shadow only: no edge on the dimmed backdrop.');
    }

    public function testDialogsAreCompactWithActionsAtTheEnd(): void
    {
        foreach (['alert' => 'ok', 'confirm' => 'yes', 'prompt' => 'ok'] as $sKind => $sPrimary) {
            $sHtml = file_get_contents(__DIR__ . '/../../../template/popup_trans_' . $sKind . '_cnt.html');
            $this->assertIsString($sHtml);

            // As tall as its text and buttons, 384px wide from sm up, 20px padding; the buttons end the dialog, the primary one last.
            $this->assertMatchesRegularExpression('/^<div class="bx-popup-dialog flex flex-col gap-5 w-full sm:w-96 max-w-full p-5">/', $sHtml, $sKind);
            $this->assertStringNotContainsString('min-h-', $sHtml, $sKind . ': no empty space between the text and the buttons.');
            $this->assertStringContainsString('id="bx-popup-' . $sKind . '-text" class="popup_' . $sKind . '_text text-start', $sHtml, $sKind . ': the text names the dialog.');
            $this->assertStringContainsString('class="popup_' . $sKind . '_actions flex justify-end gap-2"', $sHtml, $sKind);
            $this->assertMatchesRegularExpression('/<button class="bx-btn bx-btn-primary min-w-20 popup_' . $sKind . '_' . $sPrimary . '" type="button">[^<]*<bx_text:_\w+ \/><\/button>\s*<\/div>/', $sHtml, $sKind . ': the primary button is the last one.');
            $this->assertSame(1, substr_count($sHtml, 'bx-btn-primary'), $sKind);
            $this->assertStringNotContainsString('text-center', $sHtml, $sKind);
        }

        $sFunctions = file_get_contents(__DIR__ . '/../../../template/scripts/BxBaseFunctions.php');
        foreach (['alert' => 'alertdialog', 'confirm' => 'alertdialog'] as $sKind => $sRole)
            $this->assertMatchesRegularExpression("/transBox\\('bx-popup-" . $sKind . "', \\[.*?'wrapper_role' => '" . $sRole . "',\\s*'wrapper_attrs' => 'aria-labelledby=\"bx-popup-" . $sKind . "-text\"'/s", $sFunctions, $sKind);
        $this->assertStringContainsString("'wrapper_attrs' => 'aria-labelledby=\"bx-popup-prompt-text\"'", $sFunctions);

        $sJs = file_get_contents(__DIR__ . '/../../../inc/js/jquery.dolPopup.js');
        $this->assertStringContainsString("oInput.trigger('focus').trigger('select');", $sJs, 'A prompt opens with its field focused.');
        $this->assertStringContainsString("if(oEvent.key != 'Enter' || oEvent.isComposing)", $sJs, 'Enter in the field is OK, not while composing text.');

        $this->assertStringContainsString('@apply hidden;', self::rule('.bx-artificer .bx-popup:has(.bx-popup-dialog) > .bx-popup-close-wrapper'), 'Dialogs have their own buttons: no phone close row.');
    }
}
