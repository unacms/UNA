<?php

/**
 * The default loading indicator is the orb alone on a round, half-transparent plate that blurs what is behind it.
 * No text shows with it: the "Please wait" of the transition pages (after signing in or out) is for screen readers.
 */
class LoadingOrbPlateTest extends BxDolTestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r\n", "\n", $s);
    }

    public static function styles(): array
    {
        return [
            'base' => ['template/css/common.css'],
            'artificer' => ['modules/boonex/artificer/data/template/system/css/common.css'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('styles')]
    public function testOrbSitsOnARoundBlurredPlate(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertSame(1, preg_match('/\n\.bx-loading-orb \{\n    box-sizing: content-box;[^}]*\}/', $s, $a), 'The plate rule.');
        $sRule = $a[0];

        $this->assertStringContainsString('border-radius: 9999px;', $sRule);
        $this->assertStringContainsString('corner-shape: round;', $sRule, 'A circle with smooth corners on too.');
        $this->assertStringContainsString('background-color: rgb(255 255 255 / 0.5);', $sRule);
        $this->assertStringContainsString('backdrop-filter: blur(8px);', $sRule);
        $this->assertStringContainsString('-webkit-backdrop-filter: blur(8px);', $sRule);

        $this->assertSame(1, preg_match('/padding: (\d+)px;\n    margin: -(\d+)px;/', $sRule, $aBox), 'The margin takes the padding back.');
        $this->assertSame($aBox[1], $aBox[2], 'The orb\'s box keeps its size.');

        $this->assertMatchesRegularExpression('/html\.dark \.bx-loading-orb \{\n    background-color: rgb\(\d+ \d+ \d+ \/ 0\.5\);\n\}/', $s);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('styles')]
    public function testOrbInAButtonHasNoPlate(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertMatchesRegularExpression('/\.bx-loading-ajax-btn \.bx-loading-orb,\nhtml\.dark \.bx-loading-ajax-btn \.bx-loading-orb \{\n    padding: 0;\n    margin: 0;\n    background-color: transparent;\n    -webkit-backdrop-filter: none;\n    backdrop-filter: none;\n\}/', $s);
    }

    public static function transitions(): array
    {
        return [['member.php'], ['logout.php'], ['template/scripts/BxBaseServiceLogin.php']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('transitions')]
    public function testTransitionPagesShowNoText(string $sPath): void
    {
        $s = self::read($sPath);

        $this->assertStringNotContainsString("MsgBox(_t('_Please Wait'))", $s);
        $this->assertStringContainsString("parseHtmlByName('transition_wait.html', ['text' => _t('_Please Wait')])", $s);
    }

    public function testWaitTextIsForScreenReaders(): void
    {
        $this->assertSame('<span class="sr-only">__text__</span>', trim(self::read('template/transition_wait.html')));
    }
}
