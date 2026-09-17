<?php

/**
 * Content-module template helpers via Posts.
 */
class BxPostsTemplateTest extends BxPostsTestCase
{
    public function testUnitNameClassAndHtmlId()
    {
        $o = $this->bxTemplate();
        $aPost = $this->bxSamplePost();

        $this->assertSame('unit', $this->bxCallProtected($o, '_getUnitName', $aPost, 'unit.html'));
        $this->assertSame('unit_gallery', $this->bxCallProtected($o, '_getUnitName', $aPost, 'unit_gallery.html'));
        $this->assertSame('', $this->bxCallProtected($o, '_getUnitClass', $aPost, 'unit.html'));
        $this->assertSame(
            'bx-base-unit-showcase bx-base-text-unit-showcase bx-def-margin-sec-bottom',
            $this->bxCallProtected($o, '_getUnitClass', $aPost, 'unit_showcase.html')
        );
        $this->assertSame('bx-posts-unit-15', $this->bxCallProtected($o, '_getUnitHtmlId', $aPost, 'unit.html'));
    }

    public function testHeaderImageParams()
    {
        $a = $this->bxCallProtected($this->bxTemplate(), '_getHeaderImageParams');

        $this->assertSame('thumb', $a['field']);
        $this->assertSame('thumb_data', $a['field_position']);
        $this->assertSame('bx_posts_covers', $a['storage']);
        $this->assertSame(['bx_posts_html5'], $a['uploaders']);
        $this->assertSame('bx_posts_cover', $a['transcoder_cover']);
    }

    public function testCheckPrivacySkippedReturnsEmpty()
    {
        $s = $this->bxCallProtected(
            $this->bxTemplate(),
            'checkPrivacy',
            $this->bxSamplePost(),
            false,
            $this->_oModule
        );
        $this->assertSame('', $s);
    }

    public function testMediaExifEmpty()
    {
        $this->assertSame('', $this->_oModule->_oTemplate->mediaExif([]));
        $this->assertSame('', $this->_oModule->_oTemplate->mediaExif(['exif' => serialize(['Model' => 'X'])]));
    }

    public function testGetUnitThumbAndGalleryWithoutThumb()
    {
        [$sThumb, $sGallery] = $this->bxCallProtected(
            $this->bxTemplate(),
            'getUnitThumbAndGallery',
            $this->bxSamplePost(['thumb' => 0])
        );
        $this->assertSame('', $sThumb);
        $this->assertSame('', $sGallery);
    }

    public function testAuthorAddonEmpty()
    {
        $this->assertSame('', $this->_oModule->_oTemplate->getAuthorAddon($this->bxSamplePost(), null));
    }
}
