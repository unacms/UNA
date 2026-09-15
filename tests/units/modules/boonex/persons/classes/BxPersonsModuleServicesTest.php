<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;

/**
 * Profile-module services and helpers via Persons.
 */
#[AllowMockObjectsWithoutExpectations]
class BxPersonsModuleServicesTest extends BxPersonsTestCase
{
    public function testSafeServicesIncludeProfileEndpoints()
    {
        $a = $this->_oModule->serviceGetSafeServices();

        foreach ([
            'ProfileUnitSafe',
            'ProfileUrl',
            'EntityCreate',
            'BrowseRecommended',
            'BrowseRecentProfiles',
            'BrowseActiveProfiles',
            'BrowseTopProfiles',
            'BrowseOnlineProfiles',
            'BrowseConnections',
            'BrowseByAcl',
        ] as $sName)
            $this->assertArrayHasKey($sName, $a);
    }

    public function testModuleSampleAndActAsProfile()
    {
        $this->assertNotEmpty($this->_oModule->serviceModuleSample());
        $this->assertTrue($this->_oModule->serviceActAsProfile());
        $this->assertSame(pow(2, BX_DOL_MODULE_SUBTYPE_PROFILE), $this->_oModule->getSubtypes());
        $this->assertSame(_t('_sys_ps_space_title_friend'), $this->_oModule->serviceGetSpaceTitle());
    }

    public function testGetOptionsRedirectAndActivation()
    {
        $aRedirect = $this->_oModule->serviceGetOptionsRedirectAfterAdd();
        $aKeys = array_column($aRedirect, 'key');
        $this->assertSame(
            [BX_DOL_PROFILE_REDIRECT_PROFILE, BX_DOL_PROFILE_REDIRECT_LAST, BX_DOL_PROFILE_REDIRECT_CUSTOM, BX_DOL_PROFILE_REDIRECT_HOMEPAGE],
            $aKeys
        );

        $aActivation = $this->_oModule->serviceGetOptionsActivation();
        $aActivationKeys = array_column($aActivation, 'key');
        $this->assertSame(
            [BX_DOL_PROFILE_ACTIVATE_ALWAYS, BX_DOL_PROFILE_ACTIVATE_NEVER, BX_DOL_PROFILE_ACTIVATE_ADD, BX_DOL_PROFILE_ACTIVATE_EDIT],
            $aActivationKeys
        );
    }

    public function testProfileNameCombinesLastName()
    {
        $this->assertSame('Ada Lovelace', $this->_oModule->getProfileName($this->bxSamplePerson()));
        $this->assertSame('Ada', $this->_oModule->getProfileName($this->bxSamplePerson(['last_name' => ''])));
    }

    public function testServiceProfileNameAndUrlMissing()
    {
        $this->assertFalse($this->_oModule->serviceProfileName(0));
        $this->assertFalse($this->_oModule->serviceProfileUrl(0));
        $this->assertFalse($this->_oModule->serviceProfileSettings(0));
        $this->assertFalse($this->_oModule->serviceHasImage(0));

        $oDb = $this->createMock(BxPersonsDb::class);
        $oDb->method('getContentInfoById')->willReturn(false);
        $this->bxReplaceDb($oDb);

        $this->assertFalse($this->_oModule->serviceProfileName(15));
        $this->assertFalse($this->_oModule->serviceProfileUrl(15));
        $this->assertFalse($this->_oModule->serviceHasImage(15));
        $this->assertFalse($this->_oModule->serviceProfileSettings(15));
    }

    public function testServiceHasImageFromPictureField()
    {
        $oDb = $this->createMock(BxPersonsDb::class);
        $oDb->method('getContentInfoById')->willReturnMap([
            [15, $this->bxSamplePerson(['picture' => 9])],
            [16, $this->bxSamplePerson(['id' => 16, 'picture' => 0])],
        ]);
        $this->bxReplaceDb($oDb);

        $this->assertTrue($this->_oModule->serviceHasImage(15));
        $this->assertFalse($this->_oModule->serviceHasImage(16));
    }

