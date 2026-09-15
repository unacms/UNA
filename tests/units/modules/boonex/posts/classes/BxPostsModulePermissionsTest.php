<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Content-module permission and status checks via Posts.
 */
#[AllowMockObjectsWithoutExpectations]
class BxPostsModulePermissionsTest extends BxPostsTestCase
{
    #[DataProvider('providerForEntryAuthor')]
    public function testIsEntryAuthor($iAuthor, $iViewer, $bOut)
    {
        $aPost = $this->bxSamplePost(['author' => $iAuthor]);
        $this->assertSame($bOut, $this->_oModule->isEntryAuthor($aPost, $iViewer));
    }

    static public function providerForEntryAuthor()
    {
        return [
            [10, 10, true],
            [-10, 10, true],
            [10, 11, false],
            [0, 10, false],
        ];
    }

    public function testIsEntryActiveForAuthorIgnoresStatus()
    {
        $iViewer = (int)bx_get_logged_profile_id();
        $aPost = $this->bxSamplePost([
            'author' => $iViewer,
            'status' => 'hidden',
            'status_admin' => 'pending',
        ]);

        $this->assertTrue($this->_oModule->isEntryActive($aPost));
    }

    public function testIsEntryActiveHiddenForStranger()
    {
        if ($this->_oModule->_isModerator())
            $this->markTestSkipped('Moderator always sees hidden entries.');

        $aPost = $this->bxSamplePost(['author' => 10, 'status' => 'hidden']);
        if ($this->_oModule->isEntryAuthor($aPost, (int)bx_get_logged_profile_id()))
            $this->markTestSkipped('Logged profile is the sample author.');

        $this->assertFalse($this->_oModule->isEntryActive($aPost));
    }

    public function testIsEntryActivePendingAdminForStranger()
    {
        if ($this->_oModule->_isModerator())
            $this->markTestSkipped('Moderator always sees hidden entries.');
        $aPost = $this->bxSamplePost(['author' => 10, 'status_admin' => 'pending']);
        if ($this->_oModule->isEntryAuthor($aPost, (int)bx_get_logged_profile_id()))
            $this->markTestSkipped('Logged profile is the sample author.');

        $this->assertFalse($this->_oModule->isEntryActive($aPost));
    }

    public function testIsEntryActiveWhenPublished()
    {
        $this->assertTrue($this->_oModule->isEntryActive($this->bxSamplePost(['author' => 10])));
    }

    public function testCheckAllowedApproveRejectsEmptyAndNonPending()
    {
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedApprove([]));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedApprove($this->bxSamplePost()));
        $this->assertFalse($this->_oModule->isAllowedApprove($this->bxSamplePost()));
    }

    public function testCheckAllowedApprovePendingWithoutModerator()
    {
        $this->bxSetProtected($this->_oModule, '_iProfileId', 99, BxBaseModGeneralModule::class);
        $aPost = $this->bxSamplePost(['status_admin' => BX_BASE_MOD_GENERAL_STATUS_PENDING]);

        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedApprove($aPost));
    }

    public function testCheckAllowedEditAllowsAuthor()
    {
        $this->bxSetProtected($this->_oModule, '_iProfileId', 10, BxBaseModGeneralModule::class);
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedEdit($this->bxSamplePost()));
    }

    public function testCheckAllowedEditDeniesStranger()
    {
        $this->bxSetProtected($this->_oModule, '_iProfileId', 99, BxBaseModGeneralModule::class);
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedEdit($this->bxSamplePost()));
    }

    public function testCheckAllowedBrowseDefaultAllowed()
    {
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedBrowse());
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowed('Browse'));
    }

    public function testServiceCheckAllowedUnknownAction()
    {
        $s = $this->_oModule->serviceCheckAllowed('No Such Action');
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $s);
        $this->assertNotEmpty($s);
    }

    public function testCommentsDisabledShortCircuit()
    {
        $aPost = $this->bxSamplePost(['allow_comments' => 0]);
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturn($aPost);
        $this->bxReplaceDb($oDb);

        $this->assertFalse($this->_oModule->serviceCheckAllowedCommentsPost(15, 'bx_posts'));
        $this->assertFalse($this->_oModule->serviceCheckAllowedCommentsView(15, 'bx_posts'));
    }

    public function testCommentsAllowedForNegativeReportId()
    {
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturn(false);
        $this->bxReplaceDb($oDb);

        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowedCommentsPost(-12, 'bx_posts'));
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowedCommentsView(-12, 'bx_posts'));
    }

    public function testServiceIsActive()
    {
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturnMap([
            [1, $this->bxSamplePost()],
            [2, $this->bxSamplePost(['status' => 'hidden'])],
            [3, $this->bxSamplePost(['status_admin' => 'pending'])],
            [4, false],
        ]);
        $this->bxReplaceDb($oDb);

        $this->assertTrue($this->_oModule->serviceIsActive(1));
        $this->assertFalse($this->_oModule->serviceIsActive(2));
        $this->assertFalse($this->_oModule->serviceIsActive(3));
        $this->assertFalse($this->_oModule->serviceIsActive(4));
    }

    public function testServiceCheckAllowedWithContentMissing()
    {
        $oDb = $this->createMock(BxPostsDb::class);
        $oDb->method('getContentInfoById')->willReturn(false);
        $this->bxReplaceDb($oDb);

        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowedWithContent('View', 15));
    }
}
