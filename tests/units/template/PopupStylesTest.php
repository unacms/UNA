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

    public function testCenteredPopupHasAMinimumSize(): void
    {
        $sPopup = self::rule(self::CENTERED . ' .bx-popup');
        $this->assertStringContainsString('min-h-[10rem]', $sPopup);
        $this->assertStringContainsString('md:min-w-[20rem]', $sPopup, 'Phones show these popups full width.');
        $this->assertStringContainsString('flex-col', $sPopup);

        $this->assertStringContainsString('@apply my-auto;', self::rule(self::CENTERED . ' .bx-popup-content'), 'Short content is centred in the minimum height.');
    }
}
