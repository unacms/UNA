<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Profile-module config as implemented by Persons (CNF, roles, friends, connections).
 */
class BxPersonsConfigTest extends BxPersonsTestCase
{
    public function testCnfKeysForProfileModule()
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $this->assertSame('bx_persons_data', $CNF['TABLE_ENTRIES']);
        $this->assertSame('id', $CNF['FIELD_ID']);
        $this->assertSame('author', $CNF['FIELD_AUTHOR']);
        $this->assertSame('fullname', $CNF['FIELD_NAME']);
        $this->assertSame('last_name', $CNF['FIELD_LAST_NAME']);
        $this->assertSame('fullname', $CNF['FIELD_TITLE']);
        $this->assertSame('description', $CNF['FIELD_TEXT']);
        $this->assertSame('picture', $CNF['FIELD_PICTURE']);
        $this->assertSame('cover', $CNF['FIELD_COVER']);
        $this->assertSame('cover_data', $CNF['FIELD_COVER_POSITION']);
        $this->assertSame('badge', $CNF['FIELD_BADGE']);
        $this->assertSame('badge_link', $CNF['FIELD_BADGE_LINK']);
        $this->assertSame('allow_view_to', $CNF['FIELD_ALLOW_VIEW_TO']);
        $this->assertSame('allow_post_to', $CNF['FIELD_ALLOW_POST_TO']);
        $this->assertSame('allow_contact_to', $CNF['FIELD_ALLOW_CONTACT_TO']);
        $this->assertSame(['fullname', 'last_name'], $CNF['FIELDS_QUICK_SEARCH']);
        $this->assertSame('view-persons-profile', $CNF['URI_VIEW_ENTRY']);
        $this->assertSame('create-persons-profile', $CNF['URI_ADD_ENTRY']);
        $this->assertSame('edit-persons-profile', $CNF['URI_EDIT_ENTRY']);
        $this->assertSame('persons-profile-friends', $CNF['URI_VIEW_FRIENDS']);
        $this->assertTrue($CNF['BADGES_AVALIABLE']);
    }

    public function testPrefixesAndJsObjects()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertSame('BxPersonsManageTools', $oConfig->getJsClass('manage_tools'));
        $this->assertSame('oBxPersonsManageTools', $oConfig->getJsObject('manage_tools'));
        $this->assertSame('bx_persons_common', $oConfig->getGridObject('common'));
        $this->assertSame('bx_persons_administration', $oConfig->getGridObject('administration'));
        $this->assertSame('', $oConfig->getGridObject('missing'));
    }

    public function testFriendsFlagMatchesParam()
    {
        $sKey = $this->_oModule->_oConfig->CNF['PARAM_FRIENDS'];
        $this->assertSame(getParam($sKey) == 'on', $this->_oModule->_oConfig->isFriends());
        $this->assertSame($this->_oModule->_oConfig->isFriends(), $this->_oModule->serviceIsEnableFriends());
    }

    public function testRolesDisabledWithoutPreList()
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertArrayNotHasKey('OBJECT_PRE_LIST_ROLES', $oConfig->CNF);
        $this->assertFalse($oConfig->isRoles());
        $this->assertFalse($oConfig->isMultiRoles());
        $this->assertFalse($oConfig->getRoles());
    }

    #[DataProvider('providerForRoleId')]
    public function testRoleIdConversion($iId, $sId)
    {
        $oConfig = $this->_oModule->_oConfig;

        $this->assertSame($sId, $oConfig->roleIdI2S($iId));
        $this->assertSame($iId, $oConfig->roleIdS2I($sId));
    }

    static public function providerForRoleId()
    {
        return [
            [1, 'r1'],
            [12, 'r12'],
            [0, 'r0'],
        ];
    }

    public function testConnectionToFunctionCheck()
    {
        $a = $this->_oModule->_oConfig->getConnectionToFunctionCheck();

        $this->assertSame('checkAllowedFriends', $a['sys_profiles_friends']['friends']);
        $this->assertSame('checkAllowedFriendAdd', $a['sys_profiles_friends']['add']);
        $this->assertSame('checkAllowedFriendRemove', $a['sys_profiles_friends']['remove']);
        $this->assertSame('checkAllowedSubscriptions', $a['sys_profiles_subscriptions']['subscriptions']);
        $this->assertSame('checkAllowedSubscribeAdd', $a['sys_profiles_subscriptions']['add']);
        $this->assertSame('checkAllowedSubscribeRemove', $a['sys_profiles_subscriptions']['remove']);
    }

    public function testMenuItemToMethodIncludesProfileActions()
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $this->assertSame('checkAllowedView', $CNF['MENU_ITEM_TO_METHOD']['bx_persons_view_actions']['view-persons-profile']);
        $this->assertSame('checkAllowedEdit', $CNF['MENU_ITEM_TO_METHOD']['bx_persons_view_actions']['edit-persons-profile']);
        $this->assertSame('checkAllowedChangeCover', $CNF['MENU_ITEM_TO_METHOD']['bx_persons_view_actions']['edit-persons-cover']);
        $this->assertSame('checkAllowedFriendsView', $CNF['MENU_ITEM_TO_METHOD']['bx_persons_view_submenu']['persons-profile-friends']);
    }

    #[DataProvider('providerForEntryUri')]
    public function testGetEntryUri($sAction, $sUri)
    {
        $this->assertSame($sUri, $this->_oModule->_oConfig->getEntryUri($sAction));
    }

    static public function providerForEntryUri()
    {
        return [
            ['view', 'view-persons-profile'],
            ['add', 'create-persons-profile'],
            ['edit', 'edit-persons-profile'],
            ['missing', ''],
        ];
    }
}
