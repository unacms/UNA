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

    public function testCenteredPopupIsNeverNarrow(): void
    {
        $this->assertStringContainsString('md:min-w-[20rem]', self::rule(self::CENTERED . ' .bx-popup'), 'Phones show these popups full width.');
    }

    public function testDialogsAreTallPaddedAndStartAligned(): void
    {
        foreach (['alert', 'confirm', 'prompt'] as $sKind) {
            $sHtml = file_get_contents(__DIR__ . '/../../../template/popup_trans_' . $sKind . '_cnt.html');
            $this->assertIsString($sHtml);

            // Text at the top, buttons at the bottom of at least 240px, 16px padding on phones and 20px from sm up.
            $this->assertMatchesRegularExpression('/^<div class="bx-popup-dialog flex flex-col justify-between gap-4 min-h-60 p-4 sm:p-5">/', $sHtml, $sKind);
            $this->assertStringContainsString('class="popup_' . $sKind . '_text text-start"', $sHtml, $sKind . ': text starts at the start edge.');
            $this->assertStringContainsString('class="popup_' . $sKind . '_actions flex justify-start gap-2"', $sHtml, $sKind . ': buttons start at the start edge, no padding of their own.');
            $this->assertStringNotContainsString('text-center', $sHtml, $sKind);
        }

        $this->assertStringContainsString('@apply hidden;', self::rule('.bx-artificer .bx-popup:has(.bx-popup-dialog) > .bx-popup-close-wrapper'), 'Dialogs have their own buttons: no phone close row.');
    }
}
