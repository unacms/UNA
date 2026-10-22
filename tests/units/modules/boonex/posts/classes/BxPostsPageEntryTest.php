<?php

/**
 * Entry page meta image, sent to NEO as the page JSON `image` (og:image).
 */
class BxPostsPageEntryTest extends BxPostsTestCase
{
    protected function bxPage(array $aContentInfo, $sViewResult, $mixedImage)
    {
        bx_import('PageEntry', $this->_oModule->_aModule);

        $oModule = $this->getMockBuilder(get_class($this->_oModule))
            ->disableOriginalConstructor()
            ->onlyMethods(['checkAllowedView', 'getEntryImageData'])
            ->getMock();
        $oModule->method('checkAllowedView')->willReturn($sViewResult);
        $oModule->expects($sViewResult === CHECK_ACTION_RESULT_ALLOWED && $aContentInfo ? $this->once() : $this->never())
            ->method('getEntryImageData')
            ->willReturn($mixedImage);

        $oPage = (new ReflectionClass('BxPostsPageEntry'))->newInstanceWithoutConstructor();
        $this->bxSetProtected($oPage, '_oModule', $oModule, BxBaseModGeneralPageEntry::class);
        $this->bxSetProtected($oPage, '_aContentInfo', $aContentInfo, BxBaseModGeneralPageEntry::class);

        return $oPage;
    }

    public function testNoContentGivesNoImage()
    {
        $oPage = $this->bxPage([], CHECK_ACTION_RESULT_ALLOWED, ['id' => 1, 'object' => 'bx_posts_covers']);

        $this->assertSame('', $this->bxCallProtected($oPage, '_getPageMetaImage'));
    }

    public function testHiddenEntryDoesNotLeakImage()
    {
        $oPage = $this->bxPage($this->bxSamplePost(['thumb' => 300]), 'Access denied', ['id' => 300, 'object' => 'bx_posts_covers']);

        $this->assertSame('', $this->bxCallProtected($oPage, '_getPageMetaImage'));
    }

    public function testEntryWithoutImage()
    {
        $oPage = $this->bxPage($this->bxSamplePost(), CHECK_ACTION_RESULT_ALLOWED, false);

        $this->assertSame('', $this->bxCallProtected($oPage, '_getPageMetaImage'));
    }

    public function testVisibleEntryAsksForItsImage()
    {
        $oPage = $this->bxPage($this->bxSamplePost(['thumb' => 300]), CHECK_ACTION_RESULT_ALLOWED, ['id' => 300, 'transcoder' => 'bx_posts_cover']);

        $this->assertIsString($this->bxCallProtected($oPage, '_getPageMetaImage'));
    }
}
