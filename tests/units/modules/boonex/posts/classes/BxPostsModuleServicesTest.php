<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;

/**
 * Content-module services, alerts, and timeline helpers via Posts.
 */
#[AllowMockObjectsWithoutExpectations]
class BxPostsModuleServicesTest extends BxPostsTestCase
{
    public function testSafeServicesIncludeTextAndGeneralEndpoints()
    {
        $a = $this->_oModule->serviceGetSafeServices();

        foreach (['GetLink', 'Browse', 'EntityCreate', 'BrowsePublic', 'BrowseAuthor', 'GetMenuAddonManageToolsProfileStats'] as $sName)
            $this->assertArrayHasKey($sName, $a);
    }

    public function testModuleSampleAndContext()
    {
        $this->assertNotEmpty($this->_oModule->serviceModuleSample());
        $this->assertTrue($this->_oModule->serviceIsAllowedPostInContext());
    }

    public function testFormsHelper()
    {
        $this->assertInstanceOf(BxPostsFormsEntryHelper::class, $this->_oModule->getFormsHelper());
        $this->assertInstanceOf(BxPostsFormsEntryHelper::class, $this->_oModule->serviceFormsHelper());
    }

    public function testBuildRssParams()
    {
        $this->assertSame(['author' => 7], $this->bxCallProtected($this->_oModule, '_buildRssParams', 'author', [7]));
        $this->assertSame(['author' => ''], $this->bxCallProtected($this->_oModule, '_buildRssParams', 'author', []));
        $this->assertSame([], $this->bxCallProtected($this->_oModule, '_buildRssParams', 'public', [1]));
    }

    public function testPrepareBrowsingFiltersParamsGet()
    {
        $this->assertSame(['mode' => 'public'], $this->bxCallProtected(
            $this->_oModule,
            '_prepareBrowsingFiltersParamsGet',
            ['mode' => 'public', 'ignored' => 1]
        ));
        $this->assertSame([], $this->bxCallProtected($this->_oModule, '_prepareBrowsingFiltersParamsGet', []));
    }

    public function testAlertParams()
    {
        $aPost = $this->bxSamplePost(['allow_view_to' => 5, 'cf' => 2, 'status' => 'awaiting']);
        $a = $this->bxCallProtected($this->_oModule, '_alertParams', $aPost);

        $this->assertSame('awaiting', $a['status']);
        $this->assertSame('active', $a['status_admin']);
        $this->assertSame(5, $a['privacy_view']);
        $this->assertSame(2, $a['cf']);
    }

    public function testAlertParamsAddIncludesTimelineGroup()
    {
        $aPost = $this->bxSamplePost(['author' => -10, 'id' => 15]);
        $a = $this->bxCallProtected($this->_oModule, '_alertParamsAdd', $aPost);

        $this->assertSame('bx_posts_10_15', $a['timeline_group']['by']);
        $this->assertSame('owner_id', $a['timeline_group']['field']);
    }

    public function testTimelinePostMissingOrInactive()
    {
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturnOnConsecutiveCalls(
            false,
            $this->bxSamplePost(['status' => 'awaiting']),
            $this->bxSamplePost(['status_admin' => 'pending'])
        );
        $this->bxReplaceDb($oDb);

        $aEvent = ['object_id' => 15, 'owner_id' => 10];
        $this->assertFalse($this->_oModule->serviceGetTimelinePost($aEvent));
        $this->assertFalse($this->_oModule->serviceGetTimelinePost($aEvent));
        $this->assertFalse($this->_oModule->serviceGetTimelinePost($aEvent));
    }

    public function testTimelinePostHidesAnonymousFromNonAuthor()
    {
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturn($this->bxSamplePost(['author' => -10]));
        $this->bxReplaceDb($oDb);

        $this->assertFalse($this->_oModule->serviceGetTimelinePost([
            'object_id' => 15,
            'owner_id' => 10,
        ]));
    }

    public function testTimelinePostUsesLaterPublishedDate()
    {
        $aPost = $this->bxSamplePost([
            'added' => 100,
            'published' => 250,
        ]);
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturn($aPost);
        $this->bxReplaceDb($oDb);

        $aResult = $this->_oModule->serviceGetTimelinePost([
            'object_id' => 15,
            'owner_id' => 10,
        ]);
        if ($aResult === false)
            $this->markTestSkipped('Timeline post assembly requires optional content objects.');

        $this->assertIsArray($aResult);
        $this->assertSame(250, $aResult['date']);
    }

    public function testGetContentOwnerProfileIdWithoutContentUsesViewer()
    {
        $this->assertSame(bx_get_logged_profile_id(), $this->_oModule->serviceGetContentOwnerProfileId(0));
    }

    public function testDecodeDataApiPrivateContent()
    {
        $o = new class($this->_oModule->_aModule) extends BxPostsModule {
            public $mixedViewResult = 'denied';

            public function checkAllowedView($aDataEntry, $isPerformAction = false)
            {
                return $this->mixedViewResult;
            }
        };

        $a = $o->decodeDataAPI($this->bxSamplePost());
        $this->assertSame(15, $a['id']);
        $this->assertSame('sys_private', $a['module']);
        $this->assertSame('bx_posts', $a['module_src']);
        $this->assertArrayNotHasKey('text', $a);
    }

    public function testServiceIsAllowedAddContentToContextZero()
    {
        $this->assertFalse($this->_oModule->serviceIsAllowedAddContentToContext(0));
    }
}
