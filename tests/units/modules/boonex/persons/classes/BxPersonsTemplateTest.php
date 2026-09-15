<?php

/**
 * Profile-module template helpers via Persons.
 */
class BxPersonsTemplateTest extends BxPersonsTestCase
{
    public function testUnitClassAndSize()
    {
        $o = $this->bxTemplate();
        $aPerson = $this->bxSamplePerson();

        $this->assertSame('bx-base-pofile-unit', $this->bxCallProtected($o, '_getUnitClass', $aPerson, 'unit.html'));
        $this->assertSame('bx-base-pofile-unit-with-cover', $this->bxCallProtected($o, '_getUnitClass', $aPerson, 'unit_with_cover.html'));
        $this->assertSame('bx-base-pofile-unit-wo-info', $this->bxCallProtected($o, '_getUnitClass', $aPerson, 'unit_wo_info.html'));
        $this->assertSame(
            'bx-base-pofile-unit-with-cover bx-base-unit-showcase bx-base-pofile-unit-showcase',
            $this->bxCallProtected($o, '_getUnitClass', $aPerson, 'unit_with_cover_showcase.html')
        );
        $this->assertSame(
            'bx-base-pofile-unit-wo-info bx-base-unit-showcase bx-base-pofile-unit-wo-info-showcase',
            $this->bxCallProtected($o, '_getUnitClass', $aPerson, 'unit_wo_info_showcase.html')
        );

        $this->assertSame('ava', $this->bxCallProtected($o, '_getUnitSize', $aPerson, 'unit_with_cover.html'));
        $this->assertSame('thumb', $this->bxCallProtected($o, '_getUnitSize', $aPerson, 'unit.html'));
        $this->assertTrue($this->bxCallProtected($o, '_isUnitThumb', $aPerson, 'unit.html'));
        $this->assertTrue($this->bxCallProtected($o, '_isTemplateWithMeta', 'unit_with_cover.html'));
        $this->assertFalse($this->bxCallProtected($o, '_isTemplateWithMeta', 'unit.html'));
    }

    public function testGetBadgeLink()
    {
        $o = $this->bxTemplate();

        $this->assertSame('https://example.com/badge', $o->getBadgeLink($this->bxSamplePerson([
            'badge_link' => 'https://example.com/badge',
        ])));
        $this->assertSame('', $o->getBadgeLink($this->bxSamplePerson(['badge_link' => ''])));
    }

    public function testUnitCoverImageSettingsEmpty()
    {
        $o = $this->bxTemplate();
        $this->assertSame('', $this->bxCallProtected($o, '_getImageSettings', 'cover', '{"x":1}', 'unit_cover'));
    }

    public function testImageWithoutPicture()
    {
        $o = $this->bxTemplate();
        $aPerson = $this->bxSamplePerson(['picture' => 0]);

        $this->assertFalse($this->bxCallProtected($o, '_image', 'picture', 'bx_persons_thumb', 'no-picture-thumb.png', $aPerson, false));

        $sSub = $this->bxCallProtected($o, '_image', 'picture', 'bx_persons_thumb', 'no-picture-thumb.png', $aPerson, true);
        $this->assertNotSame('', $sSub);
        $this->assertIsString($sSub);
    }

    public function testUrlCoverWithoutSubstitute()
    {
        $s = $this->bxTemplate()->urlCover($this->bxSamplePerson(['cover' => 0]), false);
        $this->assertTrue($s === '' || $s === false);
    }

    public function testGetBadgeWithoutImage()
    {
        $this->assertSame('', $this->bxTemplate()->getBadge($this->bxSamplePerson(['badge' => 0])));
        $this->assertSame('', $this->bxTemplate()->getBadge(0));
    }

    public function testGetUnitThumbUrl()
    {
        $o = $this->bxTemplate();
        $aPerson = $this->bxSamplePerson(['picture' => 0]);

        $this->assertSame(
            $this->bxCallProtected($o, '_getUnitThumbUrl', 'thumb', $aPerson, false),
            $o->urlThumb($aPerson, false)
        );
        $this->assertSame(
            $this->bxCallProtected($o, '_getUnitThumbUrl', 'ava', $aPerson, false),
            $o->urlAvatar($aPerson, false)
        );
    }
}