    public function testServiceProfileCreateAndEditUrl()
    {
        $sCreate = $this->_oModule->serviceProfileCreateUrl(false);
        $this->assertSame('page.php?i=create-persons-profile', $sCreate);

        $sCreateAbs = $this->_oModule->serviceProfileCreateUrl(true);
        $this->assertNotSame('', $sCreateAbs);
        $this->assertStringContainsString('create-persons-profile', $sCreateAbs);

        $sEdit = $this->_oModule->serviceProfileEditUrl(15);
        $this->assertNotSame('', $sEdit);
        $this->assertStringContainsString('edit-persons-profile', $sEdit);
    }

    public function testServicePrepareFieldsCopiesName()
    {
        $a = $this->_oModule->servicePrepareFields(['name' => 'Ada', 'description' => 'Bio']);

        $this->assertSame('Ada', $a['fullname']);
        $this->assertSame('Ada', $a['name']);
        $this->assertSame(BX_DOL_PG_ALL, $a['allow_view_to']);
        $this->assertSame(BX_DOL_PG_ALL, $a['allow_contact_to']);
        $this->assertSame(BX_DOL_PG_FRIENDS, $a['allow_post_to']);
    }

    public function testServicePrepareFieldsMap()
    {
        $a = $this->bxCallProtected(
            $this->_oModule,
            '_servicePrepareFields',
            ['name' => 'Ada', 'description' => 'Bio'],
            ['gender' => 'female'],
            ['fullname' => 'name', 'desc' => 'description']
        );

        $this->assertSame('Ada', $a['fullname']);
        $this->assertSame('Bio', $a['desc']);
        $this->assertSame('female', $a['gender']);
        $this->assertArrayNotHasKey('name', $a);
        $this->assertArrayNotHasKey('description', $a);
        $this->assertSame(BX_DOL_PG_FRIENDS, $a['allow_post_to']);
    }

    public function testFormsHelper()
    {
        $this->assertInstanceOf(BxPersonsFormsEntryHelper::class, $this->_oModule->getFormsHelper());
        $this->assertInstanceOf(BxPersonsFormsEntryHelper::class, $this->_oModule->serviceFormsHelper());
    }

    public function testBuildRssParamsConnections()
    {
        $this->assertSame([
            'object' => 'sys_profiles_friends',
            'type' => 'content',
            'profile' => 7,
            'mutual' => 1,
            'profile2' => 8,
        ], $this->bxCallProtected($this->_oModule, '_buildRssParams', 'connections', ['sys_profiles_friends', 'content', 7, 1, 8]));

        $this->assertSame([
            'object' => '',
            'type' => '',
            'profile' => 0,
            'mutual' => 0,
            'profile2' => 0,
        ], $this->bxCallProtected($this->_oModule, '_buildRssParams', 'connections', []));

        $this->assertSame([], $this->bxCallProtected($this->_oModule, '_buildRssParams', 'recent', [1]));
    }

    public function testNotificationsAndTimelineData()
    {
        $aNtfs = $this->_oModule->serviceGetNotificationsData();
        $this->assertContains('bx_persons_timeline_post_common', array_column($aNtfs['handlers'], 'group'));
        $this->assertContains('timeline_post_common', array_column($aNtfs['alerts'], 'action'));

        $aTl = $this->_oModule->serviceGetTimelineData();
        $aGroups = array_column($aTl['handlers'], 'group');
        $this->assertContains('bx_persons_profile_picture', $aGroups);
        $this->assertContains('bx_persons_profile_cover', $aGroups);
        $this->assertContains('profile_picture_changed', array_column($aTl['alerts'], 'action'));
        $this->assertContains('profile_cover_changed', array_column($aTl['alerts'], 'action'));
    }

