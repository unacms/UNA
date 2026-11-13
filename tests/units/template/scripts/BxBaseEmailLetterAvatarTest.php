<?php

/**
 * Letter avatar for emails: a profile without a picture gets its initial on its colour in
 * plain inline-styled HTML, because email clients refuse the SVG no-picture image.
 */
class BxBaseEmailLetterAvatarTest extends BxDolTestCase
{
    private function profile(string $sName, int $iId = 7)
    {
        return new class($sName, $iId) {
            public function __construct(private string $sName, private int $iId) {}
            public function getDisplayName() { return $this->sName; }
            public function id() { return $this->iId; }
        };
    }

    private function avatar(string $sName, int $iId = 7): string
    {
        return BxTemplFunctions::getInstance()->getEmailLetterAvatar($this->profile($sName, $iId));
    }

    private function letter(string $sHtml): string
    {
        $this->assertSame(1, preg_match('#<td[^>]*>(.*)</td>#su', $sHtml, $a), 'One cell holds the letter.');
        return $a[1];
    }

    public function testFirstLetterIsUppercased(): void
    {
        $this->assertSame('T', $this->letter($this->avatar('thomlin')));
        $this->assertSame('É', $this->letter($this->avatar('élodie')), 'A multibyte first letter is kept whole.');
        $this->assertSame('Ω', $this->letter($this->avatar('ωmega')));
        $this->assertSame('漢', $this->letter($this->avatar('漢字')));
        $this->assertSame('L', $this->letter($this->avatar('  lily ')), 'Leading spaces are skipped.');
    }

    public function testLetterIsEscapedOnce(): void
    {
        $this->assertSame('&amp;', $this->letter($this->avatar('&amp; Co')), 'A stored entity is decoded before it is escaped.');
        $this->assertSame('&lt;', $this->letter($this->avatar('<script>')));
        $this->assertSame('&quot;', $this->letter($this->avatar('"quoted"')));
    }

    public function testEmptyNameShowsAQuestionMark(): void
    {
        $this->assertSame('?', $this->letter($this->avatar('')));
    }

    public function testMarkupIsEmailSafe(): void
    {
        $sHtml = $this->avatar('thomlin');

        foreach (['<img', '<svg', 'class=', '<style', 'url(', 'rgba('] as $s)
            $this->assertStringNotContainsString($s, $sHtml);

        foreach (['width: 48px', 'height: 48px', 'line-height: 48px', 'border-radius: 50%', 'color: #ffffff', 'text-align: center', 'font-family: Arial, Helvetica, sans-serif', 'font-size: 20px', 'font-weight: bold'] as $s)
            $this->assertStringContainsString($s, $sHtml);

        $this->assertMatchesRegularExpression('/background-color: #[0-9a-f]{6};/', $sHtml);
    }

    public function testColourIsTheSiteColourKeptReadable(): void
    {
        $fnLuminance = function (array $aRgb): float {
            $a = array_map(fn($i) => ($f = $i / 255) <= 0.04045 ? $f / 12.92 : pow(($f + 0.055) / 1.055, 2.4), $aRgb);
            return 0.2126 * $a[0] + 0.7152 * $a[1] + 0.0722 * $a[2];
        };

        $iSame = 0;
        $iCount = count(BxDolTemplate::getColorPalette());
        for ($iId = 0; $iId < $iCount; $iId++) {
            preg_match('/background-color: #([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2});/', $this->avatar('Name', $iId), $a);
            $aRgb = [hexdec($a[1]), hexdec($a[2]), hexdec($a[3])];
            $aSite = array_slice(BxDolTemplate::getColorCode($iId), 0, 3);

            $this->assertGreaterThanOrEqual(3, 1.05 / ($fnLuminance($aRgb) + 0.05), "White on the colour of profile $iId is readable.");
            if ($aRgb == $aSite)
                $iSame++;
            else
                foreach ([0, 1, 2] as $i)
                    $this->assertLessThanOrEqual($aSite[$i], $aRgb[$i], "Profile $iId: only a darker shade of the site colour.");
        }

        $this->assertGreaterThan(0, $iSame, 'Colours that are readable already stay as on the site.');
        $this->assertSame($this->avatar('A', 12), $this->avatar('A', 12), 'One profile, one colour.');
    }

    public function testNoProfileNoAvatar(): void
    {
        $this->assertSame('', BxTemplFunctions::getInstance()->getEmailLetterAvatar(null));
    }
}
