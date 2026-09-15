<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;

/**
 * Profile-module permission checks via Persons.
 */
#[AllowMockObjectsWithoutExpectations]
class BxPersonsModulePermissionsTest extends BxPersonsTestCase
{
    public function testCheckAllowedViewEmpty()
    {
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedView([]));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowedViewForProfile([]));
    }

    public function testCheckAllowedEditEmptyAndMissingProfile()
    {
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedEdit([]));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedEdit($this->bxSamplePerson()));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedChangeBadge([]));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedChangeCover($this->bxSamplePerson()));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedChangeSettings($this->bxSamplePerson()));
    }

    public function testCheckAllowedFriendsView()
    {
        $aPerson = $this->bxSamplePerson();
        $aEmpty = [];
        if ($this->_oModule->_oConfig->isFriends())
            $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedFriendsView($aPerson));
        else
            $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedFriendsView($aPerson));

        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedFriendsView($aEmpty));
    }

    public function testCheckAllowedFriendsWithoutViewerProfile()
    {
        $aPerson = $this->bxSamplePerson();
        $this->bxSetProtected($this->_oModule, '_iProfileId', 0, BxBaseModGeneralModule::class);
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedFriends($aPerson));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedFriendAdd($aPerson));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedFriendRemove($aPerson));
    }

    public function testCheckAllowedRelationsWhenDisabled()
    {
        if (BxDolConnectionRelation::isEnabled())
            $this->markTestSkipped('Relations are enabled on this install.');

        $aPerson = $this->bxSamplePerson();
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedRelations($aPerson));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedRelationAdd($aPerson));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedRelationRemove($aPerson));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedRelationsView($aPerson));
        $this->assertFalse($this->_oModule->serviceIsEnableRelations());
    }

    public function testCheckAllowedSubscriptionsViewEmpty()
    {
        $aEmpty = [];
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->checkAllowedSubscriptionsView($aEmpty));
    }

    public function testCheckMyselfMissingContent()
    {
        $this->assertFalse($this->_oModule->checkMyself(0));
        $this->assertFalse($this->_oModule->checkMyself(99999999));
    }

    public function testCheckAllowedConnectWithoutViewer()
    {
        $this->bxSetProtected($this->_oModule, '_iProfileId', 0, BxBaseModGeneralModule::class);
        $aPerson = $this->bxSamplePerson();
        $aArgs = [&$aPerson, false, 'sys_profiles_friends', false, false];
        $this->assertNotSame(
            CHECK_ACTION_RESULT_ALLOWED,
            $this->bxCallProtectedArgs($this->_oModule, '_checkAllowedConnect', $aArgs)
        );
    }

    public function testServiceCheckAllowedModuleActionInProfileWithoutRoles()
    {
        $this->assertNotSame(
            CHECK_ACTION_RESULT_ALLOWED,
            $this->_oModule->serviceCheckAllowedModuleActionInProfile(15, 'bx_posts', 'post')
        );
    }

    public function testServiceCheckAllowedWithContentMissing()
    {
        $oDb = $this->createMock(BxPersonsDb::class);
        $oDb->method('getContentInfoById')->willReturn(false);
        $this->bxReplaceDb($oDb);

        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowedProfileView(15));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckAllowedProfileContact(15));
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->_oModule->serviceCheckSpacePrivacy(15));
    }

    public function testGetProfileObjectMissingIsUndefined()
    {
        $o = $this->_oModule->getProfileObject(99999999);
        $this->assertInstanceOf(BxDolProfileUndefined::class, $o);
    }

    public function testIsAllowDeleteOrDisableSameModeratorPair()
    {
        $this->assertTrue($this->_oModule->isAllowDeleteOrDisable(0, 0));
    }

    public function testDecodeDataApiPrivateContent()
    {
        $o = new class($this->_oModule->_aModule) extends BxPersonsModule {
            public $mixedViewResult = 'denied';

            public function serviceCheckAllowedViewForProfile($aDataEntry, $isPerformAction = false, $iProfileId = false)
            {
                return $this->mixedViewResult;
            }
        };

        $a = $o->decodeDataAPI($this->bxSamplePerson());
        $this->assertSame(15, $a['id']);
        $this->assertSame('sys_private', $a['module']);
        $this->assertSame('bx_persons', $a['module_src']);
        $this->assertArrayNotHasKey('description', $a);
    }

    public function testPrivacyPartiallyVisible()
    {
        $o = BxDolPrivacy::getObjectInstance('bx_persons_allow_view_to');
        if (!$o)
            $this->markTestSkipped('bx_persons_allow_view_to privacy object is missing.');

        $this->assertTrue($o->isPartiallyVisible(BX_DOL_PG_FRIENDS));
        $this->assertFalse($o->isPartiallyVisible(BX_DOL_PG_ALL));
        $this->assertContains(BX_DOL_PG_FRIENDS, $o->getPartiallyVisiblePrivacyGroups());
    }

    public function testCustomPrivacyItemsRequireContentWhenActingAsProfile()
    {
        $o = BxDolPrivacy::getObjectInstance('bx_persons_allow_view_to');
        if (!$o)
            $this->markTestSkipped('bx_persons_allow_view_to privacy object is missing.');

        $mixedEmpty = $this->bxCallProtected($o, '_isSelectGroupCustomItems', ['content_id' => 0]);
        $this->assertNotTrue($mixedEmpty);

        $this->assertTrue($this->bxCallProtected($o, '_isSelectGroupCustomItems', ['content_id' => 15]));
    }

    public function testCheckAllowedViewCoverDelegatesToProfileImage()
    {
        $aPerson = ['id' => 15, 'allow_view_to' => BX_DOL_PG_ALL];
        $this->assertSame(
            $this->_oModule->checkAllowedViewProfileImage($aPerson),
            $this->_oModule->checkAllowedViewCoverImage($aPerson)
        );
    }
}