    public function testNotificationsTimelinePostCommonMissingProfile()
    {
        $this->assertSame([], $this->_oModule->serviceGetNotificationsTimelinePostCommon(['object_id' => 99999999, 'subobject_id' => 1]));
    }

    public function testGetProfileByCurrentUrl()
    {
        $sPrevId = bx_get('id');
        $sPrevProfile = bx_get('profile_id');
        unset($_GET['id'], $_GET['profile_id'], $_POST['id'], $_POST['profile_id']);
        try {
            $this->assertFalse($this->_oModule->getProfileByCurrentUrl());
        } finally {
            if ($sPrevId === false)
                unset($_GET['id']);
            else
                $_GET['id'] = $sPrevId;
            if ($sPrevProfile === false)
                unset($_GET['profile_id']);
            else
                $_GET['profile_id'] = $sPrevProfile;
        }
    }

    public function testMenuItemTitleByConnection()
    {
        $this->assertFalse($this->_oModule->getMenuItemTitleByConnection('not_a_connection', 'add', 1, 2));

        $aFriends = $this->_oModule->getMenuItemTitleByConnection('sys_profiles_friends', '', 999999, 888888);
        $this->assertIsArray($aFriends);
        $this->assertArrayHasKey('add', $aFriends);
        $this->assertArrayHasKey('remove', $aFriends);
        $this->assertNotSame('', $aFriends['add']);
        $this->assertSame('', $aFriends['remove']);

        $sAdd = $this->_oModule->serviceGetMenuItemTitleByConnection('sys_profiles_friends', 'add', 999999, 888888);
        $this->assertIsString($sAdd);
        $this->assertNotSame('', $sAdd);

        $aSubs = $this->_oModule->getMenuItemTitleByConnection('sys_profiles_subscriptions', '', 999999, 888888);
        $this->assertIsArray($aSubs);
        $this->assertNotSame('', $aSubs['add']);
        $this->assertSame('', $aSubs['remove']);
    }

    public function testSearchableFieldsExtendedAddsOnlineAndPicture()
    {
        $a = $this->_oModule->serviceGetSearchableFieldsExtended();

        $this->assertArrayHasKey('online', $a);
        $this->assertSame('checkbox', $a['online']['type']);
        $this->assertArrayHasKey('picture', $a);
        $this->assertSame('>=', $a['picture']['search_operator']);
        $this->assertArrayNotHasKey('author', $a);
    }

    public function testGetSearchOptionsUnknownField()
    {
        $this->assertFalse($this->_oModule->serviceGetSearchOptions('not_a_field', 'text', 'like'));
    }

    public function testServiceGetMenuAddonManageTools()
    {
        $a = $this->_oModule->serviceGetMenuAddonManageTools();

        $this->assertArrayHasKey('counter1_value', $a);
        $this->assertArrayHasKey('counter2_value', $a);
        $this->assertArrayHasKey('counter3_value', $a);
        $this->assertIsNumeric($a['counter1_value']);
        $this->assertIsNumeric($a['counter3_value']);
    }

    public function testGetContentWithoutIds()
    {
        $sPrevId = bx_get('id');
        $sPrevProfile = bx_get('profile_id');
        unset($_GET['id'], $_GET['profile_id'], $_POST['id'], $_POST['profile_id']);
        try {
            $this->assertFalse($this->bxCallProtected($this->_oModule, '_getContent', 0));
        } finally {
            if ($sPrevId === false)
                unset($_GET['id']);
            else
                $_GET['id'] = $sPrevId;
            if ($sPrevProfile === false)
                unset($_GET['profile_id']);
            else
                $_GET['profile_id'] = $sPrevProfile;
        }
    }

    public function testAlertParamsIncludePrivacyView()
    {
        $a = $this->bxCallProtected($this->_oModule, '_alertParams', $this->bxSamplePerson(['allow_view_to' => 5]));
        $this->assertSame(5, $a['privacy_view']);
    }
}
