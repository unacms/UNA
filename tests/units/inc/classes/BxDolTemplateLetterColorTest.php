<?php

/**
 * Letter avatars are a white letter on the name's colour (BxDolTemplate::getColorCode): every colour passes WCAG AA
 * with white (4.5:1), so the palette's lime and yellow are darkened.
 */
class BxDolTemplateLetterColorTest extends BxDolTestCase
{
    public function testEveryNameColourPassesAaWithWhite()
    {
        $iCount = count(BxDolTemplate::getColorPalette());
        for ($i = 0; $i < $iCount; $i++) {
            $aRgb = array_slice(BxDolTemplate::getColorCode($i), 0, 3);
            $this->assertGreaterThanOrEqual(4.5, BxDolTemplate::getContrastWithWhite($aRgb), 'colour ' . $i . ': rgb(' . implode(', ', $aRgb) . ')');
        }
    }

    public function testDarkColoursStayAsTheyAre()
    {
        $this->assertSame([10, 61, 143], BxDolTemplate::getColorForWhiteText([10, 61, 143]));
    }

    public function testLimeIsDarkenedKeepingItsHue()
    {
        $aRgb = BxDolTemplate::getColorForWhiteText([209, 211, 0]);

        $this->assertGreaterThanOrEqual(4.5, BxDolTemplate::getContrastWithWhite($aRgb));
        $this->assertSame(0, $aRgb[2], 'still no blue');
        $this->assertLessThanOrEqual(2, abs($aRgb[0] - $aRgb[1]), 'red and green as balanced as before');
    }

    public function testContrastOfKnownColours()
    {
        $this->assertEqualsWithDelta(1.0, BxDolTemplate::getContrastWithWhite([255, 255, 255]), 0.001);
        $this->assertEqualsWithDelta(21.0, BxDolTemplate::getContrastWithWhite([0, 0, 0]), 0.001);
    }

    public function testOpacityIsAdded()
    {
        $this->assertCount(4, BxDolTemplate::getColorCode(3, 1.0));
        $this->assertSame(1.0, BxDolTemplate::getColorCode(3, 1.0)[3]);
    }
}
